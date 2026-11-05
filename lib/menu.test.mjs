// Tests lib/menu.mjs: which item is open for a route,
// the two-level tree (menuTree), and which section/item/child is open for a route (currentPlace).
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentPart, menuTree, currentPlace } from './menu.mjs';

const known = {
  lists: ['udtalelser', 'cookies', 'priser'],
  header: ['menu', 'mobile-menu', 'headerknap'],
  partScreens: ['privacy'],
  cookies: 'cookies',
  store: 'settings/appstore',
};

const treeGroups = [
  { id: 'home', title: 'Home', href: '#', ids: [] },
  { id: 'indhold', title: 'Content', ids: ['pages', 'lists', 'redirects'] },
  { id: 'appearance', title: 'Appearance', ids: ['appearance/farver', 'appearance/logo'] },
];
const treePartOf = (id) => ({ label: `L ${id}`, href: `#${id === 'redirects' ? 'seo/redirects' : id}`, count: null });
const treeChildren = (id) =>
  id === 'redirects'
    ? [
        { id: 'alle', label: 'All', href: '#seo/redirects/alle' },
        { id: 'ikke-fundet', label: 'Not found', href: '#seo/redirects/ikke-fundet' },
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
  assert.equal(currentPart('list/udtalelser', known), 'lists');
  assert.equal(currentPart('ny/udtalelser', known), 'lists');
  assert.equal(currentPart('slettet/priser', known), 'lists');
  assert.equal(currentPart('src/data/prices/a.json', { ...known, open: 'priser' }), 'lists');
});

test('the cookie list is under Privacy, whatever the way to it', () => {
  assert.equal(currentPart('list/cookies', known), 'privacy');
  assert.equal(currentPart('list/cookies/cookiescanner', known), 'privacy');
  assert.equal(currentPart('ny/cookies', known), 'privacy');
  assert.equal(currentPart('slettet/cookies', known), 'privacy');
  assert.equal(currentPart('src/data/cookie-list/a.json', { ...known, open: 'cookies' }), 'privacy');
});

test('the menus are under Header', () => {
  assert.equal(currentPart('src/data/menu.json', { ...known, open: 'menu' }), 'header');
  assert.equal(currentPart('list/mobile-menu', known), 'header');
  assert.equal(currentPart('src/data/header.json', { ...known, open: 'headerknap' }), 'header');
});

test('a screen under a part is that part', () => {
  assert.equal(currentPart('company', known), 'company');
  assert.equal(currentPart('company/betaling/mobilepay', known), 'company');
  assert.equal(currentPart('blocks', known), 'blocks');
  assert.equal(currentPart('blocks/hero', known), 'blocks');
  assert.equal(currentPart('appearance/farver', known), 'appearance');
  assert.equal(currentPart('seo/redirects', known), 'seo');
  assert.equal(currentPart('apps/calendly', known), 'apps');
  assert.equal(currentPart('apps/calendly/settings', known), 'apps');
});

test('Block settings is not under Block templates, and a longer name is not under a shorter one', () => {
  assert.equal(currentPart('block-settings', known), 'block-settings');
  assert.equal(currentPart('appsx', known), 'appsx');
});

test('the screens with parts, and their parts, are the screen', () => {
  assert.equal(currentPart('privacy', known), 'privacy');
  assert.equal(currentPart('privacy/cookiebanner', known), 'privacy');
});

test('the app store, and its themes, are Find apps', () => {
  assert.equal(currentPart('settings/appstore', known), 'appstore');
  assert.equal(currentPart('settings/appstore/temaer', known), 'appstore');
});

test('a screen of its own is itself, and the start screen is none', () => {
  assert.equal(currentPart('advanced', known), 'advanced');
  assert.equal(currentPart('licenser', known), 'licenser');
  assert.equal(currentPart('', known), '');
});

test('menuTree keeps the groups in the order written', () => {
  assert.deepEqual(
    tree.map((e) => e.id),
    ['home', 'indhold', 'appearance'],
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
  assert.deepEqual(currentPlace('seo/redirects/alle', tree, known), { section: 'indhold', item: 'redirects', child: 'alle' });
});

test('currentPlace finds a list as a child of Lists', () => {
  assert.deepEqual(currentPlace('list/priser', tree, known), { section: 'indhold', item: 'lists', child: 'priser' });
});

test('currentPlace finds an item by its href', () => {
  assert.deepEqual(currentPlace('seo/redirects', tree, known), { section: 'indhold', item: 'redirects' });
});

test('currentPlace finds a screen under an item', () => {
  assert.deepEqual(currentPlace('appearance/farver/tekst', tree, known), { section: 'appearance', item: 'appearance/farver' });
});

test('currentPlace falls back to currentPart', () => {
  assert.deepEqual(currentPlace('rediger/pages/app-store', tree, { ...known, open: 'pages' }), { section: 'indhold', item: 'pages' });
});

test('currentPlace gives no section for an unknown route', () => {
  assert.deepEqual(currentPlace('ukendt', tree, known), { section: null });
});

test('currentPlace gives the section of a screen that is a section itself', () => {
  assert.deepEqual(currentPlace('appearance', tree, known), { section: 'appearance' });
});

// The menu as defaults/editor.ts `groups` writes it, with the hrefs the editor gives.
const menuGroups = [
  { id: 'home', title: 'Home', href: '#', ids: [] },
  {
    id: 'indhold',
    title: 'Content',
    ids: ['pages', 'blog', 'lists', 'popups', 'tags', 'files', 'interne-links', 'redirects'],
  },
  { id: 'globalt', title: 'Global', ids: ['header', 'footer', 'company'] },
  { id: 'apps', title: 'Apps', ids: ['apps', 'appstore'] },
  { id: 'blocks', title: 'Blocks', ids: ['blocks', 'block-settings'] },
  { id: 'appearance', title: 'Appearance', ids: ['farver', 'logo'] },
  { id: 'privacy', title: 'Privacy', ids: ['cookiebanner', 'cookies'] },
  { id: 'settings', title: 'Settings', ids: ['advanced'] },
];
const hrefs = {
  pages: '#list/pages',
  blog: '#list/blog',
  lists: '#lists',
  popups: '#list/popups',
  tags: '#list/tags',
  files: '#files',
  'interne-links': '#seo/interne-links',
  redirects: '#seo/redirects',
  header: '#appearance/header',
  footer: '#appearance/footer',
  company: '#company',
  apps: '#apps',
  appstore: '#settings/appstore',
  blocks: '#blocks',
  'block-settings': '#block-settings',
  farver: '#appearance/farver',
  logo: '#appearance/logo',
  cookiebanner: '#privacy/cookiebanner',
  cookies: '#list/cookies',
  advanced: '#advanced',
};
const menu = menuTree(
  menuGroups,
  (id) => ({ label: id, href: hrefs[id], count: null }),
  (id) =>
    id === 'redirects'
      ? [
          { id: 'alle', label: 'All', href: '#seo/redirects/alle' },
          { id: 'ikke-fundet', label: 'Not found', href: '#seo/redirects/ikke-fundet' },
        ]
      : id === 'apps'
        ? [{ id: 'calendly', label: 'Calendly', href: '#apps/calendly' }]
        : [],
);
const menuKnown = { ...known, store: 'settings/appstore' };
const allIds = menu.flatMap((e) => e.items.flatMap((i) => [i.id, ...(i.children ?? []).map((c) => c.id)]));
const allHrefs = menu.flatMap((e) => e.items.flatMap((i) => [i.href, ...(i.children ?? []).map((c) => c.href)]));

test('the menu has the eight sections in order', () => {
  assert.deepEqual(
    menu.map((e) => e.id),
    ['home', 'indhold', 'globalt', 'apps', 'blocks', 'appearance', 'privacy', 'settings'],
  );
});

test('Content holds Internal links and Redirects after the files, in order', () => {
  assert.deepEqual(
    menu[1].items.map((i) => i.id),
    ['pages', 'blog', 'lists', 'popups', 'tags', 'files', 'interne-links', 'redirects'],
  );
});

test('Redirects has All and Not found as children', () => {
  const redirects = menu[1].items.find((i) => i.id === 'redirects');
  assert.deepEqual(
    redirects.children.map((c) => c.href),
    ['#seo/redirects/alle', '#seo/redirects/ikke-fundet'],
  );
});

test('Find apps is the first item under Apps, then the apps installed, and Advanced the only one under Settings', () => {
  assert.deepEqual(
    menu[3].items.map((i) => i.id),
    ['appstore', 'calendly'],
  );
  assert.deepEqual(
    menu[7].items.map((i) => i.id),
    ['advanced'],
  );
});

test('Analytics, SEO, the SEO rating and Licenses are not in the menu', () => {
  for (const gone of ['analytics', 'seo', 'vurdering', 'licenser']) {
    assert.equal(allIds.includes(gone), false);
  }
  for (const gone of ['#analytics', '#seo', '#seo/vurdering', '#licenser']) {
    assert.equal(allHrefs.includes(gone), false);
  }
});

test('currentPlace of a page being edited, a list, the SEO rating, an Appearance screen, an app, Find apps and Privacy', () => {
  assert.deepEqual(currentPlace('list/pages/app-store', menu, menuKnown), { section: 'indhold', item: 'pages' });
  assert.deepEqual(currentPlace('src/content/pages/om.md', menu, { ...menuKnown, open: 'pages' }), { section: 'indhold', item: 'pages' });
  assert.deepEqual(currentPlace('seo/redirects/alle', menu, menuKnown), {
    section: 'indhold',
    item: 'redirects',
    child: 'alle',
  });
  assert.deepEqual(currentPlace('seo/interne-links', menu, menuKnown), { section: 'indhold', item: 'interne-links' });
  assert.deepEqual(currentPlace('seo/vurdering', menu, menuKnown), { section: null });
  assert.deepEqual(currentPlace('appearance/farver', menu, menuKnown), { section: 'appearance', item: 'farver' });
  assert.deepEqual(currentPlace('apps/calendly', menu, menuKnown), { section: 'apps', item: 'calendly' });
  assert.deepEqual(currentPlace('apps/mailchimp', menu, menuKnown), { section: 'apps' });
  assert.deepEqual(currentPlace('settings/appstore/temaer', menu, menuKnown), { section: 'apps', item: 'appstore' });
  assert.deepEqual(currentPlace('privacy/cookiebanner', menu, menuKnown), { section: 'privacy', item: 'cookiebanner' });
  assert.deepEqual(currentPlace('src/data/cookie-list/a.json', menu, { ...menuKnown, open: 'cookies' }), { section: 'privacy' });
});

test('currentPlace of Appearance › Header and its menus is Global › Header', () => {
  assert.deepEqual(currentPlace('appearance/header', menu, menuKnown), { section: 'globalt', item: 'header' });
  assert.deepEqual(currentPlace('src/data/menu.json', menu, { ...menuKnown, open: 'menu' }), { section: 'globalt', item: 'header' });
});

test('currentPlace of Appearance › Footer is Global › Footer, a row without children', () => {
  assert.deepEqual(currentPlace('appearance/footer', menu, menuKnown), { section: 'globalt', item: 'footer' });
  const global = menu.find((entry) => entry.id === 'globalt');
  assert.equal(global.items.find((item) => item.id === 'footer').children, undefined);
  assert.equal(global.items.find((item) => item.id === 'header').children, undefined);
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
