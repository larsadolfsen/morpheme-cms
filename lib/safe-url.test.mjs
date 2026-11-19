import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAFE_IMAGE_SRC, isSafeHref, isSafeImageSrc, safeHref, safeImageSrc } from './safe-url.mjs';

test('safeImageSrc accepts what the product draws', () => {
  for (const v of [
    '/images/uploads/2026/11/a-1b2c.webp',
    '/images/my photo.png',
    'images/a.webp',
    '/images/a.webp?v=2:3',
    'https://example.com/a.jpg',
    'http://localhost:4321/a.jpg',
    'blob:http://localhost:4321/6f1c2d3e-0000-4000-8000-000000000000',
    'blob:https://site.example/6f1c2d3e',
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/webp;base64,UklGR',
    'data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E',
    'data:image/svg+xml;charset=utf-8,%3Csvg%3E',
  ])
    assert.equal(safeImageSrc(v), v, v);
});

test('safeImageSrc rejects every other source', () => {
  for (const v of [
    undefined,
    null,
    42,
    '',
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'vbscript:x',
    'data:text/html,<script>alert(1)</script>',
    'data:text/html;base64,PHNjcmlwdD4=',
    'data:application/javascript,1',
    'data:image/x-evil;base64,AAAA',
    'blob:null/1',
    'file:///etc/passwd',
    'ftp://example.com/a.png',
    '//evil.example/a.png',
    '/\\evil.example/a.png',
    '\\\\evil.example\\a.png',
    'about:blank',
  ])
    assert.equal(safeImageSrc(v), undefined, String(v));
});

test('safeHref accepts routes, paths and http(s) addresses', () => {
  for (const v of ['#', '#files', '#list/posts', '/', '/files/a.pdf', 'https://example.com/', 'http://localhost:4321/x', 'page'])
    assert.equal(safeHref(v), v, v);
});

test('safeHref rejects other schemes and addresses that leave the site by a trick', () => {
  for (const v of [
    undefined,
    '',
    'javascript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:x',
    'data:text/html,x',
    'vbscript:x',
    '//evil.example',
    '/\\evil.example',
    'mailto:a@b.c',
  ])
    assert.equal(safeHref(v), undefined, String(v));
});

test('safeImageSrc and safeHref give the value itself, never a changed one', () => {
  for (const v of ['/a b.png', 'https://example.com/a?x=1&y=2', 'blob:https://site.example/1']) assert.equal(safeImageSrc(v), v);
  assert.equal(safeHref('#files'), '#files');
  assert.equal(safeHref('blob:https://site.example/1'), undefined);
  assert.equal(safeHref('data:image/png;base64,AA'), undefined);
});

test('isSafeImageSrc and isSafeHref agree with the functions that give the value', () => {
  for (const v of ['/a.png', 'https://example.com/a', 'javascript:alert(1)', 'data:text/html,x', '#files', '', undefined]) {
    assert.equal(isSafeImageSrc(v), safeImageSrc(v) !== undefined, String(v));
    assert.equal(isSafeHref(v), safeHref(v) !== undefined, String(v));
  }
});

test('SAFE_IMAGE_SRC gives the same answer as safeImageSrc', () => {
  for (const v of [
    '/a.png',
    'a.png',
    'https://example.com/a',
    'blob:https://x.example/1',
    'data:image/png;base64,AA',
    'javascript:alert(1)',
    'java\tscript:x',
    '//evil.example/a',
    'data:text/html,x',
    ' x',
    '',
    'a\nb',
  ])
    assert.equal(SAFE_IMAGE_SRC.test(v), safeImageSrc(v) !== undefined, JSON.stringify(v));
});
