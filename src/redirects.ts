// All the site's redirects as one: the editor's own (src/data/redirects.json, written when a page
// moves, addresses.ts), the rules (public/_redirects, "<from> <to> 301", one to a line) and the
// Worker's map ({ paths, ids }, written with one space of indentation by scripts/wp-redirect-map.mjs);
// their files are in config.ts. The Worker sends on by the editor's own first, then by its map, and
// then the rules are read (packages/editor/worker/index.js); so does lookup here. "Videresendelser" under
// Indstillinger (Redirects.tsx) shows and changes them, and a page that takes the address of one
// removes it (EntryForm.tsx). Every change ends with flatten: each redirect sends straight to where
// it ends, never on through another (no chain, one redirect for the visitor and for Google).
import { escape, readRedirects, REDIRECTS, writeRedirects, type Redirects } from './addresses';
import type { Change, RepoFile } from './github';
import { config } from '@site/config';
import { locale, t } from './i18n';

export const RULES = config.siteRedirects.rules;
export const MAP = config.siteRedirects.map;
/** The files of the redirects, loaded when they are needed (Env.load): they change rarely. */
export const REDIRECT_FILES = [REDIRECTS, RULES, MAP];

type WorkerMap = { paths: Redirects; ids: Redirects };
/** The redirects of the three files; rules: the lines of the rules' file, as they are. */
export type AllRedirects = { own: Redirects; rules: string[]; map: WorkerMap };

// A line of the rules as its addresses; null for a comment or an empty line.
function ruleOf(line: string): { from: string; to: string } | null {
  const [from, to] = line.trim().split(/\s+/);
  return !from || from.startsWith('#') || !to ? null : { from, to };
}
// The line with another target.
const withTarget = (line: string, to: string, next: string) => line.replace(new RegExp(`(\\s)${escape(to)}(?=\\s|$)`), `$1${next}`);

export function readAll(files: RepoFile[]): AllRedirects {
  const text = (path: string) => files.find((f) => f.path === path)?.text;
  const map = text(MAP);
  return {
    own: readRedirects(text(REDIRECTS)),
    rules: (text(RULES) ?? '').split('\n'),
    map: map ? (JSON.parse(map) as WorkerMap) : { paths: {}, ids: {} },
  };
}

/** The files that changed, as they are written, to save. */
export function changesOf(all: AllRedirects, files: RepoFile[]): Change[] {
  const written: [string, string][] = [
    [REDIRECTS, writeRedirects(all.own)],
    [RULES, all.rules.join('\n')],
    [MAP, `${JSON.stringify(all.map, null, 1)}\n`],
  ];
  return written.flatMap(([path, content]) => {
    const file = files.find((f) => f.path === path);
    // A file that is not there is written only for the editor's own (a new site has none of the others).
    if (!file && path !== REDIRECTS) return [];
    const was = file?.text ?? writeRedirects({});
    return content === was ? [] : [{ path, content, oid: file?.oid ?? null }];
  });
}

/** Where an address is sent on to first, as the Worker does it, or undefined. */
export function lookup(all: AllRedirects): (address: string) => string | undefined {
  const rules = new Map<string, string>();
  for (const line of all.rules) {
    const r = ruleOf(line);
    if (r && !r.from.includes('*') && !rules.has(r.from)) rules.set(r.from, r.to);
  }
  return (address) => all.own[address] ?? all.map.paths[address] ?? rules.get(address);
}

/** Where a target ends after every redirect (keeping its #part when the last has none), and the
 * addresses when they come back to one (a loop). */
export function endOf(target: string, look: (address: string) => string | undefined): { end: string; loop: string[] | null } {
  const seen: string[] = [];
  let at = target;
  for (;;) {
    const [base, part] = at.split('#');
    const next = look(base);
    if (next === undefined) return { end: at, loop: null };
    if (seen.includes(base)) return { end: at, loop: [...seen, base] };
    seen.push(base);
    at = part !== undefined && !next.includes('#') ? `${next}#${part}` : next;
  }
}

/** Every redirect straight to where it ends; a message when they would send in a loop. */
export function flatten(all: AllRedirects): AllRedirects | string {
  const look = lookup(all);
  let loop: string[] | null = null;
  const end = (target: string) => {
    if (!target.startsWith('/') || loop) return target;
    const r = endOf(target, look);
    loop = r.loop;
    return r.end;
  };
  const each = (redirects: Redirects) => Object.fromEntries(Object.entries(redirects).map(([from, to]) => [from, end(to)]));
  const next: AllRedirects = {
    own: each(all.own),
    map: { ...all.map, paths: each(all.map.paths), ids: each(all.map.ids) },
    rules: all.rules.map((line) => {
      const r = ruleOf(line);
      const to = r && end(r.to);
      return r && to !== r.to ? withTarget(line, r.to, to!) : line;
    }),
  };
  return loop ? t.redirects.loop((loop as string[]).join(' → ')) : next;
}

/** The redirects with the one from an address sending to `to` instead, or removed (null), in every
 * file it is in; a new one goes in the editor's own. */
export function setRedirect(all: AllRedirects, from: string, to: string | null): AllRedirects {
  const own = { ...all.own };
  const paths = { ...all.map.paths };
  let found = false;
  for (const redirects of [own, paths])
    if (from in redirects) {
      found = true;
      if (to === null) delete redirects[from];
      else redirects[from] = to;
    }
  const rules = all.rules.flatMap((line) => {
    const r = ruleOf(line);
    if (r?.from !== from) return [line];
    found = true;
    return to === null ? [] : [withTarget(line, r.to, to)];
  });
  if (!found && to !== null) own[from] = to;
  return { own, rules, map: { ...all.map, paths } };
}

/** A redirect from the address of a page (not a picture or another file, not a rule with a *),
 * where to, and the files it is in. */
export type Entry = { from: string; to: string; files: string[] };

const isPage = (address: string) => /^\/([^/.*]+\/)*$/.test(address);

/** The redirects from addresses of pages, by address; `to` as the Worker sends on (the first file). */
export function entriesOf(all: AllRedirects): Entry[] {
  const entries = new Map<string, Entry>();
  const add = (from: string, to: string, file: string) => {
    if (!isPage(from)) return;
    const entry = entries.get(from);
    if (entry) entry.files.push(file);
    else entries.set(from, { from, to, files: [file] });
  };
  for (const [from, to] of Object.entries(all.own)) add(from, to, REDIRECTS);
  for (const [from, to] of Object.entries(all.map.paths)) add(from, to, MAP);
  for (const line of all.rules) {
    const r = ruleOf(line);
    if (r) add(r.from, r.to, RULES);
  }
  return [...entries.values()].sort((a, b) => a.from.localeCompare(b.from, locale));
}
