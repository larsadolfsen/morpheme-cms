# Rows from a list (batch 16, part A)

Spec: `2026-11-11-intuitive-editor-design.md`, batch 16 and findings 16 and 17. Branch `0.19`. This is part A only:
a list block reads an **existing** list. No `New list`, no list page of its own (part B), no dynamic cards (after the
Card block of batch 9).

## What the owner gets

A List, Segmented list or FAQ list has a field **Rows from**: `Typed rows` (today, the default) or one of the site's
lists. With a list picked, the typed rows go away and the block shows the list's items instead. Then:

- **Tags** (only when the list has tags): show only items with any of these tags; none picked means all.
- **How many**: the first N items (empty means all). It is about the source list. `Max rows` of the Segmented list
  (PR into 0.17, `claude/0.17-segmented-max-rows`: `maxRows`, `showMore`, `maxRowsOf`, `cutAt`) is about folding the
  rows that were picked, and is reused as it is: a dynamic Segmented list can have both.
- **Show all**: text of a text button under the rows that goes to the list's own page (the blog for posts, the
  testimonials page for testimonials). Empty means no button. The FAQ list and Segmented list already have `button` and
  `buttonHref`; a dynamic block reuses `button` for the text and uses the list's page when `buttonHref` is empty. The plain List has
  no button (owner, decision 10), so it gets none: `Show all` is not offered there.
- In the editor the block's name says **Dynamic** (`Dynamic list`, `Dynamic segmented list`, `Dynamic FAQ list`) in the
  block's card and floating menu, so the owner knows the rows come from a list.

## Fields

New, on all three blocks (`src/standard/rows/fields.ts`, shared): `from` (select: `''` typed, or a source id), `tags`
(relation `categories`, multiple, shown when a source with tags is picked), `howMany` (number, 1 or more, empty = all).
`items` (typed rows) is hidden while `from` is set, but kept in the file so switching back loses nothing. No migration:
a block without `from` is a typed block as today.

## Where rows come from

A source is `{ id, label, tags, page, rows(tags, count) }` in `src/standard/rows/sources.ts`:

| Source | Item | Title | Text | Icon | Link | Tags |
| ------ | ---- | ----- | ---- | ---- | ---- | ---- |
| `posts` (Blog posts) | a post | title | description | none | the post | its tags |
| `testimonials` | a testimonial | name (or context) | first paragraph of the quote | none | its anchor on the testimonials page | its tags |
| a list that declares `asRows` | an entry | `asRows.title` field | `asRows.text` | `asRows.icon` | `asRows.href` | `asRows.tags` |

`asRows` is a new optional key on `OwnedList` (standard and app lists): the names of the entry's fields that fill a row.
A list without it is not offered. The editor builds the choice from the lists it knows (`collections`) and the two
built-in sources. On the site `StandardSite.rows(source, tags, count)` returns the same `ListRow[]`; posts and testimonials use the
readers they have, a declared list reads its folder. A row is built by one function (`rowOf`, pure, tested): title
trimmed, empty title leaves the item out, text cut to the block's own rule, `href` only if the target exists.

## How a row is drawn

Every row ends up as the `ListRow` the three views already take (`{ icon, title, text, href }`; FAQ: `label` + `html`
from title and text). So the themes' `Rows`, `Accordion` and Segmented views need **no change**, and every theme works
the same day. The views get one flag, `dynamic`, only so the editor can name the block; the theme ignores it.
In the editor `viewOf` reads the rows from `data.lists`, `data.testimonials` and `data.site.posts` (already there),
limited to a few like the Blog posts preview, so the card stays short.

## Order of the work (four PRs into `0.19`)

1. This plan.
2. Data and logic: sources, `rowOf`, tag and count rules, `asRows`, the site reader, unit tests.
3. Editor fields: `Rows from`, tags, `How many`, `Show all`, hiding typed rows, `Dynamic` in the name, i18n (en-US, da-DK).
4. Views and look: the three views read the rows; before and after screenshots at 375 px and desktop; `check:themes`.

## Tests

Unit: `rowOf` (empty title, missing link, tags, count `0`/text/empty), the tag filter (none = all, any-of), `howMany` with
`maxRows` together, a block without `from` unchanged. Then `npm run check`, `check:screens`, `check:demo`,
`check:themes` on every theme, and `check:starter`. A changeset (minor) and one release-note card in part 4.

## Decisions taken meanwhile (PM, owner away; each is one line to flip)

- The plain List has no `Show all` (decision 10).
- A dynamic block with no matching items shows nothing on the site, and a short note in the editor saying why.
