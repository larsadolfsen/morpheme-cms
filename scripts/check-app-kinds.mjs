// Checks an app's promotion kind (contract 8) in a browser: the demo's two apps, `kind-dialog` (the pop-up's dialog) and `kind-sheet` (the theme's bottom sheet,
// `export const surface = 'bottom-sheet'`), each opened by a button, on a phone and a computer. Each part sits inside `data-mo-app="<id>"`, the app's scoped CSS
// applies to it (the box's background, the note's weight) and does not leak: the app's `p` rule (a wavy underline) reaches the app's own paragraph only, not the
// CMS's text in the same dialog or the page's paragraphs. Run on the built site: npm run build, then `cd .morpheme/demo/site && node ../../../scripts/check-app-kinds.mjs`.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';

const DIST = resolve(process.cwd(), process.argv[2] ?? 'dist');
if (!existsSync(DIST)) {
  console.log('No built site: skipped.');
  process.exit(0);
}
const KINDS = ['kind-dialog', 'kind-sheet'];
const problems = [];
const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

for (const [width, height] of [
  [375, 800],
  [1280, 900],
]) {
  for (const id of KINDS) {
    const label = `${width}px ${id}`;
    const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
    await page.goto(`${site}/`);
    await page.waitForTimeout(300);
    // A button that opens the promotion, as the editor's "Open promotion" writes it.
    await page.evaluate((slug) => {
      const a = document.createElement('a');
      a.href = '#';
      a.id = 'open-kind';
      a.dataset.open = `promotion:${slug}`;
      a.textContent = 'Open';
      a.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;padding:8px;background:#fff';
      document.body.append(a);
    }, id);
    await page.click('#open-kind');
    const opened = await page
      .waitForFunction((slug) => document.querySelector(`dialog[data-popup="${slug}"]`)?.open, id, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      problems.push(`${label}: the promotion did not open from its button`);
      await page.close();
      continue;
    }
    await page.waitForTimeout(500);
    const r = await page.evaluate((slug) => {
      const dialog = document.querySelector(`dialog[data-popup="${slug}"]`);
      const scope = dialog.querySelector(`[data-mo-app="${slug}"]`);
      const box = scope?.querySelector('.kind-box');
      const note = scope?.querySelector('.kind-note');
      const underline = (el) => (el ? getComputedStyle(el).textDecorationLine : 'none');
      const outside = [...dialog.querySelectorAll('p')].filter((p) => !scope?.contains(p));
      const pagePs = [...document.querySelectorAll('main p, body > p')].filter((p) => !dialog.contains(p)).slice(0, 20);
      return {
        scoped: !!scope,
        sheet: dialog.dataset.surface === 'bottom-sheet',
        hasBox: !!box,
        fill: box ? getComputedStyle(box).backgroundColor : '',
        noteWeight: note ? Number(getComputedStyle(note).fontWeight) : 0,
        noteUnderline: underline(note),
        leaks: outside.map(underline).filter((u) => u !== 'none').length + pagePs.map(underline).filter((u) => u !== 'none').length,
        checked: outside.length + pagePs.length,
        visible: !!scope && scope.getBoundingClientRect().width > 0,
      };
    }, id);
    if (!r.scoped) problems.push(`${label}: the part is not inside data-mo-app="${id}"`);
    if (r.sheet !== (id === 'kind-sheet')) problems.push(`${label}: opened as the wrong surface (sheet: ${r.sheet})`);
    if (!r.hasBox) problems.push(`${label}: the app's box (.kind-box) is missing`);
    else if (r.fill !== 'rgb(255, 0, 255)')
      problems.push(`${label}: the app's scoped CSS is not applied to its box (background ${r.fill})`);
    if (r.noteWeight < 700) problems.push(`${label}: the app's scoped CSS is not applied to its note (font-weight ${r.noteWeight})`);
    if (r.noteUnderline === 'none')
      problems.push(`${label}: the app's own paragraph has no underline, so its p rule did not apply in its scope`);
    if (r.leaks) problems.push(`${label}: the app's p rule reaches ${r.leaks} paragraph(s) outside its scope (of ${r.checked})`);
    if (!r.visible) problems.push(`${label}: the part takes no space`);
    await page.close();
  }
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`check:app-kinds failed (${problems.length}):\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}
console.log('check:app-kinds: both kinds sit in their app scope on a phone and a computer; their scoped CSS applies and does not leak.');
