// Installing, updating and removing an icon pack from the store (store.ts, docs/icon-pack-contract.md), each saved at once in its own
// commit (iconPackChanges: src/icon-packs/<id>/ and its store.json), as a theme's are (useThemeActions in ThemeStore.tsx). Removing is never
// refused: a site whose chosen pack is gone draws Material Symbols (packInUse in site/iconPacks.mjs), and src/data/icons.json is left as it is,
// so installing the pack again brings it back. The editor has a pack's files at build time only, so a pack just installed is picked after the next build.
import { useState } from 'react';
import { busyFor } from './busyAction.mjs';
import { ask } from './ask';
import { ConflictError, type RepoFile } from './github';
import type { Env } from './App';
import { askUpdate } from './AppList';
import { kindAndName } from './deploy';
import { iconPacks } from './iconPacks';
import { siteT, t } from './i18n';
import { changedFiles, iconPackChanges, iconPackFolder, newer, notesSince, type ShownIconPack, type StoreRecord } from './store';

// The packs installed, updated or removed while the editor is open, by their id: 'installed', 'removed' or the version updated to,
// until the site's build has it (and the editor reloads with it).
const changed = new Map<string, string>();

/** Whether a pack is in the site now: installed and not removed since, or installed since. */
export const iconPackInstalled = (id: string) => (changed.has(id) ? changed.get(id) !== 'removed' : iconPacks.some((x) => x.id === id));

/** A pack installed from the store that the site's build does not have yet. */
export const iconPackPending = (id: string) => changed.get(id) === 'installed' && !iconPacks.some((x) => x.id === id);

/** The newer version of a pack in the store, when the store has one than the one installed (`record`: its store.json). */
export const iconPackUpdateOf = (id: string, record: StoreRecord | undefined, catalog: ShownIconPack[] | null | 'failed') => {
  const found = record && Array.isArray(catalog) ? catalog.find((c) => c.id === id) : undefined;
  const now = changed.has(id) && changed.get(id) !== 'installed' && changed.get(id) !== 'removed' ? changed.get(id)! : record?.version;
  return found && now && newer(found.version, now) ? found : undefined;
};

type PackAction = 'install' | 'update' | 'uninstall';

/** Install, update and remove, each true when it was saved. `inUse`: the id of the pack the site draws with, for the question before removing it. */
export function useIconPackActions(env: Env, inUse: () => string) {
  const [running, setRunning] = useState<{ id: string; action: PackAction; asking: boolean } | null>(null);
  const recordOf = (x: ShownIconPack): StoreRecord => ({ version: x.version, ref: x.version, files: x.files });

  async function change(
    id: string,
    action: PackAction,
    text: { busy: string; done: string; commit: string; change: string },
    next: () => Promise<Parameters<typeof iconPackChanges>[2]>,
    go: (current: RepoFile[]) => Promise<boolean> = async () => true,
  ): Promise<boolean> {
    setRunning({ id, action, asking: false });
    env.notify({ text: text.busy });
    try {
      const [current, wanted] = await Promise.all([env.folder(iconPackFolder(id)), next()]);
      if (!(await go(current))) {
        env.notify(null);
        return false;
      }
      setRunning({ id, action, asking: false });
      env.notify({ text: text.busy });
      await env.commit(text.commit, iconPackChanges(id, current, wanted), text.change);
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
    saving: !!running,
    busy: (id: string, action: PackAction) => busyFor(running, id, action),
    async install(x: ShownIconPack) {
      const done = await change(
        x.id,
        'install',
        {
          busy: t.apps.installing,
          done: t.library.iconPackInstalled(x.name),
          commit: siteT.library.iconPackStoreCommits.install(x.name),
          change: t.app.changes.installed(kindAndName(t.app.changes.iconPack, x.name)),
        },
        async () => ({ files: await env.store.files(x), record: recordOf(x) }),
      );
      if (done) changed.set(x.id, 'installed');
      return done;
    },
    async update(x: ShownIconPack, record: StoreRecord) {
      const done = await change(
        x.id,
        'update',
        {
          busy: t.apps.updating,
          done: t.library.iconPackUpdated(x.name, x.version),
          commit: siteT.library.iconPackStoreCommits.update(x.name, x.version),
          change: t.app.changes.updated(kindAndName(t.app.changes.iconPack, x.name), x.version),
        },
        async () => ({ files: await env.store.files(x), record: recordOf(x) }),
        async (current) => {
          env.notify(null);
          setRunning({ id: x.id, action: 'update', asking: true });
          return askUpdate(
            x.name,
            record.version,
            x.version,
            notesSince(x.releaseNotes, record.version, x.version),
            changedFiles(x.id, record, current, iconPackFolder(x.id)),
          );
        },
      );
      if (done) changed.set(x.id, x.version);
      return done;
    },
    async uninstall(id: string, name: string) {
      if (!(await ask(t.library.askRemoveIconPack(name, inUse() === id), t.common.remove))) return false;
      const done = await change(
        id,
        'uninstall',
        {
          busy: t.apps.uninstalling,
          done: t.library.iconPackRemoved(name),
          commit: siteT.library.iconPackStoreCommits.uninstall(name),
          change: t.app.changes.uninstalled(kindAndName(t.app.changes.iconPack, name)),
        },
        async () => null,
      );
      if (done) changed.set(id, 'removed');
      return done;
    },
  };
}
