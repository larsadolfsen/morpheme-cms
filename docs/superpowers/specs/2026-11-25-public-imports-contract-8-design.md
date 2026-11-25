# The public import list (contract 8)

Status: Decided by the owner, 25 Nov 2026 (yes). Written by the CTO. Docs only.

1. **Why.** 0.21.1 pre-builds the editor. Theme and app editor code is then built apart and meets the editor through an import map, so it reaches only the CMS modules the map names. The list of those modules was contract 9. It only states what they may already import, so it goes into contract 8. 0.21.1 changes how the editor is built, not the contract.

2. **The list.** `lib/public-imports.mjs` exports `PUBLIC_IMPORTS` (exact specifiers, with an optional trailing `/*` for one folder level) and `publicImportOf(spec)`. `docs/app-contract.md` gets a section "Public imports" with the same list; `check:imports` fails if they differ. 0.21.1's import map is generated from this file.

   The first version is what the measured sources import (measured 25 Nov on `theme/`, about 130 specifiers):
   - the blocks' contract: `@morphemecms/cms/src/standard/view`, `.../src/standard/<type>/view|load|fields|leading|filter.mjs`, `Block.astro`, `head`, `views`, `sites`, `src/blocks`, `src/inline`;
   - icons and texts: `src/icon`, `src/iconColor`, `src/i18n`;
   - the `site/*` files Material imports: `site`, `content`, `images.mjs`, `standardPages`, `popups`, `noindex.mjs`, `social.mjs`, `sections`, `schema`, `home`, `format`, `text`, `templates`, `seo`, `pageColors`, `motion`, `consent`, `categories`, `apps`, `defineSite.mjs`;
   - the `lib/*` files Material imports: `motion`, `breakpoints.mjs`, `snackbar`, `sheet-stops.mjs`, `menuTypeAhead.mjs`, `inline`, `eyebrow.mjs`, `cookieCategories.mjs`, `blocks.mjs`, `text-sections.mjs`, `status.mjs`, `page-template.mjs`, `lead.mjs`, `enterKey.mjs`, `drawerKeys.mjs`, `crop.mjs`, `colors`, `dynamic-colors`, `hooks`, `versions.mjs`;
   - the theme's own `@theme/ui|blocks|components|layouts|editor/*`; and `@site/*`, `@data/*`, `@app/self`, relative imports.

   The batch builds the real list from the check's report, not from this table (the table measures only the shipped theme).

   Refused: any other `@morphemecms/cms` path (screens, `src/store`, `src/ui`, `src/registry`, `pages/`, `worker/`), `virtual:*`, and deep imports into a standard block beyond the named files. Adding a specifier later is additive; removing or moving one raises the contract.

3. **The check.** `scripts/check-imports.mjs`, `npm run check:imports`, the same pattern as `check:app-css` (report first, refuse in the contract batch).
   - Input: `--site <folder>...` (default: the working directory, then `demo/`, `starter/`, `theme/`). It reads `theme/**`, `src/themes/*/**` and `src/apps/*/**` (`.ts .tsx .js .jsx .mjs .astro`, not `*.test.*`) with TypeScript's parser: `import`/`export … from`, `import()`, `require()`, Astro `<script>` and `import.meta.glob` patterns.
   - It fails (from batch 8c) on a `@morphemecms/cms` specifier that `publicImportOf` does not allow, on `virtual:*`, and on a hook or after-build step that imports anything but the three modules of app-contract "Imports" (unchanged). The message gives the file, line, specifier and the nearest allowed one.
   - `--report` (before 8c) never fails. The 8c session runs it on `theme/`, `demo/`, `starter/` and the `morpheme-apps` and Venus checkouts. Each outside import is moved to a listed one, or added to the list with a reason, or fixed in the app.
   - CI: one job beside `check:m3-names`; included in `check:source`.

4. **Migration.** A site's own `src/` is not checked. A store item that imports outside the list is not offered at contract 8. There is no automatic rewrite (an internal import may move, so a rewrite would be a guess); `migrate-code` stays as it is; fixes are pull requests to the owner's items. There are no third-party items yet.

5. **Builds on / needs from 8c.**
   - Builds on: the scoped-CSS check pattern, `check:m3-names --report`, and the names batches that rename `@theme/ui` parts (the list is written after batch 3, using `scripts/m3-names.json`).
   - Needs from 8c: `lib/public-imports.mjs`, the app-contract section, and the `lib/contracts.mjs` header sentence ("8 ... a theme or app imports only from lib/public-imports.mjs; 0.21.1's pre-built editor reads that list"); `check:imports` switched to failing and added to `check:source`; the developer release note (the list; stay inside it).

6. **Tests.**
   - A made-up theme and app: an import inside the list passes; `@morphemecms/cms/src/store` fails with file, line and nearest name.
   - A dynamic import and a glob into the package are caught.
   - A hook that imports outside the three modules fails.
   - The docs section differing from the lib file fails.
   - `check:demo`, `check:starter` and `check:themes` are green with no listed exception.
