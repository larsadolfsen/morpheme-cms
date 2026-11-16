# Moving the CMS away from Tailwind: plan

Status: plan, 16 Nov 2026, revised 16 Nov 2026 (owner: all tokens `--mo-`, no aliases; see *Revision* below). Written in a brainstorm session: no code, no builds, no checks run. Every number below comes
from `git grep` or a script on `origin/0.18` at `795b68c` (`package.json` says `0.17.0`, the released line; the work is on
the `0.18` branch). Owner direction, decided and not reopened: in the long run the CMS has no Tailwind. Reasons: one
dependency less, one naming system (`--mo-` for every shared custom property), and the priority order of
`developer` §4a (1 Modern web, 2 M3 Expressive, 3 M3, 4 M2 with M3 styling, 5 self-made). Not 0.18.

## Revision 16 Nov (owner): `--mo-` is the goal, and removing Tailwind is how we get there

Owner: every custom property of the CMS is `--mo-*`, with no aliases (the old names are removed, not kept for a version line). This
changes what the plan is for. Removing Tailwind is no longer only a dependency cleanup; it is the step that finishes the rename,
because the names Tailwind reads cannot be renamed while Tailwind is installed (it builds utilities from the `--color-*`,
`--text-*`, `--font-sans`, `--radius-*`, `--shadow-*`, `--ease-*` and `--breakpoint-*` namespaces).

### Who renames what

| Group | Names | Who and when |
| :-- | :-- | :-- |
| Names that are not Tailwind's and have no `--mo-` yet (for example `--radius`, `--radius-small`, `--panel-shadow`, `--ease`, `--card-gap`, `--type-*`) | about 1,000 declarations in all, one origin folder each (`theme/styles/tokens/<origin>/`) | The Tokens session: PR 1 moves ref+sys, PR 2 moves component tokens, PR 3 renames, PR 4 adds the fallbacks. Starts now. This is the old "PR 0" of §6, made concrete. |
| Tailwind's aliases: `--color-*` (45), `--text-*` (60 with their `--line-height`, `--letter-spacing` and `--font-weight` parts), `--radius-panel*`, `--shadow-soft`, `--ease-soft` | `@theme inline` in `base.css:166` and `global.css:571`. Every one is an alias of a name that is `--mo-*` or becomes it in PR 3 (`--color-primary: var(--mo-primary)`, `--text-label-small: var(--type-label-small-size)`) | They are not renamed, they are **deleted** in §6 PR 10, with `@theme`. Before that, PRs 3 to 6 remove the last utility that reads them, and the 4 `var(--color-*)`, 94 `var(--text-*)` (`ui.css` 71, `global.css` 1 and the rest in `src/`), 16 `var(--radius*)` and 17 `var(--font-sans)` reads in CSS are pointed at the `--mo-*` name they alias (a tested mechanical edit, one PR per name family, no change of value). |
| Tailwind-owned names with a real value: `--breakpoint-*` (4, `base.css:283`), `--container-3xl` (1 read), `--font-sans` | `@theme static` and one `@theme inline` line | §6 PR 2 gives the breakpoints their `--mo-breakpoint-*` home (plain declarations; a test keeps them equal to `lib/breakpoints.mjs`); `--font-sans` becomes `--mo-font-sans` in PR 3's last slice; `--container-3xl` becomes a `--mo-` token |
| `--tw-prose-*` (14 names, 43 lines) | `src/editor.css`, `base.css`, `blocks.css` | §6 PR 7: `--mo-prose-*`, when `prose` is our own CSS |
| `--tw-*` the engine's own | none we write | gone with Tailwind; the permanent check (PR 11) fails on any `--tw-` |
| Theme-owned names | `--<theme>-*` | stay, as in `morpheme-apps` |

**Rule for the end state, and the check that holds it:** every custom property declared in the CMS's own CSS starts with `--mo-ref-`, `--mo-sys-` or `--mo-comp-` (Material 3's three tiers, `md` written `mo`), except
a theme's own `--<theme>-*`. The check (PR 11) lists every `--name:` declaration and
fails on one outside the rule; the Tokens session builds the list and the allowlist in its PR 3, and PR 11 turns the allowlist off for
the Tailwind names.

### What changes in the order of work

1. **Tokens first (now, the Tokens session).** Its PRs 1 to 4 do not touch Tailwind's names: they move, rename and add fallbacks only for what is not Tailwind's. Its fallbacks (PR 4) use the final `--mo-` names, so a theme that sets a faulty value still has a value.
2. **The Tailwind aliases are repointed before they are deleted.** A `var(--text-label-small)` read becomes `var(--mo-type-label-small-size)` while Tailwind is still installed, so that PR 10 only deletes dead lines. Each repointing PR is byte-identical in the built CSS after normalising (the proof the Tokens session already runs: the computed value of every custom property on every element of the demo, light and dark, three widths).
3. **No aliases** also means no `--text-*` or `--color-*` left behind "for themes". The break for an installed theme or app that reads an old name is the same one §5 already counts for utility classes, in the same release (`THEME_API` and `APP_API` 6, 0.23). The Tokens session lists, after its PR 2, every renamed name and who reads it outside this repository.
4. **Version lines are unchanged:** renames of non-Tailwind names (Tokens PR 3) land after 0.18.0, in the line the owner chooses; the Tailwind steps stay 0.21 (deprecate) and 0.23 (remove). Because there are no aliases, a rename that a theme or app can read is a break, so it is raised with the removal in 0.23 unless the owner decides to take it earlier with its own contract bump.

### Open questions for the owner (new, in addition to the six below; the first is now decided)

1. **Component tokens: decided (owner, 16 Nov).** Yes, they are `--mo-` too, and the whole system follows Material 3's token naming with `md` replaced by `mo`: the three tiers `--mo-ref-*` (reference), `--mo-sys-*` (system roles) and `--mo-comp-<component>-*` (component), in the pattern m3.material.io prints for each tier (the Tokens session reads the real pages and records the pattern per group in its plan, never from memory). The same tiers are the `md.ref.*`, `md.sys.*` and `md.comp.*` of `CLAUDE.md`. Consequence to confirm with the owner, because there are no aliases: the roles that are already `--mo-*` today (`--mo-primary`, `--mo-surface`, `--mo-space-*`, `--mo-shape-*`) move into the `--mo-sys-*` tier too, and a theme or app that sets or reads them breaks in the same release (§5). The plan's table above shows the end names; the Tokens session's PR 3 carries the full current-to-new table.
2. **Can a rename earlier than 0.23 break a theme or an app?** Without aliases it can. The first step is to read `venus` and the store apps (§1.9) and count real readers of the old names; if there are none, Tokens PR 3 may go before 0.23.

## Decisions for the owner (six, each with my recommendation)

1. **Which version line, and in how many steps.** Recommend two lines: *deprecate* in 0.21 (the CMS itself is migrated and
   a theme or app that uses Tailwind classes gets a warning; Tailwind is still installed, contracts unchanged) and
   *remove* in 0.23 (packages gone, `THEME_API` and `APP_API` go to 6). Why: 0.20 redraws every editor screen (app bars,
   sheets, autosave); rewriting the editor's 2,204 utility uses at the same time would conflict with all of it. 0.21 is the
   look line and already restyles the theme's CSS. 0.23 is the app platform line, which already touches `APP_API`.
2. **Breakpoints.** Recommend literal values in `@media`, written once per value from the one token table, with a check
   that every literal equals a table value (§2). Container queries only for new components and where a component
   (not the window) decides the layout. Not `@custom-media` now.
3. **Installed themes and store apps.** They work today with any utility class because Tailwind scans their files. After
   removal such a class silently does nothing. Recommend: one line of warnings (0.21), no frozen "compat utilities" file,
   and the replacement table of this plan (Appendix A) published as the migration guide. I could not look at `venus` or
   any app (§1.9), so the real exposure is unknown; the first step of the work is to look.
4. **Names of the layout classes.** Recommend the prefix `mo-` on classes too (`mo-row`, `mo-stack`, `mo-grid`): a theme
   styles its own `.row` and `.stack`, and `fallback` layering only protects against that for Material's rules, not
   for a name a theme reuses by chance (§3).
5. **The editor's `src/` is 85% of the work** (2,204 of 2,585 uses, in 99 files; `src/ui.tsx` alone 617). Recommend: it
   moves after 0.20's screens settle, uses the same small vocabulary plus component CSS in the editor's own files,
   and never gets its own utilities back. The owner rule "no UI part is built from utilities" is today not true in the
   editor (it is true in `theme/ui`: see §1.4).
6. **Same result first, better later.** Recommend that every step keeps the rendered result identical (including the
   typography plugin's odd spaces and Tailwind's reset), and that M3 tuning of text spacing is a separate, later,
   visible change. It needs a new proof tool (§6, PR 1): `compare-html` compares class names, so it cannot prove an
   identical look when class names change.

## 1. Inventory

Method. The repository had no `node_modules`. I installed `tailwindcss@4.3.5` and `@tailwindcss/typography@0.5.20`
(the repo's ranges) in the scratchpad only, loaded Tailwind's own design system with the repo's `@theme` blocks and
`@utility` rules, and asked it which string in the markup is a valid utility. That is why a word like `flex` in a comment
is not counted but `rounded-(--block-radius)` is. The extraction script is in the scratchpad (`classes.mjs`); PR 1
commits a clean version of it as the migration's progress meter. A "real class attribute" here is a string inside
`class="…"`, `className="…"`, `className={…}` or `class:list={…}`; strings in constants are reported separately.

### 1.1 Where Tailwind is wired in

| What | Where | Count / command |
| :-- | :-- | :-- |
| `@import 'tailwindcss'` (theme, **preflight**, utilities) and `@plugin '@tailwindcss/typography'` | `theme/styles/base.css:1-2` | 2 lines |
| `@layer theme, base, components, utilities, fallback;` (the cascade our rules rely on) | `theme/styles/base.css:4` | 1 |
| `@source '../..'` (scan the whole package, also `node_modules`) and two `@source not` | `theme/styles/ui.css:73-75` | 3 |
| `@reference '../theme/styles/base.css'` | `src/editor.css:4` | 1 |
| `@theme inline` blocks | `base.css` 110 declarations (45 `--color-*`, 60 `--text-*`, 2 `--radius-*`, `--shadow-soft`, `--ease-soft`, `--font-sans`), `global.css` 1 (`--font-sans`) | `git grep -n '@theme'` |
| `@theme static` (the four `--breakpoint-*`, also the only reason they exist on `:root` for the editor's Preview: `src/previewBreakpoints.ts`) | `base.css:283` | 4 declarations |
| `@utility type-*` (the type scale as utilities, `type-lead` included) | `theme/styles/ui.css` | 16 (`git grep -c -E '^\s*@utility' -- theme`) |
| `theme(--…)` in CSS | `src/editor.css` 17, `ui.css` 14, `blocks.css` 9, `global.css` 8, `components.css` 8, `base.css` 4, `site/breakpoints.mjs` 1 (a comment) | **60**: 51 `--breakpoint-medium`, 4 `-large`, 4 `-expanded`, 1 `--container-3xl` (`src/editor.css:729`). 59 are inside an `@media`. `git grep -o 'theme(--[a-z0-9-]*)'` |
| `--tw-prose-*` custom properties (the plugin's colour hooks) | `src/editor.css` 17, `base.css` 14, `blocks.css` 12 | 43 lines, 14 distinct names |
| `@apply`, `@variant`, `@custom-variant`, `@config` | none | `git grep` finds 0 |
| Vite plugin | `astro.mjs:9` import, `astro.mjs:173` `tailwindcss()` | 2 lines. No `css.transformer`, no `lightningcss`, no PostCSS config anywhere (`git grep -i lightningcss` = 0) |
| Prettier plugin | `.prettierrc.json` and `starter/.prettierrc.json` (`prettier-plugin-tailwindcss`, `tailwindStylesheet`) | 2 files |
| Checks that know Tailwind | `site/breakpoints.mjs` (old breakpoint names), `scripts/check-css-values.mjs` (off-scale classes, and the `--tw`/`--color-`/`--breakpoint` custom-property exemption), `scripts/check-colors.mjs` (palette classes), `scripts/spacing-grid.allow.mjs`, `scripts/color-names.test.mjs`, `scripts/peer-ranges.test.mjs` (the typography override), `lib/licenses.mjs` (3 mentions: preflight and typography licences), `lib/contracts.mjs`, `README.md:48` | 8 scripts and libs |

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

### 1.3 Utility classes in markup (counts at `795b68c`)

Files scanned: `git ls-files -- '*.tsx' '*.astro' '*.jsx'` in `theme/`, `src/`, `pages/`, `starter/`, `demo/`, `site/`,
`defaults/`, `lib/` = 319 files (214 `.tsx` and 32 `.astro` have a class attribute; 0 `.jsx`).

| Folder | Utility uses in class attributes |
| :-- | --: |
| `src/` (the editor; 99 files, 170 `.tsx` in all) | **2,204** |
| `theme/` (35 files) | **379** |
| `defaults/` (`popup.tsx`: `not-prose mx-auto max-w-md`) | 2 |
| `pages/`, `starter/`, `site/`, `lib/`, `demo/` | **0** |
| **Total** | **2,585 uses, 574 distinct classes** |

12 more distinct classes appear only in constants (`-translate-x-1/2 -translate-y-1/2 border-[3px] border-[rgb(…)] border-l
border-white large:col-start-2 medium:mt-8 pointer-events-none shadow-[…] text-(--mo-error) w-[22.5rem]`). All 586 are in
Appendix A with their use count and the CSS Tailwind makes of them. By family (my split; Appendix A has the exact names):

| Family | Uses | Distinct |
| :-- | --: | --: |
| display, flex, grid, alignment (`flex`, `items-center`, `shrink-0`, `flex-1`, `grid`, `block`, `gap-*` …) | 819 | 88 |
| margin, padding, `space-y-*` (`mb-8`, `px-4`, `p-4`, `space-y-5` …) | 648 | 143 |
| type (`text-sm`, `font-medium`, `type-body-medium`, `text-title-large`, `truncate` …) | 284 | 55 |
| sizing (`min-w-0`, `w-full`, `max-w-*`, `size-full`, `h-16` …) | 245 | 87 |
| colour (`text-on-surface-variant` 133, `border-outline-variant`, `bg-surface-container-high` …) | 244 | 47 |
| position, overflow (`relative`, `absolute`, `overflow-hidden`, `sticky` …) | 122 | 48 |
| border, radius, shadow, outline | 112 | 37 |
| transition, transform, opacity, cursor, pointer-events | 48 | 35 |
| `sr-only`, `object-*`, `list-*`, `bg-*` images | 34 | 12 |
| arbitrary properties and selectors (`[--card-padding:1rem]`, `[&>svg]:size-4`, `[container-type:size]`, `[mask-size:contain]` …) | 29 + variants below | 22 |

The ten most used: `flex` 157, `text-on-surface-variant` 133, `items-center` 71, `shrink-0` 71, `text-sm` 64, `font-medium` 59,
`min-w-0` 50, `gap-2` 49, `flex-1` 48, `mb-8` 45 (and `px-4` 45).

Variants (a prefix before `:`), counted per class use: `medium:` 81, `expanded:` 24, `large:` 17, `focus:` 17,
`focus-visible:` 14, `hover:` 13, `group-hover:` 7, `min-[600px]:` 6, `max-medium:` 1, `max-expanded:` 1, and, as arbitrary or state variants, 19 uses of bracket selectors
(`[&>.tooltip]:`, `[&>svg]:`), 21 of bracket properties (`[--card-padding:1rem]:`-style) and 23 of `has-`, `group-data-`, `aria-`, `data-`, `not-first:`, `first-of-type:` and similar. `extra-large:` is used 0 times.

Static `class="…"` attributes: 1,307 (877 different strings, 2.2 classes each). Another 361 `className={…}` are built in code
(a codemod must handle them; a regex alone will not). Content: `git grep -h -o -E 'class="[^"]*"' -- '*.md'` finds only component
classes (`label-medium`, `color-accent`, `color-muted`, `body-small`, `body-large`) in the demo and the starter: no utility in content
there. A real site's own content may differ; Tailwind scans it today (not checkable here).

Things the numbers hide:

- **Hard-coded couplings to a utility.** `--carousel-bleed: 1rem` and `--chip-set-bleed: 1rem` (`base.css`) exist because
  `Container.astro`'s gutter is `px-4`. When `px-4` goes, the gutter must become one token that both read.
- **Colours are Tailwind's `--color-*` aliases of the `--mo-*` roles** (45 declarations in `@theme inline`). They vanish with
  Tailwind; the colour utilities (244 uses) become `color: var(--mo-…)` in a class, or the markup uses a role class
  (`.mo-on-surface-variant`). The parallel `--mo-` rename must **not** rename `--color-*`, `--text-*`, `--breakpoint-*`:
  they are Tailwind names that end here, not names to keep. Three outsiders do read them with `var()`: `var(--font-sans)` 17
  times, `var(--radius-panel)` 6 times, and 4 single `--color-…` reads (`git grep -h -o -E 'var\(--(color-|text-|radius-panel|font-sans)…'`).
  These need a `--mo-` home (`--mo-font-sans`, `--mo-shape-panel`…), which belongs to the rename session.
- **Colours that are not roles:** `border-white`, `border-[rgb(128_128_128/0.45)]` and `shadow-[0_0_0_1px_rgb(0_0_0/0.3)…]`
  exist in constants; `check:colors` has allowlist reasons for them.
- `min-[600px]:` (6 uses, `src/PreviewScreen.tsx:90-101`), `[@media(width<37.5rem)]:` (`src/ui.tsx:3940`), `@media (width < 73.5rem)`
  (`src/editor.css:807`) and `@media (max-width: 599.98px)` (`src/editor.css:1842`) are literal widths today, three of them off the table.

### 1.4 The rule "no UI part is built from utilities"

It holds in `theme/ui` for the components themselves (its parts, 47 `.tsx` files in `theme/ui`, have class names styled in `ui.css`). It does not hold
for the editor: `src/ui.tsx` has 617 utility uses, `src/Screen.tsx` 110, `src/Media.tsx` 85, `src/Library.tsx` 74,
`src/SelectionParts.tsx` 64. In `theme/` the heaviest are `CookieConsent.astro` 34, `New.astro` 33, `Header.astro` 32, `BlogPosts.tsx` 29.
This plan does not call that a violation (the editor's own workspace may differ, `material-3` rule 1); it states that
removing Tailwind is also removing those 2,204 uses.

### 1.5 `prose`

`git grep -l -P '(^|[\s"'"'"'`.{])prose(?![-\w])' -- . ':!docs' ':!CHANGELOG.md' ':!release-notes' ':!package-lock.json'` = **20 files**:
16 in production code, 4 tests and scripts. The owner's "about 34" is not what the code says: `git grep -l -w prose` finds 42 files, but
most of the other 22 are `@milkdown/kit/prose/…` imports (`src/eyebrowState.mjs`, `src/markdown.mjs` …), not the class.

- **7 class attributes** use it: `src/MarkdownEditor.tsx:3374` (`editor-text prose max-w-none …`), `src/standard/view.tsx:50`,
  `theme/editor/previews.tsx:40`, `theme/components/Markdown.astro:17` (`max-w-[62ch]`), `theme/layouts/PageLayout.astro:94-95`
  (`max-w-[66ch]`, and `[&>:not(.not-prose)]:max-w-[66ch] [&>p:first-child]:type-lead …`), `theme/layouts/PostLayout.astro:44`
  (`prose mx-auto mt-10 max-w-3xl px-4 medium:mt-14 medium:px-6`).
- **97 CSS lines** select `.prose` or set `--tw-prose-*` (`git grep -c -P '\.prose|prose-'` in the five CSS files: `blocks.css` 40,
  `base.css` 35, `src/editor.css` 17, `global.css` 2, `ui.css` 2, `components.css` 1).
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

What `base.css` already overrides in the `fallback` layer (lines 359-496; all of this stays ours): the font from the M3 body
role, `p` spaces (`--prose-space`, 1rem, 1.5rem for a lead), `h3` margins, `h2`/`h3`/`h4` from the type scale, inline `code` on a tint with no backticks, `a`
weight and underline, `img` radius and width, `iframe` ratio and margins, `.post-lead`. The rest (lists, tables, `pre`, quotes, `hr`, `dl`,
`kbd`, `figure`, the em margins of headings) is what we get from the plugin and must write ourselves, in M3 units where a spacing is printed
and otherwise as today's value (§4).

### 1.7 Tailwind's reset (preflight) — not on the owner's list

`@import 'tailwindcss'` includes Tailwind's **preflight**: 398 lines, 35 rule blocks (`*, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid }`,
heading, list, table, `img, svg, video … { display: block; max-width: 100%; height: auto }`, form-control resets, `button` and `[hidden]`…). The CMS relies on it
without naming it; `base.css`'s `body` and `:focus-visible` rules sit on top of it. Removing Tailwind means writing our own reset
(§6, PR 8). This is the largest hidden dependency: no `grep` finds it, only a before/after comparison does.

### 1.8 Other places

- `theme/layouts/Base.astro:147-148` and `pages/editor/index.astro:60-61` write `<style is:inline>` with the colours and the motion: unrelated.
- Astro `<style>` blocks: none except those 4 inline ones. So `@custom-media` (§2) could not be used in a component's own `<style>`; today there are none.
- The editor's Preview reads `--breakpoint-*` from `:root` (`src/previewBreakpoints.ts`), which only exists because of `@theme static`. After the move
  they must be plain `--mo-breakpoint-*` declarations (the rename session's name).

### 1.9 What I could not see

- `morpheme-apps` (including `themes/venus` and the apps), `morpheme-staging`, `morpheme-website`: **not attached** to this session (only `/home/user/morpheme-cms` is). I did not attach them
  (`add_repo` asks the user). So I cannot say how many installed themes and store apps use Tailwind classes, `theme()`, `prose` or `--tw-*`. PM: please attach
  them or run the same counts there. The command is `node scripts/tailwind-inventory.mjs <folder>` once PR 1 exists; before that,
  `git grep -n -E 'theme\(--|@theme|@apply|@plugin|--tw-|\bprose\b|(medium|expanded|large|extra-large):'` plus the class scan from §1.
- The sites of real customers (their `src/themes`, `src/apps`, own content) are unknown too. `check:content` already scans a site's own files for
  breakpoints (`breakpointProblems`), so a site-side count can come from there.
- I could not read web.dev; I read the Modern Web Guidance in the repo's pinned `modern-web-guidance@1.0.0` (§2). I did not run
  `npm run check`, `check:screens`, or a build (brainstorm session).
- Not checked: whether `lightningcss` is already in the install tree through Tailwind's engine (§2).

## 2. Breakpoints

### 2.1 What exists

The values are ours already: `lib/breakpoints.mjs` (`compact 0, medium 600, expanded 840, large 1200, extraLarge 1600`, in `dp`) and
`--breakpoint-medium: 37.5rem`, `-expanded: 52.5rem`, `-large: 75rem`, `-extra-large: 100rem` in `base.css`; a test (`breakpoints.test.mjs`) keeps the two equal.
CSS cannot read a custom property inside `@media` or `@container`, which is why `theme(--breakpoint-…)` exists: Tailwind replaces it with the value at build time, so the
built CSS already contains the literal. `@media (width >= …)` range syntax is already what we write. 59 queries use it (§1.1).
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
| Verified in this repo | trivially: 59 queries already compile to literals | **No.** No `css.transformer` is set (§1.1), Astro 7 and Vite 8 behaviour with it is unverified, the `drafts` flag name is from memory | partly: 12 `@container` uses exist (`blocks.css`, `ui.css`) |
| Cost | repetition of 4 values (but the check makes drift impossible); a theme author must copy values | a config change on every site (`siteConfig()` is shared, so one place), a build-time dependency in the starter's peers; a draft spec feature | changes behaviour wherever the component is not as wide as the window (Preview frame, side sheets), so it is not "same result" |

**Recommendation: A for everything that exists, C for new components, not B now.** Reasons: A is the only option that keeps
"identical output" provable (§6 PR 2: the built CSS is byte-identical after normalising, since `theme()` already compiled to these literals),
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

Every class reads `--mo-space-*` (the M3 spacing scale, `base.css`), so no utility has a number of its own; where the editor wrote `gap-2` it writes `mo-gap-100` or sets `--mo-gap`.

| Class | What it is | Replaces (examples, counts from §1.3) |
| :-- | :-- | :-- |
| `mo-row` | `display: flex; align-items: center; gap: var(--mo-gap, var(--mo-space-100))`; modifiers `mo-row-wrap` (`flex-wrap: wrap`), `mo-row-start` (`align-items: flex-start`), `mo-row-end`, `mo-row-between` (`justify-content: space-between`) | `flex items-center gap-2` 49 `gap-2`, `flex-wrap` 39, `items-start` 18, `justify-end` 14 |
| `mo-stack` | `display: flex; flex-direction: column; gap: var(--mo-gap, var(--mo-space-200))` (replaces `space-y-*` with `gap`, the guide's rule) | `flex-col` 26, `space-y-4/5/6/3/2/1/10` 100+ |
| `mo-grid` | `display: grid; gap: var(--mo-gap)`; `grid-template-columns: repeat(var(--mo-columns, 1), minmax(0, 1fr))`; `--mo-columns` set per breakpoint by `mo-grid-2` etc. (`medium:grid-cols-2` 8, `expanded:grid-cols-2` 4). The M3 grid already exists as `.image-grid` (`docs/theme-grid.md`); this is only for plain columns | `grid` 31 |
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

Where a token lives (PM, 16 Nov): a token that only one block reads moves into that block's own stylesheet, on the block's root element (Astro ships a block's CSS only on the pages that use it, so the token costs nothing elsewhere); a shared `--mo-*` token stays on `:root`. This applies to the tokens the migration touches: the carousel and chip-set bleed (§1.3) become one gutter token on `:root` only if more than one part reads it, and `--mo-columns` and `--mo-gap` of the vocabulary are set on the element that uses them, never on `:root`.

Rules: (1) a utility-looking name never comes back (the check, §6 PR 11); (2) a vocabulary class sets layout only, never colour, type, shape or state (those
belong to the part and its tokens); (3) numbers come from `--mo-space-*`, `--mo-shape-*` and the type tokens; (4) a new vocabulary class needs a use of three or more places and goes in the table here
first. Spacing between blocks (`mb-8` 45, `mt-2`…) is not a layout primitive: it is the part's own spacing and becomes a token or a part rule, one at a time.

### 3.3 The mapping table

Every class: Appendix A (586 rows: class, uses, the CSS it makes). By family the rule of replacement is:

| Utility family | Replacement |
| :-- | :-- |
| `flex`, `flex-col`, `flex-wrap`, `items-*`, `justify-*`, `gap-*`, `inline-flex` | `mo-row` / `mo-stack` and modifiers, else the part's own rule (`display: flex`) |
| `grid`, `grid-cols-*`, `col-*`, `medium:grid-cols-*` | `mo-grid` + `--mo-columns`, or `.image-grid` for card grids; subgrid where cards align their insides |
| `space-y-*` | `mo-stack` with `gap` (same space, different mechanism: the first/last margin behaviour needs a `compare-styles` check) |
| `m*`, `p*` | the part's own padding/margin in `--mo-space-*`; logical properties; `mb-8` between blocks becomes the section rhythm token |
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
on markup. The code behind them changes. They live in `theme/styles/prose.css` (new), written from M3's type roles (`--type-*`), `--mo-space-*` and the `--mo-prose-*` colour hooks (renamed
from `--tw-prose-*`: 43 lines in `base.css`, `blocks.css`, `src/editor.css`), with the same selectors the plugin has, but no `:where(...):not(...)` wrapper chain: `:where(.prose) :where(h2)` for zero
specificity, and `:where(.not-prose, .not-prose *)` once. Layer: the plugin's rules are in the `utilities` layer today (comment at `blocks.css:2080`); the new rules need
a layer position that reproduces the same win/lose against the `fallback` layer and against utilities such as `max-w-3xl` on the same element. That layer order is decided in PR 7 by comparison, not by reasoning.

What the replacement must give (§1.6): the 10 groups above. The em-based plugin values stay in the first PR (identical result); a later, separate, visible PR moves them to M3 values.
M3 prints no paragraph or heading spacing (the existing comment in `base.css` says so: "it prints no paragraph or heading space, so these are the nearest rule"), so there is nothing to read from m3.material.io
for the spaces; for type sizes the type scale already supplies them.

Proof that the result is the same (`compare-html` proves the markup is unchanged but says nothing about the CSS, so a computed-style comparison is needed):

1. Build the demo and the starter before the PR into a folder of its own (`npx astro build --outDir <before>`), as `compare-html`'s header says.
2. `npx morpheme compare-html <before>`: proves the markup is unchanged.
3. New `scripts/compare-styles.mjs` (PR 1): for each built page, at 375, 700, 900 and 1300 px, Playwright walks every element in document order, and compares
   `getComputedStyle` for a fixed list of about 60 properties (type, spacing, colour, border, display, position, size) and the bounding box, in light and dark and on each section colour.
   It reports the first differing element and property. For `prose` it also compares one fixture page that has every element the plugin styles (h1-h4, p with lead, `ol type=A|a|I|i`, nested lists, `dl`, `blockquote`, `pre`, `code`, `kbd`, `table` with `tfoot`, `figure` with `figcaption`, `hr`, `img`, 
   `video`, a `not-prose` block inside text). `demo/src/content/pages/typography.md` is the start; a fixture is added under `demo/`.
4. The editor: `check:screens` already opens every screen; the same comparison runs in its Playwright on the editor's text field (`.editor-text.prose`) and the Preview.

## 5. Compatibility

What breaks, for whom:

| Who | Today | After removal | Mitigation |
| :-- | :-- | :-- | :-- |
| An installed theme that uses utility classes in its components | works: the site's Tailwind scans `src/themes` | classes do nothing, silently | warning in the theme check from 0.21; migration guide = Appendix A; `THEME_API` 6 so the store stops offering such a theme (it already offers only themes written to the current contract) |
| A theme that uses `theme(--breakpoint-…)`, `@theme`, `@apply`, `@utility` in its CSS | works | the CSS fails to build or is dropped | the same warning; `check:themes` fails on them in 0.23 |
| A theme with `medium:` variants | works | silent | as above |
| A theme using `prose` | works | works (class kept) | none |
| An app's blocks with utility classes (`View.tsx`) | works | silent | `APP_API` 6; apps written to 5 keep running (`APP_APIS = [4, 5]` is how the editor already accepts older contracts: add 5 to 6) but a utility does nothing; the app gets the same warning in the editor's app problems (`src/AppProblems.tsx`) |
| A site's own content with utility classes in HTML | works | silent | `check:content` warns from 0.21 |
| A site's `package.json` | lists the 3 packages and the Prettier plugin | extra, unused packages | harmless; the starter stops listing them (`starter/package.json`, `.prettierrc.json`); the upgrade tests use `scripts/fixtures/starter-0.14.2.package.json` and must still pass |
| A site's `.prettierrc.json` | `prettier-plugin-tailwindcss` with `tailwindStylesheet` into `@morphemecms/cms/theme/styles/global.css` | the plugin sorts classes by its default order: harmless | none |

`THEME_API` and `APP_API` (`lib/contracts.mjs`, re-exported by `src/store.ts`): **raise both to 6 in the removal line** (0.23). The contract text says "Raised when a theme written to the one before no longer works": a theme with a
utility class no longer works. This is not a `major` change of the package (the changesets skill never allows `major`): the changeset is `minor`, with the contract change in the note.
Version line: deprecate in **0.21**, remove in **0.23** (decision 1). Never 0.18 (owner), and not 0.19 (Lists and data, already cut).

What the release note must say (it is for theme and app authors, so the note goes to the store's developer notes as well as `release-notes/`; the `release-notes` skill decides the form): which
classes stop working (the Appendix A table link), the new class vocabulary and the literal breakpoint table, that `prose` and `not-prose` still work, that `THEME_API` and `APP_API` are 6, and
that a theme or app written to 5 that uses no utility, `theme()` or `@theme` is unchanged. For site owners: nothing changes on screen.

Deprecation path in order: 0.21 warnings + vocabulary available + CMS code migrated (Tailwind still installed); 0.22 nothing (store line); 0.23 packages removed, contracts 6, `check:themes` fails
on a utility or `theme()`.

## 6. Sequence and size

Each pull request is one logical change, keeps the rendered result identical, and leaves `check` green. Size: small, medium or large (files and risk, not hours). Proof tools are in PR 1.

| # | PR | Files it touches | Checks | Size |
| :-- | :-- | :-- | :-- | :-- |
| 0 | **The `--mo-` rename of everything that is not Tailwind's** (the Tokens session, PRs 1 to 4 of its plan; see the Revision above). Done first, and without aliases. It keeps `--color-*`, `--text-*` and the other Tailwind aliases untouched; they are repointed in the steps below and deleted in PR 10. It gives `--font-sans` (17 reads), `--radius-panel` (6), `--shadow-soft`, `--ease-soft` and `--breakpoint-*` a `--mo-` home. | CSS and TSX that read them | its own | (theirs) |
| 1 | **Proof tools and the counter.** `scripts/tailwind-inventory.mjs` (my §1 script, cleaned; prints this plan's tables), `scripts/compare-styles.mjs` (§4), `compare-html` option to ignore class names but keep structure, a **ratchet** `check:tailwind` that counts utilities, `theme()` and `@theme` per file and fails when a count goes up (like `check:web`, `scripts/tailwind-allowlist.json`, a lowering fixes it), and a tested `lib/` helper for the class scan | `scripts/` only, `package.json` scripts, `docs` | `npm run check`; runs itself on the demo and the starter | medium |
| 2 | **Breakpoints as literals.** Replace the 59 `theme(--breakpoint-…)` in `@media` with `37.5rem 52.5rem 75rem` (and `100rem`); `--container-3xl` in `src/editor.css:729` with its value as a token. `@theme static` stays (the `medium:` variants still need it). `site/breakpoints.mjs` rule 1 inverted (§2). The three off-table literals decided one by one. | `theme/styles/*.css` (5), `src/editor.css`, `site/breakpoints.mjs`, its test | `npm run check`; built CSS of the demo and the starter byte-equal after whitespace normalising (it already compiled to the same literals); `check:themes` | small |
| 3 | **The layout vocabulary and `theme/`** (379 uses, 35 files). Add `theme/styles/layout.css`; replace utilities in `theme/` with vocabulary or part CSS; the carousel and chip-set bleed move to one gutter token; `medium:type-*` in 3 files becomes `@media`. `defaults/popup.tsx` (2). Tailwind still builds the rest. | `theme/components/*`, `theme/layouts/*`, `theme/templates/*`, `theme/ui/*`, `theme/styles/{layout,components,blocks,ui}.css`, `defaults/popup.tsx` | `compare-styles` on the demo and the starter (4 widths, light, dark); `check:screens` (the Blocks page spacing check uses the 4 dp grid, so the replacement spaces are checked); `check:density`, `check:css-values`, `check:themes`; `check:demo`, `check:starter` | large |
| 4 | **Editor, part 1: `src/ui.tsx`** (617 uses) and `src/themeUi.ts` consumers; component CSS in `src/editor.css` (or new `src/editor/ui.css`) | `src/ui.tsx`, `src/editor.css` | `check:screens` (all shards), `compare-styles` on screens through its Playwright, `check:editor-colors`, `check:density`, `check:web` | large |
| 5 | **Editor, part 2: screens** (`Screen`, `Media`, `Library`, `SelectionParts`, `PreviewScreen` 58 incl. `min-[600px]`, `UpdatesNotice`, `NavigationRestParts`, `fields`, `AppList`: about 600 uses), in two or three slices by folder | `src/*.tsx` | same as 4 | large ×2 |
| 6 | **Editor, part 3: the rest** (about 900 uses in about 80 files, slices of 25 files) | `src/*.tsx` | same as 4 | large ×3 (mechanical, so each is medium to review) |
| 7 | **`prose` in our own CSS** (`theme/styles/prose.css`, `--tw-prose-*` → `--mo-prose-*` in 43 lines, the layer position, `not-prose`) while the plugin is still installed but no longer loaded: `@plugin` line removed in this PR | `theme/styles/{base,blocks,global,prose}.css`, `src/editor.css`, `package.json` (drop `@tailwindcss/typography`, its `overrides` entry, `scripts/peer-ranges.test.mjs`'s expectation) | `compare-html` (markup unchanged), `compare-styles` on the prose fixture and on every page of the demo and the starter, `check:screens` (editor text), `check:colors`, spacing check | medium |
| 8 | **Our own reset** (`theme/styles/reset.css`, the 35 preflight blocks, in the `base` layer) added next to Tailwind's; then the proof build is made with `@import 'tailwindcss/theme.css' layer(theme); @import 'tailwindcss/utilities.css' layer(utilities);` (no preflight) and compared | `theme/styles/{base,reset}.css` | `compare-styles` demo and starter, all screens | medium |
| 9 | **`@utility type-*` as plain classes** (16, in `ui.css`; `type-lead` keeps `--prose-space`) and the `@theme inline` type aliases (60) | `theme/styles/{ui,base}.css` | `theme/styles/typescale.test.mjs`, `compare-styles` | small |
| 10 | **Remove Tailwind.** `@import 'tailwindcss'`, `@theme` ×3, `@source` ×3, `@reference`; `astro.mjs` loses `tailwindcss()`; `package.json` loses `tailwindcss`, `@tailwindcss/vite` (peer and dev), `prettier-plugin-tailwindcss`; `starter/package.json` and both `.prettierrc.json`; `lib/licenses.mjs`; `README.md:48`; `check-css-values.mjs`, `check-colors.mjs`, `site/breakpoints.mjs` rules for removed things; `THEME_API` and `APP_API` = 6 and `APP_APIS`; `docs/app-contract.md`, theme docs; changeset `minor` + release notes for theme and app authors | many files, mostly one-line | `npm run check`, `check:screens`, `check:starter` (packs the package and builds it), `check:demo`, `check:themes`, the `peer-ranges` test, the starter-0.14.2 upgrade fixture test | medium (wide, shallow) |
| 11 | **The permanent check.** `check:tailwind` goes from ratchet to zero: fails on `@import 'tailwindcss'`, `@theme`, `@utility`, `@plugin`, `@apply`, `@source`, `@reference`, `theme(--`, `--tw-`, a `class` string containing a token from the frozen utility list (Appendix A's 586 names, plus the families `^(flex|grid|gap|p[xytblrse]?|m[xytblrse]?|space-[xy]|text-(xs|sm|base|lg|xl)|…)-` and variants `^(medium|expanded|large|extra-large|hover|focus|focus-visible|group-[\w-]+|has-[\w-]+|min-\[|max-\[)\:` and `-\[` arbitrary values) in a `.tsx`, `.astro` or `.md`; runs in `npm run check`, so CI's `static` job runs it; the allowlist is empty | `scripts/check-tailwind.mjs`, its test, `package.json`, skills (`developer` §4a, `checks`) | `npm run check` | small |

PRs 3 to 6 may run in parallel by folder (`theme/` and `src/` do not share files). Between 3 and 10 both systems live side by side, which is why the ratchet exists: a new utility in new code fails it.
Order, as the owner asked: rename (0), breakpoints (2), layout classes (3-6), text styles (7, 8, 9), removing the packages (10), the permanent check (11).

## 7. Risks

1. **The editor is 85% of the work** and is still being redrawn in 0.20. Mitigation: it moves after 0.20 (decision 5); `src/` slices are mechanical and reviewable by `compare-styles`.
2. **Silent breakage of installed themes and apps** (§5), size unknown because those repositories were not attached. Mitigation: attach them now and count before the owner chooses the removal line.
3. **Preflight and prose are invisible dependencies.** Mitigation: computed-style comparison on every element, not eyeballing; the prose fixture; the preflight-free proof build in PR 8.
4. **Cascade order.** Tailwind's `@layer` order and `utilities` winning over `components` is relied on (`base.css:4`, `blocks.css:2080`); a changed layer order shifts results without any error. Mitigation: the layer list stays `theme, base, components, utilities, fallback` until PR 10, and `compare-styles` runs in every step.
5. **`space-y-*` becoming `gap` is not byte-identical in margins** (the first child, a hidden child, collapsing). Mitigation: the comparison catches it; where the box model differs, the part gets a rule instead of a `mo-stack`.
6. **A second proof tool to build and trust** (`compare-styles`: font loading, animations, `data-reveal` and the motion scripts must be frozen to compare). Mitigation: PR 1 is its own pull request, proven on a no-op and on one known one-pixel change before anything depends on it.

Not done here: no code, no build, no check; `morpheme-apps`, `morpheme-staging`, `morpheme-website` not read; web.dev and caniuse not reachable.

## Appendix A: every utility class in markup (class, uses, the CSS Tailwind makes of it)

`consts only` = it appears only in a string constant, not in a class attribute. From `node classes.mjs` + `appendix.mjs` (Tailwind 4.3.5, the repo's `@theme` and `@utility` rules). Replacement: by family, §3.3.

| Class | Uses | CSS |
| :-- | --: | :-- |
| `flex` | 157 | `display: flex;` |
| `text-on-surface-variant` | 133 | `color: var(--mo-on-surface-variant);` |
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
| `border-outline-variant` | 20 | `border-color: var(--mo-outline-variant);` |
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
| `text-primary` | 11 | `color: var(--mo-primary);` |
| `bg-surface-container-high` | 10 | `background-color: var(--mo-surface-container-high);` |
| `mx-auto` | 10 | `margin-inline: auto;` |
| `rounded-xl` | 10 | `border-radius: var(--radius-xl);` |
| `space-y-3` | 10 | `:where(.space-y-3 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 3) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` |
| `type-body-medium` | 10 | `font-size: var(--type-body-medium-size); line-height: var(--type-body-medium-line-height); font-weight: var(--type-body-medium-weight); letter-spacing: var(--type-body-med` |
| `mt-4` | 9 | `margin-top: calc(var(--spacing) * 4);` |
| `px-3` | 9 | `padding-inline: calc(var(--spacing) * 3);` |
| `text-title-large` | 9 | `font-size: var(--type-title-large-size); line-height: var(--tw-leading, var(--type-title-large-line-height)); letter-spacing: var(--tw-tracking, var(--type-title-large-tra` |
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
| `bg-primary` | 6 | `background-color: var(--mo-primary);` |
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
| `text-on-surface` | 6 | `color: var(--mo-on-surface);` |
| `text-xs` | 6 | `font-size: var(--text-xs); line-height: var(--tw-leading, var(--text-xs--line-height));` |
| `w-[20.5rem]` | 6 | `width: 20.5rem;` |
| `bg-surface-container-lowest` | 5 | `background-color: var(--mo-surface-container-lowest);` |
| `hover:text-primary` | 5 | `@media (hover: hover) { .hover:text-primary:hover { color: var(--mo-primary); }` |
| `max-w-none` | 5 | `max-width: none;` |
| `mt-auto` | 5 | `margin-top: auto;` |
| `pr-1.5` | 5 | `padding-right: calc(var(--spacing) * 1.5);` |
| `rounded-(--block-radius-small)` | 5 | `border-radius: var(--block-radius-small);` |
| `rounded-(--block-radius)` | 5 | `border-radius: var(--block-radius);` |
| `rounded-2xl` | 5 | `border-radius: var(--radius-2xl);` |
| `tabular-nums` | 5 | `--tw-numeric-spacing: tabular-nums; font-variant-numeric: var(--tw-ordinal, ) var(--tw-slashed-zero, ) var(--tw-numeric-figure, ) var(--tw-numeric-spacing, ) var(--tw-numeric-` |
| `text-base` | 5 | `font-size: var(--text-base); line-height: var(--tw-leading, var(--text-base--line-height));` |
| `text-body-large` | 5 | `font-size: var(--type-body-large-size); line-height: var(--tw-leading, var(--type-body-large-line-height)); letter-spacing: var(--tw-tracking, var(--type-body-large-trackin` |
| `text-center` | 5 | `text-align: center;` |
| `top-0` | 5 | `top: 0px;` |
| `transition-transform` | 5 | `transition-property: transform, translate, scale, rotate; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: v` |
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
| `px-(--grid-margin)` | 4 | `padding-inline: var(--grid-margin);` |
| `rounded-(--theme-picture-radius)` | 4 | `border-radius: var(--theme-picture-radius);` |
| `size-10` | 4 | `width: calc(var(--spacing) * 10); height: calc(var(--spacing) * 10);` |
| `transition-colors` | 4 | `transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to; t` |
| `type-title-medium` | 4 | `font-size: var(--type-title-medium-size); line-height: var(--type-title-medium-line-height); font-weight: var(--type-title-medium-weight); letter-spacing: var(--type-titl` |
| `z-10` | 4 | `z-index: 10;` |
| `[--card-padding:1rem_0_0.5rem]` | 3 | `--card-padding: 1rem 0 0.5rem;` |
| `aspect-[16/10]` | 3 | `aspect-ratio: 16/10;` |
| `aspect-[3/2]` | 3 | `aspect-ratio: 3/2;` |
| `aspect-square` | 3 | `aspect-ratio: 1 / 1;` |
| `border-b` | 3 | `border-bottom-style: var(--tw-border-style); border-bottom-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `expanded:hidden` | 3 | `@media (width >= 52.5rem) { .expanded:hidden { display: none; }` |
| `focus-visible:ring-2` | 3 | `--tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor); box-shadow: var(--tw-inset-sha` |
| `focus-visible:ring-primary` | 3 | `--tw-ring-color: var(--mo-primary);` |
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
| `rounded-panel` | 3 | `border-radius: var(--radius);` |
| `self-start` | 3 | `align-self: flex-start;` |
| `size-12` | 3 | `width: calc(var(--spacing) * 12); height: calc(var(--spacing) * 12);` |
| `size-16` | 3 | `width: calc(var(--spacing) * 16); height: calc(var(--spacing) * 16);` |
| `size-6` | 3 | `width: calc(var(--spacing) * 6); height: calc(var(--spacing) * 6);` |
| `size-7` | 3 | `width: calc(var(--spacing) * 7); height: calc(var(--spacing) * 7);` |
| `size-8` | 3 | `width: calc(var(--spacing) * 8); height: calc(var(--spacing) * 8);` |
| `text-(--google-text)` | 3 | `color: var(--google-text);` |
| `text-2xl` | 3 | `font-size: var(--text-2xl); line-height: var(--tw-leading, var(--text-2xl--line-height));` |
| `touch-none` | 3 | `touch-action: none;` |
| `type-headline-small` | 3 | `font-size: var(--type-headline-small-size); line-height: var(--type-headline-small-line-height); font-weight: var(--type-headline-small-weight); letter-spacing: var(--t` |
| `-mx-3` | 2 | `margin-inline: calc(var(--spacing) * -3);` |
| `-mx-4` | 2 | `margin-inline: calc(var(--spacing) * -4);` |
| `-my-3` | 2 | `margin-block: calc(var(--spacing) * -3);` |
| `-rotate-90` | 2 | `rotate: calc(90deg * -1);` |
| `[--card-padding:1rem]` | 2 | `--card-padding: 1rem;` |
| `[--grid-columns:2]` | 2 | `--grid-columns: 2;` |
| `[&>.text-section]:mt-0` | 2 | `[&>.text-section]:mt-0 > .text-section { margin-top: 0px;` |
| `[&>p:first-child]:type-lead` | 2 | `[&>p:first-child]:type-lead > p:first-child { --prose-space: 1.5rem; font-size: var(--type-lead-size); line-height: var(--type-lead-line-height); font-weight: var(--type-lead-weight); letter` |
| `[overflow-wrap:anywhere]` | 2 | `overflow-wrap: anywhere;` |
| `[text-box:trim-both_cap_alphabetic]` | 2 | `text-box: trim-both cap alphabetic;` |
| `bg-outline-variant/40` | 2 | `background-color: color-mix(in oklab, var(--mo-outline-variant) 40%, transparent);` |
| `bg-surface-container` | 2 | `background-color: var(--mo-surface-container);` |
| `bg-surface-container-low` | 2 | `background-color: var(--mo-surface-container-low);` |
| `bg-white` | 2 | `background-color: var(--color-white);` |
| `border-[1.5px]` | 2 | `border-style: var(--tw-border-style); border-width: 1.5px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-0` | 2 | `border-style: var(--tw-border-style); border-width: 0px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `bottom-0` | 2 | `bottom: 0px;` |
| `bottom-3` | 2 | `bottom: calc(var(--spacing) * 3);` |
| `expanded:block` | 2 | `@media (width >= 52.5rem) { .expanded:block { display: block; }` |
| `expanded:col-span-5` | 2 | `@media (width >= 52.5rem) { .expanded:col-span-5 { grid-column: span 5 / span 5; }` |
| `expanded:grid-cols-12` | 2 | `@media (width >= 52.5rem) { .expanded:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }` |
| `grid-cols-[repeat(auto-fill,minmax(3rem,1fr))]` | 2 | `grid-template-columns: repeat(auto-fill,minmax(3rem,1fr));` |
| `group-hover:text-primary` | 2 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:text-primary) { color: var(--mo-primary); }` |
| `h-10` | 2 | `height: calc(var(--spacing) * 10);` |
| `h-12` | 2 | `height: calc(var(--spacing) * 12);` |
| `h-auto` | 2 | `height: auto;` |
| `h-dvh` | 2 | `height: 100dvh;` |
| `h-full` | 2 | `height: 100%;` |
| `hover:bg-surface-container-high` | 2 | `@media (hover: hover) { .hover:bg-surface-container-high:hover { background-color: var(--mo-surface-container-high); }` |
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
| `shadow-soft` | 2 | `--tw-shadow: var(--panel-shadow); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); } @pro` |
| `size-11` | 2 | `width: calc(var(--spacing) * 11); height: calc(var(--spacing) * 11);` |
| `size-20` | 2 | `width: calc(var(--spacing) * 20); height: calc(var(--spacing) * 20);` |
| `top-2` | 2 | `top: calc(var(--spacing) * 2);` |
| `tracking-tight` | 2 | `--tw-tracking: var(--tracking-tight); letter-spacing: var(--tracking-tight); } @property --tw-tracking { syntax: "*"; inherits: false;` |
| `transition-opacity` | 2 | `transition-property: opacity; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-duration, var(--defaul` |
| `type-body-large` | 2 | `font-size: var(--type-body-large-size); line-height: var(--type-body-large-line-height); font-weight: var(--type-body-large-weight); letter-spacing: var(--type-body-large-t` |
| `type-body-small` | 2 | `font-size: var(--type-body-small-size); line-height: var(--type-body-small-line-height); font-weight: var(--type-body-small-weight); letter-spacing: var(--type-body-small-t` |
| `type-headline-large` | 2 | `font-size: var(--type-headline-large-size); line-height: var(--type-headline-large-line-height); font-weight: var(--type-headline-large-weight); letter-spacing: var(--t` |
| `type-title-large` | 2 | `font-size: var(--type-title-large-size); line-height: var(--type-title-large-line-height); font-weight: var(--type-title-large-weight); letter-spacing: var(--type-title-la` |
| `underline` | 2 | `text-decoration-line: underline;` |
| `uppercase` | 2 | `text-transform: uppercase;` |
| `w-[36rem]` | 2 | `width: 36rem;` |
| `w-9` | 2 | `width: calc(var(--spacing) * 9);` |
| `-me-[calc((var(--icon-button-width)-1.5rem)/2)]` | 1 | `margin-inline-end: calc(calc((var(--icon-button-width) - 1.5rem) / 2) * -1);` |
| `-ml-2` | 1 | `margin-left: calc(var(--spacing) * -2);` |
| `-ms-2.5` | 1 | `margin-inline-start: calc(var(--spacing) * -2.5);` |
| `-mx-6` | 1 | `margin-inline: calc(var(--spacing) * -6);` |
| `-outline-offset-2` | 1 | `outline-offset: calc(2px * -1);` |
| `[--card-elevated-shadow:var(--mo-elevation-1-shadow)]` | 1 | `--card-elevated-shadow: var(--mo-elevation-1-shadow);` |
| `[--card-padding:0]` | 1 | `--card-padding: 0;` |
| `[-webkit-touch-callout:none]` | 1 | `-webkit-touch-callout: none;` |
| `[[data-fold-section]+&]:mt-0` | 1 | `[data-fold-section] + .[[data-fold-section]+&]:mt-0 { margin-top: 0px;` |
| `[@media(width<37.5rem)]:my-0` | 1 | `@media (width<37.5rem) { .[@media(width<37.5rem)]:my-0 { margin-block: 0px; }` |
| `[&_.navigation-rail-items]:flex-1` | 1 | `[&_.navigation-rail-items]:flex-1 .navigation-rail-items { flex: 1;` |
| `[&:has(+[data-fold-section])]:mb-0` | 1 | `[&:has(+[data-fold-section])]:mb-0:has( + [data-fold-section]) { margin-bottom: 0px;` |
| `[&:not(:has([data-part]))]:hidden` | 1 | `display: none;` |
| `[&:not([data-tooltip-open])>.tooltip]:invisible` | 1 | `[&:not([data-tooltip-open])>.tooltip]:invisible:not([data-tooltip-open]) > .tooltip { visibility: hidden;` |
| `[&:not([data-tooltip-open])>.tooltip]:opacity-0` | 1 | `[&:not([data-tooltip-open])>.tooltip]:opacity-0:not([data-tooltip-open]) > .tooltip { opacity: 0%;` |
| `[&>.tooltip]:bottom-auto` | 1 | `[&>.tooltip]:bottom-auto > .tooltip { bottom: auto;` |
| `[&>.tooltip]:end-0` | 1 | `[&>.tooltip]:end-0 > .tooltip { inset-inline-end: calc(var(--spacing) * 0);` |
| `[&>.tooltip]:max-w-60` | 1 | `[&>.tooltip]:max-w-60 > .tooltip { max-width: calc(var(--spacing) * 60);` |
| `[&>.tooltip]:start-auto` | 1 | `[&>.tooltip]:start-auto > .tooltip { inset-inline-start: auto;` |
| `[&>.tooltip]:top-[calc(100%-0.5rem)]` | 1 | `[&>.tooltip]:top-[calc(100%-0.5rem)] > .tooltip { top: calc(100% - 0.5rem);` |
| `[&>svg]:duration-(--motion-spatial-duration)` | 1 | `[&>svg]:duration-(--motion-spatial-duration) > svg { --tw-duration: var(--motion-spatial-duration); transition-duration: var(--motion-spatial-duration); } @property --tw-duration { syntax: "` |
| `[&>svg]:ease-(--motion-ease)` | 1 | `[&>svg]:ease-(--motion-ease) > svg { --tw-ease: var(--motion-ease); transition-timing-function: var(--motion-ease); } @property --tw-ease { syntax: "*"; inherits: false;` |
| `[&>svg]:transition-transform` | 1 | `[&>svg]:transition-transform > svg { transition-property: transform, translate, scale, rotate; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transiti` |
| `[contain:layout]` | 1 | `contain: layout;` |
| `[container-type:size]` | 1 | `container-type: size;` |
| `[mask-position:center]` | 1 | `mask-position: center;` |
| `[mask-repeat:no-repeat]` | 1 | `mask-repeat: no-repeat;` |
| `[mask-size:contain]` | 1 | `mask-size: contain;` |
| `[scrollbar-width:none]` | 1 | `scrollbar-width: none;` |
| `[transition:scale_var(--motion-spatial-slow)]` | 1 | `transition: scale var(--motion-spatial-slow);` |
| `*:flex-1` | 1 | `:is(.*:flex-1 > *) { flex: 1;` |
| `*:min-w-48` | 1 | `:is(.*:min-w-48 > *) { min-width: calc(var(--spacing) * 48);` |
| `align-middle` | 1 | `vertical-align: middle;` |
| `aria-[current=location]:text-primary` | 1 | `color: var(--mo-primary);` |
| `aspect-[1.91/1]` | 1 | `aspect-ratio: 1.91/1;` |
| `aspect-[3/4]` | 1 | `aspect-ratio: 3/4;` |
| `aspect-[4/3]` | 1 | `aspect-ratio: 4/3;` |
| `basis-full` | 1 | `flex-basis: 100%;` |
| `bg-(--editor-status-good)` | 1 | `background-color: var(--editor-status-good);` |
| `bg-(--google-background)` | 1 | `background-color: var(--google-background);` |
| `bg-(--google-icon-fill)` | 1 | `background-color: var(--google-icon-fill);` |
| `bg-(--navigation-rail-surface,var(--mo-surface))` | 1 | `background-color: var(--navigation-rail-surface,var(--mo-surface));` |
| `bg-center` | 1 | `background-position: center;` |
| `bg-cover` | 1 | `background-size: cover;` |
| `bg-outline` | 1 | `background-color: var(--mo-outline);` |
| `bg-outline-variant` | 1 | `background-color: var(--mo-outline-variant);` |
| `bg-outline-variant/50` | 1 | `background-color: color-mix(in oklab, var(--mo-outline-variant) 50%, transparent);` |
| `bg-secondary-container` | 1 | `background-color: var(--mo-secondary-container);` |
| `bg-surface` | 1 | `background-color: var(--mo-surface);` |
| `bg-tertiary-container` | 1 | `background-color: var(--mo-tertiary-container);` |
| `bg-transparent` | 1 | `background-color: transparent;` |
| `border-(--google-icon-ring)` | 1 | `border-color: var(--google-icon-ring);` |
| `border-current` | 1 | `border-color: currentcolor;` |
| `border-dashed` | 1 | `--tw-border-style: dashed; border-style: dashed;` |
| `border-l-2` | 1 | `border-left-style: var(--tw-border-style); border-left-width: 2px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-primary` | 1 | `border-color: var(--mo-primary);` |
| `border-t-2` | 1 | `border-top-style: var(--tw-border-style); border-top-width: 2px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-x` | 1 | `border-inline-style: var(--tw-border-style); border-inline-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `cursor-ew-resize` | 1 | `cursor: ew-resize;` |
| `cursor-grab` | 1 | `cursor: grab;` |
| `data-[clearance=true]:mb-[var(--fab-room)]` | 1 | `margin-bottom: var(--fab-room);` |
| `disabled:opacity-60` | 1 | `opacity: 60%;` |
| `duration-(--motion-effects-duration)` | 1 | `--tw-duration: var(--motion-effects-duration); transition-duration: var(--motion-effects-duration); } @property --tw-duration { syntax: "*"; inherits: ` |
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
| `fill-(--editor-status-bad)` | 1 | `fill: var(--editor-status-bad);` |
| `first-of-type:border-t-0` | 1 | `border-top-style: var(--tw-border-style); border-top-width: 0px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid; ` |
| `first-of-type:pt-0` | 1 | `padding-top: 0px;` |
| `fixed` | 1 | `position: fixed;` |
| `focus-visible:outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `focus-visible:outline-offset-[-8px]` | 1 | `outline-offset: -8px;` |
| `focus-visible:ring-offset-2` | 1 | `--tw-ring-offset-width: 2px; --tw-ring-offset-shadow: var(--tw-ring-inset, ) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);` |
| `focus-visible:underline` | 1 | `text-decoration-line: underline;` |
| `focus:bg-primary` | 1 | `background-color: var(--mo-primary);` |
| `focus:fixed` | 1 | `position: fixed;` |
| `focus:left-4` | 1 | `left: calc(var(--spacing) * 4);` |
| `focus:not-sr-only` | 1 | `position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip-path: none; white-space: normal;` |
| `focus:px-4` | 1 | `padding-inline: calc(var(--spacing) * 4);` |
| `focus:py-2` | 1 | `padding-block: calc(var(--spacing) * 2);` |
| `focus:rounded-full` | 1 | `border-radius: calc(infinity * 1px);` |
| `focus:text-on-primary` | 1 | `color: var(--mo-on-primary);` |
| `focus:top-4` | 1 | `top: calc(var(--spacing) * 4);` |
| `focus:z-50` | 1 | `z-index: 50;` |
| `font-[arial,sans-serif]` | 1 | `font-family: arial,sans-serif;` |
| `font-bold` | 1 | `--tw-font-weight: var(--font-weight-bold); font-weight: var(--font-weight-bold); } @property --tw-font-weight { syntax: "*"; inherits: false;` |
| `font-sans` | 1 | `font-family: 'Roboto Variable', Roboto, ui-sans-serif, system-ui, sans-serif;` |
| `gap-(--card-gap)` | 1 | `gap: var(--card-gap);` |
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
| `group-focus-visible:bg-primary` | 1 | `:is(:where(.group):focus-visible .group-focus-visible:bg-primary) { background-color: var(--mo-primary);` |
| `group-hover:bg-primary` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:bg-primary) { background-color: var(--mo-primary); }` |
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
| `has-focus-visible:outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: so` |
| `has-focus-visible:outline-offset-2` | 1 | `outline-offset: 2px;` |
| `has-focus-visible:outline-primary` | 1 | `outline-color: var(--mo-primary);` |
| `hover:scale-105` | 1 | `@media (hover: hover) { .hover:scale-105:hover { --tw-scale-x: 105%; --tw-scale-y: 105%; --tw-scale-z: 105%; scale: var(--tw-scale-x) var(--tw-scale-y); } } @property --tw-scale-x { syntax: ` |
| `hover:text-on-surface` | 1 | `@media (hover: hover) { .hover:text-on-surface:hover { color: var(--mo-on-surface); }` |
| `inset-x-3` | 1 | `inset-inline: calc(var(--spacing) * 3);` |
| `invisible` | 1 | `visibility: hidden;` |
| `large:absolute` | 1 | `@media (width >= 75rem) { .large:absolute { position: absolute; }` |
| `large:col-start-1` | 1 | `@media (width >= 75rem) { .large:col-start-1 { grid-column-start: 1; }` |
| `large:end-0` | 1 | `@media (width >= 75rem) { .large:end-0 { inset-inline-end: calc(var(--spacing) * 0); }` |
| `large:group-data-crowded/header:hidden` | 1 | `@media (width >= 75rem) { :is(:where(.group/header)[data-crowded] .large:group-data-crowded/header:hidden) { display: none; }` |
| `large:inset-y-0` | 1 | `@media (width >= 75rem) { .large:inset-y-0 { inset-block: 0px; }` |
| `large:mt-(--section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:mt-(--section-pane-gap) { margin-top: var(--section-pane-gap); }` |
| `large:pe-(--section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:pe-(--section-pane-gap) { padding-inline-end: var(--section-pane-gap); }` |
| `large:row-span-2` | 1 | `@media (width >= 75rem) { .large:row-span-2 { grid-row: span 2 / span 2; }` |
| `large:row-start-1` | 1 | `@media (width >= 75rem) { .large:row-start-1 { grid-row-start: 1; }` |
| `large:shrink-0` | 1 | `@media (width >= 75rem) { .large:shrink-0 { flex-shrink: 0; }` |
| `large:sticky` | 1 | `@media (width >= 75rem) { .large:sticky { position: sticky; }` |
| `large:top-(--section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:top-(--section-pane-gap) { top: var(--section-pane-gap); }` |
| `large:w-(--section-pane-width)` | 1 | `@media (width >= 75rem) { .large:w-(--section-pane-width) { width: var(--section-pane-width); }` |
| `large:whitespace-nowrap` | 1 | `@media (width >= 75rem) { .large:whitespace-nowrap { white-space: nowrap; }` |
| `large:z-10` | 1 | `@media (width >= 75rem) { .large:z-10 { z-index: 10; }` |
| `leading-[22px]` | 1 | `--tw-leading: 22px; line-height: 22px; } @property --tw-leading { syntax: "*"; inherits: false;` |
| `leading-[26px]` | 1 | `--tw-leading: 26px; line-height: 26px; } @property --tw-leading { syntax: "*"; inherits: false;` |
| `leading-[var(--type-headline-small-line-height)]` | 1 | `--tw-leading: var(--type-headline-small-line-height); line-height: var(--type-headline-small-line-height); } @property --tw-leading { synta` |
| `leading-none` | 1 | `--tw-leading: 1; line-height: 1; } @property --tw-leading { syntax: "*"; inherits: false;` |
| `left-1/2` | 1 | `left: calc(1 / 2 * 100%);` |
| `left-4` | 1 | `left: calc(var(--spacing) * 4);` |
| `list-disc` | 1 | `list-style-type: disc;` |
| `list-none` | 1 | `list-style-type: none;` |
| `marker:text-primary` | 1 | `marker:text-primary ::marker { color: var(--mo-primary); } .marker:text-primary::marker { color: var(--mo-primary); } .marker:text-primary ::-webkit-details-marker { color: var(--mo-primary)` |
| `max-expanded:sr-only` | 1 | `@media (width < 52.5rem) { .max-expanded:sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border` |
| `max-h-[50dvh]` | 1 | `max-height: 50dvh;` |
| `max-h-[calc(100dvh-1.5rem)]` | 1 | `max-height: calc(100dvh - 1.5rem);` |
| `max-h-[calc(100dvh-2*var(--section-pane-gap))]` | 1 | `max-height: calc(100dvh - 2 * var(--section-pane-gap));` |
| `max-h-[calc(100dvh-3rem)]` | 1 | `max-height: calc(100dvh - 3rem);` |
| `max-h-24` | 1 | `max-height: calc(var(--spacing) * 24);` |
| `max-medium:hidden` | 1 | `@media (width < 37.5rem) { .max-medium:hidden { display: none; }` |
| `max-w-[18ch]` | 1 | `max-width: 18ch;` |
| `max-w-[45rem]` | 1 | `max-width: 45rem;` |
| `max-w-[500px]` | 1 | `max-width: 500px;` |
| `max-w-[62ch]` | 1 | `max-width: 62ch;` |
| `max-w-[75ch]` | 1 | `max-width: 75ch;` |
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
| `medium:mt-14` | 1 | `@media (width >= 37.5rem) { .medium:mt-14 { margin-top: calc(var(--spacing) * 14); }` |
| `medium:mt-28` | 1 | `@media (width >= 37.5rem) { .medium:mt-28 { margin-top: calc(var(--spacing) * 28); }` |
| `medium:mx-0` | 1 | `@media (width >= 37.5rem) { .medium:mx-0 { margin-inline: 0px; }` |
| `medium:overflow-visible` | 1 | `@media (width >= 37.5rem) { .medium:overflow-visible { overflow: visible; }` |
| `medium:p-6` | 1 | `@media (width >= 37.5rem) { .medium:p-6 { padding: calc(var(--spacing) * 6); }` |
| `medium:p-8` | 1 | `@media (width >= 37.5rem) { .medium:p-8 { padding: calc(var(--spacing) * 8); }` |
| `medium:pb-4` | 1 | `@media (width >= 37.5rem) { .medium:pb-4 { padding-bottom: calc(var(--spacing) * 4); }` |
| `medium:pl-1` | 1 | `@media (width >= 37.5rem) { .medium:pl-1 { padding-left: var(--spacing); }` |
| `medium:pr-72` | 1 | `@media (width >= 37.5rem) { .medium:pr-72 { padding-right: calc(var(--spacing) * 72); }` |
| `medium:pt-(--theme-section-space-large)` | 1 | `@media (width >= 37.5rem) { .medium:pt-(--theme-section-space-large) { padding-top: var(--theme-section-space-large); }` |
| `medium:pt-8` | 1 | `@media (width >= 37.5rem) { .medium:pt-8 { padding-top: calc(var(--spacing) * 8); }` |
| `medium:px-0` | 1 | `@media (width >= 37.5rem) { .medium:px-0 { padding-inline: 0px; }` |
| `medium:px-7` | 1 | `@media (width >= 37.5rem) { .medium:px-7 { padding-inline: calc(var(--spacing) * 7); }` |
| `medium:py-16` | 1 | `@media (width >= 37.5rem) { .medium:py-16 { padding-block: calc(var(--spacing) * 16); }` |
| `medium:select-auto` | 1 | `@media (width >= 37.5rem) { .medium:select-auto { -webkit-user-select: auto; user-select: auto; }` |
| `medium:touch-auto` | 1 | `@media (width >= 37.5rem) { .medium:touch-auto { touch-action: auto; }` |
| `medium:type-display-medium` | 1 | `@media (width >= 37.5rem) { .medium:type-display-medium { font-size: var(--type-display-medium-size); line-height: var(--type-display-medium-line-height); font-weight: var(--type-display-med` |
| `medium:type-display-small` | 1 | `@media (width >= 37.5rem) { .medium:type-display-small { font-size: var(--type-display-small-size); line-height: var(--type-display-small-line-height); font-weight: var(--type-display-small-` |
| `medium:type-headline-large` | 1 | `@media (width >= 37.5rem) { .medium:type-headline-large { font-size: var(--type-headline-large-size); line-height: var(--type-headline-large-line-height); font-weight: var(--type-headline-la` |
| `medium:type-title-large` | 1 | `@media (width >= 37.5rem) { .medium:type-title-large { font-size: var(--type-title-large-size); line-height: var(--type-title-large-line-height); font-weight: var(--type-title-large-weight);` |
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
| `outline-outline-variant` | 1 | `outline-color: var(--mo-outline-variant);` |
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
| `placeholder:text-on-surface-variant/60` | 1 | `color: color-mix(in oklab, var(--mo-on-surface-variant) 60%, transparent);` |
| `pr-12` | 1 | `padding-right: calc(var(--spacing) * 12);` |
| `pr-2` | 1 | `padding-right: calc(var(--spacing) * 2);` |
| `pr-4` | 1 | `padding-right: calc(var(--spacing) * 4);` |
| `ps-0` | 1 | `padding-inline-start: 0px;` |
| `ps-5` | 1 | `padding-inline-start: calc(var(--spacing) * 5);` |
| `pt-(--theme-section-space)` | 1 | `padding-top: var(--theme-section-space);` |
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
| `ring-2` | 1 | `--tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-sh` |
| `ring-surface` | 1 | `--tw-ring-color: var(--mo-surface);` |
| `rounded-[1.375rem]` | 1 | `border-radius: 1.375rem;` |
| `rounded-[3px]` | 1 | `border-radius: 3px;` |
| `rounded-[inherit]` | 1 | `border-radius: inherit;` |
| `rounded-b-panel` | 1 | `border-bottom-right-radius: var(--radius); border-bottom-left-radius: var(--radius);` |
| `rounded-t-panel` | 1 | `border-top-left-radius: var(--radius); border-top-right-radius: var(--radius);` |
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
| `text-(--google-date)` | 1 | `color: var(--google-date);` |
| `text-(--google-icon-letter)` | 1 | `color: var(--google-icon-letter);` |
| `text-(--google-site)` | 1 | `color: var(--google-site);` |
| `text-[20px]` | 1 | `font-size: 20px;` |
| `text-[length:var(--type-headline-small-size)]` | 1 | `font-size: var(--type-headline-small-size);` |
| `text-display-small` | 1 | `font-size: var(--type-display-small-size); line-height: var(--tw-leading, var(--type-display-small-line-height)); letter-spacing: var(--tw-tracking, var(--type-display-s` |
| `text-left` | 1 | `text-align: left;` |
| `text-on-primary` | 1 | `color: var(--mo-on-primary);` |
| `text-on-secondary-container` | 1 | `color: var(--mo-on-secondary-container);` |
| `text-on-tertiary-container` | 1 | `color: var(--mo-on-tertiary-container);` |
| `text-right` | 1 | `text-align: right;` |
| `text-start` | 1 | `text-align: start;` |
| `text-title-medium` | 1 | `font-size: var(--type-title-medium-size); line-height: var(--tw-leading, var(--type-title-medium-line-height)); letter-spacing: var(--tw-tracking, var(--type-title-medium` |
| `text-title-small` | 1 | `font-size: var(--type-title-small-size); line-height: var(--tw-leading, var(--type-title-small-line-height)); letter-spacing: var(--tw-tracking, var(--type-title-small-tra` |
| `top-[env(safe-area-inset-top)]` | 1 | `top: env(safe-area-inset-top);` |
| `top-1` | 1 | `top: var(--spacing);` |
| `top-1/2` | 1 | `top: calc(1 / 2 * 100%);` |
| `top-3` | 1 | `top: calc(var(--spacing) * 3);` |
| `top-8` | 1 | `top: calc(var(--spacing) * 8);` |
| `top-full` | 1 | `top: 100%;` |
| `tracking-wide` | 1 | `--tw-tracking: var(--tracking-wide); letter-spacing: var(--tracking-wide); } @property --tw-tracking { syntax: "*"; inherits: false;` |
| `transform-gpu` | 1 | `transform: translateZ(0) var(--tw-rotate-x, ) var(--tw-rotate-y, ) var(--tw-rotate-z, ) var(--tw-skew-x, ) var(--tw-skew-y, );` |
| `transition-[stroke-dasharray]` | 1 | `transition-property: stroke-dasharray; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-du` |
| `type-headline-medium` | 1 | `font-size: var(--type-headline-medium-size); line-height: var(--type-headline-medium-line-height); font-weight: var(--type-headline-medium-weight); letter-spacing: var` |
| `type-label-large` | 1 | `font-size: var(--type-label-large-size); line-height: var(--type-label-large-line-height); font-weight: var(--type-label-large-weight); letter-spacing: var(--type-label-la` |
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
| `-translate-x-1/2` | consts only | `--tw-translate-x: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); } @property --tw-translate-x { syntax: "*"; inherits: false; initi` |
| `-translate-y-1/2` | consts only | `--tw-translate-y: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); } @property --tw-translate-x { syntax: "*"; inherits: false; initi` |
| `border-[3px]` | consts only | `border-style: var(--tw-border-style); border-width: 3px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-[rgb(128_128_128/0.45)]` | consts only | `border-color: rgb(128 128 128/0.45);` |
| `border-l` | consts only | `border-left-style: var(--tw-border-style); border-left-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` |
| `border-white` | consts only | `border-color: var(--color-white);` |
| `large:col-start-2` | consts only | `@media (width >= 75rem) { .large:col-start-2 { grid-column-start: 2; }` |
| `medium:mt-8` | consts only | `@media (width >= 37.5rem) { .medium:mt-8 { margin-top: calc(var(--spacing) * 8); }` |
| `pointer-events-none` | consts only | `pointer-events: none;` |
| `shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.3)]` | consts only | `--tw-shadow: 0 0 0 1px var(--tw-shadow-color, rgb(0 0 0/0.3)), 0 2px 6px var(--tw-shadow-color, rgb(0 0 0/0.3)); box-shadow: var(` |
| `text-(--mo-error)` | consts only | `color: var(--mo-error);` |
| `w-[22.5rem]` | consts only | `width: 22.5rem;` |
