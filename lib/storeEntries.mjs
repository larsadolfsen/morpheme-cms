/**
 * Pure validation logic for store apps and themes.
 * Exposes isText, isPath, ITEM_ID, HANDLE, STANDARD, RECORD, validApp, validTheme, strayStoreId.
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

// A permanent id: the kind, then 16 lowercase hex characters
export const ITEM_ID = /^(app|theme)_[0-9a-f]{16}$/;
// An item's address in the store: publisher/name
export const HANDLE = /^[a-z0-9][a-z0-9-]{0,39}\/[a-z0-9][a-z0-9-]{0,39}$/;
// The standard theme, which every site has
export const STANDARD = 'saturn';
// The note in an installed folder of where it came from
export const RECORD = 'store.json';

const hasId = (x, kind) => ITEM_ID.test(x?.id ?? '') && x.id.startsWith(`${kind}_`);
const hasHandle = (x) => HANDLE.test(x?.handle ?? '');

/**
 * True when a site's own folder name looks like a store id of this kind (it starts with `app_` or `theme_`) but is not one.
 * @param {string} name
 * @param {'app' | 'theme'} kind
 * @returns {boolean}
 */
export const strayStoreId = (name, kind) => /^(app|theme)_/.test(name) && !(ITEM_ID.test(name) && name.startsWith(`${kind}_`));

const isAdd = (v) => isText(v?.label) && isText(v?.icon);
const isGoodFile = (f) => isText(f?.oid) && isPath(f?.path) && f.path !== RECORD;

/**
 * @param {any} x
 * @param {number | readonly number[]} api The contract, or the contracts the editor reads.
 * @returns {boolean}
 */
export function validApp(x, api) {
  const apis = [api].flat();
  return (
    hasId(x, 'app') &&
    hasHandle(x) &&
    isText(x.version) &&
    apis.includes(x.api) &&
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
    hasId(x, 'theme') &&
    hasHandle(x) &&
    x.api === api &&
    [x.version, x.name, x.author, x.icon].every(isText) &&
    Array.isArray(x.files) &&
    x.files.length > 0 &&
    x.files.every(isGoodFile)
  );
}
