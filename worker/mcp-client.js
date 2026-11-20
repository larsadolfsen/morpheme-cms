// A connector's MCP connection (contract 5, `mcp` in app.json): the owner connects the site to a service's MCP server, the Worker
// keeps the credentials and calls the server's tools. Exposes handleMcpClient (/api/mcp-client/...), callTool, forgetApp,
// forgetUninstalled and the limits. Depends on nothing of the site; the sign-in check, the apps' `mcp` declarations
// and fetch are given, so the tests run in Node. The credentials are in D1 (the binding CONSENT), per site and per app,
// encrypted with the Worker secret MCP_VAULT_KEY, and never leave the Worker: the browser learns only whether a connection exists.
//   GET    /api/mcp-client/<app>                 { host, tools, auth, connected, needsSignIn }
//   POST   /api/mcp-client/<app>                 connects: { token } (auth "token"), nothing (auth "none"), or starts the service's
//                                                sign-in (auth "oauth"): { url } to send the owner to
//   DELETE /api/mcp-client/<app>                 disconnects: the credentials are deleted
//   GET    /api/mcp-client/<app>/options?tool&label&value   a listed tool's items as [{ label, value }] (a settings field's options)
//   GET    /api/mcp-client/callback?code&state   where the service's sign-in ends (known by `state`, not by the editor's cookie)
// A call goes to `server`'s host only, to a listed tool only, follows no redirect, and ends with an error (not a cut result) after
// TIMEOUT_MS or over MAX_BYTES.
// Not not-found.js's json: that module imports session.js, which imports @site/config, which plain Node cannot load.
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

import { open as openText, seal as sealText } from '../lib/vault.mjs';

export const TIMEOUT_MS = 10_000;
export const MAX_BYTES = 256 * 1024;
const PROTOCOL = '2025-11-25';
const PENDING_MS = 10 * 60 * 1000;
const ROOT = '/api/mcp-client/';

// The tables (D1 has no migrations on deploy), as consent.js: each request makes them until one create has finished; only then
// does the isolate remember it for that database. A pending create is never shared between requests.
const ready = new WeakSet();
async function tables(db) {
  if (ready.has(db)) return;
  await db.batch([
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_app_connections (app TEXT PRIMARY KEY, secret TEXT NOT NULL, state TEXT NOT NULL, connected TEXT NOT NULL)',
    ),
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_app_pending (state TEXT PRIMARY KEY, app TEXT NOT NULL, secret TEXT NOT NULL, at INTEGER NOT NULL)',
    ),
  ]);
  ready.add(db);
}

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Seals a value (JSON) with MCP_VAULT_KEY, the vault the assistants' sign-in uses too (lib/vault.mjs). */
export async function seal(env, value) {
  if (!env.MCP_VAULT_KEY) throw new McpError('no vault key', 503);
  return sealText(env.MCP_VAULT_KEY, JSON.stringify(value));
}
/** The value of a sealed text, or null when it cannot be opened (another key). */
export async function open(env, text) {
  const plain = await openText(env.MCP_VAULT_KEY, text);
  try {
    return plain === null ? null : JSON.parse(plain);
  } catch {
    return null;
  }
}

/** A failure with the status the editor gets. */
export class McpError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

async function secretOf(env, app) {
  await tables(env.CONSENT);
  const row = (await env.CONSENT.prepare('SELECT secret, state FROM mcp_app_connections WHERE app = ?').bind(app).all()).results[0];
  return row ? { state: row.state, secret: row.state === 'ok' ? await open(env, row.secret) : null } : null;
}
async function keep(env, app, secret, state = 'ok') {
  await tables(env.CONSENT);
  await env.CONSENT.prepare('INSERT OR REPLACE INTO mcp_app_connections (app, secret, state, connected) VALUES (?, ?, ?, ?)')
    .bind(app, await seal(env, secret), state, new Date().toISOString())
    .run();
}
/** Deletes an app's credentials (Disconnect, uninstall). */
export async function forgetApp(env, app) {
  if (!env.CONSENT) return;
  await tables(env.CONSENT);
  await env.CONSENT.batch([
    env.CONSENT.prepare('DELETE FROM mcp_app_connections WHERE app = ?').bind(app),
    env.CONSENT.prepare('DELETE FROM mcp_app_pending WHERE app = ?').bind(app),
  ]);
}
/** Deletes the credentials of every app that is not installed with an `mcp` any more (an uninstall done in the repository). */
export async function forgetUninstalled(env, declared) {
  if (!env.CONSENT) return;
  await tables(env.CONSENT);
  const { results } = await env.CONSENT.prepare('SELECT app FROM mcp_app_connections').all();
  for (const { app } of results) if (!declared[app]) await forgetApp(env, app);
  await env.CONSENT.prepare('DELETE FROM mcp_app_pending WHERE at < ?')
    .bind(Date.now() - PENDING_MS)
    .run();
}

const https = (url) => {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new McpError('not https');
  return u;
};

/** The body of a response as text, an error over MAX_BYTES (never cut). */
async function bodyOf(res) {
  const length = Number(res.headers.get('content-length'));
  if (length > MAX_BYTES) throw new McpError('too big');
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel().catch(() => {});
      throw new McpError('too big');
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
}

/** One JSON-RPC answer from a Streamable HTTP reply (JSON, or an event stream with it). */
function rpcOf(text, type, id) {
  const messages = type.includes('text/event-stream')
    ? text
        .split(/\r?\n/)
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
    : [text];
  for (const m of messages) {
    try {
      const msg = JSON.parse(m);
      if (msg.id === id) return msg;
    } catch {
      /* not JSON */
    }
  }
  throw new McpError('bad answer');
}

/** A request to the server or the service's sign-in: no redirect, the time left of one deadline. */
async function send(ask, url, init, deadline) {
  const left = deadline - Date.now();
  if (left <= 0) throw new McpError('timeout', 504);
  let res;
  try {
    res = await ask(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(left) });
  } catch (e) {
    throw new McpError(
      e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'timeout' : 'unreachable',
      e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 504 : 502,
    );
  }
  if (res.status >= 300 && res.status < 400) throw new McpError('redirect');
  return res;
}

// --- OAuth: discovery, registration, PKCE, refresh ---

async function getJson(ask, url, deadline) {
  const res = await send(ask, https(url).href, { headers: { accept: 'application/json' } }, deadline);
  if (!res.ok) throw new McpError('discovery failed');
  try {
    return JSON.parse(await bodyOf(res));
  } catch {
    throw new McpError('discovery failed');
  }
}
async function discover(ask, server, deadline) {
  const origin = new URL(server).origin;
  let issuer = origin;
  try {
    const resource = await getJson(ask, `${origin}/.well-known/oauth-protected-resource`, deadline);
    if (typeof resource.authorization_servers?.[0] === 'string') issuer = resource.authorization_servers[0];
  } catch (e) {
    if (e.message === 'timeout') throw e;
  }
  const meta = await getJson(ask, `${new URL(issuer).origin}/.well-known/oauth-authorization-server`, deadline);
  for (const key of ['authorization_endpoint', 'token_endpoint']) https(meta[key]);
  if (meta.registration_endpoint) https(meta.registration_endpoint);
  return meta;
}
const form = (data) => ({
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
  body: new URLSearchParams(data).toString(),
});
/** What a token answer keeps: the tokens and when the access token ends. */
function tokensOf(answer, was) {
  if (typeof answer?.access_token !== 'string') throw new McpError('no token');
  return {
    ...was,
    access: answer.access_token,
    refresh: typeof answer.refresh_token === 'string' ? answer.refresh_token : was?.refresh,
    expires: typeof answer.expires_in === 'number' ? Date.now() + answer.expires_in * 1000 : undefined,
  };
}
/** The credentials with a fresh access token; a failed refresh marks the connection Needs sign-in. */
async function fresh(env, app, secret, ask, deadline) {
  if (secret.kind !== 'oauth' || !secret.expires || secret.expires - 60_000 > Date.now()) return secret;
  let next;
  try {
    if (!secret.refresh) throw new McpError('no refresh');
    const res = await send(
      ask,
      secret.tokenEndpoint,
      form({
        grant_type: 'refresh_token',
        refresh_token: secret.refresh,
        client_id: secret.clientId,
        ...(secret.clientSecret ? { client_secret: secret.clientSecret } : {}),
      }),
      deadline,
    );
    if (!res.ok) throw new McpError('refresh failed');
    next = tokensOf(JSON.parse(await bodyOf(res)), secret);
  } catch (e) {
    if (e.message === 'timeout') throw e;
    await keep(env, app, {}, 'needs-sign-in');
    throw new McpError('needs sign-in', 409);
  }
  await keep(env, app, next);
  return next;
}

// --- The call ---

/** Calls a tool of an app's MCP server and gives its result. `decl`: the app's `mcp`. Refuses a tool not in `decl.tools`. */
export async function callTool(env, app, decl, tool, args = {}, ask = fetch) {
  if (!decl) throw new McpError('no mcp', 404);
  if (!decl.tools.includes(tool)) throw new McpError('tool not listed', 403);
  if (!env.CONSENT) throw new McpError('no database', 503);
  const server = https(decl.server);
  const deadline = Date.now() + TIMEOUT_MS;
  let headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': PROTOCOL };
  if (decl.auth !== 'none') {
    const found = await secretOf(env, app);
    if (!found) throw new McpError('not connected', 409);
    if (found.state !== 'ok' || !found.secret) throw new McpError('needs sign-in', 409);
    const secret = await fresh(env, app, found.secret, ask, deadline);
    headers = { ...headers, authorization: `Bearer ${secret.kind === 'token' ? secret.token : secret.access}` };
  }
  let session;
  const rpc = async (body, wait = true) => {
    const res = await send(
      ask,
      server.href,
      { method: 'POST', headers: session ? { ...headers, 'mcp-session-id': session } : headers, body: JSON.stringify(body) },
      deadline,
    );
    if (res.status === 401) {
      if (decl.auth !== 'none') await keep(env, app, {}, 'needs-sign-in');
      throw new McpError('needs sign-in', 409);
    }
    if (!res.ok) throw new McpError(`server ${res.status}`);
    session = res.headers.get('mcp-session-id') ?? session;
    const text = await bodyOf(res);
    if (!wait) return undefined;
    const msg = rpcOf(text, res.headers.get('content-type') ?? '', body.id);
    if (msg.error) throw new McpError('tool failed');
    return msg.result;
  };
  await rpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: 'Morpheme', version: '1' } },
  });
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, false);
  const result = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: args } });
  if (result?.isError) throw new McpError('tool failed');
  if (result?.structuredContent !== undefined) return result.structuredContent;
  const text = result?.content?.find((c) => c.type === 'text')?.text;
  try {
    return text === undefined ? result : JSON.parse(text);
  } catch {
    return text;
  }
}

/** The items of a tool's result as options: the result is a list, or an object with one (the first list in it). */
export function optionsOf(result, label, value) {
  const list = Array.isArray(result) ? result : Object.values(result ?? {}).find(Array.isArray);
  if (!list) throw new McpError('no list');
  return list
    .filter((item) => item && item[value] != null && item[label] != null)
    .map((item) => ({ label: String(item[label]), value: String(item[value]) }));
}

// --- The editor's addresses ---

/** @param {Request} request @param {Record<string, any>} env @param {{ mcp: Record<string, any>, access: (r: Request) => Promise<{ read: boolean, push: boolean } | null>, ask?: typeof fetch }} deps */
export async function handleMcpClient(request, env, deps) {
  const ask = deps.ask ?? fetch;
  const url = new URL(request.url);
  const parts = url.pathname.slice(ROOT.length).split('/').filter(Boolean);
  const [app, sub] = parts;
  if (!app || parts.length > 2) return json({ error: 'not found' }, 404);
  if (!env.CONSENT) return json({ error: 'no database' }, 503);
  try {
    if (app === 'callback') return await callback(request, url, env, deps, ask);
    const decl = deps.mcp[app];
    if (!decl) {
      await forgetApp(env, app);
      return json({ error: 'not found' }, 404);
    }
    const may = await deps.access(request);
    if (!may) return json({ error: 'signed out' }, 401);
    if (!may.read) return json({ error: 'forbidden' }, 403);
    const method = request.method;
    if (sub === 'options') {
      if (method !== 'GET') return json({ error: 'method' }, 405);
      const label = url.searchParams.get('label') ?? '';
      const value = url.searchParams.get('value') ?? '';
      const result = await callTool(env, app, decl, url.searchParams.get('tool') ?? '', {}, ask);
      return json(optionsOf(result, label, value));
    }
    if (sub) return json({ error: 'not found' }, 404);
    if (method === 'GET') return json(await stateOf(env, app, decl));
    if (!may.push) return json({ error: 'forbidden' }, 403);
    if (method === 'DELETE') {
      await forgetApp(env, app);
      return json(await stateOf(env, app, decl));
    }
    if (method !== 'POST') return json({ error: 'method' }, 405);
    return await connect(request, env, app, decl, ask);
  } catch (e) {
    if (e instanceof McpError) return json({ error: e.message }, e.status);
    return json({ error: 'failed' }, 502);
  }
}

/** What the browser may know: no credential. */
async function stateOf(env, app, decl) {
  const found = decl.auth === 'none' ? { state: 'ok' } : await secretOf(env, app);
  return {
    host: new URL(decl.server).host,
    tools: decl.tools,
    auth: decl.auth,
    connected: decl.auth === 'none' || found?.state === 'ok',
    needsSignIn: found?.state === 'needs-sign-in',
  };
}

async function connect(request, env, app, decl, ask) {
  if (decl.auth === 'none') return json(await stateOf(env, app, decl));
  if (decl.auth === 'token') {
    const body = await request.json().catch(() => null);
    if (typeof body?.token !== 'string' || !body.token.trim()) return json({ error: 'token' }, 400);
    await keep(env, app, { kind: 'token', token: body.token.trim() });
    return json(await stateOf(env, app, decl));
  }
  const deadline = Date.now() + TIMEOUT_MS;
  const meta = await discover(ask, decl.server, deadline);
  if (!meta.registration_endpoint) throw new McpError('no registration');
  const redirect = `${new URL(request.url).origin}${ROOT}callback`;
  const reg = await send(
    ask,
    meta.registration_endpoint,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        client_name: 'Morpheme',
        redirect_uris: [redirect],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      }),
    },
    deadline,
  );
  if (!reg.ok) throw new McpError('registration failed');
  const client = JSON.parse(await bodyOf(reg));
  if (typeof client.client_id !== 'string') throw new McpError('registration failed');
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(24)));
  await tables(env.CONSENT);
  await env.CONSENT.prepare('INSERT INTO mcp_app_pending (state, app, secret, at) VALUES (?, ?, ?, ?)')
    .bind(
      state,
      app,
      await seal(env, {
        verifier,
        redirect,
        clientId: client.client_id,
        clientSecret: client.client_secret,
        tokenEndpoint: meta.token_endpoint,
      }),
      Date.now(),
    )
    .run();
  const to = new URL(meta.authorization_endpoint);
  to.search = new URLSearchParams({
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: redirect,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    resource: decl.server,
  }).toString();
  return json({ url: to.href });
}

async function callback(request, url, env, deps, ask) {
  const back = (app) => new Response(null, { status: 302, headers: { location: `${url.origin}/editor/#apps/${app}` } });
  const state = url.searchParams.get('state') ?? '';
  await tables(env.CONSENT);
  const row = state
    ? (await env.CONSENT.prepare('SELECT app, secret, at FROM mcp_app_pending WHERE state = ?').bind(state).all()).results[0]
    : null;
  if (!row) return json({ error: 'unknown state' }, 400);
  await env.CONSENT.prepare('DELETE FROM mcp_app_pending WHERE state = ?').bind(state).run();
  const decl = deps.mcp[row.app];
  const pending = await open(env, row.secret);
  const code = url.searchParams.get('code');
  if (!decl || !pending || !code || row.at < Date.now() - PENDING_MS) return back(row.app);
  const deadline = Date.now() + TIMEOUT_MS;
  try {
    const res = await send(
      ask,
      pending.tokenEndpoint,
      form({
        grant_type: 'authorization_code',
        code,
        redirect_uri: pending.redirect,
        client_id: pending.clientId,
        code_verifier: pending.verifier,
        resource: decl.server,
        ...(pending.clientSecret ? { client_secret: pending.clientSecret } : {}),
      }),
      deadline,
    );
    if (!res.ok) throw new McpError('token failed');
    const secret = tokensOf(JSON.parse(await bodyOf(res)), {
      kind: 'oauth',
      clientId: pending.clientId,
      clientSecret: pending.clientSecret,
      tokenEndpoint: pending.tokenEndpoint,
    });
    await keep(env, row.app, secret);
  } catch {
    await keep(env, row.app, {}, 'needs-sign-in');
  }
  return back(row.app);
}
