// The messages at the bottom of the screen (snackbars), the same in the editor (notify in App.tsx) and on
// the site (a new version of a page, PageLayout.astro): in the middle, the newest lowest and the ones before
// it moved up. Their look and place are the theme's Snackbar (.snackbar-stack and .snackbar in
// packages/editor/theme/styles/ui.css). The editor's are drawn here, a text and links; the site's are drawn by
// the theme's part (packages/editor/theme/ui/Snackbar.tsx, with its action and close button) and shown with
// the element the message carries (ui/snackbar.script.ts).
//
// A message goes away by itself after a few seconds (an error after a little longer; not while the
// mouse or a finger is on it or a link in it has focus), when it is tapped, or when it is swiped left
// or right: it follows the finger (or the mouse) sideways and fades; let go far enough (a third of its
// width) or fast enough, and it slides out to that side, else it slides back. Up and down still
// scroll the page. A swipe that started on a link does not also follow it.
// One about something going on ("Saving…") stays until the next message replaces it; snackbar(null) only
// takes that one away.
import arrow from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';

export type SnackbarLink = { text: string; href: string; onClick?: (e: MouseEvent) => void };
export type SnackbarMessage = {
  text: string;
  error?: boolean;
  /** Links after the text, each with an arrow. */
  links?: SnackbarLink[];
  /** How long it stays, when longer than usual (e.g. with links to read). */
  ms?: number;
  /** A progress bar under the text: true when it is not known how far it is, else how far (0 to 1). */
  progress?: boolean | number;
  /** The message as the site's theme draws it (its Snackbar part), shown in place of the text and links. */
  element?: HTMLElement;
};

const SNACKBAR_MS = 5000;
const SNACKBAR_ERROR_MS = 8000;

let stack: HTMLDivElement | undefined;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const working = (text: string) => text.endsWith('…');

/** Shows a message at the bottom (or with null takes away the one about something going on). */
export function snackbar(next: SnackbarMessage | null) {
  stack ??= Object.assign(document.createElement('div'), { className: 'snackbar-stack' });
  // A popover, so it is in front of an open sheet or dialog too (they are in the top layer).
  stack.popover = 'manual';
  if (!stack.isConnected) document.body.append(stack);
  for (const el of stack.querySelectorAll<HTMLElement>('.snackbar')) {
    if (working(el.dataset.text!) || el.dataset.text === next?.text) el.remove();
  }
  if (next) show(stack, next);
  if (!stack.childElementCount) return stack.remove();
  // Shown again for each message, so it comes in front of a sheet opened after the last one.
  if (stack.showPopover) {
    if (stack.matches(':popover-open')) stack.hidePopover();
    stack.showPopover();
  }
}

function show(stack: HTMLDivElement, { text, error, links = [], ms, element, progress }: SnackbarMessage) {
  const el = element ?? document.createElement('p');
  el.dataset.text = text;
  if (!element) {
    el.className = 'snackbar';
    el.setAttribute('role', error ? 'alert' : 'status');
    el.append(text);
  }
  for (const link of element ? [] : links) {
    const a = document.createElement('a');
    a.className = 'snackbar-link';
    a.href = link.href;
    a.innerHTML = arrow.replace('<svg', '<svg width="14" height="14" fill="currentColor" aria-hidden="true"');
    a.prepend(link.text);
    if (link.onClick) a.addEventListener('click', link.onClick);
    el.append(' ', a);
  }
  if (progress !== undefined && progress !== false && !element) {
    const bar = document.createElement('span');
    bar.className = 'snackbar-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', text);
    if (typeof progress === 'number') {
      const value = Math.min(1, Math.max(0, progress));
      bar.style.setProperty('--snackbar-progress', String(value));
      bar.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    }
    el.append(bar);
  }
  stack.append(el);

  const remove = () => {
    clearTimeout(timer);
    el.remove();
    if (!stack.childElementCount) stack.remove();
  };
  // Goes by itself, but not while it is being read or swiped.
  const wait = working(text) ? 0 : (ms ?? (error ? SNACKBAR_ERROR_MS : SNACKBAR_MS));
  let timer = wait ? setTimeout(remove, wait) : undefined;
  const hold = () => clearTimeout(timer);
  const resume = () => {
    clearTimeout(timer);
    if (wait && el.isConnected && !el.matches(':hover, :focus-within')) timer = setTimeout(remove, wait / 2);
  };
  el.addEventListener('pointerenter', hold);
  el.addEventListener('pointerleave', resume);
  el.addEventListener('focusin', hold);
  el.addEventListener('focusout', resume);
  // The theme's (with a close button): Escape closes it too, while it has focus.
  if (element) el.addEventListener('keydown', (e) => e.key === 'Escape' && remove());

  // Swipe.
  let start: { x: number; y: number; t: number; id: number } | null = null;
  let dx = 0;
  let dragging = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
    dx = 0;
    dragging = false;
    hold();
  });
  el.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    dx = e.clientX - start.x;
    if (!dragging) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - start.y)) return;
      dragging = true;
      el.setPointerCapture(e.pointerId);
      el.getAnimations().forEach((a) => a.finish());
    }
    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / el.offsetWidth));
  });
  const up = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return;
    const speed = Math.abs(dx) / Math.max(1, e.timeStamp - start.t);
    start = null;
    resume();
    if (!dragging) return;
    const from = { transform: el.style.transform, opacity: el.style.opacity };
    const duration = reduce() ? 0 : 200;
    if (e.type === 'pointerup' && (Math.abs(dx) > el.offsetWidth / 3 || speed > 0.6)) {
      const to = { transform: `translateX(${Math.sign(dx) * (el.offsetWidth + 32)}px)`, opacity: 0 };
      el.animate([from, to], { duration, easing: 'ease-out', fill: 'forwards' }).finished.then(remove);
      return;
    }
    el.animate([from, { transform: 'none', opacity: 1 }], { duration, easing: 'ease-out' });
    el.style.transform = '';
    el.style.opacity = '';
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  // With the mouse, a link would otherwise be dragged instead of the message.
  el.addEventListener('dragstart', (e) => e.preventDefault());
  // A tap takes it away (a tap on a link or an action also follows it, and on the close button only takes it
  // away); the click at the end of a swipe does nothing.
  el.addEventListener(
    'click',
    (e) => {
      if (!dragging) return remove();
      e.preventDefault();
      e.stopImmediatePropagation();
      dragging = false;
    },
    true,
  );
}
