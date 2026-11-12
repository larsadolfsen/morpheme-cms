// The website update status shows in the form's Publish button (busy while the website updates), not as a chip in the top
// bar (it squeezed the page title on a phone) and not as a message; only a failure is a message, with a link to System
// status. Checks the wiring in the sources. Run: node --test src/buildToast.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('the top bar has no build chip', () => {
  assert.equal(existsSync(new URL('./BuildChip.tsx', import.meta.url)), false);
  assert.doesNotMatch(read('./Screen.tsx'), /BuildChip/);
});

test('the Publish button is busy while the website updates and stays until then', () => {
  const frame = read('./FormFrame.tsx');
  assert.match(frame, /useBuildState\(\) === 'updating'/);
  assert.match(frame, /busy=\{publishing\}/);
  assert.match(frame, /publish\?\.label \|\| publishing/);
});

test('only a failed update is a message, with a link to System status', () => {
  const app = read('./App.tsx');
  assert.match(app, /setBuildState\('updating'\)/);
  assert.match(app, /to: 'status' \} \},\s*!byServer,\s*!online,?\s*\)/);
  assert.doesNotMatch(app, /progress: true/);
});
