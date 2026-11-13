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
 [ All ] [ Sea ] [ Food ]
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
 [ All ] [ Sea ] [ Food ] [ People ]
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
| `Start with` | `All` or one or more tags | All |
| `Order` | `Newest`, `Oldest`, `Library order` (picked), `Random each build` | Newest |
| `Open images bigger` | on / off | on (on the site; in the editor a tap opens the image's settings) |
| `Card shows` | any of `Caption`, `Tags`, `Credit` (the image is always shown) | none: image only |
| `Card style` | `Filled`, `Elevated`, `Outlined` | Filled |
| `Columns` | `Auto` or `2`, `3`, `4` on a computer | Auto |
| `Limit` | `All` or 6, 12, 24 with `Show more` | 12 |

**Columns follow M3 layout:** phone (compact, under 600 dp) 2 columns, tablet (medium to expanded, 600–1199 dp) 3, computer
(large, 1200 dp and up) 4. The gap is 8 dp on a phone and 16 dp above. Breakpoints come from `lib/breakpoints.mjs` and the
CSS (`--breakpoint-*`), never a number in the block. The columns are CSS columns or a masonry-style grid chosen in
PR 1, not a script.

## 4a. The card: what it shows, and how it looks

Owner: the grid has a setting for what each card shows, and the card is designed by that, following Google's Material 3
cards. So the card is the theme's `Card` part (`theme/ui/Card.tsx`, kinds `elevated`, `filled`, `outlined`), the same part
every block uses. There is no separate tile look.

- **`Card shows`** picks the extra parts under the image: `Caption` (from the image's record), `Tags` (its tags, as plain
  small text, not buttons; filtering is done by the chips above the grid) and `Credit` (the photographer, when the record has
  one). The image itself is always shown.
- **`Card style`** picks the card kind: `Filled` (default, the quiet tinted surface the owner described), `Elevated`
  (a shadow) or `Outlined` (a line).
- The theme draws the rest: corner, surface, text styles, elevation. A theme restyles the cards by restyling `Card`.

What each choice gives (M3 "card with media"):

| `Card shows` | Card |
| --- | --- |
| nothing (default) | Media card: the image fills the card edge to edge, no text area. The card is the image with the kind's surface, corner and (selected or focused) outline. This is the owner's tile. |
| `Caption` | Media card with supporting text: image on top, the caption under it, 8 dp inside edge. |
| `Tags` | Media card: image on top, one line of small tag text under it. |
| `Caption` and `Tags` or `Credit` | Image on top; caption, then one line with tags and credit. Text uses M3 body-medium and label-small. |

```
 Image only          With caption        Caption + tags
 +--------+          +--------+          +--------+
 |        |          |        |          |        |
 |  image |          |  image |          |  image |
 |        |          +--------+          +--------+
 +--------+          | Sunset |          | Sunset |
                     +--------+          | Sea · Food
                                         +--------+
```

**How it fits the staggered grid.** The grid is unchanged: columns of cards of different heights. The image keeps its own
proportions (real `width` and `height`), so a card's height is the image's height plus its text rows, and the text never
crops the image. Cards do not break across columns. With nothing chosen the grid looks exactly as in section 1. Text is
at most 2 lines for a caption and 1 for tags, then cut with an ellipsis; the full caption is in the lightbox.

**What changes in the audit's `ImageTile` (row 3).** It is no longer a new part. PR 1 adds a media slot to the theme's
`Card` (an image box with the card's corner, `card-media`, no padding) and a selected state (ring and check) for the editor,
and `ImageTile` becomes a thin wrapper of `Card` with a media. The editor's Library uses it with `Filled` and nothing else
shown, so the owner's reference look stays.

## 5. How it behaves on the site

- **Filter (owner decision: several tags, AND).** `Chip` in its filter kind, one per tag, each toggles on and off
  (`selected`, `aria-pressed`). A visitor can choose more than one tag, and an image shows only if it has **all** the
  chosen tags. With none chosen, all images show. The first chip, `All`, clears every choice (it is selected when none is
  chosen). The chips wrap onto more lines on a phone (a `ChipSet`, 48 dp targets), they do not scroll sideways.
- **A tag that would show nothing.** After each choice, a tag chip whose addition would leave no image is `disabled` (greyed,
  not removed, so the row does not jump), so the visitor cannot reach an empty grid by tapping. The counts are not drawn on
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
  dark layer. In M3 terms the dark layer is the **scrim**, the large view is a **modal dialog**. No lightbox part exists in
  `theme/ui/` today (searched: none). PR 5a adds a theme part `Lightbox` (`theme/ui/Lightbox.tsx`), built on the theme's
  `Dialog` (the same modal `<dialog>`, `dialogControl.ts`, focus trap, Escape and focus return that the theme already
  has) and its scrim token `--dialog-scrim`, with these parts:
  - the large image (the 1200 px copy, its `srcset`, `sizes` so a phone gets a smaller one), centred, its own proportions,
    never cropped; its alt text, and the caption under it when there is one;
  - a `Close` icon button at the top (`data-dialog-close`), `Previous` and `Next` icon buttons at the sides on a computer
    (hidden on a phone, where swiping is the way, and drawn again for a keyboard or switch user);
  - keys: `Escape` closes, `Left` and `Right` move, focus is trapped and goes back to the tile that opened it;
  - **swipe between images** with CSS only: the images sit in one horizontal scroll track (`scroll-snap-type: x mandatory`),
    so a finger swipe, a trackpad and the arrow keys all scroll one image at a time; the buttons call `scrollBy`. No touch
    library;
  - it moves only among the images the filter shows, and the count (`3 of 12`) is announced;
  - the scrim is the theme's token, so a theme restyles it; no fixed colour.

  It needs no outside script: it is part of `script.ts`, loaded like the other block scripts, so the CSP stays as it is (no
  inline script, no outside address). Without JavaScript a card is a link to the image itself, so it still opens. If the
  owner turns `Open images bigger` off, the card is not a link and not a button.
  `docs/material-deviations.md` gets an entry: Material 3 has no lightbox; this is its modal dialog with a scrim and
  without a surface or headline.
- **In the editor** a tap on an image opens **that image's settings** (alt text, and the rest of its fields), never the large
  view (section 6).
- **Alt text.** Every card's image has `alt` by the rule in section 3a (the block's local text, else the Library's). A
  decorative image has `alt=""`.
- **Captions.** Off by default (the owner said tiles without names). When `Caption` is on in `Card shows`, it shows on the
  card and also under the image in the lightbox. When off, the lightbox still shows the caption if the record has one,
  since the card stays quiet and the bigger view has room.
- **Images.** `<img>` with `srcset` and `sizes` from the manifest (the site's responsive images, same as `Img.astro`),
  `loading="lazy"`, `decoding="async"`, and `width` and `height` of the real image, so the box is reserved and the page does
  not jump (CLS). The first row is not lazy.
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

## 9. Open questions for the owner (one at a time)

1. ~~Where does the alt text live?~~ Decided by the owner: a base text on the Library record, changeable locally on the page, post or block; the local text wins (section 3a).
2. ~~Can a visitor pick more than one tag at once?~~ Decided by the owner: yes, and an image shows only if it has all the chosen tags (section 5).
3. ~~What if an image has no alt text?~~ Decided by the owner: no warning on the block or the Library tile; it shows in the SEO score (section 3b). The grid draws such an image with `alt=""`.
4. ~~Should tapping an image open it bigger?~~ Decided by the owner: yes, on by default, can be turned off; in the editor a tap opens the image's settings (section 5).
5. **How many images show at first?** *Recommendation:* 12, then a `Show more` button; the owner can choose `All`.
6. **Do posts get the same grid later?** *Recommendation:* not now; reuse the tile part later if wanted (section 7).
