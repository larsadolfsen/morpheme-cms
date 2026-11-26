import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { clickPreview, openEditor, virtualFile } from '../built-site.mjs';
import { BUILT_PAGE, LIST_PAGE, ROOT, block, browser, has, problems, shots, site } from './support/context.mjs';
import {
  animationsSettled,
  barTools,
  liveLists,
  onTestPage,
  openStyleMenu,
  pressInsert,
  pressMore,
  pressTool,
  ratioOf,
} from './support/shared.mjs';

/** The rows of a List and List - Expand are Material's: no list marker (list-style, ::marker), in the editor and in the Preview (where the page's text style, prose, must not reach them) and on the site. */
async function checkListMarkers(width) {
  const path = BUILT_PAGE;
  const markers = () =>
    [...document.querySelectorAll('ul.mo-list')].flatMap((ul) =>
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
  await openEditor(page, site, { [path]: LIST_PAGE });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('ul.mo-list', { timeout: 30_000 });
  const inEditor = await page.evaluate(markers);
  if (inEditor.length) problems.push(`${width}px editor: a List row has a list marker (${[...new Set(inEditor)].join('; ')})`);
  await clickPreview(page);
  await page.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('ul.mo-block-list', { timeout: 30_000 });
  const inPreview = await frame.evaluate(markers);
  if (inPreview.length) problems.push(`${width}px Preview: a List row has a list marker (${[...new Set(inPreview)].join('; ')})`);
  await page.close();
}

/** One left edge for a List (375, 768 and 1280 px), on the site (the demo's Blocks page, /blocks/lists/) and typed in place in the editor. A List in the plain design
 * (its rows on the page, no drawn container) starts its rows' own content, the leading icon or else the text, on the page's text edge, and on a compact screen (below 600 px) is full
 * width: the row's layer (hover, pressed, focus ring, selected) is 16 dp wider than the text column on each side (owner, 16 Nov 2026: "Full width on compact screens"; M3 Lists
 * "edge-to-edge in compact windows", Specs "leading space 16dp"); from medium the layer is on the text column. The page does not scroll sideways. A list in the segmented design (the theme's segmented list) has its container on the text edge and its icon one 16 dp padding in. Real
 * geometry, a half pixel of rounding allowed. */
async function checkListLeftEdge(width) {
  const label = `${width}px list left edge`;
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const measure = (rootSelector) => {
    const root = document.querySelector(rootSelector);
    const text = root.querySelector('p').getBoundingClientRect().left;
    const out = { text, wide: document.documentElement.scrollWidth - window.innerWidth, view: window.innerWidth, rows: [], cards: [] };
    // The card based blocks keep the normal side margin on a compact screen: only the Default list is edge to edge.
    for (const el of root.querySelectorAll('.mo-block-cards__card, .mo-block-pricecards__plan, .mo-block-testimonials__testimonial')) {
      const box = el.getBoundingClientRect();
      // The cards of a carousel run off the window on purpose.
      if (box.left >= window.innerWidth - 1 || el.closest('.mo-carousel')) continue;
      out.cards.push({ name: el.className.split(' ')[0], left: box.left, right: box.right });
    }
    for (const ul of root.querySelectorAll('ul.mo-block-list')) {
      const row = ul.querySelector('.mo-list__item-container');
      if (!row) continue;
      const lead = row.querySelector('.mo-list__item-leading-icon, .mo-list__item-leading') ?? row.querySelector('.mo-list__item-content');
      const filled = ul.classList.contains('mo-list__segmented');
      out.rows.push({
        kind: filled ? 'segmented' : 'plain',
        container: (filled ? ul.querySelector('li') : row).getBoundingClientRect().left,
        right: (filled ? ul.querySelector('li') : row).getBoundingClientRect().right,
        content: lead.getBoundingClientRect().left,
        pad: parseFloat(getComputedStyle(row).paddingLeft),
      });
    }
    return out;
  };
  const verify = (where, got) => {
    if (!got.rows.some((r) => r.kind === 'plain')) problems.push(`${label}: ${where} has no List without a container to measure`);
    if (got.wide > 0.5) problems.push(`${label}: ${where} the page scrolls sideways by ${got.wide}px`);
    for (const c of got.cards)
      if (c.left < got.text - 0.5 || c.right > got.view - (got.text - 0.5))
        problems.push(`${label}: ${where} a ${c.name} reaches ${c.left} to ${c.right}, outside the side margin of ${got.text}`);
    // On a compact screen the Default list's rows go from edge to edge of the window; every card based list keeps the margin.
    if (width < 600 && where === 'on the site')
      for (const r of got.rows)
        if (r.kind === 'plain' && (Math.abs(r.container) > 0.5 || Math.abs(r.right - got.view) > 0.5))
          problems.push(
            `${label}: ${where} a Default list's row is from ${r.container} to ${r.right}, not the whole window of ${got.view}px`,
          );
    for (const r of got.rows) {
      // Plain design: the row's layer starts 16 dp before the text's edge at every width (M3 Lists › Specs, 21 Nov 2026); Segmented design: its container is on the text's edge.
      const want = r.kind === 'plain' ? got.text - 16 : got.text;
      if (Math.abs(r.container - want) > 0.5)
        problems.push(
          `${label}: ${where} a ${r.kind} list's ${r.kind === 'plain' ? 'row layer' : 'container'} starts at ${r.container}, not at ${want} (the text's edge is ${got.text})`,
        );
      if (r.kind === 'plain' && Math.abs(r.content - got.text) > 0.5)
        problems.push(
          `${label}: ${where} a List's row content starts at ${r.content}, ${r.content - got.text} px in from the text's edge ${got.text}`,
        );
      if (r.kind === 'segmented' && Math.abs(r.content - got.text - 16) > 0.5)
        problems.push(
          `${label}: ${where} a Segmented list's row content starts ${r.content - got.text} px in from its container, not the 16 dp padding`,
        );
    }
  };
  if (await onTestPage(page, label)) {
    await page.waitForSelector('main .mo-prose ul.mo-block-list');
    await animationsSettled(page);
    verify('on the site', await page.evaluate(measure, 'main .mo-prose'));
    // Edge to edge, the layer of a Default list's row pointed at has M3's hover shape, 12 dp, like at every width (the 16 Nov 2026 rule "No border radius when full width" went on 21 Nov 2026).
    if (width < 600) {
      const row = page.locator('main .mo-prose ul.mo-block-list:not(.mo-list__segmented) a.mo-list__item-container').first();
      await row.hover();
      await page.waitForTimeout(400);
      const radius = await row.evaluate(
        (el) => getComputedStyle(el).borderTopLeftRadius + ' ' + getComputedStyle(el).borderBottomRightRadius,
      );
      if (radius !== '12px 12px')
        problems.push(
          `${label}: a Default list's row pointed at has the corners ${radius}, not M3's hover shape of 12px, when it is full width`,
        );
    }
  }
  await openEditor(page, site, { [BUILT_PAGE]: LIST_PAGE });
  await page.goto(`${site}/editor/#${BUILT_PAGE}`);
  await page.waitForSelector('.ProseMirror ul.mo-block-list', { timeout: 30_000 });
  await animationsSettled(page);
  verify('in the editor', await page.evaluate(measure, '.ProseMirror'));
  await page.close();
}

/** The setting Columns of List, List and List - Expand (standard/columns.ts): on (the default, and what a block from before has) the rows sit in as many columns as fit the list's
 * width, at least 344px each, never more than three; off (`data-columns="one"`) one column at most 720px wide. In the editor and in the Preview, at 375, 768 and 1280. */
async function checkListColumns(width) {
  const label = `${width}px list columns`;
  const rows = [
    { title: 'One', text: 'First' },
    { title: 'Two', text: 'Second' },
    { title: 'Three', text: 'Third' },
  ];
  const src = [
    '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n',
    block('list', { items: rows }),
    block('list', { columns: false, items: rows }),
    block('expand', { items: rows }),
    block('expand', { columns: false, items: rows }),
    block('expand', { design: 'segmented', faq: true, items: rows }),
    block('expand', { design: 'segmented', faq: true, columns: false, items: rows }),
  ].join('\n\n');
  const measure = () =>
    [...document.querySelectorAll('ul.mo-block-list, ul.mo-block-accordion')].map((ul) => {
      const w = Math.round(ul.getBoundingClientRect().width);
      return {
        name: ul.className.split(' ').find((c) => c.startsWith('block-')),
        one: ul.dataset.columns === 'one',
        width: w,
        columns: getComputedStyle(ul).gridTemplateColumns.split(' ').length,
      };
    });
  const verify = (where, found) => {
    if (found.filter((b) => b.one).length !== 3 || found.filter((b) => !b.one).length !== 3)
      return problems.push(
        `${label} ${where}: expected 3 lists with Columns off and 3 with it on, found ${JSON.stringify(found.map((b) => b.one))}`,
      );
    for (const b of found) {
      if (b.one) {
        if (b.columns !== 1 || b.width > 721)
          problems.push(
            `${label} ${where}: ${b.name} with Columns off has ${b.columns} columns and is ${b.width}px wide (one column, at most 720px)`,
          );
      } else {
        const wanted = b.width >= 1080 ? 3 : b.width >= 720 ? 2 : 1;
        if (b.columns !== wanted)
          problems.push(`${label} ${where}: ${b.name} with Columns on has ${b.columns} columns at ${b.width}px, not ${wanted}`);
      }
    }
  };
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, { [BUILT_PAGE]: src });
  await page.goto(`${site}/editor/#${BUILT_PAGE}`);
  await page.waitForSelector('ul.mo-block-list', { timeout: 30_000 });
  verify('in the editor', await page.evaluate(measure));
  await clickPreview(page);
  await page.waitForFunction(() => document.querySelector('[data-preview-page] iframe'), null, { timeout: 30_000 });
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForSelector('ul.mo-block-list', { timeout: 30_000 });
  verify('in the Preview', await frame.evaluate(measure));
  await page.close();
}

/** The hover action row is not drawn over a control of the block: a mouse over the first row of a List - Expand or Questions and answers shows no row over the row's chevron, at 768
 * and 1280 (the block shows its row once it is active). The drag handle, in the block's top left corner, shows only on the active block: it takes no pointer on a block that is only pointed at. */
async function checkChevronUnderHoverRow(width) {
  const label = `${width}px chevron under the hover row`;
  const src = [
    '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n',
    block('expand', {
      items: [
        { title: 'One', text: 'First' },
        { title: 'Two', text: 'Second' },
      ],
    }),
  ].join('\n\n');
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, { [BUILT_PAGE]: src });
  await page.goto(`${site}/editor/#${BUILT_PAGE}`);
  await page.waitForSelector('.mo-editor-inline-list-host div.mo-list__item-expand', { timeout: 30_000 });
  await page.locator('.ProseMirror > p').first().click();
  await page.waitForFunction(() => !document.querySelector('.mo-editor-inline-list-row-active'), null, { timeout: 8000 });
  const first = page.locator('.mo-editor-inline-list-host div.mo-list__item-expand').first();
  const icon = await first.locator('.mo-list__item-expand-icon').boundingBox();
  await page.mouse.move(icon.x + icon.width / 2, icon.y + icon.height / 2);
  await page.waitForTimeout(500);
  const over = await page.evaluate((i) => {
    const row = document.querySelector('.mo-site-block-row-hover .mo-site-block-row-inner')?.getBoundingClientRect();
    return !!row && row.left < i.x + i.width && row.right > i.x && row.top < i.y + i.height && row.bottom > i.y;
  }, icon);
  if (over) problems.push(`${label}: the hover row lies over the first row's chevron`);
  // The drag handle (in the block's top left corner) takes no pointer while a mouse only points at the block, and nothing of it lies over the chevron.
  const handle = await page.evaluate((i) => {
    const el = document.querySelector('.ProseMirror .mo-site-block > .mo-site-block-handle');
    const under = document.elementFromPoint(i.x + i.width / 2, i.y + i.height / 2);
    return { hits: el ? getComputedStyle(el).pointerEvents : 'none', covers: !!under?.closest('.mo-site-block-handle') };
  }, icon);
  if (handle.hits !== 'none')
    problems.push(`${label}: the drag handle takes the pointer while the block is only pointed at (${handle.hits})`);
  if (handle.covers) problems.push(`${label}: the drag handle lies over the first row's chevron`);
  // And a click on the chevron opens the row.
  await first.locator('.mo-list__item-expand-icon').click();
  await page
    .waitForFunction(() => document.querySelector('.mo-editor-inline-list-host div.mo-list__item-expand')?.hasAttribute('open'), null, {
      timeout: 4000,
    })
    .catch(() => {});
  if (!(await first.evaluate((d) => d.hasAttribute('open'))))
    problems.push(`${label}: a click on the first row's chevron does not open it`);
  await page.close();
}

/** Rows that fold out, typed in place (List - Expand, Questions and answers): the chevron opens and closes any row as on the site, Enter or Space on the focused
 * head does too, a tap on the head's own surface (not the title, not the chevron) folds nothing, and typing in the page's text does not collapse an open row.
 * What is folded is a view state: the page does not change (Undo stays off). */
async function checkChevronRows(width) {
  const label = `${width}px rows that fold`;
  const phone = width < 600;
  const src = [
    '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n',
    block('expand', {
      design: 'segmented',
      items: [
        { title: 'One', text: 'First' },
        { title: 'Two', text: 'Second' },
        { title: 'Three', text: 'Third' },
      ],
    }),
    block('expand', {
      design: 'segmented',
      faq: true,
      items: [
        { title: 'Why?', text: 'Because.' },
        { title: 'Who?', text: 'Me.' },
        { title: 'How?', text: 'Well.' },
      ],
    }),
  ].join('\n\n');
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, { [BUILT_PAGE]: src });
  await page.goto(`${site}/editor/#${BUILT_PAGE}`);
  await page.waitForSelector('.mo-editor-inline-list-host div.mo-list__item-expand', { timeout: 30_000 });
  const undoOff = () => page.locator('.mo-editor-tools button[aria-label="Undo"]').first().isDisabled();
  for (const [at, name] of [
    [0, 'List - Expand'],
    [1, 'Questions and answers'],
  ]) {
    // The cursor is out of every block: no row's settings panel narrows the page while a row is tapped.
    await page.locator('.ProseMirror > p').first().click();
    await page.waitForFunction(
      () => !document.querySelector('.mo-editor-side-sheet, dialog[open]') && !document.querySelector('.mo-editor-inline-list-row-active'),
      null,
      { timeout: 8000 },
    );
    const host = page.locator('.mo-editor-inline-list-host').nth(at);
    const row = host.locator('div.mo-list__item-expand').nth(1);
    const head = row.locator('.mo-list__item-expand-summary');
    const toggle = row.locator('.mo-list__item-expand-button');
    const state = () => toggle.getAttribute('aria-expanded');
    const shown = () =>
      page.waitForFunction(
        ([h, r]) => {
          const d = document.querySelectorAll('.mo-editor-inline-list-host')[h].querySelectorAll('div.mo-list__item-expand')[r];
          const a = d.querySelector('.mo-block-accordion__answer');
          return d.hasAttribute('open') && !!a && a.getBoundingClientRect().height > 0;
        },
        [at, 1],
        { timeout: 8000 },
      );
    const shut = () =>
      page.waitForFunction(
        ([h, r]) =>
          !document.querySelectorAll('.mo-editor-inline-list-host')[h].querySelectorAll('div.mo-list__item-expand')[r].hasAttribute('open'),
        [at, 1],
        { timeout: 8000 },
      );
    if ((await state()) !== 'false')
      problems.push(`${label} ${name}: a row that is not active has aria-expanded ${await state()}, not false`);
    const box = await head.boundingBox();
    if (box && box.height < 48) problems.push(`${label} ${name}: the row's head is ${box.height} px high, under 48`);
    // The chevron opens the row, a second tap closes it.
    await row.locator('.mo-list__item-expand-icon').click();
    await shown().catch(() => problems.push(`${label} ${name}: a tap on the chevron does not open the row and show its text`));
    if ((await state()) !== 'true') problems.push(`${label} ${name}: the open row has aria-expanded ${await state()}`);
    // The open row is round on all four corners, as large as the list's ends; its closed neighbours keep the small inner corners; the body text
    // starts where the title does (the connected button group's selected item, Material 3's Button groups and Lists specs).
    const corners = await page
      .waitForFunction(
        ([h]) => {
          const lis = [...document.querySelectorAll('.mo-editor-inline-list-host')[h].querySelectorAll('.mo-list__expand > li')];
          const r = (li) => {
            const c = getComputedStyle(li);
            return [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat);
          };
          const open = r(lis[1]);
          if (!open.every((x) => x >= 15.5)) return null;
          const d = lis[1].querySelector('.mo-list__item-expand');
          return {
            open,
            first: r(lis[0]),
            last: r(lis[2]),
            title: d.querySelector('.mo-list__item-expand-summary [data-field]').getBoundingClientRect().left,
            body: d.querySelector('.mo-block-accordion__answer').getBoundingClientRect().left,
          };
        },
        [at],
        { timeout: 8000 },
      )
      .then((x) => x.jsonValue())
      .catch(() => null);
    if (!corners) problems.push(`${label} ${name}: the open row is not round on all four corners`);
    else {
      if (corners.first[2] >= corners.open[0] || corners.first[3] >= corners.open[0])
        problems.push(
          `${label} ${name}: the closed row above the open one has ${corners.first} corners, not smaller than the open row's ${corners.open}`,
        );
      if (corners.last[0] >= corners.open[0] || corners.last[1] >= corners.open[0])
        problems.push(
          `${label} ${name}: the closed row below the open one has ${corners.last} corners, not smaller than the open row's ${corners.open}`,
        );
      if (Math.abs(corners.title - corners.body) > 1)
        problems.push(`${label} ${name}: the open row's text starts at ${corners.body}, its title at ${corners.title}`);
    }
    // The whole height of the head at the chevron is its target (not only the 24 px glyph).
    const icon = await row.locator('.mo-list__item-expand-icon').boundingBox();
    const top = await head.boundingBox();
    await page.mouse.click(icon.x + icon.width / 2, top.y + 3);
    await shut().catch(() => problems.push(`${label} ${name}: a second tap on the chevron does not close the row`));
    // Enter and Space on the focused head.
    await toggle.focus();
    await page.keyboard.press('Enter');
    await shown().catch(() => problems.push(`${label} ${name}: Enter on the focused row does not open it`));
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await shut().catch(() => problems.push(`${label} ${name}: Space on the focused row does not close it`));
    // A tap on the head's own surface, outside the title and the chevron, folds nothing.
    const edge = await head.boundingBox();
    await page.mouse.click(edge.x + 2, edge.y + edge.height / 2);
    await page.waitForTimeout(300);
    if ((await state()) !== 'false') problems.push(`${label} ${name}: a tap on the row's surface folds it`);
    // Typing in the page's text does not collapse an open row.
    await row.locator('.mo-list__item-expand-icon').click();
    await shown();
    await page.locator('.ProseMirror > p').first().click();
    await page.keyboard.type('abc');
    await page.waitForTimeout(400);
    if ((await state()) !== 'true') problems.push(`${label} ${name}: typing in the page's text collapsed the open row`);
    // A tap on the title opens a row the chevron closed, and types there.
    await row.locator('.mo-list__item-expand-icon').click();
    await shut();
    await row.locator('textarea').first().click();
    await shown().catch(() => problems.push(`${label} ${name}: a tap on the title of a closed row does not open it`));
    await row.locator('.mo-list__item-expand-icon').click();
    await shut();
  }
  // The page is the same: no step of the fold is an edit, so Undo is still off (the typing above is the only change; check on a fresh page below).
  const fresh = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  fresh.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(fresh, site, { [BUILT_PAGE]: src });
  await fresh.goto(`${site}/editor/#${BUILT_PAGE}`);
  await fresh.waitForSelector('.mo-editor-inline-list-host div.mo-list__item-expand', { timeout: 30_000 });
  const undoBefore = await fresh.locator('.mo-editor-tools button[aria-label="Undo"]').first().isDisabled();
  for (let h = 0; h < 2; h++) {
    const icon = fresh.locator('.mo-editor-inline-list-host').nth(h).locator('.mo-list__item-expand-icon').nth(1);
    await icon.click();
    await fresh.waitForFunction(
      (n) => document.querySelectorAll('.mo-editor-inline-list-host')[n].querySelectorAll('.mo-list__item-expand')[1].hasAttribute('open'),
      h,
    );
    await icon.click();
  }
  await fresh.waitForTimeout(300);
  if ((await fresh.locator('.mo-editor-tools button[aria-label="Undo"]').first().isDisabled()) !== undoBefore)
    problems.push(`${label}: folding a row is an edit of the page (Undo changed)`);
  await fresh.close();
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
        (c) =>
          c.tagName.toLowerCase() + (c.matches('.mo-site-block, [data-site-block]') || c.querySelector('.mo-site-block') ? ':block' : ''),
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
  // A list item is not a heading, so the Text style menu has no heading rows in a list (they are hidden, not disabled), and no Quote.
  await page.locator('.ProseMirror li > p').nth(0).click();
  await openStyleMenu(page);
  const offered = await page
    .locator('[role=menu] [role^=menuitem]:visible')
    .evaluateAll((rows) => rows.map((x) => x.textContent.trim()).filter((n) => /^(Main heading|Heading|Subheading|Quote)\b/.test(n ?? '')));
  if (offered.length) problems.push(`${label}: the Text style menu offers ${offered.join(', ')} in a list item`);
  await page.keyboard.press('Escape');
  // A text size picked in a list keeps the list: the text of the item gets the size (a span), and Body medium takes it away.
  await page.locator('.ProseMirror li > p').nth(0).click();
  const pick = async (name) => {
    const direct = page.locator(`.mo-editor-tools [aria-label="${name}"]:visible`);
    if (await direct.count()) await direct.first().click();
    else {
      await openStyleMenu(page);
      await page.locator('[role=menu] button, [role=menuitem], [role=menuitemradio]').filter({ hasText: name }).first().click();
    }
  };
  await pick('Body small');
  const sized = await page.locator('.ProseMirror ul li span.mo-type-body-small').count();
  if (sized !== 1 || (await tops()).join() !== 'ul')
    problems.push(`${label}: Body small in a list item gives ${sized} sized items and ${await tops()}, not 1 and ul`);
  await pick('Body medium');
  if (await page.locator('.ProseMirror ul li span.mo-type-body-small').count())
    problems.push(`${label}: Body medium in a list item leaves its size`);
  // A block inserted in the first item ends the list there, at the top level, and the rest follows it.
  await page.locator('.ProseMirror li > p').nth(0).click();
  await page.keyboard.press('End');
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Show the steps in order.' }).first().click();
  await page.waitForSelector('.ProseMirror .mo-site-block, .ProseMirror [data-site-block]', { timeout: 8000 }).catch(() => {});
  const shape = await page.evaluate(() =>
    [...document.querySelector('.ProseMirror').children].map((c) =>
      c.tagName === 'UL'
        ? `ul${c.querySelectorAll(':scope > li').length}`
        : c.className.includes('mo-site-block') || c.querySelector('.mo-site-block')
          ? 'block'
          : c.tagName.toLowerCase(),
    ),
  );
  const joined = shape.join();
  if (!/^ul1,block(,p)?,ul\d$/.test(joined))
    problems.push(`${label}: a block inserted in a list item is not at the top level of the page (${joined})`);
  if (await page.locator('.ProseMirror li .mo-site-block').count()) problems.push(`${label}: a block is drawn inside a list item`);
  await page.close();
}

async function checkLiveList(width, height, { name, hint, items }) {
  const label = `${width}px inline ${name}`;
  // The Image grid draws the images of Files with their tags: a site with no file records (the starter's) has none to draw.
  if (name === 'imagegrid' && !has('src/data/files'))
    return void console.log(`${label}: skipped, the site has no images with tags, which the demo has.`);
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
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  try {
    await page.waitForSelector(`.mo-site-block-inline ${items}`, { timeout: 8000 });
  } catch {
    problems.push(`${label}: the block was not drawn in place`);
    return page.close();
  }
  if (await page.locator('.mo-site-block-inline [data-field="heading"], .mo-site-block-inline [data-field="intro"]').count())
    problems.push(`${label}: the block has a heading or subheading field`);
  if (await page.locator('dialog[open]').count()) problems.push(`${label}: Insert opened a sheet`);
  if (!(await page.locator(`.mo-site-block-inline ${items}`).count())) problems.push(`${label}: the block shows none of the demo's items`);
  if (name === 'imagegrid') {
    // The filter's chips are drawn in the card and do nothing: a tap on one filters nothing.
    const chips = page.locator('.mo-site-block-inline [data-imagegrid-filter] [data-tag]');
    if (!(await chips.count()) || !(await chips.first().isVisible())) problems.push(`${label}: the filter's chips are not drawn`);
    else if ((await chips.first().evaluate((c) => getComputedStyle(c).pointerEvents)) !== 'none')
      problems.push(`${label}: a chip is not inert`);
  }
  // The gear opens the settings: they have no Heading and no Subheading (B8, a heading above a block is the text's), and still hold the rest.
  // On a phone the bar's gear; on a computer the block's own menu in the bar's ⋮.
  if (phone) await pressTool(page, 'Edit');
  else await pressMore(page, 'Edit');
  await page.waitForTimeout(500);
  const settings = await page.evaluate(() =>
    [
      ...document.querySelectorAll('dialog[open] :is(label, legend, [data-field-label]), [data-side-sheet-container] :is(label, legend)'),
    ].map((e) => e.textContent.trim()),
  );
  if (settings.some((x) => /^(heading|subheading)$/i.test(x)))
    problems.push(`${label}: the settings show Heading or Subheading (${settings.join(', ')})`);
  if (!settings.length) problems.push(`${label}: the settings show no field`);
  await page.screenshot({ path: join(shots, `live-list-settings-${name}-${width}.png`) });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  const drawn = await page.evaluate(
    (sel) => ({
      items: document.querySelectorAll(`.mo-site-block-inline ${sel}`).length,
    }),
    items,
  );
  if (!drawn.items) problems.push(`${label}: the items are gone after the cursor left`);
  await page.close();
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
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Show text and images in a list.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.keyboard.type('Typed row');
  await page.waitForTimeout(300);
  // The block's tools are on the one bar (44 x 44 dp buttons, never scrolling) or in its ⋮ menu (rows of 44 dp).
  const bar = async () => {
    const { bar: buttons, more, names } = await barTools(page);
    const box = await page.evaluate(() => {
      const el = document.querySelector('.mo-editor-tools');
      return { scrolls: el.scrollWidth > el.clientWidth + 2 };
    });
    return {
      labels: names,
      inside: !box.scrolls,
      small: [...buttons, ...more].some((b) => b.height < 43.4 || (b.width !== undefined && b.width < 43.4)),
    };
  };
  const typed = await bar();
  if (!typed.labels.includes('Fill from a list')) problems.push(`${label}: the toolbar has no dynamic icon`);
  if (!typed.inside) problems.push(`${label}: the toolbar reaches outside the screen`);
  if (typed.small) problems.push(`${label}: a toolbar button is under 44 dp`);
  await pressTool(page, 'Fill from a list');
  const panel = page.locator('dialog[open], .mo-editor-side-sheet').filter({ hasText: 'Rows from' }).first();
  await panel.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the dynamic settings did not open`));
  await panel.locator('button.mo-text-field__input').first().click();
  await page.getByText('Testimonials', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(500);
  // A phone's bottom sheet covers the block: closed, the block shows its state (the side panel on a computer stays open).
  if (phone) await page.locator('dialog[open] [aria-label="Close"]').first().click();
  await page.waitForTimeout(400);
  const text = await page.locator('.mo-site-block-preview').first().textContent();
  if (!/From Testimonials · \d+ items?/.test(text ?? ''))
    problems.push(`${label}: no state line "From Testimonials · n items" (${text?.slice(0, 80)})`);
  if (!(await page.getByRole('button', { name: 'Edit list' }).count())) problems.push(`${label}: no "Edit list" button`);
  if (!(await page.getByRole('button', { name: 'Undo', exact: true }).last().count()))
    problems.push(`${label}: no Undo after the typed rows were set aside`);
  const dynamic = await bar();
  if (dynamic.labels.some((l) => /^Add (above|below)$/.test(l ?? ''))) problems.push(`${label}: a dynamic list has Add above or Add below`);
  if (!dynamic.inside) problems.push(`${label}: the dynamic toolbar reaches outside the screen`);
  await page.locator('.mo-site-block-preview button', { hasText: 'Undo' }).click();
  await page.waitForTimeout(400);
  if (!(await page.locator('.mo-editor-inline-list-row[data-row]').count()))
    problems.push(`${label}: Undo did not bring the typed rows back`);
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
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Show text and images in a list.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await pressTool(page, 'Fill from a list');
  const panel = page.locator('dialog[open], .mo-editor-side-sheet').filter({ hasText: 'Rows from' }).first();
  await panel.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the dynamic settings did not open`));
  await panel.locator('button.mo-text-field__input').first().click();
  await page.getByText('Highlights', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(500);
  if (phone) await page.locator('dialog[open] [aria-label="Close"]').first().click();
  await page.waitForTimeout(400);
  const block = page.locator('.mo-site-block-preview').first();
  const lines = () => block.locator('.mo-list__item-supporting').allTextContents();
  const buttons = () => block.locator('.mo-editor-inline-list-parts button').allTextContents();
  if ((await block.locator('.mo-list__item-headline').count()) !== 3)
    problems.push(`${label}: the block does not show the 3 items of the list`);
  const before = await buttons();
  if (before.join('|') !== 'Label text: Title|Supporting text: Body text|Icon: Icon|Link: Link')
    problems.push(`${label}: the part buttons are "${before.join('|')}", not the list's own fields`);
  await block.locator('.mo-editor-inline-list-parts button', { hasText: 'Supporting text' }).click();
  const choice = page.locator('dialog[open], .mo-editor-side-sheet').filter({ hasText: 'Field shown' }).first();
  await choice.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the choice of fields did not open`));
  await choice.locator('button.mo-text-field__input').first().click();
  await page.getByText('Title', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(500);
  if (phone && (await page.locator('dialog[open]').count())) await page.locator('dialog[open] [aria-label="Close"]').first().click();
  await page.waitForTimeout(400);
  const after = await buttons();
  if (!after.includes('Supporting text: Title'))
    problems.push(`${label}: the button does not say "Supporting text: Title" after the pick (${after.join('|')})`);
  if ((await lines())[0] !== 'Edit on your phone')
    problems.push(`${label}: the bottom line of the first row is "${(await lines())[0]}", not its title`);
  // A tap on the row's own bottom line opens the same choice.
  await block.locator('.mo-list__item-supporting').first().click();
  await page
    .locator('dialog[open], .mo-editor-side-sheet')
    .filter({ hasText: 'Field shown' })
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => problems.push(`${label}: a tap on a row's bottom line did not open the choice of fields`));
  await page.close();
}

/** The list's menu (OwnList.tsx `List menu`) opens with `Edit list` and `Delete list` at every width, with a mouse and with touch: the top bar and the title row both draw the button, and the menu anchors to the one that was clicked, not the hidden one. */
async function checkListMenuOpens(width, height, touch) {
  const label = `${width}px list menu${touch ? ' (touch)' : ''}`;
  virtualFile('src/data/menus/_list.json', JSON.stringify({ version: 1, label: 'Menus', fields: ['title'] }));
  virtualFile('src/data/menus/one.json', JSON.stringify({ order: 1, title: 'One' }));
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#list/menus'));
  const button = page.getByRole('button', { name: 'List menu' }).locator('visible=true').first();
  await button.waitFor({ timeout: 15000 }).catch(() => problems.push(`${label}: no visible List menu button`));
  await (touch ? button.tap() : button.click());
  await page.waitForTimeout(700);
  const opened = await page
    .getByRole('menuitem', { name: 'Edit list' })
    .first()
    .isVisible()
    .catch(() => false);
  if (!opened) problems.push(`${label}: List menu did not open its menu`);
  else if (!(await page.getByRole('menuitem', { name: 'Delete list' }).first().isVisible()))
    problems.push(`${label}: the menu has no Delete list`);
  else if (!touch && width >= 600) {
    // The menu is a popover at its button (CSS anchor positioning): on the screen, 8 dp or more from every edge, and touching the button's column.
    const at = await page.evaluate(() => {
      const menu = document.querySelector('.mo-editor-menu');
      const button = [...document.querySelectorAll('button[aria-label="List menu"]')].find((b) => b.getClientRects().length);
      if (!menu || !button) return null;
      const m = menu.getBoundingClientRect();
      const b = button.getBoundingClientRect();
      return { m, b, popover: menu.matches(':popover-open'), w: innerWidth, h: innerHeight };
    });
    if (!at) problems.push(`${label}: no menu or button to measure`);
    else {
      if (!at.popover) problems.push(`${label}: the menu is not a popover`);
      if (at.m.left < 7.5 || at.m.top < 7.5 || at.m.right > at.w - 7.5 || at.m.bottom > at.h - 7.5)
        problems.push(`${label}: the menu is not inside the screen (${JSON.stringify(at.m)})`);
      const gapBelow = at.m.top - at.b.bottom;
      const gapAbove = at.b.top - at.m.bottom;
      if (!((gapBelow >= -1 && gapBelow <= 12) || (gapAbove >= -1 && gapAbove <= 12)))
        problems.push(`${label}: the menu is not next to its button (below ${gapBelow}, above ${gapAbove})`);
      if (at.m.left > at.b.right || at.m.right < at.b.left) problems.push(`${label}: the menu is not over its button's column`);
    }
  }
  await page.close();
}

/** What the page shows of the Edit list sheet, for a message that names it when a wait or a count in checkOwnList fails (a diagnostic: it waits for nothing). */
const ownListState = async (page) => {
  try {
    const seen = await page.evaluate(() => ({
      hash: location.hash,
      dialogs: [...document.querySelectorAll('dialog[open]')].map((d) => d.textContent.slice(0, 40)),
      sideSheets: [...document.querySelectorAll('.mo-editor-side-sheet')].map((e) => ({
        visible: e.checkVisibility(),
        text: e.textContent.slice(0, 40),
      })),
    }));
    return JSON.stringify({ ...seen, removeButtons: await page.getByRole('button', { name: 'Remove field' }).count() });
  } catch {
    return 'state not readable';
  }
};

/** The page of a list the owner made (#list/<id>, OwnList.tsx): the testimonials' list page and item page with the list's own fields. A list with a definition and two entries opens with two rows, no horizontal overflow; the active row has the dotted outline and no background, `Add list row` shows under an active list and is gone when the cursor leaves, the toolbar has Add above and Add below, Enter in the title goes to the text, and only the fields the list has are there (no icon slot, no link slot). */
async function checkOwnList(width, height) {
  const label = `${width}px own list`;
  const phone = width < 600;
  // The list and a page that reads it, in memory (the editor reads them as if they were in the site's folder, which a check never writes to).
  const list = 'src/data/services';
  virtualFile(`${list}/_list.json`, JSON.stringify({ version: 1, label: 'Services', fields: ['title', 'text', 'href', 'image', 'tags'] }));
  virtualFile(`${list}/web-design.json`, JSON.stringify({ order: 1, title: 'Web design', text: 'Sites that last' }));
  virtualFile(`${list}/hosting.json`, JSON.stringify({ order: 2, title: 'Hosting' }));
  // A page that reads the list, so `Delete list` is refused.
  virtualFile(
    'src/content/pages/zz-reads-services.md',
    '---\ntitle: "Reads services"\n---\n\n# Reads services\n\n<div data-block="list" data-props="{&quot;from&quot;:&quot;services&quot;}"></div>\n',
  );
  {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site);
    const commits = [];
    await page.route('**/api/github/commit', (r) => {
      commits.push(JSON.parse(r.request().postData() || '{}'));
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'head', blobs: {} }) });
    });
    await page.evaluate(() => (location.hash = '#list/services'));
    await page
      .getByText('Web design', { exact: true })
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => problems.push(`${label}: the list page has no rows`));
    // The same list page as the testimonials: rows with Move up and Move down, `Add item`, no typed-in-place rows.
    if (await page.locator('.mo-editor-inline-list-row').count()) problems.push(`${label}: the list page still has typed-in-place rows`);
    for (const row of ['Web design', 'Hosting'])
      if (!(await page.getByText(row, { exact: true }).count())) problems.push(`${label}: no row "${row}"`);
    if ((await page.getByRole('button', { name: /^Move .+ down$/ }).count()) < 2) problems.push(`${label}: the rows have no Move down`);
    if (!(await page.getByLabel('Add item').count())) problems.push(`${label}: no Add item button`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
      problems.push(`${label}: the list page scrolls sideways`);
    // A row opens its own page, as a testimonial does: every field of the list is the theme's text field with its label in the border.
    await page.getByText('Web design', { exact: true }).first().click();
    await page
      .getByLabel('Title', { exact: true })
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => problems.push(`${label}: a row did not open its page with a Title field`));
    for (const field of ['Title', 'Body text', 'Link'])
      if (!(await page.getByLabel(field, { exact: true }).count())) problems.push(`${label}: the row page has no ${field} field`);
    for (const text of ['Image', 'Tags'])
      if (!(await page.getByText(text, { exact: true }).count())) problems.push(`${label}: the row page has no ${text}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
      problems.push(`${label}: the row page scrolls sideways`);
    const own = await page
      .getByLabel('Title', { exact: true })
      .first()
      .evaluate((el) => el.closest('label, div')?.className ?? '');
    await page.evaluate(() => (location.hash = '#list/testimonials'));
    await page.locator('main a[href^="#src/data/testimonials"], main a[href*="testimonials/"]').first().click();
    const theirs = await page
      .getByLabel('Name', { exact: true })
      .first()
      .evaluate((el) => el.closest('label, div')?.className ?? '');
    if (!own || own !== theirs) problems.push(`${label}: a list's text field is not the testimonials' (${own} / ${theirs})`);
    await page.evaluate(() => (location.hash = '#list/services'));
    await page.getByText('Hosting', { exact: true }).first().waitFor({ timeout: 10000 });
    // The list's menu: `Edit list` opens the sheet with the name, the six switches and `Delete list`; `Delete list` is refused while a page reads the list.
    await page.getByRole('button', { name: 'List menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit list' }).first().click();
    // From 600 dp it is the pane beside the page, below it the sheet (a dialog).
    const sheet = (phone ? page.locator('dialog[open]') : page.locator('.mo-editor-side-sheet').locator('visible=true')).filter({
      hasText: 'Fields',
    });
    await sheet
      .waitFor({ timeout: 5000 })
      .catch(async () => problems.push(`${label}: Edit list did not open its sheet (${await ownListState(page)})`));
    // The list was made in the first format (fields as kind names): it reads as it did. Each of its five fields has the owner's own `Shown` switch (on) and `Remove field`; and `Add field` is there.
    const switches = await sheet.locator('input[type="checkbox"]').count();
    if (switches !== 5) problems.push(`${label}: Edit list has ${switches} switches, not 5`);
    const removes = await sheet.getByRole('button', { name: 'Remove field' }).count();
    if (removes !== 5) problems.push(`${label}: Edit list has ${removes} Remove field buttons, not 5`);
    if (!(await sheet.getByRole('button', { name: 'Add field' }).count())) problems.push(`${label}: Edit list has no Add field`);
    if (!(await sheet.getByRole('button', { name: 'Delete list' }).count())) problems.push(`${label}: Edit list has no Delete list`);
    if (!(await sheet.getByLabel('Name').count())) problems.push(`${label}: Edit list has no name field`);
    // Remove field waits for the Save, like adding a field: it asks, takes the field out of the sheet, commits nothing, and leaving without saving undoes it.
    const removeBody = async () => {
      await sheet
        .getByRole('button', { name: 'Remove field' })
        .nth(1)
        .click()
        .catch(async (e) => {
          throw new Error(`${label}: no second Remove field button to press (${await ownListState(page)})\n${e.message}`, { cause: e });
        });
      await page
        .locator('dialog[open]')
        .last()
        .getByRole('button', { name: 'Remove field' })
        .click()
        .catch(() => problems.push(`${label}: Remove field did not ask`));
      await page.waitForTimeout(500);
    };
    await removeBody();
    if ((await sheet.getByRole('button', { name: 'Remove field' }).count()) !== 4)
      problems.push(`${label}: Remove field did not take the field out of Edit list`);
    if (commits.length) problems.push(`${label}: Remove field committed before the Save (${commits.length} commits)`);
    await sheet.locator('[aria-label="Close"]').first().click();
    await page.waitForTimeout(300);
    await page.evaluate(() => (location.hash = '#lists'));
    await page
      .getByRole('button', { name: 'Discard' })
      .click({ timeout: 5000 })
      .catch(() => problems.push(`${label}: leaving with a field removed did not ask`));
    await page.waitForFunction(() => location.hash === '#lists', null, { timeout: 5000 }).catch(() => {});
    await page.evaluate(() => (location.hash = '#list/services'));
    await page.getByText('Hosting', { exact: true }).first().waitFor({ timeout: 10000 });
    await page.getByRole('button', { name: 'List menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit list' }).first().click();
    // The pane or sheet takes a moment to open: wait for its fifth field before counting.
    await sheet
      .getByRole('button', { name: 'Remove field' })
      .nth(4)
      .waitFor({ timeout: 5000 })
      .catch(() => {});
    if ((await sheet.getByRole('button', { name: 'Remove field' }).count()) !== 5)
      problems.push(`${label}: the removed field did not come back after Discard (${await ownListState(page)})`);
    if (commits.length) problems.push(`${label}: Discard committed (${commits.length} commits)`);
    await removeBody();
    await sheet.locator('[aria-label="Close"]').first().click();
    await page.locator('.mo-editor-save-bar').getByRole('button', { name: /^Save/ }).click();
    await page
      .getByRole('button', { name: 'Cancel' })
      .click({ timeout: 3000 })
      .catch(() => {});
    await page.waitForTimeout(1500);
    const removed = commits.flatMap((c) => c.changes);
    const def = removed.find((x) => x.path.endsWith('services/_list.json'));
    const item = removed.find((x) => x.path.endsWith('services/web-design.json'));
    if (commits.length !== 1 || JSON.parse(decoded(def?.content) || '{}').fields?.length !== 4)
      problems.push(`${label}: Save did not make one commit with the list without the field (${commits.length} commits)`);
    if ('text' in JSON.parse(decoded(item?.content) || '{}'))
      problems.push(`${label}: the removed field's data is still in an item (${item?.content})`);
    await page.getByRole('button', { name: 'List menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit list' }).first().click();
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
  }
}

/** The text of a committed file: the commit proxy gets it base64 encoded. */
const decoded = (content) => Buffer.from(content ?? '', 'base64').toString() || '{}';

/** `New list` on the Lists screen: the button opens the dialog (the name only, `Cancel` outlined, `Create` filled, no initial focus); a name that is taken is refused; `Create` makes a list with no fields, which opens saying so with `Add field`; two body text fields are added, a row is typed in both and both values are saved and shown; the list shows under Lists and in Rows from. No horizontal overflow. */
async function checkNewList(width, height, label) {
  label = `${label} new`;
  const phone = width < 600;
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
    const dialog = phone
      ? page.locator('dialog[open][aria-label="New list"]')
      : page.locator('.mo-editor-side-sheet').locator('visible=true').filter({ hasText: 'New list' });
    await dialog.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: New list did not open its dialog`));
    if ((await dialog.locator('input[type="checkbox"]').count()) !== 0) problems.push(`${label}: the dialog still has field switches`);
    const state = await page.evaluate(() => {
      const d =
        innerWidth < 600
          ? document.querySelector('dialog[open]')
          : [...document.querySelectorAll('.mo-editor-side-sheet')].find((x) => x.getClientRects().length > 0);
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
    // A name that is taken (the blog's collection, which every site has) is refused.
    await dialog.getByLabel('Name').fill('Blog');
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
    if (await page.locator('.mo-editor-inline-list-row').locator('visible=true').count())
      problems.push(`${label}: an empty list shows a row`);
    // Making the list commits nothing: it is kept as a waiting version until the final Save.
    if (commits.length) problems.push(`${label}: Create committed (${commits.length} commits) before the final Save`);
    // Two body texts: the empty page's Add field, then Body text; the second through Edit list (the empty page's button is gone once there is a field).
    const pick = async (n, name = 'Body text') => {
      await page
        .getByRole('menuitem', { name })
        .locator('visible=true')
        .first()
        .click()
        .catch(() => problems.push(`${label}: Add field has no ${name} (${n})`));
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
    const edit = (phone ? page.locator('dialog[open]') : page.locator('.mo-editor-side-sheet').locator('visible=true')).filter({
      hasText: 'Fields',
    });
    await edit.getByRole('button', { name: 'Add field' }).click();
    await pick(1);
    if ((await edit.locator('input[type="checkbox"]').count()) !== 2)
      problems.push(`${label}: Edit list does not show two fields with a switch each`);
    await edit.locator('[aria-label="Close"]').first().click();
    await page.waitForTimeout(300);
    // Two fields added and still nothing committed; the line under the title says the version is kept, and the bar has Save changes.
    if (commits.length) problems.push(`${label}: a field was committed before the Save (${commits.length} commits)`);
    const line = await page.evaluate(() => document.body.innerText);
    if (!/Saving…|Saved|Not saved/.test(line)) problems.push(`${label}: no line says whether the waiting version is kept`);
    // Leaving asks first, as it does for a page: Save or Discard; Esc stays.
    await page.evaluate(() => (location.hash = '#lists'));
    await page
      .getByRole('button', { name: 'Discard' })
      .waitFor({ timeout: 5000 })
      .catch(() => problems.push(`${label}: leaving the unsaved list did not ask`));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await page.evaluate(() => location.hash !== '#list/zz-fresh-list')) problems.push(`${label}: Esc did not stay on the unsaved list`);
    // The Save: exactly one commit, with the list and both fields.
    const save = async () => {
      await page.locator('.mo-editor-save-bar').getByRole('button', { name: /^Save/ }).click();
      // The first Save asks whether to send notifications.
      await page
        .getByRole('button', { name: 'Cancel' })
        .click({ timeout: 3000 })
        .catch(() => {});
    };
    await save();
    await page
      .waitForFunction(() => !document.querySelector('.mo-editor-save-bar button'), null, { timeout: 15000 })
      .catch(() => problems.push(`${label}: the save bar did not go after Save`));
    if (commits.length !== 1) problems.push(`${label}: the Save made ${commits.length} commits, not one`);
    const made = commits[0]?.changes.find((x) => x.path.endsWith('_list.json'));
    const definition = JSON.parse(decoded(made?.content) || '{}');
    if (definition.fields?.length !== 2 || definition.fields.some((f) => f.kind !== 'text'))
      problems.push(`${label}: the commit does not have the list with both fields (${made?.content})`);
    // The list is the testimonials' page now: `Add item` opens an item's page with both fields as text fields; Save writes one file with both values.
    await page.getByLabel('Add item').first().click();
    await page
      .getByLabel('Body text 2', { exact: true })
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => problems.push(`${label}: the item page has no second body text`));
    await page.getByLabel('Body text', { exact: true }).first().fill('First line');
    await page.getByLabel('Body text 2', { exact: true }).first().fill('Second line');
    await page.getByRole('button', { name: /^Save/ }).last().click();
    await page.waitForTimeout(1500);
    const entry = commits.flatMap((c) => c.changes).find((x) => /src\/data\/zz-fresh-list\/(?!_)[^/]+\.json$/.test(x.path));
    const saved = JSON.parse(decoded(entry?.content));
    if (saved.text !== 'First line' || saved['text-2'] !== 'Second line')
      problems.push(`${label}: the item was not saved with both body texts (${entry?.content})`);
    await page.evaluate(() => (location.hash = '#list/zz-fresh-list'));
    await page
      .getByText('First line')
      .first()
      .waitFor({ timeout: 10000 })
      .catch(() => problems.push(`${label}: the item does not show in the list`));
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
    const allPaths = commits.flatMap((c) => c.changes.map((x) => x.path));
    if (!allPaths.some((p) => p.endsWith('src/data/zz-fresh-list/_list.json')))
      problems.push(`${label}: the Save did not commit the definition (${allPaths})`);
    // Rows from offers it: a list typed on a new page, its dynamic settings, the choice of lists.
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('Hello');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await pressInsert(page, 'click');
    await page.locator('dialog[open] button', { hasText: 'Show text and images in a list.' }).first().click();
    await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
    await page.keyboard.type('Typed row');
    await pressTool(page, 'Fill from a list');
    const panel = page.locator('dialog[open], .mo-editor-side-sheet').filter({ hasText: 'Rows from' }).first();
    await panel.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the dynamic settings did not open`));
    await panel.locator('button.mo-text-field__input').first().click();
    await page
      .getByText('ZZ Fresh list', { exact: true })
      .locator('visible=true')
      .last()
      .waitFor({ timeout: 5000 })
      .catch(() => problems.push(`${label}: the new list is not offered under Rows from`));
    // Picked, the block's parts name the list's fields: with no title field the first body text is the top line and the second the bottom line; the
    // bottom line can be set to the first body text (this block only), and no image or other kind is offered for it.
    await page.getByText('ZZ Fresh list', { exact: true }).locator('visible=true').last().click();
    const part = (name) => page.getByRole('button', { name: new RegExp(`^${name}:`) }).first();
    // On a phone the dynamic settings are a sheet over the block: close it to reach the parts.
    if (phone)
      await page
        .locator('dialog[open] [aria-label="Close"]')
        .first()
        .click()
        .catch(() => {});
    await page.waitForTimeout(400);
    await part('Supporting text')
      .waitFor({ timeout: 8000 })
      .catch(() => problems.push(`${label}: the picked list shows no Supporting text part`));
    const parts = await page.evaluate(() =>
      [...document.querySelectorAll('.mo-editor-inline-list-parts button')].map((b) => b.textContent.trim()),
    );
    if (parts[0] !== 'Label text: Body text' || parts[1] !== 'Supporting text: Body text 2')
      problems.push(`${label}: the parts do not name the list's fields (${parts})`);
    await part('Supporting text').click();
    const field = page.locator('dialog[open], .mo-editor-side-sheet').filter({ hasText: 'Field shown' }).first();
    await field.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the Supporting text choice did not open`));
    await field.locator('button.mo-text-field__input').first().click();
    const offered = await page.evaluate(() => {
      // The open choice is labelled with the field's name (Field shown), as a menu or a sheet of options.
      const choices = [...document.querySelectorAll('[aria-label="Field shown"]')].flatMap((m) =>
        [...m.querySelectorAll('[role="menuitem"], [role="option"], [role="menuitemradio"], li')].map((o) => o.textContent.trim()),
      );
      return choices;
    });
    if (!offered.includes('Body text') || !offered.includes('Body text 2') || offered.includes('Image'))
      problems.push(`${label}: the Supporting text offers the wrong fields (${offered})`);
    // A field added and then an item saved: one commit with the definition and the item (nothing was committed for the field).
    await page.evaluate(() => (location.hash = '#list/zz-fresh-list'));
    // The page typed above is not saved: leaving it asks.
    await page
      .getByRole('button', { name: 'Discard' })
      .click({ timeout: 3000 })
      .catch(() => {});
    await page.getByRole('button', { name: 'List menu' }).first().waitFor({ timeout: 10000 });
    const before = commits.length;
    await page.getByRole('button', { name: 'List menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit list' }).first().click();
    const again = (phone ? page.locator('dialog[open]') : page.locator('.mo-editor-side-sheet').locator('visible=true')).filter({
      hasText: 'Fields',
    });
    await again.getByRole('button', { name: 'Add field' }).click();
    await pick(2, 'Title');
    await again.locator('[aria-label="Close"]').first().click();
    if (commits.length !== before) problems.push(`${label}: adding a field to a saved list committed`);
    await page.getByLabel('Add item').first().click();
    await page.getByLabel('Title', { exact: true }).first().fill('A title');
    await page.getByRole('button', { name: /^Save/ }).last().click();
    await page.waitForTimeout(1500);
    const last = commits.slice(before);
    const paths = last.flatMap((c) => c.changes.map((x) => x.path));
    if (last.length !== 1 || !paths.some((x) => x.endsWith('_list.json')) || !paths.some((x) => /zz-fresh-list\/(?!_)/.test(x)))
      problems.push(`${label}: saving an item did not commit the waiting field with it (${last.length} commits: ${paths})`);
  } finally {
    await page.close();
  }
}

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
          section.className = 'mo-text-section mo-is-' + color;
          section.innerHTML =
            '<div class="mo-prose"><h1>H1</h1><p>Text</p></div><div class="mo-list mo-block-list"><a class="mo-list__item-container" href="#"><span class="mo-list__item-leading mo-list__item-leading-icon"><svg viewBox="0 0 10 10"></svg></span><span class="mo-list__item-content"><span class="mo-list__item-headline">Heading</span><span class="mo-list__item-supporting">Text</span></span><span class="mo-list__item-trailing"><svg viewBox="0 0 10 10"></svg></span></a></div>';
          document.querySelector('main').append(section);
          const c = (sel) => getComputedStyle(section.querySelector(sel)).color;
          out[color] = {
            h1: c('h1'),
            text: c('p'),
            heading: c('.mo-list__item-headline'),
            supporting: c('.mo-list__item-supporting'),
            icon: c('.mo-list__item-leading'),
            chevron: c('.mo-list__item-trailing'),
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
          section.className = 'mo-text-section mo-is-' + color;
          section.innerHTML = '<div class="mo-prose"><ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled> Photos are resized</li></ul></div>';
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

/** The List "expand" kind on the built site (the List - Expand marked as a FAQ on /blocks/), 375 and 1280 px: a <ul class="mo-list mo-list__expand"> of <li><details name><summary> items (a row of 48 px or more, a corner of 16 px on the list), the closed caret has no container and the open one turns over and gets one while the headline keeps its colour (Material's "List - Expand" tokens), one row open at a time, Space on the focused summary opens it and the focus ring is 3 px, nothing scrolls sideways. */
async function checkExpandList(width, height) {
  const label = `${width}px List expand`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  // The segmented design (the segmented List - Expand) has the 16 px corner on its list; the plain design is the rows on the page, and
  // edge to edge on a phone with no corner (checkListLeftEdge), so it is not the one measured here.
  const list = page.locator('ul.mo-list.mo-list__expand.mo-block-accordion__segmented:has(> li:nth-child(2))').first();
  if (!(await list.count())) {
    problems.push(`${label}: no segmented List with expand and two items on the Blocks pages`);
    return page.close();
  }
  await list.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const items = list.locator(':scope > li > details.mo-list__item-expand');
  const first = items.nth(0);
  const second = items.nth(1);
  const look = (item) =>
    item.evaluate((d) => {
      const sum = d.querySelector(':scope > summary.mo-list__item-container');
      const icon = sum?.querySelector('.mo-list__item-expand-icon');
      const head = sum?.querySelector('.mo-list__item-headline');
      const box = sum?.getBoundingClientRect();
      return {
        summary: !!sum,
        height: box?.height ?? 0,
        iconBg: icon ? getComputedStyle(icon).backgroundColor : '',
        iconRotate: icon ? getComputedStyle(icon).rotate : '',
        headColor: head ? getComputedStyle(head).color : '',
        hasBody: !!d.querySelector(':scope > .mo-list__item-expand-body'),
        open: d.open,
      };
    });
  const closed = await look(first);
  if (!closed.summary || !closed.hasBody) problems.push(`${label}: an item has no summary or no body`);
  if (closed.height < 48) problems.push(`${label}: an item is ${closed.height}px tall, should be 48px or more`);
  if (closed.iconBg !== 'rgba(0, 0, 0, 0)') problems.push(`${label}: the closed caret has a container (${closed.iconBg})`);
  const radius = await list.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  if (radius !== '16px') problems.push(`${label}: the list's corner is ${radius}, should be 16px`);
  await first.locator('summary').click();
  await page.waitForTimeout(700);
  const open = await look(first);
  if (!open.open) problems.push(`${label}: a tap on the item does not open it`);
  if (open.iconBg === 'rgba(0, 0, 0, 0)') problems.push(`${label}: the open caret has no container`);
  if (open.iconRotate === 'none' || !/180|3\.14/.test(open.iconRotate))
    problems.push(`${label}: the open caret has not turned over (${open.iconRotate})`);
  if (open.headColor !== closed.headColor)
    problems.push(`${label}: the headline changes colour when open (${closed.headColor} to ${open.headColor})`);
  // One at a time (the same name), and the keyboard: Space on the focused summary of the second item opens it and closes the first.
  await second.locator('summary').focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(700);
  if (!(await look(second)).open || (await look(first)).open)
    problems.push(`${label}: Space on the second item does not open it and close the first`);
  const ring = await second.locator('summary').evaluate((el) => getComputedStyle(el).outlineWidth);
  if (ring !== '3px') problems.push(`${label}: the focus ring is ${ring}, should be 3px`);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) problems.push(`${label}: the page scrolls sideways`);
  console.log(`${label}: ${JSON.stringify({ closed, open })}`);
  await page.close();
}

/** Owner, 14 Nov 2026: "Content is always open. All other sections are closed on load." A page's and a post's form, new and
 * saved, opens with Content open and with no heading to fold it, and every other section (settings, search engines,
 * social media, history) folded, on a phone and a computer (width, height). */
async function checkSectionsOnLoad(width, height) {
  // A saved page and post: the site's first of each (the demo's, the starter's).
  const saved = ['pages', 'blog'].flatMap((list) => {
    const dir = `src/content/${list}`;
    const first = existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith('.md'))
          .sort()[0]
      : undefined;
    return first ? [`#${dir}/${first}`] : [];
  });
  for (const hash of ['#new/pages', '#new/blog', ...saved]) {
    const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${width}px ${hash} sections on load: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });
    await page.waitForTimeout(300);
    const sections = await page.$$eval('section[data-fold-section]', (els) =>
      els.map((el) => {
        const head = el.querySelector(':scope > h2');
        const button = head.querySelector('button');
        return {
          title: head.textContent.trim(),
          button: !!button,
          open: button ? button.getAttribute('aria-expanded') === 'true' : !el.querySelector(':scope > div').hidden,
        };
      }),
    );
    const content = sections.find((s) => s.title === 'Content');
    if (!content) problems.push(`${width}px ${hash} sections on load: no "Content" section`);
    else {
      if (content.button) problems.push(`${width}px ${hash} sections on load: "Content" can be folded`);
      if (!content.open) problems.push(`${width}px ${hash} sections on load: "Content" is not open`);
    }
    const others = sections.filter((s) => s.title !== 'Content');
    if (!others.length) problems.push(`${width}px ${hash} sections on load: no other sections`);
    for (const s of others) if (s.open) problems.push(`${width}px ${hash} sections on load: "${s.title}" is open, should be folded`);
    console.log(`${width}px ${hash} sections on load: ${JSON.stringify(sections.map((s) => [s.title, s.open]))}`);
    await page.close();
  }
}

/** `Show more` and the text button under the last row (`button`) of a list with a row limit stand on one row (375, 768 and 1280 px), on the demo's Lists page
 * (/blocks/lists/, "List with a row limit"): the same top, side by side without overlap, no 2 rem of space under each (the row has the spacing once), and the
 * row wraps when it is too narrow for both (owner, 17 Nov 2026: "If there is two buttons they should be on a row"). */
async function checkListButtonsRow(width) {
  const label = `${width}px list buttons row`;
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-lists.md')))
    return void console.log(`${label}: skipped, the site has no Lists page, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const response = await page.goto(`${site}/blocks/lists/`).catch(() => null);
  if (!response || response.status() >= 400) {
    problems.push(`${label}: the demo's Lists page (/blocks/lists/) did not open`);
    return page.close();
  }
  const row = page
    .locator('.mo-block-buttons__row:has(.mo-block-more__button):has(.mo-block-more__button ~ .mo-block-list__button)')
    .first();
  if (!(await row.count())) {
    problems.push(`${label}: no list with a row limit has both Show more and a text button under it`);
    return page.close();
  }
  await row.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.mo-block-more[data-cut]'), null, { timeout: 10_000 }).catch(() => {});
  const got = await row.evaluate((el) => {
    const [a, b] = [...el.children].map((c) => {
      const box = c.getBoundingClientRect();
      const css = getComputedStyle(c);
      return { top: box.top, left: box.left, right: box.right, mt: css.marginTop, mb: css.marginBottom, shown: css.display !== 'none' };
    });
    const css = getComputedStyle(el);
    const narrow = el.cloneNode(true);
    narrow.style.width = '120px';
    narrow.style.position = 'absolute';
    el.parentElement.append(narrow);
    const [na, nb] = [...narrow.children].map((c) => c.getBoundingClientRect().top);
    narrow.remove();
    return { a, b, display: css.display, wrap: css.flexWrap, na, nb };
  });
  if (got.display !== 'flex') problems.push(`${label}: the buttons' row is ${got.display}, not a flex row`);
  if (!got.a.shown || !got.b) problems.push(`${label}: Show more or the text button is not shown while the list is cut`);
  else {
    if (Math.abs(got.a.top - got.b.top) > 1) problems.push(`${label}: the buttons are not on one row (tops ${got.a.top} and ${got.b.top})`);
    if (got.b.left < got.a.right - 0.5) problems.push(`${label}: the buttons overlap (${got.a.right} and ${got.b.left})`);
    for (const [name, c] of [
      ['Show more', got.a],
      ['the text button', got.b],
    ])
      if (c.mt !== '0px' || c.mb !== '0px') problems.push(`${label}: ${name} has its own space around it (${c.mt} above, ${c.mb} below)`);
  }
  if (got.wrap !== 'wrap') problems.push(`${label}: the buttons' row is ${got.wrap}, so a narrow screen cannot wrap it`);
  if (!(got.nb > got.na + 1)) problems.push(`${label}: in 120 px the second button stays on the first one's row (${got.na}, ${got.nb})`);
  await page.close();
}

/** An open item of a plain List - Expand has the segmented design's item surface, and a closed one has none (375, 768 and 1280 px, the demo's Lists page): no line is
 * drawn above an open item or under it (owner, 17 Nov 2026: "A plain design list item that is open should have a bg color"). */
async function checkOpenPlainExpand(width) {
  const label = `${width}px open plain expand item`;
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-lists.md')))
    return void console.log(`${label}: skipped, the site has no Lists page, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const response = await page.goto(`${site}/blocks/lists/`).catch(() => null);
  if (!response || response.status() >= 400) {
    problems.push(`${label}: the demo's Lists page (/blocks/lists/) did not open`);
    return page.close();
  }
  const plain = page.locator('.mo-block-accordion:not(.mo-block-accordion__segmented):has(> li:nth-child(3))').first();
  if (!(await plain.count())) {
    problems.push(`${label}: no plain List - Expand with three items on the Lists page`);
    return page.close();
  }
  const segmentedSurface = await page.evaluate(() => {
    const li = document.querySelector('.mo-block-accordion__segmented > li');
    return li ? getComputedStyle(li).backgroundColor : null;
  });
  const items = plain.locator(':scope > li > details.mo-list__item-expand');
  await items.nth(1).scrollIntoViewIfNeeded();
  await items.nth(1).locator('summary').click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
  const got = await plain.evaluate((el) => {
    const css = (e) => getComputedStyle(e);
    return [...el.children].map((li) => ({
      open: li.firstElementChild.open,
      bg: css(li).backgroundColor,
      line: css(li).borderTopColor,
      shadow: css(li).boxShadow,
    }));
  });
  const clear = 'rgba(0, 0, 0, 0)';
  got.forEach((li, i) => {
    if (li.open && li.bg !== segmentedSurface)
      problems.push(`${label}: the open item's surface is ${li.bg}, not the segmented design's ${segmentedSurface}`);
    if (!li.open && li.bg !== clear) problems.push(`${label}: closed item ${i + 1} has a surface (${li.bg})`);
    // The line above the open item is its own (clear), and its surface covers the line of the item under it (a shadow of its colour).
    if (li.open && li.line !== clear) problems.push(`${label}: the open item has a line above it (${li.line})`);
    if (li.open && !li.shadow.includes(segmentedSurface.replace('rgb(', '').replace(')', '')))
      problems.push(`${label}: the open item does not cover the line of the item under it (${li.shadow})`);
  });
  if (!got.some((li) => li.open)) problems.push(`${label}: a tap on an item does not open it`);
  await page.close();
}

/** The look of the lists in columns (900 and 1280 px, the demo's Lists page): the dividers of a plain List - Expand are between its rows, none above the first row's items and none against
 * an open item, and the corners of a segmented list are the list's (16 px) on its first and last rows' items and small between rows, in each number of columns (owner, 17 Nov 2026:
 * "There are dividers that shouldn't be there and corners that does not have the right radius"). */
async function checkListColumnsLook(width) {
  const label = `${width}px lists in columns`;
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-lists.md')))
    return void console.log(`${label}: skipped, the site has no Lists page, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const response = await page.goto(`${site}/blocks/lists/`).catch(() => null);
  if (!response || response.status() >= 400) {
    problems.push(`${label}: the demo's Lists page (/blocks/lists/) did not open`);
    return page.close();
  }
  const columns = await page.evaluate(() => {
    const list = document.querySelector('.mo-list__segmented.mo-block-list:not([data-columns="one"]):has(> li:nth-child(3))');
    if (!list) return null;
    const tops = [...list.children].map((li) => Math.round(li.getBoundingClientRect().top));
    return {
      count: tops.filter((t) => t === tops[0]).length,
      radii: [...list.children].map((li) => {
        const css = getComputedStyle(li);
        return [css.borderTopLeftRadius, css.borderBottomLeftRadius];
      }),
    };
  });
  if (!columns) problems.push(`${label}: no segmented List with three rows and Columns on`);
  else {
    // Rows by column: two columns (item 1, 3 / item 2) from 760 px, three (one row) from 1128 px.
    const big = '16px';
    const small = '4px';
    const want =
      columns.count >= 3
        ? [
            [big, big],
            [big, big],
            [big, big],
          ]
        : [
            [big, small],
            [big, big],
            [small, big],
          ];
    columns.radii.forEach((r, i) => {
      if (r[0] !== want[i][0] || r[1] !== want[i][1])
        problems.push(`${label}: with ${columns.count} columns, row ${i + 1}'s top and bottom left corners are ${r}, not ${want[i]}`);
    });
  }
  const plain = page.locator('.mo-block-accordion:not(.mo-block-accordion__segmented):has(> li:nth-child(3))').first();
  if (!(await plain.count())) problems.push(`${label}: no plain List - Expand with three items`);
  else {
    await plain.scrollIntoViewIfNeeded();
    await plain.locator(':scope > li > details > summary').nth(0).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(700);
    const got = await plain.evaluate((el) => {
      const items = [...el.children];
      const tops = items.map((li) => Math.round(li.getBoundingClientRect().top));
      const first = tops.filter((t) => t === tops[0]).length;
      const css = (li) => getComputedStyle(li);
      return {
        clip: css(el).clipPath,
        firstRow: items.slice(0, first).map((li) => css(li).borderTopWidth),
        openLine: css(items[0]).borderTopColor,
        openShadow: css(items[0]).boxShadow,
      };
    });
    if (!got.clip || got.clip === 'none') problems.push(`${label}: the plain List - Expand does not hide the dividers of its first row`);
    if (got.openLine !== 'rgba(0, 0, 0, 0)') problems.push(`${label}: the open item has a line above it (${got.openLine})`);
    if (!got.openShadow || got.openShadow === 'none') problems.push(`${label}: the open item does not cover the line of the item under it`);
  }
  await page.close();
}

/** A list item is as many lines as it has text (Material 3, Lists: Specs, "One-line lists" 56 dp, "Two-line lists" 72 dp; Guidelines, "Label text only" and "Label text with
 * supporting text"; owner, 25 Nov 2026: "List items only with one line should not be styled like it has two"). In the editor's lists (the pages list, the posts list, Settings, the main
 * menu's lists, the start screen's "Continue" rows) every item measured in a real browser: with no text under its headline it is 56 dp (the density's step added) and has no empty
 * supporting element (a blank or non-breaking space is none), its headline and its trailing icon or count are in the middle of it (a pixel allowed); with a supporting text it is
 * at least 72 dp and its trailing part is in the middle of its first two lines, not higher. */
async function checkListItemLines(width, height) {
  const label = `${width}px list item lines`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const measure = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('main .mo-list__item-container, main li > .mo-list__item-container')].flatMap((el) => {
        const box = el.getBoundingClientRect();
        if (!box.height || !box.width) return [];
        const name = (el.querySelector('.mo-list__item-headline')?.textContent || el.textContent || '').trim().slice(0, 30);
        const supporting = el.querySelector('.mo-list__item-supporting');
        const mid = (n) => {
          const r = n?.getBoundingClientRect();
          return r && r.height ? r.top + r.height / 2 - box.top : null;
        };
        const headline = el.querySelector('.mo-list__item-headline');
        const lead = [...el.querySelectorAll(':scope > .mo-list__item-trailing, :scope > .mo-list__item-trailing-supporting')][0];
        const icon = lead?.querySelector('svg, [data-icon]') || lead;
        const oneLineBox = parseFloat(getComputedStyle(el).minHeight);
        return [
          {
            name,
            height: box.height,
            oneLineBox,
            supporting: supporting ? supporting.innerText : null,
            twoLineClass: el.classList.contains('mo-list__item-two-line'),
            headline: mid(headline),
            trailing: mid(icon),
          },
        ];
      }),
    );
  for (const hash of ['#settings', '#list/pages', '#list/blog']) {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForSelector('main .mo-list__item-container', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const rows = await measure();
    if (!rows.length) {
      problems.push(`${label}: ${hash} has no list items to measure`);
      continue;
    }
    for (const r of rows) {
      const where = `${label}, ${hash}, "${r.name}"`;
      const blank = r.supporting !== null && r.supporting.replace(/\s/g, '') === '';
      if (blank) problems.push(`${where}: has an empty supporting text (${JSON.stringify(r.supporting)}): an empty second line`);
      const two = r.supporting !== null && !blank;
      if (!two) {
        if (Math.abs(r.height - 56) > 0.5) problems.push(`${where}: a one-line item is ${r.height} dp, not 56`);
        if (r.headline != null && Math.abs(r.headline - r.height / 2) > 1)
          problems.push(`${where}: its headline is ${r.headline - r.height / 2} dp from the middle`);
        if (r.trailing != null && Math.abs(r.trailing - r.height / 2) > 1)
          problems.push(`${where}: its trailing icon or count is ${r.trailing - r.height / 2} dp from the middle`);
      } else {
        if (r.height < 72 - 0.5) problems.push(`${where}: a two-line item is ${r.height} dp, not at least 72`);
        if (r.trailing != null && Math.abs(r.trailing - r.height / 2) > 1)
          problems.push(`${where}: its trailing icon or count is ${r.trailing - r.height / 2} dp from the middle`);
      }
    }
  }
  await page.close();
}

/** The pages and posts lists (B18, plan 0.19.7): each page or post is one row (`.mo-list__item-container`), with a square leading image of 8 dp corners, or (no image) the kind icon in the leading icon slot and no grey tile,
 * one supporting line naming its versions (`Published`, `Published · Draft`, `Draft`, `Scheduled …`), no trailing icon unless Hidden (`visibility_off`, named `Hidden`), dividers between
 * the rows, and in the menu tree the drop-down rightmost (`aria-expanded`, named `Show subpages of …`). */
async function checkPageRowsList(width, height) {
  const label = `${width}px pages and posts rows`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  for (const hash of ['#list/pages', '#list/blog']) {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForSelector('main .mo-editor-section .mo-list__item-container', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('main .mo-editor-section .mo-list__item-container')].map((el) => {
        const img = el.querySelector('.mo-list__item-leading-image .mo-list__item-image');
        const box = img?.getBoundingClientRect();
        const li = el.closest('li');
        const lead = el.querySelector('.mo-list__item-leading-icon');
        return {
          icon: !!lead?.querySelector('svg'),
          tile: !!el.querySelector('.mo-list__item-image-placeholder'),
          name: (el.querySelector('.mo-list__item-headline')?.textContent || '').trim(),
          href: el.getAttribute('href') || '',
          img: box ? { w: Math.round(box.width), h: Math.round(box.height), radius: getComputedStyle(img).borderTopLeftRadius } : null,
          supporting:
            (el.querySelector('.mo-editor-library-under-status') ?? el.querySelector('.mo-list__item-supporting'))?.textContent?.trim() ??
            '',
          icons: [...el.querySelectorAll('[role="img"][aria-label]')].map((i) => i.getAttribute('aria-label')),
          // The line between two rows: the inset divider is the <li>'s ::before (a border drawn in a colour, not transparent).
          divider:
            li && li.previousElementSibling
              ? (() => {
                  const b = getComputedStyle(li, '::before');
                  return b.content !== 'none' && b.borderTopWidth !== '0px' && b.borderTopColor !== 'rgba(0, 0, 0, 0)';
                })()
              : null,
          // How far the divider is from the text: it starts where the row's text starts.
          dividerGap:
            li && li.previousElementSibling
              ? el.querySelector('.mo-list__item-content').getBoundingClientRect().left -
                (li.getBoundingClientRect().left + parseFloat(getComputedStyle(li, '::before').marginLeft))
              : null,
        };
      }),
    );
    if (!rows.length) {
      problems.push(`${label}: ${hash} has no rows`);
      continue;
    }
    const links = rows.map((r) => r.href).filter(Boolean);
    if (new Set(links).size !== links.length) problems.push(`${label}: ${hash} lists a page or post twice (${links.join(', ')})`);
    for (const r of rows) {
      const where = `${label}, ${hash}, "${r.name}"`;
      if (r.tile) problems.push(`${where}: has a grey placeholder tile`);
      if (!r.img && !r.icon) problems.push(`${where}: has neither a square image nor the kind icon`);
      if (r.img) {
        if (r.img.w !== r.img.h) problems.push(`${where}: its image is ${r.img.w} x ${r.img.h}, not square`);
        if (r.img.radius !== '8px') problems.push(`${where}: its image corner is ${r.img.radius}, not 8px`);
      }
      if (!/^(Published|Draft|Scheduled)/.test(r.supporting))
        problems.push(`${where}: the line under it names no version (${JSON.stringify(r.supporting)})`);
      if (r.icons.some((n) => n !== 'Hidden')) problems.push(`${where}: has a trailing icon that is not Hidden (${r.icons.join(', ')})`);
      if (r.divider === false) problems.push(`${where}: has no divider above it`);
      if (r.dividerGap != null && Math.abs(r.dividerGap) > 1)
        problems.push(`${where}: its divider starts ${r.dividerGap} dp before its text, not where the text starts`);
    }
  }
  await page.evaluate(() => (location.hash = '#list/pages'));
  await page.waitForTimeout(1000);
  for (const toggle of await page.$$('main button[aria-expanded]')) {
    const name = (await toggle.getAttribute('aria-label')) || '';
    if (!/^Show subpages of /.test(name)) continue;
    await toggle.click();
    const now = await toggle.getAttribute('aria-expanded');
    const after = (await toggle.getAttribute('aria-label')) || '';
    if (now !== 'true' || !/^Hide subpages of /.test(after))
      problems.push(`${label}: "${name}" does not open to "Hide subpages of …" (${now}, ${after})`);
    break;
  }
  // The menu tree: a subpage's leading edge is 20 dp right of its parent's (an inline padding once replaced the container's own start padding, so the step was 4 dp).
  const asMenu = page.getByRole('button', { name: 'Show as menu' });
  if (await asMenu.count()) await asMenu.first().click();
  await page.waitForTimeout(500);
  const parentToggle = await page.$('main button[aria-expanded="false"][aria-label^="Show subpages of "]');
  if (!parentToggle) problems.push(`${label}: the menu tree has no page with subpages to open`);
  else {
    await parentToggle.click();
    await page.waitForTimeout(500);
    const edges = await page.evaluate(() => {
      const left = (el) => el.querySelector('.mo-list__item-leading')?.getBoundingClientRect().left ?? null;
      const open = document.querySelector('main button[aria-expanded="true"][aria-label^="Hide subpages of "]');
      const parent = open?.closest('li')?.querySelector('.mo-list__item-container');
      const kids = [...(open?.closest('li')?.parentElement?.children ?? [])]
        .map((li) => li.querySelector('.mo-list__item-container'))
        .filter((c) => c && c !== parent && left(c) > left(parent) - 1 && left(c) !== null);
      const gap = (c) => {
        const li = c.closest('li');
        return li.previousElementSibling
          ? c.querySelector('.mo-list__item-content').getBoundingClientRect().left -
              (li.getBoundingClientRect().left + parseFloat(getComputedStyle(li, '::before').marginLeft))
          : 0;
      };
      const all = [...document.querySelectorAll('main .mo-editor-section .mo-list__item-container')];
      return parent
        ? { parent: left(parent), child: kids.length ? left(kids[0]) : null, gaps: all.map((c) => gap(c)).filter((g) => Math.abs(g) > 1) }
        : null;
    });
    if (edges?.gaps.length)
      problems.push(
        `${label}: in the menu tree ${edges.gaps.length} divider(s) do not start where their row's text starts (${edges.gaps.map((g) => Math.round(g)).join(', ')} dp)`,
      );
    if (!edges || edges.child == null) problems.push(`${label}: no subpage row shows under the opened page`);
    else if (Math.abs(edges.child - edges.parent - 20) > 1)
      problems.push(`${label}: a subpage's leading edge is ${edges.child - edges.parent} dp right of its parent's, not 20`);
  }
  await page.close();
  // In Danish (the editor follows the browser's language) the lines name the versions in Danish. The demo has no page with a waiting draft, so "Udgivet · Kladde" (the two words joined by " · " in `versionsOf`) is tested by hand.
  const da = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'da-DK' });
  da.on('pageerror', (e) => problems.push(`${label} (da-DK): ${e.message}`));
  await openEditor(da, site);
  await da.evaluate(() => (location.hash = '#list/pages'));
  await da.waitForSelector('main .mo-editor-section .mo-list__item-container', { timeout: 30_000 }).catch(() => {});
  await da.waitForTimeout(1000);
  const lines = await da.evaluate(() =>
    [...document.querySelectorAll('main .mo-editor-section .mo-list__item-container')].map(
      (el) =>
        (el.querySelector('.mo-editor-library-under-status') ?? el.querySelector('.mo-list__item-supporting'))?.textContent?.trim() ?? '',
    ),
  );
  for (const line of lines)
    if (!/^(Udgivet|Kladde|Planlagt)/.test(line))
      problems.push(`${label} (da-DK): the line under a page names no version in Danish (${JSON.stringify(line)})`);
  await da.close();
}

export function register(unit) {
  for (const [w, h] of [
    [390, 844],
    [1280, 900],
  ])
    unit(`checkPageRowsList ${w}`, () => checkPageRowsList(w, h));
  for (const [w, h] of [
    [390, 844],
    [1280, 900],
  ])
    unit(`checkListItemLines ${w}`, () => checkListItemLines(w, h));
  for (const block of liveLists)
    for (const w of [375, 1280]) unit(`checkLiveList ${w} ${block.name}`, () => checkLiveList(w, w < 600 ? 740 : 900, block));
  for (const w of [375, 768, 1280]) unit(`checkListLeftEdge ${w}`, () => checkListLeftEdge(w));
  for (const w of [900, 1280]) unit(`checkListColumnsLook ${w}`, () => checkListColumnsLook(w));
  for (const w of [375, 768, 1280]) unit(`checkListButtonsRow ${w}`, () => checkListButtonsRow(w));
  for (const w of [375, 768, 1280]) unit(`checkOpenPlainExpand ${w}`, () => checkOpenPlainExpand(w));
  for (const w of [375, 768, 1280]) unit(`checkChevronRows ${w}`, () => checkChevronRows(w));
  for (const w of [768, 1280]) unit(`checkChevronUnderHoverRow ${w}`, () => checkChevronUnderHoverRow(w));
  unit('checkListRowColors', () => checkListRowColors());
  unit('checkDynamicList 375', () => checkDynamicList(375, 740));
  unit('checkDynamicList 1280', () => checkDynamicList(1280, 900));
  unit('checkDynamicPicker 375', () => checkDynamicPicker(375, 740));
  unit('checkDynamicPicker 1280', () => checkDynamicPicker(1280, 900));
  unit('checkOwnList 375', () => checkOwnList(375, 740));
  unit('checkListMenuOpens 375 touch', () => checkListMenuOpens(375, 740, true));
  unit('checkListMenuOpens 768', () => checkListMenuOpens(768, 900, false));
  unit('checkListMenuOpens 1280', () => checkListMenuOpens(1280, 900, false));
  unit('checkOwnList 1280', () => checkOwnList(1280, 900));
  unit('checkChecklistMarks', () => checkChecklistMarks());
  for (const [width, height] of [
    [375, 800],
    [1280, 900],
  ]) {
    unit(`checkExpandList ${width}`, () => checkExpandList(width, height));
    unit(`checkSectionsOnLoad ${width}`, () => checkSectionsOnLoad(width, height));
  }
  for (const w of [375, 1280]) unit(`checkListMarkers ${w}`, () => checkListMarkers(w));
  for (const w of [375, 768, 1280]) unit(`checkListColumns ${w}`, () => checkListColumns(w));
  for (const w of [375, 1280]) unit(`checkListsAndBlocks ${w}`, () => checkListsAndBlocks(w));
}
