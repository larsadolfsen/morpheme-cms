// A screen's one create action as a FAB (Files, Redirects, a single-file list form): a button, busy and
// disabled as the screen says. Exposes CreateFab. Uses FabMenu (ui.tsx).
import { Plus } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Icon } from './icon';
import { FabMenu } from './ui';

export function CreateFab({ label, onClick, busy, disabled }: { label: string; onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return <FabMenu icon={Plus} label={label} items={[{ icon: Plus, label, onClick, busy, disabled }]} />;
}

const Pencil = (({ size, className }: { size?: number | string; className?: string }) => (
  <Icon name="pencil-simple" size={Number(size) || 24} className={className} />
)) as unknown as PhosphorIcon;

/** The round button that opens a screen to edit what this one shows (a list's edit page): a pencil, a link. */
export function EditFab({ label, href }: { label: string; href: string }) {
  return <FabMenu icon={Pencil} label={label} items={[{ icon: Pencil, label, href }]} />;
}
