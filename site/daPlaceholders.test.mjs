// The Danish texts of the standard parts (defaults/i18n/da-DK/) are keyed by the English sentence, so renaming a
// {placeholder} in one language and not the other leaves two unmatched placeholders and no error. This finds that.
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import test from 'node:test';

const dir = new URL('../defaults/i18n/da-DK/', import.meta.url);
const files = readdirSync(dir).filter((file) => file.endsWith('.ts') && file !== 'index.ts');
const names = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('the Danish texts of the standard parts have files to check', () => {
  assert.ok(files.includes('rules.ts'));
});

for (const file of files) {
  test(`${file}: every {placeholder} in a key is in its Danish value, and the other way round`, async () => {
    const module = await import(new URL(file, dir).href);
    const problems = [];
    for (const dictionary of Object.values(module)) {
      for (const [key, value] of Object.entries(dictionary)) {
        if (names(key).join() !== names(value).join()) problems.push(`${key} -> ${value}`);
      }
    }
    assert.deepEqual(problems, []);
  });
}
