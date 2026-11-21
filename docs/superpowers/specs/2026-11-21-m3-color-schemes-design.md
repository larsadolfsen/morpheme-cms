# Material's colours are M3's colour schemes

Owner, 21 November 2026, after comparing the staging site with a Figma export of Material Theme Builder for the source colour
`#006397`: "The colors are not calculated correctly or not used correctly", then "I find it wrong, since I want to follow md3 color
schemes" and "yes I agree" to this design. Release: **0.19.6** (roadmap). Part of "Material follows M3 exactly" (0.19.5).

## What is wrong today

The Figma export is kept beside this spec (`2026-11-21-m3-color-schemes-figma/`: light, light medium and high contrast, dark, dark
medium contrast). Measured on 21 November 2026:

- **The library is right.** `@material/material-color-utilities` 0.3.0, which the CMS ships, gives every role of all five files to
  the byte with `SchemeTonalSpot(#006397)` at contrast 0, 0.5 and 1.
- **Our generator is not M3.** The colour generator (`lib/dynamic-colors.ts`, `schemeOf`; the editor's *Colors › Generator*,
  `src/Colors.tsx`) builds its own `DynamicScheme` for a *harmony* (analogous, monochromatic, complementary, split-complementary,
  triadic) and for *Custom*:
  - Primary's palette keeps the source colour's full chroma (M3's Tonal Spot fixes it at 36), so the primary role is `#006397` where M3 gives
    `#2C638B`.
  - Secondary and Tertiary are placed round a colour wheel with a chroma of 32 to 48 (M3's Tonal Spot gives Secondary the source hue at
    chroma 16 and Tertiary the hue +60° at chroma 24), so staging's tertiary is orange `#825500` where M3 gives `#67587A`.
  - The error palette is harmonized towards the source colour (M3's error palette is fixed: hue 25, chroma 84).
  - *Custom* makes the chosen Primary, Secondary and Tertiary the roles exactly, with white or black as their on-colours where
    Material's tone does not read (`roleHex`, `onColor`).
- **The neutrals match.** Surfaces, `on-surface`, `on-surface-variant`, `outline` and `outline-variant` on staging equal Figma's in both
  modes.
- **How the roles are used:** no misuse found in the stored values. The coloured sections' own swaps are fixed in 0.19.5 batch 4
  (`2026-11-21-section-colours-m3-roles-design.md` on its branch); the session checks the rest of the theme's use of the roles against
  M3's role pages.

## The design

1. **The generator makes M3's schemes only.** A site's colours come from a source colour, one of M3's scheme variants and a contrast
   level, through the library's own scheme classes, nothing else. The default is Tonal Spot (M3's default) at standard contrast. The
   result equals Material Theme Builder's export for the same source colour, role by role.
2. **The harmonies go** from Material's generator: the harmony choice, its secondary and tertiary dots on the wheel, `withBaseColor`'s
   turning of the source colour and `harmonyChroma`. The wheel may stay as the way to pick the source colour if M3's pages allow it;
   the session decides that with the skill `material-3`.
3. **Custom follows Theme Builder's own custom colours.** Theme Builder lets an owner set the core colours (primary, secondary, tertiary,
   and the neutrals). Each core colour gives its own tonal palette, and the roles take M3's tones from it. Our Custom does the same. A role
   keeps the exact colour chosen only where Theme Builder does (its colour-match option, M3's Fidelity and Content variants). The
   session reads Theme Builder's documentation and checks one export of its own before it builds, and says in the pull request which
   it read. White or black as an on-colour fallback goes.
4. **The error colour is M3's**, not harmonized.
5. **Existing sites keep their colours.** A site never computes its colours: they are stored in `src/data/colors.json`. A file whose
   `dynamic` has a `harmony` keeps its colours until the owner changes them. The editor opens it on Tonal Spot with the same source colour
   and tells the owner the current colours come from the older generator; nothing changes until Save. `dynamicProblems` keeps accepting a
   stored `harmony` (sites skip versions, so old forms stay readable).
6. **Staging and the demo.** The demo already uses Tonal Spot (`#425E92`) and is unchanged. `morpheme-staging` (complementary harmony,
   source `#56A4E0`) gets new colours through a pull request there: Tonal Spot from `#006397`, the owner's Figma file, so staging and
   Figma can be compared directly. The owner confirms the source colour.
7. **Checks.** A unit test compares the generator's roles for `#006397` with the Figma files above (every role, light and dark,
   standard, medium and high contrast; dark high contrast from the library until the owner adds Theme Builder's file). The 0.19.5
   contrast numbers, measured on M3's baseline tokens, are unaffected.
8. **A release note** (skill `release-notes`): the colour generator now gives Material 3's colour schemes, as Material Theme Builder does,
   and a site keeps its colours until the owner changes them.

Out of scope: extended (custom) colours such as Theme Builder's `custom-color1` (roadmap 0.26.1); the sRGB mixes in `completeColors`
that only fill roles missing from a file without `dynamic`.

## Open for the owner

- **Contrast levels for visitors.** M3 treats contrast as the user's setting. The site could store standard, medium and high, and take
  medium or high from the browser's `prefers-contrast: more`, which would help WCAG 2.2 AA too. Today the owner picks one level for every
  visitor. Recommendation: yes, as a second batch of this release.
- **Staging's source colour:** `#006397`, as in the Figma file?

## M3 pages to read

`https://m3.material.io/styles/color/system/how-the-system-works`, `…/styles/color/dynamic/choosing-a-scheme`,
`…/styles/color/roles`, `…/styles/color/system/custom-colors` (or Theme Builder's pages where they live), and the contrast page under
`…/styles/color/`, with Playwright (skill `material-3`).
