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
- `morpheme new` copies `starter/i18n/da-DK/` over the English starter content when the new site's locale is
  `da-DK`.

Approach B (typed message keys for every label) was rejected. It costs about three times the work, and site authors
would have to write keys too.

### Ids and URLs

Ids and URL segments become English slugs. This is a breaking change for sites that override a standard part by its
id, and for saved links. The changelog says so. Sara's site gets its own follow-up fix after the release.

Known mapping (batch 2 completes the list from a search of every route and id):

| Danish | English | | Danish | English |
|---|---|---|---|---|
| `indstillinger` | `settings` | | `udseende` | `appearance` |
| `maaling` | `analytics` | | `promovering` | `promotion` |
| `kategorier` | `tags` | | `mobilmenu` | `mobile-menu` |
| `virksomheden` | `company` | | `blokke` | `blocks` |
| `filer` | `files` | | `privatliv` | `privacy` |
| `lister` | `lists` | | `liste` | `list` |
| `videresendelser` | `redirects` | | `blokvalg` | `block-settings` |
| `avanceret` | `advanced` | | `licenser` | `licenses` |
| `temaer` | `themes` | | `farver` | `colors` |
| `reservefarver` | `fallback-colors` | | `ikonpakker` | `icon-packs` |
| `bevaegelse` | `motion` | | `sidekolonne` | `side-column` |
| `dele` | `parts` | | `vaerdier` | `values` |
| `standardsider` | `default-pages` | | `udtalelser` | `testimonials` |
| `ny` | `new` | | `samtykker` | `consents` |
| `betaling` | `payment` | | `vurdering` | `rating` |
| `udvikler` | `developer` | | `alle` | `all` |

Folder names on disk (`public/filer`) are site data, not ids. Batch 2 decides each one by whether existing sites
have files there; a rename of site data needs a migration and is out of scope unless the owner agrees.

### Enforcement: `check:language`

New `scripts/check-language.mjs`, run by `npm run check`. It reads every tracked text file outside the language
folders and fails when it finds:

1. æ, ø or å (either case), or
2. a quoted string that equals a Danish value from `defaults/i18n/da-DK/` or `src/i18n/da-DK/`. Values that equal
   their English key ("Tags", "Analytics") are skipped.

Binary files are skipped. `CHANGELOG.md` is skipped (its old entries are history). A `pending` list of paths in the
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
| 1 | `check:language` with tests and a `pending` list of every current path; `inSiteLanguage()` | Sonnet |
| 2 | `defaults/`: English texts and ids, `editor.ts` first; `texts.ts` → `defaults/i18n/da-DK/`; `DEFAULTS_LOCALE` → `en-US`; the id and URL renames in every file | Sonnet |
| 3 | `site/` and `lib/` | Ollama runner, with the term table from batch 2 |
| 4 | `src/` (mostly comments that name Danish labels) | Ollama runner |
| 5 | `theme/`, `worker/`, `pages/`, `scripts/` | Ollama runner |
| 6 | starter content in English, `starter/i18n/da-DK/`, `morpheme new`; delete the `pending` list | Sonnet |

Batch 2 writes the term table (Danish UI label → English label) that batches 3 to 5 use for the comments that name
labels. A master plan and one file per batch follow this spec in `docs/superpowers/plans/`.

## Tests

- `findDanish()`: unit tests for æøå, a Danish dictionary value, a value equal to its key, a binary file and a
  `pending` path.
- `inSiteLanguage()`: unit tests for a Danish site with an English editor and the reverse.
- `check:content`: a missing `da-DK` entry fails.
- `check:screens`: every editor screen opens in both languages after the id renames.
- `check:starter`: a new Danish site gets the Danish starter content.
