// Whether a CMS version may be taken by the Worker's nightly update: the version's own contracts (read from the
// `lib/contracts.mjs` in its npm tarball) against the contract of every theme and app the site installed from the store.
// Exposes parseContracts and contractHold. No dependencies, no I/O (runs in a Worker and in Node).

/**
 * The contracts a version of the CMS runs, read from the text of its `lib/contracts.mjs`; null when it cannot be read.
 * @param {string | null | undefined} text
 * @returns {{ theme: number, apps: number[] } | null}
 */
export function parseContracts(text) {
  if (typeof text !== 'string') return null;
  const theme = /export const THEME_API\s*=\s*(\d+)/.exec(text)?.[1];
  if (!theme) return null;
  const list = /export const APP_APIS\s*=\s*Object\.freeze\(\[([\d,\s]*)\]\)/.exec(text)?.[1];
  const single = /export const APP_API\s*=\s*(\d+)/.exec(text)?.[1];
  const apps = list ? list.split(',').flatMap((n) => (n.trim() ? [Number(n)] : [])) : single ? [Number(single)] : [];
  return apps.length ? { theme: Number(theme), apps } : null;
}

/**
 * The first theme or app installed from the store that the next version cannot be shown to run, or null.
 *
 * The site does not record the contract of an installed item (`store.json` has its version only), so the store says: `catalog` is the
 * store's catalog asked for the next version's contracts, which holds only releases written to them. An item whose
 * `id@version` (from its store.json) is not in it is held; so is every item when the store could not be asked (`catalog` null):
 * never assume compatible. A site's own theme or app has no store.json and is never held.
 * @param {{ kind: 'app' | 'theme', id: string, record: string | null, manifest: string | null }[]} items
 * @param {{ apps: { id: string, version: string }[], themes: { id: string, version: string }[] } | null} catalog
 * @param {{ theme: number, apps: number[] }} next the contracts of the version to take
 * @returns {{ kind: 'app' | 'theme', id: string, why: 'not-in-catalog' | 'could-not-confirm', needs: number[] } | null}
 */
export function contractHold(items, catalog, next) {
  for (const { kind, id, record } of items) {
    const stored = safeParse(record);
    if (!stored) continue;
    const needs = kind === 'theme' ? [next.theme] : next.apps;
    if (!catalog) return { kind, id, why: 'could-not-confirm', needs };
    const list = kind === 'theme' ? catalog.themes : catalog.apps;
    if (!list.some((x) => x.id === id && x.version === stored.version)) return { kind, id, why: 'not-in-catalog', needs };
  }
  return null;
}

const safeParse = (text) => {
  try {
    return JSON.parse(text ?? '');
  } catch {
    return null;
  }
};
