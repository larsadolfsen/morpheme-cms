---
'@morphemecms/cms': minor
---

A page chooses a template from the ones its theme offers (`template` in the front matter, "templates" in theme.json: single, full, sidebar-left, sidebar-right). The page flags `wide` and `side` are gone. A site must migrate its `wide: true` pages (for example to `template: single`) and may remove `side: false`.
