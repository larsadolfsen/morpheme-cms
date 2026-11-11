---
name: release-notes
description: Use when a change is something a site owner sees, and so needs a release note, or when a release note, an edition or the notes of a version are written or fixed - "release note", "New in", "card", "paragraph", "line", "edition", "udgivelsesnote". Holds the rules for the notes in both languages, their files, screenshots and writing.
---

# Release notes for @morphemecms/cms

Announce "Using release-notes". Every pull request into `main` has a changeset (`CLAUDE.md`, "Changesets and release
notes"); this skill is how its release note is written. Read it whenever a change is something a site owner sees, and
before writing or changing any note or edition.

**Style: look at the notes of 0.14.0** (`release-notes/i18n/en-US/0.14.0.json`). A paragraph's title says what the owner
can do, with a verb first (*Pause an app without losing its settings*, *See your page as Google shows it*). Its text
says what is new (*You can now …*, *… now looks like …*), then where to find it (*Open the app under Apps …*). Lines are
short and name the change plainly. Those cards have no screenshot.

**Paragraphs (`card`) are for two kinds of change:** a change the owner sees (a new screen, a new feature, a new way to
do something), and a **selling point for choosing Morpheme over other ways to run a site, such as WordPress**: safer,
faster, cheaper to run or easier to keep, even when the owner cannot see it. Apps running in a sandbox is one, because
it is a main reason to choose Morpheme and shows nowhere. Every such change gets its own paragraph, never a line. A
paragraph for a selling point says what the owner is now protected from or free to do, in the owner's words, and where
the owner can see the proof if there is one; it names the benefit, not the other product.

A paragraph for a change that cannot be seen has no screenshot in a released version's file, as the cards of 0.14.0 have
none. A note that is still pending needs one (`npm run check:release-notes`), so ask the owner before writing such a
note as pending.

A change a site owner sees, and every selling point, gets a note in both languages, English (`en-US`) and Danish (`da-DK`). Developer-only changes
get no note. The note's `id` is this changeset's file name without `.md`, for example `brave-cats-run`. A note has one
of two kinds:

- `card` (a *paragraph* on the Morpheme page's "New in" page): a main change, one an owner would go looking for, such as
  a new screen, a new feature or a new way to do something, or a selling point (see above). A title and 1–3 short sentences: what the owner gets first,
  then where to find it. No labels. The screenshot shows only on the start screen's update card; the "New in" page shows
  the title and the text.
- `line`: a smaller change, such as a tweak to something the owner already uses, or a fix. One short sentence with no
  period, shown in the list "Also in this version".

A version can have any number of paragraphs and lines: one paragraph for each main change, and a line for each smaller
one. A note says only what is new in its own version. It never explains a feature from an earlier version again. Several
changes to the same screen or feature are one note.

Only a released version has notes. A note is written as pending in its pull request, while the change is on the `next`
tag. The Release pull request moves everything pending into the file of the version it releases, so the changes of
several merges, and of every test version since the last release, end up in that one released version. A test version
has no notes file of its own: the Morpheme page shows the pending notes under the version it leads to.

Files, per language:

- `release-notes/i18n/<locale>/pending/<id>.json`: the note. A `card` has `id`, `kind`, `title` and `text`. A line has
  `id`, `kind` and `text`.
- `release-notes/i18n/<locale>/pending/<id>.webp`: the screenshot. Only for a `card`.

Screenshot: the editor 375 CSS pixels wide, at most 400 CSS pixels high, device scale factor 2, so 750 px wide and at
most 800 px high. Crop it to the part that changed. Save it as WebP, at most 200 KB. Take one per language, with the
editor in that language.

Writing rule: the skill `site-editor-writing` (in `larsadolfsen/morpheme-website`,
`.agents/skills/site-editor-writing/SKILL.md`), the same as for the editor's own texts. In short:

- Say what the owner gets, in the owner's words: the key word first, *you*, present tense, active voice. Use the
  editor's own names for screens and buttons (`src/i18n/`), never internal names (*build*, *Worker*, *KV*).
- Don't open with what the owner wants (*You want to …*, *Sometimes you want …*); say what's new.
- Sentence case, contractions with `’`, no *we*, no em dash, no `!`.
- Write English first, then Danish written as a Danish app says it, not word for word, with the editor's fixed words
  (*Aktiveret*, *Indstillinger*, *hjemmesiden*).
- Keep it short. A card's text is 1–3 sentences. A line is one sentence.

Example paragraph (`card`, English):

> [screenshot of the start screen]
> **Pick up where you left off**
> Your last 3 pages and blog posts now wait at the top of the start screen. Tap one to jump straight back in.

Example lines:

> Also in this version
> - Open website opens in a new window
> - On a phone, the text toolbar no longer scrolls sideways

## Editions

Each minor line is an edition named after a place: one free nature photo from [Unsplash](https://unsplash.com) (never
Unsplash+) and the name of where it was taken, for every version of the line (0.14.0, 0.14.1, … and its test versions).
After an update, the start screen shows the photo and "Morpheme <name> <version>" in a small card; the Morpheme page
shows it under the line's newest version.

- `release-notes/editions/<line>.json` (e.g. `0.14.json`): `name` (the place, short, in the card's headline), `place`
  (the full place per locale, `en-US` and `da-DK`, the card's subhead) and `photo` (`by`, `source` and `license`).
- `release-notes/editions/<line>.webp`: the whole photo, uncropped as on Unsplash, 1280 px wide, at most 200 KB. Its
  page under Licenses shows all of it; the card crops it to 3:2 from the middle: above the text on a phone, beside it
  on larger screens.

A new minor line needs a new edition; a line without one shows no photo. An edition may leave out its `name`, `place`
and `photo.by` when they aren't known: its heading is then "New in Morpheme <version>", and the photo is credited to
Unsplash ("Photo from Unsplash", and "Unsplash" under Licenses).
