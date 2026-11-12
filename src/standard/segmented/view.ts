// What "Segmented list" shows (its view, drawn by the theme's View.tsx): its head, its rows (an icon, a heading, a text and a page),
// whether they fold out (closed to begin with, one open at a time with `only`) or are always open (`all`, a "List" from before with each
// row on its own surface), and the text button under the last row. In the editor: viewOf; on the site: load.ts.
import { siteT } from '../../i18n';
import { sharedIn } from '../../shared';
import { filledLink } from '../accordion/topic.mjs';
import accordion from '../accordion/shared';
import segmentedShared from './shared';
import { maxRowsOf } from './maxRows.mjs';

export { cutAt, maxRowsOf } from './maxRows.mjs';
import type { ViewOf } from '../view';
import { editorRows } from '../rows/view';
import { withRows } from '../rows/rows.mjs';
import { headOf, type HeadView } from '../head';
import type { ListRow } from '../list/view';

/** A row that folds out: its heading, its text as HTML (empty without one), its icon and its page with the link's text. */
export type FoldRow = {
  label: string;
  html: string;
  icon?: string;
  href?: string;
  link?: string;
  buttons?: { label: string; href: string }[];
};

export type SegmentedView = HeadView & {
  /** The rows folded out (closed, one open at a time when `group`) or always open (`all`: the rows of a "List"). */
  all: boolean;
  group?: string;
  /** Any number of rows can be open at once (`only` is off). */
  several: boolean;
  items: ListRow[];
  rows: FoldRow[];
  button?: { label: string; href?: string };
  /** `Max rows`: how many rows show before the button; empty or not a whole number of at least 1: all rows (cutAt). */
  max?: number;
  /** The text of the button that shows the rest of the rows (shared text, "Blocks" › "Segmented list"). */
  showMore: string;
};

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** A row's text as paragraphs: a blank line starts a new one. */
export const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escape(p).replace(/\s*\n\s*/g, ' ')}</p>`)
    .join('');

/** The link in an open row: the shared text of "Expandable list" ("Read more about {topic}") with the row's heading in it. */
const linkFor = (more: string, title: string) => filledLink(more, title.toLowerCase());

/** A row's text buttons: those with a text and a page, none when there are none (the "more" links of an old Expandable list). */
const buttonsOf = (buttons: unknown): FoldRow['buttons'] => {
  const list = (Array.isArray(buttons) ? buttons : []).filter(
    (b): b is { label: string; href: string } =>
      typeof b?.label === 'string' && b.label.trim() !== '' && typeof b?.href === 'string' && b.href !== '',
  );
  return list.length ? list : undefined;
};

/** The view from the block's fields, without what only the site can know (its group). */
export const segmentedOf = (
  props: Record<string, any>,
  more: string = accordion.values.more as string,
  showMore: string = segmentedShared.values.showMore as string,
): SegmentedView => {
  const items = (props.items ?? []) as ListRow[];
  const label = typeof props.button === 'string' ? props.button.trim() : '';
  return {
    ...headOf(props),
    all: props.show === 'all',
    several: props.only === false,
    items,
    rows: items.map((r) => ({
      label: r.title,
      html: paragraphs(r.text ?? ''),
      icon: r.icon || undefined,
      href: r.href || undefined,
      link: r.href ? linkFor(more, r.title) : undefined,
      buttons: buttonsOf(r.buttons),
    })),
    button: label ? { label, href: props.buttonHref || undefined } : undefined,
    max: maxRowsOf(props.maxRows),
    showMore,
  };
};

/** In the editor a row with a page and no text of its own says it shows the beginning of the page's text. */
export const viewOf: ViewOf<SegmentedView> = (props, data) => {
  const view = segmentedOf(
    withRows(props, editorRows(props, data)),
    sharedIn(data.site, 'accordion', accordion.values).more,
    sharedIn(data.site, 'segmented', segmentedShared.values).showMore,
  );
  if (view.all) return view;
  return { ...view, rows: view.rows.map((r) => (!r.html && r.href ? { ...r, html: `<p>${siteT.blocks.accordion.opening}</p>` } : r)) };
};
