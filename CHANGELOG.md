# @morphemecms/cms

## 0.19.5

### Patch Changes

- ce5bbc0: A screen reader now says when a page is saving, saved or not saved, reads every message and error once, and says how many problems stop a save
- ce5bbc0: Cards stand 8 px apart, segmented lists sit on the page's surface, radio choice rows have 16 px side padding, the search view dims the page behind it and keyboard focus rings use the secondary colour, as Material 3 prints
- ce5bbc0: Safer handling of HTML and addresses in the editor and the build (code scanning alerts).
- ce5bbc0: The demo's Blocks pages get a Section colours page: sections on Surface, Primary, Secondary, Tertiary and an image, each holding the main blocks. A Surface section with an image keeps its surface and text colours in the editor, as on the site
- ce5bbc0: The demo's colours are Material 3's Tonal Spot scheme from #006397
- ce5bbc0: Density follows Material 3: Large goes, Medium is the default, and the theme's parts support Small down to -3
- ce5bbc0: Density at -2 and -3: a tap never lands on a neighbouring control, a text field with an error shows keyboard focus, and side sheet buttons keep their height
- ce5bbc0: The navigation drawer's header is the theme's list item: your avatar, name and site address, with the close button at its end.
- ce5bbc0: The navigation drawer's scrim follows Material 3: your site's neutral variant colour at 40%, in place of black at 32%.
- ce5bbc0: The editor has a Skip to content link: the first Tab shows it, and Enter jumps over the navigation to the screen's content.
- ce5bbc0: Themes and apps can give an element a Material 3 elevation level with the classes mo-elevation-0 to mo-elevation-3 and mo-elevated-1 to mo-elevated-3
- ce5bbc0: In the editor, the icon button inside a filled button (Buttons, Price cards) shows its keyboard focus ring in the button's text colour, so you can see it
- ce5bbc0: The header's sub-menu follows Material 3's menu: it sits on the lowest surface container, the open page is in the tertiary container, the focus ring is drawn inside the item, the button keeps its state layer while the menu is open, and the arrow keys, Home, End and letters move between the items
- ce5bbc0: In the editor, a field you reach with the Tab key now scrolls clear of the top bar, the Save bar and the file bar. The header and footer previews no longer take Tab stops, the photo credit no longer hides its own Close, and a tab's content shows a focus ring when it takes focus.
- ce5bbc0: The focus stays where you are working with the keyboard: it goes to the page's title when a page opens from the list, stays in the text after Save, stays in a block after Move down or Move up, and moves between Edit dashboard and Done.
- ce5bbc0: Menus in the editor work with the keyboard: focus goes into a menu when it opens, the arrow keys, Home, End and a letter move between the choices, and Escape, Tab or a choice close it with focus back on its button.
- ce5bbc0: A plain list's rows show their hover, pressed and focus layer 16 px past the text, with Material 3's corners, on every screen size, so the text no longer touches the layer's edge
- ce5bbc0: A new check measures every sample of the UI components page against Material 3's tokens in light and dark, and the gallery's samples carry their Material 3 component
- ce5bbc0: Buttons, List - Expand rows, Questions and answers rows and the Checklist take Material 3's 16 dp side padding, and a plain List - Expand has no line between its items.
- ce5bbc0: Parts follow Material 3's sizes and shapes: lists, sliders, icon buttons, switches and button groups
- ce5bbc0: The Material 3 token check compares our tokens with Material 3's through the rename map and names every token that is ours
- ce5bbc0: The main menu drawer, when it opens over the page, stands at Material 3's level 2 elevation with its shadow; beside the page it stays level 0. The Colors page describes Surface container low and Surface container as the parts use them now
- ce5bbc0: The main menu drawer on a phone is at least 320 dp wide (at most the screen less 56 dp) and still as wide as its items need above that; its close button is at the end of the head, as in the editor, with a full-width divider under the head
- ce5bbc0: The screen title no longer shows a focus ring when a screen opens or after a refresh on a phone.
- ce5bbc0: Parts take Material 3's colour roles: tonal buttons, the selected segmented button and the selected menu item in the secondary container, outlined edges in the outline variant, the menu on the surface container, and the slider's label and the switch's icon in the primary colour
- ce5bbc0: Search bars, bars, date pickers and other flat parts no longer draw a shadow, as Material 3 shows them; menus, dialogs, floating buttons and other raised parts keep theirs
- ce5bbc0: The editor's navigation rail takes the colour of Material 3's navigation rail instead of the drawer's
- ce5bbc0: A screen reader names rows' actions by their row (Remove Contact, Move Contact up), files by their kind, the footer links and each screen's title
- ce5bbc0: A screen reader now says whether a menu or dialog button is open, and every dialog and sheet is named by a heading that is on the page
- ce5bbc0: The search field shows its focus ring only when you use the keyboard, not after a click or a tap
- ce5bbc0: Coloured sections are painted with Material 3's container of their colour, with the container's on-colour for text and icons, and a section with an image puts its text on a panel of M3's inverse surface. `check:color-roles` fails on a mix of a colour role and on a role in a section that is not M3's pair.
- ce5bbc0: A list in a start-screen card keeps the card's 16 dp padding, and the title lines up with the rows
- ce5bbc0: A theme's page shows whether the theme meets WCAG 2.2 AA, and where it falls short.
- ce5bbc0: A theme can say where it falls short of WCAG 2.2 AA in its own accessibility.json, and the accessibility checks let through only what it names.
- ce5bbc0: Alt+F10 moves the focus from the text, or from a selected block, to the text bar. The arrow keys move between its tools, and Escape goes back to where you were. Delete removes a selected block.
- ce5bbc0: A docked date picker's month and year steppers wrap on a narrow screen, so the next-year button is never cut off; a search field shows only the theme's clear button

## 0.19.4

### Patch Changes

- 59d3252: A screen reader now says when a page is saving, saved or not saved, reads every message and error once, and says how many problems stop a save
- 59d3252: Safer handling of HTML and addresses in the editor and the build (code scanning alerts).
- 59d3252: The editor tells screen reader users when a long load starts and ends, and when a progress passes each quarter. A failed load, a notice and a copied link are each said once.
- 59d3252: The check that the Preview looks like the site no longer counts the Preview's deliberate `inert` marks as a difference.
- 59d3252: A screen reader names rows' actions by their row (Remove Contact, Move Contact up), files by their kind, the footer links and each screen's title
- 59d3252: A screen reader now says whether a menu or dialog button is open, and every dialog and sheet is named by a heading that is on the page
- 59d3252: A screen reader now hears a block selected, moved, added and removed (with where the focus went), the Alt+F10 hint on the text, and "Preview updated" when you ask for the preview; the preview itself is hidden from screen readers.
- 59d3252: A screen reader names dialogs and side sheets, reads messages sent while a dialog is open, and says the screen's heading on a screen change
- 59d3252: A screen reader tells you what happens in the editor: controls have names, saves, problems and removed blocks are said, and every screen has its own title

## 0.19.3

### Patch Changes

- 21e0b53: The editor has a Skip to content link: the first Tab shows it, and Enter jumps over the navigation to the screen's content.
- 21e0b53: A group in the site's menu drawer opens and closes with Space and Enter
- 21e0b53: In the editor, a field you reach with the Tab key now scrolls clear of the top bar, the Save bar and the file bar. The header and footer previews no longer take Tab stops, the photo credit no longer hides its own Close, and a tab's content shows a focus ring when it takes focus.
- 21e0b53: The focus stays where you are working with the keyboard: it goes to the page's title when a page opens from the list, stays in the text after Save, stays in a block after Move down or Move up, and moves between Edit dashboard and Done.
- 21e0b53: The focus ring on a plain list's row has room around its text
- 21e0b53: Menus in the editor work with the keyboard: focus goes into a menu when it opens, the arrow keys, Home, End and a letter move between the choices, and Escape, Tab or a choice close it with focus back on its button.
- 21e0b53: The floating button comes after the content in the Tab order, the skip link focuses the main content, and focus rings on small links have room
- 21e0b53: The site's pop-up no longer opens while you Tab, and the header menu and the colour choice answer the arrow keys, Home and End
- 21e0b53: Alt+F10 moves the focus from the text, or from a selected block, to the text bar. The arrow keys move between its tools, and Escape goes back to where you were. Delete removes a selected block.

## 0.19.2

### Patch Changes

- cc64e5f: Outlined cards and the outlines in coloured sections reach 3:1 contrast
- a074867: Rows, cards and fields typed in place in a list are easier to use with a keyboard, a screen reader and a touch screen: the chevron of a folding row is a button of its own, a card's media is its own button, and every field is at least 24 px high.
- 6992091: Block cards, notices, choice fields and the subpage buttons are named by the text they show
- d71a79c: Check list items, Image grid cards and keyboard keys are readable by screen readers and in dark mode
- 92891b8: The page's text area has a name for screen readers
- d87aa54: Carousels and bottom sheets can be scrolled with the keyboard, and menus, search results and the time picker read better for screen readers and low vision
- 880f565: You can zoom the editor on a phone with a pinch or a double tap, and the Save bar and the text toolbar stay in view
- d926591: The editor's back arrow and breadcrumb links percent-encode `"`, `<` and `>` in their address, so code scanning finds no way for a picked file's name to reach the link as HTML.

## 0.19.1

### Patch Changes

- e4bb1fd: The editor checks every image and link address before it draws it, and a file preview never opens an unchecked address.

## 0.19.0

### Minor Changes

- Contract 7 starts the 0.19 line: themes and apps are written in plain CSS, with `mo-` classes and `--mo-` tokens. Utility classes, `theme()` and `@theme` no longer work. See docs/tailwind-migration.md.

### Patch Changes

- 40c7d7b: An app block that draws its own inline rows in the editor writes `mo-editor-inline-list`, `mo-editor-inline-list-row`, `mo-editor-inline-list-row-active` and `mo-editor-inline-list-row-next` instead of the same names without `mo-editor-`; the editor's own classes now start with `mo-editor-` or `mo-site-` (map: docs/superpowers/plans/mo-names/map.json).
- f26020d: An update from 0.15 or 0.16 no longer fails on a page with a Banner: the Banner is now migrated to a section, as 0.17 did, even when the site skips 0.17.
- 4031827: The same new text style and word colour names are now also written into your lists, settings, header, footer and block texts when the update or `npx morpheme migrate` runs
- 9dabc23: Text styles and word colours in your pages are saved under new class names; the nightly update rewrites your pages with the version, and a manual install runs `npx morpheme migrate`
- 1d63f4f: Rename the theme's UI component classes, hooks and runtime values to `mo-` names (`.card-body` to `.mo-card__body`, `.button-filled` to `.mo-button.mo-is-filled`, `--card-selected-surface` to `--mo-comp-card-selected-surface`, `--slider-start` to `--mo-comp-slider-start`, `.image-grid` to `.mo-staggered-grid`): a theme or app that styled the old names must use the new ones (`docs/superpowers/plans/mo-names/map.json`, `docs/class-names.md`, *Settled in M3*).
- cea2a38: Rename the blocks' classes and the timeline's `--step` to `mo-` names (`block-card` to `mo-block-cards__card`, `block-plan` to `mo-block-pricecards__plan`, `block-in-text` to `mo-is-in-text`, `video-facade` to `mo-block-video__facade` …): a theme or app that styled `block-*` must use the new names (`docs/class-names.md`, *Settled in M4*, and `docs/superpowers/plans/mo-names/map.json`).
- ec0e721: Rename the site shell's classes and properties to `mo-` names (the footer, header menu, drawer head, action bar, logo, post list, page layout, section colours `.mo-text-section` with `mo-is-<color>`, `--motion-ease` to `--mo-sys-motion-ease`): a theme or app that styled the old names must use the new ones (`docs/superpowers/plans/mo-names/map.json`).
- eca6b02: Rename the alignment classes of the text toolbar to `mo-has-text-align-center` and `mo-has-text-align-right` (`text-align-center`, `text-align-right`): a theme that styled the old classes must use the new ones. Saved pages are not affected: they hold only the `data-align` line, and the site adds the class when it builds.
- e4fc35c: The text style `prose` is now `mo-prose` and its opt-out `not-prose` is `mo-is-not-prose`, in the theme, the editor and the demo. The update to 0.19.0 and `npx morpheme migrate` rewrite both names in a site's pages. A theme or an app that styles or writes `prose` or `not-prose` uses the new names (`docs/tailwind-migration.md`).
- 47de2ca: Tailwind and unprefixed names can no longer come back: `check:tailwind` and `check:mo-names` have no allowlist, and `check:content` (so `check:themes`) runs both on a site's themes and apps. The last unprefixed names are now `mo-js`, `mo-link`, `mo-site-picture__crop` and `mo-staggered-grid__span-*`.
- e4cd23f: The text style `prose` is the theme's own CSS: `@tailwindcss/typography` is no longer a dependency, and the text's colours are `--mo-comp-prose-*` (they were `--tw-prose-*`). Nothing looks different.
- d9019fb: Contract 7: themes and apps use plain CSS (`mo-` layout classes, literal breakpoints); utility classes, `theme()` and `@theme` no longer work, and the store offers only themes and apps written to 7. Tailwind is no longer a dependency. See docs/tailwind-migration.md.
- ca51431: Fix the text bar's Align row being off after a click below the last paragraph of a page with no sections.
- d2985f5: Tapping the empty space below the text of a page now puts the cursor in the last line, so the text tools such as Align stay on.

## 0.18.1

### Patch Changes

- 914cc83: The start screen says why the website can't update itself: a theme or app that doesn't work with the new version yet, a version that needs npm, a GitHub token that can't save, or a missing token or KV namespace.
- 6ecef70: The peer range for postcss-selector-parser starts at 7.1.0 (it was 7.2.0), so a site with 7.1.x in its lockfile can update itself again; a test runs the real update on lockfiles of old and current starters.
- 515242b: A page on your site keeps the site's language in its `lang` setting, whatever language the visitor's browser uses, so screen readers read it in the right language.
- 08507d4: A site's nightly update no longer takes a version whose contract a theme or app from the store is not written to; it records the hold as a problem instead. A missing GitHub token is recorded as a problem too.

## 0.18.0

### Minor Changes

- 31a0e26: After you choose an image, a short sheet asks for its alt text right away, with Skip and Save; the toolbar's Alt text opens the same sheet for an image in the text.
- 430a506: The theme's app bar and text field menu have Material 3's names: `@theme/ui/AppBar` and `@theme/ui/TextFieldMenu`. The old names, `TopAppBar` and `ExposedDropdownMenu`, stay as aliases while THEME_API is 4, so apps and themes work as before.
- f8d6fdc: A button in Buttons, Cards and Price cards is Filled, Tonal, Outlined or Text; Elevated is no longer a choice, and a saved Elevated button is drawn as Tonal.
- aaa6698: A Cards block has one Image aspect ratio for its cards' images (3:2 as before), and a card's image has the image tools in the toolbar: Change image, Crop, Alt text and Remove.
- b9636b4: The theme's Card follows Material 3's anatomy: it draws `media` or an `icon`, a `headline`, a `subhead`, `supporting` text and `actions` in M3's order. Filled cards sit on the highest surface container, a dragged card gets its state layer, and an outlined card's edge turns `on-surface` with focus. The card's rules and tokens move to `theme/styles/ui/card.css`.
- d2ecb08: Change to in a block's ⋮ menu turns a List, Segmented list, Steps, FAQ list or Cards into another of them; titles and texts move over, and what the new block can't show is kept for changing back.
- 91fe1f5: Change to includes the Table: a list block becomes a Table of its titles and texts, and a Table becomes a list block; changing back brings icons, links, the header row and the other columns back.
- 2800d3e: Choices like a button's style no longer squeeze together in a narrow sheet: they show as a list with a small sample of each style when they don't fit on one line
- c21567e: The theme has a choice group: a few choices side by side as joined buttons when they fit, else a list of radio buttons with a small sample of each look
- 24be550: A command palette: Ctrl+K, or the search icon in the top bar, finds a screen or a page by name and goes there
- 77ac8b2: Crop opens a view of its own: the whole image with a frame of the chosen aspect ratio, the part outside the frame darkened, and zoom by pinch, wheel or slider. In an image's settings, Format is now an Aspect ratio row that opens the same view.
- c2dee20: The theme's Dialog has no full-screen kind any more: a full screen is a page with a back arrow. `THEME_API` is 5. A theme or an app that draws `<Dialog kind="full-screen">`, imports `dialogFullScreenModalClass`, or styles `dialog-full-screen` must move to a page or a basic dialog. The lightbox looks as before.
- 93cbab7: The FAQ list is a List - Expand: a List - Expand has the setting Mark as FAQ, which puts its rows in the page's structured data as questions and answers, and the text of a row is Markdown (bold, italic, links and lists). A FAQ list from before opens as a List - Expand with the design Segmented and Mark as FAQ on, with its questions and answers kept
- 5f3822c: The Files filter sheet has a Clear all button
- a8e97e4: The footer has a Theme setting with Light, Auto and Dark: Auto follows the system, and your pick is remembered
- f37945a: Tapping an image in the text selects it, and the toolbar shows its tools: Change image, Crop, Alt text and Remove. Move up and Move down stay in the row above it, and on a computer the tap still opens the image's settings beside the page.
- 6054db9: List, Segmented list, FAQ list, Accordion, Blog posts and Testimonials as a list have a Columns setting: on (as before) the rows sit in as many columns as fit, off gives one column.
- 83fe32a: The Segmented list is now a List or a List - Expand with the design Segmented: both lists have a Design setting, Plain or Segmented, and pages from before open and look as they did
- 8785cdb: On a computer a block's side sheet changes the page at once, with no Save or Cancel: Undo takes a change back, Remove is in the block's menu, and a new block goes in at once with its sheet open beside it.
- 7b9e60e: A page's main heading no longer has a background image: Section settings on the Main heading keep Color and Width only, an image left in an old page is ignored, and the front-page Banner migration leaves a Banner with its image behind the text as a Banner. H2 sections, the share image and blog posts' images are unchanged.
- d08b5db: Discard button in the page form's bar: it throws away a page's changes since it was published.
- 6aef269: The command palette also finds the text's and the active block's actions, such as Bold, a heading style or Add row below, and runs them in the text
- 83be25b: A spreadsheet's lines, or a document's table, pasted into an empty Table make its rows and cells.
- 455bb53: Lines pasted into an empty item of a List, Steps, Segmented list, FAQ list or Cards make one item each; a tab in a line splits its title and text.
- 5dde7b7: On a phone a block’s settings open on a page of their own, with the back arrow and the block’s name at the top and Save at the bottom; what you typed in them comes back after a reload ("Restore your unsaved changes?").
- 2ddea4e: Preview is on the text's toolbar of a page or post, and View on the website is in the toolbar's More menu; Ctrl+S (⌘S) saves the page at once.
- 14ad3a3: The old Banner block is removed. A page that still has one no longer shows it; use a section with a heading, text and Buttons instead.
- f261f66: Saves go live sooner: every site builds on the content lane, and a new CMS version still takes the full lane
- 673dd03: The docked search view's results container has the 12dp corners of Material 3's contained style.
- 516d207: The search view's suggestions and results are rows on their own surfaces with small gaps, as in Material 3's segmented list.
- 0fdf9a9: The search view follows Material 3: a filled search bar, recent searches you can run again or remove, filter chips, results with icons or image previews under group names, and a last row that shows all results.
- d0f9a54: A page's text is 40 to 60 characters wide,; the rows of lists and accordions are in up to three columns of at least 344px; Steps is at most 720px wide.
- 6b26081: THEME_API and APP_API are 6: every design token that is not Tailwind's has a Material 3 name (`--mo-ref-*`, `--mo-sys-*`, `--mo-comp-*`), the old names stop working, and apps and themes written to contract 4 or 5 are not offered by the store until re-released. Components: theme tokens, app and theme contracts.
- cbf5326: A theme that writes a faulty value for a colour, size or time token (`--mo-sys-color-primary: banana`) no longer breaks the page: 148 `--mo-sys-*` and `--mo-ref-*` tokens and the 45 colour roles are registered with `@property` and keep today's default, and the comp tokens that point at one sys token are read with it as their fallback. Components: theme tokens.
- 15c700b: The tokens of the buttons, icon buttons, split buttons, FABs, segmented buttons, toolbars and the top app bar follow Material 3's naming (`--mo-comp-button-filled-container-color`, `--mo-comp-icon-button-small-icon-size`), and the old names (`--button-filled-surface`, `--icon-button-icon-size` …) stop working.
- 97a05f7: The tokens of the cards, lists, chips, carousel and grid follow Material 3's naming (`--mo-comp-list-list-item-container-color`, `--mo-comp-filter-chip-container-height`), and the old names (`--card-filled-surface`, `--list-item-radius` …) stop working.
- e7ce895: The tokens of the text fields, checkboxes, radio buttons, switches, sliders, search and the date and time pickers follow Material 3's naming (`--mo-comp-switch-selected-track-color`, `--mo-comp-outlined-text-field-outline-color`), and the old names (`--switch-track-surface`, `--text-field-outlined-line` …) stop working.
- d55a705: The tokens of the navigation (bar, rail, drawer), menus, dialogs, snackbars, tooltips, badges, progress and loading indicators, sheets and dividers follow Material 3's naming (`--mo-comp-navigation-bar-container-color`, `--mo-comp-menu-container-color`), and the old names (`--navigation-bar-surface`, `--menu-surface` …) stop working.
- 7f997e9: The standard theme's own tokens (the logo, the post list, the home and blog first sections, the side panel) and the editor's (the section frame, the status colours, the menu, the drawer header, the search-result preview) follow the same pattern (`--mo-comp-theme-logo-tile`, `--mo-comp-editor-status-good`), and the old names (`--theme-logo-tile`, `--editor-status-good` …) stop working.
- bb58893: The theme's colour, shape, elevation, state, motion, type scale, spacing, density, grid, block and section tokens follow Material 3's naming (`--mo-sys-color-primary`, `--mo-sys-shape-corner-large`, `--mo-ref-space-100`), and the old names (`--mo-primary`, `--mo-shape-large`, `--block-text` …) stop working.
- b697fdc: A selected video has Change link in the toolbar, which opens its sheet with the link ready to be replaced; the slot over the video is gone.
- 85e6d5c: The Video block has a Thumbnail field: choose your own image to show before the video plays, instead of the one from the video link.

### Patch Changes

- 5423a03: The block "Expandable list" is called Accordion, the web's name for rows that open and close.
- 4c10195: After you put in an image and its Alt text sheet closes, the cursor stays after the image instead of sometimes jumping back to the start of the text.
- f49670b: The editor's menus and tooltips are placed by the browser (CSS anchor positioning), so they stay at their button and inside the window when you scroll or resize.
- 28cb580: Tooltips are placed by the browser's CSS anchor positioning where it is available: over the button, under it near the top of the window, and always inside the window, with the same look as before.
- 75eba17: Add the Avatar component to the theme (`theme/ui/Avatar.tsx`, `avatar.css`): a round letter or image, used by the list item's leading avatar. Its look is unchanged; the old `--list-item-avatar-*` tokens are now `--mo-comp-avatar-*`.
- f261f66: Image sizes are made several at a time, so a site's first build, a cleared cache or a big upload of images builds faster.
- f261f66: A new site starts with an `.npmrc` that makes the install on the build faster (`prefer-offline`, no audit, no fund), and the CMS update adds the same lines to an existing site's `.npmrc`, keeping its own lines.
- 66ac7f8: The drag handle of a block is in the top left corner of its frame, on every block.
- 205096e: Insert block and Block settings use one icon family built on Material Symbols' widgets: widgets with a plus to add a block, widgets with a small cog for a block's settings.
- aa517a4: The active block's action row sits inside the block's dotted outline (Card corners and padding) and shows on hover over the block without moving the page; opening it no longer pushes the block down. Its buttons and Add list row use the theme's icon button and text button.
- 8347c30: From 600 dp a block's settings, a List row's settings and the Block settings details open in a pane beside the page, not in a dialog.
- b9636b4: The blog list's titles use the list's text size, and the site's lists draw without Tailwind classes
- 8f97d99: On Logo and favicon, the buttons sit on their own row under the logo and the favicon, and say Select new logo, Select new favicon and Create favicon from logo.
- 3951c91: On Logo and favicon, the buttons say Change logo, Change favicon and Create from logo
- f261f66: Saves build faster: image sizes and video stills that did not change are taken from the live site instead of being made again.
- 9bcbdd5: A button's text field is called Button label and the styles of buttons, cards and the image grid's cards are called Variant, as Material 3 names them. The Blog posts block keeps Design for list or newest large.
- 67d4efb: Extra small buttons are 32 dp high, as Material 3 Expressive says
- eb13ea9: The image or video at the top of a card has rounded bottom corners, as in Material 3's Cards page.
- c015895: A card's text is optional: a card can be its headline alone, with no empty text area on the site or in the editor.
- e7534c9: A video in a card keeps the size of its still when it is played, so the card no longer grows.
- 3b71bdb: A click on a card's headline in a row of cards edits that card, also when the block's action row would lie over it.
- b21be92: Cards, Price cards, Panels and Related posts are 16 px apart on a phone and 24 px apart from a tablet, the same as the Image grid.
- ab3e02b: Elevated cards always have their Material 3 shadow, and a card in the page editor has no empty Subheading row until you tap into it.
- b9636b4: Cards, Price cards, Notice, Image grid, related posts and the 404 page's suggestion are drawn by the same card parts, with the subhead in small label text.
- 2d9170e: A carousel in a narrow column or a side sheet now shows as many items as fit its own width, not the window's.
- 3d6e878: Change to is in the editor's action registry as one action per block (block.change-to-<type>), so the command palette can find it.
- 254dd5b: Change to is now Change type in a block's ⋮ menu, and the submenu's header has the same icon and takes you back to the menu.
- 92e477f: The check mark of a check list is drawn from Material Symbols (`check`), on the site and in the editor, in place of Phosphor's
- b26dc30: In the editor, the arrow on a row of a Segmented list or Questions and answers opens and closes the row.
- 67c635b: The small samples beside the choices of a list are smaller buttons, so they fit their rows
- 359326d: A site takes a new version of Morpheme once a day, at night in its own time zone, instead of checking every hour.
- 59c62ce: A page or post opens with only Content open: Content no longer folds, and every other section starts folded on every screen.
- b7febfb: The start screen's "Continue where you left off" card no longer has a close button; remove it with Edit dashboard instead.
- eea0230: A check keeps every shared theme value a `--mo-` token and stops an app or theme from redeclaring a name the CMS declares.
- fbcad07: The cards on the start screen pack like the Library's media grid, with no empty space under a short card.
- 550ccc8: On the start screen, Edit dashboard is a text button below the widgets instead of a pencil in the top bar.
- 4d77fc7: Start screen widgets can declare a span, and the start screen shows two columns of cards on a phone.
- 73a201a: Preview uses the monitor with a phone icon everywhere in the editor
- bd434e4: A pop-up or dialog on the site opens with the focus on the dialog itself, so no button looks chosen.
- 4bf85ca: On a computer, the editor's screens are as wide as the text on the site, centred, so the start screen, lists and settings no longer stretch across the whole window.
- 45a2c38: In the page editor the text and the blocks share one left edge, with a 16 dp margin on a phone, and a block's dotted frame hangs outside it
- b837a9a: The add button of a list moves up when the footer is beneath it, so the footer links are never covered.
- ff2d410: The browser tab icon is called Favicon, its real name: Business › Logo and favicon, with the hint "The icon in the browser tab".
- e90509e: From 600 dp a file's details in Files and a consent record open in a pane beside the page, not in a dialog or on a page of their own.
- 5cc067e: On the Files page, the date choice moves into the filter, so the search row has only search, sort and filter.
- 585858d: On a phone, a file in Files opens as a subpage of Files with a back arrow, the file name and Download in the top bar, instead of a full-screen dialog; Back returns to the list at the same place.
- 51bf4da: On a phone, a file in Files opens full screen with the image at the top, Download in the top bar and Previous and Next under the fields
- ac80038: The select circle on a block is flat and part of the block's dotted outline
- 8b05493: The icon button in a row of the editor shows a clear ring when you reach it with the keyboard.
- ecdb3fd: The focus in the page text shows on the section the cursor is in, or on the block in focus, instead of a frame round the whole editor.
- dd87aa2: On a phone, the footer's links are in two columns
- a7e850f: The Google preview and the SEO score colours use light-dark(), so they follow the editor's light or dark choice.
- a5c4f2a: A site that uses the Phosphor icon pack now draws the editor's Search, Settings, Customize and More icons from the pack instead of from Material Symbols.
- 99ec9d4: A block just put in takes its first row once the insert dialog has closed, not after a 1.5 s guess
- c946f52: A label above a heading on the front page sits close above it, with the same small space as in a text.
- c271d27: From 600 dp the link of a text, a profile link and a menu item open in a pane beside the page, not in a dialog.
- e2dd9fe: In a List or List - Expand with a row limit, the Show more button and the text button under the list stand on one row, and an open item of a plain List - Expand has a background
- 6be5b94: A list row with columns keeps its headline and text under each other in a narrow column or a side sheet, and puts them side by side only when the row itself is wide.
- 37e492c: Lists in columns have the right dividers and corners: a plain List - Expand has a line between its rows only, none above the first row and none against an open item, and a segmented list has the list's corners on its first and last rows
- 339e27f: The labels of the list settings are clearer: the media choice of List and List - Expand is called Media (as in Cards), the sheet of a row is Row settings, and the text of the Show more button is Show more label
- 12000f9: The List menu button on a list's page opens its menu on a medium-width window.
- 33cf67d: A List without a box starts its rows' icons and text on the page's left edge, not one more 16 dp in
- bbcf4cd: From 600 dp a list's settings, the name of a new list, a widget's settings, an app's add-on and a redirect open in a pane beside the page, not in a dialog.
- b9636b4: Lists follow Material 3 Expressive: a row shows only its state layer when pointed at, with rounder corners when pressed, focused or dragged
- 48ccf27: In the editor's menus, a letter goes to the next item that starts with it
- 1d43664: The grid tokens are called `--mo-grid-margin`, `--mo-grid-gutter` and `--mo-grid-layout-columns`, like every shared theme value; the old names are gone.
- a488189: The site's menu drawer is a native dialog, so the browser keeps the page behind it still and the focus in it, with the same look and motion.
- 53673a1: A tap outside a dialog, a bottom sheet, the search view or a pop-up closes it with the browser's own light dismiss, and keeps the same motion.
- 17fe413: A block's page and the crop page no longer show a focus ring on the back arrow when they open; Tab still reaches it first.
- 583cfdc: On a phone the notifications are a page with a back arrow, not a side sheet.
- 85e00f6: A number field says "Enter a number." when what you type is not a number.
- e74b4f4: `morpheme migrate` removes the background image left in a page's main heading marker, and `check:editor` lists such a page as one to migrate instead of failing the site's build
- c83037a: A Segmented list is edited like a List: the link icon at the end of the row, the same texts and the same Add list row button
- bebeeea: Settings buttons share one icon: tune for the settings of a block, a section or an image, and the pencil only for opening a list to edit
- 5e10ace: An open row of an accordion has the same room under its text as above its heading, the text lines up with the title in the editor, and the open row is round on all four corners.
- cfb6421: The search has a Keyboard shortcuts list and a Clear recent actions action, and signing out forgets the recent actions
- eda1e6b: Cloudflare and GitHub parts keep their real names in English and Danish: R2 bucket, R2 location, Cloudflare API token, Workers Paid, KV namespace, the website's Worker, R2 caching and builds, and GitHub token.
- 3097999: In the Blog posts block, the date and reading time sit directly over each post's title instead of a line above it.
- 501440e: In a post list on a phone, the date and reading time stay on one line in longer languages such as Danish.
- 9b536fe: The Preview of a page or post opens as a page of the editor, with the top bar's back arrow and the window sizes under it, instead of a full-screen dialog. Back returns to the form where you were, with your unsaved changes.
- 7287071: The site's menu on a phone is as wide as its items need, with a new background colour and a menu button at its top.
- 141af98: The editor draws an image or a link only from an address it knows is safe: a path on the site, an http(s) address, or an image made in the editor.
- d7fc26c: On a phone, Save in a block's page and in the crop view is in the same bottom sheet as the page's Save, lined up with the fields
- 12617a7: Fix: the editor's Settings and Customize icons now have an entry in every icon pack's map, so a theme with the Phosphor pack draws them.
- 44f53e2: On a phone, a section's settings are a page with a back arrow and Save at the bottom, not a sheet.
- d5555d4: From 600 dp a section's settings open in a pane at the right of the editor, beside the page, not in a dialog.
- 42bb086: The editor and the theme's pickers say Select, Material 3's verb, wherever they said Pick or Choose for selecting something.
- 0dfe126: The SEO and sharing fields use their standard names: Meta title, Meta description, Canonical URL, Open Graph image, Open Graph title and Open Graph description. The short description is now the Excerpt.
- b9636b4: Parts on an elevation level show its shadow at rest, state layers read Material 3's five opacities, and every part has one focus ring.
- 1379864: Closing a sheet with changes asks "Keep your changes?" with Discard and Keep, and the block's visibility button says Hide and Show, and a hidden block Hidden.
- 3e02507: Fields and buttons in a bottom sheet line up with the fields on the page behind it.
- 46ddea3: A side sheet opens with no focus ring on a field or button.
- 7e98ab7: The column beside the text of the pages is called Sidebar, the web's name for it and the one its stored value already uses. Side column and Left and Right side panel become Sidebar, Left sidebar and Right sidebar.
- b9636b4: The Cards, Price cards, Notice, Image grid and related-post cards, and the 404 page's suggestion, are drawn by the theme's Card parts: the same card look everywhere, with the media's bottom corners rounded as before.
- 88bbc7b: Features use one standard name each: Lists, Default pages, Home page and Checklist; the link sheet saves with Save; and the Components screen names Material 3's components and tokens.
- fbc429f: Fields use their standard names: Alt text, Primary keyword, Subheading, Label text and Supporting text, the Lightbox labels, Center column, Maximum rows, Expand, Registration number and Type.
- 6162f81: In the Steps block, a step's heading lines up with its number, and the line joins one number to the next and stops at the last.
- 468cc74: A switch and the status it gives say On and Off everywhere, as Material 3 names them. The switch label names the setting, such as Promotion or Internal links, and no longer says Activated.
- f8d6fdc: A text button has the same side padding as the other buttons.
- 1e09623: A text's headings, quotes and Heading 1, 5 and 6 use the theme's type styles, so every level has its own size.
- 7315f21: The theme check follows the icon pack a theme declares, and `morpheme check:themes` accepts `--shard K/N`.
- aa8692a: The editor says URL wherever it said address for a web address: the page and post URL, the redirects, the social profile URL, the link sheet's Other URL and the assistants' connector URL. An email address stays an email address.
- 555cdef: A text field shows what is wrong with it only after you leave it, and says what to fix under the field.
- 4b7f820: The site and the editor follow the system's light or dark scheme in form controls and scrollbars, Enter that confirms an IME composition no longer triggers an action, and sheets fit the visible screen on a phone.

## 0.17.0

### Minor Changes

- 17dbfb0: The menu's Apps section is Store, Connectors, Plugins and Themes: the last three open the installed ones, and no app is listed in the menu.
- 17dbfb0: With R2 caching on, the page form keeps your changes while you write and puts them back if you close the tab, and the line under the title says Saving…, Saved or Not saved
- 9e00aca: With R2 caching on, a new page or post is kept while you write: it is called New page or New blog post at once, takes its name from the H1 (a post's title), and is saved as a draft when you leave; a draft page is now autosaved too
- 6a047d6: With R2 caching on, the editor's Worker can keep an autosaved draft of a page and move it to the waiting version when you leave the page
- 32fd6ce: The Publish button shows the progress while the website updates.
- ab3bf0c: The Checklist block is now a check list in the text: each point is a checked item, and the block's label, heading and intro are plain text above it.
- 947ea55: Choose how much fits on screen: Density, with Large, Medium and Small, under Account.
- d403d6f: Under Business › Colors you can choose Custom and set Primary, Secondary and Tertiary freely, each with its pen or its dot on the color wheel.
- 028222b: New pages and posts start as Draft, so nothing goes live until you publish it, and the editor now loads the waiting versions of pages and posts
- 5973fc4: The Hidden status is gone for pages: a hidden page stays published and has No index turned on (a hidden post has the Hidden switch, which keeps it out of the blog but not out of Google)
- 3afca52: A published page or post keeps your changes as a waiting version until you choose Publish changes, a draft has Publish, and Unpublish and Discard changes are at the end of the form
- 3f6278c: Schedule a draft, or the changes to a published page, for a date and time; pages that were Scheduled before wait as a draft with their time, and the Scheduled status is gone
- 364fbd5: Caching and builds explains how to skip the build for changes that wait to be published, and the status words are now Draft and Published
- cfbd024: A page or post with changes waiting has a Live and Scheduled switch at the top to edit either one, and an app can replace the switch
- f251d66: The site's Worker publishes a waiting version of a page or post once its time has come, and a save in the drafts folder builds the site with only the editor's checks
- 8d94a56: A page with changes waiting is marked in the lists and has a notice at the top of the form, and Publish changes asks first when the live version was changed after the changes were saved
- 4186b28: An Expandable list is now a Segmented list: its rows, texts and links stay as they were.
- 17dbfb0: The Banner at the top of the front page is a section now: the page heading starts it, and it can have a background image and a width
- edb1e6e: Preview opens full screen with a bar of window sizes, and the page can be dragged to any width.
- d6c689e: Links are now a List: each group's title is a row, and each page is a row with its title.
- e523367: Three list blocks: List, Segmented list (rows that fold out, with `Only one open` and a text button) and FAQ list, and the `Insert` picker groups the standard blocks by what they do.
- 17dbfb0: A List keeps only its rows: its label, heading and intro become the text's own lines above it.
- 9e00aca: A List is typed right in the text: each row's heading and text where it stands, the active row with its icon and link, and the next row always ready.
- b9ffc03: A List has a floating toolbar for its rows and settings for the row you are in, in the side panel or a bottom sheet, with no Save or Cancel.
- 853551d: The List block shows the rows of the list it reads, with the tag filter and How many applied, right in the text editor.
- b90da31: An installed app can add a source of images, such as Unsplash, to the image picker, and the credit is saved with the image.
- 3e2b7c1: The menu section Blocks is Globals (Header, Footer, Side column, Block templates); Colors is under Business, and Block settings, Caching and builds and Components are rows of Settings.
- 9a0e3cd: Search engines have two switches on pages and posts: Hide from search engines is now called No index, and the new No follow, off by default, tells search engines not to follow the page’s links.
- 3beb843: A new list starts empty and the owner adds its fields one at a time, any number of each kind.
- 47d3996: Under Lists, New list makes a list of your own with a name and the fields icon, title, body text, image, link and tags; it shows under Lists and in Rows from.
- 2335709: Points with icon are now a List: each point is a row with its icon, heading, text and page.
- 13ff472: A blog post's title, image, date and tags are drawn at the top of its text as the site shows them.
- 71f5880: A List, Segmented list or FAQ list can take its rows from a list on the site (the blog posts, the testimonials or an app's list) with a tag filter, `How many` and a `Show all` button, instead of typed rows.
- b372323: A section can be Surface, Primary, Secondary or Tertiary, and have a background image and a width; the Banner is a section now
- 17dbfb0: The Segmented list has a `Max rows` setting: it shows that many rows and a `Show more` button shows the rest.
- 17dbfb0: Switches no longer show On and Off words; a check or a cross in the switch shows its state
- 69d4115: Body large, Label and Check list in the text style menu and a dotted line at each H2 in the editor

### Patch Changes

- cf12d4f: The title of each section row in the page editor sits in the middle of the row, with equal space above and below.
- 8bf6a3f: The link under a row of "Expandable list" is drawn as a text button, not an underlined link with an arrow.
- 821bc68: The section rows at the bottom of the page editor (Other fields, Search engines, Social media, Earlier versions) now sit in the middle between their two lines.
- 5e19e18: A block's own actions are in a row above the block while it is active.
- 00a9385: Every block in the page editor has a handle at its top right that moves the block by dragging.
- 0a18b99: The Label field is gone from a block's head. A block that had one shows its label as a Label line of text right before the block.
- 84378c1: A block inserted in a list item stays at the top level of the page instead of being indented in the list, and Backspace at the start of a list item leaves the list
- 33c5094: Several blocks of a page can be selected together and hidden, shown, moved, duplicated (one block) or removed from the text's one bar.
- a6ca602: Plain paragraphs are Body medium (14 px) and the Label style follows Material 3's label-medium.
- bc4f0f1: The text styles follow Material 3's body scale (Body large, Body medium, Body small), and a new page or text starts as Body medium instead of an H1.
- 4d426d6: While the website updates after you publish, the Publish button shows the progress, and a failed update says so with a link to System status.
- 56a02ef: Pages and Blog posts can be selected and deleted several at once.
- 886b37d: A button's Style shows its five types side by side, and Text only is now called Text.
- a264556: Buttons are typed in place: each button looks as on your site and you type its label on the button itself.
- b0d2b6f: The floating text menu is one row: Bold, Italic, Link, Heading (H), Insert (+) and More, which opens a sheet with colour, text styles, lists and alignment.
- dd6866f: Testimonials keep 16 dp of padding at every width, and Testimonials and Price cards space their parts like the Cards block.
- f72ddf6: A card's icon with no color chosen is drawn in the text color, as in a list row, where it was the accent color.
- 8e100bf: The room inside a Cards card follows Material 3's grid: 16 above the text and the link, 8 between headline and text, and the same gap between cards in a stack, a grid and the phone carousel.
- 523dfdc: Cards follow Material 3: one media (icon, image or video) for the whole block, a Design of Outlined, Filled or Elevated with Material's container colors, a subhead under the headline, and buttons or a link on a card.
- 63dff19: Cards can be a carousel on phones (Material 3's uncontained layout), with Show all, snap scrolling and arrow keys.
- 49491a1: A check list shows a check icon before each item, in the editor and on the site, and the text style button shows the style you are in, or a general text icon outside the text.
- f048ccf: Let `check:themes` run on a site that already has its own `src/data/side.json`: the check puts the file back as it was.
- 7b6446a: A theme that sets none of the block colours now gets the site's own colours instead of a fixed blue and grey.
- 7e02f11: Segmented list rows and tabs light up at Material 3's hover strength (8%) when pointed at, like the other parts.
- d03f503: The sign-in page of the AI connection follows the browser's light or dark setting and its accent colour.
- efe4c50: An app with no declared role is a connector when it connects to an outside service, so it shows under Connectors in the Appstore
- df35ca7: The Cookie list is drawn like the Table block: in an outlined frame, with a header row and the Table's row height and padding.
- 8dce0ce: Under Deleted, several deleted pages, posts, files and entries can be ticked and restored together.
- f0e2450: A list you made yourself is offered under Rows from, and the demo has a Highlights list that the screens check uses for the field picker.
- 68d6403: Dialogs, the date picker and the time picker have 28 dp corners, as Material 3 prints.
- 4dc518d: The switch at the top of a page says Published and Draft, and the Draft tab has a Discard draft button that asks first
- 1c58d10: The start screen's Unfinished card is now Drafts: it shows three items, and Show all opens the full list of drafts and scheduled pages.
- fd97a09: On a phone, a press and hold on a row or file followed by a drag selects every row the finger passes over, and the list scrolls itself near its top and bottom edge.
- 70df7ad: A page or post title that another file already has gets the next free number in a dialog, instead of an error
- fb2bbf3: A dynamic list lets you tap a part of a row to choose which field of its list shows there.
- 53413e6: A list in the text has a Fill from a list button in its toolbar that opens the dynamic settings (the list, tags and how many); typed rows are kept and an Undo brings them back.
- a497489: A list that takes its rows from a list of your site now says where they come from, which tag and how many, and has an Edit list button that opens the list.
- ea3a892: Code, quotes and captions in a section on a colour take the section's text colour in the page editor.
- d16c3c1: The editor's headings use Material 3's type steps: 16px for small headings and 22px for large ones.
- 17dbfb0: Tidy the spacing and alignment of the "Caching and builds" screen.
- ce2c322: An elevated button, chip or card in a section on a colour is readable again.
- d985403: On a page with only its heading, a tap on the hint line puts the cursor in an empty paragraph under it; the hint lines read on every section colour and start where the text starts.
- 93e7495: A FAQ list is typed right in the text: the question in its line and the answer in the open panel.
- 3773a65: Questions and answers and Segmented list rows are drawn on the theme's List "expand" kind: an open row keeps its text colour and shows its arrow in a round container.
- 8e16fa2: Files can be selected and deleted several at once. Files a page uses are kept, named, and stay selected.
- 852b41d: The images in Files keep their own shape in a staggered grid of two columns on a phone and four on a computer, and the chosen image shows a check mark.
- 6df8ed7: A new site's start screen has a Get started section, an empty page shows a hint, and the editor asks before the browser
  asks to show notifications.
- bc1a568: On a phone, the text menu floats by the selected text again, instead of a bottom sheet over Save changes.
- 88c9529: Footer links in the editor are easier to tap on a phone
- 1d591ec: The footer's columns and the post list's two columns sit 24 dp apart from medium screens up, on the 8 dp scale.
- 04aadc5: The buttons at the bottom of a page or post form (Save draft, Publish) now sit in the theme's standard bottom sheet: the same surface and rounded top as the other sheets, above the on-screen keyboard on a phone.
- 82e252a: A page whose heading section has a colour or an image now starts right under the navigation bar, with no empty band between them.
- 6ae536e: The head image of a blog post is drawn in the editor only from an address written again from the allowed characters, as a section's image is.
- 410e52d: In a heading, Text style no longer shows a body style.
- 5daa22a: A page's Template no longer shows templates that are not available: the side panel templates appear once a block is chosen for the side column.
- eeff5d9: Small and narrow icon buttons have a 48 by 48 dp touch target, as Material 3 asks.
- cd0d67a: A row's or card's icon can have a color from the site's colors (Primary, Secondary or Tertiary), set where the icon is picked.
- 63fca82: An icon field shows its icon, or a plus, as a round button that opens the icons.
- 7a62342: "Icon packs" under Appearance lists the packs again on a site that installs the package from npm.
- b0f6868: The icon picker has a search field and categories that find all icons of Material Symbols and Phosphor.
- 45f4c80: A card's image and a testimonial's image have an Alt text field, so the image is described for people who can't see it.
- 46a6b16: An image with no alt text of its own is drawn with the text its file has in Files, on pages, posts, cards, testimonials and banners, and the Alt text fields show that text greyed until you type your own.
- b480c1c: An image in Files has Describe the image, Decorative image and Caption fields, saved with the image.
- 8d7ecb4: A new Image grid block shows images from Files in a grid that visitors can filter by tag and open bigger.
- 2a792cb: `Insert` sorts every block into one of seven groups (Cards, Lists, Banners, Buttons, Media, From your content, Developer), with Blog posts, Testimonials and Cookie list under From your content and HTML code under Developer, a test fails when a block has no group, and a bottom sheet's drag handle no longer shows a blue line when it has the focus.
- 6eaa1ac: Blog posts have a Hidden switch in Post settings: the post stays out of the blog and lists, but opens at its address and stays in Google
- f405af1: A label can now be set on any line of text in the page editor, not only above a heading.
- a32c17d: Selecting rows in a list shows a checkbox in the row, as Material 3 prints it, and a tap on a row's icon or image starts the selection.
- 75b3f14: The icon and arrow of a list row have the same colour as its heading.
- e0d7307: In a List typed in the text, the row's icon opens the icon picker, the settings sheet is called List settings, the row's toolbar has a Link action and its own Add above and Add below buttons, the active list has an Add list row button under it, the empty row only shows while the list has no rows, and the active row has a dotted line round it instead of a colour.
- 23d55a2: The text toolbar has a List button, apart from Text style: Bulleted list, Check list and Numbered list.
- eec22d6: Menu items have 4 dp corners, with 12 dp on the first and last item and on the selected item, as Material 3 prints.
- 9731b96: `morpheme migrate` writes a label in its former class (block-eyebrow) as label-medium, so check:editor passes.
- 17dbfb0: Adds `morpheme migrate`, which writes pages that still use blocks from before 0.17 (Points with icon, Links, Checklist, Expandable list, Banner) in the form the editor saves, and lets `check:editor` pass on such pages with a note to run it.
- 5e3cf75: Remove the old `card` name of a release note paragraph from the notes code.
- 17dbfb0: A form section with no field to show, such as a post's empty Post settings, is no longer offered.
- 16d7a9f: The start screen's update card counts features and improvements apart, such as "12 features, 30 improvements", instead of one number.
- 956283e: The Notice block is drawn with the theme's filled Card, with the Card's 16 dp padding.
- 52623b9: Type a Notice's text and a Video's title right in the page, as the site shows them.
- f608c50: Notice, Banner image, Video and Table take their corners from the Card, and the questions and answers box has 16 dp corners, as Material 3 prints for an expanding list.
- 23a5375: Texts that are joined onto one line no longer use a slow regular expression.
- 7a274a6: The text's toolbar is one bar of 44 dp buttons with the tools of the text, of a block or of an image you tapped, then Undo, Redo and Insert block, and what does not fit on a phone in a ⋮ menu; the floating row over the selection, the pop-up row on a card, the second line with its arrow, the 700 ms wait and the More sheet are gone, and headings and text styles are one Text style menu.
- 6660e2a: The other fields of a page or post sit under Page settings, and Earlier versions is now History
- 2b47ec5: A page's title at the top of its text is drawn in the editor as the site draws it.
- df5472c: Plainer words in the editor: Main heading, Original page, Company registration number, Changing to this theme and a clearer hint for an image’s alt text, and clearer Draft and Published hints
- a671209: The list of blog posts is drawn with the theme's list and a leading image: thumbnails have 8 dp corners and each row has 16 dp of space at the sides, as Material 3 prints.
- 9d9857a: Preview opens for a draft page
- bee3ef6: The Preview of a page now draws its blocks and links the way the site does, so tables, cards and lists look the same as on the live page.
- 6a5f39c: Price cards are typed in place: each card looks as on your site and you type its name, price, text, points and button label where they stand.
- 39aee70: Settings › Developer › Caching and builds now names its switches by what they do: R2 caching, Content-only builds and Workers Paid plan, each with a short line under it
- f3653ff: Redirects and the entries of the site's own lists can be selected and deleted several at once.
- 6ae3c05: The page and post form has the buttons Save draft and Publish
- 01d4440: The English texts of the editor and the demo say image everywhere.
- c2347dd: Make `check:screens` read the 0.16 edition photo from the installed package, so a site that installs the package can run it.
- 968b107: A section's colour runs all the way down to the next section, with no white band, in the editor, in Preview and on the site.
- 6e80b5a: Filled cards and other container parts in a section on a colour use that colour's Material container and its text colour, so their text is readable.
- 20b18ec: Quieter text in a section on a colour is the section's full text colour, so it is readable.
- 2e7f724: Section settings is the first tool in the text toolbar anywhere in a section, not only in its heading, and 48 dp high, so it is reachable on a phone.
- 6adb6cb: The Section settings tool draws its own icon instead of a backup one.
- 03babc2: Surfaces in a section on a colour are a lighter veil of its text colour, so text on them is readable.
- 2d0828a: The outer corners of a segmented list are 16 dp, as Material 3 prints.
- ecdd049: The floating text menu keeps its button groups whole and fills both rows when it needs two.
- dd49f9f: The SEO rating also checks the alt text of images behind a section and of images in the text of blocks.
- abf0d6a: Lift the editor's bottom sheets above the on-screen keyboard.
- 76bb806: The choices in the editor's bottom sheets (sort, filters, pages, countries, section colours) are drawn as the theme's list items, and a test fails when a sheet draws a row of its own.
- 87f76aa: Bottom sheets in the editor start at half the screen's height at most on a phone, scroll inside and are dragged up to be taller, as Material 3 says.
- adb2ab9: The start screen's top bar says only the time the site was updated today, or only the date on an earlier day, so it no longer gets cut off on a phone.
- 8f3d50c: The site's side margins follow Material 3: 16 px on a phone and 24 px from 600 px up, with wide blocks lining up with the text.
- 70dd94d: Keep the index signature on `blockTexts`, so a site that reads `blockTexts.offer`, `.prices` and the other block texts type-checks again.
- e1724ac: The space above and below a block's heading, and the gap in a check list, are on the 4 dp grid.
- 17dbfb0: Stop a new site's Prettier check from failing after an app is installed.
- 400a3dc: Steps are typed in place in the text: each step's heading and text are typed where they stand, with no sheet.
- f953be5: Table: a Striped rows switch in the block's settings, and the header's corners follow the table's rounded border when typed in place.
- 778bd79: The switch shows Material's focus and pressed state layers around its handle, and its icon is on-primary-container when on
- 36f6528: Table: a new block with cells typed in place, rows and columns added from the toolbar, and a header row you can turn off.
- 287398a: A Table aligns a column of numbers to the right by itself, and the toolbar can align the column of the active cell left, centre or right.
- 98bb231: On a phone, tapping below a section or between two sections puts the cursor on a free line there, so you can write after a section.
- 1d591ec: Testimonials in a carousel sit 8 dp apart, as Material 3 prints for carousels.
- 92ba4ed: Testimonials get a Layout setting, Cards or List: existing blocks open as Cards (a List stays a List), with the same testimonials.
- b159413: Paragraphs and smaller headings can be aligned left, center or right, and the List button shows the bullet list icon.
- e5def81: Paragraphs and titles in a text keep their space on Material 3's 4 dp grid: 16 px under a paragraph, 24 px under a lead and 32 px above and 12 px below a small title.
- 4757035: The text styles are Heading, Subheading, Body large, Body medium, Body small, Label and Quote, with the biggest first, and the body styles have the icons A1, A2 and A3.
- 17dbfb0: The text editor's toolbar sits on top of the editor instead of floating over the text.
- b2ff557: The text toolbar uses Material 3 spacing inside, so one more tool fits on a phone.
- 5ecf227: The text toolbar's top border is drawn with the box's own line
- 0dc7d90: On a phone or tablet, a button no longer stays in its pointed-at look after a tap.
- f93cd30: On a phone, touching a row or file with a second finger while the first rests on it selects it at once, like a press and hold.
- 3da8d65: Selecting several pages, posts or notifications also works with the keyboard: Space selects, Shift adds a range, Ctrl+A selects all and Escape unselects.
- 2374e34: The X icon is the official X logo.

## 0.16.0

### Minor Changes

- 1185af0: Assistants such as Claude can connect to the site and read its pages, posts and app settings: Settings › Assistants gives the address to add and lists the connected assistants, each with Disconnect
- cfb69ea: A connector can sign in to its service and fill a setting from the service's own list, and its Appstore page shows the address it connects to and the tools it uses before you install it
- 74c29eb: Contract 5 for apps: the `role` and `mcp` keys in app.json, roles in the store's rule, and plugin limits in the build
- 0d8f455: A connector can now connect the site to a service's MCP server and fill a setting from the service, with the sign-in kept safely on the server
- 046d306: The Appstore has three sections: Themes, Connectors and Plugins.

### Patch Changes

- 016b5d8: Assistants find the right tool: each tool says what it returns and which tool to use for the rest, and the server tells which tool answers which question
- a6ee66d: Claude can connect to the site with its published identity (the default when adding a connector)
- bffd183: Connecting an assistant no longer ends on "This sign-in can't be finished" after signing in to GitHub.
- 65cb7a8: Connecting an assistant: the consent page no longer blocks the redirect back to the assistant, and each sign-in step is logged without secrets
- a0d0ecd: Claude.ai now sees the full lists and details from the site's MCP tools, not just a short summary
- aad60e9: The "New in" card on the start screen keeps its photo inside the card on a narrow window, so it no longer covers the widgets under it

## 0.15.1

### Patch Changes

- d14a612: `check:content` no longer reports an app's own Danish texts as missing standard texts when the app translates them to English words the standard parts also use
- b4f8345: The start screen's update card also shows at the first visit in a browser, so a site that jumps over versions still shows what it updated to.

## 0.15.0

### Minor Changes

- 5812ce6: Apps can describe themselves in app.json, and their build code runs in a sandbox: an app's page shows where it runs and what went wrong in the last build
- 238db17: Add three widgets to the start screen: Unfinished, Blog rhythm (with a setting for how often a post is due) and Site status
- 5dfcf00: Edit the start screen's dashboard: add, remove, reorder and set up widgets, saved per person in the site's Worker
- bb054b2: Show the start screen as a grid of widgets, loaded from the dashboard each person keeps in the site's Worker, and let apps add widgets
- 6185aa8: The editor's own code-only names are English: the placeholders of the standard messages, three browser-storage keys, the old app store address and the "Expandable list" text's placeholder (now `{topic}`; a text saved with the old one still works). The sort and filter you last used in the page and item pickers are reset once.
- 27551e3: The consent log's download is named `consents-<date>.csv`, and an icon pack's licence page is at `licenses/icons/<id>`
  (the old editor address still opens it)
- 2bf473f: Rename the new versions of pages from /ny/ to /new/ (route `/new/`, folder `src/content/pages/new/`); the Worker sends the old address on with a 301, query string and #part kept, a page file still under `ny/` is read at its new address with a warning from `check:content`, and scripts/retarget-links.mjs rewrites a site's own links to it
- cdc850e: Move a tag's page on the blog to /blog/tags/<tag>/; the Worker sends the old address on with a 301, query string kept, and scripts/retarget-links.mjs rewrites a site's own links to it
- 6c3feca: An app's screenshot keywords are now English: `block:<type>`, `kind:<list>:<n>`, `list:<id>`, `settings` and `page`; the old words still work for one release
- 78d75f8: Make the files folder, the testimonials page address and the contact page anchor site settings with English defaults (public/files, /testimonials/, directions); a site that sets none and still has the old Danish names keeps them
- 0a83c9d: The starter is English; `npx morpheme locale da-DK` makes it Danish.
- ad36199: The site's colors are now exactly Material 3's color roles, each named as Material names it (`primary`, `on-surface`, `surface-container-high`, plus the fixed roles, `scrim` and `shadow`), and the editor's page is on Surface like the site. A site's `colors.json` in the old names is read as the new roles and written in the new names on the next save in the editor; a theme or custom CSS must use the new names (`--bg`, `--surface` as the cards, `--tint`, `--ink`, `--muted`, `--line`, `--accent*` and `--accent-hover` are gone).
- b1d832c: The theme's shared CSS variables now start with `--mo-`: the color roles (`--mo-primary`, `--mo-on-surface`, …), the corner steps and state layers (`--md-shape-medium` is `--mo-shape-medium`), and each elevation level has a color and a shadow (`--mo-elevation-2-color`, `--mo-elevation-2-shadow`, replacing `--elevation-2-surface` and `--elevation-2`). A theme or custom CSS that sets or reads the old names must use the new ones; `colors.json` keeps its keys.
- b7a12ac: A page's title, status and template are now under Page settings at the top of the form, and the page's title and its H1 stay the same as you type either one.
- c2b6345: A page-colors hook gets a new helper, `contentColors(picture, choice)`: the site's build makes the colors from one of the page's pictures (Material's content-based color), so an app's hook no longer runs the color engine in its sandbox, where a photograph took longer than the hook's 1000 ms. A sandboxed hook's `pixels` helper now reads only the page's own pictures.
- e532535: The Appstore's category filter now lists 13 categories, from Analytics to Social, and apps and themes can have a subcategory.
- d010fc7: Colors now uses Material 3's names (Primary, On surface, Surface container …) and has Material's three surfaces, Surface dim, Surface and Surface bright; new colors put the page's background on Surface bright.

### Patch Changes

- 8b0c170: Run the page colours hook and the after-build step of apps with an app.json in the build sandbox, and list what goes wrong instead of failing the build
- b135aba: Add the parts of the app sandbox: app.json checks, sandboxed app code in QuickJS, and the build's app problems for the editor
- 4611e41: Dashboards are kept in the site's existing NOT_FOUND store, so every site can save one without a new binding.
- b985413: The theme checks build into a folder inside the project, so they also work when the system temp folder is on another drive
- ed6e436: The release notes on the Morpheme page and the start screen are rewritten in plainer words, in English and Danish.
- 8bc97f9: A site's `colors.json` in the names from before Material 3's roles (`bg`, `ink`, `accent` …) is read as the new roles, on the editor's Colors screen, in the build and in the content check, and the editor writes the new names on the next save. A theme or custom CSS still has to use the new variable names.
- 12918dd: The release note for the edition photo says only what is new in this version: the photo and the place, not how the start screen card works.
- aa478c9: After an update, the start screen shows a small card with the edition's photo and name instead of the large list of news.
- 8e8c49a: Write the comments and build messages in `site/` and `lib/` in English.
- 75f6672: On a phone, the text toolbar shows a heading button and a text button side by side, a new page tells you its first heading becomes the H1, and every button that opens a menu has an arrow down.
- 1f2e59f: The new-edition card on the start screen has the shadow of Material 3's elevated card.
- b33b12d: The earlier versions 0.2 to 0.13 each have an edition with its own nature photo on the Morpheme page.
- d69e244: Three older release notes (0.10.0, 0.10.1 and 0.13.0) no longer repeat what an earlier version had already introduced.
- 44dd171: The Morpheme page shows friendly release notes in English and Danish for versions 0.2.0 to 0.13.0, instead of their developer changelog.
- 64f0cd4: Activating an app of a type that allows one active app now deactivates the other app of that type, after a warning.
- 4952516: Version 0.15 is the Passo Giau edition, with a photo of the Dolomites by Sarmat Batagov.
- 5e8ff10: Write the editor's source comments in English and pick the vague link texts by the site's language
- b6c141c: Write the theme, the Worker, the check scripts and the docs in English, with Danish by locale for what the Worker says
- 368b14f: `quickjs-emscripten` is a new required peer dependency, so a site that updates the package must run `npm install` to get it.
- 2d1326e: The Worker gets the route /api/dashboard, which keeps each person's start screen dashboard in its NOT_FOUND store.
- 416efe5: A site with `releasePosts` in its config posts each new release of the CMS on its blog, minutes after it is released: the release notes in the site's language, their screenshots and the edition's photo, in one commit by the site's Worker.
- 9be773f: The release notes for this version are shorter: overlapping lines are merged into one each.
- 5dcede5: check:themes and check:screens now also work with a pre-release (next) build of the CMS installed.
- fe128aa: A site that is still on postcss-selector-parser 6 can update to 0.15 with the Update button: the peer dependency now accepts both 6 and 7.
- ac64be2: Appearance, Developer, Licenses, Morpheme and Privacy are now under Settings, opened by the cog at the bottom of the menu
- bd67cb4: The checks the package ships (`check:themes` and the like) now run from an installed copy
- 8b7e313: The buttons under Notifications are now Clear and Settings.
- 9d3b080: The new-edition card on the start screen is now an elevated card.
- 15a1d93: A page's or post's status is a narrow menu above the title, and a page's template is chosen on cards with an icon and a name, four to a row: One column, Wide, Left side panel and Right side panel. Menus follow Material 3's vertical menu: the low surface container with large corners and a shadow, 44px items, and the chosen one in the tertiary container.
- edbfd39: `morpheme check:themes` reports a missing Update request on the Morpheme page as a normal problem line instead of crashing, and waits longer for it on a slow computer.
- 36af66d: A page's template is always chosen on cards: the side-panel ones are greyed, with a link to choose a block for the side column, while no block is chosen there.
- 01b49c2: The heading and text-style buttons in the text toolbar on a phone sit close together, like the other tools.
- 0ce669d: Updates the packages a site installs with the CMS to their latest versions, including jsdom 31, postcss-selector-parser 7 and TypeScript 7 for the starter.
- b1e7393: The Morpheme page names each version after its edition, with its date and photo, and a test version shows the changes merged since the last release.
- 8506bf6: Arrows at the bottom of the Morpheme page and each earlier version's page lead to the newer and the older version.
- 748944e: A site can keep jsdom 29 or move to jsdom 31: the optional peer dependency now accepts both.
- 93f0b45: The menu over selected text has the same heading and text buttons as the toolbar when it's short, each with an arrow that opens a menu of its kinds of text.

## 0.14.2

### Patch Changes

- fc6864a: On a phone, the editor's footer starts at the bottom of a short screen, and you can scroll it up above the add button.
- 13dbbca: Lists follow Material 3's list spec: the label text in body large (16/24, weight 400), also beside a switch, and the editor's rows on Surface over a page in Surface Container.
- 5c21889: The editor of a test version (npm tag `next`, e.g. 0.14.2-next.0) loads again: the release notes it carries no longer compare a test version, which threw and left the page blank.
- 3fbb65f: The start screen's update card shows the new version and its first news, and the Morpheme page shows the release notes as an article.

## 0.14.1

### Patch Changes

- eea5442: On a phone, the back gesture in the open menu goes to the screen before and closes the menu, instead of going up one level in the menu.
- ee45cf2: Show the release notes of the running version from the installed package, not from KV.

## 0.14.0

### Minor Changes

- a70c310: Apps can be turned off without uninstalling them; the app page shows the app's version.
- 26e7adc: The editor footer has links to support, system status, security reports, the privacy policy and the licenses, and a copyright line. System status shows whether GitHub and Cloudflare work for your site.
- 4c30155: The Morpheme page shows a friendly note for each change: why, how and what.

### Patch Changes

- da37368: The Enabled switch on an app's page sits right below the app's description.
- dd625db: Editor menu: Advanced is now Developer, with Parts and Caching and builds in it. Parts moved from Appearance; old links still work.
- 5cd4149: Editor menu: "Lists" is now "Dynamic lists", one row that opens the page with all lists (no fold-out).
- 1fe1daa: The text toolbar is no taller than its tools on a phone, and it stays as far from the top of the screen as from the sides while you scroll.
- b47a580: Google preview looks more like Google: a flat result on a phone, no card on a computer, a ringed site icon, https:// in the address, the ⋮ menu, a larger phone title, and the primary keyword in bold in the description.
- 006c78b: The connection to Morpheme moves from the store screens to the Morpheme page under Settings, with the Morpheme logo.
- a4da24e: System status checks only the Cloudflare services your site uses, so a site without R2 or D1 is not marked down by them.

## 0.13.0

### Minor Changes

- 1193da4: The standard parts and their ids are in English. Danish comes from `defaults/i18n/da-DK/`. A site that overrides a standard part by its old id must use the new id. Old editor links and bookmarks still open (they redirect to the new address). The filters and sorts that the editor saved in the browser reset once.
- 10276ee: The header's "Call to action" can show the phone number (from Business › Contact; it calls on a phone and leads to the contact page on larger screens) as a text button before its button, and both share a row at the bottom of the menu; the menu opens from the side its button is on, and no drawer (site or editor) shows a gap at the screen's edge when its spring overshoots. In the editor, the back gesture goes from a section's list to the main menu, Header and Footer are under Appearance, and Business is a section of its own after Blocks and Apps.
- 9ddc437: A list item can be selected with a long press on a phone (`selectable` on the theme's `ListItem`); in the editor's notifications this selects notifications to delete.
- 32b4395: The bell in the editor's top bar opens the notifications in a side sheet over the screen you are on, instead of a screen of their own.
- 774ab69: Social media profiles are a list of links added with the + button; a link to Facebook, X, LinkedIn or Pinterest gets its name and icon from the address, and the share buttons are under their own heading.
- 82d64b7: The start screen has a "Continue where you left off" card with the last three pages and blog posts saved, a notice of what was updated since your last visit (each with a close button), and the licenses link sits in a footer at the bottom of every screen.
- 03ad8a9: Move the theme store from the Appstore to its own screen, Theme store, first under Appearance.

### Patch Changes

- ccefd29: The licence checks know `@app/self` (app contract 3): an app that imports it no longer needs it in `thirdParty`, and
  the site's licence list counts its virtual module as the site's own.
- e9d6b34: The editor's notifications also show when the website updated Morpheme from npm, undid an update or got stuck.
- a283bcc: The drawer's divider stands level with the top bar's line.
- 6fa3043: The store no longer moves old store copies; all sites use permanent ids.
- 9c24224: The text editor's empty-line hint says "Write text here…" again, on a line no taller than the hint.
- 697a7dc: List items follow Material 3's focus layer, corners and hover colours.
- 8fd74d0: Editor menu: Header and Footer come right after Themes under Appearance, and Logo and icon is under Business.
- 3a6157b: New sites get a `.gitattributes` that keeps LF line endings on Windows.
- 3961b6d: The text toolbar no longer scrolls sideways on a phone: the tools that do not fit are on a second row, shown with the arrow at its end.
- 34f69c5: Open website, in the editor's top bar, opens the site in a new window instead of a new tab.

## 0.12.0

### Minor Changes

- 382abd8: An H1 starts a section with its own section colour, as an H2 does.
- 3123242: Store items have permanent ids: installed copies move to their new folder on their next update. Apps get their own id from @app/self (app contract 3).

### Patch Changes

- fd2fedf: From tablet width, tapping a block or picture opens its side panel; Remove is in the panel.
- 1459102: The side panel opens from 840px and collapses the drawer to the rail below 1200px; the modal side sheet is used below 840px; the top bar scrolls with the page.
- 79b6b33: The text toolbar and the menus over the text are white with a shadow.
- 25d29f7: The create button of every list, of Files and of Redirects is a floating action button instead of a + in the top bar; a list of several kinds opens a menu of them. The FAB stands above a form's save bar.
- d39abb5: The side panel follows Material 3: at most 400dp wide, full height, M3 spacing.
- ee4fbba: Preview and View on site stand at the end of the page's title row on wide screens.
- aa964b2: The package's checks now type-check its whole source the way a site does, so type errors a site would hit are caught before release.
- ca51ab8: Fix the store's installed filter for apps with an old id.
- 6b95110: Fix type errors that sites hit in the text editor.
- abef25a: Sites type-check the video block: the types of `player` and `facadeOf` make `frame` optional, as the block calls them.

## 0.11.0

### Minor Changes

- 999d21e: Save notices name the version: app installs, and an app's settings through `changedTo`.

### Patch Changes

- 5a64119: Sites type-check again: the block side sheet's save button narrows to the fields step before it reads the block's type, so `BlockDialog.tsx` no longer fails `tsc` in a site.
- 4d4d32a: Sites type-check again: the types of `searchedAs` and `pageTitle` make every input optional except `site`, so the share preview no longer fails `tsc` in a site.

## 0.10.1

### Patch Changes

- 4d17412: The top bar shows an Open website link on the start screen instead of the account icon; the account is in the main drawer's header.

## 0.10.0

### Minor Changes

- 999142f: The action bar at the bottom of a phone's screen is a standard bottom sheet, on the site and in the editor.
- 50d360d: The fields of a block and the section settings open in a side sheet: over the page on a phone, beside it on a tablet and a computer.
- 358c778: The page and post forms show a Google result preview for phone and computer; the shared-link card keeps its shared width.
- 40b5fe3: Themes can open a side sheet on the site: a button with data-side-sheet-open opens the side sheet with that id.
- f501efb: Mark the parts the theme leaves to Material on Parts › UI components.

### Patch Changes

- 22d5764: The editor check no longer fails every page on Linux builds after the page template choice.
- 6dc373f: The text editor's empty-line hint follows the editor's language and says that the first heading is an H1.
- 1478765: On a page, the heading menus offer only H1 until the text has one, then H2 and H3.
- 64f9da7: Sites type-check again: `searchedAs` and `pageTitle` take `front` as optional (default `false`), so the SEO form and the share preview no longer fail `tsc` in a site.

## 0.9.1

### Patch Changes

- 2e5bc1d: Sites type-check again: the header settings screen passes its theme the right data.

## 0.9.0

### Minor Changes

- 34d7f2f: An installed app's page has the tabs Settings and Information.
- a5f16e1: Show block and section settings in a side panel on large screens.
- 995f08e: Buttons and icon buttons show the M3 loading indicator while their action runs.
- 9b1d632: An optional `src/data/header.json` adds a header action button (in place of the phone icon on larger screens) and sets the menu button's side; the new Appearance › Header and Appearance › Footer screens edit all header and footer settings with a live preview on a phone and a computer.
- facf878: A page chooses a template from the ones its theme offers (`template` in the front matter, "templates" in theme.json: single, full, sidebar-left, sidebar-right). The page flags `wide` and `side` are gone. A site must migrate its `wide: true` pages (for example to `template: single`) and may remove `side: false`.

### Patch Changes

- 09924d5: Install, update and uninstall buttons show the loading indicator while they run.
- 3a40970: The Save and "More versions" buttons use the busy button with the loading indicator.
- e1a9843: Media, redirect, restore, theme and move buttons show the loading indicator while they run.
- 46636dc: Buttons in the editor are as wide as their label on every screen (Material 3), never across the screen.
- c22e682: Cards side by side or under each other keep 8dp between them, set by the new token `--card-gap`.
- 9047684: Cards in the Cards block rise to the first elevation when pointed at, as Material 3's filled cards do.
- 22d9179: Cards have 16dp of room inside them, as Material 3 has, and a card's picture follows that room.
- a9e9e95: Cards that link are tinted when pointed at or focused, as in Material 3, and no longer get an accent outline.
- 35e53d0: The editor's Appstore and the cookie consent log no longer hang when an earlier request was cancelled.
- 13998ad: Show the row that deletes what a screen shows (Delete promotion, Delete page …) in the theme's error colour.
- 5c4fa60: Show the signed-in user and the site's domain at the top of the main drawer.
- bb36d48: The main drawer's account row is a pill like the drawer items, with a 1px border on the avatar, centred over the item icons.
- 1ab26e9: Show the main drawer's back row in its header row, instead of the account row, on a section's list.
- fc064fe: Align the main drawer header with the drawer's icons and arrows.
- 2c6ee27: Show a divider under the main drawer's header row.
- 152fb04: Make the main drawer's header row as high as a drawer item.
- 7d1f31b: The text toolbar has round corners and room all round it, also while it sticks under the top bar.
- c19ddf7: On a phone, hide the top bar's side panel button on screens that show a back arrow.
- 5db8ddc: Give every list item headline Material 3's label text size and weight.
- efbac0c: Lists in a page's dotted section frame keep their indent, so the bullets stand clear of the line.
- 86b0867: The "on this page" card on large screens is as wide as the navigation drawer.
- 5005d1f: Replace the section colour menu with a section settings sheet.
- eeb55b6: The template single draws its blocks across the column again and shows its first paragraph as a lead; the new `--type-lead-*` tokens (default: title large) let a theme style every lead.
- 46b7672: The Appstore no longer waits for ever when the store does not answer. After 15 seconds it says "Can't reach the store. Try again in 10 minutes."
- 0210960: The update message stays while an update is saved.

## 0.8.0

### Minor Changes

- b201ffd: Material is now every theme's fallback: a theme imports `@morphemecms/cms/theme/styles/global.css`, anything it does not style is Material's, and its own rules always win.
- 3c68cc9: Richer blog post page: author role, tags and share buttons in the header, a lead paragraph, and related-post cards; new Company › Social media settings.

### Patch Changes

- 0358c3e: Show a page or post form's sections as an "on this page" list on a card at the end of the form, on large screens, and keep the editor's content column centred on the window.
- 1323fa8: Wide buttons fill the width only on phones; the save bar's buttons sit at the end on larger screens.

## 0.7.1

### Patch Changes

- 36e2e3b: Fix the Cloudflare build stopping with "Too many open files" by serving all Material Symbols icons as one module.

## 0.7.0

### Minor Changes

- e15a802: Bring the editor up to date with morpheme-website's copy: the navigation rail and two-level main menu, and the other editor changes made there since 3 November.

## 0.6.0

### Minor Changes

- 3723ec1: The front page no longer forces a Banner. A Banner there is an ordinary block: it can be moved, hidden or removed. An app block can be the top of the front page instead.

### Patch Changes

- f0080db: `morpheme check:content` reads a site's files with `/` in their paths on Windows too, so it finds the standard pages there.

## 0.5.0

### Minor Changes

- 322a404: Connect a site to the Morpheme store from the editor's Appstore. A key set by hand in MORPHEME_STORE_KEY still works.

### Patch Changes

- eb1f36f: A site's build reads Phosphor's icons one at a time, so it passes on Cloudflare's build image, which allows 1024 open files.
- 6844676: The editor's start screen shows the installed CMS version before the update time, e.g. "Morpheme 0.5.0 · Updated 19.26". A pre-release shows short ("0.5.0-next"); a click shows the full version.
- 2fa2bb3: New sites install a fixed postcss-selector-parser (6.1.5) under @tailwindcss/typography, which closes CVE-2026-104844.
- f343523: The package has the types of the theme's `editor/looks.mjs`, so a site's type check (`tsc`) passes again.

## 0.4.0

### Minor Changes

- cf46cb1: An app's block and pop-up name their view module `viewOf.ts` (it was `view.ts`), so it no longer collides with `View.tsx` on Windows.
- 1fcbd56: The site updates Morpheme by itself: a new minor or patch version on npm is installed within the hour and undone when the site cannot be built. See Settings › Morpheme.

### Patch Changes

- dd9ab22: Settings › Morpheme says when the site has no KV storage (PUSH), and no longer fails to open when the site runs a pre-release of Morpheme.
- cf9f144: Keep the line breaks of a file's front matter (CRLF or LF) when the editor writes it back.
- 6cb2c17: `check:worker` passes when the site runs a pre-release of Morpheme (as the staging site does).
- 682da97: New sites from the starter can reach the Morpheme store on the same Cloudflare account, and Prettier skips store theme files.

## 0.3.0

### Minor Changes

- 07db64b: A site can show one block in a column beside the text of its pages: a block says it can with `beside: true` in its `load.ts`, the owner picks it under Appearance › Side column (`src/data/side.json`), and a page can turn it off (`side: false`); each block now gives its own front-page lead in a `lead.ts`; `defineSite` takes `logo` for the structured data; and the icon packs have calendar-x, identification-card, money, receipt and wallet.

## 0.2.0

### Minor Changes

- 545e832: Themes and apps are installed from the Morpheme store, through the site's Worker (`/api/store/`); set the secret `MORPHEME_STORE_KEY` to connect a site. `store` in `src/site/config.ts` is gone, and a store theme may import CSS only from `@morphemecms/cms` and its own files.
- 9dbb555: Builds on Windows: the theme's helpers `ui/dialog.ts`, `ui/bottomSheet.ts` and `ui/sideSheet.ts` are now `ui/dialogControl.ts`, `ui/bottomSheetControl.ts` and `ui/sideSheetControl.ts` (app API 2, theme API 3), the editor's screen data modules are `*Data.ts`, `worker/apps.js` with CRLF line endings passes the content check, and the check stops two files whose names differ only by case.

### Patch Changes

- 13d68c5: The package now includes its CHANGELOG.md, so a site can read what each version changed.
