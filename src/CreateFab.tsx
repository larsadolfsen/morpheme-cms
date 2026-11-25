// A screen's one create action as a FAB (Files, Redirects, a single-file list form): a button, busy and
// disabled as the screen says. Exposes CreateFab. Uses FabMenu (ui.tsx).
import { FabMenu } from './ui';
import { materialIcon } from './icon';

export function CreateFab({ label, onClick, busy, disabled }: { label: string; onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return <FabMenu icon={materialIcon('add')} label={label} items={[{ icon: materialIcon('add'), label, onClick, busy, disabled }]} />;
}
