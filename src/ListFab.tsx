// The create FAB of a list (List in Library.tsx): its own create action, or a menu of its kinds when it has several.
// Exposes ListFab. Uses FabMenu (ui.tsx), listFab (fabScreens.ts) and the icons of site.ts.
import { listFab } from './fabScreens';
import { icons } from './site';
import { FabMenu } from './ui';
import { materialIcon } from './icon';

export function ListFab({ collection, kinds }: { collection: { id: string; create?: string }; kinds: { value: string; label: string }[] }) {
  // One action is the FAB's (the +); each of several kinds has its list's icon.
  const actions = listFab(collection, kinds);
  const icon = actions.length > 1 ? (icons[collection.id] ?? materialIcon('add')) : materialIcon('add');
  return <FabMenu icon={materialIcon('add')} label={collection.create ?? ''} items={actions.map((a) => ({ ...a, icon }))} />;
}
