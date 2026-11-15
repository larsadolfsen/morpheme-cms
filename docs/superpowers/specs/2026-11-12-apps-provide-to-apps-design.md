# Apps provide to apps (0.23, spec 3)

> **Status:** draft, revised to the owner's decisions of 15 November 2026 and spec 1 (a planning session: nothing is
> built). Release plan and decisions: `docs/superpowers/plans/2026-11-15-app-platform-0-23.md` (cited as **D1** to
> **D35**). It builds on spec 1, `2026-11-15-app-worker-sandbox-design.md`. Its twin is spec 2,
> `2026-11-12-app-storage-design.md`.

The first consumer is Forms (spec 4, a core feature, D6), the first built-in provider is the email receiver (D10), the
first app provider is Mailchimp.

## Goal

An app, or the core, can offer a service that others use, and a consumer can use a service without needing an app for
it. Every basic function has a built-in provider, so nothing a site needs breaks when an app is missing, off, paused or
failing: the built-in takes over, and the rest keeps working.

## Decisions

| #   | Decision |
| --- | -------- |
| 1   | The unit is a **service contract**: a named, versioned shape that lives in the CMS package (`lib/appContracts.mjs`), not in an app. Provider and consumer both know the contract, never each other. |
| 2   | `app.json` gets three optional keys: `provides`, `uses` and `needs`, in **contract 7** (**D5**), with spec 1's `worker` and spec 2's `storage`. Contracts before 7 refuse them. |
| 3   | **`uses` is the normal case.** The consumer works with no app provider. A feature that depends on one is shown as unavailable, with the name of what adds it. `needs` is a hard requirement, used rarely: the app cannot be turned on without a provider. A built-in provider meets `needs`. |
| 4   | A contract says whether it allows **many** providers (receivers: all active ones apply) or **one** (a single transport: the owner picks, like the one-app types). |
| 5   | A provider is **active** when its app is installed, not turned off, and its server part is not paused (D17, D27, D34; later the paid pause of 0.25). Only active providers are called. The build never fails because a provider is missing or broken. |
| 6   | A consumer lists the contract versions it accepts, `uses: { "form-receiver": [1] }`. A provider says which it implements, `provides: { "form-receiver": 1 }`. They match when the numbers are equal. A different number is "not compatible", shown as unavailable. |
| 7   | A consumer saves its settings for a provider under the provider's id in its own data. When the provider is removed, the saved settings stay, are ignored, and work again if it is installed again. |
| 8   | **Data first, code when needed** (**D12**, replacing "code is for first-party apps"). A data provider declares a request in `app.json`; the site's Worker makes it, so it works **on every plan**. A provider with code (`worker.js`) runs in spec 1's sandbox, reaching only its `worker.hosts` (D20), and needs **Workers Paid** (D1); a site's own app runs it directly (D16). |
| 9   | **Every basic function has a built-in provider** (**D14**). A contract for a function a site needs names its built-in, which lives in the core and needs no app server code. In a **many** contract, apps **add to** the built-in (form receivers). In a **one** contract, an app **replaces** it after asking, as the one-app types do (site search, later, D19). When the app is removed, turned off or paused, the built-in takes over again. |
| 10  | **What Cloudflare offers for free is built in; another supplier is an app** (**D15**). The built-in email receiver sends with the site's own Cloudflare email sending (D10, **verify** in spec 4). SMTP, Mailgun, SendGrid, Brevo and the like are connector apps that add to it. |
| 11  | **A failing provider never blocks the others and never loses the caller's data** (**D21**). Each provider is called on its own; the caller saves what must not be lost first (a form's answer is in storage before any receiver runs). A store provider's failure follows spec 1's escalation (D34) and counts for its publisher (D35). |
| 12  | The owner sees, before turning a provider on, what it receives and where it goes. The contract supplies the sentence ("the answers visitors give in forms"), the provider's `worker.hosts` supply the hosts. |
| 13  | The first contract is **`form-receiver`**, version 1, many providers, built-in `email`. Its exact shape belongs to spec 4. This spec registers it and tests the mechanism with it. |
| 14  | The store's catalog entry carries `provides`, `uses` and `needs`, as it carries `role` and `category`, so the Appstore can say "Adds to Forms", "Works with Mailchimp" and, for a code provider, "Needs Workers Paid". |

## User stories

Provider side

1. As an app author, I declare `provides: { "form-receiver": 1 }`, so the platform knows what my app offers.
2. As an app author, my app brings its own settings fields to the consumer's screen (a Mailchimp tag, an email address), so I never need a screen of my own.
3. As an app author, I write a provider as data (a request template) with no code, and it works on every site, Free plan too.
4. As an app author, I write a provider with code when a request is not enough (a supplier's HTTP API with a signed call); it runs in the sandbox, reaches only the hosts I list, and needs Workers Paid.

Consumer side

5. As an app author, I declare `uses: { "form-receiver": [1] }`, so my app works alone and gains features when a provider exists.
6. As an app author, I ask the platform for the active providers of a contract and call them, without knowing which apps or built-ins they are.
7. As an app author, a provider that fails never breaks my app: I get a failed result per provider, and what I saved first is safe.

Owner side

8. As a site owner, a feature that needs a missing provider shows as unavailable with the apps that would add it, not as an error.
9. As a site owner, I see what a provider receives and where it sends it before I turn it on.
10. As a site owner, removing, turning off or pausing a provider app switches off only what it added, the built-in takes over, and my settings return when I install it again.
11. As a site owner, my forms email me with no app at all, and I add more receivers when I want them (D25).
12. As a site owner, I choose the one provider when the contract allows only one, and the editor deactivates the other after asking.

Store side

13. As a site owner browsing the Appstore, I filter by what an app adds to ("Adds to Forms"), and I see which need Workers Paid.

## What the owner sees

- The permission dialog of a provider (`ask`, as for the other apps) gets a line from the contract: en "This app receives the answers visitors give in your forms and sends them to {host}." The Danish text goes in `da-DK`.
- Where a consumer lists providers (in Forms: "Send to"), the built-in comes first. An uninstalled provider that a form still points to shows as "{name} is not installed" with a link to the Appstore; a not compatible one "{name} needs an update"; a paused one "{name} is paused" with the reason from the app's page (Workers Paid, a new version, failing).
- An app with `needs` and no provider cannot be turned on: the dialog names the apps that provide it.
- No new screen. The standard parts only (`ListItem`, `SwitchRow`, `ask`).

## Design

### The registry: `lib/appContracts.mjs` (new, pure, tested)

| Export | Shape | Meaning |
| ------ | ----- | ------- |
| `CONTRACTS` | `Record<id, { versions: number[], many: boolean, receives: string, builtin?: string }>` | The known contracts. `receives` is the key of the owner's sentence in `src/i18n`; `builtin` names the core's provider. |
| `providersOf(contract, version, apps, active)` | `(…) => string[]` | The built-in (if any) and the ids of active apps that provide that version. For a **one** contract, the active app if there is one, else the built-in. Sorted, built-in first. Empty for an unknown contract. |
| `contractProblems(manifest)` | `(manifest) => string[]` | The problems of the three keys, one English sentence each (below). |
| `unavailable(consumer, apps, active)` | `(…) => { contract, why: 'missing' \| 'incompatible' \| 'paused' }[]` | What a consumer's `uses` and `needs` lack. `needs` unmet means the app cannot be turned on. |

`active` comes from `activeOf` (`lib/appsFile.mjs`) minus the apps spec 1 has paused (`app_failures.paused_at`, the
Free plan, contract 6 or older).

### The manifest (`lib/appManifest.mjs`)

- `KEYS_7` includes `provides`, `uses`, `needs`, read only when `api` is 7.
- `provides`: an object, contract id to a version number the registry knows.
- `uses`: an object, contract id to a non-empty list of versions the registry knows. `needs`: the same.
- A contract id is in at most one of `uses` and `needs`, and not in `provides` as well (an app does not consume what it provides).
- A provider of a contract has what the contract requires: for `form-receiver`, a `receiver` key (data, below) or a `worker.js`, never both. A code provider without the export fails at run time as kind `error`, shown on its page.
- Every host a provider reaches is in `worker.hosts` (D20), data or code: the request is made by the site's server, not the visitor's browser, so `csp` never lists it. A data provider has `worker.hosts` and no other `worker` key.
- A plugin (`role: "plugin"`) may not declare a provider that reaches a host: that is a connector. The existing rule applies unchanged.

### The runtime (`worker/providers.js`, new)

`callProviders(env, contract, method, input, only?)` finds the active providers and calls each by its kind:

| Provider | Called as | Plan |
| -------- | --------- | ---- |
| **Built-in** | A direct call to the core's module (`worker/builtins/<contract>.js`; the email receiver: `email.js`, spec 4). | every plan |
| **Data provider** | `receiver` in `app.json` is a request template with placeholders, validated like `mediaProviders` (https, a name host, no port, host in `worker.hosts`). The Worker fills and sends it: 10 s, 1 MB answer, no redirect. | every plan |
| **Code provider, own app** | A direct call of `provides[contract][method](args, tools)` from the app's `worker.js`, imported by `worker/apps.js` as today (D16). | every plan |
| **Code provider, store app** | `sandboxOf(env).run(app, 'provide', { contract, method, args })` (spec 1); the shim calls the same export inside the sandbox, with the app's scoped `tools`. | Workers Paid |

- Each call resolves `{ provider, ok: true, value }` or `{ provider, ok: false, kind, message }`; `callProviders` never
  throws and never waits for one provider before starting another (`Promise.allSettled`). It keeps no pending I/O in
  module memory (`scripts/pending-shared.test.mjs`).
- A store provider's `{ ok: false }` is recorded by spec 1's host (`app_failures`); a data provider's failure is recorded
  the same way under its app, with kind `outbound`, `timeout` or `error`. A built-in's failure shows on the consumer's
  screen (Forms) and never pauses anything.
- The caller saves first: `callProviders` takes data that is already stored (Forms passes the answer's id and values).
  Retrying a failed provider is the caller's choice (spec 4).
- **For a consumer's code**: a store app that `uses` a contract gets `tools.providers.call(contract, method, args)`, spec
  1's scoped stub, which refuses a contract the app does not `use`. An own app gets the same over `callProviders`. The core
  calls `callProviders` directly.
- **The list of providers** is read from the apps' `app.json` (`provides`), never by importing a store app's code:
  `worker/apps.js` keeps importing own apps only (spec 1).

### Settings

A provider's `fields` (data, standard `Field`s) are drawn by the consumer's screen. Values are saved in the consumer's
data under `providers.<providerId>`. The built-in's fields (the owner's address, D25) are the consumer's own.

### The editor

- `src/apps.ts` and `src/AppList.tsx` read `unavailable` for each app and show the states above.
- The permission dialog adds the contract's `receives` sentence and the provider's `worker.hosts`.
- The one-provider case reuses `rivalsOf` and `withRivalsOff` (`lib/appTypes.mjs`), keyed by contract instead of category;
  the built-in is never a rival: it steps back while an app is active and returns when none is.

### The store and the apps

- `morpheme-appstore`: the entry keeps `provides`, `uses`, `needs` as it keeps `role` (the plan checks whether
  `problemOf` in `src/registry.js` refuses unknown keys), and marks a code provider "Needs Workers Paid".
- `morpheme-apps`: `scripts/app-entry.mjs` writes the keys. Mailchimp gets `provides` and `worker.hosts` in its next
  version, on contract 7 (a version is for ever).
- `docs/app-contract.md`: the "Contract 7" section shared with specs 1 and 2. `docs/store-categories.md`: the filter.

## The first testers

- **Forms** (spec 4) is the consumer, in the core. It stores each answer (spec 2), then calls the providers. Tested with the
  built-in alone, and with the built-in failing.
- **The built-in email receiver** (D10) is the first built-in, always offered, on by default for a new form (D25).
- **Mailchimp** is the first app provider, as data: its embedded-form `action` URL (already in its `app.json`, pattern
  `FORM` in `form.ts`) becomes the request template. It keeps working as the pop-up it is today.
- **A fixture receiver with code** over an HTTP API tests the store code path in the sandbox, and is one of spec 1's
  measured apps on staging (D13). SMTP waits for TCP (spec 1, out of scope).

## Tests

- `lib/appContracts.test.mjs`: registry, `providersOf` with built-ins (many: built-in plus apps; one: app or built-in), `unavailable` with `paused`, every manifest problem.
- `worker/providers.test.mjs` with spec 1's fake sandbox: each provider kind; a failing, slow or paused provider does not stop the others; a host off `worker.hosts` is refused; a built-in takes over when the one app is paused; nothing is kept in module memory.
- `lib/appManifest.test.mjs`: contract 7 keys accepted, earlier contracts refuse them, `worker.hosts` required for a data provider.
- A fixture consumer and three fixture providers (data, own code, store code) in `lib/fixtures/`, so the mechanism is tested before Forms exists.

## Out of scope

- The shape of `form-receiver`, the built-in email receiver's sending, and the receivers' retry (spec 4).
- SMTP and anything over TCP (`connect`, spec 1); email suppliers are reached over their HTTP APIs.
- Site search and its built-in (D19, a later version), the first **one** contract.
- The store's paid pause (0.25): it is one more reason for decision 5, nothing else here changes.
- Contracts between a theme and an app (themes know no app).
- A provider that is also a consumer of a third app (allowed by the rules, not designed here).

## Open questions

None. **Secrets of a provider** (answered, D43): a field type `secret` whose value the Worker keeps sealed in D1, as
image providers keep theirs (`needsKey`), and puts into the request; it is never in Git, never given to the app's code
and never shown again.

## Batches

Spec 1's batch 1 (contract 7, `placesOf`) comes first; batch 3 here waits for spec 1's batch 2 (the sandbox and stubs).

1. The rule: `lib/appContracts.mjs`, the keys in contract 7, built-ins in the registry, tests, `docs/app-contract.md`.
2. The Worker, every plan: `worker/providers.js` with built-ins, data providers and own apps' code, tests.
3. The Worker, sandbox: store code providers through `sandbox.run(…, 'provide', …)`, `tools.providers`, the failures into
   `app_failures`, the fixture store receiver.
4. The editor: states (paused included), permission dialog, built-in first, texts in both languages.
5. The store and the apps: the entry keys and "Needs Workers Paid", Mailchimp on contract 7 (released after the owner's
   yes), the Appstore filter.

The changeset level depends on the base branch (skill `changesets`).
