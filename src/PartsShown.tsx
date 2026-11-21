// The parts of a screen that shows parts in every state ("Parts": Parts.tsx, BlockParts.tsx), with the search, the order and the filters of the editor's lists ("Standard blocks",
// Library.tsx): a search in the parts' names and what they are for, the order (by group, A–Z or Z–A,
// kept in this browser; A–Z under the first letter of the names) and the funnel with the filter by
// group, the one picked as a chip that removes it. A screen can add the filter by style (how much of a part
// the active theme styles itself, coverage.ts), and each part then carries its mark (CoverageBadge.tsx). The
// search, the group and the style are kept while the editor is open.
import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowsDownUp } from '@phosphor-icons/react';
import { Choice, EmptyNote, Filters, FormHeading, InputChip, SearchRow, SupportingText, useKept } from './ui';
import { byText } from './schema';
import { CoverageBadge } from './CoverageBadge';
import { themeCoverage } from './coverage';
import { headed, letterOf } from './Sheet';
import { t } from './i18n';

/** The tag of the part's name above (h2 or h3): a subheading under it is one level deeper. */
const PartName = createContext<'h2' | 'h3'>('h3');

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

/** The search, the order and the filter over the parts (`children`, PartGroup), with "No parts match
 * the search" (or `none`) when none is shown. `keep`: the key they are kept under; `search`: the search's name;
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
  // The names of the parts shown, seen after they are drawn: none means "No parts match …", and by name they
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
      <div className="mo-editor-flow-3">
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
          <div className="mo-editor-settings-chips">
            <InputChip removeLabel={t.library.removeFilter(groupTitle)} onRemove={() => setGroup('')}>
              {groupTitle}
            </InputChip>
          </div>
        )}
      </div>
      <Shown.Provider value={{ group, style, query: search, sort, groups, order }}>
        <div ref={list} className={sort === 'group' ? 'mo-editor-flow-10' : 'mo-editor-settings-parts-list'}>
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
export function PartGroup({ group, title, children }: { group: string; title?: string; children: ReactNode }) {
  const shown = useContext(Shown);
  if (shown.group && shown.group !== group) return null;
  if (shown.sort !== 'group') return <div className="mo-contents">{children}</div>;
  return (
    <div className="mo-editor-parts-group">
      {!shown.group && <FormHeading>{shown.groups.find((g) => g.id === group)?.title ?? title}</FormHeading>}
      {children}
    </div>
  );
}

/** The attributes that make an example's own element a named group: the examples of one part repeat each other's labels (a `Cancel` in every dialog), and
 * a reader tells them apart by the group's name. Spread it on the element that holds the example. The name is the example's caption where it has one. */
export const named = (label: string) => ({ role: 'group' as const, 'aria-label': label });

/** An example in a part, named by `label` (`named`), for where it has no element of its own to name. Draws a plain div, so its look is the container's; `flat`:
 * the div takes no box (`display: contents`), so what is in it lies in the container as if it were not there. */
export function Example({ label, className, flat, children }: { label: string; className?: string; flat?: boolean; children: ReactNode }) {
  return (
    <div className={className} style={flat ? { display: 'contents' } : undefined} {...named(label)}>
      {children}
    </div>
  );
}

/** The mark of a sample that is not of its part's component (a button inside a card, a chip in a menu): `data-m3` names the Material 3 token family the
 * sample is (`check:m3-render` measures it against that family; `none` with the reason's id in scripts/check-m3-render.mjs, NONE, when Material 3 has no
 * component for it). Draws a box-less div (`display: contents`), so nothing moves. */
export function M3({ set, children }: { set: string; children: ReactNode }) {
  return (
    <div data-m3={set} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/** A part's name and what it is for, above it, with its coverage mark when the theme in use has one for it
 * (`coverage`: the id in the catalogue, the first word of the name when not given); nothing when it is not
 * what is searched for, or when the style filter picks another status. */
export function Part({
  name,
  use,
  coverage,
  m3,
  children,
}: {
  name: string;
  use?: string;
  coverage?: string;
  m3?: string;
  children?: ReactNode;
}) {
  const shown = useContext(Shown);
  const heading = useId();
  const covered = themeCoverage?.parts[coverage ?? name.split(',')[0].trim()];
  if (shown.style && covered?.status !== shown.style) return null;
  const query = shown.query.trim().toLocaleLowerCase();
  if (query && !`${name} ${use ?? ''}`.toLocaleLowerCase().includes(query)) return null;
  // Under a group's heading (the page's h1, the group's h2) a part's name is an h3; with no group heading above it (a group picked, or the parts by name) it is an h2.
  const Name = shown.sort === 'group' && !shown.group ? 'h3' : 'h2';
  return (
    // A group named by its heading: the examples of one part repeat each other's labels (every part has a `Cancel`), and a reader tells the parts apart by it.
    <section
      data-part={name}
      data-m3={m3}
      role="group"
      aria-labelledby={heading}
      className="mo-editor-flow-3"
      style={{ order: shown.order.get(name) }}
    >
      <div>
        <Name id={heading} className="mo-editor-part-name">
          {name}
        </Name>
        {use && <SupportingText>{use}</SupportingText>}
        {covered && <CoverageBadge coverage={covered} />}
      </div>
      <PartName.Provider value={Name}>{children}</PartName.Provider>
    </section>
  );
}

/** A subheading inside a part, one for each size or kind it shows (Small, Medium, Large; Filled, Tonal, Outlined), with what it names under it. */
export function PartSub({ name, children }: { name: string; children: ReactNode }) {
  const Tag = useContext(PartName) === 'h3' ? 'h4' : 'h3';
  const heading = useId();
  // A group named by its heading, as a part is: the examples under it repeat each other's labels, and a reader tells the rows apart by the name.
  return (
    <div role="group" aria-labelledby={heading} className="mo-editor-part-sub">
      <Tag id={heading} className="mo-type-label-medium mo-editor-part-sub-name">
        {name}
      </Tag>
      {children}
    </div>
  );
}
