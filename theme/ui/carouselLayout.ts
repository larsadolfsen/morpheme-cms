// How a carousel's items (Carousel.tsx) are laid out in Material's contained layouts that change the items' widths as
// they scroll (m3.material.io/components/carousel): 'multi-browse' (large items from the start, then a medium and a
// small one) and 'hero' (a large one and a small one after it, or, aligned to the centre, between two small ones). As
// Material's CarouselLayoutManager does it: every item is in the row as wide as a large one (so swiping and scroll-snap
// work as in any row), and its mask (.carousel-item-mask) is moved and clipped to the size its place gives it. The
// places are keylines: where each item stands and how wide it is seen, with an item that is just leaving or coming in
// outside at each end. Scrolled to the start, the large ones are at the start (also in a hero aligned to the centre);
// scrolled to the end, at the end; between, the layout's own; and from one to the other the keylines move by
// themselves, so that every item grows and shrinks as it passes. Widths from the theme (--carousel-large-item-width,
// --carousel-small-item-min-width and -max-width, the gap and the height, in ui.css); what is masked of an item is on it
// as --carousel-mask (0 to 1), for what is on it to fade. The site's carousel.script.ts and, in the editor, Carousel.tsx
// run it; it gives back what stops it. The other layouts ('uncontained', 'full-screen') are only ui.css.
export type CarouselLayout = 'multi-browse' | 'uncontained' | 'hero' | 'full-screen';
export type CarouselAlignment = 'start' | 'center';

/** The layouts laid out here, with their items' widths changing as they scroll. */
export const keylineLayouts: CarouselLayout[] = ['multi-browse', 'hero'];

type Keyline = { loc: number; size: number };
type State = { lines: Keyline[]; offsets: number[]; focal: number };

/** A length the theme gives in a custom property (in px or rem), else `fallback` px. */
function lengthOf(el: HTMLElement, name: string, fallback: number) {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  if (value.endsWith('rem')) return n * parseFloat(getComputedStyle(document.documentElement).fontSize);
  return n;
}

/** The sizes the items are seen at in the layout's own arrangement, from its start, filling `width` with `gap`s. */
function arrangement(
  layout: CarouselLayout,
  alignment: CarouselAlignment,
  count: number,
  width: number,
  gap: number,
  { large, smallMin, smallMax, height }: { large: number; smallMin: number; smallMax: number; height: number },
): number[] {
  // As many large ones as there are items, side by side, when they all fit.
  const even = (n: number) => Array<number>(n).fill((width - (n - 1) * gap) / n);
  if (layout === 'hero') {
    // A large one at most twice as wide as it is high: more large ones on a wide screen.
    const smalls = alignment === 'center' ? 2 : 1;
    if (count <= smalls) return even(count);
    let n = 1;
    const sizeOf = (k: number) => (width - smalls * smallMax - (k + smalls - 1) * gap) / k;
    while (sizeOf(n) > 2 * height && n + smalls < count) n++;
    const l = sizeOf(n);
    const larges = Array<number>(n).fill(l);
    return alignment === 'center' ? [smallMax, ...larges, smallMax] : [...larges, smallMax];
  }
  // Multi-browse: large items, a medium one and a small one (without the medium one only where it does not fit), the
  // large ones as near the theme's width as they can be.
  let best: { sizes: number[]; cost: number } | undefined;
  for (const medium of [1, 0]) {
    for (let n = 1; n + medium + 1 <= count; n++)
      for (const small of [smallMax, smallMin]) {
        // n large (l), evt. a medium one halfway between a large and the small one, and the small one.
        const l = (width - small - (n + medium) * gap - (medium * small) / 2) / (n + medium / 2);
        if (l < small * 2) continue;
        const cost = Math.abs(l - large);
        if (!best || cost < best.cost) best = { sizes: [...Array<number>(n).fill(l), ...(medium ? [(l + small) / 2] : []), small], cost };
      }
    if (best) break;
  }
  return best?.sizes ?? even(Math.max(1, count));
}

/** The keylines of an arrangement, with one outside at each end, and the unmasked centres of the items that stand at
 * them: an item as wide as a large one (`large`) one step (`large` and a gap) after the other, from the first large one
 * (`anchor` 'first') or back from the last (`anchor` 'last'). */
function stateOf(sizes: number[], width: number, gap: number, large: number, anchor: 'first' | 'last'): State {
  const small = Math.min(...sizes);
  const lines: Keyline[] = [{ loc: -gap - small / 2, size: small }];
  let x = 0;
  for (const size of sizes) {
    lines.push({ loc: x + size / 2, size });
    x += size + gap;
  }
  lines.push({ loc: width + gap + small / 2, size: small });
  const at = (i: number) => Math.abs(lines[i].size - large) < 0.5;
  const focal = anchor === 'first' ? lines.findIndex((_, i) => at(i)) : lines.findLastIndex((_, i) => at(i));
  const step = large + gap;
  return { lines, offsets: lines.map((_, i) => lines[focal].loc + (i - focal) * step), focal };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: State, b: State, t: number): State => ({
  lines: a.lines.map((l, i) => ({ loc: lerp(l.loc, b.lines[i].loc, t), size: lerp(l.size, b.lines[i].size, t) })),
  offsets: a.offsets.map((o, i) => lerp(o, b.offsets[i], t)),
  focal: a.focal,
});

/** Lays out the carousel `root` (its [data-carousel-items] and their masks) in its layout (data-carousel-layout) and
 * alignment (data-carousel-alignment) as it scrolls and is resized; gives back what stops it. */
export function carouselLayout(root: HTMLElement): () => void {
  const layout = (root.dataset.carouselLayout ?? 'uncontained') as CarouselLayout;
  const alignment = (root.dataset.carouselAlignment ?? 'start') as CarouselAlignment;
  const row = root.querySelector<HTMLElement>('[data-carousel-items]');
  if (!row || !keylineLayouts.includes(layout)) return () => {};
  const items = [...row.querySelectorAll<HTMLElement>('[data-carousel-item]')];
  const masks = items.map((item) => item.querySelector<HTMLElement>('[data-carousel-mask]'));
  let start: State, normal: State, end: State, large: number;
  let lead = 0;
  let toStart = 0;
  let toEnd = 0;

  function measure() {
    const width = row!.clientWidth;
    const gap = parseFloat(getComputedStyle(row!).columnGap) || 0;
    const sizes = arrangement(layout, alignment, items.length, width, gap, {
      large: lengthOf(root, '--carousel-large-item-width', 200),
      smallMin: lengthOf(root, '--carousel-small-item-min-width', 40),
      smallMax: lengthOf(root, '--carousel-small-item-max-width', 56),
      height: row!.clientHeight,
    });
    large = Math.max(...sizes);
    row!.style.setProperty('--carousel-item-width', `${large}px`);
    // Scrolled to the start, the large ones first; to the end, last; between, the layout's own.
    start = stateOf(
      [...sizes].sort((a, b) => b - a),
      width,
      gap,
      large,
      'first',
    );
    normal = stateOf(sizes, width, gap, large, 'first');
    end = stateOf(
      [...sizes].sort((a, b) => a - b),
      width,
      gap,
      large,
      'last',
    );
    // Where an item rests: its start this far before the first large keyline's (scroll-padding, for scroll-snap).
    lead = normal.lines[normal.focal].loc - large / 2;
    row!.style.scrollPaddingInlineStart = `${lead}px`;
    toStart = start.offsets[0] - normal.offsets[0];
    toEnd = normal.offsets[0] - end.offsets[0];
    update();
  }

  function update() {
    const s = row!.scrollLeft;
    const max = row!.scrollWidth - row!.clientWidth;
    let state = start;
    if (max > 0) {
      // When the row is too short for both, each shift takes its share of it.
      const k = Math.min(1, max / (toStart + toEnd || 1));
      const a = toStart * k;
      const b = toEnd * k;
      state = s < a ? mix(start, normal, s / a) : s > max - b ? mix(normal, end, (s - (max - b)) / b) : normal;
    }
    const { lines, offsets } = state;
    const first = items[0]?.offsetLeft ?? 0;
    items.forEach((item, i) => {
      const mask = masks[i];
      if (!mask) return;
      // Where its centre is in the row's window, and which two keylines it is between.
      const c = item.offsetLeft - first + large / 2 - s;
      let loc: number;
      let size: number;
      const last = lines.length - 1;
      if (c <= offsets[0]) [loc, size] = [lines[0].loc + c - offsets[0], lines[0].size];
      else if (c >= offsets[last]) [loc, size] = [lines[last].loc + c - offsets[last], lines[last].size];
      else {
        const j = offsets.findIndex((o, n) => c >= o && c <= offsets[n + 1]);
        const t = (c - offsets[j]) / (offsets[j + 1] - offsets[j]);
        loc = lerp(lines[j].loc, lines[j + 1].loc, t);
        size = lerp(lines[j].size, lines[j + 1].size, t);
      }
      mask.style.transform = `translateX(${loc - c}px)`;
      mask.style.setProperty('--carousel-mask-inset', `${Math.max(0, (large - size) / 2)}px`);
      item.style.setProperty('--carousel-mask', String(Math.max(0, Math.min(1, 1 - size / large))));
    });
  }

  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  row.addEventListener('scroll', onScroll, { passive: true });
  const resized = new ResizeObserver(() => measure());
  resized.observe(row);
  measure();

  return () => {
    cancelAnimationFrame(frame);
    row.removeEventListener('scroll', onScroll);
    resized.disconnect();
    row.style.removeProperty('--carousel-item-width');
    row.style.scrollPaddingInlineStart = '';
    items.forEach((item, i) => {
      item.style.removeProperty('--carousel-mask');
      masks[i]?.style.removeProperty('transform');
      masks[i]?.style.removeProperty('--carousel-mask-inset');
    });
  };
}

// How much further than its padding an item rests from the row's start (its scroll-padding: a hero's small item before
// it), and the step from one item to the next.
function restOf(row: HTMLElement) {
  const style = getComputedStyle(row);
  const items = [...row.querySelectorAll<HTMLElement>('[data-carousel-item]')];
  return {
    items,
    lead: (parseFloat(style.scrollPaddingInlineStart) || 0) - (parseFloat(style.paddingInlineStart) || 0),
    step: (items[1]?.offsetLeft ?? 0) - (items[0]?.offsetLeft ?? 0) || 1,
  };
}

/** Where a carousel's row is scrolled to show item `i` where it rests. */
export function scrollFor(row: HTMLElement, i: number) {
  const { items, lead } = restOf(row);
  const target = items[Math.max(0, Math.min(items.length - 1, i))];
  return target ? target.offsetLeft - items[0].offsetLeft - lead : 0;
}

/** The item a carousel's row shows where it rests, for its page indicator. */
export function shownItem(row: HTMLElement) {
  const { items, lead, step } = restOf(row);
  if (items.length < 2) return 0;
  const end = row.scrollLeft >= row.scrollWidth - row.clientWidth - 2;
  // Several items can be in view at once: at the end, the last one is the chosen one.
  return end ? items.length - 1 : Math.max(0, Math.min(items.length - 1, Math.round((row.scrollLeft + lead) / step)));
}
