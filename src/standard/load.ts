// What the standard blocks' load.ts (view.tsx) share on the site, when it is built: they may read the site's content
// (@site/standard). Never imported by the editor.
import { standard } from '@site/standard';
import type { Image } from './view';

/** An image with the sizes the site has made of it (srcset, width and height). */
export const imageOf = (src: string): Image => ({ src, ...standard.posts.image(src) });
