---
'@morphemecms/cms': patch
---

An app block that draws its own inline rows in the editor writes `mo-editor-inline-list`, `mo-editor-inline-list-row`, `mo-editor-inline-list-row-active` and `mo-editor-inline-list-row-next` instead of the same names without `mo-editor-`; the editor's own classes now start with `mo-editor-` or `mo-site-` (map: docs/superpowers/plans/mo-names/map.json).
