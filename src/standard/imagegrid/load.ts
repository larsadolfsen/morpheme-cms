// "Image grid" on the site (view.ts): the images of Files with their tags, text, caption and credit (@site/standard), each with the sizes the site
// made of it (imageOf), the tags' names, and the shared texts with those saved over them.
import { standard } from '@site/standard';
import { imageOf } from '../load';
import type { Load } from '../view';
import shared from './shared';
import { gridOf, pickedImages, type ImageGridTexts, type ImageGridView } from './view';

export const load: Load<ImageGridView> = async (props, { texts }) => {
  const items = standard.images.list();
  // The names of the tags the shown images have (those the grid shows), asked once each.
  const shown = [...new Set(pickedImages(items, props).flatMap(({ item }) => item.tags))];
  const names = new Map(await Promise.all(shown.map(async (slug) => [slug, await standard.images.tag(slug)] as const)));
  return gridOf(items, props, { ...shared.values, ...texts } as ImageGridTexts, {
    image: imageOf,
    name: (slug) => names.get(slug) ?? slug,
  });
};
