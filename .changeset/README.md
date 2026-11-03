# Changesets

Every pull request into `main` has one file here, made with `npx changeset`: whether it is a `patch`, `minor` or
`major` change of `@morphemecms/cms` (the rules of *Appbutikken* in `morpheme-website`'s `CLAUDE.md`: major only when
something a site has stops working as before) and one line of release note, in English, for a site's owner. A pull
request that changes nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.

Each merge stages a test version for npm's `next` tag for `morpheme-staging`; the *Release* pull request, merged
when the owner says go, turns the files here into `CHANGELOG.md` and stages `latest`. A staged version is on npm once
the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`).