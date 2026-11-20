# 0.19.2 The accessibility scan and its fixes (plan)

Status: **approved, 20 November 2026.** The owner decided on zoom in the editor (below); the rest follows the
owner's rule of 19 November 2026 that the sites and the editor meet **WCAG 2.2 level AA** and that WCAG wins where Material 3 differs
(`CLAUDE.md`, *Accessibility: WCAG 2.2 AA*). Roadmap: `plans/2026-11-14-roadmap-0-18-to-0-24.md`, item 0.19.2.

## What 0.19.2 is

An automated WCAG 2.2 AA scan (axe-core) of every editor screen and every page of the demo, run in CI and failing on a violation
that is not on its allowlist, released together with the fixes that make it pass. A check and the fixes that make it pass are one
bite (`plans/2026-11-18-release-per-feature.md`, *A release is one bite*), so 0.19.2 is one feature, `feature/0.19.2-a11y-scan` (cut from
`main` by PM 0.19.2); it takes in `main` again once 0.19.1 is released.

Not in 0.19.2: keyboard use and focus (0.19.3), what a screen reader says on the main flows (0.19.4), the small UI fixes (0.19.5).

## The audit it starts from

The CTO ran the scan once on `main` at 511105c3 (20 November 2026; axe-core 4.14.1, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`,
`wcag22aa`; nothing committed). It is the baseline this plan fixes.

- **Site:** all 37 built pages of the demo (`/blocks/` and its pages, `404.html`), at 1280 and 375 px, light and dark: 148 scans in
  73 s. **3 rules.**
- **Editor:** 306 screens (the editor's own `#` links, two steps from the `check:screens` start screens, as
  `scripts/styles-snapshot.mjs` finds them), at 1280 and 375 px, light: 612 scans in 393 s. **11 rules.**
- Not covered: dialogs, sheets and menus that open only on a click (except those the `#developer/parts/*` gallery shows open), the
  editor in dark mode (dark contrast is `check:contrast`'s), the site's closed menus and cookie banner.

Site violations:

| Rule | Nodes | Where | Cause |
| --- | --- | --- | --- |
| `label` (critical) | 30 per run, 8 pages | Markdown check lists (`- [x]`) | the disabled checkbox remark-gfm writes has no name (`lib/markdown.ts`, `lib/remark-checklist.mjs`) |
| `link-name` (serious) | 6 per run, `/blocks/image-grid/` | Image grid card whose image has no alt text | the link holds only `<img alt="">` (`theme/blocks/imagegrid/View.tsx`); also in the editor |
| `color-contrast` (serious) | 2, dark only | `kbd` in prose | `--mo-comp-prose-kbd` is a fixed near-black with no dark value (`theme/styles/tokens/base/comp/prose.css`) |

Editor violations:

| Rule | Nodes | Screens | Cause |
| --- | --- | --- | --- |
| `meta-viewport` (moderate) | all | 306 | `maximum-scale=1` turns pinch zoom off (`pages/editor/index.astro`); see the decision below |
| `nested-interactive` (serious) | 114 | 6 | fields inside the expanding `summary` of inline lists (`theme/ui/List.tsx`, `src/InlineItems.tsx`); the media button inside an inline card (`src/InlineCards.tsx`) |
| `label-content-name-mismatch` (serious) | 102 | 9 | a name that does not contain the visible text: block cards (`src/MarkdownEditor.tsx`, `src/blockRow.ts`), `src/InlineNotice.tsx`, the select field (`theme/ui/ExposedDropdownMenu.tsx`), "Show subpages" (`src/Library.tsx`) |
| `target-size` (serious) | 89 | 8 | the inline list's textarea is 20 px high (`.mo-editor-inline-list-field`, `src/editor.css`); 2 overlaps in the parts gallery |
| `aria-input-field-name` (serious) | 76 | 37 | the page's text area (Milkdown `.ProseMirror[role=textbox]`) has no name (`src/MarkdownEditor.tsx`) |
| `scrollable-region-focusable` (serious) | 25 | 5 | the carousel's scroller and the bottom sheet's content can't be reached by keyboard (`theme/ui/Carousel.tsx`, `theme/ui/BottomSheet.tsx`) |
| `link-name` (serious) | 12 | 1 | the Image grid, as on the site |
| `list` (serious) | 4 | 1 | the menu divider is always `role="none"`, even outside a menu (`theme/ui/Menu.tsx`) |
| `aria-hidden-focus` (serious) | 4 | 2 | a block preview is `aria-hidden` but holds focusable content (the Cookie list; `src/MarkdownEditor.tsx`) |
| `aria-required-children` (critical) | 2 | 1 | an empty search result list keeps `role="listbox"` (`theme/ui/Search.tsx`) |
| `color-contrast` (serious) | 2 | 1 | the time picker's number under the selected hand, 2.65:1 (`theme/ui/TimePickerContainer.tsx`, `theme/styles/ui/pickers.css`) |

Axe's manual-review results that the fixes also settle: `aria-label` on plain `div`/`span` inline rows (220 nodes, `aria-prohibited-attr`;
the rows get a role), the empty `th` of the cookie table, and the parts gallery's double labels. Best-practice results (landmarks,
heading order) are not WCAG failures and are not in 0.19.2.

Almost all of it comes from a few shared parts, so most fixes are made once.

## Zoom in the editor (owner, 20 November 2026: "yes, turn zoom back on")

The editor turns pinch and double-tap zoom off on purpose (`maximum-scale=1` and `touch-action` in `src/editor.css`), because zooming
in Chrome on Android pushed the bar with *Save changes* below the screen. WCAG 2.2 AA (1.4.4 Resize Text) requires that a page can be
zoomed, and the owner's rule is that WCAG wins.

**Decided:** zoom is turned back on. The batch keeps the top bar and the text toolbar in view while zoomed by placing them against the
visual viewport (`window.visualViewport`) instead of the layout viewport. The PWA keeps `interactive-widget=resizes-content` and
`viewport-fit=cover`. The batch that does it tests on a phone-sized Chromium with zoom, and the owner checks it on the Preview on a
real Android phone before the feature merges. If that can't keep the bar in view, the session stops and reports; zoom is not turned
off again without the owner.

## The check

- `npm run check:a11y` (`scripts/check-a11y.mjs`): axe-core (a dev dependency, pinned) with the five tags above, injected with
  Playwright (`bypassCSP: true`: the site's CSP blocks the injection otherwise).
- **Site:** every built page of the demo, 1280 and 375 px, light and dark; in the CI job that already has the demo build (`demo`), about
  40 s.
- **Editor:** every screen `check:screens` opens, 1280 and 375 px, light, inside the existing `screens` shards (the screen is already
  open there, so the scan adds about 1 s per screen and width, spread over the 8 shards), not as a new job.
- **Allowlist** `scripts/a11y-allowlist.json`, entries of rule, place (page or screen and selector) and reason, like
  `scripts/phosphor-allowlist.json`. The check fails on a violation not on it and on an entry that no longer matches (so it only
  shrinks). At release it is empty, unless the owner has approved an entry.
- `.claude/skills/checks/SKILL.md` says when to run it.

## Batches (pull requests into `feature/0.19.2-a11y-scan`)

1. **The version and the check.** Sets the version to 0.19.2 (`plans/2026-11-19-version-at-feature-start.md`), adds `check:a11y`, its
   CI steps and the allowlist holding exactly the baseline above. CI green. Each later batch removes its entries.
2. **The site.** Check-list checkboxes get the item's text as their name; the Image grid card's link gets a name when the image has
   no alt text (its caption or title, else the page's text for "image"); `--mo-comp-prose-kbd` gets a dark value from the theme's
   roles (`check:contrast` both modes); the demo's six images without alt text get one; the cookie table's empty header gets a name.
3. **The page's text area and previews.** The Milkdown text area gets a name; a block preview that is `aria-hidden` becomes `inert`
   so nothing inside it takes focus.
4. **Inline lists and cards.** No field inside a `summary`: the row's expand control and its fields become siblings
   (`theme/ui/List.tsx`, `src/InlineItems.tsx`); the card's media button moves out of the card's own control (`src/InlineCards.tsx`);
   rows named with `aria-label` get a role that allows it (`group`); the inline list field is at least 24 px high (2.5.8).
5. **Names that match what is shown.** Block cards, inline notices, the select field, "Show subpages": the accessible name starts
   with the visible text (2.5.3).
6. **Theme UI parts.** Carousel scroller and bottom sheet content are focusable regions with a name; the menu divider gets its role
   only inside a menu; an empty search result list drops `listbox`; the time picker's selected number meets 4.5:1 (from the theme's
   on-colour role). Load the skill `material-3` and record any deviation.
7. **Zoom**, as decided above: `maximum-scale=1` and the `touch-action` rules that block zoom go; the bars follow the visual viewport.

Batches 2 to 6 touch different files and can run side by side; 1 goes first and 7 last. Every batch: the allowlist entries it fixes
are removed, `check:screens` and `check:contrast` stay green, no new text without its Danish version (`check:language`), and a release
note line where a site owner notices it (skill `release-notes`).

## Done when

`check:a11y` runs in CI on every pull request, its allowlist is empty (or holds only entries the owner approved), the owner has
reviewed the feature on its demo Preview (with zoom on a phone), and 0.19.2 has run on staging before the owner releases it.
