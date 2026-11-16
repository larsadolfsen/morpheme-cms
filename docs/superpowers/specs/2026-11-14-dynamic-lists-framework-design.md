# Dynamic lists: a framework for apps, the Dynamic lists app and Dynamic cards (design)

Status: spec and build plan for 0.19, decided (section 13), except the open questions Q11 to Q14 of the owner's decisions 7 and 8 of 16 Nov. No code in this pull request. Written 14 November 2026 from the owner's decisions of the
same day (section 1); decisions 7 and 8 added 16 November. Branch `0.19`. Section 13 holds the decisions on the spec's questions.

Read for this spec:

- the rows code on `0.19`: `src/standard/rows/` (`fields.ts`, `rows.mjs`, `lists.ts`, `load.ts`, `view.ts`), `defaults/standard.ts`
  (`source`), `src/ownLists.ts`, `lib/ownList.mjs`, `src/apps.ts`, `lib/appManifest.mjs`, `lib/contracts.mjs`, `docs/app-contract.md`;
- `docs/superpowers/specs/2026-11-11-rows-from-list-plan.md` and `2026-11-13-rows-from-field-mapping-design.md`;
- Cards: `src/standard/cards/`, `theme/blocks/cards/` and `2026-11-12-cards-carousel-design.md`;
- Blog posts: `src/standard/posts/`, `theme/blocks/posts/View.tsx`, `theme/components/PostList.tsx` and `BlogPosts.tsx`;
- PR #616 (`own-list-edit-page`, into `0.19`): the edit page of a list and `OwnedList.locked`;
- 0.18's two Cards and List specs, which this spec does not contradict: PR #635 (`2026-11-14-paste-and-change-to-design.md`, merged into
  `0.18`) and PR #636 (`spec/image-tools`, `2026-11-14-image-tools-design.md`);
- m3.material.io *Cards* (Overview, Specs, Guidelines, Accessibility), read with Playwright on 14 Nov 2026 (section 8.6). The Specs
  page's token tables stayed collapsed in a text read, so this spec quotes no token value; it changes no measurement.

Words: a **list** is a set of entries with fields (Testimonials, a list the owner made, an app's list). A **slot** is a part a block
draws (a row's top line, a card's image). The **mapping** says which field of the list fills which slot, per block. A **dynamic block**
is a block whose items come from a list (`from` is set) instead of being typed. A list's **creator** is whoever made it: the CMS, the Dynamic
lists app, or another app (section 3.9).

## 1. Owner decisions (14 and 16 November 2026, through the 0.19 PM)

The goal: a framework so that other people can build, for example, an FAQ block that is filled from a dynamic list and sell it in the
store, instead of an FAQ the owner fills in by hand.

1. **Core (framework).** An app can add a dynamic list (like Testimonials: its fields, its items, its list page) and use it in the app's
   own blocks. The core gives apps a documented way to define a list, read its items (with tags, how many) and map its fields to a
   block's slots. This is the contract third-party store apps build on (`docs/app-contract.md`; `APP_API` rises only if an existing app
   would stop working).
2. **A "Dynamic lists" app.** The site owner builds their own lists (today's own lists, the list page and the edit page of PR #616) and
   fills the standard blocks (List, Segmented list, FAQ list, Cards) from them (`Rows from`, the field mapping, and new: Dynamic
   cards). All of that moves out of the core into this app, built on the framework of point 1, not on private core code.
3. **The Blog posts block stays in the core** as the blog's own block for its posts.
4. **Order.** PR #616 merges into the core first, as planned; the app's work moves it.
5. **Dynamic table** (added the same day). The Dynamic lists app can also fill the Table block from a list: each of the list's fields
   becomes a column (the owner picks which fields and their order, per place, like the slot mapping), the rows are the list's items. It
   must work with the Table's Material 2 features planned for 0.19 (`2026-11-13-table-md2-design.md`: shared `DataTable`, column
   kinds, sorting, sticky header, pagination, search), with a field's kind mapped to a column kind (section 9).
6. ~~**PR B** of `docs/superpowers/plans/2026-11-14-dynamic-list-edit-page.md` (an own list's entries typed in place on its edit page).~~
   **Cancelled by the owner on 15 Nov 2026:** entries are added on the entry form page, never on the edit page. The edit page is an editor
   window for the list's structure and its list-page text (`2026-11-15-list-edit-editor-window-design.md`).

7. **Paid later** (16 Nov 2026, to the 0.19 PM): "Dynamic lists will become an app that you will need to buy later." The app stays built
   in this repository for now; later it becomes an item the owner buys in the store (section 4.2).
8. **A list belongs to whoever made it** (16 Nov 2026, same message): "Only apps or the cms can create and edit dynamic lists they create."
   Each list has one creator, and only the creator can create the list and change or delete its definition (section 3.9). Reading a list stays
   open to every app. Where the sentence leaves a question, section 13 lists it as open (Q11 to Q14).

Decision 3 replaces the earlier idea of the same day ("the Blog posts block becomes a Cards block filled from Posts"). So no Blog
posts block is migrated. That matters, because today's Blog posts block is **not** drawn as cards: it draws the theme's post list
(`PostList.tsx`: thumbnail, date and reading time, title, description, one column on a phone and two from `expanded`) or, with
`Newest large`, the blog page's `BlogPosts.tsx`. Turning it into Cards would have changed every site's look. It now stays as it is,
and the blog's posts become one more list that Dynamic cards can read (section 8.3).

## 2. What exists today (checked in the code, 14 Nov)

| Part | Where | What it does |
| :--- | :--- | :--- |
| Own lists | `lib/ownList.mjs`, `src/ownLists.ts` | A folder `src/data/<id>/` with one JSON file per entry and `_list.json` (definition version 2: `{ version, label, fields: [{ id, kind, label? }], dropped }`). Six kinds: `icon`, `title`, `text`, `image`, `href`, `tags`. `ownListOf` makes an `OwnedList` with `asRows` and `fieldKinds`. |
| An app's lists | `src/apps.ts:128,155-158`, `lib/appManifest.mjs:40-41,152-153` | `lists?: OwnedList[]` and `kinds?` on an app. The manifest checks only that `lists` is an array. No app in this repository declares one, and nothing documents the shape. |
| Testimonials | `src/standard/testimonials/list.ts` | A core list, special-cased by its id everywhere (`rows/view.ts`, `defaults/standard.ts:73-81`, `src/checkSite.ts:207`). No `asRows`. #616 marks it `locked`. |
| Reading on the site | `defaults/standard.ts:50-99` (`StandardSite.source(id)`) | `posts` (page: the blog), `testimonials` (page: `testimonialsPath`), an app list with `asRows` (glob of `src/apps/*/app.json`), else an own list (`@data/*/_list.json`). Own and app lists return no `page`. |
| Reading in the editor | `src/standard/rows/view.ts` (`sourceItems`, `editorRows`, `rowSources`, `rowParts`) | The same rows from the editor's data. |
| Rows and mapping | `src/standard/rows/rows.mjs` | `sourceOf`, `howManyOf`, `chosenFrom` (tags any-of, then the first N), `rowOf`, `itemOfEntry`, `mapOf`, `fieldsForPart`, `fieldOfPart`, `withPart`, `mapped`, `rowsFromItems`, `withRows`. One fixed list of slots, `PARTS = ['title', 'text', 'icon', 'href', 'tags']`. |
| Block fields | `src/standard/rows/fields.ts` | `from`, `tags`, `howMany`, `map`; `typed` hides `items` while a list is picked; `nameWith` gives `Dynamic list`; `fromLine`; `listPageOf`. Used by List, Segmented list and FAQ list. |
| The list's pages | `src/Library.tsx`, `src/OwnList.tsx`, #616's `src/OwnListEdit.tsx`, `src/useOwnList.tsx`, `lib/ownListEdit.mjs` | `#list/<id>` (the entries) and, with #616, `#list/<id>/edit` (the fields; `LockedListEdit` for a locked list). An app's list opens the generic `List` page. *Decided 15 Nov:* the list page's FAB is a FAB menu (`Edit list`, `Add <entry>`) and the edit page is an editor window of inline text with field blocks in the flow (`2026-11-15-list-edit-editor-window-design.md`). |
| App blocks | `docs/app-contract.md` (*Places*, *Blocks typed in place*) | `blocks/<type>/` with `index.tsx`, `View.tsx`, `viewOf.ts`, `load.ts`, optional `Inline.tsx`. A block is a `full` place: **the store gives `full` only to first-party publishers.** No app-facing function reads a list's entries. |
| Bundled apps | — | None. Every app glob is the site's `src/apps/*`; `starter/src/data/apps.json` is `{ "installed": [] }`. |

Two facts shape the design:

- **A third-party app cannot ship a block with code today**, because a block is a `full` place. So the owner's goal (someone else sells
  an FAQ filled from a list) needs a way to add a block **without code** (section 3.6).
- **Today's dynamic blocks are already on live sites:** `Rows from` and own lists are in 0.17 (Release PR #340). Whatever moves, a saved
  `from`, `tags`, `howMany`, `map`, `button`, `buttonHref` and every `_list.json` must keep drawing the same (section 6).

## 3. The framework (core)

The core keeps everything a list and a dynamic block need to **work**; the app adds what the owner uses to **make** lists and dynamic
blocks (section 4). One line between them: *data and drawing are core; the owner's tools for own lists and `Rows from` are the app's.*
A site therefore never draws differently because an app was turned off or is not paid for (section 6.4). Who may create and change a list is
a third line: the list's creator only (section 3.9).

### 3.1 Defining a list

An app declares its lists in `app.json` under the existing key `lists`, written as data in **the same definition format as an own
list's `_list.json`**, plus the keys an app needs. One format, one parser (`parseDefinition` in `lib/ownList.mjs`, which stays core),
one way of drawing a list's form:

```json
{
  "lists": [
    {
      "id": "faq",
      "label": "Questions",
      "singular": "Question",
      "icon": "Question",
      "version": 2,
      "fields": [
        { "id": "question", "kind": "title", "label": "Question" },
        { "id": "answer", "kind": "text", "label": "Answer" },
        { "id": "tags", "kind": "tags" }
      ],
      "page": "settings:faqPage",
      "examples": [{ "question": "Can I return an item?", "answer": "Yes, within 30 days." }]
    }
  ]
}
```

| Key | Required | Meaning |
| :--- | :--- | :--- |
| `id` | yes | The list's id inside the app. The site's id is `<app id>.<id>` (section 3.3), so two apps never collide. |
| `label`, `singular`, `icon` | yes | Its name, one entry's name, a Material Symbols name (CLAUDE.md *Icons*; Phosphor names are read as today). |
| `version`, `fields` | yes | As `_list.json` version 2: each field `{ id, kind, label? }`, any number of each kind. |
| ~~`locked`~~ | removed (decision 8) | Was: the owner cannot add, rename, move or remove fields. Now that is the rule for every list, because the app is the creator: only the app changes its list's fields, in a new version of `app.json`. The CMS shows them read only (`LockedListEdit`). Section 13, Q4. |
| `page` | no | Where `Show all` goes: an address (`/faq/`), or `settings:<field>` for an address the owner sets in the app's settings. None: the block's own `buttonHref`, as today. |
| `examples` | no | Made-up entries for the store's images and the parts' previews, as `OwnedList.examples`. |

Rules: the parser's rules for `_list.json`, plus `id` matches `^[a-z][a-z0-9-]{0,39}$`, an app declares only lists with its own app id (3.9), and `page` is a path or `settings:` a field of
the app's settings. A list written in the old shape (a `FolderCollection` with code, `summary` as a function) is still read from an app's
`index.ts` as before; only `app.json` gets the data shape. The core turns either into the `OwnedList` the editor already shows, with
`asRows` and `fieldKinds` made by `asRowsOf` (as `ownListOf` does now), so there is no second way of drawing a list.

### 3.2 The kinds

The six kinds stay. **One kind is added: `date`** (a date field, stored as `YYYY-MM-DD`, drawn in the site's date format,
`site/format`'s `formatDate`). Dynamic cards need it for a subhead (an event's date, a post's date; M3: "Subheads are smaller text
elements, such as an article byline or a tagged location"), and posts have one. `KINDS` in `lib/ownList.mjs` gets
`{ id: 'date', type: 'date', asRows: null }`; the own list's field bar (#616) gets a `Date` button in the app (section 4).
`DEFINITION_VERSION` stays 2: a new kind is a new value, and a site only meets a `date` field after it has the version that knows it.

### 3.3 Where the items live

Every list's entries live in `src/data/<site id>/`, one JSON file per entry, `order` first when the list is orderable, as own lists and
Testimonials do today:

- an own list: `src/data/<id>/` (unchanged);
- Testimonials: `src/data/testimonials/` (unchanged);
- an app's list: `src/data/<app id>.<id>/`. The dot cannot be in an own list's id (`slugify` makes only `a-z0-9-`), so the two never collide.

An app's list keeps its entries when the app is turned off or removed, as an app's folder and settings are kept today
(`docs/app-contract.md`, *App types*). Removing the entries of an own list is the owner's choice in the Dynamic lists app's `Delete list` (#616), never a side
effect of uninstalling. An app's list is not deleted from the CMS (3.9). A list's definition lives where its creator keeps it: an app's list in
the app's `app.json`, an own list in `_list.json` (written only by the Dynamic lists app), a core list in the core.

### 3.4 Reading the items

One reader, `@morphemecms/cms/lib/lists` (new, public, documented), used by the core's own blocks, by the app's and by third-party
code alike. It is today's `rows.mjs` and `defaults/standard.ts` `source` made general and given a name an app may import:

```ts
import { readList, listSlots } from '@morphemecms/cms/lib/lists';

// On the site (a block's load.ts), at build time:
const { items, page, missing } = await readList('app_123.faq', { tags: ['returns'], howMany: 5, map: props.map }, slots);
// items: [{ slots: { title: 'Can I return an item?', text: 'Yes, within 30 days.' }, tags: ['returns'], entry: {…} }]
// page:  where Show all goes ('/faq/'), or undefined
// missing: true when no such list exists (the block draws nothing; check:content warns)

// In the editor (a block's viewOf.ts), from BlockData, the same items:
const found = listItems(data, 'app_123.faq', { tags, howMany, map }, slots);
```

- **Order and filter** are today's: entries in their `order`, then tags any-of (none picked: all), then the first `howMany` (empty, 0,
  a negative or text: all). Posts: newest first (the blog's order).
- An item with nothing in its first required slot is left out (today's `rowOf`: no title, no row).
- A slot's value is the field's value as stored, trimmed; a `date` is the ISO date (the view formats it); an `image` is the stored
  address; `tags` is the field the filter used.
- The editor's and the site's results are the same by construction: both call one pure function over the entries (as
  `rowsFromItems` now); only the way the entries are fetched differs.
- **Sources that are not folders** are lists to the reader too: `posts` (the blog's published, not hidden posts) and `testimonials`
  keep their ids, so a saved `from: 'posts'` reads as before. Their fields are declared in the core like an app's list (section 8.3), so
  the special cases by id in `rows/view.ts`, `defaults/standard.ts` and `checkSite.ts` go away.
- **Reading is open** (decision 8): `readList` and `listItems` read any list, whoever made it (an own list, Testimonials, posts or another
  app's), for `Rows from`, Dynamic cards, a table and a third party's `listBlocks`. They never write.
- `readList` is for `load.ts` and `viewOf.ts` (full places). The sandbox (hooks, after-build) gets nothing new; its three imports stay.

### 3.5 Slots and the mapping

A block that can be filled from a list says which slots it draws, in its `defineBlock`:

```ts
defineBlock({
  // …
  slots: [
    { id: 'title', kinds: ['title', 'text'], required: true },
    { id: 'text', kinds: ['text', 'title'] },
    { id: 'icon', kinds: ['icon'] },
    { id: 'href', kinds: ['href'] },
  ],
  // the filter slot `tags` is added by the core to every block with slots
});
```

- **Default mapping.** A slot nobody mapped gets the list's first visible field of its slot's first kind, else of its next kind; a slot
  whose kinds the list has no field of stays empty. This is today's `asRows` rule (the first visible field of each kind), written per
  slot instead of per list, so a block with a slot today's `PARTS` lacks (a card's `image`, `subhead`) gets a default too.
- **The block's mapping** is the prop `map` (`{ <slot id>: <field id> }`), saved on the block, per place, exactly as today. `mapOf`,
  `withPart` and `fieldOfPart` keep their rules; they take the block's `slots` instead of the fixed `PARTS`. An empty text means "none"
  (not for a required slot). A field that is gone shows nothing in its slot and the picker says `Removed field` (as today).
- **Choices.** A slot offers the fields of its kinds (`fieldsForPart` with `fieldKinds`, as today). A list with no kinds (an old app
  list in code) keeps today's choice by field type.
- **The props.** A dynamic block has `from`, `tags`, `howMany`, `map`, and, where the block has a `Show all` button, `button` (its text)
  and `buttonHref` (its address; empty: the list's `page`). These are today's names; nothing is renamed.

`PARTS` stays as the List family's slots (title, text, icon, href), so the List, Segmented list and FAQ list declare exactly today's
four slots and their saved `map`s read the same.

### 3.6 Blocks filled from a list, without code

So that a third party can sell a dynamic block (the owner's goal) with no `full` place, `app.json` gets a data-only key,
`listBlocks`: a block that **draws one of the core's dynamic-capable blocks** (List, Segmented list, FAQ list, Cards, and Table from phase 9) with its items from
the app's list.

```json
{
  "listBlocks": [
    {
      "type": "faq",
      "label": "FAQ from Questions",
      "icon": "Quiz",
      "hint": "Questions from your Questions list.",
      "draws": "faq",
      "list": "faq",
      "map": { "title": "question", "text": "answer" },
      "settings": ["tags", "howMany", "button", "only"]
    }
  ]
}
```

| Key | Meaning |
| :--- | :--- |
| `type` | The block's type in the page (`<app id>.<type>` on the site, as an app's blocks are named today). |
| `label`, `icon`, `hint` | Its name in `Insert` (group *From your content*), its icon, its hint. |
| `draws` | One of `list`, `segmented`, `faq`, `cards`, `table` (with a default `columns` instead of `map`, section 9): the core block whose view, theme part, inline drawing and settings it uses. |
| `list` | One of the app's own lists (or `posts` / `testimonials`). Fixed: the owner does not pick another list. |
| `map` | The default mapping. The owner can still change it per place (decision 2 of 13 Nov: "The user decides what fields goes where"). |
| `settings` | Which of the drawn block's settings the owner sees (`tags`, `howMany`, `button`, and the block's own: `only` for FAQ, `design`, `phone`, `ratio` for Cards). Others keep the block's defaults. |

Saved in a page as `<div data-block="<app id>.faq" data-props="…">` with the same props as a dynamic block of its kind. On the site the
core draws it with the `draws` block's `load.ts` and the theme's `View.tsx`, so every theme draws it the same day it draws the core
block, and the block follows the theme's look and M3 without the app writing a line of drawing. A first-party app may still ship a
block with code (`blocks/`, a `full` place) and call `readList` from its `load.ts`.

### 3.7 The list's pages in the editor, for any list

The core draws the list's page (`#list/<id>`, the entries, with a FAB menu `Edit list` / `Add <entry>`) for **every** list: Testimonials, an
app's list and an own list. The edit page (`#list/<id>/edit`) depends on the creator (3.9):

- A list the CMS or another app made (Testimonials, an app's list) opens `LockedListEdit`: its fields shown read only, nothing added,
  renamed, moved or removed, no `Delete list`. The CMS cannot change a list it did not make.
- An own list's edit window (`2026-11-15-list-edit-editor-window-design.md`), its field bar, `New list` and `Delete list` are the Dynamic
  lists app's (section 4), drawn into the core's page through a slot (`listEdit`, as `versionSwitch` is today, *Slots* in
  `docs/app-contract.md`). With that app off or not paid for, an own list's edit page shows the same read-only fields and the line of 4.3.

The editor's menu section is already called `Dynamic lists` (`t.common.lists`); it lists every list the site has.

### 3.8 The contract

- `listBlocks` and the data shape of `lists` are new `app.json` keys, and `date` is a new kind. Contracts 4 and 5 fail on unknown keys,
  and the store uses `api` to offer an app only to editors that can run it. So these keys belong to **contract 6**: `APP_APIS`
  becomes `[4, 5, 6]` and `APP_API` 6. **No app written to 4 or 5 stops working**: they are read exactly as now (section 13, Q3).
- `docs/app-contract.md` gets a section *Contract 6: lists and list blocks* with sections 3.1 to 3.7, the worked example of section 7,
  and the import `@morphemecms/cms/lib/lists` added to what a `full` place may import (the sandbox's list is unchanged).
- Contract 6 checks that a list's `id` belongs to the declaring app (3.9) and no longer accepts `locked`; contract 6 is not released, so
  no site has it.
- `slots` on `defineBlock` is an optional field of a block, not an `app.json` key; like `inline`, it needs no step of its own.

### 3.9 A list belongs to whoever made it (decision 8)

Each list has **one creator**, and only the creator may create the list and change or delete its definition (its name, entry name, fields,
kinds, notes and `page`).

| List | Creator | Who changes its definition |
| :--- | :--- | :--- |
| `posts`, `testimonials` | the CMS | the CMS, in a release. The owner sees the fields read only. |
| An own list (`src/data/<id>/_list.json`, made with `New list`) | the Dynamic lists app | that app's tools (4.1): its edit window, `New list`, `Delete list`. |
| An app's list (`app.json` `lists`, id `<app id>.<id>`) | that app | that app, in a new version of its `app.json`. |

- **Derived, not stored.** The creator comes from the id: `posts` and `testimonials` are the CMS's, an id with a dot is the app named before
  the dot, any other id is an own list. No site file changes, and a later move of the Dynamic lists app to the store changes no creator (4.2).
  A new `creatorOf(id)` in `lib/lists.mjs` gives it; an own list cannot take a core list's id (`idOf`'s `taken` check) and an app cannot declare
  a list under another app's id.
- **What another party cannot do:** another app cannot create, change or delete a list; the CMS cannot change an app's list, nor an own list
  without the Dynamic lists app; the Dynamic lists app cannot change an app's or a core list. `parseDefinition` and the save plan refuse a write
  to a list by anyone else, so the rule holds in code and not only in the screens.
- **What stays open:** reading (3.4). The entries are a separate question (13, Q11).
- **When the creator is off or not paid for:** the list, its entries and the blocks that read it stay and keep drawing (6.4); nobody can change
  its definition until the creator is back. Orphans: 13, Q13.

## 4. The Dynamic lists app

### 4.1 What it is

A first-party app, **Dynamic lists** (`dynamic-lists`), that gives the owner:

- `New list` and own lists, of which it is the creator and so the only tool that makes, changes and deletes them (3.9): the definition in `src/data/<id>/_list.json`, the editor window of the 2026-11-15 spec (inline text for the list page with field blocks of any
  number of each kind, now also `Date`, rename, move, Remove field; `Shown` is gone, #704), `Delete list` (refused while a block reads it);
- `Rows from` on the standard List, Segmented list, FAQ list, **Cards** (new: Dynamic cards, section 8) and **Table** (new: Dynamic table, section 9): the list choice (own lists,
  the blog's posts, Testimonials and every app's list), `Only with these tags`, `How many`, `Show all`, the field picker on the block's
  slots (a tap on a part), `Fill from a list` in the block's toolbar, `Edit list`, the state line (`From Services · tag home · 3 items`)
  and the `Dynamic …` names;
- its texts in English and Danish (`texts.json`).

It is built only on the framework: `lib/lists` (reading), `slots` on the standard blocks (they are core), the `listEdit` slot, the
block-settings slot of section 4.3 and `parseDefinition`. It imports no other core file. A check (`scripts/check-app-imports.mjs`,
new) fails if it does, so the app proves the framework is enough for a third party.

### 4.2 Where it lives: bundled now, an item to buy later (decided, Q1, decision 7)

**Decision (Q1, Q2): a bundled app in this repository, `apps/dynamic-lists/`, shipped inside `@morphemecms/cms`, installed by default.**

**Decision 7 (16 Nov) changes the end, not the build.** The app stays built in this repository for now: the plan of section 11 does not
change, and the table below is how it ships in 0.19. Later it becomes an item the owner buys in the store. Payment, the price and the
licence check are not designed here: they are the store's paid-items design (`morpheme-appstore`, `docs/superpowers/specs/2026-11-15-paid-items-design.md`,
which is not in this repository).

What must hold from the first release, so the later step needs **no data change on a site**:

1. **Data and drawing stay in the core.** An own list's `_list.json` and entries, the saved `from`, `tags`, `howMany`, `map` and `columns`, and
   the reader stay readable by the core and keep drawing when the app is off or not paid for (6.4). Buying changes who can *change* lists, never
   what the site shows.
2. **The app is separable.** It imports only the framework (the import check of 4.1) and takes the bundled path through `off` (below), so it can
   move to the store as a package without a core change.
3. **One "not available" state.** *Off* and *not paid for* read the same in the core: the app is not active, its tools are gone, the site draws
   as before. The `off` key is that state's only record in 0.19; the store will set it from the licence later.
4. **The creator is the same before and after** (3.9): own lists stay the Dynamic lists app's lists whether it is bundled or bought.

Whether sites that made own lists in 0.17 get the app free is open (13, Q12).

| | Bundled in `morpheme-cms` | Store app in `morpheme-apps` |
| :--- | :--- | :--- |
| Upgrade of a site that uses own lists or `Rows from` | Same package version as the core: nothing to install, nothing can be missing. | The site must install it from the store before or with the upgrade; until then the owner loses the tools (the site still draws, section 6.4). |
| Framework changes | Land in one pull request with the app that uses them, checked by `check:screens`. | Two repositories, two releases, an order to keep. |
| Proves the framework | Yes, through the import check of 4.1. | Yes. |
| `full` places | Allowed (first party). | Allowed (first party). |
| The store | In 0.19: shown in the store as installed, with its page, so the owner can find and turn it off. Later (decision 7): the same page as an item to buy. | Sold or given in the store as any app. |

What "bundled" needs (new, small): the core reads apps from the package's `apps/` as well as the site's `src/apps/` (`src/appFiles.ts`,
`defaults/standard.ts`, `defaults/opens.ts`, `defaults/texts.ts`, `lib/apps.mjs` globs). A bundled app is installed unless
`src/data/apps.json` lists it under a new optional key `off` (`{ "installed": [...], "off": ["dynamic-lists"] }`). The store shows
it, in 0.19, with an `Enabled` switch and no `Uninstall`; the paid step later replaces them with the store's own states (not designed here). A site's own `src/apps/dynamic-lists/` wins over the bundled one (as `@site/` wins over
`defaults/`), so a site can pin its own copy.

### 4.3 How the app adds `Rows from` to the standard blocks

The core blocks declare `slots` (section 3.5). The core shows a block's dynamic settings only when an installed app offers a **list
picker** for blocks with slots: a new editor slot, `blockFrom`, that the app fills. With the app on, a List, Segmented list, FAQ list, Table or
Cards block gets `Rows from` and the rest; with it off, the block's settings show no `Rows from`, and a block that already reads a list
keeps drawing it (section 6.4) with a line in its settings: `This block is filled from a list. Turn on Dynamic lists to change it.` (Once the app is paid, the store gives the second sentence its wording.)

## 5. What moves where

| Today | After |
| :--- | :--- |
| `lib/ownList.mjs` (`parseDefinition`, `fieldsOf`, `asRowsOf`, `isEntryPath`, `KINDS`) | **Core**, unchanged in place (the framework's list format). |
| `lib/ownList.mjs` editing helpers, `lib/ownListEdit.mjs`, `lib/ownListSave.mjs`'s save plan | **App** (`apps/dynamic-lists/lib/`). |
| `src/ownLists.ts` (`ownListsOf`) | **Core**: the editor must know every list a block may read even with the app off. |
| `src/OwnList.tsx`, `src/OwnListEdit.tsx` (field bar), `src/useOwnList.tsx`, `src/AddFieldMenu.tsx`, `New list` | **App**, drawn through `listEdit` and the store's menu. `LockedListEdit` (now for every list the app did not make) and the entries page stay **core** (3.7). |
| `src/standard/rows/rows.mjs` | **Core**, as `lib/lists.mjs` (3.4, 3.5). `src/standard/rows/rows.mjs` re-exports it for one release. |
| `src/standard/rows/load.ts`, `defaults/standard.ts` `source` | **Core** (`readList`). `StandardSite.source` stays for one release as a call of `readList`, so a site that overrides `@site/standard` keeps building. |
| `src/standard/rows/fields.ts` (`from`, `tags`, `howMany`, `map`, `nameWith`, `fromLine`, `listPageOf`) | The props and their drawing: **core**. The fields in the settings, `Fill from a list`, the picker, the names: **app**, through `blockFrom`. |
| `src/standard/rows/view.ts` (`editorRows`, `sourceItems`, `rowSources`, `rowParts`) | `editorRows`, `sourceItems`: **core** (`listItems`). `rowSources`, `rowParts`: **app**. |
| Testimonials, special-cased by id | **Core**, declared as a list (3.1 shape, `page: testimonialsPath`); the CMS is its creator (3.9). |
| Who may create and change a list | **Core**: `creatorOf` in `lib/lists.mjs` and the refusal in the save plan (3.9). The tools that create and change own lists are the app's, as above. Nothing but the creator writes a definition. |
| The i18n keys `blocks.rows.*`, `ownList.*` | The app's `texts.json` for its words; the core keeps the few it draws (`blocks.rows.empty`, the line of 4.3). |

## 6. Migrating sites with no visible change

No site file is rewritten. Every step is `minor` or `patch`; none is `major` (the owner's rule, skill `changesets`).

### 6.1 What stays exactly as it is

- `src/data/<id>/_list.json` and its entries: same folder, same format, read by the same parser.
- A dynamic block's props: `from`, `tags`, `howMany`, `map`, `button`, `buttonHref`, `items` (the hidden typed rows). Same names, same
  meaning. `from: 'posts'` and `from: 'testimonials'` read the same lists.
- The List family's slots: exactly today's four (title, text, icon, href) plus the tags filter, so every saved `map` gives the same rows.
- Testimonials' folder, page and anchors; the blog's order and its `Show all` page.
- The Blog posts block: untouched (decision 3).
- The HTML of every page: the views and theme parts do not change in the move (Dynamic cards adds a path, it changes none).

### 6.2 The tools on an upgraded site

While the app is free (4.2), a site that upgrades gets the bundled app installed, so the owner sees the same `New list`, list pages, `Rows from`, picker,
`Edit list` and names in the same places. The only new things are Dynamic cards and the `Date` field kind, both additions.

### 6.3 The proof

- `scripts/check-content.mjs` fixture **0.17 site**: two own lists (version 1 and version 2 definitions), a Dynamic list with a `map`, a
  Dynamic segmented list with `howMany` and `Show all`, a Dynamic FAQ list from Testimonials, a List from posts. The build of each
  migration PR must give byte-identical HTML for those pages to the build on `0.19` before the PR (a new `check:same-html` step in
  `check:demo`, comparing `dist/` page by page).
- `check:screens` runs the editor with the app on (today's screens, unchanged) and with it off (4.3's line, no `Rows from`).
- `check:starter` builds the starter with the bundled app installed by default.

### 6.4 With the app turned off

The site still draws every dynamic block (reading and drawing are core). The editor still shows the blocks as the site draws them and
the lists' entries; only the owner's tools are gone (4.3). The lists, their entries and the blocks' props are kept. Nothing breaks, so
turning the app off is safe and turning it on again brings everything back. The same holds when the app is later not paid for (4.2, point 3): only the owner's tools are gone, and
no list can be created or changed until the app is back (3.9).

## 7. Worked example: a third-party FAQ app

*Help Center FAQ*, by a third party, sold in the store, written to contract 6, `role: "plugin"`, **no code**:

```
src/apps/app_7f3c…/
  app.json
  texts.json          (the Danish texts)
  check-page.md       (one block of each listBlocks type, for check:screens)
  screenshots/
```

`app.json` (the keys of contract 6 in bold in the contract doc):

```json
{
  "api": 6,
  "label": "Help Center FAQ",
  "publisher": "Example Studio",
  "license": "MIT",
  "icon": "Quiz",
  "hint": "Write your questions once, show them on any page.",
  "version": "1.0.0",
  "role": "plugin",
  "settings": {
    "fields": [{ "name": "faqPage", "label": "FAQ page", "type": "relation", "to": "pages" }],
    "values": { "faqPage": "" }
  },
  "lists": [
    {
      "id": "faq",
      "label": "Questions",
      "singular": "Question",
      "icon": "Quiz",
      "version": 2,
      "fields": [
        { "id": "question", "kind": "title", "label": "Question" },
        { "id": "answer", "kind": "text", "label": "Answer" },
        { "id": "topic", "kind": "tags", "label": "Topic" }
      ],
      "locked": true,
      "page": "settings:faqPage",
      "examples": [
        { "question": "Can I return an item?", "answer": "Yes, within 30 days of delivery.", "topic": ["returns"] },
        { "question": "How long is delivery?", "answer": "Two to four working days.", "topic": ["delivery"] }
      ]
    }
  ],
  "listBlocks": [
    {
      "type": "faq",
      "label": "FAQ from Questions",
      "icon": "Quiz",
      "hint": "Questions from your Questions list, filtered by topic.",
      "draws": "faq",
      "list": "faq",
      "map": { "title": "question", "text": "answer", "tags": "topic" },
      "settings": ["tags", "howMany", "button", "only"]
    }
  ],
  "screenshots": [
    { "shows": "list:faq", "label": "Your questions" },
    { "shows": "block:faq", "label": "On a page" }
  ]
}
```

What the owner gets after installing it:

1. Under **Dynamic lists**: *Questions*, with `New question`, each entry's form (Question, Answer, Topic) and `Edit list` showing the
   three fields read only: the app made the list, so only the app changes them. (Whether the owner may add and edit the entries here: 13, Q11.)
2. In **Insert**, under *From your content*: *FAQ from Questions*. On the page it is drawn as the theme's FAQ list, typed nowhere: its
   questions come from the list. Its settings: `Only with these tags` (named *Topic*), `How many`, `Show all` (to the FAQ page set in
   the app's settings), `Only one open`. A tap on a question's line offers the list's title fields (here only *Question*).
3. On the site: the FAQ list as every theme draws it, with `Show all` to the FAQ page.

The app has no `full` place, so the store can sell it from any publisher, and the build runs nothing of it. The same app with
`"draws": "cards"` would sell *Help cards*; with `"draws": "segmented"`, a Segmented list. An app that wants a drawing of its own is
first-party, ships `blocks/<type>/` and calls `readList` in its `load.ts`.

## 8. Dynamic cards

### 8.1 The setting

Cards get the same `Rows from` as the List family (through the app, 4.3): the list, `Only with these tags`, `How many`, `Show all`,
and the per-place mapping on the card's slots. The name in the editor is **Dynamic cards** (`nameWith`, `t.blocks.rows.named`). The
Danish `named` gives `Dynamisk kort`; Cards is plural, so the Danish texts get a plural form, **`Dynamiske kort`** (a `namedPlural` or a
per-block name, decided in the build PR).

### 8.2 The slots and their default mapping

| Slot | Kinds, in order | Default (own list or app list) | From posts | From Testimonials | Drawn as (today's Cards part) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `image` | `image` | first image field | the post's image (its alt) | the person's image | media, when the block's Media is `Image` |
| `icon` | `icon` | first icon field | none | none | media, when Media is `Icon` |
| `title` (required) | `title`, `text` | first title field | the post's title | the name | headline |
| `subhead` | `date`, `title` | first date field, else none | the post's date (site format) | the context (role, company) | subhead |
| `text` | `text`, `title` | first text field | the description | the quote's first paragraph | supporting text |
| `href` | `href` | first link field | the post | its anchor on the Testimonials page | the whole card is the link (`more` at the bottom) |
| `tags` | `tags` | first tags field | the post's tags | the testimonial's tags | the filter only, not drawn |

- **Media.** A dynamic Cards block offers Media `None`, `Icon` and `Image`. `Video` is not offered while a list is picked: no kind holds
  a video link. A Cards block whose Media is `Video` keeps it while typed; picking a list sets Media to `Image` when the list has an
  image field, else `Icon` when it has an icon field, else `None`, and `Undo` brings back `Video` and the typed cards.
- **Image aspect ratio** (PR #636, section 6): the block's one `ratio` (default 3:2) applies to every card's image. A list's image has
  no card crop, so it is drawn as its middle part in the block's ratio (`object-fit: cover`, #636's rule for a card without a crop).
  The crop view is not offered on a dynamic card: the image is the list's, edited in the list.
- **Alt text.** A list image's text is the image's own text in Files (`libraryAlt`, as cards already fall back to it); a post's is its
  `imageAlt`.
- **Buttons.** A dynamic card has no buttons: it is one link (`href`) or a plain card. M3: "A card can be a non-actionable container
  that holds actions like buttons and links, or it can be directly actionable without any buttons or links." The typed cards' buttons
  stay in the file, hidden.
- **Icon color.** The block's icon color for every card is a block setting in a dynamic block (`iconColor` moves from the card to the
  block while a list is picked; a typed card keeps its own).

### 8.3 Posts and Testimonials as lists

Declared in the core with the 3.1 shape. The CMS is their creator (3.9), so their fields are read only to the owner and to every app, which may still read them (Dynamic cards from posts is reading). Posts have no entries in a list page: they are written as posts.

- `posts`: `title` (title), `description` (text), `image` (image), `date` (date), `href` (href, the post's address), `categories`
  (tags). Order: newest first. Page: the blog (`standard.posts.all({}).href`). Hidden and draft posts are never read (as today).
- `testimonials`: `name` (title), `context` (title), `quote` (text, first paragraph), `image` (image), `href` (href, its anchor),
  `categories` (tags). Page: `testimonialsPath`.

So Dynamic cards from posts draw post cards (image, title, date, description, the card links to the post): the owner can build what the
earlier idea wanted, as a new block, while every existing Blog posts block stays the post list it is.

### 8.4 What happens to typed cards when a list is picked

As the List family today (`typed`): the typed `items` are **kept in the file and hidden**; the block shows the list's cards. The
settings say `Your typed rows are kept, not shown.` (for Cards: `Your typed cards are kept, not shown.`). `Rows from` back to `Typed
cards` shows them again, unchanged. `Fill from a list` in the block's toolbar does the same with an `Undo` in the snackbar (today's
List behaviour, the 0.17 note *Fill from a list*). The block's own settings (`design`, `color`, `phone`, `ratio`, Media) stay.

### 8.5 `Show all` to the list's page

- The block's `Show all` (`button` text, empty: no button) goes to `buttonHref`, else the list's `page` (posts: the blog; Testimonials:
  their page; an app's list: its `page`; an own list: none, so the owner sets the address). No page and no address: no button, and the
  settings hint says why.
- It is drawn under the cards as the theme's **text button**, as on the Segmented list and FAQ list today (one rule for all dynamic
  blocks).
- **With `On phones: Carousel`** (2026-11-12 carousel spec): the carousel already has a `Show all` text button under it that shows every
  card stacked (M3's carousel accessibility rule). A dynamic carousel with a list page draws **one** button: `Show all` goes to the
  list's page, which is M3's own first choice ("a *Show all* button under it … that opens a dedicated vertically scrolling page of all
  items", quoted in the carousel spec). Without a page, it keeps today's in-place `Show all`. Never two buttons (section 13, Q6).

### 8.6 What Material 3 says (read 14 Nov 2026)

From m3.material.io/components/cards (Overview, Guidelines, Accessibility), quoted:

- "Cards display content and actions about a single subject." "Contents can include anything from images to headlines, supporting
  text, buttons, and lists."
- Anatomy: "Container, Image, Button, Supporting text, Subhead, Headline". "The card container is the only required element of a card.
  All other elements are optional." So a dynamic card with an empty slot (no image in an entry) is a valid card.
- "Headline text often communicates the subject of the card, such as the name of a photo album or article." "Subheads are smaller text
  elements, such as an article byline or a tagged location." "Supporting text includes body content, such as an article summary or a
  restaurant description." This is the default mapping of 8.2 (title → headline, date → subhead, description → supporting text).
- "Cards can include thumbnails for an avatar or logo." "Cards can include photos, illustrations, and other graphics, such as weather
  icons." "Cards can include video."
- "Cards can be displayed together in a grid, vertical list, or carousel." "Multiple cards can be grouped together into collections
  displayed in a grid, list, or carousel. By default, cards in a collection are coplanar."
- "Card collections can be filtered in a variety of ways, including by date or alphabetical order. If a collection can be filtered,
  the filter must apply to each card in the collection. Filter or sorting options should be placed outside of the card collection."
  The tag filter of a dynamic block is applied when the site is built, to every card, and is not drawn on the cards: it meets this.
  A visitor-facing filter is not in this spec.
- "Cards can be one large touch target triggering an expanded detail screen." With 8.2's rule a dynamic card with a link is one
  target, never with buttons inside: "This is to avoid stacking actionable elements. An action shouldn't be placed on an actionable
  surface."
- "If an image in a card is purely decorative, hide it from screen readers." A list image whose text in Files is empty (decorative)
  gets `alt=""`, as cards do today.

The site-side look is today's Cards (`LinkCards.tsx`, `ui/Card`): Dynamic cards add no part, mark or size. No deviation is needed, so
`docs/material-deviations.md` is not changed.

### 8.7 Empty states

| Case | Site | Editor |
| :--- | :--- | :--- |
| No entry matches (empty list, tags match nothing) | Nothing: the block is left out (`load` returns `null`, as the List family). | The block's three faded empty cards (as a new Cards block) with the line `No items in the list match, so nothing shows on the page.` and `Edit list`. |
| The list is gone (own list deleted, app removed) | Nothing; `check:content` warns `A block on <page> reads the list <id>, which the site no longer has.` | The line `The list is gone. Pick another or go back to typed cards.`; the hidden typed cards are still there. |
| An entry has no value for its title | That card is left out (3.4). | The same. |
| An entry has no image while Media is Image | The card without the media area (M3: all other elements are optional). | The same. |
| `How many` larger than the entries | All of them. | The same. |

## 9. Dynamic table

### 9.1 What the owner gets

The Table block gets `Rows from` like the others (through the app, 4.3), with `Only with these tags` and `How many`. The name in the
editor is **Dynamic table** (`Dynamisk tabel`). The rows are the list's items, in the list's order, filtered and cut as every dynamic
block's (3.4). The columns are fields of the list that the owner picks and orders, per place: the Table's slots are not a fixed set
but an ordered list of columns.

### 9.2 The data: `columns` with a `field`

The Table already stores one `columns` entry per column, `{ kind, align }` (`2026-11-13-table-md2-design.md`, decision 1; #635 keeps
`columns` through Change to). A dynamic Table adds one optional key to each entry, **`field`**: the id of the list's field shown in that
column. Nothing else is added:

```json
{
  "from": "events",
  "tags": ["2027"],
  "howMany": 20,
  "header": true,
  "sortable": true,
  "columns": [
    { "field": "title" },
    { "field": "date" },
    { "field": "place", "kind": "tag" },
    { "field": "price", "kind": "number" }
  ]
}
```

- **The header row** is each field's name in the list (the owner's label, else the kind's name, `nameOf`), drawn in the Table's header
  row; `header` stays the Table's switch (on by default). A column entry may carry `label` to name the column otherwise in this place.
- **The typed `rows`** are kept in the file and hidden while a list is picked, as `items` are on the other blocks (`typed`); `Typed
  rows` brings them back unchanged, with their own `columns` (the dynamic `columns` and the typed ones are stored apart, as
  `columns` and `typedColumns`, so neither overwrites the other; `rectangle()` keeps `typedColumns` as wide as `rows`).
- **Default when a list is picked:** one column for each visible field of the list, in the list's field order, except `tags` fields
  (the filter's) and `image` fields after the first. The owner adds, removes and reorders from there.
- **A field removed from the list** leaves its column with empty cells and the header picker says `Removed field` (3.5's rule).
- **A field added to the list later** is not added to existing tables: the columns belong to the place (the owner's rule of 13 Nov).

In `lib/lists` this is a slot list of variable length: `slots: 'columns'` on the Table's `defineBlock` tells the framework that the
block's mapping is the ordered `columns[].field` instead of `map`, and `listColumns(items, columns)` gives the cells. A `listBlocks`
entry may say `"draws": "table"` with a default `columns` (3.6), so a third party can sell a dynamic table too.

### 9.3 A field's kind to a column kind

| Field kind | Column kind (default) | Cell | Other kinds the owner may pick |
| :--- | :--- | :--- | :--- |
| `title` | `text` | the text | `number`, `tag`, `yesno` |
| `text` | `text` | the text as one line (`oneLine`, as #635 does for a typed cell) | `number` |
| `date` | `date` | the ISO date, drawn in the site's language | `text` |
| `href` | `link` | `[<page title or address>](<address>)`: a page's title, as the List does for a row with a page and no heading (`standard.pageTitle`) | `text` (the address) |
| `icon` | `icon` | the icon name | — |
| `image` | `image` | the stored address, as the `image` kind stores one | — |
| `tags` | `tag` | one chip per tag, by the tag's name | `text` (names joined by commas) |

- The column's `kind` is optional: absent, it is the default of its field's kind; a stored `kind` the field cannot take is read as the
  default. `align` works as on a typed table (automatic by kind, the stored `align` wins).
- `number` and `yesno` have no field kind of their own: a title or text field holding `1,299` or `yes` is shown as one by picking the
  column kind. This keeps the list's six kinds (plus `date`) and the Table's eight column kinds apart, as both specs decided.
- A cell's value comes straight from the entry; the column kind only changes how it is drawn, sorted and searched (as on a typed table).

### 9.4 The Table's Material 2 features

The dynamic rows are built when the site is built, so the Table's features run on them exactly as on typed rows. Nothing in
`DataTable` knows where the rows came from:

- **Sorting** (`sortable`): the visitor's sort works on the drawn rows by column kind (numbers numerically, dates by date). Without
  JavaScript the rows are in the list's order.
- **Sticky header**: a block setting, unchanged. **Density** is built into the theme, not a setting of the block, so a dynamic table has the same density as every other table.
- **Pagination** (`paginate`): it pages the rows after `How many` (which cuts the list) and the tag filter. `How many` empty and
  pagination on is the way to show a long list.
- **Search** (`search`): searches the drawn cell text; an icon cell by its label, an image cell by its alt text, a tag cell by the tag
  names.
- **Striped**, the rows/columns menu: unchanged; in a dynamic table the menu's row actions (add, move, remove a row) are not shown,
  and its column actions work on `columns` (Add column, which offers the list's fields; Move left and right; Remove column).

The Table's work order in its spec (PR 0 `DataTable`, PR 1 `text`/`number`, 5 `link`/`date`/`tag`/`yesno`, 6 `icon`/`image`) comes
first; a dynamic table offers a column kind only once that Table PR has landed, and draws an unbuilt kind as `text` meanwhile.

### 9.5 In the editor

- The table is drawn as the site draws it (the editor's Table view), with the list's rows; cells are not typed.
- A tap on a column's header opens the field picker of that column (the same picker as a card's or a row's part: the list's fields,
  `None` removes the column, `Removed field` when gone) and the column kind, with the kinds of 9.3's last column.
- `Edit list` opens the list, as on the other dynamic blocks; the state line says `From Events · tag 2027 · 14 items`.
- Paste (#635) into a dynamic table does nothing: it has no typed cells.

### 9.6 Empty states and Material

- No item matches: nothing on the site; in the editor the header row with one faded empty row and the line of 8.7. The list is gone: as
  8.7.
- Material: Material 3 has no data table; the Table follows MD2 for what a table does and M3 tokens for its look, as its spec says. The
  dynamic table adds no part, size or behaviour to that, so no deviation is needed.

## 10. Change to (PR #635) and dynamic blocks

PR #635 (0.18) offers a block that reads a list only List, Segmented list and FAQ list, because "Steps, Cards and Table are not offered:
they have no rows of their own to show". That is true in 0.18. In 0.19, once Dynamic cards exist (phase 5), **Cards joins that set**:
a dynamic List family block can change to Cards and back. `from`, `tags`, `howMany` move over as they are; `map` keeps the slots both
blocks have (title, text, icon, href, tags) and the target ignores the others while keeping them in `map` (the #635 rule: what B cannot
show stays in the saved block). The change is a one-line rule change in `targets` (`lib/changeTo.mjs`, #645) and a test, in phase 5.

Once the Dynamic table exists (phase 9), **Table joins too**. A dynamic block → Table: `columns` is one column per slot that has a
field, in the slot order (title, then text, icon, href; a card's image and subhead after them), and the block keeps its `map` unseen.
Table → a dynamic block: `map` is the kept one when there is one, else each slot takes the first column whose field is of the slot's
kinds; the Table keeps `columns` unseen, so a Table → List → Table where nothing was edited gives the same `columns` (#635's round-trip
rule). Steps stays out. Paste (#635) into a dynamic block does nothing new: a dynamic block has no typed items to paste into.

## 11. The build plan

Pull requests into `0.19`, in this order. Each has a changeset (`minor` or `patch`, never `major`), `npm run check`, and the checks of the
skill `checks`; a change the owner sees follows the screenshot rule of the `pm` skill.

| # | Pull request | Visible | Changeset |
| :--- | :--- | :--- | :--- |
| 0 | This spec. | no | empty |
| — | PR #616 merges as planned (decision 4). | yes | minor (its own) |
| 1 | **Reader and slots.** `lib/lists.mjs` (`readList`, `listItems`, `listSlots`, generalised `mapOf`/`withPart`/`fieldOfPart`), `slots` on `defineBlock`, the List family declares today's four. `rows.mjs` re-exports. Posts and Testimonials declared as lists; the id special cases go. Unit tests port `rows.test.mjs`. The same-HTML fixture of 6.3. | no | patch |
| 2 | **Contract 6, data lists.** `lists` in the 3.1 shape, `src/data/<app id>.<id>/`, `page`, `locked` default, `date` kind, `APP_APIS [4,5,6]`, `lib/appManifest.mjs` checks, `docs/app-contract.md` section. | no (for owners) | minor |
| 3 | **List blocks without code.** `listBlocks`, `Insert` entries, drawing through `draws`, `check-page.md` support, the demo app `demo/src/apps/faq-example/` (section 7's app) checked by `check:screens` at 375 and 1280 px. | yes (demo) | minor |
| 4 | **Bundled apps and the move.** Package `apps/`, `apps.json` `off`, store page with `Enabled`; the Dynamic lists app with everything of section 5 marked *App*; `listEdit` and `blockFrom` slots; `check-app-imports`; 4.3's line when off. Same-HTML check and today's screens unchanged. | no (same tools) | minor |
| 5 | **Dynamic cards.** Cards declare slots (8.2), media and ratio rules, `Show all` and the carousel rule, empty states, Danish plural name, Change to (10). Screens: a Dynamic cards block from an own list with images, from posts, as a carousel, and empty. | yes | minor |
| 6 | **Date kind in the field bar** (`Date` in the app's bar, the date field in an entry's form). | yes | minor |
| 7 | **Release notes** for 3–6 (skill `release-notes`), English and Danish. | yes | empty |
| 8 | ~~**PR B of the edit-page plan, in the core**~~ **Cancelled (15 Nov 2026):** entries are never typed on the edit page. Its place is taken by the build plan of `2026-11-15-list-edit-editor-window-design.md` (FAB menu, the editor window with inline list text). The number stays so phases 9 and 10 keep theirs. | — | — |
| 9 | **Dynamic table** (section 9): `columns[].field`, `typedColumns`, `slots: 'columns'`, `listColumns`, the kind mapping, the header picker, the column menu's actions, Change to with Table (10), `"draws": "table"`. Screens: a dynamic table with each column kind built so far, sorting, pagination and search on, 375 and 1280 px. | yes | minor |
| 10 | **Release notes** for 9 (the list-page and editor-window notes are in the 2026-11-15 spec's plan). | yes | empty |

**What decisions 7 and 8 change in the plan (16 Nov).** No phase is added, dropped or reordered, and the app stays in this repository (phase 4).
Content changes:

- **Phase 1** adds `creatorOf(id)` to `lib/lists.mjs` (3.9) and its tests.
- **Phase 2** drops the `locked` key (3.1) and checks that a list's id belongs to its app (3.8, 3.9).
- **Phase 3** keeps `listBlocks.list` as it is (reading is open). Nothing changes.
- **Phase 4** builds `off` as the one "not available" state of 4.2 (point 3), draws the edit window, `New list` and `Delete list` only for lists the
  app made, makes the save plan refuse a write by any other party, and shows `LockedListEdit` with 4.3's line when the app is off. Same-HTML check
  with the app off is part of 6.3 (already there).
- **Phases 5 to 10** do not change (reading and drawing).

**Merged or in-flight work that contradicts the decisions** (no code changed here):

- **Phase 2 (merged): `locked` in `app.json`**, `lib/appManifest.mjs` (`firstParty` option, `locked: false`), `src/ownLists.ts` (`locked !== false`)
  and their tests allow a first-party app's list to be unlocked, and the core then draws the full edit page for it. Decision 8 says the CMS cannot
  edit an app's list. Fix: remove the key and the option, and make `LockedListEdit` the page for every list that is not an own list.
- **Phase 3 (#721, merged):** consistent. `listBlocks` only reads; `siteListId` names `posts` and `testimonials` as lists "no app owns", which should
  read "the CMS's" when `creatorOf` lands.
- **#616 and phase 1 leftovers:** `src/OwnListEdit.tsx`, `lib/ownListEdit.mjs` `editPageOf` give the whole page to `own` lists and the read-only page to
  `locked` ones. That is the creator rule for the CMS's own lists; it must move to `creatorOf` (an own list's page only with the Dynamic lists app
  on). No contradiction otherwise.
- **The 2026-11-15 spec's PRs 1 to 5:** PR 1 (FAB menu, merged as #712) is consistent: the menu only opens the edit page and the entry form. PRs 4 and
  5 (`notes`, `singular`, the editor window) write only own lists, which the Dynamic lists app creates, so they agree; PR 5's host must be drawn
  through `listEdit` only for the app's lists. `Add <entry>` on an app's list depends on Q11. The window spec's section 3.3 (locked lists) is
  unchanged.

Phases 1 and 2 can be built side by side; 3 needs 1 and 2; 4 needs 1 and #616; 5 needs 1 and 4 (it adds Cards to the app's picker); 6
needs 4. Phase 8 is cancelled. Phase 9 needs 4, 6 and the Table's `DataTable` and column kinds (its own
PRs 0, 1, 5 and 6); its sorting, pagination and search work on the dynamic rows the day those Table PRs land.

**PR B is cancelled (owner, 15 Nov 2026).** The entries are added on the entry form page, never typed in place on the edit page, so there is nothing to build in the core or the app. What the list page and the edit page become is in `2026-11-15-list-edit-editor-window-design.md`; the field bar and field rows that move to the app (section 5) are that spec's editor window.

## 12. Tests

- **Unit:** `readList`/`listItems` give the same items for the same entries; tags any-of, `howMany`, order, a missing list
  (`missing: true`); per-slot defaults with kinds in order (8.2's table for an own list, posts and Testimonials); `map` with a removed
  field; a 4-slot `map` saved by 0.17 gives the same rows; `listBlocks` validation (unknown `draws`, a `list` the app lacks, a `map` to a
  field the list lacks, a `settings` entry the block lacks); contract 4 and 5 manifests still pass and fail as before.
- **Dynamic table, unit:** default columns of a list (tags out, one image), the kind mapping of 9.3 with a stored kind the field cannot
  take, a removed field's empty cells, `typedColumns` kept through rows and columns added to the typed table, Change to a Table and
  back (deep-equal round trip).
- **Creator (3.9):** `creatorOf` for `posts`, `testimonials`, `app_123.faq` and an own list; the save plan and `parseDefinition` refuse a write to a
  list by a party that did not make it; contract 6 refuses a list id under another app and the `locked` key; the edit page of an app's list is
  read only whatever the app declares; an own list is read-only with the app off, and the site draws the same HTML.
- **Same HTML:** 6.3's fixture, before and after phases 1, 4, 5 and 9 (a typed Table is in the fixture).
- **Screens:** today's dynamic-block screens with the app on; the app off; the FAQ example app; Dynamic cards (8.7's states, the
  carousel with a list page, 375 and 1280 px, every section colour as `inlineBlocks` already runs).
- `check:themes` with each theme, `check:starter` (the bundled app installed by default), `check:language` (no Danish outside the
  language files; `image` everywhere).

## 13. Decisions

Q7 was decided by the owner on 14 Nov. The owner was away and asked the 0.19 PM to decide the rest; the PM decided them as recommended,
on the owner's behalf, on 14 Nov. The owner may revise any of them. Decisions 7 and 8 of 16 Nov change Q1, Q2 and Q4 (marked) and leave four
questions open (Q11 to Q14, below the table).

| # | Question | Decision | By |
| :--- | :--- | :--- | :--- |
| Q1 | Where does the Dynamic lists app live? | Bundled in this repository and shipped in `@morphemecms/cms` (4.2). **Since 16 Nov (decision 7):** for now; later an item bought in the store. | PM 0.19, for the owner |
| Q2 | Is it installed by default? | Yes, on new and upgraded sites, with an `Enabled` switch in the store to turn it off (6.4). **Since 16 Nov:** while it is free; paying is open (Q12). | PM 0.19, for the owner |
| Q3 | Which contract do the new `app.json` keys belong to? | Contract 6: `APP_APIS [4, 5, 6]`; no app written to 4 or 5 stops working (3.8). | PM 0.19, for the owner |
| Q4 | Can the owner add fields to an app's list? | No. ~~`locked: false` for first-party apps~~ is gone (decision 8): only the app that made a list changes its fields (3.1, 3.9). | PM 0.19, for the owner |
| Q5 | What moves to the app? | Only the owner's tools. Reading and drawing a dynamic block stay in the core, so turning the app off never changes a site (6.4). | PM 0.19, for the owner |
| Q6 | Dynamic cards as a carousel with a list page | One `Show all` button, to the list's page; never two buttons (8.5). | PM 0.19, for the owner |
| Q7 | Third-party blocks | Without code only in 0.19: a third party sells list blocks through `listBlocks`, drawn by the core's dynamic blocks; blocks with code stay first-party (3.6). | Owner |
| Q8 | The `Date` kind | Added, in phase 6 (3.2). | PM 0.19, for the owner |
| Q9 | A dynamic table's default columns | Every visible field in the list's order, without tags and with one image (9.2). | PM 0.19, for the owner |
| Q10 | PR B of the edit-page plan | **Cancelled by the owner on 15 Nov:** entries are not typed on the edit page (section 11). | Owner |

**Open (decisions 7 and 8 of 16 Nov; for the owner, through the PM).** Each has a recommendation; none is built until the owner answers.

| # | Question | Recommendation |
| :--- | :--- | :--- |
| Q11 | "Only apps or the cms can create and edit dynamic lists they create": may the site owner still add, edit and delete the **entries** of an app's list (and of Testimonials) in the CMS's entry form (`#new/<id>`)? Or does "edit" cover entries too, so only the creator app can? | Yes, the owner edits entries. The entries are the owner's content, the entry form is core for every list, and the decision is about who makes and changes the *list* (its definition). An app that wants no owner edits could later say so with an `app.json` key. |
| Q12 | The Dynamic lists app "will become an app that you will need to buy later": do sites that already made own lists or `Rows from` blocks in 0.17 keep the app free (grandfathered), or must they buy it to change those lists? | Grandfather them: 0.17 gave these tools with the core, and the data is theirs. Sites that start after the paid step buy it. The store decides how it records this, so the core only needs the `off` state of 4.2. |
| Q13 | A list whose creator is gone (the app is removed, or the Dynamic lists app is not paid for): who may delete its definition and entries? Under decision 8 the CMS may not. | Nobody changes the definition until the creator is back; the list keeps drawing. For an app removed for good, the store's *Uninstall* offers `Also remove its data` and deletes the app's lists as part of the app. The owner may always delete the entries of any list in the entry form (Q11). |
| Q14 | May another app add or change **entries** in a list it did not create (for example an events app filling an owner's list)? | No in 0.19: no app function writes entries (the sandbox gets nothing new, 3.4). If wanted later, it is a new, explicit permission the owner gives per app. |

## 14. Not in this spec

- A visitor-facing filter or sort on dynamic blocks (M3 says it goes outside the collection; a later spec).
- A site page of its own for an own list (own lists have none today; `Show all` uses the block's address).
- Changes to the Blog posts block (decision 3).
- Paid or licensed lists, and the payment, price and licence check of the Dynamic lists app: the store's paid-items design in `morpheme-appstore`
  (`docs/superpowers/specs/2026-11-15-paid-items-design.md`). This spec only says what must hold so that step needs no data change (4.2).
