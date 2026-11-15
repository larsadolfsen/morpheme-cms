---
'@morphemecms/cms': minor
---

The theme's Dialog has no full-screen kind any more: a full screen is a page with a back arrow. `THEME_API` is 5. A theme or an app that draws `<Dialog kind="full-screen">`, imports `dialogFullScreenModalClass`, or styles `dialog-full-screen` must move to a page or a basic dialog. The lightbox looks as before.
