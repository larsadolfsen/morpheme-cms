// Opens every screen of the editor (/editor/) in a browser, on a phone and on a computer, and fails
// when one breaks: an error on the page, something its Content-Security-Policy stopped, an empty app, or a link to an
// address with nothing on it, or an icon that is not found (drawn as the question mark, data-icon-missing: Svg in
// packages/editor/src/icon.tsx), there or on one of the built site's pages. An icon drawn from Material Symbols instead
// of the icon pack (data-icon-fallback) is only listed, with where it is: it does not fail.
// The screens are found as the editor's own links: from the start screen (the drawer's links are in the page also while it is
// closed) and "Parts", #developer/parts, "Themes", #appearance/themes, "Search engine optimization", #seo, "Appstore", #settings/appstore, and "Apps", #apps, which the menu no longer links to), and
// from each screen it opens, two steps down. GitHub is answered from the files in this repository, so it needs no login
// and changes nothing. It runs on the built site: npm run build && npm run check:screens (or on another
// folder with a built site, its path after the command: packages/editor/scripts/check-themes.mjs).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { openEditor, serveBuilt } from './built-site.mjs';

// The editor is opened in Danish (locale da-DK below), so the texts it shows are read from its Danish messages.
const { apps: da } = await import('../src/i18n/da-DK/apps.ts');
const { app: daApp } = await import('../src/i18n/da-DK/app.ts');

const ROOT = `${process.cwd()}/`;
const DIST = resolve(ROOT, process.argv[2] ?? 'dist');
if (!existsSync(join(DIST, 'editor/index.html'))) {
  console.error(`There is no built site in ${DIST}. Run npm run build first.`);
  process.exit(1);
}

const missingIcon = (name) =>
  name
    ? `the icon "${name}" does not exist (a question mark instead): write it in packages/editor/src/icon.tsx`
    : 'an icon is not an SVG file (a question mark instead)';

const fallbackIcon = (name) =>
  `the icon "${name}" is from Material Symbols (not in the icon pack): give it an icon in each pack's map if it is to stay`;

// The icons not found on the built site's pages: each one once, with the pages it is on.
const problems = [];
const missingOn = new Map();
// The icons drawn from Material Symbols (named, with where they are: up to 3 places), listed, not failed on.
const fallbackOn = new Map();
const fallbackAt = (name, place) => fallbackOn.set(name, new Set([...(fallbackOn.get(name) ?? []), place]));
for (const entry of readdirSync(DIST, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const file = join(entry.parentPath, entry.name);
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/data-icon-missing="([^"]*)"/g))
    missingOn.set(name, new Set([...(missingOn.get(name) ?? []), `/${relative(DIST, file)}`]));
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/data-icon-fallback="([^"]*)"/g)) fallbackAt(name, `/${relative(DIST, file)}`);
}
for (const [name, pages] of missingOn) {
  const shown = [...pages].slice(0, 3).join(', ');
  problems.push(`${shown}${pages.size > 3 ? ` and ${pages.size - 3} more pages` : ''}: ${missingIcon(name)}`);
}

const { server, site } = await serveBuilt(DIST);

// CHROMIUM_PATH: another Chromium than Playwright's own (one installed for another version of Playwright).
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
// The screens opened (each on both).
const opened = new Set();

for (const [width, height] of [
  [390, 844],
  [1280, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  let route = '';
  page.on('pageerror', (e) => problems.push(`${width}px #${route}: ${e.message}`));
  // Something the page's Content-Security-Policy stopped (packages/editor/lib/csp.mjs).
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) problems.push(`${width}px #${route}: ${m.text()}`);
  });
  await openEditor(page, site);

  // From the start screen (the drawer's links), and from "Parts", "Themes", "Search engine optimization" and "Appstore"
  // (the apps' pages and their developers'), whose screens are a step further down than the others. "Apps" (the list of
  // the apps installed) has no row in the menu, so it is a start of its own.
  const starts = ['', 'developer/parts', 'appearance/themes', 'seo', 'settings/appstore', 'apps'];
  const seen = new Set(starts);
  let next = starts;
  for (let depth = 0; depth <= 2 && next.length; depth++) {
    const found = [];
    for (const hash of next) {
      route = hash;
      await page.evaluate((h) => (location.hash = h), hash);
      await page.waitForTimeout(150);
      opened.add(hash);
      const state = await page.evaluate(() => ({
        empty: !document.querySelector('astro-island')?.textContent?.trim(),
        text: document.body.innerText,
        links: [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)),
        missing: [...document.querySelectorAll('[data-icon-missing]')].map((e) => e.getAttribute('data-icon-missing')),
        fallback: [...document.querySelectorAll('[data-icon-fallback]')].map((e) => e.getAttribute('data-icon-fallback')),
      }));
      for (const name of new Set(state.fallback)) fallbackAt(name, `${width}px #${hash}`);
      for (const name of new Set(state.missing)) problems.push(`${width}px #${hash}: ${missingIcon(name)}`);
      if (state.empty) problems.push(`${width}px #${hash}: the screen is empty`);
      if (state.text.includes(`${daApp.nothingAt(hash)}.`)) problems.push(`${width}px #${hash}: there is nothing at the address`);
      for (const link of state.links) {
        if (seen.has(link)) continue;
        seen.add(link);
        found.push(link);
      }
    }
    next = found;
  }
  await page.close();
}

// "Appstore" and "Morpheme" in the three states of the site's key to the store (STORE_STATES): what each shows, and a picture of it in
// SCREENS_DIR (the temporary folder's morpheme-screens by default).
const shots = process.env.SCREENS_DIR || join(tmpdir(), 'morpheme-screens');
mkdirSync(shots, { recursive: true });
const keyStates = {
  open: {
    appstore: {
      shows: [da.connectTitle, da.connect],
      hides: [da.disconnect],
    },
    morpheme: { shows: [da.connect], hides: [da.disconnect] },
  },
  readOnly: {
    appstore: { shows: [da.noStore], hides: [da.connect, da.disconnect] },
    morpheme: { shows: [da.noStore], hides: [da.connect, da.disconnect] },
  },
  button: {
    appstore: { shows: [], hides: [da.connected, da.disconnect] },
    morpheme: { shows: [da.connected, 'site_sample', da.disconnect], hides: [da.connect] },
  },
};
// The screens that show the key: where each is (its address after the "#", CMS_ROUTE in CmsPage.tsx for "Morpheme").
const keyScreens = { appstore: 'settings/appstore', morpheme: 'morpheme' };
for (const [state, checks] of Object.entries(keyStates)) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`Appstore (${state}): ${e.message}`));
  await openEditor(page, site, {}, state);
  for (const [screen, { shows, hides }] of Object.entries(checks)) {
    await page.evaluate((hash) => (location.hash = hash), keyScreens[screen]);
    await page.waitForTimeout(500);
    const text = await page.evaluate(() => document.body.innerText);
    for (const x of shows) if (!text.includes(x)) problems.push(`${screen} (${state}): "${x}" is missing`);
    for (const x of hides) if (text.includes(x)) problems.push(`${screen} (${state}): "${x}" must not be shown`);
    const file = join(shots, `${screen}-${state}.png`);
    await page.screenshot({ path: file });
    console.log(`${screen} (${state}): ${file}`);
  }
  await page.close();
}

await browser.close();
server.close();
for (const [name, places] of fallbackOn) {
  const shown = [...places].slice(0, 3).join(', ');
  console.log(`${shown}${places.size > 3 ? ` and ${places.size - 3} more places` : ''}: ${fallbackIcon(name)}`);
}
if (problems.length) {
  console.error(`${problems.length} errors in the editor or on the site:\n${[...new Set(problems)].join('\n')}`);
  process.exit(1);
}
console.log(`${opened.size} screens in the editor open without errors, on a phone and on a computer, and all icons exist.`);
