---
'@morphemecms/cms': minor
---

Builds on Windows: the theme's helpers `ui/dialog.ts`, `ui/bottomSheet.ts` and `ui/sideSheet.ts` are now `ui/dialogControl.ts`, `ui/bottomSheetControl.ts` and `ui/sideSheetControl.ts` (app API 2, theme API 3), the editor's screen data modules are `*Data.ts`, `worker/apps.js` with CRLF line endings passes the content check, and the check stops two files whose names differ only by case.
