// What "Cards" do in a browser on the site: a carousel on a phone (`phone`, LinkCards.tsx) has `Show all`, which turns the row into the stacked
// cards in place and back (focus stays on the button), and the arrow keys, which move focus from one card to the next or the one before
// (the cards are not tab stops except through their link or first button, and a text-only card itself). Run on every page by the theme's
// Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without such a block it does nothing.
export default function cards() {
  document.addEventListener('click', (e) => {
    const button = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-cards-show-all]');
    const root = button?.closest<HTMLElement>('[data-cards-carousel]');
    if (!button || !root) return;
    const all = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(all));
    root.toggleAttribute('data-expanded', all);
    button.textContent = (all ? button.dataset.fewer : button.dataset.all) ?? '';
    button.focus();
  });

  // The thing to focus in a card: its link, its first button, or the card itself when there is nothing in it.
  const targetOf = (item: HTMLElement) => item.querySelector<HTMLElement>('a[href], button') ?? (item.tabIndex === 0 ? item : null);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const item = (e.target as Element | null)?.closest<HTMLElement>('[data-cards-carousel] [data-carousel-item]');
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
