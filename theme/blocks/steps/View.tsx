// "Steps": its head in the text, and StepList.tsx with the space of a block in the text.
import StepList from '@theme/blocks/steps/StepList';
import type { StepsView } from '@morphemecms/cms/src/standard/steps/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Steps({ view }: { view: StepsView }) {
  return (
    <>
      <StepList items={view.items} className={useInText() || 'mo-is-in-text'} />
    </>
  );
}
