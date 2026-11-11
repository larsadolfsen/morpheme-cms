// The requests for "Assistants" (#assistants) to the site's Worker (/api/mcp/connections, worker/mcp-connections.js): the list
// of the connected assistants, and Disconnect. Exposes Assistants, Connection, callAssistants and lastUsedOf; no imports of the
// editor, so node --test runs it (assistantsCall.test.mjs). Used by assistantList.ts, which gives it the real fetch and texts.

export type Connection = { id: string; name: string; login: string; created: string; lastUsed: string | null };
/** What the Worker says: whether assistants are set up, the address to give an assistant, and who is connected. */
export type Assistants = { ready: boolean; address: string; mayChange: boolean; connections: Connection[] };

export type AssistantsDeps = {
  fetch: (url: string, init: { method: string }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;
  /** The texts of a failure: the person may not (403), and any other. */
  forbidden: string;
  failed: string;
};

const ID = /^[\w-]+$/;

/** Sends one request: GET the list, or DELETE one connection (Disconnect), which gives the list that is left. A failure throws
 * an Error with the text for it. */
export async function callAssistants(method: 'GET' | 'DELETE', id: string | undefined, deps: AssistantsDeps): Promise<Assistants> {
  if (method === 'DELETE' && !(id && ID.test(id))) throw new Error(deps.failed);
  let res;
  try {
    res = await deps.fetch(method === 'DELETE' ? `/api/mcp/connections/${id}` : '/api/mcp/connections', { method });
  } catch {
    throw new Error(deps.failed);
  }
  if (!res.ok) throw new Error(res.status === 403 ? deps.forbidden : deps.failed);
  let found: Assistants;
  try {
    found = (await res.json()) as Assistants;
  } catch {
    throw new Error(deps.failed);
  }
  if (!found || !Array.isArray(found.connections) || typeof found.address !== 'string') throw new Error(deps.failed);
  return found;
}

/** When an assistant was last used, or null when it never was. */
export function lastUsedOf(connection: Pick<Connection, 'lastUsed'>): Date | null {
  const at = connection.lastUsed ? new Date(connection.lastUsed) : null;
  return at && !Number.isNaN(at.getTime()) ? at : null;
}
