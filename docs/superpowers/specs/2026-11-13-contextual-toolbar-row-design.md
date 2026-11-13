# The contextual toolbar as a row under the main toolbar (design)

Status: proposal for the owner. Design only, no code. Written for a phone: plain words, short.

Owner's words: "One thought I had on the contextual toolbar is to show it as a row below the main toolbar." It replaces the
floating bar everywhere, on phone and larger screens. "Remove the delay, and the main toolbar only shows global values."
Related decision (audit, PR #515): the editor's floating menus use the theme's own `Toolbar` part, so a theme can style them.

Words: the **main toolbar** is the bar at the top of the text editor (`editor-tools`, `MarkdownEditor.tsx`). The **contextual
bar** is the bar that follows what is selected: the text under the cursor, or the block or row you tapped
(`src/contextualMenu.ts` for blocks, the selection pill in `selectionMenu()` for text). A **part** is a ready-made piece of the
theme (`theme/ui/Toolbar.tsx`) that a theme can restyle.

This spec does not change inline block editing (`2026-11-12-inline-block-editing-design.md`): the same actions, the same
`BarAction` list, only a new place and shell for the bar.

## 1. What exists today

- **Main toolbar** (sticky at the top of the text box): Section settings (when it applies), Bold, Italic, Link, Heading (H),
  Bulleted / Check / Numbered list, Text size (T), Alignment, Insert (+), Undo, Redo, and an arrow that opens a second line
  when the tools do not fit.
- **Three floating bars**, all hand-made in `src/editor.css`:
  - the **selection pill** (Bold, Italic, Link, H, More), over selected text; on a phone at the bottom, above the keyboard;
  - the **block bar** `.contextual-menu` (Add above/below, Move up/down, Link, the gear, Fill from a list, then the block's
    `⋮` menu), over the block; on a phone docked above the keyboard and the save bar, wrapping to two lines;
  - the **block's card menu** `.site-block-menu` (Edit, Hide, Move, Remove), a small pop-up on blocks not typed in place.
- Bold, Italic and Link are on screen twice while text is selected (the owner's own finding in the intuitive-editor spec).

## 2. What Material says (read 13 November 2026 with Playwright)

Pages read: `m3.material.io/components/toolbars/` overview, specs, guidelines, accessibility, and
`m3.material.io/foundations/designing/structure` (touch targets). Quotes are from those pages.

- **Docked = global, floating = contextual.** "Docked toolbar: Spans the full width of the window. It's best used for global
  actions that remain the same across multiple pages. Floating toolbar: Floats above the body content. It's best used for
  contextual actions relevant to the body content or the specific page." (guidelines, Usage.) So the owner's "main toolbar only
  shows global values" is exactly M3's docked toolbar. Putting *contextual* actions in a second **docked** row is **not** what M3
  says: M3 would make the contextual bar the floating one. That is a deviation (listed below).
- **Docked toolbars go at the bottom.** "Only place docked toolbars at the bottom of the window." (Position & orientation.) Ours
  is at the top of the text box already; the same deviation, not new.
- **No two toolbars on a phone.** "Don't use multiple toolbars in compact windows. There typically isn't enough room on screen.
  Instead, use one toolbar for all actions." (Presentation.) M3's example of several toolbars is a larger window, with the bars on
  opposite edges and a different style each. Two stacked rows on a phone go against this. That is the owner's idea; it is a
  deviation and **open question 1**.
- **Overflow is a menu, not a scroll.** "If there's not enough space for all items, put them in an overflow menu in the trailing
  slot." (Adaptive design, floating.) For docked: "Be cautious of including too many controls." M3 does not describe sideways
  scrolling for a toolbar. So this spec uses an overflow menu, not scrolling.
- **Sizes.** "By default all toolbars are 64dp high ... minimum outside padding of 16dp." "All elements need a minimum 48x48dp
  target area." (Specs, Measurements; Anatomy.) For the docked toolbar on large screens: "Only shrink the height and use extra
  small buttons if vertical space is limited." Our 48 dp rows are shorter than 64 dp: allowed only when space is limited,
  which a phone is.
- **Scrolling.** "Docked toolbars can either remain on the screen during scroll, or animate offscreen." Sticky is allowed.
- **Colour.** Standard is "a low-emphasis color scheme best used for focusing attention on the body content". Vibrant "can also
  indicate a temporary change in the page behavior, such as entering edit mode".
- **Keyboard and roles.** "On web, the toolbar container should have the toolbar role." Keys: "Tab or Arrows: Navigate between
  interactive elements; Space or Enter: Activate". Initial focus lands on the first interactive element. The theme's `Toolbar`
  uses one Tab stop with arrows inside, which is not quite the same as "Tab or Arrows"; it is the theme's existing choice.
- **Touch target.** "Consider making touch targets at least 48 x 48dp" (foundations, structure). So 48 dp is M3's, checked.
- **Rounded corners.** "Avoid applying rounded corners to the container" of a docked toolbar; but "On web and large screens,
  the docked toolbar can be rounded".

**What I could not read:** the toolbar pages' images and the token tables (the page draws them from script and Playwright got
no text for them), the Figma kit, and a page named `accessibility-basics`, which gives "page not found". The Expressive
update note says "Web: Unavailable" for toolbar code, so the theme's `Toolbar` is our own build of the design, not a port.

**Deviations from this (to add to `docs/material-deviations.md` with step 1):** (1) contextual actions in a docked toolbar
(M3: floating); (2) docked toolbars at the top (M3: bottom; already true of the main toolbar); (3) two stacked toolbars on a
phone (M3: one); (4) 48 dp height instead of 64 dp (allowed only for limited space).

## 3. Layout

```
PHONE 375 px                         COMPUTER 1280 px
+---------------------------+        +-------------------------------------------------+
| main toolbar (global)     |        | main toolbar (global)                           |
| [+] [Undo][Redo] [Section]|        | [+] [Undo][Redo]  [Section settings]            |
+---------------------------+        +-------------------------------------------------+
| contextual row            |        | contextual row (follows the selection)          |
| [B][I][Link][H][T][⋮]     |        | [B][I][Link][H][Lists][T][Align][Colour] [⋮]    |
+---------------------------+        +-------------------------------------------------+
|  the page text ...        |        |  the page text ...                              |
|  [ block card ]           |        |  [ block card ]                                 |
|  save bar (docked)        |        |                                                 |
+---------------------------+        +-------------------------------------------------+

A Table is selected (phone, 7 actions, two under the overflow):
| [row↑][row↓][col←][col→] [⚙] [⋮ → Delete row, Delete column] |   (6 buttons x 48 dp = 288 dp)
```

- **Two docked rows, one box.** The contextual row is a second `Toolbar` part (kind `docked`, colour `standard`) directly
  under the main one. The two stick together at the top while the text scrolls (they are the same sticky box, so they never
  separate). The floating `.contextual-menu` and the selection pill are deleted. The block's `⋮` keeps its pop-up (a menu is a
  menu, not a toolbar) and is the row's last button.
- **Nothing selected.** The row is always there once the editor is on the screen, so the page never jumps. With the cursor in
  text it shows the text tools; with a block or row active it shows that block's tools; with the focus outside the editor it
  shows the text tools dimmed (disabled), the same height. Recommendation: one fixed height (48 dp) in all cases.
- **Phone keyboard.** The rows sit at the top, so the keyboard cannot cover them (today's bar fights it and is placed with
  `visualViewport` and timers). iOS Safari can pan the page when the keyboard opens and a sticky top bar then slides away:
  if the device check shows this, a tiny listener sets one CSS variable from `visualViewport.offsetTop` (no timer, applied in
  the event itself). This needs a check on a real phone before the work is closed.
- **375 px and overflow.** The row never wraps and never scrolls sideways (M3 uses an overflow menu in the trailing slot,
  section 2). When the tools do not fit, the last button `⋮` opens a menu with the rest. The text row folds the rarer tools
  (alignment, lists, colour) under `⋮` → the existing *More* sheet. The block rows keep today's phone folding (`Row` for Move and
  Link). Targets stay 48 dp, edges 16 dp.
- **Focus order and names.** Tab: main toolbar (one stop, arrow keys inside, as the theme's `Toolbar` already does; M3 says "Tab or Arrows") → contextual
  row (one stop) → the text. `role="toolbar"`, `aria-label` = the block's name ("Table", "Cards") or "Text tools"; every button keeps its
  `aria-label` and `title`; toggles keep `aria-pressed`. Escape in the row returns the focus to where the cursor was.
  A tap on the row never takes the cursor (mouse and touch down are cancelled, as `press()` does today).
- **Table.** Seven actions: Add row above, Add row below, Add column before, Add column after, Delete row, Delete column,
  Settings. Seven buttons are 336 dp, which with 16 dp edges does not fit 375 px (343 dp of room, no gaps). So on a phone the two
  Delete actions go under `⋮` (a menu, and Undo is there to take it back); the other five stay on the row. On a computer all seven show.

## 4. Remove the delay

Every wait before the bar appears, moves or follows, found in the code:

| Where | What it is for | What the owner sees | Proposal |
| --- | --- | --- | --- |
| `STILL_MS = 700`, `stillTimer` (`stillCursor.mjs`, `lib/still-timer.mjs`) | The selection pill waits until the cursor has stood still 700 ms in a word, so it does not flash while typing. Restarts on every key and move. | Put the cursor in a word: nothing for 0.7 s, then the pill. Type: it vanishes. | **Remove.** The text row is always there, so there is nothing to wait for. Bold, Italic and Link still act on the word at the cursor (`wordRange` stays). Delete `stillTimer`, `STILL_MS` and their tests. |
| `setTimeout(follow, 100)` after a tool is pressed | Moves the pill again once the *Save changes* bar has appeared and pushed the floor up. | The pill hops a moment after a tap. | **Remove.** Docked rows do not depend on the save bar. |
| `follow`: `requestAnimationFrame` + `setTimeout(…, 250)` on scroll and `visualViewport` resize | Places the pill again after the keyboard has finished opening. | The pill slides to its place after the keyboard, 0.25 s late. | **Remove.** Nothing to place. |
| `refresh = setTimeout(() => update(view))` on focus and blur | Waits one tick so a tap on the pill keeps the focus before the pill decides to hide. | The pill stays one tick after you leave the text. | **Remove.** The row never hides; it only dims. |
| `contextualMenu.ts` `place()` on every scroll, resize, `visualViewport` event | The block bar follows the block (and hides when the block is off screen). | The bar trails the page a little while scrolling. | **Remove** with the floating bar. |
| `blockCard` `setTimeout(start, 50)` up to 30 times | A new block waits for the closing Insert sheet to give back the focus, then puts the cursor in its first row. | Up to 1.5 s before the cursor appears in a new block. | **Keep.** It is about focus, not the bar. Can later be an event ("sheet closed"); not part of this work. |
| `blockCard` `pointerdown` lock, 1000 ms | A finger on a block card must not open the phone's keyboard. | None you can see. | **Keep.** Not the bar. |
| Animations on the bar | None today (no `transition` on `.contextual-menu` or the pill). | Bars appear and vanish at once, which also reads as a flicker. | **Add one**, from tokens only: the row's buttons swap with `var(--motion-effects)` (fade, 0 → 1); the row's height never animates. `prefers-reduced-motion`: none. M3 says nothing about this; it is our choice, not a question. |

**What keeps it from flickering without the wait:** the row does not mount and unmount. Its buttons change in place:
buttons that do not apply are hidden with `hidden` (no layout change, the height is fixed), changes are made in one frame, and
a button that is only about the selection (Bold *on*) changes its `aria-pressed` without redrawing the row. The old reason
for the 700 ms (a pill popping over the line you type on) is gone because the row is not over the text.

## 5. "The main toolbar only shows global values"

**Decided by the owner:** "So bold and italic would move in the contextual bar." So everything about the selection moves
to the contextual row, and the main toolbar keeps only what is about the whole text.

| Tool | About | Goes to |
| --- | --- | --- |
| Undo, Redo | the whole text | stays in the main toolbar |
| Insert (+) | the whole text, at the cursor | stays in the main toolbar |
| Section settings | the section the heading starts | stays in the main toolbar |
| Preview, save state | the whole page | already in the page header and save bar; not this bar |
| Bold, Italic, Link | the selection | contextual row |
| Heading (H), Bulleted / Check / Numbered list | the line under the cursor | contextual row |
| Text size (T), Alignment, colour | the line or selection | contextual row |

**What the row shows.** Text selected, or the cursor in text: Bold, Italic, Link, Heading, Text size, Alignment (phone: lists
and colour under `⋮` → More). A block or row selected: that block's tools (section 6). Nothing in the editor focused: the text
tools, dimmed, the same height.

```
MAIN TOOLBAR (global), phone and computer
[ + Insert ] [ Undo ] [ Redo ]                    [ Section settings ]

CONTEXTUAL ROW, text selected            CONTEXTUAL ROW, a block selected
[B][I][Link][H][T][Align][⋮]            [row↑][row↓][Link][⚙][⋮]
```

**375 px.** Main toolbar: 4 buttons at 48 dp = 192 dp, one line, no arrow. Text row: 6 tools + `⋮` = 7 × 48 = 336 dp; 375 minus
two 16 dp edges leaves 343 dp, so it only fits with no gaps; so Align goes under `⋮` on a phone (5 + `⋮` = 288 dp).

**Is the main toolbar then too thin?** Four tools is little, but the owner decided to keep exactly these four as one slim line.

## 6. What moves where, by block

The row's content follows the selection. "Row" = the active row or item of a repeating block. `⋮` = the block's own menu
(Hide, Move, Remove). Actions are today's, taken from the inline spec; this spec only moves them.

| Block | Contextual row (phone: what folds under `⋮` or `Row`) |
| --- | --- |
| Text (cursor or selection) | Bold, Italic, Link, Heading, Lists, Text size, Alignment, Colour (phone: lists, alignment, colour under `⋮` → More) |
| Table | Row above, Row below, Column before, Column after, Delete row, Delete column, Settings, `⋮` (phone: the two Delete actions under `⋮`) |
| List | Add above, Add below, Move up, Move down, Link, Settings, Fill from a list, `⋮` (phone: Move and Link under `Row`) |
| Cards | Add above, Add below, Move up/down, Link, Settings, `⋮` |
| Points, Segmented list | the same as Cards; Segmented also Fill from a list |
| Steps, Checklist | Add above, Add below, Move up/down, `⋮` (no Link, no gear) |
| Accordion / Questions and answers (FAQ) | Add above, Add below, Move up/down, Settings (the block's settings), Fill from a list, `⋮` |
| Price cards | Add above, Add below, Move up/down, Settings (featured, badge), `⋮` |
| Buttons | Add above, Add below, Move, Link, Settings, `⋮` |
| Links (groups) | Add group/page above and below, Move, Settings, `⋮` |
| Image | Change image, Crop, Alt text, Settings, `⋮` (today the Image menu) |
| Video | Change address, Settings, `⋮` |
| Notice | Settings (the `until` date), `⋮` |
| Testimonials, Posts | Edit (opens the list page), Settings, `⋮` |
| HTML | Settings, `⋮` |
| Banner (section) | Section settings, `⋮` |

The block's card pop-up `.site-block-menu` (Edit, Hide, Move, Remove on blocks not typed in place) becomes the same row: those
four become its buttons, so there is one place for block actions. Image/Card/List "menus" are the same bar with other items.

## 7. Risks, checks, size

- **Risks:** (1) iOS keyboard and sticky top (section 3); (2) the two rows take about 100 dp of a short phone screen; the
  main toolbar shrinks to one line (no second-line arrow) because it now holds few tools, which gives most of it back;
  (3) a phone has no hover, so the row is the only way to see what applies: `aria-pressed` must be right; (4) a theme that
  styles `Toolbar` badly breaks the editor: both rows use only `--toolbar-*` tokens; (5) the old bars' tests
  (`.contextual-menu` in `scripts/editor-screens.mjs`) must be moved.
- **Checks:** `check:screens` at 375 and 1280: the rows are one box and sticky after scrolling; the row has the same height
  with nothing selected, in text and on each block; no button is under 48 dp; no horizontal page scroll; the Table's seven
  actions are all reachable at 375 (two in the `⋮` menu); the row never overlaps the text; `check:contrast` and `check:editor-colors` on
  the row in each section colour; `check:css-values` finds no literal motion or spacing in the new CSS. Not covered by the
  scripts: the keyboard on a real phone, and how a theme looks; both by hand, with the Preview of the branch (login does not
  work there, so the owner reads screenshots from `check:screens`).
- **Size and order (PRs into `main`, each with a changeset):**
  1. *Small:* the row shell: a second docked `Toolbar` under the main one, filled with the text tools; the selection pill and
     `stillTimer` removed. Empty changeset until visible.
  2. *Medium:* the main toolbar cut down to the global tools (reading A); the second line and its arrow removed; phone overflow
     (the `⋮` overflow menu).
  3. *Medium:* the block bar moves in (`contextualMenu.ts` becomes the row; `BarAction` stays); Table's seven actions; the
     tests move. The floating `.contextual-menu` CSS is deleted.
  4. *Small:* the card pop-up `.site-block-menu` becomes row buttons; the Image, Video, Notice items.
  5. *Small:* the iOS variable, the fade, the deviations entry, the release note.
- **Release note:** yes, one **paragraph** (it changes how the editor looks): "Find the tools in one place" (English and Danish,
  with the `release-notes` skill). Not in a changeset of its own: it goes with step 2, when the owner first sees it.
- **Material:** read, see section 2. The four deviations go into `docs/material-deviations.md` in the same PR as step 1.

## 8. Open questions for the owner (the PM asks them one at a time)

Decided by the owner: (1) bold, italic and the other selection tools move to the contextual row (section 5); (2) the main
toolbar keeps just Insert, Undo, Redo and Section settings (4 tools); (3) with the cursor in text, selection or not,
the text tools always show in the row.

1. **Two rows on a phone, against Material?** M3 says "Don't use multiple toolbars in compact windows ... use one toolbar for
   all actions", and puts contextual actions in the *floating* toolbar, not a docked one. Your idea is two docked rows on a
   phone too. Options: (a) two rows as you said, and write the deviation down; (b) on a phone one row: the contextual tools
   with Insert, Undo and Redo behind `⋮`, and two rows only on larger screens. Recommendation: (a), because one row at 375 px
   cannot hold both sets, and you decided it; the deviation is listed.
2. **When tools do not fit on a phone: an overflow menu `⋮` (M3's way), with Table's Delete row and Delete column inside it?**
   Recommendation: yes; sideways scrolling is not in M3, and Undo takes a delete back.
3. **Keep both rows sticky while the page scrolls?** Recommendation: yes (M3 allows it). Cost: about 100 dp of a short screen.
4. **The block pop-up (Edit, Hide, Move, Remove) on blocks not typed in place:** becomes row buttons (recommended) or stays a pop-up?
