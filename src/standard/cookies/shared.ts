// The shared texts of "Cookie list" ("Blocks"): the table's headings and the names of the categories, to begin with in
// the site's language (siteT).
import { COOKIE_CATEGORIES } from '../../../lib/cookieCategories.mjs';
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

const own = t.blocks.cookies;

export default defineShared({
  fields: [
    { name: 'name', label: own.nameHead, type: 'string', required: true },
    { name: 'provider', label: own.providerHead, type: 'string', required: true },
    { name: 'purpose', label: own.purposeHead, type: 'string', required: true },
    { name: 'lasts', label: own.lastsHead, type: 'string', required: true },
    { name: 'category', label: own.categoryHead, type: 'string', required: true },
    ...COOKIE_CATEGORIES.map((name) => ({ name, label: own[`${name}Text`], type: 'string' as const, required: true })),
  ],
  values: { ...siteT.blocks.cookies.texts },
  preview: { props: {} },
});
