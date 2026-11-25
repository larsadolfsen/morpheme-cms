// The icon packs in the app store (store.ts, docs/icon-pack-contract.md): the Appstore's "Icons" section (#settings/appstore/icons, IconPackStoreScreen),
// the store's packs and those installed, with the same search, order and status filter as the themes, each opening its page; and the page of one
// (#settings/appstore/icons/<id>, StoreIconPackPage) with its icons, what it is, its licences and "Install", "Update to …" and "Remove". Material
// Symbols is built in and is not in the list. Installing, updating and removing are useIconPackActions (iconPackActions.ts); a pack can be picked
// under "Appearance" › "Icon packs" after the site's next build.
import { useEffect, useState, type ReactNode } from 'react';
import Screen from './Screen';
import { Button, EmptyNote, Group, GroupTitle, IconSwatches, ListItem, SupportingText, plainListClass, useKept } from './ui';
import type { Env } from './App';
import { StoreNotice, StoreRound, useStoreConnected, useStoreKey } from './StoreStatus';
import { StoreSearchRow, useStateFilter } from './StoreSearchRow';
import { useSort } from './storeSort';
import { byText } from './schema';
import { headed, letterOf } from './Sheet';
import { filterThemes } from './themeFilter.mjs';
import { iconPack, iconPacks } from './iconPacks';
import { iconPackInstalled, iconPackPending, iconPackUpdateOf, useIconPackActions } from './iconPackActions';
import { StoreLicenseRows } from './Licenses';
import { DeveloperRow } from './AppList';
import { STORE_ROUTE, type ShownIconPack } from './store';
import { t } from './i18n';

/** A pack's page in the store. */
export const iconPackHref = (id: string) => `#${STORE_ROUTE}/icons/${id}`;

/** The store's icon packs for a screen: null while they are read, 'failed' when they could not be. */
function useIconPackCatalog(env: Env): ShownIconPack[] | null | 'failed' {
  const [catalog, setCatalog] = useState<ShownIconPack[] | null | 'failed'>(null);
  useEffect(() => {
    let on = true;
    env.store.iconPacks().then(
      (found) => on && setCatalog(found),
      () => on && setCatalog('failed'),
    );
    return () => {
      on = false;
    };
  }, []);
  return catalog;
}

/** "Icons" (#settings/appstore/icons): the packs in the store; their search, order and filter as the themes'. */
export function IconPackStoreScreen({ env, header }: { env: Env; header?: ReactNode }) {
  return <StoreRound>{(again) => <IconPackList env={env} again={again} header={header} />}</StoreRound>;
}

function IconPackList({ env, again, header }: { env: Env; again: () => void; header?: ReactNode }) {
  const key = useStoreKey();
  const catalog = useIconPackCatalog(env);
  const connected = useStoreConnected(env);
  const [query, setQuery] = useKept('icon-pack-store-search', '');
  const [sort, pickSort] = useSort();
  const stateFilter = useStateFilter('icon-pack-store');
  const groups = headed(
    filterThemes(Array.isArray(catalog) ? catalog : [], {
      query,
      state: stateFilter.state,
      sort,
      installed: iconPackInstalled,
      compare: byText,
    }),
    (x) => letterOf(x.name),
  );
  return (
    <Screen title={t.apps.sections.icons} wide>
      {header}
      <StoreSearchRow
        query={query}
        onQuery={setQuery}
        label={t.library.searchIconPacks}
        sort={sort}
        pickSort={pickSort}
        groups={[stateFilter.group]}
        chips={[stateFilter.chip]}
      />
      <StoreNotice connected={connected} read={catalog} mayChange={key?.mayChange ?? false} again={again} />
      <SupportingText className="mo-editor-hint-space">{t.library.iconPackBuiltIn}</SupportingText>
      {catalog === null ? null : !groups.length ? (
        <p className="mo-editor-empty-note">{Array.isArray(catalog) && !catalog.length ? t.library.iconPackNone : t.common.noMatch}</p>
      ) : (
        groups.map((g) => (
          <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
            {g.items.map((x) => (
              <ListItem
                key={x.id}
                href={iconPackHref(x.id)}
                leading={x.samples.length ? <IconSwatches icons={x.samples} label={t.library.iconPackSamples(x.name)} /> : undefined}
                headline={x.name}
                supporting={t.library.iconPackByline(x.author, x.license)}
                truncate
                count={iconPackInstalled(x.id) && (iconPackPending(x.id) ? t.apps.pending : t.apps.installed)}
                arrow
              />
            ))}
          </Group>
        ))
      )}
    </Screen>
  );
}

/** The page of one pack in the store (#settings/appstore/icons/<id>). */
export function StoreIconPackPage({ id, env }: { id: string; env: Env }) {
  const catalog = useIconPackCatalog(env);
  const actions = useIconPackActions(env, () => iconPack);
  const [, redraw] = useState(0);
  const of = Array.isArray(catalog) ? catalog.find((x) => x.id === id) : undefined;
  const record = iconPacks.find((x) => x.id === id)?.store;
  const installed = iconPackInstalled(id);
  const update = iconPackUpdateOf(id, record, catalog);
  const back = { href: `#${STORE_ROUTE}/icons`, label: t.apps.sections.icons };
  return (
    <Screen title={of?.name ?? t.apps.sections.icons} wide back={back}>
      {of ? (
        <>
          <ul className={`${plainListClass} mo-editor-list-head`}>
            <ListItem
              headline={of.name}
              supporting={[
                t.library.themeByline(of.version, of.author),
                installed ? (iconPackPending(id) ? t.apps.pending : t.apps.installed) : t.apps.notInstalled,
              ].join(' · ')}
              lines={3}
            />
          </ul>
          <div className="mo-editor-settings-section">
            {!installed && (
              <Button
                disabled={actions.saving}
                busy={actions.busy(of.id, 'install')}
                onClick={async () => (await actions.install(of)) && redraw((n) => n + 1)}
              >
                {t.apps.install}
              </Button>
            )}
            {installed && update && record && (
              <Button
                disabled={actions.saving}
                busy={actions.busy(of.id, 'update')}
                onClick={async () => (await actions.update(update, record)) && redraw((n) => n + 1)}
              >
                {t.apps.update(update.version)}
              </Button>
            )}
          </div>
          {of.samples.length > 0 && (
            <section className="mo-editor-settings-section">
              <GroupTitle>{t.library.iconPackIcons}</GroupTitle>
              <IconSwatches icons={of.samples} label={t.library.iconPackSamples(of.name)} />
            </section>
          )}
          {of.description && (
            <section className="mo-editor-settings-section">
              <GroupTitle>{t.library.iconPackAbout}</GroupTitle>
              <p className="mo-editor-settings-inset">{of.description}</p>
            </section>
          )}
          <StoreLicenseRows licenses={of.licenses} name={of.name} author={of.author} version={of.version} />
          <DeveloperRow name={of.author} />
          {installed && (
            <div>
              <Button
                kind="outlined"
                disabled={actions.saving}
                busy={actions.busy(of.id, 'uninstall')}
                onClick={async () => (await actions.uninstall(of.id, of.name)) && redraw((n) => n + 1)}
              >
                {t.apps.uninstall}
              </Button>
            </div>
          )}
        </>
      ) : catalog === null ? (
        <EmptyNote busy>{t.apps.loadingStore}</EmptyNote>
      ) : (
        <EmptyNote>{catalog === 'failed' ? t.apps.storeFailed : t.library.iconPackNotInStore}</EmptyNote>
      )}
    </Screen>
  );
}
