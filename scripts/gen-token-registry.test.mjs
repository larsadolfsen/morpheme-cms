import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fits, ORIGINS, registry, registryCss, relative, typeOf } from './gen-token-registry.mjs';

test('a default has the type its value says, and a length is written in px', () => {
  assert.deepEqual(typeOf('#435e91'), { syntax: '<color>', value: '#435e91' });
  assert.deepEqual(typeOf('color-mix(in srgb, #ffffff 8%, #435e91)'), {
    syntax: '<color>',
    value: 'color-mix(in srgb, #ffffff 8%, #435e91)',
  });
  assert.deepEqual(typeOf('0.75rem'), { syntax: '<length>', value: '12px' });
  assert.deepEqual(typeOf('-0.015625rem'), { syntax: '<length>', value: '-0.25px' });
  assert.deepEqual(typeOf('240ms'), { syntax: '<time>', value: '240ms' });
  assert.deepEqual(typeOf('12'), { syntax: '<number>', value: '12' });
});

test('a bare 0, a list, a keyword and a font are not registered', () => {
  for (const v of ['0', '0 0 #0000', 'none', 'auto', '"Roboto", sans-serif', 'cubic-bezier(0.2, 0, 0, 1)', '60ch'])
    assert.equal(typeOf(v), null, v);
});

test('a declaration fits when the syntax accepts it or the browser decides', () => {
  assert.equal(fits('<length>', '1rem'), true);
  assert.equal(fits('<length>', 'var(--x)'), true);
  assert.equal(fits('<length>', 'calc(1rem + 2px)'), true);
  assert.equal(fits('<length>', 'inherit'), true);
  assert.equal(fits('<length>', 'auto'), false);
  assert.equal(fits('<length>', '1.5'), false);
  assert.equal(fits('<color>', '#fff'), true);
});

test('a font-relative or context-relative value is not registered', () => {
  for (const v of ['1.5em', '50%', '100vw', '2ch', 'currentColor']) assert.equal(relative(v), true, v);
  for (const v of ['1.5rem', '24px', '#fff']) assert.equal(relative(v), false, v);
});

test('the registry file has one @property with a syntax, inherits and an initial value', () => {
  const css = registryCss([{ name: '--mo-sys-x', syntax: '<length>', value: '4px' }]);
  assert.match(css, /@property --mo-sys-x \{\n {2}syntax: '<length>';\n {2}inherits: true;\n {2}initial-value: 4px;\n\}/);
});

test('the committed registry files are the ones the tokens give, each name once, none with a var() or a rem', async () => {
  const byOrigin = await registry();
  const seen = new Set();
  for (const o of ORIGINS) {
    const rows = byOrigin[o];
    if (rows.length === 0) continue;
    const text = readFileSync(new URL(`../theme/styles/tokens/${o}/registry.css`, import.meta.url), 'utf8').replace(/\s+/g, ' ');
    for (const r of rows) {
      assert.ok(!seen.has(r.name), `${r.name} is registered twice`);
      seen.add(r.name);
      assert.ok(!/var\(|\drem\b|\dem\b/.test(r.value), `${r.name}: initial-value ${r.value} must be a literal in px, not font-relative`);
      assert.ok(
        text.includes(`@property ${r.name} { syntax: '${r.syntax}'; inherits: true; initial-value: ${r.value}; }`),
        `${r.name} is missing or stale in ${o}/registry.css: run node scripts/gen-token-registry.mjs`,
      );
    }
  }
  assert.ok(seen.has('--mo-sys-color-primary'), 'the colour roles are registered');
});
