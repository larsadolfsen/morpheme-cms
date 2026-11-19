# Deviations from Material Design

Every place where we deliberately do something other than Material Design 3 (M3) is listed here, so we know we took the
decision. Each entry says what Material says, what we do instead, why, the date and the pull request. A deviation that
is not listed here is a bug. Add the entry in the same pull request as the change.

**Which M3 we follow** (owner, 15 Nov 2026): the theme follows Material 3 Expressive wherever a component has an Expressive variant; otherwise baseline M3.

**Priority order** (owner, 15 Nov 2026): 1. Modern web, 2. M3 Expressive, 3. M3, 4. M2 with M3 styling. Where they conflict, the lower number wins.

Entries from the colour sweep and the CSS sweep were sent by those workers on 2026-11-13; the owner decisions on section
colours are from the contrast work of the same day (`npm run check:contrast`, `scripts/check-contrast.mjs`).

## Section colours (contrast)

Source: `theme/styles/global.css` (the section swap block), `theme/styles/blocks.css`, `src/editor.css`.

### 1. A coloured section is an inverted theme, not M3's role set

- **Material:** the colour roles keep their meaning everywhere; a surface is a tone of the scheme, text on it is its `on-*` role.
- **We do:** in a section on Primary, Secondary or Tertiary the roles are swapped once for the blocks in it: `--mo-sys-color-surface` is the section colour, `--mo-sys-color-on-surface` and `--mo-sys-color-primary` are the section's text colour, `--mo-sys-color-on-primary` is the section colour.
- **Why:** every block has one set of styles and follows every section colour by itself, in the site and in the editor.
- **Date:** 2026-11-13 (listed; the design is older). **PR:** none.

### 2. Surface containers in a section are veils of the text colour, not opaque tones

- **Material:** `surface-container-lowest` to `-highest` are opaque tones of the scheme.
- **We do:** in a coloured section they are the section's text colour at 6, 8, 10, 12 and 14% over the section colour (were 10, 12, 14, 18 and 22%).
- **Why:** the section stays one colour with quiet tiles, and text on every tile keeps 4.5:1 or more in light and dark mode. The elevation levels (`--mo-elevation-N-color`) take these containers, so an elevated part is a tone, not a white overlay.
- **Date:** 2026-11-13, owner decision. **PR:** #491 (elevation colours: #473).

### 3. Quieter text in a section is the full text colour

- **Material:** `on-surface-variant` is a lower-emphasis role than `on-surface`.
- **We do:** in a coloured section `--mo-sys-color-on-surface-variant` and `--mo-sys-block-muted` are the section's full text colour. The hierarchy is the type size and weight.
- **Why:** at 80% no tile keeps 4.5:1 in light mode (3.1 to 4.2:1 measured).
- **Date:** 2026-11-13, owner decision. **PR:** #492.

### 4. Placeholders and icons are held to WCAG AA, not M3's 60% and 38%

- **Material:** a placeholder is 60% of the on-colour and a disabled part is 38%.
- **We do:** placeholders keep 4.5:1, slot icons and control borders 3:1 on every section colour (`check:screens`, `check:contrast`). Disabled parts are exempt, as in WCAG 1.4.3.
- **Why:** 60% fails 4.5:1 on most backgrounds. A part that is not disabled is never drawn at 38%; the faded "Add button" under a card takes `on-surface-variant` instead of an opacity.
- **Date:** 2026-11-13. **PR:** #476.

## Colour sweep

Allow-list: `scripts/check-colors.allow.mjs` (came in with #469). Audit: `docs/superpowers/2026-11-13-colour-sweep-audit.md`.

1. **Status badges** (`--mo-comp-badge-ok`, `--mo-comp-badge-minor`, `--mo-comp-badge-major`, `theme/styles/tokens/material/comp/badge.css`). M3 has no success or warning role. We use fixed colours, darker in light mode and brighter in dark mode, because no role fits. The M3 way is custom or extended colours, a seed per status harmonised with the primary, each generating four roles; that is proposed as a later decision in the audit doc and not built. 2026-11-13. #469.
2. **PageSpeed ratings in the editor** (`--mo-comp-editor-status-good/average/bad`, `src/editor.css`). PageSpeed's own red, orange and green, fixed so they match what the tool reports. 2026-11-13. #469.
3. **Google search-result preview** (`--google-*`, `src/editor.css`, light and dark). It imitates Google's own look, so it is fixed. 2026-11-13. #469.
4. **Colour picker** (`src/ui.tsx`, `src/Parts.tsx`): hue and saturation gradients, default swatches, and black or white text on a swatch chosen by contrast. The owner's chosen colour is not a role. 2026-11-13. #469.
5. **Preview frame** (`bg-white` in `PreviewScreen.tsx` and `ui.tsx`) and the white picker thumb (`border-white`). The Preview shows the page on paper, whatever the editor's colours; the thumb is white over any colour. 2026-11-13. #469.
6. **Video still** (`.video-facade-*` in `theme/styles/blocks.css`): white title and play button over a black gradient scrim on an image. M3 would use the scrim role plus an on-colour. We use fixed black and white because the image is arbitrary and the title must stay readable on it. 2026-11-13. #469.
7. **Image masks** (`mask-image: linear-gradient(#000 …)` in `blocks.css` and `Testimonial.tsx`). Only alpha matters, so `#000` is just the opaque stop. 2026-11-13. #469.
8. **Scrim and shadow roles** are `#000000` in `lib/dynamic-colors.ts`, which is M3's own definition. The scheme seeds in `defaults/colors.ts` and `demo/src/site/colors.ts` are fixed `source: '#…'`. 2026-11-13. #469.
9. **Brand mark favicons and the example SVG image** in `src/examples.ts`. They are images, not themed parts. 2026-11-13. #469.
10. **Sign-in page of the AI connection** (`worker/mcp-oauth.js`). A standalone page with no theme CSS, so it uses CSS system colours (`ButtonFace`, `AccentColor`, …) and `color-scheme: light dark` instead of M3 roles. 2026-11-13. #478.
11. **Block variable defaults** (`--block-*` in `blocks.css`). Older non-M3 variable names kept as aliases of the roles; the defaults now map to the roles, as `base.css` does. Kept because the blocks and every theme use them. 2026-11-13. #480.
12. **Elevation and panel shadows** (`--mo-elevation-N-shadow`, `--mo-sys-panel-shadow`). They use `--mo-sys-color-shadow`, but the blur and spread values are our own, softer than Material's. Not yet compared with the M3 spec: check before relying on it. 2026-11-13. #470. (changed 18 Nov 2026: cards and lists plan): resting shadows are on at every level (`--mo-sys-elevation-levelN-rest-shadow` is `--mo-sys-elevation-levelN-shadow`, owner: "Follow the token: 1dp shadow at rest"), and each part on level 1 or higher is checked against its M3 token page (`/styles/elevation/tokens`); a part names its level and never writes its own shadow.

Not deviations, fixed to M3: hover 5% and 6% became M3's 8% (#474), and the snackbar fallbacks use the inverse roles (#471).

## CSS sweep

Allow-list: #477.

1. **Dialog corner:** 28dp (extra-large) or 32dp (extra-large-increased), the Expressive set. Owner decision. 2026-11-13. No PR.
2. **Menu corner:** 4dp in the old tokens; we use 16dp (large), the Expressive vertical menu. 2026-11-13. No PR.
3. **Hero buttons 56px and list rows 56, 72 and 88px:** the Expressive sizes, kept on purpose. 2026-11-13. No PR.
4. **Icon button:** M3 has a 40dp container with a 48dp target; we draw 48dp, so the target is always met. 2026-11-13. No PR.
5. **Focus ring:** matches the part's shape, with one 6px round-off for any element. `base.css`. 2026-11-13. #477. (changed 18 Nov 2026: cards and lists plan): one ring for every part, `--mo-sys-color-primary`, 3dp, offset 2dp, `border-radius: inherit` (deviation FR1, One focus ring, in primary); a part with its own inset ring keeps its component's offset as a component variable.
6. **Checkbox error ring:** corner 3px over the 2px box (M3 2dp). `ui.css`. 2026-11-13. #477.
7. **Slider inner track corner** 2px (= M3), **inline code corner** 0.3em (follows the text size), and the fallback corners in `base.css` and `blocks.css` for themes with no steps. 2026-11-13. #477.
8. **Spacing:** there are no `--mo-space-*` tokens yet; Tailwind's 4dp scale is not M3's. M3 prints an 8dp scale ("The spacing system is measured on an 8dp scale, where space100 = 8dp", Space 0 to 900 = 0 to 72dp, m3.material.io/m3/pages/spacing), which the plan moves to (`docs/superpowers/specs/2026-11-13-editor-uses-theme-parts-audit.md`, row 11). The undefined `var(--mo-space-4, 4px)` fallbacks became plain values. 2026-11-13. #488.
9. **Type:** the editor's page preview draws the site's headings and texts at the sizes of the components' classes (`[data-look]` sizes, `editor.css`), not M3 steps, so the preview matches the site; they move together with the site's blocks. Site `text-lg`, `text-xl` and `text-4xl`, `rounded-md` and the tracking value moved to M3 steps in #490. Some `font-size`, `line-height` and `letter-spacing` in `blocks.css`, `ui.css`, `global.css`, `base.css` and the site shell's files (`site-*.css`) are not yet moved to the type scale (tracked for the next pull request of the shape and type sweep). 2026-11-13. #477, #490.
10. **Search-result preview and crop handles** (`scripts/check-css-values.allow.mjs`): `text-[20px]` with `leading-[22px]` and `leading-[26px]` are Google's own look (20px and 26px title, 22px lines), not M3 steps; `rounded-[3px]` (a crop handle's corner), `rounded-[1.375rem]` (the app icon's own 22px corner, as on a phone's home screen), `border-[1.5px]` (the crop handle's line) and `border-[3px]` are not steps of a scale. 2026-11-13. #477, #490.

## Editor-only parts

A part is a theme part only if the front end could reuse it (owner, 2026-11-13). The parts below stay in the editor on purpose.

1. **Score ring** (`ScoreRing`, `src/ui.tsx`): the SEO score as a ring with a tone. M3 has a circular progress indicator, but the ring shows a score with its own tones and the front end never shows one ("a very specific component that is not reusable in front end"), so it stays the editor's own and takes its colours and sizes from tokens. 2026-11-13, owner decision. #515.
2. **Colour and icon pickers** (`ColorWheel`, `ColorSwatches`, `IconPicker`, `IconSwatches`): editor tools the front end does not use. 2026-11-13, owner decision. #515.

## Editor-only bars (owner decisions, 13 Nov)

The editor's own bars are its workspace, where the owner allows deviations. Each is listed with what M3 prints (m3.material.io, read 13 Nov 2026).

3. **Save bar is the standard bottom sheet (done for the page form; the block page and the crop view on 15 Nov, B1 and C1):** M3: "Bottom sheets display supplementary content and actions on a mobile screen", "Content should be additional or secondary (not the app's main content)", "Use bottom sheets in compact and medium breakpoints". We use the standard bottom sheet, docked as a bar at the bottom on every width, for the page's Save row, with no blur and no custom design. Why: owner decision, "If it's the same bar at the bottom of the screen on pages and blocks, it should use the bottom sheet design and not its own custom design." 2026-11-13. #515 (spec only).
4. **Contextual toolbar is a docked row below the main toolbar:** M3: docked toolbars are "best used for global actions that remain the same across multiple pages", floating toolbars for "contextual actions relevant to the body content or the specific page". We use the docked kind for the contextual actions. Why: owner decision, replacing the floating bars everywhere. 2026-11-13. #515 (spec only; its design is in a separate spec). **Replaced by entries 5 to 11: the owner chose one bar, not a second row.**

## The text's one bar (owner decisions, 13 Nov; spec `docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md`, PR 1)

Read 13 Nov 2026 on m3.material.io: `/components/toolbars/` (guidelines, specs, accessibility), `/components/menus/guidelines`, `/foundations/designing/structure` and the density page. The bar is the editor's own workspace.

5. **Contextual tools in the docked toolbar:** M3: "Docked toolbar: … best used for global actions that remain the same across multiple pages. Floating toolbar: … best used for contextual actions relevant to the body content or the specific page." We: one docked bar holds the text tools (contextual), the tools of the block typed in place that is active (Add above, Add below, Move, Link, the gear; its own menu in the `⋮`) and the main tools (Insert, Undo, Redo, Section settings). The floating row over a block is gone from the text editor; the list screen of a list the owner made keeps it (it is not the editor's workspace, and M3's floating toolbar is for exactly that). Why: owner decision, one bar for everything ("No, we shouldn't keep two rows"). 2026-11-13.
6. **Docked toolbar at the top:** M3: "Only place docked toolbars at the bottom of the window." We: the top of the text editor, where today's toolbar already is; it stays with the text. Why: the bottom is the keyboard and the save bar. 2026-11-13.
7. **Bar height 44 dp, not 64 dp:** M3: "By default all toolbars are 64dp high"; shorter only "if vertical space is limited". We: 44 dp on every screen size, no padding above or below the buttons. Why: it sits over the text and a phone is short; owner decision. 2026-11-13.
8. **Editor bar and menus ignore the user's density choice:** M3: "People can change density as long as the density controls are accessible" and "Density shouldn't automatically change across breakpoints or orientation unless a person changes it". We: the bar, its `⋮` list and its menus have one fixed size, whatever the person chooses. Why: owner decision, an editor's own UI should take little room. 2026-11-13.
9. **44 × 44 dp buttons and rows in the bar and its menus, not 48:** M3: "All elements need a minimum 48x48dp target area to be accessible." (toolbars/guidelines), "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." (density). We: the buttons and rows are 44 × 44 dp themselves, with 20 dp icons, only in the bar and its menus; everything else stays on 48. Menu rows at 44 dp with 20 dp icons match M3 Expressive's menu tokens (menus/specs, "Menu item height 44dp", "Menu item leading icon size 20dp"); the bar's 20 dp icon is the owner's choice (M3's icon-button size in a toolbar was not readable: images and token tables). Why: owner decision, following Apple's Human Interface Guidelines ("a button needs a hit region of at least 44x44 pt"). 2026-11-13.
10. **Rows that do not apply are hidden, not disabled (Text style in a list item or a heading):** M3: "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed." We: in a list item the heading rows and Quote are hidden; in a heading the list rows and Quote are hidden. Why: owner decision ("No headings in the list item text list. And no list item in the menu if in a heading."); Quote is hidden in both by the PM, open for the owner's correction. 2026-11-13.
11. **The `⋮` is a pop-up menu on a phone, with an overlay scrollbar:** M3: "Consider adapting menus into bottom sheets on small screens." and "Menus can scroll when all menu items can't display at once. In this state, menus show a persistent scrollbar." We: a pop-up under the button on every width; `scrollbar-width: thin` and `scrollbar-gutter: stable` keep a scrollbar in view where the platform allows (a computer), and a phone's overlay scrollbar hides when idle and cannot be forced. Why: owner decision (the text keeps its cursor and the keyboard stays open); the platform. M3's "Don't use gaps in scrollable menus" is met: the menu uses dividers only. 2026-11-13.

12. **The contextual tools slide in and push the main tools right, and slide out again:** M3 describes no such behaviour. The only motion text read (m3.material.io/components/toolbars/guidelines, 13 Nov 2026): "Docked toolbars can either remain on the screen during scroll, or animate offscreen", the floating toolbar can "collapse into a single, high-emphasis action on scroll", and "Don't collapse actions and scroll at the same time."; how a toolbar's items animate when they change is not described. We: when a context starts (the cursor in the text, a block active) its tools and their divider slide in from the leading side and push the main tools and the `⋮` along; when it ends they slide out and the main tools slide back; from one context to another the tools cross-fade in place (the old ones fade out as the new ones fade in, no second slide; owner decision 14 Nov). Only the theme's springs (`motionTiming`: `--mo-sys-motion-spring-fast-spatial`, `--mo-sys-motion-spring-default-effects`), nothing when the visitor asked for reduced motion, and the bar's height and dividers never move. Why: owner decision, 13 Nov ("the contextual menu slides in from the left and pushes the main menu to the right"), PR 3 of the plan. 2026-11-13.

## Density (owner decisions, 13 Nov; spec `docs/superpowers/specs/2026-11-13-density-design.md`, PR 2)

Read 13 Nov 2026 on m3.material.io: `/foundations/layout/grids-spacing/density`, `/components/segmented-buttons/specs`, `/components/chips/specs`, `/components/text-fields/specs`, `/components/buttons/specs`, `/components/lists/specs`.

12. **Large (+1) is a step above M3's default:** M3: "The density scale is numbered, starting at 0 for a component's default density. The scale moves to negative numbers (-1, -2, -3) as space decreases, creating higher density." M3 has no step above 0. We: Large adds 4 dp to the height (or 2 dp a side of padding), by the same rule M3 gives for a step down. Why: the owner's screenshot of the density page offers Large, Medium and Small.
13. **Horizontal padding does not change with density:** M3's text: "Text size shouldn't change as the container size scales." and "Center the grouped element within the component container." It prints no rule for the left and right padding. We: only height and vertical padding follow density (owner rule), so text and grids stay aligned.
14. **A list row is never lower than the target:** M3: "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." and "Target size must be at least 48x48dp" (lists/specs). The row is its own target, so at -2 and -3 (a theme's choice) it stays at 48 dp on touch and 44 dp for a mouse (`--mo-sys-target-size`), instead of shrinking the image and keeping a hit area.
15. **Buttons, chips and segmented buttons get an invisible target area:** M3: "Touch targets are the parts of the screen that respond to user input, extending beyond the visual bounds of an element." (structure, Target sizes), and "Pointer targets … minimums 44 x 44dp". We: a part lower than `--mo-sys-target-size` gets an invisible area down from its middle (a `::after`), at every step, so Small never shrinks a target. A removable chip, which has buttons in it, has none.

## Footer links (owner decision, 14 Nov)

Read 14 Nov 2026 on m3.material.io: `/foundations/designing/structure` (the target-size section; `/foundations/accessible-design/accessibility-basics` has no text on targets).

16. **Footer links are 36 px high, not 48:** M3 (structure): "For most platforms, consider making touch targets at least 48 x 48dp.", "Consider making pointer targets minimums 44 x 44dp.", "targets separated by 8dp of space or more promote balanced information density and usability." (M3 words these as "consider", not "must".) We: the editor footer's links (Support, System status, Report security issues, Privacy policy, Licenses) are exactly 36 px high on every width, the padding on the link itself, 12 px each side, no overlap. M3 is silent on text links in a footer and on a smaller target for a dense workspace. Why: owner decision, "Make the footer links 36px high clickable" (phone screenshot of the footer's two lines), in the editor's own workspace. `check:screens` (`checkFooterTargets`) names this exception and asserts 36 px at 320, 375 and 1280 px. 2026-11-14.

## Image tiles in the Library (image grid, PR 1)

Read 14 Nov 2026 on m3.material.io (Playwright): `/components/cards/specs` (measurements), `/foundations/layout/applying-layout/compact`, `/foundations/layout/understanding-layout/overview` and `/foundations/interaction/selection`. The cards token tables stay collapsed in a script-less read, so the token values are not quoted here.

17. **Columns of an image grid:** M3 (layout): "Margins are 16dp from the leading and trailing edge of the window" on compact, and "Padding between cards: 8dp max" (cards/specs). M3 (grids, image) draws the layout grid with 4 columns on compact, 8 on medium and expanded and 12 on large and extra-large, and prints no count of cards per row. We: 2 columns on compact, 3 on medium and expanded, 4 from large (`.mo-staggered-grid`, CSS columns, `--mo-sys-grid-gutter` apart: 16 px on compact, 24 px from medium, the owner's values since M3 prints none), our choice on M3's breakpoints, set by the token `--mo-comp-grid-columns` (the start screen sets 2 on every size; a widget is full width or one column, `span`). Cards flow down each column, so the sort order reads down, then across. **Card gap:** M3 says "Padding between cards: 8dp max"; we use the gutter, 16 px on compact and 24 px from medium, for the cards of a grid too (owner, 15 Nov 2026, pull request #741); the cards block, price cards and panels moved onto it on 16 Nov 2026 (G1).

## Layout grid gutter (M3 grid audit)

Source: `docs/superpowers/specs/2026-11-15-m3-grid-everywhere-audit.md`. Read 15 Nov 2026 on m3.material.io (Playwright): `/foundations/layout/grids-spacing/grids` (the diagram shows 4, 8 and 12 columns; no margin or gutter value is printed), `/foundations/layout/canonical-examples/feed`, `/components/cards/specs`.

### G1. Cards are 16 px apart on compact and 24 px from medium, not 8 px

- **Material:** Cards specs: "Padding between cards 8dp max". M3 prints no gutter for the layout grid.
- **We do:** the theme's layout grid has one gutter, 16 px on compact and 24 px from medium (`--mo-sys-grid-gutter`, owner's numbers; margin is 16 px and 24 px the same way), and cards on the grid use it. It replaces `--mo-comp-card-gap` (0.5rem). Affected when they move onto the grid: the cards block, the cards carousel's grid from 600, the image grid block and the media grid (so entry 17's 8 px gap), price cards, the prices cards, panels, related posts and the editor's uses of `--mo-comp-card-gap`. **Moved 16 Nov 2026:** the cards block, the cards carousel's grid from 600, panels, price cards, the prices list (`.mo-block-pricecards__plans-list`) and related posts use `--mo-sys-grid-gutter` (`theme/styles/blocks.css`, `RelatedPosts.astro`; checked by `checkCardGutter` on `/blocks/cards/`, `/blocks/price-cards/` and `/blocks/image-grid/`). **Not moved:** the phone carousel scrolls its cards 8 px apart (M3 carousel), and the editor keeps `--mo-comp-card-gap` (8 px) as the small step for a block's row and handle, which is no gap between cards.
- **Why:** owner decision, 15 Nov 2026: "Cards use the 16/24 gutter too", relayed by the 0.18 project manager; one gutter for the whole grid, on the site and in the editor.
- **Date:** 2026-11-15. **PR:** #743 (the decision); the cards move in later pull requests, each of which keeps this entry current. (changed 18 Nov 2026: cards and lists plan): step 4 of the plan moves the site's cards (*Cards*, *Price cards*, *Notice*, *Table*, *Cookie list*, *Links* and the panels, *Image grid*, *Testimonials*, related posts, the 404 page) onto `Card` and the theme grid, without Tailwind; this entry stays current in that pull request.

## The block handle in the page editor (touch selection, step 8)

Read 13 Nov 2026 on m3.material.io (Playwright): `/foundations/interaction/gestures`, `/foundations/interaction/selection` and `/foundations/interaction/states/applying-states`. The page editor's blocks are the editor workspace, where a deviation is allowed.

18. **A block moves at once when its handle is dragged, not after a long press:** M3 (gestures): "Pick up and move: A long press and drag allows people to reorder content." We: every block has a drag handle (a button at its top right, 44 x 44, `touch-action: none`) that starts the drag as soon as the finger moves, as the start screen's cards do (`DashboardEdit.tsx`); the block is raised with the theme's elevation (`--mo-sys-elevation-level4-shadow`) and follows the finger, a line shows where it lands, the page scrolls by itself near its top and bottom edge, and it goes there when the finger is lifted. The handle is shown on every block with a touch, and on the block pointed at or in focus with a mouse (M3's hover state). A block the template locks has no handle and is not passed. Why: the handle is a drag control of its own, so the hold M3 prints for a bare item is not needed, and the owner decided the handle and its place ("Top right"); keyboard and screen reader users move a block with Move up and Move down. 2026-11-14.
## Lightbox (image grid, PR 5a)

Read 14 Nov 2026 on m3.material.io (Playwright, page text): `/components/dialogs/guidelines`, `/components/dialogs/accessibility`, `/styles/motion/overview/specs`. M3 prints no lightbox and no image viewer. The dialogs' token tables stay collapsed in a text read, so token values are not quoted.

19. **A lightbox is a modal dialog with its own markup, as large as the window from medium, with a see-through container:** M3 (dialogs, guidelines): "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog.", and "Dialogs are purposefully interruptive, so they should be used sparingly." We: the theme's `Lightbox` is a modal `<dialog>` with the dialog's container and its own header (only the close button) on every size (the theme has no full-screen dialog kind since `THEME_API` 5): the whole screen on a compact window, from medium a container as large as the window less 56 dp on each side (M3's own margin for a dialog placed by hand, from the spec's 13 Nov read) with the dialog's 28 dp corner, because a basic dialog's 280 to 560 dp width is too small for an image. The container is see-through over the scrim (the scrim colour at 88%, `--mo-comp-lightbox-surface`) instead of M3's surface container high, so the image floats on a dark layer; the controls and the caption take the colour opposite to the scrim (`--mo-comp-theme-on-scrim-colour`). Why: owner decision, the image grid spec ("a dark layer, in M3 terms the scrim"); M3 is silent on viewers. The images snap in a horizontal track (CSS scroll-snap, the nearest pattern: M3's carousel page says snap scrolling for full-screen layouts); the Previous and Next buttons are out of sight on a compact window and come back with the keyboard's focus. Motion: M3 web "Standard default effects 0.34, 0.80, 0.34, 1.00, 200ms" for the scrim and the controls, "Standard default spatial 0.27, 1.06, 0.18, 1.00, 500ms" for the image (the dialog's own tokens), instant with reduced motion; the move to the next image is the browser's smooth scroll, not M3's 350 ms fast spatial. Owner, 15 Nov 2026 (relayed by the 0.18 PM): the lightbox stays full-window on a phone and is not turned into a page, because it is a viewer for the site's visitors, not a view of the editor.

## The text bar

Source: `src/editor.css` (`.mo-editor-text-box`), `src/textBar.mjs`, `src/MarkdownEditor.tsx`. The bar is the editor workspace, so a deviation is allowed.

### The text's box is 10.5 dp from the screen's edges on a phone

- **Material:** M3 prints 16 dp margins on a phone (as the PM gave it; this entry did not re-read the m3.material.io page).
- **We do:** the text's box, with its bar, is 5.5 dp wider on each side below the medium breakpoint: 354 dp outer at 375 px (352 dp inside its 1 dp edges), 10.5 dp from each edge.
- **Why:** owner decision, 14 Nov 2026: eight 44 dp icons (four text tools, Undo, Redo, Insert block and the ⋮) fit on the bar.
- **Date:** 2026-11-14. **PR:** the pull request that adds this entry (text bar order).

### The bar has no divider and keeps Undo, Redo and Insert block at the right end

- **Material:** a toolbar groups its actions; M3 prints no rule for a fixed group at the end.
- **We do:** no divider on the bar; Undo, Redo and Insert block (then the ⋮) stand at the right end in every place.
- **Why:** owner decision, 14 Nov 2026: the same buttons in the same place whatever the cursor is in.
- **Date:** 2026-11-14. **PR:** the same.

### The text bar fills its width with as many tools as fit

- **Material:** a toolbar puts what does not fit "in an overflow menu in the trailing slot" and shows it again at larger sizes (toolbars/guidelines, read 13 Nov 2026); it prints no count per width.
- **We do:** no count of tools per screen width. The bar's inside width is a budget and each tool has a known width (`TOOL_WIDTH` in `src/textBar.mjs`, pinned to the drawn size by `check:screens`). The tools fill from the left in their order while the next one fits; the first that does not, and all after it, go in the `⋮`, so no gap as wide as the next tool is left. Undo, Redo, Insert block and the `⋮` stay at the right end; the `⋮` takes room only when something is in it.
- **Why:** owner requirement, 14 Nov 2026: the bar adapts and fits the maximum number of tools, also when the window is resized.
- **Date:** 2026-11-14. **PR:** the pull request that adds this entry (text bar width budget).

## Selecting several blocks of a page (touch selection, step 9)

Read 13 Nov 2026 on m3.material.io (Playwright): `/foundations/interaction/selection`, `/foundations/interaction/states/applying-states`. The page editor's blocks and its one bar are the editor workspace, where a deviation is allowed.

20. **The selection's tools are the contextual group of the text's one bar, not a swapped top bar; the count and the cross are one control:** M3 (selection): "To exit a selection mode, tap each selected item until they’re unselected, or tap an action on the toolbar." and "On desktop, checkboxes are always visible when selection is the primary activity. When selection is secondary, checkboxes (or other indicators) are displayed: As a single checkbox for that item on hover; For all items after one item is selected". M3 prints no bar of its own for a selection. We: a block's round mark (an empty circle, a filled circle with a check; centred on the block's top left corner so it covers nothing in the block, as in the page's photo-grid example) shows on the block pointed at and on every block once one is selected, never with a touch before that; a press and hold on a block's handle (or Space on a focused card, or *Select* in its menu) starts selecting, a tap or click adds or removes a block, and the text is read-only meanwhile. The one bar shows the count with a cross first (two slots wide; the cross clears the selection, as do Escape and Back) and in its `⋮` Duplicate (one block, and not where the template allows no more of it), Hide or Show (all selected), Remove (after a question that names the blocks and the ones the page needs, which stay selected) and Select all. Why: the owner decided the one toolbar for block selection ("Yes, use the one toolbar") and the handle's place; the cross and count in one control is the spec's own (section 6.5). Move up and Move down are on the bar and move the selection one place together; they are disabled, with the reason as `aria-description` and `title`, when the blocks are not next to each other or cannot go further (not past a locked block). With two or more selected every block's drag handle is shown disabled (`aria-disabled`, the theme's disabled colour, the same `aria-description` and `title`). M3 (applying states): "Disabled components can’t be focused, dragged, or pressed, and they don’t change state when tapped or hovered over." M3 prints no way to explain a disabled part, and a touch user without a screen reader sees none (the tooltip page needs a hover or a press on the part); none is added. On a phone the bar holds the count, Move up, Move down, Undo, Redo, Add block and `⋮` (the bar's fixed right end is main's). Shift+Arrow on a focused card extends the selection to the block above or below. 2026-11-14.

## The block's action row

Source: `src/blockRow.ts`, `src/editor.css` (`.mo-site-block-row`), `src/blockBar.ts` (`splitRow`). The block's own actions are the editor workspace, so a deviation is allowed. Read 14 Nov 2026 on m3.material.io (Playwright): `/components/icon-buttons/guidelines` and `/accessibility`.

### The active block has a row of its own actions above its top item

- **Material:** icon buttons "can be placed directly on the background or in most container components, such as cards, app bars, and toolbars"; "the target size of each icon button should be at least 48dp, even when nested"; "the accessibility label for icon buttons describes the action the button is executing"; "on web, icon buttons should display a tooltip with an accessibility label"; "Tab: Focus lands on (non-disabled) icon button". M3 prints no row of actions for one item.
- **We do:** while a block is active, a row opens right above it, right-aligned: Move up, Move down, Hide or Show, Block settings (only when the block has settings) and the drag handle. These actions leave the bar's `⋮`; Remove, Select and the other settings stay there. Standard icon buttons (no container), each 44 dp (the editor's one size, not M3's 48), labelled and with a tooltip (`title`). Move up or Move down that cannot apply (first or last block, a locked neighbour) stays in its place, disabled (`aria-disabled`, the theme's disabled colour) with the reason as `aria-description` and `title`; as with the bar's Move buttons while blocks are selected, M3 prints no way to explain a disabled part. Block settings uses Material Symbols' `tune` so it does not look like the bar's gear (the active row's or item's settings). The row opens by its height with the spatial spring (`motionTiming('spatial', 'fast')`), so the page below makes room; under reduced motion it opens at once.
- **Why:** owner idea, 14 Nov 2026: the bar keeps the text and design tools, the block's own actions sit at the block, each action in one place.
- **Date:** 2026-11-14. **PR:** #625.

## Choice group

Source: `theme/ui/ChoiceGroup.tsx`, `theme/ui/choiceGroupFit.mjs`, `theme/styles/ui.css` (`.mo-choice-group`). Spec: `docs/superpowers/specs/2026-11-14-choice-group-design.md`. Read 14 Nov 2026 on m3.material.io (Playwright): `/components/segmented-buttons/overview` and `/guidelines`, `/components/button-groups/overview`, `/guidelines`, `/specs` and `/accessibility`, `/components/radio-button/overview`, `/guidelines`, `/specs` and `/accessibility`, `/components/lists/guidelines` and `/specs`.

### D1. One part switches between a connected button group and a radio list by measured width

- **Material:** "Button groups should move through layouts together in a single line. They shouldn't wrap to a second line." "In compact windows, consider using smaller, narrower buttons so all buttons in the button group can fit." "Buttons at the trailing edge of the button group can be customized to collapse into an overflow menu at smaller breakpoints."
- **We do:** when the buttons' labels do not all fit at an equal share of the width (the widest button × the count + the 2 dp gaps; more than five choices always), the same choice is drawn as a vertical list of radio buttons instead, one choice per row, the whole row the tap target. The form is measured before the first paint and again on a resize, a font load or a density change; the switch back to buttons needs 8 dp more.
- **Why:** owner, 14 Nov 2026: "One theme part that chooses its own form by measuring, so it can never squeeze … it never wraps a group and never overlaps." Smaller buttons still clip long or Danish labels, and an overflow menu hides choices the owner compares.
- **Date:** 2026-11-14. **PR:** the pull request that adds this entry (choice group, the part).

### D2. A radio row shows a small live sample of the look in its trailing slot

- **Material:** a list item's trailing slot holds "Action elements or text: Icon, icon button, or trailing text" or a selection control (lists/specs); M3 prints no sample or preview slot.
- **We do:** a choice that is a look (a button style, a card's design or colour) shows a small, inert drawing of that look, made of the theme's own part, on the right of its row (`.mo-choice-group__sample`, at most 7rem wide, `aria-hidden`), only in the list form.
- **Why:** owner, 14 Nov 2026: "Where a choice is a look … each radio row shows a small live sample on its right."
- **Date:** 2026-11-14. **PR:** the same.

### D3. The choice group's list rows run the whole width of the fields above them

- **Material:** lists/specs: "Label left padding 16dp", "Leading element left padding 16dp"; radio-button/specs (read 14 Nov 2026 with Playwright): "Icon size 20dp", "State layer size 40dp", "Target size 48dp". M3 prints no rule for aligning a radio list with the fields above it.
- **We do:** in the choice group's list the rows have no padding at their sides (`--mo-comp-list-item-padding-inline: 0` on `.mo-choice-group__list`): the radio's 20 dp circle starts where the name and the fields above start, its 40 dp state layer overhangs the edge by 10 dp, a row's sample ends at the fields' right edge, and a text button's sample ends with its text (its 12 dp side padding overhangs). The circle sits on the label's middle line.
- **Why:** owner, 14 Nov 2026 (relayed by the PM): the radio buttons did not look correctly aligned: the circles started 16 dp in from the heading and the fields, and the samples ended short of the fields' right edge.
- **Date:** 2026-11-14. **PR:** #682 (choice group, the fields).

## Command palette (command palette, step 5)

Source: `docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md` (sections 1b and 9), `src/CommandPalette.tsx`, `theme/ui/Search.tsx` (`SearchView`), `src/Screen.tsx` (`SearchButton`).

### P1. A command palette is built from the Search view

- **Material:** "Use search for products with many items to manage, such as files or messages." and "Search helps people find information quickly." M3 has no page for running actions from a search, and none for a command palette.
- **We do:** the Search view lists and runs the editor's actions as well as finding content (the places of the menu, the Settings screens, pages and posts by title); every other part is M3's (a List, an icon button with a tooltip, menus). It opens from `Ctrl+K` (`⌘K`), which M3 is silent on.
- **Why:** owner, 13 Nov 2026: "a command palette: if the editor has dozens of functions, a floating search bar (Cmd/Ctrl+K, like VS Code, Figma, Notion) where the user types the action". Search is the nearest M3 part, and a dialog is the wrong one ("Dialogs are purposefully interruptive … used sparingly"). Where M3 is silent (the docked view with no bar to dock under, the ranking, the keys) the spec's section 1b lists what is ours.
- **Date:** 2026-11-13 (owner). **PR:** the pull request that adds this entry (command palette, step 5).

### P2. No custom context menu: the browser's or the operating system's menu stays

- **Material:** "A secondary click (whether using a single button or two fingers on a trackpad) should activate a context menu. The context menu shows additional options for the object that's clicked." (Inputs); "A secondary click, like a right-click on a mouse or a two-finger tap on a trackpad, opens a context menu." (Menus).
- **We do:** a right click opens the browser's own menu everywhere in the editor, in text, on blocks, images, table cells, rows, files and links. The editor draws no context menu, and `check:screens` fails if one of those stops the `contextmenu` event. The tools are on the bar, in its `⋮` and in the palette.
- **Why:** owner, 13 Nov 2026: "So we keep the no right click menu." The system menu does Cut, Copy and Paste, spell-check and link items better than we can. The browser's menu is itself a context menu, so this may not be a deviation in a strict reading; it is listed because the PM asked for it.
- **Date:** 2026-11-13 (owner). **PR:** the same.

### P3. More than two actions in the top bar on some screens until 0.20

- **Material:** "App bars should only have one action, two if necessary." "Up to two icon buttons can be placed after the headline" (App bars, guidelines).
- **We do:** the search icon button is the first trailing action on every screen. On the start screen (4 actions), on Pages, Blog posts, every list with deleted items and Files (3), and, below expanded, on a page or post being edited (4) or a new one (3), the bar then has more than two. Nothing else moves.
- **Why:** owner, 14 Nov 2026: the palette opens from "a plain search icon button in today's top bar, on every screen", and the owner approved these bars going over M3's two-action limit as a temporary deviation until the 0.20 search app bar, which has "up to two trailing icons on mobile" and "up to four trailing icons on larger screens" and ends this entry.
- **Date:** 2026-11-14 (owner's approval, through the 0.18 PM). **PR:** the same.

## The crop view

Source: `src/CropView.tsx`, `src/editor.css` (`.mo-editor-crop-page`). Spec: `docs/superpowers/specs/2026-11-14-image-tools-design.md` (section 3). Read 14 Nov 2026 on m3.material.io (Playwright): `/components/dialogs/guidelines`, `/specs` and `/accessibility`, `/components/sliders/guidelines` and `/accessibility`, `/components/toolbars/guidelines`. The dialogs' and sliders' token tables stay collapsed in a text read, so no token value is quoted.

### C1. The crop view is a page of the editor on every width, not a dialog

- **Material:** "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "To save a selection in a full-screen dialog, use Save. The close icon or dismissive action, such as Cancel or Back, should close the dialog." "When someone dismisses a full-screen dialog, a basic dialog should appear to confirm that they want to discard the unsaved changes."
- **We do:** the crop view is a page on every width: a layer the size of the window over the editor (a modal `<dialog>` with no dialog parts, so the form under it keeps its changes and its scroll place), with the theme's top app bar (back arrow and the title `Crop`), the image area, the aspect ratios and the zoom, and the Save row in the theme's standard bottom sheet (`ActionSheet`, see B1): `Save` filled, and `Cancel` from medium. The phone's back gesture leaves it (a step of its own in the history, as the sheets have). Leaving with changes asks the basic dialog `Keep your changes?`, as M3 says for a full-screen dialog; the dialog's other parts are not used.
- **Why:** owner decision, 14 Nov 2026: "Convert all full screen views to pages." (relayed by the project manager). Save is in the standard bottom sheet, as the owner's rule for Save rows says (entry 3 of *Editor-only bars*).
- **Date:** 2026-11-14. **PR:** #686; the Save row as a standard bottom sheet: 15 Nov, the same pull request as B1's change.

## The FAB above the footer

Source: `src/fabPresence.tsx` (`useFabLift`), `src/Screen.tsx`, `src/editor.css` (`.mo-editor-fab`). Read 15 Nov 2026 on m3.material.io (Playwright, `document.body.innerText`, collapsed sections opened): `/components/floating-action-button/overview`, `/specs`, `/guidelines` and `/accessibility`. The specs print the container (56dp by 56dp) and no margin to the window's edge or to other parts, so the 16 dp margin is the one the editor already used, not M3's.

### F1. The FAB moves up while the footer is in the window

- **Material:** "FABs remain in place on scroll." "The container shouldn't be covered by other elements, such as badges." "In compact and medium breakpoints, the best place for the FAB is typically the lower right corner of a screen, since it's easy to reach and is less likely to cover important content." "FABs persist on the screen when content is scrolling" (Overview). "Don’t completely obscure an actionable element and its focus indicator" (Accessibility). M3 prints nothing about a footer under a FAB.
- **We do:** the FAB stays at the bottom right, 16 dp from the edges. While the editor's footer is in the window (a short screen, or the end of a long one), the FAB stands 16 dp above the footer's top edge, so it never covers a footer link or the copyright line, and it goes back to its place when the footer leaves the window. The content leaves room for the FAB above the footer. It follows the scroll directly, with no motion of our own. `check:screens` (`checkFabAboveFooter`, 375 and 1280) fails when the FAB overlaps the footer.
- **Why:** owner, 15 Nov 2026: the FAB "must move up when the footer ... is beneath it, so the footer links are never covered"; on a phone it sat on top of "Report security issues" and the copyright line. M3's own rule that the FAB is not covered, and that it should not cover content, points the same way.
- **Date:** 2026-11-15 (owner). **PR:** this pull request.

### C2. The zoom slider's inactive track is the secondary container

- **Material:** the sliders' token table (the colours of the active and inactive track) stayed collapsed in a text read, so M3's colour for the inactive track could not be quoted and the theme's choice (`--mo-comp-slider-inactive-track: --mo-sys-color-surface-container-high`) could not be compared with it.
- **We do:** in the crop view the inactive track is `--mo-sys-color-secondary-container`.
- **Why:** the theme's inactive track is the colour of the crop view's image area, so the track did not show.
- **Date:** 2026-11-14. **PR:** #686.

## A block's sheet on a phone

Source: `src/BlockDialog.tsx` (the `subpage` look), `src/sheetPlacement.mjs`, `src/editor.css` (`.mo-editor-crop-page`, `.mo-editor-block-page`). Spec: `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md` (4.2). Read 15 Nov 2026 on m3.material.io (Playwright): `/foundations/layout/canonical-examples/list-detail`, `/components/app-bars/guidelines`, `/specs` and `/accessibility`, `/components/dialogs/guidelines`, `/components/toolbars/overview` and `/guidelines`.

### B1. A block's fields on a phone are a subpage with Save in the standard bottom sheet

- **Material:** "Compact: Use a single-pane layout. Only one view is visible at a time, either list or detail"; "Back button: Appears in detail view only for single-pane layouts"; "The detail pane should typically show in a single-pane layout, and an app bar appears". The app bar's leading button can be "A back arrow, which returns to the previous screen". Save is printed in three places only: "The primary action should alter or exit the entire page, like Send, Save, or Edit" as an app bar action; "To save a selection in a full-screen dialog, use Save" (a text button in the dialog's header); and a filled icon button or FAB in a docked toolbar. Bottom sheets: "Bottom sheets display supplementary content and actions on a mobile screen"; "Content should be additional or secondary (not the app's main content)"; "Standard bottom sheets co-exist with the screen's main UI region and allow for simultaneously viewing and interacting with both regions"; container colour "Surface container low", "Bottom sheets have a 28dp top corner radius", width "Full width, up to max-width 640dp" (Overview, Specs, Guidelines, read 15 Nov 2026). M3 prints no filled, labelled `Save` button in a bottom sheet, and prints no padding for what is in one.
- **We do:** a block's fields on a compact window (below 600 dp) are a subpage of the page form, drawn as the crop view is: the top app bar has the back arrow and the block's name only (no action), the fields are below it, and the Save row (`Save`, `Insert` for a new block, a filled button with a label) is the theme's standard bottom sheet, the same `ActionSheet` the page form's Save row is: fixed at the bottom, no drag handle or header, lifted above the on-screen keyboard by the sheet. The sheet's content has the theme's padding (16 dp above and below, and the grid margin at the sides: 16 dp on compact, 24 dp from medium), so Save ends where the fields end (owner's approval of the theme change, 15 Nov 2026; entry B3). The page's content ends above the sheet. Back (the arrow, Esc, the browser's and Android's back) with changes asks "Keep your changes?" and with none just goes back; Back or `Save` returns to the block in the page at the same scroll place. From medium the sheet is the modal side sheet with `Save` and `Cancel` as before, and from expanded the live side sheet. What still deviates from M3: Save is a labelled filled button in a sheet whose content M3 calls "additional or secondary", and the sheet has no drag handle, so it has one fixed state.
- **Why:** owner decisions, 14 Nov 2026: "Convert all full screen views to pages." and "Save buttons on mobile go in the bottom bar"; 13 Nov: "If it's the same bar at the bottom of the screen on pages and blocks, it should use the bottom sheet design and not its own custom design."; 15 Nov: "The save bar MUST use the bottom sheet." (relayed by the 0.18 project manager). A word cannot be misread (M3's own examples of a primary action are words), and the page keeps the form under it as M3's list-detail asks.
- **Date:** 2026-11-14 (page and bar, owner's approval, relayed by the 0.18 PM); 2026-11-15 (the bar is the standard bottom sheet). **PR:** #650; the bottom sheet: this pull request (`one-save/save-bar-bottom-sheet`).

### B2. On a phone every view that is a full-screen dialog or a side sheet is a page

- **Material:** "Full-screen dialogs are for compact breakpoints only, like mobile devices." (dialogs/guidelines); "Modal side sheets are preferred in compact breakpoints, like mobile, due to limited screen size." (side-sheets/guidelines); list-detail on compact: "Only one view is visible at a time, either list or detail", with a back button and an app bar. M3 prints no page with `Save` in a bottom bar (see B1).
- **We do:** the rule (owner, 15 Nov 2026: "We have agreed on moving away from full screen and sidebar on mobile and instead using pages."): below 600 dp no view of the editor is a full-screen dialog or a side sheet. Each is a page with the top app bar (back arrow and the headline), its content, `Save` filled in the standard bottom sheet when it has one, and Back with unsaved changes asking "Keep your changes?". The computer keeps the side sheet. Built so far: the crop view (#686), the Preview (#696) and a block's settings (#650, B1). The theme's `Dialog` has no full-screen kind any more (`THEME_API` 5). Notifications is a page too (`#notifications`, 15 Nov; the side sheet stays from 600 dp). A section's settings are a page too below 600 dp (15 Nov) and, from 600 dp, the live standard side sheet beside the page (owner, 15 Nov: "The settings should show in the right pane and not be a dialog"). M3's supporting-pane page puts a supporting pane below the focus pane at medium and beside it only from expanded (360 dp), while the side-sheets page says standard side sheets are "used mostly in medium to expanded breakpoints"; we follow the owner and the side-sheet page (`docs/superpowers/specs/2026-11-15-section-settings-pane.md`). Not pages, by the owner's decision of 15 Nov: the lightbox (item 19 above) and the alt text sheet, which stay as they are (the alt text sheet is a bottom sheet with Skip and Save). The settings sheets of 0.20 (`2026-11-14-settings-sheets-design.md`) are not yet pages; that plan already has the subpage.
- **Why:** owner decision, relayed by the 0.18 project manager on 15 Nov 2026.
- **Date:** 2026-11-15. **PR:** #650 (the rule and the block sheet); the other views in their own pull requests.

### B3. Settings are a pane from 600 dp, not a dialog

- **Material:** dialogs/overview: "Should be dedicated to completing a single task"; dialogs/guidelines: "Dialogs are purposefully interruptive, so they should be used sparingly.", "Common use cases for basic dialogs include alerts, quick selection, and confirmation.", "not every choice or setting warrants interruption"; full-screen dialogs "may be used for ... Dialogs that include components which require keyboard input, such as form fields" and, for medium and expanded, "use a basic dialog". side-sheets/guidelines: standard side sheets "remain visible while people interact with primary content" and may hold "Form controls shown in a side sheet for app settings"; side-sheets/overview: "People can navigate to another region within the sheet" and "Side sheets can contain a back icon for navigation". M3 therefore allows a basic dialog for a form at medium and expanded.
- **We do:** owner rule, 15 Nov 2026: "Dialogs are only for short messages, not for settings." A dialog is a short message, a confirmation or a single short choice. Settings or a form with several controls are the standard side sheet beside the page from 600 dp and a page below 600 dp (B2). Where a pane opens from inside a pane, the inner content replaces the pane's content with a back arrow, as side-sheets/overview prints. The supporting-pane page puts the pane below at medium; we put it beside from 600 dp (the side-sheets page: "used mostly in medium to expanded").
- **Why:** owner decision, 15 Nov 2026. Section settings first (`docs/superpowers/specs/2026-11-15-section-settings-pane.md`); the other surfaces in their own pull requests.
- **Also a pane from 600 dp (pane PR 2):** a block's fields (and an image's alt text), a List row's settings and the Block settings details (`src/BlockSettings.tsx`, beside the list; below 600 dp still the sheet from the bottom until its page is built).
- **Also a pane from 600 dp (pane PR 3b):** the link of a text (`src/LinkSheet.tsx`), a link of the profiles (`src/LinkList.tsx`) and an item of a menu (`MenuList` in `src/fields.tsx`), fed into the pane host (`src/PaneHost.tsx`); one opened while another pane is open is on top of it with the theme side sheet's back icon (M3 side-sheets/overview: "Side sheets can contain a back icon for navigation"). Below 600 dp they stay the sheet from the bottom. The page picker inside the link stays a sheet (a choice).
- **Also a pane from 600 dp (pane PR 4):** an own list's settings (`src/OwnListSheet.tsx`), the name of a new list (`src/NewListDialog.tsx`, a dialog before), a widget's settings (`src/WidgetSettings.tsx`), an app's add-on (`src/AppAdds.tsx`) and a redirect (`src/Redirects.tsx`), fed into the pane host; below 600 dp they stay the dialog or the sheet from the bottom. The content is drawn in the pane or in the sheet, never in both.
- **Also a pane from 600 dp (pane PR 5):** a file's details in Files (`src/Media.tsx`: the side sheet beside the grid from 600 dp instead of 840 dp; below 600 dp the page `files/<address>`) and a consent record (`src/Consents.tsx`, fed into the pane host; its Delete stays a confirmation, `ask()`).
- **Date:** 2026-11-15. **PR:** #774 (section settings).

## Preview and View on site in the text's bar

**Changed 18 Nov 2026 (cards and lists plan, step 7, 0.19):** the Preview goes; the builder shows the page at M3's window sizes (viewports). The Preview lines of this file (here, and colour sweep entries 5 and 9) stay until that pull request removes them.

Source: `src/MarkdownEditor.tsx` (`spareIds`, the bar's `⋮` menu), `src/textBar.mjs` (`planBar`), `src/textActions.ts`. Spec: `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md` (3.2, 3.3). Read 15 Nov 2026 on m3.material.io (Playwright): `/components/toolbars/guidelines`, `/components/menus/guidelines`, `/components/icon-buttons/guidelines`. The bar and its `⋮` are the editor's own workspace.

Followed: "When actions don’t fit in a toolbar, add a menu." and "If more actions are needed, use an overflow menu." (Preview goes into the `⋮` when the bar is full); "Use groups to bundle similar actions together." with dividers (View on site is the last group of the `⋮`); a leading icon on each menu item. The icons are Material Symbols `preview` and `open_in_new`, the same as the command palette's.

### P1. View on site is missing from the `⋮` on a new page instead of disabled

- **Material:** "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed."
- **We do:** a page or post that is not saved yet has no address, so its `⋮` has no View on site row. The same bar keeps its tools in every place and hides those that cannot apply there.
- **Why:** the editor's workspace shows only what applies (spec 3.3); a disabled row with nothing to explain would only add a dead entry to a short menu.
- **Date:** 2026-11-15. **PR:** #737.

## The theme's Dialog

### D1. The theme's Dialog has no full-screen kind

- **Material:** "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete." "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "Dialogs can swap variants as the breakpoint changes. For example, a full-screen dialog can change into a basic dialog at larger breakpoints." (dialogs/guidelines, read with Playwright on 15 Nov 2026).
- **We do:** the theme's `Dialog` (`theme/ui/Dialog.tsx`) is the basic dialog only. The `full-screen` kind, `dialogFullScreenModalClass`, the classes `dialog-full-screen`, `dialog-modal-full-screen`, `dialog-header` and `dialog-header-actions` and the two `--dialog-full-screen-*` tokens are gone, and `THEME_API` is 5. A task that needs a whole screen is a page with the top app bar's back arrow (B2). The lightbox is its own modal `<dialog>` with the dialog's container (19).
- **Why:** owner decision, 14 Nov 2026: no full-screen views anywhere; full screens become pages with a back arrow. It is the same thing as the dialog's full-screen kind, so the kind is removed (relayed by the 0.18 project manager).
- **Date:** 2026-11-15. **PR:** the pull request that removes the kind.

## The search view (search page, M3 search)

Source: `theme/ui/Search.tsx` (`SearchView`), `theme/styles/ui.css` (`.mo-search-view*`), `src/CommandPalette.tsx`. Read 15 Nov 2026 on m3.material.io with Playwright: `/components/search/overview`, `/specs`, `/guidelines`, `/accessibility`. The token tables of the specs page stay collapsed in a text read (they did not open), and the colour and measurement diagrams are images that did not load: no token value is quoted, and the colour roles below are read from the numbered lists under the diagrams.

### SV1. The contained style, without a divider

- **Material:** "Contained: Has an expressive look and feel. It uses a filled container to separate a search bar from a list of suggestions or results"; "Divided (baseline) … Not recommended. Use contained." "In the divided (baseline) style, a divider separates the search bar and results."
- **We do:** the contained style. The bar is a filled pill (56dp, full corners, surface container high, margins 12dp focused) in the view's own container; there is no divider under it. A theme can still ask for the divided style (`--mo-comp-search-view-header-surface: transparent`, `--mo-comp-search-view-header-radius: 0`, `--mo-comp-search-view-divider`).
- **Why:** the owner's examples (Gmail, Drive) show a divider; M3 says the divided style is not recommended, and the owner asked for M3. Open for the owner to decide.
- **Date:** 2026-11-15. **PR:** this pull request.

### SV2. Colour roles and the docked gap (read as printed, no deviation)

- **Material:** specs, Color: full screen "Surface container low … Surface container high …"; docked "Surface container high … Surface container high …" (numbered lists whose diagrams did not load, read in the order of the anatomy: container, icons and text, bar). Guidelines: "Avoid using a surface container high color on a surface container background … use surface container roles that are more than one step apart." Tokens (specs, token table, contained, read 15 Nov 2026): "Search view contained docked bar results gap 2dp".
- **We do:** full screen the view is surface container low and the bar surface container high. Docked the bar and the results container are two containers, both surface container high, 2dp apart, so the bar never blends into its container.
- **Date:** 2026-11-15. **PR:** this pull request.

### SV3. Where M3 is silent, or the pages could not be read

- **Highlighting the match** in a result: M3 prints nothing, so none is drawn.
- **"Quick results"**: guidelines print "Show search results in a compact, organized list, with an indicator like Quick results". The groups' names (Go to, Pages and posts, Images and files …) are the indicator; a query shows the first 8 results, and the last row, "All search results for “query”", shows the rest (up to 30).
- **Remove button on a recent search:** M3 prints historical suggestions ("Show historical suggestions before typing") and no remove button. We add one (the owner's Gmail example); the keyboard's Delete key does the same.
- **Search key:** guidelines print "Type a query and press Enter"; the field's `enterKeyHint` is `search`.
- **Opening:** the editor's other screens keep the top bar's search icon button (palette spec, deviations P1 and P3); the search app bar for every screen is 0.20.
- **Docked size:** specs print "Width Min: 360dp, max: 720dp" and "Height Min: 240dp, max: 2/3 of screen height"; the view follows both. M3 is silent on where a docked view stands without a bar: near the top, in the middle (palette spec).
- **The view's corners:** the shape tokens show a drawing, not a value (SV7), so the theme's extra-large corners are used; no shadow (the overview says "no shadow by default").
- **Date:** 2026-11-15. **PR:** this pull request.

### SV4. On a phone the search view is a page with a back arrow

- **Material:** "Full-screen layout: Default for compact breakpoints"; "Full-screen expands to fill the screen"; "The back icon releases focus, dismisses any suggestions or results, and returns the search bar to its original state."
- **We do:** on a phone the view is a layer the size of the window (a modal `<dialog>`, as the crop view, C1) with the back arrow leading its bar. It is full-size like M3's full-screen layout; it has no scrim and no corners. It is not a routed page (the phone's back gesture closes it, as for the crop view). From the medium width it is a dropdown (SV7).
- **Why:** owner rule, 15 Nov 2026 (relayed by the PM): "We have agreed on moving away from full screen and sidebar on mobile and instead using pages."
- **Date:** 2026-11-15. **PR:** this pull request.

### SV5. The focus starts in the search field, not on the back arrow

- **Material:** accessibility: "Initial focus lands on the first interactive element. This is often a leading icon button or text field."
- **We do:** the back arrow is the leading icon button and the text field has the focus when the view opens; no other control has it.
- **Why:** owner rule for dialogs and views (no control has the focus at the start except the field), so a person can type at once; M3 says "often", not always.
- **Date:** 2026-11-15. **PR:** this pull request.

### SV6. The start screen shows the search bar all the time

- **Material:** "Search bar: Use to search contents in a specific view"; "Add a search bar below a title to search specific content"; specs: "Container Width Min: 360dp, max: 720dp", "Height 56dp", "Leading padding Unfocused: 24dp, focused: 12dp".
- **We do:** the start screen shows the contained search bar (56dp, a button that opens the view) all the time, with its hint, "Search actions and pages", as its name. On a phone it is the first thing in the page, below the top bar (which keeps the title, the status and the actions), 24dp from the screen's edges (the page's own gutter is 16dp, so it is 8dp inside it). From medium it stands in the top bar in place of the search icon, up to 720dp wide, and the title and status stand under it. A phone's bar is 327dp wide at 375, under the 360dp minimum, because of the 24dp margins. Every other screen keeps the search icon button.
- **Why:** owner, 15 Nov 2026 (relayed by the PM): "On the front page show the search field all the time". The search app bar for every screen is 0.20 (palette spec).
- **Date:** 2026-11-15. **PR:** this pull request.

### SV7. From medium the view is a dropdown on the bar, with no scrim

- **Material:** guidelines: "Docked opens a list below the search bar, with a scrim covering main content"; specs, Measurements (contained): "Docked container Width Min: 360dp, max: 720dp", "Height Min: 240dp, max: 2/3 of screen height", "Search bar container Height 56dp", "Leading padding 16dp", "Trailing padding 16dp". "Search suggestions or results should swap from full-screen in compact windows to docked in larger breakpoints." Tokens, contained (token table opened by clicking its folders, 15 Nov 2026): "Search view contained leading margin 12dp", "trailing margin 12dp", "docked bar results gap 2dp", "full screen bar container height 56dp", "icon label gap 4dp"; the text tokens: Roboto 16pt, weight 400, line height 24pt, tracking 0.5pt (body large). The shape tokens ("docked results shape", "docked bar shape", "full screen container shape") show a drawing, not a value: not readable, so the results container uses the theme's extra-large corners, and the bar is a pill. No elevation token is listed for the contained style and the overview says "Elevation: Lower elevation and no shadow by default", so the dropdown has no shadow. The divider tokens are in the divided folder (not used, SV1).
- **We do:** from medium the view is a panel on the search bar (the bar of the top bar, else under the search button, ending where the button ends): not a dialog, not modal and with no scrim; the page behind it stays as it is. It is as wide as the bar (360dp to 720dp), 240dp to 2/3 of the window high, and is the bar (56dp, where the closed bar was, no margin), then 2dp under it a results container with the chips and the lists. Escape, the back arrow, a press outside it and the button close it, and the focus goes back to where it was.
- **Why:** owner, 15 Nov 2026 (relayed by the PM): "On desktop don't make a popup, I read make a drop down."
- **Date:** 2026-11-15. **PR:** this pull request.

### SV8. Phone paddings, checked against the specs (15 Nov 2026)

- **Material:** specs: bar "Height 56dp", full-screen focused bar "Leading padding 16dp", "Trailing padding 16dp", icon and label "4dp" from the tap target, margins "Focused: 12dp"; lists, specs: "Leading element left padding 16dp"; unfocused margin "24dp".
- **We do:** the focused bar is 12dp from the edges and 56dp high, its icons 16dp from the pill's edge (a 48dp button inside 4dp padding) and the text 4dp from the button; the bar clears the notch (`env(safe-area-inset-top)`). The group names ("Recent searches", "Suggested") now start 16dp in, in line with the rows' icons (they were 12dp). A recent search and its remove button have one highlight. The filter chips start at 12dp, in line with the bar's edge (M3 prints nothing for the chip row). The unfocused bar on the start screen is 24dp from the edges.
- **Date:** 2026-11-15. **PR:** this pull request.


### SV9. Chips follow the M3 specs (fixed in the theme with the owner's approval, 15 Nov 2026)

- **Material:** chips, specs (read 15 Nov 2026 with Playwright): filter chip "Container height 32dp", "Container shape 8dp corner radius", "Icon size 18dp", "Left/right padding 16dp", "Left/right padding with icon 8dp", "Padding between elements 8dp"; colour roles "On surface variant, On secondary container, Secondary container, Outline variant". Guidelines: "Tapping on a filter chip activates it and appends a leading checkmark icon to the starting edge of the chip label", "Keep an 8dp minimum space between chips. Chips must also have a minimum 48dp target size, regardless of placement or density. If required, the target can extend beyond the visible container of the chip."
- **We do:** the theme's chip (`theme/styles/global.css` tokens, `theme/styles/ui.css`): the edge is outline variant, the label and icon on surface variant, a chosen chip is the secondary container with on secondary container and its check; 8dp padding on the side of an icon; a 48dp target (behind the chip's own content); a state layer when pointed at; a disabled chip has its label at 38% and its edge at 12% of on surface, a chosen disabled chip a 12% container. It was: outline edge, surface container high for a chosen chip, on surface text, 16dp with an icon, no 48dp target, an accent colour when pointed at, the whole chip at 38%. Every chip of the editor and of the site gets this (the Colours screen, the crop view, the image picker, the icon picker, tags, the parts gallery). The disabled colours are the M3 ones from the chips' state pages; the token table values for the chip were not opened.
- **Why:** owner, 15 Nov 2026: "Your chips do not follow MD3 standard."
- **Date:** 2026-11-15. **PR:** this pull request.

### SV10. The start screen's search bar and the search view's category label are theme parts (new, with the owner's approval, 15 Nov 2026)

- **Material:** search, guidelines: "Category labels, like Recent, Contacts, or Suggestions"; search bar as in SV6.
- **We do:** `SearchBarButton` and `SearchGroupLabel` in `theme/ui/Search.tsx`, used through `src/ui.tsx` (`SearchBarButton`) and the search view, and shown in "Parts" › "UI components" under *Search*. The start screen's bar had its own markup in `src/Screen.tsx`, and the label its own class.
- **Date:** 2026-11-15 (owner's approval, relayed by the PM). **PR:** this pull request.

### SV11. Spacing of the search view, audited against the specs (15 Nov 2026)

- **Material (read with Playwright, 15 Nov 2026):** Search specs and token table: "Search bar container Height 56dp", "Search view contained leading margin 12dp", "trailing margin 12dp", "docked bar results gap 2dp", "icon label gap 4dp", "Docked container Width Min: 360dp, max: 720dp", "Height Min: 240dp, max: 2/3 of screen height", "Leading padding 16dp", "Trailing padding 16dp". Chips specs: "Container height 32dp", "Container shape 8dp corner radius", "Icon size 18dp", "Left/right padding 16dp", "Left/right padding with icon 8dp", "Padding between elements 8dp". Lists token table (Spacing, Size): "list item leading space 16dp", "trailing space 16dp", "top space 10dp", "bottom space 10dp", "between space 12dp", "List segment gap 2dp", "One line list item container height 56dp", "Two lines … 72dp", "Three lines … 88dp", "leading icon size 24dp", "leading icon expressive size 20dp". Dividers specs: "Divider inset left margin 16dp".
- **We do:** every value above, measured in the browser at 375, 768 and 1280 (the table is in the pull request). Fixed in this round: the chip was 37.6dp high (the theme's block padding was 8.8dp; now `--mo-comp-chip-padding-block` 6dp, so 32dp), the 8dp padding with an icon did not reach a filter chip (its hidden check came first), the chip row stood 6dp under the docked bar (now 12dp from the container's top edge), and the remove button's icon stood 12dp from the edge (now 16dp).
- **M3 prints no number for:** the space around the chip row in a search view (we use 12dp left and top, 8dp under it); the category label (12/16 label medium, 8dp above, 4dp under, 16dp in) and the gap between groups (8dp); the docked bar's margin (it stands where the closed bar was, so 0, M3 prints the focused 12dp); the docked container's corner radius (the shape tokens show a drawing: we use the theme's 28dp extra-large); a margin between a docked container and the page. These are open points for the owner; SV13 researches them.
- **Date:** 2026-11-15. **PR:** this pull request.

### SV12. The search view's rows are the theme's segmented list (owner's approval, 15 Nov 2026)

- **Material (Lists, read 15 Nov 2026 with Playwright: overview, specs incl. the token table's Spacing, Shape, Size and Color folders, guidelines, accessibility):** "Use segmented gaps and filled list items to define a list group", "Use gaps for contained lists", "List segment gap 2dp", "Unselected corner radius: 4dp inner, 16dp outer", "Selected corner radius: 16dp", "List list item segmented container color #FEF7FF" (the baseline scheme's Surface), "List list item selected container color #E8DEF8", "One line list item container height 56dp", "Two lines … 72dp", "List list item leading space 16dp", "List list item between space 12dp".
- **We do:** the theme already has the segmented kind (`List kind="segmented"`, `theme/ui/List.tsx`, `.mo-list__segmented` in `theme/styles/ui.css`, shown in Parts › UI components › List): a 2dp gap (`--mo-comp-list-segmented-gap`), 16dp outer and 4dp inner corners, 16dp when selected, the selected row on the secondary container (the same colour as M3's #E8DEF8). The theme's default row colour is now Surface (`--mo-comp-list-list-item-segmented-container-color`, M3's "segmented container color"; owner, 15 Nov 2026), for every segmented list. In the search view the lists stand in the page's grid margin on their sides (`--mo-sys-grid-margin`, 16dp compact and 24dp from medium: the owner's grid rule, 15 Nov 2026) with 8dp above and below (`--mo-comp-search-view-results-padding`). M3 prints no side margin for a segmented list (Lists overview, specs, guidelines and accessibility only say a list can "adjust margins" per breakpoint); the Search specs' 24dp and 12dp margins and the "Search view contained leading and trailing margin 12dp" token are the search bar's and the view header's, not the results'. The site's List block and the editor's gallery list already stand inside the page's margin (their page container, 16dp at 375 px), so they get no second one.
- **Where it differs, and why:** (1) The site's List block with the segmented option (`theme/blocks/list/Rows.tsx`), its preview in the editor (`InlineSegmented`) and the editor's gallery list have their rows on the surface container, not on M3's Surface (`--mo-comp-list-list-item-segmented-container-color`, set by `.mo-block-list` in `theme/styles/blocks.css` and by the gallery's list preview). M3 prints Surface for the segmented container; those lists stand on a page that is itself Surface, so Surface rows and their 2dp gaps would be invisible. Owner-approved deviation (owner, 15 Nov 2026, relayed by the PM); the theme's default and the search view (a higher container) keep Surface. (2) M3 prints no number for the hovered, focused and pressed corners (drawings in the shape tokens): the theme uses 12dp (owner's yes, 15 Nov 2026). (3) M3 prints no gap between groups of lists: 8dp (owner's yes). Nothing else differs.
- **Which M3 we follow:** M3 Expressive. The Lists specs table prints: Lists (expressive) "M3 --", "M3 Expressive Available"; Lists (baseline) "M3 Available", "M3 Expressive Not recommended. Use expressive lists instead."; Style Standard "Available / Available", Segmented "M3 --", "M3 Expressive Available". So the segmented list (2dp gaps, rounded items) is M3 Expressive only, not baseline. The Search specs say the same for the contained style ("M3 --", "M3 Expressive Available") and the divided style ("M3 Available", "M3 Expressive Not recommended. Use contained."), and the Search overview dates its Expressive update "February 2025". Where a component has an expressive variant the theme follows it, and the editor's workspace follows its own rules as before.
- **Superseded by the cards and lists plan (18 Nov 2026) for the list's measures and states:** step 5 moves `List` and `ListItem` onto M3 Expressive's tokens (heights 56 / 72 / 88dp, the hover state layer, the selected colours, disabled 0.38, the Expressive shapes, the segmented surface and 2dp gap). Where point (2) above says M3 prints no number for the hovered, focused and pressed corners, the token pages now read (4dp; hovered 12dp; focused, pressed, dragged and selected 16dp) are followed. The focus ring is the one ring of deviation FR1, with the list's own offset of -3dp as a component variable. The List block's rows on the surface container (point (1)) stay as the owner approved them.
- **Step 5, the component (18 Nov 2026, Lists › Specs and the *List - Common* and *List - Expand* token sets read with Playwright):** the hover shift and the selected weight are gone (not in M3's tokens); a hovered item shows only the 0.08 state layer, text unchanged; pressed, focused and dragged corners are 16dp, hovered 12dp, resting 4dp; dragged is level 4 under the 0.16 layer; disabled 0.38; the subhead (prop `subhead`, replacing `overline`) is drawn as M3's overline. Where we differ: the divider is `outline-variant` as the Specs page's colour roles list prints it (the spec's table says `outline`); the focus ring is primary (FR1); `columns` is kept as the content slot with `--mo-comp-list-item-columns-gap`; the List block's segmented rows stay on the surface container (point (1)). The expanded item's colours and the trailing icon container are printed only as images on the page: the existing values stay.
- **Date:** 2026-11-15 (owner's approval, relayed by the PM). **PR:** this pull request.

### B3. The bottom sheet's side padding is the grid margin

- **Material (read with Playwright, 15 Nov 2026, m3.material.io/components/bottom-sheets/overview, /specs, /guidelines, /accessibility):** specs, Measurements: "Bottom sheets span the full window width up to 640dp. When the window width exceeds 640dp, bottom sheets adjust to have a top margin of 56dp and side margins of 56dp", "Drag handle padding top/bottom 22dp", "Top margin 72dp", "Width Full width, up to max-width 640dp". M3 prints no padding for what is inside a sheet, so there is no value to conflict with.
- **We do:** the sheet's header, peek, footer and a standard sheet's content have `var(--mo-sys-grid-margin)` at the start and end (16 dp on compact, 24 dp from the medium breakpoint, `theme/styles/tokens/material/sys.css`), instead of 20 dp; the editor's `SheetBody`, `SheetActions` and the gallery sample use the same token. M3's grid page prints these margins for the window.
- **Why:** owner approval, 15 Nov 2026 (relayed by the PM): the fields and lists inside a sheet end at the grid margin, and the sheet's 20 dp made their edges miss. No `THEME_API` name, kind or class changed.
- **Date:** 2026-11-15. **PR:** this pull request (`bottom-sheet-grid-margin`).

### SV13. The open points of SV11, researched in the official sources (15 Nov 2026)

- **Sources checked, in order:** (1) m3.material.io Search specs, the token table with the folders opened (Color; Layout and Text: Contained (expressive), Divided (baseline), Common tokens; both the *Search - View* and *Search - Bar* sets), and the Chips and Lists specs; (2) Compose Material 3 `SearchBar.kt` (`ExpandedDockedSearchBarWithGap`, `DockedSearchBarLayout`, `SearchBarDefaults`), `SearchViewTokens.kt`, `SearchBarTokens.kt`, and Android `material-components-android` `dimens.xml`, `styles.xml`, `attrs.xml` of `search`; (3) Material Web `@material/web` 2.5.0, `tokens/versions/latest/sass/_md-comp-search-view.scss` and `_md-comp-search-bar.scss`.
- **Docked container corner radius (point 4).** The specs page names *Search view contained docked bar shape* and *docked results shape* but prints the shapes as a drawing. Material Web prints them: `contained-docked-bar-shape: corner-full`, `contained-docked-results-shape: corner-medium` (12dp), and `docked-container-shape: corner-extra-large` (28dp, the divided style's one container). Compose agrees: `dockedDropdownShape = RoundedCornerShape(12.dp)` for the with-gap docked bar, 28dp (`DockedContainerShape`, extra large) for the single container. We follow the contained style, so the results container is **12dp** (was 28dp): `--mo-comp-search-view-docked-container-shape`, no deviation.
- **Focused docked bar margin (point 4) and margin to the page (point 5).** Compose's docked layout keeps the bar at its collapsed bounds and puts the results under it at the bar's own width (`maxWidth = collapsedCoords.size.width`) with a 2dp gap; it adds no margin to the bar or to the page. Material Web has no docked margin token; its contained 12dp margin (and the specs' "focused 12dp") belongs to the full-screen view. Android's 16dp `m3_searchbar_margin_horizontal` is the closed bar's own margin in its layout. **M3 does not define a margin between a docked container and the page.** We keep: the docked bar has no margin; the panel's bottom stays 16dp above the window's edge (`max-height`). **Approved deviation (owner, 15 Nov 2026, relayed by the PM).**
- **Chip row (point 1) and category label and group gap (point 2).** The specs, Compose (`SearchBar.kt` takes arbitrary content), Android and Material Web have no filter chips or category labels in a search view, and no token for the space around them. **M3 does not define them.** We keep: chip row 12dp from the container's top edge and 12dp in, 8dp under it; label label-medium, 8dp above, 4dp under, 16dp in; 8dp between groups. **Approved deviation (owner, 15 Nov 2026, relayed by the PM).**
- **Which M3.** The segmented list (SV12) is M3 Expressive: the Lists specs print it as "M3 --" and "M3 Expressive Available"; none of the sources above show it in the baseline.
- **Date:** 2026-11-15 (owner approved the deviations above, 15 Nov 2026). **PR:** #749.

## The focus ring (step 1 of the cards and lists plan)

Source: `theme/styles/base.css` (`:focus-visible`). Read 18 Nov 2026 on m3.material.io (Playwright): the Specs pages of cards, buttons, chips, lists, menus, navigation bar and rail, and `/foundations/interaction/states/state-layers` and `/foundations/interaction/states/applying-states`.

### FR1. One focus ring for every part, in `primary`

- **Material:** every component's Specs page prints its focus indicator as colour `Secondary` (for example *Elevated card focus indicator color*: `#625B71`), thickness `3dp` and offset `2dp`.
- **We do:** one ring for every part, `--mo-sys-color-primary`, 3dp thick, 2dp from the part, with `border-radius: inherit` (`base.css`, the one `:focus-visible` rule). The part rules that draw a ring of their own (the checkbox, switch and radio inputs, the slider's handle, the table block, the list's inset ring) write the same three values, or say why they differ: the list keeps its own offset of -3dp, inside, as the Lists specs print it.
- **Why:** a site's Secondary is a theme colour and can be close to the page, so it cannot promise the 3:1 that WCAG 2.2, 1.4.11 (Non-text Contrast) asks of a focus indicator. Owner approved, 18 Nov 2026 ("One focus ring"; plan `docs/superpowers/plans/2026-11-17-cards-and-lists-0-19.md`, step 1). It closes the open question of `docs/superpowers/specs/2026-11-13-custom-colors-design.md`.
- **Date:** 2026-11-18. **PR:** the step 1 pull request.

## Focus ring on the search view's field (A1 of the Modern Web Guidance audit)

Source: `theme/styles/ui.css` (`.mo-search-view__header`, `.mo-search-view__input`). Read 15 Nov 2026 on m3.material.io (Playwright): `/components/search/overview`, `/specs`, `/guidelines` and `/accessibility`.

### A1. The search view's field shows a 2dp accent focus ring

- **Material:** the Search specs ("Focused search") print no focus ring for the field in a search view: the open view is itself the focused state ("In focused search, individual elements maintain their own interaction states").
- **We do:** the bar container of the view (`.mo-search-view__header`) shows the same 2dp accent ring as the closed search bar while the field has focus, drawn as an inset shadow with a transparent outline for forced-colors mode. The same 2dp ring (`--mo-sys-color-primary`) marks the editor's text typed in place and its typed rows (editor only, no M3 page).
- **Why:** Chrome's Modern Web Guidance, `accessibility`: "Mandatory - Don't disable browser native focus indicators without providing a replacement custom focus indicator" (WCAG 2.4.7, 1.4.11, 3:1). Owner approved, 15 Nov 2026 (relayed by the PM).
- **Changed 18 Nov 2026 (cards and lists plan):** this 2dp ring is the field's own focus state and stays. The ring of every part (the search view's rows, buttons, cards) is now the one ring of deviation FR1 (One focus ring, in primary): `--mo-sys-color-primary`, 3dp, offset 2dp.
- **Date:** 2026-11-15. **PR:** #754.

## The error text of a text field has no alert role (text field `:user-invalid`)

Source: `theme/ui/TextField.tsx` (`.mo-text-field__invalid-text`), `theme/ui/textFieldUpdate.ts` (`syncInvalid`). Read 15 Nov 2026 on m3.material.io (Playwright): `/components/text-fields/overview`, `/specs`, `/guidelines` and `/accessibility`.

### E1. The error text is linked by `aria-describedby`, not announced as an alert

- **Material:** "When there is an error, "alert" is applied to the role and the error message to the text label." and "Text field error messages should be given an “alert” role in accessibility labels" (Text fields, accessibility).
- **We do:** the line that says what is wrong has no `role="alert"`. While the field is invalid after the person has worked in it (`:user-invalid`), its `aria-invalid` is true and the line's id is in its `aria-describedby`, so a screen reader reads the message once, with the field.
- **Why:** Chrome's Modern Web Guidance (`validate-input-after-interaction`, `accessible-error-announcement`) says to list the error in `aria-describedby` only while the field is invalid and not to make each message a live region, as a message that is shown rather than changed is not announced reliably and would be read twice. The owner's order puts the modern web guidance before Material 3 here: the PM, 15 Nov 2026 (owner: "We follow modern web").
- **Date:** 2026-11-15 (owner, through the PM). **PR:** the pull request that adds this entry.

## The footer's colour scheme (connected button group, #767)

Source: `theme/components/Footer.astro`, `theme/layouts/Base.astro`. Read 15 Nov 2026 on m3.material.io (Playwright): `/components/button-groups/overview`, `/specs`, `/guidelines` and `/accessibility`, and `/components/segmented-buttons/overview`, `/specs`, `/guidelines` and `/accessibility`.

### F1. A single-choice group of toggle buttons says `aria-pressed`, not `radio`

- **Material:** the button groups' Accessibility page prints "Tab: Initial focus lands on the first button", "Arrow keys: Navigate between items", "Space or Enter: Selects a focused item" and "Identify when buttons are selected"; it names no ARIA roles.
- **We do:** the three buttons (Light, Auto, Dark) are toggle `Button`s with `aria-pressed` in a `role="group"` (the theme's `ButtonGroup`, as its `ChoiceGroup` does), with one tab stop on the chosen button and the arrow keys moving and choosing. Initial focus lands on the chosen button, as `ChoiceGroup` does, where M3 prints the first.
- **Why it stays:** no Modern Web Guidance guide prints a rule for one-of-many toggle buttons (searched and read 15 Nov 2026: `accessibility`, `forms`, `toolbar`, `tabs`, `switch`, `dark-mode-toggle`; none mentions radio roles, `aria-checked` or arrow-key groups), and M3's page prints none. The theme's `ChoiceGroup` and this group use `aria-pressed`. Accepted by the PM, 15 Nov 2026; revisit if the guides add it.
- **Date:** 2026-11-15. **PR:** #767.

## The site's menu is the modal expanded navigation rail (follow-up of D2 of the Modern Web Guidance audit)

Source: `theme/components/MobileMenu.tsx`, `theme/ui/NavigationDrawer.tsx`, `theme/styles/ui.css`. Read 15 Nov 2026 on m3.material.io (Playwright, every tab): `/components/navigation-drawer/overview`, `/specs`, `/guidelines`, `/accessibility` and `/components/navigation-rail/overview`, `/specs` (the token sets Common, Collapsed, Expanded, Item - Common, Item - Vertical and Item - Horizontal, opened), `/guidelines`, `/accessibility`. The measurement and anatomy images of the Specs pages did not load in headless Chromium (blurred placeholders), so numbers that only those images carry are not read here.

### N1. The menu on a phone is the modal expanded navigation rail; the part keeps its name `navigation-drawer`

- **Material:** Navigation drawer, Overview: "The navigation drawer is no longer recommended in the Material 3 Expressive update. For those who have updated, use an expanded navigation rail, which has mostly the same functionality of the navigation drawer and adapts better across breakpoints." Navigation rail, Overview: "The expanded nav rail is meant to replace the navigation drawer"; Specs, Configurations, *Expanded layout*, "Modal": M3 "Available as navigation drawer", M3 Expressive "Available"; Guidelines: "Expanded navigation rails can open from menu buttons on mobile".
- **We do (owner's priority order, 15 Nov 2026: Expressive over plain M3; decided by the PM):** the theme's `navigation-drawer` takes the expanded rail's look where its pages print a value: the modal container is the surface container ("Nav rail expanded modal container color", `--mo-sys-elevation-level2-color`) and the standard one the surface ("Nav rail expanded container color"); the container hugs its content, "container width minimum 220dp", "maximum 360dp" (a theme that sets `--mo-comp-navigation-drawer-width` still gets that width); the icon-label space is 8dp ("Nav rail item horizontal icon-label-space 8dp"); and the site's menu has the rail's menu button at its top, on the edge the header's menu button is on, which closes it with a changed icon (`menu-open`; Guidelines: "When the navigation rail is expanded, the menu icon should change to represent that it can be collapsed"), instead of the Close (x) in the head row. The site's logo and name stay beside it, because the menu is the site's own and has no other place for them.
- **Why the name stays:** a rename changes the exported names and the class names a theme uses, so it needs a `THEME_API` bump; the look change does not. Nothing is removed or renamed here: a new `--mo-comp-navigation-drawer-width-min-default` default, min and max widths instead of a fixed one.

### N2. The active indicator fills the container

- **Material:** Navigation rail, Guidelines: "The active indicator hugs the label text in the expanded nav rail. To achieve a similar style to the baseline navigation drawer, consider modifying the active indicator to fill the container."
- **We do:** the drawer's active indicator fills the container, as before ("Navigation drawers active indicator width 336dp"). M3 allows it. **Date:** 2026-11-15 (the PM's decision).

### N3. Labels only, and sub-pages, in the site's menu

- **Material:** Navigation rail, Guidelines: "Navigation rail items must use icons that symbolize the content of their page"; "All navigation items require a one word label text."
- **We do:** the site's menu items are the site's own pages, which have no icons, and an item with sub-pages unfolds them. Items that have an icon (the editor's) use the rail's 8dp icon-label space. **Date:** 2026-11-15.

### N4. The menu can open from the end edge

- **Material:** Navigation rail, Guidelines: "The navigation rail should be placed on the leading edge of the window"; "Always put the rail in the same place".
- **We do:** the site's menu opens from the edge its button is on (`menuSide` of `header.json`, an owner setting), the end edge included, and its menu button stands on that edge. **Date:** 2026-11-15.

### N5. The scrim, a tap on it and Escape; no custom swipe

- **Material:** Navigation drawer, Guidelines: "Modal navigation drawers use a scrim to block interaction with the rest of an app's content"; dismissal "by tapping the scrim or swiping the drawer toward its anchoring screen edge". Navigation rail, Guidelines: "Predictive back only applies to the modal expanded navigation rail."
- **We do:** a scrim (the dialog's `::backdrop`), light dismiss and Escape through the native `<dialog>` and its `closedby="any"` and back gesture; no custom swipe (Modern Web Guidance, `dialog`: the browser handles the platform's dismissal). **Date:** 2026-11-15.

### N6. The editor's drawers keep one width

- **Material:** "Nav rail expanded container width minimum 220dp", "maximum 360dp" (it hugs its content).
- **We do:** the editor's drawers (`.mo-editor-main-drawer-panel`, `src/editor.css`) keep 360dp (at most the screen less 56dp) through their levels and sections, because the layout beside them counts on that width (`--mo-sys-section-pane-width`, the columns). Editor workspace only. **Date:** 2026-11-15.

### N7. Values only the Specs images carry are left as they were

- **Not read:** "Nav rail expanded top space 44dp" is a token, but how the 56dp active indicator sits in the 64dp item container ("container height 64dp", "short container height 56dp", "container vertical space 6dp") and the container's shape and elevation print no value in the page's text. The PM's decision: leave those as they are. We keep the 56dp item, the 12dp top padding and the drawer's corners and level 1 shadow. **Date:** 2026-11-15. **PR:** this pull request.

## Text measure

### T1. The page's text is 40ch to 60ch wide (owner decision)

- **Material:** Material 3 prints no maximum or minimum text width for body text.
- **We do:** a paragraph or heading of a page's text is at least `--mo-sys-block-text-measure-min` (40ch) and at most `--mo-sys-block-text-measure-max` (60ch) wide (`theme/styles/blocks.css`), as `min-width: min(40ch, 100%)` so a narrow container never scrolls sideways. Blocks of plain text rows (List, Segmented list and its accordion rows, Steps, Blog posts as a list, Testimonials list) are columns at least `--mo-sys-block-list-column-min` (21.5rem, 344px) wide, as many as fit the list's own width (one `repeat(auto-fill, minmax(min(…, 100%), 1fr))` rule, no breakpoint): one column below 720px, two from 720px, three from 1080px, never more in the page container (the owner's addition, 16 Nov: "set max width to 720px. If large split into two columns", then "At 3x360px it splits into three"; 344px instead of 360px so that three columns and their 24px gutters fit the 1104px container). Blog posts rows have a thumbnail before the text, so their columns are at least 30rem (480px) wide (two from 984px) and the date and reading time stay on one line. Steps is one column at most `--mo-sys-block-list-measure-max` (720px) wide. Wide visual blocks keep the container's width. The page container is unchanged. It was 66ch for text, and 48rem for the accordion and Steps. (changed 18 Nov 2026: cards and lists plan): the list rows move onto M3 Expressive's `List` in 0.18 (step 5) and keep these columns (`columns` is the item's own two-column content slot, a different setting); from 0.19 (step 6) a collection that shows cards puts 2 cards side by side from 600 dp and 3 from 840 dp.
- **Why:** the owner's own rule ("p { min-width: 40ch; max-width: 60ch; }", "yes, do that"). **Date:** 2026-11-16. **PR:** this pull request.

## Buttons

### B1. A text button has the other buttons' side padding (owner decision)

- **Material:** m3.material.io/components/buttons/specs (read with Playwright, 16 Nov 2026) prints "The text button's container is invisible at rest, but the opacity and state layers behave the same as other button styles" and "Padding and size measurements of each button size" (Extra small to Extra large). The measurement drawing did not load in the browser and the page's text prints no text-button padding number, so M3's own number is not quoted here. Before this change the theme gave a text button a 12dp side padding (`--mo-comp-button-text-padding: 0.75rem`, "Material's 12dp" in an earlier comment in `theme/styles/blocks.css`), a step narrower than the 24dp of the other buttons.
- **We do:** a text button has the same side padding as the other buttons of its size (24dp for medium, `--mo-comp-button-padding`; the sizes' own padding for the others). `--mo-comp-button-text-padding` (now 1.5rem) is only the shift that lines a text button's label up with the text above it (Segmented list and FAQ buttons, tooltip actions).
- **Why:** the owner's own rule ("The text button should have the same paddings as the other buttons"), seen on the demo Buttons page where the text button stood closer to its neighbours than the others. **Date:** 2026-11-16. **PR:** #852.

## Cards

### CM1. The media of a Cards card has rounded bottom corners (owner decision, 16 Nov 2026)

- **Material:** m3.material.io/components/cards (overview, specs, guidelines, accessibility, read with Playwright, 16 Nov 2026) prints "Shape: 12dp corner radius" for the card container and no shape, size or token for the media (Guidelines › Media: thumbnail, image, video). The Container example on the Cards page draws the media flush with the card's top and both sides, with rounded bottom corners (about the card's radius) so the card's surface shows behind them; its anatomy and measurement diagrams did not render in the headless browser.
- **We do:** the media of a Cards card (`.mo-block-cards__card-picture` and `.mo-block-cards__card-video`, which also clips the playing video; every card kind and the carousel's cards) is its own rounded rectangle, flush with the card's top and sides: its top corners are the card's (less its border), its bottom corners are the card's radius, `--mo-comp-card-radius` (12dp). The card's media with no text under it (`.mo-card__media`, Image grid) already had the card's corners all round.
- **Why:** the owner's decision, 16 Nov 2026, from the real M3 Cards page (Container example); no radius is printed for the media, so it is the card's own, "from the M3 Cards page, Container example, no printed token". **Date:** 2026-11-16. **PR:** this pull request. Checked by `checkCardMediaCorners` (375, 768 and 1280 px). (changed 18 Nov 2026: cards and lists plan): step 3 gives `Card` the M3 `media` prop (an image or a video, edge to edge; `media` as `true` keeps the old meaning); the Cards block's media moves onto it in step 4 and this entry stays current in that pull request. **Step 4 (18 Nov 2026):** the Cards block's media is `Card`'s `media` (a `CardMedia` or a video), and a media slot with text under it has bottom corners of the card's radius (`.mo-card__media-slot:has(+ .mo-card__body)`); a media-only card draws no empty body.

### CM2. The card's type styles and gaps are ours where M3 is silent (cards and lists, step 3)

- **Material:** m3.material.io/components/cards (overview, specs, guidelines, accessibility, read with Playwright, 18 Nov 2026) names the anatomy (container, image, thumbnail, video, headline, subhead, supporting text, buttons, icon buttons, selection controls, linked text, overflow menu) and prints for the container "Shape: 12dp corner radius", "Left/right padding: 16dp", "Padding between cards: 8dp max", the colours, elevations and state opacities of each variant, and the elevated card's icon (24dp, `primary`). It prints no type style for the headline, subhead or supporting text and no gap between the parts.
- **We do:** `Card` draws its parts in M3's order with the list item's type roles (owner, 17 Nov): headline title-large, subhead label-small, supporting text body-medium; gaps from the `--mo-ref-space-*` steps through `--mo-comp-card-*` (media to headline 16dp, headline to subhead 4dp, to the supporting text and the content 8dp, text to the buttons 16dp, the same values the Cards block had). Each is a `--mo-comp-card-*` token that falls back to a `--mo-sys-*` one. Not built yet, and so not a deviation: the thumbnail, icon buttons, the overflow menu, selection controls, linked text, disabled, and the dividers between the parts (M3: inset dividers between related content, full-width above content that expands).
- **Why:** M3 is silent; the nearest M3 pattern is the list item's anatomy and type roles (Lists, Specs). The outlined card's edge turns `on-surface` with focus (Specs, Outlined card, Focused) and the focus ring is the theme's one ring (`--mo-sys-color-primary`, step 1), not the card's `secondary`.
- **Date:** 2026-11-18. **PR:** this pull request.

### CM3. Where a block's part has no card part of its own (cards and lists, step 4)

- **Material:** Cards, Guidelines, Anatomy (read 18 Nov 2026 in step 3, entry CM2): container, media, icon, headline, subhead, supporting text, buttons, linked text. M3 prints no part for a price, a badge, a link line ("Read more") or a trailing arrow, and "An action shouldn't be placed on an actionable surface".
- **We do:** the site's cards use `Card`'s props (media, icon, headline, subhead, supporting, actions). Where a block has something M3 has no part for, it stays the card's content or takes the nearest part: the Price cards' price is the `subhead` (in the price's own type) and its "Popular" label is the `icon` part, so both stay in their old order; the Cards block's "Read more" line (a card that is a link) is the card's `children`, at the bottom, because `actions` never go with `href` (linked text is not built yet); the 404 page's suggestion is a headline (the page) over a subhead ("Did you mean") and has no trailing arrow; Notice's text is the `supporting` text in the notice's own type; Panel's icon and title are `icon` and `headline`. Table, Cookie list and Testimonial are one card with their content as `children` (a table, a quote with its name in a `figcaption`, which must be a direct child of its `figure`); the Testimonial's tags and read-more button have no card part either.
- **Why:** M3 is silent; the nearest M3 pattern keeps the look the owner has ("nothing loses a function"). The editor's inline cards (`src/Inline*.tsx`) keep their own block-card-* classes until the special type moves them to the props, so those rules stay in `cards.css`.
- **Date:** 2026-11-18. **PR:** this pull request.
