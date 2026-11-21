# Audit: old owner decisions in the theme that deviate from Material 3

Date: 2026-11-21. Read-only audit; no code changed.

**Rule (owner, 21 Nov 2026):** Material 3 wins everywhere outside the page and post editor's own workspace, whatever an older owner decision said. An older decision that deviates is void unless M3 itself says so.

**Scope.** `theme/styles/**` (`tokens/*/comp`, `ui/`, `blocks/`, `lists.css`, `base.css`, `global.css`, `cards.css`, `site-*.css`), searched for comments naming an owner decision, a date, "not M3", "deviation", and for `padding-inline: 0` and other zero-room overrides in the theme's own components.
**Not repeated:** plain-list row padding at medium and wide (`--mo-comp-list-item-padding-inline: 0`, `tokens/lists/comp/list.css:19-29`), which batch 18 (session_01GGzusMnAByKqv1frCe1Mgc) is fixing.

**What was read.** Live pages with Playwright on 21 Nov 2026: `m3.material.io/components/lists/{overview,specs,guidelines}`, `/components/buttons/{specs,guidelines}`, `/components/cards/{specs,guidelines}`, `/components/chips/specs`, `/components/menus/{specs,guidelines}`. The Specs token tables come out collapsed in a text read, so the numbers below that are not in the page text come from the repo's copy of M3's token sets (`docs/m3-tokens/`, content version `2026-11-19_06-20-01`, fetched from m3.material.io on 21 Nov 2026). Spacing scale there: space100 = 8, space125 = 10, space150 = 12, space200 = 16, space300 = 24 dp.

## Findings

| # | file:line | Old decision (date) | What M3 prints (page, value) | Verdict | Fix (one line) |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | `theme/styles/ui/buttons.css:218`, `tokens/material/comp/button.css:29` (`--mo-comp-button-text-padding: 1.5rem`) | A text button's side padding is the other buttons' (owner, 16 Nov 2026), whatever its size. | Buttons, Specs token set: a 40 dp (small) button has `leading-space` and `trailing-space` = space200 = **16 dp**; 24 dp (space300) belongs to the 56 dp medium button. `md.comp.button.text.*` has no spacing token of its own. | **Deviates.** The theme's 40 px button, `tokens/material/comp/button.css:19` (`--mo-comp-button-padding: 1.5rem`), and so its text button, use 24 dp. | Set the 40 px button's side padding to 16 dp (`--mo-comp-button-padding`, `--mo-comp-button-text-padding`); 24 dp stays on the 56 dp size. Check which size the theme's "medium" is meant to be. |
| 2 | `theme/styles/tokens/material/comp/list.css:71` (`--mo-comp-list-expand-padding-inline: 1.5rem`, segmented List - Expand) and `tokens/lists/comp/list.css:3-7` ("the 24 dp of the old segmented look stays for rows with no media", owner 16 Nov 2026) | Segmented List - Expand rows with no media keep 24 dp; only rows with media get 16 dp. | Lists, Specs: "Label left padding **16dp**", "Leading element left padding 16dp"; `md.comp.list.list-item.leading-space` and `trailing-space` = 16 dp; "Use standard list item padding". | **Deviates** (no-media rows, 24 dp). The media case, 16 dp, **conforms**. | Make `--mo-comp-list-expand-padding-inline` 1rem for every segmented row and drop the `:has(...)` special case. |
| 3 | `theme/styles/tokens/blocks/comp/list.css:7` and `:37` (Questions-and-answers block: 20 px, 32 px from medium) | "The rows' padding follows the block: 20 px, 32 px from medium." | Lists, Specs: 16 dp leading and trailing (as row 2). | **Deviates.** | Use 1rem at every width for List - Expand rows; let the block's section padding give wider room, not the row. |
| 4 | `theme/styles/tokens/blocks/comp/list.css:51` (`.mo-block-checklist`, `--mo-comp-list-item-padding-inline: 0`, "its checks start where the text around it does") | A checklist's rows have no side room and block padding of 0.25em; nothing in it is tapped, so it is "spaced as a bulleted list". | Lists, Specs: 16 dp leading space and 10 dp top and bottom (space125) for a list item; the checklist is built from the theme's List. | **Deviates** (zero inline room, 4 px block room). Sibling of the plain-list rule batch 18 fixes, but a separate selector. | Give `.mo-block-checklist` the list's own item padding (16 dp inline, 10 dp block), or confirm batch 18's change covers it. |
| 5 | `theme/styles/tokens/lists/comp/list.css:29`, `:6-8` of `lists.css`, `tokens/blocks/comp/list.css` (plain List - Expand, `--mo-comp-list-expand-padding-inline: 0` at medium and wide) | The plain list's rows start on the text edge. | Lists, Specs: 16 dp (as row 2). | **Deviates.** Same decision as the plain List batch 18 fixes, but for the **expand** kind. | Ask batch 18 whether it includes List - Expand; if not, give the plain expand item 16 dp from medium. |
| 6 | `theme/styles/tokens/lists/comp/list.css:19-24` (compact: row layer runs full width with square corners, `--mo-comp-list-item-hover-radius: 0` etc.), `lists.css:84-90` | Full width on compact, "no border radius when full width" (owner, 16 Nov 2026). | Lists, Guidelines, Compact breakpoints: "Lists should extend edge-to-edge in compact windows." Specs token set: baseline list item shape = corner **none**; Expressive items 4 dp inner / 16 dp outer, selected 16 dp. | **Conforms.** The row keeps 16 dp inside its edge-to-edge layer (`--mo-sys-block-list-layer-room: 1rem`, `tokens/lists/sys.css`) and square corners are M3's baseline. No fix. | None. Leave as is while batch 18 changes the medium and wide rule. |
| 7 | `theme/styles/ui/list.css:160` (hover changes only the state layer, no colour change or shift; owner, 18 Nov 2026) | Hover is M3's 8 % layer and nothing else. | `md.comp.list.list-item.hover.label-text.color` = on-surface and the hover icon colours = on-surface-variant, the same as enabled; hover opacity = `md.sys.state.hover.state-layer-opacity`. | **Conforms.** | None. |
| 8 | `theme/styles/ui/list.css:484` (state layer on the whole expanded item, body included; owner, 16 Nov 2026) | The open body takes the touch colour too, "so an open item is one colour". | Lists, Specs, Expand token set (`md.comp.list.expand`): M3 prints no rule for the open body's state layer. | **M3 is silent.** Nearest pattern is the item's own container. | None; keep and note in "Where Material 3 is silent". |
| 9 | `theme/styles/lists.css:9-16` (open plain item gets a background; dividers on every item but the first row; owner, 17 Nov 2026) | A plain List - Expand's open item has the surface-container background; every item has a divider. | Lists, Guidelines: "Limit dividers to uncontained or complex lists, only when a stronger visual separation is necessary." and "Use gaps for contained lists." | **Partly deviates.** Dividers on every plain-expand item go beyond "only when a stronger separation is necessary". The open item's surface is M3 silent. | Draw the divider only where the list asks for it (inset, middle-inset), the way `docs/material-deviations.md` already says for the other lists. |
| 10 | `theme/styles/tokens/lists/comp/list.css:10-15` (a row's image has the 8 dp small corner; owner, 16 Nov 2026) | Square and landscape images take 8 dp. | `md.comp.list.list-item.leading-image.expressive.shape` = small = **8 dp**; `leading-video.shape` = small = 8 dp; `leading-avatar.shape` = full. | **Conforms** (Expressive). The baseline shape is 0 dp but the theme follows Expressive (owner, 15 Nov 2026). | None. |
| 11 | `theme/styles/tokens/material/comp/card.css:10` (elevated card elevated at rest; owner, 16 Nov 2026) | Level 1 at rest, level 2 hovered. | Cards, Guidelines: "Elevated cards have a drop shadow"; `md.comp.elevated-card.container.elevation` = level 1 (1 dp), hover level 2 (3 dp). | **Conforms.** | None. |
| 12 | `theme/styles/tokens/material/ref.css:25` (no shadow at rest on a surface; owner, 20 Nov 2026) | A part on level N reads its `-rest-shadow` = none. | Elevation page, quoted in `docs/material-deviations.md`: "Tokens have no shadows or color; each platform determines the specific shadows". Search overview: "Lower elevation and no shadow by default". | **Conforms / silent.** | None. |
| 13 | `theme/styles/ui/card.css:112` and `cards.css:224` (media's bottom corners are the card's radius, "deviation CM1", owner 16 Nov 2026) | Media with text under it is a rounded rectangle. | Cards, Specs: "12dp corner radius", "Left/right padding 16dp"; the Container example draws it. `docs/material-deviations.md` already lists it under "Where Material 3 is silent". | **Conforms / silent.** The comment still says "deviation CM1", which is stale. | Reword the comment; no code change. |
| 14 | `theme/styles/tokens/material/comp/card.css:14` and `ui/card.css:12` (8 px between cards) | Cards 8 px apart. | Cards, Specs: "Padding between cards **8dp max**". | **Conforms.** | None. |
| 15 | `theme/styles/tokens/material/comp/chip.css:8` (selected chip in the secondary container; owner, 15 Nov 2026) | Selected chip on `secondary-container`, label on `on-secondary-container`. | Chips use the secondary container for selected filter and input chips (Chips, Specs token sets). | **Conforms.** | None. |
| 16 | `theme/styles/tokens/material/comp/search.css:26` and `ui/search.css:153-165` (search results in the grid margin; owner's grid rule, 15 Nov 2026) | Results stand in the page margin, 16 dp compact and 24 dp from medium. | Search page prints no side margin for a segmented list. | **M3 is silent.** Listed in `docs/material-deviations.md` ("Where Material 3 is silent"). | None. |
| 17 | `theme/styles/tokens/material/sys.css:64` (grid margin 16 / gutter 24; owner, 15 Nov 2026) | Owner values. | Grids pages print no margin or gutter value. | **M3 is silent.** Listed in the same section. | None. |
| 18 | `theme/styles/tokens/blocks/sys.css:103,108`, `blocks/text-section.css:86-100`, `blocks/steps.css:9` (text measure, Steps 720 px, list columns; owner, 16 Nov 2026) | The measure of the page's text and of plain text rows. | Lists, Guidelines, Line length: "avoid excessively long lines of text when expanding containers"; no width printed. | **M3 is silent.** Already listed ("The site's text measure"). | None. |
| 19 | `theme/styles/site-logo-post.css:54` (post headline is the list's body large; owner, 18 Nov 2026) | The title takes the list item's type role. | The list item's headline is a list token. | **Conforms.** | None. |
| 20 | `theme/styles/base.css:100` (focus indicator tokens; owner, 21 Nov 2026) | M3's `focus.indicator` tokens. | `md.sys.state.focus-indicator.*`. | **Conforms.** | None. |

Zero-room overrides that are not owner decisions and need no fix: `cards.css:79,96,317` (carousel scroll padding), `site-blog.css:181` (blog tags are not an M3 part), `navigation-rail.css:95` (collapsed rail is zero width), `ui/buttons.css:493` (busy-button animation), `ui/pickers.css:557` (time picker action row; margin −0.75rem balances it), `tokens/base/comp/list.css:22` (`.mo-action-bar__text`, a text block in the action bar, not a list row).

Not covered by this pass: `theme/ui/*.tsx` and `theme/blocks/*` comments (searched, no owner-decision comments found), and comp tokens with no comment naming a decision (menu, dialog, sheet, nav paddings). Those would need a value-by-value pass against `docs/m3-tokens/`.

## Where `docs/material-deviations.md` records these

| # | Recorded there? |
| :-- | :-- |
| 1, 2, 3, 4, 5, 9 | **No.** None is listed. The file has no entry for button side padding, List - Expand padding, the checklist, or plain-list dividers. They are bugs under its own rule ("A deviation that is not listed here is a bug"); fixing them needs no new entry. |
| 6, 7, 8 | No entry needed (conforms, or M3 silent). #8 could go under "Where Material 3 is silent". |
| 10, 11, 14, 15, 19, 20 | "Closed because they match M3" lists the 56 dp buttons, list rows, chips; the others conform without an entry. |
| 12 | Yes: "Where Material 3 is silent", *Elevation shadows*. |
| 13 | Yes: "Where Material 3 is silent", *Cards* (media corners). |
| 16, 17, 18 | Yes: "Where Material 3 is silent" (*layout grid's margin and gutter*, *Search view*, *site's text measure*). |

## Order of fixes (suggested)

1. #1 (buttons, every page) and #2/#3 (List - Expand rows): one value each, wide effect.
2. #4, #5 together with batch 18's plain-list change, to avoid two PRs on the same files.
3. #9 (dividers).
4. Docs: add #8 and reword #13's stale comment.

---

# Part 2: every other place an old decision lives

Widened on 21 Nov 2026 at the PM's request (the CTO's scope): `docs/material-deviations.md`, the specs and plans, the skills, the allowlists' reasons, and code comments citing an owner decision in `theme/`, `src/` and `lib/`. Still read-only. Nothing changes until the CTO has reviewed this and the owner has decided.

**Verdicts:** *matches M3* · *differs, goes to M3* (with the version) · *page and post editor's workspace* (the bar and menus: allowed to differ) · *imitation* (CS2 PageSpeed, CS3 Google preview). The new rule (material-3 rule 6, on #1071) is not on this branch yet; each *differs* row names the old source, as it asks.

**Already sorted, not repeated.** `docs/superpowers/plans/2026-11-21-0-19-5-deviations-sorted.md` (batch 9) sorted every entry of `docs/material-deviations.md` outside the workspace into GO / WCAG / OWNER / OTHER BATCH. Its OWNER rows are the ones the new rule makes void unless M3 says so; Part 2 re-checks them below against the real page.

**Pages read with Playwright, 21 Nov 2026:** `/components/dialogs/{guidelines,specs,accessibility}`, `/components/app-bars/guidelines`, `/foundations/designing/structure`, `/components/side-sheets/guidelines`, plus the pages of Part 1. Token values: `docs/m3-tokens/`.

## The example the PM named first: the basic dialog's actions

| Old source | Old decision | What M3 prints | Verdict | Fix |
| :-- | :-- | :-- | :-- | :-- |
| `.claude/skills/developer/SKILL.md` §4 *Dialog*; `src/ask.tsx` (owner's dialog rule, quoted in `specs/2026-11-14-one-save-while-writing-design.md` 3.4) | The main choice is a **filled** button, the other choices **outlined**. | Dialogs, Guidelines, *Display two text buttons next to one another* (a "Do" example); Specs anatomy lists "Text button" as the actions' part; "Dialogs should contain a maximum of two actions." | **Differs, goes to M3.** Not the page or post editor's workspace. | Both actions are text buttons; the confirming one stays closest to the trailing edge. |
| same rule | "No control has the focus when it opens." Also `src/BlockDialog.tsx:371` ("No control has the focus at the start (owner, 15 Nov)"). | Dialogs, Accessibility, *Initial focus*: "When a dialog appears, focus should automatically land on the first interactive element within the dialog." | **Differs, goes to M3.** | Let the dialog's first interactive element take focus (the native `<dialog>` does this). The ring-and-tooltip worry the comment names is a styling question: M3's focus ring is `:focus-visible`. |
| same rule | The confirming button is the one closest to the edge. | Dialogs, Guidelines: "The confirmation button is always closest to the edge." | **Matches M3.** | None. |
| developer §4 *Dialogs are only for short messages* | A dialog is a message, a confirmation or one short choice. | Dialogs, Guidelines: "Common use cases for basic dialogs include alerts, quick selection, and confirmation." Side sheets, Guidelines: "Form controls shown in a side sheet for app settings". | **Matches M3.** (`material-deviations.md` B3 itself says M3 allows a basic dialog for a form at medium and expanded; the rule is stricter, not against it.) | None. |

## Skills

| Old source | Old decision | M3 | Verdict | Fix |
| :-- | :-- | :-- | :-- | :-- |
| `material-3` rule 5; `developer` §4 *A deviation from Material 3* | "A deviation is allowed only in the editor workspace **or when the owner says so in words**." | The owner's rule of 21 Nov: M3 wins outside the page and post editor's workspace "regardless of any older owner decision". | **Differs.** The "or when the owner says so" clause is what keeps every OWNER row alive. | Material-3 rule 6 (#1071) replaces it; remove the clause from both skills when it merges. |
| `CLAUDE.md` *Material 3 everywhere except the editor*; `material-3` rule 1 | The editor's "toolbar/bar, overflow menu, text and block menus" are the workspace. | The owner's 21 Nov wording narrows it to "the page and post editor's own workspace". | **Differs in scope:** the editor's other screens (Settings, Files, Consents, Redirects, the start screen) are no longer inside it. | Rewrite the sentence in `CLAUDE.md` and rule 1. |
| `developer` §4 *Save on a phone* (Save in a bottom bar, standard bottom sheet; EB1, B1) | Every `Save` is a filled labelled button in the bottom sheet. | Bottom sheets: "Content should be additional or secondary (not the app's main content)"; Save is an app-bar action or a text button in a full-screen dialog (B1's own quotes). | **Page and post editor's workspace** for the page and block forms (B1, EB1). **Differs, goes to M3** for the other screens that use the same bar (crop view, Preview, settings pages). | Decide which screens count as the workspace; the rest take M3's Save placement. |
| `developer` §4 *Pages on a phone* (B2) | Below 600 dp no view is a full-screen dialog or side sheet; each is a page. | Dialogs, Guidelines: "Full-screen dialogs are for compact breakpoints only"; Side sheets: "Modal side sheets are preferred in compact breakpoints". | **Matches M3** (a page with a back arrow is M3's list-detail on compact). The 0.20 plan to restore the full-screen kind in the theme is optional, not a fix. | None needed. |
| `site-editor-writing`, `site-editor-theme` (named in `developer` and `material-3`) | — | — | **Not found.** Neither folder exists in `.claude/skills/`; the audit could not read them. | The CTO decides whether they live elsewhere. |

## `docs/material-deviations.md`: the OWNER rows re-checked

| Entry | Old decision | M3 (page, quote) | Verdict | Fix |
| :-- | :-- | :-- | :-- | :-- |
| FL1 footer links 36 px (owner, 14 Nov) | 36 px high. | Structure: "consider making touch targets at least 48 x 48dp", "Consider making pointer targets minimums 44 x 44dp"; "targets separated by 8dp of space or more promote balanced information density". | **Differs, goes to M3.** The editor footer is not the workspace. WCAG 2.5.8 (24 px) is met either way. | Footer links 48 dp touch, 44 dp pointer. |
| P3 more than two actions in the top bar | Up to four, "until 0.20". | App bars, Guidelines: "App bars should only have one action, two if necessary."; "Up to two icon buttons can be placed after the headline". | **Differs, goes to M3 (0.20.0, already scheduled).** | None before 0.20. |
| SV6 start screen search bar 24 dp from the edges, 327 dp at 375 px | Always visible; narrower than M3's minimum. | Search, Specs: "Container Width Min: 360dp, max: 720dp" (quoted in the entry). | **Differs, goes to M3.** Not the workspace. | 16 dp margin on compact so the bar is 343 dp, still under 360: needs the owner's choice between the minimum and the margin. |
| P2 no custom context menu | Browser menu stays. | Menus: "A secondary click … should activate a context menu." | **Matches in effect** (the browser's menu is a context menu), as the entry itself says. | None. |
| CG1 / D3 choice group | Switches to a radio list; rows have no side padding inside the group (owner, 14 Nov). | Button groups "shouldn't wrap"; Lists "Leading element left padding 16dp". | **Differs, goes to M3 (0.20.0 already planned for CG1).** D3's zero padding is the same as plain-list padding (Part 1, #4, #5). | Fold D3 into batch 18's list padding. |
| DG1 theme Dialog has no full-screen kind | Removed. | Dialogs: full-screen kind for compact breakpoints. | **Differs, goes to M3 (0.20.0, already planned).** | None before 0.20. |
| N3 site menu labels only; N6 editor drawers 360 dp | Labels only; fixed width. | Rail: "All navigation items require a one word label text"; "Nav rail expanded container width minimum 220dp, maximum 360dp". | N3 **differs, goes to M3 (0.20.0, planned).** N6 **matches M3** (360 is the maximum). | None. |
| CS1 status badges (fixed colours) | No success or warning role. | M3 has no such role; its way is custom colours. | **Matches M3 in effect (M3 silent).** | None before custom colours. |
| CS2 PageSpeed, CS3 Google preview, CS4 picker, CS5 preview frame, CS9 favicons | Fixed colours. | Not themed parts. | **Imitation** (CS2, CS3); CS4, CS5, CS9 are not M3 parts. | None. |
| E1 no `role="alert"` on a field's error | Modern Web Guidance wins. | Text fields, Accessibility: "Text field error messages should be given an 'alert' role". | **Matches priority 1** (Modern web outranks M3, `developer` §4a); not a void decision. | None. |
| EB1–EB9, TB1–TB3, SEL1, BH1, the block action row | The editor's bar and its menus. | — | **Page and post editor's workspace.** | None. |
| DN2 horizontal padding does not follow density; DN3, DN4 targets | Fixed horizontal padding; row never below target. | Density page prints no horizontal rule; "Accessible targets should retain a minimum of 48x48dp". | **Matches M3.** | None. |

## Allowlists

| File | Old reason | Verdict | Fix |
| :-- | :-- | :-- | :-- |
| `scripts/m3-tokens.allow.mjs` | Empty (the baseline was cleared). | Matches M3. | None. |
| `scripts/color-roles.allow.mjs` | "to fix in the last batch": 13 mixes in `src/editor.css`, 5 in `ui/buttons.css`, 5 in `tokens/ui/comp/menu.css`, and more (about 70 findings in all). A mix of a role is not M3 unless it is a state layer or shadow. | **Differs, goes to M3 (0.19.5 batch 8, already planned).** `src/editor*.css` mixes inside the page editor's workspace may stay. | Batch 8 lowers `max`; entries for `src/editor.css` that sit in the workspace move to a workspace reason. |
| `scripts/check-css-values.allow.mjs` | Literal type sizes and corners "moved as they were" from Tailwind (`src/editor-settings.css`, `editor-rest.css`, `editor-screens.css`; the text style's `prose.css`). | **Mostly matches M3 in value** (0.875, 1, 1.5 rem and 1.25, 1.5 line heights equal M3 body-medium, body-large, headline-small; 0.5, 0.75, 1 rem equal the small, medium, large corners). **Differs:** 1.375 rem and 3 px corners are not M3 steps, and none of them are tokens. `prose.css` is "the typography plugin's own values", not M3's. | **Differs, goes to M3** for the 22 px and 3 px corners and for `prose.css`. The rest is a rename to tokens, not a visual change. | Map literals to `--mo-sys-typescale-*` and `--mo-sys-shape-corner-*`; give the text style M3's body and heading roles (the owner's visible choice). |
| `scripts/spacing-grid.allow.mjs` | M3 prints 2, 6 and 10 dp inside parts; chips' room above and below. | **Matches M3** (list tokens space125 = 10 dp, 2 dp segmented gap). | None. |
| `scripts/check-colors.allow.mjs` | The colour sweep CS1–CS11. | See the colour-sweep rows above. | None new. |
| `scripts/web-allowlist.json`, `check-density.mjs` | Modern web findings; density targets. | **Matches** (priority 1; M3 target rule). | None. |

## Code comments citing an owner decision

About 95 comments in `theme/`, `src/` and `lib/` name an owner decision. They sort into five groups; only the first two ever touched a value M3 prints:

| Group | Examples | Verdict |
| :-- | :-- | :-- |
| Settings and forms are a pane or a page, not a dialog (owner, 14–15 Nov) | `src/BlockSettings.tsx:254`, `PaneHost.tsx:2`, `LinkSheet.tsx:43`, `Media.tsx:9`, `Consents.tsx:83`, `Redirects.tsx:155`, `OwnListSheet.tsx:63`, `WidgetSettings.tsx:38`, `AppAdds.tsx:98`, `fields.tsx:965`, `NewListDialog.tsx:20`, `lib/contracts.mjs:26`, `theme/ui/Dialog.tsx:2` | **Matches M3** (a side sheet holds "Form controls … for app settings"; compact pages follow list-detail). |
| No initial focus in a dialog or sheet | `src/BlockDialog.tsx:371` | **Differs, goes to M3** (Dialogs, Accessibility, *Initial focus*). |
| The text bar and block menus (owner, 13–14 Nov, 20 Nov) | `src/MarkdownEditor.tsx:2969,3111,3130`, `contextualMenu.ts:4`, `styleMenu.mjs:2`, `styleKind.mjs:26`, `ui.tsx:231,370`, `textActions.test.mjs:71` | **Page and post editor's workspace.** |
| List and List - Expand typed in place and the List block's shape (owner, 16 Nov) | `src/InlineExpand.tsx:1`, `InlineList.tsx:1`, `standard/rows/listParts.ts:1`, `standard/list/leading.ts:1`, `lib/remark-list-head.mjs:1` | **Differs only where it feeds the list padding of Part 1** (rows 2 to 5); the rest is structure. |
| Names, icons, buttons offered, section images, page H1 (owner, 13–16 Nov) | `src/meaningIcons.ts:1`, `standard/view.tsx:110`, `SectionSettings.tsx:3`, `sections.mjs:300`, `markdown.mjs:236`, `lib/without-h1.mjs:25`, `Screen.tsx:225`, `EntryForm.tsx:104` | **Matches M3 (M3 silent)**, except `Screen.tsx:225` (search bar replaces the logo): see SV6 above. |

## Not covered

- The 80 specs and 87 plans in `docs/superpowers/` were counted for deviation words, not read line by line. The 15 with most hits are the ones batch 9 and the colour work already sorted, plus `2026-11-14-app-bars-design.md`, `2026-11-13-contextual-toolbar-row-design.md`, `2026-11-13-command-palette-and-context-menus-design.md` and `2026-11-15-m3-grid-everywhere-audit.md`; the last two have not been re-read against M3 here.
- Comp tokens in `theme/styles` with no comment naming a decision were not compared value by value against `docs/m3-tokens/`.
- The `site-editor-*` skills do not exist in the repo.

## Rows not covered by any batch

Batch 18 (plain List rows, in progress on its own branch, not yet in `feature/0.19.5-m3-tokens`) removes the plain list's 0 padding at medium and wide in `tokens/lists/comp/list.css` and `lists.css`, so the layer sits 16 dp past the text column at every width. Its test and diff name "a plain list's row" and drop the plain List - Expand open-radius rule for `width >= 37.5rem`, so **plain List - Expand at medium and wide looks covered** (finding e of Part 1). It was read from the other session's log, not from merged code: the PM confirms it on that pull request.

Not covered by batch 18 or any other batch known to this audit:

| Row | Where | M3 | Part 1 |
| :-- | :-- | :-- | :-- |
| Segmented List - Expand rows with no media keep 24 dp | `tokens/lists/comp/list.css:3-7`, `tokens/material/comp/list.css:71` | 16 dp | c |
| Questions-and-answers (List block) 20 and 32 dp | `tokens/blocks/comp/list.css:7,37` | 16 dp | c |
| Checklist `.mo-block-checklist` padding-inline 0 | `tokens/blocks/comp/list.css:51` | 16 dp | d |
| Dividers on every plain List - Expand item | `lists.css:9-16` | "Limit dividers to uncontained or complex lists" | f |
| Text button and 40 px button padding 24 dp | `tokens/material/comp/button.css:19,29`, `ui/buttons.css:218` | 16 dp (small) | b |
| Dialog actions and initial focus, `developer` §4 and `src/BlockDialog.tsx:371` | skill and code | two text buttons, initial focus on the first interactive element | a |
| Footer links 36 px, search bar width, and the "or when the owner says so" clause in `material-3` rule 5 and `developer` §4 | see Part 1 | M3 values | g |
