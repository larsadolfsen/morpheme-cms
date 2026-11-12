import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIST_KINDS, STYLE_KINDS, TEXT_KINDS, headingKindOf, listKindOf, styleKindOf } from './styleKind.mjs';

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

// The "More" sheet and the top toolbar draw each style's icon from one table (KIND_ICONS in MarkdownEditor.tsx), so a style
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
    assert.match(
      source,
      new RegExp(`icon: KIND_ICONS\\.${name}\\.node, action: \\(\\) => setKind\\('${name}'\\)`),
      `the top toolbar draws ${name} from the table`,
    );
  }
});

// One order everywhere: the body styles from small to large, then Label and the quote, then the lists (the sheet, the top toolbar's
// menu, STYLE_KINDS and KIND_ICONS).
test('every list of the text styles is in the order of STYLE_KINDS', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  const order = (re) => [...source.matchAll(re)].map((m) => m[1]);
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
  // Steps of 32 on the grid, never a scaled-down glyph: the smallest is still more than half of the largest.
  assert.ok(tall.small / tall.large > 0.5 && tall.large - tall.medium === tall.medium - tall.small, 'three even steps');
});

// Two controls, Text style and List, each with its own general icon and a label that names the current choice.
test('Text style and List are two buttons that name their choice', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  assert.match(source, /list: \{ raw: bulletIcon, node: ListBullets \}/, 'the list button shows the bullet list icon');
  assert.match(source, /<SheetGroupTitle>\{title\}<\/SheetGroupTitle>/, 'the More sheet names Text style and List');
  assert.match(source, /\[t\.text\.list, all\.filter/, 'the More sheet has the lists');
  assert.match(source, /group === 'list'\s*\? \[GENERIC_ICONS\.list\.node, t\.text\.list, t\.text\.listIs\]/, 'the top toolbar: "List: …"');
  for (const locale of ['en-US', 'da-DK']) {
    const text = readFileSync(new URL(`./i18n/${locale}/text.ts`, import.meta.url), 'utf8');
    assert.match(text, /\n  list: '/);
    assert.match(text, /\n  listIs: /);
  }
  assert.match(readFileSync(new URL('./i18n/en-US/text.ts', import.meta.url), 'utf8'), /listIs: \(kind: string\) => `List: \$\{kind\}`/);
});

// Every style of STYLE_KINDS can be picked in both places and is named there: the top toolbar's tools (all) have its icon and a label, and the menus and the More sheet are made from that tools list.
test('every style has an icon and a label in the toolbar, which the More sheet lists', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  for (const name of STYLE_KINDS) {
    assert.match(
      source,
      new RegExp(`label: t\\.text\\.\\w+, icon: KIND_ICONS\\.${name}\\.node, action: \\(\\) => setKind\\('${name}'\\), on: '${name}'`),
      `the toolbar has no tool with icon and label for ${name}`,
    );
  }
  assert.match(source, /TEXT_KINDS_IN_SHEET\.includes/, 'the More sheet lists the text styles from the tools');
  assert.match(source, /kinds\(button, 'headings'\)/, 'the floating heading button opens the menu');
});

test('the heading button shows a level only while a heading is on, else its generic icon', () => {
  for (const level of ['h1', 'h2', 'h3']) assert.equal(headingKindOf([level, 'strong'], true), level);
  for (const kind of [...TEXT_KINDS, ...LIST_KINDS]) assert.equal(headingKindOf([kind], true), 'generic');
  assert.equal(headingKindOf([], true), 'generic');
  assert.equal(headingKindOf(['h2'], false), 'generic');
});

test('the generic icons are the general T and H, and the bullet list, of Phosphor', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  assert.match(source, /text: \{ raw: textTIcon, node: TextT \}/);
  assert.match(source, /heading: \{ raw: textHIcon, node: TextHPlainIcon \}/);
  assert.match(source, /list: \{ raw: bulletIcon, node: ListBullets \}/);
});

// The alignment button (lib/text-align.mjs) is in both the floating row's More sheet and the top toolbar, with Phosphor's three alignment icons.
test('the alignment has a choice in the More sheet and a button in the toolbar', () => {
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  assert.match(source, /left: \{ raw: alignLeftIcon, node: TextAlignLeft \}/);
  assert.match(source, /center: \{ raw: alignCenterIcon, node: TextAlignCenter \}/);
  assert.match(source, /right: \{ raw: alignRightIcon, node: TextAlignRight \}/);
  assert.match(source, /<SheetChoice\s+key=\{align\}/, 'the More sheet');
  assert.match(source, /role: 'align'/, 'the top toolbar');
});

// Every toolbar icon is drawn at the same size and stroke: the T icons of the three body styles (src/icons/text-t-*.svg) are Phosphor's
// regular weight (16 on the 256 grid, round ends, one baseline) like Bold and Italic, never a thinner or a scaled-down glyph, and each
// button draws its icon at one size.
test('the T icons have the same weight and size as Bold and Italic', () => {
  for (const size of ['small', 'medium', 'large']) {
    const svg = readFileSync(new URL(`./icons/text-t-${size}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /viewBox="0 0 256 256"/, size);
    assert.match(svg, /fill="currentColor"/, size);
    assert.doesNotMatch(svg, /transform|stroke/, `${size}: no scaled glyph`);
    const rects = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" rx="(\d+)"\/>/g)].map((m) =>
      m.slice(1).map(Number),
    );
    assert.equal(rects.length, 2, `${size}: a bar and a stem`);
    const [[, barY, barWidth, barHeight, barR], [, stemY, stemWidth, stemHeight, stemR]] = rects;
    assert.deepEqual([barHeight, stemWidth, barR, stemR], [16, 16, 8, 8], `${size}: Phosphor's regular stroke`);
    assert.equal(stemY + stemHeight, 216, `${size}: the baseline of Phosphor's T`);
    assert.equal(barY, stemY, `${size}: the bar is the top of the stem`);
    assert.ok(stemHeight >= 112 && barWidth >= 80, `${size}: not a scaled-down glyph`);
  }
  const phosphor = (name) =>
    readFileSync(new URL(`../node_modules/@phosphor-icons/core/assets/regular/${name}.svg`, import.meta.url), 'utf8');
  for (const name of ['text-b', 'text-italic', 'text-t']) assert.match(phosphor(name), /viewBox="0 0 256 256" fill="currentColor"/);
  const source = readFileSync(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');
  assert.equal(source.match(/replace\('<svg', '<svg width="(\d+)" height="(\d+)"/g)?.[0], `replace('<svg', '<svg width="20" height="20"`);
  assert.match(readFileSync(new URL('./TextSizeIcons.tsx', import.meta.url), 'utf8'), /size = 20/);
});
