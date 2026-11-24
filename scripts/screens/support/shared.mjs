import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { clickPreview, openEditor, serveBuilt } from '../../built-site.mjs';
import { CORE_PAGE_ID, coreTestSite } from '../../core-blocks-page.mjs';
import { buildTestSite } from '../../test-site.mjs';
import { BUILT_PAGE, ROOT, problems, site } from './context.mjs';

/** A button of the active block's action row by its name (Move up, Move down, Hide, Show, Block settings; Edit on an image card). */
export const rowButton = (page, name) =>
  page.locator(`.mo-site-block-row:not(.mo-site-block-row-hover) [data-row][aria-label="${name}"]:visible`);

/** A tool of the text's one bar by its name: a button of the active block's action row, its button on the bar, or its row in the ⋮ menu when it did not fit (a phone). `how`: 'click' or 'tap'.
 * The bar's buttons keep the cursor where it is. "Edit" is the bar's gear (the row's or item's settings); the block's own settings are Block settings, in the row. */
export async function pressTool(page, name, how = 'click') {
  const inRow = rowButton(page, name);
  if (await inRow.count()) return void (await inRow.first()[how]());
  const direct = page.locator(`.mo-editor-tools button[aria-label="${name}"]:visible`);
  if (await direct.count()) return void (await direct.first()[how]());
  const settings = name === 'Edit' ? rowButton(page, 'Block settings') : null;
  if (settings && (await settings.count())) return void (await settings.first()[how]());
  await pressMore(page, name, how, 'first');
}

/** A row of the bar's ⋮ menu by its name (the block's own menu: Remove, Select; and the tools that did not fit). The block's own actions are in its action row, so
 * `Edit` there is its Block settings button. */
export async function pressMore(page, name, how = 'click', which = 'last') {
  const inRow = rowButton(page, name);
  if (await inRow.count()) return void (await inRow.first()[how]());
  const settings = name === 'Edit' && which === 'last' ? rowButton(page, 'Block settings') : null;
  if (settings && (await settings.count())) return void (await settings.first()[how]());
  await page.locator('.mo-editor-tools [aria-label="More"]:visible').first()[how]();
  const row = page.locator('[role=menu][aria-label="More"] [role^=menuitem]').filter({ hasText: new RegExp(`^${name}$`) });
  // `last`: the block's own menu, which is last in the ⋮ (a gear named Edit may stand before it); `first`: a tool of the bar that did not fit.
  await row[which]()[how]();
}

/** The button that leaves a block's sheet without keeping its changes: Cancel (the modal side sheet, the sheet from the bottom), or the back arrow of the subpage a
 * block's fields are on a phone ("Back to <the page>"). `scope`: a locator to look in (the sheet, or the page for the open dialog). */
export const cancelOf = (scope) => scope.getByRole('button', { name: /^(Cancel|Back to .+)$/ }).first();

/** Ends a block's or section's sheet with its changes kept: Save where it has one (a phone, a sheet from the bottom), else the close button of the live side sheet
 * from expanded, whose changes are in the page already (spec 2026-11-14 one Save, 4.1). `which`: the Save button when there are several. */
export async function saveOrClose(page, which = 'first') {
  // Not the page's own Save in the bar under the sheet (it is called Save too).
  const save = page
    .getByRole('button', { name: 'Save', exact: true })
    .locator('visible=true')
    .and(page.locator(':not(.mo-editor-save-bar *)'));
  if (await save.count()) return void (await save[which]().click());
  await page.locator('.mo-editor-side-sheet [data-side-sheet-close]').last().click();
}

/** The bar's Insert block (always on the bar, never in the ⋮ menu). */
export async function pressInsert(page, how = 'click') {
  await page.locator('.mo-editor-tools button[aria-label="Insert block"]:visible').first()[how]();
}

/** The Text style menu: the bar's button, or its row in the ⋮ menu (which opens the menu under the ⋮) when the button did not fit. */
export async function openStyleMenu(page) {
  const direct = page.locator('.mo-editor-tools [aria-label^="Text style"]:visible');
  if (await direct.count()) return void (await direct.first().click());
  await page.locator('.mo-editor-tools [aria-label="More"]:visible').first().click();
  await page
    .locator('[role=menu][aria-label="More"] [role^=menuitem]')
    .filter({ hasText: /^Text style/ })
    .first()
    .click();
}

/** What the bar and its ⋮ menu hold now: `bar` its buttons (name, title, icon, size, pressed), `more` the rows of the ⋮ menu (opened and closed again by its button, so the cursor stays in its field). */
export async function barTools(page) {
  const bar = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-editor-tools button:not([hidden])')].map((b) => {
      const r = b.getBoundingClientRect();
      return {
        label: b.getAttribute('aria-label'),
        title: b.title,
        svg: !!b.querySelector('svg path'),
        icon: [...b.querySelectorAll('svg path')].map((p) => p.getAttribute('d')).join('|'),
        pressed: b.getAttribute('aria-pressed'),
        width: r.width,
        height: r.height,
        text: b.textContent.trim(),
        chevron: !!b.querySelector('svg[width="12"]'),
      };
    }),
  );
  let more = [];
  const button = page.locator('.mo-editor-tools [aria-label="More"]:visible');
  if (await button.count()) {
    await button.first().click();
    await menusSettled(page);
    more = await page.evaluate(() =>
      [...document.querySelectorAll('[role=menu][aria-label="More"] [role^=menuitem]')].map((x) => ({
        label: x.textContent.trim(),
        pressed: x.getAttribute('aria-checked'),
        height: x.getBoundingClientRect().height,
      })),
    );
    await button.first().click();
  }
  return { bar, more, names: [...bar.map((b) => b.label), ...more.map((m) => m.label)] };
}

/** Waits until the menus that are opening have stopped (the theme's menu is a popover that scales in from 97%), so a size read is the real one. */
export function menusSettled(page) {
  return page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
}

/** The contrast (WCAG) of a hint line (a pseudo-element of the element, which must be in the page: it is waited for) on each section colour, with the section's own colours set on the element as sectionFrame.ts does. */
export async function hintContrasts(page, selector, pseudo) {
  // The line gets its class (`mo-editor-gap-here`) in the editor's own turn after a key: wait for the element, then read it.
  await page.waitForSelector(selector, { state: 'attached', timeout: 5000 });
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

/** Puts the cursor in a new empty line under the line `text`: a click on the line, End, Enter. The first block put in still holds the focus in its first row, and a
 * click away from it closes that row (blockRow in MarkdownEditor.tsx, `away`) while the editor takes the selection from the click on its own turn; an End and an
 * Enter before that act on the old selection (the line after the block), and the next block then lands under the first one, not above it. So the wait is for the
 * state: the editor has the focus with the cursor in the line, and, after Enter, the cursor is in an empty line right under it. If Enter went to the old place
 * the line has no empty line under it; the step is then done again (it only adds a free line). */
export async function newLineUnder(page, text) {
  const line = page.locator('.ProseMirror p', { hasText: text }).first();
  const underNow = () =>
    page.waitForFunction(
      (t) => {
        const p = [...document.querySelectorAll('.ProseMirror > p')].find((e) => e.textContent.includes(t));
        const next = p?.nextElementSibling;
        const at = getSelection()?.anchorNode;
        return !!next && next.tagName === 'P' && next.textContent === '' && !!at && next.contains(at);
      },
      text,
      { timeout: 3000 },
    );
  // A short log of what happens from the click on, kept in the page for the diagnostic below (events with the target and where the selection is, and the changes of the
  // text's DOM: a transaction of the editor makes some, which is how a dispatch between the click and the keys shows).
  await page.evaluate(() => {
    if (window.__newLineLog) return;
    const log = (window.__newLineLog = { start: performance.now(), entries: [] });
    const name = (node) => {
      const el = node && (node.nodeType === 1 ? node : node.parentElement);
      return el
        ? `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}`
        : 'none';
    };
    const where = () => {
      const at = getSelection()?.anchorNode;
      if (!at) return 'none';
      const top = (at.nodeType === 1 ? at : at.parentElement)?.closest('.ProseMirror > *');
      return top ? `child ${[...document.querySelector('.ProseMirror').children].indexOf(top)}` : name(at);
    };
    const add = (what) =>
      log.entries.length < 80 && log.entries.push(`${Math.round(performance.now() - log.start)}ms ${what} sel=${where()}`);
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click', 'focusin', 'selectionchange', 'keydown', 'beforeinput'])
      document.addEventListener(
        type,
        (e) => add(`${type}${e.key ? ` ${e.key}` : ''}${e.inputType ? ` ${e.inputType}` : ''} on ${name(e.target)}`),
        true,
      );
    const text = document.querySelector('.ProseMirror');
    if (text)
      new MutationObserver((records) =>
        add(`text changed x${records.length} first ${records[0].type} on ${name(records[0].target)}`),
      ).observe(text, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'data-row', 'data-section-focus'],
      });
  });
  for (let tries = 0; ; tries++) {
    await page.evaluate(() => {
      if (window.__newLineLog) {
        window.__newLineLog.start = performance.now();
        window.__newLineLog.entries = [];
      }
    });
    await line.click();
    // The cursor is in the line, in the editor, and the block's row has let go of the focus.
    await page.waitForFunction(
      (t) => {
        const at = getSelection()?.anchorNode;
        const p = at && (at.nodeType === 1 ? at : at.parentElement)?.closest('.ProseMirror > p');
        return !!p && p.textContent.includes(t) && document.activeElement?.classList.contains('ProseMirror');
      },
      text,
      { timeout: 5000 },
    );
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    try {
      return await underNow();
    } catch (e) {
      if (tries < 2) continue;
      // The third try failed too: say what the page looked like (the wait and the tries are as they were), and go on, so the run fails with it and the
      // rest of the shard still runs; the line goes to the log at once as well, in case a later step of the caller stops the run before the errors are listed.
      const state = await page
        .evaluate(() => {
          const root = document.querySelector('.ProseMirror');
          const top = (node) => (node && (node.nodeType === 1 ? node : node.parentElement))?.closest('.ProseMirror > *') ?? null;
          const children = [...(root?.children ?? [])];
          const at = getSelection()?.anchorNode;
          const inside = top(at);
          const active = document.activeElement;
          const view = window.visualViewport;
          return {
            children: children.map((el) => `${el.tagName.toLowerCase()}:${(el.textContent ?? '').slice(0, 20)}`),
            selection: !at ? 'none' : inside ? `child ${children.indexOf(inside)} (${inside.tagName.toLowerCase()})` : 'outside the text',
            activeElement: active ? `${active.tagName.toLowerCase()}.${String(active.className).split(' ')[0]}` : 'none',
            visualViewport: view ? { scale: view.scale, offsetTop: view.offsetTop, height: Math.round(view.height) } : null,
            zoomed: document.documentElement.getAttribute('data-zoomed'),
          };
        })
        .catch((error) => ({ unreadable: String(error.message).split('\n')[0] }));
      const timeline = await page.evaluate(() => window.__newLineLog?.entries ?? []).catch(() => []);
      const message = `new line under "${text}": no empty line with the cursor under it after 3 tries (${JSON.stringify(state)}); the last try, from its click: ${JSON.stringify(timeline)}`;
      console.error(message);
      problems.push(message);
      return;
    }
  }
}

/** Puts a block in at the cursor and waits until it is the active block, as a person sees it. A new block takes its first row only once the insert dialog has let
 * go of the focus (MarkdownEditor.tsx, startAt: up to 1.5 s on a slow machine), and until then the block that was active still is, with its row and its handle; and
 * the row of that block matches `.mo-editor-inline-list-row-active` too, so that selector is no sign. The wait is for the state itself: `count` blocks, the new one (`at`) the
 * only one with a row, that row open (no height animation running). A click or a key before that would go to the field the new block is about to take. */
export async function insertBlock(page, hint, count, at) {
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  await page
    .waitForFunction(
      ([n, i]) => {
        const blocks = [...document.querySelectorAll('.ProseMirror .mo-site-block')];
        const open = blocks.filter((b) => b.classList.contains('mo-site-block-has-row'));
        return (
          blocks.length === n &&
          open.length === 1 &&
          open[0] === blocks[i] &&
          !!open[0].querySelector('.mo-editor-inline-list-row-active') &&
          !document.querySelector('.ProseMirror .mo-site-block-row-moving')
        );
      },
      [count, at],
      { timeout: 10000 },
    )
    .catch(async (e) => {
      // What the editor showed when the wait gave up, so a failure in CI says which state was missing.
      const found = await page
        .evaluate(() => ({
          dialogOpen: !!document.querySelector('dialog[open]'),
          blocks: [...document.querySelectorAll('.ProseMirror .mo-site-block')].map((b) => ({
            row: b.classList.contains('mo-site-block-has-row'),
            active: !!b.querySelector('.mo-editor-inline-list-row-active'),
          })),
          moving: !!document.querySelector('.ProseMirror .mo-site-block-row-moving'),
          focus: document.activeElement ? `${document.activeElement.tagName}.${document.activeElement.className}` : null,
        }))
        .catch(() => null);
      // A new error: Node prints the stack, which was made with the old message.
      throw new Error(`insertBlock(${hint}, ${count}, ${at}) found ${JSON.stringify(found)}\n${e.message}`, { cause: e });
    });
}

export async function checkSavedLabel(page, width) {
  const label = `${width}px label on any line (saved page)`;
  const labelNow = () =>
    page.evaluate(() => {
      const el = document.querySelector('.ProseMirror p.mo-type-label-medium');
      return el ? { text: el.textContent, size: getComputedStyle(el).fontSize } : null;
    });
  const path = BUILT_PAGE;
  const text =
    '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n<p class="mo-type-label-medium">Opening hours</p>\n\nMonday to Friday.\n';
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror p.mo-type-label-medium', { timeout: 30_000 });
  const inEditor = await labelNow();
  if (!inEditor || inEditor.size !== '12px')
    problems.push(`${label}: a saved lone label is not a label in the editor (${JSON.stringify(inEditor)})`);
  await clickPreview(page);
  await page.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('[data-editor="text"] .mo-type-label-medium', { timeout: 30_000 });
  const drawn = await frame.evaluate(() => {
    const el = document.querySelector('[data-editor="text"] .mo-type-label-medium');
    const next = el.nextElementSibling;
    return { size: getComputedStyle(el).fontSize, gap: next ? next.getBoundingClientRect().top - el.getBoundingClientRect().bottom : -1 };
  });
  if (drawn.size !== '12px') problems.push(`${label}: a lone label is drawn at ${drawn.size} on the site, not 12px`);
  if (drawn.gap < 0 || drawn.gap > 16) problems.push(`${label}: the text under a lone label is ${drawn.gap}px below it, not close`);
  await page.close();
}

/** A List typed in the text: while a row is active and the list has rows, the text button "Add list row" is under the last row and adds one, the faded empty row is not there, the active row has a dotted line, and Add above and Add below are icon buttons; when the cursor leaves, the button is gone. */
export const inlineBlocks = [
  { name: 'list', hint: 'Show text and images in a list.', add: 'Add list row', rowLink: true },
  { name: 'steps', hint: 'Show the steps in order.', add: 'Add step', noEdit: true },
  { name: 'expand', hint: 'Show list items that expand and collapse.', add: 'Add list row', rowLink: true, surface: true },
  { name: 'cards', hint: 'Show content and actions in cards.', add: 'Add card', surface: true, start: 3 },
  { name: 'pricecards', hint: 'Show prices and what they include.', add: 'Add price card', surface: true, field: 'name' },
  { name: 'buttons', hint: 'Prompt actions with buttons.', add: 'Add button', surface: true, field: 'label' },
  // An app's block (the demo's Inline example app): typed in place from its own Inline.tsx, not from the editor's list of views.
  { name: 'tickets', hint: 'Rows with a heading and a text, typed where they stand.', add: 'Add ticket' },
  // (Only a site that has the demo's app: another site does not have the block.)
].filter((b) => b.name !== 'tickets' || existsSync(join(ROOT, 'src/apps/inline-example')));

/** The blocks that read a list of the site (Testimonials, Blog posts), typed in place: drawn as the site draws them with the demo's real items, the heading typed above. */
export const liveLists = [
  { name: 'testimonials', hint: 'Show what people say about you.', items: '[data-testimonial]' },
  { name: 'posts', hint: 'Help people find a blog post.', items: '.mo-block-posts__in-text li' },
  { name: 'imagegrid', hint: 'Show images from Files in a grid.', items: '.mo-block-imagegrid__grid li' },
];

/** The single blocks typed in place (Notice, Video): one item, no add button, no faded empty item. */
export const inlineSingles = [
  { name: 'notice', hint: 'Highlight a short message for visitors.', field: 'text', text: 'Hello **there**', slot: false },
  { name: 'video', hint: 'Play a video from YouTube or Vimeo.', field: 'title', text: 'My film', slot: false },
];

/** Waits until every animation and transition that ends has ended, and the fonts are loaded, so a check reads the settled geometry (a slower runner would catch the spring `transition: padding` of a button, or a row's layer, half way). Looping ones (`iterations: Infinity`, a spinner) are left running, as they never finish; new animations that start while it waits are waited for too. Nothing is skipped or loosened: a check measures the same, once the page is at rest. */
export async function animationsSettled(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let round = 0; round < 10; round++) {
      const running = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
      if (!running.length) break;
      await Promise.all(running.map((a) => a.finished.catch(() => {})));
      // One frame, so a transition that the end of this one starts has begun and is in the next round.
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
  });
}

/** Opens the system's test page (the Blocks page of core-blocks-page.mjs, on a temporary copy of the site), which these checks measure. It is built on first use, so it is there on any site. */
export async function onTestPage(page, label) {
  const { site: testSite } = await serveCoreTestSite();
  const response = await page.goto(new URL(`/${CORE_PAGE_ID}/`, testSite).href).catch(() => null);
  if (response && response.status() < 400) return true;
  problems.push(`${label}: the system's test page (/${CORE_PAGE_ID}/) did not open on the temporary copy of the site`);
  return false;
}

/** The temporary copy of the site with the system's test page (core-blocks-page.mjs), built and served on the first use and deleted when the run ends: the
 * page is never in the site's own folder. Its content is the demo's Blocks page, so the checks that measure it measure the same on any site. */
export let coreSite = null;
async function serveCoreTestSite() {
  coreSite ??= (async () => {
    const { files, copies } = coreTestSite(ROOT);
    const built = buildTestSite(ROOT, files, copies);
    process.on('exit', built.remove);
    return serveBuilt(built.dist);
  })();
  return coreSite;
}

/** Browser-side helpers (a string, put into page.evaluate): ratio(markCss, sectionEl, opacity) is the WCAG contrast of a colour (at an opacity) on a section's background. */
export const ratioOf = `
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
