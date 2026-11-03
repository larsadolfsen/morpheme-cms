// A box: an outlined card (Card.tsx in ../ui/) that is a .block-panel (../styles/blocks.css), with what is in it: its
// icon and its title first, when it has them, then the rest (its text, a list, buttons …, each a .block-panel-part with
// room above it). The boxes of "Links" (links/LinkGroups.tsx) and the apps' boxes (@theme/blocks/Panel). A theme draws
// it its own way with its own blocks/Panel.tsx, with the same props. `as`: the element, a <section> unless the box is no
// part of the page's outline; `title` (also an empty one) in an <h2>, or `titleAs`; `className`: the place's own, after
// the part's (useInText's in the text); the rest (aria-label, hidden, data-…) on the box.
import type { HTMLAttributes, ReactNode } from 'react';
import { Svg } from '@morpheme/cms/src/icon';
import Card from '@theme/ui/Card';

type Props = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  as?: 'section' | 'div';
  icon?: string;
  title?: ReactNode;
  titleAs?: 'h2' | 'h3' | 'p';
  titleId?: string;
  [data: `data-${string}`]: string | undefined;
};

export default function Panel({ as = 'section', icon, title, titleAs: Title = 'h2', titleId, className, children, ...rest }: Props) {
  return (
    <Card as={as} className={className ? `block-panel ${className}` : 'block-panel'} {...rest}>
      {icon && <Svg name={icon} size={28} className="block-panel-icon" />}
      {title != null && (
        <Title className="block-panel-title" id={titleId}>
          {title}
        </Title>
      )}
      {children}
    </Card>
  );
}
