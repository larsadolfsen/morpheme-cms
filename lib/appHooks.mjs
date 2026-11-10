// The places an app may change the site, by the name of their file in its hooks/ (without .ts).
// Exposes APP_HOOKS. Plain JavaScript, so Node scripts, the checks and lib/hooks.ts share one list.

/** @type {readonly ['page-colors']} */
export const APP_HOOKS = Object.freeze(['page-colors']);
