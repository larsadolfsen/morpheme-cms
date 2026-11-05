// "Udtalelser", the list the standard block brings: one file per testimonial in the site's data
// (<config.folders.data>/testimonials/<slug>.json), under "Lister" on every site, in their order (the arrows), each
// with its picture (optional, round by the name), its tags (the relation `categories`) and whether it is marked "Vis
// på forsiden" (the block's "Hvilke udtalelser"). The site reads them for its pages (StandardSite.testimonials, the
// site's packages/editor/site/testimonials.ts).
// Made with the texts of a language: the editor's for the screens, the site's (siteT) for the commits (site.ts).
import { Quotes } from '@phosphor-icons/react';
import { config } from '@site/config';
import type { Messages } from '../../i18n';
import type { OwnedList } from '../../schema';

export default function testimonialsList(say: Messages): OwnedList {
  const own = say.blocks.testimonials;
  return {
    kind: 'folder',
    id: config.lists.testimonials,
    icon: Quotes,
    create: own.entries.create,
    label: own.entries.label,
    singular: own.entries.singular,
    folder: `${config.folders.data}/testimonials`,
    deletable: true,
    orderable: true,
    slugFrom: 'name',
    summary: (d) => String(d.name ?? ''),
    fields: [
      { name: 'name', label: own.entries.name, type: 'string', required: true },
      { name: 'image', label: own.entries.image, type: 'image' },
      { name: 'context', label: own.entries.context, type: 'text' },
      { name: 'quote', label: own.entries.quote, type: 'text', required: true },
      {
        name: 'categories',
        label: own.tags,
        type: 'relation',
        to: 'categories',
        multiple: true,
        add: own.addTag,
        edit: { to: `new/${config.lists.tags}`, text: own.entries.createTag },
      },
      { name: 'frontPage', label: own.entries.frontPage, type: 'boolean', default: true },
    ],
  };
}
