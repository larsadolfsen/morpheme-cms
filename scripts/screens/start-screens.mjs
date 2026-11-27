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
  daForms,
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
import { allowedKeys, collect, compare, keysOf, problemsOf, readAllowlist, scan, scanRuns, codeViolations } from '../a11y.mjs';
import { activeTheme, isMaterialTheme } from '../theme-statement.mjs';
import { shortfall } from './support/statement.mjs';
import { judge, keyboardRuns, viewportOf, walk } from '../keyboard.mjs';
import * as announce from '../announce.mjs';
import * as announceFlows from '../announce-flows.mjs';
import { PHONE_FLOWS, FLOWS, SITE_FLOW, runFlow, runSiteFlow } from '../keyboard-flows.mjs';

/** The WCAG scans (the axe scan, the keyboard walk and flows, the screen reader walk and flows) run only when WCAG_CHECKS=1 (owner, 27 Nov 2026: WCAG 2.2 is
 * not a rule for the site, the theme or the editor until the base theme, roadmap 0.27.3). CI does not set it; the base theme turns them back on by setting it.
 * The units stay registered, so their numbers and times do not move. */
const wcagOn = () => process.env.WCAG_CHECKS === '1';

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
    // The 3:1 measure is WCAG 1.4.11: printed, never failed (owner, 27 Nov 2026), until the base theme turns WCAG back on with WCAG_CHECKS=1.
    else if (best < 3 && wcagOn())
      shortfall(
        '1.4.11',
        'focus-ring',
        `${label}: the focus indicator of ${info.name} (${info.key}) has ${best.toFixed(2)}:1 contrast, under 3:1`,
      );
    else if (best < 3)
      console.log(
        `${label}: the focus indicator of ${info.name} (${info.key}) has ${best.toFixed(2)}:1 contrast, under 3:1 (measured, not failed)`,
      );
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

/** The start screen's cards (the notices, the first-run card and the dashboard) stand one card gap apart, 8px (M3 Cards, Specs), with nothing
 * larger between the version card and the next one. On a phone every card is in one column, so every gap down the column is the same. */
async function checkStartGaps(width, height) {
  const label = `${width}px start gaps`;
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.waitForSelector('.mo-editor-start-cards');
  await page.waitForTimeout(500);
  const gaps = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('.mo-editor-start-cards > *:not(.mo-editor-stack-200), .mo-editor-dashboard-grid > *')]
      .map((e) => e.getBoundingClientRect())
      .filter((b) => b.height > 0)
      .sort((a, b) => a.top - b.top);
    const out = [];
    for (let i = 1; i < boxes.length; i++)
      if (boxes[i].left < boxes[i - 1].right && boxes[i].top >= boxes[i - 1].bottom - 1)
        out.push(Math.round(boxes[i].top - boxes[i - 1].bottom));
    return out;
  });
  if (gaps.some((g) => g !== 8)) problems.push(`${label}: the gaps between the cards are ${gaps.join(', ')} px, not all 8`);
  await page.close();
}

/** The main navigation (the rail, and the standard drawer it opens into) is drawn in M3's surface container, not in the page's own colour
 * (Navigation rail, Specs, Color: the Container role is "Surface container"; 0.19.7, owner, 25 Nov 2026: the rail lost its colour again
 * when 0.19.5 dropped the editor's override and the part fell back to the surface). Measures the computed background of the rail's frame
 * and of the open drawer against probes painted with the two roles: it must equal --mo-sys-color-surface-container and differ from
 * --mo-sys-color-surface. Light and dark. */
async function checkMainNavColor(width, height) {
  const label = `${width}px main navigation colour`;
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
    page.on('pageerror', (e) => problems.push(`${label} ${scheme}: ${e.message}`));
    await openEditor(page, site);
    await page.waitForSelector('.mo-editor-main-rail-frame, .mo-navigation-drawer__standard, .mo-editor-main-drawer-frame', {
      state: 'attached',
    });
    await page.waitForTimeout(500);
    const measure = () =>
      page.evaluate(() => {
        const paint = (role) => {
          const probe = document.createElement('div');
          probe.style.cssText = `position:fixed;inline-size:1px;block-size:1px;background:var(--mo-sys-color-${role})`;
          document.body.append(probe);
          const c = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return c;
        };
        const bg = (sel) => {
          const e = document.querySelector(sel);
          return e && e.getBoundingClientRect().width > 0 ? getComputedStyle(e).backgroundColor : null;
        };
        return {
          container: paint('surface-container'),
          surface: paint('surface'),
          rail: bg('.mo-editor-main-rail-frame'),
          drawer: bg('.mo-navigation-drawer__standard'),
        };
      });
    const found = [];
    let m = await measure();
    if (m.rail) found.push(['the rail', m.rail]);
    if (m.drawer) found.push(['the drawer', m.drawer]);
    if (width >= 600 && !m.drawer) {
      // Open the drawer (the menu button in the rail) to measure it as well.
      await page
        .locator('nav.mo-editor-main-rail button, .mo-editor-main-rail-frame button')
        .first()
        .click({ timeout: 3000 })
        .catch(() => {});
      await page.waitForTimeout(600);
      m = await measure();
      if (m.drawer) found.push(['the open drawer', m.drawer]);
    }
    if (!found.length) problems.push(`${label} ${scheme}: neither the rail nor the drawer was found`);
    for (const [what, color] of found) {
      if (color === m.surface)
        problems.push(`${label} ${scheme}: ${what} is ${color}, the page's own surface colour; M3's role is surface-container`);
      else if (color !== m.container) problems.push(`${label} ${scheme}: ${what} is ${color}, not surface-container (${m.container})`);
    }
    await page.close();
  }
}

/** Every surface keeps its Material 3 container role (the drawer and rail lost theirs twice: 0.19.5 and 0.19.7). Each row is one variant or state of a
 * component with its own selector, the role M3's Specs page prints for it and the page that shows it; a variant that differs on purpose is its own
 * row (the full-screen search view is Surface container low, the divided one high; a standard bottom sheet at side-sheet width is a side sheet).
 * The colors page's preview shows the site's own colours in both schemes, so it is not measured, and the docked search view only draws while open. Measured light and dark at 1280: the computed background of every visible match must equal the role painted on a probe in the same page. */
const SURFACE_ROLES = [
  // [component and variant, selector, role, hash that shows it]
  ['Navigation drawer, standard', '.mo-navigation-drawer__standard', 'surface-container', ''],
  ['Navigation rail frame', '.mo-editor-main-rail-frame', 'surface-container', ''],
  ['Top app bar, at rest', '.mo-top-app-bar:not([data-stuck])', 'surface', ''],
  ['Page', 'body', 'surface', ''],
  ['Search bar', '.mo-search-bar', 'surface-container-high', ''],
  ['Dashboard widget (outlined card)', '.mo-editor-widget-list.mo-is-outlined, .mo-editor-widget-text.mo-is-outlined', 'surface', ''],
  ['Card, filled', '.mo-card.mo-is-filled', 'surface-container-highest', 'developer/parts/ui'],
  ['Card, elevated', '.mo-card.mo-is-elevated', 'surface-container-low', 'developer/parts/ui'],
  ['Rich tooltip', '.mo-tooltip.mo-is-rich', 'surface-container', ''],
  ['Theme list row', '.mo-editor-themes li, main li', 'surface', 'appearance/themes'],
  ['Navigation drawer, modal', '.mo-navigation-drawer:not(.mo-navigation-drawer__standard)', 'surface-container', 'developer/parts/ui'],
  ['Top app bar, scrolled', '.mo-top-app-bar[data-stuck]', 'surface-container', 'developer/parts/ui'],
  ['Navigation bar', '.mo-nav-bar', 'surface-container', 'developer/parts/ui'],
  ['Toolbar, docked', '.mo-toolbar.mo-is-standard', 'surface-container', 'developer/parts/ui'],
  ['Card, outlined (not selected)', '.mo-card.mo-is-outlined:not(.mo-is-selected)', 'surface', 'developer/parts/ui'],
  ['Card, outlined selected', '.mo-card.mo-is-outlined.mo-is-selected', 'secondary-container', 'developer/parts/ui'],
  ['Side sheet, standard', '.mo-sheet__container.mo-is-side:not(.mo-sheet__modal)', 'surface', 'developer/parts/ui'],
  ['Side sheet, modal', '.mo-sheet__modal', 'surface-container-low', 'developer/parts/ui'],
  ['Bottom sheet', '.mo-sheet__container.mo-is-bottom:not([data-wide="side-sheet"])', 'surface-container-low', 'developer/parts/ui'],
  [
    'Bottom sheet, standard at side-sheet width (a side sheet)',
    '.mo-sheet__container.mo-is-bottom[data-wide="side-sheet"]',
    'surface',
    'developer/parts/ui',
  ],
  ['Dialog', '.mo-dialog:not(.mo-is-full-screen)', 'surface-container-high', 'developer/parts/ui'],
  ['Menu', '.mo-menu:not(.mo-is-vibrant):not(:has(> .mo-menu__group:first-child))', 'surface-container-low', 'developer/parts/ui'],
  ['Menu, vibrant', '.mo-menu.mo-is-vibrant:not(:has(> .mo-menu__group:first-child))', 'tertiary-container', 'developer/parts/ui'],
  [
    'Menu group (gap between groups)',
    '.mo-menu:not(.mo-is-vibrant):not(.mo-menu__groups-divider) > .mo-menu__group',
    'surface-container-low',
    'developer/parts/ui',
  ],
  [
    'Search view, full screen (dialog)',
    '.mo-search:not(.mo-is-divided) > dialog.mo-search-view',
    'surface-container-low',
    'developer/parts/ui',
  ],
  [
    'Search view, divided style (dialog)',
    '.mo-search.mo-is-divided > dialog.mo-search-view',
    'surface-container-high',
    'developer/parts/ui',
  ],
  ['Scroll field list', '.mo-scroll-field__list', 'surface-container-lowest', 'developer/parts/ui'],
];

async function checkSurfaceRoles(width, height) {
  const label = `${width}px surface roles`;
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
    page.on('pageerror', (e) => problems.push(`${label} ${scheme}: ${e.message}`));
    await openEditor(page, site);
    await page.waitForSelector('.mo-top-app-bar', { state: 'attached' });
    for (const hash of [...new Set(SURFACE_ROLES.map((r) => r[3]))]) {
      await page.evaluate((h) => (location.hash = h), hash);
      await page.waitForTimeout(900);
      const rows = SURFACE_ROLES.filter((r) => r[3] === hash).map(([name, selector, role]) => ({ name, selector, role }));
      const out = await page.evaluate((rows) => {
        const paint = (role) => {
          const probe = document.createElement('div');
          probe.style.cssText = `position:fixed;inline-size:1px;block-size:1px;background:var(--mo-sys-color-${role})`;
          document.body.append(probe);
          const c = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return c;
        };
        return rows.map((r) => {
          const seen = new Set();
          for (const e of document.querySelectorAll(r.selector)) {
            const b = e.getBoundingClientRect();
            // A closed dialog and a hidden panel have no box: only what is drawn is measured.
            if (b.width > 0 && b.height > 0) seen.add(getComputedStyle(e).backgroundColor);
          }
          return { ...r, expected: paint(r.role), seen: [...seen] };
        });
      }, rows);
      for (const r of out) {
        // A row that matches nothing drawn would pass for ever: every row but the rail (it shows at a phone width; checkMainNavColor measures it) needs one.
        if (!r.seen.length && r.name !== 'Navigation rail frame')
          problems.push(`${label} ${scheme} #${hash || 'start'}: ${r.name} (${r.selector}) matched nothing drawn`);
        for (const c of r.seen)
          if (c !== r.expected) {
            // Material keeps the hard check; on any other theme the unit does not run (the colours are the site owner's, chosen in the colour editor).
            if (isMaterialTheme())
              problems.push(
                `${label} ${scheme} #${hash || 'start'}: ${r.name} (${r.selector}) is ${c}, M3's role is ${r.role} (${r.expected})`,
              );
          }
      }
    }
    await page.close();
  }
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

/** Style (C20): the main menu's section of seven pages. Each item opens its own page at #style/<name> with its title, the old addresses
 * land on the new ones, and Icons names Material Symbols only. */
async function checkStyleMenu(width, height) {
  const label = `${width}px style menu`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const go = async (hash) => {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(300);
  };
  const names = {
    color: 'Color',
    elevation: 'Elevation',
    icons: 'Icons',
    motion: 'Motion',
    shape: 'Shape',
    spacing: 'Spacing',
    typography: 'Typography',
  };
  for (const [name, title] of Object.entries(names)) {
    await go(`style/${name}`);
    const heading = await page.evaluate(
      () => document.querySelector('main h1, main [role=heading][aria-level="1"], header h1')?.textContent?.trim() ?? '',
    );
    if (heading !== title) problems.push(`${label} #style/${name}: the page's title is "${heading}" (should be "${title}")`);
  }
  for (const [old, now] of [
    ['company/colors', 'style/color'],
    ['appearance/motion', 'style/motion'],
    ['developer/parts/values', 'style/color'],
  ]) {
    await go(old);
    const hash = await page.evaluate(() => location.hash);
    if (hash !== `#${now}`) problems.push(`${label} #${old}: lands on ${hash} (should be #${now})`);
  }
  await go('style/icons');
  const text = await page.evaluate(() => document.querySelector('main')?.textContent ?? '');
  if (/phosphor|lucide/i.test(text)) problems.push(`${label} #style/icons: names Phosphor or Lucide`);
  await page.close();
}

/** Style is a section with a chevron, like Globals (owner, 26 Nov 2026: "Styles items should be a sublist like global. When on a submenu like global
 * write name eg Globals, inverted is back."). On the first level Style is a row with a chevron and its seven pages are not listed; its row opens the
 * list under a back row; the back row keeps the arrow (accessible name "Back to Main menu: <section>", which holds the visible text) and reads the section's name (Style, Globals), not "Back";
 * the open screen is marked; the back row returns to the first level. From 1000 px the collapsed rail has one Style item that opens the drawer at its
 * list. Material 3's Navigation drawer pages print nothing about a sub-level header (the nearest pattern is the header, Anatomy). */
async function checkStyleSublist(width, height) {
  const label = `${width}px style sublist`;
  const wide = width >= 1000;
  const names = ['Color', 'Elevation', 'Icons', 'Motion', 'Shape', 'Spacing', 'Typography'];
  const hrefs = names.map((n) => `#style/${n.toLowerCase()}`);
  const panel = '.mo-editor-main-drawer-panel';
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const go = async (hash) => {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(300);
  };
  const openDrawer = async () => {
    if (await page.locator(`${panel} nav`).first().isVisible()) return;
    await page
      .locator(wide ? 'nav.mo-editor-main-rail button[aria-expanded]' : 'header button[aria-expanded]')
      .first()
      .click();
    await page.waitForTimeout(600);
  };
  // What the drawer shows: the header's text and accessible name, and the visible rows.
  const read = () =>
    page.evaluate(
      ({ panel, selector }) => {
        const back = document.querySelector(`${panel} .mo-navigation-drawer__back`);
        const visible = (e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const typeOf = (e) => {
          const c = e && getComputedStyle(e);
          return c && [c.fontFamily, c.fontSize, c.fontWeight, c.lineHeight, c.letterSpacing].join(' | ');
        };
        return {
          back:
            back && visible(back)
              ? {
                  text: back.textContent.trim(),
                  name: back.getAttribute('aria-label'),
                  type: typeOf(back.querySelector('.mo-navigation-drawer__label')),
                  title: typeOf(document.querySelector('h1[data-screen-title]')),
                  target: Math.round(back.querySelector('.mo-navigation-drawer__icon').getBoundingClientRect().width),
                  glyph: Math.round(back.querySelector('.mo-navigation-drawer__icon svg').getBoundingClientRect().width),
                }
              : null,
          links: [...document.querySelectorAll(`${panel} nav a[href^="#style/"]`)].filter(visible).map((a) => ({
            href: a.getAttribute('href'),
            text: a.textContent.trim(),
            current: a.getAttribute('aria-current'),
            icon: !!a.querySelector('.mo-navigation-drawer__icon svg'),
          })),
          rows: [...document.querySelectorAll(`${panel} nav ${selector}`)].filter(visible).map((e) => e.textContent.trim()),
        };
      },
      { panel, selector: 'button.mo-navigation-drawer__item' },
    );
  const press = async (text) => {
    await page.locator(`${panel} nav button.mo-navigation-drawer__item`, { hasText: text }).first().click();
    await page.waitForTimeout(400);
  };

  // 1. The first level: a Style row, and no Style page listed.
  await go('');
  await openDrawer();
  let got = await read();
  if (got.back) problems.push(`${label}: the first level shows a back row ("${got.back.text}")`);
  if (!got.rows.some((r) => r === 'Style'))
    problems.push(`${label}: the first level has no Style row with a chevron (${got.rows.join(', ')})`);
  if (got.links.length) problems.push(`${label}: the first level lists Style pages (${got.links.map((l) => l.href).join(', ')})`);

  // 1b. The drawer's scrolling lists draw no scrollbar (M3 prints none) and still scroll: on a short screen the panel is higher than it
  // shows, takes scrollTop, and no space is kept for a bar.
  const full = await page.viewportSize();
  await page.setViewportSize({ width, height: 300 });
  await page.waitForTimeout(300);
  const bars = await page.evaluate((panel) => {
    const scrollers = [document.querySelector(panel), document.querySelector('.mo-editor-main-drawer-frame')]
      .concat(document.querySelector('.mo-editor-main-rail .mo-nav-rail__items'))
      .filter(Boolean);
    return scrollers.map((e) => {
      const before = e.scrollTop;
      e.scrollTop = 40;
      const moved = e.scrollTop !== before;
      e.scrollTop = before;
      return {
        name: e.className.toString().split(' ')[0],
        width: getComputedStyle(e).scrollbarWidth,
        gutter: e.offsetWidth - e.clientWidth - e.clientLeft * 2,
        scrolls: e.scrollHeight > e.clientHeight,
        moved,
      };
    });
  }, panel);
  for (const b of bars) {
    if (b.width !== 'none' || b.gutter !== 0)
      problems.push(`${label}: ${b.name} shows a scrollbar (scrollbar-width ${b.width}, ${b.gutter}px)`);
    if (b.scrolls && !b.moved) problems.push(`${label}: ${b.name} no longer scrolls`);
  }
  if (!bars.some((b) => b.scrolls)) problems.push(`${label}: no drawer list is high enough to scroll on a 300px screen`);
  await page.setViewportSize(full);
  await page.waitForTimeout(300);

  // 2. Style opens its list, in order, each with an icon; the back row reads "Style" and is named "Back to Main menu: Style".
  await press('Style');
  got = await read();
  if (got.links.map((l) => l.href).join() !== hrefs.join() || got.links.map((l) => l.text).join() !== names.join())
    problems.push(`${label}: the Style list is ${got.links.map((l) => l.text).join(', ')} (should be ${names.join(', ')})`);
  if (got.links.some((l) => !l.icon)) problems.push(`${label}: a Style row has no icon`);
  if (!got.back) problems.push(`${label}: the Style list has no back row`);
  else {
    if (got.back.text !== 'Style') problems.push(`${label}: the back row reads "${got.back.text}" (should be "Style")`);
    if (got.back.name !== 'Back to Main menu: Style')
      problems.push(`${label}: the back row's name is "${got.back.name}" (should be "Back to Main menu: Style")`);
  }
  // The back row is set like the top bar: its name in the page title's type, its arrow a 48dp target with the 24dp icon.
  if (got.back) {
    if (got.back.type !== got.back.title)
      problems.push(`${label}: the back row's type is "${got.back.type}", the page title's is "${got.back.title}"`);
    if (got.back.target !== 48 || got.back.glyph !== 24)
      problems.push(`${label}: the back arrow is ${got.back.target}px with a ${got.back.glyph}px icon (should be 48 and 24)`);
  }
  await page.screenshot({ path: join(shots, `style-sublist-${width}.png`) });

  // 3. A page of Style is marked in the list, and the drawer opens at Style on it (Escape or the back row first closes the list).
  await go('style/shape');
  await openDrawer();
  got = await read();
  const marked = got.links.filter((l) => l.current === 'page').map((l) => l.href);
  if (marked.join() !== '#style/shape')
    problems.push(`${label} #style/shape: the marked rows are "${marked.join(', ')}" (should be #style/shape)`);

  // 4. The back row returns to the first level.
  await page.locator(`${panel} .mo-navigation-drawer__back`).first().click();
  await page.waitForTimeout(400);
  got = await read();
  if (got.back || got.links.length) problems.push(`${label}: the back row does not return to the first level`);

  // 5. Globals reads its own name, not "Back".
  await press('Globals');
  got = await read();
  if (got.back?.text !== 'Globals') problems.push(`${label}: the back row of Globals reads "${got.back?.text}" (should be "Globals")`);
  if (got.back?.name !== 'Back to Main menu: Globals') problems.push(`${label}: Globals' back row is named "${got.back?.name}"`);

  // 5b. Escape and the back row return the focus to the section that opened the list, for every section, with the focus ring showing.
  await go('');
  await openDrawer();
  const focused = () =>
    page.evaluate(() => {
      const a = document.activeElement;
      return a && { text: a.textContent.trim(), visible: a.matches(':focus-visible') };
    });
  for (const section of ['Content', 'Business', 'Style', 'Globals']) {
    for (const how of ['Escape', 'back row']) {
      await page
        .locator(`${panel} nav button.mo-navigation-drawer__item`, { hasText: new RegExp(`^${section}$`) })
        .first()
        .focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      if (how === 'Escape') await page.keyboard.press('Escape');
      else {
        await page.locator(`${panel} .mo-navigation-drawer__back`).first().focus();
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(400);
      const f = await focused();
      if (f?.text !== section)
        problems.push(`${label}: after ${how} from ${section} the focus is on "${f?.text}" (should be "${section}")`);
      else if (!f.visible) problems.push(`${label}: after ${how} from ${section} the focus ring does not show`);
    }
  }

  // 6. The rail: one Style item, no Style page in it; it opens the drawer at its list.
  if (wide) {
    await page.locator(`${panel} > :first-child button[aria-expanded="true"]`).first().click();
    await page.waitForTimeout(600);
    const rail = await page.evaluate(() =>
      [...document.querySelectorAll('nav.mo-editor-main-rail .mo-nav-rail__item')]
        .filter((e) => e.getBoundingClientRect().width > 0)
        .map((e) => ({ tag: e.tagName, text: e.textContent.trim(), href: e.getAttribute('href') })),
    );
    const styleItems = rail.filter((r) => r.text === 'Style');
    if (styleItems.length !== 1 || styleItems[0].tag !== 'BUTTON')
      problems.push(
        `${label}: the rail has ${styleItems.length} Style items (should be one button): ${rail.map((r) => r.text).join(', ')}`,
      );
    if (rail.some((r) => r.href?.startsWith('#style/'))) problems.push(`${label}: the rail lists a Style page`);
    await page.locator('nav.mo-editor-main-rail .mo-nav-rail__item', { hasText: 'Style' }).first().click();
    await page.waitForTimeout(600);
    got = await read();
    if (got.back?.text !== 'Style' || got.links.length !== names.length)
      problems.push(`${label}: the rail's Style item does not open the drawer at the Style list`);
  }
  await page.close();
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

  // Icon packs: the system pack Material Symbols is listed with its samples, Phosphor and Lucide are not (they left the package), and one is in use.
  // A site takes the package from node_modules, where a glob that skips it leaves the list empty.
  await go('appearance/icon-packs');
  await page.waitForTimeout(150);
  const packs = await page.evaluate(() =>
    [...document.querySelectorAll('main [role=img][aria-label] svg')]
      .map((svg) => svg.closest('[role=img]'))
      .filter((el, i, all) => all.indexOf(el) === i)
      .map((el) => ({ label: el.getAttribute('aria-label'), icons: el.querySelectorAll('svg').length })),
  );
  const packNames = ['Material Symbols'];
  const listed = await page.evaluate(() => document.querySelector('main')?.innerText ?? '');
  for (const gone of ['Phosphor', 'Lucide'])
    if (listed.includes(gone)) problems.push(`${label} #appearance/icon-packs: the pack ${gone} is listed, but it is not in the package`);
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

  // The drawer's header is the theme's list item (Material 3 Lists: 72 dp two-line item, 16 dp padding, 40 dp leading avatar, body large
  // headline over body medium supporting text) with the close button as its trailing action, and the theme's divider under it.
  const header = await page.evaluate(() => {
    const panel = document.querySelector('.mo-editor-main-drawer-panel');
    const row = panel?.querySelector(':scope > :first-child .mo-list__item-multi-action');
    const item = row?.querySelector('.mo-list__item-container');
    const box = (e) => e && e.getBoundingClientRect();
    return {
      row: !!row,
      handBuilt: !!panel?.querySelector('.mo-editor-main-drawer-header'),
      avatar: !!item?.querySelector('.mo-avatar'),
      headline: !!item?.querySelector('.mo-list__item-headline'),
      supporting: !!item?.querySelector('.mo-list__item-supporting'),
      close: !!row?.querySelector('button[aria-expanded="true"]'),
      divider: !!panel?.querySelector(':scope > hr.mo-divider'),
      shown: !!panel && box(panel).width > 0 && box(panel).x >= 0,
      height: Math.round(box(item)?.height ?? 0),
      pad: item && getComputedStyle(item).paddingInlineStart,
      avatarSize: Math.round(box(item?.querySelector('.mo-avatar'))?.width ?? 0),
    };
  });
  for (const part of ['row', 'avatar', 'headline', 'supporting', 'close', 'divider'])
    if (!header[part])
      problems.push(`${label} menu: the drawer's header has no ${part} (a theme ListItem with the close button as its action)`);
  if (header.handBuilt) problems.push(`${label} menu: the drawer's header is hand-built again (mo-editor-main-drawer-header)`);
  if (width >= 1000 && header.shown && (header.height !== 72 || header.pad !== '16px' || header.avatarSize !== 40))
    problems.push(
      `${label} menu: the drawer's header is ${header.height} px high with ${header.pad} padding and a ${header.avatarSize} px avatar (should be 72, 16px and 40)`,
    );

  const drawer = '.mo-editor-main-drawer-panel nav';
  if (width >= 1000) {
    // The standard drawer is open: four sections, the start screen and the cog, and the cog last, at the bottom.
    await scrollMenuToEnd(page);
    const items = await page.evaluate(shownItems, `${drawer} .mo-navigation-drawer__item`);
    const sections = items.filter((i) => i.tag === 'BUTTON').length;
    const links = items.filter((i) => i.tag === 'A').map((i) => i.href);
    // Under "Apps": Store, then the pages of the installed connectors, plugins and themes, and no app installed.
    // Style is a section with its own list, like Globals: the first level has its row (a button), and its seven pages are on the second level
    // (checkStyleSublist).
    const appRows = ['#settings/appstore', '#installed/connectors', '#installed/plugins', '#appearance/themes'];
    const apps = ['#', ...appRows, '#settings'];
    if (sections !== 4 || links.join() !== apps.join())
      problems.push(
        `${label} menu: the first level has ${sections} sections and the links ${links.join(', ')} (should be 4 and ${apps.join(', ')})`,
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
    await scrollMenuToEnd(page);
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
    ['style/color', false],
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
    await page.click('.mo-editor-main-drawer-panel > :first-child button[aria-expanded="true"]');
    await page.waitForTimeout(600);
    await scrollMenuToEnd(page);
    checkCog(label, 'skinnen', await page.evaluate(shownItems, 'nav.mo-editor-main-rail .mo-nav-rail__item'), height);
    const railCurrent = (hash) =>
      go(hash).then(() =>
        page.evaluate(() => document.querySelector('nav.mo-editor-main-rail a[href="#settings"]')?.getAttribute('aria-current')),
      );
    if ((await railCurrent('developer/caching')) !== 'page')
      problems.push(`${label} the rail #developer/caching: the cog must be selected`);
    for (const hash of ['style/color', 'global/header', 'licenses'])
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
  // The sheet must be closed before the next part: close it with its own Cancel button (never a blanket Escape). If it stays
  // open, stop here with a problem that names the step, so the failure is not a timeout on "Add widget" behind the sheet.
  if (await rhythmSheet.isVisible().catch(() => false)) {
    await rhythmSheet
      .getByRole('button', { name: daCommon.cancel, exact: true })
      .click({ timeout: 2000 })
      .catch(() => {});
    await rhythmSheet.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    if (await rhythmSheet.isVisible().catch(() => false)) {
      problems.push(
        `${label}: Blog rhythm's settings sheet is still open after the step "${step}", so "${daDashboard.addWidget}" was not run`,
      );
      await adding.close();
      return;
    }
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
/** Scrolls the main menu (the drawer, its modal panel or the rail) to its end, so the cog, the last item, is in the window. */
const scrollMenuToEnd = (page) =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll(
      '.mo-editor-main-drawer-frame, .mo-editor-main-rail-frame, .mo-editor-main-drawer-panel, .mo-nav-rail__items, dialog nav',
    ))
      el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
  });

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

/** A list in a start-screen card (the "Unfinished" card here; "Continue where you left off", the first-run card and the updates notice share its rules): the card keeps its
 * 16 dp padding on every side (M3 Cards › Specs, "Left/right padding 16dp"), so a row's layer is 16 dp in from the card's edges and not at them, and the row's own 16 dp
 * leading space (Lists › Specs) puts its icon on the title's text edge. M3 prints nothing for a list in a card (docs/material-deviations.md, "Where Material 3 is silent").
 * Owner, 21 Nov 2026 (the layer ran to the card's edges after PR #1125's room past the text). */
async function checkListInCard(width, height) {
  const label = `${width}px list in a card`;
  const draft = (n) => `---\ntitle: "Draft ${n}"\nstatus: draft\n---\n\nText\n`;
  const files = Object.fromEntries([1, 2].map((n) => [`src/content/pages/check-draft-${n}.md`, draft(n)]));
  const page = await browser.newPage({ viewport: { width, height }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, files);
  await page.evaluate(() => (location.hash = ''));
  const card = page.getByRole('region', { name: daLibrary.unfinishedTitle, exact: true });
  await card.waitFor({ state: 'visible', timeout: 5000 }).catch(() => problems.push(`${label}: the card is missing`));
  const m = await card.evaluate((c) => {
    const text = (e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      return r.getBoundingClientRect();
    };
    const row = c.querySelector('.mo-list__item-container');
    const icon = row?.querySelector('.mo-list__item-leading');
    const cr = c.getBoundingClientRect();
    const rr = row?.getBoundingClientRect();
    return (
      row && {
        left: rr.left - cr.left,
        right: cr.right - rr.right,
        title: text(c.querySelector('h2')).left,
        icon: icon.getBoundingClientRect().left,
      }
    );
  });
  if (!m) problems.push(`${label}: the card has no row`);
  else {
    // The card's 1 dp edge is inside its box, so the layer is at least 16 dp from the box.
    if (m.left < 15.5 || m.right < 15.5)
      problems.push(
        `${label}: the row's layer is ${Math.round(m.left)} and ${Math.round(m.right)} dp from the card's edges, under the card's 16 dp padding`,
      );
    if (Math.abs(m.title - m.icon) > 1)
      problems.push(
        `${label}: the title starts at ${Math.round(m.title)} and the row's icon at ${Math.round(m.icon)}; they should line up`,
      );
  }
  await page.close();
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
// has an action (a link or a button), and Try again and the connection work. The one row without an action of its own is the
// store connection's "Connected to Morpheme" (it shows the state; its button "Disconnect" is beside it, and the
// key states above check that it is there), so that row is left out. The status lines (a problem or a note, `.mo-editor-status-line`,
// a list row with an icon and text) are text only and are left out too.
async function checkMorpheme(page, state) {
  const text = await page.evaluate(() => document.querySelector('main').innerText);
  for (const x of [
    `Version ${CMS_STATUS.running}`,
    'Version 99.0.0 er klar',
    daCms.failedBuild('99.0.0'),
    daCms.seeBuild('99.0.0'),
    'Hjemmesiden har intet GitHub-token',
    'A made-up note for the checks.',
  ])
    if (!text.includes(x)) problems.push(`morpheme (${state}): "${x}" is missing`);
  const bare = await page.evaluate(
    (connected) =>
      [...document.querySelectorAll('main .mo-list__item-container')]
        .filter((row) => !row.closest('.mo-editor-status-line'))
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
  await page.getByRole('button', { name: daCms.tryAgain, exact: true }).click();
  if (!(await posted)) problems.push(`morpheme (${state}): Try again does not send a POST to /api/cms/update`);
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
  if (!wcagOn() || !scanRuns()) return;
  const viewport = width < 600 ? 'phone' : 'computer';
  const place = `#${hash}`;
  // The screen settles first: a list or a sheet that is still drawing would be a finding that is gone a moment later.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  const found = keysOf(codeViolations(await scan(page), activeTheme()), place, viewport);
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
  if (!wcagOn() || !keyboardRuns()) return;
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const { findings } = await walk(page);
  problems.push(...judge(findings, `#${hash}`, viewportOf(width)).map((line) => `${width}px ${line}`));
}

/** What a screen reader gets of one screen (WCAG 2.2 AA: names, roles, states and live regions; scripts/announce.mjs): the name walk's findings must be on
 * scripts/announce-allowlist.json and every entry of the list for this screen at this width must still match, so the list only shrinks. Gives whether it walked.
 * Only the editor's own screens and the demo's Blocks pages are walked (`announceWalks`, owner, 21 Nov 2026: the CMS's blocks, not the demo's content); the
 * other content items, the pages other units make for themselves (`zz-check-page.md` …) among them, are not. */
async function checkAnnounce(page, width, hash) {
  // Only in the CMS repository: the allowlist is the demo's (scripts/announce.mjs, announceRuns).
  if (!wcagOn() || !announce.announceRuns()) return false;
  if (!announce.announceWalks(hash)) return false;
  await page.waitForTimeout(300);
  const { findings } = await announce.walk(page);
  problems.push(...announce.judge(findings, `#${hash}`, announce.viewportOf(width)).map((line) => `${width}px ${line}`));
  return true;
}

/** The main flows with what is announced recorded (scripts/announce-flows.mjs): A, B, C, F, I, J, K and L at the computer, A, B, F and J also at the phone (375 px).
 * The speech log goes to announce-log.txt (ANNOUNCE_LOG); CI keeps it. */
async function checkAnnounceFlows(width) {
  if (!wcagOn() || !announce.announceRuns()) return;
  for (const flow of announceFlows.FLOWS) {
    if (width < 600 && !announceFlows.PHONE_FLOWS.includes(flow)) continue;
    const { findings, errors, lines } = await announceFlows.runAnnounceFlow(browser, site, flow, width);
    announceFlows.writeLog(lines);
    problems.push(...errors.map((e) => `${width}px ${e}`));
    problems.push(...announce.judge(findings, `flow ${flow}`, announce.viewportOf(width)).map((line) => `${width}px ${line}`));
  }
}

/** The main flows by keyboard (scripts/keyboard-flows.mjs): A to I at the computer, A, B and F also at the phone (375 px). */
async function checkKeyboardFlows(width) {
  if (!wcagOn() || !keyboardRuns()) return;
  for (const flow of FLOWS) {
    if (width < 600 && !PHONE_FLOWS.includes(flow)) continue;
    const { findings, errors } = await runFlow(browser, site, flow, width);
    problems.push(...errors.map((e) => `${width}px ${e}`));
    problems.push(...judge(findings, `flow ${flow}`, viewportOf(width)).map((line) => `${width}px ${line}`));
  }
  // The site, not the editor: the drawer at the phone width, the header's menus at the computer's.
  const { findings, errors } = await runSiteFlow(browser, site, width);
  problems.push(...errors.map((e) => `${width}px ${e}`));
  problems.push(...judge(findings, `flow ${SITE_FLOW}`, viewportOf(width)).map((line) => `${width}px ${line}`));
}

/** The strip from Save until the website has the save (BuildProgress.tsx, plan 2026-11-25-0-19-8, task 12): "Saved. Publishing" with the theme's
 * progress bar (named, role progressbar) under the top bar, then "Live" (determinate, gone by itself) or, when the build fails, "Not live" with
 * the build's link and Dismiss, the failure message of the save still there. Nothing scrolls the page sideways and the strip stays in the width.
 * `outcome`: what Cloudflare's build of the save does (the poll of deploy.ts waitForSite is 10 seconds). */
async function checkBuildProgress(width, outcome) {
  const label = `${width}px save progress (${outcome})`;
  const text = daApp.buildProgress;
  const page = await browser.newPage({ viewport: { width, height: 800 }, locale: 'da-DK' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  let commitsSeen = 0;
  await page.route('**/api/github/commit', (r) => {
    commitsSeen++;
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'saved-commit', blobs: {} }) });
  });
  await page.route('**/api/autosave**', (r) =>
    r.request().method() === 'GET'
      ? r.fulfill({ status: 404, body: '' })
      : r.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'off' }) }),
  );
  // The build's answer: the site's version.json names the saved commit (live) or an old one, and the build's check run says failure or not.
  await page.route('**/editor/version.json', (r) =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ commit: outcome === 'live' ? 'saved-commit' : 'old-commit', editor: 'x' }),
    }),
  );
  await page.route('**/api/github/graphql', async (r) => {
    const body = r.request().postData() || '';
    if (!body.includes('checkSuites')) return r.fallback();
    const nodes = outcome === 'failed' ? [{ conclusion: 'FAILURE', app: { slug: 'cloudflare-workers-and-pages' } }] : [];
    return r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { repository: { object: { checkSuites: { nodes } } } } }),
    });
  });
  await page.goto(`${site}/editor/#src/content/pages/zz-check-page.md`);
  await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
  await page.click('.ProseMirror p');
  await page.keyboard.press('End');
  await page.keyboard.type(' saved for the progress');
  // Publish (a draft's save does not go to the website, so it has no progress to show).
  await page.getByRole('button', { name: daForms.versions.publish, exact: true }).click();
  const strip = page.locator('.mo-editor-build-progress');
  await strip.waitFor({ timeout: 10_000 }).catch(async () => {
    problems.push(
      `${label}: no strip after Save (commits ${commitsSeen}; ${await page.evaluate(() => document.body.innerText.slice(0, 300))})`,
    );
  });
  if (!(await strip.count())) return page.close();
  const state = () =>
    strip.evaluate((el) => ({
      step: el.dataset.step,
      text: el.querySelector('p')?.textContent,
      bar: el.querySelector('[role="progressbar"]')
        ? {
            name: el.querySelector('[role="progressbar"]').getAttribute('aria-label'),
            now: el.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),
          }
        : null,
      links: [...el.querySelectorAll('a[href]')].map((a) => [a.textContent, a.getAttribute('href')]),
      buttons: [...el.querySelectorAll('button')].map((b) => b.textContent),
      wide: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 || el.scrollWidth > el.clientWidth + 1,
    }));
  const first = await state();
  if (first.step !== 'publishing' || first.text !== text.publishing)
    problems.push(`${label}: first the strip says "${first.text}" (${first.step}), not "${text.publishing}"`);
  if (!first.bar || first.bar.name !== text.label || first.bar.now !== null)
    problems.push(
      `${label}: while publishing the progress bar is ${JSON.stringify(first.bar)}, not an indeterminate one named "${text.label}"`,
    );
  if (first.wide) problems.push(`${label}: the strip scrolls the page sideways`);
  const step = outcome === 'live' ? 'live' : 'not-live';
  await page.waitForSelector(`.mo-editor-build-progress[data-step="${step}"]`, { timeout: 30_000 }).catch(() => {});
  const last = await state();
  if (last.step !== step) problems.push(`${label}: after the build the strip is "${last.step}", not ${step}`);
  else if (outcome === 'live') {
    if (last.text !== text.live || last.bar?.now !== '100')
      problems.push(`${label}: Live shows "${last.text}" and bar ${JSON.stringify(last.bar)}`);
    await page
      .waitForSelector('.mo-editor-build-progress', { state: 'detached', timeout: 10_000 })
      .catch(() => problems.push(`${label}: Live does not go away by itself`));
  } else {
    if (last.text !== text.notLive) problems.push(`${label}: Not live says "${last.text}"`);
    if (last.bar) problems.push(`${label}: Not live still shows a progress bar`);
    if (!last.links.some(([name, href]) => name === text.seeBuild && /\/commit\/saved-commit\/checks$/.test(href)))
      problems.push(`${label}: no "${text.seeBuild}" link to the build's checks (${JSON.stringify(last.links)})`);
    if (!last.buttons.includes(text.dismiss)) problems.push(`${label}: no ${text.dismiss} button`);
    if (last.wide) problems.push(`${label}: Not live scrolls the page sideways`);
    await strip.getByRole('button', { name: text.dismiss, exact: true }).click();
    await page
      .waitForSelector('.mo-editor-build-progress', { state: 'detached', timeout: 3000 })
      .catch(() => problems.push(`${label}: ${text.dismiss} does not close the strip`));
  }
  await page.close();
}

export function register(unit) {
  for (const [width, outcome] of [
    [390, 'failed'],
    [1280, 'live'],
  ])
    unit(`checkBuildProgress ${width} ${outcome}`, () => checkBuildProgress(width, outcome));
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
        'style/color',
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
      const announced = new Set();
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
              for (const d of document.querySelectorAll('dialog.mo-editor-sheet.mo-sheet.mo-is-bottom:not(.mo-editor-side-panel)')) {
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
          if (await checkAnnounce(page, width, hash)) announced.add(hash);
          if (state.text.includes(`${daApp.nothingAt(hash)}.`)) problems.push(`${width}px #${hash}: there is nothing at the address`);
          for (const link of state.links) {
            if (seen.has(link)) continue;
            seen.add(link);
            found.push(link);
          }
        }
        next = found;
      }
      // Every block is walked by the screen reader check on its demo Blocks page, also one the links above did not reach (scripts/announce.mjs).
      if (wcagOn() && announce.announceRuns())
        for (const hash of announce.blockPagesLeft(announced)) {
          route = hash;
          await page.evaluate((h) => (location.hash = h), hash);
          await page.waitForTimeout(150);
          await checkAnnounce(page, width, hash);
        }
      await page.close();
    });
    unit(`checkSettingsAndMenu ${width}`, () => checkSettingsAndMenu(width, height));
    unit(`checkStyleMenu ${width}`, () => checkStyleMenu(width, height));
    unit(`checkStyleSublist ${width}`, () => checkStyleSublist(width, height));
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
    unit(`checkStartGaps ${width}`, () => checkStartGaps(width, height));

  for (const [width, height] of [
    [800, 800],
    [1280, 900],
  ])
    unit(`checkMainNavColor ${width}`, () => checkMainNavColor(width, height));

  unit('checkSurfaceRoles 1280', () => checkSurfaceRoles(1280, 900));

  for (const [width, height] of [
    [375, 800],
    [1280, 900],
  ])
    unit(`checkBlockedNotice ${width}`, () => checkBlockedNotice(width, height));

  for (const width of [1280, 375]) unit(`checkKeyboardFlows ${width}`, () => checkKeyboardFlows(width));
  for (const width of [1280, 375]) unit(`checkAnnounceFlows ${width}`, () => checkAnnounceFlows(width));
  unit('checkStartSubtitle', () => checkStartSubtitle());
  unit('checkNoTitleRing 390', () => checkNoTitleRing());
  for (const width of [375, 1280])
    for (const hash of ['', 'developer/parts/ui', 'developer/parts/editor', 'settings'])
      unit(`checkFocusIndicators ${width} ${hash || 'start'}`, () => checkFocusIndicators(width, hash));
  for (const [width, height] of [
    [360, 740],
    [375, 800],
    [1280, 900],
  ])
    unit(`checkDraftsCard ${width}`, () => checkDraftsCard(width, height));
  for (const [width, height] of [
    [390, 800],
    [1280, 900],
  ])
    unit(`checkListInCard ${width}`, () => checkListInCard(width, height));
}

/** No ring on the screen title after a load (owner, 22 Nov 2026): at 390 px with touch and no keyboard the title has the focus by script, and nothing the
 * active element draws is an outline or a ring; the first Tab then lands on a control that does draw one (WCAG 2.4.7). */
async function checkNoTitleRing() {
  const label = '390px no title focus ring';
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  const page = await context.newPage();
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = 'pages'));
  await page.waitForTimeout(1000);
  await page.reload();
  await page.waitForTimeout(1500);
  const ring = () =>
    page.evaluate(() => {
      const e = document.activeElement;
      const s = e ? getComputedStyle(e) : null;
      return {
        tag: e ? `${e.tagName.toLowerCase()}${e.hasAttribute('data-screen-title') ? '[title]' : ''}` : 'none',
        drawn: !!s && ((s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'),
      };
    });
  const start = await ring();
  if (start.drawn) problems.push(`${label}: ${start.tag} draws a ring after the load`);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  const tab = await ring();
  if (!tab.drawn) problems.push(`${label}: no ring on the first Tab stop (${tab.tag})`);
  await context.close();
}
