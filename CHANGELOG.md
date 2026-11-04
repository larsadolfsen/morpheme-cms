# @morphemecms/cms

## 0.7.0

### Minor Changes

- e15a802: Bring the editor up to date with morpheme-website's copy: the navigation rail and two-level main menu, and the other editor changes made there since 3 November.

## 0.6.0

### Minor Changes

- 3723ec1: The front page no longer forces a Banner. A Banner there is an ordinary block: it can be moved, hidden or removed. An app block can be the top of the front page instead.

### Patch Changes

- f0080db: `morpheme check:content` reads a site's files with `/` in their paths on Windows too, so it finds the standard pages there.

## 0.5.0

### Minor Changes

- 322a404: Connect a site to the Morpheme store from the editor's Appstore. A key set by hand in MORPHEME_STORE_KEY still works.

### Patch Changes

- eb1f36f: A site's build reads Phosphor's icons one at a time, so it passes on Cloudflare's build image, which allows 1024 open files.
- 6844676: The editor's start screen shows the installed CMS version before the update time, e.g. "Morpheme 0.5.0 · Updated 19.26". A pre-release shows short ("0.5.0-next"); a click shows the full version.
- 2fa2bb3: New sites install a fixed postcss-selector-parser (6.1.5) under @tailwindcss/typography, which closes CVE-2026-104844.
- f343523: The package has the types of the theme's `editor/looks.mjs`, so a site's type check (`tsc`) passes again.

## 0.4.0

### Minor Changes

- cf46cb1: An app's block and pop-up name their view module `viewOf.ts` (it was `view.ts`), so it no longer collides with `View.tsx` on Windows.
- 1fcbd56: The site updates Morpheme by itself: a new minor or patch version on npm is installed within the hour and undone when the site cannot be built. See Settings › Morpheme.

### Patch Changes

- dd9ab22: Settings › Morpheme says when the site has no KV storage (PUSH), and no longer fails to open when the site runs a pre-release of Morpheme.
- cf9f144: Keep the line breaks of a file's front matter (CRLF or LF) when the editor writes it back.
- 6cb2c17: `check:worker` passes when the site runs a pre-release of Morpheme (as the staging site does).
- 682da97: New sites from the starter can reach the Morpheme store on the same Cloudflare account, and Prettier skips store theme files.

## 0.3.0

### Minor Changes

- 07db64b: A site can show one block in a column beside the text of its pages: a block says it can with `beside: true` in its `load.ts`, the owner picks it under Appearance › Side column (`src/data/side.json`), and a page can turn it off (`side: false`); each block now gives its own front-page lead in a `lead.ts`; `defineSite` takes `logo` for the structured data; and the icon packs have calendar-x, identification-card, money, receipt and wallet.

## 0.2.0

### Minor Changes

- 545e832: Themes and apps are installed from the Morpheme store, through the site's Worker (`/api/store/`); set the secret `MORPHEME_STORE_KEY` to connect a site. `store` in `src/site/config.ts` is gone, and a store theme may import CSS only from `@morphemecms/cms` and its own files.
- 9dbb555: Builds on Windows: the theme's helpers `ui/dialog.ts`, `ui/bottomSheet.ts` and `ui/sideSheet.ts` are now `ui/dialogControl.ts`, `ui/bottomSheetControl.ts` and `ui/sideSheetControl.ts` (app API 2, theme API 3), the editor's screen data modules are `*Data.ts`, `worker/apps.js` with CRLF line endings passes the content check, and the check stops two files whose names differ only by case.

### Patch Changes

- 13d68c5: The package now includes its CHANGELOG.md, so a site can read what each version changed.
