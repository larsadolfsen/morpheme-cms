// The contextual menu of a block typed in place (batch 5, owner decision 6, S3's recommendation): one bar, context aware, with the
// block's row actions (`Add above`, `Add below`, `Move up`, `Move down`, shown while the active row has content) and the block's own menu
// (its handle: Hide, Move, Remove, MarkdownEditor.tsx cardMenu). Targets are 48 dp. On a computer it sits over the block; on a phone (compact)
// it is docked above the keyboard (the visual viewport) and above the page's save bar, and wraps to a second line when 375 px is not enough. It has no dropdown: choices live in the settings sheet (the gear) or the block's own menu. No dependencies but the icons and the browser.
import arrowDownIcon from '@phosphor-icons/core/assets/regular/arrow-down.svg?raw';
import arrowUpIcon from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw';
import dotsIcon from '@phosphor-icons/core/assets/regular/dots-three-vertical.svg?raw';
import gearIcon from '@phosphor-icons/core/assets/regular/gear.svg?raw';
import linkIcon from '@phosphor-icons/core/assets/regular/link-simple.svg?raw';
import dynamicIcon from '@material-symbols/svg-400/outlined/dynamic_feed.svg?raw';
import rowAboveIcon from '@material-symbols/svg-400/outlined/add_row_above.svg?raw';
import rowBelowIcon from '@material-symbols/svg-400/outlined/add_row_below.svg?raw';
import columnBeforeIcon from '@material-symbols/svg-400/outlined/add_column_left.svg?raw';
import columnAfterIcon from '@material-symbols/svg-400/outlined/add_column_right.svg?raw';
import alignLeftIcon from '@material-symbols/svg-400/outlined/format_align_left.svg?raw';
import alignCenterIcon from '@material-symbols/svg-400/outlined/format_align_center.svg?raw';
import alignRightIcon from '@material-symbols/svg-400/outlined/format_align_right.svg?raw';
import alignAutoIcon from '@material-symbols/svg-400/outlined/autorenew.svg?raw';
import deleteIcon from '@material-symbols/svg-400/outlined/delete.svg?raw';

export type BarAction = {
  label: string;
  kind:
    | 'above'
    | 'below'
    | 'up'
    | 'down'
    | 'link'
    | 'column-before'
    | 'column-after'
    | 'delete'
    | 'align-left'
    | 'align-center'
    | 'align-right'
    | 'align-auto';
  /** A choice among others (a column's alignment): shown pressed when it is the current one. */
  pressed?: boolean;
  action: () => void;
};

const icons = {
  above: rowAboveIcon,
  below: rowBelowIcon,
  up: arrowUpIcon,
  down: arrowDownIcon,
  link: linkIcon,
  'column-before': columnBeforeIcon,
  'column-after': columnAfterIcon,
  delete: deleteIcon,
  'align-left': alignLeftIcon,
  'align-center': alignCenterIcon,
  'align-right': alignRightIcon,
  'align-auto': alignAutoIcon,
};
const svg = (s: string, size = 24) => s.replace('<svg', `<svg width="${size}" height="${size}" fill="currentColor" aria-hidden="true"`);

export function contextualMenu(opts: {
  name: string;
  dom: HTMLElement;
  rowActions: () => BarAction[];
  /** The gear button (the item's settings); a block with no settings has none. */
  edit?: () => void;
  compact: () => boolean;
  labels: { edit: string };
  /** The dynamic icon (a shortcut to the block's `Rows from` settings): its label, and whether the block reads a list now (shown pressed). Missing for a block that cannot. */
  dynamic?: { label: string; on: () => boolean; action: () => void };
}) {
  const el = document.body.appendChild(document.createElement('div'));
  el.className = 'contextual-menu';
  el.setAttribute('role', 'toolbar');
  el.setAttribute('aria-label', opts.name);
  el.hidden = true;
  // The block's own menu (the handle cardMenu opens): kept between redraws.
  const block = document.createElement('button');
  block.type = 'button';
  block.title = opts.name;
  block.setAttribute('aria-label', opts.name);
  block.innerHTML = svg(dotsIcon);

  // A tap on the bar keeps the cursor where it is.
  const press = (b: HTMLButtonElement, run: () => void) => {
    b.type = 'button';
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    b.addEventListener('touchend', (e) => {
      e.preventDefault();
      run();
    });
    b.addEventListener('click', (e) => e.detail === 0 && run());
    b.addEventListener('mouseup', (e) => e.detail > 0 && run());
    return b;
  };
  const button = (label: string, icon: string | null, text: string | null, run: () => void) => {
    const b = press(el.appendChild(document.createElement('button')), run);
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = `${icon ? svg(icon) : ''}${text ? `<span>${text}</span>` : ''}`;
    return b;
  };

  function draw() {
    el.replaceChildren();
    const all = opts.rowActions();
    // Add above and Add below are buttons of their own, on a phone too; the rest (Link, Move up, Move down) fold under Row there.
    const adds = all.filter((r) => r.kind === 'above' || r.kind === 'below');
    const rows = all.filter((r) => r.kind !== 'above' && r.kind !== 'below');
    for (const r of adds) button(r.label, icons[r.kind], null, r.action);
    if (opts.dynamic) {
      const d = button(opts.dynamic.label, dynamicIcon, null, opts.dynamic.action);
      d.setAttribute('aria-pressed', String(opts.dynamic.on()));
      d.classList.toggle('contextual-menu-on', opts.dynamic.on());
    }
    // Plain icon buttons on a phone too (no dropdown); the menu wraps to a second line there when 375 px is not enough.
    for (const r of rows) {
      const b = button(r.label, icons[r.kind], null, r.action);
      if (r.pressed !== undefined) {
        b.setAttribute('aria-pressed', String(r.pressed));
        b.classList.toggle('contextual-menu-on', r.pressed);
      }
    }
    if (opts.compact() && opts.edit) button(opts.labels.edit, gearIcon, null, opts.edit);
    el.appendChild(block);
  }

  // Docked above the keyboard and the save bar on a phone; over the block on a computer (under it when there is no room), following the page.
  function place() {
    if (el.hidden) return;
    const { offsetWidth: width, offsetHeight: height } = el;
    const box = opts.dom.getBoundingClientRect();
    const screen = visualViewport ?? { offsetLeft: 0, offsetTop: 0, width: innerWidth, height: innerHeight };
    el.classList.toggle('contextual-menu-docked', opts.compact());
    if (opts.compact()) {
      el.style.left = `${screen.offsetLeft + (screen.width - width) / 2}px`;
      const save = document.querySelector('.editor-save-bar')?.getBoundingClientRect().top ?? Infinity;
      el.style.top = `${Math.min(screen.offsetTop + screen.height, save) - height - 12}px`;
      return;
    }
    const bar = document.querySelector('.editor-tools')?.getBoundingClientRect().bottom ?? 0;
    el.style.left = `${Math.max(4, Math.min(box.left + box.width / 2 - width / 2, innerWidth - width - 4))}px`;
    el.style.top = `${Math.max(bar + 8, box.top - height - 10)}px`;
    // Out of sight with the block.
    el.style.visibility = box.bottom < bar || box.top > innerHeight ? 'hidden' : '';
  }
  const follow = () => place();
  addEventListener('scroll', follow, { passive: true, capture: true });
  addEventListener('resize', follow);
  visualViewport?.addEventListener('resize', follow);
  visualViewport?.addEventListener('scroll', follow);

  return {
    el,
    block,
    /** Redraws the buttons (the active row or its content changed) and shows or hides the bar. */
    refresh(shown: boolean) {
      el.hidden = !shown;
      if (!shown) return;
      draw();
      place();
    },
    destroy() {
      removeEventListener('scroll', follow, true);
      removeEventListener('resize', follow);
      visualViewport?.removeEventListener('resize', follow);
      visualViewport?.removeEventListener('scroll', follow);
      el.remove();
    },
  };
}
