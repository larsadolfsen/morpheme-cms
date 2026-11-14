// The color of an icon in a row or a card (`iconColor`): one of the site's color roles, Primary when none is picked (the icon's own color
// in the theme). One field for every block that has icons (List, Segmented list, Cards), so they behave the same. The theme draws it
// (theme/styles/blocks.css, `data-icon-color`), so it follows the theme's colors in the editor, the Preview and on the site.
import { t } from './i18n';
import type { Field } from './schema';
import { lowOnPage, type Dynamic } from '../lib/dynamic-colors';

export const iconColors = ['secondary', 'tertiary'] as const;

/** A saved `iconColor` as the theme draws it: a role, or undefined (Primary, and anything else). */
export const iconColorOf = (value: unknown): string | undefined => iconColors.find((c) => c === value);

/** The field, next to an `icon` (only while it has an icon). */
export const iconColorField: Field = {
  name: 'iconColor',
  label: t.blocks.iconColor.label,
  type: 'select',
  segments: true,
  options: [
    { label: t.blocks.iconColor.primary, value: '', swatch: 'var(--mo-primary)' },
    { label: t.blocks.iconColor.secondary, value: 'secondary', swatch: 'var(--mo-secondary)' },
    { label: t.blocks.iconColor.tertiary, value: 'tertiary', swatch: 'var(--mo-tertiary)' },
  ],
  only: { field: 'icon', is: [''], not: true },
  iconColor: true,
};

/** The icon colors that fall below 3:1 on the page (Surface, light and dark) with the site's colors, so they are not offered (M3,
 * "Color contrast": graphics 3:1). Only Custom colors can: a harmony's Secondary and Tertiary are Material's tones. */
export const lowIconColors = (dynamic: Dynamic | undefined): (typeof iconColors)[number][] =>
  dynamic?.harmony === 'custom' ? iconColors.filter((c) => lowOnPage(dynamic, c)) : [];

/** The field's options for the colors the site has: a low color is left out (`stored`: not offered, but shown while chosen, so a saved
 * one keeps its color and is marked). `low` is the saved color when it is now below 3:1, for the warning in the field. */
export function iconColorOptions(field: Field, low: readonly string[] | undefined, saved: string) {
  const options = (field.options ?? []).map((o) => (low?.includes(o.value) ? { ...o, stored: true } : o));
  const flagged = options.find((o) => o.value === saved && o.stored && low?.includes(saved));
  return { options, low: flagged?.label };
}
