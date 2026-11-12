// The second level of the main menu (MainMenu.tsx, lib/menu.mjs menuTree): the parts under Business,
// and the two lists under Redirects. Exposes childrenOf.
// Uses site.ts (companyParts) and Redirects.tsx (TAB_ROUTES).
import { t } from './i18n';
import { TAB_ROUTES } from './Redirects';
import type { RepoFile } from './github';
import { companyParts } from './site';

export type MenuChild = { id: string; label: string; href: string };

/** The sub-items of a menu item, in their order: none for most. */
export function childrenOf(id: string, files: RepoFile[]): MenuChild[] {
  if (id === 'company') return companyParts.map((p) => ({ id: p.id, label: p.label, href: `#company/${p.id}` }));
  if (id === 'redirects') {
    return [
      { id: 'all', label: t.redirects.all, href: `#${TAB_ROUTES.redirects}` },
      { id: 'not-found', label: t.redirects.missing.title, href: `#${TAB_ROUTES.missing}` },
    ];
  }
  return [];
}
