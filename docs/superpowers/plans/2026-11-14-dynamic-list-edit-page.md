# Plan: the edit page of a dynamic list (0.18)

Status: owner's decisions of 14 November, for the 0.18 branch. The PM hands the work to new sessions.

## Owner's decisions

- **Dynamic lists page** (the page that lists the lists): the round `+` stays and makes a new list. No change.
- **A single list's page** (an owner-made list, Testimonials, any list): the round `+` becomes an **Edit button** (pencil, label `Edit list`) that
  opens `#list/<id>/edit`. Adding an entry no longer lives on that button.
- **The edit page** has a bar like the editor's (the shared bar and its `planBar` overflow in `src/textBar.mjs`) with a button per field that can be
  inserted: Icon, Title, Body text, Image, Link, Tags, any number of each kind (#516). Pressing one adds the field.
- **Fields** can be renamed, removed (the data stays until the owner confirms) and **moved up and down** (the order is the order of an item's form and of
  the list's field mapping; moving never loses data).
- **Entries** are added, edited and rearranged on the same page, typed in place (the editor's List, `src/InlineList.tsx`; no new design).
  The Add item screen and an item's screen keep working.
- **Locked lists:** an app-supplied list can be marked locked (its fields are fixed, as Testimonials is in `src/standard/testimonials/list.ts`). It
  gets the Edit button and the edit page **without the field bar**. Unlocked lists, owner-made or app-supplied, get the full page.

## Findings

1. **The typed-in-place list page was never built.** `2026-11-12-new-list.md` batch 4 (`OwnListPage`, the reducer, row to file, autosave, the toolbar
   host) was replaced by #564 (own lists use the testimonials' list page and item page). `InlineList.tsx` is used only by the List block in the page
   editor, and there is no `src/inlineBar.ts`. The edit page therefore needs that batch 4 plumbing; `lib/ownList.mjs` already has `entryOfRow`,
   `rowOfEntry`, `moveOrders` and `entrySlug`.
2. **Built-in lists cannot take extra fields.** Testimonials' fields are fixed in code; only an owner-made list has a `_list.json` definition. Hence
   the locked-list idea above.
3. #613 (closed, branch `own-list-add-field-on-item` kept) shows the shape of the old `Edit list` sheet and its buttons on the item page.

## Two pull requests

- **PR A:** the Edit button, the edit page `#list/<id>/edit`, the field bar, field rows (rename, Shown, remove, move up and down), the ⋮ menu and its
  sheet removed, `Add item` on the edit page. #616 (branch `own-list-edit-page`) is the reusable start of PR A: `OwnListEdit.tsx`,
  `useOwnList.tsx`, `moveField` in `lib/ownListEdit.mjs` with tests, and `checkOwnList` at 375 and 1280 px. It was not merged into `main` for 0.17;
  it needs the locked-list mark and a merge of the 0.18 branch.
- **PR B:** entries typed in place on the edit page (the plan's batch 4), after PR A.

Each pull request has a unit test and a `check:screens` check at 375 px, a changeset and a release note, English first, then da-DK.
