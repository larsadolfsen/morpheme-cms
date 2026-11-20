// Tests for src/widgetValues.mjs: the settings form's starting values and the values a placement keeps. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuesOf, changedOf } from './widgetValues.mjs';

test('valuesOf gives the defaults when nothing is stored', () => {
  assert.deepEqual(valuesOf({ weeks: 8, title: 'Rhythm' }, {}), { weeks: 8, title: 'Rhythm' });
  assert.deepEqual(valuesOf({ weeks: 8 }, undefined), { weeks: 8 });
  assert.deepEqual(valuesOf(undefined, { a: 1 }), { a: 1 });
  assert.deepEqual(valuesOf(undefined, undefined), {});
});

test('valuesOf lays the stored values over the defaults', () => {
  assert.deepEqual(valuesOf({ weeks: 8, title: 'Rhythm' }, { weeks: 12 }), { weeks: 12, title: 'Rhythm' });
  assert.deepEqual(valuesOf({ weeks: 8 }, { extra: true }), { weeks: 8, extra: true });
});

test('changedOf is empty when the values are the defaults', () => {
  assert.deepEqual(changedOf({ weeks: 8, title: 'Rhythm' }, { weeks: 8, title: 'Rhythm' }), {});
  assert.deepEqual(changedOf(undefined, {}), {});
});

test('changedOf keeps a changed value and drops the others', () => {
  assert.deepEqual(changedOf({ weeks: 8, title: 'Rhythm' }, { weeks: 12, title: 'Rhythm' }), { weeks: 12 });
});

test('changedOf drops a value set back to its default', () => {
  const defaults = { weeks: 8 };
  const stored = valuesOf(defaults, { weeks: 12 });
  assert.deepEqual(changedOf(defaults, { ...stored, weeks: 8 }), {});
});

test('changedOf keeps an emptied value when the default is not empty', () => {
  assert.deepEqual(changedOf({ title: 'Rhythm' }, { title: '' }), { title: '' });
  assert.deepEqual(changedOf({ title: 'Rhythm' }, { title: undefined }), { title: '' });
  assert.deepEqual(changedOf({ title: 'Rhythm' }, {}), { title: '' });
  assert.deepEqual(changedOf({ tags: ['a'] }, {}), { tags: [] });
});

test('changedOf drops an empty value when the default is empty', () => {
  assert.deepEqual(changedOf({ title: '' }, { title: '' }), {});
  assert.deepEqual(changedOf({}, { title: '' }), {});
  assert.deepEqual(changedOf({}, { title: undefined }), {});
});

test('changedOf keeps a value that has no default', () => {
  assert.deepEqual(changedOf({}, { title: 'Hi' }), { title: 'Hi' });
  assert.deepEqual(changedOf(undefined, { title: 'Hi' }), { title: 'Hi' });
});

test('changedOf compares nested and array values by their JSON', () => {
  const defaults = { days: ['mon', 'tue'], range: { from: 1, to: 2 } };
  assert.deepEqual(changedOf(defaults, { days: ['mon', 'tue'], range: { from: 1, to: 2 } }), {});
  assert.deepEqual(changedOf(defaults, { days: ['mon'], range: { from: 1, to: 2 } }), { days: ['mon'] });
  assert.deepEqual(changedOf(defaults, { days: ['mon', 'tue'], range: { from: 1, to: 3 } }), { range: { from: 1, to: 3 } });
});

test('the helpers do not change their inputs', () => {
  const defaults = { weeks: 8, days: ['mon'] };
  const stored = { weeks: 12 };
  const values = { weeks: 12, days: ['mon'] };
  const before = JSON.stringify([defaults, stored, values]);
  valuesOf(defaults, stored);
  changedOf(defaults, values);
  assert.equal(JSON.stringify([defaults, stored, values]), before);
});
