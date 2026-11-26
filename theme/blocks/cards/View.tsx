// "Cards": its head in the text, then LinkCards.tsx with the space of a block in the text.
import LinkCards from '@theme/blocks/cards/LinkCards';
import type { CardsView } from '@morphemecms/cms/src/standard/cards/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Cards({ view }: { view: CardsView }) {
  return (
    <>
      <LinkCards
        items={view.items}
        design={view.design}
        color={view.color}
        phone={view.phone}
        layout={view.layout}
        more={view.more}
        className={useInText() || undefined}
      />
    </>
  );
}
