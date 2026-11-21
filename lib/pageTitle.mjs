// The editor's one page title function: the browser tab, the history and a screen reader's first word on a new screen say which screen it is
// (WCAG 2.4.2 Page Titled; plan 0.19.4). `screen – site`; the start screen, whose title is the site's name, is the name alone.

/** The title of the page for a screen: `Pages – My site`. @param {string} screen @param {string} site */
export function pageTitle(screen, site) {
  const here = String(screen ?? '').trim();
  const name = String(site ?? '').trim();
  if (!here || here === name) return name;
  if (!name) return here;
  return `${here} – ${name}`;
}
