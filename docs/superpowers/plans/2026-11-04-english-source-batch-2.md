# Batch 2: the standard parts in English, English ids

Master plan: `2026-11-04-english-source.md`. Needs Batch 1 merged (`check-language`, `translate`, `inSiteLanguage`).
Repo `morpheme-cms`, paths from the repo's root. Do the tasks in order. Each commit must pass the batch check on its
own, and the Danish editor must look the same after each commit.

**Batch check:** the checks in `AGENTS.md` section 4 (`check:screens` in both languages), `npm run check:language`.

**Release:** the package is `0.4.0`. This batch is a breaking change, so its changeset is `minor` (below 1.0).

---

### Task 2.1: the id table and the term table — Sonnet agent (docs only)

**Files:**
- Modify: `docs/superpowers/specs/2026-11-04-english-source-design.md` (complete the id table)
- Create: `docs/superpowers/plans/2026-11-04-english-source-terms.md`

**Behaviour:**
- Find every Danish id and URL segment. Search `id:`, `ids:`, `icons`, `settings`, `header`, the routes in
  `src/App.tsx` and `src/Library.tsx`, every `#<segment>` and `ny/` string, and `site/defineSite.mjs` (`lists`).
- Give each one an English slug that follows the spec's table. Add the new ones to the spec's table.
- Mark each folder name on disk (`public/filer`) as *site data*. Do not rename site data in this batch.
- Write the term table: one row per Danish UI label, with its English label. Take the English from
  `defaults/texts.ts` (`texts['en-US']`) and from `src/i18n/en-US/` where the same text has a key in `src/i18n/da-DK/`.
- Batches 3, 4 and 5 use the term table for comments that name a UI label.

- [ ] Write the tables.
- [ ] Commit: `Add the id and term tables for the English source`.

### Task 2.2: dictionaries in both directions — Sonnet agent

**Files:**
- Create: `defaults/i18n/da-DK/index.ts` (empty `Record<string, string>` that joins the per-file dictionaries)
- Modify: `src/i18n/index.ts` (`own`, `translatingSite`), `src/checkSite.ts` (`untranslated`)

**Behaviour (the transition, until Task 2.5):**
- The dictionary for the editor's language `L` is: `texts['en-US']` (Danish → English) when `L` is `en-US`, joined
  with `defaults/i18n/da-DK/` (English → Danish) when `L` is `da-DK`, joined with the apps' and the site's own
  `texts[L]`, as today.
- Load `own` for every language. A text without an entry shows as written.
- `inSiteLanguage` uses the same rule for `siteLocale`.
- `untranslated()` reports a converted text (a key of `defaults/i18n/da-DK/`) that has no Danish, and a Danish text
  that has no English, as today.

**Test cases (add to `lib/translate.test.mjs` if the join is a pure function in `lib/translate.mjs`):**

| Editor | Text | Dictionaries | Shows |
|---|---|---|---|
| `da-DK` | `'Content'` | da-DK `{ Content: 'Indhold' }` | `Indhold` |
| `da-DK` | `'Indhold'` (not converted yet) | da-DK `{}` | `Indhold` |
| `en-US` | `'Indhold'` (not converted yet) | en-US `{ Indhold: 'Content' }` | `Content` |
| `en-US` | `'Content'` | en-US `{}` | `Content` |

- [ ] Write the tests. Run them. Make sure that they fail.
- [ ] Write the join. Run the tests. Make sure that they pass.
- [ ] Run the batch check.
- [ ] Commit: `Translate the standard parts in both directions during the switch to English`.

### Task 2.3: one file at a time into English — Ollama runner per file (Sonnet for `rules.ts`, `collections.ts`)

**Order:** `editor.ts`, `company.ts`, `blockTexts.ts`, `privacy.ts`, `internalLinks.ts`, `standardPages.ts`,
`colors.ts`, `sitedata.ts`, `opens.ts`, `standard.ts`, `schema.ts`, `popup.tsx`, `collections.ts`, `rules.ts`.

**Per file `defaults/<file>`:**
- Create: `defaults/i18n/da-DK/<file-without-extension>.ts`. Add it to `defaults/i18n/da-DK/index.ts`.
- Modify: `defaults/<file>`: each Danish label, hint, message and comment into English.
- Modify: `defaults/texts.ts`: remove each entry that this file used from `texts['en-US']`.

**Rules for the worker:**
- Use the English from the removed `texts['en-US']` entry. Do not write a new English wording.
- Write each removed entry the other way round in `defaults/i18n/da-DK/<file>.ts`: English key, Danish value.
- Keep an entry in `texts['en-US']` that another file still uses.
- Keep the ids as they are. Task 2.4 renames them.
- A value that the editor writes into content (a default value, not a label) calls `inSiteLanguage(...)`.
- Write comments in English. Name a UI label by its English text from the term table.

**Acceptance check per file:**
- `node scripts/check-language.mjs` with `defaults/<file>` removed from `PENDING` exits with 0.
- `check:screens` passes. The screens of this file look the same in the Danish editor.
- Commit per file: `Write defaults/<file> in English`.

### Task 2.4: English ids and URLs — Sonnet agent

**Files:** every file that uses an id from the id table (Task 2.1): `defaults/`, `site/`, `src/`, `theme/editor/`,
`scripts/editor-screens.mjs` and the others that a search finds.

**Rules:**
- Rename one id per commit, in every file that uses it, the URL segment too.
- Do not rename site data on disk.
- Search for the old id as a whole word in quotes, after `#`, and after `/`. Make sure that no use is left.

**Acceptance check per commit:** the batch check passes, and `check:screens` opens each screen at its new URL.
Commit: `Rename the <old> id to <new>` (write the old id only in the commit message body, not in the subject).

### Task 2.5: finish the switch — Sonnet agent

**Files:**
- Modify: `defaults/texts.ts` (keep the file: it is the site's `@site/texts` default; it exports
  `{ 'da-DK': <defaults/i18n/da-DK/index.ts> }` and no Danish text)
- Modify: `src/i18n/index.ts` (`DEFAULTS_LOCALE = 'en-US'`; remove the transition join of Task 2.2)
- Modify: `src/checkSite.ts` (`untranslated()` reads the English → Danish direction; a missing `da-DK` entry for a
  standard part stops `check:content`)
- Modify: `scripts/check-language.mjs` (remove `defaults/` from `PENDING`)
- Modify: `docs/editor.md` and the site skills if they explain `texts.ts` (the new direction)
- Create: `.changeset/<name>.md` (`minor`): "The standard parts and their ids are in English. Danish comes from
  `defaults/i18n/da-DK/`. A site that overrides a part by its old id must use the new id."

**Test cases:**
- `check:content` on the demo with one `defaults/i18n/da-DK/` entry removed: exits with an error that names the text.
- `check:content` on the demo as it is: passes.
- `check:screens`: passes in both languages.

- [ ] Do the changes. Run the batch check.
- [ ] Commit: `Make English the language of the standard parts`.
- [ ] Open the PR. Merge it when the checks pass.
