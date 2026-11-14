// The start screen's "What's new" card (UpdatesNotice.tsx) says "N features, M improvements": both counts when both are above 0,
// only one when the other is 0, and nothing when both are 0 (the card then shows no count line). Its two counts add up to the notes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { library as en } from './i18n/en-US/library.ts';
import { library as da } from './i18n/da-DK/library.ts';
import { markCounts } from '../lib/releaseNotes.mjs';

test('the card says features and improvements, and leaves out a count of 0', () => {
  assert.equal(en.noteCounts(12, 30), '12 features, 30 improvements');
  assert.equal(en.noteCounts(1, 1), '1 feature, 1 improvement');
  assert.equal(en.noteCounts(12, 0), '12 features');
  assert.equal(en.noteCounts(0, 30), '30 improvements');
  assert.equal(en.noteCounts(0, 0), '');
  assert.equal(da.noteCounts(12, 30), '12 funktioner, 30 forbedringer');
  assert.equal(da.noteCounts(1, 0), '1 funktion');
  assert.equal(da.noteCounts(0, 1), '1 forbedring');
  assert.equal(da.noteCounts(0, 0), '');
});

test('the two counts add up to the notes the card counted before', () => {
  const notes = [{ mark: 'feature' }, { mark: 'improvement' }, { mark: 'improvement' }];
  const { features, improvements } = markCounts(notes);
  assert.equal(features + improvements, notes.length);
});
