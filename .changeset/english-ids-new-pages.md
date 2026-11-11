---
'@morphemecms/cms': minor
---

Rename the new versions of pages from /ny/ to /new/ (route `/new/`, folder `src/content/pages/new/`); the Worker sends the old address on with a 301, query string and #part kept, a page file still under `ny/` is read at its new address with a warning from `check:content`, and scripts/retarget-links.mjs rewrites a site's own links to it
