// @ts-ignore zulip-js does not have any types
import * as zulip from 'zulip-js';

const PRESENCE_TICK = 140000;

type Config = { username: string; password: string; realm: string };
type Presence = 'active' | 'idle' | 'offline';

type Profile = {
	name: string;
	status: string;
	presence: Presence;
};

export default class Zulip {
	client: any | null;
	config: Config;
	heartbeat: NodeJS.Timer | null;

	constructor(config: Config) {
		this.client = null;
		this.config = config;
		this.heartbeat = null;
	}

	public async init(profile: Partial<Profile> = {}) {
		this.client = await zulip(this.config);
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
		log('info', `${method} ${endpoint} ${JSON.stringify(params)}`);
		return this.client.callEndpoint(endpoint, method, params);
	}

	private clearHeartbeat() {
		if (this.heartbeat) {
			clearInterval(this.heartbeat);
		}
	}
}

function log(level: string, value: string) {
	const currentDate = new Date();
	const hours = currentDate.getUTCHours().toString().padStart(2, '0');
	const minutes = currentDate.getUTCMinutes().toString().padStart(2, '0');
	const seconds = currentDate.getUTCSeconds().toString().padStart(2, '0');
	console.log(
		`[${level.toUpperCase()}] ${hours}:${minutes}:${seconds} ${value} `,
	);
}
