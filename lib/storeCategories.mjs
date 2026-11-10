/**
 * The Appstore's categories: the main categories an app or a theme can have, the subcategories of each and how an older
 * id maps to a new one. What belongs in each: docs/store-categories.md.
 * Exposes CATEGORIES, SUBCATEGORIES, LEGACY_CATEGORIES, categoryOf.
 * No external dependencies.
 */

/** @typedef {'analytics' | 'appearance' | 'booking' | 'connectors' | 'email' | 'forms' | 'languages' | 'payments' | 'privacy' | 'security' | 'seo' | 'shop' | 'social'} Category */

/** @typedef {'newsletter' | 'payment' | 'design' | 'redirects' | 'links'} LegacyCategory An id from before the categories were these. */

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
 * The subcategories of each main category. A subcategory belongs to exactly one main category. Under `seo`, `links` and
 * `redirects` are the types of which a site runs only one active app (ONE_APP_TYPES in lib/appTypes.mjs); the other lists
 * are empty for now, and later entries are added here.
 * @type {Record<Category, string[]>}
 */
export const SUBCATEGORIES = /** @type {Record<Category, string[]>} */ ({
  ...Object.fromEntries(CATEGORIES.map((id) => [id, []])),
  seo: ['links', 'redirects'],
});

/**
 * Ids an app or a theme may still carry from before the categories were these, and the category (and subcategory) each
 * maps to. The old id `content` has no new home: it maps to nothing.
 * @type {Record<LegacyCategory, { category: Category, subcategory?: string }>}
 */
export const LEGACY_CATEGORIES = {
  newsletter: { category: 'email' },
  payment: { category: 'payments' },
  design: { category: 'appearance' },
  redirects: { category: 'seo', subcategory: 'redirects' },
  links: { category: 'seo', subcategory: 'links' },
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
  if (!CATEGORIES.includes(main)) return {};
  const listed = own(subcategories, main) && Array.isArray(subcategories[main]) ? subcategories[main] : [];
  const sub = typeof subcategory === 'string' && listed.includes(subcategory) ? subcategory : undefined;
  const implied = legacy?.subcategory && listed.includes(legacy.subcategory) ? legacy.subcategory : undefined;
  const chosen = sub ?? implied;
  return chosen ? { category: main, subcategory: chosen } : { category: main };
}
