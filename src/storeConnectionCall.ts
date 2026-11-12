// The request to the site's Worker for "Connect to Morpheme" (/api/store/connection): GET, POST, DELETE, and what a failure says.
// Exposes StoreConnection and callConnection(method, deps); no imports of the editor, so node --test runs it (storeConnectionCall.test.mjs).
// Used by storeConnection.ts, which gives it the real fetch, forgetCatalog and texts.

/** What the Worker says about the site's key to the store (packages/editor/worker/store-connection.js). */
export type StoreConnection =
  | { connected: false; mayChange: boolean }
  | { connected: true; by: 'hand'; mayChange: boolean }
  | { connected: true; by: 'button'; site: string; since: string; mayChange: boolean };

export type ConnectionDeps = {
  fetch: (url: string, init: { method: string }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;
  /** Asks the store's catalog again (store.ts forgetCatalog). */
  forgetCatalog: () => void;
  /** The texts of a failure: the store's hourly limit (429) and any other. */
  busy: string;
  failed: string;
};

/** Sends one request. A failure throws an Error with the text for it; POST and DELETE that succeed make the catalog be read again. */
export async function callConnection(method: 'GET' | 'POST' | 'DELETE', deps: ConnectionDeps): Promise<StoreConnection> {
  let res;
  try {
    res = await deps.fetch('/api/store/connection', { method });
  } catch {
    throw new Error(deps.failed);
  }
  if (!res.ok) throw new Error(res.status === 429 ? deps.busy : deps.failed);
  let found: StoreConnection;
  try {
    found = (await res.json()) as StoreConnection;
  } catch {
    throw new Error(deps.failed);
  }
  if (method !== 'GET') deps.forgetCatalog();
  return found;
}
