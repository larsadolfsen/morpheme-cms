import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  classifyClasses,
  classifyTokens,
  componentOf,
  declaredTokens,
  formatReport,
  inList,
  loadM3Names,
  plainName,
  selectorClasses,
  sourceFiles,
  staleOurs,
} from './check-m3-names.mjs';
import { ours } from './m3-names.ours.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const map = JSON.parse(readFileSync(new URL('./m3-names.json', import.meta.url), 'utf8'));
const m3 = loadM3Names();

test('plainName: M3 dots become dashes under --mo-', () => {
  assert.equal(plainName('md.comp.search-bar.container.color'), '--mo-comp-search-bar-container-color');
});

test('declaredTokens reads declarations, not uses', () => {
  const d = declaredTokens({ 'a.css': ':root { --mo-sys-color-primary: red; color: var(--mo-sys-color-secondary); }' });
  assert.deepEqual([...d.keys()], ['--mo-sys-color-primary']);
});

test('selectorClasses reads selectors of stylesheets only, not comments', () => {
  const c = selectorClasses({ 'a.css': '/* .mo-gone */ .mo-fab.mo-is-large:hover, .mo-card {}', 'b.tsx': 'className="mo-code"' });
  assert.deepEqual([...c.keys()].sort(), ['mo-card', 'mo-fab', 'mo-is-large']);
});

test('componentOf and inList', () => {
  assert.equal(componentOf('mo-search-bar__label'), 'search-bar');
  assert.ok(inList('--mo-ref-space-100', [{ token: '--mo-ref-space-*' }], 'token'));
  assert.ok(!inList('--mo-ref-spaces', [{ token: '--mo-ref-space' }], 'token'));
});

test('classifyTokens sorts M3, renamed, ours, editor and unknown names', () => {
  const fake = { tokens: new Set(['--mo-sys-color-primary']) };
  const r = classifyTokens(
    ['--mo-sys-color-primary', '--mo-comp-a', '--mo-comp-editor-x', '--mo-comp-b', '--mo-comp-c'],
    fake,
    { tokens: { '--mo-comp-a': '--mo-comp-z' } },
    { tokens: [{ token: '--mo-comp-b' }] },
  );
  assert.deepEqual(r, {
    m3: ['--mo-sys-color-primary'],
    renamed: ['--mo-comp-a'],
    ours: ['--mo-comp-b'],
    editor: ['--mo-comp-editor-x'],
    unknown: ['--mo-comp-c'],
  });
});

test('classifyClasses sorts M3, renamed, ours, block, editor, state and unknown classes', () => {
  const r = classifyClasses(
    ['mo-menu__item', 'mo-old', 'mo-footer__about', 'mo-block-hero', 'mo-editor-bar', 'mo-is-open', 'mo-mystery', 'mo-filled-card-x'],
    { sets: new Set(['menu']) },
    { classes: { 'mo-old': 'mo-new' } },
    { classes: [{ class: 'mo-footer' }] },
  );
  assert.deepEqual(r.unknown, ['mo-filled-card-x', 'mo-mystery']);
  assert.equal(r.m3.length + r.renamed.length + r.ours.length + r.block.length + r.editor.length + r.state.length, 6);
});

test('staleOurs lists an ours entry M3 has a token for', () => {
  assert.deepEqual(staleOurs({ tokens: new Set(['--mo-comp-a']) }, { tokens: [{ token: '--mo-comp-a' }, { token: '--mo-comp-b*' }] }), [
    '--mo-comp-a',
  ]);
});

test('the map: every rename names a different, non-empty name and the parts are there', () => {
  for (const part of ['tokens', 'classes', 'props']) assert.equal(typeof map[part], 'object', part);
  assert.ok(Array.isArray(map.reused) && Array.isArray(map.valueFixes) && !('open' in map));
  for (const [old, now] of Object.entries(map.tokens)) {
    for (const n of [].concat(now)) assert.ok(n.startsWith('--mo-') && n !== old, `${old} → ${n}`);
  }
  for (const [old, now] of Object.entries(map.classes)) {
    for (const n of [].concat(now ?? [])) assert.ok(n.startsWith('mo-') && n !== old, `${old} → ${n}`);
  }
  assert.equal(map.props.Button.size.medium, 'small');
});

test('every token the map renames to is an M3 name, or an own part of an M3 set or system group, or a block token', () => {
  const sets = [...m3.sets].map((x) => `--mo-comp-${x}-`);
  const groups = [...new Set([...m3.tokens].filter((t) => t.startsWith('--mo-sys-')).map((t) => `--mo-sys-${t.split('-')[4]}-`))];
  const bad = Object.values(map.tokens)
    .flat()
    .filter(
      (n) =>
        !m3.tokens.has(n) &&
        !n.startsWith('--mo-comp-block-') &&
        !sets.some((s) => n.startsWith(s)) &&
        !groups.some((g) => n.startsWith(g)),
    );
  assert.deepEqual(bad, []);
});

test('valueFixes name an M3 token and say what is wrong; the answered open questions are gone', () => {
  assert.ok(map.valueFixes.length > 0);
  for (const f of map.valueFixes) {
    assert.ok(f.component && f.size && f.ours && f.m3 && f.token.startsWith('md.comp.'), JSON.stringify(f));
  }
  assert.equal(map.open, undefined);
});

test('every kind written as a part maps to mo-is-<kind>', () => {
  assert.equal(map.classes['mo-icon-button__standard'], 'mo-is-standard');
  assert.equal(map.classes['mo-fab__primary-container'], 'mo-is-primary-container');
  assert.equal(map.classes['mo-button__xlarge'], 'mo-is-xlarge');
  assert.equal(map.props.Fab.size.fab, null);
});

test('the ours list has a reason for each entry and none M3 now names', () => {
  for (const e of [...ours.tokens, ...ours.classes]) assert.ok(e.reason.length > 5, JSON.stringify(e));
  assert.deepEqual(staleOurs(m3, ours), []);
});

test('the repository has no token or class that is neither M3, renamed, ours nor the editor', () => {
  const texts = Object.fromEntries(sourceFiles(root).map((f) => [relative(root, f), readFileSync(f, 'utf8')]));
  const t = classifyTokens(declaredTokens(texts).keys(), m3, map, ours);
  const c = classifyClasses(selectorClasses(texts).keys(), m3, map, ours);
  assert.deepEqual(t.unknown, []);
  assert.deepEqual(c.unknown, []);
  assert.match(formatReport({ tokens: t, classes: c, map, ours, stale: [] }), /Tokens \(\d+\)/);
});
