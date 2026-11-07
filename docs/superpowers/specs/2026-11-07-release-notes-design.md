# Release notes: Why, How, What

Date: 2026-11-07. Status: agreed with the owner in chat.

## Goal

The editor tells a site owner what changed in each release. Each change has a friendly note: Why, How and What.
The note is in the editor's language (English and Danish). `CHANGELOG.md` stays the developer log.

## Problem now

- The "Morpheme is updated to 0.13.0" link opens the Morpheme page (`#morpheme`). That page shows notes only for
  versions newer than the running one. After an update, the notes of the new version do not show.
- The notes are the raw `CHANGELOG.md` section in one `ListItem`. They are for developers and only in English.

## Decisions

| Question | Decision |
|---|---|
| Language | English and Danish. Each note has the two languages. |
| Scope | Only changes that a site owner sees. Developer-only changes get no note. |
| 0.13.0 and older | No new notes. The page shows the old text for these versions. |
| Tone | Friendly, "you", present tense, one or two short sentences per part. Order: Why, How, What. |

Example (English):

> **Pick up where you left off**
> Why: You shouldn't have to hunt through the menu for the page you were just working on.
> How: Open the editor. Your last three pages and posts wait for you at the top. Tap one to jump straight back in.
> What: The start screen has a new "Continue where you left off" card.

## Data model

A note is one change in one language. The `id` connects the languages of one change.

```ts
/** One change, in one language. */
type ReleaseNote = {
  id: string;    // the changeset's file name without .md, e.g. "brave-cats-run"; unique in the repo
  title: string; // short headline
  why: string;
  how: string;
  what: string;
};

/** The notes of one released version, in one language. */
type ReleasedNotes = { version: string; notes: ReleaseNote[] };
```

Files (Danish must be under an `i18n/da-DK/` path, else `check:language` fails):

| Path | Content | Written by |
|---|---|---|
| `release-notes/i18n/en-US/pending/<id>.json` | one `ReleaseNote` | the pull request |
| `release-notes/i18n/da-DK/pending/<id>.json` | one `ReleaseNote`, same `id` | the pull request |
| `release-notes/i18n/<locale>/<version>.json` | one `ReleasedNotes` | `release:version` (moves the pending notes) |

Rules:

- A pending note in one locale has a twin with the same `id` in every other locale.
- The `id` is the file name without `.json`.
- All four text fields are not empty.
- A released file is never changed after its release.

KV, in the site's Worker (`PUSH`), extends the existing key:

| Key | Value |
|---|---|
| `cms:notes:<version>` | `{ version, text, notes?: { 'en-US': ReleaseNote[], 'da-DK': ReleaseNote[] } }` |

`text` stays: it is the fallback for versions without notes.

## Flow

1. **Pull request.** The author adds the changeset (as now) and, for a change a site owner sees, the two note files.
   `npm run check` runs `check:release-notes`: each pending note has its twin and no empty field.
2. **Release.** `release:version` runs `changeset version`, then `scripts/release-notes.mjs`. The script moves all
   pending notes of a locale into `release-notes/i18n/<locale>/<version>.json` (version from `package.json`). No
   pending notes: no file. `package.json` `files` has `release-notes` so the notes ship on npm.
3. **Site Worker.** `keepNotes` (`worker/cms-update.js`) reads `package/release-notes/i18n/<locale>/<v>.json` for
   each version it keeps, with the existing `fileFromTar`. It adds them to `cms:notes:<v>` as `notes`.
4. **Status.** `cmsStatus` also returns `installed`: the notes of the versions the last update brought. These are
   the versions after `cms:update.from` up to and including the running version, when `cms:update.to` is the
   running version and its state is `done`. Else: the notes of the running version only, when KV has them.
5. **Editor.** The Morpheme page shows a group "New in your version" with `installed`, above the button. The
   existing "What's new" group stays for coming versions. Each note with `notes` shows as a `ReleaseNoteCard` in
   the editor's locale (fallback `en-US`). A version without `notes` shows its `text`, as now.

## Reused

- `lib/changelog.mjs`: `gunzip`, `fileFromTar` (read files from the tarball).
- `worker/cms-update.js`: `keepNotes`, `cmsStatus`, `cms:update` (`from`, `to`, `state`).
- `src/CmsPage.tsx`: the page, `Group`, `ListItem` fallback.
- `src/UpdateLink.tsx`: the link from the start screen's notice to `#morpheme` (no change).
- `src/i18n`: `locale` for the language choice.

## New

| Path | What |
|---|---|
| `lib/releaseNotes.mjs` | pure: `problemsOf(pending)`, `released(pending, version)`, `notesFor(notes, locale)`, `installedVersions(update, running, kept)` |
| `lib/releaseNotes.test.mjs` | unit tests |
| `scripts/release-notes.mjs` | moves pending notes to the version file at release |
| `scripts/check-release-notes.mjs` | fails on a missing twin or an empty field |
| `src/ReleaseNoteCard.tsx` | one note: title, then Why, How, What |
| `src/i18n/*/cms.ts` | texts: `newInYourVersion`, `why`, `how`, `what` |

## Tests

- `problemsOf`: twin missing, id differs from file name, empty field, all good.
- `released`: two notes become one `ReleasedNotes` per locale with the version; no notes gives nothing.
- `notesFor`: the locale's notes; fallback to `en-US`; no `notes` gives `undefined`.
- `installedVersions`: update done to running gives the range; update to another version gives only running;
  no update gives only running; versions not in KV are left out.
- `ReleaseNoteCard` and the page wiring are thin UI. Check them by hand: a screenshot of `#morpheme` in
  `morpheme-staging` with seed notes in English and Danish.

## Writing rule

`.changeset/README.md` and the `release` skill get the rule: friendly, "you", present tense, Why then How then
What, one or two short sentences each, English and Danish, only for changes a site owner sees.
