// The visitors' answers in the cookie banner, as the site's Worker keeps them (packages/editor/worker/consent.js, /api/consent on the
// editor's own address), for "Samtykker" under "Privatliv" (Consents.tsx). Asked with the GitHub sign-in (the Worker's
// cookie, sent with the request): the Worker lets only someone who can save the site see or delete them.
import type { ConsentCategory } from '../lib/cookieCategories.mjs';

/** An answer: the visitor's consent id, when (ISO), the yes or no to each category the banner asked about, and the
 * commit the site was built from (the banner they answered). */
export type ConsentAnswer = { id: string; at: string; choices: Partial<Record<ConsentCategory, boolean>>; version: string };

export const CONSENT_API = '/api/consent';

/** The newest answers (at most 500), those of a consent id starting with `query`, and how many there are in all; null
 * when the site does not keep them (no Worker, no storage). */
export async function loadConsents(query = ''): Promise<{ entries: ConsentAnswer[]; total: number } | null> {
  const res = await fetch(`${CONSENT_API}${query ? `?q=${encodeURIComponent(query)}` : ''}`, { cache: 'no-store' });
  if (res.status === 503 || !res.headers.get('content-type')?.includes('application/json')) return null;
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as { entries: ConsentAnswer[]; total: number };
}

/** Deletes every answer with a consent id (a visitor asked for it); how many. */
export async function deleteConsents(id: string): Promise<number> {
  const res = await fetch(CONSENT_API, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
  if (!res.ok) throw new Error(String(res.status));
  return ((await res.json()) as { deleted: number }).deleted;
}
