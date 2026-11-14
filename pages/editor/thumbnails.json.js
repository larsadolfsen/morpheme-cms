// /editor/thumbnails.json: for each uploaded image (/images/uploads/…), its real `width` and `height` (so the staggered grid
// in "Files" reserves each box before the image loads) and its 480 px wide copy as `src` (/images/_r/…, made by
// packages/editor/scripts/responsive-images.mjs before the build), which the grid shows instead of the image itself
// (packages/editor/src/Media.tsx). An image without a copy (it is smaller) has no `src`, and the grid shows the image.
import fs from 'node:fs';
import path from 'node:path';

// From where the build runs, as packages/editor/site/images.mjs (this file is bundled elsewhere first).
const MANIFEST = path.resolve('src/data/image-manifest.json');
const WIDTH = 480;

export function GET() {
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const thumbnails = Object.fromEntries(
    Object.entries(manifest).map(([src, { width, height, variants }]) => {
      const small = variants.find((v) => v.w === WIDTH);
      return [src, { width, height, ...(small ? { src: small.src } : {}) }];
    }),
  );
  return new Response(JSON.stringify(thumbnails));
}
