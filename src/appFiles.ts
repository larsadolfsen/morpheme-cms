// The apps in the site (src/apps/<app>/, packages/editor/src/apps.ts: its own and those installed from the app store),
// for the editor: what it knows about each (index.ts), where one from the store came from (store.json), what is in its
// folder (virtual:app-folders, appFoldersPlugin in packages/editor/lib/apps.mjs), its pictures (screenshots/), and the
// blocks it adds (blocks/<type>/index.tsx) and their shared texts
// (shared.ts); the texts of both in the editor's other languages are `appTexts` in texts.ts, apart from
// these, which load the editor's dictionaries. An app belongs to the site, not to a theme, so it stays when
// the theme is swapped.
import type { AppDefinition } from './apps';
import type { BlockDefinition } from './blocks';
import type { SharedTexts } from './shared';
import type { View, ViewOf } from './standard/view';
import type { StoreRecord } from './store';

export const appFiles = import.meta.glob<{ default: AppDefinition }>('/src/apps/*/index.ts', { eager: true });
/** Where the apps installed from the app store came from (store.json, written when they were installed). */
export const appStores = import.meta.glob<{ default: StoreRecord }>('/src/apps/*/store.json', { eager: true });
/** What is in each app's folder, by its id: its files and its csp.json, for what it needs (needsOf). */
export { default as appFolders } from 'virtual:app-folders';
/** The apps' pictures (screenshots/), by their paths: their addresses. */
export const appPictures = import.meta.glob<string>('/src/apps/*/screenshots/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});
export const appBlocks = import.meta.glob<{ default: BlockDefinition }>('/src/apps/*/blocks/*/index.tsx', { eager: true });
export const appShared = import.meta.glob<{ default: SharedTexts }>('/src/apps/*/blocks/*/shared.ts', { eager: true });
/** The apps' blocks drawn from their view: their drawing (View.tsx) and what makes their view in the editor (view.ts). */
export const appViews = import.meta.glob<{ default: View<any> }>('/src/apps/*/blocks/*/View.tsx', { eager: true });
export const appViewOfs = import.meta.glob<{ viewOf: ViewOf<any> }>('/src/apps/*/blocks/*/view.ts', { eager: true });
