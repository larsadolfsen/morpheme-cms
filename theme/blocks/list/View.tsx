// "List": Rows.tsx with the spacing of a block in the text, in its design (the rows on the page, or each on its own surface: `segmented`); with `Max rows` the
// rows after the first ones behind a button `Show more` (MoreRows.tsx), and its text button under the last row. It has no head of its own: a
// label, heading and intro are the text's.
import ListButton from '@theme/blocks/ListButton';
import MoreRows from '@theme/blocks/MoreRows';
import Rows from '@theme/blocks/list/Rows';
import { cutAt, type ListView } from '@morphemecms/cms/src/standard/list/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function ListBlock({ view }: { view: ListView }) {
  const inText = useInText() || undefined;
  // `Max rows`: the rows after the first ones are in the HTML too (MoreRows.tsx).
  const cut = cutAt(view.max, view.items.length);
  return (
    <>
      <MoreRows cut={cut} label={view.showMore} className={inText} after={<ListButton button={view.button} className={inText} />}>
        <Rows items={view.items} segmented={view.design === 'segmented'} className={inText} cut={cut} oneColumn={view.oneColumn} />
      </MoreRows>
    </>
  );
}
