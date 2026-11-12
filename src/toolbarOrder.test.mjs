import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toolsInOrder } from './toolbarOrder.mjs';

const tools = ['section', 'bold', 'italic', 'h2', 'text', 'insert', 'undo'];
const first = (tool) => ['section', 'h2', 'text'].includes(tool);

test('in a section, Section settings and the kinds of text come first', () => {
  assert.deepEqual(toolsInOrder(tools, first, true), ['section', 'h2', 'text', 'bold', 'italic', 'insert', 'undo']);
});

test('outside a section the tools stay as they are', () => {
  assert.deepEqual(toolsInOrder(tools, first, false), tools);
});
