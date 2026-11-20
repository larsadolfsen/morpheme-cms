# Release notes: cards with screenshots

Date: 2026-11-07. Status: agreed with the owner in chat. Revision 2: cards with a screenshot and a list of the other
changes replace the labelled Why, How and What parts. Revision 3: the notes of the running minor line come from the installed
package, not from KV.

## Goal

The editor tells a site owner what changed in each release. A main change gets a card: a screenshot, a title and a
short friendly paragraph. Each other change gets one short line in a list under the cards. All notes are in the
editor's language (English and Danish). `CHANGELOG.md` stays the developer log.

## Problem now

- The "Morpheme is updated to 0.13.0" link opens the Morpheme page (`#morpheme`). That page shows notes only for
  versions newer than the running one. After an update, the notes of the new version do not show.
- A site that got its version in another way than the Worker's update (for example a rebuild) has no `cms:notes:<v>`
  key. The page then shows no notes for the running version.
- The notes are the raw `CHANGELOG.md` section in one `ListItem`. They are for developers and only in English.

## Decisions

| Question | Decision |
|---|---|
| Language | English and Danish. Each note has the two languages. |
| Scope | Only changes that a site owner sees. Developer-only changes get no note. |
| Main change | A card: screenshot, title, a paragraph of 1–3 sentences. No labels. |
| Other change | One short line in the list "Also in this version". |
| Screenshot | One per language, so the image shows the editor in the reader's language. |
| Image source | The site's own Worker. The editor makes no third-party request. |
| 0.13.0 and older | No new notes. The page shows the old text for these versions. |
| Tone | Friendly, "you", present tense. A card paragraph starts with why, then how, then what. |

Example card (English):

> [screenshot of the start screen]
> **Pick up where you left off**
> You shouldn't have to hunt for the page you were just working on. Your last three pages and posts now wait at the
> top of the start screen. Tap one to jump straight back in.

Example lines:

> Also in this version
> - Open website opens in a new window.
> - The text toolbar no longer scrolls sideways on a phone.

## Data model

A note is one change in one language. The `id` connects the languages of one change.

```ts
/** One change, in one language. */
type ReleaseNote =
  | { id: string; kind: 'card'; title: string; text: string; image?: string } // image: URL, set by the Worker only
  | { id: string; kind: 'line'; text: string };

/** The notes of one released version, in one language. */
type ReleasedNotes = { version: string; notes: ReleaseNote[] };
```

- `id`: the changeset's file name without `.md`, e.g. `brave-cats-run`. Unique in the repo.
- `image` is never in a JSON file. The screenshot is a file next to the note, found by its `id`. The Worker sets `image`
  for the versions to come. `bundledNotes` sets `image` for the running minor line.

Files (Danish must be under an `i18n/da-DK/` path, else `check:language` fails):

| Path | Content | Written by |
|---|---|---|
| `release-notes/i18n/<locale>/pending/<id>.json` | one `ReleaseNote` without `image` | the pull request |
| `release-notes/i18n/<locale>/pending/<id>.webp` | the card's screenshot, only for `kind: 'card'` | the pull request |
| `release-notes/i18n/<locale>/<version>.json` | one `ReleasedNotes` | `release:version` |
| `release-notes/i18n/<locale>/<version>/<id>.webp` | the released screenshots | `release:version` |

Rules (checked by `check:release-notes`):

- A pending note in one locale has a twin with the same `id` and the same `kind` in every other locale.
- The `id` is the file name without `.json`.
- A card has a non-empty `title` and `text`, and a `.webp` screenshot of at most 200 KB, 750 pixels wide and at most
  800 pixels high.
- A line has a non-empty `text` and no screenshot.
- A released notes file never changes. The screenshot folder of an older minor line is deleted at the next release.

Screenshot: the editor at phone width (375 CSS pixels), device scale factor 2, cropped to the part that changed, at
most 400 CSS pixels high. So the file is 750 pixels wide and at most 800 pixels high. Saved as WebP. The card shows
the whole image.

KV, in the site's Worker (`PUSH`). KV holds only the versions still to come. The notes of the running minor line are in the
installed package:

| Key | Value |
|---|---|
| `cms:notes:<version>` | `{ version, text, notes?: { 'en-US': ReleaseNote[], 'da-DK': ReleaseNote[] } }` (no `image` stored) |
| `cms:note-image:<version>:<locale>:<id>` | the WebP bytes |

`text` stays: it is the fallback for versions without notes. A KV entry of an installed version is not read. It stays
until the next self-update replaces the keys; nothing deletes it.

## Flow

1. **Pull request.** The author adds the changeset (as now). For a change a site owner sees, the author adds the note
   files in both locales: a card with its screenshots, or a line. `npm run check` runs `check:release-notes`.
2. **Release.** `release:version` runs `changeset version`, then `scripts/release-notes.mjs`. The script moves the
   pending notes of a locale into `<version>.json`, and the screenshots into `<version>/`. `package.json` `files` has
   `release-notes`, so the notes and screenshots ship on npm. The release step then deletes the screenshot folders of older
   minor lines. The package carries the screenshots of the running minor line. The repository history keeps the old ones.
3. **Site Worker.** During a self-update, `keepNotes` (`worker/cms-update.js`) reads the notes and screenshots of each
   version to come from the tarball with `fileFromTar`. It keeps the notes in `cms:notes:<v>` and each screenshot in
   `cms:note-image:...`.
4. **Images.** `GET /api/cms/note-image/<version>/<locale>/<id>` returns the WebP from KV, with the same login check as
   `/api/cms`, `Content-Type: image/webp` and a long cache time. No KV value: 404.
5. **Status.** `cmsStatus` returns `notes` (versions to come). The Worker sets `image` on each card to the URL of
   step 4. `cmsStatus` has no list of installed versions.
6. **Editor.** At build time, `src/bundledNotes.ts` reads `release-notes/i18n/<locale>/<version>.json` and the
   screenshots of the package with `import.meta.glob`, and `bundledNotes` makes `runningNotes`: one entry for every
   released version from `x.y.0` up to the running version, newest first. Another minor line and a newer version are
   left out. The Morpheme page shows a group "New in your version" with every entry of `runningNotes`, above the button, and "What's new" with the
   coming versions (`status.notes`). Per version, in the editor's locale (fallback `en-US`): the cards first
   (`ReleaseNoteCard`), then the lines under "Also in this version". A version without `notes` shows its `text`.

## Reused

- `lib/changelog.mjs`: `gunzip`, `fileFromTar`.
- `worker/cms-update.js`: `keepNotes`, `cmsStatus`, `handleCms`, `cms:update`.
- `src/CmsPage.tsx`, `src/ReleaseNotes.tsx`, `src/ReleaseNoteCard.tsx` (revision 1), `src/cmsView.mjs`.
- `src/ui.tsx` and the theme's `SiteCard`.

## New or changed

| Path | What |
|---|---|
| `lib/releaseNotes.mjs` | pure: `problemsOf(pending)`, `released(pending, version)`, `notesFor(notes, locale)`, `bundledNotes(files, images, version)`, `notesFromTar(tar, version)`, `imagePath(version, locale, id)` |
| `scripts/release-notes-pending.mjs`, `scripts/release-notes.mjs` | read and move the screenshots too |
| `src/bundledNotes.ts` | `runningNotes`: the notes and screenshots of the running minor line, read at build time |
| `worker/cms-update.js` | keep and serve the screenshots of the versions to come, set `image` |
| `src/ReleaseNoteCard.tsx` | screenshot, title, paragraph |
| `src/ReleaseNotes.tsx` | cards, then the lines |
| `src/i18n/*/cms.ts` | remove `why`, `how`, `what`; add `alsoInThisVersion` |

## Tests

- `problemsOf`: twin missing, `kind` differs, id differs from file name, card without title, text or screenshot,
  screenshot too big, line with a screenshot, all good.
- `released`: notes and screenshot paths per locale with the version; no notes gives nothing.
- `notesFromTar`: notes and screenshot bytes for both locales, one locale, none, bad JSON.
- `notesFor`: as in revision 1.
- `bundledNotes`: two locales, one locale, the whole minor line newest first, another minor ignored, a newer version
  ignored, an empty list without a file, a card with the
  screenshot address, a card without a screenshot file, a line unchanged.
- The image route and the page wiring are thin. Check them by hand: screenshots of `#morpheme` in English and Danish
  with a mocked `/api/cms`.

## Writing rule

`.changeset/README.md` and the `release` skill get the rule. Friendly, "you", present tense. A card: a short title and
1–3 sentences, starting with why, then how, then what, with no labels. A line: one short sentence. English and
Danish. Only changes a site owner sees. A card's screenshot shows the change in the editor, per language.
