import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

// The screens check is split so that two pull requests that add different units touch different files (see editor-screens.mjs).
// The areas are the .mjs files of scripts/screens/ (the runner loads every one of them, so nothing else goes there); support/context.mjs and support/shared.mjs hold what they share.
const areas = readdirSync(new URL('./screens/', import.meta.url)).filter((f) => f.endsWith('.mjs'));

test('every area file registers its units and imports only the shared support files, never another area', () => {
  assert.ok(areas.length > 5, 'the area files are read');
  for (const file of areas) {
    const source = readFileSync(new URL(`./screens/${file}`, import.meta.url), 'utf8');
    assert.match(source, /export function register\(unit\) \{/, `${file} has no register(unit)`);
    for (const [, from] of source.matchAll(/from '(\.\/[^']+)'/g))
      assert.ok(
        from.startsWith('./support/'),
        `${file} imports ${from}: an area imports only ./support/*.mjs, so it cannot depend on another area`,
      );
  }
});

test('order.txt (the first numbering of the units) has no empty line and no unit twice', () => {
  const names = readFileSync(new URL('./screens/order.txt', import.meta.url), 'utf8').split('\n');
  assert.equal(names.pop(), '', 'order.txt ends with a newline');
  assert.ok(names.every(Boolean), 'order.txt has an empty line');
  assert.equal(new Set(names).size, names.length, 'order.txt lists a unit twice');
});
