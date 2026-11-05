/**
 * Pure validation logic for store apps and themes.
 * Exposes isText, isPath, ITEM_ID, REFUSED_APPS, STANDARD, RECORD, validApp, validTheme.
 * No external dependencies.
 */

/**
 * @param {unknown} v
 * @returns {v is string}
 */
export const isText = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * @param {unknown} v
 * @returns {boolean}
 */
export const isPath = (v) => isText(v) && v.split('/').every((part) => part !== '' && part !== '.' && part !== '..');

export const ITEM_ID = /^[a-z0-9][a-z0-9-]*$/;
// The store's address before and a developer's page (STORE_BEFORE and DEVELOPER_ROUTE in src/store.ts)
export const REFUSED_APPS = ['butik', 'udvikler', 'developer'];
// The standard theme, which every site has
export const STANDARD = 'saturn';
// The note in an installed folder of where it came from
export const RECORD = 'store.json';

const isAdd = (v) => isText(v?.label) && isText(v?.icon);
const isGoodFile = (f) => isText(f?.oid) && isPath(f?.path) && f.path !== RECORD;

/**
 * @param {any} x
 * @param {number} api
 * @returns {boolean}
 */
export function validApp(x, api) {
  return (
    ITEM_ID.test(x?.id ?? '') &&
    !REFUSED_APPS.includes(x.id) &&
    isText(x.version) &&
    x.api === api &&
    [x.label, x.publisher, x.icon, x.hint].every(isText) &&
    Array.isArray(x.files) &&
    x.files.length > 0 &&
    x.files.every(isGoodFile) &&
    ['blocks', 'lists', 'kinds'].every((k) => Array.isArray(x.adds?.[k]) && x.adds[k].every(isAdd))
  );
}

/**
 * @param {any} x
 * @param {number} api
 * @returns {boolean}
 */
export function validTheme(x, api) {
  return (
    ITEM_ID.test(x?.id ?? '') &&
    x.id !== STANDARD &&
    x.api === api &&
    [x.version, x.name, x.author, x.icon].every(isText) &&
    Array.isArray(x.files) &&
    x.files.length > 0 &&
    x.files.every(isGoodFile)
  );
}
