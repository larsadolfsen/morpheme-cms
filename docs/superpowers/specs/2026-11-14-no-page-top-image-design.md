# No top image on pages (design and build plan, 0.18)

Status: decided (Path A), ready to build. Build plan in section 6.

**Owner decisions (14 Nov 2026):**

- "Isn't the top image a blog feature?" Pages lose their top image; blog posts keep theirs (the post's image, used in
  lists, cards and sharing).
- After this spec showed that a page has no top-image field and that its one top image is the main heading's background
  image: "Remove the page image setting on pages." That is Path A below: the `Background image` (and its `Image
description`) leaves the `Section settings` of a page's `Main heading`, and a migration keeps every such image in the
  page's text. The share image (`shareImage`, `Social media`) and the posts' images stay.

## 1. A page's image settings in the code today

### 1.1 Every image setting a page has in the editor

| Where in the editor                                        | Setting                                                                                    | Stored                                                         | Changes                                                       |
| :--------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------ |
| Page form, `Page settings`                                 | none (title, URL, short description, tags, template, for review)                           | front matter                                                   | no                                                            |
| Page form, `Search engines`                                | none (Google title and description, keywords, original page, No index, No follow)          | front matter                                                   | no                                                            |
| Page form, `Social media`                                  | `Image when shared`                                                                        | `shareImage`                                                   | no, it stays                                                  |
| Text, `Main heading` › `Section settings`                  | `Background image`, `Image description` (with `Color` and `Width`)                         | the marker before the H1: `data-picture`, `data-alt`           | **removed**; `Color` and `Width` stay                         |
| Text, an H2 › `Section settings`                           | `Background image`, `Image description` (with `Color` and `Width`)                         | the marker before the H2                                       | no, it stays (a section of the text, not the page's top)      |
| Text, blocks                                               | an Image, and the images of blocks (Banner, Cards, Image grid …)                           | the text                                                       | no (the page's content)                                       |

So **the page form has no image field other than the share image**, and the one page-level image at a page's top is the
main heading's background image. One more thing an owner may see as a page's top image: a **Banner block** (type
`hero`) with an image right under the H1 that 0.17 could not migrate into the H1's section (it has a heading of its own,
is hidden, or the H1 already had settings; `lib/front-banner.mjs`). That is a block in the text, so it stays; the PM can
ask the owner whether it was meant too (question 2).

### 1.2 The post's top image (kept)

- **Stored:** front matter `image`, `imageAlt`, `imageDecorative` of a blog post (`site/content.config.ts`, collection
  `blog`).
- **Edited:** the post form's `Image at the top` with `Decorative image` and `Alt text` (`defaults/collections.ts`, the
  `blog` collection and `topImageText`), drawn in the text as the post's head (`POST_HEAD` and `postHead` in
  `src/EntryForm.tsx`, `HeadImage` in `src/fields.tsx`).
- **Drawn:** `theme/layouts/PostLayout.astro` (`heroImage`, `site/images.mjs`), the post cards and lists, the share image
  fallback `shareImage || image || firstImage(body)`.
- Nothing here changes. A post's H1 is its title field, not a heading in its text, so a post has no H1 section either.

### 1.3 A page has no top-image key in its front matter

- **Schema:** the `pages` collection in `site/content.config.ts` has no `image`, `imageAlt` or `imageDecorative`. Astro's
  `z.object` drops unknown keys, so a stray `image:` in a page file (hand-written, or copied from a post) is never drawn,
  never shared and never in the sitemap.
- **Form:** the `pages` collection in `defaults/collections.ts` has no image field ("a page has its images in its text",
  the comment on `topImageText`). `POST_HEAD` and the drawn head in `EntryForm.tsx` are for a post only.
- **Saving:** `src/frontmatter.mjs` writes only the changed fields, so a stray key survives a save unchanged.
- **Share image:** `shareImage`, else the first `![]()` image in the text (the first-image helper in `site/images.mjs`;
  `PageLayout.astro`); the SEO preview in the form uses the same rule (`firstImage`, `src/seo.ts`).
- **Structured data:** the photo list of `site/images.mjs` (all photos in the text and the blocks, a section's
  `data-picture` among them).
- **Sitemap, RSS, cards of pages, `Rows from` pages:** no page image key is read anywhere. RSS lists posts only.
- **The plan that would have added one:** the intuitive-editor spec
  (`docs/superpowers/specs/2026-11-11-intuitive-editor-design.md`, finding 15, step 1, decision 7, batch 11 *Page head and
  Preview*) says a page's head draws "the top image (tap to change)". That was never built for pages; PR 1 amends it.

### 1.4 The main heading's background image (removed)

- **Stored:** the section marker on the line before the page's H1 (`lib/section-marker.mjs`), e.g.
  `<div data-section="primary" data-picture="/images/a.webp#format=…&crop=…" data-alt="…" data-width="full"></div>`.
  `markerHtml` writes no marker without a colour or an image, and no `data-alt` without an image.
- **Edited:** `Section settings` on the `Main heading` (the menu action `sectionSettings` in `src/MarkdownEditor.tsx`,
  which asks `section(at, { image: true })` for an H1 and an H2 alike; `src/SectionSettings.tsx`, whose `image` flag shows
  `Background image`, `Image description` and `Width` together; `setSection` in `src/sectionState.mjs`, which clears the
  description without an image and keeps the width).
- **Drawn:** `theme/layouts/PageLayout.astro` (`h1Section`, `lib/without-h1.mjs`; the panel `data-editor="h1-section"`
  with `<Img class="text-section-image">` behind the heading and the intro), `theme/templates/Home.astro` (the same on
  the front page), the editor's Preview (`src/pagePreview.tsx`, `src/pageH1Panel.mjs`), `theme/styles/blocks.css`
  (`.text-section-image`, `.text-section-picture`).
- **Where it came from:** 0.17 migrated a front page's top Banner into the H1's section (`lib/front-banner.mjs`, run by
  `lib/migrate-content.mjs`, `morpheme migrate` and at read time). A Banner with its image behind the text became this
  background image; one with its image beside the text kept the image in the text.
- **Not the share image:** the share image reads `![]()` only.

### 1.5 Who uses it today

- **`demo/`:** no page has an H1 marker (`grep data-section` finds markers only on H2s of `typography.md`). The front page
  (`demo/src/content/pages/home.md`) has an H1, its text, a Buttons block and an Image in the text: nothing changes.
- **`starter/`:** the front page (`starter/src/content/pages/home.md`) has an H1, a short text and a Banner (`hero`) with
  `width: full` and **no image**. 0.17 reads it as the H1's section with `Surface` and `Width: full` and no image
  (`frontBannerPlan`: `markerHtml({ color: 'surface', width: 'full' })`). Path A leaves it exactly as it is: a full-width
  Surface panel with the heading, the text and the buttons. The demo's and the starter's front pages look the same before
  and after.
- **Sara's site:** the owner says only Sara's site could use a page top image. The 0.18 PM checked it
  (`saravafaiblom/Sarashjemmesidedata`, `src/content/pages/`, 78 page files, `origin/main`, 14 Nov 2026): no page has a
  top-image key (its only image keys are one `shareImage` with its `imageAlt`, which stay), and no page file contains
  `data-picture` (0 of 78), so no page has a main heading background image.
- **Other themes:** the PM checked `morpheme-apps` (`origin/main`, `themes/`, 14 Nov 2026): no theme uses `h1Section` or
  `data-picture`, so Venus does not draw it. No pull request there.

## 2. Migration: no site loses content

Done as the 0.17 Banner migration was (`lib/front-banner.mjs`, `lib/remark-banner-section.mjs`,
`lib/migrate-content.mjs`): read the old form everywhere, write the new form on save and on `morpheme migrate`.

1. **New pure module `lib/h1-image.mjs`:** `migrateH1Image(markdown)` (Markdown to Markdown) and `remarkH1Image` (the
   same on a tree). For a text whose first H1 has a marker with `data-picture`:
   - the marker is written again with `markerHtml({ color, width })`: the colour and the width stay, the image and its
     description go. Without a colour `markerHtml` writes nothing, so the marker line goes (a width without a colour or an
     image draws nothing, so nothing visible is lost). A label line above the H1 stays where it is.
   - The image becomes an Image in the text, in a paragraph of its own **right after the H1**, before the intro:
     `![<data-alt>](<data-picture>)`. The address keeps its `#format=…&crop=…` fragment, so the crop survives (the crop
     reader in `lib/crop.mjs`). A marker without `data-alt` (the sheet's hint: "Leave it empty for an image that is only
     decoration") is written with the decorative mark the Image in the text uses (`decorativeOf`, `lib/crop.mjs`), so a
     screen reader still skips it.
   - Everything else stays byte for byte; an H2's marker is never touched; a marker in a code fence is not a marker.
     Idempotent: a migrated text comes back unchanged.
2. **Read the old form everywhere:** `remarkH1Image` goes in the site's pipeline (`astro.mjs` `remarkPlugins`,
   `lib/markdown.ts`) and the editor's (`src/markdown.mjs`), right **after** `remarkBannerSections` (so a 0.17 Banner
   migrated at read time into an H1 image is moved on in the same read). An old page looks migrated on the site, in the
   editor and in Preview before anyone saves it; the editor writes the new form on the next save.
3. **Write it:** `migrateMarkdown` in `lib/migrate-content.mjs` runs `migrateH1Image` after the Banner migrations, so
   `morpheme migrate` rewrites the files and `check:editor` (each page the same after a save) passes.
4. **The front page is a page** and is migrated like any other (owner: "on pages"). On the demo and the starter it changes
   nothing (1.5).

**What is lost:** the look, not the content. A heading and intro over a darkened image become a heading with the image
under it, as wide as the text column (an Image in the text has no `Width: full`). The panel keeps its colour and width.
The image, its description, its decorative mark and its crop are kept.

**Side effect:** a page with no `shareImage` and no other `![]()` image now shares this image, since it is the first
image in its text. The migration never writes `shareImage` (question 3).

**Stray `image:` keys in a page's front matter** (none in the demo, the starter or Sara's site): never dropped. The site
never drew one and the editor keeps it on save, so leaving it alone keeps it and changes nothing (question 4).

## 3. What a theme may still do

No contract change: `THEME_API` stays 4, `APP_API` stays 5, never `major`. `h1Section()` keeps its shape
(`{ color, image, alt, width }`); after the read-time migration `image` is always `null` for a page, so a theme that still
draws it (only the default theme) draws nothing and breaks nothing. An old site keeps working because the migration runs
before any theme sees the text. The default theme's dead drawing code is removed in PR 4 (`patch`); `.text-section-image`
stays, since H2 sections and `RichText.astro` use it.

## 4. The editor

- **`Section settings` on a page's `Main heading`:** `Color` and `Width`; no `Background image`, no `Image description`.
  `SectionSettings` gets two flags instead of one (`image` for the image and its description, `width` for the width);
  `sectionSettings` in `MarkdownEditor.tsx` asks `{ image: level === 2, width: true }`. `setSection` gets no `image` for
  an H1, so it cannot write one.
- **`Section settings` on an H2:** unchanged (`Background image`, `Image description`, `Width`).
- **Page form:** nothing to remove; its one image is `Image when shared` under `Social media`, which stays.
- **Page head (batch 11):** a page's head is its H1, as today; the plan is amended (PR 1) so it never gets a top image.
- **Post form:** unchanged. `Image at the top`, `Decorative image`, `Alt text` and the drawn post head stay.

`material-3`: the section settings sheet is a block menu, part of the editor's own workspace, so no M3 page governs it.
On the site, a heading panel with an image behind it becomes a heading followed by the theme's existing Image in the
text: no new part, mark or size, so there is no deviation to record.

## 5. Texts, release note and checks

- **Texts:** none new. The sheet only hides fields that already have texts. Stale comments are corrected in English
  (`lib/without-h1.mjs` "above the image", the header of `SectionSettings.tsx`, `PageLayout.astro` and `Home.astro`).
- **Release note** (PR 3, `minor`): a `paragraph`, mark `improvement`.
  - en-US, title _Page headings_: "A page’s main heading no longer has an image behind it, so a page’s images are all in
    its text. If you had one there, it now stands right under the heading, with its description and crop."
  - da-DK, title _Sidens overskrift_: "Sidens hovedoverskrift har ikke længere et billede bag sig, så alle sidens billeder
    står i teksten. Havde du et billede der, står det nu lige under overskriften med sin beskrivelse og beskæring."
- **Checks:** `npm run check` always; for PR 3 also `npm run check:screens` after `npm run build` (the `Section settings`
  sheet on an H1 and on an H2, at 375 and 1280), `check:demo`, `check:starter` and `check:themes` in
  `.morpheme/demo/site/`; for PR 4 `check:themes` and `check:screens`.
- **Unit test of the migration** (`lib/h1-image.test.mjs`):
  - every page file in `demo/src/content/pages/` and `starter/src/content/pages/` comes back byte for byte;
  - `starter/src/content/pages/home.md` after `migrateFrontBanner` and then `migrateH1Image` keeps its
    `Surface`/`full` marker and gets no Image;
  - fixtures in `lib/fixtures/`: an H1 marker with an image, alt and crop; with a colour and an image (the colour stays);
    with no colour and `data-width="full"` (the marker goes); with no `data-alt` (decorative mark); with a label above the
    H1; with an intro after the H1 (the Image comes before it); an H2 marker with an image (untouched); a marker in a code
    fence (untouched); a 0.17 front-page Banner with its image behind (`migrateFrontBanner`, then this);
  - idempotence, and `migrateMarkdown` runs it.

## 6. Build plan (into `0.18`)

Each visible pull request follows this rule: "When a change the owner can see (the editor or the site) is done and
`check` is green, add before and after screenshots of every changed screen to a comment on your own pull request, as the
`pm` skill's _Screenshots in the pull request_ says, and tell the PM with the link and head sha. A change nobody sees
needs none."

**PR 1, empty changeset, no screenshots.** Amend the intuitive-editor spec (finding 15 evidence, step 1, decision 7, the
batch 11 row): a page's head is its H1, with no top image; a post's head is unchanged. Add a guard test (a new
`defaults/collections.test.mjs`): the `pages` collection has no `image`, `imageAlt` or `imageDecorative` field, so batch
11 cannot add one by accident.

**PR 2, `patch`, no screenshots.** `lib/h1-image.mjs` (`migrateH1Image`, `remarkH1Image`) and `lib/h1-image.test.mjs`
with the fixtures above. Not wired yet, so nothing a site sees changes.

**PR 3, `minor`, release note, screenshots.** Wire `remarkH1Image` into `astro.mjs`, `lib/markdown.ts` and
`src/markdown.mjs`, and `migrateH1Image` into `lib/migrate-content.mjs`; `SectionSettings` with the two flags and the
`Main heading` without the image fields. A test page with an old H1 image for `check:screens` lives under `scripts/`, not
in `demo/src/content/`. Screenshots: the `Main heading`'s `Section settings` before and after (375 and 1280); a page with
a former main heading image on the site before and after.

**PR 4, `patch`, no screenshots.** Remove the dead H1 image drawing from `PageLayout.astro`, `Home.astro`,
`src/pagePreview.tsx` and `src/pageH1Panel.mjs` (the colour and width panel stays) and correct their comments.
`check:themes`, `check:screens`.

PR 2 waits for nothing; PR 1 can run beside it; PR 3 needs PR 2; PR 4 needs PR 3.

## 7. Questions for the owner

1. ~~Which image did you mean?~~ Answered 14 Nov: the main heading's background image (Path A).
2. **A Banner block with an image right under a page's heading** (one 0.17 could not move into the heading) also looks
   like a top image. Leave it?
   _Recommendation:_ leave it. It is a block in the text, which the owner can move or delete like any other, and the demo,
   the starter and Sara's site have none with an image.
3. **May the moved image become the page's share image** when the page has none of its own?
   _Recommendation:_ yes; it is the page's own image and the first thing it shows.
4. **Stray `image:` keys in old page files** (never drawn, none known): leave them?
   _Recommendation:_ leave them; removing keys changes files for no visible gain.
