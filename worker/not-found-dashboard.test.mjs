// Tests that the NOT_FOUND namespace can hold people's dashboards (`dashboard:<id>`, worker/dashboard.js) beside its own `404:` keys
// (worker/not-found.js): the list never shows a dashboard, "delete" never touches one, and counting a visit never gives one an
// expiry. KV is a fake namespace in a Map; GitHub's answer to the sign-in is played by a fake fetch. No Cloudflare needed.
// Run: node --test worker/not-found-dashboard.test.mjs from the repository root. Depends on esbuild (the modules are bundled as wrangler does).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// not-found.js reads the sign-in through session.js, which imports `@site/config` (an alias only wrangler has). Bundle it with a
// stand-in for the config, so the test needs no built demo (scripts/worker-modules.mjs does, for the checks that run after the build).
const outfile = join(mkdtempSync(join(tmpdir(), 'not-found-dashboard-')), 'worker.mjs');
await build({
  entryPoints: [fileURLToPath(new URL('./not-found.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  logLevel: 'silent',
  plugins: [
    {
      name: 'site-config-stand-in',
      setup(b) {
        b.onResolve({ filter: /^@site\/config$/ }, () => ({ path: 'config', namespace: 'stand-in' }));
        b.onLoad({ filter: /.*/, namespace: 'stand-in' }, () => ({
          contents: "export const config = { repo: { owner: 'owner', name: 'site' } };",
          loader: 'js',
        }));
      },
    },
  ],
});
const { handleNotFound, recordNotFound } = await import(pathToFileURL(outfile).href);

const DASHBOARD = '{"version":1,"widgets":[{"id":"a","widget":"cms:status","settings":{}}]}';

/** A KV namespace in a Map, with what the Worker uses of it. `puts` keeps every put with its options. */
function fakeKV() {
  const data = new Map();
  const puts = [];
  return {
    data,
    puts,
    get: async (key) => data.get(key)?.value ?? null,
    getWithMetadata: async (key) => ({ value: data.get(key)?.value ?? null, metadata: data.get(key)?.metadata ?? null }),
    put: async (key, value, options = {}) => {
      puts.push({ key, value, options });
      data.set(key, { value, metadata: options.metadata ?? null, expirationTtl: options.expirationTtl });
    },
    delete: async (key) => void data.delete(key),
    list: async ({ prefix = '', cursor } = {}) => {
      const names = [...data.keys()].filter((name) => name.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const page = names.slice(start, start + 2);
      const done = start + 2 >= names.length;
      return {
        keys: page.map((name) => ({ name, metadata: data.get(name).metadata ?? undefined })),
        list_complete: done,
        cursor: done ? undefined : String(start + 2),
      };
    },
  };
}

/** A namespace with a dashboard and three addresses. */
async function namespace() {
  const kv = fakeKV();
  await kv.put('dashboard:101', DASHBOARD);
  kv.puts.length = 0;
  for (const [path, n] of [
    ['/a/', 3],
    ['/b/', 2],
    ['/c/', 1],
  ])
    kv.data.set(`404:${path}`, {
      value: '',
      metadata: { n, first: '2026-11-01T00:00:00.000Z', last: '2026-11-02T00:00:00.000Z', from: '' },
    });
  return kv;
}

// Someone who can save the site: GitHub says push on the repository.
const realFetch = globalThis.fetch;
const signedIn = (token) => {
  globalThis.fetch = async () => Response.json({ permissions: { pull: true, push: true } });
  return new Request('https://site.test/api/not-found', {
    headers: { cookie: `editor_session=${token}`, 'sec-fetch-site': 'same-origin' },
  });
};
const withEditor = async (token, method, body, run) => {
  try {
    const request = signedIn(token);
    const req = new Request(request.url, { method, headers: request.headers, ...(body && { body: JSON.stringify(body) }) });
    return await run(req);
  } finally {
    globalThis.fetch = realFetch;
  }
};

test('the list of 404 addresses does not show a dashboard, and leaves it as it was', async () => {
  const kv = await namespace();
  const res = await withEditor('t-list', 'GET', null, (req) => handleNotFound(req, { NOT_FOUND: kv }));
  const { entries } = await res.json();
  assert.deepEqual(
    entries.map((e) => e.path),
    ['/a/', '/b/', '/c/'],
  );
  assert.equal(kv.data.get('dashboard:101').value, DASHBOARD);
  assert.equal(kv.puts.length, 0);
});

test('deleting addresses takes only 404: keys, never a dashboard', async () => {
  const kv = await namespace();
  const res = await withEditor('t-delete', 'DELETE', { paths: ['/a/', '/b/', 'dashboard:101', '../dashboard:101'] }, (req) =>
    handleNotFound(req, { NOT_FOUND: kv }),
  );
  assert.equal(res.status, 200);
  assert.deepEqual([...kv.data.keys()].sort(), ['404:/c/', 'dashboard:101']);
  assert.equal(kv.data.get('dashboard:101').value, DASHBOARD);
});

test('counting a visit expires only its own 404: key, and leaves a dashboard without expiry', async () => {
  const kv = await namespace();
  const request = new Request('https://site.test/gone/', { headers: { referer: 'https://www.google.com/' } });
  await recordNotFound(request, new URL(request.url), { NOT_FOUND: kv });
  await recordNotFound(request, new URL(request.url), { NOT_FOUND: kv });
  assert.equal(kv.puts.length, 2);
  for (const put of kv.puts) {
    assert.equal(put.key, '404:/gone/');
    assert.equal(put.options.expirationTtl, 90 * 24 * 60 * 60);
  }
  assert.equal(kv.data.get('404:/gone/').metadata.n, 2);
  const dashboard = kv.data.get('dashboard:101');
  assert.equal(dashboard.value, DASHBOARD);
  assert.equal(dashboard.expirationTtl, undefined);
  assert.equal(dashboard.metadata, null);
});
