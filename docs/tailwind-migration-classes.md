# Tailwind migration: every class and its replacement

Every utility class the CMS used in markup on 18 Nov 2026 (`f7d4a9ee`, Tailwind 4.3.5, the repository's `@theme` blocks): **578 classes**. Search the page for the class you have. Columns: the class, how many times it was used, the CSS Tailwind made of it, and what to write instead. The rules behind the last column, by family, are in [`tailwind-migration.md`](tailwind-migration.md). `consts only` means the class was only in a string constant, not in a class attribute.

| Class | Uses | CSS | Write instead |
| :-- | --: | :-- | :-- |
| `flex` | 157 | `display: flex;` | `mo-row` (or `display: flex` in the part's rule) |
| `text-on-surface-variant` | 133 | `color: var(--mo-sys-color-on-surface-variant);` | `color: var(--mo-sys-color-on-surface-variant)` in the part's own rule (no class) |
| `items-center` | 71 | `align-items: center;` | `mo-row` (default) |
| `shrink-0` | 71 | `flex-shrink: 0;` | `mo-keep` |
| `text-sm` | 64 | `font-size: var(--text-sm); line-height: var(--tw-leading, var(--text-sm--line-height));` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `font-medium` | 59 | `--tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); } @property --tw-font-weight { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `min-w-0` | 50 | `min-width: 0px;` | `mo-fill`, or `min-inline-size: 0` |
| `gap-2` | 49 | `gap: calc(var(--spacing) * 2);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `flex-1` | 48 | `flex: 1;` | `mo-fill` |
| `mb-8` | 45 | `margin-bottom: calc(var(--spacing) * 8);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `px-4` | 45 | `padding-inline: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `block` | 44 | `display: block;` | `display: block` in the part's rule |
| `p-4` | 41 | `padding: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `flex-wrap` | 39 | `flex-wrap: wrap;` | `mo-row-wrap` |
| `grid` | 31 | `display: grid;` | `mo-grid`, or `.mo-staggered-grid` for card grids |
| `truncate` | 31 | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` | `mo-truncate` |
| `w-full` | 27 | `width: 100%;` | `inline-size: 100%` |
| `flex-col` | 26 | `flex-direction: column;` | `mo-stack` |
| `gap-3` | 26 | `gap: calc(var(--spacing) * 3);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `mb-6` | 22 | `margin-bottom: calc(var(--spacing) * 6);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `space-y-4` | 22 | `:where(.space-y-4 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 4) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` | `mo-stack` (`gap`) |
| `space-y-5` | 22 | `:where(.space-y-5 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 5) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` | `mo-stack` (`gap`) |
| `border-outline-variant` | 20 | `border-color: var(--mo-sys-color-outline-variant);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `space-y-6` | 20 | `:where(.space-y-6 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 6) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` | `mo-stack` (`gap`) |
| `overflow-hidden` | 19 | `overflow: hidden;` | `overflow: hidden` in the part's rule |
| `relative` | 19 | `position: relative;` | `position: relative` in the part's rule |
| `items-start` | 18 | `align-items: flex-start;` | `mo-row-start` |
| `mb-2` | 18 | `margin-bottom: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-3` | 18 | `margin-top: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `justify-center` | 17 | `justify-content: center;` | `mo-row` / `mo-stack` and modifiers, else the part's rule |
| `mt-2` | 16 | `margin-top: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `gap-1` | 15 | `gap: var(--spacing);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-4` | 14 | `gap: calc(var(--spacing) * 4);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-6` | 14 | `gap: calc(var(--spacing) * 6);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `justify-end` | 14 | `justify-content: flex-end;` | `mo-row` / `mo-stack` and modifiers, else the part's rule |
| `mt-1` | 14 | `margin-top: var(--spacing);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `object-cover` | 14 | `object-fit: cover;` | `mo-cover` |
| `hidden` | 13 | `display: none;` | `mo-hidden` |
| `inline-flex` | 13 | `display: inline-flex;` | `display: inline-flex` in the part's rule |
| `rounded-full` | 13 | `border-radius: calc(infinity * 1px);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `absolute` | 12 | `position: absolute;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `mb-1` | 12 | `margin-bottom: var(--spacing);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `space-y-2` | 12 | `:where(.space-y-2 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 2) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` | `mo-stack` (`gap`) |
| `border` | 11 | `border-style: var(--tw-border-style); border-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's own rule |
| `mb-3` | 11 | `margin-bottom: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-6` | 11 | `margin-top: calc(var(--spacing) * 6);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-2` | 11 | `padding-bottom: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `px-2` | 11 | `padding-inline: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `text-primary` | 11 | `color: var(--mo-sys-color-primary);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-surface-container-high` | 10 | `background-color: var(--mo-sys-color-surface-container-high);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `mx-auto` | 10 | `margin-inline: auto;` | `mo-center` |
| `rounded-xl` | 10 | `border-radius: var(--radius-xl);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `space-y-3` | 10 | `:where(.space-y-3 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 3) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` | `mo-stack` (`gap`) |
| `mt-4` | 9 | `margin-top: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `px-3` | 9 | `padding-inline: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `text-title-large` | 9 | `font-size: var(--mo-sys-typescale-title-large-size); line-height: var(--tw-leading, var(--mo-sys-typescale-title-large-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typescal` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `mb-4` | 8 | `margin-bottom: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `medium:grid-cols-2` | 8 | `@media (width >= 37.5rem) { .medium:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `grid-cols-2` |
| `px-1` | 8 | `padding-inline: var(--spacing);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-2` | 8 | `padding-block: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `size-full` | 8 | `width: 100%; height: 100%;` | `mo-cover` (images) or `inline-size: 100%; block-size: 100%` |
| `sr-only` | 8 | `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border-width: 0;` | `mo-visually-hidden` |
| `focus:outline-none` | 7 | `--tw-outline-style: none; outline-style: none;` | `:focus` selector in the part's rule |
| `font-semibold` | 7 | `--tw-font-weight: var(--font-weight-semibold); font-weight: var(--font-weight-semibold); } @property --tw-font-weight { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `gap-1.5` | 7 | `gap: calc(var(--spacing) * 1.5);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `max-w-full` | 7 | `max-width: 100%;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `medium:px-6` | 7 | `@media (width >= 37.5rem) { .medium:px-6 { padding-inline: calc(var(--spacing) * 6); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `px-6` |
| `min-h-0` | 7 | `min-height: 0px;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `mx-5` | 7 | `margin-inline: calc(var(--spacing) * 5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-3` | 7 | `padding-block: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `sticky` | 7 | `position: sticky;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `-mt-2` | 6 | `margin-top: calc(var(--spacing) * -2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `bg-primary` | 6 | `background-color: var(--mo-sys-color-primary);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-t` | 6 | `border-top-style: var(--tw-border-style); border-top-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `break-words` | 6 | `overflow-wrap: break-word;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `contents` | 6 | `display: contents;` | `mo-contents` |
| `gap-8` | 6 | `gap: calc(var(--spacing) * 8);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `h-16` | 6 | `height: calc(var(--spacing) * 16);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `items-end` | 6 | `align-items: flex-end;` | `mo-row-end` |
| `max-w-sm` | 6 | `max-width: var(--container-sm);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `overflow-y-auto` | 6 | `overflow-y: auto;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `p-2` | 6 | `padding: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-8` | 6 | `padding-top: calc(var(--spacing) * 8);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `rounded-lg` | 6 | `border-radius: var(--radius-lg);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `space-y-1` | 6 | `:where(.space-y-1 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(var(--spacing) * var(--tw-space-y-reverse)); margin-block-end: calc(var(--spacing) * calc(1 - var(-` | `mo-stack` (`gap`) |
| `space-y-10` | 6 | `:where(.space-y-10 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 10) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing)` | `mo-stack` (`gap`) |
| `text-on-surface` | 6 | `color: var(--mo-sys-color-on-surface);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-xs` | 6 | `font-size: var(--text-xs); line-height: var(--tw-leading, var(--text-xs--line-height));` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `w-[20.5rem]` | 6 | `width: 20.5rem;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `bg-surface-container-lowest` | 5 | `background-color: var(--mo-sys-color-surface-container-lowest);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `hover:text-primary` | 5 | `@media (hover: hover) { .hover:text-primary:hover { color: var(--mo-sys-color-primary); }` | `:hover` selector in the part's rule |
| `max-w-none` | 5 | `max-width: none;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `mt-auto` | 5 | `margin-top: auto;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pr-1.5` | 5 | `padding-right: calc(var(--spacing) * 1.5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `rounded-(--mo-comp-block-radius-small)` | 5 | `border-radius: var(--mo-comp-block-radius-small);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `rounded-(--mo-comp-block-radius)` | 5 | `border-radius: var(--mo-comp-block-radius);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `rounded-2xl` | 5 | `border-radius: var(--radius-2xl);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `tabular-nums` | 5 | `--tw-numeric-spacing: tabular-nums; font-variant-numeric: var(--tw-ordinal, ) var(--tw-slashed-zero, ) var(--tw-numeric-figure, ) var(--tw-numeric-spacing, ) var(--tw-numeric-fraction, ); } ` | the part's own rule |
| `text-base` | 5 | `font-size: var(--text-base); line-height: var(--tw-leading, var(--text-base--line-height));` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `text-body-large` | 5 | `font-size: var(--mo-sys-typescale-body-large-size); line-height: var(--tw-leading, var(--mo-sys-typescale-body-large-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typescale-` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `text-center` | 5 | `text-align: center;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `top-0` | 5 | `top: 0px;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `transition-transform` | 5 | `transition-property: transform, translate, scale, rotate; transition-timing-function: var(--tw-ease, var(--mo-sys-default-transition-timing-function)); transition-duration: var(--tw-duration, var(-` | the motion tokens in the part's rule |
| `break-all` | 4 | `word-break: break-all;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `expanded:grid-cols-2` | 4 | `@media (width >= 52.5rem) { .expanded:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `grid-cols-2` |
| `focus-visible:outline-none` | 4 | `--tw-outline-style: none; outline-style: none;` | `:focus-visible` selector in the part's rule |
| `font-mono` | 4 | `font-family: var(--font-mono);` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `gap-x-2` | 4 | `column-gap: calc(var(--spacing) * 2);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `hover:underline` | 4 | `@media (hover: hover) { .hover:underline:hover { text-decoration-line: underline; }` | `:hover` selector in the part's rule |
| `inset-0` | 4 | `inset: 0px;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `line-clamp-2` | 4 | `overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;` | `mo-clamp-2` |
| `m-0` | 4 | `margin: 0px;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `medium:flex` | 4 | `@media (width >= 37.5rem) { .medium:flex { display: flex; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `flex` |
| `ml-auto` | 4 | `margin-left: auto;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-12` | 4 | `margin-top: calc(var(--spacing) * 12);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-8` | 4 | `margin-top: calc(var(--spacing) * 8);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-[env(safe-area-inset-top)]` | 4 | `padding-top: env(safe-area-inset-top);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-1` | 4 | `padding-top: var(--spacing);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-4` | 4 | `padding-top: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `px-(--mo-sys-grid-margin)` | 4 | `padding-inline: var(--mo-sys-grid-margin);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `rounded-(--mo-comp-theme-picture-radius)` | 4 | `border-radius: var(--mo-comp-theme-picture-radius);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `size-10` | 4 | `width: calc(var(--spacing) * 10); height: calc(var(--spacing) * 10);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `transition-colors` | 4 | `transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to; transition-timing-fun` | the motion tokens in the part's rule |
| `z-10` | 4 | `z-index: 10;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `[--mo-comp-card-padding:1rem_0_0.5rem]` | 3 | `--mo-comp-card-padding: 1rem 0 0.5rem;` | the part's rule; a custom property is set on the part's class |
| `aspect-[16/10]` | 3 | `aspect-ratio: 16/10;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `aspect-[3/2]` | 3 | `aspect-ratio: 3/2;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `aspect-square` | 3 | `aspect-ratio: 1 / 1;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `border-b` | 3 | `border-bottom-style: var(--tw-border-style); border-bottom-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `expanded:hidden` | 3 | `@media (width >= 52.5rem) { .expanded:hidden { display: none; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `hidden` |
| `focus-visible:ring-2` | 3 | `--tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), va` | `:focus-visible` selector in the part's rule |
| `focus-visible:ring-primary` | 3 | `--tw-ring-color: var(--mo-sys-color-primary);` | `:focus-visible` selector in the part's rule |
| `gap-10` | 3 | `gap: calc(var(--spacing) * 10);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-2.5` | 3 | `gap: calc(var(--spacing) * 2.5);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-5` | 3 | `gap: calc(var(--spacing) * 5);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-x-6` | 3 | `column-gap: calc(var(--spacing) * 6);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `grid-cols-2` | 3 | `grid-template-columns: repeat(2, minmax(0, 1fr));` | `mo-grid` with `--mo-comp-grid-columns`, or `.mo-staggered-grid`; else the part's rule |
| `h-80` | 3 | `height: calc(var(--spacing) * 80);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `inline-block` | 3 | `display: inline-block;` | the part's own rule |
| `justify-between` | 3 | `justify-content: space-between;` | `mo-row-between` |
| `last:mb-0` | 3 | `margin-bottom: 0px;` | the part's own rule |
| `max-w-[22ch]` | 3 | `max-width: 22ch;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-[52ch]` | 3 | `max-width: 52ch;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-md` | 3 | `max-width: var(--container-md);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `medium:gap-6` | 3 | `@media (width >= 37.5rem) { .medium:gap-6 { gap: calc(var(--spacing) * 6); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `gap-6` |
| `medium:hidden` | 3 | `@media (width >= 37.5rem) { .medium:hidden { display: none; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `hidden` |
| `medium:mt-12` | 3 | `@media (width >= 37.5rem) { .medium:mt-12 { margin-top: calc(var(--spacing) * 12); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mt-12` |
| `medium:mt-16` | 3 | `@media (width >= 37.5rem) { .medium:mt-16 { margin-top: calc(var(--spacing) * 16); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mt-16` |
| `medium:pt-14` | 3 | `@media (width >= 37.5rem) { .medium:pt-14 { padding-top: calc(var(--spacing) * 14); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `pt-14` |
| `min-h-dvh` | 3 | `min-height: 100dvh;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `overflow-x-auto` | 3 | `overflow-x: auto;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `p-6` | 3 | `padding: calc(var(--spacing) * 6);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-[env(safe-area-inset-bottom)]` | 3 | `padding-bottom: env(safe-area-inset-bottom);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-4` | 3 | `padding-bottom: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `place-items-center` | 3 | `place-items: center;` | `mo-row` / `mo-stack` and modifiers, else the part's rule |
| `ps-4` | 3 | `padding-inline-start: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-2` | 3 | `padding-top: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-4` | 3 | `padding-block: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `rounded-panel` | 3 | `border-radius: var(--mo-sys-shape-corner-medium);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `self-start` | 3 | `align-self: flex-start;` | `mo-row` / `mo-stack` and modifiers, else the part's rule |
| `size-12` | 3 | `width: calc(var(--spacing) * 12); height: calc(var(--spacing) * 12);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-16` | 3 | `width: calc(var(--spacing) * 16); height: calc(var(--spacing) * 16);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-6` | 3 | `width: calc(var(--spacing) * 6); height: calc(var(--spacing) * 6);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-7` | 3 | `width: calc(var(--spacing) * 7); height: calc(var(--spacing) * 7);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-8` | 3 | `width: calc(var(--spacing) * 8); height: calc(var(--spacing) * 8);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `text-(--mo-comp-google-text)` | 3 | `color: var(--mo-comp-google-text);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-2xl` | 3 | `font-size: var(--text-2xl); line-height: var(--tw-leading, var(--text-2xl--line-height));` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `touch-none` | 3 | `touch-action: none;` | the part's own rule |
| `-mx-3` | 2 | `margin-inline: calc(var(--spacing) * -3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `-mx-4` | 2 | `margin-inline: calc(var(--spacing) * -4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `-my-3` | 2 | `margin-block: calc(var(--spacing) * -3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `-rotate-90` | 2 | `rotate: calc(90deg * -1);` | the part's own rule |
| `[--mo-comp-card-padding:1rem]` | 2 | `--mo-comp-card-padding: 1rem;` | the part's rule; a custom property is set on the part's class |
| `[--mo-comp-grid-columns:2]` | 2 | `--mo-comp-grid-columns: 2;` | the part's rule; a custom property is set on the part's class |
| `[&>.text-section]:mt-0` | 2 | `.[&>.text-section]:mt-0 > .text-section { margin-top: 0px;` | the part's rule; a custom property is set on the part's class |
| `[&>p:first-child]:mo-type-lead` | 2 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` | the part's rule; a custom property is set on the part's class |
| `[overflow-wrap:anywhere]` | 2 | `overflow-wrap: anywhere;` | the part's rule; a custom property is set on the part's class |
| `[text-box:trim-both_cap_alphabetic]` | 2 | `text-box: trim-both cap alphabetic;` | the part's rule; a custom property is set on the part's class |
| `bg-outline-variant/40` | 2 | `background-color: color-mix(in oklab, var(--mo-sys-color-outline-variant) 40%, transparent);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-surface-container` | 2 | `background-color: var(--mo-sys-color-surface-container);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-surface-container-low` | 2 | `background-color: var(--mo-sys-color-surface-container-low);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-white` | 2 | `background-color: var(--color-white);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-[1.5px]` | 2 | `border-style: var(--tw-border-style); border-width: 1.5px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-0` | 2 | `border-style: var(--tw-border-style); border-width: 0px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bottom-0` | 2 | `bottom: 0px;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `bottom-3` | 2 | `bottom: calc(var(--spacing) * 3);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `expanded:block` | 2 | `@media (width >= 52.5rem) { .expanded:block { display: block; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `block` |
| `expanded:col-span-5` | 2 | `@media (width >= 52.5rem) { .expanded:col-span-5 { grid-column: span 5 / span 5; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `col-span-5` |
| `expanded:grid-cols-12` | 2 | `@media (width >= 52.5rem) { .expanded:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `grid-cols-12` |
| `grid-cols-[repeat(auto-fill,minmax(3rem,1fr))]` | 2 | `grid-template-columns: repeat(auto-fill,minmax(3rem,1fr));` | `mo-grid` with `--mo-comp-grid-columns`, or `.mo-staggered-grid`; else the part's rule |
| `group-hover:text-primary` | 2 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:text-primary) { color: var(--mo-sys-color-primary); }` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `h-10` | 2 | `height: calc(var(--spacing) * 10);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-12` | 2 | `height: calc(var(--spacing) * 12);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-auto` | 2 | `height: auto;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-dvh` | 2 | `height: 100dvh;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-full` | 2 | `height: 100%;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `hover:bg-surface-container-high` | 2 | `@media (hover: hover) { .hover:bg-surface-container-high:hover { background-color: var(--mo-sys-color-surface-container-high); }` | `:hover` selector in the part's rule |
| `large:block` | 2 | `@media (width >= 75rem) { .large:block { display: block; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `block` |
| `leading-snug` | 2 | `--tw-leading: var(--leading-snug); line-height: var(--leading-snug); } @property --tw-leading { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `leading-tight` | 2 | `--tw-leading: var(--leading-tight); line-height: var(--leading-tight); } @property --tw-leading { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `left-0` | 2 | `left: 0px;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `max-h-[45dvh]` | 2 | `max-height: 45dvh;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `max-w-48` | 2 | `max-width: calc(var(--spacing) * 48);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-prose` | 2 | `max-width: 65ch;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-xs` | 2 | `max-width: var(--container-xs);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `medium:aspect-[16/9]` | 2 | `@media (width >= 37.5rem) { .medium:aspect-[16/9] { aspect-ratio: 16/9; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `aspect-[16/9]` |
| `medium:block` | 2 | `@media (width >= 37.5rem) { .medium:block { display: block; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `block` |
| `medium:gap-3` | 2 | `@media (width >= 37.5rem) { .medium:gap-3 { gap: calc(var(--spacing) * 3); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `gap-3` |
| `medium:items-start` | 2 | `@media (width >= 37.5rem) { .medium:items-start { align-items: flex-start; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `items-start` |
| `medium:pt-16` | 2 | `@media (width >= 37.5rem) { .medium:pt-16 { padding-top: calc(var(--spacing) * 16); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `pt-16` |
| `medium:w-auto` | 2 | `@media (width >= 37.5rem) { .medium:w-auto { width: auto; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `w-auto` |
| `min-h-9` | 2 | `min-height: calc(var(--spacing) * 9);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `motion-reduce:transition-none` | 2 | `@media (prefers-reduced-motion: reduce) { .motion-reduce:transition-none { transition-property: none; }` | the part's own rule |
| `mr-auto` | 2 | `margin-right: auto;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-10` | 2 | `margin-top: calc(var(--spacing) * 10);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `not-first:mt-8` | 2 | `margin-top: calc(var(--spacing) * 8);` | the part's own rule |
| `object-contain` | 2 | `object-fit: contain;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `outline-none` | 2 | `--tw-outline-style: none; outline-style: none;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `p-0` | 2 | `padding: 0px;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `p-3` | 2 | `padding: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `p-5` | 2 | `padding: calc(var(--spacing) * 5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-1` | 2 | `padding-bottom: var(--spacing);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pe-14` | 2 | `padding-inline-end: calc(var(--spacing) * 14);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pe-4` | 2 | `padding-inline-end: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-1.5` | 2 | `padding-top: calc(var(--spacing) * 1.5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-3` | 2 | `padding-top: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-52` | 2 | `padding-top: calc(var(--spacing) * 52);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-6` | 2 | `padding-top: calc(var(--spacing) * 6);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `px-5` | 2 | `padding-inline: calc(var(--spacing) * 5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `px-6` | 2 | `padding-inline: calc(var(--spacing) * 6);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-[1.125rem]` | 2 | `padding-block: 1.125rem;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `scroll-mt-24` | 2 | `scroll-margin-top: calc(var(--spacing) * 24);` | the part's own rule |
| `select-none` | 2 | `-webkit-user-select: none; user-select: none;` | the part's own rule |
| `shadow-soft` | 2 | `--tw-shadow: var(--mo-sys-panel-shadow); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); } @property -` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `size-11` | 2 | `width: calc(var(--spacing) * 11); height: calc(var(--spacing) * 11);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-20` | 2 | `width: calc(var(--spacing) * 20); height: calc(var(--spacing) * 20);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `top-2` | 2 | `top: calc(var(--spacing) * 2);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `tracking-tight` | 2 | `--tw-tracking: var(--tracking-tight); letter-spacing: var(--tracking-tight); } @property --tw-tracking { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `transition-opacity` | 2 | `transition-property: opacity; transition-timing-function: var(--tw-ease, var(--mo-sys-default-transition-timing-function)); transition-duration: var(--tw-duration, var(--mo-sys-default-transition-duration` | the motion tokens in the part's rule |
| `underline` | 2 | `text-decoration-line: underline;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `uppercase` | 2 | `text-transform: uppercase;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `w-[36rem]` | 2 | `width: 36rem;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `w-9` | 2 | `width: calc(var(--spacing) * 9);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `-me-[calc((var(--mo-comp-icon-button-width)-1.5rem)/2)]` | 1 | `margin-inline-end: calc(calc((var(--mo-comp-icon-button-width) - 1.5rem) / 2) * -1);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `-ml-2` | 1 | `margin-left: calc(var(--spacing) * -2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `-ms-2.5` | 1 | `margin-inline-start: calc(var(--spacing) * -2.5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `-mx-6` | 1 | `margin-inline: calc(var(--spacing) * -6);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `-outline-offset-2` | 1 | `outline-offset: calc(2px * -1);` | the part's own rule |
| `[--mo-comp-card-padding:0]` | 1 | `--mo-comp-card-padding: 0;` | the part's rule; a custom property is set on the part's class |
| `[--mo-comp-elevated-card-container-elevation:var(--mo-sys-elevation-level1-shadow)]` | 1 | `--mo-comp-elevated-card-container-elevation: var(--mo-sys-elevation-level1-shadow);` | the part's rule; a custom property is set on the part's class |
| `[-webkit-touch-callout:none]` | 1 | `-webkit-touch-callout: none;` | the part's rule; a custom property is set on the part's class |
| `[[data-fold-section]+&]:mt-0` | 1 | `[data-fold-section] + .[[data-fold-section]+&]:mt-0 { margin-top: 0px;` | the part's rule; a custom property is set on the part's class |
| `[@media(width<37.5rem)]:my-0` | 1 | `@media (width<37.5rem) { .[@media(width<37.5rem)]:my-0 { margin-block: 0px; }` | the part's rule; a custom property is set on the part's class |
| `[&_.navigation-rail-items]:flex-1` | 1 | `.[&_.navigation-rail-items]:flex-1 .mo-navigation-rail__items { flex: 1;` | the part's rule; a custom property is set on the part's class |
| `[&:has(+[data-fold-section])]:mb-0` | 1 | `.[&:has(+[data-fold-section])]:mb-0:has( + [data-fold-section]) { margin-bottom: 0px;` | the part's rule; a custom property is set on the part's class |
| `[&:not(:has([data-part]))]:hidden` | 1 | `display: none;` | the part's rule; a custom property is set on the part's class |
| `[&:not([data-tooltip-open])>.tooltip]:invisible` | 1 | `.[&:not([data-tooltip-open])>.tooltip]:invisible:not([data-tooltip-open]) > .tooltip { visibility: hidden;` | the part's rule; a custom property is set on the part's class |
| `[&:not([data-tooltip-open])>.tooltip]:opacity-0` | 1 | `.[&:not([data-tooltip-open])>.tooltip]:opacity-0:not([data-tooltip-open]) > .tooltip { opacity: 0%;` | the part's rule; a custom property is set on the part's class |
| `[&>.tooltip]:bottom-auto` | 1 | `.[&>.tooltip]:bottom-auto > .tooltip { bottom: auto;` | the part's rule; a custom property is set on the part's class |
| `[&>.tooltip]:end-0` | 1 | `.[&>.tooltip]:end-0 > .tooltip { inset-inline-end: calc(var(--spacing) * 0);` | the part's rule; a custom property is set on the part's class |
| `[&>.tooltip]:max-w-60` | 1 | `.[&>.tooltip]:max-w-60 > .tooltip { max-width: calc(var(--spacing) * 60);` | the part's rule; a custom property is set on the part's class |
| `[&>.tooltip]:start-auto` | 1 | `.[&>.tooltip]:start-auto > .tooltip { inset-inline-start: auto;` | the part's rule; a custom property is set on the part's class |
| `[&>.tooltip]:top-[calc(100%-0.5rem)]` | 1 | `.[&>.tooltip]:top-[calc(100%-0.5rem)] > .tooltip { top: calc(100% - 0.5rem);` | the part's rule; a custom property is set on the part's class |
| `[&>svg]:duration-(--mo-sys-motion-spring-default-spatial-duration)` | 1 | `.[&>svg]:duration-(--mo-sys-motion-spring-default-spatial-duration) > svg { --tw-duration: var(--mo-sys-motion-spring-default-spatial-duration); transition-duration: var(--mo-sys-motion-spri` | the part's rule; a custom property is set on the part's class |
| `[&>svg]:ease-(--motion-ease)` | 1 | `.[&>svg]:ease-(--motion-ease) > svg { --tw-ease: var(--motion-ease); transition-timing-function: var(--motion-ease); } @property --tw-ease { syntax: "*"; inherits: false;` | the part's rule; a custom property is set on the part's class |
| `[&>svg]:transition-transform` | 1 | `.[&>svg]:transition-transform > svg { transition-property: transform, translate, scale, rotate; transition-timing-function: var(--tw-ease, var(--mo-sys-default-transition-timing-function)); transit` | the part's rule; a custom property is set on the part's class |
| `[contain:layout]` | 1 | `contain: layout;` | the part's rule; a custom property is set on the part's class |
| `[container-type:size]` | 1 | `container-type: size;` | the part's rule; a custom property is set on the part's class |
| `[mask-position:center]` | 1 | `mask-position: center;` | the part's rule; a custom property is set on the part's class |
| `[mask-repeat:no-repeat]` | 1 | `mask-repeat: no-repeat;` | the part's rule; a custom property is set on the part's class |
| `[mask-size:contain]` | 1 | `mask-size: contain;` | the part's rule; a custom property is set on the part's class |
| `[scrollbar-width:none]` | 1 | `scrollbar-width: none;` | the part's rule; a custom property is set on the part's class |
| `[transition:scale_var(--mo-sys-motion-spring-slow-spatial)]` | 1 | `transition: scale var(--mo-sys-motion-spring-slow-spatial);` | the part's rule; a custom property is set on the part's class |
| `*:flex-1` | 1 | `:is(.*:flex-1 > *) { flex: 1;` | the part's own rule |
| `*:min-w-48` | 1 | `:is(.*:min-w-48 > *) { min-width: calc(var(--spacing) * 48);` | the part's own rule |
| `align-middle` | 1 | `vertical-align: middle;` | the part's own rule |
| `aria-[current=location]:text-primary` | 1 | `color: var(--mo-sys-color-primary);` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `aspect-[1.91/1]` | 1 | `aspect-ratio: 1.91/1;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `aspect-[3/4]` | 1 | `aspect-ratio: 3/4;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `aspect-[4/3]` | 1 | `aspect-ratio: 4/3;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `basis-full` | 1 | `flex-basis: 100%;` | the part's own rule |
| `bg-(--mo-comp-editor-status-good)` | 1 | `background-color: var(--mo-comp-editor-status-good);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-(--mo-comp-google-background)` | 1 | `background-color: var(--mo-comp-google-background);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-(--mo-comp-google-icon-fill)` | 1 | `background-color: var(--mo-comp-google-icon-fill);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-(--mo-comp-navigation-rail-surface,var(--mo-sys-color-surface))` | 1 | `background-color: var(--mo-comp-navigation-rail-surface,var(--mo-sys-color-surface));` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-center` | 1 | `background-position: center;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-cover` | 1 | `background-size: cover;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-outline` | 1 | `background-color: var(--mo-sys-color-outline);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-outline-variant` | 1 | `background-color: var(--mo-sys-color-outline-variant);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-outline-variant/50` | 1 | `background-color: color-mix(in oklab, var(--mo-sys-color-outline-variant) 50%, transparent);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-secondary-container` | 1 | `background-color: var(--mo-sys-color-secondary-container);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-surface` | 1 | `background-color: var(--mo-sys-color-surface);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-tertiary-container` | 1 | `background-color: var(--mo-sys-color-tertiary-container);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `bg-transparent` | 1 | `background-color: transparent;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-(--mo-comp-google-icon-ring)` | 1 | `border-color: var(--mo-comp-google-icon-ring);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-current` | 1 | `border-color: currentcolor;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-dashed` | 1 | `--tw-border-style: dashed; border-style: dashed;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-l-2` | 1 | `border-left-style: var(--tw-border-style); border-left-width: 2px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-primary` | 1 | `border-color: var(--mo-sys-color-primary);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-t-2` | 1 | `border-top-style: var(--tw-border-style); border-top-width: 2px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-x` | 1 | `border-inline-style: var(--tw-border-style); border-inline-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `cursor-ew-resize` | 1 | `cursor: ew-resize;` | the part's own rule |
| `cursor-grab` | 1 | `cursor: grab;` | the part's own rule |
| `data-[clearance=true]:mb-[var(--mo-comp-fab-room)]` | 1 | `margin-bottom: var(--mo-comp-fab-room);` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `disabled:opacity-60` | 1 | `opacity: 60%;` | the part's own rule |
| `duration-(--mo-sys-motion-spring-default-effects-duration)` | 1 | `--tw-duration: var(--mo-sys-motion-spring-default-effects-duration); transition-duration: var(--mo-sys-motion-spring-default-effects-duration); } @property --tw-duration { syntax: "*"; inher` | the motion tokens in the part's rule |
| `duration-[1200ms]` | 1 | `--tw-duration: 1200ms; transition-duration: 1200ms; } @property --tw-duration { syntax: "*"; inherits: false;` | the motion tokens in the part's rule |
| `ease-(--motion-ease)` | 1 | `--tw-ease: var(--motion-ease); transition-timing-function: var(--motion-ease); } @property --tw-ease { syntax: "*"; inherits: false;` | the motion tokens in the part's rule |
| `ease-out` | 1 | `--tw-ease: var(--ease-out); transition-timing-function: var(--ease-out); } @property --tw-ease { syntax: "*"; inherits: false;` | the motion tokens in the part's rule |
| `empty:hidden` | 1 | `display: none;` | the part's own rule |
| `end-1` | 1 | `inset-inline-end: calc(var(--spacing) * 1);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `end-2` | 1 | `inset-inline-end: calc(var(--spacing) * 2);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `expanded:col-span-12` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-12 { grid-column: span 12 / span 12; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `col-span-12` |
| `expanded:col-span-3` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-3 { grid-column: span 3 / span 3; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `col-span-3` |
| `expanded:col-span-4` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-4 { grid-column: span 4 / span 4; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `col-span-4` |
| `expanded:col-span-7` | 1 | `@media (width >= 52.5rem) { .expanded:col-span-7 { grid-column: span 7 / span 7; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `col-span-7` |
| `expanded:flex` | 1 | `@media (width >= 52.5rem) { .expanded:flex { display: flex; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `flex` |
| `expanded:gap-2` | 1 | `@media (width >= 52.5rem) { .expanded:gap-2 { gap: calc(var(--spacing) * 2); }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `gap-2` |
| `expanded:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]` | 1 | `@media (width >= 52.5rem) { .expanded:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] { grid-template-columns: repeat(auto-fill,minmax(9rem,1fr)); }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]` |
| `expanded:inline` | 1 | `@media (width >= 52.5rem) { .expanded:inline { display: inline; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `inline` |
| `expanded:ml-auto` | 1 | `@media (width >= 52.5rem) { .expanded:ml-auto { margin-left: auto; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `ml-auto` |
| `expanded:shrink-0` | 1 | `@media (width >= 52.5rem) { .expanded:shrink-0 { flex-shrink: 0; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `shrink-0` |
| `expanded:text-right` | 1 | `@media (width >= 52.5rem) { .expanded:text-right { text-align: right; }` | `@media (width >= 52.5rem)` in the part's rule, with the replacement of `text-right` |
| `fill-(--mo-comp-editor-status-bad)` | 1 | `fill: var(--mo-comp-editor-status-bad);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `first-of-type:border-t-0` | 1 | `border-top-style: var(--tw-border-style); border-top-width: 0px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's own rule |
| `first-of-type:pt-0` | 1 | `padding-top: 0px;` | the part's own rule |
| `fixed` | 1 | `position: fixed;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `focus-visible:outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid;` | `:focus-visible` selector in the part's rule |
| `focus-visible:outline-offset-[-8px]` | 1 | `outline-offset: -8px;` | `:focus-visible` selector in the part's rule |
| `focus-visible:ring-offset-2` | 1 | `--tw-ring-offset-width: 2px; --tw-ring-offset-shadow: var(--tw-ring-inset, ) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);` | `:focus-visible` selector in the part's rule |
| `focus-visible:underline` | 1 | `text-decoration-line: underline;` | `:focus-visible` selector in the part's rule |
| `focus:bg-primary` | 1 | `background-color: var(--mo-sys-color-primary);` | `:focus` selector in the part's rule |
| `focus:fixed` | 1 | `position: fixed;` | `:focus` selector in the part's rule |
| `focus:left-4` | 1 | `left: calc(var(--spacing) * 4);` | `:focus` selector in the part's rule |
| `focus:not-sr-only` | 1 | `position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip-path: none; white-space: normal;` | `:focus` selector in the part's rule |
| `focus:px-4` | 1 | `padding-inline: calc(var(--spacing) * 4);` | `:focus` selector in the part's rule |
| `focus:py-2` | 1 | `padding-block: calc(var(--spacing) * 2);` | `:focus` selector in the part's rule |
| `focus:rounded-full` | 1 | `border-radius: calc(infinity * 1px);` | `:focus` selector in the part's rule |
| `focus:text-on-primary` | 1 | `color: var(--mo-sys-color-on-primary);` | `:focus` selector in the part's rule |
| `focus:top-4` | 1 | `top: calc(var(--spacing) * 4);` | `:focus` selector in the part's rule |
| `focus:z-50` | 1 | `z-index: 50;` | `:focus` selector in the part's rule |
| `font-[arial,sans-serif]` | 1 | `font-family: arial,sans-serif;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `font-bold` | 1 | `--tw-font-weight: var(--font-weight-bold); font-weight: var(--font-weight-bold); } @property --tw-font-weight { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `font-sans` | 1 | `font-family: 'Roboto Variable', Roboto, ui-sans-serif, system-ui, sans-serif;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `gap-(--mo-sys-grid-gutter)` | 1 | `gap: var(--mo-sys-grid-gutter);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-0.5` | 1 | `gap: calc(var(--spacing) * 0.5);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-y-1` | 1 | `row-gap: var(--spacing);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-y-2` | 1 | `row-gap: calc(var(--spacing) * 2);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-y-4` | 1 | `row-gap: calc(var(--spacing) * 4);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `gap-y-6` | 1 | `row-gap: calc(var(--spacing) * 6);` | `gap` through `--mo-comp-row-gap`, `--mo-comp-stack-gap` or `--mo-comp-grid-gap`, else the part's rule |
| `grid-cols-3` | 1 | `grid-template-columns: repeat(3, minmax(0, 1fr));` | `mo-grid` with `--mo-comp-grid-columns`, or `.mo-staggered-grid`; else the part's rule |
| `grid-cols-4` | 1 | `grid-template-columns: repeat(4, minmax(0, 1fr));` | `mo-grid` with `--mo-comp-grid-columns`, or `.mo-staggered-grid`; else the part's rule |
| `grid-cols-6` | 1 | `grid-template-columns: repeat(6, minmax(0, 1fr));` | `mo-grid` with `--mo-comp-grid-columns`, or `.mo-staggered-grid`; else the part's rule |
| `group-data-[open]:opacity-100` | 1 | `:is(:where(.group)[data-open] .group-data-[open]:opacity-100) { opacity: 100%;` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `group-data-[open]:visible` | 1 | `:is(:where(.group)[data-open] .group-data-[open]:visible) { visibility: visible;` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `group-focus-visible:bg-primary` | 1 | `:is(:where(.group):focus-visible .group-focus-visible:bg-primary) { background-color: var(--mo-sys-color-primary);` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `group-hover:bg-primary` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:bg-primary) { background-color: var(--mo-sys-color-primary); }` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `group-hover:opacity-100` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:opacity-100) { opacity: 100%; }` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `group-hover:scale-[1.03]` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:scale-[1.03]) { scale: 1.03; }` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `group-hover:translate-x-0.5` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:translate-x-0.5) { --tw-translate-x: calc(var(--spacing) * 0.5); translate: var(--tw-translate-x) var(--tw-translate-y); } } @pr` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `group-hover:visible` | 1 | `@media (hover: hover) { :is(:where(.group):hover .group-hover:visible) { visibility: visible; }` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `h-11` | 1 | `height: calc(var(--spacing) * 11);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-160` | 1 | `height: calc(var(--spacing) * 160);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-4` | 1 | `height: calc(var(--spacing) * 4);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-48` | 1 | `height: calc(var(--spacing) * 48);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-8` | 1 | `height: calc(var(--spacing) * 8);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `h-9` | 1 | `height: calc(var(--spacing) * 9);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `has-focus-visible:outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid;` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `has-focus-visible:outline-offset-2` | 1 | `outline-offset: 2px;` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `has-focus-visible:outline-primary` | 1 | `outline-color: var(--mo-sys-color-primary);` | `:has()`, `[aria-*]` or `[data-*]` state selector in the part's rule |
| `hover:scale-105` | 1 | `@media (hover: hover) { .hover:scale-105:hover { --tw-scale-x: 105%; --tw-scale-y: 105%; --tw-scale-z: 105%; scale: var(--tw-scale-x) var(--tw-scale-y); } } @property --tw-scale-x { syntax: ` | `:hover` selector in the part's rule |
| `hover:text-on-surface` | 1 | `@media (hover: hover) { .hover:text-on-surface:hover { color: var(--mo-sys-color-on-surface); }` | `:hover` selector in the part's rule |
| `inset-x-3` | 1 | `inset-inline: calc(var(--spacing) * 3);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `invisible` | 1 | `visibility: hidden;` | the part's own rule |
| `large:absolute` | 1 | `@media (width >= 75rem) { .large:absolute { position: absolute; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `absolute` |
| `large:col-start-1` | 1 | `@media (width >= 75rem) { .large:col-start-1 { grid-column-start: 1; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `col-start-1` |
| `large:end-0` | 1 | `@media (width >= 75rem) { .large:end-0 { inset-inline-end: calc(var(--spacing) * 0); }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `end-0` |
| `large:group-data-crowded/header:hidden` | 1 | `@media (width >= 75rem) { :is(:where(.group/header)[data-crowded] .large:group-data-crowded/header:hidden) { display: none; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `group-data-crowded/header:hidden` |
| `large:inset-y-0` | 1 | `@media (width >= 75rem) { .large:inset-y-0 { inset-block: 0px; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `inset-y-0` |
| `large:mt-(--mo-sys-section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:mt-(--mo-sys-section-pane-gap) { margin-top: var(--mo-sys-section-pane-gap); }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `mt-(--mo-sys-section-pane-gap)` |
| `large:pe-(--mo-sys-section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:pe-(--mo-sys-section-pane-gap) { padding-inline-end: var(--mo-sys-section-pane-gap); }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `pe-(--mo-sys-section-pane-gap)` |
| `large:row-span-2` | 1 | `@media (width >= 75rem) { .large:row-span-2 { grid-row: span 2 / span 2; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `row-span-2` |
| `large:row-start-1` | 1 | `@media (width >= 75rem) { .large:row-start-1 { grid-row-start: 1; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `row-start-1` |
| `large:shrink-0` | 1 | `@media (width >= 75rem) { .large:shrink-0 { flex-shrink: 0; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `shrink-0` |
| `large:sticky` | 1 | `@media (width >= 75rem) { .large:sticky { position: sticky; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `sticky` |
| `large:top-(--mo-sys-section-pane-gap)` | 1 | `@media (width >= 75rem) { .large:top-(--mo-sys-section-pane-gap) { top: var(--mo-sys-section-pane-gap); }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `top-(--mo-sys-section-pane-gap)` |
| `large:w-(--mo-sys-section-pane-width)` | 1 | `@media (width >= 75rem) { .large:w-(--mo-sys-section-pane-width) { width: var(--mo-sys-section-pane-width); }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `w-(--mo-sys-section-pane-width)` |
| `large:whitespace-nowrap` | 1 | `@media (width >= 75rem) { .large:whitespace-nowrap { white-space: nowrap; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `whitespace-nowrap` |
| `large:z-10` | 1 | `@media (width >= 75rem) { .large:z-10 { z-index: 10; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `z-10` |
| `leading-[22px]` | 1 | `--tw-leading: 22px; line-height: 22px; } @property --tw-leading { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `leading-[26px]` | 1 | `--tw-leading: 26px; line-height: 26px; } @property --tw-leading { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `leading-[var(--mo-sys-typescale-headline-small-line-height)]` | 1 | `--tw-leading: var(--mo-sys-typescale-headline-small-line-height); line-height: var(--mo-sys-typescale-headline-small-line-height); } @property --tw-leading { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `leading-none` | 1 | `--tw-leading: 1; line-height: 1; } @property --tw-leading { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `left-1/2` | 1 | `left: calc(1 / 2 * 100%);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `left-4` | 1 | `left: calc(var(--spacing) * 4);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `list-disc` | 1 | `list-style-type: disc;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `list-none` | 1 | `list-style-type: none;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `marker:text-primary` | 1 | `.marker:text-primary ::marker { color: var(--mo-sys-color-primary); } .marker:text-primary::marker { color: var(--mo-sys-color-primary); } .marker:text-primary ::-webkit-details-marker { col` | the part's own rule |
| `max-expanded:sr-only` | 1 | `@media (width < 52.5rem) { .max-expanded:sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border` | the part's own rule |
| `max-h-[50dvh]` | 1 | `max-height: 50dvh;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `max-h-[calc(100dvh-1.5rem)]` | 1 | `max-height: calc(100dvh - 1.5rem);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `max-h-[calc(100dvh-2*var(--mo-sys-section-pane-gap))]` | 1 | `max-height: calc(100dvh - 2 * var(--mo-sys-section-pane-gap));` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `max-h-[calc(100dvh-3rem)]` | 1 | `max-height: calc(100dvh - 3rem);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `max-h-24` | 1 | `max-height: calc(var(--spacing) * 24);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `max-medium:hidden` | 1 | `@media (width < 37.5rem) { .max-medium:hidden { display: none; }` | the part's own rule |
| `max-w-[18ch]` | 1 | `max-width: 18ch;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-[45rem]` | 1 | `max-width: 45rem;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-[500px]` | 1 | `max-width: 500px;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-[75ch]` | 1 | `max-width: 75ch;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-[var(--mo-comp-block-text-measure-max)]` | 1 | `max-width: var(--mo-comp-block-text-measure-max);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-2xl` | 1 | `max-width: var(--container-2xl);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-3xl` | 1 | `max-width: var(--container-3xl);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-5xl` | 1 | `max-width: var(--container-5xl);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-64` | 1 | `max-width: calc(var(--spacing) * 64);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-6xl` | 1 | `max-width: var(--container-6xl);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-72` | 1 | `max-width: calc(var(--spacing) * 72);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `max-w-80` | 1 | `max-width: calc(var(--spacing) * 80);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `medium:-mx-6` | 1 | `@media (width >= 37.5rem) { .medium:-mx-6 { margin-inline: calc(var(--spacing) * -6); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `-mx-6` |
| `medium:aspect-auto` | 1 | `@media (width >= 37.5rem) { .medium:aspect-auto { aspect-ratio: auto; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `aspect-auto` |
| `medium:bottom-6` | 1 | `@media (width >= 37.5rem) { .medium:bottom-6 { bottom: calc(var(--spacing) * 6); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `bottom-6` |
| `medium:contents` | 1 | `@media (width >= 37.5rem) { .medium:contents { display: contents; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `contents` |
| `medium:flex-wrap` | 1 | `@media (width >= 37.5rem) { .medium:flex-wrap { flex-wrap: wrap; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `flex-wrap` |
| `medium:gap-12` | 1 | `@media (width >= 37.5rem) { .medium:gap-12 { gap: calc(var(--spacing) * 12); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `gap-12` |
| `medium:grid-cols-[1fr_auto]` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-[1fr_auto] { grid-template-columns: 1fr auto; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `grid-cols-[1fr_auto]` |
| `medium:grid-cols-[minmax(10rem,14rem)_1fr]` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-[minmax(10rem,14rem)_1fr] { grid-template-columns: minmax(10rem,14rem) 1fr; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `grid-cols-[minmax(10rem,14rem)_1fr]` |
| `medium:grid-cols-3` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `grid-cols-3` |
| `medium:grid-cols-4` | 1 | `@media (width >= 37.5rem) { .medium:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `grid-cols-4` |
| `medium:inline` | 1 | `@media (width >= 37.5rem) { .medium:inline { display: inline; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `inline` |
| `medium:inset-x-auto` | 1 | `@media (width >= 37.5rem) { .medium:inset-x-auto { inset-inline: auto; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `inset-x-auto` |
| `medium:left-6` | 1 | `@media (width >= 37.5rem) { .medium:left-6 { left: calc(var(--spacing) * 6); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `left-6` |
| `medium:max-h-40` | 1 | `@media (width >= 37.5rem) { .medium:max-h-40 { max-height: calc(var(--spacing) * 40); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `max-h-40` |
| `medium:min-h-36` | 1 | `@media (width >= 37.5rem) { .medium:min-h-36 { min-height: calc(var(--spacing) * 36); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `min-h-36` |
| `medium:mo-type-display-medium` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mo-type-display-medium` |
| `medium:mo-type-display-small` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mo-type-display-small` |
| `medium:mo-type-headline-large` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mo-type-headline-large` |
| `medium:mo-type-title-large` | 1 | `a variant of the plain class `mo-type-*` (`type.css`): written as a Tailwind variant in the markup` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mo-type-title-large` |
| `medium:mt-14` | 1 | `@media (width >= 37.5rem) { .medium:mt-14 { margin-top: calc(var(--spacing) * 14); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mt-14` |
| `medium:mt-28` | 1 | `@media (width >= 37.5rem) { .medium:mt-28 { margin-top: calc(var(--spacing) * 28); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mt-28` |
| `medium:mx-0` | 1 | `@media (width >= 37.5rem) { .medium:mx-0 { margin-inline: 0px; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mx-0` |
| `medium:overflow-visible` | 1 | `@media (width >= 37.5rem) { .medium:overflow-visible { overflow: visible; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `overflow-visible` |
| `medium:p-6` | 1 | `@media (width >= 37.5rem) { .medium:p-6 { padding: calc(var(--spacing) * 6); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `p-6` |
| `medium:p-8` | 1 | `@media (width >= 37.5rem) { .medium:p-8 { padding: calc(var(--spacing) * 8); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `p-8` |
| `medium:pb-4` | 1 | `@media (width >= 37.5rem) { .medium:pb-4 { padding-bottom: calc(var(--spacing) * 4); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `pb-4` |
| `medium:pl-1` | 1 | `@media (width >= 37.5rem) { .medium:pl-1 { padding-left: var(--spacing); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `pl-1` |
| `medium:pr-72` | 1 | `@media (width >= 37.5rem) { .medium:pr-72 { padding-right: calc(var(--spacing) * 72); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `pr-72` |
| `medium:pt-(--mo-comp-theme-section-space-large)` | 1 | `@media (width >= 37.5rem) { .medium:pt-(--mo-comp-theme-section-space-large) { padding-top: var(--mo-comp-theme-section-space-large); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `pt-(--mo-comp-theme-section-space-large)` |
| `medium:pt-8` | 1 | `@media (width >= 37.5rem) { .medium:pt-8 { padding-top: calc(var(--spacing) * 8); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `pt-8` |
| `medium:px-0` | 1 | `@media (width >= 37.5rem) { .medium:px-0 { padding-inline: 0px; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `px-0` |
| `medium:px-7` | 1 | `@media (width >= 37.5rem) { .medium:px-7 { padding-inline: calc(var(--spacing) * 7); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `px-7` |
| `medium:py-16` | 1 | `@media (width >= 37.5rem) { .medium:py-16 { padding-block: calc(var(--spacing) * 16); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `py-16` |
| `medium:select-auto` | 1 | `@media (width >= 37.5rem) { .medium:select-auto { -webkit-user-select: auto; user-select: auto; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `select-auto` |
| `medium:touch-auto` | 1 | `@media (width >= 37.5rem) { .medium:touch-auto { touch-action: auto; }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `touch-auto` |
| `min-[600px]:basis-0` | 1 | `@media (width >= 600px) { .min-[600px]:basis-0 { flex-basis: 0px; }` | `@media (width >= 37.5rem)` in the part's rule |
| `min-[600px]:flex-1` | 1 | `@media (width >= 600px) { .min-[600px]:flex-1 { flex: 1; }` | `@media (width >= 37.5rem)` in the part's rule |
| `min-[600px]:flex-nowrap` | 1 | `@media (width >= 600px) { .min-[600px]:flex-nowrap { flex-wrap: nowrap; }` | `@media (width >= 37.5rem)` in the part's rule |
| `min-[600px]:ms-0` | 1 | `@media (width >= 600px) { .min-[600px]:ms-0 { margin-inline-start: 0px; }` | `@media (width >= 37.5rem)` in the part's rule |
| `min-[600px]:order-none` | 1 | `@media (width >= 600px) { .min-[600px]:order-none { order: 0; }` | `@media (width >= 37.5rem)` in the part's rule |
| `min-[600px]:pb-0` | 1 | `@media (width >= 600px) { .min-[600px]:pb-0 { padding-bottom: 0px; }` | `@media (width >= 37.5rem)` in the part's rule |
| `min-h-(--mo-comp-top-app-bar-height,4rem)` | 1 | `min-height: var(--mo-comp-top-app-bar-height,4rem);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `min-h-11` | 1 | `min-height: calc(var(--spacing) * 11);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `min-h-14` | 1 | `min-height: calc(var(--spacing) * 14);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `min-h-full` | 1 | `min-height: 100%;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `min-w-[min(var(--mo-comp-block-text-measure-min),100%)]` | 1 | `min-width: min(var(--mo-comp-block-text-measure-min), 100%);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `ml-5` | 1 | `margin-left: calc(var(--spacing) * 5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mr-1` | 1 | `margin-right: var(--spacing);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mr-2` | 1 | `margin-right: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `ms-auto` | 1 | `margin-inline-start: auto;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-1.5` | 1 | `margin-top: calc(var(--spacing) * 1.5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-2.5` | 1 | `margin-top: calc(var(--spacing) * 2.5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mt-20` | 1 | `margin-top: calc(var(--spacing) * 20);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mx-0.5` | 1 | `margin-inline: calc(var(--spacing) * 0.5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mx-2` | 1 | `margin-inline: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `mx-4` | 1 | `margin-inline: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `my-3` | 1 | `margin-block: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `my-4` | 1 | `margin-block: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `object-[50%_20%]` | 1 | `object-position: 50% 20%;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `object-top` | 1 | `object-position: top;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `opacity-0` | 1 | `opacity: 0%;` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `order-last` | 1 | `order: 9999;` | `mo-grid` with `--mo-comp-grid-columns`, or `.mo-staggered-grid`; else the part's rule |
| `origin-top` | 1 | `transform-origin: top;` | the part's own rule |
| `origin-top-left` | 1 | `transform-origin: 0 0;` | the part's own rule |
| `outline-2` | 1 | `outline-style: var(--tw-outline-style); outline-width: 2px; } @property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `outline-dashed` | 1 | `--tw-outline-style: dashed; outline-style: dashed;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `outline-outline-variant` | 1 | `outline-color: var(--mo-sys-color-outline-variant);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `p-(--mo-comp-navigation-drawer-item-padding,0_1rem)` | 1 | `padding: var(--mo-comp-navigation-drawer-item-padding,0 1rem);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `p-8` | 1 | `padding: calc(var(--spacing) * 8);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-(--mo-comp-toolbar-docked-padding-block)` | 1 | `padding-bottom: var(--mo-comp-toolbar-docked-padding-block);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-[26rem]` | 1 | `padding-bottom: 26rem;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-24` | 1 | `padding-bottom: calc(var(--spacing) * 24);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-3` | 1 | `padding-bottom: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-44` | 1 | `padding-bottom: calc(var(--spacing) * 44);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pb-8` | 1 | `padding-bottom: calc(var(--spacing) * 8);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pe-2` | 1 | `padding-inline-end: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pl-1` | 1 | `padding-left: var(--spacing);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pl-11` | 1 | `padding-left: calc(var(--spacing) * 11);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pl-3` | 1 | `padding-left: calc(var(--spacing) * 3);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `placeholder:text-on-surface-variant/60` | 1 | `color: color-mix(in oklab, var(--mo-sys-color-on-surface-variant) 60%, transparent);` | the part's own rule |
| `pr-12` | 1 | `padding-right: calc(var(--spacing) * 12);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pr-2` | 1 | `padding-right: calc(var(--spacing) * 2);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pr-4` | 1 | `padding-right: calc(var(--spacing) * 4);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `ps-0` | 1 | `padding-inline-start: 0px;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `ps-5` | 1 | `padding-inline-start: calc(var(--spacing) * 5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-(--mo-comp-theme-section-space)` | 1 | `padding-top: var(--mo-comp-theme-section-space);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-[calc(0.75rem+env(safe-area-inset-top))]` | 1 | `padding-top: calc(0.75rem + env(safe-area-inset-top));` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-24` | 1 | `padding-top: calc(var(--spacing) * 24);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-36` | 1 | `padding-top: calc(var(--spacing) * 36);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `pt-5` | 1 | `padding-top: calc(var(--spacing) * 5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-0` | 1 | `padding-block: 0px;` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-12` | 1 | `padding-block: calc(var(--spacing) * 12);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-5` | 1 | `padding-block: calc(var(--spacing) * 5);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `py-6` | 1 | `padding-block: calc(var(--spacing) * 6);` | the part's padding or margin in `--mo-ref-space-*`, logical properties |
| `resize-none` | 1 | `resize: none;` | the part's own rule |
| `right-0` | 1 | `right: 0px;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `right-2` | 1 | `right: calc(var(--spacing) * 2);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `right-3` | 1 | `right: calc(var(--spacing) * 3);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `ring-2` | 1 | `--tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), va` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `ring-surface` | 1 | `--tw-ring-color: var(--mo-sys-color-surface);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `rounded-[1.375rem]` | 1 | `border-radius: 1.375rem;` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `rounded-[3px]` | 1 | `border-radius: 3px;` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `rounded-[inherit]` | 1 | `border-radius: inherit;` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `rounded-b-panel` | 1 | `border-bottom-right-radius: var(--mo-sys-shape-corner-medium); border-bottom-left-radius: var(--mo-sys-shape-corner-medium);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `rounded-t-panel` | 1 | `border-top-left-radius: var(--mo-sys-shape-corner-medium); border-top-right-radius: var(--mo-sys-shape-corner-medium);` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `scroll-mt-[calc(1rem+env(safe-area-inset-top))]` | 1 | `scroll-margin-top: calc(1rem + env(safe-area-inset-top));` | the part's own rule |
| `scroll-mt-[calc(5rem+env(safe-area-inset-top))]` | 1 | `scroll-margin-top: calc(5rem + env(safe-area-inset-top));` | the part's own rule |
| `select-all` | 1 | `-webkit-user-select: all; user-select: all;` | the part's own rule |
| `size-[28px]` | 1 | `width: 28px; height: 28px;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-28` | 1 | `width: calc(var(--spacing) * 28); height: calc(var(--spacing) * 28);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-3` | 1 | `width: calc(var(--spacing) * 3); height: calc(var(--spacing) * 3);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-4` | 1 | `width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `size-9` | 1 | `width: calc(var(--spacing) * 9); height: calc(var(--spacing) * 9);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule |
| `space-y-0.5` | 1 | `:where(.space-y-0.5 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 0.5) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacin` | `mo-stack` (`gap`) |
| `space-y-8` | 1 | `:where(.space-y-8 > :not(:last-child)) { --tw-space-y-reverse: 0; margin-block-start: calc(calc(var(--spacing) * 8) * var(--tw-space-y-reverse)); margin-block-end: calc(calc(var(--spacing) *` | `mo-stack` (`gap`) |
| `text-(--mo-comp-google-date)` | 1 | `color: var(--mo-comp-google-date);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-(--mo-comp-google-icon-letter)` | 1 | `color: var(--mo-comp-google-icon-letter);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-(--mo-comp-google-site)` | 1 | `color: var(--mo-comp-google-site);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-[20px]` | 1 | `font-size: 20px;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-[length:var(--mo-sys-typescale-headline-small-size)]` | 1 | `font-size: var(--mo-sys-typescale-headline-small-size);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-display-small` | 1 | `font-size: var(--mo-sys-typescale-display-small-size); line-height: var(--tw-leading, var(--mo-sys-typescale-display-small-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-type` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `text-left` | 1 | `text-align: left;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-on-primary` | 1 | `color: var(--mo-sys-color-on-primary);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-on-secondary-container` | 1 | `color: var(--mo-sys-color-on-secondary-container);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-on-tertiary-container` | 1 | `color: var(--mo-sys-color-on-tertiary-container);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-right` | 1 | `text-align: right;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-start` | 1 | `text-align: start;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `text-title-medium` | 1 | `font-size: var(--mo-sys-typescale-title-medium-size); line-height: var(--tw-leading, var(--mo-sys-typescale-title-medium-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typesc` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `text-title-small` | 1 | `font-size: var(--mo-sys-typescale-title-small-size); line-height: var(--tw-leading, var(--mo-sys-typescale-title-small-line-height)); letter-spacing: var(--tw-tracking, var(--mo-sys-typescal` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `top-[env(safe-area-inset-top)]` | 1 | `top: env(safe-area-inset-top);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `top-1` | 1 | `top: var(--spacing);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `top-1/2` | 1 | `top: calc(1 / 2 * 100%);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `top-3` | 1 | `top: calc(var(--spacing) * 3);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `top-8` | 1 | `top: calc(var(--spacing) * 8);` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `top-full` | 1 | `top: 100%;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `tracking-wide` | 1 | `--tw-tracking: var(--tracking-wide); letter-spacing: var(--tracking-wide); } @property --tw-tracking { syntax: "*"; inherits: false;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `transform-gpu` | 1 | `transform: translateZ(0) var(--tw-rotate-x, ) var(--tw-rotate-y, ) var(--tw-rotate-z, ) var(--tw-skew-x, ) var(--tw-skew-y, );` | the part's own rule |
| `transition-[stroke-dasharray]` | 1 | `transition-property: stroke-dasharray; transition-timing-function: var(--tw-ease, var(--mo-sys-default-transition-timing-function)); transition-duration: var(--tw-duration, var(--default-transition` | the motion tokens in the part's rule |
| `underline-offset-4` | 1 | `text-underline-offset: 4px;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `w-[calc(100%+1.5rem)]` | 1 | `width: calc(100% + 1.5rem);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `w-1` | 1 | `width: var(--spacing);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `w-11` | 1 | `width: calc(var(--spacing) * 11);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `w-24` | 1 | `width: calc(var(--spacing) * 24);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `w-8` | 1 | `width: calc(var(--spacing) * 8);` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `w-max` | 1 | `width: max-content;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `w-px` | 1 | `width: 1px;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
| `whitespace-pre-line` | 1 | `white-space: pre-line;` | a `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; other text rules in the part's rule |
| `z-[42]` | 1 | `z-index: 42;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `z-[43]` | 1 | `z-index: 43;` | the part's rule (`position`, `inset-*`, `z-index`, `overflow`) |
| `-translate-x-1/2` | consts only | `--tw-translate-x: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); } @property --tw-translate-x { syntax: "*"; inherits: false; initial-value: 0; } @pro` | the part's own rule |
| `-translate-y-1/2` | consts only | `--tw-translate-y: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); } @property --tw-translate-x { syntax: "*"; inherits: false; initial-value: 0; } @pro` | the part's own rule |
| `border-[3px]` | consts only | `border-style: var(--tw-border-style); border-width: 3px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-[rgb(128_128_128/0.45)]` | consts only | `border-color: rgb(128 128 128/0.45);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-l` | consts only | `border-left-style: var(--tw-border-style); border-left-width: 1px; } @property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid;` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `border-white` | consts only | `border-color: var(--color-white);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `large:col-start-2` | consts only | `@media (width >= 75rem) { .large:col-start-2 { grid-column-start: 2; }` | `@media (width >= 75rem)` in the part's rule, with the replacement of `col-start-2` |
| `medium:mt-8` | consts only | `@media (width >= 37.5rem) { .medium:mt-8 { margin-top: calc(var(--spacing) * 8); }` | `@media (width >= 37.5rem)` in the part's rule, with the replacement of `mt-8` |
| `pointer-events-none` | consts only | `pointer-events: none;` | the part's own rule |
| `shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.3)]` | consts only | `--tw-shadow: 0 0 0 1px var(--tw-shadow-color, rgb(0 0 0/0.3)), 0 2px 6px var(--tw-shadow-color, rgb(0 0 0/0.3)); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-rin` | the part's shape, elevation or state tokens (`--mo-sys-shape-*`, `--mo-sys-elevation-*`) |
| `text-(--mo-sys-color-error)` | consts only | `color: var(--mo-sys-color-error);` | the part's rule reads the colour role, `var(--mo-sys-color-*)` |
| `w-[22.5rem]` | consts only | `width: 22.5rem;` | `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `aspect-ratio` in the part's rule (a centred width: `mo-center` with `--mo-comp-center-measure` set on the element; the width of text: `--mo-comp-block-text-measure-min` and `-max`) |
