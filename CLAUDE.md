# CLAUDE.md

Read `AGENTS.md` first. It describes this repository, the roles and the checks. This file holds the rules that apply to
every Claude session here, whatever the task.

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

## The merging session also watches the Cloudflare builds

One session is responsible for merging pull requests. That session also keeps an eye out for failed Cloudflare builds:
the `Workers Builds: …` check on every pull request and on `main` (the demo, `morpheme-demo`), and the builds of
`morpheme-staging` and of the sites that install the `next` version. A failed build is never left unmentioned. The
session reads the build log, finds the cause and says which change caused it. Then it either has a fix made, in a
session in the repository that owns the fix and as a normal pull request, or it tells the owner exactly what failed and
what it needs. It does not deploy or run `wrangler` against the live Cloudflare account itself.
