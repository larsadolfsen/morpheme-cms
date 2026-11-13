# Image grid block (design)

Date: 2026-11-13. Design only, no code. Written for the owner, who reads on a phone.

Owner's words: "the image grid that we are making would also be a nice block to have, where you can sort by tags. So you can
use it in the front end as well to show images."

Words used here: a **tile** is one image in the grid. A **tag** is a label on an image (like a post's tag). A **filter
chip** is a small button above the grid that shows only the images with that tag. **Lightbox** means tapping an image to see
it bigger over the page.

## 1. What the block is

A new standard block, **Image grid**, for the site. It shows images from the site's Library in the staggered grid the
editor's Library will use (audit decision 3, spec `2026-11-13-editor-uses-theme-parts-audit.md`, row 3): each image in its
own proportions, rounded corners, a quiet tinted surface. By default a card is only the image, no names or captions. The
owner chooses what a card shows, and the card is drawn by the theme's Material 3 `Card` (section 4a), not a custom tile.
Visitors can tap a tag to show only those images, and tap an image to see it bigger.

On a phone (2 columns):

```
 [x Sea] [ Food ] [ People ]
 +--------+ +--------+
 |        | |        |
 |        | +--------+
 +--------+ +--------+
 +--------+ |        |
 |        | |        |
 +--------+ +--------+
```

On a computer (4 columns):

```
 [x Sea] [ Food ] [ People ] [ Travel ]
 +------+ +------+ +------+ +------+
 |      | |      | |      | |      |
 |      | +------+ |      | +------+
 +------+ +------+ +------+ +------+
 +------+ |      | +------+ |      |
 |      | |      | |      | |      |
 +------+ +------+ +------+ +------+
```

Name in the editor: **Image grid** (group `content`, icon Phosphor `SquaresFour`; the Danish name is in the `da-DK` file).
Word choice follows Material 3: short, active, `image` everywhere. Setting names: `Images`, `Tags`, `Show filter`,
`Start with`, `Order`, `Open images bigger`, `Card shows`, `Card style`.

## 2. What exists today (read from the code)

- Images are files in `public/images/uploads/<year>/<month>/`. The build (`scripts/responsive-images.mjs`) makes webp copies
  at 160, 480, 800 and 1200 px and writes each image's real `width` and `height` to `src/data/image-manifest.json`.
- **Images already have tags.** Each image has a record `src/data/files/<id>.json` (`src/fileRecords.mjs`) with `categories`
  (its tags), `removed` and an optional `credit`. The Library edits them with `MediaTags.tsx` (chips and `Add tag`, one commit
  per change). These are the same tags (`categories`) that posts use.
- Images have **no alt text in the Library**. Alt text is written only where the image is used. An image in a page's or
  post's text has it in the Markdown (`![alt](src)`, edited in the image's sheet, `MarkdownEditor.tsx`); an image marked
  decorative has none (a mark in its address, `lib/crop.mjs`). A section's or hero's image has its own `alt` field
  (`BlockDialog.tsx`, `hero/fields.ts`). So every use today has a **local** alt text and no base one.
- The theme already has `Chip` (filter kind, `selected`), `Dialog` with the `full-screen` kind, `ChipSet`, and block scripts
  (`theme/blocks/cards/script.ts` is the model: one small script run on every page by `Base.astro`, doing nothing without
  the block).
- The `posts` block shows how a block picks by tags (`show: all | categories | picked`, relation field `categories`).

## 3. What has to be added

1. **A base alt text on the image record** (owner decision). Add `alt` (and optional `caption`) to the file record, edited in
   the Library next to the tags (`Describe the image`, with `Decorative image`). It is the text every use starts from.
   See section 3a for how it meets the local text.
2. **Width and height for the tiles.** The manifest has them for the site. The editor's `thumbnails.json` gets them too (the
   audit already plans this, row 3), so the grid reserves each box before the image loads.
3. **A site reader.** The block's `load.ts` reads the records and the manifest at build time and gives the view the list
   `{ src, alt, width, height, tags }`. The site ships no record file the visitor does not need.

## 3a. Alt text: two levels, one rule

Owner decision: the Library record holds a **base** alt text, and each use (a page, a blog post or a block) can set its own
**local** text.

**One rule for every image use** (the grid, the Image in a text, the hero and section images, the post's top image):

1. If the use has a local alt text, it is used.
2. Else the Library's base text is used.
3. Else there is none (question 3 below).

Decorative follows the same order: a use marked decorative draws `alt=""` whatever the Library says; a Library image marked
decorative is decorative in every use that has no local text.

**What the editor shows.** In a use's sheet the alt field is empty when nothing is set locally and shows the Library's text
as its hint (placeholder), with the line `Using the image's text. Type to change it for this use only.` Typing saves only on
this use and never writes back to the Library. Clearing the field goes back to the Library's text. To change the base
text for everywhere, the owner edits it in the Library.

**What exists.** The Image in a text, the hero and section images and the post's top image already have a local alt text
(and `Decorative image`), so the local level exists today. What is new is only the Library's base text and the fall-back to
it. The same rule is written once, in a small pure function (the shared alt rule, PR 0), used by every image use, with a
unit test, so the uses cannot differ. Moving the existing uses to it is a follow-up (PR 3b), without changing a saved page.

**The grid.** The grid has no local text per image in its card (many images, one block). It draws each image's base text from
the Library. A block can still set a local text for one image in its sheet (`Images`, pick an image, `Describe the image`),
which wins by the rule above. Most grids will use the base texts only.

## 3b. Images with no alt text: the SEO score, not a warning

Owner decision: no warning on the block or on the Library tile. A missing alt text shows in the page's **SEO score**.

The SEO score must read the images inside blocks too (today `images()` in `src/seo.ts` skips them). That is **not designed
here**: it is its own small pull request, started by the PM (patch, `src/seo.ts`), with one exported rule for "the alt text
of an image use": the use's local text, else the Library's base text, else missing; decorative (`alt=""`) counts as fine.
This spec only says: **the grid's images use that rule, and the SEO score counts them.** The grid draws an image with no
text at all as `alt=""`. The rule in section 3a is the same one; if the two differ, that pull request wins and this spec
follows it.

## 4. The block's settings

Everything that is not text sits in the settings sheet (the inline rule). The block has no typed text, so it opens its
sheet on insert, like the Image block.

| Setting | Choices | Default |
| --- | --- | --- |
| `Images` | `All images with tags` (pick tags) or `Picked images` (pick in the Library, drag to order) | All with tags; no tag picked = all images |
| `Show filter` | on / off | on, only when 2 or more tags exist in the shown images |
| `Start with` | no tag chosen (all images) or one or more tags chosen | no tag chosen |
| `Order` | `Newest`, `Oldest`, `Library order` (picked), `Random each build` | Newest |
| `Open images bigger` | on / off | on (on the site; in the editor a tap opens the image's settings) |
| `Card shows` | any of `Caption`, `Tags`, `Credit` (the image is always shown) | none: image only |
| `Card style` | `Filled`, `Elevated`, `Outlined` | Filled |
| `Columns` | `Auto` or `2`, `3`, `4` on a computer | Auto |
| `Show at most` | a number, 1 to 500; empty = the default of 100 | empty (100) |

**Columns and gap.** Material 3 prints the breakpoints: compact under 600 dp, medium 600–839, expanded 840–1199, large
1200–1599, extra-large 1600 and up. It prints **no column count for an image grid** (the pages I read do not; section 10).
So the counts are our choice, on M3's breakpoints: compact 2, medium and expanded 3, large and extra-large 4. The **gap
between cards is 8 dp at every breakpoint**: M3's card page says "Padding between cards: 8dp max", and its spacing page says
cards "should maintain consistent horizontal spacing to establish a strong rhythm when their height varies", which is our
staggered grid. Breakpoints come from `lib/breakpoints.mjs` and the CSS (`--breakpoint-*`), never a number in the block. The
columns are CSS columns or a masonry-style grid chosen in PR 1, not a script.

## 4a. The card: what it shows, and how it looks

Owner: the grid has a setting for what each card shows, and the card is designed by that, following Google's Material 3
cards. So the card is the theme's `Card` part (`theme/ui/Card.tsx`, kinds `elevated`, `filled`, `outlined`), the same part
every block uses. There is no separate tile look.

- **`Card shows`** picks the extra parts under the image, named as M3 names a card's text blocks (headline, subhead,
  supporting text): `Credit` and `Tags` are the **subhead** (M3: "smaller text elements, such as an article byline or a
  tagged location") and `Caption` is the **supporting text** ("body content"). They are plain text, not buttons;
  filtering is done by the chips above the grid. The image itself is always shown. There is no headline: an image has no
  title.
- **`Card style`** picks the card kind: `Filled` (default, the quiet tinted surface the owner described), `Elevated`
  (a shadow) or `Outlined` (a line). M3: "Each provides the same legibility and functionality, so the variant you use
  depends on style alone." M3's colours: elevated = surface container low; filled = surface container highest; outlined =
  surface with an outline variant line; corner 12 dp; 16 dp left and right padding for text.
- The theme draws the rest: corner, surface, text styles, elevation. A theme restyles the cards by restyling `Card`.
  Cards in the grid are **coplanar** (M3: they "share the same resting elevation unless they're picked up or dragged").

What each choice gives (M3 "card with media"). M3's anatomy order is container, image, headline, subhead, supporting text:

| `Card shows` | Card |
| --- | --- |
| nothing (default) | Media card: the image fills the card edge to edge, no text area. The card is the image with the kind's surface and corner. This is the owner's tile. M3's rule "the card container is the only required element" allows it. |
| `Caption` | Image on top, the caption (supporting text) under it, 16 dp left and right. |
| `Tags` or `Credit` | Image on top, one line of subhead text under it. |
| `Caption` and `Tags` or `Credit` | Image on top; the subhead line, then the caption. Text uses M3 body-medium (caption) and label-medium (subhead). |

```
 Image only          With caption        Tags + caption
 +--------+          +--------+          +--------+
 |        |          |        |          |        |
 |  image |          |  image |          |  image |
 |        |          +--------+          +--------+
 +--------+          | Sunset |          | Sea · Food
                     +--------+          | Sunset |
                                         +--------+
```

M3 says text on images "isn't recommended" and, if needed, wants a scrim: the card puts all text **under** the image, never on
it, so no scrim is needed.

**How it fits the staggered grid.** The grid is unchanged: columns of cards of different heights. The image keeps its own
proportions (real `width` and `height`), so a card's height is the image's height plus its text rows, and the text never
crops the image. Cards do not break across columns. With nothing chosen the grid looks exactly as in section 1. Text is
at most 2 lines for a caption and 1 for tags, then cut with an ellipsis; the full caption is in the lightbox.

**What changes in the audit's `ImageTile` (row 3).** It is no longer a new part. PR 1 adds a media slot to the theme's
`Card` (an image box with the card's corner, `card-media`, no padding) and a selected state for the editor (M3's selection: a check mark icon and a change of surface colour, not a ring; the ring is only the focus ring; section 10),
and `ImageTile` becomes a thin wrapper of `Card` with a media. The editor's Library uses it with `Filled` and nothing else
shown, so the owner's reference look stays.

## 5. How it behaves on the site

- **Filter (owner decision: several tags, AND).** M3 filter chips, one per tag (`Chip`, filter kind). Tapping selects
  it and adds a leading check mark (M3); tapping again unselects it. "Multiple chips can be selected or unselected." A
  visitor can choose more than one tag, and an image shows only if it has **all** the chosen tags (the AND rule is the
  owner's; M3 does not say how several filters combine). With none chosen, all images show. There is **no `All` chip**: M3
  has no such chip, and it warns against mixing chip behaviours in one set, so "clear" is a `Clear tags` text button that
  shows only while a tag is chosen (buttons are for actions, chips for filters). The chips sit **outside and above the
  grid** (M3: "Filter or sorting options should be placed outside of the card collection") and the filter applies to
  every card. Chips are 32 dp high with an 8 dp corner, labels in nouns of 20 characters or fewer (longer tag names are
  cut with an ellipsis), at least 8 dp between chips and a 48 dp target. M3: "Filter chips can wrap to a new row. If there
  are more than two rows, consider using horizontal scrolling": they wrap, and `script.ts` turns the set into one
  horizontally scrolling row when it would take more than two rows. M3: filter chips "should not present only a single
  option", which is why the filter is drawn only when the shown images have two or more tags.
- **A tag that would show nothing.** After each choice, a tag chip whose addition would leave no image is `disabled` (greyed,
  not removed, so the row does not jump), so the visitor cannot reach an empty grid by tapping (M3 lists a disabled state for filter chips and says suggestions "can dynamically change as a person starts to select filters"). The counts are not drawn on
  the chips. If the grid is still empty (the block's `Start with` tags have no common image), it shows the text `No images
  have all these tags.` (a `siteT` text) and a `Clear tags` button. Hidden images get `hidden`, so they are out of the tab
  order and the screen reader; the count is announced politely (`aria-live`): "12 images".
- **Link state.** The chosen tags are kept in the page address (`#tags=sea,food`, the fragment, so the server and the cache
  are not involved and nothing is sent anywhere). A visitor can share the link or press Back, and the page opens with those
  tags chosen. A tag that does not exist is ignored. The fragment is read once on load and written by the script on each
  choice, without adding history entries (`replaceState`).
- **Without JavaScript.** The chips are not drawn (they need the script), so every image shows in one grid; nothing is
  hidden that a visitor cannot get back. Search engines see every image.
- **Lightbox (owner decision: on by default, can be turned off).** Tap an image on the site and the large image opens over a
  dark layer. In M3 terms the dark layer is the **scrim**, the large view is a **modal dialog**. M3 prints **no lightbox
  and no image viewer** (see section 10); the nearest patterns are its dialogs and the card's "primary action area"
  ("Cards can be one large touch target triggering an expanded detail screen"). No lightbox part exists in
  `theme/ui/` today (searched: none). PR 5a adds a theme part `Lightbox` (`theme/ui/Lightbox.tsx`), built on the theme's
  `Dialog` (the same modal `<dialog>`, `dialogControl.ts`, focus trap, Escape and focus return that the theme already
  has) and its scrim token `--dialog-scrim`, with these parts:
  - the large image (the 1200 px copy, its `srcset`, `sizes` so a phone gets a smaller one), centred, its own proportions,
    never cropped; its alt text, and the caption under it when there is one;
  - on a compact window it is the theme's full-screen `Dialog`: header 56 dp with **only** the close icon (M3: "the close X icon button should be the only navigation option in the app bar"), container corner 0; from medium up M3 uses a basic dialog (28 dp corner, 280–560 dp wide), which is too small for an image, so the container is as large as the window less a 56 dp margin (M3's own margin for custom-placed dialogs) and the corner stays 28 dp;
  - a `Close` icon button at the top (`data-dialog-close`), `Previous` and `Next` icon buttons at the sides on a computer
    (hidden on a phone, where swiping is the way, and drawn again for a keyboard or switch user);
  - keys: `Escape` closes, `Left` and `Right` move, focus is trapped and goes back to the tile that opened it;
  - **swipe between images** with CSS only: the images sit in one horizontal scroll track (`scroll-snap-type: x mandatory`),
    so a finger swipe, a trackpad and the arrow keys all scroll one image at a time; the buttons call `scrollBy`. No touch
    library;
  - it moves only among the images the filter shows, and the count (`3 of 12`) is announced;
  - the scrim is the theme's token (`--dialog-scrim`), so a theme restyles it; no fixed colour;
  - **motion** (M3 web values, converted springs): the scrim and the controls fade in with *default effects* (200 ms, curve 0.34, 0.80, 0.34, 1.00); the image scales in with *default spatial* (500 ms, curve 0.27, 1.06, 0.18, 1.00); moving to the next image uses *fast spatial* (350 ms); closing is the reverse, faster. All through the theme's `--motion-*` tokens, none fixed. With `prefers-reduced-motion` they are instant. Filtering the grid uses *fast effects* (150 ms) fade, or none.

  It needs no outside script: it is part of `script.ts`, loaded like the other block scripts, so the CSP stays as it is (no
  inline script, no outside address). Without JavaScript a card is a link to the image itself, so it still opens. If the
  owner turns `Open images bigger` off, the card is not a link and not a button.
  `docs/material-deviations.md` gets an entry (PR 5a): Material 3 has no lightbox; this is its dialog with the container
  made as large as the window less 56 dp on medium and up, and, as the owner asked for a dark background, with a see-through
  container over the scrim instead of M3's surface container high, so the image floats on the dark layer. The owner's word
  decides the colour; the rest follows the dialog page.
- **In the editor** a tap on an image opens **that image's settings** (alt text, and the rest of its fields), never the large
  view (section 6).
- **Alt text.** Every card's image has `alt` by the rule in section 3a (the block's local text, else the Library's). A
  decorative image has `alt=""`.
- **Captions.** Off by default (the owner said tiles without names). When `Caption` is on in `Card shows`, it shows on the
  card and also under the image in the lightbox. When off, the lightbox still shows the caption if the record has one,
  since the card stays quiet and the bigger view has room.
- **How many, and loading (owner decision).** `Show at most` is a number; left empty it means 100 (the common practice of
  shops: show many, not few). There is no `Show more` button: the images load as the visitor scrolls. A `Show more` button
  is kept out on purpose, because it hides images from search engines and visitors, and lazy loading already keeps the
  page light. If the owner sets a number lower than the images there are, the rest are simply not on the page.
  - **All images are in the HTML**, up to the limit, each an `<img>` with its real `width` and `height` from the manifest, so the
    browser reserves each box at its own proportions before anything loads (CLS stays at 0 from the grid).
  - **Lazy.** `loading="lazy"` and `decoding="async"` on every image except the first row. The first row (the number of
    columns at the widest size, so the first 4) is `loading="eager"` and the very first image `fetchpriority="high"`
    (the site's `Img.astro` already takes both). The block's view passes this by position, so it is the same HTML on
    the server and in the editor.
  - **Small images.** `srcset` from the existing sizes (160, 480, 800 and 1200 px wide webp, `scripts/responsive-images.mjs`)
    and `sizes` from the real column widths (`(min-width: 75rem) 25vw, (min-width: 37.5rem) 33vw, 50vw`). A phone with two
    columns takes the 480 px copy, a computer with four the 480 or 800 px copy, never the 1200 px original; the 1200 px copy
    is only for the lightbox.
  - **Long grids.** `content-visibility: auto` with `contain-intrinsic-size` from the image's own ratio on each card, so the
    browser skips drawing cards far from the screen. No script, no IntersectionObserver: the images are already in the
    page, so no search engine misses them. If the measurement below shows a problem, the script can later render only
    part of the DOM; the spec does not plan it.
  - **Filtering** only toggles `hidden`; it loads nothing new.
- **What I could and could not verify.** *Read from the code:* the sizes above, that `Img.astro` supports `loading`,
  `fetchpriority`, `srcset` and `sizes`, and that the build writes each image's width and height. *Not measured:* this
  spec is written with no built grid, so there is no PageSpeed, LCP, CLS or weight number for it. A rough estimate, not a
  measurement: 100 images at the 480 px size are in the order of a few MB if every one were fetched, but lazy loading
  fetches only those near the screen, so the first view is the first row and a little more. The first pull request that has
  the grid (PR 4 and 5) must measure it on the demo with 100 images: Lighthouse on a phone profile (LCP, CLS, total
  bytes, the number of requests before scrolling) and record the numbers in that PR. If LCP is above 2.5 s or CLS above
  0.1 on the demo, the default (100) is lowered before release.
- **No JavaScript.** All images show in one grid and each opens as a link to the image. The filter chips are rendered
  hidden and the script shows them (progressive).
- **Script.** `theme/blocks/imagegrid/script.ts`, registered like `cards/script.ts`; it does nothing on pages without the
  block. The filter logic is a pure function in `src/standard/imagegrid/filter.mjs` (unit tested), the script only wires it.
- **Security (CSP).** Images come only from the site's own folders (`/images/…`). Picked or tagged images are from the
  Library only, never an outside address. No inline script, no `eval`.
- **SEO.** Real `<img>` with alt, width, height and `srcset`. No structured data needed. Hidden tiles stay in the HTML, so
  search engines see every image.

## 6. How the editor edits it

- The block's contract is in `src/standard/imagegrid/` (`index.tsx`, `view.ts`, `load.ts`, `filter.mjs`); its look in
  `theme/blocks/imagegrid/` (`View.tsx`, `script.ts`). A theme overrides the look by replacing `View.tsx` and the tile part;
  the contract and the filter logic stay.
- **Typed in place** (the inline block editing work, `2026-11-12-inline-block-editing-design.md`, not changed): the card in the
  text is the grid as the site draws it, with the active style only. There is no text to type, so the block uses the part
  of the pattern that fits: the card is selected, the toolbar offers the block's menu (Hide, Move, Remove) and `Edit` (the
  settings sheet), and the text button under the grid is `Add images` (opens the Library picker). No new inline kind.
- The filter chips in the editor are drawn but inert (tapping one does not filter), so a tap selects the block. Preview
  shows the real behaviour.
- **A tap on an image in the grid opens that image's settings sheet** (owner decision): its alt text (local, with the
  Library's text as the hint, section 3a), its caption and its other fields. The large view is the site's only.
- **Selection in the Library picker** follows M3's selection page: the indicator is a check mark icon and a change of surface colour; on touch, a long press enters selection mode and each further tap adds an image; on a computer a check box shows on hover and on all images once one is chosen. Picking one image (an `Image`) is a plain tap. The long-press-and-drag gesture is not used (M3: not if it is used to pick up and move cards, as `Picked images` order does).
- The Library picker is the one the Library uses, in the same staggered grid with the `ImageTile` selected state.
- **Texts.** English is the source (`src/i18n/en-US/blocks.ts`, `t.blocks.imageGrid.*`); Danish in `da-DK`. Public texts the
  site shows (`All`, `Previous`, `Next`, `Close`, `12 images`) are in `siteT`, so they follow the site's language.
- **Demo.** A section on the Blocks page (`scripts/demo-blocks.mjs`) with six demo images in three tags, so `check:demo`
  has its example. Example in `defineBlock`: `{ show: 'tags', tags: [], filter: true }`.
- **Release note.** A paragraph (new block, an edge over a static site), written with the `release-notes` skill in a later PR.
  This spec has none.

## 7. Posts with images

Should a post list use the same tile? A post card has a title and text, so it is not an image-only tile. Recommendation: **no**.
The post cards keep their own look (they already use `Card`). A later block option `Show posts' top images as a grid` can reuse the same `Card` with media
and grid layout, since both are theme parts. Not in this work.

## 8. Pull requests

Order matters: the SEO rule (PR 0, separate), the alt fields (PR 0b, separate) and the tile first.

| # | Pull request | Size | Needs |
| - | --- | --- | --- |
| 0 | The SEO alt rule and the score reading images in blocks (built by another session, not part of this work) | small | before 4 |
| 0b | Alt field next to the image in Cards and Testimonials (they have none today; separate pull request, started by the PM) | small | PR 0; before 4 |
| 1 | Media slot and selected state on the theme's `Card`, `ImageTile` as its wrapper, and the staggered grid layout (audit row 3); Library moves to it | medium to large | the audit PR #515 |
| 2 | `width` and `height` in `thumbnails.json` (and use in the Library tile) | small | 1 (can go with it) |
| 3 | Base alt text (and caption) on the file record: schema, `fileRecords.mjs`, Library field, and the Library-text part of the shared alt rule | medium | PR 0 |
| 3b | Every image use fall back to the Library's text by the shared alt rule, local text kept; hints in the sheets | small to medium | 3 |
| 4 | Standard block `imagegrid`: contract, `Card shows` and `Card style` settings, `load.ts`, `view.ts`, `filter.mjs` + unit test, texts (en and da), `View.tsx` without script (all images, links) | medium | 1, 2, 3 |
| 5a | Theme part `Lightbox` (on `Dialog` and the scrim token): large image, close, previous, next, keys, swipe by scroll-snap, caption; deviation entry | medium | the `Dialog` (exists) |
| 5 | Filter script (`script.ts`): multi-select AND chips, disabled empty tags, address state, `aria-live`, and wiring the lightbox | medium | 4, 5a |
| 6 | Editor side: inline card, `Add images`, settings sheet, `check:screens` entry; demo section; release-note paragraph | small to medium | 4 |

Each pull request adds a changeset; PRs 4–6 are `minor` into `0.17`, never `major`. Checks to run:

- `npm run check` (includes `check:language`, `check:editor-colors`, `check:css-values`, `check:content`, `check:demo`).
- `check:screens` at **375 px** and **1280 px**: the grid, the chips, the lightbox open and closed, the editor card.
- `npm run check:contrast` on every section colour (chips, tile surface, lightbox controls), light and dark.
- A unit test of the filter logic (`filter.mjs`): all, one tag, several tags (AND), tags that would leave nothing, no match, the address fragment, order, limit.
- A test that no tile renders without `alt`, `width`, `height` and that the no-JavaScript HTML lists every image.
- Record the grid's deviations in `docs/material-deviations.md` if any (for example the grid is not an M3 carousel).

## 9. Questions for the owner (all six decided)

1. ~~Where does the alt text live?~~ Decided by the owner: a base text on the Library record, changeable locally on the page, post or block; the local text wins (section 3a).
2. ~~Can a visitor pick more than one tag at once?~~ Decided by the owner: yes, and an image shows only if it has all the chosen tags (section 5).
3. ~~What if an image has no alt text?~~ Decided by the owner: no warning on the block or the Library tile; it shows in the SEO score (section 3b). The grid draws such an image with `alt=""`.
4. ~~Should tapping an image open it bigger?~~ Decided by the owner: yes, on by default, can be turned off; in the editor a tap opens the image's settings (section 5).
5. ~~How many images show at first?~~ Decided by the owner: a `Show at most` setting, default 100 when empty, images load as the visitor scrolls, no `Show more` button (section 5).
6. ~~Do posts get the same grid later?~~ Decided by the owner: no, not now (section 7).

## 10. M3 check (13 Nov, owner rule: follow MD3 everywhere except the editor)

I read these pages of m3.material.io in a browser on 13 Nov (tables expanded) and checked this spec against them. The editor
is exempt by the owner's rule; the grid, card, chips and lightbox are site parts, so they follow M3.

| Page | What it prints that matters here | What changed in this spec |
| --- | --- | --- |
| Cards: specs | Corner 12 dp; left/right padding 16 dp; "Padding between cards: 8dp max"; elevated = surface container low, filled = surface container highest, outlined = surface + outline variant | Gap 8 dp at every breakpoint (was 16 dp above compact); text padding 16 dp (was 8 dp); card colours and corner stated |
| Cards: guidelines | Anatomy image, headline, subhead, supporting text; "container is the only required element"; text on images "isn't recommended"; "Filter or sorting options should be placed outside of the card collection" and apply to each card; cards in a collection are coplanar; "default grid can be customized in code to show cards in staggered or mosaic grids"; a card can be "one large touch target triggering an expanded detail screen" | Caption = supporting text, Tags and Credit = subhead (M3's own examples: byline, tagged location), order image, subhead, supporting text; text only under the image; chips outside the grid; staggered grid is allowed; card tap opens the large view |
| Chips: guidelines | Filter chips: multi-select, leading check mark when selected, nouns, 20 characters or fewer, 8 dp minimum space, 48 dp target, wrap, scroll when more than two rows; "avoid mixing chip set behaviors"; "should not present only a single option"; disabled state; elevated only on images | Removed the `All` chip (M3 has none; a `Clear tags` text button instead); chips wrap and turn into one scrolling row above two rows; filter hidden below two tags; check mark on selected |
| Chips: specs | Filter chip 32 dp high, 8 dp corner, 16 dp padding (8 dp with icon), secondary container when selected | Stated; the theme's `Chip` already is this |
| Dialogs: guidelines and specs | Full-screen dialog for compact only, header 56 dp, close X "the only navigation option in the app bar", corner 0; basic dialog 28 dp corner, 280–560 dp wide, 24 dp padding, container surface container high, scrim token; custom placement keeps a 56 dp margin; dialogs "should be used sparingly" for interruptions; "enter and exit transition" | Lightbox compact = full-screen dialog; medium and up = large container with 56 dp margin. **M3 is silent on lightboxes and image viewers**, so this is the nearest pattern, and the dark see-through container is a recorded deviation (owner's word) |
| Carousel | Snap-scrolling recommended for hero and full-screen layouts; items fully visible; a `Show all` button so a vertically scrolling page does not hide items | Swipe in the lightbox uses scroll-snap (nearest pattern; M3 has no swipe-between-images spec for a dialog). No carousel in the page, so `Show all` does not apply |
| Breakpoints (window size classes) | Compact under 600, medium 600–839, expanded 840–1199, large 1200–1599, extra-large 1600+ | Names and edges stated exactly. **M3 prints no column count for image grids**: 2, 3, 3, 4 columns are our choice. I did not find M3's layout-grid page (its URL I tried redirected to the layout overview), so PR 1 must read it and align the counts if it prints any |
| Spacing | "Placing a caption under an image creates an implicit group"; cards "should maintain consistent horizontal spacing ... when their height varies" | Same gap in every column; caption directly under its image |
| Motion physics | Web: springs converted to curves: standard default spatial 0.27, 1.06, 0.18, 1.00 over 500 ms; default effects 0.34, 0.80, 0.34, 1.00 over 200 ms; fast effects 150 ms; fast spatial 350 ms | Lightbox and filter motion use these through the theme's `--motion-*` tokens. M3 gives no lightbox or filter-animation spec; nearest is the dialog enter/exit and effects |
| Selection | Indicators: check mark icon, check box, change of surface colour, or both; long press enters selection mode on touch, then tap; on a computer a check box on hover and on all after one is chosen; no long-press-drag if used to move cards | The tile's selected state (PR 1) is a check mark and a surface colour change, not a ring; the Library picker's multi-pick follows it |

**Where M3 is silent, I used the nearest pattern and said so:** lightbox and image viewer, swipe between images, the AND rule of
several filter chips, image-grid column counts, and the animation of filtering. **Not checked:** the exact token values for the
theme's `Card` and `Chip` against these pages (that is PR 1's check); M3's grid page (see Breakpoints above).
