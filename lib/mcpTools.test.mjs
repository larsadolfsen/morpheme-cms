// Tests for lib/mcpTools.mjs: the read-only tools an assistant calls (site_info, list_content, read_content, list_apps,
// read_app_settings) over a site played by a map of files.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createTools } from './mcpTools.mjs';

const page = (title, extra = '', body = 'Hello.') => `---\ntitle: "${title}"\n${extra}---\n\n# ${title}\n\n${body}\n`;
const FILES = {
  'src/content/pages/about.md': page('About us'),
  'src/content/pages/secret-plan.md': page('Secret plan', 'status: draft\n'),
  'src/content/pages/offers.md': page(
    'Offers',
    'path: "/our-offers/"\nstatus: scheduled\npublishAt: "2099-01-01T08:00"\n',
    'Text\n\n<div data-block="buttons" data-props="{&quot;items&quot;:[{&quot;text&quot;:&quot;Go&quot;}]}"></div>\n',
  ),
  'src/content/blog/first-post.md': page('First post', 'date: 2026-10-01\n'),
  'src/content/blog/hidden.md': page('Hidden post', 'date: 2026-10-02\nstatus: unlisted\n'),
  'src/content/pages/not-markdown.txt': 'x',
  'src/data/theme.json': '{"theme":"material"}',
  'src/data/apps.json': '{"installed":["calendly","mailchimp"],"off":["mailchimp"]}',
  'src/apps/calendly/app.json': JSON.stringify({
    label: 'Calendly',
    version: '1.2.0',
    settings: {
      fields: [
        { name: 'url', type: 'string' },
        { name: 'apiToken', type: 'string', secret: true },
        { name: 'color', type: 'string' },
      ],
      values: { url: 'https://calendly.com/default', color: 'blue', apiToken: 'default-token' },
    },
  }),
  'src/apps/mailchimp/app.json': JSON.stringify({ label: 'Mailchimp', version: '0.3.1' }),
  'src/data/apps/calendly.json': '{"url":"https://calendly.com/me","apiToken":"abc","webhookSecret":"zzz","password":"pw"}',
};

const site = (files = FILES, extra = {}) => ({
  config: {
    name: 'Demo',
    domain: 'demo.example',
    siteDescription: 'A demo.',
    locale: 'en-US',
    repo: { owner: 'o', name: 'n', branch: 'main' },
    folders: { pages: 'src/content/pages', blog: 'src/content/blog' },
    apps: { installed: 'src/data/apps.json', settings: 'src/data/apps', folder: 'src/apps' },
    theme: 'src/data/theme.json',
  },
  files: async (folders) =>
    Object.keys(files)
      .filter((p) => folders.some((f) => p.startsWith(`${f}/`)))
      .map((path) => ({ path, oid: path })),
  texts: async (oids) => new Map(oids.map((oid) => [oid, files[oid] ?? undefined])),
  ...extra,
});

const run = async (name, args = {}, files) => {
  const { call } = createTools(site(files));
  return call(name, args);
};

test('lists exactly the five read tools, all read-only, each with an input schema', () => {
  const { tools } = createTools(site());
  assert.deepEqual(
    tools.map((t) => t.name),
    ['site_info', 'list_content', 'read_content', 'list_apps', 'read_app_settings'],
  );
  for (const t of tools) {
    assert.equal(t.annotations.readOnlyHint, true, t.name);
    assert.equal(t.inputSchema.type, 'object', t.name);
    assert.ok(t.description.length > 60, t.name);
  }
  const text = (n) => tools.find((t) => t.name === n).description;
  assert.match(text('site_info'), /list_content/);
  assert.match(text('site_info'), /list_apps/);
  assert.match(text('list_content'), /read_content/);
  assert.match(text('read_content'), /list_content/);
  assert.match(text('list_apps'), /read_app_settings/);
  assert.match(text('read_app_settings'), /list_apps/);
});

test('instructions name the tool for each question, and site_info points to the list tools', async () => {
  const { instructions } = createTools(site());
  for (const name of ['site_info', 'list_content', 'read_content', 'list_apps', 'read_app_settings'])
    assert.ok(instructions.includes(name), name);
  const { data } = await run('site_info');
  assert.match(data.next, /list_content/);
  assert.match(data.next, /list_apps/);
});

test('site_info: name, language, theme, counts and the repository', async () => {
  const { data } = await run('site_info');
  assert.equal(data.name, 'Demo');
  assert.equal(data.language, 'en-US');
  assert.equal(data.theme, 'material');
  assert.equal(data.pages, 3);
  assert.equal(data.posts, 2);
  assert.deepEqual(data.apps, { installed: 2, active: 1 });
  assert.equal(data.repository, 'o/n');
  assert.equal(data.services, undefined);
});

test('site_info: the service status, when the Worker has it; a failing status is left out', async () => {
  const status = { state: 'ok' };
  const withStatus = createTools(site(FILES, { status: async () => status }));
  assert.deepEqual((await withStatus.call('site_info', {})).data.services, status);
  const failing = createTools(site(FILES, { status: async () => Promise.reject(new Error('x')) }));
  assert.equal((await failing.call('site_info', {})).data.services, undefined);
});

test('site_info: no theme file, no apps file', async () => {
  const { data } = await run('site_info', {}, { 'src/content/pages/a.md': page('A') });
  assert.equal(data.theme, null);
  assert.deepEqual(data.apps, { installed: 0, active: 0 });
});

test('list_content: pages and posts with address, title, status and language', async () => {
  const { data } = await run('list_content');
  assert.equal(data.total, 5);
  const by = Object.fromEntries(data.items.map((i) => [i.title, i]));
  assert.deepEqual(by['About us'], {
    kind: 'page',
    address: '/about/',
    title: 'About us',
    status: 'published',
    language: 'en-US',
    file: 'src/content/pages/about.md',
  });
  assert.equal(by['Offers'].address, '/our-offers/');
  assert.equal(by['Offers'].status, 'scheduled');
  assert.equal(by['Offers'].publishAt, '2099-01-01T08:00');
  assert.equal(by['First post'].kind, 'post');
  assert.equal(by['First post'].address, '/first-post/');
  assert.equal(by['First post'].date, '2026-10-01');
  assert.equal(by['Hidden post'].status, 'published');
});

test('list_content: filters by kind, status and text; limit is respected and total says how many matched', async () => {
  assert.deepEqual((await run('list_content', { kind: 'post' })).data.items.map((i) => i.title).sort(), ['First post', 'Hidden post']);
  assert.deepEqual(
    (await run('list_content', { status: 'draft' })).data.items.map((i) => i.title),
    ['Secret plan'],
  );
  assert.deepEqual(
    (await run('list_content', { text: 'OFFERS' })).data.items.map((i) => i.title),
    ['Offers'],
  );
  assert.deepEqual(
    (await run('list_content', { text: 'our-offers' })).data.items.map((i) => i.title),
    ['Offers'],
  );
  const limited = (await run('list_content', { limit: 2 })).data;
  assert.equal(limited.items.length, 2);
  assert.equal(limited.total, 5);
});

test('list_content: bad filters are errors the assistant can read', async () => {
  assert.match((await run('list_content', { kind: 'video' })).error, /kind/);
  assert.match((await run('list_content', { status: 'gone' })).error, /status/);
  assert.match((await run('list_content', { limit: 0 })).error, /limit/);
  assert.match((await run('list_content', { limit: 'ten' })).error, /limit/);
});

test('read_content: the fields, the text and the blocks of a page by its address or its file', async () => {
  const byAddress = (await run('read_content', { address: '/our-offers/' })).data;
  assert.equal(byAddress.kind, 'page');
  assert.equal(byAddress.fields.title, 'Offers');
  assert.equal(byAddress.fields.status, 'scheduled');
  assert.match(byAddress.body, /^\n?# Offers/);
  assert.deepEqual(byAddress.blocks, [{ type: 'buttons', props: { items: [{ text: 'Go' }] } }]);
  const byFile = (await run('read_content', { file: 'src/content/blog/first-post.md' })).data;
  assert.equal(byFile.kind, 'post');
  assert.equal(byFile.address, '/first-post/');
  assert.deepEqual(byFile.blocks, []);
  const slashless = (await run('read_content', { address: 'about' })).data;
  assert.equal(slashless.fields.title, 'About us');
});

test('read_content: not found, no argument and a file outside the content are errors', async () => {
  assert.match((await run('read_content', { address: '/nope/' })).error, /No page or post/);
  assert.match((await run('read_content', {})).error, /address or file/);
  assert.match((await run('read_content', { file: 'src/data/apps.json' })).error, /No page or post/);
  assert.match((await run('read_content', { file: '../../etc/passwd' })).error, /No page or post/);
});

test('list_apps: id, name, version and on or off; no settings', async () => {
  const { data } = await run('list_apps');
  assert.deepEqual(data.apps, [
    { id: 'calendly', name: 'Calendly', version: '1.2.0', on: true },
    { id: 'mailchimp', name: 'Mailchimp', version: '0.3.1', on: false },
  ]);
  assert.ok(!JSON.stringify(data).includes('abc'));
});

test('read_app_settings: saved values over defaults, never a secret field', async () => {
  const { data } = await run('read_app_settings', { app: 'calendly' });
  assert.equal(data.app, 'calendly');
  assert.deepEqual(data.settings, { url: 'https://calendly.com/me', color: 'blue' });
  assert.equal(data.hidden, 3);
  const text = JSON.stringify(data);
  for (const leak of ['abc', 'zzz', 'pw', 'default-token']) assert.ok(!text.includes(leak), leak);
});

test('read_app_settings: an app that is not installed, a bad id and a missing id are errors', async () => {
  assert.match((await run('read_app_settings', { app: 'other' })).error, /not installed/);
  assert.match((await run('read_app_settings', { app: '../x' })).error, /not installed/);
  assert.match((await run('read_app_settings', {})).error, /app/);
});

test('an unknown tool is not a tool', async () => {
  assert.equal(await run('save_draft', {}), undefined);
});
