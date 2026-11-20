// A type fixture, compiled by `npm run check:site-types` (never run): a site reads the shared texts of its blocks by name
// (blockTexts.offer.title), so `blockTexts` must keep its index signature, as it did before `segmented` was added.
import { blockTexts } from './site';

const names = [
  blockTexts.about,
  blockTexts.buttons,
  blockTexts.offer,
  blockTexts.posts,
  blockTexts.pricecard,
  blockTexts.prices,
  blockTexts.testimonials,
  blockTexts.segmented,
];
const readsKey: string = blockTexts.offer.title;
const readsDynamic: Record<string, any> = blockTexts['any-block-type'];

export const typecheck = { names, readsKey, readsDynamic };
