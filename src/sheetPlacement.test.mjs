// Tests for sheetPlacement.mjs: the look (side-sheet, modal-side-sheet, or sheet) and the panel flag of each step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetLook, inPanel, editsInPanel, liveSheet } from './sheetPlacement.mjs';

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

test('the side sheet beside the page is live, every other look keeps Save and Cancel', () => {
  for (const step of ['fields', 'section', 'row']) {
    assert.equal(liveSheet(step, true), true);
    assert.equal(liveSheet(step, false), false);
  }
  assert.equal(liveSheet('choose', true), false);
  assert.equal(liveSheet(undefined, true), false);
});

test("'fields' on a compact window is a subpage and not in the panel", () => {
  assert.equal(sheetLook('fields', false, true), 'subpage');
  assert.equal(sheetLook('fields', false, false), 'modal-side-sheet');
  assert.equal(sheetLook('fields', true, true), 'side-sheet');
  assert.equal(inPanel('fields', false), false);
});

test('the fields and the section settings become a subpage on a compact window', () => {
  assert.equal(sheetLook('section', false, true), 'subpage');
  assert.equal(sheetLook('row', false, true), 'sheet');
  assert.equal(sheetLook('choose', false, true), 'sheet');
});
