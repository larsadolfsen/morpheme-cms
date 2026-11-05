// Tests for THEME_PARTS and NOT_PARTS in site/themeParts.mjs.
// Verifies unique ids, piece coverage, ui.css class coverage, material self-coverage, and spot checks.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { THEME_PARTS, NOT_PARTS } from './themeParts.mjs';
import { partOf, partPieces, themeCoverage } from './themeCoverage.mjs';

const stylesDir = new URL('../theme/styles/', import.meta.url);
const baseCss = readFileSync(new URL('base.css', stylesDir), 'utf-8');
const uiCss = readFileSync(new URL('ui.css', stylesDir), 'utf-8');
const componentsCss = readFileSync(new URL('components.css', stylesDir), 'utf-8');
const globalCss = readFileSync(new URL('global.css', stylesDir), 'utf-8');
const materialCss = [baseCss, uiCss, componentsCss, globalCss].join('\n');

function getUiCssClasses() {
  const classes = new Set();
  const root = postcss.parse(uiCss);
  root.walkRules((rule) => {
    selectorParser((selector) => {
      selector.walkClasses((cls) => {
        classes.add(cls.value);
      });
    }).processSync(rule.selector);
  });
  return [...classes];
}

test('unique ids', () => {
  const ids = THEME_PARTS.map((p) => p.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, 'IDs in THEME_PARTS must be unique');
});

test('every part has pieces', () => {
  const pieces = partPieces(materialCss, THEME_PARTS);
  for (const part of THEME_PARTS) {
    const partPieces = pieces[part.id];
    assert.ok(partPieces && partPieces.length > 0, `Part "${part.id}" should have at least one piece in Material CSS`);
  }
});

test('ui.css fully covered', () => {
  const uiClasses = getUiCssClasses();
  const uncovered = uiClasses.filter((cls) => {
    const part = partOf(cls, THEME_PARTS);
    return part === null && !NOT_PARTS.includes(cls);
  });
  assert.deepEqual(uncovered, [], `The following classes in ui.css are not covered by any part or NOT_PARTS: ${uncovered.join(', ')}`);
});

test('Material as a theme', () => {
  const coverage = themeCoverage({ materialCss, themeCss: materialCss, parts: THEME_PARTS });
  for (const part of THEME_PARTS) {
    const entry = coverage[part.id];
    assert.ok(entry, `Coverage entry for "${part.id}" should exist`);
    assert.equal(entry.status, 'material', `Part "${part.id}" should have status 'material' when themeCss is materialCss`);
  }
});

test('spot checks', () => {
  assert.equal(partOf('chip-set-wrap', THEME_PARTS), 'ChipSet', "partOf('chip-set-wrap') should be 'ChipSet'");
  assert.equal(partOf('fab-menu-item', THEME_PARTS), 'FabMenu', "partOf('fab-menu-item') should be 'FabMenu'");
  assert.equal(partOf('top-app-bar-search', THEME_PARTS), 'TopAppBar', "partOf('top-app-bar-search') should be 'TopAppBar'");
  assert.equal(partOf('md-footer-list', THEME_PARTS), 'Footer', "partOf('md-footer-list') should be 'Footer'");
  assert.equal(partOf('icon-button-wide', THEME_PARTS), 'IconButton', "partOf('icon-button-wide') should be 'IconButton'");
});
