// "Cards": its head in the text (BlockHead.tsx), then LinkCards.tsx with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import LinkCards from '@theme/blocks/cards/LinkCards';
import type { CardsView } from '@morphemecms/cms/src/standard/cards/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Cards({ view }: { view: CardsView }) {
  return (
    <>
      <BlockHead view={view} />
      <LinkCards
        items={view.items}
        design={view.design}
        color={view.color}
        phone={view.phone}
        label={view.heading}
        more={view.more}
        className={useInText() || undefined}
      />
    </>
  );
}
