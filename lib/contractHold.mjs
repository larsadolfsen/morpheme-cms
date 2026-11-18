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
 * The first theme or app installed from the store that the next version cannot run, or null.
 *
 * What a site records of an installed item: an app's `app.json` has its `api`. A theme's `theme.json` and an item's
 * `store.json` have none, so an item with no `api` is taken to be written to the contract of the CMS the site runs now (the
 * store offers only what the running CMS reads, so that is what it was installed at). A site's own theme or app has no
 * `store.json` and is never held.
 * @param {{ kind: 'app' | 'theme', id: string, record: string | null, manifest: string | null }[]} items
 * @param {{ theme: number, apps: number[] }} next the contracts of the version to take
 * @param {{ theme: number, apps: number[] }} running the contracts of the version the site runs
 * @returns {{ kind: 'app' | 'theme', id: string, has: number, needs: number[] } | null}
 */
export function contractHold(items, next, running) {
  for (const { kind, id, record, manifest } of items) {
    if (!validJson(record)) continue;
    const declared = Number(safeParse(manifest)?.api);
    if (kind === 'theme') {
      const has = Number.isInteger(declared) ? declared : running.theme;
      if (has !== next.theme) return { kind, id, has, needs: [next.theme] };
    } else {
      const has = Number.isInteger(declared) ? declared : Math.max(...running.apps);
      if (!next.apps.includes(has)) return { kind, id, has, needs: next.apps };
    }
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
const validJson = (text) => typeof text === 'string' && safeParse(text) !== null;
