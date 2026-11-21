import assert from 'node:assert/strict';
import { test } from 'node:test';
import { partWords, statementOf } from './themeAccessibility.mjs';

const fixture = {
  standard: 'WCAG 2.2 AA',
  fallsShort: [
    { criterion: '1.4.3', part: 'placeholder', why: 'Material 3: a placeholder is 60% of its on-colour' },
    { criterion: '1.4.11', part: 'outlined-card-edge', why: 'Material 3: the Outlined card’s edge is outline-variant' },
  ],
};

test('No file means not checked', () => {
  assert.equal(statementOf(undefined).state, 'unchecked');
  assert.equal(statementOf(null).state, 'unchecked');
});

test('An empty list means the theme meets the standard', () => {
  assert.deepEqual(statementOf({ standard: 'WCAG 2.2 AA', fallsShort: [] }), { state: 'meets', standard: 'WCAG 2.2 AA', shortfalls: [] });
  assert.equal(statementOf({}).state, 'meets');
});

test('Shortfalls are listed with their part and criterion', () => {
  const s = statementOf(fixture);
  assert.equal(s.state, 'short');
  assert.deepEqual(
    s.shortfalls.map((x) => `${x.part} ${x.criterion}`),
    ['placeholder 1.4.3', 'outlined-card-edge 1.4.11'],
  );
});

test('A malformed entry is left out', () => {
  assert.equal(statementOf({ fallsShort: [{ part: 'x' }, null, 3] }).state, 'meets');
});

test('A part with no name of its own is shown as words', () => {
  assert.equal(partWords('outlined-card-edge'), 'Outlined card edge');
});
