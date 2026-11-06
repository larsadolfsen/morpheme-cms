// The search row of a store screen (apps or themes): search field, sort, filter dialog and a chip for each filter picked.
// Exposes StoreSearchRow and useStateFilter (the installed / not installed filter); uses SearchRow, Filters, InputChip (ui.tsx), storeSort.tsx.
import type { ComponentProps } from 'react';
import { Filters, InputChip, SearchRow, useKept } from './ui';
import { sortChoice, type Sort } from './storeSort';
import { t } from './i18n';

type Group = ComponentProps<typeof Filters>['groups'][number];
export type StoreChip = { key: string; label: string; clear: () => void };

/** The filter by whether it is installed, kept in this browser (under `prefix`): its value, its group for the filter dialog and its chip. */
export function useStateFilter(prefix: string) {
  const [state, setState] = useKept<'' | 'installed' | 'notInstalled'>(`${prefix}-status`, '');
  const group: Group = {
    title: t.apps.stateFilter,
    value: state,
    options: [
      { value: '', label: t.apps.allStates },
      { value: 'installed', label: t.apps.installed },
      { value: 'notInstalled', label: t.apps.notInstalled },
    ],
    onChange: (v: string) => setState(v as typeof state),
  };
  const chip: StoreChip | '' = state && { key: 'state', label: t.apps[state], clear: () => setState('') };
  return { state, group, chip };
}

export function StoreSearchRow({
  query,
  onQuery,
  label,
  sort,
  pickSort,
  groups,
  chips,
}: {
  query: string;
  onQuery: (next: string) => void;
  label: string;
  sort: Sort;
  pickSort: (next: Sort) => void;
  groups: Group[];
  chips: (StoreChip | '' | false)[];
}) {
  const shown = chips.filter((c) => !!c);
  return (
    <>
      <SearchRow
        value={query}
        onChange={onQuery}
        label={label}
        sort={sortChoice(sort, pickSort)}
        filter={<Filters title={t.library.filter} selected={shown.length > 0} groups={groups} />}
        className="mb-6"
      />
      {shown.length > 0 && (
        <div className="-mt-2 mb-6 flex flex-wrap gap-2">
          {shown.map((c) => (
            <InputChip key={c.key} removeLabel={t.library.removeFilter(c.label)} onRemove={c.clear}>
              {c.label}
            </InputChip>
          ))}
        </div>
      )}
    </>
  );
}
