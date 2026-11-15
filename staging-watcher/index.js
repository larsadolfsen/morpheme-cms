// Rebuilds morpheme-staging whenever npm's `next` tag of @morphemecms/cms points at a version staging was not last
// rebuilt for. It runs on a Cloudflare cron trigger (every 5 minutes), not on GitHub's `schedule`, which GitHub delays
// and drops. It does not matter how many merges came in between or when the owner approved: it only compares the tag
// with the version it stored after the last successful hook call (KV key `last`). It only reads npm and calls the
// deploy hook; it publishes and approves nothing. The hook's address is the Worker secret STAGING_DEPLOY_HOOK
// (never in code); a missing secret is logged as an error and the run fails.

const DIST_TAGS = 'https://registry.npmjs.org/-/package/@morphemecms/cms/dist-tags';

/**
 * @param {{ next?: string, last?: string, hook?: string }} input
 * @returns {'none' | 'rebuild' | 'no-hook' | 'no-next'}
 */
export function decide({ next = '', last = '', hook = '' }) {
  next = next.trim();
  if (!next) return 'no-next';
  if (next === last.trim()) return 'none';
  if (!hook.trim()) return 'no-hook';
  return 'rebuild';
}

/** One check. Returns the action taken; throws when the hook or npm fails, so the next run tries again. */
export async function check(env, fetchFn = fetch) {
  const res = await fetchFn(DIST_TAGS, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`npm answered ${res.status} for the dist-tags`);
  const next = String((await res.json()).next ?? '');
  const last = (await env.STATE.get('last')) ?? '';
  const action = decide({ next, last, hook: env.STAGING_DEPLOY_HOOK });
  console.log(`next=${next} last=${last || '(none)'} -> ${action}`);
  if (action === 'no-hook') throw new Error('The secret STAGING_DEPLOY_HOOK is missing: staging is NOT rebuilt.');
  if (action === 'no-next') throw new Error('npm has no next tag for @morphemecms/cms.');
  if (action === 'rebuild') {
    const hook = await fetchFn(env.STAGING_DEPLOY_HOOK, { method: 'POST' });
    if (!hook.ok) throw new Error(`The deploy hook answered ${hook.status}`);
    // Only after the hook has answered: a failed call is tried again at the next run.
    await env.STATE.put('last', next);
  }
  return action;
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(check(env));
  },
  // Open the address to see the state; it never calls the hook.
  async fetch(_request, env) {
    return Response.json({ last: (await env.STATE.get('last')) ?? null });
  },
};
