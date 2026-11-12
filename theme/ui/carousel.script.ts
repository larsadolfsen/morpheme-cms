// What a carousel (Carousel.tsx) does on the site: its page indicator is shown, follows the scroll position and jumps
// to an item, and a multi-browse or hero carousel's items grow and shrink as they pass (carouselLayout in
// carouselLayout.ts). Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without a carousel
// on the page it does nothing.
import { carouselLayout, scrollFor, shownItem } from '@theme/ui/carouselLayout';

export default function carousel() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
    const indicator = carousel.querySelector<HTMLElement>('[data-carousel-indicator]')!;
    const row = carousel.querySelector<HTMLElement>('[data-carousel-items]')!;
    const dots = [...carousel.querySelectorAll<HTMLButtonElement>('[data-carousel-dot]')];
    indicator.hidden = false;
    carouselLayout(carousel);

    const go = (i: number) => row.scrollTo({ left: scrollFor(row, i), behavior: reduce ? 'auto' : 'smooth' });
    const update = () => {
      const active = shownItem(row);
      dots.forEach((d, n) => d.setAttribute('aria-current', String(n === active)));
    };

    row.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update, { passive: true });
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    update();
  });
}
