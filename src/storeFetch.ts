// A time limit for requests from the editor to the store, through the site's Worker.
// Exposes STORE_TIMEOUT_MS (the limit in milliseconds) and timedFetch (a fetch that stops after that limit);
// used by store.ts and storeConnection.ts.
export const STORE_TIMEOUT_MS = 15_000;

export function timedFetch(
  fetchFn: (url: string, init?: RequestInit) => Promise<Response>,
  url: string,
  init: RequestInit = {},
  ms: number = STORE_TIMEOUT_MS,
): Promise<Response> {
  return fetchFn(url, { ...init, signal: AbortSignal.timeout(ms) });
}
