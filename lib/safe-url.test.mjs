import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isSafeHref, isSafeImageSrc, safeHref, safeImageSrc } from './safe-url.mjs';

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
    assert.equal(safeImageSrc(v), new URL(v, 'http://localhost/').href, v);
});

test('safeImageSrc gives the address as the browser reads it', () => {
  // A path on this site comes back as a full address of the page it is drawn on (here the placeholder host).
  assert.equal(safeImageSrc('/images/a.webp'), 'http://localhost/images/a.webp');
  assert.equal(safeImageSrc('images/a.webp'), 'http://localhost/images/a.webp');
  assert.equal(safeImageSrc('/images/my photo.png'), 'http://localhost/images/my%20photo.png');
  assert.equal(safeImageSrc('/images/a.webp?v=2:3'), 'http://localhost/images/a.webp?v=2:3');
  // What is already a full address keeps its form.
  for (const v of [
    'https://example.com/a.jpg',
    'blob:https://site.example/6f1c2d3e',
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E',
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

test('safeHref gives the link itself, never a changed one', () => {
  assert.equal(safeHref('#files'), '#files');
  assert.equal(safeHref('#'), '#');
  assert.equal(safeHref('/files/a b.pdf'), '/files/a b.pdf');
  assert.equal(safeHref('blob:https://site.example/1'), undefined);
  assert.equal(safeHref('data:image/png;base64,AA'), undefined);
});

test('safeHref percent-encodes only " < and >, so the link goes where the browser would take it', () => {
  for (const [v, out] of [
    ['#list/a"b', '#list/a%22b'],
    ['/files/<x>.pdf', '/files/%3Cx%3E.pdf'],
    ['https://example.com/?q="a"&b=<c>#"d"', 'https://example.com/?q=%22a%22&b=%3Cc%3E#%22d%22'],
    ['#list/%22already', '#list/%22already'],
    ["#list/a'b&c", "#list/a'b&c"],
  ]) {
    assert.equal(safeHref(v), out, v);
    assert.equal(new URL(out, 'https://site.example/editor/').href, new URL(v, 'https://site.example/editor/').href, v);
  }
});

test('isSafeImageSrc and isSafeHref agree with the functions that give the value', () => {
  for (const v of ['/a.png', 'https://example.com/a', 'javascript:alert(1)', 'data:text/html,x', '#files', '', undefined]) {
    assert.equal(isSafeImageSrc(v), safeImageSrc(v) !== undefined, String(v));
    assert.equal(isSafeHref(v), safeHref(v) !== undefined, String(v));
  }
});

// The site, the build and every saved form write an image's address as it was picked (/images/a.webp). Only the editor's
// components give an address to safeImageSrc, to draw it; none of it is written back. The first test pins who may import
// the helper; the second pins that it gives a full address only for the page it is drawn on.
test('only editor components (src/*.tsx) import safe-url: the site, the build and the saved forms never see its output', () => {
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0');
  const importers = tracked.filter(
    (file) =>
      /\.(?:m?js|tsx?|astro|md|json)$/.test(file) &&
      !/^(?:docs|release-notes|\.changeset|\.claude)\//.test(file) &&
      file !== 'lib/safe-url.mjs' &&
      file !== 'lib/safe-url.test.mjs' &&
      /from\s+['"][^'"]*safe-url(?:\.mjs)?['"]/.test(readFileSync(file, 'utf8')),
  );
  assert.ok(importers.length > 0);
  for (const file of importers) assert.match(file, /^src\/[A-Za-z]+\.tsx$/, `${file} imports safe-url`);
});

test('safeImageSrc reads a path against the page it is drawn on, and the saved address stays as picked', () => {
  const saved = '/images/uploads/2026/11/a-1b2c.webp';
  const before = { document: globalThis.document, location: globalThis.location };
  try {
    globalThis.document = { baseURI: 'https://site.example/editor/' };
    assert.equal(safeImageSrc(saved), 'https://site.example/images/uploads/2026/11/a-1b2c.webp');
    assert.equal(safeImageSrc('images/a.webp'), 'https://site.example/editor/images/a.webp');
    // The function gives a new string; the address that is saved is never changed.
    assert.equal(saved, '/images/uploads/2026/11/a-1b2c.webp');
    // A page that is not http(s) (a preview frame) reads against the placeholder host, never against about:srcdoc.
    globalThis.document = { baseURI: 'about:srcdoc' };
    assert.equal(safeImageSrc(saved), 'http://localhost/images/uploads/2026/11/a-1b2c.webp');
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
