import { Zulip, Message } from './zulip';
import * as names from './names';
import config from './config';
import * as log from './logger';

const { zulip: zConfig } = config;

async function run() {
	const zulipClient = new Zulip(zConfig.auth);

	await zulipClient.init({
		name: zConfig.profile.name || `✨✨ ${names.random()} ✨✨`,
		status: zConfig.profile.status || 'Initializing...',
		presence: zConfig.profile.status ? 'active' : 'idle',
	});

	zulipClient.on('message', (message: Message) => {
		log.info(`You got mail: ${message.content}`);
	});
}

run();
