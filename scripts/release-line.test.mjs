import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bump, carryLine, checkCarry, checkIntoLine, levelOf, readLines } from './release-line.mjs';

const lines = { 0.18: { allow: 'patch', series: '0.18' } };
const cs = (file, level) => ({
  file: `.changeset/${file}.md`,
  text: level ? `---\n'@morphemecms/cms': ${level}\n---\n\nA note.\n` : '---\n---\n',
});

test('levelOf reads the level, and an empty changeset is none', () => {
  assert.equal(levelOf(cs('a', 'patch').text), 'patch');
  assert.equal(levelOf(cs('a', 'minor').text), 'minor');
  assert.equal(levelOf(cs('a', '').text), 'none');
  assert.equal(levelOf('---\n"other": major\n---\n'), 'none');
});

test('into 0.18: patch is ok', () => assert.deepEqual(checkIntoLine('0.18', [cs('a', 'patch')], lines), []));
test('into 0.18: an empty changeset is ok', () => assert.deepEqual(checkIntoLine('0.18', [cs('a', '')], lines), []));
test('into 0.18: minor fails and names the file and the level', () => {
  const p = checkIntoLine('0.18', [cs('ok', 'patch'), cs('bad', 'minor')], lines);
  assert.equal(p.length, 1);
  assert.match(p[0], /\.changeset\/bad\.md/);
  assert.match(p[0], /patch or empty/);
});
test('into 0.18: major fails', () => assert.equal(checkIntoLine('0.18', [cs('a', 'major')], lines).length, 1));
test('into a branch that is no line: nothing to check', () => assert.deepEqual(checkIntoLine('main', [cs('a', 'minor')], lines), []));

test('carry that computes 0.18.1 passes', () => {
  assert.deepEqual(checkCarry('merge-0.18-into-main-4', [cs('a', 'patch'), cs('b', '')], '0.18.0', lines), []);
  assert.deepEqual(checkCarry('0.18', [cs('a', 'patch')], '0.18.3', lines), []);
});
test('carry that computes 0.19.0 fails', () => {
  const p = checkCarry('merge-0.18-into-main-4', [cs('a', 'patch'), cs('bad', 'minor')], '0.18.0', lines);
  assert.equal(p.length, 1);
  assert.match(p[0], /0\.19\.0/);
  assert.match(p[0], /bad\.md/);
});
test('carry with only empty changesets computes no release and passes', () =>
  assert.deepEqual(checkCarry('merge-0.18-into-main-4', [cs('a', '')], '0.18.0', lines), []));
test('a head that is no carry passes', () => assert.deepEqual(checkCarry('some-fix', [cs('a', 'minor')], '0.18.0', lines), []));

test('bump and carryLine', () => {
  assert.equal(bump('0.18.0', 'patch'), '0.18.1');
  assert.equal(bump('0.18.4', 'minor'), '0.19.0');
  assert.equal(bump('0.18.4', 'major'), '1.0.0');
  assert.equal(carryLine('merge-0.18-into-main-12', lines), '0.18');
  assert.equal(carryLine('merge-0.19-into-main-1', lines), '');
});

test('the repository file lists 0.18 as patch only', () => assert.deepEqual(readLines()['0.18'], { allow: 'patch', series: '0.18' }));
