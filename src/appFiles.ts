// The apps in the site (src/apps/<app>/, packages/editor/src/apps.ts: its own and those installed from the app store),
// for the editor: what it knows about each (index.ts, or app.json, editor.ts and texts.json from contract 4), where one from the store came from (store.json), what is in its
// folder (virtual:app-folders, appFoldersPlugin in packages/editor/lib/apps.mjs), its images (screenshots/), and the
// blocks it adds (blocks/<type>/index.tsx) and their shared texts
// (shared.ts); the texts of both in the editor's other languages are `appTexts` in texts.ts, apart from
// these, which load the editor's dictionaries. An app belongs to the site, not to a theme, so it stays when
// the theme is swapped.
import type { AppDefinition, AppDefinitionCode } from './apps';
import type { AppManifest } from '../lib/appManifest.mjs';
import type { BlockDefinition } from './blocks';
import type { SharedTexts } from './shared';
import type { ComponentType } from 'react';
import type { InlineViewProps } from './inlineViews';
import type { View, ViewOf } from './standard/view';
import type { StoreRecord } from './store';

export const appFiles = import.meta.glob<{ default: AppDefinition }>('/src/apps/*/index.ts', { eager: true });
/** The apps that describe themselves in an app.json (contract 4), by the path of the file: the data of their definition; with
 * their editor.ts (the code parts: `default`) and texts.json (the texts in the editor's other languages), also by path. An
 * app with an app.json is read from these, not from an index.ts (site.ts). */
export const appManifests = import.meta.glob<AppManifest>('/src/apps/*/app.json', { eager: true, import: 'default' });
export const appEditors = import.meta.glob<{ default: Partial<AppDefinitionCode> }>('/src/apps/*/editor.ts', { eager: true });
export const appTextFiles = import.meta.glob<Record<string, unknown>>('/src/apps/*/texts.json', { eager: true, import: 'default' });
/** Where the apps installed from the app store came from (store.json, written when they were installed). */
export const appStores = import.meta.glob<{ default: StoreRecord }>('/src/apps/*/store.json', { eager: true });
/** What is in each app's folder, by its id: its files and its csp.json, for what it needs (needsOf). */
export { default as appFolders } from 'virtual:app-folders';
/** The apps' images (screenshots/), by their paths: their addresses. */
export const appImages = import.meta.glob<string>('/src/apps/*/screenshots/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});
export const appBlocks = import.meta.glob<{ default: BlockDefinition }>('/src/apps/*/blocks/*/index.tsx', { eager: true });
export const appShared = import.meta.glob<{ default: SharedTexts }>('/src/apps/*/blocks/*/shared.ts', { eager: true });
/** The apps' blocks drawn from their view: their drawing (View.tsx) and what makes their view in the editor (viewOf.ts). */
export const appViews = import.meta.glob<{ default: View<any> }>('/src/apps/*/blocks/*/View.tsx', { eager: true });
export const appViewOfs = import.meta.glob<{ viewOf: ViewOf<any> }>('/src/apps/*/blocks/*/viewOf.ts', { eager: true });
/** The apps' blocks typed in place (`inline` in their index.tsx): what draws them (Inline.tsx, built on the shared parts of
 * `@morphemecms/cms/src/inline`). A block without one keeps its sheet. */
export const appInlines = import.meta.glob<{ default: ComponentType<InlineViewProps> }>('/src/apps/*/blocks/*/Inline.tsx', { eager: true });
