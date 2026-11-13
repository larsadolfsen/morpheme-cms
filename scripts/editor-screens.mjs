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
// Assistants, Block settings, Caching and builds, Components, Morpheme and Privacy, A-Z by their names; the drawer's first level has the three sections (Content, Business, Globals), the
// start screen, the rows under the "Apps" label (Store, Connectors, Plugins and Themes, each with an icon) and the cog, which is the last item at the bottom of the drawer and of the collapsed rail (and on a phone,
// of the modal drawer) and is marked on Settings' screens only; and "Morpheme" (#morpheme) shows its status as text, has
// an action on every list row, and its Update button and its connection to the store work.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { constants, inflateSync } from 'node:zlib';
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
  `the icon "${name}" is from the whole of Material Symbols or Phosphor (not in the icon pack): give it an icon in each pack's map if it is to stay`;

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
// SCREENS_DIR (the temporary folder's morpheme-screens by default): where the images go.
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
  const tall = readFileSync(fileURLToPath(new URL('../release-notes/editions/0.16.webp', import.meta.url)));
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
      await page.close();
    }
  }
}

/** On a phone the text's row floats by the selected text (never a docked sheet): inside the visible screen (above the keyboard and "Save changes"), Bold, Italic and Link first, 48 dp buttons centred in their rows (a second row when they do not fit), and it follows the line the cursor is on. */
async function checkTextSheet(width = 360) {
  const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${width}px text menu: ${e.message}`));
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
      const sel = getSelection().getRangeAt(0).getBoundingClientRect();
      const names = [...m.querySelectorAll('button:not([hidden])')].map((b) => b.getAttribute('aria-label'));
      const buttons = [...m.querySelectorAll('button:not([hidden])')].map((b) => ({
        ...b.getBoundingClientRect().toJSON(),
      }));
      return {
        shown: !m.hidden,
        sheet: m.classList.contains('editor-selection-sheet'),
        r: r.toJSON(),
        save,
        sel: sel.toJSON(),
        names,
        buttons,
        scrolls: m.scrollWidth > m.clientWidth,
        vh: visualViewport.height,
      };
    });
  await page.waitForTimeout(1200);
  const first = await read();
  await page.keyboard.type(' and more');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await page.keyboard.type('Next');
  await page.waitForTimeout(1200);
  const second = await read();
  for (const [name, now] of [
    ['first line', first],
    ['later line', second],
  ]) {
    if (!now.shown) problems.push(`${width}px text menu: not shown at the ${name}`);
    else if (now.sheet || now.r.width > width - 1) problems.push(`${width}px text menu: a docked sheet at the ${name}, not a floating row`);
    else if (now.r.left < 0 || now.r.right > width || now.r.bottom > Math.min(now.save, now.vh) + 1)
      problems.push(`${width}px text menu: outside the visible screen at the ${name}`);
    else if (Math.min(Math.abs(now.r.bottom - now.sel.top), Math.abs(now.r.top - now.sel.bottom)) > 40)
      problems.push(`${width}px text menu: not by the text at the ${name}`);
    if (
      !now.names.some((n) => n.endsWith('heading') || n.endsWith('Heading')) ||
      now.names.includes('Insert') ||
      now.names.at(-1) !== 'More'
    )
      problems.push(`${width}px text menu: Heading and More (three dots, last) are not all there, or Insert is at the ${name}`);
  }
  // Bold, Italic and Link come first, every button is 48 dp, nothing scrolls, and each row is centred (a second row when they do not fit).
  if (first.names.slice(0, 3).join() !== 'Bold,Italic,Link')
    problems.push(`${width}px text menu: Bold, Italic and Link are not the first three buttons`);
  if (first.scrolls || first.buttons.some((b) => b.left < first.r.left - 1 || b.right > first.r.right + 1))
    problems.push(`${width}px text menu: a button is outside the menu or the menu scrolls`);
  if (first.buttons.some((b) => b.width < 47.5 || b.height < 47.5)) problems.push(`${width}px text menu: a button is smaller than 48 dp`);
  const rows = Object.values(Object.groupBy(first.buttons, (b) => Math.round(b.top)));
  for (const row of rows) {
    const left = Math.min(...row.map((b) => b.left)) - first.r.left;
    const right = first.r.right - Math.max(...row.map((b) => b.right));
    if (Math.abs(left - right) > 2) problems.push(`${width}px text menu: a row of buttons is not centred (${left} left, ${right} right)`);
  }
  // Never two rows: one row at every width (the rest is under More).
  if (rows.length !== 1) problems.push(`${width}px text menu: ${rows.length} rows, not one`);
  if (first.r.top === second.r.top) problems.push(`${width}px text menu: it did not follow the cursor to another line`);
  await page.setViewportSize({ width, height: 420 });
  await page.waitForTimeout(500);
  const keyboard = await read();
  if (keyboard.r.bottom > Math.min(keyboard.save, keyboard.vh) + 1) problems.push(`${width}px text menu: it is under the keyboard`);
  // More opens the sheet from the bottom with the text styles, the lists, the alignment and last the colours.
  await page.setViewportSize({ width, height: 740 });
  await page.waitForTimeout(300);
  await page.click('.editor-selection-menu button[aria-label="More"]');
  await page.waitForTimeout(500);
  const sheetText = await page.evaluate(() => document.querySelector('dialog[open][aria-label="More"]')?.textContent ?? '');
  for (const word of ['Color', 'Text style', 'List'])
    if (!sheetText.includes(word)) problems.push(`${width}px text menu: the More sheet lacks "${word}"`);
  if (sheetText.indexOf('Color') < sheetText.indexOf('Text style'))
    problems.push(`${width}px text menu: Color is not last in the More sheet`);
  if (!sheetText) problems.push(`${width}px text menu: More does not open its sheet`);
  await page.keyboard.press('Escape');
  if (width !== 360) return void (await page.close());
  // The top toolbar's tools rest in one colour (the kind menus too), and a menu button is never in the accent.
  const colours = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll('.editor-tools button:not([aria-pressed="true"])')]
        .filter((b) => b.querySelector('svg'))
        .map((b) => getComputedStyle(b).color),
    ),
  ]);
  if (colours.length > 1) problems.push(`${width}px text toolbar: its tools rest in ${colours.length} colours (${colours.join(', ')})`);
  await page.close();
}

/** The contrast (WCAG) of a hint line (a pseudo-element of the element) on each section colour, with the section's own colours set on the element as sectionFrame.ts does. */
function hintContrasts(page, selector, pseudo) {
  return page.evaluate(
    ([selector, pseudo]) => {
      const el = document.querySelector(selector);
      const pixel = (css, over) => {
        const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        c.fillStyle = over;
        c.fillRect(0, 0, 1, 1);
        c.fillStyle = css;
        c.fillRect(0, 0, 1, 1);
        return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
      };
      const lum = (rgb) => {
        const [R, G, B] = rgb.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
      };
      const out = {};
      for (const color of ['surface', 'primary', 'secondary', 'tertiary']) {
        el.setAttribute('data-section-color', color);
        el.setAttribute('data-section-box', 'only');
        const [style, hint] = [getComputedStyle(el), getComputedStyle(el, pseudo)];
        const solid =
          style.backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.body).backgroundColor : style.backgroundColor;
        const back = pixel(solid, '#fff');
        const front = pixel(hint.color, `rgb(${back})`);
        out[color] = (Math.max(lum(front), lum(back)) + 0.05) / (Math.min(lum(front), lum(back)) + 0.05);
      }
      el.removeAttribute('data-section-color');
      el.removeAttribute('data-section-box');
      return out;
    },
    [selector, pseudo],
  );
}

/** A blog post that is not on the blog (`unlisted: true`, the demo's "A post only for those with the link") shows its status in the posts list, and the Status filter offers it. */
async function checkUnlistedPost() {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`hidden post: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#list/blog'));
  await page.waitForSelector('main a.list-item-container');
  const row = page.locator('main a.list-item-container').filter({ hasText: 'A post only for those with the link' });
  if (!(await row.count())) return problems.push('hidden post: the posts list has no row for the post that is not on the blog');
  if (!(await row.first().innerText()).includes('Hidden')) problems.push('hidden post: the posts list does not say "Hidden" on its row');
  await page.close();
}

/** On a phone, a press and hold on a row of the pages list selects it (and the blog's the same), and the top bar's Delete asks before it deletes; a default page (the front page) is not deleted, with the reason. */
async function checkLongPressDelete() {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`long press: ${e.message}`));
  await openEditor(page, site);
  const cdp = await page.context().newCDPSession(page);
  for (const list of ['pages', 'blog']) {
    await page.evaluate((l) => (location.hash = `#list/${l}`), list);
    await page.waitForSelector('main a.list-item-container');
    await page.waitForTimeout(500);
    const rows = page.locator('main a.list-item-container');
    // A row that is not a default page.
    const row = list === 'pages' ? rows.filter({ hasText: 'Get started' }).first() : rows.last();
    await row.scrollIntoViewIfNeeded();
    const box = await row.boundingBox();
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    const hold = async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await page.waitForTimeout(800);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(300);
    };
    const here = await page.evaluate(() => location.hash);
    await hold();
    if ((await page.evaluate(() => location.hash)) !== here)
      problems.push(`long press (${list}): a press and hold opened the row instead of selecting it`);
    const del = page.getByRole('button', { name: /^Delete 1 selected$/ });
    if (!(await del.count())) {
      problems.push(`long press (${list}): a press and hold on a row does not select it (no "Delete 1 selected" in the top bar)`);
      continue;
    }
    await del.click();
    const sure = page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true });
    await sure.waitFor({ timeout: 3000 }).catch(() => problems.push(`long press (${list}): Delete does not ask before it deletes`));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  // The front page: a press and hold selects it, but Delete says why it is kept.
  await page.reload();
  await page.evaluate(() => (location.hash = '#list/pages'));
  await page.waitForSelector('main a.list-item-container');
  await page.waitForTimeout(500);
  const home = page.locator('main a.list-item-container', { hasText: 'Home' }).first();
  if (await home.count()) {
    await home.scrollIntoViewIfNeeded();
    const box = await home.boundingBox();
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await page.waitForTimeout(800);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Delete 1 selected$/ }).click();
    await page.waitForTimeout(500);
    if (!(await page.getByText('is a default page', { exact: false }).count()))
      problems.push('long press: deleting the front page did not say it is a default page');
  }
  await page.close();
}

/** On a phone, a tap on the hint under a page's only heading (Type text, or tap Insert …) puts the cursor in an empty paragraph after it. */
async function checkEmptyHint() {
  const page = await browser.newPage({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`360px empty hint: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.tap('.ProseMirror');
  await page.keyboard.type('# From us to you');
  await page.waitForTimeout(500);
  // The hint is the heading's ::after: tap its line, anywhere across the width.
  const at = await page.evaluate(() => {
    const h1 = document.querySelector('.ProseMirror > h1');
    const range = document.createRange();
    range.selectNodeContents(h1);
    const [box, text] = [h1.getBoundingClientRect(), range.getBoundingClientRect()];
    return { x: box.left + 8, y: box.bottom - 8, height: parseFloat(getComputedStyle(h1, '::after').minHeight) };
  });
  if (at.height < 48) problems.push(`360px empty hint: the hint line is ${at.height}px high, not 48`);
  for (const [color, ratio] of Object.entries(await hintContrasts(page, '.ProseMirror > h1', '::after')))
    if (ratio < 4.5) problems.push(`360px empty hint: the hint on a ${color} section has contrast ${ratio.toFixed(2)}:1, below 4.5`);
  await page.touchscreen.tap(at.x, at.y);
  await page.keyboard.type('Hej');
  const got = await page.evaluate(() => {
    const [h1, ...rest] = [...document.querySelector('.ProseMirror').children];
    return {
      h1: h1?.textContent,
      rest: rest.map((n) => `${n.tagName}:${n.textContent}`),
      hint: !!getComputedStyle(h1, '::after').content.match(/Type text/),
    };
  });
  if (got.h1 !== 'From us to you' || got.rest.join() !== 'P:Hej')
    problems.push(`360px empty hint: expected the heading and P:Hej, got ${got.h1} ${got.rest}`);
  if (got.hint) problems.push('360px empty hint: the hint still shows');
  await page.close();
}

/** The rows of a List, Segmented list and FAQ are Material's: no list marker (list-style, ::marker), in the editor and in the Preview (where the page's text style, prose, must not reach them) and on the site. */
async function checkListMarkers(width) {
  const path = 'src/content/pages/about.md';
  if (!existsSync(join(ROOT, path))) return;
  const markers = () =>
    [...document.querySelectorAll('ul.list')].flatMap((ul) =>
      [ul, ...ul.children].flatMap((el) => {
        const s = getComputedStyle(el);
        const m = getComputedStyle(el, '::marker');
        const bad = [];
        if (s.listStyleType !== 'none') bad.push(`list-style-type ${s.listStyleType}`);
        if (el !== ul && s.display === 'list-item' && m.content !== 'normal' && m.content !== 'none' && m.content !== '""')
          bad.push(`marker ${m.content}`);
        if (el === ul && parseFloat(s.paddingInlineStart) !== 0) bad.push(`indent ${s.paddingInlineStart}`);
        return bad.map((b) => `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join('.')}: ${b}`);
      }),
    );
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`List markers: ${e.message}`));
  await openEditor(page, site);
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('ul.list', { timeout: 30_000 });
  const inEditor = await page.evaluate(markers);
  if (inEditor.length) problems.push(`${width}px editor: a List row has a list marker (${[...new Set(inEditor)].join('; ')})`);
  await page.getByRole('button', { name: 'Preview' }).first().click();
  await page.waitForFunction(() => document.querySelector('dialog[open] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('ul.block-list', { timeout: 30_000 });
  const inPreview = await frame.evaluate(markers);
  if (inPreview.length) problems.push(`${width}px Preview: a List row has a list marker (${[...new Set(inPreview)].join('; ')})`);
  await page.close();
}

/** A block put in a list item, or after a list, is a block of the page (never indented in the list), and Backspace at the start of a list item leaves the list. */
async function checkListsAndBlocks(width) {
  const label = `${width}px text lists`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('- one');
  await page.keyboard.press('Enter');
  await page.keyboard.type('two');
  await page.keyboard.press('Enter');
  await page.keyboard.type('three');
  await page.waitForTimeout(300);
  const tops = () =>
    page.evaluate(() =>
      [...document.querySelector('.ProseMirror').children].map(
        (c) => c.tagName.toLowerCase() + (c.matches('.site-block, [data-site-block]') || c.querySelector('.site-block') ? ':block' : ''),
      ),
    );
  if ((await tops()).join() !== 'ul') {
    problems.push(`${label}: typing "- " does not start a list (${await tops()})`);
    return page.close();
  }
  // Backspace at the start of the second item takes it out of the list: a paragraph between two lists.
  await page.locator('.ProseMirror li > p').nth(1).click();
  await page.keyboard.press('Home');
  // The editor reads the moved cursor from the page a moment later.
  await page.waitForTimeout(150);
  await page.keyboard.press('Backspace');
  const left = (await tops()).join();
  if (left !== 'ul,p,ul') problems.push(`${label}: Backspace at the start of a list item gives ${left}, not ul,p,ul`);
  await page.keyboard.press('Control+z');
  // A list item is not a heading, so the heading controls are not offered in a list, on the first line or under the arrow.
  if (await page.locator('[aria-label="Show more tools"]:visible').count())
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  const offered = await page
    .locator('.editor-tools button:visible')
    .evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')).filter((n) => /^(Page heading|Heading|Subheading)\b/.test(n ?? '')));
  if (offered.length) problems.push(`${label}: the toolbar offers ${offered.join(', ')} in a list item`);
  // A text size picked in a list keeps the list: the text of the item gets the size (a span), and Body medium takes it away.
  await page.locator('.ProseMirror li > p').nth(0).click();
  const pick = async (name) => {
    const direct = page.locator(`.editor-tools [aria-label="${name}"]:visible`);
    if (await direct.count()) await direct.first().click();
    else {
      await page.locator('.editor-tools [aria-label^="Text style"]:visible').first().click();
      await page.locator('[role=menu] button, [role=menuitem], [role=menuitemradio]').filter({ hasText: name }).first().click();
    }
  };
  await pick('Body small');
  const sized = await page.locator('.ProseMirror ul li span.body-small').count();
  if (sized !== 1 || (await tops()).join() !== 'ul')
    problems.push(`${label}: Body small in a list item gives ${sized} sized items and ${await tops()}, not 1 and ul`);
  await pick('Body medium');
  if (await page.locator('.ProseMirror ul li span.body-small').count())
    problems.push(`${label}: Body medium in a list item leaves its size`);
  if (await page.locator('[aria-label="Show fewer tools"]:visible').count())
    await page.locator('[aria-label="Show fewer tools"]:visible').first().click();
  // A block inserted in the first item ends the list there, at the top level, and the rest follows it.
  await page.locator('.ProseMirror li > p').nth(0).click();
  await page.keyboard.press('End');
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: 'Numbered steps.' }).first().click();
  await page.waitForSelector('.ProseMirror .site-block, .ProseMirror [data-site-block]', { timeout: 8000 }).catch(() => {});
  const shape = await page.evaluate(() =>
    [...document.querySelector('.ProseMirror').children].map((c) =>
      c.tagName === 'UL'
        ? `ul${c.querySelectorAll(':scope > li').length}`
        : c.className.includes('site-block') || c.querySelector('.site-block')
          ? 'block'
          : c.tagName.toLowerCase(),
    ),
  );
  const joined = shape.join();
  if (!/^ul1,block(,p)?,ul\d$/.test(joined))
    problems.push(`${label}: a block inserted in a list item is not at the top level of the page (${joined})`);
  if (await page.locator('.ProseMirror li .site-block').count()) problems.push(`${label}: a block is drawn inside a list item`);
  await page.close();
}

/** The Preview (the binoculars) draws a section's background from the page's text as saved, also when the built site does not have the section yet (it is rebuilt after a save), and with the colour the editor shows. */
async function checkPreviewSection() {
  const path = 'src/content/pages/about.md';
  if (!existsSync(join(ROOT, path))) return;
  const text = readFileSync(join(ROOT, path), 'utf8').replace(/(\n)(## [^\n]+)/, '$1<div data-section="tertiary"></div>\n\n$2');
  const page = await browser.newPage({ viewport: { width: 390, height: 800 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`Preview section: ${e.message}`));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror [data-section-color="tertiary"]', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Preview' }).first().click();
  await page.waitForFunction(() => document.querySelector('dialog[open] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('[data-editor="text"]', { timeout: 30_000 });
  const got = await frame.evaluate(() => {
    const section = document.querySelector('section.text-section-tertiary');
    return section ? getComputedStyle(section).backgroundColor : null;
  });
  if (!got || got === 'rgba(0, 0, 0, 0)') problems.push(`Preview section: a section with a background has none in the Preview (${got})`);
  await page.close();
}

/** A page whose H1 section has a background (a colour or an image) has it start right under the navigation bar (gap 0 ±1px), on the site and in the Preview at 390 and 600; a page whose H1 section has none keeps its space under the bar. */
async function checkH1SectionGap() {
  const path = 'src/content/pages/about.md';
  if (!existsSync(join(ROOT, path))) return;
  const source = readFileSync(join(ROOT, path), 'utf8');
  const picture = '/images/uploads/2026/10/earth-from-space.webp';
  const variants = [
    { name: 'colour', marker: '<div data-section="tertiary"></div>\n\n', background: true },
    { name: 'image', marker: `<div data-section="" data-picture="${picture}" data-alt="Earth"></div>\n\n`, background: true },
    { name: 'none', marker: '', background: false },
  ];
  const measure = () => {
    const bar = document.querySelector('header[data-header]')?.getBoundingClientRect();
    const h1 = document.querySelector('article h1');
    const section = document.querySelector('[data-editor="h1-section"]');
    const top = (section || h1)?.getBoundingClientRect().top;
    return bar && top !== undefined ? { gap: top - bar.bottom, section: Boolean(section) } : null;
  };
  const verify = (label, m, background) => {
    if (!m) return problems.push(`${label}: the page has no navigation bar or heading`);
    if (background && !m.section) return problems.push(`${label}: there is no H1 section`);
    if (background && Math.abs(m.gap) > 1)
      problems.push(`${label}: the H1 section's background is ${Math.round(m.gap)}px below the navigation bar, not 0`);
    if (!background && m.gap < 16)
      problems.push(`${label}: a heading without a background has lost its space under the bar (${Math.round(m.gap)}px)`);
  };
  for (const { name, marker, background } of variants) {
    const text = source.replace(/(\n)(# [^\n]+)/, `$1${marker}$2`);
    const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`H1 section gap: ${e.message}`));
    await openEditor(page, site, { [path]: text });
    await page.goto(`${site}/editor/#${path}`);
    await page.getByRole('button', { name: 'Preview' }).first().click({ timeout: 30_000 });
    await page.waitForFunction(() => document.querySelector('dialog[open] iframe'), null, { timeout: 30_000 });
    const slider = page.locator('dialog[open] [role="slider"]').first();
    const width = async () => Number(await slider.getAttribute('aria-valuenow'));
    for (const w of [390, 600]) {
      await slider.focus();
      await page.keyboard.press('Home');
      while ((await width()) < w) await page.keyboard.press('ArrowRight');
      while ((await width()) > w) await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);
      const frame = page.frames().find((f) => f !== page.mainFrame());
      await frame.waitForSelector('article h1', { timeout: 30_000 });
      if (background) await frame.waitForSelector('[data-editor="h1-section"]', { timeout: 30_000 });
      verify(`${w}px Preview, H1 section ${name}`, await frame.evaluate(measure), background);
    }
    await page.close();
  }
}

/** A full-width section has the whole width only as its background: on the built site and in the Preview, its content has the same left edge as the page's text, inside the centred container, at 840, 1200 and 1600, and nothing overflows sideways at 375. */
async function checkFullSection() {
  const path = 'src/content/pages/about.md';
  if (!existsSync(join(ROOT, path))) return;
  const text = readFileSync(join(ROOT, path), 'utf8').replace(
    /(\n)(## [^\n]+)/,
    '$1<div data-section="tertiary" data-width="full"></div>\n\n$2',
  );
  const measure = () => {
    const box = (e) => (e ? e.getBoundingClientRect() : null);
    const section = document.querySelector('section.text-section-full');
    const column = box(document.querySelector('[data-editor="text"]'));
    const [h2, p] = [section?.querySelector('h2'), section?.querySelector('p')].map(box);
    const intro = box(document.querySelector('[data-editor="text"] > p'));
    return { width: innerWidth, scroll: document.documentElement.scrollWidth, section: box(section), column, h2, p, intro };
  };
  const verify = (label, m) => {
    if (!m.section) return problems.push(`${label}: there is no full-width section`);
    if (m.scroll > m.width) problems.push(`${label}: the page scrolls sideways (${m.scroll} > ${m.width})`);
    if (Math.abs(m.section.left) > 0.5 || Math.abs(m.section.right - m.width) > 0.5)
      problems.push(`${label}: the background does not reach both edges (${m.section.left}-${m.section.right})`);
    for (const [name, b] of [
      ['heading', m.h2],
      ['text', m.p],
    ])
      if (Math.abs(b.left - m.column.left) > 0.5)
        problems.push(`${label}: the section's ${name} starts at ${b.left}, not at the page text's ${m.column.left}`);
    // The column is centred in the window, and a section's lines are shorter than the column (66ch) while the column is wider.
    if (Math.abs(m.column.left - (m.width - m.column.right)) > 1) problems.push(`${label}: the page column is not centred`);
    if (m.width > 600 && m.p.width >= m.column.width - 1)
      problems.push(`${label}: the section's text runs the whole column (${Math.round(m.p.width)}px)`);
  };
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`Full section: ${e.message}`));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror [data-section-color="tertiary"]', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Preview' }).first().click();
  await page.waitForFunction(() => document.querySelector('dialog[open] iframe'), null, { timeout: 30_000 });
  const slider = page.locator('dialog[open] [role="slider"]').first();
  const width = async () => Number(await slider.getAttribute('aria-valuenow'));
  for (const w of [840, 1200, 1600]) {
    await slider.focus();
    await page.keyboard.press('Home');
    while ((await width()) < w) await page.keyboard.press('Shift+ArrowRight');
    while ((await width()) > w) await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    const frame = page.frames().find((f) => f !== page.mainFrame());
    await frame.waitForSelector('section.text-section-full', { timeout: 30_000 });
    verify(`${w}px Preview full section`, await frame.evaluate(measure));
  }
  await page.close();
  // On a phone the Preview is as wide as the screen: the section's background is the window, and nothing scrolls sideways.
  const phone = await browser.newPage({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  await openEditor(phone, site, { [path]: text });
  await phone.goto(`${site}/editor/#${path}`);
  await phone.waitForSelector('.ProseMirror [data-section-color="tertiary"]', { timeout: 30_000 });
  await phone.getByRole('button', { name: 'Preview' }).first().click();
  await phone.waitForFunction(() => document.querySelector('dialog[open] iframe'), null, { timeout: 30_000 });
  const small = phone.frames().find((f) => f !== phone.mainFrame());
  await small.waitForSelector('section.text-section-full', { timeout: 30_000 });
  verify('375px Preview full section', await small.evaluate(measure));
  await phone.close();
}

/** The Preview of a draft page (not on the site, so its own address answers 404) opens without an error text, and its bar of window sizes keeps its bar of window sizes inside the screen, scrolling, and apart from the caption, at phone widths. */
async function checkPreviewDraft(width) {
  const label = `${width}px draft Preview`;
  const path = 'src/content/pages/preview-draft-check.md';
  const text = '---\ntitle: "Preview draft check"\nstatus: "draft"\n---\n\n# Preview draft check\n\nSome text in a draft.\n';
  const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.getByRole('button', { name: 'Preview' }).first().click({ timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const d = document.querySelector('dialog[open]');
      return d && (d.querySelector('iframe') || /Couldn.t create the preview/.test(d.textContent));
    },
    null,
    { timeout: 30_000 },
  );
  const failed = await page.evaluate(
    () => document.querySelector('dialog[open]')?.textContent.match(/Couldn.t create the preview[^]*/)?.[0],
  );
  if (failed) problems.push(`${label}: ${failed.slice(0, 120)}`);
  const bar = await page.evaluate(() => {
    const caption = document.querySelector('dialog[open] [data-preview-width]').getBoundingClientRect();
    const area = document.querySelector('dialog[open] [role="group"]').closest('.overflow-x-auto');
    const a = area.getBoundingClientRect();
    const apart =
      a.right <= caption.left + 0.5 || a.left >= caption.right - 0.5 || a.bottom <= caption.top + 0.5 || a.top >= caption.bottom - 0.5;
    return { apart, inside: a.left >= 0 && a.right <= innerWidth + 0.5, overflowX: getComputedStyle(area).overflowX };
  });
  if (!bar.apart) problems.push(`${label}: the size bar overlaps the caption`);
  if (!bar.inside) problems.push(`${label}: the size bar reaches outside the screen`);
  if (bar.overflowX !== 'auto') problems.push(`${label}: the size bar does not scroll (${bar.overflowX})`);
  await page.close();
}

/** A List typed in the text: while a row is active and the list has rows, the text button "Add list row" is under the last row and adds one, the faded empty row is not there, the active row has a dotted line, and Add above and Add below are icon buttons; when the cursor leaves, the button is gone. */
const inlineBlocks = [
  { name: 'list', hint: 'Rows with icon, heading and text.', add: 'Add list row' },
  { name: 'steps', hint: 'Numbered steps.', add: 'Add step', noEdit: true },
  { name: 'segmented', hint: 'Rows that expand, with a link.', add: 'Add row', rowButtons: 'Add button', surface: true },
  { name: 'cards', hint: 'Cards that link to pages.', add: 'Add card', surface: true, start: 3 },
  { name: 'pricecards', hint: 'Prices with what is included.', add: 'Add price card', surface: true, field: 'name' },
  { name: 'buttons', hint: 'Buttons with text and icon.', add: 'Add button', surface: true, field: 'label' },
  {
    name: 'faq',
    hint: 'Questions that expand to answers.',
    add: 'Add question',
    field: 'question',
    open: true,
    surface: true,
    listButton: true,
  },
  // An app's block (the demo's Inline example app): typed in place from its own Inline.tsx, not from the editor's list of views.
  { name: 'tickets', hint: 'Rows with a heading and a text, typed where they stand.', add: 'Add ticket' },
];

/** The blocks that read a list of the site (Testimonials, Blog posts), typed in place: drawn as the site draws them with the demo's real items, the heading typed above. */
const liveLists = [
  { name: 'testimonials', hint: 'Testimonials as cards or in a list.', items: '[data-testimonial]' },
  { name: 'posts', hint: 'Blog posts in a list.', items: '.block-posts-in-text li' },
];

async function checkLiveList(width, height, { name, hint, items }) {
  const label = `${width}px inline ${name}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  try {
    await page.waitForSelector('.site-block-inline [data-field="heading"]', { timeout: 8000 });
  } catch {
    problems.push(`${label}: the block was not typed in place (no heading field)`);
    return page.close();
  }
  if (await page.locator('dialog[open]').count()) problems.push(`${label}: Insert opened a sheet`);
  if (!(await page.locator(`.site-block-inline ${items}`).count())) problems.push(`${label}: the block shows none of the demo's items`);
  await page.keyboard.type('Our list');
  // The gear opens the settings: they do not repeat the heading and subheading typed in place, and still hold the rest.
  if (phone)
    await page
      .locator('.contextual-menu button[aria-label="Edit"]')
      .first()
      .evaluate((b) => b.click());
  else {
    await page
      .locator(
        '.contextual-menu > button:last-child, .contextual-menu [aria-label="Testimonials"], .contextual-menu [aria-label="Blog posts"]',
      )
      .last()
      .evaluate((b) => b.click());
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).first().click();
  }
  await page.waitForTimeout(500);
  const settings = await page.evaluate(() =>
    [
      ...document.querySelectorAll('dialog[open] :is(label, legend, [data-field-label]), [data-side-sheet-container] :is(label, legend)'),
    ].map((e) => e.textContent.trim()),
  );
  if (settings.some((x) => /^(heading|subheading)$/i.test(x)))
    problems.push(`${label}: the settings repeat the typed heading or subheading (${settings.join(', ')})`);
  if (!settings.length) problems.push(`${label}: the settings show no field`);
  await page.screenshot({ path: join(shots, `live-list-settings-${name}-${width}.png`) });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  const drawn = await page.evaluate(
    (sel) => ({
      field: !!document.querySelector('.site-block-inline [data-field="heading"]'),
      heading: document.querySelector('.site-block-inline h2')?.textContent ?? '',
      items: document.querySelectorAll(`.site-block-inline ${sel}`).length,
    }),
    items,
  );
  if (drawn.field) problems.push(`${label}: the head is still a field after the cursor left`);
  if (drawn.heading !== 'Our list') problems.push(`${label}: the typed heading is drawn as "${drawn.heading}", not "Our list"`);
  if (!drawn.items) problems.push(`${label}: the items are gone after the cursor left`);
  await page.close();
}

/** The single blocks typed in place (Notice, Video): one item, no add button, no faded empty item. */
const inlineSingles = [
  { name: 'notice', hint: 'A highlighted message.', field: 'text', text: 'Hello **there**', slot: false },
  { name: 'video', hint: 'A YouTube or Vimeo video.', field: 'title', text: 'My film', slot: true },
];

/** An empty row in a block typed in place (the Segmented list's "New row" left empty) is not a snackbar and a page that cannot be saved: Save draft or Publish scrolls to the block and asks (375 px, touch): "You have an empty segmented list row." with Remove item (the row goes, nothing is saved), the action tapped (the page is saved without the empty rows) and Cancel (nothing changes). A page without an empty row saves as before, with no question. */
async function checkEmptyRow(width, height) {
  const label = `${width}px empty row`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const commits = [];
  await page.route('**/api/github/commit', (r) => {
    commits.push(JSON.parse(r.request().postData() || '{}'));
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'head', blobs: {} }) });
  });
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().tap();
  await page.locator('[aria-label="Insert"]:visible').first().tap();
  await page.locator('dialog[open] button', { hasText: 'Rows that expand, with a link.' }).first().click();
  await page.waitForSelector('.inline-list-row-active [data-field="title"]');
  const dialog = page.locator('dialog[open]');
  const rows = () => page.locator('.inline-list-row[data-row]:not(.inline-list-row-next)').count();
  const blocks = () => page.locator('.site-block-inline').count();
  // A tap on the bar's button; `keys`: the button pressed with the cursor still in the block (a key, not a tap), so the empty row is still there.
  const press = async (name, keys) => {
    const button = page.getByRole('button', { name, exact: true }).first();
    if (keys) await button.evaluate((b) => b.click());
    else await button.tap();
    await page.waitForTimeout(700);
  };
  const buttons = () => dialog.getByRole('button').allTextContents();
  const sayOf = () => dialog.locator('p').first().textContent();
  const sent = (n) => commits.slice(n).flatMap((c) => c.changes.map((x) => Buffer.from(x.content ?? '', 'base64').toString('utf8')));
  // The block has no row at all (the faded "New row", left empty): Publish asks to delete the block, with the block marked and in view.
  await press('Publish');
  if (!(await dialog.count())) problems.push(`${label}: a block with no row on Publish did not open a dialog`);
  else {
    if ((await sayOf()) !== 'Segmented list has no rows. The block will be deleted.')
      problems.push(`${label}: the dialog says "${await sayOf()}"`);
    const got = await buttons();
    if (got.join('|') !== 'Cancel|Delete and publish')
      problems.push(`${label}: the dialog has "${got.join('|')}", not "Cancel|Delete and publish"`);
    const kinds = await dialog.getByRole('button').evaluateAll((b) => b.map((x) => x.className));
    if (kinds.length !== 2 || kinds[0] === kinds[1]) problems.push(`${label}: the main choice is not the only filled button`);
    if (await dialog.locator('button:focus').count()) problems.push(`${label}: a button has the focus`);
    const marked = await page.evaluate(() => {
      const el = document.querySelector('.editor-wrong');
      const r = el?.getBoundingClientRect();
      return !!el && r.bottom > 0 && r.top < innerHeight;
    });
    if (!marked) problems.push(`${label}: the block is not marked and in view behind the dialog`);
    await page.screenshot({ path: join(shots, `empty-block-${width}.png`) });
    // Cancel closes it and changes nothing.
    await dialog.getByRole('button', { name: 'Cancel' }).tap();
    await page.waitForTimeout(300);
    if ((await dialog.count()) || commits.length || (await blocks()) !== 1)
      problems.push(`${label}: Cancel changed something (commits ${commits.length}, blocks ${await blocks()})`);
    // Delete and publish: the block goes and the page is saved without it.
    await press('Publish');
    await dialog.getByRole('button', { name: 'Delete and publish' }).tap();
    await page.waitForTimeout(1200);
    if ((await dialog.count()) || !commits.length || (await blocks()) !== 0 || /data-block/.test(sent(0).join('\n')))
      problems.push(
        `${label}: Delete and publish left ${await blocks()} blocks, ${commits.length} commits, dialog ${await dialog.count()}`,
      );
  }
  // A list with an empty row between its rows: Remove item takes that row, Save draft saves without it.
  const first = commits.length;
  const makeList = async () => {
    await page.click('.ProseMirror > p');
    await page.keyboard.press('Enter');
    if (!(await page.locator('[aria-label="Insert"]:visible').count()))
      await page.locator('[aria-label="Show more tools"]:visible').first().tap();
    await page.locator('[aria-label="Insert"]:visible').first().tap();
    await page.locator('dialog[open] button', { hasText: 'Rows that expand, with a link.' }).first().click();
    await page.waitForSelector('.inline-list-row-active [data-field="title"]');
    await page.keyboard.type('First');
    for (const word of ['Second', 'Third']) {
      await page.locator('[data-add-row]').tap();
      await page.waitForTimeout(200);
      await page.keyboard.type(word);
    }
    // The middle row is emptied (Delete, not Backspace, which would drop an empty row).
    await page.locator('.inline-list-row[data-row="1"] [data-field="title"]').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
  };
  await makeList();
  if ((await rows()) !== 3) problems.push(`${label}: expected 3 rows before saving, got ${await rows()}`);
  await press('Save draft', true);
  if (!(await dialog.count())) problems.push(`${label}: an empty row between rows on Save draft did not open a dialog`);
  else {
    const got = await buttons();
    if (got.join('|') !== 'Remove item|Save draft|Cancel')
      problems.push(`${label}: the dialog has "${got.join('|')}", not "Remove item|Save draft|Cancel"`);
    await dialog.getByRole('button', { name: 'Remove item' }).tap();
    await page.waitForTimeout(400);
    if (commits.length !== first || (await rows()) !== 2 || (await blocks()) !== 1)
      problems.push(`${label}: Remove item left ${await rows()} rows (not 2), ${commits.length} commits`);
  }
  // Saved as it is now: no question, and no empty row in the file.
  await press('Save draft', true);
  if (await dialog.count()) problems.push(`${label}: a list without an empty row still asked`);
  if (commits.length === first) problems.push(`${label}: a list without an empty row was not saved`);
  else if (/"title":""/.test(sent(first).join('\n'))) problems.push(`${label}: the saved page has an empty row`);
  // An empty row again, and the third button: the page is saved with the row left out, and the list in the editor has two.
  const before = commits.length;
  await page
    .locator('[data-add-row]')
    .count()
    .catch(() => 0);
  await page.locator('.inline-list-row[data-row="0"] [data-field="title"]').click();
  await page.keyboard.type(' again');
  await page.locator('[data-add-row]').tap();
  await page.waitForTimeout(300);
  if ((await rows()) !== 3) problems.push(`${label}: expected 3 rows with a new empty one, got ${await rows()}`);
  await press('Save draft', true);
  if (!(await dialog.count())) problems.push(`${label}: the new empty row did not open the dialog`);
  else {
    await dialog.getByRole('button', { name: 'Save draft' }).tap();
    await page.waitForTimeout(1200);
    if (commits.length === before) problems.push(`${label}: Save draft in the dialog saved nothing`);
    else if (/"title":""/.test(sent(before).join('\n'))) problems.push(`${label}: Save draft in the dialog saved the empty row`);
    if ((await rows()) !== 2) problems.push(`${label}: after Save draft in the dialog the list has ${await rows()} rows, not 2`);
  }
  await page.close();
}

/** Insert of every block typed in place (the lists above and the Table) puts the block in the text, on an empty page and after a line of text: it never opens a sheet. A new typed-in-place block goes in `inlineBlocks`, `inlineSingles` or here. */
async function checkInsertNeverOpensSheet(width, height) {
  const phone = width < 600;
  const hints = [...inlineBlocks, ...inlineSingles, ...liveLists, { name: 'table', hint: 'Rows and columns of text.' }];
  for (const { name, hint } of hints) {
    for (const typed of [false, true]) {
      const label = `${width}px Insert of ${name}${typed ? '' : ' on an empty page'}`;
      const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
      page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
      await openEditor(page, site);
      await page.evaluate(() => (location.hash = '#new/pages'));
      await page.waitForSelector('.ProseMirror');
      await page.click('.ProseMirror');
      if (typed) {
        await page.keyboard.type('Hello');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
      if (!(await page.locator('[aria-label="Insert"]:visible').count()))
        await page.locator('[aria-label="Show more tools"]:visible').first().click();
      await page.locator('[aria-label="Insert"]:visible').first().click();
      await page.locator('dialog[open] button', { hasText: hint }).first().click();
      await page.waitForTimeout(800);
      const state = await page.evaluate(() => ({
        sheet: document.querySelectorAll('dialog[open]').length,
        inline: !!document.querySelector('.site-block-inline'),
      }));
      if (state.sheet) problems.push(`${label}: Insert opened a sheet, it must put the block in the text`);
      else if (!state.inline) problems.push(`${label}: Insert put no block typed in place in the text`);
      await page.close();
    }
  }
}

async function checkInlineSingle(width, height, { name, hint, field, text, slot }) {
  const label = `${width}px inline ${name}`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().tap();
  await page.locator('[aria-label="Insert"]:visible').first().tap();
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  await page.waitForSelector(`.site-block-inline [data-field="${field}"]`);
  await page.keyboard.type(text);
  await page.waitForTimeout(300);
  const state = () =>
    page.evaluate(
      (f) => ({
        value: document.querySelector(`.site-block-inline [data-field="${f}"]`)?.value ?? null,
        add: document.querySelectorAll('[data-add-row]').length,
        next: document.querySelectorAll('.inline-list-row-next').length,
        outline: getComputedStyle(document.querySelector('.site-block-inline .inline-list-row-active')).outlineStyle,
        slot: !!document.querySelector('.site-block-inline .inline-list-slot'),
      }),
      field,
    );
  const one = await state();
  if (one.value !== text) problems.push(`${label}: typed "${text}", the field has "${one.value}"`);
  if (one.add) problems.push(`${label}: a single block has an add button`);
  if (one.next) problems.push(`${label}: a single block shows a faded empty item`);
  if (one.outline !== 'dotted') problems.push(`${label}: the active block has outline ${one.outline}, not dotted`);
  if (one.slot !== slot) problems.push(`${label}: the slot is ${one.slot ? 'shown' : 'missing'}`);
  await page.screenshot({ path: join(shots, `inline-${name}-${width}.png`) });
  // Enter does not make a second line or item.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  if ((await state()).value !== text) problems.push(`${label}: Enter changed the text`);
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  if ((await page.locator(`.site-block-inline [data-field="${field}"]`).count()) && name === 'notice')
    problems.push(`${label}: the notice still shows its field after the cursor left`);
  await page.close();
}

/** Every block that picks an icon has the same control for it (the round button of ui.tsx, SlotButton): a plus while the row is active and has none, the icon once it
 * has one, and a tap on the icon of a row that is not the active one opens the icon picker for that row and makes it the active one, in one tap. */
async function checkIconSlots(width, height, { name, hint, field = 'title' }) {
  const label = `${width}px icon control in ${name}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  await page.waitForSelector(`.inline-list-row-active [data-field="${field}"]`, { timeout: 8000 });
  await page.keyboard.type('One');
  await page.waitForTimeout(300);
  await page.locator('[data-add-row]').click();
  await page.waitForTimeout(300);
  await page.keyboard.type('Two');
  await page.waitForTimeout(300);
  const slotOf = (row) => page.locator(`[data-row="${row}"] .inline-list-slot[aria-label="Icon"]`);
  // A card that has its media shows it as the button (a tap on it opens the picker); the other blocks show the round control.
  const controlOf = (row) => (name === 'cards' ? page.locator(`[data-row="${row}"] .inline-card-media`) : slotOf(row));
  // The active row has the control, empty: a plus, as a round button.
  if ((await slotOf(1).count()) !== 1) problems.push(`${label}: the active row has no icon control`);
  else if (!(await slotOf(1).evaluate((b) => b.tagName === 'BUTTON' && b.querySelectorAll('svg').length === 1)))
    problems.push(`${label}: the icon control of the active row is not a button with its plus`);
  if (await slotOf(0).count()) problems.push(`${label}: a row with no icon that is not active shows an icon control`);
  // The first row gets an icon from its own control.
  await page.locator(`[data-row="0"] [data-field="${field}"]`).click();
  await slotOf(0).click();
  const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
  await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the icon control did not open the icon picker`));
  await picker.getByRole('button').nth(1).click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Another row is active: the first row's icon is still the control, and one tap on it opens the picker and makes that row active.
  await page.locator(`[data-row="1"] [data-field="${field}"]`).click();
  await page.waitForTimeout(300);
  if (!(await page.locator('[data-row="1"].inline-list-row-active').count())) problems.push(`${label}: the second row is not active`);
  if ((await controlOf(0).count()) !== 1) problems.push(`${label}: a row with an icon that is not active has no icon control`);
  else {
    await controlOf(0).click();
    await page.waitForTimeout(400);
    if (
      !(await page
        .getByRole('group', { name: 'Icon', exact: true })
        .last()
        .isVisible()
        .catch(() => false))
    )
      problems.push(`${label}: a tap on the icon of a row that is not active does not open the icon picker`);
    if (!(await page.locator('[data-row="0"].inline-list-row-active').count()))
      problems.push(`${label}: a tap on the icon of a row that is not active does not make it the active row`);
  }
  await page.close();
}

/** A Segmented list whose rows are always open draws an arrow on a closed row that has a link; tapping it makes that row active and opens the row's link settings in one tap. */
async function checkSegmentedArrow(width, height) {
  const label = `${width}px inline segmented arrow`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: 'Rows that expand, with a link.' }).first().click();
  await page.waitForSelector('.inline-list-row-active [data-field="title"]', { timeout: 8000 });
  await page.keyboard.type('First');
  await page.waitForTimeout(300);
  // Row 1 gets a page (its link), in the row's settings.
  if (phone) await page.locator('.contextual-menu button[aria-label="Edit"]').first().click();
  await page.locator('[aria-label="Row settings"] button.text-field-input, .editor-side-sheet button.text-field-input').first().click();
  await page.getByText('About Morpheme', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(400);
  if (phone) await page.locator('dialog[open] [aria-label="Close"]').first().click();
  await page.waitForTimeout(400);
  // The rows are always open ("Always open" in the block's settings), so a closed row draws its arrow.
  await page.locator('.contextual-menu button[aria-label="Segmented list"]').first().click();
  await page.locator('.site-block-menu button[aria-label="Edit"]').click();
  await page.waitForTimeout(600);
  await page.getByText('Always open', { exact: true }).locator('visible=true').last().click();
  await page.getByRole('button', { name: 'Save', exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(500);
  await page.click('[data-add-row]');
  await page.keyboard.type('Second');
  await page.click('[data-add-row]');
  await page.keyboard.type('Third');
  await page.waitForTimeout(400);
  const arrows = await page.evaluate(() => ({
    row: [...document.querySelectorAll('.inline-list-row[data-row]:not(.inline-list-row-next)')].map(
      (r) => r.querySelectorAll('[data-row-arrow]').length,
    ),
    name: document.querySelector('[data-row-arrow]')?.getAttribute('aria-label'),
    tag: document.querySelector('[data-row-arrow]')?.tagName,
  }));
  if (arrows.row.join() !== '1,0,0')
    problems.push(`${label}: the arrows by row are ${arrows.row}, not 1,0,0 (only a closed row with a link has one)`);
  if (arrows.tag !== 'BUTTON' || arrows.name !== 'Link')
    problems.push(`${label}: the arrow is a ${arrows.tag} named "${arrows.name}", not a button named "Link"`);
  if (process.env.SHOTS_FULL) await page.screenshot({ path: `${process.env.SHOTS_FULL}-segmented-arrow-${width}.png` });
  // One tap on the arrow: row 1 is the active one and its link settings are open (the sheet on a phone, the side panel on a computer).
  await page.locator('[data-row="0"] [data-row-arrow]').click();
  await page.waitForTimeout(600);
  const tapped = await page.evaluate(() => document.querySelector('.inline-list-row-active')?.dataset.row);
  if (tapped !== '0') problems.push(`${label}: the arrow did not make its row active (row ${tapped})`);
  const settings = phone ? page.locator('dialog[open][aria-label="Row settings"]') : page.locator('.editor-side-sheet');
  if (!(await settings.getByText('Page', { exact: true }).count()) || !(await settings.getByText('About Morpheme').count()))
    problems.push(`${label}: the arrow did not open the row's link settings with its page`);
  await page.close();
}
/** `surface`: the item is a card with a container of its own, so it has a background colour. `start`: how many empty, faded items a new block starts with (the first active; typing in one makes the first item, and the others go). */
async function checkInlineBlock(
  width,
  height,
  { name, hint, add, surface, noEdit, rowButtons, listButton, field = 'title', open, start = 1 },
) {
  const label = `${width}px inline ${name}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  // The tools that do not fit are under "Show more tools".
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  try {
    await page.waitForSelector(`.inline-list-row-active [data-field="${field}"]`, { timeout: 8000 });
  } catch {
    problems.push(`${label}: the block was not typed in place (no active row with a "${field}" field)`);
    return page.close();
  }
  const faded = await page.locator('.inline-list-row-next').count();
  if (faded !== start) problems.push(`${label}: a new block starts with ${faded} empty, faded items, not ${start}`);
  if ((await page.locator('.inline-list-row-active').count()) !== 1) problems.push(`${label}: not exactly one active item at the start`);
  if (name === 'cards') {
    // The media area is there while the card is active: one button for each kind (icon, image, video); the link is the bar's, not a slot in the card; the action area has the next button, empty and faded.
    const slots = await page
      .locator('.inline-list-row-active .inline-list-slot')
      .evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')));
    if (slots.join() !== 'Icon,Image,Video')
      problems.push(`${label}: the active card's media buttons are "${slots}", not "Icon,Image,Video"`);
    if (await page.locator('.inline-list-row-active [aria-label="Link"]').count())
      problems.push(`${label}: the card has a link slot (the link is in the toolbar)`);
    const next = await page.locator('.inline-list-row-active .block-card-actions .inline-card-next-button').allTextContents();
    if (next.join() !== 'Add button')
      problems.push(`${label}: the active card's action area has "${next}", not the text button "Add button"`);
    if (width >= 1000 && !(await page.locator('.contextual-menu button[aria-label="Link"]').count()))
      problems.push(`${label}: the toolbar has no Link while the card is still empty`);
    // The header line of a card is a headline and ONE optional subhead, both typed in place; no badge, date or tags.
    const fields = await page.evaluate(() =>
      [...document.querySelectorAll('.inline-list-row-active [data-field]')].map((f) => f.dataset.field),
    );
    if (fields.join() !== 'title,subhead,text')
      problems.push(`${label}: the typed fields of a card are "${fields}", not "title,subhead,text"`);
  }
  if (name === 'buttons') {
    // An empty button's hint is the button kind's own text colour (never the page's), for every kind, and its settings offer the five kinds side by side.
    const hint = await page.evaluate(() => {
      const row = document.querySelector('.inline-list-row-active');
      const field = row.querySelector('.inline-list-field');
      const out = {};
      const was = row.className;
      for (const kind of ['filled', 'tonal', 'elevated', 'outlined', 'text']) {
        row.classList.remove('button-filled', 'button-tonal', 'button-elevated', 'button-outlined', 'button-text');
        row.classList.add(`button-${kind}`);
        out[kind] = [getComputedStyle(field, '::placeholder').color, getComputedStyle(row).color, getComputedStyle(field).color];
      }
      row.className = was;
      return out;
    });
    for (const [kind, [hintColor, rowColor, fieldColor]] of Object.entries(hint))
      if (hintColor !== rowColor || fieldColor !== rowColor)
        problems.push(`${label}: the ${kind} button's hint is ${hintColor} and its text ${fieldColor}, not its own ${rowColor}`);
    {
      // The contextual menu's Settings, a plain icon button on a computer and a phone.
      const link = page.locator('.contextual-menu [aria-label="Settings"]:visible').first();
      await link.click({ timeout: 4000 }).catch(() => problems.push(`${label}: the toolbar has no way to open the button's settings`));
      const kinds = ['Filled', 'Tonal', 'Elevated', 'Outlined', 'Text'];
      const group = page.locator('[role="group"][aria-label="Style"], [aria-label="Style"]').last();
      await group.waitFor({ timeout: 4000 }).catch(() => problems.push(`${label}: the button's settings have no Style choice`));
      const names = await group
        .getByRole('button')
        .allTextContents()
        .catch(() => []);
      if (names.map((n) => n.trim()).join() !== kinds.join()) problems.push(`${label}: the button's styles are "${names}", not "${kinds}"`);
      await group
        .getByRole('button', { name: 'Outlined', exact: true })
        .click({ timeout: 3000 })
        .catch(() => {});
      await page.waitForTimeout(300);
      if (!(await page.locator('.inline-list-row-active.button-outlined').count()))
        problems.push(`${label}: choosing Outlined does not change the active button's style`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.locator('.inline-list-row [data-field="label"]').first().click();
      // The pointer is away from the button: a state layer for a button pointed at is a passing state.
      await page.mouse.move(0, 0);
    }
    // The active button has its icon area, empty while it has no icon; a tap on it opens the icon picker and a choice sets the icon.
    const slot = page.locator('.inline-list-row-active .inline-list-slot[aria-label="Icon"]');
    if ((await slot.count()) !== 1) problems.push(`${label}: the active button has no icon area`);
    else {
      if ((await slot.locator('svg').count()) !== 1) problems.push(`${label}: the empty icon area has no placeholder`);
      await slot.click();
      const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
      await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the icon area did not open the icon picker`));
      await picker.getByRole('button').nth(1).click();
      await page.waitForTimeout(400);
      // The sheet that is left open (a phone's) is closed to get back to the button.
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await page.locator('.inline-list-row [data-field="label"]').first().click();
      if ((await page.locator('.inline-list-row-active .inline-list-slot[aria-label="Icon"] svg').count()) !== 1)
        problems.push(`${label}: the chosen icon is not shown in the active button's icon area`);
      await page.mouse.move(0, 0);
    }
  }
  await page.keyboard.type('First');
  await page.waitForTimeout(300);
  const state = () =>
    page.evaluate(() => ({
      rows: document.querySelectorAll('.inline-list-row[data-row]:not(.inline-list-row-next)').length,
      next: document.querySelectorAll('.inline-list-row-next').length,
      add: [...document.querySelectorAll('[data-add-row]')].map((b) => b.textContent.trim()),
      outline: getComputedStyle(document.querySelector('.inline-list-row-active')).outlineStyle,
      background: getComputedStyle(document.querySelector('.inline-list-row-active')).backgroundColor,
      activeRow: document.querySelector('.inline-list-row-active').dataset.row,
      bar: [...document.querySelectorAll('.contextual-menu button')].map((b) => ({
        label: b.getAttribute('aria-label'),
        svg: !!b.querySelector('svg path'),
      })),
      // A dropdown is a button with a text label and a chevron; the contextual menu has none, only icon buttons.
      dropdowns: [...document.querySelectorAll('.contextual-menu button')]
        .filter((b) => b.textContent.trim() || b.querySelector('svg[width="12"]'))
        .map((b) => b.getAttribute('aria-label')),
    }));
  const one = await state();
  if (one.dropdowns.length) problems.push(`${label}: the contextual menu has a dropdown (${one.dropdowns}); it holds icon buttons only`);
  if (one.next) problems.push(`${label}: the faded empty item shows although the block has an item`);
  if (one.add.join() !== add) problems.push(`${label}: expected the button "${add}" under an active block, got "${one.add}"`);
  if (one.outline !== 'dotted') problems.push(`${label}: the active row has outline ${one.outline}, not dotted`);
  if (!surface && one.background !== 'rgba(0, 0, 0, 0)')
    problems.push(`${label}: the active row has a background colour (${one.background})`);
  // Everything the block draws follows the section it is in: the text, the placeholder (4.5:1), the slot icons and the dotted line (3:1)
  // on each section colour, light and dark, so a new inline block that leaves out a colour fails here.
  // No transitions while measuring: a colour read right after the section changes is the one it is still moving from.
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
  // The pointer is away from the block: a state layer for a row pointed at is a passing state, not the part's colour.
  await page.mouse.move(0, 0);
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    const colors = await page.evaluate(`(() => { ${ratioOf}
      const out = {};
      const row = document.querySelector('.inline-list-row-active');
      const top = row.closest('.ProseMirror > *');
      for (const color of ['surface', 'primary', 'secondary', 'tertiary']) {
        top.setAttribute('data-section-color', color);
        top.setAttribute('data-section-box', 'only');
        const field = row.querySelector('.inline-list-field');
        const ph = getComputedStyle(field, '::placeholder');
        const slot = row.querySelector('.inline-list-slot');
        const line = getComputedStyle(row);
        out[color] = {
          text: ratio(getComputedStyle(field).color, top, 1, field),
          placeholder: ratio(ph.color, top, parseFloat(ph.opacity), field),
          slot: slot ? ratio(getComputedStyle(slot).color, top, 1, slot) : null,
          outline: ratio(line.outlineColor, top, 1, row),
          // A list row's heading is the section's own text colour, as on the site (checkListRowColors).
          heading: name === 'list' ? [getComputedStyle(row.querySelector('[data-field="title"]')).color, getComputedStyle(top).color, slot && !slot.hasAttribute('data-icon-color') ? getComputedStyle(slot).color : null] : null,
        };
      }
      top.removeAttribute('data-section-color');
      top.removeAttribute('data-section-box');
      return out; })()`);
    for (const [color, got] of Object.entries(colors))
      if (got.heading && got.heading[0] !== got.heading[1])
        problems.push(
          `${label} (${scheme}): the row heading on a ${color} section is ${got.heading[0]}, not the section's text ${got.heading[1]}`,
        );
    for (const [color, got] of Object.entries(colors))
      if (got.heading?.[2] && got.heading[2] !== got.heading[0])
        problems.push(
          `${label} (${scheme}): the row icon on a ${color} section is ${got.heading[2]}, not the row heading's ${got.heading[0]}`,
        );
    for (const [color, got] of Object.entries(colors))
      for (const [part, min] of [
        ['text', 4.5],
        ['placeholder', 4.5],
        ['slot', 3],
        ['outline', 3],
      ])
        if (got[part] !== null && got[part] < min)
          problems.push(`${label} (${scheme}): the ${part} on a ${color} section has contrast ${got[part].toFixed(2)}:1, below ${min}`);
  }
  await page.emulateMedia({ colorScheme: 'light' });
  for (const name of ['Add above', 'Add below'])
    if (!one.bar.some((b) => b.label === name && b.svg)) problems.push(`${label}: the toolbar has no icon button "${name}"`);
  // The card's settings (the toolbar's gear on a phone, a sheet; the panel on a computer already) open with its page and buttons, never an empty page.
  const cardSettings = async (when) => {
    if (width >= 1000) return;
    await page.locator('.contextual-menu button[aria-label="Edit"]').click();
    const sheet = page.locator('dialog[open][aria-label="Card settings"]');
    await sheet.waitFor({ timeout: 4000 }).catch(() => problems.push(`${label}: the card's settings do not open (${when})`));
    if (!(await sheet.getByText(/^(Page|Buttons)$/).count())) problems.push(`${label}: the card's settings are empty (${when})`);
    await sheet
      .getByRole('button', { name: 'Close' })
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(300);
  };
  if (name === 'cards' && width >= 1000) {
    // A card has a page or buttons, never both: with a button the page is gone from its settings, with a page there are no buttons.
    const panel = page.locator('.editor-side-sheet');
    // The card's own Page field, found by its hint (a button has a Page of its own once it is added).
    const page_ = panel.getByText('With a page, the whole card is the link and has no buttons.');
    await page_.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the card's settings have no Page`));
    await panel.getByRole('button', { name: 'Add button' }).click();
    await page.waitForTimeout(300);
    if (await page_.count()) problems.push(`${label}: a card with a button still offers a Page`);
  }
  if (name === 'cards') {
    // A button is typed on the button itself, then the next one is there, empty and faded.
    await page.click('.inline-list-row-active [data-add-button]');
    await page.keyboard.type('Go');
    await page.waitForTimeout(300);
    const typed = await page
      .locator('.inline-list-row-active .inline-card-button textarea')
      .last()
      .inputValue()
      .catch(() => null);
    if (typed !== 'Go') problems.push(`${label}: the text typed on a card's new button is "${typed}", not "Go"`);
    if ((await page.locator('.inline-list-row-active .inline-card-next-button').count()) !== 1)
      problems.push(`${label}: no next button after the first`);
  }
  if (name === 'cards') await cardSettings('a card with a button');
  // A block with no settings (Steps): no Link action and no Edit button, a step has nothing to set.
  if (noEdit)
    for (const name of ['Link', 'Edit'])
      if (one.bar.some((b) => b.label === name)) problems.push(`${label}: the toolbar has "${name}" although the block has no settings`);
  // A text button under the whole list (the FAQ's): while the block is active its text is typed in a field under `Add` with a slot for its
  // page; it shows as the site draws it when the block is not active, and an empty field takes it away.
  if (listButton) {
    const field = page.locator('.inline-faq-button [data-field="button"]');
    if ((await field.count()) !== 1) problems.push(`${label}: no field for the button under the list in the active block`);
    else {
      if ((await page.locator('.inline-faq-button .inline-list-slot').count()) !== 1)
        problems.push(`${label}: no slot for the page of the button under the list`);
      await field.click();
      await page.keyboard.type('More questions');
      await page.waitForTimeout(300);
      await page.click('.ProseMirror p');
      await page.waitForTimeout(300);
      const shown = await page.locator('.site-block-inline .block-list-button').allTextContents();
      if (shown.map((x) => x.trim()).join() !== 'More questions')
        problems.push(`${label}: the button under the list is "${shown}" when the block is not active, not "More questions"`);
      await page.click('.site-block-inline [data-field="question"]');
      await page.locator('.inline-faq-button [data-field="button"]').fill('');
      await page.waitForTimeout(300);
      await page.click('.ProseMirror p');
      await page.waitForTimeout(300);
      if (await page.locator('.site-block-inline .block-list-button').count())
        problems.push(`${label}: the button under the list is still there after its text was cleared`);
      await page.click('.site-block-inline [data-field="question"]');
    }
  }
  // A row's buttons: under the active row's text the text button `rowButtons` adds a button whose text is typed there.
  if (rowButtons) {
    const adds = await page.locator('[data-add-button]').allTextContents();
    if (adds.map((s) => s.trim()).join() !== rowButtons)
      problems.push(`${label}: expected the button "${rowButtons}" in the active row, got "${adds}"`);
    // No Link at the top of the row (its slots or the toolbar): the row's page is set by `Link` at the bottom, where the site draws it.
    if (await page.locator('.inline-segmented-slots [aria-label="Link"], .inline-list-row-active > [aria-label="Link"]').count())
      problems.push(`${label}: the top of the row has a Link slot`);
    if ((await state()).bar.some((b) => b.label === 'Link')) problems.push(`${label}: the toolbar has a Link button`);
    if ((await page.locator('.inline-list-row-active [data-row-link]').count()) !== 1)
      problems.push(`${label}: the bottom of the active row has no Link button`);
    await page.click('[data-add-button]');
    await page.keyboard.type('More');
    await page.waitForTimeout(300);
    const typed = await page
      .locator('.inline-segmented-button textarea')
      .inputValue()
      .catch(() => null);
    if (typed !== 'More') problems.push(`${label}: the text typed in a row's new button is "${typed}", not "More"`);
    // A row has at most one button: with one, `Add button` is gone and Enter in its text adds no second.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    if ((await page.locator('[data-add-button]').count()) !== 0)
      problems.push(`${label}: "${rowButtons}" stays although the row has a button`);
    if ((await page.locator('.inline-segmented-button').count()) !== 1) problems.push(`${label}: a row got a second button`);
    // `Link` at the bottom opens the row's sheet, which has the page (and it can be cleared there).
    await page.locator('.inline-list-row-active [data-row-link]').click();
    await page.waitForTimeout(500);
    if (!(await page.getByText('Page', { exact: true }).count()))
      problems.push(`${label}: the bottom Link did not open the row's page field`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  if (phone) {
    // A touch screen has no hover (hover: none), but the browser leaves :hover on what was tapped: the add button stays a text button, without the pointed-at background.
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'hover', value: 'none' }] });
    await page.locator('[data-add-row]').hover();
    await page.waitForTimeout(400);
    const sticky = await page.evaluate(() => {
      const b = document.querySelector('[data-add-row]');
      const c = getComputedStyle(b);
      return { pointed: b.matches(':hover'), background: c.backgroundColor, shadow: c.boxShadow };
    });
    if (!sticky.pointed || sticky.background !== 'rgba(0, 0, 0, 0)' || sticky.shadow !== 'none')
      problems.push(`${label}: "${add}" tapped on a touch screen is no longer a text button (${JSON.stringify(sticky)})`);
    await session.send('Emulation.setEmulatedMedia', { features: [] });
  }
  await page.click('[data-add-row]');
  await page.waitForTimeout(300);
  const two = await state();
  if (two.rows !== 2) problems.push(`${label}: "${add}" left ${two.rows} items, not 2`);
  if (open) {
    // A folding block: only the active item is open (its answer typed in the panel), the others closed, and a typed item has no Link.
    const opened = await page.evaluate(() => [...document.querySelectorAll('.inline-list-row[data-row]')].map((d) => d.open));
    if (opened.join() !== 'false,true') problems.push(`${label}: expected only the active item open, got ${opened}`);
    if (!(await page.locator('.inline-list-row-active [data-field="answer"]').count()))
      problems.push(`${label}: no answer field in the open item`);
    if ((await state()).bar.some((b) => b.label === 'Link')) problems.push(`${label}: the toolbar has a Link button`);
  }
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  if ((await page.locator('[data-add-row]').count()) > 0)
    problems.push(`${label}: the button "${add}" stays after the cursor left the block`);
  // The row keeps the colour it has on the site while it is typed in: its background is the same once the cursor has left it.
  const kept = await page.evaluate(
    (i) => getComputedStyle(document.querySelector(`.inline-list-row[data-row="${i}"]`)).backgroundColor,
    one.activeRow,
  );
  if (kept !== one.background)
    problems.push(`${label}: the row has background ${one.background} while typed in, ${kept} when the cursor left it`);
  if (name === 'cards') {
    // A media that is set is changed by a tap on it: an icon is picked from the Icon button, then the icon itself opens the picker and no media button is left.
    await page.locator('.inline-list-row [data-field="title"]').first().click();
    await page.locator('.inline-list-row-active .inline-list-slot[aria-label="Icon"]').click();
    const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
    await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the Icon button did not open the icon picker`));
    await picker.getByRole('button').nth(1).click();
    await page.waitForTimeout(400);
    // The sheet over a phone's screen is closed to get back to the card.
    await page
      .locator('dialog[open] button[aria-label="Close"]')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(300);
    await page.locator('.inline-list-row [data-field="title"]').first().click();
    if ((await page.locator('.inline-list-row-active .inline-card-media').count()) !== 1)
      problems.push(`${label}: a card with an icon does not show the icon as a button`);
    if (await page.locator('.inline-list-row-active .inline-card-slots').count())
      problems.push(`${label}: the media buttons show although the card has its icon`);
    if ((await page.locator('.inline-list-row-active .inline-card-media svg').count()) !== 1)
      problems.push(`${label}: the card's icon is not shown exactly once`);
    await cardSettings('a card with an icon');
    // A video: the Media choice of the first card, then its link.
    await page.locator('.inline-list-row-active .inline-card-media').click();
    await page.getByRole('button', { name: 'Video', exact: true }).last().click();
    await page.getByRole('textbox', { name: 'Video link' }).fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    await page.waitForTimeout(400);
    await page
      .locator('dialog[open] button[aria-label="Close"]')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(300);
    await page.locator('.inline-list-row [data-field="title"]').first().click();
    await cardSettings('a card with a video');
  }
  await page.close();
}

/** Steps typed in the text: Enter in the heading goes to the text, Enter in the text adds the next step, Backspace in an empty heading removes the step, moving a step renumbers, pasted lines make one step each (not when the paste has headings), a heading without text is kept, and the saved form is `items: [{ title, text }]`. */
async function checkSteps(width, height) {
  const label = `${width}px steps`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: 'Numbered steps.' }).first().click();
  await page.waitForSelector('.inline-steps .inline-list-row-active [data-field="title"]');
  const steps = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.inline-steps .block-step[data-row]:not(.inline-list-row-next)')].map((li) => ({
        number: li.querySelector('.block-step-number').textContent,
        title: li.querySelector('[data-field="title"]').value,
        text: li.querySelector('[data-field="text"]').value,
      })),
    );
  const faded = () => page.locator('.inline-steps .inline-list-row-next').count();
  if ((await faded()) !== 1) problems.push(`${label}: a new Steps block does not start with one faded, empty step`);
  const number = await page.locator('.inline-steps .block-step-number').first().textContent();
  if (number !== '1') problems.push(`${label}: the first step is numbered ${number}`);
  await page.keyboard.type('Order');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Choose it');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Pay');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Get it');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Ship');
  await page.waitForTimeout(200);
  let now = await steps();
  if (
    JSON.stringify(now.map((s) => [s.title, s.text])) !==
    JSON.stringify([
      ['Order', 'Choose it'],
      ['Pay', 'Get it'],
      ['Ship', ''],
    ])
  )
    problems.push(`${label}: Enter did not go heading, text, next step: ${JSON.stringify(now)}`);
  // Enter in the heading goes to the text and Enter in an empty text adds nothing (a heading without text is kept as it is); in the text
  // with something in it Enter adds a step, and Backspace in its empty heading removes it again.
  await page.keyboard.press('Enter');
  await page.keyboard.type('Soon');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  if ((await steps()).length !== 4) problems.push(`${label}: Enter in the text did not add a step`);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  now = await steps();
  if (now.length !== 3 || now[2].title !== 'Ship')
    problems.push(`${label}: Backspace in an empty heading did not remove the step: ${JSON.stringify(now)}`);
  // Moving a step renumbers.
  await page.locator('.inline-steps [data-row="0"] [data-field="title"]').click();
  await page.waitForTimeout(200);
  const down = page.locator('.contextual-menu button[aria-label="Move down"]');
  await down.first().click();
  await page.waitForTimeout(200);
  now = await steps();
  if (now[1]?.title !== 'Order' || now.map((s) => s.number).join() !== '1,2,3')
    problems.push(`${label}: Move down did not move and renumber the step: ${JSON.stringify(now)}`);
  await page.close();
  // Pasting lines into an empty Steps block makes a step of each; headings among them leave the paste as it is.
  for (const [html, plain, expected] of [
    ['<p>Order</p><p>Pay</p><p>Get it</p>', 'Order\nPay\nGet it', 3],
    ['<h2>Order</h2><p>Pay</p>', 'Order\nPay', 0],
  ]) {
    const p2 = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
    p2.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(p2, site);
    await p2.evaluate(() => (location.hash = '#new/pages'));
    await p2.waitForSelector('.ProseMirror');
    await p2.click('.ProseMirror');
    await p2.keyboard.type('Hello');
    await p2.keyboard.press('Enter');
    await p2.waitForTimeout(300);
    if (!(await p2.locator('[aria-label="Insert"]:visible').count()))
      await p2.locator('[aria-label="Show more tools"]:visible').first().click();
    await p2.locator('[aria-label="Insert"]:visible').first().click();
    await p2.locator('dialog[open] button', { hasText: 'Numbered steps.' }).first().click();
    await p2.waitForSelector('.inline-steps .inline-list-row-active [data-field="title"]');
    const taken = await p2.evaluate(
      ([html, plain]) => {
        const data = new DataTransfer();
        data.setData('text/plain', plain);
        data.setData('text/html', html);
        // true when a step took the paste over (preventDefault), false when it is left to the browser as it is.
        return !document
          .querySelector('.inline-steps [data-field="title"]')
          .dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
      },
      [html, plain],
    );
    if (taken !== expected > 0)
      problems.push(`${label}: the paste ${html} was ${taken ? 'taken over' : 'left as it is'}, not the other way`);
    await p2.waitForTimeout(300);
    const made = await p2.locator('.inline-steps .block-step[data-row]:not(.inline-list-row-next)').count();
    if (made !== expected) problems.push(`${label}: pasting ${html} made ${made} steps, not ${expected}`);
    await p2.close();
  }
}

/** The dynamic List (the owner's flow): the dynamic icon in the contextual menu opens the dynamic settings (a bottom sheet on a phone, the side panel on a computer) with `Rows from`; picking a list turns the block into a "Dynamic list" with its state line, `Edit list` and an `Undo` that brings the typed rows back; the toolbar then has no row actions and stays inside the screen. */
async function checkDynamicList(width, height) {
  const label = `${width}px dynamic list`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().tap();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: 'Rows with icon, heading and text.' }).first().click();
  await page.waitForSelector('.inline-list-row-active [data-field="title"]');
  await page.keyboard.type('Typed row');
  await page.waitForTimeout(300);
  const bar = () =>
    page.evaluate(() => {
      const el = document.querySelector('.contextual-menu');
      const r = el && !el.hidden ? el.getBoundingClientRect() : null;
      return {
        labels: [...document.querySelectorAll('.contextual-menu button')].map((b) => b.getAttribute('aria-label')),
        inside: !r || (r.left >= 0 && r.right <= innerWidth + 0.5),
        small: [...document.querySelectorAll('.contextual-menu button')].some((b) => b.getBoundingClientRect().height < 47.5),
      };
    });
  const typed = await bar();
  if (!typed.labels.includes('Fill from a list')) problems.push(`${label}: the toolbar has no dynamic icon`);
  if (!typed.inside) problems.push(`${label}: the toolbar reaches outside the screen`);
  if (typed.small) problems.push(`${label}: a toolbar button is under 48 px high`);
  await page.locator('.contextual-menu [aria-label="Fill from a list"]').click();
  const panel = page.locator('dialog[open], .editor-side-sheet').filter({ hasText: 'Rows from' }).first();
  await panel.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the dynamic settings did not open`));
  await panel.locator('button.text-field-input').first().click();
  await page.getByText('Testimonials', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(500);
  // A phone's bottom sheet covers the block: closed, the block shows its state (the side panel on a computer stays open).
  if (phone) await page.locator('dialog[open] [aria-label="Close"]').first().click();
  await page.waitForTimeout(400);
  const text = await page.locator('.site-block-preview').first().textContent();
  if (!/From Testimonials · \d+ items?/.test(text ?? ''))
    problems.push(`${label}: no state line "From Testimonials · n items" (${text?.slice(0, 80)})`);
  if (!(await page.getByRole('button', { name: 'Edit list' }).count())) problems.push(`${label}: no "Edit list" button`);
  if (!(await page.getByRole('button', { name: 'Undo', exact: true }).last().count()))
    problems.push(`${label}: no Undo after the typed rows were set aside`);
  const dynamic = await bar();
  if (dynamic.labels.some((l) => /^Add (above|below)$/.test(l ?? ''))) problems.push(`${label}: a dynamic list has Add above or Add below`);
  if (!dynamic.inside) problems.push(`${label}: the dynamic toolbar reaches outside the screen`);
  await page.locator('.site-block-preview button', { hasText: 'Undo' }).click();
  await page.waitForTimeout(400);
  if (!(await page.locator('.inline-list-row[data-row]').count())) problems.push(`${label}: Undo did not bring the typed rows back`);
  await page.close();
}

/** The field picker of a dynamic List: with the demo's own list "Highlights" as its source, the rows show its items, each part of a row has a button with the field now shown, a tap on the bottom line (the button or the row's own line) opens the choice of the list's fields (a bottom sheet on a phone, a menu in the side panel on a computer), and a pick shows in the rows and in the button (it is read from the block's `map`). */
async function checkDynamicPicker(width, height) {
  const label = `${width}px dynamic list field picker`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().tap();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: 'Rows with icon, heading and text.' }).first().click();
  await page.waitForSelector('.inline-list-row-active [data-field="title"]');
  await page.locator('.contextual-menu [aria-label="Fill from a list"]').click();
  const panel = page.locator('dialog[open], .editor-side-sheet').filter({ hasText: 'Rows from' }).first();
  await panel.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the dynamic settings did not open`));
  await panel.locator('button.text-field-input').first().click();
  await page.getByText('Highlights', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(500);
  if (phone) await page.locator('dialog[open] [aria-label="Close"]').first().click();
  await page.waitForTimeout(400);
  const block = page.locator('.site-block-preview').first();
  const lines = () => block.locator('.list-item-supporting').allTextContents();
  const buttons = () => block.locator('.inline-list-parts button').allTextContents();
  if ((await block.locator('.list-item-headline').count()) !== 3)
    problems.push(`${label}: the block does not show the 3 items of the list`);
  const before = await buttons();
  if (before.join('|') !== 'Top line: Title|Bottom line: Body text|Icon: Icon|Link: Link')
    problems.push(`${label}: the part buttons are "${before.join('|')}", not the list's own fields`);
  await block.locator('.inline-list-parts button', { hasText: 'Bottom line' }).click();
  const choice = page.locator('dialog[open], .editor-side-sheet').filter({ hasText: 'Field shown' }).first();
  await choice.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the choice of fields did not open`));
  await choice.locator('button.text-field-input').first().click();
  await page.getByText('Title', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(500);
  if (phone && (await page.locator('dialog[open]').count())) await page.locator('dialog[open] [aria-label="Close"]').first().click();
  await page.waitForTimeout(400);
  const after = await buttons();
  if (!after.includes('Bottom line: Title'))
    problems.push(`${label}: the button does not say "Bottom line: Title" after the pick (${after.join('|')})`);
  if ((await lines())[0] !== 'Edit on your phone')
    problems.push(`${label}: the bottom line of the first row is "${(await lines())[0]}", not its title`);
  // A tap on the row's own bottom line opens the same choice.
  await block.locator('.list-item-supporting').first().click();
  await page
    .locator('dialog[open], .editor-side-sheet')
    .filter({ hasText: 'Field shown' })
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => problems.push(`${label}: a tap on a row's bottom line did not open the choice of fields`));
  await page.close();
}

/** The page of a list the owner made (#list/<id>, OwnListPage.tsx): the List typed in place, its rows the entries of the list. A list with a definition and two entries opens with two rows, no horizontal overflow; the active row has the dotted outline and no background, `Add list row` shows under an active list and is gone when the cursor leaves, the toolbar has Add above and Add below, Enter in the title goes to the text, and only the fields the list has are there (no icon slot, no link slot). */
async function checkOwnList(width, height) {
  const label = `${width}px own list`;
  const phone = width < 600;
  const folder = join(ROOT, 'src/data/services');
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    join(folder, '_list.json'),
    JSON.stringify({ version: 1, label: 'Services', fields: ['title', 'text', 'href', 'image', 'tags'] }),
  );
  writeFileSync(join(folder, 'web-design.json'), JSON.stringify({ order: 1, title: 'Web design', text: 'Sites that last' }));
  writeFileSync(join(folder, 'hosting.json'), JSON.stringify({ order: 2, title: 'Hosting' }));
  // A page that reads the list, so `Delete list` is refused.
  const pagePath = join(ROOT, 'src/content/pages/zz-reads-services.md');
  writeFileSync(
    pagePath,
    '---\ntitle: "Reads services"\n---\n\n# Reads services\n\n<div data-block="list" data-props="{&quot;from&quot;:&quot;services&quot;}"></div>\n',
  );
  try {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#list/services'));
    await page
      .waitForSelector('.inline-list-row[data-row]', { timeout: 15000 })
      .catch(() => problems.push(`${label}: the list page has no rows`));
    const rows = await page.locator('.inline-list-row[data-row]:not(.inline-list-row-next)').count();
    if (rows !== 2) problems.push(`${label}: expected 2 rows, got ${rows}`);
    if (await page.locator('.inline-list-row-next').count()) problems.push(`${label}: the faded empty row shows while the list has rows`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
      problems.push(`${label}: the list page scrolls sideways`);
    await page.locator('.inline-list-row[data-row="0"] [data-field="title"]').click();
    await page.waitForSelector('.inline-list-row-active');
    const active = await page.evaluate(() => {
      const row = document.querySelector('.inline-list-row-active');
      return {
        outline: getComputedStyle(row).outlineStyle,
        background: getComputedStyle(row).backgroundColor,
        icon: !!row.querySelector('[aria-label="Icon"]'),
        link: !!row.querySelector('[aria-label="Page"], [aria-label="Link"]'),
      };
    });
    if (active.outline !== 'dotted') problems.push(`${label}: the active row has no dotted outline (${active.outline})`);
    if (!/rgba\(0, 0, 0, 0\)|transparent/.test(active.background))
      problems.push(`${label}: the active row has a background (${active.background})`);
    if (active.icon) problems.push(`${label}: an icon slot shows in a list without the icon field`);
    if (!(await page.getByRole('button', { name: 'Add list row' }).count()))
      problems.push(`${label}: no "Add list row" under the active list`);
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll('.contextual-menu button')].map((b) => b.getAttribute('aria-label')),
    );
    for (const need of ['Add above', 'Add below'])
      if (!labels.includes(need)) problems.push(`${label}: the toolbar has no "${need}" (${labels})`);
    await page.keyboard.press('Enter');
    if (!(await page.evaluate(() => document.activeElement?.getAttribute('data-field') === 'text')))
      problems.push(`${label}: Enter in the title did not go to the text`);
    // The image and tags slots are on the active row, since the list has those fields; the tags slot opens the tags.
    await page.locator('.inline-list-row[data-row="0"] [data-field="title"]').click();
    for (const slot of ['Image', 'Tags'])
      if (!(await page.locator(`.inline-list-row-active [aria-label="${slot}"]`).count()))
        problems.push(`${label}: no ${slot} slot on the active row`);
    await page.locator('.inline-list-row-active [aria-label="Tags"]').click();
    await page
      .locator('dialog[open], .editor-side-sheet')
      .filter({ hasText: 'Tags' })
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => problems.push(`${label}: the tags slot did not open the tags`));
    if (phone)
      await page
        .locator('dialog[open] [aria-label="Close"]')
        .first()
        .click()
        .catch(() => {});
    await page
      .locator('main h1, header')
      .first()
      .click({ position: { x: 5, y: 5 }, force: true })
      .catch(() => {});
    await page.waitForTimeout(300);
    if (await page.locator('.inline-list-row-active').count()) problems.push(`${label}: the row is still active after the cursor left`);
    if (await page.getByRole('button', { name: 'Add list row' }).count())
      problems.push(`${label}: "Add list row" stays after the cursor left`);
    // The list's menu: `Edit list` opens the sheet with the name, the six switches and `Delete list`; `Delete list` is refused while a page reads the list.
    await page.getByRole('button', { name: 'List menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit list' }).first().click();
    const sheet = page.locator('dialog[open]').filter({ hasText: 'Fields' });
    await sheet.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: Edit list did not open its sheet`));
    // The list was made in the first format (fields as kind names): it reads as it did. Each of its five fields has the owner's own `Shown` switch (on) and `Remove field`; and `Add field` is there.
    const switches = await sheet.locator('input[type="checkbox"]').count();
    if (switches !== 5) problems.push(`${label}: Edit list has ${switches} switches, not 5`);
    const removes = await sheet.getByRole('button', { name: 'Remove field' }).count();
    if (removes !== 5) problems.push(`${label}: Edit list has ${removes} Remove field buttons, not 5`);
    if (!(await sheet.getByRole('button', { name: 'Add field' }).count())) problems.push(`${label}: Edit list has no Add field`);
    if (!(await sheet.getByRole('button', { name: 'Delete list' }).count())) problems.push(`${label}: Edit list has no Delete list`);
    if (!(await sheet.getByLabel('Name').count())) problems.push(`${label}: Edit list has no name field`);
    await sheet.locator('[aria-label="Close"]').first().click();
    await page.getByRole('button', { name: 'List menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Delete list' }).first().click();
    await page
      .getByText('The list is used on 1 page. Remove it from there first.')
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => problems.push(`${label}: Delete list was not refused while a page reads the list`));
    await page.close();
    await checkNewList(width, height, label);
  } finally {
    rmSync(pagePath, { force: true });
    rmSync(folder, { recursive: true, force: true });
  }
}

/** The text of a committed file: the commit proxy gets it base64 encoded. */
const decoded = (content) => Buffer.from(content ?? '', 'base64').toString() || '{}';

/** `New list` on the Lists screen: the button opens the dialog (the name only, `Cancel` outlined, `Create` filled, no initial focus); a name that is taken is refused; `Create` makes a list with no fields, which opens saying so with `Add field`; two body text fields are added, a row is typed in both and both values are saved and shown; the list shows under Lists and in Rows from. No horizontal overflow. */
async function checkNewList(width, height, label) {
  label = `${label} new`;
  const phone = width < 600;
  const folder = join(ROOT, 'src/data/zz-fresh-list');
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  try {
    await openEditor(page, site);
    const commits = [];
    await page.route('**/api/github/commit', (r) => {
      commits.push(JSON.parse(r.request().postData() || '{}'));
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'head', blobs: {} }) });
    });
    await page.evaluate(() => (location.hash = '#lists'));
    const button = page.getByRole('button', { name: 'New list' }).first();
    await button.waitFor({ timeout: 15000 }).catch(() => problems.push(`${label}: no New list button on Lists`));
    await button.click();
    const dialog = page.locator('dialog[open][aria-label="New list"]');
    await dialog.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: New list did not open its dialog`));
    if ((await dialog.locator('input[type="checkbox"]').count()) !== 0) problems.push(`${label}: the dialog still has field switches`);
    const state = await page.evaluate(() => {
      const d = document.querySelector('dialog[open]');
      const kind = (name) =>
        d.querySelector(`button:is([type="button"],[type="submit"])`) &&
        [...d.querySelectorAll('button')].find((b) => b.textContent.trim() === name);
      const cancel = kind('Cancel');
      const create = kind('Create');
      return {
        focusedInside: !!d.contains(document.activeElement) && document.activeElement !== d,
        cancelBg: cancel && getComputedStyle(cancel).backgroundColor,
        createBg: create && getComputedStyle(create).backgroundColor,
      };
    });
    if (state.focusedInside) problems.push(`${label}: the dialog puts the focus on a field or button to begin with`);
    if (!state.cancelBg || !state.createBg) problems.push(`${label}: the dialog lacks Cancel or Create`);
    else if (state.cancelBg === state.createBg) problems.push(`${label}: Cancel and Create look alike (${state.cancelBg})`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
      problems.push(`${label}: the dialog scrolls sideways`);
    // A name that is taken ("Blog posts" folder, a collection) is refused.
    await dialog.getByLabel('Name').fill('Categories');
    await dialog.getByRole('button', { name: 'Create' }).click();
    await dialog
      .getByText('A list with this name exists. Choose another name.')
      .waitFor({ timeout: 5000 })
      .catch(() => problems.push(`${label}: a taken name was not refused`));
    await dialog.getByLabel('Name').fill('ZZ Fresh list');
    await dialog.getByRole('button', { name: 'Create' }).click();
    await page
      .waitForFunction(() => location.hash === '#list/zz-fresh-list', null, { timeout: 15000 })
      .catch(() => problems.push(`${label}: Create did not open the new list (${'#' + new URL(page.url()).hash})`));
    // The list starts empty: its page says so and has `Add field`; the definition has no field.
    await page
      .getByText('This list has no fields yet. Add the first one.')
      .waitFor({ timeout: 15000 })
      .catch(() => problems.push(`${label}: the new list's page does not say it has no fields`));
    if (await page.locator('.inline-list-row').locator('visible=true').count()) problems.push(`${label}: an empty list shows a row`);
    const made = commits[0]?.changes.find((x) => x.path.endsWith('_list.json'));
    if (JSON.parse(decoded(made?.content)).fields?.length !== 0)
      problems.push(`${label}: the new list's definition is not empty (${made?.content})`);
    // Two body texts: the empty page's Add field, then Body text; the second through Edit list (the empty page's button is gone once there is a field).
    const pick = async (n) => {
      await page
        .getByRole('menuitem', { name: 'Body text' })
        .locator('visible=true')
        .first()
        .click()
        .catch(() => problems.push(`${label}: Add field has no Body text (${n})`));
      await page.waitForTimeout(700);
    };
    await page
      .getByRole('button', { name: 'Add field' })
      .first()
      .click()
      .catch(() => problems.push(`${label}: no Add field on the empty list`));
    await pick(0);
    await page.getByRole('button', { name: 'List menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit list' }).first().click();
    const edit = page.locator('dialog[open]').filter({ hasText: 'Fields' });
    await edit.getByRole('button', { name: 'Add field' }).click();
    await pick(1);
    if ((await edit.locator('input[type="checkbox"]').count()) !== 2)
      problems.push(`${label}: Edit list does not show two fields with a switch each`);
    await edit.locator('[aria-label="Close"]').first().click();
    await page.waitForTimeout(300);
    await page
      .waitForSelector('.inline-list-row-next [data-field="text"]', { timeout: 15000 })
      .catch(() => problems.push(`${label}: the first body text field did not show on the list's page`));
    // The name is inside the text field; the second body text is numbered.
    await page.locator('.inline-list-row-next [data-field="text"]').first().click();
    await page
      .waitForSelector('.inline-list-row-active [data-field="text-2"]', { timeout: 15000 })
      .catch(() => problems.push(`${label}: two body text fields did not show on the active row`));
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('.inline-list-row-active [data-field]')].map((f) => f.getAttribute('placeholder')),
    );
    if (names.join() !== 'Body text,Body text 2') problems.push(`${label}: the fields are not named Body text and Body text 2 (${names})`);
    // A row typed in both fields: both values are saved (one file, both ids) and shown.
    await page.keyboard.type('First line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second line');
    await page.waitForTimeout(1800);
    const entry = commits.flatMap((c) => c.changes).find((x) => /src\/data\/zz-fresh-list\/(?!_)[^/]+\.json$/.test(x.path));
    const saved = JSON.parse(decoded(entry?.content));
    if (saved.text !== 'First line' || saved['text-2'] !== 'Second line')
      problems.push(`${label}: the row was not saved with both body texts (${entry?.content})`);
    const shown = await page.evaluate(() => [...document.querySelectorAll('.inline-list-row [data-field]')].map((f) => f.value));
    if (!shown.includes('First line') || !shown.includes('Second line'))
      problems.push(`${label}: the row does not show both values (${shown})`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
      problems.push(`${label}: the list page scrolls sideways with two fields`);
    // It shows under Lists and in Rows from.
    await page.evaluate(() => (location.hash = '#lists'));
    await page
      .getByText('ZZ Fresh list')
      .first()
      .waitFor({ timeout: 10000 })
      .catch(() => problems.push(`${label}: the new list does not show under Lists`));
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(`${label}: Lists scrolls sideways`);
    const paths = commits.flatMap((c) => c.changes.map((x) => x.path));
    if (!paths.some((p) => p.endsWith('src/data/zz-fresh-list/_list.json')))
      problems.push(`${label}: Create did not commit the definition (${paths})`);
    // Rows from offers it: a list typed on a new page, its dynamic settings, the choice of lists.
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('Hello');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    if (!(await page.locator('[aria-label="Insert"]:visible').count()))
      await page.locator('[aria-label="Show more tools"]:visible').first().tap();
    await page.locator('[aria-label="Insert"]:visible').first().click();
    await page.locator('dialog[open] button', { hasText: 'Rows with icon, heading and text.' }).first().click();
    await page.waitForSelector('.inline-list-row-active [data-field="title"]');
    await page.keyboard.type('Typed row');
    await page.locator('.contextual-menu [aria-label="Fill from a list"]').click();
    const panel = page.locator('dialog[open], .editor-side-sheet').filter({ hasText: 'Rows from' }).first();
    await panel.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the dynamic settings did not open`));
    await panel.locator('button.text-field-input').first().click();
    await page
      .getByText('ZZ Fresh list', { exact: true })
      .locator('visible=true')
      .last()
      .waitFor({ timeout: 5000 })
      .catch(() => problems.push(`${label}: the new list is not offered under Rows from`));
  } finally {
    await page.close();
    rmSync(folder, { recursive: true, force: true });
  }
}

/** Cards that are a carousel on phones (`phone`, on the demo's Blocks page): at 375 px the row scrolls sideways with one card whole and the next peeking in, as Material 3's uncontained carousel is measured (gap 8, 8 above and below, 16 from the edge, corners 28), a dot for each card, labelled; `Show all` stacks the cards in place and `Show fewer` returns them, focus kept; the arrow keys move between the cards. At 1280 px the same block is the grid, with no dots and no button. */
async function checkCardsCarousel(width, height) {
  const label = `${width}px cards carousel`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await page.goto(new URL('/blocks/', site).href);
  const root = page.locator('[data-cards-carousel]').first();
  if (!(await root.count())) return (problems.push(`${label}: no Cards carousel on the Blocks page`), page.close());
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const m = await root.evaluate((el) => {
    const row = el.querySelector('[data-carousel-items]');
    const items = [...el.querySelectorAll('[data-carousel-item]')];
    const rowBox = row.getBoundingClientRect();
    const [a, b] = items.map((i) => i.getBoundingClientRect());
    const rs = getComputedStyle(row);
    const show = el.querySelector('[data-cards-show-all]');
    return {
      display: rs.display,
      overflowX: rs.overflowX,
      scrolls: row.scrollWidth > row.clientWidth + 1,
      gap: rs.columnGap,
      padTop: rs.paddingTop,
      padBottom: rs.paddingBottom,
      padLeft: rs.paddingLeft,
      firstLeft: Math.round(a.left - rowBox.left),
      firstRight: Math.round(a.right),
      secondLeft: Math.round(b.left),
      radius: getComputedStyle(items[0].querySelector('.block-card')).borderTopLeftRadius,
      dots: el.querySelectorAll('[data-carousel-dot]').length,
      items: items.length,
      indicator: getComputedStyle(el.querySelector('[data-carousel-indicator]')).display,
      showAll: getComputedStyle(show.closest('.block-cards-show-all')).display,
      region: el.querySelector('[role="region"]')?.getAttribute('aria-label') ?? null,
      itemLabels: items.map((i) => i.getAttribute('aria-label')),
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  if (phone) {
    if (m.overflowX !== 'auto' || !m.scrolls) problems.push(`${label}: the row does not scroll sideways (${m.overflowX}, ${m.scrolls})`);
    if (m.firstRight > width || m.secondLeft >= width)
      problems.push(`${label}: the first card is not whole with the next peeking in (${m.firstRight}, ${m.secondLeft})`);
    if (m.gap !== '8px') problems.push(`${label}: the gap is ${m.gap}, not 8px`);
    if (m.padTop !== '8px' || m.padBottom !== '8px')
      problems.push(`${label}: the padding above and below is ${m.padTop} and ${m.padBottom}, not 8px`);
    if (m.padLeft !== '16px') problems.push(`${label}: the leading padding is ${m.padLeft}, not 16px`);
    if (m.radius !== '28px') problems.push(`${label}: the card's corners are ${m.radius}, not 28px`);
    if (m.dots !== m.items) problems.push(`${label}: ${m.dots} dots for ${m.items} cards`);
    if (!m.region) problems.push(`${label}: the carousel has no label`);
    if (m.itemLabels.join() !== m.itemLabels.map((_, i) => `${i + 1} of ${m.items}`).join())
      problems.push(`${label}: the cards are labelled "${m.itemLabels}", not "n of ${m.items}"`);
    if (m.pageOverflow) problems.push(`${label}: the page scrolls sideways`);
    const button = root.locator('[data-cards-show-all]');
    if ((await button.textContent())?.trim() !== 'Show all') problems.push(`${label}: the button is not "Show all"`);
    await button.click();
    await page.waitForTimeout(300);
    const open = await root.evaluate((el) => ({
      expanded: el.hasAttribute('data-expanded'),
      grid: getComputedStyle(el.querySelector('[data-carousel-items]')).display,
      text: el.querySelector('[data-cards-show-all]').textContent.trim(),
      pressed: el.querySelector('[data-cards-show-all]').getAttribute('aria-expanded'),
      focus: document.activeElement === el.querySelector('[data-cards-show-all]'),
    }));
    if (!open.expanded || open.grid !== 'grid' || open.text !== 'Show fewer' || open.pressed !== 'true' || !open.focus)
      problems.push(`${label}: "Show all" did not stack the cards in place with focus kept (${JSON.stringify(open)})`);
    await button.click();
    await page.waitForTimeout(300);
    if (await root.evaluate((el) => el.hasAttribute('data-expanded'))) problems.push(`${label}: "Show fewer" did not return the carousel`);
    // The arrow keys move between the cards.
    await root.locator('[data-carousel-item]').first().focus();
    await page.keyboard.press('ArrowRight');
    const at = await root.evaluate((el) =>
      [...el.querySelectorAll('[data-carousel-item]')].indexOf(document.activeElement?.closest('[data-carousel-item]')),
    );
    if (at !== 1) problems.push(`${label}: ArrowRight moved the focus to card ${at}, not card 1`);
    await page.screenshot({ path: join(shots, `cards-carousel-${width}.png`) });
  } else {
    if (m.display !== 'grid') problems.push(`${label}: on a computer the cards are not the grid (${m.display})`);
    if (m.indicator !== 'none' || m.showAll !== 'none')
      problems.push(`${label}: on a computer the dots (${m.indicator}) or "Show all" (${m.showAll}) show`);
  }
  await page.close();
}

/** The color of an icon (`iconColor`): the row's icon picker has the choice next to the icon (Primary, Secondary, Tertiary); a picked color is on the row (`data-icon-color`) and drawn in the theme's color role, in the editor like on the site. */
async function checkIconColor(width, height, scheme = 'light') {
  const label = `${width}px icon color (${scheme})`;
  const phone = width < 600;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: phone,
    isMobile: phone,
    locale: 'en-US',
    colorScheme: scheme,
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().click();
  await page.locator('[aria-label="Insert"]:visible').first().click();
  await page.locator('dialog[open] button', { hasText: 'Rows with icon, heading and text.' }).first().click();
  await page.waitForSelector('.inline-list-row-active [data-field="title"]');
  await page.keyboard.type('First');
  await page.locator('.inline-list-row-active .inline-list-slot').first().click();
  const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
  await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the icon picker did not open`));
  await picker.getByRole('button').nth(1).click();
  await page.waitForTimeout(300);
  const choices = await page.getByRole('button', { name: /^(Primary|Secondary|Tertiary)$/ }).allTextContents();
  if (choices.map((c) => c.trim()).join() !== 'Primary,Secondary,Tertiary')
    problems.push(`${label}: the icon's sheet has the colors "${choices}", not Primary, Secondary, Tertiary`);
  // The color comes first: its field is above the first icon, in the DOM and on screen, so the color is chosen before the icons.
  const order = await page.evaluate(() => {
    const color = document.querySelector('[role="group"][aria-label="Icon color"]');
    const grid = [...document.querySelectorAll('[role="group"][aria-label="Icon"]')].pop();
    const tile = grid?.querySelector('button');
    if (!color || !tile) return null;
    return {
      dom: !!(color.compareDocumentPosition(tile) & Node.DOCUMENT_POSITION_FOLLOWING),
      screen: color.getBoundingClientRect().bottom <= tile.getBoundingClientRect().top + 1,
    };
  });
  if (!order) problems.push(`${label}: the sheet has no "Icon color" field or no icon tiles`);
  else if (!order.dom || !order.screen)
    problems.push(`${label}: the Icon color field is not above the first icon (DOM ${order.dom}, screen ${order.screen})`);
  // Each color has a circle of its role's color in place of the check, in every chip; no chip has a check.
  const swatches = () =>
    page.evaluate(() => {
      const probe = document.createElement('i');
      document.body.append(probe);
      const colorOf = (role) => {
        probe.style.color = `var(--mo-${role})`;
        return getComputedStyle(probe).color;
      };
      const chips = [...document.querySelectorAll('[role="group"][aria-label="Icon color"] button')];
      const out = chips.map((chip, i) => {
        const dot = chip.querySelector('.segmented-button-swatch');
        const box = dot?.getBoundingClientRect();
        const role = ['primary', 'secondary', 'tertiary'][i];
        return {
          name: chip.textContent.trim(),
          pressed: chip.getAttribute('aria-pressed'),
          circle: !!dot && Math.abs(box.width - box.height) < 0.5 && getComputedStyle(dot).borderRadius !== '0px',
          color: dot ? getComputedStyle(dot).backgroundColor : null,
          want: colorOf(role),
          check: !!chip.querySelector('.segmented-button-check'),
          width: Math.round(chip.getBoundingClientRect().width),
        };
      });
      probe.remove();
      return out;
    });
  const before = await swatches();
  for (const c of before) {
    if (!c.circle) problems.push(`${label}: the ${c.name} chip has no circle`);
    else if (c.color !== c.want) problems.push(`${label}: the ${c.name} circle is ${c.color}, not its role color ${c.want}`);
    if (c.check) problems.push(`${label}: the ${c.name} chip has a check`);
  }
  if (new Set(before.map((c) => c.want)).size !== 3)
    problems.push(`${label}: the three role colors are not all different, so the circles prove nothing`);
  await page.getByRole('button', { name: 'Secondary', exact: true }).click();
  await page.waitForTimeout(300);
  // Picking another chip moves the selected state only: the same chips, the same widths, the circles stay.
  const after = await swatches();
  const pressed = after.map((c) => c.pressed).join();
  if (pressed !== 'false,true,false')
    problems.push(`${label}: after Secondary was picked the chips are pressed ${pressed}, not false,true,false`);
  if (before.map((c) => c.width).join() !== after.map((c) => c.width).join())
    problems.push(
      `${label}: the chips changed width when the choice changed (${before.map((c) => c.width)} to ${after.map((c) => c.width)})`,
    );
  if (after.some((c) => !c.circle || c.check)) problems.push(`${label}: after the choice changed a chip lost its circle or got a check`);
  await page.screenshot({ path: join(shots, `icon-color-${width}${scheme === 'dark' ? '-dark' : ''}.png`) });
  // The picker's grid draws its icons in the picked color (the chosen icon keeps its own colors): Secondary now, then Tertiary, then Primary (the default, not a role's color).
  const gridColors = () =>
    page.evaluate(() => {
      const grid = [...document.querySelectorAll('[role="group"][aria-label="Icon"]')].pop();
      const probe = document.createElement('i');
      document.body.append(probe);
      const roleColor = (role) => {
        probe.style.color = `var(--mo-${role})`;
        return getComputedStyle(probe).color;
      };
      const tiles = [...(grid?.querySelectorAll('button:not([aria-pressed="true"])') ?? [])].filter((b) => b.querySelector('svg'));
      const colors = [...new Set(tiles.map((b) => getComputedStyle(b).color))];
      // The contrast of the icons on what is behind the tile (WCAG, 3:1 for an icon), as the pixels are painted.
      const pixel = (css) => {
        const c = document.createElement('canvas').getContext('2d');
        c.canvas.width = c.canvas.height = 1;
        c.fillStyle = '#000';
        c.fillRect(0, 0, 1, 1);
        c.fillStyle = css;
        c.fillRect(0, 0, 1, 1);
        return [...c.getImageData(0, 0, 1, 1).data];
      };
      const lum = ([r, g, b]) =>
        [r, g, b]
          .map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      let behind = 'rgb(0, 0, 0)';
      for (let n = tiles[0]; n; n = n.parentElement) {
        const bg = getComputedStyle(n).backgroundColor;
        if (n !== tiles[0] && pixel(bg).join() !== '0,0,0,255' && !/rgba\(.*, 0\)|transparent/.test(bg)) {
          behind = bg;
          break;
        }
      }
      const [a, b] = [lum(pixel(colors[0] ?? '#000')), lum(pixel(behind))].sort((x, y) => y - x);
      const out = {
        contrast: (a + 0.05) / (b + 0.05),
        count: tiles.length,
        colors,
        secondary: roleColor('secondary'),
        tertiary: roleColor('tertiary'),
      };
      probe.remove();
      return out;
    });
  const grid = await gridColors();
  if (grid.count < 5) problems.push(`${label}: the picker's grid has only ${grid.count} unchosen icons`);
  else if (grid.colors.join() !== grid.secondary)
    problems.push(`${label}: after Secondary the grid's icons are ${grid.colors.join(' / ')}, not the secondary color ${grid.secondary}`);
  console.log(`icon grid contrast ${width}px ${scheme} secondary: ${grid.contrast.toFixed(2)}`);
  if (grid.contrast < 3) problems.push(`${label}: the secondary icons on the grid have contrast ${grid.contrast.toFixed(2)}:1, under 3:1`);
  await page.getByRole('button', { name: 'Tertiary', exact: true }).click();
  await page.waitForTimeout(300);
  const tertiary = await gridColors();
  console.log(`icon grid contrast ${width}px ${scheme} tertiary: ${tertiary.contrast.toFixed(2)}`);
  if (tertiary.contrast < 3)
    problems.push(`${label}: the tertiary icons on the grid have contrast ${tertiary.contrast.toFixed(2)}:1, under 3:1`);
  if (tertiary.colors.join() !== tertiary.tertiary)
    problems.push(
      `${label}: after Tertiary the grid's icons are ${tertiary.colors.join(' / ')}, not the tertiary color ${tertiary.tertiary}`,
    );
  await page.getByRole('button', { name: 'Secondary', exact: true }).click();
  await page.waitForTimeout(300);
  await page
    .locator('dialog[open] button[aria-label="Close"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(300);
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(400);
  const drawn = await page.evaluate(() => {
    const row = document.querySelector('.inline-list-row[data-icon-color="secondary"]');
    const probe = document.createElement('i');
    probe.style.color = 'var(--mo-secondary)';
    document.body.append(probe);
    const want = getComputedStyle(probe).color;
    probe.style.color = 'var(--mo-primary)';
    const primary = getComputedStyle(probe).color;
    probe.remove();
    return { row: !!row, icon: row ? getComputedStyle(row.querySelector('.inline-list-slot')).color : null, want, primary };
  });
  if (!drawn.row) problems.push(`${label}: the row has no data-icon-color="secondary" after Secondary was picked`);
  else if (drawn.icon !== drawn.want) problems.push(`${label}: the icon is ${drawn.icon}, not the secondary color ${drawn.want}`);
  else if (drawn.want === drawn.primary) problems.push(`${label}: secondary and primary are the same color, so the check proves nothing`);
  await page.close();
}

/** A Table typed in the text: the table shows only its real header and cells (no "Next row", "Next column" or "Add row" element), the first cell is active (dotted line), the header row is a `th`, and rows and columns are added and deleted only from the contextual menu (add row above and below, add column before and after, delete row and column, each an icon button with a label), on a phone and a computer; when the cursor leaves, the table keeps the cells that were typed and the menu is gone. */
async function checkInlineTable(width, height) {
  const label = `${width}px inline table`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().tap();
  await page.locator('[aria-label="Insert"]:visible').first().tap();
  await page.locator('dialog[open] button', { hasText: 'Rows and columns of text.' }).first().click();
  await page.waitForSelector('.inline-table-cell-active textarea');
  await page.keyboard.type('Plan');
  await page.waitForTimeout(300);
  const state = () =>
    page.evaluate(() => ({
      rows: document.querySelectorAll('.inline-table-box tr[data-row]').length,
      cells: document.querySelectorAll('.inline-table-box :is(th, td)').length,
      header: document.querySelectorAll('.inline-table-box thead th[scope="col"]').length,
      extra: [...document.querySelectorAll('.inline-table-host *')].filter(
        (e) =>
          e.hasAttribute('data-add-row') ||
          (e.children.length === 0 && /^(Next row|Next column|Add row)$/.test(e.textContent.trim())) ||
          ['placeholder', 'aria-label'].some((a) => /^(Next row|Next column|Add row)$/.test(e.getAttribute(a) ?? '')),
      ).length,
      faded: document.querySelectorAll('.inline-table-cell-next').length,
      outline: getComputedStyle(document.querySelector('.inline-table-cell-active')).outlineStyle,
      scroll: document.querySelector('.inline-table-box').scrollWidth <= document.querySelector('.inline-table-box').clientWidth + 1,
      bar: [...document.querySelectorAll('.contextual-menu button')].map((b) => ({
        label: b.getAttribute('aria-label'),
        title: b.title,
        svg: !!b.querySelector('svg path'),
        icon: [...b.querySelectorAll('svg path')].map((p) => p.getAttribute('d')).join('|'),
      })),
    }));
  const press = async (name) => {
    const b = page.locator(`.contextual-menu button[aria-label="${name}"]`);
    if (!(await b.count())) return problems.push(`${label}: the menu has no button "${name}"`);
    await b.first().tap();
    await page.waitForTimeout(300);
  };
  const one = await state();
  // One typed cell: a header row with one cell, nothing added around it.
  if (one.rows !== 1 || one.cells !== 1) problems.push(`${label}: expected 1 row of 1 cell, got ${one.rows} rows and ${one.cells} cells`);
  if (one.header !== 1) problems.push(`${label}: expected a header row of 1 th cell, got ${one.header}`);
  if (one.extra || one.faded) problems.push(`${label}: the table has "Next row", "Next column" or "Add row" in it`);
  if (one.outline !== 'dotted') problems.push(`${label}: the active cell has outline ${one.outline}, not dotted`);
  for (const name of ['Add row above', 'Add row below', 'Add column before', 'Add column after'])
    if (!one.bar.some((b) => b.label === name && b.title === name && b.svg))
      problems.push(`${label}: the menu has no icon button "${name}" with a tooltip`);
  for (const name of ['Delete row', 'Delete column'])
    if (one.bar.some((b) => b.label === name)) problems.push(`${label}: "${name}" is offered for a one-cell table`);
  // The menu makes the first column and the first body row of a one-cell table.
  await press('Add column after');
  const column = await state();
  if (column.cells !== 2) problems.push(`${label}: "Add column after" left ${column.cells} cells, not 2`);
  await page.keyboard.type('Pages');
  await press('Add row below');
  const row = await state();
  if (row.rows !== 2 || row.cells !== 4)
    problems.push(`${label}: "Add row below" left ${row.rows} rows and ${row.cells} cells, not 2 and 4`);
  await press('Add row above');
  await press('Add column before');
  const more = await state();
  if (more.rows !== 3 || more.cells !== 9)
    problems.push(
      `${label}: expected 3 rows and 9 cells after "Add row above" and "Add column before", got ${more.rows} and ${more.cells}`,
    );
  if (more.extra || more.faded) problems.push(`${label}: the table has "Next row", "Next column" or "Add row" in it after adding`);
  for (const name of ['Delete row', 'Delete column'])
    if (!more.bar.some((b) => b.label === name && b.svg && b.title === name))
      problems.push(`${label}: the menu has no icon button "${name}"`);
  const icons = more.bar.map((b) => b.icon);
  const same = more.bar.filter((b, i) => b.icon && icons.indexOf(b.icon) !== i).map((b) => b.label);
  if (same.length) problems.push(`${label}: the Table bar draws the same icon for two actions (${same.join(', ')})`);
  await press('Delete row');
  await press('Delete column');
  const less = await state();
  if (less.rows !== 2 || less.cells !== 4)
    problems.push(`${label}: after the deletes expected 2 rows and 4 cells, got ${less.rows} and ${less.cells}`);
  await page.screenshot({ path: join(shots, `inline-table-${width}.png`) });
  // Two typed body rows (they stay when the block is not active) for the stripes below.
  await press('Add row below');
  await page.keyboard.type('Row');
  await press('Add row below');
  await page.keyboard.type('More');
  // The header's square corners never poke out past the box's rounded border: the box is a block that clips (overflow not visible) with a radius,
  // and no table class collides with a Tailwind utility (display: inline-table made the box a table that did not clip).
  const box = await page.evaluate(() => {
    const e = document.querySelector('.inline-table-box');
    const c = getComputedStyle(e);
    return { display: c.display, overflowX: c.overflowX, overflowY: c.overflowY, radius: parseFloat(c.borderTopLeftRadius) };
  });
  if (box.display !== 'block' || box.overflowX === 'visible' || box.overflowY === 'visible' || !(box.radius > 0))
    problems.push(`${label}: the table's box does not clip its header to the rounded corner (${JSON.stringify(box)})`);
  // The gear has "Striped rows" (off), and turning it on gives every second body row a background that the others and the header do not have.
  const rowBg = () =>
    page.evaluate(() => [...document.querySelectorAll('.inline-table-box tbody tr')].map((r) => getComputedStyle(r).backgroundColor));
  const plain = await rowBg();
  // The table's own button in the toolbar (on a computer) shows the block's frame with its Edit button.
  if (width > 600) await page.locator('button[aria-label="Table"]:visible').first().click();
  await page.locator('button[aria-label="Edit"]:visible').first().click();
  const stripes = page.locator('dialog[open], .editor-side-sheet').getByRole('switch', { name: 'Striped rows' });
  await stripes.waitFor({ timeout: 4000 }).catch(() => problems.push(`${label}: the table's settings have no "Striped rows" switch`));
  if ((await stripes.count()) && (await stripes.isChecked())) problems.push(`${label}: "Striped rows" is not off by default`);
  await stripes.click({ timeout: 3000 }).catch(() => {});
  await page
    .getByRole('button', { name: 'Save', exact: true })
    .last()
    .click({ timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(400);
  const striped = await rowBg();
  if (!(await page.locator('.inline-table-box[data-striped]').count()))
    problems.push(`${label}: "Striped rows" on does not mark the table`);
  if (new Set(plain).size !== 1) problems.push(`${label}: rows have different backgrounds before "Striped rows" is on (${plain})`);
  if (striped.length < 2 || striped[0] === striped[1])
    problems.push(`${label}: with "Striped rows" on, the second body row has no background of its own (${striped})`);
  // Back in the table: a click in its first cell makes the block active again.
  await page.locator('.inline-table-box th textarea').first().click();
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    menu: [...document.querySelectorAll('.contextual-menu')].filter((m) => !m.hidden).length,
    extra: document.querySelectorAll('[data-add-row], .inline-table-cell-next').length,
    rows: document.querySelectorAll('.inline-table-box tr[data-row]').length,
    cols: document.querySelectorAll('.inline-table-box thead th').length,
  }));
  if (after.menu || after.extra) problems.push(`${label}: the menu or an add element stays after the cursor left the table`);
  // The added rows and columns are empty, so the table keeps only what was typed; the kept cells are the same on every redraw.
  if (after.rows < 1 || after.cols < 1)
    problems.push(`${label}: the table lost its cells after leaving (${after.rows} rows of ${after.cols})`);
  await page.close();
}

/** The Table's outer box has the same corner radius as a card (the Cards block's `.card`: both read the theme's --card-radius), with its header clipped to it, on the built site at 375 and 1280 px. */
async function checkTableRadius(width, height) {
  const label = `${width}px table radius`;
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await page.goto(new URL('/blocks/', site).href);
  const got = await page.evaluate(() => {
    const card = document.querySelector('.card.block-card');
    const host = card?.parentElement;
    if (!host) return null;
    const box = document.createElement('div');
    box.className = 'block-table block-table-grid';
    box.innerHTML = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    host.append(box);
    const c = getComputedStyle(box);
    return {
      card: getComputedStyle(card).borderTopLeftRadius,
      table: c.borderTopLeftRadius,
      overflowX: c.overflowX,
      overflowY: c.overflowY,
    };
  });
  if (!got) problems.push(`${label}: no card on /blocks/ to compare with`);
  else {
    if (got.card !== got.table) problems.push(`${label}: the table's radius is ${got.table}, the card's ${got.card}`);
    if (got.overflowX === 'visible' || got.overflowY === 'visible')
      problems.push(`${label}: the table's box does not clip its header to the radius`);
  }
  await page.close();
}

/** The icon picker of a List row (the slot before the title, a sheet on a phone): the first view has the "No icon" tile and the 28 icons, the search field finds an icon of the whole set, Material Symbols' ("arrow back") and Phosphor's ("acorn"), a picked one is drawn in the slot (stored by its name, drawn by the site as the fallback), a search without a hit says so, a category filters (with the search too) 100 icons at a time with "Show more", and the sheet fits the width. */
async function checkIconSearch(width, height) {
  const label = `${width}px icon search`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (!(await page.locator('[aria-label="Insert"]:visible').count()))
    await page.locator('[aria-label="Show more tools"]:visible').first().tap();
  await page.locator('[aria-label="Insert"]:visible').first().tap();
  await page.locator('dialog[open] button', { hasText: 'Rows with icon, heading and text.' }).first().click();
  await page.waitForSelector('.inline-list-row-active [data-field="title"]');
  await page.keyboard.type('First');
  await page.locator('.inline-list-row-active .inline-list-slot').first().tap();
  const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
  await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the icon picker did not open`));
  const first = await picker.getByRole('button').count();
  if (first !== 29) problems.push(`${label}: the first view has ${first} tiles instead of 29 (No icon and 28 icons)`);
  if ((await picker.getByRole('button').first().getAttribute('aria-label')) !== 'No icon')
    problems.push(`${label}: the first tile is not "No icon"`);
  const search = page.getByRole('searchbox', { name: 'Search icons' });
  if (!(await search.count())) return (problems.push(`${label}: no search field "Search icons"`), page.close());
  const box = await search.boundingBox();
  if (!box || box.x < 0 || box.x + box.width > width) problems.push(`${label}: the search field is outside the screen`);
  await search.fill('zzzqqq');
  await page
    .getByText('No icons found', { exact: true })
    .waitFor({ timeout: 8000 })
    .catch(() => problems.push(`${label}: no "No icons found" for a search without a hit`));
  await search.fill('arrow back');
  const hit = picker.getByRole('button', { name: 'arrow back', exact: true });
  await hit.waitFor({ timeout: 8000 }).catch(() => problems.push(`${label}: the search "arrow back" did not find the icon arrow back`));
  if ((await picker.getByRole('button').count()) > 100) problems.push(`${label}: more than one page (100) of icons is drawn at once`);
  // A category: the chips scroll, the first load is 100 icons, "Show more" loads 100 more; the category and the search combine.
  await search.fill('');
  const chip = page.getByRole('button', { name: 'Devices', exact: true });
  await chip.scrollIntoViewIfNeeded().catch(() => {});
  await chip.tap().catch(() => problems.push(`${label}: no category chip "Devices"`));
  await page.waitForTimeout(400);
  const loaded = () => picker.getByRole('button').count();
  if ((await loaded()) !== 100) problems.push(`${label}: category Devices loaded ${await loaded()} icons first, not 100`);
  // "Show more" (clicked without a scroll, which would load the next page by itself) loads 100 more; reaching the end of them loads more again.
  const showMore = page.getByRole('button', { name: 'Show more', exact: true });
  if (!(await showMore.count())) problems.push(`${label}: no "Show more" under 100 icons`);
  await showMore.evaluate((b) => b.click()).catch(() => {});
  await page.waitForTimeout(400);
  if ((await loaded()) !== 200) problems.push(`${label}: "Show more" left ${await loaded()} icons, not 200`);
  await showMore.evaluate((b) => b.scrollIntoView({ block: 'center' })).catch(() => {});
  await page.waitForTimeout(800);
  if ((await loaded()) <= 200) problems.push(`${label}: scrolling to the end of 200 icons loaded none more (${await loaded()})`);
  await search.fill('phone');
  await page.waitForTimeout(400);
  const names = await picker.getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  if (!names.length || names.some((n) => n && n !== 'No icon' && !n.toLowerCase().includes('phone')))
    problems.push(`${label}: category Devices with the search "phone" shows icons that are not phones`);
  await page
    .getByRole('button', { name: 'Suggested', exact: true })
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  await page
    .getByRole('button', { name: 'Suggested', exact: true })
    .tap()
    .catch(() => {});
  // Phosphor's own icons are in the search too (acorn: Material Symbols has none of that name).
  await search.fill('acorn');
  await picker
    .getByRole('button', { name: 'acorn', exact: true })
    .waitFor({ timeout: 8000 })
    .catch(() => problems.push(`${label}: the search "acorn" did not find Phosphor's acorn`));
  await search.fill('arrow back');
  await hit.waitFor({ timeout: 8000 }).catch(() => {});
  await hit.tap().catch(() => {});
  await page.waitForTimeout(500);
  const drawn = await page.evaluate(() =>
    document.querySelector('.inline-list-row-active .inline-list-slot svg')?.getAttribute('data-icon-fallback'),
  );
  if (drawn !== 'arrow_back') problems.push(`${label}: the picked icon is "${drawn}" in the row, not arrow_back`);
  await page.close();
}

/** Browser-side helpers (a string, put into page.evaluate): ratio(markCss, sectionEl, opacity) is the WCAG contrast of a colour (at an opacity) on a section's background. */
const ratioOf = `
    const pixel = (css, over, opacity = 1) => {
      const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      c.fillStyle = over; c.fillRect(0, 0, 1, 1); c.globalAlpha = opacity; c.fillStyle = css; c.fillRect(0, 0, 1, 1);
      return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const lum = (rgb) => { const [R, G, B] = rgb.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
    const ratio = (markCss, sectionEl, opacity = 1, fromEl = sectionEl) => {
      // The background is what is painted behind the part: the backgrounds from the section down to the part's own item, over the page's.
      const stack = [];
      for (let el = fromEl; el; el = el.parentElement) {
        stack.unshift(getComputedStyle(el).backgroundColor);
        if (el === sectionEl) break;
      }
      let back = pixel(getComputedStyle(document.body).backgroundColor, '#fff');
      for (const bg of stack) if (bg !== 'rgba(0, 0, 0, 0)') back = pixel(bg, 'rgb(' + back + ')');
      const front = pixel(markCss, 'rgb(' + back + ')', opacity);
      return (Math.max(lum(front), lum(back)) + 0.05) / (Math.min(lum(front), lum(back)) + 0.05);
    };`;

/** A list row's heading is the same colour as the section's heading and text, on every section colour, light and dark, on a phone and a computer; its icon and arrow too (and the supporting text on a coloured section; on Surface it is the quieter, as the section's other secondary text). */
async function checkListRowColors() {
  for (const scheme of ['light', 'dark']) {
    for (const width of [375, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 740 }, colorScheme: scheme, locale: 'en-US' });
      page.on('pageerror', (e) => problems.push(`${width}px list row colours: ${e.message}`));
      await page.goto(`${site}/`);
      const got = await page.evaluate(() => {
        const out = {};
        for (const color of ['surface', 'primary', 'secondary', 'tertiary']) {
          const section = document.createElement('section');
          section.className = 'text-section text-section-' + color;
          section.innerHTML =
            '<div class="prose"><h1>H1</h1><p>Text</p></div><div class="list block-list"><a class="list-item-container" href="#"><span class="list-item-leading list-item-leading-icon"><svg viewBox="0 0 10 10"></svg></span><span class="list-item-content"><span class="list-item-headline">Heading</span><span class="list-item-supporting">Text</span></span><span class="list-item-trailing"><svg viewBox="0 0 10 10"></svg></span></a></div>';
          document.querySelector('main').append(section);
          const c = (sel) => getComputedStyle(section.querySelector(sel)).color;
          out[color] = {
            h1: c('h1'),
            text: c('p'),
            heading: c('.list-item-headline'),
            supporting: c('.list-item-supporting'),
            icon: c('.list-item-leading'),
            chevron: c('.list-item-trailing'),
          };
          section.remove();
        }
        return out;
      });
      for (const [color, c] of Object.entries(got)) {
        if (c.heading !== c.h1 || c.heading !== c.text)
          problems.push(
            `${width}px ${scheme} list row on a ${color} section: the heading is ${c.heading}, the section's heading ${c.h1} and text ${c.text}`,
          );
        if (c.icon !== c.heading || c.chevron !== c.heading || (color !== 'surface' && c.supporting !== c.heading))
          problems.push(
            `${width}px ${scheme} list row on a ${color} section: the icon ${c.icon}, arrow ${c.chevron} or (not on Surface) text ${c.supporting} is not the heading's ${c.heading}`,
          );
      }
      await page.close();
    }
  }
}

/** The marks of a check list in a text (`- [x]`) keep 3:1 (WCAG, a graphic) against their section, on every section colour, light and dark, in the editor and on the site. */
async function checkChecklistMarks() {
  for (const scheme of ['light', 'dark']) {
    for (const width of [375, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 740 }, colorScheme: scheme, locale: 'en-US' });
      page.on('pageerror', (e) => problems.push(`${width}px ${scheme} check list: ${e.message}`));
      // The editor: one page with a check list in a section of each colour.
      const path = 'src/content/pages/check-list-marks.md';
      const text = ['surface', 'primary', 'secondary', 'tertiary']
        .map(
          (c) =>
            `<div data-section="${c}"></div>\n\n## ${c} section\n\n- [x] Photos are resized for every screen\n- [x] Every page has a Content Security Policy`,
        )
        .join('\n\n');
      await openEditor(page, site, { [path]: `---\ntitle: "Check list marks"\n---\n\n# Check list marks\n\n${text}\n` });
      await page.goto(`${site}/editor/#${path}`);
      await page.waitForSelector('.ProseMirror li[data-item-type="task"]', { timeout: 30_000 });
      const inEditor = await page.evaluate(`(() => { ${ratioOf}
        const out = {};
        for (const list of document.querySelectorAll('.ProseMirror > ul')) {
          const color = list.getAttribute('data-section-color') ?? 'surface';
          const li = list.querySelector('li');
          out[color] = ratio(getComputedStyle(li, '::before').backgroundColor, list);
        }
        return out; })()`);
      await page.locator('.ProseMirror > ul').nth(1).scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(shots, `checklist-editor-${scheme}-${width}.png`) });
      if (Object.keys(inEditor).length < 4)
        problems.push(`${width}px ${scheme} check list in the editor: expected 4 section colours, got ${Object.keys(inEditor)}`);
      for (const [color, ratio] of Object.entries(inEditor))
        if (ratio < 3)
          problems.push(
            `${width}px ${scheme} check list in the editor: the check mark on a ${color} section has contrast ${ratio.toFixed(2)}:1, below 3`,
          );
      // The site: the markup the site's text has, in each section class.
      await page.goto(`${site}/`);
      const onSite = await page.evaluate(`(() => { ${ratioOf}
        const out = {};
        for (const color of ['surface', 'primary', 'secondary', 'tertiary']) {
          const section = document.createElement('section');
          section.className = 'text-section-' + color;
          section.innerHTML = '<div class="prose"><ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled> Photos are resized</li></ul></div>';
          document.querySelector('main').append(section);
          const mark = section.querySelector('input');
          out[color] = ratio(getComputedStyle(mark).backgroundColor, section);
          if (color === 'primary') section.scrollIntoView();
        }
        return out; })()`);
      await page.screenshot({ path: join(shots, `checklist-site-${scheme}-${width}.png`) });
      for (const [color, ratio] of Object.entries(onSite))
        if (ratio < 3)
          problems.push(
            `${width}px ${scheme} check list on the site: the check mark on a ${color} section has contrast ${ratio.toFixed(2)}:1, below 3`,
          );
      await page.close();
    }
  }
}

/** The hint lines (Type text, or tap Insert …; Write text here…) read on every section colour, light and dark (4.5:1), and start where the text starts. */
async function checkHints() {
  for (const scheme of ['light', 'dark']) {
    for (const width of [360, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 740 }, colorScheme: scheme, locale: 'en-US' });
      page.on('pageerror', (e) => problems.push(`${width}px hints: ${e.message}`));
      await openEditor(page, site);
      await page.evaluate(() => (location.hash = '#new/pages'));
      await page.waitForSelector('.ProseMirror');
      await page.click('.ProseMirror');
      await page.keyboard.type('# Hej');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Some more text.');
      await page.keyboard.press('Enter');
      const colors = await hintContrasts(page, '.ProseMirror > p.editor-gap-here', '::before');
      const got = await page.evaluate(() => {
        const [h1, text, gap] = [...document.querySelector('.ProseMirror').children];
        const left = (n) => n.getBoundingClientRect().left + parseFloat(getComputedStyle(n).paddingLeft);
        return { textLeft: left(text), gapLeft: left(gap), h1Left: left(h1) };
      });
      for (const [color, ratio] of Object.entries(colors))
        if (ratio < 4.5)
          problems.push(`${width}px ${scheme} hints: the hint on a ${color} section has contrast ${ratio.toFixed(2)}:1, below 4.5`);
      if (Math.abs(got.gapLeft - got.textLeft) > 0.5 || Math.abs(got.h1Left - got.textLeft) > 0.5)
        problems.push(`${width}px ${scheme} hints: the hint starts at ${got.gapLeft}, the text at ${got.textLeft}`);
      await page.close();
    }
  }
}

/** The text's toolbar and field read as one closed box on a phone, empty, with the keyboard open and stuck at the top of the screen: the toolbar has a border on its top edge and on each side, and rounded top corners that keep the border. */
async function checkToolbarBox() {
  for (const [width, height] of [
    [360, 740],
    [375, 740],
    [414, 740],
    [360, 380],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${width}px toolbar box: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.editor-tools');
    const read = () =>
      page.evaluate(() => {
        const bar = document.querySelector('.editor-tools');
        const cs = getComputedStyle(bar);
        const side = (n) => `${cs[`border${n}Style`]} ${parseFloat(cs[`border${n}Width`])}px ${cs[`border${n}Color`]}`;
        return {
          top: [cs.borderTopStyle, parseFloat(cs.borderTopWidth), cs.borderTopColor],
          left: parseFloat(cs.borderLeftWidth),
          right: parseFloat(cs.borderRightWidth),
          radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius],
          line: cs.getPropertyValue('--toolbar-docked-line-width').trim(),
          side: side('Top'),
        };
      });
    const states = { 'at rest': read };
    const check = (name, got) => {
      if (got.top[0] === 'none' || got.top[1] < 1 || got.top[2] === 'rgba(0, 0, 0, 0)')
        problems.push(`${width}x${height}px text toolbar (${name}): its top edge has no border (${got.side})`);
      if (parseFloat(got.line) < 1)
        problems.push(
          `${width}x${height}px text toolbar (${name}): the docked rule's own top line is ${got.line}, so it would leave the top edge open where it wins`,
        );
      if (got.left < 1 || got.right < 1) problems.push(`${width}x${height}px text toolbar (${name}): a side has no border`);
      if (got.radius.some((r) => parseFloat(r) < 1))
        problems.push(`${width}x${height}px text toolbar (${name}): a top corner is not rounded (${got.radius})`);
    };
    for (const [name, fn] of Object.entries(states)) check(name, await fn());
    // Stuck at the top of the screen, while scrolling through a long text.
    await page.click('.ProseMirror');
    for (let i = 0; i < 40; i++) {
      await page.keyboard.type('Some text on a line');
      await page.keyboard.press('Enter');
    }
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(200);
    check('stuck', await read());
    // The text box's side lines run up behind the stuck toolbar: outside its rounded corner, beside the curve, the page's own
    // colour shows, never a line past the corner.
    // (On the short screen the page has scrolled past the end of the box: scroll back until the toolbar is stuck at the top.)
    await page.evaluate(() => {
      const bar = document.querySelector('.editor-tools');
      if (bar.getBoundingClientRect().top < 0) window.scrollBy(0, bar.getBoundingClientRect().top - 1);
    });
    await page.waitForTimeout(200);
    const corner = await page.evaluate(() => {
      const bar = document.querySelector('.editor-tools').getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(document.querySelector('.editor-tools')).borderTopLeftRadius);
      return { page: getComputedStyle(document.body).backgroundColor, left: bar.left, right: bar.right, top: bar.top, radius };
    });
    const pixel = async (x, y) => {
      const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 }, scale: 'css' });
      // The first pixel of the image: the IDAT chunks hold the zlib data, a filter byte and then the colour (whatever the filter, the first pixel of the first row is as written).
      const chunks = [];
      for (let at = 8; at < png.length; at += 12 + png.readUInt32BE(at))
        if (png.toString('latin1', at + 4, at + 8) === 'IDAT') chunks.push(png.subarray(at + 8, at + 8 + png.readUInt32BE(at)));
      const data = inflateSync(Buffer.concat(chunks), { finishFlush: constants.Z_SYNC_FLUSH });
      return `rgb(${data[1]}, ${data[2]}, ${data[3]})`;
    };
    for (const x of [corner.left + 0.5, corner.right - 0.5]) {
      const got = await pixel(Math.floor(x), Math.floor(corner.top + corner.radius / 2));
      if (got !== corner.page)
        problems.push(
          `${width}x${height}px text toolbar (stuck): the text box's side line runs past the toolbar's rounded corner (${got} at x ${Math.floor(x)}, the page is ${corner.page})`,
        );
    }
    await page.close();
  }
}

/** A section of the whole width (`width` full) reaches the text field's left, right and top edges; one of the text's width stays inset. */
async function checkFullWidthSection() {
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 740 }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${width}px full-width section: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('## Tester');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Some text.');
    const measure = (full) =>
      page.evaluate((full) => {
        const pm = document.querySelector('.ProseMirror');
        const field = pm.closest('.editor-text').getBoundingClientRect();
        const border = (n) => parseFloat(getComputedStyle(pm.closest('.editor-text'))[n]);
        const parts = [...pm.children].filter((n) => !n.classList.contains('editor-section-picture'));
        parts.forEach((el, i) => {
          el.setAttribute('data-section-color', 'primary');
          el.setAttribute('data-section-box', parts.length === 1 ? 'only' : i === 0 ? 'start' : i === parts.length - 1 ? 'end' : 'middle');
          if (full) el.setAttribute('data-section-width', 'full');
          else el.removeAttribute('data-section-width');
        });
        const r = parts[0].getBoundingClientRect();
        const radius = getComputedStyle(parts[0]).borderStartStartRadius;
        return {
          left: r.left - field.left - border('borderLeftWidth'),
          right: field.right - border('borderRightWidth') - r.right,
          top: r.top - field.top,
          radius,
        };
      }, full);
    const inset = await measure(false);
    if (process.env.SHOTS_FULL) await page.locator('.editor-text').screenshot({ path: `${process.env.SHOTS_FULL}-inset-${width}.png` });
    const full = await measure(true);
    if (process.env.SHOTS_FULL) await page.locator('.editor-text').screenshot({ path: `${process.env.SHOTS_FULL}-${width}.png` });
    if (inset.left < 1 || inset.radius === '0px')
      problems.push(`${width}px full-width section: the section of the text's width should stay inset with corners`);
    if (Math.abs(full.left) > 0.5 || Math.abs(full.right) > 0.5 || full.top > 0.5 || full.radius !== '0px')
      problems.push(
        `${width}px full-width section: left ${full.left}, right ${full.right}, top ${full.top}, corner ${full.radius}, should all be 0 against the text field's edges`,
      );
    await page.close();
  }
}

/** A coloured section's background runs down to the next section's divider, or to the end of the text when it is the last (the space below its text is inside the colour, not a white band), in the editor, and in the Preview where the panel has no margin below (375 px with touch, and a computer). */
async function checkSectionBackground(width, touch) {
  const path = 'src/content/pages/about.md';
  const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  const label = `${width}px section background`;
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  for (const last of [false, true]) {
    const body = `# T\n\nIntro.\n\n<div data-section="primary"></div>\n\n## Blue\n\nBlue text.\n${last ? '' : '\n## Plain\n\nPlain text.\n'}`;
    await openEditor(page, site, { [path]: `---\ntitle: "T"\ndescription: "d"\n---\n\n${body}` });
    await page.goto(`${site}/editor/#${path}`);
    await page.waitForSelector('.ProseMirror [data-section-color="primary"]', { timeout: 30_000 });
    const got = await page.evaluate(() => {
      const pm = document.querySelector('.ProseMirror');
      const parts = [...pm.children].filter((c) => !c.classList.contains('editor-section-picture'));
      const blue = parts.filter((c) => c.dataset.sectionColor === 'primary');
      const next = parts[parts.indexOf(blue.at(-1)) + 1];
      const bottom = blue.at(-1).getBoundingClientRect().bottom;
      return { gap: next ? next.getBoundingClientRect().top - bottom : pm.getBoundingClientRect().bottom - bottom, hasNext: Boolean(next) };
    });
    if (Math.abs(got.gap) > 0.5)
      problems.push(
        `${label}: the ${last ? 'last ' : ''}coloured section ends ${got.gap}px ${last ? 'above the end of the text' : 'above the next section'} (should be 0, no white band)`,
      );
  }
  await openEditor(page, site, {
    [path]: `---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n<div data-section="primary"></div>\n\n## Blue\n\nBlue text.\n\n## Plain\n\nPlain text.\n`,
  });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror [data-section-color="primary"]', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Preview' }).first().click();
  await page.waitForFunction(() => document.querySelector('dialog[open] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('section.text-section-primary', { timeout: 30_000 });
  const panel = await frame.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('section.text-section-primary'));
    return { margin: parseFloat(cs.marginBottom), top: parseFloat(cs.paddingTop), bottom: parseFloat(cs.paddingBottom) };
  });
  if (panel.margin !== 0 || panel.bottom <= panel.top)
    problems.push(
      `${label}: in the Preview the panel has ${panel.margin}px margin and ${panel.bottom}px padding below (the space below belongs inside the colour: no margin, more padding than above)`,
    );
  await page.close();
}

/** A tap below the last section, or between two sections, puts the cursor on a free line there (an empty paragraph that is not saved unless typed in), and typing adds text after the section, not in a heading (375 px with touch, and a computer). */
async function checkTapBelowSection(width, touch) {
  const label = `${width}px tap below a section`;
  const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  for (const line of ['# Title', '## One', 'First', '## Two', 'Second']) {
    await page.keyboard.type(line);
    await page.keyboard.press('Enter');
  }
  await page.keyboard.press('Backspace');
  const parts = () =>
    page.evaluate(() =>
      [...document.querySelector('.ProseMirror').children]
        .filter((c) => !c.classList.contains('editor-section-picture'))
        .map((c) => ({ tag: c.tagName, text: c.textContent, ...c.getBoundingClientRect().toJSON() })),
    );
  const tapAt = async (y) => {
    const pm = await page.evaluate(() => document.querySelector('.ProseMirror').getBoundingClientRect().toJSON());
    const x = pm.left + pm.width / 2;
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  };
  const lines = async () => (await parts()).map((p) => `${p.tag}:${p.text}`).join(' | ');
  await page.evaluate(() => document.querySelector('.ProseMirror').scrollIntoView({ block: 'center' }));
  // Between the sections: the white between "First" and the heading "Two".
  let all = await parts();
  const first = all.findIndex((p) => p.text === 'First');
  await tapAt((all[first].bottom + all[first + 1].top) / 2);
  await page.keyboard.type('Between');
  let got = await lines();
  if (got !== 'H1:Title | H2:One | P:First | P:Between | H2:Two | P:Second')
    problems.push(`${label}: typing between two sections gave ${got}`);
  // Below the last section.
  all = await parts();
  await tapAt(all.at(-1).bottom + 8);
  await page.keyboard.type('After');
  got = await lines();
  if (got !== 'H1:Title | H2:One | P:First | P:Between | H2:Two | P:Second | P:After')
    problems.push(`${label}: typing below the last section gave ${got}`);
  await page.close();
}

/** A page's accordion rows (FoldSection): between its divider lines the title has the same space above and below it (within 1px, measured on the pixels of the first capital, not the line box), the arrow is centred on the title, and the row stays 48px tall or more (360, 375, 390, 414 px and a computer). */
async function checkFoldRows(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US', deviceScaleFactor: 2 });
  page.on('pageerror', (e) => problems.push(`${width}px accordion rows: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  const buttons = page.locator('section[aria-labelledby] > h2 > button[aria-expanded]');
  await buttons.first().waitFor();
  await page.waitForTimeout(300);
  const shown = [];
  for (let i = 0; i < (await buttons.count()); i++) {
    const button = buttons.nth(i);
    await button.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(100);
    const box = await button.boundingBox();
    const title = button.locator('span');
    const t = await title.boundingBox();
    const title_ = await title.textContent();
    const arrow = await button.locator('svg').boundingBox();
    // The ink of the title's first capital (the eye's measure, whatever the font): the rows of pixels that differ from the row's background.
    const scale = 2;
    const clip = { x: t.x, y: box.y, width: 8, height: box.height };
    const png = await page.screenshot({ clip });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const bg = [data[0], data[1], data[2]];
    const inked = [];
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        const o = (y * info.width + x) * info.channels;
        if (Math.abs(data[o] - bg[0]) + Math.abs(data[o + 1] - bg[1]) + Math.abs(data[o + 2] - bg[2]) > 120) {
          inked.push(y);
          break;
        }
      }
    if (!inked.length) {
      problems.push(`${width}px accordion row "${title_}": no letters found`);
      continue;
    }
    const above = Math.min(...inked) / scale;
    const below = (info.height - 1 - Math.max(...inked)) / scale;
    shown.push([above, below, box.height]);
    if (Math.abs(above - below) > 1)
      problems.push(`${width}px accordion row "${title_}": ${above}px above the letters and ${below}px below, should be equal`);
    const centre = (Math.min(...inked) + Math.max(...inked) + 1) / 2 / scale + box.y;
    if (Math.abs(arrow.y + arrow.height / 2 - centre) > 1)
      problems.push(`${width}px accordion row "${title_}": the arrow is not centred on the title`);
    if (box.height < 48) problems.push(`${width}px accordion row "${title_}": ${box.height}px tall, should be 48px or more`);
    // The line above the title is the divider under the section before it: nothing may sit between them (a parent's `space-y` gave 24px, twice as far above the title as below it).
    const gap = await button.evaluate((el) => {
      const before = el.closest('section').previousElementSibling;
      if (!before?.matches('section[aria-labelledby]')) return 0;
      return el.closest('section').getBoundingClientRect().top - before.getBoundingClientRect().bottom;
    });
    if (Math.abs(gap) > 1)
      problems.push(
        `${width}px accordion row "${title_}": ${gap}px between the divider above and the row, so the title is farther from the line above than from the line below`,
      );
  }
  if (!shown.length) problems.push(`${width}px accordion rows: none measured`);
  console.log(`${width}px accordion rows (above, below, height): ${JSON.stringify(shown)}`);
  await page.close();
}

/** A page's and a post's form has no "Other fields" fold: "Page settings" ("Post settings") holds the URL, the Short description and the Tags, and the "For review" box (width, height). */
async function checkEntrySettings(width, height) {
  for (const [hash, folds, fields] of [
    ['#new/pages', 'Page settings', ['URL', 'Short description', 'Tags']],
    ['#new/blog', 'Post settings', ['URL', 'Short description']],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${width}px ${hash} settings: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate((h) => (location.hash = h), hash);
    const buttons = page.locator('section[aria-labelledby] > h2 > button[aria-expanded]');
    await buttons.first().waitFor();
    await page.waitForTimeout(300);
    const titles = (await buttons.allTextContents()).map((t) => t.trim());
    if (titles.some((t) => t.startsWith('Other fields')))
      problems.push(`${width}px ${hash}: still has an "Other fields" fold (${titles.join(', ')})`);
    if (titles.some((t) => t.startsWith('Earlier versions')))
      problems.push(`${width}px ${hash}: "Earlier versions" is called "History" now`);
    const settings = buttons.filter({ hasText: folds });
    if (!(await settings.count())) problems.push(`${width}px ${hash}: no "${folds}" fold (${titles.join(', ')})`);
    else {
      if ((await settings.first().getAttribute('aria-expanded')) !== 'true') await settings.first().click();
      const section = page.locator('section[aria-labelledby]').filter({ has: page.locator('h2', { hasText: folds }) });
      const text = await section.first().textContent();
      for (const label of fields) if (!text.includes(label)) problems.push(`${width}px ${hash}: "${folds}" lacks "${label}"`);
    }
    await page.close();
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
    await page.click('.editor-main-drawer-header button');
    await page.waitForTimeout(600);
    checkCog(label, 'skinnen', await page.evaluate(shownItems, 'nav.editor-main-rail .navigation-rail-item'), height);
    const railCurrent = (hash) =>
      go(hash).then(() =>
        page.evaluate(() => document.querySelector('nav.editor-main-rail a[href="#settings"]')?.getAttribute('aria-current')),
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
      }));
      // No sheet from the bottom starts taller than --bottom-sheet-start-max-height (half the screen, Material 3), on a phone.
      if (width < 600) {
        const tooTall = await page.evaluate(() => {
          const cap = innerHeight / 2 + 1;
          const bad = [];
          for (const d of document.querySelectorAll('dialog.editor-sheet.bottom-sheet:not(.editor-side-panel)')) {
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

await checkStartSubtitle();

for (const width of [360, 375, 390, 414]) await checkTextSheet(width);
for (const [width, height] of [
  [360, 740],
  [375, 800],
  [1280, 900],
])
  await checkDraftsCard(width, height);
await checkEmptyHint();
await checkLongPressDelete();
await checkUnlistedPost();
for (const [width, height] of [
  [375, 740],
  [1280, 900],
]) {
  await checkCardsCarousel(width, height);
  for (const scheme of ['light', 'dark']) await checkIconColor(width, height, scheme);
}
for (const [width, height] of [
  [375, 740],
  [1280, 900],
])
  for (const name of ['list', 'segmented', 'buttons', 'cards'])
    await checkIconSlots(
      width,
      height,
      inlineBlocks.find((b) => b.name === name),
    );
for (const block of inlineBlocks) await checkInlineBlock(375, 740, block);
// On a computer too: the row's settings are in the side panel at once (a card's: its page and its buttons).
for (const block of inlineSingles) for (const w of [375, 1280]) await checkInlineSingle(w, w < 600 ? 740 : 900, block);
for (const block of inlineBlocks) await checkInlineBlock(1280, 900, block);
for (const [w, h] of [
  [375, 740],
  [1280, 900],
])
  await checkSegmentedArrow(w, h);
for (const block of liveLists) for (const w of [375, 1280]) await checkLiveList(w, w < 600 ? 740 : 900, block);
await checkListRowColors();
await checkInsertNeverOpensSheet(375, 740);
await checkEmptyRow(375, 740);
await checkInsertNeverOpensSheet(1280, 900);
for (const [width, height] of [
  [375, 740],
  [1280, 900],
])
  await checkSteps(width, height);
await checkDynamicList(375, 740);
await checkDynamicList(1280, 900);
await checkDynamicPicker(375, 740);
await checkDynamicPicker(1280, 900);
await checkOwnList(375, 740);
await checkOwnList(1280, 900);
await checkInlineTable(375, 740);
await checkInlineTable(1280, 800);
await checkTableRadius(375, 740);
await checkTableRadius(1280, 800);
for (const [width, height] of [
  [360, 740],
  [375, 740],
  [390, 844],
  [414, 896],
])
  await checkIconSearch(width, height);
await checkHints();
await checkChecklistMarks();
await checkFullWidthSection();
await checkSectionBackground(375, true);
await checkSectionBackground(1280, false);
await checkTapBelowSection(375, true);
await checkTapBelowSection(1280, false);
for (const [width, height] of [
  [360, 740],
  [375, 800],
  [390, 844],
  [414, 896],
  [1280, 900],
]) {
  await checkFoldRows(width, height);
  await checkEntrySettings(width, height);
}
await checkToolbarBox();
await checkPreviewSection();
await checkFullSection();
await checkH1SectionGap();
for (const w of [375, 1280]) await checkListMarkers(w);
for (const w of [375, 1280]) await checkListsAndBlocks(w);
for (const w of [360, 375, 390, 414]) await checkPreviewDraft(w);

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
