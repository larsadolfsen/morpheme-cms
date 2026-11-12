// The site's own texts in the editor's other languages, by language, by the text as it is written in the site's language.
// Exposes `texts` (the standard parts' Danish: defaults/i18n/da-DK/) and `appTexts` (the texts files of the apps, texts.ts or texts.json, and of their blocks).
// Depends on defaults/i18n/da-DK/index.ts. This file is the default of `@site/texts`; a site writes its own in src/site/texts.ts.
// A text that is not here shows as it is written, and `npm run check:content` says which ones are missing.
import { defaultsDaDK } from './i18n/da-DK';

export const texts: Record<string, Record<string, string>> = {
  'da-DK': defaultsDaDK,
};

/** The texts of each app and its blocks, by the file: an app's own (src/apps/<app>/texts.ts, or texts.json for an app with an
 * app.json) and its blocks' (blocks/<type>/texts.ts). */
export const appTexts = {
  ...import.meta.glob<{ texts: Record<string, Record<string, string>> }>(['/src/apps/*/texts.ts', '/src/apps/*/blocks/*/texts.ts'], {
    eager: true,
  }),
  ...Object.fromEntries(
    Object.entries(
      import.meta.glob<Record<string, Record<string, string>>>('/src/apps/*/texts.json', { eager: true, import: 'default' }),
    ).map(([path, texts]) => [path, { texts }]),
  ),
};
