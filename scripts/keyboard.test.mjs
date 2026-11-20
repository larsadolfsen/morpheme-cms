import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PROBLEMS,
  allowedKeys,
  cleanSelector,
  compare,
  entriesOf,
  keysOf,
  problemsOf,
  readAllowlist,
  runsHere,
  viewportOf,
} from './keyboard.mjs';
import { FLOWS, PHONE_FLOWS } from './keyboard-flows.mjs';

const entry = (problem, selector, places, viewports = ['phone', 'computer']) => ({
  problem,
  selector,
  places,
  viewports,
  reason: 'because',
});
const finding = (problem, selector) => ({ problem, selector });

test('A problem that is not on the allowlist fails', () => {
  const found = keysOf([finding('covered', 'button.a'), finding('trap', 'a.b')], '#new/pages', 'computer');
  const result = compare(found, allowedKeys([entry('covered', 'button.a', ['#new/pages'])]));
  assert.equal(result.unexpected.length, 1);
  assert.match(result.unexpected[0], /trap on #new\/pages \(computer\): a\.b/);
  assert.ok(problemsOf(result)[0].includes('new problem'));
});

test('An entry that no longer matches fails, so the list only shrinks', () => {
  const found = keysOf([finding('covered', 'button.a')], '#new/pages', 'computer');
  const allowed = allowedKeys([entry('covered', 'button.a', ['#new/pages', '#new/blog']), entry('invisible', 'iframe', ['#new/pages'])]);
  const result = compare(found, allowed);
  assert.deepEqual(result.unexpected, []);
  // Of the 6 keys the entries stand for, only one was found: 5 are stale.
  assert.equal(result.stale.length, 5);
  assert.ok(problemsOf(result).every((line) => line.includes('no longer matches')));
});

test('A place and a viewport are matched on their own', () => {
  const found = keysOf([finding('flow-lost-focus', 'A: after Save')], 'flow A', 'phone');
  const allowed = allowedKeys([entry('flow-lost-focus', 'A: after Save', ['flow A', 'flow B'])], (place) => place === 'flow A');
  for (const key of [...allowed.keys()]) if (!key.endsWith('\tphone')) allowed.delete(key);
  assert.deepEqual(compare(found, allowed), { unexpected: [], stale: [] });
});

test('A selector loses the ids React makes', () => {
  assert.equal(cleanSelector('div#:r1a: > input[id=_r_3f_]'), 'div#r* > input[id=r*]');
});

test('Findings group into entries by problem, selector and viewports', () => {
  const keys = new Set([
    ...keysOf([finding('covered', 'a')], '#x', 'phone'),
    ...keysOf([finding('covered', 'a')], '#x', 'computer'),
    ...keysOf([finding('covered', 'a')], '#y', 'phone'),
  ]);
  assert.deepEqual(entriesOf(keys), [
    { problem: 'covered', selector: 'a', places: ['#x'], viewports: ['phone', 'computer'], reason: 'TODO' },
    { problem: 'covered', selector: 'a', places: ['#y'], viewports: ['phone'], reason: 'TODO' },
  ]);
});

test('The check runs in the repository and not in a package a site installed', () => {
  assert.equal(runsHere('/work/morpheme-cms/scripts/keyboard.mjs'), true);
  assert.equal(runsHere('/site/node_modules/@morphemecms/cms/scripts/keyboard.mjs'), false);
  assert.equal(viewportOf(390), 'phone');
  assert.equal(viewportOf(1280), 'computer');
});

test('The allowlist holds only known problems, each with a reason, and no entry twice', () => {
  const seen = new Set();
  for (const e of readAllowlist()) {
    assert.ok(PROBLEMS.includes(e.problem), e.problem);
    assert.ok(e.reason && e.reason !== 'TODO', `${e.problem} ${e.selector} has no reason`);
    assert.ok(e.places.length && e.viewports.every((v) => ['phone', 'computer'].includes(v)));
    for (const key of allowedKeys([e]).keys()) {
      assert.ok(!seen.has(key), `${key} is twice on the list`);
      seen.add(key);
    }
  }
});

test('The flows are A to I and the phone ones are among them', () => {
  assert.deepEqual(FLOWS, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
  assert.deepEqual(PHONE_FLOWS, ['A', 'B', 'F']);
});
