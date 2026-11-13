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

## 2. Layout

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

A Table is selected (phone, 7 actions, scrolls sideways):
| [row↑][row↓][col←][col→][del row][del col] [⚙] [⋮] |   (the bar scrolls; the gear and ⋮ stay at the end)
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
- **375 px and overflow.** The row never wraps and never grows a second line. When the tools do not fit: it scrolls sideways
  (with `scroll-snap`, the end fades), and the last two buttons (`⚙` settings and `⋮`) stay fixed at the end. The text row folds
  the rarer tools (colours, alignment, lists) under `⋮` → the existing *More* sheet. The block rows keep today's phone folding
  (`Row` for Move and Link). Targets stay 48 dp.
- **Focus order and names.** Tab: main toolbar (one stop, arrow keys inside, as the theme's `Toolbar` already does) → contextual
  row (one stop) → the text. `role="toolbar"`, `aria-label` = the block's name ("Table", "Cards") or "Text tools"; every button keeps its
  `aria-label` and `title`; toggles keep `aria-pressed`. Escape in the row returns the focus to where the cursor was.
  A tap on the row never takes the cursor (mouse and touch down are cancelled, as `press()` does today).
- **Table.** Seven actions: Add row above, Add row below, Add column before, Add column after, Delete row, Delete column,
  Settings. At 375 px they scroll; none is hidden under a menu, because Delete must be visible and not one tap deeper.

## 3. Remove the delay

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
| Animations on the bar | None today (no `transition` on `.contextual-menu` or the pill). | Bars appear and vanish at once, which also reads as a flicker. | **Add one**, from tokens only: the row's buttons swap with `var(--motion-effects)` (fade, 0 → 1); the row's height never animates. `prefers-reduced-motion`: none. |

**What keeps it from flickering without the wait:** the row does not mount and unmount. Its buttons change in place:
buttons that do not apply are hidden with `hidden` (no layout change, the height is fixed), changes are made in one frame, and
a button that is only about the selection (Bold *on*) changes its `aria-pressed` without redrawing the row. The old reason
for the 700 ms (a pill popping over the line you type on) is gone because the row is not over the text.

## 4. "The main toolbar only shows global values"

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
and colour under `⋮` → More). A block or row selected: that block's tools (section 5). Nothing in the editor focused: the text
tools, dimmed, the same height.

```
MAIN TOOLBAR (global), phone and computer
[ + Insert ] [ Undo ] [ Redo ]                    [ Section settings ]

CONTEXTUAL ROW, text selected            CONTEXTUAL ROW, a block selected
[B][I][Link][H][T][Align][⋮]            [row↑][row↓][Link][⚙][⋮]
```

**375 px.** Main toolbar: 4 buttons at 48 dp = 192 dp, one line, no arrow. Text row: 6 tools + `⋮` = 7 × 48 = 336 dp, fits in
375 with 16 px edges only if gaps are 0; so Align goes under `⋮` on a phone (5 + `⋮` = 288 dp), and the row scrolls
sideways as a fallback.

**Is the main toolbar then too thin?** Four tools is little, and it leaves two bars to draw for a short list. Options:
(a) keep it, one slim line (recommended: it is steady, and is the only place for global things);
(b) put Insert, Undo and Redo at the start of the contextual row and drop the main toolbar: one bar, but the global tools then
move around with the context;
(c) add more global tools to it (Find in text, Word count, Preview) which today are not in the editor. This is open question 1.

## 5. What moves where, by block

The row's content follows the selection. "Row" = the active row or item of a repeating block. `⋮` = the block's own menu
(Hide, Move, Remove). Actions are today's, taken from the inline spec; this spec only moves them.

| Block | Contextual row (phone: what folds under `⋮` or `Row`) |
| --- | --- |
| Text (cursor or selection) | Bold, Italic, Link, Heading, Lists, Text size, Alignment, Colour (phone: lists, alignment, colour under `⋮` → More) |
| Table | Row above, Row below, Column before, Column after, Delete row, Delete column, Settings, `⋮` (scrolls) |
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

## 6. Risks, checks, size

- **Risks:** (1) iOS keyboard and sticky top (section 2); (2) the two rows take about 100 dp of a short phone screen; the
  main toolbar shrinks to one line (no second-line arrow) because it now holds few tools, which gives most of it back;
  (3) a phone has no hover, so the row is the only way to see what applies: `aria-pressed` must be right; (4) a theme that
  styles `Toolbar` badly breaks the editor: both rows use only `--toolbar-*` tokens; (5) the old bars' tests
  (`.contextual-menu` in `scripts/editor-screens.mjs`) must be moved.
- **Checks:** `check:screens` at 375 and 1280: the rows are one box and sticky after scrolling; the row has the same height
  with nothing selected, in text and on each block; no button is under 48 dp; no horizontal page scroll; the Table's seven
  actions are all reachable at 375 (scrolled); the row never overlaps the text; `check:contrast` and `check:editor-colors` on
  the row in each section colour; `check:css-values` finds no literal motion or spacing in the new CSS. Not covered by the
  scripts: the keyboard on a real phone, and how a theme looks; both by hand, with the Preview of the branch (login does not
  work there, so the owner reads screenshots from `check:screens`).
- **Size and order (PRs into `main`, each with a changeset):**
  1. *Small:* the row shell: a second docked `Toolbar` under the main one, filled with the text tools; the selection pill and
     `stillTimer` removed. Empty changeset until visible.
  2. *Medium:* the main toolbar cut down to the global tools (reading A); the second line and its arrow removed; phone overflow
     (scroll, fixed end buttons).
  3. *Medium:* the block bar moves in (`contextualMenu.ts` becomes the row; `BarAction` stays); Table's seven actions; the
     tests move. The floating `.contextual-menu` CSS is deleted.
  4. *Small:* the card pop-up `.site-block-menu` becomes row buttons; the Image, Video, Notice items.
  5. *Small:* the iOS variable, the fade, the deviations entry, the release note.
- **Release note:** yes, one **paragraph** (it changes how the editor looks): "Find the tools in one place" (English and Danish,
  with the `release-notes` skill). Not in a changeset of its own: it goes with step 2, when the owner first sees it.
- **Material pages not read.** I did not open m3.material.io for this spec. The statements that the row is M3's docked toolbar,
  that M3 has no pair of stacked toolbars, and the 48 dp targets come from the theme's own `Toolbar` comment and the existing
  code, not from the M3 pages. Before step 1, a session reads the Toolbars pages (with Playwright, they are script-rendered) and
  fixes this spec if they say otherwise.
- `docs/material-deviations.md`: one entry when step 1 lands, if the M3 pages confirm that a second docked toolbar under the first is not a pattern.

## 7. Open questions for the owner (the PM asks them one at a time)

Decided: bold, italic and the other selection tools move to the contextual row (section 4).

1. **Is a main toolbar with only Insert, Undo, Redo and Section settings enough?** (a) keep it as one slim line; (b) drop it
   and put those four at the start of the contextual row; (c) add more global tools. Recommendation: (a).
2. **What does the row show when the cursor is in text and nothing is selected?** The text tools (acting on the word at the
   cursor, no wait), or nothing until text is selected. Recommendation: always the text tools; never empty, never jumps.
3. **On a phone, scroll the row sideways or fold tools under `⋮`?** Recommendation: scroll for block rows (Table), fold only
   the rare text tools (Align, lists, colour) under `⋮` → More; Delete is never folded.
4. **Keep both rows sticky while the page scrolls?** Recommendation: yes, one sticky box. Cost: about 100 dp of a short screen.
5. **One fade (`--motion-effects`) when the row's buttons change, or none?** Recommendation: a fade 0 to 1 only; the height never moves.
6. **The block pop-up (Edit, Hide, Move, Remove) on blocks not typed in place:** becomes row buttons (recommended) or stays a pop-up?
