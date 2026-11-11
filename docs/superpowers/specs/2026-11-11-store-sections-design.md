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

1. **The rule.** `lib/storeCategories.mjs`, its tests, `docs/store-categories.md`, `docs/app-contract.md` (the `role` row).
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
4. **Grouping installed apps.** Whether Settings › Apps should also be grouped by section is left for a later change.
