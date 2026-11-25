import assert from 'node:assert/strict';
import { test } from 'node:test';
import { materialIconName, migrateIconNamesJson, migrateIconNamesMarkdown, migrateIconNamesPath } from './migrate-icons.mjs';

test('a Phosphor name becomes its Material Symbols name; brands, Material names and unknown names stay', () => {
  assert.equal(materialIconName('map-pin'), 'location_on');
  assert.equal(materialIconName('certificate'), 'workspace_premium');
  assert.equal(materialIconName('heart-fill'), 'favorite');
  assert.equal(materialIconName('github-logo'), 'github-logo');
  assert.equal(materialIconName('location_on'), 'location_on');
  assert.equal(materialIconName('my-own-icon'), 'my-own-icon');
});

test('a data file and an app.json: only the value of `icon` changes, written as the editor writes it', () => {
  const data =
    JSON.stringify({ title: 'certificate', items: [{ icon: 'certificate', text: 'map-pin' }, { icon: 'google-logo' }] }, null, 2) + '\n';
  const out = JSON.parse(migrateIconNamesJson(data));
  assert.deepEqual(out, { title: 'certificate', items: [{ icon: 'workspace_premium', text: 'map-pin' }, { icon: 'google-logo' }] });
  const same = '{ "icon": "workspace_premium" }';
  assert.equal(migrateIconNamesJson(same), same);
  assert.equal(migrateIconNamesJson('not json "icon"'), 'not json "icon"');
});

test('a page: the front matter and the props of a block; a code fence and a word of text stay', () => {
  const props = '{&quot;items&quot;:[{&quot;icon&quot;:&quot;map-pin&quot;,&quot;title&quot;:&quot;certificate&quot;}]}';
  const page = [
    '---',
    'title: A certificate',
    'icon: certificate',
    'cards:',
    '  - icon: "map-pin"',
    '---',
    'A map-pin and a certificate in text.',
    `<div data-block="list" data-props="${props}"></div>`,
    '```',
    `<div data-props="${props}"></div>`,
    '```',
    '',
  ].join('\n');
  const out = migrateIconNamesMarkdown(page);
  assert.match(out, /^icon: workspace_premium$/m);
  assert.match(out, /^ {2}- icon: "location_on"$/m);
  assert.match(out, /title: A certificate/);
  assert.match(out, /A map-pin and a certificate in text\./);
  assert.match(out, /data-block="list" data-props="[^"]*location_on/);
  assert.equal(out.split('```')[1].includes('location_on'), false);
  assert.equal(migrateIconNamesMarkdown(out), out);
  assert.equal(migrateIconNamesPath('a.css', 'icon: certificate'), 'icon: certificate');
});
