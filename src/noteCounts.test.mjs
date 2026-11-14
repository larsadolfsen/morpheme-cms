// The start screen's "What's new" card (UpdatesNotice.tsx) says "N features, M improvements": both counts when both are above 0,
// only one when the other is 0, and nothing when both are 0 (the card then shows no count line). Its two counts add up to the notes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { library as en } from './i18n/en-US/library.ts';
import { library as da } from './i18n/da-DK/library.ts';
import { readdirSync, readFileSync } from 'node:fs';
import { markCounts, notesSince } from '../lib/releaseNotes.mjs';

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

test('for every real version, features + improvements is its number of release notes, once, and the languages agree', () => {
  const dir = new URL('../release-notes/i18n/', import.meta.url);
  const read = (locale, name) => JSON.parse(readFileSync(new URL(`${locale}/${name}`, dir), 'utf8'));
  const names = readdirSync(new URL('en-US/', dir)).filter((n) => /^\d+\.\d+\.\d+\.json$/.test(n));
  assert.ok(names.length > 0);
  for (const name of names) {
    const en = read('en-US', name).notes;
    const da = read('da-DK', name).notes;
    const ids = en.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length, `${name}: an id is twice in the file`);
    assert.ok(
      en.every((n) => n.text.trim()),
      `${name}: an empty note`,
    );
    for (const notes of [en, da]) {
      const { features, improvements } = markCounts(notes);
      assert.equal(features + improvements, notes.length, name);
    }
    assert.deepEqual(markCounts(en), markCounts(da), `${name}: the languages count differently`);
  }
  // The card counts one language of each version since the one seen: each note once.
  const entries = names.map((name) => ({
    version: name.replace('.json', ''),
    notes: { 'en-US': read('en-US', name).notes, 'da-DK': read('da-DK', name).notes },
  }));
  const since = notesSince(entries, '0.15.0', 'da-DK');
  const want = entries.filter((e) => ['0.15.1', '0.16.0'].includes(e.version)).flatMap((e) => e.notes['da-DK']);
  assert.equal(since.length, want.length);
  const { features, improvements } = markCounts(since);
  assert.equal(features + improvements, want.length);
});
