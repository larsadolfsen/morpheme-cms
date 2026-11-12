// A media provider: a source of pictures an installed app adds to the editor's picture picker (`mediaProviders` in app.json,
// contract 5). The app is data only: a request template and a mapping. The Worker makes the request (worker/media-providers.js),
// so an app never runs code that can reach the network, and it reaches only the hosts it lists in `csp`.
// Exposes MEDIA_FIELDS, mediaProviderProblems, hostsOf, requestOf, itemsOf, creditUrl, allowedUrl and mediaItemsFrom.
// Pure and without node: imports, so the Worker, the editor and node --test all use it.

/**
 * @typedef {{ url: string, headers?: Record<string, string> }} MediaRequest
 *   url: https; {query}, {page} and {perPage} are filled in, URL-encoded. headers: {key} is the owner's key.
 * @typedef {{ id: string, label: string, icon: string, key?: boolean, browse?: MediaRequest, search: MediaRequest, results: string,
 *   totalPages?: string, map: Record<string, string>, creditParams?: Record<string, string>, perPage?: number }} MediaProviderDecl
 * @typedef {{ id: string, thumb: string, url: string, width: number, height: number, alt: string,
 *   credit: { name: string, url: string }, downloadTrackingUrl?: string }} MediaItem
 */

/** The names `map` must have (the first eight) and may have (the last). */
export const MEDIA_FIELDS = Object.freeze([
  'id',
  'thumb',
  'url',
  'width',
  'height',
  'alt',
  'creditName',
  'creditUrl',
  'downloadTrackingUrl',
]);
const REQUIRED_FIELDS = MEDIA_FIELDS.slice(0, 8);
const PROVIDER_ID = /^[a-z0-9][a-z0-9-]*$/;
const PATH = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$/;
const PLACEHOLDERS = ['query', 'page', 'perPage', 'key', 'site'];
export const MAX_PER_PAGE = 30;

/** @param {unknown} v @returns {v is Record<string, unknown>} */
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** @param {unknown} v @returns {v is string} */
const isText = (v) => typeof v === 'string' && v.trim() !== '';

/** The host of an https address with no port or user info, or null. @param {unknown} address */
function httpsHost(address) {
  try {
    const u = new URL(String(address).replace(/\{\w+\}/g, 'x'));
    if (u.protocol !== 'https:' || u.port || u.username || u.password) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname.startsWith('[')) return null;
    return u.hostname;
  } catch {
    return null;
  }
}

/** The hosts an app lists in `csp` for `connect-src` and `img-src` (hosts only: no keyword, no scheme). @param {Record<string, string[]> | undefined} csp */
export function hostsOf(csp) {
  const out = new Set();
  for (const directive of ['connect-src', 'img-src'])
    for (const source of csp?.[directive] ?? [])
      if (!source.startsWith("'") && !source.endsWith(':')) out.add(source.replace(/^https:\/\//, '').replace(/\/.*$/, ''));
  return [...out];
}

/** @param {unknown} request @param {string} at @param {string[]} allowed @param {string[]} problems */
function requestProblems(request, at, allowed, problems) {
  if (!isObject(request) || !isText(request.url)) return void problems.push(`${at} must be an object with an https "url".`);
  for (const key of Object.keys(request)) if (!['url', 'headers'].includes(key)) problems.push(`${at} has the unknown key "${key}".`);
  const host = httpsHost(request.url);
  if (!host) problems.push(`${at} "url" must be an https address with a name host, no port and no user info.`);
  else if (!allowed.includes(host)) problems.push(`${at} "url" host ${host} must be in "csp" under "connect-src".`);
  // The host is fixed: a placeholder may not stand before the path starts.
  if (/^https:\/\/[^/]*\{/.test(request.url)) problems.push(`${at} "url" may not have a placeholder in its host.`);
  for (const name of String(request.url).matchAll(/\{(\w+)\}/g))
    if (!PLACEHOLDERS.includes(name[1])) problems.push(`${at} "url" has the unknown placeholder {${name[1]}}.`);
  if ('headers' in request) {
    const headers = request.headers;
    if (!(isObject(headers) && Object.values(headers).every((v) => typeof v === 'string')))
      problems.push(`${at} "headers" must map names to strings.`);
    else
      for (const name of Object.keys(headers))
        if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(name)) problems.push(`${at} has the invalid header name "${name}".`);
  }
}

/**
 * The problems of `mediaProviders` in an app.json (contract 5; the caller checks the contract), each one English sentence.
 * @param {Record<string, unknown>} manifest @returns {string[]}
 */
export function mediaProviderProblems(manifest) {
  const list = manifest.mediaProviders;
  /** @type {string[]} */
  const problems = [];
  if (!(Array.isArray(list) && list.length > 0)) return ['The key "mediaProviders" must be a list with at least one provider.'];
  if (manifest.role !== 'connector') problems.push('Only a connector may declare "mediaProviders": the key "role" must be "connector".');
  const csp = isObject(manifest.csp) ? /** @type {Record<string, string[]>} */ (manifest.csp) : undefined;
  const hosts = hostsOf(csp);
  const seen = new Set();
  list.forEach((p, i) => {
    const at = `The key "mediaProviders" entry ${i + 1}`;
    if (!isObject(p)) return void problems.push(`${at} must be an object.`);
    const known = ['id', 'label', 'icon', 'key', 'browse', 'search', 'results', 'totalPages', 'map', 'creditParams', 'perPage'];
    for (const key of Object.keys(p)) if (!known.includes(key)) problems.push(`${at} has the unknown key "${key}".`);
    if (!(isText(p.id) && PROVIDER_ID.test(p.id))) problems.push(`${at} needs an "id" of lower case letters, digits and hyphens.`);
    else if (seen.has(p.id)) problems.push(`${at} repeats the id "${p.id}".`);
    else seen.add(p.id);
    for (const key of ['label', 'icon']) if (!isText(p[key])) problems.push(`${at} must have a non-empty string "${key}".`);
    if ('key' in p && typeof p.key !== 'boolean') problems.push(`${at} "key" must be true or false.`);
    if (
      'perPage' in p &&
      !(Number.isInteger(p.perPage) && /** @type {number} */ (p.perPage) >= 1 && /** @type {number} */ (p.perPage) <= MAX_PER_PAGE)
    )
      problems.push(`${at} "perPage" must be a whole number from 1 to ${MAX_PER_PAGE}.`);
    requestProblems(p.search, `${at} "search"`, hosts, problems);
    if ('browse' in p) requestProblems(p.browse, `${at} "browse"`, hosts, problems);
    if (typeof p.results !== 'string' || (p.results !== '' && !PATH.test(p.results)))
      problems.push(`${at} "results" must be a path such as "results" ("" when the answer is the list).`);
    if ('totalPages' in p && !(typeof p.totalPages === 'string' && PATH.test(p.totalPages)))
      problems.push(`${at} "totalPages" must be a path.`);
    const map = p.map;
    if (!isObject(map)) problems.push(`${at} "map" must be an object.`);
    else {
      for (const name of REQUIRED_FIELDS)
        if (!(isText(map[name]) && PATH.test(map[name]))) problems.push(`${at} "map" needs a path for "${name}".`);
      for (const [name, path] of Object.entries(map)) {
        if (!MEDIA_FIELDS.includes(name)) problems.push(`${at} "map" has the unknown name "${name}".`);
        else if (!(isText(path) && PATH.test(path))) problems.push(`${at} "map" "${name}" must be a path such as "urls.small".`);
      }
    }
    if ('creditParams' in p && !(isObject(p.creditParams) && Object.values(p.creditParams).every((v) => typeof v === 'string')))
      problems.push(`${at} "creditParams" must map names to strings.`);
    if (
      p.key !== true &&
      isObject(p.search) &&
      isObject(p.search.headers) &&
      Object.values(p.search.headers).some((v) => String(v).includes('{key}'))
    )
      problems.push(`${at} uses {key} in a header, so it needs "key": true.`);
  });
  return problems;
}

const encode = (v) => encodeURIComponent(String(v));
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => (name in values ? values[name] : all));

/**
 * The request for a search: the URL and headers of `search` (or of `browse` when there is no text), filled in.
 * @param {MediaProviderDecl} decl @param {{ query: string, page: number, key?: string, site?: string }} input
 * @returns {{ url: string, headers: Record<string, string> }}
 */
export function requestOf(decl, input) {
  const query = input.query.trim();
  const from = query === '' && decl.browse ? decl.browse : decl.search;
  const perPage = decl.perPage ?? 24;
  const page = Math.max(1, Math.min(1000, Math.floor(input.page) || 1));
  const urlValues = { query: encode(query), page: String(page), perPage: String(perPage), site: encode(input.site ?? '') };
  return {
    url: fill(from.url, urlValues),
    headers: Object.fromEntries(Object.entries(from.headers ?? {}).map(([name, value]) => [name, fill(value, { key: input.key ?? '' })])),
  };
}

/** The value at a path ("user.links.html") in data, or undefined. @param {unknown} data @param {string} path */
export function pathGet(data, path) {
  if (path === '') return data;
  let at = data;
  for (const part of path.split('.')) {
    if (!isObject(at) || !Object.hasOwn(at, part)) return undefined;
    at = at[part];
  }
  return at;
}

/** The credit link with the provider's parameters added (`utm_source`, `utm_medium`): `{site}` is the site's name. @param {string} url @param {Record<string, string> | undefined} params @param {string} site */
export function creditUrl(url, params, site) {
  if (!params) return url;
  try {
    const u = new URL(url);
    for (const [name, value] of Object.entries(params)) u.searchParams.set(name, fill(value, { site }));
    return u.href;
  } catch {
    return url;
  }
}

/** A link shown as text to click (the credit): https, no user info; it may be on any host, since the editor only links to it. @param {unknown} address */
function httpsLink(address) {
  try {
    const u = new URL(String(address));
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}

/** An address from a provider that is https, on one of the hosts the app listed, without a port or user info. @param {unknown} address @param {string[]} hosts */
export function allowedUrl(address, hosts) {
  if (typeof address !== 'string') return null;
  try {
    const u = new URL(address);
    if (u.protocol !== 'https:' || u.port || u.username || u.password || !hosts.includes(u.hostname)) return null;
    return u.href;
  } catch {
    return null;
  }
}

/**
 * The pictures of a provider's answer, as the editor takes them. An entry that is missing a part, or whose addresses are not
 * on the listed hosts, is left out, so a wrong answer shows fewer pictures and never a wrong link.
 * @param {MediaProviderDecl} decl @param {unknown} data @param {string[]} hosts @param {string} site
 * @returns {{ items: MediaItem[], totalPages: number | null }}
 */
export function mediaItemsFrom(decl, data, hosts, site) {
  const rows = pathGet(data, decl.results);
  const total = decl.totalPages ? Number(pathGet(data, decl.totalPages)) : NaN;
  /** @type {MediaItem[]} */
  const items = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const get = (name) => (decl.map[name] ? pathGet(row, decl.map[name]) : undefined);
    const thumb = allowedUrl(get('thumb'), hosts);
    const url = allowedUrl(get('url'), hosts);
    const name = get('creditName');
    const credit = httpsLink(get('creditUrl'));
    const width = Number(get('width'));
    const height = Number(get('height'));
    const id = get('id');
    if (!thumb || !url || !isText(name) || !credit || !(width > 0) || !(height > 0) || !isText(String(id ?? ''))) continue;
    const tracking = allowedUrl(get('downloadTrackingUrl'), hosts);
    items.push({
      id: String(id),
      thumb,
      url,
      width: Math.round(width),
      height: Math.round(height),
      alt: String(get('alt') ?? '').slice(0, 300),
      credit: { name: String(name).slice(0, 200), url: creditUrl(credit, decl.creditParams, site) },
      ...(tracking ? { downloadTrackingUrl: tracking } : {}),
    });
  }
  return { items, totalPages: Number.isFinite(total) && total > 0 ? Math.floor(total) : null };
}
