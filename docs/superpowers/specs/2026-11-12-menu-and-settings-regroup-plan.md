# Menu and Settings regroup: plan (batch 17)

Status: **plan only, nothing built, the owner has decided nothing yet.** Source: batch 17 and open questions 3 and 4 of
`2026-11-11-intuitive-editor-design.md`. Written against `0.19` at `13ff472` (0.16 is released). Screens were opened on the
demo build (`npm run build`, then the built editor in Chromium) at 375 px and 1280 px; the shots are in
`menu-regroup-screens/` (webp, `*-m` phone, `*-d` computer).

## 1. What the spec means, checked in code

- **"Developer under Advanced" is already out of date.** `Advanced` was renamed to `Developer` in 0.14 (`movedRoutes.mjs`:
  `advanced` → `developer/caching`). Today `Developer` is a row of Settings with two rows: `Caching and builds` and `Parts`.
  There is no `Advanced` row to put it under. The plan therefore **leaves Developer where it is** (Q3 asks if it should go
  further).
- **Appearance** is a row of Settings today (the cog), with nine rows of its own. It is not in the main menu.
- **Logo and icon** is the first row of `Business`, but `colors.ts` already tells the owner "Edit the logo and icon under
  Appearance › Logo and icon" (stale since 0.13; the move makes it true again).
- All routes are `#` addresses read in the browser: the Worker never sees them. Old editor links are kept alive by
  `src/movedRoutes.mjs` (`MOVED`, `RENAMED`), not by `worker/movedAddresses.js` (that one is for the site's public
  addresses, as for `/ny/` → `/new/` in 0.15 with `lib/previewAddress.mjs`).

## 2. Current structure

Shots: `start-m/d`, `menu-first-m`, `menu-content-m/d`, `menu-business-m`, `menu-blocks-m`, `menu-apps-m`,
`settings-m/d`, `appearance-m/d`, `developer-m/d`, `developer-parts-m`, `developer-caching-m`, `company-m`,
`company-logo-m/d`, `lists-m/d`, `blocks-m/d`, `block-settings-m`, `files-m/d`, `settings-appstore-m`.

```
Main menu (defaults/editor.ts `groups`; rail and drawer; Settings is the cog at the bottom, `settings`)
├─ Dashboard                       #                     common: siteName
├─ Content        (da Indhold)     list/*                editor.ts 'Content'
│   ├─ Pages, Blog posts, Promotion, Tags (collections)
│   ├─ Dynamic lists               #lists                common.parts.lists    / da Dynamiske lister (also apps.lists)
│   ├─ Files                       #files                common.parts.media    / da Filer      (parts.media too)
│   ├─ Internal links              #seo/internal-links
│   └─ Redirects ▾  All / Not found  #seo/redirects/*
├─ Business       (da Virksomheden) #company             common.parts.company  editor.ts 'Business'
│   ├─ Logo and icon               #company/logo         common.parts.brand    / da Logo og ikon
│   └─ Contact, Social media, Payment   #company/<id>    companyParts
├─ Blocks         (da Blokke)
│   ├─ Block templates             #blocks, #blocks/<id> common.parts.blocks   / da Blokskabeloner (defaults/blockTexts.ts, da blockTexts.ts)
│   └─ Block settings              #block-settings       common.parts.blockSettings / da Blokindstillinger
└─ Apps
    └─ Appstore, installed apps    #settings/appstore, #apps/<id>

Settings (cog, #settings, A–Z)     common.parts.settings / da Indstillinger
├─ Appearance     (da Udseende)    #appearance           common.parts.appearance
│   Theme store, Header, Footer, Themes, Icon packs, Motion, Side column, Colors, Default pages
│   #appearance/{theme-store,header,footer,themes,icon-packs,motion,side-column,colors,default-pages}
├─ Assistants                      #assistants
├─ Developer      (da Udvikler)    #developer            common.parts.developer
│   ├─ Caching and builds          #developer/caching    common.parts.caching  / da Caching og builds
│   └─ Parts                       #developer/parts/*    common.parts.editorParts / da Dele
├─ Licenses, Morpheme, Privacy
```

Where each name shows up today (all read from `src/i18n/en-US|da-DK/common.ts` unless noted):

| Name | Menu | Screen title | Back link | Other places |
| :--- | :--- | :--- | :--- | :--- |
| Appearance | Settings row | `Theme` (Library.tsx) | `backFrom('appearance')` → Settings; children go `#appearance` | `placeOf` ("Settings › Appearance › Default pages", `site.ts standardPageAt`, `EntryForm.tsx`), Colors, FooterSettings, SideColumn, HeaderSettings back links, `forms.ts` (link to Side column), `colors.ts` hint, 0.13/0.14 release notes, `editor-screens.mjs` |
| Developer | Settings row | `Developer` | → Settings | `apps.ts developer` = an app's maker (a different meaning), `Advanced.tsx`, `Parts.tsx`, `BlockParts.tsx`, `Tokens.tsx` back links |
| Logo and icon | Business, first | `BrandForm.tsx` | → Business | `Library.tsx Company` first row, `colors.ts` hint, `movedRoutes.mjs`, 0.13.0 note |
| Dynamic lists | Content | `Dynamic lists` (`Lists()`) | → start | `Library.tsx` 1395 (back from list screens), `apps.ts lists`, 0.14.0 note ("Lists in the menu is now Dynamic lists") |
| Block templates | Blocks | `Block templates` (`Blocks()`) | → start | `defaults/blockTexts.ts` back link, da-DK `blockTexts.ts` key, `site.ts` 148 |
| Files | Content | `Files` (`Media()`) | → start | `deleted/files`, picker texts (`media.pick`, "Upload a new picture"), "Get started › Add a picture" |
| Business | section | `Business` (`Company()`) | → start | `CompanyForm.tsx`, `BrandForm.tsx`, `AppList.tsx`, `collections.ts` ("CVR number") |

Findings from the screens:

1. **Phone, Settings** (`settings-m`): six rows, no hint of what is inside; Appearance is the biggest and the one
   an owner looks for ("how my site looks") but it is behind the cog.
2. **Business** (`company-m`, `company-logo-m`): Logo and icon is a picture upload, not a fact about the company; it is
   the only row there that is about looks.
3. **Blocks** (`menu-blocks-m`, `blocks-m`): the section `Blocks` has the row `Block templates` (the texts every copy of a
   block has) next to `Block settings` (which blocks can be inserted). "Templates" also means page templates in
   `forms.ts` (the side-panel templates), a second meaning.
4. **Dynamic lists** (`lists-m`): on the demo it is a hub with one row (`Testimonials`); "Dynamic" is the owner's own word
   from 0.14, and batch 16 builds it into block names (`Dynamic` in the block name, `Rows from`).
5. **Files** (`files-m`, `files-d`): the screen is pictures, PDFs, videos and zip files with search, sort, filter and a
   date filter. The title says only "Files"; the picker flows say "picture".
6. **Developer** (`developer-m`): two rows; `Caching and builds` holds `Faster editor` and the build switches, which an
   owner with R2 meets, so it is not purely developer work.

## 3. Proposed structure

One rule for the menu: *what the site says* (Content, Business), *how it looks* (Appearance), *what it can do* (Blocks,
Apps). Settings is what is left: the account's tools, not the site's.

```
Main menu
├─ Dashboard
├─ Content          Pages, Blog posts, Dynamic lists, Promotion, Tags, Pictures and files, Internal links, Redirects ▾
├─ Business         Contact, Social media, Payment
├─ Appearance  NEW  Theme store, Header, Footer, Logo and icon, Themes, Icon packs, Motion, Side column, Colors, Default pages
├─ Blocks           Block texts, Block settings
└─ Apps             Appstore, installed apps
Settings (cog)      Assistants, Developer, Licenses, Morpheme, Privacy      (five rows, A–Z)
```

How it is built (the same way `Business` and `Apps` already are):

- `groups` gets `{ id: 'appearance', title: 'Appearance', ids: ['appearance'] }` after `company`; `HOISTED` in `lib/menu.mjs`
  gets `'appearance'` so the screen's rows are the section's rows. `childrenOf('appearance')` returns the same list as
  `Theme()` (one source, so the menu and the screen cannot drift).
- `settings` loses `'appearance'`. The route `#appearance` and every `#appearance/*` stay.
- `Logo and icon` is the row `logo` of `Theme()` (after Footer, so header, footer and logo, the site's identity, sit
  together). Business loses its `logo` row.
- The back link of every `#appearance/*` screen changes from `Settings` to `Appearance` (already so for the children;
  `#appearance` itself goes back to the start screen, like `#company`).
- The cog is no longer marked on `#appearance/*`; the section is.
- The rail (collapsed navigation) gets one more destination: five sections plus Dashboard and the cog. Check that the
  phone drawer's first level and the rail still fit at 375 × 667.
- Developer, Assistants, Licenses, Morpheme, Privacy: unchanged.

## 4. Proposed renames

Every rename keeps the ids, the routes and the `common.parts.*` keys (only the values change), so no code outside the
i18n files and the three strings below needs to move. Danish is changed in the same pull request (`check:content` and
`check:language` stop otherwise).

| # | Old en-US | New en-US | Old da-DK | New da-DK | Why | M3 word-choice check |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `Block templates` | `Block texts` | `Blokskabeloner` | `Bloktekster` | The screen holds the texts every copy of a block has; "template" is a page template elsewhere in the editor (`forms.ts`) and is developer language. | Short, concrete noun phrase, says what the owner edits. Pairs with `Block settings`. Passes. |
| 2 | `Files` | `Pictures and files` (alternative: `Media`) | `Filer` | `Billeder og filer` (alt. `Medier`) | The screen is mostly pictures, and every picker says "picture"; `Files` hides that. Matches finding 7 of the spec. | Plain nouns, universal. "Pictures and files" is the clearer of the two for a non-technical owner; `Media` is shorter but a term of the trade. Both pass; `and` is allowed in a label that names two things. |
| 3 | `Dynamic lists` | **no change** (alternative: `Lists`) | `Dynamiske lister` | no change (alt. `Lister`) | The owner chose it in 0.14, one release ago; batch 16 uses `Dynamic` in block names, so renaming twice would churn the menu, notes and blocks. Revisit when batch 16 lands. | `Dynamic` is a developer word, but it is the owner's; `Lists` alone clashes with Pages and Blog posts (also lists) and with the List blocks. Keep until the owner decides (Q2). |
| 4 | `Business` | **no change** | `Virksomheden` | `Virksomhed` | English is fine: short, universal. In Danish only, the definite form `Virksomheden` is the odd one out among the labels (`Indhold`, `Blokke`, `Udseende`); the indefinite matches. | Danish only: labels are indefinite nouns. Passes after the change. |
| 5 | `Appearance` / `Developer` / `Logo and icon` | no change | `Udseende` / `Udvikler` / `Logo og ikon` | no change | They only move. | — |

Not proposed: renaming `Caching and builds` (not part of this batch), and renaming `CVR number` (the spec's finding 4 already
covers it in its own batch).

Only one text needs a new sentence: `colors.ts` already says "under Appearance › Logo and icon" (true again, keep) and
`common.ts` comments that say "under Business" (code comments only).

## 5. Routes that change, and old links

| Old | New | How the old one keeps working |
| :--- | :--- | :--- |
| `#company/logo` | `#appearance/logo` | `MOVED['company/logo'] = 'appearance/logo'` in `src/movedRoutes.mjs`. |
| `#appearance/logo` (0.12 to 0.13, now `company/logo`) | `#appearance/logo` | Remove the entry `'appearance/logo': 'company/logo'`, or the two entries would send a link round in a circle. |
| `#virksomheden/logo`, `#tema/logo`, `#udseende/logo` (older, Danish) | `#appearance/logo` | Retarget each `MOVED` value from `company/logo` to `appearance/logo` (`movedRoute` is one step, so every old key must point at the final address). |

Everything else keeps its address: `#appearance`, `#appearance/*`, `#developer/*`, `#files`, `#lists`, `#blocks`,
`#block-settings`, `#company`, `#company/<part>`, `#settings`, `#settings/appstore`. The renames change labels, not routes
(the routes are ids, English already, and no release note or doc links to them by label). I do **not** recommend
renaming `#files` to `#media` or `#blocks` to `#block-texts`: it buys nothing and every site's bookmarks and the
`list`/`deleted/files` addresses would need entries.

`worker/movedAddresses.js` and `lib/previewAddress.mjs` are not touched: no public site address changes, so no Worker
redirect and no `scripts/retarget-links.mjs` entry. A test pair is added to `src/movedRoutes.test.mjs` for each moved key
(and one that no key points at another key).

Sites that copy `defaults/editor.ts` into `src/site/editor.ts` keep the old `groups` and `settings`: they would show
Appearance in the cog and, if they also list `appearance` in `groups`, twice. See the risk list.

## 6. Files that change (when built)

- `defaults/editor.ts`: `groups` (Appearance section, Business `ids`), `settings`, the comments; `icons` (reuse `appearance`).
- `lib/menu.mjs`: `HOISTED`, `currentPlace` (the `header` special case goes: Header is a row of a section now), `backTarget`; `lib/menu.test.mjs`.
- `src/menuChildren.ts`: `childrenOf('appearance')`; `src/MainMenu.tsx`: the icons, the section row.
- `src/Library.tsx`: `Theme()` (the `logo` row), `Company()` (no logo row), `partOf` (`logo`), `Theme` back link, the comments at 214 and 242.
- `src/site.ts`: `appearance` back links; `standardPageAt` and `placeOf` wording ("Appearance › Default pages", no "Settings ›"); `backFrom` comment.
- `src/App.tsx`: `route === 'company/logo'` → `appearance/logo`, the header comment's routes.
- `src/BrandForm.tsx`: back link to Appearance and the comment.
- `src/movedRoutes.mjs`, `src/movedRoutes.test.mjs`.
- `src/i18n/en-US/common.ts`, `src/i18n/da-DK/common.ts` (`blocks`, `media`), `src/i18n/*/parts.ts` (`media`), `defaults/blockTexts.ts` and `defaults/i18n/da-DK/blockTexts.ts` (`Block templates` key and back link), `defaults/i18n/da-DK/editor.ts` (`Business`).
- Release note: one card, `release-notes/i18n/{en-US,da-DK}/pending/menu-regroup.json` (Appearance is in the menu; Logo and icon moved; the renamed rows), written with the `release-notes` skill. Not now.
- `scripts/editor-screens.mjs`: Settings lists five rows (not six), the drawer's first level has five sections, the cog is marked on Settings' screens only, `#appearance/*` marks Appearance.
- `docs/superpowers/plans/2026-11-07-settings-cog.md`: add a note that Appearance left the cog.
- A changeset (`minor`: it moves what an owner sees; into `0.19` that is allowed) and the release note above.

Not changed: `worker/*`, `lib/previewAddress.mjs`, themes, blocks, apps.

## 7. Risks

1. **Sites with their own `src/site/editor.ts`.** `groups` and `settings` are a site's own files when it has them; an old copy still lists `appearance` in `settings`. `currentPlace` must give the section when both lists name it, and `check:site-types` must still pass for such a site. Test with a fixture.
2. **Redirect loop** between `appearance/logo` and `company/logo` if the old entry is left (section 5).
3. **Rail and drawer space**: a sixth destination on a phone; check 375 × 667 (the screen check runs at 375 and 1280).
4. **One list, two places**: if `Theme()` and `childrenOf('appearance')` are not one source, a new Appearance row (an app's place, a theme's) shows in one and not the other. `AppPlaces` and `appPartsIn` rows must be checked.
5. **Search and "the way there" strings** (`placeOf`) say "Settings › Appearance › …": they must say "Appearance › …" or owners look under the cog.
6. **Release notes and docs** of 0.13 and 0.14 name the old places; notes are history and stay, but the new note must say where things are now.
7. **`Developer` has two meanings** (Settings › Developer, and an app's `Developer: name` row). Left alone; no search shows both today.
8. **Danish**: `Bloktekster`, `Billeder og filer` and `Virksomhed` are all new and need the owner's eye (Danish wording the owner knows better than the plan does).
9. **Overlap with batches 15 and 16** (`Hide on the page`, `Files`/`Pictures` in picker texts; `Dynamic lists`, app lists) and with 0.16 Assistants: the regroup should be one pull request merged between them, or the row names change twice.

## 8. Questions for the owner

1. **Appearance into the main menu, between Business and Blocks, with Logo and icon moved there (Q3).** Recommended: yes, as in section 3. The cog keeps five rows. Alternative: leave the menu and only move Logo and icon into Appearance.
2. **`Dynamic lists`: keep it, or `Lists`?** Recommended: keep until batch 16 is built; you chose it in 0.14 and the blocks will carry the word.
3. **Developer.** It is already a Settings row since 0.14 (there is no `Advanced`). Recommended: leave it. Alternative: hide it behind one collapsed row on Settings if you want the cog cleaner for owners; that costs one more tap for you.
4. **`Files`: `Pictures and files`, or `Media`?** Recommended: `Pictures and files` (da `Billeder og filer`). `Media` is shorter.
5. **`Block templates` → `Block texts`, and `Virksomheden` → `Virksomhed` in Danish.** Recommended: yes to both; `Business` stays.

On a yes to 1, 4 and 5 the build is one medium pull request (one session), with the release note, merged after batch 16 part A.
