# One Save while writing a page (design and build plan, 0.18)

Status: design and build plan, ready to build. No code. Written against `0.18` on 14 Nov 2026; the owner's decisions of the same day
on its open questions are in section 12 and in the body.

**The problem** (owner, 14 Nov, the page form on staging at computer width): with a block's side sheet open (FAQ list) the screen shows
two sets of save buttons at once, the page's floating bar (`Preview`, `Save draft`, `Publish`) and the sheet's own `Save`, `Cancel`,
`Remove`. "We need to standardise this."

**Owner decisions (14 Nov), which this spec builds on and does not reopen:**

1. On large screens the block's side sheet has no `Save` or `Cancel`. It belongs to the page: a change shows on the page at once and is
   saved with the page (the page's draft autosave, then `Publish`). Undo takes a change back. The sheet keeps only its close button.
   `Remove` leaves the sheet: it is in the block's `⋮`.
2. On a phone the block's sheet is full screen and covers the page's buttons, so it keeps `Save` and `Cancel`, with no autosave. A hidden
   copy in the browser puts back what was typed if the sheet closed without `Save` or `Cancel` ("Restore your unsaved changes?"); `Save`
   or `Cancel` deletes it. Only one Save is ever visible.
3. `Publish` moves to the top of the page form, in the page's app bar (top right), on this screen in 0.18 (other screens' app bars wait
   for 0.20). The floating bottom bar goes. `Save draft` is no longer a button: the draft saves itself, and a status such as `Saving…` /
   `Saved` stands next to the title. `Preview` goes to the page's toolbar. The app bar has one action, two if necessary: `Publish` and
   the 0.18 search icon of the command palette.

Read for this spec: `src/EntryForm.tsx`, `src/FormFrame.tsx`, `src/Screen.tsx`, `src/BlockDialog.tsx`, `src/sheetPlacement.mjs`,
`src/MarkdownEditor.tsx` (the block card's `edit`, the history plugin), `src/fields.tsx` (`useWrongField`), `src/useAutosave.ts`,
`src/autosave.mjs`, `theme/ui/Dialog.tsx`, `theme/styles/ui.css` (side sheets), `specs/2026-11-11-drafts-and-publish-plan.md`,
`specs/2026-11-14-autosave-everywhere-design.md`, `specs/2026-11-13-contextual-toolbar-row-design.md`,
`specs/2026-11-13-command-palette-and-context-menus-design.md`, `plans/2026-11-14-roadmap-0-18-to-0-24.md`.

## 1. What Material 3 says (read 14 Nov 2026 with Playwright)

Pages read: Side sheets (guidelines, specs, accessibility), App bars (guidelines, specs, accessibility), Dialogs (guidelines, the
full-screen dialog), Buttons and Icon buttons (guidelines), Snackbar (guidelines). Quoted as printed.

**Side sheets.** "Standard side sheets display content that complements the screen's primary content. They remain visible while people
interact with primary content." "Modal side sheets are preferred in compact breakpoints, like mobile, due to limited screen size. They
can display the same kinds of content as standard side sheets, but must be dismissed in order to interact with the underlying content."
"Modal side sheets on smaller screens can transition to standard side sheets at larger screen sizes." Anatomy of the standard one:
"Divider (optional), Headline, Container, Close icon button"; of the modal one also "Back icon button (optional) … Divider (optional),
Action buttons (optional), Scrim". "Close icon button (optional) … A close icon button is highly recommended, increases accessibility,
and makes focused side sheets easier to close." "Action buttons (optional): Buttons represent actions available from a side sheet.
Examples: Save, Edit, Download." Specs, both kinds: "Bottom actions height 72dp", "Bottom actions alignment (horizontal) Left",
"Max-width 400dp". Accessibility: "Material requires that a close affordance, such as a close icon button, is always present within a
side sheet." "The accessibility role for a side sheet is Dialog."

**App bars.** "Use an app bar to provide content and actions related to the current page, such as page navigation actions, headlines,
images, and 1–2 essential actions." "The information and actions in the app bar should be contextual and specific to a page, but can
also include global product controls, such as search or notifications." "App bars should only have one action, two if necessary. The
primary action should alter or exit the entire page, like Send, Save, or Edit." "If the product has many actions, place those in a
toolbar. Avoid placing an overflow menu in the app bar when possible." "To boost visibility of a primary action, change the style of the
icon button to filled or tonal, and consider using a wide icon button. Avoid using multiple filled or tonal buttons." "Up to two icon
buttons can be placed after the headline, aligned to the trailing edge of the app bar." Specs: "The app bar's trailing icon buttons can
be replaced with a single, primary, or tonal filled icon button in default or wide sizes." Subtitle: "Subtitles can add additional
context to a page." (Small app bar: headline "Title large", subtitle "Label medium".) Accessibility: "Focus should initially land on the
leading button, since it's the first interactive element of the app bar."

**Full-screen dialog.** "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete."
Anatomy: "Header region, Icon (close affordance), Headline (optional), Button label text, Divider (optional)." "When a full-screen
dialog is closed without being saved, a basic dialog appears in front of it to confirm selections should be discarded without saving
changes." Buttons: "Dismissive actions are never disabled." "Don't place dismissive actions to the right of confirming actions."

**Snackbar.** Dialogs page: "Don't use dialogs for low- or medium-priority information. Instead use a snackbar."

**Where M3 is silent.** It prints no rule for a side sheet whose changes apply at once (it only says the sheet "complements" the primary
content and lists action buttons as optional), nothing about autosave or a save status, and nothing about a **labelled** button in an
app bar: its trailing parts are icon buttons, at most one filled. See section 9 (a deviation the owner chose, decision 1).

## 2. Today in code

**The page form** (`EntryForm.tsx` in `FormFrame.tsx` in `Screen.tsx`), for pages and posts alike:

- Top bar: below expanded the back arrow, the title and the status under it, the page actions (`Preview`, `View on site`), the
  notifications bell. From expanded the bar has the logo and the bell; the title, the status and the page actions stand in a row under
  the bar, at the top of the content.
- Status (`versionStatus`): `Saving…` / `Saved` / `Not saved` while something is unsaved and autosave runs; otherwise `Draft`,
  `Unpublished changes`, `Scheduled · <time>`, `Published · Changed <when>`, `Editing the live page`. It is plain text, not a live region.
- Floating bottom bar (`ActionSheet .editor-save-bar`): `Preview` (outlined, hidden on a phone when `Publish` is there), `Save draft`
  (tonal, only while dirty), `Publish` (filled). It shows while dirty, saving, or while there is something to publish.
- Rows at the end of the form, above `Delete`: `Schedule`, `Cancel schedule`, `Unpublish`, `Discard draft` (`publishBar.actions`).
  On a page with changes waiting, the version switch (`Live` / `Changes`) and its notice are at the top of the form.
- Autosave (`useAutosave`): only with `R2 caching` on; after 1.5 s without a change it keeps the text in R2 and moves it to git as the
  draft after 5 minutes idle or on leaving. It does **not** run when the live page is being edited (`editsLive`), on an earlier version,
  while a new address is typed, or while the text cannot be saved (a wrong field, a wrong block, an image not uploaded yet): then the
  status says `Not saved` and only `Save draft` (or `Publish`) keeps the change.

**The block sheet** (`BlockDialog.tsx`, `sheetLook` in `sheetPlacement.mjs`):

| Step | From expanded (≥ 840) | Below expanded |
| :--- | :--- | :--- |
| `fields` (a block's settings, an image) | standard side sheet, not modal, the page shrinks beside it; `Save` (or `Insert`), `Cancel`, and `Remove` for a block already on the page | modal side sheet over a scrim (on a phone 375 px it leaves a strip of scrim, it is not full screen); `Save` (`Insert`), `Cancel` |
| `section` (section settings) | standard side sheet; `Save`, `Cancel` | bottom sheet; `Save`, `Cancel` |
| `row` (a row of a block typed in place) | standard side sheet, **already live**: each change goes to the block at once, no `Save`, no `Cancel` | bottom sheet, live |
| `choose` (Insert) | bottom sheet / dialog | bottom sheet |

- The sheet edits a copy (`values`); `Save` checks it (`problemAt`, `useWrongField`: the field marked, a snackbar "not saved") and
  answers; the block card then writes the props with one `setNodeMarkup` (`MarkdownEditor.tsx`, `edit`), so a sheet's save is one undo
  step. Closing a changed sheet asks Keep / Discard / stay (`closeChanged`).
- From expanded the block's `⋮` has no pen and no trash: they are in the side sheet (`editsInPanel`).
- `BlockDialog` is also used by a rich text field (`fields.tsx`) and the fixed pages' sections (`SectionsField.tsx`), whose forms keep
  their own `Save changes` bar.

## 3. The page form after this change

### 3.1 Phone, 375 px

```
┌───────────────────────────────────────┐
│ ←  About us                     🔍  🔔 [Publish] │   small app bar: back, title, search, bell, Publish (filled)
│    Draft · Saved                                 │   subtitle: the status, a polite live region
├───────────────────────────────────────┤
│ [+] [Undo] [Redo] ▏[Section] [Preview] [⋮]       │   the one bar (text editor), sticky; Preview is a main tool
│                                                   │
│  # About us                                       │
│  We help small firms …                            │
│  ┌ FAQ ─────────────────────────────┐             │
│  │ …                                 │             │
│  └───────────────────────────────────┘             │
│                                                   │
│  Search engines ▸   Sharing ▸   Versions ▸        │
│  ───────────────────────────────────              │
│  Schedule                                         │   rows at the end, unchanged
│  Discard draft                                    │
│  🗑 Delete page                                   │
└───────────────────────────────────────┘
   (no floating bottom bar)
```

At 375 px the bell and the search icon both fit beside a short `Publish` (48 + 48 + about 90 dp, after the 48 dp back arrow); a long
title truncates, as today (M3: "Don't wrap text in a small app bar"). When the window is too narrow for all, the bell moves out first
(it is in the main menu too; owner decision 4).

### 3.2 Computer, 1280 px

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ◆ Morpheme site                                              🔍   🔔   [Publish] │  app bar: Publish at the top right
├──────────┬─────────────────────────────────────────────────────┬───────────────┤
│  rail    │ Pages ›  About us   Draft · Saved                    │ FAQ        ✕  │  standard side sheet, live:
│          │ ┌ bar ────────────────────────────────────────────┐ │               │  headline and close only,
│          │ │ [B][I][Style▾][List▾] ▏ [+][Undo][Redo][Section] │ │  Question     │  no Save, Cancel or Remove
│          │ │                       [Preview] [⋮]             │ │  [_________]  │
│          │ └─────────────────────────────────────────────────┘ │  Answer       │
│          │  # About us                                         │  [_________]  │
│          │  ┌ FAQ (selected) ─────────────┐                    │  Max rows     │
│          │  └─────────────────────────────┘                    │  [ 5 ]        │
└──────────┴─────────────────────────────────────────────────────┴───────────────┘
```

From expanded, `Publish` is in the top app bar, which spans the window (M3: "It should always span 100% of the window width"), at its
trailing end. The title row under the bar keeps the breadcrumbs, the title and the status; its page actions (`Preview`, `View on site`)
leave it.

### 3.3 What goes where

| Part | Today | After |
| :--- | :--- | :--- |
| `Publish` (and `Publish changes`) | floating bottom bar, filled | app bar, trailing, the one filled button; busy while the site updates, as today |
| `Save draft` | floating bottom bar, tonal | gone; the draft saves itself (3.4 for when it cannot) |
| `Preview` | floating bar and page actions | the one bar's main tools (after Section settings), into its `⋮` when contextual tools fill the bar; in the command palette |
| `View on site` | page actions | the one bar's `⋮`, last group; in the command palette |
| Status | text under or after the title | the same words, as the app bar's subtitle below expanded and after the title from expanded; a polite live region (section 7) |
| `Schedule`, `Cancel schedule`, `Unpublish`, `Discard draft` | rows above `Delete` | unchanged (no overflow menu in the app bar); also in the command palette (its registry, 0.18) |
| Version switch and its notice | top of the form | unchanged |
| Search icon (command palette) | 0.18 palette spec | app bar, before the bell |
| Notifications bell | app bar | unchanged: M3 counts it as a "global product control" beside the one action |

### 3.4 When the draft cannot save itself

Autosave does not run in five cases (section 2). Without `Save draft`, a change there would only be kept by `Publish`. The app bar then
shows **`Save`** as its second action (a text button before `Publish`; "two if necessary"), and the status says `Not saved`:

| Case | App bar | Status |
| :--- | :--- | :--- |
| Autosave runs | `Publish` | `Saving…` / `Saved` (or `Not saved` with a retry, as today) |
| `R2 caching` off | `Save`, `Publish` | `Not saved` while changed |
| Editing the live page (`Live` in the switch) | `Save` alone, filled (it writes the live page; there is nothing to publish) | `Editing the live page` / `Not saved` |
| An earlier version opened | `Save`, `Publish` | `Not saved` |
| A new address typed | `Save`, `Publish` | `Not saved` |
| An image added, not uploaded yet | `Save`, `Publish` | `Not saved` |
| A wrong field or block | `Publish` (it stops and marks the field) | `Not saved · Fix the marked field` |

`Save` there writes what `Save draft` writes today (same code path, same commit message). Owner decision 2: `Save` shows only in these
cases, as a text button.

## 4. The block sheet

### 4.1 Large screens: a live standard side sheet

From expanded every step that is a standard side sheet is live: `fields` (a block's settings, an image's), `section` and `row` (already
live today).

- Parts: headline, close icon button. No bottom actions, so no divider over them. M3: action buttons are optional; the close button is
  "highly recommended" and, by the accessibility page, "always present".
- **Live.** Each change of a field writes the block's props at once, through the same `setNodeMarkup` the card's `edit` uses today, so
  the page beside it shows it and the page's autosave keeps it. The sheet keeps no copy and asks no Keep / Discard question; the close
  button, `Esc`, or a tap on another block only closes it.
- **Remove** leaves the sheet. From expanded the block's `⋮` gets `Remove` back (and the pen is not needed: a tap opens the sheet).
- **A new block** (`Insert` and a block with fields not typed in place) goes in at once with its default values, as a block typed in
  place does today, and its sheet opens beside it, live. There is no `Insert` button; Undo or `Remove` takes the block out (owner decision 3).
- **The look is fixed while it is open.** A window that crosses the expanded breakpoint while a sheet is open keeps the sheet's look
  until it closes (today it switches mid-edit, which would switch between live and Save/Cancel with values in flight).

**A field that is invalid or half typed.** Every keystroke is written to the block, valid or not, so what the page shows is what the
sheet says. The check that `Save` runs today (`problemAt`) runs on every change, without a snackbar:

- A field is marked (the same `WrongField` mark) once it has been left wrong (on blur), or at once when it already was wrong; it is
  never marked while it is being typed in for the first time. Its supporting text says why (`ProblemNote`, as today).
- The block's card on the page gets the problem mark the page's own check already gives a block (`blockProblems`).
- The page cannot be autosaved while a block is wrong (today's rule: `autosaveText` returns null on a block problem), so the status says
  `Not saved · Fix the marked field`. `Publish` stops, opens the block's sheet at the field and says why in a snackbar (`useWrongField`
  with the form's `open`). Owner decision 5: a wrong block is not autosaved, and the status says why; a draft file the site's check
  would refuse is never written.

### 4.2 Phone and medium: the sheet keeps Save and Cancel

Below expanded the sheet covers the page (a scrim, or the whole screen), so the page's `Publish` is out of reach and the sheet keeps its
own save. This is the owner's rule for full-screen sheets, used here first; 0.20's settings sheets reuse it.

- **Compact (< 600):** the theme's full-screen dialog (`theme/ui/Dialog.tsx`, `kind="full-screen"`): in its header the close icon
  (the dismissive action, named `Cancel`), the headline (the block's name), and `Save` (`Insert` for a new block) as its text button.
  This is what M3 prints for a full-screen dialog. Today's modal side sheet leaves a strip of scrim on a phone; this makes it full screen,
  as the owner describes it.
- **Medium (600–839):** the modal side sheet as today, with its bottom actions `Save` (`Insert`) and `Cancel`, start-aligned (M3: "Left").
- No `Remove` in either (it is in the block's `⋮`, as today below expanded).
- Not live, no autosave: the sheet edits a copy; `Save` checks it (today's `useWrongField` and snackbar) and writes it as one undo step.
- Closing it changed (the close icon, `Esc`, the phone's back) asks today's question (Keep / Discard / stay), which is M3's "a basic
  dialog appears in front of it to confirm selections should be discarded".
- Only one Save is visible: the page's `Publish` (and `Save` of 3.4) are under the sheet.

Owner decision 6: on a phone the close icon is `Cancel` and `Save` is a word at the top right; there is no separate `Cancel` button.
Owner decision 7: the medium width (600–839) uses the modal side sheet with `Save` and `Cancel`, as above.

### 4.3 What happens to a sheet a phone user leaves open

While the phone sheet has changes, they are kept in a **hidden copy** in this browser (`localStorage`, one per page):
`{ page, block: { index, type, before }, values, at }`, written 300 ms after each change.

- `Save`, `Cancel`, Discard in the close question, or closing it unchanged deletes the copy.
- Anything else that ends the sheet (the tab closed or reloaded, the phone killed the tab, the editor updated itself, a sign-in that
  expired) leaves it.
- When the page form opens again and a copy exists for it, the editor asks, as a basic dialog: **"Restore your unsaved changes?"**,
  with `Discard` and `Restore`. `Restore` opens that block's sheet with the copy in it, still not saved; `Discard` deletes the copy.
- The copy is offered only while the block is still where it was: the same index and type, and its props still equal `before`.
  Otherwise, or after 7 days, it is deleted without asking (it could not be put in the right place).
- The page's own autosave does not take the sheet's values: they are not on the page until `Save` (the owner's rule: no autosave on a
  phone sheet).
- Switching apps or locking the phone does nothing: the sheet stays open with its values, as today.

The copy is a small helper with no React (`src/sheetCopy.mjs`: `keep`, `take`, `drop`, `matches`), unit tested.

### 4.4 How Undo covers sheet changes

The live sheet writes into the text editor's document, so its changes are in the same history as typing (the bar's `Undo` / `Redo`,
`Ctrl+Z` / `Ctrl+Shift+Z` outside a field).

- **One step per field.** Changes to one field while it has the focus are one undo step (the transaction closes the history group when
  the focus moves to another field or the sheet closes: `closeHistory`). A pick (a switch, a choice, an image, an icon) is one step. A
  new block put in by `Insert` is one step.
- **The sheet follows the block.** After `Undo` or `Redo` the open sheet reads the block's props again; when the block is gone (the
  insert undone), the sheet closes.
- **`Ctrl+Z` in a sheet's text field** is the field's own undo (the browser's), whose result is written to the block like any change.
  Outside a text field it is the page's undo.
- On a phone (4.2) the sheet's `Save` is one undo step, as today.

## 5. Posts, and other forms that use the block sheet

- **Posts** use the same form (`EntryForm`): the same app bar, status and `Publish`, and the live image sheet from expanded. A post has no
  block list, so only the image and section steps apply.
- **Fixed pages** (`SectionsField`) and **rich text fields** (`fields.tsx`) use the same `BlockDialog`. Their sheet becomes live from
  expanded the same way (one rule for the component); its changes go into their form, saved with that form's own `Save changes` bar,
  which stays until 0.20. So they too show one Save.

## 6. Keyboard and screen readers

- The app bar's order is back, title, search, bell, `Publish` (and `Save` before it in 3.4); `Tab` reaches them in that order (M3: focus
  "should initially land on the leading button").
- The status is a polite live region (`role="status"`) in one place per width (the copy hidden by the breakpoint is `display: none`, so it
  is not read twice). It announces changes between `Saved`, `Not saved` and `Not saved · Fix the marked field`, and the result of
  `Publish`; `Saving…` is not announced (it would speak every 1.5 s while typing).
- `Publish` keeps its busy state (`aria-busy`) while the site updates, as today.
- The live side sheet is a non-modal region (M3: "The accessibility role for a side sheet is Dialog"; `role="dialog"`, not modal), labelled by its
  headline; focus moves into it when it opens from a block and back to the block when it closes; `Esc` closes it.
- The full-screen dialog is modal (`aria-modal="true"`), focus starts on its first field, `Esc` asks the close question.
- `Ctrl+S` (`⌘S`) saves now: it sends the autosave at once, or runs `Save` in the cases of 3.4, and never opens the browser's save
  dialog. (Today it is not bound; small, in PR 4.)
- The restore question is a basic dialog: focus on `Restore`, `Esc` keeps the copy for next time.

## 7. Texts (en-US first, da-DK)

| Key (proposed) | en-US | da-DK |
| :--- | :--- | :--- |
| `forms.versions.autosave.notSavedProblem` | `Not saved · Fix the marked field` | `Ikke gemt · Ret det markerede felt` |
| `blocks.restoreTitle` | `Restore your unsaved changes?` | `Vil du gendanne dine ugemte ændringer?` |
| `blocks.restoreText(block)` | `Your changes to ${block} weren’t saved.` | `Dine ændringer i ${block} blev ikke gemt.` |
| (existing) `history.restore`, `app.discard` | `Restore`, `Discard` | `Gendan`, `Kassér` |
| (existing) `common.save`, `common.cancel`, `blocks.insert`, `forms.versions.publish` | `Save`, `Cancel`, `Insert`, `Publish` | `Gem`, `Annuller`, `Indsæt`, `Udgiv` |

`forms.versions.saveDraft` (`Save draft` / `Gem kladde`) is removed in the last PR, once nothing reads it. The words follow M3's word
choice and the `site-editor-writing` skill (sentence case, `’`). `npm run check:language` covers them.

## 8. Release notes

One `paragraph` for the whole change (skill `release-notes`: "Several changes to the same screen or feature are one note"), mark
`improvement` (a new place for parts that exist). Written by the first visible PR; later PRs update the same pending note.

- en-US, title **Saving a page**: "A page has one way to save. It saves itself as a draft while you write, and Publish is at the top
  right. On a computer a block’s settings change the page at once and Undo takes a change back; on a phone the block’s sheet keeps Save
  and Cancel."
- da-DK, title **Gem en side**: "En side har én måde at gemme på. Den gemmer sig selv som kladde, mens du skriver, og Udgiv står øverst
  til højre. På en computer ændrer en bloks indstillinger siden med det samme, og Fortryd tager en ændring tilbage; på en telefon har
  blokkens ark stadig Gem og Annuller."

(Check the Danish word for the block's sheet against `src/i18n/da-DK/` when it is written; the text above is a draft.)

## 9. Deviations

- **A labelled `Publish` button in the app bar.** M3 prints icon buttons as the app bar's trailing parts, and "a single, primary, or
  tonal filled icon button in default or wide sizes". A filled button with the label `Publish` is not printed. The owner chose it
  (decision 1, 14 Nov 2026), so the PR that moves `Publish` adds it to `docs/material-deviations.md`: what Material says (the two quotes), what we do (a
  filled common button with a label, and `Save` as a text button before it in 3.4), why (a word cannot be misread; M3's own examples of
  a primary action are words: "Send, Save, or Edit"), the owner's approval with its date (14 Nov 2026) and the PR.
- Everything else follows what M3 prints: the standard side sheet without action buttons (optional), the modal side sheet and the
  full-screen dialog with Save, no overflow menu in the app bar, one filled button, the search and the bell as global controls. The live
  side sheet, the save status and the hidden copy are where M3 is silent (section 1); the nearest patterns are named above.

## 10. Checks

`npm run check` on every PR. For the visible PRs `npm run build`, then `npm run check:screens` (both widths) and `npm run check:demo`.
New assertions in `scripts/editor-screens.mjs`:

- **1280 px:** a block's sheet has no `Save`, `Cancel` or `Remove` and has a close button; a change of a field shows in the page at
  once; `Undo` takes it back and the sheet shows the old value; `Remove` is in the block's `⋮`; the page has no `.editor-save-bar`; the
  app bar has `Publish` as its last button and no other filled button; the status has `role="status"`; `Preview` is in the bar.
- **375 px:** the block's sheet is a full-screen dialog with `Save` and a close button named `Cancel`; the page's `Publish` is not
  reachable while it is open (inert); one Save is visible; a change, then a reload, offers "Restore your unsaved changes?", and
  `Restore` opens the sheet with the change; `Save` deletes the copy.
- **Both:** no screen of the page form shows two buttons named `Save` (or `Save` and `Save draft`); with `R2 caching` off the app bar has
  `Save` and `Publish`.
- Unit tests: `sheetCopy.mjs`, the app bar's action rule (`pageBarActions(state)` → which buttons, 3.4's table), the history grouping.

`check:themes` after the theme's dialog or side sheet is touched; `check:contrast` by hand is not needed (no new colour).

## 11. Build plan (small PRs into `0.18`)

Each PR is mergeable on its own, has a changeset (`minor` when visible, `empty` otherwise), and passes `check`. Every visible PR carries
this rule:

> When a change the owner can see (the editor or the site) is done and `check` is green, add before and after screenshots of every
> changed screen to a comment on your own pull request, as the `pm` skill's *Screenshots in the pull request* says, and tell the PM with
> the link and head sha. A change nobody sees needs none.

| PR | What | Level | Depends on |
| :--- | :--- | :--- | :--- |
| 1 | **Live side sheet from expanded.** `fields` and `section` steps write at once (`setNodeMarkup` per change), no bottom actions, no close question; `Remove` back in the block's `⋮` from expanded (`editsInPanel` no longer hides it); the look fixed while open; the sheet follows `Undo` / `Redo`; one undo step per field focus (`closeHistory`). New blocks go in at once, with no `Insert` button (decision 3). Also for `SectionsField` and rich text fields. Writes the release note. | `minor` | — |
| 2 | **Wrong fields in the live sheet.** Check on every change, mark on blur, the block's card marked, `Not saved · Fix the marked field`, `Publish` opens the sheet at the field. | `minor` | 1 |
| 3 | **The phone and medium sheet.** Compact: the theme's full-screen dialog with `Save` (`Insert`) and the close icon as `Cancel`; medium: modal side sheet with `Save`, `Cancel`; the hidden copy (`src/sheetCopy.mjs`) and "Restore your unsaved changes?". | `minor` | — (parallel to 1) |
| 4 | **Preview and View on site in the one bar.** `Preview` a main tool, `View on site` in `⋮`; both leave the page actions; both in the command palette's registry if it is merged, else a follow-up line there. `Ctrl+S` saves now. | `minor` | — |
| 5 | **Publish in the app bar; the floating bar goes.** `Publish` trailing in the app bar at every width; `Save` there only in 3.4's cases; the status a polite live region; `.editor-save-bar` no longer drawn by the page form (other forms keep it); the deviation entry in `docs/material-deviations.md` (decision 1, owner's approval of 14 Nov 2026); on a phone the bell leaves the app bar first when it is too narrow (decision 4). | `minor` | 4 (so `Preview` is never lost) |
| 6 | **Clean-up.** Remove `saveDraft` texts and the page form's unused `FormFrame` paths; update the comments in `FormFrame.tsx`, `BlockDialog.tsx`, `sheetPlacement.mjs`; mark this spec built. | empty | 1–5 |

PRs 1, 3 and 4 can run side by side. Until 1 and 5 are both in, the screen can still show two saves at expanded (the sheet's or the
bar's); the owner sees the whole rule after 5.

## 12. Owner decisions (14 Nov 2026)

The owner accepted every recommendation of the first draft (via the 0.18 PM, 14 Nov 2026). They are folded into the body and the build
plan above.

1. **`Publish` in the app bar is a filled button with the word `Publish`**, recorded as a deviation in `docs/material-deviations.md`
   with the owner's approval and its date (section 9; PR 5).
2. **`Save` shows in the app bar only when the draft cannot save itself** (R2 caching off, editing the live page, an earlier version,
   a new address, an image not uploaded yet), as a text button before `Publish` (3.4; PR 5).
3. **A new block from `Insert` on a computer goes in at once** with its sheet open live; there is no `Insert` button. `Undo` or
   `Remove` takes it out (4.1; PR 1).
4. **On a phone the bell leaves the app bar first** when the bar is too narrow for back, title, search, bell and `Publish`; search and
   `Publish` stay (3.1; PR 5).
5. **A wrong block field is not autosaved**, and the status says why (`Not saved · Fix the marked field`); a draft file the site's
   check would refuse is never written (4.1; PR 2).
6. **The phone's full-screen sheet:** the close icon is `Cancel`, `Save` (`Insert` for a new block) is a word at the top right, and there
   is no separate `Cancel` button (4.2; PR 3).
7. **The medium width (600–839)** uses the modal side sheet with `Save` and `Cancel`, like the phone, with the hidden copy (4.2, 4.3;
   PR 3).
