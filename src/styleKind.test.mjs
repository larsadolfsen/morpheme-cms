import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIST_KINDS, STYLE_KINDS, TEXT_KINDS, listKindOf, styleKindOf } from './styleKind.mjs';

test('outside the text both buttons show their generic icon, whatever the cursor was in', () => {
  assert.equal(styleKindOf(['check'], false), 'generic');
  assert.equal(styleKindOf([], false), 'generic');
  assert.equal(listKindOf(['check'], false), 'generic');
  assert.equal(listKindOf([], false), 'generic');
});

test('in the text Text style shows the style of the block, as the menu marks it', () => {
  for (const kind of TEXT_KINDS) assert.equal(styleKindOf([kind, 'strong'], true), kind);
});

test('in a list List shows the list and Text style is generic; outside a list List is generic', () => {
  for (const kind of LIST_KINDS) {
    assert.equal(listKindOf([kind, 'strong'], true), kind);
    assert.equal(styleKindOf([kind], true), 'generic');
  }
  for (const kind of TEXT_KINDS) assert.equal(listKindOf([kind], true), 'generic');
  assert.equal(listKindOf(['h2'], true), 'generic');
});

test('the kinds are the text styles, then the lists', () => {
  assert.deepEqual(TEXT_KINDS, ['small', 'medium', 'large', 'label', 'quote']);
  assert.deepEqual(LIST_KINDS, ['bullet', 'check', 'ordered']);
  assert.deepEqual(STYLE_KINDS, [...TEXT_KINDS, ...LIST_KINDS]);
});

test('in a heading Text style is generic, never a body style, and List is generic too', () => {
  for (const level of ['h1', 'h2', 'h3']) {
    assert.equal(styleKindOf([level], true), 'generic');
    assert.equal(listKindOf([level], true), 'generic');
  }
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

// One order everywhere: the body styles from small to large, then Label and the quote, then the lists (the sheet, the top toolbar's
// menu, the floating row's menu and button, STYLE_KINDS and KIND_ICONS).
test('every list of the text styles is in the order of STYLE_KINDS', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  const order = (re) => [...source.matchAll(re)].map((m) => m[1]);
  assert.deepEqual(order(/^ {8}\{ name: '(\w+)', icon: KIND_ICONS\.\w+\.raw/gm), STYLE_KINDS, 'the floating row');
  assert.deepEqual(
    order(/^ {4}\{ label: [\w.]+, icon: KIND_ICONS\.\w+\.node, action: \(\) => setKind\('(\w+)'\)/gm),
    STYLE_KINDS,
    'the top toolbar and the sheet',
  );
  assert.match(source, /\['h1', 'h2', 'h3', \.\.\.STYLE_KINDS\]\.includes\(t\.on/, "the list that picks the sheet's styles is STYLE_KINDS");
});

// The three body icons are one family: a T at three sizes with Phosphor's stroke (16 on the 256 grid) and one baseline.
test('the body icons are one T at three sizes on one baseline', () => {
  const tall = {};
  for (const size of ['small', 'medium', 'large']) {
    const file = readFileSync(new URL(`./icons/text-t-${size}.svg`, import.meta.url), 'utf8');
    const rects = [...file.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" rx="8"\/>/g)].map((m) =>
      m.slice(1).map(Number),
    );
    assert.equal(rects.length, 2, `${size}: a bar and a stem`);
    const [bar, stem] = rects;
    assert.equal(bar[3], 16, `${size}: the bar has the stroke`);
    assert.equal(stem[2], 16, `${size}: the stem has the stroke`);
    assert.equal(stem[1] + stem[3], 216, `${size}: the baseline`);
    assert.equal(bar[0] + bar[2] / 2, 128, `${size}: centred`);
    tall[size] = stem[3];
  }
  assert.ok(tall.small < tall.medium && tall.medium < tall.large, 'three sizes');
  assert.ok(
    tall.small / tall.large < 0.45 && tall.medium / tall.large > 0.6 && tall.medium / tall.large < 0.75,
    'a third, two thirds, full',
  );
});

// Two controls, Text style and List, each with its own general icon and a label that names the current choice.
test('Text style and List are two buttons that name their choice', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  assert.match(source, /list: \{ raw: listIcon, node: ListDashes \}/, 'a general list icon');
  assert.match(
    source,
    /groupFace\(\s*textKinds\.find\(\(\{ name \}\) => name === kind\)!,\s*t\.text\.listIs,?\s*\)/,
    'the floating row: "List: …"',
  );
  assert.match(source, /action: \(button\) => kinds\(button, 'list'\)/, 'the floating row has a List button');
  assert.match(source, /group === 'list' \? \[GENERIC_ICONS\.list\.node, t\.text\.list, t\.text\.listIs\]/, 'the top toolbar: "List: …"');
  for (const locale of ['en-US', 'da-DK']) {
    const text = readFileSync(new URL(`./i18n/${locale}/text.ts`, import.meta.url), 'utf8');
    assert.match(text, /\n  list: '/);
    assert.match(text, /\n  listIs: /);
  }
  assert.match(readFileSync(new URL('./i18n/en-US/text.ts', import.meta.url), 'utf8'), /listIs: \(kind: string\) => `List: \$\{kind\}`/);
});

// Every style of STYLE_KINDS can be picked in both places and is named there: the floating row's list (textKinds) and the top toolbar's
// tools (all) each have its icon and a label, and the menus of the Text style and List buttons are made from that tools list.
test('every style has an icon and a label in the floating row and in the toolbar', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  for (const name of STYLE_KINDS) {
    assert.match(
      source,
      new RegExp(`name: '${name}', icon: KIND_ICONS\\.${name}\\.raw, label: t\\.text\\.\\w+`),
      `the floating row has no entry with icon and label for ${name}`,
    );
    assert.match(
      source,
      new RegExp(`label: t\\.text\\.\\w+, icon: KIND_ICONS\\.${name}\\.node, action: \\(\\) => setKind\\('${name}'\\), on: '${name}'`),
      `the toolbar has no tool with icon and label for ${name}`,
    );
  }
  assert.match(source, /kinds\(button, 'text'\)/, 'the floating Text style button opens the menu');
  assert.match(source, /kinds\(button, 'list'\)/, 'the floating List button opens the menu');
  assert.match(source, /kinds\(button, 'headings'\)/, 'the floating heading button opens the menu');
});
