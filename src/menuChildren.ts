// The second level of the main menu (MainMenu.tsx, lib/menu.mjs menuTree): the lists under Lists,
// the parts under Business, the apps installed under Apps and the two lists under Redirects. Exposes childrenOf.
// Uses site.ts (collections, apps, companyParts), Library.tsx (hrefOf, listsShown) and Redirects.tsx (TAB_ROUTES).
import { installedApps } from './apps';
import { t } from './i18n';
import { hrefOf } from './Library';
import { TAB_ROUTES } from './Redirects';
import type { RepoFile } from './github';
import { apps, collections, companyParts, listsShown } from './site';

export type MenuChild = { id: string; label: string; href: string };

const listOf = (ids: string[]): MenuChild[] =>
  ids.flatMap((id) => {
    const c = collections.find((x) => x.id === id);
    return c ? [{ id, label: c.label, href: hrefOf(c) }] : [];
  });

/** The sub-items of a menu item, in their order: none for most. */
export function childrenOf(id: string, files: RepoFile[]): MenuChild[] {
  if (id === 'lists') return listOf(listsShown(files));
  if (id === 'company') return companyParts.map((p) => ({ id: p.id, label: p.label, href: `#company/${p.id}` }));
  if (id === 'apps') {
    const installed = installedApps(files);
    return apps.filter((a) => installed.includes(a.id)).map((a) => ({ id: a.id, label: a.label, href: `#apps/${a.id}` }));
  }
  if (id === 'redirects') {
    return [
      { id: 'alle', label: t.redirects.all, href: `#${TAB_ROUTES.redirects}` },
      { id: 'ikke-fundet', label: t.redirects.missing.title, href: `#${TAB_ROUTES.missing}` },
    ];
  }
  return [];
}
