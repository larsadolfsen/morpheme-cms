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
  '--elevation-0-surface': 'var(--bg)',
  '--elevation-1-surface': 'var(--surface-container-low, var(--block-surface))',
  '--elevation-2-surface': 'var(--surface-container, var(--block-surface))',
  '--elevation-3-surface': 'var(--surface-container-high, var(--block-surface))',
  '--elevation-4-surface': 'var(--surface-container-highest, var(--block-surface))',
  '--elevation-5-surface': 'var(--surface-container-highest, var(--block-surface))',
  '--elevation-1-rest-shadow': 'var(--elevation-1)',
  '--elevation-2-rest-shadow': 'var(--elevation-2)',
  '--elevation-3-rest-shadow': 'var(--elevation-3)',
  '--elevation-4-rest-shadow': 'var(--elevation-4)',
  '--elevation-5-rest-shadow': 'var(--elevation-5)',
};

for (const [name, value] of Object.entries(tokens)) {
  test(`ui.css declares ${name}`, () => {
    assert.equal(count(uiCss, `  ${name}: ${value};\n`), 1);
  });
}

// Neutral parts: the resting surface reads the part's own variable, then its level's colour.
const surfaces = [
  ['elevated button', 'background: var(--button-elevated-surface, var(--elevation-1-surface));', 1],
  ['elevated chip', 'background: var(--chip-elevated-surface, var(--elevation-1-surface));', 1],
  ['elevated card', 'background: var(--card-elevated-surface, var(--elevation-1-surface));', 1],
  ['outlined card', 'background: var(--card-outlined-surface, var(--elevation-0-surface));', 1],
  ['dialog (also date and time picker)', 'background: var(--dialog-surface, var(--elevation-3-surface));', 1],
  ['date picker input label notch', '--text-field-label-surface: var(--dialog-surface, var(--elevation-3-surface));', 1],
  ['bottom sheet (container and cover)', 'background: var(--bottom-sheet-surface, var(--elevation-1-surface));', 2],
  ['standard side sheet', 'background: var(--side-sheet-surface, var(--elevation-0-surface));', 2],
  ['modal side sheet', 'background: var(--side-sheet-modal-surface, var(--side-sheet-surface, var(--elevation-1-surface)));', 2],
  ['scrolled top app bar', 'background: var(--top-app-bar-stuck-surface, var(--elevation-2-surface));', 1],
  ['menu, menu group and select list', 'background: var(--menu-surface, var(--elevation-2-surface));', 3],
  ['navigation drawer', 'background: var(--navigation-drawer-surface, var(--elevation-1-surface));', 1],
  ['rich tooltip', 'background: var(--tooltip-rich-surface, var(--elevation-2-surface));', 1],
  ['standard navigation rail', 'background: var(--navigation-rail-surface, var(--elevation-0-surface));', 1],
  ['modal navigation rail', 'background: var(--navigation-rail-modal-surface, var(--elevation-2-surface));', 1],
  ['search view', 'background: var(--search-view-surface, var(--elevation-3-surface));', 1],
];

for (const [part, line, times] of surfaces) {
  test(`${part} reads its level's surface`, () => {
    assert.equal(count(uiCss, line), times);
  });
}

// Parts that keep their surface: the top app bar at rest, and the role parts.
const unchanged = [
  'background: var(--top-app-bar-surface, color-mix(in oklab, var(--bg) 85%, transparent));',
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
  assert.equal(count(uiCss, 'var(--navigation-drawer-surface, var(--surface-container-low, var(--bg)))'), 0);
  assert.equal(count(uiCss, 'var(--navigation-rail-surface, var(--block-surface))'), 0);
});

// Resting shadows: the part's own variable first, then its level's rest-shadow token.
const restShadows = [
  ['elevated button', 'box-shadow: var(--button-elevated-shadow, var(--elevation-1-rest-shadow));', 2],
  ['elevated chip', 'box-shadow: var(--chip-elevated-shadow, var(--elevation-1-rest-shadow));', 2],
  ['elevated card', '--card-shadow: var(--card-elevated-shadow, var(--elevation-1-rest-shadow));', 1],
  ['modal side sheet (container and wide layout)', 'box-shadow: var(--side-sheet-shadow, var(--elevation-1-rest-shadow));', 2],
  ['bottom sheet', 'box-shadow: var(--bottom-sheet-shadow, var(--elevation-1-rest-shadow));', 1],
  ['bottom sheet as a dialog', 'box-shadow: var(--bottom-sheet-shadow-large, var(--elevation-3-rest-shadow));', 1],
  ['dialog (also date and time picker)', 'var(--dialog-shadow, var(--elevation-3-rest-shadow));', 1],
  ['docked date picker', 'var(--date-picker-docked-shadow, var(--dialog-shadow, var(--elevation-3-rest-shadow)));', 1],
  ['scrolled top app bar', 'box-shadow: var(--top-app-bar-stuck-shadow, var(--elevation-2-rest-shadow));', 1],
  ['modal navigation rail', 'box-shadow: var(--navigation-rail-modal-shadow, var(--elevation-2-rest-shadow));', 1],
  ['navigation drawer', 'box-shadow: var(--navigation-drawer-shadow, var(--elevation-1-rest-shadow));', 1],
  ['menu, menu group and select list', 'var(--menu-shadow, var(--elevation-2-rest-shadow));', 3],
  ['rich tooltip', 'var(--tooltip-rich-shadow, var(--elevation-2-rest-shadow));', 1],
  ['search view', 'var(--search-view-shadow, var(--elevation-3-rest-shadow));', 1],
  ['floating toolbar', 'var(--toolbar-floating-shadow, var(--elevation-3-rest-shadow));', 1],
  ['FAB and FAB menu', 'box-shadow: var(--fab-shadow, var(--elevation-3-rest-shadow));', 2],
  ['snackbar', 'box-shadow: var(--snackbar-shadow, var(--elevation-3-rest-shadow));', 1],
  ['switch handle', 'box-shadow: var(--switch-handle-shadow, var(--elevation-1-rest-shadow));', 1],
  ['slider handle (both directions)', 'box-shadow: var(--slider-handle-shadow, var(--elevation-1-rest-shadow));', 2],
];

for (const [part, line, times] of restShadows) {
  test(`${part} reads its level's rest shadow`, () => {
    assert.equal(count(uiCss, line), times);
  });
}

// The lift stays on --elevation-N.
test('elevated card hover still reads --elevation-2', () => {
  assert.equal(count(uiCss, '--card-shadow: var(--card-elevated-hover-shadow, var(--card-elevated-shadow, var(--elevation-2)));'), 1);
});

test('outlined card keeps --elevation-0', () => {
  assert.equal(count(uiCss, '--card-shadow: var(--card-outlined-shadow, var(--elevation-0));'), 1);
});

// The Material theme (global.css): colour at rest, a shadow only for the FAB and the lift.
const globalCss = read('./global.css');

for (let level = 1; level <= 5; level++) {
  test(`global.css sets --elevation-${level}-rest-shadow to no shadow`, () => {
    assert.equal(count(globalCss, `  --elevation-${level}-rest-shadow: var(--elevation-0);\n`), 1);
  });
}

const addedLines = [
  ['--fab-shadow: var(--elevation-3);', 1],
  ['--fab-hover-shadow: var(--elevation-4);', 1],
  ['--block-shadow: var(--elevation-1-rest-shadow);', 1],
  // Light mode once, then the dark-mode media block and the dark theme attribute.
  ['--shadow: var(--elevation-1-rest-shadow);', 3],
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
  '--menu-surface',
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

test('global.css keeps the extended FAB lines in the navigation drawer', () => {
  assert.equal(count(globalCss, '  --fab-shadow: var(--elevation-1);\n  --fab-hover-shadow: var(--elevation-2);\n'), 1);
});
