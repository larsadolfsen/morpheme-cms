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
// Generated files are git-ignored. Each is decided by content, not file times (a fresh clone gives every source a new time): the
// record public/images/_variants.json names, for each output, the key of the source's hash and the sizes and quality it was made with.
// An output is kept when its file exists and its key matches; else it is taken from the live site (MORPHEME_LIVE_URL, set by
// `morpheme ci-build`) when the live record has the same key, else sharp makes it. Only new or changed images go through sharp.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fetchLiveRecord, hashOf, keyOf, readRecord, RECORD_NAME, takeFromLive, writeRecord } from '../lib/variant-record.mjs';

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

const RECORD = path.join(IMAGES, RECORD_NAME);
const LIVE = process.env.MORPHEME_LIVE_URL;
const WEBP_QUALITY = 78;
const SHARE_QUALITY = 80;
// Bump when shareCut or the variant settings change in a way the sizes and quality do not show.
const SHARE_KEY = `share-v1:${SHARE.width}x${SHARE.height}:q${SHARE_QUALITY}`;
const previous = await readRecord(RECORD);
const live = await fetchLiveRecord(LIVE);
const record = {};
let fromLive = 0;

/** True when the output is in place for `key`: kept from the last build or taken from the live site. */
async function inPlace(rel, key) {
  const out = path.join(IMAGES, rel);
  const exists = await fs.stat(out).then(
    () => true,
    () => false,
  );
  if (exists && previous[rel] === key) return true;
  if (live[rel] === key && (await takeFromLive(LIVE, rel, out))) {
    fromLive++;
    return true;
  }
  return false;
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
  const hash = hashOf(await fs.readFile(file));
  const variants = [];
  for (const w of WIDTHS.filter((w) => w < width)) {
    const outRel = outBase.replace(/\.[a-z]+$/i, `-${w}.webp`);
    const out = path.join(OUT_DIR, outRel);
    const rel = `_r/${outRel}`;
    const key = keyOf(hash, w, 'webp', WEBP_QUALITY);
    if (!(await inPlace(rel, key))) {
      await fs.mkdir(path.dirname(out), { recursive: true });
      await sharp(file).resize({ width: w }).webp({ quality: WEBP_QUALITY }).toFile(out);
      written++;
    }
    record[rel] = key;
    variants.push({ w, src: `/images/_r/${outRel}` });
  }
  const shareRel = outBase.replace(/\.[a-z]+$/i, '.jpg');
  const shareOut = path.join(SHARE_DIR, shareRel);
  const shareKey = keyOf(hash, SHARE_KEY);
  if (!(await inPlace(`_s/${shareRel}`, shareKey))) {
    await fs.mkdir(path.dirname(shareOut), { recursive: true });
    await shareCut(file, width, height).flatten({ background: '#ffffff' }).jpeg({ quality: SHARE_QUALITY, mozjpeg: true }).toFile(shareOut);
    written++;
  }
  record[`_s/${shareRel}`] = shareKey;
  manifest[url] = { width, height, variants, share: `/images/_s/${shareRel}` };
}

await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
await fs.writeFile(MANIFEST, JSON.stringify(manifest) + '\n');
// The video stills (scripts/video-thumbnails.mjs, `_video/`) keep their own entries.
await writeRecord(RECORD, { ...Object.fromEntries(Object.entries(previous).filter(([rel]) => rel.startsWith('_video/'))), ...record });
console.log(
  `responsive-images: ${files.length} images, ${written} variants written${fromLive ? `, ${fromLive} taken from the live site` : ''}`,
);
