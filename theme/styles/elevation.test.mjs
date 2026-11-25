// Checks the tonal elevation tokens and rules of the base theme (spec: tonal elevation, Material 3).
// Reads theme/styles/ui.css, cards.css and the files of UI_PART_FILES (and later global.css) as text; no browser, no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UI_PART_FILES, MATERIAL_FILES } from './files.mjs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
import { readdirSync } from 'node:fs';
/** A stylesheet and the token files it imports (tokens/<origin>/*.css, docs/theme-token-files.md), as one text. */
const withTokens = (name, origin) =>
  [
    read(name),
    ...readdirSync(new URL(`./tokens/${origin}/`, import.meta.url), { recursive: true })
      .filter((f) => f.endsWith('.css'))
      .sort()
      .map((f) => read(`./tokens/${origin}/${f}`)),
  ].join('\n');
// The card rules are in cards.css and the other parts' in the files of UI_PART_FILES (moved out of ui.css, theme/styles/files.mjs,
// docs/superpowers/plans/2026-11-16-css-split.md), so the text is those files, each with its token files.
const uiCss = withTokens('./ui.css', 'ui') + withTokens('./cards.css', 'cards') + UI_PART_FILES.map((f) => read(`./${f}`)).join('');

const count = (text, part) => text.split(part).length - 1;

// The level tokens: the exact default declaration of each, once in ui.css.
const tokens = {
  '--mo-sys-elevation-level0-color': 'var(--mo-sys-color-surface)',
  '--mo-sys-elevation-level1-color': 'var(--mo-sys-color-surface-container-low, var(--mo-comp-block-surface))',
  '--mo-sys-elevation-level2-color': 'var(--mo-sys-color-surface-container, var(--mo-comp-block-surface))',
  '--mo-sys-elevation-level3-color': 'var(--mo-sys-color-surface-container-high, var(--mo-comp-block-surface))',
  '--mo-sys-elevation-level4-color': 'var(--mo-sys-color-surface-container-highest, var(--mo-comp-block-surface))',
  '--mo-sys-elevation-level5-color': 'var(--mo-sys-color-surface-container-highest, var(--mo-comp-block-surface))',
  '--mo-sys-elevation-level1-rest-shadow': 'var(--mo-sys-elevation-level0-shadow)',
  '--mo-sys-elevation-level2-rest-shadow': 'var(--mo-sys-elevation-level0-shadow)',
  '--mo-sys-elevation-level3-rest-shadow': 'var(--mo-sys-elevation-level0-shadow)',
  '--mo-sys-elevation-level4-rest-shadow': 'var(--mo-sys-elevation-level0-shadow)',
  '--mo-sys-elevation-level5-rest-shadow': 'var(--mo-sys-elevation-level0-shadow)',
};

for (const [name, value] of Object.entries(tokens)) {
  test(`ui.css declares ${name}`, () => {
    assert.equal(count(uiCss, `  ${name}: ${value};\n`), 1);
  });
}

// Neutral parts: the resting surface reads the part's own variable, then its level's colour.
const surfaces = [
  ['elevated button', 'background: var(--mo-comp-button-elevated-surface, var(--mo-sys-elevation-level1-color));', 1],
  ['elevated chip', 'background: var(--mo-comp-chip-elevated-surface, var(--mo-sys-elevation-level1-color));', 1],
  ['elevated card', 'background: var(--mo-comp-card-elevated-surface, var(--mo-sys-elevation-level1-color));', 1],
  ['outlined card', 'background: var(--mo-comp-outlined-card-container-color, var(--mo-sys-elevation-level0-color));', 1],
  ['dialog (also date and time picker)', 'background: var(--mo-comp-dialog-surface, var(--mo-sys-elevation-level3-color));', 1],
  [
    'date picker input label notch',
    '--mo-comp-text-field-label-surface: var(--mo-comp-dialog-surface, var(--mo-sys-elevation-level3-color));',
    1,
  ],
  ['bottom sheet (container and cover)', 'background: var(--mo-comp-bottom-sheet-surface, var(--mo-sys-elevation-level1-color));', 2],
  ['standard side sheet', 'background: var(--mo-comp-side-sheet-surface, var(--mo-sys-elevation-level0-color));', 2],
  [
    'modal side sheet',
    'background: var(--mo-comp-side-sheet-modal-surface, var(--mo-comp-side-sheet-surface, var(--mo-sys-elevation-level1-color)));',
    2,
  ],
  ['scrolled top app bar', 'background: var(--mo-comp-top-app-bar-stuck-surface, var(--mo-sys-elevation-level2-color));', 1],
  [
    'menu, menu group and select list',
    'background: var(--mo-comp-menus-standard-container-color, var(--mo-sys-elevation-level2-color));',
    3,
  ],
  [
    'modal navigation drawer (the expanded rail, modal)',
    'background: var(--mo-comp-navigation-drawer-surface, var(--mo-sys-elevation-level2-color));',
    1,
  ],
  [
    'standard navigation drawer (the expanded rail, standard)',
    'background: var(--mo-comp-navigation-drawer-surface, var(--mo-sys-elevation-level0-color));',
    1,
  ],
  ['rich tooltip', 'background: var(--mo-comp-tooltip-rich-surface, var(--mo-sys-elevation-level2-color));', 1],
  ['standard navigation rail', 'background: var(--mo-comp-navigation-rail-surface, var(--mo-sys-elevation-level0-color));', 1],
  ['modal navigation rail', 'background: var(--mo-comp-navigation-rail-modal-surface, var(--mo-sys-elevation-level2-color));', 1],
  ['search view', 'background: var(--mo-comp-search-view-surface, var(--mo-sys-elevation-level3-color));', 1],
];

for (const [part, line, times] of surfaces) {
  test(`${part} reads its level's surface`, () => {
    assert.equal(count(uiCss, line), times);
  });
}

// Parts that keep their surface: the top app bar at rest, and the role parts.
const unchanged = [
  'background: var(--mo-comp-top-app-bar-surface, color-mix(in oklab, var(--mo-sys-color-surface) 85%, transparent));',
  'background: var(--mo-comp-search-bar-container-color, var(--mo-comp-block-surface));',
  'background: var(--mo-comp-nav-bar-container-color, var(--mo-comp-block-surface));',
  'background: var(--mo-comp-filled-card-container-color, var(--mo-sys-color-surface-container-highest, var(--mo-comp-block-tint)));',
  'background: var(--mo-comp-switch-unselected-handle-color, var(--mo-comp-block-surface));',
];

for (const line of unchanged) {
  test(`ui.css keeps ${line}`, () => {
    assert.equal(count(uiCss, line), 1);
  });
}

test('no part reads the old surface fallbacks', () => {
  assert.equal(count(uiCss, 'var(--mo-comp-menus-standard-container-color, var(--mo-comp-block-surface))'), 0);
  assert.equal(count(uiCss, 'var(--mo-comp-dialog-surface, var(--mo-comp-block-surface))'), 0);
  assert.equal(
    count(uiCss, 'var(--mo-comp-navigation-drawer-surface, var(--mo-sys-color-surface-container-low, var(--mo-sys-color-surface)))'),
    0,
  );
  assert.equal(count(uiCss, 'var(--mo-comp-navigation-rail-surface, var(--mo-comp-block-surface))'), 0);
});

// Shadows: the part's own variable first, then the level's token: an elevated object reads --mo-sys-elevation-levelN-shadow, a surface
// --mo-sys-elevation-levelN-rest-shadow, which Material sets to no shadow (elevation spec, batch 3).
const restShadows = [
  ['elevated button', 'box-shadow: var(--mo-comp-button-elevated-shadow, var(--mo-sys-elevation-level1-shadow));', 2],
  ['elevated chip', 'box-shadow: var(--mo-comp-chip-elevated-shadow, var(--mo-sys-elevation-level1-shadow));', 2],
  ['elevated card', '--mo-comp-card-shadow: var(--mo-comp-elevated-card-container-elevation, var(--mo-sys-elevation-level1-shadow));', 1],
  [
    'modal side sheet (container and wide layout)',
    'box-shadow: var(--mo-comp-side-sheet-shadow, var(--mo-sys-elevation-level1-shadow));',
    2,
  ],
  ['bottom sheet', 'box-shadow: var(--mo-comp-bottom-sheet-shadow, var(--mo-sys-elevation-level1-shadow));', 1],
  ['bottom sheet as a dialog', 'box-shadow: var(--mo-comp-bottom-sheet-shadow-large, var(--mo-sys-elevation-level1-shadow));', 1],
  ['dialog (also date and time picker)', 'var(--mo-comp-dialog-shadow, var(--mo-sys-elevation-level3-shadow));', 1],
  [
    'docked date picker',
    'var(--mo-comp-date-picker-docked-shadow, var(--mo-comp-dialog-shadow, var(--mo-sys-elevation-level3-rest-shadow)));',
    1,
  ],
  ['scrolled top app bar', 'box-shadow: var(--mo-comp-top-app-bar-stuck-shadow, var(--mo-sys-elevation-level2-rest-shadow));', 1],
  ['modal navigation rail', 'box-shadow: var(--mo-comp-navigation-rail-modal-shadow, var(--mo-sys-elevation-level2-shadow));', 1],
  [
    'modal navigation drawer (the expanded rail, modal: M3 level 2, 3dp)',
    'box-shadow: var(--mo-comp-navigation-drawer-shadow, var(--mo-sys-elevation-level2-shadow));',
    1,
  ],
  ['menu, menu group and select list', 'var(--mo-comp-menu-container-elevation, var(--mo-sys-elevation-level2-shadow));', 3],
  ['rich tooltip', 'var(--mo-comp-tooltip-rich-shadow, var(--mo-sys-elevation-level2-shadow));', 1],
  ['search view', 'var(--mo-comp-search-view-shadow, var(--mo-sys-elevation-level3-rest-shadow));', 1],
  ['floating toolbar', 'var(--mo-comp-toolbar-floating-shadow, var(--mo-sys-elevation-level3-shadow));', 1],
  ['FAB and FAB menu', 'box-shadow: var(--mo-comp-fab-shadow, var(--mo-sys-elevation-level3-shadow));', 2],
  ['snackbar', 'box-shadow: var(--mo-comp-snackbar-shadow, var(--mo-sys-elevation-level3-shadow));', 1],
  ['switch handle', 'box-shadow: var(--mo-comp-switch-handle-shadow, var(--mo-sys-elevation-level1-rest-shadow));', 1],
  ['slider handle (both directions)', 'box-shadow: var(--mo-comp-slider-handle-shadow, var(--mo-sys-elevation-level1-rest-shadow));', 2],
];

for (const [part, line, times] of restShadows) {
  test(`${part} reads its shadow`, () => {
    assert.equal(count(uiCss, line), times);
  });
}

// The lift stays on --mo-elevation-N-shadow.
test('elevated card hover still reads --mo-sys-elevation-level2-shadow', () => {
  // Prettier wraps a long var() over lines, so the text is read with its white space collapsed.
  const flat = uiCss.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  assert.equal(
    count(
      flat,
      '--mo-comp-card-shadow: var(--mo-comp-elevated-card-hover-container-elevation, var(--mo-comp-elevated-card-container-elevation, var(--mo-sys-elevation-level2-shadow)));',
    ),
    1,
  );
});

test('outlined card keeps --mo-sys-elevation-level0-shadow', () => {
  assert.equal(count(uiCss, '--mo-comp-card-shadow: var(--mo-comp-card-outlined-shadow, var(--mo-sys-elevation-level0-shadow));'), 1);
});

// The Material theme (global.css): no shadow at rest on a surface, each level's rest shadow is level 0's.
const globalCss = withTokens('./global.css', 'material') + MATERIAL_FILES.map((f) => read(`./${f}`)).join('');

for (let level = 1; level <= 5; level++) {
  test(`global.css sets --mo-sys-elevation-level${level}-rest-shadow to level 0's shadow (no shadow on a surface)`, () => {
    assert.equal(count(globalCss, `  --mo-sys-elevation-level${level}-rest-shadow: var(--mo-sys-elevation-level0-shadow);\n`), 1);
  });
}

const addedLines = [
  ['--mo-comp-fab-shadow: var(--mo-sys-elevation-level3-shadow);', 1],
  ['--mo-comp-fab-hover-shadow: var(--mo-sys-elevation-level4-shadow);', 1],
  ['--mo-comp-block-shadow: var(--mo-sys-elevation-level1-rest-shadow);', 1],
  // Light mode once, then the dark-mode media block and the dark theme attribute.
  ['--mo-sys-panel-shadow: var(--mo-sys-elevation-level1-rest-shadow);', 3],
];

for (const [line, times] of addedLines) {
  test(`global.css has ${line} ${times} time(s)`, () => {
    assert.equal(count(globalCss, line), times);
  });
}

const removedDeclarations = [
  '--mo-comp-button-elevated-surface',
  '--mo-comp-card-elevated-surface',
  '--mo-comp-side-sheet-surface',
  '--mo-comp-side-sheet-modal-surface',
  '--mo-comp-bottom-sheet-surface',
  '--mo-comp-dialog-surface',
  '--mo-comp-top-app-bar-stuck-surface',
  '--mo-comp-top-app-bar-stuck-shadow',
  '--mo-comp-tooltip-rich-surface',
  '--mo-comp-search-view-surface',
  '--mo-comp-switch-handle-shadow',
  '--mo-comp-slider-handle-shadow',
];

for (const name of removedDeclarations) {
  test(`global.css no longer declares ${name}`, () => {
    assert.equal(count(globalCss, `${name}:`), 0);
  });
}

// The rail and the expanded rail (the editor's main drawer) are in the surface container, the Container role the Navigation rail page prints
// (Specs, Color), not in the page's own surface: 0.19.5 removed these two declarations and the rail lost its colour (0.19.7).
for (const name of ['--mo-comp-navigation-rail-surface', '--mo-comp-navigation-drawer-surface']) {
  test(`global.css gives ${name} the surface container`, () => {
    assert.equal(count(globalCss, `${name}: var(--mo-sys-color-surface-container);`), 1);
  });
}

// The menu is M3 Expressive's vertical menu in its standard colours: on surface-container-low (md.comp.menus.standard.container.color), with
// level 2's shadow, so it stands in front of the page (m3.material.io/components/menus/specs).
test('global.css puts the menu on the lowest surface container with the level 2 shadow', () => {
  assert.equal(count(globalCss, '  --mo-comp-menus-standard-container-color: var(--mo-sys-color-surface-container-low);\n'), 1);
  assert.equal(count(globalCss, '  --mo-comp-menu-container-elevation: var(--mo-sys-elevation-level2-shadow);\n'), 1);
});

test('global.css keeps the extended FAB lines in the navigation drawer', () => {
  assert.equal(
    count(
      globalCss,
      '  --mo-comp-fab-shadow: var(--mo-sys-elevation-level1-shadow);\n  --mo-comp-fab-hover-shadow: var(--mo-sys-elevation-level2-shadow);\n',
    ),
    1,
  );
});

// The classes (theme/styles/elevation.css, spec 2026-11-20-elevation-design.md): mo-elevation-0 to -3 are surfaces, mo-elevated-1 to -3 only a shadow.
const classCss = read('./elevation.css');
const rule = (selector) => {
  const at = classCss.indexOf(`  ${selector} {`);
  assert.notEqual(at, -1, `${selector} has a rule`);
  return classCss.slice(at, classCss.indexOf('}', at));
};

for (const n of [0, 1, 2, 3]) {
  test(`.mo-elevation-${n} is a surface: the level's colour and on-colour${n ? ', and the elevation shadow' : ''}`, () => {
    const body = rule(`.mo-elevation-${n}`);
    assert.match(body, new RegExp(`background-color: var\\(--mo-sys-elevation-level${n}-color\\);`));
    assert.match(body, /color: var\(--mo-sys-color-on-surface\);/);
    if (n) assert.match(body, new RegExp(`box-shadow: var\\(--mo-sys-elevation-level${n}-rest-shadow\\);`));
    else assert.doesNotMatch(body, /box-shadow/);
  });
}

for (const n of [1, 2, 3]) {
  test(`.mo-elevated-${n} sets only the level's shadow, no colour`, () => {
    const body = rule(`.mo-elevated-${n}`);
    assert.match(body, new RegExp(`box-shadow: var\\(--mo-sys-elevation-level${n}-shadow\\);`));
    assert.doesNotMatch(body, /background|color:/);
  });
}

test('there is no mo-elevated-0 and no class above level 3', () => {
  assert.doesNotMatch(classCss, /mo-elevated-0|mo-elevation-[45]|mo-elevated-[45]/);
});

test('hover steps up one level, for what can be clicked and where the device can hover', () => {
  assert.match(classCss, /@media \(hover: hover\)/);
  const hover = classCss.slice(classCss.indexOf('@media (hover: hover)'));
  for (const n of [1, 2, 3]) {
    assert.match(
      hover,
      new RegExp(
        `\\.mo-elevated-${n}:hover:not\\(\\[data-dragged\\]\\) \\{\\s*box-shadow: var\\(--mo-sys-elevation-level${n + 1}-shadow\\);`,
      ),
    );
  }
  for (const n of [0, 1, 2, 3]) {
    assert.match(
      hover,
      new RegExp(
        `\\.mo-elevation-${n}\\)\\:hover:not\\(\\[data-dragged\\]\\) \\{\\s*box-shadow: var\\(--mo-sys-elevation-level${n + 1}-rest-shadow\\);`,
      ),
    );
  }
  assert.match(hover, /:is\(a, button, summary, \[role='button'\], \[tabindex\]\)/);
});

test('dragged steps up three levels, never above 5', () => {
  const dragged = { 0: 3, 1: 4, 2: 5, 3: 5 };
  for (const [n, to] of Object.entries(dragged)) {
    const at = classCss.indexOf(`.mo-elevation-${n}[data-dragged]`);
    assert.notEqual(at, -1);
    assert.match(classCss.slice(at, classCss.indexOf('}', at)), new RegExp(`var\\(--mo-sys-elevation-level${to}-shadow\\)`));
    if (n !== '0') {
      const e = classCss.indexOf(`.mo-elevated-${n}[data-dragged]`);
      assert.match(classCss.slice(e, classCss.indexOf('}', e)), new RegExp(`var\\(--mo-sys-elevation-level${to}-shadow\\)`));
    }
  }
});

test('the classes use the theme’s effects spring and sit in the utilities layer', () => {
  assert.match(classCss, /transition: box-shadow var\(--mo-sys-motion-spring-default-effects\);/);
  assert.match(classCss, /^@layer utilities \{/m);
});

// Batch 3 (the current parts): the surfaces that M3 draws flat, and the FAB menu's actions.
test('the modal date picker is a surface (rest shadow), the dialog around a time picker is elevated', () => {
  assert.equal(count(uiCss, 'var(--mo-comp-date-picker-modal-shadow, var(--mo-sys-elevation-level3-rest-shadow));'), 1);
});

test('the FAB menu actions are level 0 at rest, level 4 pointed at, level 3 with focus or pressed', () => {
  assert.equal(count(uiCss, 'var(--mo-comp-fab-menu-item-shadow, var(--mo-sys-elevation-level0-shadow))'), 1);
  assert.equal(count(uiCss, 'var(--mo-comp-fab-menu-item-hover-shadow, var(--mo-sys-elevation-level4-shadow))'), 1);
  assert.equal(count(uiCss, 'var(--mo-comp-fab-menu-item-focus-shadow, var(--mo-sys-elevation-level3-shadow))'), 1);
});

test('a list that expands has no shadow of its own (level 0, not the block shadow)', () => {
  assert.equal(count(uiCss, 'box-shadow: var(--mo-comp-list-expand-shadow, var(--mo-sys-elevation-level0-shadow));'), 1);
});
