# Changesets

Every pull request into `main` has one file here, made with `npx changeset`: whether it is a `patch`, `minor` or
`major` change of `@morphemecms/cms` (the rules of *Appbutikken* in `morpheme-website`'s `CLAUDE.md`: major only when
something a site has stops working as before) and one line of release note, in English, for a site's owner. A pull
request that changes nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.

Each merge stages a test version for npm's `next` tag for `morpheme-staging`; the *Release* pull request, merged
when the owner says go, turns the files here into `CHANGELOG.md` and stages `latest`. A staged version is on npm once
the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`).

## Release notes for owners

A change a site owner sees gets a note in both languages, English (`en-US`) and Danish (`da-DK`). Developer-only changes
get no note. The note's `id` is this changeset's file name without `.md`, for example `brave-cats-run`. A note has one
of two kinds:

- `card`: a main change. A screenshot, a title and 1–3 short sentences: what the owner gets first, then where to find
  it. No labels.
- `line`: a smaller change. One short sentence with no period, shown in the list "Also in this version".

Files, per language:

- `release-notes/i18n/<locale>/pending/<id>.json`: the note. A card has `id`, `kind`, `title` and `text`. A line has
  `id`, `kind` and `text`.
- `release-notes/i18n/<locale>/pending/<id>.webp`: the screenshot. Only for a card.

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

Example card (English):

> [screenshot of the start screen]
> **Pick up where you left off**
> Your last 3 pages and blog posts now wait at the top of the start screen. Tap one to jump straight back in.

Example lines:

> Also in this version
> - Open website opens in a new window
> - On a phone, the text toolbar no longer scrolls sideways