# Appstore categories

Every app and theme in the Appstore has one main category (`category`) and, optionally, a subcategory of it
(`subcategory`). The list of ids is `CATEGORIES` in `lib/storeCategories.mjs`; the editor's names are in
`src/i18n/*/apps.ts` (`categories`). The Appstore's category filter lists the 15 main categories.

## The main categories

| Id           | Name        | What belongs in it                                                                                         |
| ------------ | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `analytics`  | Analytics   | Visits, behavior, conversions                                                                              |
| `appearance` | Appearance  | Themes, widgets, animations, styling add-ons                                                               |
| `booking`    | Booking     | Appointments, reservations, calendars                                                                      |
| `connectors` | Connectors  | Apps that link the site to another system (webhooks, automation, CRM, accounting) and have no better home |
| `email`      | Email       | Newsletters, subscribers, automated messages                                                               |
| `forms`      | Forms       | Contact forms, surveys, submissions                                                                        |
| `languages`  | Languages   | Translation, language switching                                                                            |
| `links`      | Links       | Apps of the type `links`; only one can be active (see Rules)                                                    |
| `payments`   | Payments    | Cards, MobilePay, invoices, donations                                                                      |
| `privacy`    | Privacy     | Cookie consent, GDPR, accessibility                                                                        |
| `redirects`  | Redirects   | Apps that send visitors from old addresses to new ones; only one can be active (see Rules)                     |
| `security`   | Security    | Spam protection, bot checks, access control                                                                |
| `seo`        | SEO         | Sitemap, schema, meta tags                                                                                 |
| `shop`       | Shop        | Products, cart, checkout, orders                                                                           |
| `social`     | Social      | Feeds, sharing, embeds                                                                                     |

## Rules

- `links` and `redirects` are also app types of which a site runs only one active app (`ONE_APP_TYPES` in
  `lib/appTypes.mjs`, `docs/app-contract.md`), so they must stay valid ids. Where they belong in the final taxonomy
  (for example `redirects` as a subcategory of `seo`) is still to be decided.

- Apps are atomic: one app, one function. There are no all-in-one apps; an app that does two things is two apps.
- An item has one main category and an optional subcategory of it. A subcategory belongs to exactly one main category.
- No subcategories exist yet: `SUBCATEGORIES` in `lib/storeCategories.mjs` has an empty list for every category, and
  later entries are added there. A subcategory that is not listed for the item's category is dropped.
- The editor reads categories leniently (`categoryOf`). An item with an unknown category stays in the catalog, without
  a category.
- The old ids `newsletter`, `payment` and `design` are still accepted and mapped to `email`, `payments` and
  `appearance`. The old id `content` has no new home and is dropped.
- A theme sets `category` and `subcategory` in its `theme.json`; an app sets them in its `defineApp`.

## Where the catalog lives

The catalog itself (each app's and theme's entry) lives in the separate `morpheme-appstore` repository. This repository
only reads `category` and `subcategory` from it.
