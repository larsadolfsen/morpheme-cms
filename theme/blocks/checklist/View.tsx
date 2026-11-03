// "Tjekliste": its head in the text (BlockHead.tsx), and Checks.tsx with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import Checks from '@theme/blocks/checklist/Checks';
import type { ChecklistView } from '@morphemecms/cms/src/standard/checklist/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Checklist({ view }: { view: ChecklistView }) {
  return (
    <>
      <BlockHead view={view} />
      <Checks items={view.items} className={useInText() || 'block-in-text'} />
    </>
  );
}
