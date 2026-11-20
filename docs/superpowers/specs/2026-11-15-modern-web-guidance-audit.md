# Modern Web Guidance audit (15 Nov 2026)

Owner request: "Install it and run an audit on our code." This is an audit. No source, style, test or script of the
product was changed. Skills loaded for this work: `developer`, `material-3`, `changesets`, `checks`. No M3 page was read
for a build, because nothing is built; M3 is quoted only through the repository's own rules.

Status of every conflict below: **decision: owner**. A build session that meets one stops and sends it to the PM
(`developer` skill, section 4a). Nothing is changed against an M3 rule or a theme component without the owner's yes.

## 1. What was run

Source: `GoogleChrome/modern-web-guidance-src` (Apache-2.0). Its `AGENTS.md`, `README.md` and the skill
`guides/modern-web-guidance/SKILL.md` were read first. The README's quickstart is `npx modern-web-guidance@latest …`
(the interactive `install` wizard writes skills into an agent's config and was not run). The package on npm is
`modern-web-guidance@1.0.0`, one package with no dependencies in the lockfile, bin `modern-web-guidance`.

Commands (run from the repository root, `NPM_CONFIG_CACHE=/tmp/npm-cache`):

- `npx -y modern-web-guidance@latest legacy-scan <folder> --json` for `src`, `theme`, `lib`, `pages`, `worker`,
  `starter`, `demo`; and `legacy-scan demo --json --include-docs-and-tests`.
- `npx -y modern-web-guidance@latest list`, then `retrieve` for `dialog`, `dark-mode`, `dark-mode-toggle`,
  `ime-safe-enter-submit`, `css-layout`, `responsive-design`, `forms`, `accessibility`, `performance`, `css`.
- Manual checks: `grep` counts and reads of the places named below, against the guides' DO / DON'T lines.

Afterwards the tool was added as a devDependency (owner decision, via the PM): `modern-web-guidance` `1.0.0`
(exact), script `npm run audit:web -- <command>`. It is not in `dependencies`, `peerDependencies` or `files`, and not in
`npm run check` or CI. `npm pack --dry-run` lists the same 2401 files before and after; the only difference is the two added lines in the packed `package.json` (+76 bytes unpacked).

Limits: `legacy-scan` runs 35 rules from 33 guides, "~20% of the guidance corpus" (its own note). Its rubrics say to
drop false positives, so each hit was read in the code. The manual checks are counts and spot reads, not a full review.

## 2. legacy-scan result

| Folder | Findings |
| :--- | :--- |
| `src` | 2 |
| `theme` | 5 |
| `pages` | 1 |
| `lib`, `worker`, `starter`, `demo` | 0 (also 0 with `--include-docs-and-tests` for `demo`) |

All 8 were read; none is a false positive, and all 8 are low or medium. Each is also listed in section 3.

## 3. Findings by area

Size: S = one file, a few lines; M = a few files or a behaviour to test; L = a component's design or many files.

### 3.1 Dialogs and overlays

| # | Where | Finding | Guide says | Severity | Size |
| :--- | :--- | :--- | :--- | :--- | :--- |
| D1 | `theme/ui/dialogControl.ts:42`, `theme/ui/bottomSheetControl.ts:135`, `theme/ui/search.script.ts:77`, `theme/components/Popup.astro:71` (scan) | Four hand-written "click on the backdrop closes it" listeners. | `dialog`: "Also click outside to close: use `closedby="any"`." | Low | M |
| D2 | `theme/components/MobileMenu.tsx:148-149` | The navigation drawer is a `motion.div` with `role="dialog"` and `aria-modal="true"`. | `dialog`: native `<dialog>`; "DON'T add `role="dialog"`, `aria-modal`, a focus trap, `inert` toggling or an `Esc` handler." | Medium | M |
| D3 | `theme/ui/tooltip.script.ts:20-26`, `theme/ui/dropdownMenu.script.ts:31`, `src/ui.tsx:397,2107-2118`, `src/contextualMenu.ts:177` | Menus, tooltips and pickers are placed by script (`getBoundingClientRect`, scroll listeners). The menus already use `popover`. | `css-layout` §5: anchor positioning (`anchor-name`, `position-area`, `anchor-size()`), "Feature-detect with `@supports (anchor-name: --x)` and provide an absolute-position fallback." | Medium | L |
| D4 | `theme/styles/ui.css:2021,2025`, `src/editor.css:107`, `src/ask.tsx:90` | `80vh`, `90vh`, `50vh` on sheets, the text field and the dialog body. | `responsive-design`: "Use dynamic viewport units (`dvh`, `dvw`) instead of `vh`/`vw`" on mobile. | Low | S |

Not findings: the site and editor already use `showModal()` (`theme/components/Popup.astro:83`) and `popover`;
`theme/ui/Menu.tsx:17` opens menus as popovers. The 100vw uses in `theme/styles/blocks.css:189-195` and
`src/editor.css:720-742` are deliberate and commented (the scrollbar is part of the measure); leave them.

**Conflict C1 (D1, D2): decision: owner.** Our dialogs close with an animation: `dialogControl.ts` and
`bottomSheetControl.ts` catch `cancel` and call their own `close()` ("Escape: animate out instead of the dialog's instant
close"). `closedby="any"` closes without that animation unless the same `cancel` hook also covers light dismiss, which
needs a test in a real browser before anyone relies on it. Recommended: D1 yes for the dialogs where the hook proves to
cover it, keeping M3's motion; M3 and the guide agree on the look, only the mechanism changes. We lose nothing in spec or
spacing; we gain four fewer listeners and the browser's own back-gesture dismissal. D2 (a native `<dialog>` drawer) is
worth doing only together with the drawer's exit animation, so it is a theme-component change and needs the owner's yes
before a session touches `NavigationDrawer`; a form of both is likely (native `<dialog>`, the same M3 drawer CSS).

**Conflict C2 (D3): decision: owner.** M3 prints the menu and tooltip look, not how they are placed, so anchor positioning
keeps M3's look. The cost is size L (every menu, tooltip, picker) and a fallback for browsers without it. Recommended:
adopt it for new overlays first, and move the existing ones one component at a time, each through the owner.

### 3.2 Colour scheme and dark mode

| # | Where | Finding | Guide says | Severity | Size |
| :--- | :--- | :--- | :--- | :--- | :--- |
| S1 | `src/editor.css:79` (scan) | `@media (prefers-color-scheme: dark)` overrides the Google-preview colours, with `data-theme` overrides beside it. | `dark-mode`: `color-scheme: light dark` and `light-dark()`. | Low | S |
| S2 | `theme/styles/base.css:137-167` | `color-scheme` is `light` by default and `dark` by media query or `data-theme`, inside `@layer fallback`. | `dark-mode-toggle`: "**DO NOT** hardcode `color-scheme: light` or `color-scheme: dark` as the root default; the base declaration MUST stay `light dark`." | Medium | S |
| S3 | `theme/layouts/Base.astro:233`, `pages/editor/index.astro:67` (scan) | A theme toggle stores `theme` in `localStorage` and sets `dataset.theme`; no `<meta name="color-scheme">` is kept in step. `theme-color` metas exist (`Base.astro:144-145`). | `dark-mode-toggle`: keep `<meta name="color-scheme">` in step with the stored choice. | Low | S |
| S4 | `theme/layouts/Base.astro` (header toggle) | A site-wide toggle is on the site. | `dark-mode-toggle`: most sites "do not need a persistent color scheme toggle in the site UI"; follow the system and put an override in a settings surface. | Low | S |

The editor's toggle is on its Account settings, which is where the guide puts it. `lib/colors.ts:108` writes the dark
palette as `@media (prefers-color-scheme: dark){:root:not([data-theme='light']){…}}`.

**Conflict C3 (S1, S2): decision: owner.** The guide wants `light-dark()` colour tokens. M3's token tiers (`md.ref`,
`md.sys`, `md.comp`) and the generated palettes in `lib/colors.ts` give each role a light and a dark value; moving every
role into `light-dark()` rewrites the token layer (size L) for no change in look. Recommended: keep the tokens, and take
only the cheap mechanism changes: base `color-scheme: light dark` (C2), the `<meta name="color-scheme">` kept in step
(S3). We lose nothing against M3; we gain native form controls, scrollbars and the browser's own default colours matching
the chosen scheme. S4: the toggle is a feature a site owner turns on; leave it unless the owner wants it moved.

*Spike result (15 Nov 2026), decision: not now.* S1 is done (the Google-preview colours use `light-dark()`). For the token layer,
`colorsCss` emitting `--mo-x:light-dark(L,D)` for all 45 roles gives the same look (computed colours equal on 28,272 elements,
light and dark, with and without `data-theme`; `check:screens` green) and saves about 1.8 KB per page. Three breaks: (a)
`scripts/page-colors.mjs` reads `--mo-x:#hex` from the CSS, so `page-colors.json` would hold no roles (Colors › Pages empties)
and no test notices; (b) code that reads `--mo-*` with `getComputedStyle` (`src/Tokens.tsx`) gets the text `light-dark(…)`,
not a colour; (c) there is no fallback: Chrome below 123, Safari below 17.5 and Firefox below 120 would lose every colour
role on the public site, and the guide's mandatory `prefers-color-scheme` fallback would bring the size back. It needs the
owner's browser floor first; then it is a small PR (`colorsCss`, `page-colors.mjs`, `Tokens.tsx`, a test that pins the CSS shape).

### 3.3 Forms and input

| # | Where | Finding | Guide says | Severity | Size |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F1 | `src/ui.tsx:1666` (scan) | Chip field: `Enter` finishes the word without `isComposing` check. | `ime-safe-enter-submit`: check `event.isComposing` (the check applies to any custom `Enter` handler). | Medium | S |
| F2 | `src/LinkSheet.tsx:119`, `src/OwnListSheet.tsx:138,221`, `theme/ui/search.script.ts:88` | The same pattern, not found by the scan: `Enter` runs an action with no composing check. (`src/Inline*.tsx` and `theme/ui/Search.tsx:285-290` already check it.) | Same. | Medium | S |

The language of the editor is not only Danish and English, so an IME user typing in a field can lose text. Nine places
already check `isComposing`; these five do not.

Checked and fine: `autocomplete` is set in 18 places, `inputMode` in 11, `field-sizing` in 8; `:user-invalid` is not used
(0 places), so error styling after interaction is a gap against `validate-input-after-interaction`, size M, low.

### 3.4 Accessibility

| # | Where | Finding | Guide says | Severity | Size |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A1 | `theme/styles/ui.css:934,1899,2699,3842,5424,5595,6902,6978`, `src/editor.css:108,1142,1166,1329,2086` | `outline: none` in 13 places. | `accessibility`: "**Mandatory** - Don't disable browser native focus indicators without providing a replacement custom focus indicator." | Low (read: each has its own indicator, e.g. the M3 text field's, the drag handle's darker bar at `ui.css:1897`) | S to confirm |
| A2 | `theme/components/MobileMenu.tsx:148` | See D2. | | Medium | M |

Checked and fine: no positive `tabindex` (0 places); `:focus-visible` in 83 places; `prefers-reduced-motion` in 51;
every `<img>` in the blocks has `alt`, `width` and `height` (`theme/blocks/*`, `theme/components/PopupView.tsx:25`).
A1 should be confirmed with `check:screens`' focus checks before it is called clean; this audit read the CSS, not the
rendered result. (Changed 18 Nov 2026, cards and lists plan, step 1: the replacement indicator of a part is now one shared ring, `--mo-sys-color-primary`, 3dp, offset 2dp, `border-radius: inherit` (deviation FR1, One focus ring, in primary), so the parts of the cards and lists steps no longer carry their own; a part with its own inset ring, such as the list's -3dp, keeps its component's offset as a component variable. The search view's field keeps its own 2dp ring, deviation A1.)

### 3.5 Performance

| # | Where | Finding | Guide says | Severity | Size |
| :--- | :--- | :--- | :--- | :--- | :--- |
| P1 | `theme/styles/ui.css:2247` | `transition: all` on the carousel dot. | `css`: transition named properties. | Low | S |
| P2 | `src/*`, `theme/*` | No `scheduler.yield` / `scheduler.postTask` (0 places) and 57 `setTimeout` uses. | `performance`: `break-up-long-tasks`, `schedule-tasks-by-priority`. | Low (no measured long task; needs INP data first) | M |
| P3 | `theme/styles/*` | `content-visibility` in 1 place. | `performance`: `defer-rendering-heavy-content`. | Low | M |

Checked and fine: scroll listeners are `passive: true` in 12 of 15 places (the other three: `theme/ui/lightboxControl.ts:108`,
`theme/ui/bottomSheetControl.ts:73`, `src/contextualMenu.ts:180`, the last on `visualViewport`); the Roboto variable
font is preloaded (`theme/components/FontPreload.astro:6`) and its CSS sets `font-display: swap` (9 faces in
`@fontsource-variable/roboto/index.css`); images carry `loading`, `decoding` and `fetchpriority` (9, 10 and 13 places);
`text-wrap: balance` and `pretty` are used (`theme/styles/base.css:326,331`).

### 3.6 CSS layout and responsive design

| # | Where | Finding | Guide says | Severity | Size |
| :--- | :--- | :--- | :--- | :--- | :--- |
| L1 | `theme/styles/*` (42 width `@media` rules, 8 `@container`) | Layout switches on the window width. | `responsive-design`: "Use `@container` queries to create component-driven responsive layouts." | Low | M |
| L2 | `theme/styles/blocks.css` (`grid-template-columns` 24, `column-count` 39 places; `subgrid` 0) | No `subgrid`, no `repeat(auto-fit, minmax())`. | `css-layout`: `auto-fit` for card grids; subgrid for aligned card parts. | Low | M |

**Conflict C4 (L1, L2): decision: owner.** Our layout rules are M3 window size classes (4/8/12 columns; breakpoints in
`lib/breakpoints.mjs:8`: 600, 840, 1200, 1600), CSS columns with no script, gutters 16/24, decided by the owner. M3's
classes are about the window, so the page grid should stay on `@media`; `@container` only makes sense inside a component,
and 8 already do. `auto-fit` would let the column count float between M3's counts. Recommended: keep our grid as it is;
use `@container` and subgrid only inside a component (for example aligned card titles), never to change the page's
columns. We lose nothing; we also gain nothing on the page grid, so the cost-benefit is small. This is the one conflict
where the recommendation is to follow our rule. (Changed 18 Nov 2026: cards and lists plan, step 6, 0.19: the collection, where lists and cards turn into each other, switches by a container query on its own width at M3's 600 dp, `@container collection (inline-size >= 37.5rem)`, which is `@container` inside a component as recommended here; the page's grid stays on `@media`.)

## 4. Conflicts at a glance

| # | Guide | Our rule | Recommendation | Decision |
| :--- | :--- | :--- | :--- | :--- |
| C1 | `closedby="any"`, native `<dialog>` drawer | Animated close; drawer is an M3 theme component | Both: native mechanism, same M3 look and motion, tested first | owner |
| C2 | Anchor positioning | Menus/tooltips placed by script | Modern side, new overlays first, then one component at a time | owner |
| C3 | `light-dark()` tokens | M3 token tiers, generated palettes | Keep tokens; take `color-scheme: light dark` and the meta | owner |
| C4 | `@container`, `auto-fit`, subgrid for layout | Owner's M3 grid | Keep the grid; use the modern features only inside components | owner |


## 5. Recommendation on a check

`legacy-scan` is already clean for `lib`, `worker`, `starter` and `demo`, and has 8 findings in `src`, `theme` and
`pages`. It would be a worthwhile CI check after those 8 are fixed or recorded as kept, with a kept list that carries a
reason (the way `check:phosphor` does). It was not added to `npm run check` or CI.

## 6. Selling points

Each claim below is backed by something this audit read; counts are from the repository at this commit.

What we can say to a site owner:

- **Native building blocks.** Dialogs open with the browser's own `<dialog>` and menus with its `popover`, which bring
  keyboard, Escape and focus handling with them (`theme/ui/Menu.tsx:17`; scan found no custom-built dialog logic besides
  the four listeners above).
- **Fast images.** Every image in the blocks carries its width and height, and is lazy, async-decoded and prioritised
  where it matters (`theme/blocks/*`), so the page does not jump while it loads.
- **Calm motion.** Animations respect the visitor's "reduce motion" setting (51 places).
- **Accessible focus.** Keyboard focus is drawn with `:focus-visible` (83 places) and there is no forced tab order.
- **Readable text.** Headings use `text-wrap: balance` and body text `pretty` (`theme/styles/base.css:326,331`).
- **Fonts that do not block.** The font is preloaded and swaps in (`font-display: swap`).
- **Checked against Chrome's guide.** Chrome's modern web scan finds no legacy patterns in the shared code, the Worker,
  the starter or the demo, and 8 small ones in the editor and theme, listed here.

What we cannot claim yet, and what it takes:

- "Fully follows Chrome's web guidance": the scan covers about a fifth of the guides, so the claim would be only about
  what it checks. Fixing the 8 findings (sizes S to M) and keeping the scan green would make "passes Chrome's legacy
  scan" a true line.
- "Automatic dark mode in every part": the base `color-scheme` is not `light dark` yet (S2, size S).
- "Works with every keyboard and input method": five `Enter` handlers lack the IME check (F1, F2, size S).
- "Tested for speed": no INP or long-task measurement was made here; that needs real measurements before any number is
  stated.
- "Error messages only after you touch a field": `:user-invalid` is not used.
