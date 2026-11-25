// The names an app's Worker reads from `env` that the site's wrangler.jsonc does not declare, for the update's build to name
// (scripts/build-install.mjs): it names them and adds none (a binding is the owner's: an id, a bucket). Exposes envNames,
// declaredNames and missingNames. No dependencies, no I/O.

/** The upper-case names read as `env.NAME` in a Worker's code. @param {string} code @returns {string[]} */
export const envNames = (code) => [...new Set([...String(code).matchAll(/\benv\.([A-Z][A-Z0-9_]{2,})\b/g)].map((m) => m[1]))];

/** The binding and variable names wrangler.jsonc declares (`"binding": "X"`, the keys of `vars`). @param {string} wrangler @returns {string[]} */
export function declaredNames(wrangler) {
  const text = String(wrangler);
  const bindings = [...text.matchAll(/"(?:binding|name)"\s*:\s*"([A-Za-z0-9_]+)"/g)].map((m) => m[1]);
  const vars = text.match(/"vars"\s*:\s*\{([^}]*)\}/)?.[1] ?? '';
  return [...new Set([...bindings, ...[...vars.matchAll(/"([A-Za-z0-9_]+)"\s*:/g)].map((m) => m[1])])];
}

/** The names the apps' Workers read that wrangler.jsonc lacks, by app id.
 * @param {{ id: string, code: string }[]} apps @param {string} wrangler @returns {{ id: string, names: string[] }[]} */
export function missingNames(apps, wrangler) {
  const declared = new Set(declaredNames(wrangler));
  return apps.map(({ id, code }) => ({ id, names: envNames(code).filter((n) => !declared.has(n)) })).filter((x) => x.names.length);
}
