# Deviations from Material Design

Every place where we deliberately do something other than Material Design 3 (M3) is listed here, so we know we took the
decision. Each entry says what Material says, what we do instead, why, the date and the pull request. A deviation that
is not listed here is a bug. Add the entry in the same pull request as the change.

Entries from the colour sweep and the CSS sweep were sent by those workers on 2026-11-13; the owner decisions on section
colours are from the contrast work of the same day (`npm run check:contrast`, `scripts/check-contrast.mjs`).

## Section colours (contrast)

Source: `theme/styles/global.css` (the section swap block), `theme/styles/blocks.css`, `src/editor.css`.

### 1. A coloured section is an inverted theme, not M3's role set

- **Material:** the colour roles keep their meaning everywhere; a surface is a tone of the scheme, text on it is its `on-*` role.
- **We do:** in a section on Primary, Secondary or Tertiary the roles are swapped once for the blocks in it: `--mo-surface` is the section colour, `--mo-on-surface` and `--mo-primary` are the section's text colour, `--mo-on-primary` is the section colour.
- **Why:** every block has one set of styles and follows every section colour by itself, in the site and in the editor.
- **Date:** 2026-11-13 (listed; the design is older). **PR:** none.

### 2. Surface containers in a section are veils of the text colour, not opaque tones

- **Material:** `surface-container-lowest` to `-highest` are opaque tones of the scheme.
- **We do:** in a coloured section they are the section's text colour at 6, 8, 10, 12 and 14% over the section colour (were 10, 12, 14, 18 and 22%).
- **Why:** the section stays one colour with quiet tiles, and text on every tile keeps 4.5:1 or more in light and dark mode. The elevation levels (`--mo-elevation-N-color`) take these containers, so an elevated part is a tone, not a white overlay.
- **Date:** 2026-11-13, owner decision. **PR:** #491 (elevation colours: #473).

### 3. Quieter text in a section is the full text colour

- **Material:** `on-surface-variant` is a lower-emphasis role than `on-surface`.
- **We do:** in a coloured section `--mo-on-surface-variant` and `--block-muted` are the section's full text colour. The hierarchy is the type size and weight.
- **Why:** at 80% no tile keeps 4.5:1 in light mode (3.1 to 4.2:1 measured).
- **Date:** 2026-11-13, owner decision. **PR:** #492.

### 4. Placeholders and icons are held to WCAG AA, not M3's 60% and 38%

- **Material:** a placeholder is 60% of the on-colour and a disabled part is 38%.
- **We do:** placeholders keep 4.5:1, slot icons and control borders 3:1 on every section colour (`check:screens`, `check:contrast`). Disabled parts are exempt, as in WCAG 1.4.3.
- **Why:** 60% fails 4.5:1 on most backgrounds. A part that is not disabled is never drawn at 38%; the faded "Add button" under a card takes `on-surface-variant` instead of an opacity.
- **Date:** 2026-11-13. **PR:** #476.

## Colour sweep

Allow-list: `scripts/check-colors.allow.mjs` (came in with #469). Audit: `docs/superpowers/2026-11-13-colour-sweep-audit.md`.

1. **Status badges** (`--badge-ok`, `--badge-minor`, `--badge-major`, `theme/styles/global.css`). M3 has no success or warning role. We use fixed colours, darker in light mode and brighter in dark mode, because no role fits. The M3 way is custom or extended colours, a seed per status harmonised with the primary, each generating four roles; that is proposed as a later decision in the audit doc and not built. 2026-11-13. #469.
2. **PageSpeed ratings in the editor** (`--editor-status-good/average/bad`, `src/editor.css`). PageSpeed's own red, orange and green, fixed so they match what the tool reports. 2026-11-13. #469.
3. **Google search-result preview** (`--google-*`, `src/editor.css`, light and dark). It imitates Google's own look, so it is fixed. 2026-11-13. #469.
4. **Colour picker** (`src/ui.tsx`, `src/Parts.tsx`): hue and saturation gradients, default swatches, and black or white text on a swatch chosen by contrast. The owner's chosen colour is not a role. 2026-11-13. #469.
5. **Preview frame** (`bg-white` in `PreviewScreen.tsx` and `ui.tsx`) and the white picker thumb (`border-white`). The Preview shows the page on paper, whatever the editor's colours; the thumb is white over any colour. 2026-11-13. #469.
6. **Video still** (`.video-facade-*` in `theme/styles/blocks.css`): white title and play button over a black gradient scrim on an image. M3 would use the scrim role plus an on-colour. We use fixed black and white because the image is arbitrary and the title must stay readable on it. 2026-11-13. #469.
7. **Image masks** (`mask-image: linear-gradient(#000 …)` in `blocks.css` and `Testimonial.tsx`). Only alpha matters, so `#000` is just the opaque stop. 2026-11-13. #469.
8. **Scrim and shadow roles** are `#000000` in `lib/dynamic-colors.ts`, which is M3's own definition. The scheme seeds in `defaults/colors.ts` and `demo/src/site/colors.ts` are fixed `source: '#…'`. 2026-11-13. #469.
9. **Brand mark favicons and the example SVG image** in `src/examples.ts`. They are images, not themed parts. 2026-11-13. #469.
10. **Sign-in page of the AI connection** (`worker/mcp-oauth.js`). A standalone page with no theme CSS, so it uses CSS system colours (`ButtonFace`, `AccentColor`, …) and `color-scheme: light dark` instead of M3 roles. 2026-11-13. #478.
11. **Block variable defaults** (`--block-*` in `blocks.css`). Older non-M3 variable names kept as aliases of the roles; the defaults now map to the roles, as `base.css` does. Kept because the blocks and every theme use them. 2026-11-13. #480.
12. **Elevation and panel shadows** (`--mo-elevation-N-shadow`, `--panel-shadow`). They use `--mo-shadow`, but the blur and spread values are our own, softer than Material's. Not yet compared with the M3 spec: check before relying on it. 2026-11-13. #470.

Not deviations, fixed to M3: hover 5% and 6% became M3's 8% (#474), and the snackbar fallbacks use the inverse roles (#471).

## CSS sweep

Allow-list: #477.

1. **Dialog corner:** 28dp (extra-large) or 32dp (extra-large-increased), the Expressive set. Owner decision. 2026-11-13. No PR.
2. **Menu corner:** 4dp in the old tokens; we use 16dp (large), the Expressive vertical menu. 2026-11-13. No PR.
3. **Hero buttons 56px and list rows 56, 72 and 88px:** the Expressive sizes, kept on purpose. 2026-11-13. No PR.
4. **Icon button:** M3 has a 40dp container with a 48dp target; we draw 48dp, so the target is always met. 2026-11-13. No PR.
5. **Focus ring:** matches the part's shape, with one 6px round-off for any element. `base.css`. 2026-11-13. #477.
6. **Checkbox error ring:** corner 3px over the 2px box (M3 2dp). `ui.css`. 2026-11-13. #477.
7. **Slider inner track corner** 2px (= M3), **inline code corner** 0.3em (follows the text size), and the fallback corners in `base.css` and `blocks.css` for themes with no steps. 2026-11-13. #477.
8. **Spacing:** there are no `--mo-space-*` tokens yet; Tailwind's 4dp scale is not M3's. M3 prints an 8dp scale ("The spacing system is measured on an 8dp scale, where space100 = 8dp", Space 0 to 900 = 0 to 72dp, m3.material.io/m3/pages/spacing), which the plan moves to (`docs/superpowers/specs/2026-11-13-editor-uses-theme-parts-audit.md`, row 11). The undefined `var(--mo-space-4, 4px)` fallbacks became plain values. 2026-11-13. #488.
9. **Type:** the editor's page preview draws the site's headings and texts at the sizes of the components' classes (`[data-look]` sizes, `editor.css`), not M3 steps, so the preview matches the site; they move together with the site's blocks. Site `text-lg`, `text-xl` and `text-4xl`, `rounded-md` and the tracking value moved to M3 steps in #490. Some `font-size`, `line-height` and `letter-spacing` in `blocks.css`, `ui.css`, `global.css`, `base.css` and `components.css` are not yet moved to the type scale (tracked for the next pull request of the shape and type sweep). 2026-11-13. #477, #490.
10. **Search-result preview and crop handles** (`scripts/check-css-values.allow.mjs`): `text-[20px]` with `leading-[22px]` and `leading-[26px]` are Google's own look (20px and 26px title, 22px lines), not M3 steps; `rounded-[3px]` (a crop handle's corner), `rounded-[1.375rem]` (the app icon's own 22px corner, as on a phone's home screen), `border-[1.5px]` (the crop handle's line) and `border-[3px]` are not steps of a scale. 2026-11-13. #477, #490.

## Editor-only parts

A part is a theme part only if the front end could reuse it (owner, 2026-11-13). The parts below stay in the editor on purpose.

1. **Score ring** (`ScoreRing`, `src/ui.tsx`): the SEO score as a ring with a tone. M3 has a circular progress indicator, but the ring shows a score with its own tones and the front end never shows one ("a very specific component that is not reusable in front end"), so it stays the editor's own and takes its colours and sizes from tokens. 2026-11-13, owner decision. #515.
2. **Colour and icon pickers** (`ColorWheel`, `ColorSwatches`, `IconPicker`, `IconSwatches`): editor tools the front end does not use. 2026-11-13, owner decision. #515.

## Editor-only bars (owner decisions, 13 Nov)

The editor's own bars are its workspace, where the owner allows deviations. Each is listed with what M3 prints (m3.material.io, read 13 Nov 2026).

3. **Save bar is the standard bottom sheet:** M3: "Bottom sheets display supplementary content and actions on a mobile screen", "Content should be additional or secondary (not the app's main content)", "Use bottom sheets in compact and medium breakpoints". We use the standard bottom sheet, docked as a bar at the bottom on every width, for the page's Save row, with no blur and no custom design. Why: owner decision, "If it's the same bar at the bottom of the screen on pages and blocks, it should use the bottom sheet design and not its own custom design." 2026-11-13. #515 (spec only).
4. **Contextual toolbar is a docked row below the main toolbar:** M3: docked toolbars are "best used for global actions that remain the same across multiple pages", floating toolbars for "contextual actions relevant to the body content or the specific page". We use the docked kind for the contextual actions. Why: owner decision, replacing the floating bars everywhere. 2026-11-13. #515 (spec only; its design is in a separate spec). **Replaced by entries 5 to 11: the owner chose one bar, not a second row.**

## The text's one bar (owner decisions, 13 Nov; spec `docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md`, PR 1)

Read 13 Nov 2026 on m3.material.io: `/components/toolbars/` (guidelines, specs, accessibility), `/components/menus/guidelines`, `/foundations/designing/structure` and the density page. The bar is the editor's own workspace.

5. **Contextual tools in the docked toolbar:** M3: "Docked toolbar: … best used for global actions that remain the same across multiple pages. Floating toolbar: … best used for contextual actions relevant to the body content or the specific page." We: one docked bar holds the text tools (contextual) and the main tools (Insert, Undo, Redo, Section settings). Why: owner decision, one bar for everything ("No, we shouldn't keep two rows"). 2026-11-13.
6. **Docked toolbar at the top:** M3: "Only place docked toolbars at the bottom of the window." We: the top of the text editor, where today's toolbar already is; it stays with the text. Why: the bottom is the keyboard and the save bar. 2026-11-13.
7. **Bar height 44 dp, not 64 dp:** M3: "By default all toolbars are 64dp high"; shorter only "if vertical space is limited". We: 44 dp on every screen size, no padding above or below the buttons. Why: it sits over the text and a phone is short; owner decision. 2026-11-13.
8. **Editor bar and menus ignore the user's density choice:** M3: "People can change density as long as the density controls are accessible" and "Density shouldn't automatically change across breakpoints or orientation unless a person changes it". We: the bar, its `⋮` list and its menus have one fixed size, whatever the person chooses. Why: owner decision, an editor's own UI should take little room. 2026-11-13.
9. **44 × 44 dp buttons and rows in the bar and its menus, not 48:** M3: "All elements need a minimum 48x48dp target area to be accessible." (toolbars/guidelines), "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." (density). We: the buttons and rows are 44 × 44 dp themselves, with 20 dp icons, only in the bar and its menus; everything else stays on 48. Menu rows at 44 dp with 20 dp icons match M3 Expressive's menu tokens (menus/specs, "Menu item height 44dp", "Menu item leading icon size 20dp"); the bar's 20 dp icon is the owner's choice (M3's icon-button size in a toolbar was not readable: images and token tables). Why: owner decision, following Apple's Human Interface Guidelines ("a button needs a hit region of at least 44x44 pt"). 2026-11-13.
10. **Rows that do not apply are hidden, not disabled (Text style in a list item or a heading):** M3: "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed." We: in a list item the heading rows and Quote are hidden; in a heading the list rows and Quote are hidden. Why: owner decision ("No headings in the list item text list. And no list item in the menu if in a heading."); Quote is hidden in both by the PM, open for the owner's correction. 2026-11-13.
11. **The `⋮` is a pop-up menu on a phone, with an overlay scrollbar:** M3: "Consider adapting menus into bottom sheets on small screens." and "Menus can scroll when all menu items can't display at once. In this state, menus show a persistent scrollbar." We: a pop-up under the button on every width; `scrollbar-width: thin` and `scrollbar-gutter: stable` keep a scrollbar in view where the platform allows (a computer), and a phone's overlay scrollbar hides when idle and cannot be forced. Why: owner decision (the text keeps its cursor and the keyboard stays open); the platform. M3's "Don't use gaps in scrollable menus" is met: the menu uses dividers only. 2026-11-13.

M3 is silent on how a toolbar animates when its items change; the slide of the contextual tools comes in a later pull request of the plan (PR 3) with its own entry.

## Density (owner decisions, 13 Nov; spec `docs/superpowers/specs/2026-11-13-density-design.md`, PR 2)

Read 13 Nov 2026 on m3.material.io: `/foundations/layout/grids-spacing/density`, `/components/segmented-buttons/specs`, `/components/chips/specs`, `/components/text-fields/specs`, `/components/buttons/specs`, `/components/lists/specs`.

12. **Large (+1) is a step above M3's default:** M3: "The density scale is numbered, starting at 0 for a component's default density. The scale moves to negative numbers (-1, -2, -3) as space decreases, creating higher density." M3 has no step above 0. We: Large adds 4 dp to the height (or 2 dp a side of padding), by the same rule M3 gives for a step down. Why: the owner's screenshot of the density page offers Large, Medium and Small.
13. **Horizontal padding does not change with density:** M3's text: "Text size shouldn't change as the container size scales." and "Center the grouped element within the component container." It prints no rule for the left and right padding. We: only height and vertical padding follow density (owner rule), so text and grids stay aligned.
14. **A list row is never lower than the target:** M3: "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." and "Target size must be at least 48x48dp" (lists/specs). The row is its own target, so at -2 and -3 (a theme's choice) it stays at 48 dp on touch and 44 dp for a mouse (`--mo-target`), instead of shrinking the image and keeping a hit area.
15. **Buttons, chips and segmented buttons get an invisible target area:** M3: "Touch targets are the parts of the screen that respond to user input, extending beyond the visual bounds of an element." (structure, Target sizes), and "Pointer targets … minimums 44 x 44dp". We: a part lower than `--mo-target` gets an invisible area down from its middle (a `::after`), at every step, so Small never shrinks a target. A removable chip, which has buttons in it, has none.

## Footer links (owner decision, 14 Nov)

Read 14 Nov 2026 on m3.material.io: `/foundations/designing/structure` (the target-size section; `/foundations/accessible-design/accessibility-basics` has no text on targets).

16. **Footer links are 36 px high, not 48:** M3 (structure): "For most platforms, consider making touch targets at least 48 x 48dp.", "Consider making pointer targets minimums 44 x 44dp.", "targets separated by 8dp of space or more promote balanced information density and usability." (M3 words these as "consider", not "must".) We: the editor footer's links (Support, System status, Report security issues, Privacy policy, Licenses) are exactly 36 px high on every width, the padding on the link itself, 12 px each side, no overlap. M3 is silent on text links in a footer and on a smaller target for a dense workspace. Why: owner decision, "Make the footer links 36px high clickable" (phone screenshot of the footer's two lines), in the editor's own workspace. `check:screens` (`checkFooterTargets`) names this exception and asserts 36 px at 320, 375 and 1280 px. 2026-11-14.
