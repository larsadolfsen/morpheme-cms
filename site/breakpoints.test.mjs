// Tests of the breakpoint check (breakpoints.mjs): which hand-written widths lineProblems flags and which lines it lets be.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineProblems } from './breakpoints.mjs';

const flagged = [
  '@media (min-width: 48rem) {',
  '@media (max-width:640px) and (hover: hover) {',
  "const wide = matchMedia('(min-width: 48rem)').matches;",
  "useMedia('(min-width: 80rem)')",
  'sizes="(min-width: 640px) 50vw, 100vw"',
  "matchMedia('(width >= 48rem)')",
  '@media (width < 600px) {',
  '@media (width <= 40rem) {',
  '@media (width > 40rem) {',
  '@media (40rem <= width) {',
  '<div class="min-[700px]:flex">',
  '<div class="max-[700px]:hidden">',
  '<div class="md:flex">',
  '<div class="max-lg:hidden">',
];
const fine = [
  '@container (width >= 34rem) {',
  '@container navigation-bar (min-width: 37.5rem) {',
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
