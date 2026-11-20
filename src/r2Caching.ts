// Also here: planStatus, whether the account has Workers Paid (/api/plan, packages/editor/worker/plan-status.js), asked for "Paid builds".
// R2 caching: the Worker's copy of the site's files in R2 (packages/editor/worker/files.js), turned on and off under "Settings" ›
// "Caching and builds" (Advanced.tsx). It is the line of its bucket (`"r2_buckets": …`, the binding FILES) in the Worker's settings
// (config.wrangler): there when it is on, there as a comment ("// …") when it is off, so a deploy never asks for a bucket
// Cloudflare does not have. Changed as text, so the file's comments stay. It can only be turned on when the Worker says
// Cloudflare has the bucket (/api/r2, packages/editor/worker/r2-status.js). Where the bucket is kept ("Location"): placed by Cloudflare,
// or within a jurisdiction (`"jurisdiction": "eu"` in the line), where it is asked for: Cloudflare has no bucket of that
// name outside it. It can only be changed while R2 caching is off, since it names another bucket.

const LINE = /^([ \t]*)(\/\/[ \t]*)?("r2_buckets"[ \t]*:.*)$/m;

/** Whether R2 caching is on in the Worker's settings; null when they have no line for it. */
export function r2CachingOn(text: string): boolean | null {
  const line = LINE.exec(text);
  return line ? !line[2] : null;
}

/** The Worker's settings with R2 caching on or off. */
export const withR2Caching = (text: string, on: boolean): string =>
  text.replace(LINE, (_, indent: string, _comment: string | undefined, line: string) => `${indent}${on ? '' : '// '}${line}`);

/** The name of the bucket in the line, or null. */
export const bucketOf = (text: string): string | null => /"bucket_name"\s*:\s*"([^"]+)"/.exec(LINE.exec(text)?.[3] ?? '')?.[1] ?? null;

/** The jurisdiction the bucket is kept within (`eu`, `fedramp`), or null when the line names none. */
export const jurisdictionOf = (text: string): string | null =>
  /"jurisdiction"\s*:\s*"([^"]+)"/.exec(LINE.exec(text)?.[3] ?? '')?.[1] ?? null;

/** The jurisdictions the bucket can be kept within, in the editor (Cloudflare also has `fedramp`, for the US government). */
export const JURISDICTIONS = ['eu'] as const;

/** The Worker's settings with the bucket kept within `jurisdiction`, or placed by Cloudflare (null). */
export const withJurisdiction = (text: string, jurisdiction: string | null): string =>
  text.replace(LINE, (_, indent: string, comment: string | undefined, line: string) => {
    const without = line.replace(/,\s*"jurisdiction"\s*:\s*"[^"]*"/, '');
    const changed = jurisdiction ? without.replace(/("bucket_name"\s*:\s*"[^"]+")/, `$1, "jurisdiction": "${jurisdiction}"`) : without;
    return `${indent}${comment ?? ''}${changed}`;
  });

/** A jurisdiction's name, as Cloudflare writes it. */
export const jurisdictionName = (jurisdiction: string): string => ({ eu: 'EU', fedramp: 'FedRAMP' })[jurisdiction] ?? jurisdiction;

/** Whether the account has Workers Paid, as the Worker says (packages/editor/worker/plan-status.js); 'failed' when it can't be asked. */
export type PaidState = 'yes' | 'no' | 'no-key' | 'refused' | 'failed';

export async function planStatus(): Promise<PaidState> {
  try {
    const res = await fetch('/api/plan', { cache: 'no-store' });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return 'failed';
    return (await res.json()).paid;
  } catch {
    return 'failed';
  }
}

/** The bucket at Cloudflare, as the Worker says (packages/editor/worker/r2-status.js). */
export type BucketState = 'ready' | 'no-bucket' | 'no-r2' | 'no-key' | 'refused' | 'failed';

/** Whether the Worker has the bucket now (the site is built with R2 caching on), and the bucket at Cloudflare. */
export async function r2Status(bucket: string, jurisdiction: string | null): Promise<{ bound: boolean; bucket: BucketState }> {
  const query = new URLSearchParams({ bucket, ...(jurisdiction ? { jurisdiction } : {}) });
  try {
    const res = await fetch(`/api/r2?${query}`, { cache: 'no-store' });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return { bound: false, bucket: 'failed' };
    return await res.json();
  } catch {
    return { bound: false, bucket: 'failed' };
  }
}
