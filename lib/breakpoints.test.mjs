// Tests lib/breakpoints.mjs (Material 3's breakpoints for scripts) and that the theme's CSS has the same ones
// (--breakpoint-* in theme/styles/base.css). Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BREAKPOINTS, atLeast, breakpointOf } from './breakpoints.mjs';

test('the breakpoints are Material 3’s', () => {
  assert.deepEqual(BREAKPOINTS, { compact: 0, medium: 600, expanded: 840, large: 1200, extraLarge: 1600 });
});

test('atLeast gives the media query in rem, as the CSS writes it', () => {
  assert.equal(atLeast('medium'), '(width >= 37.5rem)');
  assert.equal(atLeast('extraLarge'), '(width >= 100rem)');
});

test('breakpointOf gives the breakpoint a window is in', () => {
  assert.equal(breakpointOf(0), 'compact');
  assert.equal(breakpointOf(599), 'compact');
  assert.equal(breakpointOf(600), 'medium');
  assert.equal(breakpointOf(839), 'medium');
  assert.equal(breakpointOf(840), 'expanded');
  assert.equal(breakpointOf(1199), 'expanded');
  assert.equal(breakpointOf(1200), 'large');
  assert.equal(breakpointOf(1600), 'extraLarge');
  assert.equal(breakpointOf(3840), 'extraLarge');
});

test('the theme’s CSS has the same breakpoints', () => {
  const css = readFileSync(new URL('../theme/styles/base.css', import.meta.url), 'utf8');
  const inCss = Object.fromEntries(
    [...css.matchAll(/--breakpoint-([a-z-]+):\s*([\d.]+)rem/g)].map(([, name, rem]) => [
      name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
      Number(rem) * 16,
    ]),
  );
  const { compact, ...rest } = BREAKPOINTS;
  assert.deepEqual(inCss, rest);
});
