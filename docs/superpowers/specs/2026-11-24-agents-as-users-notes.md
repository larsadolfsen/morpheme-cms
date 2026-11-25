# Agents as users: notes

> **Status:** ideas, not a plan. Written in a brainstorm session, 24 November 2026; no code written, no builds, no checks run.
> They expand the idea *Agents as users* under *Later* in the roadmap (`plans/2026-11-14-roadmap-0-18-to-0-24.md`), which stays
> as it is. The owner's word stands: "Just keep it. First we must make it work for humans." Nothing here starts before the editor
> works for people; when it does, a plan is written first. Read against `origin/main` at `7c254ab`.

## Why

The owner asked whether removing Tailwind (0.19.0) was right, since coding agents know Tailwind and may choose a CMS that uses it.
The answer in the brainstorm: Tailwind stays gone (a theme cannot restyle a block whose look is utilities in its markup, and
utilities let a theme write values the M3 tokens forbid). What makes an agent choose and succeed with a CMS is something else:

1. **It knows it**, or can learn it in seconds (rules it can read, names it already knows).
2. **It succeeds on the first try** (a starter that works, scaffolds that pass, errors that name the fix).
3. **It can operate it** (an MCP server that writes, not only reads).
4. **We measure it** (an agent does real tasks on a fresh site, and the result is tracked per release).

## What exists today

| What | Where | State |
| :-- | :-- | :-- |
| MCP server, read-only | `worker/mcp.js`, `lib/mcpTools.mjs`, `lib/mcpOAuth.mjs` | 5 tools: `site_info`, `list_content`, `read_content`, `list_apps`, `read_app_settings`. "No write tool exists in this version." |
| MCP writes | `specs/2026-11-11-mcp-design.md` | Designed (drafts by default, publishing off until the owner allows it); roadmap 0.27.0. |
| Layout vocabulary instead of Tailwind | `theme/styles/layout.css`, `docs/theme-layout-classes.md` | Done: `mo-row`, `mo-stack`, `mo-grid-2/3/4`, `mo-fill` … token-bound. |
| Tailwind → `mo-` map | `docs/tailwind-migration-classes.md` | 578 classes, each with what to write instead. Prose only. |
| Tailwind check on sites | `site/tailwind.mjs` (run by `check:content`) | Names file, line and rule, then says "Write plain CSS and mo- classes (docs/tailwind-migration.md)", a file the package does not ship. |
| M3 names | roadmap 0.20.0, contract 8 | Every token becomes `--mo-` + M3's own name (`md.comp.search-bar.container.color` → `--mo-comp-search-bar-container-color`), so an agent that knows M3 can derive ours. |
| Agent rules in this repo | `CLAUDE.md`, `AGENTS.md`, `.claude/skills/` | For developing the CMS, not for building a site with it. |
| Agent rules for a site | `morpheme-website/.agents/skills/site-editor-{block,theme,app,writing}` | Live in one site's repository, not in the package. |

## Gaps found

1. **The package ships no agent rules.** `package.json` `files` has no `docs/`, `AGENTS.md` or skills. Sara's `CLAUDE.md` tells her
   agent to read `node_modules/@morphemecms/cms/` `AGENTS.md` and `docs/`; neither is there. The Tailwind check points to a doc that
   is not shipped.
2. **The starter has no `AGENTS.md` or `CLAUDE.md`.** A new site's agent starts with the README only.
3. **The CLI's help is Danish** (`bin/morpheme.mjs:48`, "Brug: morpheme <kommando> …"), against *English first*, and there is no
   `morpheme help <command>`.
4. **Errors name the rule, not the fix.** The Tailwind check could say `` `flex` → `mo-row` `` from the map it already has.
5. **No machine-readable output.** No `check:*` command has `--json`; an agent parses prose.
6. **No published schema** for `app.json`, `theme.json`, a block's fields or the settings data.
7. **No scaffolds.** An agent copies an existing block or app by hand and guesses what to remove.
8. **No measurement.** Nobody knows how often an agent succeeds on a fresh site.

## The ideas

Numbered so they can be named; none is designed. A likely order: A, then B, then C; D starts with A and runs from then on.

### A. The rules reach the agent

1. **Site-author docs in the package.** A new folder `agents/` (shipped in `files`): `AGENTS.md` for someone building a site, theme,
   block or app with Morpheme (not this repository's `CLAUDE.md`), plus the docs it links: `app-contract.md`, `class-names.md`,
   `css-tokens.md`, `theme-layout-classes.md`, `theme-grid.md`, `type-classes.md`, `tailwind-migration*.md`. Never
   `docs/superpowers/`. A check fails when a shipped doc links a file that is not shipped.
2. **The site-editor skills move into the package** (`agents/skills/site-editor-*`), out of `morpheme-website`, so every site gets
   them and they change with the CMS version they describe (question 3).
3. **The starter points at them.** `starter/AGENTS.md` and `starter/CLAUDE.md`: three lines naming
   `node_modules/@morphemecms/cms/agents/AGENTS.md` and what is the site's own (`src/site/`, `src/content/`, `src/data/`). The upgrade
   command adds them to existing sites once.
4. **`llms.txt` and `llms-full.txt`**, generated from `agents/` by a script (never written by hand), shipped in the package and
   published on Morpheme's public website (question 2). It says in one place: what Morpheme is, the folders, the contract, "no
   Tailwind: write these instead", and "an M3 token `md.sys.x` is `--mo-sys-x`".
5. **The CLI in English**, with `morpheme help` and `morpheme help <command>` (what it does, its options, an example).

### B. The agent gets it right the first time

6. **Every problem names its fix.** One shape for a check's problem: file, line, rule, fix, doc (a shipped file). First the Tailwind
   check: the 578-row map becomes data in `site/` (generated from the same source as the doc), and the message reads
   `` src/themes/x/Hero.tsx:12: `flex` is Tailwind; write `mo-row` (agents/tailwind-migration.md) ``. Then the token checks: `--md-…`
   or an old name gives the `--mo-` name.
7. **`--json`** on `check:content`, `check:themes`, `check:editor` and `check:worker`: the same problems as an array of that shape.
8. **Scaffolds:** `morpheme new block <type>`, `morpheme new app <id>`, `morpheme new theme <id>`. Each writes the smallest item that
   passes `check:content` and `check:themes`, with the folder layout the skills describe. A test runs each and the checks on the result.
9. **Published JSON Schemas** for `app.json`, `theme.json`, a block's fields and the files in `src/data/`, generated from the code
   that validates them (never a second source), shipped in `agents/schemas/` and named by `$schema` in the starter's files, so
   editors and agents validate while they write.
10. **Fewer allowlists.** Count every allowlist entry today; each one an agent meets is a rule with an exception it cannot guess. The
    goal is a number per release, going down; these notes remove none.

### C. The agent operates the site

11. **MCP writes**: roadmap 0.27.0, as `specs/2026-11-11-mcp-design.md` designs them (drafts by default).
12. **MCP reads an agent needs before it writes:** `list_blocks` (every block a site has, standard and apps', with its fields'
    schema from idea 9) and `read_settings` (menu, colours, contact), so the drafts it writes are valid the first time. Part of
    0.27.0's spec, not a new one.

### D. Measure it

13. **An agent test.** A fixed set of tasks, written once: add a page with three blocks; restyle the theme's primary colour and the
    cards; make a block with two fields; make an app with a setting; upgrade a site one version. An agent (Claude Code, a fresh
    session, no help beyond the package) runs them on a new starter site; a task passes when the site builds and `check:content`
    and `check:themes` pass. The pass rate and the problems met are written to `docs/agent-test.md` per release. Run by hand at
    first (question 4); the CMS repository may run it in CI later, as its other checks are.
14. **Being found.** The npm description and keywords, the README's first lines and `llms.txt` say what an agent needs to choose
    Morpheme. Listing the MCP server in public registries waits for C and is the owner's decision, never an agent's.

## Rough sizes

| Idea | Size | Depends on |
| :-- | :-- | :-- |
| 1, 3, 5 | small | nothing |
| 2 | small, two repositories (`morpheme-cms`, `morpheme-website`) | 1 |
| 4 | small | 1; the website for publishing |
| 6 | medium (Tailwind first, then tokens) | 1 |
| 7 | small | 6 |
| 8 | medium | 1, 2 |
| 9 | medium | nothing; 8 uses it |
| 10 | report only | nothing |
| 11, 12 | large | 0.27.0 |
| 13 | small to write, recurring to run | 1 to 3 |
| 14 | small | 4; registries after 11 |

A (ideas 1 to 5) is about a day of work and changes no runtime code; it is the cheapest step towards "agents choose Morpheme".

## Open questions (for when it starts)

1. Does A wait until the editor works for people, like the rest, or go earlier as docs-only pull requests?
2. Which site is Morpheme's public website, where `llms.txt` is published?
3. Do the `site-editor-*` skills move from `morpheme-website` into the package (idea 2)?
4. Who runs the agent test (idea 13), and how often: per line, or per batch on staging?
