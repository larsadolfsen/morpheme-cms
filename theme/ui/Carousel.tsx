// A carousel (m3.material.io/components/carousel, .carousel in ../styles/ui.css): its items in a row to swipe
// (`items`, each with its key, its name for screen readers, `label`, and what it shows, `content`), with native
// scroll-snap, so swiping works on a phone without JavaScript. Its layout (`layout`) is Material's:
// - 'uncontained' (the default): every item as wide as the others, as many as fit and the next one cut off at the edge,
//   reaching out to a phone's edges: one with the next peeking in, two on a tablet, three on a computer.
// - 'multi-browse': large items from the start, then a medium and a small one, as high as the theme says; each grows
//   and shrinks as it passes (carouselLayout.ts), for leafing quickly through many pictures.
// - 'hero': one large item (more on a wide screen) and a small one after it (`alignment` 'start', the default) or
//   between two small ones (`alignment` 'center'), for pictures to look at one by one, with the next one in sight.
// - 'full-screen': one item at a time, as wide as the carousel, out to a phone's edges.
// In the contained layouts (all but 'uncontained') an item's `content` fills its mask (.carousel-item-mask), as a
// picture should; a text on it can fade as it shrinks with --carousel-mask (0 to 1). Under them the theme's addition to
// M3's carousel, a page indicator: a dot for each item (`indicatorLabels`, what each says to a screen reader), which
// follows the scroll position and jumps to an item. On the site carousel.script.ts makes it work and shows it and lays
// out multi-browse and hero, in the editor it works here. No autoplay: the visitor decides the pace. `label`: what the
// carousel is called; `roleDescription` and `itemRoleDescription`: what it and an item are (aria-roledescription, in
// the site's language); `className` after its own classes (its place in the text). An Astro component gives an element
// the same classes with carouselClass.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useOnSite } from '@morphemecms/cms/src/standard/view';
import {
  carouselLayout,
  keylineLayouts,
  scrollFor,
  shownItem,
  type CarouselAlignment,
  type CarouselLayout,
} from '@theme/ui/carouselLayout';

export type { CarouselAlignment, CarouselLayout };
export type CarouselItem = { key: string; label: string; content: ReactNode };

/** The layouts of a carousel, as Material 3 names them. */
export const carouselLayouts: CarouselLayout[] = ['multi-browse', 'uncontained', 'hero', 'full-screen'];

/** A carousel's classes: a contained layout's (none for the default, uncontained), and a hero's aligned to the centre. */
export const carouselClass = (layout: CarouselLayout = 'uncontained', alignment: CarouselAlignment = 'start') =>
  [
    'carousel',
    layout !== 'uncontained' && `carousel-contained carousel-${layout}`,
    layout === 'hero' && alignment === 'center' && 'carousel-center',
  ]
    .filter(Boolean)
    .join(' ');

export default function Carousel({
  items,
  layout = 'uncontained',
  alignment = 'start',
  label,
  roleDescription,
  itemRoleDescription,
  indicatorLabels,
  className,
}: {
  items: CarouselItem[];
  layout?: CarouselLayout;
  alignment?: CarouselAlignment;
  label?: string;
  roleDescription: string;
  itemRoleDescription: string;
  indicatorLabels: string[];
  className?: string;
}) {
  const onSite = useOnSite();
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(0);
  const contained = layout !== 'uncontained';
  // In the editor: multi-browse and hero laid out here, as carousel.script.ts does on the site.
  useEffect(
    () => (root.current && keylineLayouts.includes(layout) ? carouselLayout(root.current) : undefined),
    [layout, alignment, items.length],
  );
  const go = (i: number) => row.current?.scrollTo({ left: scrollFor(row.current, i), behavior: 'smooth' });
  return (
    <div
      ref={root}
      className={[carouselClass(layout, alignment), className].filter(Boolean).join(' ')}
      role="region"
      aria-roledescription={roleDescription}
      aria-label={label || undefined}
      data-carousel=""
      data-carousel-layout={layout === 'uncontained' ? undefined : layout}
      data-carousel-alignment={layout === 'hero' && alignment === 'center' ? alignment : undefined}
    >
      <ul ref={row} className="carousel-items" data-carousel-items="" onScroll={(e) => setShown(shownItem(e.currentTarget))}>
        {items.map((item) => (
          <li
            key={item.key}
            className="carousel-item"
            aria-roledescription={itemRoleDescription}
            aria-label={item.label}
            data-carousel-item=""
          >
            {contained ? (
              <div className="carousel-item-mask" data-carousel-mask="">
                {item.content}
              </div>
            ) : (
              item.content
            )}
          </li>
        ))}
      </ul>

      <div className="carousel-indicator" data-carousel-indicator="" hidden={onSite}>
        {items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            className="carousel-indicator-dot"
            aria-label={indicatorLabels[i]}
            aria-current={onSite ? undefined : i === shown}
            data-carousel-dot=""
            onClick={() => go(i)}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}
