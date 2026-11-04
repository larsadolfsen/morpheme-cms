# The front page without a forced Banner — implementation plan

> **For agentic workers:** the Interstellar orchestrator routes the tasks (`CLAUDE.md` in `Interstellar/`). Steps use
> checkbox (`- [ ]`) syntax.

**Goal:** Remove the forced Banner from the front page, so that Sara's Cloudflare build of `main` passes.

**Architecture:** The front page entry in `defaults/standardPages.ts` loses `template` and `needs`. The check, the
editor and the standard-page setting read these fields, so no other code changes.

**Tech stack:** TypeScript, Node 22 `node --test`, Changesets, npm.

**Spec:** `docs/superpowers/specs/2026-11-05-front-page-without-forced-banner-design.md`.

## Global constraints

- Do not change `APP_API` or `THEME_API`.
- Do not change the blog page entry (`key: 'blog'`).
- Do not change `src/sections.mjs`, `src/check.ts`, `src/registry.tsx` or `defaults/rules.ts`.
- Commit messages in English, imperative subject, with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Session branch in `morpheme-cms`: `feat/front-page-no-forced-banner` (worktree `.worktrees/cms-front-page`).

---

### Task 1: Remove the front page's forced Banner (`morpheme-cms`)

Worker: Ollama runner.

**Files:**

- Modify: `defaults/standardPages.ts` (the entry with `key: 'front'` and the comment line above it)

**Interfaces:** none. `StandardPage.template` and `StandardPage.needs` stay optional fields of the type.

- [ ] Remove the comment line `// The top ("Banner") stays first, and is the page's only "Banner".`.
- [ ] Remove the line `template: { locked: ['hero'], max: { hero: 1 } },` from the front page entry.
- [ ] Remove the line `needs: { type: 'hero', label: 'Banner' },` from the front page entry.
- [ ] Keep all other lines unchanged.

Result for the entry:

```ts
  {
    key: 'front',
    label: 'Forside',
    the: 'Forsiden',
    at: '/',
  },
```

Acceptance check (in the task worktree):

```powershell
node -e "const s=require('fs').readFileSync('defaults/standardPages.ts','utf8');if(/locked: \['hero'\]|type: 'hero'|stays first/.test(s))process.exit(1);if(!/needs: \{ type: 'posts', label: 'Blogindlæg' \}/.test(s))process.exit(2)"
```

Expected: exit code 0.

### Task 2: Write Windows file paths with `/` in `check:content` (`morpheme-cms`)

Worker: orchestrator (one-line fix).

**Files:**

- Modify: `scripts/check-content.mjs` (the `.map((e) => join(e.parentPath, e.name))` line)
- Create: `.changeset/check-content-windows-paths.md` (`patch`)

- [ ] Change the line to `.map((e) => join(e.parentPath, e.name).replaceAll('\\', '/')),`.
- [ ] Write the changeset: `'@morphemecms/cms': patch`, text "`morpheme check:content` reads a site's files with `/` in their paths on Windows too, so it finds the standard pages there."
- [ ] Commit the two files.

### Task 3: Changeset for Task 1 (`morpheme-cms`)

Worker: orchestrator (Markdown).

- [ ] Create `.changeset/front-page-no-forced-banner.md`: `'@morphemecms/cms': minor`, text "The front page no longer forces a Banner. A Banner there is an ordinary block: it can be moved, hidden or removed. An app block can be the top of the front page instead."
- [ ] Commit it with Task 1's merge into the session branch.

### Task 4: Prove it on Sara's content, on Windows

Worker: orchestrator (checks only, nothing committed in Sara's repo).

- [ ] In `.worktrees/cms-front-page`, run `npm pack --pack-destination <scratchpad>`.
- [ ] Make a worktree of `sara-move` from `origin/main` (branch `chore/cms-front-page-check`).
- [ ] In it, run `npm ci`, then `npm install <scratchpad>/morphemecms-cms-0.5.0.tgz --no-save`.
- [ ] Run `npx astro sync`, then `npx morpheme check:content`.
- [ ] Expect: no line for `src/content/pages/forside.md`, and no lead errors from the Windows paths.
- [ ] Remove the worktree and its branch.

### Task 5: Pull request and release (`morpheme-cms`)

- [ ] Run `npx prettier --check .` and `node --test` on the changed areas.
- [ ] Push the session branch. Open the pull request with `gh`.
- [ ] Merge into `main` when the check passes (standing go-ahead).
- [ ] Release with the `release` skill. The owner approves the version on npmjs.com with 2FA.

### Task 6: The same change in `morpheme-website`

Worker: Ollama runner for the code; orchestrator for the Markdown.

**Files:**

- Modify: `packages/editor/defaults/standardPages.ts` (as Task 1, same acceptance check from `packages/editor/`)
- Modify: `docs/editor.md` (the *Forsiden* item under *Standardsider*, and the paragraph after the `Template` table)

- [ ] Branch `feat/front-page-no-forced-banner` from `origin/main`, in a worktree.
- [ ] Apply Task 1 to `packages/editor/defaults/standardPages.ts`.
- [ ] In `docs/editor.md`, remove "og *Banner* låst øverst og kun én (forsidens `template`)".
- [ ] In `docs/editor.md`, change "Toppen er standardblokken *Banner*" to "Står standardblokken *Banner* øverst, er den toppen".
- [ ] In `docs/editor.md`, change the paragraph "På dette site: …" so it says the front page forces no block, and the blog page must have its posts.
- [ ] Run `npm run check`. Push (with `--no-verify` only when `check:worker` is the single failure). Open the pull request. Merge when the checks pass.

### Task 7: Sara's site takes the new version

- [ ] Branch `chore/cms-<version>` in a `sara-move` worktree, from `origin/main`.
- [ ] Set `"@morphemecms/cms": "<version>"` in `package.json`. Run `npm install`. Commit `package.json` and `package-lock.json`.
- [ ] Push with `--no-verify` (Windows `check:worker`). Open the pull request.
- [ ] Merge into her `main` only with the owner's go-ahead in chat (Sara move spec, *Checks*).
- [ ] Read the Cloudflare build of `main` for the Worker `saravafaiblom-dk`. Expect `success`.
- [ ] Open https://saravafaiblom-dk.sara-vafai-blom.workers.dev. Expect the moved site.
