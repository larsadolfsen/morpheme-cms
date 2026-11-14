# Icon packs in the store (0.18)

> **Status:** draft of 14 November 2026, written against `main` at `f72ddf6` (`@morphemecms/cms` 0.16.0). A spec and plan
> only: nothing is built. The owner's decision (14 November 2026): **icon packs that are not Material Symbols (Phosphor,
> Lucide and any other) leave the CMS and become items in the store** (`morpheme-appstore`), installed from the editor like
> themes and apps. A new **Icons** area is added under Apps, next to the store's sections. Material Symbols stays the one
> built-in standard pack. No Phosphor icon is drawn in the editor or on a site unless a site installed that pack from the
> store and picked it. Everything else is proposed; the open decisions are at the end, numbered.
>
> **What was read.** In this repository: `src/icon.tsx`, `src/iconPacks.ts`, `site/iconPacks.mjs`, `site/icons.mjs`,
> `site/theme.mjs`, `lib/materialIcon.mjs`, `lib/contracts.mjs`, `lib/lockfile.mjs`, `lib/licenses.mjs`, `src/Library.tsx`
> (`IconPacks`), `src/ThemeStore.tsx`, `src/StoreSections.tsx`, `src/sectionChoice.mjs`, `scripts/check-phosphor.mjs`,
> `scripts/phosphor-allowlist.json`, `scripts/editor-screens.mjs`, `site/phosphorPack.test.mjs`, `docs/store-ids.md`,
> `docs/app-contract.md` and `2026-11-11-store-sections-design.md`. In `morpheme-apps`: `scripts/release-store.mjs`,
> `scripts/app-entry.mjs`, `themes/venus/theme.json`. **Not read: `morpheme-appstore`.** This session was refused access to
> that repository, so every statement about its data model and `registry.js` below is written from the CMS side and marked
> **to verify**. The 2026-11-04 store specs were not read for the same reason.

## Goal

An owner who wants Phosphor or Lucide opens Apps › Icons, taps one, and the pack is installed into the site. Then the owner
picks it under Appearance › Icon packs, as today. A site that never installs a pack carries no Phosphor and no Lucide: not in
its files, not in its build, not in the editor. The CMS package gets smaller, and a new pack (Tabler, Heroicons, a
brand's own set) is a store item, not a CMS release.

## Where we are today

| Part | Today |
| ---- | ----- |
| Packs shipped in the CMS | `icons/material-symbols/`, `icons/phosphor/`, `icons/lucide/`, 205 to 207 SVG files each (about 840 KB each), written by `npm run icons` (`scripts/icon-packs.mjs`) from npm packages pinned in `PACK_SOURCES` (`site/icons.mjs`). `SYSTEM_PACKS` in `site/iconPacks.mjs` lists the three ids. |
| Packs a theme brings | `src/themes/<theme>/icon-packs/<pack>/` with a `pack.json`, id `<theme>/<pack>`. They come and go with the theme. `StoreTheme.iconPacks` shows them on the theme's page. |
| The choice | `src/data/icons.json`, `{ "pack": "<id>" }`, else the theme's `icons` key in `theme.json` (Material: `material-symbols`; Venus: `phosphor`), else the standard theme's. `packInUse` in `site/iconPacks.mjs`. |
| What a pack is | A folder: `pack.json` (name, author, licence, optional `includes` for icons taken from other sets, each with its own `LICENSE-<set>`), `LICENSE`, and one SVG per **icon name**. `packProblems` (`site/icons.mjs`) fails a pack that lacks an icon the CMS or the editor draws. |
| The icon names | **Phosphor's names** (`map-pin`, `certificate`, `play-fill`). Content stores them (a card's `icon: certificate`), the editor's code imports them as React components (`@phosphor-icons/react`, 89 files and 326 imports on the allowlist), and `usedIcons()` finds the ones in use by scanning the code and the store catalog. |
| How a pack is drawn | `themePlugin` (`site/theme.mjs`) redraws every `@phosphor-icons/react` import and every `@phosphor-icons/core/assets/…svg?raw` import in the pack in use, at build time. `Icon`/`Svg` (`src/icon.tsx`) looks a name up in the theme's icons, then the pack's, then Material Symbols by its Material name (`resolveIcon`, `lib/materialIcon.mjs`), else MISSING. |
| Guards | `check:phosphor` (new components may not import Phosphor; counts only fall), `site/phosphorPack.test.mjs`, and `check:screens` (no Phosphor glyph, viewBox `0 0 256 256`, while Material Symbols is the pack). |
| The editor | Appearance › Icon packs (`IconPacks` in `src/Library.tsx`, route `appearance/icon-packs`): a list of installed packs with three or five sample icons, the chosen one ticked, saved in its own commit. The store has three sections (Themes, Connectors, Plugins: `StoreSections.tsx`, a segmented button). |

**The finding that shapes this spec:** Phosphor is not only a pack, it is the CMS's **icon vocabulary**. Content, apps
(`icon: "CalendarCheck"` in `app.json`, contract 4), catalog entries, the theme contract and the editor's own code all use
Phosphor's names. Removing the Phosphor *pack* is small. Removing the Phosphor *names* is a migration of content and of every
app. This spec therefore separates the two (decision 1): the names stay as a list the CMS owns, the pack goes.

## Decisions taken by the owner (not open)

1. Non-Material packs become store items; Material Symbols is the one built-in pack.
2. A new Icons area under Apps, next to the store sections.
3. No Phosphor icon is drawn unless a site installed and picked that pack.

## Design

### 1. What a store icon pack is

A pack is a store item of a new **kind `icons`**, beside `app` and `theme` (proposed: decision 4; the id prefix `icons_`, then
16 lowercase hex characters, as `app_` and `theme_`; the handle is a readable slug, `phosphor`, as an app's handle).

- A pack has **no code and no dependencies** (not even `peerDependencies`). It is SVG files and text. The store rule stays:
  a version is forever, the manifest has only `peerDependencies` and no install scripts (`lib/lockfile.mjs`, which
  already writes an entry from the registry without npm). A pack's manifest has none at all, which makes it the simplest
  item the store has; `NeedsNpm` can never happen for it.
- A pack is **not an app**. It has no `role`, no `csp`, no `reads`, no hooks, no settings, no `worker.js`. Putting it under
  `app` would make the store check for things that cannot apply. (Alternative: an app `role: 'icons'`, rejected because
  contract 5 says a plugin has no outside access and an icon pack is data, not behaviour.)
- Safety: an SVG can carry script. `cleanSvg` (`lib/svg.mjs`) and `svgProblems` (`site/icons.mjs`) already allow only what
  draws. The store runs the same check at release, and the editor runs it again at install.

### 2. Its manifest and files

The folder in the item's repository, and in the site after install, is the folder the CMS reads today for a theme's pack,
so the build code changes little:

```
src/icon-packs/<id>/            (id = the store id, icons_<16 hex>)
  pack.json                     name, author, license, version, url, source, includes?, icons? (see below)
  LICENSE                       the pack's licence text
  LICENSE-<set>                 one per set in "includes"
  <icon-name>.svg               one file per icon name (the frozen list, decision 1)
  store.json                    { version, ref, files } as an app's or theme's (lib/storeEntries.mjs RECORD)
```

`pack.json` keeps today's keys (`name`, `author`, `license`, `url`, `version`, `source`, `includes`) and adds:

| Key | Meaning |
| --- | ------- |
| `api` | The icon pack contract it is written to (`ICON_PACK_API`, see "Contracts"). |
| `description` | `{ "en-US": …, "da-DK": … }`, as a theme's, for the store page. |
| `style` | `outline`, `filled`, `duotone` or `mixed`: a text for the store's filter. Optional. |
| `fill` | `true` when the pack has a filled variant for the names that have one (`play-fill`). Today every pack holds `<name>-fill.svg` for the names that need it. |

The store entry (`itemEntry`, in `morpheme-apps/scripts/release-store.mjs`, **to verify against the store**) carries `name`,
`author`, `icon`, `description`, `licenses` (as `storeLicenses` writes them) and `samples` (the names of the five icons
shown, `house`, `magnifying-glass`, `calendar-blank`, `envelope-simple`, `heart`, as `SAMPLES` in `src/iconPacks.ts`).

**Coverage (open decision 3).** Today `packProblems` fails a pack without a file for every name the CMS or the editor draws.
Proposed to keep it as the store's release rule: the pack lists no gaps, so nothing falls back at random. The list of names a
pack must cover is the frozen list in `lib/iconNames.mjs` (new, see 3).

### 3. The icon names (what stays in the CMS)

- **`lib/iconNames.mjs`** (new): the frozen list of names the CMS and its contracts use. It is exactly `usedIcons()` today
  (about 205 names plus `-fill` variants), written once from the code and the catalog. A name is a key, `map-pin`: it names
  a meaning, not Phosphor's drawing.
- `site/icons.mjs` stops scanning for Phosphor imports. `usedIcons()` reads the list instead; a new name is added to the
  list in the pull request that needs it, and every pack covers it in its next version (a pack missing a new name falls
  back to Material Symbols for that name only until it is released; see "Releases").
- **The icon picker** still shows all of Material Symbols by its Material name (`useAllIconNames`). The names that only
  Phosphor has (`phosphorOnly` in `src/icon.tsx`) leave the picker: with Phosphor out of the CMS there is no all-Phosphor
  set to search. A pack that is installed adds its **own names** to the picker only if its `pack.json` lists them under
  `icons` (decision 8, optional, not in 0.18).
- **Content** keeps working unchanged: `icon: certificate` is a name from the list. A name that is Material's
  (`drag_indicator`) is drawn from Material Symbols, as today.
- **Apps and the catalog**: `icon` stays a name from the list (`calendar-check`; the contract-4 form `"CalendarCheck"` is
  mapped to it as now). `morpheme-apps/scripts/app-entry.mjs` checks the name against `lib/iconNames.mjs` instead of
  `@phosphor-icons/core`.
- **Phosphor's React components.** `@phosphor-icons/react` is a dependency of the package (and of every app and theme that
  imports an icon). It cannot be removed in one step. Plan: `themePlugin` already replaces that module with the pack in use;
  it is replaced, for good, by a CMS-owned module **`@morphemecms/cms/icons`** with the same component names (`CaretRight`,
  `MapPin` …) and the same props (`size`, `weight`, `color`, `mirrored`), drawn by the pack in use through `Icon`. Imports
  of `@phosphor-icons/react` in the CMS then become imports from `@morphemecms/cms/icons` (a codemod; 326 imports in 89
  files), and the alias of `@phosphor-icons/react` to the same module stays for **apps and themes written to contract 4 and
  5** until their contract window ends (`docs/app-contract.md`, "How long contract 4 stays accepted"). Then the dependency
  leaves `package.json`. This is the largest single piece of work (batch A3).

### 4. Where a pack installs, and how

- Install writes `src/icon-packs/<id>/…` and `store.json` in **one commit**, as a theme's install does
  (`useThemeActions` in `src/ThemeStore.tsx`: `env.store.files`, `themeChanges`, `env.commit`). Update and uninstall are the
  same, with the same "what changed" dialog for an update.
- `packFolder(id)` (`site/icons.mjs`) maps a store id to `src/icon-packs/<id>`; the system id `material-symbols` stays
  `icons/material-symbols` inside the package. `SYSTEM_PACKS` shrinks to `['material-symbols']`.
- **A theme's own `icon-packs/` folder** (today `src/themes/<theme>/icon-packs/<pack>/`, id `<theme>/<pack>`) stays as it
  is: it is the theme's own work, not a store pack. Nothing in the store changes for it. The CMS ships no theme with one
  today (Material has `icons: material-symbols`); Venus names `phosphor`. See "Themes".
- **Uninstall** is refused while the pack is in use, chosen in `src/data/icons.json`, or named by an installed theme's
  `icons` key (decision 5), as a theme in use cannot be uninstalled (`canUninstall` in `src/ThemeStore.tsx`).
- The editor has the pack's files **at build time only**: the build draws the pack in use. A pack just installed shows in the
  editor after the next build, as a chosen pack does today ("Changing to it …", `iconPackNext`).

### 5. How a site picks it

Unchanged for the owner: Appearance › Icon packs. What changes underneath:

| | Today | New |
| --- | --- | --- |
| Packs listed | the three system packs, plus those of installed themes | Material Symbols, plus the **installed store packs**, plus a theme's own packs. A pack not installed is **not listed** there: it is in Apps › Icons. |
| Empty state | n/a | One row at the bottom: "More icon packs in the store" (Danish: "Flere ikonpakker i butikken") linking to Apps › Icons. |
| `src/data/icons.json` | `{ "pack": "phosphor" }` | `{ "pack": "icons_<16 hex>" }`. The value is the store id, as an app's id in `src/data/apps.json` (`docs/store-ids.md`). A readable alias is **not** stored. |
| `theme.json` `icons` | a system pack's id, or a theme's own pack | the same, or a **store pack by handle** (`"phosphor"`); the build resolves the handle to the installed pack with that handle (`pack.json` carries `handle`). |

`docs/store-ids.md` gets a row for `src/icon-packs/<id>/` and `src/data/icons.json`'s new value, and its check list gets the
new id test.

### 6. How `Icon` draws it

`Icon`/`Svg` keeps its order (`resolveIcon`): the theme's own icon (`src/themes/<theme>/icons/<name>.svg`), then the pack in
use, then Material Symbols by its Material name, else MISSING. The changes:

- The **Phosphor set leaves `icon.tsx`**: `virtual:all-icons-ssr`, `./allIcons`, `phosphorSet`, `phosphorLookup`,
  `loadPhosphor`, `phosphorOnly` and the `regular`/`fills` `import.meta.glob` of `@phosphor-icons/core`. The names the code
  draws come from the pack in use through the same virtual module `themePlugin` writes today for the theme's icons.
  `resolveIcon`'s third source (`phosphor`) goes; `lib/materialIcon.mjs` and its test lose that branch.
- `AnyIcon` (an app's icon before it is installed, drawn from the catalog) draws the name from the **pack in use**, else
  Material Symbols, else MISSING. A catalog name no pack covers is MISSING in the store, which the store's release check
  prevents (the catalog's `icon` must be in `lib/iconNames.mjs`).
- `SvgFile` stays: it draws a pack's file as it is, for the pack's samples (`IconSwatches`). In the Icons area the samples of
  a pack **not installed** come from the store (the sample SVGs travel in the catalog entry, as theme screenshots do: **to
  verify** the catalog's size limit; five small SVGs are under 5 KB).
- A pack that is installed but **lacks a name** (an older version, before a new name was added): that one name falls back to
  Material Symbols (`data-icon-fallback`), the build prints a warning with the pack's name and the missing names, and the
  Icons area shows "Update available". It is not a build failure.

### 7. The Icons area in the editor

**Where.** The Appstore (`#settings/appstore`, `StoreSections.tsx`) has a segmented button of three sections. The Icons area
is a **fourth section**, `icons`, Danish **Ikoner**: `SECTIONS` in `src/sectionChoice.mjs` becomes
`['themes', 'connectors', 'plugins', 'icons']`; the route is `#settings/appstore/icons`; the section last used is kept as
today. Apps is where the owner already finds the store, so "under Apps" is the same place.

**M3 research** (read from m3.material.io with Playwright on 14 November 2026; quotes verbatim):

- *Segmented buttons* (`components/segmented-buttons/guidelines`): "Segmented buttons can have 2-5 segments." and
  "Don't use more than five segments in a single segmented button. Choices should be scoped. If you have more than five
  choices, consider using another component, such as chips." Four segments is inside the limit. "Labels should be short and
  succinct." and "Don't allow segments to wrap onto a new line": `Themes`, `Connectors`, `Plugins`, `Icons` are short;
  the Danish `Temaer`, `Forbindelser`, `Udvidelser`, `Ikoner` are longer, so the check must pass at 360 px (an `check:screens`
  case, see "Checks"). **The page also says:** "Segmented buttons are no longer recommended in the Material 3 expressive
  update. For those who have updated, use the connected button group instead, which has mostly the same functionality but
  with an updated visual design." The store already uses a segmented button; a move to the connected button group is a
  separate decision for the whole store (decision 10), not for this change.
- *Lists* (`components/lists/guidelines`): "Lists are continuous, vertical indexes of text and images." "Place supporting
  visuals and primary text in the same position in each list item." "A leading icon should provide a quick visual cue that
  relates to the item's label text, helping people scan the list." "Limit supporting text to one to three lines." "A
  trailing icon is often used to communicate status or indicate an action." The list of packs is a list: a leading
  swatch of the pack's icons, the name as the headline, "author · licence" as supporting text, and the status (`Installed`,
  `In use`, `Update available`) as trailing text.
- *Cards* (`components/cards/guidelines`): "Use a card to display content and actions on a single topic." "Cards can serve as
  entry points into deeper levels of detail or navigation." "Cards can be displayed together in a grid, vertical list, or
  carousel." A pack is a card in a **grid** on a computer (the store's themes and apps use the same card), a **list** on
  a phone.
- *Search* (`components/search/guidelines`): "Use to search contents in a specific view, like Search your messages", "Add a
  search bar below a title to search specific content" and "Filter chips to narrow down results". The Icons area uses the
  store's existing search row (`StoreSearchRow.tsx`) and the filter chips for `Style` (outline, filled, duotone) and
  `Status` (installed, not installed).
- *Dialogs* (`components/dialogs/guidelines`): "Dialogs should contain a maximum of two actions." "If two actions are provided,
  one must be a confirming action, and the other a dismissing action." "Avoid apologies ("Sorry for the interruption"),
  alarm ("Warning!"), or ambiguity ("Are you sure?")." "The confirmation button is always closest to the edge." The install
  and uninstall questions use these (title: "Install Phosphor?", actions: Install / Cancel; "Remove Lucide?", Remove / Cancel).
- *Snackbar* (`components/snackbar/guidelines`): "Snackbars inform users of a process that an app has performed or will perform.
  They appear temporarily, towards the bottom of the screen." "Only one snackbar may be displayed at a time." "A snackbar can
  contain a single action." The store's existing notify line ("Installing…", "Installed Phosphor") already is this.

**M3 is silent on:** what an icon pack's sample row looks like (it is our own part), the density of five swatches in a list
item's trailing slot, and how a store lists data with no price. For these the nearest M3 pattern is used: a list item with a
leading visual (swatches as the leading media) and the card's media slot. Nothing is invented: no new part, mark or size is
introduced, only existing store cards and list items.

**Screens.**

1. **Icons** (`#settings/appstore/icons`). The store's header (segmented button, search row, filter chips). Below: the packs
   as cards in a grid (computer, three columns at the store's grid) or a list (phone). A card: the five samples as its
   media, the name, "author · licence", and the status: Install (filled tonal button), Update (when newer), or `Installed`
   (text). Sort: Name, Newest (as the store's `storeSort.tsx`). Material Symbols is **not a card** (it is built in); one
   line at the top says so: "Material Symbols is built in." (Danish: "Material Symbols er indbygget.").
2. **An icon pack's page** (`#settings/appstore/icons/<id>`, as an app's and a theme's page). The name, author and licence; the
   description; **all its icons** as a grid of swatches with their names (the pack's whole set, 205 to 207 icons,
   loaded from the store only when the page opens), the licences (`storeLicenses`, "Licenses" as an app page has them), the
   release notes per version and the buttons Install / Update / Remove. The page's primary action is one button, as a
   theme's. A pack page also shows "Used by" (installed themes that name it) once installed.
3. **Install and uninstall dialogs.** Install: title "Install Phosphor?", text "Its icons are added to the site. You pick it
   under Appearance › Icon packs." Actions Install / Cancel. Remove: title "Remove Phosphor?", text, and, when refused,
   no dialog: the snackbar says why ("Phosphor is in use. Pick another pack first.").
4. **Appearance › Icon packs** (existing screen): lists Material Symbols plus the installed packs; the footer row
   "More icon packs in the store". Nothing else changes.
5. **A theme's page** (`ThemeStore.tsx`, "Parts"): a theme whose `icons` names a store pack shows the pack in "Needs": "Needs the
   Phosphor icon pack", and installing the theme offers the pack in the same dialog (decision 4).

All words are in `src/i18n/en-US/apps.ts` and `da-DK/apps.ts`; `check:language` stays green; the Danish labels are proposed in
the list above and checked by the owner in review. Icon names in the UI say `image`/`icon` per the owner rule, never the old word.

### 8. What happens to sites that picked Phosphor or Lucide today

**No site breaks.** The cases:

| A site has | Today | In 0.18 |
| ---------- | ----- | ------- |
| `icons.json` `{ "pack": "material-symbols" }`, or no file | Material | unchanged |
| `icons.json` `{ "pack": "phosphor" }` or `"lucide"` | the CMS's own folder | `morpheme migrate` (see below) |
| the theme's `icons: "phosphor"` (Venus 1.3.0), no `icons.json` | the CMS's own folder | the same migration, and Venus's next version names the store pack |
| A theme's own pack (`<theme>/<pack>`) | unchanged | unchanged |

**The migration.** `scripts/migrate.mjs` (`morpheme migrate`) is where a site's files are rewritten on an update (it runs
`lib/migrate-content.mjs` today). It gets a second, small step `lib/migrate-icon-packs.mjs`, idempotent and pure
text-to-files, which:

1. reads `src/data/icons.json` and the active theme's `icons`;
2. when the pack is `phosphor` or `lucide` and there is no `src/icon-packs/<id>/`, **writes the pack from a seed** that
   0.18 still ships in the package (`icons/seeds/phosphor/`, `icons/seeds/lucide/`, the files today's `icons/` has, marked
   with the store id they correspond to and their version) into `src/icon-packs/<store id>/` with a `store.json` whose
   `version` is the seed's, so the store sees them as the installed version and offers an **update** later;
3. rewrites `icons.json` to `{ "pack": "<store id>" }`, and
4. prints what it did, like `migrate` does for content. `--check` changes nothing and fails when a file would change.

The editor runs the same step **when the owner first opens it after the update** (the editor's update flow,
`2026-11-03-cms-update-check-design.md`), as its own commit, so an owner who never uses the command line is covered. The CMS
build runs the check and **never writes** the repository.

The seeds are what makes the migration work offline and independent of the store's availability, and they keep the one
rule "a site's files are in its own repository". **The seeds are removed in 0.19**, one minor later (decision 2). Sites that
have not migrated by then get the build's warning (below), not a failure.

**If the pack is missing at build** (a site updated but not migrated, or a pack uninstalled by hand): the build draws
Material Symbols and prints one warning, "The icon pack <id> in src/data/icons.json isn't installed. Material Symbols is used.
Install it under Apps › Icons or run npx morpheme migrate." `check:content` shows the same line as a **warning**, not an
error. Today it stops (`iconPack()` in `site/theme.mjs`), which would break a site; this is the one behaviour change that
protects sites.

### 9. Themes that ship `icon-packs/` and the `"icons"` setting

- **A theme's own `icon-packs/<pack>/`** stays valid. It is part of that theme's files and travels with it (install, update,
  uninstall); `packFolderInTheme`, `themeOfPack`, `themeDropsIconPack` in `ThemeStore.tsx` do not change.
- **`"icons"` in `theme.json`** keeps its meaning: the pack the theme uses while none is chosen. It may name `material-symbols`,
  a theme's own pack by its folder, or a **store pack by handle**. A theme that names a store pack declares it in
  `theme.json` as `"iconPack": { "handle": "phosphor", "range": "^1.0.0" }` (the store's `peerDependencies` rule applied to a
  theme: it asks, it never brings; **to verify** that the store's theme manifest can carry the field).
- **Venus** (`morpheme-apps/themes/venus`, `"icons": "phosphor"`, highlight "Phosphor's icons"): its next version declares
  `iconPack: { handle: "phosphor" }`; installing Venus from the store offers to install the pack with it (one dialog, two
  commits or one). Venus 1.3.0 on existing sites keeps working through the migration above.
- `themeProblems` (`site/theme.mjs`) learns `iconPack`, and stops treating `phosphor` and `lucide` as system packs.

### 10. Apps whose store entries use Phosphor icon names

No app breaks and none is republished for this alone: an app's `icon` is a name from the frozen list (3), and the catalog
check moves from `@phosphor-icons/core` to the list. Apps that **import** Phosphor components in their code
(`morpheme-apps/apps/mobilepay/blocks/mobilepay/index.tsx`, `apps/cookiescanner/*.tsx`, the CMS's demo app
`demo/src/apps/inline-example/…/tickets/index.tsx`) keep working through the `@phosphor-icons/react` alias to
`@morphemecms/cms/icons` until their contract window ends. In the next version of each, the import becomes the CMS's own
(`@morphemecms/cms/icons`) or an `Icon` by name. They draw whatever pack the site picked, as now.

### 11. Licences

Phosphor is MIT, Lucide is ISC; both permit redistribution with their notices. Today's `icons/phosphor/LICENSE` and
`icons/lucide/LICENSE` plus `LICENSE-material-design-icons` (the logos Lucide lacks) and `LICENSE-phosphor` (Lucide's `x-logo`)
move into each pack's folder, as `includes` already records. The store page and Settings › Licenses show them
(`iconPackLicenses` in `site/theme.mjs`, `lib/licenses.mjs`): a store pack is a third-party work of kind `icons`
(`LICENSE_KINDS`), listed under the site's licences once installed. Rule for any pack: an **open licence** (SPDX id, text in
the folder) and one file per `includes` set; the store refuses a pack without them (`packProblems` ported). The CMS keeps
Material Symbols' Apache-2.0 notice. `NOTICE`-style attribution in a site's footer is not required by MIT or ISC and is not added.

### 12. The store side (`morpheme-appstore`) — to verify

Not read (see the status box). Proposed, from the CMS's code and the 2026-11-11 section spec:

- **Data model.** `items.kind` gets a third value, `icons`; ids `icons_<16 hex>`; a D1 migration for the CHECK constraint if
  there is one (the sections spec says `role` needed none; `kind` may). The item's releases hold the file list with blob ids
  as an app's and a theme's do. Tarballs in KV as for the other kinds.
- **Registry.** `problemOf` in `src/registry.js` (named by the sections spec) gets a branch for `icons`: the manifest has
  **only `peerDependencies`, and for a pack none**, no install scripts, no `bin`; every file is an `.svg`, `pack.json`,
  `LICENSE*` or `store.json`; each SVG passes `svgProblems`; every name in `lib/iconNames.mjs` has a file; the licence is
  present. **A version is forever:** a released version is never changed or removed, a fix is the next version, exactly as an
  app's.
- **Publish.** Same flow as `release-store.mjs`: look the item up by handle, make it if missing, release under its
  permanent id. A pack's handle is its folder name in `morpheme-apps/icon-packs/<handle>/`; the publisher is `morpheme`.
- **Catalog.** The entry carries `kind: 'icons'`, name, author, license, description, `style`, `samples` (five inline SVGs,
  not URLs, so the editor draws them without a second request), `api` and version. The editor reads it through the existing
  storefront endpoints (`env.store`), adding `icons` to the list call and to the files call.
- **Categories.** The 12 topic categories do not apply to packs; the filter is `Style` and `Status`. An unknown category is
  read leniently today (`categoryOf`), so no change there.
- **Tokens, keys and licences** are as for apps; a pack is first-party until the store opens to others.

### 13. Releasing the packs

- **Where:** `morpheme-apps/icon-packs/phosphor/` and `icon-packs/lucide/`, beside `apps/` and `themes/`, each a folder as the
  site has it in `src/icon-packs/<id>/`. They are first-party (publisher `morpheme`) and released with
  `npm run release -- phosphor`, which gets an `iconPackIds(root)` beside `appIds` and `themeIds`, an `iconPackEntry`
  beside `appEntry` and `themeEntry`, and a copy step into `site/src/icon-packs/` for the checks.
- **Sources:** the pack's files are written by a script in `morpheme-apps` (`scripts/icon-pack-sources.mjs`, today's
  `scripts/icon-packs.mjs` and `PACK_SOURCES` moved out of the CMS) from the npm package at a pinned version, by the same name
  map (`MATERIAL_DESIGN_ICONS`, `PHOSPHOR_FILL_ICONS`, today's `site/icons.mjs`). That map moves out of the CMS with it; the CMS
  keeps only `lib/iconNames.mjs` and Material Symbols.
- **Versions:** a pack's version is the set's version plus our own patch (`2.1.1` of Phosphor is `1.0.0`; a new name in the
  list is `1.1.0`, a corrected glyph is `1.0.1`). A new CMS version that adds a name releases each pack's next minor in the
  same hour; the pack's `peers` say nothing about it, because the editor reads the name, not the version.
- **Release notes** of a pack follow the rule of apps (`releaseNotes` per version, English and Danish).
- **Alternative:** a separate `morpheme-icons` repository. Rejected: the release tooling, the sandbox check and the CI are all
  in `morpheme-apps` already, and two packs do not justify a fourth repository (decision 6).

### 14. Contracts and versions

| Contract | Change |
| -------- | ------ |
| `ICON_PACK_API` (new, in `lib/contracts.mjs`) | `1`. A pack in the store says which it is written to in its `pack.json` `api`; the editor offers only those it can read. Raised when a pack written to the one before no longer works (a changed name rule or file rule). |
| `THEME_API` | **Unchanged** (4). `icons` keeps its meaning; `iconPack` is an optional key, so a theme without it is unchanged. If the owner wants a strict check that a store pack named by a theme be declared, it is a minor addition, not a break. |
| `APP_API` | **Unchanged** (5). An app's `icon` is a name from the frozen list. |
| `@morphemecms/cms` | **A minor, 0.18.0**, `minor` allowed on the `0.18` branch, never `major`. The seeds' removal (0.19) is a minor too. |
| The catalog | Gets `kind: 'icons'`. An editor older than 0.18 does not know the kind and **must ignore it**; that needs the store to keep serving the same catalog shape. **To verify** with the store: a catalog entry of an unknown kind must not break an older editor's parse (it is read leniently, `store.ts`: `isText` filters). |

### 15. The checks that guard it

| Check | Becomes |
| ----- | ------- |
| `check:phosphor` (`scripts/check-phosphor.mjs`) | During the codemod it keeps counting only downward. When the last import is gone (batch A4) it **becomes a ban**: any `@phosphor-icons/*` import, in code or in `package.json`, fails; `scripts/phosphor-allowlist.json` is deleted. The apps' alias window is checked separately by the theme and app checks. |
| `site/phosphorPack.test.mjs` | The Phosphor glyph test moves to `morpheme-apps` (each pack's own check). In the CMS it is replaced by: the package has **only** Material Symbols under `icons/` (and the seeds until 0.19), and no `@phosphor-icons/*` in the built editor bundle. |
| `check:screens` (`scripts/editor-screens.mjs`) | Keeps the rule "no Phosphor glyph (viewBox `0 0 256 256`) while Material Symbols is the pack" and adds: (1) **the Icons area**: it opens on a phone and a computer with no console error, the four segments do not wrap at 360 px in English and Danish, the pack cards show their five samples, and the install dialog has two actions; (2) a case with a **store pack installed** (the demo gets a small test pack in a fixture, not Phosphor): picking it draws its glyphs and **no Material glyph** for a name it covers; (3) a pack missing one name draws that name from Material with `data-icon-fallback`. The 4420-4430 block, which lists three system packs by name, lists Material Symbols alone and the Icons area's cards. |
| `check:content` | `packProblems` runs on `src/icon-packs/*` (installed packs) as it does on a theme's own. A chosen pack that is not installed is a **warning** (section 8). |
| New `check:icon-names` | `lib/iconNames.mjs` equals what the code draws (the old `usedIcons()` scan, kept as a test only): a name drawn but not listed fails; a listed name no pack file and no code uses is a warning. |
| Store check in `morpheme-appstore` | `problemOf` for `icons` (section 12), run at release. Same rules as `packProblems`, so a pack that passes in the store passes in a site. |
| `morpheme-apps` `npm run check` | Each pack in `icon-packs/` against the CMS's `packProblems`, the glyph test above, and the name list. |
| `check:starter`, `check:demo` | Unchanged; the demo and starter use Material Symbols and install no pack, which proves a site with no pack builds. A second demo build with the test pack installed is added to `check:demo` only if the build time allows (open: batch A5). |

## Plan: small pull requests

Branches: the CMS work lands in `0.18` (spec `2026-11-11-intuitive-editor-design.md`), `minor` allowed, never `major`. Each batch is
one pull request unless it says otherwise; the PM merges. The order is fixed by what depends on what.

**CMS (`morpheme-cms`, into `0.18`)**

| # | PR | What | Needs |
| - | -- | ---- | ----- |
| A1 | Icon names list | `lib/iconNames.mjs` from today's `usedIcons()`; `site/icons.mjs` reads it; `check:icon-names`. No behaviour change, no pack moves. | nothing |
| A2 | `ICON_PACK_API` and the store kind in the editor | `lib/contracts.mjs`, `src/store.ts` reads `kind: 'icons'` entries (types, `StoreIconPack`, `ShownIconPack`), `docs/app-contract.md` or a new `docs/icon-pack-contract.md`, `docs/store-ids.md`, tests. No UI yet. | A1; the store's catalog shape (B1) |
| A3 | `@morphemecms/cms/icons` | The CMS-owned React icon module with Phosphor's component names and props (`IconBase`-style), drawn by the pack in use; `themePlugin` aliases `@phosphor-icons/react` to it; the codemod rewrites the CMS's 326 imports in two or three sub-PRs by folder (`src/`, `theme/` and `defaults/`, `lib/`, `demo/` and `starter/`), the allowlist falling each time. | A1 |
| A4 | Phosphor out of `icon.tsx` and `site/` | Remove the Phosphor set from `icon.tsx` and `materialIcon.mjs`, `virtual:all-icons*`, `phosphorOnly`, the `regular`/`fills` globs; `usedIcons()` no longer scans for Phosphor; the picker keeps Material only; `check:phosphor` becomes a ban; the allowlist file is deleted. Keeps `@phosphor-icons/react` only as the alias for apps/themes (no dependency in `package.json` unless the alias needs it: **open**, see A3). | A3 |
| A5 | Install, update, uninstall of a pack | `src/icon-packs/<id>/` handling in `site/iconPacks.mjs`/`site/icons.mjs` (`packFolder`, `SYSTEM_PACKS = ['material-symbols']`, handle resolution), `useThemeActions`-style `useIconPackActions`, `iconPackChanges`, `canUninstall`. The build's missing-pack warning (section 8). Tests with a fixture pack. | A2 |
| A6 | The Icons area screens | `icons` section in `sectionChoice.mjs` and `StoreSections.tsx`; the Icons list, a pack's page, the dialogs, Appearance › Icon packs (installed packs, "More icon packs in the store"); `en-US`/`da-DK` texts; `check:screens` cases; a release note (a paragraph, English and Danish, with the `release-notes` skill). | A5, B2 |
| A7 | The migration and the seeds | `icons/seeds/{phosphor,lucide}`, `lib/migrate-icon-packs.mjs`, `scripts/migrate.mjs` step, the editor's first-open commit, tests on a site with `phosphor`, `lucide`, a theme's `icons`, a theme's own pack and no choice; a release note line. | A5, B3 |
| A8 | Theme `iconPack` key | `themeProblems`, `ThemeStore.tsx` "Needs the pack" and the offer to install it with the theme; `docs/` rule text in the theme contract. | A5, B3 |
| A9 | Remove the system Phosphor and Lucide | Delete `icons/phosphor/`, `icons/lucide/`, `scripts/icon-packs.mjs` and the `PACK_SOURCES`/map code for them (moved to `morpheme-apps`, C1), the `@phosphor-icons/*` dependencies, and the Phosphor entries of `phosphorPack.test.mjs`. **Done when `morpheme-apps` has released both packs (C2) and A7 is in.** | A7, C2 |
| A10 | (0.19) Remove the seeds | Delete `icons/seeds/` and the migration's seed step; keep the warning. | 0.18 released |

**Store (`morpheme-appstore`) — to verify when its code is read**

| # | PR | What |
| - | -- | ---- |
| B1 | Kind `icons` | Migration (if the kind is constrained), the registry's `problemOf` branch, the release endpoint accepting `kind: 'icons'` and `icons_<hex>` ids, tests. |
| B2 | Catalog and files | The catalog lists `icons` entries with `samples`; the files call serves a pack's files; the storefront endpoints the editor uses. |
| B3 | Handle lookup | The editor and the build resolve a handle to an item (a theme's `iconPack`), if the store does not already look handles up. |

**Packs (`morpheme-apps`)**

| # | PR | What |
| - | -- | ---- |
| C1 | `icon-packs/` and the release tooling | `iconPackIds`, `iconPackEntry`, `scripts/icon-pack-sources.mjs` (moved from the CMS), `npm run release` and `npm run check` for packs, the glyph test, `CLAUDE.md` map. Phosphor and Lucide folders written. |
| C2 | Release `phosphor` 1.0.0 and `lucide` 1.0.0 | After B1 and B2 are live. The owner holds the token (`MORPHEME_OWNER_TOKEN`); a live store release is the PM's decision per `CLAUDE.md`, not an agent's. |
| C3 | Venus names the pack | Venus 1.4.0: `iconPack: { handle: 'phosphor' }`, its highlight text kept, its icon imports moved to `@morphemecms/cms/icons`. | A8, C2 |
| C4 | Apps' imports (as each is next released) | `mobilepay`, `cookiescanner`: `@phosphor-icons/react` becomes `@morphemecms/cms/icons`. Not released for this alone. | A3 |

**Website / staging**

| # | PR | What |
| - | -- | ---- |
| D1 | `morpheme-staging` | Install the `next` build with a Phosphor-picking site and a Lucide-picking site (the migration's two real cases), and a site with none; check each builds and the editor opens. Staging is where the migration is proven before a release. |
| D2 | `morpheme-website` | Its `CLAUDE.md` rule text for themes ("Hvad et tema må") gets `iconPack`; the website's store docs list the Icons area. Only if that repo's docs name icon packs (**to verify**). |

**Order that keeps every merge safe:** A1 → (A2, A3 in parallel) → A4, A5 → B1/B2 (store, parallel from A2) → A6, A7, A8 → C1, C2 →
A9 → D1 → release → A10 in 0.19. Nothing removes a pack before the store serves it and the migration exists; nothing
makes a missing pack an error.

## Open decisions for the owner

The owner answers one at a time, most important first. Each has a recommendation.

1. **What are the icon names once Phosphor is out?** Content, apps, the catalog and the theme contract store Phosphor's names
   (`map-pin`, `certificate`). *Recommendation:* keep today's names (about 205) as a frozen list the CMS owns
   (`lib/iconNames.mjs`): no content migration, no app republished, packs map each name to a file. *Alternative:* switch the
   vocabulary to Material's names; that is a content migration and a new contract for every app and theme.
2. **How do sites that picked Phosphor or Lucide keep working?** *Recommendation:* 0.18 ships both packs once as migration seeds;
   `morpheme migrate` and the editor's first open install the picked pack into `src/icon-packs/` as its own commit, at the
   version the store will offer to update; the seeds are removed in 0.19; a missing pack is a build warning with Material
   Symbols, never an error. *Alternative:* a missing pack stops the build (as today), and the owner installs from the store.
3. **Must a pack cover every icon name?** *Recommendation:* yes for the store (it refuses a pack with gaps); at runtime a name
   a pack lacks (a new name since its version) falls back to Material Symbols with a warning. *Alternative:* allow partial packs.
4. **Is a pack its own store kind, and how does a theme ask for one?** *Recommendation:* a new kind `icons` (id `icons_<hex>`),
   not an app role; a theme names one with `iconPack` in `theme.json` and installing the theme offers the pack. *Alternative:*
   a theme bundles the pack in its own `icon-packs/` (today's way), which duplicates the files per theme.
5. **Can a pack in use be uninstalled?** *Recommendation:* no; refused while in use, chosen, or named by an installed theme.
6. **Who publishes, and where?** *Recommendation:* Phosphor (MIT) and Lucide (ISC) as first-party packs in
   `morpheme-apps/icon-packs/`, publisher `morpheme`; third-party packs only with an open licence once the store opens to
   others. *Alternative:* a new repository `morpheme-icons`.
7. **Contracts.** *Recommendation:* new `ICON_PACK_API = 1`; `THEME_API` and `APP_API` unchanged (the new key is optional);
   `@morphemecms/cms` 0.18.0 is a minor.
8. **May an installed pack add names of its own to the icon picker?** *Recommendation:* not in 0.18; the picker is Material
   Symbols' full set plus the frozen list. A pack's extra names come later with a `pack.json` `icons` list, if wanted.
9. **How long do apps and themes keep importing `@phosphor-icons/react`?** *Recommendation:* the alias to
   `@morphemecms/cms/icons` stays for the contract-4/5 window (`docs/app-contract.md`), then the dependency and the alias go.
10. **Segmented button or connected button group for the store's sections?** M3 says "Segmented buttons are no longer
    recommended in the Material 3 expressive update… use the connected button group instead". *Recommendation:* add Icons
    as a fourth segment now (inside the 2-5 limit) and decide the move to the connected button group for the whole store in a
    separate change, with the other expressive updates.
11. **The seeds' lifetime.** *Recommendation:* one minor (0.19). *Alternative:* keep them until 1.0 for sites that update rarely.
12. **Store side verified.** The appstore's data model, registry rules and catalog shape in section 12 are written from the CMS
    side. *Recommendation:* the PM attaches `morpheme-appstore` to the session that writes the plan for B1 to B3, which reads
    the code and the 2026-11-04 specs first and corrects section 12.
