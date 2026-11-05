// The texts of a page's Google result: its title and description as the site writes them, and the address line.
// Exposes pageTitle, searchedAs and searchCrumbs. Mirrors theme/layouts/Base.astro; no dependencies.
// Missing (undefined or null) string inputs count as empty strings.

const SEPARATOR = ' › ';

const text = (s) => String(s ?? '').trim();

/** The page's own title as the site writes it in <title> when it has no Google title. */
export function pageTitle({ title, front, siteName }) {
  const own = text(title);
  if (!own) return String(siteName ?? '');
  if (front) return own;
  return `${own} | ${siteName ?? ''}`;
}

/** The title and description a Google result shows for the page. `site`: { name, description }. */
export function searchedAs({ title, front, seoTitle, seoDescription, description, site }) {
  const resultTitle = text(seoTitle) || pageTitle({ title, front, siteName: site.name });
  const resultDescription = text(seoDescription) || text(description) || String(site.description ?? '');
  return { title: resultTitle, description: resultDescription };
}

/** The address line of a Google result: the domain and the path's parts, joined by " › ". */
export function searchCrumbs(domain, path) {
  const parts = String(path ?? '')
    .split('/')
    .filter((part) => part !== '');
  return [domain, ...parts].join(SEPARATOR);
}
