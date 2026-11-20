# Dashboard widgets: design

Status: design agreed with the owner on 2026-11-07. No code yet.

> 2026-11-10: dashboards are kept in the existing `NOT_FOUND` namespace under `dashboard:<id>`; no `DASHBOARD` binding.

## Goal

The editor's start screen becomes a dashboard of widgets. Each widget answers one question about the site.
Each person picks, orders and configures their own widgets. Apps from the store can add widgets.

## Decisions

| # | Decision |
|---|---|
| 1 | Widgets come from the CMS (`cms:<key>`) and from installed apps (`<appId>:<key>`). |
| 2 | Each person has their own dashboard. It follows the person to every device, not the browser. |
| 3 | The dashboard is kept in the site Worker's KV, keyed by the GitHub user id. |
| 4 | A widget's settings use `defineSettings` (`src/apps.ts`), like app settings. They are per placed widget, per person. |
| 5 | Each widget decides if it can hide. A widget with nothing to say may render nothing; a status widget always renders. |
| 6 | The dashboard is edited on the dashboard itself (an edit mode), not on a separate screen. |
| 7 | The first CMS widgets: Continue, Unfinished work, Blog rhythm, Site status. |
| 8 | A person with no saved dashboard sees the default set (all four, in that order). |

Rejected: a file per person in the site repo (every change is a commit and a build); `localStorage` (per browser, not per person).

## Reuse

| Existing code | Used for |
|---|---|
| `AppDefinition`, `defineSettings`, `AppSettings` (`src/apps.ts`) | The new `widgets` field and each widget's settings |
| `appSettingsPart` (`src/AppList.tsx`), `PartFields` (`src/PartFields.tsx`) | The settings form of a placed widget |
| `ContinueCard` (`src/ContinueCard.tsx`) | Becomes the widget `cms:continue` |
| `access`, `sessionToken` (`worker/session.js`) | Sign-in and repo access for the new Worker route |
| KV bindings in `starter/wrangler.jsonc` | The existing `NOT_FOUND` binding also keeps the dashboards (no new binding) |
| `needsOf` (`src/store.ts`), `src/checkSite.ts` | Store and site checks learn the new field |
| `APP_API` (`lib/contracts.mjs`), `docs/app-contract.md` | The contract version goes up; the contract doc describes widgets |
| Status in the lists (`src/Library.tsx`: draft, unlisted, scheduled, `publishAt`) | Unfinished work and Blog rhythm read the same fields |

Shared need: widgets must read page and post frontmatter. The internal-links session plans the same addition for app pages.
The session that builds first adds it; the other reuses it.

## Data model

### Widget definition (code)

Declared by the CMS in `src/widgets/` and by apps in `AppDefinition.widgets`:

```ts
type WidgetDefinition = {
  label: string;            // in the "Add widget" list and on the card in edit mode
  hint: string;             // one line in the "Add widget" list
  icon: Icon;
  settings?: AppSettings;   // defineSettings(...); none = no settings button
  component: ComponentType<WidgetProps>;
};

type WidgetProps = {
  api: AppPageProps['api'];          // the same api app pages get
  settings: Record<string, unknown>; // this placement's values over settings.values
  editing: boolean;                  // true in edit mode: the widget must render, never null
};

// AppDefinition gets: widgets?: Record<string, WidgetDefinition>  (key = <key> in "<appId>:<key>")
```

The full widget id is `<source>:<key>`. `source` is `cms` or the app id. App ids are unique in the store, so full ids are unique.

### Stored dashboard (data)

KV binding `NOT_FOUND` (shared with the 404 counts, which use `404:` keys), key `dashboard:<githubUserId>`, no expiry. The GitHub user id is the numeric id, which survives login renames.

```ts
type StoredDashboard = {
  version: 1;
  widgets: Placement[];  // order on screen = order in the list
};

type Placement = {
  id: string;            // unique in this dashboard; random, made when the widget is added
  widget: string;        // full widget id, e.g. "cms:blog-rhythm", "booking:today"
  settings: Record<string, unknown>; // only the values the person changed
};
```

Rules:
- The same widget may be placed twice (two placements, two ids, own settings).
- A placement whose widget is not there (app uninstalled) is skipped on screen and dropped on the next save.
- No record, or a record with another `version`, gives the default set.
- At most 50 placements and 16 KB per record; the Worker refuses more.

### Worker route

| Request | Answer |
|---|---|
| `GET /api/dashboard` | `200 { dashboard: StoredDashboard \| null }` |
| `PUT /api/dashboard` with a `StoredDashboard` | `204`; `400` when it is not valid; `413` when too large |
| Not signed in, or no access to the repo (`access`) | `401` / `403`, as the other `/api/` routes |

The Worker asks GitHub `GET /user` with the session token for the user id. The browser never sends a user id.

## Screen

- The start screen shows the placed widgets as a grid of cards: one column on compact, two from medium, three from expanded.
- The top app bar gets an "Edit dashboard" icon button.
- In edit mode each card shows: a drag handle, "Move up"/"Move down" in its menu (keyboard and screen readers), a settings button
  (only with `settings`) and "Remove". An "Add widget" button opens a list of all widgets (CMS first, then by app).
- "Done" saves to the Worker and leaves edit mode. A failed save keeps edit mode and shows the error.
- Before batch 3, check the Material 3 pages for cards, menus and the top app bar (m3.material.io). Follow them; do not invent.

## First widgets

| Id | Shows | Hides when | Settings |
|---|---|---|---|
| `cms:continue` | The last three pages and posts saved (today's ContinueCard) | Never (says where edits will be when empty) | None |
| `cms:unfinished` | Drafts, unlisted pages, scheduled posts with their date; each a link | Nothing is unfinished | None |
| `cms:blog-rhythm` | "Next post due <date>", or "Your last post was <n> weeks ago" with a link to write one | The next post is not due yet | `every`: week, two weeks, month (default month) |
| `cms:status` | Last published (build time), CMS version | Never | None |

## Out of scope (later)

SEO to-dos, visitor numbers (needs Cloudflare Web Analytics and a key), a shared dashboard per site, widget sizes.
