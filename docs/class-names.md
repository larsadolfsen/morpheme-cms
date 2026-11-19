# Class and custom-property names: everything starts with `mo-`

Owner decision, 18 November 2026. Every class and every custom property of the CMS, the theme Material, the editor, and so of every theme and app
built on them, starts with `mo-`, inside contract 7. No old name is kept for compatibility. The plan is
`docs/superpowers/plans/2026-11-18-mo-names-contract-7.md`; this page is the pattern. The map of every old name to its new one is
`docs/superpowers/plans/mo-names/map.json` (made by `npm run mo-names:map`); a theme or app author reads it in
[`tailwind-migration.md`](tailwind-migration.md), *The `mo-` names*.

## The pattern

It follows WordPress (`wp-block-<name>`, `wp-block-<name>__<part>`, `is-<state>`, `has-<what>`), with two differences: `mo-` is on everything,
the state words too (`mo-is-selected`, never `is-selected`), and no old name stays.

| What | Pattern | Example (today → after) |
| :-- | :-- | :-- |
| A component, its root | `mo-<component>`: Material 3's component name, the same word as its `--mo-comp-<component>-*` tokens | `.card` → `.mo-card` |
| A component's part | `mo-<component>__<part>` | `.card-body` → `.mo-card__body` |
| A kind (Material 3's variant) or a state | `mo-is-<word>`, on the root | `.card-selected` → `.mo-card.mo-is-selected` |
| What it holds | `mo-has-<word>` | `.card-with-media` → `.mo-card.mo-has-media`; `color-accent` → `mo-has-accent-color` |
| A block | `mo-block-<type>`, `mo-block-<type>__<part>` | `.block-accordion-answer` → `.mo-block-accordion__answer` |
| The editor's own parts | `mo-editor-<part>` | `.editor-fab` → `.mo-editor-fab` |
| Type and layout classes | already `mo-type-*`, `mo-row`, `mo-stack` … | `body-small` → `mo-type-body-small` |
| A hook a theme or block sets | `--mo-comp-<component>-<part>-<attribute>` | `--card-selected-surface` → `--mo-comp-card-selected-surface` |
| A value code sets on an element | `--mo-comp-<component>-<name>` | `--slider-start` → `--mo-comp-slider-start` |

Custom properties keep the owner's 17 November rule (`docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*`, `--mo-comp-<component>-*`), not WordPress's
double dashes. Where Material 3's specs page prints a name for a hook, the renaming PR uses it (the token rename's method); the map holds the name
the pattern gives, and the PR that renames the component checks it against the page.

## Not renamed

Listed with reasons in `NOT_RENAMED` of `scripts/mo-names.mjs`: other libraries' classes (`ProseMirror*`, `cm-*`, a store app's embed such as
`calendly-*`), `prose` and `not-prose` until T13 has its own (then `mo-prose`), and the `dark` class of the theme mode. Also not covered: `data-*`
attributes, ids and saved ids; Tailwind's own custom properties (`--tw-*` and its `@theme` namespaces, which T16 removes).

## Settled by the PM

The PM settled these on 18 November 2026; the map marks each `"settledBy": "PM"` (the owning M-PR reads Material 3's page and may correct one):

- Tailwind utilities still defined in CSS (`mb-*`, `mt-*`, `pt-*`, `pb-*`, `py-*`, `gap-*`, `space-y-*`): not renamed, `"status": "removed"`: the Tailwind batches remove them.
- A block part whose type is no block folder belongs to the block that draws it: `mo-block-<folder>__<part>`, only when every file that defines or uses the name is in that one folder.
- Editor inline blocks: `inline-*` → `mo-editor-inline-*` (M2). The site shell: `site-*` → `mo-site-*` (M5). `md-drawer*` → `mo-navigation-drawer*`.
- Progress: `mo-progress-indicator` with `mo-is-circular` or `mo-is-linear`. Tabs: `mo-tabs`, `tab-*` → `mo-tabs__tab-*`. Ripple: `mo-ripple`.
- A state with a part (`card-selected-title`): the part's class plus `mo-is-selected`. A hover or focus state stays a CSS pseudo-class (`.mo-card.mo-is-selected:hover`).

## Settled in M5

The site shell's names, settled by the pattern (M5 reads Material 3 only where a name is a component; the footer, header menu, action bar, logo, post list and section have no Material 3 page):

- Footer `md-footer*` → `mo-footer`, `mo-footer__<part>`. Header menu `md-nav-item` → `mo-header__nav-item` (with `mo-has-children`), `md-nav-toggle` → `mo-header__nav-toggle`.
- Action bar `theme-action-bar*` → `mo-action-bar`, `mo-action-bar__row`, `mo-action-bar__text`; the editor's drawing is `mo-action-bar mo-is-drawn`. Logo `theme-logo-*` → `mo-logo__tile`, `mo-logo__mark` (`mo-is-small`); the mask `logo-mark` → `mo-logo-mark`.
- Post list `theme-post-*` → `mo-post-list`, `mo-post-list__image|title|excerpt`, `mo-has-columns`, `mo-is-empty`; `post-card` → `mo-post-card`; `post-lead` → `mo-post__lead`; `theme-title` → `mo-page-title`.
- Page `page-with-side` → `mo-page__content mo-has-side`, `page-side` → `mo-page__side`; `not-found-suggestion` → `mo-not-found__suggestion`; `block-place` → `mo-placed-block`; `theme-home-first`/`theme-blog-first` → `mo-home__first`/`mo-blog__first`.
- Sections: `text-section` → `mo-text-section`; its colour is the kind `mo-is-surface|primary|secondary|tertiary`, `text-section-picture` → `mo-has-image`, `text-section-full` → `mo-is-full`, `text-section-image` → `mo-text-section__image`. A kind that replaces a class in a selector is written `:where(.mo-text-section).mo-is-primary`, so the specificity stays one class.
- `--motion-ease`, `--motion-ease-quick` → `--mo-sys-motion-ease`, `--mo-sys-motion-ease-quick`; `--carousel-*` → `--mo-comp-carousel-*`; `carousel-<layout>` → `mo-carousel__<layout>`; `grid-span-*` → `mo-grid__span-*`; `block-cards-<primary|secondary|tertiary>` → `mo-block-cards__<…>`; the unused `block-price-*` → `mo-block-pricecards__*`.
- Left to M4 (they are generated or shared with block files): `block-plans-2|3|4`.

## Settled in M4

The blocks' names (`theme/blocks/`, `theme/styles/blocks/`, `src/standard/` and the block parts' CSS). M1's map names stay for the `block-*` names it settled (`block-accordion-answer` → `mo-block-accordion__answer`, `block-table-grid` → `mo-block-table__grid` …). The rest the pattern left open is settled here, by one rule: a part drawn by one block folder belongs to it (`mo-block-<folder>__<old name without block->`); a shared part that no folder owns (the vocabulary apps' blocks use) is its own type (`mo-block-<root>`, `mo-block-<root>__<part>`); a state or a hold is `mo-is-*` or `mo-has-*`. A state keeps one class of specificity: its rule is the same one class as before.

| Old | New | Why |
| :-- | :-- | :-- |
| `block-card`, `block-card-<part>` | `mo-block-cards__card`, `mo-block-cards__card-<part>` | drawn by the Link cards block (the Accordion and the editor's inline cards reuse them) |
| `block-plan`, `block-plan-<part>` (`amount`, `badge`, `buttons`, `features`, `name`, `price`, `text`, `unit`), `block-plans`, `block-plans-list`, `block-plans-2\|3\|4` (and `block-plans-<n>`) | `mo-block-pricecards__plan`, `__plan-<part>`, `__plans`, `__plans-list`, `__plans-<n>` | Price cards block |
| `block-plan-featured` | `mo-is-featured` | state of a plan |
| `block-price-list`, `block-price-row`, `block-price-row-<part>`, `block-prices` | `mo-block-pricecards__list`, `__row`, `__row-<part>`, `__prices` | the rest of the dead `block-price-*` family, as M5 did `block-price-card*` |
| `block-testimonial`, `block-testimonial-<part>` | `mo-block-testimonials__testimonial`, `__testimonial-<part>` | Testimonials block |
| `block-filters`, `block-empty`, `block-sr-only` | `mo-block-testimonials__filters`, `__empty`, `__sr-only` | only the Testimonials block draws them |
| `block-step`, `block-step-<part>` (`body`, `number`, `text`, `title`) | `mo-block-steps__step`, `__step-<part>` | Steps block |
| `video-facade`, `video-facade-<part>` (`image`, `still`, `title`) | `mo-block-video__facade`, `__facade-<part>` | Video block (the build writes them, not saved content) |
| `block-head`, `block-subheading` | `mo-block-head`, `mo-block-head__subheading` | shared head of every block (`BlockHead.tsx`) |
| `block-more`, `block-more-button` | `mo-block-more`, `mo-block-more__button` | shared (`MoreRows.tsx`: Accordion and List) |
| `block-in-text` | `mo-is-in-text` | state: the block sits in the page's text |
| `block-with-badge` | `mo-has-badge` | what the part holds |
| `block-panel`, `block-panel-<part>` (`icon`, `part`, `text`, `title`), `block-panels`, `block-cta`, `block-cta-<part>`, `block-facts`, `block-facts-amount`, `block-media`, `block-media-<part>`, `block-person`, `block-person-<part>`, `block-timeline`, `block-timeline-<part>`, `block-link`, `block-link-row`, `block-link-row-<part>`, `block-arrow-link`, `block-icon-list`, `block-copy-rows`, `block-copy-value`, `block-badge`, `block-tag`, `block-terms`, `block-small-screens` | the same word with `mo-`, parts `mo-block-<root>__<part>` | shared parts no block folder owns: each is its own type |
| `--step` (the timeline's runtime value) | `--mo-comp-block-timeline-step` | a value set on an element |

Left alone, with the reason: `block-page`, `block-page-main` (the editor's own, M2); `.carousel`, `.image-grid` (the theme's components, M3); `js` (the root's state, M5); `contains-task-list`, `task-list-item` (the Markdown renderer's own classes); `body-*`, `label-medium`, `color-*` (saved in content, M6).

## Settled in M6c

The alignment of a paragraph or a smaller heading: `text-align-center`, `text-align-right` → `mo-has-text-align-center`, `mo-has-text-align-right` (what the block holds, `mo-has-<word>`). They are **not saved in content**: the editor writes only the line `<div data-align="center"></div>` (`lib/text-align.mjs`) and the site's pipeline (`rehypeAlign`) puts the class on the block after it, so no content is rewritten and `lib/content-class-names.mjs` is unchanged. A theme that styled the old classes uses the new ones. The other classes the editor writes into content (`lib/body-size.mjs`, `body-large.mjs`, `eyebrow.mjs`, `text-sizes.mjs`, `text-colors.mjs`) already have their `mo-` names (M6); nothing else the editor saves is an unprefixed class.

## Settled in M3

M3 renamed the theme's UI components (`theme/ui/`, `theme/styles/ui/`, `cards.css`, their hooks and runtime values) and settled the names the map left open. Material 3 pages read on 19 November 2026: Progress indicators (overview and specs), Navigation bar (overview); the others are named by their component pages as listed in the `developer` skill. Where M3's name or the tokens' word differs from the map, the decision is here; the map stays the record of the old names.

- **Kinds.** `button|icon-button|card|chip|text-field` with `elevated|filled|outlined|tonal`, and `checkbox|text-field|time-picker` with `error`, all keep `mo-is-<word>` on their root. The root is always in the selector: `.mo-card.mo-is-filled`, written `:where(.mo-card).mo-is-filled` where the old selector was one class, so the specificity stays what it was. Sizes, shapes and the other variants stay parts (`mo-button__large`, `mo-button__text`), as the map has them.
- **Progress indicators.** Material 3's Specs page names two components, *Linear progress indicator* and *Circular progress indicator*, so each is a root: `mo-linear-progress-indicator`, `mo-circular-progress-indicator`, parts `__active`, `__track`, `__indeterminate`, `__wavy`, `__thick`. This replaces the PM default (one root with `mo-is-linear|circular`). Hooks: `--mo-comp-linear-progress-indicator-*`, `--mo-comp-circular-progress-indicator-*` (the form the existing tokens already have); the value code sets is `--mo-comp-progress-indicator-progress`.
- **Navigation, search, radio, setting.** The root is Material 3's component name, not the tokens' folder word: `mo-navigation-bar`, `mo-navigation-rail`, `mo-navigation-drawer` (one name with M5's `md-drawer-*`), `mo-search-bar`, `mo-search-view`, `mo-radio-button`, `mo-radio-group`, `mo-setting-row`, `mo-setting-list`, each with `__<part>`. Hooks keep the map's `--mo-comp-navigation-*`, `--mo-comp-search-*`, `--mo-comp-radio-*`, `--mo-comp-setting-*`.
- **A state with a part.** No composite: `button-selected-icon` is `mo-button__selected-icon` (like `unselected-icon`), `icon-button-selected-icon` is `mo-icon-button__selected-icon`, `text-field-error-icon` is `mo-text-field__error-icon`, `text-field-invalid-text` is `mo-text-field__invalid-text`, `slider-active-track` is `mo-slider__active-track`. A kind or state class that sits on an element that is not the root is a part too: `time-picker-error` (the error line) is `mo-time-picker__error`, `toolbar-with-fab` and `toolbar-with-fab-vertical` (the box round a toolbar and its FAB) are `mo-toolbar__with-fab` and `mo-toolbar__with-fab-vertical`.
- **Questions of the map.** `choice-group` is `mo-choice-group` (parts `__list`, `__buttons`, `__sample` …; hooks `--mo-comp-choice-group-*`): no Material 3 page names it (the closest are Button groups and Segmented buttons). `exposed-dropdown-menu` is `mo-exposed-dropdown-menu` and `dropdown-menu` is `mo-dropdown-menu` (Menus has no page for either). `--keyboard-inset` and `--visual-height` are `--mo-comp-bottom-sheet-keyboard-inset` and `--mo-comp-bottom-sheet-visual-height` (the bottom sheet sets them). `--progress` is above.
- **`carousel` and `image-grid`** (left to M3 by M4). `carousel` is `mo-carousel`. `image-grid` is `mo-staggered-grid`, not `mo-grid`: `mo-grid` is T04's plain-columns layout class (`docs/theme-layout-classes.md`), a different thing. Its spans keep M5's `mo-grid__span-full` and `mo-grid__span-compact` (a later PR can move them under `mo-staggered-grid__`).
- **`--text-field-*`** (eleven names such as `--text-field-icon-size`) were hidden from the map by Tailwind's `--text-*` namespace. They are `--mo-comp-text-field-*` now.
- **Hooks without a style rule.** Nine classes of `theme/ui/` have no rule in any stylesheet, so the map does not list them: `fab-menu-item`, `menu-item-label`, `radio-button-text`, `segmented-button-label`, `snackbar-action`, `snackbar-close`, `time-picker-12h`, `tooltip-action`, `tooltip-supporting-text`. They follow the pattern (`mo-fab-menu__item`, `mo-menu__item-label` …).
- **Not renamed.** `js` (the flag on `<html>`, set in `theme/layouts/Base.astro`, read by `base.css` and two block files: M4 and M5's files). Container names (`container: navigation-bar / inline-size`, `@container slider-active-track …`): they are neither classes nor custom properties. `data-*` values such as `data-wide="side-sheet"`.
- **Checks.** `check:colors` counts a value that code sets (`setProperty('--mo-…')`, a style object's key) as defined, since these runtime values now have `--mo-` names, and lists `--mo-comp-button-pressed-radius` (a hook nothing sets, on purpose) with its reason. `site/themeParts.mjs` lists the parts by their new prefixes; the kinds and states (`mo-is-*`, `mo-has-icon`, `mo-has-media`) are in `NOT_PARTS`, because the root's part covers them.

## A name the pattern does not settle

`map.json` marks it `"status": "question"` and gives no new name. Nobody guesses one: the question goes to the PM, who brings it to the owner.
`questions` in the map groups them by family, with the M-PR that owns each (`owners`: M2 the editor, M3 the theme's UI, M4 the blocks, M5 the rest), (`block-price`, `site-block`, `choice-group` …) so a family is answered once.

## The check

`npm run check:mo-names` (`scripts/check-mo-names.mjs`, in `npm run check`) is a ratchet like `check:tailwind`. Per file it counts the unprefixed
class definitions in stylesheets, the unprefixed class names in markup and code strings (only names a stylesheet defines, so Tailwind utilities and
other libraries are never counted), and the unprefixed custom properties declared and read. It fails when a count is higher than
`scripts/mo-names-allowlist.json` lists or a file not listed has any. A PR that renames names lowers the numbers (`npm run check:mo-names -- --list`
prints the current ones). The last PR of the plan (M7) takes the list to zero.
