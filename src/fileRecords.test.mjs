// Tests for src/fileRecords.mjs. Run: node --test packages/editor/src/fileRecords.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  deletedRecordFor,
  deleteRecord,
  newRecordId,
  parseRecord,
  recordFor,
  recordProblems,
  recordsIn,
  recordText,
  renameRecord,
  writeRecords,
} from './fileRecords.mjs';

const F = 'src/data/files';
const S = '/images/uploads/2026/10/andromeda.webp';
const G = '/images/uploads/2026/10/galaxy.webp';

/** A stored record as read from the repo. @param {string} path @param {{ src: string; categories: string[]; removed: string[] }} record */
const stored = (path, record) => ({ path, oid: 'o1', record });

/** A random source that gives 0 eight times, then 0.99 eight times. */
const zeroThenNines = () => {
  let n = 0;
  return () => (n++ < 8 ? 0 : 0.99);
};

test('parseRecord reads a record with its lists', () => {
  assert.deepEqual(parseRecord('{"src":"/a.webp","categories":["seo"],"removed":[]}'), {
    src: '/a.webp',
    categories: ['seo'],
    removed: [],
  });
});

test('parseRecord reads missing lists as empty', () => {
  assert.deepEqual(parseRecord('{"src":"/a.webp"}'), { src: '/a.webp', categories: [], removed: [] });
});

test('parseRecord rejects a src that does not start with a slash', () => {
  assert.equal(parseRecord('{"src":"a.webp"}'), null);
});

test('parseRecord rejects a list that is not an array of strings', () => {
  assert.equal(parseRecord('{"src":"/a","categories":"seo"}'), null);
});

test('parseRecord rejects text that is not JSON', () => {
  assert.equal(parseRecord('['), null);
});

test('recordsIn keeps only the record files directly in the folder', () => {
  const valid = '{"src":"/a.webp","categories":[],"removed":[]}';
  const files = [
    { path: `${F}/ab12cd34.json`, oid: 'o1', text: valid },
    { path: `${F}/sub/x.json`, oid: 'o2', text: valid },
    { path: `${F}/bad.json`, oid: 'o3', text: '{' },
    { path: 'src/data/categories/seo.json', oid: 'o4', text: valid },
  ];
  const records = recordsIn(files, F);
  assert.deepEqual(
    records.map((r) => r.path),
    [`${F}/ab12cd34.json`],
  );
  assert.equal(records[0].oid, 'o1');
});

test('recordFor finds the record of a file address', () => {
  const records = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: ['seo'], removed: [] })];
  assert.equal(recordFor(records, S), records[0]);
  assert.equal(recordFor(records, '/other.webp'), undefined);
});

test('newRecordId gives 8 characters from the first try when none is taken', () => {
  assert.equal(
    newRecordId(new Set(), () => 0),
    'aaaaaaaa',
  );
});

test('newRecordId draws again when the id is taken', () => {
  assert.equal(newRecordId(new Set(['aaaaaaaa']), zeroThenNines()), '99999999');
});

test('newRecordId with Math.random gives 8 lower case letters or digits', () => {
  assert.match(newRecordId(new Set()), /^[a-z0-9]{8}$/);
});

test('recordText writes the keys in order, 2-space JSON, with a newline at the end', () => {
  assert.equal(
    recordText({ src: '/a.webp', categories: ['seo'], removed: [] }),
    '{\n  "src": "/a.webp",\n  "categories": [\n    "seo"\n  ],\n  "removed": []\n}\n',
  );
});

test('writeRecords creates a record for a new file address under a new id', () => {
  const next = { src: S, categories: ['seo'], removed: [] };
  assert.deepEqual(
    writeRecords([], F, [{ src: S, next }], () => 0),
    [{ path: `${F}/aaaaaaaa.json`, content: recordText(next), oid: null }],
  );
});

test('writeRecords updates a record whose lists changed', () => {
  const records = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: ['seo'], removed: [] })];
  const next = { src: S, categories: [], removed: ['seo'] };
  assert.deepEqual(writeRecords(records, F, [{ src: S, next }]), [{ path: `${F}/aaaaaaaa.json`, content: recordText(next), oid: 'o1' }]);
});

test('writeRecords changes nothing when the record is the same', () => {
  const records = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: ['seo'], removed: [] })];
  const next = { src: S, categories: ['seo'], removed: [] };
  assert.deepEqual(writeRecords(records, F, [{ src: S, next }]), []);
});

test('writeRecords deletes a record whose lists are now empty', () => {
  const records = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: ['seo'], removed: [] })];
  const next = { src: S, categories: [], removed: [] };
  assert.deepEqual(writeRecords(records, F, [{ src: S, next }]), [{ path: `${F}/aaaaaaaa.json`, content: null, oid: 'o1' }]);
});

test('writeRecords changes nothing when there is no record and the lists are empty', () => {
  const next = { src: S, categories: [], removed: [] };
  assert.deepEqual(writeRecords([], F, [{ src: S, next }]), []);
});

test('writeRecords gives two new file addresses two different ids', () => {
  const a = { src: S, categories: ['seo'], removed: [] };
  const b = { src: G, categories: ['seo'], removed: [] };
  // A constant 0 would give the same id again and loop forever, so the second id draws 0.99 values.
  const changes = writeRecords(
    [],
    F,
    [
      { src: S, next: a },
      { src: G, next: b },
    ],
    zeroThenNines(),
  );
  assert.deepEqual(
    changes.map((c) => c.path),
    [`${F}/aaaaaaaa.json`, `${F}/99999999.json`],
  );
});

test('renameRecord keeps the id and the lists and sets the new address', () => {
  const records = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: ['seo'], removed: ['x'] })];
  assert.deepEqual(renameRecord(records, S, G), {
    path: `${F}/aaaaaaaa.json`,
    content: recordText({ src: G, categories: ['seo'], removed: ['x'] }),
    oid: 'o1',
  });
});

test('renameRecord gives null when there is no record', () => {
  const records = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: ['seo'], removed: [] })];
  assert.equal(renameRecord(records, '/x.webp', '/y.webp'), null);
});

test('deleteRecord deletes the record of the address', () => {
  const records = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: ['seo'], removed: [] })];
  assert.deepEqual(deleteRecord(records, S), { path: `${F}/aaaaaaaa.json`, content: null, oid: 'o1' });
});

test('deleteRecord gives null when there is no record', () => {
  assert.equal(deleteRecord([], S), null);
});

const P = `${F}/aaa.json`;
const valid = (src) => JSON.stringify({ src, categories: [], removed: [] });

test('recordProblems gives nothing for a valid record', () => {
  assert.deepEqual(recordProblems([{ path: P, text: valid(S) }], F), []);
});

test('recordProblems reports a record without a slash-led src as shape', () => {
  assert.deepEqual(recordProblems([{ path: P, text: '{"src":"a.webp"}' }], F), [{ path: P, problem: 'shape' }]);
});

test('recordProblems reports a slug that is both chosen and removed as overlap', () => {
  const text = '{"src":"/a.webp","categories":["seo"],"removed":["seo"]}';
  assert.deepEqual(recordProblems([{ path: P, text }], F), [{ path: P, problem: 'overlap', value: 'seo' }]);
});

test('recordProblems reports the later of two records for one address as duplicate', () => {
  const files = [
    { path: `${F}/aaa.json`, text: valid('/a.webp') },
    { path: `${F}/bbb.json`, text: valid('/a.webp') },
  ];
  assert.deepEqual(recordProblems(files, F), [{ path: `${F}/bbb.json`, problem: 'duplicate', value: '/a.webp' }]);
});

test('recordProblems reads backslash paths and returns them with slashes', () => {
  const files = [{ path: 'src\\data\\files\\aaa.json', text: '{"src":"a"}' }];
  assert.deepEqual(recordProblems(files, F), [{ path: 'src/data/files/aaa.json', problem: 'shape' }]);
});

test('recordProblems ignores files outside the folder', () => {
  assert.deepEqual(recordProblems([{ path: 'src/data/categories/seo.json', text: '{"src":"a"}' }], F), []);
});

test('deletedRecordFor finds the deleted entry of a file at the time it was deleted', () => {
  const at = new Date('2026-11-03T10:00:00Z');
  const deleted = [{ path: `${F}/x.json`, text: valid(S), at }];
  assert.equal(deletedRecordFor(S, '2026-11-03T10:00:00Z', deleted, []), deleted[0]);
});

test('deletedRecordFor gives null when the deletion time differs by one second', () => {
  const deleted = [{ path: `${F}/x.json`, text: valid(S), at: new Date('2026-11-03T10:00:00Z') }];
  assert.equal(deletedRecordFor(S, '2026-11-03T10:00:01Z', deleted, []), null);
});

test('deletedRecordFor gives null when a live record already has the address', () => {
  const deleted = [{ path: `${F}/x.json`, text: valid(S), at: new Date('2026-11-03T10:00:00Z') }];
  const live = [stored(`${F}/aaaaaaaa.json`, { src: S, categories: [], removed: [] })];
  assert.equal(deletedRecordFor(S, '2026-11-03T10:00:00Z', deleted, live), null);
});

test('deletedRecordFor gives null for an entry of another address', () => {
  const deleted = [{ path: `${F}/x.json`, text: valid(G), at: new Date('2026-11-03T10:00:00Z') }];
  assert.equal(deletedRecordFor(S, '2026-11-03T10:00:00Z', deleted, []), null);
});

test('a record keeps its credit through text and back, and a credited record is never empty', async () => {
  const { parseRecord, recordText } = await import('./fileRecords.mjs');
  const { isEmpty, setTags, withCredit } = await import('./fileTags.mjs');
  const credit = { name: 'Ann', url: 'https://unsplash.com/@ann?utm_source=Site', source: 'Unsplash' };
  const record = withCredit(undefined, '/images/a.webp', credit);
  assert.equal(isEmpty(record), false);
  assert.deepEqual(parseRecord(recordText(record)), record);
  assert.deepEqual(setTags(record, '/images/a.webp', ['sea']).credit, credit);
  assert.equal(parseRecord('{"src":"/a.webp","credit":{"name":"A","url":"http://x","source":"S"}}'), null);
  assert.equal(parseRecord('{"src":"/a.webp","credit":{"url":"https://x","source":"S"}}'), null);
});

test('creditChanges puts the credit in the record the save already makes, or makes one', async () => {
  const { creditChanges, parseRecord } = await import('./fileRecords.mjs');
  const credit = { name: 'Ann', url: 'https://unsplash.com/@ann', source: 'Unsplash' };
  const made = { path: 'src/data/files/abcd1234.json', oid: null, content: '{"src":"/images/a.webp","categories":["sea"],"removed":[]}' };
  const merged = creditChanges([made], [], 'src/data/files', [{ src: '/images/a.webp', credit }]);
  assert.equal(merged.length, 1);
  assert.deepEqual(parseRecord(String(merged[0].content)).credit, credit);
  assert.deepEqual(parseRecord(String(merged[0].content)).categories, ['sea']);
  const own = creditChanges([], [], 'src/data/files', [{ src: '/images/b.webp', credit }]);
  assert.equal(own.length, 1);
  assert.equal(own[0].oid, null);
  assert.deepEqual(parseRecord(String(own[0].content)).credit, credit);
});
