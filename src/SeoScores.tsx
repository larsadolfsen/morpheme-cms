// "SEO-vurdering" under "Søgemaskineoptimering" (#seo/vurdering): every page and blog post with the score of its SEO
// rating (seo.ts, the same as at the top of "Søgemaskiner" on it) in a ring at the start of its row, and its
// primary keyword under its name, under "Sider" and "Blogindlæg", the lowest first. Over them, as over the lists, a
// search by name and keyword, the order (lowest or highest first, A–Å or Å–A, kept in this browser) and the funnel with
// the filters by rating, by primary keyword and by kind, each picked one as a chip; under the title the average. A tap
// on the ring opens the page or post at "Søgemaskiner" (openAtSeo), on the rest of the row at its top.
import { ArrowsDownUp } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import Screen from './Screen';
import { Choice, EmptyNote, Filters, Group, InputChip, listClass, ScoreRing, scoreOf, SearchRow, useKept, ListItem } from './ui';
import type { RepoFile } from './github';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { fileRating } from './seo';
import type { Env } from './App';
import { openAtSeo } from './EntryForm';
import { collections } from './site';
import { byText, type Collection, type MarkdownCollection } from './schema';
import { t } from './i18n';

/** Where it opens, under "Søgemaskineoptimering". */
export const SEO_SCORES_ROUTE = 'seo/vurdering';

type Sort = 'low' | 'high' | 'az' | 'za';
const SORTS: Sort[] = ['low', 'high', 'az', 'za'];
const SORT_KEY = 'editor-sort-seo';

function savedSort(): Sort {
  try {
    const s = localStorage.getItem(SORT_KEY);
    if (SORTS.some((x) => x === s)) return s as Sort;
  } catch {}
  return 'low';
}

type Rated = { path: string; title: string; keyword: string; score: number };

// The filters: by the rating's colour (ScoreRing: green from 90, orange from 50, else red), by whether a primary keyword
// is filled in, and by kind (the list it is in).
type Rating = 'good' | 'average' | 'bad';
const RATINGS: Rating[] = ['good', 'average', 'bad'];
const ratingOf = (score: number): Rating => (score >= 90 ? 'good' : score >= 50 ? 'average' : 'bad');
type HasKeyword = 'with' | 'without';

// The pages and posts: the collections of Markdown files with the fields for search engines (EntryForm.tsx), the
// blog posts last.
const rated = () => collections.filter(isRated).sort((a, b) => Number(a.id === 'blog') - Number(b.id === 'blog'));

function rate(collection: MarkdownCollection, file: RepoFile, relations: Env['relations']): Rated {
  const checks = fileRating(file.text, collection.id === 'blog', relations);
  const d = readFields(splitFrontmatter(file.text).yaml);
  const title = String(d.title ?? '');
  return { path: file.path, title: title || file.path, keyword: String(d.keyword ?? '').trim(), score: scoreOf(checks) };
}

/** Whether a list has the SEO rating: the pages and posts, with the fields for search engines (EntryForm.tsx). */
export const isRated = (c: Collection): c is MarkdownCollection => c.kind === 'markdown' && c.fields.some((f) => f.name === 'seoTitle');

export default function SeoScores({ files, env }: { files: RepoFile[]; env: Env }) {
  const [query, setQuery] = useKept('seo-soeg', '');
  const [sort, setSort] = useState(savedSort);
  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }
  const groups = useMemo(
    () =>
      rated().map((c) => ({
        collection: c,
        items: files.filter((f) => f.path.startsWith(`${c.folder}/`) && f.path.endsWith('.md')).map((f) => rate(c, f, env.relations)),
      })),
    [files, env.relations],
  );
  const all = groups.flatMap((g) => g.items);
  const average = all.length ? Math.round(all.reduce((sum, r) => sum + r.score, 0) / all.length) : null;
  const [rating, setRating] = useKept<Rating | ''>('seo-vurdering', '');
  const [hasKeyword, setHasKeyword] = useKept<HasKeyword | ''>('seo-soegeord', '');
  const [kind, setKind] = useKept('seo-slags', '');
  const shownKind = groups.some((g) => g.collection.id === kind) ? kind : '';
  const kindName = groups.find((g) => g.collection.id === shownKind)?.collection.label ?? '';
  const filters = [
    {
      title: t.seo.ratingFilter,
      value: rating,
      options: [{ value: '', label: t.seo.allRatings }, ...RATINGS.map((r) => ({ value: r, label: t.seo.ratings[r] }))],
      onChange: (v: string) => setRating(v as Rating | ''),
    },
    {
      title: t.seo.keywordFilter,
      value: hasKeyword,
      options: [
        { value: '', label: t.seo.allKeywords },
        { value: 'with', label: t.seo.keywords.with },
        { value: 'without', label: t.seo.keywords.without },
      ],
      onChange: (v: string) => setHasKeyword(v as HasKeyword | ''),
    },
    groups.length > 1 && {
      title: t.seo.kindFilter,
      value: shownKind,
      options: [{ value: '', label: t.seo.allKinds }, ...groups.map((g) => ({ value: g.collection.id, label: g.collection.label }))],
      onChange: setKind,
    },
  ].filter((f) => !!f);
  // Each filter picked, as a chip that removes it.
  const chips = [
    rating && { key: 'rating', label: t.seo.ratings[rating], clear: () => setRating('') },
    hasKeyword && { key: 'keyword', label: t.seo.keywords[hasKeyword], clear: () => setHasKeyword('') },
    shownKind && { key: 'kind', label: kindName, clear: () => setKind('') },
  ].filter((c) => !!c);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const fits = (r: Rated) =>
    words.every((w) => `${r.title} ${r.keyword}`.toLowerCase().includes(w)) &&
    (!rating || ratingOf(r.score) === rating) &&
    (!hasKeyword || !!r.keyword === (hasKeyword === 'with'));
  const order = (a: Rated, b: Rated) =>
    sort === 'low'
      ? a.score - b.score || byText(a.title, b.title)
      : sort === 'high'
        ? b.score - a.score || byText(a.title, b.title)
        : (sort === 'za' ? -1 : 1) * byText(a.title, b.title);
  const shown = groups
    .filter((g) => !shownKind || g.collection.id === shownKind)
    .map((g) => ({ ...g, items: g.items.filter(fits).sort(order) }))
    .filter((g) => g.items.length);

  return (
    <Screen
      title={t.seo.title}
      wide
      back={{ href: '#seo', label: t.common.parts.seo }}
      status={average === null ? undefined : t.seo.average(average)}
    >
      <p className="mb-4 text-muted">{t.seo.intro}</p>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={t.seo.searchLabel}
        sort={
          <Choice
            title={t.library.sort}
            icon={ArrowsDownUp}
            value={sort}
            options={SORTS.map((s) => ({ value: s, label: t.seo.sorts[s] }))}
            onChange={pickSort}
          />
        }
        filter={<Filters title={t.library.filter} selected={chips.length > 0} groups={filters} />}
        className="mb-6"
      />
      {chips.length > 0 && (
        <div className="-mt-2 mb-6 flex flex-wrap gap-2">
          {chips.map((c) => (
            <InputChip key={c.key} removeLabel={t.library.removeFilter(c.label)} onRemove={c.clear}>
              {c.label}
            </InputChip>
          ))}
        </div>
      )}
      {shown.length ? (
        shown.map((g) => (
          <Group key={g.collection.id} title={g.collection.label}>
            {g.items.map((r) => (
              <ListItem
                key={r.path}
                href={`#${r.path}`}
                leading={<ScoreRing score={r.score} label={t.seo.scoreLabel(r.score)} onClick={openAtSeo} />}
                headline={r.title}
                supporting={r.keyword || t.seo.noKeyword}
                truncate
                arrow
              />
            ))}
          </Group>
        ))
      ) : (
        <ul className={listClass}>
          <EmptyNote item>{t.seo.none}</EmptyNote>
        </ul>
      )}
    </Screen>
  );
}
