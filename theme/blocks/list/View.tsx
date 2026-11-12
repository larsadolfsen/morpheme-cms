// "List": Rows.tsx with the spacing of a block in the text. It has no head of its own: a label, heading and intro are the text's.
import Rows from '@theme/blocks/list/Rows';
import type { ListView } from '@morphemecms/cms/src/standard/list/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function ListBlock({ view }: { view: ListView }) {
  return <Rows items={view.items} className={useInText() || undefined} />;
}
