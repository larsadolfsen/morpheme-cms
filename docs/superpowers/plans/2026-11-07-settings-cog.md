# Settings behind a cog: build plan

Status: not started. Agreed with the user on 2026-11-07. Checked against the code on 2026-11-10.

## Goal

The main menu shows only what an editor uses. Site settings move to one Settings screen. A cog at the bottom of the menu opens it.

## Agreed split

| Where | Sections |
|---|---|
| Main menu | Dashboard · Content (with SEO: Redirects, Internal links) · Business (with Logo and icon) · Blocks · Apps |
| Settings (`#settings`) | Appearance (with Header and Footer) · Developer · Licenses · Morpheme · Privacy |

- Everyone sees Settings. The editor has no user roles yet.
- Settings rows are sorted A–Z by their label, like the Developer list (`Library.tsx` `Developer`).
- The Morpheme screen (`#morpheme`, `CmsPage.tsx`) holds the CMS version and the store connection. PR #149 puts the store connection there; land #149 first.

## Architecture

- The menu data stays in `defaults/editor.ts` (`groups`, `settings`). The tree stays in `lib/menu.mjs` (`menuTree`, `currentPlace`).
- Material 3 allows destinations pinned at the bottom of a navigation drawer. The cog is such a destination, in the drawer and in the rail.
- Existing routes do not change. Only the Settings list and the back links are new.

## Files

| File | Change |
|---|---|
| `defaults/editor.ts` | Remove the groups `appearance`, `privacy`, `settings` from `groups`. Export `settings` as the five Settings ids. |
| `lib/menu.mjs` | `currentPlace` returns the cog as open for a route under a Settings id. |
| `lib/menu.test.mjs` | Tests for the new `currentPlace` cases. |
| `src/ui.tsx` | Add a `footer` slot to `MainDrawer` and a bottom slot to its rail. |
| `src/MainMenu.tsx` | Render the cog item in the new slots. |
| `src/Library.tsx` | Add `SettingsScreen` (`#settings`), a `Parts` list of the five ids. |
| `src/App.tsx` | Route `settings` to `SettingsScreen`. Update the route map comment. |
| `src/site.ts` | `backFrom(id)` returns `#settings` / "Settings" for a Settings id. `placeOf(id)` returns "Settings" for a Settings id. |
| `src/movedRoutes.mjs`, `src/movedRoutes.test.mjs` | Only if a route changes. No route change is planned. |
| `src/i18n/en-US/*.ts`, `src/i18n/da-DK/*.ts` | Label for the cog: en "Settings", da "Indstillinger" (reuse `t.common.parts.settings` if it fits). |
| `scripts/editor-screens.mjs` | Check `#settings` opens and lists the five rows. Check the menu has no Appearance or Privacy section. |
| `.changeset/settings-cog.md` | Patch changeset, one English line. |
| `AGENTS.md` or the repo map | Add `SettingsScreen` and the drawer `footer` slot to the inventory, if the repo has one. |

## Interfaces

```ts
// defaults/editor.ts
export const settings: string[]; // ['appearance', 'developer', 'licenses', 'morpheme', 'privacy']

// src/ui.tsx
MainDrawer({ ..., footer?: ReactNode })        // drawn at the bottom of the first level
// rail: bottom slot for one MainRailItem

// src/Library.tsx
export const SETTINGS_ROUTE = 'settings';
export function SettingsScreen(): JSX.Element;

// src/site.ts
backFrom(id: string): { href: string; label: string } // '#settings', 'Settings' for a Settings id
placeOf(id: string): string | undefined               // 'Settings' for a Settings id
```

## Tasks

Each task is one commit. Each task ends with `npm run check` passing.

1. Menu data and tree.
   - Change `groups` and `settings` in `defaults/editor.ts` as in the table.
   - Make sure every id in every remaining group resolves in `partOf`. The editor fails to load otherwise (lesson from PR #148).
   - Change `currentPlace` in `lib/menu.mjs`. Add the tests below.
2. Drawer slot.
   - Add `footer` to `MainDrawer` and a bottom slot to the rail in `src/ui.tsx`.
   - Use the theme's tokens only. Add no new CSS values.
3. Settings screen and cog.
   - Add `SettingsScreen` and its route.
   - Render the cog in `MainMenu.tsx`. Use the Phosphor `Gear` icon.
   - Mark the cog as selected on `#settings` and on every screen under a Settings id.
4. Back links and breadcrumbs.
   - Change `backFrom` and `placeOf` in `src/site.ts`.
   - Check `EntryForm.tsx`, `CmsPage.tsx`, `Licenses.tsx`, `Library.tsx` (`Developer`, Appearance, Privacy screens) use them.
5. Morpheme page as information, not a list (`src/CmsPage.tsx`).
   - Show the version, "Checked", the update state, the problems and the release notes as text, not as `ListItem` rows in a `Group`.
   - Keep list rows and buttons only for what reacts to a tap: "Update" and the store connection.
   - Follow Material 3: read the m3.material.io pages for lists and for text before the change.
   - Keep the texts and the order. Change only how they are drawn.
6. Screens check and changeset.
   - Extend `scripts/editor-screens.mjs`. Add the changeset.

## Test cases

| Test | Input | Expected |
|---|---|---|
| `menuTree` | the new `groups` | sections: home, content, company, blocks, apps; no appearance, privacy, settings |
| `currentPlace` | `#settings` | the cog is open; no section is open |
| `currentPlace` | `#appearance/colors` | the cog is open |
| `currentPlace` | `#developer/caching` | the cog is open |
| `currentPlace` | `#pages` | section content is open; the cog is not open |
| `backFrom` | `'privacy'` | `{ href: '#settings', label: 'Settings' }` |
| `backFrom` | `'pages'` | unchanged (`#`, site name) |
| `placeOf` | `'morpheme'` | `'Settings'` |
| screens | `#settings` at 390 px and at desktop width | five rows, A–Z; no page error |
| screens | menu at desktop width | cog at the bottom of the rail and of the drawer |
| screens | `#morpheme` | the version, problems and notes show; no list row without an action; "Update" and the store connection work |

## Checks by hand

- Open the editor on a phone width. Open the menu. See the cog at the bottom. Tap it. See the five rows.
- Open Appearance › Colors. See the back link "Settings". See the cog selected in the menu.

## Out of scope

- User roles and access rules for Settings.
- Moving or renaming any route.
