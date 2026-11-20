# Batch 1: the language check and the translation lookup

Status: done. Checked against the code on 2026-11-10.

Master plan: `2026-11-04-english-source.md`. Needs the CMS move (see *Start condition* there). Repo `morpheme-cms`,
paths from the repo's root. Tasks 1.1 and 1.2 are independent. Task 1.3 comes last.

**Batch check:** the checks in `AGENTS.md` section 4, then `node --test lib/danish.test.mjs lib/translate.test.mjs`
and `node scripts/check-language.mjs`.

---

### Task 1.1: `findDanish` and `check-language` — Sonnet agent

**Files:**
- Create: `lib/danish.mjs`, `lib/danish.test.mjs`, `scripts/check-language.mjs`

**Interfaces:**
- Produces: `findDanish(text: string, danishValues: Set<string>): { line: number; match: string; kind: 'letter' | 'value' }[]`
  (`lib/danish.mjs`). `line` starts at 1. A `'letter'` match is the whole line's first word with æ, ø or å.
  A `'value'` match is a quoted string (`'…'`, `"…"`, or `` `…` `` without `${`) that equals an entry of `danishValues`.
- Produces: `danishValuesOf(dictionaries: Record<string, unknown>[]): Set<string>` (`lib/danish.mjs`). It collects
  every string leaf of each dictionary (nested objects too). It skips a value that equals its own key.
- Produces: `isLanguagePath(path: string): boolean` (`lib/danish.mjs`). True when the path contains `/i18n/da-DK/`,
  starts with `i18n/da-DK/`, or ends with `i18n/da-DK.js`.
- Produces: `PENDING: string[]` (`scripts/check-language.mjs`): path prefixes not converted yet.

**Behaviour (`scripts/check-language.mjs`):**
- Get the file list from `git ls-files`.
- Skip a language path, `CHANGELOG.md`, `package-lock.json`, a path under `docs/superpowers/`, a path under a
  `PENDING` prefix, and a binary file.
- Also test each path itself with `findDanish` (a Danish file name is a `'letter'` match on line 0).
  A file is binary when its first 8000 bytes contain a zero byte.
- Load the Danish dictionaries with Vite's `ssrLoadModule`, as `scripts/check-content.mjs` does:
  `src/i18n/da-DK/index.ts`, and `defaults/i18n/da-DK/index.ts` when it exists.
- Print each match as `<path>:<line>  <match>`. Exit with code 1 when there is a match. Print `No Danish outside the
  language files.` and exit with 0 when there is none.

**Test cases (`lib/danish.test.mjs`; write Danish letters as `æ ø å` escapes):**

| Input | Expected |
|---|---|
| `findDanish('a\nb søg c', new Set())` | `[{ line: 2, match: 'søg', kind: 'letter' }]` |
| `findDanish("label: 'Indhold'", new Set(['Indhold']))` | one `'value'` match, `Indhold`, line 1 |
| `findDanish('// Indhold', new Set(['Indhold']))` | `[]` (not quoted) |
| ``findDanish('`Indhold ${x}`', new Set(['Indhold']))`` | `[]` (template with `${`) |
| `findDanish("'Content'", new Set(['Indhold']))` | `[]` |
| `danishValuesOf([{ Tags: 'Tags', Content: 'Indhold' }])` | `Set { 'Indhold' }` |
| `danishValuesOf([{ a: { b: 'Gem' }, f: () => 'x' }])` | `Set { 'Gem' }` |
| `isLanguagePath('src/i18n/da-DK/common.ts')` | `true` |
| `isLanguagePath('worker/i18n/da-DK.js')` | `true` |
| `isLanguagePath('src/i18n/index.ts')` | `false` |

- [ ] Write the tests in `lib/danish.test.mjs`. Run them. Make sure that they fail.
- [ ] Write `lib/danish.mjs`. Run the tests. Make sure that they pass.
- [ ] Write `scripts/check-language.mjs`.
- [ ] Run `node scripts/check-language.mjs` with an empty `PENDING`. Write each reported top folder into `PENDING`.
- [ ] Make `PENDING` as short as possible: one prefix per top folder (`defaults/`, `site/`, `lib/` …).
  Add `lib/danish.mjs`, `lib/danish.test.mjs` and `scripts/check-language.mjs` nowhere: they must pass now.
- [ ] Run `node scripts/check-language.mjs`. Make sure that it exits with 0.
- [ ] Commit: `Add a check for Danish text outside the language files`.

### Task 1.2: `translate`, `siteText` and `inSiteLanguage` — Sonnet agent

**Files:**
- Create: `lib/translate.mjs`, `lib/translate.test.mjs`
- Modify: `src/i18n/index.ts` (`siteText` calls `translate`; add `inSiteLanguage`)

**Interfaces:**
- Produces: `translate(dictionary: Record<string, string> | undefined, text: string, values?: Record<string, string | number>): string`
  (`lib/translate.mjs`). Returns `dictionary[text]`, else `text`. Then fills each `{name}` from `values`. A `{name}`
  without a value stays as it is. This is the logic in today's `siteText`, moved.
- Produces: `inSiteLanguage(text: string, values?: Record<string, string | number>): string` (`src/i18n/index.ts`).
  It translates into the site's language (`siteLocale`), not the editor's (`locale`). It uses the same dictionaries
  as `siteText`, for `siteLocale`. When `siteLocale === DEFAULTS_LOCALE` it returns the text with its values filled.
- Unchanged: the contract of `siteText(text, values?)`.

**Test cases (`lib/translate.test.mjs`):**

| Input | Expected |
|---|---|
| `translate({ 'Read more': 'Læs mere' }, 'Read more')` | `'Læs mere'` |
| `translate(undefined, 'Read more')` | `'Read more'` |
| `translate({}, 'Hi {name}', { name: 'Sara' })` | `'Hi Sara'` |
| `translate({ 'Hi {name}': 'Hej {name}' }, 'Hi {name}', { name: 'Sara' })` | `'Hej Sara'` |
| `translate({}, 'Hi {name}', {})` | `'Hi {name}'` |
| `translate({}, '{n} pages', { n: 3 })` | `'3 pages'` |

- [ ] Write the tests. Run them. Make sure that they fail.
- [ ] Write `lib/translate.mjs`. Run the tests. Make sure that they pass.
- [ ] Change `siteText` to call `translate`. Add `inSiteLanguage`. Update the header of `src/i18n/index.ts`.
- [ ] Run the batch check. Make sure that `check:screens` opens every screen as before.
- [ ] Commit: `Add inSiteLanguage for values that the editor writes into content`.

### Task 1.3: the check in the repo's checks — Sonnet agent

**Files:**
- Modify: `package.json` (`scripts`: `"check:language": "node scripts/check-language.mjs"`; add the two new tests
  to the repo's test script)
- Modify: `.github/workflows/check.yml` (a step `npm run check:language` after `npm ci`)
- Modify: `AGENTS.md` section 4 (a row for `npm run check:language`)
- Create: `.changeset/<name>.md` (`--empty`: a site gets nothing from this batch)

- [ ] Add the script, the workflow step and the row.
- [ ] Run `npm run check:language`. Make sure that it exits with 0.
- [ ] Commit: `Run the language check in CI`.
- [ ] Open the PR. Merge it when the checks pass.
