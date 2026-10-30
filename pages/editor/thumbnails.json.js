// /editor/thumbnails.json: for each uploaded picture (/images/uploads/…), its 480 px wide copy
// (/images/_r/…, made by packages/editor/scripts/responsive-images.mjs before the build), which the grid in "Filer"
// shows instead of the picture itself (packages/editor/src/Media.tsx). A picture without one (it is
// smaller) is not in it, and the grid shows the picture.
import fs from 'node:fs';
import path from 'node:path';

// From where the build runs, as packages/editor/site/images.mjs (this file is bundled elsewhere first).
const MANIFEST = path.resolve('src/data/image-manifest.json');
const WIDTH = 480;

export function GET() {
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const thumbnails = Object.fromEntries(
    Object.entries(manifest).flatMap(([src, { variants }]) => {
      const small = variants.find((v) => v.w === WIDTH);
      return small ? [[src, small.src]] : [];
    }),
  );
  return new Response(JSON.stringify(thumbnails));
}
