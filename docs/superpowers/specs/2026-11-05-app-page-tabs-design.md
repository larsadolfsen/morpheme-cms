# App page: Settings and Information tabs

Date: 2026-11-05. Status: approved by the owner in chat.

## Goal

An installed app's page in the editor (`#apps/<id>`, `src/AppList.tsx` `AppPage`) gets two tabs in the top app bar:
Settings (Danish label: Indstillinger) and Information (Danish label: Information). The owner changes the app on one
tab and reads about it on the other.

## What each tab holds

The head (`AppHead`: icon, name, developer, status, version) and the Update button stay above the content on both tabs.

| Tab | Route | Content, in this order |
|---|---|---|
| Settings (opens first) | `#apps/<id>` | the app's settings form inline (`appSettingsPart`, the same form and file as the old settings screen); the app's own page part (`app.page`); what it adds with its switches (Blocks, Lists, kinds); Notifications with their switches; Uninstall |
| Information | `#apps/<id>/om` | Pictures, About the app, What's new, Permissions (`needs`), Cookies, Licences, Developer, Where it is used |

- An app without a settings form still has the Settings tab: it has its switches and Uninstall.
- An app that is not installed has no tabs. Its page shows the head, the Install button and the Information content,
  as before.
- Settings of an app whose kind has a screen of its own (`settingsHome`: e.g. Analytics, Payment) stay on that screen
  too. Both places edit the same file.
- The Notifications group without switches (the app sends none, or it is not installed) stays on Information. With
  switches it moves to Settings.

## Routes

- `#apps/<id>/indstillinger` redirects to `#apps/<id>`. The old links and the redirects `promovering/calendly` and
  `promovering/mailchimp` (`src/App.tsx`) then open the Settings tab.
- A settings field with a page of its own (`#apps/<id>/indstillinger/<field>`, e.g. `content-colors` › `variant`)
  keeps its route. Its back button goes to `#apps/<id>`.
- `settingsRoute(app)` returns `apps/<id>` for an app without a kind screen.
- `om` is a reserved key: an app's `screens` cannot use it (validation where `screens` keys are read).

## Code

- `src/AppList.tsx` has 1,376 lines. The two tab bodies move to their own files:
  - `src/AppSettingsTab.tsx`: the Settings tab content.
  - `src/AppInfoTab.tsx`: the Information tab content (today's `AppAbout` without its `children`).
- `AppContent` only wires the head, the tabs and the two bodies. The bottom sheet for an added item stays with
  the Settings tab.
- The tabs use the `tabs` prop of `Screen` (`src/Screen.tsx`, `TabChoice`), as `StoreScreen` does.
- A pure function in `lib/appTab.mjs` gives the tab of a route:
  `appTabOf(route: string, id: string): 'settings' | 'information' | null`. `lib/appTab.test.mjs` tests it.

## Tests

- `appTabOf` has a `node --test` file with these cases:

| Route | Id | Result |
|---|---|---|
| `apps/cms-version` | `cms-version` | `settings` |
| `apps/cms-version/om` | `cms-version` | `information` |
| `apps/cms-version/indstillinger` | `cms-version` | `settings` |
| `apps/cms-version/indstillinger/variant` | `cms-version` | `null` (the field page) |
| `apps/cms-version/other` | `cms-version` | `null` (an app screen) |
| `apps/calendly` | `cms-version` | `null` |

- `npm run check:screens` opens both tabs of an installed app and the page of an app that is not installed, on a
  phone and a computer.
- Check by hand on the branch's demo Preview: open an installed app, switch tabs, change a setting, open a field
  page and go back.
