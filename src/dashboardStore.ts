// The person's dashboard from the site's Worker (GET /api/dashboard, worker/dashboard.js), and which of its placements
// there is a widget for. Exposes loadDashboard and placementsOf. Nothing is saved from here yet. Only dashboard.mjs and types
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
