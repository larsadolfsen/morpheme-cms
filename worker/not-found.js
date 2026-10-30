// The addresses visitors came to that do not exist (the site's 404 page), for "Videresendelser" in the
// editor (packages/editor/src/notFound.ts, Redirects.tsx), where the site's owner can send them on to a page.
// Kept in Workers KV (the binding NOT_FOUND in wrangler.jsonc), one key per address: how many times,
// when first and last, and where the visitor came from. No IP address, no cookie: nothing about the
// visitor, so it needs no consent. An address not seen for 90 days drops out by itself.
// Without the binding (a preview of a branch) nothing is kept and the editor says so.
//   GET    /api/not-found  the addresses, most visits first
//   DELETE /api/not-found  { paths: [...] } takes them off the list (sent on, or not worth it)
// Only someone who can save the site (write access to the repository on GitHub) can read or change it.
import { mayEdit } from './session.js';

const PREFIX = '404:';
const KEEP = 90 * 24 * 60 * 60;
// A page: no file ending in the last part (not a picture, a script or /wp-login.php).
const PAGE = /(^|\/)[^./]*$/;
// What is not a page of the site, and what robots try on every site.
const SKIP = /^\/(editor|oauth|api|cdn-cgi|\.well-known|wp-admin|wp-includes|wp-json)(\/|$)/i;
const ROBOT = /bot|crawl|spider|slurp|headless|python|curl|wget|scan|http/i;

/** Whether a 404 is a visitor's, worth keeping: a browser opening a page, on the public site. */
export function isVisit(request, url) {
  const agent = request.headers.get('user-agent') ?? '';
  return (
    request.method === 'GET' &&
    url.pathname.length <= 300 &&
    PAGE.test(url.pathname) &&
    !SKIP.test(url.pathname) &&
    agent.includes('Mozilla') &&
    !ROBOT.test(agent.replace(/^Mozilla\/[\d.]+ /, '')) &&
    (request.headers.get('accept') ?? '').includes('text/html')
  );
}

/** Counts a visit to an address that does not exist. Never fails the request (KV may say no). */
export async function recordNotFound(request, url, env) {
  if (!env.NOT_FOUND) return;
  try {
    const key = PREFIX + addressOf(url.pathname);
    const { metadata: was } = await env.NOT_FOUND.getWithMetadata(key);
    const now = new Date().toISOString();
    const metadata = { n: (was?.n ?? 0) + 1, first: was?.first ?? now, last: now, from: cameFrom(request, url) || was?.from || '' };
    await env.NOT_FOUND.put(key, '', { metadata, expirationTtl: KEEP });
  } catch {}
}

// The address as the editor's redirects have it: decoded (/æble/, not /%C3%A6ble/), and with the slash
// at the end, for /angst is sent on by the redirect from /angst/ (packages/editor/worker/index.js withSlash).
function addressOf(pathname) {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {}
  return path.endsWith('/') ? path : `${path}/`;
}

// Where the visitor came from: a page of the site by its address (a link on it is broken), another
// site by its name (google.com); browsers send no more than that for another site.
function cameFrom(request, url) {
  try {
    const from = new URL(request.headers.get('referer') ?? '');
    if (from.host === url.host) return from.pathname.slice(0, 200);
    return from.hostname.replace(/^www\./, '').slice(0, 200);
  } catch {
    return '';
  }
}

export async function handleNotFound(request, env) {
  if (!(await mayEdit(request))) return json({ error: 'forbidden' }, 403);
  if (!env.NOT_FOUND) return json({ error: 'unavailable' }, 503);
  if (request.method === 'GET') return json({ entries: await entries(env.NOT_FOUND) });
  if (request.method === 'DELETE') {
    const body = await request.json().catch(() => ({}));
    const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === 'string').slice(0, 100) : [];
    await Promise.all(paths.map((p) => env.NOT_FOUND.delete(PREFIX + p)));
    return json({ deleted: paths.length });
  }
  return json({ error: 'method' }, 405);
}

async function entries(kv) {
  const all = [];
  let cursor;
  // At most 5000 addresses; more would be robots.
  for (let i = 0; i < 5; i++) {
    const page = await kv.list({ prefix: PREFIX, cursor });
    for (const { name, metadata } of page.keys)
      if (metadata)
        all.push({ path: name.slice(PREFIX.length), count: metadata.n, first: metadata.first, last: metadata.last, from: metadata.from });
    if (page.list_complete) break;
    cursor = page.cursor;
  }
  return all.sort((a, b) => b.count - a.count || b.last.localeCompare(a.last));
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
