// Density: how much fits on the screen, Large, Medium (the default) or Small, picked on the account (Library) and kept on the
// person (GET and PUT /api/settings, worker/settings.js) with a copy in this browser. It is set on <html> as data-density, which
// the theme's styles/base.css turns into the person's step (--mo-density-user); the script in the head of pages/editor/index.astro
// does the same before the page is drawn, so it does not jump. Its own key, as the editor's colour mode has (theme.ts).
// Spec: docs/superpowers/specs/2026-11-13-density-design.md.
import { DEFAULT_DENSITY, DENSITIES, DENSITY_ATTRIBUTE } from './settings.mjs';

export type Density = 'large' | 'medium' | 'small';

const KEY = 'editor-density';

const isDensity = (v: unknown): v is Density => DENSITIES.includes(v as string);

/** The step kept in this browser: Medium when none. */
export function savedDensity(): Density {
  try {
    const d = localStorage.getItem(KEY);
    return isDensity(d) ? d : DEFAULT_DENSITY;
  } catch {
    return DEFAULT_DENSITY;
  }
}

/** Puts the step on <html>, as data-density. */
export function applyDensity(density: Density) {
  document.documentElement.dataset.density = DENSITY_ATTRIBUTE[density];
}

/** Applies the step and keeps a copy in this browser (Medium removes it). */
export function setDensity(density: Density) {
  try {
    if (density === DEFAULT_DENSITY) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, density);
  } catch {}
  applyDensity(density);
}

/** The step kept on the account, or null when there is none or the Worker has no storage (a preview of a branch). Any
 * other failure throws. `ask` is the browser's fetch by default. */
export async function loadDensity(ask: typeof fetch = (input, init) => fetch(input, init)): Promise<Density | null> {
  const res = await ask('/api/settings', { cache: 'no-store' });
  const body: unknown = res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => null) : null;
  if (res.status === 503 && (body as { error?: unknown } | null)?.error === 'no-storage') return null;
  if (!res.ok) throw new Error(`The settings answered ${res.status}`);
  const density = (body as { settings?: { density?: unknown } | null } | null)?.settings?.density;
  return isDensity(density) ? density : null;
}

/** Keeps the step on the account (PUT /api/settings). Resolves on any 2xx and when the Worker has no storage (the copy in
 * this browser is then all there is); else throws. */
export async function saveDensity(density: Density, ask: typeof fetch = (input, init) => fetch(input, init)): Promise<void> {
  const res = await ask('/api/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ density }),
  });
  if (res.ok || res.status === 503) return;
  throw new Error(`The settings were not saved (${res.status})`);
}

/** Takes the account's step when it has one, over the copy in this browser. */
export async function syncDensity(ask?: typeof fetch) {
  const kept = await loadDensity(ask).catch(() => null);
  if (kept) setDensity(kept);
}
