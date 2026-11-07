# Plan: editor footer with system status

Spec: `docs/superpowers/specs/2026-11-07-editor-footer-design.md`. Session branch: `feat/editor-footer`.

## Goal

The editor footer shows Support, System status with a status dot, Terms of use, security, privacy and Licenses.
A copyright line follows the links. A new screen `#status` shows the GitHub and Cloudflare components.

## Architecture

Pure logic is in `lib/serviceStatus.mjs`. The Worker and the editor both use it.
The Worker reads the two Statuspage feeds. The editor reads `/api/status` from the Worker.
The dot is the theme's `Badge` with a new `tone` prop.

## Files

| Path | Task | What |
|---|---|---|
| `lib/serviceStatus.mjs` | A | pure functions: status to state, worst state, feed to provider |
| `lib/serviceStatus.test.mjs` | A | unit tests |
| `src/i18n/en-US/footer.ts`, `src/i18n/da-DK/footer.ts` | B | texts |
| `src/i18n/en-US/index.ts`, `src/i18n/da-DK/index.ts` | B | register `footer` |
| `theme/ui/Badge.tsx`, `theme/styles/ui.css`, `theme/styles/global.css` | C | `tone` prop and tokens |
| `worker/service-status.js`, `worker/index.js` | D | `GET /api/status` |
| `lib/footerLinks.mjs`, `lib/footerLinks.test.mjs` | E | the footer's links as data |
| `src/serviceStatus.ts` | E | `serviceStatus()` fetch helper |
| `src/ServiceStatus.tsx` | E | screen `#status` |
| `src/EditorFooter.tsx`, `src/App.tsx` | E | footer and route |
| `SECURITY.md`, `.changeset/*.md`, `docs/editor.md` | F | docs |

## Order

A, B and C have no dependencies. D needs A. E needs A, B, C and D. F has no dependencies.

## Task A: `lib/serviceStatus.mjs` (worker: Ollama runner)

Interface (JavaScript module, no imports, JSDoc types as in the spec):

```js
export const PROVIDERS; // [{ id: 'github', name: 'GitHub', feed, page, components: [{ id, name }] }, { id: 'cloudflare', ... }]
export function stateOf(status) // ComponentStatus string -> ServiceState
export function worst(states)   // ServiceState[] -> ServiceState; [] -> 'ok'
export function providerFrom(provider, summary) // one PROVIDERS entry + parsed summary.json or null -> ServiceProvider
export function reportFrom(summaries) // { github: summary|null, cloudflare: summary|null } -> StatusReport
```

Steps:

1. Create `lib/serviceStatus.mjs` with a 2–3 line header comment.
2. Put the ids, names, feeds and pages from the spec tables into `PROVIDERS`.
3. Implement the four functions by the rules in the spec.
4. Create `lib/serviceStatus.test.mjs` with `node:test` and `node:assert/strict`.

Test cases:

| Input | Expected |
|---|---|
| `stateOf('operational')` | `'ok'` |
| `stateOf('degraded_performance')`, `stateOf('under_maintenance')` | `'minor'` |
| `stateOf('partial_outage')`, `stateOf('major_outage')` | `'major'` |
| `stateOf('foo')`, `stateOf(undefined)` | `'unknown'` |
| `worst([])` | `'ok'` |
| `worst(['ok', 'unknown'])` | `'unknown'` |
| `worst(['unknown', 'minor'])` | `'minor'` |
| `worst(['minor', 'major', 'ok'])` | `'major'` |
| `providerFrom(github, null)` | 3 components, all `status: 'unknown'`, provider `state: 'unknown'` |
| `providerFrom(github, { components: [{ id: '8l4ygp009s5s', status: 'major_outage' }] })` | Git Operations `major`; the 2 others `unknown`; provider `major` |
| `providerFrom(cloudflare, summary)` with all 6 ids `operational` plus one other id `major_outage` | provider `ok` (other ids do not count) |
| `reportFrom({ github: null, cloudflare: null })` | `state: 'unknown'`, providers in order `github`, `cloudflare` |

Acceptance check: `node --test lib/serviceStatus.test.mjs` passes.

## Task B: texts (worker: Ollama runner)

Steps:

1. Read `src/i18n/en-US/licenses.ts` and `src/i18n/en-US/index.ts` for the pattern.
2. Create `src/i18n/en-US/footer.ts` that exports `footer` with the keys below.
3. Create `src/i18n/da-DK/footer.ts` with the same keys and the Danish strings.
4. Register `footer` in both `index.ts` files as the other namespaces are registered.

| Key | en-US | da-DK |
|---|---|---|
| `support` | Support | Support |
| `status` | System status | Driftsstatus |
| `terms` | Terms of use | Vilkår |
| `security` | Report security issues | Rapportér sikkerhedsfejl |
| `privacy` | Privacy policy | Privatlivspolitik |
| `openStatusPage` | Open status page | Åbn statusside |
| `state.ok` | All systems work | Alle systemer virker |
| `state.minor` | Some systems are slow | Nogle systemer er langsomme |
| `state.major` | Some systems are down | Nogle systemer er nede |
| `state.unknown` | Can't check the status | Kan ikke tjekke status |
| `component.operational` | Working | Virker |
| `component.degraded_performance` | Slow | Langsom |
| `component.under_maintenance` | Under maintenance | Vedligeholdes |
| `component.partial_outage` | Partly down | Delvist nede |
| `component.major_outage` | Down | Nede |
| `component.unknown` | Can't check | Kan ikke tjekkes |

Acceptance check: `npm run check:language` and `npx tsc -p tsconfig.types.json --noEmit` pass.

## Task C: `Badge` tone (worker: Sonnet agent; theme rules)

Steps:

1. Add the optional prop `tone?: 'ok' | 'minor' | 'major' | 'unknown'` to `theme/ui/Badge.tsx`.
2. Write the tone as `data-tone` on the badge element. No tone keeps the M3 error colour.
3. Add the tokens `--badge-ok`, `--badge-minor`, `--badge-major`, `--badge-unknown` in `theme/styles/global.css`.
4. Use green `#1e8e3e`, yellow `#f9ab00`, orange `#e8710a`, grey `var(--md-sys-color-outline)` as defaults.
5. Make sure each colour has 3:1 contrast on the surface in light and dark mode. Change a value if not.
6. Add the `[data-tone]` rules to `.badge` in `theme/styles/ui.css`.
7. Show the four tones on `#appearance/parts/ui`.
8. Update the header comment of `Badge.tsx`.

Acceptance check: `npm run check` passes. `npm run check:screens` passes. `check:themes` passes on the demo.

## Task D: `GET /api/status` (worker: Sonnet agent; Worker rules)

Steps:

1. Create `worker/service-status.js` after the pattern of `worker/plan-status.js`.
2. Export `handleStatus(request, env)`: `mayEdit` else 403; `GET` only else 405.
3. Fetch both feeds in parallel with `cf: { cacheTtl: 60 }`. A failed feed gives `null`.
4. Return `json(reportFrom({ github, cloudflare }))`.
5. Add the route `/api/status` in `worker/index.js` next to `/api/plan`. Update its header list.
6. Add the file to `scripts/check-worker.mjs` if that script lists the Worker files.

Acceptance check: `node --test scripts/pending-shared.test.mjs` passes. `npm run check` passes.

## Task E: footer and screen (worker: Sonnet agent; editor rules)

Steps:

1. Create `lib/footerLinks.mjs`: `FOOTER_LINKS` (spec table order), `COPYRIGHT = '© 2026 Lars Adolfsen'`, and `visibleLinks(links)` that drops links with `href: null`.
2. Create `lib/footerLinks.test.mjs`.
3. Create `src/serviceStatus.ts`: `serviceStatus(): Promise<StatusReport | null>` after the pattern of `planStatus()`.
4. Create `src/ServiceStatus.tsx`: `STATUS_ROUTE = 'status'` and the screen from the spec.
5. Add the route in `src/App.tsx` next to `LICENSES_ROUTE`. Update the route list in its header.
6. Rewrite `src/EditorFooter.tsx` as composition: the links, the dot on System status, the copyright line.
7. External links open in a new tab with `rel="noopener noreferrer"`.
8. The dot shows `unknown` while the report loads and when it fails.
9. Make sure the menu tests still say the status screen is not in the menu.

Test cases for `lib/footerLinks.test.mjs`:

| Input | Expected |
|---|---|
| `visibleLinks(FOOTER_LINKS)` while terms is `null` | 5 links, no `terms` |
| `visibleLinks` with a terms URL | 6 links, `terms` third |
| each external `href` | starts with `https://` |
| `COPYRIGHT` | `'© 2026 Lars Adolfsen'` |

Acceptance check: `npm run check` and `npm run check:screens` pass. Screenshot the footer and `#status` on a phone and a computer.

## Task F: docs (worker: main session, markdown only)

1. Create `SECURITY.md`: report through GitHub private vulnerability reporting; do not open a public issue.
2. Add a changeset (minor): "The editor footer has support, status, legal links and a copyright line."
3. Describe `#status` and `/api/status` in `docs/editor.md` if it lists screens and endpoints.

## Hand checks

- The owner switches on private vulnerability reporting: `morpheme-cms` → Settings → Security.
- Open `https://getmorpheme.com/privacy-policy/` and make sure the page exists.
