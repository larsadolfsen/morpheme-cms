// Tests for lib/releaseNotes.mjs: checks pending release notes, groups them per version, picks a locale's notes and lists installed versions.
// Run: node --test lib/releaseNotes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problemsOf, released, notesFor, installedVersions } from './releaseNotes.mjs';

const note = (id, overrides = {}) => ({ id, title: `Title ${id}`, why: `Why ${id}`, how: `How ${id}`, what: `What ${id}`, ...overrides });

test('problemsOf is empty when every note has its twin and all fields', () => {
  assert.deepEqual(problemsOf({ 'en-US': { a: note('a') }, 'da-DK': { a: note('a') } }), []);
});
test('problemsOf names a note missing in a locale', () => {
  const problems = problemsOf({ 'en-US': { a: note('a') } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /\ba\b/);
  assert.match(problems[0], /da-DK/);
});
test('problemsOf names a note whose id differs from its file name', () => {
  const problems = problemsOf({ 'en-US': { a: note('b') }, 'da-DK': { a: note('a') } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /\ba\b/);
});
test('problemsOf names an empty field', () => {
  const problems = problemsOf({ 'en-US': { a: note('a', { why: '' }) }, 'da-DK': { a: note('a') } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /why/);
});

test('released groups the notes of each locale by version, sorted by id', () => {
  const pending = { 'en-US': { b: note('b'), a: note('a') } };
  assert.deepEqual(released(pending, '0.14.0'), { 'en-US': { version: '0.14.0', notes: [note('a'), note('b')] } });
});
test('released gives nothing without notes', () => assert.deepEqual(released({}, '0.14.0'), {}));

test('notesFor gives the locale notes when there are some', () => {
  const x = note('x');
  const y = note('y');
  assert.deepEqual(notesFor({ 'en-US': [x], 'da-DK': [y] }, 'da-DK'), [y]);
});
test('notesFor falls back to the en-US notes', () => {
  const x = note('x');
  assert.deepEqual(notesFor({ 'en-US': [x] }, 'da-DK'), [x]);
});
test('notesFor gives undefined without notes', () => assert.equal(notesFor(undefined, 'da-DK'), undefined));

test('installedVersions gives the finished update range, newest first', () => {
  const update = { from: '0.13.0', to: '0.14.1', state: 'done' };
  assert.deepEqual(installedVersions(update, '0.14.1', ['0.14.0', '0.14.1', '0.15.0']), ['0.14.1', '0.14.0']);
});
test('installedVersions gives only the running version when the update went to another version', () => {
  assert.deepEqual(installedVersions({ to: '0.14.0', state: 'done' }, '0.14.1', ['0.14.1']), ['0.14.1']);
});
test('installedVersions gives only the running version, and only when it is kept', () => {
  assert.deepEqual(installedVersions(null, '0.14.1', ['0.14.0']), []);
});
