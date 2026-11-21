// Tests of check:color-roles (scripts/check-color-roles.mjs): what is a finding, what is not, and how the allowlist compares.
// Run: node --test scripts/check-color-roles.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { compare, findings, inScope } from './check-color-roles.mjs';

const roles = new Set(['primary', 'on-primary', 'outline', 'surface-container', 'on-surface']);
const rules = (css, file = 'theme/styles/x.css') => findings(file, css, roles).map((f) => f.rule);

test('a mix of a role with a bare percentage is a finding', () => {
  assert.deepEqual(rules('a { background: color-mix(in srgb, var(--mo-sys-color-primary) 22%, transparent); }'), ['mix']);
});

test('a state layer (its percentage is a state-layer token) is not a finding, over transparent or another colour', () => {
  const s = 'calc(var(--mo-sys-state-hover-state-layer-opacity) * 100%)';
  assert.deepEqual(rules(`a { background: color-mix(in srgb, currentColor ${s}, transparent); }`), []);
  assert.deepEqual(rules(`a { background: color-mix(in srgb, var(--mo-sys-color-on-primary) ${s}, var(--mo-sys-color-primary)); }`), []);
});

test('a shadow is not a finding: a shadow property, the elevation files, the scrim token', () => {
  assert.deepEqual(rules('a { box-shadow: 0 1px 2px color-mix(in srgb, var(--mo-sys-color-shadow) 30%, transparent); }'), []);
  assert.deepEqual(
    rules('a { --mo-x: color-mix(in srgb, var(--mo-sys-color-shadow) 30%, transparent); }', 'theme/styles/tokens/ui/ref.css'),
    [],
  );
  assert.deepEqual(rules(':root { --mo-sys-color-scrim-overlay: color-mix(in srgb, var(--mo-sys-color-scrim) 32%, transparent); }'), []);
});

test('a role declared as another variable passes; declared as a mix or a value it is one finding, counted once', () => {
  assert.deepEqual(rules('a { --mo-sys-color-outline: var(--mo-sys-section-on-accent); }'), []);
  assert.deepEqual(rules('a { --mo-sys-color-outline: var(--a, var(--b)); }'), []);
  assert.deepEqual(rules('a { --mo-sys-color-outline: color-mix(in srgb, var(--a) 35%, transparent); }'), ['role-redeclare']);
  assert.deepEqual(rules('a { --mo-sys-color-surface-container: #fff; }'), ['role-redeclare']);
});

test('a role redeclared over several lines and a mix in a comment', () => {
  assert.deepEqual(rules('a {\n  --mo-sys-color-outline:\n    color-mix(\n      in srgb, var(--a) 5%, transparent);\n}'), [
    'role-redeclare',
  ]);
  assert.deepEqual(rules('/* color-mix(in srgb, red 5%, transparent) */ a { color: red; }'), []);
});

test('the scope is the theme styles, src css and tsx, never a test', () => {
  assert.deepEqual(
    inScope(['theme/styles/a.css', 'src/editor.css', 'src/ui.tsx', 'src/sub/x.css', 'theme/styles/elevation.test.mjs', 'scripts/a.css']),
    ['theme/styles/a.css', 'src/editor.css', 'src/ui.tsx'],
  );
});

test('the allowlist: new, more, fewer and stale entries all fail; an exact count passes', () => {
  const entry = { file: 'a.css', rule: 'mix', max: 2, why: 'to fix' };
  assert.deepEqual(compare({ 'a.css|mix': 2 }, [entry]), []);
  assert.equal(compare({ 'b.css|mix': 1 }, []).length, 1);
  assert.equal(compare({ 'a.css|mix': 3 }, [entry]).length, 1);
  assert.equal(compare({ 'a.css|mix': 1 }, [entry]).length, 1);
  assert.equal(compare({}, [entry]).length, 1);
  assert.ok(compare({ 'a.css|mix': 2 }, [{ ...entry, why: '' }]).length >= 1);
});
