// What the editor asks of the store, through the Worker (the store's key never leaves it): the catalog and the files in it.
// Exposes handleStore(request, env, ctx, ask) and STORE_URL; used by packages/editor/worker/index.js (/api/store/*).
// Depends on packages/editor/worker/session.js (sign-in and access), packages/editor/worker/store-connection.js (the key) and packages/editor/lib/contracts.mjs (APP_API, THEME_API).
//   GET /api/store/catalog       the store's catalog for this site's contracts; { connected: false } without a key
//   GET /api/store/files/<oid>   a file of the store by its git id, streamed through with its content-type and cache-control
// The key is MORPHEME_STORE_KEY or the one from "Connect to Morpheme"; a key from the button that the store refuses is forgotten.
import { APP_API, THEME_API } from '../lib/contracts.mjs';
import { access, sessionToken } from './session.js';
import { json } from './not-found.js';
import { forgetKey, storeKey } from './store-connection.js';

export { STORE_URL } from './store-connection.js';
import { STORE_URL } from './store-connection.js';

const OID = /^[0-9a-f]{40}$/;

/** @param {Request} request @param {Record<string, any>} env @param {unknown} _ctx @param {typeof fetch} [ask] fetch, for the store and GitHub */
export async function handleStore(request, env, _ctx, ask = fetch) {
  if (!sessionToken(request)) return json({ error: 'signed out' }, 401);
  const may = await access(request, ask);
  if (!may) return json({ error: 'signed out' }, 401);
  if (!may.read) return json({ error: 'forbidden' }, 403);
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  const route = new URL(request.url).pathname.slice('/api/store/'.length);
  const isCatalog = route === 'catalog';
  const oid = route.startsWith('files/') ? route.slice('files/'.length) : null;
  if (!isCatalog && !(oid !== null && OID.test(oid))) return json({ error: 'not found' }, 404);
  const found = await storeKey(env);
  if (!found) return isCatalog ? json({ connected: false }) : json({ error: 'not found' }, 404);

  const base = env.MORPHEME_STORE_URL ?? STORE_URL;
  const url = isCatalog ? `${base}/store/catalog?app=${APP_API}&theme=${THEME_API}` : `${base}/store/files/${oid}`;
  let res;
  try {
    res = await ask(url, { headers: { authorization: `Bearer ${found.key}` } });
  } catch {
    return json({ error: 'store failed' }, 502);
  }
  if (res.status === 401 || res.status === 403) {
    if (found.by !== 'button') return json({ error: 'store refused' }, 502);
    await forgetKey(env);
    return isCatalog ? json({ connected: false }) : json({ error: 'not found' }, 404);
  }
  if (!isCatalog && res.status === 404) return json({ error: 'not found' }, 404);
  if (res.status !== 200) return json({ error: 'store failed' }, 502);
  if (isCatalog) {
    const catalog = await res.json().catch(() => null);
    return catalog === null ? json({ error: 'store failed' }, 502) : json(catalog);
  }
  const headers = { 'content-type': res.headers.get('content-type') ?? 'application/octet-stream' };
  const cache = res.headers.get('cache-control');
  if (cache) headers['cache-control'] = cache;
  return new Response(res.body, { status: 200, headers });
}

/**
 * The store's catalog for the contracts of a CMS version, for the Worker's own update (nobody is signed in): `{ apps, themes }` with the
 * releases written to them, or null when the site has no key or the store cannot be asked or does not answer. One call for each app contract.
 * @param {Record<string, any>} env @param {{ theme: number, apps: number[] }} contracts @param {typeof fetch} [ask]
 */
export async function catalogFor(env, contracts, ask = fetch) {
  const found = await storeKey(env).catch(() => null);
  if (!found) return null;
  const base = env.MORPHEME_STORE_URL ?? STORE_URL;
  const out = { apps: [], themes: [] };
  for (const app of contracts.apps) {
    let json;
    try {
      const res = await ask(`${base}/store/catalog?app=${app}&theme=${contracts.theme}`, {
        headers: { authorization: `Bearer ${found.key}` },
      });
      json = res.status === 200 ? await res.json() : null;
    } catch {
      return null;
    }
    if (!Array.isArray(json?.apps) || !Array.isArray(json?.themes)) return null;
    out.apps.push(...json.apps.map(({ id, version }) => ({ id, version })));
    out.themes.push(...json.themes.map(({ id, version }) => ({ id, version })));
  }
  return out;
}
