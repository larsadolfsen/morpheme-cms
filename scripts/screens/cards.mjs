import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { openEditor } from '../built-site.mjs';
import { ROOT, blocksOf, browser, has, problems, shots, site } from './support/context.mjs';
import { onTestPage, pressInsert } from './support/shared.mjs';
import { pageLanguage } from './support/page-language.mjs';

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
  await page.waitForSelector('.mo-site-block-inline [data-field="heading"]', { timeout: 8000 });
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
  // Crop in the bar: the crop view of the block's ratio only, no ratio chips; Save puts the ratio and the crop after the image's address.
  await tap(page.locator('.mo-editor-inline-list-row [data-field="title"]').first());
  await page.waitForTimeout(400);
  await tap(page.locator('.mo-editor-tools-context button[aria-label="Crop"]').first());
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
  if (m.gap !== gutter) problems.push(`${label}: the gap between columns is ${m.gap}, expected ${gutter} (M3's 8dp max between cards)`);
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
    if (f.contrast < 3) problems.push(`${label}: a ${f.design} card's icon has contrast ${f.contrast.toFixed(2)}:1, under 3:1`);
  }
  await page.close();
}

/** Cards that are a carousel on phones (`phone`, on the demo's Blocks page): at 375 px the row scrolls sideways with one card whole and the next peeking in, as Material 3's uncontained carousel is measured (gap 8, 8 above and below, 16 from the edge, corners 28), labelled, with no page indicator (M3 prints none); each layout the block offers (`layout`: multi-browse, hero, center-aligned hero, full-screen) is on the page, its items with M3's 28dp corners, and `Show all` is under every one but the full-screen one; `Show all` stacks the cards in place and `Show fewer` returns them, focus kept; the arrow keys move between the cards. At 1280 px the same block is the grid, with no dots and no button. */
async function checkCardsCarousel(width, height) {
  const label = `${width}px cards carousel`;
  const phone = width < 600;
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
        const card = i.querySelector('.mo-block-cards__card');
        const saved = [...card.querySelectorAll('p')].map((p) => [p, p.textContent]);
        saved.forEach(([p]) => (p.textContent = 'Short'));
        const w = Math.round(card.getBoundingClientRect().width);
        saved.forEach(([p, t]) => (p.textContent = t));
        return w;
      }),
      gaps: items.slice(1).map((i, n) => Math.round(i.getBoundingClientRect().left - items[n].getBoundingClientRect().right)),
      firstRight: Math.round(a.right),
      secondLeft: Math.round(b.left),
      radius: getComputedStyle(items[0].querySelector('.mo-block-cards__card')).borderTopLeftRadius,
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
    if (m.gap !== '8px') problems.push(`${label}: the gap is ${m.gap}, not 8px`);
    if (m.padTop !== '8px' || m.padBottom !== '8px')
      problems.push(`${label}: the padding above and below is ${m.padTop} and ${m.padBottom}, not 8px`);
    if (m.padLeft !== '16px') problems.push(`${label}: the leading padding is ${m.padLeft}, not 16px`);
    // A card is the carousel's item and takes M3's item shape: extra-large, 28dp (Carousel, Specs: md.comp.carousel-item.container.shape; owner, 24 Nov 2026: "Follow md3").
    if (m.radius !== '28px') problems.push(`${label}: the card's corners are ${m.radius}, not Material 3's 28px for a carousel item`);
    // Uncontained (M3): every item is as wide as the others, no empty gap between them, and the next one peeks in.
    if (new Set(m.widths).size !== 1) problems.push(`${label}: the cards are not all as wide (${m.widths})`);
    if (m.cardWidths.some((w, i) => w !== m.widths[i]))
      problems.push(`${label}: a card is narrower than its item with a short text (${m.cardWidths} in ${m.widths}), leaving an empty gap`);
    if (m.widths[0] < width * 0.6) problems.push(`${label}: the first card is only ${m.widths[0]}px of ${width}px`);
    if (m.gaps.some((g) => g !== 8)) problems.push(`${label}: the gaps between the cards are ${m.gaps}, not 8px`);
    if (m.firstLeft !== 16) problems.push(`${label}: the first card is ${m.firstLeft}px from the edge, not 16px`);
    if (m.indicators) problems.push(`${label}: the carousel has a page indicator, which Material 3's carousel does not have`);
    if (!m.region) problems.push(`${label}: the carousel has no label`);
    if (m.itemLabels.join() !== m.itemLabels.map((_, i) => say.slideOf(i + 1, m.items)).join())
      problems.push(
        `${label}: the cards are labelled "${m.itemLabels}", not "${say.slideOf('n', m.items)}" (the page's language is "${lang}", read from ${where})`,
      );
    if (m.pageOverflow) problems.push(`${label}: the page scrolls sideways`);
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
    if (m.showAll !== 'none') problems.push(`${label}: on a computer "Show all" shows (${m.showAll})`);
  }
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
          const b = el.querySelector('[data-cards-show-all]');
          return !!b && getComputedStyle(b.closest('.mo-block-cards__show-all')).display !== 'none';
        })(),
        indicators: el.querySelectorAll('[data-carousel-indicator], [data-carousel-dot]').length,
      };
    }),
  );
  for (const want of ['uncontained', 'multi-aspect-ratio', 'multi-browse', 'hero', 'hero-center', 'full-screen'])
    if (!layouts.some((l) => l.layout === want)) problems.push(`${label}: no ${want} Cards carousel on the Blocks page`);
  if (phone)
    for (const l of layouts) {
      const at = `${label} (${l.layout})`;
      if (!l.scrolls) problems.push(`${at}: the row does not scroll sideways`);
      if (l.indicators) problems.push(`${at}: it has a page indicator, which Material 3's carousel does not`);
      // Full-screen items go edge to edge without corners on a phone (the theme's M3 rule); every other item has the 28dp item shape.
      if (l.layout !== 'full-screen' && l.radius !== '28px') problems.push(`${at}: the item's corners are ${l.radius}, not 28px`);
      // M3, Carousel, Accessibility: a Show all button below the carousel (not required on a full-screen one, which shows one item).
      if (l.showAll === (l.layout === 'full-screen'))
        problems.push(`${at}: ${l.showAll ? 'a full-screen carousel has' : 'it has no'} "Show all"`);
      // M3: multi-browse and hero have 16dp leading padding, the row reaching the screen's edge.
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
      if (l.layout === 'hero' && l.itemWidth <= l.rowWidth / 2)
        problems.push(`${at}: the hero's large item is only ${l.itemWidth}px of ${l.rowWidth}px`);
    }
  else for (const l of layouts) if (l.showAll) problems.push(`${label} (${l.layout}): on a computer "Show all" is drawn`);
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
      else if (!none.test(shadows[kind]))
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
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ]) {
    unit(`checkCardsCarousel ${width}`, () => checkCardsCarousel(width, height));
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
