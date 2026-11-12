// Opens every screen of the editor (/editor/) in a browser, on a phone and on a computer, and fails
// when one breaks: an error on the page, something its Content-Security-Policy stopped, an empty app, or a link to an
// address with nothing on it, or an icon that is not found (drawn as the question mark, data-icon-missing: Svg in
// packages/editor/src/icon.tsx), there or on one of the built site's pages. An icon drawn from Material Symbols instead
// of the icon pack (data-icon-fallback) is only listed, with where it is: it does not fail.
// The screens are found as the editor's own links: from the start screen (the drawer's links are in the page also while it is
// closed) and "Parts", #developer/parts, "Themes", #appearance/themes, "Search engine optimization", #seo, "Appstore", #settings/appstore, and "Apps", #apps, which the menu no longer links to; Connectors and Plugins, #installed/connectors and #installed/plugins, are its rows), and
// from each screen it opens, two steps down. GitHub is answered from the files in this repository, so it needs no login
// and changes nothing. It runs on the built site: npm run build && npm run check:screens (or on another
// folder with a built site, its path after the command: packages/editor/scripts/check-themes.mjs).
// It also checks the menu and Settings (#settings, the cog at the bottom of the menu): Settings lists exactly Appearance,
// Developer, Licenses, Morpheme and Privacy, A-Z by their names; the drawer's first level has the three sections, the
// start screen, the rows under the "Apps" label (Store, Connectors, Plugins and Themes, each with an icon) and the cog, which is the last item at the bottom of the drawer and of the collapsed rail (and on a phone,
// of the modal drawer) and is marked on Settings' screens only; and "Morpheme" (#morpheme) shows its status as text, has
// an action on every list row, and its Update button and its connection to the store work.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { CMS_STATUS, openEditor, serveBuilt } from './built-site.mjs';

// The editor is opened in Danish (locale da-DK below), so the texts it shows are read from its Danish messages. They are
// TypeScript, which Node does not run in node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), so esbuild bundles
// them to plain JavaScript first, as the editor's own build does, and the result is imported from memory.
const i18nDir = fileURLToPath(new URL('../src/i18n/da-DK/', import.meta.url));
const bundled = await build({
  stdin: {
    contents: ['apps', 'app', 'cms', 'dashboard', 'common', 'library'].map((name) => `export { ${name} } from './${name}.ts';`).join('\n'),
    resolveDir: i18nDir,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  logLevel: 'silent',
});
const texts = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const { apps: da, app: daApp, cms: daCms, dashboard: daDashboard, common: daCommon, library: daLibrary } = texts;

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
// SCREENS_DIR (the temporary folder's morpheme-screens by default): where the pictures go.
const shots = process.env.SCREENS_DIR || join(tmpdir(), 'morpheme-screens');
mkdirSync(shots, { recursive: true });
// The screens opened (each on both).
const opened = new Set();

// The links of Settings (#settings): the rows of its list, not the drawer's or the footer's links.
const settingsRows = () =>
  [...document.querySelectorAll('main a.list-item-container')].map((a) => ({
    href: a.getAttribute('href'),
    text: a.innerText.trim().split('\n')[0],
  }));
// The items of a drawer's or rail's first level that are shown (the other levels' items are in the page, with no size), top to bottom.
const shownItems = (selector) =>
  [...document.querySelectorAll(selector)]
    .map((e) => ({ href: e.getAttribute('href'), text: e.innerText.trim(), tag: e.tagName, ...e.getBoundingClientRect().toJSON() }))
    .filter((e) => e.width > 0 && e.height > 0);

/** The "New in" card on the start screen, with the tall portrait photo of the 0.16 edition (1280x2272) in place of its own: the photo and the card stay inside the card's own box and above the widgets, never painted over them (375, 690 and 1280 px). */
async function checkUpdatesCard(width, height) {
  const label = `${width}px`;
  const tall = readFileSync(resolve(ROOT, '../../../release-notes/editions/0.16.webp'));
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label} start: ${e.message}`));
  await page.route('**/_astro/*.webp', (r) => r.fulfill({ body: tall, contentType: 'image/webp' }));
  await openEditor(page, site);
  await page.waitForSelector('#updates-title');
  await page.waitForTimeout(500);
  const box = await page.evaluate(() => {
    const card = document.querySelector('#updates-title').closest('section');
    const r = (e) => e && e.getBoundingClientRect().toJSON();
    const cells = [...document.querySelectorAll('main .grid.items-start > *')].map(r);
    return {
      card: r(card),
      img: r(card.querySelector('img')),
      buttons: [...card.querySelectorAll('.mt-auto a, .mt-auto button')].map(r),
      cells,
    };
  });
  const inside = (b) =>
    b.top >= box.card.top - 1 && b.bottom <= box.card.bottom + 1 && b.left >= box.card.left - 1 && b.right <= box.card.right + 1;
  if (box.img && !inside(box.img)) problems.push(`${label} start: the edition photo is painted outside its card`);
  if (box.buttons.some((b) => !inside(b))) problems.push(`${label} start: a button of the "New in" card is outside the card`);
  if (box.cells.some((c) => c.top < box.card.bottom - 1)) problems.push(`${label} start: the "New in" card overlaps the widgets under it`);
  await page.close();
}

/** On a phone the text's floating row is a docked bottom sheet: the same size and the same place (just over "Save changes", or over the keyboard) at every cursor, with all of the Text style, List and heading buttons in it. */
async function checkTextSheet() {
  const page = await browser.newPage({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`360px text sheet: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Fro');
  const read = () =>
    page.evaluate(() => {
      const m = document.querySelector('.editor-selection-menu');
      const r = m.getBoundingClientRect();
      const save = document.querySelector('.editor-save-bar')?.getBoundingClientRect().top ?? visualViewport.height;
      const names = [...m.querySelectorAll('button:not([hidden])')].map((b) => b.getAttribute('aria-label'));
      return { shown: !m.hidden, sheet: m.classList.contains('editor-selection-sheet'), r: r.toJSON(), save, names };
    });
  await page.waitForTimeout(1200);
  const first = await read();
  await page.keyboard.type(' and more');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Next');
  await page.waitForTimeout(1200);
  const second = await read();
  for (const [name, now] of [
    ['first line', first],
    ['second line', second],
  ]) {
    if (!now.shown || !now.sheet) problems.push(`360px text sheet: no docked sheet at the ${name}`);
    else if (Math.abs(now.r.bottom - now.save) > 1 || now.r.width < 359)
      problems.push(`360px text sheet: not docked over Save changes at the ${name}`);
    if (!now.names.some((n) => n.startsWith('Text style')) || !now.names.includes('List'))
      problems.push(`360px text sheet: the Text style or List button is missing at the ${name}`);
  }
  if (first.r.height !== second.r.height || first.r.top !== second.r.top)
    problems.push('360px text sheet: the sheet moved or changed size with the cursor');
  await page.setViewportSize({ width: 360, height: 420 });
  await page.waitForTimeout(500);
  const keyboard = await read();
  if (Math.abs(keyboard.r.bottom - keyboard.save) > 1 || keyboard.r.height !== first.r.height)
    problems.push('360px text sheet: it does not follow the keyboard at its own size');
  // The top toolbar's tools rest in one colour (the kind menus too), and a menu button is never in the accent.
  const colours = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll('.editor-tools button:not([aria-pressed="true"])')]
        .filter((b) => b.querySelector('svg'))
        .map((b) => getComputedStyle(b).color),
    ),
  ]);
  if (colours.length > 1) problems.push(`360px text toolbar: its tools rest in ${colours.length} colours (${colours.join(', ')})`);
  await page.close();
}

/** Settings lists the six screens A-Z, the cog is the last item at the bottom of the menu (drawer, rail) and is marked on Settings' screens only. */
async function checkSettingsAndMenu(width, height) {
  const label = `${width}px`;
  const moved = ['appearance', 'assistants', 'privacy', 'developer', 'licenses', 'morpheme'];
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label} menu: ${e.message}`));
  await openEditor(page, site);
  const go = async (hash) => {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(250);
  };

  // Settings: six rows, A-Z by the names the editor shows.
  await go('settings');
  const rows = await page.evaluate(settingsRows);
  const sorted = [...rows].sort((a, b) => a.text.localeCompare(b.text, 'da'));
  const names = rows.map((r) => `${r.text} (${r.href})`).join(', ');
  if (rows.length !== 6) problems.push(`${label} #settings: ${rows.length} rows instead of 6: ${names}`);
  else if (rows.some((r, i) => r.href !== sorted[i].href))
    problems.push(`${label} #settings: the rows are not in alphabetical order by name: ${names}`);
  const hrefs = rows.map((r) => r.href).sort();
  if (
    hrefs.join() !==
    moved
      .map((m) => `#${m}`)
      .sort()
      .join()
  )
    problems.push(`${label} #settings: forkerte links: ${names}`);

  // The drawer's first level (in the page at both widths: the standard drawer, or the modal one, shut): no link to the moved screens.
  await go('');
  const drawerLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.editor-main-drawer-panel nav a[href^="#"]')].map((a) => a.getAttribute('href')),
  );
  for (const m of moved) if (drawerLinks.includes(`#${m}`)) problems.push(`${label} menu: the menu has a link to #${m}`);

  const drawer = '.editor-main-drawer-panel nav';
  if (width >= 1000) {
    // The standard drawer is open: four sections, the start screen and the cog, and the cog last, at the bottom.
    const items = await page.evaluate(shownItems, `${drawer} .navigation-drawer-item`);
    const sections = items.filter((i) => i.tag === 'BUTTON').length;
    const links = items.filter((i) => i.tag === 'A').map((i) => i.href);
    // Under "Apps": Store, then the pages of the installed connectors, plugins and themes, and no app installed.
    const appRows = ['#settings/appstore', '#installed/connectors', '#installed/plugins', '#appearance/themes'];
    const apps = ['#', ...appRows, '#settings'];
    if (sections !== 3 || links.join() !== apps.join())
      problems.push(
        `${label} menu: the first level has ${sections} sections and the links ${links.join(', ')} (should be 3 and ${apps.join(', ')})`,
      );
    // Each row under "Apps" has an icon.
    const noIcon = await page.evaluate(
      ({ d, appRows }) =>
        [...document.querySelectorAll(appRows.map((h) => `${d} a[href="${h}"]`).join(', '))]
          .filter((a) => !a.querySelector('.navigation-drawer-icon svg'))
          .map((a) => a.getAttribute('href')),
      { d: drawer, appRows },
    );
    if (noIcon.length) problems.push(`${label} menu: no icon on ${noIcon.join(', ')}`);
    checkCog(label, 'menuen', items, height);
  } else {
    // The modal drawer: open it with the top bar's button.
    await page.locator('header').getByRole('button', { name: '\u00c5bn menuen' }).first().click();
    await page.waitForTimeout(600);
    checkCog(label, 'menuen', await page.evaluate(shownItems, `${drawer} .navigation-drawer-item`), height);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // The cog is marked on Settings' screens (not on the app store's, which is a screen of Apps) and nowhere else.
  const current = () =>
    page.evaluate((d) => document.querySelector(`${d} a[href="#settings"]`)?.getAttribute('aria-current') ?? null, drawer);
  for (const [hash, marked] of [
    ['appearance/colors', true],
    ['developer/caching', true],
    ['privacy', true],
    ['settings', true],
    ['list/pages', false],
    ['settings/appstore', false],
  ]) {
    await go(hash);
    if (((await current()) === 'page') !== marked) problems.push(`${label} #${hash}: the cog ${marked ? 'must' : 'must not'} be selected`);
  }

  if (width >= 1000) {
    // The collapsed rail: the cog at its bottom, under every other destination.
    await go('');
    await page.click('.editor-main-drawer-header button');
    await page.waitForTimeout(600);
    checkCog(label, 'skinnen', await page.evaluate(shownItems, 'nav.editor-main-rail .navigation-rail-item'), height);
    const railCurrent = (hash) =>
      go(hash).then(() =>
        page.evaluate(() => document.querySelector('nav.editor-main-rail a[href="#settings"]')?.getAttribute('aria-current')),
      );
    if ((await railCurrent('appearance/colors')) !== 'page')
      problems.push(`${label} the rail #appearance/colors: the cog must be selected`);
    if ((await railCurrent('list/pages')) === 'page') problems.push(`${label} the rail #list/pages: the cog must not be selected`);
    await page.screenshot({ path: join(shots, 'rail.png') });
  }
  await page.close();
}

/** The start screen's edit mode: the top bar's "Edit dashboard" becomes "Done"; each card has its drag handle and its menu
 * (Move up and Move down, Move up disabled on the first card; no Settings for a widget without settings; Remove); a removed card
 * is gone; Done saves once (PUT /api/dashboard) and leaves edit mode; and a save that fails (a Worker without storage)
 * keeps edit mode and the draft, with the error as an alert. The default dashboard has the four CMS widgets; in edit mode
 * all four are drawn (the ones that hide when they have nothing to say render then), so there are four cards. */
async function checkDashboardEdit(width, height) {
  const label = `${width}px dashboard`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const dashboard = { saved: [], fail: null };
  await openEditor(page, site, {}, 'button', dashboard);
  await page.evaluate(() => (location.hash = ''));
  const widget = daLibrary.continueWidgetLabel;
  const edit = page.getByRole('button', { name: daDashboard.edit, exact: true });
  const done = page.getByRole('button', { name: daDashboard.done, exact: true });
  const cards = page.locator('[data-card]');
  const menuButton = page.getByRole('button', { name: daDashboard.cardMenu(widget), exact: true });
  const shown = (locator, name, wanted = true) =>
    locator
      .first()
      .waitFor({ state: wanted ? 'visible' : 'hidden', timeout: 5000 })
      .catch(() => problems.push(`${label}: ${name} ${wanted ? 'is missing' : 'is still shown'}`));

  await shown(edit, `the button "${daDashboard.edit}"`);
  // Not editing: the widgets that have something to say (Site status always does).
  await shown(page.getByRole('heading', { name: daLibrary.statusTitle, exact: true }), `the card "${daLibrary.statusTitle}"`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(shots, `dashboard-${width}.png`) });
  if (await done.count()) problems.push(`${label}: "${daDashboard.done}" is shown before the edit mode`);
  await edit.click();
  await shown(done, `the button "${daDashboard.done}"`);
  if (await edit.count()) problems.push(`${label}: "${daDashboard.edit}" is still shown in the edit mode`);
  await shown(cards, 'a card in its frame');
  const count = await cards.count();
  if (count !== 4) problems.push(`${label}: ${count} cards in the edit mode instead of 4`);
  for (const [name, button] of [
    ['the menu button', menuButton],
    ['the drag handle', page.getByRole('button', { name: daDashboard.dragCard(widget), exact: true })],
  ])
    if ((await button.count()) !== 1) problems.push(`${label}: ${name} is not on the Continue card`);
  for (const key of ['unfinishedWidgetLabel', 'blogRhythmWidgetLabel', 'statusWidgetLabel'])
    if ((await page.getByRole('group', { name: daLibrary[key], exact: true }).count()) !== 1)
      problems.push(`${label}: no card named "${daLibrary[key]}" in the edit mode`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(shots, `edit-mode-${width}.png`) });

  // The menu of the first card (Continue): Move up (disabled on the first card), Move down, no Settings, Remove.
  await menuButton.first().click();
  const item = (name) => page.getByRole('menuitem', { name, exact: true });
  await shown(item(daDashboard.remove), `"${daDashboard.remove}" in the card's menu`);
  for (const name of [daDashboard.moveUp, daDashboard.moveDown]) {
    if (!(await item(name).count())) problems.push(`${label}: "${name}" is missing in the card's menu`);
    else if ((await item(name).first().isDisabled()) !== (name === daDashboard.moveUp))
      problems.push(`${label}: "${name}" is ${name === daDashboard.moveUp ? 'not disabled' : 'disabled'} on the first of four cards`);
  }
  if (await item(daDashboard.settings).count()) problems.push(`${label}: "${daDashboard.settings}" is shown for a widget without settings`);
  if ((await menuButton.first().getAttribute('aria-haspopup')) !== 'menu') problems.push(`${label}: the menu button has no aria-haspopup`);
  await page.screenshot({ path: join(shots, `edit-mode-menu-${width}.png`) });

  // Remove, then Done: one PUT, a valid dashboard without the card, and the edit mode is left.
  await item(daDashboard.remove).click();
  await cards
    .nth(3)
    .waitFor({ state: 'detached', timeout: 5000 })
    .catch(() => problems.push(`${label}: the removed card is still shown`));
  await done.click();
  await shown(edit, `the button "${daDashboard.edit}" after Done`);
  if (await done.count()) problems.push(`${label}: "${daDashboard.done}" is still shown after a saved dashboard`);
  if (dashboard.saved.length !== 1) problems.push(`${label}: ${dashboard.saved.length} saves after Done instead of 1`);
  else {
    const { version, widgets } = dashboard.saved[0];
    if (version !== 1 || !Array.isArray(widgets)) problems.push(`${label}: the saved dashboard is not valid`);
    else if (widgets.some((p) => p.widget === 'cms:continue'))
      problems.push(`${label}: the removed widget is in the saved dashboard (${widgets.map((p) => p.widget).join(', ')})`);
  }

  // A save that fails: the alert, the edit mode and the draft stay.
  dashboard.saved.length = 0;
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('a[href^="#"]').length > 3, null, { timeout: 60_000 });
  await page.evaluate(() => (location.hash = ''));
  dashboard.fail = 'no-storage';
  await shown(edit, `the button "${daDashboard.edit}" (second visit)`);
  await edit.click();
  await shown(done, `the button "${daDashboard.done}" (second visit)`);
  const present = await cards.count();
  if (!present) problems.push(`${label}: no card on the second visit`);
  else {
    await menuButton.first().click();
    await item(daDashboard.remove).click();
    await cards
      .nth(present - 1)
      .waitFor({ state: 'detached', timeout: 5000 })
      .catch(() => problems.push(`${label}: the removed card (second visit) is still shown`));
  }
  await done.click();
  const alert = page.getByRole('alert').filter({ hasText: daDashboard.notSavedNoStorage });
  await shown(alert, `the alert "${daDashboard.notSavedNoStorage}"`);
  if (!(await done.isVisible()) || !(await done.isEnabled()))
    problems.push(`${label}: "${daDashboard.done}" is gone or disabled after a failed save`);
  if (await edit.count()) problems.push(`${label}: the edit mode was left after a failed save`);
  if (present && (await cards.count()) !== present - 1) problems.push(`${label}: the draft was lost after a failed save`);
  if (dashboard.saved.length) problems.push(`${label}: a failed save was recorded as saved`);
  await page.screenshot({ path: join(shots, `edit-mode-failed-${width}.png`) });
  await page.close();

  // Add widget, on a fresh page (the default dashboard: the four CMS widgets). The sheet lists the Continue widget with its
  // hint; a tap on it closes the sheet and adds a second card; Done sends one PUT with two Continue placements, each with
  // its own id.
  const adding = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  adding.on('pageerror', (e) => problems.push(`${label} (add widget): ${e.message}`));
  const added = { saved: [], fail: null };
  await openEditor(adding, site, {}, 'button', added);
  await adding.evaluate(() => (location.hash = ''));
  const addButton = adding.getByRole('button', { name: daDashboard.addWidget, exact: true });
  const sheet = adding.getByRole('dialog', { name: daDashboard.addWidget, exact: true });
  const addCards = adding.locator('[data-card]');
  const addDone = adding.getByRole('button', { name: daDashboard.done, exact: true });
  await adding.getByRole('button', { name: daDashboard.edit, exact: true }).click();
  await addDone
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => problems.push(`${label}: no edit mode for "${daDashboard.addWidget}"`));
  await addButton
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => problems.push(`${label}: the button "${daDashboard.addWidget}" is missing`));
  // Blog rhythm's settings (the first CMS widget with settings): its menu has Settings, which opens the sheet with its
  // field "Post every"; the sheet is closed with Cancel (nothing changes), opened again, "Week" is picked and saved. The
  // draft keeps it, and Done below sends it with the placement.
  const rhythm = daLibrary.blogRhythmWidgetLabel;
  const rhythmSheet = adding.getByRole('dialog', { name: daDashboard.settingsOf(rhythm), exact: true });
  const openRhythm = async () => {
    await adding.getByRole('button', { name: daDashboard.cardMenu(rhythm), exact: true }).click();
    await adding.getByRole('menuitem', { name: daDashboard.settings, exact: true }).click();
    await rhythmSheet.waitFor({ state: 'visible', timeout: 5000 });
  };
  try {
    await openRhythm();
    await adding.waitForTimeout(600);
    await adding.screenshot({ path: join(shots, `blog-rhythm-settings-${width}.png`) });
    await rhythmSheet.getByRole('button', { name: daCommon.cancel, exact: true }).click();
    await rhythmSheet.waitFor({ state: 'hidden', timeout: 5000 });
    await openRhythm();
    await rhythmSheet.getByText(daLibrary.blogRhythmEveryWeek, { exact: true }).first().click();
    await rhythmSheet.getByRole('button', { name: daCommon.save, exact: true }).click();
    await rhythmSheet.waitFor({ state: 'hidden', timeout: 5000 });
  } catch (e) {
    problems.push(`${label}: Blog rhythm's settings did not open and save through the sheet (${e.message.split('\n')[0]})`);
  }
  await addButton.click();
  await sheet
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => problems.push(`${label}: the sheet "${daDashboard.addWidget}" did not open`));
  const row = sheet.locator('li', { hasText: daLibrary.continueWidgetHint });
  if ((await row.count()) !== 1) problems.push(`${label}: ${await row.count()} rows with the hint of the Continue widget instead of 1`);
  else if (!(await row.first().innerText()).includes(daLibrary.continueWidgetLabel))
    problems.push(`${label}: the row of the Continue widget has no label "${daLibrary.continueWidgetLabel}"`);
  await adding.screenshot({ path: join(shots, `add-widget-${width}.png`) });

  // The tap on the row: the sheet closes, a second card is shown, both named by the widget's label.
  await row.first().click();
  await sheet.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => problems.push(`${label}: the sheet is still open after a pick`));
  await addCards
    .nth(1)
    .waitFor({ timeout: 5000 })
    .catch(() => problems.push(`${label}: no second card after the pick`));
  const named = adding.getByRole('group', { name: daLibrary.continueWidgetLabel, exact: true });
  if ((await named.count()) !== 2)
    problems.push(`${label}: ${await named.count()} cards named "${daLibrary.continueWidgetLabel}" instead of 2`);
  await adding.screenshot({ path: join(shots, `edit-mode-two-${width}.png`) });

  // Done: one PUT, two Continue placements with different ids, and Blog rhythm with the setting that was saved.
  await addDone.first().click();
  await adding
    .getByRole('button', { name: daDashboard.edit, exact: true })
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  if (added.saved.length !== 1) problems.push(`${label}: ${added.saved.length} saves after Done (add widget) instead of 1`);
  else {
    const continues = (added.saved[0]?.widgets ?? []).filter((p) => p.widget === 'cms:continue');
    const ids = new Set(continues.map((p) => p.id));
    if (continues.length !== 2 || ids.size !== 2)
      problems.push(`${label}: the saved dashboard has ${continues.length} Continue placements with ${ids.size} ids instead of 2 and 2`);
    const saved = (added.saved[0]?.widgets ?? []).find((p) => p.widget === 'cms:blog-rhythm');
    if (saved?.settings?.every !== 'week')
      problems.push(`${label}: Blog rhythm's saved settings are ${JSON.stringify(saved?.settings)} instead of {"every":"week"}`);
  }
  await adding.close();
}

// The cog is the last of `items` (shown, from the top) and at the bottom of the screen.
function checkCog(label, where, items, height) {
  const cog = items.find((i) => i.href === '#settings');
  if (!cog) return problems.push(`${label} ${where}: the cog (#settings) is missing or hidden`);
  if (items.at(-1) !== cog || items.some((i) => i !== cog && i.bottom >= cog.bottom))
    problems.push(`${label} ${where}: the cog is not the bottom item`);
  if (cog.bottom < height * 0.8 || cog.bottom > height)
    problems.push(`${label} ${where}: the cog is not at the bottom of the screen (${cog.bottom} of ${height})`);
}

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
  const starts = [
    '',
    'settings',
    'developer/parts',
    'appearance/themes',
    'seo',
    'settings/appstore',
    'installed/connectors',
    'installed/plugins',
    'apps',
  ];
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
  await checkSettingsAndMenu(width, height);
  await checkDashboardEdit(width, height);
}

// "Appstore" and "Morpheme" in the three states of the site's key to the store (STORE_STATES): what each shows, and a picture of it in
// SCREENS_DIR.
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
// "Morpheme" in every state: the version, the problems and the notes are text (CMS_STATUS in built-site.mjs), every list row
// has an action (a link or a button), and Update and the connection work. The one row without an action of its own is the
// store connection's "Connected to Morpheme" (it shows the state; its button "Disconnect" is beside it, and the
// key states above check that it is there), so that row is left out.
async function checkMorpheme(page, state) {
  const text = await page.evaluate(() => document.querySelector('main').innerText);
  for (const x of [
    `Version ${CMS_STATUS.running}`,
    'Version 99.0.0 er klar',
    'Hjemmesiden har ingen GitHub-n\u00f8gle',
    'A made-up note for the checks.',
  ])
    if (!text.includes(x)) problems.push(`morpheme (${state}): "${x}" is missing`);
  const bare = await page.evaluate(
    (connected) =>
      [...document.querySelectorAll('main .list-item-container')]
        .filter((row) => !row.matches('a[href], button') && !row.closest('li')?.querySelector('a[href], button'))
        .filter((row) => !row.innerText.startsWith(connected))
        .map((row) => row.innerText.trim().split('\n')[0]),
    da.connected,
  );
  if (bare.length) problems.push(`morpheme (${state}): rows without an action: ${bare.join(', ')}`);

  // Update: a POST to /api/cms/update (answered here, nothing is changed).
  await page.route('**/api/cms/update', (r) => r.fulfill({ contentType: 'application/json', body: '{}' }));
  // The catch is attached at once: a rejection while the click is still running must not crash Node.
  const posted = page
    .waitForRequest((r) => r.url().endsWith('/api/cms/update') && r.method() === 'POST', { timeout: 10000 })
    .then(
      () => true,
      () => false,
    );
  await page.getByRole('button', { name: daCms.update, exact: true }).click();
  if (!(await posted)) problems.push(`morpheme (${state}): Update does not send a POST to /api/cms/update`);
  // The connection: Connect makes the site connected (the fake store flips on the POST).
  if (state === 'open') {
    await page.getByRole('button', { name: da.connect, exact: true }).click();
    await page
      .getByText(da.connected)
      .first()
      .waitFor({ timeout: 3000 })
      .catch(() => problems.push('morpheme (open): "Connected to Morpheme" did not appear after Connect'));
  }
}

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
    if (screen === 'morpheme') await checkMorpheme(page, state);
  }
  await page.close();
}

for (const [width, height] of [
  [375, 800],
  [690, 860],
  [1280, 900],
])
  await checkUpdatesCard(width, height);

await checkTextSheet();

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
