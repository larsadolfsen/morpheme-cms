// Tests for worker/mcp-client.js with a fake D1 and a fixture MCP server (a fake fetch). No Cloudflare, no network.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callTool, forgetUninstalled, handleMcpClient, MAX_BYTES, optionsOf, seal } from './mcp-client.js';

// A D1 as far as this module uses it: tables as Maps, statements by their first words.
function fakeDb() {
  const connections = new Map();
  const pending = new Map();
  const run = (sql, args) => {
    if (/^CREATE/.test(sql)) return {};
    if (/^INSERT OR REPLACE INTO mcp_connections/.test(sql))
      return void connections.set(args[0], { app: args[0], secret: args[1], state: args[2] });
    if (/^INSERT INTO mcp_pending/.test(sql))
      return void pending.set(args[0], { state: args[0], app: args[1], secret: args[2], at: args[3] });
    if (/^SELECT secret, state FROM mcp_connections/.test(sql)) return connections.get(args[0]) ?? null;
    if (/^SELECT app FROM mcp_connections/.test(sql)) return { results: [...connections.values()] };
    if (/^SELECT app, secret, at FROM mcp_pending/.test(sql)) return pending.get(args[0]) ?? null;
    if (/^DELETE FROM mcp_connections/.test(sql)) return void connections.delete(args[0]);
    if (/^DELETE FROM mcp_pending WHERE state/.test(sql)) return void pending.delete(args[0]);
    if (/^DELETE FROM mcp_pending WHERE app/.test(sql))
      return void [...pending].forEach(([k, v]) => v.app === args[0] && pending.delete(k));
    if (/^DELETE FROM mcp_pending WHERE at/.test(sql)) return void [...pending].forEach(([k, v]) => v.at < args[0] && pending.delete(k));
    throw new Error(`unknown sql ${sql}`);
  };
  const statement = (sql, args = []) => ({
    bind: (...a) => statement(sql, a),
    run: async () => run(sql, args),
    first: async () => run(sql, args),
    all: async () => run(sql, args),
    sql,
    args,
  });
  return { connections, pending, prepare: (sql) => statement(sql), batch: async (list) => list.forEach((s) => run(s.sql, s.args)) };
}

const decl = { server: 'https://mcp.example.com/mcp', auth: 'token', tools: ['lists', 'subscribe'] };
const lists = [
  { id: 'a1', name: 'Newsletter' },
  { id: 'b2', name: 'Offers' },
];
const rpcReply = (id, result) =>
  new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), { headers: { 'content-type': 'application/json', 'mcp-session-id': 's1' } });

/** The fixture server: initialize, initialized, tools/call (lists). `seen` records each request. */
function fixture({ big = false, slow = false, redirect = false, status = 200, seen = [] } = {}) {
  const ask = async (url, init = {}) => {
    seen.push({ url, auth: init.headers?.authorization, redirect: init.redirect });
    if (new URL(url).host !== 'mcp.example.com') return new Response('{}', { status: 404 });
    if (status !== 200) return new Response('no', { status });
    if (redirect) return new Response(null, { status: 302, headers: { location: 'https://evil.example.net/' } });
    const body = JSON.parse(init.body);
    if (body.method === 'initialize') return rpcReply(body.id, { protocolVersion: '2025-11-25', capabilities: {} });
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    // The server never answers: the call's own 10 s signal (seen in `signals`) ends it, as AbortSignal.timeout does.
    if (slow) {
      assert.ok(init.signal instanceof AbortSignal);
      throw Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    }
    if (big) return rpcReply(body.id, { content: [{ type: 'text', text: JSON.stringify({ lists: lists, pad: 'x'.repeat(MAX_BYTES) }) }] });
    return rpcReply(body.id, { content: [{ type: 'text', text: JSON.stringify({ lists }) }] });
  };
  return ask;
}

const env = (extra = {}) => ({ CONSENT: fakeDb(), MCP_VAULT_KEY: 'test-vault-key', ...extra });
const may = { read: true, push: true };
const deps = (ask, mcp = { news: decl }, access = async () => may) => ({ mcp, access, ask });
const req = (path, init) => new Request(`https://site.test/api/mcp-client/${path}`, init);
const connect = (e, ask, token = 'secret-token-123') =>
  handleMcpClient(req('news', { method: 'POST', body: JSON.stringify({ token }) }), e, deps(ask));

test('a field lists the items of a tool, and the browser sees no credential', async () => {
  const e = env();
  const ask = fixture();
  const res = await connect(e, ask);
  const first = await res.clone().json();
  assert.ok(!first.error, JSON.stringify(first));
  assert.deepEqual(Object.keys(await res.json()).sort(), ['auth', 'connected', 'host', 'needsSignIn', 'tools']);
  const opts = await handleMcpClient(req('news/options?tool=lists&label=name&value=id'), e, deps(ask));
  assert.deepEqual(await opts.json(), [
    { label: 'Newsletter', value: 'a1' },
    { label: 'Offers', value: 'b2' },
  ]);
  const text = JSON.stringify([...e.CONSENT.connections.values()]);
  assert.ok(!text.includes('secret-token-123'), 'encrypted at rest');
  const state = await (await handleMcpClient(req('news'), e, deps(ask))).text();
  assert.ok(!state.includes('secret-token-123'));
});

test('an unlisted tool is refused before any request', async () => {
  const e = env();
  const seen = [];
  await connect(e, fixture({ seen }));
  seen.length = 0;
  const res = await handleMcpClient(req('news/options?tool=delete_all&label=name&value=id'), e, deps(fixture({ seen })));
  assert.equal(res.status, 403);
  assert.equal(seen.length, 0);
});

test('a redirect to another host is refused, and none is followed', async () => {
  const e = env();
  await connect(e, fixture());
  const seen = [];
  const res = await handleMcpClient(req('news/options?tool=lists&label=name&value=id'), e, deps(fixture({ redirect: true, seen })));
  assert.equal(res.status, 502);
  assert.ok(seen.every((s) => s.redirect === 'manual' && !s.url.includes('evil')));
});

test('a server on another host than the declared one cannot be reached; http is refused', async () => {
  const e = env();
  await connect(e, fixture());
  await assert.rejects(callTool(e, 'news', { ...decl, server: 'http://mcp.example.com/mcp' }, 'lists', {}, fixture()), /not https/);
  const seen = [];
  await callTool(e, 'news', decl, 'lists', {}, fixture({ seen }));
  assert.ok(seen.every((s) => new URL(s.url).host === 'mcp.example.com'));
});

test('a result over 256 KB is an error, not a cut result', async () => {
  const e = env();
  await connect(e, fixture());
  await assert.rejects(callTool(e, 'news', decl, 'lists', {}, fixture({ big: true })), /too big/);
});

test('a call over 10 seconds is an error', async () => {
  const e = env();
  await connect(e, fixture());
  await assert.rejects(callTool(e, 'news', decl, 'lists', {}, fixture({ slow: true })), /timeout/);
});

test('a refresh that fails marks Needs sign-in', async () => {
  const e = env();
  const oauth = { server: decl.server, auth: 'oauth', tools: ['lists'] };
  await e.CONSENT.prepare('INSERT OR REPLACE INTO mcp_connections (app, secret, state, connected) VALUES (?, ?, ?, ?)')
    .bind(
      'news',
      await seal(e, {
        kind: 'oauth',
        access: 'old',
        refresh: 'r',
        expires: Date.now() - 1000,
        clientId: 'c',
        tokenEndpoint: 'https://auth.example.com/token',
      }),
      'ok',
      'now',
    )
    .run();
  const ask = async (url) => (url.startsWith('https://auth.example.com') ? new Response('{}', { status: 400 }) : fixture()(url));
  await assert.rejects(callTool(e, 'news', oauth, 'lists', {}, ask), /needs sign-in/);
  const state = await (await handleMcpClient(req('news'), e, deps(ask, { news: oauth }))).json();
  assert.deepEqual([state.connected, state.needsSignIn], [false, true]);
});

test('a refresh that works keeps the new token', async () => {
  const e = env();
  const oauth = { server: decl.server, auth: 'oauth', tools: ['lists'] };
  await e.CONSENT.prepare('INSERT OR REPLACE INTO mcp_connections (app, secret, state, connected) VALUES (?, ?, ?, ?)')
    .bind(
      'news',
      await seal(e, {
        kind: 'oauth',
        access: 'old',
        refresh: 'r',
        expires: Date.now() - 1000,
        clientId: 'c',
        tokenEndpoint: 'https://auth.example.com/token',
      }),
      'ok',
      'now',
    )
    .run();
  const seen = [];
  const mcp = fixture({ seen });
  const ask = async (url, init) =>
    url.startsWith('https://auth.example.com') ? new Response(JSON.stringify({ access_token: 'new', expires_in: 3600 })) : mcp(url, init);
  await callTool(e, 'news', oauth, 'lists', {}, ask);
  assert.equal(seen[0].auth, 'Bearer new');
});

test('disconnect and uninstall delete the credentials', async () => {
  const e = env();
  const ask = fixture();
  await connect(e, ask);
  assert.equal(e.CONSENT.connections.size, 1);
  const res = await handleMcpClient(req('news', { method: 'DELETE' }), e, deps(ask));
  assert.equal((await res.json()).connected, false);
  assert.equal(e.CONSENT.connections.size, 0);
  await connect(e, ask);
  await forgetUninstalled(e, { other: decl });
  assert.equal(e.CONSENT.connections.size, 0);
});

test('signed out and read-only senders cannot connect', async () => {
  const e = env();
  assert.equal(
    (
      await handleMcpClient(
        req('news'),
        e,
        deps(fixture(), undefined, async () => null),
      )
    ).status,
    401,
  );
  const readOnly = async () => ({ read: true, push: false });
  assert.equal((await handleMcpClient(req('news', { method: 'POST', body: '{}' }), e, deps(fixture(), undefined, readOnly))).status, 403);
  assert.equal((await handleMcpClient(req('news'), e, deps(fixture(), undefined, readOnly))).status, 200);
});

test('without MCP_VAULT_KEY nothing is kept', async () => {
  const e = env({ MCP_VAULT_KEY: undefined });
  const res = await connect(e, fixture());
  assert.equal(res.status, 503);
  assert.equal(e.CONSENT.connections.size, 0);
});

test('oauth: sign-in starts at the service, the callback keeps tokens encrypted and ends back at the app', async () => {
  const e = env();
  const oauth = { server: decl.server, auth: 'oauth', tools: ['lists'] };
  const ask = async (url, init = {}) => {
    const u = new URL(url);
    if (u.pathname === '/.well-known/oauth-protected-resource') return new Response('{}', { status: 404 });
    if (u.pathname === '/.well-known/oauth-authorization-server')
      return new Response(
        JSON.stringify({
          authorization_endpoint: 'https://mcp.example.com/authorize',
          token_endpoint: 'https://mcp.example.com/token',
          registration_endpoint: 'https://mcp.example.com/register',
        }),
      );
    if (u.pathname === '/register') return new Response(JSON.stringify({ client_id: 'cid' }), { status: 201 });
    if (u.pathname === '/token') {
      assert.match(init.body, /code_verifier=/);
      return new Response(JSON.stringify({ access_token: 'access-xyz', refresh_token: 'refresh-xyz', expires_in: 3600 }));
    }
    return fixture()(url, init);
  };
  const started = await (await handleMcpClient(req('news', { method: 'POST' }), e, deps(ask, { news: oauth }))).json();
  const to = new URL(started.url);
  assert.equal(to.searchParams.get('code_challenge_method'), 'S256');
  const done = await handleMcpClient(req(`callback?code=abc&state=${to.searchParams.get('state')}`), e, deps(ask, { news: oauth }));
  assert.equal(done.status, 302);
  assert.equal(done.headers.get('location'), 'https://site.test/editor/#apps/news');
  const kept = JSON.stringify([...e.CONSENT.connections.values()]);
  assert.ok(!kept.includes('access-xyz') && !kept.includes('refresh-xyz'));
  assert.equal((await (await handleMcpClient(req('news'), e, deps(ask, { news: oauth }))).json()).connected, true);
  assert.equal((await handleMcpClient(req('callback?code=abc&state=nope'), e, deps(ask, { news: oauth }))).status, 400);
});

test('optionsOf takes a list or the first list in an object', () => {
  assert.deepEqual(optionsOf([{ i: 1, n: 'x' }], 'n', 'i'), [{ label: 'x', value: '1' }]);
  assert.deepEqual(optionsOf({ ok: true, items: [{ i: 1, n: 'x' }, { n: 'no id' }] }, 'n', 'i'), [{ label: 'x', value: '1' }]);
  assert.throws(() => optionsOf({ ok: true }, 'n', 'i'), /no list/);
});
