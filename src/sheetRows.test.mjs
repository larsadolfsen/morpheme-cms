// The rows of a sheet are the theme's list items (ListItem, or Option, which is one): no hand-made row class for a
// choice in a sheet (optionClass, the theme's menu item class on a button).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const files = readdirSync(dir).filter((f) => /\.(tsx?|mjs)$/.test(f) && !f.endsWith('.test.mjs'));

test('no sheet draws its rows with optionClass or the menu item class', () => {
  for (const f of files) {
    const text = readFileSync(new URL(f, dir), 'utf8');
    assert.doesNotMatch(text, /\boptionClass\b/, `${f} uses optionClass: draw the row with ListItem or Option`);
    assert.doesNotMatch(text, /\bsiteMenuItemClass\b/, `${f} uses the menu item class for a row: draw it with ListItem or Option`);
  }
});

test('Option is a ListItem', () => {
  const ui = readFileSync(new URL('ui.tsx', dir), 'utf8');
  const option = ui.slice(ui.indexOf('export function Option('), ui.indexOf('// The menu'));
  assert.match(option, /<ListItem\b/);
  assert.doesNotMatch(option, /<button\b/);
});
