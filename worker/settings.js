// Each person's editor settings (src/settings.mjs): for now Density, how much fits on the screen. Kept in the Workers KV
// namespace NOT_FOUND (wrangler.jsonc) as the dashboards are (dashboard.js): one key `settings:<id>` per person, by their GitHub user id, with
// no expiry. The id is what the Worker asks GitHub for with the person's sign-in: the browser never sends one, so no one can read or write
// another person's settings. Without NOT_FOUND (a preview of a branch) nothing is kept and the editor says so.
//   GET /api/settings  { settings }: the person's settings, null when they have none
//   PUT /api/settings  { density } is merged into them; answers 204. 400 when it is not settings, 413 when too big
// Only someone who can save the site (write access to the repository on GitHub) has settings.
import { validSettings } from '../src/settings.mjs';
import { userId } from './dashboard.js';
import { json } from './not-found.js';
import { access } from './session.js';

const MAX_BYTES = 1024;

export async function handleSettings(request, env, ask = fetch) {
  const auth = await access(request, ask);
  if (!auth) return json({ error: 'unauthorized' }, 401);
  if (auth.push !== true) return json({ error: 'forbidden' }, 403);
  if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'method' }, 405);
  if (!env.NOT_FOUND) return json({ error: 'no-storage' }, 503);

  const id = await userId(auth.token, ask);
  if (id instanceof Response) return id;
  const key = `settings:${id}`;

  if (request.method === 'GET') return json({ settings: validSettings(await env.NOT_FOUND.get(key, 'json')) });

  const length = Number(request.headers.get('content-length'));
  if (length > MAX_BYTES) return json({ error: 'too-big' }, 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return json({ error: 'too-big' }, 413);
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {}
  const clean = validSettings(body);
  if (!clean) return json({ error: 'invalid' }, 400);
  const before = validSettings(await env.NOT_FOUND.get(key, 'json')) ?? {};
  await env.NOT_FOUND.put(key, JSON.stringify({ ...before, ...clean }));
  return new Response(null, { status: 204 });
}
