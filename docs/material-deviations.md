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

5. **Contextual tools in the docked toolbar:** M3: "Docked toolbar: … best used for global actions that remain the same across multiple pages. Floating toolbar: … best used for contextual actions relevant to the body content or the specific page." We: one docked bar holds the text tools (contextual), the tools of the block typed in place that is active (Add above, Add below, Move, Link, the gear; its own menu in the `⋮`) and the main tools (Insert, Undo, Redo, Section settings). The floating row over a block is gone from the text editor; the list screen of a list the owner made keeps it (it is not the editor's workspace, and M3's floating toolbar is for exactly that). Why: owner decision, one bar for everything ("No, we shouldn't keep two rows"). 2026-11-13.
6. **Docked toolbar at the top:** M3: "Only place docked toolbars at the bottom of the window." We: the top of the text editor, where today's toolbar already is; it stays with the text. Why: the bottom is the keyboard and the save bar. 2026-11-13.
7. **Bar height 44 dp, not 64 dp:** M3: "By default all toolbars are 64dp high"; shorter only "if vertical space is limited". We: 44 dp on every screen size, no padding above or below the buttons. Why: it sits over the text and a phone is short; owner decision. 2026-11-13.
8. **Editor bar and menus ignore the user's density choice:** M3: "People can change density as long as the density controls are accessible" and "Density shouldn't automatically change across breakpoints or orientation unless a person changes it". We: the bar, its `⋮` list and its menus have one fixed size, whatever the person chooses. Why: owner decision, an editor's own UI should take little room. 2026-11-13.
9. **44 × 44 dp buttons and rows in the bar and its menus, not 48:** M3: "All elements need a minimum 48x48dp target area to be accessible." (toolbars/guidelines), "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." (density). We: the buttons and rows are 44 × 44 dp themselves, with 20 dp icons, only in the bar and its menus; everything else stays on 48. Menu rows at 44 dp with 20 dp icons match M3 Expressive's menu tokens (menus/specs, "Menu item height 44dp", "Menu item leading icon size 20dp"); the bar's 20 dp icon is the owner's choice (M3's icon-button size in a toolbar was not readable: images and token tables). Why: owner decision, following Apple's Human Interface Guidelines ("a button needs a hit region of at least 44x44 pt"). 2026-11-13.
10. **Rows that do not apply are hidden, not disabled (Text style in a list item or a heading):** M3: "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed." We: in a list item the heading rows and Quote are hidden; in a heading the list rows and Quote are hidden. Why: owner decision ("No headings in the list item text list. And no list item in the menu if in a heading."); Quote is hidden in both by the PM, open for the owner's correction. 2026-11-13.
11. **The `⋮` is a pop-up menu on a phone, with an overlay scrollbar:** M3: "Consider adapting menus into bottom sheets on small screens." and "Menus can scroll when all menu items can't display at once. In this state, menus show a persistent scrollbar." We: a pop-up under the button on every width; `scrollbar-width: thin` and `scrollbar-gutter: stable` keep a scrollbar in view where the platform allows (a computer), and a phone's overlay scrollbar hides when idle and cannot be forced. Why: owner decision (the text keeps its cursor and the keyboard stays open); the platform. M3's "Don't use gaps in scrollable menus" is met: the menu uses dividers only. 2026-11-13.

12. **The contextual tools slide in and push the main tools right, and slide out again:** M3 describes no such behaviour. The only motion text read (m3.material.io/components/toolbars/guidelines, 13 Nov 2026): "Docked toolbars can either remain on the screen during scroll, or animate offscreen", the floating toolbar can "collapse into a single, high-emphasis action on scroll", and "Don't collapse actions and scroll at the same time."; how a toolbar's items animate when they change is not described. We: when a context starts (the cursor in the text, a block active) its tools and their divider slide in from the leading side and push the main tools and the `⋮` along; when it ends they slide out and the main tools slide back; from one context to another the tools cross-fade in place (the old ones fade out as the new ones fade in, no second slide; owner decision 14 Nov). Only the theme's springs (`motionTiming`: `--motion-spatial-fast`, `--motion-effects`), nothing when the visitor asked for reduced motion, and the bar's height and dividers never move. Why: owner decision, 13 Nov ("the contextual menu slides in from the left and pushes the main menu to the right"), PR 3 of the plan. 2026-11-13.

## Density (owner decisions, 13 Nov; spec `docs/superpowers/specs/2026-11-13-density-design.md`, PR 2)

Read 13 Nov 2026 on m3.material.io: `/foundations/layout/grids-spacing/density`, `/components/segmented-buttons/specs`, `/components/chips/specs`, `/components/text-fields/specs`, `/components/buttons/specs`, `/components/lists/specs`.

12. **Large (+1) is a step above M3's default:** M3: "The density scale is numbered, starting at 0 for a component's default density. The scale moves to negative numbers (-1, -2, -3) as space decreases, creating higher density." M3 has no step above 0. We: Large adds 4 dp to the height (or 2 dp a side of padding), by the same rule M3 gives for a step down. Why: the owner's screenshot of the density page offers Large, Medium and Small.
13. **Horizontal padding does not change with density:** M3's text: "Text size shouldn't change as the container size scales." and "Center the grouped element within the component container." It prints no rule for the left and right padding. We: only height and vertical padding follow density (owner rule), so text and grids stay aligned.
14. **A list row is never lower than the target:** M3: "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." and "Target size must be at least 48x48dp" (lists/specs). The row is its own target, so at -2 and -3 (a theme's choice) it stays at 48 dp on touch and 44 dp for a mouse (`--mo-target`), instead of shrinking the image and keeping a hit area.
15. **Buttons, chips and segmented buttons get an invisible target area:** M3: "Touch targets are the parts of the screen that respond to user input, extending beyond the visual bounds of an element." (structure, Target sizes), and "Pointer targets … minimums 44 x 44dp". We: a part lower than `--mo-target` gets an invisible area down from its middle (a `::after`), at every step, so Small never shrinks a target. A removable chip, which has buttons in it, has none.

## Footer links (owner decision, 14 Nov)

Read 14 Nov 2026 on m3.material.io: `/foundations/designing/structure` (the target-size section; `/foundations/accessible-design/accessibility-basics` has no text on targets).

16. **Footer links are 36 px high, not 48:** M3 (structure): "For most platforms, consider making touch targets at least 48 x 48dp.", "Consider making pointer targets minimums 44 x 44dp.", "targets separated by 8dp of space or more promote balanced information density and usability." (M3 words these as "consider", not "must".) We: the editor footer's links (Support, System status, Report security issues, Privacy policy, Licenses) are exactly 36 px high on every width, the padding on the link itself, 12 px each side, no overlap. M3 is silent on text links in a footer and on a smaller target for a dense workspace. Why: owner decision, "Make the footer links 36px high clickable" (phone screenshot of the footer's two lines), in the editor's own workspace. `check:screens` (`checkFooterTargets`) names this exception and asserts 36 px at 320, 375 and 1280 px. 2026-11-14.

## Image tiles in the Library (image grid, PR 1)

Read 14 Nov 2026 on m3.material.io (Playwright): `/components/cards/specs` (measurements), `/foundations/layout/applying-layout/compact`, `/foundations/layout/understanding-layout/overview` and `/foundations/interaction/selection`. The cards token tables stay collapsed in a script-less read, so the token values are not quoted here.

17. **Columns of an image grid:** M3 (layout): "Margins are 16dp from the leading and trailing edge of the window" on compact, and "Padding between cards: 8dp max" (cards/specs). M3 prints no column count for a grid of cards. We: 2 columns on compact, 3 on medium and expanded, 4 from large (`.image-grid`, CSS columns, 8 px apart), our choice on M3's breakpoints. Cards flow down each column, so the sort order reads down, then across.

## Layout grid gutter (M3 grid audit)

Source: `docs/superpowers/specs/2026-11-15-m3-grid-everywhere-audit.md`. Read 15 Nov 2026 on m3.material.io (Playwright): `/foundations/layout/grids-spacing/grids` (the diagram shows 4, 8 and 12 columns; no margin or gutter value is printed), `/foundations/layout/canonical-examples/feed`, `/components/cards/specs`.

### G1. Cards are 16 px apart on compact and 24 px from medium, not 8 px

- **Material:** Cards specs: "Padding between cards 8dp max". M3 prints no gutter for the layout grid.
- **We do:** the theme's layout grid has one gutter, 16 px on compact and 24 px from medium (`--grid-gutter`, owner's numbers; margin is 16 px and 24 px the same way), and cards on the grid use it. It replaces `--card-gap` (0.5rem). Affected when they move onto the grid: the cards block, the cards carousel's grid from 600, the image grid block and the media grid (so entry 17's 8 px gap), price cards, the prices cards, panels, related posts and the editor's uses of `--card-gap`.
- **Why:** owner decision, 15 Nov 2026: "Cards use the 16/24 gutter too", relayed by the 0.18 project manager; one gutter for the whole grid, on the site and in the editor.
- **Date:** 2026-11-15. **PR:** #743 (the decision); the cards move in later pull requests, each of which keeps this entry current.

## The block handle in the page editor (touch selection, step 8)

Read 13 Nov 2026 on m3.material.io (Playwright): `/foundations/interaction/gestures`, `/foundations/interaction/selection` and `/foundations/interaction/states/applying-states`. The page editor's blocks are the editor workspace, where a deviation is allowed.

18. **A block moves at once when its handle is dragged, not after a long press:** M3 (gestures): "Pick up and move: A long press and drag allows people to reorder content." We: every block has a drag handle (a button at its top right, 44 x 44, `touch-action: none`) that starts the drag as soon as the finger moves, as the start screen's cards do (`DashboardEdit.tsx`); the block is raised with the theme's elevation (`--mo-elevation-4-shadow`) and follows the finger, a line shows where it lands, the page scrolls by itself near its top and bottom edge, and it goes there when the finger is lifted. The handle is shown on every block with a touch, and on the block pointed at or in focus with a mouse (M3's hover state). A block the template locks has no handle and is not passed. Why: the handle is a drag control of its own, so the hold M3 prints for a bare item is not needed, and the owner decided the handle and its place ("Top right"); keyboard and screen reader users move a block with Move up and Move down. 2026-11-14.
## Lightbox (image grid, PR 5a)

Read 14 Nov 2026 on m3.material.io (Playwright, page text): `/components/dialogs/guidelines`, `/components/dialogs/accessibility`, `/styles/motion/overview/specs`. M3 prints no lightbox and no image viewer. The dialogs' token tables stay collapsed in a text read, so token values are not quoted.

19. **A lightbox is a modal dialog with its own markup, as large as the window from medium, with a see-through container:** M3 (dialogs, guidelines): "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog.", and "Dialogs are purposefully interruptive, so they should be used sparingly." We: the theme's `Lightbox` is a modal `<dialog>` with the dialog's container and its own header (only the close button) on every size (the theme has no full-screen dialog kind since `THEME_API` 5): the whole screen on a compact window, from medium a container as large as the window less 56 dp on each side (M3's own margin for a dialog placed by hand, from the spec's 13 Nov read) with the dialog's 28 dp corner, because a basic dialog's 280 to 560 dp width is too small for an image. The container is see-through over the scrim (the scrim colour at 88%, `--lightbox-surface`) instead of M3's surface container high, so the image floats on a dark layer; the controls and the caption take the colour opposite to the scrim (`--theme-on-scrim-colour`). Why: owner decision, the image grid spec ("a dark layer, in M3 terms the scrim"); M3 is silent on viewers. The images snap in a horizontal track (CSS scroll-snap, the nearest pattern: M3's carousel page says snap scrolling for full-screen layouts); the Previous and Next buttons are out of sight on a compact window and come back with the keyboard's focus. Motion: M3 web "Standard default effects 0.34, 0.80, 0.34, 1.00, 200ms" for the scrim and the controls, "Standard default spatial 0.27, 1.06, 0.18, 1.00, 500ms" for the image (the dialog's own tokens), instant with reduced motion; the move to the next image is the browser's smooth scroll, not M3's 350 ms fast spatial.

## The text bar

Source: `src/editor.css` (`.editor-text-box`), `src/textBar.mjs`, `src/MarkdownEditor.tsx`. The bar is the editor workspace, so a deviation is allowed.

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

Source: `src/blockRow.ts`, `src/editor.css` (`.site-block-row`), `src/blockBar.ts` (`splitRow`). The block's own actions are the editor workspace, so a deviation is allowed. Read 14 Nov 2026 on m3.material.io (Playwright): `/components/icon-buttons/guidelines` and `/accessibility`.

### The active block has a row of its own actions above its top item

- **Material:** icon buttons "can be placed directly on the background or in most container components, such as cards, app bars, and toolbars"; "the target size of each icon button should be at least 48dp, even when nested"; "the accessibility label for icon buttons describes the action the button is executing"; "on web, icon buttons should display a tooltip with an accessibility label"; "Tab: Focus lands on (non-disabled) icon button". M3 prints no row of actions for one item.
- **We do:** while a block is active, a row opens right above it, right-aligned: Move up, Move down, Hide or Show, Block settings (only when the block has settings) and the drag handle. These actions leave the bar's `⋮`; Remove, Select and the other settings stay there. Standard icon buttons (no container), each 44 dp (the editor's one size, not M3's 48), labelled and with a tooltip (`title`). Move up or Move down that cannot apply (first or last block, a locked neighbour) stays in its place, disabled (`aria-disabled`, the theme's disabled colour) with the reason as `aria-description` and `title`; as with the bar's Move buttons while blocks are selected, M3 prints no way to explain a disabled part. Block settings uses Material Symbols' `tune` so it does not look like the bar's gear (the active row's or item's settings). The row opens by its height with the spatial spring (`motionTiming('spatial', 'fast')`), so the page below makes room; under reduced motion it opens at once.
- **Why:** owner idea, 14 Nov 2026: the bar keeps the text and design tools, the block's own actions sit at the block, each action in one place.
- **Date:** 2026-11-14. **PR:** #625.

## Choice group

Source: `theme/ui/ChoiceGroup.tsx`, `theme/ui/choiceGroupFit.mjs`, `theme/styles/ui.css` (`.choice-group`). Spec: `docs/superpowers/specs/2026-11-14-choice-group-design.md`. Read 14 Nov 2026 on m3.material.io (Playwright): `/components/segmented-buttons/overview` and `/guidelines`, `/components/button-groups/overview`, `/guidelines`, `/specs` and `/accessibility`, `/components/radio-button/overview`, `/guidelines`, `/specs` and `/accessibility`, `/components/lists/guidelines` and `/specs`.

### D1. One part switches between a connected button group and a radio list by measured width

- **Material:** "Button groups should move through layouts together in a single line. They shouldn't wrap to a second line." "In compact windows, consider using smaller, narrower buttons so all buttons in the button group can fit." "Buttons at the trailing edge of the button group can be customized to collapse into an overflow menu at smaller breakpoints."
- **We do:** when the buttons' labels do not all fit at an equal share of the width (the widest button × the count + the 2 dp gaps; more than five choices always), the same choice is drawn as a vertical list of radio buttons instead, one choice per row, the whole row the tap target. The form is measured before the first paint and again on a resize, a font load or a density change; the switch back to buttons needs 8 dp more.
- **Why:** owner, 14 Nov 2026: "One theme part that chooses its own form by measuring, so it can never squeeze … it never wraps a group and never overlaps." Smaller buttons still clip long or Danish labels, and an overflow menu hides choices the owner compares.
- **Date:** 2026-11-14. **PR:** the pull request that adds this entry (choice group, the part).

### D2. A radio row shows a small live sample of the look in its trailing slot

- **Material:** a list item's trailing slot holds "Action elements or text: Icon, icon button, or trailing text" or a selection control (lists/specs); M3 prints no sample or preview slot.
- **We do:** a choice that is a look (a button style, a card's design or colour) shows a small, inert drawing of that look, made of the theme's own part, on the right of its row (`.choice-group-sample`, at most 7rem wide, `aria-hidden`), only in the list form.
- **Why:** owner, 14 Nov 2026: "Where a choice is a look … each radio row shows a small live sample on its right."
- **Date:** 2026-11-14. **PR:** the same.

### D3. The choice group's list rows run the whole width of the fields above them

- **Material:** lists/specs: "Label left padding 16dp", "Leading element left padding 16dp"; radio-button/specs (read 14 Nov 2026 with Playwright): "Icon size 20dp", "State layer size 40dp", "Target size 48dp". M3 prints no rule for aligning a radio list with the fields above it.
- **We do:** in the choice group's list the rows have no padding at their sides (`--list-item-padding-inline: 0` on `.choice-group-list`): the radio's 20 dp circle starts where the name and the fields above start, its 40 dp state layer overhangs the edge by 10 dp, a row's sample ends at the fields' right edge, and a text button's sample ends with its text (its 12 dp side padding overhangs). The circle sits on the label's middle line.
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

Source: `src/CropView.tsx`, `src/editor.css` (`.crop-page`). Spec: `docs/superpowers/specs/2026-11-14-image-tools-design.md` (section 3). Read 14 Nov 2026 on m3.material.io (Playwright): `/components/dialogs/guidelines`, `/specs` and `/accessibility`, `/components/sliders/guidelines` and `/accessibility`, `/components/toolbars/guidelines`. The dialogs' and sliders' token tables stay collapsed in a text read, so no token value is quoted.

### C1. The crop view is a page of the editor on every width, not a dialog

- **Material:** "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "To save a selection in a full-screen dialog, use Save. The close icon or dismissive action, such as Cancel or Back, should close the dialog." "When someone dismisses a full-screen dialog, a basic dialog should appear to confirm that they want to discard the unsaved changes."
- **We do:** the crop view is a page on every width: a layer the size of the window over the editor (a modal `<dialog>` with no dialog parts, so the form under it keeps its changes and its scroll place), with the theme's top app bar (back arrow and the title `Crop`), the image area, the aspect ratios and the zoom, and a bottom bar with `Save` (and `Cancel` from medium). The phone's back gesture leaves it (a step of its own in the history, as the sheets have). Leaving with changes asks the basic dialog `Keep your changes?`, as M3 says for a full-screen dialog; the dialog's other parts are not used.
- **Why:** owner decision, 14 Nov 2026: "Convert all full screen views to pages." (relayed by the project manager). Save is in the bottom bar on a phone, as the owner's rule for Save buttons says.
- **Date:** 2026-11-14. **PR:** #686.

## The FAB above the footer

Source: `src/fabPresence.tsx` (`useFabLift`), `src/Screen.tsx`, `src/editor.css` (`.editor-fab`). Read 15 Nov 2026 on m3.material.io (Playwright, `document.body.innerText`, collapsed sections opened): `/components/floating-action-button/overview`, `/specs`, `/guidelines` and `/accessibility`. The specs print the container (56dp by 56dp) and no margin to the window's edge or to other parts, so the 16 dp margin is the one the editor already used, not M3's.

### F1. The FAB moves up while the footer is in the window

- **Material:** "FABs remain in place on scroll." "The container shouldn't be covered by other elements, such as badges." "In compact and medium breakpoints, the best place for the FAB is typically the lower right corner of a screen, since it's easy to reach and is less likely to cover important content." "FABs persist on the screen when content is scrolling" (Overview). "Don’t completely obscure an actionable element and its focus indicator" (Accessibility). M3 prints nothing about a footer under a FAB.
- **We do:** the FAB stays at the bottom right, 16 dp from the edges. While the editor's footer is in the window (a short screen, or the end of a long one), the FAB stands 16 dp above the footer's top edge, so it never covers a footer link or the copyright line, and it goes back to its place when the footer leaves the window. The content leaves room for the FAB above the footer. It follows the scroll directly, with no motion of our own. `check:screens` (`checkFabAboveFooter`, 375 and 1280) fails when the FAB overlaps the footer.
- **Why:** owner, 15 Nov 2026: the FAB "must move up when the footer ... is beneath it, so the footer links are never covered"; on a phone it sat on top of "Report security issues" and the copyright line. M3's own rule that the FAB is not covered, and that it should not cover content, points the same way.
- **Date:** 2026-11-15 (owner). **PR:** this pull request.

### C2. The zoom slider's inactive track is the secondary container

- **Material:** the sliders' token table (the colours of the active and inactive track) stayed collapsed in a text read, so M3's colour for the inactive track could not be quoted and the theme's choice (`--slider-inactive-track: --mo-surface-container-high`) could not be compared with it.
- **We do:** in the crop view the inactive track is `--mo-secondary-container`.
- **Why:** the theme's inactive track is the colour of the crop view's image area, so the track did not show.
- **Date:** 2026-11-14. **PR:** #686.

## A block's sheet on a phone

Source: `src/BlockDialog.tsx` (the `subpage` look), `src/sheetPlacement.mjs`, `src/editor.css` (`.crop-page`, `.block-page`). Spec: `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md` (4.2). Read 15 Nov 2026 on m3.material.io (Playwright): `/foundations/layout/canonical-examples/list-detail`, `/components/app-bars/guidelines`, `/specs` and `/accessibility`, `/components/dialogs/guidelines`, `/components/toolbars/overview` and `/guidelines`.

### B1. A block's fields on a phone are a subpage with Save in the bottom bar

- **Material:** "Compact: Use a single-pane layout. Only one view is visible at a time, either list or detail"; "Back button: Appears in detail view only for single-pane layouts"; "The detail pane should typically show in a single-pane layout, and an app bar appears". The app bar's leading button can be "A back arrow, which returns to the previous screen". Save is printed in three places only: "The primary action should alter or exit the entire page, like Send, Save, or Edit" as an app bar action ("To boost visibility of a primary action, change the style of the icon button to filled or tonal"); "To save a selection in a full-screen dialog, use Save" (a text button in the dialog's header); and a filled icon button or FAB in a docked toolbar. M3 prints no filled, labelled `Save` button in a bottom bar.
- **We do:** a block's fields on a compact window (below 600 dp) are a subpage of the page form, drawn as the crop view is: the top app bar has the back arrow and the block's name only (no action), the fields are below it, and `Save` (`Insert` for a new block), a filled button with a label, is in a bottom bar. Back (the arrow, Esc, the browser's and Android's back) with changes asks "Keep your changes?" and with none just goes back; Back or `Save` returns to the block in the page at the same scroll place. From medium the sheet is the modal side sheet with `Save` and `Cancel` as before, and from expanded the live side sheet.
- **Why:** owner decisions, 14 Nov 2026: "Convert all full screen views to pages." and "Save buttons on mobile go in the bottom bar", relayed by the 0.18 project manager. A word cannot be misread (M3's own examples of a primary action are words), the bottom bar is where the owner wants every Save on a phone, and the page keeps the form under it as M3's list-detail asks.
- **Date:** 2026-11-14 (owner's approval, relayed by the 0.18 PM). **PR:** #650.

### B2. On a phone every view that is a full-screen dialog or a side sheet is a page

- **Material:** "Full-screen dialogs are for compact breakpoints only, like mobile devices." (dialogs/guidelines); "Modal side sheets are preferred in compact breakpoints, like mobile, due to limited screen size." (side-sheets/guidelines); list-detail on compact: "Only one view is visible at a time, either list or detail", with a back button and an app bar. M3 prints no page with `Save` in a bottom bar (see B1).
- **We do:** the rule (owner, 15 Nov 2026: "We have agreed on moving away from full screen and sidebar on mobile and instead using pages."): below 600 dp no view of the editor is a full-screen dialog or a side sheet. Each is a page with the top app bar (back arrow and the headline), its content, `Save` filled in a bottom bar when it has one, and Back with unsaved changes asking "Keep your changes?". The computer keeps the side sheet. Built so far: the crop view (#686), the Preview (#696) and a block's settings (#650, B1). The theme's `Dialog` has no full-screen kind any more (`THEME_API` 5). Not yet pages (the follow-up views are listed in the pull request #650): Notifications (`Notifications.tsx`), the lightbox, the settings sheets of 0.20 (`2026-11-14-settings-sheets-design.md`, which already plans the subpage) and the section settings and alt text, which are sheets from the bottom.
- **Why:** owner decision, relayed by the 0.18 project manager on 15 Nov 2026.
- **Date:** 2026-11-15. **PR:** #650 (the rule and the block sheet); the other views in their own pull requests.

## The theme's Dialog

### D1. The theme's Dialog has no full-screen kind

- **Material:** "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete." "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "Dialogs can swap variants as the breakpoint changes. For example, a full-screen dialog can change into a basic dialog at larger breakpoints." (dialogs/guidelines, read with Playwright on 15 Nov 2026).
- **We do:** the theme's `Dialog` (`theme/ui/Dialog.tsx`) is the basic dialog only. The `full-screen` kind, `dialogFullScreenModalClass`, the classes `dialog-full-screen`, `dialog-modal-full-screen`, `dialog-header` and `dialog-header-actions` and the two `--dialog-full-screen-*` tokens are gone, and `THEME_API` is 5. A task that needs a whole screen is a page with the top app bar's back arrow (B2). The lightbox is its own modal `<dialog>` with the dialog's container (19).
- **Why:** owner decision, 14 Nov 2026: no full-screen views anywhere; full screens become pages with a back arrow. It is the same thing as the dialog's full-screen kind, so the kind is removed (relayed by the 0.18 project manager).
- **Date:** 2026-11-15. **PR:** the pull request that removes the kind.
