# One toolbar: the contextual tools slide in from the left (design)

Status: proposal for the owner. Design only, no code. Written for a phone: plain words, short.
(The file name still says "row": the first idea was a second row. The owner replaced it, see below.)

Owner's words, first idea: "show it as a row below the main toolbar", replacing the floating bar, with "the delay removed"
and "the main toolbar only shows global values". **Decision of 13 November, replacing the second row:** "No, we shouldn't keep two
rows. Just one menu up there. When you are in nothing, it shows the main menu. When you enter a text area or a block, the
contextual menu slides in from the left and pushes the main menu to the right (the icons, not a full menu), so the main menu
goes right and out of the screen. When you leave it, it rolls back. There needs to be a divider between the two. So just one
navigation bar with all the buttons in it."

Also decided: the selection tools (Bold, Italic, Link, Heading, Text size, Alignment, lists, colour) belong to the contextual
part; the main part keeps only Insert, Undo, Redo and Section settings; with the cursor in text, selection or not, the text tools
always show; on a phone the bar scrolls sideways; the editor's floating menus use the theme's own `Toolbar` part.

Words: the **bar** is the one toolbar at the top of the text editor (`editor-tools`, `MarkdownEditor.tsx`). Its **main tools**
are Insert, Undo, Redo, Section settings. Its **contextual tools** are what applies to the text under the cursor or to the
block or row you tapped. A **part** is a ready-made piece of the theme (`theme/ui/`) that a theme can restyle. A
**spring** is the theme's motion (`--motion-spatial-fast`, `motionTiming`, `motionSpring` in `lib/motion.ts`).

This spec does not change inline block editing (`2026-11-12-inline-block-editing-design.md`): the same actions, the same
`BarAction` list, only a new place and shell. The touch-selection spec (PR #529) has a `SelectionBar`; it becomes this same
bar's contextual part (a list screen's selection actions slide in where a block's would), not a second bar.

## 1. What exists today

- **Main toolbar** (sticky at the top of the text box): Section settings (when it applies), Bold, Italic, Link, Heading (H),
  Bulleted / Check / Numbered list, Text size (T), Alignment, Insert (+), Undo, Redo, and an arrow that opens a second line
  when the tools do not fit.
- **Three floating bars**, hand-made in `src/editor.css`:
  - the **selection pill** (Bold, Italic, Link, H, More), over selected text; on a phone at the bottom, above the keyboard;
  - the **block bar** `.contextual-menu` (Add above/below, Move up/down, Link, the gear, Fill from a list, then the block's `⋮`
    menu), over the block; on a phone docked above the keyboard and the save bar, wrapping to two lines;
  - the **block's card menu** `.site-block-menu` (Edit, Hide, Move, Remove), a pop-up on blocks not typed in place.
- Bold, Italic and Link are on screen twice while text is selected (the owner's own finding in the intuitive-editor spec).

## 2. What Material says (read 13 November 2026 with Playwright)

Pages read: `m3.material.io/components/toolbars/` overview, specs, guidelines, accessibility (read again for this version),
`/components/tabs/` overview, guidelines, accessibility, and `/foundations/designing/structure` (touch targets).

- **Docked = global, floating = contextual.** "Docked toolbar: Spans the full width of the window. It's best used for global
  actions that remain the same across multiple pages. Floating toolbar: Floats above the body content. It's best used for
  contextual actions relevant to the body content or the specific page." (toolbars/guidelines, Usage.) The owner's main part is
  M3's docked idea. Putting *contextual* tools in the same docked bar is not what M3 says. Deviation.
- **One toolbar on a phone.** "Don't use multiple toolbars in compact windows. There typically isn't enough room on screen.
  Instead, use one toolbar for all actions." (Presentation.) The owner's one bar agrees with this. It also drops the earlier
  deviation of two stacked rows.
- **Docked at the bottom.** "Only place docked toolbars at the bottom of the window." Ours is at the top, as today's main toolbar
  already is. Deviation, not new.
- **Divider.** "On web and large screens, the docked toolbar can be rounded. Dividers can be used to organize large amounts of
  items." (Adaptive design.) A divider between groups is in line with this.
- **Overflow.** "If there's not enough space for all items, put them in an overflow menu in the trailing slot." (floating
  toolbar.) The owner chose sideways scrolling for a phone. Deviation (owner's choice).
- **Transitions.** I looked for text on how a toolbar animates when its items change and found none. The only motion text:
  "Docked toolbars can either remain on the screen during scroll, or animate offscreen", the floating toolbar can "collapse into a
  single, high-emphasis action on scroll", and "Don't collapse actions and scroll at the same time." The slide-in and push is the
  owner's design and not in M3. Deviation.
- **Sizes and targets.** "By default all toolbars are 64dp high ... minimum outside padding of 16dp." "All elements need a
  minimum 48x48dp target area." "Consider making touch targets at least 48 x 48dp" (foundations/structure). "Only shrink the height
  and use extra small buttons if vertical space is limited." Our bar is 48 dp high.
- **Keyboard and role.** "On web, the toolbar container should have the toolbar role." "Tab or Arrows: Navigate between
  interactive elements; Space or Enter: Activate." The theme's `Toolbar` has one Tab stop with arrows inside.
- **Tabs and a menu instead of scrolling.** See section 3, last part: not used.

**What I could not read:** the images and token tables of the toolbar and tabs pages (script-drawn, no text), the Figma kit,
and a page named `accessibility-basics` ("page not found"). The Expressive note says toolbar code for the Web is "Unavailable",
so the theme's `Toolbar` is our own build of the design.

**Deviations to add to `docs/material-deviations.md` with step 1** (each: Material says / we do / why / date 2026-11-13):
1. *Contextual tools in the docked toolbar.* M3: contextual actions go in the floating toolbar. We: one docked bar holds
   the main and the contextual tools. Why: owner's decision, one bar for everything.
2. *Docked toolbar at the top.* M3: "Only place docked toolbars at the bottom of the window." We: top of the text editor
   (the bar stays with the text). Why: it belongs to the text box; the bottom is the keyboard and the save bar.
3. *Contextual tools slide in and push the main tools out.* M3: no such behaviour is described. We: the contextual tools slide in
   from the leading side and push the main tools out of view; they slide back when the context is left. Why: owner's decision.
4. *Scroll instead of an overflow menu.* M3: "put them in an overflow menu in the trailing slot". We: the bar scrolls sideways
   on a phone. Why: owner's choice, 13 November.
5. *Bar height 48 dp, not 64 dp.* M3 allows shorter "if vertical space is limited". We: 48 dp on every screen size. Why: it
   sits over the text; a phone is short.

## 3. The bar

```
PHONE 375 px

Nothing active (focus outside the text and blocks):
+--------------------------------------------+
| [+] [Undo] [Redo]  ▏ [Section settings]    |   main tools, from the left
+--------------------------------------------+

Cursor in text: the text tools slide in from the left, the main tools are pushed right and out:
+--------------------------------------------+
| [B] [I] [Link] [H] [T] [Align] [Lis ▏ ->   |   scroll right to reach: lists, colour,
+--------------------------------------------+   then ▏ divider, then [+] [Undo] [Redo] [Section]

A Table is active: its tools slide in, all seven:
+--------------------------------------------+
| [row↑] [row↓] [col←] [col→] [del row] [de ▏ ->
+--------------------------------------------+

COMPUTER 1280 px (both fit, nothing is pushed out of sight):
+----------------------------------------------------------------------------------+
| [B][I][Link][H][Lists][T][Align][Colour]  ▏  [+] [Undo] [Redo] [Section settings]|
+----------------------------------------------------------------------------------+
```

- **One bar, one row, one `Toolbar` part** (kind `docked`, colour `standard`, `role="toolbar"`). Inside it is one strip:
  contextual tools, divider, main tools. The strip is the scroll area. The floating `.contextual-menu` and selection pill are
  deleted; there is no second row, no second sticky bar and no arrow that opens a second line.
- **The divider** is the theme's `Divider` part (`theme/ui/Divider.tsx`), vertical, with the theme's outline-variant colour. It
  stays between the groups while the contextual tools are there, and is hidden when there are none (idle).
- **Idle.** Only the main tools, from the leading edge, so the slide-in reads as a push from the left. The bar keeps its height
  (48 dp), so the page never jumps.
- **Entering a context** (the cursor goes into text, or a block or row becomes active): the contextual tools slide in from the
  left and the main tools move right by the same distance (section 4). The strip is at its start (`scrollLeft` 0) so the first
  contextual tool is in view. **Leaving it:** the same movement the other way. **Changing from one context to another** (text to a
  Table, or a Table to another block) is not a slide: the contextual tools change in place with the theme's fade
  (`--motion-effects`); this is open question 3.
- **Phone: scroll.** The strip scrolls sideways (`scroll-snap`, scroll bar hidden, a fade on the cut edge). The main tools are
  pushed past the right edge and are reached by scrolling right. They stay in the page and in the tab order (not `inert`); an arrow
  key or Tab into them scrolls them into view. If the owner scrolled right to use Undo while in text, moving the cursor inside the
  same text does not scroll back; it resets only when the context changes.
- **Wide screens** (this is my recommendation, question 1): when the contextual and main tools both fit, nothing is pushed out of
  sight: the contextual tools slide in at the left, the main tools shift right only as far as the room needs and stay visible,
  with the divider between. When they do not fit (a narrow window), it behaves as on a phone.
- **Sticky.** The bar stays at the top while the text scrolls, as the main toolbar does today (M3: "Docked toolbars can either
  remain on the screen during scroll"). With one bar there is no pair to keep together, so this is not a question.
- **Phone keyboard.** The bar is at the top, so the keyboard cannot cover it (today's bars are placed with `visualViewport`
  and timers). iOS Safari can pan the page when the keyboard opens and a sticky top bar then slides away: if the device check
  shows this, a tiny listener sets one CSS variable from `visualViewport.offsetTop` (no timer, applied in the event). This needs a
  check on a real phone before the work is closed.
- **375 px.** The first six contextual tools of Text (Bold, Italic, Link, Heading, Text size, Alignment) are visible at 48 dp each
  = 288 dp of the 343 dp (16 dp edges); a part of the seventh shows at the edge as the hint that there is more (our version of M3
  tabs' "Offset the first scrollable tab 52dp from the leading edge so it's clear that more content is available"). The Table's
  seven tools are 336 dp: all of them in the strip, the last one cut by the edge.
- **Focus order and names.** One Tab stop for the bar, arrow keys inside (the theme's `Toolbar`, M3: "Tab or Arrows"), moving
  through the contextual group, the divider (skipped) and the main group. Each group is `role="group"` with its name (the
  block's name, "Table" or "Cards", or "Text tools"; and "Page tools" for the main tools). The divider is a separator. Every button
  keeps its `aria-label` and `title`; toggles keep `aria-pressed`. Escape returns the focus to the cursor. A tap on the bar never
  takes the cursor (mouse and touch down are cancelled, as `press()` does today).
- **Block pop-up.** The card menu `.site-block-menu` (Edit, Hide, Move, Remove) and the block's `⋮` become buttons at the end of the
  contextual group, before the divider. Where Remove or Hide have no room on a phone they are reached by scrolling.

**Why not tabs or a menu (the owner's question, answered).** Tabs "organize groups of related content" and M3 says "Avoid using more
than four tabs at once"; the active context here changes by itself with the selection, while a tab is chosen by the user; the
Toolbars pages say nothing about tabs in a toolbar; and tabs add a row, which the owner has now removed. An overflow menu is
M3's text for toolbars but costs a tap and hides the pressed state of a tool such as Bold. Scrolling, with the main tools reachable
by scroll, is the owner's choice and uses only the `Toolbar` part.

## 4. Remove the delay, and the motion

Every wait before the bar appears, moves or follows, found in the code:

| Where | What it is for | What the owner sees | Proposal |
| --- | --- | --- | --- |
| `STILL_MS = 700`, `stillTimer` (`stillCursor.mjs`, `lib/still-timer.mjs`) | The selection pill waits until the cursor has stood still 700 ms in a word, so it does not flash while typing. | Put the cursor in a word: nothing for 0.7 s, then the pill. Type: it vanishes. | **Remove.** The text tools are in the bar the moment the cursor is in text. Bold, Italic and Link still act on the word at the cursor (`wordRange` stays). Delete `stillTimer`, `STILL_MS` and their tests. |
| `setTimeout(follow, 100)` after a tool is pressed | Moves the pill again once the *Save changes* bar has appeared. | The pill hops a moment after a tap. | **Remove.** The bar does not depend on the save bar. |
| `follow`: `requestAnimationFrame` + `setTimeout(…, 250)` on scroll and `visualViewport` resize | Places the pill again after the keyboard has opened. | The pill slides to its place 0.25 s late. | **Remove.** Nothing to place. |
| `refresh = setTimeout(() => update(view))` on focus and blur | Waits one tick so a tap on the pill keeps the focus before the pill hides. | The pill stays one tick after you leave the text. | **Remove.** The context changes in the same event; taps on the bar are cancelled so the focus stays. |
| `contextualMenu.ts` `place()` on every scroll, resize, `visualViewport` event | The block bar follows the block. | The bar trails the page while scrolling. | **Remove** with the floating bar. |
| `blockCard` `setTimeout(start, 50)` up to 30 times | A new block waits for the closing Insert sheet to give back the focus, then puts the cursor in its first row. | Up to 1.5 s before the cursor appears in a new block. | **Keep.** Focus, not the bar; not part of this work. |
| `blockCard` `pointerdown` lock, 1000 ms | A finger on a block card must not open the phone's keyboard. | Nothing you can see. | **Keep.** Not the bar. |
| Animations on the bar | None today. | Bars appear and vanish at once, which reads as a flicker. | **Add the slide** below. |

**The slide.** Spring from the theme only: `motionTiming('spatial', 'fast')` (the same call that `MarkdownEditor.tsx` already uses
for a moved block, with the same `el.animate` and the same `prefers-reduced-motion` check), which is `var(--motion-spatial-fast)`.
No delay. The bar is built once with both groups in it. On entering a context the contextual group's width is measured, then in
one frame the contextual group animates `translateX(-width) → 0` and the main group the same `translateX(-width) → 0`, so the
main tools are pushed by the incoming ones (a "FLIP" move: no layout change is animated, so nothing reflows and the bar's height
does not move). Leaving is the same in reverse. An unfinished slide is reversed from where it is (the Web Animations API allows
`reverse()`), so quick taps in and out do not flicker. With reduced motion there is no slide: the groups swap at once. A change
from one context to another uses `var(--motion-effects)` (a fade).

**What keeps it from flickering without the wait:** the bar never mounts or unmounts; only the contextual group's content
changes. Tools that do not apply are `hidden` (the height is fixed), a toggle changes `aria-pressed` without a redraw. The old
reason for the 700 ms (a pill over the line you type on) is gone because the bar is not over the text.

## 5. The main part: global values

Decided: **Insert, Undo, Redo, Section settings** (the last only when the heading starts a section). Preview and the save state
are about the whole page and live in the page header and save bar already, not in this bar.

| Tool | About | Where |
| --- | --- | --- |
| Undo, Redo | the whole text | main part |
| Insert (+) | the whole text, at the cursor | main part |
| Section settings | the section the heading starts | main part |
| Bold, Italic, Link | the selection | contextual part |
| Heading (H), Bulleted / Check / Numbered list | the line under the cursor | contextual part |
| Text size (T), Alignment, colour | the line or selection | contextual part |

The main part is short, so on a phone it fits on screen when idle, and on a wide screen it always fits beside the contextual tools.

## 6. What moves where, by block

The contextual part follows the selection. "Row" = the active row or item of a repeating block. `⋮` = the block's own menu (Hide,
Move, Remove). Actions are today's, from the inline spec; this spec only moves them. On a phone every row scrolls.

| Block | Contextual tools |
| --- | --- |
| Text (cursor or selection) | Bold, Italic, Link, Heading, Text size, Alignment, Lists, Colour |
| Table | Row above, Row below, Column before, Column after, Delete row, Delete column, Settings, `⋮` |
| List | Add above, Add below, Move up, Move down, Link, Settings, Fill from a list, `⋮` |
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
| A list screen's selection (PR #529) | the selection's actions and a close button, in the same place |

## 7. Risks, checks, size

- **Risks:** (1) iOS keyboard and a sticky top bar (section 3); (2) the owner may scroll right and not find the contextual tools
  again: the strip resets to the left when the context changes; (3) the bar must keep the context while a sheet it opened (More,
  Settings) is open, because opening a dialog blurs the text: the context is held while a sheet from the bar is open, and ends the
  moment it closes with the focus elsewhere; (4) the push moves main tools the owner expects at one place (Undo): acceptable
  because on idle and on wide screens they are where they were; (5) a theme that styles `Toolbar` badly breaks the whole editor:
  the bar uses only `--toolbar-*` tokens and the `Divider` part; (6) the old bars' tests (`.contextual-menu` in
  `scripts/editor-screens.mjs`) must move.
- **Checks:** `check:screens` at 375 and 1280: one bar, 48 dp high, the same height idle, in text and on every block; the divider
  shows only with a context; at 375 the main tools are off screen in a context and reachable by scrolling (scroll the strip, then the
  Undo button is visible and works); at 1280 both groups fit and are visible; the first six text tools at 375; the Table's seven;
  no button under 48 dp; no horizontal page scroll; the slide runs with `prefers-reduced-motion: no-preference` (assert the
  animation exists, with the theme's duration) and is absent with `reduce`; `check:contrast` and `check:editor-colors` on the bar in each
  section colour; `check:css-values` finds no literal motion or spacing in the new CSS. Not covered by the scripts: the keyboard on a
  real phone, and how a theme looks; both by hand. The Preview of the branch cannot sign in, so the owner reads screenshots from
  `check:screens`.
- **Size and order (PRs into `main`, each with a changeset):**
  1. *Medium:* the one-bar shell. The main toolbar becomes the bar: main tools, divider, a slot for the contextual group; the text
     tools move into the slot; the selection pill, the second line and its arrow, `stillTimer` and `STILL_MS` are removed. Scroll on
     a phone. No slide yet. Empty changeset until visible.
  2. *Medium:* blocks move in. `contextualMenu.ts` becomes the bar's contextual group (`BarAction` stays); the Table's seven; the
     tests move; the floating `.contextual-menu` CSS is deleted. The touch-selection worker's `SelectionBar` plugs in here.
  3. *Small:* the slide and push (FLIP with `motionTiming`), the fade between contexts, reduced motion, the scroll reset.
  4. *Small:* the card pop-up `.site-block-menu` becomes bar buttons; the Image, Video, Notice items.
  5. *Small:* the iOS variable (if needed), the five deviation entries, the release note.
- **Release note:** yes, one **paragraph** (it changes how the editor looks): "Find the tools in one place" (English and Danish, with
  the `release-notes` skill). It goes with step 1, when the owner first sees it.

## 8. Open questions for the owner (the PM asks them one at a time)

Decided by the owner: one bar, no second row; the contextual tools slide in from the left, push the main tools right and out, and
roll back; a divider between them; the main part is Insert, Undo, Redo, Section settings; text tools always show with the cursor in
text; phone: the bar scrolls; no sticky question (one bar stays at the top).

1. **On a wide screen, are the main tools pushed out of sight too, or do both groups stay visible?** My recommendation: both stay
   visible when they fit (the push only moves the main tools as far as needed), because nothing needs hiding when there is room.
   The other option: the same push as on a phone, so the main tools disappear on a computer too.
2. **When idle, are the main tools at the left edge or centred as today?** Recommendation: at the left edge, so the slide-in from
   the left reads as a push. (M3: "In medium breakpoints and larger ... centering all elements" is allowed, not required.)
3. **Moving from one context to another (text to a Table, Table to Cards): slide again, or change in place with a fade?**
   Recommendation: a fade in place; the slide only on entering or leaving, so the bar is calm while you click around.
4. **When you tap the page header, a sheet or another screen, how fast does the bar roll back?** Recommendation: at once when the focus
   goes elsewhere, but not while a sheet that the bar opened (More, Settings) is open.
5. **A half-visible tool at the edge of the phone bar as the hint that there is more, and a fade on the cut edge?** Recommendation:
   yes (section 3); the alternative is no hint.
