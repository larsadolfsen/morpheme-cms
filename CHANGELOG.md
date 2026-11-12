# @morphemecms/cms

## 0.16.0

### Minor Changes

- 1185af0: Assistants such as Claude can connect to the site and read its pages, posts and app settings: Settings › Assistants gives the address to add and lists the connected assistants, each with Disconnect
- cfb69ea: A connector can sign in to its service and fill a setting from the service's own list, and its Appstore page shows the address it connects to and the tools it uses before you install it
- 74c29eb: Contract 5 for apps: the `role` and `mcp` keys in app.json, roles in the store's rule, and plugin limits in the build
- 0d8f455: A connector can now connect the site to a service's MCP server and fill a setting from the service, with the sign-in kept safely on the server
- 046d306: The Appstore has three sections: Themes, Connectors and Plugins.

### Patch Changes

- 016b5d8: Assistants find the right tool: each tool says what it returns and which tool to use for the rest, and the server tells which tool answers which question
- a6ee66d: Claude can connect to the site with its published identity (the default when adding a connector)
- bffd183: Connecting an assistant no longer ends on "This sign-in can't be finished" after signing in to GitHub.
- 65cb7a8: Connecting an assistant: the consent page no longer blocks the redirect back to the assistant, and each sign-in step is logged without secrets
- a0d0ecd: Claude.ai now sees the full lists and details from the site's MCP tools, not just a short summary
- aad60e9: The "New in" card on the start screen keeps its photo inside the card on a narrow window, so it no longer covers the widgets under it

## 0.15.1

### Patch Changes

- d14a612: `check:content` no longer reports an app's own Danish texts as missing standard texts when the app translates them to English words the standard parts also use
- b4f8345: The start screen's update card also shows at the first visit in a browser, so a site that jumps over versions still shows what it updated to.

## 0.15.0

### Minor Changes

- 5812ce6: Apps can describe themselves in app.json, and their build code runs in a sandbox: an app's page shows where it runs and what went wrong in the last build
- 238db17: Add three widgets to the start screen: Unfinished, Blog rhythm (with a setting for how often a post is due) and Site status
- 5dfcf00: Edit the start screen's dashboard: add, remove, reorder and set up widgets, saved per person in the site's Worker
- bb054b2: Show the start screen as a grid of widgets, loaded from the dashboard each person keeps in the site's Worker, and let apps add widgets
- 6185aa8: The editor's own code-only names are English: the placeholders of the standard messages, three browser-storage keys, the old app store address and the "Expandable list" text's placeholder (now `{topic}`; a text saved with the old one still works). The sort and filter you last used in the page and item pickers are reset once.
- 27551e3: The consent log's download is named `consents-<date>.csv`, and an icon pack's licence page is at `licenses/icons/<id>`
  (the old editor address still opens it)
- 2bf473f: Rename the new versions of pages from /ny/ to /new/ (route `/new/`, folder `src/content/pages/new/`); the Worker sends the old address on with a 301, query string and #part kept, a page file still under `ny/` is read at its new address with a warning from `check:content`, and scripts/retarget-links.mjs rewrites a site's own links to it
- cdc850e: Move a tag's page on the blog to /blog/tags/<tag>/; the Worker sends the old address on with a 301, query string kept, and scripts/retarget-links.mjs rewrites a site's own links to it
- 6c3feca: An app's screenshot keywords are now English: `block:<type>`, `kind:<list>:<n>`, `list:<id>`, `settings` and `page`; the old words still work for one release
- 78d75f8: Make the files folder, the testimonials page address and the contact page anchor site settings with English defaults (public/files, /testimonials/, directions); a site that sets none and still has the old Danish names keeps them
- 0a83c9d: The starter is English; `npx morpheme locale da-DK` makes it Danish.
- ad36199: The site's colors are now exactly Material 3's color roles, each named as Material names it (`primary`, `on-surface`, `surface-container-high`, plus the fixed roles, `scrim` and `shadow`), and the editor's page is on Surface like the site. A site's `colors.json` in the old names is read as the new roles and written in the new names on the next save in the editor; a theme or custom CSS must use the new names (`--bg`, `--surface` as the cards, `--tint`, `--ink`, `--muted`, `--line`, `--accent*` and `--accent-hover` are gone).
- b1d832c: The theme's shared CSS variables now start with `--mo-`: the color roles (`--mo-primary`, `--mo-on-surface`, …), the corner steps and state layers (`--md-shape-medium` is `--mo-shape-medium`), and each elevation level has a color and a shadow (`--mo-elevation-2-color`, `--mo-elevation-2-shadow`, replacing `--elevation-2-surface` and `--elevation-2`). A theme or custom CSS that sets or reads the old names must use the new ones; `colors.json` keeps its keys.
- b7a12ac: A page's title, status and template are now under Page settings at the top of the form, and the page's title and its H1 stay the same as you type either one.
- c2b6345: A page-colors hook gets a new helper, `contentColors(picture, choice)`: the site's build makes the colors from one of the page's pictures (Material's content-based color), so an app's hook no longer runs the color engine in its sandbox, where a photograph took longer than the hook's 1000 ms. A sandboxed hook's `pixels` helper now reads only the page's own pictures.
- e532535: The Appstore's category filter now lists 13 categories, from Analytics to Social, and apps and themes can have a subcategory.
- d010fc7: Colors now uses Material 3's names (Primary, On surface, Surface container …) and has Material's three surfaces, Surface dim, Surface and Surface bright; new colors put the page's background on Surface bright.

### Patch Changes

- 8b0c170: Run the page colours hook and the after-build step of apps with an app.json in the build sandbox, and list what goes wrong instead of failing the build
- b135aba: Add the parts of the app sandbox: app.json checks, sandboxed app code in QuickJS, and the build's app problems for the editor
- 4611e41: Dashboards are kept in the site's existing NOT_FOUND store, so every site can save one without a new binding.
- b985413: The theme checks build into a folder inside the project, so they also work when the system temp folder is on another drive
- ed6e436: The release notes on the Morpheme page and the start screen are rewritten in plainer words, in English and Danish.
- 8bc97f9: A site's `colors.json` in the names from before Material 3's roles (`bg`, `ink`, `accent` …) is read as the new roles, on the editor's Colors screen, in the build and in the content check, and the editor writes the new names on the next save. A theme or custom CSS still has to use the new variable names.
- 12918dd: The release note for the edition photo says only what is new in this version: the photo and the place, not how the start screen card works.
- aa478c9: After an update, the start screen shows a small card with the edition's photo and name instead of the large list of news.
- 8e8c49a: Write the comments and build messages in `site/` and `lib/` in English.
- 75f6672: On a phone, the text toolbar shows a heading button and a text button side by side, a new page tells you its first heading becomes the H1, and every button that opens a menu has an arrow down.
- 1f2e59f: The new-edition card on the start screen has the shadow of Material 3's elevated card.
- b33b12d: The earlier versions 0.2 to 0.13 each have an edition with its own nature photo on the Morpheme page.
- d69e244: Three older release notes (0.10.0, 0.10.1 and 0.13.0) no longer repeat what an earlier version had already introduced.
- 44dd171: The Morpheme page shows friendly release notes in English and Danish for versions 0.2.0 to 0.13.0, instead of their developer changelog.
- 64f0cd4: Activating an app of a type that allows one active app now deactivates the other app of that type, after a warning.
- 4952516: Version 0.15 is the Passo Giau edition, with a photo of the Dolomites by Sarmat Batagov.
- 5e8ff10: Write the editor's source comments in English and pick the vague link texts by the site's language
- b6c141c: Write the theme, the Worker, the check scripts and the docs in English, with Danish by locale for what the Worker says
- 368b14f: `quickjs-emscripten` is a new required peer dependency, so a site that updates the package must run `npm install` to get it.
- 2d1326e: The Worker gets the route /api/dashboard, which keeps each person's start screen dashboard in its NOT_FOUND store.
- 416efe5: A site with `releasePosts` in its config posts each new release of the CMS on its blog, minutes after it is released: the release notes in the site's language, their screenshots and the edition's photo, in one commit by the site's Worker.
- 9be773f: The release notes for this version are shorter: overlapping lines are merged into one each.
- 5dcede5: check:themes and check:screens now also work with a pre-release (next) build of the CMS installed.
- fe128aa: A site that is still on postcss-selector-parser 6 can update to 0.15 with the Update button: the peer dependency now accepts both 6 and 7.
- ac64be2: Appearance, Developer, Licenses, Morpheme and Privacy are now under Settings, opened by the cog at the bottom of the menu
- bd67cb4: The checks the package ships (`check:themes` and the like) now run from an installed copy
- 8b7e313: The buttons under Notifications are now Clear and Settings.
- 9d3b080: The new-edition card on the start screen is now an elevated card.
- 15a1d93: A page's or post's status is a narrow menu above the title, and a page's template is chosen on cards with an icon and a name, four to a row: One column, Wide, Left side panel and Right side panel. Menus follow Material 3's vertical menu: the low surface container with large corners and a shadow, 44px items, and the chosen one in the tertiary container.
- edbfd39: `morpheme check:themes` reports a missing Update request on the Morpheme page as a normal problem line instead of crashing, and waits longer for it on a slow computer.
- 36af66d: A page's template is always chosen on cards: the side-panel ones are greyed, with a link to choose a block for the side column, while no block is chosen there.
- 01b49c2: The heading and text-style buttons in the text toolbar on a phone sit close together, like the other tools.
- 0ce669d: Updates the packages a site installs with the CMS to their latest versions, including jsdom 31, postcss-selector-parser 7 and TypeScript 7 for the starter.
- b1e7393: The Morpheme page names each version after its edition, with its date and photo, and a test version shows the changes merged since the last release.
- 8506bf6: Arrows at the bottom of the Morpheme page and each earlier version's page lead to the newer and the older version.
- 748944e: A site can keep jsdom 29 or move to jsdom 31: the optional peer dependency now accepts both.
- 93f0b45: The menu over selected text has the same heading and text buttons as the toolbar when it's short, each with an arrow that opens a menu of its kinds of text.

## 0.14.2

### Patch Changes

- fc6864a: On a phone, the editor's footer starts at the bottom of a short screen, and you can scroll it up above the add button.
- 13dbbca: Lists follow Material 3's list spec: the label text in body large (16/24, weight 400), also beside a switch, and the editor's rows on Surface over a page in Surface Container.
- 5c21889: The editor of a test version (npm tag `next`, e.g. 0.14.2-next.0) loads again: the release notes it carries no longer compare a test version, which threw and left the page blank.
- 3fbb65f: The start screen's update card shows the new version and its first news, and the Morpheme page shows the release notes as an article.

## 0.14.1

### Patch Changes

- eea5442: On a phone, the back gesture in the open menu goes to the screen before and closes the menu, instead of going up one level in the menu.
- ee45cf2: Show the release notes of the running version from the installed package, not from KV.

## 0.14.0

### Minor Changes

- a70c310: Apps can be turned off without uninstalling them; the app page shows the app's version.
- 26e7adc: The editor footer has links to support, system status, security reports, the privacy policy and the licenses, and a copyright line. System status shows whether GitHub and Cloudflare work for your site.
- 4c30155: The Morpheme page shows a friendly note for each change: why, how and what.

### Patch Changes

- da37368: The Enabled switch on an app's page sits right below the app's description.
- dd625db: Editor menu: Advanced is now Developer, with Parts and Caching and builds in it. Parts moved from Appearance; old links still work.
- 5cd4149: Editor menu: "Lists" is now "Dynamic lists", one row that opens the page with all lists (no fold-out).
- 1fe1daa: The text toolbar is no taller than its tools on a phone, and it stays as far from the top of the screen as from the sides while you scroll.
- b47a580: Google preview looks more like Google: a flat result on a phone, no card on a computer, a ringed site icon, https:// in the address, the ⋮ menu, a larger phone title, and the primary keyword in bold in the description.
- 006c78b: The connection to Morpheme moves from the store screens to the Morpheme page under Settings, with the Morpheme logo.
- a4da24e: System status checks only the Cloudflare services your site uses, so a site without R2 or D1 is not marked down by them.

## 0.13.0

### Minor Changes

- 1193da4: The standard parts and their ids are in English. Danish comes from `defaults/i18n/da-DK/`. A site that overrides a standard part by its old id must use the new id. Old editor links and bookmarks still open (they redirect to the new address). The filters and sorts that the editor saved in the browser reset once.
- 10276ee: The header's "Call to action" can show the phone number (from Business › Contact; it calls on a phone and leads to the contact page on larger screens) as a text button before its button, and both share a row at the bottom of the menu; the menu opens from the side its button is on, and no drawer (site or editor) shows a gap at the screen's edge when its spring overshoots. In the editor, the back gesture goes from a section's list to the main menu, Header and Footer are under Appearance, and Business is a section of its own after Blocks and Apps.
- 9ddc437: A list item can be selected with a long press on a phone (`selectable` on the theme's `ListItem`); in the editor's notifications this selects notifications to delete.
- 32b4395: The bell in the editor's top bar opens the notifications in a side sheet over the screen you are on, instead of a screen of their own.
- 774ab69: Social media profiles are a list of links added with the + button; a link to Facebook, X, LinkedIn or Pinterest gets its name and icon from the address, and the share buttons are under their own heading.
- 82d64b7: The start screen has a "Continue where you left off" card with the last three pages and blog posts saved, a notice of what was updated since your last visit (each with a close button), and the licenses link sits in a footer at the bottom of every screen.
- 03ad8a9: Move the theme store from the Appstore to its own screen, Theme store, first under Appearance.

### Patch Changes

- ccefd29: The licence checks know `@app/self` (app contract 3): an app that imports it no longer needs it in `thirdParty`, and
  the site's licence list counts its virtual module as the site's own.
- e9d6b34: The editor's notifications also show when the website updated Morpheme from npm, undid an update or got stuck.
- a283bcc: The drawer's divider stands level with the top bar's line.
- 6fa3043: The store no longer moves old store copies; all sites use permanent ids.
- 9c24224: The text editor's empty-line hint says "Write text here…" again, on a line no taller than the hint.
- 697a7dc: List items follow Material 3's focus layer, corners and hover colours.
- 8fd74d0: Editor menu: Header and Footer come right after Themes under Appearance, and Logo and icon is under Business.
- 3a6157b: New sites get a `.gitattributes` that keeps LF line endings on Windows.
- 3961b6d: The text toolbar no longer scrolls sideways on a phone: the tools that do not fit are on a second row, shown with the arrow at its end.
- 34f69c5: Open website, in the editor's top bar, opens the site in a new window instead of a new tab.

## 0.12.0

### Minor Changes

- 382abd8: An H1 starts a section with its own section colour, as an H2 does.
- 3123242: Store items have permanent ids: installed copies move to their new folder on their next update. Apps get their own id from @app/self (app contract 3).

### Patch Changes

- fd2fedf: From tablet width, tapping a block or picture opens its side panel; Remove is in the panel.
- 1459102: The side panel opens from 840px and collapses the drawer to the rail below 1200px; the modal side sheet is used below 840px; the top bar scrolls with the page.
- 79b6b33: The text toolbar and the menus over the text are white with a shadow.
- 25d29f7: The create button of every list, of Files and of Redirects is a floating action button instead of a + in the top bar; a list of several kinds opens a menu of them. The FAB stands above a form's save bar.
- d39abb5: The side panel follows Material 3: at most 400dp wide, full height, M3 spacing.
- ee4fbba: Preview and View on site stand at the end of the page's title row on wide screens.
- aa964b2: The package's checks now type-check its whole source the way a site does, so type errors a site would hit are caught before release.
- ca51ab8: Fix the store's installed filter for apps with an old id.
- 6b95110: Fix type errors that sites hit in the text editor.
- abef25a: Sites type-check the video block: the types of `player` and `facadeOf` make `frame` optional, as the block calls them.

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
