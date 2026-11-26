import assert from 'node:assert/strict';
import { test } from 'node:test';
import { partWords, statementOf } from './themeAccessibility.mjs';

const fixture = {
  standard: 'WCAG 2.2 AA',
  measured: '0.19.8',
  score: 50,
  checks: [
    { criterion: '1.4.3', part: 'text', ok: true, why: 'Text lowest 4.62:1, needs 4.5:1' },
    { criterion: '1.4.3', part: 'placeholder', ok: false, why: 'Placeholder 3.10:1 against #ffffff, under 4.5:1' },
  ],
};

test('No file, or no checks, means not measured', () => {
  assert.equal(statementOf(undefined).state, 'unmeasured');
  assert.equal(statementOf(null).state, 'unmeasured');
  assert.equal(statementOf({ standard: 'WCAG 2.2 AA', fallsShort: [] }).state, 'unmeasured');
  assert.equal(statementOf({ checks: [] }).state, 'unmeasured');
});

test('A measured theme gives its score, version and checks, the failed first', () => {
  const s = statementOf(fixture);
  assert.equal(s.state, 'measured');
  assert.equal(s.score, 50);
  assert.equal(s.measured, '0.19.8');
  assert.deepEqual(
    s.checks.map((c) => `${c.part} ${c.ok}`),
    ['placeholder false', 'text true'],
  );
});

test('A low score is shown as it is, never judged', () => {
  const s = statementOf({ ...fixture, score: 20 });
  assert.equal(s.score, 20);
});

test('A malformed check is left out', () => {
  assert.equal(statementOf({ checks: [{ part: 'x' }, null, 3] }).state, 'unmeasured');
});

test('A part with no name of its own is shown as words', () => {
  assert.equal(partWords('outlined-card-edge'), 'Outlined card edge');
});

import { ringScoreOf } from './themeAccessibility.mjs';

// A fixture catalog: the gallery draws a ring for an entry with a score and none for one without (a theme not measured has no score, never a 0).
const catalog = [
  { id: 'saturn', name: 'Material', score: 92, measured: '0.19.8' },
  { id: 'venus', name: 'Venus', score: 0, measured: '0.19.8' },
  { id: 'mars', name: 'Mars' },
  { id: 'moon', name: 'Moon', score: 'high' },
  { id: 'sun', name: 'Sun', score: 140 },
];

test('The gallery draws a ring for an entry with a score and none without', () => {
  assert.deepEqual(
    catalog.map((x) => [x.id, ringScoreOf(x)]),
    [
      ['saturn', 92],
      ['venus', 0],
      ['mars', undefined],
      ['moon', undefined],
      ['sun', undefined],
    ],
  );
});
