# Foundation A: an app provides something to other apps

Date: 2026-11-12. Status: draft for the owner's review. Nothing here is built or decided.

Part of the launch plan "match WordPress without e-commerce". Its twin is `2026-11-12-app-storage-design.md` (Foundation B).
The first consumer is the Forms feature, the first provider is Mailchimp.

## Goal

An app can offer a service that other apps use, and an app can use a service without needing it. Nothing breaks when a
provider is missing: the feature that depends on it is unavailable, and the rest of the app works.

## Decisions

| #   | Decision                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The unit is a **service contract**: a named, versioned shape that lives in the CMS package (`lib/appContracts.mjs`), not in an app. Provider and consumer both know the contract, never each other.                                        |
| 2   | `app.json` gets three optional keys: `provides`, `uses` and `needs`. They belong to contract 6 (contracts 4 and 5 fail on unknown keys, as for `role` and `mcp`).                                                                          |
| 3   | **`uses` is the normal case.** The app works with no provider. A feature that depends on one is shown as unavailable, with the name of what adds it. `needs` is a hard requirement, used rarely: the app cannot be turned on without a provider. |
| 4   | A contract says whether it allows **many** providers (receivers: all active ones apply) or **one** (a single transport: the owner picks, like the one-app types).                                                                          |
| 5   | A provider is **active** when its app is installed and not turned off. Only active providers are offered. The build never fails because a provider is missing or broken (the rule for every app).                                          |
| 6   | A consumer lists the contract versions it accepts, `uses: { "form-receiver": [1] }`. A provider says which it implements, `provides: { "form-receiver": 1 }`. They match when the numbers are equal. A different number is "not compatible", shown as unavailable. |
| 7   | A consumer saves its settings for a provider under the provider's id in the consumer's own data. When the provider is removed, the saved settings stay, are ignored, and work again if it is installed again.                              |
| 8   | A provider is **data first**. A connector that only needs to send a request declares it in `app.json`; the Worker makes the request, to the hosts in `csp` only (the shape of `mediaProviders`). Code (`worker.js`) is for first-party apps until plugin Worker isolation ships (`2026-11-11-plugin-worker-isolation.md`). |
| 9   | A contract may name a **built-in provider** in the CMS (the basic version). An app that provides a one-provider contract replaces it, with the confirmation of the one-app types. Not used by the first contract; the rule is there for search and the like. |
| 10  | The owner sees, before turning a provider on, what it receives and where it goes. The contract supplies the sentence ("the answers visitors give in forms"), the provider's `csp` supplies the hosts.                                    |
| 11  | The first contract is **`form-receiver`**, version 1. Its exact shape belongs to the Forms spec. This spec registers it and tests the mechanism with it.                                                                                  |
| 12  | The store's catalog entry carries `provides`, `uses` and `needs`, as it carries `role` and `category`, so the Appstore can say "Adds to Forms" and "Works with Mailchimp".                                                                |

## User stories

Provider side

1. As an app author, I declare `provides: { "form-receiver": 1 }`, so the platform knows what my app offers.
2. As an app author, my app brings its own settings fields to the consumer's screen (a Mailchimp tag, an email address), so I never need a screen of my own.
3. As an app author, I can write a provider as data (a request template) with no code, so a third party can publish one safely.
4. As an app author, I can write a provider with code when the app is first-party and needs more than a request (SMTP).

Consumer side

5. As an app author, I declare `uses: { "form-receiver": [1] }`, so my app works alone and gains features when a provider exists.
6. As an app author, I ask the platform for the active providers of a contract and call them, without knowing which apps they are.
7. As an app author, a provider that fails never breaks my app: I get a failed result and decide what to do (store it, retry).

Owner side

8. As a site owner, a feature that needs a missing provider shows as unavailable with the apps that would add it, not as an error.
9. As a site owner, I see what a provider receives and where it sends it before I turn it on.
10. As a site owner, removing a provider switches off only the features that used it, and my settings return when I install it again.
11. As a site owner, I use many providers at once when the contract allows it, so one form can email me and add a subscriber.
12. As a site owner, I choose the one provider when the contract allows only one, and the editor deactivates the other after asking.

Store side

13. As a site owner browsing the Appstore, I filter by what an app adds to ("Adds to Forms"), so I find receivers easily.

## What the owner sees

- The permission dialog of a provider (`ask`, as for the other apps) gets a line from the contract: en "This app receives the answers visitors give in your forms and sends them to {host}." The Danish text goes in `da-DK`.
- Where a consumer lists providers (in Forms: "Send to"), an uninstalled provider that a form still points to shows as "{name} is not installed" with a link to the Appstore. A not compatible one shows "{name} needs an update".
- An app with `needs` and no provider cannot be turned on: the dialog names the apps that provide it.
- No new screen. The standard parts only (`ListItem`, `SwitchRow`, `ask`).

## Design

### The registry: `lib/appContracts.mjs` (new, pure, tested)

| Export                                  | Shape                                                                                  | Meaning                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `CONTRACTS`                             | `Record<id, { versions: number[], many: boolean, receives: string, builtin?: string }>` | The known contracts. `receives` is the key of the owner's sentence in `src/i18n`.                  |
| `providersOf(contract, version, apps, active)` | `(…) => string[]`                                                               | The ids of active apps that provide that version. Sorted. Empty for an unknown contract.            |
| `contractProblems(manifest)`            | `(manifest) => string[]`                                                               | The problems of the three keys, one English sentence each (below).                                  |
| `unavailable(consumer, apps, active)`   | `(…) => { contract, why: 'missing' \| 'incompatible' }[]`                               | What a consumer's `uses` and `needs` lack. `needs` unmet means the app cannot be turned on.         |

### The manifest (`lib/appManifest.mjs`)

- `KEYS_6 = ['provides', 'uses', 'needs']`, read only when `api` is 6. `APP_API` becomes 6, `APP_APIS` `[4, 5, 6]` (`lib/contracts.mjs`).
- `provides`: an object, contract id to a version number the registry knows.
- `uses`: an object, contract id to a non-empty list of versions the registry knows. `needs`: the same.
- A contract id is in at most one of `uses` and `needs`, and not in `provides` as well (an app does not consume what it provides).
- A provider of a contract has what the contract requires: for `form-receiver`, a `receiver` key (data, below) or a `worker.js` that exports it. `contractProblems` checks that one of them is there, never both.
- A plugin (`role: "plugin"`) may not declare a data provider that makes a request: that needs hosts, so it must be a connector. The existing rule on `csp` applies unchanged.

### The runtime

- **Data providers.** `receiver` in `app.json` is a request template with placeholders, validated like `mediaProviders` (https, name host, no port, host listed in `csp`). The Worker fills and sends it (`worker/providers.js`, new): 10 s timeout, 1 MB answer, no redirect. A result is `{ ok } | { ok: false, reason }`.
- **Code providers.** `worker.js` exports `provides = { 'form-receiver': { receive } }`. `worker/apps.js` already writes the apps' Worker parts; the generator adds the exports to the list `worker/providers.js` reads. First-party only, by the existing `full` place rule.
- **Asking.** `worker/providers.js` exposes `callProviders(env, contract, method, input, only?)`: it finds the active providers (`activeOf`, `lib/appsFile.mjs`), calls each, and returns one result per provider. It never throws and never waits for one provider before starting another (`Promise.allSettled`). It keeps no pending I/O in module memory (`scripts/pending-shared.test.mjs`).
- **Settings.** A provider's `fields` (data, standard `Field`s) are drawn by the consumer's screen. Values are saved in the consumer's data under `providers.<providerId>`.

### The editor

- `src/apps.ts` and `src/AppList.tsx` read `unavailable` for each app and show the states above.
- The permission dialog adds the contract's `receives` sentence and the hosts of the provider's `csp`.
- The one-provider case reuses `rivalsOf` and `withRivalsOff` (`lib/appTypes.mjs`), keyed by contract instead of category.

### The store and the apps

- `morpheme-appstore`: the entry keeps `provides`, `uses`, `needs` as it keeps `role` (the plan checks whether `problemOf` in `src/registry.js` refuses unknown keys).
- `morpheme-apps`: `scripts/app-entry.mjs` writes the keys. Mailchimp's `1.x` gets `provides` with its next version (a version is for ever).
- `docs/app-contract.md`: a "Contract 6" section. `docs/store-categories.md`: the filter.

## The first testers

- **Forms** is the consumer: `uses: { "form-receiver": [1] }`. It stores each submission, then calls the providers (Foundation B gives it the storage). Tested with no provider at all.
- **Mailchimp** is the first provider, as data: its embedded-form `action` URL (already in its `app.json`, pattern `FORM` in `form.ts`) becomes the request template. It keeps working as the pop-up it is today.
- A second provider with code (SMTP) follows in the Forms plan and tests the code path.

## Tests

- `lib/appContracts.test.mjs`: registry, `providersOf`, `unavailable`, every manifest problem.
- `worker/providers.test.mjs`: a failing provider does not stop the others, a slow one times out, a host off `csp` is refused, nothing is kept in module memory.
- `lib/appManifest.test.mjs`: contract 6 keys accepted, contracts 4 and 5 refuse them.
- A fixture consumer and two fixture providers (one data, one code) in `lib/fixtures/`, so the mechanism is tested before Forms exists.

## Out of scope

- The shape of `form-receiver` (the Forms spec), SMTP, and other providers.
- Third-party code providers: they wait for plugin Worker isolation and the owner's decision on the Free plan.
- Contracts between a theme and an app (themes know no app).
- A provider that is also a consumer of a third app (allowed by the rules, not designed here).

## Open questions

1. **Contract number.** Is 6 right, or should these keys go into contract 5 because they are optional and break no app? Contracts 4 and 5 refuse unknown keys on purpose, so I assume 6.
2. **Data providers only for third parties.** Agreed as decision 8, but Mailchimp-style webhooks cover little. Is that enough until isolation ships?
3. **The built-in provider rule (decision 9)** is unused by the first contract. Keep it now, or add it with the first contract that needs it (search)?

## Batches

1. The rule: `lib/appContracts.mjs`, manifest keys, contract 6, tests, `docs/app-contract.md`.
2. The Worker: `worker/providers.js`, the generator's exports, tests.
3. The editor: states, permission dialog, texts in both languages.
4. The store and the apps: the entry keys, Mailchimp's release, the Appstore filter.

The changeset level depends on the branch the work goes into (`CLAUDE.md`, "Merging").
