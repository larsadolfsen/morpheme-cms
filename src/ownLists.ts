// The lists an owner makes (docs/superpowers/plans/2026-11-12-new-list.md): a folder `<data>/<id>/` with one JSON file per entry and
// its definition in `<data>/<id>/_list.json` (lib/ownList.mjs). Read from the site's files, so a site without a `_list.json` gets
// nothing from here. `ownListsOf(files)` makes them as lists (OwnedList), as the standard blocks' and the apps' are.
import { ListChecks } from '@phosphor-icons/react';
import { config } from '@site/config';
import { asRowsOf, DEFINITION_FILE, fieldsOf, parseDefinition } from '../lib/ownList.mjs';
import { t } from './i18n';
import type { Field, OwnedList } from './schema';

type Files = { path: string; text: string }[];

const own = () => t.ownList;

const fieldOf = (id: string): Field => {
  const say = own();
  switch (id) {
    case 'icon':
      return { name: 'icon', label: say.icon, type: 'string' };
    case 'title':
      return { name: 'title', label: say.title, type: 'string', required: true };
    case 'text':
      return { name: 'text', label: say.text, type: 'text' };
    case 'image':
      return { name: 'image', label: say.image, type: 'image' };
    case 'href':
      return { name: 'href', label: say.href, type: 'string' };
    default:
      return {
        name: 'tags',
        label: say.tags,
        type: 'relation',
        to: 'categories',
        multiple: true,
        add: say.addTag,
        edit: { to: `new/${config.lists.tags}`, text: say.createTag },
      };
  }
};

/** One owner's list from its definition (a parsed `_list.json`) as a list the editor shows. */
export function ownListOf(id: string, definition: { label: string; fields: string[]; dropped?: string[] }): OwnedList {
  const say = own();
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
    slugFrom: 'title',
    summary: (d) => String(d.title ?? ''),
    fields: fieldsOf(definition as Parameters<typeof fieldsOf>[0]).map((f) => fieldOf(f.id)),
    asRows: asRowsOf(definition as Parameters<typeof asRowsOf>[0]),
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
