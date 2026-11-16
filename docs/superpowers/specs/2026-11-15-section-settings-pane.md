# Section settings in a pane (owner decision, 15 Nov 2026)

Owner: "The settings should show in the right pane and not be a dialog. Read the MD3 rules for panes." From 600 dp the
section settings are a standard side sheet (supporting pane) at the right of the editor; below 600 dp they stay the page
from #753.

## What M3 prints

Read 15 Nov 2026 with Playwright (page text; the spec's token tables stay collapsed, so only the printed numbers are quoted):

- `/foundations/layout/canonical-layouts/supporting-pane` (= `/foundations/layout/canonical-examples/supporting-pane`),
  `/list-detail`, `/overview`
- `/components/side-sheets/overview`, `/specs`, `/guidelines`, `/accessibility`
- `/foundations/layout/scaffold/panes`, `/foundations/layout/breakpoints`, `/foundations/layout/layout-overview/adaptive-design`,
  `/foundations/layout/understanding-layout/parts-of-layout`, `/window-size-classes`

**When a pane is beside the content**

- Supporting pane: "Use the supporting pane layout when the secondary content is only meaningful in relation to the primary
  content." Settings of a section are that. Primary area "typically about two-thirds".
- Placement table: Compact or Medium: pane **below**, width flexible. Expanded: pane **leading or trailing, fixed 360 dp**.
  Compact: "A bottom sheet can be useful". Medium: "should appear below the focus pane".
- Side sheets (guidelines): "Standard side sheets are supplementary surfaces used **mostly in medium to expanded
  breakpoints**, like tablet and desktop"; "They remain visible while people interact with primary content." "Modal side
  sheets are preferred in compact breakpoints." Content may be "Form controls shown in a side sheet for app settings".
- Panes (scaffold/panes): Medium recommends 1 pane, 2 allowed; Expanded and Large 2 recommended. "Fixed-and-flexible layout
  ... common for expanded, large, and extra-large ... The fixed pane is often temporary, and used for side sheets."
  "Co-planar: ... persistent utilities like tool panels should be co-planar with primary content." "Floating: temporary
  tasks should remain floating regardless of breakpoint, such as a dialog."

**Width and how the content behaves**

- Side sheet specs: start/end padding 24 dp; padding between top elements 12 dp; bottom actions height 72 dp, top padding
  16 dp, bottom padding 24 dp, alignment left; **max-width 400 dp**; margin when detached 16 dp. Standard colours: surface,
  on surface variant, outline variant (divider). Fixed pane recommended 412 dp at extra-large (side sheet max 400).
- "When a standard side sheet opens, the body area shrinks to accommodate the sheet's width while maintaining a margin on
  the body's trailing edge." The pane never overlays; a floating or modal sheet does.
- "Place side sheets along the edge of the screen, usually on the right side ... They can be slightly inset by 16dp."
  Scrolls vertically on its own, never horizontally.

**Header, close, actions**

- Anatomy: container (only required element), headline, **close icon button** (optional, but "Material requires that a
  close affordance ... is always present within a side sheet"), optional back icon, optional divider (separate "Action
  buttons from content"), optional action buttons ("Examples: Save, Edit, Download. Use elevation, fill, and tone to
  call attention to specific actions"). Accessibility page lists the order: Headline, Close, Cancel, Save.

**Focus (accessibility)**

- Side sheet role: Dialog. Tab lands on the actions; Space/Enter activates.
- Scaffold/panes: co-planar panes: "The focus order should match the visual arrangement of the panes on screen." Non-modal
  floating pane: "other parts of a product can be interacted with. Focus should be able to move to and from the pane."
  Modal: focus moves to the first element; on close back to the trigger.
- M3 prints no rule for "no control has focus on open"; that is the owner's dialog rule, applied here (pane container takes
  focus, `tabindex="-1"`, no ring).

## What M3 omits or where pages disagree

- The supporting-pane page puts the pane **below at medium** (600-839 dp); the side-sheet page says standard side sheets
  are used **mostly at medium to expanded**. The owner's decision (a pane at the right from 600 dp) follows the side-sheet
  page and priority order 1 and 2 (the owner's decision plus M3's side-sheet guideline) over the supporting-pane table. To
  be recorded in `docs/material-deviations.md` as a note, not a deviation of the sheet itself. The fixed width is the
  side sheet's (max 400 dp, the theme's `--side-sheet-width` 22.5 rem = 360 dp at the default size), not a new number.
- M3 prints no behaviour for Save in a live pane; the editor's standard side sheet beside the page is already live (each
  change goes to the section at once, one undo step per field, no Save or Cancel: `liveSheet.mjs`); the section settings
  join it.
- No page prints how a pane behaves between 600 and 839 dp when the window is also narrowed by a navigation rail; the body
  shrinks (guidelines, adaptive design).

## What we build

From 600 dp the section settings use the theme's standard side sheet (`SiteSideSheet`, `kind="standard"`, the editor's
`editor-side-sheet`): beside the page, the page content shrinks and stays usable, headline and a close icon button, no
modal, no scrim. Focus: the pane container takes focus (tabindex -1, no ring). Below 600 dp: the page from #753 (unchanged).
Motion: the theme's springs only.

## Panes from inside a pane (nesting)

M3 prints no second level of side sheet. It prints that "People can navigate to another region within the sheet" and "Side sheets can contain a back icon for navigation" (side-sheets/overview). So when a pane opens from inside a pane (the Link sheet from a block's fields), the inner content replaces the pane's content, with a back icon button before the headline and the close button kept; Back returns to the outer content. A second pane never opens beside the first.

## Dialogs and settings

Owner rule, 15 Nov 2026: "Dialogs are only for short messages, not for settings." M3 allows a basic dialog for a form at medium and expanded, so this is recorded as a deviation (`docs/material-deviations.md`, B3) with M3's dialog text quoted.

## The pane host (pane PR 3a)

`src/PaneHost.tsx` is the one place of the pane: an empty slot in `App.tsx`. A screen feeds it with `usePane(entry)` on each render and puts the returned `portal` in what it renders (a portal, so the content keeps the screen's own React context, such as the form's fields). The markup and the look are the theme's standard side sheet (`SiteSideSheet`) and `.editor-side-sheet`; the host is editor state only. The pane fed last is shown; one opened from inside another is on top of it, and when it goes the first shows again (the back icon for it needs the theme's side sheet to print one: M3's side-sheets overview prints "Side sheets can contain a back icon for navigation"; the theme's `SideSheet` has none yet, so it waits for the owner's yes in pane PR 3b). `BlockDialog.tsx` is the first screen on it.
