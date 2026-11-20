// Tests for lib/build-command.mjs. Run: node --test lib/build-command.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILD_COMMAND, usesCiBuild, withCiBuild } from './build-command.mjs';

const old = `{
  // comment with "command": "x"
  "name": "site",
  "build": {
    "command": "npm run check && npm run build",
  },
  "keep_vars": true,
}
`;

test('the CI build command is recognised', () => {
  assert.equal(usesCiBuild(withCiBuild(old)), true);
  assert.equal(usesCiBuild('{ "build": { "command": "node scripts/install-cms.mjs && npx morpheme ci-build" } }'), true);
  assert.equal(usesCiBuild(old), false);
});

test('a build command of another kind is replaced once, the rest stays', () => {
  const out = withCiBuild(old);
  assert.equal(out, old.replace('npm run check && npm run build', BUILD_COMMAND));
  assert.equal(withCiBuild(out), null);
});

test('no build block or no command is left alone', () => {
  assert.equal(withCiBuild('{ "name": "x" }'), null);
  assert.equal(withCiBuild('{ "build": { "cwd": "." } }'), null);
  assert.equal(usesCiBuild('{ "name": "x" }'), true);
});

test('a missing file is neither wrong nor changed', () => {
  assert.equal(usesCiBuild(undefined), true);
  assert.equal(withCiBuild(null), null);
});
