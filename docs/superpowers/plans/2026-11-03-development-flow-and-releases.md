# Development flow and releases Implementation Plan

> **Status: in progress** since 3 November 2026, run by the session *Website npm package integration*.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merging a pull request and releasing a version of `@morphemecms/cms` become two steps: each merge to `main`
stages a test version for npm's `next` tag for a staging site, and a Changesets Release PR, merged when the owner
says go, stages `latest`; each is on npm once the owner approves it with 2FA.

**Architecture:** Changesets records each pull request's bump and release note in `.changeset/`. `check.yml` runs the
checks and requires a changeset on every pull request. `publish.yml` runs on each push to `main`: `changesets/action`
keeps the Release PR open (or stages `latest` when it has been merged), and a second job stages a snapshot for
`next`; each staged version is on npm only once the owner approves it with 2FA (Task 4), and then the staging site's
Cloudflare Deploy Hook is called. `morpheme-staging` is a site like any other that installs
`@morphemecms/cms@next` in each build.

**Tech Stack:** GitHub Actions (free: the repository is public), `@changesets/cli`, `@changesets/changelog-git`,
`changesets/action@v1`, npm trusted publishing with staged publishing (`npm stage publish`, npm 11.15.0+), Cloudflare
Workers Builds and Deploy Hooks.

**Spec:** `docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`

## Global Constraints

- Tasks are numbered `release-flow/<n>`, append-only.
- Repository: `larsadolfsen/morpheme-cms`; package `@morphemecms/cms`; npm tags `next` (tests) and `latest` (sites).
- No npm key anywhere: publishing uses trusted publishing only; npm trusts **one** workflow file, `publish.yml`, so
  both publishing jobs live in it. That trust allows only `npm stage publish`: every version waits for the owner's
  2FA approval on npmjs.com, which no agent ever gives.
- The only secret is `STAGING_DEPLOY_HOOK` (Actions secret in `morpheme-cms`). Never put its value in a file, a commit,
  a prompt to the local model, or the chat: the owner sets it with `gh secret set`.
- Snapshot versions: `X.Y.Z-next-<datetime>` (`"prereleaseTemplate": "{tag}-{datetime}"`, `useCalculatedVersion`).
- Changeset bumps follow *Appbutikken* in `morpheme-website`'s `CLAUDE.md`: major only when something a site has stops
  working as before. Release notes in English, for a site's owner.
- Node 24 and `npm install -g npm@^11.15.0` in every publishing job (`npm stage` needs 11.15.0).
- Every source file starts with a 2–3 line header comment (YAML files: `#` comments), as the existing workflows do.
- Repository settings, Cloudflare dashboard steps, npm settings and secrets are the **owner's** steps or need his yes
  first (Interstellar `CLAUDE.md`: confirm before outward-facing changes). Each such step says so.
- Mechanical pieces (the JSON config, the YAML boilerplate, the staging repo's file copy) go to the local model
  (Ollama `qwen3.8:27b`) per Interstellar's `CLAUDE.md`; the orchestrator reviews and runs the checks.
- One branch and one pull request per task, from the latest `main`.

## Preconditions (the owner's)

- **P1.** `@morphemecms/cms@0.1.0` is on npm, published once by hand (step 1 of `docs/repositories.md` in
  `morpheme-website`), and on npmjs.com *Settings › Trusted publishing* names `larsadolfsen/morpheme-cms` and
  workflow `publish.yml`. Blocks Task 4 and Task 5's first build. Check: `npm view @morphemecms/cms version` prints
  `0.1.0`. **0.1.0 is on npm (3 November 2026, 18:55 UTC); trusted publishing is set (3 November 2026), with the
  permission *npm stage publish* only and *Pending validation* until the first staged version, due before
  5 November 2026, 19:09 UTC (Task 4, Step 5).**

## File structure

| File | Task | Responsibility |
| --- | --- | --- |
| `.changeset/config.json` | 1 | Changesets' settings |
| `.changeset/README.md` | 1 | how to add a changeset, for agents and the owner |
| `CHANGELOG.md` | 1 | the release notes; Changesets prepends each version |
| `package.json` | 1 | devDependencies, `CHANGELOG.md` in `files` |
| `AGENTS.md` | 1, 4 | the flow for agents: a changeset per PR (1), how a release happens (4) |
| `.github/workflows/check.yml` | 2 | CI on each pull request |
| `.github/workflows/publish.yml` | 4 | Release PR, `latest`, `next`, deploy hook |
| `larsadolfsen/morpheme-staging` (new repo) | 5 | the staging site |
| `morpheme-website/docs/platform.md` | 6 | *Udgivelse* describes the new flow |
| `.claude/skills/release/SKILL.md`, `.gitignore` | 7 | `/release`: the owner's one command for a release |

---

### Task release-flow/1: Changesets in the repository

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md`, `CHANGELOG.md`
- Modify: `package.json` (`devDependencies`, `files`), `AGENTS.md` (section 3, *Samarbejdsflow*)

**Interfaces:**
- Produces: `npx changeset`, `npx changeset status --since=origin/main` (Task 2), `npx changeset version
  [--snapshot next]` and `npx changeset publish [--tag next --no-git-tag]` (Task 4); `CHANGELOG.md` in the package.

- [x] **Step 1: Install the tools**

Run: `npm install --save-dev @changesets/cli @changesets/changelog-git`
Expected: both in `devDependencies`, `package-lock.json` updated.

- [x] **Step 2: Write `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/changelog-git",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "snapshot": {
    "useCalculatedVersion": true,
    "prereleaseTemplate": "{tag}-{datetime}"
  }
}
```

- [x] **Step 3: Write `.changeset/README.md`**

```markdown
# Changesets

Every pull request into `main` has one file here, made with `npx changeset`: whether it is a `patch`, `minor` or
`major` change of `@morphemecms/cms` (the rules of *Appbutikken* in `morpheme-website`'s `CLAUDE.md`: major only when
something a site has stops working as before) and one line of release note, in English, for a site's owner. A pull
request that changes nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.

Each merge stages a test version for npm's `next` tag for `morpheme-staging`; the *Release* pull request, merged
when the owner says go, turns the files here into `CHANGELOG.md` and stages `latest`. A staged version is on npm once
the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`).
```

- [x] **Step 4: Write `CHANGELOG.md`**

```markdown
# @morphemecms/cms
```

(Changesets adds each version below this heading.)

- [x] **Step 5: Add `CHANGELOG.md` to `files` in `package.json`**, right after `"LICENSE"`:

```json
  "files": [
    "LICENSE",
    "CHANGELOG.md",
    "README.md",
```

- [x] **Step 6: Add to `AGENTS.md`**, under *Samarbejdsflow*, after item 3:

```markdown
4. **Hver pull request har en changeset** (`npx changeset`, eller `npx changeset --empty`, når intet, et site får,
   ændres): patch, minor eller major og én linjes release note på engelsk. Se `.changeset/README.md`.
```

- [x] **Step 7: Verify**

Run: `npx changeset status`
Expected: exit 0, "NO packages to be bumped".
Run: `npx changeset --empty` then `git status -s .changeset`
Expected: one new `.changeset/<name>.md` (this PR's own empty changeset).
Run: `npm pack --dry-run --ignore-scripts 2>&1 | grep -E "CHANGELOG|\.changeset"`
Expected: `CHANGELOG.md` listed; nothing from `.changeset/`.
Run: `npm run build`
Expected: the demo builds as before.

- [x] **Step 8: Commit**

```bash
git add .changeset package.json package-lock.json CHANGELOG.md AGENTS.md
git diff --cached --stat
git commit -m "Record each change's version and release note with Changesets"
```

---

### Task release-flow/2: Checks on every pull request

**Files:**
- Create: `.github/workflows/check.yml`

**Interfaces:**
- Consumes: `npx changeset status --since=origin/main` (Task 1).
- Produces: the status check named `check` (Task 3 requires it).

- [x] **Step 1: Write `.github/workflows/check.yml`**

```yaml
# The CMS's checks on each pull request into main, and that it has a changeset (.changeset/README.md), so main can
# always be released. Free here: the repository is public. The checks that still run from morpheme-website's root are
# added here as each comes to run from this repository's root.
name: Check

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          # changeset status compares with origin/main.
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm ci --no-audit --no-fund
      - name: The pull request has a changeset
        run: npx changeset status --since=origin/main
      # The demo on the starter: its content checked by the editor's rules, built, and after-build (scripts/demo-build.mjs).
      - run: npm run build
```

- [x] **Step 2: Verify on a real pull request**

Push the branch, open the PR (`gh pr create`), and run: `gh pr checks --watch`
Expected: `check` passes (this PR carries an empty changeset, Task 1 Step 7 pattern: add one with
`npx changeset --empty` if Task 1 is merged already).
Then push a temporary commit that deletes the changeset and run `gh pr checks --watch` again.
Expected: `check` fails at *The pull request has a changeset*. Revert that commit (`git revert HEAD`), push, green
again.

- [x] **Step 3: Commit** (before Step 2's push)

```bash
git add .github/workflows/check.yml .changeset
git commit -m "Run the checks on every pull request into main"
```

---

### Task release-flow/3: Protect main

**Owner's yes first:** these change `morpheme-cms`'s settings on GitHub. Ask before running them.

**Interfaces:**
- Consumes: the `check` status check (Task 2, merged).

- [x] **Step 1: Delete branches on merge**

Run: `gh api -X PATCH repos/larsadolfsen/morpheme-cms -f delete_branch_on_merge=true --jq .delete_branch_on_merge`
Expected: `true`

- [x] **Step 2: Require `check` on `main`, admins may bypass** (the Release PR's check never runs, spec section 1)

```bash
gh api -X PUT repos/larsadolfsen/morpheme-cms/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["check"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Expected: JSON with `"contexts": ["check"]` and `"enforce_admins": {"enabled": false, ...}`.

- [x] **Step 3: Verify**

Run: `gh api repos/larsadolfsen/morpheme-cms/branches/main/protection --jq '.required_status_checks.contexts'`
Expected: `["check"]`. A PR with a red `check` shows *Merging is blocked* in `gh pr view <n>`.

No commit (settings only). Record in the PR of Task 4 that this is done.

---

### Task release-flow/4: Stage next on each merge, latest from the Release PR

**Decided 3 November 2026:** npm's trusted publisher for `publish.yml` allows only `npm stage publish` (the owner
chose stage-only). So the workflow never publishes: it stages a version, and the owner approves it with 2FA on
npmjs.com (*Staged Packages*) or with `npm stage approve <stage-id>`. Only then is it on npm. Nobody but the owner
approves; an agent never does. Unapproved `next` versions can be rejected there (`npm stage reject <stage-id>`).

**Blocked by:** P1 (0.1.0 on npm, trusted publishing set to `publish.yml`), Task 1 merged.
`STAGING_DEPLOY_HOOK` is set in Task 5; until then the deploy-hook step is skipped (its `if`).
**Owner's yes first:** the repository setting *Settings › Actions › General › Workflow permissions › Allow GitHub
Actions to create and approve pull requests* must be on, or `changesets/action` fails when it opens the Release PR
(`gh api -X PUT repos/larsadolfsen/morpheme-cms/actions/permissions/workflow -f default_workflow_permissions=read
-F can_approve_pull_request_reviews=true`). Turned on with the owner's yes on 3 November 2026, after the first
Publish run failed on it.
**Deadline:** npm validates the trusted publisher with the first staged version; it must come before
**5 November 2026, 19:09 UTC** (Step 5), or the owner sets it up again.

**Files:**
- Modify (rewrite): `.github/workflows/publish.yml`
- Modify: `AGENTS.md` (section 1, the line *Udgives på npmjs.com …*)

**Interfaces:**
- Consumes: Changesets (Task 1). Secret `STAGING_DEPLOY_HOOK` (Task 5), optional.
- Produces: staged versions for npm's tags `next` and `latest` (published when the owner approves them); branch
  `changeset-release/main` with the PR *Release @morphemecms/cms*; tags `vX.Y.Z` and GitHub releases, made once
  `latest` is approved.

- [x] **Step 1: Rewrite `.github/workflows/publish.yml`**

```yaml
# On each push to main: Changesets keeps the "Release @morphemecms/cms" pull request open, and when that pull request
# has been merged, the new version is staged on npm for latest; once the owner has approved it on npmjs.com (2FA), it
# gets the tag v<version> and a GitHub release. While changesets are pending, a test version (X.Y.Z-next-<time>) is
# staged for next, and once approved, morpheme-staging is rebuilt. npm's trusted publishing trusts this one file and
# lets it only stage (npm stage publish): no key, and nothing reaches npm without the owner's approval.
name: Publish

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    # One at a time; the jobs that wait for an approval do not hold it.
    concurrency: release
    outputs:
      pending: ${{ steps.changesets.outputs.hasChangesets }}
      staged: ${{ steps.stage.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
      # npm stage publish needs npm 11.15.0 or newer.
      - run: npm install -g npm@^11.15.0
      # The types of the .mjs modules are written from their JSDoc when it is packed (prepack).
      - run: npm ci --no-audit --no-fund
      - id: changesets
        uses: changesets/action@v1
        with:
          title: Release @morphemecms/cms
          commit: Release @morphemecms/cms
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      # No changesets pending: the Release PR was merged (or nothing changed). Stage its version unless npm has it.
      - id: stage
        if: steps.changesets.outputs.hasChangesets == 'false'
        run: |
          v=$(node -p "require('./package.json').version")
          if npm view "@morphemecms/cms@$v" version >/dev/null 2>&1; then exit 0; fi
          npm stage publish --tag latest
          echo "version=$v" >> "$GITHUB_OUTPUT"

  latest:
    needs: release
    if: needs.release.outputs.staged != ''
    runs-on: ubuntu-latest
    # Waits for the owner's approval: up to six hours, then re-run this job.
    timeout-minutes: 360
    env:
      V: ${{ needs.release.outputs.staged }}
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Wait until the owner has approved it on npmjs.com
        run: until npm view "@morphemecms/cms@$V" version >/dev/null 2>&1; do sleep 60; done
      - name: Tag it and make the GitHub release with its section of CHANGELOG.md
        run: |
          git tag "v$V"
          git push origin "v$V"
          notes=$(node -e "const s=require('fs').readFileSync('CHANGELOG.md','utf8').split(/^## /m).find(x=>x.split(/\r?\n/)[0].trim()===process.env.V)||'';console.log(s.split(/\r?\n/).slice(1).join('\n').trim())")
          gh release create "v$V" --title "v$V" --notes "$notes"

  next:
    needs: release
    if: needs.release.outputs.pending == 'true'
    runs-on: ubuntu-latest
    # Waits for the owner's approval: up to six hours, then re-run this job.
    timeout-minutes: 360
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
      - run: npm install -g npm@^11.15.0
      - run: npm ci --no-audit --no-fund
      # Only in this checkout: nothing is committed.
      - run: npx changeset version --snapshot next
      - id: stage
        run: |
          npm stage publish --tag next
          echo "version=$(node -p "require('./package.json').version")" >> "$GITHUB_OUTPUT"
      - name: Wait until the owner has approved it on npmjs.com
        run: until npm view "@morphemecms/cms@$V" version >/dev/null 2>&1; do sleep 60; done
        env:
          V: ${{ steps.stage.outputs.version }}
      - name: Rebuild morpheme-staging with it
        if: env.STAGING_DEPLOY_HOOK != ''
        run: curl -fsS -X POST "$STAGING_DEPLOY_HOOK" > /dev/null
        env:
          STAGING_DEPLOY_HOOK: ${{ secrets.STAGING_DEPLOY_HOOK }}
```

- [x] **Step 2: Update `AGENTS.md`** section 1, replace the line
`- Udgives på npmjs.com som en offentlig pakke: en release på GitHub med tagget \`v<version>\` (\`.github/workflows/publish.yml\`).`
with

```markdown
   - Udgives på npmjs.com som en offentlig pakke (`.github/workflows/publish.yml`): hver merge til `main` lægger en
     testversion klar under npm-tagget `next` til `morpheme-staging`; pull requesten *Release @morphemecms/cms*, som
     Changesets holder åben, flettes, når ejeren siger til, og lægger `latest` klar. En version er først på npm, når
     ejeren har godkendt den på npmjs.com med 2FA (*staged publishing*); en agent godkender aldrig. Flet aldrig
     Release-PR'en uden ejerens ja.
```

- [x] **Step 3: Commit, PR, merge** (the PR carries an empty changeset)

```bash
git add .github/workflows/publish.yml AGENTS.md .changeset
git commit -m "Stage next on each merge and latest from the Release PR"
```

- [x] **Step 4: Verify after the merge**

Run: `gh run list -R larsadolfsen/morpheme-cms -w Publish -L 1`
Expected: success, nothing staged (only an empty changeset was pending, which bumps nothing; npm has 0.1.0).

- [x] **Step 5: The first staged version, before the deadline**

With the owner's yes, merge a PR with a `patch` changeset. Expected: the `next` job stages `0.1.1-next-<time>` and
waits; `npm stage list @morphemecms/cms` (the owner's) shows it, and npmjs.com's *Trusted Publisher* no longer says
*Pending validation*. The owner approves it (2FA). Expected: the job goes on, `npm view @morphemecms/cms dist-tags`
shows `next: 0.1.1-next-<time>`, and a PR *Release @morphemecms/cms* is open (`gh pr list -H changeset-release/main`)
that raises the version to 0.1.1 and adds its section to `CHANGELOG.md`. Merging the Release PR is the owner's first
real release (`/release`, Task 7): then the `release` job stages 0.1.1 for `latest`, the owner approves it, and the
`latest` job tags `v0.1.1` and makes its GitHub release.

**Done 3 November 2026:** #17 staged `0.1.1-next-20261103223426`; the owner approved it, and the approval set the
`next` tag itself (`npm view @morphemecms/cms dist-tags`), so no `npm dist-tag add` is needed. The Release PR is #19.

---

### Task release-flow/5: The staging site

**Blocked by:** Task 4 merged and one `next` published (Step 5 of Task 4). Several steps are the owner's: marked
**(owner)**.

**Files (new repository `larsadolfsen/morpheme-staging`, folder `C:\Users\adolf\Documents\Interstellar\morpheme-staging`):**
- Create: the starter with the demo laid on it, from `morpheme-cms`'s `npm run build` output in `.morpheme/demo/site/`
- Modify there: `package.json` (dependency), `wrangler.jsonc` (`name`, `build.command`), `src/site/config.ts` (`repo`),
  `README.md`

**Interfaces:**
- Consumes: `@morphemecms/cms@next` on npm (Task 4).
- Produces: the Worker `morpheme-staging`, and its Deploy Hook URL, stored as `STAGING_DEPLOY_HOOK` (Task 4's step).

- [x] **Step 1: Make the folder from the demo**

In `morpheme-cms`: `npm run build`. Then copy `.morpheme/demo/site/` to
`C:\Users\adolf\Documents\Interstellar\morpheme-staging`, without `node_modules/`, `dist/` and `.morpheme/`
(`robocopy .morpheme\demo\site ..\morpheme-staging /E /XD node_modules dist .morpheme .astro`). `git init -b main` there.

- [x] **Step 2: Point it at `next` and at itself**

- `package.json`: `"name": "morpheme-staging"`, and `"@morphemecms/cms": "next"` in `dependencies`.
- `src/site/config.ts`: `repo: { owner: 'larsadolfsen', name: 'morpheme-staging', branch: 'main' },`
- `wrangler.jsonc`: `"name": "morpheme-staging"`, and

```jsonc
  // Each build takes the newest test version of the CMS (npm's next tag, staged by morpheme-cms on each merge to
  // main and approved by the owner), without a commit; a version that fails the checks is not deployed.
  "build": {
    "command": "npm install @morphemecms/cms@next --no-save && npm run check && npm run build",
  },
```

- `README.md`, at the top: `The CMS's staging site: @morphemecms/cms@next, rebuilt by morpheme-cms's publish.yml
  after each merge to main. For trying the next version before it is released; not a customer's site.`

- [x] **Step 3: Verify locally**

Run: `npm install && npm install @morphemecms/cms@next --no-save && npm run check && npm run build`
Expected: green; `node -p "require('@morphemecms/cms/package.json').version"` prints the `next` version.

- [x] **Step 4: Commit and create the repository** (owner's yes: a new repository on GitHub)

```bash
git add -A   # a new repository: review `git status` first; no .env, no .dev.vars
git commit -m "Make the CMS's staging site from the demo"
gh repo create larsadolfsen/morpheme-staging --private --source . --push
```

- [ ] **Step 5 (owner): Cloudflare**

Workers & Pages › Create › Import a repository › `larsadolfsen/morpheme-staging`, Worker name `morpheme-staging`.
Then the GitHub login for the editor as the starter's README describes. Then *Settings › Builds › Deploy Hooks*:
name `morpheme-cms next`, branch `main`, Create, copy the URL.

- [ ] **Step 6 (owner): The secret**

Run in a terminal (paste the URL when asked; never in the chat):

```bash
cd C:/Users/adolf/Documents/Interstellar/morpheme-cms && gh secret set STAGING_DEPLOY_HOOK -R larsadolfsen/morpheme-cms
```

- [ ] **Step 7: Verify end to end**

Merge any PR with a non-empty changeset in `morpheme-cms` with the owner's yes, and the owner approves the staged
`next` version. Expected: `publish.yml`'s *Rebuild morpheme-staging with it* step runs after the approval; Cloudflare's build list for `morpheme-staging` shows a build *Triggered by* `morpheme-cms next`
(Cloudflare connector, read-only); its log shows the new `next` version; the owner logs in at the staging site's
`/editor/`, edits a page and saves, and the save is a commit in `morpheme-staging`.

---

### Task release-flow/6: platform.md describes the new flow

**Repository:** `morpheme-website` (its own branch and PR; checks: `npm run check`).

**Files:**
- Modify: `docs/platform.md`, the paragraph starting `**Udgivelse:** når en ændring med en hævet version`

- [ ] **Step 1: Replace the paragraph with**

```markdown
**Udgivelse:** hver merge til `main` i CMS-repoet udgiver en testversion under npm-tagget `next`, som
`morpheme-staging` bygges med; Changesets samler ændringernes versioner og release notes i pull requesten _Release
@morphemecms/cms_, og når ejeren har prøvet den på staging og flettet den, udgiver Actions den som `latest` med
trusted publishing (`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md` i CMS-repoet). npm
tager aldrig imod en version, det har, igen.
```

- [ ] **Step 2: Verify and commit**

Run: `npm run check` (Prettier formats Markdown). Expected: green.

```bash
git add docs/platform.md
git commit -m "Describe the CMS's next and latest releases in platform.md"
```

---

### Task release-flow/7: The /release skill

**Blocked by:** Task 4 merged (the Release PR exists). Task 5 for the staging check (until then the skill reports
"no staging build found" and still asks).

**Files:**
- Create: `.claude/skills/release/SKILL.md`
- Modify: `.gitignore` (add `.claude/worktrees/`), `AGENTS.md` (Task 4's release line: *med `/release`*)
- Local only, not committed: in `.git/info/exclude` of the owner's checkout, replace the line `.claude/` with
  `.claude/worktrees/`, so the skill's folder is not ignored there.

**Interfaces:**
- Consumes: branch `changeset-release/main` and its PR (Task 4), npm tags `next`/`latest`, Worker `morpheme-staging`
  (Task 5).

- [x] **Step 1: Write `.claude/skills/release/SKILL.md`**

````markdown
---
name: release
description: Use when the owner wants to release @morphemecms/cms to the sites - "/release", "release the CMS", "publish to latest", "udgiv CMS'et". Checks the Release PR and staging, asks once, merges the Release PR and verifies npm, the tag and the GitHub release.
---

# Releasing @morphemecms/cms

Announce "Using release". A release reaches every site (the editor updates itself to a new minor or patch), so each
phase is a gate: a failure stops here and is reported with its output verbatim. Never `npm publish` by hand, never
bump a version by hand, never merge anything but the Release PR, never retry a failed publish. Design:
`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md` (section 4).

Every command shown to the owner starts with `cd C:/Users/adolf/Documents/Interstellar/morpheme-cms && `.

## Phase 1 - Take stock (read-only)

```
gh pr list -R larsadolfsen/morpheme-cms --head changeset-release/main --state open --json number,title,url
gh pr diff <n> -R larsadolfsen/morpheme-cms -- CHANGELOG.md package.json
npm view @morphemecms/cms dist-tags --json
```

- No open Release PR: stop - "Nothing to release: no changes are waiting (no changesets merged since the last
  release)."
- The Release PR's version: `version` in its `package.json` diff. Its notes: the lines it adds to `CHANGELOG.md`.
- Staging: the newest build of the Worker `morpheme-staging` (Cloudflare connector, read-only - list builds). Stop if it
  failed ("Staging's newest build failed: <link>; fix main first"). If it is older than the newest `next` publish, or
  none is found, say so in the question below instead of stopping.

## Phase 2 - Ask

Question box, one question: "Release X.Y.Z to every site?" with the notes and the staging line in the question text.
Options: "Release X.Y.Z", "Not now". Asked every time, also when a standing go-ahead to merge exists. Skipped or
"Not now": stop, change nothing.

## Phase 3 - Merge

```
gh pr merge <n> -R larsadolfsen/morpheme-cms --admin --merge
```

(`--admin`: the Release PR is opened by Actions' token, so its check never runs; `main` lets admins bypass it.)

## Phase 4 - The owner approves on npm

```
gh run list -R larsadolfsen/morpheme-cms -w Publish -L 1 --json databaseId,headSha,status
```

The run must be on the merge commit (`headSha`). When its `release` job has staged X.Y.Z (its *stage* step
succeeded), tell the owner, in the question box: "X.Y.Z is staged. Approve it with 2FA on npmjs.com (the package's
*Staged Packages* tab) or with `npm stage approve <stage-id>` (`npm stage list @morphemecms/cms` shows the id)."
Options: "Approved", "Reject it". Never approve or reject it yourself: npm requires the owner's 2FA, and the approval
is the release. "Reject it": the owner rejects it on npmjs.com; stop and report that nothing was released.

## Phase 5 - Verify

```
gh run watch <id> -R larsadolfsen/morpheme-cms --exit-status
npm view @morphemecms/cms dist-tags.latest
gh release view vX.Y.Z -R larsadolfsen/morpheme-cms --json tagName,url
```

The run's `latest` job (it waits for the approval) must succeed, `latest` must print X.Y.Z (npm can lag a minute:
check up to three times, a minute apart, with a Monitor until-loop), and the release must exist. Anything else: stop
and report.

## Phase 6 - Report

Version, the release notes, and the links: `https://www.npmjs.com/package/@morphemecms/cms/v/X.Y.Z` and the GitHub
release's URL. Sites get it at their editor's next update check.
````

- [x] **Step 2: Make the folder committable**

Add to `.gitignore`:

```gitignore
# Claude Code's worktrees; .claude/skills/ is committed.
.claude/worktrees/
```

Then (owner's checkout, local only): in `.git/info/exclude` replace `.claude/` with `.claude/worktrees/`.

Run: `git check-ignore -v .claude/skills/release/SKILL.md`
Expected: no output (not ignored). Run: `git check-ignore -v .claude/worktrees/x` - Expected: `.gitignore:...`.

- [x] **Step 3: Point AGENTS.md at it**

In Task 4's line in section 1, replace `og udgiver \`latest\`. Flet den aldrig uden ejerens ja.` with
`og udgiver \`latest\`: ejeren skriver \`/release\` (\`.claude/skills/release/SKILL.md\`). Flet den aldrig uden ejerens ja.`

- [ ] **Step 4: Verify**

In a new session in `morpheme-cms`, type `/release`. Expected: the skill loads and phase 1 runs; with no Release PR open
it stops with "Nothing to release". With one open (after Task 4 Step 5), it shows the version and notes and asks;
answer "Not now" and check that nothing changed (`gh pr view <n> --json state` still `OPEN`). The first real
"Release" is the owner's call.

- [x] **Step 5: Commit** (with an empty changeset: nothing a site gets)

```bash
git add .claude/skills/release/SKILL.md .gitignore AGENTS.md .changeset
git commit -m "Add /release, which releases the CMS from the Release PR"
```

---

## Order

Task 1 → Task 2 → Task 3. Task 1 + P1 → Task 4 → Task 5. Task 4 → Task 7 (its staging check needs Task 5). Task 6 any
time after the spec is merged.
Tasks 2 and 4 touch different files and can be built side by side once Task 1 is merged; Task 4's `AGENTS.md` edit is
a different section from Task 1's.
