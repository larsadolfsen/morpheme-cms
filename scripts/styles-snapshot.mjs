// Snapshots of the editor's computed styles, for the move away from Tailwind (batch T01): a batch builds the editor before and after, takes a folder of
// snapshots of each and proves that the look is the same with `node scripts/compare-styles.mjs --snapshots <before> <after>`.
//   node scripts/styles-snapshot.mjs [built site, else dist]        (from .morpheme/demo/site, as check:screens runs; STYLES_OUT is the folder)
// It uses the harness of check:screens (scripts/screens/support/context.mjs: the browser and the served built site; scripts/built-site.mjs: openEditor, which
// answers GitHub from the files on disk, so no login and nothing changes). It does not touch scripts/editor-screens.mjs, and it lives in scripts/, not in scripts/screens/ or its support/ folder: the runner imports every .mjs file of scripts/screens/ as an area, and the independence test forbids writing files there. It visits every screen unit the
// way the unit "screens 390" finds them (the editor's own links, two steps down from the start screens) at 375 and 1280 px, light and dark, density -1 and
// 0 and 1, and writes one gzipped JSON snapshot of the computed styles for each unit, screen and setting: <STYLES_OUT>/<width>-<scheme>-d<density>--<screen>.json.gz
// (default STYLES_OUT: .morpheme/styles-snapshots/<current time>). STYLES_ONLY=a,b limits the screens (the hash addresses), for a quick try.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { openEditor } from './built-site.mjs';
import { browser, problems, server, site } from './screens/support/context.mjs';
import { PROPERTIES, SKIP_TAGS, capture, settle, settled, stubOutside } from './compare-styles.mjs';

const OUT = process.env.STYLES_OUT || join(process.cwd(), '.morpheme/styles-snapshots', new Date().toISOString().replace(/[:.]/g, '-'));
mkdirSync(OUT, { recursive: true });
const ONLY = process.env.STYLES_ONLY?.split(',') ?? null;

const VIEWPORTS = [
  [375, 800],
  [1280, 900],
];
const SCHEMES = ['light', 'dark'];
const DENSITIES = [-1, 0];
// The screens: the start screens of "screens 390" (scripts/screens/start-screens.mjs) and every screen they link to, two steps down.
const STARTS = [
  '',
  'settings',
  'developer/parts',
  'company/colors',
  'global/header',
  'global/side-column',
  'licenses',
  'appearance/themes',
  'seo',
  'settings/appstore',
  'installed/connectors',
  'installed/plugins',
  'apps',
];
const file = (width, scheme, density, hash) => `${width}-${scheme}-d${density}--${hash.replace(/[^\w-]+/g, '_') || 'start'}.json.gz`;

/** The screens: every hash address reached from the start screens by the editor's own links (as the unit "screens" finds them). */
async function discover() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`snapshot discovery: ${e.message}`));
  await openEditor(page, site);
  const seen = new Set(STARTS);
  let next = STARTS;
  for (let depth = 0; depth <= 2 && next.length; depth++) {
    const found = [];
    for (const hash of next) {
      await page.evaluate((h) => (location.hash = h), hash);
      await page.waitForTimeout(150);
      const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)));
      for (const link of links) if (!seen.has(link)) (found.push(link), seen.add(link));
    }
    next = found;
  }
  await page.close();
  return [...seen];
}

const screens = (await discover()).filter((h) => !ONLY || ONLY.includes(h));
let written = 0;
const freshPage = async (width, height) => {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US', reducedMotion: 'reduce' });
  page.on('pageerror', (e) => problems.push(`${width}px snapshot: ${e.message}`));
  await stubOutside(page, site);
  await openEditor(page, site);
  await settle(page);
  return page;
};
/** One screen: every colour scheme and density, written as snapshots. */
async function snapshotScreen(page, width, hash) {
  await page.evaluate((h) => (location.hash = h), hash);
  await page.waitForTimeout(300);
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
  for (const scheme of SCHEMES) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const density of DENSITIES) {
      await page.evaluate((d) => (document.documentElement.dataset.density = String(d)), density);
      await settled(page);
      const elements = await page.evaluate(capture, { properties: PROPERTIES, skip: SKIP_TAGS });
      writeFileSync(
        join(OUT, file(width, scheme, density, hash)),
        gzipSync(JSON.stringify({ width, scheme, density, screen: hash, elements })),
      );
      written++;
    }
  }
}
for (const [width, height] of VIEWPORTS) {
  let page = await freshPage(width, height);
  for (const hash of screens) {
    // A screen that loads another page while it is read (a navigation) gets a fresh editor and one more try; then it is a problem.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        // A screen that does not finish in a minute is a failed try (a page that stops answering must not stop the run).
        let timer;
        await Promise.race([
          snapshotScreen(page, width, hash),
          new Promise((_, reject) => (timer = setTimeout(() => reject(new Error('the screen did not finish in 60 s')), 60000))),
        ]).finally(() => clearTimeout(timer));
        break;
      } catch (error) {
        await page.close().catch(() => {});
        page = await freshPage(width, height);
        if (attempt === 2) problems.push(`${width}px #${hash}: ${error.message.split('\n')[0]}`);
      }
    }
  }
  await page.close();
}
await browser?.close();
server.close();
console.log(`${written} snapshots of ${screens.length} screens in ${OUT}`);
if (problems.length) {
  console.error(`${problems.length} errors:\n${[...new Set(problems)].join('\n')}`);
  process.exit(1);
}
