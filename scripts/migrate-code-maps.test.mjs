import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { render } from './migrate-code-maps.mjs';

test('lib/migrate-code-maps.mjs equals its sources (node scripts/migrate-code-maps.mjs makes it)', () => {
  assert.equal(readFileSync(new URL('../lib/migrate-code-maps.mjs', import.meta.url), 'utf8'), render());
});
