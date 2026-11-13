# Image grid block (design)

Date: 2026-11-13. Design only, no code. Written for the owner, who reads on a phone.

Owner's words: "the image grid that we are making would also be a nice block to have, where you can sort by tags. So you can
use it in the front end as well to show images."

Words used here: a **tile** is one picture in the grid. A **tag** is a label on an image (like a post's tag). A **filter
chip** is a small button above the grid that shows only the images with one tag. **Lightbox** means tapping a picture to see
it bigger over the page.

## 1. What the block is

A new standard block, **Image grid**, for the site. It shows pictures from the site's Library in the staggered grid the
editor's Library will use (audit decision 3, spec `2026-11-13-editor-uses-theme-parts-audit.md`, row 3): each picture in its
own proportions, rounded corners, a quiet tinted surface, no names or captions. Visitors can tap a tag to show only those
pictures, and tap a picture to see it bigger.

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
`Start with`, `Order`, `Open images bigger`, `Show captions`.

## 2. What exists today (read from the code)

- Images are files in `public/images/uploads/<year>/<month>/`. The build (`scripts/responsive-images.mjs`) makes webp copies
  at 160, 480, 800 and 1200 px and writes each image's real `width` and `height` to `src/data/image-manifest.json`.
- **Images already have tags.** Each image has a record `src/data/files/<id>.json` (`src/fileRecords.mjs`) with `categories`
  (its tags), `removed` and an optional `credit`. The Library edits them with `MediaTags.tsx` (chips and `Add tag`, one commit
  per change). These are the same tags (`categories`) that posts use.
- Images have **no alt text of their own**. Alt text lives where the image is used, in the page's text. So the grid needs one.
- The theme already has `Chip` (filter kind, `selected`), `Dialog` with the `full-screen` kind, `ChipSet`, and block scripts
  (`theme/blocks/cards/script.ts` is the model: one small script run on every page by `Base.astro`, doing nothing without
  the block).
- The `posts` block shows how a block picks by tags (`show: all | categories | picked`, relation field `categories`).

## 3. What has to be added

1. **Alt text on the image record.** Add `alt` (and optional `caption`) to the file record, edited in the Library next to the
   tags (`Describe the image`, with the `Decorative image` choice the Image block has). The grid uses it. If an image has
   none, the grid draws `alt=""` and the editor shows a hint on the block (see question 3).
2. **Width and height for the tiles.** The manifest has them for the site. The editor's `thumbnails.json` gets them too (the
   audit already plans this, row 3), so the grid reserves each box before the image loads.
3. **A site reader.** The block's `load.ts` reads the records and the manifest at build time and gives the view the list
   `{ src, alt, width, height, tags }`. The site ships no record file the visitor does not need.

## 4. The block's settings

Everything that is not text sits in the settings sheet (the inline rule). The block has no typed text, so it opens its
sheet on insert, like the Image block.

| Setting | Choices | Default |
| --- | --- | --- |
| `Images` | `All images with tags` (pick tags) or `Picked images` (pick in the Library, drag to order) | All with tags; no tag picked = all images |
| `Show filter` | on / off | on, only when 2 or more tags exist in the shown images |
| `Start with` | `All` or one tag | All |
| `Order` | `Newest`, `Oldest`, `Library order` (picked), `Random each build` | Newest |
| `Open images bigger` | on / off | on |
| `Show captions` | on / off | off |
| `Columns` | `Auto` or `2`, `3`, `4` on a computer | Auto |
| `Limit` | `All` or 6, 12, 24 with `Show more` | 12 |

**Columns follow M3 layout:** phone (compact, under 600 dp) 2 columns, tablet (medium to expanded, 600–1199 dp) 3, computer
(large, 1200 dp and up) 4. The gap is 8 dp on a phone and 16 dp above. Breakpoints come from `lib/breakpoints.mjs` and the
CSS (`--breakpoint-*`), never a number in the block. The columns are CSS columns or a masonry-style grid chosen in
PR 1, not a script.

## 5. How it behaves on the site

- **Filter.** `Chip` (filter kind, selected state). First chip `All`. Tapping a selected tag chip again clears it (back to
  `All`). One tag at a time (question 2). Chips carry `aria-pressed`. Hidden pictures get `hidden`, so they are out of the
  tab order and the screen reader. The count is announced politely (`aria-live`): "12 images".
- **Lightbox.** Tap a picture: the theme's full-screen `Dialog` (audit decision 4) opens with the picture, `Previous`, `Next`
  and `Close`. Keys: `Left` and `Right` move, `Escape` closes, focus is trapped and goes back to the tile. It moves only among
  the pictures the filter shows. The picture is the 1200 px copy; alt text is read, the caption (if on) is shown under it.
  Without JavaScript a tile is a link to the image itself, so it still opens.
- **Alt text.** Every tile has `alt` from the record. A decorative image has `alt=""`.
- **Captions.** Off by default (the owner said tiles without names). When on, the caption shows under the picture in the
  lightbox only, never on the tile, so the grid stays quiet.
- **Pictures.** `<img>` with `srcset` and `sizes` from the manifest (the site's responsive images, same as `Img.astro`),
  `loading="lazy"`, `decoding="async"`, and `width` and `height` of the real image, so the box is reserved and the page does
  not jump (CLS). The first row is not lazy.
- **No JavaScript.** All pictures show in one grid and each opens as a link to the image. The filter chips are rendered
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
- The Library picker is the one the Library uses, in the same staggered grid with the `ImageTile` selected state.
- **Texts.** English is the source (`src/i18n/en-US/blocks.ts`, `t.blocks.imageGrid.*`); Danish in `da-DK`. Public texts the
  site shows (`All`, `Previous`, `Next`, `Close`, `12 images`) are in `siteT`, so they follow the site's language.
- **Demo.** A section on the Blocks page (`scripts/demo-blocks.mjs`) with six demo images in three tags, so `check:demo`
  has its example. Example in `defineBlock`: `{ show: 'tags', tags: [], filter: true }`.
- **Release note.** A paragraph (new block, an edge over a static site), written with the `release-notes` skill in a later PR.
  This spec has none.

## 7. Posts with images

Should a post list use the same tile? A post card has a title and text, so it is not an image-only tile. Recommendation: **no**.
The post cards keep their own part. A later block option `Show posts' top images as a grid` can reuse the same `ImageTile`
and grid layout, since both are theme parts. Not in this work.

## 8. Pull requests

Order matters: the tile first.

| # | Pull request | Size | Needs |
| - | --- | --- | --- |
| 1 | Theme part `ImageTile` and the staggered grid layout (audit row 3), with the selected state; Library moves to it | medium to large | the audit PR #515 |
| 2 | `width` and `height` in `thumbnails.json` (and use in the Library tile) | small | 1 (can go with it) |
| 3 | Alt text (and caption) on the file record: schema, `fileRecords.mjs`, Library field, unit tests | medium | none |
| 4 | Standard block `imagegrid`: contract, `load.ts`, `view.ts`, `filter.mjs` + unit test, texts (en and da), `View.tsx` without script (all images, links) | medium | 1, 2, 3 |
| 5 | Filter and lightbox script (`script.ts`), chips, keys, `aria-live` | medium | 4 and the full-screen `Dialog` (exists) |
| 6 | Editor side: inline card, `Add images`, settings sheet, `check:screens` entry; demo section; release-note paragraph | small to medium | 4 |

Each pull request adds a changeset; PRs 4–6 are `minor` into `0.17`, never `major`. Checks to run:

- `npm run check` (includes `check:language`, `check:editor-colors`, `check:css-values`, `check:content`, `check:demo`).
- `check:screens` at **375 px** and **1280 px**: the grid, the chips, the lightbox open and closed, the editor card.
- `npm run check:contrast` on every section colour (chips, tile surface, lightbox controls), light and dark.
- A unit test of the filter logic (`filter.mjs`): all, one tag, no match, tag removed from the shown set, order, limit.
- A test that no tile renders without `alt`, `width`, `height` and that the no-JavaScript HTML lists every image.
- Record the grid's deviations in `docs/material-deviations.md` if any (for example the grid is not an M3 carousel).

## 9. Open questions for the owner (one at a time)

1. **Where does the alt text live?** On the image's Library record, so it is written once and used everywhere.
   *Recommendation:* yes, on the record, with a way to override it per block later if needed.
2. **Can a visitor pick more than one tag at once?** *Recommendation:* no, one tag at a time, tap again to clear. It is the
   simplest to understand on a phone.
3. **What if an image has no alt text?** *Recommendation:* the editor shows a warning on the block and the Library tile, and
   the grid draws it as decorative (`alt=""`). It never invents text.
4. **Should tapping a picture open it bigger by default?** *Recommendation:* yes, on by default; the owner can turn it off.
5. **How many images show at first?** *Recommendation:* 12, then a `Show more` button; the owner can choose `All`.
6. **Do posts get the same grid later?** *Recommendation:* not now; reuse the tile part later if wanted (section 7).
