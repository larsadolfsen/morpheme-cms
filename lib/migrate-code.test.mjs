import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { compareVersions } from './cms-version.mjs';
import { oldNamesIn } from '../scripts/check-token-names.mjs';
import { siteProblems } from '../scripts/check-mo-names.mjs';
import {
  CodeMigrationStop,
  MIGRATIONS_FILE,
  crossesCode,
  hasRun,
  migrateCode,
  ownFiles,
  tokenMap,
  unmarked,
  unsafeLines,
} from './migrate-code.mjs';
import maps from './migrate-code-maps.mjs';

// A made-up site (no customer content): its own theme and app written with old names of contract 6 (a custom property that was `--badge-…`), contract 7 (classes
// without `mo-`) and 7 to 8 (Material 3's names), and a store app, whose copy is never rewritten.
const STORE_CSS = '.mo-button__text { color: var(--mo-density-user); }\n';
const site = () => [
  { path: 'src/themes/mine/theme.json', text: '{ "api": 7 }\n' },
  {
    path: 'src/themes/mine/styles.css',
    text: [
      '.block-cards { gap: var(--badge-padding); }',
      '.button-filled { padding: var(--mo-density-user); }',
      '.mo-button__text:hover { color: red; }',
      '.mo-bottom-sheet__container { margin: 0; }',
      '/* the .mo-button__xsmall row */',
      '.mo-button__xsmall { display: flex; }',
      '',
    ].join('\n'),
  },
  {
    path: 'src/apps/mine/app.json',
    text: JSON.stringify({ api: 7, label: 'Mine', icon: 'list-numbers', version: '1.0.0' }, null, 2) + '\n',
  },
  {
    path: 'src/apps/mine/blocks/tickets/View.tsx',
    text: [
      "import { Button } from '@theme/ui/Button';",
      "import Fab from '@theme/ui/Fab';",
      'export function View() {',
      '  return (',
      '    <div className="block-cards mo-button__text">',
      '      <Button size="medium" kind="tonal">Buy</Button>',
      '      <Button size="small">Cancel</Button>',
      '      <Fab size="fab" label="Add" />',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n'),
  },
  { path: 'src/apps/app_0123456789abcdef/store.json', text: '{ "version": "1.0.0" }\n' },
  { path: 'src/apps/app_0123456789abcdef/app.json', text: JSON.stringify({ api: 7, icon: 'list-numbers' }) },
  { path: 'src/apps/app_0123456789abcdef/styles.css', text: STORE_CSS },
];
const textOf = (changes, path) => changes.find((c) => c.path === path)?.text;

test('a site on 0.16 gets every map in one run, and its own theme and app are rewritten', () => {
  const changes = migrateCode({ files: site(), from: '0.16.0' });
  const css = textOf(changes, 'src/themes/mine/styles.css');
  assert.match(css, /\.mo-block-cards \{ gap: var\(--mo-comp-badge-padding\); \}/);
  assert.match(css, /:where\(\.mo-button\)\.mo-is-text:hover/);
  assert.match(css, /:where\(\.mo-sheet__container\)\.mo-is-bottom \{ margin: 0; \}/);
  assert.match(css, /:where\(\.mo-button\)\.mo-is-xsmall \{ display: flex; \}/);
  assert.match(css, /\/\* the \.mo-button\.mo-is-xsmall row \*\//);
  assert.match(css, /var\(--mo-sys-density-user\)/);
  const view = textOf(changes, 'src/apps/mine/blocks/tickets/View.tsx');
  assert.match(view, /className="mo-block-cards mo-is-text"/);
  assert.match(view, /<Button size="small" kind="tonal">Buy<\/Button>/);
  assert.match(view, /<Button>Cancel<\/Button>/);
  assert.match(view, /<Fab label="Add" \/>/);
  assert.equal(textOf(changes, 'src/apps/mine/app.json').includes('"icon": "format_list_numbered"'), true);
  assert.equal(hasRun(textOf(changes, MIGRATIONS_FILE)), true);
});

test('the store app is left alone', () => {
  const changes = migrateCode({ files: site(), from: '0.16.0' });
  assert.deepEqual(
    changes.map((c) => c.path).filter((p) => p.includes('app_0123456789abcdef')),
    [],
  );
  assert.deepEqual(
    ownFiles(site().map((f) => f.path)).filter((p) => p.includes('app_')),
    [],
  );
});

test('the rewritten site has no old names left and builds', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'migrate-code-'));
  try {
    for (const { path, text } of migrateCode({ files: site(), from: '0.16.0' })) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    const css = site().find((f) => f.path.endsWith('styles.css'));
    assert.deepEqual(
      oldNamesIn(textOf(migrateCode({ files: site(), from: '0.16.0' }), css.path), { ...maps.tokens6, ...maps.tokens7 }),
      [],
    );
    assert.deepEqual(siteProblems(dir), []);
    // The TSX and the CSS still parse (esbuild throws on a syntax error).
    const { transform } = await import('esbuild');
    const done = migrateCode({ files: site(), from: '0.16.0' });
    await transform(textOf(done, 'src/apps/mine/blocks/tickets/View.tsx'), { loader: 'tsx' });
    await transform(textOf(done, css.path), { loader: 'css' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a site from 0.19.5 does not get contract 7 names rewritten', () => {
  const files = [
    { path: 'src/themes/mine/a.css', text: '.avatar { color: var(--mo-comp-button-xsmall-padding-x, red); }\n.mo-button__text {}\n' },
  ];
  const css = textOf(migrateCode({ files, from: '0.19.5' }), 'src/themes/mine/a.css');
  assert.match(css, /^\.avatar \{/);
  assert.match(css, /:where\(\.mo-button\)\.mo-is-text/);
});

test('a reused name does not chain', () => {
  // `size="medium"` becomes small and `size="small"` goes: the new small is never read as an old one.
  const files = [
    {
      path: 'src/apps/mine/View.tsx',
      text: "import { Button } from '@theme/ui/Button';\nexport const a = (\n  <>\n    <Button size=\"medium\" />\n    <Button size={'small'} />\n  </>\n);\n",
    },
  ];
  const out = textOf(migrateCode({ files, from: '0.19.5' }), 'src/apps/mine/View.tsx');
  assert.match(out, /<Button size="small" \/>/);
  assert.match(out, /<Button \/>/);
  assert.doesNotMatch(out, /size=\{/);
  // A custom property that became another's old name: one pass, so it takes the map's value and stops.
  const radius = '--mo-comp-search-view-radius';
  const docked = '--mo-comp-search-view-docked-container-shape';
  const css = textOf(
    migrateCode({ files: [{ path: 'src/themes/mine/a.css', text: `a { b: var(${radius}); c: var(${docked}); }\n` }], from: '0.19.5' }),
    'src/themes/mine/a.css',
  );
  assert.equal(css, `a { b: var(${maps.m3.tokens[radius]}); c: var(${tokenMap('0.19.5')[docked]}); }\n`);
  assert.notEqual(maps.m3.tokens[radius], tokenMap('0.19.5')[docked]);
});

test('a second run is refused', () => {
  const first = migrateCode({ files: site(), from: '0.19.5' });
  const marker = textOf(first, MIGRATIONS_FILE);
  assert.throws(
    () => migrateCode({ files: site(), marker, from: '0.19.5' }),
    (e) => e instanceof CodeMigrationStop && e.reason === 'already',
  );
  assert.equal(unmarked(marker), null);
});

test('every unsafe form is listed by file and line, and nothing changes', () => {
  const files = [
    {
      path: 'src/apps/mine/View.tsx',
      text: [
        "import { Button } from '@theme/ui/Button';",
        'export const a = (big) => (',
        "  <Button size={big ? 'large' : 'medium'}>Buy</Button>", // 3: a computed value
        ');',
        'export const b = (kind) => `mo-button__${kind}`;', // 5: a name built from parts
        'export const c = <div className="flex px-4 mo-button__small" />;', // 6: Tailwind, and a name the map drops
        "export const d = { '--mo-comp-button-xsmall-padding': 1 };", // 7: one token became several
        '',
      ].join('\n'),
    },
    { path: 'src/themes/mine/a.css', text: '.x {\n  @apply flex;\n  padding: var(--mo-comp-button-padding);\n}\n' },
  ];
  assert.throws(
    () =>
      migrateCode({
        files,
        from: '0.19.5',
        utilityProblems: (file, text) =>
          file.endsWith('.tsx') && text.includes('px-4')
            ? [
                `${file}:6: Tailwind is gone (contract 7): \`flex\` is a utility. Write plain CSS and mo- classes (docs/tailwind-migration.md).`,
              ]
            : [],
      }),
    (e) => {
      assert.ok(e instanceof CodeMigrationStop && e.reason === 'unsafe');
      const lines = unsafeLines(e.list).join('\n');
      assert.match(lines, /View\.tsx:3: <Button> size is a computed value/);
      assert.match(lines, /View\.tsx:5: .*built from parts/);
      assert.match(lines, /View\.tsx:6: .*utility/);
      assert.match(lines, /View\.tsx:6: .*mo-button__small is dropped by the map/);
      assert.match(lines, /View\.tsx:7: --mo-comp-button-xsmall-padding became several tokens/);
      assert.match(lines, /a\.css:2: Tailwind \(@apply\)/);
      assert.match(lines, /a\.css:3: --mo-comp-button-padding became several tokens/);
      return true;
    },
  );
});

test('the update crosses 0.19.6 only from below it', () => {
  assert.equal(crossesCode('0.19.5', '0.19.6', compareVersions), true);
  assert.equal(crossesCode('0.16.0', '0.20.0', compareVersions), true);
  assert.equal(crossesCode('0.19.6', '0.20.0', compareVersions), false);
  assert.equal(crossesCode('0.19.4', '0.19.5', compareVersions), false);
});

// The one item API of Card and ListItem (docs/superpowers/specs/2026-11-24-card-list-item-api.md): a prop's name changes, the rewrite runs once with the rest.
const itemFile = (body, imports = "import { ListItem } from '@theme/ui/List';") => [
  { path: 'src/apps/mine/app.json', text: '{ "api": 7 }\n' },
  { path: 'src/apps/mine/blocks/rows/View.tsx', text: `${imports}\nexport const View = () => (\n  <ul>\n${body}\n  </ul>\n);\n` },
];
const rewritten = (body, imports) =>
  migrateCode({ files: itemFile(body, imports), from: '0.19.5' }).find((c) => c.path.endsWith('View.tsx'))?.text;
const stops = (body, imports) => {
  try {
    migrateCode({ files: itemFile(body, imports), from: '0.19.5' });
  } catch (error) {
    assert.ok(error instanceof CodeMigrationStop);
    return error.list;
  }
  assert.fail('the rewrite should have stopped');
};

test('ListItem: columns is dropped as a bare attribute or a literal, and stops when it is computed', () => {
  const text = rewritten(
    '    <ListItem href="/" columns headline="a" />\n    <ListItem columns={true} headline="b" />\n    <ListItem headline="c" columns={false} />',
  );
  assert.match(text, /<ListItem href="\/" headline="a" \/>/);
  assert.match(text, /<ListItem headline="b" \/>/);
  assert.match(text, /<ListItem headline="c" \/>/);
  assert.doesNotMatch(text, /columns/);
  const list = stops('    <ListItem columns={wide} headline="a" />');
  assert.match(list[0].why, /columns is removed and its value is computed/);
});

test('ListItem: an alias is read, the leading and trailing names stay, and a spread stops only in a file that writes `columns`', () => {
  const aliased = rewritten('    <Row leadingIcon="check" columns headline="a" />', "import { ListItem as Row } from '@theme/ui/List';");
  assert.match(aliased, /<Row leadingIcon="check" headline="a" \/>/);
  assert.equal(
    rewritten('    <ListItem leadingIcon="check" leadingVideo={clip} trailingIcon="x" {...row} headline="a" />'),
    undefined,
    "Material's names are not touched",
  );
  const list = stops('    <ListItem {...row} headline="a" />\n    <p>{JSON.stringify({ columns: true })}</p>');
  assert.match(list[0].why, /spread/);
  assert.equal(list[0].line, 4);
});

test('ListItem: other components with a `columns` prop are left alone', () => {
  const text = rewritten(
    '    <Grid columns />\n    <ListItem headline="a" columns />',
    "import Grid from '@theme/ui/Grid';\nimport { ListItem } from '@theme/ui/List';",
  );
  assert.match(text, /<Grid columns \/>/);
  assert.match(text, /<ListItem headline="a" \/>/);
});

test('the dropped class of a list item with columns is listed by file and line', () => {
  const files = [
    { path: 'src/themes/mine/theme.json', text: '{ "api": 7 }\n' },
    { path: 'src/themes/mine/styles.css', text: '.mo-list__item-columns { gap: 0; }\n' },
  ];
  try {
    migrateCode({ files, from: '0.19.5' });
    assert.fail('the rewrite should have stopped');
  } catch (error) {
    assert.ok(error instanceof CodeMigrationStop);
    assert.equal(error.list[0].path, 'src/themes/mine/styles.css');
    assert.equal(error.list[0].line, 1);
    assert.match(error.list[0].why, /mo-list__item-columns is dropped/);
  }
});
