// A site's colors under "Settings › Colors" (packages/editor/src/Colors.tsx): the colors there
// are, by their CSS variable in the theme (without "--"), the pairs that must be readable
// (WCAG AA, checked before a save and before the build), and the colors a site has until it is given its own
// ("Use standard colors"), and the Material color role each takes when they are made from one source
// color (dynamic color, @morphemecms/cms/lib/dynamic-colors.ts). The colors themselves are in
// src/data/colors.json (config.colors).
import type { ColorPair, Colors } from '../lib/colors';
import { dynamicColors, type ColorRoles } from '../lib/dynamic-colors';

/** The colors, in the order they are shown, with what they are used for. */
export const colorFields: { name: string; label: string; hint: string }[] = [
  { name: 'bg', label: 'Background', hint: 'Behind the whole page.' },
  { name: 'surface', label: 'Surfaces', hint: 'Cards, fields, and menus.' },
  { name: 'surface-dim', label: 'Surface (dim)', hint: 'The darkest surface, in light and dark mode.' },
  { name: 'surface-default', label: 'Surface (default)', hint: 'The standard surface, between the dim and the bright one.' },
  { name: 'surface-bright', label: 'Surface (bright)', hint: 'The lightest surface, in light and dark mode.' },
  { name: 'surface-container-lowest', label: 'Surface (lowest)', hint: 'Surfaces with the least emphasis.' },
  { name: 'surface-container-low', label: 'Surface (low)', hint: 'Cards with a shadow, blocks, and sheets.' },
  { name: 'surface-container', label: 'Surface (medium)', hint: 'Menus and bars.' },
  { name: 'surface-container-high', label: 'Surface (high)', hint: 'Dialogs and the search field.' },
  { name: 'surface-container-highest', label: 'Surface (highest)', hint: 'Filled cards, fields, and switches.' },
  { name: 'inverse-surface', label: 'Inverse surface', hint: 'Messages at the bottom and short tooltips.' },
  { name: 'inverse-on-surface', label: 'Text on inverse surface', hint: 'The text and icons on the inverse surface.' },
  { name: 'inverse-primary', label: 'Accent color on inverse surface', hint: 'The buttons on the messages at the bottom.' },
  { name: 'tint', label: 'Light color', hint: 'Light boxes and highlights.' },
  { name: 'ink', label: 'Text', hint: 'All regular text and headings.' },
  { name: 'muted', label: 'Muted text', hint: 'Subtitles, dates, and notes.' },
  { name: 'line', label: 'Lines', hint: 'Dividers and the edge around cards.' },
  { name: 'outline', label: 'Outlines', hint: 'The edge around fields, buttons, and chips.' },
  { name: 'accent', label: 'Accent color', hint: 'Buttons, links, icons, and the logo.' },
  { name: 'accent-hover', label: 'Accent color on hover', hint: 'A button the pointer is over: a little darker (lighter in dark mode).' },
  { name: 'on-accent', label: 'Text on accent color', hint: 'The text on the buttons.' },
  { name: 'accent-container', label: 'Light accent color', hint: 'Buttons and surfaces in a light version of the accent color.' },
  { name: 'on-accent-container', label: 'Text on light accent color', hint: 'The text and icons on the light accent color.' },
  { name: 'secondary', label: 'Secondary color', hint: 'Buttons in a different color than the accent color.' },
  { name: 'on-secondary', label: 'Text on secondary color', hint: 'The text and icons on the secondary color.' },
  { name: 'secondary-container', label: 'Light secondary color', hint: 'Buttons and surfaces in a light version of the secondary color.' },
  { name: 'on-secondary-container', label: 'Text on light secondary color', hint: 'The text and icons on the light secondary color.' },
  { name: 'tertiary', label: 'Tertiary color', hint: 'Buttons in a third color that stands out from the other two.' },
  { name: 'on-tertiary', label: 'Text on tertiary color', hint: 'The text and icons on the tertiary color.' },
  { name: 'tertiary-container', label: 'Light tertiary color', hint: 'Buttons and surfaces in a light version of the tertiary color.' },
  { name: 'on-tertiary-container', label: 'Text on light tertiary color', hint: 'The text and icons on the light tertiary color.' },
  { name: 'error', label: 'Error color', hint: 'Errors in fields and badges.' },
  { name: 'on-error', label: 'Text on error color', hint: 'The text and icons on the error color.' },
  { name: 'error-container', label: 'Light error color', hint: 'Surfaces in a light version of the error color.' },
  { name: 'on-error-container', label: 'Text on light error color', hint: 'The text and icons on the light error color.' },
];

/** The text and its background that must be readable, in both modes. */
export const colorPairs: ColorPair[] = [
  { text: 'ink', on: 'bg', what: 'Text on the background' },
  { text: 'ink', on: 'surface', what: 'Text on surfaces' },
  { text: 'ink', on: 'tint', what: 'Text in light boxes' },
  { text: 'muted', on: 'bg', what: 'Muted text on the background' },
  { text: 'muted', on: 'surface', what: 'Muted text on surfaces' },
  { text: 'muted', on: 'tint', what: 'Muted text in light boxes' },
  { text: 'ink', on: 'surface-dim', what: 'Text on the dim surface' },
  { text: 'ink', on: 'surface-default', what: 'Text on the default surface' },
  { text: 'ink', on: 'surface-bright', what: 'Text on the bright surface' },
  { text: 'muted', on: 'surface-dim', what: 'Muted text on the dim surface' },
  { text: 'muted', on: 'surface-default', what: 'Muted text on the default surface' },
  { text: 'muted', on: 'surface-bright', what: 'Muted text on the bright surface' },
  { text: 'ink', on: 'surface-container-lowest', what: 'Text on the lowest surface' },
  { text: 'ink', on: 'surface-container-low', what: 'Text on the low surface' },
  { text: 'ink', on: 'surface-container', what: 'Text on the medium surface' },
  { text: 'ink', on: 'surface-container-high', what: 'Text on the high surface' },
  { text: 'ink', on: 'surface-container-highest', what: 'Text on the highest surface' },
  { text: 'muted', on: 'surface-container-lowest', what: 'Muted text on the lowest surface' },
  { text: 'muted', on: 'surface-container-low', what: 'Muted text on the low surface' },
  { text: 'muted', on: 'surface-container', what: 'Muted text on the medium surface' },
  { text: 'muted', on: 'surface-container-high', what: 'Muted text on the high surface' },
  { text: 'muted', on: 'surface-container-highest', what: 'Muted text on the highest surface' },
  { text: 'accent', on: 'bg', what: 'Links on the background' },
  { text: 'accent', on: 'surface', what: 'Links on surfaces' },
  { text: 'accent', on: 'tint', what: 'The accent color in light boxes' },
  { text: 'accent', on: 'surface-container-low', what: 'Links on the low surface' },
  { text: 'on-accent', on: 'accent', what: 'Text on buttons' },
  { text: 'on-accent', on: 'accent-hover', what: 'Text on buttons on hover' },
  { text: 'on-accent-container', on: 'accent-container', what: 'Text on the light accent color' },
  { text: 'on-secondary', on: 'secondary', what: 'Text on the secondary color' },
  { text: 'on-secondary-container', on: 'secondary-container', what: 'Text on the light secondary color' },
  { text: 'on-tertiary', on: 'tertiary', what: 'Text on the tertiary color' },
  { text: 'on-tertiary-container', on: 'tertiary-container', what: 'Text on the light tertiary color' },
  { text: 'error', on: 'bg', what: 'Errors on the background' },
  { text: 'error', on: 'surface-container-highest', what: 'Errors in filled fields' },
  { text: 'on-error', on: 'error', what: 'Text on the error color' },
  { text: 'on-error-container', on: 'error-container', what: 'Text on the light error color' },
  { text: 'inverse-on-surface', on: 'inverse-surface', what: 'Text on the inverse surface' },
  { text: 'inverse-primary', on: 'inverse-surface', what: 'Buttons on the inverse surface' },
];

/** The Material color role of each color, for dynamic color: the page on Material's surface bright, cards a step
 * lighter (white in light mode), the light boxes on a higher container, so text and links can be read on them at
 * every contrast level, Material's three surfaces (dim, default and bright), its surface containers, inverse colors, outline and error colors as themselves (the
 * theme's parts take them, as Material 3's do), buttons and links in the primary color, and the other colors of the scheme (Material 3's
 * containers, secondary and tertiary: the FABs and their menus) as their own roles. */
export const colorRoles: ColorRoles = {
  bg: 'surfaceBright',
  surface: { light: 'surfaceContainerLowest', dark: 'surfaceContainerLow' },
  'surface-dim': 'surfaceDim',
  'surface-default': 'surface',
  'surface-bright': 'surfaceBright',
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

/** The colors a site has until it is given its own ("Use standard colors"): Material 3's scheme of a blue (tonal
 * spot), as the app store's pictures are taken with (packages/editor/scripts/app-screenshots.mjs). */
export const defaultColors: Colors = dynamicColors({ source: '#1a73e8', variant: 'tonalSpot', contrast: 'standard' }, colorRoles);
