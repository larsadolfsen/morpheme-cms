// "Trin": its head in the text (BlockHead.tsx), and StepList.tsx with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import StepList from '@theme/blocks/steps/StepList';
import type { StepsView } from '@morphemecms/cms/src/standard/steps/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Steps({ view }: { view: StepsView }) {
  return (
    <>
      <BlockHead view={view} />
      <StepList items={view.items} className={useInText() || 'block-in-text'} />
    </>
  );
}
