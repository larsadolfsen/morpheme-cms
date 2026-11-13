# Material 3 conformance audit

Date: 2026-11-13 (second pass the same day). Audit only: no product code changed. Data tables are checked against Material 2, everything else against Material 3.

## How it was measured

- **The theme and the editor.** The demo was built (`npm run build`) and opened in Chromium. 27 editor screens at 375px and 1280px, light and dark: **20,560 elements** read with `getComputedStyle` (size, padding, corner, type, shadow, transition, animation, tap-target size). The parts screen (79 parts) the same way. Every size of button, icon button, FAB, extended FAB, chip, segmented button and tab was drawn from its CSS class and measured. 728 theme tokens were resolved in the browser.
- **Material 3.** The real pages on `m3.material.io` were opened in headless Chromium and read: the specs pages of 33 components (every token set of each: sizes, spaces, icon sizes, opacities), and the pages for the shape scale, the type scale, elevation, motion, state layers, touch targets and spacing. `@material/web` 2.4.1 (baseline tokens) was used only for what the pages show as images. Material 2: `m2.material.io/components/data-tables` and `@material/data-table` 14.0.0.
- The source CSS and `src/i18n/en-US/` (2,668 strings) were scanned for motion, spacing, state layers, disabled opacities and wording. `npm run check:contrast` was run.
- **Not verifiable even now:** (1) each component's corner shape: the M3 token tables draw a shape as an image, with no number, so only the shape scale itself (10 steps) was compared; (2) the stiffness and damping of M3 Expressive's springs: the motion page gives only their curves and durations (the Standard springs, 1400/0.9, 700/0.9, 300/0.9, are printed and match).

## 1. Does it follow Material 3?

Mostly yes. Checked against the M3 pages and equal: all 15 type roles (size, line height, weight, tracking); the 10-step corner scale (0, 4, 8, 12, 16, 20, 28, 32, 48, full); the 8% hover, 10% focus and 10% press state layers; FAB (56, 80, 96 with 24, 28, 36 icons) and extended FAB (56, 80, 96, padding 16, 26, 28); switch, checkbox, radio and chip (32 high, 18 icon); the menu (item 44, icons 20); the list (rows 56, 72, 88, icons 20 as the Expressive spec says, padding 10, 16, gap 12, 2 between segments); navigation bar (64, indicator 56 by 32), rail (96, expanded from 220), drawer (360); the slider (track 16, handle 4 by 44); tabs (48 and 64); split button inner corners; the Standard springs. **No live element has a corner outside the scale.** The Table block matches Material 2's numbers (header 56, row 52, padding 16, medium-weight header).

What differs: **31 findings** (23 in the parts and the table, 8 in the words): 24 small, 5 medium, 2 large. **1 is already recorded** in `docs/material-deviations.md` (icon button 48) and 2 partly; **1 entry there is out of date** (colour sweep 12, shadows). The biggest are: buttons are not Material's sizes (the default is 40 high with 24 padding; M3's Medium is 56, and its Small has 16), loose Tailwind text sizes instead of the type roles (about 130 places), disabled parts faded at 35 to 60%, text field icons 20 where M3 says 24, hand-written animation timings, tap targets under 44, and some English texts. Contrast is fine: 6,378 pairs checked, 0 fail.

## 2. Every difference

Fix size: small is one or a few lines, medium is one part or one file, large is many files. "Recorded" means `docs/material-deviations.md` already lists it.

### Size and shape

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 1 | Button sizes (`--button-xsmall-*`, `-large-*`, `-xlarge-*`, `ui.css`, `global.css` 123 to 142), measured | XS 40 high, padding 16, gap 8, icon 18. L 64 high, padding 36, gap 12, icon 24. XL 88 high, padding 48, gap 16, icon 32 | m3.material.io/components/buttons/specs, Size token sets: XS 32 high, 12 padding, 4 gap, 20 icon. L 96, 48, 12, 32. XL 136, 64, 16, 40 | medium | no |
| 2 | The default button (no size class), measured | 40 high, padding 24, icon 20 | Same page: Small (default) is 40 high with 16 padding and a 20 icon; Medium is 56 high with 24 padding and a 24 icon. "Small button padding 24dp: Not recommended. Use 16dp". The hero's 56 (`global.css` 606) is Medium | medium | no |
| 3 | Icon button sizes, measured | XS 36, small 48, medium 60. Narrow and wide small: 38 and 62 wide. Large 96, XL 136 and all icon sizes are right | m3.material.io/components/icon-buttons/specs: XS 32, small 40, medium 56; small narrow 32 and wide 52 wide (4, 8, 14 side space with a 24 icon) | small | small 48 only (CSS sweep 4: 48px box for the 48px target) |
| 4 | Button group: gap between buttons; connected XS inner corner (`--button-group-*`) | 12 for every size; XS inner corner 4 | m3.material.io/components/button-groups/specs: gap 18 (XS), 12 (S), 8 (M, L, XL); connected inner corner 8 for XS, S, M (pressed 4), 16 L, 20 XL | small | no |
| 5 | Text field icons (`.text-field-container`), 22 measured | 20px | m3.material.io/components/text-fields/specs: leading and trailing icon 24dp | small | no |

### Touch targets

| # | Where | What we have | What Material says | Fix | Recorded |
| - | ----- | ------------ | ------------------ | --- | -------- |
| 6 | Footer links (Support, System status, Report security issues, Privacy policy, Licenses), every phone screen (`min-h-6`) | 24px high | m3.material.io/foundations/designing/structure: touch targets at least 48 by 48dp; pointer targets at least 44; 8dp between targets (WCAG 2.2 AA only needs 24) | small | no |
| 7 | Parts screen and field editors: 23 standard icon buttons at 40 by 40, chip remove 28 by 28, inline chip 20 high, section list rows 36 high, segmented segment 38 | below 44 or 48 | Same page | medium | no |

### Type (the 15 role tokens are exact; their use is not)

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 8 | 61 `text-sm`, 6 `text-xs`, 5 `text-base`, 63 `font-medium`, 6 `font-semibold` in `src/` and `theme/` | A loose size with a loose weight | m3.material.io/styles/typography/type-scale-tokens: a role sets size, line height, weight and tracking together. Only 12 role classes are used | large | partly (CSS sweep 9) |
| 9 | 14px text inherits the page's 0.5px tracking: 326 elements at 14/20/400 with 0.5, 100 at 14/20/500 with 0.5, 204 at 14/20/500 with 0 | wrong tracking | Body medium is 14/20/400 with 0.25; label large and title small 14/20/500 with 0.1 | small | no |
| 10 | Weight 600 on headings and labels (about 150 elements: "Main menu" 22/28/600, "Preview", list titles) | 600 | The scale has 400 and 500, and 700 for the prominent label and emphasized styles. No 600 | small | no |
| 11 | Small buttons (152 measured) | line height 14px | Label large line height 20 | small | no |
| 12 | Text field label (116 measured at 12/15, 24 at 16/20) | line height 15 and 20 | 12/16 when it floats, 16/24 at rest (text-fields page: label populated 12/16, label 16/24) | small | no |

### Spacing

| # | Where | What we have | What Material says | Fix | Recorded |
| - | ----- | ------------ | ------------------ | --- | -------- |
| 13 | 12 of 600 padding, margin and gap values: `0.15rem` (2.4px), `0.35rem` (5.6px), `0.4rem` (6.4px), `0.6rem` (9.6px), `1.1rem` (17.6px) in `ui.css` 374, 457, 1048, 1372, `blocks.css` 1075, 1337, 1373, `editor.css` 1264; and `py-[1.125rem]`, `size-[28px]` | rem guesses between whole values | The 33 component pages use whole dp: 2, 4, 6, 8, 10, 12, 16 … (the 2.4, 5.6, 6.4, 9.6 and 17.6 are 2, 6, 6, 10 and 18 in disguise) | small | partly (CSS sweep 8: tokens only) |

### Colour and state layers

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 14 | Disabled parts (`opacity` in `ui.css`): button 60%, icon button 35%, segmented 45%, date-picker day 35%, dropdown icon 60% | 35 to 60% | Button and icon button pages, Disabled: label and icon 38%, container 10% | small | no (the entry on placeholders is another thing) |
| 15 | Search bar hover (`--search-bar-hover`) | 4% | state-layers page: hover 8% | small | no |

Equal and not listed: 70 uses of 8%, 15 of 10%, 4 of 12% (the rest are the recorded section colours); the status, PageSpeed, Google and picker colours are recorded (colour sweep 1 to 9).

### Elevation

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 16 | The fallback shadows in `ui.css` 106 to 116, used by every theme that sets none: key shadow 6 to 9%, big negative spread | softer than Material | The Material theme (`global.css` 29 to 38) has Material's two-layer shadows at all 5 levels; the fallback should too | small | out of date: colour sweep 12 says the Material theme's shadows are "softer"; they are Material's |
| 17 | Parts at rest in the Material theme (`--mo-elevation-N-rest-shadow` all 0, only the FAB has a shadow) | colour only | m3.material.io/styles/elevation/tokens, resting level 1: elevated button, elevated card, elevated chip, modal bottom sheet, side sheet and drawer. 2: menu, navigation bar, rich tooltip, toolbar, scrolled app bar. 3: dialog, FAB, extended FAB, search, date and time pickers | medium | no |

### Motion (owner rule: springs only)

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 18 | The settle times `lib/motion.ts` computes from the springs (`SETTLED = 0.001`) | Expressive: spatial 360, 440, 600; effects 150, 240, 330 ms. Standard: spatial 230, 320, 490 | m3.material.io/styles/motion/overview/specs: Expressive spatial 350, 500, 650; Standard spatial 350, 500, 750; effects 150, 200, 300 | small | no |
| 19 | `blocks.css` 81 to 86: fallback `--motion-*`, used only when the head's CSS is missing | hand-written 230, 320, 490, 150, 240, 330 with `cubic-bezier` (the Standard settle times above) | springs | small | no |
| 20 | Five hand-written animations: `editor.css` 404 and 408 (flash, `0.8s ease-in-out` three times); `ui.tsx` 2709 (`1200ms ease-out`); `lib/snackbar.ts` 126 and 129 (`ease-out`); `ui.css` 2282 (`0.3s` card shadow); `ui.css` 4354 to 4363 (stagger delays 30 to 120ms) and 7232 to 7256 (ripple 450, 375, 105ms) | hand-written | `motionTiming` or a spring variable | small | no |

Loading and progress indicators loop by design and are exempt. The 5,000 transitions measured on the live screens otherwise use the spring variables. The Standard springs equal the page's (1400, 700, 300 at 0.9; effects 3800, 1600, 800 at 1); the Expressive ones (800/0.6, 380/0.8, 200/0.8) could not be checked.

### Data tables (Material 2; `m2.material.io/components/data-tables`)

The Table block (`.block-table-grid`) matches Material 2 on header row 56, row 52, padding 16, body 14/20 and the medium-weight header. It differs here:

| # | Where | What we have | What Material 2 says (source) | Fix | Recorded |
| - | ----- | ------------ | ----------------------------- | --- | -------- |
| 21 | Corner of the table box | 12px (`--card-radius`) | "Table corner radius: 4dp" (the page) | small | no |
| 22 | Header row | filled with a tint (`--block-tint`) | the table is one surface; a 12% on-surface divider separates the rows (the page: Container Surface, Divider 12%; `@material/data-table` `$header-row-fill-color: surface`) | small | no |
| 23 | Row hover | 8% | 4% of on-surface (`$row-hover-fill-color: rgba(on-surface, 0.04)`) | small | no |

### Words (`src/i18n/en-US/`, 2,668 strings)

| # | Where | Offender | Better (M3 word choice) | Fix |
| - | ----- | -------- | ----------------------- | --- |
| 24 | `forms.versions.scheduledCancelled` | "Schedule for X cancelled" | American spelling, as the rest: "canceled" | small |
| 25 | 25 strings with a straight `'` (17 in `parts.ts`, 3 in `colors.ts`, 2 in `library.ts`, 1 each in `blocks.ts`, `forms.ts`, `media.ts`); 166 use `’` | mixed apostrophes | one apostrophe, `’` | small |
| 26 | `apps.deactivated` "Deactivated"; `apps.oneOfType` "Only one X app can be active. Activating X deactivates X…" | active, activate, deactivate | Material's terms: Enabled/Disabled, On/Off ("Only one X app can be on. Turning on X turns off X.") | small |
| 27 | `library.status.unlisted`, `library.statusShown.unlisted`: "Hidden" as a page status | CLAUDE.md reserves "Hidden" for the SEO setting; statuses are Draft and Published | decide the term for a page that is only unlisted | small |
| 28 | `app.unsavedSheet` "You have changes that aren’t saved. Do you want to keep them?" | "Do you want…" | ask plainly: "Keep your unsaved changes?" | small |
| 29 | 124 passive strings, for example `advanced.bucket.no-bucket` ("Can be turned on once the storage X is made under R2 at Cloudflare and kept in the X"), `apps.stuck`, `app.imageNotLoaded` ("couldn’t be loaded"), `blockSettings.stuck` | passive voice, fragments | active: "Cloudflare doesn’t have storage X yet. Create it under R2 to turn this on." | large (many small edits) |
| 30 | 103 of 108 hint strings end with a full stop although they are fragments ("Numbered steps.", "A highlighted message."); 4 do not | inconsistent | no full stop on a fragment, a full stop on a sentence | medium |
| 31 | `parts.ts` "pop-up" ×3, "dropdown" ×1, "submenu" ×1 | | Material's terms: dialog, menu | small |

Not offenders: no "please", "oops", "click", exclamation marks, Yes/No buttons (the Yes/No are the cookie consents), Title Case labels, Danish text, or misspellings. "OK" on the pickers is Material's own label.

**The parts.** Not a difference, so not numbered: the theme has every current M3 component (buttons in five sizes and both shapes, icon button, FAB, extended FAB, FAB menu, chips, segmented button, button group, split button, switch, checkbox, radio, text field, select, slider, card, list, dialogs, sheets, menu, tabs, all top app bars, navigation bar, rail and drawer, snackbar, progress and loading indicators, badge, tooltips, toolbar, divider, search, date and time pickers, carousel). The editor draws a few of its own (colour wheel and swatches, crop, score ring, section list, share preview) from the theme's tokens.

### Contrast

`npm run check:contrast` (Saturn, the Material theme): **6,378 pairs checked, 0 fail, 0 need a manual look.** Contrast is not a finding.

## 3. Differences that look deliberate: lines for `docs/material-deviations.md`

Add these (after the owner agrees), and correct entry 12 of the colour sweep.

1. **No shadow at rest in the Material theme** (row 17): M3 gives elevated cards, menus, dialogs and the like a resting level 1 to 3; we show those by colour only, and use a shadow for the FAB, for lifting and for dragging. Why: flat, quiet pages and the section-colour rule (deviation 2).
2. **Elevation values**: replace colour sweep 12 with: "The Material theme's shadows are Material's (checked 2026-11-13). The fallback shadows in `ui.css` are softer; used by themes that do not set their own." (or fix row 16 and delete the sentence).
3. **Icon button 48px** (row 3): add the XS and medium sizes (36 and 60) if they are meant, with the 48px target as the reason.
4. **Table block** (rows 21 to 23): if the owner prefers its look, record: "The Table block follows Material 2's data table for size and type, and our card look for corner, header and hover, so it sits with the cards."
5. **Footer links 24px high** (row 6): only if the owner says so (WCAG 2.2 AA allows it); otherwise fix.
6. **Settle times** (row 18): if kept, record that the springs are Material's but the duration is where the curve is 0.1% from its end, not Material's rounded 350, 500, 650.

## 4. Proposed order and one check

Order:

1. Words 24, 25, 26, 28, 31 and rows 14, 15: small, no layout change.
2. Rows 18 to 20 (motion): small; makes "springs only" true everywhere.
3. Rows 5, 6, 7 (field icons, tap targets): changes the layout slightly, needs the screens checked.
4. Rows 1, 2, 3, 4 (button sizes): changes every button; decide first (question 1).
5. Rows 8 to 12 (type): the large one; move loose Tailwind sizes to the role classes by screen.
6. Rows 13, 16, 17, 21 to 23 and words 29, 30: decide first (questions below), then do.

One check: extend **`check:css-values`** (`scripts/check-css-values.mjs`). It already fails on literal corners and type values. Add three rules: (a) a `transition`, `animation` or `animation-duration` that is not a `var(--motion-*)` (allow-list for loops and the ripple); (b) an `opacity` on `:disabled` other than 0.38; (c) a color-mix percentage in a `hover` or `focus` rule other than 8, 10 or 16. Add `text-sm`, `text-xs`, `text-base`, `font-medium` and `font-semibold` to its off-scale pattern, with the existing count as the allow-list start. In `check:screens`, one more measure: the button sizes (XS, S, M, L, XL) at the heights, paddings and icons of the M3 page, from the classes, as `scripts/editor-screens.mjs` already measures other parts. A small test in `scripts/check-language.mjs`: no straight apostrophe between letters in `src/i18n/en-US/`, and no "cancelled", "deactivate", "pop-up", "dropdown". No new workflow.

## 5. Questions for the owner

1. **Button sizes (rows 1 and 2):** make the five sizes exactly Material 3 Expressive's (32, 40, 56, 96, 136) and the default Small with 16 padding? Recommendation: yes. It is the largest visible change: the default button keeps its 40 height but loses 8px of padding each side, and "medium" becomes 56 (which the hero already uses). Do it in its own pull request with screens.
2. **Shadows at rest (row 17):** keep colour-only elevation? Recommendation: keep, record it; add a shadow only to the menu, the dialog and the snackbar, which float over the page.
3. **Text field icons (row 5):** move to 24px (the lists keep their Expressive 20)? Recommendation: yes; check the screens at 375px.
4. **Footer links at 24px (row 6):** pad them to 48px? Recommendation: yes, on phones only.
5. **Table block (rows 21 to 23):** make it exactly Material 2 (4px corner, plain header, 4% hover) or keep the card look? Recommendation: 4% hover and plain header with a divider, and keep the 12px corner so the table sits with the cards.
6. **"Hidden" as a page status (row 27):** keep for unlisted pages? Recommendation: change to "Unlisted", which says what it is, and keep "Hidden" for the search-engine setting.
7. **Full stops on hints (row 30):** none on fragments? Recommendation: yes, and the check in section 4 keeps it so.
