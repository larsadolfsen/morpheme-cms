import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, lineOf, tagFor } from './publish-next.mjs';
import { readFileSync } from 'node:fs';

test('lineOf: only 0.<minor> is a line', () => {
  assert.equal(lineOf('0.18'), '0.18');
  assert.equal(lineOf('0.19'), '0.19');
  for (const b of ['main', '0.18.1', '0.x', 'feature/a', '10.18', '', 'release/0.18']) assert.equal(lineOf(b), null, b);
});

test('tagFor: main keeps next; each line has its own tag; nothing else stages', () => {
  assert.equal(tagFor('main'), 'next');
  assert.equal(tagFor('0.17'), 'next-0.17');
  assert.equal(tagFor('0.18'), 'next-0.18');
  assert.equal(tagFor('0.19'), 'next-0.19');
  assert.equal(tagFor('feature/x'), null);
  assert.notEqual(tagFor('0.18'), 'latest');
});

test('decide: a line stages its own version under its own tag', () => {
  assert.deepEqual(decide({ branch: '0.18', version: '0.18.0-next-20261118120000', base: '0.17.0' }).action, 'stage');
  assert.equal(decide({ branch: '0.18', version: '0.18.0-next-20261118120000', base: '0.17.0' }).tag, 'next-0.18');
  assert.equal(decide({ branch: '0.19', version: '0.19.0-next-20261118120000', base: '0.17.0' }).tag, 'next-0.19');
});

test('decide: a version of another line, or a plain version, is an error, never staged', () => {
  assert.equal(decide({ branch: '0.18', version: '0.17.1-next-20261118120000', base: '0.17.0' }).action, 'error');
  assert.equal(decide({ branch: '0.18', version: '0.19.0-next-20261118120000', base: '0.17.0' }).action, 'error');
  assert.equal(decide({ branch: '0.18', version: '0.18.0', base: '0.17.0' }).action, 'error');
  assert.equal(decide({ branch: '0.18', version: '0.180.0-next-20261118120000', base: '0.17.0' }).action, 'error');
});

test('decide: an unchanged version (empty changesets) and other branches are skipped', () => {
  assert.equal(decide({ branch: '0.18', version: '0.17.0', base: '0.17.0' }).action, 'skip');
  assert.equal(decide({ branch: '0.18', version: '', base: '0.17.0' }).action, 'skip');
  assert.equal(decide({ branch: 'feature/x', version: '0.18.0-next-20261118120000', base: '0.17.0' }).action, 'skip');
});

test('decide: main stages under next', () => {
  assert.equal(decide({ branch: 'main', version: '0.17.1-next-20261118120000', base: '0.17.0' }).tag, 'next');
  assert.equal(decide({ branch: 'main', version: '0.17.1', base: '0.17.0' }).action, 'error');
});

test('publish.yml: lines only stage next-<line> through publish-next.mjs, never latest, and never run the Release PR job', () => {
  const y = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
  const next = y.slice(y.indexOf('  next-line:'));
  assert.ok(next.includes('npm stage publish --tag "${{ steps.plan.outputs.tag }}"'));
  assert.ok(!/--tag latest/.test(next));
  assert.ok(!/gh release|git tag|changesets\/action/.test(next));
  assert.match(y, /release:\n(?:.*\n)*?\s+if: github\.ref == 'refs\/heads\/main'/);
});
