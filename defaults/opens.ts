// What a button can open of a promotion ("Content" › "Promotion"), by its kind (Opens in
// packages/editor/src/schema.ts): the list's own (the pop-up opens itself; the contact bar nothing,
// FolderCollection.opens in collections.ts) and the apps' (AppKind.opens: Calendly's booking sheet itself, as
// "Book an appointment" does), from an app's index.ts or, for a contract 4 app, its app.json (lib/appOpens.mjs).
// For a button's choices in the editor (rules.ts) and its link on the site (standard.ts).
import type { FolderCollection, Opens } from '../src/schema';
import { appFiles, appManifests } from '../src/appFiles';
import { appOpens } from '../lib/appOpens.mjs';
import { collections } from '@site/collections';

/** The list's own kinds that a button can open. */
const ownOpens = (collections.find((c) => c.id === 'popups') as FolderCollection).opens ?? {};

/** What a button opens of a promotion of this kind (its `type`; without one, the pop-up), or undefined for nothing. */
export const opensOf = (kind: string | undefined): Opens | undefined => appOpens(ownOpens, appFiles, appManifests, kind);
