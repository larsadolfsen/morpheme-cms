// Panel = Material 3's outlined card (m3.material.io/components/cards: "Three variants: elevated, filled, outlined"); the
// name Panel stays, as the theme and app contracts name it. A box: an outlined card (Card.tsx in ../ui/) that is a .mo-block-panel (../styles/blocks.css), with what is in it: its
// icon (`icon`) and its title (`headline`) first, when it has them, then the rest (its text, a list, buttons …, the card's content). The apps' boxes (@theme/blocks/Panel). A theme draws
// it its own way with its own blocks/Panel.tsx, with the same props. `as`: the element, a <section> unless the box is no
// part of the page's outline; `title` in an <h2>, or `titleAs`; `className`: the place's own, after
// the part's (useInText's in the text); the rest (aria-label, hidden, data-…) on the box.
import type { HTMLAttributes, ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import Card from '@theme/ui/Card';

type Props = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  as?: 'section' | 'div';
  icon?: string;
  title?: ReactNode;
  titleAs?: 'h2' | 'h3' | 'p';
  titleId?: string;
  [data: `data-${string}`]: string | undefined;
};

const levels = { h2: 2, h3: 3, p: undefined } as const;

export default function Panel({ as = 'section', icon, title, titleAs = 'h2', titleId, className, children, ...rest }: Props) {
  return (
    <Card
      as={as}
      className={className ? `mo-block-panel ${className}` : 'mo-block-panel'}
      icon={icon ? <Svg name={icon} size={24} /> : undefined}
      headline={title != null && title !== '' ? titleId ? <span id={titleId}>{title}</span> : title : undefined}
      headingLevel={levels[titleAs]}
      {...rest}
    >
      {children}
    </Card>
  );
}
