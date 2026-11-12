// Rules for app types of which a site may run only one at a time (redirects, links): finds the rivals of an app.
// Exposes ONE_APP_TYPES, rivalsOf, withRivalsOff. Depends on ./appsFile.mjs and ./storeCategories.mjs.

import { withOff } from './appsFile.mjs';
import { categoryOf } from './storeCategories.mjs';

/** @typedef {import('./appsFile.mjs').AppsState} AppsState */
/** @typedef {{ id: string, category?: string, subcategory?: string }} AppInfo */

/** The subcategories (of `seo`) of which only one app may be active. @type {readonly string[]} */
export const ONE_APP_TYPES = ['redirects', 'links'];

/** The type of an app: its subcategory. The old category ids `redirects` and `links` count as that subcategory of `seo`
 * (categoryOf). @param {AppInfo} app @returns {string | undefined} */
const typeOf = (app) => categoryOf(app.category, app.subcategory).subcategory;

/** The ids in `active` of the other apps in `apps` with the same one-app type as `app`, sorted.
 * Empty when `app` has no type or its type allows many apps.
 * @param {AppInfo} app @param {AppInfo[]} apps @param {string[]} active @returns {string[]} */
export function rivalsOf(app, apps, active) {
  const type = typeOf(app);
  if (!type || !ONE_APP_TYPES.includes(type)) return [];
  return apps
    .filter((other) => other.id !== app.id && typeOf(other) === type && active.includes(other.id))
    .map((other) => other.id)
    .sort();
}

/** The state with each rival turned off. Ids that are not installed are ignored.
 * @param {AppsState} state @param {string[]} rivals @returns {AppsState} */
export function withRivalsOff(state, rivals) {
  return rivals.reduce((next, id) => withOff(next, id, true), state);
}
