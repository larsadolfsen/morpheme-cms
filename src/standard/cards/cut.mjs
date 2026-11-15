// The Cards block's one aspect ratio for its cards' images and what a card's image shows of it (image tools spec, sections 6 and 7); plain JavaScript so it is
// tested without the editor (cut.test.mjs).
import { ratioOf, splitPicture } from '../../../lib/crop.mjs';

/** The ratio every card's image is cut to unless the block says another (today's look). */
export const DEFAULT_RATIO = '3:2';

/** The block's aspect ratio for its cards' images (`ratio`): one of the formats; empty or unknown means 3:2. */
export const ratioProp = (props) => (ratioOf(props.ratio) ? String(props.ratio) : DEFAULT_RATIO);

/** A card's image address as it is drawn: the address without the format and crop words, and the crop (percent: left, top, width, height) only when it was
 * made for the block's ratio; else the middle part is shown, and a later change back to the old ratio finds the crop again. */
export function cutOf(address, ratio) {
  const { src, format, crop } = splitPicture(address);
  return { src, ...(crop && format === ratio ? { crop } : {}) };
}
