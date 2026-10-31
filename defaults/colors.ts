// A site's colours under "Indstillinger › Farver" (packages/editor/src/Colors.tsx): the colours there
// are, by their CSS variable in the theme (without "--"), the pairs that must be readable
// (WCAG AA, checked before a save and before the build), and the colours a site has until it is given its own
// ("Brug standardfarverne"), and the Material colour role each takes when they are made from one source
// colour (dynamic colour, @interstellarcms/cms/lib/dynamic-colors.ts). The colours themselves are in
// src/data/colors.json (config.colors).
import type { ColorPair, Colors } from '../lib/colors';
import { dynamicColors, type ColorRoles } from '../lib/dynamic-colors';

/** The colours, in the order they are shown, with what they are used for. */
export const colorFields: { name: string; label: string; hint: string }[] = [
  { name: 'bg', label: 'Baggrund', hint: 'Bag hele siden.' },
  { name: 'surface', label: 'Flader', hint: 'Kort, felter og menuer.' },
  { name: 'surface-container-lowest', label: 'Flade (lavest)', hint: 'Flader med mindst vægt.' },
  { name: 'surface-container-low', label: 'Flade (lav)', hint: 'Kort med skygge, blokke og ark.' },
  { name: 'surface-container', label: 'Flade (mellem)', hint: 'Menuer og bjælker.' },
  { name: 'surface-container-high', label: 'Flade (høj)', hint: 'Dialoger og søgefeltet.' },
  { name: 'surface-container-highest', label: 'Flade (højest)', hint: 'Udfyldte kort, felter og kontakter.' },
  { name: 'inverse-surface', label: 'Omvendt flade', hint: 'Beskeder nederst og korte tooltips.' },
  { name: 'inverse-on-surface', label: 'Tekst på omvendt flade', hint: 'Teksten og ikonerne på den omvendte flade.' },
  { name: 'inverse-primary', label: 'Accentfarve på omvendt flade', hint: 'Knapperne på beskederne nederst.' },
  { name: 'tint', label: 'Lys farve', hint: 'Lyse bokse og markeringer.' },
  { name: 'ink', label: 'Tekst', hint: 'Al almindelig tekst og overskrifter.' },
  { name: 'muted', label: 'Stille tekst', hint: 'Undertekster, datoer og noter.' },
  { name: 'line', label: 'Streger', hint: 'Skillelinjer og kanten om kort.' },
  { name: 'outline', label: 'Kanter', hint: 'Kanten om felter, knapper og chips.' },
  { name: 'accent', label: 'Accentfarve', hint: 'Knapper, links, ikoner og logoet.' },
  { name: 'accent-hover', label: 'Accentfarve under musen', hint: 'En knap, musen er over: lidt mørkere (i mørk tilstand lysere).' },
  { name: 'on-accent', label: 'Tekst på accentfarven', hint: 'Teksten på knapperne.' },
  { name: 'accent-container', label: 'Lys accentfarve', hint: 'Knapper og flader i en lys udgave af accentfarven.' },
  { name: 'on-accent-container', label: 'Tekst på lys accentfarve', hint: 'Teksten og ikonerne på den lyse accentfarve.' },
  { name: 'secondary', label: 'Sekundær farve', hint: 'Knapper i en anden farve end accentfarven.' },
  { name: 'on-secondary', label: 'Tekst på sekundær farve', hint: 'Teksten og ikonerne på den sekundære farve.' },
  { name: 'secondary-container', label: 'Lys sekundær farve', hint: 'Knapper og flader i en lys udgave af den sekundære farve.' },
  { name: 'on-secondary-container', label: 'Tekst på lys sekundær farve', hint: 'Teksten og ikonerne på den lyse sekundære farve.' },
  { name: 'tertiary', label: 'Tertiær farve', hint: 'Knapper i en tredje farve, der skiller sig ud fra de to andre.' },
  { name: 'on-tertiary', label: 'Tekst på tertiær farve', hint: 'Teksten og ikonerne på den tertiære farve.' },
  { name: 'tertiary-container', label: 'Lys tertiær farve', hint: 'Knapper og flader i en lys udgave af den tertiære farve.' },
  { name: 'on-tertiary-container', label: 'Tekst på lys tertiær farve', hint: 'Teksten og ikonerne på den lyse tertiære farve.' },
  { name: 'error', label: 'Fejlfarve', hint: 'Fejl i felter og mærker.' },
  { name: 'on-error', label: 'Tekst på fejlfarven', hint: 'Teksten og ikonerne på fejlfarven.' },
  { name: 'error-container', label: 'Lys fejlfarve', hint: 'Flader i en lys udgave af fejlfarven.' },
  { name: 'on-error-container', label: 'Tekst på lys fejlfarve', hint: 'Teksten og ikonerne på den lyse fejlfarve.' },
];

/** The text and its background that must be readable, in both modes. */
export const colorPairs: ColorPair[] = [
  { text: 'ink', on: 'bg', what: 'Teksten på baggrunden' },
  { text: 'ink', on: 'surface', what: 'Teksten på flader' },
  { text: 'ink', on: 'tint', what: 'Teksten i lyse bokse' },
  { text: 'muted', on: 'bg', what: 'Den stille tekst på baggrunden' },
  { text: 'muted', on: 'surface', what: 'Den stille tekst på flader' },
  { text: 'muted', on: 'tint', what: 'Den stille tekst i lyse bokse' },
  { text: 'ink', on: 'surface-container-lowest', what: 'Teksten på den laveste flade' },
  { text: 'ink', on: 'surface-container-low', what: 'Teksten på den lave flade' },
  { text: 'ink', on: 'surface-container', what: 'Teksten på den mellemste flade' },
  { text: 'ink', on: 'surface-container-high', what: 'Teksten på den høje flade' },
  { text: 'ink', on: 'surface-container-highest', what: 'Teksten på den højeste flade' },
  { text: 'muted', on: 'surface-container-lowest', what: 'Den stille tekst på den laveste flade' },
  { text: 'muted', on: 'surface-container-low', what: 'Den stille tekst på den lave flade' },
  { text: 'muted', on: 'surface-container', what: 'Den stille tekst på den mellemste flade' },
  { text: 'muted', on: 'surface-container-high', what: 'Den stille tekst på den høje flade' },
  { text: 'muted', on: 'surface-container-highest', what: 'Den stille tekst på den højeste flade' },
  { text: 'accent', on: 'bg', what: 'Links på baggrunden' },
  { text: 'accent', on: 'surface', what: 'Links på flader' },
  { text: 'accent', on: 'tint', what: 'Accentfarven i lyse bokse' },
  { text: 'accent', on: 'surface-container-low', what: 'Links på den lave flade' },
  { text: 'on-accent', on: 'accent', what: 'Teksten på knapperne' },
  { text: 'on-accent', on: 'accent-hover', what: 'Teksten på knapperne under musen' },
  { text: 'on-accent-container', on: 'accent-container', what: 'Teksten på den lyse accentfarve' },
  { text: 'on-secondary', on: 'secondary', what: 'Teksten på den sekundære farve' },
  { text: 'on-secondary-container', on: 'secondary-container', what: 'Teksten på den lyse sekundære farve' },
  { text: 'on-tertiary', on: 'tertiary', what: 'Teksten på den tertiære farve' },
  { text: 'on-tertiary-container', on: 'tertiary-container', what: 'Teksten på den lyse tertiære farve' },
  { text: 'error', on: 'bg', what: 'Fejl på baggrunden' },
  { text: 'error', on: 'surface-container-highest', what: 'Fejl i udfyldte felter' },
  { text: 'on-error', on: 'error', what: 'Teksten på fejlfarven' },
  { text: 'on-error-container', on: 'error-container', what: 'Teksten på den lyse fejlfarve' },
  { text: 'inverse-on-surface', on: 'inverse-surface', what: 'Teksten på den omvendte flade' },
  { text: 'inverse-primary', on: 'inverse-surface', what: 'Knapperne på den omvendte flade' },
];

/** The Material colour role of each colour, for dynamic colour: the page on Material's surface, cards a step
 * lighter (white in light mode), the light boxes on a higher container, so text and links can be read on them at
 * every contrast level, Material's surface containers, inverse colours, outline and error colours as themselves (the
 * theme's parts take them, as Material 3's do), buttons and links in the primary colour, and the other colours of the scheme (Material 3's
 * containers, secondary and tertiary: the FABs and their menus) as their own roles. */
export const colorRoles: ColorRoles = {
  bg: 'surface',
  surface: { light: 'surfaceContainerLowest', dark: 'surfaceContainerLow' },
  'surface-container-lowest': 'surfaceContainerLowest',
  'surface-container-low': 'surfaceContainerLow',
  'surface-container': 'surfaceContainer',
  'surface-container-high': 'surfaceContainerHigh',
  'surface-container-highest': 'surfaceContainerHighest',
  'inverse-surface': 'inverseSurface',
  'inverse-on-surface': 'inverseOnSurface',
  'inverse-primary': 'inversePrimary',
  tint: 'surfaceContainerHigh',
  ink: 'onSurface',
  muted: 'onSurfaceVariant',
  line: 'outlineVariant',
  outline: 'outline',
  accent: 'primary',
  'accent-hover': 'primaryHover',
  'on-accent': 'onPrimary',
  'accent-container': 'primaryContainer',
  'on-accent-container': 'onPrimaryContainer',
  secondary: 'secondary',
  'on-secondary': 'onSecondary',
  'secondary-container': 'secondaryContainer',
  'on-secondary-container': 'onSecondaryContainer',
  tertiary: 'tertiary',
  'on-tertiary': 'onTertiary',
  'tertiary-container': 'tertiaryContainer',
  'on-tertiary-container': 'onTertiaryContainer',
  error: 'error',
  'on-error': 'onError',
  'error-container': 'errorContainer',
  'on-error-container': 'onErrorContainer',
};

/** The colours a site has until it is given its own ("Brug standardfarverne"): Material 3's scheme of a blue (tonal
 * spot), as the app store's pictures are taken with (packages/editor/scripts/app-screenshots.mjs). */
export const defaultColors: Colors = dynamicColors({ source: '#1a73e8', variant: 'tonalSpot', contrast: 'standard' }, colorRoles);
