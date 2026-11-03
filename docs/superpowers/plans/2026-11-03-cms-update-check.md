# The site updates the CMS by itself: master plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> In Interstellar the orchestrator never writes code: each task names its worker (Ollama runner, Sonnet agent).

**Goal:** a site with an exact version of `@morphemecms/cms` takes a new minor or patch from npm's `latest` by itself
within the hour, and undoes it within a minute or two when the site's build fails.

**Spec:** `docs/superpowers/specs/2026-11-03-cms-update-check-design.md` (this repo). Read it first.

**Architecture:** pure modules (`lib/`) decide; one Worker module (`worker/cms-update.js`) does the I/O in the two
crons every site has and answers `GET /api/cms` and `POST /api/cms/update`; a thin editor page shows what the Worker
knows. State lives in the `PUSH` KV binding under `cms:` keys.

**Tech stack:** Cloudflare Workers (KV, cron triggers), GitHub GraphQL (`worker/github.js`) and REST (check runs),
the npm registry, React (the editor), `node --test`.

## Where the code goes

In `morpheme-website`, `packages/editor/` (the CMS's source until step 4 of `docs/repositories.md` there). Paths below
are the package's own (`lib/…` = `packages/editor/lib/…`). Each batch ends with the package copied into
`morpheme-cms` the way the rest of the package is (Batch 3, Task 3.4). Every PR in `morpheme-website` follows its
`CLAUDE.md` (*Før du pusher*: `npm run check`, and the extra checks each task names).

## Global constraints

- Only an **exact** version in the site's `package.json` (`"0.1.1"`) is managed. `"*"`, a tag (`"next"`), a range
  (`"^0.1.0"`) and a lock entry with `link: true` are left alone.
- Only `dist-tags.latest` is ever taken. Same first number only (`0.1.1 → 0.2.0` yes, `0.9.0 → 1.0.0` no).
- One update at a time: nothing is taken while `cms:update.state` is `'waiting'` or `'undoing'`.
- A failed update is undone within a minute of its check run failing; 20 minutes without a result also undoes it.
- No new secret, no new key. The token is `GITHUB_PUBLISH_TOKEN` (needs *Contents: Read and write*, and *Checks: Read*
  for the fast undo). Without it, or without `PUSH`, nothing is checked or committed.
- Nothing from npm runs in the Worker: it reads JSON and one text file.
- Editor texts in `src/i18n/` (English first, then Danish); the editor's parts only from `ui.tsx`; commit messages the
  Worker writes are in the site's language.
- Every new file starts with a 2–3 line header (what, exposes, depends on). Tests and code in the same commit.

## Decisions beyond the spec (made while planning, 3 November 2026)

1. **A fifth state, `'undoing'`.** After the undo commit the Worker watches the undo's build: its check run
   succeeding (or 20 minutes passing) makes the update `'undone'`, its check run failing makes it `'stuck'`. The
   running version cannot prove the undo, because the failed build never went online (the site still runs `from`).
   `cms:update` gains `undoAt`. The spec's data model is amended in the same PR as this plan.
2. **The check run is found by its app**, `cloudflare-workers-and-pages`, not by the Worker's name (the Worker does not
   know its own name at runtime). Any check run of that app on the commit counts.
3. **`commitFiles` returns the new commit's id** (`Promise<string>`), so the update and the undo know which commit to
   watch. `publish.js` ignores it.
4. **npm is read in two small requests**: `https://registry.npmjs.org/-/package/@morphemecms%2fcms/dist-tags` for
   `latest`, and `https://registry.npmjs.org/@morphemecms%2fcms/<version>` for one version's manifest (for
   `addToLock` and the tarball). Never the whole package document (it grows with every `next` version).
5. **The page's route is `#morpheme`**, like the other settings pages (`#avanceret`, `#licenser`), not the spec's
   `#indstillinger/morpheme`.
6. **The starter pins an exact version** (`"@morphemecms/cms": "0.1.0"`, not `"^0.1.0"`), or no new site would ever be
   managed.
7. **I/O is injected into `worker/cms-update.js`** (`deps = { readFiles, commitFiles, fetch }`, the real ones by
   default), so its test needs no git fake.
8. **Sara's site does not have the package yet** (`"site-editor": "*"`): it gets all this with sub-project A. The
   round trip is tested on `morpheme-staging` pinned to an exact version, or waits for Sara's site.

## Batches

Each batch is one session: its tasks run as subagents/runner jobs, each on its own branch, and the batch is merged
before the next starts. Before a batch starts, mark it *in progress* below on `main` (commit and push that line).

| Batch | File | Ends with | Status |
| --- | --- | --- | --- |
| 1. The pure parts | `2026-11-03-cms-update-check-batch-1.md` | `node --test packages/editor/lib/*.test.mjs` green, with the new modules' tests | done (3 November 2026, morpheme-website#553) |
| 2. The Worker | `2026-11-03-cms-update-check-batch-2.md` | `npm run check:worker` green, with the update's whole round trip against fakes | not started |
| 3. The page, the starter and the docs | `2026-11-03-cms-update-check-batch-3.md` | *Indstillinger › Morpheme* on `npm run dev`, and the package in `morpheme-cms` | not started |

## Owner steps (not code)

- Give the site's `GITHUB_PUBLISH_TOKEN` *Contents: Read and write*, and *Checks: Read* if GitHub offers it for a
  fine-grained token (the spec's open question; without it the 20-minute fallback undoes).
- Approve the staged `next` and, with `/release`, `latest` (the release flow).
- The round trip (spec, *How it is verified*): on `morpheme-staging` or Sara's site once it has the package.

## Test coverage

Covered: every pure function (`node --test`), the Worker module against a fake KV, npm and GitHub
(`scripts/check-cms-update.mjs`, part of `check:worker`), and the page opening in each state (`check:screens`).
Not covered by tests: the real GitHub check runs and Cloudflare's build; checked by the round trip above.
