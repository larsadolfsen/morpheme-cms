import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { standardFileOf } from './standardFile.mjs';

const SETTINGS = 'src/data/standard-pages.json';
const FOLDER = 'src/content/pages';
const setting = (o) => ({ path: SETTINGS, text: JSON.stringify(o) });
const page = (name, front = '') => ({ path: `${FOLDER}/${name}.md`, text: `---\ntitle: "x"\n${front}---\nBody\n` });

test('the page is found by the address of the setting (the demo)', () => {
  const files = [setting({ privacy: '/privacy-policy/' }), page('contact'), page('privacy-policy')];
  assert.equal(standardFileOf(files, SETTINGS, FOLDER, 'privacy'), `${FOLDER}/privacy-policy.md`);
});

test('a page with its own path is found by it, not by its file name', () => {
  const files = [setting({ privacy: '/privacy/' }), page('privacy', 'path: "/other/"\n'), page('terms', 'path: "/privacy/"\n')];
  assert.equal(standardFileOf(files, SETTINGS, FOLDER, 'privacy'), `${FOLDER}/terms.md`);
});

test('a page named in Danish is found by its address', () => {
  const files = [setting({ privacy: '/privatlivspolitik/' }), page('privatlivspolitik')]; // language-ok: a Danish site's file name
  assert.equal(standardFileOf(files, SETTINGS, FOLDER, 'privacy'), `${FOLDER}/privatlivspolitik.md`); // language-ok: a Danish site's file name
});

test('no address in the setting, or no page with it, is undefined', () => {
  const files = [setting({ front: '/home/' }), page('privacy-policy')];
  assert.equal(standardFileOf(files, SETTINGS, FOLDER, 'privacy'), undefined);
  assert.equal(standardFileOf([setting({ privacy: '/gone/' }), page('privacy-policy')], SETTINGS, FOLDER, 'privacy'), undefined);
  assert.equal(standardFileOf([page('privacy-policy')], SETTINGS, FOLDER, 'privacy'), undefined);
  assert.equal(standardFileOf([{ path: SETTINGS, text: 'nope' }, page('privacy-policy')], SETTINGS, FOLDER, 'privacy'), undefined);
});
