// Tests for lib/cms-version.mjs: which CMS version a site takes, and when an update is undone.
// Run: node --test packages/editor/lib/cms-version.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NIGHT_HOUR,
  PACKAGE,
  WATCH_LIMIT,
  checkDue,
  compareVersions,
  localDay,
  managedVersion,
  nextVersion,
  siteZone,
  watchStep,
} from './cms-version.mjs';

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

test('the night hour is 03:00', () => assert.equal(NIGHT_HOUR, 3));

test('siteZone: a valid timeZone in the config wins', () =>
  assert.equal(siteZone({ timeZone: 'Asia/Tokyo', locale: 'da-DK' }), 'Asia/Tokyo'));
test('siteZone: an invalid timeZone falls back to the locale', () =>
  assert.equal(siteZone({ timeZone: 'Mars/Base', locale: 'da-DK' }), 'Europe/Copenhagen'));
test("siteZone: the locale's country gives the zone", () => {
  assert.equal(siteZone({ locale: 'da-DK' }), 'Europe/Copenhagen');
  assert.equal(siteZone({ locale: 'en-US' }), 'America/New_York');
  assert.equal(siteZone({ locale: 'en-GB' }), 'Europe/London');
});
test('siteZone: a locale without a known country is UTC', () => {
  assert.equal(siteZone({ locale: 'en' }), 'UTC');
  assert.equal(siteZone({ locale: 'xx-ZZ' }), 'UTC');
  assert.equal(siteZone({}), 'UTC');
});

test('localDay: the date and hour in the zone', () => {
  assert.deepEqual(localDay(Date.parse('2026-11-14T02:07:00Z'), 'Europe/Copenhagen'), { date: '2026-11-14', hour: 3 });
  assert.deepEqual(localDay(Date.parse('2026-11-14T02:07:00Z'), 'America/New_York'), { date: '2026-11-13', hour: 21 });
});

const HOUR = 60 * 60 * 1000;
const checkedAt = (iso) => ({ at: iso });

test('checkDue: a site never checked is checked at once, also by day', () => {
  assert.equal(checkDue(Date.parse('2026-11-14T12:07:00Z'), null, 'Europe/Copenhagen'), true);
  assert.equal(checkDue(Date.parse('2026-11-14T00:07:00Z'), { latest: '0.1.0' }, 'Europe/Copenhagen'), true);
});
test('checkDue: not before the night hour', () =>
  assert.equal(checkDue(Date.parse('2026-11-14T01:07:00Z'), checkedAt('2026-11-13T02:07:00Z'), 'Europe/Copenhagen'), false));
test('checkDue: at the night hour when the last check was yesterday', () =>
  assert.equal(checkDue(Date.parse('2026-11-14T02:07:00Z'), checkedAt('2026-11-13T02:07:00Z'), 'Europe/Copenhagen'), true));
test('checkDue: not again the same day', () =>
  assert.equal(checkDue(Date.parse('2026-11-14T03:07:00Z'), checkedAt('2026-11-14T02:07:00Z'), 'Europe/Copenhagen'), false));
test('checkDue: a check in the small hours of today does not count for today', () =>
  assert.equal(checkDue(Date.parse('2026-11-14T02:07:00Z'), checkedAt('2026-11-14T00:07:00Z'), 'Europe/Copenhagen'), true));
test('checkDue: a missed night hour is made up later the same day', () =>
  assert.equal(checkDue(Date.parse('2026-11-14T13:07:00Z'), checkedAt('2026-11-13T02:07:00Z'), 'Europe/Copenhagen'), true));
test('checkDue: an unreachable npm is tried again the next hour', () =>
  assert.equal(
    checkDue(Date.parse('2026-11-14T03:07:00Z'), { at: '2026-11-14T02:07:00Z', problem: { kind: 'unreachable' } }, 'Europe/Copenhagen'),
    true,
  ));
test('checkDue: another problem waits for the next day', () =>
  assert.equal(
    checkDue(Date.parse('2026-11-14T03:07:00Z'), { at: '2026-11-14T02:07:00Z', problem: { kind: 'major' } }, 'Europe/Copenhagen'),
    false,
  ));

/** Runs the hourly cron at :07 from `from` for `days`, checking when due; the local dates and hours of the checks. */
function simulate(zone, from, days) {
  const checks = [];
  let checked = { at: new Date(Date.parse(from) - 2 * HOUR).toISOString() };
  for (let t = Date.parse(from); t < Date.parse(from) + days * 24 * HOUR; t += HOUR) {
    if (!checkDue(t, checked, zone)) continue;
    checked = { at: new Date(t).toISOString() };
    checks.push(localDay(t, zone));
  }
  return checks;
}

for (const [zone, from, what] of [
  ['Europe/Copenhagen', '2026-03-25T00:07:00Z', 'spring forward'],
  ['Europe/Copenhagen', '2026-10-21T00:07:00Z', 'fall back'],
  ['America/New_York', '2026-03-05T00:07:00Z', 'spring forward'],
  ['America/New_York', '2026-10-29T00:07:00Z', 'fall back'],
  ['Asia/Kolkata', '2026-11-10T00:07:00Z', 'a half-hour zone'],
  ['UTC', '2026-11-10T00:07:00Z', 'no summer time'],
]) {
  test(`checkDue: once a day at the night hour in ${zone} (${what})`, () => {
    const checks = simulate(zone, from, 10);
    const dates = checks.map((c) => c.date);
    assert.equal(new Set(dates).size, dates.length, 'a day was checked twice');
    assert.ok(checks.length >= 9, `only ${checks.length} checks in 10 days`);
    for (let i = 1; i < dates.length; i++) {
      const gap = (Date.parse(dates[i]) - Date.parse(dates[i - 1])) / (24 * HOUR);
      assert.equal(gap, 1, `a day was skipped between ${dates[i - 1]} and ${dates[i]}`);
    }
    for (const c of checks.slice(1)) assert.equal(c.hour, NIGHT_HOUR, `checked at ${c.date} ${c.hour}:07`);
  });
}
