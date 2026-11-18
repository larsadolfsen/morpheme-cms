# Tailwind removal: the batches, their order and what starts now

Written 18 Nov 2026 by the planner session, for the PM, who hands each batch to a new build session. The plan is
`2026-11-16-move-away-from-tailwind.md` (inventory, breakpoints, vocabulary, prose, risks); this file is the order of work.
Each batch is one file (`2026-11-18-tailwind-t<nn>-….md`) and one pull request into `0.18`; each states its files, the proof that
the rendered result is identical, its changeset, its checks and what must merge before it.

## Basis (owner, 18 Nov)

- "Remove Tailwind", now, **on the 0.18 line and inside contract 6**: no `THEME_API`/`APP_API` 7, `APP_APIS` stays `[6]`, one break for theme and app authors (no theme or app is released at 6 yet; only a `next` is staged).
- Defaults of the plan's decisions: literal breakpoints with a check (T03, T10); `mo-` layout classes (T04); the editor's `src/` in slices (T05 to T09); same result first, M3 tuning later (T13).
- CI: at most **two** Tailwind batches in CI at once.

## The batches

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
| [T10](2026-11-18-tailwind-t10-theme-fn-literals.md) | `theme()` to literal widths | the CSS split, T03 (the check accepts the literals) | medium |
| [T11](2026-11-18-tailwind-t11-theme-components.md) | `theme/components/` (266 uses) and the import of the vocabulary | the CSS split, T01, T04, T10 | large |
| [T12](2026-11-18-tailwind-t12-theme-pages.md) | `theme/layouts`, `theme/templates`, `defaults`, `site` and the editor preview (92 uses) | the CSS split, T01, T04, T11 | medium |
| [T13](2026-11-18-tailwind-t13-prose-own-css.md) | `prose` in our own CSS | the CSS split, T01 | medium |
| [T14](2026-11-18-tailwind-t14-reset.md) | Our own reset (Tailwind's preflight) | the CSS split, T01 | medium |
| [T15](2026-11-18-tailwind-t15-last-tailwind-names.md) | The last Tailwind-named reads, repointed | the CSS split, T01, T05 | small |
| [T16](2026-11-18-tailwind-t16-remove-tailwind.md) | Remove Tailwind (inside contract 6) | T05 to T09, T11 to T15 | large (wide, shallow) |
| [T17](2026-11-18-tailwind-t17-permanent-check.md) | The permanent check (the ratchet goes to zero) | T16 | small |

## Order and what can start now

Waves, two at a time, in this priority order. A batch starts when both of its predecessors have merged and a slot is free.

1. **Start now, in parallel (they touch neither `ui.css` nor `base.css`):** **T01** (proof tools, the progress meter, the `--tw-` and utility ratchet) and **T04** (the vocabulary, new files plus one line in `src/editor.css`).
2. **Next free slots:** **T03** (breakpoint tokens and the width check; small), then **T02** (the migration guide, docs only, so `morpheme-apps` can start migrating).
3. **When T01 and T04 have merged, still before the split is done:** the editor slices **T05** (`src/ui.tsx`, 617 uses), **T06**, **T07**, **T08**, **T09**, two at a time. They touch only `src/` and their own `src/editor-<area>.css`; the one shared line is an `@import` at the end of the import block of `src/editor.css`.
4. **After the CSS split's last PR and the `base.css` cleanup** (the split carries the three `@source` lines of `ui.css` to `base.css`; the PM tells the split session): **T10** (`theme()` to literals, mechanical), then **T11** (`theme/components`, and the import of the vocabulary into `base.css`), then **T12** (layouts, templates, `defaults`, `site`). **T13** (`prose`), **T14** (reset) and **T15** (the last Tailwind-named reads, after T05) may run beside them two at a time, in that order of need.
5. **T16** (remove Tailwind) when every other batch has merged and `tailwind:inventory` shows nothing left but the wiring. **T17** (the permanent check) right after.

Files each wave must keep away from: until the split finishes, nothing but T10 to T15 touches `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css`, `global.css`, and T10 to T15 wait for it; T01 to T09 never touch them.

## What this costs against the 0.21/0.23 plan, and what can stay late

- **Cost:** there is no deprecation line and no time for authors: `venus` and the store apps must be migrated before 0.18.0 is released (the gate), so 0.18.0 waits for all 17 batches, and the editor's `src/` rewrite (2,201 uses, 99 files) lands beside the 0.19 line, whose PM merges `0.18` forward after each batch.
- **Can stay late:** the M3 tuning of the text spaces and of `pre`/`kbd` colours, container-query conversions of components, `@custom-media`, subgrid; everything else has to be done, because T16 removes the packages.

## The gate that stays: installed themes and apps

Not a batch of this repository. Sites update themselves to a minor or patch, so **0.18.0 is not released** until `morpheme-apps` (`venus`, the apps), `morpheme-staging` and `morpheme-website` pass the same no-Tailwind check and are released at contract 6. Their own PM migrates them in parallel from T02 (the guide) and T04/T11 (the vocabulary in a build, i.e. a `next` after T11). Those repositories are not attached to the planner, so their real counts are unknown; the PM needs them counted before T16.

## Questions for the PM and the owner

1. **Surfaces.** About 24 static class attributes in the editor draw a background with a radius or a border (plus dynamic ones). The batches keep their look in named part rules and list them as **Surfaces**; whether any becomes a theme component is the owner's decision, later, never inside a migration (`developer` hard rule).
2. **0.18.0 waits for the whole removal.** The owner said remove it now; this makes the release wait for T01 to T17 and the app migration. Say so once if the owner expects 0.18.0 earlier.
3. **Release note.** Site owners see nothing. T16 carries a changeset `minor` for theme and app authors; the `release-notes` skill decides whether it also gets a note.
