# Batch 3: the page, the starter and the docs

Status: done. The `docs/editor.md` and `platform.md` parts live in another repository. Checked against the code on 2026-11-10.

Master plan: `2026-11-03-cms-update-check.md`. Needs Batch 2 merged (`GET /api/cms`, `POST /api/cms/update`, the
`Status` shape). Repo `morpheme-website`, paths relative to `packages/editor/` unless they start with the repo's
root. Tasks 3.1–3.3 are independent; 3.4 comes last.

**Batch check:** `npm run check`, `npm run build`, `npm run check:screens`, `npm run check:starter`.

---

### Task 3.1: *Indstillinger › Morpheme* — Sonnet agent (ui.tsx rules)

**Files:**
- Create: `src/cmsView.mjs`, `src/cmsView.test.mjs` (pure), `src/CmsPage.tsx` (thin)
- Modify: `defaults/editor.ts` (`settings`: `'morpheme'` after `'appstore'`; `icons.morpheme`), `src/Library.tsx`
  (`partOf`: `morpheme` → `{ label: parts.morpheme, href: '#morpheme', count: null }`), `src/App.tsx` (`Page`:
  `route === CMS_ROUTE` → `<CmsPage />`; the route in the header's list)
- Modify if the icon is new: the icon maps in `site/icons.mjs` and `npm run icons` (CLAUDE.md, *Kun ikonpakkens
  ikoner*). Prefer an icon the editor already draws.
- Modify: `check:screens`' made-up data, so the page opens in each state below.

**Interfaces:**
- Consumes: `GET /api/cms` → `Status`, `POST /api/cms/update { version }` (Batch 2, Task 2.2); `t.cms`,
  `t.common.parts.morpheme` (Batch 1, Task 1.4).
- Produces: `CMS_ROUTE = 'morpheme'` (`src/CmsPage.tsx`); `cmsView(status: Status): View` (`src/cmsView.mjs`), where
  `View` is `{ running, checkedAt | null, latest | null, notes: { version, text }[], action: 'update' | 'try-again' | null,
  npmCommand: string | null, update: { state, to, at } | null, problems: ('unreachable' | 'cannot-write' | 'no-token' | 'not-managed' | 'slow-undo')[] }`.

**Behaviour (`cmsView`):** `latest` only when newer than `running`; `action` `'update'` for `major`, `'try-again'` for
`skipped`, `null` otherwise (and `null` while an update is `waiting` or `undoing`); `npmCommand`
`npm install @morphemecms/cms@<latest>` for `needs-npm`; `problems` from `token`/`kv`, `checked.problem` and
`checked.noChecks`; `update` only for `waiting`, `undoing`, `undone`, `stuck`, and `done` less than a day old.

**The page:** `Screen` with `t.common.parts.morpheme`, back to `#indstillinger`; a `Group` of `ListItem`s: the
running version and when it was checked; the update's state (`t.cms.waiting|undoing|done|undone|stuck`); a newer
version with `t.cms.available`, its notes under `t.cms.whatsNew` (as an app's page shows its release notes), why it is
not taken by itself, and the one `Button` (`t.cms.update` / `t.cms.tryAgain`); the problems as text. Errors from the
`POST` with `snackbar()`. Only `ui.tsx`'s parts; no classes of its own.

**Test cases (`src/cmsView.test.mjs`):** up to date (latest = running) → no `latest`, no `action`; a patch waiting →
`update.state` `waiting`, `action` null; `major` → `action` `'update'`; `skipped` → `'try-again'`; `needs-npm` →
`npmCommand`; no token → `problems` `['no-token']`; `noChecks` → includes `'slow-undo'`; `done` two days old → no
`update`.

**Steps:** test first; then the page and its wiring; `npm run check`, `npm run build`, `npm run check:screens`.
Commits: `Show the CMS's version and updates under Indstillinger` (one PR).

---

### Task 3.2: The starter pins an exact version — orchestrator (one-line fix)

**Files:** `starter/package.json` (`"@morphemecms/cms": "^0.1.0"` → `"0.1.0"`).
Check: `npm run check:starter`. Commit: `Pin the starter's CMS version so the site updates it by itself`.

---

### Task 3.3: The docs — Haiku agent (Danish, `site-editor-writing`)

**Files:** `docs/editor.md` (root of `morpheme-website`): *Opsætning*, the token's step: *Contents: Read and write* and
*Checks: Read*; a new section *Opdateringer af CMS'et* (what the hourly and minute crons do, the KV keys, the page,
that only an exact version is managed); `README.md`: the page *Indstillinger › Morpheme* in one short paragraph;
`starter/README.md`: the token's two permissions. `docs/platform.md` step 6: the CMS's part is built (link the spec).
Check: `npx prettier --check` on the four files. Commit: `Describe the CMS's updates in the docs`.

---

### Task 3.4: Into `morpheme-cms` — orchestrator

- Copy `packages/editor/` into `morpheme-cms` the way `docs/repositories.md` in `morpheme-website` says the package is
  copied, on a branch, with a `minor` changeset: *"The site updates Morpheme by itself: a new minor or patch version
  on npm is installed within the hour and undone when the site cannot be built. See Settings › Morpheme."*
- PR, merge (standing go-ahead). The `next` job stages it; the owner approves it (2FA).
- The owner's `/release` makes it `latest` when he says so.
- Then the round trip (master plan, *Owner steps*).
