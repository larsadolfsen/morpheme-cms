// Whether R2 caching (packages/editor/worker/files.js, the binding FILES) can be turned on, for Settings › Developer › Caching and builds in the
// editor (packages/editor/src/Advanced.tsx): the switch writes the bucket into the Worker's settings (wrangler.jsonc),
// and a deploy with a bucket Cloudflare does not have fails, so it can only be turned on when Cloudflare says the bucket
// is there (R2 turned on for the account, and the bucket made). Asked of Cloudflare's API with the Worker's own key, a
// token that may only read R2 (the secret CLOUDFLARE_R2_TOKEN, and CLOUDFLARE_ACCOUNT_ID; docs/editor.md, Setup). The same
// token also tells whether the account has Workers Paid (packages/editor/worker/plan-status.js), so it needs Billing: Read too.
//   GET /api/r2?bucket=<name>[&jurisdiction=<eu|fedramp>]  { bound, bucket }: whether this Worker has FILES now (the site is built with it), and the
//     bucket at Cloudflare: "ready" (there), "no-bucket", "no-r2" (R2 not turned on), "no-key" (the Worker has no key),
//     "refused" (Cloudflare said no to the key) or "failed". A bucket kept within a jurisdiction is only found in it.
// Only someone who can save the site (write access to the repository on GitHub) can ask.
import { json } from './not-found.js';
import { mayEdit } from './session.js';

// Cloudflare's codes for a bucket that is not there and for an account without R2.
const NO_BUCKET = 10006;
const NO_R2 = 10042;
// R2's rule for a bucket's name.
const NAME = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
// The jurisdictions R2 can keep a bucket within.
const JURISDICTION = /^(eu|fedramp)$/;

export async function handleR2(request, env) {
  if (!(await mayEdit(request))) return json({ error: 'forbidden' }, 403);
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  const params = new URL(request.url).searchParams;
  const name = params.get('bucket') ?? '';
  const jurisdiction = params.get('jurisdiction');
  if (!NAME.test(name)) return json({ error: 'bucket' }, 400);
  if (jurisdiction !== null && !JURISDICTION.test(jurisdiction)) return json({ error: 'jurisdiction' }, 400);
  return json({ bound: !!env.FILES, bucket: await bucketAt(env, name, jurisdiction) });
}

async function bucketAt(env, name, jurisdiction) {
  const account = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_R2_TOKEN?.trim();
  if (!account || !token) return 'no-key';
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/r2/buckets/${name}`, {
      headers: { authorization: `Bearer ${token}`, ...(jurisdiction ? { 'cf-r2-jurisdiction': jurisdiction } : {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.success) return 'ready';
    const codes = (body.errors ?? []).map((e) => e.code);
    if (codes.includes(NO_R2)) return 'no-r2';
    if (codes.includes(NO_BUCKET)) return 'no-bucket';
    if (res.status === 401 || res.status === 403) return 'refused';
    return 'failed';
  } catch {
    return 'failed';
  }
}
