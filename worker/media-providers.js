// The media providers of the installed apps (`mediaProviders` in app.json, contract 5, lib/mediaProviders.mjs): the Worker makes
// the request an app declares, so the app runs no code that reaches the network and its key never reaches the browser.
// Exposes handleMediaProviders and forgetProviderKeys. The credentials are in D1 (the binding CONSENT), per app and provider,
// sealed with MCP_VAULT_KEY like a connector's; the sign-in check, the declarations and fetch are given, so the tests run in Node.
//   GET    /api/media-providers                                  [{ app, id, label, icon, needsKey, connected }]
//   PUT    /api/media-providers/<app>/<id>/key                   { key }: saves the key (needs the right to save the site)
//   DELETE /api/media-providers/<app>/<id>/key                   deletes the key
//   GET    /api/media-providers/<app>/<id>/search?query&page     { items, totalPages }: lib/mediaProviders.mjs MediaItem
//   GET    /api/media-providers/<app>/<id>/image?url             the picture's bytes, from a listed host only
//   POST   /api/media-providers/<app>/<id>/track  { url }        the provider's download tracking call, a listed host only
// A call goes to a listed host only (the `csp` of the app), over https, follows no redirect, and ends with an error after
// TIMEOUT_MS or over MAX_JSON / MAX_IMAGE bytes.
import { allowedUrl, mediaItemsFrom, requestOf } from '../lib/mediaProviders.mjs';
import { open, seal } from './mcp-client.js';

export const TIMEOUT_MS = 10_000;
export const MAX_JSON = 1024 * 1024;
export const MAX_IMAGE = 12 * 1024 * 1024;
const ROOT = '/api/media-providers';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const ready = new WeakSet();
async function tables(db) {
  if (ready.has(db)) return;
  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS media_provider_keys (app TEXT NOT NULL, provider TEXT NOT NULL, secret TEXT NOT NULL, PRIMARY KEY (app, provider))',
    )
    .run();
  ready.add(db);
}

async function keyOf(env, app, provider) {
  if (!env.CONSENT) return null;
  await tables(env.CONSENT);
  const row = (await env.CONSENT.prepare('SELECT secret FROM media_provider_keys WHERE app = ? AND provider = ?').bind(app, provider).all())
    .results[0];
  const value = row ? await open(env, row.secret) : null;
  return typeof value === 'string' && value ? value : null;
}

/** Deletes the keys of every app that is not installed with media providers any more. */
export async function forgetProviderKeys(env, declared) {
  if (!env.CONSENT) return;
  await tables(env.CONSENT);
  const { results } = await env.CONSENT.prepare('SELECT DISTINCT app FROM media_provider_keys').all();
  for (const { app } of results)
    if (!declared[app]) await env.CONSENT.prepare('DELETE FROM media_provider_keys WHERE app = ?').bind(app).run();
}

/** A response's bytes, an error over `max` (never cut). */
async function bytesOf(res, max) {
  if (Number(res.headers.get('content-length')) > max) throw new Error('too big');
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      throw new Error('too big');
    }
    chunks.push(value);
  }
  return new Uint8Array(await new Blob(chunks).arrayBuffer());
}

const fetched = (ask, url, headers) => ask(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });

/** @param {Request} request @param {any} env @param {{ media: Record<string, { providers: any[], hosts: string[] }>, access: (r: Request) => Promise<any>, site?: string, ask?: typeof fetch }} deps */
export async function handleMediaProviders(request, env, deps) {
  const ask = deps.ask ?? fetch;
  const url = new URL(request.url);
  const may = await deps.access(request);
  if (!may) return json({ error: 'signed out' }, 401);
  if (!may.read) return json({ error: 'forbidden' }, 403);
  const rest = url.pathname.slice(ROOT.length).split('/').filter(Boolean);
  try {
    if (rest.length === 0) {
      if (request.method !== 'GET') return json({ error: 'method' }, 405);
      const list = [];
      for (const [app, { providers }] of Object.entries(deps.media))
        for (const p of providers)
          list.push({
            app,
            id: p.id,
            label: p.label,
            icon: p.icon,
            needsKey: p.key === true,
            connected: p.key === true ? (await keyOf(env, app, p.id)) !== null : true,
          });
      return json(list);
    }
    const [app, id, action] = rest;
    const declared = deps.media[app];
    const decl = declared?.providers.find((p) => p.id === id);
    if (!decl || rest.length !== 3) return json({ error: 'not found' }, 404);
    const hosts = declared.hosts;

    if (action === 'key') {
      if (!may.push) return json({ error: 'forbidden' }, 403);
      if (!env.CONSENT) return json({ error: 'no database' }, 503);
      await tables(env.CONSENT);
      if (request.method === 'DELETE') {
        await env.CONSENT.prepare('DELETE FROM media_provider_keys WHERE app = ? AND provider = ?').bind(app, id).run();
        return json({ connected: false });
      }
      if (request.method !== 'PUT' || decl.key !== true) return json({ error: 'method' }, 405);
      if (!env.MCP_VAULT_KEY) return json({ error: 'no vault key' }, 503);
      const body = await request.json().catch(() => null);
      const key = typeof body?.key === 'string' ? body.key.trim() : '';
      if (!key || key.length > 500 || /[\r\n]/.test(key)) return json({ error: 'bad key' }, 400);
      await env.CONSENT.prepare('INSERT OR REPLACE INTO media_provider_keys (app, provider, secret) VALUES (?, ?, ?)')
        .bind(app, id, await seal(env, key))
        .run();
      return json({ connected: true });
    }

    const key = decl.key === true ? await keyOf(env, app, id) : null;
    if (decl.key === true && !key) return json({ error: 'no key' }, 409);
    const headers = requestOf(decl, { query: '', page: 1, key: key ?? '' }).headers;

    if (action === 'search') {
      if (request.method !== 'GET') return json({ error: 'method' }, 405);
      const query = (url.searchParams.get('query') ?? '').slice(0, 200);
      const page = Number(url.searchParams.get('page') ?? 1);
      const call = requestOf(decl, { query, page, key: key ?? '', site: deps.site ?? '' });
      const target = allowedUrl(call.url, hosts);
      if (!target) return json({ error: 'host not allowed' }, 502);
      const res = await fetched(ask, target, call.headers);
      if (!res.ok) return json({ error: `provider ${res.status}` }, res.status === 401 || res.status === 403 ? 409 : 502);
      const data = JSON.parse(new TextDecoder().decode(await bytesOf(res, MAX_JSON)));
      return json(mediaItemsFrom(decl, data, hosts, deps.site ?? ''));
    }
    if (action === 'image') {
      if (request.method !== 'GET') return json({ error: 'method' }, 405);
      const target = allowedUrl(url.searchParams.get('url'), hosts);
      if (!target) return json({ error: 'host not allowed' }, 400);
      // A picture needs no key: the provider's picture hosts are open, and the key goes to the API host alone.
      const res = await fetched(ask, target, {});
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !/^image\/(jpeg|png|webp|avif|gif)/.test(type)) return json({ error: 'not a picture' }, 502);
      return new Response(await bytesOf(res, MAX_IMAGE), {
        headers: { 'content-type': type, 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' },
      });
    }
    if (action === 'track') {
      if (request.method !== 'POST') return json({ error: 'method' }, 405);
      if (!may.push) return json({ error: 'forbidden' }, 403);
      const body = await request.json().catch(() => null);
      const target = allowedUrl(body?.url, hosts);
      if (!target) return json({ error: 'host not allowed' }, 400);
      // The key goes only to the host the search goes to.
      const sameHost = new URL(target).hostname === new URL(requestOf(decl, { query: 'x', page: 1 }).url).hostname;
      const res = await fetched(ask, target, sameHost ? headers : {});
      return json({ ok: res.ok });
    }
    return json({ error: 'not found' }, 404);
  } catch {
    return json({ error: 'failed' }, 502);
  }
}
