// The standard parts' English texts in Danish (English text -> Danish text): joins the per-file dictionaries below.
// Exposes defaultsDaDK. Read by src/i18n/index.ts (the Danish editor, inSiteLanguage) and src/checkSite.ts (untranslated).
import { blockTexts } from './blockTexts';
import { collections } from './collections';
import { colors } from './colors';
import { company } from './company';
import { editor } from './editor';
import { internalLinks } from './internalLinks';
import { opens } from './opens';
import { popup } from './popup';
import { privacy } from './privacy';
import { rules } from './rules';
import { sitedata } from './sitedata';
import { standard } from './standard';
import { standardPages } from './standardPages';

export const defaultsDaDK: Record<string, string> = {
  ...blockTexts,
  ...collections,
  ...colors,
  ...company,
  ...editor,
  ...internalLinks,
  ...opens,
  ...popup,
  ...privacy,
  ...rules,
  ...sitedata,
  ...standard,
  ...standardPages,
};
