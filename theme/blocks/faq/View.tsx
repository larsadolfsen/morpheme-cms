// "Questions and answers": its head in the text (BlockHead.tsx), then Accordion.tsx with the spacing of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import Accordion from '@theme/blocks/faq/Accordion';
import type { FaqView } from '@morphemecms/cms/src/standard/faq/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Faq({ view }: { view: FaqView }) {
  return (
    <>
      <BlockHead view={view} />
      <div className={useInText() || undefined}>
        <Accordion rows={view.rows} group={view.group} />
      </div>
    </>
  );
}
