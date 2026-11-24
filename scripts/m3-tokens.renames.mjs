// The theme tokens whose name is not the dotted-to-dashed form of an M3 token's, and the M3 token(s) each one stands for, so `npm run check:m3-tokens` compares
// them (batch A of plans/2026-11-21-0-19-5-measured-m3-check.md). The names of the theme follow M3's in 0.20.0 (specs/2026-11-20-material-3-names-design.md), and
// this list is empty since batch 2 of 0.19.6 (names-2-tokens): every token has M3's name. It stays as the place for a token that cannot (an array of the map that M3 holds as two tokens is declared twice instead). Where the theme's one token holds both sides of M3's two (`padding` = `leading-space` + `trailing-space`), it lists both.
// Our sizes by M3's heights (that spec, 3): our *medium* button (40 dp) is M3 Expressive's *small*, our *small* (40 dp) the same, our *xsmall* (32 dp) M3's *xsmall*.
// A target must be an M3 token of docs/m3-tokens/ (a test fails on one that is not); a token whose M3 value is a composite or a state mix is not listed here.
export const RENAMES = {};
