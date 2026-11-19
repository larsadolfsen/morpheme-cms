import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, browser, problems, site } from './support/context.mjs';

// The demo's Names view (demo/public/demo-names.js, scripts/demo-names.mjs): only the demo has it, so a built site that is not the demo (no
// Blocks pages) has nothing to check.
const PAGES = {
  buttons: ['Button · filled', 'Button · tonal', 'Button · outlined', 'Button · text'],
  lists: ['ListItem · two-line', 'Button · text'],
};
const BLOCKS = { buttons: ['Buttons'], lists: ['List', 'List - Expand'] };

/** Off by default and no label drawn; with `?names` a label on every block (the editor's name for it) and on the theme's parts the page draws;
 * the layout does not move (every element's box and the page's size are the same On and Off), and the view asks for nothing from another address. */
async function checkNamesView(width, height, page) {
  const label = `${width}px Names view ${page}`;
  const tab = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  const outside = [];
  tab.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  tab.on('request', (r) => {
    if (!r.url().startsWith('data:') && !r.url().startsWith(site)) outside.push(r.url());
  });
  const boxes = () =>
    tab.evaluate(() => ({
      page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      boxes: [...document.querySelectorAll('main *')].map((el) => {
        const r = el.getBoundingClientRect();
        return [
          Math.round(r.x * 10) / 10,
          Math.round((r.y + scrollY) * 10) / 10,
          Math.round(r.width * 10) / 10,
          Math.round(r.height * 10) / 10,
        ];
      }),
    }));
  await tab.goto(`${site}/blocks/${page}/?names=0`, { waitUntil: 'networkidle' });
  if (await tab.locator('[data-demo-names="block"], [data-demo-names="part"]').count())
    problems.push(`${label}: a label is drawn while the view is off`);
  const off = await boxes();

  // The Names button (in the footer) turns the labels on.
  await tab.locator('[data-demo-names="toggle"]').click();
  if (!(await tab.locator('[data-demo-names="block"], [data-demo-names="part"]').count()))
    problems.push(`${label}: the Names button draws no labels`);
  await tab.evaluate(() => localStorage.removeItem('morpheme-demo-names'));

  await tab.goto(`${site}/blocks/${page}/?names`, { waitUntil: 'networkidle' });
  await tab.waitForSelector('[data-demo-names="block"], [data-demo-names="part"]', { timeout: 10_000 }).catch(() => {});
  const found = await tab.evaluate(() => ({
    blocks: [...document.querySelectorAll('[data-demo-names="block"]')].map((e) => e.textContent),
    parts: [...document.querySelectorAll('[data-demo-names="part"]')].map((e) => e.textContent),
    expected: document.querySelector('script[data-blocks]')?.dataset.blocks.split('|').length ?? 0,
    roots: [...document.querySelectorAll('main .mo-is-in-text')].filter(
      (el) =>
        !el.parentElement.closest('.mo-is-in-text') &&
        !el.matches('.mo-block-list__button, .mo-block-more__button, .mo-block-buttons__row'),
    ).length,
    events: [...document.querySelectorAll('[data-demo-names="block"], [data-demo-names="part"]')].filter(
      (e) => getComputedStyle(e).pointerEvents !== 'none',
    ).length,
  }));
  if (!found.expected) problems.push(`${label}: the page lists no blocks (data-blocks)`);
  if (found.blocks.length !== found.expected || found.roots !== found.expected)
    problems.push(`${label}: ${found.expected} blocks on the page, ${found.roots} found, ${found.blocks.length} labelled`);
  if (found.blocks.some((b) => b.startsWith('Block')))
    problems.push(`${label}: a block has no name (${found.blocks.filter((b) => b.startsWith('Block')).join(', ')})`);
  for (const name of BLOCKS[page]) if (!found.blocks.some((b) => b.startsWith(name))) problems.push(`${label}: no block label "${name}"`);
  for (const part of PAGES[page])
    if (!found.parts.some((p) => p === part || p.startsWith(`${part} ×`)))
      problems.push(`${label}: no label "${part}" (found ${[...new Set(found.parts)].join(', ')})`);
  if (found.events) problems.push(`${label}: a label takes pointer events`);

  // A label never sits on text: no label's box meets the box of any text in the page.
  const covered = await tab.evaluate(() => {
    const chips = [...document.querySelectorAll('[data-demo-names="block"], [data-demo-names="part"]')].map((c) => ({
      c,
      r: c.getBoundingClientRect(),
    }));
    const hits = [];
    const walk = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim() || !n.parentElement.checkVisibility()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const t of range.getClientRects())
        for (const { c, r } of chips)
          if (Math.min(t.right, r.right) - Math.max(t.left, r.left) > 1 && Math.min(t.bottom, r.bottom) - Math.max(t.top, r.top) > 1)
            hits.push(`${c.textContent} on "${n.textContent.trim().slice(0, 20)}"`);
    }
    const mine = chips.filter(({ r }) => r.left < 0 || r.right > document.documentElement.clientWidth + 0.5).length;
    return { hits, mine };
  });
  if (covered.hits.length) problems.push(`${label}: a label covers text (${[...new Set(covered.hits)].slice(0, 4).join('; ')})`);
  // One name to a line: no two labels share a line, and the label type is the theme's.
  const stacked = await tab.evaluate(() => {
    const rects = [...document.querySelectorAll('[data-demo-names="block"], [data-demo-names="part"]')].map((c) =>
      c.getBoundingClientRect(),
    );
    let beside = 0;
    rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => (a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5 ? beside++ : 0)));
    const chip = document.querySelector('[data-demo-names="block"]');
    return {
      beside,
      font: chip ? getComputedStyle(chip).fontSize : '',
      mono: chip ? /mono/i.test(getComputedStyle(chip).fontFamily) : false,
    };
  });
  if (stacked.beside) problems.push(`${label}: ${stacked.beside} pairs of labels share a line`);
  if (stacked.mono) problems.push(`${label}: a label is monospace`);
  if (covered.mine) problems.push(`${label}: ${covered.mine} labels outside the window's width`);
  if (page === 'lists' && !found.parts.some((p) => /^ListItem · two-line ×\d+$/.test(p)))
    problems.push(`${label}: a run of list rows is not labelled once with its count`);
  const on = await boxes();
  if (on.page.join() !== off.page.join())
    problems.push(`${label}: the page is ${on.page.join('×')} with the view on, ${off.page.join('×')} off`);
  const moved = on.boxes.filter((b, i) => !off.boxes[i] || b.some((n, k) => Math.abs(n - off.boxes[i][k]) > 0.5)).length;
  if (moved || on.boxes.length !== off.boxes.length) problems.push(`${label}: ${moved} elements moved with the view on`);
  if (outside.length) problems.push(`${label}: requests to another address: ${[...new Set(outside)].join(', ')}`);
  await tab.close();
}

export function register(unit) {
  if (!existsSync(join(DIST, 'blocks/buttons/index.html'))) return;
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    for (const page of Object.keys(PAGES)) unit(`checkNamesView ${width} ${page}`, () => checkNamesView(width, height, page));
}
