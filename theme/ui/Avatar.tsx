// The avatar (Material 3's Lists, Specs, "Leading avatar"; M3 has no page of its own for it): a round mark with a person's or a thing's
// letter or image. `children` is the letter (or letters) shown in it; `image` draws an image in its place. It is 40dp across, set by
// `--mo-comp-avatar-size`, and it is the leading avatar of a ListItem and the thumbnail of a card.
// The look is css, `theme/styles/ui/avatar.css` (tokens: `theme/styles/tokens/ui/comp/avatar.css`).
import type { ReactNode } from 'react';

export type AvatarImage = { src: string; alt?: string };

export type AvatarProps = {
  /** The letter or letters shown when there is no image. Hidden from assistive technology: the row's text names the item. */
  children?: ReactNode;
  /** An image in place of the letter. */
  image?: AvatarImage;
  className?: string;
};

export const avatarClass = 'mo-avatar';

export default function Avatar({ children, image, className }: AvatarProps) {
  const classes = className ? `${avatarClass} ${className}` : avatarClass;
  return image ? (
    <img src={image.src} alt={image.alt ?? ''} className={classes} loading="lazy" />
  ) : (
    <span className={classes}>{children}</span>
  );
}
