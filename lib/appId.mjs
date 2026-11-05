// The id of an app from the path of a file in its folder. Exposes appIdOf (re-exported by src/apps.ts).
// No dependencies, so the Vite plugin site/appSelf.mjs can use it too.

/** The id of an app from the path of a file in its folder ("/src/apps/mailchimp/index.ts": "mailchimp",
 * also ".../apps/mailchimp/popups/View.tsx"). @param {string} path */
export const appIdOf = (path) => path.split('/apps/')[1].split('/')[0];
