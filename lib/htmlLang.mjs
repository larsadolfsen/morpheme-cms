/** Whether a page is the editor's (`/editor/…`), whose UI language follows the browser. Every other page is the site's. */
export const isEditorPath = (/** @type {string} */ pathname) => /^\/editor(\/|$)/.test(pathname);

/**
 * Sets `<html lang>` to the editor's language, on the editor's own pages only. A site page keeps the `lang` its server
 * rendered (the site's language), so screen readers and search engines get the page's real language, whatever the
 * browser's language is.
 * @param {{ documentElement: { lang: string } } | undefined} doc
 * @param {string} locale
 * @param {string} pathname
 */
export function setEditorLang(doc, locale, pathname) {
  if (doc && isEditorPath(pathname)) doc.documentElement.lang = locale;
}
