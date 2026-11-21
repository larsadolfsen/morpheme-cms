# A new base theme (notes)

Status: **notes, 21 November 2026.** No version, plan or design yet. This file keeps the owner's decisions about the base theme until a
design is written. Roadmap: `plans/2026-11-14-roadmap-0-18-to-0-24.md`, *Ideas without a version*.

## The decision

Owner, 21 November 2026: "I want to make another basic theme than md3, but I want to use MD3 as the foundation for it", then "when we have
MD3 perfect, it will become a theme as Venus and instead we will build another base theme where we remove some of the most MD3 looking
things and make sure accessibility is spot on".

1. **Material becomes a theme.** Once Material follows Material 3 exactly, it is a theme like Venus, no longer the base.
2. **A new base theme** takes its place, built on Material 3 as its foundation:
   - it keeps M3's tokens, names and system;
   - it removes some of the parts that look most like M3;
   - its accessibility is exact: WCAG 2.2 AA everywhere.
3. **Material follows M3 100%**, even where M3 falls short of WCAG. Its accessibility deviations go to the base theme instead
   (`docs/material-deviations.md`, the contrast and target entries).

## Material follows M3 now (0.19.5)

Owner, 21 November 2026: "It does change, because we will no longer follow our FRONTEND deviations, instead we will follow md3".

- 0.19.5 removes every deviation in `docs/material-deviations.md` outside the editor's own workspace, so Material takes M3's value.
- The two kept for accessibility go too: the Outlined card's edge and the 60% placeholder (owner: "Follow M3 too"). Sites on Material
  lose them until the base theme ships and takes them over. `CLAUDE.md`, *Accessibility*, names this exception.
- Coloured sections stay, on M3's nearest roles (the container roles and their on-colours) instead of our swaps and veils, where
  contrast allows (owner: "Keep, nearest M3 roles").

## Open for the design

- **Which looks are removed:** which parts look "most MD3", and what the base draws instead (the `material-3` skill's priority order
  still applies to everything kept).
- **What Material builds on:** M3's tokens directly, or the base theme with the accessibility fixes undone.
- **Themes and accessibility:** the CTO advised that every theme keeps the base's accessibility, because the European Accessibility Act
  has applied to most businesses selling online in the EU since June 2025. The owner has not decided whether Material and other themes
  may fall short of it. If they may, the store and the editor say so before a site owner picks one.
- **Fit with the customizer:** where the layers go (`specs/2026-11-21-customizer-notes.md`, `@layer base, theme, custom`).
