---
'@morphemecms/cms': patch
---

Tailwind and unprefixed names can no longer come back: `check:tailwind` and `check:mo-names` have no allowlist, and `check:content` (so `check:themes`) runs both on a site's themes and apps. The last unprefixed names are now `mo-js`, `mo-link`, `mo-site-picture__crop` and `mo-staggered-grid__span-*`.
