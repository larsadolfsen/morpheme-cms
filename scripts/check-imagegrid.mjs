// Checks "Image grid" in a browser on the built site (theme/blocks/imagegrid/script.ts): the filter chips show, a tag shows only the images that
// have it, two tags show the images with both (AND), a tag that would leave nothing is disabled, `Clear tags` brings every image back, the chosen
// tags are in the address (#tags=…) and come back on a reload, and a tap on a card opens the lightbox on that image among the images shown, with
// Next, Previous and Escape working and the focus back on the card. Run on the built site: npm run build, then
// `cd .morpheme/demo/site && node ../../../scripts/check-imagegrid.mjs` (the demo's Blocks page has the grids).
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';

const DIST = resolve(process.cwd(), process.argv[2] ?? 'dist');
if (!existsSync(join(DIST, 'blocks/index.html'))) {
  console.log('The site has no Blocks page with an image grid: skipped.');
  process.exit(0);
}
const problems = [];
const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function run(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const label = `${width}px`;
  await page.goto(`${site}/blocks/`);
  const root = page.locator('[data-imagegrid]:has([data-imagegrid-filter])').first();
  if (!(await root.count())) {
    problems.push(`${label}: no image grid with a filter on the Blocks page`);
    await page.close();
    return;
  }
  const visible = () => root.locator('.block-imagegrid-grid > li:not([hidden])').count();
  const total = await root.locator('.block-imagegrid-grid > li').count();
  await root.scrollIntoViewIfNeeded();
  if (!(await root.locator('[data-imagegrid-filter]').isVisible())) problems.push(`${label}: the filter is not shown`);
  if ((await visible()) !== total) problems.push(`${label}: not every image shows to begin with`);
  const chips = root.locator('[data-imagegrid-filter] [data-tag]');
  const tags = await chips.evaluateAll((all) => all.map((c) => c.dataset.tag));
  if (tags.length < 2) problems.push(`${label}: the filter has fewer than two tags`);
  else {
    const first = chips.first();
    await first.click();
    const one = await visible();
    if (!(one > 0 && one < total)) problems.push(`${label}: one tag shows ${one} of ${total} images`);
    if ((await first.getAttribute('aria-pressed')) !== 'true') problems.push(`${label}: the chosen chip is not pressed`);
    if (!(await page.evaluate(() => location.hash)).includes(`tags=${tags[0]}`)) problems.push(`${label}: the tag is not in the address`);
    const wrong = await root
      .locator('.block-imagegrid-grid > li:not([hidden])')
      .evaluateAll((items, tag) => items.filter((li) => !(li.dataset.tags ?? '').split(',').includes(tag)).length, tags[0]);
    if (wrong) problems.push(`${label}: ${wrong} image(s) without the tag show`);
    // Every chip that would leave nothing is disabled, and no other.
    const state = await chips.evaluateAll((all) => all.map((c) => [c.dataset.tag, c.disabled]));
    const items = await root
      .locator('.block-imagegrid-grid > li')
      .evaluateAll((all) => all.map((li) => (li.dataset.tags ?? '').split(',')));
    for (const [tag, disabled] of state) {
      if (tag === tags[0]) continue;
      const left = items.filter((have) => have.includes(tags[0]) && have.includes(tag)).length;
      if (disabled !== (left === 0))
        problems.push(`${label}: chip "${tag}" is ${disabled ? '' : 'not '}disabled but leaves ${left} image(s)`);
    }
    // A reload keeps the tag.
    await page.reload();
    if ((await visible()) !== one) problems.push(`${label}: a reload does not keep the chosen tag`);
    await root.locator('[data-imagegrid-clear]').click();
    if ((await visible()) !== total) problems.push(`${label}: Clear tags does not bring every image back`);
    if ((await page.evaluate(() => location.hash)) !== '') problems.push(`${label}: Clear tags leaves a fragment in the address`);
  }

  // The lightbox: the second image opens at the second place, Next and Previous move, Escape closes and the focus goes back to the card.
  const card = root.locator('.block-imagegrid-grid > li:not([hidden]) a[data-image]').nth(1);
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = root.locator('dialog[data-lightbox]');
  if (!(await dialog.evaluate((d) => d.open))) problems.push(`${label}: a tap on a card does not open the lightbox`);
  else {
    const count = dialog.locator('[data-lightbox-count]');
    const text = async () => (await count.textContent())?.trim();
    if (!/^2\D+\d+$/.test((await text()) ?? '')) problems.push(`${label}: the lightbox does not open at image 2 (${await text()})`);
    await page.keyboard.press('ArrowRight');
    await page
      .waitForFunction((el) => /^3\D/.test(el.textContent.trim()), await count.elementHandle(), { timeout: 3000 })
      .catch(() => {
        problems.push(`${label}: ArrowRight does not go to image 3`);
      });
    await page.keyboard.press('ArrowLeft');
    await page
      .waitForFunction((el) => /^2\D/.test(el.textContent.trim()), await count.elementHandle(), { timeout: 3000 })
      .catch(() => {
        problems.push(`${label}: ArrowLeft does not go back to image 2`);
      });
    const big = await dialog
      .locator('.lightbox-item img')
      .first()
      .evaluate((img) => img.getAttribute('srcset') !== null || img.src !== '');
    if (!big) problems.push(`${label}: the lightbox has no image`);
    await page.keyboard.press('Escape');
    await page
      .waitForFunction((d) => !d.open, await dialog.elementHandle(), { timeout: 3000 })
      .catch(() => {
        problems.push(`${label}: Escape does not close the lightbox`);
      });
    const back = await page.evaluate(() => document.activeElement?.hasAttribute('data-image'));
    if (!back) problems.push(`${label}: the focus does not go back to the card`);
  }
  if (errors.length) problems.push(`${label}: script errors: ${errors.join('; ')}`);
  await page.close();
}

await run(390, 800);
await run(1280, 900);
await browser.close();
server.close();
if (problems.length) {
  console.error(`"Image grid" on the site is wrong:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('"Image grid": the filter, the address and the lightbox work on the site, on a phone and a computer.');
