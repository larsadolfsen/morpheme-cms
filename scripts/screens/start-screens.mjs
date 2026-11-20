import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { CMS_STATUS, openEditor } from '../built-site.mjs';
import {
  browser,
  da,
  daApp,
  daCms,
  daCommon,
  daDashboard,
  daLibrary,
  fallbackAt,
  missingIcon,
  opened,
  phosphorProblems,
  problems,
  settingsRows,
  shots,
  shownItems,
  site,
} from './support/context.mjs';
import { allowedKeys, collect, compare, keysOf, problemsOf, readAllowlist, scan, scanRuns } from '../a11y.mjs';
import { judge, keyboardRuns, viewportOf, walk } from '../keyboard.mjs';
import { PHONE_FLOWS, FLOWS, runFlow } from '../keyboard-flows.mjs';

/** Keyboard focus is visible (Modern Web Guidance, `accessibility`: "Don't disable browser native focus indicators without providing a
 * replacement ... at least 3:1", WCAG 2.4.7 and 1.4.11; the 13 `outline: none` of the theme and the editor, A1 of the audit of 15 Nov 2026).
 * Tabs through every stop of a screen; at each one it takes a picture of the element and 12 px around it focused and unfocused, and
 * fails when nothing changed (no indicator) or when the changed pixels have less than 3:1 contrast between the two (a state layer alone).
 * An element that is only read by a screen reader (the radio in a ChoiceTile) is measured on the label that holds it.
 * FOCUS_ALLOW: the stops that are allowed to show only the caret, each with its reason. */
const FOCUS_ALLOW = [];
async function checkFocusIndicators(width, hash) {
  const label = `${width}px focus indicators ${hash || 'start'}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height: phone ? 800 : 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate((h) => (location.hash = h), hash);
  await page.waitForTimeout(800);
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  const lum = (r, g, b) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const seen = new Set();
  let stops = 0;
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
    // Tab only scrolls a stop into view when it is hidden: one cut by the window's edge hides its indicator, so it is centred first.
    const hasStop = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return false;
      e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      return true;
    });
    // Then two frames to settle: a stop in a part that CSS anchor positioning places (the rich tooltip's link) is laid out again
    // after the scroll, and measured at once it is still where it was before it.
    if (hasStop) await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    const info = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      let box = e.getBoundingClientRect();
      // A hidden control (the radio of a ChoiceTile) shows its focus on the label that holds it.
      if (box.width < 4 || box.height < 4) box = (e.closest('label') ?? e.parentElement).getBoundingClientRect();
      const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).join('.') : '';
      return {
        name: `${e.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : ''}`,
        key: `${e.outerHTML.slice(0, 160)}@${Math.round(box.x)},${Math.round(box.y)}`,
        x: box.x,
        y: box.y,
        w: box.width,
        h: box.height,
      };
    });
    if (!info) break;
    if (seen.has(info.key)) break;
    seen.add(info.key);
    const pad = 12;
    const vh = phone ? 800 : 900;
    if (info.w < 4 || info.h < 4 || info.y + info.h < 0 || info.y > vh - 4 || info.x + info.w < 0 || info.x > width - 4) continue;
    const x = Math.max(0, Math.floor(info.x - pad));
    const y = Math.max(0, Math.floor(info.y - pad));
    const clip = { x, y, width: Math.ceil(Math.min(info.w + 2 * pad, width - x)), height: Math.ceil(Math.min(info.h + 2 * pad, vh - y)) };
    const focused = await page.screenshot({ clip }).catch(() => null);
    if (!focused) continue;
    stops++;
    await page.evaluate(() => document.activeElement.blur());
    await page.waitForTimeout(250);
    const plain = await page.screenshot({ clip });
    const a = await sharp(focused).raw().toBuffer({ resolveWithObject: true });
    const b = await sharp(plain).raw().toBuffer();
    const channels = a.info.channels;
    let changed = 0;
    let best = 1;
    for (let k = 0; k < a.data.length; k += channels) {
      if (Math.abs(a.data[k] - b[k]) + Math.abs(a.data[k + 1] - b[k + 1]) + Math.abs(a.data[k + 2] - b[k + 2]) <= 24) continue;
      changed++;
      const l1 = lum(a.data[k], a.data[k + 1], a.data[k + 2]);
      const l2 = lum(b[k], b[k + 1], b[k + 2]);
      best = Math.max(best, (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
    }
    if (FOCUS_ALLOW.some((allowed) => allowed.match.test(info.name))) continue;
    if (changed < 12 || best < 3) await sharp(focused).toFile(join(shots, `focus-${width}-${stops}.png`));
    if (changed < 12) problems.push(`${label}: ${info.name} shows no indicator when it has the keyboard focus`);
    else if (best < 3)
      problems.push(`${label}: the focus indicator of ${info.name} (${info.key}) has ${best.toFixed(2)}:1 contrast, under 3:1`);
  }
  if (stops < 5) problems.push(`${label}: only ${stops} stops were checked`);
  await page.close();
}

/** The "New in" card on the start screen, with the tall portrait photo of the 0.16 edition (1280x2272) in place of its own: the photo and the card stay inside the card's own box and above the widgets, never painted over them (375, 690 and 1280 px). */
async function checkUpdatesCard(width, height) {
  const label = `${width}px`;
  const tall = readFileSync(fileURLToPath(new URL('../../release-notes/editions/0.16.webp', import.meta.url)));
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label} start: ${e.message}`));
  await page.route('**/_astro/*.webp', (r) => r.fulfill({ body: tall, contentType: 'image/webp' }));
  await openEditor(page, site);
  await page.waitForSelector('#updates-title');
  await page.waitForTimeout(500);
  const box = await page.evaluate(() => {
    const card = document.querySelector('#updates-title').closest('section');
    const r = (e) => e && e.getBoundingClientRect().toJSON();
    const cells = [...document.querySelectorAll('.mo-editor-dashboard-grid > *')].map(r).filter((b) => b.height > 0);
    return {
      card: r(card),
      img: r(card.querySelector('img')),
      buttons: [...card.querySelectorAll('.mo-editor-updates-notice-actions a, .mo-editor-updates-notice-actions button')].map(r),
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

/** Why the site can't update itself shows on the start screen (BlockedUpdateNotice.tsx, reasons in src/cmsBlocked.mjs), in each state the Worker's
 * status can have: the notice has its title, its sentence and a "Read more" link to the Morpheme page, stays inside the screen and does not
 * overlap what is under it; a site with nothing wrong, or a problem with no newer version waiting, shows none. */
async function checkBlockedNotice(width, height) {
  const running = '0.16.0';
  const waiting = { latest: '0.18.0' };
  const base = { running, token: true, kv: true };
  const states = [
    ['needs npm', { ...base, checked: { ...waiting, problem: { kind: 'needs-npm' } } }, daCms.blockedNeedsNpm('0.18.0')],
    ['cannot write', { ...base, checked: { ...waiting, problem: { kind: 'cannot-write' } } }, daCms.cannotWrite],
    [
      'theme',
      { ...base, checked: { ...waiting, problem: { kind: 'contract', item: 'theme', id: 'venus', why: 'incompatible' } } },
      daCms.blockedTheme('0.18.0', 'venus'),
    ],
    [
      'app, not sure',
      { ...base, checked: { ...waiting, problem: { kind: 'contract', item: 'app', id: 'mailchimp', why: 'could-not-confirm' } } },
      daCms.blockedAppUnsure('0.18.0', 'mailchimp'),
    ],
    ['no token', { ...base, token: false, checked: null }, daCms.blockedNoToken],
    ['no KV', { ...base, kv: false, checked: null }, daCms.blockedNoKv],
    ['nothing wrong', { ...base, checked: waiting }, null],
    ['a problem and no newer version', { ...base, checked: { latest: running, problem: { kind: 'needs-npm' } } }, null],
  ];
  for (const [name, status, text] of states) {
    const label = `${width}px start, blocked update (${name})`;
    const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site);
    await page.route(`${site}/api/cms`, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(status) }));
    await page.reload();
    await page.waitForSelector('main');
    await page.waitForTimeout(1500);
    const found = await page.evaluate((title) => {
      const card = [...document.querySelectorAll('main [role=status]')].find((e) => e.textContent.includes(title));
      if (!card) return null;
      const r = card.getBoundingClientRect();
      const next = [...document.querySelectorAll('main .mo-editor-dashboard-grid > *')]
        .map((e) => e.getBoundingClientRect())
        .filter((b) => b.height > 0)
        .map((b) => b.top);
      const link = card.querySelector('a');
      return {
        text: card.textContent,
        box: { left: r.left, right: r.right, bottom: r.bottom },
        overlaps: next.some((top) => top < r.bottom - 1),
        href: link?.getAttribute('href'),
        link: link?.textContent.trim(),
        scrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    }, daCms.blockedTitle);
    if (text === null) {
      if (found) problems.push(`${label}: the notice shows, and should not`);
    } else if (!found) problems.push(`${label}: the notice "${daCms.blockedTitle}" is missing`);
    else {
      if (!found.text.includes(text)) problems.push(`${label}: the notice says "${found.text}", expected "${text}"`);
      if (found.href !== '#morpheme' || found.link !== daLibrary.readMore)
        problems.push(`${label}: the link is "${found.link}" to ${found.href}`);
      if (found.box.left < 0 || found.box.right > width + 1) problems.push(`${label}: the notice is outside the screen`);
      if (found.overlaps) problems.push(`${label}: the notice overlaps the widgets under it`);
      if (found.scrollsSideways) problems.push(`${label}: the page scrolls sideways`);
      if (name === 'theme')
        await page
          .locator('main [role=status]', { hasText: daCms.blockedTitle })
          .screenshot({ path: join(shots, `blocked-update-${width}.png`) });
    }
    await page.close();
  }
}

/** The start screen's subtitle in the top bar ("Updated 1:42 PM", or "Updated Nov 12" on an earlier day) never truncates on a phone: no ellipsis (scrollWidth <= clientWidth) and no "yesterday at" or "today at", in English and Danish, 375 and 390 px, with the widest time (11:42 PM) today. (At 360 px the bar leaves the subtitle about 100 px, which "Updated 11:42 PM" does not fit.) */
async function checkStartSubtitle() {
  const today = new Date();
  today.setHours(23, 42, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  for (const [locale, width] of [
    ['en-US', 375],
    ['en-US', 390],
    ['da-DK', 375],
  ]) {
    for (const builtAt of [today, yesterday]) {
      const label = `${width}px ${locale} start subtitle (${builtAt.toDateString()})`;
      const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: true, isMobile: true, locale });
      page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
      await page.route('**/editor/version.json', (r) => r.fulfill({ json: { commit: 'a'.repeat(40), builtAt: builtAt.toISOString() } }));
      await openEditor(page, site);
      const subtitle = await page.waitForSelector('[data-subtitle]', { timeout: 30_000 });
      await page.waitForFunction((e) => /\d/.test(e.textContent), subtitle, { timeout: 10_000 }).catch(() => {});
      const got = await subtitle.evaluate((e) => ({ text: e.innerText.trim(), scroll: e.scrollWidth, client: e.clientWidth }));
      if (got.scroll > got.client) problems.push(`${label}: "${got.text}" is cut off (${got.scroll} > ${got.client})`);
      if (/yesterday|today|\bat\b/i.test(got.text)) problems.push(`${label}: the long form is back: "${got.text}"`);
      // The site's name in the bar is not cut off either (owner: "Mor…" at 375 px): the title of the start screen's bar shows whole.
      const name = await page.evaluate(() => {
        const h = [...document.querySelectorAll('header h1')].find((e) => e.getClientRects().length > 0);
        return h ? { text: h.textContent.trim(), scroll: h.scrollWidth, client: h.clientWidth } : null;
      });
      if (name && name.scroll > name.client)
        problems.push(`${label}: the site name "${name.text}" is cut off (${name.scroll} > ${name.client})`);
      await page.close();
    }
  }
}

/** Settings lists the seven screens A-Z, the cog is the last item at the bottom of the menu (drawer, rail) and is marked on Settings' screens only. */
async function checkSettingsAndMenu(width, height) {
  const label = `${width}px`;
  const moved = ['appearance', 'assistants', 'block-settings', 'developer/caching', 'developer/parts', 'morpheme', 'privacy'];
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label} menu: ${e.message}`));
  await openEditor(page, site);
  const go = async (hash) => {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(250);
  };

  // Settings: seven rows, A-Z by the names the editor shows.
  await go('settings');
  const rows = await page.evaluate(settingsRows);
  const sorted = [...rows].sort((a, b) => a.text.localeCompare(b.text, 'da'));
  const names = rows.map((r) => `${r.text} (${r.href})`).join(', ');
  if (rows.length !== 7) problems.push(`${label} #settings: ${rows.length} rows instead of 7: ${names}`);
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

  // Icon packs: the three system packs (Material Symbols, Phosphor, Lucide) are listed, each with its samples (the Phosphor row has its name only: no Phosphor icon is drawn in the editor), and one is in use.
  // A site takes the package from node_modules, where a glob that skips it leaves the list empty.
  await go('appearance/icon-packs');
  await page.waitForTimeout(150);
  const packs = await page.evaluate(() =>
    [...document.querySelectorAll('main [role=img][aria-label] svg')]
      .map((svg) => svg.closest('[role=img]'))
      .filter((el, i, all) => all.indexOf(el) === i)
      .map((el) => ({ label: el.getAttribute('aria-label'), icons: el.querySelectorAll('svg').length })),
  );
  const packNames = ['Material Symbols', 'Lucide'];
  const listed = await page.evaluate(() => document.querySelector('main')?.innerText ?? '');
  if (!listed.includes('Phosphor')) problems.push(`${label} #appearance/icon-packs: the system pack Phosphor is not listed`);
  if (packs.some((p) => p.label === daLibrary.iconPackSamples('Phosphor')))
    problems.push(`${label} #appearance/icon-packs: the Phosphor row shows sample icons, but no Phosphor icon is drawn in the editor`);
  for (const name of packNames) {
    const found = packs.find((p) => p.label === daLibrary.iconPackSamples(name));
    if (!found) problems.push(`${label} #appearance/icon-packs: the system pack ${name} is not listed (${packs.length} packs listed)`);
    else if (found.icons < 1) problems.push(`${label} #appearance/icon-packs: ${name} shows no sample icons`);
  }

  // The drawer's first level (in the page at both widths: the standard drawer, or the modal one, shut): no link to the moved screens.
  await go('');
  const drawerLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-editor-main-drawer-panel nav a[href^="#"]')].map((a) => a.getAttribute('href')),
  );
  for (const m of moved) if (drawerLinks.includes(`#${m}`)) problems.push(`${label} menu: the menu has a link to #${m}`);

  const drawer = '.mo-editor-main-drawer-panel nav';
  if (width >= 1000) {
    // The standard drawer is open: four sections, the start screen and the cog, and the cog last, at the bottom.
    const items = await page.evaluate(shownItems, `${drawer} .mo-navigation-drawer__item`);
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
          .filter((a) => !a.querySelector('.mo-navigation-drawer__icon svg'))
          .map((a) => a.getAttribute('href')),
      { d: drawer, appRows },
    );
    if (noIcon.length) problems.push(`${label} menu: no icon on ${noIcon.join(', ')}`);
    checkCog(label, 'menuen', items, height);
  } else {
    // The modal drawer: open it with the top bar's button.
    await page.locator('header').getByRole('button', { name: '\u00c5bn menuen' }).first().click();
    await page.waitForTimeout(600);
    checkCog(label, 'menuen', await page.evaluate(shownItems, `${drawer} .mo-navigation-drawer__item`), height);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // The cog is marked on Settings' screens (not on the app store's, which is a screen of Apps) and nowhere else.
  const current = () =>
    page.evaluate((d) => document.querySelector(`${d} a[href="#settings"]`)?.getAttribute('aria-current') ?? null, drawer);
  for (const [hash, marked] of [
    ['appearance/theme-store', true],
    ['block-settings', true],
    ['developer/caching', true],
    ['developer/parts', true],
    ['developer/parts/editor', true],
    ['company/colors', false],
    ['global/header', false],
    ['global/footer', false],
    ['global/side-column', false],
    ['blocks', false],
    ['licenses', false],
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
    await page.click('.mo-editor-main-drawer-header button');
    await page.waitForTimeout(600);
    checkCog(label, 'skinnen', await page.evaluate(shownItems, 'nav.mo-editor-main-rail .mo-navigation-rail__item'), height);
    const railCurrent = (hash) =>
      go(hash).then(() =>
        page.evaluate(() => document.querySelector('nav.mo-editor-main-rail a[href="#settings"]')?.getAttribute('aria-current')),
      );
    if ((await railCurrent('developer/caching')) !== 'page')
      problems.push(`${label} the rail #developer/caching: the cog must be selected`);
    for (const hash of ['company/colors', 'global/header', 'licenses'])
      if ((await railCurrent(hash)) === 'page') problems.push(`${label} the rail #${hash}: the cog must not be selected`);
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
  // "Edit dashboard" is a text button below the last widget, not in the top bar, with its icon before the text.
  const editBox = await edit.first().boundingBox();
  const lastWidgetBottom = await page.evaluate(() => {
    const main = document.querySelector('main.mo-editor-screen');
    const headings = [...(main?.querySelectorAll('h2, h3') ?? [])];
    return Math.max(0, ...headings.map((h) => h.getBoundingClientRect().bottom));
  });
  if (!editBox || editBox.y < lastWidgetBottom) problems.push(`${label}: "${daDashboard.edit}" is not below the last widget`);
  if (await page.locator('header, [role="banner"]').getByRole('button', { name: daDashboard.edit, exact: true }).count())
    problems.push(`${label}: "${daDashboard.edit}" is still in the top bar`);
  if (!(await edit.first().locator('svg').count())) problems.push(`${label}: "${daDashboard.edit}" has no leading icon`);
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
  // From 600 dp the settings are the pane beside the page (a standard side sheet), below it a dialog.
  const rhythmSheet =
    width < 600
      ? adding.getByRole('dialog', { name: daDashboard.settingsOf(rhythm), exact: true })
      : adding.locator('.mo-editor-side-sheet').filter({ hasText: daDashboard.settingsOf(rhythm) });
  const openRhythm = async () => {
    await adding.getByRole('button', { name: daDashboard.cardMenu(rhythm), exact: true }).click();
    await adding.getByRole('menuitem', { name: daDashboard.settings, exact: true }).click();
    await rhythmSheet.waitFor({ state: 'visible', timeout: 5000 });
  };
  // Which step is running, so a timeout below names it (a diagnostic).
  let step = 'open the sheet';
  try {
    await openRhythm();
    await adding.waitForTimeout(600);
    await adding.screenshot({ path: join(shots, `blog-rhythm-settings-${width}.png`) });
    step = 'Cancel';
    await rhythmSheet.getByRole('button', { name: daCommon.cancel, exact: true }).click();
    step = 'the sheet closes after Cancel';
    await rhythmSheet.waitFor({ state: 'hidden', timeout: 5000 });
    step = 'open the sheet again';
    await openRhythm();
    step = 'pick Week and Save';
    // The visible one: the choice group also holds its unseen measuring row and the other form.
    await rhythmSheet.getByText(daLibrary.blogRhythmEveryWeek, { exact: true }).filter({ visible: true }).first().click();
    await rhythmSheet.getByRole('button', { name: daCommon.save, exact: true }).click();
    step = 'the sheet closes after Save';
    await rhythmSheet.waitFor({ state: 'hidden', timeout: 5000 });
  } catch (e) {
    const shown = await adding
      .evaluate(() => ({
        sheets: [...document.querySelectorAll('.mo-editor-side-sheet, dialog[open]')].map((n) => ({
          visible: n.checkVisibility(),
          text: n.textContent.slice(0, 40),
        })),
      }))
      .then((v) => JSON.stringify(v))
      .catch(() => 'state not readable');
    problems.push(
      `${label}: Blog rhythm's settings did not open and save through the sheet, at the step "${step}" (${e.message.split('\n')[0]}; ${shown})`,
    );
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

/** The start screen's "Drafts" card: with five drafts it shows three rows and the text button "Show all", which opens the pages
 * list filtered to the drafts (all five, and the filter chip); with up to three drafts there is no button. */
async function checkDraftsCard(width, height) {
  const label = `${width}px drafts card`;
  const draft = (n) => `---\ntitle: "Draft ${n}"\nstatus: draft\n---\n\nText\n`;
  const many = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`src/content/pages/check-draft-${n}.md`, draft(n)]));
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, many);
  await page.evaluate(() => (location.hash = ''));
  const card = page.getByRole('region', { name: daLibrary.unfinishedTitle, exact: true });
  await card
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => problems.push(`${label}: the card "${daLibrary.unfinishedTitle}" is missing`));
  const rows = await card.getByRole('listitem').count();
  if (rows !== 3) problems.push(`${label}: ${rows} rows instead of 3`);
  const all = card.getByRole('link', { name: daLibrary.unfinishedShowAll, exact: true });
  if ((await all.count()) !== 1) problems.push(`${label}: no "${daLibrary.unfinishedShowAll}" button`);
  else {
    const box = await all.boundingBox();
    if (!box || box.x < 0 || box.x + box.width > width) problems.push(`${label}: "${daLibrary.unfinishedShowAll}" is outside the screen`);
    await card.screenshot({ path: join(shots, `drafts-card-${width}.png`) });
    await all.click();
    await page
      .waitForFunction(() => location.hash.startsWith('#list/pages'), null, { timeout: 5000 })
      .catch(() => problems.push(`${label}: "Show all" did not open the pages list`));
    // The list fills in after the screen opens (slower on a runner): wait for the five rows before counting.
    await page
      .waitForFunction(() => document.querySelectorAll('a[href*="check-draft-"]').length >= 5, null, { timeout: 10000 })
      .catch(() => {});
    const listed = await page.locator('a[href*="check-draft-"]').count();
    if (listed !== 5) problems.push(`${label}: the list shows ${listed} of the 5 drafts`);
  }
  await page.close();
  // Three drafts or fewer: no button.
  const few = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  few.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(few, site, Object.fromEntries(Object.entries(many).slice(0, 3)));
  await few.evaluate(() => (location.hash = ''));
  await few
    .getByRole('region', { name: daLibrary.unfinishedTitle, exact: true })
    .waitFor({ timeout: 5000 })
    .catch(() => problems.push(`${label}: the card is missing with three drafts`));
  if (await few.getByRole('link', { name: daLibrary.unfinishedShowAll, exact: true }).count())
    problems.push(`${label}: "${daLibrary.unfinishedShowAll}" is shown with only three drafts`);
  await few.close();
}

// "Appstore" and "Morpheme" in the three states of the site's key to the store (STORE_STATES): what each shows, and an image of it in
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
    'Hjemmesiden har intet GitHub-token',
    'A made-up note for the checks.',
  ])
    if (!text.includes(x)) problems.push(`morpheme (${state}): "${x}" is missing`);
  const bare = await page.evaluate(
    (connected) =>
      [...document.querySelectorAll('main .mo-list__item-container')]
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

/** The accessibility scan of one screen (WCAG 2.2 AA, axe-core): what it finds must be on scripts/a11y-allowlist.json and every entry of the
 * list for this screen at this width must still match, so the list only shrinks (scripts/a11y.mjs). The unit's width is the phone (390 px)
 * or the computer (1280 px); a screen of the list is checked on its own, so a shard that runs the unit checks every screen. */
async function checkA11y(page, width, hash) {
  // Only in the CMS repository: a site that installed the package has no axe-core, and the allowlist is the demo's (scripts/a11y.mjs, scanRuns).
  if (!scanRuns()) return;
  const viewport = width < 600 ? 'phone' : 'computer';
  const place = `#${hash}`;
  // The screen settles first: a list or a sheet that is still drawing would be a finding that is gone a moment later.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  const found = keysOf(await scan(page), place, viewport);
  if (process.env.A11Y_COLLECT) return collect(process.env.A11Y_COLLECT, found);
  const allowed = allowedKeys(readAllowlist(), (p) => p === place);
  for (const key of [...allowed.keys()]) if (!key.endsWith(`\t${viewport}`)) allowed.delete(key);
  problems.push(...problemsOf(compare(found, allowed)).map((line) => `${width}px ${line}`));
}

/** The keyboard walk of one screen (WCAG 2.2 AA: trap, covered, invisible and lost focus, no indicator; scripts/keyboard.mjs): what it finds must be on
 * scripts/keyboard-allowlist.json and every entry of the list for this screen at this width must still match, so the list only shrinks. Tab only, so
 * it runs after the screen's other checks; the screen is left without focus. */
async function checkKeyboard(page, width, hash) {
  // Only in the CMS repository: the allowlist is the demo's (scripts/keyboard.mjs, keyboardRuns).
  if (!keyboardRuns()) return;
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const { findings } = await walk(page);
  problems.push(...judge(findings, `#${hash}`, viewportOf(width)).map((line) => `${width}px ${line}`));
}

/** The main flows by keyboard (scripts/keyboard-flows.mjs): A to I at the computer, A, B and F also at the phone (375 px). */
async function checkKeyboardFlows(width) {
  if (!keyboardRuns()) return;
  for (const flow of FLOWS) {
    if (width < 600 && !PHONE_FLOWS.includes(flow)) continue;
    const { findings, errors } = await runFlow(browser, site, flow, width);
    problems.push(...errors.map((e) => `${width}px ${e}`));
    problems.push(...judge(findings, `flow ${flow}`, viewportOf(width)).map((line) => `${width}px ${line}`));
  }
}

export function register(unit) {
  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ]) {
    unit(`screens ${width}`, async () => {
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
            phosphor: [...document.querySelectorAll('svg[viewBox="0 0 256 256"]')].map(
              (e) => e.querySelector('path, rect, circle')?.getAttribute('d') ?? e.innerHTML.slice(0, 40),
            ),
          }));
          for (const d of new Set(state.phosphor)) problems.push(...phosphorProblems(`${width}px #${hash}`, d));
          // No sheet from the bottom starts taller than --mo-comp-bottom-sheet-start-max-height (half the screen, Material 3), on a phone.
          if (width < 600) {
            const tooTall = await page.evaluate(() => {
              const cap = innerHeight / 2 + 1;
              const bad = [];
              for (const d of document.querySelectorAll('dialog.mo-editor-sheet.mo-bottom-sheet:not(.mo-editor-side-panel)')) {
                if (d.open) continue;
                d.showModal();
                if (d.offsetHeight > cap) bad.push(`${d.getAttribute('aria-label') ?? d.className} (${Math.round(d.offsetHeight)}px)`);
                d.close();
              }
              return bad;
            });
            for (const name of tooTall) problems.push(`${width}px #${hash}: the sheet ${name} starts taller than half the screen`);
          }
          for (const name of new Set(state.fallback)) fallbackAt(name, `${width}px #${hash}`);
          for (const name of new Set(state.missing)) problems.push(`${width}px #${hash}: ${missingIcon(name)}`);
          if (state.empty) problems.push(`${width}px #${hash}: the screen is empty`);
          await checkA11y(page, width, hash);
          await checkKeyboard(page, width, hash);
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
    });
    unit(`checkSettingsAndMenu ${width}`, () => checkSettingsAndMenu(width, height));
    unit(`checkDashboardEdit ${width}`, () => checkDashboardEdit(width, height));
  }

  unit('key states', async () => {
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
  });

  // Each check below is a unit (see unit above): a shard runs every SHARDS-th one, so the shards together run each exactly once.
  for (const [width, height] of [
    [375, 800],
    [690, 860],
    [1280, 900],
  ])
    unit(`checkUpdatesCard ${width}`, () => checkUpdatesCard(width, height));

  for (const [width, height] of [
    [375, 800],
    [1280, 900],
  ])
    unit(`checkBlockedNotice ${width}`, () => checkBlockedNotice(width, height));

  for (const width of [1280, 375]) unit(`checkKeyboardFlows ${width}`, () => checkKeyboardFlows(width));
  unit('checkStartSubtitle', () => checkStartSubtitle());
  for (const width of [375, 1280])
    for (const hash of ['', 'developer/parts/ui', 'developer/parts/editor', 'settings'])
      unit(`checkFocusIndicators ${width} ${hash || 'start'}`, () => checkFocusIndicators(width, hash));
  for (const [width, height] of [
    [360, 740],
    [375, 800],
    [1280, 900],
  ])
    unit(`checkDraftsCard ${width}`, () => checkDraftsCard(width, height));
}
