// What leads a row of "List" and "List - Expand" when it is not an icon (owner, 16 Nov 2026: examples with an avatar, a square image and a landscape
// image): the theme's List part draws them as Material 3's leading avatar (40dp, a letter or an image), leading image (56dp square) and leading
// video (100 x 56dp, here a landscape image). The props go on the ListItem, so no markup or class is made here.
/** An image as the List part draws it (theme/ui/List.tsx ListItemImage). */
type ListItemImage = { src: string; alt?: string };

type Leading = { leading?: 'avatar' | 'square' | 'landscape'; image?: ListItemImage; letter?: string };

export const leadingProps = (
  row: Leading,
): { leadingAvatar?: string | ListItemImage; leadingImage?: ListItemImage; leadingVideo?: ListItemImage } => {
  if (row.leading === 'avatar') return row.image || row.letter ? { leadingAvatar: row.image ?? row.letter } : {};
  if (row.leading === 'square' && row.image) return { leadingImage: row.image };
  if (row.leading === 'landscape' && row.image) return { leadingVideo: row.image };
  return {};
};
