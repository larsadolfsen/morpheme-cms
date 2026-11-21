// The keyboard check of the built editor (WCAG 2.2 AA: 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 2.4.11, 3.2.1; plan `docs/superpowers/plans/2026-11-20-0-19-3-keyboard.md`).
// It walks every editor screen with Tab at 1280 and 390 px (scripts/keyboard.mjs) and the main flows A to I by keyboard (scripts/keyboard-flows.mjs; A, B and
// F also at 375 px), and fails on a problem that scripts/keyboard-allowlist.json does not hold and on an entry that no longer matches, so the list only shrinks.
// In CI the same walk and flows run inside the `screens` shards (units `screens 390`, `screens 1280` and `checkKeyboardFlows`, scripts/screens/start-screens.mjs);
// this command is the same check on its own, for working on it. Run on the built site: npm run build, then npm run check:keyboard (it runs from .morpheme/demo/site).
//   --flows        only the flows            --screens  only the Tab walk
//   --only a,b     only these screens (`settings,global/header`), or these flows with --flows (`A,F`); a part run does not look for stale entries
//   --list         prints what is found as allowlist entries (reasons "TODO"), to write or check the list; changes nothing.
// KEYBOARD_TRACE=1 prints each flow's steps.
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { openEditor, serveBuilt } from './built-site.mjs';
import { FLOWS, PHONE_FLOWS, SITE_FLOW, runFlow, runSiteFlow } from './keyboard-flows.mjs';
import { allowedKeys, entriesOf, judge, keysOf, readAllowlist, viewportOf, walk } from './keyboard.mjs';

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
        const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)));
        const { findings } = await walk(page);
        const place = `#${hash}`;
        ran.add(place);
        for (const key of keysOf(findings, place, viewportOf(width))) found.add(key);
        problems.push(...(flag('list') ? [] : judge(findings, place, viewportOf(width))));
        for (const link of hrefs) if (!seen.has(link)) (seen.add(link), links.push(link));
      }
      next = links;
    }
    await page.close();
  }
}

if (doFlows) {
  for (const flow of only && !doScreens ? only.filter((f) => f !== SITE_FLOW) : FLOWS) {
    for (const width of [1280, 375]) {
      if (width < 600 && !PHONE_FLOWS.includes(flow)) continue;
      const { findings, errors } = await runFlow(browser, site, flow, width);
      const place = `flow ${flow}`;
      ran.add(place);
      for (const key of keysOf(findings, place, viewportOf(width))) found.add(key);
      problems.push(...errors.map((e) => `${width}px ${e}`));
      problems.push(...(flag('list') ? [] : judge(findings, place, viewportOf(width))));
    }
  }
  // The site, not the editor (`--only site` runs it alone).
  if (!only || !doScreens || only.includes(SITE_FLOW)) {
    for (const width of [1280, 375]) {
      const { findings, errors } = await runSiteFlow(browser, site, width);
      const place = `flow ${SITE_FLOW}`;
      ran.add(place);
      for (const key of keysOf(findings, place, viewportOf(width))) found.add(key);
      problems.push(...errors.map((e) => `${width}px ${e}`));
      problems.push(...(flag('list') ? [] : judge(findings, place, viewportOf(width))));
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
      problems.push(`keyboard: the allowlist holds an entry for ${place}, which no longer exists: ${key.replaceAll('\t', ' | ')}.`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`check:keyboard: ${ran.size} screens and flows: every problem is on the allowlist (${found.size}), nothing stale.`);
