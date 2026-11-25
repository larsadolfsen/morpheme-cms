---
'@morphemecms/cms': patch
---

`check:content` refuses an app written to the scoped contract (api 8) that uses a `mo-` class the CMS does not have, and names the class and the file (`npm run check:app-classes`).
