import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STYLE_KINDS, styleKindOf } from './styleKind.mjs';

test('outside the text the style button shows the generic icon, whatever the cursor was in', () => {
  assert.equal(styleKindOf(['check'], false), 'generic');
  assert.equal(styleKindOf([], false), 'generic');
});

test('in the text it shows the style of the block, as the menu marks it', () => {
  for (const kind of ['large', 'medium', 'small', 'label', 'bullet', 'check', 'ordered', 'quote'])
    assert.equal(styleKindOf([kind, 'strong'], true), kind);
});

test('in a heading it shows Body large, though Body small is first in the list', () => {
  assert.equal(styleKindOf(['h2'], true), 'large');
});

// The floating row and the top toolbar draw each style's icon from one table (KIND_ICONS in MarkdownEditor.tsx), so a style
// never has two icons, and every style of STYLE_KINDS has one.
test('both toolbars take each text style icon from the same table', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  const table = source.match(/const KIND_ICONS = \{([\s\S]*?)\n\};/)[1];
  const names = [...table.matchAll(/^ {2}(\w+): \{ raw: (\w+), node: (\w+) \}/gm)];
  assert.deepEqual(
    names.map((m) => m[1]),
    STYLE_KINDS,
  );
  assert.equal(new Set(names.map((m) => m[2])).size, STYLE_KINDS.length, 'each style has its own icon');
  for (const [, name] of names) {
    assert.match(source, new RegExp(`name: '${name}', icon: KIND_ICONS\\.${name}\\.raw`), `the floating row draws ${name} from the table`);
    assert.match(
      source,
      new RegExp(`icon: KIND_ICONS\\.${name}\\.node, action: \\(\\) => setKind\\('${name}'\\)`),
      `the top toolbar draws ${name} from the table`,
    );
  }
});

// One order everywhere: the body styles from small to large, then Label, the lists and the quote (the sheet, the top toolbar's
// menu, the floating row's menu and button, STYLE_KINDS and KIND_ICONS).
test('every list of the text styles is in the order of STYLE_KINDS', () => {
  assert.deepEqual(STYLE_KINDS, ['small', 'medium', 'large', 'label', 'bullet', 'check', 'ordered', 'quote']);
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  const order = (re) => [...source.matchAll(re)].map((m) => m[1]);
  assert.deepEqual(order(/^ {8}\{ name: '(\w+)', icon: KIND_ICONS\.\w+\.raw/gm), STYLE_KINDS, 'the floating row');
  assert.deepEqual(
    order(/^ {4}\{ label: [\w.]+, icon: KIND_ICONS\.\w+\.node, action: \(\) => setKind\('(\w+)'\)/gm),
    STYLE_KINDS,
    'the top toolbar and the sheet',
  );
  const filter = source.match(/\['h1', 'h2', 'h3', ((?:'\w+',? ?)+)\]\.includes\(t\.on/)[1];
  assert.deepEqual(
    [...filter.matchAll(/'(\w+)'/g)].map((m) => m[1]),
    STYLE_KINDS,
    "the list that picks the sheet's styles",
  );
});
