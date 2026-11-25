// Dynamic colour (Material 3, https://m3.material.io/styles/color/system/how-the-system-works): all the
// site's colours, in light and dark mode, made from one source colour, as Material Theme Builder makes them
// (docs/superpowers/specs/2026-11-21-m3-color-schemes-design.md). The source colour gives tonal palettes in HCT
// (Material's colour space), one of M3's scheme variants (Tonal Spot, M3's default, and the others) picks how much colour each
// palette has, and the contrast level how far apart the tones of text and its background are; the library's own scheme
// classes do all of it, so a scheme equals Theme Builder's export for the same source colour, role by role. Custom is
// Theme Builder's custom core colours: Primary, Secondary and Tertiary each give their own palette, and the roles take M3's tones
// from them (never the chosen colour itself). Each of the site's colours takes the tone of a Material colour role ("Colors":
// colorRoles in @site/colors), so text stays readable in both modes. The site's file of colours keeps the choice ("dynamic")
// beside the colours it gave, so the site itself never needs this: only the editor makes them (Colors.tsx).
// Content-based colour (https://m3.material.io/styles/color/dynamic/content-based-source) is the other
// source Material has: every page takes its colours from its own image, made the same way when
// the site is built (packages/editor/site/pageColors.ts), while an app says so (the app "Indholdsbaserede farver", with the choice
// in its settings), or a theme asks for it.
// No React or browser here: the check before the build uses it too.
import {
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
  TonalPalette,
  argbFromHex,
  argbFromRgb,
  hexFromArgb,
  sanitizeDegreesDouble,
} from '@material/material-color-utilities';
import { contrast, isColor, MODES, type ColorSet, type Colors, type Mode } from './colors';

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

/** The harmonies the generator offered before M3's schemes (0.19.6): a file may still name one (sites skip versions, so old forms stay
 * readable). It is read as Tonal Spot from the same source colour; nothing makes the old colours again. */
const LEGACY_HARMONIES = ['analogous', 'monochromatic', 'complementary', 'splitComplementary', 'triadic'];

/** The generator's other choice (Theme Builder's custom core colours, M3 "Custom brand"): Primary, Secondary and Tertiary set freely,
 * each giving its own palette; the roles take M3's tones from them. */
export const CUSTOM = 'custom';

/** The generator's three base colours, in order: the source colour (primary), the second (secondary) and the third
 * (tertiary). */
export const BASE_COLORS = ['source', 'secondary', 'tertiary'] as const;
export type BaseColor = (typeof BASE_COLORS)[number];

/** The choice the colours are made from, as the file of colours keeps it: the source colour, one of M3's scheme variants and the
 * contrast. `harmony` is read from a file of the older generator (LEGACY_HARMONIES) or `custom` (Primary, Secondary and Tertiary
 * set freely); the editor never writes an older harmony. */
export type Dynamic = {
  source: string;
  harmony?: string;
  variant?: Variant;
  contrast: Contrast;
  /** Read from a file of the older generator; no longer used. */
  sourceLocked?: boolean;
  /** Custom only: the second and third colour (`source` is Primary). */
  secondary?: string;
  tertiary?: string;
  /** Read from a file of the older generator: Primary kept as chosen though hard to read (lowContrast skips its text pairs). New colours drop it. */
  kept?: 'primary'[];
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

const GRAPHIC_MIN = 3;

function roleColor(scheme: DynamicScheme, role: Role): string {
  return hexFromArgb(scheme[role]);
}

// A file of the older generator names a harmony, which is read as Tonal Spot (the default variant).
const variantOf = (dynamic: Dynamic): Variant => (dynamic.harmony === undefined && dynamic.variant) || VARIANTS[0];

/** M3's scheme for a choice, in a mode: the library's scheme class for the variant (Tonal Spot, M3's default, for Custom and for a file of
 * the older generator), or, in Custom, Theme Builder's custom core colours: each of Primary, Secondary and Tertiary gives its own palette
 * (its hue and chroma), and the neutrals and the error are M3's (the neutrals from Primary's hue, the error fixed). */
function schemeOf(dynamic: Dynamic, isDark: boolean): DynamicScheme {
  const source = Hct.fromInt(argbFromHex(dynamic.source));
  const contrastLevel = CONTRASTS[dynamic.contrast];
  if (dynamic.harmony !== CUSTOM) return new SCHEMES[variantOf(dynamic)](source, isDark, contrastLevel);
  const core = (hex: string) => {
    const own = Hct.fromInt(argbFromHex(hex));
    return TonalPalette.fromHueAndChroma(own.hue, own.chroma);
  };
  const tonal = new SchemeTonalSpot(source, isDark, contrastLevel);
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: tonal.variant,
    contrastLevel,
    isDark,
    primaryPalette: core(dynamic.source),
    secondaryPalette: core(dynamic.secondary ?? dynamic.source),
    tertiaryPalette: core(dynamic.tertiary ?? dynamic.source),
    neutralPalette: tonal.neutralPalette,
    neutralVariantPalette: tonal.neutralVariantPalette,
  });
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
  // A harmony instead of a variant only in a file of colours: Custom, or one the older generator wrote.
  const harmony = key === 'dynamic' && d.harmony !== undefined;
  const custom = key === 'dynamic' && d.harmony === CUSTOM;
  return [
    ...(key === 'contentBased' || isColor(d.source) ? [] : [bad('source')]),
    ...(harmony ? (custom || LEGACY_HARMONIES.includes(d.harmony as string) ? [] : [bad('harmony')]) : []),
    ...((harmony ? d.variant === undefined : VARIANTS.includes(d.variant as Variant)) ? [] : [bad('variant')]),
    ...(Object.hasOwn(CONTRASTS, d.contrast as string) ? [] : [bad('contrast')]),
    // The older generator's `kept`, only in Custom.
    ...(d.kept === undefined || (custom && Array.isArray(d.kept) && d.kept.length === 1 && d.kept[0] === 'primary') ? [] : [bad('kept')]),
    // The lock of the older generator is still read.
    ...(d.sourceLocked === undefined || (key === 'dynamic' && !custom && d.sourceLocked === true) ? [] : [bad('sourceLocked')]),
    // Custom has both its other colours; nothing else has them.
    ...(['secondary', 'tertiary'] as const).flatMap((name) =>
      custom ? (isColor(d[name]) ? [] : [bad(name)]) : d[name] === undefined ? [] : [bad(name)],
    ),
  ];
}

// What a colour must reach on the page (Surface): 4.5:1 as text, 3:1 as a graphic (M3, "Color contrast").

/** Secondary's or Tertiary's contrast on Surface in each mode (Custom; a scheme's are Material's). */
export function pageContrast(dynamic: Dynamic, which: 'secondary' | 'tertiary'): Record<Mode, number> {
  const of = (mode: Mode) => {
    const scheme = schemeOf(dynamic, mode === 'dark');
    return contrast(roleColor(scheme, which), roleColor(scheme, 'surface'));
  };
  return { light: of('light'), dark: of('dark') };
}

/** Whether Secondary or Tertiary has low contrast on the page: below 3:1 on Surface in light or dark mode. Such a colour still
 * fills (its text is checked) but is not offered as an icon color; nothing is asked and nothing is adjusted. */
export function lowOnPage(dynamic: Dynamic, which: 'secondary' | 'tertiary'): boolean {
  const { light, dark } = pageContrast(dynamic, which);
  return light < GRAPHIC_MIN || dark < GRAPHIC_MIN;
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

/** A choice's three base colours, as dots on the colour wheel: its primary, secondary and tertiary palette, in that order
 * (BASE_COLORS). The first is the source colour itself (in its tone); the others are shown where their hue is clearest (most
 * colourful: a light yellow, a deep blue), never in a tone Material dislikes (DislikeAnalyzer: a dark olive), so they look as they go
 * together, not as one tone of each. */
export function wheelDots(dynamic: Dynamic): WheelDot[] {
  const scheme = schemeOf(dynamic, false);
  const { tone } = Hct.fromInt(argbFromHex(dynamic.source));
  const custom = dynamic.harmony === CUSTOM;
  return [scheme.primaryPalette, scheme.secondaryPalette, scheme.tertiaryPalette].map((p, i) => {
    // Custom: each dot is its own colour, in its own tone.
    if (custom)
      return onWheel(
        p.hue,
        p.chroma,
        Hct.fromInt(argbFromHex([dynamic.source, dynamic.secondary, dynamic.tertiary][i] ?? dynamic.source)).tone,
      );
    const dot = onWheel(p.hue, p.chroma, i ? undefined : tone);
    return i ? { ...dot, color: hexFromArgb(DislikeAnalyzer.fixIfDisliked(Hct.fromInt(argbFromHex(dot.color))).toInt()) } : dot;
  });
}

/** Whether a base colour can be changed on its own (its edit sheet): the source colour always; the secondary and
 * tertiary colour only in Custom (in a scheme of M3's they are made from the source colour). */
export const canSetBaseColor = (dynamic: Dynamic, which: BaseColor) => which === 'source' || dynamic.harmony === CUSTOM;

/** A choice with one of its base colours set to `color` (its edit sheet). A scheme of M3's has the source colour only (an older
 * harmony is dropped: the scheme is Tonal Spot from it); Custom sets its own colour and nothing else. */
export function withBaseColor(dynamic: Dynamic, which: BaseColor, color: string): Dynamic {
  if (dynamic.harmony === CUSTOM) return { ...dynamic, [which]: color };
  if (which !== 'source') return dynamic;
  const { harmony: _, sourceLocked: __, ...rest } = dynamic;
  return { ...rest, source: color, variant: variantOf(dynamic) };
}

/** The source colour at a point on the colour wheel (x and y from -1 to 1; further out is the edge): its hue and
 * chroma, at the tone its hue is most colourful at. */
export function wheelColor(x: number, y: number): string {
  const hue = sanitizeDegreesDouble((Math.atan2(x, -y) * 180) / Math.PI);
  const { chroma, tone } = mostChroma(hue);
  return hexFromArgb(Hct.from(hue, chroma * Math.min(1, Math.hypot(x, y)), tone).toInt());
}

/** A colour's tone (0 to 100), for the wheel's `wheelColorAt`. */
export const toneOf = (hex: string): number => Hct.fromInt(argbFromHex(hex)).tone;

/** A colour at a point on the colour wheel in a given tone (Custom: a dragged dot keeps its tone, so a cream stays light): its
 * hue follows the point's angle and its chroma the distance from the middle, as far as the tone can have that chroma in sRGB
 * (a light tone has less than the wheel's edge asks), so the dot sits where its colour can be. */
export function wheelColorAt(x: number, y: number, tone: number): string {
  const hue = sanitizeDegreesDouble((Math.atan2(x, -y) * 180) / Math.PI);
  return hexFromArgb(Hct.from(hue, mostChroma(hue).chroma * Math.min(1, Math.hypot(x, y)), tone).toInt());
}

/** The colours round the colour wheel's edge, from the top clockwise (`steps` of them), and the grey in its middle. */
export function wheelColors(steps = 36): { edge: string[]; middle: string } {
  const edge = Array.from({ length: steps }, (_, i) => onWheel((i * 360) / steps, 200).color);
  return { edge, middle: hexFromArgb(Hct.from(0, 0, 70).toInt()) };
}
