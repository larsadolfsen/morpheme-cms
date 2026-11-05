// Tests footerPreview.mjs: what the footer's form changes (footerDraft), and those changes put into a page drawn as
// Footer.astro draws it (swapFooter). jsdom stands in for the browser's DOM.
// Run: node --test src/footerPreview.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { footerDraft, swapFooter } from './footerPreview.mjs';

const PAGE = `<!doctype html><html><body>
<footer data-editor="footer"><p class="name">Navn</p><p data-editor="footer-text">Gammel tekst</p>
<p data-editor="footer-contact-heading">Kontakt</p>
<p data-editor="footer-links-heading">Links</p>
<ul data-editor="footer-links"><li class="row"><a href="/a/" class="item">A</a></li><li class="row"><a href="/b/" class="item">B</a></li></ul>
</footer></body></html>`;

const THEME = { linkClass: 'item' };
const page = () => new JSDOM(PAGE).window.document;
const part = (doc, name) => doc.querySelector(`[data-editor="${name}"]`);

const SAVED = {
  text: 'Gammel tekst',
  contactHeading: 'Kontakt',
  linksHeading: 'Links',
  links: [
    { label: 'A', href: '/a/' },
    { label: 'B', href: '/b/' },
  ],
};

test('footerDraft: nothing changed is an empty draft', () => {
  assert.deepEqual(footerDraft(SAVED, structuredClone(SAVED)), {});
});

test('footerDraft: only the texts that differ', () => {
  assert.deepEqual(footerDraft(SAVED, { ...SAVED, text: 'Ny', linksHeading: 'Praktisk' }), { text: 'Ny', linksHeading: 'Praktisk' });
});

test('footerDraft: the links with only label and href', () => {
  const now = { ...SAVED, links: [{ label: 'C', href: '/c/', extra: 1 }] };
  assert.deepEqual(footerDraft(SAVED, now), { links: [{ label: 'C', href: '/c/' }] });
});

test('footerDraft: a file the site has not got is empty', () => {
  assert.deepEqual(footerDraft({}, {}), {});
  assert.deepEqual(footerDraft({}, { text: 'Hej' }), { text: 'Hej' });
});

test('swapFooter: an empty draft leaves the page as it is', () => {
  const doc = page();
  const before = doc.body.innerHTML;
  swapFooter(doc, {}, THEME);
  assert.equal(doc.body.innerHTML, before);
});

test('swapFooter: the text and the two headings are redrawn', () => {
  const doc = page();
  swapFooter(doc, { text: 'Ny tekst', contactHeading: 'Ring', linksHeading: 'Praktisk' }, THEME);
  assert.equal(part(doc, 'footer-text').textContent, 'Ny tekst');
  assert.equal(part(doc, 'footer-contact-heading').textContent, 'Ring');
  assert.equal(part(doc, 'footer-links-heading').textContent, 'Praktisk');
});

test('swapFooter: the links are copies of the page own', () => {
  const doc = page();
  const links = [
    { label: 'X', href: '/x/' },
    { label: 'Y', href: '/y/' },
    { label: 'Z', href: '/z/' },
  ];
  swapFooter(doc, { links }, THEME);
  const rows = [...part(doc, 'footer-links').children];
  assert.deepEqual(
    rows.map((li) => [li.className, li.querySelector('a').textContent, li.querySelector('a').getAttribute('href')]),
    [
      ['row', 'X', '/x/'],
      ['row', 'Y', '/y/'],
      ['row', 'Z', '/z/'],
    ],
  );
});

test('swapFooter: links with none on the page are drawn with the theme class', () => {
  const doc = page();
  part(doc, 'footer-links').replaceChildren();
  swapFooter(doc, { links: [{ label: 'X', href: '/x/' }] }, THEME);
  assert.equal(part(doc, 'footer-links').innerHTML, '<li><a class="item" href="/x/">X</a></li>');
});

test('swapFooter: no links leaves an empty list', () => {
  const doc = page();
  swapFooter(doc, { links: [] }, THEME);
  assert.equal(part(doc, 'footer-links').children.length, 0);
});

test('swapFooter: a page without the marked parts is left alone', () => {
  const doc = new JSDOM('<body><footer data-editor="footer"><slot></slot></footer></body>').window.document;
  const before = doc.body.innerHTML;
  swapFooter(doc, { text: 'x', links: [{ label: 'a', href: '/' }] }, THEME);
  assert.equal(doc.body.innerHTML, before);
});
