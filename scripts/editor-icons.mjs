#!/usr/bin/env node
// The PNG icons (the editor's app icons in public/editor/, the site's public/apple-touch-icon.png and
// public/favicon.ico), made from the mark in public/favicon.svg on the site's background colour
// (light mode, src/data/colors.json). Run again only if the favicon changes:
// npx morpheme editor-icons
//   icon-192/512: the icon on Android and in the browser; maskable: Android may crop it to a circle,
//   so the mark keeps inside the middle 60 %; apple-touch-icon: the iPhone home screen (the editor's
//   and the site's); favicon.ico: for browsers and programs that ask for /favicon.ico, not the SVG.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public');
const favicon = await fs.readFile(path.join(ROOT, 'public/favicon.svg'), 'utf8');
const mark = favicon.match(/<svg x="[^>]*viewBox="([^"]+)">([\s\S]*?)<\/svg>/);
const BG = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/colors.json'), 'utf8')).light.bg;

// size: the mark's share of the icon's width.
const icon = (size) => {
  const [, , vw, vh] = mark[1].split(/[\s,]+/).map(Number);
  const w = 64 * size;
  const h = w * (vh / vw);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${BG}"/>` +
      `<svg x="${(64 - w) / 2}" y="${(64 - h) / 2}" width="${w}" height="${h}" viewBox="${mark[1]}">${mark[2]}</svg></svg>`,
  );
};

const png = (px, size) =>
  sharp(icon(size), { density: 72 * (px / 64) * 2 })
    .resize(px, px)
    .png()
    .toBuffer();

for (const [name, px, size] of [
  ['editor/icon-192.png', 192, 0.7],
  ['editor/icon-512.png', 512, 0.7],
  ['editor/icon-maskable-512.png', 512, 0.5],
  ['editor/apple-touch-icon.png', 180, 0.66],
  ['apple-touch-icon.png', 180, 0.66],
]) {
  await fs.writeFile(path.join(OUT, name), await png(px, size));
}

// An ICO file with one 32 px PNG in it (as packages/editor/src/brand.ts makes it).
const image = await png(32, 0.75);
const head = Buffer.alloc(22);
head.writeUInt16LE(1, 2); // an icon
head.writeUInt16LE(1, 4); // one image
head[6] = head[7] = 32; // width and height
head.writeUInt16LE(1, 10); // colour planes
head.writeUInt16LE(32, 12); // bits per pixel
head.writeUInt32LE(image.length, 14);
head.writeUInt32LE(22, 18); // where the image starts
await fs.writeFile(path.join(OUT, 'favicon.ico'), Buffer.concat([head, image]));
