# The Appstore's three sections: Themes, Connectors, Plugins

> **Status:** draft of 11 November 2026, written against `main` at `57b7591` (`@morphemecms/cms` 0.14.2). The owner chose
> the three sections; the rest is proposed. It answers open question 5 of `2026-11-11-mcp-design.md` and replaces the
> category `connectors` in `docs/store-categories.md`. Nothing here is built, and **development starts in 0.16**, not before
> (the owner's decision of 11 November 2026): the plan is written when 0.16 begins.

## Goal

The Appstore shows what the owner can add to a site in three sections:

| Section        | What it is                                                                    | Danish label |
| -------------- | ----------------------------------------------------------------------------- | ------------ |
| **Themes**     | How the site looks.                                                           | Temaer       |
| **Connectors** | Apps that connect the site to an outside service (a SaaS).                    | Forbindelser |
| **Plugins**    | Apps that add functionality to the site, with no outside service behind them. | Udvidelser   |

Today the Appstore has two kinds of item, `app` and `theme` (`items.kind` in `morpheme-appstore`, the id prefix `app_` or
`theme_`), and the apps share one list with a filter of 13 topic categories, one of which is `connectors`. A connector is a
kind of app, not a topic, so it moves out of the categories and becomes a section.

## Decisions

| #   | Decision                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The store has three sections: Themes, Connectors, Plugins. A theme is a theme, as today. An app is a connector or a plugin.                                                                                                            |
| 2   | The split is a new field **`role`** of an app, with the values `connector` and `plugin`. A theme has no role. The store's `kind` (`app` or `theme`) and the ids (`app_…`, `theme_…`) do not change, so no id changes and nothing is renamed. |
| 3   | The test for a connector: the site's pages or its Worker **send data to, or load code from, the outside service** the app is for. Else it is a plugin. A connector may include blocks, slots and pop-ups.                              |
| 4   | The rule that an app does one thing stays. An app that is a plugin and also needs a service is two apps: a plugin and a connector.                                                                                                     |
| 5   | The topic categories stay and apply to themes, connectors and plugins alike. `connectors` leaves the list, so there are 12: `analytics`, `appearance`, `booking`, `email`, `forms`, `languages`, `payments`, `privacy`, `security`, `seo`, `shop`, `social`. |
| 6   | An entry that has no `role` is read as a plugin, as an unknown category is read leniently today (`categoryOf`). An entry with the old category `connectors` is read as a connector with no category.                                   |
| 7   | Only a connector may declare `mcp` (`2026-11-11-mcp-design.md`, part B). A plugin that declares it fails the check.                                                                                                                    |
| 8   | `role` is a field of `app.json`, like `category`. Contract 4 fails on unknown keys, so the field belongs to contract 5, the same contract as `mcp`. The editor reads both contracts.                                                    |
| 9   | **A plugin has no outside access.** Its `csp` lists no host and it declares no `mcp`. The build and the store refuse a plugin that does. Only a connector may list hosts. |
| 10  | The site's Content Security Policy is built from the active apps' `csp`. A plugin adds nothing to it, so the browser refuses any request or load a plugin makes to another host, even if its code tries. |
| 11  | A plugin's build code (hooks, `after-build.ts`) already runs in the sandbox with no network. A plugin's `worker.js` is a `full` place, which the CMS cannot sandbox, so the build refuses outside calls in it (a scan) and the plan looks at running it in an isolate with no outbound access (open question 4). |
| 12  | A link the visitor follows is not access (MobilePay's link opens an app). A request or a load made by the page or the Worker is. This is the same test as decision 3. |
| 13  | The rules apply to an app that says `role: 'plugin'` (contract 5). An app with no role is shown as a plugin by decision 6 but keeps its `csp` until it declares a role, so the five connectors keep working until their `1.1.0`. |
| 14  | A connector that asks for `reads` and lists hosts is the one way site data can leave the site. The store and the install dialog show the reads and the hosts together. |

## What the owner sees

- At the top of the Appstore, a switch with the three sections. The default is the section the owner last used, else Plugins.
- Themes shows today's theme store (`ThemeStoreScreen.tsx`). Connectors and Plugins show the app list (`AppList.tsx`)
  limited to that role. Each has the same search, sort and filters as today: Category (12 topics) and Status.
- A connector's card and page say which service it connects to: **Connects to Calendly** (Danish: Forbinder til Calendly).
  The service's name is the app's `hint`'s first words today; the plan adds a `service` text to the entry if that is not enough.
- The editor's Settings › Apps keeps one list of installed apps. A small label, Connector or Plugin, tells them apart.
  Grouping that list by section is not part of this change.

## Design

### The rule: `lib/storeCategories.mjs`

| Change                    | Detail                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CATEGORIES`              | Without `connectors`. The type `Category` follows.                                                                                                                      |
| `ROLES`                   | New: `['connector', 'plugin']`, with the type `Role`.                                                                                                                   |
| `LEGACY_CATEGORIES`       | `connectors` maps to `{ role: 'connector' }`. The other entries are as today.                                                                                           |
| `categoryOf(…)`           | Gives `{ category?, subcategory?, role? }`. Unchanged for an item that has no legacy id. Never throws.                                                                   |
| `roleOf(item)`            | New: `'connector'` or `'plugin'` for an app, `undefined` for a theme. A missing or unknown `role` gives `'plugin'`, except the legacy category above, which gives `'connector'`. |

### The editor

- `src/i18n/en-US/apps.ts` and `da-DK/apps.ts`: the section names, Connector and Plugin labels, and **Connects to**. The
  category `connectors` is removed from `categories`. `defaults/i18n/` gets no change.
- `src/AppList.tsx`: takes the role as a prop and filters by `roleOf`; the category filter lists the 12 topics.
- A screen with the three sections wraps `AppList` and `ThemeStoreScreen`; its choice is kept per browser.
- `docs/store-categories.md`: the row `connectors` is removed and a section "Sections" says decisions 1 to 4 and 6.
- `docs/app-contract.md`: `role` in the `app.json` table, as contract 5 (with `mcp`, which comes in with the MCP spec).

### Keeping plugins inside the CMS

| Where                                                            | What it enforces                                                                                                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/appManifest.mjs` (the build)                                | A plugin with a host in `csp`, or with `mcp`, is a build problem (decision 9). A connector with `mcp` or `csp` is fine.                                               |
| `problemOf` in `morpheme-appstore/src/registry.js`               | The same check when a version is released, so a plugin with hosts never reaches the catalog.                                                                          |
| The code that builds the site's policy from the apps' `csp`      | Nothing to change: a plugin lists no hosts, so it adds none (decision 10). The plan finds this code and adds a test with a plugin that tries to load a script.        |
| `lib/sandbox/bundle.mjs`                                         | For a plugin's `worker.js` and its other `full` code: refuses `fetch`, `WebSocket`, `XMLHttpRequest`, `connect` and a dynamic `import()` of a URL. A scan stops mistakes, not a determined author, which is why the store gives `full` only to first-party publishers (`docs/app-contract.md`, Places). |
| The install dialog and the app page                              | A plugin says **No outside access** (Danish: Ingen adgang udefra). A connector lists its hosts, and its `reads` beside them (decision 14).                             |

### The store (`morpheme-appstore`)

- The catalog entry carries `role` as it carries `category`. The plan checks whether `problemOf` in `src/registry.js` refuses
  unknown keys of an entry and allows `role` if it does.
- No D1 migration. The item's `kind` stays `app` or `theme`; `role` is part of the release entry, so a later version may
  change it, as it may change `category`.
- The store serves the catalog as before. The editor reads `role` from it.

### The apps (`morpheme-apps`)

- `scripts/app-entry.mjs` writes `role` into the entry and fails when it is not `connector` or `plugin`.
- Each app sets `role` in its `defineApp` (or `app.json`). A version is for ever, so an app gets its role with its next
  version, `1.1.0`; until then the store reads it as a plugin by decision 6.

| App                    | Role                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Calendly               | connector: the page loads Calendly's calendar.                                                                               |
| Mailchimp              | connector: the pop-up posts the signup to Mailchimp.                                                                         |
| Google Analytics       | connector: loads Google's tag.                                                                                               |
| Google Ads             | connector: loads Google's tag and sends conversions.                                                                         |
| Google Tag Manager     | connector: loads the owner's container.                                                                                      |
| Dynamic page colours   | plugin: no service.                                                                                                          |
| cookiescanner          | plugin (not released yet).                                                                                                   |
| MobilePay              | plugin by the test: the block shows a number and opens a link; nothing is sent to MobilePay. **Owner**: confirm, see below. |

## Batches

Each is its own pull request. The plan splits them further.

1. **The rule.** `lib/storeCategories.mjs`, its tests, `docs/store-categories.md`, `docs/app-contract.md` (the `role` row),
   and the checks that keep a plugin inside the CMS (`appManifest.mjs`, the scan in `bundle.mjs`) with their tests.
2. **The editor.** The three sections, the role filter, the labels, the texts in both languages, a changeset (its level is
   set by the owner when 0.16 begins; see `CLAUDE.md`) and a release note.
3. **The store and the apps.** `role` in the catalog, `app-entry.mjs`, and the apps' `1.1.0` releases.

Batch 1 and 2 need contract 5 to exist for `role` to be an `app.json` key; until then the editor reads `role` from the
catalog entry only. The plan orders this with the MCP batch that introduces contract 5.

## Open questions

1. **Owner: MobilePay.** A plugin by decision 3's test. The alternative is a connector, which makes the test "the owner has
   an account at the service". Recommendation: plugin.
2. **Owner: the words.** Danish for Plugins is proposed as Udvidelser. The editor's own word for what is installed stays
   "Apps" (Danish: Apps). Say if the sections should use other words.
3. **The field's name.** `role` avoids two words that already mean something: `kind` (the store's app or theme, and the
   `kinds` of an app's lists) and `type` (the one-app types, `lib/appTypes.mjs`).
4. **Owner: a plugin's Worker code.** The scan in decision 11 only stops mistakes. A real boundary needs the Worker to run
   plugin code in an isolate with no outbound access. Cloudflare's dynamic Workers (Worker Loader) are the candidate; I
   understand they can run code with outbound calls blocked, but this is not verified. The plan checks it first. Until then
   only first-party plugins have a `worker.js`, as today.

   **Checked on 11 November 2026 against Cloudflare's documentation** (Dynamic Workers, open beta since March 2026):
   - _Verified._ `env.LOADER.load()` or `get(id, callback)` runs code given as strings, and `globalOutbound: null` cuts
     it off from the network: `fetch()` and `connect()` throw
     ([egress control](https://developers.cloudflare.com/dynamic-workers/usage/egress-control/),
     [API reference](https://developers.cloudflare.com/dynamic-workers/api-reference/)). Left out, the default is the
     parent's full access, so the host must always set it.
   - _Verified._ The plugin gets only the bindings the host passes in `env`: custom `WorkerEntrypoint` stubs that the
     host scopes with `props` (for example a KV or D1 view with a per-plugin key prefix), no raw secrets
     ([bindings](https://developers.cloudflare.com/dynamic-workers/usage/bindings/)). This fits a plugin's `reads`.
   - _Verified._ CPU time and subrequests can be capped per invocation with `limits: { cpuMs, subRequests }`
     ([limits](https://developers.cloudflare.com/dynamic-workers/usage/limits/)). At most 4 distinct dynamic Workers
     can be in flight per request
     ([platform limits](https://developers.cloudflare.com/dynamic-workers/platform/limits/)).
   - _Verified._ Modules are JavaScript, Python or Wasm, with no build step: a plugin's `worker.js` must be bundled
     first (as `lib/sandbox/bundle.mjs` does). `compatibilityDate` is set per loaded Worker.
   - _Verified._ Requires the **Workers Paid plan**. Requests and CPU are billed at Workers Standard rates, plus
     $0.002 per unique dynamic Worker (code and id) per day beyond 1,000 a month
     ([pricing](https://developers.cloudflare.com/dynamic-workers/pricing/)). A plugin's code and id are fixed per
     version, so this is small.
   - _Verified._ The host Worker needs a `worker_loaders` binding in its wrangler config
     ([getting started](https://developers.cloudflare.com/dynamic-workers/getting-started/)). `starter/wrangler.jsonc`
     and `wrangler.jsonc` have none today; the starter's `compatibility_date` (`2026-09-01`) is later than the date the
     examples need, so nothing there blocks it.
   - _Not verified._ That a site on the Workers **Free** plan can use it (the docs say Paid only, so a site without
     Paid cannot run plugin Worker code); whether `worker.js` as `worker/index.js` runs it (the `@site/worker` alias,
     `global_fetch_strictly_public` and the `worker/*.js` rule on pending I/O promises) behaves as in the docs; the
     `ctx.exports` loopback from inside the CMS's Worker; cold-start and CPU cost per request; that the feature leaves
     beta. Miniflare is not a hardened sandbox, so local `wrangler dev` proves nothing about the boundary. Nothing was
     deployed to test these.
   - _Recommendation: needs a prototype, then use it._ The documented design is the right boundary: no network, only
     scoped bindings, capped CPU. Before the plan relies on it, one prototype on a throwaway Worker (not the live
     account's sites) must show a plugin `worker.js` loaded with `globalOutbound: null` fails on `fetch`, can use a
     scoped binding, and works from `worker/index.js` with the starter's flags. Until then only first-party plugins have
     a `worker.js`. The plan should also decide what a site on the Free plan gets (no plugin Worker code, shown in the
     install dialog).
5. **Grouping installed apps.** Whether Settings › Apps should also be grouped by section is left for a later change.
