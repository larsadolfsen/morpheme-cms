# One active app per type (plan)

Design: [2026-11-07-one-app-types-design.md](../specs/2026-11-07-one-app-types-design.md).
Session branch: `feat/one-app-types`. Each task works on its own branch and merges into the session branch.

## Tasks

| # | Task | Worker | Branch | Files |
|---|---|---|---|---|
| `one-app-types/1` | Type `redirects` and its label | Ollama runner | `task/redirects-type` | `src/store.ts`, `src/i18n/en-US/apps.ts`, `src/i18n/da-DK/apps.ts` |
| `one-app-types/2` | The rule: `lib/appTypes.mjs` | Ollama runner | `task/app-types-rule` | `lib/appTypes.mjs`, `lib/appTypes.test.mjs` |
| `one-app-types/3` | The warning on install and on the Enabled switch | Sonnet agent | `task/app-types-warning` | `src/AppList.tsx`, `src/i18n/en-US/apps.ts`, `src/i18n/da-DK/apps.ts`, `.changeset/` |
| `one-app-types/4` | The contract text | Haiku agent | `task/app-types-doc` | `docs/app-contract.md` |

Order: 1 and 2 first, in parallel. Then 3. Then 4.
Task 3 goes to a Sonnet agent: it needs repo-rule judgement on `AppList.tsx`, the store install path and the dialog.

## `one-app-types/1`: type `redirects` and its label

1. Add `'redirects'` to the end of `appCategories` in `src/store.ts`.
2. Add `redirects: 'Redirects'` to `categories` in `src/i18n/en-US/apps.ts`.
3. Add `redirects: 'Videresendelser'` to `categories` in `src/i18n/da-DK/apps.ts`.
4. Change no other file.

Acceptance:

- `npm run check:types` passes.
- `npm test` passes.

## `one-app-types/2`: the rule

1. Create `lib/appTypes.mjs` with a 2–3 line header: what it does, what it exposes, its dependency `./appsFile.mjs`.
2. Export the interface below. Use JSDoc types, as `lib/appsFile.mjs` does.
3. Create `lib/appTypes.test.mjs` with the test cases below. Use `node:test` and `node:assert/strict`.

Interface:

```ts
export const ONE_APP_TYPES: readonly string[]; // ['redirects']

/** The ids in `active` of apps (from `apps`) with the same category as `app`, when that category is in
 *  ONE_APP_TYPES. Without `app.id`. Sorted. Empty when `app` has no category or a many-app category. */
export function rivalsOf(
  app: { id: string; category?: string },
  apps: { id: string; category?: string }[],
  active: string[],
): string[];

/** `state` with each id of `rivals` in `off` (withOff from ./appsFile.mjs). */
export function withRivalsOff(state: { installed: string[]; off: string[] }, rivals: string[]): { installed: string[]; off: string[] };
```

Test cases:

| # | Call | Expect |
|---|---|---|
| 1 | `ONE_APP_TYPES` | `['redirects']` |
| 2 | `rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], ['a'])` | `['a']` |
| 3 | same as 2, `active` = `[]` | `[]` |
| 4 | `rivalsOf({ id: 'b', category: 'payment' }, [{ id: 'a', category: 'payment' }], ['a'])` | `[]` |
| 5 | `rivalsOf({ id: 'b' }, [{ id: 'a' }], ['a'])` | `[]` |
| 6 | `rivalsOf({ id: 'a', category: 'redirects' }, [{ id: 'a', category: 'redirects' }], ['a'])` | `[]` |
| 7 | `rivalsOf({ id: 'c', category: 'redirects' }, [{ id: 'b', category: 'redirects' }, { id: 'a', category: 'redirects' }, { id: 'd', category: 'booking' }], ['a', 'b', 'd'])` | `['a', 'b']` |
| 8 | `rivalsOf({ id: 'b', category: 'redirects' }, [{ id: 'a', category: 'booking' }], ['a'])` | `[]` |
| 9 | `withRivalsOff({ installed: ['a', 'b'], off: [] }, ['a'])` | `{ installed: ['a', 'b'], off: ['a'] }` |
| 10 | `withRivalsOff({ installed: ['a', 'b'], off: ['a'] }, [])` | `{ installed: ['a', 'b'], off: ['a'] }` |
| 11 | `withRivalsOff({ installed: ['b'], off: [] }, ['x'])` | `{ installed: ['b'], off: [] }` |

Acceptance:

- `node --test lib/appTypes.test.mjs` passes.
- `npx prettier --check lib/appTypes.mjs lib/appTypes.test.mjs` passes.

## `one-app-types/3`: the warning

Read the design's section "Where the rule runs" first.

1. Add to `src/i18n/en-US/apps.ts`:
   - `oneOfType: (type: string, app: string, others: string) => string`. Text: "Only one {type} app can be active. Activating {app} deactivates {others}. Its settings and data stay, and you can activate it again."
   - `activate: 'Activate'`.
2. Add the same keys to `src/i18n/da-DK/apps.ts`:
   - Text: "Kun én app af typen {type} kan være aktiv. Når du aktiverer {app}, deaktiveres {others}. Dens indstillinger og data bliver, og du kan aktivere den igen."
   - `activate: 'Aktivér'`.
3. In `src/AppList.tsx`, add one helper for the three paths. It finds the rivals with `rivalsOf` and asks with `ask(t.apps.oneOfType(…), t.apps.activate)`. It returns the rivals, or `null` on cancel.
   - `type`: `t.apps.categories[category]`.
   - `others`: the labels of the rivals, joined with ", ".
4. In `install(true)` (a site's own app): call the helper before the save. On `null`, stop. Write `apps.json` with `withRivalsOff` applied after `withInstalled`.
5. In `useStoreActions().install`: call the helper before `change()`. On `null`, stop. Give `appChanges` the apps file with the rivals already off: the same `path` and `oid`, the text from `appsFileText(withRivalsOff(…))`.
6. In `turn(true)`: call the helper before the save. On `null`, stop. Apply `withOff(…, false)` for the app and `withRivalsOff` for the rivals. Save one commit.
7. Do not change `turn(false)`, uninstall or update.
8. Update the header comment of `src/AppList.tsx`: one sentence on the one-app types and the warning.
9. Add a changeset: `@morphemecms/cms` patch. Text: "Activating an app of a type that allows one active app now deactivates the other app of that type, after a warning."

Acceptance:

- `npm run check` passes (on Windows, `check:worker` tar is a known failure; report it).
- Manual check, on the demo in local dev, with a temporary change that you do not commit:
  1. Set `ONE_APP_TYPES` to `['analytics']`.
  2. Install Google Analytics. Expect no dialog.
  3. Install Google Tag Manager. Expect the dialog with both names.
  4. Select Cancel. Expect no commit and no change.
  5. Install Google Tag Manager again and select Activate. Expect one commit. Expect Google Analytics to show "Deactivated".
  6. Switch Google Analytics on. Expect the dialog with Google Tag Manager as the app to deactivate.
  7. Select Activate. Expect Google Tag Manager to show "Deactivated" and the Google Analytics settings unchanged.
  8. Undo the temporary change.
- Send screenshots of steps 3 and 5.

## `one-app-types/4`: the contract text

1. Add a section "App types with one active app" to `docs/app-contract.md`, before "Contract 3".
2. Write these points, each one sentence:
   - The `category` of an app is its type.
   - A type allows one active app when two apps of that type collide in code or data.
   - `ONE_APP_TYPES` in `lib/appTypes.mjs` lists those types. Today: `redirects`.
   - Activating an app of such a type deactivates the other app of that type after a warning.
   - The deactivated app keeps its folder, settings and data.
   - The other types allow many active apps.
3. Write in ASD-STE100 style.

Acceptance:

- `npx prettier --check docs/app-contract.md` passes.

## Acceptance (all tasks)

- `npm run check` passes on the session branch.
- The manual check of task 3 passes.
- Then: PR to main, the PR review session merges it, the Release PR, `/release`, the owner approves on npmjs.
