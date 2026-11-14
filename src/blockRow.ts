// The active block's action row (docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md; owner idea, 14 Nov): a small row at the top of the block's dotted outline (inside it, above the block's top
// item), right-aligned, with the block's own actions (Move up, Move down, Hide or Show, Settings, only when the block has settings) and, at its end, the block's drag handle (drawn there by
// CSS: `.site-block-has-row`). It shows only while a block is active and opens by its height, with the editor's spatial spring (motionTiming) and not at all
// under reduced motion. The buttons are real buttons with the labels the menu rows had; the bar's `⋮` keeps the rest (Remove, other settings).
// A mouse pointing at a block that is not the active one shows the same row over the block's top, taking no space (`.site-block-row-hover`), so the page never moves on hover; when the block
// becomes active the row opens in the block's flow and the page is scrolled by the same amount, frame by frame, so the block's own content stays where it was (the row grows upward).
// The block (a node view, not React) tells blockBar its row; this module draws it. No dependencies but blockBar and the motion helpers.
import { motionReduced, motionTiming } from '../lib/motion';
import { iconButtonClass } from '@theme/ui/IconButton';
import { blockBar, type BlockRow } from './blockBar';

/** The row's height and its buttons': the editor's one touch size, 44 dp. */
const SIZE = 44;

let shown: { host: HTMLElement; el: HTMLElement } | null = null;
let pointedAt: { host: HTMLElement; el: HTMLElement } | null = null;
// What each row was last drawn from: a row is drawn again only when its block gives it new items (an unrelated change of the bar leaves the buttons, and their hover, alone).
const drawn = new WeakMap<HTMLElement, unknown>();

/** The block's own content (below its row): what stays where it is while the row opens or closes. */
const anchorOf = (host: HTMLElement) =>
  host.querySelector<HTMLElement>(':scope > .site-block-card > .site-block-preview') ??
  host.querySelector<HTMLElement>(':scope > .site-block-card');

const scrollerOf = (el: HTMLElement) => {
  for (let box = el.parentElement; box && box !== document.body; box = box.parentElement)
    if (/auto|scroll/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight) return box;
  return null;
};

let holding: { anchor: HTMLElement; top: number; el: HTMLElement } | null = null;
const adjust = () => {
  if (!holding) return;
  if (!holding.anchor.isConnected) return void (holding = null);
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
  adjust();
  const step = () => {
    if (holding?.el !== el) return;
    adjust();
    if (el.getAnimations().length) requestAnimationFrame(step);
    else holding = null;
  };
  requestAnimationFrame(step);
};

const grow = (el: HTMLElement, from: number, to: number, done?: () => void) => {
  for (const running of el.getAnimations()) running.cancel();
  el.style.height = `${to}px`;
  if (motionReduced() || from === to) return done?.();
  el.classList.add('site-block-row-moving');
  const run = el.animate([{ height: `${from}px` }, { height: `${to}px` }], motionTiming('spatial', 'fast'));
  const end = () => {
    el.classList.remove('site-block-row-moving');
    done?.();
  };
  run.finished.then(end, () => {});
};

const close = (it: { host: HTMLElement; el: HTMLElement }) => {
  it.host.classList.remove('site-block-has-row');
  const { el } = it;
  const now = el.getBoundingClientRect().height;
  const anchor = anchorOf(it.host);
  const top = anchor?.getBoundingClientRect().top;
  el.setAttribute('inert', '');
  grow(el, now, 0, () => el.remove());
  hold(anchor, top, el);
};

function draw(el: HTMLElement, row: BlockRow, name: string) {
  if (drawn.get(el) === row) return;
  drawn.set(el, row);
  el.setAttribute('aria-label', name);
  const inner = el.querySelector<HTMLElement>('.site-block-row-inner')!;
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
      if (e.target instanceof Element && e.target.closest('.site-block-handle')) held = true;
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
    el.className = 'site-block-row';
    el.setAttribute('role', 'group');
    el.innerHTML = '<div class="site-block-row-inner"></div>';
    const anchor = anchorOf(row.host);
    const top = anchor?.getBoundingClientRect().top;
    // Inside the block's dotted outline (its card), so the row moves with the block and the drag shows both together.
    (row.host.querySelector<HTMLElement>(':scope > .site-block-card') ?? row.host).prepend(el);
    row.host.classList.add('site-block-has-row');
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
  const want = row && row.items.length && row.host !== shown?.host ? row : null;
  if (pointedAt && pointedAt.host !== want?.host) {
    pointedAt.host.classList.remove('site-block-has-hover');
    pointedAt.el.remove();
    pointedAt = null;
  }
  if (!want) return;
  if (!pointedAt) {
    const el = document.createElement('div');
    el.className = 'site-block-row site-block-row-hover';
    el.setAttribute('role', 'group');
    el.innerHTML = '<div class="site-block-row-inner"></div>';
    (want.host.querySelector<HTMLElement>(':scope > .site-block-card') ?? want.host).prepend(el);
    want.host.classList.add('site-block-has-hover');
    pointedAt = { host: want.host, el };
  }
  draw(pointedAt.el, want, want.host.querySelector(':scope > .site-block-card')?.getAttribute('aria-label') ?? '');
}

function sync() {
  syncActive();
  syncPointed();
}

blockBar.subscribe(sync);
