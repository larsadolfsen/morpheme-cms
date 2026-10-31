// After a save: tells when the site has been rebuilt with it. Each build writes the commit it was
// made from to /editor/version.json (packages/editor/pages/editor/version.json.js), and the editor asks for that
// until it is the saved commit or a later one. The message is a notification of the type `site` (notifications.ts),
// which also comes on the phone or computer when the editor is not on screen.
// Each save says what it changed ("farver ændret", "side “Om” ændret", t.app.changes): right after it (savedText),
// and, with the other saves since, when the website has been updated with them (changesText, App.tsx save).
import { graphql, REPO } from './github';
import { entryName, type Collection } from './schema';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { locale, t } from './i18n';

const fileName = (path: string) => path.split('/').pop() ?? path;

/** What a file of a list is called: a page's or post's title, an entry's name as its list shows it, else (a picture)
 * its file name. */
export function nameOf(collection: Collection | undefined, file: { path: string; text: string }): string {
  try {
    if (collection?.kind === 'markdown') return String(readFields(splitFrontmatter(file.text).yaml).title ?? fileName(file.path));
    if (collection?.kind === 'folder') return entryName(collection, JSON.parse(file.text)) || fileName(file.path);
  } catch {}
  return fileName(file.path);
}

/** A kind or a label inside a sentence: "Side" as "side", but "SEO" as it is. */
export const lower = (s: string) => (/^\p{Lu}\p{Lu}/u.test(s) ? s : s.charAt(0).toLocaleLowerCase(locale) + s.slice(1));
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

/** A thing by its kind and name, as a change says it: side “Om”. */
export const kindAndName = (kind: string, name: string) => t.app.changes.named(lower(kind), name);

/** The message right after a save, with what it changed; the site is rebuilt in 1-2 minutes. */
export const savedText = (change: string) => t.common.saved(capital(change));

/** What the saves since the last update changed, as a list: the first three and how many more. */
export function changesText(changes: string[]): string {
  const shown = changes.slice(0, 3);
  const rest = changes.length - shown.length;
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(rest ? [...shown, t.app.changes.more(rest)] : shown);
}

const EVERY = 10_000;
const GIVE_UP = 10 * 60_000;

// What the site was last built from: the commit, the fingerprint of the editor's code and when.
type Version = { commit?: string; editor?: string; builtAt?: string };
async function version(): Promise<Version> {
  try {
    const res = await fetch('/editor/version.json', { cache: 'no-store' });
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

const built = async () => (await version()).commit ?? null;

// Whether `commit` is among the last commits up to `build` (the site may be built from a later one).
async function includes(build: string, commit: string): Promise<boolean> {
  const data = await graphql<{ repository: { object: { history?: { nodes: { oid: string }[] } } | null } }>(
    `
      query ($owner: String!, $name: String!, $oid: GitObjectID!) {
        repository(owner: $owner, name: $name) {
          object(oid: $oid) {
            ... on Commit {
              history(first: 50) {
                nodes {
                  oid
                }
              }
            }
          }
        }
      }
    `,
    { owner: REPO.owner, name: REPO.name, oid: build },
  );
  return data.repository.object?.history?.nodes.some((n) => n.oid === commit) ?? false;
}

// Waits for `commit` to be on the site: done(true) when it is, done(false) when it is not after
// 10 minutes. Returns a function that stops waiting (a newer save takes over).
export function waitForSite(commit: string, done: (online: boolean) => void): () => void {
  const until = Date.now() + GIVE_UP;
  // The build last looked at, so GitHub is asked about each build once.
  let seen: string | null = null;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  async function check() {
    const build = await built();
    if (stopped) return;
    if (build && build !== seen) {
      seen = build;
      const online = build === commit || (await includes(build, commit).catch(() => false));
      if (stopped) return;
      if (online) return done(true);
    }
    if (Date.now() > until) {
      // Without any version file (a build from before it existed) there is nothing to tell.
      if (seen) done(false);
      return;
    }
    timer = setTimeout(check, EVERY);
  }

  timer = setTimeout(check, EVERY);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

// Whether a form has changes that are not saved (set by FormFrame).
let unsaved = false;
export const setUnsaved = (yes: boolean) => void (unsaved = yes);
export const hasUnsaved = () => unsaved;

// Keeps an open editor up to date. The installed app can stay open for days, and it reads the files
// straight from GitHub, so after a change to the editor and its files (like the front page becoming
// sections) an old editor would show them as empty forms. When the site has an editor with other
// code (the fingerprint in /editor/version.json is not the one in this page,
// packages/editor/site/editor-version.mjs), the page reloads, as soon as nothing is unsaved: checked when the
// editor opens, when it comes back on screen, and every minute while it is on screen. onSite: what the
// site was last built from, at each check (when it was updated, on the start screen).
export function keepCurrent(onSite?: (v: Version) => void) {
  const own = document.querySelector<HTMLMetaElement>('meta[name="editor-version"]')?.content;
  async function check() {
    if (document.visibilityState !== 'visible') return;
    const v = await version();
    onSite?.(v);
    const { editor } = v;
    if (!own || unsaved || !editor || editor === own) return;
    // Once for each newer editor, so a page that comes back old (from a cache) does not reload again
    // and again.
    try {
      if (sessionStorage.getItem('editor-reloaded-for') === editor) return;
      sessionStorage.setItem('editor-reloaded-for', editor);
    } catch {
      return;
    }
    location.reload();
  }
  check();
  const timer = setInterval(check, 60_000);
  document.addEventListener('visibilitychange', check);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', check);
  };
}

// Notifications go through the service worker (packages/editor/pages/editor/sw.js); registered when the editor opens.
export function registerWorker() {
  navigator.serviceWorker?.register('/editor/sw.js').catch(() => {});
}
