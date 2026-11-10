// Tests of the Worker's messages by locale (worker/say.js, worker/i18n/da-DK.js) and of push.js's isRoute.
// Run: node --test worker/say.test.mjs. Depends on esbuild (push.js reads the site through aliases, as wrangler builds it).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { nameOf } from '../lib/scheduled.mjs';
import { say } from './say.js';

test('da-DK returns the Danish entry', () => {
  assert.equal(say('da-DK', 'Try again.'), 'Prøv igen.');
});

test('en-US returns the English text', () => {
  assert.equal(say('en-US', 'Try again.'), 'Try again.');
});

test('values fill each {name}, in both languages', () => {
  assert.equal(say('da-DK', 'Publish scheduled: {names}', { names: 'side "a"' }), 'Udgiv planlagt: side "a"');
  assert.equal(say('en-US', 'Publish scheduled: {names}', { names: 'page "a"' }), 'Publish scheduled: page "a"');
});

test('another language and a text with no entry give the English text', () => {
  assert.equal(say('de-DE', 'Try again.'), 'Try again.');
  assert.equal(say('da-DK', 'A text with no entry.'), 'A text with no entry.');
});

test('isRoute accepts Danish letters in a slug', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'say-test-'));
  writeFileSync(join(dir, 'config.js'), 'export const config = {};');
  writeFileSync(join(dir, 'worker.js'), 'export const contact = {};');
  const outfile = join(dir, 'push.mjs');
  await build({
    entryPoints: [fileURLToPath(new URL('./push.js', import.meta.url))],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    alias: { '@site/config': join(dir, 'config.js'), '@site/worker': join(dir, 'worker.js') },
    logLevel: 'silent',
  });
  const { isRoute } = await import(pathToFileURL(outfile).href);
  assert.equal(isRoute('om-øen'), true);
  assert.equal(isRoute('om-åen/Æg'), true);
  assert.equal(isRoute('a b'), false);
});

test("a commit names a scheduled file in the site's language", () => {
  const danish = (text) => say('da-DK', text);
  assert.equal(nameOf('src/content/blog/a/index.md'), 'blog post "a"');
  assert.equal(nameOf('src/content/pages/om.md'), 'page "om"');
  assert.equal(nameOf('src/content/blog/a/index.md', danish), 'blogindl\u00e6g "a"');
  assert.equal(nameOf('src/content/pages/om.md', danish), 'side "om"');
  assert.equal(nameOf('x/y.md', danish), 'file "x/y"');
});
