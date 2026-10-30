// The built site served on this computer, with what the editor asks of GitHub (through the site's Worker) answered from
// the files in this repository, for the scripts that open the editor in a browser (editor-screens.mjs,
// app-screenshots.mjs): no sign-in, and nothing changes.
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, posix } from 'node:path';

const ROOT = `${process.cwd()}/`;

// The built site, as the host serves it: a folder is its index.html.
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
};

/** Serves the built site in `dist`; gives the server and its address. */
export async function serveBuilt(dist) {
  const server = createServer((req, res) => {
    let path = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(path));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return { server, site: `http://127.0.0.1:${server.address().port}` };
}

// GitHub, as the site's Worker answers the editor (packages/editor/worker/editor-github.js), answered from the files on disk: who is
// signed in (with write access), the commit the branch is at, the files in the folders and at the paths asked for, and
// their texts (a file's blob id is "blob:<path>"). A question about anything else (the versions of a file, what was
// deleted) gets no data, as for a file without history. `texts`: files with other texts than on disk, by their paths.
const TEXT = /\.(md|mdx|jsonc?|ya?ml|txt|ts|js|mjs|css|astro|svg)$/;
const listed = (path, texts) => ({ path, oid: `blob:${path}`, binary: !(path in texts) && !TEXT.test(path) });
function filesIn(dir, depth, texts) {
  if (!existsSync(join(ROOT, dir)) || !statSync(join(ROOT, dir)).isDirectory()) return [];
  const files = readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((d) => {
    const path = posix.join(dir, d.name);
    if (d.isDirectory()) return depth > 1 ? filesIn(path, depth - 1, texts) : [];
    return [listed(path, texts)];
  });
  // The files given that are not on disk, in their folder.
  const more = Object.keys(texts)
    .filter((path) => posix.dirname(path) === dir && !files.some((f) => f.path === path))
    .map((path) => listed(path, texts));
  return [...files, ...more];
}
function answer(query, texts) {
  const repository = { ref: { target: { oid: 'head' } }, viewerPermission: 'ADMIN' };
  for (const [, key, path] of query.matchAll(/(f\d+): object\(expression: "[^:"]+:([^"]+)"\)/g)) {
    const full = join(ROOT, path);
    if (path in texts) repository[key] = { oid: `blob:${path}`, text: texts[path] };
    else if (!existsSync(full) || statSync(full).isDirectory()) repository[key] = null;
    else repository[key] = { oid: `blob:${path}`, text: TEXT.test(path) ? readFileSync(full, 'utf8') : null };
  }
  return { data: { viewer: { login: 'editor-screens', name: 'Anna Jensen' }, repository } };
}
function workerAnswer(route, body, texts) {
  if (route === 'graphql') return answer(body.query ?? '', texts);
  if (route === 'head') return { commit: 'head', tree: 'root' };
  if (route === 'files')
    return {
      commit: 'head',
      tree: 'root',
      folders: (body.folders ?? []).map((dir) => filesIn(dir, body.depth ?? 3, texts)),
      paths: (body.paths ?? []).map((path) =>
        path in texts || (existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).isFile()) ? listed(path, texts) : null,
      ),
    };
  if (route === 'trees') return { trees: (body.at ?? []).map(() => null) };
  if (route === 'texts') {
    const paths = (body.oids ?? []).map((oid) => oid.replace(/^blob:/, ''));
    return { texts: Object.fromEntries(paths.map((path) => [`blob:${path}`, texts[path] ?? readFileSync(join(ROOT, path), 'utf8')])) };
  }
  return null;
}

/** Opens the editor (/editor/) of the site at `site` in `page`, signed in, with GitHub answered from the files on disk
 * (`texts`: some with other texts), and waits until it has loaded the site. */
export async function openEditor(page, site, texts = {}) {
  // R2 caching under "Avanceret": Cloudflare has the bucket (packages/editor/worker/r2-status.js).
  await page.route(`${site}/api/r2?**`, (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ bound: false, bucket: 'ready' }) }),
  );
  await page.route(`${site}/api/github/**`, (r) => {
    const route = new URL(r.request().url()).pathname.slice('/api/github/'.length);
    const found = workerAnswer(route, JSON.parse(r.request().postData() || '{}'), texts);
    return found ? r.fulfill({ contentType: 'application/json', body: JSON.stringify(found) }) : r.fulfill({ status: 404 });
  });
  await page.goto(`${site}/editor/`);
  // The editor has loaded the site when the start screen has its links.
  await page.waitForFunction(() => document.querySelectorAll('a[href^="#"]').length > 3, null, { timeout: 60_000 });
}
