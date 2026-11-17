import assert from 'node:assert/strict';
import { test } from 'node:test';
import { oldNamesIn } from './check-token-names.mjs';

const renamed = {
  '--mo-primary': '--mo-sys-color-primary',
  '--mo-primary-container': '--mo-sys-color-primary-container',
  '--block-text': '--mo-sys-block-text',
};

test('an old name is found whole, with its line and its new name', () => {
  const found = oldNamesIn('a {\n  color: var(--mo-primary);\n}\n', renamed);
  assert.deepEqual(found, [{ line: 2, name: '--mo-primary', now: '--mo-sys-color-primary' }]);
});

test('a longer old name is not read as its shorter one, and a new name is not an old one', () => {
  assert.deepEqual(oldNamesIn('x: var(--mo-primary-container);', renamed), [
    { line: 1, name: '--mo-primary-container', now: '--mo-sys-color-primary-container' },
  ]);
  assert.deepEqual(oldNamesIn('x: var(--mo-sys-color-primary); y: var(--mo-sys-block-text); .block-text {}', renamed), []);
});

test('an unlisted name and an empty list find nothing', () => {
  assert.deepEqual(oldNamesIn('x: var(--color-primary);', renamed), []);
  assert.deepEqual(oldNamesIn('x: var(--mo-primary);', {}), []);
});

test('the names inside a Tailwind arbitrary class are found too', () => {
  const found = oldNamesIn('<div class="max-w-[var(--block-text)]">', renamed);
  assert.equal(found.length, 1);
  assert.equal(found[0].name, '--block-text');
});
