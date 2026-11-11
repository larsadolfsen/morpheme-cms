# CLAUDE.md

## README files are for humans

A `README.md` is written for people. No agent reads one for rules, and no rule lives in one: the rules for agents are in
`CLAUDE.md`, and `AGENTS.md` refers to it.

## Reports to the owner are short

Write to the owner short and concise: a brief résumé of what changed and what the owner has to do or decide, in a few
lines, English only. No long explanations, tables or lists of every step. The owner asks when more is wanted.

## Only the owner releases a new version

**Only the owner releases a new version of `@morphemecms/cms`.** No agent releases, and no agent takes a step towards a
release without the owner's explicit yes in the conversation. That means:

- Never merge the Release PR (*Release @morphemecms/cms*, branch `changeset-release/main`), and never run `/release` on
  your own.
- Never approve, publish, re-tag or reject a version on npmjs.com (`npm publish`, `npm dist-tag`, the staged-packages
  page).
- Never create a version tag or a GitHub release, never run `release:version`, and never edit the `version` in
  `package.json` or `CHANGELOG.md` by hand.

Merging an ordinary pull request only stages a test version under the npm tag `next`, and the owner decides about that
version too. An agent that thinks a release is due says so to the owner and waits.

## The project manager merges, and nothing is left behind

One session is the owner's project manager (PM). It is responsible for merging pull requests, and it is responsible for
nothing being left behind. The owner has handed it these decisions, so it does not ask the owner for permission to do
work that is already assigned.

**There is always a PM.** The owner always has a PM session running that handles merges; it is never left without one.
Every other session opens its pull request, gets its `check` job green, reports the link and head sha to the PM and
leaves the merge to it. A session never merges its own pull request, and never asks the owner to merge one. If a pull
request waits and no PM seems to be running, the session tells the owner so, and the owner starts a new PM.

**When no PM is running, the orchestrator merges.** The orchestrator is the session that started the other sessions
for the owner (the owner's "To do list" session). While no PM session is active, it may merge the pull requests of the
sessions it started, under the conditions in **Merging** below, and only after it has read the diff. A PM session is
active when one exists that is not archived, also when it is idle: an idle PM gets a short message from the orchestrator
first, and the orchestrator merges nothing while the PM can still pick the pull request up. When a PM starts, it
takes over every pull request that is waiting, and the orchestrator stops merging. The orchestrator never merges the
Release PR, and the rules in **Only the owner releases a new version** apply to it as to every session. The sessions it
started still never merge their own pull requests.

**Merging.** The PM makes every merge decision, in this repository and in `morpheme-staging`. It squash-merges a pull
request when all of this holds, one pull request at a time:

- the pull request is not a draft, has no merge conflict and no unresolved review comment;
- its `check` job (`morpheme-staging`: its `Workers Builds` check) has finished green on the current head;
- its changeset keeps `@morphemecms/cms` at `0.15.x`, as the owner decided: never `major`; `minor` only while `main`
  is still at `0.14.x`, so it lands in `0.15.0`; after `0.15.0` is released only `patch` or an empty changeset.

A pull request that conflicts, has no `check` job or has the wrong changeset is not merged. The PM asks the session
that owns it to merge `main` into the branch (never a rebase, amend or force-push on someone else's branch) or to fix
the changeset, and merges when it is right. It never merges the Release PR.

**Nothing left behind.** The PM keeps one list of everything in flight and works it until it is empty: pull requests
waiting to merge, sessions that went quiet without a pull request (it starts a fresh session with the whole task in its
first prompt when a session stays stuck), release notes and changesets a merged change still lacks, follow-ups the
sessions report, branches that are fully merged, and open questions for the owner. It archives a session once its work
is merged. It tells the owner only what the owner has to do or decide, such as approving a `next` build on npmjs.com,
and which version to approve, because every merge to `main` stages a new `next` build that only the owner approves.

**Cloudflare builds.** The PM also keeps an eye out for failed Cloudflare builds: the `Workers Builds: …` check on every
pull request and on `main` (the demo, `morpheme-demo`), and the builds of `morpheme-staging` and of the sites that
install the `next` version. A failed build is never left unmentioned. The PM reads the build log, finds the cause and
says which change caused it. Then it either has a fix made, in a session in the repository that owns the fix and as a
normal pull request, or it tells the owner exactly what failed and what it needs. It does not deploy or run `wrangler`
against the live Cloudflare account itself.

## Changesets and release notes

Every pull request into `main` has one file here, made with `npx changeset`: whether it is a `patch`, `minor` or
`major` change of `@morphemecms/cms` (the rules of *Appbutikken* in `morpheme-website`'s `CLAUDE.md`: major only when
something a site has stops working as before) and one line of release note, in English, for a site's owner. A pull
request that changes nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.

Each merge stages a test version for npm's `next` tag for `morpheme-staging`; the *Release* pull request, merged
when the owner says go, turns the files here into `CHANGELOG.md` and stages `latest`. A staged version is on npm once
the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`).

### Release notes for owners

A change a site owner sees gets a note in both languages, English (`en-US`) and Danish (`da-DK`). Developer-only changes
get no note. The note's `id` is this changeset's file name without `.md`, for example `brave-cats-run`. A note has one
of two kinds:

- `card` (a *paragraph* on the Morpheme page's "New in" page): a main change, one an owner would go looking for, such as
  a new screen, a new feature or a new way to do something. A title and 1–3 short sentences: what the owner gets first,
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

### Editions

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
