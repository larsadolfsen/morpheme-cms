// The assistants connected to the site, for "Assistants" in the editor's settings (src/Assistants.tsx, src/assistantsCall.ts).
//   GET    /api/mcp/connections        { ready, address, mayChange, connections: [{ id, name, login, created, lastUsed }] }:
//                                      `ready` = the database and MCP_VAULT_KEY are there; `address` = what to give the assistant
//   DELETE /api/mcp/connections/<id>   Disconnect: its tokens go at once; the person's GitHub token goes with their last one, and
//                                      GitHub forgets it. Gives the same as GET.
// Only someone who can save the site (`access`, worker/session.js). Never a token. Exposes handleMcpConnections.
import { json } from './not-found.js';
import { ready, store } from './mcp-store.js';
import { revokeGitHubToken } from './mcp-oauth.js';
import { access } from './session.js';

/** @param {Request} request @param {Record<string, any>} env @param {typeof fetch} [ask] fetch, for GitHub */
export async function handleMcpConnections(request, env, ask = fetch) {
  const url = new URL(request.url);
  const id = url.pathname.slice('/api/mcp/connections'.length).replace(/^\//, '');
  if (request.method !== 'GET' && !(request.method === 'DELETE' && id)) return json({ error: 'method' }, 405);
  const may = await access(request, ask);
  if (!may) return json({ error: 'signed out' }, 401);
  if (!may.push) return json({ error: 'forbidden' }, 403);
  const state = async () => ({
    ready: ready(env),
    address: `${url.origin}/mcp`,
    mayChange: true,
    connections: env.CONSENT ? await (await store(env)).connections() : [],
  });
  if (request.method === 'GET') return json(await state());
  if (!env.CONSENT) return json({ error: 'no database' }, 503);
  const db = await store(env);
  if (!(await db.connections()).some((c) => c.id === id)) return json({ error: 'not found' }, 404);
  const last = await db.dropConnection(id);
  await revokeGitHubToken(env, last, ask);
  return json(await state());
}
