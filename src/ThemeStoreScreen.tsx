// "Theme store" (#appearance/theme-store, first under Appearance): the store's themes and those installed, with search, order and filter.
// Exposes ThemeStoreScreen; uses ThemeStore.tsx (allThemes, ThemeRow, useThemeCatalog), StoreSearchRow, StoreStatus and storeSort.
import Screen from './Screen';
import { Group, useKept } from './ui';
import type { Env } from './App';
import { StoreNotice, StoreRound, useStoreConnected, useStoreKey } from './StoreStatus';
import { StoreSearchRow, useStateFilter } from './StoreSearchRow';
import { useSort } from './storeSort';
import { byText } from './schema';
import { headed, letterOf } from './Sheet';
import { allThemes, ThemeRow, themeInstalled, useThemeCatalog } from './ThemeStore';
import { backToAppearance } from './Library';
import { filterThemes } from './themeFilter.mjs';
import { t } from './i18n';

/** "Theme store" (#appearance/theme-store, first under Appearance): all themes, those in the store and those installed, each
 * with its version and who made it, opening its page. With search (by name, who made it and the words it is found by),
 * the order and the filter by whether it is installed, picked one as a chip. */
export function ThemeStoreScreen({ env }: { env: Env }) {
  return <StoreRound>{(again) => <ThemeStoreList env={env} again={again} />}</StoreRound>;
}

function ThemeStoreList({ env, again }: { env: Env; again: () => void }) {
  const key = useStoreKey();
  const catalog = useThemeCatalog(env);
  const connected = useStoreConnected(env);
  const [query, setQuery] = useKept('theme-store-search', '');
  const [sort, pickSort] = useSort();
  const stateFilter = useStateFilter('theme-store');

  const groups = headed(
    filterThemes(allThemes(catalog), { query, state: stateFilter.state, sort, installed: themeInstalled, compare: byText }),
    (x) => letterOf(x.name),
  );

  return (
    <Screen title={t.common.parts.themeStore} wide back={backToAppearance}>
      <StoreSearchRow
        query={query}
        onQuery={setQuery}
        label={t.library.searchThemes}
        sort={sort}
        pickSort={pickSort}
        groups={[stateFilter.group]}
        chips={[stateFilter.chip]}
      />
      <StoreNotice connected={connected} read={catalog} mayChange={key?.mayChange ?? false} again={again} />
      {catalog === null ? null : !groups.length ? (
        <p className="mb-8 px-1 text-on-surface-variant">{t.common.noMatch}</p>
      ) : (
        groups.map((g) => (
          <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
            {g.items.map((x) => (
              <ThemeRow key={x.id} of={x} />
            ))}
          </Group>
        ))
      )}
    </Screen>
  );
}
