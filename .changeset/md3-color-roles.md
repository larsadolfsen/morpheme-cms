---
'@morphemecms/cms': major
---

The site's colors are now exactly Material 3's color roles, each named as Material names it (`primary`, `on-surface`, `surface-container-high`, plus the fixed roles, `scrim` and `shadow`), and the editor's page is on Surface like the site. Old `colors.json` files are renamed automatically; a theme or custom CSS that reads `--bg`, `--surface` (the cards), `--tint`, `--ink`, `--muted`, `--line`, `--accent*` or `--accent-hover` must use the new names.
