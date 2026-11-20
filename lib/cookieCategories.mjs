// The categories of cookies (and of what else a site stores in a visitor's browser), as a site declares them: each
// cookie in the cookie list and in an app's cookies.json has one (`category`). Necessary ones are set without asking;
// the visitor says yes or no to each of the others in the cookie banner, one at a time, so a yes to statistics is not
// a yes to marketing. An app that loads something that sets cookies starts after a yes to its categories (`cookies` in
// its index.ts, afterConsent in the site's tracking script). Marketing is measuring whether the ads work; targeted ads
// (`targeting`: using the visit to show the visitor ads, remarketing) are a yes of their own, asked about only when an
// app is set to use them. No dependencies, so the site's scripts, its Worker and its checks can use it.

/** @typedef {'necessary' | 'preferences' | 'statistics' | 'marketing' | 'targeting'} CookieCategory
 * @typedef {Exclude<CookieCategory, 'necessary'>} ConsentCategory One the visitor says yes or no to. */

/** The categories, in the order the cookie banner and the cookie list show them. @type {readonly CookieCategory[]} */
export const COOKIE_CATEGORIES = ['necessary', 'preferences', 'statistics', 'marketing', 'targeting'];

/** Those the visitor says yes or no to in the cookie banner. @type {readonly ConsentCategory[]} */
export const CONSENT_CATEGORIES = ['preferences', 'statistics', 'marketing', 'targeting'];

/** Whether a value is a category. @param {unknown} value @returns {value is CookieCategory} */
export const isCookieCategory = (value) => COOKIE_CATEGORIES.includes(/** @type {CookieCategory} */ (value));

/** Whether a value is a category the visitor says yes or no to. @param {unknown} value @returns {value is ConsentCategory} */
export const isConsentCategory = (value) => CONSENT_CATEGORIES.includes(/** @type {ConsentCategory} */ (value));

/** A cookie's category as its file has it (one in the cookie list, or in an app's cookies.json); one from before the
 * categories has `when` instead ('always': set also without a yes, so necessary), and one without either (npm run
 * check:content says so) counts as marketing, the one a visitor says yes to last.
 * @param {{ category?: unknown, when?: unknown }} cookie @returns {CookieCategory} */
export const categoryOf = ({ category, when }) => (isCookieCategory(category) ? category : when === 'always' ? 'necessary' : 'marketing');
