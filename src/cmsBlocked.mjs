// What stops the site from updating by itself, for the start screen: reads the Worker's status (GET /api/cms, worker/cms-update.js
// cmsStatus) and says which one reason to show, or null. Exports blockedUpdate. Depends on cms-version for the version comparison.
import { compareVersions } from '../lib/cms-version.mjs';

/**
 * The reason a site does not update by itself, or null. A missing token or KV always blocks; a refused write, `needs-npm` and
 * `contract` only matter while a newer version waits. A new major version, a skipped one and an unreachable npm are not blocks the
 * owner can fix: the Morpheme page shows those.
 * @param {{ running: string, token?: boolean, kv?: boolean, checked?: { latest?: string | null, problem?: { kind: string, item?: string, id?: string, why?: string } } | null }} status
 * @returns {{ kind: 'no-token' | 'no-kv' } | { kind: 'cannot-write' | 'needs-npm', version: string } | { kind: 'contract', version: string, item: 'theme' | 'app', id: string, sure: boolean } | null}
 */
export function blockedUpdate(status) {
  if (!status) return null;
  if (status.kv === false) return { kind: 'no-kv' };
  if (status.token === false) return { kind: 'no-token' };
  const latest = status.checked?.latest;
  let waiting = false;
  try {
    waiting = !!latest && compareVersions(latest, status.running) === 1;
  } catch {
    // A pre-release or an invalid version: nothing waits.
  }
  const problem = status.checked?.problem;
  if (!waiting || !problem) return null;
  if (problem.kind === 'cannot-write' || problem.kind === 'needs-npm') return { kind: problem.kind, version: latest };
  if (problem.kind === 'contract' && (problem.item === 'theme' || problem.item === 'app') && problem.id) {
    return { kind: 'contract', version: latest, item: problem.item, id: problem.id, sure: problem.why !== 'could-not-confirm' };
  }
  return null;
}
