# Colours on a coloured section (spec)

Status: **20 November 2026, for the owner.** Ships in **0.19.5 Material 3 tokens** (`plans/2026-11-20-0-19-5-material-3-tokens.md`), next to the elevation spec
(`specs/2026-11-20-elevation-design.md`). One decision for the owner is open under *Decisions*.

Owner, 20 November 2026: only Material 3's predefined colour roles may be used (ruled in 0.19.2, where the card edge became `outline`
on a surface and the section's on-colour on a coloured section: "use the on-color"). PM 0.19.2 found that the coloured sections break the
rule everywhere and passed it on. Owner: "Yes, write the spec."

## What Material 3 says

The CTO read M3's colour pages and the state pages with Playwright on 20 November 2026 (skill `material-3`): `styles/color/roles`,
`/system/how-the-system-works`, `/choosing-a-scheme`, `/static/baseline`, `/static/custom-brand`, `/dynamic/*`, `/advanced/apply-colors`,
`/advanced/define-new-colors`, `/advanced/adjust-existing-colors`, `foundations/interaction/states/overview`, `/state-layers`,
`/applying-states`, and the specs of buttons, dialogs, navigation drawer, side and bottom sheets.

- **Roles.** "There are 26 standard color roles organized into six groups: primary, secondary, tertiary, error, surface, and outline."
  "Container – Roles used as a fill color for foreground elements like buttons. They should not be used for text or icons." "On – … a
  color for text or icons on top of its paired parent color."
- **Pairs.** "The color system is built on accessible color pairings. These color pairs provide an accessible minimum 3:1 contrast."
  "Any color roles starting with "on-" are guaranteed to have sufficient contrast with the corresponding color role. Other color role
  pairs may not meet the 4.5:1 (small text) and 3:1 (large text) Material contrast requirements." Apply colours "only in the intended
  pairs or layering orders … Combining colors improperly may break contrast".
- **Accent against surface.** "Primary: High-emphasis fills, texts, and icons against surface." Every container is a fill "against
  surface" ("Primary container: Standout fill color against surface, for key components like FAB"). No page places a container on its
  accent colour, and pairing primary with primary container is a Don't: it can "become illegible as the contrast level changes".
- **Inverse.** "Inverse surface: Background fills for elements which contrast against surface." "Inverse on surface: Text and icons
  against inverse surface." "Inverse primary: Actionable elements, such as text buttons, against inverse surface."
- **Outlines.** "Outline: Important boundaries, such as a text field outline." "Outline variant: Decorative elements, such as dividers."
  Both are defined against a surface; nothing covers an outline on a primary fill.
- **Fixed roles.** They keep their tone in light and dark, and M3 warns: "Avoid using them where contrast is necessary."
- **Opacity M3 uses itself.** State layers: "Hover +8% … Focus +10% … Press +10% … Drag +16%" of the content's colour. Disabled content
  0.38 and the disabled container 0.1 (buttons' tokens). The scrim: "Scrims use the scrim color role at an opacity of 32%" (elevation
  page, quoted in the elevation spec).
- **Coloured areas.** M3 has no guidance for a brand-coloured section. The nearest: "Full-screen content-based color moments" and "map
  content-based color roles to contained spaces"; "Use caution when changing color roles for visual effect."

## What Morpheme has today

A section on Primary, Secondary or Tertiary, and a section with an image behind it, re-declare the colour roles of everything inside it
as an "inverted theme":

- `theme/styles/tokens/material/sys.css:77-110` sets `outline`, `outline-variant`, `surface-dim` and all five surface containers to
  `color-mix()` of the section's on-colour with transparency (6 % to 35 %); `primary`, `secondary` and `tertiary` become the on-colour;
  the containers fall back to 22 % mixes.
- `theme/styles/tokens/blocks/sys.css:186-205` does the same for the block aliases (`--mo-sys-block-surface`, `-tint`, `-stripe`, `-line`,
  `-accent-hover` at 7 % to 88 %), for the site's sections and the editor's `[data-section-color]` nodes.
- A section with an image is drawn on `--mo-sys-section-fill` = the text colour, and its image is darkened with a gradient of 85 %,
  55 % and 40 % (`theme/styles/blocks/text-section.css:45-50`).
- `CLAUDE.md` (*Colours in editor-drawn block parts*) still allows "`color-mix` of them", and `check:editor-colors` passes such mixes.

None of these mixes is a predefined role, and the contrast of a part on a 14 % veil of the on-colour is not one of M3's guaranteed pairs:
`check:contrast` measures it after the fact.

Of the other ~210 `color-mix()` calls in the CSS, the state layers (the M3 opacities above) and the elevation shadows (which M3 leaves to
the platform: "Tokens have no shadows or color") are allowed. The check below lists the rest.

## The design

**Inside a coloured section there are only two colours: the section's colour and its on-colour** (owner, 20 November 2026: "we have an
on primary color and the same with the others", then "yes"). On Primary that is `primary` and `on-primary`; on Secondary `secondary`
and `on-secondary`; on Tertiary `tertiary` and `on-tertiary`. M3 guarantees the pair both ways round ("Any color roles starting with
"on-" are guaranteed to have sufficient contrast with the corresponding color role").

1. **What is drawn straight on the section** (text, icons, dividers, outlines, a text or outlined button, an outlined chip, the
   section's own head): the on-colour. Pair: "On primary: Text and icons against primary". Dividers and edges use it too (the owner's
   "use the on-color"), because no outline role is defined against an accent.
2. **Everything filled on the section** (a card, a text field, a search bar, a menu, a list on its own surface, a price card, a filled
   or tonal button, a selected chip, a switch's track, a FAB): the pair reversed, an on-colour fill with the section's colour for its text,
   icons and edges. Tonal controls look like filled ones here, because M3's container roles are defined only "against surface".
3. **Inside a filled thing** nothing else changes colour: a card's text, its icons, its own button and its divider all take the section's
   colour. A filled control inside such a card (its button) takes the pair once more (the section's colour as the fill, the on-colour as
   its label), so it still stands out.

So the swap is role for role, with no mix:

- on the section: `on-surface`, `on-surface-variant`, `outline`, `outline-variant`, `primary`, `secondary`, `tertiary` → the on-colour;
  `on-primary`, `on-secondary`, `on-tertiary`, `surface`, `surface-bright` → the section's colour; every `surface-container*`,
  `surface-dim`, `primary-container`, `secondary-container`, `tertiary-container` → the on-colour, with `on-*-container` → the section's
  colour;
- on a filled thing in it (cards, fields, menus, sheets: their container), the same list once more the other way round, once, beside the
  swap in `theme/styles/tokens/material/sys.css`.

What is lost: the five surface levels inside a coloured section. Every card there has the same fill, which is the on-colour.

**A section with an image** uses the inverse roles, M3's set for an area that contrasts with the page: text and icons
`inverse-on-surface`, actions `inverse-primary` (the open decision says what is behind the text).

**Dark mode** follows by itself: every role is the theme's (on Primary in dark mode the section is light and its cards are dark).

**The editor follows the same rule** (owner, 20 November 2026: "yes"). Its workspace is outside Material 3's components and layout (owner,
13 Nov), but its colours are the theme's roles like the site's, so `check:color-roles` has one scope.

**Themes and apps** keep working: a theme sets roles, not the swap. Venus and the CMS's blocks are checked on every section colour in light
and dark (`check:contrast`, `check:screens`, `check:themes`).

### The check

`npm run check:color-roles` (`scripts/check-color-roles.mjs`), in `check:source`. In `theme/styles/**`, `src/*.css` and `style` objects
in TSX, it fails on:

- a `color-mix()` that mixes a colour role with anything other than transparency at one of M3's opacities (the state-layer tokens
  `--mo-sys-state-*-state-layer-opacity`, disabled 0.38 and 0.1, the scrim's 0.32), named by their token, never a bare percentage;
- a colour role re-declared to anything but another role (`--mo-sys-color-outline: var(--mo-sys-section-on-accent)` passes;
  `color-mix(…)` fails);
- a fixed colour value outside the token reference files.

The elevation shadows in `tokens/ui/ref.css` and `tokens/material/ref.css` are exempt (the platform's, as the elevation spec says). An
allowlist with reasons (`scripts/color-roles.allow.mjs`) holds today's baseline in batch 1 and is empty at release. It replaces the mix
allowance in `check:editor-colors`, and `CLAUDE.md`'s colour rule drops "`color-mix` of them" in the same pull request.

## Decisions

Decided by the owner on 20 November 2026: the two colours inside a coloured section (design, above), and the editor under the same rule.
One is open:

- **A section with an image.** Recommended: text on an image sits on an `inverse-surface` panel at full strength (a pair M3 prints, so
  contrast is guaranteed whatever the image). The alternative keeps today's darkening gradient over the whole image but made of the
  `scrim` role, which needs an owner-approved deviation (`docs/material-deviations.md`), because 32 % scrim does not guarantee text
  contrast on a light image and a stronger gradient is not an M3 value.

## Batches (pull requests into the 0.19.5 feature branch)

1. **The check.** `check:color-roles` with the baseline in its allowlist, in `check:source`; `CLAUDE.md`'s colour rule and
   `check:editor-colors` updated. If it is 0.19.5's first pull request, it sets the version.
2. **The section swap.** The swap of `tokens/material/sys.css` and `tokens/blocks/sys.css` reduced to role for role as designed, the
   reverse on filled parts' containers, the image section on the inverse roles (the open decision). `check:contrast` on every section colour,
   light and dark; `check:screens` and `check:themes` green; Venus checked on the demo. A release note line: coloured sections look a
   little different (skill `release-notes`).
3. **The rest of the allowlist.** Every remaining non-M3 mix in parts and the editor is replaced by a role or an M3 opacity token, until
   the allowlist is empty.

Done when `check:color-roles` fails on a home-made mix, its allowlist is empty, the owner has seen the coloured sections on the demo in
light and dark, and 0.19.5 has run on staging.
