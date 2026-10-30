// "Knapper", a standard block: buttons in a row, each to a page or where the site's config says
// (`buttonTargets`: here the booking sheet and the phone), with a text and an icon: its own, or the
// shared ones ("Blokke" › "Knapper", shared.ts) while it has none. How it looks is the theme's
// (packages/editor/theme/blocks/buttons/View.tsx; what it shows: view.ts, and load.ts on the site).
import { CursorClick } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { buttonList } from './fields';

export default defineBlock({
  label: t.blocks.buttons.label,
  icon: CursorClick,
  hint: t.blocks.buttons.hint,
  edit: { to: 'blokke/buttons', text: t.blocks.buttons.edit },
  fields: [{ ...buttonList, hint: t.blocks.buttons.itemsHint }],
  preview: true,
  detail: (p) => [
    ((p.items ?? []) as { label?: string }[])
      .map((b) => b.label)
      .filter(Boolean)
      .join(' · ') || t.blocks.buttons.shared,
  ],
});
