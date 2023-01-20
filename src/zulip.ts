import { EventEmitter } from 'events';

// @ts-ignore zulip-js does not have any types
import zulip from 'zulip-js';
import * as log from './logger';

const PRESENCE_TICK = 140000;

type Config = {
	username: string;
	apiKey: string;
	realm: string;
	streamName: string;
};
type Presence = 'active' | 'idle' | 'offline';

type Profile = {
	name: string;
	status: string;
	presence: Presence;
};

export class Zulip extends EventEmitter {
	private client: any | null;
	private config: Config;
	private heartbeat: NodeJS.Timer | null;
	public profile: Profile;

	constructor(config: Config, profile: Profile) {
		super();
		this.client = null;
		this.config = config;
		this.heartbeat = null;
		this.profile = profile;
	}

	public async init() {
		try {
			this.client = await zulip(this.config);
		} catch (e: unknown) {
			log.error(
				`Error authenticating with zulip client: ${
					(e as Error).message
				}. Check your environment username and API key configurations.`,
			);
			process.exit(1);
		}
		this.client.callOnEachEvent(
			(event: any) => {
				if (
					event.type !== 'message' ||
					event.message.sender_email === this.config.username
				) {
					return;
				}
				this.emit('message', new Message(this.client, event.message));
			},
			['message'],
		);

		await this.syncProfile(this.profile);
	}

	public async active() {
		await this.setInvisible(false);
		await this.persistPresence('active');
		this.profile.presence = 'active';
	}

	public async idle() {
		await this.setInvisible(false);
		await this.persistPresence('idle');
		this.profile.presence = 'idle';
	}

	public async offline() {
		this.clearHeartbeat();
		await this.setInvisible(true);
		await this.setStatus('Sleeping');
		this.profile.presence = 'offline';
	}

	public async setName(name: string) {
		const params = {
			full_name: name,
			method: 'PATCH',
		};
		await this.request('/settings', 'POST', params);
		this.profile.name = name;
	}

	public async setStatus(status: string) {
		const params = {
			status_text: status,
		};
		await this.request('/users/me/status', 'POST', params);
		this.profile.status = status;
	}

	private async syncProfile(profile: Partial<Profile>) {
		if (profile.name) {
			await this.setName(profile.name);
		}
		if (profile.status) {
			await this.setStatus(profile.status);
		}
		switch (profile.presence) {
			case 'active':
				return this.active();
			case 'idle':
				return this.idle();
			case 'offline':
				return this.offline();
			default:
				return;
		}
	}

	private async setInvisible(invisible: boolean) {
		const params = {
			presence_enabled: !invisible ? 'true' : 'false',
			method: 'PATCH',
		};
		return this.request('/settings', 'POST', params);
	}

	private async setPresence(presence: Presence) {
		const params = {
			status: presence,
			ping_only: 'false',
			new_user_input: 'false',
			slim_presence: 'true',
		};
		return this.request('/users/me/presence', 'POST', params);
	}

	private async persistPresence(status: Presence) {
		this.clearHeartbeat();
		this.heartbeat = setInterval(async () => {
			await this.setPresence(status);
		}, PRESENCE_TICK - 5000);
		return this.setPresence(status);
	}

	private async request(endpoint: string, method: string, params: {}) {
		if (!this.client) {
			throw new Error('Zulip client has not been initilzied yet!');
		}
		log.debug(`${method} ${endpoint} ${JSON.stringify(params)}`);
		return this.client.callEndpoint(endpoint, method, params);
	}

	private clearHeartbeat() {
		if (this.heartbeat) {
			clearInterval(this.heartbeat);
		}
	}

	private async getStreamId(name: string) {
		const { result, msg, streams } = await this.client.streams.retrieve();
		if (result !== 'success') {
			log.error(`Error getting Zulip streams: ${msg}`);
			return;
		}
		const streamList = streams.filter(
			({ name: n }: { name: string }) => n === name,
		);
		if (!streamList.length) {
			log.error(`Stream with name ${name} doesn't exist`);
			return;
		}
		return streamList[0].stream_id;
	}

	public async createTopic(stream: string, topic: string, message: string) {
		const streamId = await this.getStreamId(stream);
		if (!streamId) {
			return;
		}
		const { result, msg, topics } = await this.client.streams.topics.retrieve({
			stream_id: streamId,
		});
		if (result !== 'success') {
			log.error(`Error getting topics for stream: ${msg}`);
			return;
		}
		const topicList = topics.filter(
			({ name }: { name: string }) => name === topic,
		);
		if (!topicList.length) {
			// Create a topic as it doesn't exist
			log.info('Creating topic for bot...');
			await this.client.messages.send({
				to: streamId,
				type: 'stream',
				topic,
				content: message,
			});
		} else {
			log.info('Topic for stream already exists, skipping...');
		}
	}
}

export class Message {
	public data: MessageMetadata;
	private client: any;

	constructor(client: any, data: MessageMetadata) {
		this.data = data;
		this.client = client;
	}

	async respond(content: string) {
		log.debug(
			`Sent message { to: ${this.data.sender_email}, type: ${this.data.type}, subject: ${this.data.subject}, contentLength: ${content.length}}`,
		);
		return this.client.messages.send({
			to:
				this.data.type === 'private'
					? this.data.sender_email
					: this.data.display_recipient,
			type: this.data.type,
			subject: this.data.subject,
			content,
		});
	}
}

export type MessageMetadata = {
	id: number;
	sender_id: number;
	content: string;
	recipient_id: number;
	timestamp: number;
	client: string;
	subject: string;
	topic_links: [];
	is_me_message: boolean;
	reactions: [];
	submessages: [];
	sender_full_name: string;
	sender_email: string;
	sender_realm_str: string;
	display_recipient: [
		{ id: number; email: string; full_name: string; is_mirror_dummy: boolean },
	];
	type: 'private' | 'stream';
	avatar_url: null;
	content_type: string;
};
