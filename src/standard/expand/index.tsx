// "List - Expand", a standard block: rows that fold out (closed to begin with), each with a heading, an icon before it, a text and a page it
// links to after the text; one open at a time (`only`) and an optional text button under the last row. It is the "Segmented list" from before
// (and the "Accordion": FORMER in lib/blocks.mjs), with the `design` of every list: the rows on the page (default) or each on its own surface
// (`card`). How it looks is the theme's (packages/editor/theme/blocks/expand/View.tsx; what it shows: view.ts, and load.ts on the site).
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { columnsField } from '../columns';
import { fromLine, nameWith, rowsFromFields, typed } from '../rows/fields';
import { designField, leadingField, listInline, listRowFields, moreFields } from '../rows/listParts';
import { materialIcon } from '../../icon';

type Row = { title?: string };

export default defineBlock({
  group: 'lists',
  label: t.blocks.expand.label,
  icon: materialIcon('expand'),
  nameOf: (p) => nameWith(t.blocks.expand.label, p),
  hint: t.blocks.expand.hint,
  // Typed in place as the List is (InlineList.tsx, which InlineExpand.tsx hands over to): the heading and text where they stand, the icon in a slot,
  // the page and the row's button in the row's sheet, which the link slot and the toolbar's Link open. Edit keeps the block's own settings (Only one
  // open, Rows, Max rows, the text button).
  inline: { ...listInline({ buttons: true }), blockSettings: true },
  fields: [
    ...rowsFromFields,
    {
      name: 'items',
      only: typed,
      keep: true,
      label: t.blocks.list.items,
      singular: t.blocks.list.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: listRowFields({ buttons: true }),
    },
    {
      name: 'only',
      label: t.blocks.expand.only,
      type: 'boolean',
      toggle: t.blocks.expand.onlyToggle,
      hint: t.blocks.expand.onlyHint,
      default: true,
      missing: true,
    },
    // The rows are questions and answers: they are in the page's structured data too, as an FAQPage (theme/layouts/PageLayout.astro), which search engines can
    // show under the page. Their texts are Markdown (bold, italic, links and lists), as the answers of the FAQ list were.
    {
      name: 'faq',
      label: t.blocks.expand.faq,
      type: 'boolean',
      toggle: t.blocks.expand.faqToggle,
      hint: t.blocks.expand.faqHint,
      default: false,
      missing: true,
    },
    designField,
    leadingField,
    columnsField(),
    ...moreFields,
  ],
  example: {
    items: [
      { icon: 'schedule', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'info', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'location_on', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
    ],
  },
  detail: (p, data) => (p.from ? [...fromLine(p, data)] : [((p.items ?? []) as Row[]).map((r) => r.title ?? '').join(' · ')]),
});
