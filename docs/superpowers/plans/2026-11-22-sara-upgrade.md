# Sara's site upgrade (plan)

Status: **22 November 2026**, written by the CTO. The owner upgrades Sara's site (`saravafaiblom/Sarashjemmesidedata`) with her on
**Wednesday 25 November**. The prep starts **Tuesday 24 November at 17:00** (Copenhagen time), by a scheduled task, once the owner's
tokens are back at 16:00. The owner has no access to the site before meeting her, so the prep works from GitHub and a local copy only,
and nothing reaches her `main` before Wednesday.

## Where the site is

- `@morphemecms/cms` is pinned at **0.19.0**. The editor's updates to 0.19.1, 0.19.2, 0.19.3 and 0.19.4 each failed the build and were
  reverted by the editor ("Fortryd opdateringen af Morpheme til …").
- Theme: Venus **1.3.0** (`src/themes/theme_fa395ad84690acbd/`, `"icons": "phosphor"`). The store's Venus in `morpheme-apps` is 1.6.0
  (contract 7, commit c33eb69).
- Apps: her own app `sara`, `cookiescanner`, `google-ads`, `google-analytics`, `gtm`, `mobilepay` and two store apps.

## Why the updates fail (CTO's local test on 0.19.4, 22 Nov)

Her own app `src/apps/sara/` uses CMS exports that are gone since 0.19.1:

- `pictureOf` (`src/standard/load`), `shownPicture` and `Picture` (`src/standard/view`), and the `picture` prop, now `image`:
  `blocks/contact/`, `blocks/side-card/`, `blocks/portraithero/`, `parts/Img.tsx`.
- `@morphemecms/cms/src/standard/hero/fields` (removed): `blocks/portraithero/load.ts` and `viewOf.ts`. This crashes `check:content`
  with `ERR_MODULE_NOT_FOUND`, so the build stops.
- Prettier also warns on `src/apps/cookiescanner/problems.tsx`.

Not yet checked: `check:editor`, `check:worker`, the build, and whether Venus 1.3.0 passes the CMS's theme check on 0.19.4.

## Tuesday from 17:00: the prep (a developer session, no merge)

1. Copy her repo, install the target CMS (npm `latest` at that time: 0.19.4, or 0.19.5 if the owner has released it) and run
   `npm run check`, `npm run build` and `npm run check:themes`. Write down every failure.
2. In a pull request on her repo (not merged): bump `@morphemecms/cms` to the target, and move `src/apps/sara/` to the current API
   (`image` names; what replaced `hero/fields`, read from the CMS's `src/standard/` and `lib/migrate-hero.mjs`). Her app keeps its look:
   `npx morpheme compare-html <before>` shows the same pages. Fix the cookiescanner Prettier warning if it is her copy's.
3. Venus: if 1.3.0 fails on the target, check that Venus 1.6.0 (or later) is released in the store. A theme is updated only through the
   editor's store (never by hand in her repo), so it becomes a Wednesday step; if 1.6.0 is not released, tell the owner, who releases it
   (`npm run release -- venus` in `morpheme-apps`, the owner's step).
4. If a fix belongs in the CMS (an export removed without raising `APP_API`, so a site's own app broke without a warning), report it to
   the CTO for 0.19.6; do not change the CMS for Sara.
5. Report to the owner in a few lines: the pull request, its checks, and the Wednesday steps that are left.

## Wednesday with Sara

1. In her editor: update Venus from the store first if step 3 says so.
2. Merge the prep pull request (the owner, with Sara's yes). Her Cloudflare build runs; read it until it is green.
3. Open the home page, a page with her contact block, the portrait hero and a side card, and a blog post, on a phone and a computer.
4. **If it fails:** revert the merge commit on `main` (the site goes back to 0.19.0 as it is today), and the prep session fixes it on the
   branch.

## After this

0.19.6 brings contract 8 (Material 3 names). It rewrites her content and her own app once, and Venus needs a contract-8 version in the
store before she can take 0.19.6 (`specs/2026-11-20-material-3-names-design.md`).
