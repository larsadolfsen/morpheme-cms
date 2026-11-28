---
'@morphemecms/cms': patch
---

A video in a carousel fills its item with no empty space below it, and in the multi-aspect ratio layout each video is as wide as its own video is, so landscape and portrait videos and images can share one row. Each item's width follows its own image or video, clamped to 9:16..16:9, and the whole image always shows (never cut).
