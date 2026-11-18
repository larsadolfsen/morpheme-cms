// Tests for scripts/screens/support/areas.mjs: the map from changed paths to the screens areas, and the core set.
// Run: node --test scripts/screens-areas.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { AREAS, CORE_UNITS, RULES, areasArg, screensSelection } from './screens/support/areas.mjs';
import { ruleFor } from '../lib/affected.mjs';

const dir = new URL('./screens/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.mjs'));

test('AREAS is exactly the area files of scripts/screens/', () => {
  assert.deepEqual([...AREAS].sort(), files.map((f) => f.replace(/\.mjs$/, '')).sort());
});

test('every area named by a rule exists', () => {
  for (const [re, what] of RULES)
    if (Array.isArray(what)) for (const a of what) assert.ok(AREAS.includes(a) || BLOCK_NAMES.has(a), `${re}: ${a}`);
});
const BLOCK_NAMES = new Set(AREAS);

test('every core unit exists in an area file', () => {
  const source = files.map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
  const registered = {
    'screens 390': /unit\(`screens \$\{width\}`/,
    'screens 1280': /unit\(`screens \$\{width\}`/,
    'key states': /unit\('key states'/,
    checkSaveKeyNoAutosave: /unit\('checkSaveKeyNoAutosave'/,
    'checkSpacingGrid 375': /unit\('checkSpacingGrid 375'/,
    'checkSpacingGrid 1280': /unit\('checkSpacingGrid 1280'/,
  };
  assert.deepEqual(Object.keys(registered).sort(), [...CORE_UNITS].sort(), 'a new core unit needs its line here');
  for (const [name, re] of Object.entries(registered)) assert.match(source, re, name);
});

test('every tracked path has an explicit rule (a new folder or file needs a decision)', () => {
  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean);
  if (tracked.length === 0) return; // not a git checkout
  const missing = tracked.filter((p) => !ruleFor(p, RULES));
  assert.deepEqual(missing.slice(0, 10), [], 'add a rule to RULES in scripts/screens/support/areas.mjs');
});

test('every top-level source folder maps to an area list, none or all', () => {
  const tops = [
    'src',
    'theme',
    'lib',
    'pages',
    'worker',
    'bin',
    'site',
    'defaults',
    'demo',
    'starter',
    'scripts',
    'icons',
    'release-notes',
  ];
  for (const t of tops) {
    const rule = ruleFor(`${t}/x`, RULES);
    assert.ok(rule, t);
    assert.ok(rule[1] === 'all' || rule[1] === 'none' || Array.isArray(rule[1]), t);
  }
});

test('an unknown path, an empty diff and the workflow affect everything', () => {
  assert.equal(areasArg(['brand-new-folder/x.js']), 'all');
  assert.equal(areasArg([]), 'all');
  assert.equal(areasArg(['src/store.ts', 'docs/a.md']), 'all');
  assert.equal(areasArg(['.github/workflows/check.yml']), 'all');
  assert.equal(areasArg(['scripts/ci-changes.mjs']), 'all');
  assert.equal(areasArg(['scripts/screens/support/shared.mjs']), 'all');
  assert.equal(areasArg(['scripts/editor-screens.mjs']), 'all');
  assert.equal(areasArg(['src/../src/Library.tsx']), 'all');
});

test('narrow changes name their area and its neighbours', () => {
  assert.equal(areasArg(['src/Library.tsx']), 'files,sheets');
  assert.equal(areasArg(['src/InlineTable.tsx']), 'inline-blocks,tables');
  assert.equal(areasArg(['scripts/screens/cards.mjs']), 'cards');
  assert.equal(areasArg(['src/DashboardGrid.tsx', 'src/Library.tsx']), 'files,sheets,start-screens');
  assert.deepEqual(screensSelection(['theme/blocks/list/View.tsx']).areas.includes('lists'), true);
  assert.equal(areasArg(['demo/src/content/pages/typography.md']), 'type');
});

test('a change that no screens unit reads runs the core set only', () => {
  assert.equal(areasArg(['worker/index.js']), 'none');
  assert.equal(areasArg(['docs/a.md', '.changeset/a.md']), 'none');
  assert.equal(areasArg(['src/store.test.mjs']), 'none');
  assert.equal(areasArg(['scripts/check-language.mjs']), 'none');
});

test('shared parts of the editor and the theme run everything', () => {
  for (const p of [
    'src/ui.tsx',
    'src/editor.css',
    'src/store.ts',
    'src/fields.tsx',
    'src/i18n/da-DK/x.json',
    'theme/styles/ui.css',
    'theme/ui/button.css',
    'lib/blocks.mjs',
    'package.json',
    'defaults/texts.ts',
  ])
    assert.equal(areasArg([p]), 'all', p);
});
