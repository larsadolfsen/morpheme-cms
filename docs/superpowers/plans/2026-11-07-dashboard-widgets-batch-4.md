# Dashboard widgets, batch 4: the first CMS widgets

Status: done (PR against main, 2026-11-10). Differences from the plan are listed below; the signed-in editor cannot be reached from the build session, so the three widgets with real data (Unfinished, Blog rhythm due, the live `builtAt`) are checked through `check:screens` and unit tests only.

## Differences from the plan (names checked against the code)

- No internal-links work is on `main` or on a spec branch (`git log --all --grep "internal links"` finds nothing). The files the start screen already holds carry their text (`RepoFile.text`), so the access is new and small: `src/entries.mjs` (`entriesOf(files, collections)`) reads the front matter of pages and posts from any list of `{ path, text }`, so an app page can use it too. The widgets get the files from `useStartData()`.
- The grid is `src/DashboardGrid.tsx`, not `src/Dashboard.tsx`; the start screen is `Start` in `src/Library.tsx`; the status texts are `t.library.status` (`src/i18n/*/library.ts`).
- `StartStatus.tsx` takes `builtAt` as a prop. A widget has no such prop, so `builtAt` is added to `StartData` (`src/startData.ts`) and `Start` passes it.
- The widgets' icons must be mapped in `site/icons.mjs` or the demo build stops (`check:content`): Phosphor's `Calendar`, `NotePencil`, `Pen` and `Pulse` are not, so they use `CalendarBlank`, `PencilSimple` and `CheckCircle`.
- `isDue`, `lastPostOf` and `weeksSince` are added to `src/blogRhythm.mjs` beside `nextDue`. Days are counted by calendar date. `lastPostOf` counts only posts on the blog: published, or scheduled with the time over (`lib/status.mjs`); drafts, hidden and future-scheduled posts do not.
- Blog rhythm in edit mode, when not due, says when the next post is due.
- `check:screens`: the default dashboard has four cards in edit mode, so the edit-mode checks count four. A new step opens Blog rhythm's settings sheet from its card menu, cancels, opens it again, picks "Week", saves, and checks that Done sends `{ "every": "week" }` with the placement.

Master plan: `2026-11-07-dashboard-widgets.md`. Needs batch 2. Batch 3 is not needed, but the settings of
Blog rhythm are only editable after batch 3.

Before the tasks: check if the internal-links work added frontmatter access for app pages. Reuse it if it exists.
Else add it once, in a shape app pages can use too.

## Task 4.1: Unfinished work (`cms:unfinished`)

Files: `src/widgets/unfinished.tsx`, `src/unfinished.mjs`, `src/unfinished.test.mjs`, i18n files. Worker: Haiku agent.

1. List pages and posts with status `draft`, `unlisted` or `scheduled`. Each row links to its form.
2. Show the date for `scheduled` (`publishAt`). Use the status texts of `src/Library.tsx`.
3. Render nothing when the list is empty and `editing` is false.

| Case | Expected |
|---|---|
| No drafts, unlisted or scheduled | empty list |
| A scheduled post with a bad `publishAt` | listed without a date |
| Mixed entries | scheduled first by date, then drafts, then unlisted |

## Task 4.2: Blog rhythm (`cms:blog-rhythm`)

Files: `src/widgets/blogRhythm.tsx`, `src/blogRhythm.mjs`, `src/blogRhythm.test.mjs`, i18n files. Worker: Haiku agent.

1. Settings: `every` with the values `week`, `two-weeks`, `month`. Default `month`. Use `defineSettings`.
2. `nextDue(lastPostDate, every)` returns the date the next post is due.
3. Not due yet and `editing` false: render nothing. Due: "Your last post was <n> weeks ago" and a link to a new post.
4. No posts: show the link to the first post.

| Case | Expected |
|---|---|
| Last post 3 days ago, every week | not due |
| Last post 8 days ago, every week | due |
| Last post 31 Jan, every month | due on 28 Feb (or 29 in a leap year) |
| Only drafts and scheduled posts | counts as no posts |

## Task 4.3: Site status (`cms:status`)

Files: `src/widgets/status.tsx`, i18n files. Worker: Haiku agent.

1. Show when the site was last published (`builtAt`) and the CMS version. Reuse what `StartStatus.tsx` shows.
2. Always render.

Acceptance: `npm run check` and `npm run check:screens` pass. Send the owner a screenshot of the dashboard with all four widgets.
