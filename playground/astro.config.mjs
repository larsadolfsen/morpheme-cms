import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, posix } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { appFoldersPlugin } from '../lib/apps.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const interactDirective = () => ({
  name: 'client-interact-directive',
  hooks: {
    'astro:config:setup': ({ addClientDirective }) => {
      addClientDirective({
        name: 'interact',
        entrypoint: resolve(root, 'site/directives/interact.mjs'),
      });
    },
  },
});

const TEXT = /\.(md|mdx|jsonc?|ya?ml|txt|ts|js|mjs|css|astro|svg)$/;
const listed = (path) => ({ path, oid: `blob:${path}`, binary: !TEXT.test(path) });
function filesIn(dir, depth, baseDir) {
  const fullDir = join(baseDir, dir);
  if (!existsSync(fullDir) || !statSync(fullDir).isDirectory()) return [];
  return readdirSync(fullDir, { withFileTypes: true }).flatMap((d) => {
    const path = posix.join(dir, d.name);
    if (d.isDirectory()) return depth > 1 ? filesIn(path, depth - 1, baseDir) : [];
    return [listed(path)];
  });
}
function answerGraphQL(query, baseDir) {
  const repository = { ref: { target: { oid: 'head' } }, viewerPermission: 'ADMIN' };
  for (const [, key, path] of query.matchAll(/(f\d+): object\(expression: "[^:"]+:([^"]+)"\)/g)) {
    const full = join(baseDir, path);
    if (!existsSync(full) || statSync(full).isDirectory()) repository[key] = null;
    else repository[key] = { oid: `blob:${path}`, text: TEXT.test(path) ? readFileSync(full, 'utf8') : null };
  }
  return { data: { viewer: { login: 'local-admin', name: 'Interstellar Admin' }, repository } };
}

function localEditorMiddleware() {
  return {
    name: 'local-editor-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/r2')) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ bound: false, bucket: 'ready' }));
        }
        if (req.url === '/editor/version.json' || req.url === '/version.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ version: 'dev' }));
        }
        if (req.url === '/editor/sw.js') {
          res.setHeader('Content-Type', 'application/javascript');
          return res.end('// dev service worker\nself.addEventListener("install", () => self.skipWaiting());');
        }
        if (req.url?.startsWith('/api/consent')) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ consents: [] }));
        }
        if (req.url?.startsWith('/api/not-found')) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ missing: [] }));
        }
        if (req.url === '/editor/licenses.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ works: [], owners: [] }));
        }
        if (req.url === '/editor/page-colors.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({}));
        }
        if (req.url === '/editor/links.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify([]));
        }
        if (req.url === '/editor/thumbnails.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({}));
        }
        if (req.url === '/editor/code-images.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify([]));
        }
        if (req.url?.startsWith('/api/github/')) {
          const route = req.url.slice('/api/github/'.length).split('?')[0];
          let body = {};
          if (req.method === 'POST') {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch {}
          }
          if (route === 'graphql') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(answerGraphQL(body.query ?? '', here)));
          }
          if (route === 'head') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ commit: 'head', tree: 'root' }));
          }
          if (route === 'files') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              commit: 'head',
              tree: 'root',
              folders: (body.folders ?? []).map((dir) => filesIn(dir, body.depth ?? 3, here)),
              paths: (body.paths ?? []).map((path) =>
                existsSync(join(here, path)) && statSync(join(here, path)).isFile() ? listed(path) : null,
              ),
            }));
          }
          if (route === 'trees') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ trees: (body.at ?? []).map(() => null) }));
          }
          if (route === 'texts') {
            res.setHeader('Content-Type', 'application/json');
            const paths = (body.oids ?? []).map((oid) => oid.replace(/^blob:/, ''));
            return res.end(JSON.stringify({
              texts: Object.fromEntries(
                paths.map((p) => [
                  `blob:${p}`,
                  existsSync(join(here, p)) ? readFileSync(join(here, p), 'utf8') : '',
                ]),
              ),
            }));
          }
          if (route === 'commit') {
            for (const change of body.changes ?? []) {
              const full = join(here, change.path);
              if (change.deleted) {
                if (existsSync(full)) unlinkSync(full);
              } else if (change.text !== undefined) {
                mkdirSync(dirname(full), { recursive: true });
                writeFileSync(full, change.text, 'utf8');
              }
            }
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ commit: 'head', oids: {} }));
          }
          if (route === 'logout') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ ok: true }));
          }
        }
        next();
      });
    },
  };
}

function collectAllFiles(baseDir, dir = '') {
  const fullDir = dir ? join(baseDir, dir) : baseDir;
  if (!existsSync(fullDir) || !statSync(fullDir).isDirectory()) return {};
  const out = {};
  for (const d of readdirSync(fullDir, { withFileTypes: true })) {
    if (['.astro', 'dist', 'node_modules'].includes(d.name)) continue;
    const rel = dir ? posix.join(dir, d.name) : d.name;
    if (d.isDirectory()) {
      Object.assign(out, collectAllFiles(baseDir, rel));
    } else if (d.isFile() && rel !== 'worker.mjs') {
      const binary = !TEXT.test(rel);
      out[rel] = { binary, text: binary ? null : readFileSync(join(baseDir, rel), 'utf8') };
    }
  }
  return out;
}

function writeDemoWorker(baseDir) {
  const snapshot = collectAllFiles(baseDir);
  const code = `// Auto-generated demo Worker for Cloudflare Workers deployment of playground
const FILES = ${JSON.stringify(snapshot)};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const listed = (path) => ({ path, oid: \`blob:\${path}\`, binary: FILES[path]?.binary ?? true });

function filesIn(dir, depth) {
  const prefix = dir.replace(/\\/+$/, '') + '/';
  const maxSlashes = prefix.split('/').length - 1 + (depth - 1);
  return Object.keys(FILES)
    .filter((p) => p.startsWith(prefix) && p.split('/').length - 1 <= maxSlashes)
    .map(listed);
}

function answerGraphQL(query) {
  const repository = { ref: { target: { oid: 'head' } }, viewerPermission: 'ADMIN' };
  for (const [, key, path] of query.matchAll(/(f\\d+): object\\(expression: "[^:"]+:([^"]+)"\\)/g)) {
    const entry = FILES[path];
    if (!entry) repository[key] = null;
    else repository[key] = { oid: \`blob:\${path}\`, text: entry.binary ? null : entry.text };
  }
  return { data: { viewer: { login: 'local-admin', name: 'Interstellar Admin' }, repository } };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith('/api/r2')) return json({ bound: false, bucket: 'ready' });
    if (pathname === '/editor/version.json' || pathname === '/version.json') return json({ version: 'dev' });
    if (pathname === '/editor/sw.js') {
      return new Response('// dev service worker\\nself.addEventListener("install", () => self.skipWaiting());', {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    }
    if (pathname.startsWith('/api/consent')) return json({ consents: [] });
    if (pathname.startsWith('/api/not-found')) return json({ missing: [] });
    if (pathname === '/editor/licenses.json') return json({ works: [], owners: [] });
    if (pathname === '/editor/page-colors.json') return json({});
    if (pathname === '/editor/links.json') return json([]);
    if (pathname === '/editor/thumbnails.json') return json({});
    if (pathname === '/editor/code-images.json') return json([]);

    if (pathname.startsWith('/api/github/')) {
      const route = pathname.slice('/api/github/'.length);
      let body = {};
      if (request.method === 'POST') {
        try {
          body = await request.json();
        } catch {}
      }
      if (route === 'graphql') return json(answerGraphQL(body.query ?? ''));
      if (route === 'head') return json({ commit: 'head', tree: 'root' });
      if (route === 'files') {
        return json({
          commit: 'head',
          tree: 'root',
          folders: (body.folders ?? []).map((dir) => filesIn(dir, body.depth ?? 3)),
          paths: (body.paths ?? []).map((p) => (FILES[p] ? listed(p) : null)),
        });
      }
      if (route === 'trees') return json({ trees: (body.at ?? []).map(() => null) });
      if (route === 'texts') {
        const paths = (body.oids ?? []).map((oid) => String(oid).replace(/^blob:/, ''));
        return json({
          texts: Object.fromEntries(paths.map((p) => [\`blob:\${p}\`, FILES[p]?.text ?? ''])),
        });
      }
      if (route === 'commit') {
        for (const change of body.changes ?? []) {
          if (change.deleted) delete FILES[change.path];
          else if (change.text !== undefined) FILES[change.path] = { binary: false, text: change.text };
        }
        return json({ commit: 'head', oids: {} });
      }
      if (route === 'logout') return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};
`;
  writeFileSync(join(baseDir, 'worker.mjs'), code, 'utf8');
}

const demoWorkerIntegration = () => ({
  name: 'demo-worker-generator',
  hooks: {
    'astro:config:setup': () => writeDemoWorker(here),
    'astro:build:done': () => writeDemoWorker(here),
  },
});

export default defineConfig({
  site: 'http://localhost:4321',
  root: here,
  integrations: [react(), interactDirective(), demoWorkerIntegration()],
  vite: {
    plugins: [tailwindcss(), appFoldersPlugin(root), localEditorMiddleware()],
    resolve: {
      alias: {
        '@theme': resolve(root, 'theme'),
        '@saturn': resolve(root, 'theme'),
        '@icons': resolve(root, 'icons'),
        '@site': resolve(here, 'src/site'),
        '@data': resolve(here, 'src/data'),
        '@interstellarcms/cms': root,
        'site-editor': root,
      },
    },
    ssr: {
      noExternal: ['@interstellarcms/cms'],
    },
  },
});
