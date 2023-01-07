import { Zulip, Message } from './zulip';
import meet from './google-meet';
import config from './config';

const { bot: bConfig, zulip: zConfig, meet: gConfig } = config;

async function run() {
	// Create an interface to Zulip
	const zulipClient = new Zulip(zConfig.auth, {
		name: zConfig.profile.name,
		status: zConfig.profile.status || 'Initializing...',
		presence: zConfig.profile.status ? 'active' : 'idle',
	});

	// Create an interface to google meet
	const meetSession = await meet(gConfig.auth);

	// Initialize Zulip client (login and sync profile)
	await zulipClient.init();

	zulipClient.on('message', async (message: Message) => {
		if (
			message.data.type !== 'private' &&
			!message.data.content.includes(`@**${zConfig.profile.name}**`)
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
