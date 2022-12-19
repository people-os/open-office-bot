import { EventEmitter } from 'events';

// @ts-ignore zulip-js does not have any types
import * as zulip from 'zulip-js';
import * as log from './logger';

const PRESENCE_TICK = 140000;

type Config = { username: string; password: string; realm: string };
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

	constructor(config: Config) {
		super();
		this.client = null;
		this.config = config;
		this.heartbeat = null;
	}

	public async init(profile: Partial<Profile> = {}) {
		this.client = await zulip(this.config);
		this.client.callOnEachEvent(
			(event: any) => {
				if (event.type !== 'message') {
					return;
				}
				this.emit('message', event.message);
			},
			['message'],
		);

		if (profile == null) {
			return;
		}
		if (profile.name) {
			await this.setName(profile.name);
		}
		if (profile.status) {
			await this.setStatus(profile.status);
		}
		if (profile.presence) {
			switch (profile.presence) {
				case 'active':
					return this.active();
				case 'idle':
					return this.idle();
				case 'offline':
					return this.offline();
			}
		}
	}

	public async active() {
		await this.setInvisible(false);
		return this.persistPresence('active');
	}

	public async idle() {
		await this.setInvisible(false);
		return this.persistPresence('idle');
	}

	public async offline() {
		this.clearHeartbeat();
		return this.setInvisible(true);
	}

	public async setName(name: string) {
		const params = {
			full_name: name,
			method: 'PATCH',
		};
		return this.request('/settings', 'POST', params);
	}

	public async setStatus(status: string) {
		const params = {
			status_text: status,
		};
		return this.request('/users/me/status', 'POST', params);
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
		log.info(`${method} ${endpoint} ${JSON.stringify(params)}`);
		return this.client.callEndpoint(endpoint, method, params);
	}

	private clearHeartbeat() {
		if (this.heartbeat) {
			clearInterval(this.heartbeat);
		}
	}
}

export type Message = {
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
