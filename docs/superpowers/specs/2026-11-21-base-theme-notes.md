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

## Until the base theme exists

Material is still the base and every site's default, so the WCAG 2.2 AA rule (`CLAUDE.md`, *Accessibility*) and its deviations stay as
they are. 0.19.5 does not change: its `check:m3-tokens` allowlist keeps the WCAG entries. Material drops them only when the base theme
ships with them.

## Open for the design

- **Which looks are removed:** which parts look "most MD3", and what the base draws instead (the `material-3` skill's priority order
  still applies to everything kept).
- **What Material builds on:** M3's tokens directly, or the base theme with the accessibility fixes undone.
- **Themes and accessibility:** the CTO advised that every theme keeps the base's accessibility, because the European Accessibility Act
  has applied to most businesses selling online in the EU since June 2025. The owner has not decided whether Material and other themes
  may fall short of it. If they may, the store and the editor say so before a site owner picks one.
- **The rule's wording:** `CLAUDE.md` says "the sites the CMS builds" meet AA, which would need to name the base theme instead.
- **Fit with the customizer:** where the layers go (`specs/2026-11-21-customizer-notes.md`, `@layer base, theme, custom`).
