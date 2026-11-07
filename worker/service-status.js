// The status of GitHub and Cloudflare, for the editor's footer (packages/editor: the status line).
//   GET /api/status  a StatusReport (lib/serviceStatus.mjs): { state, providers[] }.
// Both Statuspage feeds are fetched inside the request (cached by Cloudflare for 60 seconds, lib/serviceFeed.mjs); a feed that fails counts as unknown.
// Only someone who can save the site (write access to the repository on GitHub) can ask.
import { json } from './not-found.js';
import { mayEdit } from './session.js';
import { PROVIDERS, reportFrom } from '../lib/serviceStatus.mjs';
import { feedOf } from '../lib/serviceFeed.mjs';

export async function handleStatus(request, env) {
  if (!(await mayEdit(request))) return json({ error: 'forbidden' }, 403);
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  const [github, cloudflare] = await Promise.all(PROVIDERS.map((provider) => feedOf(provider.feed)));
  return json(reportFrom({ github, cloudflare }));
}
