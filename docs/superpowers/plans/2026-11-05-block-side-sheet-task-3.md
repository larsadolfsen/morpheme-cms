# Task `block-side-sheet/3`: the side sheet behaviour in the theme

Status: done. Checked against the code on 2026-11-10.

Part of [2026-11-05-block-side-sheet.md](2026-11-05-block-side-sheet.md). Owner decision, 5 November 2026: themes can
open both kinds of side sheet on the site. The editor uses the same code.

**Goal:** The behaviour of both side sheet kinds lives in `theme/ui/sideSheetControl.ts`. A page script opens a side
sheet from a button. `src/BlockDialog.tsx` uses the theme code and keeps no own copy.

**Worker:** Sonnet agent (theme and editor rules).

## Interface

```ts
// theme/ui/sideSheetControl.ts
export type SideSheetOptions = {
  /** Called before a close by the X, Escape or the scrim. false (or a promise of false) keeps the sheet open. */
  beforeClose?: () => boolean | Promise<boolean>;
};
export type SideSheetControls = { open: (opener?: HTMLElement) => void; close: () => Promise<void> };

/** Modal side sheet: the current behaviour, plus `beforeClose`. */
export function sideSheet(sheet: HTMLDialogElement, options?: SideSheetOptions): SideSheetControls;

/** Standard side sheet (the <aside> of SideSheet kind 'standard'). Not modal; the page stays usable. */
export function standardSideSheet(sheet: HTMLElement, options?: SideSheetOptions): SideSheetControls;
```

```tsx
// theme/ui/SideSheet.tsx: two new optional props, on the container (standard kind only)
id?: string;
hidden?: boolean;
```

```html
<!-- On the site: a button opens the side sheet with that id (a <dialog class="side-sheet"> or a standard <aside>) -->
<button data-side-sheet-open="filters">…</button>
```

## Behaviour of `standardSideSheet`

| Event | Result |
|---|---|
| `open(opener)` | Remove `hidden`. Move focus to the first focusable element in the sheet. Keep `opener`. |
| `open()` while open | Do nothing. |
| X (`[data-side-sheet-close]`) | Run `beforeClose`, then `close()` when it allows. |
| Escape with focus in the sheet | The same as the X. Ignore Escape from a `<dialog>` inside the sheet. |
| `close()` | Set `hidden`. Move focus back to `opener` when it is still in the document. |

- `sideSheet()` (modal): the X, Escape and a tap on the scrim run `beforeClose` first. Without `beforeClose`, the
  behaviour does not change.
- `close()` itself never asks. Only the X, Escape and the scrim run `beforeClose`.

## Page script

- Create `theme/ui/sideSheet.script.ts`. `site/blockScripts.ts` finds it by its name (`ui/sideSheet`).
- Use one click listener on `document` (event delegation). Markup that comes later must work too.
- A click on `[data-side-sheet-open]` finds the element with that id.
  - A `<dialog>` with `sideSheetClass`: open it with `sideSheet()`.
  - Else, an element with `data-side-sheet-container`: open it with `standardSideSheet()`, opener = the button.
- Make one control per sheet. Keep it in a `WeakMap`.
- Without a side sheet on the page, the script does nothing.

## Editor

- `src/BlockDialog.tsx`: the modal side sheet gives `beforeClose` to `siteSideSheet()`. Remove the capture-phase
  listeners and `stopImmediatePropagation`.
- The standard side sheet uses `standardSideSheet()` for focus, Escape and the X. Remove the own copies of that code.
- Export `standardSideSheet` from `src/themeUi.ts` as `siteStandardSideSheet`.
- Keep all behaviour of task 2. Its hand-check table must still pass.

## Constraints

- Add no UI text.
- Write no markup twice.
- Update the header comment of each changed file. Update the side sheet comment in `theme/styles/ui.css`.
- Add `.changeset/side-sheet-on-site.md`: `@morphemecms/cms` minor, "Themes can open a side sheet on the site: a button
  with data-side-sheet-open opens the side sheet with that id."
- Do the checks of the plan's "Global constraints".

## Commits

1. "Let themes open side sheets on the site": `theme/ui/sideSheetControl.ts`, `theme/ui/SideSheet.tsx`,
   `theme/ui/sideSheet.script.ts`, `theme/styles/ui.css`, the changeset.
2. "Use the theme's side sheet control in the block sheet": `src/BlockDialog.tsx`, `src/themeUi.ts`, `src/editor.css`
   if needed.

## Hand checks

| Where | Action | Expected |
|---|---|---|
| Built demo site page | Inject a standard `SideSheet` markup with `hidden` and an opener button, then click the button | The sheet shows; focus is in it |
| Same | Press Escape, then click the opener again, then click X | The sheet hides each time; focus goes back to the button |
| Same | Inject a modal side sheet `<dialog>` and an opener; click it; tap the scrim | It opens over the scrim; the tap closes it |
| Editor, 375px, 800px, 1280px | Run the task 2 hand-check rows again | All pass |
