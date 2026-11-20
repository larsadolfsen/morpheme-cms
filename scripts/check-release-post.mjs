// Checks the Worker's blog post of a new CMS release (packages/editor/worker/release-post.js): nothing on a site without
// `releasePosts`, one commit with the post and its images for a new version, nothing more for the same version, nothing
// for a version without notes or one that has a post, and a failure tried again after an hour. npm, GitHub and KV are played
// here (a fake fetch, files in memory, a fake KV); nothing goes to npm, GitHub or Cloudflare.
// Run: npm run check:worker
import { workerModules } from './worker-modules.mjs';

const [{ postRelease }] = await workerModules('release-post.js');

const problems = [];
const expect = (ok, what) => ok || problems.push(what);

const T0 = Date.parse('2026-11-07T14:10:00Z');
const MINUTE = 60 * 1000;
const POST = 'src/content/blog/morpheme-0-14-2.md';

/** One tar entry: a 512-byte header, then the data padded to a multiple of 512. */
function tarEntry(name, content) {
  const data = Buffer.from(content);
  const header = Buffer.alloc(512);
  header.write(name, 0, 'ascii');
  header.write(data.length.toString(8).padStart(11, '0') + '\0', 124, 'ascii');
  return Buffer.concat([header, data, Buffer.alloc(Math.ceil(data.length / 512) * 512 - data.length)]);
}
/** A gzipped tar of the entries, as npm packs a package. */
const tarball = async (...entries) => {
  const tar = Buffer.concat([...entries, Buffer.alloc(1024)]);
  return new Uint8Array(await new Response(new Blob([tar]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
};

const NOTES = [
  { id: 'a', kind: 'paragraph', title: 'Pick up where you left off', text: 'Your last pages wait on the start screen.' },
  { id: 'b', kind: 'line', text: 'Lists have larger text' },
];
const EDITION = {
  name: 'Braies',
  place: { 'en-US': 'Lago di Braies, South Tyrol, Italy' },
  photo: { by: 'Pietro De Grandi', source: 'https://images.unsplash.com/p' },
};
const packageOf = (version, notes = NOTES) =>
  tarball(
    ...(notes ? [tarEntry(`package/release-notes/i18n/en-US/${version}.json`, JSON.stringify({ version, notes }))] : []),
    tarEntry(`package/release-notes/i18n/en-US/${version}/a.webp`, [1, 2, 3]),
    tarEntry('package/release-notes/editions/0.14.json', JSON.stringify(EDITION)),
    tarEntry('package/release-notes/editions/0.14.webp', [7, 7]),
  );

/** Workers KV, as much of it as the Worker uses; `reads` counts the calls. */
function kvStore() {
  const map = new Map();
  const kv = {
    reads: 0,
    map,
    get: async (key, type) => {
      kv.reads++;
      const value = map.get(key);
      return value === undefined ? null : type === 'json' ? JSON.parse(value) : value;
    },
    put: async (key, value) => void map.set(key, String(value)),
  };
  return kv;
}

/** The site and npm: `releasePosts` in its config, the files in its repository, npm's latest and its tar's notes. */
function world({ releasePosts = { categories: ['releases'] }, latest = '0.14.2', notes = NOTES, locale = 'en-US' } = {}) {
  const w = { kv: kvStore(), files: {}, commits: [], urls: [], latest, failCommit: false };
  w.env = { GITHUB_PUBLISH_TOKEN: 'token', PUSH: w.kv };
  w.deps = {
    config: { releasePosts, locale, folders: { blog: 'src/content/blog', media: 'public/images/uploads' } },
    readFiles: async (env, paths) => ({ head: `head${w.commits.length}`, texts: paths.map((p) => w.files[p]) }),
    commitFiles: async (env, head, headline, changes) => {
      if (w.failCommit) throw new Error('GitHub is down');
      for (const change of changes) w.files[change.path] = change.text ?? change.bytes;
      w.commits.push({ head, headline, changes });
      return `c${w.commits.length}`;
    },
    fetch: async (url) => {
      url = String(url);
      w.urls.push(url);
      if (url === 'https://registry.npmjs.org/-/package/@morphemecms%2fcms/dist-tags') return Response.json({ latest: w.latest });
      const manifest = /^https:\/\/registry\.npmjs\.org\/@morphemecms%2fcms\/(\d+\.\d+\.\d+)$/.exec(url);
      if (manifest) return Response.json({ version: manifest[1], dist: { tarball: `https://registry.npmjs.org/cms-${manifest[1]}.tgz` } });
      const tgz = /cms-(\d+\.\d+\.\d+)\.tgz$/.exec(url);
      if (tgz) return new Response(await packageOf(tgz[1], notes));
      return new Response('{}', { status: 404 });
    },
  };
  return w;
}
const kept = (w) => JSON.parse(w.kv.map.get('cms:release-post') ?? 'null');

// 1. A site without releasePosts: not even npm is asked.
{
  const w = world({ releasePosts: null });
  await postRelease(w.env, w.deps, T0);
  expect(w.urls.length === 0 && w.commits.length === 0, 'a site without releasePosts asked npm or committed');
}

// 2. A new version: one commit with the post, its screenshot and the edition's photo; then nothing more for it.
{
  const w = world();
  await postRelease(w.env, w.deps, T0);
  expect(w.commits.length === 1, `a new version gave ${w.commits.length} commits, not 1`);
  const commit = w.commits[0];
  expect(commit?.headline === 'Post what’s new in Morpheme 0.14.2', `the commit message was "${commit?.headline}"`);
  expect(
    commit?.changes.map((c) => c.path).join() ===
      [POST, 'public/images/uploads/2026/11/morpheme-0-14-2-a.webp', 'public/images/uploads/2026/11/morpheme-0-14-braies.webp'].join(),
    `the commit had ${commit?.changes.map((c) => c.path).join(', ')}`,
  );
  const text = w.files[POST] ?? '';
  expect(text.includes('title: "New in Morpheme Braies 0.14.2"'), 'the post’s title was not "New in Morpheme Braies 0.14.2"');
  expect(text.includes('date: 2026-11-07') && text.includes('categories: ["releases"]'), 'the post had no date or categories');
  expect(text.includes('## Pick up where you left off') && text.includes('- Lists have larger text'), 'the post had not the notes');
  expect([...(w.files['public/images/uploads/2026/11/morpheme-0-14-2-a.webp'] ?? [])].join() === '1,2,3', 'the screenshot’s bytes changed');
  expect(kept(w)?.state === 'posted' && kept(w).commit === 'c1', `cms:release-post was ${JSON.stringify(kept(w))}`);

  const before = w.urls.length;
  await postRelease(w.env, w.deps, T0 + MINUTE);
  expect(w.commits.length === 1 && w.urls.length === before + 1, 'the same version was looked at again after it was posted');

  // 3. The next version is posted too.
  w.latest = '0.14.3';
  await postRelease(w.env, w.deps, T0 + 2 * MINUTE);
  expect(w.commits.length === 2 && 'src/content/blog/morpheme-0-14-3.md' in w.files, 'the next version was not posted');
}

// 4. A version without notes: no post, and it is not looked at again.
{
  const w = world({ notes: null });
  await postRelease(w.env, w.deps, T0);
  expect(w.commits.length === 0 && kept(w)?.state === 'no-notes', `a version without notes gave ${JSON.stringify(kept(w))}`);
  const before = w.urls.length;
  await postRelease(w.env, w.deps, T0 + MINUTE);
  expect(w.urls.length === before + 1, 'a version without notes was looked at again');
}

// 5. A post that is already there (KV lost, or written by hand): no commit.
{
  const w = world();
  w.files[POST] = '---\ntitle: "Mine"\n---\n';
  await postRelease(w.env, w.deps, T0);
  expect(w.commits.length === 0 && kept(w)?.state === 'exists', 'a version with a post was posted again');
  expect(w.files[POST] === '---\ntitle: "Mine"\n---\n', 'the post that was there changed');
}

// 6. A failed commit: tried again after an hour, not before.
{
  const w = world();
  w.failCommit = true;
  const result = await postRelease(w.env, w.deps, T0).catch((e) => e);
  expect(kept(w)?.state === 'failed' && !(result instanceof Error), 'a failed commit threw or was not kept as failed');
  w.failCommit = false;
  await postRelease(w.env, w.deps, T0 + 30 * MINUTE);
  expect(w.commits.length === 0, 'a failed version was tried again before an hour');
  await postRelease(w.env, w.deps, T0 + 61 * MINUTE);
  expect(w.commits.length === 1 && kept(w)?.state === 'posted', 'a failed version was not tried again after an hour');
}

// 7. A test version on latest, or npm not answering: nothing.
{
  const w = world({ latest: '0.14.3-next-20261107145215' });
  await postRelease(w.env, w.deps, T0);
  expect(w.commits.length === 0 && kept(w) === null, 'a test version was posted');
  const down = world();
  down.deps.fetch = async () => new Response('', { status: 503 });
  await postRelease(down.env, down.deps, T0);
  expect(down.commits.length === 0 && kept(down) === null, 'npm not answering gave a post or a kept state');
}

// 8. A Danish site: the post and the commit in Danish, with the English notes when the version has no Danish ones.
{
  const w = world({ locale: 'da-DK' });
  await postRelease(w.env, w.deps, T0);
  expect(
    w.commits[0]?.headline === 'Udgiv nyhederne i Morpheme 0.14.2 p\u00e5 bloggen',
    `the Danish commit message was "${w.commits[0]?.headline}"`,
  );
  const text = w.files[POST] ?? '';
  expect(
    text.includes('title: "Nyt i Morpheme Braies 0.14.2"') && text.includes('## Ogs\u00e5 i denne version'),
    'the Danish post was not in Danish',
  );
  expect(text.includes('## Pick up where you left off'), 'the Danish post had not the English notes');
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('The Worker’s blog post of a new release is fine.');
