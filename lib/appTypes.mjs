// The app categories of which only one app may be active at a time, and the active apps that stand in the way of an app.
// Exposes ONE_APP_TYPES, rivalsOf, withRivalsOff. Depends on ./appsFile.mjs (withOff).
import { withOff } from './appsFile.mjs';

/** @typedef {import('./appsFile.mjs').AppsState} AppsState */

/** The categories with one active app at most. @type {readonly string[]} */
export const ONE_APP_TYPES = Object.freeze(['redirects', 'links']);

/** The ids in `active` of the apps in `apps` with the same category as `app`, when that category is in ONE_APP_TYPES.
 * Never holds `app.id`. Sorted. Empty when `app` has no category or the category allows many apps.
 * @param {{ id: string, category?: string }} app @param {{ id: string, category?: string }[]} apps
 * @param {string[]} active @returns {string[]} */
export function rivalsOf(app, apps, active) {
  if (!app.category || !ONE_APP_TYPES.includes(app.category)) return [];
  return apps
    .filter((other) => other.category === app.category && other.id !== app.id && active.includes(other.id))
    .map((other) => other.id)
    .sort();
}

/** The state with each id of `rivals` turned off. Ids that are not installed are ignored.
 * @param {AppsState} state @param {string[]} rivals @returns {AppsState} */
export function withRivalsOff(state, rivals) {
  return rivals.reduce((now, id) => withOff(now, id, true), state);
}
