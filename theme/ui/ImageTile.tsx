// An image tile (the Library's, the pickers'): the theme's Card with a media, the image only, in its own proportions
// (`ratio`: width / height, so the box is there before the image loads), a button that picks it. `selected`: Material 3's
// selection (a check mark and the selected surface, never a ring); undefined: not a choice. Cards in a grid (.image-grid) stand
// in staggered columns. The image is `children` (the editor draws it fetched when near).
import type { ReactNode } from 'react';
import Card, { CardMedia, type CardKind } from './Card';

export default function ImageTile({
  ratio,
  selected,
  label,
  kind = 'filled',
  children,
  ...rest
}: {
  ratio?: number;
  selected?: boolean;
  /** Its name for a screen reader: the image has no text of its own here. */
  label: string;
  kind?: CardKind;
  children: ReactNode;
  /** What a button takes (a handler, aria-…, data-…), for the Library's selecting. */
  [prop: string]: unknown;
}) {
  return (
    <Card
      as="button"
      kind={kind}
      media
      selected={selected}
      aria-label={label}
      aria-pressed={selected === undefined ? undefined : selected}
      {...rest}
    >
      <CardMedia ratio={ratio}>{children}</CardMedia>
    </Card>
  );
}
