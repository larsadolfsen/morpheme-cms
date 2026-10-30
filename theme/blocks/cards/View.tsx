// "Kort": its head in the text (BlockHead.tsx), then LinkCards.tsx with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import LinkCards from '@theme/blocks/cards/LinkCards';
import type { CardsView } from '@interstellarcms/cms/src/standard/cards/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';

export default function Cards({ view }: { view: CardsView }) {
  return (
    <>
      <BlockHead view={view} />
      <LinkCards
        items={view.items}
        design={view.design}
        background={view.background}
        more={view.more}
        className={useInText() || undefined}
      />
    </>
  );
}
