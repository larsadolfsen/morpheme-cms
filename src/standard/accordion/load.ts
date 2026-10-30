// "Foldeliste" on the site (view.ts): a row without a text of its own has the opening of its page (pageOpening, from
// the site: @site/standard; on a new version of a page, /ny/, the opening of the new versions), and a row whose page
// is missing is left out. One open at a time in each list (its own group, by its place in the text).
import { standard } from '@site/standard';
import type { Load } from '../view';
import { headOf } from '../head';
import shared from './shared';
import { pageRow, type AccordionView, type PageRowProps } from './view';

export const load: Load<AccordionView> = async (props, { texts, index, preview }) => {
  const link: string = texts.more ?? shared.values.more;
  const rows = await Promise.all(
    ((props.items ?? []) as PageRowProps[]).map(async (row) => {
      const opening = await standard.pageOpening(row.href, preview);
      return opening === undefined ? null : pageRow(row, row.text?.trim() || opening, link);
    }),
  );
  return {
    ...headOf(props),
    group: `accordion-${index}`,
    rows: rows.filter((row) => row !== null),
  };
};
