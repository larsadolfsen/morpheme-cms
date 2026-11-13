# Resize image in the editor (design proposal)

Status: postponed past 0.17, proposal for the owner. No code. Nothing here is for 0.17.

Owner, 13 Nov 2026: "those things that we need, like resize images and stuff like that, let's write specs, but postpone them to the next version."

## What happens to an image today

Read from the code, not from memory.

- **Upload** (`src/images.ts`, `prepareImage`): the browser shrinks the image to at most 2000 px on the long side and saves it as WebP (JPEG where WebP can't be written), quality 0.82. The original is never kept.
- **Build** (`scripts/responsive-images.mjs`): writes WebP copies 160, 480, 800 and 1200 px wide (only sizes below the original) plus a 1200 × 630 share image. It writes `image-manifest.json` with the original size.
- **Page** (`site/images.mjs`, `theme/components/Img.astro`): adds `srcset`, `width`, `height` and lazy loading. A phone downloads the copy that fits its screen.
- **Crop** (`lib/crop.mjs`, `src/Crop.tsx`): picks a format (1:1 … 16:9) and the part to show. Saved after the address: `image.webp#format=2:3&crop=12.5,0,75,100`. The file is not changed. Crop has zoom, but no width or height setting.
- **Width on the page:** none per image. Text images use the text column (`sizes` is `720px` on computer, full width less 40 px on phone). The Banner has a `width` setting (window or text width) and nothing else does.

## What "resize" can mean

1. **Drawn size:** how wide the image is on the page (small, medium, full width). Missing.
2. **File size:** a smaller file to download. Mostly done: responsive copies and compression already happen. Missing: a choice of quality, and shrinking the stored file (the stored file stays up to 2000 px forever).
3. **Both:** one control for drawn size, and the build makes sure no copy is bigger than needed.

Proposal: build 1 (drawn size). Meaning 2 stays automatic. A "smaller file" option is optional (question 3).

## The control

One row, "Size", in the image's settings sheet (where Crop and "Decorative image" are today; no new bar). Phone first.

- Choices: `Small`, `Medium`, `Large`, `Full width`. Default is what the image does today.
- M3 prints that segmented buttons take 2 to 5 segments ("Don't use more than five segments") and are "used for selecting between 2 and 5 choices". Four fit. M3 also prints: "Segmented buttons are no longer recommended in the Material 3 expressive update … use the connected button group instead." The code has `theme/ui/SegmentedButton.tsx`; the build session reads the connected button group page and uses it if the theme has it, and says so in the PR.
- A slider for free width: M3 prints "Changes made with sliders must take effect immediately", and that a separate text input beside it is allowed: "the slider and value in this text field should automatically update to match each other" and "Make sure people can tab to the text field directly after the slider." Suffix text for a unit is printed for text fields ("unit of measurement"). M3 does not print a unit for a width in percent, so we use `%` as suffix text and say M3 is silent about the value.
- Free width is optional (question 2). Without it the four choices stay the only control.
- M3 prints for the slider: Tab lands on the handle, arrows change by one step or stop, Home and End jump to the ends. M3 is silent about a slider inside a bottom sheet; the Crop dialog already has one (zoom), so we copy it.
- The block's preview in the editor shows the new size at once (as the slider page requires).

## Data model

Same trick as crop: a word after the address, no new files, no front matter change.

`![Office](/images/uploads/2024/05/office.webp#size=medium)` and with crop: `…#format=2:3&crop=12.5,0,75,100&size=medium`.

- `size` is one of `small`, `medium`, `large`, `full`; with free width, a number 10–100 (percent of the column).
- No `size` means today's look. Old pages and old sites are untouched, and a site that updates the package sees no change.
- Unknown values are ignored, as `crop` does now. `lib/crop.mjs` gets the parse and write (`splitPicture`, `joinPicture`); the unit tests there cover the old addresses unchanged.
- Image fields in front matter (hero, cards, share image) get no size in this version: they have a place of their own and a format. Only images in the text and the Image/Banner blocks (question 4).

## The site's build

- Drawn size changes `sizes` (and a CSS width), so the browser still picks a fitting copy. A `small` image on a phone downloads the 480 copy instead of the 800 one: the file gets smaller without a new control.
- No new copies and no build time cost for choices 1: `WIDTHS` stay 160, 480, 800, 1200. A `Large`/`Full width` image above 1200 px would use the 2000 px original (already the top of `srcset`).
- The Worker is not touched: `sharp` runs in Workers Builds, not in the Worker, so its limits (CPU, memory) don't apply.
- Optional (question 3): quality choice or "shrink the stored file" runs in the browser before upload, like `prepareImage`, so it also needs no build change. Shrinking an already stored image means a new file and a rewrite of every address that uses it: the same work as rename in the Files library (`renameRecord`).

## Touch and keyboard

- Segments: 48 dp tall targets, arrow keys inside the group, Space or Enter selects.
- Slider: arrows, Home, End as printed above; the text field has `inputmode="numeric"`; focus order slider, then field.
- Every control has a text label (`Size`), and the group says the current choice to screen readers.

## Texts

English first (`src/i18n/en-US`), Danish in `da-DK` later: `Size`, `Small`, `Medium`, `Large`, `Full width`, `Width in percent`. Short active words, as `word-choice` asks. The word is `image`.

## Release note

A paragraph (the editor looks and works differently): "Choose how big an image is on the page." English and Danish, by the `release-notes` skill, in `release-notes/i18n/<locale>/pending/`. Changeset `minor` for the build PRs, never `major`.

## Build plan (small PRs, after 0.17)

1. **Data:** `size` in `lib/crop.mjs`, the rehype plugin and `sizes`, tests. About a day. No visible change.
2. **Control:** the Size row in the image sheet, preview, texts, release note. About a day.
3. **Free width** (only if chosen): slider and text field. Half a day.
4. **Other places** (only if chosen): Banner and card images. Half a day each.

## Checks

`npm run check`, `check:screens` (the sheet opens on phone and computer), `check:demo`, `check:contrast` once by hand for the new row, and a unit test that an old address gives the same HTML as before.

## Open questions for the owner

1. **What does resize mean for you?** Plain: how big the image looks on the page, or how big the file is? I recommend drawn size, because the file size is already handled automatically. The other choice is both.
2. **Four steps or a free slider?** Four steps are simpler on a phone and keep pages alike. I recommend four steps first. The other choice is steps plus a percent slider.
3. **Should the owner be able to shrink the stored file?** Today every upload is capped at 2000 px. I recommend no, because it adds a rewrite of addresses. The other choice is a "Smaller file" option later.
4. **Where does size apply?** I recommend images in the text and the Image block first. The other choice is also the Banner and card images.
5. **Should an image in a block with a format keep its format when resized?** I recommend yes, the format (crop) stays and only the width changes. The other choice is that size resets the crop.
6. **Which default for a new image?** I recommend today's look (no `size` word). The other choice is `Medium` for new images only.

## Also missing

- Rotate and flip an image
- Alt text suggestions
- Replace an image and keep its place and crop
- Image focus point (the part that always stays visible)
- Image alignment (left, right, centre) and text wrap
- Captions
- Image compare/before-after and galleries
