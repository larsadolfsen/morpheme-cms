# A new base theme (notes)

Status: **notes, 21 November 2026.** Version 0.22.3 (owner: "add the base theme"); no plan or design yet. This file keeps the owner's
decisions about the base theme until a design is written. Roadmap: `plans/2026-11-14-roadmap-0-18-to-0-24.md`, *0.22 Component steps*.

## The decision

Owner, 21 November 2026: "I want to make another basic theme than md3, but I want to use MD3 as the foundation for it", then "when we have
MD3 perfect, it will become a theme as Venus and instead we will build another base theme where we remove some of the most MD3 looking
things and make sure accessibility is spot on".

1. **Material becomes a theme.** Once Material follows Material 3 exactly, it is a theme like Venus, no longer the base.
2. **A new base theme** takes its place, built on Material 3 as its foundation:
   - it keeps M3's tokens, names and system;
   - it removes some of the parts that look most like M3;
   - its accessibility is exact: WCAG 2.2 AA everywhere.
3. **Material follows M3 100%**, even where M3 falls short of WCAG, and its theme page says where
   (`specs/2026-11-21-theme-accessibility-statement-design.md`). The base theme meets WCAG 2.2 AA.

## Material follows M3 now (0.19.5)

Owner, 21 November 2026: "It does change, because we will no longer follow our FRONTEND deviations, instead we will follow md3".

- 0.19.5 removes every deviation in `docs/material-deviations.md` outside the page and post editor (its bar, overflow menu, text and block menus), so Material takes M3's value, in the editor's other screens too (owner, 21 Nov 2026).
- The ones kept for accessibility go too (owner: "Follow M3 too"): the 60% placeholder (4), the Outlined card's edge (O1) and the edges
  in a coloured section (O2). Material's theme page names them as shortfalls from WCAG 2.2 AA (owner: "state on the theme page what it
  complies with"). `CLAUDE.md`, *Accessibility*.
- **One contrast scan at the end** (owner, 21 November 2026: "a waste of time and would be better invested in doing a final scan after
  all this work is done"). No `check:contrast` run per batch or per feature while Material moves to M3, and no CI job for it. One full
  scan (`--all`) runs when Material's M3 work is done, before the base theme (0.22.3) starts; what fails is either named in
  `theme/accessibility.json` or fixed. Known before it runs (0.19.5 batch 13, 21 November 2026):
  - The scan's focus-ring step (#1104) adds a probe element for every control; in the editor that pins the renderer's CPU and the scan
    hangs. Before the final scan, read the ring colour from `--mo-sys-state-focus-indicator-color` on the host instead (same colour, a
    one-section scan then took 447 s). The editor itself was not slow; only the harness.
  - A real fail the ring check never reached: in the page and post editor, the `mo-editor-inline-list-slot` buttons inside a filled
    button (`mo-editor-inline-list-row`; buttons 1 to 3 of 3, price cards) draw their focus ring in `secondary` on a `secondary`-coloured
    ground, 1.00:1 (#435e91 on #435e91, dark #acc7ff). The page and post editor must meet WCAG 2.2 AA, so this is a bug to fix, not a
    shortfall.
- Coloured sections stay, on M3's nearest roles (the container roles and their on-colours) instead of our swaps and veils, where
  contrast allows (owner: "Keep, nearest M3 roles").

## Open for the design

- **Which looks are removed:** which parts look "most MD3", and what the base draws instead (the `material-3` skill's priority order
  still applies to everything kept).
- **What Material builds on:** M3's tokens directly, or the base theme with the accessibility fixes undone.
- **Other themes and accessibility:** decided. Any theme may fall short if its page says so, measured by the checks
  (`specs/2026-11-21-theme-accessibility-statement-design.md`).
- **Fit with the customizer:** where the layers go (`specs/2026-11-21-customizer-notes.md`, `@layer base, theme, custom`).

No contract raise: additive, optional keys, a theme without the new part falls back (themeProblems does not require it).

The base theme is hard-checked for every WCAG 2.2 AA finding, theme values included (owner, 25 Nov 2026).
