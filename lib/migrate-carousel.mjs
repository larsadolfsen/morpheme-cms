// MIGRATE-ONLY code for the Cards block's carousel (`phone: 'carousel'`), which no longer exists (0.19.8: the Carousel is a block of its own; owner, 27 Nov 2026:
// "A carouselle and s grid is not the same thing. There should not be such a setting."). It stays because sites skip versions: the editor's update goes straight
// to npm `latest`, so a site on an older version never runs 0.19.8's migrate, and a Cards block that is a carousel must still become a Carousel block in one run
// (CLAUDE.md, skill `developer`, *Removing a block or a stored form*). Never rewrite this to a Cards setting. It is wired as the last step of FORMER.cards in
// lib/blocks.mjs, so the editor and the site read such a block as a Carousel, and migrate-content.mjs writes it back.
//
// A Cards carousel has the block's one `media`, a `layout` ('' for Uncontained, else Material's name) and an optional `header`. As a Carousel block:
// - `layout`: '' is `uncontained` (the Carousel's own value, since an empty value reads as its default, Multi-browse); the others keep their names, except M3's two designs,
//   which are settings of their layout (0.19.8, four layouts): `multi-aspect-ratio` is `uncontained` with `multiAspectRatio: true`, `hero-center` is `hero` with `centerAligned: true`;
// - the items of the uncontained layouts (`uncontained`, `multi-aspect-ratio`) are cards (`card: true`), drawn in the block's variant (`design`, `color`), which the carousel
//   ignored before; in the other layouts an item is an image or a video filling it, with its label, so there is no `card`;
// - the block's `media` is on each item (`media`: none, icon or video; an image is the empty choice and is not written), and the fields of the other media are dropped;
// - `header`, `design`, `color` and `ratio` are carried over, `phone` is dropped; the items' buttons, page and divider stay as they were.
// A Cards block that is not a carousel loses `phone`, `layout` and `header` (a grid has none of them), and nothing else changes.

/** The layouts that take card items (the Carousel's `cardLayouts` in src/standard/carousel/view.ts). */
const CARD_LAYOUTS = ['uncontained', 'multi-aspect-ratio'];
const LAYOUTS = ['multi-browse', 'uncontained', 'multi-aspect-ratio', 'hero', 'hero-center', 'full-screen'];
const MEDIA = ['none', 'icon', 'image', 'video'];

const object = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** One item of a Cards carousel as an item of the Carousel block. */
function itemOf(c, media, card) {
  if (!object(c)) return c;
  const { media: own, icon, iconColor, image, alt, aspect, video, ...rest } = c;
  const kind = MEDIA.includes(own) ? own : media;
  return {
    ...(kind === 'image' ? {} : { media: kind }),
    ...(card ? { card: true } : {}),
    ...(kind === 'icon' && icon ? { icon } : {}),
    ...(kind === 'icon' && iconColor ? { iconColor } : {}),
    ...(kind === 'image' && image ? { image } : {}),
    ...(kind === 'image' && alt ? { alt } : {}),
    ...(kind === 'image' && aspect ? { aspect } : {}),
    ...(kind === 'video' && video ? { video } : {}),
    ...rest,
  };
}

/** A block as `{ type, props }` (what FORMER gives): a Cards block that is a carousel as a Carousel block, any other Cards block without the settings of a carousel, any
 * other block as it is.
 * @param {{ type: string, props: Record<string, any> }} block
 * @returns {{ type: string, props: Record<string, any> }} */
export function carouselOf(block) {
  if (block.type !== 'cards') return block;
  const { phone, layout, header, media: blockMedia, items, ...rest } = block.props;
  if (phone !== 'carousel') {
    if (phone === undefined && layout === undefined && header === undefined) return block;
    return {
      type: 'cards',
      props: { ...rest, ...(blockMedia === undefined ? {} : { media: blockMedia }), ...(items === undefined ? {} : { items }) },
    };
  }
  const now = layout === '' || layout === undefined ? 'uncontained' : LAYOUTS.includes(layout) ? layout : 'uncontained';
  const card = CARD_LAYOUTS.includes(now);
  const layoutProps =
    now === 'multi-aspect-ratio'
      ? { layout: 'uncontained', multiAspectRatio: true }
      : now === 'hero-center'
        ? { layout: 'hero', centerAligned: true }
        : { layout: now };
  const media = MEDIA.includes(blockMedia) ? blockMedia : 'icon';
  return {
    type: 'carousel',
    props: {
      ...layoutProps,
      ...(typeof header === 'string' && header.trim() ? { header } : {}),
      ...rest,
      ...(Array.isArray(items) ? { items: items.map((c) => itemOf(c, media, card)) } : {}),
    },
  };
}
