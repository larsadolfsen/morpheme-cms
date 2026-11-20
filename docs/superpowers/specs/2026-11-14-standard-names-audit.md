# Standard names audit

Owner, 14 Nov 2026: "This is a general problem that we rename standards." **Use the standard names, never rename them.**
"I am talking about general naming of fields and features." "I want to keep naming with real names. Don't write fast
caching when it is R2 caching."

So every field label and every feature name is checked against the standard name for that thing: Material 3's, the
web's, or the real product's (Cloudflare, GitHub). A short explanation may sit in the hint under the standard name. This
file is an audit and a plan only. Nothing is renamed here.

## How it was read

- **Our names:** every field label and feature name in `src/i18n/en-US/` (forms, blocks, media, text, settings, apps,
  library, parts), `defaults/*.ts` (the page and post form, promotions, privacy, internal links, business, the menu), and
  their `da-DK` files where a name is a product's; then `theme/ui/`, `theme/blocks/`, `src/themeUi.ts`,
  `theme/styles/*.css` and `docs/*.md`.
- **Material 3:** read with Playwright on 14 Nov 2026: `/components` and the overview of every component the theme has,
  `/foundations/interaction/states/overview`, `/foundations/content-design/global-writing/word-choice`, the style guide's
  `word-choice` and `ux-writing-best-practices`, and the guidelines or specs of switch, lists, menus, dialogs, bottom
  sheets, snackbar, text fields, chips, cards and app bars. Quotes are copied from those pages.
- **Web standards:** MDN, developers.google.com, w3.org and ogp.me are blocked by this session's network (proxy 403), so
  their pages were **not read**. A row that cites a web standard cites the standard's own name in code (the HTML
  attribute, the meta name, the link relation), which is the standard itself. The build PRs quote MDN or Google once a
  session can reach them.
- M3's global writing page asks to "Reduce technical jargon". Where the standard name is jargon to a site owner, the row
  says so and asks the owner.

Rec. = **Rename**, **Keep** (with the reason) or **Ask** (question in the last section).

## 1. Fields

### The page and post form (`defaults/collections.ts`, `forms.ts`)

| Field (key) | We say | Standard name (source) | Rec. |
| :--- | :--- | :--- | :--- |
| Image text (`imageAlt`) | "Alt text" | HTML `alt` attribute: **Alt text** | **Keep** |
| URL (`path`) | "URL" | **URL** | **Keep**; but about 70 messages call the same thing "address" (Q3) |
| `description` | "Short description" | Used when there is no Google description (`forms.seoRating.noDescription`); CMSs call it "excerpt" or "summary"; no web standard | **Ask** (Q2) |
| `seoTitle` | "Google title" | HTML `<title>`: **title tag** / meta title | **Ask** (Q2) |
| `seoDescription` | "Google description" | `<meta name="description">`: **Meta description** | **Ask** (Q2) |
| `canonical` | "Original page" | `rel="canonical"`: **Canonical URL** (our own code comment says "Canonical URL") | **Ask** (Q2) |
| `noindex`, `nofollow` | "No index", "No follow" | robots values `noindex`, `nofollow` | **Keep**: owner decision 13 Nov (conformance audit Q6) |
| `shareImage`, `shareTitle`, `shareDescription` | "Image / Title / Description when shared" | Open Graph `og:image`, `og:title`, `og:description` | **Ask** (Q2) |
| `keyword`, `keywords` | "Main keyword", "Other keywords"; the rating says "primary keyword" | SEO: **focus keyword** / primary keyword; one name either way | **Rename** "Main keyword" to "Primary keyword" (the rating already says it) |
| `unlisted` | "Hidden" | Common CMS word "Unlisted" | **Keep**: owner decision 13 Nov ("Hidden stays") |
| `template` options | "Left side panel", "Right side panel" (stored `sidebar-left`); the global setting is "Side column" | **Sidebar** (HTML `<aside>`; our stored value) | **Ask** (Q5) |
| `image` (post) | "Image at the top" | **Featured image** (common CMS name; no web standard) | **Keep**: no standard; says where it shows |
| SEO rating "Search engines" section | "Search engines" | — | **Keep** |

### Block sheets (`src/i18n/en-US/blocks.ts`)

| Field (key) | We say | Standard name (source) | Rec. |
| :--- | :--- | :--- | :--- |
| Image `blocks.picture.alt` | "Alt text" | **Alt text** | **Keep** |
| Section background image `text.sectionImageAlt` | "Image description" | **Alt text** | **Rename** |
| Files: image's own text `media.alt` | "Describe the image" | **Alt text** | **Rename** (the hint keeps "Describe the image in a few words…") |
| Buttons, cards, price cards, pop-up (`button`, `buttonText`, `moreLabel`, `rowButtonText`) | "Button text" | M3 button anatomy: **label text** (dialogs specs: "Button label text") | **Ask** (Q8) |
| Lightbox (`viewer`, `open`, `previous`, `next`, `close`, `clear`) | "Name of the image viewer", "Open images bigger", "Previous button name", "Close button name", "Clear button text" | **Lightbox** (our own `theme/ui/Lightbox.tsx`); the hidden names are ARIA **labels** (`aria-label`) | **Rename**: "Lightbox label", "Open in lightbox", "Previous button label", "Close button label", "Clear button label" |
| Card style (`design`, `cardStyle`, `kind`) | "Design" in one block, "Card style" and "Style" in others; options Elevated, Filled, Outlined | M3 cards: "Three variants: elevated, filled, outlined" | **Ask** (Q8): one name; M3's is **Variant** |
| Heading under heading (`subhead`, `subheading`) | "Subhead" in one block, "Subheading" elsewhere | One name | **Rename** to "Subheading" |
| Rows from a list (`rows.parts.title`, `rows.parts.text`) | "Top line", "Bottom line" | M3 list item: **label text**, **supporting text** (lists specs: "Default content: Label text, supporting text") | **Rename** |
| Video (`video`, `url`) | "Video link" | **Video URL** | **Rename** with Q3 |
| Table column (`alignCenter`) | "Centre column" (beside "Align column left") | en-US spelling **Center**, as the other alignments | **Rename** "Center column" |
| `maxRows` | "Max rows" | M3 style guide: "Spell out words whenever possible" | **Rename** "Maximum rows" |
| `showFold` | "Fold out" | **Expand** (M3 lists and our own "Expandable list") | **Rename** |
| Accordion `only` | "Only one open" | — | **Keep** |
| Table `striped`, `header` | "Striped rows", "Header row" | Standard table terms | **Keep** |
| Image `caption`, `credit` | "Caption", "Credit" | HTML `<figcaption>`: **Caption** | **Keep** |
| Cookie list `lasts`, `provider`, `purpose` | "Duration", "Provider", "Purpose" | Standard cookie-policy columns | **Keep** |

### Settings, Files, Business and apps

| Field (key) | We say | Standard name (source) | Rec. |
| :--- | :--- | :--- | :--- |
| Logo and icon `company.brand.icon` | "Icon" | **Favicon** (the icon in the browser tab) | **Ask** (Q6) |
| Business `reg`, field hints | "Reg. no.", "e.g." | M3 style guide: "Avoid Latin abbreviations in UI text such as e.g. or etc." | **Rename**: "Registration number", "for example" |
| Social profiles `forms.links.address`, `defaults/collections.ts` profile `url` | "Address" | **URL** | **Rename** with Q3 |
| Text link sheet `text.linkAddress` | "Other address" | **URL** | **Rename** with Q3 ("Other URL") |
| Redirects `from`, `to` | "From", "To" | Standard redirect fields | **Keep** |
| Connector token `apps.mcpToken` | "Token" | the service's **token** | **Keep** |
| Media provider `media.providers.keyLabel` | "Access key" | Unsplash's own name: **Access Key** | **Keep** |
| Assistants `assistants.address` | "Address" | the MCP server **URL** | **Rename** with Q3 |
| Filters `seo.kindFilter` vs `library.kindFilter`, `media.kind` | "Kind" in one, "Type" in the others | One word | **Rename** to "Type" |
| Settings density, appearance | "Density", "Appearance" (Light, Auto, Dark) | M3 names | **Keep** |

## 2. Features

| Feature (where) | We say | Standard name (source) | Rec. |
| :--- | :--- | :--- | :--- |
| Settings row for the editor's parts (`common.parts.editorParts`) and its screen (`parts.ts`) | Row "Components", screen "parts", "Search the parts", "Values" for tokens | M3: "Components are interactive building blocks"; **tokens** | **Rename** the screen's words: "components", "tokens" |
| Settings row `common.parts.caching` | "Caching and builds" | **R2 caching**, Cloudflare **builds** | **Rename** "R2 caching and builds" (section 4) |
| Menu `common.parts.lists` vs editor menu "Lists" | "Dynamic lists" and "Lists" | One name | **Rename** to "Lists" |
| Menu `popups` (`defaults/collections.ts`) | Collection "Promotion", type "Pop-up", button "Open promotion" | "Pop-up" is the web term for the kind; "Promotion" is ours for the collection | **Keep** (a promotion can be a pop-up or an action bar) |
| Promotion type | "Action bar" | M3 has no action bar; the bar is a **docked toolbar** ("Two expressive variants: docked toolbar and floating toolbar") | **Ask** (Q7) |
| Default pages (`forms.fixedPages`, `forms.versions.standardPage`, menu) | "Default pages" and "standard page" | One name | **Rename** to "Default pages" |
| Default page "Front page" (`defaults/collections.ts`, `library.themeShots`) | "Front page"; `redirects.toHint` says "home page" | **Home page** (M3 global writing: "'Home' could reference a homepage") | **Rename** |
| Files (`common.parts.media`) | "Files", "Deleted files" | — (Dropbox and Drive use "Deleted files" / "Trash") | **Keep** |
| Not found log (`redirects.missing`) | "Not found" | HTTP **404 Not Found** | **Keep** |
| Internal links (`defaults/internalLinks.ts`) | "Internal links" | SEO term **internal links** | **Keep** |
| Cookie banner, Cookie policy, Privacy policy | as named | Standard | **Keep** |
| SEO rating (`seo.ts`) | "SEO rating" | Our own feature; no standard | **Keep** |
| Text toolbar `text.checkList` | "Check list" (the block is "Checklist") | **Checklist** | **Rename** |
| Block "Expandable list" (`blocks.accordion`) | "Expandable list" | Web pattern **Accordion** (WAI-ARIA Authoring Practices); our folder `theme/blocks/accordion` | **Ask** (Q7) |
| Block "Banner" (`blocks.hero`) | "Banner" | Web **hero**; our folder `theme/blocks/hero`. "Banner" is ARIA's name for the site header and M2's for a message bar | **Ask** (Q7) |
| Block "Segmented list" | "Segmented list" | M3 lists: "Choose between standard and segmented styles" | **Keep** |
| Block "Image grid" | "Image grid" | M3 has no image grid in M3; web "gallery" | **Keep**: says what it is; no standard wins |
| Image viewer inside blocks | "image viewer" | **Lightbox** | **Rename** (see Fields) |
| Side column (`common.parts.sideColumn`) | "Side column" | **Sidebar** | **Ask** (Q5) |

## 3. States and actions

M3 states page: "An enabled state communicates an interactive component or element." "A disabled state communicates an
inoperable component or element." M3 switch guidelines: "Switches toggle the selection of an item on and off … They make
a binary selection: On and off".

| Where | We say | Standard | Rec. |
| :--- | :--- | :--- | :--- |
| Switch labels: promotion, internal links, privacy categories (`defaults/*.ts`) | "Activated" with On/Off | Switch: **On / Off**; the label names the setting | **Ask** (Q1) |
| `apps.ts` `deactivated` | "Deactivated" (beside "Enabled") | One pair | **Ask** (Q1) |
| `blockSettings.ts` `active`, `inactive` | "Enabled" / "Disabled" for a block offered or not | M3: Disabled means *inoperable*, not *switched off* | **Ask** (Q1) |
| `app.ts` `blocksOff` | "Turned off" | Same | **Ask** (Q1) |
| `forms.links.done` (submit of the link sheet) | "Done" | M3 dialogs: "Avoid using vague terms like Done, OK, or Close." | **Rename** "Save" |
| `common.pickColor`, `phoneCode.title`, `forms.pickIcon`, `pickImage`, `media.pick` | "Pick", "Choose" and "Select" for one act | M3: "Date pickers let people select a date", "Segmented buttons help people select options" | **Ask** (Q4) |
| Delete vs Remove (`common.ts`) | Delete removes the thing; Remove takes it out of a place | M3 pages read print no rule | **Keep**: used consistently |
| Cancel (`common.ts`) | "Cancel" | M3 dialogs: "dismissive action, such as Cancel or Back" | **Keep** |

## 4. Platform terms

A Cloudflare or GitHub product keeps its **real name** (`R2 caching`, `R2`, `KV`, `Workers`, `Workers Paid`, `Workers
Builds`, GitHub's `token`, `commit`, `repository`). Only invented or second names are listed. Already right: `R2 caching`
(renamed from "Faster editor", `2026-11-12-r2-caching-name-screens/`), `R2 location`, `Workers Paid plan`, `Build watch
paths`, `GitHub token (GITHUB_PUBLISH_TOKEN)`, `Log in with GitHub`.

| Where (en-US and da-DK) | We say | Real name | Rec. |
| :--- | :--- | :--- | :--- |
| `advanced.ts` `bucket.ready`, `bucket.no-bucket` | "The storage {bucket}" / "Lageret {bucket}" (the Danish commit already says "bucket") | R2 **bucket** | **Rename** "The R2 bucket {bucket}" |
| `app.ts` `place` (names of changed settings) | "storage location" (the screen says "R2 location") | **R2 location** | **Rename** |
| `advanced.ts` `bucket.no-key`, `bucket.refused`, `plan.no-key`, `plan.refused` | "the editor's key for Cloudflare" / "editorens nøgle" | Cloudflare **API token** | **Rename** |
| `advanced.ts` `paidBuildsCommit` | "the paid build plan" / "betalt bygning" | **Workers Paid** | **Rename** |
| `common.ts` `parts.caching` | "Caching and builds" | **R2 caching**, builds | **Rename** "R2 caching and builds" |
| `cms.ts` `noKv` | "KV storage (PUSH)" | **KV namespace**, binding `PUSH` | **Rename** "no KV namespace bound as PUSH" |
| `apps.ts` `needsServer`, `placeWorker`, `problemPlaces` (code: `worker`; `docs/app-contract.md`: "Worker") | "the website's server", "Server" | the site's **Worker** | **Rename** "Worker" |
| `apps.ts` `mcpTokenHint` | "kept on the server" | a **secret** in the site's **Worker** | **Rename** |
| `advanced.ts`, `apps.ts` (da-DK only) | "Bygning" and "opbygning" for one thing | Cloudflare's **build** | **Rename** to one Danish word (owner picks: "bygning" or "build") |
| `common.saved`, `library.lastPublished` | "the website is updated" | An outcome, not a product name | **Keep** |

## 5. Component names in the editor's texts (Components screen)

| Where (`parts.ts`) | We say | M3 name (page) | Rec. |
| :--- | :--- | :--- | :--- |
| `tokens.parts.textField` | "Fields" | **Text fields** | **Rename** |
| `use.sheet`, `sheetBody` | "The sheet from the bottom" | **Bottom sheet** ("Bottom sheets show secondary content anchored to the bottom of the screen") | **Rename** |
| dialog text | "A box over the page" | **Dialog** ("A dialog is a modal window that appears in front of app content") | **Rename** |
| `use.selectRow` | "A box for the choice" | **Checkbox** | **Rename** |
| snackbar text | "an action, or a cross" | **Close button** (snackbar anatomy: "Close button (optional)") | **Rename** |
| `use.mainDrawer` | "The editor's menu … the menu button at the start of the top bar" | **Navigation drawer**, **app bar** | **Rename** |
| `use.fields`, `use.menuRow` | "a small box with an arrow" | **Menu** with a **dropdown icon** (text fields: "A dropdown arrow indicates that a text field has a nested selection component") | **Rename** |
| `use.foldList`, `foldSection`, `unfold`, `sample.foldOut` | "fold out", "unfold" | **Expand / Collapse** | **Rename** |
| `use.colorSwatches`, `use.colorTiles` | "small rounds", "a pen" | circles; **Edit** icon button | **Rename** |

## 6. Theme part names (`theme/ui/`, `src/themeUi.ts`, CSS)

All other `theme/ui/` files carry M3's names (BottomSheet, SideSheet, SegmentedButton, ButtonGroup, SplitButton,
FabMenu, NavigationRail, Snackbar, LoadingIndicator …).

| Where | We say | M3 name (page) | Rec. |
| :--- | :--- | :--- | :--- |
| `theme/ui/TopAppBar.tsx`, `SiteTopAppBar` | Top app bar | **App bar** ("Four variants: Search app bar, small, medium flexible, large flexible") | **Rename**, old name kept as an alias while THEME_API is 4 |
| `theme/ui/ExposedDropdownMenu.tsx`, `SiteExposedDropdownMenu` | Exposed dropdown menu | M3 menus: "Dropdown menu and exposed dropdown menu are now both referred to as menu" | **Rename** `TextFieldMenu` (text fields: "Text field dropdown menus"), alias as above |
| `theme/blocks/Panel.tsx`, `.block-panel` | Panel | An **outlined card** (it is `Card` inside) | **Keep**: in the theme and app contracts; say "Panel = outlined card" in its comment |
| `theme/styles/*.css` `md-nav-*`, `md-drawer-*`, `md-footer-*` | — | M3 words | **Keep** |

## 7. Docs

| Where | We say | Rec. |
| :--- | :--- | :--- |
| `docs/app-contract.md` | "Slots", "Places", "Widgets" | **Keep**: our own contract concepts; no standard names them |
| `CLAUDE.md` *Word choice* | "Toggles and states: `Enabled` / `Disabled`, `On` / `Off`" | Conflicts with M3 states (Disabled = inoperable). Change after Q1 |
| `CLAUDE.md` *Word choice* | "`Hidden` is the SEO setting `Hide from search engines`" | Already wrong (owner decision 13 Nov); fixed with the No index PR |
| `CLAUDE.md` *Image everywhere* | "image", never the old word | **Keep**: matches `<img>`, "alt text" and M3's list anatomy |

## 8. A check: standard words in `scripts/check-language.mjs`

Built **after** the renames, so it starts green. It sits next to the rule for the old word for image in
`scripts/check-language.mjs` (same files, same allowlist style), so `npm run check:language` and CI run it with no new
job.

- `STANDARD_WORDS`: `{ banned: /regex/, say: 'standard name', source: 'M3 page or spec name' }`. First entries:
  `Describe the image`, `Image description` → Alt text; `Google title`, `Google description`, `Original page` → the Q2
  answers; `Activated`, `Deactivated`, `Turned off` → the Q1 answer; `Check list` → Checklist; `Main keyword` → Primary
  keyword; `Dynamic lists` → Lists; `standard page` → Default page; `Front page` → Home page; `image viewer`, `button
  name` → Lightbox, button label; `Top line`, `Bottom line` → label text, supporting text; `Subhead\b` → Subheading;
  `fold out`, `unfold` → expand; `sheet from the bottom` → bottom sheet; `Top app bar` → app bar; `Exposed dropdown` →
  menu; `e\.g\.`, `Max ` → for example, Maximum; `Centre` → Center; and `address` → URL if Q3 says so.
- `PLATFORM_WORDS`, same shape: invented names of real products → the real name. English: `Faster editor`, `fast
  caching`, `The storage {bucket}`, `storage location`, `key for Cloudflare`, `paid build plan`, `KV storage`, `website's
  server`, `on the server`. Danish: `Lageret`, `nøgle til Cloudflare`, `betalt bygning`, `hjemmesidens server`, `på
  serveren`. Real names (`R2`, `KV`, `Workers`, `token`, `commit` …) are never banned.
- Paths: `STANDARD_WORDS` checks the English texts (`src/i18n/en-US/`, the English strings of `defaults/*.ts`, `docs/`
  except `docs/superpowers/`, `release-notes/i18n/en-US/pending/`, `.changeset/*.md`). `PLATFORM_WORDS` also checks
  `src/i18n/da-DK/`, `defaults/i18n/da-DK/` and `release-notes/i18n/da-DK/pending/`.
- `STANDARD_ALLOWED`: stored names with a reason: i18n keys (`alt:`, `address:`, `subhead:`), field names (`seoTitle`,
  `canonical`, `unlisted`), CSS classes (`.block-panel`), component aliases kept for THEME_API 4, and `noindex`,
  `nofollow`.
- Output: `path:line  Say "Alt text", not "Describe the image" (source)`, exit 1. A new home-made name is added to the
  table by the PR that finds it.

## 9. Build plan (small PRs into `0.18`)

Every PR below that changes a text the owner sees carries this rule: **"When a change the owner can see (the editor or
the site) is done and `check` is green, add before and after screenshots of every changed screen to a comment on your own
pull request, as the `pm` skill's *Screenshots in the pull request* says, and tell the PM with the link and head sha. A
change nobody sees needs none."** Each renames the English text and its key in `defaults/i18n/da-DK/` (keyed by the
English string) and keeps the Danish meaning; `check:content` and `check:language` stay green.

| # | PR | Area | Changeset | Needs |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Fields: Alt text (2 places), Primary keyword, Subheading, label/supporting text, Lightbox and button labels, Center, Maximum, Expand, Registration number, "for example", Type | Editor texts | `patch` + release note | — |
| 2 | Features: Lists, Default pages, Home page, Checklist, Done → Save, Components screen words (sections 2 and 5) | Editor texts | `patch` + release note | — |
| 3 | Platform terms (section 4), English and Danish | Editor texts | `patch` + release note | — |
| 4 | SEO and sharing fields and their rating texts | Editor texts | `patch` + release note | Q2 |
| 5 | URL everywhere | Editor texts | `patch` + release note | Q3 |
| 6 | States: switch labels, app and block status; `CLAUDE.md` *Word choice* line | Editor texts, rules | `patch` + release note | Q1 |
| 7 | One verb for selecting | Editor texts | `patch` | Q4 |
| 8 | Sidebar, favicon, block names, button label, variant | Editor and site texts | `patch` + release note | Q5–Q8 |
| 9 | `AppBar`, `TextFieldMenu` with aliases, `Panel` comment; `docs/app-contract.md` lists the new names | Theme | `minor` (new export names; THEME_API stays 4 while the aliases live) | — |
| 10 | The check (section 8) | Script | empty | 1–9 merged |

## 10. Questions for the owner

1. **Enabled/Disabled vs On/Off.** `CLAUDE.md` allows both, but M3 says Disabled means "an inoperable component"
   (greyed out), not "switched off". Today we mix Activated, Deactivated, Enabled, Disabled and Turned off.
   **Recommend:** a switch and the status it gives are **On / Off** everywhere; "Disabled" only for a greyed-out control;
   the switch label names the setting ("Promotion", "Internal links"), not "Activated".
2. **SEO and sharing fields.** Standard names: title tag (meta title), meta description, canonical URL, Open Graph
   title, description and image. **Recommend:** "Meta title", "Meta description", "Canonical URL"; under "Social media"
   "Open Graph image", "Open Graph title", "Open Graph description" with "Shown when the page is shared" in the hint; and
   "Short description" becomes "Excerpt".
3. **URL vs address.** The page field says URL; about 70 messages and four fields say "address". **Recommend:** URL
   everywhere.
4. **Pick / Choose / Select.** **Recommend:** "Select", M3's verb on every selection component.
5. **"Side column" and "Left/Right side panel"** name the same column. **Recommend:** "Sidebar" (the web term and our
   stored value `sidebar-left`).
6. **"Icon" under Logo and icon.** **Recommend:** "Favicon", hint "The icon in the browser tab".
7. **Block names.** "Expandable list" is an **Accordion**, "Banner" is a **Hero**, the promotion's "Action bar" is M3's
   **docked toolbar**. **Recommend:** Accordion and Hero (web terms, and our folder names); keep "Action bar", since
   "docked toolbar" names the component, not what the visitor sees.
8. **Button text and card style.** M3 calls a button's text its **label text** and the card styles **variants**.
   **Recommend:** "Button label" for every "Button text" field, and "Variant" for "Design", "Card style" and "Style".
