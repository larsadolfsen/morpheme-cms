// What the create FAB offers: the start screen's menu (START_FAB, the collection ids) and a list's own (listFab: one
// action, or one per kind). Pure; the icons and the FAB itself are added by StartFab.tsx and ListFab.tsx.

/** The collections a new entry can be made in from the start screen, in this order: pages and blog posts. */
export const START_FAB = ['pages', 'blog'];

/** A list's create actions, as a label and where it goes: with several kinds one per kind (`#new/<id>/<kind>`), else one
 * named `create` (`#new/<id>`); none for a list that cannot make entries (no `create`). */
export function listFab(
  collection: { id: string; create?: string },
  kinds: { value: string; label: string }[],
): { label: string; href: string }[] {
  if (!collection.create) return [];
  if (kinds.length > 1) return kinds.map((k) => ({ label: k.label, href: `#new/${collection.id}/${k.value}` }));
  return [{ label: collection.create, href: `#new/${collection.id}` }];
}
