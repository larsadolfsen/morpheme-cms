// What "List" and "Expandable list" share (owner, 16 Nov 2026: "The white list is the correct one": the two are one block that differs only in its
// look, so a row has the same fields, the same texts, and is edited the same way in both): the row's fields, the texts of the typed-in-place
// toolbar and the add action, and the row's `inline` settings. The List's way is the reference: a link icon button at the end of the active row
// (the toolbar's Link too), the row's other settings in its sheet, `Add list row` under the last row. The two blocks differ only in what they
// show (`buttons` of a row that folds out, a page title for a row with a page and no heading) and in the look (the theme's CSS).
import { iconOptions, materialIcon } from '../../icon';
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

/** The kinds of leading that are an image (the icon is the empty choice). */
export const LEADING_IMAGES = ['avatar', 'square', 'landscape'];

/** What leads the rows: one choice for the whole block, as the media of Cards: an icon (no value), an avatar (the image, or the first letter of the heading
 * without one), a square image or a landscape image. The rows' icon or image fields depend on it. */
export const leadingField: Field = {
  name: 'leading',
  label: t.blocks.list.leading,
  type: 'select',
  segments: true,
  options: [
    { label: t.blocks.list.leadingIcon, value: '', icon: materialIcon('shapes') },
    { label: t.blocks.list.leadingAvatar, value: 'avatar', icon: materialIcon('account_circle') },
    { label: t.blocks.list.leadingSquare, value: 'square', icon: materialIcon('square') },
    { label: t.blocks.list.leadingLandscape, value: 'landscape', icon: materialIcon('rectangle') },
  ],
};

/** A row's fields, in the sheet's order. `buttons`: the text button at the bottom of a row that folds out (Expandable list). `pageTitle`: a row with
 * a page may have no heading and then shows the page's title (List); else the heading is required. */
export const listRowFields = ({ buttons, pageTitle }: { buttons?: boolean; pageTitle?: boolean }): Field[] => [
  // The color comes first, so it is chosen before the icons below it.
  { ...iconColorField, only: { field: 'leading', is: [''] } },
  {
    name: 'icon',
    label: t.blocks.list.icon,
    type: 'select',
    icons: true,
    options: iconOptions(t.blocks.icons),
    only: { field: 'leading', is: [''] },
  },
  { name: 'image', label: t.blocks.list.image, type: 'image', only: { field: 'leading', is: LEADING_IMAGES } },
  {
    name: 'alt',
    label: t.blocks.picture.alt,
    type: 'string',
    hint: t.blocks.picture.altHint,
    libraryText: 'image',
    only: { field: 'leading', is: LEADING_IMAGES },
  },
  pageTitle
    ? { name: 'title', label: t.blocks.list.title, type: 'string', hint: t.blocks.list.titleHint }
    : { name: 'title', label: t.blocks.list.title, type: 'string', required: true },
  // A row that folds out has Markdown in its text (bold, italic, links, lists), as the answers of the FAQ list had.
  { name: 'text', label: t.blocks.list.text, type: buttons ? 'markdown' : 'text' },
  { name: 'href', label: t.blocks.list.href, type: 'relation', to: 'pages', hint: t.blocks.list.hrefHint },
  ...(buttons
    ? ([
        // Text buttons at the bottom of an open row (the "more" links of an old Accordion); drawn in a list that folds out.
        {
          name: 'buttons',
          label: t.blocks.expand.rowButtons,
          singular: t.blocks.expand.rowButton,
          hint: t.blocks.expand.rowButtonsHint,
          type: 'list',
          maxItems: 1,
          summary: 'label',
          fields: [
            { name: 'label', label: t.blocks.expand.rowButtonText, type: 'string', max: 30, required: true },
            { name: 'href', label: t.blocks.list.href, type: 'relation', to: 'pages', required: true },
          ],
        },
      ] as Field[])
    : []),
];

/** The design of a list (`design`, owner, 16 Nov 2026): the rows on the page, or each row on its own surface, a card (Material 3's standard and
 * segmented styles). No value is the plain design. The same for List and Expandable list. */
export const designField: Field = {
  name: 'design',
  label: t.blocks.list.design,
  type: 'select',
  segments: true,
  options: [
    { label: t.blocks.list.designPlain, value: '', icon: materialIcon('table_rows') },
    { label: t.blocks.list.designSegmented, value: 'segmented', icon: materialIcon('grid_view') },
  ],
};

/** The settings both lists have under their rows: how many rows show at first (`Max rows`, with a button for the rest) and a text button under the
 * last row. */
export const moreFields: Field[] = [
  { name: 'maxRows', label: t.blocks.list.maxRows, type: 'number', hint: t.blocks.list.maxRowsHint },
  { name: 'button', label: t.blocks.list.button, type: 'string', max: 30, hint: t.blocks.list.buttonHint },
  { name: 'buttonHref', label: t.blocks.list.buttonHref, type: 'relation', to: 'pages' },
];

/** How a list's rows are typed in place: the heading and the text where they stand, the icon in a slot, the page of a List row from the link slot and the toolbar's
 * Link (a row has no sheet; a row that folds out has no link), the button of a row that folds out on the open row itself (`onItem`). */
export const listInline = ({ buttons }: { buttons?: boolean }): InlineSpec => ({
  item: 'items',
  fields: ['title', 'text'],
  media: ['icon', 'iconColor', 'image', 'alt'],
  blockMedia: ['leading'],
  // A row that folds out has no link (owner, 26 Nov 2026: "No link on them. Just buttons."): an icon, a heading, a text and typed buttons. A row's stored `href` stays
  // and the site still draws it.
  ...(buttons ? { onItem: ['buttons'] } : { link: 'href' }),
  texts: listTexts,
});
