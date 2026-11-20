# Release notes as blog posts on getmorpheme.com

> **Status:** built 7 November 2026 (`worker/release-post.js`, `lib/releasePost.mjs`).

## Why

Each release of `@morphemecms/cms` should also be a blog post on getmorpheme.com, out at the time it is released.

## How

The site's own Worker posts it. That is the only part with a key to the site's repository (`GITHUB_PUBLISH_TOKEN`), so
nothing new needs a key: a commit from `publish.yml` in this repository would need a token for
`larsadolfsen/morpheme-website`, made and renewed by hand, which the rule *ingen nøgler i hånden*
(`docs/platform.md` in `morpheme-website`) rules out.

- **The setting.** `releasePosts` in the site's `src/site/config.ts` (`site/defineSite.mjs`): `{ categories: [...] }`
  turns it on and tags each post; the standard is `null`, so no other site posts anything.
- **When.** The minute cron (`* * * * *`) runs `postRelease`: it asks npm for `latest` (one request) and reads
  `cms:release-post` in KV (one read). A released version (x.y.z) it has not looked at is posted. A release is on
  `latest` once the owner has approved it on npmjs.com, so the post is committed within a minute of that, and is on the
  site once Cloudflare has built the commit.
- **What.** From the version's npm tar: its release notes in the site's language, else English (`notesFor`), the
  screenshots of its cards, and the edition of its minor line. `lib/releasePost.mjs` writes
  `src/content/blog/morpheme-<x-y-z>.md` (the address `/morpheme-x-y-z/`):
  - front matter as the editor writes it: `title` (*New in Morpheme Braies 0.14.2*), `date` (the day it is posted, UTC),
    `description` (the cards' titles, else the first line), `categories`, `image` (the edition's photo) and `imageAlt`
    (its place);
  - each card as a heading, its text and its screenshot; the lines under *Also in this version*; the photo's credit.
  The images go in `public/images/uploads/<year>/<month>/`, as the editor puts them, in the same commit as the post.
- **Once.** `cms:release-post` keeps `{ version, state, at }`: `posted` (with the commit), `exists` (the site already has
  the file, e.g. KV was emptied: never overwritten), `no-notes` (a developer-only release gets no post) or `failed`
  (tried again after an hour). A test version on `latest` is never posted.

## Checks

- `lib/releasePost.test.mjs`: the post and its images, and that its front matter is what the editor writes
  (`writeFields`).
- `scripts/check-release-post.mjs` (in `check:worker`): the Worker with npm, GitHub and KV played.
- A post made from the real 0.14.2 notes passed `check:editor` (the same page after a save) and `check:content`, and was
  built and looked at on the demo.

## On getmorpheme.com

Once it runs a CMS version with this: `releasePosts: { categories: ['releases'] }` in `src/site/config.ts`, and the
category `src/data/categories/releases.json` (`{ "name": "Releases", "blogCategory": true }`). The first minute after
that, the current `latest` is posted (if it has notes).
