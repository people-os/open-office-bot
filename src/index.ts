import Bot from './bot';
import * as healthcheck from './healthcheck';

const bot = new Bot();

// Watch bot so we can respond to /healthcheck HTTP requests
healthcheck.watch(bot);

// This listener won't exit the bot gracefully if process.exit() is called explicitly
// elsewhere in the code, or if there's an uncaught exception, but otherwise it'll allow
// an async function to run before exiting (which must be called manually).
process.on('beforeExit', async () => {
	await bot.stop();
	healthcheck.stop();
	process.exit(0);
});
