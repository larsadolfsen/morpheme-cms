import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  compare,
  declaredOnRoot,
  evaluate,
  judge,
  judgeOurs,
  loadM3,
  resolveVars,
  themeName,
  tokenFiles,
  unmapped,
} from './check-m3-tokens.mjs';
import { RENAMES } from './m3-tokens.renames.mjs';
import { ours } from './m3-tokens.ours.mjs';
import { readFileSync } from 'node:fs';
import { allow } from './m3-tokens.allow.mjs';

const roles = new Set(['primary', 'secondary-container', 'surface']);
const steps = new Set(['small', 'full']);
const m3 = (list) => new Map(list.map((t) => [t.token, t]));
const color = (token, role) => ({ token, type: 'COLOR', chain: [token, `md.sys.color.${role}`], ref: `md.sys.color.${role}` });
const length = (token, value) => ({ token, type: 'LENGTH', chain: [token], ref: null, value });

test('a token on :root is read, a scoped one and a media block are not', () => {
  const map = declaredOnRoot([
    `:root { --mo-comp-a-b: 1rem; }
     :where(:root) { --mo-comp-c: 2px; }
     @layer base { :root { --mo-comp-d: 3px; } }
     .x { --mo-comp-e: 4px; }
     :root, .mo-text-section > * { --mo-comp-f: 5px; }
     @media (min-width: 600px) { :root { --mo-comp-g: 6px; } }`,
  ]);
  assert.deepEqual([...map.keys()], ['--mo-comp-a-b', '--mo-comp-c', '--mo-comp-d', '--mo-comp-f']);
});

test('names map from M3 to the theme', () => {
  assert.equal(themeName('md.comp.search-bar.container.color'), '--mo-comp-search-bar-container-color');
  assert.equal(themeName('md.sys.color.on-surface'), '--mo-sys-color-on-surface');
  // The Expressive pairs: the theme's navigation bar is the flexible nav-bar; the baseline navigation-bar keeps its own plain name (the theme declares none).
  assert.equal(themeName('md.comp.nav-bar.container.height'), '--mo-comp-nav-bar-container-height');
  assert.ok(themeName('md.comp.navigation-bar.container.height').startsWith('--mo-comp-navigation-bar-'));
});

test('var() and calc() resolve, a role and a step stay markers, density is the declared base', () => {
  const map = declaredOnRoot([
    ':root { --a: var(--b); --b: calc(2.5rem + var(--mo-sys-density-base) * 4px); --mo-sys-density-base: 0; --c: var(--nope, 8px); }',
  ]);
  assert.equal(evaluate(resolveVars('var(--a)', map, roles, steps)).n, 40);
  assert.equal(resolveVars('var(--c)', map, roles, steps), '8px');
  assert.equal(resolveVars('var(--mo-sys-color-primary)', map, roles, steps), '@role:primary');
  assert.equal(resolveVars('var(--mo-sys-shape-corner-small)', map, roles, steps), '@shape:small');
  assert.equal(resolveVars('var(--nope)', map, roles, steps), null);
  assert.equal(evaluate('12vw'), null);
});

test('a colour compares by its role, a measure by its size', () => {
  const data = m3([color('md.comp.x.container.color', 'secondary-container'), length('md.comp.x.container.height', 56)]);
  const sys = (n, r) => ({ token: `md.sys.color.${n}`, type: 'COLOR', chain: [`md.sys.color.${n}`], ref: null });
  for (const r of roles) data.set(`md.sys.color.${r}`, sys(r));
  const same = declaredOnRoot([
    ':root { --mo-comp-x-container-color: var(--mo-sys-color-secondary-container); --mo-comp-x-container-height: 3.5rem; }',
  ]);
  assert.deepEqual(compare(same, data), []);
  const other = declaredOnRoot([':root { --mo-comp-x-container-color: var(--mo-sys-color-surface); --mo-comp-x-container-height: 40px; }']);
  assert.deepEqual(
    compare(other, data).map((f) => [f.token, f.theme, f.m3]),
    [
      ['--mo-comp-x-container-color', '@role:surface', '@role:secondary-container'],
      ['--mo-comp-x-container-height', '40', '56'],
    ],
  );
});

test('a difference not on the list, and an entry that no longer differs, both fail', () => {
  const found = [{ token: '--mo-comp-a', kind: 'size', theme: '40', m3: '56', m3Token: 'md.comp.a' }];
  const entry = { token: '--mo-comp-a', theme: '40', m3: '56', class: 'fix', batch: 7, reason: 'r' };
  assert.deepEqual(judge(found, [entry]), []);
  assert.equal(judge(found, []).length, 1);
  assert.equal(judge([], [entry]).length, 1);
  assert.equal(judge(found, [{ ...entry, theme: '48' }]).length, 1);
  assert.equal(judge(found, [{ ...entry, class: 'fix', batch: undefined }]).length, 1);
  assert.equal(judge(found, [{ ...entry, class: 'later' }]).length, 1);
});

test('the theme today differs from Material 3 exactly as the allowlist says', () => {
  const map = declaredOnRoot(tokenFiles().map((f) => readFileSync(f, 'utf8')));
  assert.deepEqual(judge(compare(map, loadM3()), allow), []);
});

test('a token the rename map maps is compared with its M3 token, and a wrong value fails', () => {
  const data = m3([length('md.comp.button.small.leading-space', 16), length('md.comp.button.small.trailing-space', 16)]);
  const renames = { '--mo-comp-button-pad': ['md.comp.button.small.leading-space', 'md.comp.button.small.trailing-space'] };
  const stats = { compared: new Set() };
  assert.deepEqual(compare(declaredOnRoot([':root { --mo-comp-button-pad: 1rem; }']), data, stats, renames), []);
  assert.deepEqual([...stats.compared], ['--mo-comp-button-pad']);
  // 24 dp against M3's 16: one difference, not two (leading and trailing are the same value).
  const wrong = compare(declaredOnRoot([':root { --mo-comp-button-pad: 1.5rem; }']), data, {}, renames);
  assert.deepEqual(
    wrong.map((f) => [f.token, f.theme, f.m3]),
    [['--mo-comp-button-pad', '24', '16']],
  );
  // Without the map the same token is never compared (what batch A closes).
  assert.deepEqual(compare(declaredOnRoot([':root { --mo-comp-button-pad: 1.5rem; }']), data, {}, {}), []);
});

test('a --mo-comp token that maps to no M3 token and is not named as ours fails; so does a stale entry', () => {
  const data = m3([length('md.comp.x.container.height', 56)]);
  const map = declaredOnRoot([':root { --mo-comp-x-container-height: 3.5rem; --mo-comp-x-gap: 1rem; --mo-comp-y-size: 2rem; }']);
  assert.deepEqual(unmapped(map, data, {}), ['--mo-comp-x-gap', '--mo-comp-y-size']);
  assert.equal(judgeOurs(map, data, [{ token: '--mo-comp-x-gap', reason: 'r' }], {}).length, 1); // --mo-comp-y-size is not named
  assert.deepEqual(
    judgeOurs(
      map,
      data,
      [
        { token: '--mo-comp-x-gap', reason: 'r' },
        { token: '--mo-comp-y-size', reason: 'r' },
      ],
      {},
    ),
    [],
  );
  // Named as ours but it maps now (by name), and one no longer declared, and one without a reason.
  assert.equal(judgeOurs(map, data, [{ token: '--mo-comp-x-container-height', reason: 'r' }], {}).length, 3);
  assert.equal(judgeOurs(map, data, [{ token: '--mo-comp-gone', reason: 'r' }], {}).length, 3);
  assert.equal(judgeOurs(map, data, [{ token: '--mo-comp-x-gap' }], {}).length, 2);
  // A rename to a token M3 does not have.
  assert.equal(judgeOurs(map, data, [], { '--mo-comp-x-gap': ['md.comp.nope'] }).length, 3);
});

test('a [Deprecated] token and a palette tone are compared where the theme declares them', () => {
  const tone = {
    token: 'md.comp.d.scrim.color',
    type: 'COLOR',
    chain: ['md.comp.d.scrim.color', 'md.ref.palette.neutral-variant20'],
    ref: 'md.ref.palette.neutral-variant20',
    deprecated: true,
  };
  const opacity = {
    token: 'md.comp.d.scrim.opacity',
    type: 'OPACITY',
    chain: ['md.comp.d.scrim.opacity'],
    ref: null,
    value: 0.4,
    deprecated: true,
  };
  const data = m3([tone, opacity]);
  const same = declaredOnRoot([
    ':root { --mo-comp-d-scrim-color: var(--mo-ref-palette-neutral-variant20); --mo-comp-d-scrim-opacity: 0.4; }',
  ]);
  assert.deepEqual(compare(same, data), []); // the tone has no stylesheet declaration: its name is its value
  const other = declaredOnRoot([':root { --mo-comp-d-scrim-color: var(--mo-ref-palette-neutral20); --mo-comp-d-scrim-opacity: 0.5; }']);
  assert.deepEqual(
    compare(other, data).map((f) => [f.token, f.theme, f.m3]),
    [
      ['--mo-comp-d-scrim-color', '@ref:neutral20', '@ref:neutral-variant20'],
      ['--mo-comp-d-scrim-opacity', '0.5', '0.4'],
    ],
  );
  assert.deepEqual(compare(declaredOnRoot([':root { --other: 1; }']), data), []); // not declared: not compared, not missing
});

test('the theme today: every --mo-comp token is compared or ours, and every rename target is an M3 token', () => {
  const map = declaredOnRoot(tokenFiles().map((f) => readFileSync(f, 'utf8')));
  assert.deepEqual(judgeOurs(map, loadM3(), ours), []);
  for (const [theme, targets] of Object.entries(RENAMES)) assert.ok(map.has(theme), `${theme} is in the rename map but not declared`);
});

test('every allowlist entry is a class the plan names', () => {
  for (const e of allow) assert.ok(['deviation', 'editor', 'wcag', 'fix'].includes(e.class), e.token);
});

test('an elevation level shadow token is the level in dp (md.sys.elevation.levelN)', () => {
  const map = new Map();
  const roles = new Set();
  const steps = new Set();
  assert.equal(resolveVars('var(--mo-sys-elevation-level2-shadow)', map, roles, steps), '3px');
  assert.equal(resolveVars('var(--mo-sys-elevation-level1-rest-shadow)', map, roles, steps), '1px');
  assert.equal(resolveVars('var(--mo-sys-elevation-level5-shadow)', map, roles, steps), '12px');
});
