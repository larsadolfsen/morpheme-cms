// What "List" shows (its view, drawn by the theme's View.tsx and Rows.tsx): each row's icon, heading, text and page. A row with a page and no heading of its own has the page's title (the pages' links of "Links" are
// rows like that), one whose page is missing is left out, and one with only a text keeps it. In the editor: viewOf, from the site's pages; on the site: load.ts. (The label,
// heading and intro the block had are the text's own now, lib/remark-list-head.mjs.)
import { shownAt } from '../../images';
import { libraryAltPart } from '../../imageAlt.mjs';
import { sharedIn } from '../../shared';
import type { ViewOf } from '../view';
import { editorRows } from '../rows/view';
import { withRows } from '../rows/rows.mjs';
import { maxRowsOf } from '../rows/maxRows.mjs';
import listShared from './shared';

export { cutAt, maxRowsOf } from '../rows/maxRows.mjs';
import { columnsOf, type ColumnsView } from '../columns';

/** `iconColor`: a color role of the site (src/iconColor.ts), Primary without one. */
export type ListRow = {
  icon?: string;
  iconColor?: string;
  /** What leads the row when it is an image (no value: its icon): an avatar, a square image or a landscape image. */
  leading?: 'avatar' | 'square' | 'landscape';
  /** The leading image (the address as the site draws it, and its alternative text); an avatar without one shows the first letter of the heading. */
  image?: { src: string; alt?: string };
  /** The first letter of the heading, for an avatar that has no image. */
  letter?: string;
  title: string;
  text?: string;
  href?: string;
  buttons?: { label: string; href: string }[];
};
/** `design`: each row on its own surface (`segmented`), else the rows on the page. `max`: `Max rows`, how many rows show before the button (maxRows.mjs). */
export type ListView = ColumnsView & {
  items: ListRow[];
  design?: 'segmented';
  max?: number;
  /** A text button under the last row. */
  button?: { label: string; href?: string };
  /** The text of the button that shows the rest of the rows (shared text, "Blocks" › "List"). */
  showMore: string;
};

/** What the block's fields say besides its rows: its design, `Max rows` and the text button under the last row (the same for "Expandable list"). */
export const listSettings = (props: Record<string, any>): Pick<ListView, 'design' | 'max' | 'button'> => {
  const label = typeof props.button === 'string' ? props.button.trim() : '';
  return {
    design: props.design === 'segmented' ? 'segmented' : undefined,
    max: maxRowsOf(props.maxRows),
    button: label ? { label, href: props.buttonHref || undefined } : undefined,
  };
};

/** A row as its fields write it: without a heading of its own when it has a page; `image` is the address, `alt` its text. */
export type ListRowProps = Omit<Partial<ListRow>, 'image'> & { image?: string; alt?: string };

const KINDS = ['avatar', 'square', 'landscape'] as const;

/** What leads a row: its kind and image (or letter), when it is an image; the icon is no kind. `imageOf`: the address as the site or the editor draws it. */
export const leadingOf = (
  row: ListRowProps,
  title: string,
  imageOf: (src: string) => { src: string; alt?: string },
): Pick<ListRow, 'leading' | 'image' | 'letter'> => {
  const leading = KINDS.find((k) => k === row.leading);
  if (!leading) return {};
  const src = typeof row.image === 'string' ? row.image.trim() : '';
  const alt = typeof row.alt === 'string' && row.alt.trim() ? { alt: row.alt.trim() } : {};
  const picture = src ? { ...imageOf(src), ...alt } : undefined;
  return {
    leading,
    ...(picture ? { image: picture } : {}),
    ...(!picture && leading === 'avatar' && title ? { letter: [...title][0]!.toUpperCase() } : {}),
  };
};

/** The view from the block's fields; `titleOf`: a page's title by its address, undefined when there is no such page. */
export const listOf = (
  props: Record<string, any>,
  titleOf: (href: string) => string | undefined,
  showMore: string = listShared.values.showMore as string,
  imageOf: (src: string) => { src: string; alt?: string } = (src) => ({ src }),
): ListView => ({
  ...columnsOf(props),
  ...listSettings(props),
  showMore,
  items: ((props.items ?? []) as ListRowProps[]).flatMap((row) => {
    const title = row.title?.trim() || (row.href ? titleOf(row.href) : undefined);
    // A row with no heading and no page still has its text: it is shown (with an empty heading), never dropped. A row with nothing in it, or whose
    // page is missing, is left out.
    if (!title && !(!row.href && row.text?.trim())) return [];
    const { image: _image, alt: _alt, leading: _leading, ...rest } = row;
    const lead = leadingOf({ ...row, leading: props.leading }, title ?? '', imageOf);
    // A row that leads with an image has no icon (it may still be saved in the row, hidden in the sheet).
    const { icon: _icon, iconColor: _color, ...noIcon } = rest;
    return [{ ...(lead.leading ? noIcon : rest), title: title ?? '', ...lead }];
  }),
});

export const viewOf: ViewOf<ListView> = (props, data) => {
  const byPath = new Map(data.site.pages.map((p) => [p.path, p.title]));
  return listOf(
    withRows(props, editorRows(props, data)),
    (href) => byPath.get(href),
    sharedIn(data.site, 'list', listShared.values).showMore,
    (src) => ({ src: shownAt(src), ...libraryAltPart(data.libraryAlt?.(src)) }),
  );
};
