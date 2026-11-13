// A page or post whose stored status is `scheduled` (an older site) can be saved: the Status field lists it, as a stored option, so
// the editor's check accepts it (src/check.ts), and the menu offers it only while it is chosen (src/fields.tsx). The save itself is
// checked on a phone by scripts/check-save-twice.mjs (check:screens). Run: node --test src/statusField.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the status of pages and posts lists Scheduled as a stored option', () => {
  const source = read('../defaults/collections.ts');
  const block = source.slice(source.indexOf('const status = '), source.indexOf('const seo'));
  assert.match(block, /value: 'scheduled'[^}]*stored: true/);
  assert.match(block, /value: 'draft'/);
});

test('the check accepts any option of a select, and the menu hides a stored one unless chosen', () => {
  assert.match(read('./check.ts'), /!f\.options\.some\(\(o\) => o\.value === v\)/);
  assert.match(read('./fields.tsx'), /!o\.stored \|\| o\.value === text/);
});
