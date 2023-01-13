import { Zulip, Message } from './zulip';
import meet from './google-meet';
import config from './config';
import * as log from './logger';

const { bot: bConfig, zulip: zConfig, meet: gConfig } = config;

const botMessage = (meetUrl: string) => `
Hello friends, I'm your friendly neighborhood open office bot. My purpose is to provide a space to connect, collaborate, and work in the open.

Visit your peers at ${meetUrl}, or ask what I can do by pinging or PM-ing me with "\`help\`".
`;

class Bot {
	private interval!: NodeJS.Timeout;
	private zulipClient!: Zulip;
	private meetSession!: Awaited<ReturnType<typeof meet>>;
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

		this.interval = setInterval(async () => {
			const count = await this.meetSession.participants();
			const status = `${count} ${
				count === 1 ? 'person is' : 'people are'
			} in this call`;
			if (this.zulipClient.profile.status !== status) {
				await this.zulipClient.setStatus(status);
			}
		}, bConfig.statusInterval);

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
}

const bot = new Bot();
// This listener won't exit the bot gracefully if process.exit() is called explicitly
// elsewhere in the code, or if there's an uncaught exception, but otherwise it'll allow
// an async function to run before exiting (which must be called manually).
process.on('beforeExit', async () => {
	await bot.stop();
	process.exit(0);
});
