// Tests lib/menu-layout.mjs (the main menu's layout per breakpoint). Run with `node --test packages/editor/lib/*.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BREAKPOINTS } from './breakpoints.mjs';
import { menuLayout } from './menu-layout.mjs';

test('compact: no rail, modal drawer, menu button in the top bar', () => {
  assert.deepEqual(menuLayout('compact'), { rail: false, expanded: 'modal', menuButtonInTopBar: true });
});

test('medium: rail that expands as a modal drawer, no menu button in the top bar', () => {
  assert.deepEqual(menuLayout('medium'), { rail: true, expanded: 'modal', menuButtonInTopBar: false });
});

test('expanded and wider: rail that expands beside the content', () => {
  for (const width of ['expanded', 'large', 'extraLarge']) {
    assert.deepEqual(menuLayout(width), { rail: true, expanded: 'standard', menuButtonInTopBar: false }, width);
  }
});

test('every breakpoint has a layout', () => {
  for (const width of Object.keys(BREAKPOINTS)) assert.ok(menuLayout(width), width);
});
