/** Whether a path is one of the editor's own pages (the admin interface under /editor/), not a page of the site. */
export function isEditorPath(pathname) {
  return pathname === '/editor' || String(pathname).startsWith('/editor/');
}

/** Writes the editor's language into `<html lang>`, on the editor's own pages only. A site page's `lang` is the site's language, written by the
 * layout; the browser's locale never replaces it, however the visitor's browser is set. Returns whether it wrote. */
export function setEditorDocumentLang(doc, pathname, locale) {
  if (!doc || !isEditorPath(pathname)) return false;
  doc.documentElement.lang = locale;
  return true;
}
