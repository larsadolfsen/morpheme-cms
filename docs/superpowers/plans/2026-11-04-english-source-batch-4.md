# Batch 4: `src/` in English

Status: done on 2026-11-10 (branch `claude/english-source-batch-4`). `src/` is out of `PENDING` except `src/i18n/`, whose English files still hold Danish comments and labels (outside this batch). Danish ids such as `side`, `blok` and `tema` stay; the lines that keep them carry the marker `language-ok`, which `check:language` skips.

Master plan: `2026-11-04-english-source.md` (read *Conversion rules*). Needs Batch 2 merged (the term table, the
English ids). Repo `morpheme-cms`. Can run at the same time as batches 3 and 5. `src/i18n/` is out of this batch.

**Batch check:** the checks in `AGENTS.md` section 4, `npm run check:language`.

**Start:** run `node scripts/check-language.mjs` with `src/` removed from `PENDING`. Use its file list when it
differs from the snapshot. On 4 November 2026, 57 files had 177 lines with æ, ø or å; 169 of them were comments.

---

### Task 4.1: comments in `src/standard/` — Ollama runner (two tasks of at most 10 files)

**Files:** `src/standard/accordion/index.tsx`, `accordion/shared.ts`, `accordion/view.ts`, `cards/shared.ts`,
`faq/index.tsx`, `faq/load.ts`, `faq/view.ts`, `head.ts`, `posts/index.tsx`, `posts/load.ts`, `posts/shared.ts`,
`posts/view.ts`, `site.ts`, `testimonials/index.tsx`, `testimonials/list.ts`, `testimonials/load.ts`,
`testimonials/view.ts` (all under `src/standard/`)

- [ ] Write each comment in English. Name each UI label by its English text from the term table.
- [ ] Make sure that only comments change: `git diff` shows no change outside comments.
- [ ] Run the batch check.
- [ ] Commit per task: `Write the comments in src/standard/ in English (part N)`.

### Task 4.2: comments in the rest of `src/` — Ollama runner (five tasks of at most 10 files, A to Z)

**Files:** the other `src/*.ts` and `src/*.tsx` files from the start command, except `src/seo.ts`,
`src/examples.ts` and `src/schema.ts` (Task 4.3).

- [ ] Write each comment in English. Name each UI label by its English text from the term table.
- [ ] Make sure that only comments change.
- [ ] Run the batch check.
- [ ] Commit per task: `Write the comments in src/ in English (part N)`.

### Task 4.3: Danish data in code — Sonnet agent

**Files:** `src/seo.ts`, `src/examples.ts`, `src/schema.ts`, and new `src/i18n/da-DK/vagueLinks.ts`,
`src/i18n/en-US/vagueLinks.ts`

**Behaviour:**
- `src/examples.ts` and `src/schema.ts` make slugs: they replace æ, ø and å with `ae`, `oe`, `aa`. Keep the
  behaviour. Write the letters as escapes (`/æ/g`).
- `src/seo.ts` has a list of vague link texts in Danish (`'læs her'`, `'læs mere'` …). The list depends on the
  site's language. Move it to `vagueLinks.ts` per language. Pick the list by `siteLocale`. Write the English list
  with the same meaning ("read here", "read more", "click here" …).

**Test cases:**

| Input | Expected |
|---|---|
| slug of `'Søren Æblegaard'` | same slug as before the change |
| a Danish site, link text `'læs mere'` | flagged as vague |
| an English site, link text `'read more'` | flagged as vague |
| an English site, link text `'læs mere'` | not flagged |

- [ ] Write the tests. Run them. Make sure that the new ones fail.
- [ ] Do the changes. Run the tests. Make sure that they pass.
- [ ] Remove `src/` from `PENDING`. Run the batch check.
- [ ] Commit: `Pick the vague link texts by the site's language`. Commit the escapes separately.
- [ ] Open the PR with a changeset (`patch`). Merge it when the checks pass.
