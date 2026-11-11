// What "Segmented list" shows (its view, drawn by the theme's View.tsx): its head, its rows (an icon, a heading, a text and a page),
// whether they fold out (closed to begin with, one open at a time with `only`) or are always open (`all`, a "List" from before with each
// row on its own surface), and the text button under the last row. In the editor: viewOf; on the site: load.ts.
import { siteT } from '../../i18n';
import { sharedIn } from '../../shared';
import { filledLink } from '../accordion/topic.mjs';
import accordion from '../accordion/shared';
import type { ViewOf } from '../view';
import { headOf, type HeadView } from '../head';
import type { ListRow } from '../list/view';

/** A row that folds out: its heading, its text as HTML (empty without one), its icon and its page with the link's text. */
export type FoldRow = { label: string; html: string; icon?: string; href?: string; link?: string };

export type SegmentedView = HeadView & {
  /** The rows folded out (closed, one open at a time when `group`) or always open (`all`: the rows of a "List"). */
  all: boolean;
  group?: string;
  /** Any number of rows can be open at once (`only` is off). */
  several: boolean;
  items: ListRow[];
  rows: FoldRow[];
  button?: { label: string; href?: string };
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

/** The view from the block's fields, without what only the site can know (its group). */
export const segmentedOf = (props: Record<string, any>, more: string = accordion.values.more as string): SegmentedView => {
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
    })),
    button: label ? { label, href: props.buttonHref || undefined } : undefined,
  };
};

/** In the editor a row with a page and no text of its own says it shows the beginning of the page's text. */
export const viewOf: ViewOf<SegmentedView> = (props, data) => {
  const view = segmentedOf(props, sharedIn(data.site, 'accordion', accordion.values).more);
  if (view.all) return view;
  return { ...view, rows: view.rows.map((r) => (!r.html && r.href ? { ...r, html: `<p>${siteT.blocks.accordion.opening}</p>` } : r)) };
};
