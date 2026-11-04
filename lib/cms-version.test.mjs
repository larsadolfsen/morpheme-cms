// Tests for lib/cms-version.mjs: which CMS version a site takes, and when an update is undone.
// Run: node --test packages/editor/lib/cms-version.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGE, WATCH_LIMIT, compareVersions, managedVersion, nextVersion, watchStep } from './cms-version.mjs';

test('the package is the CMS', () => assert.equal(PACKAGE, '@morphemecms/cms'));
test('the watch limit is 20 minutes', () => assert.equal(WATCH_LIMIT, 20 * 60 * 1000));

test('compareVersions: older is -1', () => assert.equal(compareVersions('0.1.0', '0.1.1'), -1));
test('compareVersions: compares number by number', () => assert.equal(compareVersions('0.10.0', '0.9.9'), 1));
test('compareVersions: equal is 0', () => assert.equal(compareVersions('0.1.1', '0.1.1'), 0));
test('compareVersions: a pre-release throws', () =>
  assert.throws(() => compareVersions('0.2.0-next-1', '0.1.0'), { message: 'pre-release' }));

const lock = { packages: {} };
const dep = (value) => ({ dependencies: { [PACKAGE]: value } });

test('managedVersion: an exact version is managed', () => assert.deepEqual(managedVersion(dep('0.1.1'), lock), { version: '0.1.1' }));
test('managedVersion: * is a workspace', () => assert.deepEqual(managedVersion(dep('*'), lock), { reason: 'workspace' }));
test('managedVersion: workspace:* is a workspace', () =>
  assert.deepEqual(managedVersion(dep('workspace:*'), lock), { reason: 'workspace' }));
test('managedVersion: a tag is a tag', () => assert.deepEqual(managedVersion(dep('next'), lock), { reason: 'tag' }));
test('managedVersion: ^ is a range', () => assert.deepEqual(managedVersion(dep('^0.1.0'), lock), { reason: 'range' }));
test('managedVersion: ~ is a range', () => assert.deepEqual(managedVersion(dep('~0.1.0'), lock), { reason: 'range' }));
test('managedVersion: a linked lock entry is a link', () => {
  const linked = { packages: { 'node_modules/@morphemecms/cms': { link: true } } };
  assert.deepEqual(managedVersion(dep('0.1.1'), linked), { reason: 'link' });
});
test('managedVersion: no dependency is missing', () => assert.deepEqual(managedVersion({}, lock), { reason: 'missing' }));
test('managedVersion: devDependencies count', () => {
  assert.deepEqual(managedVersion({ devDependencies: { [PACKAGE]: '0.1.0' } }, lock), { version: '0.1.0' });
});

test('nextVersion: a patch is taken by itself', () =>
  assert.deepEqual(nextVersion('0.1.0', '0.1.1', []), { version: '0.1.1', auto: true }));
test('nextVersion: a minor is taken by itself', () =>
  assert.deepEqual(nextVersion('0.1.1', '0.2.0', []), { version: '0.2.0', auto: true }));
test('nextVersion: a major is not', () => {
  assert.deepEqual(nextVersion('0.9.0', '1.0.0', []), { version: '1.0.0', auto: false, why: 'major' });
});
test('nextVersion: a skipped version is not', () => {
  assert.deepEqual(nextVersion('0.1.0', '0.1.1', ['0.1.1']), { version: '0.1.1', auto: false, why: 'skipped' });
});
test('nextVersion: the same version is null', () => assert.equal(nextVersion('0.1.1', '0.1.1', []), null));
test('nextVersion: an older version is null', () => assert.equal(nextVersion('0.2.0', '0.1.9', []), null));
test('nextVersion: a pre-release is null', () => assert.equal(nextVersion('0.1.0', '0.2.0-next-20261103', []), null));

const at = '2026-11-03T12:00:00.000Z';
const min = 60 * 1000;
const t0 = Date.parse(at);
const waiting = { state: 'waiting', from: '0.1.0', to: '0.1.1', at };
const undoing = { state: 'undoing', from: '0.1.0', to: '0.1.1', at, undoAt: at };

test('watchStep waiting: the running version wins', () => assert.equal(watchStep(waiting, '0.1.1', null, t0 + 5 * min), 'done'));
test('watchStep waiting: the running version wins over a failure', () => assert.equal(watchStep(waiting, '0.1.1', 'failure', t0), 'done'));
test('watchStep waiting: a failed check undoes', () => assert.equal(watchStep(waiting, '0.1.0', 'failure', t0 + 5 * min), 'undo'));
test('watchStep waiting: 19 minutes waits', () => assert.equal(watchStep(waiting, '0.1.0', null, t0 + 19 * min), 'wait'));
test('watchStep waiting: 21 minutes undoes', () => assert.equal(watchStep(waiting, '0.1.0', null, t0 + 21 * min), 'undo'));
test('watchStep waiting: a success that is not online yet waits', () =>
  assert.equal(watchStep(waiting, '0.1.0', 'success', t0 + 5 * min), 'wait'));

test('watchStep undoing: success is undone', () => assert.equal(watchStep(undoing, '0.1.0', 'success', t0), 'undone'));
test('watchStep undoing: failure is stuck', () => assert.equal(watchStep(undoing, '0.1.0', 'failure', t0), 'stuck'));
test('watchStep undoing: 21 minutes is undone', () => assert.equal(watchStep(undoing, '0.1.0', null, t0 + 21 * min), 'undone'));
test('watchStep undoing: 5 minutes waits', () => assert.equal(watchStep(undoing, '0.1.0', null, t0 + 5 * min), 'wait'));
test('watchStep: any other state waits', () =>
  assert.equal(watchStep({ ...waiting, state: 'done' }, '0.1.0', 'failure', t0 + 30 * min), 'wait'));
