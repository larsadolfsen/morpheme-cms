// What a tooltip (Tooltip.tsx) does on the site: it shows a moment after the mouse comes over its anchor and at once
// when the anchor gets focus from the keyboard; it stays while the mouse is over the anchor or the tooltip and while
// focus is in them, and goes when they leave, or with Escape (WCAG 1.4.13: it can be dismissed, hovered and stays).
// Over its anchor, under it when there is no room above, and moved sideways to stay inside the window (by CSS anchor
// positioning where the browser has it, otherwise by this script). Not on a touch (a tap does what the anchor does). Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts);
// without a tooltip on the page it does nothing.
const SHOW_MS = 500;
const HIDE_MS = 150;
const EDGE = 8;
// Where the browser has anchor positioning, the CSS places the tooltip (tooltip.css); this placement is the fallback.
const placedByCss =
  typeof CSS !== 'undefined' && CSS.supports('anchor-name: --a') && CSS.supports('anchor-scope: --a') && CSS.supports('position-area: top');

export default function tooltips() {
  document.querySelectorAll<HTMLElement>('[data-tooltip]').forEach((anchor) => {
    const tip = anchor.querySelector<HTMLElement>('.mo-tooltip');
    if (!tip) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const place = () => {
      if (placedByCss) return;
      anchor.removeAttribute('data-tooltip-below');
      tip.style.removeProperty('--mo-comp-tooltip-shift');
      const at = anchor.getBoundingClientRect();
      if (at.top - tip.offsetHeight - EDGE < 0) anchor.setAttribute('data-tooltip-below', '');
      const box = tip.getBoundingClientRect();
      const shift = Math.max(EDGE - box.left, Math.min(0, innerWidth - EDGE - box.right));
      if (shift) tip.style.setProperty('--mo-comp-tooltip-shift', `${shift}px`);
    };
    const show = () => {
      clearTimeout(timer);
      if (anchor.hasAttribute('data-tooltip-open')) return;
      // The browser picks over or under the anchor when it lays the tooltip out, not while the page scrolls: lay it out
      // again now, hidden, and read it twice so its fade in still runs (a box that is new has no fade).
      if (placedByCss) {
        tip.style.display = 'none';
        void tip.offsetHeight;
        tip.style.removeProperty('display');
        void tip.offsetHeight;
      }
      anchor.setAttribute('data-tooltip-open', '');
      place();
    };
    const hide = () => {
      clearTimeout(timer);
      anchor.removeAttribute('data-tooltip-open');
    };
    const later = (run: () => void, ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(run, ms);
    };

    // Over it with the mouse, and focus in it from the keyboard: it shows while either is so.
    let hovered = false;
    let focused = false;
    anchor.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      hovered = true;
      later(show, SHOW_MS);
    });
    anchor.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      hovered = false;
      if (!focused) later(hide, HIDE_MS);
    });
    anchor.addEventListener('focusin', (e) => {
      if (!(e.target as HTMLElement).matches(':focus-visible')) return;
      focused = true;
      show();
    });
    anchor.addEventListener('focusout', (e) => {
      if (anchor.contains(e.relatedTarget as Node | null)) return;
      focused = false;
      if (!hovered) later(hide, HIDE_MS);
    });
    // A tap or a click on the anchor does what it does, without the tooltip over it (not one on a rich tooltip's action).
    anchor.addEventListener('pointerdown', (e) => !tip.contains(e.target as Node) && hide());
    addEventListener('keydown', (e) => e.key === 'Escape' && anchor.hasAttribute('data-tooltip-open') && hide());
  });
}
