# Material 3 conformance audit

Date: 2026-11-13 (second pass the same day). Audit only: no product code changed. Data tables are checked against Material 2, everything else against Material 3.

## How it was measured

- **The theme and the editor.** The demo was built (`npm run build`) and opened in Chromium. 27 editor screens at 375px and 1280px, light and dark: **20,560 elements** read with `getComputedStyle` (size, padding, corner, type, shadow, transition, animation, tap-target size). The parts screen (79 parts) the same way. Every size of button, icon button, FAB, extended FAB, chip, segmented button and tab was drawn from its CSS class and measured. 728 theme tokens were resolved in the browser.
- **Material 3.** The real pages on `m3.material.io` were opened in headless Chromium and read: the specs pages of 33 components (every token set of each: sizes, spaces, icon sizes, opacities), and the pages for the shape scale, the type scale, elevation, motion, state layers, touch targets and spacing. `@material/web` 2.4.1 (baseline tokens) was used only for what the pages show as images. Material 2: `m2.material.io/components/data-tables` and `@material/data-table` 14.0.0.
- The source CSS and `src/i18n/en-US/` (2,668 strings) were scanned for motion, spacing, state layers, disabled opacities and wording. `npm run check:contrast` was run.
- **Standing owner rule (13 Nov):** outside the editor's own workspace every design choice follows what m3.material.io prints, quoted; where M3 is silent the spec says so and gives the nearest M3 pattern. Every row below has its quote or says M3 is silent. Parts that could not be read are listed next.
- **Not verifiable even now:** (1) each component's corner shape: the M3 token tables draw a shape as an image, with no number, so only the shape scale itself (10 steps) was compared; (2) the stiffness and damping of M3 Expressive's springs: the motion page gives only their curves and durations (the Standard springs, 1400/0.9, 700/0.9, 300/0.9, are printed and match).

## 1. Does it follow Material 3?

Mostly yes. Checked against the M3 pages and equal: all 15 type roles (size, line height, weight, tracking); the 10-step corner scale (0, 4, 8, 12, 16, 20, 28, 32, 48, full); the 8% hover, 10% focus and 10% press state layers; FAB (56, 80, 96 with 24, 28, 36 icons) and extended FAB (56, 80, 96, padding 16, 26, 28); switch, checkbox, radio and chip (32 high, 18 icon); the menu (item 44, icons 20); the list (rows 56, 72, 88, icons 20 as the Expressive spec says, padding 10, 16, gap 12, 2 between segments); navigation bar (64, indicator 56 by 32), rail (96, expanded from 220), drawer (360); the slider (track 16, handle 4 by 44); tabs (48 and 64); split button inner corners; the Standard springs. **No live element has a corner outside the scale.** The Table block keeps Material 2's structure (header 56, row 52, padding 16) with Material 3's look (corner, header fill, divider, hover, type), as the owner decided.

What differs: **25 findings** (20 in the parts, 5 in the words): 18 small, 5 medium, 2 large. **1 is already recorded** in `docs/material-deviations.md` (icon button 48) and 2 partly; **1 entry there is out of date** (colour sweep 12, shadows). The biggest are: buttons are not Material's sizes (the default is 40 high with 24 padding; M3's Medium is 56, and its Small has 16), loose Tailwind text sizes instead of the type roles (about 130 places), disabled parts faded at 35 to 60%, text field icons 20 where M3 says 24, hand-written animation timings, tap targets under 44, and some English texts. Contrast is fine: 6,378 pairs checked, 0 fail.

## 2. Every difference

Fix size: small is one or a few lines, medium is one part or one file, large is many files. "Recorded" means `docs/material-deviations.md` already lists it.

### Size and shape

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 1 | Button sizes (`--button-xsmall-*`, `-large-*`, `-xlarge-*`, `ui.css`, `global.css` 123 to 142), measured | XS 40 high, padding 16, gap 8, icon 18. L 64 high, padding 36, gap 12, icon 24. XL 88 high, padding 48, gap 16, icon 32 | m3.material.io/components/buttons/specs, Size token sets: XS 32 high, 12 padding, 4 gap, 20 icon. L 96, 48, 12, 32. XL 136, 64, 16, 40 | medium | decided (owner), Material only: section 6 |
| 2 | The default button (no size class), measured | 40 high, padding 24, icon 20 | Same page: Small (default) is 40 high with 16 padding and a 20 icon; Medium is 56 high with 24 padding and a 24 icon. "Small button padding 24dp: Not recommended. Use 16dp". The hero's 56 (`global.css` 606) is Medium | medium | decided (owner), Material only: section 6 |
| 3 | Icon button sizes, measured | XS 36, small 48, medium 60. Narrow and wide small: 38 and 62 wide. Large 96, XL 136 and all icon sizes are right | m3.material.io/components/icon-buttons/specs: XS 32, small 40, medium 56; small narrow 32 and wide 52 wide (4, 8, 14 side space with a 24 icon) | small | small 48 only (CSS sweep 4: 48px box for the 48px target); decided (owner): section 6 |
| 4 | Button group: gap between buttons; connected XS inner corner (`--button-group-*`) | 12 for every size; XS inner corner 4 | m3.material.io/components/button-groups/specs: gap 18 (XS), 12 (S), 8 (M, L, XL); connected inner corner 8 for XS, S, M (pressed 4), 16 L, 20 XL | small | no |
| 5 | Icon sizes that differ from what the component page prints: text field icons and the select's arrow (`.text-field-container`, `.exposed-dropdown-menu-icon`; 22 measured at 20px); the FAB menu's close icon (CSS says 24, not drawn on any screen measured) | 20px; 24px | Text fields page: leading and trailing icon 24dp. FAB menu page: "FAB menu close button icon size 20dp" | small | no |

### Icons

Rule (owner, 2026-11-13): every icon is 24dp unless the component's M3 page prints another size. The pages say (read in headless Chromium):

- `m3.material.io/styles/icons/designing-icons`: "Standard icons are displayed as 24dp x 24dp." and "Icons support additional sizes: 20dp, 40dp, and 48dp, with 20dp primarily for desktop, dense layouts, and small scale visuals, and 40dp and 48dp optimized for display or headline type".
- Printed as 24: text fields (leading, trailing), cards, dialogs, tabs, top app bars, navigation bar, rail and drawer, search, snackbar, toolbars, FAB menu items, FAB (regular), extended FAB (small), medium buttons and the small icon button.
- Where a page prints two sizes, the page's own text first, then its token tables. **Menus** (`/components/menus/specs`): the spec table at the top says "List item height 48dp" and "Leading/trailing icon size 24dp" (that is the baseline menu); the token set "Menus - Common" says "Menu item height 44dp", "Menu item leading icon size 20dp" and "Menu item trailing icon size 20dp"; the token set "Menu (baseline)" says "Menu icon size 24dp", "Menu list item leading icon size 24dp", "Menu list item trailing icon size 24dp" (marked with a warning sign). **Lists** (`/components/lists/specs`): the token set "List - Common" says "List list item leading icon size 24dp" and, on the next line, "List list item leading icon expressive size 20dp"; the same for trailing (24dp, then "trailing icon expressive size 20dp"). So both pages print 20 for the Expressive set and 24 for the baseline; whoever read only the spec table at the top of the Menus page saw only 24.
- Printed as another size, which the theme follows: buttons (XS 20, S 20, M 24, L 32, XL 40 on `/components/buttons/specs`), icon buttons (XS 20, S 24, M 24, L 32, XL 40), FAB medium 28 and large 36, chips 18, segmented buttons 18, checkbox 18, radio 20, switch 16, menu items 20 and lists 20 (the Expressive token sets quoted above; the baseline 24 is printed beside them). The theme draws the Expressive sizes in the menu and the list. Owner, 13 Nov: keep 20 in the menu and the list (the Expressive size, with the baseline 24 printed beside it). Decided.

**Which icons the 20 covers (owner, 13 Nov: "Not the list block icons").** It covers the UI parts: the theme's Menu items and ListItem rows, in the editor and in the theme's UI parts. It does not cover the icons of content blocks a site owner puts on a page (the List block, the Points with icon block and any other block's icons), which keep their own size as today. Checked in the code: the List block (`theme/blocks/list/Rows.tsx`) and the Points block (`theme/blocks/points/PointList.tsx`) draw their rows with the same `ListItem`, so their icons are sized by the same variable, `--list-item-icon-size` (`theme/styles/global.css` 216, `1.25rem`, 20px today; `ui.css` 2555 falls back to `1.5rem` where a theme sets none). Nothing in this audit changes that variable, so no block icon changes. The icon build row (row 5: text field icons to 24, the FAB menu close icon to 20) touches only the text field's icon rules and `--fab-menu-close-icon-size`; no block uses a text field or the FAB menu (searched `theme/blocks`). One rule for any later change: do not edit `--list-item-icon-size` for the UI parts without first giving the List and Points blocks their own variable set to today's value.
- Differs in the theme: text fields and the select's arrow (20, page says 24), XS button icon (18, page says 20; row 1), L and XL button icons (24 and 32, page says 32 and 40; row 1), and the FAB menu close icon (row 5).
- Measured live and equal: icons in top app bar, search bar, navigation drawer, tabs, toolbar, icon button, FAB, list rows, chips, segmented button. **Not measured:** icons in snackbar, dialog, navigation bar, rail, menu, FAB menu: none was on the screens opened, so only their CSS defaults were read. **Not read:** the Material Symbols font's optical-size axis (20, 24, 40, 48): whether the theme sets it with the icon size was not checked.

### Touch targets

| # | Where | What we have | What Material says | Fix | Recorded |
| - | ----- | ------------ | ------------------ | --- | -------- |
| 6 | Footer links (Support, System status, Report security issues, Privacy policy, Licenses), every phone screen (`min-h-6`) | 24px high | m3.material.io/foundations/designing/structure: touch targets at least 48 by 48dp; pointer targets at least 44; 8dp between targets (WCAG 2.2 AA only needs 24) | small | decided (owner: 48px), implemented in its own PR |
| 7 | Parts screen and field editors: chip remove 28 by 28, inline chip 20 high, section list rows 36 high, segmented segment 38 high. (23 standard icon buttons draw 40 by 40: that is M3's own small icon button, 40 with a 48 touch target; whether ours has the 48 target was not checked) | below 44 or 48 | `/foundations/designing/structure` (quoted in row 6): targets at least 48 by 48dp, pointers 44; lists: M3 row 56 | medium | no |

### Type (the 15 role tokens are exact; their use is not)

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 8 | 61 `text-sm`, 6 `text-xs`, 5 `text-base`, 63 `font-medium`, 6 `font-semibold` in `src/` and `theme/` | A loose size with a loose weight | m3.material.io/styles/typography/type-scale-tokens: a role sets size, line height, weight and tracking together. Only 12 role classes are used | large | partly (CSS sweep 9) |
| 9 | 14px text inherits the page's 0.5px tracking: 326 elements at 14/20/400 with 0.5, 100 at 14/20/500 with 0.5, 204 at 14/20/500 with 0 | wrong tracking | Body medium is 14/20/400 with 0.25; label large and title small 14/20/500 with 0.1 | small | no |
| 10 | Weight 600 on headings and labels (about 150 elements: "Main menu" 22/28/600, "Preview", list titles) | 600 | Baseline roles are weight 400 and 500; the label roles have a prominent weight of 700 (type page). M3 also has 15 emphasized styles with a higher weight; their weights could not be read (the page's token table did not parse), so the 600 is listed as in no baseline role, not as in no style | small | no |
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
| 16 | The fallback shadows in `ui.css` 106 to 116, used by every theme that sets none: key shadow 6 to 9%, big negative spread | softer than Material | The M3 elevation page prints each level's height (1, 3, 6, 8, 12dp) and which parts rest at it, but no shadow values. The two-layer shadows in `global.css` 29 to 38 are `@material/web`'s (`elevation/internal/_elevation.scss`); the fallback should be the same ones | small | out of date: colour sweep 12 says the Material theme's shadows are "softer"; they are Material's; decided (owner): Material's, section 7 |
| 17 | Parts at rest in the Material theme (`--mo-elevation-N-rest-shadow` all 0, only the FAB has a shadow) | colour only | m3.material.io/styles/elevation/tokens, resting level 1: elevated button, elevated card, elevated chip, modal bottom sheet, side sheet and drawer. 2: menu, navigation bar, rich tooltip, toolbar, scrolled app bar. 3: dialog, FAB, extended FAB, search, date and time pickers | medium | decided (owner), section 7 |

### Motion (owner rule: springs only)

| # | Where | What we have | What Material says (source) | Fix | Recorded |
| - | ----- | ------------ | --------------------------- | --- | -------- |
| 18 | The settle times `lib/motion.ts` computes from the springs (`SETTLED = 0.001`) | Expressive: spatial 360, 440, 600; effects 150, 240, 330 ms. Standard: spatial 230, 320, 490 | m3.material.io/styles/motion/overview/specs: Expressive spatial 350, 500, 650; Standard spatial 350, 500, 750; effects 150, 200, 300 | small | no |
| 19 | `blocks.css` 81 to 86: fallback `--motion-*`, used only when the head's CSS is missing | hand-written 230, 320, 490, 150, 240, 330 with `cubic-bezier` (the Standard settle times above) | springs | small | no |
| 20 | Five hand-written animations: `editor.css` 404 and 408 (flash, `0.8s ease-in-out` three times); `ui.tsx` 2709 (`1200ms ease-out`); `lib/snackbar.ts` 126 and 129 (`ease-out`); `ui.css` 2282 (`0.3s` card shadow); `ui.css` 4354 to 4363 (stagger delays 30 to 120ms) and 7232 to 7256 (ripple 450, 375, 105ms) | hand-written | `motionTiming` or a spring variable | small | no |

Loading and progress indicators loop by design and are exempt. The 5,000 transitions measured on the live screens otherwise use the spring variables. The Standard springs equal the page's (1400, 700, 300 at 0.9; effects 3800, 1600, 800 at 1); the Expressive ones (800/0.6, 380/0.8, 200/0.8) could not be checked.

### Data tables (structure from Material 2, look from Material 3)

Rule (owner, 2026-11-13): "We need to adapt it to MD3 styles." The table keeps Material 2's structure and behaviour (columns, alignment, sort, pagination, a header row, 52px rows, 56px header row, 16px side padding: `m2.material.io/components/data-tables`, which prints "The baseline row height is 52dp, and the column header row height is 56dp" and "Padding: 16dp"). Its look comes from M3 tokens. The M3 density page (`/foundations/layout/understanding-layout/density`) gives no table row height, so the 52 and the 56 come from the M2 page only. Checked on the Table block (`.block-table-grid`, measured and read in `blocks.css` 1437 to 1480):

| Part | What we have | M3 token it should be | Result |
| ---- | ------------ | --------------------- | ------ |
| Corner | 12px (`--card-radius`) | the shape scale's medium, 12dp, the card corner (`/styles/shape/corner-radius-scale`) | equal |
| Header row fill | `--block-tint`, which is the `surface-container-high` role | a surface container | equal |
| Dividers and outline | `--block-line`, the `outline-variant` role, 1px | outline variant | equal |
| Row hover | `--mo-hover`, 8% | state layer, hover 8% (`/foundations/interaction/states/state-layers`) | equal |
| Type | header 14/20/500 with 0.1 (label large), body 14/20/400 with 0.25 (body medium) | the M3 roles | equal |
| Focus | 3px outline, 2px offset | focus indicator 3dp, offset 2dp | equal |

So there is **no difference** left in the Table block. (Earlier in this audit it was listed against M2's 4dp corner, tinted header and 4% hover; those are M2's own look and are replaced by the M3 ones by the owner's rule, so they are not findings.) The two rules, "structure from M2, look from M3 tokens", are the same split `docs/superpowers/specs/2026-11-13-table-md2-design.md` states (lines 17 to 19). That spec still lists the container as "4 dp corners" (line 46) and an M3 "small shape" (line 18); by this rule the corner is medium, 12dp, as built: the PM should align it.

Row numbers 21 to 23 are not used (they were the Table block's, withdrawn above).

### Words (`src/i18n/en-US/`, 2,668 strings)

Read on m3.material.io: `/foundations/content-design/style-guide/ux-writing-best-practices`, `/style-guide/word-choice` (its Pronouns section), `/style-guide/grammar-and-punctuation`, `/global-writing/word-choice`, and the guidelines of switch, dialogs, menus, snackbar and text fields. Rows are findings only where M3 prints something; where M3 is silent it is said so below the table.

| # | Where | Offender | What M3 prints | Fix |
| - | ----- | -------- | -------------- | --- |
| 24 | `forms.versions.scheduledCancelled` | "Schedule for X cancelled" | `/foundations/content-design/global-writing/overview`: "This guidance is for all American English that is localized." (The page does not print the word; "canceled" is the American spelling, a dictionary fact.) | small |
| 25 | `apps.deactivated` "Deactivated"; `apps.oneOfType` "Only one X app can be active. Activating X deactivates X…" | active, activate, deactivate for a switch-like state | Switch guidelines: "Use a switch to turn an option on and off" and "turn settings on or off". Nearest M3 pattern: "Only one X app can be on. Turning on X turns off X." M3 does not print Enabled/Disabled as UI wording | small |
| 26 | The status "Hidden" (`library.status.unlisted`, `defaults/collections.ts` field `unlisted`) and two demo texts that describe it. Today Hidden is a toggle on blog posts only (`lib/status.mjs`: off the blog and every list of posts, still published, still opens at its address, still in Google and the sitemap); a page has no Hidden (a stored one is read as published with `noindex`). The field's help text is right: "Not shown on the blog or in lists of posts, but open at its address and in Google." **Wrong:** the demo's two status lists (`demo/src/content/pages/blocks.md` 37, `demo/src/content/blog/schedule-a-post.md` 13) say "Opens at its address but stays off Google." | The demo text says Google is excluded; it is not | M3 is silent on a status called Hidden. Owner decision (question 6): "Hidden" stays the name; the search engine setting is "No index" (with "No follow" next to it); today it is labelled "Hide from search engines" and there is no "No follow" field | small |
| 27 | 124 strings in long, indirect, passive wording, for example `advanced.bucket.no-bucket` ("Can be turned on once the storage X is made under R2 at Cloudflare and kept in the X"), `apps.stuck`, `app.imageNotLoaded` ("couldn’t be loaded"), `blockSettings.stuck` | long sentences, fragments | Global writing: "Use short, simple sentences"; UX writing best practices: "Emphasize the results of the user’s potential action in neutral, direct language" and "Tell users what will happen if they take an action and how they can undo it". M3 does not print "active voice" in the pages read | large (many small edits) |
| 28 | Full stops on single sentences and fragments. In `src/i18n/en-US/`: 469 strings end with a full stop, **313** of them one sentence or fragment and 156 several sentences. Of the 108 strings keyed as hints, 103 end with one: **91** are single sentences ("Numbered steps.", "A highlighted message.", "Shown after the price.") and 12 are several sentences. `da-DK` has the same 108 and 103 and 91 (506 with a stop in all, 349 single). Also `defaults/collections.ts`: all 41 field `hint`s end with a full stop, and 40 Danish keys of `defaults/i18n/da-DK/collections.ts` end with one | Single sentences and fragments end with a full stop | `/foundations/content-design/style-guide/grammar-and-punctuation`, "Skip periods and unnecessary punctuation": "To help readers scan text, avoid using periods and other unnecessary punctuation." "Avoid using periods to end single sentences, particularly in: Labels, Tooltip text, Bulleted lists, Dialog body text, Hyperlinked text." "Use periods on: Multiple sentences; Long or complex sentences, if it suits the context." The text field page (`/components/text-fields/guidelines`) says supporting text "should ideally be one line" and names no punctuation rule of its own. The same page says: "This style guide is specific to English-language UX writing." So M3 backs the rule for English only; applying it to the Danish texts (349 strings) is the owner's choice (13 Nov: "Yes") | medium |

**M3 is silent on, so these are not findings:** the apostrophe character (25 strings use a straight `'`, 166 use `’`; an internal consistency matter for the owner); the wording of an unsaved-changes question (`app.unsavedSheet` "Do you want to keep them?": the dialogs page says a dialog title is "a brief, clear statement or question" and shows "confirm that the user wants to discard unsaved changes"; it prints no rule against "Do you want"); "pop-up" and "submenu" (and M3's own text field page uses "dropdown": "A dropdown arrow indicates that a text field has a nested selection component"); active voice.

Not offenders, checked against what M3 prints: no "please", "sorry" or "oops" (global writing: "Avoid polite expressions, such as 'Please,' 'Sorry,' and 'Thank you'"); no "e.g." or "etc." ("Avoid Latin abbreviations in UI text such as e.g. or etc."); no Title Case ("Don't use title case capitalization. Instead, use sentence case."; the Title Case hits are example content); no "we" or "our" ("Use caution with 'I' and 'we'"; the few "I" and "me" are example content), no mix of "my" and "you"; every sentence that starts with "This" or "That" has its noun right after it, as M3 asks. No misspellings. "OK" on the pickers is Material's own label.

**The parts.** Not a difference, so not numbered: the theme has every current M3 component (buttons in five sizes and both shapes, icon button, FAB, extended FAB, FAB menu, chips, segmented button, button group, split button, switch, checkbox, radio, text field, select, slider, card, list, dialogs, sheets, menu, tabs, all top app bars, navigation bar, rail and drawer, snackbar, progress and loading indicators, badge, tooltips, toolbar, divider, search, date and time pickers, carousel). The editor draws a few of its own (colour wheel and swatches, crop, score ring, section list, share preview) from the theme's tokens.

### Contrast

`npm run check:contrast` (Saturn, the Material theme): **6,378 pairs checked, 0 fail, 0 need a manual look.** Contrast is not a finding.

## 3. Differences that look deliberate: lines for `docs/material-deviations.md`

Add these (after the owner agrees), and correct entry 12 of the colour sweep.

1. **No shadow at rest in the Material theme** (row 17): M3 gives elevated cards, menus, dialogs and the like a resting level 1 to 3; we show those by colour only, and use a shadow for the FAB, for lifting and for dragging. Why: flat, quiet pages and the section-colour rule (deviation 2).
2. **Elevation values**: replace colour sweep 12 with: "The Material theme's shadows are Material's (checked 2026-11-13). The fallback shadows in `ui.css` are softer; used by themes that do not set their own." (or fix row 16 and delete the sentence).
3. **Icon button 48px** (row 3): add the XS and medium sizes (36 and 60) if they are meant, with the 48px target as the reason.
4. **Data tables:** record the rule, not a deviation: "A data table keeps Material 2's structure and behaviour (row 52, header 56, padding 16, sort, alignment, pagination) and takes its look from M3 tokens (medium corner, surface container header, outline variant dividers, 8% hover, type roles). Owner decision 2026-11-13."
5. **Footer links 24px high** (row 6): not needed; the owner decided to make them 48px.
6. **Settle times** (row 18): if kept, record that the springs are Material's but the duration is where the curve is 0.1% from its end, not Material's rounded 350, 500, 650.

## 4. Proposed order and one check

Order:

1. Words 24, 25 and rows 14, 15: small, no layout change.
2. Rows 18 to 20 (motion): small; makes "springs only" true everywhere.
3. Rows 5, 6, 7 (field icons, tap targets): changes the layout slightly, needs the screens checked.
4. Rows 1, 2, 3, 4 (button sizes): changes every button; decide first (question 1).
5. Rows 8 to 12 (type): the large one; move loose Tailwind sizes to the role classes by screen.
6. Rows 13, 16, 17 and word 27: do after the pull requests above; word 28 (remove the stops) last, as it touches most strings.

One check: extend **`check:css-values`** (`scripts/check-css-values.mjs`). It already fails on literal corners and type values. Add three rules: (a) a `transition`, `animation` or `animation-duration` that is not a `var(--motion-*)` (allow-list for loops and the ripple); (b) an `opacity` on `:disabled` other than 0.38 for content and 0.1 for a container (the button pages); (c) a color-mix percentage in a `hover` or `focus` rule other than 8, 10 or 16. Add `text-sm`, `text-xs`, `text-base`, `font-medium` and `font-semibold` to its off-scale pattern, with the existing count as the allow-list start. In `check:screens`, one more measure: the button sizes (XS, S, M, L, XL) at the heights, paddings and icons of the M3 page, from the classes, as `scripts/editor-screens.mjs` already measures other parts. A small test in `scripts/check-language.mjs`: no straight apostrophe between letters in `src/i18n/en-US/`, and no "cancelled", "deactivate", "pop-up", "dropdown". No new workflow. Row 28's rule joins the language test: a string in `src/i18n/en-US/` or `da-DK/`, or a `hint` in `defaults/collections.ts`, that is one sentence and ends with a full stop fails (the count above is the allow-list start).

## 5. Questions for the owner

1. **Button sizes (rows 1 to 3): decided by the owner:** "Yes, match Material 3 sizes. That should not change size on themes that have their own sizes." The default theme (Material) buttons and icon buttons move to M3's sizes and padding; a theme that sets its own sizes keeps them. The plan is in section 6.
2. **Shadows at rest (row 17): decided by the owner:** "Yes, add shadows to those three." Parts at rest stay colour-only; the menu, the dialog and the snackbar, which float over the page, get Material's two-layer shadow: menu level 2, dialog level 3 (the M3 elevation page: resting level 2 lists the menu, level 3 the modal dialog). The snackbar: the M3 snackbar page names a "container elevation" token but prints no level, and the elevation page's resting list does not name the snackbar, so the level could not be read there; `@material/web`'s snackbar token is level 3, which is used.
3. **Icon sizes (row 5): decided by the owner:** every icon is 24dp unless the component's own M3 page prints another size, quoted in the section "Icons" above; no split is recommended beyond what those pages print. To do: text field icons and the select's arrow to 24, the FAB menu's close icon to 20.
4. **Footer links (row 6): decided by the owner:** 48px, implemented in its own pull request (not in this one).
5. **Table block: decided by the owner:** adapt it to MD3 styles (structure from Material 2, look from M3 tokens). Nothing is left to change in the Table block today; see "Data tables".
6. **"Hidden" (row 26): decided by the owner.** "Hidden" stays the status name, not "Unlisted"; the search engine setting is "No index" (and "No follow" beside it). To do: (a) fix the demo's two texts to the sentence below; (b) rename the setting "Hide from search engines" to "No index", add "No follow", and update the CLAUDE.md line that calls Hidden the SEO setting (a product change, its own pull request). Proposed help text for Hidden: English "Not listed on the blog or in lists of posts. It still opens at its address; the No index setting keeps it out of Google." Danish: "Vises ikke på bloggen eller i lister over indlæg. Siden kan stadig åbnes på sin adresse; indstillingen No index holder den ude af Google." (the Danish name of the setting is not decided, so the sentence names it in English).
7. **Full stops on hints (row 28): decided by the owner on what M3 says.** M3 says to avoid a period on a single sentence and to use periods on several sentences or long, complex ones (quotes in row 30). So: remove the full stop from every single sentence or fragment (hints, labels, tooltips, dialog text, 313 strings in en-US, 349 in da-DK, 41 field hints in `defaults/collections.ts`); keep it on strings of several sentences (156 and 157), where every sentence ends with one. The repo's own rule that a help text is one short sentence lives in the skill `site-editor-writing` in `morpheme-website`, which this session cannot read, so how the two fit is: a hint that is one short sentence has no stop under M3; a hint that needs two sentences keeps its stops. Not read: the M3 pages name no rule for supporting text beyond the general one. **Danish: decided by the owner (13 Nov, "Yes"):** the same rule in `da-DK` (349 single-sentence strings and the 40 Danish keys of `defaults/i18n/da-DK/collections.ts`). M3 does not say this: its punctuation page says "This style guide is specific to English-language UX writing.", so for Danish it is the owner's choice, not an M3 print.

## 6. Build plan: Material's buttons and icon buttons at M3 sizes (decided, not started)

Owner, 2026-11-13: "Yes, match Material 3 sizes. That should not change size on themes that have their own sizes." Spec only; no code in this pull request.

**The target** (read on `m3.material.io/components/buttons/specs` and `/icon-buttons/specs`, size token sets; height, side padding, icon-label gap, icon):

| Size | Button | Icon button (height, icon; side space narrow, default, wide) |
| ---- | ------ | ------------------------------------------------------------ |
| XS | 32, 12, 4, 20 | 32, 20; 4, 6, 10 |
| S (the default) | 40, 16, 8, 20 | 40, 24; 4, 8, 14 |
| M | 56, 24, 8, 24 | 56, 24; 12, 16, 24 |
| L | 96, 48, 12, 32 | 96, 32; 16, 32, 48 |
| XL | 136, 64, 16, 40 | 136, 40; 32, 48, 72 |

What the theme draws today (measured): buttons XS 40, S 40, none 40 (padding 24), L 64, XL 88; icon buttons XS 36, none 48, M 60, L 96, XL 136.

**How the sizes are set.** Sizes are variables (`--button-xsmall-height` and the rest, `--icon-button-*`), so the change is a set of new values plus one class:

1. In `theme/styles/global.css` (the default theme's own tokens, where `--button-height: 2.5rem` is today) write the table's values for every size, and make "no class" the M3 default, Small (40 high, 16 padding). Add `.button-medium` and use it for the hero's 56 (today a `--button-height` override at `global.css` 606). Icon buttons: the small size draws the 40px circle; M3 prints the 48 touch target (`/foundations/designing/structure`: "consider making touch targets at least 48 x 48dp"), and how we meet it (a pseudo-element on the button) is our implementation, not an M3 print. This retires deviation CSS sweep 4 ("we draw 48").
2. The sites that use Material get the new sizes on their next update; that is a visible change, so the pull request needs a changeset and a release note paragraph (look and feel).
3. Not read: the label type role per size (the M3 page shows it as a sample, "Aa"). The theme's L and XL labels are 24 and 32; check them against the Expressive roles before building.

**The problem to solve first.** `themes/venus/styles/global.css` starts with `@import '@morphemecms/cms/theme/styles/global.css'`: a theme builds on Material's file and overrides what it wants. So any size variable that Material's `global.css` newly sets and a theme does not set itself changes in that theme too. Two ways:

- **A (recommended): scope the new sizes to the default theme.** Write the M3 sizes under a selector that only matches when Material is the theme in use (for example the site writes `data-site-theme="material"` on `<html>`, next to the colour and motion CSS it already writes), so no other theme, whatever it imports, sees them. Nothing in any theme changes, by construction.
- **B: pin in each theme.** Write the M3 sizes unscoped, and have each theme pin the values it has today. Every theme that is not edited changes, so this fails the owner's rule for a store theme that nobody updates. Not recommended.

**Which themes set their own sizes today.** In `larsadolfsen/morpheme-apps` (read, commit `2378cf4`): one theme, **Venus** 1.3.0. `themes/venus/styles/controls.css` sets `--button-height` 3rem, `--button-padding`, `--button-gap`, `--button-small-height` and `-padding`, `--button-xsmall-height`, `-padding` and `-gap`, `--button-text-padding`, `--button-font-size`, `--icon-button-size` 2.75rem, `--chip-height`, `--text-field-height`; `footer.css` sets a smaller button (2rem). It does **not** set the L and XL button sizes, the icon button XS, M, L and XL sizes, or any icon size, so under B those would change in Venus (L 64 to 96, XL 88 to 136, icon buttons XS, M). Under A nothing changes in Venus. The repo `morpheme-cms` installs no other theme (`demo/src/themes` does not exist). Not checked: other store themes in `morpheme-appstore` and `morpheme-staging` (no access from this session).

**How to prove no other theme changed.**

1. **Before and after sizes.** A script (a new check, `scripts/check-theme-sizes.mjs`, in `npm run check`) opens a built site for each installed theme, draws every button size (shape round and square, with and without an icon), icon button size, FAB, extended FAB and chip, and writes each one's width, height, padding, gap, corner and icon size. The baseline is captured on `main` before the change and committed (`scripts/theme-sizes.baseline.json`). After the change the check fails on any difference for a theme that is not Material; for Material it compares with the table above.
2. **A theme with its own sizes in this repo's CI.** No theme is installed here, so `check:themes` runs on nothing. Add a fixture theme under `scripts/fixtures/` that sets exactly Venus's size variables (copied, not imported), installed by the check for the run. That gives the before/after check a theme with its own sizes without a store theme.
3. **The real Venus.** `morpheme-apps` copies Venus into its site and runs `check:themes` (`scripts/check.mjs`) against its pinned `@morphemecms/cms` (`0.16.0-next-20261111130251`); when its pin is bumped to the version with the change, that check builds Venus and opens every screen, and the same before/after script can run there against Venus's own baseline.
4. `check:screens` (375px and 1280px) for Material, as today, to catch a layout that depended on the old 48px icon button (`--icon-button-size` is read in `global.css`, `ui.css` and `src/ui.tsx`).

Order: (a) the `data-site-theme` attribute and the baseline, in one pull request with no visible change; (b) the sizes and the class, behind the attribute, with the release note; (c) Venus checked in `morpheme-apps` when its pin moves.

## 7. Shadows at rest (decided) and the proposed build pull requests

**Shadows (rows 16 and 17), owner: "Yes, add shadows to those three."** Parts at rest keep colour-only elevation: record it in `docs/material-deviations.md` with the M3 quote ("Resting level" lists elevated cards, buttons and chips at level 1, and so on, on `/styles/elevation/tokens`; we show those levels by colour). The menu (level 2), the dialog (level 3) and the snackbar (level 3, from `@material/web`; the M3 pages print no level for it) get the Material theme's two-layer shadow (`--mo-elevation-2-shadow`, `-3-`). The fallback shadows in `ui.css` 106 to 116 become Material's too (they now equal `global.css`), and colour sweep 12 is corrected. Build: set the three parts' `box-shadow` from the level tokens in `ui.css`, delete the soft fallback values, add the two deviation lines; check with the screens (a menu, a dialog and a snackbar open) and `check:colors`.

**Proposed build pull requests** (each its own pull request, in this order; fix sizes from section 2):

| # | Pull request | Rows | Size |
| - | ------------ | ---- | ---- |
| 1 | Deviations doc: the lines of section 3 (rest shadows, icons 20, table rule, settle times), colour sweep 12 corrected | 16, 17, 3, 18 | small |
| 2 | Button and icon button sizes at M3 (section 6): step (a) the `data-site-theme` attribute and the size baseline, step (b) the sizes and `.button-medium`, step (c) Venus checked | 1, 2, 3, 4 | large, three steps |
| 3 | Icons: text fields and the select's arrow to 24, the FAB menu's close icon to 20 | 5 | small |
| 4 | Shadows: menu, dialog, snackbar, and the fallback shadows | 16, 17 | small |
| 5 | Hint full stops: remove them from single sentences in `en-US`, `da-DK` and `defaults/collections.ts`, with the check | 28 | medium |
| 6 | Hidden: fix the demo's two texts; rename "Hide from search engines" to "No index" and add "No follow" (a product change with its own release note and a CLAUDE.md line) | 26 | medium |
| 7 | Table: no code; align `docs/superpowers/specs/2026-11-13-table-md2-design.md` (corner medium 12dp) | none | small |
| 8 | Motion: the five hand-written animations, the fallback `--motion-*`, and the settle times | 18, 19, 20 | small |
| 9 | Disabled and hover values: 38% and 10%, search bar hover 8%; the check rule | 14, 15 | small |
| 10 | Tap targets: the parts screen and field editors (the footer links are already their own pull request) | 7 | medium |
| 11 | Type: loose Tailwind sizes and weights to the role classes, the inherited tracking, weight 600, small button and label line heights; screen by screen | 8 to 12 | large |
| 12 | Spacing: the fractional rem values | 13 | small |
| 13 | Words: "canceled", On/Off wording, then the long and passive texts | 24, 25, 27 | large, many small edits |

**Open questions: none.** Questions 1 to 7 are decided, and so are the two that came after: Danish full stops (yes, same rule as English; the owner's choice, M3's page is English-only) and the menu and list icons (keep 20, the Expressive size; the baseline 24 is printed beside it, section "Icons"). One confirm line remains: the snackbar's shadow level 3, which M3 does not print (it comes from `@material/web`).
