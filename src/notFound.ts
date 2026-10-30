// The addresses visitors came to that do not exist, as the site's Worker keeps them (packages/editor/worker/not-found.js,
// /api/not-found on the editor's own address), for "Ikke fundet" under "Videresendelser" (Redirects.tsx).
// Asked with the GitHub sign-in (the Worker's cookie, sent with the request): the Worker lets only someone who can save
// the site see them.

/** An address that does not exist: how many visits, the first and the last (ISO dates), and where the
 * last visitor came from (an address of the site, another site's name, or ''). */
export type Missing = { path: string; count: number; first: string; last: string; from: string };

const API = '/api/not-found';

/** The addresses, most visits first; null when the site does not keep them (no Worker, no storage). */
export async function loadNotFound(): Promise<Missing[] | null> {
  const res = await fetch(API, { cache: 'no-store' });
  if (res.status === 503 || !res.headers.get('content-type')?.includes('application/json')) return null;
  if (!res.ok) throw new Error(String(res.status));
  return ((await res.json()) as { entries: Missing[] }).entries;
}

/** Takes the addresses off the list (they now send on, or are not worth it). */
export async function forgetNotFound(paths: string[]): Promise<void> {
  const res = await fetch(API, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (!res.ok) throw new Error(String(res.status));
}
