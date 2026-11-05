// Tests for sheetPlacement.mjs: which steps of the block sheet are shown in the side panel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { inPanel } from './sheetPlacement.mjs';

test('the fields and the section settings are in the panel on a large screen', () => {
  assert.equal(inPanel('fields', true), true);
  assert.equal(inPanel('section', true), true);
});

test('the choice of block is always a dialog', () => {
  assert.equal(inPanel('choose', true), false);
  assert.equal(inPanel('choose', false), false);
});

test('below large everything is a dialog', () => {
  assert.equal(inPanel('fields', false), false);
  assert.equal(inPanel('section', false), false);
});

test('a closed sheet is not in the panel', () => {
  assert.equal(inPanel(undefined, true), false);
});
