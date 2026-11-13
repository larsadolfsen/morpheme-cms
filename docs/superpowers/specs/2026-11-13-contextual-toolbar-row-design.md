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
always show; on a phone the bar never scrolls and what does not fit is in a `⋮` drop-down; the editor's floating menus use the theme's own `Toolbar` part.

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
  toolbar.) The owner decided: no sideways scroll; what does not fit goes in `⋮`. In line with M3.
- **Transitions.** I looked for text on how a toolbar animates when its items change and found none. The only motion text:
  "Docked toolbars can either remain on the screen during scroll, or animate offscreen", the floating toolbar can "collapse into a
  single, high-emphasis action on scroll", and "Don't collapse actions and scroll at the same time." The slide-in and push is the
  owner's design and not in M3. Deviation.
- **Sizes and targets.** "By default all toolbars are 64dp high ... minimum outside padding of 16dp." "All elements need a
  minimum 48x48dp target area." "Consider making touch targets at least 48 x 48dp" (foundations/structure). "Only shrink the height
  and use extra small buttons if vertical space is limited." Our bar is 40 dp high (step -2, section 8), with 44 dp targets (the owner's decision, a deviation).
- **Keyboard and role.** "On web, the toolbar container should have the toolbar role." "Tab or Arrows: Navigate between
  interactive elements; Space or Enter: Activate." The theme's `Toolbar` has one Tab stop with arrows inside.
- **Tabs instead of a menu.** See section 3: not used.

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
4. *Bar height 40 dp, not 64 dp.* M3 allows shorter "if vertical space is limited". We: 40 dp on every screen size (step -2; the density
   entries are in section 8). Why: it
   sits over the text; a phone is short.

## 3. The bar

Decided by the owner: the bar never scrolls sideways ("No scroll in the menu" read as: the bar does not scroll; what does not fit goes
in the `⋮` drop-down, and the `⋮` holds tools). Whether the `⋮` list may scroll when it is long was decided: yes, it may scroll (section 3).

```
PHONE 375 px (room: 343 dp = 375 minus two 16 dp edges; 7 hit areas of 44 dp = 308 dp, 35 dp left for the divider and gaps)

Idle (focus outside the text and blocks): all four fit, no ⋮
+--------------------------------------------+
| [+] [Undo] [Redo]  ▏ [Section settings]    |
+--------------------------------------------+

Cursor in text: text tools slide in from the left, the main tools are pushed out; Undo and Redo stay, the rest is in ⋮
+--------------------------------------------+
| [B] [I] [Link] [H]  ▏  [Undo] [Redo] [⋮]   |
+--------------------------------------------+

A Table is active:
+--------------------------------------------+
| [row↑] [row↓] [col←] [col→] ▏ [Undo][Redo][⋮] |
+--------------------------------------------+

COMPUTER 1280 px (everything fits, so ⋮ holds only the block's Hide, Move, Remove, and is absent in text):
+----------------------------------------------------------------------------------+
| [B][I][Link][H][T][Align][Lists][Colour]  ▏  [+] [Undo] [Redo] [Section settings]|
+----------------------------------------------------------------------------------+
```

- **One bar, one row, one `Toolbar` part** (kind `docked`, colour `standard`, `role="toolbar"`): contextual tools, divider, main tools, then
  a trailing `⋮`. The floating `.contextual-menu` and selection pill are deleted; there is no second row, no second sticky bar, no
  arrow that opens a second line (today's `useToolbarLines` and `toolbarOrder.mjs` arrangements go).
- **The bar never scrolls.** It shows the tools that fit and puts the rest in `⋮`, by a fixed order of importance per context
  (the order in the lists below; a `ResizeObserver` measures the bar like `useToolbarLines` does now, and no timer is used). This is
  M3's own rule ("put them in an overflow menu in the trailing slot", "become visible again at larger sizes"), so the scroll
  deviation of the earlier drafts is gone.
- **The rule at 375 px (owner: one 44 × 44 hit area, section 8).** `slots = floor((width − 32 − divider) / 44)`: 343 / 44 = 7.8, so **7
  slots at 375 px**, and 7 at 360 px too (328 / 44 = 7.45). A slot is a tool, Undo, Redo or `⋮`. A context's own tools come first, then the
  divider, **Undo and Redo** (the main tools kept in view; decided by the owner), then `⋮`. Everything else of the context and of the main tools is
  in `⋮`, in groups: the context's tools first, then the page tools, then (blocks) Hide, Move, Remove. At 320 px (288 dp) 6 slots fit and
  the bar drops Redo into `⋮`.
- **Exact lists at 375 px** (bar | in `⋮`). The bar lists are the tools to show first; in a narrower window the last tool of a list moves into `⋮` first.

| State | On the bar (7 slots) | In `⋮` (groups in order, a divider between groups) |
| --- | --- | --- |
| Nothing active | Insert, Undo, Redo, divider, Section settings (when it applies) | no `⋮` |
| Text | Bold, Italic, Link, Heading, divider, Undo, Redo, `⋮` | Text size, Alignment, Lists (Bulleted, Check, Numbered), Colour; divider; Insert, Section settings (when it applies) |
| Table | Row above, Row below, Column before, Column after, divider, Undo, Redo, `⋮` | Table settings, Delete row, Delete column; divider; Insert; divider; Hide, Move, Remove |
| List, Cards, Points, Segmented list | Add above, Add below, Move up, Move down, divider, Undo, Redo, `⋮` | Link, Settings, Fill from a list (List, Segmented list); divider; Insert; divider; Hide, Move, Remove |
| Steps, Checklist | Add above, Add below, Move up, Move down, divider, Undo, Redo, `⋮` | Insert; divider; Hide, Move, Remove |
| Buttons, Price cards, Questions and answers, Links | Add above, Add below, Move up, Move down, divider, Undo, Redo, `⋮` | Link (Buttons), Settings, Fill from a list (Questions and answers); divider; Insert; divider; Hide, Move, Remove |
| Image | Change image, Crop, Alt text, Settings, divider, Undo, Redo, `⋮` | Insert; divider; Hide, Move, Remove |
| Video, Notice, Testimonials, Posts, HTML, Banner | Settings (Video: Change address first; Testimonials and Posts: Edit), divider, Undo, Redo, `⋮` | Insert; divider; Hide, Move, Remove |

  A rejected choice, Undo only, frees one slot: the contextual tools get a fifth (Text: Text size; List: Link; Table: Table
  settings; Image and the single blocks: nothing more to add), and Redo goes into `⋮`.

  **The `⋮` on a phone is a pop-up menu (owner decision), not a bottom sheet.** The theme's `Menu` part, anchored to the `⋮` button: it opens
  under the button, its trailing edge on the button's trailing edge, 8 dp from the screen edge, as wide as `--menu-width` (18rem) allows
  within the screen, and opens downwards (M3: "If opened at the top of the screen, it expands downwards to avoid being cropped"). Rows are
  44 dp (`--menu-item-height: 2.75rem` in `theme/styles/global.css` already). It **closes** on a tap outside, on Escape, and when a row is
  chosen (a toggle row, such as a list kind, closes it too); focus returns to the `⋮`, and the text cursor does not move: the rows cancel mouse
  and touch down like the bar's buttons, as the editor's alignment and text-style menus already do, so the selection stays and the keyboard stays
  open. **The bottom sheet is not used for `⋮`.** The existing *More* sheet (`moreSheet`, 14 rows) was opened only by the selection pill's
  *More* button (`MarkdownEditor.tsx`, `selectionMenu`); with the pill deleted nothing opens it, and its rows (text styles, lists,
  alignment, colours) are in `⋮`. Recommendation: delete the *More* sheet in step 1 unless the owner wants it for something else.

  **How long the `⋮` list gets (heights are estimates where marked).** Row 44 dp, menu padding 8 dp above and below. Longest: Text, with
  Section settings = 8 rows (352 dp) + one divider + padding ≈ 378 dp. Table and List: 7 rows + 2 dividers ≈ 342 dp. The other blocks: 3 to 6
  rows. Room under the bar (bar 40 dp; status bar 24 dp, my estimate; keyboard 290 dp portrait and about 160 dp landscape, my
  estimates, not read from a device):

  | Phone | Room for the pop-up | Text (≈ 378) | Table, List (≈ 342) |
  | --- | --- | --- | --- |
  | 375 × 667, portrait, no keyboard | 667 − 24 − 40 ≈ 603 dp | fits | fits |
  | 375 × 667, portrait, keyboard open | 667 − 290 − 24 − 40 ≈ 313 dp, minus 8 dp margin ≈ 305 | scrolls: 6 rows show | scrolls: 6 rows show |
  | 667 × 375, landscape, no keyboard | 375 − 40 ≈ 335 dp (status bar assumed hidden in landscape, an estimate), minus 8 ≈ 327 | scrolls: 7 rows show | nearly fits: 7 rows |
  | 667 × 375, landscape, keyboard open | 375 − 160 − 40 ≈ 175 dp, minus 8 ≈ 167 | scrolls: 3 rows show | scrolls: 3 rows show |

  **The keyboard is usually open** when the `⋮` is used in text (the bar's buttons keep the cursor, so the keyboard stays), so the realistic cases
  are the second and fourth rows: the Text list does not fit and must scroll, in portrait after 6 rows. The pop-up is placed inside the
  visible screen (`visualViewport`, the bar is at the top so it opens downward into the room above the keyboard), with `max-height` set to the room,
  not to the theme's `calc(100dvh - 2rem)`. **Decided by the owner: yes, the pop-up may scroll when it does not fit.** The theme's `.menu` already has
  `overflow-y: auto`. M3 says "Menus can scroll when all menu items can't display at once. In this state, menus show a persistent scrollbar."
  The theme sets no scrollbar rule on `.menu`, so on a phone the browser's overlay scrollbar hides when idle: not a persistent one. To meet M3,
  the editor's menu sets `scrollbar-width: thin` and `scrollbar-gutter: stable` (a desktop browser then keeps it visible; a phone's overlay
  scrollbar cannot be forced). Our cue on a phone: the list shows a half-cut row at the bottom, and the most used rows come first (Text size,
  Alignment, Lists, Colour), so Insert and Section settings are the ones that scroll into view. To reduce scrolling: the Undo-only option of
  the Undo-only choice would not help (it moves a row out of the bar, not out of the list).
- **The divider** is the theme's `Divider` part (`theme/ui/Divider.tsx`), vertical, in the theme's outline-variant colour, between the
  contextual and main tools. It is hidden when there is no context (idle). In the `⋮` list a `MenuDivider` (also the theme's
  `Divider`) separates the groups.
- **Idle.** Only the main tools, from the leading edge, so the slide-in reads as a push from the left. The bar keeps its height
  (40 dp), so the page never jumps.
- **Entering a context** (the cursor goes into text, or a block or row becomes active): the contextual tools slide in from the left
  and the main tools are pushed to the right and out of view (section 4); the tools that do not fit are then in `⋮`, and Undo stays at
  its place after the divider. **Leaving it:** the same movement the other way. **Changing from one context to another** is not a slide: the
  contextual tools change in place with the theme's fade (`--motion-effects`); question 2.
- **Wide screens** (my recommendation, question 1): when the contextual and main tools both fit, nothing is pushed out of sight: the
  contextual tools slide in at the left, the main tools shift right only as far as the room needs and stay visible, with the divider
  between, and no `⋮` for tools (only the block's Hide, Move, Remove). When they do not fit (a narrow window) it behaves as on a phone.
- **Sticky.** The bar stays at the top while the text scrolls, as the main toolbar does today (M3: "Docked toolbars can either
  remain on the screen during scroll"). With one bar there is no pair to keep together, so this is not a question.
- **Phone keyboard.** The bar is at the top, so the keyboard cannot cover it (today's bars are placed with `visualViewport`
  and timers). iOS Safari can pan the page when the keyboard opens and a sticky top bar then slides away: if the device check
  shows this, a tiny listener sets one CSS variable from `visualViewport.offsetTop` (no timer, applied in the event). This needs a
  check on a real phone before the work is closed.
- **Focus order and names.** One Tab stop for the bar, arrow keys inside (the theme's `Toolbar`, M3: "Tab or Arrows"), moving
  through the contextual group, the divider (skipped), Undo and `⋮`. Each group is `role="group"` with its name (the block's name,
  "Table" or "Cards", or "Text tools"; "Page tools" for the main tools). `⋮` has `aria-haspopup` and `aria-expanded`, its name is
  "More". Every button keeps its `aria-label` and `title`; toggles keep `aria-pressed`. Escape closes the `⋮` list and returns the
  focus to the cursor. A tap on the bar never takes the cursor (mouse and touch down are cancelled, as `press()` does today).
  A tool that is in `⋮` for lack of room is disabled-not-removed in the list when it does not apply (M3: "it should appear disabled
  rather than be removed").
- **Block pop-up.** The card menu `.site-block-menu` (Edit, Hide, Move, Remove) and the block's `⋮` become the one `⋮`: after the
  tools, a divider, then Hide, Move, Remove.

**Why not tabs (the owner's earlier question).** Tabs "organize groups of related content" and M3 says "Avoid using more than four
tabs at once"; the active context here changes by itself with the selection, while a tab is chosen by the user; the Toolbars pages
say nothing about tabs in a toolbar; and tabs add a row, which the owner has removed.

### What M3 says about drop-downs and overflow (read 13 November 2026, Playwright)

Owner: "If Material Design 3 wants drop-downs, I guess we need to implement that as well." Pages: `/components/toolbars/guidelines`,
`/components/menus/` overview and guidelines, `/components/top-app-bar/guidelines` (the page `/app-bars/guidelines` gives the same text),
`/components/icon-buttons/guidelines`.

- **Toolbar, when tools do not fit:** "If there's not enough space for all items, put them in an overflow menu in the trailing
  slot. As the breakpoint expands, more actions can be revealed." And: "Actions at the trailing edge of the toolbar can collapse into
  an overflow menu at smaller breakpoints, and become visible again at larger sizes." (toolbars/guidelines, Adaptive design.) For a floating
  toolbar: "If more actions are needed, use an overflow menu." For a docked toolbar the page says "Be cautious of including too many
  controls" and gives no scroll behaviour. So yes: M3 wants an overflow menu, at the trailing end, for what does not fit, and shown
  directly again on a wider screen.
- **What a menu is for:** "Use a menu to show a temporary set of actions. To show actions on screen at all times, use a toolbar
  instead." Menus are used for "Overflow menus, Text field dropdown menus, Select menus, Context menus." (menus/guidelines.) M3
  calls dropdown and exposed dropdown "menu" now: "they differ only in the element which opens the menu surface" (overview).
- **On a phone:** "Consider adapting menus into bottom sheets on small screens. They have more space to display additional items
  and longer labels." On medium and larger windows "menus are most effective as they appear in context". (Adaptive design.)
- **Items:** "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed."
  Items can be grouped "by adding a divider". "Targets should be 48x48dp or larger." "Don't add buttons, switches, or other direct
  actions into the menu item." Menus "can open instantly" in dense products; on desktop menus use an enter and exit transition otherwise.
- **App bars:** "If the product has many actions, place those in a toolbar. Avoid placing an overflow menu in the app bar when
  possible." (top-app-bar/guidelines.) That is about the top app bar, not the toolbar, but it shows M3 prefers a toolbar of
  many actions over a menu in the bar.

**Not read:** the images of the menus, and any M3 text that says which actions to put in an overflow menu: it gives no rule for
that, only "the most essential actions" (floating toolbar, "Choose the most essential actions to show on screen by default"). So
which tools go in the menu is our choice.

**Is there a drop-down part to reuse?** Yes, no new part is needed. The theme has `Menu` and `MenuItem` (`theme/ui/Menu.tsx`, with
groups, dividers, `checked`, `disabled`, submenus) and `DropdownMenu` (a button that opens a menu on the site, `dropdownMenu.script.ts`). The editor
already opens a `Menu` from a toolbar button (the alignment and text-style menus in `MarkdownEditor.tsx`). M3 would let a menu become a bottom
sheet on a phone; the owner decided on a pop-up menu for `⋮` (section 3).

**Decision:** an overflow `⋮` as M3 says; the bar never scrolls; the main tools that the push moves out are in `⋮`, with Undo kept on the
bar. Not read: any M3 text that says which actions to put in an overflow menu (it gives none; "Choose the most essential actions to show
on screen by default" is all), so the lists above are our choice.

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
No delay. The bar is built once with both groups in it, clipped (`overflow: hidden`, not scrollable) while it slides. The tools that do not fit are in `⋮` when the slide ends. On entering a context the contextual group's width is measured, then in
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
Move, Remove). Actions are today's, from the inline spec; this spec only moves them. The tools in the table are the ones shown at 1280 px; on a phone, with the recommended overflow (question 1), the last ones sit behind `⋮`.

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

- **Risks:** (1) iOS keyboard and a sticky top bar (section 3); (2) a tool the owner is used to (Redo, Insert, Section settings) is one tap deeper in `⋮` while a context is active on a phone: Undo
  stay on the bar, the rest is in the `⋮` menu (decided); (3) the bar must keep the context while the Settings sheet it opens
  is open, because opening a dialog blurs the text: the context is held while a sheet from the bar is open, and ends the
  moment it closes with the focus elsewhere (the `⋮` pop-up keeps the focus in the text, so it needs no such rule); (4) the push moves main tools the owner expects at one place (Undo): acceptable
  because on idle and on wide screens they are where they were; (5) a theme that styles `Toolbar` badly breaks the whole editor:
  the bar uses only `--toolbar-*` tokens and the `Divider` part; (6) the old bars' tests (`.contextual-menu` in
  `scripts/editor-screens.mjs`) must move; (7) the invisible hit area reaches 2 dp over the text box's edge (section 8): a tap in that strip must hit the tool, and
  `check:screens` measures it.
- **Checks:** `check:screens` at 375 and 1280: one bar, 40 dp high, the same height idle, in text and on every block; the divider
  shows only with a context; at 375 the bar holds exactly the lists of section 3 (Text, Table, List, Image: tool names read from the bar and from the
  `⋮` menu), never scrolls (`scrollWidth` equals `clientWidth`), and Undo stays on it and works; the `⋮` menu (opened at 375 px, with and without the keyboard) lists the rest and scrolls when it does not fit; at 1280 both groups fit and are visible; no hit area of the bar, the `⋮` or its rows under 44 dp (the `::before` hit area is measured, not the visible 40 dp); no horizontal page scroll; the slide runs with `prefers-reduced-motion: no-preference` (assert the
  animation exists, with the theme's duration) and is absent with `reduce`; `check:contrast` and `check:editor-colors` on the bar in each
  section colour; `check:css-values` finds no literal motion or spacing in the new CSS. Not covered by the scripts: the keyboard on a
  real phone, and how a theme looks; both by hand. The Preview of the branch cannot sign in, so the owner reads screenshots from
  `check:screens`.
- **Size and order (PRs into `main`, each with a changeset):**
  1. *Medium:* the one-bar shell. The main toolbar becomes the bar: main tools, divider, a slot for the contextual group; the text
     tools move into the slot; the selection pill, the second line and its arrow, `stillTimer` and `STILL_MS` are removed. The bar's overflow into `⋮`
     (the same pop-up `Menu` on a phone and a computer; the *More* sheet and its opener are deleted). No slide yet. Empty changeset until visible.
     **The 44 dp hit area goes in with this step, so no check fails:** (a) `check:screens` has rules written for 48:
     `scripts/editor-screens.mjs` line 218 (the text menu's buttons "smaller than 48 dp", for the pill that is deleted) goes with the pill, and
     line 1644 (`.contextual-menu button` height under 47.5) is replaced by one rule for the bar: every button of the bar, the `⋮` and its
     rows has a hit area of at least 44 × 44 dp (measured through the `::before`), and no other part of the editor drops under 48; (b) the bar's
     CSS (`.contextual-menu button` and `.editor-selection-menu button` are 3rem today) gives way to the bar's own tokens: the theme's icon
     button box defaults to `var(--icon-button-size, 2.75rem)` (`theme/styles/ui.css:642`, 44 px), while `docs/material-deviations.md` (CSS
     sweep 4) says the icon button is drawn at 48 dp; I did not trace which value is live, step 1 does; the bar sets `--icon-button-size`
     for itself; (c) the deviation entry of section 8 goes into `docs/material-deviations.md` in the same pull request, so the deviation
     check does not flag it; (d) `check:contrast` and the other checks do not look at target size, and the line-385 and line-3088 rules of
     `editor-screens.mjs` (the empty hint, the accordion row) are other parts and stay at 48.
  2. *Medium:* blocks move in. `contextualMenu.ts` becomes the bar's contextual group (`BarAction` stays); the Table's seven; the
     tests move; the floating `.contextual-menu` CSS is deleted. The touch-selection worker's `SelectionBar` plugs in here.
  3. *Small:* the slide and push (FLIP with `motionTiming`), the fade between contexts, reduced motion.
  4. *Small:* the card pop-up `.site-block-menu` becomes bar buttons; the Image, Video, Notice items.
  5. *Small:* the iOS variable (if needed), the four deviation entries, the release note.
- **Release note:** yes, one **paragraph** (it changes how the editor looks): "Find the tools in one place" (English and Danish, with
  the `release-notes` skill). It goes with step 1, when the owner first sees it.

## 8. Owner input: editor menus (decisions)

Owner's advice: (a) in an editor the UI around the content should take as little room as possible, so high density (-2/-3) fits
toolbars; (b) icons drawn 20 to 24 dp, hit area still 44 dp with a mouse and 48 dp on touch; (c) icon-only buttons need clear hover
states and tooltips that show the keyboard shortcut; (d) do not put everything in one long scrolling drop-down: a quick toolbar (top
actions only), context menus where the user works, and a command palette. **Owner decision (13 November): "Let us make the editor
menu an exception to the user choice and follow what I gave you."** So the editor's bar and menus do **not** follow the per-user
density choice of PR #518; they are fixed as below. Checked against M3 (Playwright: `/foundations/layout/understanding-layout/density`,
`/components/tooltips/guidelines`, `/components/icon-buttons/specs` and `accessibility`, `/components/menus/guidelines`) and the code.

**What is decided**

1. **Fixed high density for the bar, the `⋮` list and the formatting menus.** They read their own density tokens (set to step -2 in the
   editor's CSS), not the user's density setting, and not the theme's default. A theme can still restyle them through the same tokens.
2. **Step -2, not -3 (my proposal, owner decides the step: question 3).** M3: each step takes 4 dp off the height ("Higher density is
   typically applied by decreasing the top and bottom padding or overall height by 4dp"). The bar is 48 dp tall at step 0 in this spec
   (the button height, no extra padding; the height the theme's `Toolbar` draws today I have not measured, its docked padding is a
   token, to be measured in step 1). **-2 makes the bar 40 dp tall, -3 makes it 36 dp.** A 24 dp icon in 40 dp leaves 8 dp above and
   below; in 36 dp only 6 dp, or a 20 dp icon. Recommendation: -2 with 24 dp icons (the owner's range is 20 to 24 dp: the
   card menu draws 20 dp icons today; whether the `⋮` rows use 20 or 24 dp is decided in step 1).
3. **One hit area of 44 × 44 dp, on mouse and on touch, for the bar's buttons and the `⋮` rows (owner decision: "Let's make the editor
   menu 44x44 px, breaking the MD3 rules, but following Apple").** Only the editor's bar, its `⋮` and the rows of its menu or sheet; every
   other part of the editor and of the theme stays on M3's 48 dp. The visible button is 40 dp tall (the bar); its hit area is extended by an
   invisible `::before` (pointer events on, no background) to 44 × 44 dp, 2 dp above and below the bar. At the bottom it covers the first 2 dp
   of the text box's edge, and the bar wins a tap there. The hit areas never overlap each other (the pitch along the bar is 44 dp).
   **Apple, read 13 November 2026 on `developer.apple.com/design/human-interface-guidelines/buttons`:** "As a general rule, a button needs a
   hit region of at least 44x44 pt — in visionOS, 60x60 pt — to ensure that people can select it easily, whether they use a fingertip, a
   pointer, their eyes, or a remote." and, on `/accessibility`, a table "Default control size | Minimum control size": iOS and iPadOS 44x44 pt
   | 28x28 pt. Apple's 44 applies to a pointer as well as a finger, which is why one size serves mouse and touch. (The toolbars page of the
   Human Interface Guidelines gave no number I could read; the 44 is the buttons page's.)
4. **Hover and focus:** M3's 8% state layer on hover (read: "Hovered (8% state layer)") and the focus ring, from the theme's icon
   button; the pressed state of a toggle (Bold) is clear.
5. **A tooltip on every icon-only button of the bar and its menus**, as today (the theme's plain tooltip, `useTooltip` in
   `src/ui.tsx`), **now with the keyboard shortcut after the name** ("Bold  Ctrl+B", "Bold  ⌘B" on a Mac) **and `aria-keyshortcuts`**,
   for every tool that has a key. Today no tooltip shows a shortcut and no button has `aria-keyshortcuts`. The text engine has
   `Mod-b`, `Mod-i`, `Mod-e`, `Mod-z`, `Mod-y`, `Shift-Mod-z`, `Mod-Alt-5` to `Mod-Alt-8`, `Mod-Shift-b`, `Mod-Alt-c` (key names
   found in the Milkdown preset files, not tested in the editor, none found for Link). A tool with no key shows the name only; giving
   Link and the others a key is a separate small change.
6. **A quick bar and context where the user works.** The one bar is both: its contextual tools are the text actions on text and the
   block's actions on a block (section 6), and the `⋮` is grouped, never one long list. A right-click context menu and a command palette
   are not part of this spec: they are a separate spec (the PM starts it).

**Slots at 375 px with 44 dp hit areas (real numbers).** The bar is 40 dp tall; the width is set by the hit area, 44 dp. Room is 343 dp
(375 − 2 × 16): 343 / 44 = 7.8, so **7 slots fit at 375 px** (308 dp, 35 dp left for the divider and gaps), **7 at 360 px** (328 / 44 =
7.45) and 6 at 320 px. With 48 dp it would have been 6. The rule the bar uses: `slots = floor((width − 32 − divider) / 44)`, measured, never a
timer. The exact lists are in section 3.

**M3 deviations of this exception** (entries for `docs/material-deviations.md`, with step 1):
- *Editor bar and menus ignore the user's density.* **M3 says:** "People can change density as long as the density controls are
  accessible" and "Density shouldn't automatically change across breakpoints or orientation unless a person changes it" (density
  page). **We do:** the bar, the `⋮` list and the formatting menus are fixed at step -2 whatever the person chooses in #518's
  setting. **Why:** owner's decision, 13 November: an editor's own UI should take little room. Date 2026-11-13.
- *Step -2 on a toolbar and its menus.* **M3 says:** "Don't increase density in UIs that involve focused tasks, such as selecting from a
  menu. It reduces usability by limiting selectable space." **We do:** the `⋮` list rows and the formatting menus are also at step -2,
  but each row keeps its 44 dp hit height, so the space to select is not reduced. **Why:** same.
- *44 × 44 hit area in the editor's bar and menus.* **M3 says:** "All elements need a minimum 48x48dp target area to be accessible." (toolbars/guidelines,
  Anatomy) and "For most platforms, consider making touch targets at least 48 x 48dp." (foundations/structure). **We do:** 44 × 44 dp on mouse
  and touch, only for the editor's bar, its `⋮` and the rows of its menu or sheet; everything else stays on 48. **Why:** owner's decision, 13
  November, following Apple's Human Interface Guidelines ("a button needs a hit region of at least 44x44 pt"). Date 2026-11-13.
- *Overlay scrollbar of the `⋮` pop-up on a phone.* **M3 says:** "Menus can scroll when all menu items can't display at once. In this state, menus show a persistent scrollbar." (menus/guidelines, Scrolling.) **We do:** `scrollbar-width: thin` and `scrollbar-gutter: stable` on the editor's menu, so a persistent scrollbar shows where the browser allows it (a computer); on a phone the browser's overlay scrollbar hides when idle and cannot be forced, so there we do not match; the cue is a half-cut last row. **Why:** the platform. Date 2026-11-13. M3 also says "Don't use gaps in scrollable menus": the `⋮` menu uses dividers only.
- Not a deviation: the tooltip with a shortcut. M3's plain tooltip "briefly describe[s] a UI element" and says nothing for or against a
  shortcut; menu items may carry "keyboard commands" as trailing text.

**Not read:** the icon sizes of the icon button (images), density numbers for toolbars (M3 gives them for the segmented button only),
and any M3 text on shortcuts in tooltips.

### Our longest menus today (counted from the code, 13 November 2026)

| # | Menu | Rows | Fed by | Where |
| --- | --- | --- | --- | --- |
| 1 | Choice fields (`Select`, `ChoiceMenu`): a menu under the field on a computer, **already a bottom sheet with search on a phone** | the field's options, no cap; I did not count a real site | a field's options, a loaded list of pages or an app's tools | `src/ui.tsx` (3960 to 4042), `fields.tsx`, `ToolSelect.tsx` |
| 2 | *More* sheet (a sheet, not a `Menu`) | 14: 5 text styles, 3 lists, 3 alignments, 2 colours, No color | fixed lists | `MarkdownEditor.tsx` (`moreSheet`) |
| 3 | Insert sheet (a sheet, A to Z with search) | about 20 block types (not counted exactly; `theme/blocks` has 24 entries, some helpers) | the block registry | `MarkdownEditor.tsx` (`blocks.insert`) |
| 4 | Language picker (a sheet with search) | 2 today (`da-DK`, `en-US`) | `locales = Object.keys(messages)` | `Library.tsx` (890), `src/i18n/index.ts` |
| 5 | Add field menu (`Menu`) | 6 field kinds | fixed | `AddFieldMenu.tsx` |
| | Dashboard card menu | about 5 (move up, move down, settings, divider, more) | the card | `DashboardEdit.tsx` |
| | Editor text menus: Alignment 3, Text style 5, List 3, Heading 3 | 3 to 5 | fixed | `MarkdownEditor.tsx` |
| | `FabMenu` (create) | the start screen 2 (pages, blog); a list one per kind | the site's lists | `StartFab.tsx`, `ListFab.tsx` |

The longest real `Menu` today has 6 rows; the long lists are sheets and data-driven choices. The planned `⋮` menu (7 to 8 rows) would be the
longest `Menu` we have. **How the theme `Menu` behaves when long:** `.menu` has `max-height: var(--menu-max-height, none)` and
`overflow-y: auto` (`theme/styles/ui.css:3076-3081`); the popover form has `max-height: var(--menu-max-height, calc(100dvh - 2rem))` (:3274); the
site's dropdown menu `min(20rem, calc(100dvh - 2rem))` (:3398). So it scrolls when too tall. The theme sets no scrollbar rule on `.menu` (the only
`scrollbar-width: none` rules are for chips, the carousel and tabs), so it shows the browser's default, an overlay scrollbar on a phone that hides
when idle. M3: "In this state, menus show a persistent scrollbar." So it does **not** match M3 on a phone. Menu rows are already 44 dp
(`--menu-item-height: 2.75rem`, `theme/styles/global.css:262`).

## 9. Open questions for the owner (the PM asks them one at a time)

Decided by the owner: one bar, no second row; the contextual tools slide in from the left, push the main tools right and out, and
roll back; a divider between them; the main part is Insert, Undo, Redo, Section settings; text tools always show with the cursor in
text; the bar and its menus are fixed at high density, outside the user's density choice (section 8); the bar never scrolls and what does not fit is in `⋮` (the `⋮` holds tools); on a phone the `⋮` is a pop-up menu, not a bottom sheet; the editor's bar and menus use a 44 × 44 dp hit area and are fixed at high density; Undo and Redo stay on the bar next to `⋮` while a context is active; the `⋮` pop-up may scroll when it does not fit, with a persistent scrollbar where the platform allows, dividers (no gaps) in it, the most used rows first and a half-cut last row as the cue on a phone; no sticky
question (one bar stays at the top).

1. **On a wide screen, are the main tools pushed out of sight too, or do both groups stay visible; and when idle, are the main tools
   at the left edge or centred as today?** Recommendation: both stay visible when they fit, and the main tools stand at the left edge when
   idle, so the slide-in from the left reads as a push.
2. **Two small behaviours.** (a) Moving from one context to another (text to a Table, Table to Cards): a fade in place, not another slide
   (recommendation), so the bar is calm while you click around. (b) When focus goes to the page header, a sheet or another screen: the bar
   rolls back at once, but not while a sheet that the bar opened (More, Settings) is open (recommendation).
3. **Which density step for the bar and menus: -2 (40 dp tall, recommended) or -3 (36 dp)?** M3 has both; each takes 4 dp off the height. With
   -2 a 24 dp icon keeps 8 dp of air above and below; with -3, 6 dp. The hit areas are 44 dp either way.
