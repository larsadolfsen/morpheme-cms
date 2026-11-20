# Full-screen block fields (design)

> **Status:** superseded on 5 November 2026 by
> [2026-11-05-block-side-sheet-design.md](2026-11-05-block-side-sheet-design.md). The owner chose Material 3's side
> sheet after the first build. Kept as the record of the first design.

## Problem

The block sheet (`src/BlockDialog.tsx`) shows the fields of a block in a small sheet from the bottom on a phone. On a
computer it is a dialog in the middle of the screen. A block with many fields, such as Cards, is too crowded there.
More design options for one block make this worse. The owner stopped the "Image left" option for Cards for this
reason.

## Decisions (owner, 5 November 2026)

- Only the fields of a block change: the "fields" step, for a new block and for a block that the user edits.
- The choice of a block (the "choose" step) does not change.
- The section settings (the "section" step) do not change.
- No mini editor: the fields stay a form.
- The layout by window width:

| Window width | The fields of a block | Source |
|---|---|---|
| Below 600px (`medium`) | Full screen | Material 3 full-screen dialog |
| 600px to below 1200px (`large`) | A dialog in the middle of the screen, at most 35rem wide | Material 3 full-screen dialog, from `medium` |
| 1200px and up | The side panel at the end edge of the window | PR #94, no change |

- One header in all three layouts: the close button (X) at the start, the name of the block, and the main action at
  the end. The main action is a text button: "Save" for a block that exists, "Insert" for a new block.
- The bar with "Cancel" and "Save" at the bottom goes away for the "fields" step.

## Amendment (owner, 5 November 2026, after the first build)

These replace the layout table, the header and the bar above and in the Design:

| Window width | The fields of a block | The section settings |
|---|---|---|
| Below 1200px (`large`) | Full screen, also from 600px | As before (sheet) |
| 1200px and up | Split screen: a card beside the page | Split screen: a card beside the page |

- Full screen: the name of the block at the start of the header, the close button (X) at the end. No action in the
  header. A sticky Save at the bottom (the look of `src/SaveBar.tsx`, from `FormFrame.tsx`). It shows only when the
  fields have changed. A new block shows "Insert" at once.
- Split screen: the area keeps the page's normal background. The content sits in the text editor's card
  (`src/EditorCard.tsx`, from `MarkdownEditor.tsx`). The header has the title only: no drag handle, no close button.
  At the bottom: "Cancel" always, and "Save" ("Insert" for a new block) only when something has changed.
- While the split screen is open, the page's own save bar is hidden.
- The choice of a block does not change.

## Design

1. **The container.** Below `large`, the "fields" step uses the theme's full-screen dialog
   (`theme/ui/Dialog.tsx`, `kind="full-screen"`, `dialogFullScreenModalClass`). Its CSS already makes it full screen
   below `medium` and a dialog in the middle from `medium` (`theme/styles/ui.css`, `.dialog-modal-full-screen`). From
   `large`, the "fields" step stays in the side panel of PR #94 (`BottomSheet` with `panel`).
2. **One `<dialog>` element.** The block sheet keeps one `<dialog>` for all steps. A new block goes from "choose" to
   "fields" in the same `<dialog>`. Only its classes and its container change with the step.
3. **The header.** The theme's full-screen dialog header becomes its own exported part, `DialogHeader`, in
   `theme/ui/Dialog.tsx`. `Dialog` with `kind="full-screen"` uses it, so the site does not change. The editor uses it
   through `src/themeUi.ts` and a thin editor part in `src/ui.tsx`. The header looks the same in the side panel.
4. **Where each step goes.** `src/sheetPlacement.mjs` decides the look of each step with a new pure function,
   `sheetLook(step, large)`. `inPanel` stays and gives the same results as today.
5. **Close.** The X, the Escape key and a tap beside the dialog in the middle call the current `leave()`. With changes,
   `leave()` asks the current question (`closeChanged` in `src/ask.ts`). In the side panel, a tap beside it does
   nothing, as today.
6. **The content.** The order stays: the link to the shared texts (`EditLink`), the preview, the fields, the crop of a
   image, the problem note. The content scrolls under the fixed header.
7. **Save with a problem.** The header button calls the current `save()`. `save()` shows the problem and marks the
   wrong field as today (`useWrongField`). The wrong field must come into view, also when it is far down the form.

## Reused code

| Code | Use |
|---|---|
| `theme/ui/Dialog.tsx` (`kind="full-screen"`), `dialogFullScreenModalClass` | Container and header below `large` |
| `.dialog-modal-full-screen`, `.dialog-full-screen` in `theme/styles/ui.css` | Full screen below `medium`, a dialog from `medium` |
| `src/sheetPlacement.mjs` (`inPanel`) | Extended with `sheetLook` |
| `BottomSheet` with `panel` in `src/ui.tsx`, `.editor-side-panel` in `src/editor.css` | The side panel from `large` |
| `leave()`, `save()`, `closeChanged`, `useWrongField` in `src/BlockDialog.tsx`, `src/ask.ts`, `src/fields.tsx` | Close, save, problems |
| `t.common.close`, `t.common.save`, `t.blocks.insert` | The texts of the header; no new strings |

## Not in scope

- The "choose" step and the "section" step. They keep `SheetTitle` and `SheetActions`.
- Other sheets of the editor (links, pages, media).
- A mini editor for blocks.
- **Parked: "Image left" for the Cards block** (a 4th option on the Design switch, value `image-left`, Danish
  label: Billede til venstre). A mockup with the demo's home-page cards showed a problem. With two cards per row on a
  normal page (66ch text column), the text column of a card is only about 140px wide. One card per row, or a
  full-width page, gives about 300px. Material 3 also shows the opposite direction: a horizontal card on compact
  screens becomes vertical on expanded screens. Decide these points in a new design session after this work.

## Checks

- `src/sheetPlacement.test.mjs` covers `sheetLook` for every step, below and from `large`, and a closed sheet.
- The current `inPanel` tests pass with no change.
- The React parts (`DialogHeader`, the editor's header, the wiring in `BlockDialog.tsx`) are thin UI wiring. The repo
  has no tests that render React. The logic is in `sheetLook`, which has tests. A person checks the parts by hand:
  - The editor's parts screen shows the full-screen dialog (`src/ContainmentParts.tsx`, "Full screen"). It looks the
    same before and after the extraction of `DialogHeader`.
- `npm run check`, `node --test` over the `*.test.mjs` files and `npm run build` pass.
- The owner checks the editor by hand on staging (`morpheme-staging`): a Cards block at 375px, 800px and 1280px.
  Insert a new block, edit a block, close with and without changes, save with an empty required field.
