// Fetches one Statuspage feed for the Worker's /api/status (worker/service-status.js).
// Exposes feedOf(url, fetcher). No imports; kept out of worker/ so node --test can load it.

/** The parsed JSON of a feed, or null when the fetch throws, the answer is not ok, or the body is not JSON. */
export async function feedOf(url, fetcher = fetch) {
  try {
    const res = await fetcher(url, { headers: { accept: 'application/json' }, cf: { cacheTtl: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
