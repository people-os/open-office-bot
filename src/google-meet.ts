import { Browser } from 'puppeteer';
// @ts-ignore does not have any types
import totp = require('totp-generator');

import { newBrowser, newPage, clickElement, getText } from './browser';

type Config = { username: string; password: string; totpSecret: string };

type Meeting = string;

export default async function (config: Config) {
	const browser = await newBrowser();
	const page = await newPage(browser);
	let meeting: string | null = null;

	await authenticate(
		browser,
		config.username,
		config.password,
		config.totpSecret,
	);

	return {
		createMeeting: async (): Promise<Meeting> => {
			// TODO this meet might get invalid after 24 hours if no one is in it
			await page.goto('https://meet.google.com');
			await clickElement(page, 'New meeting');
			await clickElement(page, 'Start an instant meeting');
			await page.waitForNavigation({ waitUntil: 'load' });
			meeting = page.url().split('?')[0];
			return meeting;
		},
		participants: async (): Promise<string> => {
			if (!meeting) {
				throw new Error(
					'Cannot count number of participants because you are not in a meeting.',
				);
			}
			try {
				return await getText(page, 'in this call');
			} catch (e: any) {
				if (
					e.message === 'Failed to find an element containing `in this call`'
				) {
					return '0 people in this call';
				} else {
					throw e;
				}
			}
		},
		link: () => {
			return meeting;
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
		console.log("we're already logged in");
		return true;
	}

	await page.evaluate(() => {
		// prevent chromium from using smartcards (aka YubiKeys) as that blocks the process
		window.navigator.credentials.get = () =>
			Promise.reject('no yubi-key for you');
	});

	console.log('Typing out Google email');
	await page.waitForSelector('input[type="email"]');
	await page.waitForSelector('#identifierNext');
	await page.click('input[type="email"]');
	await page.keyboard.type(username, { delay: 10 });
	let navigationPromise = page.waitForNavigation();
	await page.click('#identifierNext');
	await navigationPromise;
	await page.waitForTimeout(600); // animations...

	console.log('Typing out Google password');
	await page.waitForSelector('input[type="password"]');
	await page.waitForSelector('#passwordNext');
	await page.click('input[type="password"]');
	await page.keyboard.type(password, { delay: 10 });
	navigationPromise = page.waitForNavigation();
	await page.click('#passwordNext');
	await navigationPromise;

	console.log('Attempting 2FA authentication');
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
