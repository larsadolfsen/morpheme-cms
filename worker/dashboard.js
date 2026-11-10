// Each person's dashboard on the editor's start screen: which widgets they placed, in what order, and their settings
// (src/dashboard.mjs). Kept in Workers KV (the binding DASHBOARD in wrangler.jsonc), one key per person, by their GitHub
// user id, which the Worker asks GitHub for with the person's sign-in: the browser never sends an id, so no one can read
// or write another person's dashboard. Without the binding (a preview of a branch) nothing is kept and the editor says so.
//   GET /api/dashboard  { dashboard }: the person's dashboard, null when they have none
//   PUT /api/dashboard  a dashboard (at most 16 KB) replaces it; answers 204. 400 when it is not a dashboard, 413 when too big
// Only someone who can save the site (write access to the repository on GitHub) has a dashboard.
import { validDashboard } from '../src/dashboard.mjs';
import { json } from './not-found.js';
import { access } from './session.js';

const MAX_BYTES = 16 * 1024;

/** The person's GitHub user id, or a Response when GitHub does not say (401: the sign-in is no good, 502: it failed). */
async function userId(token, ask) {
  let res;
  try {
    res = await ask('https://api.github.com/user', {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'morpheme-worker' },
    });
  } catch {
    return json({ error: 'github' }, 502);
  }
  if (res.status === 401) return json({ error: 'unauthorized' }, 401);
  const { id } = res.ok ? await res.json().catch(() => ({})) : {};
  return Number.isSafeInteger(id) ? id : json({ error: 'github' }, 502);
}

export async function handleDashboard(request, env, ask = fetch) {
  const auth = await access(request, ask);
  if (!auth) return json({ error: 'unauthorized' }, 401);
  if (auth.push !== true) return json({ error: 'forbidden' }, 403);
  if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'method' }, 405);
  if (!env.DASHBOARD) return json({ error: 'no-storage' }, 503);

  const id = await userId(auth.token, ask);
  if (id instanceof Response) return id;
  const key = `dashboard:${id}`;

  if (request.method === 'GET') {
    const stored = await env.DASHBOARD.get(key, 'json');
    return json({ dashboard: validDashboard(stored) });
  }

  const length = Number(request.headers.get('content-length'));
  if (length > MAX_BYTES) return json({ error: 'too-big' }, 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return json({ error: 'too-big' }, 413);
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {}
  const clean = validDashboard(body);
  if (!clean) return json({ error: 'invalid' }, 400);
  await env.DASHBOARD.put(key, JSON.stringify(clean));
  return new Response(null, { status: 204 });
}
