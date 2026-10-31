#!/usr/bin/env node
// A still from each video from YouTube and Vimeo on the site, shown behind its play button
// (packages/editor/lib/video.mjs). Runs before `npm run build` and `npm run dev`, after
// packages/editor/scripts/responsive-images.mjs.
//
// The videos are found in the texts (src/content/) and the data files (src/data/): the video blocks
// and the code from YouTube and Vimeo to embed them (videoOf, packages/editor/lib/video-id.mjs). For a
// video from YouTube, its largest still is fetched (maxresdefault, else sddefault or hqdefault, which
// have black bars above and below); for one from Vimeo, the still Vimeo gives for it. Each is cut to
// 16:9 and written as webp to public/images/_video/<site>-<id>-480.webp and -960.webp, so a visitor
// gets it from the site and nothing from Google or Vimeo until the video is played.
// A video whose still cannot be fetched (no network, a removed video) keeps the plain box. Generated
// files are git-ignored and fetched once (kept while they exist).
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { stillName, videoOf, vimeoInfo } from '../lib/video-id.mjs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public/images/_video');
const WIDTHS = [480, 960];
const LINK = /(?:https?:)?(?:\/\/)?(?:[\w-]+\.)*(?:youtube(?:-nocookie)?\.com|youtu\.be|vimeo\.com)\/[^\s"'<>()[\]\\]*/gi;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])));
  return files.flat();
}

const texts = [...(await walk(path.join(ROOT, 'src/content'))), ...(await walk(path.join(ROOT, 'src/data')))].filter((f) =>
  /\.(md|json)$/.test(f),
);
const videos = new Map();
for (const file of texts)
  for (const [link] of (await fs.readFile(file, 'utf8')).replaceAll('&quot;', '"').replaceAll('&amp;', '&').matchAll(LINK)) {
    const video = videoOf(link);
    if (video) videos.set(stillName(video), video);
  }

const download = async (url) => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.ok ? res : null;
  } catch {
    return null;
  }
};

async function still(video) {
  if (video.site === 'vimeo') {
    const url = (await (await download(vimeoInfo(video, 1280)))?.json().catch(() => null))?.thumbnail_url;
    const res = url && (await download(url));
    return res ? Buffer.from(await res.arrayBuffer()) : null;
  }
  for (const size of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const res = await download(`https://i.ytimg.com/vi/${video.id}/${size}.jpg`);
    if (res) return Buffer.from(await res.arrayBuffer());
  }
  return null;
}

await fs.mkdir(OUT, { recursive: true });
let written = 0;
let missing = 0;
for (const [name, video] of videos) {
  const outs = WIDTHS.map((w) => path.join(OUT, `${name}-${w}.webp`));
  const have = await Promise.all(
    outs.map((o) =>
      fs.stat(o).then(
        () => true,
        () => false,
      ),
    ),
  );
  if (have.every(Boolean)) continue;
  const image = await still(video);
  if (!image) {
    missing++;
    continue;
  }
  for (const [i, w] of WIDTHS.entries())
    // cover: the 4:3 stills lose their black bars, which are exactly the parts outside 16:9.
    await sharp(image)
      .resize(w, Math.round((w * 9) / 16), { fit: 'cover' })
      .webp({ quality: 78 })
      .toFile(outs[i]);
  written++;
}
console.log(`video-thumbnails: ${videos.size} videos, ${written} stills fetched${missing ? `, ${missing} could not be fetched` : ''}`);
