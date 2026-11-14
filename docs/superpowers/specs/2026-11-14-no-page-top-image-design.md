# No top image on pages (design and build plan, 0.18)

Status: spec, waiting for the owner's answers (section 7). No code is written until the owner answers question 1.

**Owner decision (14 Nov 2026):** "Isn't the top image a blog feature?" Pages lose their top image; blog posts keep theirs
(the post's image, used in lists, cards and sharing).

## 1. What a page's top image is in the code today

The main finding first: **a page has no top-image field.** Only a blog post has one. What the owner sees as a page's top
image can be one of two things, and they need different work (question 1).

### 1.1 The post's top image (kept, for reference)

- **Stored:** front matter `image`, `imageAlt`, `imageDecorative` of a blog post (`site/content.config.ts`, collection
  `blog`).
- **Edited:** the post form's field `Image at the top` with `Decorative image` and `Alt text` (`defaults/collections.ts`,
  the `blog` collection and `topImageText`), drawn in the text as the post's head (`POST_HEAD` and `postHead` in
  `src/EntryForm.tsx`, `HeadImage` in `src/fields.tsx`).
- **Drawn:** `theme/layouts/PostLayout.astro` (`heroImage`, `site/images.mjs`), the post cards and lists, the share image
  fallback `shareImage || image || firstImage(body)`.
- Nothing here changes.

### 1.2 A page: no front matter key

- **Schema:** the `pages` collection in `site/content.config.ts` has no `image`, `imageAlt` or `imageDecorative`. Astro's
  `z.object` drops unknown keys, so a stray `image:` in a page file (hand-written, or copied from a post) is never drawn,
  never shared and never in the sitemap.
- **Form:** the `pages` collection in `defaults/collections.ts` has no image field. The comment on `topImageText` says it
  plainly: "a page has its images in its text". `POST_HEAD` and the drawn head in `EntryForm.tsx` are for a post only
  (`collection.id === 'blog'`); a page's head in the editor is its H1, typed in the text.
- **Saving:** `src/frontmatter.mjs` writes only the changed fields, so a stray key in an old page file survives a save
  unchanged.
- **Share image of a page:** `shareImage`, else the first `![]()` image in the text (the first-image helper in `site/images.mjs`;
  `PageLayout.astro`). The SEO preview in the form uses the same rule (`firstImage`, `src/seo.ts`; `EntryForm.tsx` reads
  `values.image`, which a page never has).
- **Structured data:** the photo list of `site/images.mjs` (all photos in the text and the blocks, including a section's
  `data-picture`).
- **Sitemap, RSS, cards of pages, `Rows from` pages:** no page image key is read anywhere. RSS lists posts only.
- **Sites:** the owner says only Sara's site could use one. The 0.18 PM checked it (`saravafaiblom/Sarashjemmesidedata`,
  `src/content/pages/`, 78 page files, `origin/main` on 14 Nov 2026): no page has a top-image key. Its only image keys are
  one `shareImage` with its `imageAlt`, the share image, which stays. The PM also checked for H1 markers with an image: no page file
  contains `data-picture` (0 of 78), so no page there has an H1 section background image either.
- **`demo/` and `starter/`:** no page file has `image:` in its front matter (checked: `grep '^image:'` finds only the nine
  demo blog posts).

### 1.3 The plan that would have added one

The intuitive-editor spec (`docs/superpowers/specs/2026-11-11-intuitive-editor-design.md`, finding 15, step 1, decision 7
and batch 11 *Page head and Preview*) says the page head draws "the H1 (the title), the top image (tap to change)" for a
page as well as a post. That part was **not built** for pages: the evidence list there names "a page's … top image" as a
form field, which the code never had. Batch 11's page part is still a plan, so the decision is easy to keep: the page head
never gets a top image.

### 1.4 What a page does have at its top: the H1 section's background image

The only image a page can show at its top that is not an image in its text:

- **Stored:** the section marker before the page's H1 (`lib/section-marker.mjs`), e.g.
  `<div data-section="" data-picture="/images/a.webp#format=…&crop=…" data-alt="…" data-width="full"></div>` on the line
  before `# Heading`.
- **Edited:** `Section settings` on the `Main heading` (`src/MarkdownEditor.tsx`, the menu action `sectionSettings`;
  `src/SectionSettings.tsx` with `image: true` for any H1 or H2; `Background image`, `Image description`, `Width`;
  `src/sectionState.mjs`). The editor draws it as the coloured box at the top of the text.
- **Drawn:** `theme/layouts/PageLayout.astro` (`h1Section`, `lib/without-h1.mjs`; the panel `data-editor="h1-section"`
  with `<Img class="text-section-image">` behind the heading and the intro), `theme/templates/Home.astro` (the same on
  the front page), `src/pagePreview.tsx` and `src/pageH1Panel.mjs` (the editor's Preview), `theme/styles/blocks.css`
  (`.text-section-image`).
- **Where it came from:** in 0.17 the front page's top *Banner* block was migrated into exactly this
  (`lib/front-banner.mjs`, run by `lib/migrate-content.mjs` and `morpheme migrate`). A site that had a Banner at the top of
  its front page now has its hero image here.
- **Shared:** not the share image (that reads `![]()` only); it is in the photo list of the structured data.
- **Blog posts:** a post's H1 is its title field, not a heading in its text, so `PostLayout.astro` has no H1 section. This
  image is a page thing already, and it is the same feature as an H2 section's background image.
- **`demo/` and `starter/`:** no page has an H1 marker with an image. Only `demo/src/content/pages/typography.md` has
  section images, on two H2s.

### 1.5 Other themes

The 0.18 PM checked `morpheme-apps` (`origin/main`, `themes/`, 14 Nov 2026): no theme uses `h1Section` or `data-picture`, so
Venus does not draw the H1 section's image. Path A needs no pull request there.

## 2. Migration: no site loses content

### Path B (recommended): the page head never gets a top image

Nothing is stored, so nothing migrates: no page in `demo/`, `starter/` or Sara's site has the key. The smallest safe rule
for a page anywhere that still carries `image:` (hand-written or copied from a post): never drop it. The site never drew it,
and the editor keeps it on save (`src/frontmatter.mjs` writes only changed fields), so leaving the key alone keeps the image
and changes nothing on the site. Moving it into the text as an Image at the top would keep it too, but would add an image
the page never showed (question 4). Nothing is lost.

### Path A (only if the owner means 1.4): the H1 section's image moves into the text

If the owner wants the image behind a page's heading gone, the image must not disappear. Recommended migration, done as
the 0.17 Banner migration was (`lib/front-banner.mjs`, `lib/remark-banner-section.mjs`, `lib/migrate-content.mjs`):

1. **New pure module `lib/h1-image.mjs`:** `migrateH1Image(markdown)` and a remark plugin `remarkH1Image`. For a page
   whose first H1 has a marker with `data-picture`:
   - the marker keeps its colour (`data-section`) and loses `data-picture`, `data-alt` and `data-width` (the width belongs
     to the image, `sectionState.mjs` clears it without one); a marker with no colour left is removed;
   - an Image is written as its own paragraph right after the H1 line:
     `![<data-alt>](<data-picture>)`. The address keeps its `#format=…&crop=…` fragment, so the crop survives
     (the crop reader in `lib/crop.mjs`). An empty `data-alt` is written with the decorative mark the Image in the text uses
     (`decorativeOf`, `lib/crop.mjs`), so a screen reader still skips it.
   - Everything else stays byte for byte. Idempotent: a migrated text comes back unchanged.
2. **Read the old form everywhere:** the plugin goes in the site's pipeline (`astro.mjs`, `lib/markdown.ts`) and the
   editor's (`src/markdown.mjs`), next to `remarkBannerSections`, so an old page looks migrated on the site, in the editor
   and in Preview before anyone saves it. The editor writes the new form on the next save.
3. **Write it:** `lib/migrate-content.mjs` calls `migrateH1Image`, so `morpheme migrate` rewrites the files, and
   `check:editor` (each page the same after a save) passes.
4. **Front page:** see question 2. If the front page is excluded, the plugin needs to know which page is the front page
   (`site/home.ts`); simpler is to migrate every page and accept that the front page's hero becomes an image under its
   heading.

**What is lost on Path A:** the look, not the content. The heading and intro over a darkened image become a heading with
the image below it; `Width: full` is gone (an Image in the text is as wide as the text column). The image, its
description and its crop are kept. **What changes as a side effect:** a page with no `shareImage` and no other image in its text now shares this image,
since it becomes the first `![]()` in the text (`site/images.mjs`). The migration never writes `shareImage`. See question 3.

## 3. What a theme may still do

- **Path B:** no contract change. `THEME_API` stays 4, `APP_API` stays 5.
- **Path A:** no contract change either. `h1Section()` keeps its shape (`{ color, image, alt, width }`); after the
  read-time migration `image` is simply always `null` for a page, so a theme that draws it (only the default theme;
  Venus does not) draws nothing and breaks nothing. The default theme's drawing code (`PageLayout.astro`, `Home.astro`) can be
  removed in a later `patch`. Never `major`: an old site keeps working because the read-time migration runs before any
  theme sees the text.

## 4. The editor

- **Page form:** nothing to remove; it has no image field.
- **Page head (batch 11):** a page's head is its H1, as today. The intuitive-editor spec is amended (PR 1) so batch 11 draws
  no top image for a page.
- **Path A only:** `Section settings` on a page's `Main heading` shows `Color` only, no `Background image`, `Image
  description` or `Width` (`SectionSettings` gets `image: false` for level 1; `MarkdownEditor.tsx` around
  `section(at, { image: true })`). H2 sections keep their image.
- **Post form:** unchanged. `Image at the top`, `Decorative image`, `Alt text` and the drawn post head stay.

The section settings sheet and the page head are the editor's own workspace, so `material-3` asks no M3 page for them.
Path A changes the site: a heading panel becomes a heading followed by the theme's existing Image in the text. M3 prints
no rule for a page's top image; the Image keeps the look it already has (no new part, mark or size), so there is no
deviation to record.

## 5. Texts, release note and checks

- **Texts:** none new on either path. Path A reuses existing strings (it only hides fields). The stale comments that say
  a page has a top image (`lib/without-h1.mjs` "above the image", `SectionSettings.tsx` header) are corrected in English.
- **Release note:**
  - Path B: nothing changes for an owner. Empty changeset, no note.
  - Path A: a `paragraph`, mark `improvement`, `minor`:
    - en-US, title *Page headings*: "A page’s main heading no longer has an image behind it; images on a page belong in its
      text. Any image you had there now stands right under the heading, with its description and crop."
    - da-DK, title *Sidens overskrift*: "Sidens hovedoverskrift har ikke længere et billede bag sig; billeder på en side hører
      til i teksten. Et billede, du havde der, står nu lige under overskriften med sin beskrivelse og beskæring."
- **Checks (Path A):** `npm run check`; `npm run check:screens` after `npm run build` (the `Section settings` sheet on an H1
  and on an H2, at 375 and 1280); `check:demo`; `check:starter`; `check:themes` in `.morpheme/demo/site/`.
- **Unit test of the migration (Path A):** `lib/h1-image.test.mjs`:
  - every page file in `demo/src/content/pages/` and `starter/src/content/pages/` comes back byte for byte (none has an
    H1 image today, so the migration must leave them alone);
  - fixtures in `lib/fixtures/`: an H1 marker with an image, alt and crop; with a colour and an image; with `data-width="full"`;
    with an empty alt (decorative); with a label above the H1; an H2 marker with an image (untouched); a marker with an image in a code
    fence (untouched); the output of `migrateFrontBanner` (the 0.17 front-page Banner) migrated on;
  - idempotence, and `migrateMarkdown` in `lib/migrate-content.mjs` runs it.
- **Path B:** `npm run check` (docs and a test only), plus the guard test below.

## 6. Build plan (into `0.18`)

Each visible pull request follows this rule: "When a change the owner can see (the editor or the site) is done and
`check` is green, add before and after screenshots of every changed screen to a comment on your own pull request, as the
`pm` skill's *Screenshots in the pull request* says, and tell the PM with the link and head sha. A change nobody sees
needs none."

**PR 1 (both paths), empty changeset, no screenshots.** Amend the intuitive-editor spec (finding 15 evidence, step 1,
decision 7, batch 11 row): a page's head is its H1, with no top image; a post's head is unchanged. Add a guard test
(a new `defaults/collections.test.mjs`): the `pages` collection has no `image`, `imageAlt` or
`imageDecorative` field and `site/content.config.ts`'s `pages` schema has no such key, so batch 11 cannot add one by
accident. Fix the two stale comments.

Path A only, after the owner answers:

**PR 2, `patch`, no screenshots.** `lib/h1-image.mjs` (pure `migrateH1Image`, `remarkH1Image`) and its unit test on the
demo and starter files and the fixtures. Not wired yet, so nothing a site sees changes.

**PR 3, `minor`, release note, screenshots.** Wire `remarkH1Image` into the site's and the editor's pipelines and into
`lib/migrate-content.mjs`; `Section settings` on a page's `Main heading` without the image fields. Add a demo page fixture
under `scripts/` (not in `demo/src/content/`) for `check:screens` to open an old-form page. Screens: the H1 sheet before
and after (375, 1280); a page with a former H1 image on the site before and after.

**PR 4, `patch`, no screenshots.** Remove the now-dead H1 image drawing from `PageLayout.astro`, `Home.astro`,
`pagePreview.tsx` and `pageH1Panel.mjs` (the colour panel stays). `check:themes`.

## 7. Questions for the owner

1. **Which image did you mean?** A page has no top-image field today; the page head with a top image was only planned
   (batch 11). The one image at a page's top is the `Background image` in the `Section settings` of the page's main
   heading, the same setting an H2 section has, and where 0.17 put a front page's old Banner.
   *Recommendation:* Path B. Keep pages without a top image for good (amend the plan) and keep the heading's background
   image, since it is a section setting, not a top image, and removing it would undo the 0.17 Banner migration.
2. **If Path A: the front page too?** Its hero is that background image since 0.17.
   *Recommendation:* exclude the front page, or choose Path B; a front page without a hero is the bigger visible change.
3. **If Path A: may the moved image become the page's share image** when the page has none of its own?
   *Recommendation:* yes; it is the page's own image and is what the page shows first.
4. **Stray `image:` keys in old page files** (never drawn): leave them?
   *Recommendation:* leave them. Removing keys from front matter changes files for no visible gain.
