// The order of a list of apps or themes (A–Z or Z–A, kept in this browser) and its picker.
// Exposes useSort(), sortChoice(sort, pickSort) and type Sort; uses Choice (ui.tsx) and t.library.
import { useState } from 'react';
import { ArrowsDownUp } from '@phosphor-icons/react';
import { Choice } from './ui';
import { t } from './i18n';

export type Sort = 'az' | 'za';
const SORTS: Sort[] = ['az', 'za'];
// The order picked last time, in this browser (the same for the apps and the store).
const SORT_KEY = 'editor-sort-apps';

/** The order of a list of apps, A–Z or Z–A, kept in this browser. */
export function useSort(): [Sort, (next: Sort) => void] {
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (SORTS.some((s) => s === saved)) return saved as Sort;
    } catch {}
    return 'az';
  });
  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }
  return [sort, pickSort];
}

export const sortChoice = (sort: Sort, pickSort: (next: Sort) => void) => (
  <Choice
    title={t.library.sort}
    icon={ArrowsDownUp}
    value={sort}
    options={SORTS.map((value) => ({ value, label: t.library.sorts[value] }))}
    onChange={pickSort}
  />
);
