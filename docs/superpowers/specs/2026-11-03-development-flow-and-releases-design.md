# Development flow and releases for @morphemecms/cms

> **Changed 3 November 2026:** npm's trusted publisher for `publish.yml` allows only *staged publishing*, so where
> this design says a workflow *publishes* to `next` or `latest`, it stages the version (`npm stage publish`), and the
> version is on npm once the owner approves it with 2FA on npmjs.com. The deploy hook, the tag and the GitHub release
> follow the approval. Details in Task 4 of the plan.

> **Status:** design, approved by the owner on 3 November 2026. Covers `larsadolfsen/morpheme-cms` and a new staging
> site. Out of scope: moving the CMS's source out of `morpheme-website`'s `packages/editor/` (the owner's own work),
> the release flow of `morpheme-apps`, and the editor's own update check (step 6 in `docs/platform.md` in
> `morpheme-website`).

## Why

The package is about to be on npm, and every site follows it: the editor updates itself to a new minor or patch
version. So a version on npm's `latest` tag reaches every site. Merging a pull request and releasing a version must
therefore be two separate steps, and the owner must be able to use the unreleased CMS on a real site before it is
released. Today `.github/workflows/publish.yml` publishes when a GitHub release is made, and nothing runs the checks on
a pull request; `docs/platform.md` says instead that a raised version merged to `main` publishes. This design replaces
both.

## The flow in one image

```text
branch claude/<task> ──PR──► main ──(each merge)──► npm @next  ──deploy hook──► morpheme-staging (owner tries it)
   CI: checks + changeset     │
                              └──(Changesets keeps a "Release x.y.z" PR open)
                                        │ owner says go, PR merged
                                        ▼
                                   npm @latest + tag vX.Y.Z + GitHub release ──► every site's editor offers the update
```

Two sites show unreleased code, each for its own purpose:

| Site | Built from | For |
| --- | --- | --- |
| `morpheme-demo` (exists, `wrangler.jsonc` at the root) | the repository itself, `main` and every branch (Cloudflare's branch previews) | looking at a change, also before it is merged; its repository is made up, so saving does not work |
| `morpheme-staging` (new) | `@morphemecms/cms@next` from npm | using the next version exactly as a customer would: install from npm, log in, edit, save |

## 1. Day-to-day work in morpheme-cms

- One branch per task from the latest `main` (`claude/<task>`), one pull request into `main`, as `CLAUDE.md` in
  Interstellar says. The owner is asked before it is merged (*Skal jeg hente, flette og pushe?*).
- **CI on every pull request** (`.github/workflows/check.yml`, new): `npm ci`, then the CMS's checks
  (`npm run check`, `check:screens`, `check:starter`, `check:demo`), and `npx changeset status --since=origin/main`,
  which fails when the pull request has no changeset. Actions are free here because the repository is public (the
  exception in *Ingen betaling til GitHub*). **Depends on** the checks running from this repository's root; until the
  owner's move of the source is done, `check.yml` runs only the checks that already run here, and each one is added
  when it does.
- **Branch protection on `main`:** the `check` job must pass, no direct pushes. The Release PR (section 4) is opened
  by Actions' own token, so GitHub holds its check until someone approves the run (`action_required`); `check.yml`
  skips the changeset step on `changeset-release/main`, as the Release PR removes the changesets. Then it merges
  like any pull request. **Delete branch on merge** is turned on.
- **A changeset per pull request.** `npx changeset` writes `.changeset/<random-name>.md`; a pull request that changes
  nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.
- **A merge never publishes `latest`.**

### Data: the changeset file

Changesets' own format; the file name is its unique id, made by the tool:

```markdown
---
'@morphemecms/cms': minor
---

Add a label button for headings to the text menu.
```

- `patch`, `minor` or `major`, by the same rules as an app's version (*Appbutikken* in `CLAUDE.md` in
  `morpheme-website`): major only when something a site has stops working as before.
- The line below is the release note, in English, written for the owner of a site, as the editor shows it.
- `.changeset/config.json` holds the tool's settings: `"access": "public"`, `"baseBranch": "main"`,
  `"changelog": "@changesets/changelog-git"`, and `"snapshot": { "useCalculatedVersion": true,
  "prereleaseTemplate": "{tag}-{datetime}" }`.

The changesets of a release become one section of `CHANGELOG.md` (with the version as its heading) and the files are
deleted. `CHANGELOG.md` is in the package (`files` in `package.json`), so a site has the notes of the version it is
offered in `node_modules/@morphemecms/cms/CHANGELOG.md`, and the GitHub release carries the same section.

## 2. The test channel: @next

On each push to `main` that leaves changesets pending, the workflow:

1. `npx changeset version --snapshot next` — the version becomes, for example, `0.2.0-next-20261104093012`
   (the version the pending changesets add up to, then `next` and the time). Only in the workflow's checkout;
   nothing is committed.
2. `npx changeset publish --tag next --no-git-tag` — publishes it under npm's `next` tag, with trusted publishing.
   npm's ranges (`^0.1.0`) never match a prerelease, and sites follow `latest`, so no site gets it by itself.
3. `curl -X POST "$STAGING_DEPLOY_HOOK"` — starts a build of `morpheme-staging` (Cloudflare's Deploy Hooks).

A push that leaves no changeset pending (the Release PR's merge, or only empty changesets) publishes nothing here.

## 3. The staging site: morpheme-staging

- A new private repository `larsadolfsen/morpheme-staging`, made the way any site is made from the starter (its
  README, *Deploy to Cloudflare*), with the demo's content (`demo/` laid on the starter, as `demo-site.mjs` does), so
  there is something to edit from day one.
- Its Worker in Cloudflare is `morpheme-staging`, on `workers.dev`, with the KV, D1 and crons a real site has, and its
  own login to GitHub as the starter's setup describes: saving in the editor commits to `morpheme-staging`.
- In its `package.json` the dependency is `"@morphemecms/cms": "next"`. Its build command (`build.command` in its
  `wrangler.jsonc`) is `npm install @morphemecms/cms@next --no-save && npm run check && npm run build`, so every build
  takes the newest `@next` without a commit, and a version that breaks the checks is not deployed.
- A **Deploy Hook** for its `main` branch (Cloudflare: *Settings › Builds › Deploy Hooks*), its URL saved as the
  Actions secret `STAGING_DEPLOY_HOOK` in `morpheme-cms`.

## 4. The stable release

- On each push to `main` with changesets pending, `changesets/action` opens or updates one pull request,
  **Release x.y.z**: the version in `package.json` raised, the changesets moved into `CHANGELOG.md`.
- When the owner has tried the change on staging and says go, the Release PR's check is approved and, once it
  passes, the Release PR is merged (see section 1).
- That push has no changesets pending and a version npm does not have, so the same action runs
  `npx changeset publish`: it publishes to `latest` with trusted publishing, tags `vX.Y.Z`, and makes the GitHub
  release with the version's section of `CHANGELOG.md`.
- `morpheme-website` and Sara's site follow `latest`, as `docs/platform.md` already says.

### /release: the skill that does it

The owner releases by typing `/release` in a session in `morpheme-cms`. The skill is
`.claude/skills/release/SKILL.md` in this repository (so cloud sessions have it too) and runs the same gated steps
each time:

1. **Take stock (read-only):** the open Release PR (`gh pr list --head changeset-release/main`): its version and the
   section of `CHANGELOG.md` it adds; `npm view @morphemecms/cms dist-tags`: the `next` staging runs and the current
   `latest`; the newest build of the Worker `morpheme-staging` (Cloudflare connector, read-only). Stops and says why
   when there is no Release PR, or staging's newest build failed or does not run the newest `next`.
2. **Ask** with the question box: *Release X.Y.Z to every site?*, with the release notes. Always asked, also with the
   standing go-ahead to merge: a merge reaches `main`, a release reaches every site. No answer is no.
3. **Merge** the Release PR: approve its held `Check` run, wait for it to pass, then `gh pr merge <n> --merge`.
4. **Watch** the Publish run (`gh run watch`), then check that `dist-tags.latest` is X.Y.Z and that the tag `vX.Y.Z`
   and its GitHub release exist.
5. **Report** the version, its notes and the links (npm, GitHub release). A failing step is reported with its output
   verbatim and nothing is retried or republished by hand.

Every command the skill shows the owner starts with `cd` into `morpheme-cms`. The skill never runs `npm publish`
itself, never bumps a version by hand, and never merges anything but the Release PR.

## The workflows

| File | When | What |
| --- | --- | --- |
| `.github/workflows/check.yml` (new) | each pull request into `main` | the checks and `changeset status` (section 1) |
| `.github/workflows/publish.yml` (rewritten) | each push to `main` | job `release`: `changesets/action` (Release PR, or the stable publish); job `next`: the snapshot and the deploy hook (section 2), only when changesets are pending |

Both publishing jobs stay in `publish.yml`, because npm's trusted publishing trusts one workflow file per package. The
existing file's setup is kept: Node 24, npm 11 (trusted publishing needs 11.5.1 or newer), `id-token: write`, and
`npm ci`, whose `prepack` writes the types. `publish.yml` gets `contents: write` and `pull-requests: write` for the
Release PR, tags and GitHub release, with Actions' own token.

## Security

- **No npm key anywhere:** both publishes use trusted publishing, as today.
- **`STAGING_DEPLOY_HOOK` is a key:** anyone with the URL can start builds of `morpheme-staging`, and nothing else.
  It lives only as an Actions secret in `morpheme-cms`, used only by the push-to-`main` job, which pull requests from
  forks never run, so they cannot read it. If it leaks: delete the hook in Cloudflare and make a new one.
- **Before** trusted publishing works, the owner publishes 0.1.0 by hand once and turns on trusted publishing for
  `publish.yml` on npmjs.com (step 1 in `docs/repositories.md` in `morpheme-website`).

## What this reuses

- `publish.yml`'s trusted publishing setup (kept, its trigger changed).
- The starter and `demo-site.mjs` for the staging site; nothing new in the package for it.
- The version rules for apps (*Appbutikken*) as the rules for a changeset's patch/minor/major.
- `morpheme-demo` and Cloudflare's branch previews for looking at a branch, unchanged.
- New: Changesets (`@changesets/cli`, `@changesets/changelog-git`, `changesets/action`), the most used tool for this on
  npm; two workflow files; the repository `morpheme-staging`.

## How it is verified

Workflows cannot be unit-tested here, so each step of the plan ends with something the owner can watch:

- a pull request without a changeset shows a red `check`; with one, green;
- after a merge, `npm view @morphemecms/cms dist-tags` shows a new `next`, and the build of `morpheme-staging` in
  Cloudflare is *Triggered by* the deploy hook and runs that version (its editor's *About* or the build log);
- the Release PR shows the raised version and `CHANGELOG.md`; after its merge, `dist-tags` shows the new `latest`, the
  tag `vX.Y.Z` and the GitHub release exist, and `next` is not published again.

## Open questions

- **0.x versions:** for npm, `^0.1.0` allows only `0.1.x`, so a minor release of 0.x is not taken by a site's
  `npm install` range, whatever the editor does. Whether the first stable release should be 1.0.0 is the owner's
  call, made with the editor's update check.
- `docs/platform.md` (*Udgivelse*) and `AGENTS.md` here describe the old trigger; they are updated in the same plan.
