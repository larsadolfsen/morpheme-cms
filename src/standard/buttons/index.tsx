// "Buttons", a standard block: buttons in a row, each to a page or where the site's config says
// (`buttonTargets`: here the booking sheet and the phone), with a text and an icon: its own, or the
// shared ones ("Blocks" › "Buttons", shared.ts) while it has none. How it looks is the theme's
// (packages/editor/theme/blocks/buttons/View.tsx; what it shows: view.ts, and load.ts on the site).
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { buttonList } from './fields';
import { materialIcon } from '../../icon';

export default defineBlock({
  group: 'buttons',
  label: t.blocks.buttons.label,
  icon: materialIcon('ads_click'),
  hint: t.blocks.buttons.hint,
  edit: { to: 'blocks/buttons', text: t.blocks.buttons.edit },
  // Typed in place (InlineButtons.tsx): the label on the button itself; where it leads, its style and its icon are in the button's menu (ButtonMenu.tsx,
  // opened from the control on the active button), its icon also in the icon slot. No sheet of the button, and so no Block settings (the block has only its buttons).
  inline: {
    item: 'items',
    fields: ['label'],
    icon: 'icon',
    onItem: ['to', 'open', 'href', 'kind'],
    texts: {
      addAbove: t.blocks.buttons.addAbove,
      addBelow: t.blocks.buttons.addBelow,
      row: t.blocks.buttons.button,
      icon: t.blocks.buttons.icon,
    },
  },
  fields: [{ ...buttonList, hint: t.blocks.buttons.itemsHint }],
  preview: true,
  detail: (p) => [
    ((p.items ?? []) as { label?: string }[])
      .map((b) => b.label)
      .filter(Boolean)
      .join(' · ') || t.blocks.buttons.shared,
  ],
});
