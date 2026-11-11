// "Segmented list" on the site (view.ts): a folded row with a page and no text of its own has the opening of its page (pageOpening, from the
// site: @site/standard; on a new version of a page, /new/, the opening of the new versions), as in "Expandable list", and a row whose
// page is missing is left out. The link's text is the shared one of "Expandable list" (RichText.astro gives it as `texts`). One open at a
// time in each list (its own group, by its place in the text).
import { standard } from '@site/standard';
import type { Load } from '../view';
import shared from '../accordion/shared';
import { segmentedOf, type FoldRow, type SegmentedView } from './view';

export const load: Load<SegmentedView> = async (props, { index, texts, preview }) => {
  const view = segmentedOf(props, texts.more ?? shared.values.more);
  const rows = view.all
    ? view.rows
    : (
        await Promise.all(
          view.rows.map(async (row): Promise<FoldRow | null> => {
            if (row.html || !row.href) return row;
            const opening = await standard.pageOpening(row.href, preview);
            return opening === undefined ? null : { ...row, html: `<p>${opening.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>` };
          }),
        )
      ).filter((row) => row !== null);
  return { ...view, rows, group: `segmented-${index}` };
};
