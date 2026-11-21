// The screen reader check of the built editor (WCAG 2.2 AA: 1.1.1, 1.3.1, 2.4.6, 3.3.1, 3.3.2, 4.1.2, 4.1.3; plan `docs/superpowers/plans/2026-11-21-0-19-4-screen-readers.md`).
// It reads the accessibility tree of every editor screen at 1280 and 390 px (the name walk, scripts/announce.mjs) and walks the flows with a recorder
// of what is announced (scripts/announce-flows.mjs: A, B, C, F, I of the keyboard check, and J, K, L), and fails on a problem that
// scripts/announce-allowlist.json does not hold and on an entry that no longer matches, so the list only shrinks. In CI the same walk and flows run inside the
// `screens` shards (units `screens 390`, `screens 1280` and `checkAnnounceFlows`, scripts/screens/start-screens.mjs); this command is the same check on its own,
// for working on it. Run on the built site: npm run build, then npm run check:announce (it runs from .morpheme/demo/site).
//   --flows        only the flows            --screens  only the name walk
//   --only a,b     only these screens (`settings,global/header`), or these flows with --flows (`A,J`); a part run does not look for stale entries
//   --list         prints what is found as allowlist entries (reasons "TODO"), to write or check the list; changes nothing.
// The speech log of the flows is written to announce-log.txt (ANNOUNCE_LOG for another file): what a reader would say at each step.
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { openEditor, serveBuilt } from './built-site.mjs';
import { FLOWS, PHONE_FLOWS, runAnnounceFlow, writeLog } from './announce-flows.mjs';
import { allowedKeys, entriesOf, judge, keysOf, readAllowlist, viewportOf, walk } from './announce.mjs';

const args = process.argv.slice(2);
const dashed = (name) => '-'.concat('-', name);
const flag = (name) => args.includes(dashed(name));
const value = (name) => (args.includes(dashed(name)) ? (args[args.indexOf(dashed(name)) + 1] ?? '') : null);
const DIST = resolve(process.cwd(), args.find((a, i) => !a.startsWith('--') && !['--only'].includes(args[i - 1])) ?? 'dist');
if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`There is no built site in ${DIST}. Run npm run build first.`);
  process.exit(1);
}
const only = value('only')?.split(',').filter(Boolean) ?? null;
const doScreens = !flag('flows');
const doFlows = !flag('screens');

/** Where the editor's screens start: the start screen, and the places whose screens are a step further down; their `#` links are followed two steps. */
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

const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const problems = [];
const found = new Set();
const ran = new Set();

if (doScreens) {
  // The widths and the language of the units `screens 390` and `screens 1280`, so a finding is the same here and in the shards.
  for (const [width, height] of [
    [1280, 900],
    [390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
    page.on('pageerror', (e) => problems.push(`${width}px: ${e.message}`));
    await openEditor(page, site);
    const seen = new Set(STARTS);
    let next = only ?? STARTS;
    for (let depth = 0; depth <= (only ? 0 : 2) && next.length; depth++) {
      const links = [];
      for (const hash of next) {
        await page.evaluate((h) => (location.hash = h), hash);
        await page.waitForTimeout(250);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)));
        const { findings } = await walk(page);
        const place = `#${hash}`;
        ran.add(place);
        for (const key of keysOf(findings, place, viewportOf(width))) found.add(key);
        problems.push(...(flag('list') ? [] : judge(findings, place, viewportOf(width)).map((line) => `${width}px ${line}`)));
        for (const link of hrefs) if (!seen.has(link)) (seen.add(link), links.push(link));
      }
      next = links;
    }
    await page.close();
  }
}

if (doFlows) {
  rmSync(process.env.ANNOUNCE_LOG || join(process.cwd(), 'announce-log.txt'), { force: true });
  for (const flow of only && !doScreens ? only : FLOWS) {
    for (const width of [1280, 375]) {
      if (width < 600 && !PHONE_FLOWS.includes(flow)) continue;
      const { findings, errors, lines } = await runAnnounceFlow(browser, site, flow, width);
      writeLog(lines);
      const place = `flow ${flow}`;
      ran.add(place);
      for (const key of keysOf(findings, place, viewportOf(width))) found.add(key);
      problems.push(...errors.map((e) => `${width}px ${e}`));
      problems.push(...(flag('list') ? [] : judge(findings, place, viewportOf(width)).map((line) => `${width}px ${line}`)));
    }
  }
}
await browser.close();
server.close();

if (flag('list')) {
  console.log(JSON.stringify(entriesOf(found), null, 2));
  process.exit(0);
}
// A whole run also finds the entries of a screen or flow that was never run (a screen that is gone): they are stale too.
if (!only && doScreens && doFlows) {
  for (const key of allowedKeys(readAllowlist()).keys()) {
    const place = key.split('\t')[1];
    if (!ran.has(place))
      problems.push(`announce: the allowlist holds an entry for ${place}, which no longer exists: ${key.replaceAll('\t', ' | ')}.`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`check:announce: ${ran.size} screens and flows: every problem is on the allowlist (${found.size}), nothing stale.`);
