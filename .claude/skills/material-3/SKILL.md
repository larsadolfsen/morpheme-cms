---
name: material-3
description: Use before writing a spec or making a change that touches the site, the theme Material or any screen outside the editor's own workspace, or that may deviate from Material Design 3 - "M3", "MD3", "Material", "m3.material.io", "component", "token", "deviation". Says how to read and quote the real M3 pages and how to record a deviation.
---

# Following Material 3

Announce "Using material-3". Owner, 13 Nov 2026: "We follow MD3 everywhere except the editor. You need to look up every
page and check it. I don't want to tell you more times to follow MD3."

1. Outside the editor's own workspace (its toolbar/bar, overflow menu, text and block menus) every design choice follows
   what m3.material.io prints.
2. Before a spec or a change, read the real pages of every component involved. They are script-rendered: use Playwright,
   which is pre-installed; expand collapsed token tables; read the specs, guidelines and accessibility pages. Quote them
   in the spec or the pull request. Never write from memory. If a page can't be read, say so plainly instead of guessing.
3. Never invent a part, mark, size or behaviour M3 does not print. Where M3 is silent, say so and use the nearest M3
   pattern.
4. A deviation is allowed only in the editor workspace or when the owner says so in words. Record it in
   `docs/material-deviations.md` in the same pull request as the change: what Material says (quoted), what we do instead,
   why, the date and the pull request. A deviation that is not listed there is a bug.

Wording follows M3's word choice (`CLAUDE.md`, *Word choice*). A theme's own look is the skill `site-editor-theme`.
