# Dashboard widgets, batch 4: the first CMS widgets

Status: not started. Checked against the code on 2026-11-10.

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
