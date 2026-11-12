// Tests for splitCms in src/licenseData.ts: the CMS's own licence is pulled out of the works the editor and the site bring.
// Run: node --test packages/editor/src/licenseData.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGE } from '../lib/cms-version.mjs';
import { splitCms } from './licenseData.ts';

const work = (id, version = '1.0.0') => ({ id, name: id, version });

test('the CMS is pulled out and the rest keeps its order', () => {
  const { cms, rest } = splitCms([work('a'), work(PACKAGE), work('b'), work('c')]);
  assert.equal(cms.id, PACKAGE);
  assert.deepEqual(
    rest.map((w) => w.id),
    ['a', 'b', 'c'],
  );
});

test('without the CMS, cms is null and the rest is unchanged', () => {
  const works = [work('a'), work('b')];
  const { cms, rest } = splitCms(works);
  assert.equal(cms, null);
  assert.deepEqual(rest, works);
});

test('the CMS keeps its version', () => {
  assert.equal(splitCms([work(PACKAGE, '0.1.0')]).cms.version, '0.1.0');
});
