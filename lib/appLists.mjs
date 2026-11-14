// An app's data lists (contract 6): the `lists` key of app.json, written in the definition format of an own list's `_list.json`
// (lib/ownList.mjs) plus `id`, `singular`, `icon`, `locked`, `page` and `examples`. Pure code. Exposes LIST_ID, listProblems and listFolder.
import { parseDefinition } from './ownList.mjs';

/** A list's id inside its app. */
export const LIST_ID = /^[a-z][a-z0-9-]{0,39}$/;
const LIST_KEYS = ['id', 'label', 'singular', 'icon', 'version', 'fields', 'locked', 'page', 'examples'];

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

/** The folder of an app's list entries, `src/data/<app id>.<id>/`, as the name under `src/data/`. The dot never occurs in an own list's id.
 * @param {string} appId @param {string} listId */
export const listFolder = (appId, listId) => `${appId}.${listId}`;

/** The problems of the `lists` key of a contract 6 manifest, each one English sentence; none when valid.
 * @param {unknown[]} lists @param {Record<string, unknown>[]} settingsFields the app's settings fields
 * @param {{ firstParty?: boolean }} [options] `locked: false` is for first-party apps only (decision Q4)
 * @returns {string[]} */
export function listProblems(lists, settingsFields, options = {}) {
  /** @type {string[]} */
  const problems = [];
  const seen = new Set();
  lists.forEach((list, i) => {
    const at = `The key "lists" entry ${i + 1}`;
    if (!isObject(list)) return problems.push(`${at} must be an object.`);
    for (const key of Object.keys(list)) if (!LIST_KEYS.includes(key)) problems.push(`${at} has the unknown key "${key}".`);
    if (typeof list.id !== 'string' || !LIST_ID.test(list.id)) problems.push(`${at} needs an "id" that matches ${LIST_ID}.`);
    else if (seen.has(list.id)) problems.push(`The key "lists" has the id "${list.id}" more than once.`);
    else seen.add(list.id);
    for (const key of ['label', 'singular', 'icon']) if (!isText(list[key])) problems.push(`${at} must have a non-empty string "${key}".`);
    // The fields and their kinds follow the parser of `_list.json`, so there is one format.
    const { id, singular, icon, locked, page, examples, ...definition } = list;
    const parsed = parseDefinition(JSON.stringify(definition));
    if (parsed.problems) problems.push(...parsed.problems.map((p) => `${at}: ${p}`));
    if ('locked' in list) {
      if (typeof locked !== 'boolean') problems.push(`${at} "locked" must be true or false.`);
      else if (locked === false && !options.firstParty) problems.push(`${at} has "locked": false, which only a first-party app may use.`);
    }
    if ('page' in list) {
      if (typeof page !== 'string') problems.push(`${at} "page" must be a path such as "/faq/" or "settings:<field>".`);
      else if (page.startsWith('settings:')) {
        const field = page.slice('settings:'.length);
        if (!settingsFields.some((f) => f.name === field))
          problems.push(`${at} "page" names the setting "${field}", which is not a field in "settings".`);
      } else if (!/^\/[^\s]*$/.test(page) || page.startsWith('//')) {
        problems.push(`${at} "page" must be a path such as "/faq/" or "settings:<field>".`);
      }
    }
    if ('examples' in list && !(Array.isArray(examples) && examples.every(isObject))) {
      problems.push(`${at} "examples" must be a list of objects.`);
    }
  });
  return problems;
}
