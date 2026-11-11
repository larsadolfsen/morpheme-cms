/**
 * Tests for the list of unfinished pages and posts.
 * Exposes test cases for `unfinishedOf`.
 * Depends on `node:test`, `node:assert/strict`, and `./unfinished.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { unfinishedOf } from './unfinished.mjs';

const entry = (title, status, publishAt) => ({
  path: `src/content/pages/${title}.md`,
  collection: 'pages',
  title,
  status,
  publishAt,
  date: undefined,
});

test('unfinishedOf is empty when everything is published', () => {
  assert.deepEqual(unfinishedOf([entry('a', 'published'), entry('b', 'published')]), []);
  assert.deepEqual(unfinishedOf([]), []);
});

test('unfinishedOf lists a scheduled entry with a bad publishAt without a date', () => {
  const rows = unfinishedOf([entry('a', 'scheduled', 'soon'), entry('b', 'scheduled')]);
  assert.deepEqual(
    rows.map((r) => [r.title, r.at]),
    [
      ['a', null],
      ['b', null],
    ],
  );
});

test('unfinishedOf puts scheduled by date first, then undated scheduled, then drafts', () => {
  const rows = unfinishedOf([
    entry('d2', 'draft'),
    entry('bad', 'scheduled', 'x'),
    entry('late', 'scheduled', '2026-12-24T08:00'),
    entry('d1', 'draft'),
    entry('early', 'scheduled', '2026-11-20T08:00'),
    entry('p', 'published'),
  ]);
  assert.deepEqual(
    rows.map((r) => r.title),
    ['early', 'late', 'bad', 'd1', 'd2'],
  );
  assert.equal(typeof rows[0].at, 'number');
  assert.equal(rows[3].at, null);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['at', 'collection', 'path', 'status', 'title']);
});

test('unfinishedOf lists a published page with changes waiting after the drafts, the dated ones first', () => {
  const waiting = (title, publishAt) => ({ ...entry(title, 'published'), waiting: { publishAt } });
  const rows = unfinishedOf([waiting('w2'), waiting('w1', '2026-12-01T08:00'), entry('d', 'draft'), entry('p', 'published')]);
  assert.deepEqual(
    rows.map((r) => [r.title, r.status]),
    [
      ['d', 'draft'],
      ['w1', 'waiting'],
      ['w2', 'waiting'],
    ],
  );
  assert.equal(typeof rows[1].at, 'number');
  assert.equal(rows[2].at, null);
});
