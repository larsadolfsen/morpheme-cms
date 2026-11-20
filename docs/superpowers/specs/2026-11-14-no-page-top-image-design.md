# No top image on pages (design and build plan, 0.18)

Status: decided, ready to build. Build plan in section 6.

**Owner decisions (14 Nov 2026):**

1. "Isn't the top image a blog feature?" Pages lose their top image; blog posts keep theirs (the post's image, used in
   lists, cards and sharing).
2. "Remove the page image setting on pages." The page's top image is the main heading's background image (section 1).
3. "Remove the page image. Don't worry about breaking anything or migrating pages with a set image. Just delete it." **No
   migration.** A value left in an old page is ignored. The share image (`shareImage`) and the posts' images stay. Never
   `major`: the visible pull request is `minor`.

## 1. A page's image settings in the code today

### 1.1 Every image setting a page has in the editor

| Where in the editor                       | Setting                                                                           | Stored                                               | Changes                                |
| :---------------------------------------- | :-------------------------------------------------------------------------------- | :--------------------------------------------------- | :------------------------------------- |
| Page form, `Page settings`                | none (title, URL, short description, tags, template, for review)                  | front matter                                         | no                                     |
| Page form, `Search engines`               | none (Google title and description, keywords, original page, No index, No follow) | front matter                                         | no                                     |
| Page form, `Social media`                 | `Image when shared`                                                               | `shareImage`                                         | no, it stays                           |
| Text, `Main heading` › `Section settings` | `Background image`, `Image description` (with `Color` and `Width`)                | the marker before the H1: `data-picture`, `data-alt` | **deleted**; `Color` and `Width` stay  |
| Text, an H2 › `Section settings`          | `Background image`, `Image description` (with `Color` and `Width`)                | the marker before the H2                             | no (a section of the text)             |
| Text, blocks                              | an Image, and the images of blocks (Banner, Cards, Image grid …)                  | the text                                             | no (the page's content)                |

The page form has no image field other than the share image. A page has **no top-image key** in its front matter: the
`pages` schema in `site/content.config.ts` and the `pages` collection in `defaults/collections.ts` have no `image`,
`imageAlt` or `imageDecorative` (Astro's `z.object` drops a stray key; `src/frontmatter.mjs` keeps it on save; it is drawn
nowhere). The intuitive-editor spec (`docs/superpowers/specs/2026-11-11-intuitive-editor-design.md`, finding 15, step 1,
decision 7, batch 11) planned "the top image (tap to change)" for a page's head; it was never built for pages.

So the page's top image is **the main heading's background image**.

### 1.2 The main heading's background image (deleted)

- **Stored:** the section marker on the line before the page's H1 (`lib/section-marker.mjs`), e.g.
  `<div data-section="primary" data-picture="/images/a.webp#…" data-alt="…" data-width="full"></div>`.
- **Read into the editor:** `remarkSectionMarkers` and the heading's `parseMarkdown` in `src/markdown.mjs` copy
  `sectionImage` and `sectionAlt` onto any H1 or H2; its `toMarkdown` writes them back with `markerHtml`; the `top` part
  of `partsOfMarkdown` carries them (`topOf`, `src/markdown.mjs` around line 432).
- **Edited:** `Section settings` on the `Main heading`: the action `sectionSettings` in `src/MarkdownEditor.tsx` asks
  `section(at, { image: true })` for an H1 and an H2 alike; `src/SectionSettings.tsx`'s one `image` flag shows
  `Background image`, `Image description` and `Width` together; `setSection` in `src/sectionState.mjs`.
- **Read on the site:** `h1Section` in `lib/without-h1.mjs` (`parseMarker` of the H1's marker).
- **Drawn:** `theme/layouts/PageLayout.astro` and `theme/templates/Home.astro` (`<Img class="text-section-image">` in
  the panel `data-editor="h1-section"`, `sectionClass` adding `text-section-picture`); the editor's Preview
  (`src/pagePreview.tsx`, `src/pageH1Panel.mjs`).
- **Written by 0.17's front-page Banner migration:** `frontBannerPlan` in `lib/front-banner.mjs` writes a Banner whose
  image is behind its text into the H1's marker (`markerHtml({ color: '', image: src, … })`).
- **Blog posts** have no H1 section (a post's H1 is its title field), so nothing of a post changes.

### 1.3 Who uses it

- **`demo/`:** no page has an H1 marker; `data-section` appears only on H2s of `typography.md`. The front page
  (`demo/src/content/pages/home.md`) has an H1, text, a Buttons block and an Image in the text. No edit needed.
- **`starter/`:** the front page (`starter/src/content/pages/home.md`) has an H1, a short text and a Banner (`hero`) with
  `width: full` and **no image**. 0.17 reads it as the H1's section with `Surface` and `Width: full` and no image. It does
  not use the background image, so no edit is needed and it looks the same after.
- **Sara's site** (checked by the 0.18 PM, `origin/main`, 78 page files): no top-image key, no `data-picture`, no Banner
  block.
- **Other themes:** `morpheme-apps` `themes/` (checked by the PM): no use of `h1Section` or `data-picture`; Venus is not
  changed.

## 2. What happens to an old page

Nothing migrates. A page's H1 marker with `data-picture`/`data-alt` is **ignored**:

- **On the site:** `h1Section` returns `image: null` and `alt: null` for the H1, so no theme draws it. The photo list
  (`site/images.mjs`) is left as it is: it only lists photo addresses for the structured data, and a stray address there
  is harmless. (The builder may drop it there too, if it is one line.)
- **In the editor:** a level-1 heading reads no `sectionImage`/`sectionAlt`, so the editor never shows them and the next
  save writes the marker without them (`markerHtml` writes no marker without a colour or an image, so a marker that had
  only an image goes). `Color` and `Width` are kept.
- **The 0.17 front-page Banner migration** no longer writes an image into the H1: in `frontBannerPlan` a Banner whose image
  is behind its text is not migrated (returns `null`), so it stays a Banner block, as a Banner that cannot migrate does
  today (`former`, `lib/blocks.mjs`). Its image stays on the page. A Banner without an image, or with its image beside the
  text, migrates as before (the starter's front page).

What is lost: on a page that had one (none known), the image behind its heading. Owner: accepted.

## 3. What a theme may still do

No contract change: `THEME_API` stays 4, `APP_API` stays 5, never `major`. `h1Section()` keeps its shape
(`{ color, image, alt, width }`) with `image` and `alt` always `null`, so a theme that reads them still builds and draws
nothing. The default theme's drawing code for it is deleted. `.text-section-image` and `.text-section-picture` stay: H2
sections (`RichText.astro`) use them.

## 4. The editor

- **`Section settings` on a page's `Main heading`:** `Color` and `Width` only. `SectionSettings` gets two flags (`image` for
  `Background image` and `Image description`, `width` for `Width`); `sectionSettings` asks
  `{ image: level === 2, width: true }`.
- **`Section settings` on an H2:** unchanged.
- **Page form:** unchanged; its one image is `Image when shared`.
- **Page head (batch 11):** a page's head is its H1; the plan is amended so it never gets a top image.
- **Post form:** unchanged (`Image at the top`, `Decorative image`, `Alt text`, the drawn post head).

`material-3`: the section settings sheet is a block menu, the editor's own workspace. On the site a page's heading panel
simply has no image behind it, as most panels already do: no new part, so no deviation.

## 5. Texts, release note and checks

- **Texts:** none new; the sheet only hides fields that have texts. Comments that describe an H1 image are corrected in
  English (`lib/without-h1.mjs` "above the image", `SectionSettings.tsx`, `src/markdown.mjs`, `PageLayout.astro`,
  `Home.astro`, `lib/front-banner.mjs`, `src/pageH1Panel.mjs`).
- **Docs:** the intuitive-editor spec (batch 11) amended; `docs/` that describe the H1 background image corrected (grep
  `h1Section`, `H1 section`, `data-picture`).
- **Release note** (the `minor` pull request): a `paragraph`, mark `improvement`.
  - en-US, title _Page headings_: "A page’s main heading no longer has a background image, so a page’s images are all in its
    text. Its colour and width stay in Section settings, and blog posts keep their image at the top."
  - da-DK, title _Sidens overskrift_: "Sidens hovedoverskrift har ikke længere et baggrundsbillede, så alle sidens billeder
    står i teksten. Farve og bredde ligger stadig i Sektionsindstillinger, og blogindlæg beholder deres billede øverst."
- **Checks:** `npm run check` (with `check:editor`: every demo page the same after a save); `npm run check:screens` after
  `npm run build` (the `Main heading`'s and an H2's `Section settings` at 375 and 1280); `check:demo`; `check:starter`;
  `check:themes` in `.morpheme/demo/site/`.
- **Unit tests:**
  - `src/sectionState.test.mjs` (or a new `src/markdown.test.mjs`): an H1 marker with colour, width, image and alt reads as colour and
    width only and is written back without `data-picture`/`data-alt`; an H1 marker with only an image is dropped on save;
    an H2 marker with an image is read and written unchanged.
  - `lib/without-h1.test.mjs`: `h1Section` returns `image: null`, `alt: null` and keeps colour and width.
  - `lib/front-banner.test.mjs`: a Banner with its image behind under the H1 is not migrated; the starter's front page
    migrates as before (Surface, full, no image).
  - A guard test (new `defaults/collections.test.mjs`): the `pages` collection has no `image`, `imageAlt` or
    `imageDecorative` field.

## 6. Build plan (into `0.18`)

Each visible pull request follows this rule: "When a change the owner can see (the editor or the site) is done and
`check` is green, add before and after screenshots of every changed screen to a comment on your own pull request, as the
`pm` skill's _Screenshots in the pull request_ says, and tell the PM with the link and head sha. A change nobody sees
needs none."

**PR 1, `minor`, release note, screenshots.** Delete the H1 background image everywhere: `src/markdown.mjs` (no
`sectionImage`/`sectionAlt` for level 1, in `remarkSectionMarkers`, `parseMarkdown` and the `top` part),
`src/SectionSettings.tsx` (two flags), `src/MarkdownEditor.tsx` (`sectionSettings`), `lib/without-h1.mjs` (`h1Section`
without image and alt), `lib/front-banner.mjs` (a Banner with its image behind stays a Banner), the drawing in
`theme/layouts/PageLayout.astro`, `theme/templates/Home.astro`, `src/pagePreview.tsx` and `src/pageH1Panel.mjs`, their
comments, and the unit tests above. Screenshots: the `Main heading`'s `Section settings` before and after, at 375 and
1280. The site shows no change on the demo, so no site screenshot.

**PR 2, empty changeset, no screenshots** (can run beside PR 1). Amend the intuitive-editor spec (finding 15 evidence,
step 1, decision 7, the batch 11 row: a page's head is its H1, no top image; a post's head is unchanged), correct other
docs that describe an H1 background image, and add the guard test.

No questions are left for the owner.
