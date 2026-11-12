// Dynamic colour (Material 3, https://m3.material.io/styles/color/system/how-the-system-works): all the
// site's colours, in light and dark mode, made from one source colour. The source colour gives tonal
// palettes in HCT (Material's colour space), a scheme variant picks how much colour each palette has, and
// the contrast level how far apart the tones of text and its background are. The generator ("Colors" › "Generator")
// uses a colour harmony instead of a variant: the source colour's hue and chroma give the primary palette, and the
// harmony puts the secondary and tertiary palettes round the colour wheel from it (HARMONIES), as on a colour wheel. Each of the site's colours
// takes the tone of a Material colour role ("Colors": colorRoles in @site/colors), so text stays
// readable in both modes. The site's file of colours keeps the choice ("dynamic") beside the colours it
// gave, so the site itself never needs this: only the editor makes them (Colors.tsx).
// Content-based colour (https://m3.material.io/styles/color/dynamic/content-based-source) is the other
// source Material has: every page takes its colours from its own image, made the same way when
// the site is built (packages/editor/site/pageColors.ts), while an app says so (the app "Indholdsbaserede farver", with the choice
// in its settings), or a theme asks for it.
// No React or browser here: the check before the build uses it too.
import {
  Blend,
  DislikeAnalyzer,
  DynamicScheme,
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
  TemperatureCache,
  TonalPalette,
  argbFromHex,
  argbFromRgb,
  hexFromArgb,
  sanitizeDegreesDouble,
} from '@material/material-color-utilities';
import { isColor, MODES, type ColorSet, type Colors, type Mode } from './colors';

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

/** The colour harmonies the generator offers, in the order they are offered (the first is where it starts). */
export const HARMONIES = ['analogous', 'monochromatic', 'complementary', 'splitComplementary', 'triadic'] as const;
export type Harmony = (typeof HARMONIES)[number];

// Each harmony's secondary and tertiary palette: its hue, from the source colour (with Material's warm and cool
// colours, TemperatureCache, where Material has the harmony: its analogous colours and its complement, which go better
// with the source colour than a fixed turn round the wheel; else a turn), and its share of the harmony's chroma
// (harmonyChroma). A palette on the source colour's own hue has less of it, so the two still differ.
type Place = (source: Hct, warmCool: () => TemperatureCache) => number;
const HARMONY: Record<Harmony, Record<'secondary' | 'tertiary', [hue: Place, share: number]>> = {
  analogous: { secondary: [(_, w) => w().analogous(5, 12)[1].hue, 1], tertiary: [(_, w) => w().analogous(5, 12)[3].hue, 1] },
  monochromatic: { secondary: [(s) => s.hue, 0.45], tertiary: [(s) => s.hue, 0.75] },
  complementary: { secondary: [(s) => s.hue, 0.45], tertiary: [(_, w) => w().complement.hue, 1] },
  splitComplementary: { secondary: [(_, w) => w().complement.hue - 30, 1], tertiary: [(_, w) => w().complement.hue + 30, 1] },
  triadic: { secondary: [(s) => s.hue + 120, 1], tertiary: [(s) => s.hue - 120, 1] },
};

// The secondary and tertiary colours' chroma: the source colour's, but at least 32 and at most 48, so they are neither
// grey nor neon (a nearly grey source colour gives grey ones: at most twice its own).
const harmonyChroma = (chroma: number) => Math.min(48, Math.max(chroma, Math.min(32, chroma * 2)));
// The source colour's chroma that gives a harmony chroma (the other way round).
function sourceChromaFor(wanted: number, chroma: number): number {
  if (wanted < 32) return wanted / 2;
  if (wanted >= 48) return Math.max(chroma, 48);
  if (wanted === 32) return chroma >= 16 && chroma <= 32 ? chroma : 32;
  return wanted;
}

// The hue and chroma of a harmony's secondary or tertiary palette for a source colour (the warm and cool colours worked
// out once for the last source colour, as dragging asks for them many times).
let warmCool: { argb: number; cache: TemperatureCache } | undefined;
function placed(source: Hct, harmony: Harmony, which: 'secondary' | 'tertiary'): { hue: number; chroma: number } {
  const w = () => {
    if (warmCool?.argb !== source.toInt()) warmCool = { argb: source.toInt(), cache: new TemperatureCache(source) };
    return warmCool.cache;
  };
  const [hue, share] = HARMONY[harmony][which];
  return { hue: sanitizeDegreesDouble(hue(source, w)), chroma: harmonyChroma(source.chroma) * share };
}

/** The generator's three base colours, in order: the source colour (primary), the second (secondary) and the third
 * (tertiary). */
export const BASE_COLORS = ['source', 'secondary', 'tertiary'] as const;
export type BaseColor = (typeof BASE_COLORS)[number];

/** The choice the colours are made from, as the file of colours keeps it: the source colour, a harmony (the
 * generator's) or a variant (Material's, as a file written before the harmonies has it), never both, and the contrast.
 * The source colour can be locked (`sourceLocked`): the wheel does not move it, and the second and third colours,
 * which the harmony makes from it, cannot be changed on their own. */
export type Dynamic = {
  source: string;
  harmony?: Harmony;
  variant?: Variant;
  contrast: Contrast;
  sourceLocked?: boolean;
};

/** The choice for content-based colour, as an app gives it (AppDefinition.pageColors): the source colour is the image's. */
export type ContentBased = { variant: Variant; contrast: Contrast };

/** The variant Material uses for content-based colour: the one closest to the image. */
export const CONTENT_VARIANT: Variant = 'content';

/** Material's colour roles (m3.material.io/styles/color/roles), which a site's colours are, each by its own name. */
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
  | 'error'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'inverseSurface'
  | 'inverseOnSurface'
  | 'inversePrimary'
  | 'primaryFixed'
  | 'primaryFixedDim'
  | 'onPrimaryFixed'
  | 'onPrimaryFixedVariant'
  | 'secondaryFixed'
  | 'secondaryFixedDim'
  | 'onSecondaryFixed'
  | 'onSecondaryFixedVariant'
  | 'tertiaryFixed'
  | 'tertiaryFixedDim'
  | 'onTertiaryFixed'
  | 'onTertiaryFixedVariant'
  | 'scrim'
  | 'shadow';

/** The role each of a site's colours takes, by its name; one role, or one in each mode. */
export type ColorRoles = Record<string, Role | Record<Mode, Role>>;

function roleColor(scheme: DynamicScheme, role: Role): string {
  return hexFromArgb(scheme[role]);
}

// Material's error colour, which a harmony turns a little towards the source colour (Blend.harmonize, as Material
// harmonizes its static colours), so it sits better with the others.
const ERROR = Hct.from(25, 84, 40).toInt();
// The variant whose rules a harmony's scheme follows for each role's tone (Material's own for tonal spot).
const TONAL_SPOT = new SchemeTonalSpot(Hct.fromInt(ERROR), false, 0).variant;

/** Material's scheme for a choice, in a mode: its harmony's or its variant's. */
function schemeOf(dynamic: Dynamic, isDark: boolean): DynamicScheme {
  const source = Hct.fromInt(argbFromHex(dynamic.source));
  const contrastLevel = CONTRASTS[dynamic.contrast];
  if (!dynamic.harmony) return new SCHEMES[dynamic.variant ?? VARIANTS[0]](source, isDark, contrastLevel);
  const { hue, chroma } = source;
  const around = (which: 'secondary' | 'tertiary') => {
    const p = placed(source, dynamic.harmony!, which);
    return TonalPalette.fromHueAndChroma(p.hue, p.chroma);
  };
  const scheme = new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: TONAL_SPOT,
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(hue, chroma),
    secondaryPalette: around('secondary'),
    tertiaryPalette: around('tertiary'),
    // The surfaces and text a little of the source colour, as much as tonal spot's at most.
    neutralPalette: TonalPalette.fromHueAndChroma(hue, Math.min(chroma / 6, 6)),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(hue, Math.min(chroma / 4.5, 8)),
  });
  scheme.errorPalette = TonalPalette.fromHueAndChroma(Hct.fromInt(Blend.harmonize(ERROR, source.toInt())).hue, 84);
  return scheme;
}

/** The site's colours in both modes, made from the choice, each by its role. */
export function dynamicColors(dynamic: Dynamic, roles: ColorRoles): Colors {
  const set = (mode: Mode): ColorSet => {
    const scheme = schemeOf(dynamic, mode === 'dark');
    return Object.fromEntries(
      Object.entries(roles).map(([name, role]) => [name, roleColor(scheme, typeof role === 'string' ? role : role[mode])]),
    );
  };
  return { light: set('light'), dark: set('dark') };
}

// The colours a file of colours written before they were among the site's had in the theme, from the others (mixed in
// sRGB, as the theme's CSS mixed them): Material's three surfaces the page's, the dim one a step towards the text in
// light mode and the bright one a step towards it in dark mode (where the page is the darkest), the surface containers a step each towards the text from the surfaces,
// the lowest the surfaces, the outline between the quiet text and the surfaces, the inverse
// colours the text's on the page's with the light colour for its buttons, the error colours the primary colours, the
// fixed colours the containers (Material's are the same in both modes; these follow the mode they are made in), and the
// scrim and the shadow black.
const MIXED: Record<string, (set: ColorSet, mode: Mode) => string | undefined> = {
  'surface-dim': (c, mode) => (mode === 'light' ? mix(c['on-surface'], 0.12, c.surface) : c.surface),
  'surface-bright': (c, mode) => (mode === 'dark' ? mix(c['on-surface'], 0.15, c.surface) : c.surface),
  'surface-container-lowest': (c) => c.surface,
  'surface-container-low': (c) => mix(c['on-surface'], 0.03, c.surface),
  'surface-container': (c) => mix(c['on-surface'], 0.05, c.surface),
  'surface-container-high': (c) => mix(c['on-surface'], 0.08, c.surface),
  'surface-container-highest': (c) => mix(c['on-surface'], 0.11, c.surface),
  outline: (c) => mix(c['on-surface-variant'], 0.7, c.surface),
  'inverse-surface': (c) => c['on-surface'],
  'inverse-on-surface': (c) => c.surface,
  'inverse-primary': (c) => c['primary-container'],
  error: (c) => c.primary,
  'on-error': (c) => c['on-primary'],
  'error-container': (c) => c['primary-container'],
  'on-error-container': (c) => c['on-primary-container'],
  scrim: () => '#000000',
  shadow: () => '#000000',
  ...Object.fromEntries(
    ['primary', 'secondary', 'tertiary'].flatMap((f) => [
      [`${f}-fixed`, (c: ColorSet) => c[`${f}-container`]],
      [`${f}-fixed-dim`, (c: ColorSet) => mix(c[`on-${f}-container`], 0.1, c[`${f}-container`])],
      [`on-${f}-fixed`, (c: ColorSet) => c[`on-${f}-container`]],
      // Not quieter than the text on the container, as that is the one pair known to be readable (Material's is a step quieter).
      [`on-${f}-fixed-variant`, (c: ColorSet) => c[`on-${f}-container`]],
    ]),
  ),
};

/** `share` of colour `a` in colour `b`, in sRGB; undefined when one is not a colour. */
function mix(a: string | undefined, share: number, b: string | undefined): string | undefined {
  if (!isColor(a) || !isColor(b)) return undefined;
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) =>
      Math.round(channel(a, i) * share + channel(b, i) * (1 - share))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** The colours of a file of colours with those of `roles` it does not have (one written before they were among the
 * site's): made from its choice of dynamic colour, when it has one, else as the theme mixed them from the others. What
 * cannot be made stays missing, for colorProblems to say. */
export function completeColors(colors: Colors, roles: ColorRoles): Colors {
  const missing = (set: ColorSet | undefined) => !!set && Object.keys(roles).some((name) => !isColor(set[name]));
  if (!MODES.some((mode) => missing(colors[mode]))) return colors;
  const made = colors.dynamic !== undefined && !dynamicProblems(colors.dynamic).length ? dynamicColors(colors.dynamic, roles) : undefined;
  const complete = (mode: Mode): ColorSet => {
    const set = colors[mode];
    if (!missing(set)) return set;
    const from = (name: string) => (made ? made[mode][name] : MIXED[name]?.(set, mode));
    const added = Object.keys(roles)
      .filter((name) => !isColor(set[name]))
      .map((name) => [name, from(name)])
      .filter(([, value]) => isColor(value));
    return { ...set, ...Object.fromEntries(added) };
  };
  return { ...colors, light: complete('light'), dark: complete('dark') };
}

/** What is wrong with a choice of dynamic colour, a line for each ('dynamic.variant: "red"'), or []: the one in a file
 * of colours (`dynamic`), or one for content-based colour (`contentBased`, which has no source colour). */
export function dynamicProblems(value: unknown, key: 'dynamic' | 'contentBased' = 'dynamic'): string[] {
  const d = (value ?? {}) as Record<string, unknown>;
  const bad = (name: string) => `${key}.${name}: ${JSON.stringify(d[name] ?? null)}`;
  // A harmony instead of a variant only in a file of colours, the generator's.
  const harmony = key === 'dynamic' && d.harmony !== undefined;
  return [
    ...(key === 'contentBased' || isColor(d.source) ? [] : [bad('source')]),
    ...(harmony ? (HARMONIES.includes(d.harmony as Harmony) ? [] : [bad('harmony')]) : []),
    ...((harmony ? d.variant === undefined : VARIANTS.includes(d.variant as Variant)) ? [] : [bad('variant')]),
    ...(Object.hasOwn(CONTRASTS, d.contrast as string) ? [] : [bad('contrast')]),
    // The lock on the source colour, only in a file of colours.
    ...(d.sourceLocked === undefined || (key === 'dynamic' && d.sourceLocked === true) ? [] : [bad('sourceLocked')]),
  ];
}

// Material's quantizer in JavaScript (QuantizerWsmeans) starts its clusters from Math.random, so the same image could
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

/** The colours in an image that are best as a source colour, best first (at most four): an image's pixels
 * as RGBA bytes (a canvas's ImageData, or sharp's raw output with an alpha channel). Material's own way:
 * quantized, then scored. Only the image's own: none for one without colour enough (a grey one), where
 * Material's score would give its fallback colour (Google blue). */
export function sourceColorsOf(bytes: Uint8ClampedArray): string[] {
  const pixels: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) if (bytes[i + 3] === 255) pixels.push(argbFromRgb(bytes[i], bytes[i + 1], bytes[i + 2]));
  const population = seeded(() => QuantizerCelebi.quantize(pixels, 128));
  return Score.score(population, { desired: 4 })
    .filter((color) => population.has(color))
    .map(hexFromArgb);
}

// The colour wheel ("Colors" › "Generator", ColorWheel in the editor): each hue at its angle, clockwise from the top,
// and its chroma as the distance from the middle, as a share of the most chroma the hue can have in sRGB, so the
// edge is every hue at its most colourful and the middle grey.

// The most chroma each whole degree of hue can have, and the tone it has it at, worked out once each.
const most = new Map<number, { chroma: number; tone: number }>();
function mostChroma(hue: number): { chroma: number; tone: number } {
  const key = Math.round(sanitizeDegreesDouble(hue)) % 360;
  let found = most.get(key);
  if (!found) {
    found = { chroma: 0, tone: 50 };
    for (let tone = 5; tone <= 95; tone += 2.5) {
      const chroma = Hct.from(key, 200, tone).chroma;
      if (chroma > found.chroma) found = { chroma, tone };
    }
    most.set(key, found);
  }
  return found;
}

/** A dot on the colour wheel: where it is (x and y from -1 to 1, from the middle; y down) and its colour. */
export type WheelDot = { x: number; y: number; color: string };

// A colour with a hue and chroma (at most what the hue can have) in `tone`, or, where the tone cannot have that much
// chroma, where the hue is most colourful, so its own hue and chroma are the ones asked for.
function colorAt(hue: number, chroma: number, tone?: number): string {
  const most = mostChroma(hue);
  const wanted = Math.min(chroma, most.chroma);
  const inTone = tone === undefined ? undefined : Hct.from(hue, wanted, tone);
  return hexFromArgb((inTone && inTone.chroma >= wanted - 1 ? inTone : Hct.from(hue, wanted, most.tone)).toInt());
}

// A colour on the wheel: where its hue and chroma are, and its colour (colorAt).
function onWheel(hue: number, chroma: number, tone?: number): WheelDot {
  const r = Math.min(1, chroma / mostChroma(hue).chroma);
  const angle = (hue * Math.PI) / 180;
  return { x: r * Math.sin(angle), y: -r * Math.cos(angle), color: colorAt(hue, chroma, tone) };
}

/** A choice's three base colours, as dots on the colour wheel: its primary (the source colour's hue and chroma),
 * secondary and tertiary palette, in that order (BASE_COLORS). The first is the source colour itself (in its tone); the
 * others are shown where their hue is clearest (most colourful: a light yellow, a deep blue), never in a tone Material
 * dislikes (DislikeAnalyzer: a dark olive), so they look as they go together, not as one tone of each. */
export function wheelDots(dynamic: Dynamic): WheelDot[] {
  const scheme = schemeOf(dynamic, false);
  const { tone } = Hct.fromInt(argbFromHex(dynamic.source));
  return [scheme.primaryPalette, scheme.secondaryPalette, scheme.tertiaryPalette].map((p, i) => {
    const dot = onWheel(p.hue, p.chroma, i ? undefined : tone);
    return i ? { ...dot, color: hexFromArgb(DislikeAnalyzer.fixIfDisliked(Hct.fromInt(argbFromHex(dot.color))).toInt()) } : dot;
  });
}

/** Whether a base colour can be changed on its own (its edit sheet): the source colour always; the secondary and
 * tertiary colour while the source colour is not locked, as they are made from it. */
export const canSetBaseColor = (dynamic: Dynamic, which: BaseColor) => which === 'source' || !dynamic.sourceLocked;

/** A choice with one of its base colours set to `color` (its edit sheet): the source colour is that colour (locked with
 * `lock`); for the secondary or tertiary colour (canSetBaseColor) the source colour turns, in its tone, so the harmony
 * (the first, without one) gives that colour's hue, or the closest it can (Material's warm and cool colours do not
 * reach every hue: no colour has a purple complement), and takes the chroma that gives that colour's chroma. */
export function withBaseColor(dynamic: Dynamic, which: BaseColor, color: string, lock = false): Dynamic {
  if (which === 'source') return { ...dynamic, source: color, ...(lock && { sourceLocked: true }) };
  if (!canSetBaseColor(dynamic, which)) return dynamic;
  const harmony = dynamic.harmony ?? HARMONIES[0];
  const target = Hct.fromInt(argbFromHex(color));
  const source = Hct.fromInt(argbFromHex(dynamic.source));
  const chroma = sourceChromaFor(target.chroma / HARMONY[harmony][which][1], source.chroma);
  // How far the harmony's colour is from the target's hue (degrees, signed), from a source hue.
  const off = (hue: number) =>
    sanitizeDegreesDouble(target.hue - placed(Hct.from(hue, chroma, source.tone), harmony, which).hue + 180) - 180;
  // The closest of every 10 degrees round the wheel, then closer in a few steps from there.
  let best = { hue: source.hue, off: off(source.hue) };
  for (let hue = 0; hue < 360; hue += 10) {
    const o = off(hue);
    if (Math.abs(o) < Math.abs(best.off)) best = { hue, off: o };
  }
  for (let step = 0; step < 6 && Math.abs(best.off) >= 0.5; step++) {
    const hue = sanitizeDegreesDouble(best.hue + best.off);
    const o = off(hue);
    if (Math.abs(o) >= Math.abs(best.off)) break;
    best = { hue, off: o };
  }
  const { variant: _, ...rest } = dynamic;
  return { ...rest, harmony, source: hexFromArgb(Hct.from(best.hue, chroma, source.tone).toInt()) };
}

/** The source colour at a point on the colour wheel (x and y from -1 to 1; further out is the edge): its hue and
 * chroma, at the tone its hue is most colourful at. */
export function wheelColor(x: number, y: number): string {
  const hue = sanitizeDegreesDouble((Math.atan2(x, -y) * 180) / Math.PI);
  const { chroma, tone } = mostChroma(hue);
  return hexFromArgb(Hct.from(hue, chroma * Math.min(1, Math.hypot(x, y)), tone).toInt());
}

/** The colours round the colour wheel's edge, from the top clockwise (`steps` of them), and the grey in its middle. */
export function wheelColors(steps = 36): { edge: string[]; middle: string } {
  const edge = Array.from({ length: steps }, (_, i) => onWheel((i * 360) / steps, 200).color);
  return { edge, middle: hexFromArgb(Hct.from(0, 0, 70).toInt()) };
}
