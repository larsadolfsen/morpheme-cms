// The standard parts' English texts in Danish (English text -> Danish text): joins the per-file dictionaries below.
// Exposes defaultsDaDK. Read by src/i18n/index.ts (the Danish editor, inSiteLanguage) and src/checkSite.ts (untranslated).
import { editor } from './editor';
import { standardPages } from './standardPages';

export const defaultsDaDK: Record<string, string> = {
  ...editor,
  ...standardPages,
};
