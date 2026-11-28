// Tests the Carousel's video item thumbnail, which works as the Video block's does. Run: node --test src/standard/carousel/carousel.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { build } from 'esbuild';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// view.ts and check.ts are TypeScript with extensionless imports and `@site/*`: bundle them into a temporary folder (the site's files stubbed) and import the result.
const dir = mkdtempSync(join(tmpdir(), 'carousel-'));
const stub = join(dir, 'stub.mjs');
writeFileSync(stub, 'export default {}; export const config = {}; export const texts = {}; export const appTexts = {};');
const bundle = async (name) => {
  const outfile = join(dir, `${name}.mjs`);
  await build({
    entryPoints: [fileURLToPath(new URL(`./${name === 'check' ? '../../check' : name}.ts`, import.meta.url))],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    define: { 'import.meta.env': '{"SSR":true}' },
    alias: { '@site/config': stub, '@site/texts': stub },
    // The editor's icons (`?raw` files) and the build's virtual modules are not needed here.
    plugins: [
      {
        name: 'raw',
        setup(b) {
          b.onResolve({ filter: /^virtual:/ }, (a) => ({ path: a.path, namespace: 'raw' }));
          b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: a.path, namespace: 'raw' }));
          b.onLoad({ filter: /.*/, namespace: 'raw' }, () => ({
            contents: "export default { dirs: [], pageAddresses: [], contactText: '' }; export const themeIcons = {}",
            loader: 'js',
          }));
        },
      },
    ],
  });
  return import(pathToFileURL(outfile).href);
};
const { viewOf } = await bundle('view');
const { inUse } = await bundle('check');

const YOUTUBE = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
const data = { site: {}, libraryAlt: (src) => (src === '/images/a.jpg' ? { alt: 'Library text' } : undefined) };
const itemOf = (item) =>
  viewOf({ layout: 'uncontained', items: [{ media: 'video', video: YOUTUBE, title: 'A film', ...item }] }, data).items[0];

test('a video item with a thumbnail has it as its still, and YouTube and Vimeo are not asked', () => {
  const { video } = itemOf({ thumbnail: '/images/a.jpg' });
  assert.ok(video.still.src.includes('a.jpg'));
  assert.equal(video.stillElsewhere, undefined);
  assert.equal(video.title, 'A film');
});

test('a video item without one is as before: the site’s own still, with YouTube’s as the fallback', () => {
  for (const thumbnail of [undefined, '', '  ']) {
    const { video } = itemOf({ thumbnail });
    assert.match(video.still.src, /^\/images\/_video\//);
    assert.equal(typeof video.stillElsewhere, 'function');
  }
});

test('the thumbnail’s text is the item’s own alt, else the Library’s, else none', () => {
  assert.equal(itemOf({ thumbnail: '/images/a.jpg', alt: ' A door ' }).video.still.alt, 'A door');
  assert.equal(itemOf({ thumbnail: '/images/a.jpg' }).video.still.alt, 'Library text');
  assert.equal(itemOf({ thumbnail: '/images/b.jpg' }).video.still.alt, '');
});

test('a thumbnail on an item that is not a video is ignored', () => {
  const item = viewOf({ items: [{ media: 'image', image: '/images/a.jpg', thumbnail: '/images/b.jpg' }] }, data).items[0];
  assert.equal(item.video, undefined);
});

test('the field is the video block’s: same label and hint, shown only for a video, with its alt text rule', () => {
  const block = read('./index.tsx')
    .replace(/\s+/g, ' ')
    .replace(/,\s*([}\]])/g, ' $1');
  assert.match(
    block,
    /name: 'thumbnail', label: t\.blocks\.video\.thumbnail, type: 'image', hint: t\.blocks\.video\.thumbnailHint, only: \{ field: 'media', is: \['video'\] \}/,
  );
  assert.match(block, /libraryText: \['image', 'thumbnail'\]/);
  assert.match(block, /or: \{ field: 'media', is: \['video'\], and: \{ field: 'thumbnail', is: \[''\], not: true \} \}/);
  assert.match(block, /media: \[[^\]]*'thumbnail'\]/);
});

test('the site passes the thumbnail through the Video block’s own code', () => {
  assert.match(read('./load.ts'), /facadeWithThumbnail\(video, item, item\.title\)/);
  assert.match(read('../video/load.ts'), /export function facadeWithThumbnail/);
});

test('the alt text is in use for an image item, and for a video item only while it has a thumbnail', () => {
  const fields = [
    { name: 'media', type: 'select' },
    { name: 'image', type: 'image', only: { field: 'media', is: [''] } },
    { name: 'thumbnail', type: 'image', only: { field: 'media', is: ['video'] } },
    {
      name: 'alt',
      type: 'string',
      only: { field: 'media', is: [''], or: { field: 'media', is: ['video'], and: { field: 'thumbnail', is: [''], not: true } } },
    },
  ];
  const alt = fields[3];
  const used = (value) => inUse(alt, fields, value);
  assert.equal(used({}), true);
  assert.equal(used({ media: '' }), true);
  assert.equal(used({ media: 'video' }), false);
  assert.equal(used({ media: 'video', thumbnail: '' }), false);
  assert.equal(used({ media: 'video', thumbnail: '/images/a.jpg' }), true);
  assert.equal(used({ media: 'icon', thumbnail: '/images/a.jpg' }), false);
  assert.equal(used({ media: 'none' }), false);
});

test('in the multi-aspect ratio layout a video item is as wide as its own video: its aspect, else 16:9; an image keeps 1:1 without one', () => {
  const items = (list) => viewOf({ layout: 'multi-aspect-ratio', items: list }, data).items;
  const [landscape, portrait, square, image, imageSet] = items([
    { media: 'video', video: YOUTUBE },
    { media: 'video', video: YOUTUBE, aspect: '9:16' },
    { media: 'video', video: YOUTUBE, aspect: '1:1' },
    { media: 'image', image: '/images/a.jpg' },
    { media: 'image', image: '/images/a.jpg', aspect: '2:3' },
  ]);
  assert.equal(landscape.aspect, 16 / 9);
  assert.equal(portrait.aspect, 9 / 16);
  assert.equal(square.aspect, 1);
  assert.equal(image.aspect, 1);
  assert.equal(imageSet.aspect, 2 / 3);
  // Only this layout sets a width from it.
  assert.equal(itemOf({ aspect: '9:16' }).aspect, undefined);
});

test('the aspect field is shown for an image and a video, and offers Automatic', () => {
  const block = read('./index.tsx')
    .replace(/\s+/g, ' ')
    .replace(/,\s*([}\]])/g, ' $1');
  assert.match(
    block,
    /name: 'aspect'.*only: \{ field: 'layout', is: \['multi-aspect-ratio'\], and: \{ field: 'media', is: \['', 'video'\] \} \}/,
  );
  assert.match(block, /options: \[\{ label: t\.blocks\.carousel\.aspectAuto, value: '' \}/);
});
