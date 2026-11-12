// "Buttons", a standard block: buttons in a row, each to a page or where the site's config says
// (`buttonTargets`: here the booking sheet and the phone), with a text and an icon: its own, or the
// shared ones ("Blocks" › "Buttons", shared.ts) while it has none. How it looks is the theme's
// (packages/editor/theme/blocks/buttons/View.tsx; what it shows: view.ts, and load.ts on the site).
import { CursorClick } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { buttonList } from './fields';

export default defineBlock({
  group: 'buttons',
  label: t.blocks.buttons.label,
  icon: CursorClick,
  hint: t.blocks.buttons.hint,
  edit: { to: 'blocks/buttons', text: t.blocks.buttons.edit },
  // Typed in place (InlineButtons.tsx): the label on the button itself; where it leads, its style and icon are in the button's settings.
  inline: {
    item: 'items',
    fields: ['label'],
    settings: ['to', 'open', 'href', 'kind', 'icon'],
    blockSettings: true,
    texts: {
      addAbove: t.blocks.buttons.addAbove,
      addBelow: t.blocks.buttons.addBelow,
      link: t.blocks.buttons.settingsAction,
      row: t.blocks.buttons.button,
      settings: t.blocks.buttons.buttonSettings,
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
