// A page saved twice from one editor session (Save, then Save again, then Publish) is never refused as "changed elsewhere": the
// form takes the commit's blob ids, so the next save sends the ids git has. GitHub is a fake Worker with the real one's check
// (worker/editor-github.js commit: each path's blob id as sent against the branch head, 409 `exists` or `changed`), in memory.
// Run from a folder with a built site: npm run build, then `cd .morpheme/demo/site && node ../../../scripts/check-save-twice.mjs`.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';

const ROOT = `${process.cwd()}/`;
const TEXT = /\.(md|mdx|jsonc?|ya?ml|txt|ts|js|mjs|css|astro|svg)$/;
const oidOf = (text) =>
  createHash('sha1')
    .update(`blob ${Buffer.byteLength(text)}\0${text}`)
    .digest('hex');

/** The fake repository: the files on disk, then what is committed. */
export function fakeRepo() {
  const written = new Map(); // path -> text | null (deleted)
  const answered = [];
  const read = (path) => {
    if (written.has(path)) return written.get(path);
    const full = join(ROOT, path);
    return existsSync(full) && statSync(full).isFile() && TEXT.test(path) ? readFileSync(full, 'utf8') : null;
  };
  const list = (dir, depth) => {
    const found = new Map();
    const walk = (d, left) => {
      const full = join(ROOT, d);
      if (!existsSync(full) || !statSync(full).isDirectory()) return;
      for (const e of readdirSync(full, { withFileTypes: true })) {
        const path = posix.join(d, e.name);
        if (e.isDirectory()) left > 1 && walk(path, left - 1);
        else found.set(path, true);
      }
    };
    walk(dir, depth);
    for (const [path, text] of written)
      if (text !== null && posix.dirname(path).startsWith(dir) && posix.dirname(path) === dir) found.set(path, true);
    return [...found.keys()]
      .filter((p) => read(p) !== null || !TEXT.test(p))
      .map((path) => ({ path, oid: oidOf(read(path) ?? path), binary: read(path) === null }));
  };
  const texts = new Map();
  const remember = (text) => (texts.set(oidOf(text), text), oidOf(text));
  const answer = (route, body) => {
    if (route === 'head') return [200, { commit: 'head', tree: 'root' }];
    if (route === 'trees') return [200, { trees: (body.at ?? []).map(() => null) }];
    if (route === 'files')
      return [
        200,
        {
          commit: 'head',
          tree: 'root',
          folders: (body.folders ?? []).map((d) => list(d, body.depth ?? 3).map((f) => (remember(read(f.path) ?? ''), f))),
          paths: (body.paths ?? []).map((p) => {
            const text = read(p);
            if (text === null) return null;
            remember(text);
            return { path: p, oid: oidOf(text), binary: false };
          }),
        },
      ];
    if (route === 'texts') return [200, { texts: Object.fromEntries((body.oids ?? []).map((o) => [o, texts.get(o) ?? ''])) }];
    if (route === 'commit') {
      const now = body.changes.map((c) => {
        const text = read(c.path);
        return text === null ? null : oidOf(text);
      });
      const bad = body.changes.findIndex((c, i) => now[i] !== c.oid);
      answered.push({ paths: body.changes.map((c) => c.path), sent: body.changes.map((c) => c.oid), now, bad });
      if (bad >= 0) return [409, { conflict: body.changes[bad].oid ? 'changed' : 'exists' }];
      const blobs = {};
      for (const c of body.changes) {
        const text = c.content === null ? null : Buffer.from(c.content, 'base64').toString('utf8');
        written.set(c.path, text);
        if (text !== null) blobs[c.path] = remember(text);
      }
      return [200, { commit: 'head', blobs }];
    }
    return null;
  };
  // The Worker's autosave (worker/autosave.js flushText), for a new page (`create`, made at the first free `to`) and a draft page (the page
  // file itself, moved to `to` when that is free): the kept text and what a flush commits.
  const kept = new Map();
  const draft = (text) => (/^status:\s*draft$/m.test(text) ? text : text.replace(/^---\n/, '---\nstatus: draft\n'));
  const names = (to) => [to, ...Array.from({ length: 8 }, (_, i) => to.replace(/\.md$/, `-${i + 2}.md`))];
  const put = (body) => (kept.set(body.path, { text: body.text, create: body.create, to: body.to }), [200, { savedAt: Date.now() }]);
  const flush = (body) => {
    const stored = kept.get(body.path);
    const text = body.text ?? stored?.text;
    const make = { create: body.create ?? stored?.create, to: body.to ?? stored?.to };
    if (text === undefined) return [404, { error: 'not found' }];
    kept.delete(body.path);
    const body2 = draft(text);
    if (make.create) {
      const free = names(make.to).find((n) => read(n) === null);
      written.set(free, body2);
      return [200, { committed: true, path: free }];
    }
    const moveTo = make.to && make.to !== body.path ? names(make.to).find((n) => read(n) === null) : null;
    if (moveTo && moveTo !== body.path) {
      written.set(moveTo, body2);
      written.set(body.path, null);
      return [200, { committed: true, path: moveTo }];
    }
    written.set(body.path, body2);
    return [200, { committed: true, path: body.path }];
  };
  return { answer, written, answered, read, put, flush };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { server, site } = await serveBuilt(join(ROOT, 'dist'));
  const repo = fakeRepo();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await (await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 })).newPage();
  if (process.env.DEBUG_REQ) {
    page.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log('console', m.text().slice(0, 200)));
    page.on(
      'request',
      (r) =>
        r.url().includes('/api/') &&
        !r.url().includes('dashboard') &&
        console.log('REQ', r.method(), r.url().split('/api/')[1], (r.postData() || '').slice(0, 100)),
    );
  }
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.route(`${site}/api/github/**`, (r) => {
    const route = new URL(r.request().url()).pathname.slice('/api/github/'.length);
    const body = JSON.parse(r.request().postData() || '{}');
    if (route === 'graphql')
      return r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: { viewer: { login: 'x', name: 'X' }, repository: { ref: { target: { oid: 'head' } }, viewerPermission: 'ADMIN' } },
        }),
      });
    const found = repo.answer(route, body);
    return found
      ? r.fulfill({ status: found[0], contentType: 'application/json', body: JSON.stringify(found[1]) })
      : r.fulfill({ status: 404 });
  });
  await page.route(`${site}/api/autosave**`, (r) => {
    const body = JSON.parse(r.request().postData() || '{}');
    const isFlush = r.request().url().endsWith('/flush');
    const [status, json] =
      r.request().method() === 'GET'
        ? [404, {}]
        : r.request().method() === 'DELETE'
          ? [200, {}]
          : isFlush
            ? repo.flush(body)
            : repo.put(body);
    return r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.route(`${site}/api/r2?**`, (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ bound: true, bucket: 'ready' }) }),
  );
  await page.route(`${site}/api/cms`, (r) => r.fulfill({ contentType: 'application/json', body: '{}' }));
  await page.route(`${site}/api/dashboard`, (r) => r.fulfill({ contentType: 'application/json', body: '{"dashboard":null}' }));
  const fail = [];
  const toast = () => page.evaluate(() => document.body.innerText);
  const closeDialog = () =>
    page
      .getByRole('button', { name: 'Cancel' })
      .click({ timeout: 1500 })
      .catch(() => {});
  // The phone is left (the tab hidden) and opened again: the Worker's autosave moves the text to git meanwhile.
  const visible = (state) =>
    page.evaluate((state) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
  const leave = async () => {
    await visible('hidden');
    await page.waitForTimeout(1500);
    await visible('visible');
    await page.waitForTimeout(1500);
  };
  const type = async (text) => {
    await page.click('[contenteditable=true]');
    await page.keyboard.type(text);
    await page.waitForTimeout(800);
  };
  const press = async (name, what) => {
    const before = repo.answered.length;
    await page.getByRole('button', { name, exact: true }).click();
    await page.waitForTimeout(1500);
    const refused = repo.answered.slice(before).filter((a) => a.bad >= 0);
    if (refused.length || /changed elsewhere|already|exists/i.test(await toast())) fail.push(`${what}: refused ${JSON.stringify(refused)}`);
    await closeDialog();
  };

  // A new page, the tab hidden after a few words (the Worker makes the draft page file), then Save changes twice and Publish.
  await page.goto(`${site}/editor/#new/pages`);
  await page.waitForSelector('[contenteditable=true]');
  await type('From us to you');
  await leave();
  if (![...repo.written.keys()].some((k) => k.startsWith('src/content/pages/') && k.includes('new-page')))
    fail.push('the autosave made no page file');
  await type(' more');
  await press('Save changes', 'Save changes after the tab was hidden');
  await type(' again');
  await leave();
  await press('Save changes', 'Save changes again after the tab was hidden');
  await type(' three');
  await press('Publish', 'Publish');

  // A real concurrent edit is still reported: the file changes elsewhere, and the next save is refused.
  const file = [...repo.written.keys()].find((k) => k.includes('new-page') && repo.written.get(k) !== null);
  repo.written.set(file, `${repo.read(file)}\nsomeone else\n`);
  await type(' mine');
  await page
    .getByRole('button', { name: /^Publish( changes)?$/ })
    .first()
    .click();
  await page.waitForTimeout(1500);
  if (!(repo.answered.at(-1)?.bad >= 0) || !/changed elsewhere/i.test(await toast()))
    fail.push(`a change made elsewhere was not reported: ${JSON.stringify(repo.answered.at(-1))}`);

  await browser.close();
  server.close();
  if (fail.length) {
    console.error(`check:save-twice failed:\n${fail.join('\n')}`);
    process.exit(1);
  }
  console.log(
    'check:save-twice: a page saved after the tab was hidden is not refused as changed elsewhere; a real concurrent edit still is.',
  );
}
