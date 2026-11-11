// Tests of lib/versions.mjs: the paths of the versions and the functions that publish, schedule, unpublish and discard them.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  discard,
  draftPath,
  due,
  isVersionId,
  migrateScheduled,
  pageOf,
  publish,
  published,
  saveDraft,
  schedule,
  timeOf,
  unpublish,
  versionsOf,
} from './versions.mjs';

const PATH = 'src/content/pages/about.md';
const live = '---\ntitle: "About"\n---\n\nLive text.\n';
const draft = '---\ntitle: "About us"\n---\n\nNew text.\n';
const off = '---\ntitle: "About"\nstatus: "draft"\n---\n\nText.\n';

test('draftPath: the waiting version is the page file in src/drafts, other ids a file in its folder', () => {
  assert.equal(draftPath(PATH), 'src/drafts/pages/about.md');
  assert.equal(draftPath(PATH, 'campaign'), 'src/drafts/pages/about/campaign.md');
  assert.equal(draftPath('src/content/blog/a/b.md'), 'src/drafts/blog/a/b.md');
  assert.throws(() => draftPath(PATH, 'Bad Id'));
  assert.throws(() => draftPath(PATH, 'index'));
  assert.throws(() => draftPath('src/data/x.json'));
});

test('isVersionId allows plain slugs only', () => {
  assert.ok(isVersionId('waiting') && isVersionId('v2') && isVersionId('2026-campaign'));
  assert.ok(!isVersionId('') && !isVersionId('a/b') && !isVersionId('A') && !isVersionId('index') && !isVersionId(1));
});

test('pageOf finds the page file of a draft, and a page in a folder is its own page', () => {
  const pages = [PATH, 'src/content/pages/company.md', 'src/content/pages/company/team.md'];
  assert.deepEqual(pageOf('src/drafts/pages/about.md', pages), { path: PATH, id: 'waiting' });
  assert.deepEqual(pageOf('src/drafts/pages/about/campaign.md', pages), { path: PATH, id: 'campaign' });
  assert.deepEqual(pageOf('src/drafts/pages/company/team.md', pages), { path: 'src/content/pages/company/team.md', id: 'waiting' });
  assert.equal(pageOf('src/content/pages/about.md', pages), null);
});

test('versionsOf lists the page file and each waiting version with its time', () => {
  const drafts = { waiting: `${draft.replace('---\n\n', '')}`, campaign: '---\ntitle: "C"\npublishAt: "2026-12-01T08:00"\n---\n' };
  assert.deepEqual(versionsOf({ path: PATH, text: live, drafts }), [
    { id: 'live', state: 'live' },
    { id: 'waiting', state: 'waiting' },
    { id: 'campaign', state: 'waiting', publishAt: '2026-12-01T08:00' },
  ]);
  assert.deepEqual(versionsOf({ path: PATH, text: off }), [{ id: 'live', state: 'unpublished' }]);
});

test('published: a draft or a stored scheduled page is not', () => {
  assert.ok(published(live));
  assert.ok(!published(off));
  assert.ok(!published('---\nstatus: scheduled\npublishAt: "2026-12-01T08:00"\n---\n'));
});

test('saveDraft writes the draft file and keeps a time already set', () => {
  assert.deepEqual(saveDraft({ path: PATH, text: live }, draft), [{ path: 'src/drafts/pages/about.md', text: draft }]);
  const timed = { path: PATH, text: live, drafts: { waiting: '---\ntitle: "x"\npublishAt: "2026-12-01T08:00"\n---\n' } };
  const [change] = saveDraft(timed, draft);
  assert.equal(timeOf(change.text), '2026-12-01T08:00');
  assert.ok(change.text.endsWith('\n\nNew text.\n'));
});

test('publish: the waiting version replaces the page file and its file goes', () => {
  const timed = draft.replace('title: "About us"', 'title: "About us"\npublishAt: "2026-12-01T08:00"');
  assert.deepEqual(publish({ path: PATH, text: live, drafts: { waiting: timed } }), [
    { path: PATH, text: draft },
    { path: 'src/drafts/pages/about.md', text: null },
  ]);
});

test('publish: a draft page with nothing waiting is published as it is, a live page with nothing waiting changes nothing', () => {
  assert.deepEqual(publish({ path: PATH, text: off }), [{ path: PATH, text: '---\ntitle: "About"\n---\n\nText.\n' }]);
  assert.deepEqual(publish({ path: PATH, text: live }), []);
});

test('schedule: sets the time on the waiting version, or makes one of the page file', () => {
  const [a] = schedule({ path: PATH, text: live }, '2026-12-01T08:00');
  assert.equal(a.path, 'src/drafts/pages/about.md');
  assert.equal(a.text, '---\ntitle: "About"\npublishAt: "2026-12-01T08:00"\n---\n\nLive text.\n');
  const [b] = schedule({ path: PATH, text: off }, '2026-12-01T08:00');
  assert.ok(!/status/.test(b.text) && timeOf(b.text) === '2026-12-01T08:00');
  const [c] = schedule({ path: PATH, text: live, drafts: { waiting: a.text } }, '2027-01-01T09:30');
  assert.equal(timeOf(c.text), '2027-01-01T09:30');
  const [d] = schedule({ path: PATH, text: live, drafts: { waiting: a.text } }, null);
  assert.equal(timeOf(d.text), undefined);
  assert.deepEqual(schedule({ path: PATH, text: live }, null), []);
  assert.throws(() => schedule({ path: PATH, text: live }, 'tomorrow'));
});

test('unpublish turns the page into a draft and leaves the waiting versions', () => {
  assert.deepEqual(unpublish({ path: PATH, text: live, drafts: { waiting: draft } }), [
    { path: PATH, text: '---\ntitle: "About"\nstatus: "draft"\n---\n\nLive text.\n' },
  ]);
  assert.deepEqual(unpublish({ path: PATH, text: off }), []);
});

test('discard removes a waiting version and nothing else', () => {
  assert.deepEqual(discard({ path: PATH, text: live, drafts: { waiting: draft } }), [{ path: 'src/drafts/pages/about.md', text: null }]);
  assert.deepEqual(discard({ path: PATH, text: live }), []);
  assert.deepEqual(discard({ path: PATH, text: live, drafts: { campaign: draft } }, 'campaign'), [
    { path: 'src/drafts/pages/about/campaign.md', text: null },
  ]);
});

test('due gives the waiting version of each page whose time has come, the oldest first', () => {
  const at = (t) => `---\ntitle: "x"\npublishAt: "${t}"\n---\n`;
  const now = Date.UTC(2026, 11, 2, 12, 0);
  const pages = [
    { path: PATH, text: live, drafts: { waiting: at('2026-12-01T08:00'), campaign: at('2026-11-30T08:00') } },
    { path: 'src/content/pages/b.md', text: live, drafts: { waiting: at('2026-12-24T08:00') } },
    { path: 'src/content/pages/c.md', text: live, drafts: { waiting: draft } },
  ];
  assert.deepEqual(
    due(pages, now).map((d) => [d.page.path, d.id]),
    [[PATH, 'campaign']],
  );
});

test('a file with CRLF line breaks keeps them', () => {
  const crlf = '---\r\ntitle: "A"\r\n---\r\nText\r\n';
  assert.equal(unpublish({ path: PATH, text: crlf })[0].text, '---\r\ntitle: "A"\r\nstatus: "draft"\r\n---\r\nText\r\n');
});

test('migrateScheduled makes a Scheduled page a draft and gives its time to a waiting version', () => {
  const old = '---\ntitle: "About"\nstatus: "scheduled"\npublishAt: "2026-12-01T08:00"\n---\n\nText.\n';
  assert.deepEqual(migrateScheduled({ path: PATH, text: old }), [
    { path: PATH, text: '---\ntitle: "About"\nstatus: "draft"\n---\n\nText.\n' },
    { path: 'src/drafts/pages/about.md', text: '---\ntitle: "About"\npublishAt: "2026-12-01T08:00"\n---\n\nText.\n' },
  ]);
  assert.deepEqual(migrateScheduled({ path: PATH, text: live }), []);
  assert.deepEqual(migrateScheduled({ path: PATH, text: off }), []);
});
