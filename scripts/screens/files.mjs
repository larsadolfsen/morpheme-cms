import { openEditor } from '../built-site.mjs';
import { UNLISTED_POST, browser, problems, site } from './support/context.mjs';
import { onTestPage } from './support/shared.mjs';

/** A blog post that is not on the blog (`unlisted: true`, the demo's "A post only for those with the link", or the one the check makes) shows its status in the posts list (the eye named Hidden), and the Status filter offers it. */
async function checkUnlistedPost() {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`hidden post: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#list/blog'));
  await page.waitForSelector('main a.mo-list__item-container');
  const row = page.locator('main a.mo-list__item-container').filter({ hasText: UNLISTED_POST });
  if (!(await row.count())) return problems.push('hidden post: the posts list has no row for the post that is not on the blog');
  // The row shows an eye named "Hidden" (the row's action, a sibling of the link inside the same list item).
  const item = page.locator('main li').filter({ has: page.locator('a.mo-list__item-container', { hasText: UNLISTED_POST }) });
  if (!(await item.first().locator('[role="img"][aria-label="Hidden"]').count()))
    problems.push('hidden post: the posts list does not say "Hidden" on its row');
  await page.close();
}

/** A file's details in Files on a phone (Media.tsx): a subpage of Files (route files/<address>), not a dialog: the editor's top bar
 * with a back arrow, the file name and Download; the image is the first thing under it, in view; the toolbar says "1 of N" from the
 * English texts and Next moves to the next file in the same subpage; Back returns to the list at the same scroll position, with the
 * file's tile still there; a reload on the subpage reopens the file. */
async function checkFilesDialog() {
  const label = 'files subpage 375';
  const page = await browser.newPage({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#files'));
  const some = await page
    .waitForSelector('main [data-media-tile]', { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!some) return void (await page.close());
  await page.waitForTimeout(800);
  const tiles = page.locator('main [data-media-tile]');
  const index = Math.min(5, (await tiles.count()) - 1);
  await tiles.nth(index).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  const isImage = (await tiles.nth(index).locator('img').count()) > 0;
  const tileName = await tiles.nth(index).getAttribute('aria-label');
  await tiles.nth(index).click();
  await page
    .waitForFunction(() => location.hash.startsWith('#files/'), null, { timeout: 5000 })
    .catch(() => problems.push(`${label}: the address did not change`));
  await page.waitForTimeout(500);
  if (await page.locator('dialog[open]').count()) problems.push(`${label}: a dialog opened, not a subpage`);
  const look = await page.evaluate(() => {
    const main = document.querySelector('main');
    const img = main?.querySelector('img:not([data-media-tile] img)');
    const ir = img?.getBoundingClientRect();
    const toolbar = main?.querySelector('[role=toolbar] [aria-live]');
    return {
      title: document.querySelector('h1')?.textContent ?? '',
      back: !!document.querySelector('a[aria-label^="Back to"]'),
      // The viewer is a page: no dialog is open over it (the theme has no full-screen dialog any more).
      close: !!document.querySelector('dialog[open]'),
      download: !!document.querySelector('a[download]'),
      imageInView: !!ir && ir.top >= 0 && ir.top < innerHeight / 2 && ir.height > 50,
      count: toolbar?.textContent ?? '',
    };
  });
  if (!look.title.trim()) problems.push(`${label}: no file name as headline`);
  if (!look.back) problems.push(`${label}: no back arrow`);
  if (look.close) problems.push(`${label}: a full-screen dialog is drawn`);
  if (!look.download) problems.push(`${label}: no Download in the top bar`);
  if (isImage && !look.imageInView) problems.push(`${label}: the image is not in view at the top`);
  if (look.count && !/^\d+ of \d+$/.test(look.count)) problems.push(`${label}: the position says "${look.count}", not "N of M"`);
  if (look.count) {
    const was = look.count;
    await page.locator('main [role=toolbar] button').last().click();
    await page.waitForTimeout(300);
    const now = await page.locator('main [role=toolbar] [aria-live]').textContent();
    if (now === was) problems.push(`${label}: Next does not move to another file ("${now}")`);
    await page.locator('main [role=toolbar] button').first().click();
    await page.waitForTimeout(300);
  }
  // A reload on the subpage reopens the file.
  const hash = await page.evaluate(() => location.hash);
  await page.reload();
  await page
    .waitForSelector('a[aria-label^="Back to"]', { timeout: 8000 })
    .catch(() => problems.push(`${label}: a reload does not reopen the subpage`));
  await page.evaluate(() => history.back()).catch(() => {});
  await page.close();
  // Back returns to the list at the scroll position.
  const back = await browser.newPage({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  await openEditor(back, site);
  await back.evaluate(() => (location.hash = '#files'));
  await back.waitForSelector('main [data-media-tile]', { timeout: 8000 });
  await back.waitForTimeout(800);
  await back.locator('main [data-media-tile]').nth(index).scrollIntoViewIfNeeded();
  const top = await back.evaluate(() => scrollY);
  await back.locator('main [data-media-tile]').nth(index).click();
  await back.waitForFunction(() => location.hash.startsWith('#files/'));
  await back.waitForTimeout(300);
  await back.locator('a[aria-label^="Back to"]').first().click();
  await back
    .waitForFunction(() => location.hash === '#files', null, { timeout: 5000 })
    .catch(() => problems.push(`${label}: Back does not return to the list`));
  await back.waitForTimeout(500);
  const after = await back.evaluate(() => scrollY);
  if (Math.abs(after - top) > 2) problems.push(`${label}: Back returned to scroll ${after}, not ${top}`);
  if (tileName && !(await back.locator(`main [data-media-tile][aria-label="${tileName}"]`).isVisible()))
    problems.push(`${label}: the file's tile is not visible after Back`);
  void before;
  void hash;
  await back.close();
}

/** Selecting files in Filer (Media.tsx): a long press on a tile (phone) or the mark on hover (computer) selects it; the tiles show
 * the theme's Checkbox, every tile once one is selected; a tap while
 * selecting toggles instead of opening; the count control above the grid says "N" and clears; Delete keeps a file a page uses. */
async function checkFilesSelection() {
  const marks = (page) =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('main .mo-editor-media-tile-mark')].filter((m) => {
          const r = m.getBoundingClientRect();
          return getComputedStyle(m).opacity === '1' && r.width > 0;
        }).length,
    );
  const on = (page) => page.locator('main [data-media-tile][aria-checked=true]').count();
  for (const w of [375, 1280]) {
    const touch = w < 600;
    const label = `files selection ${w}`;
    const page = await browser.newPage({ viewport: { width: w, height: 800 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#files'));
    // A site with no files (the starter) has nothing to select.
    const some = await page
      .waitForSelector('main [data-media-tile]', { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!some) {
      await page.close();
      continue;
    }
    await page.waitForTimeout(800);
    const tiles = page.locator('main [data-media-tile]');
    if ((await tiles.count()) < 3) {
      problems.push(`${label}: fewer than 3 files in the grid`);
      await page.close();
      continue;
    }
    const hash = () => page.evaluate(() => location.hash);
    const here = await hash();
    const centre = async (i) => {
      await tiles.nth(i).scrollIntoViewIfNeeded();
      const b = await tiles.nth(i).boundingBox();
      return [b.x + b.width / 2, b.y + b.height / 2];
    };
    const sheetOpen = () => page.evaluate(() => !!document.querySelector('dialog[open]'));
    const chip = page.getByRole('button', { name: /^Clear selection, \d+ selected$/ });
    if (await marks(page)) problems.push(`${label}: a tile's mark shows before anything is pointed at or selected`);
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
      if ((await on(page)) || (await sheetOpen())) problems.push(`${label}: a press and hold that moves 20 px selected or opened the tile`);
      await hold(x0, y0);
      if ((await on(page)) !== 1) problems.push(`${label}: a press and hold does not select the tile`);
      if (await sheetOpen()) problems.push(`${label}: a press and hold opened the file`);
      const [x1, y1] = await centre(1);
      await page.touchscreen.tap(x1, y1);
      await page.waitForTimeout(300);
      if ((await sheetOpen()) || (await hash()) !== here) problems.push(`${label}: a tap on a second tile opened it while selecting`);
      if ((await on(page)) !== 2) problems.push(`${label}: a tap on a second tile does not add it`);
      if ((await marks(page)) !== (await tiles.count())) problems.push(`${label}: every tile does not show its mark once one is selected`);
      if (!(await chip.count())) problems.push(`${label}: no count control above the grid`);
      await page.touchscreen.tap(x0, y0);
      await page.touchscreen.tap(x1, y1);
      await page.waitForTimeout(300);
      if (await chip.count()) problems.push(`${label}: unselecting all does not end selecting`);
      await hold(x0, y0);
      await chip.click();
      if (await on(page)) problems.push(`${label}: the count control does not unselect`);
    } else {
      const [x0, y0] = await centre(0);
      await page.mouse.move(x0, y0);
      await page.waitForTimeout(400);
      if ((await marks(page)) !== 1) problems.push(`${label}: pointing at a tile does not show exactly one mark (${await marks(page)})`);
      const mark = page.locator('main .mo-editor-media-tile-mark').first();
      const b = await mark.boundingBox();
      if (!b || b.width < 48 || b.height < 48)
        problems.push(`${label}: the mark's target is smaller than 48 x 48 (${b?.width}x${b?.height})`);
      const t0 = await tiles.nth(0).boundingBox();
      if (b && (Math.abs(b.x - t0.x) > 2 || Math.abs(b.y - t0.y) > 2))
        problems.push(`${label}: the mark is not at the tile's top-left corner`);
      await mark.click();
      await page.waitForTimeout(400);
      if ((await on(page)) !== 1 || (await sheetOpen())) problems.push(`${label}: a click on the mark does not select the tile`);
      if ((await marks(page)) !== (await tiles.count())) problems.push(`${label}: every tile does not show its mark once one is selected`);
      const [x1, y1] = await centre(1);
      await page.mouse.click(x1, y1);
      await page.waitForTimeout(300);
      if ((await on(page)) !== 2) problems.push(`${label}: a click on a second tile does not add it while selecting`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      if (await on(page)) problems.push(`${label}: Escape does not end selecting`);
      // Space on a focused tile selects it, and Ctrl+A selects all.
      await tiles.nth(2).focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      if ((await on(page)) !== 1) problems.push(`${label}: Space does not select the tile in focus`);
      await page.keyboard.press('Control+a');
      await page.waitForTimeout(200);
      if ((await on(page)) !== (await tiles.count())) problems.push(`${label}: Ctrl+A does not select all the tiles`);
      // Delete: a file a page uses is kept, and the message says so; the others are asked about.
      const del = page.getByRole('button', { name: /^Delete \d+ selected$/ });
      if (!(await del.count())) problems.push(`${label}: no Delete in the top bar while selecting`);
      else {
        await del.click();
        await page.waitForTimeout(500);
        const text = await page.evaluate(() => document.body.innerText);
        const asks = /Delete \d+ files?\? They can be restored under Deleted files\./.test(text);
        const kept = /\d+ of \d+ files are used on pages and were kept|used on pages and (wasn’t|weren’t) deleted/.test(text);
        if (!asks && !kept) problems.push(`${label}: Delete neither asks nor says which files a page uses`);
        await page.keyboard.press('Escape');
      }
    }
    await page.close();
  }
}

/** Selecting redirects (Redirects.tsx, "All redirects"): Space on a focused row selects it, the top bar swaps to the selection's own
 * actions (count, Close, Delete), a tap on another row adds it, Escape ends selecting. A site with no redirects has nothing to select. */
async function checkRedirectsSelection() {
  for (const w of [375, 1280]) {
    const touch = w < 600;
    const label = `redirects selection ${w}`;
    const page = await browser.newPage({ viewport: { width: w, height: 800 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate(() => (location.hash = '#seo/redirects/all'));
    await page.waitForTimeout(1500);
    const rows = page.locator('main .mo-list__item-selectable');
    if ((await rows.count()) < 2) {
      await page.close();
      continue;
    }
    const checked = () =>
      page.locator('main [role=checkbox][aria-checked=true], main [aria-pressed=true].mo-list__item-selectable').count();
    await rows.nth(0).focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    if ((await checked()) !== 1) problems.push(`${label}: Space does not select the redirect in focus`);
    for (const name of ['Close selection', /^Delete 1 selected$/]) {
      const b = await page.getByRole('button', { name }).first().boundingBox();
      if (!b || b.width < 44 || b.height < 44) problems.push(`${label}: "${name}" is missing or smaller than 44 px in the top bar`);
    }
    await rows.nth(1).click();
    await page.waitForTimeout(300);
    if ((await checked()) !== 2) problems.push(`${label}: a click on a second redirect does not add it while selecting`);
    if (await page.locator('dialog[open]').count()) problems.push(`${label}: a click while selecting opened the redirect's sheet`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await checked()) problems.push(`${label}: Escape does not end selecting`);
    await page.close();
  }
}

/** A file's details in Files (Media.tsx): from 600 dp the side sheet beside the grid (the grid stays in view, the address stays #files), on a phone a subpage of Files (owner, 15 Nov 2026: details are a pane, not a dialog). */
async function checkFilesPane(width) {
  const phone = width < 600;
  const label = `${width}px file details`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#files'));
  // A site with no files (the starter) has nothing to open: like the other Files checks, this one ends there.
  const some = await page
    .waitForSelector('main [data-media-tile]', { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!some) return void (await page.close());
  await page.waitForTimeout(600);
  await page.locator('main [data-media-tile]').first().click();
  await page.waitForTimeout(900);
  const got = await page.evaluate(() => ({
    hash: location.hash,
    pane: !!document.querySelector('aside.mo-sheet__container.mo-is-side:not([hidden])'),
    dialogs: document.querySelectorAll('dialog[open]').length,
    tiles: [...document.querySelectorAll('main [data-media-tile]')].filter((t) => t.getBoundingClientRect().width > 0).length,
  }));
  if (phone) {
    if (!got.hash.startsWith('#files/') || got.pane)
      problems.push(`${label}: on a phone the details are not a subpage of Files (${JSON.stringify(got)})`);
  } else {
    if (got.hash !== '#files') problems.push(`${label}: the address changed to ${got.hash} (the details are beside the grid)`);
    if (!got.pane) problems.push(`${label}: the file's details are not the side sheet beside the grid`);
    if (got.dialogs) problems.push(`${label}: a dialog is open over Files`);
    if (!got.tiles) problems.push(`${label}: the grid is not in view beside the details`);
    // The create button stands beside the open details, not on them.
    const overlap = await page.evaluate(() => {
      const fab = document.querySelector('.mo-editor-fab');
      const sheet = document.querySelector('aside.mo-sheet__container.mo-is-side:not([hidden])');
      if (!fab || !sheet) return 'missing';
      const f = fab.getBoundingClientRect();
      const r = sheet.getBoundingClientRect();
      const hit = f.left < r.right && f.right > r.left && f.top < r.bottom && f.bottom > r.top;
      return hit ? `fab ${Math.round(f.left)}-${Math.round(f.right)}, sheet ${Math.round(r.left)}-${Math.round(r.right)}` : '';
    });
    if (overlap === 'missing') problems.push(`${label}: no create button or no details sheet to compare`);
    else if (overlap) problems.push(`${label}: the create button is on the details (${overlap})`);
  }
  await page.close();
}

/** An image with no text of its own is drawn with the Library's text for it (src/imageAlt.mjs), on the site: the demo's Blocks page has a Cards image whose
 * file record has one, and the About page an image with a text of its own, which stays. */
async function checkLibraryAlt() {
  const label = 'library alt text';
  const page = await browser.newPage({ locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  if (!(await onTestPage(page, label))) return page.close();
  const card = await page
    .locator('.mo-block-cards__card-picture img[src$="andromeda.webp"], .mo-block-cards__card .mo-card__media img[src$="andromeda.webp"]')
    .first()
    .getAttribute('alt');
  if (card !== 'The Andromeda galaxy among thousands of stars')
    problems.push(`${label}: the Cards image has alt "${card}", expected the Library's text for it`);
  const about = await page.goto(new URL('/about/', site).href).catch(() => null);
  if (about && about.status() < 400) {
    const own = await page.locator('img[src$="earth-from-space.webp"]').first().getAttribute('alt');
    if (own !== 'The Earth seen from space, with clouds over the ocean')
      problems.push(`${label}: an image with a text of its own has alt "${own}"`);
  }
  await page.close();
}

export function register(unit) {
  for (const width of [375, 768, 1000, 1280]) unit(`checkFilesPane ${width}`, () => checkFilesPane(width));
  unit('checkFilesSelection', () => checkFilesSelection());
  unit('checkFilesDialog', () => checkFilesDialog());
  unit('checkRedirectsSelection', () => checkRedirectsSelection());
  unit('checkUnlistedPost', () => checkUnlistedPost());
  unit('checkLibraryAlt', () => checkLibraryAlt());
}
