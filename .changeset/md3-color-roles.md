---
'@morphemecms/cms': minor
---

The site's colors are now exactly Material 3's color roles, each named as Material names it (`primary`, `on-surface`, `surface-container-high`, plus the fixed roles, `scrim` and `shadow`), and the editor's page is on Surface like the site. A site's `colors.json` in the old names is read as the new roles and written in the new names on the next save in the editor; a theme or custom CSS must use the new names (`--bg`, `--surface` as the cards, `--tint`, `--ink`, `--muted`, `--line`, `--accent*` and `--accent-hover` are gone).
