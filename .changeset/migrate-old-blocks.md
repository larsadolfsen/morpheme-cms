---
'@morphemecms/cms': patch
---

Adds `morpheme migrate`, which writes pages that still use blocks from before 0.17 (Points with icon, Links, Checklist, Expandable list, Banner) in the form the editor saves, and lets `check:editor` pass on such pages with a note to run it.
