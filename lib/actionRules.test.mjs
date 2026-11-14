// Tests lib/actionRules.mjs: folding, ranking, the context filter, groups, shortcuts, places, one icon per meaning and recent actions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ariaKeyShortcuts,
  clearRecent,
  contextGroupsOf,
  emptyQuerySections,
  foldText,
  formatShortcut,
  iconProblems,
  isBrowserShortcut,
  matchAction,
  matchesShortcut,
  orderGroups,
  paletteState,
  parseShortcut,
  placeProblems,
  pushRecent,
  rankActions,
  readRecent,
  recentShown,
  RESULT_CAP,
  scoreAction,
  shortcutConflicts,
} from './actionRules.mjs';

// Danish letters by code point, so no Danish text stands in code (check:language).
const AE = String.fromCharCode(0xe6);
const AE_CAP = String.fromCharCode(0xc6);
const OE = String.fromCharCode(0xf8);
const AA = String.fromCharCode(0xe5);
const E_ACUTE = String.fromCharCode(0xe9);

const a = (id, label, group = 'text', more = {}) => ({ id, label, group, ...more });
const ids = (ranked) => ranked.map((r) => r.entry.id);

test('foldText lowers case, drops accents and spells the Danish letters plainly', () => {
  assert.equal(foldText(`  Caf${E_ACUTE}  Bold `), 'cafe bold');
  assert.equal(foldText(`${AE_CAP}ble`), 'aeble');
  assert.equal(foldText(`S${OE}g`), 'sog');
  assert.equal(foldText(`Bl${AA}`), 'bla');
});

test('a query with Danish letters finds the plain spelling and the other way round', () => {
  const entry = a('x', `Tilf${OE}j r${AE}kke`);
  assert.equal(matchAction(entry, 'tilfoj raekke'), true);
  assert.equal(matchAction(a('y', 'Tilfoj raekke'), `tilf${OE}j r${AE}kke`), true);
});

test('every word of the query must match something', () => {
  const entry = a('text.bold', 'Bold', 'text', { words: ['strong'] });
  assert.equal(matchAction(entry, 'bold strong'), true);
  assert.equal(matchAction(entry, 'bold italic'), false);
  assert.equal(matchAction(entry, 'formatting bold', 'Formatting'), true, 'the group name counts');
  assert.equal(matchAction(a('go.cache', 'Caching and builds', 'go', { path: 'Settings' }), 'settings caching'), true, 'the path counts');
});

test('exact beats prefix beats a word inside the label beats the other words beats letters in order', () => {
  assert.equal(scoreAction(a('1', 'Bold'), 'bold'), 100);
  assert.equal(scoreAction(a('2', 'Bold text'), 'bold'), 80);
  assert.equal(scoreAction(a('3', 'Make bold'), 'bold'), 60);
  assert.equal(scoreAction(a('4', 'Move row up'), 'mov up'), 50);
  assert.equal(scoreAction(a('5', 'Strong', 'text', { words: ['bold'] }), 'bold'), 30);
  assert.equal(scoreAction(a('6', 'Bold'), 'bld'), 20);
  assert.equal(scoreAction(a('7', 'Bold'), 'bd'), null, 'letters in order count only from three letters');
});

test('a word match in the middle of a label is found', () => {
  const ranked = rankActions([a('go.files', 'Deleted files', 'go'), a('go.home', 'Home', 'go')], 'files');
  assert.deepEqual(ids(ranked), ['go.files']);
});

test('rankActions orders by score, then actions before pages, then the registry order', () => {
  const entries = [
    a('page', 'Bold ideas', 'pages', { kind: 'page' }),
    a('fuzzy', 'Build', 'go'),
    a('prefix', 'Bold ideas', 'text'),
    a('exact', 'Bold', 'text'),
    a('exact2', 'Bold', 'block'),
  ];
  assert.deepEqual(ids(rankActions(entries, 'bold')), ['exact', 'exact2', 'prefix', 'page']);
});

test('the current context adds 15', () => {
  const entries = [a('table.align', 'Align left', 'table'), a('text.align', 'Align left', 'text')];
  assert.deepEqual(ids(rankActions(entries, 'align left')), ['table.align', 'text.align']);
  assert.deepEqual(ids(rankActions(entries, 'align left', { context: ['text'] })), ['text.align', 'table.align']);
});

test('the last five run add 10 and how often adds up to 5', () => {
  const entries = [a('one', 'Heading one'), a('two', 'Heading two')];
  assert.deepEqual(ids(rankActions(entries, 'heading', { recent: ['two'] })), ['two', 'one']);
  const r = rankActions(entries, 'heading', { counts: { one: 99 } });
  assert.deepEqual(ids(r), ['one', 'two']);
  assert.equal(r[0].score, 85, 'the use count adds at most 5');
  const old = ['x1', 'x2', 'x3', 'x4', 'x5', 'two'];
  assert.deepEqual(ids(rankActions(entries, 'heading', { recent: old })), ['one', 'two'], 'only the last five count');
});

test('at most 30 results, and ties keep the registry order', () => {
  const many = Array.from({ length: 50 }, (_, i) => a(`go.${i}`, `Go to place ${i}`, 'go'));
  const ranked = rankActions(many, 'go');
  assert.equal(ranked.length, RESULT_CAP);
  assert.deepEqual(ids(ranked).slice(0, 3), ['go.0', 'go.1', 'go.2']);
});

test('contextGroupsOf lists what is active in the palette order', () => {
  assert.deepEqual(contextGroupsOf({ table: true, text: true, block: true }), ['text', 'block', 'table']);
  assert.deepEqual(contextGroupsOf({}), []);
});

test('paletteState: hidden never, disabled only in the current context, other contexts left out', () => {
  assert.equal(paletteState('hidden', 'go', []), 'left-out');
  assert.equal(paletteState('enabled', 'go', []), 'shown');
  assert.equal(paletteState('disabled', 'text', ['text']), 'disabled');
  assert.equal(paletteState('disabled', 'page', ['text']), 'left-out');
  assert.equal(paletteState('enabled', 'table', ['text']), 'left-out', 'table actions with the cursor in a paragraph are noise');
  assert.equal(paletteState('enabled', 'table', ['text', 'table']), 'shown');
});

test('orderGroups puts the context first, then Insert, Page, Go to, Pages and posts, Settings, Apps; empty groups go', () => {
  const ranked = rankActions(
    [
      a('app', 'Open app', 'app'),
      a('go', 'Open files', 'go'),
      a('pages', 'Open about', 'pages', { kind: 'page' }),
      a('ins', 'Open insert', 'insert'),
      a('blk', 'Open block', 'block'),
      a('txt', 'Open text', 'text'),
    ],
    'open',
  );
  assert.deepEqual(
    orderGroups(ranked, ['block']).map((g) => g.group),
    ['block', 'text', 'insert', 'go', 'pages', 'app'],
  );
});

test('before typing: a block first shows its actions, then Recent; otherwise Recent first', () => {
  const suggested = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
  const recent = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
  const withBlock = emptyQuerySections({ blockActive: true, suggested, recent });
  assert.deepEqual(
    withBlock.map((s) => s.section),
    ['suggested', 'recent'],
  );
  assert.equal(withBlock[0].items.length, 6);
  assert.equal(withBlock[1].items.length, 5);
  assert.deepEqual(
    emptyQuerySections({ blockActive: false, suggested, recent }).map((s) => s.section),
    ['recent', 'suggested'],
  );
  assert.deepEqual(
    emptyQuerySections({ blockActive: false, suggested, recent: [] }).map((s) => s.section),
    ['suggested'],
  );
});

test('parseShortcut reads modifiers and the key', () => {
  assert.deepEqual(parseShortcut('Mod+k'), { mod: true, shift: false, alt: false, ctrl: false, key: 'K' });
  assert.deepEqual(parseShortcut('Mod+Shift+Z'), { mod: true, shift: true, alt: false, ctrl: false, key: 'Z' });
  assert.equal(parseShortcut('Esc').key, 'Escape');
  assert.throws(() => parseShortcut('Hyper+K'));
});

test('formatShortcut on a Mac and elsewhere', () => {
  assert.equal(formatShortcut('Mod+K', true), '⌘K');
  assert.equal(formatShortcut('Mod+K', false), 'Ctrl+K');
  assert.equal(formatShortcut('Mod+Shift+Z', true), '⇧⌘Z');
  assert.equal(formatShortcut('Mod+Shift+Z', false), 'Ctrl+Shift+Z');
  assert.equal(formatShortcut('Alt+Shift+1', false), 'Alt+Shift+1');
  assert.equal(formatShortcut('Ctrl+Tab', true), '⌃Tab');
});

test('ariaKeyShortcuts uses the WAI-ARIA names', () => {
  assert.equal(ariaKeyShortcuts('Mod+K', true), 'Meta+K');
  assert.equal(ariaKeyShortcuts('Mod+K', false), 'Control+K');
  assert.equal(ariaKeyShortcuts('Mod+Shift+Z', false), 'Control+Shift+Z');
});

test('matchesShortcut: Mod is the Command key on a Mac and Ctrl elsewhere; extra keys do not match', () => {
  const ev = (key, m = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...m });
  assert.equal(matchesShortcut(ev('k', { metaKey: true }), 'Mod+K', true), true);
  assert.equal(matchesShortcut(ev('k', { ctrlKey: true }), 'Mod+K', true), false);
  assert.equal(matchesShortcut(ev('k', { ctrlKey: true }), 'Mod+K', false), true);
  assert.equal(matchesShortcut(ev('K', { ctrlKey: true, shiftKey: true }), 'Mod+K', false), false);
  assert.equal(matchesShortcut(ev('k'), 'Mod+K', false), false);
});

test('a key the browser keeps is reported', () => {
  assert.equal(isBrowserShortcut('Mod+T'), true);
  assert.equal(isBrowserShortcut('mod+w'), true);
  assert.equal(isBrowserShortcut('F5'), true);
  assert.equal(isBrowserShortcut('Ctrl+Tab'), true);
  assert.equal(isBrowserShortcut('Mod+K'), false);
  assert.deepEqual(shortcutConflicts([a('bad', 'New tab', 'go', { shortcut: { key: 'Mod+N' } })]), ['bad: the browser keeps Mod+N']);
});

test('two actions with one key conflict in overlapping scopes only', () => {
  const palette = a('palette.open', 'Search', 'go', { shortcut: { key: 'Mod+K' } });
  const link = a('text.link', 'Link', 'text', { shortcut: { key: 'mod+k' } });
  assert.equal(shortcutConflicts([palette, link]).length, 1, 'a global key overlaps every scope');
  const textBold = a('text.bold', 'Bold', 'text', { shortcut: { key: 'Mod+B' } });
  const tableB = a('table.b', 'Bottom', 'table', { shortcut: { key: 'Mod+B' } });
  assert.deepEqual(shortcutConflicts([textBold, tableB]), [], 'two contexts do not overlap');
  const textB2 = a('text.b2', 'Bolder', 'text', { shortcut: { key: 'Mod+B' } });
  assert.deepEqual(shortcutConflicts([textBold, textB2]), ['text.bold and text.b2 share Mod+B']);
});

test('an action is in at most one of the bar, the ⋮ and the row', () => {
  assert.equal(placeProblems({ id: 'ok', where: { bar: { order: 1 }, palette: true } }), null);
  assert.equal(placeProblems({ id: 'ok2', where: {} }), null);
  assert.match(placeProblems({ id: 'block.settings', where: { more: {}, row: {} } }) ?? '', /more and row/);
});

test('one icon per meaning: tune, settings and edit', () => {
  const good = [
    { id: 'block.settings', icon: 'tune', meaning: 'settings-here' },
    { id: 'section.settings', icon: 'tune', meaning: 'settings-here' },
    { id: 'go.settings', icon: 'settings', meaning: 'settings-editor' },
    { id: 'app.settings', icon: 'settings', meaning: 'settings-app' },
    { id: 'block.edit-list', icon: 'edit', meaning: 'edit-elsewhere' },
    { id: 'text.bold', icon: 'format_bold' },
  ];
  assert.deepEqual(iconProblems(good), []);
});

test('one icon per meaning: each mismatch is reported', () => {
  assert.equal(iconProblems([{ id: 'block.settings', icon: 'edit', meaning: 'settings-here' }]).length, 2, 'a pencil for settings');
  assert.equal(
    iconProblems([{ id: 'section.settings', icon: 'settings', meaning: 'settings-here' }]).length,
    2,
    'a gear for settings here',
  );
  assert.deepEqual(iconProblems([{ id: 'text.style', icon: 'settings' }]), [
    "text.style draws settings (the gear), which is only for the editor's Settings and an app's Settings tab",
  ]);
  assert.match(
    iconProblems([
      { id: 'one', icon: 'pencil', meaning: 'browse' },
      { id: 'two', icon: 'open_in_new', meaning: 'browse' },
    ])[0],
    /both mean browse/,
  );
});

test('recent: newest first, once, at most 8 kept and 5 shown, counts follow', () => {
  let s = clearRecent();
  for (const id of ['a', 'b', 'c', 'a']) s = pushRecent(s, id);
  assert.deepEqual(s.ids, ['a', 'c', 'b']);
  assert.equal(s.counts.a, 2);
  for (const id of ['d', 'e', 'f', 'g', 'h', 'i', 'j']) s = pushRecent(s, id);
  assert.equal(s.ids.length, 8);
  assert.equal(s.counts.b, undefined, 'a dropped id loses its count');
  assert.deepEqual(
    recentShown(s, () => true),
    ['j', 'i', 'h', 'g', 'f'],
  );
});

test('recent: an id whose target is gone is not shown', () => {
  const s = pushRecent(pushRecent(clearRecent(), 'go.page:/old'), 'go.files');
  assert.deepEqual(
    recentShown(s, (id) => id !== 'go.page:/old'),
    ['go.files'],
  );
});

test('readRecent turns a broken stored value into an empty one', () => {
  assert.deepEqual(readRecent(null), { ids: [], counts: {} });
  assert.deepEqual(readRecent({ ids: ['a', 3], counts: { a: 2, b: 'x', c: -1 } }), { ids: ['a'], counts: { a: 2 } });
});
