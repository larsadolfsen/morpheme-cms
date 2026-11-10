// Tests for lib/sandboxHooks.mjs: page-colors hooks of contract 4 apps, run in the sandbox, on the fixture apps in
// lib/sandbox/fixtures/hooks-site/. Exposes nothing. Depends on node:test, appProblems.mjs and lib/hooks.ts.
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createProblems } from './appProblems.mjs';
import { pageColorsHooks } from './sandboxHooks.mjs';
import { pageColorsOutputProblems } from './hooks.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sandbox/fixtures/hooks-site');
const names = ['bg', 'accent'];
const input = { path: '/x/', colors: { light: {}, dark: {} }, pictures: ['/a.png'], settings: {}, roles: {} };
const helpers = { pixels: async () => new Uint8ClampedArray([1, 2, 3, 4]), readable: () => true };
// Mirrors site/pageColors.ts: the output check, then "readable" (here: accent differs from bg).
const check = (value) => {
  const wrong = pageColorsOutputProblems(value, names);
  if (wrong.length || value === undefined) return wrong;
  return [value.light, value.dark].some((set) => set.bg === set.accent) ? ['The colors are hard to read.'] : [];
};
const setup = (active) => {
  const problems = createProblems();
  return { problems, hooks: pageColorsHooks({ root, active, problems, check }) };
};

test('an app that gives fixed colours: they come back, with its settings in the input', async () => {
  const { problems, hooks } = setup(['fixed']);
  assert.deepEqual(hooks.apps, [{ id: 'fixed', settings: { tint: '#a3345a' } }]);
  const value = await hooks.run('fixed', '/x/', { ...input, settings: hooks.apps[0].settings }, helpers);
  assert.deepEqual(value, {
    light: { bg: '#ffffff', accent: '#a3345a' },
    dark: { bg: '#000000', accent: '#a3345a' },
  });
  assert.deepEqual(problems.list(), []);
});

test('an app that throws: no colours and one problem with the page', async () => {
  const { problems, hooks } = setup(['throws']);
  assert.equal(await hooks.run('throws', '/x/', input, helpers), undefined);
  const list = problems.list();
  assert.equal(list.length, 1);
  assert.deepEqual(
    { ...list[0], message: undefined },
    { app: 'throws', place: 'hook', hook: 'page-colors', page: '/x/', error: 'throw', message: undefined },
  );
  assert.match(list[0].message, /the hook broke/);
});

test('an app that gives invalid colours: no colours and one problem', async () => {
  const { problems, hooks } = setup(['invalid']);
  assert.equal(await hooks.run('invalid', '/y/', input, helpers), undefined);
  assert.equal(problems.list().length, 1);
  assert.equal(problems.list()[0].error, 'invalid');
  assert.equal(problems.list()[0].page, '/y/');
});

test('an app that gives colours that are hard to read: no colours and one problem', async () => {
  const { problems, hooks } = setup(['unreadable']);
  assert.equal(await hooks.run('unreadable', '/x/', input, helpers), undefined);
  assert.match(problems.list()[0].message, /hard to read/);
});

test('an app that cannot be bundled: one problem for all pages, place bundle', async () => {
  const { problems, hooks } = setup(['bad-bundle']);
  for (const page of ['/a/', '/b/', '/c/']) assert.equal(await hooks.run('bad-bundle', page, input, helpers), undefined);
  const list = problems.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].place, 'bundle');
  assert.equal(list[0].page, undefined);
});

test('an app.json with problems: one problem with place manifest, and the app does not run', () => {
  const { problems, hooks } = setup(['bad-manifest']);
  assert.deepEqual(hooks.apps, []);
  assert.equal(problems.list().length, 1);
  assert.equal(problems.list()[0].place, 'manifest');
  assert.equal(problems.list()[0].app, 'bad-manifest');
});

test('apps without the hook, without app.json or not active are not listed', () => {
  const { problems, hooks } = setup(['no-hook', 'old-app', 'fixed']);
  assert.deepEqual(
    hooks.apps.map((a) => a.id),
    ['fixed'],
  );
  assert.deepEqual(problems.list(), []);
  assert.deepEqual(setup([]).hooks.apps, []);
});

test('apps come in the order of their ids', () => {
  assert.deepEqual(
    setup(['throws', 'fixed', 'invalid']).hooks.apps.map((a) => a.id),
    ['fixed', 'invalid', 'throws'],
  );
});

test('both helpers cross into the sandbox', async () => {
  const { problems, hooks } = setup(['helpers']);
  const value = await hooks.run('helpers', '/x/', input, helpers);
  assert.equal(value?.light.bg, '#010101');
  assert.deepEqual(problems.list(), []);
});
