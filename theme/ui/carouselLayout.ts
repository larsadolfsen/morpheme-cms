// How a carousel's items (Carousel.tsx) are laid out in Material's contained layouts that change the items' widths as
// they scroll (m3.material.io/components/carousel): 'multi-browse' (large items from the start, then a medium and a
// small one) and 'hero' (a large one and a small one after it, or, aligned to the centre, between two small ones). As
// Material's CarouselLayoutManager does it: every item is in the row as wide as a large one (so swiping and scroll-snap
// work as in any row), and its mask (.mo-carousel__item-mask) is moved and clipped to the size its place gives it. The
// places are keylines: where each item stands and how wide it is seen, with an item that is just leaving or coming in
// outside at each end. Scrolled to the start, the large ones are at the start (also in a hero aligned to the centre);
// scrolled to the end, at the end (center-aligned: the last item centred, with room after it, as the first one is at the start); between, the layout's own; and from one to the other the keylines move by
// themselves, so that every item grows and shrinks as it passes. Widths from the theme (--mo-comp-carousel-large-item-width,
// --mo-comp-carousel-small-item-min-width and -max-width, the gap and the height, in ui.css); what is masked of an item is on it
// as --mo-comp-carousel-mask (0 to 1), for what is on it to fade. The site's carousel.script.ts and, in the editor, Carousel.tsx
// run it; it gives back what stops it. The other layouts ('uncontained', 'multi-aspect-ratio', 'full-screen') are only cards.css.
export type CarouselLayout = 'multi-browse' | 'uncontained' | 'multi-aspect-ratio' | 'hero' | 'full-screen';
export type CarouselAlignment = 'start' | 'center';

/** The narrowest and widest an item of 'multi-aspect-ratio' can be, as width / height: M3's "Item widths can range anywhere between 9:16 for min width size to 16:9 for max width". */
export const aspectRange = { min: 9 / 16, max: 16 / 9 } as const;

/** An item's aspect ratio (width / height) kept within M3's range; 1:1, one of the four M3 prints, when none (or none usable) is given. */
export const aspectOf = (aspect?: number) =>
  typeof aspect === 'number' && Number.isFinite(aspect) && aspect > 0 ? Math.min(aspectRange.max, Math.max(aspectRange.min, aspect)) : 1;

/** The layouts laid out here, with their items' widths changing as they scroll. */
export const keylineLayouts: CarouselLayout[] = ['multi-browse', 'hero'];

/** The layouts carouselLayout() runs for: the keyline layouts, and the full-screen one, which is drawn as a hero where M3 says it does not work
 * (Guidelines, Full-screen: "It only works in portrait orientation in compact and medium breakpoints. Don't use this layout in landscape orientation"). */
export const scriptedLayouts: CarouselLayout[] = [...keylineLayouts, 'full-screen'];

/** From 840 dp (M3's expanded window class) and in landscape a full-screen carousel is a hero (the stored choice stays). */
export const FULL_SCREEN_AS_HERO = '(min-width: 52.5rem), (orientation: landscape)';

// Not in every TypeScript's DOM types yet (scroll-driven animations).
declare class ScrollTimeline extends AnimationTimeline {
  constructor(options: { source: Element; axis?: 'block' | 'inline' | 'x' | 'y' });
}

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
  // One item, or the layout does not fit: all at one size.
  const even = (n: number) => Array<number>(n).fill((width - (n - 1) * gap) / n);
  if (layout === 'hero') {
    // A large one at most twice as wide as it is high: more large ones on a wide screen. A center-aligned one always has exactly one large item,
    // centred between two small ones, which only grows with the width (M3, Guidelines: "A centered hero carousel has two small carousel items, with a large item centered").
    // Always followed by a small one (two for center-aligned: one on each side), also with two cards: never all at one size (M3, Specs: "at least one large and one small item").
    const smalls = Math.min(alignment === 'center' ? 2 : 1, count - 1);
    if (smalls < 1) return even(count);
    if (smalls < (alignment === 'center' ? 2 : 1)) {
      const l = width - smallMax - gap;
      return [l, smallMax];
    }
    let n = 1;
    const sizeOf = (k: number) => (width - smalls * smallMax - (k + smalls - 1) * gap) / k;
    while (alignment !== 'center' && sizeOf(n) > 2 * height && n + smalls < count) n++;
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
function stateOf(
  sizes: number[],
  width: number,
  gap: number,
  large: number,
  anchor: 'first' | 'last',
  edge = { start: gap, end: gap },
): State {
  const small = Math.min(...sizes);
  // The item outside at each end stands beyond the row's padding (the row shows its padding too), so that no sliver of it shows at rest (M3: "Carousel items must be fully visible on-screen").
  const lines: Keyline[] = [{ loc: -Math.max(gap, edge.start) - small / 2, size: small }];
  let x = 0;
  for (const size of sizes) {
    lines.push({ loc: x + size / 2, size });
    x += size + gap;
  }
  lines.push({ loc: width + Math.max(gap, edge.end) + small / 2, size: small });
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
 * alignment (data-carousel-alignment) as it scrolls and is resized; gives back what stops it. A full-screen one is a hero from 840 dp and in landscape. */
export function carouselLayout(root: HTMLElement): () => void {
  const declared = (root.dataset.carouselLayout ?? 'uncontained') as CarouselLayout;
  if (declared !== 'full-screen') return runLayout(root, declared);
  const query = matchMedia(FULL_SCREEN_AS_HERO);
  let stop = () => {};
  const sync = () => {
    stop();
    if (!query.matches) return void (stop = () => {});
    root.classList.replace('mo-is-full-screen', 'mo-is-hero');
    const run = runLayout(root, 'hero');
    stop = () => {
      run();
      root.classList.replace('mo-is-hero', 'mo-is-full-screen');
    };
  };
  query.addEventListener('change', sync);
  sync();
  return () => {
    query.removeEventListener('change', sync);
    stop();
  };
}

function runLayout(root: HTMLElement, layout: CarouselLayout): () => void {
  const alignment = (root.dataset.carouselAlignment ?? 'start') as CarouselAlignment;
  const row = root.querySelector<HTMLElement>('[data-carousel-items]');
  if (!row || !keylineLayouts.includes(layout)) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollDriven = typeof ScrollTimeline === 'function';
  const items = [...row.querySelectorAll<HTMLElement>('[data-carousel-item]')];
  const masks = items.map((item) => item.querySelector<HTMLElement>('[data-carousel-mask]'));
  let start: State, normal: State, end: State, large: number;
  let lead = 0;
  let toStart = 0;
  let toEnd = 0;
  // Read once in measure(), never per frame: reading offsetLeft or scrollWidth after the last frame's style writes forces a layout in the middle of a scroll.
  let at: number[] = [];
  let max = 0;
  // What was last written for each item (shift, inset, text fade): only a changed value is written, so a frame that changes nothing costs no style work.
  const written: { shift: number; inset: number; mask: number }[] = items.map(() => ({ shift: NaN, inset: NaN, mask: NaN }));
  // A fast scroll (a flick) moves the row further than this each frame: then only the shape (shift, inset) follows it, and the text fade settles when it slows.
  const FAST = 24;
  let last = 0;
  let settle = 0;

  function measure() {
    const style = getComputedStyle(row!);
    // The window the items are laid out in is the row less its padding (M3: 16dp leading and trailing padding): items scroll out under it.
    // A center-aligned hero has room after its last item, as wide as a small item and a gap, so that the last item can rest in the middle: space, not a drawn part.
    row!.style.paddingInlineEnd = '';
    const pad = parseFloat(style.paddingInlineStart) || 0;
    const padEnd = parseFloat(style.paddingInlineEnd) || 0;
    const width = row!.clientWidth - pad - padEnd;
    const gap = parseFloat(style.columnGap) || 0;
    const sizes = arrangement(layout, alignment, items.length, width, gap, {
      large: lengthOf(root, '--mo-comp-carousel-large-item-width', 200),
      smallMin: lengthOf(root, '--mo-comp-carousel-small-item-min-width', 40),
      smallMax: lengthOf(root, '--mo-comp-carousel-small-item-max-width', 56),
      height: row!.clientHeight,
    });
    large = Math.max(...sizes);
    if (layout === 'hero' && alignment === 'center' && items.length > 2)
      row!.style.paddingInlineEnd = `${padEnd + gap + lengthOf(root, '--mo-comp-carousel-small-item-max-width', 56)}px`;
    row!.style.setProperty('--mo-comp-carousel-item-width', `${large}px`);
    rests.delete(row!);
    const edge = { start: pad, end: padEnd };
    normal = stateOf(sizes, width, gap, large, 'first', edge);
    // Scrolled to the start, the large ones first (a hero) or, center-aligned, the leading small one and then the large one (small, large, small); to the end, the large ones last or,
    // center-aligned, the large one and then the trailing small one, mirroring the start (M3 is silent on the ends of the scroll: its Guidelines say "A centered hero carousel has two
    // small carousel items, with a large item centered", and "items automatically change size and snap into place to maintain the same layout"); between, the layout's own.
    start =
      alignment === 'center'
        ? { ...normal, offsets: normal.offsets.map((o) => o + large / 2 - normal.offsets[1]) }
        : stateOf(
            [...sizes].sort((a, b) => b - a),
            width,
            gap,
            large,
            'first',
            edge,
          );
    // Center-aligned: the row has room after the last item (below), so that it rests in the middle too and the layout there is the layout's own.
    end =
      alignment === 'center'
        ? normal
        : stateOf(
            [...sizes].sort((a, b) => a - b),
            width,
            gap,
            large,
            'last',
            edge,
          );
    // Where an item rests: its start this far before the first large keyline's (scroll-padding, for scroll-snap).
    lead = normal.lines[normal.focal].loc - large / 2;
    row!.style.scrollPaddingInlineStart = `${lead + pad}px`;
    toStart = start.offsets[0] - normal.offsets[0];
    toEnd = normal.offsets[0] - end.offsets[0];
    const first = items[0]?.offsetLeft ?? 0;
    at = items.map((item) => item.offsetLeft - first);
    max = row!.scrollWidth - row!.clientWidth;
    written.forEach((w) => (w.shift = w.inset = w.mask = NaN));
    drive();
    update();
  }

  // Scroll-driven path: where the browser can tie an animation to the row's scroll position (ScrollTimeline, Chrome 115 and later), each item gets
  // its shape as keyframes over the whole scroll, so that the browser moves the mask (transform) and clips it (clip-path) with the scroll itself, in
  // the frame the row is drawn at, without running this script while the row scrolls. The text's fade and its padding follow in the same timeline.
  // Other browsers run update() on scroll frames, as before.
  let driven = false;
  let animations: Animation[] = [];
  function undrive() {
    animations.forEach((a) => a.cancel());
    animations = [];
    driven = false;
    root.removeAttribute('data-carousel-driven');
  }
  function drive() {
    undrive();
    if (!scrollDriven || reduce.matches || max <= 0) return;
    const timeline = new ScrollTimeline({ source: row!, axis: 'inline' });
    const radius = (el: HTMLElement) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const radii = masks.map((m) => (m ? radius(m) : 0));
    const samples: { shift: number; inset: number; fade: number }[][] = [];
    const STEP = 6;
    const count = Math.max(2, Math.ceil(max / STEP) + 1);
    for (let n = 0; n < count; n++) samples.push(shapesAt((n / (count - 1)) * max));
    // Only the keyframes a straight line between them does not give: an item far from the window has two.
    const keep = (values: number[][]) => {
      const kept = [0];
      let anchor = 0;
      for (let n = 2; n < values.length; n++) {
        const ok = values
          .slice(anchor + 1, n)
          .every((v, m) => v.every((x, c) => Math.abs(x - lerp(values[anchor][c], values[n][c], (m + 1) / (n - anchor))) < 0.05));
        if (!ok) kept.push((anchor = n - 1));
      }
      kept.push(values.length - 1);
      return [...new Set(kept)];
    };
    const options = { timeline, fill: 'both' as FillMode, easing: 'linear' };
    // Keyframes of one channel (or more) of an item: `value(frame)` for each sample, only those a straight line between does not give.
    const frames = (values: number[][], make: (v: number[]) => Keyframe): Keyframe[] =>
      keep(values).map((n) => ({ offset: n / (count - 1), ...make(values[n]) }));
    items.forEach((item, i) => {
      const mask = masks[i];
      if (!mask) return;
      const shape = samples.map((frame) => frame[i]);
      // The mask: moved (transform, which the compositor does with the scroll itself) and clipped (clip-path, which the browser does in the frame the row is drawn at).
      animations.push(
        mask.animate(
          frames(
            shape.map((f) => [f.shift, f.inset]),
            ([shift, inset]) => ({
              transform: `translateX(${shift}px)`,
              clipPath: `inset(0px ${inset}px 0px ${inset}px round ${radii[i]}px)`,
            }),
          ),
          options,
        ),
      );
      // What on the item fades (data-carousel-fade="<where it starts> <how steeply>": 1 - (masked - start) * steep, opacity only: the compositor's).
      item.querySelectorAll<HTMLElement>('[data-carousel-fade]').forEach((el) => {
        const [from, steep] = el.dataset.carouselFade!.split(/\s+/).map(Number);
        animations.push(
          el.animate(
            frames(
              shape.map((f) => [Math.max(0, Math.min(1, 1 - (f.fade - from) * steep))]),
              ([opacity]) => ({ opacity: String(opacity) }),
            ),
            options,
          ),
        );
      });
      // What on the item keeps its distance from the clipped edge (data-carousel-inset="<padding>": that and the clipped part, at both sides).
      item.querySelectorAll<HTMLElement>('[data-carousel-inset]').forEach((el) => {
        animations.push(
          el.animate(
            frames(
              shape.map((f) => [f.inset]),
              ([inset]) => ({ paddingInline: `calc(${el.dataset.carouselInset} + ${inset}px)` }),
            ),
            options,
          ),
        );
      });
    });
    driven = true;
    root.setAttribute('data-carousel-driven', 'scroll');
    // What the script wrote before is not what is shown now.
    items.forEach((item, i) => {
      item.style.removeProperty('--mo-comp-carousel-mask');
      masks[i]?.style.removeProperty('transform');
      masks[i]?.style.removeProperty('--mo-comp-carousel-mask-inset');
    });
    written.forEach((w) => (w.shift = w.inset = w.mask = NaN));
  }

  // When the row has stopped, what the animation shows is also written as the custom properties (--mo-comp-carousel-mask-inset, --mo-comp-carousel-mask), which
  // what is drawn from them (and the editor's measurements) reads; nothing is written while it scrolls.
  function settleDriven() {
    const shapes = shapesAt(row!.scrollLeft);
    items.forEach((item, i) => {
      const mask = masks[i];
      const w = written[i];
      if (!mask) return;
      if (shapes[i].inset !== w.inset) mask.style.setProperty('--mo-comp-carousel-mask-inset', `${(w.inset = shapes[i].inset)}px`);
      if (shapes[i].fade !== w.mask) item.style.setProperty('--mo-comp-carousel-mask', String((w.mask = shapes[i].fade)));
    });
  }

  function update() {
    if (driven && !reduce.matches) return void settleDriven();
    // Reduced motion (M3, Accessibility): items do not grow or shrink as they pass; all are as large as a large one, the row reaching the edges.
    if (reduce.matches) {
      items.forEach((item, i) => {
        masks[i]?.style.removeProperty('transform');
        masks[i]?.style.setProperty('--mo-comp-carousel-mask-inset', '0px');
        item.style.setProperty('--mo-comp-carousel-mask', '0');
      });
      return;
    }
    const s = row!.scrollLeft;
    const fast = Math.abs(s - last) > FAST;
    last = s;
    clearTimeout(settle);
    if (fast) settle = window.setTimeout(update, 80);
    const shapes = shapesAt(s);
    items.forEach((item, i) => {
      const mask = masks[i];
      if (!mask) return;
      const { shift, inset, fade } = shapes[i];
      const w = written[i];
      if (shift !== w.shift) mask.style.transform = `translateX(${(w.shift = shift)}px)`;
      if (inset !== w.inset) mask.style.setProperty('--mo-comp-carousel-mask-inset', `${(w.inset = inset)}px`);
      if (!fast && fade !== w.mask) item.style.setProperty('--mo-comp-carousel-mask', String((w.mask = fade)));
    });
  }

  /** Where every item's mask is, how much of it is clipped and how much its text fades, with the row scrolled to `s`: the one place the shapes are worked out, for the script's frames and for the scroll-driven keyframes. */
  function shapesAt(s: number) {
    let state = start;
    if (max > 0) {
      // When the row is too short for both, each shift takes its share of it.
      const k = Math.min(1, max / (toStart + toEnd || 1));
      const a = toStart * k;
      const b = toEnd * k;
      state = s < a ? mix(start, normal, s / a) : s > max - b ? mix(normal, end, (s - (max - b)) / b) : normal;
    }
    const { lines, offsets } = state;
    return items.map((_, i) => {
      // Where its centre is in the row's window, and which two keylines it is between.
      const c = at[i] + large / 2 - s;
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
      return {
        shift: Math.round((loc - c) * 100) / 100,
        inset: Math.round(Math.max(0, (large - size) / 2) * 100) / 100,
        fade: Math.round(Math.max(0, Math.min(1, 1 - size / large)) * 1000) / 1000,
      };
    });
  }

  let frame = 0;
  // One update a frame, from the scroll position as it is then: a scroll event arriving before the frame runs does not queue another.
  const onScroll = () => {
    if (driven) {
      clearTimeout(settle);
      settle = window.setTimeout(settleDriven, 150);
      return;
    }
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), update()));
  };
  const onReduce = () => (drive(), update());
  row.addEventListener('scroll', onScroll, { passive: true });
  reduce.addEventListener('change', onReduce);
  const resized = new ResizeObserver(() => measure());
  resized.observe(row);
  measure();

  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(settle);
    row.removeEventListener('scroll', onScroll);
    reduce.removeEventListener('change', onReduce);
    resized.disconnect();
    undrive();
    row.style.removeProperty('--mo-comp-carousel-item-width');
    row.style.scrollPaddingInlineStart = '';
    items.forEach((item, i) => {
      item.style.removeProperty('--mo-comp-carousel-mask');
      masks[i]?.style.removeProperty('transform');
      masks[i]?.style.removeProperty('--mo-comp-carousel-mask-inset');
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

// What shownItem needs of a row, measured once: it runs on every scroll frame, and measuring forces a layout. Dropped when the row is resized or its
// items change (and by carouselLayout, which sizes the items).
const rests = new WeakMap<HTMLElement, ReturnType<typeof restOf> & { max: number }>();
const watched = new WeakSet<HTMLElement>();
function restCached(row: HTMLElement) {
  if (!watched.has(row)) {
    watched.add(row);
    const drop = () => void rests.delete(row);
    new ResizeObserver(drop).observe(row);
    new MutationObserver(drop).observe(row, { childList: true, subtree: true });
  }
  let r = rests.get(row);
  if (!r) rests.set(row, (r = { ...restOf(row), max: row.scrollWidth - row.clientWidth }));
  return r;
}

/** The item a carousel's row shows where it rests, for its page indicator. */
export function shownItem(row: HTMLElement) {
  const { items, lead, step, max } = restCached(row);
  if (items.length < 2) return 0;
  const end = row.scrollLeft >= max - 2;
  // Several items can be in view at once: at the end, the last one is the chosen one.
  return end ? items.length - 1 : Math.max(0, Math.min(items.length - 1, Math.round((row.scrollLeft + lead) / step)));
}
