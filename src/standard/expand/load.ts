// "Expandable list" on the site (view.ts): a folded row with a page and no text of its own has the opening of its page (pageOpening, from the
// site: @site/standard; on a new version of a page, /new/, the opening of the new versions), as in "Accordion", and a row whose
// page is missing is left out. The link's text is plain (`Read more`, without the row's heading). One open at a
// time in each list (its own group, by its place in the text).
import { standard } from '@site/standard';
import { markdownHtml } from '../../../lib/inline';
import { imageOf } from '../load';
import type { Load } from '../view';
import { loadRows } from '../rows/load';
import { withRows } from '../rows/rows.mjs';
import shared from '../list/shared';
import { expandOf, type ExpandView, type FoldRow } from './view';

export const load: Load<ExpandView> = async (all, { index, texts, preview }) => {
  const found = await loadRows(all);
  if (found && !found.rows.length) return null;
  const view = expandOf(withRows(all, found), texts.showMore ?? shared.values.showMore, imageOf);
  const rows = (
    await Promise.all(
      view.rows.map(async (row, i): Promise<FoldRow | null> => {
        // The row's text is Markdown (bold, italic, links, lists), made as the answers of the FAQ list were.
        const text = view.items[i]?.text?.trim();
        if (text) return { ...row, html: await markdownHtml(text) };
        if (row.html || !row.href) return row;
        const opening = await standard.pageOpening(row.href, preview);
        return opening === undefined ? null : { ...row, html: `<p>${opening.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>` };
      }),
    )
  ).filter((row) => row !== null);
  return { ...view, rows, group: `expand-${index}` };
};
