// "Segmented list": its head in the text (BlockHead.tsx), then its rows, folded out (Accordion.tsx in ../faq/, closed to begin with) or, for a list
// from before whose rows are always open, each row on its own surface (Rows.tsx in ../list/); with `Max rows` the rows after the first ones
// behind a button `Show more` (MoreRows.tsx); and its text button under the last row.
import BlockHead from '@theme/blocks/BlockHead';
import Accordion from '@theme/blocks/faq/Accordion';
import ListButton from '@theme/blocks/ListButton';
import MoreRows from '@theme/blocks/MoreRows';
import Rows from '@theme/blocks/list/Rows';
import type { SegmentedView } from '@morphemecms/cms/src/standard/segmented/view';
import { cutAt } from '@morphemecms/cms/src/standard/segmented/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Segmented({ view }: { view: SegmentedView }) {
  const inText = useInText() || undefined;
  // `Max rows`: the rows after the first ones are in the HTML too (MoreRows.tsx).
  const cut = cutAt(view.max, view.all ? view.items.length : view.rows.length);
  return (
    <>
      <BlockHead view={view} />
      <MoreRows cut={cut} label={view.showMore} className={inText}>
        {view.all ? (
          <Rows items={view.items} segmented className={inText} cut={cut} />
        ) : (
          <div className={inText}>
            <Accordion rows={view.rows} group={view.group} several={view.several} cut={cut} />
          </div>
        )}
      </MoreRows>
      <ListButton button={view.button} className={inText} />
    </>
  );
}
