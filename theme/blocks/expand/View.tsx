// "List - Expand": its head in the text, then its rows, folded out (Accordion.tsx in this folder, closed to begin with) in its design (the
// rows on the page, or each on its own surface: `segmented`); with `Max rows` the rows after the first ones behind a button `Show more` (MoreRows.tsx);
// and its text button under the last row.
import Accordion from '@theme/blocks/expand/Accordion';
import ListButton from '@theme/blocks/ListButton';
import MoreRows from '@theme/blocks/MoreRows';
import type { ExpandView } from '@morphemecms/cms/src/standard/expand/view';
import { cutAt } from '@morphemecms/cms/src/standard/expand/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Expand({ view }: { view: ExpandView }) {
  const inText = useInText() || undefined;
  // `Max rows`: the rows after the first ones are in the HTML too (MoreRows.tsx).
  const cut = cutAt(view.max, view.rows.length);
  return (
    <>
      <MoreRows cut={cut} label={view.showMore} className={inText} after={<ListButton button={view.button} className={inText} />}>
        <div className={inText}>
          <Accordion
            rows={view.rows}
            group={view.group}
            several={view.several}
            cut={cut}
            oneColumn={view.oneColumn}
            segmented={view.design === 'segmented'}
          />
        </div>
      </MoreRows>
    </>
  );
}
