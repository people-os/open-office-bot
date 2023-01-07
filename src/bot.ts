import { Zulip, Message } from './zulip';
import meet from './google-meet';
import * as names from './names';
import config from './config';

const { bot: bConfig, zulip: zConfig, meet: gConfig } = config;

async function run() {
	const BOT_NAME = zConfig.profile.name || `✨✨ ${names.random()} ✨✨`;

	// Create an interface to Zulip
	const zulipClient = new Zulip(zConfig.auth, {
		name: BOT_NAME,
		status: zConfig.profile.status || 'Initializing...',
		presence: zConfig.profile.status ? 'active' : 'idle',
	});

	// Create an interface to google meet
	const meetSession = await meet(gConfig.auth);

	// Create a meeting we can interact with
	await meetSession.createMeeting();

	// Initialize Zulip client (login and sync profile)
	await zulipClient.init();

	zulipClient.on('message', async (message: Message) => {
		if (
			message.data.type !== 'private' &&
			!message.data.content.includes(`@**${BOT_NAME}**`)
		) {
			// Only respond to private messages, or messages in topics that mention me
			return;
		}
		if (meetSession.link()) {
			await message.respond(`Join the call at: ${meetSession.link()}`);
		} else {
			await message.respond(
				`I don't have a meeting link to provide. Contact my boss.`,
			);
		}
	});

	setInterval(async () => {
		const participants = await meetSession.participants();
		if (zulipClient.profile.status !== participants) {
			zulipClient.setStatus(participants);
		}
	}, bConfig.statusInterval);
}

run();
