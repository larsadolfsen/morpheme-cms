// What testimonials do on the site (Testimonial.tsx, List.tsx): "Læs mere" shown only on texts that are actually cut;
// a list's buttons with the tags. (The carousel's page indicator, Slider.tsx, is the carousel's: ui/carousel.script.ts.)
// Run on every page by the theme's Base.astro (blockScripts, src/site/scripts.ts).
export default function testimonials() {
  more();
  filters();
}

// "Læs mere" only on texts that are actually cut; it unfolds the text, "Vis mindre" folds it again.
function more() {
  const setup = () =>
    document.querySelectorAll<HTMLElement>('[data-testimonial]').forEach((card) => {
      const text = card.querySelector<HTMLElement>('[data-clamp]');
      const btn = card.querySelector<HTMLButtonElement>('[data-expand]');
      if (!text || !btn || text.hasAttribute('data-open')) return;
      const cut = text.scrollHeight > text.clientHeight + 2;
      text.toggleAttribute('data-overflow', cut);
      btn.hidden = !cut;
    });

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-expand]');
    const text = btn?.closest('[data-testimonial]')?.querySelector<HTMLElement>('[data-clamp]');
    if (!btn || !text) return;
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    text.toggleAttribute('data-open', open);
    btn.querySelector('span')!.textContent = (open ? btn.dataset.less : btn.dataset.more) ?? '';
  });

  setup();
  document.fonts?.ready.then(setup);
  addEventListener('resize', setup, { passive: true });
}

function filters() {
  // The buttons with the tags: one shows only the testimonials with its tag, "Alle" (no tag) all of them.
  document.querySelectorAll<HTMLElement>('[data-testimonial-filter]').forEach((box) => {
    const filters = box.querySelector<HTMLElement>('[data-filters]');
    if (!filters) return;
    filters.hidden = false;
    const buttons = [...filters.querySelectorAll<HTMLButtonElement>('[data-tag]')];
    const items = [...box.querySelectorAll<HTMLElement>('[data-tags]')];
    buttons.forEach((button) =>
      button.addEventListener('click', () => {
        const tag = button.dataset.tag ?? '';
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        items.forEach((item) => (item.hidden = !!tag && !(item.dataset.tags ?? '').split(' ').includes(tag)));
      }),
    );
  });
}
