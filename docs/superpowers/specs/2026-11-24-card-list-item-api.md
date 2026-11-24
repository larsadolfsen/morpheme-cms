# One item API for `Card` and `ListItem` (contract 8, names batch 8i)

Status: **24 Nov 2026, for the PM's go.** Owner, 24 Nov 2026: the contract-breaking part of "aligning cards and lists" (0.23 step 6) goes
into contract 8 now, so apps get one contract raise; the collection itself (list, cards or table per window size) stays in 0.23 and must
then need no contract change. Sources: `specs/2026-11-17-list-to-cards-design.md` (5.2 anatomy, 6, 8.1 table, 9 decisions) and
`specs/2026-11-20-material-3-names-design.md` (the names map and the update's rewrite). Code read: `theme/ui/Card.tsx`, `theme/ui/List.tsx`,
`src/ui.tsx` (the editor's `ListItem`), `lib/migrate-code.mjs`.

**Found while reading:** the spec (5.2) and the task list `thumbnail`, `menu`, `menuAt` and `disabled` as props `Card` has today. On this base
(`feature/0.19.6-m3-names`) `Card` has none of them: it has `kind`, `dragged`, `selected`, `media`, `icon`, `headline`, `headingLevel`,
`subhead`, `supporting`, `children`, `actions`, `href`, `as`. They are new on `Card`, not renames. Also `ListItem` has no `menu`.

## 1. The shared item (props both take, one name for one meaning)

One exported type, `ItemProps` (in `theme/ui/Item.ts`, a types-only file), M3's part names:

| Prop | M3 part | `Card` today | `ListItem` today |
| :--- | :--- | :--- | :--- |
| `headline`, `subhead`, `supporting` | Headline, subhead (the list's overline), supporting text | same | same |
| `icon` (`IconRef`) | Icon / Leading icon | `icon` (ReactNode, widened to `IconRef`) | `leadingIcon` → **`icon`** |
| `thumbnail` (a letter or an image) | Thumbnail / Leading avatar | none: **new** (the theme's `Avatar`) | `leadingAvatar` → **`thumbnail`** |
| `media` (`ItemMedia` or a node) | Media / Leading image, leading video | `media` (node) | `leadingImage`, `leadingVideo`, `leadingMedia` → **`media`** |
| `trailingSupporting` | Trailing supporting text (card: end of the subhead line, decision 9.7) | none: **new** | same |
| `actions` | Buttons, icon buttons (card: action area; list: secondary actions, a multi-action item) | same | same |
| `menu` (a node: the theme's `Menu`) | Overflow menu | none: **new** | none: **new** (drawn last among the actions) |
| `href`, `onClick` | Directly actionable | `href`; `onClick` through the rest | same |
| `selected`, `disabled`, `dragged` | States | `selected`, `dragged`; `disabled` **new** | same |
| `truncate` | text "can wrap or be truncated" (9.6: stays) | **new** | same |
| `className`, `children`, `data-…`/`aria-…` | | same | same |

`ItemMedia = { src: string; alt?: string; video?: true }`: an image, or, with `video`, a video's thumbnail (the list's 114 × 64 form;
the card draws it 16:9 at its top). A node as `media` is drawn as today (the card: edge to edge at the top, or a caller's own image in the
list's image box: `leadingMedia`). `children` has two meanings and keeps both: a card's sit between the text and the actions, a list item's
come after the item (a sheet, an expanded body); the collection moves only `children`-free items to the list (9.5).

## 2. What stays on one only, and why

- **`ListItem` only:** `leading` (anything: a block's own leading part), `leadingIconSelected` → **`iconSelected`** (the editor's wrapper
  already says `iconSelected`), `trailingIcon`, `trailing` (decision 9.7: not drawn on a card), `control` (a card's selection control is an
  `actions` entry), `lines` (card height follows its content), `expand*` and `expandToggle` (List - Expand), `selectable`, `selecting`,
  `selectOnLeading`, `onSelectDrag`, `onSelectedChange`, `presentation`, `li`.
- **`Card` only:** `kind` (a list has `kind` on the *List*), `headingLevel`, `as`, `menuAt` (`'top' | 'bottom'`, M3's two corners), and `media`
  as `true` (the first child is a CardMedia).
- **Removed:** `columns` (9.6; M3 has no such part). The class `mo-list__item-columns` goes with it (css in `theme/styles/ui/list.css`,
  `tokens/material/comp/list.css`). `truncate` stays on both.
- The collection (0.23) builds a card from an item by taking the shared props only, so it needs no new prop.

## 3. Old name → new name

| Component | Old | New |
| :--- | :--- | :--- |
| `ListItem` | `leadingIcon` | `icon` |
| `ListItem` | `leadingIconSelected` | `iconSelected` |
| `ListItem` | `leadingAvatar` | `thumbnail` |
| `ListItem` | `leadingImage={{ src, alt }}` | `media={{ src, alt }}` |
| `ListItem` | `leadingVideo={{ src, alt }}` | `media={{ src, alt, video: true }}` |
| `ListItem` | `leadingMedia={node}` | `media={node}` |
| `ListItem` | `columns` | removed (a bare attribute is dropped) |
| `Card` | none | none (only additions) |

Not renamed on purpose: `SearchBar`'s own `leadingIcon` (Search's leading icon, a different component and M3's name there), the editor
wrapper `src/ui.tsx` `ListItem` (it already takes `icon` and `iconSelected`; it passes the new names on), and the *stored* field names of the
List block (`row.leading: 'avatar' | 'square' | 'landscape'`, i18n `blocks.list.leadingIcon`): content, not props.

## 4. The update's rewrite (`lib/migrate-code.mjs`)

Today `m3.props` only renames a *value* (`size="medium"`) on a literal attribute. This needs a second map, **`propNames`**
(component → old prop → new prop | `null` to drop | `{ to, add }` for `leadingVideo`), in `scripts/m3-names.json`, carried by
`scripts/migrate-code-maps.mjs` into `lib/migrate-code-maps.mjs`. `uiImports` must also record the *exported* name, because `ListItem` is
a named export of `@theme/ui/List` (today it records the file name only), so `<ListItem>` and `<Row>` (`{ ListItem as Row }`) are found.

| Form | Rewrite |
| :--- | :--- |
| `leadingIcon`, `leadingIconSelected`, `leadingAvatar`, `leadingImage`, `leadingMedia` with any value (literal, `{expr}`) | **Safe, rewritten.** Only the attribute name changes; the value is not read. |
| `columns` as a bare attribute or `columns={true}` | **Safe, dropped.** The side-by-side layout goes (the owner's decision); it is listed in the release note, not as unsafe. |
| `columns={expr}` | **Unsafe:** stops, names file and line (cannot know if it is on). |
| `leadingVideo={{ … }}` (an object literal) | **Safe**, `video: true` added after the last key. |
| `leadingVideo={expr}` (anything else) | **Unsafe:** stops, names file and line (`undefined` must stay "no video"). |
| `<ListItem {...props}>` in a file that also spells an old name as a word (an object key, a type) | **Unsafe:** stops, names file and line: the spread may carry an old name. |
| CSS or a class string with `mo-list__item-columns` | **Unsafe** (the class map drops it), file and line named. |

Residual risk, said plainly: a spread whose object is built in *another* file and carries `leadingIcon` is not seen, and the build does not
type-check, so that icon would silently not draw (`ListItem` ignores unknown props into the DOM, where React warns). Open question 1.
The rewrite runs once with the rest (`CODE_NAMES_SINCE`, marker file), so no reused-name problem: `icon` and `media` were not names of
`ListItem` before. Tests in `lib/migrate-code.test.mjs` for every row, and `scripts/check-cms-update.mjs` gets a made-up app with these
forms (rewritten, built; and one unsafe form listed).

## 5. Every user in this repository

`ListItem` (the theme's, `<ListItem>` / `SiteListItem`): `theme/blocks/list/Rows.tsx`, `checklist/Checks.tsx`, `expand/Accordion.tsx`,
`testimonials/List.tsx`, `theme/components/PostList.tsx` (`leadingMedia`), `PostList` and `ActionBar.astro`, `theme/ui/Search.tsx` (a
`SearchView` result: `leadingIcon`, `leadingImage`), `ChoiceGroup.tsx`, `defaults/popup.tsx`. Editor, through `src/ui.tsx`'s wrapper (which
changes inside, not in its own API): `src/ui.tsx` (the wrapper, `PickListItem`, `ChoiceListItem`, about 6 more places), `AccountRow`
(`leadingAvatar`), `Library` (`leadingImage`, `columns`), `ThemeStore` (`leadingImage`), `Redirects` (`columns`), `InlinePriceCards`
(`leadingIcon`), `ComponentGallery` (every old name, `columns`), `standard/list/leading.ts` (builds `leadingAvatar`/`Image`/`Video` from a row)
and 30 more `src/*.tsx` that use only the wrapper's unchanged props. `demo/` and `starter/` use no `ListItem` directly (blocks only).
`Card`: no old name, so no change for its eleven users (`PostCard`, `ImageTile`, `NotFound.astro`, price cards, testimonials, link
cards, image grid, cookies, table, notice, `Panel`; the editor's widgets and inline blocks); each is checked for `columns`-free use only.
Docs: `theme/ui/List.tsx`'s header, `docs/app-contract.md` (table below), the gallery page, `docs/class-names.md` (only the dropped class).

## 6. The owner's apps and Sara's app

None of this code is in this repository (`morpheme-apps`, and Sara's site). I could not read it from here, so I do not know how it is
written. What the update does with it:

- an app that is **the site's own** (a folder of `src/apps/` with no `store.json`, as `sara` is if it lives in her site's repository): the rewrite above
  runs on it. Safe forms are rewritten; any unsafe form stops the update and names file and line, which is the right outcome for her
  blocks `booking`, `prices`, `side-card`, `contact`, `help`, `offer`, once someone has checked them. **To do before Wednesday 25 Nov:** run
  `lib/migrate-code.mjs` over her app's source (the same function as the update, dry run) and send the unsafe list to the owner.
- an app that is **a store item** (has `store.json`): never rewritten; its publisher releases a version written to 8. The owner's apps in
  `morpheme-apps` then need the same rename by hand (or by running the rewrite over the repo), and I will write that list once the PM
  confirms where they live.
- Cards: nothing to change in any app. Lists: the table in section 3.

## 7. Build (after the go)

`theme/ui/Item.ts` (types), `Card.tsx` (`thumbnail`, `trailingSupporting`, `menu`, `menuAt`, `disabled`, `truncate`, `icon` as `IconRef`, `media` as
`ItemMedia`), `List.tsx` (new names, `columns` and its class removed, `menu`, `media`), the users above, `src/ui.tsx`, the names map and
rewrite with tests, `docs/app-contract.md` (the table *The theme's UI components by name* gets a second table, *Renamed props*), `docs/class-names.md`,
a release note line for app and theme developers (`release-notes/`, skill `release-notes`), a changeset. The editor and the demo draw the same
screens: proved with `npx morpheme compare-html` on the demo's `/blocks/list/`, `/blocks/cards/`, `/blocks/checklist/`, `/blocks/testimonials/`
and `check:screens` for the editor. `THEME_API` and `APP_API` stay (batch 8c).

## Decided (PM, 24 Nov 2026)

1. **Spreads:** the update stops on a `{...props}` onto a `ListItem` only when the same file spells an old name (residual risk accepted).
2. **`media` with `video`:** one `media` prop, `{ src, alt?, video: true }`.
3. **Card's missing props are not in this batch.** `thumbnail`, `menu`, `menuAt`, `disabled`, `truncate`, `trailingSupporting`, `icon` as an
   `IconRef` and `media` as an object are *additions* on `Card`, so they need no rename and no contract change: they go to 0.23 with the
   collection. `Card` keeps its props as they are here; `ItemProps` lists them for `ListItem`'s side, and `Card` does not pretend to take them.
   Read sections 1, 2 and 7 with that: their `Card` columns marked new are 0.23.
4. **Where the apps live:** Sara's app is site-own, `larsadolfsen/sarashjemmesidedata` `src/apps/sara` (private); the owner's apps are in
   `larsadolfsen/morpheme-apps` (`apps/`, `themes/`). Dry run, from a checkout of this branch, over a folder's files:
   `node -e "import('./lib/migrate-code.mjs').then(async m=>{/* read {path,text} of every .ts/.tsx/.css under the folder */ console.log(m.migrateCode(files,{from:'0.19.5'}))})"`
   (an unsafe form throws `CodeMigrationStop` with `{path,line,why}` for each).
