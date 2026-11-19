---
'@morphemecms/cms': patch
---

Rename the alignment classes of the text toolbar to `mo-has-text-align-center` and `mo-has-text-align-right` (`text-align-center`, `text-align-right`): a theme that styled the old classes must use the new ones. Saved pages are not affected: they hold only the `data-align` line, and the site adds the class when it builds.
