// "Checklist": its head in the text, and Checks.tsx with the space of a block in the text.
import Checks from '@theme/blocks/checklist/Checks';
import type { ChecklistView } from '@morphemecms/cms/src/standard/checklist/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Checklist({ view }: { view: ChecklistView }) {
  return (
    <>
      <Checks items={view.items} className={useInText() || 'mo-is-in-text'} />
    </>
  );
}
