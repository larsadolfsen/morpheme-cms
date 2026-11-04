# Batch 6: the starter in English, Danish as a language layer

Master plan: `2026-11-04-english-source.md`. Needs batches 3, 4 and 5 merged. Repo `morpheme-cms`. This batch ends
the project: `PENDING` is deleted.

**Batch check:** the checks in `AGENTS.md` section 4, `check:starter` and `check:demo` too, `npm run check:language`.

**Today:** there is no `morpheme new` command. A new site is a copy of `starter/`. The demo is the starter with
`demo/` laid on top (`scripts/demo-site.mjs`). The starter is Danish: `config.locale` is `'da-DK'`, its pages are
`forside.md`, `kontakt.md`, `privatlivspolitik.md`, `siden-findes-ikke.md` and `blog.md`, and `README.md`,
`src/data/cookies.json` and `src/site/config.ts` hold Danish text.

---

### Task 6.1: the language layer command — Sonnet agent

**Files:**
- Create: `scripts/locale.mjs`, `lib/locale.mjs`, `lib/locale.test.mjs`
- Modify: `bin/morpheme.mjs` (command `locale` → `['locale']`)

**Interfaces:**
- Produces: `morpheme locale <code>`: lays `i18n/<code>/` of the site over the site's root, sets `locale` in
  `src/site/config.ts` to `<code>`, and deletes the site's `i18n/` folder. Run in a new site, once.
- Produces: `layerPlan(files: string[], code: string): { copy: [from: string, to: string][]; remove: string[] }`
  (`lib/locale.mjs`, pure). A file in the layer replaces the file at the same path. A layer file `<path>.remove`
  (empty) removes `<path>`: this is how `home.md` gives way to `forside.md`.

**Test cases (`lib/locale.test.mjs`):**

| Input | Expected |
|---|---|
| `layerPlan(['i18n/da-DK/README.md'], 'da-DK')` | `copy: [['i18n/da-DK/README.md', 'README.md']]` |
| `layerPlan(['i18n/da-DK/src/content/pages/home.md.remove'], 'da-DK')` | `remove: ['src/content/pages/home.md']` |
| `layerPlan(['i18n/da-DK/README.md'], 'sv-SE')` | `copy: []`, `remove: []` |

- [ ] Write the tests. Run them. Make sure that they fail.
- [ ] Write `lib/locale.mjs`, then `scripts/locale.mjs` and the bin command. Run the tests.
- [ ] Commit: `Add morpheme locale to lay a language over a new site`.

### Task 6.2: the starter in English — Sonnet agent

**Files:** `starter/README.md`, `starter/src/site/config.ts`, `starter/src/data/*.json`,
`starter/src/content/pages/*.md`; new `starter/i18n/da-DK/` with today's Danish files at the same paths

**Rules:**
- Copy today's Danish files into `starter/i18n/da-DK/` first, unchanged. Then write the English starter.
- English page files: `home.md`, `contact.md`, `privacy-policy.md`, `not-found.md`, `blog.md`. Update
  `standard-pages.json` and every reference to the old names. Add `.remove` files so that `morpheme locale da-DK`
  gives today's Danish file names.
- `config.locale` becomes `'en-US'` in the English starter.
- The demo follows the starter: check `demo/` for files that name the old page files. Update them.
- Update `scripts/starter.mjs` and `scripts/check-starter.mjs` if they name the old files.

**Acceptance check:**
- `check:starter` passes with the English starter.
- `check:starter` also passes after `morpheme locale da-DK` in a copy of the starter. The result has the same files and
  the same content as the Danish starter before this batch (compare with `git show <base>:starter/...`).
- `check:demo` passes.

- [ ] Do the changes. Run the acceptance check.
- [ ] Commit: `Move the Danish starter into a language layer`. Commit: `Write the starter in English`.

### Task 6.3: end the project — Sonnet agent

**Files:** `scripts/check-language.mjs` (delete `PENDING` and its use), `docs/editor.md` (how a new Danish site
starts: `npx morpheme locale da-DK`), `.changeset/<name>.md` (`minor`: "The starter is English;
`npx morpheme locale da-DK` makes it Danish.")

- [ ] Delete `PENDING`. Run `npm run check:language`. Make sure that it exits with 0.
- [ ] Run the batch check.
- [ ] Commit: `Check every file for Danish outside the language files`.
- [ ] Open the PR. Merge it when the checks pass.
- [ ] Do the master plan's *After the last batch* steps.
