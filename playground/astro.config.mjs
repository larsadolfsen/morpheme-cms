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
const resolveFile = (baseDir, path) => {
  const inBase = join(baseDir, path);
  if (existsSync(inBase)) return inBase;
  const inRoot = join(root, path);
  if (path === 'wrangler.jsonc' && existsSync(inRoot)) return inRoot;
  return inBase;
};
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
  const now = new Date().toISOString();
  const target = {
    oid: 'head',
    history: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } },
  };
  for (const [, key] of query.matchAll(/(f\d+):\s*history\(/g)) {
    target[key] = { nodes: [{ committedDate: now }] };
  }
  const repository = {
    ref: { target },
    object: { history: { nodes: [{ oid: 'head' }] } },
    viewerPermission: 'ADMIN',
  };
  for (const [, key, path] of query.matchAll(/(f\d+): object\(expression: "[^:"]+:([^"]+)"\)/g)) {
    const full = resolveFile(baseDir, path);
    if (!existsSync(full) || statSync(full).isDirectory()) repository[key] = null;
    else repository[key] = { oid: `blob:${path}`, text: TEXT.test(path) ? readFileSync(full, 'utf8') : null };
  }
  return { data: { viewer: { login: 'local-admin', name: 'Interstellar Admin' }, repository } };
}

const MANIFEST_JSON = JSON.stringify({
  name: 'Interstellar',
  short_name: 'Interstellar',
  description: 'Edit the content of interstellar.example.',
  lang: 'en-US',
  id: '/editor/',
  start_url: '/editor/',
  scope: '/editor/',
  display: 'standalone',
  icons: [
    { src: '/editor/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/editor/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/editor/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
});

function localEditorMiddleware() {
  const builtAt = new Date().toISOString();
  return {
    name: 'local-editor-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (pathname.startsWith('/oauth/')) {
          res.statusCode = 302;
          res.setHeader('Location', '/editor/');
          return res.end();
        }
        if (req.url?.startsWith('/api/r2')) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ bound: false, bucket: 'ready' }));
        }
        if (pathname === '/editor/version.json' || pathname === '/version.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ commit: 'head', builtAt }));
        }
        if (pathname === '/editor/manifest.webmanifest') {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          return res.end(MANIFEST_JSON);
        }
        if (pathname === '/editor/sw.js') {
          res.setHeader('Content-Type', 'application/javascript');
          return res.end('// dev service worker\nself.addEventListener("install", () => self.skipWaiting());');
        }
        if (req.url?.startsWith('/api/consent')) {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'DELETE') return res.end(JSON.stringify({ deleted: 0 }));
          if (req.method === 'POST') return res.end(JSON.stringify({ ok: true }));
          return res.end(JSON.stringify({ entries: [], total: 0 }));
        }
        if (req.url?.startsWith('/api/not-found')) {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'DELETE') return res.end(JSON.stringify({ ok: true }));
          return res.end(JSON.stringify({ entries: [] }));
        }
        if (req.url?.startsWith('/api/push')) {
          if (req.method === 'DELETE') {
            res.statusCode = 204;
            return res.end();
          }
          if (req.method === 'GET') {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'no push in demo' }));
          }
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ ok: true }));
        }
        if (pathname === '/editor/licenses.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ works: [], owners: [] }));
        }
        if (pathname === '/editor/page-colors.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({}));
        }
        if (pathname === '/editor/links.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify([]));
        }
        if (pathname === '/editor/thumbnails.json') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({}));
        }
        if (pathname === '/editor/code-images.json') {
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
              paths: (body.paths ?? []).map((path) => {
                const full = resolveFile(here, path);
                return existsSync(full) && statSync(full).isFile() ? listed(path) : null;
              }),
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
                paths.map((p) => {
                  const full = resolveFile(here, p);
                  return [`blob:${p}`, existsSync(full) ? readFileSync(full, 'utf8') : ''];
                }),
              ),
            }));
          }
          if (route === 'commit') {
            const blobs = {};
            for (const change of body.changes ?? []) {
              const full = resolveFile(here, change.path);
              if (change.deleted || change.content === null) {
                if (existsSync(full)) unlinkSync(full);
              } else {
                const text =
                  change.text !== undefined
                    ? change.text
                    : typeof change.content === 'string'
                      ? Buffer.from(change.content, 'base64').toString('utf8')
                      : undefined;
                if (text !== undefined) {
                  mkdirSync(dirname(full), { recursive: true });
                  writeFileSync(full, text, 'utf8');
                }
                blobs[change.path] = `blob:${change.path}`;
              }
            }
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ commit: 'head', blobs, oids: blobs }));
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
  if (!dir && !out['wrangler.jsonc'] && existsSync(join(root, 'wrangler.jsonc'))) {
    out['wrangler.jsonc'] = { binary: false, text: readFileSync(join(root, 'wrangler.jsonc'), 'utf8') };
  }
  return out;
}

function writeDemoWorker(baseDir) {
  const snapshot = collectAllFiles(baseDir);
  const builtAt = new Date().toISOString();
  const code = `// Auto-generated demo Worker for Cloudflare Workers deployment of playground
const FILES = ${JSON.stringify(snapshot)};
const BUILT_AT = ${JSON.stringify(builtAt)};
const MANIFEST_JSON = ${JSON.stringify(MANIFEST_JSON)};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
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
  const target = {
    oid: 'head',
    history: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } },
  };
  for (const [, key] of query.matchAll(/(f\\d+):\\s*history\\(/g)) {
    target[key] = { nodes: [{ committedDate: BUILT_AT }] };
  }
  const repository = {
    ref: { target },
    object: { history: { nodes: [{ oid: 'head' }] } },
    viewerPermission: 'ADMIN',
  };
  for (const [, key, path] of query.matchAll(/(f\\d+): object\\(expression: "[^:"]+:([^"]+)"\\)/g)) {
    const entry = FILES[path];
    if (!entry) repository[key] = null;
    else repository[key] = { oid: \`blob:\${path}\`, text: entry.binary ? null : entry.text };
  }
  return { data: { viewer: { login: 'local-admin', name: 'Interstellar Admin' }, repository } };
}

function decodeBase64(b64) {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

async function handleOAuth(request, url, env) {
  if (url.pathname === '/oauth/auth') {
    if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
      const state = crypto.randomUUID();
      const github = new URL('https://github.com/login/oauth/authorize');
      github.search = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: \`\${url.origin}/oauth/callback\`,
        scope: 'repo',
        state,
      });
      return new Response(null, {
        status: 302,
        headers: {
          Location: github.href,
          'Set-Cookie': \`cms_oauth_state=\${state}; Path=/oauth/; Max-Age=600; HttpOnly; Secure; SameSite=Lax\`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { Location: new URL('/editor/', url.origin).href, 'Cache-Control': 'no-store' },
    });
  }
  if (url.pathname === '/oauth/callback') {
    return new Response(
      '<!doctype html><html lang="da"><head><meta charset="utf-8"><title>Login</title></head><body><script>location.replace("/editor/");</script></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
    );
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith('/oauth/')) {
      const oauthRes = await handleOAuth(request, url, env);
      if (oauthRes) return oauthRes;
    }
    if (pathname.startsWith('/api/r2')) return json({ bound: false, bucket: 'ready' });
    if (pathname === '/editor/version.json' || pathname === '/version.json') {
      return json({ commit: 'head', builtAt: BUILT_AT });
    }
    if (pathname === '/editor/manifest.webmanifest') {
      return new Response(MANIFEST_JSON, {
        headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
      });
    }
    if (pathname === '/editor/sw.js') {
      return new Response('// dev service worker\\nself.addEventListener("install", () => self.skipWaiting());', {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    }
    if (pathname.startsWith('/api/consent')) {
      if (request.method === 'DELETE') return json({ deleted: 0 });
      if (request.method === 'POST') return json({ ok: true });
      return json({ entries: [], total: 0 });
    }
    if (pathname.startsWith('/api/not-found')) {
      if (request.method === 'DELETE') return json({ ok: true });
      return json({ entries: [] });
    }
    if (pathname.startsWith('/api/push')) {
      if (request.method === 'DELETE') return new Response(null, { status: 204 });
      if (request.method === 'GET') return json({ error: 'no push in demo' }, 503);
      return json({ ok: true });
    }
    if (pathname === '/editor/licenses.json') return json({ works: [], owners: [] });
    if (pathname === '/editor/page-colors.json') return json({});
    if (pathname === '/editor/links.json') return json([]);
    if (pathname === '/editor/thumbnails.json') return json({});
    if (pathname === '/editor/code-images.json') return json([]);

    if (pathname.startsWith('/api/github/')) {
      const route = pathname.slice('/api/github/'.length);
      if (route.startsWith('blob/') && request.method === 'GET') {
        const oid = decodeURIComponent(route.slice('blob/'.length));
        const filePath = oid.replace(/^blob:/, '');
        if (FILES[filePath]?.text != null) {
          return new Response(FILES[filePath].text, {
            headers: { 'Content-Type': 'application/octet-stream' },
          });
        }
        const pubPath = filePath.replace(/^public/, '');
        return env.ASSETS.fetch(new Request(new URL(pubPath, url.origin)));
      }
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
        const blobs = {};
        for (const change of body.changes ?? []) {
          if (change.deleted || change.content === null) {
            delete FILES[change.path];
          } else {
            const text =
              change.text !== undefined
                ? change.text
                : typeof change.content === 'string'
                  ? decodeBase64(change.content)
                  : '';
            FILES[change.path] = { binary: false, text };
            blobs[change.path] = \`blob:\${change.path}\`;
          }
        }
        return json({ commit: 'head', blobs, oids: blobs });
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
