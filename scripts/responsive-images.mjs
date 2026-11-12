#!/usr/bin/env node
// Responsive image variants. Runs automatically before `npm run build` and `npm run dev`.
//
// For every image in public/images/uploads/ (imported, in their year/month
// folders, and uploaded in the editor at /editor/) it writes smaller webp copies to public/images/_r/
// (160, 480, 800 and 1200 px wide, only sizes smaller than the original) and records the
// original dimensions in src/data/image-manifest.json. Templates (packages/editor/theme/components/Img.astro)
// and Markdown content (rehype plugin in packages/editor/astro.mjs) use the manifest to add
// srcset/sizes and width/height, so phones download a size that fits their screen.
// It also writes a 1200 × 630 JPEG of each to public/images/_s/: the image shown when a page is shared
// on Facebook, LinkedIn, in a text message and the like (og:image, `shareImage` in packages/editor/site/images.mjs).
// JPEG, because not every one of them shows webp, and cut to their wide format around what matters most.
// Generated files are git-ignored and rebuilt only when missing or older than the source.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMAGES = path.join(ROOT, 'public/images');
const SOURCES = [{ dir: 'uploads', out: 'uploads/' }];
const OUT_DIR = path.join(ROOT, 'public/images/_r');
const MANIFEST = path.join(ROOT, 'src/data/image-manifest.json');
const WIDTHS = [160, 480, 800, 1200];
const SHARE_DIR = path.join(ROOT, 'public/images/_s');
const SHARE = { width: 1200, height: 630 };

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch((e) => {
    if (e.code === 'ENOENT') return [];
    throw e;
  });
  const files = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])));
  return files.flat();
}

async function isFresh(out, srcMtime) {
  try {
    return (await fs.stat(out)).mtimeMs >= srcMtime;
  } catch {
    return false;
  }
}

// The share image: a square or upright image keeps its upper part (20 % down, like the portrait on
// the site, so a face stays in it), a wide one what sharp finds matters most.
function shareCut(file, width, height) {
  if (width / height >= 1.5) return sharp(file).resize({ ...SHARE, fit: 'cover', position: 'attention' });
  const tall = Math.round((height * SHARE.width) / width);
  const top = Math.round((tall - SHARE.height) * 0.2);
  return sharp(file)
    .resize({ width: SHARE.width, height: tall })
    .extract({ left: 0, top, ...SHARE });
}

const isImage = (f) => /\.(webp|jpe?g|png)$/i.test(f);
const files = [];
for (const { dir, out } of SOURCES) {
  const src = path.join(IMAGES, dir);
  for (const file of (await walk(src)).filter(isImage)) {
    const rel = path.relative(src, file).split(path.sep).join('/');
    files.push({ file, url: `/images/${dir}/${rel}`, outBase: out + rel });
  }
}
const manifest = {};
let written = 0;

for (const { file, url, outBase } of files) {
  const { width, height } = await sharp(file).metadata();
  if (!width || !height) continue;
  const srcMtime = (await fs.stat(file)).mtimeMs;
  const variants = [];
  for (const w of WIDTHS.filter((w) => w < width)) {
    const outRel = outBase.replace(/\.[a-z]+$/i, `-${w}.webp`);
    const out = path.join(OUT_DIR, outRel);
    if (!(await isFresh(out, srcMtime))) {
      await fs.mkdir(path.dirname(out), { recursive: true });
      await sharp(file).resize({ width: w }).webp({ quality: 78 }).toFile(out);
      written++;
    }
    variants.push({ w, src: `/images/_r/${outRel}` });
  }
  const shareRel = outBase.replace(/\.[a-z]+$/i, '.jpg');
  const shareOut = path.join(SHARE_DIR, shareRel);
  if (!(await isFresh(shareOut, srcMtime))) {
    await fs.mkdir(path.dirname(shareOut), { recursive: true });
    await shareCut(file, width, height).flatten({ background: '#ffffff' }).jpeg({ quality: 80, mozjpeg: true }).toFile(shareOut);
    written++;
  }
  manifest[url] = { width, height, variants, share: `/images/_s/${shareRel}` };
}

await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
await fs.writeFile(MANIFEST, JSON.stringify(manifest) + '\n');
console.log(`responsive-images: ${files.length} images, ${written} variants written`);
