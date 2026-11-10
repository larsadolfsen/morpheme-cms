// Checks the consent log (packages/editor/worker/consent.js): the Worker's own code with D1 played by Node's SQLite (node:sqlite) and
// GitHub's answer about a sign-in played here. An answer from the site's own page is kept with the build's commit;
// one from another site, with a wrong consent id or with a category the banner does not have is not; only someone
// who can save the site reads, saves as CSV or deletes them; the hourly clean-up deletes those older than two years,
// and without the binding nothing is kept. Nothing goes to GitHub or Cloudflare. Run: npm run check:worker
import { DatabaseSync } from 'node:sqlite';
import { workerModules } from './worker-modules.mjs';

const [{ forgetOldConsents, handleConsent, KEEP_DAYS }] = await workerModules('consent.js');

const problems = [];
const expect = (ok, what) => ok || problems.push(what);

/** D1, as much of it as the Worker uses, on an SQLite database in memory. */
function d1() {
  const db = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...values) => statement(sql, values),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    first: async (column) => db.prepare(sql).get(...args)?.[column] ?? null,
  });
  return { db, prepare: (sql) => statement(sql), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

// GitHub: the token "editor" may save the site, "guest" may only read it.
globalThis.fetch = async (url, init) => {
  const token = init?.headers?.authorization?.replace('Bearer ', '');
  if (!String(url).startsWith('https://api.github.com/')) return new Response(null, { status: 404 });
  if (token === 'editor') return Response.json({ permissions: { pull: true, push: true } });
  if (token === 'guest') return Response.json({ permissions: { pull: true, push: false } });
  return new Response(null, { status: 401 });
};

const SITE = 'https://site.example';
const COMMIT = 'abc123';
const ASSETS = { fetch: async () => Response.json({ commit: COMMIT }) };
const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const OTHER = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const visitor = (body, origin = SITE) =>
  new Request(`${SITE}/api/consent`, { method: 'POST', headers: { origin, 'content-type': 'text/plain' }, body: JSON.stringify(body) });
const editor = (token, path = '', init = {}) =>
  new Request(`${SITE}/api/consent${path}`, {
    ...init,
    headers: { cookie: `editor_session=${token}`, 'sec-fetch-site': 'same-origin', ...init.headers },
  });

const store = d1();
const env = { CONSENT: store, ASSETS };

// What a visitor sends.
const sent = async (body, origin) => (await handleConsent(visitor(body, origin), env)).status;
expect((await sent({ id: ID, choices: { statistics: true, marketing: false } })) === 204, 'et svar fra sitet blev ikke gemt');
expect((await sent({ id: OTHER, choices: { statistics: false } })) === 204, 'et andet svar fra sitet blev ikke gemt');
expect(
  (await sent({ id: ID, choices: { statistics: true } }, 'https://other.example')) === 403,
  'et svar fra en anden side blev taget imod',
);
expect((await sent({ id: 'not-an-id', choices: { statistics: true } })) === 400, 'et svar med et forkert id blev taget imod');
expect((await sent({ id: ID, choices: { necessary: true } })) === 400, 'an answer about necessary cookies was accepted');
expect((await sent({ id: ID, choices: { statistics: 'yes' } })) === 400, 'et svar, der ikke er ja eller nej, blev taget imod');
expect((await sent({ id: ID, choices: {} })) === 400, 'et svar uden kategorier blev taget imod');
const kept = store.db.prepare('SELECT * FROM consents ORDER BY row').all();
expect(kept.length === 2, `der blev gemt ${kept.length} svar, ikke 2`);
expect(kept[0]?.version === COMMIT, `svaret blev gemt med versionen ${kept[0]?.version}, ikke ${COMMIT}`);
expect(
  !JSON.stringify(kept).includes('origin') && Object.keys(kept[0] ?? {}).join() === 'row,id,at,choices,version',
  'der blev gemt mere end svaret',
);

// Who reads them.
expect((await handleConsent(editor('guest'), env)).status === 403, 'someone who cannot save the site could read the consents');
expect((await handleConsent(editor('nobody'), env)).status === 403, 'someone without a login could read the consents');
const listed = await (await handleConsent(editor('editor'), env)).json();
expect(listed.total === 2 && listed.entries.length === 2, `listen havde ${listed.entries?.length} af ${listed.total} svar, ikke 2`);
expect(listed.entries.find((e) => e.id === ID)?.choices.statistics === true, 'listen gav ikke svaret, som det blev givet');
const found = await (await handleConsent(editor('editor', `?q=${ID.slice(0, 8)}`), env)).json();
expect(found.entries.length === 1 && found.entries[0].id === ID, 'the search for an id did not find only that id');

// As a file.
const file = await handleConsent(editor('editor', '?format=csv'), env);
const lines = (await file.text()).trim().split('\r\n');
expect(file.headers.get('content-disposition')?.startsWith('attachment'), 'CSV-filen hentes ikke som en fil');
expect(lines[0] === '"id","at","statistics","marketing","version"', `the CSV file's first line is ${lines[0]}`);
expect(lines.length === 3, `CSV-filen har ${lines.length - 1} svar, ikke 2`);

// Deleted, when a visitor asks.
const removed = await handleConsent(editor('editor', '', { method: 'DELETE', body: JSON.stringify({ id: OTHER }) }), env);
expect((await removed.json()).deleted === 1, 'svaret blev ikke slettet');
expect(
  (await handleConsent(editor('guest', '', { method: 'DELETE', body: JSON.stringify({ id: ID }) }), env)).status === 403,
  'en, der ikke kan gemme sitet, kunne slette et svar',
);

// Those older than two years are deleted each hour; the others stay.
const old = new Date(Date.now() - (KEEP_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
store.db.prepare('INSERT INTO consents (id, at, choices, version) VALUES (?, ?, ?, ?)').run(OTHER, old, '{"statistics":true}', COMMIT);
await forgetOldConsents(env);
const left = store.db.prepare('SELECT id FROM consents').all();
expect(left.length === 1 && left[0].id === ID, `efter oprydningen er der ${left.length} svar, ikke kun det nye`);

// Without the binding (a preview of a branch) nothing is kept, and the editor is told so.
const none = { ASSETS };
expect((await handleConsent(visitor({ id: ID, choices: { statistics: true } }), none)).status === 204, 'et svar uden D1 gav en fejl');
expect((await handleConsent(editor('editor'), none)).status === 503, 'editoren fik ikke at vide, at der ikke gemmes samtykker');
await forgetOldConsents(none);

// The table setup is never shared while pending: an earlier request that never settles must not block a later one.
// Each case loads its own copy of the Worker's code, because the Worker keeps whether the table exists in the module.
{
  /** A D1 whose create-table batch acts as `plan` says, in turn ('hang', 'fail', else done); `seen.creates` counts them. */
  const planned = (plan) => {
    const fake = d1();
    const seen = { creates: 0 };
    const batch = fake.batch;
    fake.batch = (list) => {
      const how = plan[seen.creates++];
      if (how === 'hang') return new Promise(() => {});
      if (how === 'fail') return Promise.reject(new Error('D1 failed'));
      return batch(list);
    };
    return { CONSENT: fake, ASSETS, seen };
  };
  const within = (promise) =>
    Promise.race([
      promise.then(
        () => 'done',
        () => 'failed',
      ),
      new Promise((resolve) => setTimeout(() => resolve('hung'), 1000)),
    ]);
  const answer = (module, e) => within(module.handleConsent(visitor({ id: ID, choices: { statistics: true } }), e));

  const [hangs] = await workerModules('consent.js');
  const hung = planned(['hang']);
  void answer(hangs, hung); // the first request: its create never settles
  const later = await answer(hangs, hung);
  expect(later === 'done', `a later answer was ${later} when the first call's creation hung`);
  expect(hung.seen.creates === 2, `det senere svar oprettede tabellen ${hung.seen.creates - 1} gange, ikke 1`);

  const [once] = await workerModules('consent.js');
  const done = planned([]);
  await answer(once, done);
  await answer(once, done);
  expect(done.seen.creates === 1, `tabellen blev oprettet ${done.seen.creates} gange efter en vellykket oprettelse, ikke 1`);

  const [retries] = await workerModules('consent.js');
  const failed = planned(['fail']);
  expect((await answer(retries, failed)) === 'failed', 'et svar gav ikke fejlen fra en oprettelse, der fejlede');
  expect((await answer(retries, failed)) === 'done', 'an answer did not retry after a creation that failed');
  expect(failed.seen.creates === 2, `efter en fejl blev tabellen oprettet ${failed.seen.creates} gange, ikke 2`);
}

if (problems.length) {
  console.error(`${problems.length} fejl i samtykkeloggen:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(
  "The consent log works: answers are saved with the site's version, only the editor can read, download and delete them, and old ones are deleted.",
);
