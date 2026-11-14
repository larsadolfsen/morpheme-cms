# Image tools: the crop view, the image's tools in the bar, the Cards' aspect ratio (design)

Status: spec and build plan for 0.18, from the owner's decisions of 14 November 2026 (section 1) and the owner's answers to
the spec's questions on the same day (section 1b). No code in this pull request. No question is open.

Related: `2026-11-13-resize-image-design.md` (its drawn size is dropped, decision 2), `2026-11-11-intuitive-editor-design.md`
(batch 15 is part of this spec, section 9), `2026-11-12-inline-block-editing-design.md` (section 5, Cards),
`2026-11-13-contextual-toolbar-row-design.md` (the one bar, its tables for Image and Video), the block action row of #625
(`src/blockRow.ts`). No deviation from Material 3 is added (decision 1b.1).

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
7. **Video: `Change address`** in the bar for a selected video, the same pattern (handed over from 0.17). Named `Change link`
   by 1b.5.

## 1b. Owner decisions (14 Nov 2026), the answers to this spec's questions

1. **"Follow MD3":** on medium and expanded windows the crop view is M3's **basic dialog** (way A of the first draft). No deviation
   entry; the draft of one is dropped.
2. **"Selecting a block on desktop opens settings in right pane":** on a computer (expanded) a tap on an image selects it **and opens
   its settings in the side sheet**, as today; the bar shows the image tools while it is selected. On a phone a tap only selects.
3. **A Cards block cannot use `Original`:** every Cards block has one aspect ratio, from `FORMATS`.
4. **"Follow MD3 shade":** the area outside the frame uses **M3's scrim colour and opacity** (the theme's scrim token), not a value
   of our own.
5. **`Change link`** is the video's tool (it matches the field `Video link`).
6. **`Alt text`** is the tool's name, the standard term. **The owner's general rule: use the standard names, Material 3's and the
   web's, and never rename them.** The icon: no Material Symbols icon is named for alt text or an image's description (the whole
   Outlined set of `@material-symbols/svg-400` 0.48.2, 7,874 names, was searched; `audio_description` is for audio), so the icon is
   **`short_text`**.
7. **"Just call it hide":** the visibility words are **`Hide`** / **`Show`**, and the state is **`Hidden`**.
8. **Parked:** no image tools for the Image grid's tiles; parked, not planned.

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
  middle. Everything outside the frame is under a layer with M3's scrim colour and opacity (1b.4): the theme's scrim token, the one
  its dialogs already use behind their container (M3: "surfaces behind the container are scrimmed with a temporary overlay"). The
  build PR names the token it uses and reads its value from the M3 dialog specs' token table, which a plain text read leaves
  collapsed. `Original` has no frame and no layer: the whole image is shown, and the slider and the drag are off (nothing to place).
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

### Medium and expanded (600 dp and up): M3's basic dialog (owner, 1b.1)

M3: "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic
dialog." and "Dialogs can swap variants as the breakpoint changes. For example, a full-screen dialog can change into a basic
dialog at larger breakpoints." So from 600 dp the crop view is the theme's `Dialog` kind `basic` with its parts: the headline
`Crop`, the image area, the chips and the slider as its content, and the actions `Cancel` and `Save` at its end, the confirming one
last ("The confirmation button is always closest to the edge"). Its size is M3's: "Min 280dp; Max 560dp", 24 dp padding, the 28 dp
corner, centred over the scrim. The image area is 512 dp wide (560 less 2 × 24) and as high as the window leaves after the
headline, the controls and the actions; the dialog itself does not scroll (M3: "Most dialog content should avoid scrolling").

Today the theme's `full-screen` kind keeps its header from medium (`theme/ui/Dialog.tsx`). The crop view does not rely on that: it
chooses `basic` from medium itself, so no deviation is added.

```
1280 × 800: a basic dialog, 560 dp wide, centred over the scrim
                   +------------------------------------------------+
                   | Crop                                           |  headline
                   | ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ |
                   | ▓▓▓▓▓┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓▓▓▓▓▓ |  the image area, 512 dp wide
                   | ▓▓▓▓▓┃                                 ┃▓▓▓▓▓▓ |
                   | ▓▓▓▓▓┃   the part that is shown (3:2)  ┃▓▓▓▓▓▓ |
                   | ▓▓▓▓▓┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛▓▓▓▓▓▓ |
                   | ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ |
                   | Aspect ratio                                   |
                   | [Original] [1:1] [4:5] [3:4] [2:3] [3:2]       |  chips wrap, no sideways scroll
                   | [4:3] [16:9]                                   |
                   | Zoom   [−] ─────────●──────────────────── [+]  |
                   |                              [Cancel]  [Save]  |  actions, confirming last
                   +------------------------------------------------+
```

With a mouse the wheel zooms around the pointer, and the drag places the image, as on a phone. M3 is silent on wheel zoom; the
slider is the M3 control, and the wheel moves the same value. On medium (600 to 839 dp, a tablet) it is the same dialog; a pinch
works there as on a phone.

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
  row opens above it. **On a computer (expanded) the tap also opens the image's settings in the side sheet, as today
  (`inPanelNow()`, owner 1b.2)**; the bar shows the image tools while the image is selected and the sheet is open. On a phone and
  a tablet (below expanded) a tap only selects, and the sheet opens from the row's `Settings`.
- **The tools**, in this order (the bar's width budget, `planBar`, puts the last ones in `⋮` when they don't fit), each an icon
  button with its label as name and tooltip (Material Symbols, by name through `Icon`):

| Tool | Icon (Material Symbols) | What it does |
| --- | --- | --- |
| `Change image` | `replace_image` | Opens the Library picker (`addImage`). The new image keeps the place, the alt text step of 9.1 follows; a ratio and crop are reset to `Original` (a new image starts as Original, decision 5), in a card to the block's ratio with the middle part. |
| `Crop` | `crop` | Opens the crop view (section 3). |
| `Alt text` | `short_text` (1b.6) | Opens the alt text sheet (9.1): `Decorative image` and `Alt text`. |
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
  of `FORMATS` (no `Original`: the cards stay aligned, owner 1b.3), hint `All the cards’ images use it.` The default is
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

## 8. The video's `Change link` (decisions 7 and 1b.5)

- Tapping the video (the frame) selects it; the bar slides in `Change link` (icon `link`), and the row keeps the block's own
  (Move, Hide, `Settings`, handle). On a computer the tap also opens its settings in the side sheet, as for an image (1b.2). Today's slot over the frame (`InlineSlot`) goes: the bar has the tool.
- `Change link` opens the video's sheet with the `Video link` field focused and its text selected, so a paste replaces it;
  `Save` keeps it.
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

### 9.2 `Hide` and `Show` (owner, 1b.7: "Just call it hide")

Today the row's visibility button says `Hide on the page` / `Show on the page`, and a hidden block says `Hidden on the page`
(`text.hideOnPage`, `showOnPage`, `hiddenOnPage`). New: **`Hide`**, **`Show`** and the state **`Hidden`**, in the row's button
(its label and tooltip), the bar's `⋮`, and what screen readers hear of a hidden block. The keys keep their names; only the texts
change. Danish: `Skjul`, `Vis`, `Skjult`.

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
| `blocks.video.changeUrl` (new) | Change link | Skift link |
| `text.hideOnPage` | Hide | Skjul |
| `text.showOnPage` | Show | Vis |
| `text.hiddenOnPage` | Hidden | Skjult |
| `app.unsavedSheetTitle` (new) | Keep your changes? | Vil du beholde dine ændringer? |
| `app.unsavedSheet` | Your changes stay in the page until you save it. | Dine ændringer bliver på siden, indtil du gemmer den. |
| `app.keep` (new) | Keep | Behold |

Sentence case, active verbs, `image` everywhere; `check:language` must pass. The owner's rule (1b.6): the standard names of
Material 3 and the web (`Alt text`, `Aspect ratio`, `Crop`, `Hide`) are used as they are, never renamed.

## 11. Release notes, deviations, checks

**Release notes** (skill `release-notes`, pending, both languages, alphabetical by title):

- paragraph, `feature`, **Crop view** / **Beskæring**: "A small frame made it hard to place an image. Tap an image, choose Crop, and
  drag or pinch the image in a view of its own; the part outside the frame is darkened. Aspect ratio sets the frame, and Original
  shows the whole image." (≈ 40 words)
- paragraph, `improvement`, **Image tools** / **Billedværktøjer**: "Everything for an image is in one place. Tap an image, and the
  toolbar shows Change image, Crop, Alt text and Remove; this works for images in the text and on cards."
- paragraph, `feature`, **Card images** / **Kortbilleder**: "Cards no longer cut every image to 3:2. Set Image aspect ratio in the
  Cards block’s settings, and every card follows it; crop each card’s image to choose its part."
- line, `improvement`: "Hide and Show are the words for a block you keep off the page"
- line, `improvement`: "After you choose an image, you’re asked for its alt text right away"
- line, `improvement`: "Closing a sheet with changes asks whether to keep them in the page"
- line, `improvement`: "A selected video has Change link in the toolbar"

The Danish notes are written as a Danish app says them, by the skill, in each PR.

**Deviations:** none. The crop view is M3's full-screen dialog on a phone and M3's basic dialog from medium (1b.1); the darkened
area is M3's scrim (1b.4). The two-tone frame border is an M3-silent choice and is listed in the PR as "M3 is silent", not as a
deviation. The bar's own parts are the editor's workspace (already listed under *The text bar*).

**Checks** (skill `checks`) per PR: `npm run check`; `npm run check:screens` after `npm run build`, with new units at 375 px and
1280 px: (1) tap an image in the text: the bar shows the four tools and the row its four buttons; (2) `Crop` opens the crop view,
the frame and the darkened area are there, a drag changes the crop, the slider changes the zoom, `Save` writes `#format=…&crop=…`;
(3) the image sheet's `Aspect ratio` row opens the crop view; (4) a card's image tap shows the image tools, a card's text tap the
card's; (5) the Cards `Image aspect ratio` changes every card's box; (6) the alt text sheet after a pick; (7) the video's `Change
link`; (8) closing a changed sheet shows `Keep your changes?`; (9) on a computer a tap on an image opens its side sheet and the bar shows
the image tools, on a phone it only selects; (10) the row's visibility button says `Hide` / `Show`. `npm run check:demo` (Cards and images on the demo);
`check:themes` in `.morpheme/demo/site/` for PR 5 (the theme's Cards CSS changes); `npm run check:editor-colors` for the editor's
parts; `npm run check:contrast` once by hand for the frame and the darkened area in light and dark.

## 12. Open questions

None. The owner answered all eight questions of the first draft (section 1b).

## 12b. Parked (owner, 1b.8)

- Image tools for the Image grid's tiles (they keep their own sheet and Library text).

Parked means not planned: nothing in the build plan prepares them.

## 13. Build plan (small PRs into `0.18`, each with its changeset)

Each PR: branch from `origin/0.18`, one changeset (skill `changesets`), release notes where listed, `check` green, the link and
head sha to the PM. They merge one by one in this order; each works without the ones after it.

| # | PR | What | Changeset | Note | Depends on |
| - | --- | --- | --- | --- | --- |
| 0 | This spec | The spec, the status line in the resize spec | empty | none | — |
| 1 | **Closing a sheet + Hide wording** | 9.3 texts and buttons in `ask.tsx`/`closeChanged`; 9.2 `Hide` / `Show` / `Hidden` | `patch` | two lines | — |
| 2 | **Image selection and the bar's image tools** | Tap = select for the image in the text; `blockBar` gets the four image tools; `Remove` moves from `⋮` to the bar; `Crop` opens today's image sheet scrolled to the crop until PR 3; the row's `Settings` opens the sheet; on a computer the tap still opens the side sheet (1b.2); texts | `minor` | paragraph *Image tools* | — |
| 3 | **The crop view** | A new `CropView` (theme `Dialog`: `full-screen` below medium, `basic` from medium, 1b.1) with the frame, the scrim outside it (1b.4), pinch, wheel, slider with ±; `Aspect ratio` rename; the sheet's crop part becomes the `Aspect ratio` row; no deviation | `minor` | paragraph *Crop view* | 2 |
| 4 | **Alt text after a pick** | The alt text sheet (9.1) after `Insert` › `Image` and `Change image`; the bar's `Alt text` opens it | `minor` | line | 2 |
| 5 | **Cards: aspect ratio and the card's image** | `ratio` prop and setting, `cropStyle` in the theme's Cards (`blocks.css`, `LinkCards.tsx`, `load.ts`, `view.ts`), the card's image as its own tap target with the image tools, the crop view without chips; unit test of the unchanged HTML; `check:themes` | `minor` | paragraph *Card images* | 2, 3 |
| 6 | **Video: Change link** | Tap = select for the video, the tool in the bar, the slot removed, the field focused | `minor` | line | 2 |
| 7 | **Docs** | The contextual-toolbar spec's Image and Video rows updated to what was built | empty | none | 2–6 |

PRs 1 and 2 can be built at the same time (different files); 4 and 6 after 2, in either order; 5 after 3.
