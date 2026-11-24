// What the update's build does for the site's store themes and apps (`morpheme ci-build`, before its checks): when the target
// CMS reads other contracts than the live one, each item installed from the store that it does not accept is replaced, in
// the build's working tree, by the store's newest version it does accept; an item that has none, a site copy and an item changed in the
// site are named and stop the build (the editor's update then undoes itself, as for any failed build). The commit to the site
// is the editor's, on its first start (src/AppList.tsx commitBuildInstalls), from the installs file the build leaves.
// Exposes installForBuild, installMessages and writeInstalls. Depends on lib/buildInstall.mjs, lib/folderChanges.mjs,
// lib/git.mjs, lib/storeEntries.mjs and lib/storeUrl.mjs. The store's key is MORPHEME_STORE_KEY in the build's variables:
// without it, or when the store cannot be reached, nothing is installed and the checks decide, as before.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { appWorkersFile, writeAppWorkers } from '../lib/apps.mjs';
import { missingNames } from '../lib/appWorkerBindings.mjs';
import { installsFile, planInstall } from '../lib/buildInstall.mjs';
import { folderChanges } from '../lib/folderChanges.mjs';
import { blobId } from '../lib/git.mjs';
import { ITEM_ID, RECORD } from '../lib/storeEntries.mjs';
import { STORE_URL } from '../lib/storeUrl.mjs';

/** Where the build leaves the installs file; the Astro page `pages/editor/build-installs.json.js` serves it. */
export const INSTALLS_PATH = `.morpheme/${installsFile}`;

/** The files under `dir` (relative paths with `/`, git blob ids and bytes); none for a missing folder. */
function filesUnder(dir, base = dir) {
  /** @type {{ path: string, oid: string, bytes: Uint8Array }[]} */
  const out = [];
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...filesUnder(path, base));
    else out.push({ path: path.slice(base.length + 1).replaceAll('\\', '/'), oid: '', bytes: new Uint8Array(readFileSync(path)) });
  }
  return out;
}

/** The site's folders named as a store id, each with its store.json text and the files that differ from it. */
async function itemsIn(cwd, folders) {
  const items = [];
  for (const [kind, root] of /** @type {const} */ ([
    ['theme', folders.themes],
    ['app', folders.apps],
  ])) {
    let names = [];
    try {
      names = readdirSync(join(cwd, root)).filter(
        (n) => ITEM_ID.test(n) && n.startsWith(`${kind}_`) && statSync(join(cwd, root, n)).isDirectory(),
      );
    } catch {
      // no folder: nothing installed of this kind
    }
    for (const id of names) {
      const dir = join(cwd, root, id);
      const files = filesUnder(dir);
      for (const f of files) f.oid = await blobId(f.bytes);
      const text = files.find((f) => f.path === RECORD);
      const record = text ? new TextDecoder().decode(text.bytes) : null;
      let known = [];
      try {
        known = JSON.parse(record ?? '').files ?? [];
      } catch {
        // a copy: no record to compare with
      }
      const now = files.filter((f) => f.path !== RECORD);
      const changed = [
        ...now.filter((f) => known.find((r) => r.path === f.path)?.oid !== f.oid).map((f) => f.path),
        ...known.filter((r) => !now.some((f) => f.path === r.path)).map((r) => r.path),
      ];
      items.push({ kind, id, root, dir, record, changed, files: files.map(({ path, oid }) => ({ path: `${root}/${id}/${path}`, oid })) });
    }
  }
  return items;
}

/**
 * @param {object} o
 * @param {string} o.cwd the site's root
 * @param {{ apps: string, themes: string }} o.folders the site's folders of apps and themes (config.apps.folder, config.themes)
 * @param {{ theme: number, apps: number[] }} o.next the contracts of this CMS
 * @param {NodeJS.ProcessEnv} [o.env] MORPHEME_STORE_KEY, MORPHEME_STORE_URL
 * @param {typeof globalThis.fetch} [o.fetch]
 * @returns {Promise<{ status: 'nothing' | 'no-key' | 'unreachable' | 'ok', installs: import('../lib/buildInstall.mjs').Install[], problems: import('../lib/buildInstall.mjs').Problem[], workers?: string, bindings?: { id: string, names: string[] }[] }>}
 */
export async function installForBuild({ cwd, folders, next, env = process.env, fetch = globalThis.fetch }) {
  const items = await itemsIn(cwd, folders);
  const copies = items.filter((i) => i.record === null);
  /** @type {import('../lib/buildInstall.mjs').Problem[]} */
  const copyProblems = copies.map(({ kind, id }) => ({ kind, id, why: 'site-copy' }));
  const stored = items.filter((i) => i.record !== null);
  if (!items.length) return { status: 'nothing', installs: [], problems: [] };
  const key = env.MORPHEME_STORE_KEY?.trim();
  if (!stored.length || !key) return { status: stored.length ? 'no-key' : 'nothing', installs: [], problems: copyProblems };

  const base = env.MORPHEME_STORE_URL ?? STORE_URL;
  const ask = (path) => fetch(`${base}${path}`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20_000) });
  try {
    const answers = new Map();
    for (const { kind, id, record } of stored) {
      const version = (() => {
        try {
          return JSON.parse(record).version;
        } catch {
          return null;
        }
      })();
      const res =
        typeof version === 'string' ? await ask(`/store/releases/${encodeURIComponent(id)}/${encodeURIComponent(version)}`) : null;
      const body = res?.status === 200 ? await res.json().catch(() => null) : null;
      answers.set(`${kind}:${id}`, res?.status === 404 ? { missing: true } : Number.isInteger(body?.api) ? { api: body.api } : null);
    }
    // One catalog for each app contract the target reads, joined: the store's `?app=<n>` may give only versions at exactly n, and an
    // app whose newest accepted release is at an older contract the target still reads must not be named as having none.
    const catalogs = [];
    for (const n of next.apps) {
      const res = await ask(`/store/catalog?app=${n}&theme=${next.theme}`);
      catalogs.push(res.status === 200 ? await res.json().catch(() => null) : null);
    }
    if (catalogs.some((c) => !c || c.connected === false)) return { status: 'unreachable', installs: [], problems: copyProblems };
    const catalog = { themes: catalogs.flatMap((c) => c.themes ?? []), apps: catalogs.flatMap((c) => c.apps ?? []) };
    const plan = planInstall({ items: stored, answers, catalog, next });
    const problems = [...copyProblems, ...plan.problems];
    if (problems.length) return { status: 'ok', installs: [], problems };

    // Every file is read and checked before the first is written, so a failed store leaves the site's folders as they were.
    const wanted = [];
    for (const install of plan.install) {
      const files = [];
      for (const f of install.files) {
        const res = await ask(`/store/files/${f.oid}`);
        if (res.status !== 200) throw new Error(`file ${f.oid}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        if ((await blobId(bytes)) !== f.oid) throw new Error(`file ${f.oid}`);
        files.push({ path: f.path, content: bytes });
      }
      wanted.push({ install, files });
    }
    for (const { install, files } of wanted) {
      const item = items.find((i) => i.kind === install.kind && i.id === install.id);
      const record = { version: install.version, ref: install.version, files: install.files };
      const changes = folderChanges(`${item.root}/${item.id}`, item.files, { files, record });
      for (const c of changes) {
        const path = join(cwd, c.path);
        if (c.content === null) rmSync(path, { force: true });
        else {
          mkdirSync(dirname(path), { recursive: true });
          writeFileSync(path, c.content);
        }
      }
    }
    // An installed app with a Worker part is in worker/apps.js, which the editor commits with it (the build writes it so that
    // check:content passes); the names its Worker reads that wrangler.jsonc lacks are named, never added.
    const apps = plan.install.filter((i) => i.kind === 'app');
    if (!apps.length) return { status: 'ok', installs: plan.install, problems: [] };
    const before = existsSync(join(cwd, 'worker/apps.js')) ? readFileSync(join(cwd, 'worker/apps.js'), 'utf8') : null;
    const hasWorker = apps.some(({ id }) => existsSync(join(cwd, folders.apps, id, 'worker.js')));
    if (!hasWorker && before === null) return { status: 'ok', installs: plan.install, problems: [] };
    const workers = appWorkersFile(cwd);
    mkdirSync(join(cwd, 'worker'), { recursive: true });
    writeAppWorkers(cwd);
    const wrangler = ['wrangler.jsonc', 'wrangler.json'].map((f) => join(cwd, f)).find((f) => existsSync(f));
    const bindings = missingNames(
      apps.flatMap(({ id }) => {
        const file = join(cwd, folders.apps, id, 'worker.js');
        return existsSync(file) ? [{ id, code: readFileSync(file, 'utf8') }] : [];
      }),
      wrangler ? readFileSync(wrangler, 'utf8') : '',
    );
    return {
      status: 'ok',
      installs: plan.install,
      problems: [],
      bindings,
      ...(workers !== before?.replace(/\r\n/g, '\n') ? { workers } : {}),
    };
  } catch {
    return { status: 'unreachable', installs: [], problems: copyProblems };
  }
}

/**
 * The lines the build prints for what stopped it, each naming the item.
 * @param {import('../lib/buildInstall.mjs').Problem[]} problems
 * @param {{ themes: string, apps: string }} folders
 * @returns {string[]}
 */
export function installMessages(problems, folders) {
  return problems.map((p) => {
    const where = `${p.kind === 'theme' ? folders.themes : folders.apps}/${p.id}`;
    if (p.why === 'site-copy')
      return `The update stopped: ${where} is the site's own copy of a store ${p.kind} (it has no ${RECORD}). Replace it with the store's ${p.kind} in the editor, or move your changes to a ${p.kind} of your own.`;
    if (p.why === 'changed')
      return `The update stopped: ${where} was changed in the site (${(p.files ?? []).join(', ')}), so the build does not write over it. Reset it to the store's version in the editor, then update.`;
    return `The update stopped: the store has no version of the ${p.kind} ${p.id} (installed: ${p.version}) that this CMS accepts. Its publisher must release one.`;
  });
}

/**
 * The lines for the names an installed app's Worker reads that wrangler.jsonc does not declare.
 * @param {{ id: string, names: string[] }[]} bindings
 * @returns {string[]}
 */
export function bindingMessages(bindings) {
  return bindings.map(
    ({ id, names }) =>
      `The app ${id} reads ${names.join(', ')} in its Worker, which wrangler.jsonc does not declare: add ${names.length > 1 ? 'them' : 'it'} to the site's wrangler.jsonc (the update does not).`,
  );
}

/**
 * Leaves the installs for the editor's first start where the site's build serves them (pages/editor/build-installs.json.js);
 * with none, removes an older file.
 * @param {string} cwd @param {import('../lib/buildInstall.mjs').Install[]} installs @param {string} cms the CMS version @param {string} [workers] the new text of worker/apps.js, when the installs changed it
 */
export function writeInstalls(cwd, installs, cms, workers) {
  const file = join(cwd, INSTALLS_PATH);
  if (!installs.length) return rmSync(file, { force: true });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ cms, installs, ...(workers ? { workers } : {}) }, null, 2) + '\n');
}
