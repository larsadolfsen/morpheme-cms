# `content-visibility: auto` on the editor's page: tried, dropped (15 Nov 2026)

Closed PR #771, branch `perf-content-visibility` (head `0793af7` has the CSS; earlier heads of that branch carried only the changeset). Kept on origin, not for merging.

## What was tried

```css
.editor-text:not(.editor-text-short) .ProseMirror > * {
  content-visibility: auto;
  contain-intrinsic-size: auto 0px auto 120px;
  overflow-clip-margin: 1rem; /* paint containment clipped the block cards' dashed outline, 0.625rem out on each side */
}
```

Guide `defer-rendering-heavy-content` (Modern Web Guidance), item P3 of `docs/superpowers/specs/2026-11-15-modern-web-guidance-audit.md`.

## Measured gain (`scripts/measure-speed.mjs`, editor page `blocks.md` with 36 blocks, phone profile 375 px, CPU 4x, median of 5)

| | Before | With the CSS |
| :--- | ---: | ---: |
| LCP | 3.3 s | about 1.0 s |
| Typing INP | 568 ms | 432 ms |
| Insert-block sheet INP | 744 ms | 528 ms |
| Overflow menu INP | 424 ms | 272 ms |

Typing and the sheet stay over the 200 ms line, so it was a partial fix at best. Focus order (same 24 Tab stops) and find in page were unchanged; `scrollIntoView` to a far part was inconclusive (positions differ because the 120 px estimate differs from real heights).

## Why it was dropped

Core editing wins over speed: caret placement is behaviour. With the CSS, two units of `check:screens` fail:

- `checkTapBelowSection 1280` and `checkTapBelowSection 375` ("tap below a section": typing between two sections or below the last section lands in the wrong place, e.g. `P:etweenB`, `P:fterA`). Reproduced locally; passes with `src/editor.css` reset to `origin/0.18`.
- `checkLabelOnAnyLine 375` ("label on any line": the line lost its text going back from a label). Failed in CI only, not reproduced locally.

Cause (likely): a click in the editor is turned into a caret place from layout; parts that `content-visibility` skips have no layout until drawn.

## If someone tries again

A narrower version (skip only parts far from the caret) is a new idea for the PM to slot, not a fix of this one. Run the two units above first.

## Other attempts in this work

- Skipping the bar's forced layout (`offsetLeft` in the `useLayoutEffect` of `MarkdownEditor.tsx`): no measurable gain, discarded (see `scratch/perf-2026-11-15/README.md`).
- The remaining cost on a long page is native layout work (profile: `Selection.collapse`, `showModal`), not a JavaScript loop, so `scheduler.yield` does not apply; real relief would be windowing the page's blocks (a design change for the PM and the owner).
