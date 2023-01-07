export default {
	bot: {
		statusInterval: 10000,
	},
	zulip: {
		auth: {
			username: process.env.ZULIP_USERNAME || '',
			password: process.env.ZULIP_PASSWORD || '',
			realm: process.env.ZULIP_REALM || '',
		},
		profile: {
			name: process.env.DEFAULT_NAME || '',
			status: process.env.DEFAULT_STATUS || '',
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
		executablePath: process.env.CHROMIUM_BIN || '',
	},
};
