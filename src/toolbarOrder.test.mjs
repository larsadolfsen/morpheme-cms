import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrangeTools, nextArrangement } from './toolbarOrder.mjs';

const tool = (name, role) => ({ name, role });
const tools = [
  tool('bold'),
  tool('italic', 'italic'),
  tool('link', 'link'),
  tool('h2'),
  tool('style'),
  tool('insert'),
  tool('undo', 'undo'),
  tool('redo', 'redo'),
  tool('settings', 'settings'),
];
const names = (list) => list.map((t) => t.name);
// The tools as MarkdownEditor.tsx lists them: Section settings first among them, which the arrangement moves.
const natural = [tools[8], ...tools.slice(0, 8)];

test('when all fit, every tool is in its own order and Section settings is last', () => {
  assert.deepEqual(names(arrangeTools(natural, 'all')), ['bold', 'italic', 'link', 'h2', 'style', 'insert', 'undo', 'redo', 'settings']);
});

test('when Undo and Redo wrap, Section settings stays before them', () => {
  assert.deepEqual(names(arrangeTools(natural, 'mid')), ['bold', 'italic', 'link', 'h2', 'style', 'insert', 'settings', 'undo', 'redo']);
});

test('when the link has no room either, it wraps after Section settings and before Undo and Redo; Insert stays', () => {
  const order = names(arrangeTools(natural, 'priority'));
  assert.deepEqual(order, ['bold', 'italic', 'h2', 'style', 'insert', 'settings', 'link', 'undo', 'redo']);
  assert.ok(order.indexOf('insert') < order.indexOf('link') && order.indexOf('insert') < order.indexOf('undo'));
});

test('as a last resort Italic wraps too, before the link, and Section settings stays', () => {
  const order = names(arrangeTools(natural, 'lean'));
  assert.deepEqual(order, ['bold', 'h2', 'style', 'insert', 'settings', 'italic', 'link', 'undo', 'redo']);
});

test('without Section settings the same order holds', () => {
  const without = tools.slice(0, 8);
  assert.deepEqual(names(arrangeTools(without, 'mid')), ['bold', 'italic', 'link', 'h2', 'style', 'insert', 'undo', 'redo']);
  assert.deepEqual(names(arrangeTools(without, 'priority')), ['bold', 'italic', 'h2', 'style', 'insert', 'link', 'undo', 'redo']);
});

test('the arrangement is tried in order and stays once it works', () => {
  assert.equal(nextArrangement('all', { any: false, kept: false }), 'all');
  assert.equal(nextArrangement('all', { any: true, kept: false }), 'mid');
  assert.equal(nextArrangement('mid', { any: true, kept: false }), 'mid');
  assert.equal(nextArrangement('mid', { any: true, kept: true }), 'priority');
  assert.equal(nextArrangement('priority', { any: true, kept: false }), 'priority');
  assert.equal(nextArrangement('priority', { any: true, kept: true }), 'lean');
  assert.equal(nextArrangement('lean', { any: true, kept: true }), 'lean');
});
