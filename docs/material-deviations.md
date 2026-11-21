# Deviations from Material Design

Every place where we deliberately do something other than Material Design 3 (M3) is listed here, so we know we took the
decision. Each entry says what Material says, what we do instead, why, the date and the pull request. A deviation that
is not listed here is a bug. Add the entry in the same pull request as the change.

**Which M3 we follow** (owner, 15 Nov 2026): the theme follows Material 3 Expressive wherever a component has an Expressive variant; otherwise baseline M3.

**Priority order** (owner, 15 Nov 2026): 1. Modern web, 2. M3 Expressive, 3. M3, 4. M2 with M3 styling. Where they conflict, the lower number wins.

Entries from the colour sweep and the CSS sweep were sent by those workers on 2026-11-13.

**Section colours are not a deviation any more** (0.19.5 batch 4, #1115; owner, 21 Nov 2026: "we will no longer follow our FRONTEND deviations, instead we will follow md3"). A section on Primary, Secondary or Tertiary is painted with M3's container of its colour and its text and icons are the container's on-colour (`theme/styles/tokens/material/sys.css`); a section with an image uses M3's inverse set (`inverse-surface`, `inverse-on-surface`, `inverse-primary`); the blocks read these roles through `theme/styles/tokens/blocks/sys.css`. The old entries (the inverted theme, the veils of 14, 7 and 35 %, quieter text at full strength) are removed. The design is in `docs/superpowers/specs/2026-11-21-section-colours-m3-roles-design.md`.

## Colour sweep

Source: `scripts/check-colors.allow.mjs` (came in with #469); each entry names its own file. Ids CS1 to CS11. Audit: `docs/superpowers/2026-11-13-colour-sweep-audit.md`.

- **CS1. Status badges** (`--mo-comp-badge-ok`, `--mo-comp-badge-minor`, `--mo-comp-badge-major`, `theme/styles/tokens/material/comp/badge.css`). M3 has no success or warning role. We use fixed colours, darker in light mode and brighter in dark mode, because no role fits. The M3 way is custom or extended colours, a seed per status harmonised with the primary, each generating four roles; that is proposed as a later decision in the audit doc and not built. 2026-11-13. #469.
- **CS2. PageSpeed ratings in the editor** (`--mo-comp-editor-status-good/average/bad`, `src/editor.css`). PageSpeed's own red, orange and green, fixed so they match what the tool reports. 2026-11-13. #469.
- **CS3. Google search-result preview** (`--mo-comp-google-*` in `src/editor.css`, light and dark; drawn by `src/SearchPreview.tsx`). It imitates Google's own look, so it is fixed. 2026-11-13. #469.
- **CS4. Colour picker** (`src/ui.tsx`, `src/Parts.tsx`): hue and saturation gradients, default swatches, and black or white text on a swatch chosen by contrast. The owner's chosen colour is not a role. 2026-11-13. #469.
- **CS5. Preview frame** (`.mo-editor-preview-frame`, `background-color: #fff`, `src/editor-screens.css`, shown by `src/PreviewScreen.tsx`) and the white picker thumb (`.mo-editor-drag-thumb`, `border: 3px solid #fff`, `src/editor-ui.css`). The Preview shows the page on paper, whatever the editor's colours; the thumb is white over any colour. 2026-11-13. #469.
- **CS6. Video still** (`.mo-block-video__facade` and `.mo-block-video__facade-still` in `theme/styles/blocks/prose.css`): white title and play button over a black gradient scrim on an image. M3 would use the scrim role plus an on-colour. We use fixed black and white because the image is arbitrary and the title must stay readable on it. 2026-11-13. #469.
- **CS7. Image masks** (`mask-image: linear-gradient(to bottom, #000 55%, transparent)` in `theme/styles/blocks/testimonial.css` and `theme/blocks/testimonials/Testimonial.tsx`). Only alpha matters, so `#000` is just the opaque stop. 2026-11-13. #469.
- **CS8. Scrim and shadow roles** are `#000000` in `lib/dynamic-colors.ts`, which is M3's own definition. The scheme seeds in `defaults/colors.ts` and `demo/src/site/colors.ts` are fixed `source: '#…'`. 2026-11-13. #469.
  - **Not M3 yet (0.19.7, not built):** the colour generator's harmonies and Custom are not M3 schemes; they are being fixed in 0.19.7 (`docs/superpowers/specs/2026-11-21-m3-color-schemes-design.md`, on PR #1071).
- **CS9. Brand mark favicons and the example SVG image** in `src/examples.ts`. They are images, not themed parts. 2026-11-13. #469.
- **CS10. Sign-in page of the AI connection** (`worker/mcp-oauth.js`). A standalone page with no theme CSS, so it uses CSS system colours (`ButtonFace`, `AccentColor`, …) and `color-scheme: light dark` instead of M3 roles. 2026-11-13. #478.
- **CS11. Block variable defaults** (`--mo-sys-block-*` in `theme/styles/tokens/blocks/sys.css`). Older non-M3 variable names kept as aliases of the roles; the defaults now map to the roles, as `base.css` does. Kept because the blocks and every theme use them. 2026-11-13. #480.

Not deviations, fixed to M3: hover 5% and 6% became M3's 8% (#474), and the snackbar fallbacks use the inverse roles (#471).

## Editor-only parts

A part is a theme part only if the front end could reuse it (owner, 2026-11-13). The parts below stay in the editor on purpose.

- **EP1. Score ring** (`ScoreRing`, defined in `src/ui.tsx`, shown in `src/Parts.tsx`, used in `src/SeoScores.tsx` and `src/Library.tsx`): the SEO score as a ring with a tone. M3 has a circular progress indicator, but the ring shows a score with its own tones and the front end never shows one ("a very specific component that is not reusable in front end"), so it stays the editor's own and takes its colours and sizes from tokens. 2026-11-13, owner decision. #515.
- **EP2. Colour and icon pickers** (`ColorWheel`, `ColorSwatches`, `IconPicker`, `IconSwatches`): editor tools the front end does not use. 2026-11-13, owner decision. #515.

## The editor's bars (owner decisions, 13 Nov)

The editor's own bars are its workspace, where the owner allows deviations. Each is listed with what M3 prints (m3.material.io, read 13 Nov 2026).

- **EB1. Save bar is the standard bottom sheet (done for the page form; the block page and the crop view on 15 Nov, B1 and C1):** M3: "Bottom sheets display supplementary content and actions on a mobile screen", "Content should be additional or secondary (not the app's main content)", "Use bottom sheets in compact and medium breakpoints". We use the standard bottom sheet, docked as a bar at the bottom on every width, for the page's Save row, with no blur and no custom design. Why: owner decision, "If it's the same bar at the bottom of the screen on pages and blocks, it should use the bottom sheet design and not its own custom design." 2026-11-13. #515 (spec only).

## The text's one bar (owner decisions, 13 Nov; spec `docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md`, PR 1)

Read 13 Nov 2026 on m3.material.io: `/components/toolbars/` (guidelines, specs, accessibility), `/components/menus/guidelines`, `/foundations/designing/structure` and the density page. The bar is the editor's own workspace.

- **EB2. Contextual tools in the docked toolbar:** M3: "Docked toolbar: … best used for global actions that remain the same across multiple pages. Floating toolbar: … best used for contextual actions relevant to the body content or the specific page." We: one docked bar holds the text tools (contextual), the tools of the block typed in place that is active (Add above, Add below, Move, Link, the gear; its own menu in the `⋮`) and the main tools (Insert, Undo, Redo, Section settings). The floating row over a block is gone from the text editor; the list screen of a list the owner made keeps it (it is not the editor's workspace, and M3's floating toolbar is for exactly that). Why: owner decision, one bar for everything ("No, we shouldn't keep two rows"). 2026-11-13.
- **EB3. Docked toolbar at the top:** M3: "Only place docked toolbars at the bottom of the window." We: the top of the text editor, where today's toolbar already is; it stays with the text. Why: the bottom is the keyboard and the save bar. 2026-11-13.
- **EB4. Bar height 44 dp, not 64 dp:** M3: "By default all toolbars are 64dp high"; shorter only "if vertical space is limited". We: 44 dp on every screen size, no padding above or below the buttons. Why: it sits over the text and a phone is short; owner decision. 2026-11-13.
- **EB5. Editor bar and menus ignore the user's density choice:** M3: "People can change density as long as the density controls are accessible" and "Density shouldn't automatically change across breakpoints or orientation unless a person changes it". We: the bar, its `⋮` list and its menus have one fixed size, whatever the person chooses. Why: owner decision, an editor's own UI should take little room. 2026-11-13.
- **EB6. 44 × 44 dp buttons and rows in the bar and its menus, not 48:** M3: "All elements need a minimum 48x48dp target area to be accessible." (toolbars/guidelines), "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." (density). We: the buttons and rows are 44 × 44 dp themselves, with 20 dp icons, only in the bar and its menus; everything else stays on 48. Menu rows at 44 dp with 20 dp icons match M3 Expressive's menu tokens (menus/specs, "Menu item height 44dp", "Menu item leading icon size 20dp"); the bar's 20 dp icon is the owner's choice (M3's icon-button size in a toolbar was not readable: images and token tables). Why: owner decision, following Apple's Human Interface Guidelines ("a button needs a hit region of at least 44x44 pt"). 2026-11-13.
- **EB7. Rows that do not apply are hidden, not disabled (Text style in a list item or a heading):** M3: "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed." We: in a list item the heading rows and Quote are hidden; in a heading the list rows and Quote are hidden. Why: owner decision ("No headings in the list item text list. And no list item in the menu if in a heading."); Quote is hidden in both by the PM, open for the owner's correction. 2026-11-13.
- **EB8. The `⋮` is a pop-up menu on a phone, with an overlay scrollbar:** M3: "Consider adapting menus into bottom sheets on small screens." and "Menus can scroll when all menu items can't display at once. In this state, menus show a persistent scrollbar." We: a pop-up under the button on every width; `scrollbar-width: thin` and `scrollbar-gutter: stable` keep a scrollbar in view where the platform allows (a computer), and a phone's overlay scrollbar hides when idle and cannot be forced. Why: owner decision (the text keeps its cursor and the keyboard stays open); the platform. M3's "Don't use gaps in scrollable menus" is met: the menu uses dividers only. 2026-11-13.

- **EB9. The contextual tools slide in and push the main tools right, and slide out again:** M3 describes no such behaviour. The only motion text read (m3.material.io/components/toolbars/guidelines, 13 Nov 2026): "Docked toolbars can either remain on the screen during scroll, or animate offscreen", the floating toolbar can "collapse into a single, high-emphasis action on scroll", and "Don't collapse actions and scroll at the same time."; how a toolbar's items animate when they change is not described. We: when a context starts (the cursor in the text, a block active) its tools and their divider slide in from the leading side and push the main tools and the `⋮` along; when it ends they slide out and the main tools slide back; from one context to another the tools cross-fade in place (the old ones fade out as the new ones fade in, no second slide; owner decision 14 Nov). Only the theme's springs (`motionTiming`: `--mo-sys-motion-spring-fast-spatial`, `--mo-sys-motion-spring-default-effects`), nothing when the visitor asked for reduced motion, and the bar's height and dividers never move. Why: owner decision, 13 Nov ("the contextual menu slides in from the left and pushes the main menu to the right"), PR 3 of the plan. 2026-11-13.

## Density (owner decisions, 13 Nov; spec `docs/superpowers/specs/2026-11-13-density-design.md`, PR 2)

Read 13 Nov 2026 on m3.material.io: `/foundations/layout/grids-spacing/density`, `/components/segmented-buttons/specs`, `/components/chips/specs`, `/components/text-fields/specs`, `/components/buttons/specs`, `/components/lists/specs`.

- **DN1.** *(Removed 21 Nov 2026, 0.19.5 batch 10: owner, "follow m3".)* Large (+1) is gone, Medium is 0 and the scale goes 0, -1, -2, -3 as M3 prints it ("The density scale is numbered, starting at 0 for a component's default density. The scale moves to negative numbers (-1, -2, -3) as space decreases"). A stored Large is read as Medium. Read 21 Nov 2026: `/foundations/layout/grids-spacing/density`, `/components/segmented-buttons/specs` ("Each step down in density removes 4dp from the height"), `/components/button-groups/specs`, `/components/menus/guidelines` ("On web only, density levels control the spacing between elements"; image "Density of menus from 0 to -3"). Every part that M3 gives a density (and the theme's buttons, chips, text fields, list rows and table rows, which M3's guidelines allow as an opt-in) goes the whole scale in the theme's styling; the editor's setting keeps Medium and Small. **Menus:** the theme's `Menu` and dropdowns go the scale too (owner, 21 Nov 2026, relayed by the 0.19.5 PM: the site follows M3, not the earlier choice that they never get denser than Medium; M3's menus page prints it). The editor's own bar and ⋮ menus stay fixed at 44 x 44 (EB6). **Table rows** go the scale too (the Table block's rows are 52, 48, 44, 40 and its header 56, 52, 48, 44). The date picker's day rows are not a table of rows to scan: M3's date picker is a focused single task with 48 dp days, so they stay 48 at every step.
- **DN2. Horizontal padding does not change with density:** M3's text: "Text size shouldn't change as the container size scales." and "Center the grouped element within the component container." It prints no rule for the left and right padding. We: only height and vertical padding follow density (owner rule), so text and grids stay aligned.
- **DN3. A list row is never lower than the target:** M3: "Accessible targets should retain a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." and "Target size must be at least 48x48dp" (lists/specs). The row is its own target, so at -2 and -3 (a theme's choice) it stays at 48 dp on touch and 44 dp for a mouse (`--mo-sys-target-size`), instead of shrinking the image and keeping a hit area. The site's own floor is the target too, which is at least WCAG 2.2's 24 px (2.5.8).
- **DN4. Buttons, chips and segmented buttons get an invisible target area:** M3: "Touch targets are the parts of the screen that respond to user input, extending beyond the visual bounds of an element." (structure, Target sizes), and "Pointer targets … minimums 44 x 44dp". We: a part lower than `--mo-sys-target-size` gets an invisible area down from its middle (a `::after`), at every step, so Small never shrinks a target. A removable chip, which has buttons in it, has none. **In a group the area stops half way to the next part** (21 Nov 2026, 0.19.5, owner: a tap must never land on the wrong control; at -3 on a phone the area of `Several lines 1`, a 20 px chip, covered the chip above it): M3 gives 8 dp between chips and buttons, which is less than a 48 dp target needs at a dense step, so both cannot hold. A part in a group (a chip set, a button group, a split button's halves, a button in a field, the buttons of a date picker) has `--mo-sys-target-gap` (or `-block`, `-inline`): the room round it, 0 where parts touch. Its area reaches out half of it at most, so two neighbours' areas meet in the middle of the gap and never cross, and the part plus its gap is the target. That is below 48 at -2 and -3 (a chip set at -3: 20 + 8 = 28 px high), never below 24 px, and the 8 dp gap keeps WCAG 2.2's 2.5.8 (a 24 px circle on each part's middle crosses no other). A part alone keeps the whole target. `checkDensityTargets` (`scripts/screens/density.mjs`) hit-tests 9 points of every control on `/ui/` at -3 on a phone and a computer.

## Footer links (owner decision, 14 Nov)

Read 14 Nov 2026 on m3.material.io: `/foundations/designing/structure` (the target-size section; `/foundations/accessible-design/accessibility-basics` has no text on targets).

- **FL1. Footer links are 36 px high, not 48:** M3 (structure): "For most platforms, consider making touch targets at least 48 x 48dp.", "Consider making pointer targets minimums 44 x 44dp.", "targets separated by 8dp of space or more promote balanced information density and usability." (M3 words these as "consider", not "must".) We: the editor footer's links (Support, System status, Report security issues, Privacy policy, Licenses) are exactly 36 px high on every width, the padding on the link itself, 12 px each side, no overlap. M3 is silent on text links in a footer and on a smaller target for a dense workspace. Why: owner decision, "Make the footer links 36px high clickable" (phone screenshot of the footer's two lines), in the editor's own workspace. `check:screens` (`checkFooterTargets`) names this exception and asserts 36 px at 320, 375 and 1280 px. Editor exception (the editor's own footer, `src/FooterLink.tsx`; owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend."). 2026-11-14.

## The block handle in the page editor (touch selection, step 8)

Read 13 Nov 2026 on m3.material.io (Playwright): `/foundations/interaction/gestures`, `/foundations/interaction/selection` and `/foundations/interaction/states/applying-states`. The page editor's blocks are the editor workspace, where a deviation is allowed.

- **BH1. A block moves at once when its handle is dragged, not after a long press:** M3 (gestures): "Pick up and move: A long press and drag allows people to reorder content." We: every block has a drag handle (a button at its top right, 44 x 44, `touch-action: none`) that starts the drag as soon as the finger moves, as the start screen's cards do (`DashboardEdit.tsx`); the block is raised with the theme's elevation (`--mo-sys-elevation-level4-shadow`) and follows the finger, a line shows where it lands, the page scrolls by itself near its top and bottom edge, and it goes there when the finger is lifted. The handle is shown on every block with a touch, and on the block pointed at or in focus with a mouse (M3's hover state). A block the template locks has no handle and is not passed. Why: the handle is a drag control of its own, so the hold M3 prints for a bare item is not needed, and the owner decided the handle and its place ("Top right"); keyboard and screen reader users move a block with Move up and Move down. 2026-11-14.
## The text bar

Source: `src/editor.css` (`.mo-editor-text-box`), `src/textBar.mjs`, `src/MarkdownEditor.tsx`. The bar is the editor workspace, so a deviation is allowed.

### TB1. The text's box is 10.5 dp from the screen's edges on a phone

- **Material:** M3 prints 16 dp margins on a phone (as the PM gave it; this entry did not re-read the m3.material.io page).
- **We do:** the text's box, with its bar, is 5.5 dp wider on each side below the medium breakpoint: 354 dp outer at 375 px (352 dp inside its 1 dp edges), 10.5 dp from each edge.
- **Why:** owner decision, 14 Nov 2026: eight 44 dp icons (four text tools, Undo, Redo, Insert block and the ⋮) fit on the bar.
- **Date:** 2026-11-14. **PR:** #602.

### TB2. The bar has no divider and keeps Undo, Redo and Insert block at the right end

- **Material:** a toolbar groups its actions; M3 prints no rule for a fixed group at the end.
- **We do:** no divider on the bar; Undo, Redo and Insert block (then the ⋮) stand at the right end in every place.
- **Why:** owner decision, 14 Nov 2026: the same buttons in the same place whatever the cursor is in.
- **Date:** 2026-11-14. **PR:** #602.

### TB3. The text bar fills its width with as many tools as fit

- **Material:** a toolbar puts what does not fit "in an overflow menu in the trailing slot" and shows it again at larger sizes (toolbars/guidelines, read 13 Nov 2026); it prints no count per width.
- **We do:** no count of tools per screen width. The bar's inside width is a budget and each tool has a known width (`TOOL_WIDTH` in `src/textBar.mjs`, pinned to the drawn size by `check:screens`). The tools fill from the left in their order while the next one fits; the first that does not, and all after it, go in the `⋮`, so no gap as wide as the next tool is left. Undo, Redo, Insert block and the `⋮` stay at the right end; the `⋮` takes room only when something is in it.
- **Why:** owner requirement, 14 Nov 2026: the bar adapts and fits the maximum number of tools, also when the window is resized.
- **Date:** 2026-11-14. **PR:** #618.

## Selecting several blocks of a page (touch selection, step 9)

Read 13 Nov 2026 on m3.material.io (Playwright): `/foundations/interaction/selection`, `/foundations/interaction/states/applying-states`. The page editor's blocks and its one bar are the editor workspace, where a deviation is allowed.

- **SEL1. The selection's tools are the contextual group of the text's one bar, not a swapped top bar; the count and the cross are one control:** M3 (selection): "To exit a selection mode, tap each selected item until they’re unselected, or tap an action on the toolbar." and "On desktop, checkboxes are always visible when selection is the primary activity. When selection is secondary, checkboxes (or other indicators) are displayed: As a single checkbox for that item on hover; For all items after one item is selected". M3 prints no bar of its own for a selection. We: a block's round mark (an empty circle, a filled circle with a check; centred on the block's top left corner so it covers nothing in the block, as in the page's photo-grid example) shows on the block pointed at and on every block once one is selected, never with a touch before that; a press and hold on a block's handle (or Space on a focused card, or *Select* in its menu) starts selecting, a tap or click adds or removes a block, and the text is read-only meanwhile. The one bar shows the count with a cross first (two slots wide; the cross clears the selection, as do Escape and Back) and in its `⋮` Duplicate (one block, and not where the template allows no more of it), Hide or Show (all selected), Remove (after a question that names the blocks and the ones the page needs, which stay selected) and Select all. Why: the owner decided the one toolbar for block selection ("Yes, use the one toolbar") and the handle's place; the cross and count in one control is the spec's own (section 6.5). Move up and Move down are on the bar and move the selection one place together; they are disabled, with the reason as `aria-description` and `title`, when the blocks are not next to each other or cannot go further (not past a locked block). With two or more selected every block's drag handle is shown disabled (`aria-disabled`, the theme's disabled colour, the same `aria-description` and `title`). M3 (applying states): "Disabled components can’t be focused, dragged, or pressed, and they don’t change state when tapped or hovered over." M3 prints no way to explain a disabled part, and a touch user without a screen reader sees none (the tooltip page needs a hover or a press on the part); none is added. On a phone the bar holds the count, Move up, Move down, Undo, Redo, Add block and `⋮` (the bar's fixed right end is main's). Shift+Arrow on a focused card extends the selection to the block above or below. 2026-11-14.

## The block's action row

Source: `src/blockRow.ts`, `src/editor.css` (`.mo-site-block-row`), `src/blockBar.ts` (`splitRow`). The block's own actions are the editor workspace, so a deviation is allowed. Read 14 Nov 2026 on m3.material.io (Playwright): `/components/icon-buttons/guidelines` and `/accessibility`.

### The active block has a row of its own actions above its top item

- **Material:** icon buttons "can be placed directly on the background or in most container components, such as cards, app bars, and toolbars"; "the target size of each icon button should be at least 48dp, even when nested"; "the accessibility label for icon buttons describes the action the button is executing"; "on web, icon buttons should display a tooltip with an accessibility label"; "Tab: Focus lands on (non-disabled) icon button". M3 prints no row of actions for one item.
- **We do:** while a block is active, a row opens right above it, right-aligned: Move up, Move down, Hide or Show, Block settings (only when the block has settings) and the drag handle. These actions leave the bar's `⋮`; Remove, Select and the other settings stay there. Standard icon buttons (no container), each 44 dp (the editor's one size, not M3's 48), labelled and with a tooltip (`title`). Move up or Move down that cannot apply (first or last block, a locked neighbour) stays in its place, disabled (`aria-disabled`, the theme's disabled colour) with the reason as `aria-description` and `title`; as with the bar's Move buttons while blocks are selected, M3 prints no way to explain a disabled part. Block settings uses Material Symbols' `tune` so it does not look like the bar's gear (the active row's or item's settings). The row opens by its height with the spatial spring (`motionTiming('spatial', 'fast')`), so the page below makes room; under reduced motion it opens at once.
- **Why:** owner idea, 14 Nov 2026: the bar keeps the text and design tools, the block's own actions sit at the block, each action in one place.
- **Date:** 2026-11-14. **PR:** #625.

## Choice group

Source: `theme/ui/ChoiceGroup.tsx`, `theme/ui/choiceGroupFit.mjs`, `theme/styles/ui.css` (`.mo-choice-group`). Spec: `docs/superpowers/specs/2026-11-14-choice-group-design.md`. Read 14 Nov 2026 on m3.material.io (Playwright): `/components/segmented-buttons/overview` and `/guidelines`, `/components/button-groups/overview`, `/guidelines`, `/specs` and `/accessibility`, `/components/radio-button/overview`, `/guidelines`, `/specs` and `/accessibility`, `/components/lists/guidelines` and `/specs`.

### CG1. One part switches between a connected button group and a radio list by measured width

- **Material:** "Button groups should move through layouts together in a single line. They shouldn't wrap to a second line." "In compact windows, consider using smaller, narrower buttons so all buttons in the button group can fit." "Buttons at the trailing edge of the button group can be customized to collapse into an overflow menu at smaller breakpoints."
- **We do:** when the buttons' labels do not all fit at an equal share of the width (the widest button × the count + the 2 dp gaps; more than five choices always), the same choice is drawn as a vertical list of radio buttons instead, one choice per row, the whole row the tap target. The form is measured before the first paint and again on a resize, a font load or a density change; the switch back to buttons needs 8 dp more.
- **Why:** owner, 14 Nov 2026: "One theme part that chooses its own form by measuring, so it can never squeeze … it never wraps a group and never overlaps." Smaller buttons still clip long or Danish labels, and an overflow menu hides choices the owner compares.
- **Date:** 2026-11-14. **PR:** #660 (the part).
- **Status:** → 0.20.0 (owner via the CTO, 21 Nov 2026): the choice group follows M3's button group: one line, smaller buttons, then an overflow menu. Nothing changes in 0.19.5.

## Command palette (command palette, step 5)

Source: `docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md` (sections 1b and 9), `src/CommandPalette.tsx`, `theme/ui/Search.tsx` (`SearchView`), `src/Screen.tsx` (`SearchButton`).

### P2. No custom context menu: the browser's or the operating system's menu stays

- **Material:** "A secondary click (whether using a single button or two fingers on a trackpad) should activate a context menu. The context menu shows additional options for the object that's clicked." (Inputs); "A secondary click, like a right-click on a mouse or a two-finger tap on a trackpad, opens a context menu." (Menus).
- **We do:** a right click opens the browser's own menu everywhere in the editor, in text, on blocks, images, table cells, rows, files and links. The editor draws no context menu, and `check:screens` fails if one of those stops the `contextmenu` event. The tools are on the bar, in its `⋮` and in the palette.
- **Why:** owner, 13 Nov 2026: "So we keep the no right click menu." The system menu does Cut, Copy and Paste, spell-check and link items better than we can. The browser's menu is itself a context menu, so this may not be a deviation in a strict reading; it is listed because the PM asked for it.
- **Date:** 2026-11-13 (owner). **PR:** #701.
- **Status:** editor exception, kept as it is (owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend.").

### P3. More than two actions in the top bar on some screens until 0.20

- **Material:** "App bars should only have one action, two if necessary." "Up to two icon buttons can be placed after the headline" (App bars, guidelines).
- **We do:** the search icon button is the first trailing action on every screen. On the start screen (4 actions), on Pages, Blog posts, every list with deleted items and Files (3), and, below expanded, on a page or post being edited (4) or a new one (3), the bar then has more than two. Nothing else moves.
- **Why:** owner, 14 Nov 2026: the palette opens from "a plain search icon button in today's top bar, on every screen", and the owner approved these bars going over M3's two-action limit as a temporary deviation until the 0.20 search app bar, which has "up to two trailing icons on mobile" and "up to four trailing icons on larger screens" and ends this entry.
- **Date:** 2026-11-14 (owner's approval, through the 0.18 PM). **PR:** #701.
- **Status:** editor exception, kept as it is (owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend.").

## The crop view

Source: `src/CropView.tsx`, `src/editor.css` (`.mo-editor-crop-page`). Spec: `docs/superpowers/specs/2026-11-14-image-tools-design.md` (section 3). Read 14 Nov 2026 on m3.material.io (Playwright): `/components/dialogs/guidelines`, `/specs` and `/accessibility`, `/components/sliders/guidelines` and `/accessibility`, `/components/toolbars/guidelines`. The dialogs' and sliders' token tables stay collapsed in a text read, so no token value is quoted.

### C1. The crop view is a page of the editor on every width, not a dialog

- **Material:** "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "To save a selection in a full-screen dialog, use Save. The close icon or dismissive action, such as Cancel or Back, should close the dialog." "When someone dismisses a full-screen dialog, a basic dialog should appear to confirm that they want to discard the unsaved changes."
- **We do:** the crop view is a page on every width: a layer the size of the window over the editor (a modal `<dialog>` with no dialog parts, so the form under it keeps its changes and its scroll place), with the theme's top app bar (back arrow and the title `Crop`), the image area, the aspect ratios and the zoom, and the Save row in the theme's standard bottom sheet (`ActionSheet`, see B1): `Save` filled, and `Cancel` from medium. The phone's back gesture leaves it (a step of its own in the history, as the sheets have). Leaving with changes asks the basic dialog `Keep your changes?`, as M3 says for a full-screen dialog; the dialog's other parts are not used.
- **Why:** owner decision, 14 Nov 2026: "Convert all full screen views to pages." (relayed by the project manager). Save is in the standard bottom sheet, as the owner's rule for Save rows says (EB1 of *The editor's bars*).
- **Date:** 2026-11-14. **PR:** #686; the Save row as a standard bottom sheet: 15 Nov, #740.
- **Status:** editor exception, kept as it is (owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend.").

## A block's sheet on a phone

Source: `src/BlockDialog.tsx` (the `subpage` look), `src/sheetPlacement.mjs`, `src/editor.css` (`.mo-editor-crop-page`, `.mo-editor-block-page`). Spec: `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md` (4.2). Read 15 Nov 2026 on m3.material.io (Playwright): `/foundations/layout/canonical-examples/list-detail`, `/components/app-bars/guidelines`, `/specs` and `/accessibility`, `/components/dialogs/guidelines`, `/components/toolbars/overview` and `/guidelines`.

### B1. A block's fields on a phone are a subpage with Save in the standard bottom sheet

- **Material:** "Compact: Use a single-pane layout. Only one view is visible at a time, either list or detail"; "Back button: Appears in detail view only for single-pane layouts"; "The detail pane should typically show in a single-pane layout, and an app bar appears". The app bar's leading button can be "A back arrow, which returns to the previous screen". Save is printed in three places only: "The primary action should alter or exit the entire page, like Send, Save, or Edit" as an app bar action; "To save a selection in a full-screen dialog, use Save" (a text button in the dialog's header); and a filled icon button or FAB in a docked toolbar. Bottom sheets: "Bottom sheets display supplementary content and actions on a mobile screen"; "Content should be additional or secondary (not the app's main content)"; "Standard bottom sheets co-exist with the screen's main UI region and allow for simultaneously viewing and interacting with both regions"; container colour "Surface container low", "Bottom sheets have a 28dp top corner radius", width "Full width, up to max-width 640dp" (Overview, Specs, Guidelines, read 15 Nov 2026). M3 prints no filled, labelled `Save` button in a bottom sheet, and prints no padding for what is in one.
- **We do:** a block's fields on a compact window (below 600 dp) are a subpage of the page form, drawn as the crop view is: the top app bar has the back arrow and the block's name only (no action), the fields are below it, and the Save row (`Save`, `Insert` for a new block, a filled button with a label) is the theme's standard bottom sheet, the same `ActionSheet` the page form's Save row is: fixed at the bottom, no drag handle or header, lifted above the on-screen keyboard by the sheet. The sheet's content has the theme's padding (16 dp above and below, and the grid margin at the sides: 16 dp on compact, 24 dp from medium), so Save ends where the fields end (owner's approval of the theme change, 15 Nov 2026; entry B3). The page's content ends above the sheet. Back (the arrow, Esc, the browser's and Android's back) with changes asks "Keep your changes?" and with none just goes back; Back or `Save` returns to the block in the page at the same scroll place. From medium the sheet is the modal side sheet with `Save` and `Cancel` as before, and from expanded the live side sheet. What still deviates from M3: Save is a labelled filled button in a sheet whose content M3 calls "additional or secondary", and the sheet has no drag handle, so it has one fixed state.
- **Why:** owner decisions, 14 Nov 2026: "Convert all full screen views to pages." and "Save buttons on mobile go in the bottom bar"; 13 Nov: "If it's the same bar at the bottom of the screen on pages and blocks, it should use the bottom sheet design and not its own custom design."; 15 Nov: "The save bar MUST use the bottom sheet." (relayed by the 0.18 project manager). A word cannot be misread (M3's own examples of a primary action are words), and the page keeps the form under it as M3's list-detail asks.
- **Date:** 2026-11-14 (page and bar, owner's approval, relayed by the 0.18 PM); 2026-11-15 (the bar is the standard bottom sheet). **PR:** #650; the bottom sheet: #740 (`one-save/save-bar-bottom-sheet`).
- **Status:** editor exception, kept as it is (owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend.").

### B2. On a phone every view that is a full-screen dialog or a side sheet is a page

- **Material:** "Full-screen dialogs are for compact breakpoints only, like mobile devices." (dialogs/guidelines); "Modal side sheets are preferred in compact breakpoints, like mobile, due to limited screen size." (side-sheets/guidelines); list-detail on compact: "Only one view is visible at a time, either list or detail", with a back button and an app bar. M3 prints no page with `Save` in a bottom bar (see B1).
- **We do:** the rule (owner, 15 Nov 2026: "We have agreed on moving away from full screen and sidebar on mobile and instead using pages."): below 600 dp no view of the editor is a full-screen dialog or a side sheet. Each is a page with the top app bar (back arrow and the headline), its content, `Save` filled in the standard bottom sheet when it has one, and Back with unsaved changes asking "Keep your changes?". The computer keeps the side sheet. Built so far: the crop view (#686), the Preview (#696) and a block's settings (#650, B1). The theme's `Dialog` has no full-screen kind any more (`THEME_API` 5). Notifications is a page too (`#notifications`, 15 Nov; the side sheet stays from 600 dp). A section's settings are a page too below 600 dp (15 Nov) and, from 600 dp, the live standard side sheet beside the page (owner, 15 Nov: "The settings should show in the right pane and not be a dialog"). M3's supporting-pane page puts a supporting pane below the focus pane at medium and beside it only from expanded (360 dp), while the side-sheets page says standard side sheets are "used mostly in medium to expanded breakpoints"; we follow the owner and the side-sheet page (`docs/superpowers/specs/2026-11-15-section-settings-pane.md`). Not pages, by the owner's decision of 15 Nov: the lightbox (a modal dialog with the dialog's container; *Where Material 3 is silent*) and the alt text sheet, which stay as they are (the alt text sheet is a bottom sheet with Skip and Save). The settings sheets of 0.20 (`2026-11-14-settings-sheets-design.md`) are not yet pages; that plan already has the subpage.
- **Why:** owner decision, relayed by the 0.18 project manager on 15 Nov 2026.
- **Date:** 2026-11-15. **PR:** #650 (the rule and the block sheet); the other views in their own pull requests.
- **Status:** editor exception, kept as it is (owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend.").

### B3. Settings are a pane from 600 dp, not a dialog

- **Material:** dialogs/overview: "Should be dedicated to completing a single task"; dialogs/guidelines: "Dialogs are purposefully interruptive, so they should be used sparingly.", "Common use cases for basic dialogs include alerts, quick selection, and confirmation.", "not every choice or setting warrants interruption"; full-screen dialogs "may be used for ... Dialogs that include components which require keyboard input, such as form fields" and, for medium and expanded, "use a basic dialog". side-sheets/guidelines: standard side sheets "remain visible while people interact with primary content" and may hold "Form controls shown in a side sheet for app settings"; side-sheets/overview: "People can navigate to another region within the sheet" and "Side sheets can contain a back icon for navigation". M3 therefore allows a basic dialog for a form at medium and expanded.
- **We do:** owner rule, 15 Nov 2026: "Dialogs are only for short messages, not for settings." A dialog is a short message, a confirmation or a single short choice. Settings or a form with several controls are the standard side sheet beside the page from 600 dp and a page below 600 dp (B2). Where a pane opens from inside a pane, the inner content replaces the pane's content with a back arrow, as side-sheets/overview prints. The supporting-pane page puts the pane below at medium; we put it beside from 600 dp (the side-sheets page: "used mostly in medium to expanded").
- **Why:** owner decision, 15 Nov 2026. Section settings first (`docs/superpowers/specs/2026-11-15-section-settings-pane.md`); the other surfaces in their own pull requests.
- **Also a pane from 600 dp (pane PR 2):** a block's fields (and an image's alt text), a List row's settings and the Block settings details (`src/BlockSettings.tsx`, beside the list; below 600 dp still the sheet from the bottom until its page is built).
- **Also a pane from 600 dp (pane PR 3b):** the link of a text (`src/LinkSheet.tsx`), a link of the profiles (`src/LinkList.tsx`) and an item of a menu (`MenuList` in `src/fields.tsx`), fed into the pane host (`src/PaneHost.tsx`); one opened while another pane is open is on top of it with the theme side sheet's back icon (M3 side-sheets/overview: "Side sheets can contain a back icon for navigation"). Below 600 dp they stay the sheet from the bottom. The page picker inside the link stays a sheet (a choice).
- **Also a pane from 600 dp (pane PR 4):** an own list's settings (`src/OwnListSheet.tsx`), the name of a new list (`src/NewListDialog.tsx`, a dialog before), a widget's settings (`src/WidgetSettings.tsx`), an app's add-on (`src/AppAdds.tsx`) and a redirect (`src/Redirects.tsx`), fed into the pane host; below 600 dp they stay the dialog or the sheet from the bottom. The content is drawn in the pane or in the sheet, never in both.
- **Also a pane from 600 dp (pane PR 5):** a file's details in Files (`src/Media.tsx`: the side sheet beside the grid from 600 dp instead of 840 dp; below 600 dp the page `files/<address>`) and a consent record (`src/Consents.tsx`, fed into the pane host; its Delete stays a confirmation, `ask()`).
- **Date:** 2026-11-15. **PR:** #774 (section settings).
- **Status:** editor exception, kept as it is (owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend.").

## Preview and View on site in the text's bar

**Changed 18 Nov 2026 (cards and lists plan, step 7, 0.19):** the Preview goes; the builder shows the page at M3's window sizes (viewports) (`docs/superpowers/plans/2026-11-17-cards-and-lists-0-19.md`, step 7). The Preview lines of this file (here, and CS5) stay until that step removes them; `src/PreviewScreen.tsx` still exists.

Source: `src/MarkdownEditor.tsx` (`spareIds`, the bar's `⋮` menu), `src/textBar.mjs` (`planBar`), `src/textActions.ts`. Spec: `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md` (3.2, 3.3). Read 15 Nov 2026 on m3.material.io (Playwright): `/components/toolbars/guidelines`, `/components/menus/guidelines`, `/components/icon-buttons/guidelines`. The bar and its `⋮` are the editor's own workspace.

Followed: "When actions don’t fit in a toolbar, add a menu." and "If more actions are needed, use an overflow menu." (Preview goes into the `⋮` when the bar is full); "Use groups to bundle similar actions together." with dividers (View on site is the last group of the `⋮`); a leading icon on each menu item. The icons are Material Symbols `preview` and `open_in_new`, the same as the command palette's.

### P1. View on site is missing from the `⋮` on a new page instead of disabled

- **Material:** "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed."
- **We do:** a page or post that is not saved yet has no address, so its `⋮` has no View on site row. The same bar keeps its tools in every place and hides those that cannot apply there.
- **Why:** the editor's workspace shows only what applies (spec 3.3); a disabled row with nothing to explain would only add a dead entry to a short menu.
- **Date:** 2026-11-15. **PR:** #737.

## The theme's Dialog

### DG1. The theme's Dialog has no full-screen kind

- **Material:** "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete." "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "Dialogs can swap variants as the breakpoint changes. For example, a full-screen dialog can change into a basic dialog at larger breakpoints." (dialogs/guidelines, read with Playwright on 15 Nov 2026).
- **We do:** the theme's `Dialog` (`theme/ui/Dialog.tsx`) is the basic dialog only. The `full-screen` kind, `dialogFullScreenModalClass`, the classes `dialog-full-screen`, `dialog-modal-full-screen`, `dialog-header` and `dialog-header-actions` and the two `--dialog-full-screen-*` tokens are gone, and `THEME_API` is 5. A task that needs a whole screen is a page with the top app bar's back arrow (B2). The lightbox is its own modal `<dialog>` with the dialog's container (*Where Material 3 is silent*).
- **Why:** owner decision, 14 Nov 2026: no full-screen views anywhere; full screens become pages with a back arrow. It is the same thing as the dialog's full-screen kind, so the kind is removed (relayed by the 0.18 project manager).
- **Date:** 2026-11-15. **PR:** #739.
- **Status:** → 0.20.0 (owner via the CTO, 21 Nov 2026): the theme's Dialog gets the full-screen kind back for compact windows; the editor keeps its pages for now. Nothing changes in 0.19.5.

## The search view (search page, M3 search)

Source: `theme/ui/Search.tsx` (`SearchView`), `theme/styles/ui.css` (`.mo-search-view*`), `src/CommandPalette.tsx`. Read 15 Nov 2026 on m3.material.io with Playwright: `/components/search/overview`, `/specs`, `/guidelines`, `/accessibility`. The token tables of the specs page stay collapsed in a text read (they did not open), and the colour and measurement diagrams are images that did not load: no token value is quoted, and the colour roles below are read from the numbered lists under the diagrams.

### SV6. The start screen shows the search bar all the time

- **Material:** "Search bar: Use to search contents in a specific view"; "Add a search bar below a title to search specific content"; specs: "Container Width Min: 360dp, max: 720dp", "Height 56dp", "Leading padding Unfocused: 24dp, focused: 12dp".
- **We do:** the start screen shows the contained search bar (56dp, a button that opens the view) all the time, with its hint, "Search actions and pages", as its name. On a phone it is the first thing in the page, below the top bar (which keeps the title, the status and the actions), 24dp from the screen's edges (the page's own gutter is 16dp, so it is 8dp inside it). From medium it stands in the top bar in place of the search icon, up to 720dp wide, and the title and status stand under it. A phone's bar is 327dp wide at 375, under the 360dp minimum, because of the 24dp margins. Every other screen keeps the search icon button.
- **Why:** owner, 15 Nov 2026 (relayed by the PM): "On the front page show the search field all the time". The search app bar for every screen is 0.20 (palette spec).
- **Date:** 2026-11-15. **PR:** #734.
- **Status:** editor exception, kept as it is (owner, 21 Nov 2026: "We are focusing on the theme, not choices I have taken in the backend.").

## The error text of a text field has no alert role (text field `:user-invalid`)

Source: `theme/ui/TextField.tsx` (`.mo-text-field__invalid-text`), `theme/ui/textFieldUpdate.ts` (`syncInvalid`). Read 15 Nov 2026 on m3.material.io (Playwright): `/components/text-fields/overview`, `/specs`, `/guidelines` and `/accessibility`.

### E1. The error text is linked by `aria-describedby`, not announced as an alert

- **Material:** "When there is an error, "alert" is applied to the role and the error message to the text label." and "Text field error messages should be given an “alert” role in accessibility labels" (Text fields, accessibility).
- **We do:** the line that says what is wrong has no `role="alert"`. While the field is invalid after the person has worked in it (`:user-invalid`), its `aria-invalid` is true and the line's id is in its `aria-describedby`, so a screen reader reads the message once, with the field.
- **Why:** Chrome's Modern Web Guidance (`validate-input-after-interaction`, `accessible-error-announcement`) says to list the error in `aria-describedby` only while the field is invalid and not to make each message a live region, as a message that is shown rather than changed is not announced reliably and would be read twice. The owner's order puts the modern web guidance before Material 3 here: the PM, 15 Nov 2026 (owner: "We follow modern web").
- **Date:** 2026-11-15 (owner, through the PM). **PR:** #783.
- **Status:** stays: Modern Web Guidance outranks M3 (priority 1); guides `validate-input-after-interaction` and `accessible-error-announcement`.

## The site's menu is the modal expanded navigation rail (follow-up of D2 of the Modern Web Guidance audit)

Source: `theme/components/MobileMenu.tsx`, `theme/ui/NavigationDrawer.tsx`, `theme/styles/ui.css`. Read 15 Nov 2026 on m3.material.io (Playwright, every tab): `/components/navigation-drawer/overview`, `/specs`, `/guidelines`, `/accessibility` and `/components/navigation-rail/overview`, `/specs` (the token sets Common, Collapsed, Expanded, Item - Common, Item - Vertical and Item - Horizontal, opened), `/guidelines`, `/accessibility`. The measurement and anatomy images of the Specs pages did not load in headless Chromium (blurred placeholders), so numbers that only those images carry are not read here.

### N3. Labels only, and sub-pages, in the site's menu

- **Material:** Navigation rail, Guidelines: "Navigation rail items must use icons that symbolize the content of their page"; "All navigation items require a one word label text."
- **We do:** the site's menu items are the site's own pages, which have no icons, and an item with sub-pages unfolds them. Items that have an icon (the editor's) use the rail's 8dp icon-label space. **Date:** 2026-11-15.
- **Status:** → 0.20.0 (owner via the CTO, 21 Nov 2026): the site menu becomes M3's navigation drawer, built on the rail code with the rail off; the editor keeps the rail. Nothing changes in 0.19.5.

### N5. The scrim, a tap on it and Escape; no custom swipe

- **Material:** Navigation drawer, Guidelines: "Modal navigation drawers use a scrim to block interaction with the rest of an app's content"; dismissal "by tapping the scrim or swiping the drawer toward its anchoring screen edge". Navigation rail, Guidelines: "Predictive back only applies to the modal expanded navigation rail."
- **We do:** a scrim (the dialog's `::backdrop`), light dismiss and Escape through the native `<dialog>` and its `closedby="any"` and back gesture; no custom swipe (Modern Web Guidance, `dialog`: the browser handles the platform's dismissal). **Date:** 2026-11-15.
- **Status:** stays: Modern Web Guidance outranks M3 (priority 1); guide `dialog`.

### N6. The editor's drawers keep one width

- **Material:** "Nav rail expanded container width minimum 220dp", "maximum 360dp" (it hugs its content).
- **We do:** the editor's drawers (`.mo-editor-main-drawer-panel`, `src/editor.css`) keep 360dp (at most the screen less 56dp) through their levels and sections, because the layout beside them counts on that width (`--mo-sys-section-pane-width`, the columns). Editor workspace only. **Date:** 2026-11-15.

## The header's sub-menu (owner, 21 Nov 2026: "M3 wins everywhere outside the page and post editor")

Source: `theme/components/Header.astro`, `theme/styles/site-header.css`, `theme/styles/material/navigation.css`, `theme/styles/tokens/material/comp/menu.css`. The sub-menu that opens under "Product" is the theme's `Menu` (the same tokens as every menu), in M3 Expressive's standard vertical menu. Read 21 Nov 2026 on m3.material.io (Playwright): `/components/menus/specs`, `/guidelines`, `/accessibility`, and M3's own token data (`docs/m3-tokens/md.comp.menus*.json`): container `surface-container-low`, shape 16 dp, elevation level 2, item height 44, 16 dp at each side, 12 dp between an item's parts, selected `tertiary-container`, focus indicator 3 dp on the item's inside (-3 dp). The measurement images of the Specs page did not load in headless Chromium (blurred placeholders), so the token data is the source for the numbers.

### HM1. The sub-menu is a disclosure with links, not `role="menu"`

- **Material:** menus/accessibility: role on web "Menu item"; keys "Up and Down arrows: for closed menus opens menu, for open menus moves focus to the next item", "Escape closes menu".
- **We do:** the button has `aria-expanded` and opens on Down and Up arrows, with focus on the first or last item; in the menu the arrows, Home, End and letters move focus, Escape closes it and returns focus to the button. The items stay links in a list that Tab also reaches: a site's navigation is a disclosure, and `role="menu"` is for application menus (Modern Web Guidance, priority 1). **Date:** 2026-11-21.
- **Status:** stays: Modern Web Guidance outranks M3.

## Where Material 3 is silent (not deviations)

Sorted on 21 Nov 2026 (0.19.5, batch 9; `docs/superpowers/plans/2026-11-21-0-19-5-deviations-sorted.md`): M3 prints no value for these, so
there is nothing to deviate from. The theme uses the nearest M3 pattern or the owner's number. The entries that said so are gone.

- **The layout grid's margin and gutter:** 16 px on compact, 24 px from medium (`--mo-sys-grid-margin`, `--mo-sys-grid-gutter`, owner, 15 Nov 2026); the Grids page draws columns and prints no value. Cards are not on the gutter: they are `--mo-comp-card-gap` (8 px) apart, as Cards, Specs prints ("Padding between cards 8dp max"; G1, made to match 21 Nov 2026).
- **The focus ring on the search field:** M3's Search page prints none for the field ("individual elements maintain their own interaction states"). The ring shows for keyboard focus only, never after a mouse click or a tap (owner, 21 Nov 2026; `theme/ui/inputModality.ts`, `search.css`); WCAG 2.2 AA 2.4.7 (Focus Visible) keeps it for the keyboard.
- **How many cards stand side by side:** 2, 3 and 4 from the window classes (`--mo-comp-grid-columns`); M3 prints no count.
- **A list inside a card (batch 27, 21 Nov 2026):** Cards, Specs prints "Left/right padding 16dp" and Lists, Specs prints 16 dp leading and trailing space inside the item; neither page, nor Guidelines, says how a list sits in a card (Cards, Guidelines only says inset dividers "don’t run the full width of a card"). The card keeps its 16 dp padding on every side, the list sits inside it (its layer is 16 dp from the card's edges), and the card's title and empty line take the row's 16 dp so they line up with the row's icon (`src/editor-rest.css`, `src/editor-screens.css`; unit `checkListInCard`). Read: m3.material.io/components/cards and /lists, Overview, Specs, Guidelines, Accessibility.
- **Cards:** the media's bottom corners are the card's radius (the Container example draws it); the headline, subhead and supporting text take the list item's type roles; the gaps inside a card are the `--mo-comp-card-*` steps; a price, a badge, a "Read more" line and a trailing arrow have no card part and stay the card's content.
- **Search view:** where the match is highlighted, "Quick results", the remove button on a recent search, the chip row and category label spacing, the docked bar's margin and its distance to the page, the docked results container's 12 dp corner (the token copy prints it); the search view's colours, paddings and chips equal the specs; on a phone it is the full-screen layout.
- **The search view on a phone** takes the whole window and its focus starts in the field ("often a leading icon button or text field").
- **Elevation shadows:** M3's elevation page says "Tokens have no shadows or color; each platform determines the specific shadows and values to use at each elevation level", so the blur and spread values are the platform's (closed 21 Nov 2026, elevation spec).
- **The lightbox:** M3 prints no lightbox or image viewer; the theme's `Lightbox` is a modal dialog with the dialog's container and corner, sized to the window. Its see-through scrim colour is the colour batch's (batch 8).
- **Palette:** a command palette made of the Search view (`Ctrl+K`); M3 has no page for one.
- **Choice group:** a small sample of a look in a row's trailing slot.
- **The FAB above the footer:** M3 says nothing about a footer under a FAB; the FAB lifts 16 dp above it.
- **A bottom sheet's content padding:** the grid margin; M3 prints no padding for what is in a sheet.
- **The site's text measure:** 40ch to 60ch (owner's rule); M3 prints no text width.
- **Button group toggles:** `aria-pressed` in a `role="group"`; M3 prints no ARIA roles for them.
- **Editor-only parts** (score ring, colour and icon pickers, the Google preview, crop handle sizes) and the editor's fixed colours (PageSpeed, Google, the picker, the preview frame) are no M3 parts.
- **The site's menu on the end edge** (`menuSide` of `header.json`): customization, not a deviation (owner, 21 Nov 2026).
- **Focus indicator:** the site's focus ring is M3's (`secondary`, 3 dp, 2 dp outside, 3 dp inside a list item; the component tokens and `md.sys.state.focus-indicator`); the editor draws it in `primary`.
- **Colour roles of parts (0.19.5, batch 6, 21 Nov 2026):** the tonal buttons, tonal icon buttons, the selected segmented button and the selected menu item sit on `secondary-container` with `on-secondary-container`; outlined buttons and icon buttons have their edge in `outline-variant` and the button label in `on-surface-variant`; the menu is on `surface-container`; list dividers are `outline` (a divider is drawn only where a list asks for one: inset or middle-inset; a plain list draws its default line through `--mo-comp-list-divider-default-color`, `transparent` in Material); the slider's value label is on `primary` and its stop indicators are `on-primary` and `on-secondary-container`; the switch's selected icon is `primary`; the rich tooltip's subhead is `on-surface-variant` (token copy `docs/m3-tokens/`, content version `2026-11-19_06-20-01`). The slider's label text is `on-primary`, the nearest M3 pattern: the token copy marks `md.comp.slider.label.label-text.color` (`inverse-on-surface`) *[Deprecated]*, so M3 prints no current value, and `on-primary` on `primary` is M3's own pair. It is not a deviation. The outlined card's edge is `outline-variant`; where that is under 3:1 it is named in `theme/accessibility.json` (WCAG 1.4.11), not kept as a deviation (O1 is gone).
- **Closed because they match M3:** the dialog corner (extra large, 28 dp), the menu corner (large, 16 dp), the 56 dp buttons and 56, 72 and 88 dp list rows (Expressive), the contained search view, chips (32 dp, 8 dp corner, 18 dp icon), the expanded modal navigation rail (surface container, 220 dp to 360 dp), the zoom slider's inactive track (secondary container).

## Date picker

### DP1. A docked date picker's month and year steppers wrap onto two lines on a narrow screen

- **Material:** Date pickers, Specs, Guidelines and Accessibility (read 21 Nov 2026): the docked picker is for desktop and compact breakpoints use the modal picker; M3 prints no width or wrapping rule for a docked picker below its width.
- **We do:** where a docked picker is narrower than its header (about 345 px of buttons, below about 320 px of picker), the month and the year steppers sit on two lines, and a day shrinks with its column (`min(day size, 100%)`, square), so nothing is cut off at 320 px.
- **Why:** WCAG 2.2 (reflow, 1.4.10) wins over M3's silence, and the owner asked for the whole header to fit at 390 and 320 px (21 Nov 2026).
- **Date:** 2026-11-21. **PR:** #1100.

## Carousel

### CAR1. A carousel item has no shadow when pointed at

- **Material:** the token copy `docs/m3-tokens/md.comp.carousel-item.json` (made 20 Nov 2026) prints the item's elevation as level 0 at rest and level 1 hovered (`md.comp.carousel-item.hover.container.elevation`).
- **We do:** the item keeps no shadow on hover.
- **Why:** an item is clipped to its mask (`overflow: hidden`, `clip-path`) and the row scrolls (`overflow-x: auto`), so a level 1 shadow would be cut off and show nothing. The PM decided on 21 Nov 2026 to leave it and record it here.
- **Date:** 2026-11-21. **PR:** #1112.
