# The version is set when a feature starts (plan)

Status: **approved by the owner, 19 November 2026** ("Okay, update package json on start"). The owner's reason: the demo shows the
feature being built, and its editor must show that feature's own version, never a wrong number. It extends the flow in
`2026-11-18-release-per-feature.md` (branch → feature → `next` → live).

## The rule

- **A feature starts by setting its version.** The first pull request of `feature/<name>` sets `version` in `package.json` and
  `package-lock.json`, and runs `node scripts/starter.mjs` so `starter/package.json` pins the same number (CI's feature level skips the
  starter jobs, so a missed starter only fails later, at the merge into `main`: #1038 on 19 November 2026), to the version the feature will be released as: the next patch (`0.19.1`), or the next minor (`0.20.0`) when
  the feature starts a line (roadmap). Who chooses (owner, 19 November 2026): when a PM session starts, it asks the owner
  whether its work is the next major release, the start of a new line (`0.20.0`); after that it sets the next patch (`0.19.1`) for
  each feature and fix without asking.
  From then on the demo, the feature's Previews and `next` show that number. A single fix
  straight into `main` sets its version in its own pull request the same way.
- **The release takes that number as it is.** Changesets no longer decides the number: it collects the notes and keeps the Release PR.
  A changeset's level (`patch`, `minor`) no longer moves the version.
- **Nothing else changes the version.** No pull request after a feature's first changes it, except the PM's move below; and
  `CHANGELOG.md` is still written only by the release.
- **No code or test names the next version.** A test that needs a version newer than the running one derives it from the
  package's own `version` (one patch above it), never writes the coming release number: when a feature sets that number, a hard-coded
  "newer" target equals the running version and the test stops testing (`scripts/check-cms-update.mjs` on 19 November 2026, where
  `worker/cms-update.js` took an update to the running version as done).
- **Two features at once.** The PM merges `main` into every open feature branch after each merge into `main` (skill `pm`). When that
  brings in a feature released with the same number, the merge conflicts on `version`, and the PM resolves it to the next number. With
  one feature at a time this is rare.

npm itself never bumps a version: it publishes what `package.json` says, once per number. The bump came from Changesets, run in our
publish workflow; that is what changes.

## The build (one pull request into `main`, a single fix)

1. **`npm run release:version`** (the Release PR): runs `changeset version` for the notes and `CHANGELOG.md`, then sets `version` back
   to the number the feature set (and renames the new `CHANGELOG.md` section to it), then `scripts/release-notes.mjs` and
   `scripts/starter.mjs` as today, so the starter pins the released number.
2. **The `next` job in `publish.yml`:** the test version is `<the set version>-next-<time>` (today `changeset version --snapshot`
   computes it from the changesets, which would give a number one step too high). It still stages nothing when only empty changesets
   are pending.
3. **A version check** (job `static`, with a test): on a pull request into `main`, and on a feature's first pull request, `version` is
   exactly one step above npm's `latest` (next patch, or next minor `.0`) and not published yet; on a merge into `main` with non-empty
   changesets, a `version` equal to `latest` fails ("set the feature's version"); and on every pull request, at every level,
   `starter/package.json` pins the package's `version` (`node scripts/starter.mjs --check`, so the feature level catches it too). It replaces the series check of
   `scripts/release-line.mjs` (`release-lines.json`).
4. **Docs in the same pull request:** the `changesets` skill (the level no longer sets the number), the `release` skill (the Release PR's
   version is the one the feature set), the `pm` skill (a feature's first pull request sets the version; the move on conflict), and
   the `developer` skill.

## The order

1. **Now:** `feature/tailwind` sets its version to `0.19.0` in a pull request into it, so the demo shows 0.19.0. Nothing is released from
   a feature branch, so this is safe before the build.
2. **The build** (above) is merged into `main` before `feature/tailwind` goes into `main`. Until it is, `feature/tailwind` is not merged
   into `main`: with today's Changesets, 0.19.0 plus its `minor` changeset would be released as 0.20.0.
3. From then on every feature and fix starts by setting its version.
