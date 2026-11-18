---
'@morphemecms/cms': patch
---

A new site starts with an `.npmrc` that makes the install on the build faster (`prefer-offline`, no audit, no fund), and the CMS update adds the same lines to an existing site's `.npmrc`, keeping its own lines.
