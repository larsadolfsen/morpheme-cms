# Migrating a theme or an app away from Tailwind

For authors of themes and apps. The CMS stops building Tailwind in 0.19.0, together with contract 7. A theme or an app
written to contract 7 uses no utility class, no `theme()`, no `@theme`, no `@apply` and no `@source`. This page says what
to write instead. Everything on it can be done now: it works with the 0.18.0 CMS (contract 6) as well, so a theme or an app
released at 6 without utilities needs only its contract number changed for 7.

The class-by-class table is in [`tailwind-migration-classes.md`](tailwind-migration-classes.md) (578 classes, search it).
The layout classes are `mo-row`, `mo-stack` and the others below; their reference is [`theme-layout-classes.md`](theme-layout-classes.md). The contract is in [`app-contract.md`](app-contract.md), *Contract 7*.

## Why

- One dependency less: the CMS no longer ships `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/typography` or the Prettier plugin.
- One naming system: every shared custom property is `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`
  ([`css-tokens.md`](css-tokens.md)), and a class is either a part's own name or one of the small `mo-` layout classes.
- Plain CSS that any theme or app can read without a build step.

## What stops working

After contract 7 nothing builds these for you. A class or rule that uses them does nothing, without a message.

| Stops working | Example |
| :-- | :-- |
| A utility class | `flex items-center gap-2`, `px-4`, `text-sm`, `bg-surface` |
| A responsive variant | `medium:grid-cols-2`, `expanded:flex`, `large:hidden`, `min-[600px]:p-4` |
| A state variant | `hover:underline`, `focus-visible:outline-2`, `group-hover:opacity-100`, `has-[:checked]:bg-primary`, `aria-expanded:rotate-180`, `data-[open]:flex` |
| An arbitrary value or property | `w-[22.5rem]`, `[--mo-comp-card-padding:1rem]`, `[&>svg]:size-5` |
| `theme()` in CSS | `@media (width >= theme(--breakpoint-medium))` |
| `@theme`, `@apply`, `@utility`, `@source`, `@plugin` | `@apply flex gap-2;` |
| `--tw-*` custom properties | `var(--tw-translate-x)` (the text's colours are `--mo-comp-prose-*` since 0.19.0) |
| The typography plugin's classes other than the text style (`prose-lg`, `prose-invert` and the like) | `prose-lg`, `prose-invert`, `prose-a:underline` |

Renamed: `prose` is `mo-prose` and `not-prose` is `mo-is-not-prose` (the rename is also made in saved content, below). Still works: `post-lead`, `lead` and the type classes `mo-type-display-large` … `mo-type-lead`
([`type-classes.md`](type-classes.md)).

## What to write instead, by family

Tailwind's spacing step N is N × 4 px. In CSS write the token: step N is `var(--mo-ref-space-{N × 50})`, so `p-4` (16 px) is
`var(--mo-ref-space-200)`, `gap-2` is `--mo-ref-space-100`, `mb-8` is `--mo-ref-space-400`. Use logical properties
(`inline-size`, `margin-inline`, `padding-block`) and `gap`; a physical property only where it should not flip in a
right-to-left language.

| Family | Write instead |
| :-- | :-- |
| `flex`, `flex-col`, `flex-wrap`, `items-*`, `justify-*`, `gap-*`, `inline-flex` | `mo-row` / `mo-stack` and their modifiers, else `display: flex` in the part's own rule |
| `grid`, `grid-cols-*`, `col-*`, `medium:grid-cols-*` | `mo-grid` with `--mo-comp-grid-columns` (`mo-grid-2` …), or `.mo-staggered-grid` for card grids; subgrid where cards align their insides |
| `space-y-*` | `mo-stack` (`gap`). Same space, different mechanism: no margin on the first or last child |
| `m*`, `p*` | the part's own padding and margin in `--mo-ref-space-*`, with logical properties |
| `w-*`, `h-*`, `size-*`, `min-*`, `max-*` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio`; a centred maximum width is `mo-center` with `--mo-comp-center-measure` set on the element, and the width of text is `--mo-comp-block-text-measure-min` and `-max` |
| `text-sm`, `text-xs`, `text-title-large`, `font-*`, `leading-*` | a `mo-type-*` class, or `font` from `--mo-sys-typescale-*` in the part's rule |
| `text-*`, `bg-*`, `border-*` colours | the part's rule reads `var(--mo-sys-color-*)`; `text-on-surface-variant` becomes `color: var(--mo-sys-color-on-surface-variant)` in the part's own rule (no class) |
| `relative`, `absolute`, `inset-*`, `sticky`, `z-*`, `overflow-*` | the part's rule |
| `rounded-*`, `border`, `shadow-*` | the part's shape and elevation tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `hover:`, `focus-visible:`, `group-*:`, `has-*:`, `aria-*:`, `data-*:` | CSS state selectors, below |
| `medium:`, `expanded:`, `large:`, `min-[600px]:` | `@media (width >= …)` with a literal from the breakpoint table, below |
| `[--x:1rem]`, `[&>svg]:…`, `[container-type:size]` | the part's rule; set the custom property on the part's class |
| `transition-*`, `duration-*`, `ease-*` | the motion tokens in the part's rule |
| `sr-only` | `mo-visually-hidden` |

Examples, each with the CSS Tailwind made of it (from [`tailwind-migration-classes.md`](tailwind-migration-classes.md)):

| Class | Tailwind made | Write |
| :-- | :-- | :-- |
| `flex items-center gap-2` | `display: flex; align-items: center; gap: …` | `class="mo-row"` |
| `flex-col` | `flex-direction: column;` | `class="mo-stack"` |
| `px-4` | `padding-inline: calc(var(--spacing) * 4);` | `padding-inline: var(--mo-ref-space-200);` |
| `w-full` | `width: 100%;` | `inline-size: 100%;` |
| `line-clamp-2` | `overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;` | `class="mo-clamp-2"` |

### Name a part, do not rebuild a utility

When a cluster of classes draws a surface or a control, give it a name after the part (`.header-actions`,
`.cookie-consent-row`) and write its CSS in the stylesheet of the part. Do not turn it into a new theme component and do
not write a utility-looking name (`.flex-center`, `.p-4`): the permanent check fails on a name that looks like one.

## The vocabulary

Layout only: a class never sets colour, type, shape or state. Each reads `--mo-ref-space-*`; a class that takes a value
reads a component token that you override on the element that needs another value.

| Class | What it is |
| :-- | :-- |
| `mo-row` | `display: flex; align-items: center; gap: var(--mo-comp-row-gap)`. Modifiers: `mo-row-wrap` (`flex-wrap: wrap`), `mo-row-start` (`align-items: flex-start`), `mo-row-end`, `mo-row-between` (`justify-content: space-between`) |
| `mo-stack` | `display: flex; flex-direction: column; gap: var(--mo-comp-stack-gap)` |
| `mo-grid` | `display: grid; gap: var(--mo-comp-grid-gap)` with `grid-template-columns: repeat(var(--mo-comp-grid-columns, 1), minmax(0, 1fr))`; `mo-grid-2`, `-3`, `-4` set the columns per breakpoint |
| `mo-fill` | `flex: 1 1 0; min-inline-size: 0` |
| `mo-keep` | `flex-shrink: 0` |
| `mo-truncate`, `mo-clamp-2` | one line with an ellipsis; two lines with an ellipsis |
| `mo-center` | `margin-inline: auto` and a maximum inline size from `--mo-comp-center-measure`, which you set on the element |
| `mo-cover` | `object-fit: cover; inline-size: 100%; block-size: 100%` |
| `mo-visually-hidden` | hidden for the eye, read by a screen reader |
| `mo-hidden`, `mo-contents` | `display: none`; `display: contents` |

Another gap: set the token on the element, for example `[--mo-comp-row-gap:var(--mo-ref-space-150)]` in a rule of the part
(`.toolbar { --mo-comp-row-gap: var(--mo-ref-space-150); }`). Never declare a name the CMS declares on `:root`, and never an
unprefixed name ([`css-tokens.md`](css-tokens.md)). A new vocabulary class needs three or more uses and is added to the CMS
first, never to a theme.

## The breakpoints

CSS cannot read a custom property inside `@media`, so write the literal. Use the range syntax and only these four values.

| Window class (Material 3) | From (dp) | From (rem) | Write |
| :-- | --: | --: | :-- |
| Compact | 0 | 0 | no query (the default) |
| Medium | 600 | `37.5rem` | `@media (width >= 37.5rem)` |
| Expanded | 840 | `52.5rem` | `@media (width >= 52.5rem)` |
| Large | 1200 | `75rem` | `@media (width >= 75rem)` |
| Extra large | 1600 | `100rem` | `@media (width >= 100rem)` |

For "below medium" write `@media (width < 37.5rem)`. A query that lists any other width is a problem for the check. The
values are the same as `lib/breakpoints.mjs`, and a script that needs a query uses `atLeast('medium')` from it. A component
that lives in different widths (a side sheet, the editor's Preview) can ask its own width with `@container`; a named
container query is free of the table.

## State variants as CSS

| Tailwind | CSS |
| :-- | :-- |
| `hover:bg-x` | `.part:hover { … }`; Tailwind wrapped it in `@media (hover: hover)`, so keep that |
| `focus-visible:outline-2` | `.part:focus-visible { outline: 2px solid …; }` |
| `group-hover:opacity-100` | `.parent:hover .part { … }` |
| `has-[:checked]:bg-primary` | `.part:has(:checked) { … }` |
| `aria-expanded:rotate-180` | `.part[aria-expanded='true'] { … }` |
| `data-[open]:flex` | `.part[data-open] { … }` |

Colours of a state come from the state layers (`--mo-sys-state-hover-state-layer-color`, `--mo-sys-state-pressed-state-layer-color`), not from a new colour.

## How to check

- `npm run check:tailwind` (this repository) and `check:content` (a site, so `check:themes` too: it reads the site's `src/themes`, `src/apps`, `src/site`
  and `src/content`, its `package.json` and Prettier's settings) fail on any Tailwind: a utility class or variant in markup, Markdown or a string, `@theme`,
  `@utility`, `@plugin`, `@apply`, `@source`, `@reference`, `theme(--`, `--tw-` in a stylesheet, or a tailwind package or Prettier plugin. The rules and the frozen
  list of utility names are `site/tailwind.mjs` and `site/tailwind-utilities.json`; the check has no allowlist, and each message names the file, the line and the rule.
- Before the break, check by hand: search your CSS, `.tsx` and `.astro` files for `theme(`, `@theme`, `@apply`, `@source`
  and a class in [`tailwind-migration-classes.md`](tailwind-migration-classes.md).
- Prove that nothing moved: build before and after and compare the pages. A change of margins is the one thing to watch:
  `space-y-*` becomes `gap`, which is the same space with another mechanism.

## The `mo-` names

Contract 7 also gives every class and custom property of ours the `mo-` prefix, so a theme or app migrates once. The pattern is
[`class-names.md`](class-names.md): `.card` becomes `.mo-card`, `.card-body` becomes `.mo-card__body`, a state becomes `mo-is-<word>`, a block part
becomes `mo-block-<type>__<part>`, the text style `prose` becomes `mo-prose` and its opt-out `not-prose` becomes `mo-is-not-prose`, and a hook or runtime value becomes `--mo-comp-<component>-<name>`. No old name stays.

The map of every name is `docs/superpowers/plans/mo-names/map.json` in this repository (made once, before the renames, and kept as the record): `classes` and
`properties` map each old name to its `new` name, with the rule that made it and how many places define and use it. A name with
`"status": "question"` has no new name yet; the owner decides it, and the map changes when the owner does. To migrate:

1. Search your CSS, `.tsx` and `.astro` files for each class and `--` name your code defines or reads that has no `mo-`.
2. Look it up in the map and write the new name everywhere: stylesheets, `class` and `className`, `classList`, `querySelector` and `closest`.
3. Keep the classes of other libraries (`ProseMirror*`, an embed's own) as they are.
4. `npm run check:mo-names` (this repository) and `check:content` (a site's `src/themes` and `src/apps`) fail on any class or custom property that does not start with `mo-`, on a `[class*=…]`, `[class^=…]` or `[style*=…]` selector that spells another name, and on a `mo-` class that does not have the pattern's shape. There is no allowlist; what is not ours (`ProseMirror*`, `cm-*`, `prose`, `dark`, the Markdown renderer's task-list classes) is listed with its reason in `NOT_RENAMED` of `scripts/mo-names.mjs`.

## Contract 7

`THEME_API` and `APP_API` become 7 and `APP_APIS` is `[7]` ([`app-contract.md`](app-contract.md), *Contract 7*). A theme or an
app written to 6 that uses none of the above changes only its contract number.
