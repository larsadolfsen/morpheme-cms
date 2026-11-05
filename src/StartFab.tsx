// The start screen's FAB menu (Start in Library.tsx): a new page and a new blog post, each opening its empty form
// (#new/<list>), as the + on its list does. Exposes newOnStart (the actions) and StartFab. Uses FabMenu (ui.tsx) and the
// collections and icons of site.ts.
import { Plus } from '@phosphor-icons/react';
import { t } from './i18n';
import { collections, icons } from './site';
import { FabMenu, type FabAction } from './ui';

/** The lists a new entry can be made in from the start screen, in this order. */
const ON_START = ['pages', 'blog'];

/** The start screen's actions: the lists of ON_START the site has and can make a new entry in (`create`). */
export function newOnStart(): FabAction[] {
  return ON_START.flatMap((id) => {
    const c = collections.find((x) => x.id === id);
    return c?.create ? [{ icon: icons[id] ?? Plus, label: c.create, href: `#new/${id}` }] : [];
  });
}

export function StartFab() {
  return <FabMenu icon={Plus} label={t.library.createNew} items={newOnStart()} />;
}
