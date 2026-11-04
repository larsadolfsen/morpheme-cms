// What the editor asks of the store, through the Worker (the store's key never leaves it): the catalog and the files in it.
// Exposes handleStore(request, env, ctx, ask) and STORE_URL; used by packages/editor/worker/index.js (/api/store/*).
// Depends on packages/editor/worker/session.js (sign-in and access) and packages/editor/lib/contracts.mjs (APP_API, THEME_API).
//   GET /api/store/catalog       the store's catalog for this site's contracts; { connected: false } without MORPHEME_STORE_KEY
//   GET /api/store/files/<oid>   a file of the store by its git id, streamed through with its content-type and cache-control
import { APP_API, THEME_API } from '../lib/contracts.mjs';
import { access, sessionToken } from './session.js';
import { json } from './not-found.js';

export const STORE_URL = 'https://morpheme-appstore.larsadolfsen.workers.dev';

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
  if (!env.MORPHEME_STORE_KEY) return isCatalog ? json({ connected: false }) : json({ error: 'not found' }, 404);

  const base = env.MORPHEME_STORE_URL ?? STORE_URL;
  const url = isCatalog ? `${base}/store/catalog?app=${APP_API}&theme=${THEME_API}` : `${base}/store/files/${oid}`;
  let res;
  try {
    res = await ask(url, { headers: { authorization: `Bearer ${env.MORPHEME_STORE_KEY}` } });
  } catch {
    return json({ error: 'store failed' }, 502);
  }
  if (res.status === 401 || res.status === 403) return json({ error: 'store refused' }, 502);
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
