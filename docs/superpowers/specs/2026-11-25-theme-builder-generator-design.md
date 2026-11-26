# The colour generator is Material Theme Builder

CTO, 25 Nov 2026. Line: **0.19.8** (owner, 25 Nov 2026). Status: ready to build. Replaces the screen design of
`2026-11-21-m3-color-schemes-design.md` (its colour maths and contrast levels stay).

## Why

Owner, 25 Nov 2026, on the 0.19.6 generator (a colour wheel, *Source color / Secondary / Tertiary* swatches and ten scheme
chips: Tonal spot, Neutral, Vibrant, Expressive, Fidelity, Content, Monochrome, Rainbow, Fruit salad, Custom): "I asked you to
build the generator as google does, and instead you just added one new thing", pointing at
`https://github.com/material-foundation/material-theme-builder`.

The 0.19.6 spec fixed the maths but let the old screen stay ("the wheel may stay", a variant choice). That was the CTO's mistake.
Theme Builder has no wheel and no variant choice. The generator becomes Theme Builder's *Add Theme Colors* step, part for part.

## What Theme Builder is (read on 25 Nov 2026)

Read with Playwright from `https://material-foundation.github.io/material-theme-builder/` (a Flutter app, so read from screenshots; the session that builds task 11 takes its own in *Before building* and attaches them to its pull request) and the
repository's `README.md`. The building session takes its own screenshots and puts them in the pull request.

**Left column, top to bottom:**

1. Intro: "Build a Material color scheme to map dynamic color, use as fallback colors, or implement a branded theme." and "The color
   library automatically handles critical adjustments to the chroma and tone of inputs to create key colors."
2. **Source image.** "Derived from a user's wallpaper selection to create 5 key colors through dynamic color." A row of images
   and an *add your own* tile.
3. **Source color** row: a round swatch, the title *Source color*, the subtitle *Seed color for dynamic*, and a *Shuffle* icon
   button at the end.
4. **Core colors.** "Override or set key colors that will be used to generate tonal palettes and schemes."
   - **Color match**, a checkbox: "Stay true to my color inputs." (README: "Color Match will use the color inputs in place of
     Container roles to provide color fidelity with your brand colors.")
   - Six rows, each a round swatch and a title: **Primary** ("Acts as custom source color"), **Secondary**, **Tertiary**,
     **Error**, **Neutral** ("Used for background and surfaces"), **Neutral Variant** ("Used for medium emphasis and variants").
     README: Primary overrides the source colour; the others are optional overrides, each giving its own tonal palette.
5. **Extended colors**, with *Add a color* (custom colours with their own palette, optionally harmonized).

**The colour picker** (any swatch): a dialog, *HCT Color Picker*, with *Hex Color* (text field), *Hue*, *Chroma*, *Tone* (each a
number field over a slider whose track shows the range), and *Cancel* / *Apply*.

**Right column:** a three-button control for the contrast level (standard, medium, high), a dark-mode icon button in the top bar, a
live preview, then the **Light Scheme** and **Dark Scheme** grids (every role as a tile named by role, with its on-colour), then the
**tonal palettes** (Primary, Secondary, Tertiary, Neutral, Neutral Variant, Error; tones 100, 99, 98, 95, 90 … 10, 5, 0).

**Export** (side sheet *material-theme*): the core colours and an *Export* menu.

## The design

1. **One screen, Theme Builder's order:** source image, source colour (with *Shuffle*), core colours (Color match, then the six rows),
   then the result: contrast control, light and dark scheme grids, tonal palettes. The wheel and the ten scheme chips go.
2. **The maths is Theme Builder's.** With only a source colour: `SchemeTonalSpot` (as today, equal to the Figma export). A core colour
   set by the owner replaces that role's tonal palette with the palette of its own hue and chroma, as Theme Builder does. *Color match*
   on: the core colours are used as the container roles. The building session exports Theme Builder's JSON for at least four inputs
   (source only; source plus secondary and tertiary; all six; each with Color match on) and the unit test compares every role, light
   and dark, at all three contrast levels.
3. **The swatches open the HCT Color Picker** as Theme Builder draws it, built from the theme's `Dialog`, `TextField` and `Slider`.
   A missing slider look (a track that shows the hue, chroma or tone range) is a theme change with the owner's yes (skill `developer`).
4. **Source image** uses the site's own images (the media library) and an upload, through the library's `QuantizerCelebi` and `Score`,
   as the current *From an image* does.
5. **Storage** in `colors.json`'s `dynamic`: `source`, the core colours set (`primary`, `secondary`, `tertiary`, `error`, `neutral`,
   `neutralVariant`, each optional), `colorMatch`, and the three contrast levels' roles as today. An older file (`harmony`, `variant`)
   keeps its colours until the owner saves (the rule of 0.19.6 stays).
6. **The site's surfaces in the editor** follow the result at once, as today.
7. **Components:** `ListItem` (the source and core colour rows), `Checkbox`, `IconButton`, `SegmentedButton` (contrast), `Dialog`,
   `TextField`, `Slider`, `Card` (the scheme grids). Every other part by M3's real pages (skill `material-3`).
8. **Release note** in both languages: the colour generator now works as Material Theme Builder.

## Before building

The building session opens Theme Builder with Playwright (the environment now allows `material-foundation.github.io` and
`www.gstatic.com`), reads every part above again, and exports the four reference files. If anything differs from this spec, the tool wins.

## Decided

1. **Release: 0.19.8** (owner, 25 Nov 2026). It lands on the *Color* page that C20 moves to `#style/color`, so C20 goes first, or
   the two are one batch.
2. **The *Light mode* and *Dark mode* tabs become Theme Builder's read-only Light Scheme and Dark Scheme grids.** Theme Builder lets
   no one type a role's value, and M3 wins (owner, 21 Nov 2026). A stored file with hand-typed roles keeps them until the owner saves.
3. **Extended colors (*Add a color*) stay in 0.26.1** (custom colours, roadmap), so 0.19.8 is the generator only. The screen leaves
   no placeholder for it.
