// Measures speed on the built demo, for the numbers in docs/performance-baseline.md. NOT part of `npm run check`, CI or the
// published package: it takes minutes and its numbers depend on the machine. Run it from the demo (after `npm run build`):
//
//   cd .morpheme/demo/site && node ../../../scripts/measure-speed.mjs [--runs 3] [--profile mobile|desktop] [--only <text>] [--json out.json] [--css file.css]
//
// Two profiles: "mobile" is 375 px wide, touch, with the CPU slowed 4x (a mid-range phone), "desktop" is 1280 px with no
// slowing. Each scenario opens a page of the site or a screen of the editor (answered from the files here, no sign-in, nothing
// changes), then does scripted interactions with real input (open menu, open a sheet, type in a field, scroll). Every
// scenario runs `--runs` times and the table shows the median.
//
// What is measured, in the page itself (PerformanceObserver):
//   LCP   largest contentful paint (ms), at the end of the load
//   CLS   cumulative layout shift, without shifts after input
//   TBT   total blocking time: the sum of each long task's time over 50 ms, from first contentful paint to the settled page
//   long  long tasks (over 50 ms) while the page loads: count and the longest (ms)
//   LoAF  the longest long animation frame while the page loads (ms)
//   INP   per interaction, the longest event duration (input to the next paint) of the interaction (ms); INP is over 200 ms = poor
//   task  the longest long task during the interaction (ms)
// Chromium only (long tasks, LoAF, event timing); `CHROMIUM_PATH` picks another Chromium.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { serveBuilt } from './built-site.mjs';
import { openEditor } from './built-site.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const RUNS = Number(option('--runs', 3));
const ONLY_PROFILE = option('--profile', '');
const ONLY = option('--only', '');
const JSON_OUT = option('--json', '');
const EXTRA_CSS = option('--css', ''); // a CSS file added to every page: to try a fix before it is written into the source

const PROFILES = {
  mobile: { width: 375, height: 812, touch: true, cpu: 4 },
  desktop: { width: 1280, height: 800, touch: false, cpu: 1 },
};

// Runs in every page before its own scripts: collects what the browser reports.
const COLLECT = () => {
  const m = (window.__speed = { lcp: 0, cls: 0, tasks: [], loaf: [], events: [], fcp: 0 });
  const watch = (type, onEntry, extra = {}) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(onEntry)).observe({ type, buffered: true, ...extra });
    } catch {}
  };
  watch('largest-contentful-paint', (e) => (m.lcp = e.startTime));
  watch('paint', (e) => e.name === 'first-contentful-paint' && (m.fcp = e.startTime));
  watch('layout-shift', (e) => e.hadRecentInput || (m.cls += e.value));
  watch('longtask', (e) => m.tasks.push({ at: e.startTime, ms: e.duration }));
  watch('long-animation-frame', (e) => m.loaf.push({ at: e.startTime, ms: e.duration }));
  watch('event', (e) => m.events.push({ at: e.startTime, ms: e.duration, name: e.name, id: e.interactionId }), { durationThreshold: 16 });
};

const median = (list) => {
  const sorted = list.filter((n) => n != null).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
};
const round = (n) => (n == null ? '-' : Math.round(n * 100) / 100);

/** The scenarios. `open`: where; `ready`: what shows when it is loaded; `acts`: interactions, each [name, async (page) => void]. */
const SITE_SCENARIOS = [
  {
    name: 'site: home',
    url: '/',
    ready: 'main',
    acts: [
      ['open menu', siteMenu],
      ['scroll', scroll],
    ],
  },
  {
    // The Blocks page was one page of 36 blocks until it was split into a page for each component; the Lists page has the most (12).
    name: 'site: lists page',
    url: '/blocks/lists/',
    ready: 'main',
    acts: [
      ['open menu', siteMenu],
      ['scroll', scroll],
    ],
  },
  { name: 'site: blog', url: '/blog/', ready: 'main', acts: [['scroll', scroll]] },
  { name: 'site: about', url: '/about/', ready: 'main', acts: [['scroll', scroll]] },
];
const EDITOR_SCENARIOS = [
  {
    name: 'editor: start screen',
    hash: '',
    ready: 'a[href^="#"]',
    acts: [
      ['open menu', editorMenu],
      ['search view', editorSearch],
    ],
  },
  {
    name: 'editor: page list',
    hash: '#list/pages',
    ready: 'main, [role=main], body',
    acts: [
      ['scroll', scroll],
      ['search view', editorSearch],
    ],
  },
  {
    name: 'editor: page with many blocks',
    hash: '#src/content/pages/blocks-lists.md',
    ready: '.ProseMirror .mo-site-block-card',
    acts: [
      ['scroll', scroll],
      ['type in a field', typeInPage],
      ['open a sheet', editorSheet],
      ['open menu', editorMenu],
    ],
  },
  {
    name: 'editor: Library',
    hash: '#files',
    ready: 'main, [role=main], body',
    acts: [
      ['scroll', scroll],
      ['open menu', editorMenu],
    ],
  },
  {
    name: 'editor: search view',
    hash: '',
    ready: 'a[href^="#"]',
    acts: [
      ['open search view', editorSearch],
      ['type in the search field', typeInSearch],
    ],
  },
];

async function siteMenu(page) {
  const phone = page.locator('button[aria-label="Open menu"]');
  if (await phone.isVisible()) await phone.click();
  else await page.locator('.mo-header__nav-toggle, nav button').first().click();
}
async function editorMenu(page) {
  const button = page.locator('button[aria-label="Open the menu"]:visible, button[aria-label="More"]:visible').first();
  if (await button.count()) await button.click({ timeout: 5000 });
  else throw new Error('no menu button (the navigation is always open here)');
}
async function editorSearch(page) {
  await page.locator('button[aria-label="Search"]:visible, [data-search-bar-button]:visible').first().click({ timeout: 5000 });
  await page.waitForSelector('dialog[open] input, [data-search-view-open] input', { state: 'visible', timeout: 5000 });
}
async function typeInSearch(page) {
  await editorSearch(page);
  const input = page.locator('dialog[open] input:visible, [data-search-view-open] input:visible').first();
  await input.focus({ timeout: 5000 });
  await page.keyboard.type('colors', { delay: 60 });
}
async function typeInPage(page) {
  await page.locator('.ProseMirror').first().click();
  await page.keyboard.type('Speed test typing in the page.', { delay: 60 });
  await page.keyboard.press('Control+z'); // the text is never saved; undo leaves the page as it was
}
async function editorSheet(page) {
  await page.locator('button[aria-label="Insert block"]:visible').first().click({ timeout: 5000 });
  await page.waitForSelector('dialog[open], .mo-editor-side-sheet', { timeout: 5000 });
}
async function scroll(page) {
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(60);
  }
}

/** Does one interaction and reads what happened in the page meanwhile. */
async function act(page, [name, run]) {
  await page.evaluate(() => (window.__speed.mark = performance.now()));
  let failed = null;
  try {
    await run(page);
  } catch (e) {
    failed = String(e.message).split('\n')[0];
  }
  await page.waitForTimeout(700); // the events and the next paint are reported a little later
  const got = await page.evaluate(() => {
    const m = window.__speed;
    const events = m.events.filter((e) => e.at >= m.mark);
    return { events, tasks: m.tasks.filter((t) => t.at >= m.mark), loaf: m.loaf.filter((t) => t.at >= m.mark) };
  });
  // INP of an interaction: its longest event (those with an interaction id are the real interactions).
  const real = got.events.filter((e) => e.id > 0);
  return {
    name,
    failed,
    inp: failed ? null : Math.max(0, ...(real.length ? real : got.events).map((e) => e.ms)),
    task: failed ? null : Math.max(0, ...got.tasks.map((t) => t.ms)),
    loaf: failed ? null : Math.max(0, ...got.loaf.map((t) => t.ms)),
  };
}

async function measure(browser, site, profile, scenario) {
  const p = PROFILES[profile];
  const context = await browser.newContext({
    viewport: { width: p.width, height: p.height },
    hasTouch: p.touch,
    isMobile: p.touch,
    locale: 'en-US',
    deviceScaleFactor: p.touch ? 2 : 1,
  });
  await context.addInitScript(COLLECT);
  if (EXTRA_CSS)
    await context.addInitScript(
      (css) =>
        addEventListener('DOMContentLoaded', () =>
          document.head.append(Object.assign(document.createElement('style'), { textContent: css })),
        ),
      readFileSync(EXTRA_CSS, 'utf8'),
    );
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (p.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (scenario.hash === undefined) await page.goto(`${site}${scenario.url}`, { waitUntil: 'load' });
  else {
    // The editor: the same fake Worker as the screens check, then the screen (a hash change after the first load).
    await openEditor(page, site);
    await page.evaluate(() => (window.__speed.loadFrom = performance.now()));
    if (scenario.hash) await page.evaluate((h) => (location.hash = h), scenario.hash);
  }
  await page.waitForSelector(scenario.ready, { state: 'attached', timeout: 60_000 });
  await page.waitForTimeout(2500); // settle: late scripts, images, fonts
  const load = await page.evaluate(() => {
    const m = window.__speed;
    const from = m.fcp || 0;
    const tasks = m.tasks.filter((t) => t.at >= from);
    return {
      lcp: m.lcp,
      cls: m.cls,
      tbt: tasks.reduce((sum, t) => sum + Math.max(0, t.ms - 50), 0),
      longTasks: tasks.length,
      longest: Math.max(0, ...tasks.map((t) => t.ms)),
      loaf: Math.max(0, ...m.loaf.map((t) => t.ms)),
    };
  });
  const acts = [];
  for (const a of scenario.acts) {
    acts.push(await act(page, a));
    // Back to the screen as it was: close what opened.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await context.close();
  return { load, acts, errors };
}

const { server, site } = await serveBuilt(`${process.cwd()}/dist`);
const browser = await chromium.launch({
  args: ['--no-sandbox'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const results = [];
for (const profile of Object.keys(PROFILES)) {
  if (ONLY_PROFILE && ONLY_PROFILE !== profile) continue;
  for (const scenario of [...SITE_SCENARIOS, ...EDITOR_SCENARIOS]) {
    if (ONLY && !scenario.name.includes(ONLY)) continue;
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      try {
        runs.push(await measure(browser, site, profile, scenario));
      } catch (e) {
        console.error(`${profile} ${scenario.name} run ${i + 1} failed: ${String(e.message).split('\n')[0]}`);
      }
    }
    if (!runs.length) continue;
    const med = (pick) => median(runs.map(pick));
    results.push({
      profile,
      scenario: scenario.name,
      load: Object.fromEntries(['lcp', 'cls', 'tbt', 'longTasks', 'longest', 'loaf'].map((k) => [k, med((r) => r.load[k])])),
      acts: scenario.acts.map(([name], i) => ({
        name,
        failed: runs[0].acts[i].failed,
        inp: med((r) => r.acts[i].inp),
        task: med((r) => r.acts[i].task),
        loaf: med((r) => r.acts[i].loaf),
      })),
      errors: [...new Set(runs.flatMap((r) => r.errors))],
    });
    console.error(`${profile} ${scenario.name} done`);
  }
}
await browser.close();
server.close();

for (const profile of Object.keys(PROFILES)) {
  const mine = results.filter((r) => r.profile === profile);
  if (!mine.length) continue;
  console.log(`\n### ${profile} (${PROFILES[profile].width}px, CPU ${PROFILES[profile].cpu}x, median of ${RUNS})\n`);
  console.log('| Scenario | LCP ms | CLS | TBT ms | Long tasks | Longest ms | LoAF ms | Interactions: INP ms (longest task ms) |');
  console.log('| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |');
  for (const r of mine) {
    const acts = r.acts
      .map((a) => (a.failed ? `${a.name}: n/a (${a.failed.slice(0, 60)})` : `${a.name}: ${round(a.inp)} (${round(a.task)})`))
      .join('; ');
    const l = r.load;
    console.log(
      `| ${r.scenario} | ${round(l.lcp)} | ${round(l.cls)} | ${round(l.tbt)} | ${l.longTasks} | ${round(l.longest)} | ${round(l.loaf)} | ${acts} |`,
    );
  }
}
const errors = results.filter((r) => r.errors.length);
for (const r of errors) console.log(`\nPage errors, ${r.profile} ${r.scenario}: ${r.errors.join(' | ')}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(results, null, 2));
