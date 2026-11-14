# Autosave everywhere: audit, mechanisms and PR plan (0.17 audit; phase 2 for 0.20)

Status: Phase 1 (audit and plan, no source code). Owner decision, 14 Nov 2026: every editor page or screen that needs a save uses
autosave when autosave is enabled. Dynamic lists too. With autosave off (today: `R2 caching` off) `Save` works as today. Autosave keeps a
**waiting version**; the final `Save` applies it. A setting that changes the live site (colours, theme, menus, …) never goes live by
autosave alone.

**Phase 2 moved to 0.20 and redrawn on 14 Nov 2026: the settings forms are a subpage or a side sheet with `Save`, no autosave (owner).** Section 0 below
says what changed; sections 1–4 are the audit as it was and still hold where section 0 does not say otherwise; section 5 is replaced by
section 5a; section 7 marks what is decided, open for the owner, or proposed.

## 0. Phase 2 for 0.20: what the settings pages change

**Owner decision, 14 Nov 2026 (supersedes the first draft of this section):** the settings forms open as a **subpage with a back arrow** on
compact and as a **side sheet** from medium (`specs/2026-11-14-settings-sheets-design.md`, with Material 3's pages quoted). The owner wants
`Save`, **not autosave**, on these forms: the subpage has `Save` in the bottom bar (the page form's), the side sheet has `Save` and `Cancel`, and leaving with
changes asks with the existing "Keep your changes?" dialog. So autosave follows **where the form is shown**:

| Where the form is | Autosave | What keeps unsaved work | The final step |
| :--- | :--- | :--- | :--- |
| **Subpage** (compact) or **side sheet** (medium and wider) | **no** (owner) | the hidden copy in the browser (0.18's `sheetCopy.mjs`, by route) | `Save`, or `Cancel` (asks "Keep your changes?" when changed) |
| **A screen** (the page form, Colours, entries with a text body, own lists' definitions, the dashboard's edit mode) | **yes**, at every width, as section 2 says | the waiting version (pages: git draft as today; the rest: R2 only) | `Publish` (pages), `Save` in the app bar (the rest; app bars spec) |
| A screen with **autosave off** (`R2 caching` off) | no | nothing new (today's leave question) | `Save` |

What this changes in the audit below:

- **Rows 4-12** (fixed pages, folder entries, part forms, app settings, Colours, Logo and icon, Header, Footer): a form shown as a subpage or
  side sheet writes **no waiting version**; only Colours and entries with a text body, which stay screens, keep one. The key, the value shape
  and the restore of section 3 apply to those screens only.
- **Row 6** (a new entry): in a subpage or side sheet only the hidden copy keeps it; the `Not saved yet` listing of decision 8 applies only to a
  new entry on a screen.
- **Row 16** (a field's page) is a second level inside its form's subpage or side sheet; it has no waiting version (as before).
- **Rows 1-3, 13, 15** (pages, posts, new pages, own lists, the dashboard): unchanged; they are screens.
- **The status line** (`Saving...`, `Saved`, `Not saved`) is the app bar's subtitle on a screen (app bars spec 5.2); a subpage or side sheet draws none.
- **`FormFrame`'s floating Save bar goes** from every form: a subpage has `Save` in the bottom bar, a side sheet has its bottom actions, a screen has it in the app bar.
- **Void for settings forms:** section 5a's PR 3 ("The side sheet autosaves") and PR 4's side-sheet part, PR 8's side-sheet autosave line,
  open decision 11 (a waiting version and the phone) and the side-sheet reading of decisions 3 and 8. The PM removes or rewrites them when
  the owner settles O1 and O2 of the settings pages spec; nothing here is built before then.

Read for this audit: `2026-11-11-drafts-and-publish-plan.md` (Autosave parts A and B), `worker/autosave.js`, `lib/autosave.mjs`,
`src/autosave.mjs`, `src/useAutosave.ts`, `src/EntryForm.tsx`, the two autosave screen folders, `src/FormFrame.tsx`,
`src/CompanyForm.tsx` (`usePartForm`), `src/DataForm.tsx`, `src/useDataFiles.ts`, `src/Colors.tsx`, `src/BrandForm.tsx`,
`src/Redirects.tsx`, `src/DashboardEdit.tsx`, `src/Library.tsx`, and PRs #560 and #564 (dynamic lists, another worker).

## 1. What exists today

- **Pages and posts** (published, draft, new): autosave to R2 under `<owner>/<repo>/autosave/<page file>/<version id>`, value
  `{ text, savedAt }` (≤ 1 MiB). Moved to **git** as the waiting version (`src/drafts/…`, commit `Draft: <page>`) when the person leaves, after
  5 minutes idle (client) or a day idle (Worker's hourly `sweepAutosaves`). Safe for the live site because `src/drafts/` is outside everything
  the site builds. `useAutosave` gives `saving` / `saved` / `notSaved`; the form shows it under the title. A page reopens with the kept text
  when it is newer than git (`restorable`).
- The Worker only accepts markdown page paths (`isPagePath`: `src/content/**.md`) and its flush writes to git. That is the part that cannot
  be reused as is: **nothing else the editor edits has a `src/drafts/` home**, and a data file's flush to git would put it live.
- **#560/#564 (dynamic lists)** add the first non-page waiting version: key = the list's `_list.json`, value = one JSON text (definition + rows
  + fields to remove), same `GET/PUT/DELETE /api/autosave`, **never flushed to git, never swept to git** (`isListDraftPath`), only the editor
  commits it with the final `Save`. This is exactly the model every other screen needs. Today it is a special case; Phase 2 makes it the
  general one.
- All other forms (`DataForm`, `usePartForm`, `useDataFiles`, `Colors`, `BrandForm`) keep their state in React only. They show `FormFrame`'s
  `Save` bar when dirty and ask `Save the changes?` when leaving. Closing the tab loses the changes (the browser asks first).

## 2. Every screen with a Save, and what its waiting version is

Legend: **Auto today**: yes/no. **Kept**: where the waiting version lives. **Off**: behaviour with autosave off (all rows: unchanged, `Save`
works as today, line under the title says `Not saved` while changed). **Restore**: how a reopened screen gets it back. Status line is
always the existing `Saving…` / `Saved` / `Not saved` (no new texts).

| # | Screen (route) | File(s) written | Auto today | Waiting version, kept | Restore on reopen | Notes |
|---|---|---|---|---|---|---|
| 1 | Page form, published or draft (`EntryForm`) | `src/content/**.md` | yes (B) | git `src/drafts/…` via R2 | `restorable` | done; stays as is |
| 2 | Post form (`EntryForm`) | `src/content/blog/*.md` | yes | same | same | done |
| 3 | New page, new post | placeholder, then draft file | yes | R2, flushed to a draft page file | list shows the draft | done |
| 4 | Fixed pages (`DataForm`, `fixed`: front page, standard pages) | `src/data/*.json` or page JSON | no | **R2 only**, value = file text | `DataForm` asks R2 for its file path on open | a fixed page is live: never flushed to git |
| 5 | Folder entry, existing (`DataForm`: tags, popups, testimonials, prices, categories, promotions, cookie list, contact bar, own-list items) | one `src/data/<folder>/<slug>.json` | no | R2 only, value = file text | same | |
| 6 | Folder entry, new (`DataForm` `isNew`) | none yet | no | R2 only under a placeholder key `new-<id>`, value = form values | listed on the collection's list as `Not saved yet` (as #560 does for lists); opening it restores | file name only exists at Save |
| 7 | Business parts: Contact, Social media, Bank; Privacy (Cookie banner, privacy pages); SEO parts; Globals › Block templates; Appearance parts (`CompanyForm` / `usePartForm`) | the part's JSON file | no | R2 only, value = form values | `usePartForm` asks R2 on open | one hook change covers all, see 3.2 |
| 8 | Installed app settings (`AppFormPage`, `usePartForm`) | app's settings file | no | R2 only, form values | same | `Part.changedTo` calls the app's API **only at final Save** |
| 9 | Business › Colors (`Colors`) | colours file (`config.colors`) | no | R2 only, value = the colour choices (mode tabs, custom colours, kept answers) | `Colors` asks R2 on open | never builds the site until `Save` |
| 10 | Business › Logo and icon (`BrandForm`) | logo, favicon and icon files (binary) | no | **see decision 5** | | binary images do not fit the 1 MiB text value |
| 11 | Globals › Header (`HeaderSettings`, `useDataFiles`): menu, mobile menu, call to action, menu button | 3–4 JSON files | no | R2 only, one value holding all files' values | `useDataFiles` asks R2 on open | multi-file, see 3.2 |
| 12 | Globals › Footer (`FooterSettings`, `useDataFiles`) | `footer.json` | no | R2 only | same | |
| 13 | Own lists: list page, new list, edit list (#560/#564) | `_list.json` + item files | yes (R2 only, own code) | R2 only | own code | **joins** at PR 2; see 4 |
| 14 | Own list item page (`DataForm`) | item file | no | row 5 | row 5 | covered by row 5 |
| 15 | Start screen dashboard edit mode (`DashboardEdit`, `Done`) | the person's dashboard in KV `dashboard:<id>` | no | the draft, in KV under `dashboard-draft:<id>` (person's own, never the site) | on opening the start screen in edit mode | not site content; not a live-site setting |
| 16 | App/block part field pages (`PartFieldPage`) | same file as its form | follows the form (row 7/8) | the parent form's | | no own save |
| 17 | Earlier version opened as changes (`Versions`) | | follows the form | the form's | | an unsaved change of the form |

### Screens where a waiting version makes no sense (stay as they are)

Each is a **one-tap decision** or an **action**, so there is never an unsaved state to keep. They commit at once today and keep doing so.
This is also what "never live by autosave alone" asks for: nothing here is autosaved because nothing here is a form.

| Screen | Why no waiting version | Alternative |
|---|---|---|
| Appearance › Themes, Icon packs, Motion | choosing a card is the decision; it commits at once | none; a wrong choice is undone by choosing again, history has it |
| Globals › Side column | a choice list that commits at once | none |
| Settings › Block settings on/off, Developer › Caching and builds switches | switches that apply at once; `R2 caching` is what turns autosave on, so it cannot wait for itself | none |
| Files (upload, delete, tags), Deleted (restore) | actions with their own commit; tags save at once | none |
| Lists: move up/down, delete, select-and-delete | actions; a reorder is a command, not a draft | the `Deleted` list brings back a delete |
| Redirects sheet, Missing addresses sheet | a short sheet over a list, one redirect per commit | decision 4 |
| Publish, Schedule, Unpublish, Discard, Delete | actions | none |
| App store: install, update, remove, connect | actions with side effects outside the repository | none |
| Account, Density, Assistants, Notifications | per-browser or per-person settings, saved at once, not the site | none |
| Sheets that write into a form (`LinkSheet`, `BlockDialog`, item sheet in `fields.tsx`, widget settings sheet, section settings) | their `Save`/`Insert` writes into the **parent form's state** (or the dashboard draft), not a commit | the parent form (rows 1–15) is what autosaves |
| Consents, Keywords, SEO scores, Licenses, System status, CMS version | read only | none |

## 3. Mechanisms (few, shared)

### 3.1 One waiting-version store in the Worker

Generalise `worker/autosave.js` and `lib/autosave.mjs`; no new endpoint:

- `isPagePath` becomes `waitingKind(path)`: `page` (markdown in `src/content/`, flushes to git as today), `keep` (any file the editor edits:
  `src/data/**`, `src/content/**/*.json`, the colour, side, motion, icon, theme and app-settings files, and a `new-<id>` placeholder), or `null`
  (refused). `keep` values are **never flushed and never swept to git**; the sweep only deletes them at 30 days. #560's `isListDraftPath`
  becomes one `keep` case.
- Value: `{ text, savedAt }` as now. For a one-file form `text` is the file's text; for a form with several files or values that are not valid
  yet, `text` is a JSON snapshot `{ version: 1, values | files }` (the shape #560 already uses for lists). The key is the **primary file's path**
  (the screen knows it), so restore needs no index.
- Signed in with push access only; 409 `off` without R2, as now. Existing limits (1 MiB) stay.
- `GET /api/autosave` (list) adds the `keep` ones with a `kind`, so the start screen can say `Changes waiting` for any screen, not only pages.

### 3.2 One hook for forms: `useWaiting`

`src/useAutosave.ts` already has the right parts (debounced read, `blocked`, `forgetIt` on save and discard, `watchLeaving`, retries). Phase 2
generalises it into **`useWaiting({ key, dirty, snapshot, apply, kind })`**: `snapshot()` gives the text (or `null` when it cannot be taken
now), `apply(text)` puts a restored text into the form, `kind: 'page'` keeps today's git flush, `kind: 'keep'` never flushes. `EntryForm`'s
call changes by one argument and its tests stay.

Forms use it through **one place each**, not a copy per screen:

- `usePartForm` (rows 7, 8, 16): `snapshot` = `values`, `apply` = `setValues`; every part form, app settings and field page gets it at once.
- `DataForm` (rows 4, 5, 6, 14): `snapshot` = `values`; a new entry uses the placeholder key.
- `useDataFiles` (rows 11, 12): `snapshot` = all files' values in one snapshot.
- `Colors` and `BrandForm` (rows 9, 10): their own state shapes, passed in the same way.
- `FormFrame` shows the status (`Saving…`, `Saved`, `Not saved`) in one place for all of them (it already has a `status` slot; `EntryForm`
  fills it today), so no screen draws its own line.

### 3.3 What the final `Save` does

Unchanged: it commits, then **deletes the waiting version** (`forget` + `DELETE`). `Discard` in `Save the changes?` deletes it too. A restored
form is dirty (it differs from git), so the `Save` bar is there. If the file changed in git after the waiting version was saved
(`savedAt` against the commit time, as `restorable` does for pages), the restored form says so with the existing conflict notice rather than
silently overwriting.

### 3.4 Restore and the start screen

A screen asks R2 for its key when it opens (one `GET`), loads it when newer than git, and says `Changes put back` (the existing
`forms.versions.autosave.restored`). The start screen's existing list of waiting pages (`GET /api/autosave`) adds the other screens, each
opening its own screen, so nothing is left behind after closing a tab.

### 3.5 The off state

`r2CachingOn` false → the Worker answers 409 `off` → `useWaiting` stays in `notSaved` and does nothing else. `FormFrame`'s `Save` works as
today. No screen needs its own branch.

### 3.6 Dashboard (row 15)

Not site content, so it does not use R2 or the site's autosave key: the existing person-keyed KV store (`worker/dashboard.js`) gets a second
key `dashboard-draft:<id>`; `Done` writes the real one and deletes the draft. Same `Saving…`/`Saved`/`Not saved` words.

## 4. How #560 / #564 join

They stay as they are until they merge (no duplicate work). After both are on `main`, PR 2 below replaces their private draft code
(`isListDraftPath`, `src/listDraft.ts` autosave calls) with `useWaiting` and `kind: 'keep'`, keeping their value shape and keys, so a
waiting version saved by their build is still read. Their rule "an item's `Save` commits the waiting definition with it" stays. Their open
questions (rows always wait, `Remove field` waits) are decisions 6 and 7 here.

## 5a. Build plan for 0.20 (replaces section 5)

Small PRs into the 0.20 line, each with one thing, a unit test for its rule, `check:screens` coverage and a changeset (`minor` when visible,
empty otherwise). The first visible PR writes the release note *Autosave everywhere* (one `paragraph`, mark `improvement`); later PRs add a
line only for new behaviour.

| PR | Does | Tests and screens | Depends on |
| :--- | :--- | :--- | :--- |
| 1 | Worker and lib: `waitingKind`, `keep` values never flushed or swept to git, deleted at 30 days (decision 10), the list includes `kind` | `lib/autosave.test.mjs`, the Worker's tests (keep never flushes, the sweep only deletes, refused paths) | — |
| 2 | `useWaiting` from `useAutosave` (pages keep their behaviour); own lists (#560/#564, now on `0.19`) move onto it when both lines meet | existing autosave tests green; lists keep their `check:screens` assertions | 1 |
| 3 | **The side sheet autosaves** (settings sheets spec, PR 7): `usePartForm`, `DataForm`, `useDataFiles`, `BrandForm` call `useWaiting` only when their sheet is a side sheet; the status in the sheet's header; `Save` applies, `Discard` deletes; `Changes waiting` on the row | 1280 px: type, `Saving…`→`Saved`, no commit, close and reopen restores, `Save` commits and clears; 375 px: no R2 write at all from the full-screen dialog; R2 off: `Save` and `Cancel` and the hidden copy | 2, settings sheets PR 4 |
| 4 | **New entries** in a side sheet (row 6): placeholder key, `Not saved yet` in the list | a new entry survives a reload on a computer; on a phone only the hidden copy | 3 |
| 5 | **Forms that stay screens** (Colours; entries with a text body): `useWaiting`, the status as the app bar's subtitle, `Save` in the app bar | Colours does not change the built site before `Save` (no commit) | 2, app bars PR 5 |
| 6 | **Logo and icon** (row 10), per decision 5 | per the decision | 3 |
| 7 | **Dashboard draft** (row 15), per decision 9 | edit, reload, still in edit mode with the draft; `Done` clears it | 2 |
| 8 | Docs, release note, and the `check:screens` rule: every side sheet with a form shows the autosave line, and no full-screen dialog writes to R2 | a side sheet with a form and no `useWaiting` fails; a full-screen dialog that calls `PUT /api/autosave` fails | 3–7 |

PRs 3, 5 and 7 can run side by side after 2.

## 5. Build plan: small PRs (0.17 draft, replaced by 5a)

Each PR: one thing, an unit test for its rule, `check:screens` coverage, an `npx changeset` (`patch`/`minor` as needed, release note when a site
owner sees it: the first visible one writes the paragraph *Autosave everywhere* for all screens, later PRs add a line only if they add behaviour).

| PR | Does | Tests and screens |
|---|---|---|
| 1 | Worker and lib: `waitingKind`, `keep` values never flushed or swept to git, list includes `kind`; start screen lists them | `lib/autosave.test.mjs`, `worker/autosave` tests (keep never flushes, sweep only deletes, refused paths); no screen yet |
| 2 | `useWaiting` from `useAutosave` (pages keep behaviour); move #560/#564 lists onto it | existing autosave tests green; lists: same `check:screens` assertions as #560/#564 |
| 3 | `usePartForm` (rows 7, 8, 16): all part forms, app settings, field pages | `check:screens`: type, `Saving…`→`Saved`, close and reopen restores, `Save` clears it; with R2 off, `Not saved`; app API not called before `Save` |
| 4 | `DataForm` existing entries and fixed pages (rows 4, 5, 14) | same pattern; fixed page never commits before `Save` |
| 5 | `DataForm` new entries (row 6): placeholder key, `Not saved yet` mark in lists | new entry survives a reload; not offered elsewhere until saved |
| 6 | `useDataFiles`: Header and Footer (rows 11, 12) | one snapshot for three files; no commit before `Save` |
| 7 | Colors (row 9) | colours do not change the built site until `Save` (screen asserts no commit) |
| 8 | Logo and icon (row 10), per decision 5 | per decision |
| 9 | Dashboard draft (row 15) | edit, reload, still in edit mode with the draft; `Done` clears it |
| 10 | Docs, the `check:screens` rule "every `FormFrame` screen shows the autosave line", release note | a screen with a `Save` bar and no `useWaiting` fails the check, so a new screen cannot forget it |

PRs 3–9 only depend on 1 and 2 and can run in parallel after them. PR 10's check is the "nothing left behind" guard.

## 6. M3 and words

No new UI part is proposed: the status line under the title already exists (`Saving…`, `Saved`, `Not saved`; Danish in `da-DK`). The
`site-editor-writing` skill and the live m3.material.io pages were not read for this plan, because there is no new component or text to
check; if a PR adds one, it reads the page with Playwright and quotes it first.

## 7. Open owner decisions (most important first; one at a time)

0.20 status (14 Nov, with the 0.18 PM; the owner was away): 1 and 7 decided. 2–6 and 8–10 stay **open for the owner**, with the
recommendations below, now read with section 0: decision 3 applies to the side sheet (the phone's dialog checks at `Save` only); decision 4's
Redirects sheet is a short sheet over a list, not a settings form, so it stays outside the settings sheets spec; decision 5 is PR 6 of 5a;
decision 6 belongs to the own lists of the 0.19 line; decision 8 applies to the side sheet only (on a phone the hidden copy keeps a new
entry). One new question comes with the sheets:

11. **Owner decision pending. A waiting version and the phone.** A waiting version saved in a side sheet on a computer, opened on a phone:
    recommendation **open it in the full-screen dialog as unsaved changes** (`Save` applies it, `Cancel` asks whether to discard it), so nothing
    is hidden on one device and shown on another (settings sheets spec, P5).

1. **Owner decision pending. Where do waiting versions of settings live, and do they ever reach git?** Recommendation: **R2 only, never git** (`keep`), as #560 does
   for lists. It is the only way a setting cannot go live by autosave. Cost: a waiting version is lost after 30 days idle and does not follow
   the person to a site without R2. (Alternative: a `src/drafts/` copy in git for data files too; more moving parts and it would show in
   history.)
2. **Owner decision pending. Do one-tap choices (Theme, Icon pack, Motion, Side column, switches) stay instant?** Recommendation: **yes**. There is no unsaved
   state, so nothing to autosave; making them wait would add a `Save` where there is none. The list in section 2 is exactly these.
3. **Owner decision pending. A waiting version of a form with a wrong field** (a bad e-mail, an unfinished row). Pages show `Not saved` until it is right.
   Recommendation: for settings, **keep the values anyway** (snapshot of the form), and check only at `Save`, so nothing typed is lost.
4. **Owner decision pending. Sheets that commit by themselves (the Redirects sheet).** Recommendation: **leave as is**: one short field set, one commit, `Delete`
   in the same sheet. If the owner wants it, the sheet gets the same hook with the redirect's address as key.
5. **Owner decision pending. Logo and icon (binary images).** Recommendation: keep only the **choices** (which image slot changed) in the waiting version and
   keep the image bytes in the browser until `Save`, as pages do with images now; say so with `Not saved` while a new image waits.
   (Alternative: put the image in R2 under the waiting key, up to a size limit.)
6. **Owner decision pending. Do the rows of a list always wait for the final `Save`** (#560 question 1)? Recommendation: **no**: items are saved on their own item
   page like testimonials (#564 already does this); only the list's definition waits.
7. **Decided (owner, via PM): yes. Do `Remove field` and `Remove data` always wait** (#560 question 2)? Recommendation: **yes**, they destroy data, so they only happen at
   the final `Save`.
8. **Owner decision pending. New entries that were never saved (row 6): keep them across a closed tab?** Recommendation: **yes**, listed as `Not saved yet`
   (consistent with new pages and lists), deleted after 30 days.
9. **Owner decision pending. Dashboard draft (row 15): is it worth it?** It is per person and cheap to lose. Recommendation: **yes, last**, since the owner said
   every screen that needs a save, and it costs one KV key.
10. **Owner decision pending. How long is a waiting version kept?** Recommendation: **30 days** (today's `EXPIRE_MS`), then deleted; the start screen shows what is
    waiting before then.
