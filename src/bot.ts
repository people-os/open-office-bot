import { Zulip, Message } from './zulip';
import * as names from './names';
import config from './config';

const { zulip: zConfig } = config;

async function run() {
	const BOT_NAME = zConfig.profile.name || `✨✨ ${names.random()} ✨✨`;

	const zulipClient = new Zulip(zConfig.auth, {
		name: BOT_NAME,
		status: zConfig.profile.status || 'Initializing...',
		presence: zConfig.profile.status ? 'active' : 'idle',
	});

	await zulipClient.init();

	zulipClient.on('message', async (message: Message) => {
		if (
			message.data.type !== 'private' &&
			!message.data.content.includes(`@**${BOT_NAME}**`)
		) {
			// Only respond to private messages, or messages in topics that mention me
			return;
		}
		await message.respond(`Why did you send me: ${message.data.content}`);
	});
}

run();
