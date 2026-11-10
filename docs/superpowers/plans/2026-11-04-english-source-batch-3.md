# Batch 3: `site/` and `lib/` in English

Status: not started (`site/` and `lib/` are still in `PENDING`). Checked against the code on 2026-11-10.

Master plan: `2026-11-04-english-source.md` (read *Conversion rules*). Needs Batch 2 merged (the term table, the
English ids). Repo `morpheme-cms`. Can run at the same time as batches 4 and 5.

**Batch check:** the checks in `AGENTS.md` section 4, `npm run check:language`.

**Start:** run the command below. Use its file list, not the snapshot below, when the two differ.

```
node scripts/check-language.mjs   # with site/ and lib/ removed from PENDING
```

Snapshot (4 November 2026, lines with æ, ø or å):

| Folder | Files |
|---|---|
| `site/` | `appCookies.mjs` 4, `autolinks.mjs` 3, `blockScripts.ts` 1, `content.ts` 7, `defineSite.mjs` 4, `home.ts` 3, `icons.mjs` 11, `motion.ts` 1, `pageColors.ts` 1, `schema.ts` 3, `seo.ts` 1, `site.ts` 1, `siteCsp.mjs` 1, `standardPages.ts` 2, `storeTheme.mjs` 1, `storeTheme.test.mjs` 1, `text.ts` 1, `theme.mjs` 16, `tracking.client.ts` 1 |
| `lib/` | `apps.mjs` 1, `blocks.mjs` 2, `caseCollisions.mjs` 1, `colors.ts` 2, `contracts.mjs` 1, `cspSources.mjs` 2, `dynamic-colors.ts` 1, `inline.ts` 1, `licenses.mjs` 11, `lockfile.mjs` 2, `motion.ts` 1, `scheduled.mjs` 2, `text-colors.mjs` 3 |

---

### Task 3.1: `site/` part 1 — Ollama runner

**Files:** `site/autolinks.mjs`, `site/blockScripts.ts`, `site/home.ts`, `site/motion.ts`, `site/pageColors.ts`,
`site/schema.ts`, `site/seo.ts`, `site/site.ts`, `site/siteCsp.mjs`, `site/text.ts`

- [ ] Write each comment and developer-facing string in English. Use the term table for UI labels.
- [ ] Run `npm run check:language` with these files out of `PENDING`. Make sure that they have no match.
- [ ] Run the batch check.
- [ ] Commit: `Write site/ part 1 in English`.

### Task 3.2: `site/` part 2 — Sonnet agent (owner-facing texts and site data)

**Files:** `site/appCookies.mjs`, `site/content.ts`, `site/defineSite.mjs`, `site/icons.mjs`,
`site/standardPages.ts`, `site/storeTheme.mjs`, `site/storeTheme.test.mjs`, `site/theme.mjs`,
`site/tracking.client.ts`

**Rules:**
- `site/theme.mjs` and `site/icons.mjs` report problems to the owner during the build. Write the reports in English.
  They are build output, so they need no Danish translation.
- `site/appCookies.mjs` holds cookie texts that a visitor reads. Move them to a `siteT` message key.
- `site/defineSite.mjs` `files: 'public/filer'` is site data: keep it, and write a comment that says why.
- A test fixture with Danish letters writes them as escapes.

- [ ] Do the changes.
- [ ] Remove `site/` from `PENDING`. Run the batch check.
- [ ] Commit per file group of one kind (one commit for build reports, one for cookie texts, one for comments).

### Task 3.3: `lib/` — Ollama runner (Sonnet for `licenses.mjs`)

**Files:** every `lib/` file in the snapshot.

**Rules:**
- `lib/licenses.mjs` builds the license page that the owner sees. Its Danish strings become keys in
  `src/i18n/en-US/` and `src/i18n/da-DK/`. This file goes to a Sonnet agent.
- The other files have comments and developer messages only: Ollama runner, at most 10 files per task.

- [ ] Do the changes.
- [ ] Remove `lib/` from `PENDING`. Run the batch check.
- [ ] Commit: `Write lib/ in English` (and `Translate the license page through the editor's messages`).
- [ ] Open the PR with a changeset (`patch`). Merge it when the checks pass.
