// "Expandable list": its head in the text (BlockHead.tsx), then its rows (Accordion.tsx in ../faq/, each
// with PageRow.tsx) with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import Accordion from '@theme/blocks/faq/Accordion';
import type { AccordionView } from '@morphemecms/cms/src/standard/accordion/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function AccordionBlock({ view }: { view: AccordionView }) {
  return (
    <>
      <BlockHead view={view} />
      <div className={useInText() || undefined}>
        <Accordion rows={view.rows.map((page) => ({ label: page.label, page }))} group={view.group} />
      </div>
    </>
  );
}
