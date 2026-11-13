// `Add field` (docs/superpowers/plans/2026-11-12-new-list.md, the owner's decision of 13 November: a list starts empty and the owner adds fields one at a
// time, as many of each kind as wanted): the menu of the six kinds a field can have. A tap on a kind adds the field. Used by the `Edit list` sheet and by the
// empty list's page. The parts are ui.tsx's.
import { ImageSquare, LinkSimple, ListChecks, Tag, TextAlignLeft, TextT, type Icon } from '@phosphor-icons/react';
import { KINDS } from '../lib/ownList.mjs';
import { t } from './i18n';
import { Menu, MenuItem } from './ui';

const ICONS: Record<string, Icon> = {
  icon: ListChecks,
  title: TextT,
  text: TextAlignLeft,
  image: ImageSquare,
  href: LinkSimple,
  tags: Tag,
};

export default function AddFieldMenu({
  anchor,
  onPick,
  onClose,
}: {
  anchor: HTMLElement | null;
  onPick: (kind: string) => void;
  onClose: () => void;
}) {
  return (
    <Menu anchor={anchor} label={t.ownList.addField} onClose={onClose}>
      {KINDS.map((k: { id: string }) => (
        <MenuItem
          key={k.id}
          icon={ICONS[k.id]}
          onClick={() => {
            onClose();
            onPick(k.id);
          }}
        >
          {t.ownList[k.id as 'icon']}
        </MenuItem>
      ))}
    </Menu>
  );
}
