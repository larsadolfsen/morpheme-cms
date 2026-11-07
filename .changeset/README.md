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

- `card`: a main change. A screenshot, a title and 1–3 short sentences. The sentences start with why, then how, then
  what. No labels.
- `line`: a smaller change. One short sentence, shown in the list "Also in this version".

Files, per language:

- `release-notes/i18n/<locale>/pending/<id>.json`: the note. A card has `id`, `kind`, `title` and `text`. A line has
  `id`, `kind` and `text`.
- `release-notes/i18n/<locale>/pending/<id>.webp`: the screenshot. Only for a card.

Screenshot: the editor 375 CSS pixels wide, at most 400 CSS pixels high, device scale factor 2, so 750 px wide and at
most 800 px high. Crop it to the part that changed. Save it as WebP, at most 200 KB. Take one per language, with the
editor in that language.

Writing rule:

- Friendly and direct: address the owner as "you", in present tense.
- Write English first, then Danish in the informal form of "you", with the same meaning.
- Keep it short. A card's text is 1–3 sentences. A line is one sentence.

Example card (English):

> [screenshot of the start screen]
> **Pick up where you left off**
> You shouldn't have to hunt for the page you were just working on. Your last three pages and posts now wait at the
> top of the start screen. Tap one to jump straight back in.

Example lines:

> Also in this version
> - Open website opens in a new window.
> - The text toolbar no longer scrolls sideways on a phone.
## Editions

Each release can be an edition named after a place: a nature photo from [Unsplash](https://unsplash.com) and the name of
where it was taken. After an update, the start screen shows the photo and "Morpheme <name> <version>" in a small card.

- `release-notes/editions/<version>.json`: `name` (the place, short, in the card's headline), `place` (the full place
  per locale, `en-US` and `da-DK`, the card's subhead) and `photo` (`by`, `source` and `license`).
- `release-notes/editions/<version>.webp`: the photo, 1280 × 720 px, at most 200 KB. The card crops it from the
  middle: 3:2 above the text on a phone, a 2:3 portrait beside it on larger screens.

A version shows the newest edition whose version is at most its own, so an edition keeps its photo and name until the
next release adds a new one.
