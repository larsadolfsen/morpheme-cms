// The editor's preview of the footer (FooterSettings.tsx): what the footer's form changes (footerDraft), and those changes
// put into the site's page (swapFooter), in the parts Footer.astro marks with data-editor: the text under the name
// (footer-text), the two headings (footer-contact-heading, footer-links-heading) and the links (footer-links).
// Exposes footerDraft and swapFooter. A DOM (the browser's, jsdom in the tests), no React.

/**
 * footer.json as the form has it.
 * @typedef {{ text?: string, contactHeading?: string, linksHeading?: string, links?: { label?: string, href?: string }[] }} FooterValues
 */

/**
 * What the form changes in the footer; undefined leaves it as it is on the site.
 * @typedef {{ text?: string, contactHeading?: string, linksHeading?: string, links?: { label: string, href: string }[] }} FooterDraft
 */

// A link with only what the footer shows of it.
/** @param {{ label?: string, href?: string }} link */
const linkOf = ({ label = '', href = '' }) => ({ label, href });

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What the form (`now`) changes from footer.json as it was saved (`saved`): only what differs is in it, so the rest of the
 * page stays exactly as on the site.
 * @param {FooterValues} saved
 * @param {FooterValues} now
 * @returns {FooterDraft}
 */
export function footerDraft(saved, now) {
  /** @type {FooterDraft} */
  const draft = {};
  for (const name of /** @type {const} */ (['text', 'contactHeading', 'linksHeading'])) {
    if ((now[name] ?? '') !== (saved[name] ?? '')) draft[name] = now[name] ?? '';
  }
  const [links, before] = [(now.links ?? []).map(linkOf), (saved.links ?? []).map(linkOf)];
  if (!same(links, before)) draft.links = links;
  return draft;
}

/**
 * How the theme draws what the page may not have: the class of a link, for the list of a page whose footer has none.
 * @typedef {{ linkClass: string }} FooterTheme
 */

/** @param {ParentNode} doc @param {string} name @returns {HTMLElement | null} */
const part = (doc, name) => doc.querySelector(`[data-editor="${name}"]`);

/**
 * Puts what the form changes (footerDraft) into the site's page: the texts as they are, and the links as copies of the
 * page's own first link (or, when it has none, drawn with `theme`).
 * @param {Document} doc
 * @param {FooterDraft} draft
 * @param {FooterTheme} theme
 */
export function swapFooter(doc, draft, theme) {
  for (const [name, key] of /** @type {const} */ ([
    ['footer-text', 'text'],
    ['footer-contact-heading', 'contactHeading'],
    ['footer-links-heading', 'linksHeading'],
  ])) {
    const el = part(doc, name);
    if (el && draft[key] !== undefined) el.textContent = draft[key];
  }
  const list = part(doc, 'footer-links');
  if (!list || !draft.links) return;
  const one = list.firstElementChild ?? null;
  list.replaceChildren(
    ...draft.links.map((link) => {
      let row = /** @type {HTMLElement | null} */ (one?.cloneNode(true) ?? null);
      if (!row) {
        row = doc.createElement('li');
        const a = doc.createElement('a');
        a.className = theme.linkClass;
        row.append(a);
      }
      const a = row.querySelector('a');
      if (a) {
        a.textContent = link.label;
        a.setAttribute('href', link.href);
      }
      return row;
    }),
  );
}
