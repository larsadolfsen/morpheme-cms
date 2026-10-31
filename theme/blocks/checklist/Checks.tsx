// Lines with a check before each, a list without dividers (List.tsx in ../../ui/, .block-checklist in ../blocks.css):
// the standard block "Tjekliste", in two columns where there is room when it has six or more, and what is included on
// a card of "Priskort" (../pricecards/View.tsx). `className`: the classes of where it is (the space of a block in the
// text, a card's).
import List, { ListItem } from '@theme/ui/List';

export default function Checks({ items, className }: { items: string[]; className?: string }) {
  return (
    <List dividers="none" className={className ? `block-checklist ${className}` : 'block-checklist'}>
      {items.map((text, i) => (
        <ListItem key={i} leadingIcon="check" headline={text} />
      ))}
    </List>
  );
}
