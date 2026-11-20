// /editor/code-images.json: the uploaded images (/images/uploads/…) the site's own code uses (src/: its themes, apps
// and config, e.g. the portrait in src/site/config.ts), not in the texts the editor has. "Files" counts them as in use
// and does not offer to delete them (packages/editor/src/Media.tsx).
import fs from 'node:fs';
import path from 'node:path';

// The site's own code, from its root (the working directory).
const SRC = `${path.resolve('src')}/`;
// The texts are not the site's code; the editor reads them itself (and is not in src/).
const SKIP = ['content', 'data/image-manifest.json'];
const CODE = /\.(astro|ts|tsx|js|mjs|css)$/;
const ADDRESS = /\/images\/uploads\/[^\s'"`)<>,]+\.(?:webp|jpe?g|png|gif|svg|avif)/gi;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const file = path.join(dir, e.name);
    if (SKIP.includes(path.relative(SRC, file))) return [];
    return e.isDirectory() ? walk(file) : CODE.test(e.name) ? [file] : [];
  });
}

export function GET() {
  const used = new Set(walk(SRC).flatMap((file) => fs.readFileSync(file, 'utf8').match(ADDRESS) ?? []));
  return new Response(JSON.stringify([...used].sort()));
}
