---
'@morphemecms/cms': patch
---

Contract 8: `THEME_API` and `APP_API` are 8 and `APP_APIS` is `[8]`; an app or theme imports only from the public list (`lib/public-imports.mjs`, `check:imports`), and `check:m3-names` fails on an unknown or old name.
