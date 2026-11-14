// The active block's action row (docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md; owner idea, 14 Nov): a small row right above the block's top
// item, right-aligned, with the block's own actions (Move up, Move down, Hide or Show, Settings, only when the block has settings) and, at its end, the block's drag handle (drawn there by
// CSS: `.site-block-has-row`). It shows only while a block is active and opens by its height, with the editor's spatial spring (motionTiming) and not at all
// under reduced motion. The buttons are real buttons with the labels the menu rows had; the bar's `⋮` keeps the rest (Remove, other settings).
// The block (a node view, not React) tells blockBar its row; this module draws it. No dependencies but blockBar and the motion helpers.
import { motionReduced, motionTiming } from '../lib/motion';
import { blockBar, type BlockRow } from './blockBar';

/** The row's height and its buttons': the editor's one touch size, 44 dp. */
const SIZE = 44;

let shown: { host: HTMLElement; el: HTMLElement } | null = null;

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
  el.setAttribute('inert', '');
  grow(el, now, 0, () => el.remove());
};

function draw(el: HTMLElement, row: BlockRow, name: string) {
  el.setAttribute('aria-label', name);
  const inner = el.querySelector<HTMLElement>('.site-block-row-inner')!;
  inner.replaceChildren(
    ...row.items.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'site-block-row-button';
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

function sync() {
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
    row.host.prepend(el);
    row.host.classList.add('site-block-has-row');
    shown = { host: row.host, el };
    draw(el, row, state.name);
    grow(el, 0, SIZE);
    return;
  }
  draw(shown.el, row, state.name);
}

blockBar.subscribe(sync);
