---
name: developer
description: Use first in every session that builds, fixes or documents something in morpheme-cms - "developer", "build session", "fix", "docs session", "pull request", "before you start". The entry point for every developer session: which rules and skills to read, what a pull request owes the PM, and the owner's standing design rules.
---

# Developer session

Announce "Using developer". Every session that builds, fixes or documents something in this repository starts here,
before it reads the task further. This skill only says what to read and what to do; each rule lives in one place, and
this skill points to it. Never work from memory of a skill: load it.

## 1. Read `CLAUDE.md`

All of it, before the first edit.

## 2. Load the skills the task needs

| Skill | Load it when |
| :--- | :--- |
| `material-3` | **Any design work, or any change a person sees** (the site, the theme, an editor screen). Owner rule: read the real m3.material.io pages with Playwright, never from memory, WebFetch or curl, for every component you build or edit. Say in the pull request which pages you read (the URLs) and that you loaded the skill. |
| `site-editor-writing` | a text of the editor changes (labels, buttons, hints, messages) |
| `release-notes` | a site owner sees the change |
| `changesets` | before you open the pull request |
| `checks` | before a push, or when a CI job fails |

## 3. The pull request

Every pull request, whatever the change:

- It has its changeset (`changesets`) and its `check` job is green on the current head.
- You report the link and the head sha to the PM and leave the merge to it. Never merge your own pull request, and never
  ask the owner to merge it (`CLAUDE.md`, *Pull requests go to the PM*).
- A change the owner can see (the editor or the site) gets before and after screenshots of every changed screen in a
  comment on your own pull request: the `pm` skill, *Screenshots in the pull request* says how. A change nobody sees
  needs none.
- When `origin/<base>` moves, merge it into your branch (never a rebase, amend or force-push on a branch that is
  shared).
- You never release (`CLAUDE.md`, *Only the owner releases a new version*).

## 4. The owner's standing design rules

Short forms, for a developer to know before reading the specs. A rule changes only where it lives.

- **Dialog.** In a basic dialog no control has the focus when it opens; the main choice is a filled button and the other
  choices are outlined; the confirming button is the one closest to the edge (`src/ask.tsx` is the editor's one pattern;
  the owner's dialog rule is quoted in `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md`, 3.4).
- **Save on a phone.** Every `Save` goes in the bottom bar, and that bar is the standard bottom sheet, with no custom
  design (`docs/material-deviations.md`, *Editor-only bars*, item 3, and *A block's sheet on a phone*, B1).
- **Pages on a phone.** Below 600 dp no view is a full-screen dialog or a side sheet: each is a page with a back arrow in
  the top app bar, and Back with unsaved changes asks "Keep your changes?" (`docs/material-deviations.md`, B2). The
  computer keeps the side sheet.
- **Standard names.** Use the standard name of a field or a feature (Material 3's, the web's, the real product's),
  never a new one (`docs/superpowers/specs/2026-11-14-standard-names-audit.md`).
- **Icons are Material Symbols**, drawn by name through the shared `Icon` (`CLAUDE.md`, *Icons are Material Symbols*).
- **A deviation from Material 3** is allowed only in the editor's own workspace or when the owner says so in words, and is
  recorded in `docs/material-deviations.md` in the same pull request (`material-3`).
