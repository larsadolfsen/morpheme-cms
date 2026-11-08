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
  { name: 'surface', label: 'Surface (cards)', hint: 'Cards, fields, and menus.' },
  { name: 'surface-dim', label: 'Surface dim', hint: 'The darkest surface, in light and dark mode.' },
  { name: 'surface-default', label: 'Surface', hint: 'The standard surface, between Surface dim and Surface bright.' },
  { name: 'surface-bright', label: 'Surface bright', hint: 'The lightest surface, in light and dark mode.' },
  { name: 'surface-container-lowest', label: 'Surface container lowest', hint: 'Surfaces with the least emphasis.' },
  { name: 'surface-container-low', label: 'Surface container low', hint: 'Cards with a shadow, blocks, and sheets.' },
  { name: 'surface-container', label: 'Surface container', hint: 'Menus and bars.' },
  { name: 'surface-container-high', label: 'Surface container high', hint: 'Dialogs and the search field.' },
  { name: 'surface-container-highest', label: 'Surface container highest', hint: 'Filled cards, fields, and switches.' },
  { name: 'inverse-surface', label: 'Inverse surface', hint: 'Messages at the bottom and short tooltips.' },
  { name: 'inverse-on-surface', label: 'Inverse on surface', hint: 'The text and icons on Inverse surface.' },
  { name: 'inverse-primary', label: 'Inverse primary', hint: 'The buttons on the messages at the bottom.' },
  { name: 'tint', label: 'Tint', hint: 'Light boxes and highlights.' },
  { name: 'ink', label: 'On surface', hint: 'All regular text and headings.' },
  { name: 'muted', label: 'On surface variant', hint: 'Subtitles, dates, and notes.' },
  { name: 'line', label: 'Outline variant', hint: 'Dividers and the edge around cards.' },
  { name: 'outline', label: 'Outline', hint: 'The edge around fields, buttons, and chips.' },
  { name: 'accent', label: 'Primary', hint: 'Buttons, links, icons, and the logo.' },
  { name: 'accent-hover', label: 'Primary hover', hint: 'A button the pointer is over: a little darker (lighter in dark mode).' },
  { name: 'on-accent', label: 'On primary', hint: 'The text and icons on Primary.' },
  { name: 'accent-container', label: 'Primary container', hint: 'Buttons and surfaces in a light version of Primary.' },
  { name: 'on-accent-container', label: 'On primary container', hint: 'The text and icons on Primary container.' },
  { name: 'secondary', label: 'Secondary', hint: 'Buttons in a different color than Primary.' },
  { name: 'on-secondary', label: 'On secondary', hint: 'The text and icons on Secondary.' },
  { name: 'secondary-container', label: 'Secondary container', hint: 'Buttons and surfaces in a light version of Secondary.' },
  { name: 'on-secondary-container', label: 'On secondary container', hint: 'The text and icons on Secondary container.' },
  { name: 'tertiary', label: 'Tertiary', hint: 'Buttons in a third color that stands out from Primary and Secondary.' },
  { name: 'on-tertiary', label: 'On tertiary', hint: 'The text and icons on Tertiary.' },
  { name: 'tertiary-container', label: 'Tertiary container', hint: 'Buttons and surfaces in a light version of Tertiary.' },
  { name: 'on-tertiary-container', label: 'On tertiary container', hint: 'The text and icons on Tertiary container.' },
  { name: 'error', label: 'Error', hint: 'Errors in fields and badges.' },
  { name: 'on-error', label: 'On error', hint: 'The text and icons on Error.' },
  { name: 'error-container', label: 'Error container', hint: 'Surfaces in a light version of Error.' },
  { name: 'on-error-container', label: 'On error container', hint: 'The text and icons on Error container.' },
];

/** The text and its background that must be readable, in both modes. */
export const colorPairs: ColorPair[] = [
  { text: 'ink', on: 'bg', what: 'On surface on Background' },
  { text: 'ink', on: 'surface', what: 'On surface on Surface (cards)' },
  { text: 'ink', on: 'tint', what: 'On surface on Tint' },
  { text: 'muted', on: 'bg', what: 'On surface variant on Background' },
  { text: 'muted', on: 'surface', what: 'On surface variant on Surface (cards)' },
  { text: 'muted', on: 'tint', what: 'On surface variant on Tint' },
  { text: 'ink', on: 'surface-dim', what: 'On surface on Surface dim' },
  { text: 'ink', on: 'surface-default', what: 'On surface on Surface' },
  { text: 'ink', on: 'surface-bright', what: 'On surface on Surface bright' },
  { text: 'muted', on: 'surface-dim', what: 'On surface variant on Surface dim' },
  { text: 'muted', on: 'surface-default', what: 'On surface variant on Surface' },
  { text: 'muted', on: 'surface-bright', what: 'On surface variant on Surface bright' },
  { text: 'ink', on: 'surface-container-lowest', what: 'On surface on Surface container lowest' },
  { text: 'ink', on: 'surface-container-low', what: 'On surface on Surface container low' },
  { text: 'ink', on: 'surface-container', what: 'On surface on Surface container' },
  { text: 'ink', on: 'surface-container-high', what: 'On surface on Surface container high' },
  { text: 'ink', on: 'surface-container-highest', what: 'On surface on Surface container highest' },
  { text: 'muted', on: 'surface-container-lowest', what: 'On surface variant on Surface container lowest' },
  { text: 'muted', on: 'surface-container-low', what: 'On surface variant on Surface container low' },
  { text: 'muted', on: 'surface-container', what: 'On surface variant on Surface container' },
  { text: 'muted', on: 'surface-container-high', what: 'On surface variant on Surface container high' },
  { text: 'muted', on: 'surface-container-highest', what: 'On surface variant on Surface container highest' },
  { text: 'accent', on: 'bg', what: 'Primary on Background' },
  { text: 'accent', on: 'surface', what: 'Primary on Surface (cards)' },
  { text: 'accent', on: 'tint', what: 'Primary on Tint' },
  { text: 'accent', on: 'surface-container-low', what: 'Primary on Surface container low' },
  { text: 'on-accent', on: 'accent', what: 'On primary on Primary' },
  { text: 'on-accent', on: 'accent-hover', what: 'On primary on Primary hover' },
  { text: 'on-accent-container', on: 'accent-container', what: 'On primary container on Primary container' },
  { text: 'on-secondary', on: 'secondary', what: 'On secondary on Secondary' },
  { text: 'on-secondary-container', on: 'secondary-container', what: 'On secondary container on Secondary container' },
  { text: 'on-tertiary', on: 'tertiary', what: 'On tertiary on Tertiary' },
  { text: 'on-tertiary-container', on: 'tertiary-container', what: 'On tertiary container on Tertiary container' },
  { text: 'error', on: 'bg', what: 'Error on Background' },
  { text: 'error', on: 'surface-container-highest', what: 'Error on Surface container highest' },
  { text: 'on-error', on: 'error', what: 'On error on Error' },
  { text: 'on-error-container', on: 'error-container', what: 'On error container on Error container' },
  { text: 'inverse-on-surface', on: 'inverse-surface', what: 'Inverse on surface on Inverse surface' },
  { text: 'inverse-primary', on: 'inverse-surface', what: 'Inverse primary on Inverse surface' },
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
