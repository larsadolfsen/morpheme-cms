# Material 3 conformance audit

Date: 2026-11-13. Audit only: no product code changed. Data tables are checked against Material 2, everything else against Material 3.

## How it was measured

- The demo was built (`npm run build`) and opened in Chromium. For the editor, 27 screens were opened at 375px and 1280px, light and dark: **20,560 elements** read with `getComputedStyle` (size, padding, corner, type, shadow, transition, animation, tap-target size). The parts screen (`#developer/parts`, 79 parts) was read the same way.
- The theme's tokens were resolved in the browser (728 custom properties, light and dark) and compared with the numbers in Google's `@material/web` 2.4.1 (`tokens/versions/v0_192/_md-comp-*.scss`) and, for the data table, `@material/data-table` 14.0.0 (`_data-table-theme.scss`, Material 2).
- The source CSS and `src/i18n/en-US/` (2,668 strings) were scanned for motion, spacing, state layers, disabled opacities and wording.
- `npm run check:contrast` was run (result below).
- **Limit:** `m3.material.io` and `m2.material.io` are drawn by script and could not be read here, and `@material/web` only has the baseline (non-Expressive) tokens. Where the theme follows M3 Expressive (button groups, split button, FAB menu, flexible bars, slider sizes, spring motion) there is no number to compare, so those rows say so. The Expressive springs in `lib/motion.ts` were checked against the published token values (fast 800/0.6, default 380/0.8, slow 200/0.8; standard 1400, 700, 300 at 0.9; effects 3800, 1600, 800 at 1) and match.

## 1. Does it follow Material 3?

Mostly yes. The tokens are right: the type scale (all 15 roles: size, line height, weight, tracking), the corner scale, the 8% and 10% state layers (85 of the 90 hover and press layers), the five shadow levels, the springs, and the sizes of switch (52×32), checkbox (18), radio (20), chip (32, corner 8), card (corner 12), text field (56, corner 4) and FAB (56, corner 16) all equal Material's. **No live element has a corner outside the scale** (the only odd one is the 2px checkbox, which is Material's own). The Table block matches Material 2's numbers (header row 56, row 52, cell padding 16, body text 14/20, header 14/500). The theme has every current M3 component, Expressive ones included. Spelling is clean.

What differs: **31 findings** (23 in the parts, 8 in the words). 25 are small, 4 medium and 2 large (the text styles and the passive wording are many small edits). **3 are already recorded** in `docs/material-deviations.md` (corners of dialog and menu, the icon button, the colours) and 2 more partly; **1 entry there is out of date** (colour sweep 12, shadows). The biggest groups are: text built from loose Tailwind size and weight classes instead of the type roles (about 130 places), icons 20px where Material says 24px, disabled parts faded at 35 to 60% instead of 38%, a few hand-written animation timings, tap targets under 48px, and a handful of English texts.

## 2. Every difference

Fix size: small is one or a few lines, medium is one part or one file, large is many files. "Recorded" means `docs/material-deviations.md` already lists it.

### Size and shape

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 1 | List rows, leading and trailing icons (`--list-item-icon-size`, `ui.css`); 46 + 62 measured | 20px | 24px (`_md-comp-list.scss`: leading-icon-size, trailing-icon-size 24px) | medium | no |
| 2 | Text field icons (`.text-field-container`); 22 measured | 20px | 24px (`_md-comp-outlined-text-field.scss`, `-filled-`: leading and trailing icon size 24px) | small | no |
| 3 | List row corner at rest (`--list-item-radius`) | 4px | 0 (`list-item-container-shape: corner-none`) | small | no (the 56/72/88 heights are; they equal Material's) |
| 4 | Menu item height (`--menu-item-height`) | 44px | Material's menu item is 48px or more (material-web one-line item is 56px). Check the Expressive menu spec before changing | small | no |
| 5 | Navigation bar 64 high, indicator 56 wide; rail 96 wide; slider track 16 with 4×44 handle; buttons XS to XL sizes | Expressive sizes | Baseline: bar 80, indicator 64, rail 80, slider track 4 with 20 handle (`_md-comp-navigation-*.scss`, `_md-comp-slider.scss`). No Expressive numbers readable here | none | no (should be) |
| 6 | Dialog corner 32px (`--dialog-radius`); menu corner 16px | Expressive | Baseline 28 and 4 (`_md-comp-dialog.scss`, `_md-comp-menu.scss`) | none | yes (CSS sweep 1, 2) |
| 7 | Icon button | 48px box | 40px with 48px target (`_md-comp-icon-button.scss`) | none | yes (CSS sweep 4) |

### Touch targets (48px)

| # | Where | What we have | What Material says | Fix | Recorded |
| - | ----- | ------------ | ------------------ | --- | -------- |
| 8 | Footer links (Support, System status, Report security issues, Privacy policy, Licenses), every screen on a phone (`min-h-6`) | 24px high | 48px target (m3.material.io/foundations/designing/structure; WCAG 2.2 AA only needs 24) | small | no |
| 9 | Parts screen and field editors: 23 standard icon buttons 40×40; chip remove 28×28; inline chip 20 high; section list rows 36 high | below 48 | 48px target | medium | no |

### Type (all 15 role tokens are exact; the use of them is not)

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 10 | 61 `text-sm`, 6 `text-xs`, 5 `text-base`, 63 `font-medium`, 6 `font-semibold` in `src/` and `theme/` | A loose size with a loose weight | The role classes (`text-body-medium`, `text-label-large`, …) set size, line height, weight and tracking together (`_md-sys-typescale.scss`). Only 12 role classes are used | large | partly (CSS sweep 9) |
| 11 | Body text set to 14px inherits the page's 0.5px tracking; 326 elements measured (and 100 at 14/500 with 0.5) | 14/20/400 with 0.5px | body-medium is 14/20/400 with 0.25px; label-large 14/20/500 with 0.1px | small | no |
| 12 | Weight 600 on headings and labels (about 150 elements: "Main menu" 22/28/600, "Preview", list titles) | 600 | Material uses 400, 500 and 700 only | small | no |
| 13 | Small buttons (152 measured) | line height 14px | label-large line height 20px (`_md-comp-filled-button.scss`) | small | no |
| 14 | Text field label (116 measured at 12/15, 24 at 16/20) | line height 15 and 20 | 12/16 (body-small) when floated, 16/24 (body-large) at rest | small | no |
| 15 | Drawer labels 700 weight | `label-large-prominent` | Expressive "prominent" weight | none | no |

### Spacing (4dp grid)

| # | Where | What we have | What Material says | Fix | Recorded |
| - | ----- | ------------ | ------------------ | --- | -------- |
| 16 | 600 padding, margin and gap values in the CSS: 12 are off the 4dp grid and off its 2dp half-step: `0.15rem`, `0.35rem`, `0.4rem`, `0.6rem`, `1.1rem` (`ui.css` 374, 457, 1048, 1372; `blocks.css` 1075, 1337, 1373; `editor.css` 1264); also `py-[1.125rem]`, `size-[28px]`, `w-[20.5rem]` ×6 | 2.4 to 17.6px | 4dp grid, 2dp half-steps for small parts (m3.material.io/foundations/layout/understanding-layout/spacing) | small | partly (CSS sweep 8: tokens only) |

### Colour and state layers

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 17 | Disabled parts: button 60%, icon button 35%, segmented 45%, date-picker day 35%, dropdown icon 60% (`opacity` in `ui.css`) | 35 to 60% | Content 38%, container 12% (`disabled-label-text-opacity 0.38`, `disabled-container-opacity 0.12`) | small | no (the deviation list only covers placeholders) |
| 18 | Search bar hover (`--search-bar-hover`) | 4% | 8% (`hover-state-layer-opacity`, `_md-sys-state.scss`) | small | no |
| 19 | State layers elsewhere: 70 uses of 8%, 15 of 10%, 4 of 12% | equal Material | 8/10/10/16% | none | n/a |
| 20 | Status badge colours, PageSpeed colours, Google preview, colour picker, video still | fixed colours | custom colours | none | yes (colour sweep 1 to 9) |
| 21 | Contrast | see below | WCAG AA | n/a | n/a |

### Elevation

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 22 | Material theme, levels 1 to 5 (`global.css` 29 to 38) | equal Material's two-layer shadows (`elevation/internal/_elevation.scss`: 0 1px 2px + 0 1px 3px 1px at level 1 … 0 4px 4px + 0 8px 12px 6px at level 5) | same | none | entry colour sweep 12 says "our own, softer": **out of date** |
| 23 | The fallback shadows in `ui.css` 106 to 116, used by every other theme | key shadow 6 to 9%, large negative spread, "softer" | Level 1 to 5 as in 22 | small | no (that is the real subject of colour sweep 12) |
| 24 | Parts at rest: elevated card, menu, snackbar, dialog, search bar have no shadow in the Material theme (`--mo-elevation-N-rest-shadow` all 0; only the FAB has one) | colour only | Elevated card level 1, menu 2, snackbar 3, dialog 3 (`_md-comp-*-card/menu/snackbar/dialog.scss`: container-elevation) | medium | no (the comment in `global.css` says so, the doc does not) |

### Motion (owner rule: springs only)

| # | Where | What we have | What the rule says | Fix | Recorded |
| - | ----- | ------------ | ------------------ | --- | -------- |
| 25 | `blocks.css` 81 to 86: `--motion-*` fallbacks | 230, 320, 490, 150, 240, 330ms with `cubic-bezier(0.2,0,0,1)` | Springs. The head's CSS replaces them, so they only show when it is missing; but they differ from the spring values (360, 440, 600) | small | no |
| 26 | `editor.css` 404 and 408 (wrong-field flash) | `0.8s ease-in-out`, 3 times | a spring token | small | no |
| 27 | `ui.tsx` 2709 (score ring) | `duration-[1200ms] ease-out` | a spring token | small | no |
| 28 | `lib/snackbar.ts` 126 and 129 | `ease-out` with a computed duration | `motionTiming` | small | no |
| 29 | `ui.css` 2282 (card shadow) | `0.3s var(--block-ease-quick)` | a spring token | small | no |
| 30 | `ui.css` 4354 to 4363 (stagger) and 7232 to 7256 (ripple 450, 375, 105ms with `cubic-bezier`) | hand-written | springs, or the ripple's own timing as a recorded exception | small | no |

Progress and loading indicators loop by design and are exempt. Everything else measured on the live screens (2,256 + 1,278 + 1,016 + 892 + 606 transitions) already uses the spring variables.

### Data tables (Material 2)

The Table block (`.block-table-grid`) matches Material 2 on the main numbers: header row 56, row 52, cell padding 16, body 14/20 with 0.25, header 14/500 with 0.1, hover state layer. It differs here:

| # | Where | What we have | What Material 2 says (source) | Fix | Recorded |
| - | ----- | ------------ | ----------------------------- | --- | -------- |
| 31a | Corner of the table box | 12px (`--card-radius`) | medium shape, 4dp in Material 2 (`$shape-radius`) | small | no |
| 31b | Header row | filled with a tint (`--block-tint`) | same fill as the table, a 1px divider under it (`$header-row-fill-color: surface`, `$divider-color`: on-surface 12%) | small | no |
| 31c | Row hover | 8% | 4% of on-surface (`$row-hover-fill-color`) | small | no |

(Counted as one finding: 31.)

### Parts

The theme has every current M3 component: buttons (all kinds and five sizes), icon button, FAB and extended FAB, FAB menu, chips, segmented button, button group, split button, switch, checkbox, radio, text field, select, slider, card, list, dialog (basic and full screen), bottom and side sheet, menu, tabs (primary and secondary), top app bar (all kinds), navigation bar, rail and drawer, snackbar, progress and loading indicator, badge, tooltip (plain and rich), toolbar, divider, search, date and time pickers, carousel. Not in the theme and not needed: the bottom app bar (replaced by the toolbar in Expressive) and the banner (dropped from M3). Drawn by the editor only: colour wheel and swatches, crop, score ring, the section list, share preview. They use the theme's tokens.

### Words (`src/i18n/en-US/`, 2,668 strings)

| # | Where | Offender | Better (M3 word choice) | Fix |
| - | ----- | -------- | ----------------------- | --- |
| W1 | `forms.versions.scheduledCancelled` | "Schedule for X cancelled" | American spelling, as the rest: "canceled" | small |
| W2 | 25 strings with a straight `'` (17 in `parts.ts`, 3 in `colors.ts`, 2 in `library.ts`, 1 each in `blocks.ts`, `forms.ts`, `media.ts`); 166 use `’` | mixed apostrophes | one apostrophe, `’` | small |
| W3 | `apps.deactivated` "Deactivated"; `apps.oneOfType` "Only one X app can be active. Activating X deactivates X…" | active, activate, deactivate | Material's terms: Enabled/Disabled, On/Off ("Only one X app can be on. Turning on X turns off X.") | small |
| W4 | `library.status.unlisted`, `library.statusShown.unlisted`: "Hidden" as a page status | CLAUDE.md reserves "Hidden" for the SEO setting; statuses are Draft and Published | decide the term for a page that is only unlisted | small |
| W5 | `app.unsavedSheet` "You have changes that aren’t saved. Do you want to keep them?" | "Do you want…" | ask plainly: "Keep your unsaved changes?" | small |
| W6 | 124 passive strings, for example `advanced.bucket.no-bucket` ("Can be turned on once the storage X is made under R2 at Cloudflare and kept in the X"), `apps.stuck`, `app.imageNotLoaded` ("couldn’t be loaded"), `blockSettings.stuck` | passive voice, fragments | active: "Cloudflare doesn’t have storage X yet. Create it under R2 to turn this on." | large (many small edits) |
| W7 | 103 of 108 hint strings end with a full stop although they are fragments ("Numbered steps.", "A highlighted message."); 4 do not | inconsistent | no full stop on a fragment, a full stop on a sentence | medium |
| W8 | `parts.ts` "pop-up" ×3, "dropdown" ×1, "submenu" ×1 | | Material's terms: dialog, menu | small |

Not offenders: no "please", "oops", "click", exclamation marks, "Yes/No" buttons (the Yes/No are the cookie consents), Title Case labels, Danish text, or misspellings. "OK" on the pickers is Material's own label.

### Contrast

`npm run check:contrast` (Saturn, the Material theme): **6,378 pairs checked, 0 fail, 0 need a manual look.** Contrast is not a finding.

## 3. Differences that look deliberate: lines for `docs/material-deviations.md`

Add these (after the owner agrees), and correct entry 12 of the colour sweep.

1. **Expressive sizes** (rows 5): navigation bar 64 with a 56 indicator, rail 96, slider track 16 with a 4×44 handle, the five button sizes, FAB medium 20. The M3 Expressive set; the baseline numbers are in `@material/web`. Owner decision needed on the date.
2. **List row corner 4px at rest** (row 3): Expressive segmented lists round the rows only when pointed at or selected. We keep 4px at rest and 12px in those states.
3. **No shadow at rest in the Material theme** (row 24): M3 draws level 1 to 3 at rest on elevated cards, menus, snackbars and dialogs; we show those by colour only, and use a shadow for the FAB, for lifting and for dragging. Why: flat, quiet pages and the section-colour rule (deviation 2).
4. **Elevation values**: replace colour sweep 12 with: "The Material theme's shadows are Material's (checked 2026-11-13). The fallback shadows in `ui.css` are softer; used by themes that do not set their own."
5. **Table block**: if the owner prefers its current look over Material 2 (rows 31a to 31c: 12px corner, tinted header, 8% hover), record it: "The Table block follows Material 2's data table for size and type, and our card look for corner, header and hover, so it sits with the cards."
6. **Footer links** are 24px high on purpose only if the owner says so (WCAG 2.2 AA allows it); otherwise fix (row 8).

## 4. Proposed order and one check

Order:

1. Words W1, W2, W3, W5, W8 and rows 17, 18 (disabled and hover values): small, no layout change.
2. Rows 25 to 30 (motion): small; makes "springs only" true everywhere.
3. Rows 1, 2, 8, 9 (icon sizes and tap targets): changes layout slightly, needs the screens checked.
4. Rows 10 to 14 (type): the large one; move loose Tailwind sizes to the role classes by screen.
5. Rows 16, 23, 24, 31 and W6, W7: decide first (questions below), then do.

One check: extend **`check:css-values`** (`scripts/check-css-values.mjs`). It already fails on literal corners and type values. Add three rules: (a) a `transition`, `animation` or `animation-duration` that is not a `var(--motion-*)` (allow-list for loops and the ripple); (b) an `opacity` on `:disabled` other than 0.38; (c) a color-mix percentage in a `hover` or `focus` rule other than 8, 10 or 16. Add `text-sm`, `text-xs`, `text-base`, `font-medium` and `font-semibold` to its off-scale pattern, with the existing count as the allow-list start. A second small test in `scripts/check-language.mjs`: no straight apostrophe between letters in `src/i18n/en-US/`, and no "cancelled", "deactivate", "pop-up", "dropdown". No new workflow.

## 5. Questions for the owner

1. **Which spec is the reference: baseline M3 or M3 Expressive?** The theme uses Expressive sizes in places. Recommendation: Expressive for what Expressive replaced, baseline for everything else; record the list in the deviations doc (item 1 above).
2. **Shadows at rest (row 24):** keep colour-only elevation? Recommendation: keep, record it; add a shadow only to the menu, the dialog and the snackbar, which float over the page.
3. **Icons 20px in lists and fields (rows 1 and 2):** move to Material's 24px? Recommendation: yes for lists (the leading icon is the first thing people see), and for fields; it needs the screens re-checked.
4. **Footer links at 24px (row 8):** pad them to 48px? Recommendation: yes, on phones only.
5. **Table block (row 31):** make it exactly Material 2 (4px corner, plain header, 4% hover) or keep the card look? Recommendation: 4% hover and plain header with a divider, and keep the 12px corner so the table sits with the cards.
6. **"Hidden" as a page status (W4):** keep for unlisted pages? Recommendation: change to "Unlisted", which says what it is, and keep "Hidden" for the search-engine setting.
7. **Full stops on hints (W7):** none on fragments? Recommendation: yes, and the check in section 4 keeps it so.
