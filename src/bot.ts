import zulip from './zulip';
import * as names from './names';
import config from './config';

const { zulip: zConfig } = config;

async function run() {
	const zulipClient = new zulip(zConfig.auth);

	await zulipClient.init({
		name: zConfig.profile.name || `✨✨ ${names.random()} ✨✨`,
		status: zConfig.profile.status || 'Initializing...',
		presence: zConfig.profile.status ? 'active' : 'idle',
	});
}

run();
