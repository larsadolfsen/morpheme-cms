// The site menu's measures are M3's own (docs/m3-tokens/md.comp.menus*.json, the tokens-only copy of m3.material.io's data): the header's sub-menu is the theme's Menu
// (theme/ui/Menu.tsx, tokens in theme/styles/tokens/material/comp/menu.css), so the two agree. Reads the token file and M3's data as text; no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const tokens = read('./tokens/material/comp/menu.css');
const m3 = (set) => JSON.parse(read(`../../docs/m3-tokens/md.comp.${set}.json`)).tokens;
const m3Value = (set, name) => m3(set).find((t) => t.token === `md.comp.${set}.${name}`).resolved.light;
const declared = (name) => tokens.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
const px = (rem) => parseFloat(rem) * 16;

test('a menu item is 44 dp high, as M3 Expressive prints (menus.menu-item.height)', () => {
  assert.equal(m3Value('menus', 'menu-item.height').value, 44);
  assert.equal(px(declared('--mo-comp-menu-list-item-container-height')), 44);
});

test('an item has 16 dp at each side, and its container the large corners', () => {
  assert.equal(m3Value('menus', 'menu-item.leading-space').value, 16);
  assert.equal(declared('--mo-comp-menu-item-padding'), '0 1rem');
  assert.equal(declared('--mo-comp-menu-container-shape'), 'var(--mo-sys-shape-corner-large)');
});

test('the standard menu is on surface-container-low and the chosen item on the tertiary container', () => {
  assert.equal(declared('--mo-comp-menu-container-color'), 'var(--mo-sys-color-surface-container-low)');
  assert.equal(declared('--mo-comp-menu-list-item-selected-container-color'), 'var(--mo-sys-color-tertiary-container)');
  assert.equal(declared('--mo-comp-menu-list-item-selected-label-text-color'), 'var(--mo-sys-color-on-tertiary-container)');
});

test('the header sub-menu draws the Menu component, not rules of its own', () => {
  const header = read('../components/Header.astro');
  assert.match(header, /class=\{menuClass\}/);
  assert.match(header, /class=\{menuItemClass\}/);
  assert.doesNotMatch(read('./site-header.css'), /\.mo-header__submenu[^{]*\{[^}]*(background|border-radius|box-shadow|min-height)/);
});
