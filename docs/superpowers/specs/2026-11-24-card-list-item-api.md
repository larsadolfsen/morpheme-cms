# One item API for `Card` and `ListItem` (contract 8, names batch 8i)

Status: **24 Nov 2026, as decided by the owner.** Owner, 24 Nov 2026: the contract-breaking part of "aligning cards and lists" (0.23 step 6)
goes into contract 8 now, so apps get one contract raise; the collection itself stays in 0.23 and must then need no contract change.
Sources: `specs/2026-11-17-list-to-cards-design.md` and `specs/2026-11-20-material-3-names-design.md`.

## Decision: each part keeps Material 3's names (owner, 24 Nov 2026)

`ListItem` keeps M3's slot names, as M3's list tokens (`docs/m3-tokens/md.comp.list.json`) have them: `leading-icon`, `leading-avatar`,
`leading-image`, `leading-video`, `trailing-icon`, `trailing-supporting-text`. So the props stay `leadingIcon`, `leadingIconSelected`,
`leadingAvatar`, `leadingImage`, `leadingVideo`, `leadingMedia` (the node a caller draws), `trailingIcon`, `trailingSupporting` and
`trailing`. Nothing is renamed or folded into a shared name. An earlier draft of this spec renamed them to `icon`, `iconSelected`,
`thumbnail` and `media`; that is undone.

The shared item API is only what both parts already share under one name: `headline`, `subhead` (the list's overline), `supporting`,
`actions`, `href`, `onClick`, `selected`, `dragged`, `truncate`/`disabled` where each has them, `className`, `children`. Where `Card` and
`ListItem` differ, each keeps M3's name for its own part (a card's `media` and `icon`, a list item's `leading*`). The collection (0.23)
builds a card from an item by taking the shared props, and maps the list's `leading*` to the card's parts itself, so it needs no new prop.

`Card`'s missing props (`thumbnail`, `menu`, `menuAt`, `disabled`, `trailingSupporting`, `truncate`) are additions, not renames: they need
no contract change and go to 0.23 with the collection. `Card` does not pretend to take them.

## What 8i changes for an app: only `columns`

`ListItem`'s `columns` prop and its class `mo-list__item-columns` (and the token `--mo-comp-list-item-columns-gap`) are removed (spec
`2026-11-17-list-to-cards-design.md`, section 9; M3 has no such part). Nothing else on `Card` or `ListItem` changes name.

| Component | Old | New |
| :--- | :--- | :--- |
| `ListItem` | `columns` | removed |
| class | `mo-list__item-columns` | dropped |

## The update's rewrite (`lib/migrate-code.mjs`)

The names map has a `propNames` section (`scripts/m3-names.json`: component, by its exported name → old prop → new prop, `null` to drop),
carried into `lib/migrate-code-maps.mjs`; `uiImports` records the exported name, so `<ListItem>` and an alias (`{ ListItem as Row }`)
are found.

| Form | Rewrite |
| :--- | :--- |
| `columns` as a bare attribute, `columns={true}` or `columns={false}` | **Safe, dropped.** |
| `columns={expr}` | **Unsafe:** the update stops and names file and line (it cannot know if it is on). |
| `<ListItem {...props}>` in a file that also writes `columns` as a word | **Unsafe:** stops, names file and line (decided by the PM: a spread stops only then; a spread built in another file is not seen, an accepted risk). |
| CSS or a class string with `mo-list__item-columns` | **Unsafe** (the class map drops it), file and line named. |

Tests: `lib/migrate-code.test.mjs`, and a made-up app in `scripts/check-cms-update.mjs`. Store items are never rewritten.

## Users in this repository

`columns` was used by `src/Library.tsx` (two lists), `src/Redirects.tsx` (two) and `src/ComponentGallery.tsx`: all removed, so those editor
rows lose the side-by-side layout. The demo and the site's blocks used none (the demo's pages are identical before and after).

## Apps

The owner's apps (`larsadolfsen/morpheme-apps`): a dry run found no `ListItem` with `columns` and no unsafe `ListItem` form. Sara's app
(`larsadolfsen/sarashjemmesidedata`, `src/apps/sara`, private) is site-own: the PM runs the dry run (`migrateCodeFile` of
`lib/migrate-code.mjs` over its files, `from: '0.19.5'`) after the push.
