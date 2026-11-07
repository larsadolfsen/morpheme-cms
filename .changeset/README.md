# Changesets

Every pull request into `main` has one file here, made with `npx changeset`: whether it is a `patch`, `minor` or
`major` change of `@morphemecms/cms` (the rules of *Appbutikken* in `morpheme-website`'s `CLAUDE.md`: major only when
something a site has stops working as before) and one line of release note, in English, for a site's owner. A pull
request that changes nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.

Each merge stages a test version for npm's `next` tag for `morpheme-staging`; the *Release* pull request, merged
when the owner says go, turns the files here into `CHANGELOG.md` and stages `latest`. A staged version is on npm once
the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`).

## Release notes for owners (Why, How, What)

A change a site owner sees also gets two note files under `release-notes/i18n/`, one per language, with the same
`id` as this changeset's file name (without `.md`): `en-US/pending/<id>.json` and `da-DK/pending/<id>.json`. Each file
has `id`, `title`, `why`, `how` and `what`. Developer-only changes get no note.

Writing rule:

- Friendly and direct: address the owner as "you", in present tense.
- Order: Why, then How, then What. One or two short sentences for each part.
- Write English first, then Danish in the `du` form, with the same meaning and natural Danish.

Example (English):

> **Pick up where you left off**
> Why: You shouldn't have to hunt through the menu for the page you were just working on.
> How: Open the editor. Your last three pages and posts wait for you at the top. Tap one to jump straight back in.
> What: The start screen has a new "Continue where you left off" card.