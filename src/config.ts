export default {
	zulip: {
		auth: {
			username: process.env.ZULIP_USERNAME || '',
			password: process.env.ZULIP_PASSWORD || '',
			realm: process.env.ZULIP_REALM || '',
		},
		profile: {
			name: process.env.DEFAULT_NAME || '',
			status: process.env.DEFAULT_STATUS || '',
			presence: process.env.DEFAULT_STATUS || '',
		},
	},
};
