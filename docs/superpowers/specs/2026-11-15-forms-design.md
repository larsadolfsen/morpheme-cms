# Forms (0.23, spec 4)

> **Status:** design for the owner's review, 15 November 2026 (a planning session: nothing is built). Release plan and
> the owner's decisions: `docs/superpowers/plans/2026-11-15-app-platform-0-23.md` (cited as **D1** to **D35**). Builds
> on spec 1 (`2026-11-15-app-worker-sandbox-design.md`), spec 2 (`2026-11-12-app-storage-design.md`) and spec 3
> (`2026-11-12-apps-provide-to-apps-design.md`). Claims about Cloudflare were read with Cloudflare's documentation search
> on 15 November 2026 (direct fetches of developers.cloudflare.com and www.cloudflare.com were blocked in this session);
> what is not settled by the docs is marked **verify** and is checked on `morpheme-staging` before its batch.

## Goal

The owner builds a form in the editor, places it on any page with a Form block, and reads every answer on the Forms
screen. An answer is saved before anything else happens, the owner hears of it by email and in the editor, and apps can
receive it too (Mailchimp first). All of it works on Cloudflare's Free plan (D6); only a receiver with code needs
Workers Paid (D1).

## What exists today

- **Own lists** (`lib/ownList.mjs`, `src/ownLists.ts`, `src/NewListDialog.tsx`, `src/OwnList.tsx`,
  `src/OwnListSheet.tsx`, `src/AddFieldMenu.tsx`, `src/listDraft.ts`): a definition file `<data>/<id>/_list.json`
  (`{ version: 2, label, fields: [{ id, kind, label? }], dropped }`), ids from `idOf(label, taken)`, field ids from
  `newFieldId` (never reused), a waiting version kept until one `Save`, `Delete list` refused while a page reads it,
  and `ownListProblems` in `check:content`. A list block picks a list with the relation field `from` (`to: 'rowSources'`,
  `src/standard/rows/fields.ts`), and `Edit list` opens `#list/<id>` (`listPageOf`).
- **Consent log** (`worker/consent.js`): the pattern for visitor data in D1: a lazily made table remembered only after
  the create finished, a public `POST` from the site's own origin, `mayEdit` for reading and deleting, CSV, an hourly
  sweep, no IP address kept. `src/Consents.tsx` is its screen (search, sort, CSV, a sheet per row).
- **Notifications:** `notifyAll(env, { type, id, text, to })` in `worker/push.js`.
- **CSP:** `lib/csp.mjs` adds the origins of `<script src>` it finds in a page; frames made at run time need a rule.
- **Worker:** `worker/index.js` routes `/api/…` before `appAnswer`, hides `/_apps/` (404), and runs the hourly
  `scheduled`. It has an optional Cloudflare API token (`CLOUDFLARE_R2_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) used by
  `worker/plan-status.js` and `worker/r2-status.js`.
- **Theme parts** for the site's form: `theme/ui/TextField.tsx`, `Checkbox.tsx`, `RadioButton.tsx`,
  `ExposedDropdownMenu.tsx` (a real `<select>`), `DatePicker.tsx`, `Button.tsx`.
- `src/i18n/en-US/forms.ts` exists and is the editor's own entry forms; Forms gets a new file (below).

## Design

### Where things live

| What                              | Where                                                                       |
| --------------------------------- | --------------------------------------------------------------------------- |
| A form's definition               | `<data>/forms/<id>.json` in the site's repository (git), D22                |
| The definition the Worker checks  | `dist/_forms/<id>.json`, copied by the build, served to no one (404 like `/_apps/`) |
| Answers                           | core tables in `APP_DATA` (D7, D23), never in git                            |
| The owner's email address, Turnstile secret | core rows in `CONSENT` (the core's own database, beside the other keys) |
| Turnstile sitekey (public)        | `<data>/forms/_settings.json`                                               |
| Rules (pure, tested)              | `lib/forms.mjs`; Worker `worker/forms.js`, `worker/email.js`                |
| Block                             | contract `src/standard/form/` (`index.tsx`, `load.ts`), look `theme/blocks/form/` (`View.tsx`, `script.ts`) |

`forms` becomes a reserved list id (`idOf` refuses it) and a reserved app id (`manifestProblems`), so neither a list
folder nor `/api/<app>/` can collide. `check:content` fails on a site that already has `<data>/forms/_list.json`.

### The form's file

```json
{
  "version": 1,
  "label": "Contact",
  "fields": [
    { "id": "text", "kind": "text", "label": "Name", "required": true },
    { "id": "email", "kind": "email", "label": "Email", "required": true },
    { "id": "choice", "kind": "choice", "label": "Topic", "display": "radio", "options": ["Booking", "Prices", "Other"] },
    { "id": "long-text", "kind": "long-text", "label": "Message", "hint": "Tell us what you need." },
    { "id": "consent", "kind": "consent", "label": "I agree that you keep my answers to reply to me." }
  ],
  "retired": [],
  "button": "Send",
  "after": { "show": "message", "message": "Thank you. We will reply within two days." },
  "keepDays": 365,
  "receivers": { "email": { "on": true }, "app_5c4b6ba067ef127f": { "on": true, "settings": { "email": "email", "tag": "contact" } } }
}
```

- `id` (file name) comes from `idOf(label, taken)`; field ids from `newFieldId` (`email`, `email-2`). Removing a field
  moves its id to `retired`, so it is never reused and old answers keep their meaning. Order is the array's order.
- `label` at most 60 characters (M3: label text "shouldn't be truncated or take up multiple lines"); `hint` one line;
  `required` true or absent. `consent` is always required.
- `after` (D24): `{ "show": "message", "message" }` (the default; empty message uses the site text "Thank you. We got
  your answer.") or `{ "show": "page", "page": "<page slug>" }`.
- `keepDays` 1 to 365, default 365 (D9: the owner can only shorten).
- `receivers` (spec 3, decision 7): the built-in `email` and each provider app by its id, `on` and its `settings`
  (the provider's `fields`). A new form has `email` on (D25). Settings of a removed provider stay and are ignored.
- `parseForm(text)` returns `{ form }` or `{ problems }` in plain English, as `parseDefinition` does.

### Field kinds (D18)

| Kind        | On the site (theme part)                                  | Options                         | Checked (`answerProblems`)                       |
| ----------- | --------------------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| `text`      | `TextField`                                               | label, hint, required           | at most 200 characters                           |
| `email`     | `TextField type=email autocomplete=email`                 | label, hint, required           | one address, no line breaks, at most 254        |
| `phone`     | `TextField type=tel autocomplete=tel`                     | label, hint, required           | digits, spaces, `+ - ( )`, at most 30            |
| `long-text` | `TextField` as a text area                                | label, hint, required           | at most 5 000 characters                         |
| `number`    | `TextField inputmode=decimal`                             | label, hint, required           | a finite number                                  |
| `date`      | `DatePicker` (docked or modal by breakpoint)              | label, hint, required           | `YYYY-MM-DD`                                     |
| `checkbox`  | `Checkbox` with its label beside it                       | label, hint, required           | `true` or absent; required means ticked          |
| `choice`    | `ExposedDropdownMenu` or `RadioButton` group (`display`)  | label, hint, required, options (2 to 20, each at most 60) | one of the options      |
| `consent`   | `Checkbox` with the owner's text and a link to the privacy page | label (the consent text)  | must be ticked; the text shown is saved with the answer |

Unknown keys are refused. The same `answerProblems` runs in the visitor's browser (inline errors) and in the Worker.
`display: "radio"` is offered for 2 to 5 options only; more options are a dropdown (M3, below).

### Material 3 on the site's form

Read on m3.material.io on 15 November 2026 (Playwright); the Form block follows them, with no deviation planned:

- Text fields (`/components/text-fields/guidelines`): "Every text field should have a label"; for required fields
  "display an asterisk (*) next to the label text, and explain that asterisks indicate required fields in … A single
  note at the beginning of the form" (the form opens with "* Required" when a field is required); "replace supporting
  text with error text"; "It's strongly recommended to show an error icon"; text areas "should be used instead of
  multi-line fields on the web" (`long-text`); "Text fields shouldn't span the full width of a large screen" (the form
  has a maximum width from the theme). Accessibility page (`/components/text-fields/accessibility`): the error message
  gets the `alert` role, and "The accessibility label must include the asterisk."
- Radio buttons (`/components/radio-button/guidelines`): "Use radio buttons when there are five or fewer options";
  "Consider using a drop-down menu instead of radio buttons when space is constrained"; "Radio buttons should be
  vertically listed and have one option always selected" and "should always have one option pre-selected", so a radio
  choice starts on its first option and the builder says so; an owner who wants no answer chosen uses a dropdown.
- Checkbox (`/components/checkbox/guidelines`): to "Turn an item on or off" (`checkbox`, `consent`).
- Menus (`/components/menus/guidelines`): "Text field dropdown menus" and "Select menus" are menus; the theme's
  `ExposedDropdownMenu` is that part.
- Date pickers (`/components/date-pickers/guidelines`): "Dialogs on compact breakpoints … Text field drop-downs on
  medium and expanded breakpoints", the theme's `DatePicker`.
- Buttons (`/components/buttons/guidelines`): the filled style is for "important, final actions that complete a flow"
  and "ideally for only one action on a page": the form's one send button is filled.

### The Forms screen (D22, D23, D25, D33)

`#forms` in the navigation drawer, with a `Badge` of unread answers (`GET /api/forms`). Parts are `ui.tsx`'s only.

- **The list of forms:** a `ListItem` per form (name; "3 new · 41 answers"), `New form` (dialog with Name and
  `Create`, as `NewListDialog`), and in the top bar's overflow menu `Delete a visitor's answers` and `Email and spam
  protection`. A setup card shows while email or Turnstile is not ready.
- **A form** (`#forms/<id>`) has three tabs with icons: **Answers**, **Fields**, **Settings**.
  - **Answers:** newest first (`SearchRow`: search, sort), a `ListItem` per answer (first text or email value, the
    time; new ones marked with a `Badge`). Tap opens a `SideSheet`/`BottomSheet` (by breakpoint) with every field (the
    labels saved with the answer), the page it came from, each receiver's result, `Send again` for a failed one, and
    `Delete answer`. Opening marks it read. The top bar has `Download CSV` and bulk delete (`src/bulkDelete.mjs`).
  - **Fields:** the builder, modelled on the list page: `Add field` opens the menu of the nine kinds (as
    `AddFieldMenu`); a field's sheet has Label, Hint, `Required` (`SwitchRow`), and for a choice its options and
    `Display` (`SegmentedButton`: Dropdown, Radio buttons); `Move up`, `Move down`, `Remove field`. A new form starts
    with Name, Email and Message and a consent checkbox, which the owner can change or remove (D39).
  - **Settings:** Name, Button text, After sending (`SegmentedButton`: Show a message, Go to a page; the message or a
    page picker), Keep answers for (days, at most 365), and **Send answers to**: `Email me` and each active provider
    of `form-receiver` (spec 3 `providersOf`) with its fields; missing or not compatible providers show as spec 3 says.
  - Changes are a waiting version (`formDraft.ts`, the `listDraft.ts` pattern) committed with one `Save`.
    `Delete form` is refused while a page's Form block uses it; else it asks whether to keep or delete its answers.
- **Delete a visitor's answers** (D33): a dialog with `Email address`; the Worker counts the matches across all forms,
  the editor asks "Delete 4 answers from 2 forms?", then deletes them in one call and says how many went.
- **Email and spam protection:** the owner's address and its state (Confirmed, Waiting for you to confirm, Not set up),
  and Turnstile's state (On, Set up). See the receiver and Turnstile sections.

### The Form block

- Contract `src/standard/form/index.tsx`: one field `form` (`type: 'relation'`, `to: 'forms'`, from `ownForms(files)`),
  `detail` "Contact · 5 fields", and `Edit form` opening `#forms/<id>` (as `listPageOf`). The relation offers `New form`.
  One form can sit on several pages.
- `src/standard/form/load.ts` reads the definition at build; the look `theme/blocks/form/View.tsx` (React, as every
  block) draws the fields, the honeypot, the "* Required" note, the privacy line and the button. `script.ts` checks
  fields as the visitor leaves them, renders Turnstile on the first focus in the form, sends, and shows the result.
- In the editor the block draws the form inert. `check:content` fails on a Form block whose form does not exist, and
  warns on a page with a form while Turnstile is not set up.

### The submission path (D21, D28)

`POST /api/forms/<id>` (`worker/forms.js`), JSON, from the Form block's script:

1. **Origin:** only the site's own pages (`origin` equals the site's, as `consent.js`). Body at most 64 KB.
2. **Rate limit per visitor:** 5 answers per minute per form, keyed by a SHA-256 of the IP address and the form id
   (never stored), with the Workers Rate Limiting binding `FORMS_LIMIT` (`ratelimits`, period 60;
   developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/). Over it: `429 { error: 'busy' }`.
3. **Honeypot:** a text field `website`, off screen, `tabindex=-1`, `autocomplete=off`, `aria-hidden`. Filled: the
   Worker answers as if accepted and saves nothing.
4. **Turnstile, server side:** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with the secret, the
   token, `remoteip` and an `idempotency_key`; 10 s timeout; `success` and `hostname` equal to the site's public host
   are required. Tokens are single use and "valid for 300 seconds" (turnstile/get-started/server-side-validation/).
   Failure: `400 { error: 'verify' }`.
5. **Definition:** `dist/_forms/<id>.json` from `env.ASSETS`: the committed, deployed definition. None: `404`.
6. **Validation:** `answerProblems(form, values)`. Problems: `422 { problems: { <field>: <code> } }`, shown inline.
7. **Save first:** insert the answer (below). Only now is the answer the site's.
8. **Answer the visitor:** `200 { ok: true, after }`; the script shows the message in place of the form or goes to the
   page. Until `ok`, the page keeps everything the visitor typed, so a refusal or a failure loses nothing.
9. **Then the receivers** (`ctx.waitUntil`): the built-in email and each provider turned on for this form, through
   `callProviders(env, 'form-receiver', 'receive', input, only)` (spec 3), all at once; each result is written to the
   answer's `receivers`. A push notification `forms/new` opens `#forms/<id>` (D25).

If the insert fails (quota, a refused D1 write, no `APP_DATA`), the Worker sends the email at once and answers `ok`
only when it was sent; the Forms screen shows "Some answers could not be saved and were only emailed to you." If both
fail: `503 { error: 'unavailable' }`, and the visitor sees "Something went wrong. Try again in a moment."

### Storage: core tables in `APP_DATA` (D7, D9, D23)

Forms is the core (D6), so its tables are not an app's. The core uses spec 2's layer unchanged, under the reserved owner
`core` (D1 names `c__<table>`, no app can be called `core`), declared with the same shape in `lib/forms.mjs`:

| Table          | Columns (besides `id`, `at`)                                                                     | Index          |
| -------------- | ------------------------------------------------------------------------------------------------ | -------------- |
| `form_answers` | `form` string, `values` json, `labels` json (the labels and consent text shown), `page` string, `status` string (`new`, `read`), `receivers` json, `keep` number | `form`, `status` |
| `form_emails`  | `answer` string, `email` string (lower case, every email field's value)                           | `email`, `answer` |

Both are `personal: true`. `keep` is the form's `keepDays` when the answer came, so shortening it later is kept per
answer; the hourly sweep deletes rows older than their `keep` (a core-only extension of spec 2's retention). Spec 2's
quotas apply. No IP address, user agent or Turnstile data is stored. The editor's routes (`mayEdit` only):

| Route                                          | Does                                                          |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `GET /api/forms`                               | per form `{ total, unread }`; email and Turnstile state       |
| `GET /api/forms/<id>/answers?q&cursor[&format=csv]` | newest first, search over the values; CSV with one column per label, current and retired |
| `PATCH …/answers/<answer>` / `POST …/answers/<answer>/send` | mark read / send again to one receiver           |
| `DELETE /api/forms/<id>/answers`               | `{ ids }` or `{ all: true }`                                  |
| `GET` / `DELETE /api/forms/erase`              | count, then delete, every answer holding an email address (D33) |

Spec 2's generic `/api/app-data/<app>/…` refuses `core`; *Privacy › Stored visitor data* lists the two tables.

### The built-in email receiver (D10, D15, D25, D31)

- **Free:** "Sending to verified destination addresses in your account is free on all plans, including when only Email
  Routing is configured" and such sends "do not count toward your monthly quota or daily sending limits"
  (email-service/platform/pricing/, email-service/configuration/email-routing-addresses/).
- **What it needs:** the site's domain on Cloudflare with Email Routing ("You can only send from your routing domains",
  email-service/platform/limits/), and the owner's address added under Email Service › Email Routing › Destination
  addresses, where "Cloudflare sends a verification email to that address. Open the email and select Verify email
  address." The address is kept in `CONSENT`, not in git. A site on `workers.dev` only has no email; answers are still
  saved and notified.
- **Binding:** `"send_email": [{ "name": "EMAIL" }]` (no restriction: "can send to any verified destination address").
  The docs say Email Routing and a verified address must exist "Before you can bind", so the editor adds the line
  (as `src/r2Caching.ts` edits `wrangler.jsonc`) when the owner turns email on, not the starter (**verify**).
- **`worker/email.js`** `sendToOwner(env, { subject, text, html, replyTo })` is the one sender, also used by spec 1's
  escalation emails. From `forms@<routing domain>` with the site's name; `Reply-To` the answer's first email value, so
  the owner can reply at once (D31). Subject "New answer: Contact"; body every field (label: value), the time in the
  site's time zone, the page, and the link `https://<editor host>/editor/#forms/<id>/<answer>`. HTML is escaped.
- **Confirmation to the visitor (D15) is not free:** "Sending to arbitrary recipients requires the Workers Paid plan"
  (3 000 a month included, then $0.35 per 1 000) and an onboarded sending domain. By D15 it is not built in; it can be
  an app (open question 2).

### Turnstile, always on (D11, D28)

- **Keys:** a widget per site (managed mode, the site's public host). With the Worker's Cloudflare token holding
  `Turnstile Sites Write`, `Set up` creates it through `POST /accounts/<id>/challenges/widgets`
  (turnstile/get-started/widget-management/api/); else the owner creates it in the dashboard and pastes both keys. The
  sitekey is committed in `_settings.json`, the secret goes to `CONSENT` and never to the browser or git.
- **On the page:** `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` ("must be fetched from the
  exact URL"), rendered on the visitor's first focus in the form, so a reader who never fills it in never meets
  Cloudflare. `lib/csp.mjs` adds `script-src` and `frame-src https://challenges.cloudflare.com` on pages with a Form
  block only (turnstile/reference/content-security-policy/). Pre-clearance stays off, so no `cf_clearance` cookie.
- **Consent (verify):** Cloudflare says Turnstile "processes only the data strictly necessary to provide this security
  function" and "does not access, store, or transmit … form entries" (turnstile/), but also that it "relies on" cookies
  and local storage "to maintain state" (turnstile/get-started/mobile-implementation/). This spec treats it as
  necessary (security), not asked for in the banner, and says so openly: the built-in cookie list gets a `necessary`
  entry, en "Cloudflare Turnstile: checks that a form is sent by a person, not a robot. Only on pages with a form.", and
  the privacy page's default text names Turnstile with a link to the Turnstile Privacy Addendum
  (www.cloudflare.com/turnstile-privacy-policy/). The addendum could not be read here: check it before batch 3.

### Consent and the visitor's texts

Every form shows one line above the button: en "We keep your answers for {days} days. Privacy policy" (link to the
privacy page when the site has one). The `consent` field is for explicit consent (for example a newsletter): its text
is the owner's, saved with the answer as proof (GDPR article 7(1), as the consent log). A provider whose contract entry
says `consent: true` (for example Mailchimp) can be turned on only in a form with a `consent` field, and gets only
answers where it was ticked. The visitor's fixed texts are site texts (`defaults/i18n`, English and `da-DK`):
"* Required", "Send", "Enter {label}", "Enter an email address like name@example.com", "Choose one", "Tick this box to
send", "Thank you. We got your answer.", "We could not check that you are a person. Try again.", "Too many tries. Wait
a minute and try again.", "Something went wrong. Try again in a moment.", "This form needs JavaScript."

### The `form-receiver` contract, version 1

```js
// input, the same for data and code providers
{ form: { id, label }, answer: { id, at /* ISO 8601 */, page }, fields: [{ id, kind, label, value }],
  consent /* true when a consent field was ticked */, settings /* this receiver's settings for this form */ }
// result
{ ok: true } | { ok: false, reason /* one sentence, at most 200 characters, shown to the owner */ }
```

`CONTRACTS['form-receiver'] = { versions: [1], many: true, receives: 'formAnswers', builtin: 'email', consent?: … }`
(spec 3). Settings fields may use a new field type `formField` with `kinds` (for example Mailchimp's "Email field":
one of the form's `email` fields), drawn only by the Forms screen.

### When a receiver fails (D21, D34)

- The answer is already saved. Its `receivers` entry holds `{ ok: false, reason, at }`; the answer shows "Not sent to
  Mailchimp: {reason}" with `Send again`, and the form's Answers tab shows a `ProblemNote` with the count.
- The hourly `scheduled` retries a failed receiver up to 3 times within 24 hours; then only `Send again`.
- A **code receiver** that throws or breaks its limits is a sandbox failure (spec 1 kinds); the host records it in
  `app_failures` and spec 1's escalation applies: day 0 page and notification, 24 hours email, 7 days pause, after
  which that receiver is skipped and the built-in email still runs (D14). An `{ ok: false }` it returns is not an app
  failure.
- A **data receiver** failing shows the same way and is notified; it has no server part to pause (open question 3).
- The **built-in email** failing (address not confirmed, binding missing) shows on the Forms screen and is notified;
  it cannot email about itself.

### The 0.23 update, the Free plan, MCP

- **D29:** the update adds `{ "binding": "APP_DATA" }` to `d1_databases` and the `FORMS_LIMIT` rate limit to the site's
  `wrangler.jsonc` (as text, keeping comments), in the update's commit. Before it is applied, the Morpheme page says:
  en "This update adds a database for visitors' answers to your site's Worker settings. Cloudflare creates it on the next
  build." Automatic provisioning of an id-less D1 binding is Cloudflare's open beta since wrangler 4.45
  (changelog/post/2025-10-24-automatic-resource-provisioning/); the starter already relies on it for `CONSENT`.
- **Free plan:** forms, storage (D1), Turnstile, the rate limit, the built-in email and data receivers all run on
  Free; a code receiver needs Workers Paid and is unavailable otherwise, as spec 1 says (D6, D17). D1's Free write
  limits get no warning of their own (D9): a refused write takes the email-only path above and shows as a problem.
- **D30:** `worker/mcp.js` may read `<data>/forms/*.json` (definitions) and has no tool or route to the tables;
  `/api/forms/*` takes only the editor's session (`mayEdit`), never an MCP token.

## What the owner sees

Forms in the menu with a count of new answers; a form built like a list (name, then fields); a Form block that picks it;
answers newest first with search, CSV and delete; an email for each answer with every field and a link; one dialog to
delete a person's answers everywhere. Setup asks two things once: confirm the email address Cloudflare writes to, and
`Set up` spam protection.

**New editor texts** (`src/i18n/en-US/siteForms.ts`, key `siteForms`; `forms` is taken; Danish in `da-DK` after,
skill `site-editor-writing`): `Forms`, `New form`, `Create`, `Name`, `Give the form a name with letters or numbers.`,
`A form with this name exists. Choose another name.`, `Answers`, `Fields`, `Settings`, `Add field`, `Text`, `Email`,
`Phone`, `Long text`, `Number`, `Date`, `Checkbox`, `Choice`, `Consent`, `Label`, `Hint`, `Required`, `Options`,
`Add option`, `Display`, `Dropdown`, `Radio buttons`, `Radio buttons start with the first option chosen.`, `Move up`,
`Move down`, `Remove field`, `Button text`, `After sending`, `Show a message`, `Go to a page`, `Message`, `Page`,
`Keep answers for`, `days`, `Send answers to`, `Email me`, `{n} new`, `{n} answers`, `No answers yet.`,
`This form has no fields yet. Add the first one.`, `Download CSV`, `Delete answer`, `Delete form`,
`A page uses this form. Remove the Form block first.`, `Keep the answers of this form, or delete them?`, `Keep`,
`Delete`, `Send again`, `Not sent to {name}: {reason}`, `Sent to {name}`, `Delete a visitor's answers`,
`Email address`, `Delete {n} answers from {forms} forms?`, `{n} answers deleted`, `No answers hold this address.`,
`Email and spam protection`, `Confirmed`, `Waiting for you to confirm`, `Not set up`, `Set up`, `Sitekey`,
`Secret key`, `Spam protection is not set up. Forms cannot take answers until it is.`,
`Some answers could not be saved and were only emailed to you.`, `Form`, `Choose a form`, `Edit form`,
`New answer in {form}` (notification).

## Tests

- `lib/forms.test.mjs`: `parseForm` (kinds, options, labels, `retired`, `after`, `keepDays` ≤ 365, unknown keys),
  ids never reused, `answerProblems` per kind, radio only for 2 to 5 options, CSV with retired labels, the
  contract input, the reserved `forms` id.
- `worker/forms.test.mjs` with a fake D1, ASSETS, rate limit and Siteverify: origin, size, rate limit, honeypot saves
  nothing, Siteverify failure and hostname, unknown form, problems, save before receivers, `ok` only after save,
  email-only path when the insert fails, 503 when both fail, receivers run in parallel and a failure is recorded,
  retries, mark read, search, CSV, erase across forms, retention per answer, no IP stored, `mayEdit` on every editor
  route, MCP cannot reach the tables. `scripts/pending-shared.test.mjs` passes on the new files.
- `worker/email.test.mjs`: MIME fields, `Reply-To` only for a valid address, no header injection, HTML escaped.
- `lib/csp` tests: Turnstile's origin only on pages with a form. `check:content`: missing form, bad file, `forms` list.
- `check:screens`: the Form block in every field state and section colour; the Forms screen's tabs and sheets.

## Out of scope

File upload (D18), multi-step forms, conditional fields, a confirmation email to the visitor (an app, D37),
payments, editing an answer, answers in the MCP server (D30), SMTP over TCP (spec 1), and site search (D19).

## Verify before building

1. A Free account with only Email Routing sends to a verified address through the binding's `send({ to, from, subject,
   text, html })` form; and whether a deploy with a `send_email` binding fails while Email Routing is off.
2. Email Routing on a subdomain (`forms.<domain>`) while the apex's mail stays with another provider ("Non-Cloudflare
   MX records exist", error 2008, email-service/configuration/domains/).
3. The token permissions the Worker needs: Turnstile Sites Write, and reading Email Routing destination addresses
   (their verified state).
4. The Turnstile Privacy Addendum: what it keeps in the visitor's browser, and whether "necessary" holds (www.cloudflare.com
   was blocked in this session).
5. The Rate Limiting binding on Workers Free and in Workers Builds deploys; else a D1 counter as `mcp_rate`.
6. Automatic provisioning of `APP_DATA` on an existing site's Workers Builds deploy (D29).
7. D1 Free daily write limits against a busy form (an answer is about four writes), and CPU of the submission path on
   Free (10 ms), measured on staging.

## Open questions for the owner

Answered by the owner on 15 November 2026 (release plan D36 to D39):

1. Without Email Routing, answers are saved and shown on the Forms screen with the unread count, and nothing is emailed;
   the editor says why and that an email app can be installed (D36).
2. A confirmation email to the visitor is an app (D37, D15). The core sends nothing to visitors.
3. A data receiver that keeps failing pauses after 7 days too: its sends stop until the owner turns it back on (D38).
   Answers are saved first, so nothing is lost.
4. A new form starts with Name, Email and Message and a consent checkbox (D39).

## Batches

| Batch | Repo               | What                                                                                                   |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| 1     | `morpheme-cms`     | `lib/forms.mjs`, the form file, reserved ids, `check:content`, build copy to `dist/_forms/`, tests.     |
| 2     | `morpheme-cms`     | `worker/forms.js` (after spec 2 batch 2 and spec 3 batch 2), core tables, Turnstile, honeypot, rate limit, `worker/email.js`, routes, retention and retries, the update's `wrangler.jsonc` lines. |
| 3     | `morpheme-cms`     | The Form block (contract, theme `View.tsx` and `script.ts`), CSP, cookie list entry, site texts in both languages, screens. |
| 4     | `morpheme-cms`     | The Forms screen (list, builder, answers, settings, erase, CSV, badge, setup), editor texts in both languages, release note. |
| 5     | `morpheme-apps`    | Mailchimp as a `form-receiver` data provider with `consent: true`; a fixture code receiver for staging. |
| 6     | `morpheme-staging` | The verify list first (before batch 2), then a real form end to end on a Free and a Paid account.       |
