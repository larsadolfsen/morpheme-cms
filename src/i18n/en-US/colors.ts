// "Farver" (Colors.tsx): the site's colors in light and dark mode.
export const colors = {
  intro: "The website's colors in light and dark mode.",
  light: 'Light mode',
  dark: 'Dark mode',
  /** The switch between the modes, for screen readers. */
  modes: 'Mode',
  /** The little page drawn in a mode's colors. */
  preview: {
    title: (mode: string) => `Example: ${mode.toLowerCase()}`,
    heading: 'A heading',
    text: 'Secondary text, for example, a date.',
    link: 'A link',
    card: 'Text on a surface.',
    box: 'A light box',
    /** The boxes in the secondary and tertiary colors, which a harmony places; also the names of the
     * generator's base colors after the source color. */
    secondary: 'Secondary color',
    tertiary: 'Tertiary color',
    button: 'Book a time',
  },
  /** A pair that is too hard to read: what it is (the site's words), its contrast and the least it needs. */
  tooLow: (what: string, ratio: string, min: string) => `Contrast too low: ${what} (${ratio}, at least ${min}).`,
  /** checkSite.ts: a color in the file that is not one ('dark.accent: "rød"'). */
  notAColorAt: (where: string) => `Not a color: ${where}`,
  cannotSave: 'Some colors have too little contrast. Fix the ones marked in red.',
  unreadable: 'The colors couldn’t be read. The default colors are shown.',
  /** Dynamic color (Material 3): all the colors made from one source color. */
  dynamic: {
    /** The tab with dynamic color, beside the modes'. */
    tab: 'Generator',
    source: 'Source color',
    fromPicture: 'From a picture',
    fromPictureDone: 'The source color was taken from the picture',
    /** A picture without color enough to make the colors from (a grey one). */
    noColorInPicture: 'The picture has no color that can be used as a source color',
    /** The generator's three base colors at the top (ColorTiles), under this heading and named by it for screen readers. */
    base: 'Colors',
    /** The color wheel with the color harmonies (lib/dynamic-colors.ts HARMONIES). */
    harmony: 'Harmony',
    harmonyHint: 'Drag the big dot, and the other colors follow the harmony.',
    wheel: 'Color wheel',
    harmonies: {
      analogous: 'Analogous',
      monochromatic: 'Monochromatic',
      complementary: 'Complementary',
      splitComplementary: 'Split complementary',
      triadic: 'Triadic',
    },
    contrast: 'Contrast',
    contrastHint: 'Higher contrast makes the text easier to read.',
    contrasts: { standard: 'Standard', medium: 'Medium', high: 'High' },
    /** A color changed by hand while they are made from the source color. */
    turnedOff: 'The generator no longer makes the colors, so you can change them yourself',
    /** checkSite.ts: a wrong value in the choice in the file ('dynamic.variant: "rød"'). */
    wrongAt: (where: string) => `Wrong value: ${where}`,
  },
  /** Each page's colors as it was built, shown in the modes while an app changes the pages' colors (hooks/page-colors.ts). */
  pages: {
    intro: "Each page's colors, as they were when the website was last updated.",
    /** At the top of the modes: the apps that give the pages their colors, by their names, and the way to the site's
     * own, the fallback. */
    title: "Colors from the pages' pictures",
    byApps: (apps: string) => `${apps} gives the pages colors from their pictures. Where it doesn’t, the fallback colors are used.`,
    showFallback: 'Show fallback colors',
    /** The page with the site's own colors (FALLBACK_ROUTE), and what they are. */
    fallback: 'Fallback colors',
    fallbackIntro: (apps: string) => `The website’s own colors are used on pages where ${apps} doesn’t give colors.`,
    apps: 'Apps',
    fromApp: 'Colors from a picture',
    own: "The website's colors",
    loading: "Loading the pages' colors…",
    missing: "The pages' colors can be seen in a few minutes",
    /** The colors of a page in a row, read out (the accent color, the light color, the background and the text). */
    swatches: (mode: string) => `The colors in ${mode.toLowerCase()}`,
  },
  standard: 'Reset to default colors',
  standardHint: 'Takes effect when you save.',
  icons: 'Edit the logo and icon under Appearance › Logo and icon.',
  /** The commit, in the site's language (siteT). */
  commit: 'Editor: new colors',
};
