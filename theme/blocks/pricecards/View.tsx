// "Price cards": its head in the text (BlockHead.tsx), then the cards side by side where there is room (.block-plans in
// ../blocks.css, as many columns as cards, two by two until there is room for four), under each other on a phone: each
// an outlined card (Card.tsx in ../../ui/) with a label when it is highlighted, its name, its price with what it is
// for, its text, what is included (../checklist/Checks.tsx) and its button at the bottom (../buttons/Buttons.tsx).
import BlockHead from '@theme/blocks/BlockHead';
import Buttons from '@theme/blocks/buttons/Buttons';
import Checks from '@theme/blocks/checklist/Checks';
import Card from '@theme/ui/Card';
import type { PriceCardsView } from '@morphemecms/cms/src/standard/pricecards/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function PriceCards({ view }: { view: PriceCardsView }) {
  return (
    <>
      <BlockHead view={view} />
      <div className={useInText('block-plans')}>
        <ul className={`block-plans-list block-plans-${view.items.length}`}>
          {view.items.map((c, i) => (
            <Card as="li" key={i} className={c.featured ? 'block-plan block-plan-featured' : 'block-plan'}>
              {c.badge && <span className="block-plan-badge">{c.badge}</span>}
              <h3 className="block-plan-name">{c.name}</h3>
              <p className="block-plan-price">
                <span className="block-plan-amount">{c.price}</span>
                {c.unit && <span className="block-plan-unit">{c.unit}</span>}
              </p>
              {c.text && <p className="block-plan-text">{c.text}</p>}
              {c.features.length > 0 && <Checks items={c.features} className="block-plan-features" />}
              {c.buttons.length > 0 && (
                <div className="block-buttons block-plan-buttons">
                  <Buttons buttons={c.buttons} />
                </div>
              )}
            </Card>
          ))}
        </ul>
      </div>
    </>
  );
}
