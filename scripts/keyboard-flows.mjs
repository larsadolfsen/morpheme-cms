// The main flows of the editor, walked by keyboard alone (Tab, Shift+Tab, Enter, Space, Escape and the arrow keys; plan
// `docs/superpowers/plans/2026-11-20-0-19-3-keyboard.md`, *The main flows*). Each flow is a scripted walk from its start screen:
//   A Write      start screen -> open a page from Pages -> into the text -> type -> Save
//   B Blocks     insert a block from the search sheet -> move it down and up -> open a block's settings -> remove it
//   C Format     in the text -> reach the text bar (Alt+F10) -> Bold, a style, a link -> back to the text
//   D Page       the page's settings sections -> change a field -> the Schedule dialog -> close with Escape
//   E Images     an image's side sheet -> Change image -> the library -> choose -> back where it started
//   F Menus      every kind of menu: open with Enter, move with the arrow keys, close with Escape
//   G Lists      Pages, Blog posts and Files: search, sort, open a row
//   H Settings   Colours: its tabs by the arrow keys, a switch by Space
//   I Dashboard  Edit dashboard -> move a widget down -> Done
// A flow fails (a finding of `scripts/keyboard.mjs`) when a step's control can't be reached by keyboard (`unreachable`: named by the step), or when
// focus is on `body`, or not where the flow says it must be, after something opens or closes (`flow-lost-focus`: named by the step). After the
// first it carries on with the control reached some other way (focused by the script), so one gap does not hide the ones after it, except where a
// step is `need`ed to go on (then the flow ends there). A flow's place is `flow A` .. `flow I`.
import { openEditor } from './built-site.mjs';

/** The flows' ids, in order, and the ones that also run on a phone (375 px). */
export const FLOWS = 'ABCDEFGHI'.split('');
export const PHONE_FLOWS = ['A', 'B', 'F'];

class Stop extends Error {}

/** What is focused, as the flows match it (in the page). */
const matches = (match) => {
  const e = document.activeElement;
  if (!e || e === document.body) return false;
  const text = (e.innerText || e.value || '').trim();
  if (match.css && !e.matches(match.css)) return false;
  if (match.label && e.getAttribute('aria-label') !== match.label) return false;
  if (match.text && !text.startsWith(match.text)) return false;
  if (match.inside && !e.closest(match.inside)) return false;
  return true;
};

/** The place a flow walks in: a page, and the findings and the trace it collects. */
function context(page, flow, width) {
  const findings = [];
  const trace = process.env.KEYBOARD_TRACE;
  const note = (...text) => trace && console.log(`flow ${flow}:`, ...text);
  const add = (problem, selector) => {
    note('FINDING', problem, selector);
    if (!findings.some((f) => f.problem === problem && f.selector === selector)) findings.push({ problem, selector });
  };
  return { page, flow, width, findings, add, note };
}

const isBody = (page) => page.evaluate(() => !document.activeElement || document.activeElement === document.body);
const settle = (page, ms = 450) => page.waitForTimeout(ms);
/** Focus starts at the top of the page, as after a page load. */
const toTop = (page) =>
  page.evaluate(() => {
    document.activeElement?.blur?.();
    document.body.setAttribute('tabindex', '-1');
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute('tabindex');
    document.body.blur?.();
  });
const describe = (page) =>
  page.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return 'body';
    return `${e.tagName.toLowerCase()}[${e.getAttribute('aria-label') ?? ''}] ${(e.innerText || e.value || '').trim().slice(0, 24)}`;
  });

/** The control a step names, found in the page when the keyboard can't reach it (so the flow can carry on). */
const locate = (page, match) => {
  if (match.css && !match.label && !match.text) return page.locator(match.css).first();
  const base = match.css ?? 'button, a, [role=option], [role=menuitem], input, textarea, [role=textbox], summary';
  if (match.label) return page.locator(`${base}[aria-label="${match.label}"]`).first();
  return page.locator(base).filter({ hasText: match.text }).first();
};

/** Moves focus to the control `match` with `keys` (Tab by default), at most `max` presses. When it can't be reached the finding `unreachable` is
 * added, named by `step`, and the control is focused by the script; when there is no such control the flow ends (a `Stop`). @returns {Promise<boolean>} whether the keyboard reached it */
async function reach(ctx, step, match, { keys = ['Tab'], max = 60, optional = false, need = false } = {}) {
  const { page } = ctx;
  if (optional && !(await locate(page, match).count())) return false;
  if (await isBody(page)) await toTop(page);
  for (let i = 0; i <= max; i++) {
    if (await page.evaluate(matches, match)) {
      ctx.note('reached', step, 'after', i);
      return true;
    }
    if (i === max) break;
    await page.keyboard.press(keys[i % keys.length]);
  }
  ctx.add('unreachable', step);
  const control = locate(page, match);
  if (need || !(await control.count())) throw new Stop(step);
  await control.focus();
  return false;
}

/** Focus is not on `body` after `step` (something opened or closed), and, when `match` is given, is on the control it names. */
async function expectFocus(ctx, step, match) {
  await settle(ctx.page);
  const ok = !(await isBody(ctx.page)) && (!match || (await ctx.page.evaluate(matches, match)));
  ctx.note('focus after', step, '->', await describe(ctx.page));
  if (!ok) ctx.add('flow-lost-focus', step);
  return ok;
}

/** Opens a page of the editor (by its hash) from a fresh start. */
async function open(ctx, hash, ready) {
  await ctx.page.evaluate((h) => (location.hash = h), hash);
  if (ready) await ctx.page.waitForSelector(ready, { timeout: 30_000 });
  await settle(ctx.page, 800);
}

/** A tool of the text bar: the bar is one Tab stop (the ARIA toolbar pattern), so Tab gets into it and the arrow keys walk its tools. */
async function reachTool(ctx, step, match) {
  await reach(ctx, `${step} (the bar)`, { css: 'button', inside: '[role=toolbar]' });
  return reach(ctx, step, match, { keys: ['ArrowRight'], max: 30 });
}

const TEXT = { css: '[role=textbox]', label: 'Text' };
const PAGE = 'src/content/pages/about.md';
/** The bar is before the text in the page, so the keyboard goes back to it (Shift+Tab). */
const BAR = { keys: ['Shift+Tab'], max: 60 };
const press = async (ctx, key) => {
  await ctx.page.keyboard.press(key);
  await settle(ctx.page);
};

// ---------------------------------------------------------------------------------------------------- the flows

async function flowA(ctx) {
  const { page } = ctx;
  await open(ctx, '');
  // On a phone the menu is closed: it opens from the top bar.
  if (ctx.width < 600) {
    await reach(ctx, 'A: Open the menu', { css: 'button', label: 'Open the menu' });
    await press(ctx, 'Enter');
    await expectFocus(ctx, 'A: after the menu opens');
  }
  await reach(ctx, 'A: Content in the menu', { css: '.mo-navigation-drawer__item', text: 'Content' });
  await press(ctx, 'Enter');
  await reach(ctx, 'A: Pages in the menu', { css: 'a.mo-navigation-drawer__item', text: 'Pages' });
  await press(ctx, 'Enter');
  await page.waitForSelector('a.mo-list__item-container', { timeout: 30_000 });
  await reach(ctx, 'A: the About Morpheme row', { css: 'a.mo-list__item-container', text: 'About Morpheme' }, { max: 80 });
  await press(ctx, 'Enter');
  await page.waitForSelector('[role=textbox][aria-label="Text"]', { timeout: 30_000 });
  await expectFocus(ctx, 'A: after opening a page from the list');
  await reach(ctx, 'A: the text', TEXT);
  await page.keyboard.type(' by keyboard');
  await settle(ctx.page);
  await reach(ctx, 'A: Save', { css: 'button', text: 'Save' }, { max: 120 });
  await press(ctx, 'Enter');
  await settle(page, 800);
  await expectFocus(ctx, 'A: after Save');
}

async function flowB(ctx) {
  const { page } = ctx;
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  await reachTool(ctx, 'B: Insert block', { css: 'button', label: 'Insert block' });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'B: after the insert sheet opens');
  await page.keyboard.type('notice');
  await settle(page);
  await reach(ctx, 'B: the Notice result', { css: 'button.mo-list__item-container', text: 'Notice' });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'B: after inserting a block');
  await reach(ctx, 'B: Move down', { css: 'button', label: 'Move down' }, BAR);
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'B: after Move down');
  await reach(ctx, 'B: Move up', { css: 'button', label: 'Move up' }, BAR);
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'B: after Move up');
  // A block's settings, and removing it: the card is selected by Enter, which shows the bar's block group.
  const card = { css: 'button.mo-site-block-card' };
  await reach(ctx, 'B: a block card', card, { max: 100 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, "B: after a block's settings open");
  await press(ctx, 'Escape');
  await expectFocus(ctx, "B: after closing a block's settings", card);
  await press(ctx, 'Enter');
  // The card is selected with its settings open beside the text: Alt+F10 moves the focus to the bar, whose block tools have Remove; Escape goes back to the card.
  await press(ctx, 'Alt+F10');
  await reach(ctx, 'B: Remove', { css: 'button', label: 'Remove' }, { keys: ['ArrowRight'], max: 30 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'B: after Remove');
}

async function flowC(ctx) {
  const { page } = ctx;
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  await reach(ctx, 'C: the text', TEXT);
  await page.keyboard.press('Alt+F10');
  await settle(page);
  const inBar = { css: 'button', inside: '[role=toolbar]' };
  if (!(await page.evaluate(matches, inBar))) {
    ctx.add('unreachable', 'C: the text bar (Alt+F10)');
    throw new Stop('C: the text bar');
  }
  await reach(ctx, 'C: Bold', { css: 'button', label: 'Bold' }, { keys: ['ArrowRight'], max: 12, need: true });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'C: after Bold', inBar);
  await reach(
    ctx,
    'C: Text style',
    { css: 'button', inside: '[role=toolbar]', label: 'Text style: Heading' },
    { keys: ['ArrowRight'], max: 12 },
  );
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'C: after Text style opens');
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'C: after a style is chosen');
  await press(ctx, 'Alt+F10');
  await reach(ctx, 'C: Link', { css: 'button', label: 'Link' }, { keys: ['ArrowRight'], max: 12 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'C: after Link opens');
  await press(ctx, 'Escape');
  await expectFocus(ctx, 'C: after Link closes');
  await press(ctx, 'Escape');
  await expectFocus(ctx, 'C: back in the text', TEXT);
}

async function flowD(ctx) {
  const { page } = ctx;
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  for (const section of ['Search engines', 'Social media', 'History']) {
    await reach(ctx, `D: the ${section} section`, { css: 'button.mo-editor-fold-toggle', text: section });
    await press(ctx, 'Enter');
    await expectFocus(ctx, `D: after the ${section} section opens`, { css: 'button.mo-editor-fold-toggle', text: section });
  }
  await reach(ctx, 'D: a field of the page settings', { css: 'input.mo-text-field__input, textarea.mo-text-field__input' }, { max: 120 });
  await page.keyboard.type('x');
  await reach(ctx, 'D: Schedule', { css: 'button.mo-list__item-container', text: 'Schedule' }, { max: 120 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'D: after the Schedule dialog opens');
  await press(ctx, 'Escape');
  await expectFocus(ctx, 'D: after the Schedule dialog closes', { css: 'button.mo-list__item-container', text: 'Schedule' });
}

async function flowE(ctx) {
  const { page } = ctx;
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  const card = { css: 'button.mo-site-block-card' };
  await reach(ctx, 'E: the image card', card, { max: 100 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, "E: after the image's side sheet opens");
  const change = { css: 'button', text: 'Change image' };
  await reach(ctx, 'E: Change image', change);
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'E: after the library opens');
  const choice = 'dialog[open] button.mo-card';
  await reach(ctx, 'E: an image in the library', { css: choice }, { max: 40 });
  await press(ctx, 'Enter');
  await settle(page, 800);
  await expectFocus(ctx, 'E: after an image is chosen', change);
}

/** One menu: opened with Enter, focus goes into it, an arrow key moves it, Escape closes it and gives focus back to its button. */
async function menu(ctx, prefix, name, opener) {
  const { page } = ctx;
  // The text bar is one Tab stop: its tools are reached with the arrow keys.
  if (opener.bar) await reachTool(ctx, `${prefix}: ${name} button`, opener);
  else await reach(ctx, `${prefix}: ${name} button`, opener, { max: 80 });
  await press(ctx, 'Enter');
  const inMenu = () =>
    page.evaluate(() => {
      const e = document.activeElement;
      return Boolean(e && e !== document.body && e.closest('[role=menu]') && !e.matches('[aria-haspopup], [aria-expanded]'));
    });
  if (!(await inMenu())) {
    ctx.add('unreachable', `${prefix}: ${name} takes focus when it opens`);
  } else {
    const before = await describe(page);
    // A menu with one choice has nowhere to move to.
    const choices = await page.evaluate(() => document.querySelectorAll('[role=menu] [role^=menuitem]:not(:disabled)').length);
    await press(ctx, 'ArrowDown');
    if (choices > 1 && (await describe(page)) === before) ctx.add('unreachable', `${prefix}: ${name} moves with the arrow keys`);
  }
  await press(ctx, 'Escape');
  await expectFocus(ctx, `${prefix}: after ${name} closes`, opener);
  // A menu that did not close with Escape is closed, so the next step starts clean.
  if (await page.evaluate(() => Boolean(document.querySelector('[role=menu]')))) await page.mouse.click(2, 2);
}

/** One sheet or dialog opened from a button: focus goes into it, and Escape gives focus back to the button. */
async function sheet(ctx, prefix, name, opener) {
  await reach(ctx, `${prefix}: ${name} button`, opener, { max: 80 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, `${prefix}: after ${name} opens`);
  await press(ctx, 'Escape');
  await expectFocus(ctx, `${prefix}: after ${name} closes`, opener);
}

async function flowF(ctx) {
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  await menu(ctx, 'F', 'the page More menu', { css: 'button', label: 'More', bar: true });
  await open(ctx, '');
  await reach(ctx, 'F: Edit dashboard', { css: 'button', text: 'Edit dashboard' }, { max: 80 });
  await press(ctx, 'Enter');
  await menu(ctx, 'F', "a widget's Actions menu", { css: 'button', label: 'Actions for Drafts' });
}

async function flowG(ctx) {
  const { page } = ctx;
  for (const [hash, label] of [
    ['list/pages', 'Pages'],
    ['list/blog', 'Blog posts'],
    ['files', 'Files'],
  ]) {
    await open(ctx, hash);
    await settle(page, 600);
    await reach(ctx, `G: ${label} search`, { css: 'input.mo-search-bar__input' }, { max: 40 });
    await page.keyboard.type('a');
    await settle(page);
    await sheet(ctx, 'G', `${label} Sort`, { css: 'button', label: 'Sort' });
    await reach(
      ctx,
      `G: a row of ${label}`,
      { css: 'a.mo-list__item-container, button.mo-list__item-container, button.mo-card.mo-has-media' },
      { max: 60 },
    );
  }
}

async function flowH(ctx) {
  const { page } = ctx;
  await open(ctx, 'company/colors');
  await reach(ctx, 'H: the Colours tabs', { css: '[role=tab]', inside: '[role=tablist]' }, { max: 60 });
  const selected = () =>
    page.evaluate(() => [...document.querySelectorAll('[role=tab]')].findIndex((t) => t.getAttribute('aria-selected') === 'true'));
  const before = await selected();
  await press(ctx, 'ArrowRight');
  if ((await selected()) === before) ctx.add('unreachable', 'H: a tab by the arrow keys');
  await open(ctx, 'seo');
  await reach(ctx, 'H: a switch', { css: 'input[role=switch]' }, { max: 100, optional: true });
  if (await page.evaluate(() => document.activeElement?.matches?.('input[role=switch]'))) {
    const was = await page.evaluate(() => document.activeElement.checked);
    await press(ctx, 'Space');
    if ((await page.evaluate(() => document.activeElement.checked)) === was) ctx.add('unreachable', 'H: a switch by Space');
  }
}

async function flowI(ctx) {
  const { page } = ctx;
  await open(ctx, '');
  const edit = { css: 'button', text: 'Edit dashboard' };
  await reach(ctx, 'I: Edit dashboard', edit, { max: 80 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'I: after Edit dashboard');
  await reach(ctx, 'I: the actions of a widget', { css: 'button', label: 'Actions for Drafts' }, { max: 60 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'I: after the widget menu opens');
  await reach(ctx, 'I: Move down', { css: '[role=menuitem], button', text: 'Move down' }, { keys: ['ArrowDown'], max: 8, optional: true });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'I: after Move down');
  await reach(ctx, 'I: Done', { css: 'button', text: 'Done' }, { max: 60 });
  await press(ctx, 'Enter');
  await expectFocus(ctx, 'I: after Done');
  await page.waitForTimeout(100);
}

const RUN = { A: flowA, B: flowB, C: flowC, D: flowD, E: flowE, F: flowF, G: flowG, H: flowH, I: flowI };

/** Walks one flow at `width` in a new page of `browser` on `site`; gives its findings `[{ problem, selector }]` (a flow that ends early still gives what it found).
 * @param {import('playwright').Browser} browser */
export async function runFlow(browser, site, flow, width) {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 }, locale: 'en-US' });
  const ctx = context(page, flow, width);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The editor asks once, after a Save, whether it may show notifications; whether that question comes depends on when its choices load, so it
  // is not asked here (permission denied) and every run sees the same: what has the focus when a Save is done.
  await page.addInitScript(() => {
    try {
      Object.defineProperty(Notification, 'permission', { get: () => 'denied' });
    } catch {}
  });
  try {
    await openEditor(page, site);
    // What a save sends and what the autosave answers, as the unit for Ctrl+S does (scripts/screens/text-bar.mjs).
    await page.route('**/api/github/commit', (r) =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'head', blobs: {} }) }),
    );
    await page.route('**/api/autosave**', (r) =>
      r.request().method() === 'GET'
        ? r.fulfill({ status: 404, body: '' })
        : r.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'off' }) }),
    );
    await RUN[flow](ctx);
  } catch (e) {
    if (!(e instanceof Stop)) errors.push(`flow ${flow}: ${e.message}`);
  }
  await page.close();
  return { findings: ctx.findings, errors };
}
