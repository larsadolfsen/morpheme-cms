// The status of GitHub and Cloudflare, as the Worker says (/api/status, worker/service-status.js): what the editor's footer
// and its "System status" screen (ServiceStatus.tsx) show. Exposes serviceStatus. The types are in lib/serviceStatus.mjs.
// The last finished report is kept for a minute (a value, never a pending promise), so a navigation does not ask again.
import type { StatusReport } from '../lib/serviceStatus.mjs';

const KEEP_MS = 60_000;
// A slow Worker must not hold the dot or the status screen: after this the report is null (unknown).
const TIMEOUT_MS = 5000;
let kept: { report: StatusReport; at: number } | null = null;

/** The report, or null when it can't be fetched (no session, not JSON, offline, no answer in 5 seconds). A report less than a minute old is
 * reused unless `fresh`; a failure or a timeout is not kept. */
export async function serviceStatus({ fresh = false }: { fresh?: boolean } = {}): Promise<StatusReport | null> {
  if (!fresh && kept && Date.now() - kept.at < KEEP_MS) return kept.report;
  try {
    const res = await fetch('/api/status', { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    const report = (await res.json()) as StatusReport;
    kept = { report, at: Date.now() };
    return report;
  } catch {
    return null;
  }
}
