// Tests for lib/mcpOAuth.mjs: the checks of the assistants' OAuth sign-in (redirect addresses, PKCE, registration, discovery).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizationServerMetadata,
  clientFromRegistration,
  pkceMatches,
  protectedResourceMetadata,
  randomToken,
  redirectProblem,
  sha256Hex,
} from './mcpOAuth.mjs';

test('redirect addresses: https, and loopback over http', () => {
  for (const ok of [
    'https://claude.ai/api/mcp/auth_callback',
    'http://localhost:33418/callback',
    'http://127.0.0.1/cb',
    'http://[::1]:5000/cb',
  ])
    assert.equal(redirectProblem(ok), null, ok);
  for (const bad of [
    'http://example.com/cb',
    'ftp://example.com/cb',
    'javascript:alert(1)',
    'https://user:pw@example.com/cb',
    'https://example.com/cb#frag',
    'not a url',
    '',
    'https://example.com/' + 'a'.repeat(2100),
  ])
    assert.notEqual(redirectProblem(bad), null, bad);
  assert.notEqual(redirectProblem(42), null);
});

test('PKCE: only S256, and only the right verifier', async () => {
  const verifier = 'a'.repeat(43);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
  assert.equal(await pkceMatches(verifier, challenge), true);
  assert.equal(await pkceMatches('b'.repeat(43), challenge), false);
  assert.equal(await pkceMatches('short', challenge), false);
  assert.equal(await pkceMatches(undefined, challenge), false);
  assert.equal(await pkceMatches(verifier, undefined), false);
});

test('tokens are random, long and URL safe; the hash is hex and stable', async () => {
  const a = randomToken();
  assert.match(a, /^[A-Za-z0-9_-]{43,}$/);
  assert.notEqual(a, randomToken());
  assert.match(await sha256Hex('x'), /^[0-9a-f]{64}$/);
  assert.equal(await sha256Hex('x'), await sha256Hex('x'));
});

test('registration: name and redirect addresses are kept, a bad one is refused', () => {
  const ok = clientFromRegistration({ client_name: '  Claude ', redirect_uris: ['https://claude.ai/cb'] });
  assert.deepEqual(ok, { name: 'Claude', redirectUris: ['https://claude.ai/cb'] });
  assert.equal(clientFromRegistration({ redirect_uris: ['https://a.example/cb'] }).name, 'Assistant');
  for (const bad of [
    null,
    {},
    { redirect_uris: [] },
    { redirect_uris: 'https://a.example/cb' },
    { redirect_uris: ['http://a.example/cb'] },
    { redirect_uris: Array.from({ length: 6 }, (_, i) => `https://a.example/${i}`) },
    { redirect_uris: ['https://a.example/cb'], token_endpoint_auth_method: 'client_secret_basic' },
    { redirect_uris: ['https://a.example/cb'], grant_types: ['password'] },
  ])
    assert.ok(clientFromRegistration(bad).problem, JSON.stringify(bad));
  assert.equal(clientFromRegistration({ redirect_uris: ['https://a.example/cb'], client_name: 'x'.repeat(300) }).name.length, 80);
});

test('discovery documents name the editor address, S256 and no client secret', () => {
  const resource = protectedResourceMetadata('https://editor.example');
  assert.equal(resource.resource, 'https://editor.example/mcp');
  assert.deepEqual(resource.authorization_servers, ['https://editor.example']);
  const server = authorizationServerMetadata('https://editor.example');
  assert.equal(server.issuer, 'https://editor.example');
  assert.equal(server.authorization_endpoint, 'https://editor.example/oauth/mcp/authorize');
  assert.equal(server.token_endpoint, 'https://editor.example/oauth/mcp/token');
  assert.equal(server.registration_endpoint, 'https://editor.example/oauth/mcp/register');
  assert.deepEqual(server.code_challenge_methods_supported, ['S256']);
  assert.deepEqual(server.token_endpoint_auth_methods_supported, ['none']);
  assert.deepEqual(server.grant_types_supported, ['authorization_code', 'refresh_token']);
});
