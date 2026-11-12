// Tests for lib/section-marker.mjs: the marker line before an H2 that gives its section a colour, a picture and a width.
// Run: node --test lib/section-marker.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SECTION_COLORS,
  isLabelLine,
  isSafePicture,
  markerColor,
  rebuiltAddress,
  drawnAddress,
  markerHtml,
  parseMarker,
  sectionMarker,
} from './section-marker.mjs';

test('the colours are surface and the theme’s three accents', () =>
  assert.deepEqual(SECTION_COLORS, ['surface', 'primary', 'secondary', 'tertiary']));
test('writes the marker', () => assert.equal(sectionMarker('primary'), '<div data-section="primary"></div>'));
test('reads it back', () => {
  for (const c of SECTION_COLORS) assert.equal(markerColor(sectionMarker(c)), c);
});
test('reads it with space around', () => assert.equal(markerColor('  <div data-section="tertiary"></div>\n'), 'tertiary'));
test('an unknown colour is no marker', () => assert.equal(markerColor('<div data-section="red"></div>'), null));
test('the colours of before are read as what they became: Tint is Surface, Accent is Primary', () => {
  assert.equal(markerColor('<div data-section="tint"></div>'), 'surface');
  assert.equal(markerColor('<div data-section="accent"></div>'), 'primary');
});
test('other HTML is no marker', () => {
  assert.equal(markerColor('<div data-section="surface">x</div>'), null);
  assert.equal(markerColor('<div data-block="hero"></div>'), null);
  assert.equal(markerColor(''), null);
});
test('a picture and a width are kept, with the picture’s description', () => {
  const settings = { color: 'secondary', picture: '/images/a b.jpg', alt: 'A "wide" field', width: 'full' };
  const html = markerHtml(settings);
  assert.equal(
    html,
    '<div data-section="secondary" data-picture="/images/a b.jpg" data-alt="A &quot;wide&quot; field" data-width="full"></div>',
  );
  assert.deepEqual(parseMarker(html), settings);
});
test('a section with only a picture has no colour', () => {
  const html = markerHtml({ color: '', picture: '/a.jpg' });
  assert.equal(html, '<div data-section="" data-picture="/a.jpg"></div>');
  assert.deepEqual(parseMarker(html), { color: '', picture: '/a.jpg' });
  assert.equal(markerColor(html), null);
});
test('a marker with nothing to keep is not written', () => {
  assert.equal(markerHtml({ color: '' }), '');
  assert.equal(markerHtml({ color: 'tint-ish', width: 'full' }), '');
});
test('a width alone is kept with a colour', () =>
  assert.deepEqual(parseMarker(markerHtml({ color: 'surface', width: 'full' })), { color: 'surface', width: 'full' }));
test('a label line', () => {
  assert.equal(isLabelLine('<p class="label-medium">Step by step</p>'), true);
  assert.equal(isLabelLine('<p class="intro">Hi</p>'), false);
});

test('a picture is a path on the site or an https address', () => {
  for (const src of ['/images/a.jpg', '/images/a b.jpg', 'https://example.com/a.jpg?w=1']) {
    assert.equal(isSafePicture(src), true, src);
    assert.equal(parseMarker(markerHtml({ color: 'primary', picture: src, alt: 'A' }))?.picture, src);
  }
});
test('an unsafe picture is dropped, and the section keeps its colour', () => {
  for (const src of [
    'javascript:alert(1)',
    'data:text/html,x',
    '//evil.example/a.jpg',
    'http://example.com/a.jpg',
    '/images/../secret.jpg',
    '/images/a"b.jpg',
    '/images/a<b.jpg',
    '/images/a\\b.jpg',
    '/\\evil.example',
    'images/a.jpg',
    'https://user:pw@example.com/a.jpg',
  ]) {
    assert.equal(isSafePicture(src), false, src);
    assert.deepEqual(
      parseMarker(`<div data-section="primary" data-picture="${src.replace(/"/g, '&quot;').replace(/</g, '&lt;')}"></div>`),
      {
        color: 'primary',
      },
    );
  }
});
test('an unsafe picture alone is no marker', () =>
  assert.equal(parseMarker('<div data-section="" data-picture="javascript:alert(1)"></div>'), null));
test('the description is text: it is kept with quotes and angle brackets', () => {
  const alt = 'A <b>"wide"</b> field';
  assert.equal(parseMarker(markerHtml({ color: '', picture: '/a.jpg', alt }))?.alt, alt);
});
test('rebuiltAddress writes an address again, and refuses one with a character outside the allowed ones', () => {
  for (const ok of ['/images/a.jpg?v=2', 'https://example.com/a-b_c.jpg#x', 'blob:https://site.test/1a2b-3c'])
    assert.equal(rebuiltAddress(ok), ok);
  for (const bad of ['/a b.jpg', '/a".jpg', '/a<b>.jpg', '/a\\b.jpg', '/a`.jpg', '/\u00e5.jpg'])
    assert.equal(rebuiltAddress(bad), null, bad);
});
test('the editor draws only a rebuilt address (src/sectionFrame.ts)', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/sectionFrame.ts', import.meta.url), 'utf8');
  assert.match(source, /drawnAddress\(shownAt\(src\), location\.origin\)/);
  assert.match(source, /img\.src = drawn/);
  assert.doesNotMatch(source, /img\.(src|setAttribute\('src')[^\n]*(shownAt|url\.)/);
});
test('drawnAddress gives a path on the site, an https address or a blob address, written again, and nothing else', () => {
  const origin = 'https://site.test';
  assert.equal(drawnAddress('/images/a.jpg?v=2', origin), '/images/a.jpg?v=2');
  assert.equal(drawnAddress('https://example.com/a-b_c.jpg#x', origin), 'https://example.com/a-b_c.jpg#x');
  assert.equal(drawnAddress('blob:https://site.test/1a2b-3c', origin), 'blob:https://site.test/1a2b-3c');
  for (const bad of ['javascript:alert(1)', 'data:text/html,<b>', 'http://example.com/a.jpg', '//evil.test/a.jpg'])
    assert.equal(drawnAddress(bad, origin), null, bad);
  // A character that could leave an attribute is written percent-encoded by the URL parser, never as it was.
  for (const odd of ['/a b.jpg', '/a".jpg', '/a<b>.jpg', "/a'.jpg"]) assert.doesNotMatch(drawnAddress(odd, origin) ?? '', /["'<> `]/, odd);
});
test('the head picture of a post is drawn only from a safe, rebuilt address (src/fields.tsx)', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/fields.tsx', import.meta.url), 'utf8');
  assert.match(source, /isSafePicture\(text\) \? drawnAddress\(shownAt\(text\), location\.origin\)/);
  assert.match(source, /<img src=\{drawn\} alt=""/);
  assert.doesNotMatch(source, /<img src=\{shownAt\(text\)\}/);
});
