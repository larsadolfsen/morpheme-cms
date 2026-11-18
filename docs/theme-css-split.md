# How the theme's CSS is split

The theme's rules were three large files (`ui.css`, `blocks.css`, `global.css`; `blocks.css` is now gone). They are now one file for each part, so a part's rules are found by its name and a change to one part cannot reorder another. The plan and the inventory are in `docs/superpowers/plans/2026-11-16-css-split.md`.

## Where things are

| Folder or file | What it holds |
| :--- | :--- |
| `theme/styles/base.css` | The entry. Tailwind, the layer order, `ui.css`, the cards, type, the blocks, the lists, the site shell, the token files, and the `@source` lines. |
| `theme/styles/ui.css` | **Imports only**: the ui token files, then one `@import` for each UI part, in the order the rules had in the old file. |
| `theme/styles/ui/<part>.css` | One UI part each (`buttons.css`, `menus.css`, `list.css` …), imported by `ui.css`. |
| `theme/styles/blocks/<family>.css` | One block family each (`panel.css`, `testimonial.css` …), imported by `base.css` in the order their rules had in the old `blocks.css` (which is gone). |
| `theme/styles/material/<part>.css` | The Material look of the standard theme, imported by `global.css`, never by `base.css`: a theme that imports only `base.css` must not get Material's values. |
| `theme/styles/files.mjs` | The one list of these files (`UI_PART_FILES`, `OTHER_BASE_FILES`, `MATERIAL_FILES`). Every check that reads CSS as text takes its file list from here. |

`files.test.mjs` fails when a file is imported and not listed, listed and not imported, or when `ui.css` holds a rule.

## Add or move a part

1. Move whole rules, with their comment, **unchanged and in their old order**, into a new file in the same `@layer`. Put a header comment on the file.
2. Add one line to `files.mjs` and one `@import` where the rules were (`ui.css` for a UI part, `base.css` for a block).
3. Fix any check that names the old file (`scripts/check-density.mjs`, `scripts/check-css-values.allow.mjs`, `scripts/check-colors.allow.mjs`, comments in `theme/ui/*.tsx`), and add an empty changeset.
4. Prove the move is pure (below).

## Lessons

- **Order decides ties.** Inside one layer, equal-specificity rules are won by the one that comes last. A part moved into a file that is imported later flips the winner against every rule that stayed behind. Keep the parts in the order their rules had.
- **An element with two part classes** (`checkbox list-item-select-box`, `chip-set search-view-filters`, `fab fab-menu-button`, `radio-group choice-group-list`) is where a flip shows. Find these before moving.
- **A rule moves whole or not at all.** A selector list that names two parts, or one `@media` block that holds rules of two parts, is split by keeping each rule whole, in order, never by editing it.
- **A part with two runs far apart** goes in the position of its first run. Check the later run against what it now passes.
- **Layers beat order.** `@layer fallback` wins over `components` whatever the order, and Tailwind utilities win by layer. A rule never changes layer in a move.
- **Readers of the CSS as text** (theme coverage, density, elevation, the colour and corner checks) know files by name. Use `files.mjs`.

## The proof that a move is pure

1. Build the demo (`npm run build`) on the base and on the branch and compare the built CSS: the multiset of rules must be equal.
2. For the order, list the same-property, equal-specificity pairs of rules whose order changed. Each must be two selectors that never share an element, or the move is not pure.
3. Compare the computed style of every element of every page at 375, 800 and 1400 px, in light and dark, and of synthetic elements for each class combination a part meets. Make the check able to fail: flip an order on purpose once and see it flag.
4. Run `npm run check`.
