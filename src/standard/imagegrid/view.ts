// What "Image grid" shows (its view, drawn by the theme's blocks/imagegrid/View.tsx): its head, the images (each with its own sizes, its
// alternative text by the one rule of src/imageAlt.mjs, its tags, caption and credit), the tags to filter by, what a card shows and its style,
// the columns, whether an image opens bigger, and its public texts (shared.ts). In the editor: viewOf, with the images of Files
// (BlockData.libraryImages); on the site: load.ts. Which images, their order and their number: filter.mjs.
import type { BlockData } from '../../blocks';
import { libraryAltPart, resolveAlt } from '../../imageAlt.mjs';
import { shownAt } from '../../images';
import { sharedIn } from '../../shared';
import { headOf, type HeadView } from '../head';
import type { Image, ViewOf } from '../view';
import { gridImages } from './filter.mjs';
import shared from './shared';

/** An image of Files as the block can use it: its address, what its record holds (src/fileRecords.mjs) and its tags (the slugs). */
export type ImageItem = {
  src: string;
  tags: string[];
  /** The Library's base text, and whether the Library marks it decorative. */
  alt?: string;
  decorative?: boolean;
  caption?: string;
  credit?: string;
};

/** An image in the grid: the sizes the site made of it (only the image in the editor), its text, tags, caption and credit. */
export type GridImage = Image & { alt: string; tags: string[]; caption?: string; credit?: string };

export const cardStyles = ['filled', 'elevated', 'outlined'] as const;
export type GridCard = (typeof cardStyles)[number];
export const columnChoices = ['2', '3', '4'] as const;

export type ImageGridTexts = {
  clear: string;
  empty: string;
  filter: string;
  count: string;
  /** The image viewer (the lightbox): its name, the buttons' names and the position ("{index} of {total}"). */
  viewer: string;
  close: string;
  previous: string;
  next: string;
  position: string;
};

export type ImageGridView = HeadView & {
  images: GridImage[];
  /** The tags the shown images have, with their names: the filter's chips (when `filter`) and the names on a card. */
  tags: { slug: string; name: string }[];
  /** Whether the filter is drawn: asked for, and the shown images have two tags or more (Material 3: a filter should not offer a single option). */
  filter: boolean;
  /** The tags that are on when the page opens (those the images have). */
  start: string[];
  /** Whether a tap opens the image bigger (on the site: the card is a link to the image without JavaScript). */
  open: boolean;
  /** What a card shows besides its image: its caption, its tags, its credit. */
  show: { caption: boolean; tags: boolean; credit: boolean };
  card: GridCard;
  /** 2, 3 or 4 columns on a computer; undefined: by the window (2, 3, 3 and 4). */
  columns?: string;
  texts: ImageGridTexts;
};

/** The block's own choice of images from its fields: those picked in the Library (in the order they were picked, with the text each has of its own),
 * or those with any of its tags (all without tags), in its order and at most its number of them. */
export function pickedImages(items: ImageItem[], props: Record<string, any>): { item: ImageItem; own?: string }[] {
  if (props.show === 'picked') {
    const rows = Array.isArray(props.picked) ? (props.picked as { image?: string; alt?: string }[]) : [];
    return rows.flatMap((row) => {
      if (!row?.image) return [];
      const src = String(row.image).split('#')[0];
      return [{ item: items.find((i) => i.src === src) ?? { src, tags: [] }, own: row.alt }];
    });
  }
  return gridImages(items, {
    anyOf: Array.isArray(props.tags) ? props.tags : [],
    order: props.order || undefined,
    max: props.max,
  }).map((item) => ({ item }));
}

/** The grid from the images chosen (pickedImages), as the editor and the site draw it: `how.image` gives an image its sizes (the editor: the image
 * itself; the site: its srcset, width and height), `how.name` a tag its name. */
export function gridOf(
  items: ImageItem[],
  props: Record<string, any>,
  texts: ImageGridTexts,
  how: { image: (src: string) => Image; name: (slug: string) => string },
): ImageGridView {
  const chosen = pickedImages(items, props);
  const images: GridImage[] = chosen.map(({ item, own }) => {
    const { alt } = resolveAlt({ alt: own }, { alt: item.alt, decorative: item.decorative });
    const { alt: _library, ...image } = how.image(item.src) as Image;
    return {
      ...image,
      alt,
      tags: item.tags,
      ...(item.caption ? { caption: item.caption } : {}),
      ...(item.credit ? { credit: item.credit } : {}),
    };
  });
  const slugs = [...new Set(images.flatMap((i) => i.tags))];
  const known = (tags: unknown) => (Array.isArray(tags) ? (tags as string[]).filter((tag) => slugs.includes(tag)) : []);
  return {
    ...headOf(props),
    images,
    tags: slugs.map((slug) => ({ slug, name: how.name(slug) })),
    filter: props.filter !== false && slugs.length >= 2,
    start: known(props.start),
    open: props.open !== false,
    show: { caption: props.showCaption === true, tags: props.showTags === true, credit: props.showCredit === true },
    card: cardStyles.find((c) => c === props.card) ?? 'filled',
    columns: columnChoices.find((c) => c === String(props.columns)),
    texts,
  };
}

/** The shared texts in the editor (in the site's language, with those saved over them). */
export const shownTexts = (data: BlockData) => sharedIn(data.site, 'imagegrid', shared.values) as ImageGridTexts;

export const viewOf: ViewOf<ImageGridView> = (props, data) =>
  gridOf(data.libraryImages ?? [], props, shownTexts(data), {
    image: (src) => ({ src: shownAt(src), ...libraryAltPart(data.libraryAlt?.(src)) }),
    name: (slug) => data.relations.categories?.find((o) => o.value === slug)?.label ?? slug,
  });
