---
'@morphemecms/cms': patch
---

Sites type-check again: the types of `searchedAs` and `pageTitle` make every input optional except `site`, so the share preview no longer fails `tsc` in a site.
