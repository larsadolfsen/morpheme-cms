// The status of the services a Morpheme site needs (GitHub, Cloudflare), from their Statuspage feeds.
// Exposes PROVIDERS, stateOf, worst, providerFrom and reportFrom. No imports: the Worker and the editor use it.

/**
 * @typedef {'ok' | 'minor' | 'major' | 'unknown'} ServiceState
 * @typedef {'operational' | 'degraded_performance' | 'under_maintenance' | 'partial_outage' | 'major_outage' | 'unknown'} ComponentStatus
 * @typedef {{ id: string, name: string, status: ComponentStatus, state: ServiceState }} ServiceComponent
 * @typedef {{ id: 'github' | 'cloudflare', name: 'GitHub' | 'Cloudflare', page: string, state: ServiceState, components: ServiceComponent[] }} ServiceProvider
 * @typedef {{ state: ServiceState, providers: ServiceProvider[] }} StatusReport
 */

export const PROVIDERS = [
  {
    id: 'github',
    name: 'GitHub',
    feed: 'https://www.githubstatus.com/api/v2/summary.json',
    page: 'https://www.githubstatus.com/',
    components: [
      { id: '8l4ygp009s5s', name: 'Git Operations' },
      { id: 'brv1bkgrwx7q', name: 'API Requests' },
      { id: '4230lsnqdsld', name: 'Webhooks' },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    feed: 'https://www.cloudflarestatus.com/api/v2/summary.json',
    page: 'https://www.cloudflarestatus.com/',
    components: [
      { id: '57srcl8zcn7c', name: 'Workers' },
      { id: 'pg21w9xb991r', name: 'Workers Assets' },
      { id: 'vcpsk0w6g86k', name: 'Workers Builds' },
      { id: 'tmh50tx2nprs', name: 'Workers KV' },
      { id: 'z0yd3sxqjqdm', name: 'D1' },
      { id: 'hb7g5sq2zz0h', name: 'R2' },
    ],
  },
];

const KNOWN_STATUSES = new Set(['operational', 'degraded_performance', 'under_maintenance', 'partial_outage', 'major_outage']);

const SEVERITY_ORDER = ['ok', 'unknown', 'minor', 'major'];

/**
 * @param {string} status
 * @returns {ServiceState}
 */
export function stateOf(status) {
  switch (status) {
    case 'operational':
      return 'ok';
    case 'degraded_performance':
    case 'under_maintenance':
      return 'minor';
    case 'partial_outage':
    case 'major_outage':
      return 'major';
    default:
      return 'unknown';
  }
}

/**
 * @param {ServiceState[]} states
 * @returns {ServiceState}
 */
export function worst(states) {
  if (states.length === 0) return 'ok';
  let worstState = 'ok';
  for (const s of states) {
    if (SEVERITY_ORDER.indexOf(s) > SEVERITY_ORDER.indexOf(worstState)) {
      worstState = s;
    }
  }
  return worstState;
}

/**
 * @param {object} provider
 * @param {object|null} summary
 * @returns {ServiceProvider}
 */
export function providerFrom(provider, summary) {
  const componentsMap = new Map();
  if (summary && Array.isArray(summary.components)) {
    for (const c of summary.components) {
      componentsMap.set(c.id, c);
    }
  }

  const components = provider.components.map((c) => {
    const feedComponent = componentsMap.get(c.id);
    const rawStatus = feedComponent ? feedComponent.status : null;
    const status = rawStatus && KNOWN_STATUSES.has(rawStatus) ? /** @type {ComponentStatus} */ (rawStatus) : 'unknown';
    return {
      id: c.id,
      name: c.name,
      status,
      state: stateOf(status),
    };
  });

  return {
    id: provider.id,
    name: provider.name,
    page: provider.page,
    state: worst(components.map((c) => c.state)),
    components,
  };
}

/**
 * @param {{ github: object|null, cloudflare: object|null }} summaries
 * @returns {StatusReport}
 */
export function reportFrom(summaries) {
  const providers = PROVIDERS.map((p) => {
    const key = p.id;
    const summary = summaries[key] || null;
    return providerFrom(p, summary);
  });

  return {
    state: worst(providers.map((p) => p.state)),
    providers,
  };
}
