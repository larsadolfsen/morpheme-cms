// Tests textProblems (text-problems.mjs): each rule reports its string and passes the right one, nested and array keys
// report their full path, functions are called, throwing functions and keys ending in Commit are skipped, and an
// exception hides only its own key and rule.
import assert from 'node:assert/strict';
import test from 'node:test';
import { textProblems } from './text-problems.mjs';

const none = {};

const CASES = [
  ['em-dash', 'Save — now', 'Save now'],
  ['ellipsis', 'Saving...', 'Saving…'],
  ['ellipsis', 'Saving …', 'Saving…'],
  ['abbreviation', 'E.g. a video', 'For example, a video'],
  ['politeness', 'Please try again', 'Try again'],
  ['we', 'We saved it', 'Status'],
  ['we', 'Back to our page', 'Page ids'],
  ['we', 'Then I wrote it', 'Id and i18n'],
  ['exclamation', 'Done!', 'Done'],
  ['ampersand', 'Text & pictures', 'Text and pictures'],
  ['british', 'Colour', 'Color'],
  ['british', 'Grey boxes', 'Gray boxes'],
  ['internal-name', 'Loading the Worker’s settings', 'Loading settings…'],
  ['internal-name', "Loading the Worker's settings", 'Workers Paid'],
  ['internal-name', 'Open the BUCKET', 'Bucketing the photos'],
  ['internal-name', 'Empty the buckets', 'Open the bucketlist'],
  ['internal-name', 'Pick a jurisdiction', 'Pick a region'],
  ['internal-name', 'Edit wrangler.jsonc', 'Edit the settings file'],
];

for (const [id, wrong, right] of CASES) {
  test(`${id}: reports ${JSON.stringify(wrong)} and passes ${JSON.stringify(right)}`, () => {
    const problems = textProblems({ k: wrong }, none);
    assert.equal(problems.length, 1);
    assert.ok(problems[0].startsWith('i18n/en-US › k: '));
    assert.ok(problems[0].endsWith(`(${JSON.stringify(wrong)})`));
    assert.deepEqual(textProblems({ k: right }, none), []);
  });
}

test('a nested key reports its full path', () => {
  const [problem] = textProblems({ media: { empty: 'Nothing here!' } }, none);
  assert.match(problem, /^i18n\/en-US › media\.empty: /);
});

test('array items get their index in the path', () => {
  const [problem] = textProblems({ blocks: { cards: { example: [{ text: 'fine' }, { text: 'Done!' }] } } }, none);
  assert.match(problem, /› blocks\.cards\.example\.1\.text: /);
});

test('a function value is checked', () => {
  const problems = textProblems({ backTo: (to) => `Back to ${to}!` }, none);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /› backTo: /);
});

test('a function that throws is skipped', () => {
  const throws = () => {
    throw new Error('no');
  };
  assert.deepEqual(textProblems({ f: throws }, none), []);
});

test('a key ending in Commit is skipped', () => {
  assert.deepEqual(textProblems({ saveCommit: 'Editor: we saved' }, none), []);
});

test('an exception hides its own key and rule only', () => {
  const allowed = { 'a.b': ['we'] };
  assert.deepEqual(textProblems({ a: { b: 'We saved it' } }, allowed), []);
  assert.equal(textProblems({ a: { c: 'We saved it' } }, allowed).length, 1);
  assert.equal(textProblems({ a: { b: 'We saved it!' } }, allowed).length, 1);
  assert.equal(textProblems({ a: { b: 'We saved it' } }, { 'a.b': ['exclamation'] }).length, 1);
});
