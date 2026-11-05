// The parts of a screen that shows parts in every state ("Dele": Parts.tsx, BlockParts.tsx), with the search, the order and the filters of the editor's lists ("Standardblokke",
// Library.tsx): a search in the parts' names and what they are for, the order (by group, A–Å or Å–A,
// kept in this browser; A–Å under the first letter of the names) and the funnel with the filter by
// group, the one picked as a chip that removes it. A screen can add the filter by style (how much of a part
// the active theme styles itself, coverage.ts), and each part then carries its mark (CoverageBadge.tsx). The
// search, the group and the style are kept while the editor is open.
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowsDownUp } from '@phosphor-icons/react';
import { Choice, EmptyNote, Filters, FormHeading, InputChip, SearchRow, SupportingText, useKept } from './ui';
import { byText } from './schema';
import { CoverageBadge } from './CoverageBadge';
import { themeCoverage } from './coverage';
import { headed, letterOf } from './Sheet';
import { t } from './i18n';

export type PartGroupInfo = { id: string; title: string };

type Sort = 'group' | 'az' | 'za';
const SORTS: Sort[] = ['group', 'az', 'za'];
const STATUSES = ['own', 'partly', 'material'] as const;

// What is picked over the parts: a group ('' all of them), what is searched for, the order, the groups'
// names, the status picked in the style filter ('' all), and by name, where each part stands when they are sorted by name.
const Shown = createContext<{
  group: string;
  style: string;
  query: string;
  sort: Sort;
  groups: PartGroupInfo[];
  order: Map<string, number>;
}>({
  group: '',
  style: '',
  query: '',
  sort: 'group',
  groups: [],
  order: new Map(),
});

/** What is searched for over the parts ('' when nothing is). */
export const useSearched = () => useContext(Shown).query.trim();
/** Whether the parts stand in their groups (not by name). */
export const useGrouped = () => useContext(Shown).sort === 'group';

/** The search, the order and the filter over the parts (`children`, PartGroup), with "Ingen dele passer
 * til søgningen" (or `none`) when none is shown. `keep`: the key they are kept under; `search`: the search's name;
 * `styleFilter`: adds the filter by style (own, partly, Material), when the theme in use has a coverage. */
export function PartsShown({
  groups,
  keep,
  search: searchLabel = t.parts.filter.search,
  none = t.parts.filter.none,
  styleFilter = false,
  children,
}: {
  groups: PartGroupInfo[];
  keep: string;
  search?: string;
  none?: string;
  styleFilter?: boolean;
  children: ReactNode;
}) {
  const [shownGroup, setGroup] = useKept(`${keep}-group`, '');
  const group = groups.some((g) => g.id === shownGroup) ? shownGroup : '';
  const withStyle = styleFilter && !!themeCoverage;
  const [shownStyle, setStyle] = useKept(`${keep}-style`, '');
  const style = withStyle ? shownStyle : '';
  const [search, setSearch] = useKept(`${keep}-search`, '');
  const sortKey = `editor-sort-${keep}`;
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem(sortKey);
      if (SORTS.some((s) => s === saved)) return saved as Sort;
    } catch {}
    return 'group';
  });
  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(sortKey, next);
    } catch {}
  }
  // The names of the parts shown, seen after they are drawn: none means "Ingen dele …", and by name they
  // are put in order under their first letters.
  const list = useRef<HTMLDivElement>(null);
  const [names, setNames] = useState<string[]>([]);
  useLayoutEffect(() => {
    const now = [...(list.current?.querySelectorAll<HTMLElement>('[data-part]') ?? [])].map((el) => el.dataset.part!);
    if (now.join('\n') !== names.join('\n')) setNames(now);
  });
  const sorted = [...names].sort((a, b) => (sort === 'za' ? -1 : 1) * byText(a, b));
  const lettered = sort === 'group' ? [] : headed(sorted, letterOf);
  // Each heading and part in its place: a heading before the parts under it.
  const order = new Map<string, number>();
  const headings: { key: string; order: number }[] = [];
  let at = 0;
  for (const g of lettered) {
    if (g.key) headings.push({ key: g.key, order: at++ });
    for (const name of g.items) order.set(name, at++);
  }
  const groupTitle = groups.find((g) => g.id === group)?.title;

  return (
    <>
      <div className="space-y-3">
        <SearchRow
          value={search}
          onChange={setSearch}
          label={searchLabel}
          sort={
            <Choice
              title={t.library.sort}
              icon={ArrowsDownUp}
              value={sort}
              options={SORTS.map((s) => ({ value: s, label: t.library.sorts[s] }))}
              onChange={pickSort}
            />
          }
          filter={
            <Filters
              title={t.library.filter}
              selected={!!group || !!style}
              groups={[
                {
                  title: t.library.groupFilter,
                  value: group,
                  options: [{ value: '', label: t.library.allGroups }, ...groups.map((g) => ({ value: g.id, label: g.title }))],
                  onChange: setGroup,
                },
                ...(withStyle
                  ? [
                      {
                        title: t.parts.screens.coverage.filter,
                        value: style,
                        options: [
                          { value: '', label: t.parts.screens.coverage.all },
                          ...STATUSES.map((s) => ({ value: s, label: t.parts.screens.coverage.status[s] })),
                        ],
                        onChange: setStyle,
                      },
                    ]
                  : []),
              ]}
            />
          }
        />
        {groupTitle && (
          <div className="flex flex-wrap gap-2">
            <InputChip removeLabel={t.library.removeFilter(groupTitle)} onRemove={() => setGroup('')}>
              {groupTitle}
            </InputChip>
          </div>
        )}
      </div>
      <Shown.Provider value={{ group, style, query: search, sort, groups, order }}>
        <div ref={list} className={sort === 'group' ? 'space-y-10' : 'flex flex-col gap-10'}>
          {headings.map((h) => (
            <div key={h.key} style={{ order: h.order }}>
              <FormHeading>{h.key}</FormHeading>
            </div>
          ))}
          {children}
        </div>
      </Shown.Provider>
      {!names.length && <EmptyNote>{none}</EmptyNote>}
    </>
  );
}

/** The parts of a group, under its name while all the groups are shown in their groups; nothing when
 * another group is picked, and no name when none of its parts is what is searched for. By name, the parts
 * stand in one list, without the groups. */
export function PartGroup({ group, children }: { group: string; children: ReactNode }) {
  const shown = useContext(Shown);
  if (shown.group && shown.group !== group) return null;
  if (shown.sort !== 'group') return <div className="contents">{children}</div>;
  return (
    <div className="space-y-10 [&:not(:has([data-part]))]:hidden">
      {!shown.group && <FormHeading>{shown.groups.find((g) => g.id === group)?.title}</FormHeading>}
      {children}
    </div>
  );
}

/** A part's name and what it is for, above it, with its coverage mark when the theme in use has one for it
 * (`coverage`: the id in the catalogue, the first word of the name when not given); nothing when it is not
 * what is searched for, or when the style filter picks another status. */
export function Part({ name, use, coverage, children }: { name: string; use?: string; coverage?: string; children?: ReactNode }) {
  const shown = useContext(Shown);
  const covered = themeCoverage?.parts[coverage ?? name.split(',')[0].trim()];
  if (shown.style && covered?.status !== shown.style) return null;
  const query = shown.query.trim().toLocaleLowerCase();
  if (query && !`${name} ${use ?? ''}`.toLocaleLowerCase().includes(query)) return null;
  return (
    <section data-part={name} className="space-y-3" style={{ order: shown.order.get(name) }}>
      <div>
        <h2 className="font-mono text-sm font-medium text-accent">{name}</h2>
        {use && <SupportingText>{use}</SupportingText>}
        {covered && <CoverageBadge coverage={covered} />}
      </div>
      {children}
    </section>
  );
}
