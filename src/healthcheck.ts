import http from 'http';

import config from './config';
import Bot from './bot';
import * as log from './logger';

let server: http.Server | null = null;

export function watch(bot: Bot) {
	server = startHTTP((_req, res) => {
		const botHealth = bot.hasErrors();
		if (botHealth instanceof Error) {
			res.statusCode = 503;
			res.end(botHealth.message);
			log.error(botHealth.message);
		} else {
			res.statusCode = 200;
			res.end('OK');
		}
	});
}

export function stop() {
	if (server) {
		server.close();
	}
}

function startHTTP(
	cb: (req: http.IncomingMessage, res: http.ServerResponse) => void,
) {
	const httpServer = http.createServer((req, res) => {
		if (req.method === 'GET' && req.url === '/healthcheck') {
			cb(req, res);
		} else {
			res.statusCode = 404;
			res.end('Not found');
		}
	});

	httpServer.listen(config.healthcheck.port, () => {
		log.info(`Server running at http://localhost:${config.healthcheck.port}`);
	});

	return httpServer;
}
