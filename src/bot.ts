import { Zulip, Message } from './zulip';
import meet from './google-meet';
import config from './config';
import * as log from './logger';

const { bot: bConfig, zulip: zConfig, meet: gConfig } = config;

const botMessage = (meetUrl: string) => `
Hello friends, I'm your friendly neighborhood open office bot. My purpose is to provide a space to connect, collaborate, and work in the open.

Visit your peers at ${meetUrl}, or ask what I can do by pinging or PM-ing me with "\`help\`".
`;

export default class Bot {
	private interval!: NodeJS.Timeout;
	private zulipClient!: Zulip;
	private meetSession!: Awaited<ReturnType<typeof meet>>;
	private participantsUpdatedAt: number = -Infinity;

	constructor() {
		this.run();
	}

	public async run() {
		// Create an interface to Zulip
		this.zulipClient = new Zulip(zConfig.config, {
			...zConfig.profile,
			presence: zConfig.profile.status ? 'active' : 'idle',
		});

		// Create an interface to google meet
		this.meetSession = await meet(gConfig.auth);

		// Initialize Zulip client (login and sync profile)
		await this.zulipClient.init();

		// Create bot welcome message in Zulip client
		await this.zulipClient.createTopic(
			zConfig.config.streamName,
			zConfig.profile.name,
			botMessage(gConfig.auth.meetUrl),
		);

		this.zulipClient.on('message', async (message: Message) => {
			if (
				message.data.type !== 'private' &&
				!message.data.content.includes(`@**${zConfig.profile.name}**`)
			) {
				// Only respond to private messages, or messages in topics that mention me
				return;
			}
			if (this.meetSession.link()) {
				await message.respond(botMessage(this.meetSession.link()));
			} else {
				await message.respond(
					`I don't have a meeting link to provide. Contact my boss.`,
				);
			}
		});

		// Periodically check participants
		this.interval = setInterval(
			this.checkParticipants.bind(this),
			bConfig.statusInterval,
		);

		// Check participants right away
		await this.checkParticipants();

		log.info('Bot state settled');
	}

	public async stop() {
		if (this.interval) {
			clearInterval(this.interval);
		}
		if (this.zulipClient) {
			// Set status to something that's not "X people in call"
			await this.zulipClient.offline();
		}
		if (this.meetSession) {
			// Close browser to stop any more meet page visits
			await this.meetSession.teardown();
		}
	}

	public hasErrors(): false | Error {
		function within(timestamp: number, threshold: number) {
			const currentTime = new Date().getTime();
			const timeDifference = currentTime - timestamp;
			return timeDifference <= threshold;
		}

		// Add a 15 second buffer because loading the page is slow
		if (!within(this.participantsUpdatedAt, bConfig.statusInterval - 15000)) {
			return new Error('Bot is not communicating with Google Meets');
		} else if (
			// Add a 5 second buffer
			!within(
				this.zulipClient.presenceUpdatedAt,
				zConfig.presenceInterval - 5000,
			)
		) {
			return new Error('Bot is not communicating with Zulip');
		}

		return false;
	}

	private async checkParticipants() {
		const count = await this.meetSession.participants();
		const status = `${count} ${
			count === 1 ? 'person is' : 'people are'
		} in this call`;
		if (this.zulipClient.profile.status !== status) {
			await this.zulipClient.setStatus(status);
		}
		this.participantsUpdatedAt = new Date().getTime();
	}
}
