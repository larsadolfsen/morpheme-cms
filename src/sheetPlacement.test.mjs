// Tests for sheetPlacement.mjs: the look (side-sheet, modal-side-sheet, or sheet) and the panel flag of each step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetLook, inPanel } from './sheetPlacement.mjs';

test("'fields' below medium is a modal side sheet and not in the panel", () => {
  assert.equal(sheetLook('fields', false), 'modal-side-sheet');
  assert.equal(inPanel('fields', false), false);
});

test("'fields' at medium is a side sheet and in the panel", () => {
  assert.equal(sheetLook('fields', true), 'side-sheet');
  assert.equal(inPanel('fields', true), true);
});

test("'section' below medium is a sheet and not in the panel", () => {
  assert.equal(sheetLook('section', false), 'sheet');
  assert.equal(inPanel('section', false), false);
});

test("'section' at medium is a side sheet and in the panel", () => {
  assert.equal(sheetLook('section', true), 'side-sheet');
  assert.equal(inPanel('section', true), true);
});

test("'choose' below medium is a sheet and not in the panel", () => {
  assert.equal(sheetLook('choose', false), 'sheet');
  assert.equal(inPanel('choose', false), false);
});

test("'choose' at medium is a sheet and not in the panel", () => {
  assert.equal(sheetLook('choose', true), 'sheet');
  assert.equal(inPanel('choose', true), false);
});

test('a closed sheet below medium is a sheet and not in the panel', () => {
  assert.equal(sheetLook(undefined, false), 'sheet');
  assert.equal(inPanel(undefined, false), false);
});

test('a closed sheet at medium is a sheet and not in the panel', () => {
  assert.equal(sheetLook(undefined, true), 'sheet');
  assert.equal(inPanel(undefined, true), false);
});
