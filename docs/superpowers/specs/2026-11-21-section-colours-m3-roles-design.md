# Coloured sections on M3's container roles (design, revision)

Status: **21 November 2026, approved by the CTO; built in batch 4.** Revises `2026-11-20-section-colours-design.md` after the owner's changes of 21 November
("we will no longer follow our FRONTEND deviations, instead we will follow md3"; sections: "Keep, nearest M3 roles"; then "We should comply with the EU Accessibility
Act": a shortfall against WCAG is named in the accessibility statement, `theme/accessibility.json`, not patched with a swap or veil). The two-colour swap of the old
spec (on-colour fills, a reversed rule for filled parts) is **replaced**; its first batch, `check:color-roles`, stays.

## The design

A section on Primary, Secondary or Tertiary (X) is painted with M3's **X-container** and everything in it takes the pairs M3 prints for that container. Inside
the section the page roles are remapped to M3 roles, each to another role, never to a mix:

| Role the parts read | Inside a section on X | M3 says |
| :--- | :--- | :--- |
| `surface` (the section's own fill) | `X-container` | container: "Standout fill color against surface" |
| `on-surface`, `on-surface-variant` (text, secondary text, icons) | `on-X-container` | "On container … text and icons on top of its paired parent color" |
| `outline` | `outline` (unchanged) | "Important boundaries, such as a text field outline" |
| `outline-variant` | `outline-variant` (unchanged) | decorative dividers |
| `primary` etc. (a text button, a link, a filled button's fill) | unchanged | M3 prints no pair for an accent on its container (it warns against primary on primary-container) |
| `surface-container-*` (a card, a field, a menu) | unchanged: the page's own surface roles | a card is a fill against surface; it keeps its page roles and its page text pair |

So a card, a field or a filled button inside a section is the same part as on the page, drawn on a tinted ground. **Nothing is reversed and no list of filled parts is
needed** (the old design's list goes). A section with an image keeps the inverse roles (`inverse-surface`, `inverse-on-surface`, `inverse-primary`), which M3 prints as a
set; that part of the built swap fits and stays.

## Measured, from `docs/m3-tokens/md.sys.color.json` (M3 baseline scheme; the tones are the same in every site's palette)

Contrast of what is drawn on the X-container (primary / secondary / tertiary give the same figures to 0.02):

| Pair | Light | Dark | Needs |
| :--- | ---: | ---: | :--- |
| `on-X-container` text and icons | 7.2 | 7.2 | 4.5 / 3 |
| `on-surface-variant` (secondary text, M3's placeholder colour) | 7.2 | 5.5 | 4.5 |
| `outline` (card edge, outlined button, field edge) | 3.5 | **2.9** | 3 (1.4.11) |
| `outline-variant` (dividers; decorative) | 1.3 | 1.0 | none |
| `X` as text or icon (a text button, a link) | 5.0 | 5.5 | 4.5 / 3 |
| outlined card edge, `outline` on a card's own `surface-container-low` | 4.1 | 5.4 | 3 |
| a card's fill against the section (not a control) | 1.2 | 1.8 | none (1.4.11 asks it of a control's boundary, not of a card) |
| tonal button (`secondary-container`) against the container | 1.0 | 1.0 | 3 (1.4.11) if the fill is the only boundary |

## What falls short, for `theme/accessibility.json`

- **`section-edges`, 1.4.11, dark mode, all three section colours: 2.9:1.** M3's `outline` on its container tone is just below 3. In light mode it passes (3.5).
- **`outlined-card-edge`, 1.4.11:** passes on the section (4.1 and 5.4 measured on the card's own fill; 3.5 and 2.9 where the edge meets the section). Named only for the dark
  edge against the section, with `section-edges`.
- **`placeholder`, 1.4.3:** none. M3's placeholder is `on-surface-variant` at full strength (`md.comp.outlined-text-field.input-text.placeholder.color`), 5.5 to 7.2 here and
  as on the page. The shortfall of the old 60 % deviation (2.9:1, 3.0:1) disappears with the deviation; only the editor's own 60 % text, if it keeps one, would need naming.
- **Tonal button on the container, 1.4.11:** `secondary-container` on a container is 1.0 to 1.2. M3 prints no tonal button on a container; the button keeps its label contrast
  (7.2) but has no 3:1 boundary. Needs the owner's call: name it (`part: tonal-button-edge`) or give it an `outline` edge inside sections (a change to M3's tonal button, so no
  unless the owner says so).
- The text and icon pairs all pass (≥ 5.0); the exact numbers per palette are measured by `check:contrast` on the theme's own parts, never on demo content.

## `check:color-roles`

It stays, reading the theme's CSS only (`theme/styles/**`, `src/*.css`, style objects in TSX), never demo content, with no entry that names demo text:

- the two rules built (a `color-mix()` that is not a state layer, a shadow or the scrim token; a role declared as anything but another variable);
- **new, `section-roles`:** inside a section scope (the selector heads of `tokens/material/sys.css`) a role may be declared only as the role in the table above
  (`surface` → `X-container`, `on-surface` and `on-surface-variant` → `on-X-container`, the inverse set for an image), from a table in the script that is tested against
  `docs/m3-tokens/md.sys.color.json` (every name is an M3 role, every pair an M3 container and its on-colour). Anything else fails.
- the allowlist still holds only mixes outside sections until batch 8.

## What of the built batch no longer fits

Keeps: `check:color-roles` and its tests, the allowlist, the docs of the check, the image section (inverse panel, no gradient), `checkSectionOnImage` measured on the panel, the
list-row colour fix (icon colour declared on the row). **Goes:** the on-colour swap in `tokens/material/sys.css` and `tokens/blocks/sys.css`, the reverse rule for filled parts
and its selector in the head of 34 token files, container-lowest as the section colour, and the release note's wording (a section is tinted, not inverted).

## Parts that need something

- Text, secondary text, icons, placeholder, dividers: nothing, the remap does it.
- Outlined parts (outlined button, outlined card, field edge): nothing built; 2.9 in dark is the named shortfall.
- Tonal button, and anything whose only boundary is a container fill on a container: named (above) unless the owner decides otherwise.
- A theme that sets its own roles keeps working: it sets roles, not the remap.

## Decisions (CTO, 21 November 2026, via the PM)

1. The tonal button is not a 1.4.11 shortfall: a button identified by its text label needs no 3:1 boundary (WCAG Understanding 1.4.11); its label and an icon button's icon are measured against its own fill in every section colour, light and dark. No `tonal-button-edge` part.
2. Filled and text buttons in a section keep `primary` (5.0 and 5.5 measured; M3 prints no pair).
3. An image section keeps the inverse set for every surface and container too (a card there is the panel's colour with an edge), so no part needs a reversed rule.
