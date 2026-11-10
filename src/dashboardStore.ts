// The person's dashboard from the site's Worker (GET /api/dashboard, worker/dashboard.js), and which of its placements
// there is a widget for. Exposes loadDashboard, saveDashboard (PUT, with DashboardSaveError) and placementsOf. Only dashboard.mjs and types
// are imported, so this file runs under node --test.
import { defaultDashboard, validDashboard } from './dashboard.mjs';
import type { StoredDashboard, Placement } from './dashboard.mjs';
import type { WidgetDefinition } from './widgets';

/** The dashboard to show: the stored one, or the default when none is stored. A Worker without the DASHBOARD binding
 * (503 'no-storage', a site that has not got it yet) also gives the default: nothing can be saved there, so every visit
 * starts from it. Any other failure throws. `ask` and `newId` are the browser's fetch and crypto.randomUUID by default. */
export async function loadDashboard(
  ask: typeof fetch = (input, init) => fetch(input, init),
  newId: () => string = () => crypto.randomUUID(),
): Promise<StoredDashboard> {
  const res = await ask('/api/dashboard', { cache: 'no-store' });
  const body: unknown = res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => null) : null;
  const error = (body as { error?: unknown } | null)?.error;
  if (res.status === 503 && error === 'no-storage') return defaultDashboard(newId);
  if (!res.ok) throw new Error(`The dashboard answered ${res.status}`);
  const stored = (body as { dashboard?: unknown } | null)?.dashboard;
  if (stored === null) return defaultDashboard(newId);
  const dashboard = validDashboard(stored);
  if (!dashboard) throw new Error('The stored dashboard is not valid');
  return dashboard;
}

/** The placements whose widget exists in `widgets`, in order, each with its definition; unknown ones (an app no longer
 * installed) are skipped. */
export function placementsOf(
  dashboard: StoredDashboard,
  widgets: Map<string, WidgetDefinition>,
): { placement: Placement; definition: WidgetDefinition }[] {
  return dashboard.widgets.flatMap((placement) => {
    const definition = widgets.get(placement.widget);
    return definition ? [{ placement, definition }] : [];
  });
}

/** Why a save failed: `no-storage` (the site's Worker has no DASHBOARD binding yet), `invalid` (the Worker does not accept the
 * layout), `too-big`, or `failed` (anything else, a network error too, with `status` 0). */
export class DashboardSaveError extends Error {
  kind: 'no-storage' | 'invalid' | 'too-big' | 'failed';
  status: number;
  constructor(kind: 'no-storage' | 'invalid' | 'too-big' | 'failed', status: number) {
    super(`The dashboard was not saved (${kind}, ${status})`);
    this.name = 'DashboardSaveError';
    this.kind = kind;
    this.status = status;
  }
}

/** Saves the person's dashboard (PUT /api/dashboard). Resolves on any 2xx; else throws a DashboardSaveError. */
export async function saveDashboard(dashboard: StoredDashboard, ask: typeof fetch = (input, init) => fetch(input, init)): Promise<void> {
  let res: Response;
  try {
    res = await ask('/api/dashboard', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(dashboard),
    });
  } catch {
    throw new DashboardSaveError('failed', 0);
  }
  if (res.ok) return;
  const body: unknown = res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => null) : null;
  const error = (body as { error?: unknown } | null)?.error;
  if (res.status === 503 && error === 'no-storage') throw new DashboardSaveError('no-storage', res.status);
  if (res.status === 400) throw new DashboardSaveError('invalid', res.status);
  if (res.status === 413) throw new DashboardSaveError('too-big', res.status);
  throw new DashboardSaveError('failed', res.status);
}
