// Tests for lib/contentColors.ts: the host side of the page-colors hook's helper `contentColors`. The engine is bundled
// with esbuild, as colors.test.mjs does, so Node can load its extensionless imports. Exposes nothing.
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

let loaded;
async function modules() {
  loaded ??= (async () => {
    const entry = `export { contentColorsEngine } from './lib/contentColors.ts'; export { colorPairs, colorRoles } from './defaults/colors.ts'; export { lowContrast, MODES } from './lib/colors.ts';`;
    const { outputFiles } = await build({
      stdin: { contents: entry, resolveDir: new URL('..', import.meta.url).pathname, loader: 'ts' },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
    });
    return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
  })();
  return loaded;
}

const SIZE = 128;
/** A made-up photograph: every pixel its own colour, as a photo's are, in warm and green hues. */
function photo() {
  const bytes = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    bytes.set([(x * 2 + ((y * 7) % 31)) % 256, (y * 2 + ((x * 5) % 29)) % 256, (x + y + ((x * y) % 23)) % 256, 255], i * 4);
  }
  return bytes;
}
const grey = () => new Uint8ClampedArray(Array.from({ length: 16 * 4 }, (_, i) => (i % 4 === 3 ? 255 : 128)));
const choice = { variant: 'content', contrast: 'standard' };

async function setup(files, readable = () => true) {
  const { contentColorsEngine, colorRoles } = await modules();
  const reads = [];
  const pixels = async (image) => {
    reads.push(image);
    return files[image];
  };
  return { engine: contentColorsEngine({ pixels, roles: colorRoles, readable }), reads };
}

test('a photograph gives the colours of every role in both modes, readable as the site requires', async () => {
  const { colorPairs, lowContrast, colorRoles, MODES } = await modules();
  const { engine } = await setup({ '/a.jpg': photo() }, (colors) => MODES.every((mode) => !lowContrast(colors[mode], colorPairs).length));
  const colors = await engine.forPage(['/a.jpg'])('/a.jpg', choice);
  assert.ok(colors, 'colours');
  for (const mode of ['light', 'dark']) assert.deepEqual(Object.keys(colors[mode]).sort(), Object.keys(colorRoles).sort());
});

test('an image that is not one of the page’s is not read', async () => {
  const { engine, reads } = await setup({ '/a.jpg': photo(), '/secret.jpg': photo() });
  const helper = engine.forPage(['/a.jpg']);
  assert.equal(await helper('/secret.jpg', choice), undefined);
  assert.equal(await helper(42, choice), undefined);
  assert.deepEqual(reads, []);
});

test('a choice that is not a variant and a contrast gives nothing, and the image is not read', async () => {
  const { engine, reads } = await setup({ '/a.jpg': photo() });
  const helper = engine.forPage(['/a.jpg']);
  for (const bad of [
    undefined,
    null,
    'content',
    {},
    { variant: 'nope', contrast: 'standard' },
    { variant: 'content', contrast: 'extreme' },
  ])
    assert.equal(await helper('/a.jpg', bad), undefined, JSON.stringify(bad));
  assert.deepEqual(reads, []);
});

test('a grey image, an image that cannot be read, and colours that are hard to read give nothing', async () => {
  const { engine } = await setup({ '/grey.png': grey(), '/a.jpg': photo() });
  assert.equal(await engine.forPage(['/grey.png', '/gone.png'])('/grey.png', choice), undefined);
  assert.equal(await engine.forPage(['/grey.png', '/gone.png'])('/gone.png', choice), undefined);
  const hard = await setup({ '/a.jpg': photo() }, () => false);
  assert.equal(await hard.engine.forPage(['/a.jpg'])('/a.jpg', choice), undefined);
});

test('an image is read once in a build, for each page that has it, and its colours are made once for a choice', async () => {
  const { engine, reads } = await setup({ '/shared.jpg': photo() });
  const first = await engine.forPage(['/shared.jpg'])('/shared.jpg', choice);
  const second = await engine.forPage(['/own.jpg', '/shared.jpg'])('/shared.jpg', choice);
  assert.equal(reads.length, 1);
  assert.equal(first, second);
  assert.notEqual(await engine.forPage(['/shared.jpg'])('/shared.jpg', { ...choice, variant: 'vibrant' }), first);
  assert.equal(reads.length, 1);
});

test('each image a page reads is told to onRead, for the page to keep beside its colours', async () => {
  const { engine } = await setup({ '/a.jpg': photo() });
  const told = [];
  await engine.forPage(['/a.jpg'], (image) => told.push(image))('/a.jpg', choice);
  assert.deepEqual(told, ['/a.jpg']);
});

test('a photograph is quick: far under the 1000 ms of a hook, with the engine on the host', async () => {
  const { engine } = await setup({ '/a.jpg': photo() });
  const start = performance.now();
  await engine.forPage(['/a.jpg'])('/a.jpg', choice);
  assert.ok(performance.now() - start < 1000, `${Math.round(performance.now() - start)} ms`);
});
