---
'@morphemecms/cms': patch
---

Rename the theme's UI component classes, hooks and runtime values to `mo-` names (`.card-body` to `.mo-card__body`, `.button-filled` to `.mo-button.mo-is-filled`, `--card-selected-surface` to `--mo-comp-card-selected-surface`, `--slider-start` to `--mo-comp-slider-start`, `.image-grid` to `.mo-staggered-grid`): a theme or app that styled the old names must use the new ones (`docs/superpowers/plans/mo-names/map.json`, `docs/class-names.md`, *Settled in M3*).
