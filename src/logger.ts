const INFO_COLOUR = '\x1b[36m';
const WARN_COLOUR = '\x1b[33m';
const ERROR_COLOUR = '\x1b[31m';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export function info(message: string) {
	return log('INFO', message);
}

export function warn(message: string) {
	return log('WARN', message);
}

export function error(message: string) {
	return log('ERROR', message);
}

function log(level: LogLevel, message: string) {
	// Get the current time in HH:MM:SS format (UTC)
	const currentTime = new Date().toUTCString().split(' ')[4];
	let prefix = '';
	switch (level) {
		case 'INFO':
			prefix = `[${INFO_COLOUR}INFO\x1b[0m] ${currentTime}`;
			break;
		case 'WARN':
			prefix = `[${WARN_COLOUR}WARN\x1b[0m] ${currentTime}`;
			break;
		case 'ERROR':
			prefix = `[${ERROR_COLOUR}ERROR\x1b[0m] ${currentTime}`;
			break;
	}
	// Log the formatted message to the console
	console.log(`${prefix} - ${message}`);
}
