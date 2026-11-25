import { join } from 'node:path';
import { clickPreview, openEditor, virtualFile } from '../built-site.mjs';
import { installedApps } from '../../lib/apps.mjs';
import { appCheckPage } from '../../lib/appCheckPage.mjs';
import { CORE_PAGE_FILE, coreBlocksPage } from '../core-blocks-page.mjs';
import { FIXTURE_PAGE, ROOT, browser, problems, server, shots, site } from './support/context.mjs';
import {
  checkSavedLabel,
  hintContrasts,
  inlineBlocks,
  inlineSingles,
  insertBlock,
  newLineUnder,
  liveLists,
  onTestPage,
  openStyleMenu,
  pressInsert,
  saveOrClose,
} from './support/shared.mjs';

/** The active block's action row (src/blockRow.ts): it shows only while a block is active (a real touch tap on a block's rows activates it), its buttons are real 44 x 44 dp
 * buttons (Move up, Move down, Hide or Show, and the handle at its end), Move down is disabled with its reason on the last block and Move up on the first, Hide turns into
 * Show and the row stays, the bar has none of these, the row does not lie under the bar (also with the on-screen keyboard open: a short window), and under reduced motion it is
 * there at once, with no animation. */
/** How far the selection mark's centre is from the point on the outline's corner curve (the 45 degree point of the card's corner, its 1.5px line centred): {dx, dy} in px. */
const markOffset = (page) =>
  page.evaluate(() => {
    const card = document.querySelector('.mo-site-block-card.mo-site-block-inline');
    const mark = card.parentElement.querySelector(':scope > .mo-site-block-mark');
    const c = card.getBoundingClientRect();
    const m = mark.getBoundingClientRect();
    const r = parseFloat(getComputedStyle(card).borderTopLeftRadius);
    const border = parseFloat(getComputedStyle(card).borderTopWidth);
    const rc = r - border / 2;
    const into = r - rc * Math.SQRT1_2;
    return { dx: m.left + m.width / 2 - (c.left + into), dy: m.top + m.height / 2 - (c.top + into) };
  });

async function checkBlockRow(width, options = {}) {
  const phone = width < 600;
  const { height = 800, reduced = false } = options;
  const label = `${width}px block row${reduced ? ' (reduced motion)' : ''}${height < 500 ? ' (keyboard open)' : ''}`;
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: phone,
    isMobile: phone,
    locale: 'en-US',
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await insertBlock(page, 'Show text and images in a list.', 1, 0);
  await page.keyboard.type('Design');
  const row = page.locator('.mo-site-block-row');
  if (reduced) await page.waitForTimeout(100);
  else await page.waitForTimeout(800);
  if (await page.locator('.mo-site-block-row-hover').count())
    problems.push(`${label}: the active block also shows the pointed block's row`);
  const names = () =>
    page
      .locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  if (!(await row.count())) {
    problems.push(`${label}: no action row for the active block`);
    return void (await page.close());
  }
  if (reduced && (await row.evaluate((el) => el.getAnimations().length)) > 0)
    problems.push(`${label}: the row is animated under reduced motion`);
  const shape = await page.locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row]').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return {
        label: e.getAttribute('aria-label'),
        w: r.width,
        h: r.height,
        off: e.hasAttribute('aria-disabled'),
        why: e.getAttribute('aria-description'),
      };
    }),
  );
  for (const name of ['Move up', 'Move down', 'Hide'])
    if (!shape.some((b) => b.label === name)) problems.push(`${label}: the row has no "${name}" (${shape.map((b) => b.label)})`);
  if (shape.some((b) => b.w < 43.4 || b.h < 43.4))
    problems.push(`${label}: a button of the row is under 44 x 44 dp (${JSON.stringify(shape)})`);
  const last = shape.find((b) => b.label === 'Move down');
  if (!last?.off || !last.why)
    problems.push(`${label}: Move down is not disabled with a reason on the last block (${JSON.stringify(last)})`);
  if (shape.find((b) => b.label === 'Move up')?.off) problems.push(`${label}: Move up is disabled with a block above`);
  const handle = await page.locator('.mo-site-block-has-row > .mo-site-block-handle').boundingBox();
  const rowBox = await row.boundingBox();
  if (!handle || !rowBox || handle.y < rowBox.y - 1 || handle.y + handle.height > rowBox.y + rowBox.height + 1)
    problems.push(`${label}: the handle is not inside the row (${JSON.stringify({ handle, rowBox })})`);
  const bar = await page.locator('.mo-editor-tools').boundingBox();
  if (rowBox && bar && rowBox.y + rowBox.height > bar.y && rowBox.y < bar.y + bar.height)
    problems.push(`${label}: the row lies under the text bar (${JSON.stringify({ rowBox, bar })})`);
  // The row is inside the outline, above the block's first item.
  const firstItem = await page.locator('.mo-site-block-card .mo-editor-inline-list-row').first().boundingBox();
  if (rowBox && firstItem && rowBox.y + rowBox.height > firstItem.y + 1) problems.push(`${label}: the row overlaps the block's content`);
  const barNames = await page.locator('.mo-editor-tools button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  for (const name of ['Move up', 'Move down', 'Hide', 'Show'])
    if (barNames.includes(name)) problems.push(`${label}: "${name}" is on the bar as well as in the row`);
  // The row is inside the block's dotted outline (its card), which has a Card's corner radius and padding (the theme's tokens, read from a probe Card).
  const frame = await page.evaluate(() => {
    const card = document.querySelector('.mo-site-block-card.mo-site-block-inline');
    const r = card.getBoundingClientRect();
    const rowEl = card.querySelector(':scope > .mo-site-block-row');
    const probe = document.createElement('div');
    probe.className = 'mo-card mo-is-outlined';
    card.parentElement.append(probe);
    const want = getComputedStyle(probe);
    const have = getComputedStyle(card);
    const out = {
      inside: !!rowEl,
      row: rowEl && rowEl.getBoundingClientRect().toJSON(),
      card: r.toJSON(),
      border: parseFloat(have.borderTopWidth),
      radius: [have.borderTopLeftRadius, want.borderTopLeftRadius],
      padding: [have.paddingTop, want.paddingTop, have.paddingLeft, want.paddingLeft],
    };
    probe.remove();
    return out;
  });
  if (!frame.inside) problems.push(`${label}: the row is not inside the block's dotted outline`);
  else if (
    frame.row.top < frame.card.top + frame.border - 0.5 ||
    frame.row.bottom > frame.card.bottom ||
    frame.row.left < frame.card.left + frame.border - 0.5 ||
    frame.row.right > frame.card.right - frame.border + 0.5
  )
    problems.push(`${label}: the row sits outside the dotted outline (${JSON.stringify({ row: frame.row, card: frame.card })})`);
  if (frame.radius[0] !== frame.radius[1] || frame.radius[0] === '0px')
    problems.push(`${label}: the outline's corner radius is ${frame.radius[0]}, not the Card's ${frame.radius[1]}`);
  // Above and below the padding is the Card's; at the sides it is the frame's outset less its line (6.5 px), so the block's content stands on the text column's edge.
  if (frame.padding[0] !== frame.padding[1] || frame.padding[2] !== '6.5px')
    problems.push(
      `${label}: the outline's padding is ${frame.padding[0]} (the Card's ${frame.padding[1]}) above and ${frame.padding[2]} at the sides (6.5px: the frame's outset less its line)`,
    );
  // The row hugs the top of the outline: its space above is the Card's small gap, well under the Card's padding.
  if (frame.row && frame.row.top - frame.card.top - frame.border > 12)
    problems.push(`${label}: the row is ${frame.row.top - frame.card.top - frame.border} px below the outline's top edge, too far`);
  // The selection mark is centred on the outline's corner curve (active).
  const markActive = await markOffset(page);
  if (Math.abs(markActive.dx) > 0.75 || Math.abs(markActive.dy) > 0.75)
    problems.push(`${label}: the selection mark is off the corner curve while active (${JSON.stringify(markActive)})`);
  // The row's buttons are the theme's icon buttons: no class of their own, and the hover is a probe standard icon button's.
  const classes = await page
    .locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row]')
    .evaluateAll((els) => els.map((e) => [...e.classList]));
  for (const list of classes)
    if (list.some((c) => !/^mo-icon-button(__|$)|^mo-is-/.test(c)))
      problems.push(`${label}: a row button has a class of its own (${list.join(' ')}); it must be the theme's icon button`);
  if (classes.some((list) => !list.includes('mo-icon-button') || !list.includes('mo-is-standard')))
    problems.push(`${label}: a row button is not the theme's standard icon button (${JSON.stringify(classes)})`);
  const hoverOf = async (locator) => {
    await locator.hover();
    await page.waitForTimeout(400);
    return locator.evaluate((e) => {
      const c = getComputedStyle(e);
      return { background: c.backgroundColor, radius: c.borderTopLeftRadius, w: e.getBoundingClientRect().width };
    });
  };
  const probeIcon = page.locator('[data-probe="icon"]');
  await page.evaluate(() => {
    const probe = document.createElement('button');
    probe.type = 'button';
    probe.dataset.probe = 'icon';
    probe.className = 'mo-icon-button mo-is-standard';
    probe.innerHTML = document.querySelector('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row="up"]')?.innerHTML ?? '';
    document.querySelector('.mo-site-block-row:not(.mo-site-block-row-hover) .mo-site-block-row-inner').prepend(probe);
  });
  const wantHover = await hoverOf(probeIcon);
  await page.evaluate(() => document.querySelector('[data-probe="icon"]').remove());
  const upHover = await hoverOf(page.locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row="up"]'));
  if (!phone && (upHover.background !== wantHover.background || upHover.radius !== wantHover.radius))
    problems.push(`${label}: a row button's hover is ${JSON.stringify(upHover)}, not the theme icon button's ${JSON.stringify(wantHover)}`);
  // A phone has no hover (the theme's state layer is for a pointer that hovers): the hover is compared on a computer.
  if (!phone && wantHover.background === 'rgba(0, 0, 0, 0)') problems.push(`${label}: the theme icon button shows no state layer on hover`);
  // `Add list row`: the theme's text button, and its hover container is whole inside the outline.
  const add = page.locator('.mo-editor-inline-list-add').first();
  if (await add.count()) {
    const addHover = await hoverOf(add);
    const classes2 = await add.evaluate((e) => [...e.classList]);
    if (!classes2.includes('mo-button') || !classes2.includes('mo-is-text'))
      problems.push(`${label}: Add list row is not the theme's text button (${classes2})`);
    const wantText = page.locator('[data-probe="text"]');
    await page.evaluate(() => {
      const probe = document.createElement('button');
      probe.dataset.probe = 'text';
      probe.className = 'mo-button mo-is-text';
      probe.textContent = 'x';
      document.querySelector('.mo-site-block-card.mo-site-block-inline').append(probe);
    });
    await wantText.hover();
    await page.waitForTimeout(400);
    const textWant = await wantText.evaluate((e) => getComputedStyle(e).backgroundColor);
    await wantText.evaluate((e) => e.remove());
    if (!phone && (addHover.background !== textWant || textWant === 'rgba(0, 0, 0, 0)'))
      problems.push(`${label}: Add list row's hover is ${addHover.background}, not the theme text button's ${textWant}`);
    const box = await add.boundingBox();
    const outline = await page.locator('.mo-site-block-card.mo-site-block-inline').boundingBox();
    const inner = frame.border;
    if (
      box.x < outline.x + inner - 0.5 ||
      box.y < outline.y + inner - 0.5 ||
      box.x + box.width > outline.x + outline.width - inner + 0.5 ||
      box.y + box.height > outline.y + outline.height - inner + 0.5
    )
      problems.push(`${label}: Add list row's hover container is cut by the outline (${JSON.stringify({ box, outline })})`);
  }
  await page.mouse.move(0, 0);
  // Dragged, the block is lifted as one box: the outline with the row and the handle inside it.
  {
    const handleBox = await page.locator('.mo-site-block-has-row > .mo-site-block-handle').boundingBox();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 30, { steps: 5 });
    await page.waitForTimeout(300);
    const lifted = await page.evaluate(() => {
      const dom = document.querySelector('.mo-site-block-dragging');
      if (!dom) return null;
      const card = dom.querySelector(':scope > .mo-site-block-card');
      const box = dom.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const r = card.querySelector(':scope > .mo-site-block-row')?.getBoundingClientRect();
      return {
        shadowOn: getComputedStyle(card).boxShadow !== 'none',
        radius: getComputedStyle(card).borderTopLeftRadius,
        box: box.toJSON(),
        card: c.toJSON(),
        row: r?.toJSON(),
      };
    });
    const markDrag = await markOffset(page);
    await page.mouse.up();
    await page.waitForTimeout(300);
    if (Math.abs(markDrag.dx) > 0.75 || Math.abs(markDrag.dy) > 0.75)
      problems.push(`${label}: the selection mark is off the corner curve while dragged (${JSON.stringify(markDrag)})`);
    if (!lifted) problems.push(`${label}: dragging the handle did not lift the block`);
    else {
      if (!lifted.shadowOn) problems.push(`${label}: the lifted block's outline has no shadow`);
      if (!lifted.row || lifted.row.top < lifted.card.top || lifted.row.bottom > lifted.card.bottom)
        problems.push(`${label}: while dragged the row is outside the outline (${JSON.stringify(lifted)})`);
      // The block's box and the outline are the same box (no offset between the lifted box and the dotted line).
      const near = (a, b) => Math.abs(a - b) <= 1;
      if (!(near(lifted.box.top, lifted.card.top) && near(lifted.box.bottom, lifted.card.bottom)))
        problems.push(`${label}: while dragged the outline is offset from the block's box (${JSON.stringify(lifted)})`);
    }
  }
  // Hide turns into Show and the row stays.
  await page.locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row][aria-label="Hide"]')[phone ? 'tap' : 'click']();
  await page.waitForTimeout(500);
  if (!(await names()).includes('Show')) problems.push(`${label}: after Hide the row does not say Show (${await names()})`);
  await page.locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row][aria-label="Show"]')[phone ? 'tap' : 'click']();
  await page.waitForTimeout(500);
  // The row's buttons are real buttons that Tab reaches.
  if (await page.locator('.mo-site-block-row:not(.mo-site-block-row-hover) [data-row][tabindex="-1"]').count())
    problems.push(`${label}: a button of the row is not reachable with Tab`);
  // The cursor back in the text: the row closes.
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(reduced ? 200 : 900);
  if (await page.locator('.mo-site-block-row').count()) problems.push(`${label}: the row stays after the block is left`);
  // A real touch tap on the block's rows brings it back (a computer: a click).
  if (phone) await page.locator('.mo-editor-inline-list-row').first().tap();
  else await page.locator('.mo-editor-inline-list-row').first().click();
  await page.waitForTimeout(reduced ? 200 : 900);
  if (!(await page.locator('.mo-site-block-row').count()))
    problems.push(`${label}: a ${phone ? 'tap' : 'click'} on the block did not bring its row back`);
  // The row opens and closes without the block's own content moving: the page moves instead (the row grows upward). Sampled every frame.
  const contentTop = () =>
    page.evaluate(() => document.querySelector('.mo-site-block-card .mo-site-block-preview').getBoundingClientRect().top);
  const sample = async (act) => {
    const start = await contentTop();
    await page.evaluate(() => {
      window.__tops = [];
      const one = () => {
        window.__tops.push(document.querySelector('.mo-site-block-card .mo-site-block-preview')?.getBoundingClientRect().top ?? 0);
        // After the frame's other callbacks (the row's own scroll hold runs in one), where the frame is painted.
        window.__raf = requestAnimationFrame(() => setTimeout(one, 0));
      };
      one();
    });
    await act();
    await page.waitForTimeout(reduced ? 300 : 1000);
    const tops = await page.evaluate(() => (cancelAnimationFrame(window.__raf), window.__tops));
    return { start, drift: Math.max(...tops.map((t) => Math.abs(t - start))), end: Math.abs(tops.at(-1) - start) };
  };
  const closed = await sample(() => page.click('.ProseMirror > p'));
  // With the keyboard open (a short window) the cursor moving into the text scrolls the page by itself: the block's stay is measured in the taller windows.
  const still = height >= 500;
  if (still && (closed.drift > 2 || closed.end > 1))
    problems.push(`${label}: closing the row moves the block's content (${JSON.stringify(closed)})`);
  if (await page.locator('.mo-site-block-row').count()) problems.push(`${label}: the row stays after the cursor went back to the text`);
  // Pointing at a block shows its row over its top, taking no space (a computer only).
  if (!phone) {
    // (A block narrower than 400 px shows no row on pointing: it would cover the block's first item.)
    const flow = () =>
      page.evaluate(() => ({
        top: document.querySelector('.mo-site-block-card .mo-site-block-preview').getBoundingClientRect().top,
        height: document.documentElement.scrollHeight,
        y: scrollY,
      }));
    const calm = await flow();
    await page.locator('.mo-site-block-card').first().hover();
    await page.waitForTimeout(400);
    const hovered = await page.evaluate(() => {
      const row = document.querySelector('.mo-site-block-row-hover');
      const card = document.querySelector('.mo-site-block-card.mo-site-block-inline');
      if (!row) return null;
      const r = row.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      return {
        position: getComputedStyle(row).position,
        inside: r.top >= c.top && r.bottom <= c.bottom && r.left >= c.left && r.right <= c.right,
        names: [...row.querySelectorAll('[data-row]')].map((b) => b.getAttribute('aria-label')),
        classes: [...row.querySelectorAll('[data-row]')].map((b) => [...b.classList].join(' ')),
        handle: !!document.querySelector('.mo-site-block-has-hover > .mo-site-block-handle'),
      };
    });
    if (!hovered) problems.push(`${label}: pointing at a block shows no action row`);
    else {
      if (hovered.position !== 'absolute') problems.push(`${label}: the pointed block's row takes space (${hovered.position})`);
      if (!hovered.inside) problems.push(`${label}: the pointed block's row is not inside the dotted outline`);
      for (const name of ['Move up', 'Move down', 'Hide'])
        if (!hovered.names.includes(name)) problems.push(`${label}: the pointed block's row has no "${name}" (${hovered.names})`);
      if (hovered.classes.some((c) => c !== 'mo-icon-button mo-is-standard'))
        problems.push(`${label}: the pointed block's buttons are not the theme icon button (${hovered.classes})`);
      if (!hovered.handle) problems.push(`${label}: the pointed block shows no drag handle`);
    }
    const markHover = await markOffset(page);
    if (Math.abs(markHover.dx) > 0.75 || Math.abs(markHover.dy) > 0.75)
      problems.push(`${label}: the selection mark is off the corner curve while pointed at (${JSON.stringify(markHover)})`);
    const hoverRow = await page.evaluate(() => {
      const row = document.querySelector('.mo-site-block-row-hover').getBoundingClientRect();
      const card = document.querySelector('.mo-site-block-card.mo-site-block-inline').getBoundingClientRect();
      return row.top - card.top;
    });
    if (hoverRow > 14) problems.push(`${label}: the pointed block's row is ${hoverRow} px below the outline's top edge, too far`);
    const moved = await flow();
    if (Math.abs(moved.top - calm.top) > 0.5 || moved.height !== calm.height || moved.y !== calm.y)
      problems.push(`${label}: pointing at a block moves the page (${JSON.stringify({ calm, moved })})`);
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
    if (await page.locator('.mo-site-block-row-hover').count())
      problems.push(`${label}: the pointed block's row stays after the mouse left`);
  }
  const opened = await sample(() =>
    phone ? page.locator('.mo-editor-inline-list-row').first().tap() : page.locator('.mo-editor-inline-list-row').first().click(),
  );
  if (still && (opened.drift > 2 || opened.end > 1))
    problems.push(`${label}: opening the row moves the block's content (${JSON.stringify(opened)})`);
  if (!(await page.locator('.mo-site-block-row:not(.mo-site-block-row-hover)').count()))
    problems.push(`${label}: the row did not open on the block`);
  await page.close();
}

/** A page of three blocks, one active, one pointed at (a computer), the rest plain: a block that is neither active nor pointed at shows no action row, no handle and no selection ring, with a mouse or a touch; the row, handle and ring show on the active block and on the one pointed at, and
 * leave with it (the pointer leaving, a drag ending, another block becoming active); while blocks are being selected the rings show on all blocks. */
async function checkBlockVisibility(width) {
  const phone = width < 600;
  const label = `${width}px block row visibility`;
  const page = await browser.newPage({ viewport: { width, height: 1100 }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) {
    // Each new block lands above the ones before it; go on once it is the active one (insertBlock).
    await insertBlock(page, 'Show text and images in a list.', i + 1, 0);
    await newLineUnder(page, 'Hello');
  }
  const blocks = page.locator('.ProseMirror .mo-site-block');
  if ((await blocks.count()) < 3) {
    problems.push(`${label}: fewer than 3 blocks in the page`);
    return void (await page.close());
  }
  const read = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.ProseMirror .mo-site-block')].map((b) => {
        const mark = b.querySelector(':scope > .mo-site-block-mark');
        const handle = b.querySelector(':scope > .mo-site-block-handle');
        return {
          row: b.querySelectorAll('.mo-site-block-row:not(.mo-site-block-row-hover)').length,
          hover: [...b.querySelectorAll('.mo-site-block-row-hover')].filter((el) => el.getClientRects().length).length,
          mark: mark ? Number(getComputedStyle(mark).opacity) : -1,
          handle: handle ? Number(getComputedStyle(handle).opacity) : -1,
          handleHits: handle ? getComputedStyle(handle).pointerEvents : '-',
        };
      }),
    );
  const plain = (state, name) => {
    if (state.row || state.hover) problems.push(`${label}: ${name} is not active or pointed at but shows a row (${JSON.stringify(state)})`);
    if (state.mark !== 0) problems.push(`${label}: ${name} is not active or pointed at but shows the selection ring (${state.mark})`);
    if (state.handle !== 0 || state.handleHits !== 'none')
      problems.push(`${label}: ${name} is not active or pointed at but shows its handle (${state.handle}, ${state.handleHits})`);
  };
  const shown = (state, name, hovering) => {
    if (hovering ? !state.hover : !state.row) problems.push(`${label}: ${name} shows no row (${JSON.stringify(state)})`);
    if (state.mark !== 1) problems.push(`${label}: ${name} shows no selection ring (${state.mark})`);
    // The handle is on the active block only: on a block a mouse points at it would cover the block's first item (the row's buttons are at the right).
    if (hovering ? state.handle !== 0 || state.handleHits !== 'none' : state.handle !== 1)
      problems.push(`${label}: ${name} ${hovering ? 'shows its handle while only pointed at' : 'shows no handle'} (${state.handle})`);
  };

  // Block 3 was typed in last and left: all three plain, the mouse away.
  await page.click('.ProseMirror > p');
  await page.mouse.move(2, 2);
  await page.waitForTimeout(1000);
  let now = await read();
  now.forEach((state, i) => plain(state, `block ${i + 1} (none active)`));
  // Block 1 active.
  const tapOrClick = async (loc, position) => (phone ? loc.tap({ position }) : loc.click({ position }));
  await tapOrClick(blocks.nth(0).locator('.mo-editor-inline-list-row [data-field="title"]').first(), { x: 8, y: 8 });
  await page.waitForTimeout(1000);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);
  now = await read();
  shown(now[0], 'the active block 1', false);
  plain(now[1], 'block 2 (next to the active block 1)');
  plain(now[2], 'block 3');
  if (!phone) {
    // Block 2 pointed at.
    await blocks.nth(1).hover({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(500);
    now = await read();
    shown(now[0], 'the active block 1 (block 2 pointed at)', false);
    shown(now[1], 'the pointed block 2', true);
    plain(now[2], 'block 3 (block 2 pointed at)');
    // The pointer leaves: nothing stays on block 2.
    await page.mouse.move(2, 2);
    await page.waitForTimeout(500);
    now = await read();
    plain(now[1], 'block 2 (the pointer left)');
    // Pointed at block 3 and then away along the edge.
    await blocks.nth(2).hover({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(400);
    await page.mouse.move(2, 2);
    await page.waitForTimeout(500);
    plain((await read())[2], 'block 3 (the pointer left)');
  }
  // Another block becomes active: block 1 shows nothing any more.
  // (A tap on another block first closes the active block's row; the next one goes into the block, as before this change.)
  await tapOrClick(blocks.nth(2).locator('.mo-editor-inline-list-row [data-field="title"]').first(), { x: 8, y: 8 });
  await page.waitForTimeout(1100);
  if (!(await read())[2].row) {
    await tapOrClick(blocks.nth(2).locator('.mo-editor-inline-list-row [data-field="title"]').first(), { x: 8, y: 8 });
    await page.waitForTimeout(1100);
  }
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);
  now = await read();
  plain(now[0], 'block 1 (block 3 became active)');
  shown(now[2], 'the active block 3', false);
  // A drag ends: the block stays active, the others show nothing, and nothing stays where the pointer was.
  const handle = await blocks.nth(2).locator(':scope > .mo-site-block-handle').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 - 20, { steps: 4 });
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(1100);
  now = await read();
  const active = now.filter((state) => state.row).length;
  if (active !== 1) problems.push(`${label}: ${active} blocks show a row after a drag ended, not 1 (${JSON.stringify(now)})`);
  now.forEach((state, i) => state.row || plain(state, `block ${i + 1} (after a drag ended)`));
  // Blocks being selected: the rings show on all blocks (touch-selection mode, as its spec says), and no row.
  if (!phone) {
    await page.click('.ProseMirror > p');
    await page.waitForTimeout(1000);
    await blocks.nth(0).hover({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(400);
    await blocks.nth(0).locator(':scope > .mo-site-block-mark').click();
    await page.waitForTimeout(500);
    now = await read();
    now.forEach((state, i) => {
      if (state.mark !== 1) problems.push(`${label}: block ${i + 1} shows no ring while blocks are being selected (${state.mark})`);
      if (state.row || state.hover) problems.push(`${label}: block ${i + 1} shows a row while blocks are being selected`);
    });
    await page.keyboard.press('Escape');
    await page.mouse.move(2, 2);
    await page.waitForTimeout(500);
    now = await read();
    now.forEach((state, i) => plain(state, `block ${i + 1} (selection left)`));
  }
  await page.close();
}

/** A narrow window with a mouse (a computer at 420 px): pointing at a block shows no row over it (it would cover its first item), and a click on the first item's field goes into it. */
async function checkBlockRowNarrow() {
  const label = 'narrow block row';
  const page = await browser.newPage({ viewport: { width: 420, height: 800 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await insertBlock(page, 'Show text and images in a list.', 1, 0);
  await page.click('.ProseMirror > p');
  await page.waitForTimeout(900);
  await page.locator('.mo-site-block-card').first().hover();
  await page.waitForTimeout(400);
  const width = await page
    .locator('.mo-site-block-card')
    .first()
    .evaluate((e) => e.clientWidth);
  if (width >= 400) problems.push(`${label}: the block is ${width} px wide, not narrow (under 400)`);
  if (await page.locator('.mo-site-block-row-hover').count())
    problems.push(`${label}: a narrow block pointed at shows a row over its first item`);
  await page.locator('.mo-editor-inline-list-row [data-field="title"]').first().click();
  await page.waitForTimeout(600);
  if (!(await page.locator('.mo-editor-inline-list-row-active').count()))
    problems.push(`${label}: a click on the first item's field did not go into it`);
  await page.close();
}

/** Insert block is always on the bar and never in the ⋮ (320, 375 and 1280 px, in text, with a block active and idle): a 44 x 44 dp button with the add-block icon (widgets with a plus), right before the ⋮ (or last), after Undo and Redo with no divider; it opens the block picker. */
async function checkInsertBlock(width, height = 800) {
  const phone = width < 600;
  const label = `${width}px Insert block`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  const read = () =>
    page.evaluate(() => {
      const bar = document.querySelector('.mo-editor-tools');
      const rect = (el) => el && el.getBoundingClientRect().toJSON();
      const named = (name) => bar.querySelector(`button[aria-label="${name}"]`);
      return {
        insert: rect(named('Insert block')),
        redo: rect(named('Redo')),
        more: rect(named('More')),
        undo: rect(named('Undo')),
        icon: named('Insert block')?.querySelector('svg')?.getAttribute('data-icon'),
        dividers: [...bar.querySelectorAll('hr[aria-orientation="vertical"]')].length,
        barRight: bar.getBoundingClientRect().right,
        names: [...bar.querySelectorAll('button')].map((b) => b.getAttribute('aria-label')),
        scrolls: bar.scrollWidth > bar.clientWidth + 2,
      };
    });
  const check = (state, got) => {
    const where = `${label} (${state})`;
    if (!got.insert) return void problems.push(`${where}: no Insert block on the bar (${got.names})`);
    if (Math.abs(got.insert.width - 44) > 0.6 || Math.abs(got.insert.height - 44) > 0.6)
      problems.push(`${where}: Insert block is ${got.insert.width} x ${got.insert.height}, not 44 x 44`);
    if (got.icon !== 'add_block')
      problems.push(`${where}: Insert block has icon ${got.icon}, not the add-block icon (widgets with a plus)`);
    if (got.scrolls) problems.push(`${where}: the bar scrolls`);
    // Undo, Redo, Insert block, then the ⋮ (when there is one), with no divider.
    if (got.dividers) problems.push(`${where}: the bar has a divider`);
    if (got.undo && got.redo && !(got.undo.right <= got.redo.left + 1 && got.redo.right <= got.insert.left))
      problems.push(`${where}: the order is not Undo, Redo, Insert block`);
    if (got.more && got.more.left < got.insert.right - 1) problems.push(`${where}: the ⋮ is not after Insert block`);
  };
  check('idle', await read());
  await page.click('.ProseMirror');
  await page.keyboard.type('Fro');
  await page.waitForTimeout(300);
  const text = await read();
  check('in text', text);
  if (phone && text.names.some((n) => n === 'Insert block') && !text.names.includes('Undo'))
    problems.push(`${label}: Insert block pushed Undo off the bar`);
  // The ⋮ menu has no Insert row.
  if (text.more) {
    await page.locator('.mo-editor-tools [aria-label="More"]').click();
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('[role=menu][aria-label="More"] [role^=menuitem]')].map((x) => x.textContent.trim()),
    );
    if (rows.some((r) => /^Insert/.test(r))) problems.push(`${label}: the ⋮ menu has an Insert row (${rows})`);
    await page.locator('.mo-editor-tools [aria-label="More"]').click();
  }
  // It opens the block picker.
  await page.locator('.mo-editor-tools button[aria-label="Insert block"]').click();
  await page
    .waitForSelector('dialog[open]', { timeout: 4000 })
    .catch(() => problems.push(`${label}: Insert block did not open the block picker`));
  await page.close();
}

/**
 * Each installed app's blocks, on a test page of the app's own (its check-page.md, docs/app-contract.md, "The app's test page"; without
 * one, its blocks at their default values and a warning that names the app). The page lives only in memory (the texts the editor is
 * given, never a file in the site's folder), never saved or published; the editor opens it on a computer and every failure is reported under the app's name.
 */
async function checkAppTestPages() {
  for (const id of installedApps(ROOT)) {
    const test = appCheckPage(join(ROOT, 'src/apps', id), id);
    if (!test) continue;
    for (const w of test.warnings) console.warn(`warning: ${w}`);
    for (const p of test.problems) problems.push(p);
    if (test.problems.length) continue;
    const path = `src/content/pages/zz-app-${id}.md`;
    const label = `app ${id} (${test.source})`;
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
    page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
    // (A resource the local server does not have, such as a photo, is a 404 here and nothing of the app's.)
    page.on(
      'console',
      (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && problems.push(`${label}: console error: ${m.text()}`),
    );
    try {
      await openEditor(page, site, { [path]: test.text });
      await page.evaluate((hash) => (location.hash = hash), `#${path}`);
      await page.waitForSelector('.ProseMirror', { timeout: 15000 });
      await page.waitForTimeout(800);
      const drawn = await page.evaluate(
        () =>
          document.querySelectorAll('.ProseMirror [data-block], .ProseMirror .mo-site-block-inline, .ProseMirror .mo-site-block-preview')
            .length,
      );
      if (drawn < test.types.length)
        problems.push(
          `${label}: the editor draws ${drawn} blocks of the page, the app has ${test.types.length} (${test.types.join(', ')})`,
        );
    } catch (error) {
      problems.push(`${label}: the test page does not open in the editor (${error.message.split('\n')[0]})`);
    } finally {
      await page.close();
    }
  }
}

/** On a phone, a press and hold on a row of the pages list selects it (and the blog's the same), and the top bar's Delete asks before it deletes; a default page (the front page) is not deleted, with the reason. */
async function checkLongPressDelete() {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`long press: ${e.message}`));
  await openEditor(page, site);
  const cdp = await page.context().newCDPSession(page);
  for (const list of ['pages', 'blog']) {
    await page.evaluate((l) => (location.hash = `#list/${l}`), list);
    await page.waitForSelector('main a.mo-list__item-container');
    await page.waitForTimeout(500);
    const rows = page.locator('main a.mo-list__item-container');
    // A row that is not a default page.
    const row = list === 'pages' ? rows.filter({ hasText: FIXTURE_PAGE }).first() : rows.filter({ hasText: 'Check post' }).first();
    await row.scrollIntoViewIfNeeded();
    const box = await row.boundingBox();
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    const hold = async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await page.waitForTimeout(800);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(300);
    };
    const here = await page.evaluate(() => location.hash);
    await hold();
    if ((await page.evaluate(() => location.hash)) !== here)
      problems.push(`long press (${list}): a press and hold opened the row instead of selecting it`);
    const del = page.getByRole('button', { name: /^Delete 1 selected$/ });
    if (!(await del.count())) {
      problems.push(`long press (${list}): a press and hold on a row does not select it (no "Delete 1 selected" in the top bar)`);
      continue;
    }
    await del.click();
    const sure = page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true });
    await sure.waitFor({ timeout: 3000 }).catch(() => problems.push(`long press (${list}): Delete does not ask before it deletes`));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  // The front page: a press and hold selects it, but Delete says why it is kept.
  await page.reload();
  await page.evaluate(() => (location.hash = '#list/pages'));
  await page.waitForSelector('main a.mo-list__item-container');
  await page.waitForTimeout(500);
  const home = page.locator('main a.mo-list__item-container', { hasText: 'Home' }).first();
  if (await home.count()) {
    await home.scrollIntoViewIfNeeded();
    const box = await home.boundingBox();
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await page.waitForTimeout(800);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Delete 1 selected$/ }).click();
    await page.waitForTimeout(500);
    if (!(await page.getByText('is a default page', { exact: false }).count()))
      problems.push('long press: deleting the front page did not say it is a default page');
  }
  await page.close();
}

/** On a new page with only its H1 (plain, and on a section colour), a line to write in is under it: on a phone with real touch (375 px) and on a computer with a mouse (1280 px), a tap on the hint line, a tap in the white under the page and Enter at the end of the heading each put the cursor in it, and what is typed goes there, not in the heading. */
async function checkEmptyHint() {
  const devices = [
    ['375px touch', { viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true }],
    ['768px mouse', { viewport: { width: 768, height: 900 } }],
    ['1280px mouse', { viewport: { width: 1280, height: 800 } }],
  ];
  for (const [label, options] of devices) {
    const touch = !!options.hasTouch;
    for (const color of [false, true]) {
      for (const way of ['hint', 'white', 'enter']) {
        const name = `${label} empty hint (${color ? 'on a section colour, ' : ''}${way})`;
        const page = await browser.newPage({ ...options, locale: 'en-US' });
        page.on('pageerror', (e) => problems.push(`${name}: ${e.message}`));
        await openEditor(page, site);
        await page.evaluate(() => (location.hash = '#new/pages'));
        await page.waitForSelector('.ProseMirror');
        if (touch) await page.tap('.ProseMirror');
        else await page.click('.ProseMirror');
        await page.keyboard.type('# From us to you');
        await page.waitForTimeout(300);
        if (color) {
          // The bar shows the tool, or has it under More when it has no room for it (the width of the text decides, not the device), and only once it has caught up with the cursor being in the heading: try until one of them opens the sheet.
          const tool = page.getByRole('button', { name: 'Section settings', exact: true });
          const item = page.getByText('Section settings', { exact: true });
          for (let tries = 0; tries < 20 && !(await page.locator('dialog[open], .mo-editor-side-sheet').count()); tries++) {
            if (await tool.count()) await tool.first().click({ timeout: 5000 });
            else if (await page.getByRole('button', { name: 'More', exact: true }).count()) {
              await page.getByRole('button', { name: 'More', exact: true }).first().dispatchEvent('click');
              await page.waitForTimeout(300);
              if (await item.count()) await item.first().click({ timeout: 5000 });
              else await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(500);
          }
          // A page's H1 has no image (owner, 14 Nov 2026): its Section settings have a colour and a width only.
          const sheet = page.locator('dialog[open], .mo-editor-side-sheet').first();
          // On a phone the section settings are a page (owner, 15 Nov): no control has the focus at the start, the page has it, with no ring.
          if (touch) {
            const start = await sheet.evaluate((d) => ({
              onPage: document.activeElement === d,
              styled: [...document.querySelectorAll(':focus-visible')].filter(
                (e) => getComputedStyle(e).outlineStyle !== 'none' || getComputedStyle(e).boxShadow !== 'none',
              ).length,
            }));
            if (!start.onPage) problems.push(`${name}: the focus does not start on the section settings page itself`);
            if (start.styled) problems.push(`${name}: an element has focus-visible styling when the section settings page opens`);
          }
          // From 600 dp the section settings are a pane beside the page, not a dialog (owner, 15 Nov): a standard side sheet (<aside>), no dialog open,
          // the pane itself has the focus with no ring, and the text stays visible and clear of it.
          if (!touch) {
            const pane = await page.evaluate(() => {
              const aside = document.querySelector('aside.mo-editor-side-sheet:not([hidden])');
              const text = document.querySelector('.ProseMirror')?.getBoundingClientRect();
              const box = aside?.getBoundingClientRect();
              return {
                aside: !!aside,
                dialogs: document.querySelectorAll('dialog[open]').length,
                focused: !!aside && document.activeElement === aside,
                styled: [...document.querySelectorAll(':focus-visible')].filter(
                  (e) => getComputedStyle(e).outlineStyle !== 'none' || getComputedStyle(e).boxShadow !== 'none',
                ).length,
                clear: !!box && !!text && text.right <= box.left + 1 && text.width > 200,
              };
            });
            if (!pane.aside) problems.push(`${name}: the section settings are not a standard side sheet (pane)`);
            if (pane.dialogs) problems.push(`${name}: a dialog is open over the page while the section settings are shown`);
            if (!pane.focused) problems.push(`${name}: the focus does not start on the section settings pane itself`);
            if (pane.styled) problems.push(`${name}: an element has focus-visible styling when the section settings pane opens`);
            if (!pane.clear) problems.push(`${name}: the text is covered by the section settings pane or is too narrow beside it`);
          }
          if (await sheet.getByText('Background image', { exact: true }).count())
            problems.push(`${name}: the Main heading's Section settings offer a background image`);
          if (!(await sheet.getByText('Width', { exact: true }).count()))
            problems.push(`${name}: the Main heading's Section settings have no Width`);
          await page.getByText('Primary', { exact: true }).first().click();
          await saveOrClose(page);
          await page.waitForSelector('.ProseMirror [data-section-color="primary"]', { timeout: 10_000 });
          await page.waitForTimeout(300);
        }
        const line = await page.evaluate(() => {
          const [h1, line] = [...document.querySelector('.ProseMirror').children];
          if (line?.tagName !== 'P') return null;
          const box = line.getBoundingClientRect();
          const hint = getComputedStyle(line, '::before').content.match(/Type text/);
          return {
            top: box.top,
            bottom: box.bottom,
            left: box.left,
            width: box.width,
            height: box.height,
            hint: !!hint,
            below: h1.getBoundingClientRect().bottom,
          };
        });
        if (!line) {
          problems.push(`${name}: there is no line under the heading to write in`);
          await page.close();
          continue;
        }
        if (line.height < 48) problems.push(`${name}: the line is ${Math.round(line.height)}px high, not 48`);
        if (!line.hint) problems.push(`${name}: the line does not say what to do`);
        if (way === 'hint' || way === 'white') {
          const x = line.left + 12;
          // The white under the line, still inside the text and above the bottom bar.
          const y = way === 'hint' ? line.top + line.height / 2 : line.bottom + 60;
          if (touch) await page.touchscreen.tap(x, y);
          else await page.mouse.click(x, y);
        } else await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
        await page.keyboard.type('Hej');
        const got = await page.evaluate(() =>
          [...document.querySelector('.ProseMirror').children].map((n) => `${n.tagName}:${n.textContent}`).join(),
        );
        if (got !== 'H1:From us to you,P:Hej') problems.push(`${name}: expected the heading and P:Hej, got ${got}`);
        if (!color && way === 'hint' && !touch)
          for (const [c, ratio] of Object.entries(await hintContrasts(page, '.ProseMirror > p', '::before')))
            if (ratio < 4.5) problems.push(`${name}: the hint on a ${c} section has contrast ${ratio.toFixed(2)}:1, below 4.5`);
        await page.close();
      }
    }
  }
}

/** The FAB never covers the footer (Screen.tsx useFabLift): on every screen that has both, at the top, in the middle and at the bottom
 * of the page, the FAB's box and the footer's do not overlap. The screens are the start screen and the lists with a create button. */
async function checkFabAboveFooter(width) {
  const label = `${width}px FAB above the footer`;
  const touch = width < 600;
  const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  let seen = 0;
  for (const route of ['#', '#seo/redirects/all', '#media', '#links']) {
    await page.evaluate((r) => (location.hash = r), route);
    await page.waitForTimeout(1200);
    for (const at of [0, 0.5, 1]) {
      await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), at);
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => {
        const fab = document.querySelector('.mo-editor-fab')?.getBoundingClientRect();
        const footer = document.querySelector('footer.mo-editor-footer')?.getBoundingClientRect();
        if (!fab || !footer) return null;
        return { fabTop: fab.top, fabBottom: fab.bottom, footerTop: footer.top, footerBottom: footer.bottom, h: innerHeight };
      });
      if (!m) continue;
      seen++;
      if (m.footerTop < m.h && m.footerBottom > 0 && m.fabBottom > m.footerTop + 0.5 && m.fabTop < m.footerBottom)
        problems.push(
          `${label}: on ${route} (scrolled to ${at * 100}%) the FAB (${Math.round(m.fabTop)}–${Math.round(m.fabBottom)}) overlaps the footer (${Math.round(m.footerTop)}–${Math.round(m.footerBottom)})`,
        );
    }
  }
  if (!seen) problems.push(`${label}: no screen with both a FAB and the footer was found`);
  await page.close();
}

/** Label is a style of any top-level line of text (owner decision, 14 Nov): the Text style menu has the Label row on a plain line and on an empty last line, choosing it makes the line a label drawn in the label role (12 px) with its text kept and no heading after it, picking it again gives the plain line back, and a lone label saved in a page is drawn the same in the Preview. */
async function checkLabelOnAnyLine(width) {
  const label = `${width}px label on any line`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Intro');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Opening hours');
  await page.waitForTimeout(300);
  const rowNames = () => page.locator('[role=menu] [role^=menuitem]:visible').evaluateAll((rows) => rows.map((x) => x.textContent.trim()));
  const labelNow = () =>
    page.evaluate(() => {
      const el = document.querySelector('.ProseMirror p.mo-type-label-medium');
      return el
        ? { text: el.textContent, size: getComputedStyle(el).fontSize, tops: [...el.parentElement.children].map((c) => c.tagName) }
        : null;
    });
  await openStyleMenu(page);
  if (!(await rowNames()).some((n) => /^Label\b/.test(n)))
    problems.push(`${label}: the Text style menu has no Label row on a plain line (${(await rowNames()).join(', ')})`);
  await page
    .locator('[role=menu] [role^=menuitem]')
    .filter({ hasText: /^Label\b/ })
    .first()
    .click();
  await page.waitForTimeout(200);
  const made = await labelNow();
  if (!made || made.text !== 'Opening hours')
    problems.push(`${label}: Label on a plain line does not make it a label with its text (${JSON.stringify(made)})`);
  else if (made.size !== '12px') problems.push(`${label}: the label is drawn at ${made.size}, not the label role's 12px`);
  else if (made.tops.join() !== 'P,P') problems.push(`${label}: the label's line changed the page's shape (${made.tops})`);
  // Picked again, it is the plain line again.
  await openStyleMenu(page);
  await page
    .locator('[role=menu] [role^=menuitem]')
    .filter({ hasText: /^Label\b/ })
    .first()
    .click();
  await page.waitForTimeout(200);
  if (await labelNow()) problems.push(`${label}: Label picked again does not give the plain line back`);
  if ((await page.locator('.ProseMirror p').nth(1).textContent()) !== 'Opening hours')
    problems.push(`${label}: the line lost its text going back from a label`);
  // An empty last line has the row too.
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await openStyleMenu(page);
  if (!(await rowNames()).some((n) => /^Label\b/.test(n))) problems.push(`${label}: no Label row on an empty last line`);
  await page.keyboard.press('Escape');
  await page.close();
  // A lone label of a saved page is read as a label and drawn the same in the Preview (a page of its own, as the other checks).
  const saved = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  saved.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  return checkSavedLabel(saved, width);
}

/** A heading takes the Label style like any line (owner, 22 Nov 2026: "heading cannot change to label"): in the Text style menu, Label on a heading makes it a label with its text kept and no heading left, on a phone and a computer. */
async function checkHeadingToLabel(width) {
  const label = `${width}px heading to label`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Intro');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Opening hours');
  await page.waitForTimeout(300);
  await openStyleMenu(page);
  await page
    .locator('[role=menu] [role^=menuitem]')
    .filter({ hasText: /^Main heading\b/ })
    .first()
    .click();
  await page.waitForTimeout(200);
  if (!(await page.locator('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3').count()))
    problems.push(`${label}: the test line did not become a heading`);
  await openStyleMenu(page);
  await page
    .locator('[role=menu] [role^=menuitem]')
    .filter({ hasText: /^Label\b/ })
    .first()
    .click();
  await page.waitForTimeout(200);
  const now = await page.evaluate(() => ({
    label: document.querySelector('.ProseMirror p.mo-type-label-medium')?.textContent ?? null,
    headings: document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3').length,
  }));
  if (now.label !== 'Opening hours') problems.push(`${label}: Label on a heading does not make it a label with its text (${now.label})`);
  if (now.headings) problems.push(`${label}: the heading is still a heading after Label`);
  await page.close();
}

/** The Preview of a draft page (not on the site, so its own address answers 404) opens without an error text, and its bar of window sizes keeps its bar of window sizes inside the screen, scrolling, and apart from the caption, at phone widths. */
async function checkPreviewDraft(width) {
  const label = `${width}px draft Preview`;
  const path = 'src/content/pages/preview-draft-check.md';
  const text = '---\ntitle: "Preview draft check"\nstatus: "draft"\n---\n\n# Preview draft check\n\nSome text in a draft.\n';
  const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site, { [path]: text });
  await page.goto(`${site}/editor/#${path}`);
  await clickPreview(page);
  await page.waitForFunction(
    () => {
      const d = document.querySelector('[data-preview-page]');
      return d && (d.querySelector('iframe') || /Couldn.t create the preview/.test(d.textContent));
    },
    null,
    { timeout: 30_000 },
  );
  const failed = await page.evaluate(
    () => document.querySelector('[data-preview-page]')?.textContent.match(/Couldn.t create the preview[^]*/)?.[0],
  );
  if (failed) problems.push(`${label}: ${failed.slice(0, 120)}`);
  const bar = await page.evaluate(() => {
    const caption = document.querySelector('[data-preview-page] [data-preview-width]').getBoundingClientRect();
    const area = document.querySelector('[data-preview-page] [role="group"]').closest('.mo-editor-preview-sizes');
    const a = area.getBoundingClientRect();
    const apart =
      a.right <= caption.left + 0.5 || a.left >= caption.right - 0.5 || a.bottom <= caption.top + 0.5 || a.top >= caption.bottom - 0.5;
    return { apart, inside: a.left >= 0 && a.right <= innerWidth + 0.5, overflowX: getComputedStyle(area).overflowX };
  });
  if (!bar.apart) problems.push(`${label}: the size bar overlaps the caption`);
  if (!bar.inside) problems.push(`${label}: the size bar reaches outside the screen`);
  if (bar.overflowX !== 'auto') problems.push(`${label}: the size bar does not scroll (${bar.overflowX})`);
  await page.close();
}

/** An empty row in a block typed in place (the List - Expand's "New row" left empty) is not a snackbar and a page that cannot be saved: Save or Publish scrolls to the block and asks (375 px, touch): "You have an empty segmented list row." with Remove item (the row goes, nothing is saved), the action tapped (the page is saved without the empty rows) and Cancel (nothing changes). A page without an empty row saves as before, with no question. */
async function checkEmptyRow(width, height) {
  const label = `${width}px empty row`;
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, locale: 'en-US' });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await openEditor(page, site);
  const commits = [];
  await page.route('**/api/github/commit', (r) => {
    commits.push(JSON.parse(r.request().postData() || '{}'));
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ commit: 'head', blobs: {} }) });
  });
  await page.evaluate(() => (location.hash = '#new/pages'));
  await page.waitForSelector('.ProseMirror');
  await page.click('.ProseMirror');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await pressInsert(page, 'tap');
  await page.locator('dialog[open] button', { hasText: 'Show list items that expand and collapse.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  const dialog = page.locator('dialog[open]');
  const rows = () => page.locator('.mo-editor-inline-list-row[data-row]:not(.mo-editor-inline-list-row-next)').count();
  const blocks = () => page.locator('.mo-site-block-inline').count();
  // A tap on the bar's button; `keys`: the button pressed with the cursor still in the block (a key, not a tap), so the empty row is still there.
  const press = async (name, keys) => {
    const button = page.getByRole('button', { name, exact: true }).first();
    if (keys) await button.evaluate((b) => b.click());
    else await button.tap();
    await page.waitForTimeout(700);
  };
  const buttons = () => dialog.getByRole('button').allTextContents();
  const sayOf = () => dialog.locator('p').first().textContent();
  const sent = (n) => commits.slice(n).flatMap((c) => c.changes.map((x) => Buffer.from(x.content ?? '', 'base64').toString('utf8')));
  // The block has no row at all (the faded "New row", left empty): Publish asks to delete the block, with the block marked and in view.
  await press('Publish');
  if (!(await dialog.count())) problems.push(`${label}: a block with no row on Publish did not open a dialog`);
  else {
    if ((await sayOf()) !== 'List - Expand has no rows. The block will be deleted.')
      problems.push(`${label}: the dialog says "${await sayOf()}"`);
    const got = await buttons();
    if (got.join('|') !== 'Cancel|Delete and publish')
      problems.push(`${label}: the dialog has "${got.join('|')}", not "Cancel|Delete and publish"`);
    const kinds = await dialog.getByRole('button').evaluateAll((b) => b.map((x) => x.className));
    if (kinds.length !== 2 || kinds[0] === kinds[1]) problems.push(`${label}: the main choice is not the only filled button`);
    if (await dialog.locator('button:focus').count()) problems.push(`${label}: a button has the focus`);
    const marked = await page.evaluate(() => {
      const el = document.querySelector('.mo-editor-wrong');
      const r = el?.getBoundingClientRect();
      return !!el && r.bottom > 0 && r.top < innerHeight;
    });
    if (!marked) problems.push(`${label}: the block is not marked and in view behind the dialog`);
    await page.screenshot({ path: join(shots, `empty-block-${width}.png`) });
    // Cancel closes it and changes nothing.
    await dialog.getByRole('button', { name: 'Cancel' }).tap();
    await page.waitForTimeout(300);
    if ((await dialog.count()) || commits.length || (await blocks()) !== 1)
      problems.push(`${label}: Cancel changed something (commits ${commits.length}, blocks ${await blocks()})`);
    // Delete and publish: the block goes and the page is saved without it.
    await press('Publish');
    await dialog.getByRole('button', { name: 'Delete and publish' }).tap();
    await page.waitForTimeout(1200);
    if ((await dialog.count()) || !commits.length || (await blocks()) !== 0 || /data-block/.test(sent(0).join('\n')))
      problems.push(
        `${label}: Delete and publish left ${await blocks()} blocks, ${commits.length} commits, dialog ${await dialog.count()}`,
      );
  }
  // A list with an empty row between its rows: Remove item takes that row, Save saves without it.
  const first = commits.length;
  const makeList = async () => {
    await page.click('.ProseMirror > p');
    await page.keyboard.press('Enter');
    await pressInsert(page, 'tap');
    await page.locator('dialog[open] button', { hasText: 'Show list items that expand and collapse.' }).first().click();
    await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
    await page.keyboard.type('First');
    for (const word of ['Second', 'Third']) {
      await page.locator('[data-add-row]').tap();
      await page.waitForTimeout(200);
      await page.keyboard.type(word);
    }
    // The middle row is emptied (Delete, not Backspace, which would drop an empty row).
    await page.locator('.mo-editor-inline-list-row[data-row="1"] [data-field="title"]').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
  };
  await makeList();
  if ((await rows()) !== 3) problems.push(`${label}: expected 3 rows before saving, got ${await rows()}`);
  await press('Save', true);
  if (!(await dialog.count())) problems.push(`${label}: an empty row between rows on Save did not open a dialog`);
  else {
    const got = await buttons();
    if (got.join('|') !== 'Remove item|Save|Cancel')
      problems.push(`${label}: the dialog has "${got.join('|')}", not "Remove item|Save|Cancel"`);
    await dialog.getByRole('button', { name: 'Remove item' }).tap();
    await page.waitForTimeout(400);
    if (commits.length !== first || (await rows()) !== 2 || (await blocks()) !== 1)
      problems.push(`${label}: Remove item left ${await rows()} rows (not 2), ${commits.length} commits`);
  }
  // Saved as it is now: no question, and no empty row in the file.
  await press('Save', true);
  if (await dialog.count()) problems.push(`${label}: a list without an empty row still asked`);
  if (commits.length === first) problems.push(`${label}: a list without an empty row was not saved`);
  else if (/"title":""/.test(sent(first).join('\n'))) problems.push(`${label}: the saved page has an empty row`);
  // An empty row again, and the third button: the page is saved with the row left out, and the list in the editor has two.
  const before = commits.length;
  await page
    .locator('[data-add-row]')
    .count()
    .catch(() => 0);
  await page.locator('.mo-editor-inline-list-row[data-row="0"] [data-field="title"]').click();
  await page.keyboard.type(' again');
  await page.locator('[data-add-row]').tap();
  await page.waitForTimeout(300);
  if ((await rows()) !== 3) problems.push(`${label}: expected 3 rows with a new empty one, got ${await rows()}`);
  await press('Save', true);
  if (!(await dialog.count())) problems.push(`${label}: the new empty row did not open the dialog`);
  else {
    await dialog.getByRole('button', { name: 'Save' }).tap();
    await page.waitForTimeout(1200);
    if (commits.length === before) problems.push(`${label}: Save in the dialog saved nothing`);
    else if (/"title":""/.test(sent(before).join('\n'))) problems.push(`${label}: Save in the dialog saved the empty row`);
    if ((await rows()) !== 2) problems.push(`${label}: after Save in the dialog the list has ${await rows()} rows, not 2`);
  }
  await page.close();
}

/** Insert of every block typed in place (the lists above and the Table) puts the block in the text, on an empty page and after a line of text: it never opens a sheet. A new typed-in-place block goes in `inlineBlocks`, `inlineSingles` or here. */
async function checkInsertNeverOpensSheet(width, height) {
  const phone = width < 600;
  const hints = [...inlineBlocks, ...inlineSingles, ...liveLists, { name: 'table', hint: 'Show data in rows and columns.' }];
  for (const { name, hint } of hints) {
    for (const typed of [false, true]) {
      const label = `${width}px Insert of ${name}${typed ? '' : ' on an empty page'}`;
      const page = await browser.newPage({ viewport: { width, height }, hasTouch: phone, isMobile: phone, locale: 'en-US' });
      page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
      await openEditor(page, site);
      await page.evaluate(() => (location.hash = '#new/pages'));
      await page.waitForSelector('.ProseMirror');
      await page.click('.ProseMirror');
      if (typed) {
        await page.keyboard.type('Hello');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
      await pressInsert(page, 'click');
      await page.locator('dialog[open] button', { hasText: hint }).first().click();
      await page.waitForTimeout(800);
      const state = await page.evaluate(() => ({
        sheet: document.querySelectorAll('dialog[open]').length,
        inline: !!document.querySelector('.mo-site-block-inline'),
      }));
      if (state.sheet) problems.push(`${label}: Insert opened a sheet, it must put the block in the text`);
      else if (!state.inline) problems.push(`${label}: Insert put no block typed in place in the text`);
      await page.close();
    }
  }
}

/** Change type (spec 2026-11-14-paste-and-change-to-design.md, section 3): the block's ⋮ menu has Change type first (Block settings and Hide are in the action row),
 * with an arrow; it opens the next level with a back row and the other five blocks; a List with an icon changed to
 * Steps keeps its titles and texts, says "Changed to Steps", and back to List shows the icon again; Ctrl+Z after a change, and the
 * snackbar's Undo, give the block back as it was; and what a block keeps from another is never on the site. */
async function checkChangeTo(width, height) {
  const label = `${width}px change to`;
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
  await page.locator('dialog[open] button', { hasText: 'Show text and images in a list.' }).first().click();
  await page.waitForSelector('.mo-editor-inline-list-row-active [data-field="title"]');
  await page.keyboard.type('Opening hours');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Mon–Fri');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Parking');
  await page.waitForTimeout(200);
  // The first row gets an icon.
  await page.locator('[data-row="0"] [data-field="title"]').click();
  await page.locator('[data-row="0"] .mo-editor-inline-list-slot[aria-label="Icon"]').click();
  const picker = page.getByRole('group', { name: 'Icon', exact: true }).last();
  await picker.waitFor({ timeout: 5000 }).catch(() => problems.push(`${label}: the icon picker did not open`));
  await picker.getByRole('button').nth(1).click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.locator('[data-row="0"] [data-field="title"]').click();
  await page.waitForTimeout(200);
  const rows = (field) =>
    page.evaluate(
      (field) =>
        [...document.querySelectorAll('.mo-editor-inline-list-host [data-row]')]
          .filter((r) => !r.parentElement.closest('[data-row]'))
          .map((r) => [r.querySelector(`[data-field="${field}"]`)?.value ?? '', r.querySelector('[data-field="text"]')?.value ?? '']),
      field,
    );
  // A row that is not active shows its icon slot only when it has an icon: the second row is made active to look at the first.
  const hasIcon = async () => {
    await page.locator('.mo-editor-inline-list [data-row="1"] [data-field="title"]').click();
    await page.waitForTimeout(200);
    return page.locator('.mo-editor-inline-list [data-row="0"] .mo-editor-inline-list-slot').count();
  };
  if (!(await hasIcon())) problems.push(`${label}: the List's first row did not get an icon`);
  const menuRows = () =>
    page.locator('[role=menu] [role^=menuitem]:visible').evaluateAll((items) => items.map((i) => i.textContent.trim()));
  // Opens ⋮ › Change type and chooses the block `to`.
  const changeTo = async (to) => {
    await page.locator('.mo-editor-tools [aria-label="More"]:visible').first().click();
    await page.waitForTimeout(200);
    await page
      .locator('[role=menu] [role^=menuitem]', { hasText: /^Change type$/ })
      .first()
      .click();
    await page.waitForTimeout(200);
    await page
      .locator('[role=menu] [role^=menuitem]', { hasText: new RegExp(`^${to}$`) })
      .first()
      .click();
    await page.waitForTimeout(500);
  };
  await page.locator('.mo-editor-tools [aria-label="More"]:visible').first().click();
  await page.waitForTimeout(200);
  const first = await menuRows();
  const at = first.indexOf('Change type');
  // Block settings, Hide and the moves are the action row's (blockRow.ts), so Change type is the block's first row in the ⋮ (after the bar's tools
  // that did not fit, on a phone), before Select.
  if (at < 0 || first[at + 1] !== 'Select')
    problems.push(`${label}: Change type is not the block's first row, before Select (${first.join(', ')})`);
  const opener = page.locator('[role=menu] [role^=menuitem]', { hasText: /^Change type$/ }).first();
  if ((await opener.getAttribute('aria-haspopup')) !== 'menu') problems.push(`${label}: Change type does not say it opens a menu`);
  const rowIcon = await opener.locator('.mo-menu__item-leading svg').first().innerHTML();
  await opener.click();
  await page.waitForTimeout(200);
  const level = await menuRows();
  const want = 'Change type,List - Expand,Steps,Cards,Table';
  if (level.join() !== want) problems.push(`${label}: Change type's level is ${level.join(', ')}, not ${want}`);
  // The header of the level has the swap icon of the row (not a back arrow) and says where it goes.
  const header = page.locator('[role=menu] [role^=menuitem]', { hasText: /^Change type$/ }).first();
  if ((await header.locator('.mo-menu__item-leading svg').first().innerHTML()) !== rowIcon)
    problems.push(`${label}: the header of the Change type level does not draw the icon of its row`);
  if ((await header.getAttribute('aria-label')) !== 'Change type, back to menu')
    problems.push(`${label}: the header's name is "${await header.getAttribute('aria-label')}", not "Change type, back to menu"`);
  // The header, Enter and Escape each go back to the menu's own rows, which stays open; Escape there closes it.
  await header.click();
  await page.waitForTimeout(200);
  if (!(await menuRows()).includes('Select')) problems.push(`${label}: the header did not give the menu's rows again`);
  await page
    .locator('[role=menu] [role^=menuitem]', { hasText: /^Change type$/ })
    .first()
    .click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  if (!(await menuRows()).includes('Select')) problems.push(`${label}: Enter on the header did not give the menu's rows again`);
  await page
    .locator('[role=menu] [role^=menuitem]', { hasText: /^Change type$/ })
    .first()
    .click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (!(await menuRows()).includes('Select'))
    problems.push(`${label}: Escape in the level did not give the menu's rows again (it closed the menu)`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (await page.locator('[role=menu]:visible').count()) problems.push(`${label}: Escape at the menu's own rows did not close it`);
  await changeTo('Steps');
  if (!(await page.locator('.mo-editor-inline-steps').count())) problems.push(`${label}: Change type › Steps did not make Steps`);
  const steps = JSON.stringify(await rows('title'));
  const was = JSON.stringify([
    ['Opening hours', 'Mon–Fri'],
    ['Parking', ''],
  ]);
  if (steps !== was) problems.push(`${label}: the Steps have ${steps}, not ${was}`);
  const said = await page.locator('.mo-snackbar__stack .mo-snackbar', { hasText: 'Changed to Steps' }).count();
  if (!said) problems.push(`${label}: no snackbar "Changed to Steps"`);
  // Ctrl+Z gives the List back, with its icon.
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  if (!(await page.locator('.mo-editor-inline-list').count()) || !(await hasIcon()))
    problems.push(`${label}: Ctrl+Z after Change type did not give the List back with its icon`);
  // List → Steps → List: the icon is back, and the snackbar's Undo gives Steps again.
  await page.locator('[data-row="0"] [data-field="title"]').click();
  await changeTo('Steps');
  await page.locator('[data-row="0"] [data-field="title"]').click();
  await changeTo('List');
  if (!(await hasIcon())) problems.push(`${label}: List → Steps → List lost the first row's icon`);
  if (JSON.stringify(await rows('title')) !== was)
    problems.push(`${label}: List → Steps → List has ${JSON.stringify(await rows('title'))}`);
  await page.locator('.mo-snackbar__stack .mo-snackbar', { hasText: 'Changed to List' }).locator('.mo-snackbar__action').first().click();
  await page.waitForTimeout(500);
  if (!(await page.locator('.mo-editor-inline-steps').count())) problems.push(`${label}: the snackbar's Undo did not give Steps back`);
  // Steps → Table → List: the rows are the steps' titles and texts, with no header row; back in the List the first row has its icon again.
  await changeTo('Table');
  const table = await page.evaluate(() => ({
    rows: [...document.querySelectorAll('.mo-editor-inline-table-box tr[data-row]')].map((tr) =>
      [...tr.querySelectorAll('textarea')].map((f) => f.value),
    ),
    header: document.querySelectorAll('.mo-editor-inline-table-box thead th').length,
  }));
  if (JSON.stringify(table.rows) !== was || table.header)
    problems.push(`${label}: Steps → Table made ${JSON.stringify(table)}, not the rows ${was} with no header row`);
  await changeTo('List');
  if (!(await page.locator('.mo-editor-inline-list').count()) || !(await hasIcon()))
    problems.push(`${label}: Table → List did not give the List with its icon`);
  if (JSON.stringify(await rows('title')) !== was) problems.push(`${label}: Table → List has ${JSON.stringify(await rows('title'))}`);
  // Kept data is never on the site: the Steps of the system's test page (the demo's Blocks page) keep a card's subhead and a List - Expand's Markdown on their
  // first step, as Change type leaves them, and the page shows neither.
  if (await onTestPage(page, label)) {
    const html = await page.content();
    if (!html.includes('Pick a block')) problems.push(`${label} (site): the test page's Steps are not there`);
    if (/Kept from (Cards|a)/.test(html)) problems.push(`${label} (site): the page shows what a block kept from another block`);
  }
  await page.close();
}

/** In the page: the inner padding of the first row of each block that shows rows with a title and a trailing chevron (the List, List - Expand, Questions and answers and Link
 * collection), by the heading above it: the title's distance from the row's left edge and the chevron's from its right edge. Runs in the page. */
const rowPadding = () => {
  const out = {};
  const root = document.querySelector('.ProseMirror') ?? document.querySelector('main .mo-prose');
  let head = '';
  for (const c of root.children) {
    if (/^H[1-6]$/.test(c.tagName)) {
      head = c.textContent.trim().toLowerCase();
      continue;
    }
    const row = c.querySelector('.mo-list__item-expand-summary, .mo-list__item-container:has(> .mo-list__item-trailing svg)');
    if (!row || out[head] || row.querySelector(':scope > .mo-list__item-leading:not(:empty), :scope > .mo-list__item-leading-icon'))
      continue;
    const box = row.getBoundingClientRect();
    const icons = [...row.querySelectorAll('svg')].filter((v) => v.getBoundingClientRect().width);
    const title = row.querySelector('.mo-list__item-content').getBoundingClientRect();
    if (icons.length)
      out[head] = {
        expand: row.matches('.mo-list__item-expand-summary'),
        left: title.left - box.left,
        right: box.right - Math.max(...icons.map((v) => v.getBoundingClientRect().right)),
      };
  }
  return out;
};

/** One left edge for a page's content (375, 768 and 1280 px), in the editor and on the site. The site is the reference: its text column starts at the theme's page margin
 * (--mo-sys-grid-margin: 16 dp, 24 dp from medium) and every block's own content starts on that same edge. The editor adds only its frame, which hangs outside the column by
 * a fixed outset (--mo-comp-editor-frame-outset, 8 dp) and so is never clipped by the text field's edge: the text starts one page margin in from the text field, the blocks'
 * content on the text's edge (a border drawn at 1 px instead of 1.5 px at a pixel ratio of 1 allows half a pixel), every frame the outset to the left of it, and
 * the select mark and the handle stay inside the text field. Real geometry (getBoundingClientRect), no sleeps: it waits for the blocks to be drawn. */
async function checkPageLeftEdge(width) {
  const label = `${width}px one left edge`;
  const height = width < 600 ? 800 : 900;
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  const near = (a, b, by = 1) => Math.abs(a - b) <= by;
  // The site: the Blocks page of the system's test page.
  let sitePads = {};
  if (await onTestPage(page, label)) {
    const built = await page.evaluate(() => {
      const prose = document.querySelector('main .mo-prose');
      const text = prose.querySelector('p').getBoundingClientRect().left;
      const margin = parseFloat(getComputedStyle(document.documentElement).fontSize) * (innerWidth < 600 ? 1 : 1.5);
      const out = [];
      for (const c of prose.children) {
        if (/^(H[1-6]|P)$/.test(c.tagName)) {
          if (Math.abs(c.getBoundingClientRect().left - text) > 1)
            out.push(`${c.tagName} ${c.textContent.slice(0, 20)} at ${c.getBoundingClientRect().left}`);
          continue;
        }
        if (!c.getBoundingClientRect().width) continue;
        const left = c.getBoundingClientRect().left;
        // A text button's own padding is pulled out so its text starts on the margin (theme/styles/global.css): the text is on the edge.
        const words = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
        let first = null;
        for (let n = words.nextNode(); n && !first; n = words.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(n);
          first = n.textContent.trim() ? ([...range.getClientRects()].find((q) => q.width) ?? null) : null;
        }
        // A plain list (not the segmented design) is 16 dp wider than the text column on each side at every width (its negative margin), so its row layer starts 16 dp before the text (M3 Lists › Specs; the 16 Nov 2026 rule "edge to edge below 600 dp" went on 21 Nov 2026).
        if (c.matches('.mo-block-list:not(.mo-list__segmented), .mo-block-accordion:not(.mo-block-accordion__segmented)')) {
          if (Math.abs(left - (text - 16)) > 1)
            out.push(`plain list ${c.className.toString().slice(0, 30)} at ${left}, not 16 dp before the text column ${text}`);
          continue;
        }
        if (Math.abs(left - text) > 1 && !(first && Math.abs(first.left - text) <= 1.5))
          out.push(`block ${c.className.toString().slice(0, 30)} at ${left}`);
      }
      return { text, margin, out };
    });
    // From expanded the site's text is a centred column, not at the margin.
    sitePads = await page.evaluate(rowPadding);
    if (width < 1000 && !near(built.text, built.margin))
      problems.push(`${label}: the site's text starts at ${built.text}, not at the page margin ${built.margin}`);
    for (const o of built.out) problems.push(`${label}: on the site ${o} is not on the text's left edge ${built.text}`);
  }
  // The editor.
  // The system's test page (every block) is in memory before the editor loads the site's files, not in the site's folder.
  virtualFile(CORE_PAGE_FILE, coreBlocksPage());
  await openEditor(page, site);
  await page.evaluate((file) => (location.hash = `#${file}`), CORE_PAGE_FILE);
  await page.waitForSelector('.mo-site-block-card');
  await page.waitForFunction(
    () => {
      const cards = document.querySelectorAll('.mo-site-block-card');
      return cards.length > 8 && document.querySelectorAll('.mo-site-block-preview').length === cards.length;
    },
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  // A row's inner padding is equal on its left and right, and the same in the editor as on the site (the title is not pushed in by an empty icon slot).
  const editorPads = await page.evaluate(rowPadding);
  for (const [head, pad] of Object.entries(editorPads)) {
    if (!near(pad.left, pad.right, 1.5))
      problems.push(
        `${label}: in the editor the rows of "${head}" have ${pad.left} px of padding on the left and ${pad.right} px on the right`,
      );
    const onSite = sitePads[head];
    // (A Questions and answers block that reads a list is a plain list in the editor's preview: only rows of the same kind are compared.)
    if (onSite && onSite.expand === pad.expand && !near(pad.left, onSite.left, 1.5))
      problems.push(
        `${label}: in the editor the rows of "${head}" have ${pad.left} px of padding on the left, on the site ${onSite.left} px`,
      );
  }
  for (const [head, pad] of Object.entries(sitePads))
    if (!near(pad.left, pad.right, 1.5))
      problems.push(
        `${label}: on the site the rows of "${head}" have ${pad.left} px of padding on the left and ${pad.right} px on the right`,
      );
  // The rows of a List and of a List - Expand (the FAQ) are both measured above; without one of them the check would pass on nothing.
  if (!['plain design', 'list - expand as a faq'].every((h) => h in editorPads))
    problems.push(`${label}: a List and a List - Expand have no row to measure (${Object.keys(editorPads)})`);
  for (const cursor of [false, true]) {
    if (cursor) await page.locator('.ProseMirror p').first().click();
    const got = await page.evaluate(() => {
      const field = document.querySelector('.mo-editor-text').getBoundingClientRect();
      const pm = document.querySelector('.ProseMirror');
      const text = pm.querySelector('p').getBoundingClientRect().left;
      const margin = parseFloat(getComputedStyle(document.documentElement).fontSize) * (innerWidth < 600 ? 1 : 1.5);
      const outset =
        parseFloat(getComputedStyle(document.querySelector('.mo-editor-text')).getPropertyValue('--mo-comp-editor-frame-outset')) || 0;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const blocks = [...pm.querySelectorAll(':scope > .mo-site-block')].map((b) => {
        const card = b.querySelector(':scope > .mo-site-block-card').getBoundingClientRect();
        const body = (b.querySelector('.mo-site-block-preview') ?? b).getBoundingClientRect();
        const mark = b
          .querySelector(':scope > .mo-site-block-mark-dot, :scope > .mo-site-block-mark .mo-site-block-mark-dot')
          ?.getBoundingClientRect();
        const handle = b.querySelector(':scope > .mo-site-block-handle')?.getBoundingClientRect();
        return { card: card.left, cardRight: card.right, body: body.left, mark: mark?.left ?? null, handleRight: handle?.right ?? null };
      });
      // The content edge, not the box: a section's first heading draws its line across the full width (its box reaches the field's edge, its padding puts the text back).
      const heads = [...pm.querySelectorAll(':scope > :is(h1, h2, h3, p)')].map((h) => {
        const cs = getComputedStyle(h);
        return h.getBoundingClientRect().left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
      });
      return { field: field.left, fieldRight: field.right, text, margin, outset: outset * rem, blocks, heads };
    });
    const at = `${label}${cursor ? ' with the cursor in the text' : ''}`;
    // The text starts a page margin in from the text field's line (1 px).
    if (!near(got.text - got.field, got.margin + 1))
      problems.push(
        `${at}: the text starts ${got.text - got.field} px in from the text field, not the page margin ${got.margin} + its 1 px line`,
      );
    if (got.heads.some((l) => !near(l, got.text, 0.5)))
      problems.push(`${at}: headings and paragraphs do not share one left edge (${[...new Set(got.heads)]})`);
    if (!got.blocks.length) problems.push(`${at}: no block drawn in the text`);
    for (const b of got.blocks) {
      if (!near(got.text - b.card, 8, 0.5))
        problems.push(`${at}: a block's frame hangs ${got.text - b.card} px outside the text column, not the fixed outset of 8 px`);
      if (!near(b.body, got.text, 1)) problems.push(`${at}: a block's content starts at ${b.body}, not on the text's edge ${got.text}`);
      if (b.card < got.field + 1) problems.push(`${at}: a block's frame (${b.card}) is clipped by the text field's edge (${got.field})`);
      if (b.mark !== null && b.mark < got.field)
        problems.push(`${at}: a block's select mark (${b.mark}) is outside the text field (${got.field})`);
      if (b.handleRight !== null && b.handleRight > b.cardRight)
        problems.push(`${at}: a block's handle ends at ${b.handleRight}, outside its frame (${b.cardRight})`);
    }
  }
  await page.close();
}

export function register(unit) {
  for (const width of [320, 375, 1280]) unit(`checkInsertBlock ${width}`, () => checkInsertBlock(width));
  for (const w of [375, 1280]) unit(`checkBlockRow ${w}`, () => checkBlockRow(w));
  unit('checkBlockRow 375 reduced', () => checkBlockRow(375, { reduced: true }));
  unit('checkBlockRow 375 keyboard', () => checkBlockRow(375, { height: 420 }));
  unit('checkBlockRowNarrow', () => checkBlockRowNarrow());
  for (const w of [375, 1280]) unit(`checkBlockVisibility ${w}`, () => checkBlockVisibility(w));
  unit('checkEmptyHint', () => checkEmptyHint());
  unit('checkLongPressDelete', () => checkLongPressDelete());
  unit('checkAppTestPages', () => checkAppTestPages());
  unit('checkInsertNeverOpensSheet 375', () => checkInsertNeverOpensSheet(375, 740));
  unit('checkEmptyRow 375', () => checkEmptyRow(375, 740));
  unit('checkInsertNeverOpensSheet 1280', () => checkInsertNeverOpensSheet(1280, 900));
  for (const w of [375, 1280]) unit(`checkChangeTo ${w}`, () => checkChangeTo(w, w < 600 ? 740 : 900));
  for (const w of [375, 768, 1280]) unit(`checkPageLeftEdge ${w}`, () => checkPageLeftEdge(w));
  for (const w of [375, 1280]) unit(`checkLabelOnAnyLine ${w}`, () => checkLabelOnAnyLine(w));
  for (const w of [375, 1280]) unit(`checkHeadingToLabel ${w}`, () => checkHeadingToLabel(w));
  for (const w of [375, 1280]) unit(`checkFabAboveFooter ${w}`, () => checkFabAboveFooter(w));
  for (const w of [360, 375, 390, 414]) unit(`checkPreviewDraft ${w}`, () => checkPreviewDraft(w));
}
