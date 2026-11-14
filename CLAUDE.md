# CLAUDE.md

The rules every agent session in `@morphemecms/cms` follows. `AGENTS.md` points here. A `README.md` is written for
people: no agent reads one for rules, and no rule lives in one.

Rules that only some tasks need are skills in `.claude/skills/`. Load the one that fits before you start; each rule lives
in one place only, so never work from memory of a skill.

| Skill | Load it when |
| :--- | :--- |
| `changesets` | you open a pull request: its changeset, which level the base branch allows, and the version lines (`0.17`, `0.18`, `0.19`) |
| `release-notes` | a change is something a site owner sees, or a note, an edition or a version's notes are written or fixed |
| `checks` | you choose which checks to run before a push, or a CI job fails |
| `material-3` | a spec or a change touches anything outside the editor's own workspace, or deviates from Material 3 |
| `pm` | the owner makes the session the project manager (`/pm <version>`), or the orchestrator merges while no PM runs |
| `release` | the owner says `/release`, or asks to release, publish to `latest` or ship a version |

## How we work

### Reports to the owner are short

Write to the owner short and concise: a brief résumé of what changed and what the owner has to do or decide, in a few
lines, English only. No long explanations, tables or lists of every step. The owner asks when more is wanted.

Never send the owner a Preview link for a change to the editor (the owner can't sign in on a Preview to see it); only
for a change visible on the site.

### A brainstorm session never codes

When the owner says a session is a brainstorm (or "we are brainstorming"), the session writes no code: no edits to source,
styles, tests, scripts or content, no builds and no checks run to prove code. It talks, asks, reads the real sources (for
Material 3 the actual pages, never memory) and writes plans and specs in `docs/superpowers/` only. "Let's build", "continue" and
"work on" inside a brainstorm are not a go-ahead: the session asks once whether to build, and builds only when the owner says so in
plain words. The plans go to the PM, who hands them to new sessions.

### Only the owner releases a new version

**Only the owner releases a new version of `@morphemecms/cms`.** No agent releases, and no agent takes a step towards a
release without the owner's explicit yes in the conversation. That means:

- Never merge the Release PR (*Release @morphemecms/cms*, branch `changeset-release/main`), and never run `/release` on
  your own.
- Never approve, publish, re-tag or reject a version on npmjs.com (`npm publish`, `npm dist-tag`, the staged-packages
  page).
- Never create a version tag or a GitHub release, never run `release:version`, and never edit the `version` in
  `package.json` or `CHANGELOG.md` by hand.

Merging an ordinary pull request only stages a test version under the npm tag `next`, and the owner decides about that
version too. An agent that thinks a release is due says so to the owner and waits. When the owner says `/release`, the
session loads the `release` skill and follows its phases in order; it never releases any other way.

### Pull requests go to the PM

**There is always a PM.** One session is the owner's project manager (skill `pm`). It merges every pull request except
releases, in this repository and in `morpheme-staging`, `morpheme-appstore` and `morpheme-apps`, and it keeps nothing
behind. The owner does not merge and is not asked to.

Every other session:

- opens its pull request with a changeset (skill `changesets`) and gets its `check` job green;
- reports the link and head sha to the PM and leaves the merge to it;
- never merges its own pull request and never asks the owner to merge one.

If a pull request waits and no PM seems to be running, the session tells the owner, who starts a new PM. While no PM
runs, the orchestrator (the owner's "To do list" session) may merge the pull requests of the sessions it started, by the
rules in the `pm` skill.

### Roles

An orchestrator breaks a task down, delegates it to Claude subagents (the first choice when the task needs the repo's
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

- **`theme/`**: the default theme *Material*. `theme/styles/`: MD3 tokens (3-tier: `md.ref.*`, `md.sys.*`, `md.comp.*`),
  typography (Roboto / Roboto Flex), elevation and colour scales. `theme/ui/`: M3 UI components. `theme/blocks/`: the
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
  `.morpheme/demo/site/`; `wrangler.jsonc` puts it on the Worker `morpheme-demo`. Each branch gets its own Preview
  (`npx wrangler preview`), whose address Cloudflare writes on the pull request; login and save do not work there.
- **`starter/`**: what a new site starts with (the *Deploy to Cloudflare* button).
- **`release-notes/`**: owner-facing release notes in English and Danish (skill `release-notes`).
- **`.changeset/`**: one changeset per pull request (skill `changesets`).

### Before you push

Run `npm run check`, and after a change to the editor also `npm run check:screens` (after `npm run build`). CI
(`.github/workflows/check.yml`) runs the checks as jobs side by side; its job `check` waits for them all and must be
green before a merge. Which other check fits which change: skill `checks`.

## Rules for code

### One theme for the site and the editor

Both the site and the editor (`/editor/`) use **exactly the same theme** (`theme/styles/global.css`, MD3 tokens,
typography and UI components). The editor has no font or style system of its own: everything inherits the theme's tokens,
surfaces and fonts.

### Colours in editor-drawn block parts

Colours in the editor's block parts (`src/editor.css`, `src/Inline*.tsx`) come only from the theme's context tokens: the `--mo-*`
roles, `currentColor` and `color-mix` of them, never a fixed value. A section on a colour swaps those roles to its on-colours once, in
`theme/styles/global.css` (the site's `.text-section-*` and the editor's `[data-section-color]` nodes), so a part that uses the normal
tokens follows every section colour by itself. `npm run check:editor-colors` fails on a fixed colour (its allowlist gives the
reasons), and `check:screens` checks text, placeholder, slot icons and outline of every entry of `inlineBlocks` on every section colour.

### Icons are Material Symbols

Owner rule, 14 Nov: the editor and the site draw Material Symbols until a site chooses another icon pack; Phosphor and
Lucide appear only when a site picks that pack (`src/data/icons.json`, or an installed theme's pack). Code draws icons by
name through the shared `Icon` (`src/icon.tsx`), never by a direct `@phosphor-icons/react` component import:
`npm run check:phosphor` fails on a new one (allowlist with reasons in `scripts/phosphor-allowlist.json`), and
`check:screens` fails on a Phosphor glyph while Material Symbols is the pack.

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
- Toggles and states: `Enabled` / `Disabled`, `On` / `Off` (their Danish labels are in the `da-DK` language files).
- Document status: `Draft`, `Published`. A page is scheduled with a date on `Publish` (`Schedule`); `Hidden` is the SEO
  setting `Hide from search engines`.
- Action buttons: active verbs without filler words (`Add tag`, `Edit page`, `Save`).

### Material 3 everywhere except the editor

Owner, 13 Nov 2026: "We follow MD3 everywhere except the editor." Outside the editor's own workspace (its toolbar/bar,
overflow menu, text and block menus) every design choice follows what m3.material.io prints, read from the real pages,
never from memory. Load the skill `material-3` before a spec or a change that touches such a part.
