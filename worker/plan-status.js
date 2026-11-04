// Whether the Cloudflare account has Workers Paid, for "Indstillinger" › "Avanceret" › "Bygning" in the editor
// (packages/editor/src/Advanced.tsx): the switch "Betalt bygning" can only be turned on when Cloudflare says so.
// Asked of Cloudflare's API with the Worker's own key, the same token as for R2 (the secret CLOUDFLARE_R2_TOKEN, and
// CLOUDFLARE_ACCOUNT_ID); it also needs Account › Billing › Read (docs/editor.md, Opsætning).
//   GET /api/plan  { paid }: "yes" (Workers Paid), "no" (the account does not have it), "no-key" (the Worker has no key),
//     "refused" (Cloudflare said no to the key) or "failed".
// Only someone who can save the site (write access to the repository on GitHub) can ask.
import { json } from './not-found.js';
import { mayEdit } from './session.js';

// The states of a subscription that count as having the plan.
const PAID_STATES = ['paid', 'trial', 'provisioned'];

export async function handlePlan(request, env) {
  if (!(await mayEdit(request))) return json({ error: 'forbidden' }, 403);
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  return json({ paid: await paidAt(env) });
}

/** Whether the account's subscriptions (as Cloudflare lists them) include Workers Paid. Cloudflare writes the plan's id both as
 * WORKERS_PAID and workers_paid; a subscription with no state counts, one that is cancelled or the like does not. */
export function paidFrom(subscriptions) {
  if (!Array.isArray(subscriptions)) return false;
  return subscriptions.some((subscription) => {
    if (String(subscription?.rate_plan?.id ?? '').toLowerCase() !== 'workers_paid') return false;
    const state = subscription.state;
    return state === undefined || state === null || PAID_STATES.includes(String(state).toLowerCase());
  });
}

async function paidAt(env) {
  const account = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_R2_TOKEN?.trim();
  if (!account || !token) return 'no-key';
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/subscriptions`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.success) return paidFrom(body.result) ? 'yes' : 'no';
    if (res.status === 401 || res.status === 403) return 'refused';
    return 'failed';
  } catch {
    return 'failed';
  }
}
