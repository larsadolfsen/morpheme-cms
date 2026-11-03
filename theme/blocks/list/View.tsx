// "Liste": its head in the text (BlockHead.tsx), and Rows.tsx with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import Rows from '@theme/blocks/list/Rows';
import type { ListView } from '@morphemecms/cms/src/standard/list/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function ListBlock({ view }: { view: ListView }) {
  return (
    <>
      <BlockHead view={view} />
      <Rows items={view.items} design={view.design} className={useInText() || undefined} />
    </>
  );
}
