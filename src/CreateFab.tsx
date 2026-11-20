// A screen's one create action as a FAB (Files, Redirects, a single-file list form): a button, busy and
// disabled as the screen says. Exposes CreateFab. Uses FabMenu (ui.tsx).
import { Plus } from '@phosphor-icons/react';
import { FabMenu } from './ui';

export function CreateFab({ label, onClick, busy, disabled }: { label: string; onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return <FabMenu icon={Plus} label={label} items={[{ icon: Plus, label, onClick, busy, disabled }]} />;
}
