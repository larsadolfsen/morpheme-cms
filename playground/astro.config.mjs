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

export default defineConfig({
  site: 'http://localhost:4321',
  root: here,
  integrations: [react(), interactDirective()],
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
