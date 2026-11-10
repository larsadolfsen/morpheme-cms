// Tests headerPreview.mjs: what the header's settings in the form change (headerDraft), and those changes put into a page
// drawn as Header.astro and MobileNav.astro draw it (swapHeader). jsdom stands in for the browser's DOM.
// Run: node --test src/headerPreview.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { headerDraft, swapHeader } from './headerPreview.mjs';

// A page with the header as the site draws it: the menu button at the start, an item without and one with sub-items, the
// phone icon, and the bar of "Mobile menu".
const PAGE = `<!doctype html><html><body>
<header data-editor="header"><div data-header-row>
  <div data-editor="header-menu" class="start-class"><button>Menu</button></div>
  <a href="/" class="title">Logo</a>
  <nav data-editor="header-nav"><ul>
    <li data-nav-item><a href="/" class="md-nav-item" aria-current="page">Forside</a></li>
    <li data-nav-item><a href="/b/" class="md-nav-item md-nav-item-parent">Treatments</a>
      <button data-nav-toggle aria-controls="menu-1" aria-label="Pages under Treatments"></button>
      <div id="menu-1"><ul><li><a href="/b/a/">Arm</a></li></ul></div></li>
  </ul></nav>
  <a data-editor="header-cta" href="tel:12345678" aria-label="Ring 12 34 56 78">phone</a>
</div>
<nav data-editor="mobile-nav"><ul><li><a href="/" class="tab" aria-current="page">Forside</a></li></ul></nav>
</header><main></main></body></html>`;

const THEME = {
  menuClass: { start: 'start-class', end: 'end-class' },
  mobileNav: '<nav data-editor="mobile-nav" class="bar"><ul class="tabs"><li><a href="/" class="tab"></a></li></ul></nav>',
  subpagesOf: (label) => `Pages under ${label}`,
  current: '/',
};

const page = () => new JSDOM(PAGE).window.document;
const part = (doc, name) => doc.querySelector(`[data-editor="${name}"]`);
const labels = (el) => [...el.querySelectorAll(':scope > ul > li > a')].map((a) => a.textContent);

const SAVED = {
  menu: {
    enabled: true,
    items: [
      { label: 'Home', href: '/' },
      { label: 'Treatments', href: '/b/', children: [{ label: 'Arm', href: '/b/a/' }] },
    ],
  },
  mobileMenu: { enabled: true, items: [{ label: 'Home', href: '/' }] },
  header: { menuSide: 'start' },
};
const withChange = (change) => ({ ...SAVED, ...change });

test('headerDraft: nothing changed is an empty draft', () => {
  assert.deepEqual(headerDraft(SAVED, structuredClone(SAVED)), {});
});

test('headerDraft: the menu turned off is no items and no menu button', () => {
  assert.deepEqual(headerDraft(SAVED, withChange({ menu: { ...SAVED.menu, enabled: false } })), { nav: null });
});

test('headerDraft: the menu items with their sub-items A–Z', () => {
  const items = [
    {
      label: 'About',
      href: '/about/',
      children: [
        { label: 'Zone', href: '/z/' },
        { label: 'Arm', href: '/a/' },
      ],
    },
  ];
  assert.deepEqual(headerDraft(SAVED, withChange({ menu: { enabled: true, items } })).nav, [
    {
      label: 'About',
      href: '/about/',
      children: [
        { label: 'Arm', href: '/a/' },
        { label: 'Zone', href: '/z/' },
      ],
    },
  ]);
});

test('headerDraft: "Mobile menu" turned off is an empty bar, turned on its links', () => {
  assert.deepEqual(headerDraft(SAVED, withChange({ mobileMenu: { ...SAVED.mobileMenu, enabled: false } })), { mobileNav: [] });
  const off = withChange({ mobileMenu: { enabled: false, items: [{ label: 'Contact', href: '/contact/' }] } });
  assert.deepEqual(headerDraft(off, withChange({ mobileMenu: { ...off.mobileMenu, enabled: true } })), {
    mobileNav: [{ label: 'Contact', href: '/contact/' }],
  });
});

test('headerDraft: the button and the menu button at the end', () => {
  const header = { button: { enabled: true, label: 'Book', to: 'booking' }, menuSide: 'end' };
  assert.deepEqual(headerDraft(SAVED, withChange({ header })), {
    menuSide: 'end',
    cta: { button: { label: 'Book', to: 'booking' }, phone: true },
  });
  assert.deepEqual(headerDraft(withChange({ header }), SAVED), { menuSide: 'start', cta: { button: null, phone: true } });
});

test('headerDraft: the phone number turned off', () => {
  const header = { button: { enabled: false, phone: false } };
  assert.deepEqual(headerDraft(SAVED, withChange({ header })), { cta: { button: null, phone: false } });
});

test('swapHeader: an empty draft leaves the page as it is', () => {
  const doc = page();
  const before = doc.body.innerHTML;
  swapHeader(doc, {}, THEME);
  assert.equal(doc.body.innerHTML, before);
});

test('swapHeader: the menu items drawn again, with and without sub-items', () => {
  const doc = page();
  const nav = [
    { label: 'Contact', href: '/contact/' },
    {
      label: 'About',
      href: '/about/',
      children: [
        { label: 'Team', href: '/about/team/' },
        { label: 'Price', href: '/about/price/' },
      ],
    },
    { label: 'Home', href: '/' },
  ];
  swapHeader(doc, { nav }, THEME);
  const el = part(doc, 'header-nav');
  assert.deepEqual(labels(el), ['Contact', 'About', 'Home']);
  const [contact, about, home] = el.querySelectorAll(':scope > ul > li');
  assert.equal(contact.querySelector('[data-nav-toggle]'), null);
  assert.equal(contact.querySelector('a').hasAttribute('aria-current'), false);
  assert.equal(home.querySelector('a').getAttribute('aria-current'), 'page');
  const toggle = about.querySelector('[data-nav-toggle]');
  assert.equal(toggle.getAttribute('aria-controls'), 'menu-1');
  assert.equal(toggle.getAttribute('aria-label'), 'Pages under About');
  assert.deepEqual(
    [...about.querySelectorAll('#menu-1 a')].map((a) => [a.textContent, a.getAttribute('href')]),
    [
      ['Team', '/about/team/'],
      ['Price', '/about/price/'],
    ],
  );
});

test('swapHeader: the menu off removes its items and the menu button', () => {
  const doc = page();
  swapHeader(doc, { nav: null }, THEME);
  assert.equal(part(doc, 'header-nav'), null);
  assert.equal(part(doc, 'header-menu'), null);
});

test('swapHeader: the bar of "Mobile menu" drawn again, removed, and put in when the page has none', () => {
  const doc = page();
  swapHeader(
    doc,
    {
      mobileNav: [
        { label: 'A', href: '/a/' },
        { label: 'B', href: '/b/' },
      ],
    },
    THEME,
  );
  assert.deepEqual(labels(part(doc, 'mobile-nav')), ['A', 'B']);
  swapHeader(doc, { mobileNav: [] }, THEME);
  assert.equal(part(doc, 'mobile-nav'), null);
  swapHeader(doc, { mobileNav: [{ label: 'C', href: '/' }] }, THEME);
  const bar = part(doc, 'mobile-nav');
  assert.equal(bar.className, 'bar');
  assert.equal(bar.parentElement, part(doc, 'header'));
  assert.deepEqual(labels(bar), ['C']);
  assert.equal(bar.querySelector('a').getAttribute('aria-current'), 'page');
});

test('swapHeader: the call to action with the button', () => {
  const doc = page();
  const cta = '<div data-editor="header-cta" class="cta"><a href="/booking/">Book</a></div>';
  swapHeader(doc, { cta: { button: { label: 'Book', to: 'booking' }, phone: false } }, { ...THEME, cta });
  assert.equal(part(doc, 'header-cta').className, 'cta');
  assert.equal(part(doc, 'header-cta').textContent, 'Book');
  assert.equal(doc.querySelectorAll('[data-editor="header-cta"]').length, 1);
});

test('swapHeader: the menu button at the end and back at the start', () => {
  const doc = page();
  swapHeader(doc, { menuSide: 'end' }, THEME);
  const menu = part(doc, 'header-menu');
  assert.equal(menu.className, 'end-class');
  assert.equal(menu.parentElement.lastElementChild, menu);
  swapHeader(doc, { menuSide: 'start' }, THEME);
  assert.equal(menu.className, 'start-class');
  assert.equal(menu.parentElement.firstElementChild, menu);
});
