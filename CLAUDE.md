# CLAUDE.md

## README files are for humans

A `README.md` is written for people. No agent reads one for rules, and no rule lives in one: the rules for agents are in
`CLAUDE.md`, and `AGENTS.md` refers to it.

## Reports to the owner are short

Write to the owner short and concise: a brief résumé of what changed and what the owner has to do or decide, in a few
lines, English only. No long explanations, tables or lists of every step. The owner asks when more is wanted.

## Only the owner releases a new version

**Only the owner releases a new version of `@morphemecms/cms`.** No agent releases, and no agent takes a step towards a
release without the owner's explicit yes in the conversation. That means:

- Never merge the Release PR (*Release @morphemecms/cms*, branch `changeset-release/main`), and never run `/release` on
  your own.
- Never approve, publish, re-tag or reject a version on npmjs.com (`npm publish`, `npm dist-tag`, the staged-packages
  page).
- Never create a version tag or a GitHub release, never run `release:version`, and never edit the `version` in
  `package.json` or `CHANGELOG.md` by hand.

Merging an ordinary pull request only stages a test version under the npm tag `next`, and the owner decides about that
version too. An agent that thinks a release is due says so to the owner and waits.

**The `release` skill (`.claude/skills/release/SKILL.md`) is what we use whenever we release a version.** When the owner
says `/release` (or asks to release, publish to `latest` or ship a version), the session loads that skill and follows
its phases in order, including its check that sites can still update themselves; it never releases any other way.

## The project manager merges, and nothing is left behind

One session is the owner's project manager (PM). It is responsible for merging pull requests, and it is responsible for
nothing being left behind. The owner has handed it these decisions, so it does not ask the owner for permission to do
work that is already assigned.

A session becomes the PM with the `pm` skill (`/pm <version>`, `.claude/skills/pm/SKILL.md`), and the PM never codes: every change goes to a new session.

**There is always a PM.** The owner always has a PM session running that handles merges; it is never left without one.
Every other session opens its pull request, gets its `check` job green, reports the link and head sha to the PM and
leaves the merge to it. A session never merges its own pull request, and never asks the owner to merge one. If a pull
request waits and no PM seems to be running, the session tells the owner so, and the owner starts a new PM.

**When no PM is running, the orchestrator merges.** The orchestrator is the session that started the other sessions
for the owner (the owner's "To do list" session). While no PM session is active, it may merge the pull requests of the
sessions it started, under the conditions in **Merging** below, and only after it has read the diff. A PM session is
active when one exists that is not archived, also when it is idle: an idle PM gets a short message from the orchestrator
first, and the orchestrator merges nothing while the PM can still pick the pull request up. When a PM starts, it
takes over every pull request that is waiting, and the orchestrator stops merging. The orchestrator never merges the
Release PR, and the rules in **Only the owner releases a new version** apply to it as to every session. The sessions it
started still never merge their own pull requests.

**Merging.** The PM makes every merge decision, in this repository and in `morpheme-staging`, `morpheme-appstore` and
`morpheme-apps`, also where a merge may deploy something live (the store). The owner does not merge and is not asked to:
the PM merges everything except releases (the Release PR, npm approvals and version tags). It squash-merges a pull
request when all of this holds, one pull request at a time:

- the pull request is not a draft, has no merge conflict and no unresolved review comment;
- its `check` job (`morpheme-staging`: its `Workers Builds` check) has finished green on the current head;
- its changeset keeps `@morphemecms/cms` below `1.0.0`, as the owner decided: never `major`. The rule depends on the
  base branch. Into `main`: only `patch` or an empty changeset until `0.15.1` is released, so the Release PR stays
  `0.15.1` (after that the owner decides again). Into `0.17`: `minor` is allowed (the editor spec's work), never `major`, so it stays below `1.0.0`.

The `0.17` branch collects the 0.17 work; its PM merges into it, and `main` is merged into it after each release
(never the other way). Only `main` has a Release PR and builds `next` and `latest`.

The `0.18` branch collects the 0.18 work (spec `docs/superpowers/specs/2026-11-11-intuitive-editor-design.md`); into it `minor` is
allowed, never `major`, so it stays below `1.0.0`. `0.17` is merged into `0.18` after each merge into `0.17` until 0.17 is
released, then `main` is merged into it after each release. Only `main` has a Release PR.

The `0.19` branch collects the 0.19 work; into it `minor` is allowed, never `major`, so it stays below `1.0.0`. `0.18` is merged
into `0.19` after each merge into `0.18` until 0.18 is released, then `main` is merged into it after each release. Only
`main` has a Release PR.

A pull request that conflicts, has no `check` job or has the wrong changeset is not merged. The PM asks the session
that owns it to merge `main` into the branch (never a rebase, amend or force-push on someone else's branch) or to fix
the changeset, and merges when it is right. It never merges the Release PR.

**Nothing left behind.** The PM keeps one list of everything in flight and works it until it is empty: pull requests
waiting to merge, sessions that went quiet without a pull request (it starts a fresh session with the whole task in its
first prompt when a session stays stuck), release notes and changesets a merged change still lacks, follow-ups the
sessions report, branches that are fully merged, and open questions for the owner. It archives a session once its work
is merged (after checking it has no open question for the owner and no unmerged branch). It tells the owner only what the owner has to do or decide, such as approving a `next` build on npmjs.com,
and which version to approve, because every merge to `main` stages a new `next` build that only the owner approves. A pull request the owner has to see is assigned to the owner; the owner does not see the rest.

**Cloudflare builds.** The PM also keeps an eye out for failed Cloudflare builds: the `Workers Builds: …` check on every
pull request and on `main` (the demo, `morpheme-demo`), and the builds of `morpheme-staging` and of the sites that
install the `next` version. A failed build is never left unmentioned. The PM reads the build log, finds the cause and
says which change caused it. Then it either has a fix made, in a session in the repository that owns the fix and as a
normal pull request, or it tells the owner exactly what failed and what it needs. It does not deploy or run `wrangler`
against the live Cloudflare account itself.

## Changesets and release notes

Every pull request into `main` has one file here, made with `npx changeset`: whether it is a `patch`, `minor` or
`major` change of `@morphemecms/cms` (the rules of *Appbutikken* in `morpheme-website`'s `CLAUDE.md`: major only when
something a site has stops working as before) and one line of release note, in English, for a site's owner. A pull
request that changes nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.

Each merge stages a test version for npm's `next` tag for `morpheme-staging`; the *Release* pull request, merged
when the owner says go, turns the files here into `CHANGELOG.md` and stages `latest`. A staged version is on npm once
the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`).

### Release notes for owners

A version's notes have exactly two sections: *New in <version>* (the paragraphs) and *Also in this version* (the lines).
A change a site owner sees gets a release note in English and Danish, written like the notes of 0.14.0: short
paragraphs (a title with a verb first, 1–3 sentences) and one-line entries, and no screenshots. **Everything that changes how the editor looks, how the site looks, or gives an edge over WordPress
(safer, faster, cheaper to run, easier to keep) gets its own paragraph, never a line**; small tweaks and fixes are lines.
A version's editions have a photo and a name.
**The skill `release-notes` (`.claude/skills/release-notes/SKILL.md`) must be used** whenever a note, an edition or a
version's notes are written, changed or fixed: it holds the kinds (`paragraph`, `line`), the files, the writing rules and the editions. The rules are not repeated here.

# Repository and workflow

## 1. Context, Purpose and Scope

Our ecosystem has two completely separate repositories, which must **never** be confused:

1. **`morpheme-appstore` (the store / the distribution server):**
   - Cloudflare Worker-repository (`larsadolfsen/morpheme-appstore`).
   - Works as a private npm registry with Cloudflare D1 (metadata, tokens, keys) and Cloudflare KV (tarballs).
   - Responsible for package distribution and licenses.
   - Contains **no** CMS logic, Astro code or theme implementations.

2. **`morpheme-cms` (this repository – the CMS product itself, `@morphemecms/cms`):**
   - The Astro editor itself, the CMS core and the official default theme.
   - Contains the editor (`src/`, `pages/`), shared libraries (`lib/`), the site's Cloudflare Worker (`worker/`), the default theme (`theme/`), the starter (`starter/`) and the demo (`demo/`).
   - Published on npmjs.com as a public package (`.github/workflows/publish.yml`): every merge to `main` stages a
     test version under the npm tag `next` for `morpheme-staging`; the pull request *Release @morphemecms/cms*, which
     Changesets keeps open, is merged when the owner writes `/release` (`.claude/skills/release/SKILL.md`), and stages `latest`. A version is only on npm when
     the owner has approved it on npmjs.com with 2FA (*staged publishing*); an agent never approves. Never merge
     the Release PR without the owner's yes.
   - This repository is the only source of the CMS (since 2026-11-05). `larsadolfsen/morpheme-website` installs `@morphemecms/cms` from npm and has no `packages/editor/`; its check fails if that folder comes back. Every change to the editor, the theme *Material*, the Worker, the starter or the demo is a pull request here.

> [!IMPORTANT]
> This repository is **not** the store or the Cloudflare npm registry. All development here concerns the CMS editor, the Astro integration, the default theme Material Design 3 (*Material*) and the related blocks and components.
>
> **Shared theme principle (frontend & backend):**
> Both the site's frontend and the admin editor (`/editor/`) use and share **exactly the same theme** (`theme/styles/global.css`, MD3 tokens, typography and UI components). The editor has no separate font or style system: everything inherits directly from the theme's tokens, surfaces and fonts.

## 2. Key Folders & Structure

- **`theme/`**: The official default theme (**Material Design 3 / *Material***).
  - `theme/styles/`: MD3 design tokens (3-tier: `md.ref.*`, `md.sys.*`, `md.comp.*`), typography (Roboto / Roboto Flex), elevation and color scales.
  - `theme/ui/`: M3 UI components (Buttons, Cards, Chips, Dialogs, Top App Bar, Navigation Bar/Rail/Drawer etc.).
  - `theme/blocks/`: Default blocks and their visual look (`View.tsx`, CSS).
- **`demo/`**: The CMS's demo, a made-up site laid over the starter, which the CMS is developed and checked with and which the themes' pictures are taken of (`npx morpheme check:demo`). `npm run build` (`scripts/demo-build.mjs`, not in the package) builds it in `.morpheme/demo/site/` with a copy of the package as npm would pack it, and `wrangler.jsonc` puts it on the Worker `morpheme-demo`. Each branch gets its own Preview of the demo (Cloudflare's Worker Previews, `npx wrangler preview`), and Cloudflare writes its address on the branch's pull request; login and save do not work there. Agents never send the owner a Preview link for a change to the editor (the owner can't sign in there to see it); only for a change visible on the site.
- **`starter/`**: What a new site starts with (the *Deploy to Cloudflare* button).
- **`src/` and `pages/`**: The CMS editor itself and the admin interface.
  - `src/`: React-based editor UI, screens, fields, state management (`store.ts`), live preview (`pagePreview.tsx`), block registry (`blocks.ts`) and the start screen's widgets and dashboard (`DashboardGrid.tsx`, `DashboardEdit.tsx`, `widgets/`).
  - `pages/`: Astro pages and routing for the admin interface.
- **`lib/`**: Shared helper functions used by both the editor and the site (block parsing `blocks.mjs`, image cropping `crop.mjs`, status, dates, video handling etc.).
  - The app sandbox (contract 4): `app*.mjs`, `reads.mjs`, `afterBuild.mjs`, `sandboxHooks.mjs`, `contentColors.ts` and `lib/sandbox/` (the QuickJS runner is the security boundary); an app's places and build problems show on its page (`src/AppPlaces.tsx`, `src/AppProblems.tsx`, `worker/app-problems.js`).
- **`worker/`**: The site's default Cloudflare Worker (login/session, GitHub commit proxy, R2 backup, redirects and scheduled tasks).
- **`bin/`**: The `morpheme` CLI tool for image processing, build hooks and validation.
- **`release-notes/`**: Owner-facing release notes in English and Danish: paragraphs (title and text per language) and lines, no screenshots. Each pull request writes `i18n/<locale>/pending/<id>.json`; `release:version` moves them to `i18n/<locale>/<version>.json`. Writing rule: "Changesets and release notes" above.

## 3. Roles and Division of Work

An orchestrator breaks a task down, delegates it to Claude subagents (the first choice when the task needs the repo's rules) or, for mechanical code with a precise specification, to the Developer (Ollama, `qwen3.8:27b` at `http://127.0.0.1:11434`, local only), then reviews, tests and integrates. Claude in the cloud (claude.ai/code) runs when the PC is off and uses subagents for code. Every pull request has a changeset: see "Changesets and release notes" above.

## 4. Verification and Test Commands

Before changes are approved or published, verify the following from the root of this repository, on the demo
(`npm run build` builds it in `.morpheme/demo/site/`). CI (`.github/workflows/check.yml`) runs `check`,
`check:screens`, `check:demo` and `check:starter` on every pull request; its job `check` must pass before a merge.

| Command | Description |
| :--- | :--- |
| `npm run check` | Prettier, `check:language`, the unit tests (`npm test`), the package's types (`check:types`), the demo built (`npm run build`, its content checked by the editor's rules) and `check:editor` on it (each page the same after a save). |
| `npm run check:language` | No Danish text outside the language files (i18n/da-DK/). |
| `npm run check:screens` | After `npm run build`: all of the editor's screens open without errors, on a phone and a computer, and all icons exist. |
| `node ../../../bin/morpheme.mjs check:themes` (in `.morpheme/demo/site/`) | The same with each of the other themes. |
| `npm run check:starter` | The starter works as a site with the package from `npm pack`: its own `npm run check` (the site's types and `check:worker`) and its build. |
| `npm run check:demo` | The demo builds with the default theme and follows the editor's rules. |

### Worker rule: no pending I/O promise in module memory

Cloudflare binds each I/O promise (D1, KV, R2, `fetch`) to the request that started it. Worker code (`worker/*.js`)
never keeps a pending I/O promise in module memory for later requests: when the first request stops, every later
request that awaits that promise hangs. Keep only finished results (a flag or a value set after `await`).
`node --test scripts/pending-shared.test.mjs` scans `worker/*.js` for this and fails on it. A deliberate exception
carries the comment `// pending-ok` with the reason.

## 5. General Approach: English First

Writing and thinking in English first is an **overall, general approach** across the whole project, the architecture and the collaboration model:

1. **Universal source language (Source of Truth):**
   - English (`en-US`) is always the source language for all data models, schemas, fields, hints, blocks, APIs, code comments, error messages and technical documentation.
   - All other languages (including Danish `da-DK`) are localizing translations (`translations`) of the English reference form.
2. **Communication and reply format:**
   - Agents write to the owner **in English only**: replies, reports, PR descriptions and commit messages. Never add a
     Danish summary or any Danish text, even when the owner writes in Danish. The Danish texts the product needs (the
     `da-DK` translations and release notes) are not affected.
3. **i18n fallback architecture:**
   - The default parts are written in English; their Danish texts are in `defaults/i18n/da-DK/` (collected in `defaults/texts.ts`, the default for `@site/texts`). If a default text lacks its Danish version, `check:content` stops.

## 6. Material Design 3: Global Writing & Word Choice

All wording in UI components, buttons and fields follows the specific guidelines for **Content Design: Global Writing & Word Choice** (cf. `https://m3.material.io/foundations/content-design/global-writing/word-choice` and the skill `.agents/skills/word-choice/SKILL.md`).

- **Short, precise sentences in the active form** (Active Voice).
- **Universal terms:** No local abbreviations or unexplained national concepts.
- **M3 canonical terminology:**
  - Toggles and states: `Enabled` / `Disabled`, `On` / `Off` (their Danish labels are in the `da-DK` language files).
  - Document status: `Draft`, `Published`. A page is scheduled with a date on `Publish` (`Schedule`); `Hidden` is the SEO setting `Hide from search engines`.
  - Action buttons: Active verbs without filler words (`Add tag`, `Edit page`, `Save`).
