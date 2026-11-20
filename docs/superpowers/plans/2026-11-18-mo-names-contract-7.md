# Every class and every custom property starts with `mo-`, inside contract 7 (plan)

Status: **decided by the owner, 18 November 2026** (the names saved in content too, below). Written by the CTO for
the PM, who hands each PR to a build session. It is part of 0.18.2 (the Tailwind removal, `2026-11-18-tailwind-batches.md`) and of
its contract raise to 7 (T16). The work goes into `feature/tailwind`, like the Tailwind batches.

The owner's words, 18 November:

- "Yes, write the plan inside contract 7. 0.18.1 is working on it right now. We need to get this code base up to a proper standard."
- On the naming pattern: "so we follow them" (WordPress's naming below), "but no old names for compatibility. we want those gone before 1.0".

## Why

The token rename (contract 6) gave every **declared** token its `--mo-` name. Two kinds of names were outside its scope, and they are
still unprefixed:

- **Classes.** On `feature/tailwind` at `28b5e589`, our CSS (`theme/`, `src/`, `pages/`, `defaults/`, `site/`) defines **848 class
  names without `mo-`**: 682 in `theme/`, 144 in the editor's `src/`, 22 in both. Only 35 have it (`mo-type-*`, the T04 layout
  classes). Examples: `.card-body`, `.card-selected`, `.block-*` (146), `.navigation-*` (44), `.list-*` (40), `.editor-*` (32).
- **Custom properties that are only read.** **474 of our own names** are read with a fallback but declared nowhere: hooks such as
  `var(--card-selected-surface, var(--mo-sys-color-secondary-container))` (`theme/styles/ui/card.css`, added by cards and lists today),
  and about 78 runtime values that code sets on an element (`--progress`, `--slider-start`, `--time-picker-angle`). `check:css-tokens`
  checks only declarations on `:root`, so new ones get in. A further 127 are Tailwind's (`--color-*`, `--text-*`, `--font-sans`), and T16
  removes them.

An unprefixed name collides with a theme's, an app's or a site's own `.card-body` or `--progress` without a sound. It is also two
naming systems in one codebase. Contract 7 already breaks every theme and app that used Tailwind, so renaming in the same raise means
authors migrate once.

## The naming pattern (following WordPress, with our prefix)

WordPress names a block `wp-block-<name>`, its parts `wp-block-<name>__<part>`, states and kinds `is-<word>` (`is-style-outline`,
`is-layout-flex`), what a block holds `has-<word>` (`has-background`, `has-primary-color`), and generates its variables from the theme's
settings (`--wp--preset--color--<slug>`). We follow that pattern for classes, with two differences:

- **`mo-` on everything**, also on the state words (`mo-is-selected`, not `is-selected`). WordPress's unprefixed `is-` and `has-`
  collide with everyone else's, which is the problem this plan removes.
- **No old names kept.** WordPress keeps its pre-block names (`alignleft`, `.button`) for ever. We remove ours: each PR renames a name
  everywhere and deletes the old one, as the token rename did. Owner: no old names for compatibility, gone before 1.0.

Custom properties keep the owner's 17 November rule (Material 3's tiers, `--mo-ref-*`, `--mo-sys-*`, `--mo-comp-<component>-*`), not
WordPress's double dashes.

| What | Pattern | Example (today → after) |
| :-- | :-- | :-- |
| A component, its root | `mo-<component>`, Material 3's component name, the same word as its `--mo-comp-<component>-*` tokens | `.card` → `.mo-card` |
| A component's part | `mo-<component>__<part>` | `.card-body` → `.mo-card__body`, `.card-check` → `.mo-card__check` |
| A kind (Material 3's variant) or a state | `mo-is-<word>`, on the root | `.card-selected` → `.mo-card.mo-is-selected`, `.button-filled` → `.mo-button.mo-is-filled` |
| What it holds | `mo-has-<word>` | `.card-with-media` → `.mo-card.mo-has-media`; `color-accent` in content → `mo-has-accent-color` |
| A block | `mo-block-<type>` and `mo-block-<type>__<part>` | `.block-accordion-answer` → `.mo-block-accordion__answer` |
| The editor's own parts | `mo-editor-<part>` | `.editor-fab` → `.mo-editor-fab` |
| Type and layout classes | unchanged (`mo-type-*`, `mo-row`, `mo-stack` …) | `body-small` → `mo-type-body-small` (it exists already) |
| A hook a theme or block sets | `--mo-comp-<component>-<part>-<attribute>`, Material 3's name where its specs page prints one (the token rename's method) | `--card-selected-surface` → a `--mo-comp-card-*` name from M1's map |
| A runtime value set by code | `--mo-comp-<component>-<name>` | `--slider-start` → `--mo-comp-slider-start` |

Not renamed, listed with a reason in the check's allowlist: other libraries' classes (`ProseMirror*`, the Markdown editor's, a store
app's embed such as `calendly-inline-widget`), `prose` and `not-prose` until T13 has its own (then `mo-prose`), and `data-*`
attributes (not names this plan covers).

## The pull requests

Each one goes into `feature/tailwind`, has a `patch` or empty changeset (the 0.18.2 rule), and proves the rendered result identical with
T01's tools: `compare-styles` of the demo and the starter (all pages, four widths, light and dark, every section colour; class
attributes may differ, computed styles may not), `compare-html --ignore-classes`, and the editor's `styles-snapshot`. Each renames its
names everywhere: CSS, `className` and `class` strings, `querySelector` and `classList` in `script.ts` and `lib/`, the checks in
`scripts/` (about 1,250 reads), the demo, the starter and the docs. Each lowers the check's counts by what it removed.

| PR | What | Starts after | Size |
| :-- | :-- | :-- | :-- |
| **M1** | The map and the ratchet. `scripts/mo-names.mjs` lists every unprefixed class and custom property and writes `docs/superpowers/plans/mo-names/map.json` (old → new, by the pattern above; a name the pattern does not settle goes to the PM as a question, never guessed). `scripts/check-mo-names.mjs` counts per file the unprefixed class definitions, class names in markup strings, and custom properties declared or read, and fails when a count rises or a new file has one (as T01's ratchet). Runs in `npm run check`. `docs/class-names.md`: the pattern. A section in the migration guide (T02's `docs/tailwind-migration.md`) with the map, so theme and app authors migrate once. | now (touches no CSS or markup) | medium |
| **M2** | The editor's own classes and properties (`src/`, 144 + 22 shared, `mo-editor-*`). | T05 to T09 (same files) | large |
| **M3** | The theme's UI components (`theme/ui/`, `theme/styles/ui/`, their hooks and runtime values). The card and list files are included: cards and lists are merged. | T10, T13 to T15 | large |
| **M4** | The blocks (`theme/blocks/`, `theme/styles/blocks/`, `src/standard/`, `block-*` → `mo-block-*`). | T11, T12 | large |
| **M5** | The site shell, layouts, templates, components, `defaults/`, `site/`, `pages/`, section colours (`.text-section-*`; also `CLAUDE.md`'s rule text). | T11, T12 | medium |
| **M6** | The names saved in content (below): the editor and the site, the repository's content, and the update's rewrite. | M1 | medium |
| **M7** | The permanent check: the ratchet at zero, no allowlist but the libraries' names; `check:css-tokens` also fails on a read of an unprefixed name; `check:themes` and `check:content` run it on a site's themes and apps. With T17. | M2 to M6 | small |

**T16 waits for M2 to M6**, so contract 7 is one raise. Its changeset and note say both what stopped working (utilities, `theme()`,
`@theme`) and which names changed (the map). M-PRs share the Tailwind batches' CI lane: at most two of either in CI at once, and an M-PR
never runs at the same time as the Tailwind batch that edits its files.

## Names saved in content (decided)

Six class names are written into a site's Markdown by the editor: `body-small`, `body-large`, `label-medium`, `color-accent`,
`color-muted` and the former `block-eyebrow` (`lib/body-size.mjs`, `lib/text-sizes.mjs`, `lib/text-colors.mjs`, `lib/eyebrow.mjs`). The demo
has 89, `demo/src/content/pages/typography.md` most of them. Sara's content has none of ours (one `calendly-inline-widget`). M6 makes the
editor write the new names (`mo-type-body-small`, `mo-has-accent-color` …) and the site read only them.

**The owner's decision, 18 November: "fix them in tailwind".** They are fixed in the Tailwind release itself (0.18.2, contract 7), not
left for a later migration and not kept as old names:

- **The repository's own content** (the demo, the starter, the docs' examples) is rewritten in M6, in the same PR as the code.
- **A site's existing pages** are rewritten by the nightly update that takes 0.18.2, in the same commit as the version
  (`worker/cms-update.js`, with `lib/migrate-content.mjs`'s rules, which rewrote `block-eyebrow` in 0.17): only the `class` attribute,
  never a word of text, idempotent, and undone with the version if the build fails. This is the one exception to "an update never touches
  content", because only the markup's class name changes, never the owner's words. A site that takes 0.18.2 by `npm install` instead
  runs `npx morpheme migrate`, which does the same rewrite; the release note says so.
- **Tests:** the rewrite's table is M1's map for these six names. A test rewrites a fixture page with all six, and leaves a page that
  already has the new names unchanged. A test of the update proves the version and the rewrite land in one commit and are undone together.

## The gate (added to the Tailwind gate)

0.18.2 is not released until, besides the Tailwind gate in `2026-11-18-tailwind-batches.md`, these read only the new names:

- `morpheme-apps`: Venus (about 140 class reads and 25 property reads in its CSS, 78 distinct names) and the apps. Their PM migrates
  them **once, from M1's map**: A1 and A2 of the Tailwind gate wait for M1, so nothing is migrated twice.
- `morpheme-staging`: its copy of Venus (about 130 reads) follows the store.
- Sara's own app `sara` (`src/apps/sara/`, about 54 reads; a site's own app is not in the store): a PR in her repository before her site
  takes 0.18.2. Her installed Venus follows the store.

## What stays

- The token rename's names and rules (`docs/css-tokens.md`); this plan only adds the names it did not cover.
- `data-*` attributes, ids and saved ids.
- Only the owner releases (`CLAUDE.md`).
