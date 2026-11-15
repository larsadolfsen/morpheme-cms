// "List": Rows.tsx with the spacing of a block in the text. It has no head of its own: a label, heading and intro are the text's.
// With `card: 'one'` the rows stand in one Card of the style `design` (a non-actionable <div>, no role); the card then has the block's
// spacing in the text, and without it the markup is the list's alone.
import Rows from '@theme/blocks/list/Rows';
import Card from '@theme/ui/Card';
import type { ListView } from '@morphemecms/cms/src/standard/list/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function ListBlock({ view }: { view: ListView }) {
  const inText = useInText();
  if (view.card !== 'one') return <Rows items={view.items} className={inText || undefined} />;
  return (
    <Card as="div" kind={view.design} className={['block-list-card', inText].filter(Boolean).join(' ')}>
      <Rows items={view.items} />
    </Card>
  );
}
