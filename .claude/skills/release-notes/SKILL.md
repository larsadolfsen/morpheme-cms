---
name: release-notes
description: Use when a change is something a site owner sees, and so needs a release note, or when a release note, an edition or the notes of a version are written or fixed - "release note", "New in", "paragraph", "line", "edition", "udgivelsesnote". Holds the rules for the notes in both languages, their files and writing.
---

# Release notes for @morphemecms/cms

Announce "Using release-notes". Every pull request into `main` has a changeset (`CLAUDE.md`, "Changesets and release
notes"); this skill is how its release note is written. Read it whenever a change is something a site owner sees, and
before writing or changing any note or edition.

**Style: we write release notes like 0.14.0** (`release-notes/i18n/en-US/0.14.0.json`). A paragraph's title says what the owner
can do, with a verb first (*Pause an app without losing its settings*, *See your page as Google shows it*). Its text
follows *why, how, what* (see "Writing a paragraph" below). Lines are
short and name the change plainly. Notes have no screenshots: the paragraphs of 0.14.0 have none.

A version's notes have exactly two sections: **New in <version>**, the paragraphs, and **Also in this version**, the lines.
The UI says these two names on the Morpheme page and in the release post; keep to them.

**Paragraphs (`paragraph`) are for two kinds of change, never a line:** every change the owner sees, in how the editor or the site looks or works (a new screen, a new feature, a new way to
do something), and a **selling point for choosing Morpheme over other ways to run a site, such as WordPress**: safer,
faster, cheaper to run or easier to keep, even when the owner cannot see it. Apps running in a sandbox is one, because
it is a main reason to choose Morpheme and shows nowhere. Every such change gets its own paragraph, never a line. A
paragraph for a selling point says what the owner is now protected from or free to do, in the owner's words, and where
the owner can see the proof if there is one; it names the benefit, not the other product.

A change a site owner sees, and every selling point, gets a note in both languages, English (`en-US`) and Danish (`da-DK`). Developer-only changes
get no note. The note's `id` is this changeset's file name without `.md`, for example `brave-cats-run`. A note has one
of two kinds:

- `paragraph` (under "New in <version>" on the Morpheme page): every change to how the editor or the site looks, a new
  screen, feature or way to do something, and every selling point (see above). A title and 1–3 short sentences: what the owner gets first,
  then where to find it. No labels, no screenshot.
- `line`: every other change, such as a small tweak that changes neither how the editor or the site looks nor what Morpheme
  has over other ways to run a site, or a fix. One short sentence with no
  period, shown in the list "Also in this version".

A version can have any number of paragraphs and lines: one paragraph for each main change, and a line for each smaller
one. A note says only what is new in its own version. It never explains a feature from an earlier version again. Several
changes to the same screen or feature are one note.

Only a released version has notes. A note is written as pending in its pull request, while the change is on the `next`
tag. The Release pull request moves everything pending into the file of the version it releases, so the changes of
several merges, and of every test version since the last release, end up in that one released version. A test version
has no notes file of its own: the Morpheme page shows the pending notes under the version it leads to.

Files, per language:

- `release-notes/i18n/<locale>/pending/<id>.json`: the note. A `paragraph` has `id`, `kind`, `title` and `text`. A line has
  `id`, `kind` and `text`.

A note has no screenshot. `npm run check:release-notes` reports a leftover `<id>.webp` next to a pending note: delete it.

Writing rule: the skill `site-editor-writing` (in `larsadolfsen/morpheme-website`,
`.agents/skills/site-editor-writing/SKILL.md`), the same as for the editor's own texts. In short:

- Say what the owner gets, in the owner's words: the key word first, *you*, present tense, active voice. Use the
  editor's own names for screens and buttons (`src/i18n/`), never internal names (*build*, *Worker*, *KV*).
- Don't open with what the owner wants (*You want to …*, *Sometimes you want …*); say what's new.
- Sentence case, contractions with `’`, no *we*, no em dash, no `!`.
- Write English first, then Danish written as a Danish app says it, not word for word, with the editor's fixed words
  (*Aktiveret*, *Indstillinger*, *hjemmesiden*).
- Keep it short. A paragraph's text is 2–3 sentences, about 45 words at most. A line is one sentence.

Example paragraph: see *Before / After* in "Writing a paragraph: why, how, what" below.

Example lines:

> Also in this version
> - Open website opens in a new window
> - On a phone, the text toolbar no longer scrolls sideways

## Writing a paragraph: why, how, what

Every `paragraph` follows **why, how, what**, in this order, in 2–3 sentences and **at most about 45 words per language**
(the title does not count). Read the changeset and the code of the change first, so each part is true, not guessed.

1. **Why** (one sentence, first): the problem the owner has, or the gain the owner gets, in the owner's words. Not
   *You can now …*, and not what the owner wants (*You want to …*): name the gain (*Long lists no longer push the
   page down.*).
2. **How** (what the owner does): where to find it and what to press, with the exact UI words from the language files in
   `src/i18n/` (`Insert`, `Max rows`, `Show more`), never an internal name.
3. **What** (what is in it, and what stays as it was): the choices it has, or that earlier pages and settings are
   unchanged. Leave it out only when the why and how already say it.

Rules: active voice, present tense, *you*; concrete (a screen, a button, a number), no filler (*now*, *new*, *also*,
*easier*) unless it carries meaning. **One subject per paragraph**: a second feature, a second screen or a second block is
its own note, a paragraph or a `line`. The title starts with a verb and names the owner's gain (*Keep long lists short*), not the feature.

A selling point (see above) follows the same order: the why is what the owner is protected from or free to do, the how is
where the proof is, the what is what stays the owner's.

Before (bad: no why, three subjects, a name-list instead of a reason):

> **Fold out rows in a Segmented list**
> The new Segmented list folds each row out to show its text and link. You can keep only one row open, or show just the
> first rows with a Show more button for the rest. The FAQ list gets the same button, and Insert now groups the blocks by
> what they do.

After (why, how, what; the other subjects are their own notes):

> **Keep long lists short**
> A long list no longer fills the page. Add a Segmented list, set Max rows, and visitors open each row to read its text and
> link, and press Show more for the rest. Turn on Only one open to close the last row when the next one opens.

Danish: the same three parts in the same order, written as a Danish app says it (not word for word), with the editor's
Danish words from `src/i18n/da-DK/`, and the same length cap. Keep `id` and
`kind` the same in both languages.

## Editions

Each minor line is an edition named after a place: one free nature photo from [Unsplash](https://unsplash.com) (never
Unsplash+) and the name of where it was taken, for every version of the line (0.14.0, 0.14.1, … and its test versions).
After an update, the start screen shows the photo and "Morpheme <name> <version>" in a small message; the Morpheme page
shows it under the line's newest version.

- `release-notes/editions/<line>.json` (e.g. `0.14.json`): `name` (the place, short, in the update message’s headline), `place`
  (the full place per locale, `en-US` and `da-DK`, the update message’s subhead) and `photo` (`by`, `source` and `license`).
- `release-notes/editions/<line>.webp`: the whole photo, uncropped as on Unsplash, 1280 px wide, at most 200 KB. Its
  page under Licenses shows all of it; the update message crops it to 3:2 from the middle: above the text on a phone, beside it
  on larger screens.

A new minor line needs a new edition; a line without one shows no photo. An edition may leave out its `name`, `place`
and `photo.by` when they aren't known: its heading is then "New in Morpheme <version>", and the photo is credited to
Unsplash ("Photo from Unsplash", and "Unsplash" under Licenses).
