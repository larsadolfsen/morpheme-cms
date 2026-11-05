// Tests for lib/section-marker.mjs: the marker line before an H2 that gives its section a colour.
// Run: node --test packages/editor/lib/section-marker.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTION_COLORS, isLabelLine, markerColor, sectionMarker } from './section-marker.mjs';

test('the colours are the theme’s three', () => assert.deepEqual(SECTION_COLORS, ['surface', 'tint', 'accent']));
test('writes the marker', () => assert.equal(sectionMarker('tint'), '<div data-section="tint"></div>'));
test('reads it back', () => {
  for (const c of SECTION_COLORS) assert.equal(markerColor(sectionMarker(c)), c);
});
test('reads it with space around', () => assert.equal(markerColor('  <div data-section="accent"></div>\n'), 'accent'));
test('an unknown colour is no marker', () => assert.equal(markerColor('<div data-section="red"></div>'), null));
test('other HTML is no marker', () => {
  assert.equal(markerColor('<div data-section="tint">x</div>'), null);
  assert.equal(markerColor('<div data-block="hero"></div>'), null);
  assert.equal(markerColor(''), null);
});
test('a label line', () => {
  assert.equal(isLabelLine('<p class="block-eyebrow">Step by step</p>'), true);
  assert.equal(isLabelLine('<p class="intro">Hi</p>'), false);
});
