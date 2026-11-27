import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { openEditor } from '../built-site.mjs';
import { ROOT, blocksOf, browser, has, problems, shots, site } from './support/context.mjs';
import { chooseKind, onTestPage, pressInsert } from './support/shared.mjs';
import { isMaterialTheme } from '../theme-statement.mjs';
import { pageLanguage } from './support/page-language.mjs';
import { shortfall } from './support/statement.mjs';

/** The Image grid typed in place: `Add images` asks for several images of the Library (a tap selects, the button under them says how many it adds), puts them in the block as picked images, and a tap on an image opens its sheet with the text of its own, which the card then has as its alt text. */
async function checkImageGridAdd(width, height) {
  const label = `${width}px image grid add images`;
  if (!has('src/data/files')) return void console.log(`${label}: skipped, the site has no images with tags, which the demo has.`);
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
  await page.locator('dialog[open] button', { hasText: 'Show images from Files in a grid.' }).first().click();
  await page.waitForSelector('.mo-site-block-inline .mo-block-imagegrid__grid li', { timeout: 8000 });
  const before = await page.locator('.mo-site-block-inline .mo-block-imagegrid__grid li').count();
  await page.getByRole('button', { name: 'Add images' }).click();
  await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
  if (!(await page.locator('dialog[open]').getByText('Select images').count()))
    problems.push(`${label}: the picker is not the one for several images`);
  if (await page.locator('dialog[open]').getByRole('button', { name: 'Upload a new image' }).count())
    problems.push(`${label}: the picker for several images offers an upload`);
  await page.locator('dialog[open] [data-media-tile]').nth(0).click();
  await page.locator('dialog[open] [data-media-tile]').nth(1).click();
  const selected = await page.locator('dialog[open] [data-media-tile][aria-checked="true"]').count();
  if (selected !== 2) problems.push(`${label}: ${selected} tiles are selected after two taps, not 2`);
  const add = page.getByRole('button', { name: 'Add 2 images' });
  if (!(await add.count())) problems.push(`${label}: no button says it adds 2 images`);
  else await add.click();
  await page.waitForFunction(() => !document.querySelector('dialog[open] [data-media-tile]'), null, { timeout: 8000 });
  const after = await page.locator('.mo-site-block-inline .mo-block-imagegrid__grid li').count();
  if (after < 2 || after < before) problems.push(`${label}: the grid shows ${after} images after adding, ${before} before`);
  // A tap on an image: its sheet, with the text of its own; the card draws it.
  await page.locator('.mo-site-block-inline .mo-block-imagegrid__grid li a[data-image]').first().click();
  const field = page.getByLabel('Alt text').first();
  try {
    await field.waitFor({ timeout: 8000 });
    await field.fill('Typed alt text');
    await page.waitForTimeout(400);
    const alt = await page.locator('.mo-site-block-inline .mo-block-imagegrid__grid li img').first().getAttribute('alt');
    if (alt !== 'Typed alt text') problems.push(`${label}: the card's image has the alt text "${alt}", not the one typed in its sheet`);
  } catch {
    problems.push(`${label}: a tap on an image did not open its sheet with an alt text field`);
  }
  await page.close();
}

async function checkCardImage(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px card image`;
  if (!has('src/data/files')) return void console.log(`${label}: skipped, the site has no images in its Library, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, phone ? 'tap' : 'click');
  await page.locator('dialog[open] button', { hasText: 'Show content and actions in cards.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.keyboard.type('One');
  await page.waitForTimeout(300);
  await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Image"]').click();
  await page.waitForTimeout(1000);
  await chooseKind(page, 'Image');
  await page
    .locator('dialog[open] button, .mo-editor-side-sheet button', { hasText: /^Select image$/ })
    .first()
    .click();
  await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
  await page.locator('dialog[open] [data-media-tile]').first().click();
  await page.waitForTimeout(800);
  // Closing the card's sheet on a phone (a side sheet stays open beside the card).
  await page
    .locator('dialog[open] button[aria-label="Close"]')
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  const tap = (loc) => (phone ? loc.tap() : loc.click());
  await tap(page.locator('.mo-editor-inline-list-row [data-field="title"]').first());
  await page.waitForTimeout(400);
  const picture = () =>
    page.evaluate(() => {
      const box = document.querySelector('.mo-block-cards__card-picture, .mo-block-cards__card .mo-card__media');
      const r = box?.getBoundingClientRect();
      return box ? { ratio: Math.round((r.width / r.height) * 100) / 100, img: !!box.querySelector('img') } : null;
    });
  const first = await picture();
  if (!first?.img) problems.push(`${label}: the card has no image`);
  else if (first.ratio !== 1.5) problems.push(`${label}: a Cards block without a ratio draws its image in ${first.ratio}, not 3:2`);
  // The block's settings have Image aspect ratio (no Original); 1:1 makes every card's image a square, with no crop view opened.
  await page.getByRole('button', { name: 'Block settings' }).first().click();
  await page.waitForTimeout(900);
  const settings = page.locator('dialog[open], .mo-editor-side-sheet').last();
  if (!(await settings.locator('label', { hasText: /^Image aspect ratio$/ }).count()))
    problems.push(`${label}: the block's settings have no Image aspect ratio`);
  await page.locator('dialog[open] button, .mo-editor-side-sheet button', { hasText: /^3:2$/ }).first().click();
  await page.waitForTimeout(300);
  const offered = await page.evaluate(() =>
    [...document.querySelectorAll('dialog[open]:last-of-type button, .mo-editor-menu button, [role="listbox"] *')].map((o) =>
      o.textContent.trim(),
    ),
  );
  if (offered.includes('Original')) problems.push(`${label}: Image aspect ratio offers Original`);
  await page.locator('dialog[open] button, .mo-editor-menu button, [role="listbox"] *', { hasText: /^1:1$/ }).last().click();
  await page.waitForTimeout(400);
  await settings
    .getByRole('button', { name: 'Save', exact: true })
    .click({ timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(800);
  const square = await picture();
  if (square?.ratio !== 1) problems.push(`${label}: after 1:1 the card's image box is ${square?.ratio}, not square`);
  // Crop: the crop view of the block's ratio only, no ratio chips; Save puts the ratio and the crop after the image's address.
  // Crop is in the image's sheet, which a tap on the card's image opens (B11, B12); the bar has no image tools.
  await page
    .locator('dialog[open] button[aria-label="Close"], .mo-editor-side-sheet button[aria-label="Close"]')
    .last()
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(400);
  await tap(page.locator('.mo-editor-inline-card-media').first());
  await page.waitForTimeout(700);
  await tap(page.locator('dialog[open], .mo-editor-side-sheet').last().getByRole('button', { name: 'Crop', exact: true }));
  await page
    .waitForSelector('dialog.mo-editor-crop-page[open]', { timeout: 8000 })
    .catch(() => problems.push(`${label}: Crop did not open the crop page`));
  if (await page.locator('.mo-editor-crop-view-ratios').count())
    problems.push(`${label}: the crop view of a card shows aspect ratio chips`);
  // Moving the image with the arrow keys (by 2 %) makes a crop of its own.
  await page.locator('.mo-editor-crop-view-frame').focus();
  for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp']) await page.keyboard.press(key);
  await page
    .locator('dialog.mo-editor-crop-page button', { hasText: /^Save$/ })
    .click({ timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(800);
  const cut = await page.evaluate(
    () =>
      document.querySelector('.mo-block-cards__card-picture img, .mo-block-cards__card .mo-card__media img')?.getAttribute('style') ?? '',
  );
  if (!/transform/.test(cut)) problems.push(`${label}: the saved crop is not drawn on the card (style "${cut}")`);
  await page.screenshot({ path: join(shots, `card-image-${width}.png`) });
  await page.close();
}

/** The media sheet of a card (0.19.8 plan, section 4; B6, B11, B12): a tap on the card's image selects the block and opens the image's sheet in one tap, on the image,
 * with Change media, Change image, Crop, Alt text and Remove under it and no list of kinds; Change media shows the kinds as a radio list; the text bar has no image tools;
 * from a keyboard Enter and Space on the image do the same, Escape closes the sheet and the focus is back on the image with the block still selected. */
async function checkMediaSheet(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px media sheet`;
  if (!has('src/data/files')) return void console.log(`${label}: skipped, the site has no images in its Library, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, phone ? 'tap' : 'click');
  await page.locator('dialog[open] button', { hasText: 'Show content and actions in cards.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.keyboard.type('One');
  await page.waitForTimeout(300);
  await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot[aria-label="Image"]').click();
  await page.waitForTimeout(1000);
  // Nothing is set yet: one tap opens the sheet at the radio list of kinds.
  const firstKinds = await page.locator('dialog[open] input[type=radio], .mo-editor-side-sheet input[type=radio]').count();
  if (firstKinds < 3) problems.push(`${label}: a media slot with nothing set did not open the radio list of kinds (${firstKinds})`);
  await chooseKind(page, 'Image');
  await page
    .locator('dialog[open] button, .mo-editor-side-sheet button', { hasText: /^Select image$/ })
    .first()
    .click();
  await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
  await page.locator('dialog[open] [data-media-tile]').first().click();
  await page.waitForTimeout(800);
  const sheet = () => page.locator('dialog[open], .mo-editor-side-sheet').last();
  const close = async () => {
    await page
      .locator('dialog[open] button[aria-label="Close"], .mo-editor-side-sheet [data-side-sheet-close]')
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(500);
  };
  const names = async () => (await sheet().locator('button').allTextContents()).map((b) => b.trim()).filter(Boolean);
  await close();
  // Nothing else is selected: a tap in the text above leaves the block.
  await page.locator('.ProseMirror p').first().click();
  await page.waitForTimeout(400);
  const media = page.locator('.mo-editor-inline-card-media').first();
  await media[phone ? 'tap' : 'click']();
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => ({
    row: !!document.querySelector('.mo-site-block-row:not(.mo-site-block-row-hover)'),
    open: !!document.querySelector('dialog[open], .mo-editor-side-sheet'),
    tools: [...document.querySelectorAll('.mo-editor-tools-context button')].map(
      (b) => b.getAttribute('aria-label') || b.textContent.trim(),
    ),
  }));
  if (!state.open) problems.push(`${label}: one tap on a card's image did not open its sheet`);
  if (!state.row) problems.push(`${label}: one tap on a card's image did not select the block (no action row)`);
  const have = await names();
  for (const name of ['Change media', 'Change image', 'Crop', 'Alt text', 'Remove'])
    if (!have.includes(name)) problems.push(`${label}: the image's sheet has no ${name} (${have.join(', ')})`);
  if (await sheet().locator('input[type=radio]').count()) problems.push(`${label}: the kinds of media show before Change media is pressed`);
  if (!(await sheet().locator('.mo-editor-media-panel-preview img').count()))
    problems.push(`${label}: the sheet does not show the selected image`);
  for (const name of ['Replace', 'Change image', 'Crop', 'Alt text', 'Delete'])
    if (state.tools.includes(name)) problems.push(`${label}: the text bar still has the image tool ${name}`);
  // After a mouse or touch tap the focus comes back to the image when the sheet closes, as it does from the keyboard.
  await close();
  if (!(await media.evaluate((m) => document.activeElement === m)))
    problems.push(
      `${label}: after closing the sheet by a tap the focus is not on the image (${await page.evaluate(() => document.activeElement?.tagName + '.' + document.activeElement?.className)})`,
    );
  await media[phone ? 'tap' : 'click']();
  await page.waitForTimeout(900);
  await sheet().getByRole('button', { name: 'Change media', exact: true }).click();
  await page.waitForTimeout(400);
  const kinds = await sheet().locator('input[type=radio]').count();
  if (kinds < 3) problems.push(`${label}: Change media shows ${kinds} kinds, not a radio list of the kinds`);
  await close();
  if (!phone) {
    // Keyboard: Enter and Space open the sheet, Escape closes it and the focus is back on the image, the block still selected.
    for (const key of ['Enter', 'Space']) {
      await media.focus();
      await page.keyboard.press(key);
      await page.waitForTimeout(700);
      if (!(await page.locator('.mo-editor-side-sheet, dialog[open]').count()))
        problems.push(`${label}: ${key} on the image did not open the sheet`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      const back = await page.evaluate(() => ({
        onImage: document.activeElement?.classList.contains('mo-editor-inline-card-media') ?? false,
        row: !!document.querySelector('.mo-site-block-row:not(.mo-site-block-row-hover)'),
        ring: document.activeElement ? getComputedStyle(document.activeElement).outlineStyle !== 'none' : false,
      }));
      if (!back.onImage) problems.push(`${label}: after Escape (${key}) the focus is not on the image`);
      if (!back.row) problems.push(`${label}: after Escape (${key}) the block is not selected`);
    }
  }
  await page.screenshot({ path: join(shots, `media-sheet-${width}.png`) });
  await page.close();
}

/** A click or a tap in the headline of an inactive card makes that card the active one, at every width: the pointer lands in the card's own field
 * (nothing is over it), and the card becomes active from the field's focus. A real mouse click and, on a touch screen, a tap. */
async function checkCardClickActivates(width, height, how) {
  const label = `${width}px ${how} in an inactive card's headline`;
  const touch = how === 'tap';
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Show content and actions in cards.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-cards [data-row="0"] [data-field="title"]');
  await page.keyboard.type('Tea');
  await page.locator('.mo-editor-inline-list-host [data-add-row]').first().click();
  await page.keyboard.type('Cake');
  await page.waitForTimeout(300);
  const target = page.locator('.mo-editor-inline-cards [data-row="0"] [data-field="title"]').first();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const hit = await page.evaluate(
    ([px, py]) => {
      const el = document.elementFromPoint(px, py);
      return el ? `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}` : 'none';
    },
    [x, y],
  );
  const own = await page.evaluate(
    ([px, py]) => !!document.elementFromPoint(px, py)?.closest('[data-row="0"] [data-field="title"]'),
    [x, y],
  );
  if (!own) problems.push(`${label}: the point in the headline hits ${hit}, not the headline`);
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await page.waitForTimeout(400);
  const state = await page.evaluate(() => ({
    active: document.querySelector('.mo-editor-inline-cards [data-row="0"]')?.getAttribute('aria-current') === 'true',
    focus: document.activeElement?.closest('[data-field]')?.getAttribute('data-field') ?? document.activeElement?.className ?? '',
  }));
  if (!state.active) problems.push(`${label}: the card is not active after it (focus is in "${state.focus}")`);
  // The same from outside the block: the cursor is in the paragraph above, so no card of the block is active, and a pointer in the second card's headline.
  await page.locator('.ProseMirror p').first().click();
  await page.waitForTimeout(300);
  const second = page.locator('.mo-editor-inline-cards [data-row="1"] [data-field="title"]').first();
  await second.scrollIntoViewIfNeeded();
  const box2 = await second.boundingBox();
  const x2 = box2.x + box2.width / 2;
  const y2 = box2.y + box2.height / 2;
  if (touch) await page.touchscreen.tap(x2, y2);
  else await page.mouse.click(x2, y2);
  await page.waitForTimeout(400);
  const outside = await page.evaluate(() => ({
    active: document.querySelector('.mo-editor-inline-cards [data-row="1"]')?.getAttribute('aria-current') === 'true',
    focus: document.activeElement?.closest('[data-field]')?.getAttribute('data-field') ?? document.activeElement?.className ?? '',
  }));
  if (!outside.active)
    problems.push(`${label}: from the paragraph above, the second card is not active after it (focus is in "${outside.focus}")`);
  await page.close();
}

/** A card's text is optional (spec 2026-11-14-paste-and-change-to-design.md, decision 10): typed in place, a card with only a headline
 * has no empty text area once another card is active, and on the site the "Only a headline" card of the system's test page (the demo's Blocks page) has no text element. */
async function checkCardHeadline(width, height) {
  const label = `${width}px card with only a headline`;
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
  await page.locator('dialog[open] button', { hasText: 'Show content and actions in cards.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-cards [data-row="0"] [data-field="title"]');
  await page.keyboard.type('Tea');
  // The card being typed in keeps its text field, for the text to be typed next.
  if (!(await page.locator('.mo-editor-inline-cards [data-row="0"] [data-field="text"]').count()))
    problems.push(`${label}: the active card has no text field`);
  await page.locator('.mo-editor-inline-list-host [data-add-row]').first().click();
  await page.keyboard.type('Cake');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('With cream');
  await page.waitForTimeout(300);
  const fields = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-editor-inline-cards [data-row]')]
      .map((c) => (c.querySelector('[data-field="text"]') ? 'text' : 'none'))
      .join(),
  );
  if (fields !== 'none,text') problems.push(`${label}: the cards' text areas are ${fields}, not none (a headline only), text`);
  await page.close();
  const sitePage = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  sitePage.on('pageerror', (e) => problems.push(`${label} (site): ${e.message}`));
  // The system's test page (the demo's Blocks page, on a copy of any site: the starter has no Blocks page of its own).
  if (!(await onTestPage(sitePage, label))) return sitePage.close();
  const card = await sitePage.evaluate(() => {
    const title = [...document.querySelectorAll('.mo-block-cards__card-title, .mo-block-cards__card .mo-card__headline')].find(
      (t) => t.textContent.trim() === 'Only a headline',
    );
    const card = title?.closest('.mo-block-cards__card');
    return card
      ? {
          text: !!card.querySelector('.mo-block-cards__card-text, .mo-block-cards__card .mo-card__supporting'),
          height: card.getBoundingClientRect().height,
        }
      : null;
  });
  if (!card) problems.push(`${label} (site): the card "Only a headline" is not on the system's test page`);
  else if (card.text) problems.push(`${label} (site): a card without text draws an empty text element`);
  await sitePage.close();
}

/** The Library's images are the theme's image tiles in a staggered grid: cards with media (filled, the image to the edge), each in its own proportions (the box is
 * there before the image loads), 8 px apart (M3 Cards, Specs: "Padding between cards 8dp max"), 2 columns on a phone and 4 on a computer, and a selected card has its own surface. */
async function checkImageGrid(width, height) {
  const label = `${width}px image grid`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, {});
  // A site with no images (the starter's) has no grid to measure.
  const images = await page.evaluate(
    async (base) => Object.keys(await (await fetch(`${base}/editor/thumbnails.json`)).json()).length,
    site,
  );
  if (!images) {
    console.log(`${label}: skipped, the site has no images to measure, which the demo has.`);
    return page.close();
  }
  await page.goto(`${site}/editor/#files`);
  await page.waitForSelector('ul.mo-staggered-grid', { timeout: 30_000 });
  const m = await page.evaluate(() => {
    const grid = document.querySelector('ul.mo-staggered-grid');
    const gs = getComputedStyle(grid);
    const tiles = [...grid.querySelectorAll('button.mo-card')];
    const media = tiles.map((t) => t.querySelector('.mo-card__media')).filter(Boolean);
    const plain = document.createElement('div');
    plain.className = 'mo-card mo-is-filled';
    const chosen = document.createElement('div');
    chosen.className = 'mo-card mo-is-filled mo-is-selected';
    document.body.append(plain, chosen);
    const surfaces = [getComputedStyle(plain).backgroundColor, getComputedStyle(chosen).backgroundColor];
    plain.remove();
    chosen.remove();
    return {
      columns: gs.columnCount,
      gap: gs.columnGap,
      tiles: tiles.length,
      cards: tiles.filter((t) => t.classList.contains('mo-is-filled') && t.classList.contains('mo-has-media')).length,
      ratios: media.filter((el) => el.style.aspectRatio).length,
      // A tile's image box takes its ratio from its image (the inline aspect-ratio); one with a ratio from a rule and none of its own is forced.
      forced: media.filter((el) => !el.style.aspectRatio && getComputedStyle(el).aspectRatio !== 'auto').length,
      heights: [...new Set(tiles.map((t) => Math.round(t.getBoundingClientRect().height)))].length,
      sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      surfaces,
      names: tiles.filter((t) => !t.getAttribute('aria-label')).length,
    };
  });
  const columns = phone ? '2' : '4';
  if (m.tiles === 0) problems.push(`${label}: the Library has no tiles to measure`);
  if (m.columns !== columns) problems.push(`${label}: ${m.columns} columns, expected ${columns}`);
  // The room between cards is 8 px (M3 Cards, Specs: "Padding between cards 8dp max"), on every width.
  const gutter = '8px';
  if (isMaterialTheme() && m.gap !== gutter)
    problems.push(`${label}: the gap between columns is ${m.gap}, expected ${gutter} (M3's 8dp max between cards)`);
  if (m.cards !== m.tiles) problems.push(`${label}: ${m.tiles - m.cards} tiles are not a filled card with media`);
  if (m.forced) problems.push(`${label}: ${m.forced} tiles have an image box with a fixed ratio of its own, not the image's`);
  if (m.sideways) problems.push(`${label}: the page scrolls sideways`);
  if (m.names) problems.push(`${label}: ${m.names} tiles have no name for a screen reader`);
  if (m.surfaces[0] === m.surfaces[1])
    problems.push(`${label}: a selected card has the same surface as an unselected one (${m.surfaces[0]})`);
  console.log(`${label}: ${m.tiles} tiles, ${m.ratios} with their own ratio, ${m.heights} different heights`);
  await page.close();
}

/** A card's icon with no color of its own (`iconColor`) is drawn in the text colour (the card's title), on an outlined, a filled and an elevated card, light and dark, and reads at 3:1 (WCAG non-text) on what is behind it. */
async function checkCardIconText(width, height, scheme) {
  const label = `${width}px card icon text color (${scheme})`;
  const phone = width < 600;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: phone,
    isMobile: phone,
    locale: 'en-US',
    colorScheme: scheme,
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const found = await page.evaluate(() => {
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
    const behind = (el) => {
      for (let n = el.parentElement; n; n = n.parentElement) {
        const bg = getComputedStyle(n).backgroundColor;
        if (!/rgba\(.*, 0\)|transparent/.test(bg)) return bg;
      }
      return 'rgb(255, 255, 255)';
    };
    const designs = new Set();
    const out = [];
    for (const card of document.querySelectorAll('.mo-block-cards__card')) {
      const icon = card.querySelector('.mo-block-cards__card-icon');
      if (!icon || icon.hasAttribute('data-icon-color')) continue;
      const design = ['outlined', 'filled', 'elevated'].find((c) => card.classList.contains(`mo-is-${c}`)) ?? 'other';
      designs.add(design);
      const [a, b] = [lum(pixel(getComputedStyle(icon).color)), lum(pixel(behind(icon)))].sort((x, y) => y - x);
      out.push({
        design,
        icon: getComputedStyle(icon).color,
        title: getComputedStyle(card.querySelector('.mo-block-cards__card-title, .mo-block-cards__card .mo-card__headline')).color,
        contrast: (a + 0.05) / (b + 0.05),
      });
    }
    return out;
  });
  const designs = new Set(found.map((f) => f.design));
  for (const d of ['outlined', 'filled', 'elevated'])
    if (!designs.has(d)) problems.push(`${label}: no ${d} card with an icon and no color on the Blocks page`);
  for (const f of found) {
    console.log(`card icon contrast ${width}px ${scheme} ${f.design}: ${f.contrast.toFixed(2)}`);
    if (f.icon !== f.title) problems.push(`${label}: a ${f.design} card's icon is ${f.icon}, not the text colour ${f.title}`);
    if (f.contrast < 3)
      shortfall('1.4.11', 'icon', `${label}: a ${f.design} card's icon has contrast ${f.contrast.toFixed(2)}:1, under 3:1`);
  }
  await page.close();
}

/** Scrolling a carousel never forces a layout (the flicker on a fast swipe): while the row scrolls, the layout script reads no offsetLeft, offsetWidth, scrollWidth or getBoundingClientRect, and a frame that moves nothing writes no style. Where the browser has scroll-driven animations (ScrollTimeline) the items' growing and shrinking is tied to the scroll by the browser (data-carousel-driven="scroll"), so the script writes no style at all while the row scrolls (the owner's phone: the item did not grow smoothly while a swipe ran the script on every frame; before, 1000 to 3800 style writes and 400 to 750 ms of style work in four swipes at 4x CPU). Every carousel on the Blocks page, 375 px, touch. */
async function checkCarouselScrollCost() {
  const label = '375px carousel scroll cost';
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const n = await page.locator('[data-carousel-items]').count();
  for (let k = 0; k < n; k++) {
    const r = await page.evaluate(async (idx) => {
      const row = document.querySelectorAll('[data-carousel-items]')[idx];
      const reads = [];
      const spy = (proto, name) => {
        const d = Object.getOwnPropertyDescriptor(proto, name);
        Object.defineProperty(proto, name, {
          configurable: true,
          get() {
            reads.push(name);
            return d.get.call(this);
          },
        });
        return () => Object.defineProperty(proto, name, d);
      };
      const undo = [
        spy(HTMLElement.prototype, 'offsetLeft'),
        spy(HTMLElement.prototype, 'offsetWidth'),
        spy(Element.prototype, 'scrollWidth'),
      ];
      const gbr = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        reads.push('getBoundingClientRect');
        return gbr.call(this);
      };
      const max = row.scrollWidth - row.clientWidth;
      const carousel = row.closest('[data-carousel]');
      const scripted = ['multi-browse', 'hero'].includes(carousel.dataset.carouselLayout);
      let writes = 0;
      const watch = new MutationObserver((l) => (writes += l.length));
      watch.observe(carousel, { attributes: true, attributeFilter: ['style'], subtree: true });
      // One warm-up scroll first: a row is measured once when it is first shown or resized, which is not what is checked.
      row.style.scrollSnapType = 'none';
      row.scrollLeft = max * 0.1;
      await new Promise((res) => setTimeout(res, 300));
      watch.takeRecords();
      writes = 0;
      reads.length = 0;
      for (const f of [0.25, 0.6, 0.9, 0.3]) {
        row.style.scrollSnapType = 'none';
        row.scrollLeft = max * f;
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      }
      writes += watch.takeRecords().length;
      watch.disconnect();
      undo.forEach((u) => u());
      Element.prototype.getBoundingClientRect = gbr;
      row.style.scrollSnapType = '';
      return {
        max,
        reads: [...new Set(reads)],
        writes,
        scripted,
        driven: carousel.dataset.carouselDriven === 'scroll',
        supported: typeof ScrollTimeline === 'function',
      };
    }, k);
    if (r.max > 0 && r.reads.length)
      problems.push(`${label}: carousel ${k} reads ${r.reads.join(', ')} while it scrolls, which forces a layout each frame`);
    if (r.max > 0 && r.scripted && r.supported && !r.driven)
      problems.push(
        `${label}: carousel ${k} is not tied to the scroll by the browser (no data-carousel-driven="scroll"), so its items follow the finger a frame late`,
      );
    if (r.max > 0 && r.scripted && r.supported && r.writes)
      problems.push(
        `${label}: carousel ${k} writes style ${r.writes} times while it scrolls (limit 0): the script runs on every scroll frame and each write costs a style recalculation, a layout of the text and a paint`,
      );
  }
  await page.close();
}

/** The gap between two cards of a carousel stays the carousel's gap on the whole way, not only at rest (the owner's phone, 27 Nov 2026: "the distance between cards ... differs": a card that entered or left at the row's edge trailed 16 px from its neighbour, twice the gap, because the item outside the row stood where the padding ends). Every multi-browse and hero carousel on the Blocks page, the row scrolled in steps from its start to its end: the visible edges of two cards next to each other (their masks less the clipped part) are one gap apart. */
async function checkCarouselGap(width, height) {
  const label = `${width}px carousel gap`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const n = await page.locator('[data-carousel-items]').count();
  for (let k = 0; k < n; k++) {
    const r = await page.evaluate(async (idx) => {
      const row = document.querySelectorAll('[data-carousel-items]')[idx];
      const carousel = row.closest('[data-carousel]');
      if (!['multi-browse', 'hero'].includes(carousel.dataset.carouselLayout)) return null;
      const max = row.scrollWidth - row.clientWidth;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const masks = [...carousel.querySelectorAll('[data-carousel-mask]')];
      if (max <= 0 || masks.length < 2) return null;
      row.style.scrollSnapType = 'none';
      row.style.scrollBehavior = 'auto';
      const frame = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      let worst = { diff: 0 };
      for (let s = 0; s <= max + 5; s += 5) {
        row.scrollLeft = Math.min(s, max);
        await frame();
        const window_ = row.getBoundingClientRect();
        const edges = masks.map((m) => {
          const b = m.getBoundingClientRect();
          const inset = Number(/inset\(\S+ (-?[\d.]+)px/.exec(getComputedStyle(m).clipPath)?.[1] ?? 0);
          return { left: b.left + inset, right: b.right - inset };
        });
        const shown = (e) => e.right - e.left > 1 && e.right > window_.left && e.left < window_.right;
        for (let i = 1; i < edges.length; i++) {
          if (!shown(edges[i - 1]) || !shown(edges[i])) continue;
          const diff = Math.abs(edges[i].left - edges[i - 1].right - gap);
          if (diff > worst.diff) worst = { diff, at: Math.round(row.scrollLeft), pair: i, gap: edges[i].left - edges[i - 1].right };
        }
      }
      row.style.scrollSnapType = '';
      row.style.scrollBehavior = '';
      return { gap, worst, layout: carousel.dataset.carouselLayout };
    }, k);
    // `Show all` stands at the right under the row, its label on the content's edge (M3's picture of the carousel's accessibility), not centred.
    const all = await page.evaluate((idx) => {
      const row = document.querySelectorAll('[data-carousel-items]')[idx];
      const box = row.closest('[data-cards-carousel]')?.querySelector('.mo-block-cards__show-all');
      const button = box?.querySelector('button');
      if (!box || !button || getComputedStyle(box).display === 'none') return null;
      const text = document.createRange();
      text.selectNodeContents(button);
      return { label: text.getBoundingClientRect().right, edge: box.getBoundingClientRect().right };
    }, k);
    if (all && Math.abs(all.label - all.edge) > 1)
      problems.push(
        `${label}: carousel ${k}'s Show all label ends at ${Math.round(all.label)} px, not on the content's right edge at ${Math.round(all.edge)} px`,
      );
    if (r && r.worst.diff > 0.75)
      problems.push(
        `${label}: carousel ${k} (${r.layout}) has ${r.worst.gap.toFixed(1)} px between cards ${r.worst.pair - 1} and ${r.worst.pair} with the row at ${r.worst.at}, not its gap of ${r.gap} px`,
      );
  }
  await page.close();
}

/** Cards that are a carousel (`phone`, on the demo's Blocks page; since 0.19.8 on every screen size): at 375 px the row scrolls sideways with one card whole and the next peeking in, as Material 3's uncontained carousel is measured (gap 8, 8 above and below, 16 from the edge, corners 28), labelled, with no page indicator (M3 prints none); each layout the block offers (`layout`: multi-browse, hero, center-aligned hero, full-screen) is on the page, its items with M3's 28dp corners, and `Show all` is under every one but the full-screen one; `Show all` stacks the cards in place and `Show fewer` returns them, focus kept; the arrow keys move between the cards. At 840 and 1280 px it is the same row, with more cards in view (the hero keeps one small item), `Show all` under it, and a full-screen carousel is the hero. */
async function checkCardsCarousel(width, height) {
  const label = `${width}px cards carousel`;
  const phone = width < 600;
  // A full-screen carousel is a hero from 840 px and in landscape (FULL_SCREEN_AS_HERO); below that, in portrait, it is one item at a time.
  const stillFullScreen = width < 840 && height > width;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const root = page.locator('[data-cards-carousel]').first();
  if (!(await root.count())) return (problems.push(`${label}: no Cards carousel on the Blocks page`), page.close());
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // The page is in the site's language, whatever the browser's: the expected texts are the site's own, from its language files. The language is the
  // served `<html lang>`: the live attribute is rewritten to the browser's locale by the site's client script.
  const { lang, live, where } = await pageLanguage(page);
  // The browser is en-US, the site's language is not necessarily: the live attribute must equal the served one (the client script must not rewrite it).
  if (live !== lang) problems.push(`${label}: the live <html lang> is "${live}" but the server sent "${lang}"`);
  const say = blocksOf(lang).cards;
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
      widths: items.map((i) => Math.round(i.getBoundingClientRect().width)),
      // The card fills its item even with a short text (a flex item would shrink to its text and leave an empty gap).
      cardWidths: items.map((i) => {
        const card = i.querySelector('.mo-block-cards__item');
        const saved = [...card.querySelectorAll('.mo-block-cards__item-text')].map((p) => [p, p.textContent]);
        saved.forEach(([p]) => (p.textContent = 'Short'));
        const w = Math.round(card.getBoundingClientRect().width);
        saved.forEach(([p, t]) => (p.textContent = t));
        return w;
      }),
      gaps: items.slice(1).map((i, n) => Math.round(i.getBoundingClientRect().left - items[n].getBoundingClientRect().right)),
      firstRight: Math.round(a.right),
      secondLeft: Math.round(b.left),
      radius: getComputedStyle(items[0].querySelector('.mo-block-cards__item')).borderTopLeftRadius,
      // M3, Carousel: an item has no card surface and no outline, and its label sits inside it on the image (Overview: "Contain visual items like images or video, along with optional label text").
      surfaces: items.map((i) => {
        const item = i.querySelector('.mo-block-cards__item');
        const s = getComputedStyle(item);
        const b = item.getBoundingClientRect();
        const label = item.querySelector('.mo-block-cards__item-label')?.getBoundingClientRect();
        const media = item.querySelector('.mo-block-cards__item-media')?.getBoundingClientRect();
        return {
          border: s.borderTopWidth,
          shadow: s.boxShadow,
          card: !!i.querySelector('.mo-card'),
          labelInside: !!label && label.left >= b.left - 1 && label.right <= b.right + 1 && label.bottom <= b.bottom + 1,
          mediaFills: !media || (Math.abs(media.width - b.width) < 1 && Math.abs(media.height - b.height) < 1),
          height: Math.round(b.height),
        };
      }),
      indicators: el.querySelectorAll('[data-carousel-indicator], [data-carousel-dot]').length,
      items: items.length,
      showAll: getComputedStyle(show.closest('.mo-block-cards__show-all')).display,
      region: el.querySelector('[role="region"]')?.getAttribute('aria-label') ?? null,
      itemLabels: items.map((i) => i.getAttribute('aria-label')),
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  if (phone) {
    if (m.overflowX !== 'auto' || !m.scrolls) problems.push(`${label}: the row does not scroll sideways (${m.overflowX}, ${m.scrolls})`);
    if (m.firstRight > width || m.secondLeft >= width)
      problems.push(`${label}: the first card is not whole with the next peeking in (${m.firstRight}, ${m.secondLeft})`);
    if (isMaterialTheme() && m.gap !== '8px') problems.push(`${label}: the gap is ${m.gap}, not 8px`);
    if (isMaterialTheme() && (m.padTop !== '8px' || m.padBottom !== '8px'))
      problems.push(`${label}: the padding above and below is ${m.padTop} and ${m.padBottom}, not 8px`);
    if (isMaterialTheme() && m.padLeft !== '16px') problems.push(`${label}: the leading padding is ${m.padLeft}, not 16px`);
    // A card is the carousel's item and takes M3's item shape: extra-large, 28dp (Carousel, Specs: md.comp.carousel-item.container.shape; owner, 24 Nov 2026: "Follow md3").
    if (isMaterialTheme() && m.radius !== '28px')
      problems.push(`${label}: the card's corners are ${m.radius}, not Material 3's 28px for a carousel item`);
    if (m.surfaces.some((x) => x.card || x.border !== '0px' || x.shadow !== 'none'))
      problems.push(
        `${label}: an item has a card surface, an outline or a shadow (${JSON.stringify(m.surfaces[0])}), which Material 3's carousel item does not`,
      );
    if (m.surfaces.some((x) => !x.labelInside)) problems.push(`${label}: an item's label is not inside the item on the image`);
    if (m.surfaces.some((x) => !x.mediaFills)) problems.push(`${label}: an item's image does not fill the whole item`);
    // Uncontained (M3): every item is as wide as the others, no empty gap between them, and the next one peeks in.
    if (new Set(m.widths).size !== 1) problems.push(`${label}: the cards are not all as wide (${m.widths})`);
    if (m.cardWidths.some((w, i) => w !== m.widths[i]))
      problems.push(`${label}: a card is narrower than its item with a short text (${m.cardWidths} in ${m.widths}), leaving an empty gap`);
    if (m.widths[0] < width * 0.6) problems.push(`${label}: the first card is only ${m.widths[0]}px of ${width}px`);
    if (isMaterialTheme() && m.gaps.some((g) => g !== 8)) problems.push(`${label}: the gaps between the cards are ${m.gaps}, not 8px`);
    if (isMaterialTheme() && m.firstLeft !== 16) problems.push(`${label}: the first card is ${m.firstLeft}px from the edge, not 16px`);
    if (isMaterialTheme() && m.indicators)
      problems.push(`${label}: the carousel has a page indicator, which Material 3's carousel does not have`);
    if (!m.region) problems.push(`${label}: the carousel has no label`);
    if (m.itemLabels.join() !== m.itemLabels.map((_, i) => say.slideOf(i + 1, m.items)).join())
      problems.push(
        `${label}: the cards are labelled "${m.itemLabels}", not "${say.slideOf('n', m.items)}" (the page's language is "${lang}", read from ${where})`,
      );
    if (m.pageOverflow) problems.push(`${label}: the page scrolls sideways`);
    // The arrow keys move between the cards.
    await root.locator('[data-carousel-item]').first().focus();
    await page.keyboard.press('ArrowRight');
    const at = await root.evaluate((el) =>
      [...el.querySelectorAll('[data-carousel-item]')].indexOf(document.activeElement?.closest('[data-carousel-item]')),
    );
    if (at !== 1) problems.push(`${label}: ArrowRight moved the focus to card ${at}, not card 1`);
    await page.screenshot({ path: join(shots, `cards-carousel-${width}.png`) });
  } else {
    // 0.19.8: the carousel is on every screen size, so a computer shows the row too, not the grid (owner: carousels on every screen size).
    if (m.display !== 'flex') problems.push(`${label}: on a computer the carousel is not a row (${m.display})`);
    if (m.overflowX !== 'auto') problems.push(`${label}: on a computer the row does not scroll sideways (${m.overflowX})`);
    if (m.pageOverflow) problems.push(`${label}: the page scrolls sideways`);
  }
  // "Show all" is under the carousel at every width (M3, Carousel, Accessibility) and stacks the cards in place.
  const button = root.locator('[data-cards-show-all]');
  const shown = (await button.textContent())?.trim();
  if (shown !== say.showAll)
    problems.push(`${label}: the button says "${shown}", not "${say.showAll}" (the page's language is "${lang}", read from ${where})`);
  await button.click();
  await page.waitForTimeout(300);
  const open = await root.evaluate((el) => ({
    expanded: el.hasAttribute('data-expanded'),
    grid: getComputedStyle(el.querySelector('[data-carousel-items]')).display,
    text: el.querySelector('[data-cards-show-all]').textContent.trim(),
    pressed: el.querySelector('[data-cards-show-all]').getAttribute('aria-expanded'),
    focus: document.activeElement === el.querySelector('[data-cards-show-all]'),
  }));
  if (!open.expanded || open.grid !== 'grid' || open.text !== say.showFewer || open.pressed !== 'true' || !open.focus)
    problems.push(
      `${label}: "Show all" did not stack the cards in place with focus kept, or the button did not say "${say.showFewer}" (${JSON.stringify(open)}; the page's language is "${lang}", read from ${where})`,
    );
  await button.click();
  await page.waitForTimeout(300);
  if (await root.evaluate((el) => el.hasAttribute('data-expanded'))) problems.push(`${label}: "Show fewer" did not return the carousel`);
  // Every layout the block offers is on the page (the rows of the demo's Cards page), each measured as Material 3 prints it.
  const layouts = await page.evaluate(() =>
    [...document.querySelectorAll('[data-cards-carousel]')].map((el) => {
      const c = el.querySelector('[data-carousel]');
      const row = el.querySelector('[data-carousel-items]');
      const first = el.querySelector('[data-carousel-item]');
      const mask = el.querySelector('[data-carousel-mask]');
      const rb = row.getBoundingClientRect();
      const fb = first.getBoundingClientRect();
      return {
        layout:
          (c.getAttribute('data-carousel-layout') ?? 'uncontained') +
          (c.getAttribute('data-carousel-alignment') === 'center' ? '-center' : ''),
        scrolls: row.scrollWidth > row.clientWidth + 1,
        radius: getComputedStyle(mask ?? first.firstElementChild).borderTopLeftRadius,
        itemWidth: Math.round(fb.width),
        widths: [...el.querySelectorAll('[data-carousel-item]')].map((i) => Math.round(i.getBoundingClientRect().width)),
        itemLeft: Math.round(fb.left),
        rowLeft: Math.round(rb.left),
        rowWidth: Math.round(rb.width),
        showAll: (() => {
          const box = el.querySelector('.mo-block-cards__show-all');
          return !!box && getComputedStyle(box).display !== 'none';
        })(),
        header: !!el.querySelector('.mo-block-cards__header'),
        indicators: el.querySelectorAll('[data-carousel-indicator], [data-carousel-dot]').length,
        count: el.querySelectorAll('[data-carousel-item]').length,
      };
    }),
  );
  for (const want of ['uncontained', 'multi-aspect-ratio', 'multi-browse', 'hero', 'hero-center', 'full-screen'])
    if (!layouts.some((l) => l.layout === want)) problems.push(`${label}: no ${want} Cards carousel on the Blocks page`);
  for (const l of layouts) {
    const at = `${label} (${l.layout})`;
    if (l.count >= 8 && !l.scrolls) problems.push(`${at}: the row does not scroll sideways`);
    if (isMaterialTheme() && l.indicators) problems.push(`${at}: it has a page indicator, which Material 3's carousel does not`);
    // Full-screen items go edge to edge without corners on a phone (the theme's M3 rule); every other item has the 28dp item shape.
    if (isMaterialTheme() && !(stillFullScreen && l.layout === 'full-screen') && l.radius !== '28px')
      problems.push(`${at}: the item's corners are ${l.radius}, not 28px`);
    // M3, Carousel, Accessibility: a Show all button below the carousel, at every width. A full-screen one shows it from 840 px, where it is the hero.
    // With a header the arrow beside it does the same and the button under the row is not drawn (the header's own unit below).
    const wantShow = !l.header && !(stillFullScreen && l.layout === 'full-screen');
    if (l.showAll !== wantShow) problems.push(`${at}: ${l.showAll ? 'it has' : 'it has no'} "Show all" (wanted: ${wantShow})`);
    if (phone) {
      // Multi-aspect ratio: leading padding 16dp, the cards of different widths (each as wide as its image's aspect ratio makes it).
      if (l.layout === 'multi-aspect-ratio') {
        if (l.itemLeft !== 16 || l.rowLeft !== 0) problems.push(`${at}: the first item is ${l.itemLeft}px from the edge, not 16px`);
        if (new Set(l.widths).size < 3)
          problems.push(`${at}: the items have the same width (${l.widths.join(', ')}px), not their images' aspect ratios`);
      }
      if (['multi-browse', 'hero', 'hero-center'].includes(l.layout) && (l.itemLeft !== 16 || l.rowLeft !== 0))
        problems.push(
          `${at}: the first item is ${l.itemLeft}px from the edge (the row starts at ${l.rowLeft}px), not 16px from the screen's edge`,
        );
      if (l.layout === 'full-screen' && Math.abs(l.itemWidth - l.rowWidth) > 1)
        problems.push(`${at}: a full-screen item is ${l.itemWidth}px of the row's ${l.rowWidth}px`);
    }
    if (l.layout === 'hero' && l.itemWidth <= l.rowWidth / 3)
      problems.push(`${at}: the hero's large item is only ${l.itemWidth}px of ${l.rowWidth}px`);
  }
  // Down from a card leaves the carousel to its own `Show all` (M3, Accessibility: "use the up and down arrow keys to leave the carousel"), in every carousel
  // with one, not to the next carousel's first card; Up goes to the control before the carousel.
  const carousels = page.locator('[data-cards-carousel]');
  for (let i = 0; i < (await carousels.count()); i++) {
    const one = carousels.nth(i);
    const kind = await one.evaluate((el) => el.querySelector('[data-carousel]')?.getAttribute('data-carousel-layout') ?? 'uncontained');
    if (
      !(await one.evaluate((el) => {
        const box = el.querySelector('.mo-block-cards__show-all');
        return !!box && getComputedStyle(box).display !== 'none';
      }))
    )
      continue;
    await one.scrollIntoViewIfNeeded();
    const card = one.locator('[data-carousel-item]').first();
    await card.evaluate((el) => (el.querySelector('a[href], button') ?? el).focus());
    await page.keyboard.press('ArrowDown');
    const onShowAll = await one.evaluate(
      (el) => document.activeElement === el.querySelector('.mo-block-cards__show-all [data-cards-show-all]'),
    );
    if (!onShowAll)
      problems.push(`${label} (${kind}, carousel ${i + 1}): Down from a card did not move the focus to that carousel's "Show all"`);
  }
  // Center-aligned hero (M3, Specs: "at least one large item and two small items"): scrolled to the start it is small, large, small, and to the end it is small, large with room after it, not a large
  // card flush against an edge (M3 is silent on the ends of the scroll: the last item rests in the middle, as the first one does).
  const centre = page.locator('[data-cards-carousel]:has([data-carousel-alignment="center"])').first();
  if (await centre.count()) {
    await centre.scrollIntoViewIfNeeded();
    for (const at of ['start', 'end']) {
      await centre
        .locator('[data-carousel-items]')
        .evaluate((row, to) => row.scrollTo({ left: to === 'start' ? 0 : row.scrollWidth, behavior: 'instant' }), at);
      await page.waitForTimeout(400);
      const { seen, rowMid } = await centre.evaluate((el) => {
        const row = el.querySelector('[data-carousel-items]').getBoundingClientRect();
        // A mask keeps the large width; the theme shrinks it with its inset on both sides.
        const seen = [...el.querySelectorAll('[data-carousel-mask]')]
          .map((m) => {
            const b = m.getBoundingClientRect();
            const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
            return { left: b.left + inset, right: b.right - inset };
          })
          // Whole items: a card peeking in at the other end does not count, nor the item outside the row, which has no width.
          .filter((b) => b.right - b.left > 1 && b.left >= row.left - 1 && b.right <= row.right + 1);
        return { seen, rowMid: (row.left + row.right) / 2 };
      });
      const widths = seen.map((b) => Math.round(b.right - b.left));
      // At the start the first item is the small one, then the large one, centred, and a small one after it; at the end the last item is the large one, centred, with the
      // small one before it and room after it for the small one that no item fills (the row's padding, not a drawn part).
      const big = at === 'start' ? 1 : seen.length - 1;
      const mid = seen[big] ? (seen[big].left + seen[big].right) / 2 : NaN;
      const shape = at === 'start' ? seen.length === 3 : seen.length === 2;
      if (!(shape && widths[big] > widths[big - 1] && (at === 'end' || widths[2] < widths[1]) && Math.abs(mid - rowMid) <= 1))
        problems.push(
          `${label} (hero-center): at the ${at} the visible items are ${widths.join(', ')}px wide (the large one's centre ${Math.round(mid)}, the carousel's ${Math.round(rowMid)}), not ${at === 'start' ? 'a small, one large one centred and a small one' : 'a small one and the last, large one centred'}`,
        );
    }
  }
  // M3, Specs: "Small item width 40-56dp, dynamic": scrolled to the start, the small items of multi-browse, hero and center-aligned hero are 40 to 56 wide.
  for (const kind of ['multi-browse', 'hero', 'hero-center']) {
    const one = page
      .locator(
        kind === 'hero-center'
          ? '[data-cards-carousel]:has([data-carousel-alignment="center"])'
          : `[data-cards-carousel]:has([data-carousel-layout="${kind}"]:not([data-carousel-alignment]))`,
      )
      .first();
    if (!(await one.count())) continue;
    await one.scrollIntoViewIfNeeded();
    await one.locator('[data-carousel-items]').evaluate((row) => row.scrollTo({ left: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const widths = await one.evaluate((el) => {
      const row = el.querySelector('[data-carousel-items]').getBoundingClientRect();
      return [...el.querySelectorAll('[data-carousel-mask]')]
        .map((m) => {
          const b = m.getBoundingClientRect();
          const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
          return { left: b.left + inset, right: b.right - inset };
        })
        .filter((b) => b.right - b.left > 1 && b.left >= row.left - 1 && b.right <= row.right + 1)
        .map((b) => Math.round(b.right - b.left));
    });
    const smalls = kind === 'hero-center' ? [widths[0], widths[2]] : [Math.min(...widths)];
    if (isMaterialTheme() && smalls.some((w) => !(w >= 39 && w <= 57)))
      problems.push(`${label} (${kind}): the small items are ${smalls}px wide (visible items ${widths}), not 40 to 56 (M3, Specs)`);
  }
  // M3, Guidelines: "Carousel items must be fully visible on-screen (except for the uncontained layout)": resting at the start and at the end, no item of
  // multi-browse, hero or center-aligned hero is cut off by the carousel's edge (or shows as a sliver in its padding).
  for (const kind of ['multi-browse', 'hero', 'hero-center']) {
    const one = page
      .locator(
        kind === 'hero-center'
          ? '[data-cards-carousel]:has([data-carousel-alignment="center"])'
          : `[data-cards-carousel]:has([data-carousel-layout="${kind}"]:not([data-carousel-alignment]))`,
      )
      .first();
    if (!(await one.count())) continue;
    await one.scrollIntoViewIfNeeded();
    for (const at of ['start', 'end']) {
      await one
        .locator('[data-carousel-items]')
        .evaluate((row, where) => row.scrollTo({ left: where === 'end' ? row.scrollWidth : 0, behavior: 'instant' }), at);
      await page.waitForTimeout(500);
      const cut = await one.evaluate((el) => {
        const row = el.querySelector('[data-carousel-items]');
        const box = row.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
        const from = Math.max(0, box.left + pad);
        const to = Math.min(innerWidth, box.right - pad);
        // What the row shows reaches its padding too: an item may stand in the window, or be wholly outside what the row shows.
        const shownFrom = Math.max(0, box.left);
        const shownTo = Math.min(innerWidth, box.right);
        return [...el.querySelectorAll('[data-carousel-mask]')]
          .map((m) => {
            const b = m.getBoundingClientRect();
            const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
            return { left: b.left + inset, right: b.right - inset };
          })
          .filter((b) => {
            const seen = Math.min(b.right, shownTo) - Math.max(b.left, shownFrom);
            if (seen <= 1) return false;
            return b.left < from - 1 || b.right > to + 1;
          })
          .map((b) => `${Math.round(b.left)}-${Math.round(b.right)} in ${Math.round(from)}-${Math.round(to)}`);
      });
      if (cut.length)
        problems.push(
          `${label} (${kind}): at the ${at} an item is cut off (${cut}); M3 prints "Carousel items must be fully visible on-screen (except for the uncontained layout)"`,
        );
    }
  }
  // M3, Guidelines, Adaptive design: "Consider adapting the text to use brief labels on smaller carousel items": scrolled to the start, a large item shows its title and text,
  // a medium one hides the title and keeps the text, a small one shows no text.
  {
    const one = page.locator('[data-cards-carousel]:has([data-carousel-layout="multi-browse"]:not([data-carousel-alignment]))').first();
    if (await one.count()) {
      await one.scrollIntoViewIfNeeded();
      await one.locator('[data-carousel-items]').evaluate((row) => row.scrollTo({ left: 0, behavior: 'instant' }));
      await page.waitForTimeout(500);
      const seen = await one.evaluate((el) =>
        [...el.querySelectorAll('[data-carousel-mask]')]
          .map((m) => {
            const b = m.getBoundingClientRect();
            const inset = parseFloat(m.style.getPropertyValue('--mo-comp-carousel-mask-inset')) || 0;
            const title = m.querySelector('.mo-block-cards__item-title');
            const text = m.querySelector('.mo-block-cards__item-text');
            const label = m.querySelector('.mo-block-cards__item-label');
            const opacity = (n) =>
              n ? parseFloat(getComputedStyle(n).opacity) * (label ? parseFloat(getComputedStyle(label).opacity) : 1) : 0;
            return {
              width: Math.round(b.width - 2 * inset),
              left: b.left + inset,
              right: b.right - inset,
              title: opacity(title),
              text: opacity(text),
            };
          })
          .filter((b) => b.left >= 0 && b.right <= innerWidth + 1),
      );
      const large = seen[0];
      const small = seen.at(-1);
      const medium = seen.find((b) => large && b.width > 60 && b.width < large.width * 0.85);
      if (large && medium && small && small !== large) {
        if (large.title < 0.9 || large.text < 0.9)
          problems.push(`${label} (multi-browse): the large item hides its title or text (${large.title}, ${large.text})`);
        if (medium.title > 0.1 || medium.text < 0.9)
          problems.push(
            `${label} (multi-browse): the ${medium.width}px medium item shows title ${medium.title} and text ${medium.text}; M3 hides the title and keeps the label`,
          );
        if (small.text > 0.1 || small.title > 0.1)
          problems.push(`${label} (multi-browse): the ${small.width}px small item still shows text (${small.title}, ${small.text})`);
      }
    }
  }
  // A card's media (image or video still) sits flush against the card's top and sides: no padding or margin above it.
  const flush = await page.evaluate(() =>
    [...document.querySelectorAll('.mo-block-cards__card')].flatMap((card) => {
      const media = card.querySelector(
        '.mo-block-cards__card-picture, .mo-block-cards__card-video, .mo-block-cards__card .mo-card__media-slot',
      );
      if (!media) return [];
      const c = card.getBoundingClientRect();
      const m = media.getBoundingClientRect();
      const border = parseFloat(getComputedStyle(card).borderTopWidth);
      const gaps = [m.top - c.top - border, m.left - c.left - border, c.right - border - m.right].map((n) => Math.round(n * 10) / 10);
      return gaps.some((g) => Math.abs(g) > 0.5)
        ? [
            `${card.querySelector('.mo-block-cards__card-title, .mo-block-cards__card .mo-card__headline')?.textContent}: top, left, right gaps ${gaps}`,
          ]
        : [];
    }),
  );
  for (const f of flush) problems.push(`${label}: a card's media is not flush with the card (${f})`);
  await page.close();
}

/** The spacing of a "Cards" block on the site (the demo's Blocks page), at 375 and 1280 px: one rule for stacked cards, a grid and the carousel. Material 3 prints 16dp left and right padding and "8dp max" between cards (m3.material.io/components/cards/specs, Measurements), and is silent inside a card, so the room there is on the 4dp half-step and the 8dp grid: the media or icon to the headline 16, the headline to the subhead 4, to the text 8, the text to the link 16. Fails on the old 2, 6 and 20 px. */
/** The posts of every Blog posts block on the system's test page (a list and the newest large over the list; picked, by category, all) read as one text
 * group (Material 3 Lists: the overline stands directly over the headline, and is label small): in each row the date and reading time are one line, label
 * small, and the headline starts where the overline ends; the gap is the same in every row and variant, with and without a thumbnail and with a headline of
 * two lines. Its cause was the meta in body medium inside the overline: it wrapped on a phone and left a line of space over the title. */
async function checkPostMeta(width, height, scheme) {
  const label = `${width}px ${scheme} blog posts meta`;
  // A site with no blog posts (the starter's) has no rows to measure; the demo has.
  if (!has('src/content/blog')) return void console.log(`${label}: skipped, the site has no blog posts, which the demo has.`);
  const phone = width < 600;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: phone,
    isMobile: phone,
    locale: 'en-US',
    colorScheme: scheme,
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const rows = await page.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    return [...document.querySelectorAll('.mo-block-posts__in-text .mo-list__item-container')].map((row) => {
      const o = row.querySelector('.mo-list__item-overline');
      const h = row.querySelector('.mo-list__item-headline');
      const lines = Math.round(r(h).height / parseFloat(getComputedStyle(h).lineHeight));
      return {
        title: h.textContent,
        gap: Math.round((r(h).top - r(o).bottom) * 10) / 10,
        metaHeight: Math.round(r(o).height * 10) / 10,
        metaFont: getComputedStyle(o.firstElementChild).fontSize,
        overlineFont: getComputedStyle(o).fontSize,
        lineHeight: parseFloat(getComputedStyle(o).lineHeight),
        thumb: !!row.querySelector('.mo-list__item-leading-image, .mo-list__item-leading-video, .mo-list__item-leading'),
        lines,
      };
    });
  });
  if (!rows.length) problems.push(`${label}: no post rows on the test page`);
  for (const row of rows) {
    const at = `${label}, "${row.title}"`;
    if (row.metaFont !== row.overlineFont)
      problems.push(`${at}: the meta is ${row.metaFont}, not the overline's ${row.overlineFont} (label small)`);
    if (row.metaHeight > row.lineHeight + 0.5)
      problems.push(`${at}: the date and reading time wrap to more than one line (${row.metaHeight} px)`);
    if (Math.abs(row.gap) > 0.5) problems.push(`${at}: ${row.gap} px between the meta line and the title, not 0`);
  }
  if (new Set(rows.map((x) => x.gap)).size > 1)
    problems.push(`${label}: the gap between the meta and the title is not the same in every row`);
  await page.close();
}

/** A carousel with a header (M3, Carousel, Accessibility: "If the carousel has a header, you can use an arrow icon button instead. Place the arrow icon directly next to the header or in the same row. Make sure the header is also displayed on the page of all carousel items."): the arrow is on the header's row and named after it, it shows every item in place with the header kept and the arrow turned back, the keyboard works it, and no `Show all` is drawn under the row. */
async function checkCardsHeader(width, height) {
  const label = `${width}px cards carousel header`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const root = page.locator('[data-cards-carousel].mo-has-header').first();
  if (!(await root.count())) return (problems.push(`${label}: no Cards carousel with a header on the Blocks page`), page.close());
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const { lang, where } = await pageLanguage(page);
  const say = blocksOf(lang).cards;
  const state = () =>
    root.evaluate((el) => {
      const arrow = el.querySelector('[data-cards-arrow]');
      const head = el.querySelector('.mo-block-cards__heading');
      const a = arrow?.getBoundingClientRect();
      const h = head?.getBoundingClientRect();
      const visible = (n) => !!n && getComputedStyle(n).display !== 'none' && getComputedStyle(n).visibility !== 'hidden';
      return {
        header: head?.textContent.trim() ?? null,
        name: arrow?.getAttribute('aria-label') ?? null,
        expanded: arrow?.getAttribute('aria-expanded') ?? null,
        isButton: arrow?.tagName === 'BUTTON',
        sameRow: !!a && !!h && Math.abs(a.top + a.height / 2 - (h.top + h.height / 2)) <= 4,
        headerFirst: !!a && !!h && (getComputedStyle(el).direction === 'rtl' ? h.left > a.left : h.left < a.left),
        headerLeft: h ? Math.round(h.left) : null,
        firstLeft: Math.round(el.querySelector('[data-carousel-item]').getBoundingClientRect().left),
        forward: visible(arrow?.querySelector('.mo-block-cards__arrow-forward')),
        back: visible(arrow?.querySelector('.mo-block-cards__arrow-back')),
        showAll: !!el.querySelector('.mo-block-cards__show-all'),
        stacked: el.hasAttribute('data-expanded'),
        columns: getComputedStyle(el.querySelector('[data-carousel-items]')).gridTemplateColumns.split(' ').length,
        focus: document.activeElement === arrow,
        headerShown: visible(head) && h.height > 0,
      };
    });
  const closed = await state();
  const wantName = say.showAllOf(closed.header ?? '');
  if (!closed.header || !closed.isButton) problems.push(`${label}: the header or its arrow button is missing (${JSON.stringify(closed)})`);
  if (!closed.sameRow || !closed.headerFirst)
    problems.push(`${label}: the arrow is not on the header's row after the header (${JSON.stringify(closed)})`);
  if (isMaterialTheme() && closed.headerLeft !== closed.firstLeft)
    problems.push(`${label}: the header is at ${closed.headerLeft}px, not on the first card's leading edge (${closed.firstLeft}px)`);
  if (closed.name !== wantName)
    problems.push(
      `${label}: the arrow is named "${closed.name}", not "${wantName}" (the page's language is "${lang}", read from ${where})`,
    );
  if (closed.expanded !== 'false' || !closed.forward || closed.back || closed.stacked)
    problems.push(`${label}: the closed arrow is not a forward arrow with aria-expanded=false (${JSON.stringify(closed)})`);
  if (closed.showAll) problems.push(`${label}: a "Show all" is drawn under the row of a carousel whose header has the arrow`);
  // The keyboard works it: Enter shows every item in place, with the header kept, a back arrow named "Show fewer", and the focus on the arrow; Space returns.
  await root.locator('[data-cards-arrow]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const open = await state();
  const fewer = say.showFewerOf(open.header ?? '');
  if (!open.stacked || open.columns !== 2)
    problems.push(`${label}: the arrow did not show every item in two columns in place (${JSON.stringify(open)})`);
  if (!open.headerShown || open.header !== closed.header)
    problems.push(`${label}: the all-items view does not show the header (${JSON.stringify(open)})`);
  if (open.expanded !== 'true' || !open.back || open.forward || open.name !== fewer)
    problems.push(`${label}: the all-items view has no back arrow named "${fewer}" with aria-expanded=true (${JSON.stringify(open)})`);
  if (!open.focus) problems.push(`${label}: the focus left the arrow when it was pressed`);
  if (open.showAll) problems.push(`${label}: the all-items view has a "Show all" under the cards`);
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const again = await state();
  if (again.stacked || again.expanded !== 'false' || again.name !== wantName || !again.forward)
    problems.push(`${label}: Space on the back arrow did not return the carousel (${JSON.stringify(again)})`);
  // Up from a card goes to the arrow above the row.
  await root
    .locator('[data-carousel-item]')
    .first()
    .evaluate((el) => (el.querySelector('a[href], button') ?? el).focus());
  await page.keyboard.press('ArrowUp');
  if (!(await root.evaluate((el) => document.activeElement === el.querySelector('[data-cards-arrow]'))))
    problems.push(`${label}: Up from a card did not move the focus to the header's arrow`);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    problems.push(`${label}: the page scrolls sideways`);
  await page.close();
}

async function checkCardsSpacing(width, height) {
  const label = `${width}px cards spacing`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const m = await page.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    const px = (n) => Math.round(n * 10) / 10;
    const list = document.querySelector('ul.mo-block-cards');
    const cards = [...list.querySelectorAll('.mo-block-cards__card')];
    const ls = getComputedStyle(list);
    const within = (card) => {
      const c = r(card);
      const q = (sel) => card.querySelector(sel);
      const icon = q('.mo-block-cards__card-icon');
      const title = q('.mo-block-cards__card-title, .mo-block-cards__card .mo-card__headline');
      const subhead = q('.mo-block-cards__card-subhead, .mo-block-cards__card .mo-card__subhead');
      const text = q('.mo-block-cards__card-text, .mo-block-cards__card .mo-card__supporting');
      const more = q('.mo-block-cards__card-more');
      const border = parseFloat(getComputedStyle(card).borderTopWidth);
      return {
        left: px(r(title).left - c.left - border),
        right: px(c.right - border - r(title).right),
        mediaToTitle: icon ? px(r(title).top - r(icon).bottom) : null,
        titleToSubhead: subhead ? px(r(subhead).top - r(title).bottom) : null,
        toText: px(r(text).top - r(subhead || title).bottom),
        textToMore: more ? px(r(more).top + parseFloat(getComputedStyle(more).paddingTop) - r(text).bottom) : null,
        moreBottom: more ? px(c.bottom - border - r(more).bottom) : null,
        top: px(r(title).top - c.top - border),
      };
    };
    const subheadCard = cards.find((c) => c.querySelector('.mo-block-cards__card-subhead, .mo-block-cards__card .mo-card__subhead'));
    const linkCard = cards.find((c) => c.querySelector('.mo-block-cards__card-more'));
    const iconCard = cards.find((c) => c.querySelector('.mo-block-cards__card-icon'));
    const colGap = cards.length > 1 ? px(r(cards[1]).left - r(cards[0]).right) : null;
    const rowGap = cards.length > 2 ? px(r(cards[2]).top - r(cards[0]).bottom) : null;
    const carousel = document.querySelector('[data-cards-carousel] [data-carousel-items]');
    return {
      css: ls.rowGap,
      cols: ls.gridTemplateColumns.split(' ').length,
      stacked: px(r(cards[1]).top - r(cards[0]).bottom),
      colGap,
      rowGap,
      padding: getComputedStyle(cards[0]).paddingLeft,
      carouselGap: carousel ? getComputedStyle(carousel).columnGap : null,
      iconCard: iconCard && within(iconCard),
      subheadCard: subheadCard && within(subheadCard),
      linkCard: linkCard && within(linkCard),
    };
  });
  const want = (what, got, expected) => {
    if (got !== expected) problems.push(`${label}: ${what} is ${got}, not ${expected}`);
  };
  // The room between cards is 8 on every width (M3 Cards, Specs: "Padding between cards 8dp max").
  const gutter = 8;
  if (m.cols === 1) want('the gap between stacked cards', m.stacked, gutter);
  else {
    want('the gap between cards in a row', m.colGap, gutter);
    want('the gap between cards in a column', m.rowGap, gutter);
  }
  want('the gap in the CSS', m.css, `${gutter}px`);
  want('the card padding', m.padding, '16px');
  // The phone carousel scrolls its cards 8px apart (Material 3's carousel); from medium it is the grid, with the same 8px.
  if (m.carouselGap) want('the carousel gap', m.carouselGap, '8px');
  want("the room from a card's edge to its text on the left", m.iconCard.left, 16);
  want("the room from a card's edge to its text on the right", m.iconCard.right, 16);
  want('the icon to the headline', m.iconCard.mediaToTitle, 16);
  want('the headline to the text', m.iconCard.toText, 8);
  want('the headline to the subhead', m.subheadCard.titleToSubhead, 4);
  want('the subhead to the text', m.subheadCard.toText, 8);
  want('the text to the link', m.linkCard.textToMore, 16);
  want("the link to the card's bottom edge", m.linkCard.moreBottom, 16);
  await page.close();
}

/** The media of a card is its own rounded rectangle (owner, 16 Nov 2026: the Container example of m3.material.io/components/cards): flush with the card's top and sides, its top corners the card's and its bottom corners the card's radius too, so the card's surface shows behind them. Checked on every picture and video of the demo's Cards page (/blocks/cards/, every card kind and the carousel's cards) at 375 and 1280 px; a site without that page (the starter) has none to measure. */
async function checkCardMediaCorners(width, height) {
  const label = `${width}px card media corners`;
  const phone = width < 600;
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-cards.md')))
    return void console.log(`${label}: skipped, the site has no Cards page, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const response = await page.goto(new URL('/blocks/cards/', site).href).catch(() => null);
  if (!response || response.status() >= 400) {
    problems.push(`${label}: /blocks/cards/ did not open`);
    return page.close();
  }
  const media = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '.mo-block-cards__card-picture, .mo-block-cards__card-video, .mo-block-cards__card .mo-card__media-slot',
      ),
    ].map((m) => {
      const card = m.closest('.mo-block-cards__card');
      const c = getComputedStyle(card);
      const s = getComputedStyle(m);
      const px = (v) => Math.round(parseFloat(v) * 10) / 10;
      const border = px(c.borderTopWidth);
      return {
        kind: m.className.includes('video') ? 'video' : 'picture',
        card: card.className.match(/mo-is-(outlined|filled|elevated)/)?.[1],
        cardRadius: px(c.borderTopLeftRadius),
        border,
        tl: px(s.borderTopLeftRadius),
        tr: px(s.borderTopRightRadius),
        bl: px(s.borderBottomLeftRadius),
        br: px(s.borderBottomRightRadius),
        flush:
          Math.round(m.getBoundingClientRect().left - card.getBoundingClientRect().left) === border &&
          Math.round(card.getBoundingClientRect().right - m.getBoundingClientRect().right) === border,
        carousel: !!m.closest('.mo-block-cards__carousel'),
      };
    }),
  );
  if (media.length < 2) problems.push(`${label}: only ${media.length} pictures and videos were measured on the Cards page`);
  for (const m of media) {
    const what = `${m.kind} in a ${m.card} card${m.carousel ? ' in the carousel' : ''}`;
    if (m.bl !== m.cardRadius || m.br !== m.cardRadius)
      problems.push(`${label}: the ${what} has bottom corners ${m.bl}/${m.br}, not the card's ${m.cardRadius}`);
    if (m.tl > m.cardRadius || m.tr > m.cardRadius || m.tl < m.cardRadius - m.border - 0.5)
      problems.push(`${label}: the ${what} has top corners ${m.tl}/${m.tr}, not the card's ${m.cardRadius} (less its border)`);
    if (!m.flush) problems.push(`${label}: the ${what} is not flush with the card's sides`);
  }
  await page.close();
}

/** A video in a card keeps its box when it is played (the demo's Cards page, /blocks/cards/): the iframe that takes the still's place (Base.astro) has the still's width and height and no margin, so the card does not grow, at 375 and 1280 px. A site without that page (the starter) has none to measure. */
async function checkCardVideoPlay(width, height) {
  const label = `${width}px card video played`;
  const phone = width < 600;
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-cards.md')))
    return void console.log(`${label}: skipped, the site has no Cards page, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  // The player's own address is not needed: the iframe's box is what is measured, and the page is offline-safe without it.
  await page.route(/youtube|youtu\.be|vimeo/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '' }));
  const response = await page.goto(new URL('/blocks/cards/', site).href).catch(() => null);
  if (!response || response.status() >= 400) {
    problems.push(`${label}: /blocks/cards/ did not open`);
    return page.close();
  }
  const facade = page.locator('.mo-block-cards__card .mo-card__media-slot a.mo-block-video__facade').first();
  if (!(await facade.count())) {
    problems.push(`${label}: the Cards page has no video card`);
    return page.close();
  }
  await facade.scrollIntoViewIfNeeded();
  const box = () =>
    page.evaluate(() => {
      const card = document
        .querySelector('.mo-block-cards__card .mo-card__media-slot:has(.mo-block-video__facade, iframe)')
        .closest('.mo-block-cards__card');
      const media = document.querySelector(
        '.mo-block-cards__card .mo-card__media-slot:has(.mo-block-video__facade, iframe)',
      ).firstElementChild;
      const r = (e) => e.getBoundingClientRect();
      const cs = getComputedStyle(media);
      return {
        card: Math.round(r(card).height * 10) / 10,
        w: Math.round(r(media).width * 10) / 10,
        h: Math.round(r(media).height * 10) / 10,
        tag: media.tagName,
        margin: cs.marginTop + ' ' + cs.marginBottom,
        radius: cs.borderTopLeftRadius + ' ' + cs.borderBottomLeftRadius,
      };
    });
  const before = await box();
  await facade.click();
  await page.waitForSelector('.mo-block-cards__card .mo-card__media-slot iframe', { timeout: 8000 });
  const after = await box();
  if (after.tag !== 'IFRAME') problems.push(`${label}: the video did not replace the still (${after.tag})`);
  if (after.card !== before.card) problems.push(`${label}: the card is ${after.card}px tall after the video starts, was ${before.card}px`);
  if (after.w !== before.w || after.h !== before.h)
    problems.push(`${label}: the video is ${after.w}x${after.h}, the still was ${before.w}x${before.h}`);
  if (after.margin !== '0px 0px') problems.push(`${label}: the video has a margin (${after.margin})`);
  if (after.radius !== before.radius) problems.push(`${label}: the video's corners are ${after.radius}, the still's were ${before.radius}`);
  await page.close();
}

/** The room between cards is 8 px (M3 Cards, Specs: "Padding between cards 8dp max"; the page grid's own gutter stays 16 px on compact, 24 px from medium) on the demo's Cards, Price cards and Image grid pages (/blocks/<name>/), at 375, 768 and 1280 px, and the page does not scroll sideways. A site without those pages (the starter) has none to measure. */
async function checkCardGutter(width, height) {
  const label = `${width}px gap between cards`;
  const phone = width < 600;
  const gutter = phone ? 16 : 24;
  const cardGap = 8;
  const pages = [
    ['Cards', 'cards', 'ul.mo-block-cards', true],
    ['Price cards', 'price-cards', '.mo-block-pricecards__plans-list', true],
    ['Image grid', 'image-grid', '.mo-staggered-grid', false],
  ];
  for (const [name, slug, selector, hasRows] of pages) {
    if (!existsSync(join(ROOT, `src/content/pages/blocks-${slug}.md`))) {
      console.log(`${label}: skipped the ${name} page, the site has none, which the demo has.`);
      continue;
    }
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    const response = await page.goto(new URL(`/blocks/${slug}/`, site).href).catch(() => null);
    if (!response || response.status() >= 400) {
      problems.push(`${label}: /blocks/${slug}/ did not open`);
      await page.close();
      continue;
    }
    await page.waitForSelector(selector, { timeout: 8000 }).catch(() => {});
    const m = await page.evaluate((sel) => {
      const root = getComputedStyle(document.documentElement);
      // The gutter is a registered length (tokens/base/registry.css), so it reads in px; a theme that does not register it may write rem.
      const gutter = root.getPropertyValue('--mo-sys-grid-gutter').trim();
      const token = parseFloat(gutter) * (gutter.endsWith('rem') ? parseFloat(root.fontSize) : 1);
      const el = document.querySelector(sel);
      const cs = el && getComputedStyle(el);
      return {
        token,
        column: el ? parseFloat(cs.columnGap) : null,
        row: el ? parseFloat(cs.rowGap) : null,
        wide: document.documentElement.scrollWidth - innerWidth,
      };
    }, selector);
    if (m.token !== gutter) problems.push(`${label}: the gutter is ${m.token}, not ${gutter}`);
    if (m.row === null) problems.push(`${label}: the ${name} page has no ${name} block`);
    else {
      if (hasRows && m.row !== cardGap) problems.push(`${label}: the ${name} row gap is ${m.row}, not ${cardGap}`);
      if (!Number.isNaN(m.column) && m.column !== cardGap && m.column !== 0)
        problems.push(`${label}: the ${name} column gap is ${m.column}, not ${cardGap}`);
    }
    if (m.wide > 1) problems.push(`${label}: the ${name} page scrolls sideways by ${m.wide}px`);
    await page.close();
  }
}

/** The Cards block typed in the page editor (the demo's Cards page) has the site's card, at 375, 768 and 1280 px (on the demo's Cards page): a card without a subhead draws no empty subhead row (so no room is kept for it) and has the same padding (16 on every side), icon to headline (16), headline to text (8) and gap between cards (8) as checkCardsSpacing asserts on the site; a tap in the card shows its subhead row with its hint, 4 px under the headline and 8 over the text, so the owner can add one. Reads the geometry once the card is active, never after a fixed wait. */
async function checkCardsEditorSpacing(width, height) {
  const label = `${width}px cards spacing in the editor`;
  const phone = width < 600;
  // The cards are the demo's Cards page (/blocks/cards/); a site without it (the starter) has none to measure.
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-cards.md')))
    return void console.log(`${label}: skipped, the site has no Cards page, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#src/content/pages/blocks-cards.md'));
  await page.waitForSelector('ul.mo-block-cards .mo-block-cards__card-title, ul.mo-block-cards .mo-block-cards__card .mo-card__headline', {
    timeout: 30_000,
  });
  const measure = (index) =>
    page.evaluate((i) => {
      const r = (e) => e.getBoundingClientRect();
      const px = (n) => Math.round(n * 10) / 10;
      const list = document.querySelector('ul.mo-block-cards');
      const cards = [...list.querySelectorAll('.mo-block-cards__card')];
      const card = cards[i];
      const c = r(card);
      const border = parseFloat(getComputedStyle(card).borderTopWidth);
      const media = card.querySelector('.mo-block-cards__card-icon');
      const title = card.querySelector('.mo-block-cards__card-title, .mo-block-cards__card .mo-card__headline');
      const sub = card.querySelector('.mo-block-cards__card-subhead, .mo-block-cards__card .mo-card__subhead');
      const text = card.querySelector('.mo-block-cards__card-text, .mo-block-cards__card .mo-card__supporting');
      const cols = getComputedStyle(list).gridTemplateColumns.split(' ').length;
      return {
        sub: !!sub,
        top: px(r(media).top - c.top - border),
        left: px(r(title).left - c.left - border),
        right: px(c.right - border - r(title).right),
        bottom: px(
          c.bottom -
            border -
            r(
              card.querySelector('.mo-block-cards__card-more, .mo-block-cards__card-actions, .mo-block-cards__card .mo-card__actions') ??
                text,
            ).bottom,
        ),
        cols,
        // Cards side by side are as high as the tallest of their row.
        rowHeights: cards.slice(0, cols).map((x) => px(r(x).height)),
        mediaToTitle: px(r(title).top - r(media).bottom),
        titleToSub: sub ? px(r(sub).top - r(title).bottom) : null,
        toText: px(r(text).top - r(sub ?? title).bottom),
        rowGap: cards.length > cols ? px(r(cards[cols]).top - r(cards[0]).bottom) : null,
        colGap: cols > 1 ? px(r(cards[1]).left - r(cards[0]).right) : null,
      };
    }, index);
  const want = (what, got, expected) => {
    if (got !== expected) problems.push(`${label}: ${what} is ${got}, not ${expected}`);
  };
  // The first card has no subhead (the demo's "With an icon"): at rest it has no subhead row.
  const rest = await measure(0);
  want('the subhead row of a card with none, at rest (present)', rest.sub, false);
  want('the room above the icon', rest.top, 16);
  want('the room at the left', rest.left, 16);
  want('the room at the right', rest.right, 16);
  if (rest.cols === 1) want('the room under the text', rest.bottom, 16);
  else if (new Set(rest.rowHeights).size !== 1)
    problems.push(`${label}: the cards of a row are not equally high (${rest.rowHeights.join(', ')})`);
  want('the icon to the headline', rest.mediaToTitle, 16);
  want('the headline to the text', rest.toText, 8);
  if (rest.rowGap !== null) want('the gap between cards in a column', rest.rowGap, 8);
  if (rest.colGap !== null) want('the gap between cards in a row', rest.colGap, 8);
  // A tap in the card makes it active: its subhead row appears, with its hint, in the site's rhythm.
  // Focus in the headline is what makes a card active (InlineItems.tsx onFocus), on any width.
  await page.locator('ul.mo-block-cards .mo-block-cards__card').first().locator('[data-field="title"]').focus();
  await page
    .waitForSelector(
      'ul.mo-block-cards .mo-block-cards__card:first-child .mo-block-cards__card-subhead, ul.mo-block-cards .mo-block-cards__card:first-child .mo-card__subhead',
      {
        timeout: 10_000,
      },
    )
    .catch(() => {});
  const active = await measure(0);
  want('the subhead row of the active card (present)', active.sub, true);
  if (active.sub) {
    want('the headline to the subhead of the active card', active.titleToSub, 4);
    want('the subhead to the text of the active card', active.toText, 8);
  }
  await page.close();
}

/** The Cards block's kinds have their M3 elevation (m3.material.io/components/cards/guidelines: "Elevated cards have a drop shadow"), on the site (the system's test page) and typed in the page editor, at 375, 768 and 1280 px: an elevated card has a box-shadow at rest, a filled and an outlined card have none. */
async function checkCardsElevation(width, height) {
  const label = `${width}px cards elevation`;
  const phone = width < 600;
  const read = () =>
    Object.fromEntries(
      [
        ['elevated', 'ul.mo-block-cards .mo-block-cards__card.mo-card.mo-is-elevated'],
        ['filled', 'ul.mo-block-cards .mo-block-cards__card.mo-card.mo-is-filled'],
        ['outlined', 'ul.mo-block-cards .mo-block-cards__card.mo-card.mo-is-outlined'],
        // The Image grid's elevated cards (the demo's "Image grid: elevated cards with caption, tags and credit"): elevated at rest too.
        ['gridElevated', '.mo-block-imagegrid__grid .mo-card.mo-is-elevated'],
      ].map(([kind, selector]) => {
        const card = document.querySelector(selector);
        return [kind, card ? getComputedStyle(card).boxShadow : null];
      }),
    );
  const none = /^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)$/;
  const judge = (where, shadows) => {
    if (!shadows.elevated) problems.push(`${label} (${where}): no elevated card to measure`);
    else if (none.test(shadows.elevated)) problems.push(`${label} (${where}): an elevated card has no shadow`);
    // The editor draws the Image grid as a preview, which may not have one in view: only the site's is required.
    if (where === 'site' && (!shadows.gridElevated || none.test(shadows.gridElevated)))
      problems.push(`${label} (${where}): an elevated Image grid card has no shadow at rest`);
    for (const kind of ['filled', 'outlined'])
      if (!shadows[kind]) problems.push(`${label} (${where}): no ${kind} card to measure`);
      else if (isMaterialTheme() && !none.test(shadows[kind]))
        problems.push(`${label} (${where}): a ${kind} card has a shadow, Material 3 gives it none at rest`);
  };
  const open = (viewport) => browser.newPage({ viewport, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  const onSite = await open({ width, height });
  onSite.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (await onTestPage(onSite, label)) judge('site', await onSite.evaluate(read));
  await onSite.close();
  // The editor's cards are on the demo's Cards page; a site without it (the starter) has only the site's to measure.
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-cards.md')))
    return void console.log(`${label} (editor): skipped, the site has no Cards page, which the demo has.`);
  const inEditor = await open({ width, height });
  inEditor.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(inEditor, site);
  await inEditor.evaluate(() => (location.hash = '#src/content/pages/blocks-cards.md'));
  await inEditor.waitForSelector(
    'ul.mo-block-cards .mo-block-cards__card-title, ul.mo-block-cards .mo-block-cards__card .mo-card__headline',
    {
      timeout: 30_000,
    },
  );
  judge('editor', await inEditor.evaluate(read));
  await inEditor.close();
}

/** The card's Divider (a card with buttons may have one line above them, full width, on the site and in the editor): the demo's elevated card "With buttons" has it, the card beside it does not, and no card without buttons draws one. The line runs from the card's edge to its edge, between the text and the buttons. */
async function checkCardDivider(width, height) {
  const label = `${width}px card divider`;
  if (!existsSync(join(ROOT, 'src/content/pages/blocks-cards.md')))
    return void console.log(`${label}: skipped, the site has no Cards page, which the demo has.`);
  const phone = width < 600;
  const read = () =>
    [...document.querySelectorAll('ul.mo-block-cards .mo-block-cards__card')].map((card) => {
      const line = card.querySelector('.mo-divider');
      const actions = card.querySelector('.mo-card__actions, .mo-block-cards__card-actions');
      const box = card.getBoundingClientRect();
      const l = line?.getBoundingClientRect();
      return {
        title: card.textContent.trim().slice(0, 14),
        lines: card.querySelectorAll('.mo-divider').length,
        buttons: !!actions,
        full: l ? Math.abs(l.left - box.left - 1) <= 2 && Math.abs(box.right - l.right - 1) <= 2 : null,
        above: l && actions ? l.bottom <= actions.getBoundingClientRect().top + 1 : null,
        tag: line?.tagName,
      };
    });
  const judge = (where, cards) => {
    const withLine = cards.filter((c) => c.lines);
    if (withLine.length !== 1)
      problems.push(`${label} (${where}): ${withLine.length} cards have a divider, not 1 (${JSON.stringify(cards)})`);
    for (const c of withLine) {
      if (c.tag !== 'HR') problems.push(`${label} (${where}): the divider is not the theme's <hr>`);
      if (!c.buttons) problems.push(`${label} (${where}): "${c.title}" has a divider and no buttons`);
      if (c.lines !== 1) problems.push(`${label} (${where}): "${c.title}" has ${c.lines} dividers, not 1`);
      if (!c.full) problems.push(`${label} (${where}): the divider on "${c.title}" is not from edge to edge`);
      if (!c.above) problems.push(`${label} (${where}): the divider on "${c.title}" is not above the buttons`);
    }
  };
  const onSite = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  onSite.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (await onTestPage(onSite, label)) judge('site', await onSite.evaluate(read));
  await onSite.close();
  const inEditor = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  inEditor.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(inEditor, site);
  await inEditor.evaluate(() => (location.hash = '#src/content/pages/blocks-cards.md'));
  await inEditor.waitForSelector('ul.mo-block-cards .mo-block-cards__card', { timeout: 30_000 });
  judge('editor', await inEditor.evaluate(read));
  await inEditor.close();
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
  await pressInsert(page, 'click');
  await page.locator('dialog[open] button', { hasText: 'Show text and images in a list.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.keyboard.type('First');
  await page.locator('.mo-editor-inline-list-row-active .mo-editor-inline-list-slot').first().click();
  // A row with no media and no kind chosen opens its sheet at the kinds of media (B6): choosing Icon shows the icon picker. List has Icon chosen by default, so its picker shows at once.
  const iconKind = page.getByRole('radio', { name: 'Icon', exact: true }).last();
  if (
    await iconKind.waitFor({ timeout: 2000 }).then(
      () => true,
      () => false,
    )
  )
    await iconKind.click();
  else if (
    !(await page
      .getByRole('group', { name: 'Icon', exact: true })
      .last()
      .isVisible()
      .catch(() => false))
  )
    problems.push(`${label}: the media sheet has no Icon kind`);
  const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
  await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the icon picker did not open`));
  // With no icon picked the Icon color row is there (Text chosen, the default), and no tile of the grid is selected, not even the cross of No icon.
  const colorState = () =>
    page.evaluate(() => {
      const group = document.querySelector('[role="group"][aria-label="Icon color"]');
      const grid = [...document.querySelectorAll('[role="group"][aria-label="Icon"]')].pop();
      return {
        rows: document.querySelectorAll('[role="group"][aria-label="Icon color"]').length,
        names: [...(group?.querySelectorAll('button') ?? [])].map((b) => b.getAttribute('aria-label')),
        visible: [...(group?.querySelectorAll('button') ?? [])]
          .map((b) => (b.querySelector('.mo-choice-group__label').getBoundingClientRect().width > 2 ? b.textContent.trim() : ''))
          .join(''),
        pressed: [...(group?.querySelectorAll('button') ?? [])]
          .filter((b) => b.getAttribute('aria-pressed') === 'true')
          .map((b) => b.getAttribute('aria-label')),
        tiles: [...(grid?.querySelectorAll('button[aria-pressed="true"]') ?? [])].length,
      };
    });
  const none = await colorState();
  if (none.rows !== 1) problems.push(`${label}: with no icon picked the sheet has ${none.rows} "Icon color" rows, not 1`);
  if (none.pressed.join() !== 'Text') problems.push(`${label}: with no color chosen "${none.pressed}" is selected, not Text`);
  if (none.tiles) problems.push(`${label}: with no icon picked ${none.tiles} tile(s) of the grid are selected`);
  if (none.visible) problems.push(`${label}: the colors show names ("${none.visible}"), not dots only`);
  await picker.getByRole('button').nth(1).click();
  await page.waitForTimeout(300);
  const choices = (await colorState()).names;
  if (choices.join() !== 'Text,Primary,Secondary,Tertiary')
    problems.push(`${label}: the icon's sheet has the colors "${choices}", not Text, Primary, Secondary, Tertiary`);
  const picked = await colorState();
  if (picked.pressed.join() !== 'Text')
    problems.push(`${label}: with an icon and no color chosen "${picked.pressed}" is selected, not Text`);
  if (picked.tiles !== 1) problems.push(`${label}: with an icon picked ${picked.tiles} tiles are selected, not 1`);
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
        probe.style.color = `var(--mo-sys-color-${role})`;
        return getComputedStyle(probe).color;
      };
      const chips = [...document.querySelectorAll('[role="group"][aria-label="Icon color"] button')];
      const out = chips.map((chip, i) => {
        const dot = chip.querySelector('.mo-choice-group__swatch');
        const box = dot?.getBoundingClientRect();
        const role = ['on-surface', 'primary', 'secondary', 'tertiary'][i];
        return {
          name: chip.textContent.trim(),
          pressed: chip.getAttribute('aria-pressed'),
          circle: !!dot && Math.abs(box.width - box.height) < 0.5 && getComputedStyle(dot).borderRadius !== '0px',
          color: dot ? getComputedStyle(dot).backgroundColor : null,
          want: colorOf(role),
          check: !!chip.querySelector('.mo-button__check'),
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
  if (new Set(before.map((c) => c.want)).size !== 4)
    problems.push(`${label}: the four colors are not all different, so the circles prove nothing`);
  await page.getByRole('button', { name: 'Secondary', exact: true }).click();
  await page.waitForTimeout(300);
  // Picking another chip moves the selected state only: the same chips, the same widths, the circles stay.
  const after = await swatches();
  const pressed = after.map((c) => c.pressed).join();
  if (pressed !== 'false,false,true,false')
    problems.push(`${label}: after Secondary was picked the chips are pressed ${pressed}, not false,false,true,false`);
  // The chosen icon's tile is filled with the chosen color.
  const tile = await page.evaluate(() => {
    const grid = [...document.querySelectorAll('[role="group"][aria-label="Icon"]')].pop();
    const probe = document.createElement('i');
    probe.style.color = 'var(--mo-sys-color-secondary)';
    document.body.append(probe);
    const want = getComputedStyle(probe).color;
    probe.remove();
    const on = grid?.querySelector('button[aria-pressed="true"]');
    return { fill: on ? getComputedStyle(on).backgroundColor : null, want };
  });
  if (tile.fill !== tile.want) problems.push(`${label}: the chosen icon's tile is ${tile.fill}, not the Secondary color ${tile.want}`);
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
        probe.style.color = `var(--mo-sys-color-${role})`;
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
  if (grid.contrast < 3)
    shortfall('1.4.11', 'icon', `${label}: the secondary icons on the grid have contrast ${grid.contrast.toFixed(2)}:1, under 3:1`);
  await page.getByRole('button', { name: 'Tertiary', exact: true }).click();
  await page.waitForTimeout(300);
  const tertiary = await gridColors();
  console.log(`icon grid contrast ${width}px ${scheme} tertiary: ${tertiary.contrast.toFixed(2)}`);
  if (tertiary.contrast < 3)
    shortfall('1.4.11', 'icon', `${label}: the tertiary icons on the grid have contrast ${tertiary.contrast.toFixed(2)}:1, under 3:1`);
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
    const row = document.querySelector('.mo-editor-inline-list-row[data-icon-color="secondary"]');
    const probe = document.createElement('i');
    probe.style.color = 'var(--mo-sys-color-secondary)';
    document.body.append(probe);
    const want = getComputedStyle(probe).color;
    probe.style.color = 'var(--mo-sys-color-primary)';
    const primary = getComputedStyle(probe).color;
    probe.remove();
    return { row: !!row, icon: row ? getComputedStyle(row.querySelector('.mo-editor-inline-list-slot')).color : null, want, primary };
  });
  if (!drawn.row) problems.push(`${label}: the row has no data-icon-color="secondary" after Secondary was picked`);
  else if (drawn.icon !== drawn.want) problems.push(`${label}: the icon is ${drawn.icon}, not the secondary color ${drawn.want}`);
  else if (drawn.want === drawn.primary) problems.push(`${label}: secondary and primary are the same color, so the check proves nothing`);
  await page.close();
}

export function register(unit) {
  for (const width of [375, 1280]) unit(`checkCardImage ${width}`, () => checkCardImage(width));
  for (const width of [375, 1280]) unit(`checkMediaSheet ${width}`, () => checkMediaSheet(width, width < 600 ? 740 : 900));
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    unit(`checkImageGrid ${width}`, () => checkImageGrid(width, height));
  // 768 px: the grid wraps to two columns, the gaps are 8 px (the site and the page editor).
  unit('checkCardsSpacing 768', () => checkCardsSpacing(768, 1024));
  unit('checkCardGutter 768', () => checkCardGutter(768, 1024));
  unit('checkCardsEditorSpacing 768', () => checkCardsEditorSpacing(768, 1024));
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    unit(`checkCardDivider ${width}`, () => checkCardDivider(width, height));
  unit('checkCardsElevation 768', () => checkCardsElevation(768, 1024));
  unit('checkCarouselScrollCost 375', () => checkCarouselScrollCost());
  unit('checkCarouselGap 390', () => checkCarouselGap(390, 800));
  unit('checkCarouselGap 1280', () => checkCarouselGap(1280, 900));
  unit('checkCardsCarousel 768', () => checkCardsCarousel(768, 900));
  unit('checkCardsCarousel 600', () => checkCardsCarousel(600, 900));
  unit('checkCardsCarousel 840', () => checkCardsCarousel(840, 900));
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ]) {
    unit(`checkCardsCarousel ${width}`, () => checkCardsCarousel(width, height));
    unit(`checkCardsHeader ${width}`, () => checkCardsHeader(width, height));
    unit(`checkCardsSpacing ${width}`, () => checkCardsSpacing(width, height));
    unit(`checkCardGutter ${width}`, () => checkCardGutter(width, height));
    unit(`checkCardMediaCorners ${width}`, () => checkCardMediaCorners(width, height));
    unit(`checkCardVideoPlay ${width}`, () => checkCardVideoPlay(width, height));
    unit(`checkCardsEditorSpacing ${width}`, () => checkCardsEditorSpacing(width, height));
    unit(`checkCardsElevation ${width}`, () => checkCardsElevation(width, height));
    for (const scheme of ['light', 'dark']) unit(`checkPostMeta ${width} ${scheme}`, () => checkPostMeta(width, height, scheme));
    for (const scheme of ['light', 'dark']) unit(`checkCardIconText ${width} ${scheme}`, () => checkCardIconText(width, height, scheme));
    for (const scheme of ['light', 'dark']) unit(`checkIconColor ${width} ${scheme}`, () => checkIconColor(width, height, scheme));
  }
  for (const w of [375, 1280]) unit(`checkImageGridAdd ${w}`, () => checkImageGridAdd(w, w < 600 ? 740 : 900));
  for (const w of [375, 1280]) unit(`checkCardHeadline ${w}`, () => checkCardHeadline(w, w < 600 ? 740 : 900));
  for (const [w, h, how] of [
    [375, 740, 'tap'],
    [768, 1024, 'click'],
    [768, 1024, 'tap'],
    [1280, 900, 'click'],
  ])
    unit(`checkCardClickActivates ${w} ${how}`, () => checkCardClickActivates(w, h, how));
  unit('checkPostMeta 768 light', () => checkPostMeta(768, 900, 'light'));
  unit('checkPostMeta 768 dark', () => checkPostMeta(768, 900, 'dark'));
}
