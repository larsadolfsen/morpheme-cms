// Tests of the pure parts of the screen reader check (scripts/announce.mjs, scripts/allowlist.mjs). Run: node --test scripts/announce.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeAllowlist } from './allowlist.mjs';
import { badName, judgeWindow, nameProblem, speech } from './announce.mjs';

test('a name that is an icon, punctuation, a role, a file or an id is bad', () => {
  assert.equal(nameProblem('', 'button'), 'no-name');
  assert.equal(nameProblem('more_vert', 'button'), 'icon-name');
  assert.equal(nameProblem('arrowBack Back', 'button'), 'icon-name');
  assert.equal(nameProblem('…', 'button'), 'bad-name');
  assert.equal(nameProblem('Button', 'button'), 'bad-name');
  assert.equal(nameProblem('photo.jpg', 'link'), 'bad-name');
  assert.equal(nameProblem('3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f', 'link'), 'bad-name');
  assert.equal(nameProblem('Remove Contact', 'button'), null);
  assert.equal(nameProblem('Save', 'button'), null);
  assert.equal(badName('Add tag', 'button'), null);
});

const at = (t, text, region, extra = {}) => ({ t, kind: 'live', text, urgency: 'polite', region, inserted: false, ...extra });

test('a step that must be announced needs a text from a region that was there before', () => {
  assert.deepEqual(judgeWindow([], { expect: { urgent: false } }), ['no-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1, { unreachable: true })], { expect: { urgent: false } }), ['no-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1, { inserted: true })], { expect: { urgent: false } }), ['no-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1)], { expect: { urgent: false } }), []);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1)], {}), []);
});

test('the same text from two regions within a second is said twice, from one region it is not', () => {
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1), at(300, 'Saved', 2)]), ['double-announcement']);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1), at(300, 'Saved', 1)]), []);
  assert.deepEqual(judgeWindow([at(1, 'Saved', 1), at(2000, 'Saved', 2)]), []);
});

test('an error must be urgent and a status must not', () => {
  assert.deepEqual(judgeWindow([at(1, 'Not saved', 1)], { expect: { urgent: true } }), ['wrong-urgency']);
  assert.deepEqual(judgeWindow([at(1, 'Not saved', 1, { urgency: 'urgent' })], { expect: { urgent: false } }), ['wrong-urgency']);
  assert.deepEqual(judgeWindow([at(1, 'Not saved', 1, { urgency: 'urgent' })], { expect: { urgent: true } }), []);
});

test('the speech of a node: heading level, name, role and states', () => {
  const node = (role, name, props = []) => ({
    role: { value: role },
    name: { value: name },
    properties: props.map(([n, v]) => ({ name: n, value: { value: v } })),
  });
  assert.equal(speech(node('heading', 'Pages', [['level', 1]])).text, 'Heading level 1, Pages');
  assert.equal(speech(node('button', 'More', [['expanded', true]])).text, 'More, button, expanded');
  assert.equal(speech(node('button', '')).text, '(no name), button');
});

test('the allowlist matching: a finding it does not hold and an entry that found nothing are both problems', () => {
  const list = makeAllowlist({ file: new URL('x-allowlist.json', import.meta.url), field: 'problem', label: 'x', collectEnv: 'X_COLLECT' });
  const found = list.keysOf([{ problem: 'no-name', selector: 'button.a' }], '#home', 'computer');
  const allowed = list.allowedKeys([
    { problem: 'tab-state', selector: 'button.b', places: ['#home'], viewports: ['computer', 'phone'], reason: 'r' },
  ]);
  const { unexpected, stale } = list.compare(found, allowed);
  assert.deepEqual(unexpected, ['no-name on #home (computer): button.a']);
  assert.equal(stale.length, 2);
  const entries = list.entriesOf(new Set([...found, ...list.keysOf([{ problem: 'no-name', selector: 'button.a' }], '#home', 'phone')]));
  assert.deepEqual(entries, [
    { problem: 'no-name', selector: 'button.a', places: ['#home'], viewports: ['phone', 'computer'], reason: 'TODO' },
  ]);
});
