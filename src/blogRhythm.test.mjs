/**
 * Tests for the blog rhythm: when the next post is due and what counts as the last one.
 * Exposes test cases for `nextDue`, `isDue`, `lastPostOf` and `weeksSince`.
 * Depends on `node:test`, `node:assert/strict`, and `./blogRhythm.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { isDue, lastPostOf, nextDue, weeksSince } from './blogRhythm.mjs';

const day = (date) => date.toISOString().slice(0, 10);
const NOW = Date.UTC(2026, 10, 10, 9, 0);
const ago = (days) => day(new Date(NOW - days * 86400000));
const post = (date, status, publishAt, collection = 'blog') => ({
  path: `src/content/blog/${date}.md`,
  collection,
  title: date,
  status,
  publishAt,
  date,
});

test('a last post 3 days ago with a weekly rhythm is not due, 8 days ago it is', () => {
  assert.equal(isDue(ago(3), 'week', NOW), false);
  assert.equal(isDue(ago(8), 'week', NOW), true);
});

test('nextDue adds a week, two weeks or a month', () => {
  assert.equal(day(nextDue('2026-11-01', 'week')), '2026-11-08');
  assert.equal(day(nextDue('2026-11-01', 'two-weeks')), '2026-11-15');
  assert.equal(day(nextDue('2026-11-01', 'month')), '2026-12-01');
  assert.equal(day(nextDue(new Date(Date.UTC(2026, 10, 1, 12)), 'week')), '2026-11-08');
});

test('nextDue clamps a month to the end of the shorter month', () => {
  assert.equal(day(nextDue('2026-01-31', 'month')), '2026-02-28');
  assert.equal(day(nextDue('2028-01-31', 'month')), '2028-02-29');
  assert.equal(day(nextDue('2026-12-31', 'month')), '2027-01-31');
});

test('nextDue falls back to a month for an unknown rhythm', () => {
  assert.equal(day(nextDue('2026-11-01', 'daily')), '2026-12-01');
});

test('lastPostOf is null with only drafts, future scheduled posts, unlisted posts and pages', () => {
  const entries = [
    post('2026-11-01', 'draft'),
    post('2026-11-02', 'scheduled', '2026-12-01T08:00'),
    post('2026-11-03', 'scheduled', 'bad'),
    post('2026-11-04', 'unlisted'),
    post('2026-11-05', 'published', undefined, 'pages'),
  ];
  assert.equal(lastPostOf(entries, NOW), null);
  assert.equal(lastPostOf([], NOW), null);
});

test('lastPostOf is the newest published post, a scheduled one counting once its time is over', () => {
  const entries = [
    post('2026-10-01', 'published'),
    post('2026-11-02', 'scheduled', '2026-11-03T08:00'),
    post('2026-10-20', 'published'),
    post('2026-11-09', 'unlisted'),
    post('2026-11-09', 'draft'),
  ];
  assert.equal(lastPostOf(entries, NOW), '2026-11-02');
});

test('weeksSince counts whole weeks and never goes below 0', () => {
  assert.equal(weeksSince('2026-11-03', NOW), 1);
  assert.equal(weeksSince('2026-10-20', NOW), 3);
  assert.equal(weeksSince('2026-11-09', NOW), 0);
  assert.equal(weeksSince('2026-12-01', NOW), 0);
});
