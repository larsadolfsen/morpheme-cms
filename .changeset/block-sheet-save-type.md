---
'@morphemecms/cms': patch
---

Sites type-check again: the block side sheet's save button narrows to the fields step before it reads the block's type, so `BlockDialog.tsx` no longer fails `tsc` in a site.
