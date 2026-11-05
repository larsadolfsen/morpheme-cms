// The standard parts' English texts in Danish (English text -> Danish text): joins the per-file dictionaries below.
// Exposes defaultsDaDK. Read by src/i18n/index.ts (the Danish editor, inSiteLanguage) and src/checkSite.ts (untranslated).
import { blockTexts } from './blockTexts';
import { collections } from './collections';
import { company } from './company';
import { editor } from './editor';
import { internalLinks } from './internalLinks';
import { privacy } from './privacy';
import { standardPages } from './standardPages';

export const defaultsDaDK: Record<string, string> = {
  ...blockTexts,
  ...collections,
  ...company,
  ...editor,
  ...internalLinks,
  ...privacy,
  ...standardPages,
};
