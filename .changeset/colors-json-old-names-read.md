---
'@morphemecms/cms': patch
---

A site's `colors.json` in the names from before Material 3's roles (`bg`, `ink`, `accent` …) is read as the new roles, on the editor's Colors screen, in the build and in the content check, and the editor writes the new names on the next save. A theme or custom CSS still has to use the new variable names.
