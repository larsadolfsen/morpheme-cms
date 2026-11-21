// Checks the site's pop-up in a browser (theme/components/Popup.astro): when it opens by itself the focus is on its first control, the Close
// button, and not on the dialog's container, where a keyboard user would see no ring and have no place to start (owner, 21 Nov 2026,
// docs/material-deviations.md K3; the editor's dialogs keep the rule that no control has the focus on open). Also: a scroll the keyboard makes
// (Tab) never opens it. Run on the built site: npm run build, then `cd .morpheme/demo/site && node ../../../scripts/check-popup-focus.mjs`.
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
        onClose: !!active?.matches?.('[data-popup-close]') && dialog.contains(active),
        onDialog: active === dialog,
        where: active && active !== document.body ? active.outerHTML.slice(0, 80) : 'body',
      };
    });
    if (!state.onClose)
      problems.push(
        `${label}: the pop-up does not open with the focus on its Close button (${state.onDialog ? 'the dialog has it' : state.where} does)`,
      );
  }
  await page.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`${problems.length} problem(s):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('The pop-up opens with the focus on its Close button.');
