import { Browser } from 'puppeteer';
// @ts-ignore does not have any types
import totp from 'totp-generator';

import { newBrowser, newPage, clickElement, getText } from './browser';
import * as log from './logger';

type Config = {
	username: string;
	password: string;
	totpSecret: string;
	meetUrl: string;
};

function parseCountFromStatus(status: string): number {
	if (!/in\sthis\scall/.test(status)) {
		return 0;
	}
	if (/is\sin\sthis\scall/.test(status)) {
		return 1;
	}
	const names = status
		.replace(/\sare\sin\sthis\scall/, '')
		.split(/,\s|\sand\s/);
	const moreMatch = names[names.length - 1].match(/(\d+)\smore/);
	if (moreMatch !== null) {
		return names.length - 1 + parseInt(moreMatch[1], 10);
	} else {
		return names.length;
	}
}

function isError(e: unknown): e is Error {
	return typeof e === 'object' && e !== null && e.hasOwnProperty('message');
}

export default async function (config: Config) {
	const browser = await newBrowser();
	const page = await newPage(browser);

	await authenticate(
		browser,
		config.username,
		config.password,
		config.totpSecret,
	);

	const participants = async (): Promise<number> => {
		try {
			await page.goto(config.meetUrl);
			// We need to wait some extra time after the status div renders, because
			// Google Meets is still querying the meet status for some moments after the
			// status div has loaded.
			await page.waitForSelector('div[role=status]');
			await page.waitForTimeout(600);
			return parseCountFromStatus(await getText(page, 'in this call'));
		} catch (e: unknown) {
			if (
				isError(e) &&
				// Selector not found
				(e.message.includes('Failed to find an element containing') ||
					// Browser closed while querying selector
					e.message.includes('closed'))
			) {
				return 0;
			} else {
				throw e;
			}
		}
	};

	return {
		participants: async () => {
			const count = await participants();
			log.debug(`Got participants: ${count}`);
			return count;
		},
		link: () => {
			return config.meetUrl;
		},
		teardown: async () => {
			await browser.close();
		},
	};
}

async function authenticate(
	browser: Browser,
	username: string,
	password: string,
	totpSecret: string,
) {
	const page = await newPage(browser);
	const resp = await page.goto('https://accounts.google.com/?hl=en');
	if (!resp) {
		throw new Error('Response from accounts.google.com was null');
	}
	if (resp.url().includes('myaccount.google.com')) {
		// We're already logged in
		return true;
	}

	await page.evaluate(() => {
		// prevent chromium from using smartcards (aka YubiKeys) as that blocks the process
		window.navigator.credentials.get = () =>
			Promise.reject('no yubi-key for you');
	});

	log.info('Typing out Google email');
	await page.waitForSelector('input[type="email"]');
	await page.waitForSelector('#identifierNext');
	await page.click('input[type="email"]');
	await page.keyboard.type(username, { delay: 10 });
	let navigationPromise = page.waitForNavigation();
	await page.click('#identifierNext');
	await navigationPromise;
	await page.waitForTimeout(600); // animations...

	log.info('Typing out Google password');
	await page.waitForSelector('input[type="password"]');
	await page.waitForSelector('#passwordNext');
	await page.click('input[type="password"]');
	await page.keyboard.type(password, { delay: 10 });
	navigationPromise = page.waitForNavigation();
	await page.click('#passwordNext');
	await navigationPromise;

	log.info('Attempting 2FA authentication');
	await page.waitForTimeout(2000);
	navigationPromise = page.waitForNavigation();
	await clickElement(page, 'Try another way');
	await navigationPromise;
	await page.waitForTimeout(2000);
	navigationPromise = page.waitForNavigation();
	await clickElement(page, 'Google Authenticator');
	await navigationPromise;
	await page.waitForTimeout(2000);
	await page.keyboard.type(totp(totpSecret).toString(), {
		delay: 100,
	});
	await page.keyboard.press('Enter');
	await page.waitForTimeout(3000);
	return true;
}
