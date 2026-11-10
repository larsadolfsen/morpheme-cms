// Tests lib/menu.mjs: which item is open for a route,
// the two-level tree (menuTree), and which section/item/child is open for a route (currentPlace).
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentPart, menuTree, currentPlace, placeOf, backTarget } from './menu.mjs';

const known = {
  lists: ['testimonials', 'cookies', 'priser'],
  header: ['menu', 'mobile-menu', 'header-button'],
  partScreens: ['privacy'],
  cookies: 'cookies',
  store: 'settings/appstore',
  settings: ['appearance', 'developer', 'licenses', 'morpheme', 'privacy'],
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
      ? [{ id: 'priser', label: 'Prices', href: '#list/priser' }]
      : [];
const tree = menuTree(treeGroups, treePartOf, treeChildren);

test('an open collection is its own item', () => {
  assert.equal(currentPart('src/content/pages/om.md', { ...known, open: 'pages' }), 'pages');
  assert.equal(currentPart('list/blog', { ...known, open: 'blog' }), 'blog');
});

test('a short list is under Lists', () => {
  assert.equal(currentPart('list/testimonials', known), 'lists');
  assert.equal(currentPart('new/testimonials', known), 'lists');
  assert.equal(currentPart('deleted/priser', known), 'lists');
  assert.equal(currentPart('src/data/prices/a.json', { ...known, open: 'priser' }), 'lists');
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
  assert.equal(currentPart('appearance/colors', known), 'appearance');
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
  assert.equal(currentPart('developer', known), 'developer');
  assert.equal(currentPart('developer/parts/editor', known), 'developer');
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
  assert.deepEqual(currentPlace('list/priser', tree, known), { section: 'content', item: 'lists', child: 'priser' });
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
  { id: 'company', title: 'Business', ids: ['logo', 'company'] },
  { id: 'blocks', title: 'Blocks', ids: ['blocks', 'block-settings'] },
  { id: 'apps', title: 'Apps', ids: ['apps', 'appstore'] },
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
  'block-settings': '#block-settings',
  logo: '#company/logo',
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
    ['home', 'content', 'company', 'blocks', 'apps'],
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

test('Find apps is the first item under Apps, then the apps installed', () => {
  assert.deepEqual(
    menu[4].items.map((i) => i.id),
    ['appstore', 'calendly'],
  );
});

test('Analytics, SEO, the SEO rating, Licenses, System status and the Settings rows are not in the menu', () => {
  for (const gone of ['analytics', 'seo', 'rating', 'licenses', 'status', 'appearance', 'privacy', 'developer', 'morpheme']) {
    assert.equal(allIds.includes(gone), false);
  }
  for (const gone of ['#analytics', '#seo', '#seo/rating', '#licenses', '#status', '#appearance', '#privacy', '#developer', '#morpheme']) {
    assert.equal(allHrefs.includes(gone), false);
  }
});

test('currentPlace of a page being edited, a list, the SEO rating, an app and Find apps', () => {
  assert.deepEqual(currentPlace('list/pages/app-store', menu, menuKnown), { section: 'content', item: 'pages' });
  assert.deepEqual(currentPlace('src/content/pages/om.md', menu, { ...menuKnown, open: 'pages' }), { section: 'content', item: 'pages' });
  assert.deepEqual(currentPlace('seo/redirects/all', menu, menuKnown), {
    section: 'content',
    item: 'redirects',
    child: 'all',
  });
  assert.deepEqual(currentPlace('seo/internal-links', menu, menuKnown), { section: 'content', item: 'internal-links' });
  assert.deepEqual(currentPlace('seo/rating', menu, menuKnown), { section: null });
  assert.deepEqual(currentPlace('apps/calendly', menu, menuKnown), { section: 'apps', item: 'calendly' });
  assert.deepEqual(currentPlace('apps/mailchimp', menu, menuKnown), { section: 'apps' });
  assert.deepEqual(currentPlace('settings/appstore', menu, menuKnown), { section: 'apps', item: 'appstore' });
});

test('currentPlace of the Settings screen is the cog, with no section and no item', () => {
  assert.deepEqual(currentPlace('settings', menu, menuKnown), { section: null, settings: true });
});

test('currentPlace of a route under a Settings id is the cog', () => {
  const cog = { section: null, settings: true };
  for (const route of [
    'appearance',
    'appearance/colors',
    'appearance/header',
    'appearance/footer',
    'appearance/theme-store',
    'appearance/themes/material',
    'appearance/colors/fallback-colors',
    'appearance/default-pages',
    'developer',
    'developer/caching',
    'developer/parts',
    'developer/parts/editor',
    'licenses',
    'licenses/some-id',
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
  // A file open from a Settings screen: the header menus, the cookie list.
  assert.deepEqual(currentPlace('src/data/menu.json', menu, { ...menuKnown, open: 'menu' }), cog);
  assert.deepEqual(currentPlace('list/mobile-menu', menu, menuKnown), cog);
  assert.deepEqual(currentPlace('src/data/cookie-list/a.json', menu, { ...menuKnown, open: 'cookies' }), cog);
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

const appsGroups = [{ id: 'apps', title: 'Apps', ids: ['apps', 'appstore'] }];
const appsPartOf = (id) => ({ label: `L ${id}`, href: id === 'appstore' ? '#settings/appstore' : '#apps', count: null });
const appsOf = (list) => (id) => (id === 'apps' ? list.map((a) => ({ id: a, label: `A ${a}`, href: `#apps/${a}` })) : []);

test('the Apps section lists Appstore, then each installed app, and not the apps list', () => {
  const [section] = menuTree(appsGroups, appsPartOf, appsOf(['mailchimp', 'mobilepay']));
  assert.deepEqual(
    section.items.map((i) => i.id),
    ['appstore', 'mailchimp', 'mobilepay'],
  );
  assert.equal(section.items[1].href, '#apps/mailchimp');
  assert.equal(section.items[1].count, null);
  assert.ok(section.items.every((i) => i.children === undefined));
});

test('the Apps section with no apps installed lists Appstore only', () => {
  const [section] = menuTree(appsGroups, appsPartOf, appsOf([]));
  assert.deepEqual(
    section.items.map((i) => i.id),
    ['appstore'],
  );
});

test('an app screen selects its row; the apps list and Appstore keep the Apps section', () => {
  const appsTree = menuTree(appsGroups, appsPartOf, appsOf(['mailchimp', 'mobilepay']));
  assert.deepEqual(currentPlace('apps/mailchimp', appsTree, known), { section: 'apps', item: 'mailchimp' });
  assert.deepEqual(currentPlace('apps', appsTree, known), { section: 'apps' });
  assert.deepEqual(currentPlace('settings/appstore', appsTree, known), { section: 'apps', item: 'appstore' });
});

const settingsIds = ['appearance', 'developer', 'licenses', 'morpheme', 'privacy'];
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
