# 0.19.4 Screen readers (plan)

Status: **draft, 21 November 2026, for the owner's approval.** It follows the owner's rule of 19 November 2026 that the sites and the editor meet
**WCAG 2.2 level AA** and that WCAG wins where Material 3 differs (`CLAUDE.md`, *Accessibility: WCAG 2.2 AA*) (since 21 Nov 2026: where Material 3 itself falls short, M3 wins and the theme names the shortfall; only the page and post editor's bar and menus must meet WCAG). Roadmap:
`plans/2026-11-14-roadmap-0-18-to-0-24.md`, item 0.19.4: "What a screen reader says on the editor's main flows: names of icon buttons and
fields, and saves, errors and messages announced." Structure copied from `plans/2026-11-20-0-19-3-keyboard.md` and
`plans/2026-11-20-0-19-2-accessibility-scan.md` (on `feature/0.19.2-a11y-scan`, PR #1080).

**Written against branches that are not in `main` yet.** 0.19.2 and 0.19.3 are not merged. Where this plan names a file, a helper or a check of
theirs, it is as that plan or its branch has it today; *Check again when 0.19.2 and 0.19.3 are in `main`* below lists what batch 1 must re-read.

## What 0.19.4 is

A check that walks the editor's main flows and reads what a screen reader would get (the accessible name, role and state of every control,
and every message that is announced), run in CI and failing on a problem that is not on its allowlist, released together with the fixes that
make it pass. A check and the fixes that make it pass are one bite (`plans/2026-11-18-release-per-feature.md`), so 0.19.4 is one feature,
`feature/0.19.4-screen-readers`.

**The dependency (mark it, PM 0.19.4).** The feature is cut from `main` **only after 0.19.3 is released** (and so after 0.19.2). It
builds on their parts: 0.19.2 gives every control an axe-clean name and fixes the page's text area name, `aria-hidden` previews and the
inline rows' roles; 0.19.3 gives one shared helper that returns focus after something opens or closes, the menu's keyboard behaviour, the text
bar's Alt+F10 and the skip link. 0.19.4 announces and names those, it does not redo them. If PM 0.19.4 is asked to start before 0.19.3 is
released, it says so to the owner and waits.

The WCAG criteria it covers: 1.1.1 Non-text Content (icon buttons), 1.3.1 Info and Relationships, 2.4.2 Page Titled and 2.4.6 Headings and
Labels, 3.3.1 Error Identification, 3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value, and 4.1.3 Status Messages. 2.5.3 Label in Name is
0.19.2's.

Not in 0.19.4: the axe scan itself and the names it already checks (0.19.2), keyboard use and focus order (0.19.3), Material 3's tokens
(0.19.5), the small UI fixes (0.19.6), the site's own pages (0.19.2 scans them; what a screen reader says on a site's page is the theme's). No
new component, no look change: every fix is an attribute, a name or a text, so the owner sees nothing new on screen.

## The main flows

The same nine flows as 0.19.3 (A Write, B Blocks, C Format, D Page settings, E Images, F Menus, G Lists and search, H Settings, I Dashboard), so
one set of scripted walks serves both checks. 0.19.4 adds three that only a screen reader user meets:

| Flow | From → to |
| --- | --- |
| J. Save and errors | change a field → the save state is announced (saving, saved, not saved) → leave a required field wrong → the problem is announced and the field is named in it → Save changes |
| K. Messages | an action that shows a snackbar (Undo after Change type, a copied link, a removed block), a notice and a failed load |
| L. Open and close | open and close a page, a side sheet, a bottom sheet, a dialog, a menu and the page preview, and select a block: what is said on arrival, and where focus is |

## What a screen reader says today (the inventory)

**Batch 1 makes the real inventory.** This plan is written without a run of the walk, so the table is what the source shows, not a
baseline; the first batch measures it (Chromium's accessibility tree, `Accessibility.getFullAXTree` over CDP, on the 306 screens and the
flows) and the allowlist holds what it finds. The source today:

| Area | What the source shows | To confirm in batch 1 |
| --- | --- | --- |
| Icon buttons | `IconButton` takes a `label` (its name); 43 `aria-label` in `src/ui.tsx` | icons are Material Symbols drawn as ligature text: a name or a visible glyph that reads `arrow_back` or `more_vert` instead of the label, an icon-only link with no name, ten rows each with a plain "Edit" or "Remove" |
| Fields | `TextField` sets `aria-invalid` and `aria-describedby` for its error (`theme/ui/TextField.tsx`); `FormField` gives the field's `id` to its supporting text | a field whose label is not tied to it, a hint and a limit counter read twice, a required field not marked |
| Tabs | `Tabs` is a `role="tablist"` with `role="tab"`, `aria-selected` and `controls` | the selected tab's panel named by the tab; a tab row that is links (the editor's screens) and says "selected" or "current" |
| Menus, dialogs, sheets | the dialog has `aria-labelledby` the headline; the standard side sheet has `aria-labelledby`; the bottom sheet has a label or headline and its handle has `aria-expanded` | the name of every dialog (`ask()`), every menu button's `aria-haspopup` and `aria-expanded`, the modal's background left readable (not `inert`) while a sheet is open |
| Messages | the theme's `Snackbar` is `role="status"` (`role="alert"` for an error); `Notice role="alert"` on the Media and dashboard problems; `role="status"` on the updates notice | a snackbar drawn after the page loads is announced only if its live region exists first: a region that is inserted with its text is often not read. The editor's snackbar (`lib/snackbar.ts`, `undoSnackbar` in `src/MarkdownEditor.tsx`) renders into a new element each time |
| Save | the autosave has three states (`saving`, `saved`, `notSaved`: `src/useAutosave.ts`); the dashboard has a hidden live region (`src/DashboardEdit.tsx`) | where the state is shown and whether it is announced; `Save changes` busy state is `aria-busy` + `disabled` (`src/ui.tsx`, `theme/ui/Button.tsx`), and a disabled button drops focus and says nothing |
| Live regions | 9 in `src/` (block selection count, selection bar, preview width, media text, icon picker, dashboard), 3 in `theme/ui` (search count, date picker headline, lightbox count) | two regions for one event (a snackbar and a status line), a region that announces on every keystroke (the preview width), one that is `aria-live` and `role="status"` on the same node |
| Page and route | one `<title>` for the whole editor (`pages/editor/index.astro`: the site's name) | a screen change in the one-page editor announces nothing and the title does not change (2.4.2) |
| Block cards and the text | the text area's name is 0.19.2's; the block cards' names are 0.19.2's (2.5.3) | what is said when a block is selected, moved, removed; the text bar's Alt+F10 is not announced |

## Live regions

One rule so nothing is said twice: **there is one announcer, and a message goes through it or through an element's own `role`, never both.**

- **The announcer** (`lib/announce.ts`, used by the editor only): two persistent visually hidden regions, polite (`role="status"`) and
  assertive (`role="alert"`), created once at start, in the editor's root and outside any sheet or dialog that can unmount; `announce(text, {
  urgent })` clears the region, then sets the text in the next frame (so the same text twice is read twice), and removes it after a few seconds.
  A message with a visible element (a snackbar, a notice) is announced by that element when it is **already in the DOM when its text is
  set** or, where the editor draws it into a new node, by the announcer, and the new node is `aria-hidden` for the announcement's sake only if
  it is a copy. Which of the two applies is decided per message in batch 4 and written in the check's table.
- **Saves.** `Save changes` and autosave announce `Saving`, `Saved` and `Not saved` politely, once per change of state and never on each
  keystroke (autosave's state is debounced; `READ_MS` is 400 ms); a failed save is assertive and names the reason the way the visible text
  does. The busy `Save changes` button keeps its name and is announced as busy, not as dimmed.
- **Errors.** A field's problem is in its `aria-describedby` (the theme does it) and is announced when it appears (`aria-live` on the
  supporting text, or the announcer), not on every re-render. A form with several problems announces how many (`3 problems`) and moves focus
  to the first invalid field on `Save changes` (3.3.1); a page-level `Notice` keeps `role="alert"`.
- **Snackbars and notices.** Every one reaches the announcer exactly once (above). Urgency follows the theme: `error` is assertive, the rest polite.
  Undo is a button in the snackbar and keeps its place in the tab order for the time the snackbar stays; a snackbar that stays a few seconds is
  long enough for a screen reader to read it (the theme's `data-ms` is checked against the text's length: about 20 characters a second plus a second).
- **Loading and progress.** A long load (the dashboard, the library, an upload) announces `Loading` once (`role="status"`, `aria-busy`) and
  `Loaded` or the error when it ends; a determinate progress indicator has `role="progressbar"` with `aria-valuenow`, and announces at every
  25 %, not on each percent. `aria-busy` alone is never the announcement (screen readers differ).
- **Existing regions.** Each of the nine in `src/` and three in `theme/ui` is looked at once and kept, merged into the announcer, or made
  silent (the preview width: it is said when the width **changes by the person's action**, not while the preview resizes).

## Focus and what is said on open and close

0.19.3's shared helper puts focus back; 0.19.4 adds what is said. The pattern for each, written once and tested by flow L:

- **Dialog.** Opens with the headline as its name (`aria-labelledby`) and the supporting text as its description (`aria-describedby`); the
  owner's rule (no control focused when it opens; `src/ask.tsx`) stays, and so a screen reader reads the name and the description on arrival
  because the dialog is the modal. On close, focus returns (0.19.3) and nothing else is announced unless the action has a result (then the announcer says it).
- **Side sheet and page below 600 dp.** The sheet has a name; opening it moves focus to its heading (`tabindex="-1"`, which is what a reader
  announces), and closing returns focus. A page that replaces a screen on a phone changes `document.title` to its heading and announces it politely (2.4.2).
- **Bottom sheet.** The same name and heading; its handle says expanded or collapsed; it traps no focus and is not `aria-modal` unless it is.
- **Menu.** The button has `aria-haspopup="menu"` and `aria-expanded`; the menu has a name from the button; on a phone, where it is a bottom
  sheet, the same.
- **Screen change in the editor.** Every route change (Pages → a page, Settings → SEO) sets the title to `<screen> – <site>` and announces the
  screen's heading once; focus goes to the heading, or to the page's title field when the screen is a page (the same place 0.19.3 chose).
- **Block selection and the page preview.** Selecting a block announces its type and place (`Image, block 3 of 7, selected`), moving it announces
  the new place, removing it announces the removal and where focus went. The count that exists now (`blocksSelected`) is reused. The page preview is
  an image of the site: it is `aria-hidden` and `inert` (0.19.2 and 0.19.3 do the first and second for the header and footer preview); a change that
  the person makes shows as `Preview updated` only when they ask for the preview, never on each keystroke.
- **Text bar.** Alt+F10 (0.19.3) is announced when the text gets focus the first time per page, as the text area's description (`Alt+F10 moves to
  the formatting tools`), and the toolbar is `role="toolbar"` with the group's label and `aria-pressed` on Bold, Italic and the list buttons.

## The check

- `npm run check:announce` (`scripts/check-announce.mjs`), Playwright on the built demo with `openEditor` and `serveBuilt`
  (`scripts/built-site.mjs`), no new dependency. It builds on `scripts/a11y.mjs` (0.19.2: the scan, the allowlist code) and the flows of
  `scripts/keyboard-flows.mjs` (0.19.3), so a flow is written once.
- **The name walk:** on every screen `check:screens` opens, at 1280 and 375 px, inside the existing `screens` shards like `check:a11y` and
  `check:keyboard` (not a new job), it reads Chromium's accessibility tree and fails on what axe cannot tell:
  - an interactive node (button, link, tab, menu item, switch, checkbox, field) whose **name is an icon's ligature text** (the names of
    `src/data/icons.json` and Material Symbols), is only punctuation, equals its role, or is a file name or an id;
  - **a name repeated** by two controls of the same role in one list with no other difference (ten `Remove`); the row's name must reach the control (`Remove Contact`);
  - a **dialog, sheet, menu, tab panel or landmark with no name**; a tab with no `aria-selected` (or a link tab with no `aria-current`); a menu button with no `aria-expanded`;
  - a control **disabled with no reason** where a hint says why is expected (`Save changes` while the page has a problem: the problem is reachable);
  - a required or invalid field not marked, and an error that is not tied to its field (`aria-describedby` pointing nowhere);
  - **live-region mistakes**: `aria-live` or `role=status` on a node that also unmounts with its text, two live regions in the same ancestor chain, `aria-live="assertive"` for a non-error, a region inside `aria-hidden` or `inert`.
- **The flows:** J, K and L above as scripted walks (`scripts/announce-flows.mjs`), and A, B, C, F and I of 0.19.3 reused, at 1280 px, and
  A, B, F, J at 375 px. Each flow starts a recorder in the page: a `MutationObserver` on every live region and on `document.title`, and the
  accessibility tree at each step (focus, name, role, state). A step fails when:
  - the action that should be announced produces **no** live-region text (or none from a region that existed before the action), within 1 s;
  - **the same text is announced twice** within 1 s (two regions, or a region set twice);
  - a **polite** message is sent where the flow says it is urgent, or the reverse;
  - focus is on `body`, or on a node with no name, after the step (0.19.3's rule, with a name added).
- **The speech log.** Each run writes `announce-log.txt`: the flows' steps as lines of what a reader would say (`Heading level 1, Pages`,
  `Edit page, button`, `Saved, status`), and CI keeps it as a build artifact. It is for people (the owner and PM 0.19.4 read it without a
  screen reader) and is not compared; the check does not depend on it.
- **Allowlist** `scripts/announce-allowlist.json`, entries of problem, place (screen or flow step and selector) and reason, like
  `scripts/a11y-allowlist.json` and `scripts/keyboard-allowlist.json`. It fails on a problem not on it and on an entry that no longer
  matches, so it only shrinks. **At release it is empty**, unless the owner has approved an entry in words.
- **Not automated, and said so.** A script cannot know that a message is said clearly or in a good order, or that NVDA and TalkBack read
  the same markup alike. The check proves the markup and the live regions; the real reader pass below proves the rest. Neither stands in for the other.
- `.claude/skills/checks/SKILL.md` says when to run it (a change to a name, a label, a message, a snackbar, a notice, a dialog, a sheet, a menu or a live region).

## Batches (pull requests into `feature/0.19.4-screen-readers`)

1. **The version and the check.** Sets the version to 0.19.4 in `package.json`, `package-lock.json` and by `node scripts/starter.mjs`
   (`plans/2026-11-19-version-at-feature-start.md`; CI's `static` fails without it), adds `check:announce`, its flows J to L, the recorder, its CI steps
   and the allowlist holding exactly the baseline it finds (the real inventory; it may differ from the source reading above and after 0.19.2 and 0.19.3). Writes the
   inventory into this plan's *Inventory* section as a table of counts. CI green. Each later batch removes its entries.
2. **Names.** Icon buttons and icon links, fields, rows' actions, tabs, landmarks, dialogs, sheets and menus get names a person can use
   (`Remove Contact`, not `Remove` or `delete`); the ligature-text cases; the editor's one `<title>` gets a per-screen title function (`src/…`, one place).
   Component fixes only through the theme's parts (`theme/ui`, `src/ui.tsx`) and only where the fix is an attribute, never a new component.
3. **Roles and states.** `aria-expanded`, `aria-haspopup`, `aria-pressed`, `aria-selected`, `aria-current`, `aria-busy`, `aria-required`, `aria-invalid` and
   `aria-describedby` where they are missing or wrong, in the shared parts (the menu, the tabs, the switch, the toolbar, the text bar's buttons, the
   choice groups). A disabled control that needs a reason points to it.
4. **The announcer and the live regions.** `lib/announce.ts`, the one-announcer rule; the nine regions of `src/` and three of `theme/ui`
   looked at and kept, merged or silenced; saves (autosave and `Save changes`), errors and the error count, snackbars and notices, loading and progress. The
   table in the check says for each message which element announces it. Unit tests for the announcer (same text twice, urgency, removal).
5. **Open, close and change.** What is said on arrival and where focus is, for dialogs, side sheets, bottom sheets, menus, pages below 600 dp, and a route
   change (title and heading); built on 0.19.3's shared focus helper (so it follows 0.19.3 and this batch finds it in `main`). Flow L.
6. **Blocks, the text and the preview.** Block selection, move and remove announced; the text bar's `role="toolbar"`, its `aria-pressed` buttons and the
   Alt+F10 hint; the page preview silent and `inert`, `Preview updated` only on request. Flows B and C with announcements.
7. **The reader pass and the notes.** `docs/screen-reader-test.md`: the owner's steps and what each should say, for staging (below); the release note line (skill
   `release-notes`: *Screen readers* is noticed by a site owner who uses one; English and Danish); the skill `checks` entry. After this batch the allowlist must be empty.

Order: **1 goes first** (the check and the baseline). **2, 3 and 4 touch different files and can run side by side** (names, states, the
announcer). **5 follows 4** (it uses the announcer) **and 0.19.3** (its focus helper). **6 follows 5** (it touches the text area and the block cards, which 5 also touches).
**7 goes last** (it needs the walk's final output and an empty allowlist). Every batch removes the allowlist entries it fixes, keeps
`check:screens`, `check:a11y` and `check:keyboard` green, adds no text without its Danish version (`check:language`: a new
announcement is a new text, in `en-US` and `da-DK`, skill `site-editor-writing`), follows Modern Web Guidance for accessibility (the PR names the guides read:
`npm run audit:web -- search "aria live"`, `"accessible name"`, `"focus dialog"`) and the order of priority (Modern web, Material 3 Expressive, Material 3,
Material 2 with Material 3 styling; a self-made solution goes to the PM). Each pull request has its **Components** line (existing components only) and an empty or `patch` changeset.

## What the owner can see and test

Nothing changes on screen, so there is **no screenshot** in any batch. The owner cannot sign in on a Preview, and a screen reader is something to hear, so:

- **On the demo or a Preview:** nothing to review but the `announce-log.txt` the PM attaches to its report, and the check running green. The PM sends
  no Preview link for this feature (`CLAUDE.md`: no Preview link for an editor change the owner cannot sign in on).
- **On staging, after the feature is merged into `main` and `morpheme-staging` has built the `next` version**, with real sign-in and saving, in two
  passes the owner can do with what is free on the machines they own:
  1. **Windows, NVDA** (free, nvaccess.org) or the built-in **Narrator** (Windows+Ctrl+Enter), in Firefox or Chrome: the steps of
     `docs/screen-reader-test.md` — sign in, open a page, change the title and listen for `Saved`, leave a required field empty and press Save, open the
     page menu and a dialog, select and remove a block, switch tabs in Settings. Each step says what to hear; "I heard nothing" or "I heard it twice" is the report.
  2. **Android, TalkBack** (built in; Settings › Accessibility): the same steps on a phone, where the bottom sheets and pages below 600 dp are used.
     VoiceOver on an iPhone is the third, when one is at hand; it is not required for the release.
  If neither pass is possible, PM 0.19.4 says so and the owner decides whether the release waits; the check alone is not a reader pass. A pass is 15 to
  20 minutes. The owner's findings go to PM 0.19.4 as `step, what I heard`, and a fix is a batch on `feature/0.19.4-screen-readers` before the merge.
- **Release:** as every feature, 0.19.4 must have run on staging before the owner is asked (`CLAUDE.md`, *Only the owner releases*).

## The version rule

The feature's **first pull request (batch 1) sets `version` to `0.19.4`** in `package.json` and `package-lock.json` and runs `node scripts/starter.mjs`,
so `starter/package.json` pins it (CI's `static` runs `node scripts/starter.mjs --check`). No other pull request of the feature changes it. This
docs-only pull request (the plan) goes into `main` with an **empty changeset** and no `version` change, because it is a plan, not the feature's first pull request.

## Check again when 0.19.2 and 0.19.3 are in `main`

Batch 1 reads these before it writes the check, and corrects this plan in its own pull request where the real code differs:

- **From 0.19.2** (`feature/0.19.2-a11y-scan`): `scripts/a11y.mjs` (the scan, `readAllowlist`, `compare`, `keysOf`) and `scripts/a11y-allowlist.json` (the entry
  shape this check copies); the names it fixed (the text area, block cards, `InlineNotice`, the select field, "Show subpages", the `group` role on inline rows,
  the cookie table's header), so the name walk does not list them again; `aria-hidden` previews now `inert`; the menu divider's role; the empty search
  result list; zoom (`visualViewport`) and any live region it adds.
- **From 0.19.3** (`plans/2026-11-20-0-19-3-keyboard.md`): `scripts/check-keyboard.mjs`, `scripts/keyboard-flows.mjs` (flows A to I, reused here) and its
  allowlist; the **shared focus helper** (its name and place; batch 5 uses it); the editor `Menu`'s new keyboard behaviour (`aria-expanded`, focus into the
  menu); the Alt+F10 shortcut, its toolbar pattern and the skip link's text (both announced and named here); the new texts in `en-US` and `da-DK`.
- **From `main`:** the number of `aria-live` and `role=status`/`alert` nodes (12 on 21 November), the list of `src/`'s screens, and the roadmap's wording of 0.19.4.
- **The nine flows' names** (A to I): 0.19.3 may rename or merge them; J, K and L follow what it has.

## Done when

`check:announce` runs in CI on every pull request with its flows, its allowlist is empty (or holds only entries the owner approved), the owner has
done a reader pass on staging with NVDA or Narrator and on a phone with TalkBack (or has decided in words that the check alone is enough), and 0.19.4 has run on
staging before the owner releases it.
