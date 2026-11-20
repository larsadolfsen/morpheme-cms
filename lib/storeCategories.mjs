/**
 * The Appstore's categories: the main categories an app or a theme can have, the subcategories of each and how an older
 * id maps to a new one. What belongs in each: docs/store-categories.md.
 * Exposes CATEGORIES, SUBCATEGORIES, LEGACY_CATEGORIES, ROLES, categoryOf, roleOf.
 * No external dependencies.
 */

/** @typedef {'analytics' | 'appearance' | 'booking' | 'email' | 'forms' | 'languages' | 'payments' | 'privacy' | 'security' | 'seo' | 'shop' | 'social'} Category */

/** @typedef {'connector' | 'plugin'} Role A connector sends data to, or loads code from, an outside service; a plugin has no outside access. */

/** @typedef {'newsletter' | 'payment' | 'design' | 'redirects' | 'links' | 'connectors'} LegacyCategory An id from before the categories were these. */

/** The main categories, alphabetical. @type {readonly Category[]} */
export const CATEGORIES = [
  'analytics',
  'appearance',
  'booking',
  'email',
  'forms',
  'languages',
  'payments',
  'privacy',
  'security',
  'seo',
  'shop',
  'social',
];

/**
 * The subcategories of each main category. A subcategory belongs to exactly one main category. Under `seo`, `links` and
 * `redirects` are the types of which a site runs only one active app (ONE_APP_TYPES in lib/appTypes.mjs); the other lists
 * are empty for now, and later entries are added here.
 * @type {Record<Category, string[]>}
 */
export const SUBCATEGORIES = /** @type {Record<Category, string[]>} */ ({
  ...Object.fromEntries(CATEGORIES.map((id) => [id, []])),
  seo: ['links', 'redirects'],
});

/** The roles of an app. @type {readonly Role[]} */
export const ROLES = ['connector', 'plugin'];

/**
 * Ids an app or a theme may still carry from before the categories were these, and the category (and subcategory) or
 * role each maps to. The old id `content` has no new home: it maps to nothing. The old category `connectors` is the
 * role `connector`, with no category.
 * @type {Record<LegacyCategory, { category?: Category, subcategory?: string, role?: Role }>}
 */
export const LEGACY_CATEGORIES = {
  newsletter: { category: 'email' },
  payment: { category: 'payments' },
  design: { category: 'appearance' },
  redirects: { category: 'seo', subcategory: 'redirects' },
  links: { category: 'seo', subcategory: 'links' },
  connectors: { role: 'connector' },
};

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/**
 * The category and subcategory an item has, as the editor uses them: a legacy id is mapped to its new one (`redirects`
 * is the subcategory `redirects` of `seo`), an unknown or non-string category gives `{}`, and the subcategory is kept
 * only when it is listed for the category. A subcategory given with the category wins over one a legacy id implies.
 * Never throws.
 * @param {unknown} category
 * @param {unknown} [subcategory]
 * @param {Partial<Record<string, string[]>>} [subcategories] The lists of subcategories to check against (default SUBCATEGORIES).
 * @returns {{ category?: Category, subcategory?: string }}
 */
export function categoryOf(category, subcategory, subcategories = SUBCATEGORIES) {
  if (typeof category !== 'string') return {};
  const legacy = own(LEGACY_CATEGORIES, category) ? LEGACY_CATEGORIES[category] : undefined;
  const main = legacy ? legacy.category : category;
  if (!main || !CATEGORIES.includes(main)) return {};
  const listed = own(subcategories, main) && Array.isArray(subcategories[main]) ? subcategories[main] : [];
  const sub = typeof subcategory === 'string' && listed.includes(subcategory) ? subcategory : undefined;
  const implied = legacy?.subcategory && listed.includes(legacy.subcategory) ? legacy.subcategory : undefined;
  const chosen = sub ?? implied;
  return chosen ? { category: main, subcategory: chosen } : { category: main };
}

const hasItems = (list) => Array.isArray(list) && list.some((x) => typeof x === 'string' && x.trim());

/**
 * The role of an item: `connector` or `plugin` for an app, `undefined` for a theme. A declared role wins. Without one
 * (or with an unknown one) the old category `connectors` gives `connector`, and so does an app that has an `mcp` server
 * or any outside host (in its `csp`, or in the `needs` of its catalog entry: `loads` and `sends`); any other gives
 * `plugin`. Never throws.
 * @param {{ kind?: unknown, role?: unknown, category?: unknown, mcp?: unknown, csp?: unknown, needs?: unknown }} item
 * @returns {Role | undefined}
 */
export function roleOf(item) {
  if (item?.kind === 'theme') return undefined;
  if (ROLES.includes(/** @type {Role} */ (item?.role))) return /** @type {Role} */ (item.role);
  const legacy = typeof item?.category === 'string' && own(LEGACY_CATEGORIES, item.category) ? LEGACY_CATEGORIES[item.category] : undefined;
  if (legacy?.role) return legacy.role;
  const csp = item?.csp && typeof item.csp === 'object' ? Object.values(item.csp) : [];
  const needs = /** @type {{ loads?: unknown, sends?: unknown } | undefined} */ (
    item?.needs && typeof item.needs === 'object' ? item.needs : undefined
  );
  const outside = csp.some(hasItems) || hasItems(needs?.loads) || hasItems(needs?.sends);
  return item?.mcp || outside ? 'connector' : 'plugin';
}
