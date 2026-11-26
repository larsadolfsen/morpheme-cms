// The accessibility scan of the built site (WCAG 2.2 level AA, axe-core): every built page of the demo, at 1280 and 375 px, light and dark.
// It fails on a violation that scripts/a11y-allowlist.json does not hold and on an entry that no longer matches, so the list only shrinks
// (scripts/a11y.mjs has the rules). The editor's screens are scanned inside check:screens (units `screens 390` and `screens 1280`).
// Run on the built site: npm run build, then npm run check:a11y (it runs from .morpheme/demo/site, as check:screens does).
//   --list   prints the violations found as allowlist entries (reasons "TODO"), to write or check the list; changes nothing.
// A11Y_COLLECT=<file> on check:screens appends the editor's findings to a file, for --list of the editor (see start-screens.mjs).
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';
import { VIEWPORTS, allowedKeys, compare, entriesOf, keysOf, problemsOf, readAllowlist, scan, codeViolations } from './a11y.mjs';
import { activeTheme } from './theme-statement.mjs';

const DIST = resolve(process.cwd(), process.argv.find((a, i) => i > 1 && !a.startsWith('--')) ?? 'dist');
if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`There is no built site in ${DIST}. Run npm run build first.`);
  process.exit(1);
}

/** The built pages as the addresses they are served at (the editor is not a page of the site). */
const pages = readdirSync(DIST, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith('.html'))
  .map((e) => `/${relative(DIST, join(e.parentPath, e.name))}`)
  .filter((p) => !p.startsWith('/editor/'))
  .map((p) => (p.endsWith('/index.html') ? p.slice(0, -'index.html'.length) : p))
  .sort();

// A theme value (axe's color-contrast, target-size, link-in-text-block) is classified, never failed: `check:contrast` measures it (lib/accessibility.mjs, `kindOf`).
const theme = activeTheme();
let themeValues = 0;
const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const found = new Set();
const problems = [];
for (const [viewport, width] of Object.entries(VIEWPORTS)) {
  for (const colorScheme of ['light', 'dark']) {
    // bypassCSP: the site's Content-Security-Policy stops an injected script otherwise.
    const context = await browser.newContext({
      viewport: { width, height: width < 600 ? 800 : 900 },
      colorScheme,
      locale: 'en-US',
      reducedMotion: 'reduce',
      bypassCSP: true,
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => problems.push(`${width}px ${colorScheme}: ${e.message}`));
    for (const path of pages) {
      await page.goto(`${site}${path}`, { waitUntil: 'load' });
      // A page with an island that draws in the browser only (`client:only`, the UI components page) is scanned once it is drawn, not before.
      await page
        .waitForFunction(() => [...document.querySelectorAll('astro-island')].every((i) => i.childElementCount > 0), null, {
          timeout: 15000,
        })
        .catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      const violations = await scan(page);
      const code = codeViolations(violations, theme);
      themeValues += violations.length - code.length;
      for (const key of keysOf(code, path, viewport)) found.add(key);
    }
    await context.close();
  }
}
await browser.close();
server.close();

if (process.argv.includes('--list')) {
  console.log(JSON.stringify(entriesOf(found), null, 2));
  process.exit(0);
}
const all = readAllowlist();
// The editor's entries (places that start with "#") are checked by check:screens; the site's here.
const entries = all.map((e) => ({ ...e, places: e.places.filter((p) => p.startsWith('/')) })).filter((e) => e.places.length);
problems.push(...problemsOf(compare(found, allowedKeys(entries))));
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(
  `check:a11y: ${pages.length} pages, 1280 and 375 px, light and dark: every violation is on the allowlist (${found.size}), nothing stale (${themeValues} theme values measured, not failed).`,
);
