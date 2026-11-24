import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renameTokens } from './rename-tokens.mjs';

const map = {
  '--mo-comp-a': '--mo-comp-b',
  '--mo-comp-b': '--mo-comp-c',
  '--mo-comp-pad': ['--mo-comp-lead', '--mo-comp-trail'],
};

test('one pass: a reused name does not chain', () => {
  assert.equal(renameTokens('x { --mo-comp-a: 1; y: var(--mo-comp-b); }', map).text, 'x { --mo-comp-b: 1; y: var(--mo-comp-c); }');
});

test('whole names only', () => {
  assert.equal(renameTokens('--mo-comp-a-more --mo-comp-ab --mo-comp-a', map).text, '--mo-comp-a-more --mo-comp-ab --mo-comp-b');
});

test('an old name that becomes several is declared under each and listed where read', () => {
  const r = renameTokens('x { --mo-comp-pad: 1rem; p: var(--mo-comp-pad, 0); }', map);
  assert.equal(r.text, 'x { --mo-comp-lead: 1rem; --mo-comp-trail: 1rem; p: var(--mo-comp-lead, 0); }');
  assert.deepEqual(r.many, [{ line: 1, name: '--mo-comp-pad', now: '--mo-comp-lead, --mo-comp-trail' }]);
});

test('a declaration with no closing semicolon', () => {
  assert.equal(renameTokens('x { --mo-comp-pad: 1rem }', map).text, 'x { --mo-comp-lead: 1rem; --mo-comp-trail: 1rem }');
});
