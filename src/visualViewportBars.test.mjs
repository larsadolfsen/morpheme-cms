import test from 'node:test';
import assert from 'node:assert/strict';
import { visualBox } from './visualViewportBars.ts';

test('not zoomed: nothing is set', () => {
  assert.equal(visualBox({ offsetLeft: 0, offsetTop: 0, width: 412, height: 839, scale: 1 }, 839), null);
});

test('zoomed: where the visual viewport stands in the layout viewport', () => {
  const box = visualBox({ offsetLeft: 10, offsetTop: 132, width: 164.8, height: 335.6, scale: 2.5 }, 839);
  assert.equal(box['--mo-comp-editor-visual-left'], '10px');
  assert.equal(box['--mo-comp-editor-visual-top'], '132px');
  assert.equal(box['--mo-comp-editor-visual-bottom'], '371.4px');
  assert.equal(box['--mo-comp-editor-visual-scale'], '0.4');
});
