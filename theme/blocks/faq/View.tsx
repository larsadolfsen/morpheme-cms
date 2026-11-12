// "FAQ list": its head in the text (BlockHead.tsx), then Accordion.tsx with the spacing of a block in the text, and its text button.
import BlockHead from '@theme/blocks/BlockHead';
import Accordion from '@theme/blocks/faq/Accordion';
import ListButton from '@theme/blocks/ListButton';
import type { FaqView } from '@morphemecms/cms/src/standard/faq/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Faq({ view }: { view: FaqView }) {
  const inText = useInText() || undefined;
  return (
    <>
      <BlockHead view={view} />
      <div className={inText}>
        <Accordion rows={view.rows} group={view.group} several={view.several} />
      </div>
      <ListButton button={view.button} className={inText} />
    </>
  );
}
