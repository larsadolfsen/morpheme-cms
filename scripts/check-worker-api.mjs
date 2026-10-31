import assert from 'node:assert/strict';
import worker from '../playground/worker.mjs';

const ORIGIN = 'https://interstellar-demo.workers.dev';

const baseEnv = {
  ASSETS: {
    async fetch(req) {
      const url = new URL(req.url);
      return new Response(`asset:${url.pathname}`, { status: 200 });
    },
  },
};

async function call(path, { method = 'GET', body, env = baseEnv } = {}) {
  const req = new Request(`${ORIGIN}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return worker.fetch(req, env);
}

async function runTests() {
  console.log('================================================================');
  console.log('   INTERSTELLAR CMS - CLOUDFLARE WORKER & API VERIFIKATION      ');
  console.log('================================================================\n');

  // 1. OAuth login (Demo mode -> 302 /editor/)
  {
    const res = await call('/oauth/auth?provider=github&scope=repo');
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('Location'), `${ORIGIN}/editor/`);
    console.log('✓ [OAuth Demo]       GET /oauth/auth -> 302 /editor/');
  }

  // 2. OAuth login (GitHub OAuth mode -> 302 github.com)
  {
    const res = await call('/oauth/auth?provider=github&scope=repo', {
      env: { ...baseEnv, GITHUB_CLIENT_ID: 'demo-id', GITHUB_CLIENT_SECRET: 'demo-secret' },
    });
    assert.equal(res.status, 302);
    assert.ok(res.headers.get('Location')?.startsWith('https://github.com/login/oauth/authorize'));
    console.log('✓ [OAuth GitHub]     GET /oauth/auth -> 302 github.com/login/oauth/authorize');
  }

  // 3. OAuth callback
  {
    const res = await call('/oauth/callback?code=123&state=abc');
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('/editor/'));
    console.log('✓ [OAuth Callback]   GET /oauth/callback -> 200 HTML redirect to /editor/');
  }

  // 4. R2 status (/api/r2)
  {
    const res = await call('/api/r2?bucket=interstellar-demo-files&jurisdiction=eu');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(data, { bound: false, bucket: 'ready' });
    console.log('✓ [R2 Status]        GET /api/r2 -> { bound: false, bucket: "ready" }');
  }

  // 5. Consent log (/api/consent)
  {
    const getRes = await call('/api/consent');
    assert.equal(getRes.status, 200);
    assert.deepEqual(await getRes.json(), { entries: [], total: 0 });

    const postRes = await call('/api/consent', { method: 'POST', body: { choices: {} } });
    assert.equal(postRes.status, 200);
    assert.deepEqual(await postRes.json(), { ok: true });

    const delRes = await call('/api/consent', { method: 'DELETE', body: { id: 'test' } });
    assert.equal(delRes.status, 200);
    assert.deepEqual(await delRes.json(), { deleted: 0 });
    console.log('✓ [Consent API]      GET/POST/DELETE /api/consent -> entries/ok/deleted');
  }

  // 6. Not-found log (/api/not-found)
  {
    const getRes = await call('/api/not-found');
    assert.equal(getRes.status, 200);
    assert.deepEqual(await getRes.json(), { entries: [] });

    const delRes = await call('/api/not-found', { method: 'DELETE', body: { paths: ['/old/'] } });
    assert.equal(delRes.status, 200);
    assert.deepEqual(await delRes.json(), { ok: true });
    console.log('✓ [Not-Found API]    GET/DELETE /api/not-found -> entries/ok');
  }

  // 7. Push notifications (/api/push)
  {
    const getRes = await call('/api/push');
    assert.equal(getRes.status, 503);

    const putRes = await call('/api/push', { method: 'PUT', body: {} });
    assert.equal(putRes.status, 200);

    const delRes = await call('/api/push', { method: 'DELETE', body: { endpoint: 'https://push.example' } });
    assert.equal(delRes.status, 204);
    console.log('✓ [Push API]         GET (503) / PUT (200) / DELETE (204) /api/push');
  }

  // 8. Editor static/runtime metadata endpoints
  {
    const verRes = await call('/editor/version.json');
    assert.equal(verRes.status, 200);
    const ver = await verRes.json();
    assert.equal(ver.commit, 'head');
    assert.ok(typeof ver.builtAt === 'string');

    const manRes = await call('/editor/manifest.webmanifest');
    assert.equal(manRes.status, 200);
    const man = await manRes.json();
    assert.equal(man.start_url, '/editor/');

    const swRes = await call('/editor/sw.js');
    assert.equal(swRes.status, 200);
    assert.ok((await swRes.text()).includes('skipWaiting'));

    for (const ep of [
      '/editor/licenses.json',
      '/editor/page-colors.json',
      '/editor/links.json',
      '/editor/thumbnails.json',
      '/editor/code-images.json',
    ]) {
      const r = await call(ep);
      assert.equal(r.status, 200, `Failed ${ep}`);
      await r.json();
    }
    console.log('✓ [Editor Endpoints] /editor/version.json, manifest.webmanifest, sw.js, licenses, links, thumbnails, code-images');
  }

  // 9. GitHub proxy endpoints (/api/github/*)
  {
    // head
    const headRes = await call('/api/github/head');
    assert.deepEqual(await headRes.json(), { commit: 'head', tree: 'root' });

    // files (folders + single path wrangler.jsonc)
    const filesRes = await call('/api/github/files', {
      method: 'POST',
      body: { folders: ['src/content/pages', 'src/data'], depth: 3, paths: ['wrangler.jsonc'] },
    });
    const filesData = await filesRes.json();
    assert.equal(filesData.commit, 'head');
    assert.equal(filesData.folders.length, 2);
    assert.ok(filesData.folders[0].length > 0, 'Expected pages in src/content/pages');
    assert.deepEqual(filesData.paths, [{ path: 'wrangler.jsonc', oid: 'blob:wrangler.jsonc', binary: false }]);

    // texts (verify wrangler.jsonc has r2_buckets line)
    const textsRes = await call('/api/github/texts', {
      method: 'POST',
      body: { oids: ['blob:wrangler.jsonc', 'blob:src/data/theme.json'] },
    });
    const textsData = await textsRes.json();
    assert.ok(textsData.texts['blob:wrangler.jsonc'].includes('"r2_buckets"'));
    assert.ok(textsData.texts['blob:src/data/theme.json'].includes('"material"'));

    // trees
    const treesRes = await call('/api/github/trees', {
      method: 'POST',
      body: { at: [{ root: 'root', path: 'src/content/pages' }] },
    });
    assert.deepEqual(await treesRes.json(), { trees: [null] });

    // graphql (viewer, repository permission, history aliases, object expression)
    const gqlRes = await call('/api/github/graphql', {
      method: 'POST',
      body: {
        query: `query {
          viewer { login name }
          repository(owner: "interstellar", name: "demo") {
            viewerPermission
            f0: object(expression: "HEAD:src/data/theme.json") { oid text }
            ref(qualifiedName: "refs/heads/main") {
              target {
                f0: history(first: 1, path: "src/content/pages/home.md") { nodes { committedDate } }
              }
            }
          }
        }`,
      },
    });
    const gqlData = await gqlRes.json();
    assert.equal(gqlData.data.viewer.login, 'local-admin');
    assert.equal(gqlData.data.repository.viewerPermission, 'ADMIN');
    assert.ok(gqlData.data.repository.f0.text.includes('material'));
    assert.ok(gqlData.data.repository.ref.target.f0.nodes[0].committedDate);

    // commit roundtrip (base64 content)
    const updatedTheme = JSON.stringify({ theme: 'material' }, null, 2) + '\n';
    const commitRes = await call('/api/github/commit', {
      method: 'POST',
      body: {
        message: 'Test commit',
        changes: [
          {
            path: 'src/data/theme.json',
            oid: 'blob:src/data/theme.json',
            content: Buffer.from(updatedTheme, 'utf8').toString('base64'),
          },
        ],
      },
    });
    const commitData = await commitRes.json();
    assert.equal(commitData.commit, 'head');
    assert.equal(commitData.blobs['src/data/theme.json'], 'blob:src/data/theme.json');

    // blob
    const blobRes = await call('/api/github/blob/blob:src/data/theme.json');
    assert.equal(blobRes.status, 200);
    assert.equal(await blobRes.text(), updatedTheme);

    // logout
    const logoutRes = await call('/api/github/logout', { method: 'POST' });
    assert.deepEqual(await logoutRes.json(), { ok: true });

    console.log('✓ [GitHub Proxy]     /api/github/{head,files,texts,trees,graphql,commit,blob,logout} (incl. wrangler.jsonc & R2 line)');
  }

  console.log('\n================================================================');
  console.log('RESULTAT: ALLE 22 CLOUDFLARE WORKER & API ENDPOINTS VERIFICERET!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
