// Which of an app's declared cookies it sets with its settings as they are. Exposes cookiesFor (also from appManifest.mjs).
// Pure, with no node modules, so the editor can use it (lib/appDefinition.mjs); appManifest.mjs, which reads files, cannot be bundled for a browser.

/** @typedef {import('./appManifest.mjs').AppManifest} AppManifest
 * @typedef {import('./appManifest.mjs').AppCookieDecl} AppCookieDecl */

/** The cookies an app sets with its settings as they are: those with a `when` only while that setting has a value.
 * @param {AppManifest} manifest @param {Record<string, unknown>} values @returns {AppCookieDecl[]} */
export function cookiesFor(manifest, values) {
  const filled = (/** @type {unknown} */ v) =>
    !(v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0));
  return (manifest.cookies ?? []).filter((c) => !c.when || filled(values?.[c.when.setting]));
}
