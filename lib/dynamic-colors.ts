// Dynamic colour (Material 3, https://m3.material.io/styles/color/system/how-the-system-works): all the
// site's colours, in light and dark mode, made from one source colour. The source colour gives tonal
// palettes in HCT (Material's colour space), a scheme variant picks how much colour each palette has, and
// the contrast level how far apart the tones of text and its background are. Each of the site's colours
// takes the tone of a Material colour role ("Farver": colorRoles in src/site/colors.ts), so text stays
// readable in both modes. The site's file of colours keeps the choice ("dynamic") beside the colours it
// gave, so the site itself never needs this: only the editor makes them (Colors.tsx).
// Content-based colour (https://m3.material.io/styles/color/dynamic/content-based-source) is the other
// source Material has: every page takes its colours from its own picture, made the same way when
// the site is built (packages/editor/site/pageColors.ts), while an app says so (the app "Indholdsbaserede farver", with the choice
// in its settings), or a theme asks for it.
// No React or browser here: the check before the build uses it too.
import {
  Hct,
  QuantizerCelebi,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  Score,
  argbFromHex,
  argbFromRgb,
  hexFromArgb,
  type DynamicScheme,
} from '@material/material-color-utilities';
import { isColor, type ColorSet, type Colors, type Mode } from './colors';

/** Material's scheme variants, in the order they are offered (the first is Material's default). */
export const VARIANTS = [
  'tonalSpot',
  'neutral',
  'vibrant',
  'expressive',
  'fidelity',
  'content',
  'monochrome',
  'rainbow',
  'fruitSalad',
] as const;
export type Variant = (typeof VARIANTS)[number];

const SCHEMES: Record<Variant, new (source: Hct, isDark: boolean, contrast: number) => DynamicScheme> = {
  tonalSpot: SchemeTonalSpot,
  neutral: SchemeNeutral,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  monochrome: SchemeMonochrome,
  rainbow: SchemeRainbow,
  fruitSalad: SchemeFruitSalad,
};

/** Material's contrast levels, by name, and the level each is. */
export const CONTRASTS = { standard: 0, medium: 0.5, high: 1 } as const;
export type Contrast = keyof typeof CONTRASTS;

/** The choice the colours are made from, as the file of colours keeps it. */
export type Dynamic = { source: string; variant: Variant; contrast: Contrast };

/** The choice for content-based colour, as an app gives it (AppDefinition.pageColors): the source colour is the picture's. */
export type ContentBased = { variant: Variant; contrast: Contrast };

/** The variant Material uses for content-based colour: the one closest to the picture. */
export const CONTENT_VARIANT: Variant = 'content';

/** Material's colour roles a site's colour can take, and one Material has not: `primaryHover`, the primary
 * colour a little further from the text on it (a button under the mouse). */
export type Role =
  | 'surface'
  | 'surfaceDim'
  | 'surfaceBright'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'onSurface'
  | 'onSurfaceVariant'
  | 'outline'
  | 'outlineVariant'
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'secondary'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'primaryHover';

/** The role each of a site's colours takes, by its name; one role, or one in each mode. */
export type ColorRoles = Record<string, Role | Record<Mode, Role>>;

// How many tones a button under the mouse moves away from its text.
const HOVER = 5;

function roleColor(scheme: DynamicScheme, role: Role): string {
  if (role !== 'primaryHover') return hexFromArgb(scheme[role]);
  const primary = Hct.fromInt(scheme.primary);
  const away = Hct.fromInt(scheme.onPrimary).tone > primary.tone ? -HOVER : HOVER;
  return hexFromArgb(Hct.from(primary.hue, primary.chroma, Math.min(100, Math.max(0, primary.tone + away))).toInt());
}

/** The site's colours in both modes, made from the choice, each by its role. */
export function dynamicColors(dynamic: Dynamic, roles: ColorRoles): Colors {
  const source = Hct.fromInt(argbFromHex(dynamic.source));
  const set = (mode: Mode): ColorSet => {
    const scheme = new SCHEMES[dynamic.variant](source, mode === 'dark', CONTRASTS[dynamic.contrast]);
    return Object.fromEntries(
      Object.entries(roles).map(([name, role]) => [name, roleColor(scheme, typeof role === 'string' ? role : role[mode])]),
    );
  };
  return { light: set('light'), dark: set('dark') };
}

/** What is wrong with a choice of dynamic colour, a line for each ('dynamic.variant: "rød"'), or []: the one in a file
 * of colours (`dynamic`), or one for content-based colour (`contentBased`, which has no source colour). */
export function dynamicProblems(value: unknown, key: 'dynamic' | 'contentBased' = 'dynamic'): string[] {
  const d = (value ?? {}) as Record<string, unknown>;
  const bad = (name: string) => `${key}.${name}: ${JSON.stringify(d[name] ?? null)}`;
  return [
    ...(key === 'contentBased' || isColor(d.source) ? [] : [bad('source')]),
    ...(VARIANTS.includes(d.variant as Variant) ? [] : [bad('variant')]),
    ...(Object.hasOwn(CONTRASTS, d.contrast as string) ? [] : [bad('contrast')]),
  ];
}

// Material's quantizer in JavaScript (QuantizerWsmeans) starts its clusters from Math.random, so the same picture could
// give other colours each time it is read (and each build other colours for a page); seeded as Material's Java and Dart
// versions are (0x42688), it gives the same. The quantizer runs at once, so nothing else gets the seeded numbers.
function seeded<T>(run: () => T): T {
  const random = Math.random;
  let seed = 0x42688;
  // mulberry32
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  try {
    return run();
  } finally {
    Math.random = random;
  }
}

/** The colours in a picture that are best as a source colour, best first (at most four): a picture's pixels
 * as RGBA bytes (a canvas's ImageData, or sharp's raw output with an alpha channel). Material's own way:
 * quantized, then scored. Only the picture's own: none for one without colour enough (a grey one), where
 * Material's score would give its fallback colour (Google blue). */
export function sourceColorsOf(bytes: Uint8ClampedArray): string[] {
  const pixels: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) if (bytes[i + 3] === 255) pixels.push(argbFromRgb(bytes[i], bytes[i + 1], bytes[i + 2]));
  const population = seeded(() => QuantizerCelebi.quantize(pixels, 128));
  return Score.score(population, { desired: 4 })
    .filter((color) => population.has(color))
    .map(hexFromArgb);
}
