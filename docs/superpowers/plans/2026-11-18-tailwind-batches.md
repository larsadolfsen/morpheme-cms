# Tailwind removal: the batches, their order and what starts when

Written 18 Nov 2026 by the planner session, for the PM, who hands each batch to a new build session. The plan is
`2026-11-16-move-away-from-tailwind.md` (inventory, breakpoints, vocabulary, prose, risks); this file is the order of work.
Each batch is one file (`2026-11-18-tailwind-t<nn>-….md`) and one pull request into `main`; each states its files, the proof that
the rendered result is identical, its changeset, its checks and what must merge before it.

## Basis (owner, 18 Nov, confirmed in words)

**Owner, 19 Nov 2026: Tailwind is released as 0.19.0 (it was 0.18.2), after 0.18.1; read every "0.18.2" in the batch plans as 0.19.0.** Its merge into `main` adds one `minor` changeset (it starts the 0.19 line: contract 7); the batches' own changesets stay `patch` or empty. 

- **Release order (owner, 18 Nov): 0.18.0 (released), 0.18.1 (fixes, from `main`), 0.19.0 (Tailwind, contract 7; it was 0.18.2), then accessibility and small UI fixes (roadmap); the pre-built editor moved to 0.21 Build speed (owner, 19 Nov).** Contract 7 / Tailwind (0.19.0) is not released until `morpheme-apps` runs on it.
- **Tailwind ships as 0.19.0 (it was 0.18.2), with contract 7**: `THEME_API` and `APP_API` go from 6 to 7 and `APP_APIS` becomes `[7]` (as the token rename did with `[6]`), in batch T16.
- **Patch changesets in the batches** (`patch` or empty, never `major`); the merge of `feature/tailwind` into `main` adds the one `minor` that makes it 0.19.0 (owner, 19 Nov).
- **The work goes into `main` after the owner releases 0.18.0**, and after the CSS split is done (for the batches that touch its files). **No build session starts before 0.18.0 is released**, and none without the PM's word.
- The editor slices run beside the 0.19 line; each flows into `0.19` the same day (below).
- Defaults of the plan's decisions: literal breakpoints with a check (T03, T10); `mo-` layout classes (T04); the editor's `src/` in five slices (T05 to T09); same result first, M3 tuning later (T13).
- CI: at most **two** Tailwind batches in CI at once.
- Decided (owner, 18 Nov): **0.18.0 (contract 6) and 0.19.0 (Tailwind, contract 7; it was 0.18.2) are two separate releases.** Authors meet contract 6 and then 7; the guide (T02) is published first so anything released at 6 is already written without utilities.

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
| [T10](2026-11-18-tailwind-t10-theme-fn-literals.md) | `theme()` to literal widths | the CSS split, cards and lists steps 1 to 5, T03 (the check accepts the literals) | medium |
| [T11](2026-11-18-tailwind-t11-theme-components.md) | `theme/components/` (253 uses) and the import of the vocabulary | the CSS split, cards and lists steps 1 to 5, T01, T04, T10 | large |
| [T12](2026-11-18-tailwind-t12-theme-pages.md) | `theme/layouts`, `theme/templates`, `defaults`, `site` and the editor preview (78 uses) | the CSS split, cards and lists steps 1 to 5, T01, T04, T11 | medium |
| [T13](2026-11-18-tailwind-t13-prose-own-css.md) | `prose` in our own CSS | the CSS split, cards and lists steps 1 to 5, T01 | medium |
| [T14](2026-11-18-tailwind-t14-reset.md) | Our own reset (Tailwind's preflight) | the CSS split, cards and lists steps 1 to 5, T01 | medium |
| [T15](2026-11-18-tailwind-t15-last-tailwind-names.md) | The last Tailwind-named reads, repointed | the CSS split, cards and lists steps 1 to 5, T01, T05 | small |
| [T16](2026-11-18-tailwind-t16-remove-tailwind.md) | Remove Tailwind and raise the contract to 7 | T05 to T09, T11 to T15, and M2 to M6 of the `mo-` names (below) | large (wide, shallow) |
| [T17](2026-11-18-tailwind-t17-permanent-check.md) | The permanent check (the ratchet goes to zero) | T16 | small |

## The `mo-` names, in the same contract (owner, 18 Nov)

Every class and custom property of ours gets the `mo-` prefix inside contract 7, so authors migrate once: `2026-11-18-mo-names-contract-7.md` (PRs M1 to M7). M1 (the map and the ratchet) can start now. M2 to M6 each start after the Tailwind batches that edit their files. They share this lane: at most two of either in CI at once. T16 waits for M2 to M6, and M7 goes with T17. A1 and A2 below wait for M1's map, so Venus and the apps are migrated once.

## Order and who can run in parallel

Waves, two at a time, in this priority order, once 0.18.0 is released and the PM says. A batch starts when both of its predecessors have merged and a slot is free.

1. **First pair (they touch neither `ui.css` nor `base.css`):** **T01** (proof tools, progress meter, the utility and `--tw-` ratchet) and **T04** (the vocabulary: new files plus one line in `src/editor.css`).
2. **Next free slots:** **T03** (breakpoint tokens and the width check; small), then **T02** (the migration guide, docs only, so `morpheme-apps` can migrate in parallel).
3. **When T01 and T04 have merged, and while the CSS split is still moving:** the editor slices **T05** (`src/ui.tsx`, 617 uses), **T06**, **T07**, **T08**, **T09**, two at a time. They touch only `src/` and their own `src/editor-<area>.css`; the one shared line is an `@import` at the end of the import block of `src/editor.css`.
4. **After the CSS split's last PR, the `base.css` cleanup and steps 1 to 5 of the cards-and-lists plan** (`2026-11-17-cards-and-lists-0-19.md`, in 0.18.0) (the split carries the three `@source` lines of `ui.css` to `base.css`; the PM tells the split session): **T10** (`theme()` to literals), then **T11** (`theme/components`, and the import of the vocabulary into `base.css`), then **T12** (layouts, templates, `defaults`, `site`). **T13** (`prose`), **T14** (reset) and **T15** (the last Tailwind-named reads, after T05) run beside them two at a time.
5. **T16** (remove Tailwind, contract 7) when every other batch has merged and `tailwind:inventory` shows nothing left but the wiring. **T17** (the permanent check) right after. The owner releases 0.18.2 when the gate (below) is met.

Until the split finishes nothing but T10 to T15 touches `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css`, `global.css`, and T10 to T15 wait for it; T01 to T09 never touch them.

## The card and list files are not in these batches (PM, 18 Nov)

Cards and lists (steps 1 to 5 of `2026-11-17-cards-and-lists-0-19.md`, PR #886) go into 0.18.0 in plain CSS without Tailwind, so the batches drop their files; the list is the plan's section *The card and list files (taken out of the Tailwind batches)*, and every spec repeats it in its rules. On `origin/0.18` at `b328d830` (18 Nov) the effect on the counts is small, because the card and list blocks and `theme/ui` parts already have no utility class:

- **Utility uses taken out: 27** (2,559 → **2,532** left for the batches; `theme/` and `defaults/` 358 → **331**): `theme/components/PostCard.tsx` 7 and `PostList.tsx` 6 (T11: 266 → **253** uses, 28 → **26** files) and the suggestion card of `theme/templates/NotFound.astro` 14 (T12: 92 → **78** uses; `NotFound.astro` keeps 2, `mt-8 medium:mt-12` on its `Container`). Every other card and list file (`theme/ui/Card.tsx`, `List.tsx`, `ImageTile.tsx`; the card and list blocks) has 0 utility uses today.
- **`theme()` and CSS:** the card and list CSS (`cards.css` 6 `theme()`, `lists.css` 2, the `tokens/*/comp/card.css` and `comp/list.css` and the cards' and lists' token files, and the card and list rules of `blocks.css` and `global.css`) is rewritten by steps 1 to 5. T10 skips these files and reports any that still hold a `theme()` after step 5; T13 touches the `prose` rules only; T14 and T15 wait for step 5 because they edit `base.css` and the token files.
- **Still the batches' work:** `ChoiceGroup`, `Search`, `ActionBar` (no utility uses today; their CSS may hold a `theme()` that T10 converts), `defaults/popup.tsx` (T12) and all of `src/` (T05 to T09, unchanged: 2,201 uses).
- **New order constraint:** T10 to T15 now wait for the CSS split **and** steps 1 to 5; T01 to T09 are not affected (they touch no card or list file).

## Editor slices: how each flows into 0.19, and the freeze windows

After a slice merges into `main`, the 0.19 PM merges `main` into `0.19` the same day (a merge commit, never a rebase), resolves the conflicts, runs `npm run check` on `0.19` and pushes on its slot. **Freeze window** of a slice: from its `ready:` message until that merge, no PR into `0.19` or `main` touches the slice's files; a PR that must touch one waits, or merges `main` into itself after the slice. The PM announces each window.

| Slice | Files frozen |
| :-- | :-- |
| T05 | `src/ui.tsx`, the import block of `src/editor.css` |
| T06 | `src/Screen.tsx`, `Media.tsx`, `Library.tsx`, `SelectionParts.tsx`, `PreviewScreen.tsx`, `UpdatesNotice.tsx` |
| T07 | `src/NavigationRestParts.tsx`, `fields.tsx`, `AppList.tsx`, `BrandForm.tsx`, `CommunicationParts.tsx`, `BlockParts.tsx`, `SearchPreview.tsx`, `ContainmentParts.tsx`, `NavigationParts.tsx`, `BlockDialog.tsx` |
| T08 | `src/ThemeStore.tsx`, `App.tsx`, `BlockSettings.tsx`, `PickerParts.tsx`, `EntryForm.tsx`, `ActionParts.tsx`, `MediaProviderPicker.tsx`, `CmsPage.tsx`, `ReleaseNotes.tsx`, `Assistants.tsx`, `Colors.tsx`, `Licenses.tsx`, `MarkdownEditor.tsx`, `Parts.tsx`, `CropView.tsx`, `ask.tsx`, `PartsShown.tsx`, `Redirects.tsx`, `DashboardEdit.tsx` |
| T09 | the 63 remaining `src/` files that `tailwind:inventory --files` lists (several 0.19 PRs touch these, so this is the longest window; the batch is split into two PRs by file list if the PM asks) |
| T11, T12 | `theme/components/**`; `theme/layouts/**`, `theme/templates/**`, `defaults/popup.tsx`, `theme/editor/previews.tsx`, `site/sections.ts` |

## The gate that stays: installed themes and apps

Not a batch of this repository. Sites update themselves to a minor or patch, so **contract 7 / Tailwind (0.19.0) is not released** until `morpheme-apps` (`venus`, the apps), `morpheme-staging` and `morpheme-website` pass the same no-Tailwind check and are released at contract 7 (and the store, `morpheme-appstore`, offers contract 7). Their own PM migrates them in parallel from T02 (the guide) and T04/T11 (the vocabulary in a build, i.e. a `next` after T11). Counted 18 Nov (plan §1.9): `venus` has 3 `theme()` and 1 `@theme inline` (CSS only, no utility) and 145 reads of old token names; `cookiescanner` has 4 class attributes (7 utility uses); the other seven apps have none; all eight apps are at `api` 4 or 5, none at 6; `morpheme-staging` holds a copy of venus and no utility; the Tailwind packages and the Prettier plugin are in both repositories' `package.json`/`.prettierrc.json`. `morpheme-website` (counted too): the same cookiescanner copy (4 attributes), the four packages and the plugin, and a few lines of text naming Tailwind in its docs; its theme `saturn` is not in its tree, so it is uncounted. The work in those repositories (not batches of this one): **A1** venus (after M1's map: its class and custom-property names too; the 3 `theme()` to `37.5rem`, `@theme inline` font to a plain `--mo-ref-…` token, the 145 reads to `--mo-*` names, `api` 7); **A2** the eight apps (`api` 7; cookiescanner's 4 attributes to the `mo-` vocabulary); **A3** `package.json`/`.prettierrc.json` of `morpheme-apps`, `morpheme-staging` and `morpheme-website` (drop the four packages and the plugin); **A4** `morpheme-website`: cookiescanner's 4 attributes, and the Tailwind lines in `CLAUDE.md`, `docs/rules.md`, `docs/platform.md`, `README.md` and the `site-editor-*` skills; the staging copy of venus follows the store.

## Questions for the PM and the owner

1. **Decided: two separate releases** (owner, 18 Nov). Nothing starts before the owner has released 0.18.0.
2. **Surfaces.** About 24 static class attributes in the editor draw a background with a radius or a border (plus dynamic ones). The batches keep their look in named part rules and list them as **Surfaces**; whether any becomes a theme component is the owner's decision, later, never inside a migration (`developer` hard rule).
3. **The store.** Contract 7 needs `morpheme-appstore` to accept and offer 7; T16 lists the files here that name 6, the PM asks for the matching PR there.
4. **Release note.** Site owners see nothing. T16 carries a `patch` changeset for theme and app authors; the `release-notes` skill decides whether it also gets a note.
