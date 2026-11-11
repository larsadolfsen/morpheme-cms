// Tests for the assistants' connection to the site (worker/mcp-oauth.js, mcp.js, mcp-connections.js, mcp-store.js): discovery,
// registration, the consent page after GitHub's sign-in, tokens, the access check on every call, the read-only tools, Disconnect.
// GitHub is a fake `ask` (who is who, who may save the site, which tokens were revoked), D1 is SQLite in memory and the site's
// files are a map; nothing leaves the computer. The Worker's modules are bundled as wrangler does, with a stand-in for `@site/config`.
// Run: node --test worker/mcp.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { before, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { d1 } from './fixtures/d1.mjs';

const outfile = join(mkdtempSync(join(tmpdir(), 'mcp-')), 'worker.mjs');
await build({
  stdin: {
    contents: ['mcp-oauth.js', 'mcp.js', 'mcp-connections.js', 'mcp-store.js', 'editor-host.js', 'session.js']
      .map((f, i) => `export * as m${i} from ${JSON.stringify(fileURLToPath(new URL(`./${f}`, import.meta.url)))};`)
      .join('\n'),
    resolveDir: fileURLToPath(new URL('..', import.meta.url)),
    loader: 'js',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  // The package `yaml` is CommonJS for Node (wrangler takes its browser build); a require makes it run here.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  outfile,
  logLevel: 'silent',
  plugins: [
    {
      name: 'site-config-stand-in',
      setup(b) {
        b.onResolve({ filter: /^@site\/config$/ }, () => ({ path: 'config', namespace: 'stand-in' }));
        b.onLoad({ filter: /.*/, namespace: 'stand-in' }, () => ({
          contents: `export const config = ${JSON.stringify({
            name: 'Demo',
            locale: 'en-US',
            domain: 'demo.example',
            repo: { owner: 'owner', name: 'site', branch: 'main' },
            folders: { pages: 'src/content/pages', blog: 'src/content/blog' },
            apps: { installed: 'src/data/apps.json', settings: 'src/data/apps', folder: 'src/apps' },
            theme: 'src/data/theme.json',
          })};`,
          loader: 'js',
        }));
      },
    },
  ],
});
const { m0: oauth, m1: mcp, m2: connections, m3: storage, m4: host, m5: session } = await import(pathToFileURL(outfile).href);

const ORIGIN = 'https://editor.example';
const REDIRECT = 'https://assistant.example/callback';
const VERIFIER = 'v'.repeat(50);
const CHALLENGE = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(VERIFIER)))))
  .replaceAll('+', '-')
  .replaceAll('/', '_')
  .replace(/=+$/, '');

// GitHub: tokens "gho_<code>" belong to the users in USERS; `may` says what each login may do in the repository.
const USERS = { lars: { id: 11, login: 'lars' }, guest: { id: 22, login: 'guest' }, gone: { id: 33, login: 'gone' } };
const github = {
  may: { lars: { pull: true, push: true }, guest: { pull: true, push: false }, gone: { pull: true, push: true } },
  revoked: [],
  signedOut: new Set(),
  asked: 0,
};
const loginOf = (token) => token.replace(/^gho_/, '').split('-')[0];
async function ask(url, init = {}) {
  url = String(url);
  github.asked++;
  const token = init.headers?.authorization?.replace('Bearer ', '');
  if (url === 'https://github.com/login/oauth/access_token') {
    const { code } = JSON.parse(init.body);
    return code === 'bad' ? Response.json({ error: 'bad_verification_code' }) : Response.json({ access_token: `gho_${code}` });
  }
  if (url.startsWith('https://api.github.com/applications/') && init.method === 'DELETE') {
    github.revoked.push(JSON.parse(init.body).access_token);
    return new Response(null, { status: 204 });
  }
  if (!token || github.signedOut.has(token)) return new Response(null, { status: 401 });
  const user = USERS[loginOf(token)];
  if (!user) return new Response(null, { status: 401 });
  if (url === 'https://api.github.com/user') return Response.json(user);
  if (url === 'https://api.github.com/repos/owner/site') return Response.json({ permissions: github.may[user.login] });
  return new Response(null, { status: 404 });
}

const FILES = {
  'src/content/pages/about.md': '---\ntitle: "About us"\n---\n\nHello.\n',
  'src/content/blog/first.md': '---\ntitle: "First"\ndate: 2026-10-01\n---\n\nPost.\n',
  'src/data/apps.json': '{"installed":["calendly"]}',
  'src/apps/calendly/app.json': JSON.stringify({
    label: 'Calendly',
    version: '1.0.0',
    settings: { fields: [{ name: 'key', secret: true }], values: {} },
  }),
  'src/data/apps/calendly.json': '{"url":"https://calendly.com/me","key":"SECRET-KEY"}',
};
const readers = [];
const site = (token) => {
  readers.push(token);
  return {
    config: {
      name: 'Demo',
      locale: 'en-US',
      repo: { owner: 'owner', name: 'site' },
      folders: { pages: 'src/content/pages', blog: 'src/content/blog' },
      apps: { installed: 'src/data/apps.json', settings: 'src/data/apps', folder: 'src/apps' },
      theme: 'src/data/theme.json',
    },
    files: async (folders) =>
      Object.keys(FILES)
        .filter((p) => folders.some((f) => p.startsWith(`${f}/`)))
        .map((path) => ({ path, oid: path })),
    texts: async (oids) => new Map(oids.map((o) => [o, FILES[o]])),
  };
};

const fresh = () => ({ CONSENT: d1(), MCP_VAULT_KEY: 'vault-secret', GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 'csecret' });
const cookies = (res) =>
  Object.fromEntries(
    res.headers
      .getSetCookie()
      .map((c) => c.split(';')[0].split('='))
      .map(([k, ...v]) => [k, v.join('=')]),
  );
const cookieHeader = (jar) =>
  Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
const form = (path, fields, headers = {}) =>
  new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin', ...headers },
    body: new URLSearchParams(fields),
  });
const post = (path, body, headers = {}) =>
  new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
const authorizeUrl = (client, extra = {}) =>
  `${ORIGIN}/oauth/mcp/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: client,
    redirect_uri: REDIRECT,
    state: 'xyz',
    code_challenge: CHALLENGE,
    code_challenge_method: 'S256',
    ...extra,
  })}`;

async function register(env, body = { client_name: 'Claude', redirect_uris: [REDIRECT] }) {
  const res = await oauth.handleMcpOAuth(post('/oauth/mcp/register', body), env, ask);
  return { res, body: await res.clone().json() };
}

/** Goes through sign-in and consent as `login`; gives the redirect the person ends on (Allow) or the pages on the way. */
async function connect(env, login = 'lars', decision = 'allow') {
  const { body: client } = await register(env);
  const start = await oauth.handleMcpOAuth(new Request(authorizeUrl(client.client_id)), env, ask);
  assert.equal(start.status, 302);
  const to = new URL(start.headers.get('location'));
  assert.equal(to.origin + to.pathname, 'https://github.com/login/oauth/authorize');
  const jar = cookies(start);
  const state = to.searchParams.get('state');
  const back = await oauth.handleMcpCallback(
    new Request(`${ORIGIN}/oauth/callback?code=${login}&state=${state}`, { headers: { cookie: cookieHeader(jar) } }),
    new URL(`${ORIGIN}/oauth/callback?code=${login}&state=${state}`),
    env,
    ask,
  );
  Object.assign(jar, cookies(back));
  if (back.status !== 200 || !back.headers.get('content-type').includes('html')) return { client, back, jar };
  const html = await back.text();
  const pending = /name="pending" value="([^"]+)"/.exec(html)?.[1];
  const end = await oauth.handleMcpOAuth(form('/oauth/mcp/consent', { pending, decision }, { cookie: cookieHeader(jar) }), env, ask);
  return { client, back, html, jar, end, pending };
}
const codeOf = (end) => new URL(end.headers.get('location')).searchParams.get('code');

async function signedIn(login = 'lars') {
  const env = fresh();
  const { client, end } = await connect(env, login);
  const res = await oauth.handleMcpOAuth(
    form('/oauth/mcp/token', {
      grant_type: 'authorization_code',
      code: codeOf(end),
      redirect_uri: REDIRECT,
      client_id: client.client_id,
      code_verifier: VERIFIER,
    }),
    env,
    ask,
  );
  return { env, client, tokens: await res.json() };
}
const rpc = (env, token, message, headers = {}) =>
  mcp.handleMcp(
    new Request(`${ORIGIN}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
      body: JSON.stringify(message),
    }),
    env,
    { waitUntil() {} },
    { ask, site },
  );
const call = async (env, token, name, args = {}) =>
  (await (await rpc(env, token, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } })).json()).result;

before(() => {
  github.revoked.length = 0;
});

test('discovery: the protected resource and the authorization server, with CORS', async () => {
  const resource = await oauth.handleMcpOAuth(new Request(`${ORIGIN}/.well-known/oauth-protected-resource`), fresh(), ask);
  assert.equal(resource.status, 200);
  assert.equal(resource.headers.get('access-control-allow-origin'), '*');
  assert.equal((await resource.json()).resource, `${ORIGIN}/mcp`);
  const resource2 = await oauth.handleMcpOAuth(new Request(`${ORIGIN}/.well-known/oauth-protected-resource/mcp`), fresh(), ask);
  assert.equal((await resource2.json()).resource, `${ORIGIN}/mcp`);
  const server = await (await oauth.handleMcpOAuth(new Request(`${ORIGIN}/.well-known/oauth-authorization-server`), fresh(), ask)).json();
  assert.equal(server.registration_endpoint, `${ORIGIN}/oauth/mcp/register`);
  assert.deepEqual(server.code_challenge_methods_supported, ['S256']);
  const preflight = await oauth.handleMcpOAuth(new Request(`${ORIGIN}/oauth/mcp/token`, { method: 'OPTIONS' }), fresh(), ask);
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('access-control-allow-headers'), /authorization/i);
  assert.equal(await oauth.handleMcpOAuth(new Request(`${ORIGIN}/oauth/other`), fresh(), ask), null);
});

test('without the database or the vault secret, nothing connects and the editor can tell', async () => {
  assert.equal(storage.ready(fresh()), true);
  assert.equal(storage.ready({ CONSENT: d1() }), false);
  assert.equal(storage.ready({ MCP_VAULT_KEY: 'x' }), false);
  const res = await oauth.handleMcpOAuth(post('/oauth/mcp/register', { redirect_uris: [REDIRECT] }), { CONSENT: d1() }, ask);
  assert.equal(res.status, 503);
  const mcpRes = await mcp.handleMcp(new Request(`${ORIGIN}/mcp`, { method: 'POST', body: '{}' }), {}, undefined, { ask, site });
  assert.equal(mcpRes.status, 503);
});

test('registration keeps the name and refuses a bad redirect address', async () => {
  const env = fresh();
  const ok = await register(env);
  assert.equal(ok.res.status, 201);
  assert.match(ok.body.client_id, /^[\w-]{20,}$/);
  assert.deepEqual(ok.body.redirect_uris, [REDIRECT]);
  assert.equal(ok.body.token_endpoint_auth_method, 'none');
  assert.equal(ok.body.client_secret, undefined);
  for (const bad of [
    { redirect_uris: ['http://evil.example/cb'] },
    { redirect_uris: [] },
    { redirect_uris: [REDIRECT], token_endpoint_auth_method: 'client_secret_post' },
  ]) {
    const res = await register(env, bad);
    assert.equal(res.res.status, 400);
    assert.equal(res.body.error, 'invalid_client_metadata');
  }
  const notJson = await oauth.handleMcpOAuth(new Request(`${ORIGIN}/oauth/mcp/register`, { method: 'POST', body: 'x' }), env, ask);
  assert.equal(notJson.status, 400);
  assert.equal((await oauth.handleMcpOAuth(new Request(`${ORIGIN}/oauth/mcp/register`), env, ask)).status, 405);
});

test('authorize: an unknown assistant or an unregistered redirect address gets a page, never a redirect', async () => {
  const env = fresh();
  const { body: client } = await register(env);
  const unknown = await oauth.handleMcpOAuth(new Request(authorizeUrl('nope')), env, ask);
  assert.equal(unknown.status, 400);
  assert.equal(unknown.headers.get('location'), null);
  const other = await oauth.handleMcpOAuth(
    new Request(authorizeUrl(client.client_id, { redirect_uri: 'https://evil.example/cb' })),
    env,
    ask,
  );
  assert.equal(other.status, 400);
  assert.equal(other.headers.get('location'), null);
});

test('authorize: PKCE with S256 is required, and the error goes back to the assistant with its state', async () => {
  const env = fresh();
  const { body: client } = await register(env);
  for (const extra of [{ code_challenge: '' }, { code_challenge_method: 'plain' }, { response_type: 'token' }]) {
    const res = await oauth.handleMcpOAuth(new Request(authorizeUrl(client.client_id, extra)), env, ask);
    assert.equal(res.status, 302, JSON.stringify(extra));
    const to = new URL(res.headers.get('location'));
    assert.equal(to.origin + to.pathname, REDIRECT);
    assert.ok(['invalid_request', 'unsupported_response_type'].includes(to.searchParams.get('error')));
    assert.equal(to.searchParams.get('state'), 'xyz');
  }
});

test('authorize: sends the person to GitHub, with a state tied to their browser', async () => {
  const env = fresh();
  const { body: client } = await register(env);
  const res = await oauth.handleMcpOAuth(new Request(authorizeUrl(client.client_id)), env, ask);
  const to = new URL(res.headers.get('location'));
  assert.equal(to.searchParams.get('client_id'), 'cid');
  assert.equal(to.searchParams.get('redirect_uri'), `${ORIGIN}/oauth/callback`);
  assert.match(to.searchParams.get('state'), /^mcp\.[\w-]{40,}$/);
  assert.equal(cookies(res).mcp_oauth_state, to.searchParams.get('state').slice(4));
  assert.match(res.headers.get('set-cookie'), /HttpOnly/);
  assert.match(res.headers.get('set-cookie'), /Secure/);
  const unset = await oauth.handleMcpOAuth(new Request(authorizeUrl(client.client_id)), { ...env, GITHUB_CLIENT_ID: undefined }, ask);
  assert.equal(unset.status, 503);
});

test('callback: a state that is not the browser’s, or a failed GitHub code, ends on an error page', async () => {
  const env = fresh();
  const { body: client } = await register(env);
  const start = await oauth.handleMcpOAuth(new Request(authorizeUrl(client.client_id)), env, ask);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  const call = (code, st, jar) =>
    oauth.handleMcpCallback(
      new Request(`${ORIGIN}/oauth/callback`, { headers: { cookie: cookieHeader(jar) } }),
      new URL(`${ORIGIN}/oauth/callback?code=${code}&state=${st}`),
      env,
      ask,
    );
  assert.equal((await call('lars', state, {})).status, 400);
  assert.equal((await call('lars', state, { mcp_oauth_state: 'other' })).status, 400);
  assert.equal((await call('bad', state, cookies(start))).status, 400);
});

test('callback: someone who cannot save the site is refused, and their GitHub token is dropped', async () => {
  const env = fresh();
  github.revoked.length = 0;
  const { back, client } = await connect(env, 'guest');
  assert.equal(back.status, 403);
  assert.match(await back.text(), /can.t save this site/i);
  assert.deepEqual(github.revoked, ['gho_guest']);
  assert.deepEqual(await (await storage.store(env)).connections(), []);
  assert.ok(client);
});

test('the consent page names the assistant and the person, and says it only reads', async () => {
  const env = fresh();
  const { back, html } = await connect(env);
  assert.equal(back.status, 200);
  assert.match(html, /Claude/);
  assert.match(html, /lars/);
  assert.match(html, /read/i);
  assert.match(html, /can.t change anything/i);
  assert.equal(back.headers.get('x-frame-options'), 'DENY');
  assert.match(back.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(back.headers.get('cache-control'), 'no-store');
  assert.match(back.headers.get('set-cookie'), /mcp_consent=/);
});

test('the consent page escapes what an assistant calls itself', async () => {
  const env = fresh();
  const { body: client } = await register(env, { client_name: '<script>alert(1)</script>', redirect_uris: [REDIRECT] });
  const start = await oauth.handleMcpOAuth(new Request(authorizeUrl(client.client_id)), env, ask);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  const back = await oauth.handleMcpCallback(
    new Request(`${ORIGIN}/oauth/callback`, { headers: { cookie: cookieHeader(cookies(start)) } }),
    new URL(`${ORIGIN}/oauth/callback?code=lars&state=${state}`),
    env,
    ask,
  );
  const html = await back.text();
  assert.ok(!html.includes('<script>alert'));
  assert.match(html, /&lt;script&gt;/);
});

test('Cancel sends the assistant back with access_denied and keeps nothing', async () => {
  const env = fresh();
  const { end } = await connect(env, 'lars', 'deny');
  const to = new URL(end.headers.get('location'));
  assert.equal(to.origin + to.pathname, REDIRECT);
  assert.equal(to.searchParams.get('error'), 'access_denied');
  assert.equal(to.searchParams.get('state'), 'xyz');
  assert.equal(to.searchParams.get('code'), null);
  assert.deepEqual(await (await storage.store(env)).connections(), []);
});

test('Allow needs the same browser and the same address: no cookie, another cookie or another site is refused', async () => {
  const env = fresh();
  const { back, jar, pending } = await connect(env);
  assert.equal(back.status, 200);
  const allow = (headers, id = pending) =>
    oauth.handleMcpOAuth(form('/oauth/mcp/consent', { pending: id, decision: 'allow' }, headers), env, ask);
  // The connect() helper already allowed it once; start a new pending one for the refusals.
  const { body: client } = await register(env);
  const start = await oauth.handleMcpOAuth(new Request(authorizeUrl(client.client_id)), env, ask);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  const j = cookies(start);
  const second = await oauth.handleMcpCallback(
    new Request(`${ORIGIN}/oauth/callback`, { headers: { cookie: cookieHeader(j) } }),
    new URL(`${ORIGIN}/oauth/callback?code=lars&state=${state}`),
    env,
    ask,
  );
  const id = /name="pending" value="([^"]+)"/.exec(await second.text())[1];
  assert.equal((await allow({}, id)).status, 403);
  assert.equal((await allow({ cookie: 'mcp_consent=other' }, id)).status, 403);
  assert.equal((await allow({ cookie: `mcp_consent=${id}`, 'sec-fetch-site': 'cross-site' }, id)).status, 403);
  assert.equal((await oauth.handleMcpOAuth(new Request(`${ORIGIN}/oauth/mcp/consent`), env, ask)).status, 405);
  assert.ok(jar);
});

test('Allow keeps the connection, seals the GitHub token and gives a code once', async () => {
  const env = fresh();
  const { end } = await connect(env);
  assert.equal(end.status, 302);
  const to = new URL(end.headers.get('location'));
  assert.equal(to.origin + to.pathname, REDIRECT);
  assert.equal(to.searchParams.get('state'), 'xyz');
  assert.equal(to.searchParams.get('iss'), ORIGIN);
  assert.ok(to.searchParams.get('code'));
  const store = await storage.store(env);
  const [one] = await store.connections();
  assert.equal(one.name, 'Claude');
  assert.equal(one.login, 'lars');
  assert.equal(one.lastUsed, null);
  assert.equal(await store.gitHubToken(11), 'gho_lars');
  const dump = JSON.stringify([
    ...env.CONSENT.db.prepare('SELECT * FROM mcp_vault').all(),
    ...env.CONSENT.db.prepare('SELECT * FROM mcp_codes').all(),
  ]);
  assert.ok(!dump.includes('gho_lars'), 'the GitHub token is in the database as it is');
  assert.ok(!dump.includes(to.searchParams.get('code')), 'the code is in the database as it is');
  // Another secret cannot open the vault.
  assert.equal(await (await storage.store({ ...env, MCP_VAULT_KEY: 'another' })).gitHubToken(11), null);
});

test('token: the code with the right verifier gives an access and a refresh token; only hashes are kept', async () => {
  const { env, client, tokens } = await signedIn();
  assert.equal(tokens.token_type, 'Bearer');
  assert.equal(tokens.expires_in, 3600);
  assert.equal(tokens.scope, 'read');
  assert.ok(tokens.access_token && tokens.refresh_token && tokens.access_token !== tokens.refresh_token);
  const dump = JSON.stringify(env.CONSENT.db.prepare('SELECT * FROM mcp_tokens').all());
  assert.ok(!dump.includes(tokens.access_token) && !dump.includes(tokens.refresh_token));
  assert.ok(client);
});

test('token: a wrong verifier, redirect address or assistant, a used code and rubbish are refused', async () => {
  const env = fresh();
  const ask1 = async () => {
    const { client, end } = await connect(env);
    return { client, code: codeOf(end) };
  };
  const token = async (fields) => {
    const res = await oauth.handleMcpOAuth(form('/oauth/mcp/token', fields), env, ask);
    return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
  };
  let { client, code } = await ask1();
  const base = { grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: client.client_id, code_verifier: VERIFIER };
  assert.equal((await token({ ...base, code_verifier: 'w'.repeat(50) })).body.error, 'invalid_grant');
  // A wrong try used the code up: it cannot be tried again.
  assert.equal((await token(base)).body.error, 'invalid_grant');
  ({ client, code } = await ask1());
  const again = { ...base, code, client_id: client.client_id };
  assert.equal((await token({ ...again, redirect_uri: 'https://assistant.example/other' })).body.error, 'invalid_grant');
  ({ client, code } = await ask1());
  assert.equal((await token({ ...again, code, client_id: 'someone-else' })).body.error, 'invalid_grant');
  ({ client, code } = await ask1());
  const good = await token({ ...again, code, client_id: client.client_id });
  assert.equal(good.status, 200);
  assert.equal(good.cache, 'no-store');
  assert.equal((await token({ ...again, code, client_id: client.client_id })).body.error, 'invalid_grant');
  assert.equal((await token({ grant_type: 'password' })).body.error, 'unsupported_grant_type');
  assert.equal((await token({})).body.error, 'unsupported_grant_type');
  assert.equal((await oauth.handleMcpOAuth(new Request(`${ORIGIN}/oauth/mcp/token`), env, ask)).status, 405);
});

test('token: a refresh token gives a new pair and is used up', async () => {
  const { env, client, tokens } = await signedIn();
  const refresh = (token) =>
    oauth.handleMcpOAuth(
      form('/oauth/mcp/token', { grant_type: 'refresh_token', refresh_token: token, client_id: client.client_id }),
      env,
      ask,
    );
  const next = await (await refresh(tokens.refresh_token)).json();
  assert.ok(next.access_token && next.refresh_token);
  assert.notEqual(next.access_token, tokens.access_token);
  const old = await refresh(tokens.refresh_token);
  assert.equal(old.status, 400);
  assert.equal((await old.json()).error, 'invalid_grant');
  assert.equal((await rpc(env, next.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' })).status, 200);
  const wrongClient = await oauth.handleMcpOAuth(
    form('/oauth/mcp/token', { grant_type: 'refresh_token', refresh_token: next.refresh_token, client_id: 'other' }),
    env,
    ask,
  );
  assert.equal((await wrongClient.json()).error, 'invalid_grant');
  // An access token is not a refresh token.
  assert.equal((await (await refresh(next.access_token)).json()).error, 'invalid_grant');
});

test('/mcp: no token or a bad one is 401 with the address of the resource metadata', async () => {
  const { env } = await signedIn();
  for (const token of [undefined, 'rubbish']) {
    const res = await rpc(env, token, { jsonrpc: '2.0', id: 1, method: 'ping' });
    assert.equal(res.status, 401);
    assert.match(
      res.headers.get('www-authenticate'),
      new RegExp(`Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource"`),
    );
  }
});

test('/mcp: initialize, tools/list and the five read tools; the site is read with the person’s own GitHub token', async () => {
  const { env, tokens } = await signedIn();
  const init = await (
    await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })
  ).json();
  assert.equal(init.result.protocolVersion, '2025-06-18');
  const list = await (await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  assert.deepEqual(
    list.result.tools.map((t) => t.name),
    ['site_info', 'list_content', 'read_content', 'list_apps', 'read_app_settings'],
  );
  const info = await call(env, tokens.access_token, 'site_info');
  assert.equal(info.structuredContent.name, 'Demo');
  assert.equal(info.structuredContent.pages, 1);
  const content = await call(env, tokens.access_token, 'list_content', { kind: 'post' });
  assert.equal(content.structuredContent.items[0].title, 'First');
  const page = await call(env, tokens.access_token, 'read_content', { address: '/about/' });
  assert.match(page.structuredContent.body, /Hello/);
  assert.equal((await call(env, tokens.access_token, 'list_apps')).structuredContent.apps[0].id, 'calendly');
  const settings = await call(env, tokens.access_token, 'read_app_settings', { app: 'calendly' });
  assert.deepEqual(settings.structuredContent.settings, { url: 'https://calendly.com/me' });
  assert.ok(!JSON.stringify(settings).includes('SECRET-KEY'));
  assert.equal(readers.at(-1), 'gho_lars');
});

test('/mcp: there is no write tool in this version', async () => {
  const { env, tokens } = await signedIn();
  for (const name of ['save_draft', 'publish_content', 'delete_content']) {
    const res = await (
      await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: {} } })
    ).json();
    assert.equal(res.error.code, -32602, name);
  }
});

test('/mcp: a notification is answered 202; GET and DELETE are 405; a batch, rubbish and a large body are refused', async () => {
  const { env, tokens } = await signedIn();
  const note = await rpc(env, tokens.access_token, { jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(note.status, 202);
  for (const method of ['GET', 'DELETE']) {
    const res = await mcp.handleMcp(
      new Request(`${ORIGIN}/mcp`, { method, headers: { authorization: `Bearer ${tokens.access_token}` } }),
      env,
      undefined,
      { ask, site },
    );
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'POST');
  }
  assert.equal((await (await rpc(env, tokens.access_token, [{ jsonrpc: '2.0', id: 1, method: 'ping' }])).json()).error.code, -32600);
  const rubbish = await mcp.handleMcp(
    new Request(`${ORIGIN}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${tokens.access_token}` }, body: '{oops' }),
    env,
    undefined,
    { ask, site },
  );
  assert.equal((await rubbish.json()).error.code, -32700);
  const big = await mcp.handleMcp(
    new Request(`${ORIGIN}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${tokens.access_token}` }, body: 'x'.repeat(70_000) }),
    env,
    undefined,
    { ask, site },
  );
  assert.equal(big.status, 413);
});

test('/mcp: every call asks GitHub whether the person may still save the site', async () => {
  const { env, tokens } = await signedIn('gone');
  assert.equal((await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' })).status, 200);
  // The person loses write access (GitHub's answer is cached for ten minutes, so the check is played with a new cache entry).
  await session.forget('gho_gone');
  github.may.gone = { pull: true, push: false };
  const refused = await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' });
  assert.equal(refused.status, 403);
  github.may.gone = { pull: true, push: true };
  await session.forget('gho_gone');
  // GitHub no longer knows the token: the assistant has to connect again.
  github.signedOut.add('gho_gone');
  await session.forget('gho_gone');
  const out = await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' });
  assert.equal(out.status, 401);
  github.signedOut.delete('gho_gone');
});

test('/mcp: over the rate limit a tool call is a tool error that says when to retry', async () => {
  const { env, tokens } = await signedIn();
  const send = (message, deps) =>
    mcp.handleMcp(
      new Request(`${ORIGIN}/mcp`, {
        method: 'POST',
        headers: { authorization: `Bearer ${tokens.access_token}` },
        body: JSON.stringify(message),
      }),
      env,
      undefined,
      { ask, site, ...deps },
    );
  const tool = { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'site_info', arguments: {} } };
  assert.equal((await send(tool, { limit: 2 })).status, 200);
  assert.equal((await send(tool, { limit: 2 })).status, 200);
  const over = await send(tool, { limit: 2 });
  assert.equal(over.status, 200);
  const body = await over.json();
  assert.equal(body.id, 7);
  assert.equal(body.result.isError, true);
  assert.match(body.result.content[0].text, /Try again in \d+ seconds/);
  assert.ok(Number(over.headers.get('retry-after')) >= 1);
  const other = await send({ jsonrpc: '2.0', id: 8, method: 'ping' }, { limit: 2 });
  assert.equal(other.status, 429);
  assert.ok(Number(other.headers.get('retry-after')) >= 1);
  // The next minute starts again.
  env.CONSENT.db.prepare('UPDATE mcp_rate SET minute = minute - 1').run();
  assert.equal((await send(tool, { limit: 2 })).status, 200);
  assert.equal((await (await send(tool, { limit: 2 })).json()).result?.isError, undefined);
});

test('/mcp: a tool that takes too long is a tool error', async () => {
  const { env, tokens } = await signedIn();
  const slow = () => ({ ...site('gho_lars'), texts: () => new Promise(() => {}) });
  const res = await mcp.handleMcp(
    new Request(`${ORIGIN}/mcp`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokens.access_token}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_content', arguments: {} } }),
    }),
    env,
    undefined,
    { ask, site: slow, timeoutMs: 20 },
  );
  const body = await res.json();
  assert.equal(body.result.isError, true);
  assert.match(body.result.content[0].text, /took too long/);
});

test('/mcp: a vault that cannot be opened (the secret changed) is a 401, not a failure', async () => {
  const { env, tokens } = await signedIn();
  const res = await rpc({ ...env, MCP_VAULT_KEY: 'changed' }, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' });
  assert.equal(res.status, 401);
});

test('/mcp: an expired access token is refused', async () => {
  const { env, tokens } = await signedIn();
  env.CONSENT.db.prepare("UPDATE mcp_tokens SET expires = 1 WHERE kind = 'access'").run();
  assert.equal((await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' })).status, 401);
});

test('"last used" follows the calls', async () => {
  const { env, tokens } = await signedIn();
  await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' });
  const [one] = await (await storage.store(env)).connections();
  assert.ok(Date.parse(one.lastUsed) > Date.now() - 60_000);
});

const editor = (login, init = {}, path = '/api/mcp/connections') =>
  new Request(`${ORIGIN}${path}`, {
    ...init,
    headers: { cookie: `editor_session=gho_${login}`, 'sec-fetch-site': 'same-origin', ...init.headers },
  });

test('connections: the editor lists them with the address to give the assistant, and never a token', async () => {
  const { env, tokens } = await signedIn();
  const res = await connections.handleMcpConnections(editor('lars'), env, ask);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.address, `${ORIGIN}/mcp`);
  assert.equal(body.ready, true);
  assert.equal(body.mayChange, true);
  assert.equal(body.connections.length, 1);
  assert.deepEqual(Object.keys(body.connections[0]).sort(), ['created', 'id', 'lastUsed', 'login', 'name']);
  assert.ok(!JSON.stringify(body).includes(tokens.access_token));
});

test('connections: only someone who can save the site; signed out is 401, not ready says so', async () => {
  const { env } = await signedIn();
  assert.equal((await connections.handleMcpConnections(new Request(`${ORIGIN}/api/mcp/connections`), env, ask)).status, 401);
  assert.equal((await connections.handleMcpConnections(editor('guest'), env, ask)).status, 403);
  assert.equal((await connections.handleMcpConnections(editor('lars', {}, '/api/mcp/connections'), { CONSENT: d1() }, ask)).status, 200);
  const notReady = await (await connections.handleMcpConnections(editor('lars'), { CONSENT: d1() }, ask)).json();
  assert.deepEqual(notReady, { ready: false, address: `${ORIGIN}/mcp`, mayChange: true, connections: [] });
  const noDb = await (await connections.handleMcpConnections(editor('lars'), {}, ask)).json();
  assert.equal(noDb.ready, false);
  assert.equal((await connections.handleMcpConnections(editor('lars', { method: 'PUT' }), env, ask)).status, 405);
});

test('Disconnect: tokens stop working, the last connection of a person drops their GitHub token and GitHub forgets it', async () => {
  const { env, tokens } = await signedIn();
  const store = await storage.store(env);
  const [one] = await store.connections();
  github.revoked.length = 0;
  const res = await connections.handleMcpConnections(editor('lars', { method: 'DELETE' }, `/api/mcp/connections/${one.id}`), env, ask);
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).connections, []);
  assert.equal((await rpc(env, tokens.access_token, { jsonrpc: '2.0', id: 1, method: 'ping' })).status, 401);
  assert.equal(await store.gitHubToken(11), null);
  assert.deepEqual(github.revoked, ['gho_lars']);
  const gone = await connections.handleMcpConnections(editor('lars', { method: 'DELETE' }, `/api/mcp/connections/${one.id}`), env, ask);
  assert.equal(gone.status, 404);
});

test('Disconnect: a person with another assistant keeps their GitHub token for it', async () => {
  const env = fresh();
  const first = await connect(env);
  const second = await connect(env);
  assert.ok(first.end && second.end);
  const store = await storage.store(env);
  const list = await store.connections();
  // Connecting the same assistant again by the same person replaced its first connection.
  assert.equal(list.length, 2);
  github.revoked.length = 0;
  await connections.handleMcpConnections(editor('lars', { method: 'DELETE' }, `/api/mcp/connections/${list[0].id}`), env, ask);
  assert.equal(await store.gitHubToken(11), 'gho_lars');
  assert.deepEqual(github.revoked, []);
  await connections.handleMcpConnections(editor('lars', { method: 'DELETE' }, `/api/mcp/connections/${list[1].id}`), env, ask);
  assert.equal(await store.gitHubToken(11), null);
});

test('Disconnect: only someone who can save the site, and only from the editor’s own page', async () => {
  const { env } = await signedIn();
  const [one] = await (await storage.store(env)).connections();
  const path = `/api/mcp/connections/${one.id}`;
  assert.equal((await connections.handleMcpConnections(editor('guest', { method: 'DELETE' }, path), env, ask)).status, 403);
  assert.equal(
    (
      await connections.handleMcpConnections(
        editor('lars', { method: 'DELETE', headers: { 'sec-fetch-site': 'cross-site' } }, path),
        env,
        ask,
      )
    ).status,
    401,
  );
  assert.equal((await (await storage.store(env)).connections()).length, 1);
});

test('the editor’s own address keeps /mcp, the discovery documents and the assistants’ sign-in; the other address sends them on', () => {
  const env = { EDITOR_HOST: 'editor.example' };
  const at = (hostname, path, method = 'GET') =>
    host.editorHost(new URL(`https://${hostname}${path}`), env, new Request(`https://${hostname}${path}`, { method }));
  for (const path of [
    '/mcp',
    '/.well-known/oauth-protected-resource',
    '/.well-known/oauth-protected-resource/mcp',
    '/.well-known/oauth-authorization-server',
    '/oauth/mcp/token',
  ])
    assert.equal(at('editor.example', path), undefined, path);
  const sent = at('site.example', '/mcp', 'POST');
  assert.equal(sent.status, 308);
  assert.equal(sent.headers.get('location'), 'https://editor.example/mcp');
  assert.equal(
    at('site.example', '/.well-known/oauth-authorization-server').headers.get('location'),
    'https://editor.example/.well-known/oauth-authorization-server',
  );
  assert.equal(at('site.example', '/about/'), undefined);
});
