// Opens every screen of the editor (/editor/) in a browser, on a phone and on a computer, and fails
// when one breaks: an error on the page, something its Content-Security-Policy stopped, an empty app, or a link to an
// address with nothing on it, or an icon that is not found (drawn as the question mark, data-icon-missing: Svg in
// packages/editor/src/icon.tsx), there or on one of the built site's pages.
// The screens are found as the editor's own links: from the start screen (and "Indstillinger", #indstillinger, "Dele", #udseende/dele, "Temaer",
// #udseende/temaer, "Søgemaskineoptimering", #seo, and "Appstore", #indstillinger/appstore), and
// from each screen it opens, two steps down. GitHub is answered from the files in this repository, so it needs no login
// and changes nothing. It runs on the built site: npm run build && npm run check:screens (or on another
// folder with a built site, its path after the command: packages/editor/scripts/check-themes.mjs).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { openEditor, serveBuilt } from './built-site.mjs';

const ROOT = `${process.cwd()}/`;
const DIST = resolve(ROOT, process.argv[2] ?? 'dist');
if (!existsSync(join(DIST, 'editor/index.html'))) {
  console.error(`Der er intet bygget site i ${DIST}. Kør npm run build først.`);
  process.exit(1);
}

const missingIcon = (name) =>
  name
    ? `ikonet "${name}" findes ikke (et spørgsmålstegn i stedet): skriv det i packages/editor/src/icon.tsx`
    : 'et ikon er ikke en SVG-fil (et spørgsmålstegn i stedet)';

// The icons not found on the built site's pages: each one once, with the pages it is on.
const problems = [];
const missingOn = new Map();
for (const entry of readdirSync(DIST, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const file = join(entry.parentPath, entry.name);
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/data-icon-missing="([^"]*)"/g))
    missingOn.set(name, new Set([...(missingOn.get(name) ?? []), `/${relative(DIST, file)}`]));
}
for (const [name, pages] of missingOn) {
  const shown = [...pages].slice(0, 3).join(', ');
  problems.push(`${shown}${pages.size > 3 ? ` og ${pages.size - 3} sider til` : ''}: ${missingIcon(name)}`);
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

  // From the start screen, and from "Indstillinger" (the gear in the top bar), "Dele", "Temaer",
  // "Søgemaskineoptimering" and "Appstore" (the apps' pages and their developers'), whose screens are a step further
  // down than the others.
  const starts = ['', 'indstillinger', 'udseende/dele', 'udseende/temaer', 'seo', 'indstillinger/appstore'];
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
      }));
      for (const name of new Set(state.missing)) problems.push(`${width}px #${hash}: ${missingIcon(name)}`);
      if (state.empty) problems.push(`${width}px #${hash}: skærmen er tom`);
      if (state.text.includes(`Der er ikke noget på adressen ${hash}.`))
        problems.push(`${width}px #${hash}: der er ikke noget på adressen`);
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

await browser.close();
server.close();
if (problems.length) {
  console.error(`${problems.length} fejl i editoren eller på sitet:\n${[...new Set(problems)].join('\n')}`);
  process.exit(1);
}
console.log(`${opened.size} skærme i editoren åbner uden fejl, på en telefon og på en computer, og alle ikoner findes.`);
