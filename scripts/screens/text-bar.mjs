import { constants, inflateSync } from 'node:zlib';
import { openEditor, removeVirtualFile, virtualFile } from '../built-site.mjs';
import { toolWidth } from '../../src/textBar.mjs';
import {
  DEFAULT_SCHEME,
  PACK,
  PACK_FOLDER,
  ROOT,
  SPRINGS,
  browser,
  isMotionScheme,
  problems,
  site,
  springCss,
} from './support/context.mjs';
import { previewReference } from './support/icon-pack.mjs';
import { barTools, menusSettled, openStyleMenu, pressInsert } from './support/shared.mjs';

/** The bar has no divider (owner decision, 14 Nov) and Undo, Redo and Insert block stand at its right end in that order, then the ⋮ when there is one: `names` are the bar's buttons left to right,
 * `ends` the right edge of the last button and `edge` the bar's. Returns a problem text, or ''. */
function rightEndProblem(names, ends, edge, hasDivider) {
  if (hasDivider) return 'the bar has a divider';
  const tail = names.at(-1) === 'More' ? names.slice(-4, -1) : names.slice(-3);
  if (tail.join() !== 'Undo,Redo,Insert block') return `Undo, Redo, Insert block are not the right end of the bar (${names.join(', ')})`;
  if (edge - ends > 3) return `the last button is ${(edge - ends).toFixed(1)} px from the bar's right edge`;
  return '';
}

/** The icons of the menus that are open (`[role=menu]`) that are not 20 x 20 px: a list of "<row>: <w> x <h>". */
async function menuIconProblems(page) {
  await menusSettled(page);
  return page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll('[role=menu] svg')) {
      const r = svg.getBoundingClientRect();
      if (Math.abs(r.width - 20) > 0.6 || Math.abs(r.height - 20) > 0.6)
        bad.push(`${svg.closest('[role^=menuitem]')?.textContent.trim() ?? 'menu'}: ${r.width} x ${r.height}`);
    }
    return bad;
  });
}

/** The text's one bar (docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md, PR 1). On a phone, with the cursor in text: one bar, 44 dp tall, every button 44 x 44 dp, never scrolling, no divider, the text tools at the left (Bold, Italic, Text style, List: as many as fit beside the right group) and Undo, Redo, Insert block and the ⋮ at the right end (354 dp wide at 375 px, 352 inside: all four text tools on the bar and the ⋮ reads Alignment, Link, Color; at 360 px Lists is the first row in the ⋮); the ⋮ is a pop-up menu (not a sheet) inside the visible screen, with rows of 44 dp, which keeps the cursor and closes on Escape; Undo works; the bar has the same height idle; the Text style menu has at most 8 rows of 44 dp, a page's first heading offers Main heading, a blog post Heading and Subheading, a list item no heading rows and no Quote, a heading no list rows and no Quote. On a computer all tools are on the bar and there is no ⋮. */
async function checkTextBar(width = 360) {
  const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  const label = `${width}px text bar`;
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Fro');
  await page.waitForSelector('.mo-editor-tools button[aria-label="Bold"]', { timeout: 5000 }).catch(() => {});
  const readBar = () =>
    page.evaluate(() => {
      const bar = document.querySelector('.mo-editor-tools');
      const buttons = [...bar.querySelectorAll('button:not([hidden])')].map((b) => ({
        name: b.getAttribute('aria-label'),
        ...b.getBoundingClientRect().toJSON(),
      }));
      const divider = bar.querySelector('hr[aria-orientation="vertical"]');
      const button = bar.querySelector('button');
      return {
        dividerBox: divider && divider.getBoundingClientRect().toJSON(),
        buttonBox: button && button.getBoundingClientRect().toJSON(),
        height: bar.getBoundingClientRect().height,
        barWidth: bar.clientWidth,
        names: buttons.map((b) => b.name),
        buttons,
        scrolls: bar.scrollWidth > bar.clientWidth + 2,
        divider: !!divider,
        outer: bar.getBoundingClientRect().width,
        barRight: bar.getBoundingClientRect().right,
        lastRight: buttons.at(-1).right,
        pageScrolls: document.documentElement.scrollWidth > innerWidth,
        groups: [...bar.querySelectorAll('[role=group]')].map((g) => g.getAttribute('aria-label')),
        kept: document.activeElement?.closest('.ProseMirror') !== null,
      };
    });
  const inText = await readBar();
  const ended = rightEndProblem(inText.names, inText.lastRight, inText.barRight - 1, inText.divider);
  if (ended) problems.push(`${label}: ${ended}`);
  // The bar is 354 dp wide at 375 px (352 inside its 1 dp edges, 10.5 dp from each edge), the page's margin less 5.5 dp each side, at every phone width.
  if (width === 375 && inText.barWidth !== 352) problems.push(`${label}: the bar is ${inText.barWidth} px inside its edges, not 352`);
  if (width === 375 && Math.abs(inText.outer - 354) > 0.6)
    problems.push(`${label}: the bar is ${inText.outer} px wide, not 354 (352 inside)`);
  const slots = Math.floor(inText.barWidth / 44);
  if (inText.height < 44 || inText.height > 46)
    problems.push(`${label}: the bar is ${inText.height} px tall, not 44 (plus its 1 px edges)`);
  if (inText.scrolls || inText.pageScrolls) problems.push(`${label}: the bar or the page scrolls sideways`);
  if (inText.buttons.some((b) => Math.abs(b.height - 44) > 0.6 || b.width < 43.4))
    problems.push(
      `${label}: a button of the bar is not 44 x 44 dp (${inText.buttons.map((b) => `${b.name} ${b.width}x${b.height}`).join(', ')})`,
    );
  // The ⋮ is Material Symbols' more_vert (three dots in a column, 20 dp), drawn by the icon system, not Phosphor's.
  const dots = await page.evaluate(() => {
    const svg = document.querySelector('.mo-editor-tools [aria-label="More"] svg');
    const r = svg?.getBoundingClientRect();
    return (
      svg && {
        icon: svg.getAttribute('data-icon'),
        path: svg.querySelector('path')?.getAttribute('d') ?? '',
        viewBox: svg.getAttribute('viewBox'),
        w: r.width,
        h: r.height,
      }
    );
  });
  if (!dots) problems.push(`${label}: the ⋮ button has no icon`);
  else if (
    dots.icon !== 'more_vert' ||
    !dots.path ||
    dots.viewBox !== '0 -960 960 960' ||
    Math.abs(dots.w - 20) > 0.6 ||
    Math.abs(dots.h - 20) > 0.6
  )
    problems.push(`${label}: the ⋮ icon is not Material's more_vert at 20 dp (${JSON.stringify(dots)})`);
  if (inText.names.length > slots) problems.push(`${label}: ${inText.names.length} buttons but room for ${slots}`);
  if (inText.names.slice(0, 2).join() !== 'Bold,Italic')
    problems.push(`${label}: Bold and Italic are not the first two (${inText.names.join(', ')})`);
  if (!['Undo', 'Redo', 'Insert block'].every((n) => inText.names.includes(n)) || inText.names.at(-1) !== 'More')
    problems.push(`${label}: Undo, Redo, Insert block and More (last) are not all there (${inText.names.join(', ')})`);
  if (inText.names.indexOf('Insert block') !== inText.names.length - 2)
    problems.push(`${label}: Insert block is not right before the ⋮ (${inText.names.join(', ')})`);
  {
    // The text tools stand at the left in the owner's order (Bold, Italic, Text style, List), as many as fit beside Undo, Redo, Insert block and the ⋮ (176 dp);
    // the last one that does not fit is in the ⋮ (at 360 px: Lists).
    const fit = Math.max(0, Math.min(4, Math.floor((inText.barWidth - 176) / 44)));
    const got = inText.names.slice(0, -4).map((n) => n.split(':')[0]);
    const want = ['Bold', 'Italic', 'Text style', 'List'].slice(0, fit);
    if (got.join() !== want.join()) problems.push(`${label}: the bar has ${got.join()} at the left, not ${want.join()}`);
  }
  if (inText.groups.join() !== 'Text tools,Page tools') problems.push(`${label}: the groups are ${inText.groups.join()}`);
  // Undo works.
  const typed = await page.locator('.ProseMirror').innerText();
  await page.keyboard.type(' more');
  await page.locator('.mo-editor-tools [aria-label="Undo"]').click();
  const undone = await page.locator('.ProseMirror').innerText();
  if (undone.length >= typed.length + ' more'.length) problems.push(`${label}: Undo on the bar did not take back the typing`);
  await page.locator('.ProseMirror').click();
  // The ⋮ is a pop-up menu under its button, inside the screen, rows of 44 dp, and the cursor stays.
  const more = page.locator('.mo-editor-tools [aria-label="More"]');
  await more.click();
  await page.waitForSelector('[role=menu][aria-label="More"]', { timeout: 3000 });
  await menusSettled(page);
  const menu = await page.evaluate(() => {
    const m = document.querySelector('[role=menu][aria-label="More"]');
    const r = m.getBoundingClientRect();
    const b = document.querySelector('.mo-editor-tools [aria-label="More"]').getBoundingClientRect();
    return {
      sheet: !!m.closest('dialog'),
      r: r.toJSON(),
      buttonBottom: b.bottom,
      rows: [...m.querySelectorAll('[role^=menuitem]')].map((x) => ({ name: x.textContent.trim(), h: x.getBoundingClientRect().height })),
      kept: document.activeElement?.closest('.ProseMirror') !== null,
      vh: visualViewport.height,
    };
  });
  const moreIcons = await menuIconProblems(page);
  if (moreIcons.length) problems.push(`${label}: icons in the ⋮ menu are not 20 x 20 px (${moreIcons})`);
  if (menu.sheet) problems.push(`${label}: the ⋮ is a sheet, not a pop-up menu`);
  if (menu.r.left < 0 || menu.r.right > width || menu.r.bottom > menu.vh + 1 || menu.r.top < menu.buttonBottom - 1)
    problems.push(`${label}: the ⋮ menu is outside the visible screen or not under its button`);
  if (menu.rows.some((x) => x.h < 43.4)) problems.push(`${label}: a row of the ⋮ menu is under 44 dp`);
  const listOnBar = inText.names.some((n) => n === 'List' || n.startsWith('List:'));
  for (const name of [...(listOnBar ? [] : ['Bullet list', 'Checklist', 'Numbered list']), 'Color'])
    if (!menu.rows.some((x) => x.name === name))
      problems.push(`${label}: the ⋮ menu lacks "${name}" (${menu.rows.map((x) => x.name).join(', ')})`);
  if (!menu.rows.some((x) => x.name === 'Align left'))
    problems.push(`${label}: the ⋮ menu's alignment row does not read just "Align left" (${menu.rows.map((x) => x.name)})`);
  if (menu.rows.some((x) => /^Insert/.test(x.name))) problems.push(`${label}: Insert block is in the ⋮ menu, not on the bar`);
  // The ⋮ order (owner decision, 14 Nov): Alignment, Link, Color. Link is never on the phone bar.
  if (inText.names.includes('Link')) problems.push(`${label}: Link is on the bar; it belongs in the ⋮ (${inText.names.join(', ')})`);
  const rowAt = (n) => menu.rows.findIndex((x) => x.name === n);
  if (!(rowAt('Align left') >= 0 && rowAt('Align left') + 1 === rowAt('Link') && rowAt('Link') + 1 === rowAt('Color')))
    problems.push(`${label}: the ⋮ does not read Alignment, Link, Color in that order (${menu.rows.map((x) => x.name).join(', ')})`);
  // On the bar the order is Bold, Italic, Text style, List (what fits, in that order).
  const wantFirst = ['Bold', 'Italic', 'Text style'];
  const gotFirst = inText.names.filter(
    (n) => ['Bold', 'Italic', 'Link'].includes(n) || n.startsWith('Text style') || n === 'List' || n.startsWith('List:'),
  );
  if (!gotFirst.every((n, i) => (wantFirst[i] ?? n).slice(0, 4) === n.slice(0, 4)))
    problems.push(`${label}: the bar's text tools are ${gotFirst.join(', ')}, not Bold, Italic, Text style, List`);
  if (!menu.kept) problems.push(`${label}: the ⋮ took the cursor out of the text`);
  await page.keyboard.press('Escape');
  if (await page.locator('[role=menu][aria-label="More"]').count()) problems.push(`${label}: Escape did not close the ⋮ menu`);
  // A row of the ⋮ opens its own menu under the ⋮ button (the ⋮ menu closes); a tap on the ⋮ closes that menu and does not draw the ⋮ menu behind it.
  await more.click();
  await page
    .locator('[role=menu][aria-label="More"] [role^=menuitem]')
    .filter({ hasText: /^Align left$/ })
    .first()
    .click();
  await page
    .waitForSelector('[role=menu][aria-label="Alignment"]', { timeout: 3000 })
    .catch(() => problems.push(`${label}: the Alignment row did not open its menu`));
  if (await page.locator('[role=menu][aria-label="More"]').count())
    problems.push(`${label}: the ⋮ menu stays open behind its Alignment menu`);
  await more.click();
  await page.waitForTimeout(200);
  const left = await page.locator('[role=menu]').count();
  if (left) problems.push(`${label}: a tap on the ⋮ with its Alignment menu open leaves ${left} menu(s) on the screen, not none`);
  await more.click();
  await page
    .waitForSelector('[role=menu][aria-label="More"]', { timeout: 3000 })
    .catch(() => problems.push(`${label}: the ⋮ does not open its menu again`));
  await page.keyboard.press('Escape');
  // With the keyboard open (a short screen) the menu stays inside what is visible and scrolls.
  await page.setViewportSize({ width, height: 420 });
  await page.waitForTimeout(300);
  await more.click();
  const short = await page.evaluate(() => {
    const m = document.querySelector('[role=menu][aria-label="More"]');
    return {
      bottom: m.getBoundingClientRect().bottom,
      vh: visualViewport.height,
      scrolls: m.scrollHeight > m.clientHeight,
      overflow: getComputedStyle(m).overflowY,
    };
  });
  if (short.bottom > short.vh + 1) problems.push(`${label}: the ⋮ menu is under the bottom of a short screen`);
  if (short.overflow !== 'auto' && short.overflow !== 'scroll')
    problems.push(`${label}: the ⋮ menu does not scroll when it is too long (${short.overflow})`);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width, height: 740 });
  await page.waitForTimeout(200);
  // The Text style menu: one button, at most 8 rows of 44 dp, a page's first heading is Main heading.
  const rowsOf = async () => {
    await menusSettled(page);
    return page.evaluate(() =>
      [...document.querySelectorAll('[role=menu] [role^=menuitem]')].map((x) => ({
        name: x.textContent.trim(),
        h: x.getBoundingClientRect().height,
      })),
    );
  };
  const styleTools = (await barTools(page)).names.filter((n) => n.startsWith('Text style'));
  if (styleTools.length !== 1) problems.push(`${label}: ${styleTools.length} Text style tools on the bar and in the ⋮, not 1`);
  await openStyleMenu(page);
  const style = await rowsOf();
  if (style.length > 8 || style.some((x) => x.h < 43.4))
    problems.push(`${label}: the Text style menu has ${style.length} rows or one is under 44 dp`);
  if (!style.some((x) => x.name === 'Main heading') || style.some((x) => x.name === 'Subheading'))
    problems.push(`${label}: a page's first heading should offer Main heading only (${style.map((x) => x.name).join(', ')})`);
  // A divider under the headings and another between the body styles and Quote, the same divider part.
  const styleIcons = await menuIconProblems(page);
  if (styleIcons.length) problems.push(`${label}: icons in the Text style menu are not 20 x 20 px (${styleIcons})`);
  // The body styles draw an A with a number, the smallest the highest (Body small A3, medium A2, large A1); the bar's Text style button shows Aa
  // (Material's match_case) while a body style is on; the other rows keep their own icons.
  const rowIcons = await page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('[role=menu] [role^=menuitem]')].map((x) => [
        x.textContent.trim(),
        x.querySelector('svg')?.getAttribute('data-icon') ?? (x.querySelector('svg') ? 'other' : 'none'),
      ]),
    ),
  );
  for (const [name, icon] of [
    ['Body small', 'body_a3'],
    ['Body medium', 'body_a2'],
    ['Body large', 'body_a1'],
  ])
    if (rowIcons[name] !== icon) problems.push(`${label}: ${name} has icon ${rowIcons[name]}, not ${icon}`);
  const buttonIcon = await page.evaluate(() =>
    document.querySelector('.mo-editor-tools [aria-label^="Text style"] svg')?.getAttribute('data-icon'),
  );
  if (buttonIcon !== 'match_case') problems.push(`${label}: the Text style button shows ${buttonIcon}, not Aa (match_case)`);
  for (const name of ['Main heading', 'Quote'])
    if (rowIcons[name]?.startsWith('body_a') || rowIcons[name] === 'match_case' || rowIcons[name] === 'none')
      problems.push(`${label}: ${name} lost its own icon (${rowIcons[name]})`);
  const order = await page.evaluate(() =>
    [...document.querySelectorAll('[role=menu] > li')].map((li) =>
      li.classList.contains('mo-menu__divider') ? '-' : li.textContent.trim(),
    ),
  );
  if (order.join('|') !== 'Main heading|-|Body large|Body medium|Body small|Label|-|Quote')
    problems.push(
      `${label}: the Text style menu reads ${order.join(' | ')}, not Main heading | - | Body large | Body medium | Body small | Label | - | Quote`,
    );
  for (const name of ['Body small', 'Body medium', 'Body large', 'Quote'])
    if (!style.some((x) => x.name === name)) problems.push(`${label}: the Text style menu lacks ${name}`);
  // In a heading: no Quote, no list rows (on the bar's ⋮ or the List menu).
  await page
    .locator('[role=menu] [role^=menuitem]')
    .filter({ hasText: /^Main heading$/ })
    .first()
    .click();
  await page.keyboard.type('Title');
  await openStyleMenu(page);
  if ((await rowsOf()).some((x) => x.name === 'Quote')) problems.push(`${label}: Quote is offered in a heading`);
  await page.keyboard.press('Escape');
  await more.click();
  const inHeading = await rowsOf();
  if (inHeading.some((x) => /list$/i.test(x.name)))
    problems.push(`${label}: list rows are offered in a heading (${inHeading.map((x) => x.name).join(', ')})`);
  if ((await readBar()).names.some((n) => n === 'List' || n.startsWith('List:')))
    problems.push(`${label}: the List button is on the bar in a heading`);
  await page.keyboard.press('Escape');
  // Idle: the cursor leaves the text; the fixed tools only, no divider, the same bar height, nothing scrolls.
  await page.evaluate(() => document.activeElement?.blur());
  // The contextual tools slide out first (a ghost copy of them, which is not the bar's tools): idle is what is left when it is gone.
  await page.waitForFunction(() => !document.querySelector('.mo-editor-tools-ghost'), null, { timeout: 4000 });
  await page.waitForTimeout(100);
  const idle = await readBar();
  // Idle: Preview, then Undo, Redo, Insert block at the right end, no divider and no ⋮ (a new page: no View on site).
  if (idle.names.join() !== 'Preview,Undo,Redo,Insert block')
    problems.push(`${label}: idle the bar has ${idle.names.join()}, not Preview, Undo, Redo, Insert block`);
  const idleEnded = rightEndProblem(idle.names, idle.lastRight, idle.barRight - 1, idle.divider);
  if (idleEnded) problems.push(`${label}: idle: ${idleEnded}`);
  if (Math.abs(idle.height - inText.height) > 0.6)
    problems.push(`${label}: the bar is ${idle.height} px tall idle and ${inText.height} in text`);
  if (width !== 360) return void (await page.close());
  // The bar's tools rest in one colour (the menu buttons too), and a menu button is never in the accent.
  await page.click('.ProseMirror');
  const colours = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll('.mo-editor-tools button:not([aria-pressed="true"]):not(:disabled)')]
        .filter((b) => b.querySelector('svg'))
        .map((b) => getComputedStyle(b).color),
    ),
  ]);
  if (colours.length > 1) problems.push(`${width}px text toolbar: its tools rest in ${colours.length} colours (${colours.join(', ')})`);
  await page.close();
  // A blog post: the first heading offers Heading and Subheading (H2, H3), no Main heading.
  const blog = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  blog.on('pageerror', (e) => problems.push(`${label} (blog): ${e.message}`));
  await openEditor(blog, site);
  await blog.evaluate(() => (location.hash = '#new/blog'));
  await blog.waitForSelector('.ProseMirror');
  await blog.click('.ProseMirror');
  await blog.keyboard.type('Fro');
  await openStyleMenu(blog);
  const blogRows = await blog.evaluate(() =>
    [...document.querySelectorAll('[role=menu] [role^=menuitem]')].map((x) => x.textContent.trim()),
  );
  if (!blogRows.includes('Heading') || !blogRows.includes('Subheading') || blogRows.includes('Main heading'))
    problems.push(`${label} (blog): a post offers ${blogRows.join(', ')}, not Heading and Subheading`);
  await blog.close();
}

/** The editor's floating parts are placed by CSS anchor positioning (Menu and the tooltip in ui.tsx): a bar menu (Text style, at 375 touch, 768 and 1280) and a tooltip (768 and 1280, with the mouse) are open as popovers, inside the screen and next to the button that opened them. */
async function checkAnchoredParts(width, height, touch) {
  const label = `${width}px anchored parts${touch ? ' (touch)' : ''}`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  const near = (m, b, w, h) => {
    const below = m.top - b.bottom;
    const above = b.top - m.bottom;
    const inside = m.left >= 7.5 && m.top >= 7.5 && m.right <= w - 7.5 && m.bottom <= h - 7.5;
    return { inside, next: (below >= -1 && below <= 12) || (above >= -1 && above <= 12), below, above };
  };
  // The bar menu.
  await openStyleMenu(page);
  await page.waitForSelector('[role=menu]');
  await menusSettled(page);
  const menu = await page.evaluate(() => {
    const m = [...document.querySelectorAll('[role=menu]')].find((x) => x.getClientRects().length && x.matches(':popover-open'));
    const b =
      document.querySelector('.mo-editor-tools [aria-label^="Text style"]:not([hidden])') ??
      document.querySelector('.mo-editor-tools [aria-label="More"]');
    if (!m || !b) return null;
    return { m: m.getBoundingClientRect().toJSON(), b: b.getBoundingClientRect().toJSON(), w: innerWidth, h: innerHeight };
  });
  if (!menu) problems.push(`${label}: no open bar menu popover`);
  else {
    const at = near(menu.m, menu.b, menu.w, menu.h);
    if (!at.inside) problems.push(`${label}: the bar menu is not inside the screen (${JSON.stringify(menu.m)})`);
    if (!at.next) problems.push(`${label}: the bar menu is not next to its button (below ${at.below}, above ${at.above})`);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (await page.locator('[role=menu]:popover-open').count()) problems.push(`${label}: Escape did not close the bar menu`);
  // The tooltip, with the mouse.
  if (!touch) {
    const button = page.locator('.mo-editor-tools [aria-label="Bold"]:visible').first();
    await button.hover();
    await page.waitForTimeout(900);
    const tip = await page.evaluate(() => {
      const t = document.querySelector('.mo-editor-tooltip:popover-open');
      const b = document.querySelector('.mo-editor-tools [aria-label="Bold"]');
      return t && b
        ? { m: t.getBoundingClientRect().toJSON(), b: b.getBoundingClientRect().toJSON(), w: innerWidth, h: innerHeight }
        : null;
    });
    if (!tip) problems.push(`${label}: no tooltip over Bold`);
    else {
      const at = near(tip.m, tip.b, tip.w, tip.h);
      if (!at.inside) problems.push(`${label}: the tooltip is not inside the screen (${JSON.stringify(tip.m)})`);
      if (!at.next) problems.push(`${label}: the tooltip is not next to its button (below ${at.below}, above ${at.above})`);
    }
  }
  await page.close();
}

/** The bar moves with the theme's springs only (PR 3 of the contextual toolbar plan; spec section 4): the cursor going into the text slides the contextual tools in from the left
 * and pushes the main tools right (both animate, spatial fast: the theme's duration and curve, no own), the cursor leaving slides them out
 * (a ghost copy that is gone once it has finished) and the main tools back, a block after the text is a fade in place (effects), the bar's height
 * never moves, and with prefers-reduced-motion nothing is animated at all. `reduced`: the visitor asked for reduced motion. */
async function checkBarSlide(width, reduced = false, height = 800) {
  const phone = width < 600;
  const label = `${width}px bar slide${reduced ? ' (reduced motion)' : ''}`;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: phone,
    isMobile: phone,
    locale: 'en-US',
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.waitForSelector('.mo-editor-tools');
  const scheme = await page.evaluate(() => document.documentElement.dataset.motionScheme);
  const spring = SPRINGS[isMotionScheme(scheme) ? scheme : DEFAULT_SCHEME];
  const want = { spatial: springCss(spring.spatial.fast), effects: springCss(spring.effects.default) };
  // Every animation the bar starts is recorded with its keyframes and timing.
  await page.evaluate(() => {
    window.__bar = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, timing) {
      if (this.closest?.('.mo-editor-tools'))
        window.__bar.push({ keyframes, timing, ghost: this.classList.contains('mo-editor-tools-ghost'), cls: this.className });
      return animate.call(this, keyframes, timing);
    };
  });
  const taken = () => page.evaluate(() => window.__bar.splice(0));
  const heights = () =>
    page.evaluate(
      () =>
        new Promise((done) => {
          const bar = document.querySelector('.mo-editor-tools');
          const seen = [];
          let frames = 0;
          const look = () => {
            seen.push({
              bar: bar.getBoundingClientRect().height,
            });
            if (++frames < 14) requestAnimationFrame(look);
            else done(seen);
          };
          look();
        }),
    );
  const steady = (seen, name) => {
    const base = seen.at(-1);
    for (const now of seen) {
      if (Math.abs(now.bar - base.bar) > 0.6) problems.push(`${label}: the bar's height moves during ${name} (${now.bar} and ${base.bar})`);
    }
  };
  const spatial = (list) => list.filter((a) => a.keyframes.some((k) => k.transform !== undefined));
  const isTheme = (a, kind) =>
    a.timing.duration === want[kind].duration && a.timing.easing === want[kind].easing && a.timing.easing.startsWith('linear(');

  // The cursor leaves the text: the contextual tools slide out (a ghost copy) and the main tools slide back.
  await page.click('.ProseMirror');
  await page.waitForTimeout(600);
  await taken();
  const before = await heights();
  await taken();
  await page.evaluate(() => document.activeElement?.blur());
  const leaving = await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => done(document.querySelectorAll('.mo-editor-tools-ghost').length))),
  );
  const leave = await taken();
  steady(await heights(), 'the slide out');
  await page.waitForTimeout(want.spatial.duration + 300);
  const ghostsLeft = await page.locator('.mo-editor-tools-ghost').count();
  if (reduced) {
    if (leave.length || leaving)
      problems.push(`${label}: the bar animates the tools out with reduced motion (${leave.length} animations, ${leaving} ghosts)`);
  } else {
    if (spatial(leave).length < 1)
      problems.push(`${label}: leaving the text does not slide the tools out (${spatial(leave).length} slides)`);
    if (!leaving) problems.push(`${label}: no ghost copy of the contextual tools slides out`);
    if (leave.some((a) => !isTheme(a, 'spatial')))
      problems.push(
        `${label}: a slide out is not the theme's spatial spring (${JSON.stringify(leave.map((a) => a.timing))}, wanted ${JSON.stringify(want.spatial)})`,
      );
    if (ghostsLeft) problems.push(`${label}: the ghost copy is still there after the slide out`);
  }
  steady(before, 'rest');

  // The cursor goes into the text: the contextual tools slide in and push the main tools right.
  await taken();
  await page.click('.ProseMirror');
  await page.waitForFunction(() => document.querySelector('.mo-editor-tools-context'), null, { timeout: 4000 });
  const enter = await taken();
  steady(await heights(), 'the slide in');
  await page.waitForTimeout(want.spatial.duration + 300);
  if (reduced) {
    if (enter.length) problems.push(`${label}: the bar animates the tools in with reduced motion (${enter.length} animations)`);
  } else {
    if (spatial(enter).length < 1)
      problems.push(`${label}: going into the text does not slide the tools in (${spatial(enter).length} slides)`);
    if (enter.some((a) => !isTheme(a, 'spatial')))
      problems.push(`${label}: a slide in is not the theme's spatial spring (${JSON.stringify(enter.map((a) => a.timing))})`);
    const slidIn = enter.find((a) => String(a.cls).includes('mo-editor-tools-context'));
    if (!slidIn || !String(slidIn.keyframes[0].transform).startsWith('translateX(-'))
      problems.push(`${label}: the contextual tools do not come in from the left`);
  }
  const rest = await page.evaluate(() => {
    const bar = document.querySelector('.mo-editor-tools');
    const main = bar.querySelector('.mo-editor-tools-main');
    const context = bar.querySelector('.mo-editor-tools-context');
    return {
      mainAfterContext: !!context && main.getBoundingClientRect().left >= context.getBoundingClientRect().right - 1,
      mainAtEnd: bar.getBoundingClientRect().right - main.getBoundingClientRect().right < 3,
      transform: getComputedStyle(main).transform,
    };
  });
  if (!rest.mainAfterContext) problems.push(`${label}: the fixed tools do not rest after the contextual tools`);
  if (!rest.mainAtEnd) problems.push(`${label}: the fixed tools are not at the right end of the bar`);
  if (rest.transform !== 'none') problems.push(`${label}: the main tools keep a transform after the slide (${rest.transform})`);

  // A block after the text: no second slide, the contextual tools fade in place with the theme's effects spring.
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const barHeight = () => page.evaluate(() => document.querySelector('.mo-editor-tools').getBoundingClientRect().height);
  const heightBefore = await barHeight();
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Show text and images in a list.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  const heightDuring = await barHeight();
  await page.waitForTimeout(500);
  if (Math.abs(heightDuring - heightBefore) > 0.6 || Math.abs((await barHeight()) - heightBefore) > 0.6)
    problems.push(`${label}: the bar's height changes when it goes from the text to a block (${heightBefore}, ${heightDuring})`);
  const change = await taken();
  const fades = change.filter((a) => a.keyframes.some((k) => k.opacity !== undefined));
  if (reduced) {
    if (change.length)
      problems.push(`${label}: the bar animates from the text to a block with reduced motion (${change.length} animations)`);
  } else {
    if (!fades.length) problems.push(`${label}: no fade when the bar goes from the text to a block`);
    if (fades.some((a) => !isTheme(a, 'effects')))
      problems.push(
        `${label}: the fade is not the theme's effects spring (${JSON.stringify(fades.map((a) => a.timing))}, wanted ${JSON.stringify(want.effects)})`,
      );
    // A cross-fade: the new tools go from opacity 0 to 1 and a ghost copy of the old ones from 1 to 0, neither with a transform (the ghost is out of the row's flow).
    const fadeIn = fades.find((a) => !a.ghost && a.keyframes[0].opacity === 0 && a.keyframes.at(-1).opacity === 1);
    const fadeOut = fades.find((a) => a.ghost && a.keyframes[0].opacity === 1 && a.keyframes.at(-1).opacity === 0);
    if (!fadeIn) problems.push(`${label}: the new tools do not fade in (0 to 1) when the bar goes from the text to a block`);
    if (!fadeOut) problems.push(`${label}: the old tools do not fade out (1 to 0) when the bar goes from the text to a block`);
    if (change.some((a) => a.ghost && a.keyframes.some((k) => k.transform !== undefined)))
      problems.push(`${label}: going from the text to a block slides a ghost out (it fades in place)`);
    if (await page.locator('.mo-editor-tools-ghost').count()) problems.push(`${label}: the fading-out copy is still there after the fade`);
  }
  await page.close();
}

/** The text bar is a width budget (src/textBar.mjs, owner requirement 14 Nov): at each width the bar does not overflow its box, leaves no gap as wide as the
 * next tool, draws every button at its declared width (TOOL_WIDTH), and the ⋮ menu holds exactly the text tools that are not on the bar. Returns
 * which text tools stand on the bar, for the report. */
async function checkTextBarFit(width) {
  const label = `${width}px text bar fit`;
  const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: width < 600, isMobile: width < 600, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Fro');
  await page.waitForSelector('.mo-editor-tools button[aria-label="Bold"]', { timeout: 5000 });
  const idOf = (name) => {
    if (name.startsWith('Text style')) return 'style';
    if (name === 'List' || name.startsWith('List:')) return 'list';
    if (name.startsWith('Alignment')) return 'align';
    return { Bold: 'bold', Italic: 'italic', Link: 'link', Color: 'color', Divider: 'divider' }[name] ?? null;
  };
  const bar = await page.evaluate(() => {
    const el = document.querySelector('.mo-editor-tools');
    const buttons = [...el.querySelectorAll('button:not([hidden])')].map((b) => ({
      name: b.getAttribute('aria-label'),
      w: b.getBoundingClientRect().width,
      right: b.getBoundingClientRect().right,
    }));
    return {
      inner: el.clientWidth,
      barRight: el.getBoundingClientRect().right,
      scrolls: el.scrollWidth > el.clientWidth + 2,
      buttons,
      pageScrolls: document.documentElement.scrollWidth > innerWidth,
    };
  });
  const TEXT = ['bold', 'italic', 'style', 'list', 'align', 'link', 'color', 'divider'];
  const onBar = bar.buttons.map((b) => idOf(b.name)).filter(Boolean);
  if (bar.scrolls || bar.pageScrolls || bar.buttons.at(-1).right > bar.barRight - 0.5)
    problems.push(`${label}: the bar overflows its box (last button ends at ${bar.buttons.at(-1).right}, box at ${bar.barRight - 1})`);
  for (const b of bar.buttons) {
    const id = idOf(b.name) ?? { Undo: 'undo', Redo: 'redo', 'Insert block': 'insert', More: 'more' }[b.name];
    if (id && Math.abs(b.w - toolWidth(id)) > 0.6)
      problems.push(`${label}: ${b.name} is drawn ${b.w} dp wide, TOOL_WIDTH says ${toolWidth(id)} (src/textBar.mjs)`);
  }
  if (onBar.join() !== TEXT.slice(0, onBar.length).join())
    problems.push(`${label}: the bar's text tools are not in order (${onBar.join()})`);
  const free = bar.inner - bar.buttons.reduce((n, b) => n + b.w, 0);
  const hasMore = bar.buttons.some((b) => b.name === 'More');
  const inMenu = [];
  if (hasMore) {
    await page.locator('.mo-editor-tools [aria-label="More"]').click();
    await page.waitForSelector('[role=menu][aria-label="More"]', { timeout: 3000 });
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('[role=menu][aria-label="More"] [role^=menuitem]')].map((x) => x.textContent.trim()),
    );
    for (const r of rows) {
      const id = /^Text style/.test(r)
        ? 'style'
        : /^(Bullet|Check|Numbered) list$/.test(r)
          ? 'list'
          : /^Align /.test(r)
            ? 'align'
            : { Link: 'link', Color: 'color', Divider: 'divider' }[r];
      if (id && !inMenu.includes(id)) inMenu.push(id);
    }
  }
  const rest = TEXT.slice(onBar.length);
  if (inMenu.join() !== rest.join())
    problems.push(`${label}: the ⋮ menu holds ${inMenu.join() || 'no text tool'}, not the tools off the bar (${rest.join() || 'none'})`);
  if (!hasMore && rest.length) problems.push(`${label}: tools are off the bar and there is no ⋮ (${rest.join()})`);
  if (hasMore && !rest.length && !inMenu.length) {
    // A ⋮ with no text tool in it is only allowed while Section settings or another row is in it.
  }
  if (rest.length && free >= toolWidth(rest[0]) - 0.6)
    problems.push(`${label}: a gap of ${free} dp on the bar, the next tool (${rest[0]}) is ${toolWidth(rest[0])} dp`);
  console.log(`${label}: ${bar.inner} dp inside; on the bar ${onBar.join(', ')}; in the ⋮ ${rest.join(', ') || '-'}; free ${free} dp`);
  await page.close();
}

/** On a computer (1280 px, a bar of 478 dp) the text tools are at the left and Undo, Redo, Insert block at the right end, no divider, 44 dp tall. A page's
 * Preview (one save while writing, 3.3) does not fit beside all seven text tools: it is in the ⋮, which then takes a slot, so Color is in the ⋮ too;
 * every tool is on the bar or in the ⋮, and the ⋮ holds only what does not fit. */
async function checkTextBarWide() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`1280px text bar: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Fro');
  const got = await page.evaluate(() => {
    const bar = document.querySelector('.mo-editor-tools');
    const buttons = [...bar.querySelectorAll('button:not([hidden])')];
    return {
      width: bar.clientWidth,
      height: bar.getBoundingClientRect().height,
      names: buttons.map((b) => b.getAttribute('aria-label')),
      small: buttons.filter((b) => Math.abs(b.getBoundingClientRect().height - 44) > 0.6 || b.getBoundingClientRect().width < 43.4).length,
      scrolls: bar.scrollWidth > bar.clientWidth + 2,
      divider: !!bar.querySelector('hr[aria-orientation="vertical"]'),
      barRight: bar.getBoundingClientRect().right,
      lastRight: buttons.at(-1).getBoundingClientRect().right,
    };
  });
  const endedWide = rightEndProblem(got.names, got.lastRight, got.barRight - 1, got.divider);
  if (endedWide) problems.push(`1280px text bar: ${endedWide}`);
  // Every icon in the bar's menus is 20 x 20 px: Text style, List, Alignment and Color.
  for (const name of ['Text style', 'List', 'Alignment', 'Color']) {
    if (!got.names.some((n) => n === name || n.startsWith(`${name}:`))) continue;
    await page.locator(`.mo-editor-tools [aria-label^="${name}"]`).first().click();
    const bad = await menuIconProblems(page);
    if (bad.length) problems.push(`1280px text bar: icons in the ${name} menu are not 20 x 20 px (${bad})`);
    if (name === 'Text style') {
      const icons = await page.evaluate(() => ({
        button: document.querySelector('.mo-editor-tools [aria-label^="Text style"] svg')?.getAttribute('data-icon'),
        rows: Object.fromEntries(
          [...document.querySelectorAll('[role=menu] [role^=menuitem]')].map((x) => [
            x.textContent.trim(),
            x.querySelector('svg')?.getAttribute('data-icon'),
          ]),
        ),
      }));
      if (icons.button !== 'match_case') problems.push(`1280px text bar: the Text style button shows ${icons.button}, not Aa (match_case)`);
      for (const [row, icon] of [
        ['Body small', 'body_a3'],
        ['Body medium', 'body_a2'],
        ['Body large', 'body_a1'],
      ])
        if (icons.rows[row] !== icon) problems.push(`1280px text bar: ${row} has icon ${icons.rows[row]}, not ${icon}`);
    }
    await page.keyboard.press('Escape');
  }
  const { more } = await barTools(page);
  const rows = more.map((m) => m.label);
  const want = ['Bold', 'Italic', 'Text style', 'List', 'Alignment', 'Link', 'Color', 'Divider', 'Undo', 'Redo', 'Insert block', 'Preview'];
  for (const name of want)
    if (!got.names.some((n) => n === name || n.startsWith(`${name}:`)) && !rows.includes(name))
      problems.push(`1280px text bar: no ${name} on the bar or in the ⋮ (${got.names.join(', ')} | ${rows.join(', ')})`);
  for (const name of ['Bold', 'Italic', 'Text style', 'List', 'Alignment', 'Link', 'Undo', 'Redo', 'Insert block'])
    if (!got.names.some((n) => n === name || n.startsWith(`${name}:`)))
      problems.push(`1280px text bar: ${name} is not on the bar (${got.names.join(', ')})`);
  if (got.names.includes('More') && rows.some((r) => !['Preview', 'Color', 'Divider'].includes(r)))
    problems.push(`1280px text bar: the ⋮ holds more than Preview, Color and Divider (${rows.join(', ')})`);
  if (got.height < 44 || got.height > 46 || got.small || got.scrolls || got.divider)
    problems.push(
      `1280px text bar: height ${got.height}, ${got.small} buttons not 44 x 44, scrolls ${got.scrolls}, divider ${got.divider} (none wanted)`,
    );
  await page.close();
}

/** Preview and View on site are in the text's one bar (docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md, 3.3 and 10; PR 4), on a
 * saved page: idle, Preview is a 44 dp button right before Undo; in the text it stays on the bar where every tool fits (1280) and is a row of the
 * ⋮ where the text tools fill the bar (375); View on site is always the ⋮'s last row and opens the page on the site; the page actions (the top
 * bar, the title row) have neither. Ctrl+S never opens the browser's save dialog (the key is taken) and sends the autosave at once, without
 * waiting for the moment after the last change. */
async function checkPreviewInBar(width) {
  const phone = width < 600;
  const label = `${width}px Preview in the bar`;
  const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const puts = [];
  await page.route('**/api/autosave**', (r) => {
    if (r.request().method() === 'PUT') puts.push(r.request().postDataJSON());
    if (r.request().method() === 'GET') return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ contentType: 'application/json', body: '{}' });
  });
  await page.goto(`${site}/editor/#src/content/pages/zz-check-page.md`);
  await page.waitForSelector('.mo-editor-tools button[aria-label="Undo"]', { timeout: 30_000 });
  await page.waitForTimeout(300);
  const names = () =>
    page.evaluate(() => [...document.querySelectorAll('.mo-editor-tools button:not([hidden])')].map((b) => b.getAttribute('aria-label')));
  const moreRows = async () => {
    await page.locator('.mo-editor-tools button[aria-label="More"]').click();
    await page.waitForSelector('[role=menu][aria-label="More"]', { timeout: 3000 });
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('[role=menu][aria-label="More"] [role^=menuitem]')].map((x) => x.textContent.trim()),
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    return rows;
  };
  // The page actions have no Preview and no View on site (only the bar, its ⋮ and, until PR 5, the floating bar may).
  const outside = await page.evaluate(() =>
    [...document.querySelectorAll('button, a')]
      .filter((el) => el.getClientRects().length && !el.closest('.mo-editor-tools, .mo-editor-save-bar, [role=menu], dialog'))
      .map((el) => el.getAttribute('aria-label') ?? el.textContent.trim())
      .filter((name) => name === 'Preview' || name === 'View on the website'),
  );
  if (outside.length) problems.push(`${label}: the page actions still have ${outside.join(', ')}`);
  // Idle: Preview, a 44 dp button, right before Undo.
  const idle = await names();
  if (idle[idle.indexOf('Undo') - 1] !== 'Preview') problems.push(`${label}: idle, Preview is not right before Undo (${idle.join(', ')})`);
  const size = await page
    .locator('.mo-editor-tools button[aria-label="Preview"]')
    .evaluate((b) => b.getBoundingClientRect().toJSON(), null, { timeout: 2000 })
    .catch(() => null);
  if (!size || Math.abs(size.width - 44) > 0.6 || Math.abs(size.height - 44) > 0.6)
    problems.push(`${label}: Preview on the bar is not 44 x 44 dp (${JSON.stringify(size)})`);
  if (!idle.includes('More')) problems.push(`${label}: idle, a saved page's bar has no ⋮ for View on site (${idle.join(', ')})`);
  else {
    const rows = await moreRows();
    if (rows.at(-1) !== 'View on the website') problems.push(`${label}: View on site is not the ⋮'s last row (${rows.join(', ')})`);
    if (rows.includes('Preview')) problems.push(`${label}: idle, Preview is in the ⋮ as well as on the bar`);
    // View on site opens the page's address on the site in a new tab (window.open is recorded here: the site's own host is not served).
    await page.evaluate(() => {
      window.__opened = [];
      window.open = (...args) => (window.__opened.push(args), null);
    });
    await page.locator('.mo-editor-tools button[aria-label="More"]').click();
    await page.locator('[role=menu][aria-label="More"] [role^=menuitem]', { hasText: /^View on the website$/ }).click();
    const opened = await page.evaluate(() => window.__opened);
    if (opened.length !== 1 || !String(opened[0][0]).includes('/zz-check-page') || opened[0][1] !== '_blank')
      problems.push(`${label}: View on site did not open the page in a new tab (${JSON.stringify(opened)})`);
  }
  // In the text: on the bar while every text tool fits, else in the ⋮ (after Section settings, before View on site), as on a phone's bar.
  await page.click('.ProseMirror p');
  await page.keyboard.press('End');
  await page.waitForSelector('.mo-editor-tools button[aria-label="Bold"]', { timeout: 5000 }).catch(() => {});
  const inText = await names();
  const rows = await moreRows();
  if (!inText.includes('Preview') && !rows.includes('Preview'))
    problems.push(`${label}: in the text Preview is neither on the bar nor in the ⋮ (${inText.join(', ')} | ${rows.join(', ')})`);
  if (inText.includes('Preview') && inText.includes('More') && rows.some((r) => /^(Link|Color|Align |Text style)/.test(r)))
    problems.push(`${label}: in the text Preview is on the bar while text tools are in the ⋮ (${inText.join(', ')} | ${rows.join(', ')})`);
  if (phone && !rows.includes('Preview')) problems.push(`${label}: in the text Preview is not in the ⋮ (${rows.join(', ')})`);
  if (rows.includes('Section settings') && rows.includes('Preview') && rows.indexOf('Preview') < rows.indexOf('Section settings'))
    problems.push(`${label}: Preview comes before Section settings in the ⋮ (${rows.join(', ')})`);
  if (rows.at(-1) !== 'View on the website')
    problems.push(`${label}: in the text View on site is not the ⋮'s last row (${rows.join(', ')})`);
  // Ctrl+S: the browser's own save is never asked (the key's default is prevented), and the autosave goes out at once (not after 1.9 s).
  await page.click('.ProseMirror p');
  await page.keyboard.press('End');
  await page.evaluate(() => {
    window.__saveKey = null;
    addEventListener('keydown', (e) => e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey) && (window.__saveKey = e.defaultPrevented));
  });
  await page.keyboard.type(' saved now');
  const before = puts.length;
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(700);
  if ((await page.evaluate(() => window.__saveKey)) !== true)
    problems.push(`${label}: Ctrl+S is not taken (the browser would ask to save)`);
  if (puts.length === before) problems.push(`${label}: Ctrl+S did not send the autosave at once`);
  else if (!String(puts.at(-1)?.text ?? '').includes('saved now'))
    problems.push(`${label}: Ctrl+S sent an autosave without the change (${JSON.stringify(puts.at(-1)).slice(0, 200)})`);
  await page.close();
}

/** `Discard` in the page form's bar (375, 768, 1280): at the start of the bar before Save and Publish (a text button), disabled with nothing to discard, enabled after an edit; it asks first (no control focused, Cancel keeps everything), and the confirm goes back to the published version: the saved draft is removed in a commit, undo starts again, the message shows, and the buttons are as with no changes. All three buttons fit in one row. */
async function checkDiscardInBar(width) {
  const phone = width < 600;
  const label = `${width}px Discard in the bar`;
  const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  // Made for this unit only: a draft left in the site would show in the start screen's drafts card of the other checks.
  virtualFile('src/content/pages/zz-discard-plain.md', `---\ntitle: "Discard plain"\n---\n\n# Discard plain\n\nPublished text.\n`);
  virtualFile('src/content/pages/zz-discard-waiting.md', `---\ntitle: "Discard waiting"\n---\n\n# Discard waiting\n\nPublished text.\n`);
  virtualFile(
    'src/drafts/pages/zz-discard-waiting.md',
    `---\ntitle: "Discard waiting"\n---\n\n# Discard waiting\n\nPublished text. waiting text\n`,
  );
  await openEditor(page, site);
  const commits = [];
  await page.route('**/api/github/commit', (r) => {
    commits.push(JSON.parse(r.request().postData() || '{}'));
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'head', blobs: {} }) });
  });
  await page.route('**/api/autosave**', (r) =>
    r.request().method() === 'GET' ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ contentType: 'application/json', body: '{}' }),
  );
  const bar = page.locator('.mo-editor-save-bar');
  const button = (name) => bar.getByRole('button', { name, exact: true });
  const tap = (loc) => (phone ? loc.tap() : loc.click());
  const text = () => page.locator('.ProseMirror').first().innerText();
  const rows = async () =>
    bar.evaluate((b) =>
      [...b.querySelectorAll('button')]
        .filter((x) => x.getClientRects().length)
        .map((x) => {
          const r = x.getBoundingClientRect();
          return { name: x.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height, right: r.right };
        }),
    );
  const dialog = page.locator('dialog[open]');

  for (const [name, path, draft] of [
    ['a page with a saved draft', 'src/content/pages/zz-discard-waiting.md', true],
    ['a page with no draft', 'src/content/pages/zz-discard-plain.md', false],
  ]) {
    const at = `${label}, ${name}`;
    commits.length = 0;
    await page.goto(`${site}/editor/#${path}`);
    await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
    // Published with no changes and no draft: no bar. With a draft: Discard enabled before any edit.
    if (!draft) {
      if (await bar.count()) problems.push(`${at}: a published page with no changes has a bar`);
      await page.click('.ProseMirror p');
      await page.keyboard.press('End');
      await page.keyboard.type(' typed here');
    }
    await bar.waitFor({ timeout: 10_000 });
    const names = (await rows()).map((b) => b.name).filter((n) => n !== 'Preview');
    const want = draft ? ['Discard', 'Publish'] : ['Discard', 'Save', 'Publish'];
    if (names.join() !== want.join()) problems.push(`${at}: the bar has ${names.join(', ')}, not ${want.join(', ')}`);
    const discard = button('Discard');
    if (await discard.isDisabled()) problems.push(`${at}: Discard is disabled though there is something to discard`);
    // One row, nothing clipped, 48 dp targets.
    const geometry = await rows();
    if (geometry.some((b) => Math.abs(b.y - geometry[0].y) > 1)) problems.push(`${at}: the buttons wrap (${JSON.stringify(geometry)})`);
    if (geometry.some((b) => b.x < 0 || b.right > width + 0.5)) problems.push(`${at}: a button is clipped (${JSON.stringify(geometry)})`);
    // As high as the other buttons of the bar (the editor's density gives every button 40 dp; a bigger one would be a variant of its own).
    const d = geometry.find((b) => b.name === 'Discard');
    const publish = geometry.find((b) => b.name === 'Publish');
    if (d && publish && Math.abs(d.h - publish.h) > 0.5) problems.push(`${at}: Discard is ${d.h} dp high, Publish ${publish.h}`);
    const order = geometry.map((b) => b.name).filter((n) => n !== 'Preview');
    if (order.join() !== want.join()) problems.push(`${at}: the buttons run ${order.join(', ')}`);

    // Cancel keeps everything, and no control has the focus when the dialog opens.
    await tap(discard);
    await dialog.waitFor({ timeout: 5000 });
    if (!(await dialog.innerText()).includes('goes back to its published version'))
      problems.push(`${at}: the question says "${await dialog.innerText()}"`);
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    if (focused === 'BUTTON' || focused === 'INPUT') problems.push(`${at}: ${focused} has the focus when the question opens`);
    await tap(dialog.getByRole('button', { name: 'Cancel', exact: true }));
    await dialog.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    if (commits.length) problems.push(`${at}: Cancel committed`);
    if (!draft && !(await text()).includes('typed here')) problems.push(`${at}: Cancel lost the edit`);

    // Discard: the published text, the draft removed, a message, and the buttons as with no changes.
    await tap(discard);
    await dialog.waitFor({ timeout: 5000 });
    await tap(dialog.getByRole('button', { name: 'Discard', exact: true }));
    await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 5000 });
    await page
      .locator('.mo-snackbar__stack .mo-snackbar', { hasText: 'discarded' })
      .first()
      .waitFor({ timeout: 10_000 })
      .catch(() => {});
    if (!(await page.locator('.mo-snackbar__stack .mo-snackbar', { hasText: 'discarded' }).count()))
      problems.push(`${at}: no message that the changes are discarded`);
    const now = await text();
    if (/typed here|waiting text/.test(now)) problems.push(`${at}: the page is not its published version (${now})`);
    if (!now.includes('Published text')) problems.push(`${at}: the published text is missing (${now})`);
    if (draft) {
      const removed = commits.flatMap((c) => c.changes ?? []).filter((x) => x.path === 'src/drafts/pages/zz-discard-waiting.md');
      if (commits.length !== 1 || !removed.length || !removed.every((x) => x.delete || x.deleted || x.content == null))
        problems.push(`${at}: Discard did not remove the draft in one commit (${JSON.stringify(commits)})`);
    } else if (commits.length) problems.push(`${at}: Discard of unsaved edits committed`);
    // Undo starts again: Ctrl+Z does not bring the typed text back.
    await page.click('.ProseMirror p');
    await page.keyboard.press('Control+z');
    if (/typed here|waiting text/.test(await text())) problems.push(`${at}: undo brought the discarded text back`);
    await page.waitForTimeout(300);
    if (await bar.count()) problems.push(`${at}: the bar is still there after Discard`);
  }
  for (const f of ['zz-discard-plain', 'zz-discard-waiting']) removeVirtualFile(`src/content/pages/${f}.md`);
  removeVirtualFile('src/drafts/pages/zz-discard-waiting.md');
  await page.close();
}

/** Ctrl+S where the draft cannot save itself (R2 caching off: the Worker answers 409 off) runs what Save does: the page is committed. */
async function checkSaveKeyNoAutosave() {
  const label = '1280px Ctrl+S without autosave';
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const commits = [];
  await page.route('**/api/github/commit', (r) => {
    commits.push(JSON.parse(r.request().postData() || '{}'));
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'head', blobs: {} }) });
  });
  await page.route('**/api/autosave**', (r) =>
    r.request().method() === 'GET'
      ? r.fulfill({ status: 404, body: '' })
      : r.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'off' }) }),
  );
  await page.goto(`${site}/editor/#src/content/pages/zz-check-page.md`);
  await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
  await page.click('.ProseMirror p');
  await page.keyboard.press('End');
  await page.keyboard.type(' kept by the key');
  await page.keyboard.press('Control+s');
  for (let i = 0; i < 40 && !commits.length; i++) await page.waitForTimeout(200);
  const sent = commits.flatMap((c) => (c.changes ?? []).map((x) => Buffer.from(x.content ?? '', 'base64').toString('utf8')));
  if (!sent.some((text) => text.includes('kept by the key')))
    problems.push(`${label}: Ctrl+S did not save the page (${commits.length} commits)`);
  await page.close();
}

/** A Divider behaves like a block: the bar button puts it in, a tap selects it (its card, named Divider, pressed, with Remove, Add below and Add above on the bar and no Settings or Link), the arrow keys go onto it and off it, and Backspace removes it. */
async function checkDividerBlock(width) {
  const label = `${width}px Divider as a block`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Before');
  await page.keyboard.press('Enter');
  await page.keyboard.type('After');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('End');
  const bar = () => page.evaluate(() => [...document.querySelectorAll('.mo-editor-tools button')].map((b) => b.getAttribute('aria-label')));
  const state = () =>
    page.evaluate(() => {
      const card = document.querySelector('.mo-editor-divider .mo-site-block-card');
      return {
        cards: document.querySelectorAll('.mo-editor-divider').length,
        pressed: card?.getAttribute('aria-pressed'),
        name: card?.getAttribute('aria-label'),
        focus: document.activeElement === card,
      };
    });
  const tool = async (name) => {
    if (!(await bar()).includes(name)) {
      await page.click('.mo-editor-tools [aria-label="More"]');
      await page.click(`[role=menu] [role^=menuitem]:has-text("${name}")`);
    } else await page.click(`.mo-editor-tools [aria-label="${name}"]`);
  };
  await tool('Divider');
  let got = await state();
  if (got.cards !== 1 || got.name !== 'Divider')
    problems.push(`${label}: the Divider button did not put in one Divider block (${JSON.stringify(got)})`);
  await page.click('.mo-editor-divider .mo-site-block-card');
  got = await state();
  // The bar slides from the text tools to the block's: read it once the old tools have left.
  await page.waitForTimeout(600);
  const names = await bar();
  if (got.pressed !== 'true' || !got.focus) problems.push(`${label}: a tap did not select the Divider (${JSON.stringify(got)})`);
  for (const want of ['Remove', 'Add below', 'Add above'])
    if (!names.includes(want)) problems.push(`${label}: no ${want} on the bar while the Divider is selected (${names.join(', ')})`);
  for (const not of ['Settings', 'Edit', 'Link'])
    if (names.includes(not)) problems.push(`${label}: ${not} on the bar for a Divider, which has none`);
  await page.keyboard.press('ArrowDown');
  got = await state();
  if (got.pressed === 'true') problems.push(`${label}: ArrowDown did not leave the Divider for the text`);
  await page.keyboard.press('ArrowUp');
  got = await state();
  if (got.pressed !== 'true' || !got.focus)
    problems.push(`${label}: ArrowUp from the text below did not select the Divider (${JSON.stringify(got)})`);
  await page.keyboard.press('Backspace');
  got = await state();
  if (got.cards !== 0) problems.push(`${label}: Backspace did not remove the selected Divider`);
  await page.close();
}

/** The helping-lines button (the grid on/off icons): it hides and shows the resting dotted lines of sections and blocks, keeps the focus, hover and selection lines, names its action (the name changes with the state) and keeps the choice for the viewer. */
async function checkHelpingLines(width) {
  const label = `${width}px helping lines`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => {
    try {
      localStorage.removeItem('mo-editor-guides');
    } catch {}
    location.hash = '#new/pages';
  });
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  for (const line of ['Intro', '## Alpha', 'Alpha text', '## Beta', 'Beta text']) {
    await page.keyboard.type(line);
    if (line !== 'Beta text') await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(400);
  const bar = () => page.evaluate(() => [...document.querySelectorAll('.mo-editor-tools button')].map((b) => b.getAttribute('aria-label')));
  const lines = () =>
    page.evaluate(() => {
      const starts = [...document.querySelectorAll('.ProseMirror > [data-section-part="start"]')];
      const resting = starts.find((e) => !e.hasAttribute('data-section-focus') && !e.hasAttribute('data-section-focus-below'));
      const focused = starts.find((e) => e.hasAttribute('data-section-focus'));
      const colour = (e) => (e ? getComputedStyle(e, '::before').borderBlockStartColor : null);
      return {
        resting: colour(resting),
        focused: colour(focused),
        attr: document.querySelector('.mo-editor-text-box')?.getAttribute('data-guides'),
      };
    });
  const clear = 'rgba(0, 0, 0, 0)';
  const press = async (name) => {
    if ((await bar()).includes(name)) await page.click(`.mo-editor-tools [aria-label="${name}"]`);
    else {
      await page.click('.mo-editor-tools [aria-label="More"]');
      await page.click(`[role=menu] [role^=menuitem]:has-text("${name}")`);
    }
  };
  const names = await bar();
  const at = names.indexOf('Hide helping lines');
  if (width >= 1000 && !(at >= 0 && at < names.indexOf('Undo')))
    problems.push(`${label}: Hide helping lines is not on the bar before Undo (${names.join(', ')})`);
  if (width < 600 && at < 0) {
    await page.click('.mo-editor-tools [aria-label="More"]');
    if (!(await page.locator('[role=menu] [role^=menuitem]:has-text("Hide helping lines")').count()))
      problems.push(`${label}: Hide helping lines is neither on the bar nor in the ⋮`);
    await page.keyboard.press('Escape');
  }
  let got = await lines();
  if (!got.resting || got.resting === clear)
    problems.push(`${label}: the resting section line is not drawn while the lines are shown (${got.resting})`);
  await press('Hide helping lines');
  await page.waitForTimeout(300);
  got = await lines();
  if (got.resting !== clear) problems.push(`${label}: the resting section line is still drawn after Hide helping lines (${got.resting})`);
  if (got.attr !== 'off') problems.push(`${label}: the text box does not say the lines are off (${got.attr})`);
  await page.click('.ProseMirror');
  await page.keyboard.press('Control+End');
  await page.waitForTimeout(300);
  got = await lines();
  if (!got.focused || got.focused === clear)
    problems.push(`${label}: the focused section's line is gone with the helping lines hidden (${got.focused})`);
  const stored = await page.evaluate(() => localStorage.getItem('mo-editor-guides'));
  if (stored !== 'off') problems.push(`${label}: the choice is not kept for the viewer (${stored})`);
  // The editor opened again (a second page of the same browser) starts with the lines hidden.
  const again = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  again.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(again, site);
  await again.evaluate(() => (location.hash = '#new/pages'));
  await again.waitForSelector('.ProseMirror');
  await again.waitForTimeout(300);
  const reopened = await again.evaluate(() => document.querySelector('.mo-editor-text-box')?.getAttribute('data-guides'));
  if (reopened !== 'off') problems.push(`${label}: the lines come back after the editor is opened again (${reopened})`);
  await again.close();
  await page.click('.ProseMirror');
  if (!(await bar()).includes('Show helping lines') && width >= 1000)
    problems.push(`${label}: the button is not named Show helping lines while the lines are hidden`);
  // A Divider block's dotted frame follows the same switch: gone at rest, back on hover.
  await page.keyboard.type('Gamma');
  await press('Divider');
  const frame = () =>
    page.evaluate(() => {
      const card = document.querySelector('.mo-editor-divider .mo-site-block-card');
      return card ? getComputedStyle(card).borderBlockStartColor : null;
    });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  if ((await frame()) !== clear)
    problems.push(`${label}: a Divider block keeps its resting frame with the lines hidden (${await frame()})`);
  await page.hover('.mo-editor-divider .mo-site-block-card');
  await page.waitForTimeout(400);
  if (!(await frame()) || (await frame()) === clear)
    problems.push(`${label}: a hovered Divider block shows no frame with the lines hidden`);
  await page.mouse.move(0, 0);
  await press('Show helping lines');
  await page.waitForTimeout(400);
  if ((await frame()) === clear) problems.push(`${label}: a Divider block has no frame after Show helping lines`);
  if ((await page.evaluate(() => localStorage.getItem('mo-editor-guides'))) !== 'on')
    problems.push(`${label}: Show helping lines did not keep the choice`);
  await page.close();
}

/** Every Preview action of a page (the text bar's button, its row in the `⋮`, the Save bar's button) draws one icon, the monitor with a phone (Material Symbols' `devices`, Phosphor's `devices`, Lucide's `monitor-smartphone`; owner, 16 Nov 2026: "Use the monitor-cellphone icon for preview everywhere"). The Pack in use's file is the reference (Material Symbols unless the site or its theme chose another). */
async function checkPreviewIcon(width) {
  const label = `${width}px Preview icon`;
  const touch = width < 600;
  // The icon of the pack in use (Material Symbols unless the site or its theme chose another): its own file is the reference.
  const reference = previewReference(PACK_FOLDER, ROOT);
  if (!reference) return problems.push(`${label}: ${PACK_FOLDER}/devices.svg has no path`);
  const page = await browser.newPage({ viewport: { width, height: 812 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.waitForSelector('.mo-editor-tools button[aria-label="Undo"]', { timeout: 30_000 });
  const drawn = (scope) =>
    page.evaluate(
      ([scope]) =>
        [...document.querySelectorAll(scope)]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .map((e) => e.querySelector('svg')?.innerHTML ?? ''),
      [scope],
    );
  const found = await drawn('.mo-editor-tools button[aria-label="Preview"]');
  const saveBar = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-editor-save-bar button')]
      .filter((b) => b.textContent?.trim() === 'Preview' && b.getBoundingClientRect().width > 0)
      .map((b) => b.querySelector('svg')?.innerHTML ?? ''),
  );
  found.push(...saveBar);
  await page.locator('.mo-editor-tools button[aria-label="More"]').first().click();
  found.push(
    ...(await page.evaluate(() =>
      [...document.querySelectorAll('[role=menu][aria-label="More"] [role^=menuitem]')]
        .filter((e) => e.textContent?.trim() === 'Preview')
        .map((e) => e.querySelector('svg')?.innerHTML ?? ''),
    )),
  );
  if (!found.length) problems.push(`${label}: no Preview action is shown`);
  for (const svg of found) if (!svg.includes(reference)) problems.push(`${label}: a Preview action draws another icon than devices`);
  await page.close();
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
    await page.waitForSelector('.mo-editor-tools');
    const read = () =>
      page.evaluate(() => {
        const bar = document.querySelector('.mo-editor-tools');
        const cs = getComputedStyle(bar);
        const side = (n) => `${cs[`border${n}Style`]} ${parseFloat(cs[`border${n}Width`])}px ${cs[`border${n}Color`]}`;
        return {
          top: [cs.borderTopStyle, parseFloat(cs.borderTopWidth), cs.borderTopColor],
          left: parseFloat(cs.borderLeftWidth),
          right: parseFloat(cs.borderRightWidth),
          radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius],
          line: cs.getPropertyValue('--mo-comp-divider-thickness').trim(),
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
      const bar = document.querySelector('.mo-editor-tools');
      if (bar.getBoundingClientRect().top < 0) window.scrollBy(0, bar.getBoundingClientRect().top - 1);
    });
    await page.waitForTimeout(200);
    const corner = await page.evaluate(() => {
      const bar = document.querySelector('.mo-editor-tools').getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(document.querySelector('.mo-editor-tools')).borderTopLeftRadius);
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

export function register(unit) {
  for (const width of [375, 1280]) unit(`Preview icon ${width}`, () => checkPreviewIcon(width));

  for (const width of [360, 375, 390, 414]) unit(`checkTextBar ${width}`, () => checkTextBar(width));
  unit('checkTextBarWide', () => checkTextBarWide());
  unit('checkAnchoredParts 375 touch', () => checkAnchoredParts(375, 740, true));
  unit('checkAnchoredParts 768', () => checkAnchoredParts(768, 900, false));
  unit('checkAnchoredParts 1280', () => checkAnchoredParts(1280, 900, false));
  for (const width of [375, 1280]) unit(`checkPreviewInBar ${width}`, () => checkPreviewInBar(width));
  unit('checkSaveKeyNoAutosave', () => checkSaveKeyNoAutosave());
  for (const width of [375, 768, 1280]) unit(`checkDiscardInBar ${width}`, () => checkDiscardInBar(width));
  for (const width of [320, 360, 375, 390, 414, 600, 840, 1280]) unit(`checkTextBarFit ${width}`, () => checkTextBarFit(width));
  for (const [width, reduced] of [
    [375, false],
    [1280, false],
    [375, true],
  ])
    unit(`checkBarSlide ${width}${reduced ? ' reduced' : ''}`, () => checkBarSlide(width, reduced));
  unit('checkToolbarBox', () => checkToolbarBox());
  for (const width of [390, 1280]) unit(`checkDividerBlock ${width}`, () => checkDividerBlock(width));
  for (const width of [390, 1280]) unit(`checkHelpingLines ${width}`, () => checkHelpingLines(width));
}
