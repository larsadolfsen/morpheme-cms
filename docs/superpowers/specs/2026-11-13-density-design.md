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
- Stored (owner, 2026-11-13): **per user, kept on the user**, not only on the device. The editor already keeps per-person settings in
  one place: the Worker's `worker/dashboard.js` keeps each person's start-screen dashboard in the Workers KV namespace `NOT_FOUND`
  (`wrangler.jsonc`), one key `dashboard:<GitHub user id>`, no expiry, read and written through `GET` and `PUT /api/dashboard`. The
  id comes from GitHub with the person's sign-in, so no one can read or write another person's. Density takes the same road: a key
  `settings:<GitHub user id>` with `{ density }` and `GET` / `PUT /api/settings` (or a `density` field in that record if the owner's
  later per-user settings also go there), same sign-in rule, same "someone who can save the site" rule, same "no KV in a branch
  preview, so nothing is kept and the editor says so".
- A copy on the device (`localStorage` key `editor-density`, as `editor-theme` in `src/theme.ts`) lets a script in the head set
  `data-density` before the first paint, so the page does not jump. When the editor loads, the account's value replaces the copy; a
  change writes both. Where there is no account value (a preview), the copy alone is used.
- **Scope (owner, 2026-11-13).** It applies to the whole editor **except the editing area of a page and a blog post**. What is typed in
  place there (text, and the blocks as drawn on the page) must stay as close to the real site as possible, so density never changes how
  that content is drawn: it keeps the theme's own spacing for the site, at every step. Everything around it follows density: menus,
  sheets, settings forms, lists, toolbars, the Library, the start screen and all other screens.
- **The line.** The content area is the box that holds the page's own blocks (the typed-in-place canvas and the page Preview).
  Density is switched off inside it by setting `--mo-density-user: 0` on that box, so a block drawn there reads only the theme's own
  step (`--mo-density-base`), exactly as on the site, even though `data-density` is on the root. The editor's own tools drawn over the content (the floating text toolbar, the
  block menu, the add-block buttons) are editor parts and follow density.
- No automatic change on a small screen (M3 rule above). The choice is the same on a phone and a computer, unless the person picks it
  there.
- The settings rows that hold this choice always stay at step `0` size, so a person can always go back (M3 rule above).

### 2.2 How the theme's parts read it

The theme carries density (owner, 2026-11-13: "We need to support density in the styling, so we need to have it in the theme"). Two
numbers add up to one:

- the **theme's own step**, `--mo-density-base`: what a theme author sets, `0` (Medium) unless the theme chooses otherwise;
- the **person's step**, `--mo-density-user`: set only by the editor's setting, through one attribute on `<html>`,
  `data-density="1 | 0 | -1"` (Large, Medium, Small). A site has no such attribute, so it is `0` there.

```css
:root {
  --mo-density-base: 0;   /* a theme author sets this; 1 = Large, -1 = Small, down to -3 */
  --mo-density-user: 0;   /* the editor's setting, below */
  --mo-density-step: 4px;
  --mo-density: clamp(-3, calc(var(--mo-density-base) + var(--mo-density-user)), 1);          /* data-heavy parts */
  --mo-density-layout: clamp(-1, calc(var(--mo-density-base) + var(--mo-density-user)), 1);   /* layout */
  --mo-density-focus: clamp(0, calc(var(--mo-density-base) + var(--mo-density-user)), 1);     /* focused single-task: never denser than Medium */
}
:root[data-density="-1"] { --mo-density-user: -1; }   /* "1" the same */
```

(A unitless number inside `clamp()` and `calc()` is valid CSS; PR 0 checks it in Chromium, Firefox and Safari before relying on it.)

The group a part is in (the table below) decides which of the three it reads. Same step, different limits: a menu is never denser than
Medium (M3's rule 5), a list can go to -3.

A part writes its size as `calc(<default> + var(--mo-density) * var(--mo-density-step))` (or `-layout`, `-focus`). At `0` the sum is the
default, so a part that does nothing about density never changes. Only the steps move, in M3's 4dp: the height or the top and bottom padding, never the
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

**Where M3 is silent.** M3 names menus, selecting from a menu, snackbars and dialogs as no-go. It says nothing about text fields,
switches and other controls inside a settings form, or about toolbars, tabs and chips. For these the spec applies the page's general
rule (use density where people scan a lot, not in focused tasks) and records the choice here so the owner can see it: the controls in
a settings form are a focused task and stay Medium; toolbars, tabs, chips, buttons and the gaps between form fields are layout and
follow the three steps. The owner decided to follow M3 (2026-11-13).

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

### 2.3 Touch targets

What the M3 pages say (read on 2026-11-13 with Chromium):

- m3.material.io/foundations/designing/structure ("Target sizes"): "For most platforms, consider making touch targets at least 48 x
  48dp." "Touch targets are the parts of the screen that respond to user input, extending beyond the visual bounds of an element. For
  example, an icon may appear to be 24 x 24dp, but the padding surrounding it comprises the full 48 x 48dp touch target."
  **"Pointer targets" ** (mouse, stylus): "Consider making pointer targets minimums 44 x 44dp." **"Target spacing":** "In most cases,
  targets separated by 8dp of space or more promote balanced information density and usability." (Its note: iOS recommends 44.)
- m3.material.io/foundations/layout/grids-spacing/density: "The default target size should be at least 48x48 CSS pixels." "Don't
  apply component scaling by default if it would result in a target below 48x48 CSS pixels." "Accessible targets should retain a
  minimum of 48x48dp, even if the visual element, such as an icon, is smaller." The density settings' own controls "must use default
  target sizes (48x48 CSS pixels)".
- m3.material.io/components/icon-buttons/accessibility: "Don't apply density to icon buttons by default. This lowers their targets
  below the required 48x48 CSS pixels minimum size. Provide density options that allow people to choose a higher density … Controls
  for adjusting density must maintain a target size of at least 48x48 CSS pixels."
- Component Specs pages: target size 48dp for the segmented button, the radio button, the checkbox and the switch; "Min 48dp" for a
  chip's close icon; "Target size must be at least 48x48dp" for a list item; "Extra small and small icon buttons must have a target
  size of 48x48dp or larger" (buttons and icon buttons). The text field's page gives a 56dp target.
- **Desktop, plainly.** The only desktop (pointer) number M3 gives is the 44 x 44dp above, on the "Designing" > "Structure" page. I also
  read the other pages under Foundations > Designing (overview, color contrast, flow, elements), Building for all, Layout overview and
  Interaction (inputs, selection, states, gestures): none gives another target size or a desktop density rule. The inputs page
  (m3.material.io/foundations/interaction/inputs) covers mouse and cursor behaviour, with no sizes. The structure page's own figure
  caption says "Touch target on both: 48dp", while its text says 44 for pointers; I quote both and do not pick between them. A page
  titled "Accessibility basics" does not exist at the address I tried (404), and I found no other accessibility page that has sizes.
- **A width rule: I could not find one.** The owner remembers that a target may be smaller than 48 on mobile when it has a certain
  width. In every page above I found no such exception: only 48 for touch, 44 for a pointer, and 8dp between targets. It may be on a page
  I did not open (for example a component's own page); I will not guess it. The owner or the PM can point me to the page.

What the spec does with it:

- **Touch** (`pointer: coarse`): every tappable part keeps a 48 × 48 dp target at every step. The image shrinks; an invisible hit area
  (a `::after` of 48 dp) keeps the target, as the existing 48 dp icon button does (`docs/material-deviations.md`, CSS sweep 4). Where
  two targets would overlap, the gap grows to keep them at least 8 dp apart.
- **Mouse** (`pointer: fine`): M3 names 44 × 44 dp as the minimum. The spec uses **44** (it was 32 in the first draft, which was
  ours and not M3's).
- **How it fits the steps.** The steps change the image only: height and vertical padding, by 4dp, down to -3 (12dp). The target
  stays 48 on touch and 44 for a mouse at every step. A part that is already near the target (a 40dp button at -1 is 36dp) keeps the
  rest of the target as invisible hit area, so no step ever shrinks a target.
- The density setting's own rows are always at the default size.

### 2.4 The site's front end

**The theme carries density; the site has no visitor setting** (owner, 2026-11-13: "I don't think we have to have a front-end version of it
(no visitor-facing setting), but we need to have it in the theme").

- **Which theme files hold it.** `theme/styles/base.css`: the `--mo-density*` variables above, the contract every theme shares (`--mo-…`).
  `theme/styles/ui.css`: the parts' sizes (button, chip, segmented button, text field, list item …) written as the default plus the
  density term. `theme/styles/blocks.css`: the blocks' own spacing, first the Table block's rows (`.block-table-grid`, via the shared
  `DataTable`). `theme/styles/global.css`: the standard theme's own value of `--mo-density-base` (`0`).
- **What a theme author sets.** One CSS variable in `:root` of the theme's `styles/global.css`: `--mo-density-base: -1;` gives a denser
  theme (Small), `1` a looser one (Large), `0` is Medium. Nothing goes in `theme.json` (that file is the store's description of the
  theme, and a CSS variable works the same in the editor and on the site). A theme that sets nothing is at `0`: its look is today's,
  exactly.
- **The editor reads it from the theme.** The editor draws with the same CSS as the site (shared theme principle in CLAUDE.md), so it
  already has the theme's `--mo-density-base`. The editor's Large / Medium / Small is added to it (section 2.2): Medium means "the
  theme's own", Small one step denser, Large one step looser. A theme with base `-1` is still Medium in the editor's menu.
- **The default theme `Material`** has base `0` and offers **no setting to visitors**: no cookie, no switch. The site is drawn at the theme's
  own step, whatever a person picked in the editor (the editor's choice never reaches the site).
- **The Table block has no density setting of its own.** Its rows follow the theme's density like every other part (section 3).
- Other themes in the store need no change: missing means `0`.
- The cookie design below is kept as "later, if a theme wants it". It is not built now.

- **Later, if a theme wants a visitor setting: a cookie in the browser (not built now).** There are no front-end sign-ins and none
  planned, so nothing is kept per visitor on a server. What I found in the code:
  - The default theme already remembers a visitor's light or dark choice, but in `localStorage` (key `theme`), not a cookie:
    `theme/layouts/Base.astro` has an inline script in `<head>` that reads it and sets `data-theme` on `<html>` before the first
    paint, and a click handler that writes it. A density choice can follow the same pattern with a cookie.
  - Proposed cookie: name `density`; value `large`, `medium` or `small`; `Max-Age=31536000` (one year); `Path=/`; `SameSite=Lax`;
    `Secure`; not `HttpOnly`, because the page's own script has to read and write it. It is written by the theme's script when the
    visitor picks a step.
  - **No flash:** the site is built static, so the server cannot answer differently per visitor. An inline script in `<head>`, like
    the theme's, reads the cookie and sets `data-density` on `<html>` before the first paint; the theme's CSS reads `[data-density]`.
  - **What the theme must do:** read `--mo-density` in its parts; carry the inline script and the control; and not set the attribute
    on pages when it offers no setting.
  - **The cookie banner: what the code says.** Cookies have categories (`lib/cookieCategories.mjs`): `necessary` is set without
    asking; `preferences`, `statistics`, `marketing` and `targeting` are asked in the banner, one by one. A cookie's category is declared
    in the site's cookie list and in an app's `cookies.json`. The banner shows only when cookies are enabled and at least one
    installed **app** asks for a category (`site/consent.ts`: `cookieBanner = cookies.enabled && consentCategories.length > 0`). A
    theme has no way to declare a cookie or to make the banner ask today, and the default theme's `theme` choice in `localStorage` is not
    in the cookie list. So a density cookie would be `preferences` by our own categories, but nothing in the code makes the banner ask for
    it. **I cannot tell from the code whether the law needs a yes for a cookie that only keeps a layout choice**, and that is not
    something the code decides; the owner or the site's privacy owner has to say. If a yes is needed, the theme needs a way to declare
    its cookie (a `cookies.json` as an app has), which is a separate piece of work.

## 3. The table spec's `density`

PR 3 of `2026-11-13-table-md2-design.md` (#502) adds `density: comfortable | compact` as a Table block setting. The owner has decided the
theme carries density, with no visitor setting. So the Table block gets **no density setting at all**: this one rule replaces it.

What the PM should change in that spec (I did not edit it):

- **Drop PR 3 as a block setting.** No `density` prop, no `Comfortable` / `Compact`, nothing stored in the block, so no migration and no
  "Storage" cell. The row is built in the `DataTable` part (PR 0) as `calc(52px + var(--mo-density) * 4px)`: Medium 52 dp (today),
  Large 56, Small 48 (-2 and -3 would be 44 and 40); the header row 56 / 52 / 48 / 44. A table is a data-heavy part (section 2.2), so it
  reads `--mo-density`, the one that reaches -3. The MD2 "6 dp / 8 dp minimized padding" is a second MD2 spec that we do not use as a level.
- PR 3 becomes "`DataTable` reads `--mo-density`", small, in the spec's order after PR 0. It is the same work as PR 4 here, so the two
  are one PR.
- The site's tables follow the theme's step (`--mo-density-base`). A site owner cannot choose a denser table for one table; a theme can
  make all of them denser.
- In the editor, a table drawn in an editor screen (outside the page and post editing area) follows the person's step; inside the page
  area it is drawn as on the site.
- A link in a cell is its own tap target; on touch it keeps a 48 dp hit area (section 2.3), whatever the row height.
- Release note: none of its own; the line for density is in section 4.

## 4. Order of work

Cost: small is under a day, medium a few days, large a week or more. All of it builds on #515 and the Material 3 audit, so it starts
after the first step of #515's row 11.

| # | PR | Cost | Depends on |
| --- | --- | --- | --- |
| 0 | **Spacing tokens** (#515 row 11, step a): `--mo-space-*` on M3's 4dp grid, and the density variables of section 2.2 in `theme/styles/base.css` (`--mo-density-base` with `0` in `global.css`). At `0` nothing changes. | small | none; this *is* step (a) of #515's row 11 and adds only the density switch to it |
| 1 | The setting in the Library: three steps, kept on the user (`/api/settings` in the Worker, like the dashboard) with a copy on the device and a head script. Does nothing visible until a part reads it. | medium | PR 0 |
| 2 | Parts read it: segmented button, chip, button, text field, list row, in `theme/ui/` (each from M3's Specs page, 48 dp hit area on touch) | medium | PR 0, PR 1 |
| 3 | Layout density: the editor's gaps and paddings use `--mo-space-*` times density | large | #515 row 11 steps (c) and (d) (moving the 73 CSS lines and the Tailwind sizes to tokens); until then the editor's layout has nothing to scale |
| 4 | The table's rows read the density (the `DataTable` part; no Table block setting, section 3) | small | PR 0, `DataTable` (table spec PR 0), PR 3 of #502 dropped as in section 3 |
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
- The table's rows follow density (PR 4): a **line**.
- A theme author's `--mo-density-base` (PR 0 and 2): a **line**, for theme authors, in the same note.
- The spacing tokens (PR 0) and the check: empty changeset, nothing visible changes.

## 5. Decided, and open questions

**Decided (owner, 2026-11-13):** Large is a looser step than Medium. Large = +1 (our own extension of M3's numbers; the PR that
builds it adds the entry to `docs/material-deviations.md`), Medium = 0 (standard), Small = -1. The names are the ones on M3's density
page, as the owner's screenshot shows.

Also decided (owner, 2026-11-13): follow the M3 density page and nothing beyond it. Where M3 is silent, the page's general rule
applies (section 2.2). The editor's menu offers the three steps; -2 and -3 are for data-heavy parts in themes (our proposal, not
asked).

Also decided (owner, 2026-11-13): where it is kept. In the editor it is per user, kept on the user (section 2.1). On the site there is no visitor setting; if a theme ever wants one,
it is a cookie in the browser (section 2.4, later); no front-end sign-ins.

Also decided (owner, 2026-11-13): follow M3 exactly for targets: 48 x 48 dp on touch, 44 x 44 dp for a mouse (pointer). The 32 dp idea
is gone (section 2.3).

Also decided (owner, 2026-11-13): the theme carries density (the `--mo-density` variables and the 4dp-per-step rules in the shared parts, for
the editor and for theme authors, Large / Medium / Small). The default theme offers **no** visitor-facing setting on the site: no cookie
and no switch for now (section 2.4). The Table block has no density setting of its own; this rule replaces it (section 3).

**Open questions: none.** Every question is decided.
