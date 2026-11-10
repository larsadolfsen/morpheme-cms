/**
 * The Appstore's categories: the main categories an app or a theme can have, the subcategories of each (none yet) and
 * how an older id maps to a new one. What belongs in each: docs/store-categories.md.
 * Exposes CATEGORIES, SUBCATEGORIES, LEGACY_CATEGORIES, categoryOf.
 * No external dependencies.
 */

/** @typedef {'analytics' | 'appearance' | 'booking' | 'connectors' | 'email' | 'forms' | 'languages' | 'payments' | 'privacy' | 'security' | 'seo' | 'shop' | 'social'} Category */

/** @typedef {'newsletter' | 'payment' | 'design'} LegacyCategory An id from before the categories were these. */

/** The main categories, alphabetical. @type {readonly Category[]} */
export const CATEGORIES = [
  'analytics',
  'appearance',
  'booking',
  'connectors',
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
 * The subcategories of each main category. A subcategory belongs to exactly one main category. Every list is empty for
 * now; later entries are added here.
 * @type {Record<Category, string[]>}
 */
export const SUBCATEGORIES = /** @type {Record<Category, string[]>} */ (Object.fromEntries(CATEGORIES.map((id) => [id, []])));

/**
 * Ids an app or a theme may still carry from before the categories were these, and the main category each maps to.
 * The old id `content` has no new home: it maps to nothing.
 * @type {Record<LegacyCategory, Category>}
 */
export const LEGACY_CATEGORIES = { newsletter: 'email', payment: 'payments', design: 'appearance' };

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/**
 * The main category an id stands for: itself, or the new id of a legacy one; undefined for anything else.
 * @param {unknown} category
 * @returns {Category | undefined}
 */
function mainOf(category) {
  if (typeof category !== 'string') return undefined;
  const id = own(LEGACY_CATEGORIES, category) ? LEGACY_CATEGORIES[category] : category;
  return CATEGORIES.includes(id) ? id : undefined;
}

/**
 * The category and subcategory an item has, as the editor uses them: a legacy id is mapped to its new one, an unknown
 * or non-string category gives `{}`, and the subcategory is kept only when it is listed for the category. Never throws.
 * @param {unknown} category
 * @param {unknown} [subcategory]
 * @param {Partial<Record<string, string[]>>} [subcategories] The lists of subcategories to check against (default SUBCATEGORIES).
 * @returns {{ category?: Category, subcategory?: string }}
 */
export function categoryOf(category, subcategory, subcategories = SUBCATEGORIES) {
  const main = mainOf(category);
  if (!main) return {};
  const listed = own(subcategories, main) && Array.isArray(subcategories[main]) ? subcategories[main] : [];
  return typeof subcategory === 'string' && listed.includes(subcategory) ? { category: main, subcategory } : { category: main };
}
