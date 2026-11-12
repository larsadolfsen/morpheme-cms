// Checks the tonal elevation tokens and rules of the base theme (spec: tonal elevation, Material 3).
// Reads theme/styles/ui.css (and later global.css) as text; no browser, no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const uiCss = read('./ui.css');

const count = (text, part) => text.split(part).length - 1;

// The level tokens: the exact default declaration of each, once in ui.css.
const tokens = {
  '--mo-elevation-0-color': 'var(--mo-surface)',
  '--mo-elevation-1-color': 'var(--mo-surface-container-low, var(--block-surface))',
  '--mo-elevation-2-color': 'var(--mo-surface-container, var(--block-surface))',
  '--mo-elevation-3-color': 'var(--mo-surface-container-high, var(--block-surface))',
  '--mo-elevation-4-color': 'var(--mo-surface-container-highest, var(--block-surface))',
  '--mo-elevation-5-color': 'var(--mo-surface-container-highest, var(--block-surface))',
  '--mo-elevation-1-rest-shadow': 'var(--mo-elevation-1-shadow)',
  '--mo-elevation-2-rest-shadow': 'var(--mo-elevation-2-shadow)',
  '--mo-elevation-3-rest-shadow': 'var(--mo-elevation-3-shadow)',
  '--mo-elevation-4-rest-shadow': 'var(--mo-elevation-4-shadow)',
  '--mo-elevation-5-rest-shadow': 'var(--mo-elevation-5-shadow)',
};

for (const [name, value] of Object.entries(tokens)) {
  test(`ui.css declares ${name}`, () => {
    assert.equal(count(uiCss, `  ${name}: ${value};\n`), 1);
  });
}

// Neutral parts: the resting surface reads the part's own variable, then its level's colour.
const surfaces = [
  ['elevated button', 'background: var(--button-elevated-surface, var(--mo-elevation-1-color));', 1],
  ['elevated chip', 'background: var(--chip-elevated-surface, var(--mo-elevation-1-color));', 1],
  ['elevated card', 'background: var(--card-elevated-surface, var(--mo-elevation-1-color));', 1],
  ['outlined card', 'background: var(--card-outlined-surface, var(--mo-elevation-0-color));', 1],
  ['dialog (also date and time picker)', 'background: var(--dialog-surface, var(--mo-elevation-3-color));', 1],
  ['date picker input label notch', '--text-field-label-surface: var(--dialog-surface, var(--mo-elevation-3-color));', 1],
  ['bottom sheet (container and cover)', 'background: var(--bottom-sheet-surface, var(--mo-elevation-1-color));', 2],
  ['standard side sheet', 'background: var(--side-sheet-surface, var(--mo-elevation-0-color));', 2],
  ['modal side sheet', 'background: var(--side-sheet-modal-surface, var(--side-sheet-surface, var(--mo-elevation-1-color)));', 2],
  ['scrolled top app bar', 'background: var(--top-app-bar-stuck-surface, var(--mo-elevation-2-color));', 1],
  ['menu, menu group and select list', 'background: var(--menu-surface, var(--mo-elevation-2-color));', 3],
  ['navigation drawer', 'background: var(--navigation-drawer-surface, var(--mo-elevation-1-color));', 1],
  ['rich tooltip', 'background: var(--tooltip-rich-surface, var(--mo-elevation-2-color));', 1],
  ['standard navigation rail', 'background: var(--navigation-rail-surface, var(--mo-elevation-0-color));', 1],
  ['modal navigation rail', 'background: var(--navigation-rail-modal-surface, var(--mo-elevation-2-color));', 1],
  ['search view', 'background: var(--search-view-surface, var(--mo-elevation-3-color));', 1],
];

for (const [part, line, times] of surfaces) {
  test(`${part} reads its level's surface`, () => {
    assert.equal(count(uiCss, line), times);
  });
}

// Parts that keep their surface: the top app bar at rest, and the role parts.
const unchanged = [
  'background: var(--top-app-bar-surface, color-mix(in oklab, var(--mo-surface) 85%, transparent));',
  'background: var(--search-bar-surface, var(--block-surface));',
  'background: var(--navigation-bar-surface, var(--block-surface));',
  'background: var(--card-filled-surface, var(--block-tint));',
  'background: var(--switch-handle-surface, var(--block-surface));',
];

for (const line of unchanged) {
  test(`ui.css keeps ${line}`, () => {
    assert.equal(count(uiCss, line), 1);
  });
}

test('no part reads the old surface fallbacks', () => {
  assert.equal(count(uiCss, 'var(--menu-surface, var(--block-surface))'), 0);
  assert.equal(count(uiCss, 'var(--dialog-surface, var(--block-surface))'), 0);
  assert.equal(count(uiCss, 'var(--navigation-drawer-surface, var(--mo-surface-container-low, var(--mo-surface)))'), 0);
  assert.equal(count(uiCss, 'var(--navigation-rail-surface, var(--block-surface))'), 0);
});

// Resting shadows: the part's own variable first, then its level's rest-shadow token.
const restShadows = [
  ['elevated button', 'box-shadow: var(--button-elevated-shadow, var(--mo-elevation-1-rest-shadow));', 2],
  ['elevated chip', 'box-shadow: var(--chip-elevated-shadow, var(--mo-elevation-1-rest-shadow));', 2],
  ['elevated card', '--card-shadow: var(--card-elevated-shadow, var(--mo-elevation-1-rest-shadow));', 1],
  ['modal side sheet (container and wide layout)', 'box-shadow: var(--side-sheet-shadow, var(--mo-elevation-1-rest-shadow));', 2],
  ['bottom sheet', 'box-shadow: var(--bottom-sheet-shadow, var(--mo-elevation-1-rest-shadow));', 1],
  ['bottom sheet as a dialog', 'box-shadow: var(--bottom-sheet-shadow-large, var(--mo-elevation-3-rest-shadow));', 1],
  ['dialog (also date and time picker)', 'var(--dialog-shadow, var(--mo-elevation-3-rest-shadow));', 1],
  ['docked date picker', 'var(--date-picker-docked-shadow, var(--dialog-shadow, var(--mo-elevation-3-rest-shadow)));', 1],
  ['scrolled top app bar', 'box-shadow: var(--top-app-bar-stuck-shadow, var(--mo-elevation-2-rest-shadow));', 1],
  ['modal navigation rail', 'box-shadow: var(--navigation-rail-modal-shadow, var(--mo-elevation-2-rest-shadow));', 1],
  ['navigation drawer', 'box-shadow: var(--navigation-drawer-shadow, var(--mo-elevation-1-rest-shadow));', 1],
  ['menu, menu group and select list', 'var(--menu-shadow, var(--mo-elevation-2-rest-shadow));', 3],
  ['rich tooltip', 'var(--tooltip-rich-shadow, var(--mo-elevation-2-rest-shadow));', 1],
  ['search view', 'var(--search-view-shadow, var(--mo-elevation-3-rest-shadow));', 1],
  ['floating toolbar', 'var(--toolbar-floating-shadow, var(--mo-elevation-3-rest-shadow));', 1],
  ['FAB and FAB menu', 'box-shadow: var(--fab-shadow, var(--mo-elevation-3-rest-shadow));', 2],
  ['snackbar', 'box-shadow: var(--snackbar-shadow, var(--mo-elevation-3-rest-shadow));', 1],
  ['switch handle', 'box-shadow: var(--switch-handle-shadow, var(--mo-elevation-1-rest-shadow));', 1],
  ['slider handle (both directions)', 'box-shadow: var(--slider-handle-shadow, var(--mo-elevation-1-rest-shadow));', 2],
];

for (const [part, line, times] of restShadows) {
  test(`${part} reads its level's rest shadow`, () => {
    assert.equal(count(uiCss, line), times);
  });
}

// The lift stays on --mo-elevation-N-shadow.
test('elevated card hover still reads --mo-elevation-2-shadow', () => {
  assert.equal(
    count(uiCss, '--card-shadow: var(--card-elevated-hover-shadow, var(--card-elevated-shadow, var(--mo-elevation-2-shadow)));'),
    1,
  );
});

test('outlined card keeps --mo-elevation-0-shadow', () => {
  assert.equal(count(uiCss, '--card-shadow: var(--card-outlined-shadow, var(--mo-elevation-0-shadow));'), 1);
});

// The Material theme (global.css): colour at rest, a shadow only for the FAB and the lift.
const globalCss = read('./global.css');

for (let level = 1; level <= 5; level++) {
  test(`global.css sets --mo-elevation-${level}-rest-shadow to no shadow`, () => {
    assert.equal(count(globalCss, `  --mo-elevation-${level}-rest-shadow: var(--mo-elevation-0-shadow);\n`), 1);
  });
}

const addedLines = [
  ['--fab-shadow: var(--mo-elevation-3-shadow);', 1],
  ['--fab-hover-shadow: var(--mo-elevation-4-shadow);', 1],
  ['--block-shadow: var(--mo-elevation-1-rest-shadow);', 1],
  // Light mode once, then the dark-mode media block and the dark theme attribute.
  ['--panel-shadow: var(--mo-elevation-1-rest-shadow);', 3],
];

for (const [line, times] of addedLines) {
  test(`global.css has ${line} ${times} time(s)`, () => {
    assert.equal(count(globalCss, line), times);
  });
}

const removedDeclarations = [
  '--button-elevated-surface',
  '--card-elevated-surface',
  '--side-sheet-surface',
  '--side-sheet-modal-surface',
  '--bottom-sheet-surface',
  '--dialog-surface',
  '--top-app-bar-stuck-surface',
  '--top-app-bar-stuck-shadow',
  '--navigation-rail-surface',
  '--navigation-drawer-surface',
  '--tooltip-rich-surface',
  '--search-view-surface',
  '--switch-handle-shadow',
  '--slider-handle-shadow',
];

for (const name of removedDeclarations) {
  test(`global.css no longer declares ${name}`, () => {
    assert.equal(count(globalCss, `${name}:`), 0);
  });
}

// The menu is M3 Expressive's vertical menu in its standard colours: on the low surface container (level 1's colour), with
// level 2's shadow, so it stands in front of the page (m3.material.io/components/menus/specs).
test('global.css puts the menu on level 1 with the level 2 shadow', () => {
  assert.equal(count(globalCss, '  --menu-surface: var(--mo-elevation-1-color);\n'), 1);
  assert.equal(count(globalCss, '  --menu-shadow: var(--mo-elevation-2-shadow);\n'), 1);
});

test('global.css keeps the extended FAB lines in the navigation drawer', () => {
  assert.equal(count(globalCss, '  --fab-shadow: var(--mo-elevation-1-shadow);\n  --fab-hover-shadow: var(--mo-elevation-2-shadow);\n'), 1);
});
