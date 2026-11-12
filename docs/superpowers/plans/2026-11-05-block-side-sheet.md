# Block fields in a side sheet: implementation plan

Status: done. Checked against the code on 2026-11-10.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The fields of a block and the section settings open in Material 3's side sheet.

**Architecture:** `sheetLook(step, medium)` in `src/sheetPlacement.mjs` gives the look of each step. `BlockDialog.tsx`
draws the fields and the section settings with the theme's `SideSheet`. The sheet is modal below `medium` and standard
from `medium`.

**Tech stack:** React (editor in `src/`, theme parts in `theme/ui/`), `node --test` for `*.test.mjs`, Prettier, the
demo build, Changesets.

**Spec:** `docs/superpowers/specs/2026-11-05-block-side-sheet-design.md`.

## Global constraints

- Every source file starts with a 2–3 line header comment: what it does, what it exposes, key dependencies. Update the
  header of each file that you change.
- Add no UI text. Use `t.common.save`, `t.common.cancel`, `t.common.close` and `t.blocks.insert`.
- Use the theme's `SideSheet` (`SiteSideSheet`) and `sideSheet()`. Write no new sheet. Change no theme file.
- Write no markup twice.
- Do not change the "choose" step.
- Comments, commit messages and changesets are in English.
- Each task ends with these checks, all green:
  - `npx prettier --check .`
  - `node --test` over `git ls-files '*.test.mjs'`
  - `npm run build`
- The repo has no `npm run check` script.
- Each task commits on its own branch. Stage by path. Do not use `git add -A`.

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/sheetPlacement.mjs` | modify | `sheetLook(step, medium)` with the new values; `inPanel` uses it |
| `src/sheetPlacement.test.mjs` | modify | tests for the new values |
| `src/BlockDialog.tsx` | modify | the fields and the section settings in `SiteSideSheet` |
| `src/editor.css` | modify | the place of the standard side sheet from `medium` |
| `src/themeUi.ts` | modify only if needed | exports `sideSheetClass`, `sideSheet` |
| `.changeset/block-side-sheet.md` | create | minor, one line for a site's owner |

## Screenshots without a login

`scripts/built-site.mjs` exports `serveBuilt(dist)` and `openEditor(...)`. `scripts/editor-screens.mjs` shows how to use
them. Write a scratch Playwright script outside the repo. Run `npm run build` first. Save the screenshots outside the
repo. Give their paths in the task report.

## Workers

| Task | Worker | Reason |
|---|---|---|
| `block-side-sheet/1` | Ollama runner | A pure function and its tests, fully specified |
| `block-side-sheet/2` | Sonnet agent | Editor wiring that needs the repo rules |

Order: task 2 needs task 1.

---

### Task `block-side-sheet/1`: the look of each step

**Files:** `src/sheetPlacement.mjs`, `src/sheetPlacement.test.mjs`.

**Interface:**

```js
/** step: 'choose' | 'fields' | 'section' | undefined; medium: the window is at least the `medium` breakpoint (600px). */
export function sheetLook(step, medium); // 'sheet' | 'modal-side-sheet' | 'side-sheet'
/** true exactly when sheetLook(step, medium) === 'side-sheet'. */
export function inPanel(step, medium);
```

**Test cases:**

| `step` | `medium` | `sheetLook` | `inPanel` |
|---|---|---|---|
| `'fields'` | `false` | `'modal-side-sheet'` | `false` |
| `'fields'` | `true` | `'side-sheet'` | `true` |
| `'section'` | `false` | `'sheet'` | `false` |
| `'section'` | `true` | `'side-sheet'` | `true` |
| `'choose'` | `false` | `'sheet'` | `false` |
| `'choose'` | `true` | `'sheet'` | `false` |
| `undefined` | `false` | `'sheet'` | `false` |
| `undefined` | `true` | `'sheet'` | `false` |

**Steps:**

- [ ] Replace the tests in `src/sheetPlacement.test.mjs` with one test per row of the table.
- [ ] Change `sheetLook` and `inPanel` in `src/sheetPlacement.mjs` to give the results of the table. Use no imports.
- [ ] Rename the second parameter from `large` to `medium` in both functions.
- [ ] Update the header comment and the JSDoc of both files.
- [ ] Run `node --test src/sheetPlacement.test.mjs`. Expect all tests to pass.
- [ ] Commit both files: "Place block sheet steps by the medium breakpoint".

### Task `block-side-sheet/2`: the fields and the section settings in the side sheet

**Files:** `src/BlockDialog.tsx`, `src/editor.css`, `src/themeUi.ts` (only if needed), `.changeset/block-side-sheet.md`.

**Behaviour:**

| `sheetLook(open?.step, medium)` | Container | Header | Bottom |
|---|---|---|---|
| `'sheet'` | `BottomSheet` as today | `SheetTitle` | as today |
| `'modal-side-sheet'` | `<dialog>` with `sideSheetClass`, `SiteSideSheet kind="modal"`, opened by `sideSheet()` | headline, X at the end | `actions`: Save, Cancel |
| `'side-sheet'` | `SiteSideSheet kind="standard"` at the end of the window, not modal | headline, X at the end | `actions`: Save, Cancel |

**Requirements:**

- `medium` comes from `useAtLeast('medium')`. It replaces `large` for the sheet.
- `actions`: a filled `Button` (`t.common.save`; `t.blocks.insert` for a new block), then an outlined `Button`
  (`t.common.cancel`). Both always show. Save calls `save(block.type)` or `saveSection()`. Cancel calls `leave()`.
- The headline: the block's name, `t.blocks.insert` for a new block, `t.text.sectionSettings` for the section step.
- The X (`closeLabel` `t.common.close`, `onClose`) calls `leave()`.
- Modal side sheet: Escape and a tap on the scrim call `leave()`. Use the motion of `sideSheet()`.
- Standard side sheet: it stands at the end of the window under the top bar, the full remaining height, at the width
  `--side-panel-width` (keep the current `.editor-side-panel` place in `src/editor.css`, from `medium`). The page is not
  inert. Do not use `showModal()` for it. `[data-side-panel]` on the root makes the page area narrower, as today.
  Escape with focus in the sheet calls `leave()`. Focus moves into the sheet when it opens and back when it closes.
- A new block: the "choose" step stays a `BottomSheet`. After the choice, the fields open in the side sheet of the width.
- A tap on another block (or on "+") while a sheet is open: run `leave()` for the open one first. With changes, the
  question of `closeChanged` comes. Open the new one only after the open one has closed. Cancel in the question keeps
  the open one.
- The page's save bar stays in the page area (`:root[data-side-panel] .editor-save-bar`).
- The fields keep their order: `EditLink`, `Preview`, `FieldList`, `CropField`, `ProblemNote`. They scroll in
  `.side-sheet-content`. With a problem, the wrong field scrolls into view.
- Remove `panel` from `BottomSheet` in `src/ui.tsx` only when no other screen uses it. Remove dead CSS of
  `.editor-side-panel` only when nothing uses it.
- The changeset: `@morphemecms/cms` minor, "The fields of a block and the section settings open in a side sheet: over
  the page on a phone, beside it on a tablet and a computer."

**Steps:**

- [ ] Wire the three looks in `src/BlockDialog.tsx` as the table says.
- [ ] Place the standard side sheet in `src/editor.css`.
- [ ] Handle a tap on another block while a sheet is open.
- [ ] Update the header comments of the changed files.
- [ ] Add the changeset.
- [ ] Run the checks in "Global constraints".
- [ ] Run `node scripts/editor-screens.mjs .morpheme/demo/site/dist` after `npm run build`. Expect no failure.
- [ ] Check each row below on the Cards block of the demo. Capture one screenshot per row at deviceScaleFactor 2.

| Width | Action | Expected |
|---|---|---|
| 375px | Edit a block | Modal side sheet over the scrim, full width; "Cards", X at the end; Save, Cancel at the bottom |
| 375px | Insert a new block | The choice is a sheet from the bottom; then the modal side sheet with "Insert" |
| 375px | Section settings | As today: the sheet from the bottom |
| 800px | Edit a block | Standard side sheet at the end; page narrower and usable; a line between them |
| 800px | Section settings | Standard side sheet, Save and Cancel |
| 1280px | Edit a block | Standard side sheet; the page's text can take a click and typing |
| 1280px | Tap another block with changes | The question about the changes; after "Discard", the other block opens |
| any | Save with an empty required field | The problem shows; the wrong field scrolls into view |
| any | Escape and X without changes | The sheet closes |
| any | Cancel with changes | The question about the changes |

- [ ] Commit the changed files: "Open block fields and section settings in a side sheet".

## Acceptance

- `node --test` over every `*.test.mjs` passes.
- `npx prettier --check .` and `npm run build` pass.
- The hand checks of task 2 pass.
- Then: PR, merge, Release PR, release. The owner checks the editor on staging (`morpheme-staging`).
