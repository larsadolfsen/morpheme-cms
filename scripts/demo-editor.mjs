// The demo's editor without sign-in (plan "The demo editor without sign-in", guard 1): only the demo's build adds it, so the package has no
// code path that skips sign-in. It writes into the built demo (`dist/editor/`):
// - demo-repo/manifest.json and demo-repo/bin/: the site's own files (what the editor reads from GitHub), text inline and bytes aside;
// - sw.js: the service worker that answers the Worker's calls from them (scripts/demo-editor-sw.js), saves in IndexedDB, in front of
//   the editor's own notification worker (kept as sw-notifications.js);
// - demo-editor.js, loaded by the editor's page, registers it. `/editor/?demo-reset` clears the saves.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT = /\.(md|mdx|jsonc?|ya?ml|txt|ts|js|mjs|css|astro|svg)$/;
const HERE = fileURLToPath(new URL('.', import.meta.url));
// The site's folders the editor reads; never node_modules, the build or the Worker.
const FOLDERS = ['src', 'public'];

function walk(site, dir, out) {
  for (const d of readdirSync(join(site, dir), { withFileTypes: true })) {
    const path = posix.join(dir, d.name);
    if (d.isDirectory()) walk(site, path, out);
    else out.push(path);
  }
  return out;
}

/** Names this build of the demo's files: a hash of their paths and bytes. The editor keeps the files it loaded together with the
 * commit they are from and loads them again only when the commit differs (src/cache.ts), so the demo's commit carries this id:
 * a browser that opened an earlier build (or another feature's demo, on the same address) would otherwise keep that build's files,
 * with its colours and pages, for ever. */
export function buildId(site, paths) {
  const hash = createHash('sha256');
  for (const path of paths)
    hash
      .update(`${path}\0`)
      .update(readFileSync(join(site, path)))
      .update('\0');
  return hash.digest('hex').slice(0, 12);
}

/** Adds the editor without sign-in to the built demo in `site`; gives how many files the editor can read. */
export function addDemoEditor(site) {
  const editor = join(site, 'dist/editor');
  const repo = join(editor, 'demo-repo');
  const paths = [...FOLDERS.filter((f) => existsSync(join(site, f))).flatMap((f) => walk(site, f, [])), 'package.json']
    .filter((p) => existsSync(join(site, p)) && statSync(join(site, p)).isFile())
    .sort();
  const files = paths.map((path) => {
    if (TEXT.test(path)) return { path, text: readFileSync(join(site, path), 'utf8') };
    mkdirSync(dirname(join(repo, 'bin', path)), { recursive: true });
    cpSync(join(site, path), join(repo, 'bin', path));
    return { path };
  });
  mkdirSync(repo, { recursive: true });
  writeFileSync(join(repo, 'manifest.json'), JSON.stringify({ build: buildId(site, paths), files }));
  // The editor's own worker stays, under another name, for the demo's worker to load.
  if (!existsSync(join(editor, 'sw-notifications.js'))) renameSync(join(editor, 'sw.js'), join(editor, 'sw-notifications.js'));
  cpSync(join(HERE, 'demo-editor-sw.js'), join(editor, 'sw.js'));
  cpSync(join(HERE, 'demo-editor-page.js'), join(editor, 'demo-editor.js'));
  const page = join(editor, 'index.html');
  const html = readFileSync(page, 'utf8');
  writeFileSync(page, html.replace('<head>', '<head><script src="/editor/demo-editor.js"></script>'));
  return files.length;
}
