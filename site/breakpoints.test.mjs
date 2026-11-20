// Tests of the breakpoint check (breakpoints.mjs): which hand-written widths lineProblems flags and which lines it lets be.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineProblems, ALLOWED } from './breakpoints.mjs';

const flagged = [
  '@media (min-width: 48rem) {',
  '@media (max-width:640px) and (hover: hover) {',
  '@media (width >= 38rem) {',
  '@media (width <= 599.98px) {',
  '@container (width >= 34rem) {',
  '@container (min-width: 20rem) {',
  "const wide = matchMedia('(min-width: 48rem)').matches;",
  "useMedia('(min-width: 80rem)')",
  'sizes="(min-width: 640px) 50vw, 100vw"',
  "matchMedia('(width >= 48rem)')",
  '@media (width <= 40rem) {',
  '@media (width > 40rem) {',
  '@media (40rem <= width) {',
  '<div class="min-[700px]:flex">',
  '<div class="max-[700px]:hidden">',
  '<div class="md:flex">',
  '<div class="max-lg:hidden">',
];
const fine = [
  '@container navigation-bar (min-width: 37.5rem) {',
  '@container card (width >= 34rem) {',
  '@container sidebar (min-width: 12rem) {',
  '@media (min-width: 37.5rem) {',
  '@media (width >= 52.5rem) {',
  '@media (width < 75rem) {',
  '@media (max-width: 100rem) {',
  '@media (min-width: 600px) {',
  '@media (min-width: 840px) and (max-width: 1199px) {'.replace('1199px', '1200px'),
  '@media (width >= 1600px) {',
  '@media (40rem <= width) {'.replace('40rem', '37.5rem'),
  'if (!(width > 0) || n > 3) return false;',
  '@media (max-height: 30rem) {',
  '@media (prefers-reduced-motion: reduce) {',
  '@media print {',
  '@media (hover: hover) {',
  'sizes={`(min-width: ${BREAKPOINTS.expanded}px) 50vw, 100vw`}',
  "matchMedia(atLeast('medium'))",
  '<div class="min-h-[10rem] min-w-0 medium:flex">',
  '<div class="max-w-[20rem] expanded:grid">',
];

for (const line of flagged) test(`flags ${line}`, () => assert.ok(lineProblems(line).length > 0));
for (const line of fine) test(`lets ${line} be`, () => assert.deepEqual(lineProblems(line), []));

test('the three allowed widths of today have a reason', () => {
  for (const a of ALLOWED.slice(0, 3)) assert.ok(a.why.length > 10, a.text);
});
