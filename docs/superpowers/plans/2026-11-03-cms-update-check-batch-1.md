# Batch 1: the pure parts

Status: done. Checked against the code on 2026-11-10.

Master plan: `2026-11-03-cms-update-check.md` (its *Global constraints* and *Decisions* bind every task here).
Repo: `morpheme-website`, folder `packages/editor/` (paths below are relative to it). The four tasks are independent:
run them in parallel, each on its own branch from the newest `main`, each its own PR.

**Batch check:** `node --test packages/editor/lib/*.test.mjs` from `morpheme-website`'s root, and `npm run check`.

---

### Task 1.1: Move the lockfile writer into the package — Ollama runner

**Files:**
- Create: `lib/lockfile.mjs`, `lib/range.mjs` (from `morpheme-appstore`'s `lib/lockfile.js` and `lib/range.js`)
- Create: `lib/lockfile.test.mjs`, `lib/range.test.mjs` (from `morpheme-appstore`'s `test/unit/lockfile.test.mjs`
  and `test/unit/range.test.mjs`)

**Interfaces (unchanged, moved):**
- `lib/range.mjs`: `class Unsupported extends Error`; `satisfies(version: string, range: string): boolean`.
- `lib/lockfile.mjs`: `class NeedsNpm extends Error`; `addToLock(packageJson, lock, manifest) -> { packageJson, lock }`;
  `removeFromLock(packageJson, lock, name) -> { packageJson, lock }`. Imports `./range.mjs`.

**Steps:**
- [ ] Copy the four files byte for byte, changing only: the import paths (`./range.js` → `./range.mjs`,
  `../../lib/x.js` → `./x.mjs`), and the headers: lockfile's *"This moves into the editor …"* sentence becomes
  *"Moved here from morpheme-appstore (lib/lockfile.js), which keeps its copy until it uses this one."*; range's header
  gets the same sentence with `lib/range.js`. Each test file's header names its new run command.
- [ ] Run `node --test packages/editor/lib/lockfile.test.mjs packages/editor/lib/range.test.mjs`. Expected: the same
  number of passing tests as `npm test` in `morpheme-appstore` reports for these two files, 0 failing.
- [ ] Do not change `morpheme-appstore` (a follow-up there).
- [ ] Commit: `Move the lockfile writer from morpheme-appstore into the CMS`.

---

### Task 1.2: `lib/cms-version.mjs` — Ollama runner

**Files:** Create `lib/cms-version.mjs`, `lib/cms-version.test.mjs`.

**Interfaces (produces):**
- `PACKAGE = '@morphemecms/cms'`
- `compareVersions(a: string, b: string): -1 | 0 | 1` — plain `X.Y.Z` numbers; a version with a pre-release
  (`0.2.0-next-…`) is never compared: it throws `Error('pre-release')`.
- `managedVersion(packageJson, lock): { version: string } | { reason: 'missing' | 'workspace' | 'tag' | 'range' | 'link' }`
  — reads `dependencies[PACKAGE]` (then `devDependencies`); `'missing'` when absent; `'workspace'` for `"*"` or a
  `workspace:`/`file:` spec; `'link'` when `lock.packages['node_modules/@morphemecms/cms'].link === true`; `'tag'`
  for a value with no digit-led version (`"next"`, `"latest"`); `'range'` for anything else that is not exactly
  `/^\d+\.\d+\.\d+$/`; otherwise `{ version }`.
- `nextVersion(current: string, latest: string, skipped: string[]): null | { version: string, auto: boolean, why?: 'major' | 'skipped' }`
  — `null` when `latest` is not newer than `current` or is a pre-release; `why: 'major'` when the first number
  differs; `why: 'skipped'` when `skipped` includes `latest`; otherwise `{ version: latest, auto: true }`.
- `WATCH_LIMIT = 20 * 60 * 1000`
- `watchStep(update, running: string, check: 'success' | 'failure' | null, now: number): 'wait' | 'done' | 'undo' | 'undone' | 'stuck'`
  — `update` is `cms:update` (`{ state, to, from, at, undoAt? }`, times ISO). For `state: 'waiting'` (`check` is the
  update commit's): `running === to` → `'done'`; `check === 'failure'` → `'undo'`; `now - at > WATCH_LIMIT` → `'undo'`;
  else `'wait'`. For `state: 'undoing'` (`check` is the undo commit's): `'success'` → `'undone'`; `'failure'` →
  `'stuck'`; `now - undoAt > WATCH_LIMIT` → `'undone'`; else `'wait'`. Any other state → `'wait'`.

**Test cases (`lib/cms-version.test.mjs`, `node:test` + `node:assert/strict`, header like `lib/eyebrow.test.mjs`):**
- compareVersions: `0.1.0` vs `0.1.1` → -1; `0.10.0` vs `0.9.9` → 1; equal → 0; `0.2.0-next-1` throws.
- managedVersion: `"0.1.1"` → `{version:'0.1.1'}`; `"*"` → workspace; `"workspace:*"` → workspace; `"next"` → tag;
  `"^0.1.0"` → range; `"~0.1.0"` → range; exact but lock entry `link: true` → link; no dependency → missing; only in
  `devDependencies` as `"0.1.0"` → `{version:'0.1.0'}`.
- nextVersion: (`0.1.0`,`0.1.1`,[]) → auto; (`0.1.1`,`0.2.0`,[]) → auto; (`0.9.0`,`1.0.0`,[]) → major, auto false;
  (`0.1.0`,`0.1.1`,[`0.1.1`]) → skipped, auto false; (`0.1.1`,`0.1.1`,[]) → null; (`0.2.0`,`0.1.9`,[]) → null;
  (`0.1.0`,`0.2.0-next-20261103`,[]) → null.
- watchStep waiting: running = to → done (also when check is failure: the build that is online wins); check failure →
  undo; 19 minutes, no check → wait; 21 minutes, no check → undo; check success but running ≠ to, 5 minutes → wait.
- watchStep undoing: success → undone; failure → stuck; 21 minutes after `undoAt`, none → undone; 5 minutes, none →
  wait. State `'done'` → wait.

**Steps:** write the test, see it fail, write the module, see it pass
(`node --test packages/editor/lib/cms-version.test.mjs`), commit `Decide which CMS version a site takes and when an
update is undone`.

---

### Task 1.3: `lib/changelog.mjs` — Ollama runner

**Files:** Create `lib/changelog.mjs`, `lib/changelog.test.mjs`.

**Interfaces (produces):**
- `gunzip(bytes: Uint8Array): Promise<Uint8Array>` — with `DecompressionStream('gzip')` (in Workers and Node ≥ 18).
- `fileFromTar(tar: Uint8Array, path: string): string | null` — walks the tar's 512-byte headers (name: bytes 0–99,
  NUL-terminated, with the `prefix` field 345–499 joined by `/` when set; size: octal at 124–135; data rounded up to
  512); returns the UTF-8 text of the entry named exactly `path` (npm's tarballs use `package/CHANGELOG.md`), `null`
  when it is not there; stops at a zero block.
- `sectionsBetween(changelog: string, from: string, to: string): { version: string, text: string }[]` — a section is a
  line `## <version>` and the lines under it up to the next `## ` line; returns those with `from < version <= to`
  (`compareVersions` from `./cms-version.mjs`), newest first, `text` trimmed, empty sections dropped, pre-release
  headings ignored.

**Test cases:**
- A tar built in the test (write the headers with the octal size and checksum) with `package/package.json` and
  `package/CHANGELOG.md`: `fileFromTar` finds the changelog's text; `package/missing.md` → null; a name longer than
  100 bytes using `prefix` is found.
- `gunzip` of `zlib.gzipSync` output gives the input back.
- `sectionsBetween` on a changelog with `# @morphemecms/cms`, `## 0.3.0`, `## 0.2.1`, `## 0.2.0`, `## 0.1.1`
  (each with a `### Patch Changes` line and a bullet): (`0.1.1`,`0.3.0`) → 0.3.0, 0.2.1, 0.2.0 in that order;
  (`0.2.1`,`0.2.1`) → []; (`0.1.0`,`0.1.1`) → one; a section with only whitespace is dropped.

**Steps:** test first, then the module; `node --test packages/editor/lib/changelog.test.mjs`; commit
`Read a version's release notes from its npm tarball`.

---

### Task 1.4: The page's and the notifications' texts — Ollama runner

**Files:** Create `src/i18n/en-US/cms.ts`, `src/i18n/da-DK/cms.ts`; modify `src/i18n/en-US/index.ts` and
`src/i18n/da-DK/index.ts` (import and add `cms` next to `licenses`); modify `src/i18n/en-US/common.ts` and
`src/i18n/da-DK/common.ts` (`parts.morpheme: 'Morpheme'` in both, next to `advanced`).

**Interfaces (produces):** `t.cms` with these keys. Functions take the version as a string. Follow the shape of
`src/i18n/en-US/licenses.ts` and `src/i18n/da-DK/licenses.ts` (`Messages['cms']` on the Danish side). English
(Material 3's UX-writing rules) first, Danish after:

| Key | en-US | da-DK |
| --- | --- | --- |
| `running(v)` | `Version ${v}` | `Version ${v}` |
| `checked(when)` | `Checked ${when}` | `Tjekket ${when}` |
| `notChecked` | `Not checked yet` | `Ikke tjekket endnu` |
| `upToDate` | `Up to date` | `Opdateret` |
| `available(v)` | `Version ${v} is available` | `Version ${v} er klar` |
| `whatsNew` | `What's new` | `Nyheder` |
| `major` | `A new major version isn't installed by itself.` | `En ny hovedversion installeres ikke af sig selv.` |
| `skipped(v)` | `${v} was undone because the site couldn't be built.` | `${v} blev fortrudt, fordi siden ikke kunne bygges.` |
| `needsNpm` | `It needs npm. Run this in the site's repository:` | `Den kræver npm. Kør dette i sitets repo:` |
| `update` | `Update` | `Opdater` |
| `tryAgain` | `Try again` | `Prøv igen` |
| `waiting(v)` | `Updating to ${v}. Waiting for the site to be built.` | `Opdaterer til ${v}. Venter på, at siden bygges.` |
| `undoing(v)` | `Undoing the update to ${v}.` | `Fortryder opdateringen til ${v}.` |
| `done(v)` | `Updated to ${v}` | `Opdateret til ${v}` |
| `undone(v)` | `The update to ${v} was undone because the site couldn't be built.` | `Opdateringen til ${v} blev fortrudt, fordi siden ikke kunne bygges.` |
| `stuck(v)` | `The update to ${v} and its undo couldn't be built. The site must be fixed by hand.` | `Hverken opdateringen til ${v} eller fortrydelsen kunne bygges. Siden skal rettes i hånden.` |
| `unreachable` | `npm or GitHub couldn't be reached.` | `npm eller GitHub kunne ikke nås.` |
| `cannotWrite` | `The site's GitHub token can't save. Give it Contents: Read and write.` | `Sitets GitHub-nøgle kan ikke gemme. Giv den Contents: Read and write.` |
| `noToken` | `The site has no GitHub token (GITHUB_PUBLISH_TOKEN).` | `Sitet har ingen GitHub-nøgle (GITHUB_PUBLISH_TOKEN).` |
| `notManaged` | `The site's package.json decides the version.` | `Sitets package.json bestemmer versionen.` |
| `slowUndo` | `The token can't read check runs, so a failed update is undone after 20 minutes.` | `Nøglen kan ikke læse check runs, så en fejlet opdatering fortrydes først efter 20 minutter.` |
| `notifyDone(v)` | `Morpheme was updated to ${v}` | `Morpheme er opdateret til ${v}` |
| `notifyUndone(v)` | `The update of Morpheme to ${v} was undone because the site couldn't be built` | `Opdateringen af Morpheme til ${v} er fortrudt, fordi siden ikke kunne bygges` |
| `notifyStuck(v)` | `Morpheme ${v} couldn't be built, and neither could its undo. Fix the site by hand.` | `Morpheme ${v} kunne ikke bygges, og det kunne fortrydelsen heller ikke. Ret siden i hånden.` |
| `commitUpdate(v)` | `Update Morpheme to ${v}` | `Opdater Morpheme til ${v}` |
| `commitUndo(v)` | `Undo the update of Morpheme to ${v}` | `Fortryd opdateringen af Morpheme til ${v}` |

**Steps:** write both files and the four index/common edits; `npx tsc --noEmit -p .` from `morpheme-website`'s root
passes (TypeScript fails if a Danish key is missing); commit `Add the texts of the CMS's update page`.
