# The site updates the CMS from npm by itself

> **Status:** design, approved by the owner on 3 November 2026. This is step 6's CMS part in `docs/platform.md` in
> `morpheme-website` ("the editor updates the CMS from npm"). Out of scope: moving Sara's site onto the package and
> her theme Venus (step 7 there, its own design, after this one), the store for apps and themes (the rest of step 6),
> and taking the lockfile code out of `morpheme-appstore` (a follow-up there).

## Why

A site has `@morphemecms/cms` from npm. When a new version is released on npm's `latest` tag (the release flow in
`2026-11-03-development-flow-and-releases-design.md`), the site should get it without anyone running npm, and a
version that breaks the site's build must not leave the owner's saves stuck. `docs/platform.md` says a new minor or
patch version is updated to by itself, and a major version is shown, as for an app.

## Where the code goes

Until step 4 in `docs/repositories.md` in `morpheme-website` is done, `packages/editor/` there is the CMS's source, and
the code below is written there and copied here as the rest of the package is. The paths are the package's own
(`lib/…`, `worker/…`, `src/…`), the same in both.

## How it works

The site's Worker does it all, in the two crons every site already has (`7 * * * *` and `* * * * *` in the starter's
`wrangler.jsonc`). The editor only shows what the Worker knows, and starts an update by hand.

### Each hour: is there a new version?

1. The Worker reads `package.json` and `package-lock.json` from the site's branch (`readFiles`, `worker/github.js`).
2. **It manages the CMS only when `package.json` names an exact version** (`"0.1.1"`). `"*"` (a workspace, as
   `morpheme-website` has until step 3), `"next"` (`morpheme-staging`), a range (`"^0.1.0"`) or a lock entry with
   `link: true` mean the site's owner handles it, and nothing happens.
3. It asks npm for the package's `dist-tags.latest` (`https://registry.npmjs.org/@morphemecms%2fcms`). It never takes
   `next` or another tag.
4. The new version is **taken by itself** when all of these hold:
   - it is newer than the one in `package.json`, with the same first number (`0.1.1 → 0.2.0` yes, `0.9.0 → 1.0.0`
     no; the rule apps follow, *Appbutikken* in `CLAUDE.md` in `morpheme-website`);
   - it is not skipped (`cms:skip:<version>`, below);
   - no other update is waiting (`cms:update` with `state: 'waiting'`);
   - `addToLock` (`lib/lockfile.mjs`) can write it, that is, the site has the peers the version asks for in versions
     that fit (otherwise it throws `NeedsNpm`).
5. Then the Worker commits `package.json` and `package-lock.json` in one commit on the site's branch,
   *Opdater Morpheme til 0.2.0*, with the Worker's own token (`commitFiles`, as `worker/publish.js` does), and keeps
   `cms:update` as waiting. The commit builds the site as any save does.

A version that is not taken by itself (a new first number, `NeedsNpm`, or skipped) is only shown in the editor.

### Each minute, while an update is waiting: did it build?

Only when `cms:update` is waiting (one KV read; `push.js` does the same with its `waiting` key):

- **Built.** The Worker is built with the package, so the running Worker's own version (from the package's
  `package.json`, imported when the Worker is built) is the proof: when it is `to`, the update is `done`, and a
  notification is sent: *Morpheme er opdateret til 0.2.0*.
- **The build failed.** Cloudflare's build posts a check run on the commit on GitHub (`Workers Builds: <worker>`, from
  the app `cloudflare-workers-and-pages`). The Worker reads the check runs of the update commit
  (`GET /repos/{owner}/{repo}/commits/{commit}/check-runs`); when that check run has `conclusion: 'failure'`, the
  update is undone at once, within a minute of the build failing.
- **Neither after 20 minutes** (no check run came, e.g. the build never started): undone as well.

**Undoing** is a new commit on the newest head that writes the previous `package.json` dependency and lock entry
back (`addToLock` with the `from` version's manifest), *Fortryd opdateringen af Morpheme til 0.2.0*. Everything saved
in between stays. The update becomes `undone`, `cms:skip:<to>` is kept, and a notification is sent: *Opdateringen af
Morpheme til 0.2.0 er fortrudt, fordi siden ikke kunne bygges*. The site that was online never changed: Cloudflare
deploys only a build that succeeds; what the undo gives back is that the owner's saves go online again.

If the undo's own build fails as well, nothing more is tried; the editor and a notification say that the site must
be fixed by hand.

### The release notes

The Worker reads `CHANGELOG.md` from the version's tarball on npm (`dist.tarball`: gunzip with
`DecompressionStream`, then the tar's 512-byte headers until the file), cuts out the sections of the versions after
the one installed up to the new one (a section is the `## <version>` heading Changesets writes and the text under it),
and keeps each section in KV, so each version's tarball is read once. They are shown in English, as Changesets writes
them, under the editor's own headings. A version without a section (0.1.0, from before Changesets) shows no notes.

## Data: Workers KV

In the binding `PUSH`, which every site has (the starter's `wrangler.jsonc`), each key with its own prefix:

| Key | Value | Its id |
| --- | --- | --- |
| `cms:update` | `{ commit, from, to, at, state, undoCommit? }`: the newest update, `state` one of `'waiting'`, `'done'`, `'undone'`, `'stuck'` (the undo did not build either); one at a time | `commit`, the SHA of the update's commit |
| `cms:skip:<version>` | `{ version, commit, at }`: a version that was undone, which is not taken by itself again | the version |
| `cms:notes:<version>` | `{ version, text }`: the version's section of `CHANGELOG.md` | the version |
| `cms:checked` | `{ at, latest, problem? }`: when npm was last asked, what `latest` was, and why it could not be taken by itself | (one key) |

Relationships: `cms:skip:<v>.commit` is the `cms:update.commit` that was undone; `cms:notes` are found by `from` and
`to` of `cms:update` and by `cms:checked.latest`. `at` is an ISO time. Nothing here is the site's data: losing KV
loses only the history of updates, and the next hour starts over from `package.json`.

## In the editor: Indstillinger › Morpheme

A new row *Morpheme* under *Indstillinger* (`Library.tsx`, next to *Appstore*) opens its page
(`#indstillinger/morpheme`), built from `ui.tsx`'s parts as an app's page is:

- the version the site runs, and when npm was last asked;
- a newer version, with the notes of each version up to it, and why it is not taken by itself, when it is not: a new
  first number (*Opdater* button), skipped after a failed build (*Prøv igen* button), or `NeedsNpm` (the reason, and
  the command `npm install @morphemecms/cms@<version>` for whoever runs the site's repository);
- an update waiting to be built, done, undone or stuck, with its time.

The buttons call `POST /api/cms/update { version }` on the Worker, which makes the same commit and the same watch.
`GET /api/cms` gives the page what the KV keys above hold. Both only for someone who can save the site (`mayEdit`,
`worker/session.js`), as the Worker's other `/api/…` addresses.

The notifications are the type `updates` (`notifications.ts`), which an app's own update already uses, sent from the
Worker to the devices with it on (`push.js`), in each device's language.

## Errors

| What | What happens |
| --- | --- |
| npm or GitHub cannot be reached | Nothing that hour; `cms:checked.problem` says it, and the page shows when the last check worked. |
| No `GITHUB_PUBLISH_TOKEN`, or no `PUSH` binding (a branch's preview, the demo) | Nothing is checked or committed; the page says why. |
| The branch moved on between reading and committing | The commit is made on the newest head, as `publish.js` does. |
| The owner saves while an update is waiting | Their commits stay; the undo changes only the dependency and its lock entry. |
| The token cannot read check runs | The 20-minute fallback undoes it instead; the page says that undoing is slow because of it. |
| The undo's build fails as well | `state: 'stuck'`, a notification, and the page says the site must be fixed by hand. Nothing more is tried. |

## Security

- **The token.** Reading check runs needs read access to *Checks* on the site's repository, besides *Contents: Read
  and write*. The setup (`docs/editor.md`, *Opsætning*) and the starter's README name it. When the token is replaced by
  the site's GitHub App installation token (step 3 in `docs/platform.md`), the app asks for the same two.
- **Nothing from npm runs in the Worker.** It reads JSON and one text file from npm and writes them into
  `package.json` and the lock; `npm ci` in the build checks the tarball against the `integrity` the Worker wrote,
  which is npm's own.
- **Only `latest`.** A version reaches sites only when the owner releases it with `/release`; the Worker never takes a
  prerelease.
- **No new key, no new secret.**

## What this reuses

- `lib/lockfile.js` and `lib/range.js` from `morpheme-appstore`, with their unit tests, moved into the package as
  `lib/lockfile.mjs` and `lib/range.mjs` (their header already says they move into the editor).
- `readFiles` and `commitFiles` (`worker/github.js`), the commit path of `worker/publish.js`.
- The two crons, the `PUSH` binding, the `waiting` trick and the notifications of `worker/push.js`.
- `mayEdit` (`worker/session.js`) for the two addresses.
- The rules for an app's version (same first number by itself; a new one by hand) and how an app's page shows its
  release notes (`notesSince`, `store.ts`).
- `ui.tsx`'s components for the page; nothing drawn by hand.

New: `lib/cms-version.mjs`, `lib/changelog.mjs`, `worker/cms-update.js`, `src/CmsPage.tsx` and the texts
`src/i18n/{en-US,da-DK}/cms.ts`, each with its header, and their wiring in `Library.tsx`, `App.tsx` and
`worker/index.js`.

## The parts, one file each

| File | What it does |
| --- | --- |
| `lib/lockfile.mjs`, `lib/range.mjs` | Writes a package's version into `package.json` and its lock entry without npm, or throws `NeedsNpm` (moved) |
| `lib/cms-version.mjs` | Pure: whether a site's CMS is managed (`managedVersion(packageJson, lock)`), which version to take by itself or show (`nextVersion(current, latest, skipped)`), and what the minute cron does (`watchStep(update, running, checkRun, now)` → `'wait' \| 'done' \| 'undo' \| 'stuck'`) |
| `lib/changelog.mjs` | Pure: `CHANGELOG.md` from a tar's bytes (`fileFromTar`), and the sections between two versions (`sectionsBetween`) |
| `worker/cms-update.js` | The Worker's glue: the hourly check, the commit, the minute watch, the undo, KV, the notifications, `GET /api/cms` and `POST /api/cms/update` |
| `src/CmsPage.tsx` | *Indstillinger › Morpheme* |
| `src/i18n/{en-US,da-DK}/cms.ts` | The page's and the notifications' texts, English first |

## How it is verified

**Tests** (`node --test`, part of `npm run check`):

- the moved tests of `lockfile` and `range`, unchanged;
- `cms-version`: exact version vs `*`, `next`, a range and a linked workspace; same and new first number; skipped;
  a waiting update; each step of `watchStep` with made-up times and check runs (success, failure, none, the 20
  minutes, the undo failing);
- `changelog`: a small tar made in the test, a missing file, and the sections between two versions;
- `worker/cms-update.js` against a made-up KV, GitHub and npm (`fetch` replaced, as `check:worker` does): an update is
  committed with the right files; a failed check run gives the undo commit and `cms:skip`; nothing is done for `*`.

**Not covered by tests, and how it is checked instead:**

- *Indstillinger › Morpheme* is thin: it shows what `GET /api/cms` gives. `check:screens` opens it on a phone and a
  computer, with made-up data in each of its states.
- One real round trip, on a site with KV and an exact version: `morpheme-staging` pinned to an older exact version
  for the test, or Sara's site once it has the package. A patch released on `latest` is committed within the hour and
  reaches the site; a patch that breaks the build (released on purpose for the test, then fixed with a new patch) is
  undone within a minute or two of its build failing, and is shown as skipped.

## Open questions

- Whether `morpheme-staging` exists by the time this is built, or the round trip waits for Sara's site.
- Whether fine-grained tokens can be given *Checks: Read*; if not, the 20-minute fallback is what undoes, until the
  GitHub App token replaces `GITHUB_PUBLISH_TOKEN`. To be checked first in the plan.
