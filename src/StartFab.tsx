// The start screen's FAB menu (Start in Library.tsx): a new page and a new blog post, each opening its empty form
// (#ny/<list>), as the FAB on its list does. Exposes newOnStart (the actions) and StartFab. Uses FabMenu (ui.tsx),
// START_FAB (fabScreens.ts) and the collections and icons of site.ts.
import { Plus } from '@phosphor-icons/react';
import { t } from './i18n';
import { START_FAB } from './fabScreens';
import { collections, icons } from './site';
import { FabMenu, type FabAction } from './ui';

/** The start screen's actions: the lists of START_FAB the site has and can make a new entry in (`create`). */
export function newOnStart(): FabAction[] {
  return START_FAB.flatMap((id) => {
    const c = collections.find((x) => x.id === id);
    return c?.create ? [{ icon: icons[id] ?? Plus, label: c.create, href: `#ny/${id}` }] : [];
  });
}

export function StartFab() {
  return <FabMenu icon={Plus} label={t.library.createNew} items={newOnStart()} />;
}
