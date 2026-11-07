# Plan: release notes (Why, How, What)

Spec: `docs/superpowers/specs/2026-11-07-release-notes-design.md`. Session branch: `feat/release-notes`.

## Goal

The editor shows a friendly note for each change a site owner sees: Why, How, What, in English and Danish.
The Morpheme page also shows the notes of the update that the site just got.

## Architecture

Pull requests add one note file per locale. The release step moves them into one file per version and locale.
The site Worker reads these files from the npm tarball and keeps them in KV. The editor shows them as cards.
Pure logic is in `lib/releaseNotes.mjs`.

## Files

| Path | Task | What |
|---|---|---|
| `lib/releaseNotes.mjs`, `lib/releaseNotes.test.mjs` | A | pure functions and unit tests |
| `scripts/release-notes.mjs`, `scripts/check-release-notes.mjs`, `package.json` | B | release step and check |
| `worker/cms-update.js` | C | keep notes in KV, return `installed` |
| `src/ReleaseNoteCard.tsx`, `src/CmsPage.tsx`, `src/i18n/en-US/cms.ts`, `src/i18n/da-DK/cms.ts` | D | card, page, texts |
| `.changeset/README.md`, `.claude/skills/release/SKILL.md`, `AGENTS.md`, `.changeset/*.md`, `release-notes/i18n/*/pending/*.json` | E | writing rule, map, this change's own note |

## Order

A and E have no dependencies. B and C need A. D needs A and C.

## Workers

| Task | Worker | Reason |
|---|---|---|
| A | Haiku | pure functions, full interface given |
| B | Haiku | small scripts, full interface given |
| C | Sonnet | Worker rules (AGENTS.md section 4: no pending I/O promise in module memory) |
| D | Sonnet | `ui.tsx`, theme and M3 rules |
| E | Haiku | docs and JSON |

## Task A: `lib/releaseNotes.mjs`

Interface (JavaScript module, no imports, JSDoc types from the spec):

```js
/** @typedef {{ id: string, title: string, why: string, how: string, what: string }} ReleaseNote */
/** @typedef {{ version: string, notes: ReleaseNote[] }} ReleasedNotes */
/** @typedef {Record<string, Record<string, ReleaseNote>>} Pending  // locale -> file name without .json -> note */

export const NOTE_FIELDS; // ['title', 'why', 'how', 'what']
export function problemsOf(pending)              // Pending -> string[]; [] when all good
export function released(pending, version)       // Pending -> Record<locale, ReleasedNotes>; no notes -> {}
export function notesFor(notes, locale)          // Record<locale, ReleaseNote[]> | undefined, locale -> ReleaseNote[] | undefined
export function installedVersions(update, running, kept) // cms:update | null, string, string[] -> string[], newest first
```

Steps:

1. Create `lib/releaseNotes.mjs` with a 2–3 line header comment.
2. Make `problemsOf` report a missing twin, a note `id` that differs from its file name, and an empty field.
3. Make `released` sort the notes of each locale by `id`.
4. Make `notesFor` return the locale's notes, else the `en-US` notes, else `undefined`.
5. Make `installedVersions` follow step 4 of the spec's flow. Use `compareVersions` from `lib/cms-version.mjs`.
6. Create `lib/releaseNotes.test.mjs` with the test cases below.

| Function | Input | Expected |
|---|---|---|
| `problemsOf` | en-US `a`, da-DK `a`, all fields filled | `[]` |
| `problemsOf` | en-US `a`, no da-DK `a` | one problem that names `a` and `da-DK` |
| `problemsOf` | file `a`, note `id: 'b'` | one problem that names `a` |
| `problemsOf` | `why: ''` | one problem that names the field `why` |
| `released` | en-US `b`, `a`; version `0.14.0` | `{ 'en-US': { version: '0.14.0', notes: [a, b] } }` |
| `released` | `{}` | `{}` |
| `notesFor` | `{ 'en-US': [x], 'da-DK': [y] }`, `da-DK` | `[y]` |
| `notesFor` | `{ 'en-US': [x] }`, `da-DK` | `[x]` |
| `notesFor` | `undefined`, `da-DK` | `undefined` |
| `installedVersions` | `{ from: '0.13.0', to: '0.14.1', state: 'done' }`, `0.14.1`, `['0.14.0','0.14.1','0.15.0']` | `['0.14.1','0.14.0']` |
| `installedVersions` | `{ to: '0.14.0', state: 'done' }`, `0.14.1`, `['0.14.1']` | `['0.14.1']` |
| `installedVersions` | `null`, `0.14.1`, `['0.14.0']` | `[]` |

Acceptance check: run `node --test lib/releaseNotes.test.mjs`. All tests pass.

## Task B: release step and check

Interface:

```text
node scripts/release-notes.mjs        # moves pending notes into release-notes/i18n/<locale>/<version>.json
node scripts/check-release-notes.mjs  # exit 1 and print each problem; exit 0 when no problems
```

Steps:

1. Create `scripts/release-notes.mjs`. Read the version from `package.json`.
2. Read all `release-notes/i18n/<locale>/pending/*.json`. A missing folder gives no notes.
3. Stop with exit 1 when `problemsOf` returns problems.
4. Write `released(...)` per locale to `release-notes/i18n/<locale>/<version>.json`, 2-space JSON, LF.
5. Delete the moved pending files.
6. Create `scripts/check-release-notes.mjs`. Use the same reading and `problemsOf`.
7. In `package.json`, set `release:version` to `changeset version && node scripts/release-notes.mjs && node scripts/starter.mjs`.
8. Add `check:release-notes` and put it in `check` after `check:language`.
9. Add `release-notes` to `files`.
10. Add header comments to both scripts.

Acceptance check: put a test pair in `pending`, run both scripts, see the version file. Remove the test files.
Then run `npm run check:release-notes` and `npm test`.

## Task C: Worker

Steps:

1. In `keepNotes`, for each kept version, read `package/release-notes/i18n/<locale>/<version>.json` for each
   locale in `['en-US', 'da-DK']` with `fileFromTar`.
2. Write `notes` into `cms:notes:<version>` only when a file exists. Keep `text` as now.
3. In `cmsStatus`, add `installed`: for each version from `installedVersions(update, running, kept)`, the
   `cms:notes:<v>` value as `{ version, text, notes }`.
4. Return `notes` on the existing `status.notes` entries too.
5. Update the header comment and the `cmsStatus` JSDoc.

Acceptance check: run `npm test` and `npm run check:types`. Both pass.

## Task D: editor

Steps:

1. Add texts to `src/i18n/en-US/cms.ts` and `src/i18n/da-DK/cms.ts` (present tense):

   | Key | en-US | da-DK |
   |---|---|---|
   | `newInYourVersion` | `New in your version` | `Nyt i din version` |
   | `why` | `Why` | `Hvorfor` |
   | `how` | `How` | `Sådan` |
   | `what` | `What` | `Hvad` |

2. Create `src/ReleaseNoteCard.tsx`. Props: `{ note: ReleaseNote }`. Show `title`, then three labelled parts.
   Use the theme's existing card and text components from `ui.tsx`. Follow Material 3. Add no new CSS values
   without tokens.
3. In `src/CmsPage.tsx`, add `installed` and `notes` to the view type.
4. Show a group `t.cms.newInYourVersion` with `view.installed` above the update button.
5. In both groups, show `notesFor(n.notes, locale)` as `ReleaseNoteCard`s. Without notes, show the `ListItem` as now.
6. Update the header comments of the changed files.

Acceptance check: run `npm run check`. Send a screenshot of `#morpheme` with English and Danish seed notes.

## Task E: docs and this change's own note

Steps:

1. In `.changeset/README.md`, add the writing rule from the spec section "Writing rule", with the example.
2. In `.claude/skills/release/SKILL.md`, add one line: the Release PR must contain `release-notes/i18n/*/<version>.json`
   when the release has owner-visible changes.
3. In `AGENTS.md` section 2, add `release-notes/` and what it holds.
4. Add a `minor` changeset: "The Morpheme page shows a friendly note for each change: why, how and what."
5. Add the pending note pair for this change, with the changeset's file name as `id`:
   - en-US: title "See what's new, in plain words". Why: "Updates should feel like a friendly hello, not a
     developer log." How: "Tap the update notice on your start screen to read about what you just got." What:
     "Each change now has a short note that tells you why we made it, how to use it and what changed."
   - da-DK: the same meaning in friendly Danish, "du"-form, present tense.

Acceptance check: run `npm run check:language` and `npm run format:check`. Both pass.
