// Checks the UI components page (/ui/) in a browser whose language is Danish, on the English demo: its texts follow the site's language, so they agree
// with `<html lang>` (the page marks `data-site-language`; src/i18n/index.ts honours it). Run on the built site: npm run build, then
// `cd .morpheme/demo/site && node ../../../scripts/check-ui-language.mjs`.
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';

const DIST = resolve(process.cwd(), process.argv[2] ?? 'dist');
if (!existsSync(join(DIST, 'ui', 'index.html'))) {
  console.log('The site has no UI components page: skipped.');
  process.exit(0);
}
// Whole words that only Danish uses, in the gallery's own texts.
const DANISH = /\b(Annuller|Gem|Slet|Luk|V\u00e6lg|S\u00f8g|Dato|Indstillinger|Overskrift|Fortryd|N\u00e6ste|Forrige|Mere|Ryd)\b/;

const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const problems = [];
const context = await browser.newContext({ locale: 'da-DK', viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
await page.goto(`${site}/ui/`, { waitUntil: 'load' });
await page.waitForSelector('.mo-ui-components button', { timeout: 15000 });
const { lang, text } = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  text: document.querySelector('.mo-ui-components').innerText,
}));
const danish = text.match(new RegExp(DANISH, 'g'));
if (lang === 'en' && danish) problems.push(`/ui/ has lang="en" but Danish text with a da-DK browser: ${[...new Set(danish)].join(', ')}`);
await browser.close();
server.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('The UI components page follows the site language with a da-DK browser.');
