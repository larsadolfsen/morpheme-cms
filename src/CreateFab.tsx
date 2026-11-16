// A screen's one create action as a FAB (Files, Redirects, a single-file list form): a button, busy and
// disabled as the screen says. Exposes CreateFab and ListEditFab. Uses FabMenu (ui.tsx).
import { Plus } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Icon } from './icon';
import { FabMenu } from './ui';
import { t } from './i18n';

export function CreateFab({ label, onClick, busy, disabled }: { label: string; onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return <FabMenu icon={Plus} label={label} items={[{ icon: Plus, label, onClick, busy, disabled }]} />;
}

const Pencil = (({ size, className }: { size?: number | string; className?: string }) => (
  <Icon name="pencil-simple" size={Number(size) || 24} className={className} />
)) as unknown as PhosphorIcon;

/**
 * The round button on the page of a list that has an edit page (a list the owner made, and a locked one such as the Testimonials): a FAB menu with `Edit list`, which opens
 * the edit page, and `Add <entry>`, which opens the entry's form (`#new/<id>`, the page every list's `Add` opens). Material 3: a FAB menu "opens from a FAB to show multiple
 * related actions" (2 to 6 items; "Don't use a FAB menu with one item").
 */
export function ListEditFab({ id, entry }: { id: string; entry: string }) {
  return (
    <FabMenu
      icon={Plus}
      label={t.ownList.listActions}
      items={[
        { icon: Pencil, label: t.ownList.edit, href: `#list/${id}/edit` },
        { icon: Plus, label: t.ownList.addEntry(entry), href: `#new/${id}` },
      ]}
    />
  );
}
