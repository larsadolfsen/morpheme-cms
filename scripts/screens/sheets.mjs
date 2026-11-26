import { join } from 'node:path';
import { openEditor } from '../built-site.mjs';
import { BUILT_PAGE, browser, has, problems, shots, site } from './support/context.mjs';
import { barTools, cancelOf, pressInsert, pressTool } from './support/shared.mjs';
import { isMaterialTheme } from '../theme-statement.mjs';

/** A modal sheet with a text field on a phone with its on-screen keyboard up (the Source color sheet on Colors, the shared
 * BottomSheet, followKeyboard() in theme/ui/bottomSheetControl.ts): a keyboard shrinks only the visual viewport, which is
 * emulated here by a smaller visualViewport. The sheet must end exactly at the keyboard's top (no strip of the page
 * between), and its hex field and its buttons (Cancel, Use color) must be visible and inside the visible screen. */
async function checkSheetKeyboard(width = 375, height = 740, keyboard = 300, custom = false) {
  // In Custom (the generator's last choice) the first colour is Primary.
  const name = custom ? 'Primary' : 'Source color';
  const label = `${width}px keyboard sheet${custom ? ' (Custom)' : ''}`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#style/color'));
  if (custom) await page.getByRole('button', { name: 'Custom', exact: true }).click();
  await page.getByRole('button', { name: `${name}: select a color` }).click();
  const sheet = page.locator(`dialog[open][aria-label="${name}"]`);
  await sheet.waitFor();
  const code = sheet.getByRole('textbox', { name: 'Color code' });
  await code.focus();
  // The keyboard: the visual viewport gets shorter, the layout viewport stays (what a phone does).
  await page.evaluate((h) => {
    const screen = visualViewport;
    for (const key of ['height']) Object.defineProperty(screen, key, { configurable: true, get: () => h });
    screen.dispatchEvent(new Event('resize'));
  }, height - keyboard);
  await page.waitForTimeout(400);
  const got = await page.evaluate((name) => {
    const dialog = document.querySelector(`dialog[open][aria-label="${name}"]`);
    const box = (el) => el.getBoundingClientRect();
    const buttons = [...dialog.querySelectorAll('button')].filter((b) => /^(Cancel|Use color)$/.test(b.textContent.trim()));
    const field = dialog.querySelector('input[aria-label="Color code"], input');
    return {
      visible: visualViewport.height,
      sheet: box(dialog.querySelector('.mo-sheet__container.mo-is-bottom')),
      buttons: buttons.map((b) => [b.textContent.trim(), box(b)]),
      field: box(field),
    };
  }, name);
  if (Math.abs(got.sheet.bottom - got.visible) > 1)
    problems.push(`${label}: the sheet ends at ${got.sheet.bottom}, not at the keyboard's top (${got.visible})`);
  const expected = 2;
  if (got.buttons.length !== expected) problems.push(`${label}: ${got.buttons.length} of the ${expected} buttons are in the sheet`);
  for (const [name, r] of got.buttons)
    if (r.top < 0 || r.bottom > got.visible + 1) problems.push(`${label}: "${name}" is outside the visible screen`);
  if (got.field.top < 0 || got.field.bottom > got.visible + 1)
    problems.push(`${label}: the color code field is outside the visible screen`);
  await page.close();
}

/** Custom colours on Colors (docs/superpowers/specs/2026-11-21-m3-color-schemes-design.md). The last chip, "Custom": the tiles are
 * Primary, Secondary and Tertiary with a pen each and no lock, and the sheet has Cancel and Use color; the wheel has three dots, each its
 * own slider, and dragging one changes only its colour; no question and no contrast note, since the roles take M3's tones; a scheme
 * (Tonal spot) and back keeps the custom colours. Primary is never questioned: the roles take M3's tones from each palette. */
async function checkCustomColors(width, height) {
  const label = `${width}px custom colors`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#style/color'));
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  await page.waitForTimeout(300);
  const tiles = () => page.locator('ul[aria-label="Colors"] > li').allInnerTexts();
  const hexes = async () => (await tiles()).map((t) => t.match(/#[0-9A-Fa-f]{6}/)?.[0].toLowerCase());
  const names = (await tiles()).map((t) => t.split('\n')[0].trim());
  if (names.join() !== 'Primary,Secondary,Tertiary') problems.push(`${label}: the tiles are "${names}", not Primary, Secondary, Tertiary`);
  if (await page.getByRole('button', { name: /^Lock / }).count()) problems.push(`${label}: Custom has a lock`);
  const dots = page.getByRole('slider', { name: /drag to change this color/ });
  if ((await dots.count()) !== 3) problems.push(`${label}: ${await dots.count()} dots on the wheel, not 3`);
  const dotNames = await dots.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  if (dotNames.join() !== 'Primary: drag to change this color,Secondary: drag to change this color,Tertiary: drag to change this color')
    problems.push(`${label}: the dots are named "${dotNames}"`);

  const pick = async (name, hex) => {
    await page.getByRole('button', { name: `${name}: select a color` }).click();
    const sheet = page.locator(`dialog[open][aria-label="${name}"]`);
    await sheet.waitFor();
    const buttons = await sheet.getByRole('button', { name: /^(Use and lock|Cancel|Use color)$/ }).allInnerTexts();
    if (buttons.length !== 2) problems.push(`${label}: the ${name} sheet has "${buttons}", not Cancel and Use color`);
    const code = sheet.getByRole('textbox', { name: 'Color code' });
    await code.fill(hex);
    await code.press('Tab');
    await sheet.getByRole('button', { name: 'Use color', exact: true }).click();
    await page.waitForTimeout(300);
  };
  await pick('Primary', '#F34E3D');
  await pick('Secondary', '#F5E8CC');
  await pick('Tertiary', '#55263D');
  if ((await hexes()).join() !== '#f34e3d,#f5e8cc,#55263d')
    problems.push(`${label}: the tiles show "${await hexes()}", not the colors picked`);

  // The roles take M3's tones from each palette, so a cream Secondary or a dark Tertiary reads on the page: no note, no question.
  if (await page.getByText(/has low contrast on the page/).count())
    problems.push(`${label}: a note about low contrast shows for M3's tones`);
  if (await page.getByText(/Fix this to improve accessibility/).count()) problems.push(`${label}: Custom still asks to fix Primary`);

  // Each dot moves only its own colour, and a cream keeps its tone (stays light).
  const before = await hexes();
  const dot = dots.nth(1);
  await dot.scrollIntoViewIfNeeded();
  const box = await dot.boundingBox();
  const wheel = page.getByRole('group', { name: 'Color wheel' });
  const wbox = await wheel.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(wbox.x + wbox.width * 0.8, wbox.y + wbox.height * 0.5, { steps: 5 });
  await page.mouse.up();
  const after = await hexes();
  if (after[0] !== before[0] || after[2] !== before[2])
    problems.push(`${label}: dragging Secondary changed another color (${before} to ${after})`);
  if (after[1] === before[1]) problems.push(`${label}: dragging Secondary did not change it`);
  // Arrow keys move one dot too.
  await dots.nth(2).focus();
  await page.keyboard.press('ArrowRight');
  const keyed = await hexes();
  if (keyed[2] === after[2] || keyed[0] !== after[0] || keyed[1] !== after[1])
    problems.push(`${label}: an arrow key did not move only Tertiary (${after} to ${keyed})`);

  // A scheme and back: the custom colors are kept, and a scheme has no lock.
  await page.getByRole('button', { name: 'Tonal spot', exact: true }).click();
  await page.waitForTimeout(300);
  if (await page.getByRole('button', { name: /^Lock / }).count()) problems.push(`${label}: a scheme has a lock`);
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  await page.waitForTimeout(300);
  if ((await hexes()).join() !== keyed.join()) problems.push(`${label}: back in Custom the colors are "${await hexes()}", not "${keyed}"`);
  await page.screenshot({ path: join(shots, `custom-colors-${width}.png`), fullPage: true });
  await page.close();
}

/** What is fixed to the bottom of a form (the page form's Save and Publish buttons, FormFrame.tsx) is the theme's standard
 * bottom sheet (ActionSheet in src/ui.tsx), not a bar of its own: the same surface and top corners as a BottomSheet container,
 * at the bottom of the screen, above the on-screen keyboard when it is up (emulated by a smaller visual viewport), and the
 * form's last field scrolls clear of it. At 375 px with the keyboard closed and open, and at 1280 px. */
async function checkBottomSheetBar(width, height, keyboard = 0, keyboardUp = false) {
  const label = `${width}px bottom sheet bar${keyboardUp ? ' with keyboard' : ''}`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 600, isMobile: width < 600, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.waitForTimeout(500);
  if (keyboardUp) {
    await page.evaluate((h) => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, get: () => h });
      visualViewport.dispatchEvent(new Event('resize'));
    }, height - keyboard);
    await page.waitForTimeout(400);
  }
  const got = await page.evaluate(() => {
    const bar = document.querySelector('.mo-editor-save-bar');
    if (!bar) return null;
    const ref = document.body.appendChild(document.createElement('div'));
    ref.className = 'mo-sheet__container mo-is-bottom';
    const refStyle = getComputedStyle(ref);
    const style = getComputedStyle(bar);
    const out = {
      standard:
        bar.classList.contains('mo-sheet__container') &&
        bar.classList.contains('mo-is-bottom') &&
        bar.classList.contains('mo-sheet__standard'),
      background: style.backgroundColor,
      refBackground: refStyle.backgroundColor,
      radius: style.borderTopLeftRadius,
      refRadius: refStyle.borderTopLeftRadius,
      position: style.position,
      bottomRight: style.borderTopRightRadius,
      rect: bar.getBoundingClientRect().toJSON(),
      visible: visualViewport.height,
      buttons: [...bar.querySelectorAll('button')].map((b) => b.textContent.trim()),
    };
    ref.remove();
    // The last field of the form, scrolled to the end of the page.
    scrollTo(0, document.documentElement.scrollHeight);
    return out;
  });
  if (!got) problems.push(`${label}: the page form has no bar`);
  else {
    if (!got.standard) problems.push(`${label}: the bottom surface is not the theme's standard bottom sheet`);
    if (got.background !== got.refBackground)
      problems.push(`${label}: its surface ${got.background} is not a bottom sheet's ${got.refBackground}`);
    if (got.radius !== got.refRadius || got.radius === '0px')
      problems.push(`${label}: its top radius is ${got.radius}, a bottom sheet's is ${got.refRadius}`);
    if (got.position !== 'fixed') problems.push(`${label}: it is ${got.position}, not fixed`);
    if (!got.buttons.includes('Publish')) problems.push(`${label}: Publish is not in it (${got.buttons.join('|')})`);
    if (got.rect.bottom > got.visible + 1 || (keyboardUp && Math.abs(got.rect.bottom - got.visible) > 1))
      problems.push(`${label}: it ends at ${got.rect.bottom}, not at the visible screen's end (${got.visible})`);
    await page.waitForTimeout(300);
    const clear = await page.evaluate(() => {
      const bar = document.querySelector('.mo-editor-save-bar').getBoundingClientRect();
      const fields = [
        ...document.querySelectorAll(
          '.mo-editor-screen input, .mo-editor-screen textarea, .mo-editor-screen select, .mo-editor-screen .ProseMirror',
        ),
      ];
      const last = fields.filter((f) => f.getBoundingClientRect().height > 0).pop();
      return last ? { bottom: last.getBoundingClientRect().bottom, top: bar.top } : null;
    });
    if (!clear) problems.push(`${label}: the form has no field`);
    else if (clear.bottom > clear.top + 1)
      problems.push(`${label}: the last field (bottom ${clear.bottom}) stays behind the sheet (top ${clear.top})`);
  }
  await page.close();
}

/** A block's sheet on a phone (spec 2026-11-14-one-save-while-writing-design.md, 4.2, 4.3, 10; owner, 14 Nov: full-screen views are pages): a subpage of the
 * page form, drawn as the crop page is, not a full-screen dialog: the top app bar has the back arrow and the block's name only (no Save in it), the fields are
 * below, and Save is in the bottom bar; the page's Publish is under it and can't be reached; one Save is visible; it has a step of its own in the history. Back
 * (the arrow, Esc, the browser's back) with no change leaves at once, with a change asks "Keep your changes?"; Back or Save returns to the page at the scroll
 * place it was, text unchanged. A change is kept in a hidden copy in this browser: after a reload the page offers "Restore your unsaved changes?" (no button
 * focused), Restore opens the subpage with the change, still unsaved, and Save writes it and deletes the copy (so does Discard in "Keep your changes?"). (An
 * image's sheet: the same sheet as a block's fields; every block of the demo is typed in place.) */
async function checkPhoneSheet(width = 375, height = 740) {
  const label = `${width}px block sheet on a phone`;
  const path = BUILT_PAGE;
  const lines = Array.from({ length: 16 }, (_, i) => `Line ${i + 1} of the page.`).join('\n\n');
  const text = `---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n${lines}\n\n![The Moon](/images/uploads/2026/10/moon.webp)\n\nMore text.\n`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  // The reload leaves a page with changes: let it go.
  page.on('dialog', (d) => void d.accept().catch(() => {}));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror .mo-site-picture .mo-site-block-card', { timeout: 30_000 });
  const copies = () =>
    page.evaluate(() =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith('editor-sheet-copy:'))
        .map((k) => JSON.parse(localStorage.getItem(k))),
    );
  const card = page.locator('.ProseMirror .mo-site-picture .mo-site-block-card').first();
  const sheet = page.locator('dialog[open].mo-editor-block-page');
  const back = () => sheet.getByRole('button', { name: /^Back to /, exact: false });
  const asked = () => page.locator('dialog[open]').filter({ hasText: 'Keep your changes?' });
  const place = () =>
    page.evaluate(() => ({
      scroll: Math.round(scrollY),
      top: Math.round(document.querySelector('.ProseMirror .mo-site-picture .mo-site-block-card')?.getBoundingClientRect().top ?? -1),
      step: history.state?.sheet,
      hash: location.hash,
      text: [...document.querySelectorAll('.ProseMirror p')].map((p) => p.textContent).join('|'),
    }));
  const openSheet = async () => {
    await card.scrollIntoViewIfNeeded();
    await card.tap();
    await page.waitForTimeout(300);
    // A tap on the image opens its sheet (B11); the bar's Edit is only there while the sheet is not open.
    if (!(await sheet.count())) await pressTool(page, 'Edit', 'tap');
    await sheet.waitFor({ timeout: 5000 });
    await page.waitForTimeout(400);
  };
  // The page changed first, so its Publish (and Save) is there under the subpage.
  await page.locator('.ProseMirror p', { hasText: 'More text.' }).click();
  await page.keyboard.press('End');
  await page.keyboard.type(' Changed.');
  await page.waitForTimeout(400);
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  let before = await place();
  if (before.scroll < 100) problems.push(`${label}: the page is not scrolled (${before.scroll}), so its scroll place cannot be checked`);
  await openSheet().catch(() => problems.push(`${label}: Edit on the image did not open a subpage`));
  if (!(await sheet.count())) return void (await page.close());
  // Where the page is, as the sheet opens (the tap on the block may have scrolled it a little to show the block's row).
  before = await place();
  const look = await page.evaluate(() => {
    const d = document.querySelector('dialog[open].mo-editor-block-page');
    const r = d.getBoundingClientRect();
    const named = (re) =>
      [...document.querySelectorAll('button')].filter((b) => re.test((b.getAttribute('aria-label') || b.textContent || '').trim()));
    // A button a finger can reach: drawn, and the topmost thing at its middle is the button.
    const reachable = (b) => {
      const box = b.getBoundingClientRect();
      if (!box.width || !box.height || !b.checkVisibility?.({ visibilityProperty: true })) return false;
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return !!hit && b.contains(hit) && !b.closest('[inert]');
    };
    const publish = named(/^Publish/).filter((b) => !d.contains(b));
    const bar = d.querySelector('.mo-sheet__standard.mo-is-bottom');
    // What makes the Save row the theme's standard bottom sheet (the same surface and top corners as a BottomSheet container), and where Save
    // and the fields stand: Save stands inside the sheet's own content padding, and the last field ends above the sheet.
    const sheetLook = (bar, d) => {
      const ref = document.body.appendChild(document.createElement('div'));
      ref.className = 'mo-sheet__container mo-is-bottom';
      const refStyle = getComputedStyle(ref);
      const style = bar ? getComputedStyle(bar) : null;
      const save = [...(bar?.querySelectorAll('button') ?? [])].pop()?.getBoundingClientRect();
      const fields = [...d.querySelectorAll('.mo-editor-block-page-main input, .mo-editor-block-page-main textarea')].filter(
        (f) => f.getBoundingClientRect().height > 0,
      );
      const main = d.querySelector('.mo-editor-block-page-main');
      main.scrollTo(0, main.scrollHeight);
      const last = fields.at(-1)?.getBoundingClientRect();
      const out = {
        standardSheet:
          !!bar &&
          bar.classList.contains('mo-sheet__container') &&
          bar.classList.contains('mo-is-bottom') &&
          bar.classList.contains('mo-sheet__standard'),
        sheetSurface: style && style.backgroundColor === refStyle.backgroundColor,
        sheetRadius: style && style.borderTopLeftRadius === refStyle.borderTopLeftRadius && style.borderTopLeftRadius !== '0px',
        sheetFixed: style?.position === 'fixed',
        saveEnd: save ? Math.round(window.innerWidth - save.right) : null,
        // The sheet's own content padding (the theme's): Save stands exactly inside it.
        sheetPad: bar ? Math.round(parseFloat(getComputedStyle(bar.querySelector('.mo-is-bottom .mo-sheet__content')).paddingRight)) : null,
        saveBelow: save && bar ? Math.round(bar.getBoundingClientRect().bottom - save.bottom) : null,
        saveAbove: save && bar ? Math.round(save.top - bar.getBoundingClientRect().top) : null,
        lastClear: last && bar ? last.bottom <= bar.getBoundingClientRect().top + 1 : null,
      };
      ref.remove();
      return out;
    };
    const top = d.querySelector('header');
    const save = [...(bar?.querySelectorAll('button') ?? [])].find((b) => b.textContent.trim() === 'Save');
    const names = (el) => [...(el?.querySelectorAll('button') ?? [])].map((b) => (b.getAttribute('aria-label') || b.textContent).trim());
    return {
      rect: [r.left, r.top, r.width, r.height].map(Math.round),
      modal: d.matches(':modal'),
      full: [...document.querySelectorAll('dialog[open] .mo-dialog.mo-is-basic')].some((b) => {
        const r = b.getBoundingClientRect();
        return r.width >= innerWidth - 1 && r.height >= innerHeight - 1;
      }),
      title: d.querySelector('h1')?.textContent.trim(),
      topButtons: names(top),
      barButtons: names(bar),
      saveFilled: !!save && /filled/i.test(save.className + (save.dataset.kind ?? '')),
      saveAtBottom: !!save && Math.abs(save.getBoundingClientRect().bottom - window.innerHeight) < 40,
      ...sheetLook(bar, d),
      removes: named(/^Remove$/).filter((b) => d.contains(b)).length,
      publish: publish.length,
      publishReachable: publish.filter(reachable).length,
      saves: named(/^Save( draft)?$/).filter(reachable).length,
      focusOnPage: document.activeElement === d,
      focusVisible: [...document.querySelectorAll(':focus-visible')]
        .filter((e) => getComputedStyle(e).outlineStyle !== 'none' || getComputedStyle(e).boxShadow !== 'none')
        .map((e) => e.tagName + ':' + (e.getAttribute('aria-label') ?? '')),
      step: history.state?.sheet,
    };
  });
  if (look.rect.join() !== `0,0,${width},${height}`) problems.push(`${label}: the subpage does not fill the screen (${look.rect})`);
  if (!look.modal) problems.push(`${label}: the subpage is not modal`);
  if (look.full) problems.push(`${label}: the block's sheet is a full-screen dialog, not a page`);
  if (look.title !== 'Image') problems.push(`${label}: the top bar's title is "${look.title}", not the block's name`);
  if (look.topButtons.join() !== 'Back to T')
    problems.push(`${label}: the top bar has ${look.topButtons.join(', ')}, not only the back arrow named "Back to T"`);
  if (look.barButtons.join() !== 'Save') problems.push(`${label}: the bottom bar has ${look.barButtons.join(', ')}, not only Save`);
  if (!look.saveAtBottom) problems.push(`${label}: Save is not at the bottom of the screen`);
  if (!look.standardSheet) problems.push(`${label}: the Save row is not the theme's standard bottom sheet`);
  if (!look.sheetSurface) problems.push(`${label}: the Save row's surface is not a bottom sheet's`);
  if (!look.sheetRadius) problems.push(`${label}: the Save row's top corners are not a bottom sheet's`);
  if (!look.sheetFixed) problems.push(`${label}: the Save row is not fixed to the bottom`);
  // The grid margin (owner, 15 Nov 2026): 16 dp on compact, never the old 20.
  if (look.sheetPad !== 16) problems.push(`${label}: the sheet's side padding is ${look.sheetPad} dp, not the grid margin 16`);
  if (look.saveEnd !== look.sheetPad)
    problems.push(`${label}: Save ends ${look.saveEnd} dp from the side, not at the sheet's own padding (${look.sheetPad} dp)`);
  if (look.saveAbove !== 16) problems.push(`${label}: Save is ${look.saveAbove} dp from the sheet's top, not 16`);
  if (look.saveBelow < 16) problems.push(`${label}: Save is ${look.saveBelow} dp from the sheet's bottom, under 16`);
  if (!look.lastClear) problems.push(`${label}: the last field stays behind the Save row`);
  if (look.removes) problems.push(`${label}: the subpage has Remove (it is in the block's ⋮)`);
  if (!look.publish) problems.push(`${label}: the changed page has no Publish to check under the subpage`);
  if (look.publishReachable) problems.push(`${label}: the page's Publish can be reached while the subpage is open`);
  if (look.saves !== 1) problems.push(`${label}: ${look.saves} Save buttons can be reached, not one`);
  // Owner rule, 15 Nov: no control has the focus at the start; the page has it, without a ring or a tooltip.
  if (!look.focusOnPage) problems.push(`${label}: the focus does not start on the page itself`);
  if (look.focusVisible.length) problems.push(`${label}: ${look.focusVisible} has focus-visible styling when the subpage opens`);
  if (look.step !== 'mo-editor-block-page') problems.push(`${label}: the subpage has no step of its own in the history (${look.step})`);
  // Back with no change leaves at once, to the same place, text unchanged.
  await back().tap();
  await page.waitForTimeout(500);
  const left = await place();
  if (await sheet.count()) problems.push(`${label}: Back with no change did not leave the subpage`);
  if (await asked().count()) problems.push(`${label}: Back with no change asked "Keep your changes?"`);
  if (left.step === 'mo-editor-block-page') problems.push(`${label}: the subpage's step is still in the history after Back`);
  if (Math.abs(left.scroll - before.scroll) > 1 || Math.abs(left.top - before.top) > 1)
    problems.push(`${label}: the page is at ${left.scroll} (block at ${left.top}) after Back, it was at ${before.scroll} (${before.top})`);
  if (left.text !== before.text || left.hash !== before.hash)
    problems.push(
      `${label}: the page under the subpage was changed (${left.hash} vs ${before.hash}; ${left.text === before.text ? 'same text' : `text ${before.text?.length} -> ${left.text?.length}: ${left.text?.slice(-60)}`})`,
    );
  // The browser's back (the Android gesture) does the same; with a change it asks, and staying gives the subpage its step back.
  await openSheet();
  await page.evaluate(() => history.back());
  await sheet
    .waitFor({ state: 'detached', timeout: 4000 })
    .catch(() => problems.push(`${label}: the browser's back did not leave the subpage`));
  if ((await place()).hash !== before.hash) problems.push(`${label}: the browser's back left the editor, not only the subpage`);
  await openSheet();
  const second = await place();
  await sheet.getByLabel('Alt text').fill('The Moon, again');
  await page.evaluate(() => history.back());
  await asked()
    .waitFor({ timeout: 4000 })
    .catch(() => problems.push(`${label}: the browser's back with a change did not ask "Keep your changes?"`));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (!(await sheet.count()) || (await place()).step !== 'mo-editor-block-page')
    problems.push(`${label}: staying after the browser's back did not keep the subpage and give it its step back`);
  // Back with a change asks; Esc stays; Discard leaves with the image as it was and deletes the hidden copy.
  await back().tap();
  await asked()
    .waitFor({ timeout: 4000 })
    .catch(() => problems.push(`${label}: Back with a change did not ask "Keep your changes?"`));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (!(await sheet.count())) problems.push(`${label}: Esc on the question did not stay in the subpage`);
  await back().tap();
  await asked().getByRole('button', { name: 'Discard', exact: true }).tap();
  await page.waitForTimeout(700);
  if (await sheet.count()) problems.push(`${label}: Discard did not leave the subpage`);
  if ((await copies()).length) problems.push(`${label}: Discard did not delete the hidden copy`);
  const same = await card.getAttribute('aria-description');
  if (same === 'The Moon, again') problems.push(`${label}: Discard changed the image`);
  const afterDiscard = await place();
  if (Math.abs(afterDiscard.scroll - second.scroll) > 1)
    problems.push(`${label}: the page is at ${afterDiscard.scroll} after Discard, it was at ${second.scroll}`);
  // Save returns to the block at the place the page was.
  await openSheet();
  const third = await place();
  await sheet.getByRole('button', { name: 'Save', exact: true }).tap();
  await page.waitForTimeout(700);
  const afterSave = await place();
  if (await sheet.count()) problems.push(`${label}: Save did not leave the subpage`);
  if (Math.abs(afterSave.scroll - third.scroll) > 1 || Math.abs(afterSave.top - third.top) > 1)
    problems.push(
      `${label}: the page is at ${afterSave.scroll} (block at ${afterSave.top}) after Save, it was at ${third.scroll} (${third.top})`,
    );
  if (afterSave.text !== third.text) problems.push(`${label}: Save changed the page's text`);
  if (afterSave.step === 'mo-editor-block-page') problems.push(`${label}: the subpage's step is still in the history after Save`);
  // A change is kept in the hidden copy (300 ms after it).
  await openSheet();
  await sheet.getByLabel('Alt text').fill('The Moon, changed');
  await page.waitForTimeout(800);
  const kept = await copies();
  if (kept.length !== 1 || kept[0].values?.alt !== 'The Moon, changed' || kept[0].block?.type !== 'image')
    problems.push(`${label}: the change is not in the hidden copy (${JSON.stringify(kept)})`);
  // A reload offers it back.
  await page.reload();
  await page.waitForSelector('.ProseMirror .mo-site-picture .mo-site-block-card', { timeout: 30_000 });
  const question = page.locator('dialog[open]', { hasText: 'Restore your unsaved changes?' });
  await question.waitFor({ timeout: 8000 }).catch(() => problems.push(`${label}: a reload does not offer "Restore your unsaved changes?"`));
  if (await question.count()) {
    if (!(await question.getByText('Your changes to Image weren’t saved.').count()))
      problems.push(`${label}: the restore question does not say "Your changes to Image weren’t saved."`);
    // The owner's dialog rule: no button has the focus to begin with (Restore filled, Discard outlined).
    const focused = await page.evaluate(() =>
      document.activeElement?.closest('button') ? document.activeElement.textContent?.trim() : null,
    );
    if (focused) problems.push(`${label}: the button "${focused}" has the focus when the restore question opens`);
    await question.getByRole('button', { name: 'Restore', exact: true }).tap();
    await sheet.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: Restore did not open the image's subpage`));
    if (await sheet.count()) {
      const alt = await sheet.getByLabel('Alt text').inputValue();
      if (alt !== 'The Moon, changed') problems.push(`${label}: Restore opened the subpage without the change (alt "${alt}")`);
      const unsaved = await card.getAttribute('aria-description');
      if (unsaved === 'The Moon, changed') problems.push(`${label}: Restore wrote the change to the image before Save`);
      await sheet.getByRole('button', { name: 'Save', exact: true }).tap();
      await page.waitForTimeout(800);
      if (await sheet.count()) problems.push(`${label}: Save did not leave the subpage`);
      if ((await copies()).length) problems.push(`${label}: Save did not delete the hidden copy`);
      const described = await card.getAttribute('aria-description');
      if (described !== 'The Moon, changed') problems.push(`${label}: Save did not write the change to the image (${described})`);
      if ((await place()).step === 'mo-editor-block-page') problems.push(`${label}: the subpage's step is still in the history after Save`);
    }
  }
  await page.close();
}

/** The same hidden copy at computer width (PM decision, 14 Nov): Restore opens the live side sheet with the copy's values already written to the block as
 * unsaved changes of the page (written through the live link like any edit), with no Save or Cancel in the sheet; the copy is deleted. */
async function checkComputerRestore(width = 1280, height = 900) {
  const label = `${width}px restoring a block's sheet`;
  const path = BUILT_PAGE;
  const text = '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n![The Moon](/images/uploads/2026/10/moon.webp)\n\nMore text.\n';
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  page.on('dialog', (d) => void d.accept().catch(() => {}));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror .mo-site-picture .mo-site-block-card', { timeout: 30_000 });
  const card = page.locator('.ProseMirror .mo-site-picture .mo-site-block-card').first();
  // A copy left by the sheet of a narrower window (the same browser): the block, the values it had and the ones typed.
  await page.evaluate((file) => {
    localStorage.setItem(
      `editor-sheet-copy:${file}`,
      JSON.stringify({
        page: file,
        block: {
          index: 0,
          type: 'image',
          before: { src: '/images/uploads/2026/10/moon.webp', alt: 'The Moon', format: '', crop: null, decorative: false },
        },
        values: { src: '/images/uploads/2026/10/moon.webp', alt: 'The Moon, restored', format: '', crop: null, decorative: false },
        at: Date.now(),
      }),
    );
  }, path);
  await page.reload();
  await page.waitForSelector('.ProseMirror .mo-site-picture .mo-site-block-card', { timeout: 30_000 });
  const question = page.locator('dialog[open]', { hasText: 'Restore your unsaved changes?' });
  await question.waitFor({ timeout: 8000 }).catch(() => problems.push(`${label}: a reload does not offer "Restore your unsaved changes?"`));
  if (!(await question.count())) return void (await page.close());
  await question.getByRole('button', { name: 'Restore', exact: true }).click();
  const sheet = page.locator('.mo-editor-side-sheet');
  await sheet.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: Restore did not open the live side sheet`));
  await page.waitForTimeout(600);
  if (await sheet.count()) {
    const alt = await sheet.getByLabel('Alt text').inputValue();
    if (alt !== 'The Moon, restored') problems.push(`${label}: the live sheet does not show the restored value (alt "${alt}")`);
    const buttons = (await sheet.getByRole('button').allTextContents()).map((b) => b.trim());
    for (const name of ['Save', 'Cancel', 'Insert'])
      if (buttons.includes(name)) problems.push(`${label}: the live sheet has ${name} (${buttons})`);
  }
  // Written to the block as an unsaved change of the page.
  const described = await card.getAttribute('aria-description');
  if (described !== 'The Moon, restored') problems.push(`${label}: the restored value was not written to the image (${described})`);
  const dirty = await page
    .locator('button', { hasText: /^Publish/ })
    .first()
    .isVisible()
    .catch(() => false);
  if (!dirty) problems.push(`${label}: the restored change does not show as a change of the page (no Publish)`);
  const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('editor-sheet-copy:')).length);
  if (left) problems.push(`${label}: the hidden copy is still there after Restore`);
  await page.close();
}

/** The live side sheet from expanded (spec 2026-11-14 one Save, 4.1 and 4.4): a block from Insert goes in at once with its sheet open beside it; the sheet has
 * its headline and close button and no Save, Insert, Cancel or Remove; a change of a field shows in the page at once; Undo takes it back and the sheet shows the
 * old value; the close button asks nothing; Remove is in the block's ⋮; a tap on the card opens the sheet again, and Undo of the insert closes it. */
async function checkLiveSideSheet(width = 1280) {
  const label = `${width}px live side sheet`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
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
  const sheet = page.locator('.mo-editor-side-sheet');
  const opened = await sheet
    .locator('textarea')
    .waitFor({ timeout: 6000 })
    .then(
      () => true,
      () => false,
    );
  if (!opened) {
    problems.push(`${label}: Insert did not open the block's side sheet`);
    return void (await page.close());
  }
  // The block's button (it holds the name and the description; the frame around it and its preview holds none).
  const card = page.locator('.ProseMirror .mo-site-block-card-button').first();
  if (!(await card.count())) problems.push(`${label}: the new block is not in the page while its sheet is open (no Insert step)`);
  const buttons = await sheet.locator('button').evaluateAll((els) => els.map((b) => b.textContent.trim()).filter(Boolean));
  const extra = buttons.filter((b) => ['Save', 'Insert', 'Cancel', 'Remove'].includes(b));
  if (extra.length) problems.push(`${label}: the side sheet has ${extra.join(', ')} (it is live: only its close button)`);
  if (!(await sheet.locator('[data-side-sheet-close]').count())) problems.push(`${label}: the side sheet has no close button`);
  if (await sheet.locator('.mo-is-side .mo-sheet__actions').count()) problems.push(`${label}: the side sheet has a row of bottom actions`);
  // A change shows in the page at once.
  await sheet.locator('textarea').fill('<p>Live text</p>');
  await page.waitForTimeout(400);
  const description = () => card.getAttribute('aria-description').catch(() => '');
  if (!(await description())?.includes('Live text'))
    problems.push(`${label}: a change in the sheet is not in the page at once (${await description()})`);
  // Undo takes it back, and the sheet shows the old value.
  await page.locator('.mo-editor-tools button[aria-label="Undo"]:visible').first().click();
  await page.waitForTimeout(400);
  if ((await description())?.includes('Live text')) problems.push(`${label}: Undo did not take the sheet's change back`);
  const shown = await sheet
    .locator('textarea')
    .inputValue({ timeout: 2000 })
    .catch(() => null);
  if (shown !== '') problems.push(`${label}: after Undo the sheet shows "${shown}", not the old value`);
  // The close button closes it, with no question.
  await sheet.locator('[data-side-sheet-close]').click();
  await page.waitForTimeout(400);
  if (await page.locator('dialog[open]').count()) problems.push(`${label}: closing the live sheet asked a question`);
  if (await sheet.count()) problems.push(`${label}: the close button did not close the side sheet`);
  // Remove is in the block's ⋮.
  await card.click();
  await page.waitForTimeout(400);
  if (await page.locator('.mo-editor-side-sheet [data-side-sheet-close]').count())
    await page.locator('.mo-editor-side-sheet [data-side-sheet-close]').click();
  await page.waitForTimeout(300);
  const tools = await barTools(page);
  if (!tools.names.includes('Remove')) problems.push(`${label}: the block's ⋮ has no Remove (${tools.names})`);
  // A tap on the card opens the sheet; Undo of the insert takes the block out and closes it.
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(300);
  await card.click();
  await sheet
    .locator('textarea')
    .waitFor({ timeout: 4000 })
    .catch(() => problems.push(`${label}: a tap on the card did not open its side sheet`));
  await page.locator('.mo-editor-tools button[aria-label="Undo"]:visible').first().click();
  await page.waitForTimeout(600);
  if (await page.locator('.ProseMirror .mo-site-block-card').count()) problems.push(`${label}: Undo did not take the new block out`);
  else if (await sheet.count()) problems.push(`${label}: the side sheet stayed open after its block was gone`);
  await page.close();
}

/** A block's side sheet has no control focused when it opens (owner rule, 14 Nov 2026): the sheet itself has the focus, so no field or button shows a focus
 * ring from the start; Tab then goes to its first control. The standard side sheet (from expanded) and the modal one (medium). */
async function checkSheetFocusOnOpen(width) {
  const label = `${width}px sheet focus on open`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
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
  const sheet = page.locator('dialog[open] [data-side-sheet-container], .mo-editor-side-sheet').last();
  await sheet
    .locator('textarea')
    .waitFor({ timeout: 6000 })
    .catch(() => problems.push(`${label}: Insert did not open the block's side sheet`));
  await page.waitForTimeout(500);
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      container: !!el?.matches('[data-side-sheet-container]'),
      control: !!el?.matches('input, textarea, select, button, a[href]'),
      outline: el ? getComputedStyle(el).outlineStyle : '',
      name: el ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}` : 'none',
    };
  });
  if (focus.control) problems.push(`${label}: a control (${focus.name}) has the focus when the sheet opens`);
  if (!focus.container) problems.push(`${label}: the focus is on ${focus.name}, not on the sheet itself`);
  if (focus.container && focus.outline !== 'none') problems.push(`${label}: the sheet shows a focus ring of its own (${focus.outline})`);
  await page.keyboard.press('Tab');
  const next = await page.evaluate(
    () => !!document.activeElement?.closest('[data-side-sheet-container]') && document.activeElement?.tagName !== 'BODY',
  );
  if (!next) problems.push(`${label}: Tab from the sheet did not go to a control in it`);
  await page.close();
}

/** Closing a changed sheet below expanded (from expanded the side sheet is live and asks nothing: checkLiveSideSheet) (closeChanged, ask.tsx; image tools spec 9.3): the question is "Keep your changes?" with the text that the changes stay in the
 * page until it is saved, and Discard and Keep in one row, Keep last (M3's basic dialog), with no Cancel; Esc stays in the sheet, Keep does what the sheet's
 * Insert does, and Discard closes it without the block. */
async function checkCloseChangedSheet(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px closing a changed sheet`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const sheet = page
    .locator('dialog[open], .mo-editor-side-sheet')
    .filter({ has: page.locator('textarea') })
    .last();
  const question = page.locator('dialog[open]').filter({ hasText: 'Keep your changes?' });
  const insertVideo = async () => {
    await pressInsert(page, 'click');
    await page.locator('dialog[open] button', { hasText: 'Add a video or calendar.' }).first().click();
    await sheet.locator('textarea').fill('<iframe src="https://www.youtube.com/embed/abc" title="Clip"></iframe>');
  };
  const cancel = () => cancelOf(sheet).click();
  await insertVideo();
  await cancel();
  if (
    !(await question.waitFor({ timeout: 4000 }).then(
      () => true,
      () => false,
    ))
  ) {
    problems.push(`${label}: Cancel with a change does not ask "Keep your changes?"`);
    return void (await page.close());
  }
  const asked = await question.evaluate((d) => ({
    text: d.textContent,
    buttons: [...d.querySelectorAll('button')]
      .filter((b) => b.offsetParent)
      .map((b) => ({ name: b.textContent.trim(), x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y })),
  }));
  if (!asked.text.includes('Your changes stay in the page until you save it.'))
    problems.push(`${label}: the question does not say the changes stay in the page (${asked.text.trim()})`);
  const names = asked.buttons.map((b) => b.name);
  if (names.join() !== 'Discard,Keep') problems.push(`${label}: the question's buttons are ${names.join(', ')}, not Discard and Keep`);
  const [discard, keep] = asked.buttons;
  if (discard && keep && (Math.abs(discard.y - keep.y) > 1 || keep.x <= discard.x))
    problems.push(`${label}: Keep is not last in one row with Discard (${JSON.stringify(asked.buttons)})`);
  // Esc stays in the sheet with the change.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  if (await question.count()) problems.push(`${label}: Esc did not close the question`);
  if (!(await sheet.count()) || !(await sheet.locator('textarea').inputValue()).includes('youtube'))
    problems.push(`${label}: Esc on the question did not stay in the sheet with the change`);
  // Discard closes the sheet without the block.
  await cancel();
  await question.getByRole('button', { name: 'Discard', exact: true }).click();
  await page.waitForTimeout(500);
  if (await page.locator('.ProseMirror .mo-site-block-card').count()) problems.push(`${label}: Discard inserted the block`);
  // Keep does what Insert does.
  await insertVideo();
  await cancel();
  await question.getByRole('button', { name: 'Keep', exact: true }).click();
  await page
    .waitForSelector('.ProseMirror .mo-site-block-card', { timeout: 6000 })
    .catch(() => problems.push(`${label}: Keep did not insert the block`));
  await page.close();
}

/** An image in the text and its tools (0.19.8 plan, section 4; B11, B12): Insert › Image puts an image in the text; a tap selects it and opens its sheet on every width, and the
 * text bar shows no image tools (no Change image, Crop, Alt text or Remove). The sheet holds Change image, Aspect ratio (the crop), the Alt text field and Remove. The aspect
 * ratio opens the crop view; Remove takes the image out and Undo brings it back; Delete on the selected image does what Remove does. */
async function checkImageTools(width, height = 800) {
  const phone = width < 600;
  const expanded = width >= 840;
  const label = `${width}px image tools`;
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
  await pressInsert(page, 'click');
  await page
    .locator('dialog[open] button', { hasText: /^Image/ })
    .first()
    .click();
  await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
  await page.locator('dialog[open] [data-media-tile]').first().click();
  const sheet = () => page.locator('dialog[open], .mo-editor-side-sheet').last();
  // From expanded the image goes in at once with its live sheet open (one Save spec 4.1: no Insert or Skip); below it the short alt text sheet follows,
  // and Skip keeps the image without a text of its own.
  if (!expanded)
    await sheet()
      .locator('button', { hasText: /^Skip$/ })
      .click({ timeout: 8000 });
  const image = page.locator('.ProseMirror .mo-site-picture .mo-site-block-card').first();
  await image.waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);
  // Closes the sheet the image opened, to start from a selected image with no sheet.
  const closeSheet = async () => {
    await page
      .locator('dialog[open] button[aria-label="Close"], dialog[open] button:text-is("Cancel"), .mo-editor-side-sheet [data-side-sheet-close]')
      .first()
      .click({ timeout: 3000 })
      .catch(() => {});
    await page.waitForTimeout(500);
  };
  await closeSheet();
  await image[phone ? 'tap' : 'click']();
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => ({
    pressed: document.querySelector('.mo-site-picture .mo-site-block-card')?.getAttribute('aria-pressed'),
    tools: [...document.querySelectorAll('.mo-editor-tools-context button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()),
    row: [...document.querySelectorAll('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row]')].map((b) => b.getAttribute('aria-label')),
    open: !!document.querySelector('dialog[open], .mo-editor-side-sheet'),
  }));
  if (state.pressed !== 'true') problems.push(`${label}: a tap on the image did not select it`);
  if (!state.open) problems.push(`${label}: a tap on the image did not open its sheet`);
  for (const name of ['Replace', 'Change image', 'Crop', 'Alt text', 'Delete', 'Remove'])
    if (state.tools.includes(name)) problems.push(`${label}: the text bar still has the image tool ${name}`);
  for (const name of ['Move up', 'Move down'])
    if (!state.row.includes(name)) problems.push(`${label}: the row has no ${name} (${state.row})`);
  const have = (await sheet().locator('button').allTextContents()).map((b) => b.trim());
  for (const name of ['Change image', 'Remove'])
    if (!have.some((b) => b.startsWith(name))) problems.push(`${label}: the image's sheet has no ${name} (${have.join(', ')})`);
  if (!(await sheet().getByLabel('Alt text').count())) problems.push(`${label}: the image's sheet has no Alt text field`);
  // The aspect ratio opens the crop view.
  if (!phone || (await sheet().getByText('Aspect ratio').count())) {
    await sheet().getByText('Aspect ratio').first().click();
    await page.waitForTimeout(900);
    if (!(await page.locator('.mo-editor-crop-page[open]').count())) problems.push(`${label}: Aspect ratio did not open the crop view`);
    else {
      await page.locator('.mo-editor-crop-page[open]').getByRole('button', { name: /^Back to/ }).first().click();
      await page.waitForTimeout(500);
    }
  } else problems.push(`${label}: the image's sheet has no Aspect ratio row`);
  // Remove in the sheet takes the image out, Undo brings it back.
  await sheet().getByRole('button', { name: 'Remove', exact: true }).click();
  await page.waitForTimeout(700);
  if (await page.locator('.ProseMirror .mo-site-picture').count()) problems.push(`${label}: Remove did not take the image out`);
  await pressTool(page, 'Undo', phone ? 'tap' : 'click');
  await page.waitForTimeout(500);
  if (!(await page.locator('.ProseMirror .mo-site-picture').count())) problems.push(`${label}: Undo did not bring the removed image back`);
  // Delete on the selected image (a keyboard) does what Remove does.
  if (!phone) {
    await closeSheet();
    await image.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await image.focus();
    await page.keyboard.press('Delete');
    await page.waitForTimeout(400);
    if (await page.locator('.ProseMirror .mo-site-picture').count())
      problems.push(`${label}: Delete on the selected image did not remove it`);
  }
  await page.close();
}
/** The crop view (src/CropView.tsx, image tools spec section 3): a page of the editor on every width (owner, 14 Nov), opened by the bar's Crop (never by an image that was
 * just picked): a top app bar with a back arrow and the title, the page as large as the window with Save in a bottom bar (and Cancel from medium), and the form under it
 * left as it was (scroll place, text). It starts as Original (the whole image, no frame, the slider off); an aspect ratio gives a frame of that ratio with the theme's
 * scrim outside it and a two-tone border; the slider and its minus and plus buttons zoom, a drag places the image under the frame, the wheel zooms with a mouse and a
 * pinch with two fingers; Save writes `#format=…&crop=…` to the image; leaving with changes (the arrow, Cancel, the phone's back gesture) asks "Keep your changes?"; the
 * image sheet has an Aspect ratio row (no Format chips) that opens the same page. */
async function checkCropView(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px crop view`;
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
  await pressInsert(page, 'click');
  await page
    .locator('dialog[open] button', { hasText: /^Image/ })
    .first()
    .click();
  await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
  await page.locator('dialog[open] [data-media-tile]').first().click();
  // From expanded the image goes in at once with its live sheet open (one Save spec 4.1: no Insert or Skip); below it the short alt text sheet follows,
  // and Skip keeps the image without a text of its own.
  if (width < 840)
    await page
      .locator('dialog[open], .mo-editor-side-sheet')
      .last()
      .locator('button', { hasText: /^Skip$/ })
      .click({ timeout: 8000 });
  const image = page.locator('.ProseMirror .mo-site-picture .mo-site-block-card').first();
  await image.waitFor({ timeout: 8000 });
  await page.waitForTimeout(800);
  if (await page.locator('.mo-editor-crop-page[open]').count())
    problems.push(`${label}: the crop view opened by itself after the image was picked`);
  const view = page.locator('.mo-editor-crop-page[open]');
  const how = phone ? 'tap' : 'click';
  // The crop view is reached from the image's sheet (B12); after Save or Discard that sheet is still open, so it is tapped only when it is not.
  const select = async () => {
    if (await page.locator('dialog[open].mo-editor-block-page, .mo-editor-side-sheet').count()) return;
    await image[how]();
    await page.waitForTimeout(600);
  };
  const open = async () => {
    await select();
    await page.locator('dialog[open], .mo-editor-side-sheet').last().getByText('Aspect ratio').first()[how]();
    await view.waitFor({ timeout: 5000 });
    await page.waitForTimeout(500);
  };
  const back = () => view.getByRole('button', { name: 'Back to Image', exact: true });
  const zoom = () => view.locator('input[type=range]').inputValue().then(Number);
  const pictureBox = () => view.locator('.mo-editor-crop-view-image').boundingBox();
  const chip = (name) => view.locator('.mo-editor-crop-view-ratios').getByText(name, { exact: true });
  const asked = () => page.locator('dialog[open]').filter({ hasText: 'Keep your changes?' });

  const scroll0 = await page.evaluate(() => scrollY);
  await open();
  // No control has the focus at the start (owner, 15 Nov): the page has it, and nothing shows focus-visible styling.
  const start = await view.evaluate((d) => ({
    onPage: document.activeElement === d,
    styled: [...document.querySelectorAll(':focus-visible')].filter(
      (e) => getComputedStyle(e).outlineStyle !== 'none' || getComputedStyle(e).boxShadow !== 'none',
    ).length,
  }));
  if (!start.onPage) problems.push(`${label}: the focus does not start on the crop page itself`);
  if (start.styled) problems.push(`${label}: an element has focus-visible styling when the crop page opens`);
  // A page on every width: the window's size, a top app bar with the back arrow and the title, a bottom bar with Save (Cancel from medium); not a dialog's parts.
  const kind = await view.evaluate(
    (d, vp) => {
      const r = d.getBoundingClientRect();
      return {
        fills: Math.abs(r.width - vp.w) < 1 && Math.abs(r.height - vp.h) < 1,
        title: d.querySelector('h1')?.textContent,
        bar: !!d.querySelector('header, .mo-top-app-bar'),
        dialogParts: !!d.querySelector('.mo-dialog.mo-is-basic, .mo-dialog__headline'),
        buttons: [...d.querySelectorAll('.mo-sheet__standard.mo-is-bottom button')].map((b) => b.textContent.trim()),
        area: d.querySelector('.mo-editor-crop-view-area').getBoundingClientRect().width,
      };
    },
    { w: width, h: height },
  );
  if (!kind.fills) problems.push(`${label}: the crop view is not as large as the window`);
  if (kind.dialogParts) problems.push(`${label}: the crop view is built of a dialog's parts, not a page`);
  if (kind.title !== 'Crop') problems.push(`${label}: the page's title is "${kind.title}", not Crop`);
  if (!(await view.getByRole('button', { name: 'Back to Image', exact: true }).count()))
    problems.push(`${label}: the page has no back arrow`);
  if (kind.buttons.join() !== (phone ? 'Save' : 'Cancel,Save'))
    problems.push(`${label}: the bottom bar has ${kind.buttons.join(', ')}, not ${phone ? 'Save' : 'Cancel, Save'}`);
  if (kind.area < Math.min(width - 48, 300)) problems.push(`${label}: the image area is only ${kind.area} dp wide`);
  const missing = await view.locator('[data-icon-missing]').evaluateAll((els) => els.map((e) => e.getAttribute('data-icon-missing')));
  if (missing.length) problems.push(`${label}: the crop view draws a missing icon (${missing})`);
  // Original: the whole image, no frame, no scrim, the slider and its buttons off.
  if (await view.locator('.mo-editor-crop-view-frame').count()) problems.push(`${label}: Original has a frame`);
  if (!(await view.locator('input[type=range]').isDisabled())) problems.push(`${label}: the slider is on for Original`);
  for (const name of ['Zoom in', 'Zoom out'])
    if (!(await view.getByRole('button', { name }).isDisabled())) problems.push(`${label}: ${name} is on for Original`);
  const whole = await view.evaluate((d) => {
    const a = d.querySelector('.mo-editor-crop-view-area').getBoundingClientRect();
    const i = d.querySelector('.mo-editor-crop-view-image').getBoundingClientRect();
    return { inside: i.left >= a.left - 0.5 && i.right <= a.right + 0.5 && i.top >= a.top - 0.5 && i.bottom <= a.bottom + 0.5 };
  });
  if (!whole.inside) problems.push(`${label}: Original does not show the whole image in the area`);
  // The ratios: Original first, then the seven, in one row that scrolls sideways below medium and wraps from medium.
  const names = await view.locator('.mo-editor-crop-view-ratios > *').allTextContents();
  if (names.map((n) => n.trim()).join() !== 'Original,1:1,4:5,3:4,2:3,3:2,4:3,16:9')
    problems.push(`${label}: the aspect ratios are ${names.join(', ')}`);
  const row = await view.locator('.mo-editor-crop-view-ratios').evaluate((el) => ({
    scrolls: el.scrollWidth > el.clientWidth + 1,
    rows: new Set([...el.children].map((c) => Math.round(c.getBoundingClientRect().top))).size,
  }));
  if (phone && row.rows !== 1)
    problems.push(`${label}: the aspect ratios are in ${row.rows} rows below medium, not one that scrolls sideways`);
  if (!phone && row.scrolls)
    problems.push(`${label}: the aspect ratios scroll sideways from medium, where they wrap (${JSON.stringify(row)})`);
  // 3:2: a frame of that ratio, the scrim outside it, a two-tone border.
  await chip('3:2').click();
  await page.waitForTimeout(500);
  const frame = await view.locator('.mo-editor-crop-view-frame').evaluate((f) => {
    const s = getComputedStyle(f);
    const b = f.getBoundingClientRect();
    return { ratio: b.width / b.height, border: s.borderTopWidth, borderColor: s.borderTopColor, shadow: s.boxShadow };
  });
  if (Math.abs(frame.ratio - 1.5) > 0.02) problems.push(`${label}: the frame for 3:2 has the ratio ${frame.ratio}`);
  if (frame.border !== '2px' || !/ 0px 0px 0px 1px$/.test(frame.shadow))
    problems.push(`${label}: the frame has no 2 dp border with a 1 dp halo (${frame.border}, ${frame.shadow})`);
  if (frame.borderColor === frame.shadow.replace(/ 0px 0px 0px 1px$/, ''))
    problems.push(`${label}: the frame's border and halo are one colour`);
  // The scrim is a layer on the image alone, the frame cut out of it (not a shadow of the frame, which would grey the blank part of the stage too).
  const shade = await view.evaluate((d) => {
    const el = d.querySelector('.mo-editor-crop-view-shade');
    const i = d.querySelector('.mo-editor-crop-view-image').getBoundingClientRect();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      same: Math.abs(r.x - i.x) < 1 && Math.abs(r.y - i.y) < 1 && Math.abs(r.width - i.width) < 1 && Math.abs(r.height - i.height) < 1,
      clip: getComputedStyle(el).clipPath,
      bg: getComputedStyle(el).backgroundColor,
    };
  });
  if (!shade) problems.push(`${label}: no scrim layer outside the frame`);
  else {
    if (!shade.same) problems.push(`${label}: the scrim layer is not the image's box (${JSON.stringify(shade)})`);
    if (!/polygon/.test(shade.clip)) problems.push(`${label}: the scrim layer has no hole for the frame (${shade.clip})`);
    if (/rgba?\(0, 0, 0, 0\)|transparent/.test(shade.bg))
      problems.push(`${label}: the scrim outside the frame is see-through (${shade.bg})`);
  }
  if ((await view.locator('.mo-editor-crop-view-area').evaluate((a) => getComputedStyle(a).backgroundColor)) !== 'rgba(0, 0, 0, 0)')
    problems.push(`${label}: the image area has a background of its own, not the page's`);
  const z1 = await zoom();
  if (Math.abs(z1 - 1) > 0.01) problems.push(`${label}: a new ratio does not start at zoom 1 (${z1})`);
  // Zoom: the slider and the buttons; the image grows under the frame.
  const before = await pictureBox();
  await view.locator('input[type=range]').focus();
  await page.keyboard.press('End');
  await page.waitForTimeout(300);
  if ((await zoom()) < 3.99) problems.push(`${label}: the slider's End key does not zoom to 4`);
  const after = await pictureBox();
  if (!(after.width > before.width * 3.5))
    problems.push(`${label}: zoom 4 does not make the image about 4 times as wide (${before.width} -> ${after.width})`);
  await view.getByRole('button', { name: 'Zoom out' }).click();
  await page.waitForTimeout(200);
  const out = await zoom();
  if (Math.abs(out - 3.75) > 0.02) problems.push(`${label}: Zoom out does not step the zoom down by a quarter (${out})`);
  await view.getByRole('button', { name: 'Zoom in' }).click();
  await view.getByRole('button', { name: 'Zoom in' }).click();
  if ((await zoom()) > 4.001) problems.push(`${label}: Zoom in goes past 4`);
  // Drag: the image moves under the fixed frame, and keeps covering it.
  const area = await view.locator('.mo-editor-crop-view-area').boundingBox();
  const fbox = () => view.locator('.mo-editor-crop-view-frame').boundingBox();
  const f0 = await fbox();
  const p0 = await pictureBox();
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
  await page.mouse.down();
  await page.mouse.move(area.x + area.width / 2 - 60, area.y + area.height / 2 - 40, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const f1 = await fbox();
  const p1 = await pictureBox();
  if (Math.abs(f1.x - f0.x) > 0.5 || Math.abs(f1.y - f0.y) > 0.5) problems.push(`${label}: the frame moved with the drag`);
  if (Math.abs(p1.x - (p0.x - 60)) > 2 || Math.abs(p1.y - (p0.y - 40)) > 2)
    problems.push(`${label}: a drag by (-60, -40) moved the image by (${p1.x - p0.x}, ${p1.y - p0.y})`);
  if (!(p1.x <= f1.x + 0.5 && p1.y <= f1.y + 0.5 && p1.x + p1.width >= f1.x + f1.width - 0.5 && p1.y + p1.height >= f1.y + f1.height - 0.5))
    problems.push(`${label}: the image leaves a gap in the frame after the drag`);
  // A drag far past the edge stops at the edge.
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
  await page.mouse.down();
  await page.mouse.move(area.x + area.width / 2 + 2000, area.y + area.height / 2 + 2000, { steps: 4 });
  await page.mouse.up();
  const p2 = await pictureBox();
  if (!(p2.x <= f1.x + 0.5 && p2.y <= f1.y + 0.5)) problems.push(`${label}: the image leaves a gap in the frame when dragged far`);
  // The pixels, with a white test image: white inside the frame, darkened by the scrim on the image outside it, and the page's own colour where the image
  // does not reach (the blank part of the stage: no grey strip).
  await view.locator('.mo-editor-crop-view-image').evaluate((img) => {
    img.src =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="white"/></svg>',
      );
  });
  await page.waitForTimeout(400);
  const f3 = await fbox();
  const area3 = await view.locator('.mo-editor-crop-view-area').boundingBox();
  const cy = f3.y + f3.height / 2;
  const points = [
    [f3.x + f3.width / 2, cy],
    [f3.x + f3.width + 6, cy],
    [f3.x - 6, cy],
    [area3.x - 6, cy],
  ];
  const png = await page.screenshot();
  const [inside, shaded, blank, pageColour] = await page.evaluate(
    async ({ b64, points }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const g = canvas.getContext('2d');
      g.drawImage(img, 0, 0);
      return points.map(([x, y]) => [...g.getImageData(Math.round(x), Math.round(y), 1, 1).data].slice(0, 3));
    },
    { b64: png.toString('base64'), points },
  );
  if (!inside.every((c) => c > 250)) problems.push(`${label}: inside the frame the white test image is ${inside}, not white`);
  if (!shaded.every((c) => c > 60 && c < 230))
    problems.push(`${label}: outside the frame the image is ${shaded}, not darkened by the scrim`);
  if (blank.some((c, n) => Math.abs(c - pageColour[n]) > 3))
    problems.push(`${label}: the blank part of the stage is ${blank}, not the page's ${pageColour} (a grey strip)`);
  // The wheel (a mouse) and a pinch (two fingers) zoom.
  if (!phone) {
    const z = await zoom();
    await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);
    if (!((await zoom()) < z - 0.1)) problems.push(`${label}: the wheel does not zoom out`);
  } else {
    const cdp = await page.context().newCDPSession(page);
    const cx = area.x + area.width / 2;
    const cy = area.y + area.height / 2;
    await view.locator('input[type=range]').focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
    const z = await zoom();
    const at = (d) => [
      { x: cx - d, y: cy, id: 1 },
      { x: cx + d, y: cy, id: 2 },
    ];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(30) });
    for (let d = 30; d <= 90; d += 15) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(d) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    if (!((await zoom()) > z * 2))
      problems.push(`${label}: a pinch that spreads the fingers three times does not zoom in (${z} -> ${await zoom()})`);
  }
  // Save writes the ratio and crop to the image.
  await view.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(700);
  if (await view.count()) problems.push(`${label}: Save did not close the crop view`);
  const stepAfter = await page.evaluate(() => ({
    sheet: history.state?.sheet,
    hash: location.hash,
    scroll: scrollY,
    text: document.querySelector('.ProseMirror')?.textContent,
  }));
  if (stepAfter.sheet === 'mo-editor-crop-view') problems.push(`${label}: the page's step is still in the history after Save`);
  if (Math.abs(stepAfter.scroll - scroll0) > 1)
    problems.push(`${label}: the editor is at ${stepAfter.scroll} after the crop view, it was at ${scroll0}`);
  if (stepAfter.hash !== '#new/pages' || !/Hello/.test(stepAfter.text ?? ''))
    problems.push(`${label}: the editor under the crop view was changed (${stepAfter.hash})`);
  // On a phone the image's sheet is a page that holds the change until its Save; from medium it is live.
  if (phone && (await page.locator('dialog[open].mo-editor-block-page').count())) {
    await page.locator('dialog[open].mo-editor-block-page').getByRole('button', { name: 'Save', exact: true }).tap();
    await page.waitForTimeout(700);
  }
  const saved = await page.evaluate(() => {
    const box = document.querySelector('.ProseMirror .mo-site-picture .mo-site-picture__crop');
    return box && { box: box.getAttribute('style'), img: box.querySelector('img')?.getAttribute('style') };
  });
  if (!saved || !/aspect-ratio: 3 \/ 2/.test(saved.box ?? '') || !/translate\(-?\d/.test(saved.img ?? ''))
    problems.push(`${label}: Save did not cut the image to 3:2 with a crop (${JSON.stringify(saved)})`);
  // Reopened: 3:2 is chosen. Leaving with a change asks; Discard leaves the image as it was.
  await open();
  const chosen = await view
    .locator(
      '.mo-editor-crop-view-ratios [aria-pressed="true"], .mo-editor-crop-view-ratios [aria-checked="true"], .mo-editor-crop-view-ratios [data-selected]',
    )
    .allTextContents();
  if (!chosen.some((c) => c.includes('3:2'))) problems.push(`${label}: reopened, 3:2 is not the chosen ratio (${chosen})`);
  await chip('1:1').click();
  await page.waitForTimeout(300);
  await back().click();
  await asked()
    .waitFor({ timeout: 4000 })
    .catch(() => problems.push(`${label}: closing the crop view with a change did not ask "Keep your changes?"`));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (!(await view.count())) problems.push(`${label}: Esc on the question did not stay in the crop view`);
  await back().click();
  await asked().getByRole('button', { name: 'Discard', exact: true }).click();
  await page.waitForTimeout(500);
  if (await view.count()) problems.push(`${label}: Discard did not close the crop view`);
  const still = await page.evaluate(() =>
    document.querySelector('.ProseMirror .mo-site-picture .mo-site-picture__crop')?.getAttribute('style'),
  );
  if (!/aspect-ratio: 3 \/ 2/.test(still ?? '')) problems.push(`${label}: Discard changed the image (${still})`);
  // Closing with nothing changed asks nothing.
  await open();
  await back().click();
  await page.waitForTimeout(400);
  if ((await asked().count()) || (await view.count())) problems.push(`${label}: closing the crop view with no change asked or stayed open`);
  // The phone's back gesture (the browser's back) leaves the page: at once when nothing changed, with the question when something did.
  await open();
  if ((await page.evaluate(() => history.state?.sheet)) !== 'mo-editor-crop-view')
    problems.push(`${label}: the page has no step of its own in the history`);
  await page.evaluate(() => history.back());
  await view
    .waitFor({ state: 'detached', timeout: 4000 })
    .catch(() => problems.push(`${label}: the browser's back did not leave the crop view`));
  if ((await page.evaluate(() => location.hash)) !== '#new/pages' || !(await page.locator('.ProseMirror').count()))
    problems.push(`${label}: the browser's back left the editor, not only the crop view`);
  await open();
  await chip('4:3').click();
  await page.evaluate(() => history.back());
  await asked()
    .waitFor({ timeout: 4000 })
    .catch(() => problems.push(`${label}: the browser's back with a change did not ask "Keep your changes?"`));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (!(await view.count())) problems.push(`${label}: staying after the browser's back did not keep the crop view`);
  if ((await page.evaluate(() => history.state?.sheet)) !== 'mo-editor-crop-view')
    problems.push(`${label}: staying after the browser's back did not give the page its step back`);
  await back().click();
  await asked().getByRole('button', { name: 'Discard', exact: true }).click();
  await page.waitForTimeout(500);
  if ((await view.count()) || (await page.evaluate(() => history.state?.sheet)) === 'mo-editor-crop-view')
    problems.push(`${label}: Discard after the browser's back left the page open or its step in the history`);
  // The image sheet: an Aspect ratio row with the ratio, no Format chips; it opens the same view and brings the ratio back.
  await select();
  const sheetOpen = () => page.locator('dialog[open], .mo-editor-side-sheet').filter({ hasText: 'Alt text' }).count();
  if (!(await sheetOpen())) await pressTool(page, 'Edit', how);
  await page.waitForTimeout(700);
  const sheet = page.locator('dialog[open], .mo-editor-side-sheet').filter({ hasText: 'Alt text' }).last();
  const rowItem = sheet.getByRole('button', { name: /Aspect ratio/ }).or(sheet.locator('li', { hasText: 'Aspect ratio' }));
  if (!(await rowItem.count())) problems.push(`${label}: the image sheet has no Aspect ratio row`);
  else {
    const text = (await sheet.locator('li', { hasText: 'Aspect ratio' }).first().textContent()) ?? '';
    if (!text.includes('3:2')) problems.push(`${label}: the Aspect ratio row does not say 3:2 (${text})`);
    if (/\bFormat\b/.test((await sheet.textContent()) ?? '')) problems.push(`${label}: the image sheet still says Format`);
    if (await sheet.locator('.mo-editor-crop-view-ratios, [role=radiogroup]').count())
      problems.push(`${label}: the image sheet still has the format chips`);
    await rowItem.first().click();
    await view.waitFor({ timeout: 4000 }).catch(() => problems.push(`${label}: the Aspect ratio row did not open the crop view`));
    await chip('1:1').click();
    await view.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(600);
    const next = (await sheet.locator('li', { hasText: 'Aspect ratio' }).first().textContent()) ?? '';
    if (!next.includes('1:1')) problems.push(`${label}: after Save in the crop view the row does not say 1:1 (${next})`);
    if (width >= 840) {
      // From expanded the sheet is live: the new ratio is in the page already, and closing the sheet asks nothing.
      await sheet.locator('[data-side-sheet-close]').click();
      await page.waitForTimeout(500);
      if (await asked().count()) problems.push(`${label}: closing the live image sheet asked "Keep your changes?"`);
    } else {
      // The sheet is changed now: Cancel asks.
      await cancelOf(sheet).click();
      await asked()
        .waitFor({ timeout: 4000 })
        .catch(() => problems.push(`${label}: closing the image sheet after a new ratio did not ask`));
      await asked().getByRole('button', { name: 'Discard', exact: true }).click();
    }
  }
  await page.close();
}

/** The alt text from expanded (image tools spec 9.1 with the live block side sheet, one Save spec 4.1): there is no short sheet. Insert › Image puts the image in at once and
 * its live side sheet opens beside it with the Alt text field focused: the text typed is on the image at once; the bar's Alt text puts the focus in that field; Change image
 * puts the new image in without a text of its own and opens the live sheet at its Alt text field. */
async function checkAltLive(width, height = 800) {
  const label = `${width}px alt text in the live sheet`;
  if (!has('src/data/files')) return void console.log(`${label}: skipped, the site has no images in its Library, which the demo has.`);
  const page = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const pics = () => page.locator('.ProseMirror .mo-site-picture .mo-site-block-card');
  const described = (n) => pics().nth(n).getAttribute('aria-description');
  const field = () => page.locator('.mo-editor-side-sheet').getByLabel('Alt text');
  const shortSheet = () => page.locator('dialog[open]').filter({ hasText: 'Decorative image' });
  const focusedLabel = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return el?.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent.trim() : '';
    });
  const pickTile = async () => {
    await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
    await page.locator('dialog[open] [data-media-tile]').first().click();
    await field().waitFor({ timeout: 6000 });
    await page.waitForTimeout(600);
  };
  await pressInsert(page, 'click');
  await page
    .locator('dialog[open] button', { hasText: /^Image/ })
    .first()
    .click();
  await pickTile();
  if (await shortSheet().count()) problems.push(`${label}: the short alt text sheet opened from expanded, where the live sheet is`);
  if ((await pics().count()) !== 1) problems.push(`${label}: the image is not in the text at once (${await pics().count()} images)`);
  if ((await focusedLabel()) !== 'Alt text')
    problems.push(`${label}: the new image's live sheet does not have the Alt text field focused (${await focusedLabel()})`);
  await field().fill('A ringed planet');
  await page.waitForTimeout(500);
  if ((await described(0)) !== 'A ringed planet')
    problems.push(`${label}: the text typed is not on the image at once (${await described(0)})`);
  // A tap on the image opens its live sheet with the image's text (B11); the bar has no Alt text tool (B12). A text typed there is on the image at once.
  await pics().first().click();
  await page.waitForTimeout(900);
  if ((await field().inputValue()) !== 'A ringed planet')
    problems.push(`${label}: the live sheet shows "${await field().inputValue()}", not the image's text`);
  await field().fill('Saturn');
  await page.waitForTimeout(500);
  if ((await described(0)) !== 'Saturn') problems.push(`${label}: a text typed after the tap is not on the image (${await described(0)})`);
  await page.close();
}

/** The short alt text sheet (image tools spec 9.1): right after an image is picked (Insert › Image, and Change image in the bar) a sheet asks for its alt text: the
 * picture, `Decorative image` and `Alt text`, with `Skip` and `Save` (the crop view does not open): Save puts the text on the image, Skip and Esc keep it without a text
 * of its own; the image is Original. The bar's Alt text opens the same sheet for an image in the text, with `Cancel` and `Save`: Cancel with a change asks "Keep your
 * changes?", and a decorative image has no text. */
async function checkAltSheet(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px alt text sheet`;
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
  const how = phone ? 'tap' : 'click';
  const sheet = () => page.locator('dialog[open]').filter({ hasText: 'Decorative image' }).last();
  const pics = () => page.locator('.ProseMirror .mo-site-picture .mo-site-block-card');
  const buttons = async () => (await sheet().locator('button').allTextContents()).map((b) => b.trim()).filter(Boolean);
  const pick = async () => {
    await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
    await page.locator('dialog[open] [data-media-tile]').first().click();
    await sheet().waitFor({ timeout: 6000 });
    await page.waitForTimeout(400);
  };
  const insert = async () => {
    await pressInsert(page, 'click');
    await page
      .locator('dialog[open] button', { hasText: /^Image/ })
      .first()
      .click();
    await pick();
  };
  // The images are told apart by their text, not by their place: where a new image goes in follows the caret, which the text puts back after a
  // sheet closes (the browser's focus return) and a click moves, so the n-th image in the text is not always the n-th put in.
  const texts = () => pics().evaluateAll((els) => els.map((e) => e.getAttribute('aria-description') ?? ''));
  const at = async (text) => (await texts()).indexOf(text);
  const asked = () => page.locator('dialog[open]').filter({ hasText: 'Keep your changes?' });

  // Insert › Image: the alt text sheet, not the image's full sheet, and not the crop view.
  await insert();
  const first = await sheet().evaluate((d) => ({
    heading: d.querySelector('[role=heading], h1, h2, h3')?.textContent?.trim(),
    picture: !!d.querySelector('img'),
    crop: !!d.querySelector('[aria-label="Aspect ratio"], li'),
    field: !!d.querySelector('textarea, input[type=text]'),
  }));
  if (first.heading !== 'Alt text') problems.push(`${label}: the sheet after a pick is headed "${first.heading}", not Alt text`);
  if (!first.picture || !first.field) problems.push(`${label}: the alt text sheet has no picture or no field (${JSON.stringify(first)})`);
  if (first.crop) problems.push(`${label}: the alt text sheet has an Aspect ratio row (it is the image's full sheet?)`);
  const names = await buttons();
  if (!names.includes('Skip') || !names.includes('Save') || names.includes('Cancel') || names.includes('Insert'))
    problems.push(`${label}: the sheet after a pick has the buttons ${names.join(', ')}, not Skip and Save`);
  if (await page.locator('.mo-editor-crop-page[open]').count()) problems.push(`${label}: the crop view opened after the image was picked`);
  await sheet().getByLabel('Alt text').fill('A ringed planet');
  await sheet().getByRole('button', { name: 'Save', exact: true }).click();
  await pics().first().waitFor({ timeout: 6000 });
  await page.waitForTimeout(500);
  if ((await texts()).join('|') !== 'A ringed planet')
    problems.push(`${label}: Save did not put the text on the image (${(await texts()).join('|')})`);
  if (await page.locator('.ProseMirror .mo-site-picture .mo-site-picture__crop').count())
    problems.push(`${label}: a new image is not Original`);

  // Skip keeps the image without a text of its own.
  await page.click('.ProseMirror > p');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await insert();
  await sheet().getByRole('button', { name: 'Skip', exact: true }).click();
  await page.waitForTimeout(600);
  if ((await pics().count()) !== 2) problems.push(`${label}: Skip did not keep the image (${await pics().count()} images)`);
  else if ((await texts()).filter(Boolean).join('|') !== 'A ringed planet')
    problems.push(`${label}: Skip gave the image a text of its own (${(await texts()).join('|')})`);
  // Esc is Skip.
  await page.click('.ProseMirror > p');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await insert();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  if ((await pics().count()) !== 3) problems.push(`${label}: Esc on the sheet did not keep the image (${await pics().count()} images)`);

  // A tap on an image in the text opens its sheet (B11), with the Alt text field showing the text the image has; the bar has no Alt text tool any more (B12).
  await pics()
    .nth(await at('A ringed planet'))
    [how]();
  await page.waitForTimeout(900);
  const own = page.locator('dialog[open], .mo-editor-side-sheet').last().getByLabel('Alt text');
  if (!(await own.count())) problems.push(`${label}: a tap on the image did not open its sheet with an Alt text field`);
  else if ((await own.inputValue()) !== 'A ringed planet')
    problems.push(`${label}: the image's sheet shows "${await own.inputValue()}", not the image's text`);
  if (await page.locator('.mo-editor-tools button[aria-label="Alt text"]').count())
    problems.push(`${label}: the bar still has an Alt text tool`);
  await page.close();
}

/** Block settings (#block-settings): from 600 dp a block's details are the standard side sheet beside the list (owner, 15 Nov 2026: dialogs are only for short messages, not for settings), no dialog over the page; on a phone they are the sheet from the bottom. */
async function checkBlockSettingsPane(width) {
  const label = `${width}px block settings`;
  const phone = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#block-settings'));
  const row = page.getByRole('button', { name: /^Buttons/ }).first();
  await row.waitFor({ timeout: 10_000 });
  await row.click();
  await page.waitForTimeout(500);
  const got = await page.evaluate(() => {
    const aside = document.querySelector('aside.mo-sheet__container.mo-is-side:not([hidden])');
    const box = aside?.getBoundingClientRect();
    const first = [...document.querySelectorAll('main button, main [role=button]')]
      .find((b) => /^Buttons/.test(b.textContent.trim()))
      ?.getBoundingClientRect();
    return {
      aside: !!aside,
      dialogs: document.querySelectorAll('dialog[open]').length,
      close: !!aside?.querySelector('[data-side-sheet-close]'),
      clear: !!box && !!first && first.right <= box.left + 1,
    };
  });
  if (phone) {
    if (got.aside || got.dialogs !== 1) problems.push(`${label}: on a phone the details are not the sheet from the bottom`);
  } else {
    if (!got.aside) problems.push(`${label}: the block's details are not a standard side sheet (pane)`);
    if (got.dialogs) problems.push(`${label}: a dialog is open over the page while the details are in the pane`);
    if (!got.close) problems.push(`${label}: the pane has no close button`);
    if (!got.clear) problems.push(`${label}: the list is covered by the pane`);
  }
  await page.close();
}

/** The link of some text, a link added to the list of profiles (Business › Social media) and an item of the main menu: from 600 dp each is the pane beside the page, not a dialog (owner, 15 Nov 2026: dialogs are only for short messages, not for settings), and closing the pane gives the focus back to what opened it; on a phone each is still the sheet from the bottom. */
async function checkLinkAndItemPanes(width) {
  const phone = width < 600;
  const label = `${width}px link and item panes`;
  const shown = (page) =>
    page.evaluate(() => ({
      pane: !!document.querySelector('aside.mo-editor-side-sheet:not([hidden])'),
      dialogs: document.querySelectorAll('dialog[open]').length,
    }));
  const expect = async (page, what) => {
    await page.waitForTimeout(700);
    // The pane and the closed sheet do not both hold the fields: no id twice in the page.
    const twice = await page.evaluate(() => {
      const seen = new Set();
      const twice = [];
      for (const e of document.querySelectorAll('[id]')) {
        if (seen.has(e.id)) twice.push(e.id);
        seen.add(e.id);
      }
      return twice;
    });
    if (twice.length) problems.push(`${label}: ${what} has the same id twice in the page (${twice.slice(0, 3).join(', ')})`);
    const got = await shown(page);
    if (phone) {
      if (got.pane || got.dialogs !== 1)
        problems.push(`${label}: ${what} is not the sheet from the bottom on a phone (${JSON.stringify(got)})`);
    } else {
      if (!got.pane) problems.push(`${label}: ${what} is not the pane beside the page`);
      if (got.dialogs) problems.push(`${label}: ${what} has a dialog open over the page`);
    }
  };
  const closeIt = async (page, what, opener) => {
    if (phone) return void (await page.keyboard.press('Escape'));
    await page.locator('aside.mo-editor-side-sheet [data-side-sheet-close]').last().click();
    await page.waitForTimeout(500);
    if (await page.locator('aside.mo-editor-side-sheet:not([hidden])').count())
      problems.push(`${label}: the pane of ${what} did not close`);
    if (opener && !(await page.evaluate((sel) => document.activeElement?.matches(sel), opener)))
      problems.push(`${label}: after the pane of ${what} closed, the focus did not go back to what opened it`);
  };
  const open = async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    await openEditor(page, site);
    return page;
  };
  // The profiles: Add link.
  let page = await open();
  await page.evaluate(() => (location.hash = '#company/social-media'));
  await page.getByRole('button', { name: 'Add link' }).first().waitFor({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Add link' }).first().click();
  await expect(page, 'Add link');
  await closeIt(page, 'Add link', null);
  await page.close();
  // The main menu: an item.
  page = await open();
  await page.evaluate(() => (location.hash = '#src/data/menu.json'));
  const addItem = page
    .getByRole('button', { name: /^Add/ })
    .filter({ hasNotText: /^Add link/ })
    .first();
  await addItem.waitFor({ timeout: 10_000 });
  await addItem.click();
  await expect(page, "a menu item's fields");
  await page.close();
  // The link of some text (the bar's Link, with the text selected).
  if (!phone) {
    page = await open();
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('Hello world');
    await page.keyboard.press('ControlOrMeta+a');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Link', exact: true }).first().click();
    await expect(page, 'the link of a text');
    await closeIt(page, 'the link of a text', null);
    await page.close();
    // The link of a text while a block's pane is open: it opens on top of that pane with a back arrow, and Back shows the block's pane again.
    page = await open();
    await page.evaluate(() => (location.hash = '#new/pages'));
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('Hello world');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await pressInsert(page, 'click');
    await page.locator('dialog[open] button', { hasText: 'Add a video or calendar.' }).first().click();
    await page.waitForTimeout(700);
    await page.getByText('Hello world').first().dblclick();
    await page.waitForTimeout(400);
    // The bar has less room beside the block's pane: Link is then in the More menu.
    const direct = page.getByRole('button', { name: 'Link', exact: true });
    if (await direct.count()) await direct.first().click();
    else {
      await page.getByRole('button', { name: 'More', exact: true }).first().dispatchEvent('click');
      await page.locator('[role=menu][aria-label="More"] [role^=menuitem]').filter({ hasText: /^Link/ }).first().click();
    }
    await page.waitForTimeout(700);
    const nested = await page.evaluate(() => {
      const shown = [...document.querySelectorAll('aside.mo-editor-side-sheet')].filter((a) => !a.closest('.hidden, .mo-hidden'));
      return {
        shown: shown.length,
        title: shown[0]?.querySelector('.mo-is-side .mo-sheet__headline')?.textContent,
        back: !!shown[0]?.querySelector('[data-side-sheet-back]'),
      };
    });
    if (nested.shown !== 1 || nested.title !== 'Link' || !nested.back)
      problems.push(`${label}: the link over a block's pane is not the one pane shown with a back arrow (${JSON.stringify(nested)})`);
    await page.locator('aside.mo-editor-side-sheet [data-side-sheet-back]').first().click();
    await page.waitForTimeout(600);
    const back = await page.evaluate(() => {
      const shown = [...document.querySelectorAll('aside.mo-editor-side-sheet')].filter((a) => !a.closest('.hidden, .mo-hidden'));
      return { shown: shown.length, title: shown[0]?.querySelector('.mo-is-side .mo-sheet__headline')?.textContent };
    });
    if (back.shown !== 1 || back.title === 'Link')
      problems.push(`${label}: Back does not show the block's pane again (${JSON.stringify(back)})`);
    await page.close();
  }
}

/** A redirect, the name of a new list and an own list's settings (Edit list): from 600 dp each is the pane beside the page, not a dialog (owner, 15 Nov 2026: dialogs are only for short messages, not for settings); on a phone each is still the dialog or the sheet from the bottom. */
async function checkListAndRedirectPanes(width) {
  const phone = width < 600;
  const label = `${width}px list and redirect panes`;
  const expectIt = async (page, what) => {
    await page.waitForTimeout(700);
    // The pane and the closed dialog do not both hold the fields: no id twice in the page.
    const twice = await page.evaluate(() => {
      const seen = new Set();
      const twice = [];
      for (const e of document.querySelectorAll('[id]')) {
        if (seen.has(e.id)) twice.push(e.id);
        seen.add(e.id);
      }
      return twice;
    });
    if (twice.length) problems.push(`${label}: ${what} has the same id twice in the page (${twice.slice(0, 3).join(', ')})`);
    const got = await page.evaluate(() => ({
      pane: !!document.querySelector('aside.mo-editor-side-sheet:not([hidden])'),
      dialogs: document.querySelectorAll('dialog[open]').length,
    }));
    if (phone) {
      if (got.pane || got.dialogs !== 1) problems.push(`${label}: ${what} is not a dialog or a sheet on a phone (${JSON.stringify(got)})`);
    } else {
      if (!got.pane) problems.push(`${label}: ${what} is not the pane beside the page`);
      if (got.dialogs) problems.push(`${label}: ${what} has a dialog open over the page`);
    }
  };
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  // A redirect.
  await page.evaluate(() => (location.hash = '#seo/redirects/all'));
  await page.getByRole('button', { name: 'New redirect' }).first().click({ timeout: 10_000 });
  await expectIt(page, 'a new redirect');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  // A new list: its name, then the list's own settings.
  await page.evaluate(() => (location.hash = '#lists'));
  await page.getByRole('button', { name: 'New list' }).first().click({ timeout: 10_000 });
  await expectIt(page, 'the name of a new list');
  await page.locator('#new-list-name').fill('Team');
  await page.getByRole('button', { name: 'Create', exact: true }).first().click();
  await page.waitForFunction(() => location.hash.startsWith('#list/'), null, { timeout: 10_000 });
  await page.waitForTimeout(700);
  if (await page.locator('aside.mo-editor-side-sheet:not([hidden])').count())
    problems.push(`${label}: the pane of a new list is still open after Create`);
  await page.getByRole('button', { name: 'List menu' }).first().click({ timeout: 10_000 });
  await page.getByRole('menuitem', { name: 'Edit list' }).first().click();
  await expectIt(page, "an own list's settings");
  await page.close();
}

/** A video's Change link (image tools spec, section 8): a tap on the frame selects the video, its bar has Change link first (no slot over the frame), the row keeps Hide and Settings, and Change link opens the video's sheet with the Video link field focused and its text selected; what is pasted replaces the link and Save keeps it. */
async function checkVideoChangeLink(width, height = 800) {
  const phone = width < 600;
  const expanded = width >= 840;
  const label = `${width}px video change link`;
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
  await page.locator('dialog[open] button', { hasText: 'Play a video from YouTube or Vimeo.' }).first().click();
  await page.waitForSelector('.mo-site-block-inline [data-field="title"]');
  await page.keyboard.type('My film');
  await page.waitForTimeout(300);
  const tap = (loc) => (phone ? loc.tap() : loc.click());
  // Away from the block, then a tap on its frame selects it.
  await tap(page.locator('.ProseMirror > p').first());
  await page.waitForTimeout(400);
  if (await page.locator('.mo-editor-tools-context button[aria-label="Change link"]').count())
    problems.push(`${label}: Change link is on the bar while the video is not selected`);
  await tap(page.locator('.mo-editor-inline-video-frame'));
  await page.waitForTimeout(700);
  if (await page.locator('.mo-site-block-inline .mo-editor-inline-list-slot').count())
    problems.push(`${label}: a slot is still drawn over the video frame`);
  const bar = await page.evaluate(() => ({
    tools: [...document.querySelectorAll('.mo-editor-tools-context button')].map(
      (b) => b.getAttribute('aria-label') || b.textContent.trim(),
    ),
    row: [...document.querySelectorAll('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row]')].map((b) =>
      b.getAttribute('aria-label'),
    ),
  }));
  if (bar.tools[0] !== 'Change link') problems.push(`${label}: the bar's first tool is "${bar.tools[0]}", not Change link (${bar.tools})`);
  if (!bar.row.some((n) => /settings|edit/i.test(n ?? ''))) await page.screenshot({ path: join(shots, `video-change-link-${width}.png`) });
  const sheetOpen = () => page.locator('dialog[open], .mo-editor-side-sheet').last();
  if (expanded) {
    // From expanded the tap opened the sheet beside the video already; Change link focuses its field.
    if (!(await page.locator('.mo-editor-side-sheet').count())) problems.push(`${label}: the tap did not open the video's sheet`);
  }
  await page.locator('.mo-editor-tools-context button[aria-label="Change link"]').first().click();
  await page.waitForTimeout(900);
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      label: el?.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent.trim() : null,
      selected: el && 'selectionStart' in el ? el.selectionEnd - el.selectionStart : -1,
      empty: !el?.value,
    };
  });
  if (focused.label !== 'Video link') problems.push(`${label}: Change link left the focus on "${focused.label}", not the Video link field`);
  await page.keyboard.type(url);
  await page.waitForTimeout(400);
  const typed = await page.evaluate(() => document.activeElement?.value);
  if (typed !== url) problems.push(`${label}: the Video link field has "${typed}" after typing`);
  const save = sheetOpen().locator('button', { hasText: /^(Save|Done)$/ });
  if (await save.count()) await save.first().click();
  await page.waitForTimeout(700);
  const kept = await page.evaluate(
    () =>
      document
        .querySelector(
          '.mo-site-block-inline iframe, .mo-site-block-inline [data-video], .mo-site-block-inline a[href*="youtu"], .mo-site-block-inline img',
        )
        ?.outerHTML.slice(0, 300) ?? '',
  );
  if (!kept.includes('dQw4w9WgXcQ')) problems.push(`${label}: the video does not show the new link (${kept})`);
  // The Thumbnail field: the sheet has it, an image chosen there is the frame's still (the same View.tsx draws it, selected or not), and it is a local image.
  const stillSrc = () => page.locator('.mo-site-block-inline .mo-block-video__facade-image').first().getAttribute('src');
  // The sheet is still open (a phone's bottom sheet, a computer's side sheet); if not, Change link opens it.
  if (!(await sheetOpen().getByText('Thumbnail', { exact: true }).count())) {
    await page.locator('.mo-editor-tools-context button[aria-label="Change link"]').first().click();
    await page.waitForTimeout(900);
  }
  const thumb = sheetOpen().getByText('Thumbnail', { exact: true });
  if (!(await thumb.count())) problems.push(`${label}: the video's sheet has no Thumbnail field`);
  // A site with no images in its Library (the starter) has none to choose: the field is checked, the drawing is the demo's.
  else if (!has('src/data/files'))
    console.log(`${label}: the thumbnail is not chosen, the site has no images in its Library, which the demo has.`);
  else {
    await sheetOpen().locator('button', { hasText: 'Select image' }).first().click();
    await page.waitForSelector('dialog[open] [data-media-tile]', { timeout: 8000 });
    await page.locator('dialog[open] [data-media-tile]').first().click();
    const use = page.locator('dialog[open]').getByRole('button', { name: /^(Use|Choose|Select)/ });
    if (await use.count()) await use.first().click();
    await page.waitForTimeout(900);
    const save2 = sheetOpen().locator('button', { hasText: /^(Save|Done)$/ });
    if (await save2.count()) await save2.first().click();
    await page.waitForTimeout(900);
    const src = await stillSrc();
    if (!src || hostOf(src) === 'i.ytimg.com' || src.includes('/_video/'))
      problems.push(`${label}: the frame draws "${src}", not the chosen thumbnail`);
    await page.screenshot({ path: join(shots, `video-thumbnail-${width}.png`) });
  }
  await page.close();
}

/** The theme's carousel in M3's "uncontained multi-aspect ratio" layout (theme/ui/Carousel.tsx, layout multi-aspect-ratio) on "Parts" › "UI components" (ContainmentParts.tsx), light and dark: every item as high as the
 * row and as wide as its aspect ratio (16:9, 9:16, 1:1 and 3:4, M3's four) with 28 dp corners, 8 dp between items, 8 dp above and below, the first one at the leading padding (the page's 16 dp gutter on a phone) and no
 * trailing padding, free scrolling (no snap), no page indicator, named for a screen reader, and a visible focus ring on a focused item that the row does not clip. */
async function checkCarouselMultiAspect(width, height, scheme) {
  const label = `${width}px carousel multi-aspect ratio ${scheme}`;
  const compact = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: compact, isMobile: compact, colorScheme: scheme });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#developer/parts/ui'));
  const root = page.locator('[data-carousel-layout="multi-aspect-ratio"]');
  await root
    .first()
    .waitFor({ timeout: 30_000 })
    .catch(() => problems.push(`${label}: the sample is not on the page`));
  if (!(await root.count())) return page.close();
  await root.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const m = await root.first().evaluate((el) => {
    const row = el.querySelector('[data-carousel-items]');
    const rs = getComputedStyle(row);
    const rr = row.getBoundingClientRect();
    const items = [...el.querySelectorAll('[data-carousel-item]')];
    const boxes = items.map((i) => i.getBoundingClientRect());
    const mask = items[0].querySelector('[data-carousel-mask]');
    return {
      sizes: boxes.map((b) => ({ w: b.width, h: b.height })),
      gaps: boxes.slice(1).map((b, i) => b.left - boxes[i].right),
      first: boxes[0].left - rr.left,
      padTop: parseFloat(rs.paddingTop),
      padBottom: parseFloat(rs.paddingBottom),
      padEnd: parseFloat(rs.paddingInlineEnd),
      snap: rs.scrollSnapType,
      radius: parseFloat(getComputedStyle(mask).borderTopLeftRadius),
      indicators: el.querySelectorAll('[data-carousel-indicator], [data-carousel-dot]').length,
      named: !!el.getAttribute('aria-label') && items.every((i) => !!i.getAttribute('aria-label')),
      rowName: !!row.getAttribute('aria-label'),
      scrolls: row.scrollWidth > row.clientWidth,
    };
  });
  const ratios = [16 / 9, 9 / 16, 1, 3 / 4];
  m.sizes.slice(0, 4).forEach((s, i) => {
    if (Math.abs(s.w / s.h - ratios[i]) > 0.02)
      problems.push(`${label}: item ${i + 1} is ${s.w.toFixed(1)}x${s.h.toFixed(1)}, not ${ratios[i].toFixed(3)} wide for its height`);
  });
  if (new Set(m.sizes.map((s) => Math.round(s.h))).size !== 1) problems.push(`${label}: the items are not all as high as the row`);
  if (isMaterialTheme() && m.gaps.some((g) => Math.abs(g - 8) > 0.5))
    problems.push(`${label}: the gap between items is ${m.gaps.map((g) => g.toFixed(1)).join(', ')}, not 8 (M3: 8dp between items)`);
  if (isMaterialTheme() && (m.padTop !== 8 || m.padBottom !== 8))
    problems.push(`${label}: padding above and below is ${m.padTop} and ${m.padBottom}, not 8 (M3: 8dp)`);
  if (isMaterialTheme() && m.padEnd !== 0) problems.push(`${label}: the row has ${m.padEnd}px trailing padding (M3: only leading padding)`);
  if (isMaterialTheme() && m.radius !== 28) problems.push(`${label}: the item's corners are ${m.radius}px, not 28`);
  if (isMaterialTheme() && m.snap !== 'none')
    problems.push(`${label}: the row snaps (${m.snap}); M3 recommends free scrolling for uncontained layouts`);
  if (isMaterialTheme() && m.indicators) problems.push(`${label}: it has a page indicator, which M3's carousel does not`);
  if (!m.named || !m.rowName) problems.push(`${label}: the carousel, its scroller or an item has no name for a screen reader`);
  if (!m.scrolls) problems.push(`${label}: the row does not scroll sideways (its items are cut off or all fit)`);
  // The leading edge: the first item stands at the row's own start plus its padding (the page's gutter on a phone, the text's edge from medium).
  if (isMaterialTheme() && compact && Math.abs(m.first - 16) > 1)
    problems.push(`${label}: the first item starts ${m.first}px in from the row's edge, not 16 (M3: leading padding 16dp)`);
  // Free scrolling: the row moves by any amount, it does not jump to an item.
  const scrolled = await root.first().evaluate(async (el) => {
    const row = el.querySelector('[data-carousel-items]');
    row.scrollTo({ left: 37, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
    return row.scrollLeft;
  });
  if (Math.abs(scrolled - 37) > 1) problems.push(`${label}: the row scrolled to 37 and rests at ${scrolled}: it snaps`);
  // Keyboard: an item is a tab stop and its focus ring is drawn inside what the row shows.
  await root.first().evaluate((el) => (el.querySelector('[data-carousel-items]').scrollLeft = 0));
  await root.first().locator('[data-carousel-item]').first().focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const ring = await root.first().evaluate((el) => {
    const item = el.querySelector('[data-carousel-item]');
    const row = el.querySelector('[data-carousel-items]').getBoundingClientRect();
    const s = getComputedStyle(item);
    const r = item.getBoundingClientRect();
    const grow = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset);
    return {
      focused: document.activeElement === item,
      shown: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0,
      clipped: r.top - grow < row.top - 0.5 || r.bottom + grow > row.bottom + 0.5,
    };
  });
  if (!ring.focused) problems.push(`${label}: an item does not take the focus by Tab`);
  else if (!ring.shown) problems.push(`${label}: a focused item has no focus ring`);
  else if (ring.clipped) problems.push(`${label}: the focus ring of an item is clipped by the row`);
  await page.screenshot({ path: join(shots, `carousel-multi-aspect-${width}-${scheme}.png`) });
  await page.close();
}

/** The theme's full-screen dialog (theme/ui/Dialog.tsx, kind full-screen; DG1) on "Parts" › "UI components" (ContainmentParts.tsx). Below 600 dp it fills the screen with 0 dp
 * corners and a 56 dp header holding the close icon, the headline and Save (the first control has the focus; Cancel is not shown); from 600 dp it is the basic dialog in the middle
 * (28 dp corners, at most 28rem wide) with Cancel and Save at its end, Save last, and no close icon. Escape closes it at both. */
async function checkFullScreenDialog(width, height) {
  const label = `${width}px full-screen dialog`;
  const compact = width < 600;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: compact, isMobile: compact });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#developer/parts/ui'));
  const opener = page.getByRole('button', { name: 'Open the full-screen dialog' });
  await opener.waitFor({ timeout: 30_000 }).catch(() => problems.push(`${label}: the sample is not on the page`));
  if (!(await opener.count())) return page.close();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const dialog = page.locator('dialog[open][aria-labelledby="mo-parts-full-screen-dialog"]');
  await dialog.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the dialog does not open`));
  if (!(await dialog.count())) return page.close();
  await page.waitForTimeout(500);
  const look = await dialog.evaluate((el) => {
    const box = (e) => {
      if (!e) return null;
      const r = e.getBoundingClientRect();
      const shown = getComputedStyle(e).display !== 'none' && r.width > 0;
      return { shown, left: r.left, right: r.right, top: r.top, width: r.width, height: r.height };
    };
    const root = el.querySelector('.mo-dialog');
    const names = (sel) => [...el.querySelectorAll(sel)].map((b) => b.getAttribute('aria-label') ?? b.textContent.trim());
    const focus = document.activeElement;
    return {
      kind: root.classList.contains('mo-is-full-screen'),
      dialog: box(el),
      header: box(el.querySelector('.mo-dialog__header')),
      close: box(el.querySelector('.mo-dialog__close')),
      dismiss: box(el.querySelector('.mo-dialog__dismiss button')),
      save: box(el.querySelector('.mo-dialog__action button')),
      headline: box(el.querySelector('.mo-dialog__headline')),
      radius: parseFloat(getComputedStyle(root).borderTopLeftRadius),
      buttons: names('button'),
      focusIn: el.contains(focus) && focus !== el,
      focusName: focus?.getAttribute?.('aria-label') ?? focus?.textContent?.trim(),
      vw: innerWidth,
      vh: innerHeight,
      sideways: document.documentElement.scrollWidth > innerWidth,
    };
  });
  if (!look.kind) problems.push(`${label}: the dialog is not the full-screen kind`);
  if (look.sideways) problems.push(`${label}: the page scrolls sideways with the dialog open`);
  if (!look.focusIn) problems.push(`${label}: the focus is not on a control of the dialog (M3: the first interactive element)`);
  if (compact) {
    const d = look.dialog;
    if (Math.abs(d.width - look.vw) > 1 || Math.abs(d.height - look.vh) > 1)
      problems.push(`${label}: on a phone it fills the screen: ${Math.round(d.width)}x${Math.round(d.height)} of ${look.vw}x${look.vh}`);
    if (look.radius !== 0) problems.push(`${label}: the container's corners are ${look.radius}px, not 0`);
    if (Math.round(look.header.height) !== 56) problems.push(`${label}: the header is ${look.header.height}px high, not 56`);
    if (!look.close.shown || !look.save.shown) problems.push(`${label}: the close icon and Save must show in the header`);
    if (look.dismiss.shown) problems.push(`${label}: Cancel is shown below 600 dp (the close icon is the dismissal)`);
    if (look.focusName !== 'Close') problems.push(`${label}: the focus is on "${look.focusName}", not the close icon (the first control)`);
    if (look.headline.left < look.close.right - 1) problems.push(`${label}: the headline is not after the close icon`);
    if (look.save.right > look.vw - 11) problems.push(`${label}: Save stands too near the screen's edge`);
  } else {
    const d = look.dialog;
    if (d.width > 28 * 16 + 1 || Math.abs((d.left + d.right) / 2 - look.vw / 2) > 2)
      problems.push(`${label}: from 600 dp it is the basic dialog in the middle, at most 28rem: ${Math.round(d.width)} wide`);
    if (isMaterialTheme() && look.radius !== 28) problems.push(`${label}: the basic dialog's corners are ${look.radius}px, not 28`);
    if (look.close.shown) problems.push(`${label}: the close icon is shown from 600 dp (a basic dialog has none)`);
    if (!look.dismiss.shown || !look.save.shown) problems.push(`${label}: Cancel and Save must show at the end of the basic dialog`);
    else if (look.dismiss.left > look.save.left || look.save.right > d.right)
      problems.push(`${label}: Save is the last action, inside the dialog`);
  }
  await page.screenshot({ path: join(shots, `full-screen-dialog-${width}.png`) });
  await page.keyboard.press('Escape');
  // Wait for the exit, not a fixed time: the spring takes ~336 ms on the standard motion scheme and ~562 ms on the expressive one.
  await page
    .locator('dialog[open][aria-labelledby="mo-parts-full-screen-dialog"]')
    .waitFor({ state: 'detached', timeout: 3000 })
    .catch(() => problems.push(`${label}: Escape does not close it`));
  await page.close();
}

export function register(unit) {
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    unit(`checkFullScreenDialog ${width}`, () => checkFullScreenDialog(width, height));
  unit('checkLiveSideSheet 1280', () => checkLiveSideSheet(1280));
  unit('checkPhoneSheet 375', () => checkPhoneSheet(375));
  unit('checkComputerRestore 1280', () => checkComputerRestore(1280));
  // From medium the block's sheet is the live side sheet and asks nothing (checkLiveSideSheet), so only the subpage on a phone asks.
  for (const width of [375]) unit(`checkCloseChangedSheet ${width}`, () => checkCloseChangedSheet(width));
  unit('checkLiveSideSheet 700', () => checkLiveSideSheet(700));
  for (const width of [700, 1280]) unit(`checkSheetFocusOnOpen ${width}`, () => checkSheetFocusOnOpen(width));
  for (const width of [375, 1280]) unit(`checkImageTools ${width}`, () => checkImageTools(width));
  for (const width of [375, 1280]) unit(`checkCropView ${width}`, () => checkCropView(width));
  for (const width of [375, 1280]) unit(`checkVideoChangeLink ${width}`, () => checkVideoChangeLink(width));
  for (const width of [375, 1280]) unit(`checkAltSheet ${width}`, () => (width >= 840 ? checkAltLive(width) : checkAltSheet(width)));
  for (const width of [390, 1280])
    for (const scheme of ['light', 'dark'])
      unit(`checkCarouselMultiAspect ${width} ${scheme}`, () => checkCarouselMultiAspect(width, width < 600 ? 800 : 900, scheme));
  unit('checkSheetKeyboard 375', () => checkSheetKeyboard(375));
  unit('checkSheetKeyboard 375 Custom', () => checkSheetKeyboard(375, 740, 300, true));
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    unit(`checkCustomColors ${width}`, () => checkCustomColors(width, height));
  unit('checkBottomSheetBar 375', () => checkBottomSheetBar(375, 740));
  unit('checkBottomSheetBar 375 keyboard', () => checkBottomSheetBar(375, 740, 300, true));
  unit('checkBottomSheetBar 1280', () => checkBottomSheetBar(1280, 900));
  for (const width of [375, 768, 1280]) unit(`checkListAndRedirectPanes ${width}`, () => checkListAndRedirectPanes(width));
  for (const width of [375, 768, 1280]) unit(`checkLinkAndItemPanes ${width}`, () => checkLinkAndItemPanes(width));
  for (const width of [375, 768, 1280]) unit(`checkBlockSettingsPane ${width}`, () => checkBlockSettingsPane(width));
}

// The host of an address, '' for one that is only a path.
function hostOf(address) {
  try {
    return new URL(address, 'http://localhost').hostname;
  } catch {
    return '';
  }
}
