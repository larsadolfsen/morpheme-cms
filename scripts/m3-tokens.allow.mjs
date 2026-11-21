// What `npm run check:m3-tokens` lets differ from Material 3, and why: the baseline found on 21 Nov 2026 (batch 1 of plans/2026-11-20-0-19-5-material-3-tokens.md).
// Each entry is a token of the theme, the value it has and the value Material 3 has (so a change to either fails the check until the entry is fixed), and one of
// these classes: `deviation` (a recorded deviation, docs/material-deviations.md), `editor` (the editor's own workspace, outside Material 3), `wcag` (a WCAG
// 2.2 AA criterion, which wins over Material 3) or `fix` (to fix in the batch named by `batch`; the batch removes the entry). At release only `editor` and `wcag`
// are left. A new entry is reviewed; it is never added to hide a difference without a reason.
export const allow = [];
