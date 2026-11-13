// The color of an icon in a row or a card (`iconColor`): Text (nothing saved: the theme draws its own colour) or one of the site's color roles.
// One field for every block that has icons (List, Segmented list, Cards), so they behave the same. The theme draws it (theme/styles/blocks.css,
// `data-icon-color`), so it follows the theme's colors in the editor, the Preview and on the site.
import { t } from './i18n';
import type { Field } from './schema';

/** The colour roles an icon can have (a saved `iconColor`); Text is none saved. */
export const iconColors = ['primary', 'secondary', 'tertiary'] as const;

/** A saved `iconColor` as the theme draws it: a role, or undefined (Text, and anything else). */
export const iconColorOf = (value: unknown): string | undefined => iconColors.find((c) => c === value);

/** The choices, in order: Text is the default (no value). To hide a choice that is too pale on a surface, filter this list. */
export const iconColorOptions = [
  { label: t.blocks.iconColor.text, value: '', swatch: 'var(--mo-on-surface)' },
  { label: t.blocks.iconColor.primary, value: 'primary', swatch: 'var(--mo-primary)' },
  { label: t.blocks.iconColor.secondary, value: 'secondary', swatch: 'var(--mo-secondary)' },
  { label: t.blocks.iconColor.tertiary, value: 'tertiary', swatch: 'var(--mo-tertiary)' },
];

/** The field, next to an `icon`: always there where icons are offered (a block adds its own `only`, e.g. while Media is Icon). */
export const iconColorField: Field = {
  name: 'iconColor',
  label: t.blocks.iconColor.label,
  type: 'select',
  segments: true,
  dots: true,
  options: iconColorOptions,
};
