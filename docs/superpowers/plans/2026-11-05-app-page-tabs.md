# App page tabs: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An installed app's page in the editor gets two top-bar tabs, Settings and Information.

**Architecture:** A pure route reader in `lib/` gives the tab and the field page. `AppContent` wires the head, the tabs
and two tab bodies in their own files. The settings form body and field page move out of `CompanyForm.tsx` for reuse.

**Tech stack:** React (editor in `src/`), `node --test` for `lib/*.test.mjs`, Prettier, the demo build.

**Spec:** `docs/superpowers/specs/2026-11-05-app-page-tabs-design.md`.

## Global constraints

- Every source file starts with a 2–3 line header comment: what it does, what it exposes, key dependencies.
- UI text is Danish in `src/i18n/da-DK/*.ts` and English in the English source texts. Add no hard-coded text.
- Reuse `Screen` `tabs` and `FormFrame` `tabs` (`TabChoice` from `src/ui.tsx`). Write no new tab component.
- Write no markup twice. Move shared markup to a component and use it from both places.
- Comments and commit messages are in English.
- Each task ends with these checks, all green:
  - `npx prettier --check .`
  - `node --test lib/*.test.mjs`
  - `npm run build`
- Each task commits on its own branch. Stage by path. Do not use `git add -A`.

## File structure

| File | Change | Responsibility |
|---|---|---|
| `lib/appRoute.mjs` | create | `appRouteOf`: the tab and the field page of an app page route |
| `lib/appRoute.test.mjs` | create | tests for `appRouteOf` |
| `src/PartFields.tsx` | create | a part's form body: the fields, and the block preview beside them (from `CompanyForm.tsx`) |
| `src/PartFieldPage.tsx` | create | the page of one field with its choices (`Field.page`), from `CompanyForm.tsx` |
| `src/CompanyForm.tsx` | modify | uses `PartFields` and `PartFieldPage`; no change in behaviour |
| `src/AppInfoTab.tsx` | create | the Information tab body (today's `AppAbout` in `AppList.tsx`, without `children`) |
| `src/AppNotificationSwitches.tsx` | create | the app's kinds of notifications, each with its switch |
| `src/AppSettingsTab.tsx` | create | the Settings tab body: settings form, app page part, added items, notification switches, Uninstall, bottom sheet |
| `src/AppList.tsx` | modify | `AppPage` takes `tab` and `page`; `AppContent` wires head, tabs and bodies; `settingsRoute` change |
| `src/App.tsx` | modify | routes `apps/<id>`, `apps/<id>/om`, `apps/<id>/indstillinger/<field>` to `AppPage`; redirect |
| `src/apps.ts` | modify | `screens` doc comment: the key `om` is reserved |
| `.changeset/app-page-tabs.md` | create | minor: "An installed app's page has the tabs Settings and Information." |

---

### Task 1: Route reader `appRouteOf`

Worker: Ollama runner (mechanical, fully specified).

**Files:**
- Create: `lib/appRoute.mjs`
- Create: `lib/appRoute.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:

```ts
/** The tab and the open field page of an app page route; null when the route is not an app page of `id`. */
export function appRouteOf(route: string, id: string): { tab: 'settings' | 'information'; page?: string } | null;
export const INFO_KEY = 'om';
export const SETTINGS_KEY = 'indstillinger';
```

Test cases (`node:test`, `node:assert/strict`, `deepEqual`):

| Route | Id | Result |
|---|---|---|
| `apps/cms-version` | `cms-version` | `{ tab: 'settings' }` |
| `apps/cms-version/om` | `cms-version` | `{ tab: 'information' }` |
| `apps/cms-version/indstillinger` | `cms-version` | `{ tab: 'settings' }` |
| `apps/cms-version/indstillinger/variant` | `cms-version` | `{ tab: 'settings', page: 'variant' }` |
| `apps/cms-version/indstillinger/a/b` | `cms-version` | `null` |
| `apps/cms-version/other` | `cms-version` | `null` |
| `apps/calendly` | `cms-version` | `null` |
| `apps/cms-version-2` | `cms-version` | `null` |
| `` | `cms-version` | `null` |

- [ ] Write `lib/appRoute.test.mjs` with the cases in the table.
- [ ] Run `node --test lib/appRoute.test.mjs`. Expect a failure: the module is not there.
- [ ] Write `lib/appRoute.mjs` with the interface above. Use no imports.
- [ ] Run `node --test lib/appRoute.test.mjs`. Expect all cases to pass.
- [ ] Run the checks in "Global constraints".
- [ ] Commit `lib/appRoute.mjs` and `lib/appRoute.test.mjs`: "Add appRouteOf to read an app page route".

### Task 2: Move the form body and the field page out of `CompanyForm.tsx`

Worker: Sonnet agent (repo rules: forms, `FormFrame`, `useFormPages`).

**Files:**
- Create: `src/PartFields.tsx`
- Create: `src/PartFieldPage.tsx`
- Modify: `src/CompanyForm.tsx`

**Interfaces:**
- Consumes: `usePartForm` (`src/CompanyForm.tsx`) and its return value.
- Produces:

```ts
// src/PartFields.tsx: the fields of a part, and its block preview when it has one (CompanyForm.tsx lines 118–205 today).
export default function PartFields(props: {
  part: Part; files: RepoFile[]; env: Env;
  form: ReturnType<typeof usePartForm>;
}): JSX.Element;
/** Whether the part has a block preview, for FormFrame `panel`. */
export function hasPreview(part: Part): boolean;

// src/PartFieldPage.tsx: one field's page with its choices (CompanyForm.tsx lines 136–166 today).
export default function PartFieldPage(props: {
  part: Part; field: Field; route: string; // the form's address, without "#"
  form: ReturnType<typeof usePartForm>;
  back: { href: string; label: string };
  pageOf: (name: string) => string;
}): JSX.Element;
```

- `PartFields` renders its content inside the `Fields.Provider` and `WrongField.Provider` the caller gives. Or it
  renders both providers itself. Pick one and use it the same way in `PartFieldPage`.
- `CompanyForm` keeps its export, props and behaviour. It renders `FormFrame` around `PartFields`, and
  `PartFieldPage` when a field page is open.

Acceptance:
- [ ] Move the markup. Do not change it.
- [ ] Keep the scroll memory and `useFormPages` in `CompanyForm`.
- [ ] Add the header comment to each new file. Update the header of `CompanyForm.tsx`.
- [ ] Run the checks in "Global constraints".
- [ ] Open `#virksomheden/kontakt` on the demo. Change a field. Expect the Save bar.
- [ ] Open `#apps/content-colors/indstillinger/variant` on the demo. Pick a choice. Expect the form with the choice kept.
- [ ] Commit the three files: "Move the part form body and field page to components of their own".

### Task 3: Move `AppAbout` to `src/AppInfoTab.tsx`

Worker: Ollama runner (a move with a fixed interface).

**Files:**
- Create: `src/AppInfoTab.tsx`
- Create: `src/AppNotificationSwitches.tsx`
- Modify: `src/AppList.tsx` (remove `AppAbout`, lines 470–583 today; import `AppInfoTab`)

**Interfaces:**
- Consumes: the props of `AppAbout` today, without `children`.
- Produces:

```ts
export default function AppInfoTab(props: {
  pictures: { src: string; label: string }[];
  description?: string;
  news?: { version: string; text: string }[];
  needs?: AppNeeds;
  /** Only rows without switches: the kinds of notifications the app sends (names only). */
  notifies?: { label: string }[];
  cookies: AppCookie[];
  consent: boolean;
  publisher: string;
  licenses?: ReactNode;
  /** Where the app is used, under "Bruges på" (Danish label), last. */
  uses?: { href: string; title: string; icon: Icon }[];
}): JSX.Element;
```

- Order: Pictures, About the app, What's new, Permissions, Notifications (names only), Cookies, Licences, Developer,
  Where it is used.
- The notification switches (today `AppAbout` lines 550–565, the `section` with `SwitchRow`s) move to
  `src/AppNotificationSwitches.tsx`:

```ts
/** The app's kinds of notifications under "Notifikationer" (Danish label), each with its switch. */
export default function AppNotificationSwitches(props: { notifies: { label: string; type: string }[] }): JSX.Element;
```

- `DeveloperRow` stays exported from `src/AppList.tsx`.

Acceptance:
- [ ] Move the markup. Do not change the markup of the groups that stay.
- [ ] Until Task 4, `AppContent` renders `AppInfoTab`, then `AppNotificationSwitches` when the app is installed and
  has types, then its other content. The page shows the same items as before. Only the order changes.
- [ ] Add the header comment to each new file. Update the header of `src/AppList.tsx`.
- [ ] Run the checks in "Global constraints".
- [ ] Commit the three files: "Move the app page's information to AppInfoTab".

### Task 4: Settings tab and the tabs on the app page

Worker: Sonnet agent (repo rules: routes, `FormFrame`, `Screen` tabs, i18n). Escalate to an Opus agent after one
failed review.

**Files:**
- Create: `src/AppSettingsTab.tsx`
- Create: `.changeset/app-page-tabs.md`
- Modify: `src/AppList.tsx`, `src/App.tsx`, `src/apps.ts`, `src/i18n/da-DK/apps.ts` and the English source texts of
  `t.apps`

**Interfaces:**
- Consumes: `appRouteOf`, `INFO_KEY`, `SETTINGS_KEY` (`lib/appRoute.mjs`); `PartFields`, `hasPreview`,
  `PartFieldPage`; `usePartForm`; `AppInfoTab`; `FormFrame` `tabs`; `Screen` `tabs`.
- Produces:

```ts
// src/AppList.tsx
export function AppPage(props: { app: SiteApp; env: Env; files: RepoFile[];
  tab: 'settings' | 'information'; page?: string }): JSX.Element;
export function settingsRoute(app: SiteApp): string | null; // 'apps/<id>' without a kind screen; else as today

// src/AppSettingsTab.tsx: the Settings tab body, below the head. Without the settings form: the caller
// renders the form fields above it.
export default function AppSettingsTab(props: { app: SiteApp; env: Env; files: RepoFile[] }): JSX.Element;

// texts
t.apps.tabSettings   // en "Settings", da "Indstillinger"
t.apps.tabInfo       // en "Information", da "Information"
```

Behaviour:
- Installed, with settings: `FormFrame` with `tabs`, `title={app.label}`, back to `#apps`. Content: `AppHead`, the
  Update button when there is one, `PartFields`, then `AppSettingsTab`. A field page renders `PartFieldPage`, back to
  `#apps/<id>`.
- Installed, without settings: `Screen` with `tabs`. Content: `AppHead`, the Update button, `AppSettingsTab`.
- Information tab: `Screen` with `tabs`. Content: `AppHead`, the Update button, `AppInfoTab`.
- Not installed: `Screen` without tabs. Content: `AppHead`, Install, `AppInfoTab`. As today.
- Tab values: `settings` → `#apps/<id>`; `information` → `#apps/<id>/om`.
- `AppSettingsTab` order: the app's own page part (`app.page`); Blocks; Lists; the kinds; `AppNotificationSwitches`
  (only when the app has types); Uninstall with its supporting text. The bottom sheet for an added item stays here.
- Remove the "Indstillinger" row (`ListItem` with `Gear`) from the app page.
- The form keeps unsaved values across a field page: one `AppPage` stays mounted for `apps/<id>` and
  `apps/<id>/indstillinger/<field>`. Give it a stable `key` (the app id).

`src/App.tsx`:
- [ ] In `routeOf`, redirect `apps/<id>/indstillinger` to `apps/<id>` for an app without a kind screen. Keep
  `apps/<id>/indstillinger/<field>` as it is for that app. Keep the redirect for apps with a kind screen.
- [ ] Remove the `settingsOf` branch from `partAt`.
- [ ] Before the own-screen match, render `AppPage` for each route where `appRouteOf(route, id)` is not null and the
  app is installed (or not from the store). Pass `tab` and `page`.
- [ ] Keep `StoreAppPage` for `apps/<id>` of a store app that is not installed.
- [ ] Update the route list in the header comment: `apps/<app>`, `apps/<app>/om`, `apps/<app>/indstillinger/<field>`.

`src/apps.ts`:
- [ ] Add to the `screens` doc comment: "The key `om` is the Information tab; an app screen cannot use it."

Changeset:
- [ ] Write `.changeset/app-page-tabs.md`: minor for `@morphemecms/cms`, "An installed app's page has the tabs
  Settings and Information."

Acceptance:
- [ ] Add the header comment to `src/AppSettingsTab.tsx`. Update the headers of the changed files.
- [ ] Run the checks in "Global constraints".
- [ ] Run `npm run build`. Open the demo with `npx wrangler dev` or the branch Preview.
- [ ] Open `#apps/content-colors`. Expect the Settings tab open, the form and the switches on it.
- [ ] Change a value. Expect the Save bar. Tap Information. Expect the question about unsaved changes.
- [ ] Open the field page "Variant". Pick a choice. Expect the Settings tab with the choice kept and the Save bar.
- [ ] Open `#apps/content-colors/indstillinger`. Expect `#apps/content-colors` in the address bar.
- [ ] Open `#promovering/calendly`. Expect the Calendly app page on Settings.
- [ ] Open `#apps/<an app with a kind screen>` (Google Analytics). Expect the form on Settings. Expect the same form
  on its kind screen.
- [ ] Open an app without settings. Expect Settings with the switches and Uninstall.
- [ ] Open an app from the store that is not installed. Expect no tabs.
- [ ] Open the page on a phone width (375 px) and a computer width. Expect the tabs in the top bar on both.
- [ ] Commit in two commits: the texts and `AppSettingsTab.tsx` with its wiring and routes; then the changeset.
  Each commit passes the checks.

---

## After the tasks

- [ ] Merge each task branch into `feat/app-page-tabs`. Run the checks once on the merge.
- [ ] Push `feat/app-page-tabs`. Open the PR. Wait for the Cloudflare Preview of the demo.
- [ ] Do the hand checks of Task 4 on the Preview.
- [ ] Merge into `main` when the checks pass (standing go-ahead).
