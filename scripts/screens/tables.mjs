import { join } from 'node:path';
import { openEditor } from '../built-site.mjs';
import { browser, problems, shots, site } from './support/context.mjs';
import { barTools, onTestPage, pressInsert, pressMore, pressTool, saveOrClose } from './support/shared.mjs';

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
  await pressInsert(page, 'tap');
  await page.locator('dialog[open] button', { hasText: 'Show data in rows and columns.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-table-cell-active textarea');
  await page.keyboard.type('Plan');
  await page.waitForTimeout(300);
  const state = () =>
    page.evaluate(() => ({
      rows: document.querySelectorAll('.mo-editor-inline-table-box tr[data-row]').length,
      cells: document.querySelectorAll('.mo-editor-inline-table-box :is(th, td)').length,
      header: document.querySelectorAll('.mo-editor-inline-table-box thead th[scope="col"]').length,
      extra: [...document.querySelectorAll('.mo-editor-inline-table-host *')].filter(
        (e) =>
          e.hasAttribute('data-add-row') ||
          (e.children.length === 0 && /^(Next row|Next column|Add row)$/.test(e.textContent.trim())) ||
          ['placeholder', 'aria-label'].some((a) => /^(Next row|Next column|Add row)$/.test(e.getAttribute(a) ?? '')),
      ).length,
      faded: document.querySelectorAll('.mo-editor-inline-table-cell-next').length,
      outline: getComputedStyle(document.querySelector('.mo-editor-inline-table-cell-active')).outlineStyle,
      scroll:
        document.querySelector('.mo-editor-inline-table-box').scrollWidth <=
        document.querySelector('.mo-editor-inline-table-box').clientWidth + 1,
      bar: [...document.querySelectorAll('.mo-editor-tools button')].map((b) => ({
        label: b.getAttribute('aria-label'),
        title: b.title,
        svg: !!b.querySelector('svg path'),
        icon: [...b.querySelectorAll('svg path')].map((p) => p.getAttribute('d')).join('|'),
      })),
    }));
  const press = async (name) => {
    await pressTool(page, name, 'tap').catch(() => problems.push(`${label}: the bar has no button "${name}"`));
    await page.waitForTimeout(300);
  };
  const one = await state();
  // One typed cell: a header row with one cell, nothing added around it.
  if (one.rows !== 1 || one.cells !== 1) problems.push(`${label}: expected 1 row of 1 cell, got ${one.rows} rows and ${one.cells} cells`);
  if (one.header !== 1) problems.push(`${label}: expected a header row of 1 th cell, got ${one.header}`);
  if (one.extra || one.faded) problems.push(`${label}: the table has "Next row", "Next column" or "Add row" in it`);
  if (one.outline !== 'dotted') problems.push(`${label}: the active cell has outline ${one.outline}, not dotted`);
  // Row above and Row below are on a phone's bar, the column tools may be in its ⋮ (Insert block, Undo and Redo have their places).
  const tableTools = await barTools(page);
  for (const name of ['Add row above', 'Add row below', 'Add column before', 'Add column after'])
    if (!tableTools.names.includes(name)) problems.push(`${label}: the bar and its ⋮ have no "${name}"`);
  for (const name of ['Delete row', 'Delete column'])
    if ((await barTools(page)).names.includes(name)) problems.push(`${label}: "${name}" is offered for a one-cell table`);
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
  // Delete row and Delete column are on the bar when there is room, else in its ⋮ menu.
  const tools = await barTools(page);
  for (const name of ['Delete row', 'Delete column'])
    if (!tools.names.includes(name)) problems.push(`${label}: the bar and its ⋮ have no "${name}"`);
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
    const e = document.querySelector('.mo-editor-inline-table-box');
    const c = getComputedStyle(e);
    return { display: c.display, overflowX: c.overflowX, overflowY: c.overflowY, radius: parseFloat(c.borderTopLeftRadius) };
  });
  if (box.display !== 'block' || box.overflowX === 'visible' || box.overflowY === 'visible' || !(box.radius > 0))
    problems.push(`${label}: the table's box does not clip its header to the rounded corner (${JSON.stringify(box)})`);
  // The gear has "Striped rows" (off), and turning it on gives every second body row a background that the others and the header do not have.
  const rowBg = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.mo-editor-inline-table-box tbody tr')].map((r) => getComputedStyle(r).backgroundColor),
    );
  const plain = await rowBg();
  // The table's settings: the block's Edit, in the bar's ⋮ menu.
  await pressMore(page, 'Edit');
  const stripes = page.locator('dialog[open], .mo-editor-side-sheet').getByRole('switch', { name: 'Striped rows' });
  await stripes.waitFor({ timeout: 4000 }).catch(() => problems.push(`${label}: the table's settings have no "Striped rows" switch`));
  if ((await stripes.count()) && (await stripes.isChecked())) problems.push(`${label}: "Striped rows" is not off by default`);
  await stripes.click({ timeout: 3000 }).catch(() => {});
  await saveOrClose(page, 'last').catch(() => {});
  await page.waitForTimeout(400);
  const striped = await rowBg();
  if (!(await page.locator('.mo-editor-inline-table-box[data-striped]').count()))
    problems.push(`${label}: "Striped rows" on does not mark the table`);
  if (new Set(plain).size !== 1) problems.push(`${label}: rows have different backgrounds before "Striped rows" is on (${plain})`);
  if (striped.length < 2 || striped[0] === striped[1])
    problems.push(`${label}: with "Striped rows" on, the second body row has no background of its own (${striped})`);
  // Back in the table: a click in its first cell makes the block active again.
  await page.locator('.mo-editor-inline-table-box th textarea').first().click();
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    // The ghost copy of the tools that left is sliding out for a moment: it is not the bar's tools.
    menu: [...document.querySelectorAll('.mo-editor-tools [aria-label="Add row above"]')].filter(
      (b) => !b.closest('.mo-editor-tools-ghost'),
    ).length,
    extra: document.querySelectorAll('[data-add-row], .mo-editor-inline-table-cell-next').length,
    rows: document.querySelectorAll('.mo-editor-inline-table-box tr[data-row]').length,
    cols: document.querySelectorAll('.mo-editor-inline-table-box thead th').length,
  }));
  if (after.menu || after.extra) problems.push(`${label}: the menu or an add element stays after the cursor left the table`);
  // The added rows and columns are empty, so the table keeps only what was typed; the kept cells are the same on every redraw.
  if (after.rows < 1 || after.cols < 1)
    problems.push(`${label}: the table lost its cells after leaving (${after.rows} rows of ${after.cols})`);
  await page.close();
}

/** A Table's column alignment (375 and 1280 px): a column of numbers is right-aligned, header and cells, and a text column left, in the editor typed in place and on the built site (/blocks/); the bar's Align column left, Center column, Align column right and Align column automatically change the column of the active cell (the pressed one shown), and the choice is saved with the block (`columns`, a second save writes the same text). */
async function checkTableAlign(width, height) {
  const label = `${width}px table alignment`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  // The built site: the demo's Table has a column of numbers (Editors) and text columns.
  const built =
    (await onTestPage(page, label)) &&
    (await page.evaluate(() => {
      const at = (sel) => getComputedStyle(document.querySelector(sel)).textAlign;
      return {
        textHead: at('.mo-block-table__grid thead th:nth-child(1)'),
        textCell: at('.mo-block-table__grid tbody tr:first-child td:nth-child(1)'),
        numberHead: at('.mo-block-table__grid thead th:nth-child(3)'),
        numberCell: at('.mo-block-table__grid tbody tr:first-child td:nth-child(3)'),
        mixedCell: at('.mo-block-table__grid tbody tr:first-child td:nth-child(2)'),
      };
    }));
  const start = (v) => v === 'start' || v === 'left';
  const end = (v) => v === 'end' || v === 'right';
  if (built && (!start(built.textHead) || !start(built.textCell)))
    problems.push(`${label}: the site's text column is not left-aligned (${built.textHead}, ${built.textCell})`);
  if (built && (!end(built.numberHead) || !end(built.numberCell)))
    problems.push(`${label}: the site's number column is not right-aligned (${built.numberHead}, ${built.numberCell})`);
  if (built && !start(built.mixedCell))
    problems.push(`${label}: a column with a word in it is not left-aligned on the site (${built.mixedCell})`);
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
  await pressInsert(page, 'tap');
  await page.locator('dialog[open] button', { hasText: 'Show data in rows and columns.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-table-cell-active textarea');
  const cellField = (r, c) => page.locator(`.mo-editor-inline-table-box [data-row="${r}"] [data-field="${c}"]`);
  const menu = async (name) => {
    await pressTool(page, name);
    await page.waitForTimeout(250);
  };
  // The table is made with the menu (no Next row or Next column in it): Text | Number, and two rows under them.
  await page.keyboard.type('Text');
  await menu('Add column after');
  await page.keyboard.type('Number');
  await menu('Add row below');
  await page.keyboard.type('7');
  await menu('Add row below');
  await page.keyboard.type('7');
  await cellField(1, 0).click();
  await page.keyboard.type('a');
  const aligns = () =>
    page.evaluate(() => {
      const at = (sel) => getComputedStyle(document.querySelector(sel)).textAlign;
      return {
        textHead: at('.mo-editor-inline-table-box thead th:nth-child(1)'),
        numberHead: at('.mo-editor-inline-table-box thead th:nth-child(2)'),
        numberCell: at('.mo-editor-inline-table-box [data-row="1"] td:nth-child(2)'),
        numberField: at('.mo-editor-inline-table-box [data-row="1"] td:nth-child(2) textarea'),
      };
    });
  const auto = await aligns();
  if (!start(auto.textHead)) problems.push(`${label}: the editor's text column is not left-aligned (${auto.textHead})`);
  if (!end(auto.numberHead) || !end(auto.numberCell) || !end(auto.numberField))
    problems.push(`${label}: the editor's number column is not right-aligned (${JSON.stringify(auto)})`);
  // The bar changes the column of the active cell.
  // The pressed alignment: the bar's buttons (aria-pressed) on a computer, the rows of its ⋮ menu (aria-checked) on a phone.
  const bar = async () => {
    const { bar: buttons, more } = await barTools(page);
    return Object.fromEntries(
      [
        ...buttons.filter((b) => b.pressed !== null).map((b) => [b.label, b.pressed]),
        ...more.filter((m) => m.pressed !== null).map((m) => [m.label, m.pressed]),
      ].filter(([name]) => /column/.test(name) && /lign|Center/.test(name)),
    );
  };
  await cellField(1, 1).click();
  const names = ['Align column left', 'Center column', 'Align column right', 'Align column automatically'];
  const first = await bar();
  for (const n of names) if (!(n in first)) problems.push(`${label}: the bar has no "${n}" button (${Object.keys(first)})`);
  if (first['Align column automatically'] !== 'true')
    problems.push(`${label}: Automatic is not shown pressed on a column without a choice`);
  const press = async (name) => {
    await pressTool(page, name);
    await page.waitForTimeout(300);
  };
  await press('Align column left');
  const left = await aligns();
  if (!start(left.numberHead) || !start(left.numberCell))
    problems.push(`${label}: Align column left left the number column ${JSON.stringify(left)}`);
  if (!start(left.textHead)) problems.push(`${label}: another column changed with Align column left (${left.textHead})`);
  if ((await bar())['Align column left'] !== 'true') problems.push(`${label}: Align column left is not shown pressed after it was chosen`);
  await press('Center column');
  if ((await aligns()).numberCell !== 'center') problems.push(`${label}: Center column did not center the number column`);
  await page.screenshot({ path: join(shots, `table-align-${width}.png`) });
  await press('Align column right');
  await press('Align column automatically');
  if (!end((await aligns()).numberCell))
    problems.push(`${label}: Align column automatically did not bring back the right alignment of numbers`);
  // Centre the text column and save: the choice is in the saved text, and a second save writes the same.
  await cellField(0, 0).click();
  await press('Center column');
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  const saved = async () => {
    const before = commits.length;
    // A page with nothing changed has no Save to press: nothing is written a second time.
    if (!(await page.locator('button', { hasText: /^Save$/ }).count())) return [];
    await page
      .locator('button', { hasText: /^Save$/ })
      .first()
      .evaluate((b) => b.click());
    await page.waitForTimeout(900);
    return commits.slice(before).flatMap((c) => c.changes.map((x) => Buffer.from(x.content ?? '', 'base64').toString('utf8')));
  };
  const one = await saved();
  const text = one.find((t) => t.includes('data-block="table"')) ?? '';
  if (!/columns[^\]]*center/.test(text)) problems.push(`${label}: the saved page does not carry the column's alignment`);
  if (/columns[^\]]*right/.test(text)) problems.push(`${label}: an automatic column was saved with a fixed alignment`);
  const two = await saved();
  if (two.length && two.join() !== one.join()) problems.push(`${label}: a second save wrote another text`);
  await page.close();
}

/** The Table's outer box has the same corner radius as a card (the Cards block's `.mo-card`: both read the theme's --mo-comp-elevated-card-container-shape), with its header clipped to it, on the built site at 375 and 1280 px. */
async function checkTableRadius(width, height) {
  const label = `${width}px table radius`;
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const got = await page.evaluate(() => {
    const card = document.querySelector('.mo-card.mo-block-cards__card');
    const host = card?.parentElement;
    if (!host) return null;
    const box = document.createElement('div');
    box.className = 'mo-block-table mo-block-table__grid';
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

export function register(unit) {
  unit('checkInlineTable 375', () => checkInlineTable(375, 740));
  unit('checkInlineTable 1280', () => checkInlineTable(1280, 800));
  unit('checkTableAlign 375', () => checkTableAlign(375, 740));
  unit('checkTableAlign 1280', () => checkTableAlign(1280, 800));

  unit('checkTableRadius 375', () => checkTableRadius(375, 740));
  unit('checkTableRadius 1280', () => checkTableRadius(1280, 800));
}
