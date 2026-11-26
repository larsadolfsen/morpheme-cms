// "Price cards": its head in the text, then the cards side by side where there is room (.mo-block-pricecards__plans in
// ../../styles/cards.css, as many columns as cards, two by two until there is room for four), under each other on a phone: each
// an outlined card (Card.tsx in ../../ui/) on its props: the label when it is highlighted (`icon`, the top of the card), the name
// (`headline`), the price with what it is for (`subhead`), the text (`supporting`), what is included (../checklist/Checks.tsx, the
// content) and the button at the bottom (`actions`; ../buttons/Buttons.tsx).
import Buttons from '@theme/blocks/buttons/Buttons';
import Checks from '@theme/blocks/checklist/Checks';
import Card from '@theme/ui/Card';
import type { PriceCardsView } from '@morphemecms/cms/src/standard/pricecards/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function PriceCards({ view }: { view: PriceCardsView }) {
  return (
    <>
      <div className={useInText('mo-block-pricecards__plans')}>
        <ul className={`mo-block-pricecards__plans-list mo-block-pricecards__plans-${view.items.length}`}>
          {view.items.map((c, i) => (
            <Card
              as="li"
              key={i}
              className={c.featured ? 'mo-block-pricecards__plan mo-is-featured' : 'mo-block-pricecards__plan'}
              icon={c.badge ? <span className="mo-block-pricecards__plan-badge">{c.badge}</span> : undefined}
              headline={c.name}
              headingLevel={3}
              subhead={
                <span className="mo-block-pricecards__plan-price">
                  <span className="mo-block-pricecards__plan-amount">{c.price}</span>
                  {c.unit && <span className="mo-block-pricecards__plan-unit">{c.unit}</span>}
                </span>
              }
              supporting={c.text || undefined}
              actions={
                c.buttons.length > 0 ? (
                  <div className="mo-block-buttons mo-block-pricecards__plan-buttons">
                    <Buttons buttons={c.buttons} />
                  </div>
                ) : undefined
              }
            >
              {c.features.length > 0 && <Checks items={c.features} className="mo-block-pricecards__plan-features" />}
            </Card>
          ))}
        </ul>
      </div>
    </>
  );
}
