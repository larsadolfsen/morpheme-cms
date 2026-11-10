// Tests for lib/afterBuild.mjs: the output check and runAfterBuild, on fixture apps written into a copy of the
// fixture site lib/fixtures/reads-site/, with a temporary dist folder. Exposes nothing. Depends on node:test.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { FILE_NAME, MAX_FILES, afterBuildOutputProblems, runAfterBuild } from './afterBuild.mjs';
import { buildInfo } from './apps.mjs';
import { createProblems } from './appProblems.mjs';
import { settingsFor } from './appManifest.mjs';

const site = fileURLToPath(new URL('./fixtures/reads-site', import.meta.url));
const BUILD = { commit: 'abc123', committed: '2026-11-10T10:00:00+01:00' };
let root;
let dist;

before(() => {
  root = mkdtempSync(join(tmpdir(), 'after-build-'));
  cpSync(site, root, { recursive: true });
});
after(() => rmSync(root, { recursive: true, force: true }));

/** Writes an app with an after-build.ts to the temporary site, runs it, and gives what came out. */
async function step(body, manifest = {}) {
  const id = `app-${Math.random().toString(36).slice(2)}`;
  const dir = join(root, 'src/apps', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'app.json'),
    JSON.stringify({
      api: 4,
      label: 'Fixture',
      publisher: 'Morpheme',
      license: 'MIT',
      icon: 'Gear',
      hint: 'A fixture.',
      version: '1.0.0',
      afterBuild: true,
      ...manifest,
    }),
  );
  writeFileSync(join(dir, 'after-build.ts'), `// Test fixture.\n// Exposes a default export.\n${body}\n`);
  dist = mkdtempSync(join(tmpdir(), 'after-build-dist-'));
  const problems = createProblems();
  await runAfterBuild({ root, dist, appId: id, build: BUILD, problems });
  const out = join(dist, '_apps', id);
  const files = existsSync(out) ? readdirSync(out) : [];
  const read = (name) => JSON.parse(readFileSync(join(out, name), 'utf8'));
  return { id, problems: problems.list(), files, read, done: () => rmSync(dist, { recursive: true, force: true }) };
}

test('FILE_NAME and MAX_FILES are as the spec says', () => {
  assert.equal(MAX_FILES, 20);
  assert.ok(FILE_NAME.test('scan-1.json'));
  assert.ok(!FILE_NAME.test('Scan.json') && !FILE_NAME.test('../x.json') && !FILE_NAME.test('a.json.js'));
});

test('afterBuildOutputProblems: valid, and each kind of wrong', () => {
  assert.deepEqual(afterBuildOutputProblems({ files: { 'a.json': { x: 1 }, 'b-2.json': [1] } }), []);
  assert.deepEqual(afterBuildOutputProblems({ files: {} }), []);
  for (const bad of [
    'x',
    null,
    1,
    [],
    {},
    { files: [] },
    { files: 'x' },
    { files: { 'A.json': 1 } },
    { files: { '../x.json': 1 } },
    { files: {}, extra: 1 },
  ])
    assert.ok(afterBuildOutputProblems(bad).length > 0, JSON.stringify(bad));
  const many = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`f${i}.json`, i]));
  assert.ok(afterBuildOutputProblems({ files: many }).length > 0);
});

test('one file: dist/_apps/<id>/scan.json holds the JSON', async () => {
  const r = await step(`export default () => ({ files: { 'scan.json': { a: 1 } } });`);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.files, ['scan.json']);
  assert.equal(readFileSync(join(dist, '_apps', r.id, 'scan.json'), 'utf8'), '{"a":1}');
  r.done();
});

test('a bad name: no file and one problem', async () => {
  const r = await step(`export default () => ({ files: { 'ok.json': 1, '../x.json': {} } });`);
  assert.deepEqual(r.files, []);
  assert.equal(r.problems.length, 1);
  assert.equal(r.problems[0].place, 'after-build');
  assert.equal(r.problems[0].app, r.id);
  r.done();
});

test('upper case in a name: no file and one problem', async () => {
  const r = await step(`export default () => ({ files: { 'Scan.json': {} } });`);
  assert.deepEqual(r.files, []);
  assert.equal(r.problems.length, 1);
  r.done();
});

test('21 files: no file and one problem; 20 files are written', async () => {
  const make = (n) =>
    `export default () => ({ files: Object.fromEntries(Array.from({ length: ${n} }, (_, i) => ['f' + i + '.json', i])) });`;
  const many = await step(make(21));
  assert.deepEqual(many.files, []);
  assert.equal(many.problems.length, 1);
  many.done();
  const ok = await step(make(20));
  assert.equal(ok.files.length, 20);
  assert.deepEqual(ok.problems, []);
  ok.done();
});

test('an output that is not an object: no file and one problem', async () => {
  const r = await step(`export default () => 'x';`);
  assert.deepEqual(r.files, []);
  assert.equal(r.problems.length, 1);
  assert.equal(r.problems[0].place, 'after-build');
  r.done();
});

test('reads: an app with reads ["pages"] gets the pages', async () => {
  const r = await step(`export default (i) => ({ files: { 'r.json': i.reads } });`, { reads: ['pages'] });
  assert.deepEqual(r.problems, []);
  assert.deepEqual(
    r.read('r.json').pages.map((p) => p.address),
    ['/company/about/', '/first-post/', '/home/'],
  );
  r.done();
});

test('no reads: the file holds {}', async () => {
  const r = await step(`export default (i) => ({ files: { 'r.json': i.reads } });`);
  assert.deepEqual(r.read('r.json'), {});
  r.done();
});

test('hash: helpers.hash gives the SHA-256 hex', async () => {
  const r = await step(`export default async (i, h) => ({ files: { 'h.json': { hash: await h.hash('a') } } });`);
  assert.deepEqual(r.problems, []);
  assert.equal(r.read('h.json').hash, createHash('sha256').update('a').digest('hex'));
  r.done();
});

test('build info: commit and committed reach the app', async () => {
  const r = await step(`export default (i) => ({ files: { 'b.json': i.build } });`);
  assert.deepEqual(r.read('b.json'), BUILD);
  r.done();
});

test('settings: app.json values, over which the saved settings are laid', async () => {
  const settings = {
    fields: [
      { name: 'a', label: 'A', type: 'string' },
      { name: 'b', label: 'B', type: 'string' },
    ],
    values: { a: '1', b: '2' },
  };
  const r = await step(`export default (i) => ({ files: { 's.json': i.settings } });`, { settings });
  assert.deepEqual(r.read('s.json'), { a: '1', b: '2' });
  r.done();
  mkdirSync(join(root, 'src/data/apps'), { recursive: true });
  writeFileSync(join(root, 'src/data/apps', 'saved-app.json'), JSON.stringify({ b: 'saved' }));
  assert.deepEqual(settingsFor(root, 'saved-app', { settings }), { a: '1', b: 'saved' });
  assert.deepEqual(settingsFor(root, 'none', {}), {});
});

test('a throw is a problem and writes nothing; a bundle error and a bad app.json are problems of their own place', async () => {
  const t = await step(`export default () => { throw new Error('scan failed'); };`);
  assert.deepEqual(t.files, []);
  assert.equal(t.problems.length, 1);
  assert.equal(t.problems[0].error, 'throw');
  assert.match(t.problems[0].message, /scan failed/);
  t.done();
  const b = await step(`import fs from 'node:fs';\nexport default () => fs;`);
  assert.equal(b.problems.length, 1);
  assert.equal(b.problems[0].place, 'bundle');
  b.done();
  const m = await step(`export default () => ({ files: {} });`, { unknownKey: 1 });
  assert.equal(m.problems.length, 1);
  assert.equal(m.problems[0].place, 'manifest');
  assert.deepEqual(m.files, []);
  m.done();
});

test('an app without afterBuild writes nothing and has no problem', async () => {
  const r = await step(`export default () => ({ files: { 'x.json': 1 } });`, { afterBuild: false });
  assert.deepEqual(r.files, []);
  r.done();
});

test('buildInfo gives the last commit of a repository, and empty strings without one', () => {
  const info = buildInfo(fileURLToPath(new URL('..', import.meta.url)));
  assert.match(info.commit, /^[0-9a-f]{40}$/);
  assert.ok(!Number.isNaN(Date.parse(info.committed)));
  assert.deepEqual(buildInfo(mkdtempSync(join(tmpdir(), 'no-git-'))), { commit: '', committed: '' });
});
