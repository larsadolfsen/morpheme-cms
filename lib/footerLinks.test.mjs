// Tests for lib/footerLinks.mjs: which links the footer shows, and which of them leave the editor.
import test from 'node:test';
import assert from 'node:assert/strict';
import { copyright, FOOTER_LINKS, isExternal, visibleLinks } from './footerLinks.mjs';

test('while terms has no URL, the footer shows 5 links and no terms', () => {
  const shown = visibleLinks(FOOTER_LINKS);
  assert.equal(shown.length, 5);
  assert.equal(
    shown.some((l) => l.id === 'terms'),
    false,
  );
});

test('with a terms URL, the footer shows 6 links and terms is third', () => {
  const links = FOOTER_LINKS.map((l) => (l.id === 'terms' ? { ...l, href: 'https://example.com/terms' } : l));
  const shown = visibleLinks(links);
  assert.equal(shown.length, 6);
  assert.equal(shown[2].id, 'terms');
});

test('each external href starts with https://, and the others stay in the editor', () => {
  for (const { href } of visibleLinks(FOOTER_LINKS)) {
    assert.equal(isExternal(href), href.startsWith('https://'));
    assert.equal(isExternal(href), !href.startsWith('#'));
  }
});

test('the copyright line has the year it is given', () => {
  assert.equal(copyright(2026), '© 2026 Lars Adolfsen');
  assert.equal(copyright(2027), '© 2027 Lars Adolfsen');
});
