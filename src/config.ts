export default {
	bot: {
		statusInterval: 60 * 1000,
	},
	zulip: {
		config: {
			username: process.env.ZULIP_USERNAME || '',
			apiKey: process.env.ZULIP_API_KEY || '',
			realm: process.env.ZULIP_REALM || '',
			streamName: process.env.ZULIP_STREAM || 'Meeting Room',
		},
		profile: {
			name: process.env.ZULIP_NAME || '👀👀 Example Bot 👀👀',
			status: process.env.DEFAULT_STATUS || 'Initializing...',
		},
	},
	meet: {
		auth: {
			username: process.env.GOOGLE_USERNAME || '',
			password: process.env.GOOGLE_PASSWORD || '',
			totpSecret: process.env.GOOGLE_TOTP_SECRET || '',
			meetUrl: process.env.GOOGLE_MEET || '',
		},
	},
	puppeteer: {
		executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium-browser',
	},
};
