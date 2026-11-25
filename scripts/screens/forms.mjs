import sharp from 'sharp';
import { openEditor, removeVirtualFile, virtualFile } from '../built-site.mjs';
import { browser, problems, site } from './support/context.mjs';

/** A text field is marked by the browser's own validity (`:user-invalid`), as Material 3 draws its error state: nothing is wrong
 * before the person has worked in it, and after typing a wrong text and leaving it the edge, the name and the icon are in the
 * error colour, the line under it says what is wrong in place of the supporting line (it does not add one), aria-invalid is true
 * and the line is in aria-describedby; once it is put right all of that is gone, the layout has not moved, and a field the
 * person has not touched is never marked. */
async function checkUserInvalid(width, height, theme) {
  const touch = width < 600;
  const label = `${width}px ${theme} text field :user-invalid`;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    locale: 'en-US',
    colorScheme: theme,
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#developer/parts/ui'));
  const input = page.locator('[data-part="TextField"] input[data-part="invalid-field"]').first();
  await input.waitFor({ timeout: 30_000 }).catch(() => problems.push(`${label}: the required field is not in the TextField part`));
  if (!(await input.count())) return page.close();
  await input.scrollIntoViewIfNeeded();
  const read = () =>
    input.evaluate((el) => {
      const root = el.closest('.mo-text-field');
      const shown = (node) => !!node && getComputedStyle(node).display !== 'none';
      const rect = root.getBoundingClientRect();
      return {
        invalid: el.matches(':user-invalid'),
        edge: getComputedStyle(el.closest('.mo-text-field__container')).boxShadow,
        said: shown(root.querySelector('.mo-text-field__invalid-text')),
        supporting: shown(root.querySelector('.mo-text-field__supporting:not(.mo-text-field__invalid-text)')),
        icon: shown(root.querySelector('.mo-text-field__error-icon')),
        aria: el.getAttribute('aria-invalid'),
        described: (el.getAttribute('aria-describedby') ?? '').includes(root.querySelector('.mo-text-field__invalid-text')?.id ?? '\0'),
        height: Math.round(rect.height),
      };
    });
  // The edge moves through the theme's motion (a transition), so a read in the frame after a blur can still give the old value.
  // Wait, frame by frame and bounded, until the read is what the unit expects; on a timeout the last read is checked as before.
  const readUntil = async (ok) => {
    const end = Date.now() + 5000;
    let now = await read();
    while (!ok(now) && Date.now() < end) {
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done())));
      now = await read();
    }
    return now;
  };
  const before = await read();
  if (before.invalid || before.said || before.icon || !before.supporting || before.aria === 'true')
    problems.push(`${label}: marked before it was touched (${JSON.stringify(before)})`);
  await input.focus();
  await input.fill('name@');
  await input.blur();
  let wrong = await readUntil((now) => now.edge !== before.edge);
  for (let last = ''; wrong.edge !== last;) {
    last = wrong.edge;
    await page.waitForTimeout(400);
    wrong = await read();
  }
  if (!wrong.invalid || !wrong.said || wrong.supporting || !wrong.icon || wrong.aria !== 'true' || !wrong.described)
    problems.push(`${label}: not marked after a wrong text was typed and left (${JSON.stringify(wrong)})`);
  if (wrong.edge === before.edge) problems.push(`${label}: the edge did not change to the error's`);
  if (wrong.height !== before.height)
    problems.push(`${label}: the line under the field moved the layout (${before.height} to ${wrong.height})`);
  // Keyboard focus shows in the error state too (WCAG 2.4.7, 2.4.11; Material 3: the focused outline is thicker than the resting one): the edge
  // keeps the error colour and gets thicker.
  await input.focus();
  // The edge moves through a transition: read it when it has stopped.
  let focused = await readUntil((now) => now.edge !== wrong.edge);
  for (let last = ''; focused.edge !== last;) {
    last = focused.edge;
    await page.waitForTimeout(400);
    focused = await read();
  }
  const widthOf = (edge) => Number(/(\d+(?:\.\d+)?)px inset/.exec(edge)?.[1] ?? 0);
  const colourOf = (edge) => /rgb\([^)]*\)/.exec(edge)?.[0];
  if (focused.edge === wrong.edge || widthOf(focused.edge) <= widthOf(wrong.edge))
    problems.push(`${label}: focus is not visible in the error state (edge at rest ${wrong.edge}, focused ${focused.edge})`);
  if (colourOf(focused.edge) !== colourOf(wrong.edge))
    problems.push(`${label}: the focused error field's edge is not in the error colour (${wrong.edge}, then ${focused.edge})`);
  await input.fill('name@example.com');
  await input.blur();
  const right = await readUntil((now) => now.edge === before.edge);
  if (right.invalid || right.said || right.icon || !right.supporting || right.aria === 'true' || right.described)
    problems.push(`${label}: still marked after it was put right (${JSON.stringify(right)})`);
  if (right.edge !== before.edge) problems.push(`${label}: the edge did not return to the normal one after it was put right`);
  // The error line is read once, with the field (aria-describedby), not as an alert; and a number that cannot be read (validity.badInput)
  // says so in words instead of going red with none.
  if (await page.locator('[data-part="TextField"] .mo-text-field__invalid-text[role]').count())
    problems.push(`${label}: the error line has a role of its own (it is read with the field by aria-describedby)`);
  const number = page.locator('[data-part="TextField"] input[data-part="invalid-number"]').first();
  await number.scrollIntoViewIfNeeded();
  await number.focus();
  await page.keyboard.type('1e');
  await number.blur();
  const typed = await number.evaluate((el) => {
    const root = el.closest('.mo-text-field');
    const line = root.querySelector('.mo-text-field__invalid-text');
    return {
      bad: el.validity.badInput,
      invalid: el.matches(':user-invalid'),
      said: !!line && getComputedStyle(line).display !== 'none' ? line.textContent : '',
      aria: el.getAttribute('aria-invalid'),
    };
  });
  if (!typed.bad || !typed.invalid || typed.said !== 'Enter a number.' || typed.aria !== 'true')
    problems.push(`${label}: a number that cannot be read is not marked with its words (${JSON.stringify(typed)})`);
  await page.close();
}

/** A page's accordion rows (FoldSection): between its divider lines the title has the same space above and below it (within 1px, measured on the pixels of the first capital, not the line box), the arrow is centred on the title, and the row stays 48px tall or more (360, 375, 390, 414 px and a computer). */
async function checkFoldRows(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US', deviceScaleFactor: 2 });
  page.on('pageerror', (e) => problems.push(`${width}px accordion rows: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  const buttons = page.locator('section[aria-labelledby] > h2 > button[aria-expanded]');
  await buttons.first().waitFor();
  await page.waitForTimeout(300);
  const shown = [];
  for (let i = 0; i < (await buttons.count()); i++) {
    const button = buttons.nth(i);
    await button.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(100);
    const box = await button.boundingBox();
    const title = button.locator('span');
    const t = await title.boundingBox();
    const title_ = await title.textContent();
    const arrow = await button.locator('svg').boundingBox();
    // The ink of the title's first capital (the eye's measure, whatever the font): the rows of pixels that differ from the row's background.
    const scale = 2;
    const clip = { x: t.x, y: box.y, width: 8, height: box.height };
    const png = await page.screenshot({ clip });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const bg = [data[0], data[1], data[2]];
    const inked = [];
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        const o = (y * info.width + x) * info.channels;
        if (Math.abs(data[o] - bg[0]) + Math.abs(data[o + 1] - bg[1]) + Math.abs(data[o + 2] - bg[2]) > 120) {
          inked.push(y);
          break;
        }
      }
    if (!inked.length) {
      problems.push(`${width}px accordion row "${title_}": no letters found`);
      continue;
    }
    const above = Math.min(...inked) / scale;
    const below = (info.height - 1 - Math.max(...inked)) / scale;
    shown.push([above, below, box.height]);
    if (Math.abs(above - below) > 1)
      problems.push(`${width}px accordion row "${title_}": ${above}px above the letters and ${below}px below, should be equal`);
    const centre = (Math.min(...inked) + Math.max(...inked) + 1) / 2 / scale + box.y;
    if (Math.abs(arrow.y + arrow.height / 2 - centre) > 1)
      problems.push(`${width}px accordion row "${title_}": the arrow is not centred on the title`);
    if (box.height < 48) problems.push(`${width}px accordion row "${title_}": ${box.height}px tall, should be 48px or more`);
    // The line above the title is the divider under the section before it: nothing may sit between them (a parent's `space-y` gave 24px, twice as far above the title as below it).
    const gap = await button.evaluate((el) => {
      const before = el.closest('section').previousElementSibling;
      if (!before?.matches('section[aria-labelledby]')) return 0;
      return el.closest('section').getBoundingClientRect().top - before.getBoundingClientRect().bottom;
    });
    if (Math.abs(gap) > 1)
      problems.push(
        `${width}px accordion row "${title_}": ${gap}px between the divider above and the row, so the title is farther from the line above than from the line below`,
      );
  }
  if (!shown.length) problems.push(`${width}px accordion rows: none measured`);
  console.log(`${width}px accordion rows (above, below, height): ${JSON.stringify(shown)}`);
  await page.close();
}

/** A page's and a post's form has no "Other fields" fold: "Page settings" ("Post settings") holds the URL, the Excerpt and the Tags, and the "For review" box (width, height). */
async function checkEntrySettings(width, height) {
  for (const [hash, folds, fields] of [
    ['#new/pages', 'Page settings', ['URL', 'Excerpt', 'Tags']],
    ['#new/blog', 'Post settings', ['URL', 'Excerpt']],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${width}px ${hash} settings: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate((h) => (location.hash = h), hash);
    const buttons = page.locator('section[aria-labelledby] > h2 > button[aria-expanded]');
    await buttons.first().waitFor();
    await page.waitForTimeout(300);
    const titles = (await buttons.allTextContents()).map((t) => t.trim());
    if (titles.some((t) => t.startsWith('Other fields')))
      problems.push(`${width}px ${hash}: still has an "Other fields" fold (${titles.join(', ')})`);
    if (titles.some((t) => t.startsWith('Earlier versions')))
      problems.push(`${width}px ${hash}: "Earlier versions" is called "History" now`);
    const settings = buttons.filter({ hasText: folds });
    if (!(await settings.count())) problems.push(`${width}px ${hash}: no "${folds}" fold (${titles.join(', ')})`);
    else {
      if ((await settings.first().getAttribute('aria-expanded')) !== 'true') await settings.first().click();
      const section = page.locator('section[aria-labelledby]').filter({ has: page.locator('h2', { hasText: folds }) });
      const text = await section.first().textContent();
      for (const label of fields) if (!text.includes(label)) problems.push(`${width}px ${hash}: "${folds}" lacks "${label}"`);
    }
    await page.close();
  }
}

/** "Search engines" of a new page and a new post has the switch "No follow" (off) directly after "No index" (width, height). */
async function checkNofollowSwitch(width, height) {
  for (const hash of ['#new/pages', '#new/blog']) {
    const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${width}px ${hash} nofollow: ${e.message}`));
    await openEditor(page, site);
    await page.evaluate((h) => (location.hash = h), hash);
    const buttons = page.locator('section[aria-labelledby] > h2 > button[aria-expanded]');
    await buttons.first().waitFor();
    await page.waitForTimeout(300);
    const seo = buttons.filter({ hasText: 'Search engines' });
    if (!(await seo.count())) {
      problems.push(`${width}px ${hash} nofollow: no "Search engines" fold`);
      await page.close();
      continue;
    }
    if ((await seo.first().getAttribute('aria-expanded')) !== 'true') await seo.first().click();
    const section = page
      .locator('section[aria-labelledby]')
      .filter({ has: page.locator('h2', { hasText: 'Search engines' }) })
      .first();
    const labels = await section
      .locator('[role="switch"], input[type="checkbox"]')
      .evaluateAll((els) =>
        els.map((el) => (el.closest('label') ?? el.parentElement)?.textContent?.trim() ?? el.getAttribute('aria-label') ?? ''),
      );
    const at = (text) => labels.findIndex((l) => l.includes(text));
    const [hide, follow] = [at('No index'), at('No follow')];
    if (hide < 0) problems.push(`${width}px ${hash} nofollow: no "No index" switch (${labels.join(' | ')})`);
    else if (follow !== hide + 1)
      problems.push(`${width}px ${hash} nofollow: "No follow" is not the switch right after "No index" (${labels.join(' | ')})`);
    else {
      const on = await section
        .locator('[role="switch"], input[type="checkbox"]')
        .nth(follow)
        .evaluate((el) => el.getAttribute('aria-checked') ?? String(el.checked));
      if (on !== 'false') problems.push(`${width}px ${hash} nofollow: the switch is not off by default`);
    }
    await page.close();
  }
}

/** A page with a draft waiting has its `Published` / `Draft` switch as Material 3 primary tabs in the top app bar (375, 1280): a tablist named
 * "Version to edit" inside the bar, directly above the draft notice (no segmented control under the title), two tabs with a name each,
 * the open one aria-selected (`Draft` first), 48 dp high, the arrow keys open the other one and move focus, `Published` shows the published text and its notice,
 * and the draft notice keeps `Discard draft`. */
async function checkVersionTabs(width, height) {
  const label = `${width}px version tabs`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  virtualFile('src/content/pages/zz-tabs-waiting.md', `---\ntitle: "Tabs waiting"\n---\n\n# Tabs waiting\n\nPublished text.\n`);
  virtualFile('src/drafts/pages/zz-tabs-waiting.md', `---\ntitle: "Tabs waiting"\n---\n\n# Tabs waiting\n\nPublished text. waiting text\n`);
  try {
    await openEditor(page, site);
    await page.route('**/api/autosave**', (r) =>
      r.request().method() === 'GET' ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ contentType: 'application/json', body: '{}' }),
    );
    await page.goto(`${site}/editor/#src/content/pages/zz-tabs-waiting.md`);
    await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
    const list = page.getByRole('tablist', { name: 'Version to edit' });
    await list.waitFor({ timeout: 10_000 });
    if (await page.locator('[role="radiogroup"][aria-label="Version to edit"]').count())
      problems.push(`${label}: a segmented control is still drawn`);
    const inBar = await list.evaluate((el) => !!el.closest('header, .mo-top-app-bar'));
    if (!inBar) problems.push(`${label}: the tabs are not inside the top app bar`);
    const tabs = list.getByRole('tab');
    const names = await tabs.evaluateAll((els) => els.map((e) => `${e.textContent.trim()}:${e.getAttribute('aria-selected')}`));
    if (names.join() !== 'Published:false,Draft:true')
      problems.push(`${label}: the tabs are ${names.join()}, not Published:false,Draft:true`);
    for (const box of await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height)))
      if (box < 47.5) problems.push(`${label}: a tab is ${box} dp high, under 48`);
    const text = () => page.locator('.ProseMirror').first().innerText();
    if (!(await text()).includes('waiting text')) problems.push(`${label}: Draft does not show the draft`);
    if (!(await page.getByText('This is a draft').count())) problems.push(`${label}: no draft notice`);
    if (!(await page.getByRole('button', { name: 'Discard draft', exact: true }).count()))
      problems.push(`${label}: no "Discard draft" in the notice`);
    await tabs.filter({ hasText: 'Draft' }).focus();
    await page.keyboard.press('ArrowLeft');
    await page
      .waitForFunction(
        () =>
          document
            .querySelector('[role="tablist"][aria-label="Version to edit"] [aria-selected="true"]')
            ?.textContent.includes('Published'),
        null,
        {
          timeout: 5000,
        },
      )
      .catch(() => {});
    const open = await list.locator('[aria-selected="true"]').allTextContents();
    if (open.join() !== 'Published') problems.push(`${label}: ArrowLeft did not open Published (${open.join()})`);
    await page
      .waitForFunction(() => !document.querySelector('.ProseMirror')?.textContent.includes('waiting text'), null, { timeout: 5000 })
      .catch(() => {});
    if ((await text()).includes('waiting text')) problems.push(`${label}: Published shows the draft`);
    if (!(await page.getByText('You are editing the published version').count())) problems.push(`${label}: no published notice`);
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    if (focused !== 'Published') problems.push(`${label}: focus is on "${focused}" after the arrow key`);
  } finally {
    removeVirtualFile('src/content/pages/zz-tabs-waiting.md');
    removeVirtualFile('src/drafts/pages/zz-tabs-waiting.md');
    await page.close();
  }
}

export function register(unit) {
  for (const [width, height] of [
    [360, 740],
    [375, 800],
    [390, 844],
    [414, 896],
    [1280, 900],
  ]) {
    unit(`checkFoldRows ${width}`, () => checkFoldRows(width, height));
    unit(`checkEntrySettings ${width}`, () => checkEntrySettings(width, height));
    unit(`checkNofollowSwitch ${width}`, () => checkNofollowSwitch(width, height));
  }
  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ])
    unit(`checkVersionTabs ${width}`, () => checkVersionTabs(width, height));
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    for (const theme of ['light', 'dark']) unit(`checkUserInvalid ${width} ${theme}`, () => checkUserInvalid(width, height, theme));
}
