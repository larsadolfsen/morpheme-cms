// The lists an owner makes (docs/superpowers/plans/2026-11-12-new-list.md): a folder `<data>/<id>/` with one JSON file per entry and
// its definition in `<data>/<id>/_list.json` (lib/ownList.mjs). Read from the site's files, so a site without a `_list.json` gets
// nothing from here. `ownListsOf(files)` makes them as lists (OwnedList), as the standard blocks' and the apps' are.
import { ListChecks } from '@phosphor-icons/react';
import { config } from '@site/config';
import { asRowsOf, DEFINITION_FILE, fieldsOf, labelOfEntry, nameOf, parseDefinition } from '../lib/ownList.mjs';
import { t } from './i18n';
import type { Field, OwnedList } from './schema';

type Files = { path: string; text: string }[];

const own = () => t.ownList;

/** The names of the kinds, as `nameOf` (lib/ownList.mjs) numbers them. */
export const kindNames = (): Record<string, string> => {
  const say = own();
  return { icon: say.icon, title: say.title, text: say.text, image: say.image, href: say.href, tags: say.tags };
};

/** The editor's field for one of the list's fields: its name is the field's id, so a row stores its value under it. */
const fieldOf = (f: { id: string; kind: string }, label: string): Field => {
  const say = own();
  switch (f.kind) {
    case 'icon':
      return { name: f.id, label, type: 'string' };
    case 'title':
      return { name: f.id, label, type: 'string' };
    case 'text':
      return { name: f.id, label, type: 'text' };
    case 'image':
      return { name: f.id, label, type: 'image' };
    case 'href':
      return { name: f.id, label, type: 'string' };
    default:
      return {
        name: f.id,
        label,
        type: 'relation',
        to: 'categories',
        multiple: true,
        add: say.addTag,
        edit: { to: `new/${config.lists.tags}`, text: say.createTag },
      };
  }
};

/** What a new entry's file is named after: the title fields, then the body texts, else `item` (as lib/ownListSave.mjs). */
const slugFrom = (definition: Definition): string[] => {
  const fields = fieldsOf(definition) as { id: string; kind: string }[];
  return ['title', 'text'].flatMap((kind) => fields.filter((f) => f.kind === kind).map((f) => f.id));
};

type Definition = Parameters<typeof fieldsOf>[0] & { label: string };

/** One owner's list from its definition (a parsed `_list.json`) as a list the editor shows. */
export function ownListOf(id: string, definition: Definition): OwnedList {
  const say = own();
  const names = kindNames();
  return {
    kind: 'folder',
    id,
    icon: ListChecks,
    create: say.create,
    label: definition.label,
    singular: say.singular,
    folder: `${config.folders.data}/${id}`,
    deletable: true,
    orderable: true,
    slugFrom: slugFrom(definition),
    summary: (d) => labelOfEntry(definition, d) || say.singular,
    fields: fieldsOf(definition).map((f: { id: string; kind: string }) => fieldOf(f, nameOf(definition, f, names))),
    asRows: asRowsOf(definition),
  };
}

/** The lists the owner made, in the order of their folders, from the `_list.json` files; a file that does not parse is left out
 * (`check:content` stops the build on it). */
export function ownListsOf(files: Files): OwnedList[] {
  const prefix = `${config.folders.data}/`;
  return files
    .filter(
      (f) =>
        f.path.startsWith(prefix) && f.path.endsWith(`/${DEFINITION_FILE}`) && f.path.split('/').length === prefix.split('/').length + 1,
    )
    .sort((a, b) => a.path.localeCompare(b.path))
    .flatMap((f) => {
      const { definition } = parseDefinition(f.text);
      return definition ? [ownListOf(f.path.slice(prefix.length, -`/${DEFINITION_FILE}`.length), definition)] : [];
    });
}
