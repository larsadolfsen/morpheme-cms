// Tests for drawerYield.mjs: the standard drawer yields to the side panel below large, unless the menu button reopened it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { drawerShown } from './drawerYield.mjs';

test('the drawer shows as remembered while no panel is open', () => {
  assert.equal(drawerShown(true, false, false, false), true);
  assert.equal(drawerShown(false, false, true, false), false);
});

test('the drawer yields while the panel is open below large', () => {
  assert.equal(drawerShown(true, true, false, false), false);
  assert.equal(drawerShown(false, true, false, false), false);
});

test('the drawer shows again when the menu button reopened it', () => {
  assert.equal(drawerShown(true, true, false, true), true);
});

test('the drawer never yields from large', () => {
  assert.equal(drawerShown(true, true, true, false), true);
});
