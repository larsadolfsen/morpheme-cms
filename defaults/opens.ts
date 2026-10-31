// What a button can open of a promotion ("Indhold" › "Promovering"), by its kind (Opens in
// packages/editor/src/schema.ts): the list's own (the pop-up opens itself; the contact bar nothing,
// FolderCollection.opens in collections.ts) and the apps' (AppKind.opens: Calendly's booking sheet itself, as
// "Book en tid" does). For a button's choices in the editor (rules.ts) and its link on the site
// (standard.ts).
import { appIdOf, type AppDefinition } from '../src/apps';
import type { FolderCollection, Opens } from '../src/schema';
import { collections } from '@site/collections';

// Only the apps' index.ts: what a button needs, without their blocks (apps.ts loads those too).
const appFiles = import.meta.glob<{ default: AppDefinition }>('/src/apps/*/index.ts', { eager: true });

/** The list's own kinds that a button can open. */
const ownOpens = (collections.find((c) => c.id === 'popups') as FolderCollection).opens ?? {};

/** What a button opens of a promotion of this kind (its `type`; without one, the pop-up), or undefined for nothing. */
export const opensOf = (kind: string | undefined): Opens | undefined =>
  ownOpens[kind || 'standard'] ?? Object.entries(appFiles).find(([path]) => appIdOf(path) === kind)?.[1].default.kinds?.popups?.opens;
