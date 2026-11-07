// Tests editionWorks in licenses.mjs: each edition's photo as a picture in the editor, under the Unsplash License.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { editionWorks, UNSPLASH_LICENSE, workProblems } from './licenses.mjs';

const root = (editions) => {
  const dir = mkdtempSync(join(tmpdir(), 'editions-'));
  mkdirSync(join(dir, 'release-notes', 'editions'), { recursive: true });
  for (const [version, edition] of Object.entries(editions))
    writeFileSync(join(dir, 'release-notes', 'editions', `${version}.json`), JSON.stringify(edition));
  return dir;
};

test("an edition's photo is a picture in the editor, by its photographer, under the Unsplash License", () => {
  const [work] = editionWorks(
    root({ 0.14: { name: 'Braies', place: { 'en-US': 'Lago di Braies, Italy' }, photo: { by: 'A Photographer' } } }),
  );
  assert.equal(work.id, 'editions/0.14');
  assert.equal(work.name, 'Lago di Braies, Italy');
  assert.equal(work.author, 'A Photographer');
  assert.equal(work.license, UNSPLASH_LICENSE);
  assert.equal(work.kind, 'image');
  assert.deepEqual(work.where, ['editor']);
  assert.match(work.text, /^Unsplash grants you an irrevocable/);
  assert.deepEqual(workProblems(work, 'x'), []);
});

test('an edition without a photographer is a problem', () => {
  const [work] = editionWorks(root({ 0.14: { name: 'Braies' } }));
  assert.equal(work.name, 'Braies');
  assert.equal(workProblems(work, 'x').length, 1);
});

test('no editions folder gives no works', () => {
  assert.deepEqual(editionWorks(mkdtempSync(join(tmpdir(), 'none-'))), []);
});

test("the CMS's own editions all have a photographer", () => {
  const works = editionWorks(new URL('..', import.meta.url).pathname);
  assert.ok(works.length > 0);
  for (const work of works) assert.deepEqual(workProblems(work, work.id), []);
});
