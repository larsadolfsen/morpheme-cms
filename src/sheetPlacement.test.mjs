// Tests for sheetPlacement.mjs: the look (panel, full-screen, or sheet) of each step of the block sheet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetLook, inPanel } from './sheetPlacement.mjs';

test('the fields step is full-screen below large', () => {
  assert.equal(sheetLook('fields', false), 'full-screen');
});

test('the fields step is in the panel on a large screen', () => {
  assert.equal(sheetLook('fields', true), 'panel');
});

test('the section settings are a sheet below large', () => {
  assert.equal(sheetLook('section', false), 'sheet');
});

test('the section settings are in the panel on a large screen', () => {
  assert.equal(sheetLook('section', true), 'panel');
});

test('the choice of block is always a sheet', () => {
  assert.equal(sheetLook('choose', false), 'sheet');
  assert.equal(sheetLook('choose', true), 'sheet');
});

test('a closed sheet is always a sheet', () => {
  assert.equal(sheetLook(undefined, false), 'sheet');
  assert.equal(sheetLook(undefined, true), 'sheet');
});

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
