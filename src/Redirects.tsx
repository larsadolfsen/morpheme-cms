// "Videresendelser" under Indhold (#seo/videresendelser): two rows with how many
// each has, each opening a screen of its own.
// "Alle videresendelser" (#seo/videresendelser/alle): every address of a page the site sends on elsewhere
// (redirectData.ts), by address, with where it sends to, and search. Tapping one opens a sheet where
// where it sends to can be changed, or the redirect deleted; "+" adds a new one (in the editor's own,
// src/data/redirects.json). Each save is one commit, and none sends on through another afterwards
// (flatten): a redirect to an address that is sent on goes straight to where that ends, and those
// that went on through a deleted one go on to where it sent them.
// "Ikke fundet" (#seo/videresendelser/ikke-fundet): the addresses visitors came to that do not exist (notFound.ts), most visits
// first. Tapping one opens the same sheet, to send it on to a page (then it is off that list) or take
// it off the list. One that has become a page or sends on since is not shown. Over each list, as over
// the lists under "Indhold", the search, the order (kept in this browser; by address under the first
// letter) and, over the redirects, the funnel that shows only those to one page or post, picked as a
// chip.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowsDownUp, Funnel, LinkBreak, Plus, Signpost, Trash, X } from '@phosphor-icons/react';
import { addressOf, escape, REDIRECTS } from './addresses';
import { ask } from './ask';
import Screen from './Screen';
import {
  Button,
  InputChip,
  Choice,
  Group,
  IconButton,
  listClass,
  SupportingText,
  SearchRow,
  useKept,
  BottomSheet,
  SheetTitle,
  TextField,
  EmptyNote,
  SheetBody,
  ProblemNote,
  ListItem,
} from './ui';
import type { Env } from './App';
import type { RepoFile } from './github';
import { changesOf, entriesOf, flatten, lookup, readAll, REDIRECT_FILES, setRedirect, type AllRedirects } from './redirectData';
import type { Missing } from './notFound';
import { when } from './when';
import { headed, letterOf } from './Sheet';
import { byText } from './schema';
import { savedText } from './deploy';
import { config, whatIsAt } from '@site/editor';
import { siteT, t } from './i18n';
import { backFrom } from './site';

// An address as typed, as one: "/ny-side/", "/" for the front page, a #part kept, the site's own
// domain left out; a link to another site as it is. '' when nothing is typed.
function targetOf(typed: string): string {
  const text = typed.trim();
  if (!text) return '';
  const own = new RegExp(`^https?://(www\\.)?${escape(config.domain)}`, 'i');
  if (/^https?:\/\//i.test(text) && !own.test(text)) return text;
  const [path, part] = text.replace(own, '').split('#');
  const base = path.replace(/\//g, '') === '' ? '/' : addressOf(path, 'page');
  return base && part ? `${base}#${part}` : base;
}

// What the owner edits in the sheet: the redirect's address (only for a new one) and where it sends to;
// missing: the address visitors came to that does not exist, which it sends on.
type Editing = { from: string; to: string; isNew: boolean; missing?: Missing };

export type Tab = 'redirects' | 'missing';

// Where each list opens, under "Videresendelser".
export const TAB_ROUTES: Record<Tab, string> = { redirects: 'seo/videresendelser/alle', missing: 'seo/videresendelser/ikke-fundet' };
/** Where "Videresendelser" opens, under "Søgemaskineoptimering". */
export const REDIRECTS_ROUTE = 'seo/videresendelser';

// The orders of each list: the redirects by their address or by the page they send to, the addresses
// that do not exist by the visits, the last visit or the address. Kept in this browser, each its own.
type Sort = 'az' | 'za' | 'page' | 'visits' | 'last';
const SORTS: Record<Tab, Sort[]> = { redirects: ['az', 'za', 'page'], missing: ['visits', 'last', 'az', 'za'] };
const sortKey = (tab: Tab) => `editor-sort-${tab === 'redirects' ? 'videresendelser' : 'ikke-fundet'}`;

function savedSort(tab: Tab): Sort {
  try {
    const s = localStorage.getItem(sortKey(tab)) as Sort | null;
    if (s && SORTS[tab].includes(s)) return s;
  } catch {}
  return SORTS[tab][0];
}

// An address without its slashes, for the order by address.
const bare = (path: string) => path.replace(/^\/+|\/+$/g, '');

// tab: the list that is open; without it, "Videresendelser" with the rows that open them.
export default function Redirects({ env, tab }: { env: Env; tab?: Tab }) {
  const [files, setFiles] = useState<RepoFile[] | null>(null);
  const [problem, setProblem] = useState('');
  useEffect(() => {
    env
      .load(REDIRECT_FILES)
      .then(setFiles)
      .catch((e) => setProblem(t.redirects.notLoaded((e as Error).message)));
  }, []);
  const all = useMemo(() => (files ? readAll(files) : null), [files]);
  const entries = useMemo(() => (all ? entriesOf(all) : []), [all]);
  const [query, setQuery] = useKept('videresendelser-soeg', '');
  const q = query.trim().toLowerCase();
  const name = (to: string) => whatIsAt(to, env.relations);
  // The pages and posts the redirects send to (not a picture or another site), by their names as in the
  // lists, under "Sider" and "Blogindlæg": the funnel shows only those to one.
  const [page, setPage] = useState('');
  const pathOf = (to: string) => to.split('#')[0];
  const named = [
    ...[...env.relations.fixed, ...env.relations.pages].map((o) => ({ ...o, group: t.library.pagesGroup })),
    ...env.relations.blog.map((o) => ({ value: `/${o.value}/`, label: o.label, group: t.redirects.postsGroup })),
  ];
  const sendsTo = new Set(entries.map((e) => pathOf(e.to)));
  const pageChoices = named
    .filter((o, i) => sendsTo.has(o.value) && named.findIndex((x) => x.value === o.value) === i)
    .sort((a, b) => (a.group === b.group ? byText(a.label, b.label) : a.group === t.library.pagesGroup ? -1 : 1));
  const shownPage = pageChoices.length > 1 && pageChoices.some((p) => p.value === page) ? page : '';
  const pageName = pageChoices.find((p) => p.value === shownPage)?.label ?? '';

  const [sorts, setSorts] = useState<Record<Tab, Sort>>(() => ({ redirects: savedSort('redirects'), missing: savedSort('missing') }));
  const sort = sorts[tab ?? 'redirects'];
  function pickSort(next: Sort) {
    if (!tab) return;
    setSorts({ ...sorts, [tab]: next });
    try {
      localStorage.setItem(sortKey(tab), next);
    } catch {}
  }
  const byFrom = (a: string, b: string) => (sort === 'za' ? -1 : 1) * byText(bare(a), bare(b));
  const shown = entries
    .filter((e) => (!q || `${e.from} ${e.to} ${name(e.to)}`.toLowerCase().includes(q)) && (!shownPage || pathOf(e.to) === shownPage))
    .sort((a, b) => (sort === 'page' ? byText(name(a.to), name(b.to)) || byText(bare(a.from), bare(b.from)) : byFrom(a.from, b.from)));
  // By address under the first letter (headed, from HEADINGS_FROM); by page in one list.
  const groups = sort === 'page' ? [{ key: null, items: shown }] : headed(shown, (e) => letterOf(bare(e.from)));
  // undefined while it loads; null when the site does not keep them.
  const [missing, setMissing] = useState<Missing[] | null>();
  const [missingProblem, setMissingProblem] = useState('');
  useEffect(() => {
    env.notFound
      .list()
      .then(setMissing)
      .catch((e) => setMissingProblem(t.redirects.missing.notLoaded((e as Error).message)));
  }, []);

  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const open = (e: Editing) => {
    setEditing(e);
    dialog.current?.showModal();
  };

  // Saves the redirects as they are after a change, in one commit, none through another.
  async function store(next: AllRedirects, message: string, change: string): Promise<boolean> {
    const flat = flatten(next);
    if (typeof flat === 'string') {
      env.notify({ text: flat, error: true });
      return false;
    }
    const changes = changesOf(flat, files!);
    if (!changes.length) return true;
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const oids = await env.commit(message, changes, change);
      const saved = changes.map((c) => ({ path: c.path, oid: oids[c.path], text: String(c.content) }));
      setFiles((was) => [...(was ?? []).filter((f) => !saved.some((s) => s.path === f.path)), ...saved]);
      // The editor's own redirects are among the app's files too.
      const own = saved.find((f) => f.path === REDIRECTS);
      if (own) env.onSaved(own);
      env.notify({ text: savedText(change), kind: 'saved' });
      return true;
    } catch (e) {
      env.notify({ text: t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  // The addresses of the pages and posts: a redirect from one would hide it.
  const pages = [...env.relations.pages, ...env.relations.fixed].map((o) => o.value);
  const posts = env.relations.blog.map((o) => `/${o.value}/`);

  // The addresses that still do not exist: not a page or a post now, and not sent on.
  const look = useMemo(() => (all ? lookup(all) : null), [all]);
  const stillMissing = (missing ?? []).filter((m) => look && !pages.includes(m.path) && !posts.includes(m.path) && !look(m.path));
  const shownMissing = stillMissing
    .filter((m) => !q || `${m.path} ${m.from}`.toLowerCase().includes(q))
    .sort((a, b) => (sort === 'visits' ? b.count - a.count : sort === 'last' ? b.last.localeCompare(a.last) : byFrom(a.path, b.path)));
  // By address under the first letter; by visits or the last visit in one list.
  const missingGroups =
    sort === 'az' || sort === 'za' ? headed(shownMissing, (m) => letterOf(bare(m.path))) : [{ key: null, items: shownMissing }];

  // Takes addresses off the list of those that do not exist.
  async function forget(paths: string[]): Promise<boolean> {
    try {
      await env.notFound.forget(paths);
      setMissing((was) => was?.filter((m) => !paths.includes(m.path)));
      return true;
    } catch (e) {
      env.notify({ text: t.redirects.missing.notForgotten((e as Error).message), error: true, kind: 'failed' });
      return false;
    }
  }

  async function save() {
    if (!editing || !all) return;
    const from = editing.isNew && !editing.missing ? addressOf(editing.from, 'page') : editing.from;
    const to = targetOf(editing.to);
    if (!from) return env.notify({ text: t.redirects.noFrom, error: true });
    if (!to) return env.notify({ text: t.redirects.noTo, error: true });
    if (to.split('#')[0] === from) return env.notify({ text: t.redirects.toSelf, error: true });
    if (editing.isNew && (pages.includes(from) || posts.includes(from)))
      return env.notify({ text: t.redirects.pageHas(from), error: true });
    if (editing.isNew && entries.some((e) => e.from === from)) return env.notify({ text: t.redirects.alreadyRedirects(from), error: true });
    const done = await store(
      setRedirect(all, from, to),
      editing.isNew ? siteT.redirects.commit.add(from, to) : siteT.redirects.commit.change(from, to),
      t.app.changes[editing.isNew ? 'added' : 'edited'](t.app.changes.redirect(from)),
    );
    if (!done) return;
    // Sent on: no longer an address that does not exist.
    if (editing.missing) await forget([from]);
    dialog.current?.close();
  }

  async function remove(from: string) {
    if (!all) return;
    const via = entries.filter((e) => e.from !== from && e.to.split('#')[0] === from).length;
    const sure = await ask(t.redirects.deleteAsk(from, via), t.common.delete);
    if (!sure) return;
    // First straight to where it ends, so those that went on through it keep going there.
    const flat = flatten(all);
    if (typeof flat === 'string') return env.notify({ text: flat, error: true });
    const change = t.app.changes.deleted(t.app.changes.redirect(from));
    if (await store(setRedirect(flat, from, null), siteT.redirects.commit.delete(from), change)) dialog.current?.close();
  }

  async function drop(path: string) {
    if (await forget([path])) {
      dialog.current?.close();
      env.notify({ text: t.redirects.missing.forgotten, kind: 'saved' });
    }
  }

  const to = editing ? targetOf(editing.to) : '';
  const m = editing?.missing;
  if (!tab) {
    const rows = [
      { tab: 'redirects' as const, label: t.redirects.all, icon: Signpost, count: files ? entries.length : null },
      { tab: 'missing' as const, label: t.redirects.missing.title, icon: LinkBreak, count: missing && files ? stillMissing.length : null },
    ];
    return (
      <Screen title={t.common.parts.redirects} wide back={backFrom('videresendelser')}>
        {problem && <ProblemNote>{problem}</ProblemNote>}
        <Group>
          {rows.map((r) => (
            <ListItem key={r.tab} href={`#${TAB_ROUTES[r.tab]}`} icon={r.icon} headline={r.label} count={r.count} arrow />
          ))}
        </Group>
      </Screen>
    );
  }
  return (
    <Screen
      title={tab === 'redirects' ? t.redirects.all : t.redirects.missing.title}
      wide
      back={{ href: `#${REDIRECTS_ROUTE}`, label: t.common.parts.redirects }}
      status={
        tab === 'missing'
          ? missing && files
            ? t.redirects.count(stillMissing.length)
            : undefined
          : files
            ? t.redirects.count(entries.length)
            : undefined
      }
      actions={
        tab === 'redirects' && (
          <IconButton
            icon={Plus}
            label={t.redirects.new}

            disabled={!files}
            onClick={() => open({ from: '', to: '', isNew: true })}
          />
        )
      }
    >
      <p className="mb-4 text-muted">{tab === 'redirects' ? t.redirects.intro : t.redirects.missing.intro}</p>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={tab === 'redirects' ? t.redirects.searchLabel : t.redirects.missing.searchLabel}
        sort={
          <Choice
            title={t.library.sort}
            icon={ArrowsDownUp}
            value={sort}
            options={SORTS[tab].map((s) => ({ value: s, label: t.redirects.sorts[s] }))}
            onChange={pickSort}
          />
        }
        filter={
          tab === 'redirects' &&
          pageChoices.length > 1 && (
            <Choice
              title={t.redirects.pageFilter}
              icon={Funnel}
              value={shownPage}
              selected={!!shownPage}
              options={[{ value: '', label: t.library.allPages }, ...pageChoices]}
              search={t.common.search}
              onChange={setPage}
            />
          )
        }
        className="mb-6"
      />
      {tab === 'redirects' && shownPage && (
        <div className="-mt-2 mb-6 flex flex-wrap gap-2">
          <InputChip removeLabel={t.library.removeFilter(pageName)} onRemove={() => setPage('')}>
            {pageName}
          </InputChip>
        </div>
      )}
      {problem && <ProblemNote>{problem}</ProblemNote>}
      {!files && !problem && <EmptyNote busy>{t.redirects.loading}</EmptyNote>}
      {tab === 'missing' && files && (
        <>
          {missingProblem && <ProblemNote>{missingProblem}</ProblemNote>}
          {missing === undefined && !missingProblem && <EmptyNote busy>{t.redirects.missing.loading}</EmptyNote>}
          {missing === null && <EmptyNote>{t.redirects.missing.notKept}</EmptyNote>}
          {missing &&
            (shownMissing.length ? (
              missingGroups.map((g) => (
                <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
                  {g.items.map((m) => (
                    // The address and how often it was asked for: under each other on a phone, side by side on a computer.
                    <ListItem
                      key={m.path}
                      onClick={() => open({ from: m.path, to: '', isNew: true, missing: m })}
                      headline={m.path}
                      supporting={t.redirects.missing.seen(m.count, when(new Date(m.last)))}
                      columns
                    />
                  ))}
                </Group>
              ))
            ) : (
              <ul className={listClass}>
                <EmptyNote item>{t.redirects.missing.none(q ? query.trim() : '')}</EmptyNote>
              </ul>
            ))}
        </>
      )}
      {tab === 'redirects' &&
        files &&
        (shown.length ? (
          groups.map((g) => (
            <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
              {g.items.map((e) => (
                // The address and where it sends to: under each other on a phone, side by side on a computer.
                <ListItem
                  key={e.from}
                  onClick={() => open({ from: e.from, to: e.to, isNew: false })}
                  headline={e.from}
                  supporting={
                    <span className="flex items-start gap-1.5">
                      <ArrowRight size={14} className="mt-1 shrink-0" />
                      <span className="min-w-0 break-words">{name(e.to)}</span>
                    </span>
                  }
                  columns
                />
              ))}
            </Group>
          ))
        ) : (
          <ul className={listClass}>
            <EmptyNote item>{t.redirects.none(q ? query.trim() : '')}</EmptyNote>
          </ul>
        ))}
      <BottomSheet
        ref={dialog}
        onClose={(e) => e.target === e.currentTarget && setEditing(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <SheetTitle
          title={editing?.isNew && !editing.missing ? t.redirects.new : (editing?.from ?? '')}
          onClose={() => dialog.current?.close()}
        />
        {editing && (
          <SheetBody
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {m && (
              <SupportingText>
                {t.redirects.missing.details(
                  m.count,
                  when(new Date(m.first)),
                  when(new Date(m.last)),
                  m.from && whatIsAt(m.from, env.relations),
                )}
              </SupportingText>
            )}
            {editing.isNew && !m && (
              <div>
                <TextField
                  id="redirect-from"
                  label={t.redirects.from}
                  hint={t.redirects.fromHint}
                  value={editing.from}
                  autoComplete="off"
                  onChange={(e) => setEditing({ ...editing, from: e.target.value })}
                />
              </div>
            )}
            <div>
              <TextField
                id="redirect-to"
                label={t.redirects.to}
                hint={to ? t.redirects.sendsTo(name(to), name(to) === to && to.startsWith('/')) : t.redirects.toHint}
                value={editing.to}
                autoComplete="off"
                onChange={(e) => setEditing({ ...editing, to: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? t.common.saving : m ? t.redirects.missing.sendOn : t.common.save}
            </Button>
            {m && (
              <Button kind="outlined" icon={X} disabled={saving} onClick={() => drop(m.path)}>
                {t.redirects.missing.forget}
              </Button>
            )}
            {!editing.isNew && (
              <Button kind="outlined" icon={Trash} disabled={saving} onClick={() => remove(editing.from)}>
                {t.redirects.deleteRedirect}
              </Button>
            )}
          </SheetBody>
        )}
      </BottomSheet>
    </Screen>
  );
}
