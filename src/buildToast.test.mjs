// The website update status is a snackbar with a progress bar, not a chip in the top bar (it squeezed the page title on
// a phone). The snackbar draws in a browser (`?raw` icon import), so this checks the wiring in the sources.
// Run: node --test src/buildToast.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('the top bar has no build chip', () => {
  assert.equal(existsSync(new URL('./BuildChip.tsx', import.meta.url)), false);
  assert.doesNotMatch(read('./Screen.tsx'), /BuildChip/);
});

test('a save shows the update as a snackbar with a progress bar, the result replaces it', () => {
  const app = read('./App.tsx');
  assert.match(app, /snackbar\(\{ text: t\.app\.building, progress: true \}\)/);
  // The text ends with an ellipsis, so the snackbar keeps it until the next message replaces it.
  assert.match(read('./i18n/en-US/app.ts'), /building: '[^']*…'/);
  assert.match(read('./i18n/da-DK/app.ts'), /building: '[^']*…'/);
  // A failed update links to System status.
  assert.match(app, /edit: online \? undefined : \{ text: t\.footer\.status, to: 'status' \}/);
});

test('the snackbar draws a determinate or indeterminate progress bar', () => {
  const lib = read('../lib/snackbar.ts');
  assert.match(lib, /progress\?: boolean \| number/);
  assert.match(lib, /role', 'progressbar'/);
  assert.match(lib, /aria-valuenow/);
});
