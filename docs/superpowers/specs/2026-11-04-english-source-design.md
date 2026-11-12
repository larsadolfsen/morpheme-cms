# English source, Danish only in language files: design

> **Status:** design, agreed with the owner on 4 November 2026. **Paused:** no batch starts before the CMS move is
> done (step 4 of `docs/repositories.md` in `morpheme-website`: `packages/editor/` moves here and the copy there is
> removed). Until then the CMS changes in two places, and this work would conflict with every sync.

## Goal

Every file in `morpheme-cms` is written in English: code, comments, ids, URLs, labels, hints, messages, scripts, the
Worker and the starter content. Danish exists only in i18n language files. A check enforces this rule.

## Scope

- **In:** the `morpheme-cms` repo.
- **Out (own projects later, with the same rule and check):** `morpheme-apps`, `morpheme-website`,
  `morpheme-appstore`, and the sites (for example Sara's `src/site/`).
- **Out:** a site's own content and its own `src/site/` texts, which stay in the site's language.

## Today

- The package's standard parts (`defaults/`, `site/`) are written in Danish. `DEFAULTS_LOCALE = 'da-DK'` in
  `src/i18n/index.ts`.
- `defaults/texts.ts` maps the Danish text to English (`texts['en-US']`, about 440 entries).
- `siteText(text)` shows a text in the editor's language: its translation, else the text as written.
- The editor's own UI texts are typed messages in `src/i18n/en-US/` and `src/i18n/da-DK/`. English is their source
  already. The theme's site-facing texts use `siteT` from these messages. Both stay as they are.
- Ids and URL segments are Danish: `maaling`, `udseende`, `indstillinger`, `kategorier`, `ny/<id>` and others.
- About 630 lines with æ, ø or å sit outside the language files, in about 150 files. Danish words without these
  letters ("Indhold", "Blokke", the ids) add more: an estimated 1,500 to 2,000 places in total.

## Design

### Language files

Danish is allowed only in these folders:

| Folder | Holds | Shape |
|---|---|---|
| `src/i18n/da-DK/` | the editor's UI texts | typed `Messages`, as today |
| `defaults/i18n/da-DK/` | the standard parts' texts (replaces `defaults/texts.ts`) | `Record<string, string>`, English text → Danish text |
| `starter/i18n/da-DK/` | the starter's content in Danish | the same files as the starter's English content |
| `worker/i18n/da-DK.js` | the Worker's messages to the owner and its commit messages | `Record<string, string>`, English → Danish |

The rule in one line: Danish is allowed only in a path that contains a folder `i18n/da-DK/` or a file
`i18n/da-DK.js`. A test fixture that needs Danish letters writes them as escapes (`æ`, `ø`, `å`), and
so does a regular expression that must match them.

`defaults/i18n/da-DK/` has one file per source file it translates (`editor.ts`, `collections.ts`, `rules.ts` …) and
an `index.ts` that joins them. The apps' own `texts.ts` files live in `morpheme-apps` and follow in that project.

### Mechanism (approach A: English text as the key)

- `DEFAULTS_LOCALE` becomes `'en-US'`. The standard parts are written in English.
- `siteText(text)` keeps its contract. For a Danish editor it looks up the English text in `defaults/i18n/da-DK/`.
  A site's own texts, written in Danish on a Danish site, have no entry and pass through as written.
- New: `inSiteLanguage(text)`, for values that the editor writes into content (for example a default button text
  in a new entry). It translates into the site's language (`config.locale`), not the editor's.
- `check:content` already lists missing translations. For `da-DK` it fails the check instead of only reporting.
  A changed English text then cannot silently lose its Danish.
- There is no `morpheme new` today: a new site is a copy of `starter/`. A new command, `morpheme locale da-DK`,
  lays the copy's `i18n/da-DK/` over its English content, sets `config.locale`, and deletes the copy's `i18n/` folder.

Approach B (typed message keys for every label) was rejected. It costs about three times the work, and site authors
would have to write keys too.

### Ids and URLs

Ids and URL segments become English slugs. This is a breaking change for sites that override a standard part by its
id, and for saved links. The changelog says so. Sara's site gets its own follow-up fix after the release.

The complete mapping (batch 2, Task 2.1, from a search of `defaults/`, `site/`, `src/`, `lib/`, `theme/`, `pages/`,
`scripts/`, `worker/`, `starter/` and the docs). Slugs are lower case, words joined by `-`. The rows from the first
version of this table are unchanged. The column "Kind" says where the id lives: a **route** is a segment of the
editor's address after `#`; a **part** is an id in a menu, `icons` or `settings` map (`defaults/editor.ts`,
`defaults/company.ts`, `defaults/privacy.ts`, `defaults/collections.ts`); a **key** is a browser-storage key or a
stored sort value of the editor.

**Routes and part ids**

| Danish           | English           | Kind               | Note                                                                                              |
| ---------------- | ----------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `indstillinger`  | `settings`        | route, part        | Also the app tab `apps/<id>/indstillinger` (`SETTINGS_KEY` in `lib/appRoute.mjs`).               |
| `udseende`       | `appearance`      | route, part        |                                                                                                   |
| `maaling`        | `analytics`       | route              | Only in comments and in `lib/menu.test.mjs` ("gone" ids); an app category, kept by the apps.      |
| `promovering`    | `promotion`       | route              | Old route in `MOVED` (`src/movedRoutes.mjs`); an app category.                                    |
| `kategorier`     | `tags`            | route, part, list  | Collection id and `config.lists.tags` in `site/defineSite.mjs`; the folder `src/data/categories` stays. |
| `mobilmenu`      | `mobile-menu`     | part               | The data file is `src/data/mobile-menu.json` already.                                             |
| `virksomheden`   | `company`         | route, part        |                                                                                                   |
| `blokke`         | `blocks`          | route, part        | Also the virtual file `blokke/<block>` for block texts (`defaults/rules.ts`, `edit.to`).          |
| `filer`          | `files`           | route, part        | The route only. The folder `public/filer` and the address `/filer/` are site data (below).        |
| `privatliv`      | `privacy`         | route, part        |                                                                                                   |
| `lister`         | `lists`           | route, part        |                                                                                                   |
| `liste`          | `list`            | route              | `liste/<id>`; also `udseende/dele/liste/<id>`.                                                    |
| `videresendelser`| `redirects`       | route, part        | `seo/videresendelser` and its tabs.                                                               |
| `blokvalg`       | `block-settings`  | route, part        |                                                                                                   |
| `avanceret`      | `advanced`        | route, part        | `ADVANCED_ROUTE`.                                                                                 |
| `licenser`       | `licenses`        | route, part        | `LICENSES_ROUTE`.                                                                                 |
| `temaer`         | `themes`          | route, part        | `udseende/temaer` and `indstillinger/appstore/temaer`.                                            |
| `farver`         | `colors`          | route, part        | Old route in `MOVED` too.                                                                         |
| `reservefarver`  | `fallback-colors` | route              | `FALLBACK_ROUTE`.                                                                                 |
| `ikonpakker`     | `icon-packs`      | route, part        |                                                                                                   |
| `bevaegelse`     | `motion`          | route, part        |                                                                                                   |
| `sidekolonne`    | `side-column`     | route, part        |                                                                                                   |
| `dele`           | `parts`           | route, part        | `udseende/dele` and its sub-routes; also in `src/ui.tsx` and `src/i18n/*/parts.ts` comments.      |
| `vaerdier`       | `values`          | route              | `udseende/dele/vaerdier`.                                                                         |
| `standardsider`  | `default-pages`   | part               | The spec's choice. The config key `standardPages` stays.                                          |
| `udtalelser`     | `testimonials`    | list id            | `config.lists.testimonials`. The page address `/udtalelser/` is site data (below).               |
| `ny`             | `new`             | route              | `ny/<list>/<kind>`. The site address `/ny/` is site data (below).                                 |
| `samtykker`      | `consents`        | part               |                                                                                                   |
| `betaling`       | `payment`         | route, part        | `virksomheden/betaling/<id>`.                                                                     |
| `vurdering`      | `rating`          | route              | `seo/vurdering` (`SEO_SCORES_ROUTE`).                                                             |
| `udvikler`       | `developer`       | route, app id      | `DEVELOPER_ROUTE`; also in `REFUSED_APPS` (`lib/storeEntries.mjs`).                               |
| `alle`           | `all`             | route              | `seo/videresendelser/alle` (the tab "All").                                                       |
| `indhold`        | `content`         | group, part        | Menu section. Do not mix it with the form-section ids `content` in `EntryForm.tsx`.              |
| `globalt`        | `global`          | group, part        | Menu section.                                                                                     |
| `konto`          | `account`         | route              |                                                                                                   |
| `notifikationer` | `notifications`   | route              |                                                                                                   |
| `slettet`        | `deleted`         | route              | `slettet/<id>`, `slettet/filer`.                                                                  |
| `tema`           | `theme`           | route, owner kind  | Old routes in `MOVED`; the owner id `tema/<id>` in `lib/licenses.mjs` (`ownerId`).               |
| `kontakt`        | `contact`         | part               | Company part. The page address `/kontakt/` in comments and tests is site data.                    |
| `sociale-medier` | `social-media`    | part               | Company part.                                                                                     |
| `cookiebanner`   | `cookie-banner`   | part               | `privatliv/cookiebanner`.                                                                         |
| `privatlivssider`| `privacy-pages`   | part               | `privatliv/privatlivssider`.                                                                      |
| `interne-links`  | `internal-links`  | part               | `seo/interne-links`; the data file is `src/data/internal-links.json` already.                     |
| `headerknap`     | `header-button`   | part               | Collection id in `defaults/collections.ts` and `header` in `defaults/editor.ts`.                  |
| `ikke-fundet`    | `not-found`       | route              | `seo/videresendelser/ikke-fundet`.                                                                |
| `om`             | `about`           | route              | The app tab `apps/<id>/om` (`INFO_KEY` in `lib/appRoute.mjs`). A page address `/om/` is site data. |
| `butik`          | `store`           | app id, route      | The app store's old id (`STORE_BEFORE = 'apps/butik'`, `REFUSED_APPS`). The apps repo owns the id; judgement call. |

**Schema and page anchors (output ids)**

| Danish         | English        | Kind          | Note                                                                                                |
| -------------- | -------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `virksomhed`   | `business`     | JSON-LD id    | `defaults/schema.ts` `ids.business`; becomes `#business` in the page's JSON-LD graph.               |
| `broedkrummer` | `breadcrumbs`  | JSON-LD id    | `site/schema.ts` (`#broedkrummer`).                                                                 |
| `indlaeg`      | `post`         | JSON-LD id    | `site/schema.ts` (`#indlaeg`).                                                                      |
| `hovedindhold` | `main-content` | anchor        | The skip link in `theme/layouts/Base.astro`; both the `id` and the `href`.                          |

**Browser-storage keys and stored values** (an owner's saved filters and sorts are lost once; no data is lost)

| Danish                 | English                 | Kind       | Note                                                                    |
| ---------------------- | ----------------------- | ---------- | ----------------------------------------------------------------------- |
| `nyeste`               | `newest`                | sort value | `Library.tsx`, `Parts.tsx`; also in `src/ui.tsx` (flagged, see below).  |
| `aeldste`              | `oldest`                | sort value | Same files as `nyeste`.                                                 |
| `vis`                  | `show`                  | stored value | `seoKey` in `Library.tsx`.                                            |
| `skjul`                | `hide`                  | stored value | `seoKey` in `Library.tsx`.                                            |
| `apps-soeg`            | `apps-search`           | key        | `AppList.tsx`.                                                          |
| `blokke-gruppe`        | `blocks-group`          | key        | `Library.tsx`.                                                          |
| `blokke-soeg`          | `blocks-search`         | key        | `Library.tsx`.                                                          |
| `butik-soeg`           | `store-search`          | key        | `AppList.tsx`.                                                          |
| `butik-kategori`       | `store-category`        | key        | `AppList.tsx`.                                                          |
| `butik-status`         | `store-status`          | key        | `AppList.tsx`.                                                          |
| `licenser-soeg`        | `licenses-search`       | key        | `Licenses.tsx`.                                                         |
| `samtykker-soeg`       | `consents-search`       | key        | `Consents.tsx`.                                                         |
| `seo-slags`            | `seo-kind`              | key        | `SeoScores.tsx`.                                                        |
| `seo-soeg`             | `seo-search`            | key        | `SeoScores.tsx`.                                                        |
| `soegeord-side`        | `keywords-page`         | key        | `Keywords.tsx`.                                                         |
| `soegeord-soeg`        | `keywords-search`       | key        | `Keywords.tsx`.                                                         |
| `soegeord-slags`       | `keywords-kind`         | key        | `Keywords.tsx`.                                                         |
| `videresendelser-soeg` | `redirects-search`      | key        | `Redirects.tsx`.                                                        |
| `filer-type`           | `files-type`            | key        | `Media.tsx`.                                                            |
| `filer-soeg`           | `files-search`          | key        | `Media.tsx`.                                                            |
| `filer-dato`           | `files-date`            | key        | `Media.tsx`.                                                            |
| `filer-brug`           | `files-use`             | key        | `Media.tsx`.                                                            |
| `filer-tag`            | `files-tag`             | key        | `Media.tsx`.                                                            |
| `editor-sort-soegeord` | `editor-sort-keywords`  | key        | `Keywords.tsx`.                                                         |
| `editor-sort-indsaet`  | `editor-sort-insert`    | key        | `BlockDialog.tsx` (flagged, see below).                                 |

The other `editor-sort-<id>` and `<collection.id>-soeg|-side|-type` keys are built from an id above and from the
suffixes `-soeg` (`-search`) and `-side` (`-page`); they change with their id. `-type`, `-group` and `-search` stay.

**Names the editor generates** (new files only; existing files keep their names)

| Danish    | English   | Kind                | Note                                                      |
| --------- | --------- | ------------------- | --------------------------------------------------------- |
| `billede` | `picture` | file name fallback  | `src/images.ts`, when an upload has no usable name.       |
| `fil`     | `file`    | file name fallback  | `src/images.ts`, and `lib/scheduled.mjs` (a message word). |

**Site data on disk (not renamed in this batch).** These are names in a site's own folders and addresses. A rename
needs a migration, and the owner has not agreed to one.

| Name                                    | Where                                                           | Why it stays                                           |
| --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| `public/filer` (address `/filer/`)      | `config.folders.files`, `reserved` in `site/defineSite.mjs`     | Existing sites keep uploaded files there. *site data*  |
| `/ny/<address>` (the new-version pages) | `site/noindex.mjs`, `reserved` in `site/defineSite.mjs`         | A live address. The editor route `ny/<list>` is renamed. *site data* |
| `/udtalelser/`                          | `testimonialsPath` in `site/testimonials.ts`                    | The address of a site's page. *site data*              |
| `src/content/pages/privatlivspolitik.md` | `edit.to` in `defaults/privacy.ts`                             | The file of a site's page. *site data*                 |
| `#find-vej`                             | `theme/components/Footer.astro`, comments                       | An anchor in a site's contact page content; defined by the site, not here. *site data* |
| `/kontakt/`, `/om/`, `/om-mig/`, `/ydelser/…` | comments, tests, examples                                 | Addresses of a site's pages. *site data*               |

No other folder name on disk is Danish: `src/content/blog`, `src/content/pages`, `src/data/*` (`categories`,
`testimonials`, `popups`, `cookie-list`, `files` and the data files), `public/images/uploads` and `src/apps` are
English already.

**Judgement calls** (the slug was not a straight translation, or the id is not owned here): `butik` → `store` (the
app store's own id, kept by the apps repo); `standardsider` → `default-pages` (the spec's first choice, although the
config key is `standardPages`); `indlaeg` → `post` (a blog post's JSON-LD node); `broedkrummer` → `breadcrumbs`;
`virksomhed` → `business` (the schema.org type is `LocalBusiness`); `soegeord-side` → `keywords-page`; `vis`/`skjul`
→ `show`/`hide`; `hovedindhold` → `main-content`; `indhold` → `content` and `globalt` → `global`.

**Old links (owner decides in Task 2.4).** Adding each renamed route to `MOVED` in `src/movedRoutes.mjs` keeps a saved link
or bookmark to a Danish route working. The Danish routes in `MOVED` would then be the only Danish ids left outside the
language files; without it the old links stop working, as the changelog says.

### Enforcement: `check:language`

New `scripts/check-language.mjs`, run by `npm run check`. It reads every tracked text file outside the language
folders and fails when it finds:

1. æ, ø or å (either case), or
2. a quoted string that equals a Danish value from `defaults/i18n/da-DK/` or `src/i18n/da-DK/`. Values that equal
   their English key ("Tags", "Analytics") are skipped.

Binary files are skipped. `CHANGELOG.md` and `docs/superpowers/` are skipped: they are history, and a plan for this
work must name the Danish ids it renames. `AGENTS.md`, `README.md` and the other docs are in scope. A `PENDING` list of paths in the
script lets the batches convert the repo one part at a time. Each batch removes its paths. The last batch deletes the
list. The pure part (`findDanish(text, danishValues)`) has unit tests.

### Hidden costs and how the design meets them

| Cost | Answer |
|---|---|
| A changed English text loses its Danish. | `check:content` fails on a missing `da-DK` entry. |
| Default values must be in the site's language. | `inSiteLanguage()`, separate from `siteText()`. |
| Some words are spelled the same in both languages. | The check skips values equal to their key. |
| Renamed ids break sites that override them. | Breaking change in the changelog; Sara's fix follows the release. |

## Batches

Each batch is one PR. Each passes `npm run check`, `npm run check:screens` and `npm run check:starter`.

| # | Batch | Worker |
|---|---|---|
| 1 | `check:language` with tests and a `PENDING` list of every current path; `translate()`, `inSiteLanguage()` | Sonnet |
| 2 | `defaults/`: English texts and ids, `editor.ts` first; `texts.ts` → `defaults/i18n/da-DK/`; `DEFAULTS_LOCALE` → `en-US`; the id and URL renames in every file; `check:content` fails on a missing `da-DK` entry | Sonnet |
| 3 | `site/` and `lib/` | Ollama runner, with the term table from batch 2 |
| 4 | `src/` (mostly comments that name Danish labels) | Ollama runner |
| 5 | `theme/`, `worker/` (with `worker/i18n/da-DK.js`), `pages/`, `scripts/`, the docs | Ollama runner, Sonnet for texts people read |
| 6 | starter content in English, `starter/i18n/da-DK/`, `morpheme locale`; delete the `PENDING` list | Sonnet |

Batch 2 writes the term table (Danish UI label → English label) that batches 3 to 5 use for the comments that name
labels. A master plan and one file per batch follow this spec in `docs/superpowers/plans/`.

## Tests

- `findDanish()`: unit tests for æøå, a Danish dictionary value, a value equal to its key, a binary file and a
  `PENDING` path.
- `inSiteLanguage()`: unit tests for a Danish site with an English editor and the reverse.
- `check:content`: a missing `da-DK` entry fails.
- `check:screens`: every editor screen opens in both languages after the id renames.
- `check:starter`: a new Danish site gets the Danish starter content.
