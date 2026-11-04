---
'@morphemecms/cms': minor
---

A site can show one block in a column beside the text of its pages: a block says it can with `beside: true` in its `load.ts`, the owner picks it under Appearance › Side column (`src/data/side.json`), and a page can turn it off (`side: false`); each block now gives its own front-page lead in a `lead.ts`; `defineSite` takes `logo` for the structured data; and the icon packs have calendar-x, identification-card, money, receipt and wallet.
