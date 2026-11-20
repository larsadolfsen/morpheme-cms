// What a site or an app may add to the pages' Content Security Policy (csp.mjs), by kind (an app's csp.json, the
// site's own addresses), and the checks of it. No dependencies, so the site's Worker can use it too (the app
// "Cookiescanner" allows an address the policy stopped).

/** @typedef {{ script?: string[], style?: string[], img?: string[], connect?: string[], frame?: string[], form?: string[] }} Sources */

/** The kinds of sources a site or an app can add (a Sources' keys, csp.json's). */
export const KINDS = ['script', 'style', 'img', 'connect', 'frame', 'form'];

// A source as a site or an app gives it: an address (origin) on https, with `*.` for all under a domain. Nothing that
// lets everything through (`*`, `https:`, 'unsafe-inline', 'unsafe-eval').
const SOURCE = /^https:\/\/(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/;

/** Whether a source is one a site or an app may give (see SOURCE). @param {unknown} source */
export const isSource = (source) => typeof source === 'string' && SOURCE.test(source);

/** The kind of sources a directive of the policy takes, as a browser names it when it stops something
 * (securitypolicyviolation's violatedDirective: img-src, script-src-elem …); undefined for one a site or an app cannot
 * add to (font-src, media-src …). @param {string} directive */
export function kindOf(directive) {
  if (directive === 'form-action') return 'form';
  if (directive === 'child-src') return 'frame';
  const kind = /^(script|style|img|connect|frame)-src(-elem|-attr)?$/.exec(directive)?.[1];
  return kind;
}

/** What is wrong with sources written in a file (an app's csp.json), each as a sentence; none when they are right.
 * @param {unknown} sources @param {string} file */
export function sourcesProblems(sources, file) {
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) return [`${file}: must be an object with ${KINDS.join(', ')}.`];
  return Object.entries(sources).flatMap(([kind, values]) =>
    !KINDS.includes(kind)
      ? [`${file}: "${kind}" er ikke en af ${KINDS.join(', ')}.`]
      : !Array.isArray(values)
        ? [`${file}: "${kind}" must be a list of addresses.`]
        : values
            .filter((v) => !isSource(v))
            .map(
              (v) =>
                `${file}: ${JSON.stringify(v)} under "${kind}" er ikke en adresse som https://eksempel.dk eller https://*.eksempel.dk.`,
            ),
  );
}

/** Whether the sources allow an address (its origin, or one under a `*.` domain), as any kind or as `kind`.
 * @param {Sources} sources @param {string} url @param {string} [kind] */
export function allows(sources, url, kind) {
  const { origin, host } = new URL(url);
  return (kind ? (sources[kind] ?? []) : Object.values(sources).flat()).some(
    (s) => s === origin || (s.startsWith('https://*.') && host.endsWith(s.slice('https://*'.length))),
  );
}

/** The sources together. @param {Sources[]} all @returns {Required<Sources>} */
export function joined(...all) {
  /** @type {Required<Sources>} */
  const sum = Object.fromEntries(KINDS.map((kind) => [kind, []]));
  for (const sources of all) for (const kind of KINDS) sum[kind].push(...(sources[kind] ?? []));
  return sum;
}
