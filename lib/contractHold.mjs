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
 * The site does not record the contract of an installed item (`store.json` has its version only), so the store says, release by release:
 * `answers` maps `<kind>:<id>` to what the store answered for the item's `id@version`: `{ api }` (200), `{ missing: true }` (404, the
 * release is not in the store) or `null` (no key, an error, no answer). A release whose `api` the next version reads is not held; any
 * other is: never assume compatible. A site's own theme or app has no store.json and is never held.
 * @param {{ kind: 'app' | 'theme', id: string, record: string | null, manifest: string | null }[]} items
 * @param {Map<string, { api: number } | { missing: true } | null>} answers
 * @param {{ theme: number, apps: number[] }} next the contracts of the version to take
 * @returns {{ kind: 'app' | 'theme', id: string, why: 'incompatible' | 'not-in-store' | 'could-not-confirm', has?: number, needs: number[] } | null}
 */
export function contractHold(items, answers, next) {
  for (const { kind, id, record } of items) {
    if (!safeParse(record)) continue;
    const needs = kind === 'theme' ? [next.theme] : next.apps;
    const answer = answers.get(`${kind}:${id}`) ?? null;
    if (!answer) return { kind, id, why: 'could-not-confirm', needs };
    if ('missing' in answer) return { kind, id, why: 'not-in-store', needs };
    if (!needs.includes(answer.api)) return { kind, id, why: 'incompatible', has: answer.api, needs };
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
