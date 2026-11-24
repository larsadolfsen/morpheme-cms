// The ripple, Material 3's pressed state (m3.material.io/foundations/interaction/states/applying-states, .mo-ripple in
// ../styles/ui/ripple.css): pressed, a part grows a wave of its content's colour from where it was pressed (from its middle with
// the keyboard) until the wave covers it, and the wave fades when it is let go. On the parts that are pressed (PARTS),
// in the part's shape or, on a navigation item, its active indicator's; not on one that cannot be used. A touch waits a
// moment first, so a finger that scrolls the page does not ripple. One listener on the document, so it also works on
// what is drawn later (the editor's screens). Run on every page by the theme's Base.astro (blockScripts,
// packages/editor/site/blockScripts.ts) and by the editor (App.tsx). How it looks is the theme's (--ripple-*); with
// reduced motion the wave does not grow, it only fades in and out.

/** The parts that ripple when pressed: the buttons, icon buttons and FABs, chips, menu items, tabs and segments, the
 * navigation's items, list items and cards that link or are tapped, and the pickers' days, years and buttons. */
const PARTS = [
  '.mo-button',
  '.mo-icon-button',
  '.mo-fab',
  '.mo-extended-fab',
  'a.mo-chip',
  'button.mo-chip',
  '.mo-chip > .mo-is-action',
  '.mo-chip__remove',
  '.mo-menu__item',
  '.mo-tabs__tab',
  '.mo-segmented-button__segment',
  '.mo-nav-bar__item',
  '.mo-nav-rail__item',
  '.mo-navigation-drawer__item',
  '.mo-navigation-drawer__subitem',
  '.mo-navigation-drawer__toggle',
  ':is(a, button, label, [role="button"]).mo-list__item-container',
  '.mo-list__item-with-control',
  'a.mo-card',
  'button.mo-card',
  '.mo-date-picker__day',
  '.mo-date-picker__year',
  '.mo-date-picker__menu-item',
  '.mo-time-picker__period-button',
].join(', ');

// Material's: the wave starts at a fifth of the part's longer side and grows past its corners with a soft edge, and
// stays at least this long, so a quick tap is seen.
const START = 0.2;
const SOFT_EDGE = 0.35;
const SOFT_EDGE_MIN = 75;
const PADDING = 10;
const MINIMUM_PRESS_MS = 225;
// How long a touch waits before it ripples: a scroll that starts within it cancels the touch.
const TOUCH_DELAY_MS = 150;
// How long a wave stays after it is let go, when it has no transition to wait for.
const FADE_MS = 1000;

let started = false;

export default function ripples() {
  if (started) return;
  started = true;
  document.addEventListener('pointerdown', pointerDown, { capture: true, passive: true });
  document.addEventListener('click', keyboardClick, true);
}

/** The part that is pressed at `target`, the nearest one (an icon button in a list item); none when it cannot be used. */
function partAt(target: EventTarget | null) {
  const part = target instanceof Element ? target.closest<HTMLElement>(PARTS) : null;
  if (!part) return null;
  if (part.matches(':disabled, .mo-list__item-with-control:has(:disabled)')) return null;
  if (part.closest('[aria-disabled="true"], .mo-list__item-disabled, fieldset:disabled')) return null;
  return part;
}

/** Where a part's ripple is drawn: an input chip's on the whole chip, a navigation item's on its active indicator (the
 * icon's, where the indicator is only the box of the icon and the label), else on the part. */
function surfaceOf(part: HTMLElement) {
  if (part.matches('.mo-chip > .mo-is-action')) return part.parentElement ?? part;
  const indicator = part.querySelector<HTMLElement>(':scope > :is(.mo-nav-bar__indicator, .mo-nav-rail__indicator)');
  if (!indicator) return part;
  if (getComputedStyle(indicator).display !== 'contents') return indicator;
  return indicator.querySelector<HTMLElement>(':scope > :is(.mo-nav-bar__icon, .mo-nav-rail__icon)') ?? part;
}

/** Starts a wave on `surface`, from the point pressed (else its middle), and gives what lets it go. */
function press(surface: HTMLElement, x?: number, y?: number) {
  const box = surface.getBoundingClientRect();
  const longer = Math.max(box.width, box.height);
  if (!longer) return () => {};
  const size = Math.max(Math.floor(longer * START), 1);
  const scale = (Math.hypot(box.width, box.height) + PADDING + Math.max(longer * SOFT_EDGE, SOFT_EDGE_MIN)) / size;
  const fromX = x === undefined ? box.width / 2 : x - box.left;
  const fromY = y === undefined ? box.height / 2 : y - box.top;

  let layer = surface.querySelector<HTMLElement>(':scope > .mo-ripple');
  if (!layer) {
    layer = document.createElement('span');
    layer.className = 'mo-ripple';
    layer.setAttribute('aria-hidden', 'true');
    surface.append(layer);
  }
  const wave = document.createElement('span');
  wave.className = 'mo-ripple__wave';
  wave.style.setProperty('--mo-comp-ripple-size', `${size}px`);
  wave.style.setProperty('--mo-comp-ripple-from', `${fromX - size / 2}px, ${fromY - size / 2}px`);
  wave.style.setProperty('--mo-comp-ripple-to', `${box.width / 2 - size / 2}px, ${box.height / 2 - size / 2}px`);
  wave.style.setProperty('--mo-comp-ripple-scale', `${scale}`);
  layer.append(wave);

  const pressed = performance.now();
  const shown = layer;
  return () => {
    setTimeout(() => letGo(wave, shown), Math.max(0, MINIMUM_PRESS_MS - (performance.now() - pressed)));
  };
}

/** Fades a wave out and takes it away, and its layer with the last one, so the part is as it was. */
function letGo(wave: HTMLElement, layer: HTMLElement) {
  const gone = () => {
    wave.remove();
    if (!layer.childElementCount) layer.remove();
  };
  wave.addEventListener('transitionend', gone, { once: true });
  setTimeout(gone, FADE_MS);
  wave.dataset.released = '';
}

function pointerDown(down: PointerEvent) {
  if (!down.isPrimary || down.button !== 0) return;
  const part = partAt(down.target);
  if (!part) return;
  const surface = surfaceOf(part);
  let release: (() => void) | undefined;
  const start = () => {
    release ??= press(surface, down.clientX, down.clientY);
  };
  const touch = down.pointerType === 'touch';
  const timer = touch ? setTimeout(start, TOUCH_DELAY_MS) : undefined;
  if (!touch) start();

  const end = (e: Event) => {
    if (e instanceof PointerEvent && e.pointerId !== down.pointerId) return;
    clearTimeout(timer);
    removeEventListener('pointerup', end, true);
    removeEventListener('pointercancel', end, true);
    removeEventListener('contextmenu', end, true);
    part.removeEventListener('pointerleave', end);
    // A tap let go within the delay still ripples; a scroll (pointercancel) does not.
    if (e.type === 'pointerup') start();
    release?.();
  };
  addEventListener('pointerup', end, true);
  addEventListener('pointercancel', end, true);
  addEventListener('contextmenu', end, true);
  if (!touch) part.addEventListener('pointerleave', end);
}

// A part used from the keyboard (Enter, Space) ripples from its middle. A click from a pointer has its detail, and one
// from a script or a <label> is on a part without the keyboard's focus.
function keyboardClick(e: MouseEvent) {
  if (e.detail !== 0) return;
  const part = partAt(e.target);
  if (!part?.matches(':focus-visible, :has(:focus-visible)')) return;
  press(surfaceOf(part))();
}
