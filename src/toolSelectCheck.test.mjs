// A select fed by an app's tool (`optionsFrom`, src/apps.ts) keeps no options of its own, so fieldProblem (src/check.ts) must not
// call a saved value "not an option". check.ts imports `@site/*` and extensionless files, so it is read as text, as
// fieldProblem.test.mjs does; the other checks (required, kind, form) stay in place.
// Run: node --test src/toolSelectCheck.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./check.ts', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('export function fieldProblem'), source.indexOf('/** As check, with the field'));

test('the "not an option" check skips a select that has optionsFrom', () => {
  const line = body.match(/if \(f\.type === 'select'[^\n]*\n[^\n]*notAnOption/)?.[0] ?? '';
  assert.match(line, /!f\.optionsFrom/);
  assert.match(line, /!f\.options\.some\(\(o\) => o\.value === v\)/);
});

test('a select without optionsFrom keeps the check, and the required and form checks stay', () => {
  assert.match(body, /f\.type === 'select' && f\.options && !f\.optionsFrom && !empty/);
  assert.match(body, /if \(f\.required && empty\) return both\(t\.check\.fillIn\(label\)\)/);
  assert.match(body, /problemOf\(f, v\)/);
});
