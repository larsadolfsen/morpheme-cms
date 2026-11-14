# Image tools: the crop view, the image's tools in the bar, the Cards' aspect ratio (design)

Status: spec and build plan for 0.18, from the owner's decisions of 14 November 2026. No code in this pull request.
Questions the owner still has to answer are in section 12, each with a recommendation; nothing in them is decided here.

Related: `2026-11-13-resize-image-design.md` (its drawn size is dropped, decision 2), `2026-11-11-intuitive-editor-design.md`
(batch 15 is part of this spec, section 9), `2026-11-12-inline-block-editing-design.md` (section 5, Cards),
`2026-11-13-contextual-toolbar-row-design.md` (the one bar, its tables for Image and Video), the block action row of #625
(`src/blockRow.ts`), and the Lightbox deviation 19 in `docs/material-deviations.md`, which this spec follows for larger windows.

Words: the **bar** is the text editor's one toolbar (`editor-tools`); its **contextual tools** slide in from the left for what is
active. The **row** is the block's action row above an active block (`blockRow.ts`: Move up, Move down, Hide or Show, Settings,
the drag handle). The **image sheet** is the sheet an image's settings open in (`BlockDialog.tsx`: the side sheet from expanded, a
modal sheet below it). The **crop view** is the new view of section 3. A **ratio** is an aspect ratio, written `3:2`.

## 1. Owner decisions (14 November 2026)

1. **Crop view.** A full-screen view of the chosen image in its real proportions. `Format` is renamed **`Aspect ratio`**. A ratio
   darkens everything outside the frame, and the frame has a border that stays visible on dark and light images. Zoom with a pinch
   on touch, a slider and the wheel with a mouse; drag the image to place it in the frame. Larger windows: the nearest M3 pattern,
   or a deviation the owner approves (section 3).
2. **No drawn size.** Images stay full width; another width would be another block. The resize spec's drawn size is dropped.
3. **Image tools live in the one bar.** Tapping any image (in the text, the Image block, a card's media) selects it, and the bar
   slides in `Change image`, `Crop`, `Alt text`, `Remove`. The row stays for the block (move, hide, settings, drag). The Image
   block's row `Settings` opens the image sheet (Change image, Alt text, Aspect ratio). In a card the image is its own tap target;
   tapping the card's text selects the card.
4. **Cards: one aspect ratio per Cards block**, set in the block's settings; in a card the crop view keeps that frame and only
   zooms and moves.
5. **The crop view opens only when asked**: from `Crop` in the bar and from `Aspect ratio` in the image sheet, never by itself
   after an image is picked. A new image starts as `Original`.
6. **Batch 15** of the intuitive editor spec (alt text right after an image is picked, the `Hide on the page` wording, closing a
   sheet) is part of this spec.
7. **Video: `Change address`** in the bar for a selected video, the same pattern (handed over from 0.17).

## 2. Today (read in the code on `0.18` at `ece1b62`)

- **The image in the text is the Image block.** `Insert` › `Image` (`IMAGE` in `BlockDialog.tsx`, label `t.blocks.picture.label`)
  puts a Markdown image in the text; there is no separate Image block type. It is drawn as a card by `imageCard()`
  (`MarkdownEditor.tsx` ≈ line 975): a `<button class="site-block-card">` with the image cut to its format (`cropStyle`).
- **Tapping it** calls `cardBar()`: `blockBar.show()` with `actions: []` (so the bar gets **no** image tools), a row with Move up,
  Move down and Settings (the pencil turned into the row's gear, `splitRow`), and the `⋮` menu with the rest (Remove). From
  expanded a tap opens the image sheet at once (`inPanelNow`). The contextual-toolbar spec lists `Change image, Crop, Alt text,
  Settings` for Image and `Change address, Settings` for Video (its sections 3 and 6); neither is built.
- **The image sheet** has the fields `src` (Image, with `Change image` from `forms.changeImage`), `decorative` (`Decorative image`
  switch), `alt` (`Alt text`, only when not decorative), and below them the crop as a part of the sheet (`CropField`, `Crop.tsx`):
  the label `Format` (`media.crop.format`), the hint `Choose a format to crop the image.`, filter chips `Original`, `1:1`, `4:5`,
  `3:4`, `2:3`, `3:2`, `4:3`, `16:9` (`FORMATS` in `lib/crop.mjs`) as a radiogroup, and, once a format is chosen, a frame
  (`min(100%, 45dvh × ratio)` wide) with the image dragged inside it (pointer, or the arrow keys by 2 %), the hint `Drag the image
  to choose the crop.` and a `Zoom` slider (1 to 4). Nothing outside the frame is shown: the frame clips the image. No pinch, no
  wheel. Not offered in a Banner's text or on a fixed page (`crop` option, `data.page`).
- **The data** (`lib/crop.mjs`): a word after the address, the file untouched:
  `![Office](/images/uploads/2024/05/office.webp#format=2:3&crop=12.5,0,75,100)`; `decorative` the same way. Its split helper
  ignores a crop without a valid format; `middleCrop` gives the largest middle part; `cropStyle` draws it on the site and in the
  editor.
- **Picking a new image** (`image()` in `MarkdownEditor.tsx`): `addImage()` (the Library) then `sheet.edit(IMAGE, { src, alt: '' },
  true)`: the image sheet opens with `Insert` and `Cancel`, and its Alt text field and its format chips (starting at `Original`)
  are already there. So "alt text right after an image is picked" is **built for the Image block**, as a full sheet, not as a
  short step of its own.
- **Cards** (`src/standard/cards/index.tsx`, `InlineCards.tsx`): one `media` for the block (`none`, `icon`, `image`, `video`); a
  card's `image` and `alt` are picked in the card's sheet; a tap on a set media opens that sheet (`inline-card-media` button). The
  theme draws the image in `.block-card-picture` with **a fixed `aspect-ratio: 3 / 2`** and `object-fit: cover`
  (`theme/styles/blocks.css` line 846): the middle of the image, no crop, no choice.
- **Video** (`InlineVideo.tsx`): a slot over the frame (`InlineSlot`, label `Video link`) opens the block's sheet; the field is
  `Video link` (`blocks.video.url`, Danish `Videolink`).
- **Batch 15's words**: the alt hint is already `Describe the image in a few words, for people who can’t see it.` (batch 1, built).
  `Hide on the page` / `Show on the page` / `Hidden on the page` (`text.hideOnPage`, `showOnPage`, `hiddenOnPage`) are on the row's
  visibility button. Closing a changed sheet asks `You have changes that aren’t saved. Do you want to keep them?`
  (`app.unsavedSheet`, `closeChanged` in `ask.tsx`) with the sheet's own main button (`Save` or `Insert`) and `Discard`.
- **The theme** has `Dialog` with the kinds `basic` and `full-screen` (`theme/ui/Dialog.tsx`; the full-screen one becomes a
  centred dialog from medium), `Lightbox` (deviation 19: the full-screen dialog as large as the window less 56 dp from medium),
  `Slider` (sizes XS to XL), `Chip`, `Toolbar`.

## 3. The crop view

### What Material says (read 14 Nov 2026 on m3.material.io with Playwright, page text)

Pages read: `/components/dialogs/guidelines`, `/specs`, `/accessibility`; `/components/sliders/guidelines`, `/accessibility`;
`/components/side-sheets/guidelines`; `/components/bottom-sheets/guidelines`; `/components/toolbars/guidelines`;
`/foundations/layout/applying-layout/window-size-classes`; `/foundations/layout/canonical-layouts/supporting-pane`;
`/foundations/interaction/gestures`. I searched the site for "crop", "image editing" and "aspect ratio": **M3 has no page on
cropping or editing an image** (the hits are typography, shapes and Android's `ContentScale.Crop`). `/styles/imagery` does not exist
("This page cannot be found"). The dialogs' and sliders' token tables stay collapsed in a text read, so no token value is quoted.

- Full-screen dialog: "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete."
  It may be used "When changes aren’t saved instantly". "**Full-screen dialogs are for compact breakpoints only, like mobile
  devices. For medium and expanded breakpoints, use a basic dialog.**" "To save a selection in a full-screen dialog, use Save. The
  close icon or dismissive action, such as Cancel or Back, should close the dialog." "When someone dismisses a full-screen dialog,
  a basic dialog should appear to confirm that they want to discard the unsaved changes." "the close “X” icon button should be the
  only navigation option in the app bar." Specs: header height 56dp, container width "Max 560dp".
- Adaptive: "Dialogs can swap variants as the breakpoint changes. For example, a full-screen dialog can change into a basic dialog
  at larger breakpoints." "Basic dialogs can be custom-positioned anywhere on larger screens, respecting margins to prevent edge
  collision" (the 56dp margin). Basic dialog: "Min 280dp; Max 560dp", 28dp corner.
- Breakpoints: compact "Under 600dp", medium "600–839dp", expanded "840–1199dp".
- Supporting pane: "The primary area contains the main content and occupies the majority of the space." Key uses include "Content
  and media browsing". Placement: "Below — Flexible — Compact or Medium"; "Leading or trailing — Fixed (360 dp) — Expanded".
- Gestures: "Pinch: People can scale surfaces to navigate between screens." "Users can fluidly transition between various gestures,
  like panning and pinching in a map view." "UI elements should respond to gestures in real time".
- Slider: "Changes made with sliders must take effect immediately"; "Plus and minus icons, or text, can be added to the left and
  right of the slider"; keys: "Tab — Moves focus to the slider handle", "Arrows — Increase and decrease the value by one value",
  "Home or End — Set the slider to the first and last values"; "The accessibility label for a slider is typically the same as the
  slider's adjacent text label."
- Dialog accessibility: "When a dialog appears, focus should automatically land on the first interactive element"; "Escape —
  Closes the dialog"; "The accessibility label for a dialog is typically the same as the dialog’s title or headline."

M3 prints no darkened area outside a frame, no frame border and no wheel zoom. Where it is silent the spec says so below and uses the
nearest part (the scrim for the darkened area).

### Compact (under 600 dp): the full-screen dialog, as M3 prints it

```
375 px                                     ┌ the frame: 2 dp two-tone border
+-------------------------------------------+
| [X]  Crop                          [Save] |  56 dp header (close, headline, text button)
+-------------------------------------------+
|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|  the whole image, in its real proportions
|▓▓▓▓┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓▓▓▓▓|  ▓ = outside the frame, under the scrim
|▓▓▓▓┃                                ┃▓▓▓▓|
|▓▓▓▓┃      the part that is shown    ┃▓▓▓▓|  drag: moves the image under the frame
|▓▓▓▓┃          (3:2 here)            ┃▓▓▓▓|  pinch: zooms around the fingers
|▓▓▓▓┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛▓▓▓▓|
|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|
+-------------------------------------------+
| Aspect ratio                              |
| [Original][1:1][4:5][3:4][2:3][3:2]…  →   |  one row of chips, scrolls sideways
| [−] ─────────●───────────────────── [+]   |  Zoom slider, minus and plus icon buttons
+-------------------------------------------+
```

- The theme's `Dialog` kind `full-screen`, headline `Crop`, close `X` (label `Close`), action `Save`. Closing with changes asks the
  basic dialog of section 9.3 (M3's "confirm that they want to discard").
- **The image area** fills the room between the header and the controls, on the dialog's surface. The image is drawn whole, at its
  real proportions, scaled by the zoom. The frame is the largest box of the ratio that fits the area less 16 dp on each side, in the
  middle. Everything outside the frame is under a layer in the theme's scrim colour (`--mo-scrim`); M3 prints a scrim for "surfaces
  behind the container" but no opacity in text, so the opacity is the theme's (`--crop-outside`, default 60 %, an owner question,
  12.4). `Original` has no frame and no layer: the whole image is shown, and the slider and the drag are off (nothing to place).
- **The frame's border:** a 2 dp line in `--mo-inverse-on-surface` with a 1 dp halo outside it in `--mo-inverse-surface`, so one of
  the two tones stands against any image, light or dark (M3 prints no frame; the nearest is the focus ring's two-tone look).
- **Zoom:** 1 (the largest part of the image that fills the frame, today's `middleCrop`) to 4 (today's `MAX_ZOOM`). Pinch zooms
  around the middle of the two fingers and can be combined with a drag (M3's compound gesture). The slider is the theme's `Slider`,
  size XS, label `Zoom`, with `Zoom out` and `Zoom in` icon buttons at its ends (M3's "Plus and minus icons"). Every change shows at
  once.
- **Placing:** a drag moves the image under the fixed frame; the image never leaves a gap in the frame (the crop is clamped, as
  `moved()` does today).
- **Aspect ratio chips:** the theme's filter chips in one row (`Original` first, then `FORMATS`), each with its small ratio
  outline as today. A new ratio puts the largest middle part in the frame (today's rule). In a card (section 6) the chips are not
  shown: the frame is the block's ratio.

### Medium and expanded (600 dp and up)

M3 says "use a basic dialog" from medium. A basic dialog is at most 560 dp wide, which leaves a 2:3 portrait about 300 dp high in a
1280 × 800 window, so the owner's "full-screen view" cannot be met inside M3. Two ways, the owner chooses (12.1):

**A. As M3 prints: a basic dialog, 560 dp.** The same parts as compact, in the theme's centred dialog (the `full-screen` kind
already turns into one from medium): the image area 512 dp wide, the chips and the slider under it. No deviation.

**B. Recommended: the Lightbox's size (deviation 19) with a supporting pane.** From medium the dialog is as large as the window less
56 dp on each side (M3's own margin for a dialog placed by hand), with the 28 dp corner, exactly as the theme's Lightbox already is.
Inside it the layout is M3's supporting pane: the image is the focus pane; the controls are the supporting pane, below it on medium
("Below — Flexible — Compact or Medium") and a fixed 360 dp pane on the trailing side on expanded ("Leading or trailing — Fixed
(360 dp) — Expanded"). The header keeps `X`, `Crop` and `Save` (one place for Save on every size).

```
1280 × 800, way B (dialog 1168 × 688 dp: 56 dp margin)
+------------------------------------------------------------------------------------------------+
| [X]  Crop                                                                               [Save] |
+------------------------------------------------------------------+-----------------------------+
|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓| Aspect ratio                |
|▓▓▓▓▓▓▓▓▓▓▓┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓▓▓▓▓▓▓▓▓▓▓▓| [Original] [1:1] [4:5]      |
|▓▓▓▓▓▓▓▓▓▓▓┃                                            ┃▓▓▓▓▓▓▓▓▓▓▓| [3:4] [2:3] [3:2] [4:3]     |
|▓▓▓▓▓▓▓▓▓▓▓┃                                            ┃▓▓▓▓▓▓▓▓▓▓▓| [16:9]                      |
|▓▓▓▓▓▓▓▓▓▓▓┃          focus pane: the image             ┃▓▓▓▓▓▓▓▓▓▓▓|                             |
|▓▓▓▓▓▓▓▓▓▓▓┃          (808 dp wide)                     ┃▓▓▓▓▓▓▓▓▓▓▓| Zoom                        |
|▓▓▓▓▓▓▓▓▓▓▓┃                                            ┃▓▓▓▓▓▓▓▓▓▓▓| [−] ──────●──────────── [+] |
|▓▓▓▓▓▓▓▓▓▓▓┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛▓▓▓▓▓▓▓▓▓▓▓|                             |
|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓| supporting pane, 360 dp     |
+------------------------------------------------------------------+-----------------------------+
```

The chips wrap in the pane (no sideways scroll). With the mouse the wheel zooms around the pointer (M3 silent on wheel zoom; the
slider is the M3 control and the wheel moves the same value). Way A at 1280 is the compact drawing in a 560 dp centred dialog.

**Deviation entry for way B** (to add to `docs/material-deviations.md` in PR 3 only if the owner approves B):

> **N. The crop view is the full-screen dialog, made as large as the window from medium, with a supporting pane.** M3 (dialogs,
> guidelines): "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use
> a basic dialog." Basic dialog: "Min 280dp; Max 560dp". We: from medium the crop view keeps the full-screen dialog's header and is
> as large as the window less 56 dp on each side, with the 28 dp corner, as the Lightbox (19); inside it the image is the focus
> pane and the controls are M3's supporting pane (below on medium, a fixed 360 dp trailing pane on expanded). Why: owner decision
> (14 Nov, "a full-screen view"); a 560 dp dialog shows a portrait image too small to place it; M3 prints no image editor. Date and
> PR: of PR 3.

## 4. The image's tools in the bar (decision 3)

```
375 px, an image is tapped (the Image block)
+--------------------------------------------+
| [Change image][Crop][Alt text][Remove] ▏ [Undo][Redo][⋮] |   bar: the image's tools slide in
+--------------------------------------------+
            [↑][↓][👁][⚙][⠿]                      row above the image: the block's own
+--------------------------------------------+
|   (the image, selected)                    |
+--------------------------------------------+

1280 px: the same tools, then the divider, Insert, Undo, Redo, Section settings; no ⋮ (all fit)
| [Change image] [Crop] [Alt text] [Remove] ▏ [+] [Undo] [Redo] [Section settings] |
```

- **Tap = select.** A tap (or Enter or Space on the focused image) selects the image: the image shows the selected state (the
  card's selected ring as today), the bar slides in its tools with the bar's spring (`barMotion.mjs`), and, for the Image block, the
  row opens above it. A tap no longer opens the image sheet by itself on expanded: the sheet opens from the row's `Settings`. This
  changes today's `inPanelNow()` tap (owner question 12.2, recommended: yes, one rule on every size).
- **The tools**, in this order (the bar's width budget, `planBar`, puts the last ones in `⋮` when they don't fit), each an icon
  button with its label as name and tooltip (Material Symbols, by name through `Icon`):

| Tool | Icon (Material Symbols) | What it does |
| --- | --- | --- |
| `Change image` | `photo_library` | Opens the Library picker (`addImage`). The new image keeps the place, the alt text step of 9.1 follows; a ratio and crop are reset to `Original` (a new image starts as Original, decision 5), in a card to the block's ratio with the middle part. |
| `Crop` | `crop` | Opens the crop view (section 3). |
| `Alt text` | `short_text` (question 12.6) | Opens the alt text sheet (9.1): `Decorative image` and `Alt text`. |
| `Remove` | `delete` | Removes the image: in the text the Image block goes (as `Remove` in `⋮` today, which moves here); in a card the card's image is cleared and its media area shows the empty slots. Undo brings it back. A snackbar is not added (Undo is on the bar). |

- **The Image block's row** keeps Move up, Move down, Hide or Show, `Settings`, the handle. `Settings` opens the **image sheet**
  (section 5). The bar's `⋮` keeps Insert and the block's rest (no Remove twice: Remove is a tool).
- **In a card:** the card's image is a button of its own inside the card (`inline-card-media`, today it opens the card's sheet).
  A tap on it selects the image (the card is active too, so its row stays the card's), and the bar shows the image tools instead of
  the card's tools. A tap on the card's text puts the cursor there and selects the card (the card's tools). Escape from the image
  goes back to the card.
- **Keyboard:** Tab reaches the image as one stop; Enter or Space selects it; the bar's tools are reached as today (the bar's own
  keys); Escape leaves the image (back to the text, or to the card); Delete or Backspace on a selected image does what `Remove` does.
  Screen readers hear the image's name (`Image`, and its alt text as description, as today) and that it is selected.

## 5. The image sheet (the Image block's `Settings`)

```
375 px, modal sheet                           1280 px, standard side sheet beside the page
+--------------------------------------+      +-------------------------------+
| Image                           [X]  |      | Image                    [X]  |
| [ image preview, as cut ]            |      | [ image preview, as cut ]     |
| [Change image]                       |      | [Change image]                |
| Decorative image            [ Off ]  |      | Decorative image     [ Off ]  |
| Alt text  [__________________]       |      | Alt text [_________________]  |
| Aspect ratio            3:2   >      |      | Aspect ratio       3:2   >    |
| [Cancel]                    [Save]   |      | [Cancel]              [Save]  |
+--------------------------------------+      +-------------------------------+
```

- The crop part (`CropField`) leaves the sheet. In its place one list row, `Aspect ratio`, with the current ratio as its trailing
  text (`Original`, `3:2`, …) and a chevron; tapping it opens the crop view over the sheet (a full-screen dialog may open over a
  sheet). `Save` in the crop view returns to the sheet with the new ratio and crop, and the sheet's preview shows them; the sheet's
  own `Save` still keeps them in the page (one change, one Save, as today).
- The same sheet is the one `Insert` › `Image` opens after the pick today (with `Insert`); see 9.1 for the short step that replaces
  it for a new image.
- Not offered where the crop is not offered today (a Banner's text, a fixed page): the row is not there.

## 6. Cards: one aspect ratio per block (decision 4)

- **Block setting.** The Cards block's settings get `Image aspect ratio` (shown only when `media` is `image`), segmented or a select
  of `FORMATS` (no `Original`: the cards stay aligned; owner question 12.3), hint `All the cards’ images use it.` The default is
  `3:2`, today's look.
- **The crop view in a card** has no chips: its frame is the block's ratio; it only zooms and moves.
- **A ratio change** keeps every card's image and shows its middle part in the new ratio (a crop made for another ratio is not
  used, see section 7). It does not open the crop view.
- **The site and the editor** draw the card's image with `cropStyle` in a box of the block's ratio instead of the fixed 3:2 in
  `blocks.css`; without a crop, the middle part (`object-fit: cover`), which is exactly today's look.

```
375 px, Cards block settings (modal sheet)     1280 px, side sheet
| Media     [None][Icon][Image][Video] |        | Media   [None][Icon][Image][Video]    |
| Image aspect ratio                   |        | Image aspect ratio                    |
| [1:1][4:5][3:4][2:3][3:2][4:3][16:9] |        | [1:1][4:5][3:4][2:3][3:2][4:3][16:9]  |
| All the cards’ images use it.        |        | All the cards’ images use it.         |
```

Seven choices are more than M3's segmented button or button group holds ("Don't use more than five segments", read for the resize
spec); so the build uses the theme's filter chips as in the crop view, single choice, or an exposed drop-down menu. The build PR
reads `/components/chips` and `/components/menus` and says which, quoted.

## 7. Data model

- **An image in the text: unchanged.** `#format=3:2&crop=x,y,w,h` after the address (`lib/crop.mjs`). Only the UI word changes
  (`Format` → `Aspect ratio`); the stored word stays `format` (a stored name, as the `image` rule allows). No migration.
- **A card's image:** its `image` prop gets the same words, `…/team.webp#format=3:2&crop=10,0,80,100`, written with
  `crop.mjs`'s join helper. The site's `load.ts` and the editor's `viewOf` read it with its split helper and draw it with `cropStyle`; the
  `srcset` and Files lookups use the address without the words (as the text's images already do).
- **The Cards block:** a new prop `ratio`, one of `FORMATS`; empty or unknown means `3:2`. A card's crop whose `format` is not the
  block's ratio is ignored (drawn as the middle part), so a ratio change needs no rewrite of the cards, and a later change back
  finds the old crop again.
- **No migration.** Old Cards have no `ratio` (= 3:2) and no crop (= middle, `object-fit: cover`): the HTML is the same as before.
  A unit test proves it for a Cards block without `ratio` and for an address without words.
- **Video:** no change.
- **Resize:** no `size` word (decision 2).

## 8. The video's `Change address` (decision 7)

- Tapping the video (the frame) selects it; the bar slides in `Change address` (icon `link`), and the row keeps the block's own
  (Move, Hide, `Settings`, handle). Today's slot over the frame (`InlineSlot`) goes: the bar has the tool.
- `Change address` opens the video's sheet with the `Video link` field focused and its text selected, so a paste replaces it;
  `Save` keeps it. (The word: owner question 12.5.)
- The title under the frame stays typed in place.

## 9. Batch 15: images and block flow (decision 6)

### 9.1 Alt text right after an image is picked

Today the full image sheet opens after the pick (section 2). New: after the Library returns an image (`Insert` › `Image`, `Change
image`, a card's `Image` slot), a short **alt text sheet** opens: headline `Alt text`, the image's preview, `Decorative image` and
`Alt text` (with the Library's text as hint, `libraryText`), `Skip` and `Save`. `Skip` keeps the image without its own text (the
Library's text is used, as today). The image starts as `Original` (in a card: the block's ratio, middle part); the crop view does
not open (decision 5). The same sheet is what `Alt text` in the bar opens, with `Cancel` instead of `Skip`.

M3 for the buttons: "If two actions are provided, one must be a confirming action, and the other a dismissing action"; `Skip` is
the dismissing one and keeps the image, which is what the owner picked.

### 9.2 The `Hide on the page` wording

Today the row's visibility button says `Hide on the page` / `Show on the page`, and a hidden block says `Hidden on the page`. The
finding came from a clash with the status `Hidden`; that status is gone (two statuses, `Draft` and `Published`; `Hide from search
engines` is an SEO setting). Owner question 12.7: keep the words (recommended), or `Don’t show on the page`.

### 9.3 Closing a sheet

Today: `You have changes that aren’t saved. Do you want to keep them?` with `Save` or `Insert`, and `Discard` (`app.unsavedSheet`).
It reads as "saved to the site". New (the batch's fix): headline `Keep your changes?`, text `Your changes stay in the page until you
save it.`, buttons `Discard` and `Keep` (confirming last, M3's order). Used by every sheet and by the crop view's close.

## 10. Texts (en-US first; da-DK)

| Key (proposed) | en-US | da-DK |
| --- | --- | --- |
| `media.crop.format` → `media.crop.ratio` | Aspect ratio | Billedformat |
| `media.crop.formatHint` (removed: no hint, the chips speak) | — | — |
| `media.crop.title` (new) | Crop | Beskær |
| `media.crop.original` | Original | Original |
| `media.crop.frame` | Crop frame. Drag the image, or use the arrow keys, to move it. | Beskæringsramme. Træk i billedet, eller brug piletasterne, for at flytte det. |
| `media.crop.drag` | Drag the image to place it in the frame. | Træk i billedet for at placere det i rammen. |
| `media.crop.zoom` | Zoom | Zoom |
| `media.crop.zoomIn` / `zoomOut` (new) | Zoom in / Zoom out | Zoom ind / Zoom ud |
| `forms.changeImage` (reused) | Change image | Skift billede |
| `text.crop` (new, the tool) | Crop | Beskær |
| `blocks.picture.alt` (reused) | Alt text | Alternativ tekst |
| `common.remove` (reused) | Remove | Fjern |
| `media.altSkip` (new) | Skip | Spring over |
| `blocks.cards.ratio` (new) | Image aspect ratio | Billedformat for billeder |
| `blocks.cards.ratioHint` (new) | All the cards’ images use it. | Alle kortenes billeder bruger det. |
| `blocks.video.changeUrl` (new) | Change address | Skift adresse |
| `app.unsavedSheetTitle` (new) | Keep your changes? | Vil du beholde dine ændringer? |
| `app.unsavedSheet` | Your changes stay in the page until you save it. | Dine ændringer bliver på siden, indtil du gemmer den. |
| `app.keep` (new) | Keep | Behold |

Sentence case, active verbs, `image` everywhere; `check:language` must pass.

## 11. Release notes, deviations, checks

**Release notes** (skill `release-notes`, pending, both languages, alphabetical by title):

- paragraph, `feature`, **Crop view** / **Beskæring**: "A small frame made it hard to place an image. Tap an image, choose Crop, and
  drag or pinch the image in a full-size view; the part outside the frame is darkened. Aspect ratio sets the frame, and Original
  shows the whole image." (≈ 40 words)
- paragraph, `improvement`, **Image tools** / **Billedværktøjer**: "Everything for an image is in one place. Tap an image, and the
  toolbar shows Change image, Crop, Alt text and Remove; this works for images in the text and on cards."
- paragraph, `feature`, **Card images** / **Kortbilleder**: "Cards no longer cut every image to 3:2. Set Image aspect ratio in the
  Cards block’s settings, and every card follows it; crop each card’s image to choose its part."
- line, `improvement`: "After you choose an image, you’re asked for its alt text right away"
- line, `improvement`: "Closing a sheet with changes asks whether to keep them in the page"
- line, `improvement`: "A selected video has Change address in the toolbar"

The Danish notes are written as a Danish app says them, by the skill, in each PR.

**Deviations:** only way B of section 3 (its entry above), and only once the owner approves it. The two-tone frame border and the
darkened area are M3-silent choices, listed in the PR as "M3 is silent", not as deviations. The bar's own parts are the editor's
workspace (already listed under *The text bar*).

**Checks** (skill `checks`) per PR: `npm run check`; `npm run check:screens` after `npm run build`, with new units at 375 px and
1280 px: (1) tap an image in the text: the bar shows the four tools and the row its four buttons; (2) `Crop` opens the crop view,
the frame and the darkened area are there, a drag changes the crop, the slider changes the zoom, `Save` writes `#format=…&crop=…`;
(3) the image sheet's `Aspect ratio` row opens the crop view; (4) a card's image tap shows the image tools, a card's text tap the
card's; (5) the Cards `Image aspect ratio` changes every card's box; (6) the alt text sheet after a pick; (7) the video's `Change
address`; (8) closing a changed sheet shows `Keep your changes?`. `npm run check:demo` (Cards and images on the demo);
`check:themes` in `.morpheme/demo/site/` for PR 5 (the theme's Cards CSS changes); `npm run check:editor-colors` for the editor's
parts; `npm run check:contrast` once by hand for the frame and the darkened area in light and dark.

## 12. Open questions for the owner (each with a recommendation)

1. **Larger windows: way A (M3's 560 dp basic dialog) or way B (the Lightbox's size with a supporting pane, a deviation)?**
   Recommended: **B**, because it is the "full-screen view" asked for, the theme already draws the Lightbox this way (deviation
   19), and the controls follow M3's supporting pane. A keeps M3 to the letter but shows a portrait small.
2. **Does a tap on an image on a computer stop opening the side sheet by itself?** Recommended: **yes**, a tap selects on every
   size and `Settings` opens the sheet, as decision 3 says. The other choice keeps today's tap on expanded.
3. **May a Cards block use `Original`?** Recommended: **no**, so the cards stay aligned (decision 4 is one ratio for the block).
4. **How dark is the area outside the frame?** Recommended: the scrim colour at **60 %**, enough to see what is cut away. The other
   choice is M3's dialog scrim strength (the build reads the token if the page shows it).
5. **`Change address` or `Change link` for the video?** The field is called `Video link`. Recommended: **`Change link`**, so the
   tool and the field use one word. The other choice is the owner's `Change address`, which this spec uses until decided.
6. **Icon for `Alt text`.** M3 and Material Symbols have no icon named for alt text. Recommended: **`short_text`** (lines of
   text, read as "a description"). The other choice is `text_fields`. Every name in this spec (`photo_library`, `crop`,
   `short_text`, `delete`, `link`, `add`, `remove` for the zoom buttons) is checked against the Material Symbols set by
   `check:screens`, which fails on a missing icon.
7. **`Hide on the page`: keep it?** Recommended: **keep** `Hide on the page` / `Show on the page` / `Hidden on the page`, since the
   status `Hidden` that it clashed with is gone. The other choice is `Don’t show on the page`.
8. **Other images:** should the same tools come to the Image grid's tiles, a section's background image and the page's top image?
   Recommended: **the top image next** (it is a single image like these), the grid later (it has its own sheet and Library text).

## 13. Build plan (small PRs into `0.18`, each with its changeset)

Each PR: branch from `origin/0.18`, one changeset (skill `changesets`), release notes where listed, `check` green, the link and
head sha to the PM. They merge one by one in this order; each works without the ones after it.

| # | PR | What | Changeset | Note | Depends on |
| - | --- | --- | --- | --- | --- |
| 0 | This spec | The spec, the status line in the resize spec | empty | none | — |
| 1 | **Closing a sheet + Hide wording** | 9.3 texts and buttons in `ask.tsx`/`closeChanged`; 9.2 as the owner answers 12.7 | `patch` | line | — |
| 2 | **Image selection and the bar's image tools** | Tap = select for the image in the text; `blockBar` gets the four image tools; `Remove` moves from `⋮` to the bar; `Crop` opens today's image sheet scrolled to the crop until PR 3; the row's `Settings` opens the sheet; texts | `minor` | paragraph *Image tools* | 12.2 |
| 3 | **The crop view** | A new `CropView` (theme `Dialog` full-screen kind; way A or B per 12.1) with the frame, the darkened area, pinch, wheel, slider with ±; `Aspect ratio` rename; the sheet's crop part becomes the `Aspect ratio` row; deviation entry if B | `minor` | paragraph *Crop view* | 2, 12.1, 12.4 |
| 4 | **Alt text after a pick** | The alt text sheet (9.1) after `Insert` › `Image` and `Change image`; the bar's `Alt text` opens it | `minor` | line | 2 |
| 5 | **Cards: aspect ratio and the card's image** | `ratio` prop and setting, `cropStyle` in the theme's Cards (`blocks.css`, `LinkCards.tsx`, `load.ts`, `view.ts`), the card's image as its own tap target with the image tools, the crop view without chips; unit test of the unchanged HTML; `check:themes` | `minor` | paragraph *Card images* | 2, 3, 12.3 |
| 6 | **Video: Change address** | Tap = select for the video, the tool in the bar, the slot removed, the field focused | `minor` | line | 2, 12.5 |
| 7 | **Docs** | The contextual-toolbar spec's Image and Video rows updated to what was built | empty | none | 2–6 |

PRs 1 and 2 can be built at the same time (different files); 4 and 6 after 2, in either order; 5 after 3.
