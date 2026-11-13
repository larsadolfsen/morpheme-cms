// The color of an icon in a row or a card (`iconColor`): one of the site's color roles. Nothing is chosen until the owner picks one: the theme
// draws Primary then, but the picker shows no segment as chosen; choosing the chosen segment again returns to no colour. One field for every block that has icons (List, Segmented list, Cards), so they behave the same. The theme draws it
// (theme/styles/blocks.css, `data-icon-color`), so it follows the theme's colors in the editor, the Preview and on the site.
import { t } from './i18n';
import type { Field } from './schema';

export const iconColors = ['secondary', 'tertiary'] as const;

/** A saved `iconColor` as the theme draws it: a role, or undefined (the default Primary, a saved 'primary' and anything else). */
export const iconColorOf = (value: unknown): string | undefined => iconColors.find((c) => c === value);

/** The field, next to an `icon`: always there where icons are offered (a block adds its own `only`, e.g. while Media is Icon). */
export const iconColorField: Field = {
  name: 'iconColor',
  label: t.blocks.iconColor.label,
  type: 'select',
  segments: true,
  deselect: true,
  options: [
    { label: t.blocks.iconColor.primary, value: 'primary', swatch: 'var(--mo-primary)' },
    { label: t.blocks.iconColor.secondary, value: 'secondary', swatch: 'var(--mo-secondary)' },
    { label: t.blocks.iconColor.tertiary, value: 'tertiary', swatch: 'var(--mo-tertiary)' },
  ],
};
