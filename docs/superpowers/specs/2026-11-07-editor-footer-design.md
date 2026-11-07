# Editor footer: links, copyright and system status

Date: 2026-11-07. Status: agreed with the owner.

## Goal

The editor footer gives site owners help, legal pages and the status of the services that publishing needs.
Today the footer (`src/EditorFooter.tsx`) has one link: Licenses.

## Footer content

One centred, wrapping row of small text buttons (`LinkButton kind="text" size="small"`), then one line of small text.

| Order | Label (en-US) | Danish label | Target | Opens |
|---|---|---|---|---|
| 1 | Support | Support | `https://github.com/larsadolfsen/morpheme-cms/issues` | new tab |
| 2 | System status | Driftsstatus | `#status` | in the editor |
| 3 | Terms of use | Vilkår | none yet | hidden while the URL is `null` |
| 4 | Report security issues | Rapportér sikkerhedsfejl | `https://github.com/larsadolfsen/morpheme-cms/security` | new tab |
| 5 | Privacy policy | Privatlivspolitik | the Morpheme website's `/privacy-policy/` | new tab |
| 6 | Licenses | Licenser | `#licenses` (exists) | in the editor |

Second line: `© 2026 Lars Adolfsen` (the holder in `LICENSE`). It is not translated.

The "System status" button has a status dot after its label (see below).

Not in the footer: Careers, Cookie Preferences, CVR number.

## System status

### Sources

Both providers publish an Atlassian Statuspage feed. The site's Worker reads the feeds, not the editor: the
editor CSP stays strict, and the Worker caches the feeds.

| Provider | Feed | Page for people |
|---|---|---|
| GitHub | `https://www.githubstatus.com/api/v2/summary.json` | `https://www.githubstatus.com/` |
| Cloudflare | `https://www.cloudflarestatus.com/api/v2/summary.json` | `https://www.cloudflarestatus.com/` |

Only the components that a Morpheme site uses count. The overall `status.indicator` of a feed does not count:
Cloudflare often shows "major" for one data centre that has no effect on the site.

| Provider | Component name | Component id | Why |
|---|---|---|---|
| GitHub | Git Operations | `8l4ygp009s5s` | the editor saves through commits |
| GitHub | API Requests | `brv1bkgrwx7q` | the Worker reads and writes files through the API |
| GitHub | Webhooks | `4230lsnqdsld` | a push starts the Cloudflare build |
| Cloudflare | Workers | `57srcl8zcn7c` | the site and the editor run on the Worker |
| Cloudflare | Workers Assets | `pg21w9xb991r` | the site's pages (`ASSETS`) |
| Cloudflare | Workers Builds | `vcpsk0w6g86k` | publish builds the site |
| Cloudflare | Workers KV | `tmh50tx2nprs` | `NOT_FOUND`, `PUSH` |
| Cloudflare | D1 | `z0yd3sxqjqdm` | `CONSENT` |
| Cloudflare | R2 | `hb7g5sq2zz0h` | files and R2 caching |

Ids come from the live feeds on 2026-11-07. Match components by id; ids stay when names change.

### Data model (API payload of `GET /api/status`)

```ts
type ServiceState = 'ok' | 'minor' | 'major' | 'unknown';
type ComponentStatus =
  | 'operational' | 'degraded_performance' | 'under_maintenance'
  | 'partial_outage' | 'major_outage' | 'unknown';

interface ServiceComponent {
  id: string;            // the Statuspage component id, unique per provider
  name: string;          // the provider's name, shown as is (not translated)
  status: ComponentStatus;
  state: ServiceState;
}

interface ServiceProvider {
  id: 'github' | 'cloudflare';
  name: 'GitHub' | 'Cloudflare';
  page: string;          // the provider's status page for people
  state: ServiceState;   // the worst state of its components
  components: ServiceComponent[]; // in the order of the table above
}

interface StatusReport {
  state: ServiceState;   // the worst state of both providers
  providers: ServiceProvider[]; // GitHub first, then Cloudflare
}
```

Rules:

- Component status to state: `operational` → `ok`; `degraded_performance`, `under_maintenance` → `minor`;
  `partial_outage`, `major_outage` → `major`; a status the feed does not give, or any other value → `unknown`.
- A component missing from the feed: `status: 'unknown'`, `state: 'unknown'`.
- A feed that fails (network, not 200, not JSON): all its components `unknown`.
- Worst state, from best to worst: `ok` < `unknown` < `minor` < `major`.

### Dot colours

| State | Colour | Dot label for screen readers (en-US) |
|---|---|---|
| `ok` | green | All systems work |
| `minor` | yellow | Some systems are slow |
| `major` | orange | Some systems are down |
| `unknown` | grey | Can't check the status |

The dot is the theme's small `Badge` with a new optional `tone` prop. The theme owns the colours as tokens.

### Screen `#status`

Title "System status". One `Group` per provider, titled with its name. One `ListItem` per component: the
component name, the status text, and a dot with the component's tone. Under each group, a text link
"Open status page" to the provider's page (new tab). The screen is not in the menu, like Licenses.

Status texts (en-US): operational "Working", degraded_performance "Slow", under_maintenance "Under maintenance",
partial_outage "Partly down", major_outage "Down", unknown "Can't check".

### Worker endpoint

`GET /api/status` returns `StatusReport` as JSON. Only someone who may edit (`mayEdit`) can ask, like `/api/plan`:
the Worker is not an open proxy. Each feed fetch uses `cf: { cacheTtl: 60 }`. No promise stays in module memory
(AGENTS.md, Worker rule).

## Security reports

`SECURITY.md` at the repo root tells people to report through GitHub's private vulnerability reporting.
The owner switches that on in the repository settings. A `security.txt` on the Morpheme website is a separate task
in `morpheme-website`.

## What it reuses

- `LinkButton` (`src/ui.tsx`), `Badge` (`theme/ui/Badge.tsx`), `Screen`, `Group`, `ListItem` (`src/ui.tsx`).
- The route pattern of `Licenses.tsx` (`LICENSES_ROUTE`, case in `App.tsx`).
- The endpoint pattern of `worker/plan-status.js` (`mayEdit`, `json`) and the fetch helper pattern of
  `planStatus()` in `src/r2Caching.ts`.

## Open item

- The public address of the Morpheme website (for the privacy policy link). The owner gives it before task E.
