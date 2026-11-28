// What "Carousel" does in a browser on the site: its row (View.tsx) has `Show all` (or, with a header, the arrow next to it, which
// does the same and names its state in its label), which turns the row into the stacked
// items in place and back (focus stays on the button), and the arrow keys, which move focus from one item to the next or the one before
// (the items are not tab stops except through their link or first button, and a text-only item itself). Run on every page by the theme's
// Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without such a block it does nothing.
export default function carouselBlock() {
  document.addEventListener('click', (e) => {
    const button = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-carousel-show-all]');
    const root = button?.closest<HTMLElement>('[data-carousel-block]');
    if (!button || !root) return;
    const all = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(all));
    root.toggleAttribute('data-expanded', all);
    // `Show all` says its state in its text; the header's arrow (an icon) in its name.
    const say = (all ? button.dataset.fewer : button.dataset.all) ?? '';
    if (button.hasAttribute('data-carousel-arrow')) button.setAttribute('aria-label', say);
    else button.textContent = say;
    button.focus();
  });

  // The thing to focus in a card: its link, its first button, or the card itself when there is nothing in it.
  const targetOf = (item: HTMLElement) => item.querySelector<HTMLElement>('a[href], button') ?? (item.tabIndex === 0 ? item : null);
  document.addEventListener('keydown', (e) => {
    // Up and Down leave the carousel (M3, Accessibility, Keyboard navigation): to the next control after it (`Show all`) or the one before it.
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const root = (e.target as Element | null)?.closest<HTMLElement>('[data-carousel-block]');
      if (!root || (e.target as Element).closest('[data-carousel-show-all]')) return;
      const tabbable = [
        ...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]'),
      ].filter((el) => el.offsetParent !== null);
      // The carousel's own stops are its cards; `Show all` under it is the control Down leaves to. The header's arrow is above the items: Up leaves to it, Down to what follows.
      const showAll = root.querySelector<HTMLElement>('[data-carousel-show-all]');
      const below = showAll && !showAll.hasAttribute('data-carousel-arrow') ? showAll : null;
      const inside = tabbable.filter((el) => root.contains(el) && el !== showAll);
      const after = below && tabbable.includes(below) ? below : tabbable[tabbable.indexOf(inside[inside.length - 1]) + 1];
      const target = e.key === 'ArrowDown' ? after : tabbable[tabbable.indexOf(inside[0]) - 1];
      if (!target) return;
      e.preventDefault();
      target.focus();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const item = (e.target as Element | null)?.closest<HTMLElement>('[data-carousel-block] [data-carousel-item]');
    if (!item) return;
    // Right goes on, Left goes back (the other way round when the page is right-to-left).
    const rtl = getComputedStyle(item).direction === 'rtl';
    const by = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
    const items = [...item.parentElement!.querySelectorAll<HTMLElement>('[data-carousel-item]')];
    const next = targetOf(items[items.indexOf(item) + by] ?? item);
    if (!next) return;
    e.preventDefault();
    next.focus();
    next.closest('[data-carousel-item]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
  });
}
