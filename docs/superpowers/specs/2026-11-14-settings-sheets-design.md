# Settings become sheets (design and build plan, 0.20)

Status: design and build plan, no code. Written against `0.18` (`e89942f`) on 14 Nov 2026 in a brainstorm session. The owner was away and
asked that it be planned with the 0.18 PM. The owner's words below are settled. Two of the design's choices (section 10: **O1**, **O2**)
are **open for the owner**: the PM confirmed the owner has not made them. The rest are proposals the PM or the owner confirms before the
build.

## 0. What the owner said (14 Nov 2026, quoted as the 0.18 PM relayed them)

While discussing autosave on every editor screen that needs a Save (the settings screens):

1. "I was thinking that these settings pages should move into being MD3 full sheets."
2. On the PM's "full-screen on a phone, side sheet on larger screens": "It should be the right pane on large screens instead of full screen.
   Agree?"
3. On the PM's "a side sheet over the page or list-detail?": "It should slide. We all ready use the real estate. In the full screen view show
   save and cancel. Don't use autosave here."
4. "The side sheet is controlled by the page so has autosave. The reason I don't want it on sheets is that it is counterintuitive. But what
   do you recommend. I feel we need the save button, but should we autosave anyway"

Decided from these (roadmap `plans/2026-11-14-roadmap-0-18-to-0-24.md`, 0.20):

- **On a phone:** a full-screen sheet with `Save` and `Cancel` and **no autosave**. While the owner types, a hidden copy is kept in this
  browser; it is offered back ("Restore your unsaved changes?") only if the sheet closed without `Save` or `Cancel`. `Save` or `Cancel`
  deletes it.
- **On large screens:** a side sheet, "the right pane", that slides in; it follows the page's autosave.
- The medium flexible app bar on settings sheets (`specs/2026-11-14-app-bars-design.md`, owner decision 5).
- The autosave of settings (`specs/2026-11-14-autosave-everywhere-design.md`) is redrawn around these sheets; that spec's decisions 1
  (waiting versions in R2 only, never git) and 7 (`Remove field` and `Remove data` wait for the final `Save`) hold.

Builds on 0.18, not redesigned here: the block sheet of `specs/2026-11-14-one-save-while-writing-design.md` (a **standard** side sheet from
expanded, live, no `Save`; a modal side sheet with `Save` and `Cancel` at medium; the theme's full-screen dialog with `Save` on a phone; the
hidden copy `src/sheetCopy.mjs` and "Restore your unsaved changes?"). This spec reuses that phone rule and that copy for the settings.

Read for this spec: `src/FormFrame.tsx`, `src/CompanyForm.tsx` (`usePartForm`), `src/DataForm.tsx`, `src/useDataFiles.ts`, `src/HeaderSettings.tsx`,
`src/FooterSettings.tsx`, `src/BrandForm.tsx`, `src/Colors.tsx`, `src/AppFormPage.tsx`, `src/PartFieldPage.tsx`, `src/Library.tsx` (Business,
Settings, Privacy, Appearance screens), `src/App.tsx` (routes), `lib/menu.mjs` (`backFrom`), `src/sheetPlacement.mjs`, `src/BlockDialog.tsx`,
`theme/ui/SideSheet.tsx`, `theme/ui/Dialog.tsx`, `theme/ui/BottomSheet.tsx`, `src/ui.tsx` (`BottomSheet`, `SideSheet`, `ActionSheet`).

## 1. What Material 3 says (read 14 Nov 2026 with Playwright)

Pages read in full: Side sheets, Bottom sheets and Dialogs (overview, guidelines, specs, accessibility). Quoted as printed. The token tables
did not open from a script; the measurements quoted are the ones printed as text.

**Side sheets.**

- "Use side sheets to provide optional content and actions without interrupting the main content." "Two variants: standard and modal."
  "People can navigate to another region within the sheet." "Side sheets can contain a back icon for navigation."
- "Standard side sheets display content that complements the screen's primary content. They remain visible while people interact with
  primary content." "Modal side sheets are preferred in compact breakpoints, like mobile, due to limited screen size. They can display the
  same kinds of content as standard side sheets, but must be dismissed in order to interact with the underlying content." Example captions:
  "Modal side sheet with filter controls", "Form controls shown in a side sheet for app settings".
- "Place side sheets along the edge of the screen, usually on the right side." "Modal side sheets on smaller screens can transition to
  standard side sheets at larger screen sizes." "When a standard side sheet opens, the body area shrinks to accommodate the sheet's width
  while maintaining a margin on the body's trailing edge."
- Anatomy, standard: "Divider (optional), Headline, Container, Close icon button"; modal: "Back icon button (optional), Headline,
  Container, Close icon button, Divider (optional), Action buttons (optional), Scrim". "A close icon button is highly recommended."
  "Action buttons (optional): Buttons represent actions available from a side sheet. Examples: Save, Edit, Download." "Use a divider to
  separate: Action buttons from content."
- "Side sheets can vertically scroll independent of the rest of the UI." "Side sheets cannot scroll horizontally."
- Specs: colour roles, standard "Outline variant, On surface variant, Surface, On surface variant"; modal "On surface variant, On surface
  variant, Surface container low, On surface variant". Modal measurements: "Start/end padding 24dp", "Start padding with icon 16dp",
  "Padding between top elements 12dp", "Bottom actions height 72dp", "Bottom actions top padding 16dp", "Bottom actions bottom padding
  24dp", "Bottom actions alignment (horizontal) Left", "Max-width 400dp", "Margins (when detached) 16dp". Overview: "Modal side sheets have
  a 16dp corner radius".
- Accessibility: "Material requires that a close affordance, such as a close icon button, is always present within a side sheet." Focus
  order example: "Headline, Close, Cancel, Save". "The accessibility role for a side sheet is Dialog."

**Dialogs, the full-screen dialog.**

- "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete." "Full-screen dialogs may be
  used for content or tasks that meet any of these criteria: Dialogs that include components which require keyboard input, such as form
  fields; When changes aren't saved instantly; When components within the dialog open additional dialogs." "Full-screen dialogs are for
  compact breakpoints only, like mobile devices."
- Anatomy: "Container, Header region, Icon (close affordance), Headline (optional), Button label text, Divider (optional)."
- "To save a selection in a full-screen dialog, use Save. The close icon or dismissive action, such as Cancel or Back, should close the
  dialog." "Avoid using vague terms like Done, OK, or Close." "Don't disable the confirmation button."
- "When a full-screen dialog is closed without being saved, a basic dialog appears in front of it to confirm selections should be discarded
  without saving changes." "When someone dismisses a full-screen dialog, a basic dialog should appear to confirm that they want to discard
  the unsaved changes."
- "Errors about the dialog fields should always appear inline where they occur." "General errors such as network issues preventing saving
  or submitting should appear in a basic dialog when the confirming action fails."
- "Because full-screen dialogs can only be completed, dismissed, or closed, the close "X" icon button should be the only navigation option
  in the app bar." "In full-screen dialogs, long headlines or headlines of variable lengths (such as translations), can be placed in the
  content area instead of the app bar." "Dialogs can swap variants as the breakpoint changes."
- Specs, full-screen: "Container shape 0dp corner radius", "Header height 56dp", "Headline text alignment Start-aligned", "Icon (close
  affordance) size 24dp", "Top/left/right padding 24dp", "Padding between elements 8dp"; roles "Surface container high, On surface, On
  surface, Primary, On surface variant".
- Accessibility: "When a dialog appears, focus should automatically land on the first interactive element within the dialog." Keys: "Tab",
  "Shift + Tab", "Space or Enter", "Escape: Closes the dialog". "The accessibility label for a dialog is typically the same as the dialog's
  title or headline."

**Bottom sheets** (why they are not used here): "Bottom sheets display supplementary content and actions on a mobile screen." "Use a modal
bottom sheet as an alternative to inline menus or simple dialogs on mobile." "On larger expanded breakpoints, like desktop, a bottom sheet
can be swapped for a side sheet that shows similar content." A settings form is a task with fields, which M3 gives to the full-screen dialog
on a phone; the bottom sheet stays for menus and short choices (as today).

**Where M3 is silent:** autosave in a sheet, a hidden copy in the browser, and a sheet whose header is a medium flexible app bar. M3 says
nothing about whether a side sheet over unrelated content should narrow that content; it prints the standard one (narrows, "complements" the
primary content) and the modal one (over a scrim, "must be dismissed").

## 2. Today in code

- Every settings form is a **full screen**: `FormFrame` in `Screen`, with the back arrow, the title, and the floating `Save` bar
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

Every **settings form** opens as a **sheet over the screen it is reached from** (its `back` today: Business, Settings, Privacy, Appearance,
an app's page, a list). Which forms that is: section 4 and **O1**. The sheet's look depends only on the window's width when it opens, and stays
until it closes (as 0.18's block sheet: a resize does not switch it mid-edit):

| Width | Sheet | Saving | Header |
| :--- | :--- | :--- | :--- |
| **Compact** (< 600) | **full-screen dialog** (the theme's `Dialog kind="full-screen"`) | `Save` and `Cancel`; **no autosave**; the hidden copy (section 6) | the medium flexible app bar's parts: close icon (`Cancel`) leading, `Save` trailing (a text button, M3's "Button label text"), the headline under it, wrapping |
| **Medium and wider** (≥ 600) | **side sheet** at the right edge, max 400 dp (M3), sliding in | **follows the page's autosave** (section 5): the changes are kept as a waiting version while typing, and `Save` applies them | headline (medium flexible: `Headline medium`, wrapping, collapsing on scroll), close icon trailing, back icon leading when a second level is open (section 7) |

**Medium (600–839) gets the side sheet**, not the full-screen dialog: the owner's rule names the full-screen view for the phone, and M3 says
"Full-screen dialogs are for compact breakpoints only". (0.18's block sheet uses a modal side sheet with `Save` and `Cancel` at medium because
there the page's own `Publish` is out of reach under it; a settings sheet has its own `Save` at every width, so autosave can follow the sheet
kind: full screen, no autosave; side sheet, autosave.) Proposal **P1**.

**Standard or modal side sheet** is **O2** (section 10). The owner said "It should slide. We all ready use the real estate", and the roadmap
says "the page keeps its space". Recommendation: **modal side sheet** (over a scrim, the screen behind keeps its width and does not reflow,
M3's "must be dismissed in order to interact with the underlying content"). The block sheet of 0.18 stays a **standard** side sheet (the page
narrows beside it), because there the page is what is being changed and must stay usable; a settings sheet changes something the screen
behind does not show.

### 3.1 Compact, 375 px

```
┌───────────────────────────────────────┐
│ ✕                                  Save │   header: close icon (named Cancel), Save (text button)
│ Contact                                 │   headline, medium flexible: under the bar, up to two lines
├───────────────────────────────────────┤
│ ┌ Email ─────────────────────────────┐ │
│ └─────────────────────────────────────┘ │
│ ┌ Phone ─────────────────────────────┐ │
│ …                                       │
└───────────────────────────────────────┘
```

- `Save` checks the form (today's `problemAt` and `useWrongField`: the field is marked inline, M3 "Errors about the dialog fields should always
  appear inline") and commits as the form's `Save` does today; then the sheet closes and a snackbar says it is saved (today's message). A
  failed commit (network, conflict) says so in a basic dialog (M3) and keeps the sheet open.
- The close icon (`Cancel`), `Esc` and the phone's back: unchanged, it closes; changed, today's question in a basic dialog ("Discard your
  changes?" with `Discard` and `Keep editing`; M3: "a basic dialog appears in front of it to confirm selections should be discarded").
- No autosave, no status line (nothing is saved until `Save`).

### 3.2 Medium and wider, 1280 px

```
┌──────┬───────────────────────────────────────────┬──────────────────────────┐
│ rail │ ← Business                         🔍   🔔 │ Contact               ✕  │  modal side sheet over a scrim (O2),
│      │                                            │ Saved                    │  headline + status, close
│      │  Contact                         ›         │ ┌ Email ──────────────┐  │
│      │  Social media                    ›  ░░░░░░ │ └─────────────────────┘  │
│      │  Payment                         ›  ░░░░░░ │ ┌ Phone ──────────────┐  │
│      │                                     ░░░░░░ │ …                        │
│      │                                            ├──────────────────────────┤
│      │                                            │ [Save]   Discard         │  bottom actions, left-aligned (M3)
└──────┴───────────────────────────────────────────┴──────────────────────────┘
```

- **Header:** the headline (the form's title), its status under it (`Saving…`, `Saved`, `Not saved`: the autosave line, a polite live region),
  the close icon at the end (M3 requires it). It collapses to one line when the sheet scrolls (the medium flexible app bar's behaviour).
- **Bottom actions** (M3: "Action buttons (optional) … Examples: Save", "Bottom actions alignment (horizontal) Left", a divider over them):
  `Save` (filled) applies the waiting version: it commits it and deletes it, as the autosave spec's final `Save` does; `Discard` (text button,
  shown only while a waiting version exists) deletes the waiting version after a basic dialog ("Discard your changes?"). Proposal **P2**.
- **Closing** (close icon, `Esc`, a tap on the scrim): never asks, because nothing is lost: the waiting version stays in R2 and the sheet
  opens with it next time ("Changes put back", the autosave spec 3.4). The row that opens it shows `Changes waiting` while a waiting version
  exists (P3).
- **Autosave off** (`R2 caching` off, or the Worker answers 409 `off`): the side sheet behaves as the phone's: `Save` and `Cancel` as its
  bottom actions, the close question, the hidden copy (section 6). One rule: **a sheet that cannot autosave keeps a hidden copy**. Proposal **P4**.

## 4. Which forms become sheets

Recommendation for **O1** (the owner has not chosen; the owner's starting point was "these settings pages", the site's settings forms):

| Form | Route | Sheet over | Recommendation |
| :--- | :--- | :--- | :--- |
| Business › Contact, Social media, Payment › Bank | `company/contact`, `company/social-media`, `company/payment/bank` | Business (`#company`), Payment | **sheet** |
| Business › Logo and icon | `company/logo` | Business | **sheet** (images keep the autosave spec's decision 5) |
| Business › Colours (and fallback colours) | `company/colors` | Business | **stays a screen** with the medium flexible app bar: its tabs and the preview beside it need more than 400 dp (O1, sub-question) |
| Globals › Header, Footer | `global/header`, `global/footer` | the screen they were opened from; the start screen when opened by address | **sheet** |
| Privacy › Cookie banner, Privacy pages | `privacy/cookie-banner`, `privacy/privacy-pages` | Privacy | **sheet** |
| Appearance › Default pages | `appearance/default-pages` | Appearance | **sheet** |
| A block template | `blocks/<block>` | Block templates | **sheet** |
| Internal links | `seo/internal-links` | the screen it was opened from | **sheet** |
| An app's settings | `apps/<id>` (tab Settings) | the app's page: the tab becomes a `Settings` button that opens the sheet | **sheet** |
| A field's own page | `<form>/<field>` | its form's sheet: a **second level** in the same sheet (section 7) | **in the sheet** |
| A list item or folder entry without a text body (a tag, a testimonial, a cookie, an own list's item, a new one) | `<data path>`, `new/<id>` | its list | **sheet** (the list is "the page") |
| An entry with a text body or a drawing (a popup's text) | same | — | **stays a screen** with the small app bar, as a page being written |
| The page form's own settings (Page settings, Search engines, Social media, History) | — | — | **not in 0.20**: they stay folds in the page form; a later spec may make them a side sheet of the page |

Screens with switches or one-tap choices (Themes, Icon packs, Motion, Side column, Block settings, Caching and builds, Assistants, Account)
are not forms: they save at once (autosave spec, section 2) and stay screens with the medium flexible app bar.

## 5. Autosave in the side sheet

The side sheet uses the autosave spec's `useWaiting` with `kind: 'keep'` (R2 only, never git, decision 1): while typing, the form's values
are kept as the waiting version under the form's primary file path; `Save` commits and deletes it; nothing goes live before `Save`. What
each form's waiting version holds, the restore on reopening, the wrong-field case, and the off state are that spec's (its phase 2, redrawn in
it around these sheets). This spec adds only:

- The status line is the side sheet's subtitle (`Saving…`, `Saved`, `Not saved`), drawn by the sheet, not by each form.
- `Discard` and the row's `Changes waiting` (3.2).
- The phone's full-screen dialog never calls `useWaiting` (no autosave there): the owner's words, "Don't use autosave here".

A waiting version saved from a computer is still there when the same form is opened on a phone: the full-screen dialog opens with it (the
form is dirty, `Save` applies it, `Cancel` asks whether to discard it). Proposal **P5**.

## 6. The hidden copy

The 0.18 helper `src/sheetCopy.mjs` (`keep`, `take`, `drop`, `matches`) is reused, keyed by the sheet's route instead of a page and block:
`{ route, before, values, at }`, written 300 ms after each change in a sheet that cannot autosave (the phone's full-screen dialog; a side sheet
with autosave off).

- `Save`, `Cancel`, `Discard` in the close question, or closing it unchanged deletes the copy.
- Anything else that ends the sheet (the tab closed or reloaded, the phone killed the tab, an update of the editor, a sign-in that expired)
  leaves it.
- When the same sheet opens again and a copy exists, a basic dialog asks **"Restore your unsaved changes?"** with `Discard` and `Restore`
  (0.18's texts). `Restore` puts the values into the form, still not saved.
- The copy is offered only while the form's saved values still equal `before` (nothing changed them since, e.g. on another device);
  otherwise, or after 7 days, it is deleted without asking.

## 7. Inside a sheet: a second level, and sheets from a sheet

- **A field's own page** (`PartFieldPage`: a long list field of a form) opens **inside the same sheet** as a second level: the sheet's header
  gets the back icon (M3: "Side sheets can contain a back icon for navigation", "People can navigate to another region within the sheet"),
  the headline is the field's name, and the back icon returns to the form. Its changes are the form's (one waiting version, one `Save`). On a
  phone the full-screen dialog does the same: the close icon becomes the back arrow on the second level (M3: "the close "X" icon button should
  be the only navigation option" holds on the first level).
- **Sheets opened from a sheet** (a link sheet, a media picker, an item sheet, a colour field's choice): they open over it as today (a menu,
  a bottom sheet on a phone, a dialog). M3: full-screen dialogs "are the only dialogs over which other dialogs can appear".

## 8. Routes, focus and keys

- A sheet keeps its route (`#company/contact`). Opening the route draws the screen it is reached from (`backFrom`, or the screen it was
  opened on) with the sheet over it; a reload or a shared address shows the same. Closing the sheet goes back to that screen's route
  (`history.back()` when that is the entry before, as `up()` does today).
- The sheet is `role="dialog"` with `aria-modal="true"` (modal side sheet, full-screen dialog), labelled by its headline. Focus goes to the
  first field when it opens (M3: "focus should automatically land on the first interactive element"), stays inside while it is open, and
  returns to the row that opened it when it closes. `Esc` closes it (asking first only where 3.1 says).
- `Ctrl+S` (`⌘S`) runs `Save` in a sheet (as 0.18 does on the page form).
- The screen behind is `inert` while a modal sheet is open.

## 9. Texts (en-US first, da-DK)

| Key (proposed) | en-US | da-DK |
| :--- | :--- | :--- |
| `forms.changesWaiting` (a row's supporting text) | `Changes waiting` | `Ændringer venter` |
| `forms.discardTitle` | `Discard your changes?` | `Vil du kassere dine ændringer?` |
| `forms.keepEditing` | `Keep editing` | `Fortsæt med at redigere` |
| (0.18) `blocks.restoreTitle`, `history.restore`, `app.discard` | `Restore your unsaved changes?`, `Restore`, `Discard` | `Vil du gendanne dine ugemte ændringer?`, `Gendan`, `Kassér` |
| (existing) `common.save`, `common.cancel` | `Save`, `Cancel` | `Gem`, `Annuller` |

The build PR checks the question's existing wording (`FormFrame`'s leave question) and keeps it if it already says this; the
`site-editor-writing` skill and M3's word choice apply.

## 10. Open for the owner, and proposals

**Open (owner):**

- **O1. Which forms become sheets.** Recommendation: section 4's table (the site's settings forms and the entries without a text body;
  Colours and entries with a text body stay screens). *Alternatives:* only the site's settings forms (entries stay screens), or every
  `FormFrame` form including Colours.
- **O2. Standard or modal side sheet.** Recommendation: **modal** (it slides over, the screen behind keeps its width: "It should slide. We all
  ready use the real estate"; "the page keeps its space"), while the 0.18 block sheet stays **standard** (the page narrows beside it, because
  the page is what changes). *Alternative:* standard for both (the screen behind narrows, stays usable, one kind of side sheet in the editor).

**Proposals (PM or owner):**

- **P1.** Medium (600–839) gets the side sheet with autosave; only compact gets the full-screen dialog.
- **P2.** The side sheet's bottom actions are `Save` (filled) and `Discard` (text, only while a waiting version exists).
- **P3.** Closing a side sheet with a waiting version never asks; its row shows `Changes waiting`.
- **P4.** A side sheet that cannot autosave (R2 caching off) has `Save` and `Cancel` and the hidden copy, as the phone's.
- **P5.** A waiting version saved on a computer opens in the phone's full-screen dialog as unsaved changes.

## 11. Deviations (to `docs/material-deviations.md` in the PR that builds each)

- **A medium flexible app bar as a sheet's header** (owner decision 5 of the app bars spec). Material: a side sheet's header is "Headline" and
  "Close icon button"; a full-screen dialog's is a 56 dp "Header region" with the close icon, the headline and the button, and long headlines
  go "in the content area instead of the app bar". We do: the headline under the bar row, wrapping to two lines and collapsing on scroll. Why:
  owner decision, 14 Nov 2026. The nearest M3 text is the full-screen dialog's own advice to move long headlines out of the bar.
- **A status line in a side sheet's header** (`Saving…` / `Saved`): M3 silent; the medium flexible app bar's subtitle is the nearest part.
- Everything else is what M3 prints: the full-screen dialog on compact only, `Save` and the close icon, the discard question, inline errors, the
  side sheet at the right edge, max 400 dp, its close icon always present, left-aligned bottom actions with `Save`, the back icon for a second
  level, role Dialog.

## 12. Checks

`npm run check` on every PR; for visible PRs `npm run build`, `npm run check:screens` (both widths), `check:themes` when the theme's sheet or
dialog changes, `check:demo`. New `check:screens` assertions:

- **375 px:** opening Business › Contact shows a full-screen dialog (`aria-modal`) with a close button named `Cancel` and a `Save` button, and
  no status line; typing, then a reload, offers "Restore your unsaved changes?", `Restore` puts the value back; `Save` deletes the copy; the
  screen behind is inert.
- **1280 px (and 700 px):** the same route shows Business behind a side sheet no wider than 400 dp at the right edge, with a close button,
  `Saving…` then `Saved` after typing (with R2 caching on in the test's Worker), no commit before `Save`; closing and reopening puts the value
  back; `Save` commits and clears the status; with R2 caching off the sheet has `Save` and `Cancel` and the hidden copy.
- **Both:** no form of section 4 marked "sheet" is drawn as a full screen; a field's page opens inside its form's sheet with a back icon;
  focus returns to the row that opened the sheet; one `Save` visible at a time.
- Unit tests: `settingsSheetLook(width)` (the table of section 3), `sheetCopy.mjs` keyed by route, the route-to-backdrop rule (`sheetBackdrop(route)`).

## 13. Build plan (small PRs into the 0.20 line)

Every visible PR carries the `pm` skill's before and after screenshots of every changed screen in a comment, and a changeset (`minor` when
visible, empty otherwise). The first visible PR writes one release note (`paragraph`, mark `improvement`, title *Settings open as sheets*);
later PRs update it.

| PR | What | Level | Depends on |
| :--- | :--- | :--- | :--- |
| 1 | **The settings sheet part** (`SettingsSheet` in `ui.tsx`, built on the theme's `SideSheet kind="modal"` and `Dialog kind="full-screen"`): the look by width, fixed while open (`settingsSheetLook`); the medium flexible header; bottom actions; the second level with the back icon; on the Components screen. The deviations of section 11. | `minor` | — |
| 2 | **Routes draw the screen behind** (`sheetBackdrop(route)` in `App.tsx`): opening, reloading and closing a sheet's route; focus in and back; `inert`. | empty (no form uses it yet) | 1 |
| 3 | **The hidden copy by route** (`sheetCopy.mjs` widened from 0.18) and "Restore your unsaved changes?" for sheets. | `minor` | 1, 0.18's `sheetCopy.mjs` |
| 4 | **Part forms move into sheets** (one place, `usePartForm` under `FormFrame`): Contact, Social media, Bank, Cookie banner, Privacy pages, Default pages, block templates, Internal links, app settings (its tab becomes a `Settings` button), a field's page as a second level. Phone: `Save` / `Cancel`, no autosave. Large: `Save` and `Cancel` until the autosave PR lands (then P2's `Save` / `Discard`). | `minor` | 2, 3 |
| 5 | **Logo and icon; Header and Footer** into sheets. | `minor` | 4 |
| 6 | **Entries without a text body** into sheets over their list (per O1). | `minor` | 4 |
| 7 | **Autosave in the side sheet**: `useWaiting` from the autosave spec's PR 2; the status in the header; `Discard`; `Changes waiting` on the row; autosave off falls back to P4. | `minor` | 4, autosave PRs 1–2 |
| 8 | **Clean-up**: FormFrame's floating Save bar removed from every form that is now a sheet; unused texts; this spec marked built. | empty | 4–7 |

PRs 4, 5 and 6 can run side by side after 3. Until 7 is in, the side sheet saves with `Save` alone, as forms do today.
