---
'@morphemecms/cms': patch
---

Sites type-check the video block: the types of `player` and `facadeOf` make `frame` optional, as the block calls them.
