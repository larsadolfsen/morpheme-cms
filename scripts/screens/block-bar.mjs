import { openEditor } from '../built-site.mjs';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, browser, problems, site } from './support/context.mjs';
import { barSmallTargets, barTools, cancelOf, insertBlock, newLineUnder, pressInsert, pressMore, pressTool } from './support/shared.mjs';

/** A card that is not typed in place (HTML code here; an image, Testimonials and the like work the same) has its tools on the text's one bar (PR 4 of the contextual toolbar plan): a tap on it selects it
 * (marked, no pop-up on the card), the bar gets a group named by the block, its Edit as the gear (on a phone; from expanded a tap opens the side panel) and the rest of its menu (Move up, Remove) in the ⋮,
 * the gear opens the block's sheet, Move up keeps the moved card selected, and a tap in the text brings the text tools back. */
async function checkCardBar(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px card bar`;
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
  await page.locator('dialog[open] button', { hasText: 'Add a video or calendar.' }).first().click();
  // The block's fields are in a sheet on a phone (Insert puts it in) and in the live side panel from expanded (it is in already; the close button closes the panel).
  const sheet = page
    .locator('dialog[open], .mo-editor-side-sheet')
    .filter({ has: page.locator('textarea') })
    .last();
  await sheet.locator('textarea').fill('<iframe src="https://www.youtube.com/embed/abc" title="Clip"></iframe>');
  if (phone) await sheet.locator('button', { hasText: /^Insert$/ }).click();
  else await sheet.locator('[data-side-sheet-close]').click();
  await page.waitForSelector('.ProseMirror .mo-site-block-card', { timeout: 6000 });
  await page.locator('.ProseMirror .mo-site-block-card').first().click();
  await page.waitForTimeout(400);
  const selected = await page.evaluate(() => ({
    pressed: document.querySelectorAll('.mo-site-block-card[aria-pressed="true"], .mo-site-block-card-button[aria-pressed="true"]').length,
    popup: document.querySelectorAll('.mo-site-block-menu').length,
    haspopup: document.querySelectorAll('.mo-site-block-card[aria-haspopup], .mo-site-block-card-button[aria-haspopup]').length,
    groups: [...document.querySelectorAll('.mo-editor-tools [role=group]')].map((g) => g.getAttribute('aria-label')),
  }));
  if (selected.pressed !== 1) problems.push(`${label}: a tap on the card did not select it (${selected.pressed} selected)`);
  if (selected.popup || selected.haspopup) problems.push(`${label}: the card still has a pop-up menu of its own`);
  if (!selected.groups.length || selected.groups[0] === 'Text tools')
    problems.push(`${label}: the bar's first group is "${selected.groups}", not the block's name`);
  const tools = await barTools(page);
  if (tools.bar.some((b) => b.height < 39.4 || b.width < 39.4)) problems.push(`${label}: a button of the card's bar is under 40 x 40 dp`);
  const small = await barSmallTargets(page, width < 600);
  if (small.length) problems.push(`${label}: a target of the card's bar is under ${width < 600 ? 48 : 44} dp (${small})`);
  // Remove is in the card's ⋮ at every width (from expanded the side sheet has none).
  if (!tools.names.includes('Remove')) problems.push(`${label}: the card's menu has no Remove (${tools.names})`);
  const rowNames = await page
    .locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row]')
    .evaluateAll((els) => els.map((e) => (e.querySelector(':scope > .mo-site-block-card-button') ?? e).getAttribute('aria-label')));
  if (!rowNames.includes('Move up')) problems.push(`${label}: the card's action row has no Move up (${rowNames})`);
  if (tools.names.includes('Move up') || tools.names.includes('Hide'))
    problems.push(`${label}: Move up or Hide is in the bar as well as in the action row (${tools.names})`);
  if (tools.names.filter((n) => n === 'More').length !== 1) problems.push(`${label}: the bar has no single ⋮ (${tools.names})`);
  if (phone) {
    // Its settings are Block settings in the action row, and not on the bar or in the ⋮ again; the button opens the block's sheet.
    if (!rowNames.includes('Block settings') && !rowNames.includes('Edit'))
      problems.push(`${label}: the card's settings are not in the action row (${rowNames})`);
    if (tools.names.includes('Edit') || tools.names.includes('Block settings'))
      problems.push(`${label}: the card's settings are on the bar or in the ⋮ as well as in the row (${tools.names})`);
    await pressTool(page, 'Edit', 'tap');
    await page
      .waitForSelector('dialog[open] textarea', { timeout: 4000 })
      .catch(() => problems.push(`${label}: the gear did not open the block's sheet`));
    // On a phone the sheet is a subpage: its back arrow leaves it.
    await cancelOf(page.locator('dialog[open]'))
      .click({ timeout: 3000 })
      .catch(() => {});
    await page.waitForTimeout(300);
  }
  // Move up: the card goes above the text and stays selected, its tools on the bar.
  await pressMore(page, 'Move up', phone ? 'tap' : 'click');
  await page.waitForTimeout(500);
  const moved = await page.evaluate(() => {
    const card = document.querySelector('.ProseMirror .mo-site-block-card')?.getBoundingClientRect();
    const hello = [...document.querySelectorAll('.ProseMirror p')].find((p) => p.textContent.trim() === 'Hello')?.getBoundingClientRect();
    return {
      first: !!card && !!hello && card.top < hello.top,
      pressed: document.querySelectorAll('.mo-site-block-card[aria-pressed="true"], .mo-site-block-card-button[aria-pressed="true"]')
        .length,
      group: document.querySelector('.mo-editor-tools [role=group]')?.getAttribute('aria-label'),
    };
  });
  if (!moved.first) problems.push(`${label}: Move up in the ⋮ did not move the card above the text`);
  if (moved.pressed !== 1 || moved.group === 'Text tools')
    problems.push(`${label}: the moved card is not selected with its tools on the bar (${JSON.stringify(moved)})`);
  // A tap in the text: the card is let go and the text tools are back.
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(500);
  const back = await page.evaluate(() => ({
    pressed: document.querySelectorAll('.mo-site-block-card[aria-pressed="true"], .mo-site-block-card-button[aria-pressed="true"]').length,
    names: [...document.querySelectorAll('.mo-editor-tools button')]
      .filter((b) => !b.closest('.mo-editor-tools-ghost'))
      .map((b) => b.getAttribute('aria-label')),
  }));
  if (back.pressed || !back.names.includes('Bold'))
    problems.push(`${label}: a tap in the text did not let the card go and bring the text tools back (${JSON.stringify(back)})`);
  await page.close();
}

/** A block typed in place has its tools on the text's one bar (PR 2 of the contextual toolbar plan): with a List active the bar has the block's group (named by the block), Add above and Add below as 44 x 44 dp buttons, no floating bar anywhere, the block's own menu (Hide, Remove) in the ⋮ (never a second ⋮ on the card), Undo and Redo, no scrolling; the cursor back in the text brings the text tools back. */
async function checkBlockBar(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px block bar`;
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
  const { bar, more, names } = await barTools(page);
  const group = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-editor-tools [role=group]')].map((g) => g.getAttribute('aria-label')),
  );
  if (group[0] === 'Text tools' || !group.length) problems.push(`${label}: the bar's first group is "${group}", not the block's name`);
  for (const name of ['Add above', 'Add below', 'Undo', 'Redo'])
    if (!bar.some((b) => b.label === name && b.svg))
      problems.push(`${label}: the bar has no icon button "${name}" (${bar.map((b) => b.label)})`);
  if (bar.some((b) => b.height < 39.4 || b.width < 39.4)) problems.push(`${label}: a button of the block's bar is under 40 x 40 dp`);
  const small = await barSmallTargets(page, width < 600);
  if (small.length) problems.push(`${label}: a target of the block's bar is under ${width < 600 ? 48 : 44} dp (${small})`);
  // The List's tools in the owner's order (14 Nov), the bar's first and then the ⋮'s: Add below, Add above, Settings (Edit), Fill from a list, Move up, Move down;
  // Undo, Redo, Insert block and the ⋮ close the bar, with no divider.
  const order = ['Add below', 'Add above', 'Edit'];
  const seen = names.filter((n) => order.includes(n));
  if (seen.join() !== order.filter((n) => seen.includes(n)).join())
    problems.push(`${label}: the block's tools read ${seen.join(', ')}, not in the order ${order.join(', ')}`);
  if (names.indexOf('Add below') > names.indexOf('Add above')) problems.push(`${label}: Add below does not come before Add above`);
  // Move up, Move down and Hide are in the block's action row (blockRow.ts), never on the bar or in the ⋮ as well.
  const listRow = await page
    .locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  for (const name of ['Move up', 'Move down', 'Hide'])
    if (!listRow.includes(name)) problems.push(`${label}: the action row has no "${name}" (${listRow})`);
  for (const name of ['Move up', 'Move down', 'Hide'])
    if (names.includes(name)) problems.push(`${label}: "${name}" is on the bar or in the ⋮ as well as in the action row`);
  if (!more.length) problems.push(`${label}: the ⋮ has no rows`);
  for (const name of ['Remove']) if (!names.includes(name)) problems.push(`${label}: the block's own menu has no "${name}" (${names})`);
  if (bar.filter((b) => b.label === 'More').length !== 1)
    problems.push(`${label}: the bar has ${bar.filter((b) => b.label === 'More').length} ⋮ buttons, not 1`);
  const state = await page.evaluate(() => ({
    floating: document.querySelectorAll('.mo-editor-contextual-menu').length,
    handle: document.querySelectorAll('.mo-site-block-inline [aria-haspopup="menu"]').length,
    scrolls: document.querySelector('.mo-editor-tools').scrollWidth > document.querySelector('.mo-editor-tools').clientWidth + 2,
    pageScrolls: document.documentElement.scrollWidth > innerWidth,
  }));
  if (state.floating) problems.push(`${label}: a floating contextual menu is on the page`);
  if (state.handle) problems.push(`${label}: the card has a menu handle of its own`);
  if (state.scrolls || state.pageScrolls) problems.push(`${label}: the bar or the page scrolls sideways`);
  // Undo on the bar works while the block is active.
  await pressTool(page, 'Undo', phone ? 'tap' : 'click');
  await page.waitForTimeout(200);
  // The cursor back in the text: the text tools return.
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  const back = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-editor-tools button')].map((b) => b.getAttribute('aria-label')),
  );
  if (!back.includes('Bold') || back.includes('Add above'))
    problems.push(`${label}: after leaving the block the bar has ${back} and not the text tools`);
  await page.close();
}

/**
 * Selecting several rows (useSelection.ts, SelectionBar.tsx) on the pages list and in the notifications' sheet. At 375 with
 * touch: a press and hold selects, a tap adds without opening the row, unselecting all or Close ends it, a press that
 * moves does nothing, the count is announced, the bar's buttons are at least 44 px. At 1280 with a mouse: a mouse
 * press and hold does nothing, Space toggles, Shift+click adds a range, Ctrl+A selects all, Escape unselects (in the
 * sheet it does not close it), and a click on a row with nothing selected opens it.
 */
async function checkSelection() {
  const seed = () =>
    localStorage.setItem(
      'editor-notifications',
      JSON.stringify({
        items: [3, 2, 1].map((n) => ({ text: `Selection check ${n}`, type: 'saved', at: Date.now() - n * 60000 })),
        seen: 0,
        told: [],
      }),
    );
  const count = (page) =>
    page
      .locator('[role=status]')
      .filter({ hasText: /\d+ selected/ })
      .first()
      .textContent();
  const checked = (page, scope) => page.locator(`${scope} [role=checkbox][aria-checked=true]`).count();
  // The swapped top bar's select-all box (SelectionBar.tsx), with one row selected: indeterminate, 48 px, the bar never
  // scrolls sideways; ticking selects all, unticking selects none and ends selecting, and the bar's buttons are 48 px.
  const barCheck = async (page, label, rows, stays) => {
    const box = page.getByRole('checkbox', { name: 'Select all' });
    if ((await box.count()) !== 1) return problems.push(`${label}: the top bar has no select-all checkbox`);
    if (!(await box.evaluate((el) => el.indeterminate)))
      problems.push(`${label}: the select-all checkbox is not indeterminate with one row selected`);
    const target = await box.evaluate((el) => {
      const r = el.closest('label').getBoundingClientRect();
      return [r.width, r.height];
    });
    if (target[0] < 48 || target[1] < 48) problems.push(`${label}: the select-all target is ${target[0]}x${target[1]}, under 48 px`);
    for (const name of ['Close selection', /^Delete 1 selected$/]) {
      const b = await page.getByRole('button', { name }).first().boundingBox();
      if (!b || b.width < 48 || b.height < 48) problems.push(`${label}: "${name}" is under 48 px (${b?.width}x${b?.height})`);
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth))
      problems.push(`${label}: the page scrolls sideways while selecting`);
    // While selecting, the top bar has only the selection's own actions (Close selection, Select all, Delete); the screen's
    // History, the notifications' bell and the like are not drawn. The menu button, back arrow and logo at the start are navigation.
    const stray = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      return [...document.querySelectorAll('header button, header [role=checkbox], header input')]
        .filter(visible)
        .map((el) => el.getAttribute('aria-label') || el.closest('label')?.textContent?.trim() || el.textContent?.trim() || el.title)
        .filter((n) => !/^(Close selection|Select all|Delete \d+ selected|Open menu|Close menu)$/.test(n || ''));
    });
    if (stray.length) problems.push(`${label}: the top bar shows more than the selection's actions while selecting: ${stray.join(', ')}`);
    await box.check();
    const total = await rows.count();
    if ((await checked(page, 'main')) !== total || (await box.evaluate((el) => el.indeterminate || !el.checked)))
      problems.push(`${label}: ticking select all does not select all ${total} rows`);
    await box.click();
    await page.waitForTimeout(200);
    if ((await checked(page, 'main')) !== 0 || (await box.count()) !== (stays ? 1 : 0))
      problems.push(
        `${label}: unticking select all does not unselect all ${stays ? 'and stay in selecting (started with Select)' : 'and end selecting (started on a row)'}`,
      );
  };
  for (const w of [375, 1280]) {
    const touch = w < 600;
    const label = `selection ${w}`;
    const page = await browser.newPage({ viewport: { width: w, height: 800 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await page.addInitScript(seed);
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#list/pages'));
    await page.waitForSelector('main a.mo-list__item-container');
    await page.waitForTimeout(500);
    const rows = page.locator('main a.mo-list__item-container');
    const centre = async (i) => {
      const row = rows.nth(i);
      await row.scrollIntoViewIfNeeded();
      const b = await row.boundingBox();
      return [b.x + b.width / 2, b.y + b.height / 2];
    };
    const hash = () => page.evaluate(() => location.hash);
    const here = await hash();
    if (touch) {
      const cdp = await page.context().newCDPSession(page);
      const hold = async (x, y, move = 0) => {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await page.waitForTimeout(250);
        if (move) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + move }] });
        await page.waitForTimeout(500);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(300);
      };
      const [x0, y0] = await centre(0);
      await hold(x0, y0, 20);
      if ((await checked(page, 'main')) || (await hash()) !== here)
        problems.push(`${label}: a press and hold that moves 20 px selected or opened the row`);
      await hold(x0, y0);
      if ((await rows.nth(0).getAttribute('aria-checked')) !== 'true') problems.push(`${label}: a press and hold does not select the row`);
      if ((await hash()) !== here) problems.push(`${label}: a press and hold opened the row`);
      if (!/^1 selected$/.test((await count(page)) ?? '')) problems.push(`${label}: the count is not announced ("1 selected")`);
      const [x1, y1] = await centre(1);
      await page.touchscreen.tap(x1, y1);
      await page.waitForTimeout(300);
      if ((await hash()) !== here) problems.push(`${label}: a tap on a second row opened it while selecting`);
      if ((await checked(page, 'main')) !== 2) problems.push(`${label}: a tap on a second row does not add it`);
      for (const name of ['Close selection', /^Delete 2 selected$/]) {
        const b = await page.getByRole('button', { name }).first().boundingBox();
        if (!b || b.width < 44 || b.height < 44) problems.push(`${label}: "${name}" is smaller than 44 px (${b?.width}x${b?.height})`);
      }
      await page.touchscreen.tap(x0, y0);
      await page.touchscreen.tap(x1, y1);
      await page.waitForTimeout(300);
      if (await page.getByRole('button', { name: /^Delete \d+ selected$/ }).count())
        problems.push(`${label}: unselecting all does not end selecting`);
      await hold(x0, y0);
      await page.getByRole('button', { name: 'Close selection' }).click();
      if (await checked(page, 'main')) problems.push(`${label}: Close selection does not unselect`);
      await hold(x0, y0);
      await barCheck(page, label, rows, false);
      // Back leaves selecting first and stays on the list; a second Back leaves the list. Close left no step behind.
      await hold(x0, y0);
      await page.goBack();
      await page.waitForTimeout(400);
      if ((await hash()) !== here || (await checked(page, 'main')) || (await page.getByRole('button', { name: 'Close selection' }).count()))
        problems.push(`${label}: Back does not leave selecting first and stay on the list (${await hash()})`);
      await page.goBack();
      await page.waitForTimeout(400);
      if ((await hash()) === here) problems.push(`${label}: a second Back does not leave the list (Close or Back left a step behind)`);
    } else {
      const [x0, y0] = await centre(0);
      await page.mouse.move(x0, y0);
      await page.mouse.down();
      await page.waitForTimeout(700);
      await page.mouse.up();
      await page.waitForTimeout(300);
      // A mouse press and hold is a click (it follows the link), never a selection.
      if (await checked(page, 'main')) problems.push(`${label}: a mouse press and hold selected the row`);
      if ((await hash()) !== here) {
        await page.evaluate((h) => (location.hash = h), here);
        await page.waitForSelector('main a.mo-list__item-container');
        await page.waitForTimeout(500);
      }
      // The list's header has no Select button: selecting starts from a row (Space on a focused row here).
      if (await page.getByRole('button', { name: 'Select', exact: true }).count())
        problems.push(`${label}: the header still has a Select button`);
      await rows.nth(0).focus();
      await page.keyboard.press('Space');
      if ((await rows.nth(0).getAttribute('aria-checked')) !== 'true') problems.push(`${label}: Space does not select the row in focus`);
      if (!/^1 selected$/.test((await count(page)) ?? '')) problems.push(`${label}: the count is not announced ("1 selected")`);
      await rows.nth(2).click({ modifiers: ['Shift'] });
      if ((await checked(page, 'main')) !== 3 || (await hash()) !== here)
        problems.push(`${label}: Shift+click does not select the range (${await checked(page, 'main')})`);
      await page.keyboard.press('Control+a');
      const all = await rows.count();
      if ((await checked(page, 'main')) !== all) problems.push(`${label}: Ctrl+A does not select all shown rows`);
      await page.keyboard.press('Escape');
      if (await checked(page, 'main')) problems.push(`${label}: Escape does not unselect`);
      if (await page.getByRole('button', { name: 'Close selection' }).count()) problems.push(`${label}: Escape does not end selecting`);
      await rows.nth(0).focus();
      await page.keyboard.press('Space');
      await barCheck(page, label, rows, false);
      await rows.nth(0).focus();
      await page.keyboard.press('Space');
      await page.getByRole('button', { name: 'Close selection' }).click();
      await rows.nth(0).focus();
      await page.keyboard.press('Shift+ArrowDown');
      if ((await checked(page, 'main')) !== 2) problems.push(`${label}: Shift+Arrow does not select a range`);
      await page.keyboard.press('Escape');
      await rows.nth(0).click();
      await page.waitForTimeout(300);
      if ((await hash()) === here) problems.push(`${label}: a click on a row with nothing selected does not open it`);
    }
    // The notifications' sheet.
    await page.evaluate(() => (location.hash = '#'));
    await page
      .getByRole('button', { name: /^Notifications/ })
      .first()
      .click();
    // Below 600 dp the notifications are a page (route notifications), from 600 dp a side sheet.
    const onPage = (page.viewportSize()?.width ?? 0) < 600;
    const sheet = onPage ? page.locator('main') : page.getByRole('dialog', { name: 'Notifications' });
    const scope = onPage ? 'main' : 'dialog';
    await sheet.waitFor();
    await page.waitForTimeout(600);
    const items = sheet.locator('[role=checkbox], .mo-list__item-container', { hasText: /Selection check/ });
    // "Clear" is a text button (lowest emphasis); "Delete selected", shown while some are selected, is an outlined error button.
    const buttonKind = async (name, what, kind, error) => {
      const button = page.getByRole('button', { name }).first();
      const cls = (await button.count()) ? ((await button.getAttribute('class')) ?? '') : '';
      if (!new RegExp(`\\bmo-is-${kind}\\b`).test(cls) || /\bmo-is-error\b/.test(cls) !== error)
        problems.push(`${label}: the notifications' ${what} is not a ${kind}${error ? ' error' : ''} button (${cls || 'not found'})`);
    };
    const outlinedError = (name, what) => buttonKind(name, what, 'outlined', true);
    await buttonKind(/^Clear$/, 'Clear', 'text', false);
    if ((await items.count()) !== 3) {
      problems.push(`${label}: the notifications sheet does not show the three seeded notifications`);
    } else if (touch) {
      const cdp = await page.context().newCDPSession(page);
      const b = await items.nth(0).boundingBox();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
      await page.waitForTimeout(800);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(300);
      if ((await checked(page, scope)) !== 1) problems.push(`${label}: a press and hold does not select a notification`);
      const b2 = await items.nth(1).boundingBox();
      await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2);
      await page.waitForTimeout(300);
      if (!/^2 selected$/.test((await count(page)) ?? ''))
        problems.push(`${label}: the notifications' count is not announced ("2 selected")`);
      // On a phone the delete is the top bar's icon button; the outlined one is in the dialog (below).
      await page.getByRole('button', { name: 'Close selection' }).click();
      if (await checked(page, scope)) problems.push(`${label}: Cancel does not unselect the notifications`);
    } else {
      await items.nth(0).focus();
      await page.keyboard.press('Space');
      if (await checked(page, scope)) problems.push(`${label}: Space selected a notification before selecting had started`);
      await items.nth(0).click({ modifiers: ['Shift'] });
      await items.nth(1).focus();
      await page.keyboard.press('Space');
      if ((await checked(page, scope)) !== 2) problems.push(`${label}: Shift+click and Space do not select notifications`);
      await outlinedError(/^Delete \d+ selected$/, 'Delete selected');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      if (await checked(page, scope)) problems.push(`${label}: Escape does not unselect the notifications`);
      if (!(await sheet.isVisible())) problems.push(`${label}: Escape with some selected closed the notifications' sheet`);
    }
    await page.close();
  }
}

/** A long press and drag across rows (useLongPress onDrag, useSelection drag): at 375 with real touch events, a finger held for the long press
 * and dragged over more rows selects each row it passes without the page scrolling under it, held near the bottom of the screen it scrolls the
 * list by itself and goes on selecting, and a finger that moves before the hold scrolls the page and selects nothing. A mouse drag selects
 * nothing. */
async function checkDragSelect() {
  const label = 'drag select 375';
  const page = await browser.newPage({ viewport: { width: 375, height: 560 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#list/pages'));
  await page.waitForSelector('main a.mo-list__item-container');
  await page.waitForTimeout(600);
  const rows = page.locator('main a.mo-list__item-container.mo-list__item-selectable');
  if ((await rows.count()) < 4) {
    problems.push(`${label}: fewer than 4 selectable rows`);
    await page.close();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const send = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const scrollTop = () =>
    page.evaluate(() => Math.round(document.scrollingElement.scrollTop + (document.querySelector('main')?.scrollTop ?? 0)));
  const checked = () => page.locator('main [role=checkbox][aria-checked=true]').count();
  const centre = async (i) => {
    const b = await rows.nth(i).boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  const at0 = await scrollTop();
  const [x0, y0] = await centre(0);
  // A swipe at once scrolls the page and selects nothing.
  await send('touchStart', x0, y0 + 200);
  for (let i = 1; i <= 8; i++) {
    await send('touchMove', x0, y0 + 200 - i * 20);
    await page.waitForTimeout(30);
  }
  await send('touchEnd');
  await page.waitForTimeout(400);
  if (await checked()) problems.push(`${label}: a swipe selected a row`);
  const scrollable = (await scrollTop()) > at0;
  if (!scrollable) problems.push(`${label}: a swipe no longer scrolls the page (or the list is too short to check)`);
  await page.evaluate(() => {
    document.scrollingElement.scrollTop = 0;
    document.querySelector('main')?.scrollTo?.(0, 0);
  });
  await page.waitForTimeout(300);
  // Hold, then drag over the next two rows.
  const [x1, y1] = await centre(0);
  const [, y2] = await centre(2);
  const before = await scrollTop();
  await send('touchStart', x1, y1);
  await page.waitForTimeout(650);
  for (let i = 1; i <= 10; i++) {
    await send('touchMove', x1, y1 + ((y2 - y1) * i) / 10);
    await page.waitForTimeout(40);
  }
  const mid = await checked();
  await send('touchEnd');
  await page.waitForTimeout(300);
  if (mid !== 3) problems.push(`${label}: a long press and drag over 3 rows selected ${mid}`);
  if ((await scrollTop()) !== before) problems.push(`${label}: the page scrolled under the finger during the drag`);
  await page.getByRole('button', { name: 'Close selection' }).click();
  await page.waitForTimeout(300);
  // Held near the bottom edge: the list scrolls by itself and goes on selecting.
  const [x3, y3] = await centre(0);
  await send('touchStart', x3, y3);
  await page.waitForTimeout(650);
  const edge = 560 - 12;
  for (let i = 1; i <= 8; i++) {
    await send('touchMove', x3, y3 + ((edge - y3) * i) / 8);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1200);
  const scrolled = (await scrollTop()) > before + 50;
  const many = await checked();
  await send('touchEnd');
  await page.waitForTimeout(300);
  if (!scrolled) problems.push(`${label}: held near the bottom edge the list did not scroll by itself`);
  if (many < 5) problems.push(`${label}: scrolling by itself did not go on selecting (${many} rows)`);
  await page.close();
}

/** Two-finger touch (useLongPress, longPressRules.mjs secondFinger): at 375 with real touch events, a second finger put down on a row while the
 * first rests on it selects it at once (well before the 500 ms hold) and opens nothing; a second finger on another row selects nothing; a
 * second finger after the first has moved away selects nothing. */
async function checkTwoFinger() {
  const label = 'two-finger select 375';
  const page = await browser.newPage({ viewport: { width: 375, height: 700 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#list/pages'));
  await page.waitForSelector('main a.mo-list__item-container');
  await page.waitForTimeout(600);
  const rows = page.locator('main a.mo-list__item-container.mo-list__item-selectable');
  if ((await rows.count()) < 2) {
    problems.push(`${label}: fewer than 2 selectable rows`);
    await page.close();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  const here = await page.evaluate(() => location.hash);
  const checked = () => page.locator('main [role=checkbox][aria-checked=true]').count();
  const centre = async (i) => {
    const b = await rows.nth(i).boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  const [x0, y0] = await centre(0);
  const [x1, y1] = await centre(1);
  // Both fingers on the first row.
  await touch('touchStart', [{ x: x0, y: y0, id: 0 }]);
  await page.waitForTimeout(100);
  await touch('touchStart', [
    { x: x0, y: y0, id: 0 },
    { x: x0 + 40, y: y0, id: 1 },
  ]);
  await page.waitForTimeout(150);
  if ((await checked()) !== 1) problems.push(`${label}: a second finger on the same row does not select it at once`);
  await touch('touchEnd', []);
  await page.waitForTimeout(300);
  if ((await page.evaluate(() => location.hash)) !== here) problems.push(`${label}: the two-finger touch opened the row`);
  const close = page.getByRole('button', { name: 'Close selection' });
  if (await close.count()) {
    await close.click();
    await page.waitForTimeout(300);
  }
  // The second finger on another row.
  await touch('touchStart', [{ x: x0, y: y0, id: 0 }]);
  await page.waitForTimeout(100);
  await touch('touchStart', [
    { x: x0, y: y0, id: 0 },
    { x: x1, y: y1, id: 1 },
  ]);
  await page.waitForTimeout(150);
  await touch('touchEnd', []);
  await page.waitForTimeout(300);
  if (await checked()) problems.push(`${label}: a second finger on another row selected a row`);
  if ((await page.evaluate(() => location.hash)) !== here) {
    await page.evaluate((h) => (location.hash = h), here);
    await page.waitForSelector('main a.mo-list__item-container');
    await page.waitForTimeout(500);
  }
  await page.close();
}

/** The opacity of the handle of the block at `index`, read once it is `want` and no transition runs on it (the handle fades): the wait is for that condition, never a
 * fixed time and never two equal reads, which a stalled frame also gives. After 3 s it returns what the handle shows, so the caller reports it. */
async function handleOpacity(page, index, want) {
  await page
    .waitForFunction(
      ([i, o]) => {
        const el = document.querySelectorAll('.ProseMirror .mo-site-block-handle')[i];
        return !!el && getComputedStyle(el).opacity === o && el.getAnimations().length === 0;
      },
      [index, want],
      { timeout: 3000 },
    )
    .catch(() => {});
  return page
    .locator('.ProseMirror .mo-site-block-handle')
    .nth(index)
    .evaluate((el) => getComputedStyle(el).opacity);
}

/** Dragging a block by its handle (blockHandle in MarkdownEditor.tsx): every block has a handle at its top left corner, at least 48 px, shown on the active block (not on one a mouse only points at, where it would cover the first item); dragging it above the block before moves the block there (the order in the text changes), a tap on it
 * does nothing. A touch drag is made with real touch events. */
async function checkBlockDrag(width) {
  const label = `block drag ${width}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const insert = (hint, count, at) => insertBlock(page, hint, count, at);
  await insert('Show the steps in order.', 1, 0);
  await newLineUnder(page, 'Hello');
  // The new block lands above the first one (the cursor is in the line under 'Hello'), and its action row has opened (it moves the handle and the blocks below).
  await insert('Show text and images in a list.', 2, 0);
  // Away from any block's row, so no bar or keyboard is in the way.
  const names = () => page.locator('.ProseMirror .mo-site-block-card').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  const before = await names();
  const handles = page.locator('.ProseMirror .mo-site-block-handle');
  if ((await handles.count()) !== 2 || before.length !== 2) {
    problems.push(`${label}: expected 2 blocks with a handle each, found ${before.length} blocks and ${await handles.count()} handles`);
    await page.close();
    return;
  }
  const box = (i) => handles.nth(i).boundingBox();
  const first = await box(0);
  // The handle is M3's small icon button (batch 9): drawn 40 dp, with a target of the part's own size (48 dp on a touch, 44 for a mouse), as an icon button's.
  if (first.width < 39.4 || first.height < 39.4)
    problems.push(`${label}: a handle is smaller than 40 x 40 (${first.width}x${first.height})`);
  const hit = await handles.first().evaluate((h) => {
    const a = getComputedStyle(h, '::after');
    return { w: parseFloat(a.width), h: parseFloat(a.height) };
  });
  const need = phone ? 47.4 : 43.4;
  if (!(hit.w >= need) || !(hit.h >= need))
    problems.push(`${label}: a handle's target is ${hit.w}x${hit.h}, under ${Math.round(need + 0.6)} x ${Math.round(need + 0.6)}`);
  const opacity = (want) => handleOpacity(page, 1, want);
  if (phone) {
    // A touch sees a handle only on the active block (it is the end of the block's row); go into the second block first.
    if ((await opacity('0')) !== '0') problems.push(`${label}: a touch sees the handle of a block that is not active`);
    const field = page.locator('.ProseMirror .mo-site-block').nth(1).locator('.mo-editor-inline-list-row [data-field]').first();
    // The tap may land while the page still moves (a row opening or closing): tap again until the block is active (the wait is for its handle to show).
    for (let tries = 0; tries < 3; tries++) {
      await field.tap({ position: { x: 8, y: 8 } });
      if ((await opacity('1')) === '1') break;
    }
    if ((await opacity('1')) !== '1') problems.push(`${label}: a touch does not see the handle of the active block`);
  } else {
    // A mouse pointing at a block shows the row's buttons over its top but not the handle (at the block's left it would cover the first item): the handle is there once the block is active.
    await page.mouse.move(5, 5);
    await page.waitForTimeout(400);
    if ((await opacity('0')) !== '0') problems.push(`${label}: a mouse sees a handle before the block is active`);
    const field = page.locator('.ProseMirror .mo-site-block').nth(1).locator('.mo-editor-inline-list-row [data-field]').first();
    const b = await field.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(400);
    if ((await opacity('0')) !== '0')
      problems.push(`${label}: a mouse sees the handle of a block it only points at, where it covers the block's first item`);
    for (let tries = 0; tries < 3; tries++) {
      await field.click();
      if ((await opacity('1')) === '1') break;
    }
    if ((await opacity('1')) !== '1') problems.push(`${label}: a mouse does not see the handle of the active block`);
  }
  // A tap on the handle moves nothing.
  const second = await box(1);
  let [sx, sy] = [second.x + second.width / 2, second.y + second.height / 2];
  if (phone) await page.touchscreen.tap(sx, sy);
  else await page.mouse.click(sx, sy);
  await page.waitForTimeout(300);
  if ((await names()).join() !== before.join()) problems.push(`${label}: a tap on the handle moved the block`);
  // A tap lets the block that was active go and its action row closes, so the page settles: the handle is where it is now, as a person sees it.
  await page.waitForTimeout(900);
  {
    const now = await box(1);
    [sx, sy] = [now.x + now.width / 2, now.y + now.height / 2];
  }
  // Drag the second block's handle up over the first block.
  const target = await page.locator('.ProseMirror .mo-site-block').first().boundingBox();
  const ty = target.y + 8;
  if (phone) {
    const cdp = await page.context().newCDPSession(page);
    const send = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await send('touchStart', sx, sy);
    for (let i = 1; i <= 12; i++) {
      await send('touchMove', sx, sy + ((ty - sy) * i) / 12);
      await page.waitForTimeout(30);
    }
    const lifted = await page.locator('.ProseMirror .mo-site-block-dragging').count();
    if (lifted !== 1) problems.push(`${label}: the block is not raised while it is dragged`);
    await send('touchEnd');
  } else {
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(sx, sy + ((ty - sy) * i) / 12);
      await page.waitForTimeout(30);
    }
    if ((await page.locator('.ProseMirror .mo-site-block-dragging').count()) !== 1)
      problems.push(`${label}: the block is not raised while it is dragged`);
    await page.mouse.up();
  }
  await page.waitForTimeout(600);
  const after = await names();
  if (after.join() !== [...before].reverse().join())
    problems.push(`${label}: dragging the handle did not move the block (${before.join()} -> ${after.join()})`);
  if (await page.locator('.ProseMirror .mo-site-block-dragging, .ProseMirror [class*="mo-site-part-drop"]').count())
    problems.push(`${label}: the drag left its marks behind`);
  await page.close();
}

/** The drag handle is in the top left corner of every block's frame (owner, 16 Nov): with the block active, on the demo's Blocks page, for each type of block, its box is at least
 * 48 by 48, inside the frame and the editor's visible width, in the frame's left half and in its top row, and it overlaps neither the action row's buttons, nor the selection
 * mark (whose own 48 target is centred on the corner), nor the block's content (the row is its own height above it). */
async function checkBlockHandleCorner(width) {
  const label = `block handle corner ${width}`;
  // The starter has no Blocks pages of its own: its blocks are the ones the check of the demo measures. The demo's Blocks are a page for each
  // component or special block (blocks-<name>.md), so the kinds of block are collected from every one of them.
  const pagesDir = join(ROOT, 'src/content/pages');
  const files = existsSync(pagesDir)
    ? readdirSync(pagesDir)
        .filter((f) => /^blocks-.+\.md$/.test(f))
        .sort()
    : [];
  if (!files.length) return console.log(`${label}: skipped, the site has no Blocks pages.`);
  const seen = new Set();
  const phone = width < 600;
  for (const file of files) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate((f) => (location.hash = `#src/content/pages/${f}`), file);
    await page.waitForSelector('.ProseMirror > .mo-site-block', { timeout: 30_000 });
    const blocks = page.locator('.ProseMirror > .mo-site-block');
    const count = await blocks.count();
    for (let i = 0; i < count; i++) {
      const block = blocks.nth(i);
      const card = block.locator(':scope > .mo-site-block-card');
      // The kind of block, not its place: blocks of one kind are numbered (`Image grid 2 of 3`), the base name is the kind.
      const name = await card.evaluate((el) => {
        const named = el.querySelector(':scope > .mo-site-block-card-button') ?? el;
        return named.dataset.base ?? named.getAttribute('aria-label');
      });
      if (seen.has(name)) continue;
      seen.add(name);
      // The cursor is out of every block first, as the other units do: the block before lets go of its row, and the page settles.
      await page.locator('.ProseMirror > p').first().click();
      await page
        .waitForFunction(() => !document.querySelector('.ProseMirror .mo-site-block-has-row'), null, { timeout: 8000 })
        .catch(() => {});
      await block.scrollIntoViewIfNeeded();
      // Activate it with a tap or click inside it; the wait is for its row to be open (the state itself, no fixed time).
      const open = () =>
        page
          .waitForFunction(
            (n) => {
              const b = document.querySelectorAll('.ProseMirror > .mo-site-block')[n];
              return !!b?.classList.contains('mo-site-block-has-row') && !document.querySelector('.ProseMirror .mo-site-block-row-moving');
            },
            i,
            { timeout: 3000 },
          )
          .then(
            () => true,
            () => false,
          );
      let active = false;
      // The first way that works: a click in a field, the focus put on a field (a field a click cannot reach), then a click in the block's preview.
      const focusField = card.locator('textarea, [contenteditable="true"]').first();
      for (const selector of [
        '[data-field]:visible',
        'focus',
        '[contenteditable="true"]:visible',
        '.mo-site-block-preview h2',
        '.mo-site-block-preview',
        'corner',
      ]) {
        if (selector === 'corner') {
          // The frame's bottom right padding, where nothing of the block is.
          const frame = await card.boundingBox();
          if (frame)
            await (phone
              ? page.touchscreen.tap(frame.x + frame.width - 6, frame.y + frame.height - 6)
              : page.mouse.click(frame.x + frame.width - 6, frame.y + frame.height - 6));
          if ((active = await open())) break;
          continue;
        }
        if (selector === 'focus') {
          if (await focusField.count()) await focusField.focus({ timeout: 3000 }).catch(() => {});
          if ((active = await open())) break;
          continue;
        }
        const target = card.locator(selector).first();
        if (!(await target.count())) continue;
        await target.scrollIntoViewIfNeeded().catch(() => {});
        await (phone ? target.tap({ position: { x: 6, y: 6 }, timeout: 3000 }) : target.click({ timeout: 3000 })).catch(() => {});
        if ((active = await open())) break;
      }
      if (!active) {
        problems.push(
          `${label}: the ${name} block did not become active (${await page.evaluate(() => [...document.querySelectorAll('.ProseMirror > .mo-site-block')].map((b) => b.className.replace(/site-block-?/g, '').trim() || '-').join('|') + ` dialogs ${document.querySelectorAll('dialog[open]').length} ${location.hash}`)})`,
        );
        continue;
      }
      // A block that opens its settings beside the page narrows the frame: close that sheet first (the block stays active), as the frame is measured at the page's own width.
      const closer = page.getByRole('button', { name: 'Close', exact: true }).first();
      if (await closer.isVisible().catch(() => false)) {
        await closer.click();
        // Closing it may let the block go: the focus goes back to its field.
        if (!(await open()) && (await focusField.count())) {
          await focusField.focus({ timeout: 3000 }).catch(() => {});
          await open();
        }
      }
      // A tap on a block that is only a preview (a list of the site) also selects it: Escape lets the selection go, and the block stays active.
      if (await page.locator('.ProseMirror .mo-site-block-marks').count()) {
        await page.keyboard.press('Escape');
        await page
          .waitForFunction(() => !document.querySelector('.ProseMirror .mo-site-block-marks'), null, { timeout: 3000 })
          .catch(() => {});
        await open();
      }
      // The handle fades in with the row: measured once it is shown and no animation runs on it or on the row.
      await block
        .evaluate(
          (el) =>
            new Promise((done) => {
              const handle = el.querySelector(':scope > .mo-site-block-handle');
              const settled = () => getComputedStyle(handle).opacity === '1' && el.getAnimations({ subtree: true }).length === 0;
              const look = () => (settled() ? done(true) : requestAnimationFrame(look));
              look();
              setTimeout(() => done(false), 3000);
            }),
        )
        .catch(() => {});
      const m = await block.evaluate((el) => {
        const rect = (s) => el.querySelector(s)?.getBoundingClientRect();
        const handle = rect(':scope > .mo-site-block-handle');
        const frame = rect(':scope > .mo-site-block-card');
        const mark = rect(':scope > .mo-site-block-mark');
        const content = rect(':scope > .mo-site-block-card > .mo-site-block-preview');
        const buttons = [...el.querySelectorAll('.mo-site-block-row-inner button')].map((b) => b.getBoundingClientRect());
        const editor = el.closest('.ProseMirror').getBoundingClientRect();
        const meets = (a, b) =>
          !!a && !!b && a.left < b.right - 0.6 && a.right > b.left + 0.6 && a.top < b.bottom - 0.6 && a.bottom > b.top + 0.6;
        return {
          handle: handle && {
            w: handle.width,
            h: handle.height,
            left: handle.left - frame.left,
            top: handle.top - frame.top,
            right: handle.right,
            vLeft: handle.left,
            tw: parseFloat(getComputedStyle(el.querySelector(':scope > .mo-site-block-handle'), '::after').width),
            th: parseFloat(getComputedStyle(el.querySelector(':scope > .mo-site-block-handle'), '::after').height),
          },
          frameW: frame.width,
          editorLeft: editor.left,
          buttons: buttons.some((b) => meets(handle, b)),
          mark: meets(handle, mark),
          content: meets(handle, content),
          shown: getComputedStyle(el.querySelector(':scope > .mo-site-block-handle')).opacity === '1',
        };
      });
      const at = `${label}: ${name}`;
      if (!m.handle) problems.push(`${at}: no handle`);
      else {
        if (m.handle.w < 39.4 || m.handle.h < 39.4) problems.push(`${at}: the handle is ${m.handle.w}x${m.handle.h}, under 40x40`);
        // Its target is the part's own: 48 dp on a touch, 44 for a mouse.
        const need = width < 600 ? 47.4 : 43.4;
        if (!(m.handle.tw >= need) || !(m.handle.th >= need))
          problems.push(
            `${at}: the handle's target is ${m.handle.tw}x${m.handle.th}, under ${Math.round(need + 0.6)}x${Math.round(need + 0.6)}`,
          );
        if (m.handle.left > m.frameW / 4 || m.handle.top > 16)
          problems.push(`${at}: the handle is not in the frame's top left corner (${m.handle.left}, ${m.handle.top})`);
        if (m.handle.left < 0) problems.push(`${at}: the handle starts outside the frame (${m.handle.left})`);
        if (m.handle.vLeft < 0 || m.handle.right > width) problems.push(`${at}: the handle is outside the visible width`);
        if (!m.shown) problems.push(`${at}: the active block's handle is not shown`);
      }
      if (m.buttons) problems.push(`${at}: the handle overlaps a button of the action row`);
      if (m.mark) problems.push(`${at}: the handle overlaps the selection mark`);
      if (m.content) problems.push(`${at}: the handle overlaps the block's content`);
    }
    await page.close();
  }
  if (seen.size < 8) problems.push(`${label}: only ${seen.size} kinds of block were measured`);
}

// Moving the selected blocks together: Move up and Move down on the bar are disabled with their reason while the blocks are not next to each other, every
// handle is disabled (and drags nothing) while several are selected, next to each other they move together and stay selected, and Shift+Arrow extends.
async function checkBlockMove(width) {
  const label = `block move ${width}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const hints = ['Show the steps in order.', 'Show text and images in a list.', 'Show the steps in order.'];
  for (const [n, hint] of hints.entries()) {
    // Each new block lands above the ones before it (the cursor is in the line under 'Hello'); the check goes on once it is the active one.
    await insertBlock(page, hint, n + 1, 0);
    await newLineUnder(page, 'Hello');
  }
  const blocks = page.locator('.ProseMirror .mo-site-block');
  if ((await blocks.count()) < 3) {
    problems.push(`${label}: fewer than 3 blocks in the page`);
    await page.close();
    return;
  }
  // A block is told by its name without its place: blocks of one kind are numbered (`Steps 1 of 2`) by where they are, so a move renumbers them.
  const names = () =>
    page.locator('.ProseMirror .mo-site-block-handle').evaluateAll((els) =>
      els.map((e) => {
        const card = e.closest('.mo-site-block')?.querySelector('.mo-site-block-card-button, .mo-site-block-inline');
        return card?.dataset.base ? `Drag ${card.dataset.base} to move it` : e.getAttribute('aria-label');
      }),
    );
  const selected = () => page.locator('.ProseMirror .mo-site-block-selected').count();
  const up = page.locator('.mo-editor-tools').getByRole('button', { name: 'Move up' });
  const down = page.locator('.mo-editor-tools').getByRole('button', { name: 'Move down' });
  const centre = async (loc) => {
    const b = await loc.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  const tap = async (loc) => {
    await loc.scrollIntoViewIfNeeded();
    if (phone) {
      const [x, y] = await centre(loc);
      await page.touchscreen.tap(x, y);
    } else {
      // A click on the block (checkBlockSelect checks the pointer's own geometry; here the third block can sit under the save bar).
      await loc.dispatchEvent('click');
    }
    await page.waitForTimeout(400);
  };
  const before = await names();
  // Select the first block (a long press on its handle on a phone, the mark with a mouse), then the third.
  if (phone) {
    // The handle is the end of the active block's row: go into the first block (a tap on another block first closes the active one's row), then press its handle.
    const handle0 = blocks.nth(0).locator('.mo-site-block-handle');
    for (let tries = 0; tries < 3; tries++) {
      await blocks
        .nth(0)
        .locator('.mo-editor-inline-list-row [data-field]')
        .first()
        .tap({ position: { x: 8, y: 8 } });
      if ((await handleOpacity(page, 0, '1')) === '1') break;
    }
    const cdp = await page.context().newCDPSession(page);
    const [hx, hy] = await centre(handle0);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hx, y: hy }] });
    await page.waitForTimeout(700);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await blocks.nth(0).hover();
    await blocks.nth(0).locator('.mo-site-block-mark').click();
  }
  await page.waitForTimeout(400);
  await tap(blocks.nth(2));
  if ((await selected()) !== 2) problems.push(`${label}: two blocks are not selected (${await selected()})`);
  for (const [name, button] of [
    ['Move up', up],
    ['Move down', down],
  ]) {
    if (!(await button.count())) {
      problems.push(`${label}: no ${name} on the bar`);
      continue;
    }
    if (!(await button.first().isDisabled())) problems.push(`${label}: ${name} is not disabled for blocks that are apart`);
    const reason = await button.first().getAttribute('aria-description');
    if (!/next to each other/.test(reason ?? '')) problems.push(`${label}: ${name} has no reason ("${reason}")`);
    if (!/next to each other/.test((await button.first().getAttribute('title')) ?? '')) problems.push(`${label}: ${name} has no title`);
  }
  const handles = await page
    .locator('.ProseMirror .mo-site-block-handle')
    .evaluateAll((els) =>
      els.map((e) => [
        e.hasAttribute('aria-disabled'),
        e.getAttribute('aria-description'),
        e.getAttribute('tabindex'),
        getComputedStyle(e).display,
      ]),
    );
  if (handles.some(([off, why, tab, display]) => !off || !/Drag is off/.test(why ?? '') || tab !== '-1' || display === 'none'))
    problems.push(`${label}: not every handle is shown disabled with its reason (${JSON.stringify(handles)})`);
  // A drag on a disabled handle moves nothing.
  const [dx, dy] = await centre(blocks.nth(0).locator('.mo-site-block-handle'));
  if (!phone) {
    await page.mouse.move(dx, dy);
    await page.mouse.down();
    await page.mouse.move(dx, dy + 400, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    if (JSON.stringify(await names()) !== JSON.stringify(before)) problems.push(`${label}: a disabled handle moved a block`);
  }
  // Take the third off: the first two are next to each other and move down together.
  await tap(blocks.nth(2));
  await tap(blocks.nth(1));
  if ((await selected()) !== 2) problems.push(`${label}: first two blocks are not selected (${await selected()})`);
  if (!(await down.count())) problems.push(`${label}: no Move down on the bar after selecting two blocks`);
  else if (await down.first().isDisabled()) problems.push(`${label}: Move down is disabled for blocks that are next to each other`);
  else {
    await down.first().click();
    await page.waitForTimeout(600);
    const after = await names();
    if (JSON.stringify(after) !== JSON.stringify([before[2], before[0], before[1]]))
      problems.push(`${label}: Move down did not move both blocks (${JSON.stringify(before)} -> ${JSON.stringify(after)})`);
    if ((await selected()) !== 2) problems.push(`${label}: the moved blocks are not selected (${await selected()})`);
    const marked = await page
      .locator('.ProseMirror .mo-site-block')
      .evaluateAll((els) => els.map((e) => e.classList.contains('mo-site-block-selected')));
    if (JSON.stringify(marked) !== JSON.stringify([false, true, true]))
      problems.push(`${label}: the wrong blocks stay selected (${marked})`);
    if (!(await down.count()) || !(await up.count())) {
      problems.push(`${label}: the bar lost Move up or Move down after a move (selected: ${await selected()})`);
      await page.close();
      return;
    }
    if (!(await down.first().isDisabled())) problems.push(`${label}: Move down is on at the end of the page`);
    if (await up.first().isDisabled()) {
      const shape = await page.evaluate(() =>
        [...document.querySelector('.ProseMirror').children].map((c) =>
          c.classList.contains('mo-site-block') || c.querySelector(':scope > .mo-site-block')
            ? `block${c.classList.contains('mo-site-block-selected') || c.querySelector('.mo-site-block-selected') ? '*' : ''}`
            : c.textContent.trim()
              ? 'text'
              : 'gap',
        ),
      );
      problems.push(`${label}: Move up is disabled after Move down (${shape.join(' ')}; ${await up.first().getAttribute('title')})`);
      await page.close();
      return;
    }
    await up.first().click();
    await page.waitForTimeout(600);
    if (JSON.stringify(await names()) !== JSON.stringify(before)) problems.push(`${label}: Move up did not bring the order back`);
  }
  if (!phone) {
    // Shift+Arrow extends from the focused card.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // A card typed in place takes no focus itself (its rows do), so the check gives it one; a card that is a button has it already.
    await blocks
      .nth(0)
      .locator('.mo-site-block-card')
      .first()
      .evaluate((el) => {
        if (!el.matches('button')) el.tabIndex = 0;
        el.focus();
      });
    await page.keyboard.press(' ');
    await page.keyboard.press('Shift+ArrowDown');
    await page.waitForTimeout(300);
    if ((await selected()) !== 2) problems.push(`${label}: Shift+Arrow did not extend the selection (${await selected()})`);
  }
  await page.close();
}

/** Selecting several blocks of a page (blockSelectable and selectionBar in MarkdownEditor.tsx): a long press on a block's handle (touch) or a click on the mark of the block
 * pointed at (mouse) selects it; the text is then read-only and every block shows its mark; a tap or click on another block adds it without opening it; the bar
 * has the count with a cross first and Hide, Remove and Select all in its `⋮` (Duplicate only with one block selected); Remove asks first; Hide hides all selected;
 * Escape or the cross ends it. */
async function checkBlockSelect(width) {
  const label = `block select ${width}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  for (const [n, hint] of ['Show the steps in order.', 'Show text and images in a list.'].entries()) {
    // Each new block lands above the ones before it; go on once it is the active one (insertBlock).
    await insertBlock(page, hint, n + 1, 0);
    // Away from the rows, so the next block goes after this one.
    await newLineUnder(page, 'Hello');
  }
  // The row of the block just left closes with the page scrolling to keep the blocks in place: measure after it has settled.
  await page.waitForTimeout(900);
  const blocks = page.locator('.ProseMirror .mo-site-block');
  if ((await blocks.count()) < 2) {
    problems.push(`${label}: fewer than 2 blocks in the page`);
    await page.close();
    return;
  }
  const selected = () => page.locator('.ProseMirror .mo-site-block-selected').count();
  const status = () =>
    page
      .locator('[role=status]')
      .filter({ hasText: /blocks? selected/ })
      .first()
      .textContent();
  const countButton = page.getByRole('button', { name: /^Clear selection, \d+ blocks? selected$/ });
  const sheetOpen = () => page.evaluate(() => !!document.querySelector('dialog[open]'));
  const hash = () => page.evaluate(() => location.hash);
  const here = await hash();
  const centre = async (loc) => {
    const b = await loc.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  const handle0 = blocks.nth(0).locator('.mo-site-block-handle');
  if (phone) {
    // The handle is the end of the active block's row: go into the first block (a tap on another block first closes the active one's row), then press its handle.
    for (let tries = 0; tries < 3 && (await handleOpacity(page, 0, '1')) !== '1'; tries++)
      await blocks
        .nth(0)
        .locator('.mo-editor-inline-list-row [data-field]')
        .first()
        .tap({ position: { x: 8, y: 8 } });
    const cdp = await page.context().newCDPSession(page);
    const [hx, hy] = await centre(handle0);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hx, y: hy }] });
    await page.waitForTimeout(700);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await blocks.nth(0).hover();
    await page.waitForTimeout(400);
    const mark = blocks.nth(0).locator('.mo-site-block-mark');
    if ((await mark.evaluate((el) => getComputedStyle(el).opacity)) !== '1')
      problems.push(`${label}: the mark does not show on the block pointed at`);
    const m = await mark.boundingBox();
    if (m.width < 48 || m.height < 48) problems.push(`${label}: the mark's target is smaller than 48 x 48 (${m.width}x${m.height})`);
    await mark.click();
  }
  await page.waitForTimeout(400);
  if ((await selected()) !== 1) problems.push(`${label}: the first block is not selected (${await selected()})`);
  if (!/^1 block selected$/.test((await status()) ?? '')) problems.push(`${label}: the count is not announced ("1 block selected")`);
  if (!(await countButton.count())) problems.push(`${label}: no count with a cross on the bar`);
  if (await page.locator('.ProseMirror[contenteditable=true]').count())
    problems.push(`${label}: the text is not read-only while a block is selected`);
  const marks = await page.locator('.ProseMirror .mo-site-block-mark').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
  if (marks.some((o) => o !== '1')) problems.push(`${label}: not every block shows its mark once one is selected`);
  // Another block, added by a tap or a click on it.
  const [sx, sy] = await centre(blocks.nth(1));
  if (phone) await page.touchscreen.tap(sx, sy);
  else await page.mouse.click(sx, sy);
  await page.waitForTimeout(400);
  if ((await selected()) !== 2) problems.push(`${label}: a tap on a second block does not add it (${await selected()})`);
  if ((await sheetOpen()) || (await hash()) !== here) problems.push(`${label}: a tap on a block opened it while blocks were selected`);
  if (!/^2 blocks selected$/.test((await status()) ?? '')) problems.push(`${label}: the count is not announced ("2 blocks selected")`);
  // The ⋮ menu: Hide, Remove and Select all, and no Duplicate with two.
  await page.locator('.mo-editor-tools [aria-label="More"]:visible').first().click();
  await page.waitForTimeout(300);
  const rows = await page.locator('[role=menu] [role^=menuitem]').allTextContents();
  const clean = rows.map((r) => r.trim());
  for (const name of ['Hide', 'Remove', 'Select all'])
    if (!clean.includes(name)) problems.push(`${label}: the bar's menu has no "${name}" (${clean.join(', ')})`);
  if (clean.includes('Duplicate')) problems.push(`${label}: Duplicate is offered with two blocks selected`);
  // Remove asks first (and Escape leaves the blocks as they are).
  await page
    .locator('[role=menu] [role^=menuitem]', { hasText: /^Remove$/ })
    .first()
    .click();
  await page.waitForTimeout(400);
  const asked = await page.evaluate(() => document.querySelector('dialog[open]')?.textContent ?? '');
  if (!/Remove 2 blocks/.test(asked)) problems.push(`${label}: Remove does not ask first ("${asked.trim().slice(0, 60)}")`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  if ((await blocks.count()) !== 2) problems.push(`${label}: Escape on the question removed a block`);
  if ((await selected()) !== 2) problems.push(`${label}: cancelling the question changed the selection (${await selected()})`);
  // Hide hides every selected block.
  await page.locator('.mo-editor-tools [aria-label="More"]:visible').first().click();
  await page.waitForTimeout(300);
  await page
    .locator('[role=menu] [role^=menuitem]', { hasText: /^Hide$/ })
    .first()
    .click();
  await page.waitForTimeout(500);
  if ((await page.locator('.ProseMirror .mo-site-block-hidden').count()) !== 2)
    problems.push(`${label}: Hide did not hide both selected blocks`);
  if ((await selected()) !== 2) problems.push(`${label}: Hide ended the selection (${await selected()})`);
  // The cross ends it; the text can be written in again.
  await countButton.click();
  await page.waitForTimeout(400);
  if (await selected()) problems.push(`${label}: the cross does not clear the selection`);
  if (!(await page.locator('.ProseMirror[contenteditable=true]').count()))
    problems.push(`${label}: the text is still read-only after the selection ended`);
  await page.close();
}

/** The selection checkbox of a list row (theme ListItem): hover shows one box, all show once one is selected, a touch shows none
 * before that; 48 x 48; a tap on what leads the row selects it (touch); the selected row has the selected surface and corner. */
async function checkSelectionBox() {
  const seed = () =>
    localStorage.setItem(
      'editor-notifications',
      JSON.stringify({
        items: [3, 2, 1].map((k) => ({ text: `Box check ${k}`, type: 'saved', at: Date.now() - k * 60000 })),
        seen: 0,
        told: [],
      }),
    );
  const visible = (page) =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('main .mo-list__item-select-box')].filter((b) => {
          const r = b.getBoundingClientRect();
          return getComputedStyle(b).display !== 'none' && getComputedStyle(b).visibility !== 'hidden' && r.width > 0;
        }).length,
    );
  for (const w of [375, 1280]) {
    const touch = w < 600;
    const label = `selection box ${w}`;
    const page = await browser.newPage({ viewport: { width: w, height: 800 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await page.addInitScript(seed);
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#list/pages'));
    await page.waitForSelector('main a.mo-list__item-container');
    await page.waitForTimeout(500);
    const rows = page.locator('main a.mo-list__item-container.mo-list__item-selectable');
    const n = await rows.count();
    if (n < 3) {
      problems.push(`${label}: fewer than 3 selectable rows (${n})`);
      await page.close();
      continue;
    }
    const hash = () => page.evaluate(() => location.hash);
    const here = await hash();
    const rowOf = async (i) => {
      await rows.nth(i).scrollIntoViewIfNeeded();
      return rows.nth(i).boundingBox();
    };
    if (await visible(page)) problems.push(`${label}: a selection box shows before anything is pointed at or selected`);
    // Each row with something leading it has its box after the text; each text-only row, before it.
    const slots = await page.evaluate(() =>
      [...document.querySelectorAll('main .mo-list__item-selectable')].every((r) => {
        const box = r.querySelector(':scope > .mo-list__item-select-box');
        const lead = r.querySelector(':scope > .mo-list__item-leading');
        if (!box) return false;
        return lead
          ? box.classList.contains('mo-list__item-select-box-trailing')
          : box.classList.contains('mo-list__item-select-box-leading');
      }),
    );
    if (!slots)
      problems.push(`${label}: a row's selection box is not in the slot Material prints (trailing with a leading visual, else leading)`);
    const hasLead = (await rows.nth(1).locator(':scope > .mo-list__item-leading').count()) > 0;
    const leadHtml = () =>
      hasLead
        ? rows
            .nth(1)
            .locator(':scope > .mo-list__item-leading')
            .evaluate((e) => e.outerHTML)
        : '';
    const leadBefore = await leadHtml();
    if (touch) {
      await rows.nth(1).scrollIntoViewIfNeeded();
      const rb = await rows.nth(1).boundingBox();
      if (hasLead) {
        // A tap on what leads a row starts selecting and opens nothing; its target is at least 48 x 48.
        const lb = await rows.nth(1).locator(':scope > .mo-list__item-leading').boundingBox();
        const cx = lb.x + lb.width / 2;
        const cy = lb.y + lb.height / 2;
        const reach = await page.evaluate(
          ([x, y]) => {
            const hit = (dx, dy) => !!document.elementFromPoint(x + dx, y + dy)?.closest('.mo-list__item-leading');
            return hit(-23, -23) && hit(23, -23) && hit(-23, 23) && hit(23, 23);
          },
          [cx, cy],
        );
        if (!reach) problems.push(`${label}: what leads a row is not a 48 x 48 target`);
        await page.touchscreen.tap(cx, cy);
      } else {
        // A text-only row has nothing to tap: the press and hold selects it.
        const cdp = await page.context().newCDPSession(page);
        const x = rb.x + rb.width / 2;
        const y = rb.y + rb.height / 2;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await page.waitForTimeout(800);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await page.waitForTimeout(300);
      if ((await hash()) !== here) problems.push(`${label}: starting to select a row opened it`);
      if ((await rows.nth(1).getAttribute('aria-checked')) !== 'true')
        problems.push(`${label}: starting to select does not select the row`);
    } else {
      const b = await rowOf(1);
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(250);
      if ((await visible(page)) !== 1) problems.push(`${label}: pointing at a row shows ${await visible(page)} boxes, not one`);
      const box = rows.nth(1).locator(':scope > .mo-list__item-select-box');
      const bb = await box.boundingBox();
      if (!bb || bb.width < 47.9 || bb.height < 47.9) problems.push(`${label}: the box is smaller than 48 px (${bb?.width}x${bb?.height})`);
      await box.click();
      await page.waitForTimeout(300);
      if ((await hash()) !== here) problems.push(`${label}: a click on the box opened the row`);
      if ((await rows.nth(1).getAttribute('aria-checked')) !== 'true')
        problems.push(`${label}: a click on the box does not select the row`);
    }
    // Once one is selected every row shows its box, 48 x 48, and the selected row has the surface, the 16 px corner and a checked box.
    if (!touch) await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    if ((await visible(page)) !== n) problems.push(`${label}: after one is selected ${await visible(page)} of ${n} rows show their box`);
    const small = await page.evaluate(
      () =>
        [...document.querySelectorAll('main .mo-list__item-select-box')].filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width < 47.9 || r.height < 47.9;
        }).length,
    );
    if (small) problems.push(`${label}: ${small} selection boxes are smaller than 48 x 48`);
    // The surface and the corner change with the theme's motion: measured when it has finished.
    await page.waitForTimeout(900);
    const look = await rows.nth(1).evaluate((r) => {
      // The surface and the corner are the row's own, or its <li>'s in a segmented list.
      const own = r.closest('.mo-list__segmented > li') ?? r;
      const segmented = own !== r;
      const probe = document.createElement('div');
      probe.style.background = segmented
        ? 'var(--mo-comp-list-segmented-selected-surface, var(--mo-sys-color-secondary-container))'
        : 'var(--mo-comp-list-list-item-selected-container-color)';
      probe.style.borderRadius = segmented
        ? 'var(--mo-comp-list-segmented-selected-radius)'
        : 'var(--mo-comp-list-list-item-selected-container-expressive-shape)';
      own.appendChild(probe);
      const want = getComputedStyle(probe);
      const s = getComputedStyle(own);
      const out = {
        background: s.backgroundColor === want.backgroundColor,
        radius: parseFloat(s.borderTopLeftRadius),
        wantRadius: parseFloat(want.borderTopLeftRadius),
        checked: !!r.querySelector('.mo-list__item-select-box .mo-checkbox__input[data-checked]'),
      };
      probe.remove();
      return out;
    });
    if (!look.background) problems.push(`${label}: a selected row does not have the theme's selected surface`);
    if (look.radius < 16 || look.radius !== look.wantRadius)
      problems.push(`${label}: a selected row's corner is ${look.radius}px, not the 16px of the selected corner token`);
    if (!look.checked) problems.push(`${label}: a selected row's box is not checked`);
    const leadAfter = await leadHtml();
    if (leadAfter !== leadBefore) problems.push(`${label}: what leads a row changed when it was selected`);
    // A click on a row while selecting toggles it, and opens nothing.
    const b2 = await rowOf(2);
    if (touch) await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2);
    else await page.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2);
    await page.waitForTimeout(250);
    if ((await hash()) !== here) problems.push(`${label}: a click on a row while selecting opened it`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) problems.push(`${label}: the page scrolls sideways while selecting`);
    await page.keyboard.press('Escape');
    // A row with an icon (the notifications): the box trailing; a tap on the icon starts selecting (touch); one box on hover.
    await page.evaluate(() => (location.hash = '#'));
    await page
      .getByRole('button', { name: /^Notifications/ })
      .first()
      .click();
    const sheet = (page.viewportSize()?.width ?? 0) < 600 ? page.locator('main') : page.getByRole('dialog', { name: 'Notifications' });
    await sheet.waitFor();
    await page.waitForTimeout(600);
    const items = sheet.locator('.mo-list__item-selectable', { hasText: /Box check/ });
    if ((await items.count()) !== 3) {
      problems.push(`${label}: the notifications sheet does not show the three seeded notifications`);
    } else {
      const first = items.nth(0);
      if (
        !(await first.locator(':scope > .mo-list__item-leading').count()) ||
        !(await first.locator(':scope > .mo-list__item-select-box-trailing').count())
      )
        problems.push(`${label}: a notification has no trailing box after its icon`);
      const b = await first.boundingBox();
      if (touch) {
        const lb = await first.locator(':scope > .mo-list__item-leading').boundingBox();
        await page.touchscreen.tap(lb.x + lb.width / 2, lb.y + lb.height / 2);
        await page.waitForTimeout(300);
        if ((await first.getAttribute('aria-checked')) !== 'true')
          problems.push(`${label}: a tap on a notification's icon does not select it`);
      } else {
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
        await page.waitForTimeout(250);
        const shown = await sheet
          .locator('.mo-list__item-select-box')
          .evaluateAll(
            (all) => all.filter((e) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden').length,
          );
        if (shown !== 1) problems.push(`${label}: pointing at a notification shows ${shown} boxes, not one`);
      }
    }
    await page.close();
  }
}

/** A new block takes its first row once the insert dialog has closed (MarkdownEditor.tsx, startAt: its `close` event), however late that is: the dialog's close is held
 * back by 3 s here (twice the 1.5 s the editor once gave up after), and the new block must still become the active one, with the cursor in its first row, and not
 * before the dialog is gone (the button that opened the dialog gets the focus back at the close). */
async function checkInsertDialogClosesLate(width) {
  const label = `insert, dialog closes late ${width}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const close = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.close = function (...args) {
      setTimeout(() => close.apply(this, args), 3000);
    };
  });
  // insertBlock waits until the new block is the only one with a row and that row is active.
  await insertBlock(page, 'Show the steps in order.', 1, 0);
  if (await page.evaluate(() => !!document.querySelector('dialog[open]')))
    problems.push(`${label}: the new block took its row while the insert dialog was still open`);
  const inRow = await page.evaluate(() => !!document.activeElement?.closest('.ProseMirror .mo-site-block'));
  if (!inRow) problems.push(`${label}: the cursor is not in the new block's first row once the dialog has closed`);
  await page.close();
}

// A tap on an image of the Image grid opens that image's sheet and makes the block the active one, so its row is there however many images fill the block
// (the other check taps the middle of a block, which is a gap only while the grid is small).
async function checkImageGridTap(width) {
  const label = `image grid tap ${width}`;
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-image-grid.md')))
    return console.log(`${label}: skipped, the site has no Image grid page.`);
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#src/content/pages/blocks-image-grid.md'));
  await page.waitForSelector('.ProseMirror > .mo-site-block', { timeout: 30_000 });
  const tile = page.locator('.ProseMirror > .mo-site-block a[data-image]').first();
  await tile.waitFor({ timeout: 15_000 });
  await tile.scrollIntoViewIfNeeded();
  await (phone ? tile.tap({ timeout: 3000 }) : tile.click({ timeout: 3000 }));
  const row = await page
    .waitForFunction(() => !!document.querySelector('.ProseMirror > .mo-site-block.mo-site-block-has-row'), null, { timeout: 5000 })
    .then(
      () => true,
      () => false,
    );
  if (!row) problems.push(`${label}: a tap on an image did not make its block the active one (no row)`);
  await page.close();
}

/** A swipe that starts outside the block being typed in is not held back: that touch closes the open row and the block's action row (blockRow.ts),
 * and the page had been scrolled back by what the closing moved on every frame (`hold`), cancelling the finger, so it stuck and jumped up and down.
 * On a phone, on the demo's Lists page: a row of a List - Expand is opened, a slow swipe starts below the block, and while the finger is down the page
 * must follow it (scroll down as the finger goes up) with no frame that scrolls it back by more than the closing moved it. */
async function checkRowSwipeScrolls(width = 375) {
  const label = `${width}px swipe after a row was opened`;
  const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#src/content/pages/blocks-lists.md'));
  const rows = page.locator('.mo-site-block-card ul.mo-list__expand .mo-list__item-expand-summary');
  await rows.first().waitFor({ timeout: 30_000 });
  await rows.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await rows.first().tap();
  await page.waitForTimeout(800);
  // The block's end is brought to the middle of the screen, so a swipe can start below it (outside the block).
  const below = await page.evaluate(async () => {
    const block = document.activeElement?.closest('.mo-site-block-card');
    if (!block) return null;
    scrollBy({ top: block.getBoundingClientRect().bottom - 400, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
    return Math.round(block.getBoundingClientRect().bottom) + 24;
  });
  if (below === null || below > 650) return (problems.push(`${label}: no open block with room below it to start the swipe`), page.close());
  await page.evaluate(() => {
    window.__ys = [];
    const f = () => (window.__ys.push(scrollY), requestAnimationFrame(f));
    f();
  });
  const cdp = await page.context().newCDPSession(page);
  const steps = 24;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: below }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: below - (300 * i) / steps }] });
    await page.waitForTimeout(16);
  }
  const down = await page.evaluate(() => window.__ys.length);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(600);
  const ys = (await page.evaluate(() => window.__ys)).slice(0, down);
  // Frames where the page went back up although the finger only moves up, after the first (the closing may move it once).
  // The closing may move the page once before the finger has moved it (the row is shorter); from the moment it rises with the finger, it never goes back.
  let back = 0;
  let low = ys[0];
  let rising = false;
  for (let i = 1; i < ys.length; i++) {
    low = Math.min(low, ys[i]);
    if (ys[i] > low + 5) rising = true;
    if (rising && ys[i] < ys[i - 1] - 1) back++;
  }
  const net = ys.at(-1) - low;
  if (back > 0 || net < 150)
    problems.push(
      `${label}: the page did not follow the finger (scrolled back in ${back} frames, ${Math.round(net)} px in all; the row's hold fights the swipe)`,
    );
  await page.close();
}

export function register(unit) {
  for (const width of [375, 1280]) unit(`checkBlockBar ${width}`, () => checkBlockBar(width));
  for (const width of [375, 1280]) unit(`checkCardBar ${width}`, () => checkCardBar(width));
  unit('checkSelection', () => checkSelection());
  unit('checkSelectionBox', () => checkSelectionBox());
  unit('checkDragSelect', () => checkDragSelect());
  unit('checkTwoFinger', () => checkTwoFinger());
  for (const w of [375, 1280]) unit(`checkBlockDrag ${w}`, () => checkBlockDrag(w));
  for (const w of [375, 768, 1280]) unit(`checkBlockHandleCorner ${w}`, () => checkBlockHandleCorner(w));
  for (const w of [375, 768, 1280]) unit(`checkImageGridTap ${w}`, () => checkImageGridTap(w));
  for (const w of [375, 1280]) unit(`checkBlockSelect ${w}`, () => checkBlockSelect(w));
  for (const w of [375, 1280]) unit(`checkInsertDialogClosesLate ${w}`, () => checkInsertDialogClosesLate(w));
  for (const w of [375, 1280]) unit(`checkBlockMove ${w}`, () => checkBlockMove(w));
  unit('checkRowSwipeScrolls 375', () => checkRowSwipeScrolls(375));
}
