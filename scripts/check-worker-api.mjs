import assert from 'node:assert/strict';
import worker from '../playground/worker.mjs';

const ORIGIN = 'https://interstellar-demo.workers.dev';
const OWNER_TOKEN = 'gho_owner_token_larsadolfsen';
const STRANGER_TOKEN = 'gho_stranger_token';

async function mockGitHubFetch(url, init = {}) {
  const u = String(url);
  const auth = init.headers?.authorization ?? init.headers?.Authorization ?? '';
  if (u === 'https://github.com/login/oauth/access_token') {
    const body = JSON.parse(init.body ?? '{}');
    if (body.code === 'owner-code') {
      return new Response(JSON.stringify({ access_token: OWNER_TOKEN }), { status: 200 });
    }
    if (body.code === 'stranger-code') {
      return new Response(JSON.stringify({ access_token: STRANGER_TOKEN }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'bad_verification_code' }), { status: 400 });
  }
  if (u === 'https://api.github.com/repos/larsadolfsen/interstellar-cms') {
    if (auth === `Bearer ${OWNER_TOKEN}`) {
      return new Response(JSON.stringify({ permissions: { pull: true, push: true, admin: true } }), { status: 200 });
    }
    if (auth === `Bearer ${STRANGER_TOKEN}`) {
      return new Response(JSON.stringify({ permissions: { pull: true, push: false, admin: false } }), { status: 200 });
    }
    return new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 });
  }
  if (u === 'https://api.github.com/user') {
    if (auth === `Bearer ${OWNER_TOKEN}`) {
      return new Response(JSON.stringify({ login: 'larsadolfsen', name: 'Lars Adolfsen' }), { status: 200 });
    }
    return new Response(JSON.stringify({ login: 'stranger', name: 'Stranger' }), { status: 200 });
  }
  return new Response('Not found', { status: 404 });
}

const baseEnv = {
  GITHUB_CLIENT_ID: 'client-id-123',
  GITHUB_CLIENT_SECRET: 'client-secret-456',
  __fetch: mockGitHubFetch,
  ASSETS: {
    async fetch(req) {
      const url = new URL(req.url);
      return new Response(`asset:${url.pathname}`, { status: 200 });
    },
  },
};

async function call(path, { method = 'GET', body, token = OWNER_TOKEN, cookie, env = baseEnv } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) {
    headers['Cookie'] = cookie;
  } else if (token) {
    headers['Cookie'] = `editor_session=${token}`;
  }
  const req = new Request(`${ORIGIN}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return worker.fetch(req, env);
}

async function runTests() {
  console.log('================================================================');
  console.log('   INTERSTELLAR CMS - CLOUDFLARE WORKER & AUTH VERIFIKATION     ');
  console.log('================================================================\n');

  // 1. Unauthenticated access MUST be blocked (401)
  {
    for (const ep of ['/api/github/head', '/api/r2', '/api/consent', '/api/not-found', '/api/push']) {
      const res = await call(ep, { token: null });
      assert.equal(res.status, 401, `Expected 401 for unauthenticated ${ep}`);
    }
    console.log('✓ [Auth Guard 401]   Uautoriserede kald til /api/* afvises med 401 (Log ind kræves)');
  }

  // 2. Non-owner GitHub user MUST be blocked (403)
  {
    const res = await call('/api/github/head', { token: STRANGER_TOKEN });
    assert.equal(res.status, 403, 'Expected 403 for non-owner GitHub user');

    const cbRes = await call('/oauth/callback?code=stranger-code&state=s1', {
      token: null,
      cookie: 'cms_oauth_state=s1',
    });
    assert.equal(cbRes.status, 403);
    assert.ok((await cbRes.text()).includes('Kun ejeren'));
    console.log('✓ [Owner Guard 403]  Andre GitHub-brugere uden push-rettighed afvises med 403');
  }

  // 3. Owner OAuth login flow (/oauth/auth + /oauth/callback)
  {
    const authRes = await call('/oauth/auth?provider=github&scope=repo', { token: null });
    assert.equal(authRes.status, 302);
    assert.ok(authRes.headers.get('location')?.startsWith('https://github.com/login/oauth/authorize'));

    const cbRes = await call('/oauth/callback?code=owner-code&state=s2', {
      token: null,
      cookie: 'cms_oauth_state=s2',
    });
    assert.equal(cbRes.status, 200);
    assert.ok(cbRes.headers.get('set-cookie')?.includes(`editor_session=${OWNER_TOKEN}`));
    console.log('✓ [Owner OAuth 200]  Kun repo-ejer (larsadolfsen) får editor_session cookie ved login');
  }

  // 4. R2 status (/api/r2)
  {
    const res = await call('/api/r2?bucket=interstellar-demo-files&jurisdiction=eu');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { bound: false, bucket: 'ready' });
    console.log('✓ [R2 Status]        GET /api/r2 -> { bound: false, bucket: "ready" }');
  }

  // 5. Consent log (/api/consent)
  {
    const getRes = await call('/api/consent');
    assert.equal(getRes.status, 200);
    assert.deepEqual(await getRes.json(), { entries: [], total: 0 });

    const postRes = await call('/api/consent', { method: 'POST', token: null, body: { choices: {} } });
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
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.key, null);

    const putRes = await call('/api/push', { method: 'PUT', body: {} });
    assert.equal(putRes.status, 200);

    const delRes = await call('/api/push', { method: 'DELETE', body: { endpoint: 'https://push.example' } });
    assert.equal(delRes.status, 204);
    console.log('✓ [Push API]         GET (200, key: null) / PUT (200) / DELETE (204) /api/push');
  }

  // 8. Editor static/runtime metadata endpoints
  {
    const verRes = await call('/editor/version.json', { token: null });
    assert.equal(verRes.status, 200);
    const ver = await verRes.json();
    assert.equal(ver.commit, 'head');
    assert.ok(typeof ver.builtAt === 'string');

    const manRes = await call('/editor/manifest.webmanifest', { token: null });
    assert.equal(manRes.status, 200);
    const man = await manRes.json();
    assert.equal(man.start_url, '/editor/');

    const swRes = await call('/editor/sw.js', { token: null });
    assert.equal(swRes.status, 200);
    assert.ok((await swRes.text()).includes('skipWaiting'));

    for (const ep of [
      '/editor/licenses.json',
      '/editor/page-colors.json',
      '/editor/links.json',
      '/editor/thumbnails.json',
      '/editor/code-images.json',
    ]) {
      const r = await call(ep, { token: null });
      assert.equal(r.status, 200, `Failed ${ep}`);
      await r.json();
    }
    console.log('✓ [Editor Endpoints] /editor/version.json, manifest.webmanifest, sw.js, licenses, links, thumbnails, code-images');
  }

  // 9. GitHub proxy endpoints (/api/github/*)
  {
    const headRes = await call('/api/github/head');
    assert.deepEqual(await headRes.json(), { commit: 'head', tree: 'root' });

    const filesRes = await call('/api/github/files', {
      method: 'POST',
      body: { folders: ['src/content/pages', 'src/data'], depth: 3, paths: ['wrangler.jsonc'] },
    });
    const filesData = await filesRes.json();
    assert.equal(filesData.commit, 'head');
    assert.equal(filesData.folders.length, 2);
    assert.ok(filesData.folders[0].length > 0);
    assert.deepEqual(filesData.paths, [{ path: 'wrangler.jsonc', oid: 'blob:wrangler.jsonc', binary: false }]);

    const textsRes = await call('/api/github/texts', {
      method: 'POST',
      body: { oids: ['blob:wrangler.jsonc', 'blob:src/data/theme.json'] },
    });
    const textsData = await textsRes.json();
    assert.ok(textsData.texts['blob:wrangler.jsonc'].includes('"r2_buckets"'));
    assert.ok(textsData.texts['blob:src/data/theme.json'].includes('"material"'));

    const treesRes = await call('/api/github/trees', {
      method: 'POST',
      body: { at: [{ root: 'root', path: 'src/content/pages' }] },
    });
    assert.deepEqual(await treesRes.json(), { trees: [null] });

    const gqlRes = await call('/api/github/graphql', {
      method: 'POST',
      body: {
        query: `query {
          viewer { login name }
          repository(owner: "larsadolfsen", name: "interstellar-cms") {
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
    assert.equal(gqlData.data.viewer.login, 'larsadolfsen');
    assert.equal(gqlData.data.repository.viewerPermission, 'ADMIN');
    assert.ok(gqlData.data.repository.f0.text.includes('material'));
    assert.ok(gqlData.data.repository.ref.target.f0.nodes[0].committedDate);

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

    const blobRes = await call('/api/github/blob/blob:src/data/theme.json');
    assert.equal(blobRes.status, 200);
    assert.equal(await blobRes.text(), updatedTheme);

    const logoutRes = await call('/api/github/logout', { method: 'POST' });
    assert.equal(logoutRes.status, 204);

    console.log('✓ [GitHub Proxy]     /api/github/{head,files,texts,trees,graphql,commit,blob,logout} (kun for larsadolfsen)');
  }

  console.log('\n================================================================');
  console.log('RESULTAT: AUTH-LÅS (KUN LARSADOLFSEN) & ALLE ENDPOINTS OK!      ');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
