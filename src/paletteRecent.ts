// The actions run from the command palette, kept in this browser only (localStorage `editor-recent-actions`, read and written in try/catch as
// sidebar.ts does): never sent anywhere. The rules (the last 8, 5 shown, a use count) are lib/actionRules.mjs. Exposes loadRecent, saveRecent, forgetRecent, loadSearches, saveSearches (the searches typed, `editor-recent-searches`, the same way).
import { clearRecent, readRecent, type RecentState } from '../lib/actionRules.mjs';
import { readSearches } from '../lib/recentSearches.mjs';

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
    localStorage.removeItem(SEARCHES);
  } catch {}
}

const SEARCHES = 'editor-recent-searches';

/** The searches this browser has kept, newest first (lib/recentSearches.mjs), or none. */
export function loadSearches(): string[] {
  try {
    return readSearches(JSON.parse(localStorage.getItem(SEARCHES) ?? 'null'));
  } catch {
    return [];
  }
}

export function saveSearches(list: string[]) {
  try {
    localStorage.setItem(SEARCHES, JSON.stringify(list));
  } catch {}
}
