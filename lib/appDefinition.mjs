// Makes the data of an app's definition from its app.json, the code parts of its editor.ts and its texts.json.
// Exposes definitionOf and consentCategoriesOf. Uses cookiesFor (appCookies.mjs) and isConsentCategory (cookieCategories.mjs).
// Pure: the icons stay names, which src/apps.ts maps to components, and nothing is read from a file.
import { cookiesFor } from './appCookies.mjs';
import { isConsentCategory } from './cookieCategories.mjs';

/** @typedef {import('./appManifest.mjs').AppManifest} AppManifest
 * @typedef {import('./appManifest.mjs').AppCookieDecl} AppCookieDecl
 * @typedef {import('./cookieCategories.mjs').ConsentCategory} ConsentCategory
 * @typedef {{ page?: unknown, screens?: unknown, tabs?: unknown, notifications?: unknown,
 *   settings?: { changedTo?: unknown }, kinds?: Record<string, { draw?: unknown }> }} AppDefinitionCode
 *   The parts of an app's definition that are code, from its editor.ts.
 * @typedef {{ name?: string, provider?: string, purpose: string, lasts?: string, category?: string }} AppCookieLine
 * @typedef {{ label: string, publisher: string, license: string, thirdParty: { name: string, license: string, url: string }[],
 *   icon: string, hint: string, version: string, description?: string, category?: string, keywords?: string[],
 *   releaseNotes?: Record<string, string>, screenshots?: { file: string, label: string }[],
 *   settings?: { fields: unknown[], values: Record<string, unknown>, example?: Record<string, unknown>, changedTo?: unknown },
 *   lists?: unknown[], kinds?: Record<string, Record<string, unknown>>, cookieList?: AppCookieLine[],
 *   cookies?: (values: Record<string, unknown>) => ConsentCategory[], texts?: Record<string, unknown>,
 *   page?: unknown, screens?: unknown, tabs?: unknown, notifications?: unknown }} AppDefinitionData
 *   An app's definition without React parts: the code parts are there as `editor` gave them, the icons are names. */

/** The categories the cookie banner asks about for what an app sets with its settings as they are: each once, in the order
 * the app lists its cookies. A necessary cookie is set without asking, so it adds none.
 * @param {AppManifest} manifest @param {Record<string, unknown>} values @returns {ConsentCategory[]} */
export function consentCategoriesOf(manifest, values) {
  return [
    ...new Set(
      cookiesFor(manifest, values)
        .map((c) => c.category)
        .filter(isConsentCategory),
    ),
  ];
}

/** The definition of a contract 4 app, from its app.json (data), the code parts of its editor.ts and its texts.json.
 * @param {AppManifest} manifest
 * @param {Partial<AppDefinitionCode> | undefined} editor
 * @param {Record<string, unknown> | undefined} texts
 * @returns {AppDefinitionData} */
export function definitionOf(manifest, editor, texts) {
  const { api, csp, reads, hooks, afterBuild, cookies, settings, kinds, thirdParty, ...data } = manifest;
  /** @type {AppDefinitionData} */
  const definition = { ...data, thirdParty: thirdParty ?? [] };

  if (settings) {
    const changedTo = editor?.settings?.changedTo;
    definition.settings = changedTo === undefined ? { ...settings } : { ...settings, changedTo };
  }
  if (kinds) {
    definition.kinds = Object.fromEntries(
      Object.entries(kinds).map(([list, kind]) => {
        const draw = editor?.kinds?.[list]?.draw;
        return [list, draw === undefined ? { ...kind } : { ...kind, draw }];
      }),
    );
  }
  if (cookies?.length) {
    // The line on the app's page: the same cookie, said as the editor's AppCookie has it (`duration` is `lasts`).
    definition.cookieList = cookies.map(({ name, provider, purpose, duration, category }) => ({
      name,
      provider,
      purpose,
      lasts: duration,
      category,
    }));
    // The banner asks only about what the visitor can say no to: an app with only necessary cookies has none to ask about.
    if (cookies.some((c) => isConsentCategory(c.category))) definition.cookies = (values) => consentCategoriesOf(manifest, values);
  }

  for (const key of /** @type {const} */ (['page', 'screens', 'tabs', 'notifications'])) {
    if (editor?.[key] !== undefined) definition[key] = editor[key];
  }
  if (texts !== undefined) definition.texts = texts;
  return definition;
}
