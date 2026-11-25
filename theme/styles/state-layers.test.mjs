// Checks M3's state opacities (m3.material.io/foundations/interaction/states/state-layers, token set "State opacities"): the five tokens
// exist with M3's numbers, the layer colours are made from them, and no component file writes a state number of its own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const files = readdirSync(root, { recursive: true })
  .filter((f) => f.endsWith('.css') && !/registry\.css$|tokens\/type\/|tokens\/(ui|material)\/ref\.css$/.test(f))
  .map((f) => [f, readFileSync(join(root, f), 'utf8')]);
const all = (re) => files.flatMap(([f, t]) => [...t.matchAll(re)].map((m) => `${f}: ${m[0]}`));
const uiRef = readFileSync(join(root, 'tokens/ui/ref.css'), 'utf8');

const opacities = { hover: 0.08, focus: 0.1, pressed: 0.1, dragged: 0.16, disabled: 0.38 };
for (const [state, value] of Object.entries(opacities)) {
  test(`--mo-sys-state-${state}-state-layer-opacity is ${value}`, () => {
    assert.ok(uiRef.includes(`--mo-sys-state-${state}-state-layer-opacity: ${value};`));
  });
}

test('the hover and pressed layer colours are made from the opacities', () => {
  const sys = readFileSync(join(root, 'tokens/material/sys.css'), 'utf8');
  assert.match(sys, /--mo-sys-state-hover-state-layer-color: color-mix\([^;]*--mo-sys-state-hover-state-layer-opacity/);
  assert.match(sys, /--mo-sys-state-pressed-state-layer-color: color-mix\([^;]*--mo-sys-state-pressed-state-layer-opacity/);
});

test('no component file writes a state-layer percentage in a colour mix of a content colour', () => {
  // The list's segmented disabled container (0.1 of on surface) is the list's own value, not one of the five (Lists specs).
  const found = all(
    /color-mix\(in srgb, (?:currentColor|var\(--mo-(?:comp-block-text|comp-block-accent|sys-color-(?:on-[a-z-]+|primary|inverse-primary|inverse-on-surface)))\)?\s+(?:8|10|16|38)%/g,
  );
  assert.deepEqual(
    found.filter((l) => !l.startsWith('tokens/material/comp/list.css')),
    [],
  );
});

test('no component file writes 0.38 as a disabled opacity', () => {
  assert.deepEqual(all(/opacity[a-z-]*:\s*0?\.38/g), []);
});
