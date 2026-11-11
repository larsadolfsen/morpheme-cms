# Drafts and Publish: plan of sub-steps (batch 12, 0.17)

Source: batch 12 and questions 1, 2 and 5 of `2026-11-11-intuitive-editor-design.md`; spike S1 (an early exit of `ci-build`
does not skip the deploy). Every pull request goes into `0.17`, has a `minor` changeset and, when the owner sees a change,
a release note (`release-notes` skill, English and `da-DK`). Data model and Worker come first, UI after.

## Decisions this plan rests on

- The waiting version is a file in git, in a folder of its own: `src/drafts/<collection>/<slug>.md`. It is outside
  `CONTENT_PATHS` and outside everything the site builds from, so saving a draft changes no site file. Workers Builds
  **watch paths** exclude `src/drafts/`; `ci-build` keeps no early exit. As a fallback for a site without the watch path,
  a diff holding only `src/drafts/` takes the existing content lane.
- Two statuses: `Published` and `Draft`. `status: draft` stays in the file; published is no `status`.
  Stored `unlisted` becomes published + `noindex: true`; stored `scheduled` becomes a waiting version with a publish time.
- The version list is a list from the start: each version has `id`, `state` (`live`, `waiting`) and an optional `publishAt`.
  The core writes and reads at most two.
- `publish`, `schedule`, `unpublish` and `discard` are plain functions in `lib/versions.mjs` (no browser, no React), so the
  editor, the Worker and an app call the same code.
- A scheduled publish is run by the Worker's hourly job (`worker/publish.js`), not by the browser.
- With `Faster editor` off there is no autosave: `Save` commits the draft file and the status shows `Not saved` until then
  (spec, question 2). Autosave to R2 is batch 13, not here.
- New pages and posts start as Draft.
- Batch 1 (plain words, PR #279) changes the status words only: this work reads the words from the same i18n keys and
  does not rename them.

## Pull requests

1. **Data model and migration** (no UI). `lib/status.mjs` (two states, legacy values still read), `lib/versions.mjs`
   (version list, draft path, `publish`, `schedule`, `unpublish`, `discard` as pure text and path functions),
   migration of `unlisted` and `scheduled` front matter, `site/content.ts` and `defaults/rules.ts` read the new model, build
   skips `src/drafts/`, tests.
2. **Worker.** Commit a draft file, `Publish changes`, `Unpublish`, `Discard`, `Schedule` as Worker endpoints over
   `worker/github.js`; the hourly job publishes due waiting versions (replaces the `scheduled` status scan);
   `ci-build` fallback lane for a drafts-only diff; the starter's watch-path note.
3. **Editor store.** `store.ts` and `EntryForm.tsx` hold a draft and a live version; `Save` writes the draft; new entries start
   as Draft; no new visuals except what the store needs.
4. **Editor UI.** Save bar and top bar states (`Draft`, `Published`, `Unpublished changes`, `Scheduled changes`),
   `Publish`, `Publish changes`, `Unpublish`, `Discard changes` with its confirmation, the `Schedule` picker, the
   `Hide from search engines` setting in the SEO section; `CLAUDE.md` section 6 status words; release note with
   before and after screenshots, and the migration shown, for the owner.

Each pull request must pass `npm run check`, `check:screens`, `check:demo` and `check:themes`.

## Owner decision (settled, 11 November)

`unlisted` is removed with its behaviour. A stored `unlisted` is read as `published` plus the SEO setting `Hide from search engines`
(stored `noindex: true`), and nothing more: no rule keeps `noindex` entries out of the site's own lists, the blog, the sitemap
or what apps read. A migrated hidden post therefore now shows on the blog and in lists. Pull request 1 removes the
`unlisted`-only paths and keeps only the migration of stored values (read as above; the editor writes the migrated form
on the next save).
