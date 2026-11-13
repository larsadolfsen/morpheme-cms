# Colour sweep: audit (13 Nov 2026)

Scope: everything that ships (`theme/`, `src/`, `pages/`, `lib/`, `worker/`, `starter/`, `demo/`, `defaults/`, `bin/`), not `scripts/`,
tests, `release-notes/`. Run `node scripts/check-colors.mjs --report` for every line.

**The repo is cleaner than the 857 failing pairs suggest.** Static findings are few; the contrast failures come from computed
colours (section colours, `color-mix` blends of roles, state layers on tinted surfaces), not from fixed values. Static role-pair
check (text role on background role, in one rule or one class string, through the `--block-*` aliases): 0 wrong pairs.
No Tailwind palette class except 3 (picker thumb, Preview frame). No undefined `--mo-*` role (only `--mo-space-4/8` in
`editor.css`, with fallbacks).

| Cause | Count | Where | Should be | Plan |
| --- | --- | --- | --- | --- |
| Black `rgb(0 0 0 / a)` in shadows | 53 | `ui.css`, `global.css`, `base.css`, `blocks.css` (elevation, panel, block shadow) | `color-mix(in srgb, var(--mo-shadow) a%, transparent)` (M3 shadow role) | fix PR 1, no visible change |
| Fallback palette `--block-*` (GitHub colours) | 16 | `blocks.css:61-78` | the roles (`--mo-*`), as `base.css` already does | fix PR 2 (check first whether it can show) |
| Snackbar fallbacks `rgb(255 255 255)`, `rgb(0 0 0 / .8)` | 4 | `ui.css:5470-5482` | `--mo-inverse-on-surface`, `--mo-inverse-surface` | fix PR 3, no visible change (`global.css` sets both) |
| Status badge colours | 7 | `global.css:386-522` | M3 has no success/warning role | allow-list; PM to decide |
| Sign-in page of the AI connection | 5 | `worker/mcp-oauth.js:57` | system colours (`Canvas`, `CanvasText`, `LinkText`) | fix PR 4 |
| Hover 5% / 6% (segmented list, tabs) | 8 | `ui.css:2772-2798, 3720, 3779` | `--mo-hover` (8%) | fix PR 5, hover slightly stronger |
| Video still: white and black over an image | 6 | `blocks.css:2010-2043` | scrim over an image | allow-list |
| Colour picker, swatches, text on a swatch | 22 | `ui.tsx`, `Parts.tsx`, `Testimonial.tsx` (mask) | owner's choice / tool | allow-list |
| Google preview, PageSpeed ratings | 33 | `editor.css` | other products' looks | allow-list (already allowed) |
| Brand mark, example image, scheme seeds, texts | 18 | favicons, `examples.ts`, `colors.ts`, i18n | images / words | allow-list |

Other state layers: `--mo-hover` and `--mo-pressed` are used for the rest; section-colour mixes (`global.css:484-505`,
`blocks.css:152-232`, 14-35% of the on-colour) are tonal derivations for a coloured section, not state layers: left, but they are
the likely source of the computed contrast failures (the contrast worker owns those token groups).

Check: `npm run check:colors` (`scripts/check-colors.mjs`, allow-list `scripts/check-colors.allow.mjs`, entries marked `todo`
go with their fix PR).
