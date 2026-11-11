# Menu and Settings regroup: plan (batch 17)

Status: **plan only, nothing built. Revised 11 November after the owner's answers to the five questions and three later decisions (section 8 lists them and the new questions).** Source: batch 17 and open questions 3 and 4 of
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

1. **Phone, Settings** (`settings-m`): six rows, no hint of what is inside; Appearance is the biggest, behind the cog (the owner keeps it there).
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

## 3. Proposed structure (after the owner's decisions)

The owner's decisions: Appearance stays on the Settings page; the main-menu section `Blocks` becomes `Globals` (Header,
Footer, Block templates); `Block settings` moves to Settings; `Licenses` leaves Settings (the footer has it); `Colors`
moves to Business (the company's brand colours); `Side column` moves to Globals with Header and Footer; Logo and icon stays in Business. No other renames. **Logo and icon stays in Business, next to Colors (brand
together; the owner's decision, which matches this plan's recommendation).** That reverses the first draft's assumption
and needs no route change for it.

```
Main menu
├─ Dashboard
├─ Content      Pages, Blog posts, Dynamic lists, Promotion, Tags, Files, Internal links, Redirects ▾
├─ Business     Logo and icon, Colors, Contact, Social media, Payment        (Colors comes from Appearance)
├─ Globals      Header, Footer, Side column, Block templates                 (was Blocks; Header, Footer and Side column come from Appearance)
└─ Apps         Appstore, installed apps
Settings (cog)  Appearance, Assistants, Block settings, Developer, Morpheme, Privacy     (six rows, A–Z; Licenses leaves)
  └─ Appearance Theme store, Themes, Icon packs, Motion, Default pages                 (Header, Footer, Side column, Colors leave)
```

Why Logo and icon stays beside Colors: they are the brand (the mark, the icon and the colours an owner picks to match them);
`colors.ts` already sends the owner from the colours to the logo ("Edit the logo and icon under …"), and an owner who
changes one changes the other. Appearance then holds how the site is built (themes, icons, motion, the standard pages);
Globals holds what every page shares (header, footer, side column, block templates).

How it is built:

- `groups`: the section `{ id: 'blocks', title: 'Blocks', ids: ['blocks', 'block-settings'] }` becomes
  `{ id: 'global', title: 'Globals', ids: ['header', 'footer', 'side-column', 'blocks'] }`. The id changes from `blocks` to `global`
  because `blocks` is also the id of the part `Block templates` (route `#blocks`); the icon `global` already exists.
  Business becomes `ids: ['logo', 'colors', 'company']` (`company` stays hoisted, its parts come after).
- `settings` becomes `['appearance', 'assistants', 'block-settings', 'developer', 'morpheme', 'privacy']`: `block-settings`
  joins, `licenses` leaves. `Block settings` keeps its id and route.
- `Licenses` leaves the Settings page: the footer on every screen already links to it (`FOOTER_LINKS`, `lib/footerLinks.mjs`:
  `licenses` → `#licenses`). `#licenses`, `#licenses/<id>` and the screen stay, and so do the edition photos' credits
  (`#licenses/editions/<line>`, linked from `UpdatesNotice.tsx`). It must not stay in `settings`.
- `Privacy` stays: the footer's `Privacy policy` is Morpheme's own policy (external, getmorpheme.com); the Settings row is the
  site's own cookie banner, privacy pages and consents (`#privacy/*`). Different screens.
- `Theme()` (Appearance) loses the `header`, `footer`, `side-column` and `colors` rows (and the colour swatches that trail the Colors
  row, `ThemeColors`); `Company()` gets `colors` second, with the swatches. `partOf` maps `colors` to `#company/colors`.
- **Routes.** `Block settings` (`#block-settings`) and `Block templates` (`#blocks`) keep their routes. `Side column` moves
  (owner's decision) to `#global/side-column`; recommended: Header and Footer move with it, to `#global/header` and
  `#global/footer`, so the three screens of Globals share one prefix and `appearance/*` holds only Appearance's own
  screens (Q3). The menu finds an item by its link (`currentPlace` rule 3, longest href wins), so the highlight does
  not depend on the prefix; the `id === 'header'` special case in `currentPlace` must go either way.
- **Colors moves** from `#appearance/colors` to `#company/colors` (and its fallback page `…/fallback-colors`), see section 5.
- Back links: Header, Footer and Side column go to the start screen (as `#company` does), Block settings to Settings
  (`backFrom`), Colors to Business.
- The rail has the same number of destinations (one renamed section). Settings has six rows, as today (one in, one out).

## 4. Proposed renames

Ids, routes and `common.parts.*` keys stay; only the section's title changes.

| # | Old en-US | New en-US | Old da-DK | New da-DK | Why | M3 word-choice check |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `Blocks` (section) | `Globals` | `Blokke` | `Globale dele` (alternative `På alle sider`) | The section holds what is shared by every page: the header, the footer and the block templates. `Blocks` no longer says that. | **Weak.** `Globals` is a programmer's word; the guide asks for universal words an owner knows. It was the owner's own word before 0.13 and is short, so it stays as decided. Plainer: `On every page` (da `På alle sider`) or `Shared` (da `Fælles`). Danish `Globale dele` keeps the owner's word and adds a plain noun (`dele`, as in Developer › Parts). |
| 2 | `Block templates`, `Files`, `Dynamic lists`, `Business`, `Virksomheden`, `Appearance`, `Developer`, `Logo and icon`, `Colors` | no change | no change | no change | Owner's decision. | `Block templates` keeps "templates" (a template builder comes here later). |

Withdrawn from the first draft: `Block texts`, `Pictures and files`, `Virksomhed`.

## 5. Routes that change, and old links

| Old | New | How the old one keeps working |
| :--- | :--- | :--- |
| `#appearance/colors` | `#company/colors` | New `RENAMED` key `'appearance/colors': 'company/colors'`: the rest of the address is kept, so `#appearance/colors/fallback-colors` goes to `#company/colors/fallback-colors` by the same line. |
| `#appearance/side-column` | `#global/side-column` | New `RENAMED` key `'appearance/side-column': 'global/side-column'`. |
| `#appearance/header`, `#appearance/footer` (if Q3 is yes) | `#global/header`, `#global/footer` | New `RENAMED` keys `'appearance/header'`, `'appearance/footer'`. |
| `#header`, `#src/data/footer.json` (`MOVED` values now `appearance/header`, `appearance/footer`), and `#udseende/sidekolonne` (`RENAMED`, now `appearance/side-column`) | `#global/header`, `#global/footer`, `#global/side-column` | Retarget each value to the final address (`movedRoute` is one step). |
| `#farver`, `#tema/farver`, `#udseende/farver` (older, Danish; `MOVED`/`RENAMED` today point at `appearance/colors`) | `#company/colors` | Retarget each value to `company/colors`. `movedRoute` is one step, it never follows a value into another key, so every old key must point at the final address. |
| `#udseende/farver/reservefarver` (`RENAMED`, now `appearance/colors/fallback-colors`) | `#company/colors/fallback-colors` | Retarget the value. |

No other route changes: `#company/logo` stays (the first draft's move of Logo and icon is dropped, so there are no logo
entries and no loop with `appearance/logo`), and `#block-settings`, `#blocks`, `#blocks/<id>`, `#appearance`,
`#developer/*`, `#files`, `#lists`, `#licenses`, `#settings` and `#settings/appstore` all stay. Loop check: after the
change `company/colors`, `global/header`, `global/footer` and `global/side-column` are no key of `MOVED` or `RENAMED`,
and no value is also a key (a test asserts it). If Q3 is no, only the Side column and Colors lines apply.

`worker/movedAddresses.js`, `lib/previewAddress.mjs` and `scripts/retarget-links.mjs` are not touched: no public site
address changes (as `/ny/` → `/new/` in 0.15 did, which these three handled).

## 6. Files that change (when built)

- `defaults/editor.ts`: `groups` (Globals section; Business `ids` with `colors`), `settings` (add `block-settings`, remove `licenses`), the comments at the top and at `groups`.
- `lib/menu.mjs`: remove the `id === 'header'` special case in `currentPlace`; `lib/menu.test.mjs` (fixtures with `blocks`, `header`, `settings` with `licenses`, the cog test's `appearance/colors`, `appearance/header`, `appearance/footer`).
- `src/Library.tsx`: `Theme()` (no `header`, `footer`, `side-column`, `colors`, no `ThemeColors` row; the Side column detail line moves with it), `Company()` (`colors` row with the swatches, second), `partOf` (`colors` → `#company/colors`, `header`, `footer`, `side-column` → `#global/…`, removed from the Appearance label map; `block-settings` is a Settings row), the comments at 152, 214 and 242; the Settings screen has six rows (Licenses out, Block settings in).
- `src/Colors.tsx`: `FALLBACK_ROUTE` = `company/colors/fallback-colors`, the route in `useFormPages`, the back links (to `#company`, label Business), the header comment.
- `src/App.tsx`: `appearance/colors` → `company/colors` (two places), `appearance/side-column`, `appearance/header` and `appearance/footer` → `global/…`, and the header comment's routes.
- `src/Parts.tsx` (176 and 828): the two links to `appearance/colors` (`editColors`).
- `src/HeaderSettings.tsx`, `src/FooterSettings.tsx`, `src/SideColumn.tsx`, `src/DataForm.tsx` (313 to 315), `src/Library.tsx` (1397): their route and back links, from Appearance to the start screen.
- `src/templateField.ts` (33: `edit: { to: 'appearance/side-column' }`) and `src/i18n/en-US/forms.ts` (197: "the link to Appearance › Side column", also its da-DK line): the link goes to `global/side-column`; the comment in `templateField.ts` (17) and `lib/side-block.mjs` (47) say "Appearance › Side column": now "Globals › Side column".
- `src/BlockSettings.tsx`: back link to Settings. `src/site.ts`: the `backFrom` comment; `placeOf` and `standardPageAt` unchanged (Default pages stays under `Settings › Appearance`).
- `src/movedRoutes.mjs` and `src/movedRoutes.test.mjs`: the new key, the retargeted values, the loop test.
- `defaults/i18n/da-DK/editor.ts`: the key `Blocks` becomes `Globals`, with `Globale dele`.
- `src/i18n/en-US/colors.ts` (hint at line 79, "Edit the logo and icon under Appearance › Logo and icon", stale today, and wrong after the change): "Edit the logo and icon under Business › Logo and icon." and its da-DK line.
- `scripts/editor-screens.mjs`: Settings lists six rows with `block-settings` and without `licenses` (the "moved" list, line 130); the drawer's first level is Dashboard, Content, Business, Globals, Apps; `#global/header` and `#global/side-column` mark Globals and not the cog; `#company/colors` marks Business; `#licenses` opens and marks no cog; the rail check at line 211 (`#appearance/colors`, "the cog must be selected") now expects Business.
- `docs/superpowers/plans/2026-11-07-settings-cog.md`: a note on what left and joined the cog.
- Release note: one card in `release-notes/i18n/{en-US,da-DK}/pending/` (Colors under Business, Header and Footer under Globals, Block settings under Settings, Licenses in the footer), written with the `release-notes` skill. Not now.
- A changeset (`minor`, allowed into `0.19`).

Not changed: `worker/*`, themes, blocks, apps, `lib/footerLinks.mjs`.

## 7. Risks

1. **Sites with their own `src/site/editor.ts`.** `groups` and `settings` are a site's own when it has them: an old copy keeps `Blocks`, Header, Footer and Side column in Appearance, `licenses` in `settings` and no `colors` in Business. The screens must still open (`partOf` knows every id; an unknown section id must not crash), `check:site-types` must pass, and Colors, Side column, Header and Footer must be reachable from somewhere (Appearance's own list no longer has it): decide whether `Theme()` keeps a Colors row for a site whose `groups` lack it. Test with a fixture that has the old `groups`.
2. **Colors and its apps.** An app that changes the pages' colours (`content-colors`) sends the owner to the fallback page and the form pages are tracked by route (`useFormPages` in `Colors.tsx`): the old route string left in one place makes the fallback page lose its unsaved changes. Grep for both routes; test the fallback flow.
3. **"The way there" strings and hints** that say Appearance: `colors.ts` line 79 (above); the text in `Parts.tsx` and `forms.ts` that links to Colors or Side column ; the 0.13 and 0.14 notes name old places (history, stay). `placeOf('header')`, `placeOf('side-column')` give `Globals`, so any string built from them reads `Globals › Header`.
4. **Menu highlight**: Globals stays marked on `#global/header`, `#global/footer`, `#global/side-column`, `#list/menu`, `#list/mobile-menu`, `#blocks/<id>`; Business on `#company/colors` and `#company/colors/fallback-colors`; the cog on neither. The existing tests assume the header is "in Settings" and Colors "in the cog" and must change.
5. **Business on a phone is now five rows** and the Danish rail label `Globale dele` is longer: check 375 px.
6. **Licenses has one door.** The footer link is the only way in: it must stay in `FOOTER_LINKS` (`href` not `null`) and show on every screen (`Screen.tsx` says it does). Edition photo credits stay one tap from the update notice. The cog is no longer marked on `#licenses` (right: the footer opened it).
7. **Colors is the theme's own look** (Material roles, the generator, dynamic colours from a picture); under Business it can read as "my brand colours" only. The screen's text must not say "theme". Check `colors.ts` for it.
8. **`Block settings` in Settings** reads as an owner or developer setting among Morpheme and Privacy; A–Z rule only.
9. **Release notes and docs** of 0.13 and 0.14 name old places (history, stay).
10. **Danish**: `Globale dele` is new and needs the owner's eye.
11. **Overlap with batches 15 and 16** (the block flow, `Block settings` wording, lists): one pull request, merged between them.

## 8. The owner's decisions, and new questions

Decisions (relayed by the PM on 11 November): 1. Appearance stays in Settings, no new section. 2. `Dynamic lists` stays. 3.
Developer stays. 4. `Files` stays. 5. No renames of `Block templates` or `Virksomheden`; instead the section `Blocks`
becomes `Globals` (Header, Footer, Block templates) and `Block settings` moves to Settings. 6. `Licenses` leaves Settings
(the footer has it); `Privacy` stays. 7. `Colors` moves to Business. 8. Logo and icon stays in Business. 9. `Side column` moves to Globals.

New questions, each with a recommendation:

1. **Side column in Globals, Appearance with five rows.** Done as decided. Check: a template picker's greyed-out hint ("Choose a side column") then links to Globals › Side column.
2. **The name `Globals`.** It is the owner's word but a programmer's word for an owner. Recommended: `Globals` as decided, Danish `Globale dele`. Alternative: `On every page` (da `På alle sider`).
3. **Header and Footer to `#global/…` with Side column?** Recommended: yes, all three, so Globals has one address prefix (Side column and Colors move by decision). Alternative: Header and Footer keep `#appearance/…` (two fewer redirect lines, but a Globals screen at an Appearance address).
4. **Where does `Block settings` go in Settings?** Recommended: in the A–Z list, between Assistants and Developer. Alternative: under Developer, which leaves Settings at five rows.
5. **A site whose own `groups` has no `colors`:** keep a `Colors` row in Appearance for it (recommended, hidden when the site's `groups` has it in Business), or let the old file break? Recommended: keep the row for such sites for one release.

On answers to these, the build is one medium pull request (one session), with the release note.
