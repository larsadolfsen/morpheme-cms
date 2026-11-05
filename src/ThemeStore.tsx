// The themes in the app store (store.ts): their tab in "Appstore" (#settings/appstore/themes, StoreThemes), all themes, those
// in the store and those installed, with the same search, order and status filter as the apps; the page of one that
// is not installed (#appearance/themes/<id>, StoreThemePage), drawn from the catalog as a theme's page (its picture,
// name, version, who made it, "Installer", its pictures of a site in it, what it is and gives the site, and who made
// it); and on the page of one installed from the store (ThemePage in Library.tsx) "Opdater til …" and "Afinstaller"
// (ThemeStoreButtons). Installing copies its folder into the site's themes (config.themes/<id>/, with its store.json),
// updating copies the newer version over it and uninstalling deletes it, each saved at once in its own commit
// (themeChanges), the button pressed showing the loading indicator while it runs; the site's next build has it, and
// only then can it be chosen ("Brug temaet"). The theme in use, the one the site is changing to and the standard theme
// cannot be uninstalled.
import { useEffect, useState } from 'react';
import { Check, Smiley } from '@phosphor-icons/react';
import Screen from './Screen';
import { busyFor } from './busyAction.mjs';
import { Button, EmptyNote, Group, GroupTitle, ImageCarousel, SupportingText, ListItem } from './ui';
import { ConflictError, type RepoFile } from './github';
import type { Env } from './App';
import { ask } from './ask';
import { config } from '@site/editor';
import { iconPacks, packOfTheme } from './iconPacks';
import { theme, themes, type ThemeInfo } from './themes';
import {
  changedFiles,
  legacyOf,
  moveChanges,
  newer,
  notesSince,
  STANDARD_THEME,
  STORE_THEMES,
  themeChanges,
  themeFolder,
  type ShownTheme,
  type StoreRecord,
} from './store';
import { askUpdate, DeveloperRow } from './AppList';
import { StoreLicenseRows } from './Licenses';
import { siteT, t } from './i18n';
import { kindAndName } from './deploy';

/** A theme's page (installed, or in the store). */
export const themeHref = (id: string) => `#appearance/themes/${id}`;

/** A theme's picture (its theme.json's icon), where a row has its icon. */
export function ThemePicture({ src }: { src: string }) {
  return <img src={src} alt="" className="size-9 shrink-0 rounded-(--block-radius-small)" />;
}

/** The store's themes for a screen: null while they are read, 'failed' when they could not be. */
export function useThemeCatalog(env: Env): ShownTheme[] | null | 'failed' {
  const [catalog, setCatalog] = useState<ShownTheme[] | null | 'failed'>(null);
  useEffect(() => {
    let on = true;
    env.store.themes().then(
      (found) => on && setCatalog(found),
      () => on && setCatalog('failed'),
    );
    return () => {
      on = false;
    };
  }, []);
  return catalog;
}

// The themes installed, updated or uninstalled while the editor is open, by their id: 'installed', 'uninstalled' or the
// version updated to, until the site's build has it (and the editor reloads with it, deploy.ts keepCurrent).
const changed = new Map<string, string>();

const themeHere = (id: string) => (changed.has(id) ? changed.get(id) !== 'uninstalled' : themes.some((x) => x.id === id));

/** Whether a theme is in the site now: installed and not uninstalled since, or installed since; or, with its `legacy` id,
 * a copy under that old id from the store (legacyOf). */
export const themeInstalled = (id: string, legacy?: string) =>
  themeHere(id) || (!!legacy && legacyOf({ legacy }, themes) !== null && themeHere(legacy));

/** A theme installed from the store that the site's build does not have yet. */
export const themePending = (id: string) => changed.get(id) === 'installed' && !themes.some((x) => x.id === id);

/** The version of a theme installed, as updated while the editor is open. */
const versionOf = (x: ThemeInfo) => (changed.has(x.id) && changed.get(x.id) !== 'installed' ? changed.get(x.id)! : x.version);

/** The newer version of a theme from the store, when the store has one. */
export const themeUpdateOf = (x: ThemeInfo, catalog: ShownTheme[] | null | 'failed') => {
  const found = x.store && Array.isArray(catalog) ? catalog.find((c) => c.id === x.id || c.legacy === x.id) : undefined;
  return found && newer(found.version, versionOf(x)) ? found : undefined;
};

/** The theme the site's file says it is built with (config.theme): the one it is, or the one it is changing to. */
export function chosenTheme(files: RepoFile[]): string {
  try {
    return String(JSON.parse(files.find((f) => f.path === config.theme)?.text ?? '{}').theme ?? theme.id);
  } catch {
    return theme.id;
  }
}

/** The icon pack chosen in the site's file (config.icons, `{ "pack": "<id>" }`), as it is saved: else the one the theme
 * chosen uses (packOfTheme), so after a save, until the site is built with it, the new one. */
export function chosenPack(files: RepoFile[]): string {
  let pack: unknown;
  try {
    pack = JSON.parse(files.find((f) => f.path === config.icons)?.text ?? '{}').pack;
  } catch {}
  return typeof pack === 'string' && pack ? pack : packOfTheme(chosenTheme(files));
}

/** The folder in a theme's own folder of one of its icon packs, by the pack's id (`<theme>/<pack>`: icon-packs/<pack>). */
const packFolderInTheme = (id: string) => `icon-packs/${id.split('/')[1]}`;

/** The theme the icon pack chosen came with (its own folder has it, icon-packs/<pack>/), if it came with one. */
const themeOfPack = (files: RepoFile[]) => iconPacks.find((x) => x.id === chosenPack(files))?.theme;

/** Whether a theme can be uninstalled: from the store, and neither the standard theme nor in use or chosen, nor the one
 * the icon pack chosen came with (the pack goes with the theme). */
const canUninstall = (id: string, files: RepoFile[]) =>
  id !== STANDARD_THEME && id !== theme.id && id !== chosenTheme(files) && id !== themeOfPack(files);

type ThemeAction = 'install' | 'update' | 'uninstall';

/** Installing, updating and uninstalling a theme from the store, each saved at once in its own commit (themeChanges).
 * Each says true when it was saved. */
function useThemeActions(env: Env) {
  // Which action runs, on which theme (busyAction.mjs shows only the pressed button).
  const [running, setRunning] = useState<{ id: string; action: ThemeAction; asking: boolean } | null>(null);
  const saving = !!running;
  const recordOf = (x: ShownTheme): StoreRecord => ({ version: x.version, ref: x.version, files: x.files });

  async function change(
    id: string,
    action: ThemeAction,
    text: { busy: string; done: string; commit: string; change: string },
    next: () => Promise<Parameters<typeof themeChanges>[2]>,
    go: (current: RepoFile[]) => Promise<boolean> = async () => true,
    // The id the theme is installed under, when it is a legacy copy that moves to `id` (moveChanges).
    legacy: string | null = null,
  ): Promise<boolean> {
    setRunning({ id, action, asking: false });
    env.notify({ text: text.busy });
    try {
      const [current, wanted] = await Promise.all([env.folder(themeFolder(legacy ?? id)), next()]);
      if (!(await go(current))) {
        env.notify(null);
        return false;
      }
      // `go` cleared the message (and its dialog stopped the button being busy): saving goes on.
      setRunning({ id, action, asking: false });
      env.notify({ text: text.busy });
      await env.commit(
        text.commit,
        legacy && wanted ? moveChanges({ id }, legacy, wanted, current, env.files) : themeChanges(id, current, wanted),
        text.change,
      );
      env.notify({ text: text.done, kind: 'saved' });
      return true;
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      return false;
    } finally {
      setRunning(null);
    }
  }

  return {
    saving,
    busy: (id: string, action: ThemeAction) => busyFor(running, id, action),
    async install(x: ShownTheme) {
      const done = await change(
        x.id,
        'install',
        {
          busy: t.apps.installing,
          done: t.library.themeInstalled(x.name),
          commit: siteT.library.themeCommits.install(x.name),
          change: t.app.changes.installed(kindAndName(t.app.changes.theme, x.name)),
        },
        async () => ({ files: await env.store.files(x), record: recordOf(x) }),
      );
      if (done) changed.set(x.id, 'installed');
      return done;
    },
    async update(x: ShownTheme, record: StoreRecord, legacy: string | null = null) {
      const done = await change(
        x.id,
        'update',
        {
          busy: t.apps.updating,
          done: t.library.themeUpdated(x.name, x.version),
          commit: siteT.library.themeCommits.update(x.name, x.version),
          change: t.app.changes.updated(kindAndName(t.app.changes.theme, x.name), x.version),
        },
        async () => ({ files: await env.store.files(x), record: recordOf(x) }),
        async (current) => {
          env.notify(null);
          // The icon pack chosen, when it came with this theme, must be in the new version too: it goes with the theme.
          const pack = iconPacks.find((p) => p.id === chosenPack(env.files));
          if (pack?.theme === x.id && !x.files.some((f) => f.path === `${packFolderInTheme(pack.id)}/pack.json`)) {
            env.notify({ text: t.library.themeDropsIconPack(x.name, pack.name), error: true });
            return false;
          }
          setRunning({ id: x.id, action: 'update', asking: true });
          return askUpdate(
            x.name,
            record.version,
            x.version,
            notesSince(x.releaseNotes, record.version, x.version),
            changedFiles(x.id, record, current, themeFolder(legacy ?? x.id)),
          );
        },
        legacy,
      );
      if (done && legacy) {
        changed.set(x.id, 'installed');
        changed.set(legacy, 'uninstalled');
      } else if (done) changed.set(x.id, x.version);
      return done;
    },
    async uninstall(id: string, name: string) {
      if (!(await ask(t.library.askUninstallTheme(name), t.apps.uninstall))) return false;
      const done = await change(
        id,
        'uninstall',
        {
          busy: t.apps.uninstalling,
          done: t.library.themeUninstalled(name),
          commit: siteT.library.themeCommits.uninstall(name),
          change: t.app.changes.uninstalled(kindAndName(t.app.changes.theme, name)),
        },
        async () => null,
      );
      if (done) changed.set(id, 'uninstalled');
      return done;
    },
  };
}

/** All themes, as "Appstore" lists them: those in the store's catalog and those installed (not from the store too),
 * each with its words for the search. */
export function allThemes(catalog: ShownTheme[] | null | 'failed') {
  const store = Array.isArray(catalog) ? catalog : [];
  return [
    ...store.map((x) => ({ id: x.id, legacy: x.legacy, name: x.name, author: x.author, version: x.version, icon: x.icon, words: x.words })),
    ...themes
      .filter((x) => !store.some((s) => s.id === x.id || s.legacy === x.id))
      .map((x) => ({
        id: x.id,
        legacy: undefined as string | undefined,
        name: x.name,
        author: x.author,
        version: x.version,
        icon: x.icon,
        words: [x.name, x.author, ...Object.values(x.description ?? {}), ...Object.values(x.highlights ?? {}).flat()]
          .join(' ')
          .toLowerCase(),
      })),
  ];
}

/** A theme's row in "Appstore" and on a developer's page: its picture, its name, its version and who made it, and
 * whether it is installed, opening its page. */
export function ThemeRow({ of }: { of: ReturnType<typeof allThemes>[number] }) {
  return (
    <ListItem
      href={themeHref(of.id)}
      leading={<ThemePicture src={of.icon} />}
      headline={of.name}
      supporting={t.library.themeByline(of.version, of.author)}
      truncate
      count={themeInstalled(of.id, of.legacy) && (themePending(of.id) ? t.apps.pending : t.apps.installed)}
      arrow
    />
  );
}

/** The page of a theme in the store that is not installed, or installed but not yet built (#appearance/themes/<id>),
 * from the catalog: as a theme's page, with "Installer" (or "Afinstaller"). */
export function StoreThemePage({ id, env }: { id: string; env: Env }) {
  const catalog = useThemeCatalog(env);
  const actions = useThemeActions(env);
  const [, redraw] = useState(0);
  const of = Array.isArray(catalog) ? catalog.find((x) => x.id === id) : undefined;
  const pending = themePending(id);
  const [pictures, setPictures] = useState<{ key: string; src: string }[]>([]);
  useEffect(() => {
    if (!of?.screenshots?.length) return;
    let on = true;
    let made: string[] = [];
    env.store.themeScreenshots(of).then((found) => {
      made = found.map((x) => x.src);
      if (on) setPictures(found);
      else made.forEach((src) => URL.revokeObjectURL(src));
    });
    return () => {
      on = false;
      made.forEach((src) => URL.revokeObjectURL(src));
    };
  }, [of?.id, of?.version]);
  const shotName = (key: string) => t.library.themeShots[key] ?? of?.name ?? '';

  return (
    <Screen title={of?.name ?? t.common.parts.themes} wide back={{ href: `#${STORE_THEMES}`, label: t.apps.find }}>
      {of ? (
        <>
          <div className="mb-8 flex items-center gap-4 px-4">
            <img src={of.icon} alt="" className="size-16 shrink-0 rounded-2xl" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{of.name}</span>
              <span className="block truncate text-sm text-muted">{t.library.themeByline(of.version, of.author)}</span>
              <span className="block text-sm text-muted">{pending ? t.apps.pending : t.apps.notInstalled}</span>
            </span>
          </div>
          {!pending && (
            <div className="mb-8">
              <Button
                disabled={actions.saving}
                busy={actions.busy(of.id, 'install')}
                onClick={async () => (await actions.install(of)) && redraw((n) => n + 1)}
              >
                {t.apps.install}
              </Button>
            </div>
          )}
          {pictures.length > 0 && (
            <section className="mb-8">
              <GroupTitle>{t.library.themeLooks}</GroupTitle>
              <ImageCarousel label={t.library.themeLooks} images={pictures.map((x) => ({ src: x.src, label: shotName(x.key) }))} />
            </section>
          )}
          {of.description && (
            <section className="mb-8">
              <GroupTitle>{t.library.themeAbout}</GroupTitle>
              <p className="px-4">{of.description}</p>
            </section>
          )}
          {of.highlights.length > 0 && (
            <Group title={t.library.themeHighlights}>
              {of.highlights.map((h) => (
                <ListItem key={h} icon={Check} headline={h} />
              ))}
            </Group>
          )}
          {!!of.iconPacks?.length && (
            <Group title={t.common.parts.iconPacks}>
              {of.iconPacks.map((p) => (
                <ListItem key={p.id} icon={Smiley} headline={p.name} supporting={t.library.iconPackByline(p.author, p.license)} truncate />
              ))}
            </Group>
          )}
          <StoreLicenseRows licenses={of.licenses} name={of.name} author={of.author} version={of.version} />
          <DeveloperRow name={of.author} />
          {pending && (
            <div>
              <Button
                kind="outlined"
                disabled={actions.saving}
                busy={actions.busy(of.id, 'uninstall')}
                onClick={async () => (await actions.uninstall(of.id, of.name)) && redraw((n) => n + 1)}
              >
                {t.apps.uninstall}
              </Button>
              <SupportingText className="mt-2">{t.library.themePendingHint}</SupportingText>
            </div>
          )}
        </>
      ) : catalog === null ? (
        <EmptyNote busy>{t.apps.loadingStore}</EmptyNote>
      ) : (
        <EmptyNote>{catalog === 'failed' ? t.apps.storeFailed : t.library.themeNotInStore}</EmptyNote>
      )}
    </Screen>
  );
}

/** On the page of a theme installed from the store: "Opdater til …" (`top`: under its name), when the store has a newer
 * version; or "Afinstaller" (at the end), which cannot be pressed while it is in use. */
export function ThemeStoreButtons({ of, env, files, top }: { of: ThemeInfo; env: Env; files: RepoFile[]; top?: boolean }) {
  const catalog = useThemeCatalog(env);
  const actions = useThemeActions(env);
  const [, redraw] = useState(0);
  if (!of.store) return null;
  const update = themeUpdateOf(of, catalog);
  if (top)
    return update ? (
      <div className="mb-8">
        <Button
          disabled={actions.saving}
          busy={actions.busy(update.id, 'update')}
          onClick={() => actions.update(update, of.store!, legacyOf(update, themes))}
        >
          {t.apps.update(update.version)}
        </Button>
      </div>
    ) : null;
  const free = canUninstall(of.id, files) && themeInstalled(of.id);
  return (
    <div>
      <Button
        kind="outlined"
        disabled={actions.saving || !free}
        busy={actions.busy(of.id, 'uninstall')}
        onClick={async () => (await actions.uninstall(of.id, of.name)) && redraw((n) => n + 1)}
      >
        {t.apps.uninstall}
      </Button>
      <SupportingText className="mt-2">
        {!themeInstalled(of.id)
          ? t.library.themeUninstalled(of.name)
          : free
            ? t.library.themeUninstallHint
            : of.id === themeOfPack(files) && of.id !== theme.id && of.id !== chosenTheme(files)
              ? t.library.themeIconPackStuck
              : t.library.themeStuck}
      </SupportingText>
    </div>
  );
}
