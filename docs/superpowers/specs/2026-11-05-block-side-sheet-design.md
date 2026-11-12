# Block fields in a side sheet (design)

> **Status:** approved by the owner on 5 November 2026. It replaces
> [2026-11-05-full-screen-block-fields-design.md](2026-11-05-full-screen-block-fields-design.md). Plan:
> [2026-11-05-block-side-sheet.md](../plans/2026-11-05-block-side-sheet.md).

## Problem

The block sheet (`src/BlockDialog.tsx`) shows the fields of a block in a small sheet from the bottom on a phone and in a
dialog or a raised side panel on a computer. A block with many fields, such as Cards, is too crowded there. The raised
side panel from `large` looks like a second navigation drawer.

## Decisions (owner, 5 November 2026)

- Follow Material 3 exactly: the side sheet (m3.material.io/components/side-sheets). Invent no other pattern.
- Material 3 rule: standard side sheets are for medium to expanded windows; modal side sheets are preferred on compact.
- The layout by window width:

| Window width | The fields of a block | The section settings |
|---|---|---|
| Below 600px (`medium`) | Modal side sheet: full width, over the page and its scrim | As today: the sheet from the bottom |
| 600px and up | Standard side sheet at the end of the window, beside the page | Standard side sheet, the same |

- The anatomy is Material's: the headline, the close button (X) at the end of the header, the content (scrolls), a
  divider, and the actions at the bottom, aligned to the start: "Save" (filled), then "Cancel" (outlined). A new block
  has "Insert" in place of "Save". Both buttons always show.
- The page stays usable beside a standard side sheet (Material 3: it remains visible while people interact with the
  primary content). The page area becomes narrower to make room for the sheet.
- The choice of a block (the "choose" step) does not change.

## Design

1. **The part.** The theme's `SideSheet` (`theme/ui/SideSheet.tsx`, through `SiteSideSheet` in `src/themeUi.ts`) draws
   the sheet: `kind="standard"` from `medium`, `kind="modal"` below. Its CSS (`.side-sheet-*` in `theme/styles/ui.css`)
   already has Material's look: the standard one on the page surface with a line toward the page, the modal one with
   the scrim, the radius and the elevation. Its actions already sit at the bottom, aligned to the start, with a divider
   above. No new theme part, no new theme CSS.
2. **Where each step goes.** `src/sheetPlacement.mjs` gives the look of each step with `sheetLook(step, medium)`:
   `'sheet'`, `'modal-side-sheet'` or `'side-sheet'`. `inPanel` is true for `'side-sheet'`.
3. **The modal side sheet (below `medium`).** It opens over the page in a `<dialog>` with `sideSheetClass`. It slides in
   from the end (`sideSheet()` in `theme/ui/sideSheetControl.ts`). The X, Escape and a tap on the scrim call `leave()`.
   A new block goes from the "choose" sheet to the fields. The choice closes and the side sheet opens.
4. **The standard side sheet (from `medium`).** It is not modal. It stands at the end of the window under the top bar,
   the full remaining height. `[data-side-panel]` on the root makes the page area narrower, as today. The page is not
   inert. The X and Escape (focus in the sheet) call `leave()`.
5. **Another block while one is open.** A tap on another block (or on "+") while a sheet is open runs `leave()` for the
   open one first. With changes, `leave()` asks the current question (`closeChanged` in `src/ask.ts`). When the open
   one has closed, the new one opens.
6. **The page's save bar.** It stays in the page area, beside the sheet, as today (`:root[data-side-panel]
   .editor-save-bar`).
7. **The content.** The order of the fields step stays: `EditLink`, `Preview`, `FieldList`, `CropField`, `ProblemNote`.
   With a problem, `save()` shows it and the wrong field scrolls into view, as today.

## Reused code

| Code | Use |
|---|---|
| `theme/ui/SideSheet.tsx`, `SiteSideSheet` | The sheet, both kinds |
| `theme/ui/sideSheetControl.ts` (`sideSheet`, `sideSheetClass`) | Open, close and motion of the modal one |
| `.side-sheet-*` in `theme/styles/ui.css` | Material's look |
| `src/sheetPlacement.mjs` | `sheetLook`, `inPanel` |
| `[data-side-panel]`, `--side-panel-width`, `.editor-side-panel` in `src/editor.css` | Room for the standard sheet |
| `leave()`, `save()`, `saveSection()`, `closeChanged`, `useWrongField` | Close, save, problems |
| `t.common.save`, `t.common.cancel`, `t.common.close`, `t.blocks.insert` | The texts; no new strings |

## Not in scope

- The "choose" step.
- Other sheets of the editor (links, pages, media).
- Parked: "Image left" for the Cards block (see the replaced design).

## Checks

- `src/sheetPlacement.test.mjs` covers `sheetLook` for every step, below and from `medium`, and a closed sheet.
- The React wiring in `BlockDialog.tsx` is thin. The repo has no tests that render React. A person checks it by hand
  with screenshots: 375px, 800px and 1280px; edit, insert, section settings, another block while one is open with
  changes, Escape, an empty required field.
- `npx prettier --check .`, `node --test` over the `*.test.mjs` files and `npm run build` pass.
