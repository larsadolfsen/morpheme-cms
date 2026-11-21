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

- 0.19.5 removes every deviation in `docs/material-deviations.md` outside the editor's own workspace, so Material takes M3's value.
- The ones kept for accessibility go too (owner: "Follow M3 too"): the 60% placeholder (4), the Outlined card's edge (O1) and the edges
  in a coloured section (O2). Material's theme page names them as shortfalls from WCAG 2.2 AA (owner: "state on the theme page what it
  complies with"). `CLAUDE.md`, *Accessibility*.
- **One contrast scan at the end** (owner, 21 November 2026: "a waste of time and would be better invested in doing a final scan after
  all this work is done"). No `check:contrast` run per batch or per feature while Material moves to M3, and no CI job for it. One full
  scan (`--all`) runs when Material's M3 work is done, before the base theme (0.22.3) starts; what fails is either named in
  `theme/accessibility.json` or fixed.
- Coloured sections stay, on M3's nearest roles (the container roles and their on-colours) instead of our swaps and veils, where
  contrast allows (owner: "Keep, nearest M3 roles").

## Open for the design

- **Which looks are removed:** which parts look "most MD3", and what the base draws instead (the `material-3` skill's priority order
  still applies to everything kept).
- **What Material builds on:** M3's tokens directly, or the base theme with the accessibility fixes undone.
- **Other themes and accessibility:** decided. Any theme may fall short if its page says so, measured by the checks
  (`specs/2026-11-21-theme-accessibility-statement-design.md`).
- **Fit with the customizer:** where the layers go (`specs/2026-11-21-customizer-notes.md`, `@layer base, theme, custom`).
