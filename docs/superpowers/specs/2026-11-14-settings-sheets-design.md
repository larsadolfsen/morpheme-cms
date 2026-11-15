# Settings open as a subpage or a side sheet (design and build plan, 0.20)

Status: design and build plan, no code. Written against `0.18` (`e89942f`) on 14 Nov 2026 in a brainstorm session and **redrawn the same day
after the owner's decision below** (the first draft used a full-screen sheet on a phone and autosave in the side sheet). The owner's words
below are settled. Two of the design's choices (section 10: **O1**, **O2**) are still **open for the owner**. The rest are proposals the PM
or the owner confirms before the build. The file keeps its name; "settings sheet" in other specs means this pattern.

## 0. What the owner said (14 Nov 2026)

While discussing autosave on every editor screen that needs a Save (the settings screens), as the 0.18 PM relayed it:

1. "I was thinking that these settings pages should move into being MD3 full sheets."
2. "It should be the right pane on large screens instead of full screen." "It should slide. We all ready use the real estate."
3. "In the full screen view show save and cancel. Don't use autosave here." "I feel we need the save button."

**Decision (owner, 14 Nov, after reading Material 3):** full-screen sheets are not a Material 3 component, and bottom sheets are for menus and
supplementary content. So the editor's settings pages do **not** open as a full-screen sheet on a phone. They open as:

- a **subpage with a back arrow** on compact widths (< 600): a screen of its own, the back arrow in the top app bar, `Save` in the **bottom bar**;
- a **side sheet** next to the page on medium and expanded widths (≥ 600), with `Save` and `Cancel`.

The owner wants `Save`, **not autosave**, on these forms. Leaving with unsaved changes (the back arrow, the browser's back, `Cancel`) asks
with the editor's existing **"Keep your changes?"** dialog (`src/ask.tsx`, text `app.unsavedSheetTitle`, `Discard` and `Keep`). The same
pattern is used for a file in Files (built in 0.18 now).

Consequences for other specs (changed in the same pull request):

- `plans/2026-11-14-roadmap-0-18-to-0-24.md`, 0.20: the lines on settings pages say subpage and side sheet.
- `specs/2026-11-14-autosave-everywhere-design.md`: the settings forms (subpage and side sheet) have **no autosave**; section 0's table is
  redrawn. Its decisions 1 (waiting versions in R2 only, never git) and 7 (`Remove field` and `Remove data` wait for the final `Save`) hold.
- `specs/2026-11-14-app-bars-design.md`: a settings form's header is the detail-screen app bar on compact and the side sheet's header on
  medium and wider.
- **Not changed here:** `specs/2026-11-14-one-save-while-writing-design.md` (the block sheet while writing). It still says the theme's
  full-screen dialog on a phone; the PM asks the owner about it separately.

Read for this spec: `src/FormFrame.tsx`, `src/CompanyForm.tsx` (`usePartForm`), `src/DataForm.tsx`, `src/useDataFiles.ts`, `src/HeaderSettings.tsx`,
`src/FooterSettings.tsx`, `src/BrandForm.tsx`, `src/Colors.tsx`, `src/AppFormPage.tsx`, `src/PartFieldPage.tsx`, `src/Library.tsx` (Business,
Settings, Privacy, Appearance screens), `src/App.tsx` (routes), `lib/menu.mjs` (`backFrom`), `src/ask.tsx`, `theme/ui/SideSheet.tsx`,
`src/ui.tsx` (`SideSheet`, `BottomSheet`, `ActionSheet`).

## 1. What Material 3 says (read 14 Nov 2026 with Playwright)

Pages read in full: List-detail (canonical layouts), Side sheets, Bottom sheets and Dialogs (guidelines). Quoted as printed. The token tables
did not open from a script; the measurements quoted are the ones printed as text. The top app bar's own pages are read for the app bars spec.

**List-detail, "Settings + category detail".** Key use cases are listed as "Settings + category detail" (next to "File browser + open folder").
"Compact (0-599): 1 pane"; "Medium (600-839): 1 (recommended) or 2 panes"; "Expanded (840+): 2 panes". Compact: "Use a single-pane layout.
Only one view is visible at a time, either list or detail." "Back button: Appears in detail view only for single-pane layouts." "Use a back
button in single-pane layouts only." "When going from a two- to single-pane layout, the view depends on the product: The detail pane should
typically show in a single-pane layout, and an app bar appears." "Consistency is key: If a layout showed the list view previously, it should
return to that view when returning to a single pane." So on compact the detail is **a view of its own with a back button**, which is the subpage.

**Side sheets.**

- "Use side sheets to provide optional content and actions without interrupting the main content." "Two variants: standard and modal."
  "People can navigate to another region within the sheet." "Side sheets can contain a back icon for navigation."
- "Standard side sheets display content that complements the screen's primary content. They remain visible while people interact with
  primary content." "Modal side sheets are preferred in compact breakpoints, like mobile, due to limited screen size. They can display the
  same kinds of content as standard side sheets, but must be dismissed in order to interact with the underlying content." Example caption:
  "Form controls shown in a side sheet for app settings".
- "Place side sheets along the edge of the screen, usually on the right side." "Modal side sheets on smaller screens can transition to
  standard side sheets at larger screen sizes." "When a standard side sheet opens, the body area shrinks to accommodate the sheet's width
  while maintaining a margin on the body's trailing edge."
- Anatomy, standard: "Divider (optional), Headline, Container, Close icon button"; modal: "Back icon button (optional), Headline,
  Container, Close icon button, Divider (optional), Action buttons (optional), Scrim". "A close icon button is highly recommended."
  "Action buttons (optional): Buttons represent actions available from a side sheet. Examples: Save, Edit, Download." "Use a divider to
  separate: Action buttons from content."
- "Side sheets can vertically scroll independent of the rest of the UI." "Side sheets cannot scroll horizontally."
- Modal measurements: "Start/end padding 24dp", "Bottom actions height 72dp", "Bottom actions top padding 16dp", "Bottom actions bottom
  padding 24dp", "Bottom actions alignment (horizontal) Left", "Max-width 400dp", "Margins (when detached) 16dp"; "Modal side sheets have
  a 16dp corner radius".
- Accessibility: "Material requires that a close affordance, such as a close icon button, is always present within a side sheet." Focus
  order example: "Headline, Close, Cancel, Save". "The accessibility role for a side sheet is Dialog."

**Bottom sheets** (why they are not used for these forms): "Bottom sheets display supplementary content and actions on a mobile screen."
"Use a modal bottom sheet as an alternative to inline menus or simple dialogs on mobile, especially when offering a long list of action items."
"The initial vertical position of modal bottom sheets is capped at 50% of the screen height." A settings form is a task with fields, not
supplementary content or a menu. Bottom sheets stay only for **short choices**: menus, Sort, Filter, Change to.

**Dialogs, the full-screen dialog** (why it is not used): "Full-screen dialogs fill the entire screen, containing actions that require a
series of tasks to complete." "Full-screen dialogs are for compact breakpoints only, like mobile devices." The owner decided not to use it for
settings; it stays for what the block sheet spec decides. What we keep from this page for the discard question: "When someone dismisses a
full-screen dialog, a basic dialog should appear to confirm that they want to discard the unsaved changes." and "Errors about the dialog
fields should always appear inline where they occur. General errors such as network issues preventing saving or submitting should appear in a
basic dialog when the confirming action fails." The editor's "Keep your changes?" dialog is that basic dialog.

**Where M3 is silent:** `Save` or autosave in a subpage or side sheet, a hidden copy in the browser, and a side sheet whose header is a medium
flexible app bar. M3 prints the standard side sheet (narrows the body, "complements" the primary content) and the modal one (scrim, "must be
dismissed"), and prints "Save" as an action button only in the modal anatomy.

## 2. Today in code

- Every settings form is a **screen**: `FormFrame` in `Screen`, with the back arrow, the title, and the floating `Save` bar
  (`ActionSheet .editor-save-bar`) while something changed. Leaving with changes asks Save / Don't save / stay. No autosave
  (`autosave-everywhere-design.md`, section 1).
- The forms (screen inventory of 14 Nov, routes in `src/App.tsx:833-956`):
  - **Part forms** (`CompanyForm` / `usePartForm`): Business › Contact, Social media, Payment › Bank; Privacy › Cookie banner, Privacy pages;
    Appearance › Default pages; a block template (`blocks/<block>`); Internal links; an app's settings (`AppFormPage`, tab Settings); a field's
    own page (`PartFieldPage`, `<form>/<field>`).
  - **Logo and icon** (`BrandForm`), **Colours** (`Colors`, with tabs Generator, Light, Dark, and a preview panel beside it from large).
  - **Globals › Header and Footer** (`HeaderSettings`, `FooterSettings`, `useDataFiles`: several files).
  - **Entries** (`DataForm`): a list item or folder entry (a tag, a popup, a testimonial, a cookie, an own list's item), a new one
    (`new/<id>`), and the fixed pages' data; with a text body or a drawing it has a panel beside the fields from large.
- Where each is reached: the main drawer (Business, Globals) or a screen of rows (Business `#company`, Settings `#settings`, Privacy,
  Appearance, an app's page), or a list's row. `backFrom` (`lib/menu.mjs:179`) gives each its screen above.
- Sheets that already exist: the 0.18 block sheet (`BlockDialog`), the notifications side sheet (theme `SideSheet kind="modal"`), the media
  file details (editor `SideSheet`, standard, from expanded), and the editor's `BottomSheet` (a bottom sheet on a phone, a dialog or a modal
  side sheet `panel` on a computer) for short choices and small forms (Redirects, Link, Versions, widget settings …).


## 3. The rule

Every **settings form** opens by the window's width when it opens, and keeps that look until it closes (a resize does not switch it mid-edit).
Which forms that is: section 4 and **O1**.

| Width | Look | Saving | Header |
| :--- | :--- | :--- | :--- |
| **Compact** (< 600) | a **subpage** of the screen it is reached from: a screen of its own with one pane (M3 list-detail, compact) | `Save` (filled) in the bottom bar, and `Cancel` (outlined) only if the form needs it; **no autosave**; the hidden copy (section 6) | the detail-screen app bar of the app bars spec, **back arrow and headline only**, no action |
| **Medium and wider** (>= 600) | a **side sheet** at the right edge, max 400 dp, sliding in, next to the page | `Save` and `Cancel` as its bottom actions; **no autosave**; the hidden copy (section 6) | headline, close icon trailing, back icon leading when a second level is open (section 7) |

**Medium (600-839) gets the side sheet**, as the owner said ("medium and expanded"); M3 allows "1 (recommended) or 2 panes" there, and the side
sheet is the two-pane form. The `Save` button is never disabled (M3 dialogs: "Don't disable the confirmation button"): `Save` with nothing
changed just closes the form.

**Leaving with unsaved changes** (the back arrow, the browser's back, `Esc`, the close icon, `Cancel`, a tap on the scrim): if nothing changed,
it closes. If something changed, the editor's **"Keep your changes?"** dialog (`src/ask.tsx`, `app.unsavedSheetTitle`) opens in front, with
`Discard` and `Keep`, the confirming one last. `Keep` returns to the form; `Discard` drops the changes (and the hidden copy) and leaves.

**Standard or modal side sheet** is **O2** (section 10). The owner said "next to the page", "It should slide. We all ready use the real
estate". M3 prints `Save` as an action button only for the modal side sheet. Recommendation: **modal** (over a scrim, the screen behind keeps
its width and does not reflow). The block sheet of 0.18 stays a **standard** side sheet (the page narrows beside it) because there the page is
what is being changed.

### 3.1 Compact, 375 px: the subpage

```
+---------------------------------------+
| <-  Contact                           |   top app bar: back arrow and headline only
+---------------------------------------+
| [ Email ]                             |
| [ Phone ]                             |
| ...                                   |
+---------------------------------------+
|                    [Cancel]  [ Save ] |   bottom bar: Save (filled), Cancel (outlined) if needed
+---------------------------------------+
```

- **Where `Save` is** (owner correction, 14 Nov): not in the top app bar. It is in the bottom bar of the editor's forms (`ActionSheet className="editor-save-bar"`, `src/FormFrame.tsx`, the bar the page form pins at the bottom for `Save draft` / `Publish`): `Save` filled and, if the form needs it, `Cancel` outlined, right-aligned as that bar draws them today, lifted above the keyboard. The bar shows with the subpage, not only while something changed, so `Save` is always there (M3: "Don't disable the confirmation button"). M3's toolbars page is the nearest text: "Toolbar on a secondary page with contextual actions" at the bottom of the window, "Avoid emphasizing more than one action at a time" (one filled button, the other outlined). The bar is today's bottom sheet part, not M3's docked toolbar; whether it becomes one is the app bars spec's to decide, not this one's.
- `Save` checks the form (today's `problemAt` and `useWrongField`: the field is marked inline, M3 "Errors about the dialog fields should always
  appear inline") and commits as the form's `Save` does today; then the subpage closes to the screen it came from and a snackbar says it is saved
  (today's message). A failed commit (network, conflict) says so in a basic dialog (M3) and keeps the subpage open.
- The back arrow (the only navigation in the top app bar) and the browser's back return to the screen above (`backFrom`); with changes they ask "Keep your changes?" first.
- No status line: nothing is saved until `Save`.
- Not a bottom sheet and not a full-screen sheet: a bottom sheet is capped at 50% height and is for "supplementary content and actions"; a full-screen sheet is not an M3 component.

### 3.2 Medium and wider, 1280 px: the side sheet

```
+------+--------------------------------------------+--------------------------+
| rail | <- Business                          Q   B | Contact               X  |  side sheet at the right edge
|      |                                            | [ Email ]                |
|      |  Contact                         >         | [ Phone ]                |
|      |  Social media                    >         | ...                      |
|      |  Payment                         >         |--------------------------|
|      |                                            | [Save]   Cancel          |  bottom actions, left-aligned (M3)
+------+--------------------------------------------+--------------------------+
```

- **Header:** the headline (the form's title) and the close icon at the end (M3 requires one). It collapses to one line when the sheet scrolls
  (the medium flexible app bar's behaviour, app bars spec decision 5).
- **Bottom actions** (M3: "Action buttons (optional) ... Examples: Save", "Bottom actions alignment (horizontal) Left", a divider above them):
  `Save` (filled) commits as the form's `Save` does today and closes the sheet; `Cancel` (text button) closes it (with "Keep your changes?" when
  something changed). Focus order as M3 prints: "Headline, Close, Cancel, Save".
- No status line and no `Changes waiting` on the row: nothing is kept until `Save`.

## 5. (removed) Autosave in the side sheet

The first draft of this spec had autosave in the side sheet (`useWaiting`, a waiting version in R2, `Discard`, `Changes waiting`). The owner's
decision puts `Save` and `Cancel` on both looks, so none of that is built. `specs/2026-11-14-autosave-everywhere-design.md` section 0 says what
autosave still covers: the screens (pages, posts, Colours, entries with a text body, the dashboard's edit mode).

## 4. Which forms get the pattern

Recommendation for **O1** (the owner has not chosen; on compact every form of the table is a subpage, on medium and wider a side sheet; the owner's starting point was "these settings pages", the site's settings forms):

| Form | Route | Side sheet over | Recommendation |
| :--- | :--- | :--- | :--- |
| Business › Contact, Social media, Payment › Bank | `company/contact`, `company/social-media`, `company/payment/bank` | Business (`#company`), Payment | **subpage / side sheet** |
| Business › Logo and icon | `company/logo` | Business | **subpage / side sheet** (images keep the autosave spec's decision 5) |
| Business › Colours (and fallback colours) | `company/colors` | Business | **stays a screen** with the medium flexible app bar: its tabs and the preview beside it need more than 400 dp (O1, sub-question) |
| Globals › Header, Footer | `global/header`, `global/footer` | the screen they were opened from; the start screen when opened by address | **subpage / side sheet** |
| Privacy › Cookie banner, Privacy pages | `privacy/cookie-banner`, `privacy/privacy-pages` | Privacy | **subpage / side sheet** |
| Appearance › Default pages | `appearance/default-pages` | Appearance | **subpage / side sheet** |
| A block template | `blocks/<block>` | Block templates | **subpage / side sheet** |
| Internal links | `seo/internal-links` | the screen it was opened from | **subpage / side sheet** |
| An app's settings | `apps/<id>` (tab Settings) | the app's page: the tab becomes a `Settings` button that opens the sheet | **subpage / side sheet** |
| A field's own page | `<form>/<field>` | its form's sheet: a **second level** in the same sheet (section 7) | **in the sheet** |
| A list item or folder entry without a text body (a tag, a testimonial, a cookie, an own list's item, a new one) | `<data path>`, `new/<id>` | its list | **subpage / side sheet** (the list is "the page") |
| An entry with a text body or a drawing (a popup's text) | same | — | **stays a screen** with the small app bar, as a page being written |
| The page form's own settings (Page settings, Search engines, Social media, History) | — | — | **not in 0.20**: they stay folds in the page form; a later spec may make them a side sheet of the page |

Screens with switches or one-tap choices (Themes, Icon packs, Motion, Side column, Block settings, Caching and builds, Assistants, Account)
are not forms: they save at once (autosave spec, section 2) and stay screens with the medium flexible app bar.


## 6. The hidden copy

The 0.18 helper `src/sheetCopy.mjs` (`keep`, `take`, `drop`, `matches`) is reused, keyed by the form's route instead of a page and block:
`{ route, before, values, at }`, written 300 ms after each change, in the subpage and in the side sheet alike (neither autosaves). Proposal **P1**
(the owner decided the copy for the phone; the side sheet gets the same rule so that a closed tab loses nothing).

- `Save`, `Cancel`, `Discard` in the "Keep your changes?" dialog, or leaving unchanged deletes the copy.
- Anything else that ends the form (the tab closed or reloaded, the phone killed the tab, an update of the editor, a sign-in that expired)
  leaves it.
- When the same form opens again and a copy exists, a basic dialog asks **"Restore your unsaved changes?"** with `Discard` and `Restore`
  (0.18's texts). `Restore` puts the values into the form, still not saved.
- The copy is offered only while the form's saved values still equal `before` (nothing changed them since, e.g. on another device);
  otherwise, or after 7 days, it is deleted without asking.

## 7. Inside a subpage or a side sheet: a second level, and choices from it

- **A field's own page** (`PartFieldPage`: a long list field of a form) opens **inside the same subpage or side sheet** as a second level: the
  header gets the back icon (M3: "Side sheets can contain a back icon for navigation", "People can navigate to another region within the
  sheet"), the headline is the field's name, and the back icon returns to the form. On compact it is one more step down the subpage's back
  stack. Its changes are the form's (one `Save`).
- **Choices from a form** (a link sheet, a media picker, an item sheet, a colour field's choice): they open over it as today (a menu, a bottom
  sheet on a phone for a short choice, a dialog).

## 8. Routes, focus and keys

- A form keeps its route (`#company/contact`). On compact it is a screen of its own whose back is `backFrom`. On medium and wider, opening the
  route draws the screen it is reached from (`backFrom`, or the screen it was opened on) with the side sheet over it; a reload or a shared
  address shows the same. Closing goes back to that screen's route (`history.back()` when that is the entry before, as `up()` does today).
- The side sheet is `role="dialog"` with `aria-modal="true"` (if modal, O2), labelled by its headline. Focus goes to the first field when it
  opens (M3: "focus should automatically land on the first interactive element"), stays inside while it is open, and returns to the row that
  opened it when it closes. `Esc` closes it (asking first where section 3 says).
- `Ctrl+S` (`Cmd+S`) runs `Save`.
- The screen behind is `inert` while a modal side sheet is open.

## 9. Texts (en-US first, da-DK)

| Key | en-US | da-DK |
| :--- | :--- | :--- |
| (existing) `app.unsavedSheetTitle` | `Keep your changes?` | the existing da-DK text |
| (0.18) `blocks.restoreTitle`, `history.restore`, `app.discard` | `Restore your unsaved changes?`, `Restore`, `Discard` | `Vil du gendanne dine ugemte aendringer?`, `Gendan`, `Kassér` |
| (existing) `common.save`, `common.cancel` | `Save`, `Cancel` | `Gem`, `Annuller` |

No new texts. The first draft's `forms.changesWaiting`, `forms.discardTitle` and `forms.keepEditing` are dropped. `site-editor-writing` and M3's
word choice apply.

## 10. Open for the owner, and proposals

**Decided by the owner, 14 Nov:** the full-screen sheet is gone (subpage on compact, side sheet from medium); `Save`, not autosave; the
"Keep your changes?" dialog on leaving. This answers the first draft's **O2 in part** (a side sheet, next to the page, `Save` and `Cancel`, no
autosave) and its proposals P1 (medium gets the side sheet), P2 (bottom actions `Save` and `Cancel`), P3 (`Changes waiting`), P4 and P5
(waiting versions), which are closed or removed.

**Still open (owner):**

- **O1. Which forms get the pattern.** Recommendation: section 4's table (the site's settings forms and the entries without a text body;
  Colours and entries with a text body stay screens). *Alternatives:* only the site's settings forms (entries stay screens), or every
  `FormFrame` form including Colours. The owner's reply did not cover it.
- **O2. Standard or modal side sheet.** The owner said "next to the page"; that fits both. Recommendation: **modal**, because M3 prints `Save`
  as an action button for the modal side sheet only, and "Keep your changes?" on a scrim is clearer; the 0.18 block sheet stays **standard**.
  *Alternative:* standard (the screen behind narrows, stays usable; Save and Cancel as bottom actions are then a deviation, section 11).

**Proposal (PM or owner):**

- **P1.** The hidden copy (section 6) in the side sheet as well as in the subpage.

## 11. Deviations (to `docs/material-deviations.md` in the PR that builds each)

- **A medium flexible app bar as a side sheet's header** (owner decision 5 of the app bars spec). Material: a side sheet's header is "Headline" and
  "Close icon button". We do: the headline wrapping to two lines and collapsing on scroll. Why: owner decision, 14 Nov 2026.
- **Only if O2 is standard:** `Save` and `Cancel` as bottom actions of a standard side sheet (M3 prints "Action buttons" in the modal anatomy only).
- Everything else is what M3 prints: single-pane list-detail with a back button on compact, the side sheet at the right edge, max 400 dp, its
  close icon always present, left-aligned bottom actions with `Save`, the back icon for a second level, role Dialog, inline field errors, the
  discard question in a basic dialog. Bottom sheets only for menus and short choices.

## 12. Checks

`npm run check` on every PR; for visible PRs `npm run build`, `npm run check:screens` (both widths), `check:demo`. New `check:screens` assertions:

- **375 px:** opening Business > Contact shows a screen with a back arrow and the headline in the top app bar and a `Save` button in the bottom bar, no side sheet, no dialog and no
  status line; typing, then the back arrow, asks "Keep your changes?"; `Keep` stays, `Discard` leaves; typing, then a reload, offers "Restore
  your unsaved changes?", `Restore` puts the value back; `Save` deletes the copy.
- **1280 px (and 700 px):** the same route shows Business behind a side sheet no wider than 400 dp at the right edge, with a close button, a `Save`
  and a `Cancel` button; no commit before `Save`; `Cancel` with changes asks "Keep your changes?"; `Save` commits and closes.
- **Both:** no form of section 4 marked "subpage / side sheet" is drawn as a full-screen sheet or a bottom sheet; a field's page opens inside its
  form with a back icon; focus returns to the row that opened the side sheet; one `Save` visible at a time.
- Unit tests: `settingsSheetLook(width)` (the table of section 3), `sheetCopy.mjs` keyed by route, the route-to-backdrop rule (`sheetBackdrop(route)`).

## 13. Build plan (small PRs into the 0.20 line)

Every visible PR carries the `pm` skill's before and after screenshots of every changed screen in a comment, and a changeset (`minor` when
visible, empty otherwise). The first visible PR writes one release note (`paragraph`, mark `improvement`, title *Settings open beside the page*);
later PRs update it.

| PR | What | Level | Depends on |
| :--- | :--- | :--- | :--- |
| 1 | **The settings page part** (`SettingsSheet` in `ui.tsx`: the subpage on compact, the side sheet from medium, by width, fixed while open (`settingsSheetLook`); the header; bottom actions; the second level with the back icon; "Keep your changes?" on leaving; on the Components screen). The deviations of section 11. | `minor` | - |
| 2 | **Routes draw the screen behind** (`sheetBackdrop(route)` in `App.tsx`): opening, reloading and closing the side sheet's route; focus in and back; `inert`. | empty | 1 |
| 3 | **The hidden copy by route** (`sheetCopy.mjs` widened from 0.18) and "Restore your unsaved changes?". | `minor` | 1, 0.18's `sheetCopy.mjs` |
| 4 | **Part forms move into the pattern** (one place, `usePartForm` under `FormFrame`): Contact, Social media, Bank, Cookie banner, Privacy pages, Default pages, block templates, Internal links, app settings (its tab becomes a `Settings` button), a field's page as a second level. | `minor` | 2, 3 |
| 5 | **Logo and icon; Header and Footer.** | `minor` | 4 |
| 6 | **Entries without a text body** over their list (per O1). | `minor` | 4 |
| 7 | **Clean-up**: FormFrame's floating Save bar removed from every form that now has the pattern; unused texts; this spec marked built. | empty | 4-6 |

PRs 4, 5 and 6 can run side by side after 3. The first draft's autosave PR is gone (section 5).
