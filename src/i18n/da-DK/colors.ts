// "Farver" (Colors.tsx): the site's colours in light and dark mode.
export const colors = {
  intro: 'Hjemmesidens farver i lys og mørk tilstand.',
  light: 'Lys tilstand',
  dark: 'Mørk tilstand',
  /** The switch between the modes, for screen readers. */
  modes: 'Tilstand',
  /** The little page drawn in a mode's colours. */
  preview: {
    title: (mode: string) => `Eksempel: ${mode.toLowerCase()}`,
    heading: 'En overskrift',
    text: 'Sekundær tekst, fx en dato.',
    link: 'Et link',
    card: 'Tekst på en flade.',
    box: 'En lys boks',
    button: 'Book en tid',
  },
  /** A pair that is too hard to read: what it is (the site's words), its contrast and the least it needs. */
  tooLow: (what: string, ratio: string, min: string) =>
    `For lav kontrast: ${what.charAt(0).toLowerCase()}${what.slice(1)} (${ratio}, mindst ${min}).`,
  /** checkSite.ts: a colour in the file that is not one ('dark.accent: "rød"'). */
  notAColorAt: (where: string) => `Ikke en farve: ${where}`,
  cannotSave: 'Nogle farver har for lav kontrast. Ret dem, der er markeret med rødt.',
  unreadable: 'Farverne kunne ikke læses. Standardfarverne vises.',
  /** Dynamic colour (Material 3): all the colours made from one source colour. */
  dynamic: {
    title: 'Dynamiske farver',
    enabled: 'Aktiveret',
    on: 'Til',
    off: 'Fra',
    hint: 'Alle farver i begge tilstande laves ud fra én kildefarve.',
    source: 'Kildefarve',
    sourceHint: 'Farverne laves ud fra den.',
    fromPicture: 'Fra et billede',
    fromPictureDone: 'Kildefarven er taget fra billedet.',
    /** A picture without colour enough to make the colours from (a grey one). */
    noColorInPicture: 'Billedet har ingen farve, der kan bruges som kildefarve.',
    variant: 'Variant',
    variantHint: 'Hvor meget farve der er i fladerne, teksten og accentfarven.',
    /** Material's scheme variants (lib/dynamic-colors.ts VARIANTS). */
    variants: {
      tonalSpot: 'Afdæmpet (standard)',
      neutral: 'Neutral',
      vibrant: 'Livlig',
      expressive: 'Ekspressiv',
      fidelity: 'Tro mod kildefarven',
      content: 'Som indholdet',
      monochrome: 'Gråtoner',
      rainbow: 'Regnbue',
      fruitSalad: 'Frugtsalat',
    },
    contrast: 'Kontrast',
    contrastHint: 'Højere kontrast gør teksten lettere at læse.',
    contrasts: { standard: 'Standard', medium: 'Mellem', high: 'Høj' },
    /** A colour changed by hand while they are made from the source colour. */
    turnedOff: 'Dynamiske farver er slået fra, så du kan rette farverne selv.',
    /** The heading over the colours, one by one. */
    colors: 'Farverne',
    /** checkSite.ts: a wrong value in the choice in the file ('dynamic.variant: "rød"'). */
    wrongAt: (where: string) => `Forkert værdi: ${where}`,
  },
  /** Each page's colours as it was built, shown in the modes while an app changes the pages' colours (hooks/page-colors.ts). */
  pages: {
    intro: 'Hver sides farver, som de var, da hjemmesiden sidst blev bygget.',
    /** At the top of the modes: the apps that give the pages their colours, by their names, and the way to the site's
     * own, the fallback. */
    title: 'Farver fra sidernes billeder',
    byApps: (apps: string) => `${apps} giver siderne farver fra deres billeder. Hvor den ikke gør, bruges reservefarverne.`,
    showFallback: 'Vis reservefarver',
    /** The page with the site's own colours (FALLBACK_ROUTE), and what they are. */
    fallback: 'Reservefarver',
    fallbackIntro: (apps: string) => `Farverne bruges på de sider, ${apps} ikke giver farver.`,
    apps: 'Apps',
    fromApp: 'Farver fra et billede',
    own: 'Hjemmesidens farver',
    loading: 'Henter sidernes farver',
    missing: 'Sidernes farver kan ses, når hjemmesiden er bygget.',
    /** The colours of a page in a row, read out (the accent colour, the light colour, the background and the text). */
    swatches: (mode: string) => `Farverne i ${mode.toLowerCase()}`,
  },
  standard: 'Nulstil til standardfarver',
  standardHint: 'Gælder, når du gemmer.',
  icons: 'Logo og ikon ændres under Udseende › Logo og ikon.',
  /** The commit, in the site's language (siteT). */
  commit: 'Editor: nye farver',
};
