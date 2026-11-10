// Tests for lib/colors.ts. Run: node --test lib/colors.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { pageColor } from './colors.ts';

test('the page colour of the editor is Surface', () => {
  assert.equal(pageColor({ surface: '#f9f9ff', 'surface-container': '#ededf4' }), '#f9f9ff');
});
