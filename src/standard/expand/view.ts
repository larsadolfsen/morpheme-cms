// What "List - Expand" shows (its view, drawn by the theme's View.tsx): its head, its rows (an icon, a heading, a text and a page),
// that fold out (closed to begin with, one open at a time with `only`), its design (the rows on the page, or each on its own surface: `card`)
// and the text button under the last row. In the editor: viewOf; on the site: load.ts.
import { siteT } from '../../i18n';
import { oneLine } from '../../../lib/one-line.mjs';
import { markdownNow } from '../../../lib/markdown';
import { sharedIn } from '../../shared';
import listShared from '../list/shared';

export { cutAt, maxRowsOf } from '../rows/maxRows.mjs';
import type { ViewOf } from '../view';
import { editorRows } from '../rows/view';
import { withRows } from '../rows/rows.mjs';
import { headOf, type HeadView } from '../head';
import { columnsOf, type ColumnsView } from '../columns';
import { leadingOf, listSettings, type ListRow, type ListRowProps, type ListView } from '../list/view';
import type { PageRowView } from '../accordion/view';
import { shownAt } from '../../images';
import { libraryAltPart } from '../../imageAlt.mjs';
import { iconColorOf } from '../../iconColor';

/** A row that folds out: its heading, its text as HTML (empty without one), its icon and its page with the link's text. */
export type FoldRow = {
  label: string;
  html: string;
  icon?: string;
  iconColor?: string;
  /** What leads the row when it is an image (list/view.ts leadingOf). */
  leading?: ListRow['leading'];
  image?: ListRow['image'];
  letter?: string;
  href?: string;
  link?: string;
  buttons?: { label: string; href: string }[];
};

/** A row of the folding list the theme draws (theme/blocks/accordion/Accordion.tsx): a row with its text as HTML, or a page's row ("Accordion", PageRow). */
export type AccordionRow = FoldRow | { label: string; page: PageRowView };

export type ExpandView = HeadView &
  ColumnsView &
  Pick<ListView, 'design' | 'max' | 'button' | 'showMore'> & {
    /** The rows folded out: closed, one open at a time when `group`. */
    group?: string;
    /** Any number of rows can be open at once (`only` is off). */
    several: boolean;
    items: ListRow[];
    rows: FoldRow[];
  };

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** A row's text as paragraphs: a blank line starts a new one. */
export const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${oneLine(escape(p))}</p>`)
    .join('');

/** A row's text buttons: those with a text and a page, none when there are none (the "more" links of an old Accordion). */
const buttonsOf = (buttons: unknown): FoldRow['buttons'] => {
  const list = (Array.isArray(buttons) ? buttons : []).filter(
    (b): b is { label: string; href: string } =>
      typeof b?.label === 'string' && b.label.trim() !== '' && typeof b?.href === 'string' && b.href !== '',
  );
  return list.length ? list : undefined;
};

const isKind = (leading: unknown) => leading === 'avatar' || leading === 'square' || leading === 'landscape';

/** The view from the block's fields, without what only the site can know (its group). */
export const expandOf = (
  props: Record<string, any>,
  showMore: string = listShared.values.showMore as string,
  imageOf: (src: string) => { src: string; alt?: string } = (src) => ({ src }),
  /** A row's text as HTML: the editor's (markdownNow) or, by default, paragraphs; the site renders the Markdown in load.ts. */
  htmlOf: (text: string) => string = paragraphs,
): ExpandView => {
  const items = ((props.items ?? []) as ListRowProps[]).map((r) => ({ ...r, leading: props.leading })) as ListRow[];
  return {
    ...headOf(props),
    ...columnsOf(props),
    ...listSettings(props),
    several: props.only === false,
    items,
    rows: items.map((r) => ({
      label: r.title,
      html: htmlOf(r.text ?? ''),
      ...leadingOf(r as ListRowProps, r.title ?? '', imageOf),
      icon: !isKind(r.leading) && r.icon ? r.icon : undefined,
      iconColor: !isKind(r.leading) && r.icon ? iconColorOf(r.iconColor) : undefined,
      href: r.href || undefined,
      link: r.href ? siteT.blocks.expand.readMore : undefined,
      buttons: buttonsOf(r.buttons),
    })),
    showMore,
  };
};

/** In the editor a row with a page and no text of its own says it shows the beginning of the page's text. */
export const viewOf: ViewOf<ExpandView> = (props, data) => {
  const view = expandOf(
    withRows(props, editorRows(props, data)),
    sharedIn(data.site, 'list', listShared.values).showMore,
    (src) => ({
      src: shownAt(src),
      ...libraryAltPart(data.libraryAlt?.(src)),
    }),
    markdownNow,
  );
  return { ...view, rows: view.rows.map((r) => (!r.html && r.href ? { ...r, html: `<p>${siteT.blocks.accordion.opening}</p>` } : r)) };
};
