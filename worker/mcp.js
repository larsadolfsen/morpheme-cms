// The site's MCP server (Model Context Protocol, Streamable HTTP, read-only in this version): an assistant such as Claude reads
// the site through it. One address, POST /mcp, one JSON-RPC message per request (docs/superpowers/specs/2026-11-11-mcp-design.md).
//   Authorization: Bearer <access token>  from the sign-in (worker/mcp-oauth.js); no or a wrong token: 401 with the address of
//                  the resource metadata, so the assistant finds the sign-in
// Each call: the token's connection, the GitHub token the Worker keeps for that person (worker/mcp-store.js), and whether GitHub
// still says they can save the site (`accessOf`, cached ten minutes): no access, no call. The files are read as that person
// (worker/files.js) and the tools are lib/mcpTools.mjs. No write tool exists in this version.
// Exposes handleMcp. Depends on lib/mcpProtocol.mjs, lib/mcpTools.mjs, worker/mcp-store.js, worker/session.js, worker/files.js,
// worker/service-status.js and @site/config.
import { config } from '@site/config';
import { handleMessage } from '../lib/mcpProtocol.mjs';
import { createTools } from '../lib/mcpTools.mjs';
import { filesOf } from './files.js';
import { ready, store } from './mcp-store.js';
import { json } from './not-found.js';
import { statusReport } from './service-status.js';
import { accessOf } from './session.js';

/** The most a request may be, in bytes. */
export const MAX_BODY = 64 * 1024;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-expose-headers': 'www-authenticate',
};
const withCors = (res) => {
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
};
const answer = (data, status = 200) => withCors(json(data, status));
const rpcError = (code, message, status = 400) => answer({ jsonrpc: '2.0', id: null, error: { code, message } }, status);

function unauthorized(url, description) {
  const res = answer({ error: 'invalid_token', error_description: description }, 401);
  res.headers.set('www-authenticate', `Bearer resource_metadata="${url.origin}/.well-known/oauth-protected-resource"`);
  return res;
}

/** The site as one signed-in person may read it, for one request: the branch's head is asked for once. */
function siteOf(env, token, ctx) {
  const files = filesOf(env, token, ctx);
  let at;
  return {
    config,
    files: async (folders, depth) => {
      at ??= files.head();
      const lists = await files.filesIn((await at).tree, folders, depth);
      return lists.flat().filter((f) => !f.binary);
    },
    texts: (oids) => files.texts(oids),
    status: () => statusReport(env),
    finish: () => files.finish('mcp'),
  };
}

/**
 * @param {Request} request @param {Record<string, any>} env @param {ExecutionContext | undefined} ctx
 * @param {{ ask?: typeof fetch, site?: (token: string) => object }} [deps] `ask`: fetch for GitHub; `site`: the files, for tests
 */
export async function handleMcp(request, env, ctx, { ask = fetch, site } = {}) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
  if (!ready(env)) return answer({ error: 'Assistants are not set up on this site yet.' }, 503);
  if (request.method !== 'POST') {
    const res = answer({ error: 'method' }, 405);
    res.headers.set('allow', 'POST');
    return res;
  }
  const bearer = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!bearer) return unauthorized(url, 'Sign in first.');
  const db = await store(env);
  const connection = await db.byToken('access', bearer);
  if (!connection) return unauthorized(url, 'The token is wrong or expired.');
  const github = await db.gitHubToken(connection.userId);
  if (!github) return unauthorized(url, 'This connection has to be made again.');
  const may = await accessOf(github, ask);
  if (!may) return unauthorized(url, 'GitHub no longer knows this connection. Connect again.');
  if (!may.push) return answer({ error: 'forbidden', error_description: 'This person can no longer save the site.' }, 403);
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY) return answer({ error: 'too large' }, 413);
  const text = await request.text();
  if (text.length > MAX_BODY) return answer({ error: 'too large' }, 413);
  let message;
  try {
    message = JSON.parse(text);
  } catch {
    return rpcError(-32700, 'Parse error');
  }
  await db.touch(connection);
  const files = site ? site(github) : siteOf(env, github, ctx);
  try {
    const reply = await handleMessage(message, createTools(files));
    return reply ? answer(reply) : withCors(new Response(null, { status: 202 }));
  } finally {
    await files.finish?.();
  }
}
