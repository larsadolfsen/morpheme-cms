// The key the site gets from "Connect to Morpheme": kept in D1 (the binding CONSENT), asked for and removed by the editor.
// Exposes handleConnection (/api/store/connection), storeKey(env), forgetKey(env) and STORE_URL; used by worker/index.js and worker/store.js.
// Depends on worker/session.js (sign-in and access), worker/not-found.js (json) and @site/config (the repository). The key never leaves the Worker.
//   GET    /api/store/connection   { connected, by?, site?, since?, mayChange }; mayChange = the editor may save the site
//   POST   /api/store/connection   asks the store for a key (POST <store>/store/connect) and keeps it
//   DELETE /api/store/connection   tells the store to drop the key (DELETE <store>/store/connect) and forgets it
import { config } from '@site/config';
import { json } from './not-found.js';
import { access, sessionToken } from './session.js';

// Lives here, not in store.js, so store.js can import storeKey from this file without a cycle; store.js exports it again.
export const STORE_URL = 'https://morpheme-appstore.larsadolfsen.workers.dev';

// The table (D1 has no migrations on deploy), as in consent.js. Each request makes it until one create has finished; only
// then does the isolate remember it for that database. A pending create is never shared: its I/O belongs to the request
// that started it, and if that request is cancelled the promise never settles and every later request would wait for it.
const ready = new WeakSet();
async function table(db) {
  if (ready.has(db)) return;
  await db.prepare('CREATE TABLE IF NOT EXISTS store_connection (site TEXT PRIMARY KEY, key TEXT NOT NULL, connected TEXT NOT NULL)').run();
  ready.add(db);
}

/** The key the Worker asks the store with: the one set by hand (MORPHEME_STORE_KEY) first, else the one from the button; null without. */
export async function storeKey(env) {
  if (env.MORPHEME_STORE_KEY) return { key: env.MORPHEME_STORE_KEY, by: 'hand' };
  if (!env.CONSENT) return null;
  await table(env.CONSENT);
  const { results } = await env.CONSENT.prepare('SELECT site, key, connected FROM store_connection ORDER BY connected DESC LIMIT 1').all();
  const row = results[0];
  return row ? { key: row.key, by: 'button', site: row.site, since: row.connected } : null;
}

/** Forgets the key from the button (the store no longer knows it, or the owner disconnected). */
export async function forgetKey(env) {
  if (!env.CONSENT) return;
  await table(env.CONSENT);
  await env.CONSENT.prepare('DELETE FROM store_connection').run();
}

/** The answer for GET (never the key). @param {Awaited<ReturnType<typeof storeKey>>} found @param {boolean} mayChange */
const state = (found, mayChange) =>
  json(
    !found
      ? { connected: false, mayChange }
      : found.by === 'hand'
        ? { connected: true, by: 'hand', mayChange }
        : { connected: true, by: 'button', site: found.site, since: found.since, mayChange },
  );

/** @param {Request} request @param {Record<string, any>} env @param {unknown} _ctx @param {typeof fetch} [ask] fetch, for the store and GitHub */
export async function handleConnection(request, env, _ctx, ask = fetch) {
  if (!sessionToken(request)) return json({ error: 'signed out' }, 401);
  const may = await access(request, ask);
  if (!may) return json({ error: 'signed out' }, 401);
  if (!may.read) return json({ error: 'forbidden' }, 403);
  const method = request.method;
  if (method !== 'GET' && method !== 'POST' && method !== 'DELETE') return json({ error: 'method' }, 405);
  if (method === 'GET') return state(await storeKey(env), may.push);
  if (!may.push) return json({ error: 'forbidden' }, 403);

  const base = env.MORPHEME_STORE_URL ?? STORE_URL;
  const found = await storeKey(env);
  if (method === 'POST') {
    if (found) return json({ error: 'connected' }, 409);
    if (!env.CONSENT) return json({ error: 'no database' }, 503);
    let res;
    try {
      res = await ask(`${base}/store/connect`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: new URL(request.url).origin, repo: `${config.repo.owner}/${config.repo.name}` }),
      });
    } catch {
      return json({ error: 'store failed' }, 502);
    }
    if (res.status === 429) return json({ error: 'busy' }, 429);
    if (res.status !== 201) return json({ error: 'store failed' }, 502);
    const given = await res.json().catch(() => null);
    if (typeof given?.site !== 'string' || typeof given?.key !== 'string' || !given.key) return json({ error: 'store failed' }, 502);
    await table(env.CONSENT);
    await env.CONSENT.prepare('INSERT OR REPLACE INTO store_connection (site, key, connected) VALUES (?, ?, ?)')
      .bind(given.site, given.key, new Date().toISOString())
      .run();
    return state(await storeKey(env), true);
  }

  // DELETE
  if (found?.by === 'hand') return json({ error: 'set by hand' }, 409);
  if (!found) return json({ connected: false, mayChange: true });
  let res;
  try {
    res = await ask(`${base}/store/connect`, { method: 'DELETE', headers: { authorization: `Bearer ${found.key}` } });
  } catch {
    return json({ error: 'store failed' }, 502);
  }
  if (res.status !== 200 && res.status !== 401) return json({ error: 'store failed' }, 502);
  await forgetKey(env);
  return json({ connected: false, mayChange: true });
}
