# Batch 5: `theme/`, `worker/`, `pages/`, `scripts/` and the docs in English

Status: done (2026-11-10, branch `claude/english-source-batch-5`). `theme/`, `worker/`, `pages/`, `scripts/`, `AGENTS.md`, `README.md` and `docs/*.md` are out of `PENDING`. `demo/README.md` is converted, but `demo/` stays in `PENDING` for batch 6.

Master plan: `2026-11-04-english-source.md` (read *Conversion rules*). Needs Batch 2 merged (the term table, the
English ids). Repo `morpheme-cms`. Can run at the same time as batches 3 and 4.

**Batch check:** the checks in `AGENTS.md` section 4, `npm run check:language`.

**Start:** run `node scripts/check-language.mjs` with this batch's folders removed from `PENDING`. Use its file list
when it differs from the snapshot in each task.

---

### Task 5.1: theme texts that a visitor reads — Sonnet agent

**Files:** `theme/ui/DatePicker.tsx`, `theme/ui/TimePicker.tsx`, `theme/theme.json`, `theme/templates/NotFound.astro`,
new `defaults/i18n/da-DK/themeUi.ts` (add it to `defaults/i18n/da-DK/index.ts`)

**Behaviour:**
- `DatePicker.tsx` and `TimePicker.tsx` call `siteText` with Danish text. Write the English text as the key. Write
  today's Danish in `themeUi.ts`. The date format text becomes `'dd/mm/yyyy'` in English, `'dd.mm.åååå'` in Danish.
- The date parser must accept the format of the site's language. Keep today's Danish parsing exactly.
- `theme.json` describes the theme to the owner. Write it in English. Translate it where the editor shows it.
- `NotFound.astro` splits a path on `/[^a-z0-9æøå]+/`. Write the letters as escapes.

**Test cases:** the date picker on a Danish site shows today's texts and parses `24.12.2026`; on an English site
it shows English texts and parses `12/24/2026` or `24/12/2026` by `Intl` for `en-US`.

- [ ] Do the changes. Run the batch check, `check:themes` too.
- [ ] Commit: `Write the date and time pickers' texts in English`. Commit the other files separately.

### Task 5.2: theme comments — Ollama runner (three tasks of at most 10 files)

**Files (snapshot):** `theme/blocks/ArrowLink.tsx`, `BlockHead.tsx`, `accordion/PageRow.tsx`, `faq/Accordion.tsx`,
`faq/View.tsx`, `posts/View.tsx`, `testimonials/Testimonial.tsx`, `testimonials/script.ts`;
`theme/components/ActionBar.astro`, `ArrowLink.tsx`, `BlogPosts.tsx`, `CookieConsent.astro`, `Footer.astro`,
`MobileMenu.tsx`, `Popup.astro`, `PostList.tsx`, `PostMeta.tsx`, `posts.ts`; `theme/layouts/Base.astro`,
`PageLayout.astro`, `PostLayout.astro`; `theme/styles/base.css`, `blocks.css`, `global.css`, `ui.css`;
`theme/templates/Blog.astro`

- [ ] Write each comment in English. Name each UI label by its English text from the term table.
- [ ] Make sure that only comments change.
- [ ] Remove `theme/` from `PENDING`. Run the batch check.
- [ ] Commit per task: `Write the theme's comments in English (part N)`.

### Task 5.3: the Worker — Sonnet agent

**Files:** `worker/editor-host.js`, `files.js`, `github.js`, `not-found.js`, `oauth.js`, `publish.js`, `push.js`,
`r2-status.js`, new `worker/i18n/da-DK.js`, new `worker/say.js`

**Interfaces:**
- Produces: `say(locale: string, text: string, values?: Record<string, string | number>): string`
  (`worker/say.js`). It uses `translate` from `lib/translate.mjs` with `worker/i18n/da-DK.js` when `locale` is
  `da-DK`.

**Behaviour:**
- A message that the owner reads (`oauth.js` login error) and a commit message use `say(siteLocale, …)`.
- A log line (`console.error`, `files.finish`) is for developers: write it in English only.
- `push.js` `isRoute` must still accept Danish letters in a slug. Write them as escapes.

**Test cases (`worker/say.test.mjs`):** `say('da-DK', 'Try again.')` returns the Danish entry;
`say('en-US', 'Try again.')` returns `'Try again.'`; `isRoute('om-øen')` is `true`.

- [ ] Write the tests. Run them. Make sure that they fail.
- [ ] Do the changes. Run the tests and `check:worker`. Make sure that they pass.
- [ ] Remove `worker/` from `PENDING`. Commit: `Write the Worker's messages in English with Danish by locale`.

### Task 5.4: `pages/` and `scripts/` — Ollama runner (two tasks)

**Files (snapshot):** `pages/editor/index.astro`; `scripts/check-cms-update.mjs` 16, `check-consent.mjs` 6,
`check-content.mjs` 4, `check-store-connection.mjs` 25, `check-store.mjs` 17, `check-themes.mjs` 1,
`check-worker.mjs` 20, `compare-html.mjs` 3, `editor-roundtrip.mjs` 4, `editor-screens.mjs` 10, `icon-packs.mjs` 1,
`link-counts.mjs` 1, `releases.mjs` 5, `starter.mjs` 4

**Rules:** the scripts' output is for developers: English only. A test fixture that is Danish site data (a Danish
page in a check) writes its letters as escapes, or moves to a fixture file under `scripts/fixtures/i18n/da-DK/`.

- [ ] Do the changes. Make sure that each check still passes and its messages are in English.
- [ ] Remove `pages/` and `scripts/` from `PENDING`. Commit per task: `Write the check scripts in English (part N)`.

### Task 5.5: the docs — Sonnet agent

**Files:** `AGENTS.md`, `README.md`, `demo/README.md`, `docs/*.md` (not `docs/superpowers/`)

- [ ] Write each doc in English. Keep its meaning and its structure.
- [ ] Remove the docs from `PENDING`. Run `npm run check:language`.
- [ ] Commit per doc: `Write <doc> in English`.
- [ ] Open the PR with a changeset (`patch`). Merge it when the checks pass.
