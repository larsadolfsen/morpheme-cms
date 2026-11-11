# Menu and Settings regroup: plan (batch 17)

Status: **plan only, nothing built. Revised 11 November after the owner's answers to the five questions (section 8 lists the answers and the new questions).** Source: batch 17 and open questions 3 and 4 of
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

## 3. Proposed structure (after the owner's answers)

The owner's decisions: Appearance stays on the Settings page; the main-menu section `Blocks` becomes `Globals`, holding
Header, Footer and Block templates; `Block settings` moves to Settings; Logo and icon moves into Appearance (the plan's
own alternative, flip-able: see Q1 below). No other renames.

```
Main menu
├─ Dashboard
├─ Content      Pages, Blog posts, Dynamic lists, Promotion, Tags, Files, Internal links, Redirects ▾
├─ Business     Contact, Social media, Payment                       (Logo and icon leaves)
├─ Globals      Header, Footer, Block templates                      (was Blocks; Header and Footer come from Appearance)
└─ Apps         Appstore, installed apps
Settings (cog)  Appearance, Assistants, Block settings, Developer, Morpheme, Privacy     (six rows, A–Z; Licenses leaves)
  └─ Appearance Theme store, Logo and icon, Themes, Icon packs, Motion, Side column, Colors, Default pages   (Header, Footer leave)
```

How it is built:

- `groups`: the section `{ id: 'blocks', title: 'Blocks', ids: ['blocks', 'block-settings'] }` becomes
  `{ id: 'global', title: 'Globals', ids: ['header', 'footer', 'blocks'] }`. The section id changes from `blocks` to
  `global` because `blocks` is also the id of the part `Block templates` (route `#blocks`); the icon `global` (a globe)
  already exists in `defaults/editor.ts`. `partOf` already knows `header` and `footer`.
- `settings` becomes `['appearance', 'assistants', 'block-settings', 'developer', 'morpheme', 'privacy']` (sorted by name in
  the editor's language when drawn): `block-settings` joins, `licenses` leaves. `Block settings` keeps its id and route.
- **Licenses leaves the Settings page** (owner's decision): the footer on every screen already links to it
  (`FOOTER_LINKS` in `lib/footerLinks.mjs`: `licenses` → `#licenses`). The route `#licenses`, `#licenses/<id>` and the
  screen stay; so do the edition photos' credits, which are pages of it (`#licenses/editions/<line>`, linked from the
  update notice in `UpdatesNotice.tsx`). `Licenses` is not in the menu, so no tree entry is needed, but it must not be
  left in `settings`: then the cog would not be marked on it, and the cog is right not to be (the footer opened it).
- **Privacy stays.** The footer's `Privacy policy` is Morpheme's own policy, an external page at getmorpheme.com. The
  Settings row `Privacy` is the site's own: its cookie banner, privacy pages and visitors' consents (`#privacy/*`). They
  are different screens, so nothing is removed.
- `Theme()` loses the `header` and `footer` rows and gains `logo` (second, after Theme store). `Company()` loses its `logo` row; Business's `ids` lose `logo`.
- **Routes of Header, Footer, Block settings stay** (`#appearance/header`, `#appearance/footer`, `#block-settings`). The
  menu's highlight finds an item by its link (`currentPlace` rule 3, longest href wins) before it looks at the route's
  first word, so a header screen at `#appearance/header` still marks Globals, not the cog. The `id === 'header'` special
  case in `currentPlace` (cog open for the header) must go.
- The back link of Header and Footer changes from Appearance to the start screen (as `#company` does), and `Block
  settings` goes back to Settings (`backFrom` already does that for any id in `settings`).
- The rail still has the same number of destinations (the section is renamed, not added): nothing new to fit. Settings
  has six rows, as today (one in, one out).

## 4. Proposed renames

Ids, routes and `common.parts.*` keys stay; only the section's title changes (and where the rows are).

| # | Old en-US | New en-US | Old da-DK | New da-DK | Why | M3 word-choice check |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `Blocks` (section) | `Globals` | `Blokke` | `Globale dele` (alternative `På alle sider`) | The section now holds what is shared by every page: the header, the footer and the block templates. `Blocks` no longer says that. | **Weak.** `Globals` is a programmer's word; the guide asks for universal words an owner already knows. It was the owner's own word before 0.13 and is short, so it stays as the owner decided. Plainer, if the owner wants one: `On every page` (da `På alle sider`) or `Shared` (da `Fælles`). Danish `Globale dele` keeps the owner's word and adds a plain noun (`dele`, the same word Developer › Parts uses). |
| 2 | `Block templates`, `Files`, `Dynamic lists`, `Business`, `Virksomheden`, `Appearance`, `Developer`, `Logo and icon` | no change | no change | no change | Owner's decision. | `Block templates` keeps "templates" (a template builder comes here later). |

Withdrawn from the first draft: `Block texts`, `Pictures and files`, `Virksomhed`.

## 5. Routes that change, and old links

| Old | New | How the old one keeps working |
| :--- | :--- | :--- |
| `#company/logo` | `#appearance/logo` | `MOVED['company/logo'] = 'appearance/logo'` in `src/movedRoutes.mjs`. |
| `#appearance/logo` (0.12 to 0.13, now mapped to `company/logo`) | `#appearance/logo` | Delete the entry `'appearance/logo': 'company/logo'`, or the two entries would send a link round in a circle. |
| `#virksomheden/logo`, `#tema/logo`, `#udseende/logo` (older, Danish) | `#appearance/logo` | Retarget each `MOVED` value from `company/logo` to `appearance/logo` (`movedRoute` is one step, so every old key must point at the final address). |

No other route changes: `#appearance/header`, `#appearance/footer`, `#block-settings`, `#blocks`, `#blocks/<id>`,
`#appearance`, `#developer/*`, `#files`, `#lists`, `#company/*`, `#settings`, `#settings/appstore` all stay. The old
entries `header` → `appearance/header` and `src/data/footer.json` → `appearance/footer` stay valid, and nothing points
at another key, so there is no loop. Option for later (Q3): move Header and Footer to `#global/header` and
`#global/footer`, with `MOVED` entries for the two current addresses and all the older ones retargeted at the final
address; not needed for the menu to work and not recommended now.

`worker/movedAddresses.js`, `lib/previewAddress.mjs` and `scripts/retarget-links.mjs` are not touched: no public site
address changes (as `/ny/` → `/new/` in 0.15 did, which these three handled). Tests: `src/movedRoutes.test.mjs` gets a
pair for each moved key and a check that no value is also a key.

## 6. Files that change (when built)

- `defaults/editor.ts`: `groups` (Globals section, Business `ids`), `settings` (add `block-settings`, remove `licenses`), the comments at the top and at `groups`.
- `lib/menu.mjs`: remove the `id === 'header'` special case in `currentPlace`; `lib/menu.test.mjs` (fixtures with `blocks`, `header`, the cog test list).
- `src/MainMenu.tsx`: nothing but the section id's icon (`global`, already in `icons`).
- `src/Library.tsx`: `Theme()` (no `header`, `footer`; a `logo` row), `Company()` (no logo row), `partOf` (`logo` stays, `block-settings` is in Settings now), the comments at 214 and 242; the Settings screen has six rows (Licenses out, Block settings in).
- `src/HeaderSettings.tsx`, `src/FooterSettings.tsx`, `src/DataForm.tsx` (313 to 315): back links, from Appearance to the start screen.
- `src/BlockSettings.tsx`: back link to Settings; `src/site.ts` 148 (`Block templates` back link: to the start screen, unchanged unless the menu gives the section a screen).
- `src/site.ts`: `placeOf` and `standardPageAt` (Default pages stays under `Settings › Appearance`); the `backFrom` comment.
- `src/App.tsx`: `company/logo` → `appearance/logo`, the header comment's routes.
- `src/BrandForm.tsx`: back link and comment.
- `src/movedRoutes.mjs`, `src/movedRoutes.test.mjs`.
- `defaults/i18n/da-DK/editor.ts` (`Blocks` key becomes `Globals`); `defaults/editor.ts` title.
- `src/i18n/en-US/colors.ts` (the hint "under Appearance › Logo and icon" is true again) and the `forms.ts` link text to Side column (unchanged).
- `scripts/editor-screens.mjs`: Settings lists six rows, with `block-settings` and without `licenses` (A–Z by the Danish names); `#licenses` still opens and marks no cog, the drawer's first level is Dashboard, Content, Business, Globals, Apps, `#appearance/header` marks Globals and not the cog, `#block-settings` marks the cog.
- Release note: one card in `release-notes/i18n/{en-US,da-DK}/pending/` (Logo and icon now under Appearance, Header and Footer under Globals, Block settings under Settings), written with the `release-notes` skill. Not now.
- `docs/superpowers/plans/2026-11-07-settings-cog.md`: a note that Block settings joined the cog and Licenses left it.
- `lib/menu.test.mjs` and `scripts/editor-screens.mjs` list `licenses` in `settings` (lines 15 and 237 to 240; the screen check's "moved" list): remove it there.
- Release note: add that Licenses is in the footer, not in Settings.
- A changeset (`minor`, allowed into `0.19`).

Not changed: `worker/*`, themes, blocks, apps.

## 7. Risks

1. **Sites with their own `src/site/editor.ts`.** `groups` and `settings` are a site's own when it has them: an old copy keeps `Blocks` with `block-settings` and Header and Footer in Appearance, while the editor code expects the new split. The screens must still open (`partOf` knows every id; the section id `blocks` must not crash), and `check:site-types` must pass on such a site. Test with a fixture that has the old `groups`.
2. **"The way there" strings.** `placeOf('header')` becomes `Globals` (no "Settings ›"), so any text built from it reads `Globals › Header`; `standardPageAt` stays `Settings › Appearance › Default pages`. Search for each `placeOf(` caller (`EntryForm.tsx` 145 uses `redirectsPath`, not affected) and for hard-coded "Appearance › Header" in en-US and da-DK texts.
3. **Redirect loop** between `appearance/logo` and `company/logo` if the old entry is left (section 5).
4. **Menu highlight**: `Globals` must stay marked on `#appearance/header`, `#appearance/footer`, `#list/menu`, `#list/mobile-menu` and `#blocks/<id>`; the cog must not. The existing tests assume the header is "in Settings" and must change.
5. **Drawer and rail fit**: the number of destinations is unchanged, but check the longer Danish name `Globale dele` in the rail's label at 375 px.
6. **Licenses has one door.** The footer link is the only way in: if a screen hides the footer (a full-screen editor, a sheet) the owner can't reach Licenses, and the route's `currentPlace` result changes (cog no longer marked). Check the footer shows on every screen (`Screen.tsx` says it does) and that the link stays in `FOOTER_LINKS` (`href` not `null`). Edition photo credits stay one tap from the update notice.
6b. **`Block settings` in Settings** reads as a developer or owner setting among account rows (Morpheme, Privacy); it goes by the A–Z rule only.
7. **Release notes and docs** of 0.13 and 0.14 name the old places; notes are history and stay.
8. **Danish**: `Globale dele` is new and needs the owner's eye.
9. **Overlap with batches 15 and 16** (the block flow, `Block settings` wording, lists): one pull request, merged between them.

## 8. The owner's answers, and new questions

Answers (relayed by the PM on 11 November; the last one, Licenses, came after the first revision): 1. Appearance stays in Settings, no new section (Logo and icon moves there; the
owner did not say otherwise). 2. `Dynamic lists` stays. 3. Developer stays. 4. `Files` stays. 5. No renames of `Block
templates` or `Virksomheden`; instead the section `Blocks` becomes `Globals` (Header, Footer, Block templates) and `Block
settings` moves to Settings. 6. The `Licenses` row leaves Settings (the footer has the link); `Privacy` stays, as it is not the footer's `Privacy policy`.

New questions, each with a recommendation:

1. **Logo and icon into Appearance, or leave it in Business?** This is an assumption, easy to flip. Recommended: Appearance (it is looks; Business keeps Contact, Social media and Payment). Flip: leave it in Business and change nothing for it (no route change, five files fewer).
2. **The name `Globals`.** It is the owner's word but a programmer's word for an owner. Recommended: `Globals` in English as decided, and Danish `Globale dele`. Alternative: `On every page` (da `På alle sider`).
3. **Move the routes of Header and Footer to `#global/…`?** Recommended: no, keep `#appearance/header` and `#appearance/footer` (no old link breaks; the menu highlights by link). Tidy later in a separate change if wanted.
4. **Where does `Block settings` go in Settings?** Recommended: in the A–Z list, between Assistants and Developer. Alternative: under Developer (it is a switchboard for which blocks exist), which leaves Settings at six rows.

On answers to these, the build is one small to medium pull request (one session), with the release note.
