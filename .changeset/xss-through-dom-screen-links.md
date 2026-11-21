---
"@morphemecms/cms": patch
---

The editor's back arrow and breadcrumb links percent-encode `"`, `<` and `>` in their address, so code scanning finds no way for a picked file's name to reach the link as HTML.
