// Tests of check:color-roles (scripts/check-color-roles.mjs): what is a finding, what is not, and how the allowlist compares.
// Run: node --test scripts/check-color-roles.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { SECTION_ROLES, compare, findings, inScope, sectionKind } from './check-color-roles.mjs';

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

test('section-roles: a role in a section scope is the M3 pair for that kind of section', () => {
  const allRoles = new Set(['surface', 'on-surface', 'on-surface-variant', 'outline', 'primary', 'on-primary', 'primary-container']);
  const rules = (css) => findings('theme/styles/x.css', css, allRoles).map((f) => f.rule);
  const ok =
    ":where(.mo-text-section).mo-is-primary > *, .mo-editor-text .ProseMirror > [data-section-color='primary'] { --mo-sys-color-surface: var(--mo-sys-color-primary-container); --mo-sys-color-on-surface: var(--mo-sys-color-on-primary-container); }";
  assert.deepEqual(rules(ok), []);
  assert.deepEqual(rules(ok.replace('on-primary-container', 'on-secondary-container')), ['section-roles']);
  assert.deepEqual(rules(ok.replace('--mo-sys-color-primary-container', '--mo-sys-section-accent')), ['section-roles']);
  assert.deepEqual(rules('.mo-text-section.mo-is-tertiary > * { --mo-sys-color-surface: var(--mo-sys-color-primary-container); }'), [
    'section-roles',
  ]);
  assert.deepEqual(rules('.mo-text-section.mo-is-primary > * { --mo-sys-color-outline: var(--mo-sys-color-outline-variant); }'), [
    'section-roles',
  ]);
  // a rule that is no section's scope is free (the role-redeclare rule still applies)
  assert.deepEqual(rules('.mo-card { --mo-sys-color-surface: var(--mo-sys-color-primary-container); }'), []);
  // the big head of the token files names every kind: no role may be declared there
  assert.deepEqual(
    rules(
      ':is(:where(.mo-text-section).mo-is-primary, :where(.mo-text-section).mo-is-secondary) > * { --mo-sys-color-surface: var(--mo-sys-color-primary-container); }',
    ),
    ['section-roles'],
  );
  assert.equal(sectionKind(':where(.mo-text-section).mo-has-image:not(:where(.mo-text-section).mo-is-surface) > *'), 'image');
  assert.equal(sectionKind(".mo-editor-text .ProseMirror > [data-section-color='tertiary']"), 'tertiary');
});

test('SECTION_ROLES names only roles of M3 and pairs of a container with its on-colour', () => {
  const m3 = new Set(
    JSON.parse(readFileSync(new URL('../docs/m3-tokens/md.sys.color.json', import.meta.url), 'utf8')).tokens.map((t) =>
      t.token.replace('md.sys.color.', ''),
    ),
  );
  for (const [kind, map] of Object.entries(SECTION_ROLES))
    for (const [role, to] of Object.entries(map)) {
      assert.ok(m3.has(role), `${kind}: ${role} is an M3 role`);
      assert.ok(m3.has(to), `${kind}: ${to} is an M3 role`);
    }
  for (const c of ['primary', 'secondary', 'tertiary']) {
    assert.equal(SECTION_ROLES[c].surface, `${c}-container`);
    assert.equal(SECTION_ROLES[c]['on-surface'], `on-${c}-container`);
  }
});
