# Moving the CMS away from Tailwind: plan

Status: plan, 16 Nov 2026; **owner, 19 Nov 2026: released as 0.19.0, not 0.18.2, with one `minor` changeset on its merge into `main` (`2026-11-18-tailwind-batches.md`, Basis)**; corrected 18 Nov 2026 against `0.18` at `f7d4a9ee` (see *State on 18 Nov*); **owner, 18 Nov, confirmed in words: Tailwind ships as 0.18.2, with contract 7** (patch changesets, into `main` after the owner releases 0.18.0 and after the CSS split is done; the build order is `2026-11-18-tailwind-batches.md`, one spec per batch). Written in brainstorm sessions: no code, no builds, no checks run. The counts in §1 are from
`git grep` or a script on `origin/0.18` at `f7d4a9ee` (`package.json` says `0.17.0`, the released line; the work is on the `0.18` branch, which was merged into `main` in #888, so a `next` is staged).
Owner direction, decided and not reopened: in the long run the CMS has no Tailwind. Reasons: one dependency less, one naming system (`--mo-` for every shared custom property), and the priority order of
`developer` §4a (1 Modern web, 2 M3 Expressive, 3 M3, 4 M2 with M3 styling, 5 self-made). Release: 0.18.2 (owner, 18 Nov). Earlier steps of this plan (0.21 deprecate and 0.23 remove) and the proposal "on the 0.18 line, inside contract 6" are superseded.

## State on 18 Nov: what changed since this plan was merged

This section replaces the *Revision 16 Nov* that stood here (the `--mo-` rename waits for Tailwind's removal): the owner took the rename first, without aliases, and it has landed. Read against `origin/0.18` at `f7d4a9ee` (#908).

| Topic | The plan said | The code says now |
| :-- | :-- | :-- |
| The `--mo-` rename | PR 0, first (then, in the Revision, after PR 10) | **Done.** Every token that is not Tailwind's is `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*` (`docs/css-tokens.md`, `docs/theme-token-files.md`, table in `plans/2026-11-16-token-rename-table.md`: 747 names renamed, **129 Tailwind names stay**). Tokens live in `theme/styles/tokens/<origin>/`, are registered with `@property` (`registry.css`, `scripts/gen-token-registry.mjs`), and `check:css-tokens` and `check:token-names` hold the rule. `THEME_API` and `APP_API` are 6, `APP_APIS` is `[6]` (`lib/contracts.mjs`, changeset `token-contract-6`, minor). |
| Type classes (PR 9) | 16 `@utility type-*` become plain classes | **Done.** `mo-type-display-large` … `mo-type-lead` are plain classes in `theme/styles/type.css`, in `@layer utilities` (`docs/type-classes.md`); `@utility` count is 0. What is left: the spellings `medium:mo-type-…` (3 files) and `[&>p:first-child]:mo-type-lead`, which exist only while Tailwind builds variants. |
| CSS split | not in the plan | **Moving.** `ui.css` is 2,798 lines (7,821 before), `blocks.css` 1,493, `components.css` 181; 22 part files in `theme/styles/` are listed in `theme/styles/files.mjs` and imported by `base.css` (PRs #893 to #908 so far); buttons and text fields come last (`plans/2026-11-16-css-split.md`). The `theme()` calls are now spread over 28 files, 15 of them token files. |
| Where the Tailwind wiring is | `base.css`, `ui.css`, `global.css` | `@theme` is in `theme/styles/tokens/base/ref.css` (`inline` 110, `static` 4) and `tokens/material/ref.css` (`inline` 1); `@plugin` in `base.css:2`; `@source` in `ui.css:97-99` (it goes when `ui.css` is deleted: the split must carry it, see batch T16). The `@theme` right-hand sides already point at the `--mo-sys-*` names. |
| The 129 Tailwind names | "not renamed, deleted with `@theme`" | Still true, each allowlisted with a reason in `scripts/css-tokens-allowlist.json` that names this plan. Reads of them outside `@theme`: `var(--font-sans)` 17, `var(--radius-panel)` 6, `var(--color-…)` 4 (`src/ui.tsx:365,1922,1923`); the `--text-*` alias is no longer read by any `var()`, only by the 17 `text-<role>` utility uses. |
| Release | 0.21 to deprecate, 0.23 to remove | **0.18.2** (owner, 18 Nov, confirmed in words, after the PM had also put "remove it on the 0.18 line inside contract 6" to the owner). `v0.17.0` is the last tag; 0.18 is merged into `main` (#888) but not released, so 0.18.0 comes first and is the owner's, and the Tailwind work goes into `main` after it. There is no deprecation line: the warnings, the migration guide and the gate ship with the break (§5). |
| Contract numbers | "raise both to 6 in 0.23" | 6 is the token rename in 0.18.0. The removal is a second break (a utility class stops working) and raises both contracts to **7**, with `APP_APIS = [7]` (batch T16). |
| Open question "who renames" | the Tokens session, after PR 10 | Answered. Still open: who reads the old token names and the utilities in `venus` and the store apps (§1.9), which now is one question about two breaks. |
| Cards and lists (new, PM, 18 Nov) | not in the plan | Steps 1 to 5 of `2026-11-17-cards-and-lists-0-19.md` (PR #886) go into 0.18.0 in plain CSS; their files are taken out of the batches (`2026-11-18-tailwind-batches.md`, *The card and list files …*): 27 of the 2,559 utility uses (`PostCard.tsx` 7, `PostList.tsx` 6, the card of `NotFound.astro` 14), so 2,532 are left; T10 to T15 wait for those steps as well as for the CSS split. |
| Tokens that one block reads | PM rule (16 Nov) | Now the repository's rule (`docs/css-tokens.md`: "A token only one block uses is declared on that block"), checked by `check:css-tokens --report`. §3.2 follows it. |

## Decisions for the owner

Decided: Tailwind ships as 0.18.2 with contract 7 (owner, 18 Nov), patch changesets only, into `main` after 0.18.0 is released and after the CSS split is done; the `--mo-ref/sys/comp` rename came first and has no aliases (done); component tokens are `--mo-comp-*` (done); the type classes are plain CSS (done). The defaults below were taken for the batches (PM, 18 Nov).

1. **Decided (owner, 18 Nov): 0.18.0 (contract 6, the token rename) and 0.18.2 (Tailwind, contract 7) are two separate releases, with the 0.18.1 fixes release between them.** So theme and app authors meet two contract numbers, 6 (the token rename) and then 7 (Tailwind). Mitigation: the migration guide (T02) and the vocabulary are published before 0.18.0, so an app or theme released at 6 is already written without utilities and needs only its contract number changed for 7; nothing starts before 0.18.0 is released.
2. **The gate (open for the owner).** Sites update themselves to a minor or patch (`worker/cms-update.js`), so a theme or app that still uses a utility class would lose its styling without a message. Recommend contract 7 / Tailwind (0.18.2) is not released until `morpheme-apps`
   (`venus`, the apps), `morpheme-staging` and `morpheme-website` pass the no-Tailwind check and are released at contract 7, and the store offers 7. Why: there is no deprecation line to warn in; the gate is the warning. The counts are a follow-up docs PR.
3. **Breakpoints (default taken).** Literal values in `@media` plus a check that every literal equals the token table (T03, T10). Why: it works in any theme or app stylesheet with no build change and keeps "identical output" provable. Not `@custom-media` now.
4. **Class names (default taken).** `mo-` on layout classes (`mo-row`, `mo-stack`, `mo-grid`), as `mo-type-*` already is (T04). Why: a theme's own `.row` or `.stack` must not collide.
5. **The editor's `src/` (default taken).** Five slices of about 400 uses (T05 to T09), beside the 0.19 line; each is merged into `0.19` the same day, inside a freeze window the PM announces. Why: short slices keep a conflict to one slice.
6. **Same result first (default taken).** Every batch keeps the rendered result identical; M3 tuning of text spaces and of `pre`/`kbd` colours is a separate, visible change later. Why: only then can a migration be proven (`compare-styles`, T01).
7. **Surfaces in the editor (for the owner later).** About 24 static class attributes in the editor draw a background with a radius or a border. They keep their look in named part rules and are listed in the PRs; whether any becomes a theme component is the owner's call, never inside a migration (`developer` hard rule).
8. **The store (`morpheme-appstore`).** Contract 7 needs it to accept and offer 7; the PM asks for a matching PR there.

## 1. Inventory

Method. The repository had no `node_modules`. I installed `tailwindcss@4.3.5` and `@tailwindcss/typography@0.5.20`
(the repo's ranges) in the scratchpad only, loaded Tailwind's own design system with the repo's `@theme` blocks (the `@utility` rules are gone since the type classes moved), and
asked it which string in the markup is a valid utility. Counted twice: 16 Nov at `795b68c` and again 18 Nov at `f7d4a9ee`; the tables below are the second count. That is why a word like `flex` in a comment
is not counted but `rounded-(--block-radius)` is. The extraction script is in the scratchpad (`classes.mjs`); batch T01
commits a clean version of it as the migration's progress meter. A "real class attribute" here is a string inside
`class="…"`, `className="…"`, `className={…}` or `class:list={…}`; strings in constants are reported separately.

### 1.1 Where Tailwind is wired in

| What | Where | Count / command |
| :-- | :-- | :-- |
| `@import 'tailwindcss'` (theme, **preflight**, utilities) and `@plugin '@tailwindcss/typography'` | `theme/styles/base.css:1-2` | 2 lines |
| `@layer theme, base, components, utilities, fallback;` (the cascade our rules rely on) | `theme/styles/base.css:4` | 1 |
| `@source '../..'` (scan the whole package, also `node_modules`) and two `@source not` | `theme/styles/ui.css:97-99` (the file the split is emptying: the lines must move with the split's last PR, to `base.css`) | 3 |
| `@reference '../theme/styles/base.css'` | `src/editor.css:4` | 1 |
| `@theme inline` blocks | `theme/styles/tokens/base/ref.css` 110 declarations (45 `--color-*`, 60 `--text-*`, 2 `--radius-*`, `--shadow-soft`, `--ease-soft`, `--font-sans`), `tokens/material/ref.css` 1 (`--font-sans`) | `git grep -n '@theme'` |
| `@theme static` (the four `--breakpoint-*`, also the only reason they exist on `:root` for the editor's Preview: `src/previewBreakpoints.ts`) | `theme/styles/tokens/base/ref.css:146` | 4 declarations |
| `@utility` | none: the 16 type styles are plain `mo-type-*` classes in `theme/styles/type.css` (`docs/type-classes.md`) | 0 (`git grep -c -E '^\s*@utility' -- theme`) |
| `theme(--…)` in CSS | `src/editor.css` 17, then 27 files in `theme/styles/` (14 of them token files under `tokens/`: `cards.css` 6, `components.css` 6, `global.css` 5, `blocks.css` 5, `bottom-sheet.css` 3, `ui.css` 2, `lists.css` 2, `lightbox.css` 2, `base.css` 2, `snackbar.css` 1, `menus.css` 1, and the tokens) | **72**: 63 `--breakpoint-medium`, 4 `-large`, 4 `-expanded`, 1 `--container-3xl` (`src/editor.css`). 71 are inside an `@media`; 28 files. `git grep -o 'theme(--[a-z0-9-]*)' -- theme src` |
| `--tw-prose-*` custom properties (the plugin's colour hooks; Tailwind's names, so not renamed by the rename) | `src/editor.css` 17, `base.css` 15, `blocks.css` 12 | 44 lines, 14 distinct names |
| `@apply`, `@variant`, `@custom-variant`, `@config` | none | `git grep` finds 0 |
| Vite plugin | `astro.mjs:9` import, `astro.mjs:173` `tailwindcss()` | 2 lines. No `css.transformer`, no `lightningcss`, no PostCSS config anywhere (`git grep -i lightningcss` = 0) |
| Prettier plugin | `.prettierrc.json` and `starter/.prettierrc.json` (`prettier-plugin-tailwindcss`, `tailwindStylesheet`) | 2 files |
| Checks that know Tailwind | `site/breakpoints.mjs` (old breakpoint names), `scripts/check-css-values.mjs` (off-scale classes), `scripts/check-css-tokens.mjs` and `scripts/css-tokens-allowlist.json` (the Tailwind namespaces it allows, 20 mentions, each saying it goes with this plan), `scripts/check-token-names.mjs`, `scripts/check-colors.mjs` (palette classes), `scripts/spacing-grid.allow.mjs`, `scripts/color-names.test.mjs`, `scripts/peer-ranges.test.mjs` (the typography override), `lib/licenses.mjs` (3 mentions: preflight and typography licences), `lib/contracts.mjs`, `docs/css-tokens.md`, `.claude/skills/checks/SKILL.md`, `README.md:48` | 11 scripts, libs and docs |

### 1.2 Dependencies

`git grep -n -i tailwind -- '*package.json'` (not the lock file):

| File | Entries |
| :-- | :-- |
| `package.json` | `peerDependencies`: `@tailwindcss/typography`, `@tailwindcss/vite`, `tailwindcss` (3). `devDependencies`: the same 3 plus `prettier-plugin-tailwindcss` (4). `overrides`: `@tailwindcss/typography › postcss-selector-parser` (1). 8 lines |
| `starter/package.json` | `@tailwindcss/typography`, `@tailwindcss/vite`, `tailwindcss`, `prettier-plugin-tailwindcss`, and the same `overrides` entry. 5 lines |
| `site/` | no `package.json` of its own (`site/` is a folder of the package) |
| `scripts/fixtures/starter-0.14.2.package.json` | 5 lines, a fixture for the upgrade tests; stays as it is |

`postcss` and `postcss-selector-parser` stay: `site/themeCoverage.mjs` uses them. `lightningcss` is not a direct
dependency today.

### 1.3 Utility classes in markup (counts at `f7d4a9ee`)

Files scanned: `git ls-files -- '*.tsx' '*.astro' '*.jsx'` in `theme/`, `src/`, `pages/`, `starter/`, `demo/`, `site/`,
`defaults/`, `lib/` = 319 files (214 `.tsx` and 32 `.astro` have a class attribute; 0 `.jsx`).

| Folder | Utility uses in class attributes |
| :-- | --: |
| `src/` (the editor; 99 files, 170 `.tsx` in all) | **2,201** |
| `theme/` (35 files) | **356** |
| `defaults/` (`popup.tsx`: `not-prose mx-auto max-w-md`) | 2 |
| `pages/`, `starter/`, `site/`, `lib/`, `demo/` | **0** |
| **Total** | **2,559 uses, 566 distinct classes** (16 Nov: 2,585 and 574; the difference is the type styles, which are `mo-type-*` classes now, not utilities) |

12 more distinct classes appear only in constants (`-translate-x-1/2 -translate-y-1/2 border-[3px] border-[rgb(…)] border-l
border-white large:col-start-2 medium:mt-8 pointer-events-none shadow-[…] text-(--mo-sys-color-error) w-[22.5rem]`). All 578 are in
Appendix A with their use count and the CSS Tailwind makes of them. By family (my split; Appendix A has the exact names):

| Family | Uses | Distinct |
| :-- | --: | --: |
| display, flex, grid, alignment (`flex`, `items-center`, `shrink-0`, `flex-1`, `grid`, `block`, `gap-*` …) | 819 | 88 |
| margin, padding, `space-y-*` (`mb-8`, `px-4`, `p-4`, `space-y-5` …) | 648 | 143 |
| type (`text-sm`, `font-medium`, `text-title-large`, `truncate`, and the `medium:mo-type-…` variants) | 257 | 46 |
| sizing (`min-w-0`, `w-full`, `max-w-*`, `size-full`, `h-16` …) | 246 | 88 |
| colour (`text-on-surface-variant` 133, `border-outline-variant`, `bg-surface-container-high` …) | 244 | 47 |
| position, overflow (`relative`, `absolute`, `overflow-hidden`, `sticky` …) | 122 | 48 |
| border, radius, shadow, outline | 112 | 37 |
| transition, transform, opacity, cursor, pointer-events | 48 | 35 |
| `sr-only`, `object-*`, `list-*`, `bg-*` images | 34 | 12 |
| arbitrary properties and selectors (`[--mo-comp-card-padding:1rem]`, `[&>svg]:size-4`, `[container-type:size]`, `[mask-size:contain]` …) | 29 + variants below | 22 |

The ten most used: `flex` 157, `text-on-surface-variant` 133, `items-center` 71, `shrink-0` 71, `text-sm` 64, `font-medium` 59,
`min-w-0` 50, `gap-2` 49, `flex-1` 48, `mb-8` 45 (and `px-4` 45).

Variants (a prefix before `:`), counted per class use: `medium:` 81, `expanded:` 24, `large:` 17, `focus:` 17,
`focus-visible:` 14, `hover:` 13, `group-hover:` 7, `min-[600px]:` 6, `max-medium:` 1, `max-expanded:` 1, and, as arbitrary or state variants, 19 uses of bracket selectors
(`[&>.tooltip]:`, `[&>svg]:`), 21 of bracket properties (`[--mo-comp-card-padding:1rem]:`-style) and 23 of `has-`, `group-data-`, `aria-`, `data-`, `not-first:`, `first-of-type:` and similar. `extra-large:` is used 0 times.

Static `class="…"` attributes: 1,307 (877 different strings, 2.2 classes each; counted 16 Nov). Another 361 `className={…}` are built in code
(a codemod must handle them; a regex alone will not). Content: `git grep -h -o -E 'class="[^"]*"' -- '*.md'` finds only component
classes (`label-medium`, `color-accent`, `color-muted`, `body-small`, `body-large`) in the demo and the starter: no utility in content
there. A real site's own content may differ; Tailwind scans it today (not checkable here).

Things the numbers hide:

- **Hard-coded couplings to a utility.** `--carousel-bleed: 1rem` and `--chip-set-bleed: 1rem` (`base.css`) exist because
  `Container.astro`'s gutter is `px-4`. When `px-4` goes, the gutter must become one token that both read.
- **Colours are Tailwind's `--color-*` aliases of the `--mo-sys-color-*` roles** (45 declarations in `@theme inline`; their right-hand sides are already the new names). They vanish with
  Tailwind; the colour utilities (244 uses) become `color: var(--mo-sys-color-…)` in a part's class, or the markup uses a role class (`.mo-on-surface-variant`).
  Reads of Tailwind-named properties outside `@theme` that need a `--mo-` home before the `@theme` blocks go (the rename left them, by decision): `var(--font-sans)` 17 times, `var(--radius-panel)` 6 times,
  4 single `var(--color-…)` reads (`src/ui.tsx:365,1922,1923`); `--breakpoint-*` is read by `src/previewBreakpoints.ts` (§2). `git grep -h -o -E 'var\(--(color-|text-|radius-panel|font-sans)[a-z-]*\)' -- theme src lib`.
- **Colours that are not roles:** `border-white`, `border-[rgb(128_128_128/0.45)]` and `shadow-[0_0_0_1px_rgb(0_0_0/0.3)…]`
  exist in constants; `check:colors` has allowlist reasons for them.
- `min-[600px]:` (6 uses, `src/PreviewScreen.tsx:90-101`), `[@media(width<37.5rem)]:` (`src/ui.tsx`), `@media (width < 73.5rem)` and `@media (max-width: 599.98px)` (both in `src/editor.css`) are literal widths today, three of them off the table.

### 1.4 The rule "no UI part is built from utilities"

It holds in `theme/ui` for the components themselves (its parts, 47 `.tsx` files in `theme/ui`, have class names styled in `ui.css`). It does not hold
for the editor: `src/ui.tsx` has 617 utility uses, `src/Screen.tsx` 110, `src/Media.tsx` 85, `src/Library.tsx` 74,
`src/SelectionParts.tsx` 64. In `theme/` the heaviest are `CookieConsent.astro` 34, `New.astro` 33, `Header.astro` 32, `BlogPosts.tsx` 29.
This plan does not call that a violation (the editor's own workspace may differ, `material-3` rule 1); it states that
removing Tailwind is also removing those 2,201 uses.

### 1.5 `prose`

`git grep -l -P '(^|[\s"'"'"'`.{])prose(?![-\w])' -- . ':!docs' ':!CHANGELOG.md' ':!release-notes' ':!package-lock.json'` = **27 files** on 18 Nov (20 on 16 Nov; the new ones are token files and the demo's Typography page):
19 in production code, demo content and token files, 8 tests and scripts. The owner's "about 34" is not what the code says: `git grep -l -w prose` finds 42 files, but
most of the other 22 are `@milkdown/kit/prose/…` imports (`src/eyebrowState.mjs`, `src/markdown.mjs` …), not the class.

- **7 class attributes** use it: `src/MarkdownEditor.tsx:3391` (`editor-text prose max-w-none …`), `src/standard/view.tsx:50`,
  `theme/editor/previews.tsx:40`, `theme/components/Markdown.astro:18`, `theme/layouts/PageLayout.astro:94-95` and `theme/layouts/PostLayout.astro:45`
  (`prose mx-auto mt-10 max-w-3xl px-4 medium:mt-14 medium:px-6 …`); the text measure is now a token (`max-w-[var(--mo-sys-block-text-measure-max)]`, `min-w-[min(var(--mo-sys-block-text-measure-min),100%)]`), set in the markup next to `prose`.
- **106 CSS lines** select `.prose` or set `--tw-prose-*` (`git grep -c -P '\.prose|prose-' -- 'theme/styles/*.css' 'theme/styles/tokens' src/editor.css`: `blocks.css` 42,
  `base.css` 38, `src/editor.css` 17, token files 6, `global.css` 2, `components.css` 1). `--mo-sys-prose-space` already follows the rename (`tokens/type/sys.css`, `tokens/base/sys.css`).
- `not-prose` appears in 12 files (`git grep -c -w not-prose`), 18 times: it is the escape hatch for blocks inside text and part of what
  themes use. `.prose` itself has `max-width: 65ch` from the plugin; every one of the 7 uses sets its own `max-w-*`, so nothing depends on 65ch.

### 1.6 What the typography plugin emits that we depend on

I compiled the plugin (`@tailwindcss/typography@0.5.20`, class `prose`) in the scratchpad: **87 rules** under `.prose`, each wrapped in
`:where(…):not(:where([class~="not-prose"], [class~="not-prose"] *))`. Groups:

1. Root: `color: var(--tw-prose-body)`, `max-width: 65ch`.
2. `p` (1.25em above and below), `[class~="lead"]` (1.25em, 1.6 line height, `--tw-prose-lead`).
3. `a` (colour, underline, weight 500), `strong` (600, colour), `a strong`, `blockquote strong`, `thead th strong` (inherit).
4. `ol` (decimal, `type="A|a|I|i|1"` variants, 1.625em start padding), `ul` (disc), the `::marker` colours, `li` spacing (0.5em), nested lists, a list item's first and last paragraph, `dl`, `dt`, `dd`.
5. `hr` and `hr + *`, `blockquote` (italic 500, start border 0.25rem, 1em padding) and its `::before`/`::after` quote marks.
6. `h1`-`h4` with their margins, `h2 + *`, `h3 + *`, `h4 + *` (no top margin), `strong` in headings.
7. `img`, `video`, the wrapper element of responsive images, `figure`, `figcaption`.
8. `kbd`, `code` (weight 600, backticks as `::before`/`::after`), `a code`, headings' `code`, `pre` (colour, background, overflow, padding, radius) and `pre code`.
9. `table`, `thead`, `tbody tr`, `tfoot`, `th, td` with first/last-child paddings.
10. `.prose > :first-child` and `> :last-child` (no outer margin).

- `pre` and `kbd` are **not** overridden by us: they use the plugin's own fixed grey `oklch` palette (`--tw-prose-pre-bg: oklch(27.8% 0.033 256.848)`, `--tw-prose-pre-code`, `--tw-prose-kbd`), not M3 roles, in light and dark alike. No theme markup uses `<pre>` today, but a page can. The first PR keeps the values (identical); a later visible PR moves them to roles.

What `base.css` already overrides in the `fallback` layer (all of this stays ours): the font from the M3 body
role, `p` spaces (`--prose-space`, 1rem, 1.5rem for a lead), `h3` margins, `h2`/`h3`/`h4` from the type scale, inline `code` on a tint with no backticks, `a`
weight and underline, `img` radius and width, `iframe` ratio and margins, `.post-lead`. The rest (lists, tables, `pre`, quotes, `hr`, `dl`,
`kbd`, `figure`, the em margins of headings) is what we get from the plugin and must write ourselves, in M3 units where a spacing is printed
and otherwise as today's value (§4).

### 1.7 Tailwind's reset (preflight) — not on the owner's list

`@import 'tailwindcss'` includes Tailwind's **preflight**: 398 lines, 35 rule blocks (`*, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid }`,
heading, list, table, `img, svg, video … { display: block; max-width: 100%; height: auto }`, form-control resets, `button` and `[hidden]`…). The CMS relies on it
without naming it; `base.css`'s `body` and `:focus-visible` rules sit on top of it. Removing Tailwind means writing our own reset
(batch T14). This is the largest hidden dependency: no `grep` finds it, only a before/after comparison does.

### 1.8 Other places

- `theme/layouts/Base.astro:147-148` and `pages/editor/index.astro:60-61` write `<style is:inline>` with the colours and the motion: unrelated.
- Astro `<style>` blocks: none except those 4 inline ones. So `@custom-media` (§2) could not be used in a component's own `<style>`; today there are none.
- The editor's Preview reads `--breakpoint-*` from `:root` (`src/previewBreakpoints.ts`), which only exists because of `@theme static`. After the move
  they must be plain declarations with a `--mo-` name (`--mo-ref-breakpoint-*` by the tier pattern; the rename table lists them as Tailwind's, so they have no name yet), set once in `tokens/base/ref.css` next to the table.

### 1.9 The sibling repositories (counted 18 Nov) and what I could not see

Attached 18 Nov, read only (shallow clones; `morpheme-apps` at `846b7410`, `morpheme-staging` at `5e26afd3`, `morpheme-website` at `da2bec91`). Same method as §1 (Tailwind's design system with the CMS's `@theme` blocks; `git grep` for the rest).

**`morpheme-apps`** (the owner's apps and `themes/venus`):

| Where | Tailwind | Also needed for the contract (not Tailwind) |
| :-- | :-- | :-- |
| `themes/venus` (8 CSS files, no markup) | 3 `theme(--breakpoint-medium)` in `@media` (`styles/lists.css:45`, `panels.css:104`, `tokens.css:124`); 1 `@theme inline { --font-sans: 'Outfit Variable', … }` (`styles/global.css:45`); 0 utility classes, 0 `prose`, 0 `--tw-` | **145 reads of old unprefixed token names** (`--radius` 15, `--radius-small` 11, `--type-body-large-*` 27, `--block-*`, `--chip-*`, `--text-field-*` …): venus predates the token rename of contract 6 |
| `apps/cookiescanner` (not released) | 4 class attributes, 7 utility uses: `space-y-4` ×3, `mb-8` ×2, `flex flex-wrap gap-2` (`blocked.tsx:96`, `page.tsx:55`, `problems.tsx:106,188`) | none |
| `apps/calendly`, `content-colors`, `google-ads`, `google-analytics`, `gtm`, `mailchimp`, `mobilepay` | none (the `@theme` hits in `calendly`, `mailchimp`, `mobilepay` are `@theme/ui` import paths, not CSS) | none; their `app.json` `api` is 4 (`content-colors`, `mobilepay`, `cookiescanner`) or 5 (the rest): **none is at contract 6 yet** |
| `package.json`, `.prettierrc.json` | `@tailwindcss/typography`, `@tailwindcss/vite`, `tailwindcss`, `prettier-plugin-tailwindcss`, the typography `overrides` entry (5 lines); the Prettier plugin and `tailwindStylesheet` (2 lines) | |

**`morpheme-staging`:** `src/themes/theme_fa395ad84690acbd` is an installed copy of venus (1 `theme(--breakpoint-medium)` in `styles/panels.css:104`, 1 `@theme inline` in `styles/global.css:43`; no utility), `src/apps` (two apps, `cms-version` and one more) has none; `package.json` lists the four packages (4 lines) and `.prettierrc.json` the plugin (2 lines). The theme copy is refreshed by the store when venus is re-released, not edited by hand.

**`morpheme-website`** (235 files; its theme is `saturn`, which is not in this tree, so it is uncounted): `src/apps/cookiescanner` is the copy in use and has the same 4 class attributes (7 utility uses: `blocked.tsx:96`, `page.tsx:54`, `problems.tsx:106,188`); no `theme()`, `@theme`, `@apply`, `--tw-` or breakpoint variant anywhere; no utility in `src/content`. `package.json` lists the four packages (4 lines), `.prettierrc.json` the plugin (2 lines). Text that names Tailwind and goes stale: `CLAUDE.md:78`, `docs/rules.md:116`, `docs/platform.md:166`, `README.md:430,439` and two lines in `.agents/skills/site-editor-theme/SKILL.md` (one each in `site-editor-app` and `site-editor-block`); the other skills' hits are taste guides, not rules.

**What this means for the gate:** the real Tailwind work outside the CMS is small: venus (4 CSS edits), cookiescanner (4 attributes, in two copies: `morpheme-apps` and `morpheme-website`), the package lists and Prettier config of the three repositories, and a few lines of text in the website's docs. The larger work is contract migration that every app and venus need anyway: all eight apps move from 4 or 5 to 7, and venus's 145 old token reads move to `--mo-*` names. The owner chose two separate releases, so authors migrate in two steps; writing without utilities already at 6 (guide T02) makes the second step a number change.

**Not seen:** the theme `saturn` that the website uses (not in the tree), and the sites of real customers (their `src/themes`, `src/apps`, own content) are unknown too; `check:content` already scans a site's own files for breakpoints (`breakpointProblems`), so a site-side count can come from there.
- I could not read web.dev; I read the Modern Web Guidance in the repo's pinned `modern-web-guidance@1.0.0` (§2). I did not run `npm run check`, `check:screens`, or a build (brainstorm session).
- Not checked: whether `lightningcss` is already in the install tree through Tailwind's engine (§2).

## 2. Breakpoints

### 2.1 What exists

The values are ours already: `lib/breakpoints.mjs` (`compact 0, medium 600, expanded 840, large 1200, extraLarge 1600`, in `dp`) and
`--breakpoint-medium: 37.5rem`, `-expanded: 52.5rem`, `-large: 75rem`, `-extra-large: 100rem` in `theme/styles/tokens/base/ref.css`; a test (`breakpoints.test.mjs`) keeps the two equal.
CSS cannot read a custom property inside `@media` or `@container`, which is why `theme(--breakpoint-…)` exists: Tailwind replaces it with the value at build time, so the
built CSS already contains the literal. `@media (width >= …)` range syntax is already what we write. 71 queries use it (§1.1).
`site/breakpoints.mjs` (run by `check:content` and over the CMS's own folders) today **forbids** a literal width and tells people to use `theme()`.

### 2.2 What the Modern Web Guidance says

Read in the repo's install (`npm run audit:web -- search "container queries"`, `… retrieve "responsive-design"`, `"size-aware-styling"`, `"css-layout"`, `"css"`; the
same package I installed in the scratchpad):

- `responsive-design`: "Use `@container` queries to create component-driven responsive layouts that adapt to their parent container's size rather than the viewport."
- `css-layout` §Container queries: "Mental model: container queries = component context; media queries = global page layout and user preferences." and
  "Baseline status for Container queries (size): Widely available. It's been Baseline since 2023-02-14."
- `size-aware-styling`: a fallback for no container-query support is a stacked layout enhanced with `@media`.
- `css` §design tokens: custom properties as tokens, cascade layers for priority, `:where()` to flatten specificity.
- **No guide in the package covers `@custom-media`, and none names Lightning CSS.** I searched the package text for `custom-media`: 0 matches. So the guidance neither recommends nor forbids it.

### 2.3 The three options

| | A. Literal values + a check | B. `@custom-media` through Lightning CSS | C. Container queries |
| :-- | :-- | :-- | :-- |
| How | `@media (width >= 37.5rem)` written out; `lib/breakpoints.mjs` is the table; a check fails on any width literal that is not one of the four (and the matching `max` forms: `width < 37.5rem`) | `@custom-media --medium (width >= 37.5rem);` once, `@media (--medium)` everywhere; Vite `css.transformer: 'lightningcss'` | `container-type: inline-size` on the component's box and `@container (width >= …)` |
| Works in `theme/`, installed themes and apps | Yes, any stylesheet and any build | Only inside a stylesheet that the transformer bundles together with the one that defines the name (a theme that imports `base.css`); not in a lone file | Yes |
| New dependency | none | `lightningcss` as a direct dependency (replaces 4 Tailwind packages); `css.transformer` and `css.lightningcss.drafts.customMedia` set in `astro.mjs` | none |
| Browser support | all (range syntax is Baseline) | the browser never sees it: compiled away. Native support is **not** confirmed by me (I could not check it) | Baseline since 2023-02-14 (guide) |
| Verified in this repo | trivially: 71 queries already compile to literals | **No.** No `css.transformer` is set (§1.1), Astro 7 and Vite 8 behaviour with it is unverified, the `drafts` flag name is from memory | partly: 12 `@container` uses exist (`blocks.css`, `ui.css`) |
| Cost | repetition of 4 values (but the check makes drift impossible); a theme author must copy values | a config change on every site (`siteConfig()` is shared, so one place), a build-time dependency in the starter's peers; a draft spec feature | changes behaviour wherever the component is not as wide as the window (Preview frame, side sheets), so it is not "same result" |

**Recommendation: A for everything that exists, C for new components, not B now.** Reasons: A is the only option that keeps
"identical output" provable (batches T03 and T10: the built CSS is byte-identical after normalising, since `theme()` already compiled to these literals),
works in any theme or app stylesheet with no config, and the existing `site/breakpoints.mjs` check is one inversion away. M3's window size classes are about
the window, which is what the guide calls "global page layout", so `@media` is the right tool for the shell (header, rail, bar, drawer, sheet, page grid). C is the guide's
choice for a component that lives in different widths; use it for a new component and when a component is already
misbehaving in the Preview or a side sheet, one component at a time, as a visible change with screenshots. B is revisited when native
`@custom-media` support is confirmed: it would then be a mechanical replacement with no build step.

How it works for a theme or an installed app: they write `@media (width >= 37.5rem)` or `@media (width >= 52.5rem)` with the values published in the theme
docs (one table: dp, rem and the M3 window class), and `check:themes` / `check:content` (the existing `breakpointProblems` run on `src/themes` and `src/apps`)
reject any other width. Scripts keep `atLeast('medium')` from `lib/breakpoints.mjs`. The editor's Preview reads `--mo-breakpoint-*` from `:root`, now plain declarations next to the table
(a test keeps them equal to `lib/breakpoints.mjs`, as today).

The check: replace `RULES[0]` of `site/breakpoints.mjs` so a width in `@media`/`@container` passes if it equals one of `37.5rem 52.5rem 75rem 100rem` (any of `>=`,
`<`, `min-width`; `max-width: 599.98px` and `73.5rem` need a decision each: use the token below it with `<`, or an allowlist with a reason).
Named container queries (`@container carousel (width >= 35.5rem)`) are component sizes, not window classes, and stay free (the rule already skips any line with `@container`).

## 3. Layout classes

### 3.1 The guidance

`css-layout` (decision tree): grid before flex for 2D, subgrid for aligned card contents, `gap` instead of child margins, `margin-inline-start: auto` to push to the end,
`min-inline-size: 0` on flex items with long content, logical properties (`inline-size`, `margin-inline`, `padding-block`, `inset-inline-start`) "for layout dimensions and
spacing", intrinsic sizing (`fr`, `minmax()`, `fit-content()`) "before fixed `width`/`height`", `aspect-ratio` for media. `css` §Logical properties: "Do not use logical properties
indiscriminately — ask yourself 'would I want this to flip in RTL?'". The editor already writes `ps-4`/`pe-4`/`ms-auto` in places.

### 3.2 The vocabulary (small, named for what it does, in `theme/styles/layout.css`, layer `utilities`)

Every class reads `--mo-ref-space-*` (the M3 spacing scale, `tokens/base/ref.css`), so no utility has a number of its own. A class that takes a value reads a component token named by the rule of `docs/css-tokens.md` (`--mo-comp-row-gap`, `--mo-comp-stack-gap`, `--mo-comp-grid-gap`, and the existing `--mo-comp-grid-columns` that the card and block grids already set, `tokens/blocks/comp/grid.css`), declared once with its default in the vocabulary's token file under `theme/styles/tokens/base/comp/` (shared, so registered with `@property`) and overridden on the element that needs another value (`[--mo-comp-row-gap:var(--mo-ref-space-150)]`). No unprefixed name: `check:css-tokens` would fail it.

| Class | What it is | Replaces (examples, counts from §1.3) |
| :-- | :-- | :-- |
| `mo-row` | `display: flex; align-items: center; gap: var(--mo-comp-row-gap)`; modifiers `mo-row-wrap` (`flex-wrap: wrap`), `mo-row-start` (`align-items: flex-start`), `mo-row-end`, `mo-row-between` (`justify-content: space-between`) | `flex items-center gap-2` 49 `gap-2`, `flex-wrap` 39, `items-start` 18, `justify-end` 14 |
| `mo-stack` | `display: flex; flex-direction: column; gap: var(--mo-comp-stack-gap)` (replaces `space-y-*` with `gap`, the guide's rule) | `flex-col` 26, `space-y-4/5/6/3/2/1/10` 100+ |
| `mo-grid` | `display: grid; gap: var(--mo-comp-grid-gap)`; `grid-template-columns: repeat(var(--mo-comp-grid-columns, 1), minmax(0, 1fr))`; `--mo-comp-grid-columns` set per breakpoint by `mo-grid-2` etc. (`medium:grid-cols-2` 8, `expanded:grid-cols-2` 4). The M3 grid already exists as `.image-grid` (`docs/theme-grid.md`); this is only for plain columns | `grid` 31 |
| `mo-fill` | `flex: 1 1 0; min-inline-size: 0` | `flex-1 min-w-0` (12 identical strings), `flex-1` 48, `min-w-0` 50 |
| `mo-keep` | `flex-shrink: 0` | `shrink-0` 71 |
| `mo-truncate` | the three lines of `truncate`, `mo-clamp-2` for `line-clamp-2` | `truncate` 31 |
| `mo-center` | `margin-inline: auto` and max inline size from `--mo-measure` | `mx-auto` 10, `max-w-*` |
| `mo-cover` | `object-fit: cover; inline-size: 100%; block-size: 100%` | `object-cover` 14, `size-full` 8 |
| `mo-visually-hidden` | the standard clip pattern | `sr-only` 8 |
| `mo-hidden`, `mo-contents` | `display: none`, `display: contents` | `hidden` 13, `contents` 6 |

Everything else becomes component CSS named after the part (`.header-actions`, `.cookie-consent-row`), in the file that already styles that part (`ui.css`, `blocks.css`,
`components.css`, `src/editor.css`) with logical properties, `gap` and tokens. That is how the theme's own parts in `theme/ui` work already; it is not an "invented
component", it is the existing rule applied to the markup that skipped it.

Where a token lives (PM, 16 Nov; since then the repository's rule, `docs/css-tokens.md`): a token that only one block reads moves into that block's own stylesheet, on the block's root element (Astro ships a block's CSS only on the pages that use it, so the token costs nothing elsewhere); a shared `--mo-*` token stays on `:root`. This applies to the tokens the migration touches: the carousel and chip-set bleed (§1.3) become one gutter token on `:root` only if more than one part reads it, and the vocabulary's `--mo-comp-row-gap`, `--mo-comp-stack-gap` and `--mo-comp-grid-columns` are overridden on the element that uses another value, never on `:root`. `check:css-tokens --report` lists tokens that only one place reads, so the rule has a check.

Rules: (1) a utility-looking name never comes back (the check, batch T17); (2) a vocabulary class sets layout only, never colour, type, shape or state (those
belong to the part and its tokens); (3) numbers come from `--mo-ref-space-*`, `--mo-sys-shape-*` and the `--mo-sys-typescale-*` tokens; (4) a new vocabulary class needs a use of three or more places and goes in the table here
first. Spacing between blocks (`mb-8` 45, `mt-2`…) is not a layout primitive: it is the part's own spacing and becomes a token or a part rule, one at a time.

### 3.3 The mapping table

Every class: Appendix A (578 rows: class, uses, the CSS it makes). By family the rule of replacement is:

| Utility family | Replacement |
| :-- | :-- |
| `flex`, `flex-col`, `flex-wrap`, `items-*`, `justify-*`, `gap-*`, `inline-flex` | `mo-row` / `mo-stack` and modifiers, else the part's own rule (`display: flex`) |
| `grid`, `grid-cols-*`, `col-*`, `medium:grid-cols-*` | `mo-grid` + `--mo-comp-grid-columns`, or `.image-grid` for card grids; subgrid where cards align their insides |
| `space-y-*` | `mo-stack` with `gap` (same space, different mechanism: the first/last margin behaviour needs a `compare-styles` check) |
| `m*`, `p*` | the part's own padding/margin in `--mo-ref-space-*`; logical properties; `mb-8` between blocks becomes the section rhythm token |
| `w-*`, `h-*`, `size-*`, `min-*`, `max-*` | `inline-size`/`block-size`, `fit-content`, `minmax`; `max-w-3xl` → `--mo-measure` of the text style |
| `text-sm`, `text-xs`, `text-base`, `text-title-large`, `type-*`, `font-*` | the M3 type role class (`.type-title-large`, kept from `@utility`) or the part's `font:` from `--type-*`; `text-sm/xs/base` are scale steps `check-css-values` already tracks |
| colour: `text-*`, `bg-*`, `border-*` on roles | the part's CSS reads `var(--mo-…)`; the 133 `text-on-surface-variant` become one class `.mo-muted` (the role's name, not a utility) |
| `relative`, `absolute`, `inset-*`, `sticky`, `z-*`, overflow | the part's rule; `position: relative` is part CSS |
| `rounded-*`, `border`, `shadow-*` | the part's shape and elevation tokens (`--mo-shape-*`, `--mo-elevation-*`); already the rule in `ui.css` |
| `hover:`, `focus:`, `focus-visible:`, `group-*:`, `has-*:`, `aria-*:`, `data-*:` | CSS state selectors in the part's rule (`:hover`, `:focus-visible`, `:has()`, `[data-open]`); state layers already exist (`--mo-hover`, `--mo-pressed`) |
| `medium:`, `expanded:`, `large:`, `min-[600px]:` | `@media (width >= …)` literal in the part's rule (§2) |
| arbitrary `[--card-padding:1rem]`, `[&>svg]:…`, `[container-type:size]`, `[mask-size:contain]` | the part's rule; custom property set on the part's class |
| `transition-*`, `duration-*`, `ease-*` | the motion tokens (`--motion-effects`, `--motion-spatial-fast`) in the part's rule |
| `sr-only` | `mo-visually-hidden` |

## 4. Text styles (replacing `prose`)

Kept: the class names `prose` and `not-prose`, `post-lead`, `lead`. Reason: the 7 markup uses and every installed theme keep working and `compare-html` still passes
on markup. The code behind them changes. They live in `theme/styles/prose.css` (new), written from M3's type roles (`--mo-sys-typescale-*`), `--mo-ref-space-*` and the `--mo-comp-prose-*` colour hooks (renamed
from `--tw-prose-*`, which the token rename left because they are Tailwind's: 44 lines in `base.css`, `blocks.css`, `src/editor.css`; `--mo-sys-prose-space` is already ours), with the same selectors the plugin has, but no `:where(...):not(...)` wrapper chain: `:where(.prose) :where(h2)` for zero
specificity, and `:where(.not-prose, .not-prose *)` once. Layer: the plugin's rules are in the `utilities` layer today (the comment at the end of `blocks.css`); the new rules need
a layer position that reproduces the same win/lose against the `fallback` layer and against utilities such as `max-w-3xl` on the same element. That layer order is decided in batch T13 by comparison, not by reasoning.

What the replacement must give (§1.6): the 10 groups above. The em-based plugin values stay in the first PR (identical result); a later, separate, visible PR moves them to M3 values.
M3 prints no paragraph or heading spacing (the existing comment in `base.css` says so: "it prints no paragraph or heading space, so these are the nearest rule"), so there is nothing to read from m3.material.io
for the spaces; for type sizes the type scale already supplies them.

Proof that the result is the same (`compare-html` proves the markup is unchanged but says nothing about the CSS, so a computed-style comparison is needed):

1. Build the demo and the starter before the PR into a folder of its own (`npx astro build --outDir <before>`), as `compare-html`'s header says.
2. `npx morpheme compare-html <before>`: proves the markup is unchanged.
3. New `scripts/compare-styles.mjs` (batch T01): for each built page, at 375, 700, 900 and 1300 px, Playwright walks every element in document order, and compares
   `getComputedStyle` for a fixed list of about 60 properties (type, spacing, colour, border, display, position, size) and the bounding box, in light and dark and on each section colour.
   It reports the first differing element and property. For `prose` it also compares one fixture page that has every element the plugin styles (h1-h4, p with lead, `ol type=A|a|I|i`, nested lists, `dl`, `blockquote`, `pre`, `code`, `kbd`, `table` with `tfoot`, `figure` with `figcaption`, `hr`, `img`, 
   `video`, a `not-prose` block inside text). `demo/src/content/pages/typography.md` is the start; a fixture is added under `demo/`.
4. The editor: `check:screens` already opens every screen; the same comparison runs in its Playwright on the editor's text field (`.editor-text.prose`) and the Preview.

## 5. Compatibility

What breaks, for whom:

| Who | Today | After removal | Mitigation |
| :-- | :-- | :-- | :-- |
| An installed theme that uses utility classes in its components | works: the site's Tailwind scans `src/themes` | classes do nothing, silently | the theme check fails in this release (no earlier release exists to carry a warning), so the protection is the gate (decision 2); migration guide = `docs/tailwind-migration.md` (T02); `THEME_API` 7 so the store stops offering such a theme (it offers only themes written to the contract the editor has) |
| A theme that uses `theme(--breakpoint-…)`, `@theme`, `@apply`, `@utility` in its CSS | works | the CSS fails to build or is dropped | `check:themes` fails on them (T17) |
| A theme with `medium:` variants | works | silent | as above |
| A theme using `prose` | works | works (class kept) | none |
| An app's blocks with utility classes (`View.tsx`) | works | silent | `APP_API` 7 and `APP_APIS` `[7]`: an app written to 6 is not offered by the store until it is re-released at 7, one already installed runs but a utility does nothing; the app gets the same warning in the editor's app problems (`src/AppProblems.tsx`) |
| A site's own content with utility classes in HTML | works | silent | `check:content` calls the check (T17) |
| A site's `package.json` | lists the 3 packages and the Prettier plugin | extra, unused packages | harmless; the starter stops listing them (`starter/package.json`, `.prettierrc.json`); the upgrade tests use `scripts/fixtures/starter-0.14.2.package.json` and must still pass |
| A site's `.prettierrc.json` | `prettier-plugin-tailwindcss` with `tailwindStylesheet` into `@morphemecms/cms/theme/styles/global.css` | the plugin sorts classes by its default order: harmless | none |

`THEME_API` and `APP_API` (`lib/contracts.mjs`, re-exported by `src/store.ts`): **raise both from 6 to 7 in 0.18.2**, and `APP_APIS` becomes `[7]` (as the token rename did with `[6]`), with no compat file. 6 is the token rename of 0.18.0. The contract text says "Raised when a theme written to the one before no longer works": a theme with a utility class no longer works. The level of every pull request is `patch` or empty, never `minor` or `major` (the changesets skill: never `major`; a `minor` would make the Release PR 0.19.0, which is the cut Lists and data line).
utility class no longer works. This is not a `major` change of the package (the changesets skill never allows `major`): the changeset is `minor`, with the contract change in the note.
Version line: **0.18.2** (owner, 18 Nov): patch changesets, into `main` after the owner releases 0.18.0.

### Release as 0.18.2

1. **Preconditions (not this plan's work):** the owner releases 0.18.0; the CSS split is finished (`plans/2026-11-16-css-split.md`) for the batches that touch its files; no build session starts before that, and none without the PM's word.
2. **The work** is the batch list of `2026-11-18-tailwind-batches.md` (T01 to T17), each into `main` with an empty or `patch` changeset; each merge stages a `next`, so staging (`morpheme-staging`, which follows `next` unless its CMS-version app says `released`) runs the migration step by step; every batch that touches `src/` or `theme/` is merged into `0.19` the same day.
3. **In parallel, `morpheme-apps`/`morpheme-staging`/`morpheme-website`:** their own PRs move every utility, `theme()` and `@theme` out of `venus` and the apps and release them at contract 7 (the PM of those repositories; the guide is `docs/tailwind-migration.md`, the vocabulary `docs/theme-layout-classes.md`); the store offers contract 7.
4. **The gate** (decision 2): the no-Tailwind check passes in all three repositories and the apps and themes are released at 7 and offered by the store; then the PM asks the owner (`pm` skill, phase 4) and the owner runs `/release`. An agent never releases.
5. **After:** the patch reaches sites by the Worker's self-update (it removes peer dependencies, so it should not trigger the `needs-npm` stop that a raised peer did in 0.15.0: a lockfile that satisfied the old peers satisfies fewer; the first `next` on staging confirms it). If a site shows broken styling, the owner can point `latest` back; that is the owner's step, never an agent's.

What the release note must say (it is for theme and app authors, so the note goes to the store's developer notes as well as `release-notes/`; the `release-notes` skill decides the form): which
classes stop working (the Appendix A table link), the new class vocabulary and the literal breakpoint table, that `prose` and `not-prose` still work, that `THEME_API` and `APP_API` are 7 (6 was the token rename of 0.18.0), and
that a theme or app written to 6 that uses no utility, `theme()` or `@theme` needs only its contract number changed. For site owners: nothing changes on screen.

## 6. Sequence and size

Superseded on 18 Nov by one spec per batch (the owner: Tailwind ships as 0.18.2, contract 7). The order, the waves, what can start now and what the split blocks are in `2026-11-18-tailwind-batches.md`; each batch file states its files, its proof that the rendered result is identical, its changeset, its checks and what must merge first. Each is one pull request into `main` (after 0.18.0 is released); at most two are in CI at once.

| Batch | What | Must merge first | Size |
| :-- | :-- | :-- | :-- |
| [T01](2026-11-18-tailwind-t01-proof-tools.md) | Proof tools, the progress meter and the ratchet check | none | medium |
| [T02](2026-11-18-tailwind-t02-migration-guide.md) | The migration guide for theme and app authors | none (the names of T04 are fixed in plan §3.2; if T04 changes one, T04 updates this guide) | small |
| [T03](2026-11-18-tailwind-t03-breakpoint-twin.md) | The breakpoint table as plain tokens, and the width check | none | small |
| [T04](2026-11-18-tailwind-t04-layout-vocabulary.md) | The layout vocabulary (`mo-row`, `mo-stack` …) | none | small |
| [T05](2026-11-18-tailwind-t05-editor-ui.md) | Editor, part 1: `src/ui.tsx` | T01, T04 | large |
| [T06](2026-11-18-tailwind-t06-editor-screens.md) | Editor, part 2: the large screens | T01, T04 | large |
| [T07](2026-11-18-tailwind-t07-editor-forms.md) | Editor, part 3: navigation, forms and block parts | T01, T04 | large |
| [T08](2026-11-18-tailwind-t08-editor-settings.md) | Editor, part 4: settings and tools | T01, T04 | large |
| [T09](2026-11-18-tailwind-t09-editor-rest.md) | Editor, part 5: the remaining 63 small files | T01, T04 | medium |
| [T10](2026-11-18-tailwind-t10-theme-fn-literals.md) | `theme()` to literal widths | the CSS split, cards and lists steps 1 to 5, T03 (the check accepts the literals) | medium |
| [T11](2026-11-18-tailwind-t11-theme-components.md) | `theme/components/` (253 uses) and the import of the vocabulary | the CSS split, cards and lists steps 1 to 5, T01, T04, T10 | large |
| [T12](2026-11-18-tailwind-t12-theme-pages.md) | `theme/layouts`, `theme/templates`, `defaults`, `site` and the editor preview (78 uses) | the CSS split, cards and lists steps 1 to 5, T01, T04, T11 | medium |
| [T13](2026-11-18-tailwind-t13-prose-own-css.md) | `prose` in our own CSS | the CSS split, cards and lists steps 1 to 5, T01 | medium |
| [T14](2026-11-18-tailwind-t14-reset.md) | Our own reset (Tailwind's preflight) | the CSS split, cards and lists steps 1 to 5, T01 | medium |
| [T15](2026-11-18-tailwind-t15-last-tailwind-names.md) | The last Tailwind-named reads, repointed | the CSS split, cards and lists steps 1 to 5, T01, T05 | small |
| [T16](2026-11-18-tailwind-t16-remove-tailwind.md) | Remove Tailwind and raise the contract to 7 | T05 to T09, T11 to T15 | large (wide, shallow) |
| [T17](2026-11-18-tailwind-t17-permanent-check.md) | The permanent check (the ratchet goes to zero) | T16 | small |

The old numbering of this plan maps as: PR 0 (rename) done; S (the CSS split) is not part of this plan; old PR 1 = T01; PR 2 = T03 and T10; PR 3 = T04, T11 and T12; PR 4 to 6 = T05 to T09; PR 7 = T13; PR 8 = T14; PR 9 = T15 (the type classes of the old PR 9 are done); PR 10 = T16; PR 11 = T17; the migration guide T02 is new.

## 7. Risks

1. **The editor is 86% of the work** and runs beside the 0.19 line, which edits the same screens. Mitigation: slices of about 25 files, each flowed into `0.19` the same day, announced freeze windows (decision 4); `compare-styles` proves each slice.
2. **Silent breakage of installed themes and apps** (§5), size unknown because those repositories were not attached. Mitigation: attach them now and count before the owner chooses the removal line.
3. **Preflight and prose are invisible dependencies.** Mitigation: computed-style comparison on every element, not eyeballing; the prose fixture (T13); the preflight-free proof build (T14).
4. **Cascade order.** Tailwind's `@layer` order and `utilities` winning over `components` is relied on (`base.css:4`, the comment at the end of `blocks.css`); a changed layer order shifts results without any error. Mitigation: the layer list stays `theme, base, components, utilities, fallback` until PR 10, and `compare-styles` runs in every step.
5. **`space-y-*` becoming `gap` is not byte-identical in margins** (the first child, a hidden child, collapsing). Mitigation: the comparison catches it; where the box model differs, the part gets a rule instead of a `mo-stack`.
6. **A second proof tool to build and trust** (`compare-styles`: font loading, animations, `data-reveal` and the motion scripts must be frozen to compare). Mitigation: T01 is its own pull request, proven on a no-op and on one known one-pixel change before anything depends on it.
7. **The CSS split is moving the files under every CSS step.** Batches T10 to T15 edit the same rules the split moves, and `theme()` sits in 28 files. Mitigation: they wait for the split; T10 is a script that can be re-run after a conflict.
8. **Two contract breaks for the same authors, in two releases** (6 with 0.18.0, 7 with 0.18.2, the 0.18.1 fixes release between them; decided by the owner). Mitigation: the guide (T02) is published first, and anything released at 6 is written without utilities, so 7 is a number change for it.
9. **A minor or patch is taken by every site on its own** (`worker/cms-update.js`), so a theme or app that still uses a utility loses its styling at once. Mitigation: the gate (decision 2), `next` on staging for every merge, and the owner's option to point `latest` back.
10. **Nothing starts before 0.18.0 is released,** which only the owner decides; until then the specs wait, and the CSS split and the token work stay in 0.18.0.

Not done here: no code, no build, no check; `morpheme-apps`, `morpheme-staging`, `morpheme-website` not read; web.dev and caniuse not reachable.

## Appendix A: every utility class in markup (class, uses, the CSS Tailwind makes of it)

`consts only` = it appears only in a string constant, not in a class attribute. Regenerated 18 Nov at `f7d4a9ee` (Tailwind 4.3.5, the repo's `@theme` blocks). Replacement: by family, §3.3.

| Class | Uses | CSS |
| :-- | --: | :-- |
| `flex` | 157 | `display: flex;` |
| `text-on-surface-variant` | 133 | `color: var(--mo-sys-color-on-surface-variant);` |
| `items-center` | 71 | `align-items: center;` |
| `shrink-0` | 71 | `flex-shrink: 0;` |
| `text-sm` | 64 | `font-size: var(--text-sm); line-height: var(--tw-leading, var(--text-sm--line-height));` |
| `font-medium` | 59 | `--tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); } @property --tw-font-weight { syntax: "*"; inherits: false;` |
| `min-w-0` | 50 | `min-width: 0px;` |
| `gap-2` | 49 | `gap: calc(var(--spacing) * 2);` |
| `flex-1` | 48 | `flex: 1;` |
| `mb-8` | 45 | `margin-bottom: calc(var(--spacing) * 8);` |
| `px-4` | 45 | `padding-inline: calc(var(--spacing) * 4);` |
| `block` | 44 | `display: block;` |
| `p-4` | 41 | `padding: calc(var(--spacing) * 4);` |
| `flex-wrap` | 39 | `flex-wrap: wrap;` |
| `grid` | 31 | `display: grid;` |
| `truncate` | 31 | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` |
| `w-full` | 27 | `width: 100%;` |
| `flex-col` | 26 | `flex-direction: column;` |
| `gap-3` | 26 | `gap: calc(var(--spacing) * 3);` |
| `mb-6` | 22 | `margin-bottom: calc(var(--spacing) * 6);` |
| `space-y-4` | 22 | `:where(.space-y-4 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 4) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` |
| `space-y-5` | 22 | `:where(.space-y-5 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 5) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` |
| `border-outline-variant` | 20 | `border-color: var(--mo-sys-color-outline-variant);` |
| `space-y-6` | 20 | `:where(.space-y-6 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 6) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` |
| `overflow-hidden` | 19 | `overflow: hidden;` |
| `relative` | 19 | `position: relative;` |
| `items-start` | 18 | `align-items: flex-start;` |
| `mb-2` | 18 | `margin-bottom: calc(var(--spacing) * 2);` |
| `mt-3` | 18 | `margin-top: calc(var(--spacing) * 3);` |
| `justify-center` | 17 | `justify-content: center;` |
| `mt-2` | 16 | `margin-top: calc(var(--spacing) * 2);` |
| `gap-1` | 15 | `gap: var(--spacing);` |
| `gap-4` | 14 | `gap: calc(var(--spacing) * 4);` |
| `gap-6` | 14 | `gap: calc(var(--spacing) * 6);` |
| `justify-end` | 14 | `justify-content: flex-end;` |
| `mt-1` | 14 | `margin-top: var(--spacing);` |
| `object-cover` | 14 | `object-fit: cover;` |
| `hidden` | 13 | `display: none;` |
| `inline-flex` | 13 | `display: inline-flex;` |
| `rounded-full` | 13 | `border-radius: calc(infinity * 1px);` |
| `absolute` | 12 | `position: absolute;` |
| `mb-1` | 12 | `margin-bottom: var(--spacing);` |
| `space-y-2` | 12 | `:where(.space-y-2 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 2) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` |
| `border` | 11 | `border-style: var(--tw-border-style); border-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `mb-3` | 11 | `margin-bottom: calc(var(--spacing) * 3);` |
| `mt-6` | 11 | `margin-top: calc(var(--spacing) * 6);` |
| `pb-2` | 11 | `padding-bottom: calc(var(--spacing) * 2);` |
| `px-2` | 11 | `padding-inline: calc(var(--spacing) * 2);` |
| `text-primary` | 11 | `color: var(--mo-sys-color-primary);` |
| `bg-surface-container-high` | 10 | `background-color: var(--mo-sys-color-surface-container-high);` |
| `mx-auto` | 10 | `margin-inline: auto;` |
| `rounded-xl` | 10 | `border-radius: var(--radius-xl);` |
| `space-y-3` | 10 | `:where(.space-y-3 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 3) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` |
| `mt-4` | 9 | `margin-top: calc(var(--spacing) * 4);` |
| `px-3` | 9 | `padding-inline: calc(var(--spacing) * 3);` |
| `text-title-large` | 9 | `font-size: var(--mo-sys-typescale-title-large-size); line-height: var(--tw-leading, var(--mo-sys-typescale-title-large-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typescal` |
| `mb-4` | 8 | `margin-bottom: calc(var(--spacing) * 4);` |
| `medium:grid-cols-2` | 8 | `@media (width >= 37.5rem) { .medium:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }` |
| `px-1` | 8 | `padding-inline: var(--spacing);` |
| `py-2` | 8 | `padding-block: calc(var(--spacing) * 2);` |
| `size-full` | 8 | `width: 100%; height: 100%;` |
| `sr-only` | 8 | `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border-width: 0;` |
| `focus:outline-none` | 7 | `--tw-outline-style: none; outline-style: none;` |
| `font-semibold` | 7 | `--tw-font-weight: var(--font-weight-semibold); font-weight: var(--font-weight-semibold); } @property --tw-font-weight { syntax: "*"; inherits: false;` |
| `gap-1.5` | 7 | `gap: calc(var(--spacing) * 1.5);` |
| `max-w-full` | 7 | `max-width: 100%;` |
| `medium:px-6` | 7 | `@media (width >= 37.5rem) { .medium:px-6 { padding-inline: calc(var(--spacing) * 6); }` |
| `min-h-0` | 7 | `min-height: 0px;` |
| `mx-5` | 7 | `margin-inline: calc(var(--spacing) * 5);` |
| `py-3` | 7 | `padding-block: calc(var(--spacing) * 3);` |
| `sticky` | 7 | `position: sticky;` |
| `-mt-2` | 6 | `margin-top: calc(var(--spacing) * -2);` |
| `bg-primary` | 6 | `background-color: var(--mo-sys-color-primary);` |
| `border-t` | 6 | `border-top-style: var(--tw-border-style); border-top-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `break-words` | 6 | `overflow-wrap: break-word;` |
| `contents` | 6 | `display: contents;` |
| `gap-8` | 6 | `gap: calc(var(--spacing) * 8);` |
| `h-16` | 6 | `height: calc(var(--spacing) * 16);` |
| `items-end` | 6 | `align-items: flex-end;` |
| `max-w-sm` | 6 | `max-width: var(--container-sm);` |
| `overflow-y-auto` | 6 | `overflow-y: auto;` |
| `p-2` | 6 | `padding: calc(var(--spacing) * 2);` |
| `pt-8` | 6 | `padding-top: calc(var(--spacing) * 8);` |
| `rounded-lg` | 6 | `border-radius: var(--radius-lg);` |
| `space-y-1` | 6 | `:where(.space-y-1 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(var(--spacing) * var(--tw-space-y-reverse)); margin-block-end: calc(var(--spacing) * calc(1 - var(-` |
| `space-y-10` | 6 | `:where(.space-y-10 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 10) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing)` |
| `text-on-surface` | 6 | `color: var(--mo-sys-color-on-surface);` |
| `text-xs` | 6 | `font-size: var(--text-xs); line-height: var(--tw-leading, var(--text-xs--line-height));` |
| `w-[20.5rem]` | 6 | `width: 20.5rem;` |
| `bg-surface-container-lowest` | 5 | `background-color: var(--mo-sys-color-surface-container-lowest);` |
| `hover:text-primary` | 5 | `@media (hover: hover) { .hover:text-primary:hover { color: var(--mo-sys-color-primary); }` |
| `max-w-none` | 5 | `max-width: none;` |
| `mt-auto` | 5 | `margin-top: auto;` |
| `pr-1.5` | 5 | `padding-right: calc(var(--spacing) * 1.5);` |
| `rounded-(--mo-sys-block-radius-small)` | 5 | `border-radius: var(--mo-sys-block-radius-small);` |
| `rounded-(--mo-sys-block-radius)` | 5 | `border-radius: var(--mo-sys-block-radius);` |
| `rounded-2xl` | 5 | `border-radius: var(--radius-2xl);` |
| `tabular-nums` | 5 | `--tw-numeric-spacing: tabular-nums; font-variant-numeric: var(--tw-ordinal, ) var(--tw-slashed-zero, ) var(--tw-numeric-figure, ) var(--tw-numeric-spacing, ) var(--tw-numeric-fraction, ); } ` |
| `text-base` | 5 | `font-size: var(--text-base); line-height: var(--tw-leading, var(--text-base--line-height));` |
| `text-body-large` | 5 | `font-size: var(--mo-sys-typescale-body-large-size); line-height: var(--tw-leading, var(--mo-sys-typescale-body-large-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typescale-` |
| `text-center` | 5 | `text-align: center;` |
| `top-0` | 5 | `top: 0px;` |
| `transition-transform` | 5 | `transition-property: transform, translate, scale, rotate; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-duration, var(-` |
| `break-all` | 4 | `word-break: break-all;` |
| `expanded:grid-cols-2` | 4 | `@media (width >= 52.5rem) { .expanded:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }` |
| `focus-visible:outline-none` | 4 | `--tw-outline-style: none; outline-style: none;` |
| `font-mono` | 4 | `font-family: var(--font-mono);` |
| `gap-x-2` | 4 | `column-gap: calc(var(--spacing) * 2);` |
| `hover:underline` | 4 | `@media (hover: hover) { .hover:underline:hover { text-decoration-line: underline; }` |
| `inset-0` | 4 | `inset: 0px;` |
| `line-clamp-2` | 4 | `overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;` |
| `m-0` | 4 | `margin: 0px;` |
| `medium:flex` | 4 | `@media (width >= 37.5rem) { .medium:flex { display: flex; }` |
| `ml-auto` | 4 | `margin-left: auto;` |
| `mt-12` | 4 | `margin-top: calc(var(--spacing) * 12);` |
| `mt-8` | 4 | `margin-top: calc(var(--spacing) * 8);` |
| `pt-[env(safe-area-inset-top)]` | 4 | `padding-top: env(safe-area-inset-top);` |
| `pt-1` | 4 | `padding-top: var(--spacing);` |
| `pt-4` | 4 | `padding-top: calc(var(--spacing) * 4);` |
| `px-(--mo-sys-grid-margin)` | 4 | `padding-inline: var(--mo-sys-grid-margin);` |
| `rounded-(--mo-comp-theme-picture-radius)` | 4 | `border-radius: var(--mo-comp-theme-picture-radius);` |
| `size-10` | 4 | `width: calc(var(--spacing) * 10); height: calc(var(--spacing) * 10);` |
| `transition-colors` | 4 | `transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to; transition-timing-fun` |
| `z-10` | 4 | `z-index: 10;` |
| `[--mo-comp-card-padding:1rem_0_0.5rem]` | 3 | `--mo-comp-card-padding: 1rem 0 0.5rem;` |
| `aspect-[16/10]` | 3 | `aspect-ratio: 16/10;` |
| `aspect-[3/2]` | 3 | `aspect-ratio: 3/2;` |
| `aspect-square` | 3 | `aspect-ratio: 1 / 1;` |
| `border-b` | 3 | `border-bottom-style: var(--tw-border-style); border-bottom-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `expanded:hidden` | 3 | `@media (width >= 52.5rem) { .expanded:hidden { display: none; }` |
| `focus-visible:ring-2` | 3 | `--tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), va` |
| `focus-visible:ring-primary` | 3 | `--tw-ring-color: var(--mo-sys-color-primary);` |
| `gap-10` | 3 | `gap: calc(var(--spacing) * 10);` |
| `gap-2.5` | 3 | `gap: calc(var(--spacing) * 2.5);` |
| `gap-5` | 3 | `gap: calc(var(--spacing) * 5);` |
| `gap-x-6` | 3 | `column-gap: calc(var(--spacing) * 6);` |
| `grid-cols-2` | 3 | `grid-template-columns: repeat(2, minmax(0, 1fr));` |
| `h-80` | 3 | `height: calc(var(--spacing) * 80);` |
| `inline-block` | 3 | `display: inline-block;` |
| `justify-between` | 3 | `justify-content: space-between;` |
| `last:mb-0` | 3 | `margin-bottom: 0px;` |
| `max-w-[22ch]` | 3 | `max-width: 22ch;` |
| `max-w-[52ch]` | 3 | `max-width: 52ch;` |
| `max-w-md` | 3 | `max-width: var(--container-md);` |
| `medium:gap-6` | 3 | `@media (width >= 37.5rem) { .medium:gap-6 { gap: calc(var(--spacing) * 6); }` |
| `medium:hidden` | 3 | `@media (width >= 37.5rem) { .medium:hidden { display: none; }` |
| `medium:mt-12` | 3 | `@media (width >= 37.5rem) { .medium:mt-12 { margin-top: calc(var(--spacing) * 12); }` |
| `medium:mt-16` | 3 | `@media (width >= 37.5rem) { .medium:mt-16 { margin-top: calc(var(--spacing) * 16); }` |
| `medium:pt-14` | 3 | `@media (width >= 37.5rem) { .medium:pt-14 { padding-top: calc(var(--spacing) * 14); }` |
| `min-h-dvh` | 3 | `min-height: 100dvh;` |
| `overflow-x-auto` | 3 | `overflow-x: auto;` |
| `p-6` | 3 | `padding: calc(var(--spacing) * 6);` |
| `pb-[env(safe-area-inset-bottom)]` | 3 | `padding-bottom: env(safe-area-inset-bottom);` |
| `pb-4` | 3 | `padding-bottom: calc(var(--spacing) * 4);` |
| `place-items-center` | 3 | `place-items: center;` |
| `ps-4` | 3 | `padding-inline-start: calc(var(--spacing) * 4);` |
| `pt-2` | 3 | `padding-top: calc(var(--spacing) * 2);` |
| `py-4` | 3 | `padding-block: calc(var(--spacing) * 4);` |
| `rounded-panel` | 3 | `border-radius: var(--mo-sys-radius);` |
| `self-start` | 3 | `align-self: flex-start;` |
| `size-12` | 3 | `width: calc(var(--spacing) * 12); height: calc(var(--spacing) * 12);` |
| `size-16` | 3 | `width: calc(var(--spacing) * 16); height: calc(var(--spacing) * 16);` |
| `size-6` | 3 | `width: calc(var(--spacing) * 6); height: calc(var(--spacing) * 6);` |
| `size-7` | 3 | `width: calc(var(--spacing) * 7); height: calc(var(--spacing) * 7);` |
| `size-8` | 3 | `width: calc(var(--spacing) * 8); height: calc(var(--spacing) * 8);` |
| `text-(--mo-comp-google-text)` | 3 | `color: var(--mo-comp-google-text);` |
| `text-2xl` | 3 | `font-size: var(--text-2xl); line-height: var(--tw-leading, var(--text-2xl--line-height));` |
| `touch-none` | 3 | `touch-action: none;` |
| `-mx-3` | 2 | `margin-inline: calc(var(--spacing) * -3);` |
| `-mx-4` | 2 | `margin-inline: calc(var(--spacing) * -4);` |
| `-my-3` | 2 | `margin-block: calc(var(--spacing) * -3);` |
| `-rotate-90` | 2 | `rotate: calc(90deg * -1);` |
| `[--mo-comp-card-padding:1rem]` | 2 | `--mo-comp-card-padding: 1rem;` |
| `[--mo-comp-grid-columns:2]` | 2 | `--mo-comp-grid-columns: 2;` |
| `[&>.text-section]:mt-0` | 2 | `.[&>.text-section]:mt-0 > .text-section { margin-top: 0px;` |
| `[&>p:first-child]:mo-type-lead` | 2 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` |
| `[overflow-wrap:anywhere]` | 2 | `overflow-wrap: anywhere;` |
| `[text-box:trim-both_cap_alphabetic]` | 2 | `text-box: trim-both cap alphabetic;` |
| `bg-outline-variant/40` | 2 | `background-color: color-mix(in oklab, var(--mo-sys-color-outline-variant) 40%, transparent);` |
| `bg-surface-container` | 2 | `background-color: var(--mo-sys-color-surface-container);` |
| `bg-surface-container-low` | 2 | `background-color: var(--mo-sys-color-surface-container-low);` |
| `bg-white` | 2 | `background-color: var(--color-white);` |
| `border-[1.5px]` | 2 | `border-style: var(--tw-border-style); border-width: 1.5px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-0` | 2 | `border-style: var(--tw-border-style); border-width: 0px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `bottom-0` | 2 | `bottom: 0px;` |
| `bottom-3` | 2 | `bottom: calc(var(--spacing) * 3);` |
| `expanded:block` | 2 | `@media (width >= 52.5rem) { .expanded:block { display: block; }` |
| `expanded:col-span-5` | 2 | `@media (width >= 52.5rem) { .expanded:col-span-5 { grid-column: span 5 / span 5; }` |
| `expanded:grid-cols-12` | 2 | `@media (width >= 52.5rem) { .expanded:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }` |
| `grid-cols-[repeat(auto-fill,minmax(3rem,1fr))]` | 2 | `grid-template-columns: repeat(auto-fill,minmax(3rem,1fr));` |
| `group-hover:text-primary` | 2 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:text-primary) { color: var(--mo-sys-color-primary); }` |
| `h-10` | 2 | `height: calc(var(--spacing) * 10);` |
| `h-12` | 2 | `height: calc(var(--spacing) * 12);` |
| `h-auto` | 2 | `height: auto;` |
| `h-dvh` | 2 | `height: 100dvh;` |
| `h-full` | 2 | `height: 100%;` |
| `hover:bg-surface-container-high` | 2 | `@media (hover: hover) { .hover:bg-surface-container-high:hover { background-color: var(--mo-sys-color-surface-container-high); }` |
| `large:block` | 2 | `@media (width >= 75rem) { .large:block { display: block; }` |
| `leading-snug` | 2 | `--tw-leading: var(--leading-snug); line-height: var(--leading-snug); } @property --tw-leading { syntax: "*"; inherits: false;` |
| `leading-tight` | 2 | `--tw-leading: var(--leading-tight); line-height: var(--leading-tight); } @property --tw-leading { syntax: "*"; inherits: false;` |
| `left-0` | 2 | `left: 0px;` |
| `max-h-[45dvh]` | 2 | `max-height: 45dvh;` |
| `max-w-48` | 2 | `max-width: calc(var(--spacing) * 48);` |
| `max-w-prose` | 2 | `max-width: 65ch;` |
| `max-w-xs` | 2 | `max-width: var(--container-xs);` |
| `medium:aspect-[16/9]` | 2 | `@media (width >= 37.5rem) { .medium:aspect-[16/9] { aspect-ratio: 16/9; }` |
| `medium:block` | 2 | `@media (width >= 37.5rem) { .medium:block { display: block; }` |
| `medium:gap-3` | 2 | `@media (width >= 37.5rem) { .medium:gap-3 { gap: calc(var(--spacing) * 3); }` |
| `medium:items-start` | 2 | `@media (width >= 37.5rem) { .medium:items-start { align-items: flex-start; }` |
| `medium:pt-16` | 2 | `@media (width >= 37.5rem) { .medium:pt-16 { padding-top: calc(var(--spacing) * 16); }` |
| `medium:w-auto` | 2 | `@media (width >= 37.5rem) { .medium:w-auto { width: auto; }` |
| `min-h-9` | 2 | `min-height: calc(var(--spacing) * 9);` |
| `motion-reduce:transition-none` | 2 | `@media (prefers-reduced-motion: reduce) { .motion-reduce:transition-none { transition-property: none; }` |
| `mr-auto` | 2 | `margin-right: auto;` |
| `mt-10` | 2 | `margin-top: calc(var(--spacing) * 10);` |
| `not-first:mt-8` | 2 | `margin-top: calc(var(--spacing) * 8);` |
| `object-contain` | 2 | `object-fit: contain;` |
| `outline-none` | 2 | `--tw-outline-style: none; outline-style: none;` |
| `p-0` | 2 | `padding: 0px;` |
| `p-3` | 2 | `padding: calc(var(--spacing) * 3);` |
| `p-5` | 2 | `padding: calc(var(--spacing) * 5);` |
| `pb-1` | 2 | `padding-bottom: var(--spacing);` |
| `pe-14` | 2 | `padding-inline-end: calc(var(--spacing) * 14);` |
| `pe-4` | 2 | `padding-inline-end: calc(var(--spacing) * 4);` |
| `pt-1.5` | 2 | `padding-top: calc(var(--spacing) * 1.5);` |
| `pt-3` | 2 | `padding-top: calc(var(--spacing) * 3);` |
| `pt-52` | 2 | `padding-top: calc(var(--spacing) * 52);` |
| `pt-6` | 2 | `padding-top: calc(var(--spacing) * 6);` |
| `px-5` | 2 | `padding-inline: calc(var(--spacing) * 5);` |
| `px-6` | 2 | `padding-inline: calc(var(--spacing) * 6);` |
| `py-[1.125rem]` | 2 | `padding-block: 1.125rem;` |
| `scroll-mt-24` | 2 | `scroll-margin-top: calc(var(--spacing) * 24);` |
| `select-none` | 2 | `-webkit-user-select: none; user-select: none;` |
| `shadow-soft` | 2 | `--tw-shadow: var(--mo-sys-panel-shadow); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); } @property -` |
| `size-11` | 2 | `width: calc(var(--spacing) * 11); height: calc(var(--spacing) * 11);` |
| `size-20` | 2 | `width: calc(var(--spacing) * 20); height: calc(var(--spacing) * 20);` |
| `top-2` | 2 | `top: calc(var(--spacing) * 2);` |
| `tracking-tight` | 2 | `--tw-tracking: var(--tracking-tight); letter-spacing: var(--tracking-tight); } @property --tw-tracking { syntax: "*"; inherits: false;` |
| `transition-opacity` | 2 | `transition-property: opacity; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-duration, var(--default-transition-duration` |
| `underline` | 2 | `text-decoration-line: underline;` |
| `uppercase` | 2 | `text-transform: uppercase;` |
| `w-[36rem]` | 2 | `width: 36rem;` |
| `w-9` | 2 | `width: calc(var(--spacing) * 9);` |
| `-me-[calc((var(--mo-comp-icon-button-width)-1.5rem)/2)]` | 1 | `margin-inline-end: calc(calc((var(--mo-comp-icon-button-width) - 1.5rem) / 2) * -1);` |
| `-ml-2` | 1 | `margin-left: calc(var(--spacing) * -2);` |
| `-ms-2.5` | 1 | `margin-inline-start: calc(var(--spacing) * -2.5);` |
| `-mx-6` | 1 | `margin-inline: calc(var(--spacing) * -6);` |
| `-outline-offset-2` | 1 | `outline-offset: calc(2px * -1);` |
| `[--mo-comp-card-padding:0]` | 1 | `--mo-comp-card-padding: 0;` |
| `[--mo-comp-elevated-card-container-elevation:var(--mo-sys-elevation-level1-shadow)]` | 1 | `--mo-comp-elevated-card-container-elevation: var(--mo-sys-elevation-level1-shadow);` |
| `[-webkit-touch-callout:none]` | 1 | `-webkit-touch-callout: none;` |
| `[[data-fold-section]+&]:mt-0` | 1 | `[data-fold-section] + .[[data-fold-section]+&]:mt-0 { margin-top: 0px;` |
| `[@media(width<37.5rem)]:my-0` | 1 | `@media (width<37.5rem) { .[@media(width<37.5rem)]:my-0 { margin-block: 0px; }` |
| `[&_.navigation-rail-items]:flex-1` | 1 | `.[&_.navigation-rail-items]:flex-1 .navigation-rail-items { flex: 1;` |
| `[&:has(+[data-fold-section])]:mb-0` | 1 | `.[&:has(+[data-fold-section])]:mb-0:has( + [data-fold-section]) { margin-bottom: 0px;` |
| `[&:not(:has([data-part]))]:hidden` | 1 | `display: none;` |
| `[&:not([data-tooltip-open])>.tooltip]:invisible` | 1 | `.[&:not([data-tooltip-open])>.tooltip]:invisible:not([data-tooltip-open]) > .tooltip { visibility: hidden;` |
| `[&:not([data-tooltip-open])>.tooltip]:opacity-0` | 1 | `.[&:not([data-tooltip-open])>.tooltip]:opacity-0:not([data-tooltip-open]) > .tooltip { opacity: 0%;` |
| `[&>.tooltip]:bottom-auto` | 1 | `.[&>.tooltip]:bottom-auto > .tooltip { bottom: auto;` |
| `[&>.tooltip]:end-0` | 1 | `.[&>.tooltip]:end-0 > .tooltip { inset-inline-end: calc(var(--spacing) * 0);` |
| `[&>.tooltip]:max-w-60` | 1 | `.[&>.tooltip]:max-w-60 > .tooltip { max-width: calc(var(--spacing) * 60);` |
| `[&>.tooltip]:start-auto` | 1 | `.[&>.tooltip]:start-auto > .tooltip { inset-inline-start: auto;` |
| `[&>.tooltip]:top-[calc(100%-0.5rem)]` | 1 | `.[&>.tooltip]:top-[calc(100%-0.5rem)] > .tooltip { top: calc(100% - 0.5rem);` |
| `[&>svg]:duration-(--mo-sys-motion-spring-default-spatial-duration)` | 1 | `.[&>svg]:duration-(--mo-sys-motion-spring-default-spatial-duration) > svg { --tw-duration: var(--mo-sys-motion-spring-default-spatial-duration); transition-duration: var(--mo-sys-motion-spri` |
| `[&>svg]:ease-(--motion-ease)` | 1 | `.[&>svg]:ease-(--motion-ease) > svg { --tw-ease: var(--motion-ease); transition-timing-function: var(--motion-ease); } @property --tw-ease { syntax: "*"; inherits: false;` |
| `[&>svg]:transition-transform` | 1 | `.[&>svg]:transition-transform > svg { transition-property: transform, translate, scale, rotate; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transit` |
| `[contain:layout]` | 1 | `contain: layout;` |
| `[container-type:size]` | 1 | `container-type: size;` |
| `[mask-position:center]` | 1 | `mask-position: center;` |
| `[mask-repeat:no-repeat]` | 1 | `mask-repeat: no-repeat;` |
| `[mask-size:contain]` | 1 | `mask-size: contain;` |
| `[scrollbar-width:none]` | 1 | `scrollbar-width: none;` |
| `[transition:scale_var(--mo-sys-motion-spring-slow-spatial)]` | 1 | `transition: scale var(--mo-sys-motion-spring-slow-spatial);` |
| `*:flex-1` | 1 | `:is(.*:flex-1 > *) { flex: 1;` |
| `*:min-w-48` | 1 | `:is(.*:min-w-48 > *) { min-width: calc(var(--spacing) * 48);` |
| `align-middle` | 1 | `vertical-align: middle;` |
| `aria-[current=location]:text-primary` | 1 | `color: var(--mo-sys-color-primary);` |
| `aspect-[1.91/1]` | 1 | `aspect-ratio: 1.91/1;` |
| `aspect-[3/4]` | 1 | `aspect-ratio: 3/4;` |
| `aspect-[4/3]` | 1 | `aspect-ratio: 4/3;` |
| `basis-full` | 1 | `flex-basis: 100%;` |
| `bg-(--mo-comp-editor-status-good)` | 1 | `background-color: var(--mo-comp-editor-status-good);` |
| `bg-(--mo-comp-google-background)` | 1 | `background-color: var(--mo-comp-google-background);` |
| `bg-(--mo-comp-google-icon-fill)` | 1 | `background-color: var(--mo-comp-google-icon-fill);` |
| `bg-(--mo-comp-navigation-rail-surface,var(--mo-sys-color-surface))` | 1 | `background-color: var(--mo-comp-navigation-rail-surface,var(--mo-sys-color-surface));` |
| `bg-center` | 1 | `background-position: center;` |
| `bg-cover` | 1 | `background-size: cover;` |
| `bg-outline` | 1 | `background-color: var(--mo-sys-color-outline);` |
| `bg-outline-variant` | 1 | `background-color: var(--mo-sys-color-outline-variant);` |
| `bg-outline-variant/50` | 1 | `background-color: color-mix(in oklab, var(--mo-sys-color-outline-variant) 50%, transparent);` |
| `bg-secondary-container` | 1 | `background-color: var(--mo-sys-color-secondary-container);` |
| `bg-surface` | 1 | `background-color: var(--mo-sys-color-surface);` |
| `bg-tertiary-container` | 1 | `background-color: var(--mo-sys-color-tertiary-container);` |
| `bg-transparent` | 1 | `background-color: transparent;` |
| `border-(--mo-comp-google-icon-ring)` | 1 | `border-color: var(--mo-comp-google-icon-ring);` |
| `border-current` | 1 | `border-color: currentcolor;` |
| `border-dashed` | 1 | `--tw-border-style: dashed; border-style: dashed;` |
| `border-l-2` | 1 | `border-left-style: var(--tw-border-style); border-left-width: 2px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-primary` | 1 | `border-color: var(--mo-sys-color-primary);` |
| `border-t-2` | 1 | `border-top-style: var(--tw-border-style); border-top-width: 2px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-x` | 1 | `border-inline-style: var(--tw-border-style); border-inline-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `cursor-ew-resize` | 1 | `cursor: ew-resize;` |
| `cursor-grab` | 1 | `cursor: grab;` |
| `data-[clearance=true]:mb-[var(--mo-comp-fab-room)]` | 1 | `margin-bottom: var(--mo-comp-fab-room);` |
| `disabled:opacity-60` | 1 | `opacity: 60%;` |
| `duration-(--mo-sys-motion-spring-default-effects-duration)` | 1 | `--tw-duration: var(--mo-sys-motion-spring-default-effects-duration); transition-duration: var(--mo-sys-motion-spring-default-effects-duration); } @property --tw-duration { syntax: "*"; inher` |
| `duration-[1200ms]` | 1 | `--tw-duration: 1200ms; transition-duration: 1200ms; } @property --tw-duration { syntax: "*"; inherits: false;` |
| `ease-(--motion-ease)` | 1 | `--tw-ease: var(--motion-ease); transition-timing-function: var(--motion-ease); } @property --tw-ease { syntax: "*"; inherits: false;` |
| `ease-out` | 1 | `--tw-ease: var(--ease-out); transition-timing-function: var(--ease-out); } @property --tw-ease { syntax: "*"; inherits: false;` |
| `empty:hidden` | 1 | `display: none;` |
| `end-1` | 1 | `inset-inline-end: calc(var(--spacing) * 1);` |
| `end-2` | 1 | `inset-inline-end: calc(var(--spacing) * 2);` |
| `expanded:col-span-12` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-12 { grid-column: span 12 / span 12; }` |
| `expanded:col-span-3` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-3 { grid-column: span 3 / span 3; }` |
| `expanded:col-span-4` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-4 { grid-column: span 4 / span 4; }` |
| `expanded:col-span-7` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-7 { grid-column: span 7 / span 7; }` |
| `expanded:flex` | 1 | `@media (width >= 52.5rem) { .expanded:flex { display: flex; }` |
| `expanded:gap-2` | 1 | `@media (width >= 52.5rem) { .expanded:gap-2 { gap: calc(var(--spacing) * 2); }` |
| `expanded:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]` | 1 | `@media (width >= 52.5rem) { .expanded:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] { grid-template-columns: repeat(auto-fill,minmax(9rem,1fr)); }` |
| `expanded:inline` | 1 | `@media (width >= 52.5rem) { .expanded:inline { display: inline; }` |
| `expanded:ml-auto` | 1 | `@media (width >= 52.5rem) { .expanded:ml-auto { margin-left: auto; }` |
| `expanded:shrink-0` | 1 | `@media (width >= 52.5rem) { .expanded:shrink-0 { flex-shrink: 0; }` |
| `expanded:text-right` | 1 | `@media (width >= 52.5rem) { .expanded:text-right { text-align: right; }` |
| `fill-(--mo-comp-editor-status-bad)` | 1 | `fill: var(--mo-comp-editor-status-bad);` |
| `first-of-type:border-t-0` | 1 | `border-top-style: var(--tw-border-style); border-top-width: 0px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `first-of-type:pt-0` | 1 | `padding-top: 0px;` |
| `fixed` | 1 | `position: fixed;` |
| `focus-visible:outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `focus-visible:outline-offset-[-8px]` | 1 | `outline-offset: -8px;` |
| `focus-visible:ring-offset-2` | 1 | `--tw-ring-offset-width: 2px; --tw-ring-offset-shadow: var(--tw-ring-inset, ) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);` |
| `focus-visible:underline` | 1 | `text-decoration-line: underline;` |
| `focus:bg-primary` | 1 | `background-color: var(--mo-sys-color-primary);` |
| `focus:fixed` | 1 | `position: fixed;` |
| `focus:left-4` | 1 | `left: calc(var(--spacing) * 4);` |
| `focus:not-sr-only` | 1 | `position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip-path: none; white-space: normal;` |
| `focus:px-4` | 1 | `padding-inline: calc(var(--spacing) * 4);` |
| `focus:py-2` | 1 | `padding-block: calc(var(--spacing) * 2);` |
| `focus:rounded-full` | 1 | `border-radius: calc(infinity * 1px);` |
| `focus:text-on-primary` | 1 | `color: var(--mo-sys-color-on-primary);` |
| `focus:top-4` | 1 | `top: calc(var(--spacing) * 4);` |
| `focus:z-50` | 1 | `z-index: 50;` |
| `font-[arial,sans-serif]` | 1 | `font-family: arial,sans-serif;` |
| `font-bold` | 1 | `--tw-font-weight: var(--font-weight-bold); font-weight: var(--font-weight-bold); } @property --tw-font-weight { syntax: "*"; inherits: false;` |
| `font-sans` | 1 | `font-family: 'Roboto Variable', Roboto, ui-sans-serif, system-ui, sans-serif;` |
| `gap-(--mo-sys-grid-gutter)` | 1 | `gap: var(--mo-sys-grid-gutter);` |
| `gap-0.5` | 1 | `gap: calc(var(--spacing) * 0.5);` |
| `gap-y-1` | 1 | `row-gap: var(--spacing);` |
| `gap-y-2` | 1 | `row-gap: calc(var(--spacing) * 2);` |
| `gap-y-4` | 1 | `row-gap: calc(var(--spacing) * 4);` |
| `gap-y-6` | 1 | `row-gap: calc(var(--spacing) * 6);` |
| `grid-cols-3` | 1 | `grid-template-columns: repeat(3, minmax(0, 1fr));` |
| `grid-cols-4` | 1 | `grid-template-columns: repeat(4, minmax(0, 1fr));` |
| `grid-cols-6` | 1 | `grid-template-columns: repeat(6, minmax(0, 1fr));` |
| `group-data-[open]:opacity-100` | 1 | `:is(:where(.group)[data-open] .group-data-[open]:opacity-100) { opacity: 100%;` |
| `group-data-[open]:visible` | 1 | `:is(:where(.group)[data-open] .group-data-[open]:visible) { visibility: visible;` |
| `group-focus-visible:bg-primary` | 1 | `:is(:where(.group):focus-visible .group-focus-visible:bg-primary) { background-color: var(--mo-sys-color-primary);` |
| `group-hover:bg-primary` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:bg-primary) { background-color: var(--mo-sys-color-primary); }` |
| `group-hover:opacity-100` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:opacity-100) { opacity: 100%; }` |
| `group-hover:scale-[1.03]` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:scale-[1.03]) { scale: 1.03; }` |
| `group-hover:translate-x-0.5` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:translate-x-0.5) { --tw-translate-x: calc(var(--spacing) * 0.5); translate: var(--tw-translate-x) var(--tw-translate-y); } } @pr` |
| `group-hover:visible` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:visible) { visibility: visible; }` |
| `h-11` | 1 | `height: calc(var(--spacing) * 11);` |
| `h-160` | 1 | `height: calc(var(--spacing) * 160);` |
| `h-4` | 1 | `height: calc(var(--spacing) * 4);` |
| `h-48` | 1 | `height: calc(var(--spacing) * 48);` |
| `h-8` | 1 | `height: calc(var(--spacing) * 8);` |
| `h-9` | 1 | `height: calc(var(--spacing) * 9);` |
| `has-focus-visible:outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `has-focus-visible:outline-offset-2` | 1 | `outline-offset: 2px;` |
| `has-focus-visible:outline-primary` | 1 | `outline-color: var(--mo-sys-color-primary);` |
| `hover:scale-105` | 1 | `@media (hover: hover) { .hover:scale-105:hover { --tw-scale-x: 105%; --tw-scale-y: 105%; --tw-scale-z: 105%; scale: var(--tw-scale-x) var(--tw-scale-y); } } @property --tw-scale-x { syntax: ` |
| `hover:text-on-surface` | 1 | `@media (hover: hover) { .hover:text-on-surface:hover { color: var(--mo-sys-color-on-surface); }` |
| `inset-x-3` | 1 | `inset-inline: calc(var(--spacing) * 3);` |
| `invisible` | 1 | `visibility: hidden;` |
| `large:absolute` | 1 | `@media (width >= 75rem) { .large:absolute { position: absolute; }` |
| `large:col-start-1` | 1 | `@media (width >= 75rem) { .large:col-start-1 { grid-column-start: 1; }` |
| `large:end-0` | 1 | `@media (width >= 75rem) { .large:end-0 { inset-inline-end: calc(var(--spacing) * 0); }` |
| `large:group-data-crowded/header:hidden` | 1 | `@media (width >= 75rem) { :is(:where(.group/header)[data-crowded] .large:group-data-crowded/header:hidden) { display: none; }` |
| `large:inset-y-0` | 1 | `@media (width >= 75rem) { .large:inset-y-0 { inset-block: 0px; }` |
| `large:mt-(--mo-sys-section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:mt-(--mo-sys-section-pane-gap) { margin-top: var(--mo-sys-section-pane-gap); }` |
| `large:pe-(--mo-sys-section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:pe-(--mo-sys-section-pane-gap) { padding-inline-end: var(--mo-sys-section-pane-gap); }` |
| `large:row-span-2` | 1 | `@media (width >= 75rem) { .large:row-span-2 { grid-row: span 2 / span 2; }` |
| `large:row-start-1` | 1 | `@media (width >= 75rem) { .large:row-start-1 { grid-row-start: 1; }` |
| `large:shrink-0` | 1 | `@media (width >= 75rem) { .large:shrink-0 { flex-shrink: 0; }` |
| `large:sticky` | 1 | `@media (width >= 75rem) { .large:sticky { position: sticky; }` |
| `large:top-(--mo-sys-section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:top-(--mo-sys-section-pane-gap) { top: var(--mo-sys-section-pane-gap); }` |
| `large:w-(--mo-sys-section-pane-width)` | 1 | `@media (width >= 75rem) { .large:w-(--mo-sys-section-pane-width) { width: var(--mo-sys-section-pane-width); }` |
| `large:whitespace-nowrap` | 1 | `@media (width >= 75rem) { .large:whitespace-nowrap { white-space: nowrap; }` |
| `large:z-10` | 1 | `@media (width >= 75rem) { .large:z-10 { z-index: 10; }` |
| `leading-[22px]` | 1 | `--tw-leading: 22px; line-height: 22px; } @property --tw-leading { syntax: "*"; inherits: false;` |
| `leading-[26px]` | 1 | `--tw-leading: 26px; line-height: 26px; } @property --tw-leading { syntax: "*"; inherits: false;` |
| `leading-[var(--mo-sys-typescale-headline-small-line-height)]` | 1 | `--tw-leading: var(--mo-sys-typescale-headline-small-line-height); line-height: var(--mo-sys-typescale-headline-small-line-height); } @property --tw-leading { syntax: "*"; inherits: false;` |
| `leading-none` | 1 | `--tw-leading: 1; line-height: 1; } @property --tw-leading { syntax: "*"; inherits: false;` |
| `left-1/2` | 1 | `left: calc(1 / 2 * 100%);` |
| `left-4` | 1 | `left: calc(var(--spacing) * 4);` |
| `list-disc` | 1 | `list-style-type: disc;` |
| `list-none` | 1 | `list-style-type: none;` |
| `marker:text-primary` | 1 | `.marker:text-primary ::marker { color: var(--mo-sys-color-primary); } .marker:text-primary::marker { color: var(--mo-sys-color-primary); } .marker:text-primary ::-webkit-details-marker { col` |
| `max-expanded:sr-only` | 1 | `@media (width < 52.5rem) { .max-expanded:sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border` |
| `max-h-[50dvh]` | 1 | `max-height: 50dvh;` |
| `max-h-[calc(100dvh-1.5rem)]` | 1 | `max-height: calc(100dvh - 1.5rem);` |
| `max-h-[calc(100dvh-2*var(--mo-sys-section-pane-gap))]` | 1 | `max-height: calc(100dvh - 2 * var(--mo-sys-section-pane-gap));` |
| `max-h-[calc(100dvh-3rem)]` | 1 | `max-height: calc(100dvh - 3rem);` |
| `max-h-24` | 1 | `max-height: calc(var(--spacing) * 24);` |
| `max-medium:hidden` | 1 | `@media (width < 37.5rem) { .max-medium:hidden { display: none; }` |
| `max-w-[18ch]` | 1 | `max-width: 18ch;` |
| `max-w-[45rem]` | 1 | `max-width: 45rem;` |
| `max-w-[500px]` | 1 | `max-width: 500px;` |
| `max-w-[75ch]` | 1 | `max-width: 75ch;` |
| `max-w-[var(--mo-sys-block-text-measure-max)]` | 1 | `max-width: var(--mo-sys-block-text-measure-max);` |
| `max-w-2xl` | 1 | `max-width: var(--container-2xl);` |
| `max-w-3xl` | 1 | `max-width: var(--container-3xl);` |
| `max-w-5xl` | 1 | `max-width: var(--container-5xl);` |
| `max-w-64` | 1 | `max-width: calc(var(--spacing) * 64);` |
| `max-w-6xl` | 1 | `max-width: var(--container-6xl);` |
| `max-w-72` | 1 | `max-width: calc(var(--spacing) * 72);` |
| `max-w-80` | 1 | `max-width: calc(var(--spacing) * 80);` |
| `medium:-mx-6` | 1 | `@media (width >= 37.5rem) { .medium:-mx-6 { margin-inline: calc(var(--spacing) * -6); }` |
| `medium:aspect-auto` | 1 | `@media (width >= 37.5rem) { .medium:aspect-auto { aspect-ratio: auto; }` |
| `medium:bottom-6` | 1 | `@media (width >= 37.5rem) { .medium:bottom-6 { bottom: calc(var(--spacing) * 6); }` |
| `medium:contents` | 1 | `@media (width >= 37.5rem) { .medium:contents { display: contents; }` |
| `medium:flex-wrap` | 1 | `@media (width >= 37.5rem) { .medium:flex-wrap { flex-wrap: wrap; }` |
| `medium:gap-12` | 1 | `@media (width >= 37.5rem) { .medium:gap-12 { gap: calc(var(--spacing) * 12); }` |
| `medium:grid-cols-[1fr_auto]` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-[1fr_auto] { grid-template-columns: 1fr auto; }` |
| `medium:grid-cols-[minmax(10rem,14rem)_1fr]` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-[minmax(10rem,14rem)_1fr] { grid-template-columns: minmax(10rem,14rem) 1fr; }` |
| `medium:grid-cols-3` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }` |
| `medium:grid-cols-4` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }` |
| `medium:inline` | 1 | `@media (width >= 37.5rem) { .medium:inline { display: inline; }` |
| `medium:inset-x-auto` | 1 | `@media (width >= 37.5rem) { .medium:inset-x-auto { inset-inline: auto; }` |
| `medium:left-6` | 1 | `@media (width >= 37.5rem) { .medium:left-6 { left: calc(var(--spacing) * 6); }` |
| `medium:max-h-40` | 1 | `@media (width >= 37.5rem) { .medium:max-h-40 { max-height: calc(var(--spacing) * 40); }` |
| `medium:min-h-36` | 1 | `@media (width >= 37.5rem) { .medium:min-h-36 { min-height: calc(var(--spacing) * 36); }` |
| `medium:mo-type-display-medium` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` |
| `medium:mo-type-display-small` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` |
| `medium:mo-type-headline-large` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` |
| `medium:mo-type-title-large` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` |
| `medium:mt-14` | 1 | `@media (width >= 37.5rem) { .medium:mt-14 { margin-top: calc(var(--spacing) * 14); }` |
| `medium:mt-28` | 1 | `@media (width >= 37.5rem) { .medium:mt-28 { margin-top: calc(var(--spacing) * 28); }` |
| `medium:mx-0` | 1 | `@media (width >= 37.5rem) { .medium:mx-0 { margin-inline: 0px; }` |
| `medium:overflow-visible` | 1 | `@media (width >= 37.5rem) { .medium:overflow-visible { overflow: visible; }` |
| `medium:p-6` | 1 | `@media (width >= 37.5rem) { .medium:p-6 { padding: calc(var(--spacing) * 6); }` |
| `medium:p-8` | 1 | `@media (width >= 37.5rem) { .medium:p-8 { padding: calc(var(--spacing) * 8); }` |
| `medium:pb-4` | 1 | `@media (width >= 37.5rem) { .medium:pb-4 { padding-bottom: calc(var(--spacing) * 4); }` |
| `medium:pl-1` | 1 | `@media (width >= 37.5rem) { .medium:pl-1 { padding-left: var(--spacing); }` |
| `medium:pr-72` | 1 | `@media (width >= 37.5rem) { .medium:pr-72 { padding-right: calc(var(--spacing) * 72); }` |
| `medium:pt-(--mo-comp-theme-section-space-large)` | 1 | `@media (width >= 37.5rem) { .medium:pt-(--mo-comp-theme-section-space-large) { padding-top: var(--mo-comp-theme-section-space-large); }` |
| `medium:pt-8` | 1 | `@media (width >= 37.5rem) { .medium:pt-8 { padding-top: calc(var(--spacing) * 8); }` |
| `medium:px-0` | 1 | `@media (width >= 37.5rem) { .medium:px-0 { padding-inline: 0px; }` |
| `medium:px-7` | 1 | `@media (width >= 37.5rem) { .medium:px-7 { padding-inline: calc(var(--spacing) * 7); }` |
| `medium:py-16` | 1 | `@media (width >= 37.5rem) { .medium:py-16 { padding-block: calc(var(--spacing) * 16); }` |
| `medium:select-auto` | 1 | `@media (width >= 37.5rem) { .medium:select-auto { -webkit-user-select: auto; user-select: auto; }` |
| `medium:touch-auto` | 1 | `@media (width >= 37.5rem) { .medium:touch-auto { touch-action: auto; }` |
| `min-[600px]:basis-0` | 1 | `@media (width >= 600px) { .min-[600px]:basis-0 { flex-basis: 0px; }` |
| `min-[600px]:flex-1` | 1 | `@media (width >= 600px) { .min-[600px]:flex-1 { flex: 1; }` |
| `min-[600px]:flex-nowrap` | 1 | `@media (width >= 600px) { .min-[600px]:flex-nowrap { flex-wrap: nowrap; }` |
| `min-[600px]:ms-0` | 1 | `@media (width >= 600px) { .min-[600px]:ms-0 { margin-inline-start: 0px; }` |
| `min-[600px]:order-none` | 1 | `@media (width >= 600px) { .min-[600px]:order-none { order: 0; }` |
| `min-[600px]:pb-0` | 1 | `@media (width >= 600px) { .min-[600px]:pb-0 { padding-bottom: 0px; }` |
| `min-h-(--top-app-bar-height,4rem)` | 1 | `min-height: var(--top-app-bar-height,4rem);` |
| `min-h-11` | 1 | `min-height: calc(var(--spacing) * 11);` |
| `min-h-14` | 1 | `min-height: calc(var(--spacing) * 14);` |
| `min-h-full` | 1 | `min-height: 100%;` |
| `min-w-[min(var(--mo-sys-block-text-measure-min),100%)]` | 1 | `min-width: min(var(--mo-sys-block-text-measure-min), 100%);` |
| `ml-5` | 1 | `margin-left: calc(var(--spacing) * 5);` |
| `mr-1` | 1 | `margin-right: var(--spacing);` |
| `mr-2` | 1 | `margin-right: calc(var(--spacing) * 2);` |
| `ms-auto` | 1 | `margin-inline-start: auto;` |
| `mt-1.5` | 1 | `margin-top: calc(var(--spacing) * 1.5);` |
| `mt-2.5` | 1 | `margin-top: calc(var(--spacing) * 2.5);` |
| `mt-20` | 1 | `margin-top: calc(var(--spacing) * 20);` |
| `mx-0.5` | 1 | `margin-inline: calc(var(--spacing) * 0.5);` |
| `mx-2` | 1 | `margin-inline: calc(var(--spacing) * 2);` |
| `mx-4` | 1 | `margin-inline: calc(var(--spacing) * 4);` |
| `my-3` | 1 | `margin-block: calc(var(--spacing) * 3);` |
| `my-4` | 1 | `margin-block: calc(var(--spacing) * 4);` |
| `object-[50%_20%]` | 1 | `object-position: 50% 20%;` |
| `object-top` | 1 | `object-position: top;` |
| `opacity-0` | 1 | `opacity: 0%;` |
| `order-last` | 1 | `order: 9999;` |
| `origin-top` | 1 | `transform-origin: top;` |
| `origin-top-left` | 1 | `transform-origin: 0 0;` |
| `outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `outline-dashed` | 1 | `--tw-outline-style: dashed; outline-style: dashed;` |
| `outline-outline-variant` | 1 | `outline-color: var(--mo-sys-color-outline-variant);` |
| `p-(--navigation-drawer-item-padding,0_1rem)` | 1 | `padding: var(--navigation-drawer-item-padding,0 1rem);` |
| `p-8` | 1 | `padding: calc(var(--spacing) * 8);` |
| `pb-(--toolbar-docked-padding-block)` | 1 | `padding-bottom: var(--toolbar-docked-padding-block);` |
| `pb-[26rem]` | 1 | `padding-bottom: 26rem;` |
| `pb-24` | 1 | `padding-bottom: calc(var(--spacing) * 24);` |
| `pb-3` | 1 | `padding-bottom: calc(var(--spacing) * 3);` |
| `pb-44` | 1 | `padding-bottom: calc(var(--spacing) * 44);` |
| `pb-8` | 1 | `padding-bottom: calc(var(--spacing) * 8);` |
| `pe-2` | 1 | `padding-inline-end: calc(var(--spacing) * 2);` |
| `pl-1` | 1 | `padding-left: var(--spacing);` |
| `pl-11` | 1 | `padding-left: calc(var(--spacing) * 11);` |
| `pl-3` | 1 | `padding-left: calc(var(--spacing) * 3);` |
| `placeholder:text-on-surface-variant/60` | 1 | `color: color-mix(in oklab, var(--mo-sys-color-on-surface-variant) 60%, transparent);` |
| `pr-12` | 1 | `padding-right: calc(var(--spacing) * 12);` |
| `pr-2` | 1 | `padding-right: calc(var(--spacing) * 2);` |
| `pr-4` | 1 | `padding-right: calc(var(--spacing) * 4);` |
| `ps-0` | 1 | `padding-inline-start: 0px;` |
| `ps-5` | 1 | `padding-inline-start: calc(var(--spacing) * 5);` |
| `pt-(--mo-comp-theme-section-space)` | 1 | `padding-top: var(--mo-comp-theme-section-space);` |
| `pt-[calc(0.75rem+env(safe-area-inset-top))]` | 1 | `padding-top: calc(0.75rem + env(safe-area-inset-top));` |
| `pt-24` | 1 | `padding-top: calc(var(--spacing) * 24);` |
| `pt-36` | 1 | `padding-top: calc(var(--spacing) * 36);` |
| `pt-5` | 1 | `padding-top: calc(var(--spacing) * 5);` |
| `py-0` | 1 | `padding-block: 0px;` |
| `py-12` | 1 | `padding-block: calc(var(--spacing) * 12);` |
| `py-5` | 1 | `padding-block: calc(var(--spacing) * 5);` |
| `py-6` | 1 | `padding-block: calc(var(--spacing) * 6);` |
| `resize-none` | 1 | `resize: none;` |
| `right-0` | 1 | `right: 0px;` |
| `right-2` | 1 | `right: calc(var(--spacing) * 2);` |
| `right-3` | 1 | `right: calc(var(--spacing) * 3);` |
| `ring-2` | 1 | `--tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), va` |
| `ring-surface` | 1 | `--tw-ring-color: var(--mo-sys-color-surface);` |
| `rounded-[1.375rem]` | 1 | `border-radius: 1.375rem;` |
| `rounded-[3px]` | 1 | `border-radius: 3px;` |
| `rounded-[inherit]` | 1 | `border-radius: inherit;` |
| `rounded-b-panel` | 1 | `border-bottom-right-radius: var(--mo-sys-radius); border-bottom-left-radius: var(--mo-sys-radius);` |
| `rounded-t-panel` | 1 | `border-top-left-radius: var(--mo-sys-radius); border-top-right-radius: var(--mo-sys-radius);` |
| `scroll-mt-[calc(1rem+env(safe-area-inset-top))]` | 1 | `scroll-margin-top: calc(1rem + env(safe-area-inset-top));` |
| `scroll-mt-[calc(5rem+env(safe-area-inset-top))]` | 1 | `scroll-margin-top: calc(5rem + env(safe-area-inset-top));` |
| `select-all` | 1 | `-webkit-user-select: all; user-select: all;` |
| `size-[28px]` | 1 | `width: 28px; height: 28px;` |
| `size-28` | 1 | `width: calc(var(--spacing) * 28); height: calc(var(--spacing) * 28);` |
| `size-3` | 1 | `width: calc(var(--spacing) * 3); height: calc(var(--spacing) * 3);` |
| `size-4` | 1 | `width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4);` |
| `size-9` | 1 | `width: calc(var(--spacing) * 9); height: calc(var(--spacing) * 9);` |
| `space-y-0.5` | 1 | `:where(.space-y-0.5 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 0.5) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacin` |
| `space-y-8` | 1 | `:where(.space-y-8 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 8) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` |
| `text-(--mo-comp-google-date)` | 1 | `color: var(--mo-comp-google-date);` |
| `text-(--mo-comp-google-icon-letter)` | 1 | `color: var(--mo-comp-google-icon-letter);` |
| `text-(--mo-comp-google-site)` | 1 | `color: var(--mo-comp-google-site);` |
| `text-[20px]` | 1 | `font-size: 20px;` |
| `text-[length:var(--mo-sys-typescale-headline-small-size)]` | 1 | `font-size: var(--mo-sys-typescale-headline-small-size);` |
| `text-display-small` | 1 | `font-size: var(--mo-sys-typescale-display-small-size); line-height: var(--tw-leading, var(--mo-sys-typescale-display-small-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-type` |
| `text-left` | 1 | `text-align: left;` |
| `text-on-primary` | 1 | `color: var(--mo-sys-color-on-primary);` |
| `text-on-secondary-container` | 1 | `color: var(--mo-sys-color-on-secondary-container);` |
| `text-on-tertiary-container` | 1 | `color: var(--mo-sys-color-on-tertiary-container);` |
| `text-right` | 1 | `text-align: right;` |
| `text-start` | 1 | `text-align: start;` |
| `text-title-medium` | 1 | `font-size: var(--mo-sys-typescale-title-medium-size); line-height: var(--tw-leading, var(--mo-sys-typescale-title-medium-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typesc` |
| `text-title-small` | 1 | `font-size: var(--mo-sys-typescale-title-small-size); line-height: var(--tw-leading, var(--mo-sys-typescale-title-small-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typescal` |
| `top-[env(safe-area-inset-top)]` | 1 | `top: env(safe-area-inset-top);` |
| `top-1` | 1 | `top: var(--spacing);` |
| `top-1/2` | 1 | `top: calc(1 / 2 * 100%);` |
| `top-3` | 1 | `top: calc(var(--spacing) * 3);` |
| `top-8` | 1 | `top: calc(var(--spacing) * 8);` |
| `top-full` | 1 | `top: 100%;` |
| `tracking-wide` | 1 | `--tw-tracking: var(--tracking-wide); letter-spacing: var(--tracking-wide); } @property --tw-tracking { syntax: "*"; inherits: false;` |
| `transform-gpu` | 1 | `transform: translateZ(0) var(--tw-rotate-x, ) var(--tw-rotate-y, ) var(--tw-rotate-z, ) var(--tw-skew-x, ) var(--tw-skew-y, );` |
| `transition-[stroke-dasharray]` | 1 | `transition-property: stroke-dasharray; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-duration, var(--default-transition` |
| `underline-offset-4` | 1 | `text-underline-offset: 4px;` |
| `w-[calc(100%+1.5rem)]` | 1 | `width: calc(100% + 1.5rem);` |
| `w-1` | 1 | `width: var(--spacing);` |
| `w-11` | 1 | `width: calc(var(--spacing) * 11);` |
| `w-24` | 1 | `width: calc(var(--spacing) * 24);` |
| `w-8` | 1 | `width: calc(var(--spacing) * 8);` |
| `w-max` | 1 | `width: max-content;` |
| `w-px` | 1 | `width: 1px;` |
| `whitespace-pre-line` | 1 | `white-space: pre-line;` |
| `z-[42]` | 1 | `z-index: 42;` |
| `z-[43]` | 1 | `z-index: 43;` |
| `-translate-x-1/2` | consts only | `--tw-translate-x: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); } @property --tw-translate-x { syntax: "*"; inherits: false; initial-value: 0; } @pro` |
| `-translate-y-1/2` | consts only | `--tw-translate-y: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); } @property --tw-translate-x { syntax: "*"; inherits: false; initial-value: 0; } @pro` |
| `border-[3px]` | consts only | `border-style: var(--tw-border-style); border-width: 3px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-[rgb(128_128_128/0.45)]` | consts only | `border-color: rgb(128 128 128/0.45);` |
| `border-l` | consts only | `border-left-style: var(--tw-border-style); border-left-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-white` | consts only | `border-color: var(--color-white);` |
| `large:col-start-2` | consts only | `@media (width >= 75rem) { .large:col-start-2 { grid-column-start: 2; }` |
| `medium:mt-8` | consts only | `@media (width >= 37.5rem) { .medium:mt-8 { margin-top: calc(var(--spacing) * 8); }` |
| `pointer-events-none` | consts only | `pointer-events: none;` |
| `shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.3)]` | consts only | `--tw-shadow: 0 0 0 1px var(--tw-shadow-color, rgb(0 0 0/0.3)), 0 2px 6px var(--tw-shadow-color, rgb(0 0 0/0.3)); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-rin` |
| `text-(--mo-sys-color-error)` | consts only | `color: var(--mo-sys-color-error);` |
| `w-[22.5rem]` | consts only | `width: 22.5rem;` |
