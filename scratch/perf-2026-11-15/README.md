# Scratch from the speed work (15 Nov 2026), kept so nothing is lost. Not for merging.

- `prof.mjs`: CDP CPU profile of the many-blocks editor page on the phone profile (`node prof.mjs type|sheet|load`, run in `.morpheme/demo/site`).
- `a11y.mjs`: focus order, `scrollIntoView` and find-in-page with and without the `content-visibility` CSS of #771 (`node a11y.mjs on|off`).
- `shot.mjs`: screenshots of the many-blocks page (phone and computer, three scroll offsets), for before/after comparison.
- `cv.css`, `cv2.css`: the two `content-visibility` variants tried with `measure-speed.mjs --css` (all top-level parts, or from part 8).

## Dropped experiment: skip the bar's forced layout (no gain)

In `src/MarkdownEditor.tsx` the bar's `useLayoutEffect` reads `main.offsetLeft` on every render, which forces a layout of the whole page.
Tried: keep `mainLeft` from the previous run when `contextKey` and a signature `[barWidth, contextIds, fixedIds, spareIds]` are unchanged, and skip the slide
(`kind` stays `'none'`). Measured on the many-blocks page, phone profile, median of 5, before to after: typing INP 576 to 608 ms, sheet 720 to 680 ms,
menu 424 to 440 ms. No gain (the layout only happens later), so it was discarded.
