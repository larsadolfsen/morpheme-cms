# The front page without a forced Banner — design

Date: 2026-11-05. Agreed with the owner in chat.

## Goal

Sara's Cloudflare build of `main` (Worker `saravafaiblom-dk`) passes. Today it stops in `morpheme check:content`:

```
src/content/pages/forside.md: "Banner" skal stå på siden.
```

Her front page starts with her app's block `portraithero`, not the standard Banner (`hero`), and the CMS forces a
Banner on the front page.

## Owner's decision

**A page has no forced content.** The front page loses its rule that it must have a Banner, keep it first and have
only one. A Banner on the front page is an ordinary block: it can be moved, hidden or removed. No block declares that
it "replaces" another; nothing new is added to the block contract.

## Change

1. `defaults/standardPages.ts`: the front page entry (`key: 'front'`) loses `template` and `needs`, and the comment
   above it ("The top stays first …") goes. Nothing else in the file changes.
2. The same change in `morpheme-website/packages/editor/defaults/standardPages.ts`, which is still the CMS's source
   (`AGENTS.md`), so the next sync does not bring the rule back.
3. `morpheme-website/docs/editor.md`: the lines that say the front page's top Banner is locked (*Standardsider*, and the
   paragraph after the `Template` table) say instead that no page forces a block, the blog page aside. The table row
   that explains `locked` stays: it describes the `Template` feature, which stays.

What stays as it is:

- The `Template` features (`locked`, `max`, `required`) and `needs`: the blog page still needs its "Blog posts" block
  (Danish label: Blogindlæg). Whether the post list becomes part of the blog page's design is a separate task.
- `src/sections.mjs`: a Banner that is the first block on the front page still has its text above the card, as today.
  A Banner further down is a card with all its fields, as today.
- `APP_API` and `THEME_API`: no contract changes.

## Windows path fix (separate commit)

`scripts/check-content.mjs` builds file paths with `join()`, which gives backslashes on Windows. `standardPageOf` and the
collections test `startsWith('src/content/pages/')`, so on Windows the front page is never recognised and the check
reports false errors. The paths are written with `/` (`.replaceAll('\\', '/')` after `join`). This lets the change be
proven locally on Windows before the release. Its own commit and its own patch changeset.

## Release

One changeset, `minor` (the editor behaves differently on the front page), plus the patch changeset for the path fix.
Released with the `release` skill; the owner approves on npmjs.com with 2FA.

## Sara's repo

A branch takes the new version (`package.json` pins `@morphemecms/cms` exactly, today `0.5.0`), with the lockfile. PR,
merge, then the Cloudflare build of `main` is the gate. No change to `portraithero`.

## Checks

- `morpheme-cms`: the repo's checks (`npm test` / the `node --test` files, `prettier --check`, types).
- Locally on Windows, before the release: Sara's repo with the CMS from the worktree (`npm pack`, installed in a Sara
  worktree): `npx morpheme check:content` reports no problem on `forside.md` and no false lead errors.
- Not unit-tested: removing the two fields is data in a config. The local `check:content` run on Sara's content and
  her Cloudflare build are the proof.
- After the release: Sara's Cloudflare build of `main` succeeds, and
  https://saravafaiblom-dk.sara-vafai-blom.workers.dev serves the moved site.

## Out of scope

- The post header (breadcrumbs, author, share links; the owner's Airbnb and Google examples): its own task.
- The blog page's post list as part of its design: its own task.
- The internal link warning ("psykoterapi" links to `/`): noted, not an error.
