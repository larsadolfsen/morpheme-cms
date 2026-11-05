---
'@morphemecms/cms': patch
---

Sites type-check again: `searchedAs` and `pageTitle` take `front` as optional (default `false`), so the SEO form and the share preview no longer fail `tsc` in a site.
