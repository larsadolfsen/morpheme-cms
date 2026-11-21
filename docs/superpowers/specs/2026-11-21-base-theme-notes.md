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
3. **Material follows M3 except where WCAG needs otherwise** (below). Both themes meet WCAG 2.2 AA.

## Material follows M3 now (0.19.5)

Owner, 21 November 2026: "It does change, because we will no longer follow our FRONTEND deviations, instead we will follow md3".

- 0.19.5 removes every deviation in `docs/material-deviations.md` outside the editor's own workspace, so Material takes M3's value.
- The entries WCAG needs stay (owner: "We should comply with EU Accessibility Act", which reversed "Follow M3 too"): placeholders, slot
  icons and control edges keep their contrast (4), the Outlined card's edge is `outline` (O1), edges in a coloured section are its
  on-colour (O2). `CLAUDE.md`, *Accessibility*.
- Coloured sections stay, on M3's nearest roles (the container roles and their on-colours) instead of our swaps and veils, where
  contrast allows (owner: "Keep, nearest M3 roles").

## Open for the design

- **Which looks are removed:** which parts look "most MD3", and what the base draws instead (the `material-3` skill's priority order
  still applies to everything kept).
- **What Material builds on:** M3's tokens directly, or the base theme with the accessibility fixes undone.
- **Other themes and accessibility:** Material and the base theme meet WCAG (owner: "We should comply with EU Accessibility Act").
  Whether a store theme may fall short, and if so whether the store and the editor say so before a site owner picks it, is open.
- **Fit with the customizer:** where the layers go (`specs/2026-11-21-customizer-notes.md`, `@layer base, theme, custom`).
