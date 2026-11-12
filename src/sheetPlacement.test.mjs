// Tests for sheetPlacement.mjs: the look (side-sheet, modal-side-sheet, or sheet) and the panel flag of each step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetLook, inPanel, editsInPanel } from './sheetPlacement.mjs';

test("'fields' below expanded is a modal side sheet and not in the panel", () => {
  assert.equal(sheetLook('fields', false), 'modal-side-sheet');
  assert.equal(inPanel('fields', false), false);
});

test("'fields' at expanded is a side sheet and in the panel", () => {
  assert.equal(sheetLook('fields', true), 'side-sheet');
  assert.equal(inPanel('fields', true), true);
});

test("'section' below expanded is a sheet and not in the panel", () => {
  assert.equal(sheetLook('section', false), 'sheet');
  assert.equal(inPanel('section', false), false);
});

test("'section' at expanded is a side sheet and in the panel", () => {
  assert.equal(sheetLook('section', true), 'side-sheet');
  assert.equal(inPanel('section', true), true);
});

test("'choose' below expanded is a sheet and not in the panel", () => {
  assert.equal(sheetLook('choose', false), 'sheet');
  assert.equal(inPanel('choose', false), false);
});

test("'choose' at expanded is a sheet and not in the panel", () => {
  assert.equal(sheetLook('choose', true), 'sheet');
  assert.equal(inPanel('choose', true), false);
});

test('a closed sheet below expanded is a sheet and not in the panel', () => {
  assert.equal(sheetLook(undefined, false), 'sheet');
  assert.equal(inPanel(undefined, false), false);
});

test('a closed sheet at expanded is a sheet and not in the panel', () => {
  assert.equal(sheetLook(undefined, true), 'sheet');
  assert.equal(inPanel(undefined, true), false);
});

test('a card edits in the panel only at expanded and with fields', () => {
  assert.equal(editsInPanel(true, true), true);
  assert.equal(editsInPanel(false, true), false);
  assert.equal(editsInPanel(true, false), false);
  assert.equal(editsInPanel(false, false), false);
});

test("'row' below expanded is a bottom sheet and not in the panel", () => {
  assert.equal(sheetLook('row', false), 'sheet');
  assert.equal(inPanel('row', false), false);
});

test("'row' at expanded is a side sheet and in the panel", () => {
  assert.equal(sheetLook('row', true), 'side-sheet');
  assert.equal(inPanel('row', true), true);
});
