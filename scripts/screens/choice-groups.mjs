import { openEditor } from '../built-site.mjs';
import { block, browser, da, daBlocks, daText, has, problems, site } from './support/context.mjs';
import { pressTool, rowButton } from './support/shared.mjs';

/** Every visible choice group (.mo-choice-group) in `root`, measured in the page: its form, its choices' boxes, whether two overlap
 * or a label is cut off, what the buttons need against the room they get, the targets (buttons) and row heights (list), its
 * name, and its samples. Run with locator.evaluate. */
function choiceGroupsIn(root) {
  return [...root.querySelectorAll('.mo-choice-group')]
    .filter((g) => g.getClientRects().length > 0)
    .map((g) => {
      const form = g.dataset.form;
      const visible =
        form === 'buttons' ? g.querySelector(':scope > .mo-choice-group__buttons') : g.querySelector(':scope > .mo-choice-group__list');
      const items = form === 'buttons' ? [...visible.children] : [...visible.querySelectorAll('.mo-list__item-container')];
      const boxes = items.map((el) => el.getBoundingClientRect());
      const overlap = boxes.some((a, i) =>
        boxes.some((b, j) => j > i && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5),
      );
      const labels =
        form === 'buttons'
          ? items.map((b) => b.querySelector('.mo-choice-group__label'))
          : items.map((r) => r.querySelector('.mo-list__item-headline'));
      const clipped = labels
        .filter((l) => l && !l.classList.contains('mo-choice-group__label-hidden') && l.scrollWidth > l.clientWidth + 0.5)
        .map((l) => l.textContent);
      const measured = [...g.querySelectorAll(':scope > .mo-choice-group__measure > *')].map((b) => b.getBoundingClientRect().width);
      const row = g.querySelector(':scope > .mo-choice-group__measure');
      const room = row ? row.getBoundingClientRect().width : 0;
      const needed = measured.length
        ? Math.max(...measured) * measured.length + (measured.length - 1) * (parseFloat(getComputedStyle(row).columnGap) || 0)
        : 0;
      const targets =
        form === 'buttons'
          ? items.map((b) => Math.max(b.getBoundingClientRect().height, parseFloat(getComputedStyle(b, '::after').height) || 0))
          : [];
      const heights = form === 'list' ? boxes.map((b) => b.height) : [];
      const name =
        form === 'buttons'
          ? (visible.getAttribute('role') === 'group' && visible.getAttribute('aria-label')) || ''
          : (visible.querySelector(':scope > legend')?.textContent ?? '');
      // The list's alignment: the radio's circle 16 px from the group's left edge (M3 Lists, Specs: "List item leading space 16dp"), the label on the circle's
      // middle line, a sample's right edge (a text button's text) 16 px from the group's right edge ("trailing space 16dp").
      const gr = g.getBoundingClientRect();
      const lis = form === 'list' ? [...visible.querySelectorAll('li')] : [];
      const circleOff = lis.map((li) => li.querySelector('input[type="radio"]').getBoundingClientRect().left - gr.left);
      const centreOff = lis.map((li) => {
        const c = li.querySelector('input[type="radio"]').getBoundingClientRect();
        const t = li.querySelector('.mo-list__item-headline').getBoundingClientRect();
        return (c.top + c.bottom) / 2 - (t.top + t.bottom) / 2;
      });
      const sampleOff = lis.flatMap((li) => {
        const slot = li.querySelector('.mo-choice-group__sample');
        const b =
          slot &&
          [...slot.querySelectorAll('.mo-button')].find(
            (x) => x.getClientRects().length && !x.closest('[aria-hidden="true"][style*="hidden"]'),
          );
        if (!b) return [];
        const pad = b.classList.contains('mo-is-text') ? parseFloat(getComputedStyle(b).paddingRight) : 0;
        return [b.getBoundingClientRect().right - pad - gr.right];
      });
      return {
        form,
        circleOff,
        centreOff,
        sampleOff,
        forced: g.hasAttribute('data-forced'),
        narrow: !!g.closest('[data-choice-narrow]'),
        n: items.length,
        samples: g.querySelectorAll(':scope > .mo-choice-group__list .mo-choice-group__sample').length,
        overlap,
        clipped,
        room,
        needed,
        targets,
        heights,
        name,
      };
    });
}

/** The rules every choice group keeps (choiceGroupsIn): no overlap, no label cut off, buttons only when they fit, 48 px targets
 * and rows, a name. */
function checkChoiceGroups(label, groups) {
  groups.forEach((g, i) => {
    const at = `${label} group ${i + 1} "${g.name}" (${g.form})`;
    if (g.overlap) problems.push(`${at}: two choices overlap`);
    if (g.clipped.length) problems.push(`${at}: cut off: ${g.clipped.join(', ')}`);
    if (!g.name.trim()) problems.push(`${at}: the group has no name`);
    if (g.form === 'buttons' && !g.forced && g.needed > g.room + 0.5)
      problems.push(`${at}: buttons though they need ${g.needed} px of ${g.room}`);
    if (g.targets.some((t) => t < 47.5)) problems.push(`${at}: a button's target is below 48 px (${g.targets.join(', ')})`);
    if (g.heights.some((h) => h < 47.5)) problems.push(`${at}: a row is below 48 px (${g.heights.join(', ')})`);
    if (g.circleOff.some((x) => Math.abs(x - 16) > 1))
      problems.push(`${at}: a radio's circle is not 16 px from the group's left edge (${g.circleOff.map((x) => x.toFixed(1))} px)`);
    if (g.centreOff.some((x) => Math.abs(x) > 1))
      problems.push(`${at}: a label is not on its radio's middle line (${g.centreOff.map((x) => x.toFixed(1))} px)`);
    if (g.sampleOff.some((x) => Math.abs(x + 16) > 1))
      problems.push(`${at}: a sample does not end 16 px from the group's right edge (${g.sampleOff.map((x) => x.toFixed(1))} px)`);
  });
}

/** A page with every block whose settings have a choice of a few (the choice group's places, spec section 4): Banner, Blog posts,
 * Testimonials, Cards (Filled, so Color shows), Image grid, Segmented list and Buttons. */
const CHOICE_PAGE = [
  '---\ntitle: "Choices"\ndescription: "d"\n---\n\n# Choices\n\nIntro.\n',
  block('posts', {}),
  block('testimonials', { show: 'all', heading: 'Kind words' }),
  block('cards', { design: 'filled', items: [{ title: 'One', text: 'First' }] }),
  block('imagegrid', {}),
  block('segmented', { items: [{ title: 'Row', text: 'Text' }] }),
  block('buttons', { items: [{ label: 'Book a time', to: 'page', kind: 'filled' }] }),
].join('\n\n');

/** The choice groups of the editor's fields (fields.tsx, `segments: true`) in their places, on a phone (the 271 px modal sheet) and a
 * computer (the 312 px side sheet), in English and Danish: each block's Block settings, and a button's Settings. Every group keeps the
 * rules of checkChoiceGroups. The owner's case by name: Buttons › Settings › Style is the list with four samples (Filled, Tonal, Outlined, Text) at both widths, and
 * in the list the arrow keys choose. */
async function checkChoiceGroupFields(width, locale) {
  const label = `${width}px ${locale} choice group fields`;
  const touch = width < 600;
  const say =
    locale === 'da-DK'
      ? { block: daText.blockSettings, settings: daBlocks.buttons.settingsAction, style: daBlocks.buttons.kind }
      : { block: 'Block settings', settings: 'Settings', style: 'Variant' };
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, locale });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const path = 'src/content/pages/zz-choices.md';
  await openEditor(page, site, { [path]: CHOICE_PAGE });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror .mo-site-block-card', { timeout: 30_000 });
  const sheet = () =>
    page
      .locator('dialog[open], .mo-editor-side-sheet')
      .filter({ has: page.locator('.mo-choice-group, .mo-button-group.mo-is-connected') })
      .last();
  // A sheet is closed by its Cancel (nothing was changed), else by Escape (the side panel on a computer).
  const close = async () => {
    const cancel = page.locator(
      'dialog[open] .mo-is-side .mo-sheet__actions button, dialog[open] [aria-label="Close"], dialog[open] [aria-label="Luk"]',
    );
    const named = cancel.filter({ hasText: /^(Cancel|Annuller)$/ });
    // On a phone the block's fields are a subpage: its back arrow is the first button of its app bar.
    const subpage = page.locator('dialog[open].mo-editor-block-page header button').first();
    if (await subpage.count()) await subpage.click();
    else if (await named.count()) await named.last().click();
    else if (await cancel.count()) await cancel.last().click();
    else await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
  };
  const cards = page.locator('.ProseMirror > .mo-site-block > .mo-site-block-card');
  const count = await cards.count();
  const seen = [];
  const skipped = [];
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const name = await card.evaluate((el) => (el.querySelector(':scope > .mo-site-block-card-button') ?? el).getAttribute('aria-label'));
    // At the top of the screen, clear of the save bar over the bottom (a phone).
    await card.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(200);
    await (touch ? card.tap({ timeout: 5000 }) : card.click({ timeout: 5000 })).catch(() =>
      problems.push(`${label}: the ${name} block could not be selected`),
    );
    // The row opens by its height on the spring: wait for it to stand still.
    await page.waitForTimeout(800);
    // A tap on a block that is not typed in place opens its sheet at once on a phone (the sheet is a moment in coming); otherwise Block settings in the active block's
    // row, or in the row of the block pointed at.
    // A slow runner draws a block's sheet late (its fields come after it): wait for the choice group in it, then try the tap once more.
    const opened = () =>
      sheet()
        .waitFor({ timeout: 6000 })
        .then(
          () => true,
          () => false,
        );
    let isOpen = await opened();
    if (!isOpen && touch && !(await rowButton(page, say.block).count())) {
      await card.tap({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(800);
      isOpen = await opened();
    }
    if (!(await sheet().count())) {
      const active = rowButton(page, say.block);
      let button = (await active.count()) ? active : page.locator(`.mo-site-block-row [data-row][aria-label="${say.block}"]:visible`);
      if (!(await button.count()) && !touch && (await card.locator('[data-field]').count())) {
        // A block whose items the hover row would cover (Cards) shows no hover row: a click in its first field makes the block the active one, which has its row.
        await card.locator('[data-field]').first().click();
        await page.waitForTimeout(800);
        button = rowButton(page, say.block);
      }
      if (!(await button.count()) && touch) {
        // A block drawn empty here (no testimonials picked on the page) is too low to tap: the keyboard opens it, as for a screen reader.
        await card.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(800);
        button = page.locator(`.mo-site-block-row [data-row][aria-label="${say.block}"]:visible`);
      }
      // Buttons has no block-level choice: its Style is in each button's Settings (below).
      if (!(await button.count()) && !(await sheet().count())) {
        if (/^(Buttons|Knapper)$/.test(name)) continue;
        // The Image grid of a site with no images in Files has no settings to open on a phone (the demo has images): left out, and said so.
        if (i === 3 && !has('src/data/files')) {
          skipped.push(name);
          continue;
        }
        problems.push(`${label}: ${name} has no ${say.block}`);
        if (process.env.CHOICE_DEBUG) await page.screenshot({ path: `${process.env.CHOICE_DEBUG}-${width}-${i}.png` });
        continue;
      }
      if (await button.count())
        if (
          !(await button
            .first()
            .click({ timeout: 5000 })
            .then(
              () => true,
              () => false,
            ))
        ) {
          problems.push(`${label}: ${say.block} of ${name} could not be pressed`);
          continue;
        }
    }
    const here = sheet();
    if (
      !(await here.waitFor({ timeout: 4000 }).then(
        () => true,
        () => false,
      ))
    ) {
      await close();
      continue;
    }
    await page.waitForTimeout(300);
    const groups = await here.evaluate(choiceGroupsIn);
    seen.push(...groups.map((g) => g.name));
    // Blog posts 1, Testimonials 1, Cards 4, Image grid 3, List - Expand 2 (the Segmented list is a List - Expand): the fixture's blocks in their order.
    // List and List - Expand have two, Design and Leading (what leads the rows, one choice for the block as the media of Cards); every other block has one.
    const expected = [1, 1, 4, 3, 2][i];
    if (groups.length !== expected)
      problems.push(
        `${label} ${name}: ${groups.length} choice groups in its settings, not ${expected} (${groups.map((g) => g.name).join(', ')})`,
      );
    checkChoiceGroups(`${label} ${name}`, groups);
    if (process.env.SHOTS_FULL) await here.screenshot({ path: `${process.env.SHOTS_FULL}-fields-${width}-${locale}-${i}.png` });
    await close();
  }
  // Only a block drawn empty is left out (the Image grid with no images): the other four are opened, and their groups counted above.
  if (skipped.length > 1 || seen.length < 6)
    problems.push(
      `${label}: ${seen.length} choice groups seen in the blocks' settings (${seen.join(', ')}); not opened: ${skipped.join(', ') || 'none'}`,
    );
  // The owner's case: a button's Style, the list with a sample of each style.
  await page.locator('.ProseMirror [data-field="label"]').last().click();
  await page.waitForTimeout(300);
  await pressTool(page, say.settings).catch(() => problems.push(`${label}: the button has no ${say.settings}`));
  const style = page.getByRole('group', { name: say.style, exact: true }).last();
  if (
    !(await style.waitFor({ timeout: 4000 }).then(
      () => true,
      () => false,
    ))
  )
    problems.push(`${label}: the button's settings have no ${say.style}`);
  else {
    const g = (await sheet().evaluate(choiceGroupsIn)).find((x) => x.name === say.style);
    if (!g || g.form !== 'list' || g.samples !== 4)
      problems.push(
        `${label}: Buttons › ${say.settings} › ${say.style} is not the list with four samples (${g?.form}, ${g?.samples} samples)`,
      );
    checkChoiceGroups(`${label} button style`, g ? [g] : []);
    await style.locator('input[type="radio"]:checked').focus();
    await page.keyboard.press('ArrowDown');
    const chosen = await style.evaluate((l) => [...l.querySelectorAll('input[type="radio"]')].findIndex((r) => r.checked));
    if (chosen !== 1) problems.push(`${label}: ArrowDown in ${say.style} did not choose the second style (${chosen})`);
    if (!(await page.locator('.mo-editor-inline-list-row-active.mo-button.mo-is-tonal, .ProseMirror .mo-button.mo-is-tonal').count()))
      problems.push(`${label}: choosing Tonal by the arrow key did not change the button`);
    if (process.env.SHOTS_FULL) await sheet().screenshot({ path: `${process.env.SHOTS_FULL}-button-style-${width}-${locale}.png` });
  }
  await page.close();
}

/** The samples of Buttons › Settings › Style (choiceSamples.tsx) are never cut off: a short label is shown whole on every row (it fits the sample's
 * width) and a long one is replaced by the editor's "Button", on a phone and a computer, in English and Danish. */
async function checkButtonStyleSamples(width, locale) {
  const touch = width < 600;
  const word = locale === 'da-DK' ? daBlocks.buttons.sample : 'Button';
  const say = locale === 'da-DK' ? { settings: daBlocks.buttons.settingsAction } : { settings: 'Settings' };
  const cases = [
    { text: 'Book', shown: 'Book' },
    { text: 'Book an appointment with us today', shown: word },
  ];
  for (const { text, shown } of cases) {
    const label = `${width}px ${locale} button style samples (${text.length} characters)`;
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, locale });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    const path = 'src/content/pages/zz-samples.md';
    const md = `---\ntitle: "Samples"\ndescription: "d"\n---\n\n# Samples\n\nIntro.\n\n${block('buttons', { items: [{ label: text, to: 'page', kind: 'filled' }] })}\n`;
    await openEditor(page, site, { [path]: md });
    await page.goto(`${site}/editor/#${path}`);
    await page.waitForSelector('.ProseMirror [data-field="label"]', { timeout: 30_000 });
    await page.locator('.ProseMirror [data-field="label"]').last().click();
    await page.waitForTimeout(500);
    await pressTool(page, say.settings).catch(() => problems.push(`${label}: the button has no ${say.settings}`));
    const here = page
      .locator('dialog[open], .mo-editor-side-sheet')
      .filter({ has: page.locator('.mo-choice-group') })
      .last();
    await here.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the settings did not open`));
    await page.waitForTimeout(600);
    const samples = await here
      .evaluate((root) =>
        [...root.querySelectorAll('.mo-choice-group__list .mo-choice-group__sample')]
          .filter((slot) => slot.getClientRects().length)
          .map((slot) => {
            const button = slot.querySelector('.mo-button:not([aria-hidden] .mo-button)') ?? slot.querySelector('.mo-button');
            const visible = [...slot.querySelectorAll('.mo-button')]
              .filter((b) => !b.closest('[aria-hidden="true"][style*="hidden"]'))
              .at(0);
            const b = (visible ?? button).getBoundingClientRect();
            const r = slot.getBoundingClientRect();
            // A text button's side padding (it has no surface) may stand over the slot's end: its text is what must be inside.
            const pad = (visible ?? button).classList.contains('mo-is-text')
              ? parseFloat(getComputedStyle(visible ?? button).paddingRight)
              : 0;
            return {
              text: (visible ?? button).textContent.trim(),
              inside: b.left >= r.left - 0.5 && b.right - pad <= r.right + 0.5,
              whole: slot.scrollWidth - pad <= slot.clientWidth + 0.5,
            };
          }),
      )
      .catch(() => []);
    if (samples.length !== 4) problems.push(`${label}: ${samples.length} samples in the list, not 4`);
    for (const x of samples) {
      if (x.text !== shown) problems.push(`${label}: a sample says "${x.text}", not "${shown}"`);
      if (!x.inside || !x.whole) problems.push(`${label}: the sample "${x.text}" is cut off`);
    }
    if (process.env.SHOTS_FULL) await here.screenshot({ path: `${process.env.SHOTS_FULL}-samples-${width}-${locale}-${text.length}.png` });
    await page.close();
  }
}

/** The theme's choice group (theme/ui/ChoiceGroup.tsx, spec docs/superpowers/specs/2026-11-14-choice-group-design.md) on "Parts" ›
 * "UI components" (ActionParts.tsx), on a phone and a computer, in English and Danish: in every group no two choices overlap and
 * no label is cut off; it is the buttons only when every button fits; a list row is at least 48 px high and a button's target at
 * least 48 px; the group is named (role=group with its name, or the fieldset's legend). The group forced to the list has a
 * sample on each row, the one in the 320 px frame is the list, and in the list the arrow keys choose, in the buttons they move
 * and Enter chooses. */
async function checkChoiceGroupParts(width, locale) {
  const label = `${width}px ${locale} choice group parts`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, locale });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#developer/parts/ui'));
  const part = page.locator('[data-part="ChoiceGroup"]');
  await part.waitFor({ timeout: 30_000 }).catch(() => problems.push(`${label}: the ChoiceGroup part is not on the page`));
  if (!(await part.count())) return page.close();
  await part.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const groups = await part.evaluate(choiceGroupsIn);
  if (groups.length !== 3) problems.push(`${label}: ${groups.length} choice groups, not 3`);
  checkChoiceGroups(label, groups);
  const [auto, forced, narrow] = groups;
  if (width >= 1280 && auto?.form !== 'buttons') problems.push(`${label}: three short choices are not side by side at ${width} px`);
  if (forced && (forced.form !== 'list' || forced.samples !== forced.n))
    problems.push(`${label}: the forced list has ${forced.samples} samples for ${forced.n} rows`);
  if (narrow && (!narrow.narrow || narrow.form !== 'list'))
    problems.push(`${label}: five styles in 320 px are not the list (${narrow.form})`);
  // The list: the arrow keys choose the next one.
  const list = part.locator('.mo-choice-group[data-forced] .mo-choice-group__list');
  await list.locator('input[type="radio"]:checked').focus();
  await page.keyboard.press('ArrowDown');
  const chosen = await list.evaluate((l) => [...l.querySelectorAll('input[type="radio"]')].findIndex((r) => r.checked));
  if (chosen !== 1) problems.push(`${label}: ArrowDown in the list did not choose the second choice (${chosen})`);
  // The buttons (the first group, where it is the buttons): Tab lands on the chosen one, an arrow moves, Enter chooses.
  if (auto?.form === 'buttons') {
    const buttons = part.locator('.mo-choice-group').first().locator(':scope > .mo-choice-group__buttons > button');
    if ((await buttons.evaluateAll((bs) => bs.filter((b) => b.tabIndex === 0).length)) !== 1)
      problems.push(`${label}: not exactly one button is in the Tab order`);
    await buttons.first().focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const pressed = await buttons.evaluateAll((bs) => bs.findIndex((b) => b.getAttribute('aria-pressed') === 'true'));
    if (pressed !== 1) problems.push(`${label}: ArrowRight then Enter in the buttons did not choose the second (${pressed})`);
  }
  if (process.env.SHOTS_FULL) await part.screenshot({ path: `${process.env.SHOTS_FULL}-choice-group-${width}-${locale}.png` });
  await page.close();
}

/** The connected button group (Material 3 Expressive, Button groups, Specs: the connected group's between-space 2 dp, inner corners small 8 dp, the selected
 * button's corners 50 % (fully round), the outer corners full): on the theme's parts page, the connected group of text buttons in the `required` selection mode (one toggled on, keys by the group). Measured:
 * the gap, the corners, the height of a small button (40 dp), the target, and the keys (ArrowRight and ArrowLeft move focus, Home and End go to the ends). */
async function checkConnectedButtons(width) {
  const label = `${width}px connected buttons`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#developer/parts/ui'));
  const part = page.locator('[data-part="ButtonGroup"]');
  await part.waitFor({ timeout: 30_000 }).catch(() => problems.push(`${label}: the ButtonGroup part is not on the page`));
  if (!(await part.count())) return page.close();
  const group = part.locator('.mo-button-group.mo-is-connected[data-selection="required"]:has(> .mo-button)').first();
  await group.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const got = await group.evaluate((g) => {
    const px = (v) => parseFloat(v) || 0;
    const buttons = [...g.children].filter((b) => b.matches('.mo-button'));
    const boxes = buttons.map((b) => b.getBoundingClientRect());
    const style = buttons.map((b) => getComputedStyle(b));
    const on = buttons.findIndex((b) => b.getAttribute('aria-pressed') === 'true');
    return {
      n: buttons.length,
      on,
      gaps: boxes.slice(1).map((b, i) => Math.round((b.left - boxes[i].right) * 100) / 100),
      heights: boxes.map((b) => Math.round(b.height * 100) / 100),
      targets: buttons.map((b, i) => Math.max(boxes[i].height, px(getComputedStyle(b, '::after').height))),
      rtl: getComputedStyle(g).direction === 'rtl',
      // The corners facing the neighbours of an unselected button, the outer corners of the first, and the selected button's.
      inner: buttons.map((_, i) => [
        px(style[i].borderStartStartRadius),
        px(style[i].borderEndStartRadius),
        px(style[i].borderStartEndRadius),
        px(style[i].borderEndEndRadius),
      ]),
      tab: buttons.map((b) => b.tabIndex),
      names: g.getAttribute('aria-label') ?? '',
      role: g.getAttribute('role'),
    };
  });
  if (got.n < 2) problems.push(`${label}: the connected group has ${got.n} buttons`);
  for (const gap of got.gaps)
    if (Math.abs(gap - 2) > 0.5) problems.push(`${label}: the gap between buttons is ${gap} px, not 2 (M3: between-space 2 dp)`);
  for (const h of got.heights)
    if (Math.abs(h - got.heights[0]) > 0.5) problems.push(`${label}: the buttons are not equally high (${got.heights.join(', ')})`);
  for (const t of got.targets) if (t < (touch ? 48 : 44) - 0.5) problems.push(`${label}: a target is ${t} px, below ${touch ? 48 : 44}`);
  got.inner.forEach((c, i) => {
    const selected = i === got.on;
    const first = i === 0;
    const last = i === got.n - 1;
    const full = got.heights[i] / 2;
    if (selected) {
      if (c.some((r) => r < full - 0.5))
        problems.push(`${label}: the selected button's corners are ${c.join('/')} px, not fully round (${full})`);
      return;
    }
    // [start-start, end-start, start-end, end-end]: the sides that meet a neighbour are the inner corner, 8 dp, the others are full.
    const wantStart = first ? full : 8;
    const wantEnd = last ? full : 8;
    const [ss, es, se, ee] = c;
    if (Math.abs(ss - wantStart) > 0.5 || Math.abs(es - wantStart) > 0.5 || Math.abs(se - wantEnd) > 0.5 || Math.abs(ee - wantEnd) > 0.5)
      problems.push(`${label}: button ${i + 1} has corners ${c.join('/')} px, want start ${wantStart} and end ${wantEnd}`);
  });
  if (got.tab.filter((t) => t === 0).length > got.n) problems.push(`${label}: more buttons in the Tab order than buttons`);
  if (got.role !== 'group') problems.push(`${label}: the group has role ${got.role}, not group`);
  // Keys: roving focus among the group's buttons.
  const buttons = group.locator(':scope > .mo-button');
  await buttons.first().focus();
  const key = got.rtl ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.press(key);
  const second = await buttons.evaluateAll((bs) => bs.indexOf(document.activeElement));
  if (second !== 1) problems.push(`${label}: ${key} from the first button put focus on button ${second + 1}, not 2`);
  await page.keyboard.press('End');
  const end = await buttons.evaluateAll((bs) => bs.indexOf(document.activeElement));
  if (end !== got.n - 1) problems.push(`${label}: End put focus on button ${end + 1}, not ${got.n}`);
  await page.keyboard.press('Home');
  const home = await buttons.evaluateAll((bs) => bs.indexOf(document.activeElement));
  if (home !== 0) problems.push(`${label}: Home put focus on button ${home + 1}, not 1`);
  await page.close();
}

/** The Buttons block offers four styles (Filled, Tonal, Outlined, Text; no Elevated), and a button saved as `elevated` is drawn, and shown in its
 * Variant choice, as Tonal: on a phone and a computer, the picker has exactly those four options in that order and the saved page does not crash. */
async function checkButtonStyleOptions(width) {
  const label = `${width}px button style options`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const path = 'src/content/pages/zz-elevated.md';
  const md = `---\ntitle: "Elevated"\ndescription: "d"\n---\n\n# Elevated\n\nIntro.\n\n${block('buttons', { items: [{ label: 'Old one', to: 'page', kind: 'elevated' }] })}\n`;
  await openEditor(page, site, { [path]: md });
  await page.goto(`${site}/editor/#${path}`);
  await page.waitForSelector('.ProseMirror .mo-site-block-card, .ProseMirror .mo-editor-inline-buttons', { timeout: 30_000 });
  await page.locator('.ProseMirror [data-field="label"]').last().click();
  await page.waitForTimeout(300);
  if (!(await page.locator('.ProseMirror .mo-button.mo-is-tonal').count()))
    problems.push(`${label}: a saved elevated button is not drawn as tonal in the editor`);
  if (await page.locator('.ProseMirror .mo-button.mo-is-elevated').count())
    problems.push(`${label}: a saved elevated button is still drawn elevated`);
  await pressTool(page, 'Settings').catch(() => problems.push(`${label}: the button has no Settings`));
  const style = page.getByRole('group', { name: 'Variant', exact: true }).last();
  if (
    !(await style.waitFor({ timeout: 4000 }).then(
      () => true,
      () => false,
    ))
  )
    problems.push(`${label}: the button's settings have no Variant`);
  else {
    const names = (await style.locator('.mo-list__item-headline').allTextContents()).map((n) => n.trim());
    if (names.join() !== 'Filled,Tonal,Outlined,Text')
      problems.push(`${label}: the styles are "${names}", not "Filled,Tonal,Outlined,Text"`);
    const checked = await style.evaluate((l) => [...l.querySelectorAll('input[type="radio"]')].findIndex((r) => r.checked));
    if (checked !== 1) problems.push(`${label}: a saved elevated button does not show Tonal as chosen (${checked})`);
  }
  await page.close();
}

export function register(unit) {
  for (const width of [375, 1280]) unit(`connected buttons ${width}`, () => checkConnectedButtons(width));
  for (const width of [375, 1280]) unit(`choice-group button style options ${width}`, () => checkButtonStyleOptions(width));
  for (const width of [375, 1280])
    for (const locale of ['en-US', 'da-DK']) unit(`choice-group parts ${width} ${locale}`, () => checkChoiceGroupParts(width, locale));
  for (const width of [375, 1280])
    for (const locale of ['en-US', 'da-DK']) unit(`choice-group fields ${width} ${locale}`, () => checkChoiceGroupFields(width, locale));
  for (const width of [375, 1280])
    for (const locale of ['en-US', 'da-DK'])
      unit(`choice-group button samples ${width} ${locale}`, () => checkButtonStyleSamples(width, locale));
}
