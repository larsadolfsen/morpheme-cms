// Fetches one Statuspage feed for the Worker's /api/status (worker/service-status.js).
// Exposes feedOf(url, fetcher, ms). No imports; kept out of worker/ so node --test can load it.

/** The parsed JSON of a feed, or null when the fetch throws, the answer is not ok, the body is not JSON, or it takes longer than ms (aborted). */
export async function feedOf(url, fetcher = fetch, ms = 3000) {
  try {
    const res = await fetcher(url, { headers: { accept: 'application/json' }, cf: { cacheTtl: 60 }, signal: AbortSignal.timeout(ms) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
