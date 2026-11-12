// Tests for lib/appManifest.mjs: the checks of app.json, reading it from a folder and the cookies of an app.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { READ_SCOPES, cookiesFor, manifestProblems, readManifest } from './appManifest.mjs';

const base = { api: 4, label: 'Colors', publisher: 'Morpheme', license: 'MIT', icon: 'Palette', hint: 'Colors.', version: '1.0.0' };
const cookie = { name: '_ga', provider: 'Google', purpose: 'Counts visits.', duration: '2 years', category: 'statistics' };

test('a valid minimal manifest has no problems', () => {
  assert.deepEqual(manifestProblems(base, ['app.json']), []);
});

test('a missing key gives one problem naming it', () => {
  const { label, ...rest } = base;
  const problems = manifestProblems(rest, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /label/);
});

test('an unknown key gives one problem naming it', () => {
  const problems = manifestProblems({ ...base, foo: 1 }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /foo/);
});

test('a wrong api gives one problem naming it', () => {
  const problems = manifestProblems({ ...base, api: 3 }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /api/);
});

test('a manifest that is not an object gives one problem', () => {
  assert.equal(manifestProblems([], []).length, 1);
  assert.equal(manifestProblems(null, []).length, 1);
});

test('a version that is not semver gives one problem naming it', () => {
  const problems = manifestProblems({ ...base, version: '1.0' }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /version/);
});

test('hooks that match the files have no problems', () => {
  assert.deepEqual(manifestProblems({ ...base, hooks: ['page-colors'] }, ['app.json', 'hooks/page-colors.ts']), []);
});

test('a hook without a file gives one problem', () => {
  assert.equal(manifestProblems({ ...base, hooks: ['page-colors'] }, ['app.json']).length, 1);
});

test('a hook file without a hook gives one problem', () => {
  assert.equal(manifestProblems(base, ['app.json', 'hooks/page-colors.ts']).length, 1);
});

test('an unknown hook gives one problem', () => {
  const problems = manifestProblems({ ...base, hooks: ['foo'] }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /hooks/);
});

test('afterBuild matches the file after-build.ts', () => {
  assert.deepEqual(manifestProblems({ ...base, afterBuild: true }, ['app.json', 'after-build.ts']), []);
  assert.deepEqual(manifestProblems(base, ['app.json']), []);
  assert.equal(manifestProblems({ ...base, afterBuild: true }, ['app.json']).length, 1);
  assert.equal(manifestProblems(base, ['app.json', 'after-build.ts']).length, 1);
  assert.equal(manifestProblems({ ...base, afterBuild: false }, ['app.json', 'after-build.ts']).length, 1);
});

test('afterBuild that is not a boolean gives one problem', () => {
  const problems = manifestProblems({ ...base, afterBuild: 'yes' }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /afterBuild/);
});

test('reads accepts the known scopes and rejects others', () => {
  assert.deepEqual(manifestProblems({ ...base, reads: [...READ_SCOPES] }, ['app.json']), []);
  const problems = manifestProblems({ ...base, reads: ['secrets'] }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /reads/);
});

test('settings must hold fields and values', () => {
  const settings = { fields: [{ name: 'id', label: 'Id', type: 'string' }], values: { id: '' } };
  assert.deepEqual(manifestProblems({ ...base, settings }, ['app.json']), []);
  const problems = manifestProblems({ ...base, settings: { fields: {}, values: {} } }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /settings/);
  assert.equal(manifestProblems({ ...base, settings: { fields: [], values: {}, extra: 1 } }, ['app.json']).length, 1);
});

test('a cookie when that names no settings field gives one problem', () => {
  const cookies = [{ ...cookie, when: { setting: 'id' } }];
  assert.equal(manifestProblems({ ...base, cookies }, ['app.json']).length, 1);
  const settings = { fields: [{ name: 'id', label: 'Id', type: 'string' }], values: {} };
  assert.deepEqual(manifestProblems({ ...base, cookies, settings }, ['app.json']), []);
});

test('two cookies with the same name give one problem', () => {
  const problems = manifestProblems({ ...base, cookies: [cookie, { ...cookie }] }, ['app.json']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /_ga/);
});

test('a cookie may be in any cookie category, necessary included', () => {
  for (const category of ['necessary', 'preferences', 'statistics', 'marketing', 'targeting']) {
    assert.deepEqual(manifestProblems({ ...base, cookies: [{ ...cookie, category }] }, ['app.json']), []);
  }
});

test('a cookie with an unknown category or a missing text gives a problem', () => {
  assert.equal(manifestProblems({ ...base, cookies: [{ ...cookie, category: 'tracking' }] }, ['app.json']).length, 1);
  const { purpose, ...rest } = cookie;
  assert.equal(manifestProblems({ ...base, cookies: [rest] }, ['app.json']).length, 1);
});

test('csp must map directives to string lists', () => {
  assert.deepEqual(manifestProblems({ ...base, csp: { 'script-src': ['https://a.example'] } }, ['app.json']), []);
  assert.equal(manifestProblems({ ...base, csp: { 'script-src': 'https://a.example' } }, ['app.json']).length, 1);
});

test('cookiesFor leaves out a cookie whose setting is empty', () => {
  const manifest = {
    ...base,
    cookies: [
      { ...cookie, when: { setting: 'id' } },
      { ...cookie, name: '_gid' },
    ],
  };
  for (const empty of ['', undefined, null, false, []]) {
    assert.deepEqual(
      cookiesFor(manifest, { id: empty }).map((c) => c.name),
      ['_gid'],
    );
  }
  assert.deepEqual(
    cookiesFor(manifest, {}).map((c) => c.name),
    ['_gid'],
  );
  assert.deepEqual(
    cookiesFor(manifest, { id: 'G-1' }).map((c) => c.name),
    ['_ga', '_gid'],
  );
  assert.deepEqual(cookiesFor(base, {}), []);
});

function tempApp(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-manifest-'));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

test('readManifest returns null and no problems for a folder without app.json', () => {
  const dir = tempApp({ 'index.ts': '' });
  assert.deepEqual(readManifest(dir), { manifest: null, problems: [] });
});

test('readManifest gives one problem for invalid JSON', () => {
  const dir = tempApp({ 'app.json': '{ nope' });
  const result = readManifest(dir);
  assert.equal(result.manifest, null);
  assert.equal(result.problems.length, 1);
});

test('readManifest returns the manifest when it is valid, checking the files of the folder', () => {
  const dir = tempApp({ 'app.json': JSON.stringify({ ...base, hooks: ['page-colors'] }), 'hooks/page-colors.ts': '' });
  const result = readManifest(dir);
  assert.deepEqual(result.problems, []);
  assert.equal(result.manifest?.label, 'Colors');
});

test('readManifest returns no manifest when it has problems', () => {
  const dir = tempApp({ 'app.json': JSON.stringify(base), 'after-build.ts': '' });
  const result = readManifest(dir);
  assert.equal(result.manifest, null);
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /afterBuild/);
});

// Contract 5: role and mcp.
const base5 = { ...base, api: 5 };
const mcp = { server: 'https://mcp.example.com/mcp', auth: 'oauth', tools: ['lists', 'subscribe'] };
const connector = { ...base5, role: 'connector', mcp };

test('contract 4 fails on role and on mcp as unknown keys', () => {
  assert.match(manifestProblems({ ...base, role: 'plugin' }, ['app.json']).join('\n'), /"role" is not known/);
  assert.match(manifestProblems({ ...base, mcp }, ['app.json']).join('\n'), /"mcp" is not known/);
});

test('contract 5 reads a minimal manifest, a role and a valid mcp', () => {
  assert.deepEqual(manifestProblems(base5, ['app.json']), []);
  assert.deepEqual(manifestProblems({ ...base5, role: 'plugin' }, ['app.json']), []);
  assert.deepEqual(manifestProblems(connector, ['app.json']), []);
});

test('api must be 4 or 5', () => {
  assert.match(manifestProblems({ ...base, api: 6 }, ['app.json']).join('\n'), /"api" must be 4 or 5/);
});

test('an unknown role is a problem', () => {
  assert.match(manifestProblems({ ...base5, role: 'wizard' }, ['app.json']).join('\n'), /"role" must be "connector" or "plugin"/);
});

const mcpProblems = (m, extra = {}) => manifestProblems({ ...connector, mcp: m, ...extra }, ['app.json']).join('\n');

test('mcp: each rule is a named problem', () => {
  assert.match(mcpProblems({ ...mcp, server: 'http://mcp.example.com/mcp' }), /"mcp" server must be an https address/);
  assert.match(mcpProblems({ ...mcp, server: 'https://mcp.example.com:8443/mcp' }), /"mcp" server must have no port/);
  assert.match(mcpProblems({ ...mcp, server: 'https://user:pw@mcp.example.com/mcp' }), /no user info/);
  assert.match(mcpProblems({ ...mcp, server: 'https://192.168.0.1/mcp' }), /not an IP address/);
  assert.match(mcpProblems({ ...mcp, server: 'https://[::1]/mcp' }), /not an IP address/);
  assert.match(mcpProblems({ ...mcp, server: 'nonsense' }), /"mcp" server must be an https address/);
  assert.match(mcpProblems({ ...mcp, tools: ['a', 'a'] }), /tool "a" more than once/);
  assert.match(mcpProblems({ ...mcp, tools: ['Bad Name'] }), /tool "Bad Name" must match/);
  assert.match(mcpProblems({ server: mcp.server, auth: 'oauth' }), /"mcp" must have a list "tools"/);
  assert.match(mcpProblems({ ...mcp, tools: [] }), /"mcp" must have a list "tools"/);
  assert.match(mcpProblems({ ...mcp, auth: 'cookie' }), /"mcp" auth must be/);
});

test('mcp: auth token needs a secret settings field named token', () => {
  const token = { ...mcp, auth: 'token' };
  assert.match(mcpProblems(token), /auth "token" needs a secret settings field named "token"/);
  const field = (secret) => ({ settings: { fields: [{ name: 'token', type: 'text', ...(secret ? { secret: true } : {}) }], values: {} } });
  assert.match(mcpProblems(token, field(false)), /needs a secret settings field/);
  assert.equal(mcpProblems(token, field(true)), '');
});

test('role: only a connector may declare mcp', () => {
  assert.match(manifestProblems({ ...base5, role: 'plugin', mcp }, ['app.json']).join('\n'), /Only a connector may declare "mcp"/);
  assert.match(manifestProblems({ ...base5, mcp }, ['app.json']).join('\n'), /Only a connector may declare "mcp"/);
});

test('role: a plugin has no host in csp; a connector and a role-less app keep theirs', () => {
  const csp = { 'script-src': ['https://cdn.example.com'] };
  assert.match(manifestProblems({ ...base5, role: 'plugin', csp }, ['app.json']).join('\n'), /A plugin has no outside access/);
  assert.deepEqual(manifestProblems({ ...base5, role: 'connector', csp }, ['app.json']), []);
  assert.deepEqual(manifestProblems({ ...base5, csp }, ['app.json']), []);
  assert.deepEqual(manifestProblems({ ...base, csp }, ['app.json']), []);
  assert.deepEqual(manifestProblems({ ...base5, role: 'plugin', csp: { 'script-src': ["'self'", 'data:'] } }, ['app.json']), []);
});

test('a connector with both mcp and csp passes', () => {
  assert.deepEqual(manifestProblems({ ...connector, csp: { 'connect-src': ['https://mcp.example.com'] } }, ['app.json']), []);
});
