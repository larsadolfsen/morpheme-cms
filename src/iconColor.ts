// The color of an icon in a row or a card (`iconColor`): Text (nothing saved: the theme draws its own colour) or one of the site's color roles.
// One field for every block that has icons (List, Segmented list, Cards), so they behave the same. The theme draws it (theme/styles/blocks.css,
// `data-icon-color`), so it follows the theme's colors in the editor, the Preview and on the site.
import { t } from './i18n';
import type { Field } from './schema';
import { lowOnPage, type Dynamic } from '../lib/dynamic-colors';

/** The colour roles an icon can have (a saved `iconColor`); Text is none saved. */
export const iconColors = ['primary', 'secondary', 'tertiary'] as const;

/** A saved `iconColor` as the theme draws it: a role, or undefined (Text, and anything else). */
export const iconColorOf = (value: unknown): string | undefined => iconColors.find((c) => c === value);

/** The choices, in order: Text is the default (no value). A choice too pale on the page is left out by `iconColorOptions` below. */
export const iconColorChoices = [
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
  options: iconColorChoices,
  iconColor: true,
};

/** The roles that can be too pale (Text and Primary stay in the picker). */
const iconColorsOnPage = ['secondary', 'tertiary'] as const;

/** The icon colors that fall below 3:1 on the page (Surface, light and dark) with the site's colors, so they are not offered (M3,
 * "Color contrast": graphics 3:1). Only Custom colors can: a harmony's Secondary and Tertiary are Material's tones. */
export const lowIconColors = (dynamic: Dynamic | undefined): (typeof iconColorsOnPage)[number][] =>
  dynamic?.harmony === 'custom' ? iconColorsOnPage.filter((c) => lowOnPage(dynamic, c)) : [];

/** The field's options for the colors the site has: a low color is left out (`stored`: not offered, but shown while chosen, so a saved
 * one keeps its color and is marked). `low` is the saved color when it is now below 3:1, for the warning in the field. */
export function iconColorOptions(field: Field, low: readonly string[] | undefined, saved: string) {
  const options = (field.options ?? []).map((o) => (low?.includes(o.value) ? { ...o, stored: true } : o));
  const flagged = options.find((o) => o.value === saved && o.stored && low?.includes(saved));
  return { options, low: flagged?.label };
}
