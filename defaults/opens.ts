// What a button can open of a promotion ("Content" › "Promotion"), by its kind (Opens in
// packages/editor/src/schema.ts): the list's own (the pop-up opens itself; the contact bar nothing,
// FolderCollection.opens in collections.ts) and the apps' (AppKind.opens: Calendly's booking sheet itself, as
// "Book an appointment" does), from an app's index.ts or, for a contract 4 app, its app.json (lib/appOpens.mjs).
// For a button's choices in the editor (rules.ts) and its link on the site (standard.ts).
import type { AppDefinition } from '../src/apps';
import type { FolderCollection, Opens } from '../src/schema';
import { appOpens } from '../lib/appOpens.mjs';
import { collections } from '@site/collections';

// Only what a button needs, without the apps' blocks (src/appFiles.ts and apps.ts load those too): the apps' index.ts and app.json.
// The app.json glob is local, as in standard.ts (its rowLists), because standard.ts imports this file.
const appFiles = import.meta.glob<{ default: AppDefinition }>('/src/apps/*/index.ts', { eager: true });
const appManifests = import.meta.glob<{ kinds?: Record<string, unknown> }>('/src/apps/*/app.json', { eager: true, import: 'default' });

/** The list's own kinds that a button can open. */
const ownOpens = (collections.find((c) => c.id === 'popups') as FolderCollection).opens ?? {};

/** What a button opens of a promotion of this kind (its `type`; without one, the pop-up), or undefined for nothing. */
export const opensOf = (kind: string | undefined): Opens | undefined => appOpens(ownOpens, appFiles, appManifests, kind);
