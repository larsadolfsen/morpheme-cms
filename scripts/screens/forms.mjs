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

/** A page's accordion rows (FoldSection): between its divider lines the title has the same space above and below it (within 2px, measured on the pixels of the first capital, not the line box), the arrow is centred on the title, and the row stays 56px tall or more (360, 375, 390, 414 px and a computer). */
async function checkFoldRows(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US', deviceScaleFactor: 2 });
  page.on('pageerror', (e) => problems.push(`${width}px accordion rows: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  const buttons = page.locator('section[data-fold-section] button.mo-list__item-expand-button');
  await buttons.first().waitFor();
  await page.waitForTimeout(300);
  const shown = [];
  for (let i = 0; i < (await buttons.count()); i++) {
    const button = buttons.nth(i);
    await button.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(100);
    const box = await button.locator('xpath=ancestor::*[contains(@class,"mo-list__item-expand-summary")][1]').boundingBox();
    const title = button.locator('xpath=ancestor::section[1]').locator('[id$="-title"]');
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
    // The row is the List - Expand part's item (task 13 test 14): the part centres the text's line box, so the capitals sit up to 2px off the middle by the font's metrics.
    if (Math.abs(above - below) > 2)
      problems.push(`${width}px accordion row "${title_}": ${above}px above the letters and ${below}px below, should be equal`);
    const centre = (Math.min(...inked) + Math.max(...inked) + 1) / 2 / scale + box.y;
    if (Math.abs(arrow.y + arrow.height / 2 - centre) > 1)
      problems.push(`${width}px accordion row "${title_}": the arrow is not centred on the title`);
    if (box.height < 55.5)
      problems.push(`${width}px accordion row "${title_}": ${box.height}px tall, should be 56px or more (List - Expand)`);
    // The line above the title is the divider under the section before it: nothing may sit between them (a parent's `space-y` gave 24px, twice as far above the title as below it).
    const gap = await button.evaluate((el) => {
      const before = el.closest('section').previousElementSibling;
      if (!before?.matches('section[data-fold-section]')) return 0;
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
    const buttons = page.locator('section[data-fold-section] button.mo-list__item-expand-button');
    await buttons.first().waitFor();
    await page.waitForTimeout(300);
    const titles = await buttons.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
    if (titles.some((t) => t.startsWith('Other fields')))
      problems.push(`${width}px ${hash}: still has an "Other fields" fold (${titles.join(', ')})`);
    if (titles.some((t) => t.startsWith('Earlier versions')))
      problems.push(`${width}px ${hash}: "Earlier versions" is called "History" now`);
    const settings = buttons.and(page.locator(`[aria-label="${folds}"]`));
    if (!(await settings.count())) problems.push(`${width}px ${hash}: no "${folds}" fold (${titles.join(', ')})`);
    else {
      if ((await settings.first().getAttribute('aria-expanded')) !== 'true') await settings.first().click();
      const section = page.locator('section[data-fold-section]').filter({ has: page.locator('[id$="-title"]', { hasText: folds }) });
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
    const buttons = page.locator('section[data-fold-section] button.mo-list__item-expand-button');
    await buttons.first().waitFor();
    await page.waitForTimeout(300);
    const seo = buttons.and(page.locator('[aria-label="Search engines"]'));
    if (!(await seo.count())) {
      problems.push(`${width}px ${hash} nofollow: no "Search engines" fold`);
      await page.close();
      continue;
    }
    if ((await seo.first().getAttribute('aria-expanded')) !== 'true') await seo.first().click();
    const section = page
      .locator('section[data-fold-section]')
      .filter({ has: page.locator('[id$="-title"]', { hasText: 'Search engines' }) })
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

/** A page with a draft waiting has its `Published` / `Draft` switch as Material 3 secondary tabs (name only, no icon) in the top app bar (390, 1280): a tablist named
 * "Version to edit" inside the bar, directly above the draft notice (no segmented control under the title), two tabs with a name each and no icon, a divider along the row's bottom edge,
 * the open one aria-selected (`Draft` first), 48 dp high, the arrow keys open the other one and move focus, `Published` shows the published text and its notice,
 * and the draft notice has no `Discard draft` (it is in Danger). */
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
    if (await list.locator('svg, .mo-tabs__tab-icon').count()) problems.push(`${label}: a tab has an icon`);
    const line = await list.evaluate((el) => getComputedStyle(el, '::after').height);
    if (line !== '1px') problems.push(`${label}: no divider under the tab row`);
    const text = () => page.locator('.ProseMirror').first().innerText();
    if (!(await text()).includes('waiting text')) problems.push(`${label}: Draft does not show the draft`);
    if (!(await page.getByText('This is a draft').count())) problems.push(`${label}: no draft notice`);
    if (await page.locator('.mo-notice').getByRole('button', { name: 'Discard draft', exact: true }).count())
      problems.push(`${label}: the draft notice still has "Discard draft" (it is in Danger)`);
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

/** The tab rows of the other screens: a bar row (Colors) draws the divider and is as wide as its bar; the search preview's Mobile/Desktop are
 * secondary tabs, text only, in the body, not in the bar. */
async function checkOtherTabs(width, height) {
  const label = `${width}px other tabs`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  virtualFile('src/content/pages/zz-tabs-other.md', `---\ntitle: "Tabs other"\n---\n\n# Tabs other\n\nText.\n`);
  try {
    await openEditor(page, site);
    await page.goto(`${site}/editor/#style/color`);
    const modes = page.getByRole('tablist', { name: 'Mode' });
    await modes.waitFor({ timeout: 15_000 });
    const bar = await modes.evaluate((el) => {
      const b = el.closest('header, .mo-top-app-bar');
      const r = el.getBoundingClientRect();
      return {
        inBar: !!b,
        line: getComputedStyle(el, '::after').height,
        // A phone: the tabs share the whole bar; a computer: the row fits its tabs (the divider still runs the bar's width).
        same: !!b && (window.innerWidth >= 600 || Math.abs(b.getBoundingClientRect().width - r.width) < 1),
      };
    });
    const colors = await modes.evaluate((el) => ({
      secondary: el.classList.contains('mo-is-secondary'),
      icons: el.querySelectorAll('svg, .mo-tabs__tab-icon').length,
      names: [...el.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim()).join(),
    }));
    if (!colors.secondary) problems.push(`${label}: the Colors tabs are not secondary tabs`);
    if (colors.icons) problems.push(`${label}: the Colors tabs have icons`);
    if (!colors.names.startsWith('Generator')) problems.push(`${label}: the Colors tabs are ${colors.names}`);
    if (!bar.inBar) problems.push(`${label}: the Colors tabs are not in the top app bar`);
    if (bar.line !== '1px') problems.push(`${label}: no divider under the Colors tab row`);
    if (!bar.same) problems.push(`${label}: the Colors tab row is not as wide as its bar`);
    await page.goto(`${site}/editor/#src/content/pages/zz-tabs-other.md`);
    await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
    const preview = page.getByRole('tablist', { name: 'Google result on' });
    if (!(await preview.count()))
      await page
        .getByRole('button', { name: /Search engines/ })
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});
    await preview.first().waitFor({ timeout: 10_000 });
    const tab = await preview.first().evaluate((el) => ({
      secondary: el.classList.contains('mo-is-secondary'),
      inBar: !!el.closest('header, .mo-top-app-bar'),
      icons: el.querySelectorAll('svg, .mo-tabs__tab-icon').length,
      names: [...el.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim()).join(),
      line: getComputedStyle(el, '::after').height,
    }));
    if (!tab.secondary) problems.push(`${label}: the search preview's tabs are not secondary tabs`);
    if (tab.inBar) problems.push(`${label}: the search preview's tabs are in the bar, not the body`);
    if (tab.icons) problems.push(`${label}: the search preview's tabs have icons`);
    if (tab.names !== 'Mobile,Desktop') problems.push(`${label}: the search preview's tabs are ${tab.names}`);
    if (tab.line !== '1px') problems.push(`${label}: no divider under the search preview's tab row`);
  } finally {
    removeVirtualFile('src/content/pages/zz-tabs-other.md');
    await page.close();
  }
}

/** Fixed tabs adapt (spec 2026-11-25-tabs-adapt, tests 1 and 2; Business > Colors): from 600 dp every tab is as wide as the widest tab's
 * label and padding and no wider, the first tab starts at the content column's leading edge (the title row's, from expanded), the divider runs the
 * bar's whole width and the open tab's indicator is under its label only; on a phone the tabs share the row in equal sections. */
async function checkTabsAdapt(width, height) {
  const label = `${width}px tabs adapt`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  try {
    await openEditor(page, site);
    await page.goto(`${site}/editor/#style/color`);
    const list = page.getByRole('tablist', { name: 'Mode' });
    await list.waitFor({ timeout: 15_000 });
    await page.waitForTimeout(500);
    const m = await list.evaluate((el) => {
      const rect = (e) => e.getBoundingClientRect();
      const tabs = [...el.querySelectorAll('[role="tab"]')];
      const bar = rect(el.closest('.mo-editor-bar-tabs'));
      const heading = document.querySelector('.mo-editor-screen-heading');
      const line = getComputedStyle(el, '::after');
      return {
        widths: tabs.map((t) => rect(t).width),
        need: Math.max(...tabs.map((t) => rect(t.querySelector('.mo-tabs__tab-content')).width + 32)),
        first: rect(tabs[0]).left,
        row: rect(el).width,
        barLeft: bar.left,
        barWidth: bar.width,
        headingLeft: heading && rect(heading).width ? rect(heading).left : null,
        lineHeight: line.height,
        lineLeft: parseFloat(line.left),
        lineRight: parseFloat(line.right),
        page: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    if (m.page > 0) problems.push(`${label}: the page scrolls sideways by ${m.page}px`);
    if (m.widths.some((w) => Math.abs(w - m.widths[0]) > 1)) problems.push(`${label}: the tabs differ in width (${m.widths.join()})`);
    if (m.lineHeight !== '1px') problems.push(`${label}: the divider is ${m.lineHeight} high, not 1px`);
    if (phone) {
      if (Math.abs(m.row - m.barWidth) > 1) problems.push(`${label}: the tabs do not share the whole bar (${m.row} of ${m.barWidth})`);
    } else {
      if (m.widths[0] > m.need + 1) problems.push(`${label}: a tab is ${m.widths[0]} wide, over the widest tab's ${m.need}`);
      if (m.headingLeft !== null && Math.abs(m.first - m.headingLeft) > 1)
        problems.push(`${label}: the first tab starts at ${m.first}, not at the content's ${m.headingLeft}`);
      if (m.lineLeft > -m.first + m.barLeft + 1) problems.push(`${label}: the divider does not reach the bar's start`);
    }
    const w = await list.evaluate((el) => el.querySelector('[role="tab"]').getBoundingClientRect().height);
    if (w < 47.5) problems.push(`${label}: a tab is ${w} dp high, under 48`);
  } finally {
    await page.close();
  }
}

/** The bottom bar and the section Danger of a page (390, 1280): Save is outlined and Publish filled with no Discard in the bar; after a change Danger is the last section with
 * Discard and Delete page, in that order, Discard Draft only with a saved draft; a page with nothing to do has no Discard; Discard asks first (Esc keeps the change, the
 * dialog has no control focused) and drops the change. */
async function checkDanger(width, height) {
  const label = `${width}px danger`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  virtualFile('src/content/pages/zz-danger.md', `---\ntitle: "Risk page"\n---\n\n# Risk page\n\nPublished text.\n`);
  try {
    await openEditor(page, site);
    await page.goto(`${site}/editor/#src/content/pages/zz-danger.md`);
    await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
    const danger = page.locator('section[data-fold-section]').filter({ has: page.locator('[id$="-title"]', { hasText: /^Danger$/ }) });
    // Danger is folded on load, like every section but Content (owner, 14 Nov 2026): open it to see its rows.
    const rows = () => danger.locator('.mo-editor-danger-buttons').getByRole('button');
    const openDanger = async () => {
      const toggle = danger.locator('button.mo-list__item-expand-button');
      if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    };
    if ((await danger.locator('button.mo-list__item-expand-button').getAttribute('aria-expanded')) === 'true')
      problems.push(`${label}: Danger is open on load`);
    await openDanger();
    const idle = (await rows().allTextContents()).map((n) => n.trim()).join();
    if (idle !== 'Delete page') problems.push(`${label}: Danger has "${idle}" with nothing changed, not only Delete page`);
    if (await page.getByRole('button', { name: /^Discard/ }).count()) problems.push(`${label}: a Discard shows with nothing changed`);
    await page.locator('.ProseMirror p').first().click();
    await page.keyboard.type(' more');
    const bar = page.locator('.mo-editor-save-bar');
    await bar.waitFor({ timeout: 10_000 });
    const kinds = await bar
      .getByRole('button')
      .evaluateAll((els) =>
        els.map(
          (e) =>
            `${e.textContent.trim()}:${[...e.classList].find((c) => /^mo-is-(filled|tonal|outlined|text)$/.test(c))?.replace('mo-is-', '') ?? 'filled'}`,
        ),
      );
    const save = kinds.find((k) => /^Save/.test(k));
    if (!save || (!save.endsWith(':outlined') && kinds.some((k) => /^Publish/.test(k))))
      problems.push(`${label}: Save is not outlined (${kinds.join(', ')})`);
    if (kinds.some((k) => /^Discard/.test(k))) problems.push(`${label}: the bar still has Discard (${kinds.join(', ')})`);
    const publish = kinds.find((k) => /^Publish/.test(k));
    if (publish && !publish.endsWith(':filled')) problems.push(`${label}: Publish is not filled (${publish})`);
    await danger.waitFor({ timeout: 10_000 });
    await openDanger();
    const names = await rows().allTextContents();
    if (names.map((n) => n.trim()).join() !== 'Discard,Delete page')
      problems.push(`${label}: Danger has ${names.join(', ')}, not Discard, Delete page`);
    const last = await page.evaluate(() => {
      const all = [...document.querySelectorAll('section[data-fold-section]')];
      return document.getElementById(all.at(-1)?.getAttribute('aria-labelledby') ?? '')?.textContent?.trim();
    });
    if (last !== 'Danger') problems.push(`${label}: the last section is "${last}", not Danger`);
    const discard = danger.getByRole('button', { name: 'Discard', exact: true });
    await discard.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 5000 });
    const focused = await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') && document.activeElement?.tagName === 'BUTTON',
    );
    if (focused) problems.push(`${label}: the dialog opens with a button focused`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached', timeout: 5000 });
    if (!(await page.locator('.ProseMirror').first().innerText()).includes('more')) problems.push(`${label}: Cancel dropped the change`);
    await discard.click();
    await dialog.getByRole('button', { name: 'Discard', exact: true }).click();
    await page
      .waitForFunction(() => !document.querySelector('.ProseMirror')?.textContent.includes('more'), null, { timeout: 5000 })
      .catch(() => {});
    if ((await page.locator('.ProseMirror').first().innerText()).includes('more')) problems.push(`${label}: Discard kept the change`);
    if (await danger.getByRole('button', { name: 'Discard', exact: true }).count())
      problems.push(`${label}: Discard stays after it was used`);
  } finally {
    removeVirtualFile('src/content/pages/zz-danger.md');
    await page.close();
  }
}

// The rows of Danger start at the leading edge like the rows above them (nothing centres them), left to right and right to left (the PM, 26 Nov 2026).
async function checkDangerAlign(width, height, dir) {
  const label = `${width}px danger rows ${dir}`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  virtualFile('src/content/pages/zz-danger-align.md', `---\ntitle: "Align page"\n---\n\n# Align page\n\nPublished text.\n`);
  try {
    await openEditor(page, site);
    await page.goto(`${site}/editor/#src/content/pages/zz-danger-align.md`);
    await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
    await page.locator('.ProseMirror p').first().click();
    await page.keyboard.type(' more');
    await page.evaluate((d) => (document.documentElement.dir = d), dir);
    const danger = page.locator('section[data-fold-section]').filter({ has: page.locator('[id$="-title"]', { hasText: /^Danger$/ }) });
    await danger.waitFor({ timeout: 10_000 });
    const toggle = danger.locator('button.mo-list__item-expand-button');
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    // The danger buttons (tone="error"; owner, 26 Nov 2026): Delete page filled, Discard outlined, both in the error role, the first at the leading edge of the section's flow.
    const rows = await danger
      .locator('.mo-editor-danger-buttons')
      .getByRole('button')
      .evaluateAll((els) => {
        const box = els[0]?.parentElement?.getBoundingClientRect();
        return els.map((e) => {
          const r = e.getBoundingClientRect();
          const rtl = getComputedStyle(e).direction === 'rtl';
          return {
            name: e.textContent.trim(),
            gap: box ? Math.round(rtl ? box.right - r.right : r.left - box.left) : 0,
            error: e.classList.contains('mo-is-error'),
            kind: e.classList.contains('mo-is-filled') ? 'filled' : e.classList.contains('mo-is-outlined') ? 'outlined' : 'other',
          };
        });
      });
    if (rows.length < 2) problems.push(`${label}: expected Discard and Delete page, got ${rows.map((r) => r.name).join()}`);
    if (rows[0] && rows[0].gap > 1) problems.push(`${label}: "${rows[0].name}" starts ${rows[0].gap}px from the leading edge`);
    for (const r of rows) {
      if (!r.error) problems.push(`${label}: "${r.name}" is not a danger button (no error tone)`);
      const want = r.name === 'Delete page' ? 'filled' : 'outlined';
      if (r.kind !== want) problems.push(`${label}: "${r.name}" is ${r.kind}, not ${want}`);
    }
    // A delete question's confirm is the dialog's main choice: a text button with the error colour as label (every dialog action is text; owner, 27 Nov 2026); Cancel is a plain text button, not red.
    await danger.getByRole('button', { name: 'Delete page', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 5000 });
    const confirm = await dialog.getByRole('button').evaluateAll((els) =>
      els.map((e) => ({
        name: e.textContent.trim(),
        error: e.classList.contains('mo-is-error'),
        text: e.classList.contains('mo-is-text'),
      })),
    );
    const yes = confirm.find((c) => c.name === 'Delete');
    const no = confirm.find((c) => c.name === 'Cancel');
    if (!yes || !yes.error || !yes.text)
      problems.push(`${label}: the Delete confirm is not a text button in the error colour (${JSON.stringify(confirm)})`);
    if (!no || no.error) problems.push(`${label}: Cancel is red or missing (${JSON.stringify(confirm)})`);
    await page.keyboard.press('Escape');
  } finally {
    removeVirtualFile('src/content/pages/zz-danger-align.md');
    await page.close();
  }
}

// Danger is the last entry of the Sections list and jumps to the section, opening it when it is folded.
async function checkDangerNav(width, height) {
  const label = `${width}px danger in the sections list`;
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  virtualFile('src/content/pages/zz-danger-nav.md', `---\ntitle: "Nav page"\n---\n\n# Nav page\n\nPublished text.\n`);
  try {
    await openEditor(page, site);
    await page.goto(`${site}/editor/#src/content/pages/zz-danger-nav.md`);
    await page.waitForSelector('.ProseMirror p', { timeout: 30_000 });
    const nav = page.getByRole('navigation', { name: 'Sections' });
    await nav.waitFor({ timeout: 10_000 });
    const names = (await nav.getByRole('button').allTextContents()).map((n) => n.trim());
    if (names.at(-1) !== 'Danger') problems.push(`${label}: the list ends with "${names.at(-1)}" (${names.join(', ')}), not Danger`);
    const danger = page.locator('section[data-fold-section]').filter({ has: page.locator('[id$="-title"]', { hasText: /^Danger$/ }) });
    if ((await danger.locator('button.mo-list__item-expand-button').getAttribute('aria-expanded')) === 'true')
      problems.push(`${label}: Danger is open before the jump`);
    await nav.getByRole('button', { name: 'Danger', exact: true }).click();
    await page
      .waitForFunction(
        () => document.querySelector('section[data-fold-section] button[aria-label="Danger"]')?.getAttribute('aria-expanded') === 'true',
        null,
        { timeout: 5000 },
      )
      .catch(() => problems.push(`${label}: the jump did not open Danger`));
    await page.waitForTimeout(800);
    const top = await danger.evaluate((el) => Math.round(el.getBoundingClientRect().top));
    if (top < -2 || top > innerHeightOf(height)) problems.push(`${label}: Danger is at ${top}px after the jump, not in view`);
    const current = await nav.locator('[aria-current="location"]').textContent();
    if (current?.trim() !== 'Danger') problems.push(`${label}: "${current?.trim()}" is marked, not Danger`);
  } finally {
    removeVirtualFile('src/content/pages/zz-danger-nav.md');
    await page.close();
  }
}
const innerHeightOf = (h) => h;

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
    [390, 844],
    [1280, 900],
  ])
    unit(`checkDanger ${width}`, () => checkDanger(width, height));
  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ])
    for (const dir of ['ltr', 'rtl']) unit(`checkDangerAlign ${width} ${dir}`, () => checkDangerAlign(width, height, dir));
  unit('checkDangerNav 1280', () => checkDangerNav(1280, 900));
  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ])
    unit(`checkOtherTabs ${width}`, () => checkOtherTabs(width, height));
  for (const [width, height] of [
    [390, 844],
    [2000, 1000],
  ])
    unit(`checkTabsAdapt ${width}`, () => checkTabsAdapt(width, height));
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    for (const theme of ['light', 'dark']) unit(`checkUserInvalid ${width} ${theme}`, () => checkUserInvalid(width, height, theme));
}
