// Tests for scripts/responsive-images.mjs and scripts/video-thumbnails.mjs: an output is decided by the content of its source, not
// by file times, and an unchanged one is taken from the live site (a fake one here) before sharp makes it.
// Run: node --test scripts/responsive-images.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SCRIPT = (name) => fileURLToPath(new URL(`./${name}.mjs`, import.meta.url));

async function site(color = '#336699') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'responsive-'));
  const file = path.join(dir, 'public/images/uploads/2026/11/a.png');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp({ create: { width: 1000, height: 600, channels: 3, background: color } })
    .png()
    .toFile(file);
  return dir;
}

// Async, so the fake live site in this process can answer while the script runs.
function run(name, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT(name)], { cwd, env: { ...process.env, MORPHEME_LIVE_URL: '', ...env } });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(err || `exit ${code}`))));
  });
}

const manifestOf = (dir) => fs.readFileSync(path.join(dir, 'src/data/image-manifest.json'), 'utf8');
const record = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'public/images/_variants.json'), 'utf8'));

/** Serves a built site's public/ folder, counting the requests. */
async function live(dir) {
  const hits = [];
  const server = createServer((req, res) => {
    hits.push(req.url);
    const root = path.resolve(dir, 'public');
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return res.writeHead(404).end('not found');
    res.writeHead(200).end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, hits, close: () => server.close() };
}

test('the first build makes every size and records its key', async () => {
  const dir = await site();
  assert.match(await run('responsive-images', dir), /1 images, 4 variants written$/m); // 160, 480, 800 and the share image
  const keys = Object.keys(record(dir));
  assert.deepEqual(keys, [
    '_r/uploads/2026/11/a-160.webp',
    '_r/uploads/2026/11/a-480.webp',
    '_r/uploads/2026/11/a-800.webp',
    '_s/uploads/2026/11/a.jpg',
  ]);
});

test('a new file time does not make anything again, a changed source does', async () => {
  const dir = await site();
  await run('responsive-images', dir);
  const source = path.join(dir, 'public/images/uploads/2026/11/a.png');
  const later = new Date(Date.now() + 60_000);
  fs.utimesSync(source, later, later); // what a fresh clone does
  assert.match(await run('responsive-images', dir), /0 variants written/);
  await sharp({ create: { width: 1000, height: 600, channels: 3, background: '#aa3333' } })
    .png()
    .toFile(source);
  assert.match(await run('responsive-images', dir), /4 variants written/);
});

test('a fresh clone takes the unchanged sizes from the live site, with the same manifest', async () => {
  const built = await site();
  await run('responsive-images', built);
  const server = await live(built);
  try {
    const clone = await site(); // the same source bytes, no outputs
    const out = await run('responsive-images', clone, { MORPHEME_LIVE_URL: server.url });
    assert.match(out, /0 variants written, 4 taken from the live site/);
    assert.equal(manifestOf(clone), manifestOf(built));
    assert.deepEqual(record(clone), record(built));
    for (const rel of Object.keys(record(built)))
      assert.deepEqual(fs.readFileSync(path.join(clone, 'public/images', rel)), fs.readFileSync(path.join(built, 'public/images', rel)));
  } finally {
    server.close();
  }
});

test('a changed image is made by sharp, not taken from the live site', async () => {
  const built = await site();
  await run('responsive-images', built);
  const server = await live(built);
  try {
    const clone = await site('#aa3333');
    assert.match(await run('responsive-images', clone, { MORPHEME_LIVE_URL: server.url }), /4 variants written$/m);
    assert.deepEqual(server.hits, ['/images/_variants.json']);
  } finally {
    server.close();
  }
});

test('a live site without a record, or one that is down, gives the same result as no live site', async () => {
  const clone = await site();
  assert.match(await run('responsive-images', clone, { MORPHEME_LIVE_URL: 'http://127.0.0.1:9' }), /4 variants written$/m);
});

test('a live answer that is not an image is not kept', async () => {
  const built = await site();
  await run('responsive-images', built);
  fs.writeFileSync(path.join(built, 'public/images/_r/uploads/2026/11/a-160.webp'), '<html>oops</html>');
  const server = await live(built);
  try {
    const clone = await site();
    assert.match(
      await run('responsive-images', clone, { MORPHEME_LIVE_URL: server.url }),
      /1 variants written, 3 taken from the live site/,
    );
  } finally {
    server.close();
  }
});

test('video stills come from the live site before YouTube is asked', async () => {
  const built = await site();
  fs.mkdirSync(path.join(built, 'src/content'), { recursive: true });
  fs.writeFileSync(path.join(built, 'src/content/p.md'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ\n');
  const stills = path.join(built, 'public/images/_video');
  fs.mkdirSync(stills, { recursive: true });
  // Make the two stills as an earlier build would have, and record them.
  // The network is never asked: every still is in the record of the fake live site.
  const { stillName, videoOf } = await import('../lib/video-id.mjs');
  const { keyOf } = await import('../lib/variant-record.mjs');
  const name = stillName(videoOf('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
  const rec = {};
  for (const w of [480, 960]) {
    await sharp({ create: { width: w, height: Math.round((w * 9) / 16), channels: 3, background: '#000' } })
      .webp()
      .toFile(path.join(stills, `${name}-${w}.webp`));
    rec[`_video/${name}-${w}.webp`] = keyOf('still', name, w, 'webp', 78);
  }
  fs.writeFileSync(path.join(built, 'public/images/_variants.json'), JSON.stringify(rec));
  const server = await live(built);
  try {
    const clone = await site();
    fs.cpSync(path.join(built, 'src'), path.join(clone, 'src'), { recursive: true });
    assert.match(await run('video-thumbnails', clone, { MORPHEME_LIVE_URL: server.url }), /0 stills fetched, 2 taken from the live site/);
    assert.deepEqual(Object.keys(record(clone)).sort(), Object.keys(rec).sort());
  } finally {
    server.close();
  }
});

test('images made side by side give the same files, manifest and record as one after another', async () => {
  const make = async () => {
    const dir = await site();
    for (let i = 0; i < 6; i++)
      await sharp({ create: { width: 900 + i * 90, height: 500 + i * 30, channels: 3, background: `#${i}a${i}f9c` } })
        .png()
        .toFile(path.join(dir, `public/images/uploads/2026/11/img-${i}.png`));
    return dir;
  };
  const one = await make();
  const many = await make();
  await run('responsive-images', one, { MORPHEME_IMAGE_JOBS: '1' });
  await run('responsive-images', many, { MORPHEME_IMAGE_JOBS: '4' });
  assert.equal(manifestOf(many), manifestOf(one));
  const bytes = (d) => fs.readFileSync(path.join(d, 'public/images/_variants.json'), 'utf8');
  assert.equal(bytes(many), bytes(one));
  assert.deepEqual(Object.keys(record(many)), Object.keys(record(many)).slice().sort());
  for (const rel of Object.keys(record(one)))
    assert.deepEqual(fs.readFileSync(path.join(many, 'public/images', rel)), fs.readFileSync(path.join(one, 'public/images', rel)));
});
