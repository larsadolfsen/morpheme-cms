// The color of an icon in a row or a card (`iconColor`): one of the site's color roles, Primary when none is picked (the icon's own color
// in the theme). One field for every block that has icons (List, Segmented list, Cards), so they behave the same. The theme draws it
// (theme/styles/blocks.css, `data-icon-color`), so it follows the theme's colors in the editor, the Preview and on the site.
import { t } from './i18n';
import type { Field } from './schema';

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
    { label: t.blocks.iconColor.primary, value: '' },
    { label: t.blocks.iconColor.secondary, value: 'secondary' },
    { label: t.blocks.iconColor.tertiary, value: 'tertiary' },
  ],
  only: { field: 'icon', is: [''], not: true },
};
