import assert from 'node:assert/strict';
import { test } from 'node:test';
import { backdropBox } from './sectionBackdrop.mjs';
import { readFileSync } from 'node:fs';

const host = { top: 100, left: 16, width: 358 };

test('the image covers the section from its first part to its last, as wide as the text', () => {
  const box = backdropBox({ top: 120, bottom: 160 }, { top: 200, bottom: 260 }, host);
  assert.deepEqual(box, { top: 20, left: 0, width: 358, height: 140 });
});

test("a section of the whole width reaches the text field's edges", () => {
  const box = backdropBox({ top: 100, bottom: 140 }, { top: 140, bottom: 200 }, host, { full: true, bleed: 16 });
  assert.deepEqual(box, { top: 0, left: -16, width: 390, height: 100 });
});

test('the editor draws the image behind the text, not as a strip above the heading', () => {
  const css = readFileSync(new URL('./editor.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /editor-section-picture\s*\{[^}]*height:\s*9rem/);
  assert.match(css, /editor-section-picture\s*\{[^}]*position:\s*absolute/);
});
