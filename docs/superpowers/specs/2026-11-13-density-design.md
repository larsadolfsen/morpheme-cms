# Density: more or less space in the editor and the theme (design proposal)

Status: proposal for the owner. No code. Written for a phone: plain words, short.

**Density** means how much fits on a screen. Dense: smaller rows and buttons, more on screen. Not dense: more air, less on screen.

Owner's words: M3 has "three different spacings, where the middle one is the standard … compact and wide or something like that. And I
wanted to support that as well … in the editor, this could be a setting. In the front end, it's up to the theme designer if it should
be a setting." And: "We use the density names from MD3."

## 1. What Material 3 says

Read on 2026-11-13, rendered with Chromium. Pages: m3.material.io/foundations/layout/grids-spacing/density (also
`/spacing`), `/foundations/layout/breakpoints/overview`, the Specs page of segmented buttons, lists, chips, text fields, buttons and
icon buttons; github.com/material-components/material-web.

**The PM's belief was right, with one more fact.** M3 density has **numbers, not names**, and **no looser step**.

- "The density scale is numbered, starting at 0 for a component's default density. The scale moves to negative numbers (-1, -2, -3)
  as space decreases, creating higher density."
- "Higher density is typically applied by decreasing the top and bottom padding or overall height by 4dp."
- Segmented button spec: height 40dp; "Density is only applied to the height. Each step down in density removes 4dp from the height."
  This is the only component page that gives its own density numbers. The others (chip 32dp, text field 56dp) give only the default
  size.
- "Text size shouldn't change as the container size scales." Content stays centred in the container.
- Two kinds of density: **layout** density (margins, spacers, padding of lists, tables, long forms) and **component** density (the
  size of one part). "Information density can be achieved through layout and design decisions without using component scaling."
- "Density shouldn't automatically change across breakpoints or orientation unless a person changes it." "People should be able to opt
  in to dense layouts and components … in settings."
- "Don't apply component scaling by default if it would result in a target below 48x48 CSS pixels." "Accessible targets should retain
  a minimum of 48x48dp, even if the visual element, such as an icon, is smaller." The settings that change density must themselves
  "use default target sizes (48x48 CSS pixels)".
- Don't use density for focused choices (a menu) or for parts that alert (snackbar, dialog).
- **compact, medium, expanded are breakpoints (window sizes), not density.** Compact is under 600dp, medium 600-839dp, expanded
  840-1199dp (plus large and extra-large). They are unrelated to density.
- **material-web has no density tokens.** Its roadmap lists "Density and spacing tokens" as work not done. Its component tokens
  (for example `--md-filled-button-container-height`) are one fixed height each.

**The names.** The page's text names no steps. Its demo image (an "Appearance settings" panel next to a mail list) has a
Density menu with three choices and an icon of lines each. In the frame I rendered, the labels read Cozy, Comfortable and Compact
(Compact selected). The owner's phone screenshot of the same page shows Large, Medium (standard, selected) and Small. The image
may show different words in different frames or versions; I could not see Large / Medium / Small myself. The owner's screenshot
decides: the product uses **Large, Medium, Small**. M3's numbers are the sizes behind them.

**Mapping (decided by the owner).** The numbers only go down from 0, so M3 has no step above the default. We map:

| Name | Step | What it does |
| --- | --- | --- |
| Large | +1 | 4dp more per part and gap than the default (not in M3's numbers: our one extension, listed in `docs/material-deviations.md`) |
| Medium | 0 | the default, today's look exactly |
| Small | -1 | M3 step -1: 4dp less |

M3's steps -2 and -3 stay in the mechanism (a theme may use them) but the editor does not offer them: the owner's image has three
choices.

**Sources I could not read.** M3's button and list-item Specs pages do not show their default heights as text in the rendered page, and
the M3 pages do not give density numbers for any part but the segmented button. I wrote no value from memory: where a number is not
read, the spec says so (section 2.2).

## 2. The design

### 2.1 The setting in the editor

- A **Density** choice with three steps: `Large` (+1), `Medium` (0) and `Small` (-1). Default `Medium`: today's look, exactly. A menu with an icon of lines per choice, as on the M3 page.
- Where: the account settings in the Library screen, beside Light / Auto / Dark (`src/Library.tsx`, `setTheme`). It is the same kind of
  thing: a taste of the person at that screen.
- Stored: **per user on the device**, in `localStorage` key `editor-density`, as the theme choice is (`src/theme.ts`, key
  `editor-theme`). Not per site: a phone and a desktop want different answers (M3: "Consider density settings in the context of a
  device"). A script in the head sets it before the first paint, so the page does not jump.
- **Scope (owner, 2026-11-13).** It applies to the whole editor **except the editing area of a page and a blog post**. What is typed in
  place there (text, and the blocks as drawn on the page) must stay as close to the real site as possible, so density never changes how
  that content is drawn: it keeps the theme's own spacing for the site, at every step. Everything around it follows density: menus,
  sheets, settings forms, lists, toolbars, the Library, the start screen and all other screens.
- **The line.** The content area is the box that holds the page's own blocks (the typed-in-place canvas and the page Preview).
  Density is switched off inside it by setting `--mo-density: 0` on that box, so a part inside it (a block drawn by the theme) reads
  the default even though `data-density` is on the root. The editor's own tools drawn over the content (the floating text toolbar, the
  block menu, the add-block buttons) are editor parts and follow density.
- No automatic change on a small screen (M3 rule above). The choice is the same on a phone and a computer, unless the person picks it
  there.
- The settings rows that hold this choice always stay at step `0` size, so a person can always go back (M3 rule above).

### 2.2 How the theme's parts read it

One attribute on `<html>`: `data-density="1 | 0 | -1 | -2 | -3"`. The theme turns it into one number:

```css
:root { --mo-density: 0; --mo-density-step: 4px; }
:root[data-density="-1"] { --mo-density: -1; }   /* 1, -2, -3 the same */
```

A part writes its size as `calc(<default> + var(--mo-density) * var(--mo-density-step))`. At `0` the sum is the default, so a part
that does nothing about density never changes. Only the steps move, in M3's 4dp: the height or the top and bottom padding, never the
text size.

**The rules (owner, 2026-11-13), and what the M3 page says about each.**

1. Strict 4dp steps on component heights and on top and bottom (vertical) padding. M3 page: "Higher density is typically applied by
   decreasing the top and bottom padding or overall height by 4dp." (Read.)
2. Medium (0) is standard. Small (-1) removes 4dp of vertical space, -2 removes 8dp, -3 removes 12dp. Large (+1) adds 4dp. M3 page:
   the scale starts at 0 and goes to -1, -2, -3. (Read; Large is ours.)
3. Horizontal padding (leading and trailing) is the same at every step, so text alignment and grids stay consistent. **I could not
   find this on the M3 page**: its text says only "Center the grouped element within the component container" and "Text size shouldn't
   change as the container size scales". It is the owner's rule and the spec follows it; it is not an M3 quote. Only height and vertical
   padding use `--mo-density`; left and right padding never do.
4. The image may shrink, the invisible touch target stays at least 48 × 48 dp (section 2.3). M3 page: "Accessible targets should
   retain a minimum of 48x48dp, even if the visual element … is smaller." (Read.)
5. No high density on focused single-task parts; use it on data-heavy screens. M3 page: "Don't increase density in UIs that involve
   focused tasks, such as selecting from a menu" and "in components that alert a person of changes, such as snackbars or dialogs";
   "Consider using higher density information design when people need to scan lots of information" (a data table is the page's own
   example). (Read.)

**How rule 5 and the owner's scope fit together.** Every part is in one of three groups. The three names work everywhere in the
editor outside the page and post editing area, except where a group says otherwise:

| Group | Parts | Large (+1) | Medium (0) | Small (-1) | -2 and -3 |
| --- | --- | --- | --- | --- | --- |
| **Data-heavy** (people scan a lot) | list rows (the Library, Files, Redirects, the start screen's page and post lists, own lists), tables (`DataTable`), the headers and filter chips directly above a list | +4 | standard | -4 | yes, -8 and -12, but only for a theme that asks; the editor's menu does not offer them |
| **Layout** (space around things) | gaps between sections, screen and column padding, toolbars, tabs, chip rows, buttons outside a dialog or menu | +4 | standard | -4 | no |
| **Focused single-task** | menus and dropdowns (including the exposed dropdown), dialogs, bottom and side sheets, snackbars, date, time, colour and icon pickers, the fields and switches inside a settings form (the form's gaps are Layout), the density setting's own rows, the FAB | +4 | standard | stays standard | never |

So Large is allowed on every group (it is less dense, which M3 does not warn against). Small and below never shrink a focused
single-task part: at Small a menu is still a Medium menu. The page and post editing area is outside all three groups: density never
reaches it.


What each part does per step, in dp (Medium = default, Small = -1, then -2 and -3 for themes):

| Part | Default | -1 | -2 | -3 | Source of the default |
| --- | --- | --- | --- | --- | --- |
| Segmented button | 40 | 36 | 32 | 28 | read on M3's segmented-button Specs page, with its density rule |
| Chip | 32 | 28 | 24 | 20 | read on M3's chips Specs page |
| Text field | 56 | 52 | 48 | 44 | read on M3's text-field Specs page ("Container height 56dp") |
| Table row (`DataTable`) | 52 | 48 | 44 | 40 | MD2's data-table spec, as in the table spec; M3 has no table |
| Button, list row, gaps | not read | -4 | -8 | -12 | see below (the -2 and -3 columns apply to data-heavy parts only) |

Large (+1) adds 4 to each default. Only the segmented button's density rule is printed by M3 (the 4dp step and "only applied to the
height"). For every other part the sizes are **our application of M3's general sentence** ("Higher density is typically applied by
decreasing the top and bottom padding or overall height by 4dp"), not a number M3 gives for that part.

**Not read.** I could not read the default heights of M3's button and list item from their Specs pages (the sizes sit in tabs that did
not render with the container height as text), so this spec gives no number for them: the part's PR takes today's value from
`theme/ui/` and subtracts 4dp per step, and checks it against M3 by hand in a browser. The gap between rows and sections in the editor
(outside the page and post editing area) is likewise today's value minus 4dp per step, from the spacing tokens.

### 2.3 The 48dp rule

On a touch screen (`pointer: coarse`) every tappable part keeps a 48 × 48 dp target at every step (rule 4). The image shrinks; an invisible
hit area (a `::after` of 48 dp) keeps the target. Where two small targets would then overlap, the gap between them grows back to
keep them apart. The existing 48 dp icon button (`docs/material-deviations.md`, CSS sweep 4) already does this.

On a mouse screen (`pointer: fine`) the target may follow the visual size, but never below 32 dp. (M3 says 48 as the default and
allows density as an opt-in. 32 is our floor; question 3.)

### 2.4 The site's front end

**The theme designer decides.** The editor owner is not asked to choose density for visitors. The package gives the *mechanism*; it
does not turn it on.

- A theme that does nothing about density works as today: `data-density` is not set on the site, so every part is at `0`.
- A theme that wants density may read `--mo-density` in its own parts, and may list a setting in its `theme.json` (a switch or a
  choice) that sets `data-density` on the site's root. Where the setting lives and what it changes is the theme's own.
- **The default theme `Material`: recommendation, no site setting for now.** M3's own advice is "Apply density thoughtfully; not every
  layout needs it", and a public page is not a data screen. The site's blocks stay at `0`. The only exception is the Table block's rows
  (section 3), which can offer a `density` per table, because a table is where M3 says density helps ("such as a data table").
  If the owner wants a site-wide setting later, it is one more theme setting with no change to the mechanism.
- The editor's density and the site's density are separate. The editor's choice (on the device) never reaches the site.
- Other themes in the store need no change. The only contract is: `--mo-density` is a number the theme *may* read, and missing means 0.

## 3. The table spec's `density`

PR 3 of `2026-11-13-table-md2-design.md` (#502) adds `density: comfortable | compact`, as a table prop. This design replaces the idea of
two private levels with the one M3 rule.

What the PM should change in that spec (I did not edit it):

- PR 3: instead of `Comfortable` / `Compact`, the table block has `density` with the same three names: `Large` (+1), `Medium` (0, default) and `Small` (-1).
  Default `Medium` = today's 52 dp row. Large 56, Small 48 (M3's -2 and -3 would be 44 and 40); the header row 56 / 52 / 48 / 44. The MD2 "6 dp / 8 dp minimized padding" is a
  second MD2 spec that we do not use as a separate level.
- The row of the table is built **in the `DataTable` part (PR 0)** as `calc(52px + var(--mo-density) * 4px)`, so the editor and the site
  share the same rule. The Table block's own `density` prop sets `--mo-density` on the table only.
- In the editor (a table inside the editor, if one ever comes), the table follows the editor's density unless the block sets its own.
- The "Storage" cell stays: adds `density` (a step), absent is Medium (0). A note on the 48 dp rule: a link in a cell is its own tap target; on touch it keeps a 48 dp hit area (section 2.3), whatever the row height.
- Release note: line (as before).

## 4. Order of work

Cost: small is under a day, medium a few days, large a week or more. All of it builds on #515 and the Material 3 audit, so it starts
after the first step of #515's row 11.

| # | PR | Cost | Depends on |
| --- | --- | --- | --- |
| 0 | **Spacing tokens** (#515 row 11, step a): `--mo-space-*` on M3's 4dp grid, and the one switch `--mo-density` / `--mo-density-step` plus `data-density` on the root. At `0` nothing changes. | small | none; this *is* step (a) of #515's row 11 and adds only the density switch to it |
| 1 | The setting in the Library: three steps, `localStorage`, head script. Does nothing visible until a part reads it. | small | PR 0 |
| 2 | Parts read it: segmented button, chip, button, text field, list row, in `theme/ui/` (each from M3's Specs page, 48 dp hit area on touch) | medium | PR 0, PR 1 |
| 3 | Layout density: the editor's gaps and paddings use `--mo-space-*` times density | large | #515 row 11 steps (c) and (d) (moving the 73 CSS lines and the Tailwind sizes to tokens); until then the editor's layout has nothing to scale |
| 4 | The table's density (the `DataTable` part and the Table block's `density`) | small | PR 0, `DataTable` (table spec PR 0), PR 3 of #502 changed as in section 3 |
| 5 | A check (below) | small | PR 2 |

Order: 0, 1, 2 (can be in parallel with #515's other rows), 4 after `DataTable`, 3 after #515 (c) and (d), 5 last. The Material 3
conformance audit (not a PR yet) should list density as a part-size rule so its sizes agree with section 2.2; PR 2 takes the
audit's sizes where they differ.

**Checks** (`check:screens` and a new `check:density`):

- Every editor screen opens at 375 px and 1280 px at each of the three steps with no error, no overflow and no text cut off. Three
  steps × two widths of the existing screens.
- **Content area is identical.** For a page and a blog post, the typed-in-place content area is the same at Large, Medium and Small: its
  computed sizes (height, padding, margin, gap of every block) and its screenshot at 375 px and 1280 px match pixel for pixel between
  the three steps. This is the proof that density never reaches the content. It also runs on a page with every block kind.
- Touch targets: at 375 px (`pointer: coarse`) every tappable part is at least 48 × 48 dp at every step, measured on the hit area.
- Contrast: unchanged by density, but `check:contrast` runs once at `Small` to see that tighter rows keep the section colours.
- A part that has a literal height or padding and not the density formula fails the check, once #515's spacing rule (its step 3 of
  section 4) exists. Until then the list of parts in 2.2 is the list.

**Release notes** (English first, Danish when written, as the `release-notes` skill says):

- The setting in the editor (PR 1 and 2): a **paragraph**: it changes how the editor looks and is a thing a site owner will use
  ("Choose how much fits on screen").
- The table's density: a **line**.
- A theme that offers a site setting: that theme's own note, not this package's.
- The spacing tokens (PR 0) and the check: empty changeset, nothing visible changes.

## 5. Decided, and open questions for the owner

**Decided (owner, 2026-11-13):** Large is a looser step than Medium. Large = +1 (our own extension of M3's numbers; the PR that
builds it adds the entry to `docs/material-deviations.md`), Medium = 0 (standard), Small = -1. The names are the ones on M3's density
page, as the owner's screenshot shows.

Open questions. The PM asks them one at a time, in this order.

1. **Forms at Small.** A settings form (several fields on one screen) is a focused task, so M3 says its controls should not get denser.
   At Small, do the form's text fields and switches stay at their Medium size, with only the space between fields shrinking?
   **Recommendation:** yes. Small then tightens screens, lists and tables, and leaves menus, dialogs and the controls in forms
   alone. (Folded in: the editor offers three steps only. M3's -2 and -3 exist for data-heavy parts in themes, not in the editor's menu.)
2. **Where it is kept.** **Recommendation:** per user on the device (`localStorage`, like Light / Dark): no sign-in needed, a phone
   and a computer can differ. The other choice is per site, stored in the site's settings, so everyone who edits it sees the same.
3. **How low on a mouse screen.** On a computer with a mouse, how small may a target get? **Recommendation:** 32 dp, with the 48 dp
   hit area kept on any touch screen. M3 allows density as an opt-in, with 48 dp as the default.
4. **Default theme: a site setting?** **Recommendation:** no site setting in `Material` now; only the Table block's own `density`.
   A theme author can add one. (Say yes if the owner wants visitors' pages denser by site.)
