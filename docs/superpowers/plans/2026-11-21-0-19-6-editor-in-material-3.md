# 0.19.7 The editor in Material 3 (plan)

**0.19.7** (owner, 25 Nov 2026: "everything we have started ships along saras fix as 0.19.7, and then the rest in 0.19.8"). Its batches 1 to 8 were started on 25 Nov and ship in 0.19.7 (`plans/2026-11-22-0-19-7-ui-fixes.md`, *Release*), on `feature/0.19.7-ui-fixes`, PM `/pm 0.19.7`. Its version is 0.19.7, set by #1220.

Status: **21 November 2026.** Roadmap: `plans/2026-11-14-roadmap-0-18-to-0-24.md`, item 7. The audit it is built from:
`specs/2026-11-21-editor-screens-m3-audit.md` (0.19.5 batch 14, #1120): 392 rows in 8 batches, and 110 rows of the page and post editor
apart.

Already done in 0.19.5 (owner, 21 Nov 2026, after seeing them on staging): batch 17 (#1123) removed the rail's colour override
(audit row 1.16), and found the search bar (row 1.28) and the dashboard's outlined cards already matching M3 on the feature. Those
rows are not part of 0.19.7.

## What 0.19.7 is

Every editor screen (theme page, settings, lists, dialogs, dashboard, start screen, sheets) becomes the theme's Material parts with
Material 3's values. The page and post editor's own bar, overflow menu, and text and block menus are not part of it (the audit's
*Page and post editor workspace* list waits for the owner).

The owner's rules for it:

- **M3 wins in the editor's screens** (owner, 21 Nov 2026: "we will apply md3 styles in the editor as well"). Where M3 and WCAG 2.2 AA
  differ, M3 wins and `theme/accessibility.json` names the shortfall. Only the page and post editor's bar and menus are outside M3, and
  they always meet WCAG 2.2 AA.
- **The recorded editor exceptions go too** (owner, 21 Nov 2026, choosing "M3 wins, except imitations"). This replaces the earlier
  status line "editor exception, kept as it is" on FL1, P2, P3, C1, B1, B2, B3 and SV6 in `docs/material-deviations.md`. Two entries
  stay because they imitate another product: **CS2** (the PageSpeed colours) and **CS3** (the Google result preview).
- **No own components** (skill `developer`). A screen that needs something a theme part does not offer gets the M3 variant in the
  theme, with the owner's yes through the PM. It never gets its own class.
- **Outlined buttons, not text buttons** (owner, 24 Nov 2026: "Md3 do no longer recommend text buttons, instead they recommend
  outlined. When you go through the editor convert all text buttons to outlined buttons"). Every text button in the editor's screens
  becomes an outlined button, dialog actions included. A link is not a button (owner, 24 Nov 2026: "Links and buttons are two
  different things"): something that goes to another page or address stays a link (`<a>`), drawn as a link, never as a button. The
  page and post editor's bar and menus are not part of it.
  **The site too** (owner, 24 Nov 2026: "Yes and yes, but not Sarah"): the default theme Material's blocks and parts on the site use
  outlined buttons where they use text buttons today, in the same batch (1, shared parts). The Button part keeps its text kind, so a
  theme or app that uses it keeps working: Venus and Sara's app are not changed.
- **No `check:contrast` per batch.** One final scan runs when Material's M3 work is done (`specs/2026-11-21-base-theme-notes.md`).

## The recorded exceptions

| Entry | In 0.19.7 | Later |
| :-- | :-- | :-- |
| FL1, footer links 36 px | They are links, not buttons (owner, 24 Nov 2026): they stay links, with a 48 dp target. | |
| EP1, score ring | Built on M3's circular progress indicator. Its good, average and bad tones are the status colours of CS1, the one recorded colour exception for status. | |
| EP2 and CS4, colour and icon pickers | Built from M3 parts (slider, segmented button, icon button with its selected state). Where M3 has no part, the nearest M3 pattern, named in the pull request. | |
| CS5, the preview frame's white | Goes: the frame is a surface role. | |
| N6, the drawers' fixed width | Goes: the drawer hugs its content between M3's 220 and 360 dp. | |
| P3, more than two top bar actions | Actions after the second move into the top app bar's overflow menu. | The search app bar (0.25.0) ends the entry. |
| B3, settings in a pane from 600 dp | The batch reads the side-sheets and dialogs pages again. If the standard side sheet is M3's pattern for this, the entry moves to *Where Material 3 is silent*; otherwise the batch reports what M3 prints and stops. | |
| SV6, the search bar on the start screen | The same check as B3: "Add a search bar below a title to search specific content" may make it M3 already. Where M3's 360 dp minimum width and the 16 dp side margins clash on a narrow phone, the margins win and the bar narrows (owner, 21 Nov 2026). | |
| C1, B1, B2, the full-screen pages | Below 600 dp a full-screen dialog, from 600 dp a basic dialog or the side sheet (B3), as M3 prints. The theme Dialog's full-screen kind (DG1) comes back in the names batch before this one (owner, 22 Nov 2026: "the full screen dialog should be there"). | |
| P2, the browser's right-click menu | Not now. M3 wins here means the editor draws its own context menu, which is a feature with its own spec. | 0.25 (Screens), owner, 21 Nov 2026. |

## The audit's open questions, answered by the rules

- **Weight 600, and type written by hand:** both go. Every text takes its M3 type role (`mo-type-*`, `md.sys.typescale.*`).
  Weight 500 stays only where the role itself carries it (label and title roles). Before fixing sizes, a session reads the type
  scale tokens again (the audit's dump was a 404).
- **Spacing:** M3's 4 dp grid. `--mo-comp-editor-rhythm-*` and the off-grid `--mo-ref-space-25/75/125/150/250` steps go from the
  screens. Density follows only the steps M3 prints for it (DN2 to DN4 stand).
- **Shape and elevation:** only `--mo-sys-shape-corner-*` and `--mo-sys-elevation-level*`. `--mo-sys-block-radius*` and
  `--mo-sys-panel-shadow` are not used in the screens.
- **Token overrides in `src/*.css`** (audit pattern 4): they go. If the screen needs the value, the part offers it as an M3 variant.
  This covers the small icon button's 48 dp target, the menu's container colour (`surface-container`, as M3 prints) and the toolbar
  colour.
- **Focus ring:** M3's ring (`secondary`, 3 dp, 2 dp offset) in every screen. The editor's `primary` override stays only in the page
  and post editor, if WCAG needs it there. Batch 15 of 0.19.5 (focus ring) goes first.
- **Colour:** no `#fff`, grey, `color-mix` (except state layers and shadows) or opacity for a disabled state. Disabled is the part's
  own disabled state.
- **Motion:** the parts' own enter and exit motion. Own keyframes and `cubic-bezier` go.
- **Banners and notices** (M3 has no banner): an outlined card, the nearest M3 pattern. A message that goes away by itself is a
  snackbar.
- **A single create action:** a FAB or an extended FAB, not a FAB menu with one item.
- **Media tile selection:** `Checkbox`, as M3's lists and cards print selection.
- **A standard side sheet has no scrim and is not a modal `<dialog>`;** a modal side sheet has both. Each sheet takes the kind M3 prints
  for its use.
- **The parts gallery's sample frames** (tooltips held open, menus given room) are demo scaffolding, not findings. They still use
  tokens, not fixed sizes, where a token exists.
- **Drop target while dragging on the dashboard:** M3 is silent. The nearest M3 pattern is the dragged state's state layer and an
  outline in `outline`, named in the pull request.
- **Phosphor imports:** not an M3 finding. On `main`, all 81 files that import Phosphor components are on the allowlist, and
  `check:phosphor` is green. They move to `Icon` in the names batch of 0.19.6, where Phosphor leaves the CMS.
- **Dialogs** (owner, 21 Nov 2026, audit #1126): the actions are outlined buttons (owner, 24 Nov 2026, replacing
  text buttons) and focus goes to the first control when a dialog
  opens, as M3 prints. `src/ask.tsx` and `src/BlockDialog.tsx` change in batch 3.
- **The save bar** is a standard bottom sheet in the screens (EB1), so it is in scope. The text bar and the block's action row are the
  page and post editor's, so they are not.

## Batches (pull requests into `feature/0.19.7-ui-fixes`)

PM `/pm 0.19.7` owns the feature (cut from `main`). A row named in two batches is fixed in the batch of its first row.

0. **The version.** Set `version` to 0.19.7 (`plans/2026-11-19-version-at-feature-start.md`), with the audit as the batch list.
1. **Shared parts and token overrides** (audit batch 8). This goes first: fixing a part once removes rows in every other batch. It
   includes the type, spacing, shape and colour rules above, and any M3 variant a part must offer. That variant gets the owner's yes
   through the PM before it is built.
2. **Shell** (audit batch 1): rail, drawer (N6), top app bar (P3), screen frame, footer (FL1), logo.
3. **Dialogs, sheets, the save bar and the snackbar** (audit batch 4), with B3's reading.
4. **Forms and fields** (audit batch 5).
5. **Start screen, dashboard and widgets** (audit batch 2), with SV6's reading.
6. **Lists, media, selection, deleted items, redirects** (audit batch 3).
7. **Theme page and parts gallery** (audit batch 6), with the pickers (EP2, CS4), the score ring (EP1) and the preview frame (CS5).
8. **Settings, CMS, release notes, updates, apps and stores** (audit batch 7). Read `CommandPalette`, `AddFieldMenu` and
   `AppFormPage` line by line first; the audit read them less closely.

1 goes first. 2, 3 and 4 can run side by side after it, then 5 to 8. Each batch:

- reads the M3 pages of the parts it changes with Playwright (skill `material-3`);
- removes the deviation entries it ends, in the same pull request;
- keeps `check:screens`, `check:themes` and `check:a11y` green;
- adds the before and after screenshots (skill `developer`) and a release note line (skill `release-notes`).

## Done when

- Every row of the audit's main list is fixed, or recorded with the owner's yes.
- `docs/material-deviations.md` holds no editor-screen entry except CS2, CS3 and the ones that move to 0.20.0 or 0.25.
- The owner has reviewed the feature on the demo in light and dark.
- 0.19.7 has run on staging before the owner releases it.
