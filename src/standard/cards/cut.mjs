// The Cards block's one aspect ratio for its cards' images and what a card's image shows of it (image tools spec, sections 6 and 7); plain JavaScript so it is
// tested without the editor (cut.test.mjs).
import { ratioOf, splitPicture } from '../../../lib/crop.mjs';

/** The ratio every card's image is cut to unless the block says another (today's look). */
export const DEFAULT_RATIO = '3:2';

/** The aspects a card's image can have in the multi-aspect ratio layout, narrow to wide (Material 3: widths from 9:16 to 16:9). */
export const ASPECTS = ['9:16', '2:3', '3:4', '4:5', '1:1', '4:3', '3:2', '16:9'];

/** The card's own aspect ratio (multi-aspect ratio layout): one of ASPECTS; empty or unknown means 1:1. */
export const DEFAULT_ASPECT = '1:1';
export const aspectProp = (aspect) => (ASPECTS.includes(aspect) ? aspect : DEFAULT_ASPECT);

/** The block's aspect ratio for its cards' images (`ratio`): one of the formats; empty or unknown means 3:2. */
export const ratioProp = (props) => (ratioOf(props.ratio) ? String(props.ratio) : DEFAULT_RATIO);

/** A card's image address as it is drawn: the address without the format and crop words, and the crop (percent: left, top, width, height) only when it was
 * made for the block's ratio; else the middle part is shown, and a later change back to the old ratio finds the crop again. */
export function cutOf(address, ratio) {
  const { src, format, crop } = splitPicture(address);
  return { src, ...(crop && format === ratio ? { crop } : {}) };
}
