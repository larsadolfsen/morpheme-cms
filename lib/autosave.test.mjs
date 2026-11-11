// Tests for lib/autosave.mjs. Run: node --test lib/autosave.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { autosaveKey, EXPIRE_MS, IDLE_MS, isPagePath, parseKey, sweepAction } from './autosave.mjs';

test('the key holds the site, the page file and the version id, and parses back', () => {
  const key = autosaveKey('me/site', 'src/content/pages/about.md');
  assert.equal(key, 'me/site/autosave/src/content/pages/about.md/waiting');
  assert.deepEqual(parseKey('me/site', key), { path: 'src/content/pages/about.md', id: 'waiting' });
  assert.deepEqual(parseKey('me/site', autosaveKey('me/site', 'src/content/blog/a.md', 'later')), {
    path: 'src/content/blog/a.md',
    id: 'later',
  });
});

test('paths and ids that are not allowed', () => {
  for (const path of [
    'src/content/../x.md',
    'pages/about.md',
    'src/content/a.txt',
    '/src/content/a.md',
    'src/content/a\\b.md',
    7,
    undefined,
  ])
    assert.equal(isPagePath(path), false, String(path));
  assert.throws(() => autosaveKey('me/site', 'src/content/a.md', 'Bad Id'));
  assert.throws(() => autosaveKey('me/site', 'src/content/a.md', 'index'));
  assert.equal(parseKey('me/site', 'other/autosave/src/content/a.md/waiting'), null);
  assert.equal(parseKey('me/site', 'me/site/autosave/src/content/a.md/Bad'), null);
  assert.equal(parseKey('me/site', 'me/site/blob/abc'), null);
});

test('an autosave is kept, moved to git when idle, and deleted when old and not moved', () => {
  const now = 10 * EXPIRE_MS;
  assert.equal(sweepAction(now - 1000, now, true), 'keep');
  assert.equal(sweepAction(now - IDLE_MS, now, true), 'flush');
  assert.equal(sweepAction(now - IDLE_MS, now, false), 'keep');
  assert.equal(sweepAction(now - EXPIRE_MS, now, true), 'delete');
  assert.equal(sweepAction(now - EXPIRE_MS, now, false), 'delete');
});
