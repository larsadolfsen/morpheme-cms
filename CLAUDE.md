# CLAUDE.md

**Morpheme is a blazingly fast and user-friendly CMS built for modern coding** (owner, 19 Nov 2026). Weigh every choice
against it.

The rules every agent session in `@morphemecms/cms` follows. `AGENTS.md` points here. A `README.md` is written for
people: no agent reads one for rules, and no rule lives in one.

Rules that only some tasks need are skills in `.claude/skills/`. Load the one that fits before you start; each rule lives
in one place only, so never work from memory of a skill.

| Skill | Load it when |
| :--- | :--- |
| `developer` | you start any task in this repository as a developer session (build, fix or docs): it comes first and says which of the other skills to load |
| `changesets` | you open a pull request: its changeset, which level the base branch allows, the version lines, and the line's one version (`0.20.0`) |
| `release-notes` | a change is something a site owner sees, or a note, an edition or a version's notes are written or fixed |
| `checks` | you choose which checks to run before a push, or a CI job fails |
| `material-3` | a spec or a change touches anything outside the page and post editor's bar and menus, or deviates from Material 3 |
| `pm` | the owner makes the session the project manager (`/pm <version>`), or the orchestrator merges while no PM runs |
| `cto` | the owner makes the session the CTO, or asks where the product, the code, the process or the roadmap should go next |
| `release` | the owner says `/release`, or asks to release, publish to `latest` or ship a version |

## How we work

### Reports to the owner are short

Write to the owner short and concise: a brief résumé of what changed and what the owner has to do or decide, in a few
lines, English only. No long explanations, tables or lists of every step. The owner asks when more is wanted.
Questions to the owner are numbered (1, 2, 3 …), so the owner can answer by number (owner, 22 Nov 2026: "Number questions
remember that").

Never send the owner a Preview link for a change to the editor (the owner can't sign in on a Preview to see it); only
for a change visible on the site.

### A brainstorm session never codes

When the owner says a session is a brainstorm (or "we are brainstorming"), the session writes no code: no edits to source,
styles, tests, scripts or content, no builds and no checks run to prove code. It talks, asks, reads the real sources (for
Material 3 the actual pages, never memory) and writes plans and specs in `docs/superpowers/` only. "Let's build", "continue" and
"work on" inside a brainstorm are not a go-ahead: the session asks once whether to build, and builds only when the owner says so in
plain words. The plans go to the PM, who hands them to new sessions.

### The flow

Every change goes branch → feature → `next` → live (owner, 19 Nov 2026), one feature at a time (`docs/superpowers/plans/2026-11-18-release-per-feature.md`), and is seen at each step: a branch on its own demo Preview; a feature (`feature/<name>`, cut from `main`, its pull requests merged into it) on the demo, where the owner reviews it (`morpheme-demo`, whose production branch in Cloudflare the owner sets to the feature being built; the demo never shows the live site); `next`, the feature merged into `main`, on `morpheme-staging` as the test version from npm, with real sign-in and saving; live, a release on the sites (`latest`). A single fix skips the feature and goes as one pull request into `main`. Nothing is released that staging has not run (skill `release`).

**One release per line** (owner, 22 Nov 2026: "we only do 19, 20, 21, etc."; `docs/superpowers/plans/2026-11-22-one-release-per-line.md`): from 0.20 a line is released once, as `0.N.0`. Its features are batches: each goes through the demo, `main` and staging, where the owner approves it, and then the next batch starts; only the whole line goes live. The one exception is an urgent fix for a bug that breaks a live site, released as `0.N.1` from `hotfix/0.N`, and only when the owner calls it in words.

The repository has only `main`, the Release PR's branch, the feature branches being built, `hotfix/0.N` while an urgent fix is open, the branches of open pull requests and
`screenshots` (owner, 21 Nov 2026). GitHub deletes a branch when its pull request merges; a session never makes a branch for anything
else (screenshots go into `screenshots`, skill `developer`).

### Only the owner releases a new version

**Only the owner releases a new version of `@morphemecms/cms`.** No agent releases, and no agent takes a step towards a
release without the owner's explicit yes in the conversation. That means:

- Never merge the Release PR (*Release @morphemecms/cms*, branch `changeset-release/main`), and never run `/release` on
  your own.
- Never approve, publish, re-tag or reject a version on npmjs.com (`npm publish`, `npm dist-tag`, the staged-packages
  page).
- Never create a version tag or a GitHub release, never run `release:version`, and never edit `CHANGELOG.md` by hand. The
  `version` in `package.json` is set once, by the first pull request of a feature or fix, to the version it will be released as, so
  the demo shows it (owner, 19 Nov 2026; `docs/superpowers/plans/2026-11-19-version-at-feature-start.md`); never otherwise.
- Never release a product that hasn't been seen on staging (owner rule, 18 Nov 2026). The exact build that would be
  released must already have run on `morpheme-staging` before anyone asks the owner for a release; a Release PR whose
  version was never seen on staging is never merged, even with an earlier yes (skill `release`, Phases 1 and 2).

Merging an ordinary pull request into `main` only stages a test version under the npm tag `next`, and the owner decides about that
version too; a merge into a version line's branch stages nothing on npm. An agent that thinks a release is due says so to the owner and waits. When the owner says `/release`, the
session loads the `release` skill and follows its phases in order; it never releases any other way.

### Pull requests go to the PM

**There is always a PM.** Each version being built has a session as its project manager (skill `pm`). The owner names the version: a line (`/pm 0.20`), or an urgent fix the owner calls (`/pm 0.20.1`). It merges the pull
requests of its own feature only, and never creates, changes, pushes or merges anything of another version, earlier or later (owner,
20 Nov 2026), except releases, in this repository and in
`morpheme-staging`, `morpheme-appstore` and `morpheme-apps`, and it keeps nothing behind. The owner does not merge and is not
asked to.

Every other session starts by loading the `developer` skill and:

- opens its pull request with a changeset (skill `changesets`) and gets its `check` job green;
- pushes its branch when its PM says "your slot": the owner has given that message the owner's own permission (owner, 20 Nov
  2026: "The pm has my permission to tell Dev sessions to push"), so the session pushes without asking the owner again;
- reports the link and head sha to the PM and leaves the merge to it;
- never merges its own pull request and never asks the owner to merge one.

If a pull request waits and no PM seems to be running, the session tells the owner, who starts a new PM. While no PM
runs, the orchestrator (the owner's "To do list" session) may merge the pull requests of the sessions it started, by the
rules in the `pm` skill.

### Nothing is ready while a build is red or unchecked

Owner, 19 Nov 2026 (after a merge was called done and release steps were given while staging's build failed): whoever merges, the PM,
the orchestrator or any session the owner tells to, checks every Cloudflare build that merge starts (the demo, `morpheme-staging`, the
store, the sites on `next`) and reports the merge as done only when they are green. No session tells the owner that something is ready,
or gives the next step towards a release (approve `next`, `/release`), without having read the newest of those builds; a red one is
reported with its cause instead (skill `pm`, *Cloudflare builds*).

### Roles

The **CTO** (skill `cto`) finds out and decides with the owner what happens in the future, writes the specs and plans, and decides
itself whether and when it writes code; the **PM** (skill `pm`) runs the work. Every developer session (build, fix or docs) loads the `developer` skill first. An orchestrator breaks a task down, delegates it to Claude subagents (the first choice when the task needs the repo's
rules) or, for mechanical code with a precise specification, to the Developer (Ollama, `qwen3.8:27b` at
`http://127.0.0.1:11434`, local only), then reviews, tests and integrates. Claude in the cloud (claude.ai/code) runs when
the PC is off and uses subagents for code.

## The repository

### This is the CMS, not the store

Two repositories must **never** be confused:

- **`morpheme-appstore`** is the store: a Cloudflare Worker that works as a private npm registry (D1 for metadata, tokens
  and keys, KV for tarballs), responsible for distribution and licenses. No CMS logic, Astro code or themes.
- **`morpheme-cms`** (this one) is the CMS product, `@morphemecms/cms`: the Astro editor, the CMS core, the default theme
  *Material* (Material Design 3) and its blocks and components, the site's Worker, the starter and the demo. It is
  published on npmjs.com as a public package (`.github/workflows/publish.yml`).

This repository is the only source of the CMS (since 2026-11-05). `morpheme-website` installs `@morphemecms/cms` from
npm and has no `packages/editor/`; its check fails if that folder comes back. Every change to the editor, the theme, the
Worker, the starter or the demo is a pull request here.

### Key folders

- **`theme/`**: the default theme *Material*. `theme/styles/`: the rules that use the tokens (`ui.css`, `blocks.css`, `global.css` …);
  the tokens themselves (every custom-property declaration) are in `theme/styles/tokens/` (`docs/theme-token-files.md`). `theme/ui/`: M3 UI components. `theme/blocks/`: the
  default blocks' look (`View.tsx`, CSS).
- **`src/` and `pages/`**: the editor. `src/`: React UI, screens, fields, state (`store.ts`), live preview
  (`pagePreview.tsx`), block registry (`blocks.ts`), the start screen's widgets and dashboard (`DashboardGrid.tsx`,
  `DashboardEdit.tsx`, `widgets/`). `pages/`: the admin interface's Astro pages and routing.
- **`lib/`**: helpers shared by the editor and the site (block parsing `blocks.mjs`, image cropping `crop.mjs`, status,
  dates, video). The app sandbox (contract 4): `app*.mjs`, `reads.mjs`, `afterBuild.mjs`, `sandboxHooks.mjs`,
  `contentColors.ts` and `lib/sandbox/` (the QuickJS runner is the security boundary); an app's places and build
  problems show on its page (`src/AppPlaces.tsx`, `src/AppProblems.tsx`, `worker/app-problems.js`).
- **`worker/`**: the site's Cloudflare Worker (login/session, GitHub commit proxy, R2 backup, redirects, scheduled tasks).
- **`bin/`**: the `morpheme` CLI (image processing, build hooks, validation).
- **`demo/`**: a made-up site laid over the starter, which the CMS is developed and checked with and which the themes'
  images are taken of. `npm run build` (`scripts/demo-build.mjs`, not in the package) builds it in
  `.morpheme/demo/site/`; `wrangler.jsonc` puts it on the Worker `morpheme-demo`, whose address shows the feature being built (the demo Worker's production branch in Cloudflare, set by the owner), never the live site. Each branch gets its own Preview
  (`npx wrangler preview`), whose address Cloudflare writes on the pull request; login and save do not work there.
  The demo's Blocks are an index (`/blocks/`) and one page for each main component or special block (`/blocks/<name>/`, the file
  `demo/src/content/pages/blocks-<name>.md`; the list and its rules are in `scripts/demo-blocks.mjs`).
- **`starter/`**: what a new site starts with (the *Deploy to Cloudflare* button).
- **`release-notes/`**: owner-facing release notes in English and Danish (skill `release-notes`).
- **`.changeset/`**: one changeset per pull request (skill `changesets`).

### The standard blocks

The blocks every site has, without an app: `buttons`, `cards`, `cookies`, `expand`, `imagegrid`, `list`, `notice`, `posts`,
`pricecards`, `steps`, `table`, `testimonials` and `video`. Each has its contract (type, fields, rules, texts, `viewOf.ts`,
`load.ts`) in `src/standard/<type>/` and its look (`View.tsx`, CSS) in `theme/blocks/<type>/`, and one page on the demo
(`/blocks/<type>/`). `checklist` is a former block (check lists are typed in the text) and the hero went in 0.18 (`lib/migrate-hero.mjs`):
their migrations stay, so a site that skips versions still moves its content (skill `developer`, *Removing a block*). The list is
`editorBlocks()` in `scripts/demo-blocks.mjs`; a block added or removed changes this paragraph in the same pull request. A theme styles
every one of them; an app brings its own blocks, never a new standard one.

### Before you push

Run `npm run check`. CI (`.github/workflows/check.yml`) runs the other checks as jobs side by side; its job `check` waits
for them all and must be green before a merge. Which checks to run locally, and which only CI runs: skill `checks`.

## Rules for code

### One theme for the site and the editor

Both the site and the editor (`/editor/`) use **exactly the same theme** (`theme/styles/global.css`, MD3 tokens,
typography and UI components). The editor has no font or style system of its own: everything inherits the theme's tokens,
surfaces and fonts.

### Colours in editor-drawn block parts

Colours in the editor's block parts (`src/editor.css`, `src/Inline*.tsx`) come only from the theme's context tokens: the `--mo-*`
roles and `currentColor`, never a fixed value and never a mix of a role (only Material 3's state layers and shadows may use `color-mix`).
A section on Primary, Secondary or Tertiary is painted with M3's container of its colour, and text and icons in it are the container's on-colour (a remap of
the page roles to M3 roles, in `theme/styles/tokens/material/sys.css`: the site's `.mo-text-section` with its `mo-is-<color>` kinds, and the editor's `[data-section-color]` nodes), so a part that uses the normal
tokens follows every section colour by itself. `npm run check:editor-colors` fails on a fixed colour (its allowlist gives the
reasons), `npm run check:color-roles` on a mix of a role or a role declared as anything but another role (its allowlist,
`scripts/color-roles.allow.mjs`, only shrinks), and `check:screens` checks text, placeholder, slot icons and outline of every entry of `inlineBlocks` on every section colour.

### Accessibility: WCAG 2.2 AA

Owner, 19 Nov 2026: the sites the CMS builds and the editor meet **WCAG 2.2 level AA**. A change never lowers it: contrast
(one final `check:contrast` scan when Material's M3 work is done, not per change; owner, 21 Nov 2026), keyboard use, a visible focus ring for keyboard focus (`:focus-visible`), names for screen readers, and
target sizes. Where Material 3 and WCAG differ, **Material 3 wins** (owner, 21 Nov 2026: "we follow MD3 even if it does not comply
with accessibility"): the part takes M3's value as printed, and the theme names the shortfall (below). A new base theme, built on
Material 3 and meeting WCAG 2.2 AA everywhere, comes after Material follows M3 (0.22.3; `docs/superpowers/specs/2026-11-21-base-theme-notes.md`).
The checks that enforce it: roadmap 0.19.2 to 0.19.4.

A theme may fall short of it on the site if its page says so (owner, 21 Nov 2026): the theme's `accessibility.json` names each
shortfall by WCAG criterion, the checks let through only what it names, and the editor shows it on the theme's page
(`docs/superpowers/specs/2026-11-21-theme-accessibility-statement-design.md`). *Material* follows Material 3 exactly and names the
shortfalls that gives; the editor's screens (theme page, settings, lists, dialogs) use the same parts, so the same named shortfalls hold
there. Only the page and post editor (its bar, overflow menu, text and block menus), which is outside Material 3, always meets WCAG 2.2 AA (owner, 21 Nov 2026).

### Icons are Material Symbols

Owner rule, 14 Nov, and 22 Nov 2026: the editor and the site draw Material Symbols, and Phosphor and Lucide are not in the package (0.19.6). A site whose
chosen pack is `phosphor` or `lucide` draws Material Symbols, with no warning; the update rewrites a stored icon name to its Material name
(`lib/migrate-icons.mjs`). Code draws icons by their Material name (`location_on`; `<name>-fill` is the filled one) through the shared `Icon`
(`src/icon.tsx`). A theme may bring its own pack (`icon-packs/`, files keyed by Material names, only the icons it draws its own way); the brand
logos (`site/brand/`) are drawn whatever pack is picked. `npm run check:phosphor` fails on any import of `@phosphor-icons/*` or Lucide, with no allowlist,
and `check:screens` fails on a Phosphor glyph and on an icon that is MISSING.

### Worker: no pending I/O promise in module memory

Cloudflare binds each I/O promise (D1, KV, R2, `fetch`) to the request that started it. Worker code (`worker/*.js`)
never keeps a pending I/O promise in module memory for later requests: when the first request stops, every later
request that awaits that promise hangs. Keep only finished results (a flag or a value set after `await`).
`node --test scripts/pending-shared.test.mjs` scans `worker/*.js` for this and fails on it. A deliberate exception
carries the comment `// pending-ok` with the reason.

## Language and words

### English first

- English (`en-US`) is the source language for all data models, schemas, fields, hints, blocks, APIs, code comments,
  error messages and technical documentation. Danish (`da-DK`) and every other language are translations of it.
- Agents write to the owner **in English only**: replies, reports, PR descriptions and commit messages. Never add a
  Danish summary or any Danish text, even when the owner writes in Danish. The Danish texts the product needs (the
  `da-DK` translations and release notes) are not affected.
- The default parts are written in English; their Danish texts are in `defaults/i18n/da-DK/` (collected in
  `defaults/texts.ts`, the default for `@site/texts`). If a default text lacks its Danish version, `check:content` stops.
  `npm run check:language` fails on Danish text outside the language files.

### Word choice

All wording in UI components, buttons and fields follows Material 3's *Global writing: Word choice*
(`https://m3.material.io/foundations/content-design/global-writing/word-choice`; the editor's own texts: skill
`site-editor-writing`).

- Short, precise sentences in the active voice. No local abbreviations or unexplained national concepts.
- **Image everywhere** (owner rule, 12 Nov): English texts, docs and notes say `image`. `check:language` fails on the
  old word; stored names (CSS classes, data attributes, saved ids) keep it and are listed in `scripts/check-language.mjs`.
- A switch and the status it gives: `On` / `Off` (their Danish labels are in the `da-DK` language files). The switch's label names the setting (`Promotion`, `Internal links`), never `Activated`. `Disabled` only for a greyed-out control (Material 3: "A disabled state communicates an inoperable component or element").
- Document status: `Draft`, `Published`. A page is scheduled with a date on `Publish` (`Schedule`); `Hidden` is the SEO
  setting `Hide from search engines`.
- Action buttons: active verbs without filler words (`Add tag`, `Edit page`, `Save`).

### Material 3 everywhere except the page and post editor

Owner, 13 Nov 2026: "We follow MD3 everywhere except the editor." Owner, 21 Nov 2026: that means only the page and post editor (its bar, overflow menu, text and block menus); the editor's other screens (theme page, settings, lists, dialogs) follow Material 3 like the site. Outside the page and post editor every design choice follows what m3.material.io prints, read from the real pages,
never from memory. Load the skill `material-3` before a spec or a change that touches such a part. An older decision, spec or rule
that differs from what M3 prints does not carry over (owner, 21 Nov 2026): M3 wins, and the session reports the old source
(`material-3`, rule 6).
