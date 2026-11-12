// "Buttons": its own buttons, or the shared ones, in a row, on a phone under each other in the full width.
import Buttons from '@theme/blocks/buttons/Buttons';
import type { ButtonsView } from '@morphemecms/cms/src/standard/buttons/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function ButtonsBlock({ view }: { view: ButtonsView }) {
  return (
    <div className={useInText('block-buttons')}>
      <Buttons buttons={view.buttons} />
    </div>
  );
}
