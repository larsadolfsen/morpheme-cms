// The assistants' sign-in to the site's MCP server (worker/mcp.js): OAuth 2.1 with this Worker as the authorization server and
// GitHub as the identity (docs/superpowers/specs/2026-11-11-mcp-design.md). The assistant never sees a GitHub token.
//   GET  /.well-known/oauth-protected-resource[/mcp]   where the MCP endpoint's authorization server is (RFC 9728)
//   GET  /.well-known/oauth-authorization-server       the endpoints below (RFC 8414)
//   POST /oauth/mcp/register   an assistant registers itself: a name and redirect addresses (RFC 7591), no secret
//   An assistant may instead use the address of its client metadata document as its client_id (MCP 2025-11-25, Client ID
//   Metadata Documents): the Worker fetches it (https only, no redirects, small, a few seconds) and checks it as a registration.
//   GET  /oauth/mcp/authorize  checks the request, sends the person to GitHub (worker/oauth.js's /oauth/callback comes back, see
//                              handleMcpCallback), which ends on the consent page: Allow or Cancel
//   POST /oauth/mcp/consent    Allow or Cancel, from the consent page only; sends the assistant back with a code
//   POST /oauth/mcp/token      the code (with PKCE) for an access and a refresh token; a refresh token for a new pair
// Only someone GitHub says can save the site can connect an assistant. What is kept, and how, is in worker/mcp-store.js.
// Exposes handleMcpOAuth, handleMcpCallback, revokeGitHubToken. Depends on lib/mcpOAuth.mjs, worker/mcp-store.js, worker/session.js
// (accessOf), worker/say.js and @site/config.
import { config } from '@site/config';
import {
  authorizationServerMetadata,
  clientFromMetadataDocument,
  clientFromRegistration,
  isMetadataClientId,
  pkceMatches,
  protectedResourceMetadata,
  redirectProblem,
} from '../lib/mcpOAuth.mjs';
import { json } from './not-found.js';
import { langOf, say } from './say.js';
import { accessOf } from './session.js';
import { ready, store } from './mcp-store.js';

const t = (text, values) => say(config.locale, text, values);

const STATE_COOKIE = 'mcp_oauth_state';
const CONSENT_COOKIE = 'mcp_consent';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '86400',
};
// The state GitHub sends back, to tell this sign-in from the editor's own (worker/oauth.js).
export const STATE_PREFIX = 'mcp.';
const CHALLENGE = /^[A-Za-z0-9_-]{43}$/;

const withCors = (res) => {
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
};
const answer = (data, status = 200) => withCors(json(data, status));
const oauthError = (error, error_description, status = 400) => answer({ error, error_description }, status);

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** A page of the sign-in (for a person, never for the assistant): no framing, no caching, no scripts. */
function page(title, body, status = 200, cookies = [], formAction = "'self'") {
  const html = `<!doctype html><html lang="${langOf(config.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:0 auto;padding:2rem 1rem;line-height:1.5}h1{font-size:1.5rem}form{display:flex;gap:.75rem;margin-top:1.5rem}button{font:inherit;padding:.6rem 1.25rem;border-radius:2rem;border:1px solid #888;background:#fff;cursor:pointer}button.allow{background:#1a56db;border-color:#1a56db;color:#fff}</style></head>
<body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-frame-options': 'DENY',
    'content-security-policy': `default-src 'none'; style-src 'unsafe-inline'; form-action ${formAction}; frame-ancestors 'none'`,
    'referrer-policy': 'no-referrer',
  });
  for (const c of cookies) headers.append('set-cookie', c);
  return new Response(html, { status, headers });
}
const problemPage = (text, status = 400, cookies = []) =>
  page(t('This sign-in can’t be finished'), `<p>${escapeHtml(text)}</p>`, status, cookies);

/** One line per step of the sign-in in Workers Logs: what happened, never a token, code, secret or address with a query. */
const trace = (step, outcome, extra = {}) => console.log(`mcp-oauth ${step}: ${outcome}`, JSON.stringify(extra));

const cookieOf = (request, name) => request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
const cookie = (name, value, path, maxAge, sameSite) =>
  `${name}=${value}; Path=${path}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=${sameSite}`;

/** The assistant's own address, with a result in its query: its redirect address is checked on registration and again on each request. */
function back(redirectUri, params, status = 302) {
  const to = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) to.searchParams.set(k, v);
  return new Response(null, { status, headers: { location: to.href, 'cache-control': 'no-store' } });
}

/** Has GitHub forget a token (this one only): the person did not Allow, cannot save the site, or disconnected. Never throws. */
export async function revokeGitHubToken(env, token, ask = fetch) {
  if (!token || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return;
  try {
    await ask(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`, {
      method: 'DELETE',
      headers: {
        authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
        accept: 'application/vnd.github+json',
        'user-agent': `${config.repo.name}-worker`,
      },
      body: JSON.stringify({ access_token: token }),
    });
  } catch {
    // The token is gone from the Worker either way.
  }
}

/** The answer of the discovery addresses, /oauth/mcp/*, or null for another address. @param {Request} request @param {Record<string, any>} env @param {typeof fetch} [ask] fetch, for GitHub */
export async function handleMcpOAuth(request, env, ask = fetch) {
  const url = new URL(request.url);
  const path = url.pathname;
  const discovery = /^\/\.well-known\/oauth-(protected-resource(\/mcp)?|authorization-server)$/.exec(path);
  if (!discovery && !path.startsWith('/oauth/mcp/')) return null;
  if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
  if (discovery) {
    if (request.method !== 'GET') return answer({ error: 'method' }, 405);
    return answer(discovery[1].startsWith('protected') ? protectedResourceMetadata(url.origin) : authorizationServerMetadata(url.origin));
  }
  const route = path.slice('/oauth/mcp/'.length);
  const known = ['register', 'authorize', 'consent', 'token'];
  if (!known.includes(route)) return null;
  if (!ready(env)) {
    return route === 'authorize' || route === 'consent'
      ? problemPage(t('Assistants are not set up on this site yet.'), 503)
      : oauthError('temporarily_unavailable', 'Assistants are not set up on this site yet.', 503);
  }
  const want = route === 'authorize' ? 'GET' : 'POST';
  if (request.method !== want) return answer({ error: 'method' }, 405);
  if (route === 'register') return register(request, env);
  if (route === 'authorize') return authorize(url, env, ask);
  if (route === 'consent') return consent(request, url, env, ask);
  return token(request, url, env);
}

const METADATA_MAX_BYTES = 8 * 1024;
const METADATA_TIMEOUT_MS = 5000;

/** The assistant a client_id names: one that registered, or one whose metadata document is at the address the client_id is. */
async function clientOf(db, id, ask) {
  if (!isMetadataClientId(id)) return db.client(id);
  try {
    const res = await ask(id, {
      redirect: 'manual', // workerd has no 'error'; a redirect answer is not ok, so it is refused
      headers: { accept: 'application/json', 'user-agent': 'morpheme-cms' },
      signal: AbortSignal.timeout(METADATA_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > METADATA_MAX_BYTES) return null;
    const made = clientFromMetadataDocument(id, JSON.parse(text));
    if (made.problem) return null;
    await db.saveMetadataClient(id, made.name, made.redirectUris);
    return { id, name: made.name, redirectUris: made.redirectUris };
  } catch {
    return null;
  }
}

async function register(request, env) {
  const body = await request.json().catch(() => null);
  const made = clientFromRegistration(body);
  trace('register', made.problem ?? 'ok', { method: body?.token_endpoint_auth_method, grants: body?.grant_types });
  if (made.problem) return oauthError('invalid_client_metadata', made.problem);
  const id = await (await store(env)).addClient(made.name, made.redirectUris);
  return answer(
    {
      client_id: id,
      client_name: made.name,
      redirect_uris: made.redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_id_issued_at: Math.floor(Date.now() / 1000),
    },
    201,
  );
}

async function authorize(url, env, ask) {
  const q = url.searchParams;
  const db = await store(env);
  const client = await clientOf(db, q.get('client_id'), ask);
  const redirectUri = q.get('redirect_uri');
  trace('authorize', client ? (client.redirectUris.includes(redirectUri) ? 'ok' : 'redirect_uri not registered') : 'client unknown', {
    resource: q.get('resource'),
    method: q.get('code_challenge_method'),
  });
  // Until the assistant and its redirect address are known to be one it registered, an error goes to the person, not to an address.
  if (!client || !redirectUri || redirectProblem(redirectUri) || !client.redirectUris.includes(redirectUri))
    return problemPage(t('This assistant isn’t known here, or its return address doesn’t match. Connect it again from the assistant.'));
  const state = q.get('state') ?? undefined;
  const fail = (error, description) => back(redirectUri, { error, error_description: description, state });
  if (q.get('response_type') !== 'code') return fail('unsupported_response_type', 'Only response_type=code is supported.');
  const challenge = q.get('code_challenge') ?? '';
  if (!CHALLENGE.test(challenge) || q.get('code_challenge_method') !== 'S256')
    return fail('invalid_request', 'PKCE with code_challenge_method=S256 is required.');
  const resource = q.get('resource');
  if (resource && resource !== `${url.origin}/mcp`) return fail('invalid_target', `The resource is ${url.origin}/mcp.`);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET)
    return problemPage(t('GitHub login is not set up yet (GITHUB_CLIENT_ID/SECRET are missing).'), 503);
  const id = await db.addPending({ clientId: client.id, redirectUri, state, challenge });
  const github = new URL('https://github.com/login/oauth/authorize');
  github.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/oauth/callback`,
    scope: 'repo',
    state: `${STATE_PREFIX}${id}`,
  });
  return new Response(null, {
    status: 302,
    headers: { location: github.href, 'set-cookie': cookie(STATE_COOKIE, id, '/oauth/', 600, 'Lax'), 'cache-control': 'no-store' },
  });
}

/**
 * GitHub's answer to /oauth/mcp/authorize, which worker/oauth.js passes on (its state starts with "mcp."): swaps the code for the
 * person's token, checks that they can save the site, and shows the consent page.
 * @param {Request} request @param {URL} url @param {Record<string, any>} env @param {typeof fetch} [ask]
 */
export async function handleMcpCallback(request, url, env, ask = fetch) {
  const clear = [cookie(STATE_COOKIE, '', '/oauth/', 0, 'Lax')];
  const id = url.searchParams.get('state')?.slice(STATE_PREFIX.length);
  const code = url.searchParams.get('code');
  if (!ready(env)) return problemPage(t('Assistants are not set up on this site yet.'), 503, clear);
  if (!id || !code || id !== cookieOf(request, STATE_COOKIE))
    return problemPage(`${t('Login failed (invalid or expired request).')} ${t('Connect it again from the assistant.')}`, 400, clear);
  const db = await store(env);
  const pending = await db.pending(id);
  if (!pending)
    return problemPage(`${t('Login failed (invalid or expired request).')} ${t('Connect it again from the assistant.')}`, 400, clear);
  const res = await ask('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'morpheme-cms' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/oauth/callback`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token)
    return problemPage(t('Login failed: {reason}', { reason: data.error_description ?? data.error ?? res.status }), 400, clear);
  const token = data.access_token;
  const [user, may] = await Promise.all([
    ask('https://api.github.com/user', {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': `${config.repo.name}-worker` },
    }).then((r) => (r.ok ? r.json().catch(() => null) : null)),
    accessOf(token, ask),
  ]);
  if (!user?.id || !user.login || !may?.push) {
    await db.dropPending(id);
    await revokeGitHubToken(env, token, ask);
    return problemPage(
      t('{login} can’t save this site, so an assistant can’t connect for them.', { login: user?.login ?? 'GitHub' }),
      403,
      clear,
    );
  }
  if (!(await db.signPending(id, user.id, user.login, token)))
    return problemPage(t('Login failed (invalid or expired request).'), 400, clear);
  const client = await db.client(pending.clientId);
  const body = `<p>${escapeHtml(t('{assistant} wants to connect to {site}.', { assistant: client?.name ?? 'Assistant', site: config.name }))}</p>
<p>${escapeHtml(t('Signed in to GitHub as {login}.', { login: user.login }))}</p>
<p>${escapeHtml(t('It can read your pages and posts and the settings of your apps. It can’t change anything.'))}</p>
<form method="post" action="/oauth/mcp/consent"><input type="hidden" name="pending" value="${escapeHtml(id)}">
<button class="allow" name="decision" value="allow">${escapeHtml(t('Allow'))}</button><button name="decision" value="deny">${escapeHtml(t('Cancel'))}</button></form>`;
  trace('callback', 'consent page shown', { client: client?.name, login: user.login });
  // Browsers also check form-action on the redirect a POST answers with: without the assistant's own origin the redirect back to it is blocked.
  return page(
    t('Connect {assistant}?', { assistant: client?.name ?? 'Assistant' }),
    body,
    200,
    [...clear, cookie(CONSENT_COOKIE, id, '/oauth/mcp/', 600, 'Lax')],
    `'self' ${new URL(pending.redirectUri).origin}`,
  );
}

/** Allow or Cancel, from the consent page: the same browser (its cookie) and the site's own page. */
async function consent(request, url, env, ask) {
  const site = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  // Same-origin by the browser's own header, or by a matching Origin (some in-app browsers send another or no Sec-Fetch-Site).
  if (site !== 'same-origin' && origin !== url.origin) return problemPage(t('This must be done from the consent page of this site.'), 403);
  const form = await request.formData().catch(() => null);
  const id = form?.get('pending');
  if (typeof id !== 'string' || !id) return problemPage(t('The consent page sent no request to answer.'), 403);
  const db = await store(env);
  const pending = await db.pending(id);
  // Already answered (a double tap or a replayed request): nothing left to decide, and no error to show.
  if (!pending) {
    trace('consent', 'already answered');
    return page(t('Already answered'), `<p>${escapeHtml(t('You can close this page and go back to the assistant.'))}</p>`, 200, [
      cookie(CONSENT_COOKIE, '', '/oauth/mcp/', 0, 'Lax'),
    ]);
  }
  if (id !== cookieOf(request, CONSENT_COOKIE))
    return problemPage(t('This browser did not keep the sign-in. Connect it again from the assistant.'), 403);
  const client = pending && (await db.client(pending.clientId));
  if (!pending?.userId || !pending.token || !client)
    return problemPage(`${t('Login failed (invalid or expired request).')} ${t('Connect it again from the assistant.')}`, 400);
  const clear = [cookie(CONSENT_COOKIE, '', '/oauth/mcp/', 0, 'Lax')];
  await db.dropPending(id);
  if (form.get('decision') !== 'allow') {
    trace('consent', 'denied');
    await revokeGitHubToken(env, pending.token, ask);
    const res = back(pending.redirectUri, { error: 'access_denied', state: pending.state ?? undefined }, 303);
    for (const c of clear) res.headers.append('set-cookie', c);
    return res;
  }
  const made = await db.connect({
    userId: pending.userId,
    login: pending.login,
    client,
    redirectUri: pending.redirectUri,
    challenge: pending.challenge,
  });
  await db.keepGitHubToken(pending.userId, pending.token);
  trace('consent', 'allowed, redirecting with a code', { client: client.name, host: new URL(pending.redirectUri).host });
  const res = back(pending.redirectUri, { code: made.code, state: pending.state ?? undefined, iss: url.origin }, 303);
  for (const c of clear) res.headers.append('set-cookie', c);
  return res;
}

async function token(request, url, env) {
  const type = request.headers.get('content-type') ?? '';
  const body = type.includes('json')
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());
  const grant = body.grant_type;
  if (body.resource && body.resource !== `${url.origin}/mcp`) return oauthError('invalid_target', `The resource is ${url.origin}/mcp.`);
  const db = await store(env);
  const issue = async (connectionId, replacing) => {
    const made = await db.issue(connectionId, replacing);
    return answer({
      access_token: made.access,
      token_type: 'Bearer',
      expires_in: made.expiresIn,
      refresh_token: made.refresh,
      scope: 'read',
    });
  };
  if (grant === 'authorization_code') {
    // The code is used up by being looked at, so a wrong try cannot be tried again.
    const found = await db.takeCode(body.code);
    const why = !found
      ? 'code unknown, used or expired'
      : found.clientId !== body.client_id
        ? 'client_id differs'
        : found.redirectUri !== body.redirect_uri
          ? 'redirect_uri differs'
          : !(await pkceMatches(body.code_verifier, found.challenge))
            ? 'code_verifier does not match'
            : null;
    trace('token', why ?? 'code accepted', {
      type: type.split(';')[0],
      hasClientId: !!body.client_id,
      basicAuth: request.headers.has('authorization'),
    });
    if (why) return oauthError('invalid_grant', 'The code is wrong, used or expired.');
    return issue(found.connectionId);
  }
  if (grant === 'refresh_token') {
    const connection = await db.byToken('refresh', body.refresh_token);
    trace(
      'token',
      connection ? (connection.clientId === body.client_id ? 'refresh accepted' : 'refresh: client_id differs') : 'refresh unknown',
    );
    if (!connection || connection.clientId !== body.client_id)
      return oauthError('invalid_grant', 'The refresh token is wrong, used or expired.');
    return issue(connection.id, body.refresh_token);
  }
  trace('token', 'unsupported grant_type', { grant });
  return oauthError('unsupported_grant_type', 'Use authorization_code or refresh_token.');
}
