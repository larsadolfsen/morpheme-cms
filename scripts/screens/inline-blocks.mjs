import { join } from 'node:path';
import { openEditor } from '../built-site.mjs';
import { FIXTURE_PAGE, browser, problems, shots, site } from './support/context.mjs';
import { barTools, inlineBlocks, inlineSingles, pressInsert, pressMore, pressTool, ratioOf, saveOrClose } from './support/shared.mjs';
import { shortfall } from './support/statement.mjs';
import { isMaterialTheme } from '../theme-statement.mjs';

/** One choice of a choice group by its name, whichever form it has now: its visible button, or its row of radio buttons (the row's label is the target:
 * the text under it cannot be pressed on its own). */
async function chooseOption(page, name) {
  const button = page.getByRole('button', { name, exact: true }).filter({ visible: true });
  if (await button.count()) return void (await button.last().click());
  await page
    .locator('.mo-choice-group__list .mo-list__item-content')
    .filter({ hasText: new RegExp(`^${name}$`) })
    .filter({ visible: true })
    .last()
    .click();
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
  await pressInsert(page, 'tap');
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  await page.waitForSelector(`.mo-site-block-inline [data-field="${field}"]`);
  await page.keyboard.type(text);
  await page.waitForTimeout(300);
  const state = () =>
    page.evaluate(
      (f) => ({
        value: document.querySelector(`.mo-site-block-inline [data-field="${f}"]`)?.value ?? null,
        add: document.querySelectorAll('[data-add-row]').length,
        next: document.querySelectorAll('.mo-editor-inline-list-row-next').length,
        outline: getComputedStyle(document.querySelector('.mo-site-block-inline .mo-editor-inline-list-row-active')).outlineStyle,
        slot: !!document.querySelector('.mo-site-block-inline .mo-editor-inline-list-slot'),
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
  if ((await page.locator(`.mo-site-block-inline [data-field="${field}"]`).count()) && name === 'notice')
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
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  await page.waitForSelector(`.mo-editor-inline-list-row-active [data-field="${field}"]`, { timeout: 8000 });
  await page.keyboard.type('One');
  await page.waitForTimeout(300);
  await page.locator('[data-add-row]').click();
  await page.waitForTimeout(300);
  await page.keyboard.type('Two');
  await page.waitForTimeout(300);
  const slotOf = (row) => page.locator(`[data-row="${row}"] .mo-editor-inline-list-slot[aria-label="Icon"]`);
  // A card that has its media shows it as the button (a tap on it opens the picker); the other blocks show the round control.
  const controlOf = (row) => (name === 'cards' ? page.locator(`[data-row="${row}"] .mo-editor-inline-card-media`) : slotOf(row));
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
  if (!(await page.locator('[data-row="1"].mo-editor-inline-list-row-active').count()))
    problems.push(`${label}: the second row is not active`);
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
    if (!(await page.locator('[data-row="0"].mo-editor-inline-list-row-active').count()))
      problems.push(`${label}: a tap on the icon of a row that is not active does not make it the active row`);
  }
  await page.close();
}

/** The icon control inside a filled button (Buttons, Price cards) draws its keyboard focus ring on the button's own container, so the ring is the button's on-colour and
 * holds at least 3:1 against that container (WCAG 2.4.7, 1.4.11), light and dark, on the page's colour and on a coloured section. */
async function checkFilledSlotRing(scheme, sectionColor) {
  const label = `${scheme} inline buttons slot ring${sectionColor ? ` on ${sectionColor}` : ''}`;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US', colorScheme: scheme });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Prompt actions with buttons.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="label"]', { timeout: 8000 });
  await page.keyboard.type('One');
  await page.waitForTimeout(300);
  if (sectionColor)
    await page.evaluate((color) => {
      for (const el of document.querySelector('.ProseMirror').children) {
        if (el.classList.contains('mo-editor-section-picture')) continue;
        el.setAttribute('data-section-color', color);
        el.setAttribute('data-section-box', 'only');
      }
    }, sectionColor);
  await page.waitForTimeout(300);
  // Keyboard focus: Shift+Tab from the label (the slot comes before it) until the slot has it (the ring shows for the keyboard only).
  await page.locator('.mo-site-block-inline [data-field="label"]').first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="label"]');
  let onSlot = false;
  for (let i = 0; i < 4 && !onSlot; i++) {
    await page.keyboard.press('Shift+Tab');
    onSlot = await page.evaluate(() => !!document.activeElement?.matches('.mo-button.mo-is-filled .mo-editor-inline-list-slot'));
  }
  if (!onSlot) problems.push(`${label}: Shift+Tab did not reach the icon control inside the filled button`);
  else {
    const m = await page.evaluate(`(() => {
      ${ratioOf}
      const slot = document.activeElement;
      const button = slot.closest('.mo-button.mo-is-filled');
      const cs = getComputedStyle(slot);
      return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), ratio: ratio(cs.outlineColor, button, 1, button) };
    })()`);
    if (m.style === 'none' || m.width < 2) problems.push(`${label}: the focused icon control has no ring (${m.style} ${m.width}px)`);
    else if (m.ratio < 3) problems.push(`${label}: the ring is ${m.ratio.toFixed(2)}:1 against the filled button, under 3:1`);
  }
  await page.close();
}

/** A List and a List - Expand, each in the design Plain and Segmented (owner, 16 Nov 2026: "The white list is the correct one"), are edited the same way: the active
 * row has the same slots (its icon and its link, at its end), the toolbar the same Link, the add button the same text, and the link slot the same sheet with its page; nothing is
 * drawn at the bottom of a row; the design is a setting of the block (Plain or Segmented) that changes only how the rows are drawn. Each is measured, then compared with the List's. */
/** A button typed in place (Buttons block) is drawn with Material 3's measures for its size (m3.material.io/components/buttons/specs): the label and the
 * icon are centred on the button's middle, the icon is the size's icon (20 dp on small), the space between icon and label is the size's icon-label space
 * (8 dp on small) and the space before the icon is the size's leading space (16 dp). The numbers are M3's as printed, not read from our tokens. */
const M3_BUTTON = {
  xsmall: { height: 32, icon: 20, gap: 4, lead: 12 },
  small: { height: 40, icon: 20, gap: 8, lead: 16 },
  medium: { height: 56, icon: 24, gap: 8, lead: 24 },
  large: { height: 96, icon: 32, gap: 12, lead: 48 },
  xlarge: { height: 136, icon: 40, gap: 16, lead: 64 },
};
async function checkInlineButtonMeasure(width, height) {
  const label = `${width} inline button measures`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US', hasTouch: width < 600, isMobile: width < 600 });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Prompt actions with buttons.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="label"]', { timeout: 8000 });
  await page.keyboard.type('Book');
  await page.waitForTimeout(300);
  const found = await page.evaluate(() => {
    const sizes = ['xlarge', 'large', 'medium', 'xsmall'];
    return [...document.querySelectorAll('.mo-editor-inline-button')].map((button) => {
      const box = (e) => e.getBoundingClientRect();
      const slot = button.querySelector('.mo-editor-inline-list-slot');
      const field = button.querySelector('.mo-editor-inline-list-field');
      const b = box(button);
      const f = box(field);
      const s = slot && box(slot);
      return {
        size: sizes.find((x) => button.classList.contains(`mo-is-${x}`)) ?? 'small',
        height: b.height,
        labelOffset: f.top + f.height / 2 - (b.top + b.height / 2),
        iconOffset: s ? s.top + s.height / 2 - (b.top + b.height / 2) : 0,
        icon: s?.width,
        gap: s ? f.left - s.right : undefined,
        lead: s ? s.left - b.left : undefined,
      };
    });
  });
  if (!found.length) problems.push(`${label}: no button found`);
  const material = isMaterialTheme();
  for (const m of found) {
    const want = M3_BUTTON[m.size];
    const off = (what, got, exp) =>
      Math.abs(got - exp) > 0.5 && problems.push(`${label}: ${m.size} button ${what} is ${got.toFixed(1)}, Material 3 says ${exp}`);
    // Material's sizes are Material 3's, exactly; another theme has its own, and keeps WCAG 2.2 AA's target size (2.5.8: at least 24 px).
    if (material) off('height', m.height, want.height);
    else if (m.height < 24)
      problems.push(`${label}: ${m.size} button is ${m.height.toFixed(1)} px high, under WCAG 2.2 AA's 24 px target size`);
    off('label centre is off the button centre by', m.labelOffset, 0);
    off('icon centre is off the button centre by', m.iconOffset, 0);
    if (material && m.icon !== undefined) {
      off('icon size', m.icon, want.icon);
      off('icon-label space', m.gap, want.gap);
      off('leading space', m.lead, want.lead);
    }
  }
  await page.close();
}

async function checkListDesigns(width, height) {
  const label = `${width}px inline list designs`;
  const phone = width < 600;
  const looks = [
    { look: 'List', hint: 'Show text and images in a list.' },
    { look: 'List, Segmented', hint: 'Show text and images in a list.', card: true },
    { look: 'List - Expand', hint: 'Show list items that expand and collapse.', expand: true },
    { look: 'List - Expand, Segmented', hint: 'Show list items that expand and collapse.', card: true, expand: true },
  ];
  const seen = [];
  for (const { look, hint, card, expand } of looks) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label} (${look}): ${e.message}`));
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('Hello');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.ProseMirror p:nth-child(2)');
    await pressInsert(page, 'click');
    await page.locator('dialog[open] button', { hasText: hint }).first().click();
    await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]', { timeout: 8000 });
    await page.keyboard.type('First');
    if (card) {
      // The design is in the block's own settings (the bar's ⋮ menu).
      await pressMore(page, 'Edit');
      await chooseOption(page, 'Segmented');
      await saveOrClose(page, 'last');
      // The rows are on their own surfaces now (the theme's segmented list, or the card class of the rows that fold out).
      await page.locator('.mo-list__segmented, .mo-block-accordion__segmented').first().waitFor({ timeout: 8000 });
    }
    await page.locator('[data-add-row]').waitFor({ timeout: 8000 });
    const got = await page.evaluate(() => ({
      slots: [...document.querySelectorAll('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot')].map((x) =>
        x.getAttribute('aria-label'),
      ),
      add: [...document.querySelectorAll('[data-add-row]')].map((x) => x.textContent.trim()),
      own: document.querySelectorAll('[data-row-link], [data-add-button], [data-row-arrow], .mo-editor-inline-segmented-buttons').length,
      // The plain design's row layer is 16 dp wider than the text column on each side at every width (M3 Lists › Specs: 16 dp leading and trailing space; 21 Nov 2026), its leading icon on the text's edge.
      edge: (() => {
        const row = document.querySelector('.mo-editor-inline-list-row-active');
        const box = row?.matches('.mo-list__item-container') ? row : row?.querySelector('.mo-list__item-container');
        const lead = box?.querySelector('.mo-list__item-leading');
        const text = document.querySelector('.ProseMirror p')?.getBoundingClientRect().left;
        return box && lead && text !== undefined
          ? {
              layer: box.getBoundingClientRect().left - text,
              icon: lead.getBoundingClientRect().left - text,
              wide: document.documentElement.scrollWidth - window.innerWidth,
            }
          : null;
      })(),
      // The link slot is at the end of the row: to the right of the heading.
      end: (() => {
        const row = document.querySelector('.mo-editor-inline-list-row-active');
        const slot = row?.querySelector('.mo-editor-inline-list-slot[aria-label="Page"]');
        const field = row?.querySelector('[data-field="title"]');
        return !!slot && !!field && slot.getBoundingClientRect().left >= field.getBoundingClientRect().left;
      })(),
    }));
    await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Page"]').click();
    if (expand) {
      // List - Expand keeps its row's sheet for now (its row buttons; the next pull request of B5).
      const sheet = phone ? page.locator('dialog[open]') : page.locator('.mo-editor-side-sheet');
      const opened = await sheet
        .getByText('Page', { exact: true })
        .first()
        .waitFor({ timeout: 4000 })
        .then(() => true)
        .catch(() => false);
      seen.push({ look, card, ...got, opened, expand, kept: true, rowSheet: 0, closed: true, items: 0 });
      await page.close();
      continue;
    }
    // The page picker opens straight from the link button (B5): the sheet with the pages and No page, on a phone and a computer, and no sheet of the row.
    const sheet = page.locator('dialog[open]');
    const opened = await sheet
      .getByText('No page', { exact: true })
      .first()
      .waitFor({ timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    const rowSheet = await page.getByText('Row settings').filter({ visible: true }).count();
    // A page picked is written to the row (the picker opens again on it), No page takes it away and closes the picker; Block settings then lists no row.
    let kept = true;
    if (opened) {
      const slot = page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Page"]');
      await sheet.locator('[role="option"]:not(:has-text("No page"))').first().click();
      await page.waitForTimeout(300);
      await slot.click();
      await sheet.getByText('No page', { exact: true }).first().waitFor({ timeout: 4000 });
      kept = (await sheet.locator('[role="option"][aria-selected="true"]:not(:has-text("No page"))').count()) === 1;
      await sheet.getByText('No page', { exact: true }).first().click();
    }
    const closed = await sheet.count().then((n) => n === 0);
    await pressMore(page, 'Edit');
    await page.waitForTimeout(400);
    const items = await page
      .locator('dialog[open], .mo-editor-side-sheet')
      .getByText(/^Rows?$|^Add row$/)
      .count();
    seen.push({ look, card, ...got, opened, kept, rowSheet, closed, items });
    await page.close();
  }
  const [first] = seen;
  if (first.slots.join() !== 'Icon,Page') problems.push(`${label}: the List's active row has the slots "${first.slots}", not "Icon,Page"`);
  for (const one of seen) {
    if (one.slots.join() !== first.slots.join())
      problems.push(`${label}: ${one.look} has the slots "${one.slots}", the List "${first.slots}"`);
    if (one.add.join() !== 'Add list row') problems.push(`${label}: ${one.look} has the add button "${one.add}", not "Add list row"`);
    if (one.own) problems.push(`${label}: ${one.look} has a text row or a button of its own for the row's link`);
    if (!one.end) problems.push(`${label}: ${one.look}: the link slot is not at the end of the row`);
    if (!one.edge) problems.push(`${label}: ${one.look}: no row layer or leading icon to measure`);
    else {
      // Default: the layer starts 16 dp before the text's edge at every width, and the icon is on the text's edge; Card: the container on the text's edge (its icon one 16 dp padding in).
      // The rows that fold out have Material 3's 16 dp list padding inside their card, as the other cards (M3 Lists spec: "Leading element left padding 16dp", "Label left padding 16dp"). Old source: the 24 dp of the theme's accordion (global.css), set before 21 Nov 2026 and not M3's.
      const [layer, icon] = one.card ? [0, 16] : [-16, 0];
      if (Math.abs(one.edge.layer - layer) > 0.5)
        problems.push(`${label}: ${one.look}: the row starts ${one.edge.layer} px from the text's edge, not ${layer}`);
      if (Math.abs(one.edge.icon - icon) > 1)
        problems.push(`${label}: ${one.look}: the leading icon starts ${one.edge.icon} px from the text's edge, not ${icon}`);
      if (one.edge.wide > 0.5) problems.push(`${label}: ${one.look}: the page scrolls sideways by ${one.edge.wide}px`);
    }
    if (!one.opened) problems.push(`${label}: ${one.look}: the link slot did not open the page picker`);
    if (!one.kept) problems.push(`${label}: ${one.look}: the page picked is not on the row`);
    if (one.rowSheet) problems.push(`${label}: ${one.look}: a Row settings sheet opened`);
    if (!one.closed) problems.push(`${label}: ${one.look}: the page picker stays open after No page`);
    if (one.items) problems.push(`${label}: ${one.look}: Block settings lists the rows`);
  }
}
/** `surface`: the item is a card with a container of its own, so it has a background colour. `start`: how many empty, faded items a new block starts with (the first active; typing in one makes the first item, and the others go). */
async function checkInlineBlock(width, height, { name, hint, add, surface, noEdit, rowLink, field = 'title', open, start = 1 }) {
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
  // The tools that do not fit are in the ⋮ menu.
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: hint }).first().click();
  try {
    await page.waitForSelector(`.mo-editor-inline-list-row-active [data-field="${field}"]`, { timeout: 8000 });
  } catch {
    problems.push(`${label}: the block was not typed in place (no active row with a "${field}" field)`);
    return page.close();
  }
  const faded = await page.locator('.mo-editor-inline-list-row-next').count();
  if (faded !== start) problems.push(`${label}: a new block starts with ${faded} empty, faded items, not ${start}`);
  if ((await page.locator('.mo-editor-inline-list-row-active').count()) !== 1)
    problems.push(`${label}: not exactly one active item at the start`);
  if (name === 'cards') {
    // The media area is there while the card is active: one button for each kind (icon, image, video); the link is the bar's, not a slot in the card; the action area has the next button, empty and faded.
    const slots = await page
      .locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot')
      .evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')));
    if (slots.join() !== 'Icon,Image,Video')
      problems.push(`${label}: the active card's media buttons are "${slots}", not "Icon,Image,Video"`);
    if (await page.locator('.mo-editor-inline-list-row-active [aria-label="Link"]').count())
      problems.push(`${label}: the card has a link slot (the link is in the toolbar)`);
    const next = await page
      .locator('.mo-editor-inline-list-row-active .mo-block-cards__card-actions .mo-editor-inline-card-next-button')
      .allTextContents();
    if (next.join() !== 'Add button')
      problems.push(`${label}: the active card's action area has "${next}", not the text button "Add button"`);
    if (width >= 1000 && !(await page.locator('.mo-editor-tools button[aria-label="Link"]').count()))
      problems.push(`${label}: the toolbar has no Link while the card is still empty`);
    // The header line of a card is a headline and ONE optional subhead, both typed in place; no badge, date or tags.
    const fields = await page.evaluate(() =>
      [...document.querySelectorAll('.mo-editor-inline-list-row-active [data-field]')].map((f) => f.dataset.field),
    );
    if (fields.join() !== 'title,subhead,text')
      problems.push(`${label}: the typed fields of a card are "${fields}", not "title,subhead,text"`);
  }
  if (name === 'buttons') {
    // An empty button's hint is the button kind's own text colour (never the page's), for every kind, and its settings offer the four kinds (no Elevated) side by side.
    const hint = await page.evaluate(() => {
      const row = document.querySelector('.mo-editor-inline-list-row-active');
      const field = row.querySelector('.mo-editor-inline-list-field');
      const out = {};
      const was = row.className;
      for (const kind of ['filled', 'tonal', 'outlined', 'text']) {
        row.classList.remove('mo-is-filled', 'mo-is-tonal', 'mo-is-outlined', 'mo-is-text');
        row.classList.add(kind === 'text' ? 'mo-is-text' : `mo-is-${kind}`);
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
      await pressTool(page, 'Settings').catch(async (e) =>
        problems.push(
          `${label}: the toolbar has no way to open the button's settings ${JSON.stringify((await barTools(page)).names)} ${e.message.slice(0, 200)}`,
        ),
      );
      const kinds = ['Filled', 'Tonal', 'Outlined', 'Text'];
      // The choice group (ChoiceGroup): its buttons, or its list of radio buttons when they do not fit.
      const group = page.getByRole('group', { name: 'Variant', exact: true }).last();
      await group.waitFor({ timeout: 4000 }).catch(() => problems.push(`${label}: the button's settings have no Variant choice`));
      const radios = await group.getByRole('radio').count();
      const names = radios
        ? await group.locator('.mo-list__item-headline').allTextContents()
        : await group
            .getByRole('button')
            .allTextContents()
            .catch(() => []);
      if (names.map((n) => n.trim()).join() !== kinds.join()) problems.push(`${label}: the button's styles are "${names}", not "${kinds}"`);
      await (
        radios
          ? group.locator('.mo-list__item-content', { hasText: /^Outlined$/ })
          : group.getByRole('button', { name: 'Outlined', exact: true })
      )
        .click({ timeout: 3000 })
        .catch(() => {});
      await page.waitForTimeout(300);
      if (!(await page.locator('.mo-editor-inline-list-row-active.mo-button.mo-is-outlined').count()))
        problems.push(`${label}: choosing Outlined does not change the active button's style`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.locator('.mo-editor-inline-list-row [data-field="label"]').first().click();
      // The pointer is away from the button: a state layer for a button pointed at is a passing state.
      await page.mouse.move(0, 0);
    }
    // The active button has its icon area, empty while it has no icon; a tap on it opens the icon picker and a choice sets the icon.
    const slot = page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Icon"]');
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
      await page.locator('.mo-editor-inline-list-row [data-field="label"]').first().click();
      if ((await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Icon"] svg').count()) !== 1)
        problems.push(`${label}: the chosen icon is not shown in the active button's icon area`);
      await page.mouse.move(0, 0);
    }
  }
  await page.keyboard.type('First');
  await page.waitForTimeout(300);
  const state = () =>
    page.evaluate(() => ({
      rows: document.querySelectorAll('.mo-editor-inline-list-row[data-row]:not(.mo-editor-inline-list-row-next)').length,
      next: document.querySelectorAll('.mo-editor-inline-list-row-next').length,
      add: [...document.querySelectorAll('[data-add-row]')].map((b) => b.textContent.trim()),
      outline: getComputedStyle(document.querySelector('.mo-editor-inline-list-row-active')).outlineStyle,
      background: getComputedStyle(document.querySelector('.mo-editor-inline-list-row-active')).backgroundColor,
      activeRow: document.querySelector('.mo-editor-inline-list-row-active').dataset.row,
      bar: [...document.querySelectorAll('.mo-editor-tools button')].map((b) => ({
        label: b.getAttribute('aria-label'),
        svg: !!b.querySelector('svg path'),
      })),
      // A dropdown is a button with a text label and a chevron; a block's tools on the bar have none, only icon buttons.
      dropdowns: [...document.querySelectorAll('.mo-editor-tools button')]
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
      const row = document.querySelector('.mo-editor-inline-list-row-active');
      const top = row.closest('.ProseMirror > *');
      for (const color of ['surface', 'primary', 'secondary', 'tertiary']) {
        top.setAttribute('data-section-color', color);
        top.setAttribute('data-section-box', 'only');
        const field = row.querySelector('.mo-editor-inline-list-field');
        const ph = getComputedStyle(field, '::placeholder');
        const slot = row.querySelector('.mo-editor-inline-list-slot');
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
        if (got[part] !== null && got[part] < min) {
          const message = `${label} (${scheme}): the ${part} on a ${color} section has contrast ${got[part].toFixed(2)}:1, below ${min}`;
          // A placeholder and the row's outline are parts a theme can name in its accessibility.json; text and slot icons never.
          if (part === 'placeholder') shortfall('1.4.3', 'placeholder', message);
          else if (part === 'outline')
            shortfall('1.4.11', 'outlined-card-edge', message); // the edge of a block typed in place on a section, M3's outline: judged with the card edge, which the contrast scan measures in whole
          else problems.push(message);
        }
  }
  await page.emulateMedia({ colorScheme: 'light' });
  for (const name of ['Add above', 'Add below'])
    if (!one.bar.some((b) => b.label === name && b.svg)) problems.push(`${label}: the toolbar has no icon button "${name}"`);
  // The card's settings (the toolbar's gear on a phone, a sheet; the panel on a computer already) open with its page and buttons, never an empty page.
  const cardSettings = async (when) => {
    if (width >= 1000) return;
    await pressTool(page, 'Edit');
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
    const panel = page.locator('.mo-editor-side-sheet');
    // The card's own Page field, found by its hint (a button has a Page of its own once it is added).
    const page_ = panel.getByText('With a page, the whole card is the link and has no buttons.');
    await page_.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the card's settings have no Page`));
    await panel.getByRole('button', { name: 'Add button' }).click();
    await page.waitForTimeout(300);
    if (await page_.count()) problems.push(`${label}: a card with a button still offers a Page`);
  }
  if (name === 'cards') {
    // A button is typed on the button itself, then the next one is there, empty and faded.
    await page.click('.mo-editor-inline-list-row-active [data-add-button]');
    await page.keyboard.type('Go');
    await page.waitForTimeout(300);
    const typed = await page
      .locator('.mo-editor-inline-list-row-active .mo-editor-inline-card-button textarea')
      .last()
      .inputValue()
      .catch(() => null);
    if (typed !== 'Go') problems.push(`${label}: the text typed on a card's new button is "${typed}", not "Go"`);
    if ((await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-card-next-button').count()) !== 1)
      problems.push(`${label}: no next button after the first`);
  }
  if (name === 'cards') await cardSettings('a card with a button');
  // A block with no settings (Steps): no Link action and no Edit button, a step has nothing to set.
  if (noEdit)
    for (const name of ['Link', 'Edit'])
      if (one.bar.some((b) => b.label === name)) problems.push(`${label}: the toolbar has "${name}" although the block has no settings`);
  // A row's link (List and List - Expand alike, owner, 16 Nov 2026): the link slot at the end of the active row and the toolbar's Link, no text row of
  // its own at the bottom of the row and no text button typed there; the slot opens the row's sheet, which has the page.
  if (rowLink) {
    const slots = await page
      .locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot')
      .evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')));
    if (slots.join() !== 'Icon,Page') problems.push(`${label}: the active row's slots are "${slots}", not "Icon,Page"`);
    if (await page.locator('[data-row-link], [data-add-button], .mo-editor-inline-segmented-buttons').count())
      problems.push(`${label}: the row has a text row or a button of its own for its link`);
    if (!(await state()).bar.some((b) => b.label === 'Link')) problems.push(`${label}: the toolbar has no Link button`);
    await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Page"]').click();
    await page.waitForTimeout(500);
    if (!(await page.getByText('Page', { exact: true }).locator('visible=true').count()))
      problems.push(`${label}: the link slot did not open the row's page field`);
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
    const opened = await page.evaluate(() => [...document.querySelectorAll('.mo-editor-inline-list-row[data-row]')].map((d) => d.open));
    if (opened.join() !== 'false,true') problems.push(`${label}: expected only the active item open, got ${opened}`);
    if (!(await page.locator('.mo-editor-inline-list-row-active [data-field="answer"]').count()))
      problems.push(`${label}: no answer field in the open item`);
    if ((await state()).bar.some((b) => b.label === 'Link')) problems.push(`${label}: the toolbar has a Link button`);
  }
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  if ((await page.locator('[data-add-row]').count()) > 0)
    problems.push(`${label}: the button "${add}" stays after the cursor left the block`);
  // The row keeps the colour it has on the site while it is typed in: its background is the same once the cursor has left it.
  const kept = await page.evaluate(
    (i) => getComputedStyle(document.querySelector(`.mo-editor-inline-list-row[data-row="${i}"]`)).backgroundColor,
    one.activeRow,
  );
  if (kept !== one.background)
    problems.push(`${label}: the row has background ${one.background} while typed in, ${kept} when the cursor left it`);
  if (name === 'cards') {
    // A media that is set is changed by a tap on it: an icon is picked from the Icon button, then the icon itself opens the picker and no media button is left.
    await page.locator('.mo-editor-inline-list-row [data-field="title"]').first().click();
    await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Icon"]').click();
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
    await page.locator('.mo-editor-inline-list-row [data-field="title"]').first().click();
    if ((await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-card-media').count()) !== 1)
      problems.push(`${label}: a card with an icon does not show the icon as a button`);
    if (await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-card-slots').count())
      problems.push(`${label}: the media buttons show although the card has its icon`);
    if ((await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-card-media-box svg').count()) !== 1)
      problems.push(`${label}: the card's icon is not shown exactly once`);
    await cardSettings('a card with an icon');
    // A video: the Media choice of the first card, then its link.
    await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-card-media').click();
    // The Media choice is the choice group: buttons when they fit, else the list of radio buttons (the whole row is the target).
    const mediaVideo = page.getByRole('button', { name: 'Video', exact: true }).last();
    if (await mediaVideo.count()) await mediaVideo.click();
    else
      await page
        .locator('.mo-choice-group__list .mo-list__item-content', { hasText: /^Video$/ })
        .last()
        .click();
    await page.getByRole('textbox', { name: 'Video link' }).fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    await page.waitForTimeout(400);
    await page
      .locator('dialog[open] button[aria-label="Close"]')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(300);
    await page.locator('.mo-editor-inline-list-row [data-field="title"]').first().click();
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
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Show the steps in order.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-steps .mo-editor-inline-list-row-active [data-field="title"]');
  const steps = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.mo-editor-inline-steps .mo-block-steps__step[data-row]:not(.mo-editor-inline-list-row-next)')].map(
        (li) => ({
          number: li.querySelector('.mo-block-steps__step-number').textContent,
          title: li.querySelector('[data-field="title"]').value,
          text: li.querySelector('[data-field="text"]').value,
        }),
      ),
    );
  const faded = () => page.locator('.mo-editor-inline-steps .mo-editor-inline-list-row-next').count();
  if ((await faded()) !== 1) problems.push(`${label}: a new Steps block does not start with one faded, empty step`);
  const number = await page.locator('.mo-editor-inline-steps .mo-block-steps__step-number').first().textContent();
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
  // The heading's first line is centred on the number (within 1 px), read from the real boxes: the field's top plus its border and padding
  // plus half its line height, against the number's middle.
  const off = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-editor-inline-steps .mo-block-steps__step[data-row]:not(.mo-editor-inline-list-row-next)')].map(
      (li) => {
        const n = li.querySelector('.mo-block-steps__step-number').getBoundingClientRect();
        const f = li.querySelector('[data-field="title"]');
        const c = getComputedStyle(f);
        const lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.2;
        const first = f.getBoundingClientRect().top + parseFloat(c.borderTopWidth) + parseFloat(c.paddingTop) + lh / 2;
        return Math.abs(first - (n.top + n.height / 2));
      },
    ),
  );
  if (!off.length || off.some((d) => !(d <= 1)))
    problems.push(`${label}: a step's heading is not centred on its number (off by ${off.map((d) => d.toFixed(1)).join(', ')} px)`);
  // The line joins a number to the next number and stops: every step but the last draws it down to the next number's middle (within 1 px),
  // and the last draws none. Read from the real boxes, as a step is added, so the last one changes.
  const lineProblems = () =>
    page.evaluate(() => {
      const lis = [...document.querySelectorAll('.mo-editor-inline-steps .mo-block-steps__step')];
      const out = [];
      lis.forEach((li, i) => {
        const c = getComputedStyle(li, '::before');
        const drawn = c.content !== 'none' && c.content !== 'normal';
        if (i === lis.length - 1) {
          if (drawn) out.push(`the last step draws a line`);
          return;
        }
        if (!drawn) return out.push(`step ${i + 1} draws no line`);
        const r = li.getBoundingClientRect();
        const to = lis[i + 1].querySelector('.mo-block-steps__step-number').getBoundingClientRect();
        const from = li.querySelector('.mo-block-steps__step-number').getBoundingClientRect();
        const top = r.top + parseFloat(c.top);
        const bottom = r.bottom - parseFloat(c.bottom);
        if (Math.abs(top - (from.top + from.height / 2)) > 1 || Math.abs(bottom - (to.top + to.height / 2)) > 1)
          out.push(`step ${i + 1}'s line does not run from its number to the next (${top.toFixed(1)} to ${bottom.toFixed(1)})`);
      });
      return out;
    });
  for (const p of await lineProblems()) problems.push(`${label}: ${p}`);
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
  await page.locator('.mo-editor-inline-steps [data-row="0"] [data-field="title"]').click();
  await page.waitForTimeout(200);
  // The step row's own Move down on the bar (not the block's, in its action row).
  await page.locator('.mo-editor-tools button[aria-label="Move down"]:visible').first().click();
  await page.waitForTimeout(200);
  now = await steps();
  if (now[1]?.title !== 'Order' || now.map((s) => s.number).join() !== '1,2,3')
    problems.push(`${label}: Move down did not move and renumber the step: ${JSON.stringify(now)}`);
  for (const p of await lineProblems()) problems.push(`${label}: after a move, ${p}`);
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
    await pressInsert(p2, 'click');
    await p2.locator('dialog[open] button', { hasText: 'Show the steps in order.' }).first().click();
    await p2.waitForSelector('.mo-editor-inline-steps .mo-editor-inline-list-row-active [data-field="title"]');
    const taken = await p2.evaluate(
      ([html, plain]) => {
        const data = new DataTransfer();
        data.setData('text/plain', plain);
        data.setData('text/html', html);
        // true when a step took the paste over (preventDefault), false when it is left to the browser as it is.
        return !document
          .querySelector('.mo-editor-inline-steps [data-field="title"]')
          .dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
      },
      [html, plain],
    );
    if (taken !== expected > 0)
      problems.push(`${label}: the paste ${html} was ${taken ? 'taken over' : 'left as it is'}, not the other way`);
    await p2.waitForTimeout(300);
    const made = await p2.locator('.mo-editor-inline-steps .mo-block-steps__step[data-row]:not(.mo-editor-inline-list-row-next)').count();
    if (made !== expected) problems.push(`${label}: pasting ${html} made ${made} steps, not ${expected}`);
    await p2.close();
  }
}

/** Pasting lines into an empty item makes one item each (spec 2026-11-14-paste-and-change-to-design.md, section 2): in List, List - Expand,
 * Cards and Steps, three lines pasted into the empty block make three items with those titles (a tab gives the second field its
 * text), the cursor in the last field of the last; a paste with a `#` line is left as it is; a paste into an empty item after Add below
 * makes items there and keeps the items before; Ctrl+Z gives the block back as it was before the paste. */
const pasteBlocks = [
  { name: 'list', hint: 'Show text and images in a list.', first: 'title', second: 'text', last: 'text' },
  { name: 'expand', hint: 'Show list items that expand and collapse.', first: 'title', second: 'text', last: 'text' },
  { name: 'cards', hint: 'Show content and actions in cards.', first: 'title', second: 'text', last: 'text' },
  { name: 'steps', hint: 'Show the steps in order.', first: 'title', second: 'text', last: 'text' },
];
async function checkInlinePaste(width, height, block) {
  const label = `${width}px paste in ${block.name}`;
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
  await page.locator('dialog[open] button', { hasText: block.hint }).first().click();
  const first = `.mo-editor-inline-list-host [data-row] [data-field="${block.first}"]`;
  await page.waitForSelector(first);
  // Pastes `plain` (and `html`) into the first field of row `row`; true when the block took the paste over (preventDefault).
  const paste = (row, plain, html = '') =>
    page.evaluate(
      ([sel, row, plain, html]) => {
        const data = new DataTransfer();
        data.setData('text/plain', plain);
        if (html) data.setData('text/html', html);
        const field = document.querySelector(sel.replace('[data-row]', `[data-row="${row}"]`));
        field.focus();
        return !field.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
      },
      [first, row, plain, html],
    );
  // The items with something typed in their first field: [first, second].
  const items = () =>
    page.evaluate(
      ([f, s]) =>
        [...document.querySelectorAll('.mo-editor-inline-list-host [data-row]')]
          .filter((r) => !r.parentElement.closest('[data-row]'))
          .map((r) => [r.querySelector(`[data-field="${f}"]`)?.value ?? '', r.querySelector(`[data-field="${s}"]`)?.value ?? ''])
          .filter(([a]) => a),
      [block.first, block.second],
    );
  if (await paste(0, '# Menu\nTea\nCake')) problems.push(`${label}: a paste with a heading line was taken over`);
  await page.waitForTimeout(200);
  if ((await items()).length > 1) problems.push(`${label}: a paste with a heading line made items: ${JSON.stringify(await items())}`);
  // The heading paste is the browser's own (the event does nothing here): the field is still empty.
  if (!(await paste(0, '- Order\tChoose it\n- Pay\n- Get it', '<ul><li>Order</li><li>Pay</li><li>Get it</li></ul>')))
    problems.push(`${label}: three pasted lines were left to the browser`);
  await page.waitForTimeout(300);
  const titles = (await items()).map(([a]) => a).join();
  if (titles !== 'Order,Pay,Get it') problems.push(`${label}: three pasted lines made ${titles}, not Order,Pay,Get it`);
  const cursor = await page.evaluate(() => {
    const el = document.activeElement;
    return `${el?.closest('[data-row]')?.getAttribute('data-row')} ${el?.getAttribute('data-field')}`;
  });
  if (cursor !== `2 ${block.last}`)
    problems.push(`${label}: after the paste the cursor is in ${cursor}, not in the last item's ${block.last}`);
  // The tab gave the first item its text (an item that folds shows it once it is the active one).
  await page.locator(first.replace('[data-row]', '[data-row="0"]')).click();
  await page.waitForTimeout(300);
  const text = await page.locator(`.mo-editor-inline-list-host [data-row="0"] [data-field="${block.second}"]`).first().inputValue();
  if (text !== 'Choose it') problems.push(`${label}: the text after the tab in the first line is "${text}", not "Choose it"`);
  // An empty item after Add below takes a paste too, in its place; the item before it stays.
  await page.locator('.mo-editor-inline-list-host [data-add-row]').first().click();
  await page.waitForTimeout(300);
  if (!(await paste(3, 'Ship\nTrack'))) problems.push(`${label}: lines pasted into an added empty item were left to the browser`);
  await page.waitForTimeout(300);
  const after = (await items()).map(([a]) => a).join();
  if (after !== 'Order,Pay,Get it,Ship,Track') problems.push(`${label}: a paste into an added item gave ${after}`);
  // Ctrl+Z takes the paste back as one step.
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
  const undone = (await items()).map(([a]) => a).join();
  if (undone !== 'Order,Pay,Get it') problems.push(`${label}: Ctrl+Z after the paste gave ${undone}, not the items before it`);
  await page.close();
}

/** Pasting into an empty Table (spec 2026-11-14-paste-and-change-to-design.md, section 2, The Table): a spreadsheet's lines with tabs make
 * its rows and cells, the first line the header row (the setting stays on); a document's `<table>` gives the rows of its html; a paste with a
 * `#` line, and a paste into a Table with content, are the browser's own; Ctrl+Z gives the empty Table back. */
async function checkTablePaste(width, height) {
  const label = `${width}px paste in table`;
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
  await page.locator('dialog[open] button', { hasText: 'Show data in rows and columns.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-table-cell-active textarea');
  // Pastes into the cell at row `r`, column `c`; true when the Table took the paste over (preventDefault).
  const paste = (r, c, plain, html = '') =>
    page.evaluate(
      ([r, c, plain, html]) => {
        const data = new DataTransfer();
        data.setData('text/plain', plain);
        if (html) data.setData('text/html', html);
        const field = document.querySelector(`.mo-editor-inline-table-box [data-row="${r}"] [data-field="${c}"]`);
        field.focus();
        return !field.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
      },
      [r, c, plain, html],
    );
  const grid = () =>
    page.evaluate(() => ({
      rows: [...document.querySelectorAll('.mo-editor-inline-table-box tr[data-row]')].map((tr) =>
        [...tr.querySelectorAll('textarea')].map((f) => f.value),
      ),
      header: document.querySelectorAll('.mo-editor-inline-table-box thead th').length,
      cursor: (() => {
        const el = document.activeElement;
        return `${el?.closest('[data-row]')?.getAttribute('data-row')} ${el?.getAttribute('data-field')}`;
      })(),
    }));
  if (await paste(0, 0, '# Prices\tNow\nTea\t4')) problems.push(`${label}: a paste with a heading line was taken over`);
  if (!(await paste(0, 0, 'Product\tPrice\r\nTea\t4\nCake\t5\n')))
    problems.push(`${label}: a spreadsheet's lines were left to the browser`);
  await page.waitForTimeout(300);
  let now = await grid();
  const want = JSON.stringify([
    ['Product', 'Price'],
    ['Tea', '4'],
    ['Cake', '5'],
  ]);
  if (JSON.stringify(now.rows) !== want) problems.push(`${label}: the pasted lines made ${JSON.stringify(now.rows)}, not ${want}`);
  if (now.header !== 2) problems.push(`${label}: the first pasted line is not the header row (${now.header} header cells)`);
  if (now.cursor !== '2 1') problems.push(`${label}: after the paste the cursor is in ${now.cursor}, not in the last cell`);
  // A Table with content: the paste is the browser's own, into the one cell.
  if (await paste(1, 0, 'Pie\t6\nBun\t2')) problems.push(`${label}: a paste into a Table with content was taken over`);
  // Ctrl+Z takes the paste back as one step: the empty Table.
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
  now = await grid();
  if (now.rows.flat().some((v) => v)) problems.push(`${label}: Ctrl+Z after the paste left ${JSON.stringify(now.rows)}`);
  // A document's table (Google Docs, Word): its html gives the rows, not its plain text (one cell per line).
  const html =
    '<meta charset="utf-8"><table><tbody><tr><td><p><span>Day</span></p></td><td><p><span>Hours</span></p></td></tr><tr><td><p>Mon&nbsp;&ndash;&nbsp;Fri</p></td><td><p>9&ndash;17</p></td></tr></tbody></table>';
  if (!(await paste(0, 0, 'Day\nHours\nMon – Fri\n9–17', html))) problems.push(`${label}: a document's table was left to the browser`);
  await page.waitForTimeout(300);
  now = await grid();
  const doc = JSON.stringify([
    ['Day', 'Hours'],
    ['Mon – Fri', '9–17'],
  ]);
  if (JSON.stringify(now.rows) !== doc) problems.push(`${label}: a document's table made ${JSON.stringify(now.rows)}, not ${doc}`);
  await page.close();
}

export function register(unit) {
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    for (const name of ['list', 'expand', 'buttons', 'cards'])
      unit(`checkIconSlots ${width} ${name}`, () =>
        checkIconSlots(
          width,
          height,
          inlineBlocks.find((b) => b.name === name),
        ),
      );
  for (const block of inlineBlocks) unit(`checkInlineBlock 375 ${block.name}`, () => checkInlineBlock(375, 740, block));
  // On a computer too: the row's settings are in the side panel at once (a card's: its page and its buttons).
  for (const block of inlineSingles)
    for (const w of [375, 1280]) unit(`checkInlineSingle ${w} ${block.name}`, () => checkInlineSingle(w, w < 600 ? 740 : 900, block));
  for (const block of inlineBlocks) unit(`checkInlineBlock 1280 ${block.name}`, () => checkInlineBlock(1280, 900, block));
  for (const [w, h] of [
    [375, 740],
    [768, 900],
    [1280, 900],
  ])
    unit(`checkListDesigns ${w}`, () => checkListDesigns(w, h));
  for (const [width, height] of [
    [375, 740],
    [768, 900],
    [1280, 900],
  ])
    unit(`checkSteps ${width}`, () => checkSteps(width, height));
  for (const scheme of ['light', 'dark'])
    for (const color of ['', 'primary', 'tertiary'])
      unit(`checkFilledSlotRing ${scheme} ${color || 'default'}`, () => checkFilledSlotRing(scheme, color));
  for (const w of [390, 1280]) unit(`checkInlineButtonMeasure ${w}`, () => checkInlineButtonMeasure(w, w < 600 ? 740 : 900));
  for (const block of pasteBlocks)
    for (const w of [375, 1280]) unit(`checkInlinePaste ${w} ${block.name}`, () => checkInlinePaste(w, w < 600 ? 740 : 900, block));
  for (const w of [375, 1280]) unit(`checkInlinePaste ${w} table`, () => checkTablePaste(w, w < 600 ? 740 : 900));
}
