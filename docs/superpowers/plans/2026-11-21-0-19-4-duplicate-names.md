# 0.19.4 batch 2: every duplicate name the name walk finds

Status: **measured 21 November 2026**, for the owner, on the 0.19.4 Names batch (branch `a11y/0.19.4-names`, into `feature/0.19.4-screen-readers`).
Plan: `2026-11-21-0-19-4-screen-readers.md` (batch 2, *Names*).

## How it was measured

The name walk's own rule (`scripts/announce.mjs`, problem `repeated-name`): two interactive controls of **one role with one accessible name** under the
**same nearest list-like container** (list, listbox, menu, table, grid, tree, toolbar, group, radiogroup, tablist, feed; else the page) are not told apart. A
control inside a *differently named group* is a different control by that rule ("no other difference", as the plan states it). Textboxes and search boxes are left
out, as in the check.

- **Before:** the base of this branch, `45def02` (`feature/0.19.4-screen-readers`, batch 1). **After:** the tip of this branch.
- The same walk on both, over the screens `check:announce` opens (the 13 starting places and the links two steps from them), at 1280 px (computer) and 390 px
  (phone). Names are read in `en-US` here (the check runs `da-DK`; the selectors and counts are the same).
- A *place* is a screen (hash); a count is how many controls share the name in one container. `group` is the nearest list-like container: `none` is the page
  itself, `list` is a list that holds all of them with nothing between them.
- `check:announce` on this branch has no `repeated-name`, `bad-name`, `no-name` or `unnamed-container` entry left on its allowlist except the 7 for
  the typography and prose fixtures (demo content, which batch 2 does not change). It had 48 such entries, 37 of them `repeated-name`.

Totals (rows are one name in one container on one screen at one width):

| | Rows before | Rows after |
| --- | ---: | ---: |
| Real screens | 262 | 2 (the typography fixture's `link words here` ×5, at both widths; demo content, no longer walked once the CTO's change is in) |
| The component gallery (Developer › Parts) | 170 | 0 |
| **All** | **432** | **2** |

## Real screens (in full)

All 29 findings (distinct name and control on one or more screens) are **fixed**, except the one marked *no longer walked*. *What tells them apart today* is "nothing" for each: no row text, no group.

| Screen (hash) | Container (selector) | Role | Repeated name | Times | Told apart today by | Source | Status |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| `#` (start) | `a.mo-button.mo-is-filled` | link | Read more | 2 | nothing (two notices, one name) | `src/BlockedUpdateNotice.tsx`, `src/UpdatesNotice.tsx` | fixed: `Read more: <notice title>` |
| `#global/header` | `button.mo-icon-button` (row actions) | button | Move up / Move down | 4 each | nothing (`list`) | `src/fields.tsx`, `src/MoveButtons.tsx` | fixed: `Move <row> up`, `Move <row> down` |
| `#list/highlights`, `#list/testimonials` | `button.mo-icon-button` | button | Move up / Move down | 3 each | nothing (`list`) | `src/fields.tsx`, `src/MoveButtons.tsx` | fixed: named by the row |
| `#blocks/buttons`, `#src/data/popups/booking-bar.json` | `button.mo-icon-button` | button | Move up / Move down / Remove | 2 each | nothing (`list`) | `src/fields.tsx` (FoldList rows) | fixed: `Remove <row>` and the move names |
| 6 screens (`#appearance`, `#assistants`, `#block-settings`, `#developer/caching`, `#morpheme`, `#privacy`) | `a.mo-editor-screen-crumb` | link | Settings | 2 | nothing (breadcrumb and drawer link) | `src/Screen.tsx` | fixed: `Back to Settings` |
| `#company/payment/bank` | `a.mo-editor-screen-crumb` | link | Payment | 2 | nothing | `src/Screen.tsx` | fixed |
| `#seo/redirects/all`, `#seo/redirects/not-found` | `a.mo-editor-screen-crumb` | link | Redirects | 2 | nothing | `src/Screen.tsx` | fixed |
| 17 screens `#morpheme/0.2` … `#morpheme/0.18` | `a.mo-editor-screen-crumb` | link | Morpheme | 2 | nothing | `src/Screen.tsx` | fixed |
| 162 screens `#licenses/<package>` | `a.mo-editor-footer-link` | link | Licenses | 2 | nothing (footer link and breadcrumb) | `src/Screen.tsx`, `src/FooterLinks.tsx` | fixed (the breadcrumb is `Back to Licenses`; the footer `nav` is named `Footer`) |
| 9 posts (`#src/content/blog/*.md`) | `button.mo-button.mo-is-tonal` | button | Change image | 2 | nothing (the picture button and the Change image button) | `src/fields.tsx` (HeadImage) | fixed: the picture button is `aria-hidden` and out of the tab order; Change image stays |
| `#src/content/pages/typography.md` | `button.mo-site-block-card-button` / `button.mo-site-block-handle` | button | HTML code / Drag HTML code to move it | 35 each | nothing | `src/MarkdownEditor.tsx` | fixed: `HTML code 2 of 35`, `Drag HTML code 2 of 35 to move it` |
| `#src/content/pages/prose-fixture.md` | same | button | HTML code / Drag HTML code to move it | 6 each | nothing | `src/MarkdownEditor.tsx` | fixed: numbered |
| `#src/content/pages/blocks-lists.md` | `button.mo-site-block-handle` | button | Drag List to move it (12), Drag List - Expand to move it (13), Drag Dynamic list - expand to move it (2) | 12 / 13 / 2 | nothing | `src/MarkdownEditor.tsx` | fixed: numbered |
| `#src/content/pages/blocks-cards.md` | same | button | Drag Cards to move it | 7 | nothing | `src/MarkdownEditor.tsx` | fixed |
| `#src/content/pages/blocks-blog-posts.md` | same | button | Drag Blog posts to move it | 4 | nothing | `src/MarkdownEditor.tsx` | fixed |
| `#src/content/pages/blocks-image-grid.md` | same | button | Drag Image grid to move it | 3 | nothing | `src/MarkdownEditor.tsx` | fixed |
| `#src/content/pages/blocks.md`, `blocks-buttons.md`, `blocks-tables.md`, `blocks-testimonials.md` | same | button | Drag List / Buttons / Table / Testimonials to move it | 2 each | nothing | `src/MarkdownEditor.tsx` | fixed |
| `#src/content/pages/typography.md` | `div[role=textbox] > h3 > a` | link | link words here | 5 | nothing (identical link text in the fixture) | `demo/src/content/pages/typography.md` | **no longer walked** (demo content: the CTO's change stops the name walk from walking pages and posts; batch 2 changes no demo content, the entry stays until that change removes it) |

Also on real screens (not `repeated-name`, so not in the table above, but on the same allowlist): `bad-name` for 8 selectors (image tiles named by a file name,
rows under *Used on* named by a file name or path, the typography links named `link`) and `no-name` for the inline notice, and `unnamed-container` for the footer
`nav`. All are fixed, except the 7 entries of the typography and prose fixtures (links named `link` in demo content), which are *no longer walked* once the CTO's change is in and stay on the allowlist until then: files read `Image “saturn.webp”`; an entry with no name reads `Item “<path>”`; the notice is named by its text; the footer is `Footer`.

## The component gallery (grouped by part; counts, not rows)

The gallery shows many examples of one part with one label on purpose (a `Cancel` in every dialog, `Disabled` on every button kind). 36 part-groups, 170 rows,
**all fixed**: each part is a group named by its heading (`src/PartsShown.tsx`), and where one part repeats a name inside itself, each example (row, item or
control) is a group named by its caption or `Example n` (`Example` and `named` in `src/PartsShown.tsx`, used in the `*Parts.tsx` files). *Told apart today by:*
nothing for all of them (the toggle rows of Button and IconButton and the picker, field and slider groups had a group, but not between their own repeats).

| Screen | Part | Names repeated (role: name ×times; first four) | Source | Status |
| --- | --- | --- | --- | --- |
| `#developer/parts/ui` | Button | button: Extra small ×4, Small ×4, Medium ×5, Large ×5 (+5 more names, 9 in all) | `src/BlockParts.tsx` | fixed: rows named (Kinds, Sizes, States), items grouped |
| | IconButton | button: Filled ×3, Tonal ×3, Outlined ×3 | `src/BlockParts.tsx` | fixed |
| | Chip | button: Filter ×3, Input ×2, Selected ×3 | `src/BlockParts.tsx` | fixed |
| | Card | button: Save ×10, Learn more ×3 | `src/BlockParts.tsx` | fixed: each card is a group named by its kind |
| | Checkbox | checkbox: Statistics ×3 and with its hint ×2 | `src/BlockParts.tsx` | fixed |
| | List | radio: Radio button ×2 | `src/BlockParts.tsx` | fixed (visible: the two samples read `Radio button, On` and `Radio button, Off`) |
| | SplitButton | button: More ways to book ×11, Elevated ×2 | `src/ActionParts.tsx` | fixed |
| | FabMenu | button: Contact ×7, Close ×10 | `src/ActionParts.tsx` | fixed |
| | Dialog | button: Cancel ×5, Accept ×2 | `src/ContainmentParts.tsx` | fixed: each example is a group named by its caption |
| | Carousel | button: Show card 1 … 5 ×2, Show image 1 … 6 ×4 (11 names) | `src/ContainmentParts.tsx` | fixed |
| | BottomSheet | button: Expand or collapse the sheet ×6 (phone) | `src/ContainmentParts.tsx` | fixed |
| | Fab | button: Primary, Secondary, Tertiary, Primary container … ×2, Book a time ×9 (7 names) | `src/NavigationParts.tsx` | fixed |
| | TopAppBar | button: Profile ×9, Open menu ×3, Back ×11 | `src/NavigationParts.tsx` | fixed: each bar is a group |
| | DropdownMenu | button: More actions ×4 | `src/NavigationParts.tsx` | fixed |
| | ExposedDropdownMenu | combobox: Treatment ×5 (outlined and filled) | `src/NavigationParts.tsx` | fixed |
| | Search | button: Search the website ×4 | `src/NavigationRestParts.tsx` | fixed |
| | Toolbar | button: Write ×7 | `src/NavigationRestParts.tsx` | fixed |
| | NavigationRail | button: Change width ×6 | `src/NavigationRestParts.tsx` | fixed |
| | SideSheet | button: Apply ×3 (and Close, Cancel) | `src/SelectionParts.tsx` | fixed: the three sheets are groups named by their kind |
| | Switch | switch: Newsletter ×4, with its hint ×2 | `src/SelectionParts.tsx` | fixed |
| | Slider | slider: Volume ×2, Balance ×2, Brightness: Large ×2 | `src/SelectionParts.tsx` | fixed |
| | Snackbar | button: Undo ×2 (and Close ×3) | `src/CommunicationParts.tsx` | fixed |
| | Tooltip | button: Cancellation ×2 | `src/CommunicationParts.tsx` | fixed |
| | DatePicker | button: Select date ×3 | `theme/ui/DatePicker.tsx`, `src/PickerParts.tsx` | fixed: the button is named by its field (`Select date: Date`) |
| | TimePicker | button: Select time ×3 | `theme/ui/TimePicker.tsx`, `src/PickerParts.tsx` | fixed |
| `#developer/parts/editor` | EditorFooter | link: Support ×2, System status ×2, Report security issues ×2, Privacy policy ×2 (the gallery's footer and the page's own) | `src/PartsShown.tsx` | fixed (the part is a group) |
| | FoldList, FoldItem | button: Move up ×2, Move down ×2, Remove ×2 | `src/Parts.tsx` | fixed: named by the row |
| | MainDrawer … MenuButton | button: Open the menu ×2, Close the menu ×2 | `src/MainDrawerParts.tsx` | fixed |
| | MenuRow | button: Automatic R2 location ×2 | `src/Parts.tsx` | fixed |
| | date, datetime | button: Select date ×2 | `theme/ui/DatePicker.tsx` | fixed: named by its field |
| | string, select, relation, FoldSection, SearchRow | e.g. link: Edit the colors ×2, button: Placement ×2, Add tag ×2, Content ×2, Sort ×3, Filter ×3 | `src/PartsShown.tsx` | fixed (the part is a group) |
| `#developer/parts` | (outside a part) | link: Settings ×2 | `src/Screen.tsx` | fixed: `Back to Settings` |

## What stays as it is, and what it costs

- The groups give the gallery's examples names by their own captions where there is one, and `Example n` where there is none. `Example n` is weak: it tells a
  reader the controls are apart, not what each example is. Better captions are a gallery task for a later batch.
- One visible text changed in the gallery, and is the only visible change of this batch: the two list-item radios (`Radio button, On` and `Radio button, Off`),
  and the gallery's sample text link (`link` became `home page`). Batch 2 changes no demo content (`src/content`, `src/data`): the typography and prose fixtures are as they were.
- Not done here, found on the way: nothing else. The allowlist of this branch still holds the entries of other batches (`tab-state` and `broken-reference`:
  batch 3; `no-announcement`: batches 4 to 6).
