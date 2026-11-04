import test from 'node:test';
import assert from 'node:assert/strict';
import { filesIn, newlyUsed, autoTagChanges } from './autoTags.mjs';
import { recordText } from './fileRecords.mjs';

const F = 'src/data/files';
const A = '/images/uploads/2026/10/a.webp';
const B = '/images/uploads/2026/10/b.webp';
const P = '/filer/price-list.pdf';
const stored = (src, categories, removed, oid = 'o1', id = 'r1') => ({
  path: `${F}/${id}.json`,
  oid,
  record: { src, categories, removed },
});

test('filesIn finds valid address in markdown image', () => {
  assert.deepEqual(filesIn('text ![x](' + A + ') end', [A, B]), [A]);
});

test('filesIn finds valid address in JSON string', () => {
  assert.deepEqual(filesIn('"image": "' + A + '"', [A]), [A]);
});

test('filesIn finds valid address after colon', () => {
  assert.deepEqual(filesIn('file: ' + P, [P]), [P]);
});

test('filesIn finds valid address in markdown link', () => {
  assert.deepEqual(filesIn('[Prisliste](' + P + ')', [P]), [P]);
});

test('filesIn finds valid address in HTML entity', () => {
  assert.deepEqual(filesIn('data-props="{&quot;file&quot;:&quot;' + P + '&quot;}"', [P]), [P]);
});

test('filesIn does not match if followed by hyphen and more text', () => {
  assert.deepEqual(filesIn('/images/uploads/2026/10/a.webp-old.webp', [A]), []);
});

test('filesIn returns unique matches in input order', () => {
  assert.deepEqual(filesIn(A + ' ' + A, [A, A]), [A]);
});

test('newlyUsed returns files added but not removed', () => {
  assert.deepEqual(newlyUsed('![x](' + A + ')', '![x](' + A + ') ![y](' + B + ')', [A, B]), [B]);
});

test('newlyUsed returns file added from empty before', () => {
  assert.deepEqual(newlyUsed('', '[p](' + P + ')', [P]), [P]);
});

test('newlyUsed returns empty if file removed', () => {
  assert.deepEqual(newlyUsed('![x](' + A + ')', '', [A]), []);
});

test('autoTagChanges creates new record with page tags', () => {
  const expected = [
    {
      path: 'src/data/files/aaaaaaaa.json',
      content: recordText({ src: A, categories: ['design'], removed: [] }),
      oid: null,
    },
  ];
  assert.deepEqual(
    autoTagChanges([], F, [A], ['design'], () => 0),
    expected,
  );
});

test('autoTagChanges updates existing record with new tags', () => {
  const expected = [
    {
      path: F + '/r1.json',
      content: recordText({ src: A, categories: ['seo', 'design'], removed: [] }),
      oid: 'o1',
    },
  ];
  assert.deepEqual(autoTagChanges([stored(A, ['seo'], [])], F, [A], ['design']), expected);
});

test('autoTagChanges does not add removed tags', () => {
  assert.deepEqual(autoTagChanges([stored(A, [], ['design'])], F, [A], ['design']), []);
});

test('autoTagChanges does not update if tags already present', () => {
  assert.deepEqual(autoTagChanges([stored(A, ['design'], [])], F, [A], ['design']), []);
});

test('autoTagChanges returns empty for no page tags', () => {
  assert.deepEqual(autoTagChanges([], F, [A], []), []);
});

test('autoTagChanges returns empty for no sources', () => {
  assert.deepEqual(autoTagChanges([], F, [], ['design']), []);
});

test('autoTagChanges handles duplicate sources', () => {
  assert.equal(autoTagChanges([], F, [A, A], ['design']).length, 1);
});

test('autoTagChanges creates unique paths for multiple new files', () => {
  let n = 0;
  const random = () => (n++ < 8 ? 0 : 0.99);
  const changes = autoTagChanges([], F, [A, B], ['design'], random);
  assert.equal(changes.length, 2);
  assert.equal(changes[0].oid, null);
  assert.equal(changes[1].oid, null);
  assert.notEqual(changes[0].path, changes[1].path);
});
