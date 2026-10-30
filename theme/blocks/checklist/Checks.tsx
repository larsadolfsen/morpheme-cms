// Lines with a check in a circle in the accent before each (.block-checklist in ../blocks.css): the standard block
// "Tjekliste", in two columns where there is room when it has six or more, and what is included on a card of
// "Priskort" (../pricecards/View.tsx). `className`: the classes of where it is (the space of a block in the text, a
// card's).
import { Svg } from '@interstellarcms/cms/src/icon';

export default function Checks({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className ? `block-checklist ${className}` : 'block-checklist'}>
      {items.map((text, i) => (
        <li key={i}>
          <span className="block-check" aria-hidden="true">
            <Svg name="check" size={14} />
          </span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
