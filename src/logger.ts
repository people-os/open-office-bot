const INFO_COLOUR = '\x1b[36m'; // cyan
const WARN_COLOUR = '\x1b[33m'; // yellow
const DEBUG_COLOUR = '\x1b[35m'; // purple
const ERROR_COLOUR = '\x1b[31m'; // red

type LogLevel = 'INFO' | 'WARN' | 'DEBUG' | 'ERROR';

const isProd = process.env.PRODUCTION === '1';

export function info(message: string) {
	return log('INFO', message);
}

export function warn(message: string) {
	return log('WARN', message);
}

export function debug(message: string) {
	return log('DEBUG', message);
}

export function error(message: string) {
	return log('ERROR', message);
}

function log(level: LogLevel, message: string) {
	// Get the current time in HH:MM:SS format (UTC)
	const currentTime = new Date().toUTCString().split(' ')[4];
	switch (level) {
		case 'INFO':
			console.log(`[${INFO_COLOUR}INFO\x1b[0m] ${currentTime} - ${message}`);
			break;
		case 'WARN':
			console.warn(`[${WARN_COLOUR}WARN\x1b[0m] ${currentTime} - ${message}`);
			break;
		case 'DEBUG':
			if (!isProd) {
				console.debug(
					`[${DEBUG_COLOUR}DEBUG\x1b[0m] ${currentTime} - ${message}`,
				);
			}
			break;
		case 'ERROR':
			console.error(
				`[${ERROR_COLOUR}ERROR\x1b[0m] ${currentTime} - ${message}`,
			);
			break;
	}
}
