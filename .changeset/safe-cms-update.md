---
'@morphemecms/cms': patch
---

A CMS update is tried on a branch first and only a version that builds reaches `main`, so a bad update never stops a site's saves; a failed version is tried again 24 hours later, an undo goes back to the version that runs, and a save shows its progress until the website is live.
