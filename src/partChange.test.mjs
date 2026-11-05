// Tests for src/partChange.ts: the text of a part's save, with or without the value its `changedTo` gives.
// Run: node --test src/partChange.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { partChange } from './partChange.ts';

const texts = { edited: (what) => `${what} changed`, setTo: (what, value) => `${what} set to ${value}` };
const props = { api: async () => new Response('') };
const run = (changedTo) => partChange('cms-version', {}, changedTo, props, texts);

test('no hook says changed', async () => {
  assert.equal(await run(undefined), 'cms-version changed');
});

test('a value says set to it', async () => {
  assert.equal(await run(async () => '0.10.0'), 'cms-version set to 0.10.0');
});

test('an undefined value says changed', async () => {
  assert.equal(await run(async () => undefined), 'cms-version changed');
});

test('an empty value says changed', async () => {
  assert.equal(await run(async () => ''), 'cms-version changed');
});

test('a throw says changed', async () => {
  assert.equal(
    await run(async () => {
      throw new Error('x');
    }),
    'cms-version changed',
  );
});

test('the hook gets the values and the api', async () => {
  const calls = [];
  const values = { a: 1 };
  await partChange('x', values, async (...args) => void calls.push(args), props, texts);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], values);
  assert.equal(calls[0][1], props);
  assert.equal(typeof calls[0][1].api, 'function');
});
