# English source, Danish only in language files: master plan

Status: done in this repository (2026-11-10). Batches 1 to 6 are done and `PENDING` is deleted; the *After the last batch* steps are for the owner/PM (other repositories). Checked against the code on 2026-11-10.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> In Interstellar the orchestrator never writes code: each task names its worker (Ollama runner, Sonnet agent).

**Goal:** every file in `morpheme-cms` is in English. Danish exists only in i18n language files. A check enforces it.

**Spec:** `docs/superpowers/specs/2026-11-04-english-source-design.md` (this repo). Read it first.

**Architecture:** English text is the key. `defaults/i18n/da-DK/` maps English to Danish for the standard parts.
`siteText()` keeps its contract. `inSiteLanguage()` translates values written into content. `check:language` fails
on Danish outside the language folders.

**Tech stack:** TypeScript, React (the editor), Node scripts (`.mjs`), `node --test`, Vite (`check:content`).

## Start condition

**Met on 2026-11-05.** Step 4 of `docs/repositories.md` in `morpheme-website` is done: this repo is the only source of
the CMS, and `AGENTS.md` section 4 runs the checks from this repo's root.

- [x] Do a fetch of `origin/main` (2026-11-05, `49a717a4`).
- [x] Count the Danish lines again. On 2026-11-05: 183 files, 942 lines with æ, ø or å outside the language files.
- [ ] Do a check of the paths in each batch file against the current tree. Batch 1: done. Batches 2–6: do it before
  each batch starts; other sessions still move files.

## Status

| Batch | Status |
|---|---|
| 1 | Done (2026-11-05, branch `feat/english-source-batch-1`). `PENDING` has 13 prefixes. `danishValuesOf` also skips a value with no letter and a value that is an English text too (`src/i18n/en-US/`). `--all` ignores `PENDING`: on 2026-11-05 it found 2443 texts in 355 files. |
| 2 | Done (PR #116). |
| 3 | Done (2026-11-10, branch `claude/english-source-batch-3-cy3xgl`). `site/` and `lib/` are out of `PENDING`. |
| 4 | Done (2026-11-10, branch `claude/english-source-batch-4`). `src/` is out of `PENDING` except `src/i18n/` (its English files still hold Danish comments). |
| 5 | Done (2026-11-10, branch `claude/english-source-batch-5`). `theme/`, `worker/`, `pages/`, `scripts/` and the docs are out of `PENDING`. |
| 6 | Done (2026-11-10, branch `claude/english-source-batch-6`). The starter is English, Danish is the layer `starter/i18n/da-DK/` (`npx morpheme locale da-DK`), and `PENDING` is deleted. |

## Batches

| # | File | Contents | Worker | Needs |
|---|---|---|---|---|
| 1 | `2026-11-04-english-source-batch-1.md` | `check:language`, `translate()`, `inSiteLanguage()` | Sonnet | the move |
| 2 | `2026-11-04-english-source-batch-2.md` | `defaults/` in English, `defaults/i18n/da-DK/`, `DEFAULTS_LOCALE`, id and URL renames, term table, `check:content` fails on a missing `da-DK` entry | Sonnet | 1 |
| 3 | `2026-11-04-english-source-batch-3.md` | `site/` and `lib/` | Ollama runner | 2 |
| 4 | `2026-11-04-english-source-batch-4.md` | `src/` | Ollama runner | 2 |
| 5 | `2026-11-04-english-source-batch-5.md` | `theme/`, `worker/`, `pages/`, `scripts/`, the docs | Ollama runner, Sonnet for texts people read | 2 |
| 6 | `2026-11-04-english-source-batch-6.md` | the starter in English, `starter/i18n/da-DK/`, `morpheme locale`; delete `PENDING` | Sonnet | 3, 4, 5 |

Batches 3, 4 and 5 touch different folders. They can run at the same time.

## File structure

| Path | Responsibility | Batch |
|---|---|---|
| `lib/danish.mjs` | pure: `findDanish(text, danishValues)` | 1 |
| `lib/danish.test.mjs` | unit tests for `findDanish` | 1 |
| `scripts/check-language.mjs` | reads tracked files, applies `findDanish`, holds `PENDING` | 1 |
| `lib/translate.mjs` | pure: `translate(dictionary, text, values?)`, used by `siteText` and `inSiteLanguage` | 1 |
| `lib/translate.test.mjs` | unit tests for `translate` | 1 |
| `src/i18n/index.ts` | `inSiteLanguage(text, values?)` next to `siteText`; both call `translate` | 1 |
| `worker/i18n/da-DK.js` | the Worker's messages and commit messages, English → Danish | 5 |
| `defaults/i18n/da-DK/<file>.ts` | English → Danish, one file per translated source file | 2 |
| `defaults/i18n/da-DK/index.ts` | joins the files above into one `Record<string, string>` | 2 |
| `docs/superpowers/plans/2026-11-04-english-source-terms.md` | Danish UI label → English label, for batches 3–5 | 2 |
| `starter/i18n/da-DK/` | the starter's content files in Danish | 6 |

## Global constraints

- No Danish text in any tracked file, except in a path with a folder `i18n/da-DK/` or a file `i18n/da-DK.js`.
- A test fixture or a regular expression that needs Danish letters writes them as escapes: `æ ø å`.
- `CHANGELOG.md`, `docs/superpowers/` and binary files are outside the check. `AGENTS.md` and `README.md` are in it.
- File names are text too: a Danish file name (`forside.md`) becomes English (`home.md`).
- English is `en-US`. Danish is `da-DK`. No other language changes.
- Ids and URL segments are English slugs: lower case, words joined by `-`.
- UI words follow `AGENTS.md` section 6 (Material 3 word choice): `Enabled`/`Disabled`, `On`/`Off`, `Add tag`.
- A Danish translation keeps today's Danish UI text exactly. The Danish editor must look the same after each batch.
- Every PR has a changeset (`AGENTS.md` section 3, item 4). Batch 2 is a breaking change.
- Every new file starts with a 2–3 line header (what, exposes, depends on). Tests and code go in the same commit.
- Plans give interfaces and test cases, not code. The worker writes the code.

## Conversion rules (batches 3 to 6)

Each Danish text gets one of five treatments. The worker decides by who reads the text.

| Who reads it | Example | Treatment | Worker |
|---|---|---|---|
| a developer | a comment, a check script's output, a thrown error for developers | write it in English | Ollama runner |
| the owner, in the editor | a button, a hint, a message | a key in `src/i18n/en-US/` and `src/i18n/da-DK/` | Sonnet |
| a visitor, on the site | "Read more", a date | a key read with `siteT`, or `Intl` for dates and numbers | Sonnet |
| the owner, from the Worker | a login error, a commit message | English in the code, Danish in `worker/i18n/da-DK.js`, by the site's locale | Sonnet |
| a site's content | a default value | `inSiteLanguage(...)` | Sonnet |

- Name a UI label in a comment by its English text from `2026-11-04-english-source-terms.md`.
- Find Danish words without æ, ø or å too: search each file for the term table's Danish words (whole words).
- An Ollama runner task holds at most 10 files from one folder. A file with an owner-, visitor- or Worker-facing
  string goes to a Sonnet task.
- Each task removes its paths from `PENDING` in `scripts/check-language.mjs` when the folder is done.

## Checks per batch

Run the checks in `AGENTS.md` section 4 (after the move: from this repo's root). Also run:

```
node --test lib/danish.test.mjs
node scripts/check-language.mjs
```

A batch is done when all checks pass and `check-language` passes with the batch's paths gone from `PENDING`.

## After the last batch

Both steps concern other repositories: they are for the owner/PM to do, not for a session in `morpheme-cms`.

- [ ] Write a register row for the same rule in `morpheme-apps`, `morpheme-website` and `morpheme-appstore`.
- [ ] Write a follow-up task for Sara's site: rename the ids in its `src/site/` after the release.
