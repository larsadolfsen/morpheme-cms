// The actions run from the command palette, kept in this browser only (localStorage `editor-recent-actions`, read and written in try/catch as
// sidebar.ts does): never sent anywhere. The rules (the last 8, 5 shown, a use count) are lib/actionRules.mjs. Exposes loadRecent, saveRecent, forgetRecent.
import { clearRecent, readRecent, type RecentState } from '../lib/actionRules.mjs';

const KEY = 'editor-recent-actions';

/** What this browser has kept, or nothing. */
export function loadRecent(): RecentState {
  try {
    return readRecent(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
  } catch {
    return clearRecent();
  }
}

export function saveRecent(state: RecentState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

/** Forgets them (sign-out on a shared computer, and *Clear recent actions*). */
export function forgetRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
