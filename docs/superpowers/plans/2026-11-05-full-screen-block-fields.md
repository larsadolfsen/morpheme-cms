# Full-screen block fields: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The fields of a block open full screen on a phone and as a dialog in the middle from 600px.

**Architecture:** A pure function in `src/sheetPlacement.mjs` gives the look of each step. The theme's full-screen
dialog header becomes its own part. `BlockDialog.tsx` uses that part and the theme's full-screen dialog for the
"fields" step. The side panel of PR #94 stays from `large`.

**Tech stack:** React (editor in `src/`, theme parts in `theme/ui/`), `node --test` for `*.test.mjs`, Prettier, the
demo build, Changesets.

**Spec:** `docs/superpowers/specs/2026-11-05-full-screen-block-fields-design.md`.

## Global constraints

- Every source file starts with a 2–3 line header comment: what it does, what it exposes, key dependencies. Update the
  header of each file that you change.
- Add no UI text. Use `t.common.close`, `t.common.save` and `t.blocks.insert`.
- Reuse `theme/ui/Dialog.tsx` (`kind="full-screen"`) and its CSS in `theme/styles/ui.css`. Write no new dialog.
- Write no markup twice. The full-screen dialog and the editor use the same `DialogHeader`.
- Do not change the "choose" step or the "section" step.
- Do not change how the side panel opens, closes or makes room (`inPanel`, `[data-side-panel]`, `.editor-side-panel`).
- Comments, commit messages and changesets are in English.
- Each task ends with these checks, all green:
  - `npx prettier --check .`
  - `node --test` over the `*.test.mjs` files
  - `npm run check`
  - `npm run build`
- Each task commits on its own branch from the session branch. Stage by path. Do not use `git add -A`.

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/sheetPlacement.mjs` | modify | adds `sheetLook(step, large)`; `inPanel` uses it |
| `src/sheetPlacement.test.mjs` | modify | tests for `sheetLook`; the `inPanel` tests stay |
| `theme/ui/Dialog.tsx` | modify | exports `DialogHeader`; `Dialog` `kind="full-screen"` uses it and passes `onClose` |
| `theme/styles/ui.css` | modify | the header rules apply to `DialogHeader` outside `.dialog-full-screen` too |
| `src/themeUi.ts` | modify | exports `SiteDialogHeader`, `siteDialogFullScreenModalClass`, `siteDialogClassOf` |
| `src/ui.tsx` | modify | adds `FullScreenTitle`; `BottomSheet` gets `fullScreen` |
| `src/BlockDialog.tsx` | modify | the "fields" step uses `sheetLook`, `FullScreenTitle` and `BottomSheet` `fullScreen` |
| `.changeset/full-screen-block-fields.md` | create | minor, one line for a site's owner |

## Screenshots without a login

`scripts/built-site.mjs` exports `serveBuilt(dist)` and `openEditor(...)`. `scripts/editor-screens.mjs` shows how to use
them: they serve the built demo and open its editor with no login, with GitHub answered from the repo files. Write a
scratch Playwright script outside the repo that uses them. Run `npm run build` first. Save the screenshots outside
the repo, and give their paths in the task report.

## Workers

| Task | Worker | Reason |
|---|---|---|
| `full-screen-block-fields/1` | Ollama runner | A pure function and its tests, fully specified |
| `full-screen-block-fields/2` | Sonnet agent | Theme work: a theme part, its CSS and the Material look |
| `full-screen-block-fields/3` | Sonnet agent | Editor work in `ui.tsx` and `BlockDialog.tsx` that needs the repo rules |

Order: tasks 1 and 2 have no dependency on each other. Task 3 needs tasks 1 and 2.

---

### Task `full-screen-block-fields/1`: the look of each step

**Files:**

- Modify: `src/sheetPlacement.mjs`
- Modify: `src/sheetPlacement.test.mjs`

**Interfaces:**

- Consumes: nothing.
- Produces:

```ts
/** step: 'choose' | 'fields' | 'section' | undefined; large: the window is at least the `large` breakpoint. */
export function sheetLook(step, large): 'sheet' | 'full-screen' | 'panel';
/** Unchanged results: true exactly when sheetLook(step, large) === 'panel'. */
export function inPanel(step, large): boolean;
```

**Test cases for `sheetLook`:**

| `step` | `large` | Result |
|---|---|---|
| `'fields'` | `false` | `'full-screen'` |
| `'fields'` | `true` | `'panel'` |
| `'section'` | `false` | `'sheet'` |
| `'section'` | `true` | `'panel'` |
| `'choose'` | `false` | `'sheet'` |
| `'choose'` | `true` | `'sheet'` |
| `undefined` | `false` | `'sheet'` |
| `undefined` | `true` | `'sheet'` |

**Steps:**

- [ ] Add the eight cases of the table to `src/sheetPlacement.test.mjs`. Keep the current `inPanel` tests.
- [ ] Run `node --test src/sheetPlacement.test.mjs`. Expect a failure: `sheetLook` is not there.
- [ ] Add `sheetLook` to `src/sheetPlacement.mjs`. Use no imports.
- [ ] Make `inPanel` return `sheetLook(step, large) === 'panel'`.
- [ ] Update the header comment of both files.
- [ ] Run `node --test src/sheetPlacement.test.mjs`. Expect all tests to pass.
- [ ] Run the checks in "Global constraints".
- [ ] Commit both files: "Add sheetLook for the look of each block sheet step".

### Task `full-screen-block-fields/2`: the full-screen dialog header as its own part

**Files:**

- Modify: `theme/ui/Dialog.tsx`
- Modify: `theme/styles/ui.css` (the `.dialog-full-screen` rules, about lines 1553–1610)
- Modify: `src/themeUi.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:

```ts
// theme/ui/Dialog.tsx
export function DialogHeader(props: {
  headline?: ReactNode;
  headlineId?: string;
  closeLabel?: string;   // with it, the close button (icon "x") at the start
  onClose?: () => void;  // the close button's click; without it, the button keeps data-dialog-close only
  actions?: ReactNode;   // at the end: a text button
}): JSX.Element;
// Dialog gets an optional prop onClose?: () => void, passed to DialogHeader when kind is 'full-screen'.

// src/themeUi.ts
export { DialogHeader as SiteDialogHeader, dialogFullScreenModalClass as siteDialogFullScreenModalClass,
  dialogClassOf as siteDialogClassOf } from '@theme/ui/Dialog';
```

**Requirements:**

- `Dialog` with `kind="full-screen"` renders `DialogHeader`. Its HTML stays the same, apart from the header class.
- The close button keeps `data-dialog-close`, so `dialogControl.ts` on the site still closes the dialog.
- `DialogHeader` looks the same inside `.dialog-full-screen` and inside the editor's side panel (a bottom sheet
  container). Move the header rules that need it from `.dialog-full-screen .dialog-…` to a class on the header.
- The Material look of the full-screen dialog does not change.

**Steps:**

- [ ] Open the editor's parts screen (`#udseende/dele`, `src/ContainmentParts.tsx`, Dialogs › "Full screen"). Use
      "Screenshots without a login". Capture a screenshot at 375px and at 800px.
- [ ] Move the header markup of `Dialog` `kind="full-screen"` into `DialogHeader`. Use it from `Dialog`.
- [ ] Add the `onClose` prop to `DialogHeader` and to `Dialog`.
- [ ] Change the header rules in `theme/styles/ui.css` so that they apply to `DialogHeader` outside
      `.dialog-full-screen`.
- [ ] Add the three exports to `src/themeUi.ts`.
- [ ] Update the header comments of `theme/ui/Dialog.tsx` and `src/themeUi.ts`, and the comment over the changed CSS.
- [ ] Capture the same two screenshots. Compare them with the first ones. Expect no difference.
- [ ] Run the checks in "Global constraints".
- [ ] Commit the three files: "Export the full-screen dialog header as DialogHeader".

### Task `full-screen-block-fields/3`: the block fields in the full-screen dialog

**Files:**

- Modify: `src/ui.tsx` (`BottomSheet`, about line 3215; add `FullScreenTitle` next to `SheetTitle`)
- Modify: `src/BlockDialog.tsx` (the `<BottomSheet>` element and the "fields" step, about lines 270–400)
- Create: `.changeset/full-screen-block-fields.md`

**Interfaces:**

- Consumes: `sheetLook` (task 1); `SiteDialogHeader`, `siteDialogFullScreenModalClass`, `siteDialogClassOf` (task 2).
- Produces:

```ts
// src/ui.tsx
/** The header of a full-screen step: the close button (t.common.close), the title, and the main action as a text button. */
export function FullScreenTitle(props: {
  title: string;
  onClose: () => void;
  done: string;          // t.common.save or t.blocks.insert
  onDone: () => void;
  disabled?: boolean;
}): JSX.Element;
// BottomSheet gets fullScreen?: boolean. With it, the <dialog> has siteDialogFullScreenModalClass and 'editor-sheet',
// and its container is siteDialogClassOf('full-screen'). fullScreen and panel are never both true.
```

**Behaviour of `BlockDialog.tsx`:**

| `sheetLook(open?.step, large)` | Container | Header | Bottom bar |
|---|---|---|---|
| `'sheet'` | `BottomSheet` as today | `SheetTitle` | `SheetActions` as today |
| `'full-screen'` | `BottomSheet` `fullScreen` | `FullScreenTitle` | none |
| `'panel'` and step `'fields'` | `BottomSheet` `panel` | `FullScreenTitle` | none |
| `'panel'` and step `'section'` | `BottomSheet` `panel` as today | `SheetTitle` | `SheetActions` as today |

**Requirements:**

- `FullScreenTitle` uses `SiteDialogHeader` and the editor's text `Button`. Write no other header markup.
- The "fields" step keeps the order of its content: `EditLink`, `Preview`, `FieldList`, `CropField`, `ProblemNote`.
  The content scrolls under the header.
- The X, the Escape key and a tap beside the dialog in the middle call `leave()`. In the panel a tap beside it does
  nothing, as today.
- The main action calls `save(block.type)`. With a problem, `save()` shows it and the wrong field scrolls into view.
- A new block goes from "choose" to "fields" in the same `<dialog>`. Remove `data-tall` and the inline `height`,
  `max-height`, `transform` and `transition` that a drag of `SheetTitle` left on the `<dialog>`.
- The changeset: `@morphemecms/cms` minor, "The fields of a block open full screen on a phone and as a dialog on a
  computer, with Save at the top."

**Steps:**

- [ ] Add `FullScreenTitle` to `src/ui.tsx`.
- [ ] Add `fullScreen` to `BottomSheet` in `src/ui.tsx`.
- [ ] Use `sheetLook` in `src/BlockDialog.tsx` as the table says.
- [ ] Clear the drag state of `SheetTitle` from the `<dialog>` when the step changes to "fields".
- [ ] Update the header comments of `src/ui.tsx` and `src/BlockDialog.tsx`.
- [ ] Add the changeset.
- [ ] Run the checks in "Global constraints".
- [ ] Run `npx morpheme check:screens` after `npm run build`. Expect no failure.
- [ ] Check each row below on a Cards block of the demo. Use "Screenshots without a login". Capture one screenshot
      per row:

| Width | Action | Expected |
|---|---|---|
| 375px | Edit a block | Full screen; X, "Cards", "Save" at the top; no bar at the bottom |
| 375px | Insert a new block | The choice is a sheet from the bottom; the fields then fill the screen; "Insert" at the top |
| 800px | Edit a block | A dialog in the middle, at most 35rem wide, with the same header |
| 800px | Tap beside the dialog with changes | The question about the changes |
| 1280px | Edit a block | The side panel of PR #94, with the new header |
| 1280px | Open section settings | The side panel as today, with "Cancel" and "Save" at the bottom |
| any | Save with an empty required field | The problem shows; the wrong field scrolls into view |
| any | Press Escape without changes | The dialog closes |

- [ ] Commit the three files: "Open block fields in the full-screen dialog".

## Acceptance

- `node --test` over every `*.test.mjs` passes.
- `npx prettier --check .`, `npm run check` and `npm run build` pass.
- The screenshots of the full-screen dialog in the parts screen are the same before and after task 2.
- The hand checks of task 3 pass.
- Then: PR, merge, Release PR, `/release`. The owner checks the editor on staging (`morpheme-staging`).
