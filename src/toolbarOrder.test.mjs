import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARRANGEMENTS, arrangeTools, nextArrangement } from './toolbarOrder.mjs';

const tool = (name, role) => ({ name, role });
const tools = [
  tool('bold'),
  tool('italic', 'italic'),
  tool('link', 'link'),
  tool('h2'),
  tool('style'),
  tool('bullet', 'list'),
  tool('check', 'list'),
  tool('ordered', 'list'),
  tool('insert'),
  tool('undo', 'undo'),
  tool('redo', 'redo'),
  tool('settings', 'settings'),
];
const names = (list) => list.map((t) => t.name);
// The tools as MarkdownEditor.tsx lists them: Section settings first among them, which the arrangement moves.
const natural = [tools.at(-1), ...tools.slice(0, -1)];

test('when all fit, every tool is in its own order and Section settings is last', () => {
  assert.deepEqual(names(arrangeTools(natural, 'all')), [
    'bold',
    'italic',
    'link',
    'h2',
    'style',
    'bullet',
    'check',
    'ordered',
    'insert',
    'undo',
    'redo',
    'settings',
  ]);
});

test('when Undo and Redo wrap, Section settings stays before them', () => {
  assert.deepEqual(names(arrangeTools(natural, 'mid')), [
    'bold',
    'italic',
    'link',
    'h2',
    'style',
    'bullet',
    'check',
    'ordered',
    'insert',
    'settings',
    'undo',
    'redo',
  ]);
});

test('when the link has no room either, it wraps after Section settings and before Undo and Redo; Insert stays', () => {
  const order = names(arrangeTools(natural, 'priority'));
  assert.deepEqual(order, ['bold', 'italic', 'h2', 'style', 'bullet', 'check', 'ordered', 'insert', 'settings', 'link', 'undo', 'redo']);
  assert.ok(order.indexOf('insert') < order.indexOf('link') && order.indexOf('insert') < order.indexOf('undo'));
});

test('only when nothing else fits Italic and the lists wrap too and before the link; Insert and Section settings stay', () => {
  const order = names(arrangeTools(natural, 'bare'));
  assert.deepEqual(order, ['bold', 'h2', 'style', 'insert', 'settings', 'italic', 'bullet', 'check', 'ordered', 'link', 'undo', 'redo']);
});

test('the lists are one group in every arrangement', () => {
  for (const mode of ARRANGEMENTS) {
    const order = names(arrangeTools(natural, mode));
    const at = ['bullet', 'check', 'ordered'].map((name) => order.indexOf(name));
    assert.deepEqual(at, [at[0], at[0] + 1, at[0] + 2], mode);
  }
});

test('without Section settings the same order holds', () => {
  const without = tools.slice(0, -1);
  assert.deepEqual(names(arrangeTools(without, 'mid')), [
    'bold',
    'italic',
    'link',
    'h2',
    'style',
    'bullet',
    'check',
    'ordered',
    'insert',
    'undo',
    'redo',
  ]);
  assert.deepEqual(names(arrangeTools(without, 'priority')), [
    'bold',
    'italic',
    'h2',
    'style',
    'bullet',
    'check',
    'ordered',
    'insert',
    'link',
    'undo',
    'redo',
  ]);
});

test('the arrangement is tried in order and stays once it works', () => {
  assert.equal(nextArrangement('all', { any: false, kept: false }), 'all');
  assert.equal(nextArrangement('all', { any: true, kept: false }), 'mid');
  assert.equal(nextArrangement('mid', { any: true, kept: false }), 'mid');
  assert.equal(nextArrangement('mid', { any: true, kept: true }), 'priority');
  assert.equal(nextArrangement('priority', { any: true, kept: false }), 'priority');
  assert.equal(nextArrangement('priority', { any: true, kept: true }), 'bare');
  assert.equal(nextArrangement('bare', { any: true, kept: true }), 'bare');
});
