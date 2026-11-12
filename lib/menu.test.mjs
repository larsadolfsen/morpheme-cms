// Tests lib/menu.mjs: which item is open for a route,
// the two-level tree (menuTree), and which section/item/child is open for a route (currentPlace).
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentPart, menuTree, currentPlace, placeOf, backTarget } from './menu.mjs';

const known = {
  lists: ['testimonials', 'cookies', 'prices'],
  header: ['menu', 'mobile-menu', 'header-button'],
  partScreens: ['privacy'],
  cookies: 'cookies',
  store: 'settings/appstore',
  settings: ['appearance', 'assistants', 'block-settings', 'caching', 'components', 'morpheme', 'privacy'],
};

const treeGroups = [
  { id: 'home', title: 'Home', href: '#', ids: [] },
  { id: 'content', title: 'Content', ids: ['pages', 'lists', 'redirects'] },
  { id: 'company', title: 'Business', ids: ['company/logo'] },
];
const treePartOf = (id) => ({ label: `L ${id}`, href: `#${id === 'redirects' ? 'seo/redirects' : id}`, count: null });
const treeChildren = (id) =>
  id === 'redirects'
    ? [
        { id: 'all', label: 'All', href: '#seo/redirects/all' },
        { id: 'not-found', label: 'Not found', href: '#seo/redirects/not-found' },
      ]
    : id === 'lists'
      ? [{ id: 'prices', label: 'Prices', href: '#list/prices' }]
      : [];
const tree = menuTree(treeGroups, treePartOf, treeChildren);

test('an open collection is its own item', () => {
  assert.equal(currentPart('src/content/pages/about.md', { ...known, open: 'pages' }), 'pages');
  assert.equal(currentPart('list/blog', { ...known, open: 'blog' }), 'blog');
});

test('a short list is under Lists', () => {
  assert.equal(currentPart('list/testimonials', known), 'lists');
  assert.equal(currentPart('new/testimonials', known), 'lists');
  assert.equal(currentPart('deleted/prices', known), 'lists');
  assert.equal(currentPart('src/data/prices/a.json', { ...known, open: 'prices' }), 'lists');
});

test('the cookie list is under Privacy, whatever the way to it', () => {
  assert.equal(currentPart('list/cookies', known), 'privacy');
  assert.equal(currentPart('list/cookies/cookiescanner', known), 'privacy');
  assert.equal(currentPart('new/cookies', known), 'privacy');
  assert.equal(currentPart('deleted/cookies', known), 'privacy');
  assert.equal(currentPart('src/data/cookie-list/a.json', { ...known, open: 'cookies' }), 'privacy');
});

test('the menus are under Header', () => {
  assert.equal(currentPart('src/data/menu.json', { ...known, open: 'menu' }), 'header');
  assert.equal(currentPart('list/mobile-menu', known), 'header');
  assert.equal(currentPart('src/data/header.json', { ...known, open: 'header-button' }), 'header');
});

test('a screen under a part is that part', () => {
  assert.equal(currentPart('company', known), 'company');
  assert.equal(currentPart('company/payment/mobilepay', known), 'company');
  assert.equal(currentPart('blocks', known), 'blocks');
  assert.equal(currentPart('blocks/hero', known), 'blocks');
  assert.equal(currentPart('appearance/themes', known), 'appearance');
  assert.equal(currentPart('seo/redirects', known), 'seo');
  assert.equal(currentPart('apps/calendly', known), 'apps');
  assert.equal(currentPart('apps/calendly/settings', known), 'apps');
});

test('Block settings is not under Block templates, and a longer name is not under a shorter one', () => {
  assert.equal(currentPart('block-settings', known), 'block-settings');
  assert.equal(currentPart('appsx', known), 'appsx');
});

test('Morpheme and Licenses have their routes under them', () => {
  assert.equal(currentPart('morpheme/0.15', known), 'morpheme');
  assert.equal(currentPart('licenses/some-id', known), 'licenses');
});

test('the screens with parts, and their parts, are the screen', () => {
  assert.equal(currentPart('privacy', known), 'privacy');
  assert.equal(currentPart('privacy/cookie-banner', known), 'privacy');
});

test('the app store is Find apps', () => {
  assert.equal(currentPart('settings/appstore', known), 'appstore');
});

test('a screen of its own is itself, and the start screen is none', () => {
  assert.equal(currentPart('developer/caching', known), 'caching');
  assert.equal(currentPart('developer/parts', known), 'components');
  assert.equal(currentPart('developer/parts/editor', known), 'components');
  assert.equal(currentPart('licenses', known), 'licenses');
  assert.equal(currentPart('', known), '');
});

test('menuTree keeps the groups in the order written', () => {
  assert.deepEqual(
    tree.map((e) => e.id),
    ['home', 'content', 'company'],
  );
});

test('menuTree copies href only when the group has it', () => {
  assert.equal(tree[0].href, '#');
  assert.deepEqual(tree[0].items, []);
  assert.equal('href' in tree[1], false);
});

test('menuTree gives the items in the order written', () => {
  assert.deepEqual(
    tree[1].items.map((i) => i.id),
    ['pages', 'lists', 'redirects'],
  );
  assert.equal(tree[1].items[0].label, 'L pages');
});

test('menuTree adds children only when there are some', () => {
  assert.equal(tree[1].items[2].children.length, 2);
  assert.equal('children' in tree[1].items[0], false);
});

test('currentPlace on the start screen is no section', () => {
  assert.deepEqual(currentPlace('', tree, known), { section: null });
});

test('currentPlace finds a child', () => {
  assert.deepEqual(currentPlace('seo/redirects/all', tree, known), { section: 'content', item: 'redirects', child: 'all' });
});

test('currentPlace finds a list as a child of Lists', () => {
  assert.deepEqual(currentPlace('list/prices', tree, known), { section: 'content', item: 'lists', child: 'prices' });
});

test('currentPlace finds an item by its href', () => {
  assert.deepEqual(currentPlace('seo/redirects', tree, known), { section: 'content', item: 'redirects' });
});

test('currentPlace finds a screen under an item', () => {
  assert.deepEqual(currentPlace('company/logo/x', tree, known), { section: 'company', item: 'company/logo' });
});

test('currentPlace falls back to currentPart', () => {
  assert.deepEqual(currentPlace('rediger/pages/app-store', tree, { ...known, open: 'pages' }), { section: 'content', item: 'pages' });
});

test('currentPlace gives no section for an unknown route', () => {
  assert.deepEqual(currentPlace('ukendt', tree, known), { section: null });
});

test('currentPlace gives the section of a screen that is a section itself', () => {
  assert.deepEqual(currentPlace('company', tree, known), { section: 'company' });
});

// (A copy: defaults/editor.ts is TypeScript with JSX imports, which plain Node cannot load.)
// The menu as defaults/editor.ts `groups` writes it, with the hrefs the editor gives.
const menuGroups = [
  { id: 'home', title: 'Home', href: '#', ids: [] },
  {
    id: 'content',
    title: 'Content',
    ids: ['pages', 'blog', 'lists', 'popups', 'tags', 'files', 'internal-links', 'redirects'],
  },
  { id: 'company', title: 'Business', ids: ['logo', 'colors', 'company'] },
  { id: 'global', title: 'Globals', ids: ['header', 'footer', 'side-column', 'blocks'] },
  { id: 'apps', title: 'Apps', ids: ['appstore'] },
];
const hrefs = {
  pages: '#list/pages',
  blog: '#list/blog',
  lists: '#lists',
  popups: '#list/popups',
  tags: '#list/tags',
  files: '#files',
  'internal-links': '#seo/internal-links',
  redirects: '#seo/redirects',
  company: '#company',
  apps: '#apps',
  appstore: '#settings/appstore',
  blocks: '#blocks',
  header: '#global/header',
  footer: '#global/footer',
  'side-column': '#global/side-column',
  logo: '#company/logo',
  colors: '#company/colors',
};
const menu = menuTree(
  menuGroups,
  (id) => ({ label: id, href: hrefs[id], count: null }),
  (id) =>
    id === 'redirects'
      ? [
          { id: 'all', label: 'All', href: '#seo/redirects/all' },
          { id: 'not-found', label: 'Not found', href: '#seo/redirects/not-found' },
        ]
      : id === 'apps'
        ? [{ id: 'calendly', label: 'Calendly', href: '#apps/calendly' }]
        : id === 'company'
          ? [
              { id: 'contact', label: 'Contact', href: '#company/contact' },
              { id: 'booking', label: 'Booking', href: '#company/booking' },
            ]
          : [],
);
const menuKnown = { ...known, store: 'settings/appstore' };
const allIds = menu.flatMap((e) => e.items.flatMap((i) => [i.id, ...(i.children ?? []).map((c) => c.id)]));
const allHrefs = menu.flatMap((e) => e.items.flatMap((i) => [i.href, ...(i.children ?? []).map((c) => c.href)]));

test('the menu has five sections in order: no Appearance, Privacy or Settings', () => {
  assert.deepEqual(
    menu.map((e) => e.id),
    ['home', 'content', 'company', 'global', 'apps'],
  );
});

test('Content holds Internal links and Redirects after the files, in order', () => {
  assert.deepEqual(
    menu[1].items.map((i) => i.id),
    ['pages', 'blog', 'lists', 'popups', 'tags', 'files', 'internal-links', 'redirects'],
  );
});

test('Redirects has All and Not found as children', () => {
  const redirects = menu[1].items.find((i) => i.id === 'redirects');
  assert.deepEqual(
    redirects.children.map((c) => c.href),
    ['#seo/redirects/all', '#seo/redirects/not-found'],
  );
});

test('Store is under Apps, and no app installed is', () => {
  assert.deepEqual(
    menu[4].items.map((i) => i.id),
    ['appstore'],
  );
});

test('Analytics, SEO, the SEO rating, Licenses, System status and the Settings rows are not in the menu', () => {
  for (const gone of [
    'analytics',
    'seo',
    'rating',
    'licenses',
    'status',
    'appearance',
    'privacy',
    'developer',
    'morpheme',
    'block-settings',
    'caching',
    'components',
  ]) {
    assert.equal(allIds.includes(gone), false);
  }
  for (const gone of [
    '#analytics',
    '#seo',
    '#seo/rating',
    '#licenses',
    '#status',
    '#appearance',
    '#privacy',
    '#developer',
    '#morpheme',
    '#block-settings',
  ]) {
    assert.equal(allHrefs.includes(gone), false);
  }
});

test('currentPlace of a page being edited, a list, the SEO rating, an app and Find apps', () => {
  assert.deepEqual(currentPlace('list/pages/app-store', menu, menuKnown), { section: 'content', item: 'pages' });
  assert.deepEqual(currentPlace('src/content/pages/about.md', menu, { ...menuKnown, open: 'pages' }), {
    section: 'content',
    item: 'pages',
  });
  assert.deepEqual(currentPlace('seo/redirects/all', menu, menuKnown), {
    section: 'content',
    item: 'redirects',
    child: 'all',
  });
  assert.deepEqual(currentPlace('seo/internal-links', menu, menuKnown), { section: 'content', item: 'internal-links' });
  assert.deepEqual(currentPlace('seo/rating', menu, menuKnown), { section: null });
  assert.deepEqual(currentPlace('apps/calendly', menu, menuKnown), { section: 'apps' });
  assert.deepEqual(currentPlace('settings/appstore', menu, menuKnown), { section: 'apps', item: 'appstore' });
});

test('currentPlace of the Settings screen is the cog, with no section and no item', () => {
  assert.deepEqual(currentPlace('settings', menu, menuKnown), { section: null, settings: true });
});

test('currentPlace of a route under a Settings id is the cog', () => {
  const cog = { section: null, settings: true };
  for (const route of [
    'appearance',
    'appearance/theme-store',
    'appearance/themes/material',
    'appearance/default-pages',
    'block-settings',
    'developer/caching',
    'developer/parts',
    'developer/parts/editor',
    'morpheme',
    'morpheme/0.15',
    'privacy',
    'privacy/consents',
    'privacy/cookie-banner',
    'list/cookies',
    'list/cookies/a',
  ]) {
    assert.deepEqual(currentPlace(route, menu, menuKnown), cog, route);
  }
  // A file open from a Settings screen: the cookie list.
  assert.deepEqual(currentPlace('src/data/cookie-list/a.json', menu, { ...menuKnown, open: 'cookies' }), cog);
});

test('currentPlace of Globals is the section, not the cog: Header, Footer, Side column, the menus and the block templates', () => {
  for (const [route, item, open] of [
    ['global/header', 'header'],
    ['global/footer', 'footer'],
    ['global/side-column', 'side-column'],
    ['blocks', 'blocks'],
    ['blocks/hero', 'blocks'],
    ['list/mobile-menu', 'header'],
    ['src/data/menu.json', 'header', 'menu'],
  ]) {
    const known = open ? { ...menuKnown, open } : menuKnown;
    assert.deepEqual(currentPlace(route, menu, known), { section: 'global', item }, route);
  }
});

test('currentPlace of Colors is Business, and the colours fallback page too; Licenses marks nothing', () => {
  assert.deepEqual(currentPlace('company/colors', menu, menuKnown), { section: 'company', item: 'colors' });
  assert.deepEqual(currentPlace('company/colors/fallback-colors', menu, menuKnown), { section: 'company', item: 'colors' });
  assert.deepEqual(currentPlace('licenses', menu, menuKnown), { section: null });
  assert.deepEqual(currentPlace('licenses/some-id', menu, menuKnown), { section: null });
});

test('currentPlace of Content, Apps and the app store is not the cog', () => {
  assert.deepEqual(currentPlace('pages', menu, menuKnown), { section: 'content', item: 'pages' });
  assert.deepEqual(currentPlace('list/pages', menu, menuKnown), { section: 'content', item: 'pages' });
  // "settings/appstore" starts with "settings" but is Apps › Find apps, and "settings" is matched exactly.
  assert.deepEqual(currentPlace('settings/appstore', menu, menuKnown), { section: 'apps', item: 'appstore' });
  assert.deepEqual(currentPlace('settings/appstore/x', menu, menuKnown), { section: 'apps', item: 'appstore' });
  assert.deepEqual(currentPlace('settings/other', menu, menuKnown), { section: null });
});

test('Business is a section: Logo and icon first, then its parts as rows, not the part Business itself', () => {
  const business = menu.find((entry) => entry.id === 'company');
  assert.deepEqual(
    business.items.map((i) => [i.id, i.href]),
    [
      ['logo', '#company/logo'],
      ['colors', '#company/colors'],
      ['contact', '#company/contact'],
      ['booking', '#company/booking'],
    ],
  );
  assert.deepEqual(currentPlace('company/contact', menu, menuKnown), { section: 'company', item: 'contact' });
  assert.deepEqual(currentPlace('company', menu, menuKnown), { section: 'company' });
});

test('currentPlace of Business › Logo and icon is that row', () => {
  assert.deepEqual(currentPlace('company/logo', menu, menuKnown), { section: 'company', item: 'logo' });
});

const appsGroups = [{ id: 'apps', title: 'Apps', ids: ['appstore', 'installed-connectors', 'installed-plugins', 'installed-themes'] }];
const appsHref = {
  appstore: '#settings/appstore',
  'installed-connectors': '#installed/connectors',
  'installed-plugins': '#installed/plugins',
  'installed-themes': '#appearance/themes',
};
const appsPartOf = (id) => ({ label: `L ${id}`, href: appsHref[id], count: null });
const appsTree = menuTree(appsGroups, appsPartOf, () => []);

test('the Apps section is Store, Connectors, Plugins and Themes, and no app installed', () => {
  const [section] = appsTree;
  assert.deepEqual(
    section.items.map((i) => i.id),
    ['appstore', 'installed-connectors', 'installed-plugins', 'installed-themes'],
  );
  assert.ok(section.items.every((i) => i.children === undefined));
});

test('the installed pages and the store select their own row; an app screen keeps the Apps section', () => {
  assert.deepEqual(currentPlace('installed/connectors', appsTree, known), { section: 'apps', item: 'installed-connectors' });
  assert.deepEqual(currentPlace('installed/plugins', appsTree, known), { section: 'apps', item: 'installed-plugins' });
  assert.deepEqual(currentPlace('appearance/themes', appsTree, known), { section: 'apps', item: 'installed-themes' });
  assert.deepEqual(currentPlace('appearance/themes/material', appsTree, known), { section: 'apps', item: 'installed-themes' });
  assert.deepEqual(currentPlace('settings/appstore', appsTree, known), { section: 'apps', item: 'appstore' });
  assert.deepEqual(currentPlace('settings/appstore/plugins', appsTree, known), { section: 'apps', item: 'appstore' });
  assert.deepEqual(currentPlace('apps/mailchimp', appsTree, known), { section: 'apps' });
  assert.deepEqual(currentPlace('apps', appsTree, known), { section: 'apps' });
});

const settingsIds = ['appearance', 'assistants', 'block-settings', 'caching', 'components', 'morpheme', 'privacy'];
const names = { settingsTitle: 'Settings', siteName: 'My site' };

test('backTarget goes to Settings for a Settings id and to the start screen for the rest', () => {
  for (const id of settingsIds) {
    assert.deepEqual(backTarget(id, settingsIds, names), { href: '#settings', label: 'Settings' });
  }
  assert.deepEqual(backTarget('pages', settingsIds, names), { href: '#', label: 'My site' });
  assert.deepEqual(backTarget('redirects', settingsIds, names), { href: '#', label: 'My site' });
});

test('placeOf names Settings for a Settings id and the section for the rest', () => {
  assert.equal(placeOf('morpheme', treeGroups, settingsIds, 'Settings'), 'Settings');
  assert.equal(placeOf('privacy', treeGroups, settingsIds, 'Settings'), 'Settings');
  assert.equal(placeOf('pages', treeGroups, settingsIds, 'Settings'), 'Content');
  assert.equal(placeOf('unknown', treeGroups, settingsIds, 'Settings'), undefined);
});
