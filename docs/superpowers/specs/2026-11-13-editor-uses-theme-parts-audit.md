# Audit: does the editor draw only with the theme's parts?

Date: 2026-11-13. Audit only, no code changed. Written for the owner, who reads on a phone.

## Decisions (owner, 2026-11-13)

- A theme can style **everything** in the editor: colours, corners, type, parts, and also spacing (margins, padding, gaps),
  border radius and speed of motion. Spacing and motion tokens are in scope, not "later".
- So rows 1 and 11 below are no longer optional. They are planned work, sized, and the check in section 4 covers them.
- Floating menus: yes, use the theme's `Toolbar` for the editor's floating menus (question 2).
- The contextual toolbar becomes a **docked row below the main toolbar**, replacing the floating bar everywhere, with no
  delay. A design spec for it is being written in another session. So the three floating menus (`.contextual-menu`,
  `.site-block-menu`, `.editor-selection-menu`) are replaced by the theme `Toolbar` in its docked form, not its floating one.
- Image tile (question 3): **yes**, a theme part for the tappable image tile. Design, from the owner's reference: an M3
  staggered grid of image cards, each image in its own proportions, rounded corners, a quiet tinted surface, "just
  without the names": the tile is the image only, with no title or size caption under it. It has a selected state. It
  replaces today's square crops (`aspect-square`).
- Preview screen (question 4): **yes**, add a full-screen kind to the theme's `Dialog` and use it for the Preview. After the
  toolbar work, its top bar uses the same `Toolbar` part. The plan order stays (row 6 after rows 2 and 3). **Corrected by
  the M3 check below:** M3 prints full-screen dialogs for compact screens only and a header with the close icon, so see
  "Checked against m3.material.io" for what row 6 now says.
- Save bar (question 5): the bar at the bottom of pages, blocks and every other form (`FormFrame.tsx`, `.editor-save-bar`) must
  **not** have its own design: no see-through blur, no bar built from Tailwind classes. Owner: "If it's the same bar at the
  bottom of the screen on pages and blocks, it should use the bottom sheet design and not its own custom design." It
  becomes a theme part, one part for every form that shows it. The blur is dropped; it is not asked again. Which theme
  part fits is compared in "The save bar" below.
- Same rule everywhere (owner, on the save bar: "also do it other places this fits in"): every bottom bar, bottom panel,
  sheet and docked or floating bar in the editor uses the theme's part and has no custom design. All of them are listed in
  "Other bars, sheets and panels" below.
- Which editor-only parts become theme parts (question 6): the general rule is that **a part becomes a theme part only if
  the front end could reuse it**. By that rule: `FoldSection` becomes the theme's accordion part (yes) and `CheckList`
  becomes a list kind (yes). The **score ring stays the editor's own**, an intentional editor-only part (owner: "it is a
  very specific component that is not reusable in front end"), so it is dropped from the plan. The colour and icon pickers
  also stay in the editor. The ring is recorded in `docs/material-deviations.md`.
- The "parts" rule (question 7): it **fails the check from the start**. Today's cases go in its allow-list, each with its
  reason and the row of this spec that will remove it, so nothing new can come in while the rows are fixed. The list only
  shrinks. All seven questions are decided; the spec is ready for the owner's read.
- Motion already has tokens (`--motion-spatial-*`, `--motion-effects-*`, `--motion-ease`). Spacing has none yet
  (`docs/material-deviations.md`, CSS sweep 8): the first step of row 11 is to add them to the theme.

Owner's words: "we need to make sure that everything else is shared because I want the themes to style the backend as well."

Words used here: a **part** is a ready-made piece of the design (button, field, chip, list row, dialog) that lives in `theme/ui/`
and that a theme can restyle. A **token** is a named value (a colour, a corner, a text size) that a theme sets once for
everything. "Not shared" means the editor draws it with its own markup or CSS, so a theme cannot restyle it without editing
the editor.

## 1. Is everything in the editor shared with the theme today?

No, but most of it is. The editor's screens are made of about 115 parts in `src/ui.tsx`, and nearly all the basic ones
(button, icon button, text field, checkbox, switch, chip, list row, menu, dialog, side sheet, tabs, FAB, navigation
drawer, rail, badge, tooltip, progress) are the theme's parts, brought in through `src/themeUi.ts`. Outside `ui.tsx` there is
almost no raw markup: one `<button>` family in a handful of files and no raw `<input>`. What is **not** shared is a small
set of things: three hand-made floating toolbars and menus (about 150 lines in `src/editor.css`), image tiles drawn as
plain buttons, a few rows and headers drawn as plain buttons with Tailwind classes, the full-screen Preview dialog, the
save bar, the score ring, the "choose one" cards, and the table (about to be fixed by `DataTable`). The checks catch fixed
colours and corner and type values well, but they do not look at spacing, motion, shadows, z-index or opacity, and they have
a blanket pass for type sizes in `editor.css`. Roughly speaking: the look of the colours and corners follows the theme, the
spacing, the speed of motion and a dozen editor-only parts do not. Since the owner's decision (above), those are in scope.

## 2. What is not shared

Size: small = under a day, medium = a day or two, large = a week or a design decision. Order: the proposed sequence.

| # | Surface or file | What is not shared | Size | Order |
| - | --- | --- | --- | --- |
| 1 | Check coverage: `scripts/check-css-values.allow.mjs`, `check-editor-colors.mjs` | The blanket pass for `font-size`, `line-height`, `letter-spacing` in `editor.css` (about 32 literal type values); no check on spacing, z-index, opacity, motion or arbitrary Tailwind sizes (`w-[…]`, `p-[…]`, about 30 in `src/*.tsx`); `check-editor-colors` only reads `editor.css` and `Inline*.tsx`. See section 3. | small | 1 (first step now; the spacing and motion part follows with row 11) |
| 2 | Floating menus (decided: become the theme `Toolbar` as a docked row below the main toolbar; design spec in progress elsewhere): `.contextual-menu`, `.site-block-menu`, `.editor-selection-menu` in `src/editor.css` (lines 877-1240) | Three hand-made toolbars (corner, border, background, shadow, button size 40 and 48 px all written in the editor). Their surface and shadow come from `--editor-menu-surface` and `--editor-menu-shadow`, defined in `editor.css:8-9`, not in the theme. The theme already has a `Toolbar` (`theme/ui/Toolbar.tsx`, kinds `docked` and `floating`); the plan uses `docked`. | medium | 2 |
| 3 | Image tiles (decided: one new theme part, `ImageTile`, in a staggered grid): `Media.tsx:183` (Library), `MediaProviderPicker.tsx:136` (web-image picker), `ui.tsx:2764` (`ImageCarousel`, the strip), `fields.tsx:231` (`ImagePick`) | A plain `<button>` with `aspect-square rounded-lg bg-surface-container-high` and a hand-made selected ring. The new part is image-only (no caption), keeps the image's own proportions, has the tile corner and tinted surface from the theme and a selected state shown by a checkbox on the tile (M3 prints no selected state for a card, only selection controls, so no invented ring), so a theme can restyle all of it. A new staggered grid layout (columns of tiles of different heights, in the theme, not a square grid) goes with it. **What changes for the four users:** (1) *Library*: the square grid becomes the staggered grid. The tile needs the image's width and height before it loads, or the grid jumps as images arrive; `thumbnails.json` holds only the small copy's address, so the build must add `width` and `height` to it (small, in the build step). (2) *Web-image picker*: no work to find the proportions, the providers already send `width` and `height` (`lib/mediaProviders.mjs`). (3) *Strip* (`ImageCarousel`): shows page screenshots in 3:4 with the top of the page; it keeps that proportion through a tile option, not the staggered grid (a strip is one row). (4) *`ImagePick`*: one image in a 16:10 frame that follows the site's image corner (`--theme-picture-radius`); it uses the tile for the frame and keeps its fixed frame, since it shows how the site crops the image. **Cropping and focus:** the tile only shows the image, it never crops or stores a crop. Square crops in the Library were display only, so nothing saved changes. The image's saved focus point and the crop screen (`Crop.tsx`) are not touched; the focus point only matters where an image is drawn in a fixed frame (`ImagePick`, the site's blocks). Files that are not images (`FileTile`) keep a tile of their own shape and are placed in the same grid. | medium to large: the part and its CSS (medium), the staggered layout and the build's `width` and `height` (medium), moving the four users (small each) | 3, right after the toolbar (row 2) |
| 4 | Plain buttons used as rows or controls: `MarkdownEditor.tsx:752` (menu-like row), `ui.tsx:2898` (`SectionList` item, class `.section-list-item`), `ui.tsx:2538` (`FoldSection` header), `ui.tsx:1044` (`SlotButton`, class `.inline-list-slot`), `UpdatesNotice.tsx:80` (info button), `ui.tsx:763` (colour swatch button) | Each is a `<button>` with its own Tailwind classes for size, corner, hover and focus ring. Each has a theme part that fits: `MenuItem`/`ListItem`, a navigation item, the accordion's header, `IconButton`. | small each (six small fixes) | 4 |
| 5 | `ChoiceCards` and `ChoiceTile` (`ui.tsx:1702`) | A `<label>` that wears the theme's outlined-card class and then sets the card's private variables (`--card-outlined-line`, `--card-outlined-surface`) from the editor to show "selected". A theme that changes the card's insides breaks this. | medium (a selectable card kind in `theme/ui/Card`) | 5 |
| 6 | Preview screen (decided: a full-screen kind of the theme `Dialog`, its top bar the same `Toolbar` part as row 2): `<dialog class="editor-preview-screen">` in `pagePreview.tsx:231`, `editor.css:1483` | A full-screen dialog drawn by the editor. M3 has a full-screen dialog, but only for compact screens (see the M3 check below); the theme's `Dialog` has no such kind. So: full-screen kind on compact, the basic dialog (large) from medium, header with the close icon, headline and a text button (the theme's top app bar). | medium | 6 |
| 7 | Save bar (decided: a theme part, the standard bottom sheet; see "The save bar" below): `FormFrame.tsx:236`, `.editor-save-bar` | A fixed bar built from Tailwind (`border-t bg-surface-container-lowest/90 backdrop-blur-md`) with its own slide-in, and seven places in `editor.css` and one in `MarkdownEditor.tsx` that move other things out of its way by its class name. The blur and the 90% see-through are not M3. | medium (a docked actions form of the sheet, then `FormFrame` and the offsets) | 7 |
| 8 | `ScoreRing` (`ui.tsx:2597`) | **Decided: stays the editor's own, no theme part; dropped from the plan.** It draws its own SVG ring and tone classes for the SEO score, which the front end never shows. It still takes its colours and sizes from tokens (the `check:colors` rules apply). Recorded as intentional in `docs/material-deviations.md`. | none | dropped |
| 9 | Tables and lists: `InlineTable.tsx` (editor's table block), the Library, Files, Redirects and own lists (`ListItem` rows with columns) | The table block already shares the block's CSS (`.block-table-grid` in `blocks.css`), but the editor adds `.inline-table-box` rules (`editor.css:1568-1585`). The lists are built from `ListItem`, not a table. | large, already planned: the owner's `DataTable` in `theme/ui/` | by the owner's plan |
| 10 | Editor-only parts with no theme version: `FoldSection`/`FoldList`, `SectionPane`, `ColorWheel`, `ColorSwatches`, `IconPicker`, `IconSwatches`, `CheckList`, `ShownValue`, `FormColumns`, `Group`, `Notice`'s layout | Drawn in the editor from tokens, but a theme author cannot restyle them as parts. Decided with the rule "a theme part only if the front end could reuse it": `FoldSection` becomes the accordion part and `CheckList` a list kind (yes); `Group` and `FormColumns` (layout only) and the colour and icon pickers stay in the editor. | medium (decide per part) | 9 |
| 11 | Spacing and motion in `editor.css` and the Tailwind classes: 73 spacing lines in rem/px (padding, margin, gap, sizes), about 30 arbitrary Tailwind sizes (`w-[…]`, `p-[…]`) in `src/*.tsx`, 8 `z-index`, 14 opacity values, `editor-flash` 0.8 s ease, `editor-rise`, `animate-pulse`, `.editor-fab` and `.snackbar-stack` offsets, `.editor-column` | Spacing and motion do not come from tokens, so a theme cannot make the editor denser, looser or slower. Motion has tokens to use (`--motion-*`); spacing has none. | large, in four steps: (a) add spacing tokens to the theme (small), named and valued as M3 prints them (`md.sys.measurement.space100` = 8 dp; Space 0, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 450, 500, 600, 700, 800, 900 = 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 36, 40, 48, 56, 64, 72 dp), as `--mo-space-0` … `--mo-space-900`; a theme sets their values, and density stays a person's setting, not a theme's (M3 check below); (b) move motion literals to `--motion-*` (small); (c) move the 73 CSS lines and the arbitrary Tailwind sizes to spacing tokens (medium, mechanical); (d) layout offsets for the FAB, snackbar, rail and column (medium, needs a screen check on phone and computer) | a and b with row 1; c after rows 2-8, so the parts are not changed twice; d last |
| 12 | Elevation: `shadow-soft` on the app icon (`App.tsx:746`, `BrandForm.tsx:155`), `shadow-(--mo-elevation-4-shadow)` in `DashboardEdit.tsx:219`, `animate-pulse` | One alias to the panel shadow and one raw elevation variable; `animate-pulse` is Tailwind's own timing, not an M3 motion token. | small | 4 (with the small fixes) |

Already recorded and not repeated here (`docs/material-deviations.md`): the section-colour swap (1-4), the status badges, the
PageSpeed and Google preview colours, the colour picker, the Preview frame on white, the video still, the dialog and menu
corners, hero button and row sizes, the 48 dp icon button, the focus ring, and the editor's page preview using the site's
text sizes (CSS sweep 9).

### The save bar

What it is: one bar at the bottom of the screen on a page, a block and every other form that has unsaved changes
(`FormFrame.tsx`, used by most forms). It holds Save, Cancel-type buttons and Preview, and comes and goes with the
form's changes.

| | Theme `BottomSheet`, kind `standard` | Theme `Toolbar`, kind `docked` |
| --- | --- | --- |
| What M3 prints | "Bottom sheets display supplementary content and actions on a mobile screen"; "Content should be additional or secondary (not the app's main content)"; a standard sheet is "content that complements the screen's primary content, such as an audio player"; "Use bottom sheets in compact and medium breakpoints" | "Use a toolbar to provide actions related to the current page"; docked: "best used for global actions that remain the same across multiple pages"; floating: "contextual actions relevant to the body content or the specific page"; vibrant "can also indicate a temporary change in the page behavior, such as entering edit mode"; "The baseline bottom app bar is no longer recommended" |
| Already in the theme? | Yes: non-modal, docked, no scrim, states `collapsed`, `half-expanded`, `expanded`, `hidden`; one fixed state with `states={['expanded']}`; handle and header can be left out; from medium it is a side sheet (`wide: 'side-sheet'`, the default) or stays a bottom sheet with margins (`wide: 'sheet'`) | Yes: full width at the bottom, standard or vibrant colour, `role="toolbar"` with arrow-key moves |
| Same surface, corner and shadow as the editor's other sheets | Yes (`--bottom-sheet-*`), one design for every sheet | No, its own `--toolbar-*` look |
| Holds a Save and Cancel row | Needs a place for buttons: its `footer` is a `<p>`, which is wrong for buttons | Yes, built for buttons |
| Fit to M3 | Not what M3 prints: a form's Save row is the page's main action, not secondary content, and M3 gives no "save bar". Chosen on the owner's words, so it is a recorded deviation | Nearest M3 pattern (a page's actions, vibrant for edit mode), but M3 calls docked bars "global" |
| Owner's rule | Matches the owner's words (bottom sheet design) | Not what the owner asked for |

**Recommendation: the standard bottom sheet**, as the owner said, recorded in `docs/material-deviations.md` with the M3 quotes above because M3 does not print it for a page's main actions. It is the part that is already a non-modal, docked sheet,
it looks like the editor's other sheets, and a theme styles the Save area with the same `--bottom-sheet-*` tokens as the
rest. The docked `Toolbar` stays for the contextual row (decision 2). One part serves pages, blocks and every other form,
because they all go through `FormFrame`.

What the sheet lacks for this, to be added to the theme part (not to the editor):
1. An **actions form**: a fixed sheet with no handle and no header that is only as tall as its button row, plus the safe-area
   gap at the bottom (`dragHandle={false}`, one state, `wide='sheet'` today gives most of this; the sizing needs a check).
2. A **`footer` that can hold buttons**: a `<div>` slot (an `actions` prop) instead of the `<p>` footer.
3. **Appear and disappear** with the form's changes (state `hidden` to its shown state, with the theme's motion token), so
   `FormFrame` does not draw its own `editor-rise` animation.
4. **Wide screens**: stay a bottom bar from medium (`wide='sheet'`; M3 prints bottom sheets for compact and medium only and a side sheet from expanded, so staying a bar on expanded is part of the recorded deviation) and sit beside the navigation rail or drawer. Today
   `editor.css` moves the bar by `--navigation-rail-width`, `--navigation-drawer-width`, the "on this page" pane and the
   side panel (lines 650, 658, 735, 771). The part should take those from one theme variable (a start and end inset), so the
   editor sets two variables and a theme can restyle the rest.
5. A **stacking order** with the FAB and the snackbar stack: today `editor.css` lifts the FAB and the messages above the bar
   by class name (lines 602-640, and its slide-in at 360-373) and `MarkdownEditor.tsx:1008` reads `.editor-save-bar`'s position. These should read a
   `--bottom-bar-height` variable the part sets, so no screen names the bar's class.

Size: medium (the actions form and variables in the theme: small to medium; moving `FormFrame` and removing the class
couplings: small). Order stays row 7, after the toolbar, image tile and dialog work.

### Other bars, sheets and panels the editor draws itself

Found by searching `src/*.tsx` and `src/editor.css` for `fixed`, `sticky`, `inset-x-0`, `bottom-0`, `editor-*` bars and
`<dialog>`. Same rule for each: the theme's part, no custom design. Parts: **Sheet (standard)** is the theme's non-modal
bottom sheet, **Sheet (modal)** its modal one, **Toolbar (docked)** its docked bar. Rows 13 and 14 overlap with the
contextual toolbar spec (session `session_01GGzusQCFpwd8WrtCR2dPKR`, reviewed separately by the owner); that spec decides
the design of the docked row, this one only says what the code has to stop drawing itself. The two must agree: one docked
`Toolbar` row below the main toolbar, no floating bar anywhere.

| # | What the editor draws | Where | Theme part it should use | Size | Order |
| - | --- | --- | --- | --- | --- |
| 13 | The three floating bars (text selection, contextual, block menu): the same as row 2 | `.editor-selection-menu`, `.contextual-menu`, `.site-block-menu` | Toolbar (docked), as the contextual spec says | medium | with row 2 |
| 14 | The text tools bar at the top of the Markdown editor. It is a theme `Toolbar` already, but overridden: its own border and corners (`border`, `rounded-t-panel`), a sticky position, about 50 lines of `.editor-tools-*` CSS, and code that reads its class to place the cursor (`MarkdownEditor.tsx:486`, `1007`) | `MarkdownEditor.tsx:2211`, `editor.css` 1102-1150 | The same docked Toolbar row, with no override classes; the placement code reads a theme variable instead of a class | medium | with row 2 |
| 15 | The save bar: row 7 | `FormFrame.tsx:236` | Sheet (standard), actions form | medium | 7 |
| 16 | The messages area (snackbar stack) is moved up and over by class name for the save bar, the FAB, the rail, the drawer and the side panel (6 rules) | `editor.css` 602-660 | The theme's Snackbar, placed by the theme from `--bottom-bar-height` and the start and end insets (row 7, step 5 and 4) | small | 7 |
| 17 | The corner buttons (FAB and FAB menu) are placed by the editor (`position: fixed`, offsets, dimming when busy, lifted above the save bar) | `.editor-fab`, `editor.css` 607-640 | The theme's FAB placement (a corner kind that takes the same insets and the bar height), disabled state from the theme | small | 7 |
| 18 | The editor's own enter and leave motion for sheets, dialogs, the drawer and the save bar: `editor-sheet-in`, `editor-pop`, `editor-fade`, `editor-rise` and a drawer slide. The theme's sheets and dialogs have motion too | `editor.css` 360-373, 439-520 | The theme's motion for each part (`--motion-*` on the part), nothing added by the editor | medium | after 2, 3, 6, 7 |
| 19 | Extra classes on the theme's modal sheet: `editor-sheet` (a tall limit, the extra animation), `editor-side-panel` (the side panel's width and place). Sheets are the More sheet, the insert and block sheets (`BlockDialog.tsx`), the choice and field sheets | `ui.tsx:3515-3529`, `editor.css` 430-456, 739-780 | Sheet (modal): the height rule and the side-panel kind move into the theme part (`wide: 'side-sheet'` exists); the animation goes with row 18 | small to medium | after 18 |
| 20 | The side panel on a computer: `.editor-side-sheet` is `position: fixed` with its own width | `editor.css` 775-785, `BlockDialog.tsx:467` | Theme SideSheet (modal and standard kinds exist) with the width from one theme variable | small | with row 19 |
| 21 | A menu over the page: `<div class="editor-menu fixed z-30">` (a field's drop-down, a button's menu) | `ui.tsx:2012`, `editor.css` 1097 | The theme's Menu with its own placement; the editor only forces the menu shadow, which the theme should set | small | 4 |
| 22 | The Preview screen: row 6 | `pagePreview.tsx:231` | Dialog (full-screen kind), top bar a Toolbar | medium | 6 |
| 23 | The wrappers round the navigation rail and drawer (`aside … sticky top-0 h-dvh`, `.editor-main-rail-frame`) | `ui.tsx:2996`, `3066` | Theme Navigation Rail and Drawer already; the wrapper only places them, so this is layout (row 11, step d) | small | 11 |

Not a finding: the editor's tooltip is the theme's tooltip, only positioned by a script (`.editor-tooltip`); the dialogs
that ask a question use the theme's Dialog; the More, insert and block sheets are the theme's modal sheet.

### Checked against m3.material.io (13 Nov)

Owner's standing rule: follow M3 everywhere except the editor's own workspace; read the real page and quote it; where M3 is
silent, say so and give the nearest M3 pattern. The pages below were read on 13 Nov 2026 (overview, guidelines, specs where
printed, accessibility): bottom sheets, toolbars, dialogs, side sheets, cards, carousel, spacing (`m3/pages/spacing`),
layout and density. Token tables that are collapsed or only reachable by a dropdown were not opened, so this check quotes
guidelines and the spacing token list, not component token values.

| Decision | What M3 prints (quote) | Verdict and change |
| --- | --- | --- |
| Image tile in a staggered grid (3) | Cards: "The default grid can be customized in code to show cards in staggered or mosaic grids." "Cards should maintain consistent horizontal spacing to establish a strong rhythm when their height varies." Card states printed: enabled, hovered, focused, pressed, dragged. "Cards can also include chips, sliders, checkboxes, and other selection controls." | Staggered grid is M3's. The owner's "no names" is the owner's word. M3 prints **no selected state** for a card: nearest M3 pattern is a selection control (a checkbox) on the card, so the tile's selected state is a checkbox, not an invented ring. Keep a constant gap between columns. |
| Save bar as the bottom sheet (5) | See the save bar table: bottom sheets are "secondary content", "compact and medium breakpoints"; "Modal bottom sheets are used in mobile apps only" | Deviation, allowed because the owner said it in words and it is the editor's own bar. To record in `docs/material-deviations.md`. |
| Contextual toolbar as a docked row (2) | Docked: "best used for global actions that remain the same across multiple pages". Floating: "contextual actions relevant to the body content or the specific page". Docked container: "Avoid applying rounded corners to the container"; "Use straight corners for docked toolbars". "All elements need a minimum 48x48dp target area." | M3 puts contextual actions in the floating toolbar, so the docked contextual row is a deviation. The text, block and ⋮ menus are the editor workspace, which the owner's rule exempts, and the owner decided it in words. Record it. Today's `.editor-tools` also rounds the docked container (`rounded-t-panel`): M3 says not to; remove it when the row is rebuilt. |
| Preview as a full-screen dialog (4) | "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete." "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "To save a selection in a full-screen dialog, use Save. The close icon or dismissive action, such as Cancel or Back, should close the dialog." "The close X icon button should be the only navigation option in the app bar." Header region: close icon, headline (optional), button label text. | **Two corrections.** (1) The Preview is full-screen only on compact; from medium it is a basic dialog (M3 is silent on a large preview in a dialog; nearest: a basic dialog positioned to be large). (2) The top bar of the full-screen dialog is M3's header region (close icon, headline, a text button), the theme's top app bar, not a `Toolbar`. Decision 4's "uses the same Toolbar part" is withdrawn on that point and needs the owner's word if they still want it. M3 also says dialogs are for critical decisions and a snackbar for low priority; a Preview is neither, so M3 is silent. |
| Spacing tokens (row 11) | "The spacing system is measured on an 8dp scale, where space100 = 8dp." Tokens Space 0 to 900 = 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 36, 40, 48, 56, 64, 72 dp. "Spacing should adapt to component size, layout, form factor." Density: "People can change density as long as the density controls are accessible"; "Density shouldn't automatically change across breakpoints or orientation unless a person changes it"; "Don't apply component scaling by default if it would result in a target below 48x48 CSS pixels." The tokens are "only used on Jetpack Compose" (web unavailable). | The plan said "M3's 4 dp grid" and invented `--mo-space-1…12` names: both wrong, fixed in row 11. `docs/material-deviations.md` CSS sweep item 8 says the same wrong thing and is corrected. A theme sets the token values (owner's decision); density is a person's setting, so no theme density switch. Targets stay 48x48. A theme that makes a target smaller is a deviation to record. |
| Side panel and sheets (rows 19, 20) | Standard side sheets "used mostly in medium to expanded breakpoints"; "Modal side sheets are preferred in compact breakpoints"; "Modal side sheets on smaller screens can transition to standard side sheets at larger screen sizes". | Matches the theme's `wide` behaviour. No change. |
| Bottom sheet resizing (accessibility) | "Include a single-pointer alternative for any action that can be completed by dragging"; the drag handle "should cycle the bottom sheet through available heights when selected". | The save bar has one fixed state and no handle, so nothing to cycle. No change. |

Not read, and so not claimed: the component token values (colours, sizes, shapes) behind each part, and the FAB, snackbar and
menu pages. Rows 15 to 18 and 21 make no M3 claim beyond "use the theme's part".

### What a theme author cannot style today

| What | Why | What they would have to override, and where |
| --- | --- | --- |
| Floating text toolbar and block menus | Rows 2 | `.contextual-menu`, `.editor-selection-menu`, `.site-block-menu` and `--editor-menu-*` in `src/editor.css` |
| Image tiles in the Library and pickers | Row 3 | Tailwind classes in four `.tsx` files; there is no class to target |
| Selected "choose one" card | Row 5 | The card's private variables, set in `ui.tsx` |
| Preview screen | Row 6 | `.editor-preview-screen` in `editor.css` |
| Save bar | Row 7 | Tailwind classes in `FormFrame.tsx` |
| "On this page" list, fold headers | Row 4 | `.section-list-item` in `editor.css`, classes in `ui.tsx` |
| Spacing, density, speed of motion | Row 11 | Literal values in `editor.css` |

## 3. What the checks let through today

- `check:colors` (`scripts/check-colors.mjs`): fixed colours, palette classes, undefined roles, wrong role pairs, odd state
  layers, in all shipped code. Its allow-list (`check-colors.allow.mjs`) has 14 entries: PageSpeed ratings; Google preview;
  the colour picker's gradients, swatches and thumb; the Preview's white frame; the scrim, shadow and seed colours; brand
  favicon and example image; image masks; the video still; words that name a colour; "no shadow" values; status badges;
  one outline hint in the Preview. All have a written reason and match the deviations file.
- `check:editor-colors`: the same idea, only for `editor.css` and `Inline*.tsx`, with four reasons (PageSpeed, Google, "no
  colour", any `shadow` line). The `shadow` pass lets any colour on a shadow line through.
- `check:css-values`: fixed corners, type sizes and off-scale Tailwind classes (`text-lg`, `rounded-md`, `text-[…]`), and
  custom properties used but set nowhere. Its allow-list has 10 entries: fallback corners for themes with no steps; the slider
  track; the focus ring's 6 px; inline code; checkbox corners; `calc()` corners; menu items; **every** `font-size`,
  `line-height` and `letter-spacing` in `editor.css` (the biggest hole, about 32 literals); Google's search preview sizes;
  crop handle and app icon corners; and **every** type value in the theme's own CSS files ("not yet moved", tracked).
  It also skips `--mo-*` roles when "used but not set".
- Not checked at all: spacing, sizes, z-index, opacity, motion (durations and easings), arbitrary Tailwind sizes, and
  whether a screen uses a raw `<button>`, `<dialog>`, `<table>` or `<input>` instead of a part.

## 4. One check to keep it true

Extend `check:css-values` (it already reads `theme/`, `src/`, `pages/` and runs in `npm run check`; no new workflow) with a
**"parts" rule**, in three steps:

1. Raw elements: fail on `<button`, `<input`, `<select`, `<textarea`, `<dialog`, `<table`, `<details` in `src/*.tsx` outside
   `src/ui.tsx` and `src/Inline*.tsx`, unless the file and line are in an allow-list with a reason. Today that is about 15
   lines, all listed in rows 3-7 above. The rule fails the check from the start (owner decision). Each allow-list entry carries its reason and the number of the row that removes it, and the pull request that fixes a row deletes its entries, so the list only shrinks and nothing new can come in meanwhile.
2. Tokens: remove the blanket type pass for `editor.css` and add `z-index`, `opacity` and `transition`/`animation` durations
   to the literal check, with a short allow-list (the 38% disabled opacity is M3's own and stays).

3. Spacing and sizes: once the spacing tokens exist (row 11, step a), fail on a literal `padding`, `margin`, `gap`, `width`, `height`, `inset` in `editor.css` and on arbitrary Tailwind sizes in `src/*.tsx`, with an allow-list for layout that cannot be a step (a fixed icon size, `calc()` of tokens, `env(safe-area-inset-*)`). Today's lines go in the list first and the list only shrinks.

## 5. Open questions for the owner

1. ~~Spacing and speed~~ Decided by the owner: yes, themes style everything (see Decisions above).
2. ~~Floating menus~~ Decided by the owner: yes, the theme's `Toolbar`, as a docked row below the main toolbar (see Decisions above).
3. ~~Image tile part~~ Decided by the owner: yes, image only, staggered grid in the image's own proportions (see Decisions above and row 3).
4. ~~Full-screen dialog kind for the Preview~~ Decided by the owner: yes (see Decisions above and row 6).
5. ~~Save bar blur~~ Decided by the owner: no blur, no custom bar; it becomes the bottom sheet part (see Decisions and row 7).
6. ~~Which editor-only parts become theme parts~~ Decided by the owner: the rule is "only if the front end could reuse it"; `FoldSection` and `CheckList` yes, the score ring and the colour and icon pickers stay in the editor (see Decisions and rows 8 and 10).
7. ~~Turn on the "parts" rule failing from the start~~ Decided by the owner: yes, failing from the start, with today's cases in the allow-list (each with its reason and the row that removes it).
