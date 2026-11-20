// Checks the site's pop-up in a browser (theme/components/Popup.astro, theme/ui/dialogFocus.ts): when it opens by itself the dialog has the
// focus, no control does and no ring is drawn on the container (the owner's dialog rule: no control has the focus when a basic dialog
// opens). Run on the built site: npm run build, then `cd .morpheme/demo/site && node ../../../scripts/check-popup-focus.mjs`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';

const DIST = resolve(process.cwd(), process.argv[2] ?? 'dist');

// A page of the built site that has a pop-up that opens by itself on scroll.
function findPage(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === '_astro' || name === 'editor') continue;
      const found = findPage(path);
      if (found) return found;
    } else if (name === 'index.html' && /<dialog[^>]*data-popup=[^>]*data-trigger="scroll"/.test(readFileSync(path, 'utf8'))) return path;
  }
}
const file = existsSync(DIST) ? findPage(DIST) : undefined;
if (!file) {
  console.log('The site has no pop-up that opens on scroll: skipped.');
  process.exit(0);
}
const address = `/${relative(DIST, file).replace(/index\.html$/, '')}`;

const problems = [];
const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

for (const [width, height] of [
  [375, 800],
  [1280, 900],
]) {
  const label = `${width}px ${address}`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  await page.goto(`${site}${address}`);
  await page.waitForTimeout(500);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const opened = await page
    .waitForFunction(() => document.querySelector('dialog[data-popup]')?.open, null, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!opened) problems.push(`${label}: the pop-up did not open on scroll`);
  else {
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => {
      const dialog = document.querySelector('dialog[data-popup]');
      const active = document.activeElement;
      return {
        onDialog: active === dialog,
        control: active && active !== dialog && active !== document.body ? active.outerHTML.slice(0, 80) : null,
        outline: getComputedStyle(dialog).outlineStyle,
      };
    });
    if (!state.onDialog)
      problems.push(`${label}: the pop-up's dialog does not have the focus${state.control ? ` (${state.control} does)` : ''}`);
    if (state.outline !== 'none') problems.push(`${label}: the pop-up's dialog draws a ${state.outline} outline`);
  }
  await page.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`${problems.length} problem(s):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('The pop-up opens with the focus on its dialog: no control chosen, no ring on the container.');
