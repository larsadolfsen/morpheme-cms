// Rules for app types of which a site may run only one at a time (redirects, links): finds the rivals of an app.
// Exposes ONE_APP_TYPES, rivalsOf, withRivalsOff. Depends on ./appsFile.mjs.

import { withOff } from './appsFile.mjs';

/** @typedef {import('./appsFile.mjs').AppsState} AppsState */
/** @typedef {{ id: string, category?: string }} AppInfo */

/** The categories of which only one app may be active. @type {readonly string[]} */
export const ONE_APP_TYPES = ['redirects', 'links'];

/** The ids in `active` of the other apps in `apps` with the same one-app category as `app`, sorted.
 * Empty when `app` has no category or its category allows many apps.
 * @param {AppInfo} app @param {AppInfo[]} apps @param {string[]} active @returns {string[]} */
export function rivalsOf(app, apps, active) {
  if (!app.category || !ONE_APP_TYPES.includes(app.category)) return [];
  return apps
    .filter((other) => other.id !== app.id && other.category === app.category && active.includes(other.id))
    .map((other) => other.id)
    .sort();
}

/** The state with each rival turned off. Ids that are not installed are ignored.
 * @param {AppsState} state @param {string[]} rivals @returns {AppsState} */
export function withRivalsOff(state, rivals) {
  return rivals.reduce((next, id) => withOff(next, id, true), state);
}
