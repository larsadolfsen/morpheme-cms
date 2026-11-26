// "Dynamic list" (B9): the switch over `Rows from` stores nothing of its own, so a list stored before it (`from: 'posts'`) is On with its list chosen,
// and nothing new is written to a file. The switch on a screen is checked by scripts/screens/lists.mjs (checkDynamicSwitch).
// Run: node --test src/standard/rows/dynamicList.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inlineRowsOf, sourceOf } from './rows.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('a stored list is On: its `from` still reads its list, and no other key is needed', () => {
  assert.equal(sourceOf('posts'), 'posts');
  assert.equal(sourceOf(''), undefined);
  const items = [{ title: 'One', tags: [] }];
  assert.deepEqual(
    inlineRowsOf({ from: 'posts' }, items)?.rows.map((r) => r.title),
    ['One'],
  );
  assert.equal(inlineRowsOf({}, items), undefined);
});

test('the switch is over `from`, and `Rows from` shows only while it has a list and offers no "None"', () => {
  const fields = read('./fields.ts');
  assert.match(fields, /name: 'dynamic'[^}]*switchFor: 'from'/);
  assert.match(fields, /name: 'from'[^}]*required: true, only: dynamic/);
});

test('the switch is never saved and the form turns it into a list or none', () => {
  assert.match(read('../../check.ts'), /if \(f\?\.switchFor\) continue;/);
  const form = read('../../fields.tsx');
  assert.match(form, /on \? first : ''/);
  assert.match(read('../../MarkdownEditor.tsx'), /dynamicNames = \['dynamic', 'from'/);
});
