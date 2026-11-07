// The status of GitHub and Cloudflare, as the Worker says (/api/status, worker/service-status.js): what the editor's footer
// and its "System status" screen (ServiceStatus.tsx) show. Exposes serviceStatus. The types are in lib/serviceStatus.mjs.
import type { StatusReport } from '../lib/serviceStatus.mjs';

/** The report, or null when it can't be fetched (no session, not JSON, offline). */
export async function serviceStatus(): Promise<StatusReport | null> {
  try {
    const res = await fetch('/api/status', { cache: 'no-store' });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    return (await res.json()) as StatusReport;
  } catch {
    return null;
  }
}
