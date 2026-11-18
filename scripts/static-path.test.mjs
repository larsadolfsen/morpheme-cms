import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { pathInside } from './static-path.mjs';

const root = resolve('/srv/site/dist');

test('an address inside the root gives its file path', () => {
  assert.equal(pathInside(root, '/'), root);
  assert.equal(pathInside(root, '/index.html'), join(root, 'index.html'));
  assert.equal(pathInside(root, '/blog/post/'), join(root, 'blog', 'post'));
  assert.equal(pathInside(root, '/a.css?v=1'), join(root, 'a.css'));
  assert.equal(pathInside(root, '/a.css#x'), join(root, 'a.css'));
  assert.equal(pathInside(root, '/my%20file.html'), join(root, 'my file.html'));
  assert.equal(pathInside(root, '/a/../b.html'), join(root, 'b.html'));
  assert.equal(pathInside(root, '/dist-other/x'), join(root, 'dist-other', 'x'));
});

test('an address that leaves the root gives null', () => {
  for (const a of [
    '/../secret',
    '/../../etc/passwd',
    '/a/../../secret',
    '/%2e%2e/secret',
    '/%2E%2E/%2e%2e/etc/passwd',
    '/..%2fsecret',
    '/a%2f..%2f..%2fsecret',
    '/..\\secret',
    '/%5c..%5csecret',
    '/a\\b',
    '/%00',
    '/%',
    '/%E0%A4%A',
    '//../secret',
  ])
    assert.equal(pathInside(root, a), null, a);
});

test('an absolute path or a sibling folder with the root as prefix stays inside or gives null', () => {
  assert.equal(pathInside(root, '/etc/passwd'), join(root, 'etc', 'passwd'));
  assert.equal(pathInside(root, '//etc/passwd'), join(root, 'etc', 'passwd'));
  assert.equal(pathInside(root, '/../dist-evil/x'), null);
});
