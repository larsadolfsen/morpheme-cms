// Run: node --test lib/editorWorker.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_WORKER, REAL_WORKER, editorWorkerUrl } from './editorWorker.mjs';

test('a real build registers the plain worker', () => {
  assert.equal(editorWorkerUrl({}), REAL_WORKER);
  assert.equal(editorWorkerUrl(undefined), REAL_WORKER);
});

test("a demo build registers the demo's worker", () => {
  assert.equal(editorWorkerUrl({ moEditorWorker: DEMO_WORKER }), DEMO_WORKER);
});

test('any other value falls back to the plain worker', () => {
  assert.equal(editorWorkerUrl({ moEditorWorker: '/evil.js' }), REAL_WORKER);
});
