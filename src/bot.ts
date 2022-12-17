import zulip from './zulip';
import * as names from './names';

const CONFIG = {
	username: process.env.ZULIP_USERNAME || '',
	password: process.env.ZULIP_PASSWORD || '',
	realm: process.env.ZULIP_REALM || '',
};

async function run() {
	const zulipClient = new zulip(CONFIG);

	await zulipClient.init({
		name: process.env.DEFAULT_NAME || `✨✨ ${names.random()} ✨✨`,
		status: process.env.DEFAULT_STATUS || 'Initializing...',
		presence: process.env.DEFAULT_STATUS ? 'active' : 'idle',
	});
}

run();
