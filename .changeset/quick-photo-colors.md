---
'@morphemecms/cms': minor
---

A page-colors hook gets a new helper, `contentColors(picture, choice)`: the site's build makes the colors from one of the page's pictures (Material's content-based color), so an app's hook no longer runs the color engine in its sandbox, where a photograph took longer than the hook's 1000 ms. A sandboxed hook's `pixels` helper now reads only the page's own pictures.
