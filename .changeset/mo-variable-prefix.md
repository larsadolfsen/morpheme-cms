---
'@morphemecms/cms': minor
---

The theme's shared CSS variables now start with `--mo-`: the color roles (`--mo-primary`, `--mo-on-surface`, …), the corner steps and state layers (`--md-shape-medium` is `--mo-shape-medium`), and each elevation level has a color and a shadow (`--mo-elevation-2-color`, `--mo-elevation-2-shadow`, replacing `--elevation-2-surface` and `--elevation-2`). A theme or custom CSS that sets or reads the old names must use the new ones; `colors.json` keeps its keys.
