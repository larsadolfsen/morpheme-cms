// "Søgeord" under the fields of "Interne links" (Part.below, packages/editor/defaults/internalLinks.ts): every primary and secondary
// keyword of the pages, the posts and the fixed pages with the fields for them ("Søgemaskiner"), each with the page it
// links to, which of its keywords it is and, at the right, how many pages and posts link with it on the site as it was
// last built (/editor/links.json, packages/editor/scripts/link-counts.mjs; one that another page has too, which wins, links from none).
// Only those of the published ones, as the site links them (packages/editor/site/autolinks.mjs); a new version of a page (/ny/…)
// gives its own to the page it is for. Over them, as over the lists, a search by word and page, the order (A–Å, the
// default, under the first letter, Å–A, the most or the fewest links first; kept in this browser) and the funnel with
// the filters by kind of keyword, by links and by kind of page, each picked one as a chip. A row opens the page at
// "Søgemaskiner" (openAtSeo).
import { ArrowsDownUp } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { Choice, EmptyNote, Filters, FormHeading, Group, InputChip, listClass, SearchRow, useKept, ListItem } from './ui';
import type { RepoFile } from './github';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { openAtSeo } from './EntryForm';
import { headed, letterOf } from './Sheet';
import { collections } from './site';
import { config, standardPages, standardPaths } from '@site/editor';
import { byText } from './schema';
import { t } from './i18n';

/** A keyword: the page it is on (its file, `#…`, its name, its address on the site and its list) and which it is. */
type Keyword = { word: string; primary: boolean; title: string; href: string; address: string; kind: string };

/** How many pages link with each word on the site as it was last built: by the word in lower case, where it links. */
type Counts = Record<string, { href: string; pages: number }>;

type Sort = 'az' | 'za' | 'most' | 'fewest';
const SORT_KEY = 'editor-sort-soegeord';
function savedSort(): Sort {
  try {
    const s = localStorage.getItem(SORT_KEY);
    if (s === 'az' || s === 'za' || s === 'most' || s === 'fewest') return s;
  } catch {}
  return 'az';
}

const split = (text: unknown) =>
  String(text ?? '')
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);
const has = (fields: { name: string }[]) => fields.some((f) => f.name === 'keyword');

// The keywords of one page, post or fixed page.
const wordsOf = (d: Record<string, unknown>, page: Omit<Keyword, 'word' | 'primary'>): Keyword[] => [
  ...split(d.keyword).map((word) => ({ word, primary: true, ...page })),
  ...split(d.keywords).map((word) => ({ word, primary: false, ...page })),
];

function keywordsOf(files: RepoFile[]): Keyword[] {
  // A standard page is where it is shown: the front page at /, the blog page at /blog/ (their own addresses send on
  // there); the 404 page has no address, so its words link nowhere; the others (the contact page) at their own.
  const paths = standardPaths(files.find((f) => f.path === config.standardPages)?.text);
  const shownAt = (address: string) => {
    const standard = standardPages.find((p) => paths[p.key] === address);
    return standard && standard.at !== undefined ? standard.at : address;
  };
  return collections.flatMap((c) => {
    if (c.kind === 'markdown' && has(c.fields))
      return files
        .filter((f) => f.path.startsWith(`${c.folder}/`) && f.path.endsWith('.md'))
        .flatMap((f) => {
          const d = readFields(splitFrontmatter(f.text).yaml);
          const draft = d.status && d.status !== 'published';
          const address = String(d.path || `/${f.path.slice(c.folder.length + 1).replace(/(\/index)?\.md$/, '')}/`);
          const at = shownAt(address);
          if (draft || address.startsWith('/ny/') || at === null) return [];
          return wordsOf(d, {
            title: String(d.title ?? f.path),
            href: `#${f.path}`,
            address: at,
            kind: c.id,
          });
        });
    if (c.kind === 'files')
      return c.files
        .filter((file) => has(file.fields))
        .flatMap((file) => {
          const text = files.find((f) => f.path === file.file)?.text;
          return text ? wordsOf(JSON.parse(text), { title: file.label, href: `#${file.file}`, address: file.view, kind: c.id }) : [];
        });
    return [];
  });
}

export default function Keywords({ files }: { files: RepoFile[] }) {
  const [query, setQuery] = useKept('soegeord-soeg', '');
  const [sort, setSort] = useState(savedSort);
  const [which, setWhich] = useKept<'' | 'primary' | 'secondary'>('soegeord-slags', '');
  const [linked, setLinked] = useKept<'' | 'with' | 'without'>('soegeord-links', '');
  const [kind, setKind] = useKept('soegeord-side', '');
  // undefined while they load; null when the site has none (not built since they came, or offline).
  const [counts, setCounts] = useState<Counts | null>();
  useEffect(() => {
    fetch('/editor/links.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCounts(data?.words ?? null))
      .catch(() => setCounts(null));
  }, []);
  const linksOf = (k: Keyword) => {
    const c = counts?.[k.word.toLowerCase()];
    return c && c.href === k.address ? c.pages : 0;
  };

  const all = useMemo(() => keywordsOf(files), [files]);
  const kinds = collections.filter((c) => all.some((k) => k.kind === c.id));
  const shownKind = kinds.some((c) => c.id === kind) ? kind : '';
  const counted = !!counts;
  const shownLinked = counted ? linked : '';
  const shownSort = counted || sort === 'az' || sort === 'za' ? sort : 'az';
  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }
  const filters = [
    {
      title: t.keywords.whichFilter,
      value: which,
      options: [
        { value: '', label: t.keywords.allWhich },
        { value: 'primary', label: t.keywords.which.primary },
        { value: 'secondary', label: t.keywords.which.secondary },
      ],
      onChange: (v: string) => setWhich(v as typeof which),
    },
    counted && {
      title: t.keywords.linksFilter,
      value: shownLinked,
      options: [
        { value: '', label: t.keywords.allLinks },
        { value: 'with', label: t.keywords.linked.with },
        { value: 'without', label: t.keywords.linked.without },
      ],
      onChange: (v: string) => setLinked(v as typeof linked),
    },
    kinds.length > 1 && {
      title: t.keywords.kindFilter,
      value: shownKind,
      options: [{ value: '', label: t.keywords.allKinds }, ...kinds.map((c) => ({ value: c.id, label: c.label }))],
      onChange: setKind,
    },
  ].filter((f) => !!f);
  // Each filter picked, as a chip that removes it.
  const chips = [
    which && { key: 'which', label: t.keywords.which[which], clear: () => setWhich('') },
    shownLinked && { key: 'links', label: t.keywords.linked[shownLinked], clear: () => setLinked('') },
    shownKind && { key: 'kind', label: kinds.find((c) => c.id === shownKind)!.label, clear: () => setKind('') },
  ].filter((c) => !!c);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const byWord = (a: Keyword, b: Keyword) => byText(a.word, b.word) || byText(a.title, b.title);
  const order: Record<Sort, (a: Keyword, b: Keyword) => number> = {
    az: byWord,
    za: (a, b) => -byWord(a, b),
    most: (a, b) => linksOf(b) - linksOf(a) || byWord(a, b),
    fewest: (a, b) => linksOf(a) - linksOf(b) || byWord(a, b),
  };
  const shown = all
    .filter(
      (k) =>
        words.every((w) => `${k.word} ${k.title}`.toLowerCase().includes(w)) &&
        (!which || k.primary === (which === 'primary')) &&
        (!shownLinked || linksOf(k) > 0 === (shownLinked === 'with')) &&
        (!shownKind || k.kind === shownKind),
    )
    .sort(order[shownSort]);
  // By word under the first letter; by links in one list.
  const groups = shownSort === 'az' || shownSort === 'za' ? headed(shown, (k) => letterOf(k.word)) : [{ key: null, items: shown }];
  const sorts: Sort[] = counted ? ['az', 'za', 'most', 'fewest'] : ['az', 'za'];

  return (
    <section className="space-y-6">
      <FormHeading>{t.keywords.title}</FormHeading>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={t.keywords.searchLabel}
        sort={
          <Choice
            title={t.library.sort}
            icon={ArrowsDownUp}
            value={shownSort}
            options={sorts.map((s) => ({ value: s, label: t.keywords.sorts[s] }))}
            onChange={pickSort}
          />
        }
        filter={<Filters title={t.library.filter} selected={chips.length > 0} groups={filters} />}
      />
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <InputChip key={c.key} removeLabel={t.library.removeFilter(c.label)} onRemove={c.clear}>
              {c.label}
            </InputChip>
          ))}
        </div>
      )}
      {shown.length ? (
        groups.map((g) => (
          <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
            {g.items.map((k) => (
              <ListItem
                key={`${k.word} ${k.href}`}
                href={k.href}
                onClick={openAtSeo}
                headline={k.word}
                supporting={t.keywords.on(k.title, k.primary)}
                truncate
                count={counted && t.keywords.links(linksOf(k))}
                arrow
              />
            ))}
          </Group>
        ))
      ) : (
        <ul className={listClass}>
          <EmptyNote item>{all.length ? t.keywords.noMatch : t.keywords.none}</EmptyNote>
        </ul>
      )}
    </section>
  );
}
