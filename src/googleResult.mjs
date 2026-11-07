// The texts of a page's Google result: its title and description as the site writes them, and the address line.
// Exposes pageTitle, searchedAs and searchCrumbs. Mirrors theme/layouts/Base.astro; no dependencies.
// Missing (undefined or null) string inputs count as empty strings.

const SEPARATOR = ' › ';

const text = (s) => String(s ?? '').trim();

/**
 * The page's own title as the site writes it in <title> when it has no Google title.
 * @param {{ title?: string | null; front?: boolean; siteName?: string | null }} input
 * @returns {string}
 */
export function pageTitle({ title, front = false, siteName }) {
  const own = text(title);
  if (!own) return String(siteName ?? '');
  if (front) return own;
  return `${own} | ${siteName ?? ''}`;
}

/**
 * The title and description a Google result shows for the page. `site`: { name, description }.
 * @param {{ title?: string | null; front?: boolean; seoTitle?: string | null; seoDescription?: string | null;
 *   description?: string | null; site: { name?: string | null; description?: string | null } }} input
 * @returns {{ title: string; description: string }}
 */
export function searchedAs({ title, front = false, seoTitle, seoDescription, description, site }) {
  const resultTitle = text(seoTitle) || pageTitle({ title, front, siteName: site.name });
  const resultDescription = text(seoDescription) || text(description) || String(site.description ?? '');
  return { title: resultTitle, description: resultDescription };
}

/** The address line of a Google result: "https://" and the domain, then the path's parts, joined by " › ". */
export function searchCrumbs(domain, path) {
  const parts = String(path ?? '')
    .split('/')
    .filter((part) => part !== '');
  return [`https://${domain}`, ...parts].join(SEPARATOR);
}

/**
 * Splits `value` into parts so that each occurrence of `keyword` (case-insensitive, literal) is a bold part, as Google
 * bolds the searched words in a description. The original case is kept. A blank keyword gives one plain part.
 * @param {string} value
 * @param {string} [keyword]
 * @returns {{ text: string; bold: boolean }[]}
 */
export function boldParts(value, keyword) {
  const word = text(keyword);
  if (!word) return [{ text: value, bold: false }];
  const pattern = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return value
    .split(pattern)
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((part) => part.text !== '');
}
