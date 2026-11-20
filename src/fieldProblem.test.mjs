// A text, number or string field is marked by the browser's own validity (`:user-invalid`) from fieldProblem (src/check.ts), the
// same checks Save makes through problemAt, so a field is never marked while Save passes or the reverse. Both must therefore come
// from the one function: problemAt does not make the checks again, and the text field takes the editor's check as its validity.
// The marking on a screen is checked by scripts/editor-screens.mjs (checkUserInvalid). Run: node --test src/fieldProblem.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('problemAt makes a field its own checks only through fieldProblem', () => {
  const source = read('./check.ts');
  const at = source.slice(source.indexOf('export function problemAt'), source.indexOf('// The value as it is saved'));
  assert.match(at, /fieldProblem\(f, v, label\)/);
  for (const own of ['t.check.fillIn', 't.check.notAnOption', 'problemOf(f, v)'])
    assert.ok(!at.includes(own), `problemAt checks ${own} itself, not through fieldProblem`);
});

test('the editor gives a text field its fieldProblem as its validity and its line', () => {
  const fields = read('./fields.tsx');
  assert.match(fields, /fieldProblem\(field, value\)/);
  assert.equal((fields.match(/\{\.\.\.wrong\}/g) ?? []).length, 3, 'the text, number and string fields are given it');
  const text = read('../theme/ui/TextField.tsx');
  assert.match(text, /setCustomValidity\(invalid && invalidText \? invalidText : ''\)/);
});
