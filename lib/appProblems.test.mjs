// Tests for lib/appProblems.mjs: collecting, writing and filtering app problems.
// Uses node:test with a temporary dist folder.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createProblems, PROBLEMS_FILE, problemsOf, writeProblems } from './appProblems.mjs';

const p = (app, extra = {}) => ({ app, place: 'hook', hook: 'onBuild', error: 'Error', message: 'boom', ...extra });

test('add and list keep insertion order', () => {
  const problems = createProblems();
  problems.add(p('a'));
  problems.add(p('b', { place: 'bundle' }));
  problems.add(p('a', { place: 'manifest' }));
  assert.deepEqual(
    problems.list().map((x) => [x.app, x.place]),
    [
      ['a', 'hook'],
      ['b', 'bundle'],
      ['a', 'manifest'],
    ],
  );
});

test('list returns a copy', () => {
  const problems = createProblems();
  problems.add(p('a'));
  const first = problems.list();
  first.push(p('x'));
  first.length = 0;
  assert.equal(problems.list().length, 1);
});

test('writeProblems writes valid JSON with a trailing newline', () => {
  const dir = mkdtempSync(join(tmpdir(), 'problems-'));
  try {
    const list = [p('a'), p('b', { page: '/x' })];
    writeProblems(dir, list);
    const raw = readFileSync(join(dir, '_apps', PROBLEMS_FILE), 'utf8');
    assert.ok(raw.endsWith('\n'));
    assert.deepEqual(JSON.parse(raw), list);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an empty list writes []', () => {
  const dir = mkdtempSync(join(tmpdir(), 'problems-'));
  try {
    writeProblems(dir, []);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, '_apps', '_problems.json'), 'utf8')), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('problemsOf filters by app', () => {
  const all = [p('a'), p('b'), p('a', { place: 'bundle' })];
  assert.equal(problemsOf(all, 'a').length, 2);
  assert.equal(problemsOf(all, 'b').length, 1);
  assert.deepEqual(problemsOf(all, 'c'), []);
});

test('a 600-character message is cut to 500 in add', () => {
  const problems = createProblems();
  problems.add(p('a', { message: 'x'.repeat(600) }));
  assert.equal(problems.list()[0].message.length, 500);
});

test('a 600-character message is cut to 500 in writeProblems', () => {
  const dir = mkdtempSync(join(tmpdir(), 'problems-'));
  try {
    writeProblems(dir, [p('a', { message: 'y'.repeat(600) })]);
    const [out] = JSON.parse(readFileSync(join(dir, '_apps', PROBLEMS_FILE), 'utf8'));
    assert.equal(out.message.length, 500);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
