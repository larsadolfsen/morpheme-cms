/**
 * The public imports of contract 8 (docs/superpowers/specs/2026-11-25-public-imports-contract-8-design.md): the modules of `@morphemecms/cms` a theme or an app may
 * import. 0.21.1's pre-built editor meets theme and app code through an import map made from this list, so only these specifiers are there. The same list is in
 * docs/app-contract.md, "Public imports" (`check:imports` fails if they differ). A theme's own `@theme/*`, `@site/*`, `@data/*`, `@app/self` and relative imports
 * are not CMS modules and are not listed. Adding a specifier is additive; removing or moving one raises the contract.
 */
export const PUBLIC_IMPORTS = Object.freeze([
  // The blocks' contract: the standard blocks' views and loaders, and the files that draw a block.
  '@morphemecms/cms/src/standard/view',
  '@morphemecms/cms/src/standard/Block.astro',
  '@morphemecms/cms/src/standard/head',
  '@morphemecms/cms/src/standard/views',
  '@morphemecms/cms/src/standard/sites',
  '@morphemecms/cms/src/standard/load',
  '@morphemecms/cms/src/standard/appScope',
  '@morphemecms/cms/src/blocks',
  '@morphemecms/cms/src/inline',
  '@morphemecms/cms/src/standard/buttons/view',
  '@morphemecms/cms/src/standard/buttons/load',
  '@morphemecms/cms/src/standard/buttons/fields',
  '@morphemecms/cms/src/standard/cards/view',
  '@morphemecms/cms/src/standard/cards/load',
  '@morphemecms/cms/src/standard/carousel/view',
  '@morphemecms/cms/src/standard/carousel/load',
  '@morphemecms/cms/src/standard/checklist/view',
  '@morphemecms/cms/src/standard/checklist/load',
  '@morphemecms/cms/src/standard/cookies/view',
  '@morphemecms/cms/src/standard/cookies/load',
  '@morphemecms/cms/src/standard/expand/view',
  '@morphemecms/cms/src/standard/expand/load',
  '@morphemecms/cms/src/standard/imagegrid/view',
  '@morphemecms/cms/src/standard/imagegrid/load',
  '@morphemecms/cms/src/standard/imagegrid/filter.mjs',
  '@morphemecms/cms/src/standard/list/view',
  '@morphemecms/cms/src/standard/list/load',
  '@morphemecms/cms/src/standard/list/leading',
  '@morphemecms/cms/src/standard/notice/view',
  '@morphemecms/cms/src/standard/notice/load',
  '@morphemecms/cms/src/standard/posts/view',
  '@morphemecms/cms/src/standard/posts/load',
  '@morphemecms/cms/src/standard/pricecards/view',
  '@morphemecms/cms/src/standard/pricecards/load',
  '@morphemecms/cms/src/standard/steps/view',
  '@morphemecms/cms/src/standard/steps/load',
  '@morphemecms/cms/src/standard/table/view',
  '@morphemecms/cms/src/standard/table/load',
  '@morphemecms/cms/src/standard/testimonials/view',
  '@morphemecms/cms/src/standard/testimonials/load',
  '@morphemecms/cms/src/standard/video/view',
  '@morphemecms/cms/src/standard/video/load',
  // The editor's parts: what an app's editor code draws and asks with.
  '@morphemecms/cms/src/apps',
  '@morphemecms/cms/src/ui',
  '@morphemecms/cms/src/when',
  '@morphemecms/cms/src/ask',
  // Icons and texts.
  '@morphemecms/cms/src/icon',
  '@morphemecms/cms/src/iconColor',
  '@morphemecms/cms/src/i18n',
  // The site's files.
  '@morphemecms/cms/site/site',
  '@morphemecms/cms/site/content',
  '@morphemecms/cms/site/images.mjs',
  '@morphemecms/cms/site/standardPages',
  '@morphemecms/cms/site/popups',
  '@morphemecms/cms/site/noindex.mjs',
  '@morphemecms/cms/site/social.mjs',
  '@morphemecms/cms/site/sections',
  '@morphemecms/cms/site/schema',
  '@morphemecms/cms/site/home',
  '@morphemecms/cms/site/format',
  '@morphemecms/cms/site/text',
  '@morphemecms/cms/site/templates',
  '@morphemecms/cms/site/seo',
  '@morphemecms/cms/site/pageColors',
  '@morphemecms/cms/site/motion',
  '@morphemecms/cms/site/consent',
  '@morphemecms/cms/site/categories',
  '@morphemecms/cms/site/apps',
  '@morphemecms/cms/site/defineSite.mjs',
  '@morphemecms/cms/site/tracking.client',
  // Helpers.
  '@morphemecms/cms/lib/motion',
  '@morphemecms/cms/lib/breakpoints.mjs',
  '@morphemecms/cms/lib/snackbar',
  '@morphemecms/cms/lib/sheet-stops.mjs',
  '@morphemecms/cms/lib/menuTypeAhead.mjs',
  '@morphemecms/cms/lib/inline',
  '@morphemecms/cms/lib/eyebrow.mjs',
  '@morphemecms/cms/lib/cookieCategories.mjs',
  '@morphemecms/cms/lib/blocks.mjs',
  '@morphemecms/cms/lib/text-sections.mjs',
  '@morphemecms/cms/lib/status.mjs',
  '@morphemecms/cms/lib/page-template.mjs',
  '@morphemecms/cms/lib/lead.mjs',
  '@morphemecms/cms/lib/enterKey.mjs',
  '@morphemecms/cms/lib/drawerKeys.mjs',
  '@morphemecms/cms/lib/crop.mjs',
  '@morphemecms/cms/lib/colors',
  '@morphemecms/cms/lib/dynamic-colors',
  '@morphemecms/cms/lib/hooks',
  '@morphemecms/cms/lib/versions.mjs',
  '@morphemecms/cms/lib/appDefinition.mjs',
]);

/** What a hook or an after-build step imports besides its own folder and `@app/self` (docs/app-contract.md, "Imports"): it runs in QuickJS. */
export const SANDBOX_IMPORTS = Object.freeze([
  '@morphemecms/cms/lib/colors',
  '@morphemecms/cms/lib/dynamic-colors',
  '@morphemecms/cms/lib/hooks',
]);

/** A specifier without its Vite query (`?raw`, `?url`). @param {string} spec */
export const stripQuery = (spec) => spec.replace(/\?.*$/, '');

/**
 * The entry of the list a specifier is allowed by, or `null`. An entry is exact; one that ends in `/*` allows one folder level below it (no deeper).
 * @param {string} spec @returns {string | null}
 */
export function publicImportOf(spec) {
  const s = stripQuery(spec);
  if (PUBLIC_IMPORTS.includes(s)) return s;
  for (const e of PUBLIC_IMPORTS) {
    if (!e.endsWith('/*')) continue;
    const rest = s.startsWith(e.slice(0, -1)) ? s.slice(e.length - 1) : null;
    if (rest && !rest.includes('/')) return e;
  }
  return null;
}
