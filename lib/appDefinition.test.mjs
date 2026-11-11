// Tests for lib/appDefinition.mjs: an app's definition from app.json, the code parts of editor.ts and texts.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { consentCategoriesOf, definitionOf } from './appDefinition.mjs';

const base = { api: 4, label: 'Colors', publisher: 'Morpheme', license: 'MIT', icon: 'Palette', hint: 'Colors.', version: '1.0.0' };
const cookie = { name: '_ga', provider: 'Google', purpose: 'Counts visits.', duration: '2 years', category: 'statistics' };

test('copies the data keys and leaves the icon a name', () => {
  const manifest = {
    ...base,
    description: 'More.',
    category: 'analytics',
    keywords: ['stats'],
    releaseNotes: { '1.0.0': 'First.' },
    screenshots: [{ file: 'a.jpg', label: 'A' }],
    lists: [{ id: 'prices', icon: 'Tag' }],
    thirdParty: [{ name: 'X', license: 'MIT', url: 'https://x.example' }],
    settings: { fields: [{ name: 'id', type: 'text' }], values: { id: '' }, example: { id: 'G-1' } },
  };
  const def = definitionOf(manifest, undefined, undefined);
  for (const key of ['label', 'publisher', 'license', 'icon', 'hint', 'version', 'description', 'category', 'keywords']) {
    assert.deepEqual(def[key], manifest[key], key);
  }
  assert.equal(def.icon, 'Palette');
  assert.deepEqual(def.releaseNotes, manifest.releaseNotes);
  assert.deepEqual(def.screenshots, manifest.screenshots);
  assert.deepEqual(def.lists, manifest.lists);
  assert.deepEqual(def.thirdParty, manifest.thirdParty);
  assert.deepEqual(def.settings, manifest.settings);
});

test('leaves out what only the build reads, and has no thirdParty list without one in app.json', () => {
  const def = definitionOf(
    { ...base, csp: { 'script-src': ['https://a.example'] }, reads: ['pages'], hooks: [], afterBuild: false },
    undefined,
    undefined,
  );
  for (const key of ['api', 'csp', 'reads', 'hooks', 'afterBuild', 'cookies', 'settings', 'kinds', 'page', 'texts']) {
    assert.equal(key in def, false, key);
  }
  assert.deepEqual(def.thirdParty, []);
});

test('merges the code parts of editor.ts', () => {
  const page = () => null;
  const screens = { more: { title: 'More', page } };
  const tabs = { cookies: { label: 'Problems', icon: 'x', page } };
  const notifications = { types: { a: 'A' }, check: async () => [] };
  const slots = { versionSwitch: () => null };
  const def = definitionOf(base, { page, screens, tabs, slots, notifications }, undefined);
  assert.equal(def.page, page);
  assert.equal(def.slots, slots);
  assert.equal(def.screens, screens);
  assert.equal(def.tabs, tabs);
  assert.equal(def.notifications, notifications);
});

test('puts settings.changedTo from editor.ts over the settings of app.json', () => {
  const changedTo = async () => 'x';
  const settings = { fields: [], values: { a: 1 } };
  assert.equal(definitionOf({ ...base, settings }, { settings: { changedTo } }, undefined).settings.changedTo, changedTo);
  assert.deepEqual(definitionOf({ ...base, settings }, { settings: { changedTo } }, undefined).settings.values, { a: 1 });
  // Without settings in app.json, the editor's changedTo has nothing to belong to.
  assert.equal('settings' in definitionOf(base, { settings: { changedTo } }, undefined), false);
  assert.equal('changedTo' in definitionOf({ ...base, settings }, {}, undefined).settings, false);
});

test('merges the kinds of app.json with the draw of editor.ts, by list', () => {
  const draw = () => null;
  const kinds = { popups: { label: 'Popup', icon: 'Browser', omit: ['image'] }, posts: { label: 'Post', icon: 'Article' } };
  const def = definitionOf({ ...base, kinds }, { kinds: { popups: { draw }, other: { draw } } }, undefined);
  assert.deepEqual(Object.keys(def.kinds), ['popups', 'posts']);
  assert.deepEqual(def.kinds.popups, { label: 'Popup', icon: 'Browser', omit: ['image'], draw });
  assert.deepEqual(def.kinds.posts, kinds.posts);
  assert.equal(kinds.popups.draw, undefined, 'does not change app.json');
});

test('cookies gives the categories of cookiesFor, each once, without necessary', () => {
  const manifest = {
    ...base,
    settings: {
      fields: [
        { name: 'id', type: 'text' },
        { name: 'ads', type: 'text' },
      ],
      values: {},
    },
    cookies: [
      cookie,
      { ...cookie, name: '_gid' },
      { ...cookie, name: 'session', category: 'necessary' },
      { ...cookie, name: '_ads', category: 'marketing', when: { setting: 'ads' } },
    ],
  };
  const { cookies } = definitionOf(manifest, undefined, undefined);
  assert.deepEqual(cookies({}), ['statistics']);
  assert.deepEqual(cookies({ ads: 'AW-1' }), ['statistics', 'marketing']);
  assert.deepEqual(consentCategoriesOf(manifest, { ads: 'AW-1' }), ['statistics', 'marketing']);
});

test('has no cookies function without cookies to ask about, and says each cookie on the page of the app', () => {
  assert.equal('cookies' in definitionOf(base, undefined, undefined), false);
  assert.equal('cookies' in definitionOf({ ...base, cookies: [] }, undefined, undefined), false);
  const necessary = definitionOf({ ...base, cookies: [{ ...cookie, category: 'necessary' }] }, undefined, undefined);
  assert.equal('cookies' in necessary, false, 'a necessary cookie is not asked about');
  assert.equal(necessary.cookieList.length, 1);
  const def = definitionOf({ ...base, cookies: [cookie] }, undefined, undefined);
  assert.deepEqual(def.cookieList, [
    { name: '_ga', provider: 'Google', purpose: 'Counts visits.', lasts: '2 years', category: 'statistics' },
  ]);
});

test('attaches the texts as they are given', () => {
  const texts = { 'da-DK': { Colors: 'colors in Danish' } };
  assert.equal(definitionOf(base, undefined, texts).texts, texts);
});
