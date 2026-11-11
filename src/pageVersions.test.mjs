// Tests of src/pageVersions.mjs.
import assert from 'node:assert/strict';
import test from 'node:test';
import { publish, schedule } from '../lib/versions.mjs';
import { commitChanges, pageOf, versionsFor } from './pageVersions.mjs';

const file = (path, text = '---\ntitle: "T"\n---\n', oid = `oid-${path}`) => ({ path, oid, text });
const PAGE = file('src/content/pages/about.md');
const files = [
  PAGE,
  file('src/content/pages/company.md'),
  file('src/content/pages/company/team.md'),
  file('src/drafts/pages/about.md', '---\ntitle: "New"\n---\n'),
  file('src/drafts/pages/about/campaign.md', '---\ntitle: "C"\npublishAt: "2026-12-01T08:00"\n---\n'),
  file('src/drafts/pages/company/team.md', '---\ntitle: "Team v2"\n---\n'),
];

test('pageOf collects the waiting versions of one page and not those of another', () => {
  const page = pageOf(files, PAGE);
  assert.deepEqual(Object.keys(page.drafts).sort(), ['campaign', 'waiting']);
  const team = pageOf(files, files[2]);
  assert.deepEqual(Object.keys(team.drafts), ['waiting']);
  assert.deepEqual(pageOf(files, files[1]).drafts, {});
});

test('versionsFor lists the page file and its waiting versions', () => {
  assert.deepEqual(versionsFor(files, PAGE), [
    { id: 'live', state: 'live' },
    { id: 'waiting', state: 'waiting' },
    { id: 'campaign', state: 'waiting', publishAt: '2026-12-01T08:00' },
  ]);
});

test('commitChanges gives the page file with its blob id, a new file with none, and a delete only of a file that is there', () => {
  const changes = commitChanges(publish(pageOf(files, PAGE)), files);
  assert.deepEqual(changes, [
    { path: PAGE.path, content: '---\ntitle: "New"\n---\n', oid: PAGE.oid },
    { path: 'src/drafts/pages/about.md', content: null, oid: 'oid-src/drafts/pages/about.md' },
  ]);
  const created = commitChanges(schedule({ path: files[1].path, text: files[1].text }, '2026-12-01T08:00'), files);
  assert.equal(created.length, 1);
  assert.equal(created[0].oid, null);
  assert.deepEqual(commitChanges([{ path: 'src/drafts/pages/none.md', text: null }], files), []);
});
