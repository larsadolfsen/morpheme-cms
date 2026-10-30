// "Spørgsmål og svar": its head in the text (BlockHead.tsx), then Accordion.tsx with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import Accordion from '@theme/blocks/faq/Accordion';
import type { FaqView } from '@interstellarcms/cms/src/standard/faq/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';

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
