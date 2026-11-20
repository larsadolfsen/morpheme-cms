// "Cookies", the list the standard block "Cookie list" brings: one file per cookie in the site's data (config.cookieList),
// under "Lists" on every site, each with its name (`*` for the rest of it), who sets it, what for, how long it lasts
// and its category (lib/cookieCategories.mjs: necessary, or one the visitor says yes to in the cookie banner). An app's cookies come and go with it, and the app "Cookiescanner"
// adds those it finds (cookieList.ts). The site reads them for the block (StandardSite.cookies, the site's
// packages/editor/site/cookieList.ts).
// Made with the texts of a language: the editor's for the screens, the site's (siteT) for the commits (site.ts).
import { Cookie } from '@phosphor-icons/react';
import { config } from '@site/config';
import { COOKIE_CATEGORIES } from '../../../lib/cookieCategories.mjs';
import type { Messages } from '../../i18n';
import type { OwnedList } from '../../schema';

export default function cookiesList(say: Messages): OwnedList {
  const own = say.blocks.cookies.entries;
  return {
    kind: 'folder',
    id: config.lists.cookies,
    icon: Cookie,
    create: own.create,
    label: own.label,
    singular: own.singular,
    folder: config.cookieList,
    deletable: true,
    slugFrom: 'name',
    // Who sets it, with its name under it, so the list is by provider.
    summary: (d) => String(d.provider ?? ''),
    detail: (d) => String(d.name ?? ''),
    // One the app "Cookiescanner" added (`new`, cookieList.ts) first, marked, until it is saved.
    fresh: {
      field: 'new',
      heading: own.fresh,
      label: (d) => (String(d.purpose ?? '').trim() ? own.freshLabel : own.noPurpose),
      notice: own.freshNotice,
      approve: own.approve,
    },
    filters: [
      { field: 'provider', all: own.allProviders },
      { field: 'category', all: own.allCategories },
    ],
    fields: [
      { name: 'provider', label: own.provider, type: 'string', required: true },
      { name: 'name', label: own.name, type: 'string', required: true, hint: own.nameHint },
      { name: 'purpose', label: own.purpose, type: 'text' },
      { name: 'lasts', label: own.lasts, type: 'string' },
      {
        name: 'category',
        label: own.category,
        type: 'select',
        required: true,
        default: 'marketing',
        hint: own.categoryHint,
        options: COOKIE_CATEGORIES.map((value) => ({ label: own.categories[value], value })),
      },
    ],
  };
}
