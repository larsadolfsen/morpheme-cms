// "Cookie list" on the site (view.ts): the cookies of the list "Cookies" from the site (@site/standard) and the shared
// texts, with those saved over them.
import { standard } from '@site/standard';
import { siteT } from '../../i18n';
import type { Load } from '../view';
import shared from './shared';
import { rowsOf, type CookiesTexts, type CookiesView } from './view';

export const load: Load<CookiesView> = async (_, { texts }) => ({
  cookies: rowsOf(standard.cookies),
  texts: { ...shared.values, ...texts } as CookiesTexts,
  label: siteT.blocks.cookies.label,
});
