// Tests for sheetPlacement.mjs: the look (side-sheet, subpage or sheet) and the panel flag of each step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetLook, inPanel, editsInPanel, liveSheet } from './sheetPlacement.mjs';

test("'fields' and 'section' are a side sheet in the panel from medium and a subpage below it", () => {
  for (const step of ['fields', 'section']) {
    assert.equal(sheetLook(step, true), 'side-sheet');
    assert.equal(inPanel(step, true), true);
    assert.equal(sheetLook(step, false), 'subpage');
    assert.equal(inPanel(step, false), false);
  }
});

test("'row' is a side sheet from medium and the sheet from the bottom below it", () => {
  assert.equal(sheetLook('row', true), 'side-sheet');
  assert.equal(inPanel('row', true), true);
  assert.equal(sheetLook('row', false), 'sheet');
  assert.equal(inPanel('row', false), false);
});

test("'choose' and no step are always the sheet from the bottom", () => {
  for (const step of ['choose', undefined]) {
    for (const pane of [true, false]) {
      assert.equal(sheetLook(step, pane), 'sheet');
      assert.equal(inPanel(step, pane), false);
    }
  }
});

test('editsInPanel: a card with fields needs no pen when the fields are in the panel', () => {
  assert.equal(editsInPanel(true, true), true);
  assert.equal(editsInPanel(false, true), false);
  assert.equal(editsInPanel(true, false), false);
  assert.equal(editsInPanel(false, false), false);
});

test('the side sheet beside the page is live, every other look keeps Save and Cancel', () => {
  for (const step of ['fields', 'section', 'row']) {
    assert.equal(liveSheet(step, true), true);
    assert.equal(liveSheet(step, false), false);
  }
  assert.equal(liveSheet('choose', true), false);
  assert.equal(liveSheet(undefined, true), false);
});
