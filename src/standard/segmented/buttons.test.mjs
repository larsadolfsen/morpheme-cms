// A Segmented row holds at most one text button: the field says so (the form hides `Add one`, the check stops a second).
// Run: node --test src/standard/segmented/buttons.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test("the row's `buttons` field has maxItems 1", () => {
  const src = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8');
  assert.match(src, /name: 'buttons',[\s\S]*?maxItems: 1,[\s\S]*?summary: 'label'/);
});
