// "Segmented list": its head in the text (BlockHead.tsx), then its rows, folded out (Accordion.tsx in ../faq/, closed to begin with) or, for a list
// from before whose rows are always open, each row on its own surface (Rows.tsx in ../list/); and its text button under the last row.
import BlockHead from '@theme/blocks/BlockHead';
import Accordion from '@theme/blocks/faq/Accordion';
import ListButton from '@theme/blocks/ListButton';
import Rows from '@theme/blocks/list/Rows';
import type { SegmentedView } from '@morphemecms/cms/src/standard/segmented/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Segmented({ view }: { view: SegmentedView }) {
  const inText = useInText() || undefined;
  return (
    <>
      <BlockHead view={view} />
      {view.all ? (
        <Rows items={view.items} segmented className={inText} />
      ) : (
        <div className={inText}>
          <Accordion rows={view.rows} group={view.group} several={view.several} />
        </div>
      )}
      <ListButton button={view.button} className={inText} />
    </>
  );
}
