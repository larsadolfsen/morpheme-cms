# 0.19.5 A measured Material 3 check (plan)

Status: **21 November 2026.** Owner, 21 Nov 2026: "I dont feel like our review of md is going especially splendid", then "yes" to this
plan, "in 0.19.5". It is part of `plans/2026-11-20-0-19-5-material-3-tokens.md` and goes before every M3 batch not yet started.

## Why the review is not working

- **The check sees only what is named like M3.** `check:m3-tokens` compares the `:root` tokens in `theme/styles/tokens/` whose names map
  to an M3 token. Its allowlist is empty and it is green, yet the audits keep finding differences. Our *medium* button is M3 Expressive's
  *small*, so `--mo-comp-button-medium-*` maps to nothing and its 24 dp padding is never compared. A value in a part's own CSS
  (`theme/styles/ui/*.css`, `src/*.css`) or in a scoped rule is never read at all.
- **Audits read; nothing measures.** Batches 14 and 19 compared code and docs with M3 by reading, and each found what the one before
  missed. A reading audit cannot be finished, only repeated.
- **The owner is asked what M3 already prints.** Under "M3 wins" (material-3, rules 5 and 6) a value M3 prints is not a question.
- **Old rules keep being followed** while `#1071`, which holds the 21 Nov rules, is unmerged.

## What changes

### 1. The token check compares by what a part is, not by its name

`check:m3-tokens` maps a theme token to M3's through the rename map of 0.20.0 (`specs/2026-11-20-material-3-names-design.md`, which says
our *medium* is M3's *small*), not only through an equal name. A token that maps neither way is listed by `--report` as *ours*, and the check
fails on a new one. Every `--mo-comp-*` token is then either compared or named as ours.

### 2. A check that measures what renders: `check:m3-render`

Runs on the built demo's UI components page (`/ui/`, `pages/components.astro`), which draws the same gallery as the editor's *Parts ›
UI components* (`src/ComponentGallery.tsx`). So the site and the editor are measured on one page.

- Each sample in the gallery carries the M3 token set it is (`data-m3="md.comp.button.small"`, with its kind and state:
  `data-m3-kind="filled"`, `data-m3-state="hovered"`). A sample without one fails the check, unless M3 has no such component (then it is
  marked `data-m3="none"` and listed in the check's file with the reason).
- With Playwright, for each sample, in light and dark, the check reads the computed style and box: height, min width, padding (leading
  and trailing space), gap, corner radius, icon size, font size, line height, weight and tracking, border width, and each colour,
  resolved to the role whose value it equals. It compares them with the set's tokens in `docs/m3-tokens/` (Expressive where it has one).
  1 px of tolerance on sizes; colours must be the role.
- It fails on a difference not in `scripts/m3-render.allow.mjs`, and on an entry there that no longer differs. That allowlist takes only
  what `material-3` rule 6 lets stand: an owner status from 21 Nov 2026 or later (today CS2 and CS3), or a WCAG criterion named in
  `theme/accessibility.json`. "To fix in batch N" is allowed during 0.19.5 and must be empty at release.
- **Values M3 prints only on a page**, not as a token (the search bar's 360 dp minimum width, a list's divider use), go in
  `docs/m3-tokens/printed.json`: the value, the URL and the quoted sentence, read with Playwright. The check compares them the same way.
- In CI beside `check:screens` (it needs the build). It is not in `npm run check`; skill `checks` says when to run it locally (a change
  to `theme/ui/`, `theme/styles/` or a part in `src/ui.tsx`).

### 3. One component at a time, all the way through

The first run of `check:m3-render` is the list of what differs, and it replaces further reading audits. The fixes go by component (all
of buttons, then icon buttons, lists, fields …), each batch fixing its component's tokens, part CSS and every override, and emptying its
lines of the allowlist. A component is done when it has no line left.

### 4. Who decides

A value the token copy or `printed.json` holds is decided: the batch takes it, no question to the owner. The owner is asked only where M3
prints nothing (rule 3: the nearest M3 pattern, named) or where we copy another product (CS2, CS3).

## Batches (pull requests into `feature/0.19.5-m3-tokens`)

Batches 18 and 21 (list and button padding) finish as they are; the new check then confirms them. No other M3 fix batch starts before
batch B lands.

- **A. The token check by part.** `check:m3-tokens` uses the rename map; `--report` names every unmapped token as ours. The differences
  it now finds go on its allowlist as `fix`, with their batch.
- **B. The measured check.** The `data-m3` marks on every gallery sample, `scripts/check-m3-render.mjs` with its test, `printed.json`
  with the values M3 prints only on a page, the CI job, and the allowlist holding exactly what the first run finds, each line with its
  component batch. The pull request lists the first run's findings per component.
- **C and on. One batch per component**, in the order the site uses them most: buttons, icon buttons, lists, text fields, menus,
  chips, cards, dialogs and sheets, app bars and navigation, search, the rest. Batches that touch different components can run side by
  side.

A goes first; B can be built beside it. The remaining batches of the tokens plan (colour roles, sizes, shapes, type, recorded
deviations) are carried out as component batches, so no value is fixed twice.

## 0.19.6

The editor's screens use the same parts, so `check:m3-render` already measures them in the gallery. In 0.19.6 it is extended to the
screens themselves: each `check:screens` unit measures the marked parts it opens, which catches an override in `src/*.css`. The 0.19.6
plan's batches then end when their screens have no line left in the allowlist.

## Done when

- `check:m3-tokens` compares every theme token or names it as ours.
- `check:m3-render` runs in CI on every sample of `/ui/`, in light and dark, and its allowlist holds only owner-kept (21 Nov or later)
  and WCAG entries.
- The owner has reviewed `/ui/` on the demo and staging in light and dark, and 0.19.5 has run on staging before the owner releases it.
