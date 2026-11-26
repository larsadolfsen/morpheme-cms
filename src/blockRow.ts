// The active block's action row (docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md; owner idea, 14 Nov): a small row at the top of the block's dotted outline (inside it, above the block's top
// item), with the block's own actions at its right (Move up, Move down, Hide or Show, Settings, only when the block has settings) and, at its start, the block's drag handle in the block's top left corner (drawn there by
// CSS: `.mo-site-block-has-row`). It shows only while a block is active and opens by its height, with the editor's spatial spring (motionTiming) and not at all
// under reduced motion. The buttons are real buttons with the labels the menu rows had; the bar's `⋮` keeps the rest (Remove, other settings).
// A mouse pointing at a block that is not the active one shows the same row over the block's top, taking no space (`.mo-site-block-row-hover`), so the page never moves on hover; when the block
// becomes active the row opens in the block's flow and the page is scrolled by the same amount, frame by frame, so the block's own content stays where it was (the row grows upward).
// The block (a node view, not React) tells blockBar its row; this module draws it. No dependencies but blockBar and the motion helpers.
import { motionReduced, motionTiming } from '../lib/motion';
import { iconButtonClass } from '@theme/ui/IconButton';
import { blockBar, type BlockRow } from './blockBar';

/** The narrowest block (in px) that shows its row when a mouse points at it: the row is about 230 px wide and lies over the block's first item. */
const POINTED_MIN = 400;

/** The row's height and its buttons': the handle's touch target, 48 dp. */
const SIZE = 48;

let shown: { host: HTMLElement; el: HTMLElement } | null = null;
let pointedAt: { host: HTMLElement; el: HTMLElement } | null = null;
// What each row was last drawn from: a row is drawn again only when its block gives it new items (an unrelated change of the bar leaves the buttons, and their hover, alone).
const drawn = new WeakMap<HTMLElement, unknown>();

/** The block's own content (below its row): what stays where it is while the row opens or closes. */
const anchorOf = (host: HTMLElement) =>
  host.querySelector<HTMLElement>(':scope > .mo-site-block-card > .mo-site-block-preview') ??
  host.querySelector<HTMLElement>(':scope > .mo-site-block-card');

const scrollerOf = (el: HTMLElement) => {
  for (let box = el.parentElement; box && box !== document.body; box = box.parentElement)
    if (/auto|scroll/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight) return box;
  return null;
};

let holding: { anchor: HTMLElement; top: number; el: HTMLElement } | null = null;
// The hold lets go the moment the person scrolls (a finger moving, the wheel): the touch that closes a row is often the start of a swipe,
// and holding the page against it scrolls it back every frame, so it sticks and jumps while the row's animation runs.
const SCROLLING = ['touchmove', 'wheel'] as const;
const letGo = () => {
  holding = null;
  for (const type of SCROLLING) removeEventListener(type, letGo);
};
const adjust = () => {
  if (!holding) return;
  if (!holding.anchor.isConnected) return letGo();
  const by = holding.anchor.getBoundingClientRect().top - holding.top;
  if (Math.abs(by) < 0.5) return;
  const box = scrollerOf(holding.anchor);
  if (box) box.scrollBy({ top: by, behavior: 'instant' });
  else window.scrollBy({ top: by, behavior: 'instant' });
};
/** Keeps `anchor` at `top` on the screen (scrolling the page by what the row's height moves it) until the row's animation ends. Only the newest hold runs. */
const hold = (anchor: HTMLElement | null, top: number | undefined, el: HTMLElement) => {
  if (!anchor || top === undefined) return;
  holding = { anchor, top, el };
  for (const type of SCROLLING) addEventListener(type, letGo, { passive: true, once: true });
  adjust();
  const step = () => {
    if (holding?.el !== el) return;
    adjust();
    if (el.getAnimations().length) requestAnimationFrame(step);
    else letGo();
  };
  requestAnimationFrame(step);
};

const grow = (el: HTMLElement, from: number, to: number, done?: () => void) => {
  const opening = to > 0;
  // The row is pulled up into the card's top padding by its margin (CSS), which opens and closes with its height, so the content below moves by one smooth amount.
  const current = parseFloat(getComputedStyle(el).marginBlockStart) || 0;
  for (const running of el.getAnimations()) running.cancel();
  el.style.height = `${to}px`;
  el.style.marginBlockStart = opening ? '' : '0px';
  const pulled = opening ? parseFloat(getComputedStyle(el).marginBlockStart) || 0 : 0;
  if (motionReduced() || from === to) return done?.();
  el.classList.add('mo-site-block-row-moving');
  const run = el.animate(
    [
      { height: `${from}px`, marginBlockStart: `${opening && from === 0 ? 0 : current}px` },
      { height: `${to}px`, marginBlockStart: `${pulled}px` },
    ],
    motionTiming('spatial', 'fast'),
  );
  const end = () => {
    el.classList.remove('mo-site-block-row-moving');
    done?.();
  };
  run.finished.then(end, () => {});
};

const close = (it: { host: HTMLElement; el: HTMLElement }) => {
  const { el } = it;
  const now = el.getBoundingClientRect().height;
  // Measured before the class goes: it also sets the card's padding above the row.
  const anchor = anchorOf(it.host);
  const top = anchor?.getBoundingClientRect().top;
  it.host.classList.remove('mo-site-block-has-row');
  el.setAttribute('inert', '');
  grow(el, now, 0, () => el.remove());
  hold(anchor, top, el);
};

function draw(el: HTMLElement, row: BlockRow, name: string) {
  if (drawn.get(el) === row) return;
  drawn.set(el, row);
  el.setAttribute('aria-label', name);
  const inner = el.querySelector<HTMLElement>('.mo-site-block-row-inner')!;
  inner.replaceChildren(
    ...row.items.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      // The theme's own icon button (the one the text bar uses: Material's standard icon button with its state layers), no class of the row's own.
      button.className = iconButtonClass('standard', 'small');
      button.dataset.row = item.kind;
      button.setAttribute('aria-label', item.label);
      // Disabled (a block that cannot move further): shown, still in its place, with the reason (the M3 disabled state, as the bar's Move buttons while blocks are selected).
      if (item.disabled) {
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('aria-description', item.disabled.reason);
        button.title = item.disabled.reason;
      } else button.title = item.label;
      button.innerHTML = item.icon;
      // The block stays active and keeps its focus: the button is pressed, nothing is selected.
      button.addEventListener('mousedown', (e) => e.preventDefault());
      button.addEventListener('click', (e) => !item.disabled && item.action(e.detail === 0));
      return button;
    }),
  );
}

// While a block's handle is pressed (a drag may follow) the row of the block that was active stays open: closing it would move the page and the handle out from
// under the finger. It closes when the press ends.
let held = false;
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target instanceof Element && e.target.closest('.mo-site-block-handle')) held = true;
    },
    true,
  );
  const release = () => {
    if (!held) return;
    held = false;
    setTimeout(sync);
  };
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);
}

function syncActive() {
  const state = blockBar.get();
  const row = state?.row;
  if (shown && (!row || row.host !== shown.host)) {
    if (held) return;
    close(shown);
    shown = null;
  }
  if (!state || !row || row.items.length === 0) return;
  if (!shown) {
    const el = document.createElement('div');
    el.className = 'mo-site-block-row';
    el.setAttribute('role', 'group');
    el.innerHTML = '<div class="mo-site-block-row-inner"></div>';
    const anchor = anchorOf(row.host);
    const top = anchor?.getBoundingClientRect().top;
    // Inside the block's dotted outline (its card), so the row moves with the block and the drag shows both together.
    (row.host.querySelector<HTMLElement>(':scope > .mo-site-block-card') ?? row.host).prepend(el);
    row.host.classList.add('mo-site-block-has-row');
    shown = { host: row.host, el };
    draw(el, row, state.name);
    grow(el, 0, SIZE);
    hold(anchor, top, el);
    return;
  }
  draw(shown.el, row, state.name);
}

// The row of the block a mouse points at, over its top: no height, no animation, nothing in the flow. Not on a block that is active (it has its row), and a touch never points.
function syncPointed() {
  const row = blockBar.pointed();
  // On a narrow block (a narrow window) the row would cover its first item, which could then not be clicked: such a block shows its row only once it is active, in the flow.
  const card = row?.host.querySelector<HTMLElement>(':scope > .mo-site-block-card');
  const want = row && row.items.length && row.host !== shown?.host && (card?.clientWidth ?? 0) >= POINTED_MIN ? row : null;
  if (pointedAt && pointedAt.host !== want?.host) {
    pointedAt.host.classList.remove('mo-site-block-has-hover');
    pointedAt.el.remove();
    pointedAt = null;
  }
  if (!want) return;
  if (!pointedAt) {
    const el = document.createElement('div');
    el.className = 'mo-site-block-row mo-site-block-row-hover';
    el.setAttribute('role', 'group');
    el.innerHTML = '<div class="mo-site-block-row-inner"></div>';
    (want.host.querySelector<HTMLElement>(':scope > .mo-site-block-card') ?? want.host).prepend(el);
    want.host.classList.add('mo-site-block-has-hover');
    pointedAt = { host: want.host, el };
  }
  const owner = want.host.querySelector(':scope > .mo-site-block-card');
  // The name of the block is on its card's button, or on the card itself for a block typed in place.
  draw(
    pointedAt.el,
    want,
    owner?.querySelector(':scope > .mo-site-block-card-button')?.getAttribute('aria-label') ?? owner?.getAttribute('aria-label') ?? '',
  );
  // The row also covers a whole column of a block that is wide enough (the second card of two): that item could then not be clicked, so the block shows its row only once it is active.
  if (covers(pointedAt.el, want.host)) {
    pointedAt.host.classList.remove('mo-site-block-has-hover');
    pointedAt.el.remove();
    pointedAt = null;
  }
}

/** The row lies over something the pointer would then miss: an item of its block that is narrower than the block (a column, as a card in a row of cards), or another control of the
 * block (a button, a link, a row's chevron). An item the full width of the block (a list's line) is not one: its text starts at the left, away from the right-aligned row. */
function covers(row: HTMLElement, host: HTMLElement) {
  const card = host.querySelector<HTMLElement>(':scope > .mo-site-block-card');
  const inner = row.querySelector<HTMLElement>('.mo-site-block-row-inner')?.getBoundingClientRect();
  if (!card || !inner) return false;
  const under = (el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    return box.left < inner.right && box.right > inner.left && box.top < inner.bottom && box.bottom > inner.top;
  };
  const items = [...card.querySelectorAll<HTMLElement>('[data-row]')].filter(
    (item) => !row.contains(item) && item.getBoundingClientRect().width < card.clientWidth * 0.9,
  );
  const controls = [...card.querySelectorAll<HTMLElement>('button, a[href], summary, .mo-list__item-expand-icon')].filter(
    (el) => !row.contains(el) && !el.closest('.mo-site-block-handle') && !el.matches('.mo-site-block-card-button'),
  );
  return [...items, ...controls].some(under);
}

function sync() {
  syncActive();
  syncPointed();
}

blockBar.subscribe(sync);
