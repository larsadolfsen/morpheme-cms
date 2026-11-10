---
'@morphemecms/cms': minor
---

Move a tag's page on the blog to /blog/tags/<tag>/; the Worker sends the old address on with a 301, query string kept, and scripts/retarget-links.mjs rewrites a site's own links to it
