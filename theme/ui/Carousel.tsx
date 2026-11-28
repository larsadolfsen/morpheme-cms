// A carousel (m3.material.io/components/carousel, .mo-carousel in ../styles/ui.css): its items in a row to swipe
// (`items`, each with its key, its name for screen readers, `label`, and what it shows, `content`), with native
// scroll-snap, so swiping works on a phone without JavaScript. Its layout (`layout`) is Material's:
// - 'uncontained' (the default): every item as wide as the others, as many as fit and the next one cut off at the edge,
//   reaching out to a phone's edges: one with the next peeking in, two on a tablet, three on a computer.
// - 'multi-aspect-ratio' (M3, new Nov 2025): the uncontained layout with items of various widths: every item as high as the theme says and as
//   wide as its `aspect` (width / height, 9:16 to 16:9, 1:1 without one) makes it, from the leading edge out to the trailing one, which has no
//   padding. Its items are images (their `content` fills the item's mask, with M3's 28dp corners) and scroll freely, with no snapping (M3:
//   "Default: Standard scrolling. Recommended for uncontained layouts").
// - 'multi-browse': large items from the start, then a medium and a small one, as high as the theme says; each grows
//   and shrinks as it passes (carouselLayout.ts), for leafing quickly through many images.
// - 'hero': one large item (more on a wide screen) and a small one after it (`alignment` 'start', the default) or
//   between two small ones (`alignment` 'center'), for images to look at one by one, with the next one in sight.
// - 'full-screen': one item at a time, as wide as the carousel, out to a phone's edges.
// In the contained layouts (all but 'uncontained') an item's `content` fills its mask (.mo-carousel__item-mask), as a
// image should; a text on it can fade as it shrinks with --mo-comp-carousel-mask (0 to 1). Under them, only when `indicatorLabels`
// is given, the theme's addition to M3's carousel, a page indicator: a dot for each item (what each says to a screen reader), which
// follows the scroll position and jumps to an item (M3 prints none: the Cards block's carousel has none). On the site
// carousel.script.ts makes it work and shows it and lays out multi-browse and hero, in the editor it works here. No autoplay: the visitor decides the pace. `label`: what the
// carousel is called; `roleDescription` and `itemRoleDescription`: what it and an item are (aria-roledescription, in
// the site's language); `className` after its own classes (its place in the text). An Astro component gives an element
// the same classes with carouselClass.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useOnSite } from '@morphemecms/cms/src/standard/view';
import {
  aspectOf,
  carouselLayout,
  scriptedLayouts,
  scrollFor,
  shownItem,
  type CarouselAlignment,
  type CarouselLayout,
} from '@theme/ui/carouselLayout';

export type { CarouselAlignment, CarouselLayout };
/** `focusable`: the item is a tab stop itself (an item with nothing to focus in it). `aspect`: width / height, only for the layout 'multi-aspect-ratio' (kept between 9/16 and 16/9; 1 without one). */
export type CarouselItem = { key: string; label: string; content: ReactNode; focusable?: boolean; aspect?: number };

/** The layouts of a carousel, as Material 3 names them. */
export const carouselLayouts: CarouselLayout[] = ['multi-browse', 'uncontained', 'multi-aspect-ratio', 'hero', 'full-screen'];

/** A carousel's classes: a contained layout's (none for the uncontained ones, the default and 'multi-aspect-ratio', which has its own), and a hero's aligned to the centre. */
export const carouselClass = (layout: CarouselLayout = 'uncontained', alignment: CarouselAlignment = 'start') =>
  [
    'mo-carousel',
    layout === 'multi-aspect-ratio' && 'mo-is-multi-aspect',
    layout !== 'uncontained' && layout !== 'multi-aspect-ratio' && `mo-is-contained mo-is-${layout}`,
    layout === 'hero' && alignment === 'center' && 'mo-carousel__center',
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
  itemsFocusable,
  className,
}: {
  items: CarouselItem[];
  layout?: CarouselLayout;
  alignment?: CarouselAlignment;
  label?: string;
  roleDescription: string;
  itemRoleDescription: string;
  indicatorLabels?: string[];
  /** Every item has something to focus in it (or is a tab stop itself): the row is then no tab stop, so the first Tab lands on the first item (M3, Accessibility, Initial focus). */
  itemsFocusable?: boolean;
  className?: string;
}) {
  const onSite = useOnSite();
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(0);
  const contained = layout !== 'uncontained';
  const multiAspect = layout === 'multi-aspect-ratio';
  // In the editor: multi-browse and hero laid out here, as carousel.script.ts does on the site.
  useEffect(
    () => (root.current && scriptedLayouts.includes(layout) ? carouselLayout(root.current) : undefined),
    [layout, alignment, items.length],
  );
  // With focusable items the row is no tab stop; where nothing in it can take focus (the editor's previews draw the items inert) it is one again.
  const [stop, setStop] = useState(!itemsFocusable);
  useEffect(() => {
    const el = row.current;
    if (!el || !itemsFocusable) return;
    const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';
    const check = () =>
      setStop(![...el.querySelectorAll<HTMLElement>(FOCUSABLE)].some((c) => !c.hasAttribute('disabled') && !c.closest('[inert]')));
    check();
    const watch = new MutationObserver(check);
    watch.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'tabindex', 'href', 'inert'] });
    return () => watch.disconnect();
  }, [itemsFocusable, items.length]);
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
      <ul
        ref={row}
        className="mo-carousel__items"
        data-carousel-items=""
        // A scroller the keyboard can reach (WCAG 2.1.1; axe: scrollable-region-focusable), named like the carousel; with focusable items (the Cards block's) the first of them is reached instead.
        tabIndex={stop ? 0 : undefined}
        aria-label={label || undefined}
        style={
          multiAspect
            ? ({
                '--mo-comp-carousel-widest': Math.max(...items.map((item) => aspectOf(item.aspect)), aspectOf(undefined)),
              } as CSSProperties)
            : undefined
        }
        onScroll={(e) => setShown(shownItem(e.currentTarget))}
      >
        {items.map((item) => (
          <li
            key={item.key}
            className="mo-carousel__item"
            aria-roledescription={itemRoleDescription}
            aria-label={item.label}
            data-carousel-item=""
            tabIndex={item.focusable ? 0 : undefined}
            style={multiAspect ? ({ '--mo-comp-carousel-item-aspect': aspectOf(item.aspect) } as CSSProperties) : undefined}
          >
            {contained ? (
              <div className="mo-carousel__item-mask" data-carousel-mask="">
                {item.content}
              </div>
            ) : (
              item.content
            )}
          </li>
        ))}
      </ul>

      {/* No page indicator for 'multi-aspect-ratio': its items differ in width, so a dot per step does not fit, and M3 prints none. */}
      {indicatorLabels && !multiAspect && (
        <div className="mo-carousel__indicator" data-carousel-indicator="" hidden={onSite}>
          {items.map((item, i) => (
            <button
              key={item.key}
              type="button"
              className="mo-carousel__indicator-dot"
              aria-label={indicatorLabels[i]}
              aria-current={onSite ? undefined : i === shown}
              data-carousel-dot=""
              onClick={() => go(i)}
            >
              <span />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
