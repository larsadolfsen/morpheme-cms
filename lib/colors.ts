// The site's colours as data, in the site's file of colours (config.colors, e.g. src/data/colors.json):
// one set for light mode and one for dark, each a CSS variable by its name without "--":
//   { "light": { "bg": "#f6f4f1", "accent": "#a3345a", … }, "dark": { … } }
// and, when they are made from one source colour (dynamic colour, dynamic-colors.ts), the choice they were
// made from: "dynamic": { "source": "#a3345a", "harmony": "analogous", "contrast": "standard" } (or a "variant" instead
// of the "harmony", as one written before the harmonies has). (When each page takes
// its colours from its picture, content-based colour, that is an app's: packages/editor/site/pageColors.ts.)
// The site writes them into the <head> of its pages (colorsCss), so its CSS, Tailwind and the blocks
// take them from there; the editor shows and changes them under "Colors" (Colors.tsx) and checks that
// text can be read on its background (contrast). No React or browser here: the build uses it too.

import type { Dynamic } from './dynamic-colors';

export type ColorSet = Record<string, string>;
export type Colors = { light: ColorSet; dark: ColorSet; dynamic?: Dynamic };
export const MODES = ['light', 'dark'] as const;
export type Mode = (typeof MODES)[number];

const HEX = /^#[0-9a-f]{6}$/i;
const NAME = /^[a-z][a-z0-9-]*$/;

/** Whether a value is a colour as the file has it: # and six hex digits. */
export const isColor = (value: unknown): value is string => typeof value === 'string' && HEX.test(value);

/** What is wrong with the content of a file of colours, a line for each ('dark.accent: "red"'), or []:
 * a mode or one of `names` missing, or a value that is not a colour. */
export function colorProblems(value: unknown, names: string[]): string[] {
  const colors = (value ?? {}) as Partial<Record<Mode, unknown>>;
  return MODES.flatMap((mode) => {
    const set = (colors[mode] ?? {}) as Record<string, unknown>;
    return names.filter((name) => !isColor(set[name])).map((name) => `${mode}.${name}: ${JSON.stringify(set[name] ?? null)}`);
  });
}

/** The names a file of colors had before its colors were Material 3's color roles, in the order to change them (the cards' `surface` goes before `bg` takes its name), and the role each is now (null:
 * Material has no such role, the file loses it). `bg` is the page, now Surface, and the cards' `surface` is now Surface
 * container lowest; `surface-default` is the old name of the page, `tint` is Surface container high and `accent-hover` is
 * drawn as a state layer. */
const OLD_NAMES: [string, string | null][] = [
  ['surface', 'surface-container-lowest'],
  ['bg', 'surface'],
  ['surface-default', null],
  ['tint', 'surface-container-high'],
  ['ink', 'on-surface'],
  ['muted', 'on-surface-variant'],
  ['line', 'outline-variant'],
  ['accent', 'primary'],
  ['accent-hover', null],
  ['on-accent', 'on-primary'],
  ['accent-container', 'primary-container'],
  ['on-accent-container', 'on-primary-container'],
];

/** The old names a file of colors still has, with the new name of each (null: delete it; also when the file has the new
 * one already), per mode, in the order of the mapping. `surface` is the old cards' color only beside `bg`. It reads the file
 * as it is and changes nothing. */
export function oldColorNames(value: unknown): { mode: Mode; from: string; to: string | null }[] {
  const colors = (value && typeof value === 'object' ? value : {}) as Partial<Record<Mode, unknown>>;
  return MODES.flatMap((mode) => {
    const set = colors[mode];
    if (!set || typeof set !== 'object' || Array.isArray(set)) return [];
    const has = (name: string) => Object.hasOwn(set, name);
    return OLD_NAMES.filter(([from]) => has(from) && (from !== 'surface' || has('bg'))).map(([from, to]) => ({
      mode,
      from,
      // The new name is free once the old one has gone (`bg` becomes Surface when the cards' `surface` is renamed).
      to: to !== null && has(to) && to !== 'surface' ? null : to,
    }));
  });
}

// One mode's colours as CSS declarations. Only names and values that cannot be anything but a colour,
// since the CSS goes straight into the page.
function declarations(set: ColorSet): string {
  return Object.entries(set)
    .map(([name, value]) => {
      if (!NAME.test(name) || !isColor(value)) throw new Error(`Not a colour: ${name}: ${JSON.stringify(value)}`);
      return `--mo-${name}:${value};`;
    })
    .join('');
}

/** The colour of the editor's page in a mode: Surface, as everywhere on the site (Material 3's page colour). */
export const pageColor = (set: ColorSet): string => set.surface;

/** The colours as CSS for a <style> in the <head>: light mode on :root; dark mode when the phone or
 * computer is set to it (unless light is picked, data-theme="light" on <html>) and when dark is picked.
 * Throws on anything that is not a colour, so a broken file never reaches a page. */
export function colorsCss(colors: Colors): string {
  const dark = declarations(colors.dark);
  return (
    `:root{${declarations(colors.light)}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme='light']){${dark}}}` +
    `:root[data-theme='dark']{${dark}}`
  );
}

// A colour's relative luminance (WCAG 2).
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast between two colours (WCAG 2), from 1 (the same) to 21 (black on white). Normal text
 * needs at least 4.5 (AA). */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** A pair of colours that must be readable: `text` on `on`, at least `min` (4.5 when left out), and
 * what it is in the site's words ("Text on buttons"). */
export type ColorPair = { text: string; on: string; what: string; min?: number };

/** The pairs in a mode that are too hard to read, with their contrast. */
export function lowContrast(set: ColorSet, pairs: ColorPair[]): (ColorPair & { ratio: number; min: number })[] {
  return pairs.flatMap((pair) => {
    if (!isColor(set[pair.text]) || !isColor(set[pair.on])) return [];
    const ratio = contrast(set[pair.text], set[pair.on]);
    const min = pair.min ?? 4.5;
    return ratio < min ? [{ ...pair, ratio, min }] : [];
  });
}
