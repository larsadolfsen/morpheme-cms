// What "List" and "Segmented list" share (owner, 16 Nov 2026: "The white list is the correct one": the two are one block that differs only in its
// look, so a row has the same fields, the same texts, and is edited the same way in both): the row's fields, the texts of the typed-in-place
// toolbar and the add action, and the row's `inline` settings. The List's way is the reference: a link icon button at the end of the active row
// (the toolbar's Link too), the row's other settings in its sheet, `Add list row` under the last row. The two blocks differ only in what they
// show (`buttons` of a row that folds out, a page title for a row with a page and no heading) and in the look (the theme's CSS).
import { iconOptions } from '../../icon';
import { iconColorField } from '../../iconColor';
import { t } from '../../i18n';
import type { Field } from '../../schema';
import type { InlineSpec } from '../../blocks';

/** The texts of a list typed in place (the one `t.blocks.list`): the same words in both looks. */
export const listTexts = {
  addAbove: t.blocks.list.addAbove,
  addBelow: t.blocks.list.addBelow,
  link: t.blocks.list.link,
  row: t.blocks.list.row,
  settings: t.blocks.list.rowSettings,
  icon: t.blocks.list.icon,
};

/** A row's fields, in the sheet's order. `buttons`: the text button at the bottom of a row that folds out (Segmented list). `pageTitle`: a row with
 * a page may have no heading and then shows the page's title (List); else the heading is required. */
export const listRowFields = ({ buttons, pageTitle }: { buttons?: boolean; pageTitle?: boolean }): Field[] => [
  // The color comes first, so it is chosen before the icons below it.
  iconColorField,
  { name: 'icon', label: t.blocks.list.icon, type: 'select', icons: true, options: iconOptions(t.blocks.icons) },
  pageTitle
    ? { name: 'title', label: t.blocks.list.title, type: 'string', hint: t.blocks.list.titleHint }
    : { name: 'title', label: t.blocks.list.title, type: 'string', required: true },
  { name: 'text', label: t.blocks.list.text, type: 'text' },
  { name: 'href', label: t.blocks.list.href, type: 'relation', to: 'pages', hint: t.blocks.list.hrefHint },
  ...(buttons
    ? ([
        // Text buttons at the bottom of an open row (the "more" links of an old Accordion); drawn in a list that folds out.
        {
          name: 'buttons',
          label: t.blocks.segmented.rowButtons,
          singular: t.blocks.segmented.rowButton,
          hint: t.blocks.segmented.rowButtonsHint,
          type: 'list',
          maxItems: 1,
          summary: 'label',
          fields: [
            { name: 'label', label: t.blocks.segmented.rowButtonText, type: 'string', max: 30, required: true },
            { name: 'href', label: t.blocks.list.href, type: 'relation', to: 'pages', required: true },
          ],
        },
      ] as Field[])
    : []),
];

/** How a list's rows are typed in place: the heading and the text where they stand, the icon in a slot, the page (and a row's buttons) in the
 * row's sheet, which the link slot and the toolbar's Link open. */
export const listInline = ({ buttons }: { buttons?: boolean }): InlineSpec => ({
  item: 'items',
  fields: ['title', 'text'],
  media: ['icon', 'iconColor'],
  ...(buttons ? { settings: ['href', 'buttons'] } : { link: 'href' }),
  texts: listTexts,
});
