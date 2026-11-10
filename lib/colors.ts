// The site's colours as data, in the site's file of colours (config.colors, e.g. src/data/colors.json):
// one set for light mode and one for dark, each a CSS variable by its name without "--":
//   { "light": { "bg": "#f6f4f1", "accent": "#a3345a", … }, "dark": { … } }
// and, when they are made from one source colour (dynamic colour, dynamic-colors.ts), the choice they were
// made from: "dynamic": { "source": "#a3345a", "harmony": "analogous", "contrast": "standard" } (or a "variant" instead
// of the "harmony", as one written before the harmonies has). (When each page takes
// its colours from its picture, content-based colour, that is an app's: packages/editor/site/pageColors.ts.)
// The site writes them into the <head> of its pages (colorsCss), so its CSS, Tailwind and the blocks
// take them from there; the editor shows and changes them under "Farver" (Colors.tsx) and checks that
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

/** What is wrong with the content of a file of colours, a line for each ('dark.accent: "rød"'), or []:
 * a mode or one of `names` missing, or a value that is not a colour. */
export function colorProblems(value: unknown, names: string[]): string[] {
  const colors = (value ?? {}) as Partial<Record<Mode, unknown>>;
  return MODES.flatMap((mode) => {
    const set = (colors[mode] ?? {}) as Record<string, unknown>;
    return names.filter((name) => !isColor(set[name])).map((name) => `${mode}.${name}: ${JSON.stringify(set[name] ?? null)}`);
  });
}

// One mode's colours as CSS declarations. Only names and values that cannot be anything but a colour,
// since the CSS goes straight into the page.
function declarations(set: ColorSet): string {
  return Object.entries(set)
    .map(([name, value]) => {
      if (!NAME.test(name) || !isColor(value)) throw new Error(`Not a colour: ${name}: ${JSON.stringify(value)}`);
      return `--${name}:${value};`;
    })
    .join('');
}

/** The colour of the editor's page in a mode: Surface, as everywhere on the site (Material 3's page colour). */
export const pageColor = (set: ColorSet): string => set.surface;

/** The names a file of colours had before its colours were Material 3's colour roles, and the role each is now. `bg` is
 * Material's Surface (the page), and the cards' `surface` is Surface container lowest. `surface-default`, `tint` and
 * `accent-hover` are no colours of Material's: the first was Surface (see `bg`), the second Surface container high, and
 * the third is drawn as a state layer, so a file loses them. */
const LEGACY_NAMES: Record<string, string | null> = {
  bg: 'surface',
  surface: 'surface-container-lowest',
  'surface-default': null,
  tint: null,
  ink: 'on-surface',
  muted: 'on-surface-variant',
  line: 'outline-variant',
  accent: 'primary',
  'accent-hover': null,
  'on-accent': 'on-primary',
  'accent-container': 'primary-container',
  'on-accent-container': 'on-primary-container',
};

const legacy = (set: ColorSet | undefined): boolean => !!set && Object.hasOwn(set, 'accent') && !Object.hasOwn(set, 'primary');

/** A file of colours in Material 3's role names: one written with the old names (it has `accent`, not `primary`) has
 * each colour renamed, with the value it had, so the site looks as before. A file in the new names is returned as it is. */
export function withMaterialNames(colors: Colors): Colors {
  if (!MODES.some((mode) => legacy(colors[mode]))) return colors;
  const renamed = (set: ColorSet | undefined): ColorSet => {
    if (!set) return {} as ColorSet;
    if (!legacy(set)) return set;
    const out: ColorSet = {};
    for (const [name, value] of Object.entries(set)) {
      const to = Object.hasOwn(LEGACY_NAMES, name) ? LEGACY_NAMES[name] : name;
      if (to === null) continue;
      // The cards' colour only where the file has no Surface container lowest of its own.
      if (name === 'surface' && Object.hasOwn(set, to)) continue;
      out[to] = value;
    }
    return out;
  };
  return { ...colors, light: renamed(colors.light), dark: renamed(colors.dark) };
}

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
 * what it is in the site's words ("Teksten på knapperne"). */
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
