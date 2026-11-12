# English ids and routes: design

> **Status:** agreed by the owner on 10 November 2026 (all recommendations of the open questions), written against `main`
> at `253fdfa`. Batch B (the language check) is built; the other batches are open. Its leftover findings are the entries of
> `scripts/pending-ids.mjs`, grouped by the rows and batches below.

## Goal

`AGENTS.md` section 5 says English (`en-US`) is the source language for ids, routes, schemas, fields and code. The
English-source project (`2026-11-04-english-source-design.md`) converted texts, comments and messages, and renamed the
editor's routes and part ids (batch 2, Task 2.4; `src/movedRoutes.mjs` keeps the old ones working). This spec finds the
Danish ids that are left, says what each rename breaks, and designs the renames.

## What the language check sees

`scripts/check-language.mjs` flags a line with æ, ø or å, and a quoted string equal to a Danish value of
`src/i18n/da-DK/` or `defaults/i18n/da-DK/`. A Danish id such as `blok:` or `valg-` has neither, so it passes. A line
may carry `language-ok` (`lib/danish.mjs`); the check skips it. Two places already use that marker for ids that stay
Danish on purpose (`src/store.ts:98` and `:105`), and `scripts/app-screenshots.mjs:67` writes `blok` as an escape
to get past the check, which shows the check is being worked around, not satisfied.

## Method

- Every tracked file outside `docs/`, `icons/`, `release-notes/` and the language folders was searched on 10 November
  2026 for: the Danish ids of `src/movedRoutes.mjs` and the term table; every quoted token, `#route`, `data-` attribute,
  class name and CSS selector whose words occur in the `da-DK` language files and not in `en-US`; every tracked path
  segment; `{placeholder}` names; `localStorage` and `sessionStorage` keys; Worker routes and KV keys; the keys of
  `starter/src/data/*.json`, `demo/src/data/*.json` and the Markdown front matter schema (`site/content.config.ts`).
- Every row below was then read at its line. The automatic part is noisy (about 8 real finds against about 30 English
  words missing from the `en-US` files, such as `linear`, `tone`, `bullet`), so the list that the check needs later is
  curated, not derived (see "The language check").
- Not read: the sites' own repositories (Sara's, the CMS's own site, `morpheme-staging`) and `morpheme-apps`. The rows
  that touch them say what to look for there.

## Inventory

Class: **a** code-only id; **b** editor route or address a person may have bookmarked; **c** a name stored in a site's
own content or data; **d** a public URL on a visitor-facing site; **e** something an app or a theme in the store reads.
A row has a primary class and, where a rename reaches further, the others.

### Renames

| #   | Danish name                                                                                  | Where                                                                                                                                                                                                                                                                                                                                                                               | Class               | Proposed English name                                              |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------ |
| 1   | `siteText` placeholders `{navn}` `{side}` `{antal}` `{adresse}` `{hvad}` `{blok}`            | `defaults/rules.ts:109,187,217,240,265,295,312,320,329,337,348-349,377,393-394,454-460`; the same keys in `defaults/i18n/da-DK/rules.ts:10-56`                                                                                                                                                                                                                                       | a                   | `{name}` `{page}` `{count}` `{address}` `{what}` `{block}`         |
| 2   | `valg-` prefix of three browser-storage keys (`editor-sort-valg-<list>`, `valg-<list>-status`, `valg-<list>-menu`) | `src/ui.tsx:1142,1151,1152`                                                                                                                                                                                                                                                                                                                                                         | a (browser only)    | `editor-sort-pick-…`, `pick-…-status`, `pick-…-menu`                |
| 3   | stored view value `'liste'` (`View = 'liste' \| 'menu'`)                                     | `src/Library.tsx:1007,1021,1023,1454`                                                                                                                                                                                                                                                                                                                                               | a (browser only)    | `'list'`                                                           |
| 4   | CSV file name `samtykker-<date>.csv`                                                         | `worker/consent.js:129`                                                                                                                                                                                                                                                                                                                                                             | a                   | `consents-<date>.csv`                                              |
| 5   | sample address `navn@` in the form block's preview                                           | `src/BlockParts.tsx:308,328`                                                                                                                                                                                                                                                                                                                                                        | a                   | `name@`                                                            |
| 6   | Danish page names in tests and comments: `priser`, `kontakt`, `om`, `forside`, `Hold`        | `lib/menu.test.mjs:10,31,43,44,133`; `src/headerPreview.test.mjs:62-138`; `site/header.test.mjs:41`; `src/autoTags.test.mjs:9` (`/filer/`); `site/schema.ts:21`; `src/App.tsx:4`; `src/Library.tsx:983`; `src/LinkSheet.tsx:50`; `src/PagePicker.tsx:4`; `theme/layouts/PageLayout.astro:47`; `defaults/standard.ts:54`; `worker/say.test.mjs:55-57` (deliberate: a Danish page name for the Danish-message test) | a                   | `prices`, `contact`, `about`, `home` (or marked `language-ok`)      |
| 7   | stale ids in `docs/store-ids.md`: `REFUSED_APPS = ['butik', 'udvikler']`, `tema/<id>`, `udseende/temaer/<id>` | `docs/store-ids.md:28,35,44` (the code no longer has them: `lib/storeEntries.mjs` has no `REFUSED_APPS`, and the tests at `lib/storeEntries.test.mjs:80,82` refuse any id that is not `app_<hex>`)                                                                                                                                                                                   | a (documentation)   | rewrite the rows to the English ids                                |
| 8   | the old store route `apps/butik` and `apps/butik/temaer`, kept in code as `STORE_BEFORE` and `STORE_MOVED` | `src/store.ts:197-201`; `src/App.tsx:283-286`                                                                                                                                                                                                                                                                                                                                       | b                   | move both into `RENAMED` in `src/movedRoutes.mjs` (targets `settings/appstore`, `appearance/theme-store`); delete `STORE_BEFORE`/`STORE_MOVED` |
| 9   | licence work id `ikoner/<pack id>`, also the editor address `#licenses/ikoner/<pack id>`     | `lib/licenses.mjs:171-172,186`; `src/licenseData.ts:26`; the route is `licenses/<id>` (`src/Licenses.tsx:109`, `src/App.tsx:803`)                                                                                                                                                                                                                                                                  | b (a: generated each build) | `icons/<pack id>`; old address via `'licenses/ikoner': 'licenses/icons'` in `RENAMED` |
| 10  | `{emne}` in the shared text of "Expandable list" (default "Read more about {emne}", field hint "{emne} is the heading of the row") | `src/i18n/en-US/blocks.ts:138-139`; `src/standard/accordion/view.ts:20,22`; `src/standard/accordion/shared.ts:1`; `src/standard/accordion/index.tsx:2`. The saved text lives in the site's `src/data/blocks.json` once an owner has edited it | c                   | `{topic}`                                                          |
| 11  | the Files folder `public/filer` and its address `/filer/<name>`                              | `site/defineSite.mjs:65,71-73,108` (`folders.files`, `reserved`); `src/Media.tsx:2,3,59`; `src/images.ts:6,116`; comments `defaults/collections.ts:654`, `defaults/rules.ts:116`, `site/popups.ts:35`                                                                                                                                                                               | c, d                | `public/files`, `/files/<name>`                                    |
| 12  | the tag page `/blog/kategori/<slug>/`                                                        | `pages/blog/kategori/[category].astro` (the folder name); `astro.mjs:36`; `site/home.ts:44`; `site/popups.ts:91,94`; `site/seo.ts:15`; `defaults/standard.ts:85,90`; `defaults/rules.ts:457`; `src/Colors.tsx:426`; `src/DataForm.tsx:237,242`; `theme/components/BlogIndex.astro:36`; `theme/layouts/PostLayout.astro:86`; `theme/templates/Category.astro:2`; comments `site/categories.ts:2`, `site/content.ts:75` | d, c (links in content) | `/blog/tags/<slug>/`                                               |
| 13  | the new-version pages `/ny/<address>`, their overview `/ny/`, and the content folder `src/content/pages/ny/` | `site/noindex.mjs:11,13-15,21` (`PREVIEW`); `pages/ny.astro`; `astro.mjs:37`; `site/defineSite.mjs:108`; `lib/reads.mjs:3,21-22`; `defaults/rules.ts:69,71`; `defaults/standard.ts:47,52`; `defaults/collections.ts:451`; `site/content.config.ts:82-83`; `src/Keywords.tsx:68`; `src/pagePreview.tsx:200,242`; `src/partPreview.tsx:48,51`; `theme/layouts/PageLayout.astro:79-81,156-157`; `theme/templates/New.astro`; `README.md:44`; fixtures `lib/fixtures/reads-site/src/content/pages/ny/about.md`, `lib/reads.test.mjs:43-49` | c, d                | `/new/<address>`, `/new/`, `src/content/pages/new/`                |
| 14  | the testimonials page address `/udtalelser/`, written in code                                | `site/testimonials.ts:48` (`testimonialsPath`), read at `defaults/standard.ts:83`                                                                                                                                                                                                                                                                                                   | c, d                | a site setting `testimonialsPath`, default `/testimonials/`        |
| 15  | the contact page anchor `#find-vej`, written in code                                         | `theme/components/Footer.astro:20`; mentioned at `src/Library.tsx:983`, `src/LinkSheet.tsx:50`, `src/PagePicker.tsx:4`                                                                                                                                                                                                                                                              | c, d                | a site setting `contactAnchor`, default `directions`               |
| 16  | the privacy-policy file written in code: `edit: { to: 'src/content/pages/privatlivspolitik.md' }` | `defaults/privacy.ts:35`                                                                                                                                                                                                                                                                                                                                                            | c                   | derive from `standardPages.privacy` (the page address), no file name in code |
| 17  | the screenshot keywords of an app: `blok:<type>`, `slags:<list>:<n>`, `liste:<id>`, `indstillinger`, `side`; they also name the picture files (`<n>-blok-<type>.jpg`) | `src/store.ts:77-79,98-105,111` (`shotOf`, `shotFile`); `scripts/app-screenshots.mjs:67-75`; the message that names them, `src/i18n/en-US/apps.ts:47` (and its `da-DK` twin); the apps' own `screenshots` lists live in `morpheme-apps`                                                                                                                                              | e                   | `block:<type>`, `kind:<list>:<n>`, `list:<id>`, `settings`, `page` |
| 18  | the starter's content: files `forside.md`, `kontakt.md`, `privatlivspolitik.md`, `siden-findes-ikke.md`; addresses `/forside/`, `/blogside/`, `/kontakt/`, `/privatlivspolitik/`, `/siden-findes-ikke/` in `standard-pages.json` and `footer.json` | `starter/src/content/pages/*.md`; `starter/src/data/standard-pages.json:2-7`; `starter/src/data/footer.json:8,12`; `starter/README.md`                                                                                                                                                                                                                                              | c (new sites only)  | `home.md`, `contact.md`, `privacy-policy.md`, `not-found.md`, `/blog/` page `blog.md` (batch 6 of the English-source plan) |

### Danish by design (not renamed)

| Name                                                                                             | Where                                                                                    | Why it stays                                                                                          |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 22 keys of `MOVED` and 52 of `RENAMED`: the old editor addresses (`udseende`, `indstillinger/appstore`, `apps/*/om` …) | `src/movedRoutes.mjs:5-125`, `src/movedRoutes.test.mjs` (156 lines)                      | They are the mechanism: the old address is the key. Keep, allow-listed in the language check.         |
| the Danish texts                                                                                 | `src/i18n/da-DK/`, `defaults/i18n/da-DK/`, `worker/i18n/da-DK.js`                         | The language files.                                                                                   |
| a Danish site's own page names and addresses (`/kontakt/`, `/om/`, `/ydelser/…`)                  | in sites, and as examples                                                                | Site data, not code.                                                                                  |

### Checked and clean (so nobody searches again)

The editor routes and part ids in `defaults/*.ts`, `src/App.tsx`, `lib/menu.mjs`, `lib/appRoute.mjs` (`about`,
`settings`), `src/site.ts`; the Worker's routes, KV keys, cookies and D1 tables (`worker/index.js`, `push.js`,
`not-found.js`, `consent.js`, `cms-update.js`); every `localStorage` and `sessionStorage` key other than row 2 and 3;
class names, CSS custom properties and `data-` attributes in `theme/`, `src/editor.css` and `pages/`; the front matter
keys (`site/content.config.ts`); the keys of `starter/src/data/*.json` and `demo/src/data/*.json`; folder names
(`src/content/blog`, `src/content/pages`, `src/data/categories`, `src/data/testimonials`, `public/images/uploads`,
`src/apps`, `src/themes`); `package.json`, `wrangler.jsonc` and `bin/morpheme.mjs`; the demo (all English). `booking`,
`bookingbar`, `side`, `categories` and `Category` are English words and stay. The folder `src/data/categories` and the
front matter key `categories` name what the editor calls "Tags"; that is an English mismatch, not a Danish id, and is
left alone (open question 9).

### Danish text without æ, ø or å (a gap in the check, not an id)

About 95 string literals in `scripts/check-cms-update.mjs` (36), `check-consent.mjs` (23), `check-store-connection.mjs`
(17), `check-store.mjs` (12), `check-themes.mjs` (2) and `check-demo.mjs`, `editor-screens.mjs` (1 each), and
`lib/cspSources.mjs:40`, `lib/csp.mjs:125` are Danish sentences with none of the three letters. They are texts, so they
belong to the English-source project, but the same word-list check below would find them.

### Count by class

| Class               | Rows (primary class)  | Rows that also have it |
| ------------------- | --------------------- | ---------------------- |
| a code-only         | 7 (1-7)               | -                      |
| b editor route      | 2 (8, 9)              | -                      |
| c site data         | 7 (10, 11, 13-16, 18) | 1 (12)                 |
| d public URL        | 1 (12)                | 4 (11, 13, 14, 15)     |
| e store, app, theme | 1 (17)                | -                      |

The 18 rows are 18 renames (each row in exactly one primary class). The 74 legacy keys of `movedRoutes.mjs` stay.
Rows 14 and 15 are Danish defaults written in code for something a site's own content defines. Rows 11, 12 and 13 are
the three renames that reach live sites.

## Design

One rule runs through all classes: **a live site must keep working without anyone editing it by hand before the update
reaches it, and a rename must never make a build stop that was fine before.** Nothing here is built as a general
migration framework: `git grep -i migrat` finds no migration mechanism in the repository (only D1 table creation in
`worker/consent.js:24`), and the sites number a handful.

### Class a: code-only ids

Rename with all callers and tests in one pull request.

- Row 1: the English sentence is the key of `siteText`, so renaming a placeholder changes the key. Change
  `defaults/rules.ts` and `defaults/i18n/da-DK/rules.ts` together. `check:content` already fails on a standard text with
  no Danish, so a missed key fails the build. Add a test that each `{name}` in a `defaults/i18n/da-DK/` key also occurs
  in its value (so a half rename cannot slip past as two unmatched placeholders).
- Rows 2 and 3: browser storage. Renaming loses a saved sort or filter once and nothing else. Row 3 needs no care: the
  reader (`src/Library.tsx:1021`) treats anything but `'menu'` as the list view, so a stored `'liste'` reads as the
  default.
- Rows 4-7: plain renames. For row 6, write English example names in new tests; a fixture that must model a Danish
  site's page (`worker/say.test.mjs:55-57`) keeps its Danish and carries `language-ok`.
- Order: row 1 alone (it touches the language dictionary), then the rest together.

### Class b: editor routes

Reuse `src/movedRoutes.mjs`. Rows 8 and 9 become `RENAMED` entries, each with a line in the table test in
`src/movedRoutes.test.mjs`:

```
'apps/butik': 'settings/appstore',
'apps/butik/temaer': 'appearance/theme-store',   // the longest key wins, so this beats the line above
'licenses/ikoner': 'licenses/icons',
```

Then `STORE_MOVED` in `src/App.tsx:283-286` and `STORE_BEFORE` in `src/store.ts:197-201` are deleted, and `routeOf` calls
`movedRoute(screenOf(hash))` with no second argument (the `more` parameter stays for the tests). After this, every Danish
editor address in the code lives in `movedRoutes.mjs` and nowhere else. The key `apps/butik` cannot clash with an app,
because a store app's id is `app_<hex>` (`validApp`, `lib/storeEntries.mjs`); only a site's own app folder named `butik`
could clash, which the prefix match would then send to the store, and no such app exists in this repository.

A moved editor route redirects in the browser only (`history.replaceState`), costs a few bytes and no request, so it
keeps redirecting for as long as the file exists (open question 7). Row 9's id is generated at build time, so no stored
data changes.

### Class d: public URLs

The Worker runs first on every site (`run_worker_first: true` in `starter/wrangler.jsonc`) and already redirects
(`redirectFor` and `onward` in `worker/index.js:102-123`: the editor's `src/data/redirects.json`, the site's
`old-addresses.json` and `public/_redirects`, followed to one hop). Those are site data, which the package cannot write
into. The package needs a table of its own, shipped with each CMS version:

- New `worker/movedAddresses.js` (pure): `MOVED_PREFIXES = [['/blog/kategori/', '/blog/tags/'], ['/ny/', '/new/']]` and
  `movedAddress(path)`, which returns the new address for a path that starts with an old prefix and keeps the rest.
- `redirectFor` asks it after the exact maps, and `onward` applies it to the end of a chain too, so an old
  `redirects.json` target such as `/blog/kategori/x/` is also sent to `/blog/tags/x/` in one hop. 301, query string and
  `#part` kept, a loop impossible (the targets start with no old prefix). The `withSlash` path (`/blog/kategori/x`
  without the slash) already goes through `redirectFor`.
- Tests: the cases of `worker/index.js` that exist for `onward` and `redirectFor`, plus the table: prefix, nested slug,
  a chain, no match, `?` and `#`.
- The sitemap and the canonical links come from the page routes (`astro.mjs`, `pages/`), so they change with the
  rename; the 301 tells search engines.

A public redirect keeps working forever: one table line, and a visitor or a search engine may arrive from an old link
at any time (open question 7).

Rows 12 and 13 also change stored text: a page or the menu can link to `/blog/kategori/x/` or `/ny/…`. `retarget()` in
`src/addresses.ts:72` already rewrites links to a changed address in Markdown, HTML and block JSON. A one-off script
in the site's repository can use it (below); until it runs, the Worker redirect makes every old link work, one hop
longer.

### Class c: names stored in a site's own data

There are three situations, and each has its own tool. In all three a half-migrated site keeps working.

1. **A value inside a file the editor writes (row 10, `{emne}`).** Read both, write one.
   `src/standard/accordion/view.ts:22` calls `fill(link, { topic: x, emne: x })`, so a stored text with either
   placeholder renders. The default text and the field hint say `{topic}`. When the editor opens the shared-text form,
   `{emne}` in a loaded value is shown as `{topic}`; the next save writes `{topic}`. It is idempotent (an exact
   placeholder replace) and the half-migrated state is a site that still stores `{emne}` and renders correctly. No check
   is needed. Drop the alias at 1.0, not before.
2. **A folder or an address the code assumes (rows 11, 14, 15; row 13 for its folder).** Do not move content. Make the
   name a site setting with an English default, and have each existing Danish site pin its old value in its own
   `src/site/config.ts`:
   - `folders.files` moves from `STANDARD` to the part of `defineSite` a site can set (as `booking` and `aboutPath`
     are), default `public/files`; `reserved` is built from it and also keeps `/filer/` and `/files/`.
   - `testimonialsPath` and `contactAnchor` become settings with the English defaults.
   - New rules in `check:content` (same machinery as `casingProblems`): a folder `public/filer` exists but is not the
     files folder: stop with "set `folders: { files: 'public/filer' }` in `src/site/config.ts` or move the folder"; and,
     where the testimonials block is on a page, the `testimonialsPath` page must exist. A stop does no harm: "the site
     that is out stays as it is" (`scripts/check-content.mjs`), and the owner has a handful of sites, each updated by a
     person.
   - Why not move `public/filer`? It moves binary files through GitHub commits, rewrites every `/filer/…` link in
     content, breaks links from other sites and search results, and gains no visitor anything. The pin costs one line.
3. **Pages whose address is the namespace (row 13).** Pages under `/ny/` are a working copy that the owner compares with
   the live page and then replaces (`site/content.config.ts:82-83`), so a site has few or none at a time. Rename the
   route and the content folder without a compatibility layer. `check:content` gets a problem for a page file under
   `src/content/pages/ny/` ("move it to `new/`"); the Worker redirects `/ny/…` to `/new/…`. Before the release, read each
   live site's `src/content/pages/ny/` through GitHub; if one is not empty, finish or move its pages first.
4. **A pointer from code to a site's file (row 16).** `defaults/privacy.ts:35` points at
   `src/content/pages/privatlivspolitik.md`, which exists only in a Danish starter copy. It is already wrong for the demo
   (`privacy-policy.md`) and will be wrong for the English starter. Resolve the file from the address in
   `standardPages.privacy` (the way `standardPageAt` in `src/site.ts:218` finds a page), with no file name in code.
5. **A site's links to a renamed public address (rows 12, 13).** A one-off `scripts/` helper, run by an agent per site
   and committed as a normal change: `retarget()` over `src/content/**`, `src/data/**`. Idempotent (a second run finds
   nothing to replace), and optional because of the Worker redirect. Not a command in `bin/morpheme.mjs`.

Why not a general `morpheme migrate` run on every build or save? The build cannot commit (the editor's saves are GitHub
commits, Cloudflare builds read them), so a build-time migration changes nothing that stays. An editor-side migration
fits a value in a file the editor already writes (situation 1) and nothing else. For the rest, a pin or a redirect costs
less than a framework.

### Class e: what an app or a theme reads

The owner says no external users read the app and theme contracts and they are fixed within 0.15, so no compatibility
work is needed, but the contract changes are named:

- Row 17 is the only one. `AppShot.shows` (`src/store.ts:77`) is written in each app's `index.ts` (in
  `morpheme-apps`) and names the picture files in the store catalog. Rename in `shotOf`, `shotFile`,
  `scripts/app-screenshots.mjs` and the message, and update `docs/app-contract.md`. Let `shotOf` accept the old and the
  new keyword for one release so that `morpheme-apps` can change in its own pull request without a lockstep deploy;
  remove the old words after it has. Picture files are regenerated when an app is published.
- Row 9's licence id `ikoner/…` reaches `dist/editor/licenses.json`, which the editor reads; both ends are in this
  repository.
- `defaults/*.ts` standard parts a site overrides by id (the earlier spec's "breaking for sites that override") were
  renamed in batch 2; no further id changes here.

## The language check

Add a curated list of Danish id words and check it on three things: the words of a quoted string split at `/ - _ : { }`,
a `{placeholder}` name, and every tracked path segment.

- `lib/danishIds.mjs` (new, pure): `DANISH_IDS`, seeded from the keys of `MOVED` and `RENAMED`, the rows above and the
  Danish words of the term table that are never English: `udseende indstillinger maaling promovering kategori kategorier
  mobilmenu virksomheden blokke filer privatliv lister videresendelser blokvalg avanceret licenser temaer farver ikonpakker
  bevaegelse sidekolonne vaerdier standardsider udtalelser samtykker betaling vurdering udvikler butik konto notifikationer
  slettet forside kontakt privatlivspolitik ikoner emne navn antal adresse hvad valg blok slags indstillinger liste`.
  Left out because they are English too, or too short to match safely: `side`, `ny`, `om`, `dele`. Whole tokens only.
- `lib/danish.mjs` gets `findDanishIds(text)`; `scripts/check-language.mjs` runs it and a path check, skips
  `src/movedRoutes.mjs`, its test and `lib/danishIds.mjs`, and keeps honouring `language-ok`.
- Each batch below removes its rows from a `PENDING_IDS` list of `file:token`, the same way the batches of the
  English-source plan removed `PENDING` paths. When the list is empty it is deleted.
- Danish text without the three letters: add a second, weaker rule for quoted strings in `scripts/`, `lib/`, `worker/`
  with two or more of `ikke uden blev ingen fejl findes mangler`. It finds the 95 literals above and costs a few lines.

Is it worth it? Yes. This work exists because the check could not see the ids; a 60-word list and an hour make the next
Danish id fail in the pull request that adds it, and the list grows when a new word is found. A full Danish dictionary is
not worth it: the automatic attempt in this research found 8 real ids and about 30 English false positives.

## Batches

Each batch is one session and one pull request, `minor` in the changeset while `main` is `0.14.x` (the owner's rule: 0.15
only, never `major`), with an owner-facing release note where a site sees the change (batches C, D, E). Each passes
`npm run check`, `check:screens`, `check:demo` and `check:starter`.

| Batch | Contents                                                                                                                                 | Files                                                                                                                                                                                                                                                                                | Runs with / needs                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **B** | The language check: `lib/danishIds.mjs`, `findDanishIds`, the path check, the stop-word rule, `PENDING_IDS` with every row below. | `lib/danishIds.mjs`, `lib/danish.mjs`, `lib/danish.test.mjs`, `scripts/check-language.mjs`                                                                                                                                                                                              | first; no conflict (new files and a script)                                       |
| **A1** | Rows 1-3, 5-8 and 10: placeholders, storage keys, view value, `navn@`, test names, `apps/butik` into `movedRoutes`, `{emne}` alias. | `defaults/rules.ts`, `defaults/i18n/da-DK/rules.ts`, `src/ui.tsx`, `src/Library.tsx`, `src/BlockParts.tsx`, `src/App.tsx`, `src/store.ts`, `src/movedRoutes.mjs` and test, `src/standard/accordion/*`, `src/i18n/en-US/blocks.ts`, `src/i18n/da-DK/blocks.ts`, tests listed in row 6, `docs/store-ids.md` | after B; **waits for** the dashboard-widgets batch 2 (`src/`) and `claude/one-app-types` (`src/store.ts`, `src/AppList.tsx`) |
| **A2** | Rows 4 and 9: CSV name, `ikoner/` → `icons/` and its route.                                                                              | `worker/consent.js`, `lib/licenses.mjs`, `src/licenseData.ts`, `src/movedRoutes.mjs` and test                                                                                                                                                                                       | **waits for** the app sandbox (`lib/`, `worker/`)                                  |
| **D** | Site settings with English defaults and `check:content` rules: rows 11 (setting only), 14, 15, 16. Also the follow-up lines for each live site. | `site/defineSite.mjs`, `site/testimonials.ts`, `defaults/standard.ts`, `defaults/privacy.ts`, `theme/components/Footer.astro`, `src/Media.tsx`, `src/images.ts`, `scripts/check-content.mjs` and `src/checkSite.ts`                                                                         | with A1 (different files); touches `src/` lightly, so after dashboard batch 2      |
| **C** | The Worker's moved-address table, then row 12 (`/blog/tags/`).                                                                            | `worker/movedAddresses.js`, `worker/index.js`, a worker test; then `pages/blog/…`, `astro.mjs`, `site/home.ts`, `site/popups.ts`, `site/seo.ts`, `defaults/standard.ts`, `defaults/rules.ts`, `src/Colors.tsx`, `src/DataForm.tsx`, `theme/components/BlogIndex.astro`, `theme/layouts/PostLayout.astro`, `theme/templates/Category.astro` | the Worker part **waits for** the app sandbox (`worker/`); the rename after it     |
| **E** | Row 13 (`/new/`): route, folder, constant, check:content problem, redirect line in the table.                                           | `site/noindex.mjs`, `pages/ny.astro` → `pages/new.astro`, `astro.mjs`, `site/defineSite.mjs`, `lib/reads.mjs` and test, `lib/fixtures/reads-site/…`, `defaults/rules.ts`, `defaults/standard.ts`, `site/content.config.ts`, `src/Keywords.tsx`, `src/pagePreview.tsx`, `src/partPreview.tsx`, `theme/layouts/PageLayout.astro`, `theme/templates/New.astro` | after C (needs the table); `lib/` and `src/`, so after the app sandbox and dashboard batch 2 |
| **F** | Row 17: screenshot keywords, old and new accepted for one release; `docs/app-contract.md`; a follow-up for `morpheme-apps`.              | `src/store.ts`, `scripts/app-screenshots.mjs`, `src/i18n/en-US/apps.ts`, `src/i18n/da-DK/apps.ts`, `docs/app-contract.md`                                                                                                                                                         | after `claude/one-app-types` merges; independent of the rest                       |
| **G** | Row 18: the starter. Already owned by the branch `claude/english-source-batch-6` (it deletes `forside.md` and the others). Nothing to start here; check that it also covers `starter/README.md`, `footer.json`, `standard-pages.json` and that row 16 is fixed by D, not duplicated. | -                                                                                                                                                                                                                                                                                    | the owner's existing batch 6                                                       |

At the same time: B alone first; then A1, D and F in parallel (disjoint files, apart from `src/store.ts` in A1 and F,
which therefore run one after the other); A2 and C's Worker part together in the session that follows the app sandbox;
E last. G is not mine.

### Conflicts with work in flight

- **Dashboard widgets, batch 2 (`src/`):** A1, D, E touch `src/` files. `src/App.tsx` and `src/ui.tsx` are the likely
  overlaps (the start screen is in `App.tsx`). They wait, and each starts from a fresh `origin/main`.
- **App sandbox (`lib/`, `worker/`):** A2 (`lib/licenses.mjs`, `worker/consent.js`), C (`worker/index.js`) and E
  (`lib/reads.mjs`) wait. `lib/reads.mjs` is the sandbox's own read scope (`AGENTS.md` section 2), so E needs its
  merge in any case.
- **`claude/one-app-types`** changes `src/store.ts` and `src/AppList.tsx`: A1 (the `STORE_BEFORE` lines) and F wait for it.
- **`claude/english-source-batch-6`** changes `src/i18n/en-US/*`, `starter/`, `astro.mjs`: A1 edits `src/i18n/*/blocks.ts`,
  and C/E edit `astro.mjs`; whichever merges second merges `main` into its branch (never a rebase).
- **`PENDING`** (`astro.mjs`, `demo/`, `src/i18n/`, `starter/`) hides those paths from the language check; `PENDING_IDS`
  must list ids found there as well, and the English-source batch 6 deletes `PENDING` only when it is done.

### Pre-release checklist for the owner's sites (the project manager, read-only through GitHub)

In Sara's site, the CMS's own site and `morpheme-staging`: `git grep` for `/blog/kategori/`, `public/filer` and a
`folders` entry in `src/site/config.ts`, `src/content/pages/ny/`, `{emne}` in `src/data/blocks.json`, `find-vej`,
`/udtalelser/`, and a link to the cookie banner's privacy page. Each hit says which pin or which helper that site needs.
Every pin is one added line in the site's own `src/site/config.ts`, in a pull request in that repository.

## Open questions for the owner

1. **Leave `public/filer` and `/filer/` Danish on live sites?** Recommendation: yes. The CMS default becomes
   `public/files`; each live site pins `folders: { files: 'public/filer' }`; no files move. A new English site gets
   `/files/`. Alternative: move the files and rewrite every link to them (class c and d together): large, binary, and no
   visitor gains anything.
2. **The slug for `/ny/`.** Recommendation: `/new/` (the editor's route `new/<list>` and the label "New version" use the
   word). `/preview/` reads well but collides with the editor's "preview" notion (`x-editor-preview`, `previews: false`).
   And: rename without a compatibility layer, since a site has few or no pages there at a time, after the checklist
   above shows none is open?
3. **The slug for `/blog/kategori/`.** Recommendation: `/blog/tags/`, because the editor says "Tags" and the list id is
   `tags`. Alternative `/blog/category/`: nearer the folder and front matter key `categories`. Either way, a Worker 301
   for the old one.
4. **Which entries stay Danish on purpose?** Recommendation: only the legacy keys of `movedRoutes.mjs`, the `da-DK`
   language files, a Danish site's own page names, and the one Danish page name in `worker/say.test.mjs`. Everything
   else in this inventory becomes English.
5. **`testimonialsPath` and `contactAnchor` (rows 14 and 15):** code assumes a Danish site's page address and anchor.
   Recommendation: site settings with English defaults, existing Danish sites pin the old values. Alternative: leave
   them in code as site data (the earlier spec's choice); then an English site has a footer link to `#find-vej` that
   goes nowhere.
6. **Migrate site data, or read the old names?** Recommendation: neither a migration command nor permanent fallbacks.
   A value inside a file the editor writes (`{emne}`) is read both ways and written new; a folder or an address a site
   owns is pinned in its config; a renamed public address is redirected by the Worker; browser storage and generated
   ids are renamed and lost once. A one-off helper rewrites links on request.
7. **How long does a moved address redirect?** Recommendation: editor routes forever (a string in a table; no request)
   and public addresses forever (one table line, and search engines and other sites keep old links for years). Revisit
   both at 1.0, and delete nothing without the owner's yes.
8. **The language check:** build `lib/danishIds.mjs` and the weaker stop-word rule (batch B)? Recommendation: yes.
9. **Not Danish, but inconsistent:** the folder `src/data/categories` and the front matter key `categories` against the
   editor's "Tags". Recommendation: leave; renaming them is a site-data migration for no Danish word.
10. **Release notes and the changeset level:** batches C, D and E change a visible address or a site's config. They are
    `minor` in 0.15.0 with an owner-facing note in both languages that names the pins, as the owner decided no `major`.
    Agreed?
