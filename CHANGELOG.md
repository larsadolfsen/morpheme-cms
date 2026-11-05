# @morphemecms/cms

## 0.11.0

### Minor Changes

- 999d21e: Save notices name the version: app installs, and an app's settings through `changedTo`.

### Patch Changes

- 5a64119: Sites type-check again: the block side sheet's save button narrows to the fields step before it reads the block's type, so `BlockDialog.tsx` no longer fails `tsc` in a site.
- 4d4d32a: Sites type-check again: the types of `searchedAs` and `pageTitle` make every input optional except `site`, so the share preview no longer fails `tsc` in a site.

## 0.10.1

### Patch Changes

- 4d17412: The top bar shows an Open website link on the start screen instead of the account icon; the account is in the main drawer's header.

## 0.10.0

### Minor Changes

- 999142f: The action bar at the bottom of a phone's screen is a standard bottom sheet, on the site and in the editor.
- 50d360d: The fields of a block and the section settings open in a side sheet: over the page on a phone, beside it on a tablet and a computer.
- 358c778: The page and post forms show a Google result preview for phone and computer; the shared-link card keeps its shared width.
- 40b5fe3: Themes can open a side sheet on the site: a button with data-side-sheet-open opens the side sheet with that id.
- f501efb: Mark the parts the theme leaves to Material on Parts › UI components.

### Patch Changes

- 22d5764: The editor check no longer fails every page on Linux builds after the page template choice.
- 6dc373f: The text editor's empty-line hint follows the editor's language and says that the first heading is an H1.
- 1478765: On a page, the heading menus offer only H1 until the text has one, then H2 and H3.
- 64f9da7: Sites type-check again: `searchedAs` and `pageTitle` take `front` as optional (default `false`), so the SEO form and the share preview no longer fail `tsc` in a site.

## 0.9.1

### Patch Changes

- 2e5bc1d: Sites type-check again: the header settings screen passes its theme the right data.

## 0.9.0

### Minor Changes

- 34d7f2f: An installed app's page has the tabs Settings and Information.
- a5f16e1: Show block and section settings in a side panel on large screens.
- 995f08e: Buttons and icon buttons show the M3 loading indicator while their action runs.
- 9b1d632: An optional `src/data/header.json` adds a header action button (in place of the phone icon on larger screens) and sets the menu button's side; the new Appearance › Header and Appearance › Footer screens edit all header and footer settings with a live preview on a phone and a computer.
- facf878: A page chooses a template from the ones its theme offers (`template` in the front matter, "templates" in theme.json: single, full, sidebar-left, sidebar-right). The page flags `wide` and `side` are gone. A site must migrate its `wide: true` pages (for example to `template: single`) and may remove `side: false`.

### Patch Changes

- 09924d5: Install, update and uninstall buttons show the loading indicator while they run.
- 3a40970: The Save and "More versions" buttons use the busy button with the loading indicator.
- e1a9843: Media, redirect, restore, theme and move buttons show the loading indicator while they run.
- 46636dc: Buttons in the editor are as wide as their label on every screen (Material 3), never across the screen.
- c22e682: Cards side by side or under each other keep 8dp between them, set by the new token `--card-gap`.
- 9047684: Cards in the Cards block rise to the first elevation when pointed at, as Material 3's filled cards do.
- 22d9179: Cards have 16dp of room inside them, as Material 3 has, and a card's picture follows that room.
- a9e9e95: Cards that link are tinted when pointed at or focused, as in Material 3, and no longer get an accent outline.
- 35e53d0: The editor's Appstore and the cookie consent log no longer hang when an earlier request was cancelled.
- 13998ad: Show the row that deletes what a screen shows (Delete promotion, Delete page …) in the theme's error colour.
- 5c4fa60: Show the signed-in user and the site's domain at the top of the main drawer.
- bb36d48: The main drawer's account row is a pill like the drawer items, with a 1px border on the avatar, centred over the item icons.
- 1ab26e9: Show the main drawer's back row in its header row, instead of the account row, on a section's list.
- fc064fe: Align the main drawer header with the drawer's icons and arrows.
- 2c6ee27: Show a divider under the main drawer's header row.
- 152fb04: Make the main drawer's header row as high as a drawer item.
- 7d1f31b: The text toolbar has round corners and room all round it, also while it sticks under the top bar.
- c19ddf7: On a phone, hide the top bar's side panel button on screens that show a back arrow.
- 5db8ddc: Give every list item headline Material 3's label text size and weight.
- efbac0c: Lists in a page's dotted section frame keep their indent, so the bullets stand clear of the line.
- 86b0867: The "on this page" card on large screens is as wide as the navigation drawer.
- 5005d1f: Replace the section colour menu with a section settings sheet.
- eeb55b6: The template single draws its blocks across the column again and shows its first paragraph as a lead; the new `--type-lead-*` tokens (default: title large) let a theme style every lead.
- 46b7672: The Appstore no longer waits for ever when the store does not answer. After 15 seconds it says "Can't reach the store. Try again in 10 minutes."
- 0210960: The update message stays while an update is saved.

## 0.8.0

### Minor Changes

- b201ffd: Material is now every theme's fallback: a theme imports `@morphemecms/cms/theme/styles/global.css`, anything it does not style is Material's, and its own rules always win.
- 3c68cc9: Richer blog post page: author role, tags and share buttons in the header, a lead paragraph, and related-post cards; new Company › Social media settings.

### Patch Changes

- 0358c3e: Show a page or post form's sections as an "on this page" list on a card at the end of the form, on large screens, and keep the editor's content column centred on the window.
- 1323fa8: Wide buttons fill the width only on phones; the save bar's buttons sit at the end on larger screens.

## 0.7.1

### Patch Changes

- 36e2e3b: Fix the Cloudflare build stopping with "Too many open files" by serving all Material Symbols icons as one module.

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
