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
  keeps its route. The app page draws it, so the form keeps unsaved values across the field page. Its back button
  goes to `#apps/<id>`.
- `settingsRoute(app)` returns `apps/<id>` for an app without a kind screen. Apps with a kind screen keep their route.
- `om` is a reserved key: `App.tsx` matches `apps/<id>/om` before an app's own screens, and the `screens` doc comment
  in `src/apps.ts` says so.

## Form behaviour

- With a settings form, the Settings tab renders through `FormFrame` (its `tabs` prop): the Save bar shows when a
  value changes, and leaving with unsaved changes asks first. A tab switch is a leave.
- Without a settings form, both tabs render through `Screen` with its `tabs` prop.
- The form body and the field page are shared with `CompanyForm.tsx`, not copied: they move to components of their
  own, which both use.

## Code

- `src/AppList.tsx` has 1,376 lines. The two tab bodies move to their own files:
  - `src/AppSettingsTab.tsx`: the Settings tab content.
  - `src/AppInfoTab.tsx`: the Information tab content (today's `AppAbout` without its `children`).
- `AppContent` only wires the head, the tabs and the two bodies. The bottom sheet for an added item stays with
  the Settings tab.
- The tabs use the `tabs` prop of `Screen` (`src/Screen.tsx`, `TabChoice`), as `StoreScreen` does.
- A pure function in `lib/appRoute.mjs` reads an app page route:
  `appRouteOf(route: string, id: string): { tab: 'settings' | 'information'; page?: string } | null`.
  `lib/appRoute.test.mjs` tests it.

## Tests

- `appRouteOf` has a `node --test` file with these cases:

| Route | Id | Result |
|---|---|---|
| `apps/cms-version` | `cms-version` | `{ tab: 'settings' }` |
| `apps/cms-version/om` | `cms-version` | `{ tab: 'information' }` |
| `apps/cms-version/indstillinger` | `cms-version` | `{ tab: 'settings' }` |
| `apps/cms-version/indstillinger/variant` | `cms-version` | `{ tab: 'settings', page: 'variant' }` |
| `apps/cms-version/indstillinger/a/b` | `cms-version` | `null` |
| `apps/cms-version/other` | `cms-version` | `null` (an app screen) |
| `apps/calendly` | `cms-version` | `null` |
| `apps/cms-version-2` | `cms-version` | `null` |

- This repo has no `check:screens` yet. The checks are `npx prettier --check .`, `node --test` over the
  `*.test.mjs` files, and `npm run build`.
- Check by hand on the branch's demo Preview: open an installed app, switch tabs, change a setting, open a field
  page and go back with the value kept, leave with unsaved changes, and open an app that is not installed.
