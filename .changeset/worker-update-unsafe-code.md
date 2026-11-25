---
'@morphemecms/cms': patch
---

The editor's update to 0.19.6 now stops on the same unsafe code in a site's own themes and apps as `morpheme migrate`, including Tailwind-style class strings, so a site is never left half renamed.
