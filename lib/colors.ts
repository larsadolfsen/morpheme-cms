// The site's colours as data, in the site's file of colours (config.colors, e.g. src/data/colors.json):
// one set for light mode and one for dark, each a CSS variable by its name without "--":
//   { "light": { "bg": "#f6f4f1", "accent": "#a3345a", … }, "dark": { … } }
// and, when they are made from one source colour (dynamic colour, dynamic-colors.ts), the choice they were
// made from: "dynamic": { "source": "#a3345a", "harmony": "analogous", "contrast": "standard" } (or a "variant" instead
// of the "harmony", as one written before the harmonies has). (When each page takes
// its colours from its image, content-based colour, that is an app's: packages/editor/site/pageColors.ts.)
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

/** The names a file of colors had before its colors were Material 3's color roles, and the role each is now (null:
 * Material has no such role, so a file loses it). The one place that knows the old names; every reader of a file of
 * colors goes through `withMaterialNames`. The page (`bg`) is Material's Surface and the old cards' `surface` is Surface
 * container lowest (the theme's cards read it), so a site keeps the page and the cards it had. `tint` was Surface
 * container high already (its role under Colors). `surface-default` was the old name of Surface, which `bg` takes;
 * `accent-hover` is no Material color, as Material draws a hover as a state layer. */
export const LEGACY_NAMES: Record<string, string | null> = {
  bg: 'surface',
  surface: 'surface-container-lowest',
  'surface-default': null,
  tint: 'surface-container-high',
  ink: 'on-surface',
  muted: 'on-surface-variant',
  line: 'outline-variant',
  accent: 'primary',
  'accent-hover': null,
  'on-accent': 'on-primary',
  'accent-container': 'primary-container',
  'on-accent-container': 'on-primary-container',
};

const isSet = (set: unknown): set is ColorSet => !!set && typeof set === 'object' && !Array.isArray(set);

// A mode is in the old names when it has a key only the old names have. `surface` is no mark: Material has it too.
const legacy = (set: unknown): boolean =>
  isSet(set) && Object.keys(LEGACY_NAMES).some((name) => name !== 'surface' && Object.hasOwn(set, name));

function renamed(set: ColorSet): ColorSet {
  // Beside a `bg` the file's `surface` is the old cards' color; without one it is Material's Surface already.
  const cards = Object.hasOwn(set, 'bg');
  const out: ColorSet = {};
  for (const [name, value] of Object.entries(set)) {
    const to = name === 'surface' ? (cards ? LEGACY_NAMES.surface : name) : Object.hasOwn(LEGACY_NAMES, name) ? LEGACY_NAMES[name] : name;
    if (to === null) continue;
    // A new name the file has already is kept; the old name only fills where the new one is missing (`bg`'s Surface is
    // free when the old cards' `surface` goes).
    if (to !== name && Object.hasOwn(set, to) && !(to === 'surface' && cards)) continue;
    out[to] = value;
  }
  return out;
}

/** A file of colors read as Material 3's roles: a mode written with the old names (it has `accent`, `ink`, `bg` …) has each
 * color renamed, with the value it had (LEGACY_NAMES); one written with the new names is as it is, and the file itself
 * is returned when no mode has an old name. A file half in each keeps its new names and takes an old one only where the
 * new one is missing; old colors with no role are dropped. It changes nothing in the file it is given, and what it
 * returns it returns as it is, so it is safe to call wherever a file is read, before `completeColors`. */
export function withMaterialNames(colors: Colors): Colors {
  if (!MODES.some((mode) => legacy(colors?.[mode]))) return colors;
  return { ...colors, ...Object.fromEntries(MODES.filter((mode) => legacy(colors[mode])).map((mode) => [mode, renamed(colors[mode])])) };
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

/** The pairs in a mode that are too hard to read, with their contrast. `kept` are the roles the owner kept as chosen though
 * they are hard to read as text (`dynamic.kept`, Custom colours): the pairs with that role as text on a surface are skipped,
 * so neither Save nor the build stops on a choice the owner made. Nothing else is skipped. */
export function lowContrast(
  set: ColorSet,
  pairs: ColorPair[],
  kept: readonly string[] = [],
): (ColorPair & { ratio: number; min: number })[] {
  return pairs.flatMap((pair) => {
    if (kept.includes(pair.text) && pair.on.startsWith('surface')) return [];
    if (!isColor(set[pair.text]) || !isColor(set[pair.on])) return [];
    const ratio = contrast(set[pair.text], set[pair.on]);
    const min = pair.min ?? 4.5;
    return ratio < min ? [{ ...pair, ratio, min }] : [];
  });
}
