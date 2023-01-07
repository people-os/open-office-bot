import { existsSync } from 'fs';
import { Browser, Page, ElementHandle } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import config from './config';

const sp = StealthPlugin();
sp.enabledEvasions.delete('iframe.contentWindow');
sp.enabledEvasions.delete('navigator.plugins');
puppeteer.use(sp);

export async function newBrowser(): Promise<Browser> {
	const puppeteerOptions = {
		headless: true,
		args: [
			// https://stackoverflow.com/questions/52464583/possible-to-get-puppeteer-audio-feed-and-or-input-audio-directly-to-puppeteer
			// https://kapeli.com/cheat_sheets/Chromium_Command_Line_Switches.docset/Contents/Resources/Documents/index
			'--use-fake-ui-for-media-stream',
			'--use-fake-device-for-media-stream',
			'--use-file-for-fake-audio-capture=/home/mj/experiment/meet-the-bots/example.wav',
			'--allow-file-access',
			'--lang=en',
			'--no-sandbox',
			'--disable-notifications',
		],
		env: {
			LANG: 'en',
		},
		defaultViewport: { height: 912, width: 1480 },
	};

	if (existsSync(config.puppeteer.executablePath)) {
		console.log('Altering puppeteer chromium path...');
		/* @ts-ignore */
		puppeteerOptions.executablePath = config.puppeteer.executablePath;
	}

	const browser = await puppeteer.launch(puppeteerOptions);
	browser
		.defaultBrowserContext()
		.overridePermissions('https://meet.google.com/', [
			'microphone',
			'camera',
			'notifications',
		]);

	return browser;
}

export async function newPage(browser: Browser): Promise<Page> {
	const page = await browser.newPage();
	await page.setExtraHTTPHeaders({
		'Accept-Language': 'en',
		'sec-ch-ua':
			'"Chromium";v="94", "Microsoft Edge";v="94", ";Not A Brand";v="99"',
	});
	// Set the language forcefully on javascript
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'language', {
			get() {
				return 'en';
			},
		});
		Object.defineProperty(navigator, 'languages', {
			get() {
				return ['en'];
			},
		});
	});
	await page.setBypassCSP(true);
	return page;
}

async function findElement(page: Page, search: string): Promise<ElementHandle> {
	// Find the element on the page using the search text
	const element = await page.$x(`//*[contains(text(), '${search}')]`);
	// If the element was found, return its innerHTML
	if (element.length === 0) {
		throw new Error(`Failed to find an element containing \`${search}\``);
	}
	return element[0] as ElementHandle;
}

export async function getText(page: Page, search: string): Promise<string> {
	return (await findElement(page, search)).evaluate((elem) => elem.innerHTML);
}

export async function clickElement(page: Page, search: string) {
	return (await findElement(page, search)).click();
}
