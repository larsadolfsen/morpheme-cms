// What a site's editor writes when it installs or updates a package from the store (the editor, @interstellarcms/cms),
// without npm: the package in package.json and its entry in package-lock.json, as `npm install` would write them, from
// the version's manifest in the store's registry. It can, because a package in the store has no dependencies of its
// own and no install scripts (src/registry.js), so its entry is all there is to change; npm ci checks its integrity.
// When it cannot (the package wants peers the site does not have in those versions), it says so with NeedsNpm, and
// the update is done with `npm install` instead. This moves into the editor (docs/platform.md in the site's repo).
import { satisfies, Unsupported } from './range.js';

export class NeedsNpm extends Error {}

const OWN_DEPENDENCIES = ['dependencies', 'optionalDependencies', 'bundleDependencies', 'bundledDependencies'];
const INSTALL_SCRIPTS = ['preinstall', 'install', 'postinstall'];

/** The object with key set to value, the keys sorted as npm sorts them. */
function sortedWith(object, key, value) {
  const all = { ...object, [key]: value };
  return Object.fromEntries(
    Object.keys(all)
      .sort((a, b) => a.localeCompare(b, 'en'))
      .map((k) => [k, all[k]]),
  );
}

/** The lock's packages with one entry set: an existing one stays where it is, a new one goes where npm puts it. */
function packagesWith(packages, key, entry) {
  if (key in packages) return { ...packages, [key]: entry };
  const out = {};
  let placed = false;
  for (const [k, v] of Object.entries(packages)) {
    if (!placed && k !== '' && k.localeCompare(key, 'en') > 0) {
      out[key] = entry;
      placed = true;
    }
    out[k] = v;
  }
  if (!placed) out[key] = entry;
  return out;
}

/** A manifest's bin as npm keeps it in the lock: { name: path }, without a leading ./. */
function binOf(manifest) {
  const bin = typeof manifest.bin === 'string' ? { [manifest.name.split('/').pop()]: manifest.bin } : manifest.bin;
  if (!bin || typeof bin !== 'object') return undefined;
  return Object.fromEntries(Object.entries(bin).map(([k, v]) => [k, String(v).replace(/^(\.\/)+/, '')]));
}

/** Why the peers the package asks for are not what the site has, or null. */
function peerProblem(manifest, packages) {
  const optional = manifest.peerDependenciesMeta ?? {};
  for (const [peer, range] of Object.entries(manifest.peerDependencies ?? {})) {
    const have = packages[`node_modules/${peer}`]?.version;
    if (!have) {
      if (optional[peer]?.optional) continue;
      return `${manifest.name} ${manifest.version} skal have ${peer} ${range}, som sitet ikke har.`;
    }
    try {
      if (!satisfies(have, range)) return `${manifest.name} ${manifest.version} skal have ${peer} ${range}; sitet har ${have}.`;
    } catch (e) {
      if (e instanceof Unsupported)
        return `${manifest.name} ${manifest.version} skal have ${peer} ${range}, som ikke kan tjekkes uden npm.`;
      throw e;
    }
  }
  return null;
}

/**
 * package.json and package-lock.json (parsed) with the version the manifest describes (from the store's registry,
 * with its dist), as new objects. The version is written exactly ("1.4.0", not "^1.4.0"): the editor decides when to
 * update. Throws NeedsNpm when only `npm install` can do it.
 */
export function addToLock(packageJson, lock, manifest) {
  if (lock.lockfileVersion !== 3 || !lock.packages?.[''])
    throw new NeedsNpm('package-lock.json er ikke i den udgave, npm 9 og nyere skriver.');
  const { name, version, dist } = manifest;
  if (!dist?.tarball || !/^sha512-/.test(dist.integrity ?? '')) throw new NeedsNpm(`${name} ${version} har ingen checksum.`);
  for (const field of OWN_DEPENDENCIES) {
    const value = manifest[field];
    if (value && (Array.isArray(value) ? value.length : Object.keys(value).length)) throw new NeedsNpm(`${name} ${version} har ${field}.`);
  }
  if (INSTALL_SCRIPTS.some((s) => manifest.scripts?.[s])) throw new NeedsNpm(`${name} ${version} har scripts, der kører ved installation.`);
  const key = `node_modules/${name}`;
  for (const [path, entry] of Object.entries(lock.packages)) {
    // Another package that needs it, or a copy of it further down: npm decides where it goes then.
    if (path !== '' && path !== key && (path.endsWith(`/${key}`) || entry.dependencies?.[name] || entry.peerDependencies?.[name]))
      throw new NeedsNpm(`${name} bruges også af ${path.slice('node_modules/'.length)}.`);
  }
  const problem = peerProblem(manifest, lock.packages);
  if (problem) throw new NeedsNpm(problem);

  const entry = { version, resolved: dist.tarball, integrity: dist.integrity };
  if (manifest.license) entry.license = manifest.license;
  const bin = binOf(manifest);
  if (bin) entry.bin = bin;
  for (const field of ['engines', 'funding', 'peerDependencies', 'peerDependenciesMeta'])
    if (manifest[field]) entry[field] = manifest[field];

  const root = lock.packages[''];
  const packages = packagesWith(lock.packages, key, entry);
  packages[''] = { ...root, dependencies: sortedWith(root.dependencies ?? {}, name, version) };
  return {
    packageJson: { ...packageJson, dependencies: sortedWith(packageJson.dependencies ?? {}, name, version) },
    lock: { ...lock, packages },
  };
}
