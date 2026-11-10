// Tests for lib/appProblemLines.mjs: problems with the same place, hook and message become one line.
// Uses node:test.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupProblems } from './appProblemLines.mjs';

const p = (extra = {}) => ({ app: 'a', place: 'hook', hook: 'page-colors', error: 'Error', message: 'boom', ...extra });

test('no problems give no lines', () => {
  assert.deepEqual(groupProblems([]), []);
});

test('one problem is one line with its page', () => {
  assert.deepEqual(groupProblems([p({ page: '/en/' })]), [{ place: 'hook', hook: 'page-colors', message: 'boom', pages: ['/en/'] }]);
});

test('the same hook and message on several pages is one line with all pages', () => {
  const lines = groupProblems([p({ page: '/a' }), p({ page: '/b' }), p({ page: '/c' })]);
  assert.equal(lines.length, 1);
  assert.deepEqual(lines[0].pages, ['/a', '/b', '/c']);
});

test('a page found twice counts once', () => {
  assert.deepEqual(groupProblems([p({ page: '/a' }), p({ page: '/a' })])[0].pages, ['/a']);
});

test('another message, hook or place is another line, in the order first found', () => {
  const lines = groupProblems([
    p({ page: '/a' }),
    p({ page: '/a', message: 'other' }),
    p({ page: '/b', hook: 'head' }),
    p({ page: '/b', place: 'manifest', hook: undefined }),
    p({ page: '/b' }),
  ]);
  assert.deepEqual(
    lines.map((l) => [l.place, l.hook, l.message, l.pages]),
    [
      ['hook', 'page-colors', 'boom', ['/a', '/b']],
      ['hook', 'page-colors', 'other', ['/a']],
      ['hook', 'head', 'boom', ['/b']],
      ['manifest', undefined, 'boom', ['/b']],
    ],
  );
});

test('a problem without a page gives a line without pages', () => {
  assert.deepEqual(groupProblems([p(), p()])[0].pages, []);
});
