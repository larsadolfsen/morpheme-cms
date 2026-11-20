import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bump, changelogTop, checkVersion, compare, levelOf, nextVersion, renameTop, topLevel, versionUnset } from './version-rule.mjs';

const cs = (level) => (level ? `---\n'@morphemecms/cms': ${level}\n---\n\nA note.\n` : '---\n---\n');
const s = (o) => ({ base: 'main', version: '0.18.1', baseVersion: '0.18.1', latest: '0.18.1', published: false, nonEmpty: false, ...o });

test('levelOf, topLevel, bump, compare', () => {
  assert.equal(levelOf(cs('minor')), 'minor');
  assert.equal(levelOf(cs('')), 'none');
  assert.equal(topLevel([cs('patch'), cs(''), cs('minor')]), 'minor');
  assert.equal(topLevel([]), 'none');
  assert.equal(bump('0.18.1', 'patch'), '0.18.2');
  assert.equal(bump('0.18.1', 'minor'), '0.19.0');
  assert.equal(compare('0.19.0', '0.18.9'), 1);
  assert.equal(compare('0.18.1', '0.18.1'), 0);
});

// Today: main is 0.18.1 = latest, and fixes with patch or empty changesets keep working.
test('main today passes: version = latest 0.18.1, patch changeset', () => assert.deepEqual(checkVersion(s({ nonEmpty: true })), []));
test('main today passes with only empty changesets', () => assert.deepEqual(checkVersion(s({})), []));
// feature/tailwind sets 0.19.0.
test('feature/tailwind into main: 0.19.0, one minor above 0.18.1', () =>
  assert.deepEqual(checkVersion(s({ version: '0.19.0', nonEmpty: true })), []));
test('feature/tailwind first PR into feature/tailwind', () =>
  assert.deepEqual(checkVersion(s({ base: 'feature/tailwind', version: '0.19.0' })), []));
test('next patch passes', () => assert.deepEqual(checkVersion(s({ version: '0.18.2', nonEmpty: true })), []));
test('two steps above fails', () => {
  assert.equal(checkVersion(s({ version: '0.19.1' })).length, 1);
  assert.equal(checkVersion(s({ version: '0.18.3' })).length, 1);
  assert.equal(checkVersion(s({ version: '0.20.0' })).length, 1);
});
test('a published version above latest fails', () =>
  assert.match(checkVersion(s({ version: '0.19.0', published: true }))[0], /already published/));
test('below latest fails', () => assert.equal(checkVersion(s({ version: '0.18.0' })).length, 1));
test('once 0.19.0 is released, version = latest with a non-empty changeset fails', () => {
  const p = checkVersion(s({ version: '0.19.0', latest: '0.19.0', nonEmpty: true }));
  assert.equal(p.length, 1);
  assert.match(p[0], /Set the feature's version: 0\.19\.1/);
});
test('once 0.19.0 is released, version = latest with only empty changesets passes', () =>
  assert.deepEqual(checkVersion(s({ version: '0.19.0', latest: '0.19.0' })), []));
test('into feature/*, only the first pull request is checked', () => {
  assert.deepEqual(checkVersion(s({ base: 'feature/x', version: '0.19.0', baseVersion: '0.19.0', latest: '0.18.1' })), []);
  assert.equal(checkVersion(s({ base: 'feature/x', version: '0.25.0', baseVersion: '0.18.1' })).length, 1);
  assert.deepEqual(checkVersion(s({ base: 'feature/x', version: '0.18.1', baseVersion: '0.18.1', nonEmpty: true, latest: '0.19.0' })), []);
});
test('other bases are not checked', () => assert.deepEqual(checkVersion(s({ base: '0.18', version: '9.9.9' })), []));

const log = '# @morphemecms/cms\n\n## 0.18.1\n\n### Patch Changes\n\n- a\n\n## 0.18.0\n\n- b\n';
test('changelog helpers', () => {
  assert.equal(changelogTop(log), '0.18.1');
  assert.equal(versionUnset('0.18.1', log), true);
  assert.equal(versionUnset('0.19.0', log), false);
  const renamed = renameTop(log.replace('## 0.18.1', '## 0.20.0'), '0.19.0');
  assert.equal(changelogTop(renamed), '0.19.0');
  assert.match(renamed, /## 0\.18\.0/);
});

test('next: the set version, with -next-<time>', () =>
  assert.equal(
    nextVersion({ version: '0.19.0', changelog: log, changesets: [cs('minor')], time: '20261119100000' }),
    '0.19.0-next-20261119100000',
  ));
test('next: a patch changeset does not move a set version', () =>
  assert.equal(nextVersion({ version: '0.19.1', changelog: log, changesets: [cs('minor'), cs('patch')], time: 't' }), '0.19.1-next-t'));
test('next: only empty changesets stage nothing', () =>
  assert.equal(nextVersion({ version: '0.19.0', changelog: log, changesets: [cs(''), cs('')], time: 't' }), ''));
test('next: while no version is set, the computed one (as the snapshot gave)', () =>
  assert.equal(nextVersion({ version: '0.18.1', changelog: log, changesets: [cs('patch')], time: 't' }), '0.18.2-next-t'));
