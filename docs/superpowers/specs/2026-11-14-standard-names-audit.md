# Standard names audit

Owner, 14 Nov 2026: "This is a general problem that we rename standards." **Use the standard names, never rename them**:
Material 3's names for components, states and actions, and the web's established terms.

This file is an audit and a plan only. Nothing is renamed here.

## How it was read

- **Material 3:** read with Playwright on 14 Nov 2026: `/components` and the overview of every component the theme has,
  `/foundations/interaction/states/overview`, `/foundations/content-design/global-writing/word-choice`, the style guide's
  `word-choice` and `ux-writing-best-practices`, and the guidelines or specs of switch, lists, menus, dialogs, bottom
  sheets, snackbar, text fields, chips and app bars. Quotes below are copied from those pages.
- **Web standards:** MDN, developers.google.com, w3.org and ogp.me are blocked by this session's network (proxy 403), so
  their pages were **not read**. Where a row cites a web standard it cites the standard's own name in code (the HTML
  attribute, the meta name, the link relation), which is the standard itself, not a page about it. The build PRs quote
  the MDN or Google page once a session can reach it.
- **Our names:** `src/i18n/en-US/`, `defaults/*.ts`, `theme/ui/`, `theme/blocks/`, `src/themeUi.ts`, `theme/styles/*.css`,
  `docs/*.md`.
- The M3 global writing page has no list of standard action words; it says: "Reduce technical jargon … Descriptions
  should be simple" and "Clarify words that have multiple meanings. 'Home' could reference a homepage or where someone
  lives." Where a standard name is jargon to a site owner, the row says so and asks.

Rec. = recommendation: **Rename**, **Keep** (with the reason) or **Ask** (question in the last section).

## 1. Web terms in the editor (SEO, links, images)

| Where | We say | Standard | Rec. |
| :--- | :--- | :--- | :--- |
| `media.ts` `alt`, `altHint` | "Describe the image" (field label) | HTML `alt` attribute: **Alt text**. Our own `blocks.ts` `picture.alt` and `defaults/collections.ts` `imageAlt` already say "Alt text" | **Rename** to "Alt text", keep the hint |
| `text.ts` `sectionImageAlt` | "Image description" | **Alt text** (as above) | **Rename** |
| `media.ts` `commit.alt` | "change the text of …" | **alt text** | **Rename**: "change the alt text of …" |
| `forms.ts` `address`, `defaults/collections.ts` `path` (pages, posts), `parts.ts` `sample.address` | Field label "URL" | **URL** | **Keep** |
| `forms.ts`, `redirects.ts`, `check.ts`, `assistants.ts`, `apps.ts`, `forms.links`, `defaults/collections.ts` profiles, `text.ts` `linkAddress` (≈70 strings) | "address", "Other address", "Copy address", "Allowed addresses" for the same thing | **URL** (the field the owner types it in is already labelled URL) | **Ask** (Q3) |
| `defaults/collections.ts` `seoTitle` | "Google title" | HTML `<title>` element: **title tag** / meta title | **Ask** (Q2) |
| `defaults/collections.ts` `seoDescription`, `forms.seoRating.*` | "Google description" | `<meta name="description">`: **Meta description** | **Ask** (Q2) |
| `defaults/collections.ts` `canonical`, `forms.seoRating.noCanonical` | "Original page" | `rel="canonical"`: **Canonical URL** (our own code comment says "Canonical URL") | **Ask** (Q2) |
| `defaults/collections.ts` `noindex`, `nofollow` | "No index", "No follow" | robots values `noindex`, `nofollow` | **Keep**: owner decision 13 Nov (conformance audit Q6). The standard spells them as one word; the owner chose two |
| `defaults/collections.ts` `shareImage`, `shareTitle`, `shareDescription` | "Image / Title / Description when shared" | Open Graph `og:image`, `og:title`, `og:description` | **Ask** (Q2) |
| `defaults/collections.ts` `unlisted`, `library.status.unlisted` | "Hidden" | Common CMS term "Unlisted" | **Keep**: owner decision 13 Nov ("Hidden stays"). Conflicts with `CLAUDE.md`, which calls Hidden the SEO setting; that line is already queued for a fix (conformance audit row 26) |
| `defaults/collections.ts` standard pages, `library.themeShots`, `forms.entry.standardPage` | "Front page" (and `redirects.toHint` says "home page") | **Home page**: M3 global writing uses "homepage"; the product uses both | **Rename** to "Home page", one spelling everywhere |
| `forms.ts` `fixedPages`, `forms.versions.standardPage`, editor menu | "Default pages", "standard page" for the same setting | One name. No web standard | **Rename** to "Default pages" everywhere |
| `company.ts` `brand.icon`, `newIcon`; `common.parts.brand` | "Icon", "Logo and icon" | **Favicon** (the icon in the browser tab) | **Ask** (Q6) |
| `defaults/collections.ts` layout, `parts.ts` `layouts` | "Left side panel", "Right side panel" (stored value `sidebar-left`) while the global setting is "Side column" | **Sidebar** (HTML `<aside>`; our own stored value) | **Ask** (Q5) |
| `text.ts` `checkList` | "Check list" (the block is "Checklist") | **Checklist** | **Rename** |
| `seo.ts` `kindFilter`, `blockSettings`, `parts` | "Kind" in some filters, "Type" in others | One word: **Type** | **Rename** |
| `defaults/collections.ts` hint, `collections.ts` `reg` | "e.g.", "Reg. no." | M3 style guide: "Avoid Latin abbreviations in UI text such as e.g. or etc. Instead, use full phrases like 'for example'" | **Rename**: "for example", "Registration number" |

## 2. States and actions in the editor

M3 states page: "An enabled state communicates an interactive component or element." "A disabled state communicates an
inoperable component or element." M3 switch guidelines: "Switches toggle the selection of an item on and off … They make
a binary selection: On and off".

| Where | We say | Standard | Rec. |
| :--- | :--- | :--- | :--- |
| `defaults/collections.ts` promotion, `defaults/internalLinks.ts`, `defaults/privacy.ts` (switch labels) | "Activated" with On/Off | Switch: **On / Off**; the label names the setting | **Ask** (Q1) |
| `apps.ts` `deactivated` | "Deactivated" (beside "Enabled") | One pair | **Ask** (Q1) |
| `blockSettings.ts` `active`, `inactive` | "Enabled" / "Disabled" for a block that is offered or not | M3: Disabled means *inoperable* (greyed), not *switched off* | **Ask** (Q1) |
| `app.ts` `blocksOff` | "Turned off" | Same as above | **Ask** (Q1) |
| `forms.ts` `links.done` (submit of the link sheet, `LinkList.tsx`) | "Done" | M3 dialogs: "The confirmation action should be clear about what happens next, like Send or Create. Avoid using vague terms like Done, OK, or Close." | **Rename** to "Save" |
| `common.ts` `pickColor`, `phoneCode.title`; `forms.ts` `pickIcon`, `pickImage`; `media.ts` `pick` | "Pick", "Choose" and "Select" for the same act | M3 uses **select** throughout: "Segmented buttons help people select options", "Date pickers let people select a date" | **Ask** (Q4) |
| `parts.ts` `use.*` (`foldList`, `foldSection`, `unfold`, `sample.foldOut`) | "fold out", "unfold" | M3 lists and the repo's own blocks: **Expand / Collapse** | **Rename** |
| `common.ts` `delete` / `remove` | Delete (file, page, redirect) vs Remove (from a list, a block from the page) | M3 pages read print no rule | **Keep**: used consistently (Delete removes the thing, Remove takes it out of a place) |
| `common.ts` `cancel` | "Cancel" | M3 dialogs: "The close icon or dismissive action, such as Cancel or Back" | **Keep** |

## 3. Component names in the editor's texts (mostly the Components screen)

The Settings row is "Components" (`common.parts.editorParts`), but its screen says "parts". M3: "Components are
interactive building blocks for creating a user interface."

| Where | We say | M3 name (page) | Rec. |
| :--- | :--- | :--- | :--- |
| `parts.ts` `intro`, `filter.search`, `filter.none` | "parts", "Search the parts" | **Components** (`/components`) | **Rename** |
| `parts.ts` `tokens` (screen "Values") | "Values" | **Tokens** (the repo's own `md.sys.*` design tokens) | **Rename** |
| `parts.ts` `tokens.parts.textField` | "Fields" | **Text fields** | **Rename** |
| `parts.ts` `use.sheet`, `sheetBody`, components `bottomSheet` text | "The sheet from the bottom" | **Bottom sheet** ("Bottom sheets show secondary content anchored to the bottom of the screen") | **Rename** |
| `parts.ts` dialog text | "A box over the page" | **Dialog** ("A dialog is a modal window that appears in front of app content") | **Rename** |
| `parts.ts` `use.selectRow` | "A box for the choice" | **Checkbox** | **Rename** |
| `parts.ts` snackbar text | "an action, or a cross" | **Close button** (snackbar anatomy: "Close button (optional)") | **Rename** |
| `parts.ts` `use.mainDrawer` | "The editor's menu … the menu button at the start of the top bar" | **Navigation drawer**, **app bar** ("App bars are placed at the top of the screen") | **Rename** |
| `parts.ts` `use.fields`, `use.menuRow` | "a small box with an arrow" | **Menu** with a **dropdown icon** (text fields: "A dropdown arrow indicates that a text field has a nested selection component") | **Rename** |
| `parts.ts` `use.colorSwatches` | "small rounds" | Plain English: circles. No M3 name | **Rename** |
| `parts.ts` `use.colorTiles` | "a pen that opens…" | **Edit** icon button | **Rename** |
| `blocks.ts` `rows.parts.title`, `rows.parts.text` | "Top line", "Bottom line" | List item **label text**, **supporting text** (lists specs: "Default content: Label text, supporting text") | **Rename** |
| `blocks.ts` `segmented` | "Segmented list" | M3 lists: "Choose between standard and segmented styles" | **Keep** (standard) |
| `blocks.ts` `accordion` | "Expandable list" | Web pattern **Accordion** (WAI-ARIA Authoring Practices; our folder is `theme/blocks/accordion`) | **Ask** (Q7) |
| `blocks.ts` `hero` | "Banner" | Web **hero**; our folder is `theme/blocks/hero`. "Banner" is ARIA's name for the site header and M2's name for a message bar | **Ask** (Q7) |
| `defaults/collections.ts` promotion type | "Pop-up", "Action bar" | "Pop-up" is the web term; M3 has no action bar: **docked toolbar** ("Two expressive variants: docked toolbar and floating toolbar") | **Keep** Pop-up; **Ask** (Q7) for Action bar |

## 4. Theme part names (`theme/ui/`, `src/themeUi.ts`, CSS)

All other files in `theme/ui/` already carry M3's names (BottomSheet, SideSheet, SegmentedButton, ButtonGroup,
SplitButton, FabMenu, NavigationRail, Snackbar, LoadingIndicator …).

| Where | We say | M3 name (page) | Rec. |
| :--- | :--- | :--- | :--- |
| `theme/ui/TopAppBar.tsx`, `SiteTopAppBar` | Top app bar | **App bar** ("Four variants: Search app bar, small, medium flexible, large flexible") | **Rename** with the old name kept as an alias (THEME_API stays 4; drop it at the next bump) |
| `theme/ui/ExposedDropdownMenu.tsx`, `SiteExposedDropdownMenu` | Exposed dropdown menu | M3 menus: "Dropdown menu and exposed dropdown menu are now both referred to as menu" | **Rename** to `TextFieldMenu` (text fields guidelines: "Text field dropdown menus"), alias as above |
| `theme/blocks/Panel.tsx`, `.block-panel` | Panel | An **outlined card** (it is `Card` inside) | **Keep**: `@theme/blocks/Panel` and `.block-panel` are in the theme and app contracts (stored names); note "Panel = outlined card" in its comment |
| `parts.ts` `tokens.shape.radius`, `elevation.shadow` | "Panels" | No M3 name for that token | **Keep** |
| `theme/styles/*.css` `md-nav-*`, `md-drawer-*`, `md-footer-*` | — | Already M3 words | **Keep** |

## 5. Docs

| Where | We say | Rec. |
| :--- | :--- | :--- |
| `docs/app-contract.md` | "Slots", "Places", "Widgets" | **Keep**: our own contract concepts; no standard names them |
| `docs/material-deviations.md` | M3 names throughout | **Keep** |
| `CLAUDE.md` *Word choice* | "Toggles and states: `Enabled` / `Disabled`, `On` / `Off`" | Conflicts with M3 states (Disabled = inoperable). Change only after Q1 |
| `CLAUDE.md` *Word choice* | "`Hidden` is the SEO setting `Hide from search engines`" | Already wrong (owner decision 13 Nov); fix with the No index PR |
| `CLAUDE.md` *Image everywhere* | "image", not "picture" | **Keep**: matches the web (`<img>`, "alt text") and M3 ("image" in list anatomy) |

## 6. A check: `standard words` in `scripts/check-language.mjs`

Built **after** the renames, so it starts green. It sits next to the `picture` rule in `scripts/check-language.mjs` (same
files, same allowlist style), so `npm run check:language` and CI run it with no new job.

- A table `STANDARD_WORDS`: `{ banned: /regex/, say: 'standard word', source: 'M3 page or spec name' }`. First entries:
  `Describe the image` / `Image description` → Alt text; `Google title`, `Google description`, `Original page` → the Q2
  answers; `Activated`, `Deactivated`, `Turned off` → the Q1 answer; `Check list` → Checklist; `fold out`, `unfold` →
  expand; `sheet from the bottom` → bottom sheet; `Top app bar` → app bar; `Exposed dropdown` → menu; `e\.g\.` → for
  example; `Front page` → Home page; and `address` → URL if Q3 says so.
- Paths: the English texts only (`src/i18n/en-US/`, the English strings of `defaults/*.ts`, `docs/` except
  `docs/superpowers/`, `release-notes/i18n/en-US/pending/`, `.changeset/*.md`). Danish files are never checked.
- `STANDARD_ALLOWED`: stored names with a reason, the same shape as `PICTURE_ALLOWED`: i18n keys (`alt:`, `address:`),
  field names (`seoTitle`, `canonical`, `unlisted`), CSS classes (`.block-panel`), component aliases kept for THEME_API 4,
  and the literal `noindex`/`nofollow`.
- Output: `path:line  Say "Alt text", not "Describe the image" (source)`, and exit 1. A new home-made word is added to the
  table by the PR that finds it.

## 7. Build plan (small PRs into `0.18`)

Every PR below that changes a text the owner sees carries this rule: **"When a change the owner can see (the editor or
the site) is done and `check` is green, add before and after screenshots of every changed screen to a comment on your own
pull request, as the `pm` skill's *Screenshots in the pull request* says, and tell the PM with the link and head sha. A
change nobody sees needs none."** Each renames the English text and its key in `defaults/i18n/da-DK/` (keyed by the
English string) and keeps the Danish translation's meaning; `check:content` and `check:language` must stay green.

| # | PR | Area | Changeset | Needs |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Alt text, Checklist, Type, Home page, Default pages, Done → Save, e.g. and Reg. no. (the **Rename** rows of 1 and 2) | Editor texts | `patch` + release note | — |
| 2 | Components screen: components, tokens, text fields, bottom sheet, dialog, checkbox, close button, navigation drawer, app bar, expand, label/supporting text (section 3) | Editor texts | `patch` (release note: one line) | — |
| 3 | SEO fields (title, description, canonical, Open Graph) and their rating texts | Editor texts | `patch` + release note | Q2 |
| 4 | URL everywhere | Editor texts | `patch` + release note | Q3 |
| 5 | States: switch labels and app/block status words; `CLAUDE.md` *Word choice* line | Editor texts, rules | `patch` + release note | Q1 |
| 6 | Pick/Choose → one verb | Editor texts | `patch` | Q4 |
| 7 | Sidebar, favicon, block names (Accordion, Hero, toolbar) | Editor and site texts | `patch` + release note | Q5–Q7 |
| 8 | `AppBar`, `TextFieldMenu` with aliases, `Panel` comment; `docs/app-contract.md` lists the new names | Theme | `minor` (new export names; THEME_API stays 4 while the aliases live) | — |
| 9 | The check (section 6) | Script | empty | 1–8 merged |

## 8. Questions for the owner

1. **Enabled/Disabled vs On/Off.** `CLAUDE.md` allows both, but M3 says Disabled means "an inoperable component" (greyed
   out), not "switched off". Today we mix Activated, Deactivated, Enabled, Disabled and Turned off. **Recommend:** a
   switch's states and the status they give are **On / Off** everywhere ("Off" beside a block or an app); "Disabled"
   only for a greyed-out control; the switch label names the setting ("Promotion", "Internal links"), not "Activated".
2. **SEO and sharing fields.** Standard names are title tag, meta description, canonical URL and Open Graph title,
   description and image. They are jargon, which M3 asks us to reduce. **Recommend:** "Meta title", "Meta description",
   "Canonical URL", and under "Social media" keep "Image/Title/Description when shared" with the Open Graph name in the
   hint (no single standard owner word exists there).
3. **URL vs address.** The field says URL; about 70 messages say "address". **Recommend:** URL everywhere.
4. **Pick / Choose / Select.** **Recommend:** "Select", M3's verb on every selection component.
5. **"Left side panel" and "Side column"** name the same column. **Recommend:** "Sidebar" (the web term and our stored
   value `sidebar-left`).
6. **"Icon" under Logo and icon.** **Recommend:** "Favicon", with the hint "The icon in the browser tab".
7. **Block names.** "Expandable list" is an **Accordion**, "Banner" is a **Hero**, and the promotion's "Action bar" is
   M3's **docked toolbar**. **Recommend:** Accordion and Hero (the web terms, and our own folder names); keep "Action
   bar" for site owners, since "docked toolbar" names a component, not what the visitor sees.
